/*
 * Sistema de Riego IoT con AUTO-SINCRONIZACIÓN
 * Hardware: Arduino UNO R4 WiFi
 * Sensores: DHT11 (temperatura/humedad aire), Sensor de agua
 * Actuador: Relé para bomba de agua
 * Display: LCD I2C 16x2
 * Control: Botón cambiar pantallas + Botón manual bomba
 * Conectividad: MQTT SSL/TLS con EMQX Serverless
 * 
 * NUEVA FUNCIONALIDAD:
 * ✅ AUTO-SINCRONIZACIÓN: Solo necesitas API_KEY y WiFi
 * ✅ Obtiene IDs de sensores/actuadores automáticamente
 * ✅ Recibe umbrales configurados desde web
 * ✅ Actualiza configuración sin re-flashear
 * ✅ Sin duplicados en base de datos
 */

#include <WiFiS3.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include "Arduino_LED_Matrix.h"
#include <Wire.h>
#include <LiquidCrystal_I2C.h>
#include "DHT.h"
#include <WiFiSSLClient.h>

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
// 3. CONFIGURACIÓN SERVIDOR HTTP
// ============================================
const char* HTTP_SERVER = "tu-servidor.com";  // Cambiar por tu dominio/IP
const int HTTP_PORT = 3000;
const char* API_KEY = "eb9d9266f75eec7ab0ed643818259a3edf4e39c255c82be804bed2463ec542e9";

// ============================================
// 4. CONFIGURACIÓN HARDWARE - PINES
// ============================================
const int PIN_AGUA   = A2;
const int PIN_RELAY  = 7;
const int PIN_BTN    = 8;
const int PIN_BTN_BOMBA = 6;
#define DHTPIN 2
#define DHTTYPE DHT11

// ============================================
// 5. IDs AUTO-SINCRONIZADOS (se cargan del servidor)
// ============================================
int sensor_temp_id = 0;      // ✅ Se carga automáticamente
int sensor_hum_id = 0;       // ✅ Se carga automáticamente
int sensor_agua_id = 0;      // ✅ Se carga automáticamente
int actuador_bomba_id = 0;   // ✅ Se carga automáticamente

// ============================================
// 6. PARÁMETROS DE RIEGO (se cargan del servidor)
// ============================================
float HUM_ON   = 55.0;       // ✅ Se actualiza desde web
float HUM_OFF  = 70.0;       // ✅ Se actualiza desde web

// Parámetros sensor de agua
const int WATER_MIN = 100;
const int WATER_MAX = 600;
const int WATER_NIVEL_MINIMO = 20;

// ============================================
// 7. INTERVALOS DE COMUNICACIÓN
// ============================================
const unsigned long INTERVALO_SENSORES = 5000;
const unsigned long INTERVALO_PING = 30000;
const unsigned long INTERVALO_LCD = 500;
const unsigned long INTERVALO_SYNC = 300000;  // Re-sincronizar cada 5 minutos

// ============================================
// 8. OBJETOS GLOBALES
// ============================================
WiFiSSLClient wifiClient;
PubSubClient mqttClient(wifiClient);
ArduinoLEDMatrix matrix;
DHT dht(DHTPIN, DHTTYPE);
LiquidCrystal_I2C lcd(0x27, 16, 2);

// ============================================
// 9. VARIABLES DE ESTADO
// ============================================
bool pumpOn = false;
bool modoRemoto = false;
bool modoManualLocal = false;
bool sincronizado = false;  // ✅ Indica si se obtuvo configuración del servidor
byte pantallaActual = 0;
const byte NUM_PANTALLAS = 4;
int lastBtnState = HIGH;
int lastBtnBombaState = HIGH;

unsigned long ultimoEnvioSensores = 0;
unsigned long ultimoPing = 0;
unsigned long ultimoUpdateLCD = 0;
unsigned long ultimaSync = 0;

// Variables para almacenar últimas lecturas válidas
float ultimaTempDHT = 0.0;
float ultimaHumDHT = 0.0;
int ultimoNivelAgua = 0;

// Tópicos MQTT
char topicSensores[150];
char topicComandos[150];
char topicComandosAll[150];
char topicPing[150];

