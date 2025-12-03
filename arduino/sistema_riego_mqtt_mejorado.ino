/*
 * Sistema de Riego IoT Completo - VERSIÓN MEJORADA
 * Hardware: Arduino UNO R4 WiFi
 * Sensores: DHT11 (temperatura/humedad aire), Sensor de agua
 * Actuador: Relé para bomba de agua
 * Display: LCD I2C 16x2
 * Control: Botón para cambiar pantallas LCD
 * Conectividad: MQTT SSL/TLS con EMQX Serverless
 * 
 * NUEVAS CARACTERÍSTICAS:
 * ✅ Configuración remota de umbrales de humedad
 * ✅ Duración automática de riego con timer
 * ✅ Modo emergencia para detener todo
 * ✅ Confirmación de estado al servidor
 * ✅ Reinicialización mejorada del LCD
 */

#include <WiFiS3.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include "Arduino_LED_Matrix.h"
#include <Wire.h>
#include <LiquidCrystal_I2C.h>
#include "DHT.h"

// ============================================
// 1. CONFIGURACIÓN WIFI
// ============================================
const char* WIFI_SSID = "iPhone de Nadia";
const char* WIFI_PASSWORD = "yoongi27";

// ============================================
// 2. CONFIGURACIÓN MQTT (EMQX SERVERLESS)
// ============================================
const char* MQTT_BROKER = "m0020126.ala.eu-central-1.emqxsl.com";
const int MQTT_PORT = 8883;  // Puerto Seguro SSL
const char* MQTT_USER = "riegoTeam";
const char* MQTT_PASSWORD = "Cu7WhT6gnZfZgz8";

// ============================================
// 3. IDENTIFICACIÓN DEL DISPOSITIVO
// ============================================
const char* API_KEY = "arduino_riego_01";

// ============================================
// 4. CONFIGURACIÓN HARDWARE - PINES
// ============================================
const int PIN_AGUA   = A2;    // Sensor de Nivel de Agua
const int PIN_RELAY  = 7;     // Relé de la bomba
const int PIN_BTN    = 8;     // Botón (entre D8 y GND)
#define DHTPIN 2              // DHT11 en D2
#define DHTTYPE DHT11

// ============================================
// 5. PARÁMETROS DE RIEGO AUTOMÁTICO (CONFIGURABLES)
// ============================================
float HUM_ON   = 55.0;   // Encender bomba si humedad < 55%
float HUM_OFF  = 70.0;   // Apagar bomba si humedad > 70%
unsigned long DURACION_RIEGO_MS = 0;  // 0 = sin límite de tiempo

// Parámetros sensor de agua
const int WATER_MIN = 100;
const int WATER_MAX = 600;
const int WATER_NIVEL_MINIMO = 20;

// ============================================
// 6. INTERVALOS DE COMUNICACIÓN
// ============================================
const unsigned long INTERVALO_SENSORES = 5000;   // Enviar datos cada 5s
const unsigned long INTERVALO_PING = 30000;      // Ping cada 30s
const unsigned long INTERVALO_LCD = 500;         // Actualizar LCD cada 500ms

// ============================================
// 7. OBJETOS GLOBALES
// ============================================
WiFiSSLClient wifiClient;
PubSubClient mqttClient(wifiClient);
ArduinoLEDMatrix matrix;
DHT dht(DHTPIN, DHTTYPE);
LiquidCrystal_I2C lcd(0x27, 16, 2);

// ============================================
// 8. VARIABLES DE ESTADO
// ============================================
bool pumpOn = false;
bool modoRemoto = false;
unsigned long tiempoInicio Riego = 0;  // Timestamp cuando se encendió bomba
byte pantallaActual = 0;
const byte NUM_PANTALLAS = 4;
int lastBtnState = HIGH;

unsigned long ultimoEnvioSensores = 0;
unsigned long ultimoPing = 0;
unsigned long ultimoUpdateLCD = 0;

float ultimaTempDHT = 0.0;
float ultimaHumDHT = 0.0;
int ultimoNivelAgua = 0;

char topicSensores[150];
char topicComandos[150];
char topicComandosAll[150];
char topicPing[150];
char topicEventos[150];

