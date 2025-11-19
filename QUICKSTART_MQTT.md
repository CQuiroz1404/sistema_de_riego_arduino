# ⚡ Guía Rápida - Instalación y Configuración MQTT

## 🎯 Instalación en 5 Pasos

### **Paso 1: Actualizar Dependencias del Servidor**

```bash
# Ya ejecutado ✅
npm install mqtt
```

### **Paso 2: Configurar Variables de Entorno**

Crear archivo `.env` en la raíz del proyecto (o actualizar existente):

```env
# Configuración MQTT
MQTT_BROKER_URL=mqtt://broker.emqx.io:1883
MQTT_USERNAME=
MQTT_PASSWORD=

# Resto de configuración (mantener)
NODE_ENV=development
PORT=3000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=tu_password
DB_NAME=sistema_riego
JWT_SECRET=tu_secret_key
```

### **Paso 3: Instalar Librerías en Arduino IDE**

Abrir Arduino IDE → Tools → Manage Libraries:

1. **PubSubClient** (por Nick O'Leary) - Versión 2.8+
2. **ArduinoJson** (por Benoit Blanchon) - Versión 6.x
3. **WiFiS3** (ya incluida en Arduino UNO R4 WiFi)

### **Paso 4: Configurar el Sketch Arduino**

Abrir `sistema_riego_mqtt.ino` y modificar:

```cpp
// CONFIGURACIÓN - Línea 16-19
const char* WIFI_SSID = "TU_RED_WIFI";        // ⚠️ CAMBIAR
const char* WIFI_PASSWORD = "TU_PASSWORD";    // ⚠️ CAMBIAR

// Línea 28
const char* API_KEY = "tu_api_key_del_dispositivo";  // ⚠️ CAMBIAR (de la BD)

// Líneas 31-32
const int SENSOR_HUMEDAD_ID = 1;     // ⚠️ CAMBIAR según tu BD
const int SENSOR_TEMPERATURA_ID = 2;  // ⚠️ CAMBIAR según tu BD

// Líneas 39-40
const int ACTUADOR_BOMBA_ID = 1;     // ⚠️ CAMBIAR según tu BD
const int PIN_BOMBA = 7;             // ⚠️ CAMBIAR según tu conexión
```

### **Paso 5: Cargar Código al Arduino**

1. Conectar Arduino UNO R4 WiFi por USB
2. Arduino IDE → Tools → Board → Arduino UNO R4 WiFi
3. Tools → Port → Seleccionar puerto COM
4. Sketch → Upload
5. Abrir Serial Monitor (115200 baud)

---

## 🚀 Iniciar Sistema

### **Terminal 1: Iniciar Servidor Node.js**

```bash
npm start
# o para desarrollo:
npm run dev
```

**Salida esperada:**
```
═══════════════════════════════════════════════════════
  🌱 Sistema de Riego Arduino IoT - MQTT
═══════════════════════════════════════════════════════
  Servidor Local: http://localhost:3000
  Servidor Red: http://192.168.1.169:3000
  Entorno: development
  Base de datos: ✓ Conectada
  MQTT Broker: ✓ Conectado
═══════════════════════════════════════════════════════

🔌 Conectando a broker MQTT: mqtt://broker.emqx.io:1883...
✅ Conectado al broker MQTT
📡 Suscrito a tópicos MQTT: riego/+/sensores, riego/+/eventos, riego/+/ping
```

### **Terminal 2: Monitor Serial del Arduino**

```
========================================
  Sistema de Riego IoT - MQTT
  Hardware: Arduino UNO R4 WiFi
========================================

Conectando a WiFi.........
✅ WiFi conectado
   IP: 192.168.1.100
   RSSI: -65 dBm
Conectando a MQTT broker.
✅ Conectado a MQTT broker
   Broker: broker.emqx.io
📡 Suscrito a tópicos de comandos
💓 Ping enviado
📊 Sensores enviados: Humedad=65.5%, Temp=25.3°C
```

---

## ✅ Verificación Rápida

### **Checklist:**
- [ ] Paquete `mqtt` instalado en Node.js
- [ ] Variables MQTT en `.env` configuradas
- [ ] Librerías Arduino instaladas (PubSubClient, ArduinoJson)
- [ ] WiFi SSID/Password configurados en Arduino
- [ ] API_KEY configurado en Arduino (coincide con BD)
- [ ] IDs de sensores/actuadores configurados
- [ ] Servidor Node.js arrancado sin errores
- [ ] Arduino conectado a WiFi (IP asignada)
- [ ] Arduino conectado a MQTT broker
- [ ] Servidor recibe pings del Arduino
- [ ] Servidor recibe datos de sensores

---

## 🧪 Prueba de Comunicación

### **1. Verificar Recepción de Datos**

Observar logs del servidor:
```
💓 Ping recibido de Arduino Riego 1
📊 Sensor Humedad Suelo (Arduino Riego 1): 65.5 %
```

### **2. Enviar Comando desde la Web**

1. Abrir navegador: `http://localhost:3000`
2. Login con credenciales
3. Ir a dispositivos
4. Encender/Apagar bomba

**Observar en Arduino Serial Monitor:**
```
📥 Mensaje recibido [riego/d4d6b2bd.../comandos]
🎛️  Comando: Actuador 1 -> ENCENDIDO
   Pin 7 HIGH
```

### **3. Usar MQTT Explorer (Opcional)**

Descargar: http://mqtt-explorer.com/

**Configuración:**
- Host: `broker.emqx.io`
- Port: `1883`
- Username: (dejar vacío)
- Password: (dejar vacío)

**Conectar y filtrar:**
```
riego/#
```

**Visualizar mensajes en tiempo real:**
- `riego/{TU_API_KEY}/sensores`
- `riego/{TU_API_KEY}/comandos`
- `riego/{TU_API_KEY}/ping`

---

## 🐛 Problemas Comunes

### **Error: "Client connection failed"**
**Causa:** WiFi no conectado o broker inaccesible  
**Solución:**
- Verificar red 2.4GHz (no 5GHz)
- Ping a `broker.emqx.io` desde PC
- Probar con `test.mosquitto.org`

### **Error: "API Key inválida"**
**Causa:** API_KEY en Arduino no coincide con BD  
**Solución:**
- Obtener API_KEY de tabla `dispositivos`:
```sql
SELECT api_key FROM dispositivos WHERE id = 1;
```
- Copiar y pegar en Arduino (línea 28)

### **Error: "Sensor no encontrado"**
**Causa:** IDs de sensores incorrectos  
**Solución:**
- Obtener IDs de tabla `sensores`:
```sql
SELECT id, nombre, tipo FROM sensores WHERE dispositivo_id = 1;
```
- Actualizar `SENSOR_HUMEDAD_ID` y `SENSOR_TEMPERATURA_ID`

### **Error: "No compila - WiFi.h no encontrado"**
**Causa:** Librería incorrecta  
**Solución:**
- ✅ Usar `#include <WiFiS3.h>`
- ❌ NO usar `#include <WiFi.h>` o `#include <ESP8266WiFi.h>`

### **Servidor no recibe mensajes**
**Solución:**
1. Verificar que Arduino muestre "✅ Conectado a MQTT broker"
2. Revisar que API_KEY sea correcta
3. Comprobar que servidor esté suscrito a `riego/+/sensores`
4. Usar MQTT Explorer para verificar publicación

---

## 📊 Obtener IDs desde la Base de Datos

### **API Key del Dispositivo:**
```sql
SELECT id, nombre, api_key FROM dispositivos WHERE nombre = 'Arduino Riego 1';
```

### **IDs de Sensores:**
```sql
SELECT id, nombre, tipo, pin 
FROM sensores 
WHERE dispositivo_id = 1;
```

**Ejemplo de salida:**
```
+----+------------------+---------------+------+
| id | nombre           | tipo          | pin  |
+----+------------------+---------------+------+
|  1 | Humedad Suelo    | humedad_suelo | A0   |
|  2 | Temperatura      | temperatura   | 2    |
+----+------------------+---------------+------+
```

### **IDs de Actuadores:**
```sql
SELECT id, nombre, tipo, pin 
FROM actuadores 
WHERE dispositivo_id = 1;
```

**Ejemplo de salida:**
```
+----+-----------------+-------+------+
| id | nombre          | tipo  | pin  |
+----+-----------------+-------+------+
|  1 | Bomba de Riego  | bomba | 7    |
+----+-----------------+-------+------+
```

---

## 🔄 Reiniciar Sistema

### **Reiniciar Servidor:**
```bash
# Ctrl + C (detener)
npm start
```

### **Reiniciar Arduino:**
1. Presionar botón RESET en Arduino
2. O reconectar USB
3. Esperar ~10 segundos para conexión completa

---

## 📞 Soporte

Si encuentras problemas:

1. **Revisar logs del servidor:** Buscar errores en consola
2. **Revisar Serial Monitor:** Arduino debe mostrar "✅ Conectado"
3. **Usar MQTT Explorer:** Verificar publicación de mensajes
4. **Revisar documentación completa:** `MQTT_MIGRATION.md`

---

## 🎉 ¡Listo!

Tu sistema de riego IoT con MQTT está funcionando. Los datos de sensores se reciben en tiempo real y los comandos se envían instantáneamente al Arduino.

**Próximo paso:** Configurar broker MQTT privado para producción (ver `MQTT_MIGRATION.md`).
