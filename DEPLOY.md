# 🚀 Despliegue Rápido - Sistema de Riego MQTT

## ⏱️ Tiempo Estimado: 15 minutos

---

## 📋 Pre-requisitos

✅ Node.js v14+ instalado  
✅ Arduino IDE instalado  
✅ Arduino UNO R4 WiFi conectado por USB  
✅ Red WiFi 2.4GHz disponible  
✅ MySQL/MariaDB ejecutándose  
✅ Base de datos `sistema_riego` configurada  

---

## 🎯 Paso 1: Configurar Servidor Node.js (5 min)

### **1.1. Instalar Dependencias**
```bash
cd sistema_de_riego_arduino
npm install
```

**Salida esperada:**
```
added 47 packages, and audited 198 packages in 6s
26 packages are looking for funding
found 0 vulnerabilities
```

### **1.2. Configurar Variables de Entorno**

Crear archivo `.env` en la raíz (copiar de `.env.example`):

```bash
# Windows PowerShell
Copy-Item .env.example .env
notepad .env

# Linux/Mac
cp .env.example .env
nano .env
```

**Editar con tus valores:**
```env
# Base de datos
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=TU_PASSWORD_AQUI
DB_NAME=sistema_riego

# MQTT
MQTT_BROKER_URL=mqtt://broker.emqx.io:1883
MQTT_USERNAME=
MQTT_PASSWORD=

# JWT
JWT_SECRET=clave_secreta_muy_segura_cambiar_aqui
```

### **1.3. Verificar Base de Datos**

```sql
-- Conectar a MySQL
mysql -u root -p

-- Verificar BD
USE sistema_riego;
SHOW TABLES;

-- Obtener API_KEY de dispositivo
SELECT id, nombre, api_key FROM dispositivos;

-- Obtener IDs de sensores
SELECT id, nombre, tipo, pin FROM sensores WHERE dispositivo_id = 1;

-- Obtener IDs de actuadores
SELECT id, nombre, tipo, pin FROM actuadores WHERE dispositivo_id = 1;
```

**Anotar:**
- API_KEY del dispositivo: `______________________________`
- ID Sensor Humedad: `____`
- ID Sensor Temperatura: `____`
- ID Actuador Bomba: `____`
- Pin Bomba: `____`

---

## 🤖 Paso 2: Configurar Arduino (5 min)

### **2.1. Instalar Librerías**

Arduino IDE → Tools → Manage Libraries