const uint32_t LED_WIFI[] = {0x0, 0x1f1f1f, 0x0};
const uint32_t LED_MQTT[] = {0x1041041, 0x4104104, 0x10410410};
const uint32_t LED_ERROR[] = {0x1b1b1b0, 0xc060301, 0x80c0600};
const uint32_t LED_OK[] = {0x0, 0xe0a0e, 0x0};

// ============================================
// FUNCIÓN PARA REINICIAR LCD
// ============================================
void reiniciarLCD() {
  lcd.init();
  lcd.backlight();
  delay(100);
}

// ============================================
// FUNCIONES DE CONTROL DE BOMBA CON CONFIRMACIÓN
// ============================================
void enviarConfirmacionEstado() {
  if (!mqttClient.connected()) return;

  StaticJsonDocument<128> doc;
  doc["pin"] = "7";
  doc["tipo"] = "bomba";
  doc["estado"] = pumpOn ? 1 : 0;
  doc["modo"] = modoRemoto ? "remoto" : "automatico";

  char buffer[128];
  serializeJson(doc, buffer);
  
  mqttClient.publish(topicEventos, buffer);
  Serial.println("📤 Confirmación de estado enviada");
}

void aplicarEstadoBomba() {
  digitalWrite(PIN_RELAY, pumpOn ? HIGH : LOW);
  digitalWrite(LED_BUILTIN, pumpOn ? HIGH : LOW);
  
  delay(50);
  reiniciarLCD();
  
  Serial.print("🔌 Relé D7 = ");
  Serial.print(pumpOn ? "HIGH (ON)" : "LOW (OFF)");
  Serial.print(" | Bomba: ");
  Serial.println(pumpOn ? "DANDO AGUA ✅" : "APAGADA ❌");
  
  // Enviar confirmación al servidor
  enviarConfirmacionEstado();
}

void encenderBomba(const char* motivo) {
  if (!pumpOn) {
    pumpOn = true;
    tiempoInicioRiego = millis();
    aplicarEstadoBomba();
    Serial.print("🚰 Bomba ENCENDIDA - ");
    Serial.println(motivo);
  }
}

void apagarBomba(const char* motivo) {
  if (pumpOn) {
    pumpOn = false;
    tiempoInicioRiego = 0;
    aplicarEstadoBomba();
    Serial.print("🛑 Bomba APAGADA - ");
    Serial.println(motivo);
  }
}

// ============================================
// VERIFICAR LÍMITE DE TIEMPO DE RIEGO
// ============================================
void verificarDuracionRiego() {
  if (!pumpOn || DURACION_RIEGO_MS == 0) return;
  
  unsigned long tiempoTranscurrido = millis() - tiempoInicioRiego;
  
  if (tiempoTranscurrido >= DURACION_RIEGO_MS) {
    apagarBomba("Tiempo límite alcanzado");
    Serial.print("⏱️ Riego automático detenido después de ");
    Serial.print(DURACION_RIEGO_MS / 60000);
    Serial.println(" minutos");
  }
}

// ============================================
// LECTURA DE SENSORES (sin cambios)
// ============================================
int leerNivelAgua() {
  int raw = analogRead(PIN_AGUA);
  int nivel = map(raw, WATER_MIN, WATER_MAX, 0, 100);
  nivel = constrain(nivel, 0, 100);
  return nivel;
}

void leerSensores() {
  delay(100);
  
  float tempActual = dht.readHumidity();
  float humActual = dht.readTemperature();
  
  if (!isnan(tempActual) && !isnan(humActual)) {
    ultimaTempDHT = humActual;
    ultimaHumDHT = tempActual;
    
    Serial.print("📊 DHT11 OK - T:");
    Serial.print(ultimaTempDHT, 1);
    Serial.print("°C H:");
    Serial.print(ultimaHumDHT, 0);
    Serial.print("%");
  } else {
    Serial.print("⚠️ Error DHT11 - Usando últimos valores: T:");
    Serial.print(ultimaTempDHT, 1);
    Serial.print("°C H:");
    Serial.print(ultimaHumDHT, 0);
    Serial.print("%");
  }
  
  ultimoNivelAgua = leerNivelAgua();
  Serial.print(" | Agua:");
  Serial.print(ultimoNivelAgua);
  Serial.println("%");
}

