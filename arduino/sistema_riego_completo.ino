/*
 * Sistema de Riego IoT Completo - MQTT + Sensores + LCD + Control Local
 * Hardware: Arduino UNO R4 WiFi
 * Sensores: LM35 (temperatura suelo) + DHT11 (temperatura/humedad aire)
 * Actuador: Relé para bomba de agua
 * Display: LCD I2C 16x2
 * Control: Botón para cambiar pantallas LCD
 * Conectividad: MQTT SSL/TLS con EMQX Serverless
 */

#include <WiFiS3.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include "Arduino_LED_Matrix.h"
#include <Wire.h>
#include <LiquidCrystal_I2C.h>
#include "DHT.h"
#include <SPI.h>
#include <MFRC522.h>
#include "config.h"  // WiFi, MQTT and API Key credentials

// ============================================
// 4. CONFIGURACIÓN HARDWARE - PINES
// ============================================
const int PIN_LM35   = A1;    // LM35 temperatura suelo (analógico)
const int PIN_AGUA   = A2;    // Sensor de Nivel de Agua
const int PIN_RELAY  = 7;     // Relé de la bomba
const int PIN_BTN    = 8;     // Botón (entre D8 y GND)
#define DHTPIN 2              // DHT11 en D2
#define DHTTYPE DHT11

// Configuración RFID RC522 (SPI)
#define SS_PIN  10  // Slave Select
#define RST_PIN 9   // Reset
// MOSI -> 11
// MISO -> 12
// SCK  -> 13

// NOTA: Ya no se necesitan IDs hardcodeados. 
// El servidor resolverá los IDs basándose en el PIN y el TIPO de sensor.

// ============================================
// 5. PARÁMETROS DE RIEGO AUTOMÁTICO
// ============================================
const float HUM_ON   = 40.0;   // Encender bomba si humedad < 40%
const float HUM_OFF  = 60.0;   // Apagar bomba si humedad > 60%
const float TEMP_MIN = 20.0;   // Solo regar si temperatura > 20°C

// ============================================
// 6. INTERVALOS DE COMUNICACIÓN
// ============================================
const unsigned long INTERVALO_SENSORES = 5000;   // Enviar datos cada 5s (actualización rápida)
const unsigned long INTERVALO_PING = 30000;      // Ping cada 30s
const unsigned long INTERVALO_LCD = 250;         // Actualizar LCD cada 250ms

// ============================================
// 7. OBJETOS GLOBALES
// ============================================
WiFiSSLClient wifiClient;
PubSubClient mqttClient(wifiClient);
ArduinoLEDMatrix matrix;
DHT dht(DHTPIN, DHTTYPE);
LiquidCrystal_I2C lcd(0x27, 16, 2); // Cambiar a 0x3F si no funciona
MFRC522 mfrc522(SS_PIN, RST_PIN);   // Instancia RFID

// ============================================
// 8. VARIABLES DE ESTADO
// ============================================
bool pumpOn = false;
bool modoRemoto = false;  // false=automático, true=control remoto
byte pantallaActual = 0;
const byte NUM_PANTALLAS = 5;  // LM35, DHT11, Bomba, Tiempo, Red
int lastBtnState = HIGH;

unsigned long ultimoEnvioSensores = 0;
unsigned long ultimoPing = 0;
unsigned long ultimoUpdateLCD = 0;

// Variables para almacenar últimas lecturas
float ultimaTempLM35 = 0.0;
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

// ============================================
// FUNCIONES DE CONTROL DE BOMBA
// ============================================
void aplicarEstadoBomba() {
  digitalWrite(PIN_RELAY, pumpOn ? HIGH : LOW);
  digitalWrite(LED_BUILTIN, pumpOn ? HIGH : LOW);
  
  // Enviar estado a MQTT inmediatamente
  if (mqttClient.connected()) {
    enviarEstadoActuador();
  }
}

void encenderBomba(const char* motivo) {
  if (!pumpOn) {
    pumpOn = true;
    aplicarEstadoBomba();
    Serial.print("🚰 Bomba ENCENDIDA - ");
    Serial.println(motivo);
  }
}

