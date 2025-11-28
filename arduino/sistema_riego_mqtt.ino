/*
 * Sistema de Riego IoT con MQTT
 * Hardware: Arduino UNO R4 WiFi
 * Protocolo: MQTT (Broker: EMQX o broker.emqx.io)
 * 
 * IMPORTANTE: Este código usa WiFiS3.h (específico para Arduino UNO R4 WiFi)
 * NO usar ESP8266WiFi.h o WiFi.h estándar
 * 
 * SENSORES CONFIGURADOS:
 * - Temperatura LM35DZ/CZ: Pin A1 (analógico)
 *   Compatible con LM35DZ y LM35CZ (funcionan igual)
 *   Conexión LM35DZ/CZ:
 *   - Pin 1 (Vout) → Arduino A1
 *   - Pin 2 (GND)  → Arduino GND
 *   - Pin 3 (Vcc)  → Arduino 5V
 *   Salida: 10mV/°C (0°C = 0V, 100°C = 1V)
 */

#include <WiFiS3.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include "Arduino_LED_Matrix.h"

#include <WiFiClientSecure.h>

// Configuración TLS MQTT
// Habilitar si quieres conectar al puerto 8883 con TLS
#define MQTT_USE_TLS true
// Para pruebas rápidas puedes usar setInsecure() (no recomendado para producción)
#define MQTT_TLS_INSECURE true

// Si vas a usar verificación de certificado, pega aquí el certificado CA en formato PEM.
// Ejemplo mínimo (no real):
// const char ca_cert[] PROGMEM = "-----BEGIN CERTIFICATE-----\n...\n-----END CERTIFICATE-----\n";
// Si dejas el array vacío y MQTT_TLS_INSECURE==true, el cliente usará setInsecure().
const char ca_cert[] PROGMEM = "";

// Modo de prueba: cambia a broker público y deshabilita credenciales para pruebas rápidas
#define TEST_MODE true

// ============================================
// CONFIGURACIÓN - MODIFICAR SEGÚN TU ENTORNO
// ============================================

// WiFi (Usar red 2.4GHz - NO 5GHz)
const char* WIFI_SSID = "TU_RED_Wifi_SSID";     // ← CAMBIAR: Tu red WiFi
const char* WIFI_PASSWORD = "TU_WIFI_PASSWORD";   // ← CAMBIAR: Contraseña WiFi

// MQTT Broker - EMQX Cloud
// Opción 1: Broker público (para pruebas)
// const char* MQTT_BROKER = "broker.emqx.io";
// const int MQTT_PORT = 1883;
// const char* MQTT_USER = "";
// const char* MQTT_PASSWORD = "";

// Opción 2: EMQX Cloud privado (RECOMENDADO)
const char* MQTT_BROKER = "m0020126.ala.eu-central-1.emqxsl.com";  // ← CAMBIAR: Tu deployment de EMQX Cloud
const int MQTT_PORT = 8883;                             // 1883 (TCP) o 8883 (TLS)
const char* MQTT_USER = "riegoTeam";             // ← CAMBIAR: Usuario de EMQX
const char* MQTT_PASSWORD = "Cu7WhT6gnZfZgz8";        // ← CAMBIAR: Contraseña de EMQX

// API Key del dispositivo (obtener de la base de datos)
// SELECT api_key FROM dispositivos WHERE id = 1;
const char* API_KEY = "d4d6b2bdfdb606e35287ef099910abf0c1cfdf598f14d4fcd0da1804b1ea4808";  // ← CAMBIAR: API Key de la BD

// IDs de sensores (obtener de la base de datos)
// SELECT id, nombre FROM sensores WHERE dispositivo_id = 1;
const int SENSOR_TEMPERATURA_ID = 2;  // ← CAMBIAR: ID del sensor de temperatura en tu BD

// Pin del sensor de temperatura
const int PIN_LM35 = A1;  // Sensor de temperatura LM35DZ/CZ (compatible con ambos)

// Actuadores (obtener de la base de datos)
// SELECT id, pin FROM actuadores WHERE dispositivo_id = 1;
const int ACTUADOR_BOMBA_ID = 1;  // ← CAMBIAR: ID del actuador en tu BD
const int PIN_BOMBA = 7;          // ← CAMBIAR: Pin físico donde conectaste la bomba

// Intervalos de tiempo
const unsigned long INTERVALO_SENSORES = 5000;   // 5 segundos (actualización rápida)
const unsigned long INTERVALO_PING = 30000;      // 30 segundos

// ============================================
// VARIABLES GLOBALES
// ============================================