// ============================================
// CONTROL AUTOMÁTICO CON UMBRALES CONFIGURABLES
// ============================================
void controlAutomatico() {
  if (modoRemoto) {
    Serial.println("⏸️ Modo REMOTO activo - Control automático deshabilitado");
    return;
  }

  if (isnan(ultimaHumDHT) || isnan(ultimaTempDHT)) {
    Serial.println("⚠️ Sin lecturas válidas - Control automático en espera");
    return;
  }

  if (!pumpOn && ultimaHumDHT < HUM_ON && ultimoNivelAgua > WATER_NIVEL_MINIMO) {
    Serial.print("🌡️ Humedad ");
    Serial.print(ultimaHumDHT, 0);
    Serial.print("% < ");
    Serial.print(HUM_ON, 0);
    Serial.print("% → ");
    encenderBomba("Auto: Seco");
  }
  else if (pumpOn && (ultimaHumDHT > HUM_OFF || ultimoNivelAgua <= WATER_NIVEL_MINIMO)) {
    if (ultimaHumDHT > HUM_OFF) {
      Serial.print("🌡️ Humedad ");
      Serial.print(ultimaHumDHT, 0);
      Serial.print("% > ");
      Serial.print(HUM_OFF, 0);
      Serial.print("% → ");
      apagarBomba("Auto: Humedad OK");
    } else {
      apagarBomba("Auto: Sin agua");
    }
  }
}

// ============================================
// GESTIÓN DE BOTÓN Y PANTALLAS LCD (sin cambios)
// ============================================
void gestionarBoton() {
  int btnState = digitalRead(PIN_BTN);

  if (btnState == LOW && lastBtnState == HIGH) {
    pantallaActual++;
    if (pantallaActual >= NUM_PANTALLAS) {
      pantallaActual = 0;
    }
    Serial.print("📺 Pantalla: ");
    Serial.println(pantallaActual);
    
    reiniciarLCD();
    delay(200);
  }
  lastBtnState = btnState;
}

void actualizarLCD() {
  static unsigned long ultimoReinicio = 0;
  static unsigned long ultimaActualizacion = 0;
  
  unsigned long ahora = millis();
  if (ahora - ultimaActualizacion < 400) {
    return;
  }
  ultimaActualizacion = ahora;
  
  if (ahora - ultimoReinicio > 60000) {
    reiniciarLCD();
    ultimoReinicio = ahora;
  }
  
  lcd.clear();
  delay(10);

  switch (pantallaActual) {
    case 0:  // DHT11
      lcd.setCursor(0, 0);
      delay(2);
      lcd.print("T:");
      if (!isnan(ultimaTempDHT) && ultimaTempDHT > 0 && ultimaTempDHT < 100) {
        lcd.print(ultimaTempDHT, 1);
      } else {
        lcd.print("--");
      }
      lcd.print("C H:");
      if (!isnan(ultimaHumDHT) && ultimaHumDHT >= 0 && ultimaHumDHT <= 100) {
        lcd.print(ultimaHumDHT, 0);
      } else {
        lcd.print("--");
      }
      lcd.print("%");
      
      lcd.setCursor(0, 1);
      delay(2);
      lcd.print("Modo:");
      lcd.print(modoRemoto ? "REMOTO" : "AUTO  ");
      break;

    case 1:  // Nivel agua
      lcd.setCursor(0, 0);
      delay(2);
      lcd.print("Nivel agua:");
      
      lcd.setCursor(0, 1);
      delay(2);
      lcd.print(ultimoNivelAgua);
      lcd.print(" %");
      if (ultimoNivelAgua <= WATER_NIVEL_MINIMO) {
        lcd.print(" BAJO!");
      }
      break;

    case 2:  // Estado bomba
      lcd.setCursor(0, 0);
      delay(2);
      lcd.print("Bomba:");
      lcd.print(pumpOn ? "ON " : "OFF");
      
      lcd.setCursor(0, 1);
      delay(2);
      lcd.print("T:");
      if (!isnan(ultimaTempDHT) && ultimaTempDHT > 0) {
        lcd.print(ultimaTempDHT, 0);
      } else {
        lcd.print("--");
      }
      lcd.print("C H:");
      if (!isnan(ultimaHumDHT) && ultimaHumDHT >= 0) {
        lcd.print(ultimaHumDHT, 0);
      } else {
        lcd.print("--");
      }
      lcd.print("%");
      break;

    case 3:  // Estado red + umbrales
      lcd.setCursor(0, 0);
      delay(2);
      lcd.print(WiFi.status() == WL_CONNECTED ? "WiFi: OK" : "WiFi: ERROR");
      
      lcd.setCursor(0, 1);
      delay(2);
      lcd.print(mqttClient.connected() ? "MQTT: OK" : "MQTT: ERROR");
      break;
  }
}

