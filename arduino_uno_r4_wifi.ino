/*
 * PRUEBA DE CONEXIÓN - Arduino UNO R4 WiFi + Plataforma Web
 * 
 * Este código SOLO prueba la conexión WiFi y comunicación con el servidor.
 * NO requiere sensores ni actuadores conectados.
 * 
 * Realiza pruebas automáticas cada 10 segundos:
 * 1. Ping al servidor
 * 2. Envío de dato simulado
 * 3. Consulta de comandos
 */

#include <WiFiS3.h>  // Librería WiFi para UNO R4 WiFi
#include <ArduinoHttpClient.h>
#include <ArduinoJson.h>

// ============================================
// CONFIGURACIÓN - MODIFICA ESTOS VALORES
// ============================================
const char* WIFI_SSID = "TU_WIFI_SSID";          // Nombre de tu red WiFi
const char* WIFI_PASSWORD = "TU_WIFI_PASSWORD";   // Contraseña de tu WiFi
const char* SERVER_HOST = "192.168.1.169";        // IP de tu PC (ejecuta: ipconfig)
const int SERVER_PORT = 3000;                     // Puerto del servidor
const char* API_KEY = "TU_API_KEY_AQUI";         // API Key de tu dispositivo

// Variables de control
WiFiClient wifi;
HttpClient client = HttpClient(wifi, SERVER_HOST, SERVER_PORT);
unsigned long ultimaPrueba = 0;
const unsigned long INTERVALO_PRUEBA = 10000;  // Prueba cada 10 segundos

// ============================================
// SETUP
// ============================================
void setup() {
  Serial.begin(115200);
  while (!Serial && millis() < 5000);
  
  Serial.println("\n╔════════════════════════════════════════╗");
  Serial.println("║  PRUEBA DE CONEXIÓN                    ║");
  Serial.println("║  Arduino UNO R4 WiFi ↔ Servidor Web    ║");
  Serial.println("╚════════════════════════════════════════╝\n");
  
  pinMode(LED_BUILTIN, OUTPUT);
  
  // Conectar WiFi
  conectarWiFi();
  
  if (WiFi.status() == WL_CONNECTED) {
    // Prueba inicial completa
    pruebaConexion();
  }
}

// ============================================
// LOOP
// ============================================
void loop() {
  // Verificar WiFi
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("⚠ WiFi desconectado. Reconectando...");
    digitalWrite(LED_BUILTIN, LOW);
    conectarWiFi();
  } else {
    digitalWrite(LED_BUILTIN, HIGH);
  }
  
  // Realizar prueba cada intervalo
  unsigned long ahora = millis();
  if (ahora - ultimaPrueba >= INTERVALO_PRUEBA) {
    ultimaPrueba = ahora;
    pruebaConexion();
  }
  
  delay(1000);
}

// ============================================
// CONECTAR WIFI
// ============================================
void conectarWiFi() {
  Serial.print("📡 Conectando a: ");
  Serial.println(WIFI_SSID);
  
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
    Serial.println("✓ WiFi CONECTADO");
    Serial.print("   IP Arduino: ");
    Serial.println(WiFi.localIP());
    Serial.print("   Señal: ");
    Serial.print(WiFi.RSSI());
    Serial.println(" dBm\n");
  } else {
    Serial.println("✗ ERROR: No se pudo conectar\n");
  }
}

// ============================================
// PRUEBA DE CONEXIÓN CON SERVIDOR
// ============================================
void pruebaConexion() {
  if (WiFi.status() != WL_CONNECTED) {
    return;
  }
  
  Serial.println("═══════════════════════════════════════");
  Serial.println("🔍 INICIANDO PRUEBA DE CONEXIÓN");
  Serial.println("═══════════════════════════════════════");
  
  // 1. Ping al servidor
  Serial.println("\n1️⃣ Probando Ping...");
  bool pingOK = probarPing();
  
  // 2. Enviar dato de prueba
  Serial.println("\n2️⃣ Enviando dato de prueba...");
  bool envioOK = enviarDatoPrueba();
  
  // 3. Consultar comandos
  Serial.println("\n3️⃣ Consultando comandos...");
  bool comandosOK = consultarComandos();
  
  // Resultado
  Serial.println("\n═══════════════════════════════════════");
  Serial.println("📊 RESULTADO DE LA PRUEBA:");
  Serial.print("   Ping: ");
  Serial.println(pingOK ? "✓ OK" : "✗ FALLO");
  Serial.print("   Envío de datos: ");
  Serial.println(envioOK ? "✓ OK" : "✗ FALLO");
  Serial.print("   Consulta comandos: ");
  Serial.println(comandosOK ? "✓ OK" : "✗ FALLO");
  
  if (pingOK && envioOK && comandosOK) {
    Serial.println("\n🎉 CONEXIÓN EXITOSA - Todo funciona!");
    parpadearLED(3, 200);  // 3 parpadeos rápidos
  } else {
    Serial.println("\n⚠ HAY PROBLEMAS - Revisa la configuración");
    parpadearLED(5, 100);  // 5 parpadeos muy rápidos
  }
  Serial.println("═══════════════════════════════════════\n");
}

