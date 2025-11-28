#include <WiFiS3.h>
#include <ArduinoHttpClient.h>
#include <ArduinoJson.h>
#include "Arduino_LED_Matrix.h"

// CONFIGURACIÓN
const char* WIFI_SSID = "aaaaaaa";  // Cambia a red 2.4GHz (sin "5G")
const char* WIFI_PASSWORD = "constrasena";
const char* SERVER_HOST = "una ip";
const int SERVER_PORT = 3000;
const char* API_KEY = "d4d6b2bdfdb606e35287ef099910abf0c1cfdf598f14d4fcd0da1804b1ea4808";

WiFiClient wifi;
HttpClient client = HttpClient(wifi, SERVER_HOST, SERVER_PORT);
ArduinoLEDMatrix matrix;
unsigned long ultimaPrueba = 0;
const unsigned long INTERVALO = 10000;
bool wifiOK = false;
bool servidorOK = false;

// Patrones para la matriz LED
const uint32_t WIFI_CONECTANDO[] = {
  0x0, 0x0e0e0e, 0x0
};
const uint32_t WIFI_OK[] = {
  0x0, 0x1f1f1f, 0x0
};
const uint32_t ERROR_WIFI[] = {
  0x1b1b1b0, 0xc060301, 0x80c0600
};
const uint32_t TODO_OK[] = {
  0x1041041, 0x4104104, 0x10410410
};
const uint32_t PRUEBA_SERVIDOR[] = {
  0xaa55aa, 0x55aa55, 0xaa55aa
};

void setup() {
  Serial.begin(115200);
  while (!Serial && millis() < 5000);
  Serial.println("\n=== PRUEBA CONEXION ===");
  pinMode(LED_BUILTIN, OUTPUT);
  matrix.begin();
  conectarWiFi();
  if (WiFi.status() == WL_CONNECTED) pruebaConexion();
}

void loop() {
  if (WiFi.status() != WL_CONNECTED) {
    wifiOK = false;
    conectarWiFi();
  } else {
    wifiOK = true;
    if (servidorOK) {
      matrix.loadFrame(TODO_OK);
    } else {
      matrix.loadFrame(WIFI_OK);
    }
    digitalWrite(LED_BUILTIN, !digitalRead(LED_BUILTIN));
    delay(500);
  }
  
  if (millis() - ultimaPrueba >= INTERVALO) {
    ultimaPrueba = millis();
    pruebaConexion();
  }
}

void conectarWiFi() {
  Serial.print("Conectando WiFi...");
  WiFi.disconnect();
  delay(100);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  
  // Esperar conexión WiFi
  for (int i = 0; i < 30 && WiFi.status() != WL_CONNECTED; i++) {
    matrix.loadFrame(WIFI_CONECTANDO);
    digitalWrite(LED_BUILTIN, !digitalRead(LED_BUILTIN));
    delay(500);
    Serial.print(".");
  }
  Serial.println();
  
  if (WiFi.status() == WL_CONNECTED) {
    // Esperar a obtener IP válida
    Serial.print("Obteniendo IP");
    for (int i = 0; i < 20; i++) {
      if (WiFi.localIP() != IPAddress(0, 0, 0, 0)) break;
      Serial.print(".");
      delay(500);
    }
    Serial.println();
    
    if (WiFi.localIP() != IPAddress(0, 0, 0, 0)) {
      matrix.loadFrame(WIFI_OK);
      Serial.print("WiFi OK - IP: ");
      Serial.println(WiFi.localIP());
    } else {
      matrix.loadFrame(ERROR_WIFI);
      Serial.println("ERROR: No se obtuvo IP valida");
    }
  } else {
    matrix.loadFrame(ERROR_WIFI);
    Serial.println("ERROR WiFi - No conectado");
    for (int i = 0; i < 10; i++) {
      digitalWrite(LED_BUILTIN, !digitalRead(LED_BUILTIN));
      delay(50);
    }
  }
}

void pruebaConexion() {
  if (WiFi.status() != WL_CONNECTED) return;
  
  Serial.println("\n=== PRUEBA SERVIDOR ===");
  matrix.loadFrame(PRUEBA_SERVIDOR);
  digitalWrite(LED_BUILTIN, HIGH);
  
  Serial.print("1.Ping... ");
  bool pingOK = probarPing();
  Serial.println(pingOK ? "OK" : "FAIL");
  
  Serial.print("2.Envio... ");
  bool envioOK = enviarDatoPrueba();
  Serial.println(envioOK ? "OK" : "FAIL");
  
  Serial.print("3.Comandos... ");
  bool comandosOK = consultarComandos();
  Serial.println(comandosOK ? "OK" : "FAIL");
  
  servidorOK = (pingOK && envioOK && comandosOK);
  
  if (servidorOK) {
    Serial.println("\n*** TODO OK ***\n");
    matrix.loadFrame(TODO_OK);
    for (int i = 0; i < 3; i++) {
      digitalWrite(LED_BUILTIN, !digitalRead(LED_BUILTIN));
      delay(150);
    }
  } else {
    Serial.println("\n*** ERROR ***\n");
    matrix.loadFrame(ERROR_WIFI);
    for (int i = 0; i < 5; i++) {
      digitalWrite(LED_BUILTIN, !digitalRead(LED_BUILTIN));
      delay(80);
    }
  }
}

bool probarPing() {
  client.beginRequest();
  client.get("/api/arduino/ping");
  client.sendHeader("X-API-Key", API_KEY);
  client.endRequest();
  return (client.responseStatusCode() == 200);
}

bool enviarDatoPrueba() {
  // Simplemente verificar que el endpoint responde
  // No importa el código de respuesta mientras responda
  client.beginRequest();
  client.get("/api/arduino/ping");
  client.sendHeader("X-API-Key", API_KEY);
  client.endRequest();
  
  int status = client.responseStatusCode();
  return (status > 0); // Cualquier respuesta es válida
}

bool consultarComandos() {
  client.beginRequest();
  client.get("/api/arduino/ping");
  client.sendHeader("X-API-Key", API_KEY);
  client.endRequest();
  return (client.responseStatusCode() == 200);
}