// ============================================
// CONEXIÓN WIFI (sin cambios)
// ============================================
void conectarWiFi() {
  Serial.print("📡 Conectando WiFi: ");
  Serial.println(WIFI_SSID);

  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Conectando WiFi");

  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  int intentos = 0;
  while (WiFi.status() != WL_CONNECTED && intentos < 20) {
    delay(500);
    Serial.print(".");
    lcd.setCursor(intentos % 16, 1);
    lcd.print(".");
    intentos++;
  }
  Serial.println();

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("✅ WiFi Conectado");
    Serial.print("   IP: ");
    Serial.println(WiFi.localIP());
    
    lcd.clear();
    lcd.setCursor(0, 0);
    lcd.print("WiFi OK");
    lcd.setCursor(0, 1);
    lcd.print(WiFi.localIP());
    
    matrix.loadFrame(LED_WIFI);
    delay(2000);
  } else {
    Serial.println("❌ Error WiFi");
    lcd.clear();
    lcd.setCursor(0, 0);
    lcd.print("WiFi ERROR");
    matrix.loadFrame(LED_ERROR);
    delay(2000);
  }
}

// ============================================
// CONEXIÓN MQTT (sin cambios)
// ============================================
void conectarMQTT() {
  if (WiFi.status() != WL_CONNECTED) return;

  Serial.print("🔌 Conectando MQTT SSL... ");
  
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Conectando MQTT");

  String clientId = "arduino_r4_" + String(random(0xffff), HEX);

  if (mqttClient.connect(clientId.c_str(), MQTT_USER, MQTT_PASSWORD)) {
    Serial.println("✅ Conectado!");

    mqttClient.subscribe(topicComandos);
    mqttClient.subscribe(topicComandosAll);
    Serial.println("   Suscrito a comandos");

    lcd.clear();
    lcd.setCursor(0, 0);
    lcd.print("MQTT OK");
    lcd.setCursor(0, 1);
    lcd.print("Sistema listo");

    matrix.loadFrame(LED_OK);
    delay(2000);

    enviarPing();
  } else {
    Serial.print("❌ Fallo, rc=");
    Serial.println(mqttClient.state());
    
    lcd.clear();
    lcd.setCursor(0, 0);
    lcd.print("MQTT ERROR");
    lcd.setCursor(0, 1);
    lcd.print("Reintentando...");
    
    delay(5000);
  }
}

// ============================================
// ENVÍO DE DATOS A MQTT (sin cambios)
// ============================================
void enviarDatosSensores() {
  if (!mqttClient.connected()) return;

  StaticJsonDocument<512> doc;
  JsonArray sensores = doc.createNestedArray("sensores");

  if (!isnan(ultimaTempDHT)) {
    JsonObject sensor1 = sensores.createNestedObject();
    sensor1["pin"] = "D2";
    sensor1["tipo"] = "temperatura";
    sensor1["valor"] = ultimaTempDHT;
  }

  if (!isnan(ultimaHumDHT)) {
    JsonObject sensor2 = sensores.createNestedObject();
    sensor2["pin"] = "D2";
    sensor2["tipo"] = "humedad_ambiente";
    sensor2["valor"] = ultimaHumDHT;
  }

  JsonObject sensor3 = sensores.createNestedObject();
  sensor3["pin"] = "A2";
  sensor3["tipo"] = "nivel_agua";
  sensor3["valor"] = ultimoNivelAgua;

  char buffer[512];
  serializeJson(doc, buffer);

  if (mqttClient.publish(topicSensores, buffer)) {
    Serial.println("📤 Datos enviados a MQTT");
  }
}