// Patrones LED
const uint32_t LED_WIFI[] = {0x0, 0x1f1f1f, 0x0};
const uint32_t LED_MQTT[] = {0x1041041, 0x4104104, 0x10410410};
const uint32_t LED_ERROR[] = {0x1b1b1b0, 0xc060301, 0x80c0600};
const uint32_t LED_OK[] = {0x0, 0xe0a0e, 0x0};
const uint32_t LED_SYNC[] = {0x1f0, 0xe0e0e, 0x1f0};

// ============================================
// FUNCIÓN DE AUTO-SINCRONIZACIÓN CON SERVIDOR
// ============================================
bool sincronizarConServidor() {
  Serial.println("\n========================================");
  Serial.println("  SINCRONIZANDO CON SERVIDOR");
  Serial.println("========================================");
  
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Sincronizando...");
  matrix.loadFrame(LED_SYNC);

  WiFiClient httpClient;
  
  if (!httpClient.connect(HTTP_SERVER, HTTP_PORT)) {
    Serial.println("❌ Error: No se pudo conectar al servidor");
    lcd.setCursor(0, 1);
    lcd.print("Error conexion");
    delay(2000);
    return false;
  }

  // Construir petición HTTP GET
  String url = "/api/arduino/sync";
  httpClient.print(String("GET ") + url + " HTTP/1.1\r\n" +
                   "Host: " + HTTP_SERVER + "\r\n" +
                   "X-API-Key: " + API_KEY + "\r\n" +
                   "Connection: close\r\n\r\n");

  // Esperar respuesta
  unsigned long timeout = millis();
  while (httpClient.available() == 0) {
    if (millis() - timeout > 5000) {
      Serial.println("❌ Timeout esperando respuesta");
      httpClient.stop();
      return false;
    }
  }

  // Leer respuesta HTTP
  bool headersEnded = false;
  String jsonResponse = "";
  
  while (httpClient.available()) {
    String line = httpClient.readStringUntil('\n');
    
    if (line == "\r") {
      headersEnded = true;
      continue;
    }
    
    if (headersEnded) {
      jsonResponse += line;
    }
  }
  
  httpClient.stop();

  // Parsear JSON
  StaticJsonDocument<1024> doc;
  DeserializationError error = deserializeJson(doc, jsonResponse);

  if (error) {
    Serial.print("❌ Error parseando JSON: ");
    Serial.println(error.c_str());
    Serial.println("Respuesta recibida:");
    Serial.println(jsonResponse);
    return false;
  }

  if (!doc["success"]) {
    Serial.println("❌ Error en sincronización");
    return false;
  }

  // ✅ EXTRAER IDs DE SENSORES
  JsonObject sensores = doc["sensores"];
  
  // Sensor temperatura (DHT11 en D2)
  if (sensores.containsKey("D2_temperatura") || sensores.containsKey("2_temperatura")) {
    JsonObject sensorTemp = sensores.containsKey("D2_temperatura") ? 
                            sensores["D2_temperatura"] : sensores["2_temperatura"];
    sensor_temp_id = sensorTemp["sensor_id"];
    Serial.print("✅ Sensor Temperatura ID: ");
    Serial.println(sensor_temp_id);
  }

  // Sensor humedad ambiente (DHT11 en D2)
  if (sensores.containsKey("D2_humedad_ambiente") || sensores.containsKey("2_humedad_ambiente")) {
    JsonObject sensorHum = sensores.containsKey("D2_humedad_ambiente") ? 
                           sensores["D2_humedad_ambiente"] : sensores["2_humedad_ambiente"];
    sensor_hum_id = sensorHum["sensor_id"];
    Serial.print("✅ Sensor Humedad ID: ");
    Serial.println(sensor_hum_id);
  }

  // Sensor nivel agua (en A2)
  if (sensores.containsKey("A2_nivel_agua")) {
    JsonObject sensorAgua = sensores["A2_nivel_agua"];
    sensor_agua_id = sensorAgua["sensor_id"];
    Serial.print("✅ Sensor Agua ID: ");
    Serial.println(sensor_agua_id);
  }

  // ✅ EXTRAER IDs DE ACTUADORES
  JsonObject actuadores = doc["actuadores"];
  
  if (actuadores.containsKey("7") || actuadores.containsKey("D7")) {
    JsonObject actuadorBomba = actuadores.containsKey("7") ? 
                               actuadores["7"] : actuadores["D7"];
    actuador_bomba_id = actuadorBomba["actuador_id"];
    Serial.print("✅ Actuador Bomba ID: ");
    Serial.println(actuador_bomba_id);
  }

  // ✅ EXTRAER CONFIGURACIÓN DE UMBRALES
  JsonObject config = doc["configuracion"];
  if (config.containsKey("humedad_min")) {
    HUM_ON = config["humedad_min"];
    Serial.print("✅ Umbral MIN: ");
    Serial.print(HUM_ON, 1);
    Serial.println("%");
  }
  
  if (config.containsKey("humedad_max")) {
    HUM_OFF = config["humedad_max"];
    Serial.print("✅ Umbral MAX: ");
    Serial.print(HUM_OFF, 1);
    Serial.println("%");
  }

  Serial.println("========================================");
  Serial.println("  SINCRONIZACIÓN EXITOSA");
  Serial.println("========================================\n");

  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Sync OK!");
  lcd.setCursor(0, 1);
  lcd.print(sensor_temp_id > 0 ? "Sensores: OK" : "Sin sensores");
  
  matrix.loadFrame(LED_OK);
  delay(2000);

  sincronizado = true;
  return true;
}