Buscar e instalar:
1. **PubSubClient** (por Nick O'Leary) - Versión 2.8.0+
2. **ArduinoJson** (por Benoit Blanchon) - Versión 6.21.0+

### **2.2. Abrir Sketch**

Archivo → Abrir → `sistema_riego_mqtt.ino`

### **2.3. Configurar Credenciales**

Editar líneas 16-41:

```cpp
// WiFi (Línea 16-17)
const char* WIFI_SSID = "TU_RED_WIFI_2.4GHZ";
const char* WIFI_PASSWORD = "TU_PASSWORD_WIFI";

// API Key (Línea 28) - COPIAR DE LA BASE DE DATOS
const char* API_KEY = "tu_api_key_de_64_caracteres_aqui";

// IDs de Sensores (Línea 31-32) - COPIAR DE LA BASE DE DATOS
const int SENSOR_HUMEDAD_ID = 1;      // Cambiar por tu ID
const int SENSOR_TEMPERATURA_ID = 2;  // Cambiar por tu ID

// Actuadores (Línea 39-40) - COPIAR DE LA BASE DE DATOS
const int ACTUADOR_BOMBA_ID = 1;  // Cambiar por tu ID
const int PIN_BOMBA = 7;          // Cambiar según tu conexión física
```

### **2.4. Compilar y Cargar**

1. Tools → Board → **Arduino UNO R4 WiFi**
2. Tools → Port → Seleccionar puerto COM del Arduino
3. Sketch → **Upload** (Ctrl+U)

**Esperar compilación (~1 minuto):**
```
Sketch uses XXXXX bytes (XX%) of program storage space.
Global variables use XXXXX bytes (XX%) of dynamic memory.
```

---

## 🚀 Paso 3: Iniciar Sistema (2 min)

### **3.1. Iniciar Servidor**

**Terminal 1:**
```bash
npm start
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

### **3.2. Monitorear Arduino**

Arduino IDE → Tools → **Serial Monitor** (Ctrl+Shift+M)

Configurar: **115200 baud**

**Salida esperada:**
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
```

**En el servidor deberías ver:**
```
💓 Ping recibido de Arduino Riego 1
```

---

## ✅ Paso 4: Verificar Funcionamiento (3 min)

### **4.1. Verificar Recepción de Sensores**

**Observar Serial Monitor (cada 10 segundos):**
```
📊 Sensores enviados: Humedad=65.5%, Temp=25.3°C
```

**Observar Servidor:**
```
📊 Sensor Humedad Suelo (Arduino Riego 1): 65.5 %
📊 Sensor Temperatura (Arduino Riego 1): 25.3 °C
```

### **4.2. Probar Control de Actuadores**

**Navegador:** http://localhost:3000

1. Login con credenciales
2. Ir a "Dispositivos"
3. Seleccionar tu dispositivo
4. Click en **"Encender Bomba"**

**Observar Serial Monitor:**
```
📥 Mensaje recibido [riego/d4d6b2bd.../comandos]
🎛️  Comando: Actuador 1 -> ENCENDIDO
   Pin 7 HIGH
```

**Observar Servidor:**
```
🎛️  Comando enviado a Arduino Riego 1: Actuador Bomba de Riego -> encendido
```

### **4.3. Verificar en Base de Datos**

```sql
-- Ver lecturas recientes
SELECT * FROM lecturas_sensores 
ORDER BY fecha_hora DESC 
LIMIT 10;

-- Ver eventos de actuadores
SELECT * FROM eventos_actuador 
ORDER BY fecha_hora DESC 
LIMIT 10;
```

---

## 🎉 ¡Sistema Funcionando!

Si ves:
- ✅ Servidor conectado a MQTT
- ✅ Arduino conectado a WiFi y MQTT
- ✅ Ping recibido en servidor
- ✅ Datos de sensores llegando cada 10s
- ✅ Comandos funcionando desde la web

**¡Felicidades! El sistema está operativo.**

---

## 🐛 Troubleshooting Rápido

### **Problema: Arduino no conecta a WiFi**
```cpp
// Verificar SSID y password
const char* WIFI_SSID = "TU_RED_2.4GHZ";  // ⚠️ Debe ser 2.4GHz, NO 5GHz
const char* WIFI_PASSWORD = "password";    // ⚠️ Sin espacios
```

**Solución:**
- Confirmar red es 2.4GHz
- Verificar contraseña correcta
- Acercar Arduino al router

### **Problema: Arduino no conecta a MQTT**
**Serial Monitor muestra:**
```
❌ Error: -2
```

**Códigos de error PubSubClient:**
- `-2`: Conexión rechazada (broker inaccesible)
- `-3`: Conexión perdida
- `-4`: Timeout de conexión

**Solución:**
- Verificar WiFi conectado primero
- Ping a `broker.emqx.io` desde PC
- Probar con `test.mosquitto.org` en línea 22

### **Problema: Servidor no recibe datos**
**Servidor muestra:**
```
⚠️  Mensaje rechazado: API Key inválida
```

**Solución:**
```sql
-- Obtener API_KEY correcta
SELECT api_key FROM dispositivos WHERE id = 1;
-- Copiar EXACTAMENTE al Arduino (64 caracteres)
```

### **Problema: Comandos no llegan al Arduino**
**Verificar suscripción:**
```cpp
// Serial Monitor debe mostrar al inicio:
📡 Suscrito a tópicos de comandos
```

**Si no aparece:**
1. Verificar conexión MQTT exitosa primero
2. Revisar que `client.loop()` se ejecute en loop()
3. Reiniciar Arduino (botón RESET)

### **Problema: Error de compilación Arduino**
```
'WiFi' was not declared in this scope
```

**Causa:** Librería WiFi incorrecta

**Solución:**
```cpp
// ✅ CORRECTO (Arduino UNO R4 WiFi)
#include <WiFiS3.h>

// ❌ INCORRECTO
#include <WiFi.h>
#include <ESP8266WiFi.h>
```

---

## 📊 Monitoreo Opcional con MQTT Explorer

### **Descargar:**
http://mqtt-explorer.com/

### **Configurar:**
1. Host: `broker.emqx.io`
2. Port: `1883`
3. Click **"Connect"**

### **Filtrar Tópicos:**
En la barra de búsqueda:
```
riego/#
```

### **Visualizar:**
- `riego/{TU_API_KEY}/sensores` → Datos en tiempo real
- `riego/{TU_API_KEY}/comandos` → Comandos enviados
- `riego/{TU_API_KEY}/ping` → Heartbeat del Arduino

---

## 🔧 Comandos Útiles

### **Reiniciar Servidor**
```bash
# Ctrl+C para detener
npm start
```

### **Ver Logs en Tiempo Real**
```bash
npm run dev  # Con nodemon (auto-reload)
```

### **Limpiar Consola Arduino**
```
Serial Monitor → Click derecho → Clear Output
```

### **Verificar Puerto Arduino**
```bash
# Windows PowerShell
Get-PnpDevice -Class Ports

# Linux
ls /dev/ttyUSB* /dev/ttyACM*

# Mac
ls /dev/cu.*
```

---

## 📚 Documentación Completa

- **Guía Completa:** `MQTT_MIGRATION.md`
- **Inicio Rápido:** `QUICKSTART_MQTT.md`
- **Arquitectura:** `ARCHITECTURE_MQTT.md`
- **Changelog:** `CHANGELOG_MQTT.md`

---

## 🎯 Próximos Pasos

### **Optimización**
1. Ajustar intervalos de sensores según necesidad
2. Calibrar umbrales de riego automático
3. Configurar alertas por email/SMS

### **Producción**
1. Instalar broker MQTT privado (Mosquitto)
2. Implementar autenticación MQTT
3. Habilitar TLS/SSL
4. Deploy en servidor cloud

### **Expansión**
1. Agregar más dispositivos Arduino
2. Implementar dashboard en tiempo real
3. Integrar con servicios externos
4. Mobile app (React Native)

---

**¡Sistema listo para producción!** 🎉