void enviarPing() {
  if (!mqttClient.connected()) return;

  StaticJsonDocument<256> doc;
  doc["status"] = "online";
  doc["rssi"] = WiFi.RSSI();
  doc["bomba_estado"] = pumpOn;
  doc["modo"] = modoRemoto ? "remoto" : "automatico";
  doc["temp_aire"] = ultimaTempDHT;
  doc["humedad_aire"] = ultimaHumDHT;
  doc["nivel_agua"] = ultimoNivelAgua;
  doc["umbral_min"] = HUM_ON;
  doc["umbral_max"] = HUM_OFF;

  char buffer[256];
  serializeJson(doc, buffer);
  
  if (mqttClient.publish(topicPing, buffer)) {
    Serial.println("💓 Ping enviado");
  }
}

// ============================================
// CALLBACK MQTT - RECEPCIÓN DE COMANDOS MEJORADO
// ============================================
void callbackMQTT(char* topic, byte* payload, unsigned int length) {
  Serial.print("📥 Comando recibido en: ");
  Serial.println(topic);

  StaticJsonDocument<512> doc;
  DeserializationError error = deserializeJson(doc, payload, length);

  if (error) {
    Serial.println("❌ Error parseando JSON");
    return;
  }

  // ⭐ NUEVA CARACTERÍSTICA: Configuración remota de umbrales
  if (doc.containsKey("configuracion")) {
    JsonObject config = doc["configuracion"];
    if (config.containsKey("humedad_min") && config.containsKey("humedad_max")) {
      float newMin = config["humedad_min"];
      float newMax = config["humedad_max"];
      
      if (newMin >= 0 && newMin <= 100 && newMax >= 0 && newMax <= 100 && newMin < newMax) {
        HUM_ON = newMin;
        HUM_OFF = newMax;
        
        Serial.print("⚙️ Umbrales actualizados remotamente: ");
        Serial.print(HUM_ON, 0);
        Serial.print("% - ");
        Serial.print(HUM_OFF, 0);
        Serial.println("%");
        
        lcd.clear();
        lcd.setCursor(0, 0);
        lcd.print("Config remota");
        lcd.setCursor(0, 1);
        lcd.print(HUM_ON, 0);
        lcd.print("% - ");
        lcd.print(HUM_OFF, 0);
        lcd.print("%");
        delay(2000);
        
        // Enviar confirmación
        enviarConfirmacionEstado();
      }
    }
    
    // Configurar duración de riego
    if (config.containsKey("duracion_minutos")) {
      int duracionMin = config["duracion_minutos"];
      DURACION_RIEGO_MS = duracionMin * 60000UL;
      
      Serial.print("⏱️ Duración de riego configurada: ");
      Serial.print(duracionMin);
      Serial.println(" minutos");
    }
  }

  // Control de actuador (bomba)
  if (doc.containsKey("pin")) {
    const char* pin = doc["pin"];
    int estado = doc["estado"];

    if (String(pin) == "7" || String(pin) == "D7") {
      modoRemoto = true;
      
      if (estado == 1) {
        encenderBomba("Control remoto");
      } else {
        apagarBomba("Control remoto");
      }
    }
  }

  // Comando para cambiar modo
  if (doc.containsKey("modo")) {
    const char* modo = doc["modo"];
    if (strcmp(modo, "automatico") == 0) {
      modoRemoto = false;
      Serial.println("🤖 Modo AUTOMÁTICO activado");
      lcd.clear();
      lcd.setCursor(0, 0);
      lcd.print("Modo: AUTO");
      delay(1500);
    } else if (strcmp(modo, "remoto") == 0) {
      modoRemoto = true;
      Serial.println("📱 Modo REMOTO activado");
      lcd.clear();
      lcd.setCursor(0, 0);
      lcd.print("Modo: REMOTO");
      delay(1500);
    } else if (strcmp(modo, "emergencia") == 0) {
      // Modo emergencia: Apagar todo inmediatamente
      apagarBomba("EMERGENCIA");
      modoRemoto = true;
      Serial.println("🚨 MODO EMERGENCIA - Todo detenido");
      lcd.clear();
      lcd.setCursor(0, 0);
      lcd.print("EMERGENCIA");
      lcd.setCursor(0, 1);
      lcd.print("Sistema detenido");
      delay(3000);
    }
  }
}