// ============================================
// PROBAR PING
// ============================================
bool probarPing() {
  client.beginRequest();
  client.get("/api/arduino/ping");
  client.sendHeader("X-API-Key", API_KEY);
  client.endRequest();
  
  int statusCode = client.responseStatusCode();
  String response = client.responseBody();
  
  Serial.print("   Código HTTP: ");
  Serial.println(statusCode);
  Serial.print("   Respuesta: ");
  Serial.println(response);
  
  return (statusCode == 200);
}

// ============================================
// ENVIAR DATO DE PRUEBA
// ============================================
bool enviarDatoPrueba() {
  // Crear JSON con dato simulado
  StaticJsonDocument<200> doc;
  doc["sensor_id"] = 1;  // ID ficticio
  doc["valor"] = 75.5;   // Valor de prueba
  
  String jsonData;
  serializeJson(doc, jsonData);
  
  Serial.print("   Enviando: ");
  Serial.println(jsonData);
  
  // Hacer POST
  client.beginRequest();
  client.post("/api/arduino/data");
  client.sendHeader("Content-Type", "application/json");
  client.sendHeader("X-API-Key", API_KEY);
  client.sendHeader("Content-Length", jsonData.length());
  client.beginBody();
  client.print(jsonData);
  client.endRequest();
  
  int statusCode = client.responseStatusCode();
  String response = client.responseBody();
  
  Serial.print("   Código HTTP: ");
  Serial.println(statusCode);
  Serial.print("   Respuesta: ");
  Serial.println(response);
  
  return (statusCode == 200 || statusCode == 201);
}

// ============================================
// CONSULTAR COMANDOS
// ============================================
bool consultarComandos() {
  String url = "/api/arduino/commands?api_key=" + String(API_KEY);
  
  client.beginRequest();
  client.get(url);
  client.endRequest();
  
  int statusCode = client.responseStatusCode();
  String response = client.responseBody();
  
  Serial.print("   Código HTTP: ");
  Serial.println(statusCode);
  Serial.print("   Respuesta: ");
  Serial.println(response);
  
  if (statusCode == 200) {
    // Intentar parsear JSON
    StaticJsonDocument<1024> doc;
    DeserializationError error = deserializeJson(doc, response);
    
    if (!error) {
      Serial.println("   ✓ JSON válido recibido");
      return true;
    }
  }
  
  return (statusCode == 200);
}

// ============================================
// PARPADEAR LED
// ============================================
void parpadearLED(int veces, int duracion) {
  for (int i = 0; i < veces; i++) {
    digitalWrite(LED_BUILTIN, LOW);
    delay(duracion);
    digitalWrite(LED_BUILTIN, HIGH);
    delay(duracion);
  }
}

/*
 * ═══════════════════════════════════════════════════════════════
 * INSTRUCCIONES DE USO
 * ═══════════════════════════════════════════════════════════════
 * 
 * 1. CONFIGURAR WIFI:
 *    - Cambia WIFI_SSID por el nombre de tu red
 *    - Cambia WIFI_PASSWORD por tu contraseña
 * 
 * 2. OBTENER IP DE TU PC:
 *    - Abre PowerShell/CMD
 *    - Ejecuta: ipconfig
 *    - Busca "IPv4 Address" de tu red WiFi
 *    - Ejemplo: 192.168.1.169
 *    - Cambia SERVER_HOST con esa IP (ya está puesta: 192.168.1.169)
 * 
 * 3. OBTENER API KEY:
 *    - Abre: http://localhost:3000
 *    - Login: admin@sistemariego.com / admin123
 *    - Menú: Dispositivos > Nuevo Dispositivo
 *    - Llena el formulario
 *    - Copia el API Key generado
 *    - Pégalo en API_KEY
 * 
 * 4. INSTALAR LIBRERÍAS:
 *    Arduino IDE > Sketch > Include Library > Manage Libraries
 *    - WiFiS3 (ya viene instalada)
 *    - ArduinoHttpClient
 *    - ArduinoJson (v6.x)
 * 
 * 5. SUBIR CÓDIGO:
 *    - Tools > Board > Arduino UNO R4 WiFi
 *    - Tools > Port > (tu puerto)
 *    - Click Upload
 * 
 * 6. VER RESULTADOS:
 *    - Tools > Serial Monitor
 *    - Baud rate: 115200
 *    - Verás las pruebas cada 10 segundos
 * 
 * INTERPRETACIÓN DE RESULTADOS:
 * 
 * ✓ TODO OK = Los 3 tests pasan
 *   → La conexión funciona correctamente
 *   → Puedes proceder a agregar sensores
 * 
 * ✗ FALLA PING = Problema de red o servidor
 *   → Verifica que el servidor esté corriendo (npm run dev)
 *   → Verifica la IP y puerto
 *   → Verifica firewall de Windows
 * 
 * ✗ FALLA ENVÍO = Problema con API Key o ruta
 *   → Verifica que el API Key sea correcto
 *   → Verifica que el dispositivo exista en la BD
 * 
 * ✗ FALLA COMANDOS = Problema de autenticación
 *   → Verifica el API Key
 *   → Verifica que la ruta /api/arduino/commands funcione
 * 
 * ═══════════════════════════════════════════════════════════════
 */