// ============================================
// FUNCIÓN PARA REINICIAR LCD
// ============================================
void reiniciarLCD() {
  lcd.init();
  lcd.backlight();
  delay(50);
}

// ============================================
// FUNCIONES DE CONTROL DE BOMBA
// ============================================
void aplicarEstadoBomba() {
  digitalWrite(PIN_RELAY, pumpOn ? HIGH : LOW);
  digitalWrite(LED_BUILTIN, pumpOn ? HIGH : LOW);
  delay(100);
  
  Serial.print("Rele D7 = ");
  Serial.print(pumpOn ? "HIGH (ON)" : "LOW (OFF)");
  Serial.print(" | Bomba: ");
  Serial.println(pumpOn ? "DANDO AGUA" : "APAGADA");
  
  if (mqttClient.connected()) {
    enviarEstadoActuador();
  }
}

void encenderBomba(const char* motivo) {
  if (!pumpOn) {
    pumpOn = true;
    aplicarEstadoBomba();
    Serial.print("Bomba ENCENDIDA - ");
    Serial.println(motivo);
  }
}

void apagarBomba(const char* motivo) {
  if (pumpOn) {
    pumpOn = false;
    aplicarEstadoBomba();
    Serial.print("Bomba APAGADA - ");
    Serial.println(motivo);
  }
}

// ============================================
// LECTURA DE SENSORES
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
    
    Serial.print("DHT11 OK - T:");
    Serial.print(ultimaTempDHT, 1);
    Serial.print("C H:");
    Serial.print(ultimaHumDHT, 0);
    Serial.print("%");
  } else {
    Serial.print("Error DHT11 - Usando ultimos valores: T:");
    Serial.print(ultimaTempDHT, 1);
    Serial.print("C H:");
    Serial.print(ultimaHumDHT, 0);
    Serial.print("%");
  }
  
  ultimoNivelAgua = leerNivelAgua();
  Serial.print(" | Agua:");
  Serial.print(ultimoNivelAgua);
  Serial.println("%");
}

// ============================================
// CONTROL AUTOMÁTICO
// ============================================
void controlAutomatico() {
  if (modoRemoto || modoManualLocal) {
    return;
  }

  if (isnan(ultimaHumDHT) || isnan(ultimaTempDHT)) {
    return;
  }

  if (!pumpOn && ultimaHumDHT < HUM_ON && ultimoNivelAgua > WATER_NIVEL_MINIMO) {
    Serial.print("Humedad ");
    Serial.print(ultimaHumDHT, 0);
    Serial.print("% < ");
    Serial.print(HUM_ON, 0);
    Serial.print("% -> ");
    encenderBomba("Auto: Seco");
  }
  else if (pumpOn && (ultimaHumDHT > HUM_OFF || ultimoNivelAgua <= WATER_NIVEL_MINIMO)) {
    if (ultimaHumDHT > HUM_OFF) {
      Serial.print("Humedad ");
      Serial.print(ultimaHumDHT, 0);
      Serial.print("% > ");
      Serial.print(HUM_OFF, 0);
      Serial.print("% -> ");
      apagarBomba("Auto: Humedad OK");
    } else {
      apagarBomba("Auto: Sin agua");
    }
  }
}