// ============================================
// SETUP
// ============================================
void setup() {
  Serial.begin(115200);
  while (!Serial && millis() < 5000);

  Serial.println("\n========================================");
  Serial.println("  Sistema de Riego IoT - MEJORADO");
  Serial.println("  + Configuración remota");
  Serial.println("  + Duración automática");
  Serial.println("  + Modo emergencia");
  Serial.println("========================================\n");

  matrix.begin();
  
  Wire.begin();
  lcd.init();
  lcd.backlight();
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Sistema Riego");
  lcd.setCursor(0, 1);
  lcd.print("Iniciando...");
  delay(1000);

  pinMode(PIN_RELAY, OUTPUT);
  pinMode(LED_BUILTIN, OUTPUT);
  pinMode(PIN_BTN, INPUT_PULLUP);

  pumpOn = false;
  digitalWrite(PIN_RELAY, LOW);
  Serial.println("✅ Relé inicializado en LOW (apagado)");

  Serial.println("Iniciando DHT11...");
  lcd.setCursor(0, 1);
  lcd.print("Esperando DHT..");
  dht.begin();
  delay(2000);
  Serial.println("✅ DHT11 listo");

  sprintf(topicSensores, "riego/%s/sensores", API_KEY);
  sprintf(topicComandos, "riego/%s/comandos", API_KEY);
  sprintf(topicComandosAll, "riego/%s/comandos/all", API_KEY);
  sprintf(topicPing, "riego/%s/ping", API_KEY);
  sprintf(topicEventos, "riego/%s/eventos", API_KEY);

  conectarWiFi();

  mqttClient.setServer(MQTT_BROKER, MQTT_PORT);
  mqttClient.setCallback(callbackMQTT);
  mqttClient.setBufferSize(512);

  conectarMQTT();

  Serial.println("Leyendo sensores iniciales...");
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Leyendo sensores");
  
  bool sensorOK = false;
  for (int i = 0; i < 5; i++) {
    leerSensores();
    
    if (!isnan(ultimaHumDHT) && !isnan(ultimaTempDHT) && ultimaTempDHT > 0) {
      sensorOK = true;
      Serial.println("✅ Sensores inicializados correctamente");
      break;
    }
    
    Serial.print("⚠️ Intento ");
    Serial.print(i + 1);
    Serial.println("/5 - Reintentando...");
    lcd.setCursor(0, 1);
    lcd.print("Intento ");
    lcd.print(i + 1);
    lcd.print("/5    ");
    delay(2000);
  }

  if (sensorOK) {
    controlAutomatico();
  }

  delay(2000);
  reiniciarLCD();
  
  Serial.println("\n========================================");
  Serial.println("  Sistema listo - Loop iniciado");
  Serial.println("========================================\n");
}

// ============================================
// LOOP PRINCIPAL
// ============================================
void loop() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("⚠️ WiFi desconectado - Reconectando...");
    conectarWiFi();
  }

  if (!mqttClient.connected()) {
    Serial.println("⚠️ MQTT desconectado - Reconectando...");
    conectarMQTT();
  }

  mqttClient.loop();

  unsigned long ahora = millis();

  gestionarBoton();

  // ⭐ VERIFICAR DURACIÓN DE RIEGO
  verificarDuracionRiego();

  if (ahora - ultimoEnvioSensores >= INTERVALO_SENSORES) {
    ultimoEnvioSensores = ahora;
    
    Serial.println("\n--- Ciclo de lectura ---");
    leerSensores();
    controlAutomatico();
    enviarDatosSensores();
    Serial.println("------------------------\n");
  }

  if (ahora - ultimoPing >= INTERVALO_PING) {
    ultimoPing = ahora;
    enviarPing();
  }

  if (ahora - ultimoUpdateLCD >= INTERVALO_LCD) {
    ultimoUpdateLCD = ahora;
    actualizarLCD();
  }

  delay(50);
}