void apagarBomba(const char* motivo) {
  if (pumpOn) {
    pumpOn = false;
    aplicarEstadoBomba();
    Serial.print("🛑 Bomba APAGADA - ");
    Serial.println(motivo);
  }
}

// ============================================
// LECTURA DE SENSORES
// ============================================
float leerTemperaturaLM35() {
  const int N = 10;
  long suma = 0;

  for (int i = 0; i < N; i++) {
    suma += analogRead(PIN_LM35);
    delay(5);
  }

  float lectura = suma / (float)N;
  float voltaje = lectura * 5.0 / 1023.0;
  float tempC = voltaje * 100.0;  // LM35: 10mV/°C
  return tempC;
}

void leerSensores() {
  ultimaTempLM35 = leerTemperaturaLM35();
  ultimaHumDHT = dht.readHumidity();
  ultimaTempDHT = dht.readTemperature();

  // Leer Nivel de Agua
  ultimoNivelAgua = analogRead(PIN_AGUA);
  // Mapear valor analógico (0-1023) a porcentaje (0-100%) aprox
  // Ajustar según calibración del sensor real
  ultimoNivelAgua = map(ultimoNivelAgua, 0, 700, 0, 100); 
  if (ultimoNivelAgua > 100) ultimoNivelAgua = 100;
  if (ultimoNivelAgua < 0) ultimoNivelAgua = 0;

  if (isnan(ultimaHumDHT) || isnan(ultimaTempDHT)) {
    Serial.println("⚠️ Error leyendo DHT11");
  }
}

// ============================================
// CONTROL AUTOMÁTICO
// ============================================
void controlAutomatico() {
  if (modoRemoto) return;  // No actuar si está en modo remoto

  if (!isnan(ultimaHumDHT)) {
    // CONDICIÓN: CALIENTE Y SECO -> ENCENDER
    if (!pumpOn && ultimaHumDHT < HUM_ON && ultimaTempLM35 > TEMP_MIN) {
      encenderBomba("Auto: Caliente y seco");
    }
    // CONDICIÓN: YA NO TAN SECO O FRÍO -> APAGAR
    else if (pumpOn && (ultimaHumDHT > HUM_OFF || ultimaTempLM35 < TEMP_MIN)) {
      apagarBomba("Auto: Humedad OK o frío");
    }
  }
}

// ============================================
// GESTIÓN DE BOTÓN Y PANTALLAS LCD
// ============================================
void gestionarBoton() {
  int btnState = digitalRead(PIN_BTN);

  // Detectar flanco de bajada
  if (btnState == LOW && lastBtnState == HIGH) {
    pantallaActual++;
    if (pantallaActual >= NUM_PANTALLAS) {
      pantallaActual = 0;
    }
    Serial.print("📺 Pantalla: ");
    Serial.println(pantallaActual);
    actualizarLCD();  // Actualizar inmediatamente
  }
  lastBtnState = btnState;
}

void actualizarLCD() {
  lcd.clear();

  switch (pantallaActual) {
    case 0:  // Temperatura LM35 (suelo)
      lcd.setCursor(0, 0);
      lcd.print("Temp Suelo:");
      lcd.setCursor(0, 1);
      lcd.print(ultimaTempLM35, 1);
      lcd.print(" C");
      break;

    case 1:  // DHT11 (aire)
      lcd.setCursor(0, 0);
      lcd.print("Aire T:");
      if (!isnan(ultimaTempDHT)) {
        lcd.print(ultimaTempDHT, 1);
        lcd.print("C");
      } else {
        lcd.print("--C");
      }
      lcd.setCursor(0, 1);
      lcd.print("H:");
      if (!isnan(ultimaHumDHT)) {
        lcd.print(ultimaHumDHT, 0);
        lcd.print("%");
      } else {
        lcd.print("--%");
      }
      break;

    case 2:  // Estado bomba
      lcd.setCursor(0, 0);
      lcd.print("Bomba:");
      lcd.print(pumpOn ? "ON " : "OFF");
      lcd.setCursor(0, 1);
      lcd.print(modoRemoto ? "Modo: REMOTO" : "Modo: AUTO  ");
      break;

    case 3:  // Tiempo activo
      lcd.setCursor(0, 0);
      lcd.print("Tiempo activo:");
      lcd.setCursor(0, 1);
      lcd.print(millis() / 1000);
      lcd.print(" seg");
      break;

    case 4:  // Estado red
      lcd.setCursor(0, 0);
      if (WiFi.status() == WL_CONNECTED) {
        lcd.print("WiFi: OK");
      } else {
        lcd.print("WiFi: ERROR");
      }
      lcd.setCursor(0, 1);
      if (mqttClient.connected()) {
        lcd.print("MQTT: OK");
      } else {
        lcd.print("MQTT: ERROR");
      }
      break;
  }
}