// ============================================
// GESTIÓN DE BOTONES
// ============================================
void gestionarBoton() {
  int btnState = digitalRead(PIN_BTN);

  if (btnState == LOW && lastBtnState == HIGH) {
    pantallaActual++;
    if (pantallaActual >= NUM_PANTALLAS) {
      pantallaActual = 0;
    }
    Serial.print("Pantalla: ");
    Serial.println(pantallaActual);
    delay(200);
  }
  lastBtnState = btnState;
}

void gestionarBotonBomba() {
  int btnState = digitalRead(PIN_BTN_BOMBA);

  if (btnState == LOW && lastBtnBombaState == HIGH) {
    if (pumpOn) {
      apagarBomba("Boton manual");
      modoManualLocal = false;
      modoRemoto = false;
      Serial.println("Modo AUTOMATICO reactivado");
    } else {
      encenderBomba("Boton manual");
      modoManualLocal = true;
      modoRemoto = false;
      Serial.println("Modo MANUAL LOCAL activado");
    }
    
    lcd.clear();
    lcd.setCursor(0, 0);
    lcd.print("Control Manual");
    lcd.setCursor(0, 1);
    lcd.print(pumpOn ? "Bomba: ON" : "Bomba: OFF");
    delay(1500);
    
    delay(200);
  }
  
  lastBtnBombaState = btnState;
}

// ============================================
// ACTUALIZAR LCD SIN PARPADEO
// ============================================
void actualizarLCD() {
  static byte pantallaAnterior = 255;
  static unsigned long ultimoReinicio = 0;
  static unsigned long ultimoCambio = 0;
  static bool necesitaLimpiar = true;
  
  unsigned long ahora = millis();
  
  if (ahora - ultimoReinicio > 5000) {
    reiniciarLCD();
    ultimoReinicio = ahora;
    necesitaLimpiar = true;
  }
  
  if (pantallaActual != pantallaAnterior || necesitaLimpiar || (ahora - ultimoCambio > 1000)) {
    lcd.clear();
    delay(10);
    pantallaAnterior = pantallaActual;
    necesitaLimpiar = false;
    ultimoCambio = ahora;
  }

  switch (pantallaActual) {
    case 0:  // DHT11
      lcd.setCursor(0, 0);
      lcd.print("T:");
      if (!isnan(ultimaTempDHT) && ultimaTempDHT > 0 && ultimaTempDHT < 100) {
        lcd.print(ultimaTempDHT, 1);
        lcd.print("C");
      } else {
        lcd.print("--C");
      }
      lcd.print(" H:");
      if (!isnan(ultimaHumDHT) && ultimaHumDHT >= 0 && ultimaHumDHT <= 100) {
        lcd.print(ultimaHumDHT, 0);
        lcd.print("%  ");
      } else {
        lcd.print("--%  ");
      }
      
      lcd.setCursor(0, 1);
      lcd.print("Modo:");
      if (modoManualLocal) {
        lcd.print("MANUAL ");
      } else if (modoRemoto) {
        lcd.print("REMOTO");
      } else {
        lcd.print("AUTO  ");
      }
      lcd.print("     ");
      break;

    case 1:  // Nivel agua
      lcd.setCursor(0, 0);
      lcd.print("Nivel agua:     ");
      
      lcd.setCursor(0, 1);
      lcd.print(ultimoNivelAgua);
      lcd.print(" %");
      if (ultimoNivelAgua <= WATER_NIVEL_MINIMO) {
        lcd.print(" BAJO!");
      } else {
        lcd.print("      ");
      }
      break;

    case 2:  // Estado bomba
      lcd.setCursor(0, 0);
      lcd.print("Bomba:");
      lcd.print(pumpOn ? "ON " : "OFF");
      lcd.print("        ");
      
      lcd.setCursor(0, 1);
      lcd.print("T:");
      if (!isnan(ultimaTempDHT) && ultimaTempDHT > 0) {
        lcd.print(ultimaTempDHT, 0);
        lcd.print("C");
      } else {
        lcd.print("--C");
      }
      lcd.print(" H:");
      if (!isnan(ultimaHumDHT) && ultimaHumDHT >= 0) {
        lcd.print(ultimaHumDHT, 0);
        lcd.print("%  ");
      } else {
        lcd.print("--%  ");
      }
      break;

    case 3:  // Estado red + Sync
      lcd.setCursor(0, 0);
      if (WiFi.status() == WL_CONNECTED) {
        lcd.print("WiFi:OK MQTT:");
        lcd.print(mqttClient.connected() ? "OK" : "X");
      } else {
        lcd.print("WiFi: ERROR    ");
      }
      
      lcd.setCursor(0, 1);
      lcd.print("Sync:");
      lcd.print(sincronizado ? "OK" : "PEND");
      lcd.print(" IDs:");
      lcd.print(sensor_temp_id > 0 ? "OK" : "X");
      break;
  }
}