WiFiClient wifiClient;
PubSubClient mqttClient(wifiClient);
ArduinoLEDMatrix matrix;

unsigned long ultimoEnvioSensores = 0;
unsigned long ultimoPing = 0;

// Tópicos MQTT
char topicSensores[100];
char topicComandos[100];
char topicComandosAll[100];
char topicPing[100];

// Estado de actuadores
struct Actuador {
  int id;
  int pin;
  bool estado;  // true = encendido, false = apagado
};

Actuador actuadores[] = {
  {ACTUADOR_BOMBA_ID, PIN_BOMBA, false}
};
const int NUM_ACTUADORES = sizeof(actuadores) / sizeof(Actuador);

// Patrones LED
const uint32_t LED_WIFI_CONECTANDO[] = {0x0, 0x0e0e0e, 0x0};
const uint32_t LED_WIFI_OK[] = {0x0, 0x1f1f1f, 0x0};
const uint32_t LED_MQTT_CONECTANDO[] = {0xaa55aa, 0x55aa55, 0xaa55aa};
const uint32_t LED_TODO_OK[] = {0x1041041, 0x4104104, 0x10410410};
const uint32_t LED_ERROR[] = {0x1b1b1b0, 0xc060301, 0x80c0600};

// ============================================
// SETUP
// ============================================

void setup() {
  Serial.begin(115200);
  while (!Serial && millis() < 5000);
  
  Serial.println("\n========================================");
  Serial.println("  Sistema de Riego IoT - MQTT");
  Serial.println("  Hardware: Arduino UNO R4 WiFi");
  Serial.println("========================================\n");

  // Inicializar matriz LED
  matrix.begin();
  matrix.loadFrame(LED_WIFI_CONECTANDO);

  // Configurar pines
  pinMode(LED_BUILTIN, OUTPUT);
  for (int i = 0; i < NUM_ACTUADORES; i++) {
    pinMode(actuadores[i].pin, OUTPUT);
    digitalWrite(actuadores[i].pin, LOW);
  }

  // Construir tópicos MQTT
  sprintf(topicSensores, "riego/%s/sensores", API_KEY);
  sprintf(topicComandos, "riego/%s/comandos", API_KEY);
  sprintf(topicComandosAll, "riego/%s/comandos/all", API_KEY);
  sprintf(topicPing, "riego/%s/ping", API_KEY);

  // Conectar WiFi
  conectarWiFi();

  // Configurar cliente MQTT
  mqttClient.setServer(MQTT_BROKER, MQTT_PORT);
  mqttClient.setCallback(callbackMQTT);
  mqttClient.setKeepAlive(60);
  mqttClient.setSocketTimeout(30);

  // Conectar MQTT
  conectarMQTT();
}

// ============================================
// LOOP PRINCIPAL
// ============================================

void loop() {
  // Verificar conexión WiFi
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("⚠️  WiFi desconectado, reconectando...");
    conectarWiFi();
  }

  // Verificar conexión MQTT
  if (!mqttClient.connected()) {
    conectarMQTT();
  }

  // Mantener conexión MQTT activa (NO BLOQUEANTE)
  mqttClient.loop();

  unsigned long ahora = millis();

  // Enviar datos de sensores periódicamente
  if (ahora - ultimoEnvioSensores >= INTERVALO_SENSORES) {
    ultimoEnvioSensores = ahora;
    enviarDatosSensores();
  }

  // Enviar ping periódicamente
  if (ahora - ultimoPing >= INTERVALO_PING) {
    ultimoPing = ahora;
    enviarPing();
  }

  // Parpadeo LED para indicar que está vivo
  static unsigned long ultimoParpadeo = 0;
  if (ahora - ultimoParpadeo >= 1000) {
    ultimoParpadeo = ahora;
    digitalWrite(LED_BUILTIN, !digitalRead(LED_BUILTIN));
  }
}

// ============================================
// FUNCIONES DE CONEXIÓN
// ============================================