// ============================================
// CONEXIÓN WIFI
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
// CONEXIÓN MQTT
// ============================================
void conectarMQTT() {
  if (WiFi.status() != WL_CONNECTED) return;

  Serial.print("🔌 Conectando MQTT SSL... ");
  
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Conectando MQTT");

  String clientId = "arduino_r4_" + String(random(0xffff), HEX);

  if (mqttClient.connect(clientId.c_str(), MQTT_USER, MQTT_PASSWORD)) {
    Serial.println("✅ ¡Conectado!");

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
// ENVÍO DE DATOS A MQTT
// ============================================
void enviarDatosSensores() {
  if (!mqttClient.connected()) return;

  StaticJsonDocument<512> doc; // Aumentado tamaño por strings adicionales
  JsonArray sensores = doc.createNestedArray("sensores");

  // Sensor 1: LM35 - Temperatura del suelo
  JsonObject sensor1 = sensores.createNestedObject();
  sensor1["pin"] = "A1";
  sensor1["tipo"] = "temperatura"; // Coincide con ENUM DB
  sensor1["valor"] = ultimaTempLM35;

  // Sensor 2: DHT11 - Temperatura del aire
  if (!isnan(ultimaTempDHT)) {
    JsonObject sensor2 = sensores.createNestedObject();
    sensor2["pin"] = "D2";
    sensor2["tipo"] = "temperatura";
    sensor2["valor"] = ultimaTempDHT;
  }

  // Sensor 3: DHT11 - Humedad del aire
  if (!isnan(ultimaHumDHT)) {
    JsonObject sensor3 = sensores.createNestedObject();
    sensor3["pin"] = "D2";
    sensor3["tipo"] = "humedad_ambiente";
    sensor3["valor"] = ultimaHumDHT;
  }

  // Sensor 4: Nivel de Agua
  JsonObject sensor4 = sensores.createNestedObject();
  sensor4["pin"] = "A2";
  sensor4["tipo"] = "nivel_agua";
  sensor4["valor"] = ultimoNivelAgua;

  char buffer[512];
  serializeJson(doc, buffer);

  if (mqttClient.publish(topicSensores, buffer)) {
    Serial.println("📤 Datos enviados (Smart Discovery):");
    Serial.print("   LM35 (A1): ");
    Serial.print(ultimaTempLM35, 1);
    Serial.println(" °C");
    Serial.print("   DHT (D2): ");
    Serial.print(ultimaTempDHT, 1);
    Serial.print(" °C | H: ");
    Serial.print(ultimaHumDHT, 0);
    Serial.println(" %");
    Serial.print("   Agua (A2): ");
    Serial.print(ultimoNivelAgua);
    Serial.println(" %");
  } else {
    Serial.println("⚠️ Error al publicar datos");
  }
}

void enviarEstadoActuador() {
  if (!mqttClient.connected()) return;

  StaticJsonDocument<128> doc;
  doc["pin"] = "D7"; // Identificador físico
  doc["tipo"] = "bomba";
  doc["estado"] = pumpOn ? 1 : 0;
  doc["modo"] = modoRemoto ? "remoto" : "automatico";

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
  doc["modo"] = modoRemoto ? "remoto" : "automatico";
  doc["temp_suelo"] = ultimaTempLM35;
  doc["temp_aire"] = ultimaTempDHT;
  doc["humedad_aire"] = ultimaHumDHT;

  char buffer[256];
  serializeJson(doc, buffer);
  
  if (mqttClient.publish(topicPing, buffer)) {
    Serial.println("💓 Ping enviado");
  }
}

// ============================================
// CALLBACK MQTT - RECEPCIÓN DE COMANDOS
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

  // Control de actuador (bomba)
  if (doc.containsKey("pin")) {
    const char* pin = doc["pin"];
    int estado = doc["estado"];

    // Verificar si el comando es para nuestro relé (Pin 7 o D7)
    if (String(pin) == "7" || String(pin) == "D7") {
      modoRemoto = true;  // Activar modo remoto
      
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
  Serial.println("  Sistema de Riego IoT Completo");
  Serial.println("  LM35 + DHT11 + LCD + MQTT SSL");
  Serial.println("========================================\n");

  // Inicializar hardware
  matrix.begin();
  dht.begin();
  SPI.begin();        // Iniciar bus SPI
  mfrc522.PCD_Init(); // Iniciar MFRC522
  
  lcd.init();
  lcd.backlight();
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Sistema Riego");
  lcd.setCursor(0, 1);
  lcd.print("Iniciando...");

  pinMode(PIN_RELAY, OUTPUT);
  pinMode(LED_BUILTIN, OUTPUT);
  pinMode(PIN_BTN, INPUT_PULLUP);

  pumpOn = false;
  aplicarEstadoBomba();

  // Construir tópicos MQTT
  sprintf(topicSensores, "riego/%s/sensores", API_KEY);
  sprintf(topicComandos, "riego/%s/comandos", API_KEY);
  sprintf(topicComandosAll, "riego/%s/comandos/all", API_KEY);
  sprintf(topicPing, "riego/%s/ping", API_KEY);

  // Conectar red
  conectarWiFi();

  mqttClient.setServer(MQTT_BROKER, MQTT_PORT);
  mqttClient.setCallback(callbackMQTT);
  mqttClient.setBufferSize(512);

  conectarMQTT();

  // Lectura inicial de sensores
  leerSensores();
  
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Listo!");
  lcd.setCursor(0, 1);
  lcd.print("Btn=cambiar info");
  delay(2000);
}

// ============================================
// LOOP PRINCIPAL
// ============================================
void loop() {
  // 1. Verificar conectividad
  if (WiFi.status() != WL_CONNECTED) {
    conectarWiFi();
  }

  if (!mqttClient.connected()) {
    conectarMQTT();
  }

  mqttClient.loop();

  // Leer RFID
  if (mfrc522.PICC_IsNewCardPresent() && mfrc522.PICC_ReadCardSerial()) {
    String uid = "";
    for (byte i = 0; i < mfrc522.uid.size; i++) {
      uid += String(mfrc522.uid.uidByte[i] < 0x10 ? "0" : "");
      uid += String(mfrc522.uid.uidByte[i], HEX);
    }
    uid.toUpperCase();
    
    Serial.print("🏷️ Tarjeta RFID detectada: ");
    Serial.println(uid);
    
    // Enviar evento RFID
    StaticJsonDocument<128> doc;
    doc["tipo"] = "rfid_scan";
    doc["mensaje"] = uid;
    
    char buffer[128];
    serializeJson(doc, buffer);
    char topicEventos[150];
    sprintf(topicEventos, "riego/%s/eventos", API_KEY);
    mqttClient.publish(topicEventos, buffer);
    
    // Feedback visual en LCD
    lcd.clear();
    lcd.setCursor(0, 0);
    lcd.print("RFID Detectado");
    lcd.setCursor(0, 1);
    lcd.print(uid);
    delay(2000);
    
    mfrc522.PICC_HaltA();
  }

  unsigned long ahora = millis();

  // 2. Gestionar botón
  gestionarBoton();

  // 3. Leer sensores y control automático
  if (ahora - ultimoEnvioSensores >= INTERVALO_SENSORES) {
    ultimoEnvioSensores = ahora;
    
    leerSensores();
    controlAutomatico();
    enviarDatosSensores();
  }

  // 4. Enviar ping
  if (ahora - ultimoPing >= INTERVALO_PING) {
    ultimoPing = ahora;
    enviarPing();
  }

  // 5. Actualizar LCD
  if (ahora - ultimoUpdateLCD >= INTERVALO_LCD) {
    ultimoUpdateLCD = ahora;
    actualizarLCD();
  }

  delay(50);  // Pequeña pausa para estabilidad
}