// ============================================
// CONEXIÓN WIFI
// ============================================
void conectarWiFi() {
  Serial.print("Conectando WiFi: ");
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
    Serial.println("WiFi Conectado");
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
    Serial.println("Error WiFi");
    lcd.clear();
    lcd.setCursor(0, 0);
    lcd.print("WiFi ERROR");
    matrix.loadFrame(LED_ERROR);
    delay(2000);
  }
}

// ============================================
// CONEXIÓN MQTT
// ============================================
void conectarMQTT() {
  if (WiFi.status() != WL_CONNECTED) return;

  Serial.print("Conectando MQTT SSL... ");
  
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Conectando MQTT");

  String clientId = "arduino_r4_" + String(random(0xffff), HEX);

  if (mqttClient.connect(clientId.c_str(), MQTT_USER, MQTT_PASSWORD)) {
    Serial.println("Conectado!");

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
    Serial.print("Fallo, rc=");
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
// ENVÍO DE DATOS A MQTT
// ============================================
void enviarDatosSensores() {
  if (!mqttClient.connected()) return;

  StaticJsonDocument<512> doc;
  JsonArray sensores = doc.createNestedArray("sensores");

  // ✅ Sensor 1: DHT11 - Temperatura (CON ID)
  if (!isnan(ultimaTempDHT) && sensor_temp_id > 0) {
    JsonObject sensor1 = sensores.createNestedObject();
    sensor1["sensor_id"] = sensor_temp_id;  // ✅ ID auto-sincronizado
    sensor1["pin"] = "D2";
    sensor1["tipo"] = "temperatura";
    sensor1["valor"] = ultimaTempDHT;
  } else if (!isnan(ultimaTempDHT)) {
    // Fallback si no hay ID (primera conexión)
    JsonObject sensor1 = sensores.createNestedObject();
    sensor1["pin"] = "D2";
    sensor1["tipo"] = "temperatura";
    sensor1["valor"] = ultimaTempDHT;
  }

  // ✅ Sensor 2: DHT11 - Humedad (CON ID)
  if (!isnan(ultimaHumDHT) && sensor_hum_id > 0) {
    JsonObject sensor2 = sensores.createNestedObject();
    sensor2["sensor_id"] = sensor_hum_id;  // ✅ ID auto-sincronizado
    sensor2["pin"] = "D2";
    sensor2["tipo"] = "humedad_ambiente";
    sensor2["valor"] = ultimaHumDHT;
  } else if (!isnan(ultimaHumDHT)) {
    JsonObject sensor2 = sensores.createNestedObject();
    sensor2["pin"] = "D2";
    sensor2["tipo"] = "humedad_ambiente";
    sensor2["valor"] = ultimaHumDHT;
  }

  // ✅ Sensor 3: Nivel de Agua (CON ID)
  if (sensor_agua_id > 0) {
    JsonObject sensor3 = sensores.createNestedObject();
    sensor3["sensor_id"] = sensor_agua_id;  // ✅ ID auto-sincronizado
    sensor3["pin"] = "A2";
    sensor3["tipo"] = "nivel_agua";
    sensor3["valor"] = ultimoNivelAgua;
  } else {
    JsonObject sensor3 = sensores.createNestedObject();
    sensor3["pin"] = "A2";
    sensor3["tipo"] = "nivel_agua";
    sensor3["valor"] = ultimoNivelAgua;
  }

  char buffer[512];
  serializeJson(doc, buffer);

  if (mqttClient.publish(topicSensores, buffer)) {
    Serial.println("Datos enviados a MQTT");
  }
}

void enviarEstadoActuador() {
  if (!mqttClient.connected()) return;

  StaticJsonDocument<128> doc;
  doc["pin"] = "D7";
  doc["tipo"] = "bomba";
  doc["estado"] = pumpOn ? 1 : 0;
  
  if (modoManualLocal) {
    doc["modo"] = "manual_local";
  } else if (modoRemoto) {
    doc["modo"] = "remoto";
  } else {
    doc["modo"] = "automatico";
  }

  char buffer[128];
  serializeJson(doc, buffer);
  
  char topicEstado[150];
  sprintf(topicEstado, "riego/%s/eventos", API_KEY);
  mqttClient.publish(topicEstado, buffer);
}

void enviarPing() {
  if (!mqttClient.connected()) return;

  StaticJsonDocument<256> doc;
  doc["status"] = "online";
  doc["rssi"] = WiFi.RSSI();
  doc["bomba_estado"] = pumpOn;
  
  if (modoManualLocal) {
    doc["modo"] = "manual_local";
  } else if (modoRemoto) {
    doc["modo"] = "remoto";
  } else {
    doc["modo"] = "automatico";
  }
  
  doc["temp_aire"] = ultimaTempDHT;
  doc["humedad_aire"] = ultimaHumDHT;
  doc["nivel_agua"] = ultimoNivelAgua;
  doc["sincronizado"] = sincronizado;
  doc["sensores_ok"] = (sensor_temp_id > 0);

  char buffer[256];
  serializeJson(doc, buffer);
  
  if (mqttClient.publish(topicPing, buffer)) {
    Serial.println("Ping enviado");
  }
}

// ============================================
// CALLBACK MQTT - RECEPCIÓN DE COMANDOS
// ============================================
void callbackMQTT(char* topic, byte* payload, unsigned int length) {
  Serial.print("Comando recibido en: ");
  Serial.println(topic);

  StaticJsonDocument<512> doc;
  DeserializationError error = deserializeJson(doc, payload, length);

  if (error) {
    Serial.println("Error parseando JSON");
    return;
  }

  // Control de actuador (bomba)
  if (doc.containsKey("pin")) {
    const char* pin = doc["pin"];
    int estado = doc["estado"];

    if (String(pin) == "7" || String(pin) == "D7") {
      modoRemoto = true;
      modoManualLocal = false;
      
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
      modoManualLocal = false;
      Serial.println("Modo AUTOMATICO activado");
      lcd.clear();
      lcd.setCursor(0, 0);
      lcd.print("Modo: AUTO");
      delay(1500);
    } else if (strcmp(modo, "remoto") == 0) {
      modoRemoto = true;
      modoManualLocal = false;
      Serial.println("Modo REMOTO activado");
      lcd.clear();
      lcd.setCursor(0, 0);
      lcd.print("Modo: REMOTO");
      delay(1500);
    }
  }

  // ✅ NUEVO: Recepción de configuración de umbrales
  if (doc.containsKey("configuracion")) {
    JsonObject config = doc["configuracion"];
    
    if (config.containsKey("humedad_min")) {
      HUM_ON = config["humedad_min"];
      Serial.print("✅ Umbral MIN actualizado: ");
      Serial.println(HUM_ON);
    }
    
    if (config.containsKey("humedad_max")) {
      HUM_OFF = config["humedad_max"];
      Serial.print("✅ Umbral MAX actualizado: ");
      Serial.println(HUM_OFF);
    }
    
    lcd.clear();
    lcd.setCursor(0, 0);
    lcd.print("Umbrales nuevos:");
    lcd.setCursor(0, 1);
    lcd.print(HUM_ON, 0);
    lcd.print("%-");
    lcd.print(HUM_OFF, 0);
    lcd.print("%");
    delay(2000);
  }

  // ✅ NUEVO: Comando de re-sincronización forzada
  if (doc.containsKey("comando") && strcmp(doc["comando"], "resync") == 0) {
    Serial.println("📡 Re-sincronización forzada solicitada");
    sincronizarConServidor();
  }
}

// ============================================
// SETUP
// ============================================
void setup() {
  Serial.begin(115200);
  while (!Serial && millis() < 5000);

  Serial.println("\n========================================");
  Serial.println("  Sistema de Riego IoT AUTO-SYNC");
  Serial.println("  Version: 2.0 con sincronizacion");
  Serial.println("========================================\n");

  matrix.begin();
  
  Wire.begin();
  lcd.init();
  lcd.backlight();
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Sistema Riego");
  lcd.setCursor(0, 1);
  lcd.print("v2.0 AutoSync");
  delay(2000);

  pinMode(PIN_RELAY, OUTPUT);
  pinMode(LED_BUILTIN, OUTPUT);
  pinMode(PIN_BTN, INPUT_PULLUP);
  pinMode(PIN_BTN_BOMBA, INPUT_PULLUP);

  pumpOn = false;
  digitalWrite(PIN_RELAY, LOW);
  Serial.println("Rele inicializado en LOW (apagado)");

  Serial.println("Iniciando DHT11...");
  lcd.setCursor(0, 1);
  lcd.print("Esperando DHT..");
  dht.begin();
  delay(2000);
  Serial.println("DHT11 listo");

  sprintf(topicSensores, "riego/%s/sensores", API_KEY);
  sprintf(topicComandos, "riego/%s/comandos", API_KEY);
  sprintf(topicComandosAll, "riego/%s/comandos/all", API_KEY);
  sprintf(topicPing, "riego/%s/ping", API_KEY);

  conectarWiFi();

  mqttClient.setServer(MQTT_BROKER, MQTT_PORT);
  mqttClient.setCallback(callbackMQTT);
  mqttClient.setBufferSize(512);

  conectarMQTT();

  // ✅ SINCRONIZACIÓN AUTOMÁTICA AL INICIO
  Serial.println("\n🔄 Ejecutando sincronizacion inicial...");
  if (sincronizarConServidor()) {
    Serial.println("✅ Dispositivo sincronizado exitosamente");
  } else {
    Serial.println("⚠️ No se pudo sincronizar, funcionando en modo fallback");
    Serial.println("   (Se intentara sincronizar cada 5 minutos)");
  }

  // Lectura inicial de sensores
  Serial.println("\nLeyendo sensores iniciales...");
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Leyendo sensores");
  
  bool sensorOK = false;
  for (int i = 0; i < 5; i++) {
    leerSensores();
    
    if (!isnan(ultimaHumDHT) && !isnan(ultimaTempDHT) && ultimaTempDHT > 0) {
      sensorOK = true;
      Serial.println("Sensores inicializados correctamente");
      break;
    }
    
    Serial.print("Intento ");
    Serial.print(i + 1);
    Serial.println("/5");
    delay(2000);
  }

  if (sensorOK) {
    controlAutomatico();
    
    lcd.clear();
    lcd.setCursor(0, 0);
    lcd.print("Listo! T:");
    lcd.print(ultimaTempDHT, 0);
    lcd.print("C");
    lcd.setCursor(0, 1);
    lcd.print("H:");
    lcd.print(ultimaHumDHT, 0);
    lcd.print("% Bomba:");
    lcd.print(pumpOn ? "ON" : "OFF");
  } else {
    Serial.println("Error: DHT11 no responde");
    lcd.clear();
    lcd.setCursor(0, 0);
    lcd.print("DHT11 ERROR");
  }

  delay(3000);
  lcd.clear();
  
  Serial.println("\n========================================");
  Serial.println("  Sistema listo");
  Serial.println("  Sensores sincronizados: " + String(sensor_temp_id > 0 ? "SI" : "NO"));
  Serial.println("  Umbrales: " + String(HUM_ON, 1) + "% - " + String(HUM_OFF, 1) + "%");
  Serial.println("========================================\n");
}

// ============================================
// LOOP PRINCIPAL
// ============================================
void loop() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi desconectado - Reconectando...");
    conectarWiFi();
  }

  if (!mqttClient.connected()) {
    Serial.println("MQTT desconectado - Reconectando...");
    conectarMQTT();
  }

  mqttClient.loop();

  unsigned long ahora = millis();

  gestionarBoton();
  gestionarBotonBomba();

  // ✅ RE-SINCRONIZAR CADA 5 MINUTOS
  if (ahora - ultimaSync >= INTERVALO_SYNC) {
    ultimaSync = ahora;
    Serial.println("\n🔄 Re-sincronizacion periodica...");
    sincronizarConServidor();
  }

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