void conectarWiFi() {
  matrix.loadFrame(LED_WIFI_CONECTANDO);
  Serial.print("Conectando a WiFi");
  
  WiFi.disconnect();
  delay(100);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  int intentos = 0;
  while (WiFi.status() != WL_CONNECTED && intentos < 30) {
    delay(500);
    Serial.print(".");
    intentos++;
  }
  Serial.println();

  if (WiFi.status() == WL_CONNECTED) {
    // Esperar a obtener IP válida
    Serial.print("Obteniendo IP");
    intentos = 0;
    while (WiFi.localIP() == IPAddress(0, 0, 0, 0) && intentos < 20) {
      delay(500);
      Serial.print(".");
      intentos++;
    }
    Serial.println();

    if (WiFi.localIP() != IPAddress(0, 0, 0, 0)) {
      matrix.loadFrame(LED_WIFI_OK);
      Serial.println("✅ WiFi conectado");
      Serial.print("   IP: ");
      Serial.println(WiFi.localIP());
      Serial.print("   RSSI: ");
      Serial.print(WiFi.RSSI());
      Serial.println(" dBm");
      
      // Esperar a que la conexión se estabilice completamente
      Serial.println("⏳ Estabilizando conexión...");
      delay(2000);  // Esperar 2 segundos para que el stack TCP/IP esté listo
    } else {
      matrix.loadFrame(LED_ERROR);
      Serial.println("❌ Error: No se obtuvo IP válida");
    }
  } else {
    matrix.loadFrame(LED_ERROR);
    Serial.println("❌ Error: No se pudo conectar a WiFi");
  }
}

void conectarMQTT() {
  if (WiFi.status() != WL_CONNECTED) return;

  matrix.loadFrame(LED_MQTT_CONECTANDO);
  Serial.print("Conectando a MQTT broker");

  String clientId = "arduino_riego_";
  clientId += String(random(0xffff), HEX);

  int intentos = 0;
  while (!mqttClient.connected() && intentos < 5) {
    Serial.print(".");
    
    if (mqttClient.connect(clientId.c_str(), MQTT_USER, MQTT_PASSWORD)) {
      Serial.println("\n✅ Conectado a MQTT broker");
      Serial.print("   Broker: ");
      Serial.println(MQTT_BROKER);
      
      // Suscribirse a tópicos de comandos
      mqttClient.subscribe(topicComandos);
      mqttClient.subscribe(topicComandosAll);
      
      Serial.println("📡 Suscrito a tópicos de comandos");
      matrix.loadFrame(LED_TODO_OK);
      
      // Enviar ping inicial
      enviarPing();
      
    } else {
      Serial.print("❌ Error: ");
      Serial.println(mqttClient.state());
      intentos++;
      delay(2000);
    }
  }

  if (!mqttClient.connected()) {
    matrix.loadFrame(LED_ERROR);
    Serial.println("\n⚠️  No se pudo conectar a MQTT, reintentando en próximo ciclo");
  }
}

// ============================================
// CALLBACK MQTT (Recepción de comandos)
// ============================================

void callbackMQTT(char* topic, byte* payload, unsigned int length) {
  Serial.print("📥 Mensaje recibido [");
  Serial.print(topic);
  Serial.println("]");

  // Parsear JSON
  StaticJsonDocument<256> doc;
  DeserializationError error = deserializeJson(doc, payload, length);

  if (error) {
    Serial.print("❌ Error al parsear JSON: ");
    Serial.println(error.c_str());
    return;
  }

  // Procesar comando individual
  if (strcmp(topic, topicComandos) == 0) {
    int actuadorId = doc["actuador_id"];
    int pin = doc["pin"];
    int estado = doc["estado"];

    Serial.print("🎛️  Comando: Actuador ");
    Serial.print(actuadorId);
    Serial.print(" -> ");
    Serial.println(estado ? "ENCENDIDO" : "APAGADO");

    // Buscar actuador y actualizar estado
    for (int i = 0; i < NUM_ACTUADORES; i++) {
      if (actuadores[i].id == actuadorId) {
        actuadores[i].estado = (estado == 1);
        digitalWrite(actuadores[i].pin, estado);
        Serial.print("   Pin ");
        Serial.print(actuadores[i].pin);
        Serial.println(estado ? " HIGH" : " LOW");
        break;
      }
    }
  }

  // Procesar comandos múltiples
  if (strcmp(topic, topicComandosAll) == 0) {
    JsonArray actuadoresArray = doc["actuadores"];
    Serial.println("🎛️  Comandos múltiples recibidos:");

    for (JsonVariant v : actuadoresArray) {
      int actuadorId = v["actuador_id"];
      int pin = v["pin"];
      int estado = v["estado"];

      for (int i = 0; i < NUM_ACTUADORES; i++) {
        if (actuadores[i].id == actuadorId) {
          actuadores[i].estado = (estado == 1);
          digitalWrite(actuadores[i].pin, estado);
          Serial.print("   Actuador ");
          Serial.print(actuadorId);
          Serial.print(" -> ");
          Serial.println(estado ? "ENCENDIDO" : "APAGADO");
          break;
        }
      }
    }
  }
}

