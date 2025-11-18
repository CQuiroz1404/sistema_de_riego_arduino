/*
 * EJEMPLO DE CÓDIGO ARDUINO PARA SISTEMA DE RIEGO IoT
 * 
 * Este código es un ejemplo para conectar tu Arduino al sistema web.
 * Deberás adaptarlo según tu hardware específico.
 * 
 * Hardware sugerido:
 * - Arduino Uno/Mega/ESP8266/ESP32
 * - Sensor de humedad del suelo
 * - Módulo WiFi (ESP8266/ESP32 o Shield WiFi)
 * - Relé para controlar bomba de agua
 * - Fuente de alimentación adecuada
 */

#include <ESP8266WiFi.h>  // Para ESP8266, usar <WiFi.h> para ESP32
#include <ESP8266HTTPClient.h>
#include <ArduinoJson.h>

// ============================================
// CONFIGURACIÓN - MODIFICA ESTOS VALORES
// ============================================
const char* WIFI_SSID = "TU_WIFI_SSID";
const char* WIFI_PASSWORD = "TU_WIFI_PASSWORD";
const char* SERVER_URL = "http://TU_SERVIDOR:3000";
const char* API_KEY = "TU_API_KEY_AQUI";  // Obtenida al crear dispositivo en la web

// Pines
const int PIN_SENSOR_HUMEDAD = A0;  // Pin analógico para sensor de humedad
const int PIN_BOMBA = D1;           // Pin digital para relé de la bomba

// Variables
int sensorId = 1;  // ID del sensor en la base de datos
int actuadorId = 1; // ID del actuador en la base de datos
unsigned long ultimoEnvio = 0;
const unsigned long INTERVALO_ENVIO = 60000;  // Enviar datos cada 60 segundos

WiFiClient wifiClient;

// ============================================
// SETUP
// ============================================
void setup() {
  Serial.begin(115200);
  Serial.println("\n\nSistema de Riego IoT - Iniciando...");
  
  // Configurar pines
  pinMode(PIN_BOMBA, OUTPUT);
  digitalWrite(PIN_BOMBA, LOW);  // Bomba apagada inicialmente
  
  // Conectar a WiFi
  conectarWiFi();
  
  // Ping inicial al servidor
  pingServidor();
}

// ============================================
// LOOP PRINCIPAL
// ============================================
void loop() {
  // Verificar conexión WiFi
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi desconectado. Reconectando...");
    conectarWiFi();
  }
  
  unsigned long ahora = millis();
  
  // Enviar datos cada intervalo
  if (ahora - ultimoEnvio >= INTERVALO_ENVIO) {
    ultimoEnvio = ahora;
    
    // Leer sensor de humedad
    int valorHumedad = leerSensorHumedad();
    Serial.print("Humedad del suelo: ");
    Serial.print(valorHumedad);
    Serial.println("%");
    
    // Enviar datos al servidor
    enviarDatos(sensorId, valorHumedad);
    
    // Obtener comandos del servidor
    obtenerComandos();
  }
  
  delay(1000);  // Esperar 1 segundo
}

// ============================================
// FUNCIONES
// ============================================

void conectarWiFi() {
  Serial.print("Conectando a WiFi: ");
  Serial.println(WIFI_SSID);
  
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  
  int intentos = 0;
  while (WiFi.status() != WL_CONNECTED && intentos < 20) {
    delay(500);
    Serial.print(".");
    intentos++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n✓ WiFi conectado");
    Serial.print("IP: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("\n✗ Error al conectar WiFi");
  }
}

int leerSensorHumedad() {
  // Leer valor analógico del sensor (0-1023)
  int valorAnalogico = analogRead(PIN_SENSOR_HUMEDAD);
  
  // Convertir a porcentaje (0-100%)
  // Nota: Calibra estos valores según tu sensor
  int porcentaje = map(valorAnalogico, 1023, 0, 0, 100);
  porcentaje = constrain(porcentaje, 0, 100);
  
  return porcentaje;
}

void enviarDatos(int sensorId, float valor) {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    String url = String(SERVER_URL) + "/api/arduino/data";
    
    http.begin(wifiClient, url);
    http.addHeader("Content-Type", "application/json");
    http.addHeader("X-API-Key", API_KEY);
    
    // Crear JSON con los datos
    StaticJsonDocument<200> doc;
    doc["sensor_id"] = sensorId;
    doc["valor"] = valor;
    
    String jsonData;
    serializeJson(doc, jsonData);
    
    Serial.println("Enviando datos: " + jsonData);
    
    int httpCode = http.POST(jsonData);
    
    if (httpCode > 0) {
      String payload = http.getString();
      Serial.print("Respuesta del servidor (");
      Serial.print(httpCode);
      Serial.print("): ");
      Serial.println(payload);
    } else {
      Serial.print("Error en la petición: ");
      Serial.println(http.errorToString(httpCode));
    }
    
    http.end();
  }
}

void obtenerComandos() {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    String url = String(SERVER_URL) + "/api/arduino/commands?api_key=" + String(API_KEY);
    
    http.begin(wifiClient, url);
    
    int httpCode = http.GET();
    
    if (httpCode == 200) {
      String payload = http.getString();
      Serial.println("Comandos recibidos: " + payload);
      
      // Parsear JSON
      StaticJsonDocument<1024> doc;
      DeserializationError error = deserializeJson(doc, payload);
      
      if (!error) {
        JsonArray commands = doc["commands"];
        
        for (JsonObject cmd : commands) {
          int actId = cmd["actuador_id"];
          int estado = cmd["estado"];
          
          // Si es nuestro actuador, ejecutar comando
          if (actId == actuadorId) {
            if (estado == 1) {
              encenderBomba();
            } else {
              apagarBomba();
            }
          }
        }
      }
    }
    
    http.end();
  }
}

void encenderBomba() {
  Serial.println("🚰 Encendiendo bomba de agua");
  digitalWrite(PIN_BOMBA, HIGH);
}

void apagarBomba() {
  Serial.println("🚫 Apagando bomba de agua");
  digitalWrite(PIN_BOMBA, LOW);
}

void pingServidor() {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    String url = String(SERVER_URL) + "/api/arduino/ping";
    
    http.begin(wifiClient, url);
    http.addHeader("X-API-Key", API_KEY);
    
    int httpCode = http.GET();
    
    if (httpCode == 200) {
      Serial.println("✓ Conexión con servidor establecida");
    } else {
      Serial.println("✗ Error al conectar con servidor");
    }
    
    http.end();
  }
}

/*
 * NOTAS DE INSTALACIÓN:
 * 
 * 1. Instala las siguientes librerías en Arduino IDE:
 *    - ESP8266WiFi (para ESP8266) o WiFi (para ESP32)
 *    - ESP8266HTTPClient o HTTPClient
 *    - ArduinoJson (versión 6.x)
 * 
 * 2. Configura las constantes al inicio del código:
 *    - WIFI_SSID y WIFI_PASSWORD: Credenciales de tu red WiFi
 *    - SERVER_URL: URL de tu servidor (ej: http://192.168.1.100:3000)
 *    - API_KEY: Clave obtenida al crear el dispositivo en la plataforma web
 * 
 * 3. Ajusta los pines según tu configuración de hardware
 * 
 * 4. Calibra el sensor de humedad según las especificaciones de tu modelo
 * 
 * 5. Sube el código a tu Arduino y monitorea el puerto serial
 */