// ============================================
// FUNCIONES DE PUBLICACIÓN
// ============================================

void enviarDatosSensores() {
  if (!mqttClient.connected()) return;

  // ============================================
  // LECTURA DE SENSORES CON VALIDACIÓN
  // ============================================
  
  Serial.println("\n--- LECTURA DE SENSORES ---");
  
  // Leer temperatura del LM35DZ/CZ (A1) - Promedio de 10 lecturas
  long sumaLecturas = 0;
  for (int i = 0; i < 10; i++) {
    sumaLecturas += analogRead(PIN_LM35);
    delay(10);
  }
  int lecturaLM35 = sumaLecturas / 10;
  
  float voltajeLM35 = (lecturaLM35 * 5.0) / 1023.0;
  float temperatura = voltajeLM35 * 100.0;  // 10mV/°C = 0.01V/°C
  
  // DEBUG: Mostrar lectura cruda de temperatura
  Serial.print("🌡️  Temperatura LM35DZ/CZ (A1):");
  Serial.print("\n   ADC Raw: ");
  Serial.print(lecturaLM35);
  Serial.print(" | Voltaje: ");
  Serial.print(voltajeLM35, 3);
  Serial.print("V | Temp: ");
  Serial.print(temperatura, 1);
  Serial.println("°C");

  // ============================================
  // VALIDACIÓN DE SENSOR
  // ============================================
  bool sensorValido = true;
  String estadoSensor = "ok";
  
  // Validar rango de temperatura razonable (-10°C a 100°C)
  if (temperatura < -10 || temperatura > 100) {
    Serial.println("⚠️  ADVERTENCIA: Temperatura fuera de rango");
    sensorValido = false;
    estadoSensor = "fuera_rango";
  }
  
  // Validar si el sensor está conectado (voltaje muy bajo o muy alto = desconectado)
  if (voltajeLM35 < 0.1) {
    Serial.println("⚠️  ADVERTENCIA: Sensor posiblemente desconectado (voltaje muy bajo)");
    sensorValido = false;
    estadoSensor = "desconectado";
  } else if (voltajeLM35 > 4.5) {
    Serial.println("⚠️  ADVERTENCIA: Sensor con lectura anormal (voltaje muy alto)");
    sensorValido = false;
    estadoSensor = "lectura_anormal";
  }
  
  if (sensorValido) {
    Serial.println("✅ Sensor validado correctamente");
  }

  // Crear JSON
  StaticJsonDocument<512> doc;
  JsonArray sensores = doc.createNestedArray("sensores");

  // Enviar temperatura con información de estado
  JsonObject sensor1 = sensores.createNestedObject();
  sensor1["sensor_id"] = SENSOR_TEMPERATURA_ID;
  sensor1["valor"] = temperatura;
  sensor1["estado"] = estadoSensor;
  sensor1["conectado"] = sensorValido;

  doc["timestamp"] = millis();

  // Serializar y publicar
  char buffer[256];
  serializeJson(doc, buffer);

  // DEBUG: Mostrar JSON que se va a enviar
  Serial.print("\n📤 JSON a enviar: ");
  Serial.println(buffer);

  if (mqttClient.publish(topicSensores, buffer, false)) {
    Serial.println("✅ Datos publicados exitosamente por MQTT");
    Serial.println("---------------------------\n");
  } else {
    Serial.println("❌ ERROR: No se pudo publicar por MQTT");
    Serial.println("---------------------------\n");
  }
}

void enviarPing() {
  if (!mqttClient.connected()) return;

  StaticJsonDocument<128> doc;
  doc["status"] = "online";
  doc["rssi"] = WiFi.RSSI();
  doc["uptime"] = millis() / 1000;
  doc["timestamp"] = millis();

  char buffer[128];
  serializeJson(doc, buffer);

  if (mqttClient.publish(topicPing, buffer, false)) {
    Serial.println("💓 Ping enviado");
  }
}

// ============================================
// FUNCIONES AUXILIARES
// ============================================

void mostrarEstadoActuadores() {
  Serial.println("\n--- Estado Actuadores ---");
  for (int i = 0; i < NUM_ACTUADORES; i++) {
    Serial.print("Actuador ");
    Serial.print(actuadores[i].id);
    Serial.print(" (Pin ");
    Serial.print(actuadores[i].pin);
    Serial.print("): ");
    Serial.println(actuadores[i].estado ? "ENCENDIDO" : "APAGADO");
  }
  Serial.println("------------------------\n");
}
