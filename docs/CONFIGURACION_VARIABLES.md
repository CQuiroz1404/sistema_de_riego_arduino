# ⚙️ CONFIGURACIÓN RÁPIDA - sistema_riego_mqtt.ino

## 📋 Variables que DEBES cambiar (líneas 29-50)

### **1. WiFi (Líneas 29-31)**
```cpp
const char* WIFI_SSID = "TU_RED_WIFI_2.4GHZ";     // ← CAMBIAR
const char* WIFI_PASSWORD = "TU_PASSWORD_WIFI";   // ← CAMBIAR
```

**Cómo obtenerlos:**
- SSID: Nombre de tu red WiFi (⚠️ Debe ser 2.4GHz, NO 5GHz)
- Password: Contraseña de tu WiFi

---

### **2. MQTT Broker (Líneas 39-42)**

#### **Opción A: Broker Público (Para empezar)**
```cpp
const char* MQTT_BROKER = "broker.emqx.io";
const int MQTT_PORT = 1883;
const char* MQTT_USER = "";
const char* MQTT_PASSWORD = "";
```
✅ Funciona de inmediato, sin configuración

#### **Opción B: EMQX Cloud Privado (Recomendado)**
```cpp
const char* MQTT_BROKER = "c5bxxxxx.emqxsl.com";  // ← CAMBIAR
const int MQTT_PORT = 1883;
const char* MQTT_USER = "arduino_riego";          // ← CAMBIAR
const char* MQTT_PASSWORD = "MiPassword123";      // ← CAMBIAR
```

**Cómo obtenerlos:**
1. Ir a: https://www.emqx.com/en/cloud
2. Crear cuenta y deployment gratuito
3. En dashboard → **Overview**:
   - Copiar "Connection Address" (ej: c5bxxxxx.emqxsl.com)
4. En dashboard → **Authentication** → Add:
   - Username: `arduino_riego`
   - Password: `MiPassword123` (el que tú elijas)

---

### **3. API Key (Línea 45)**
```cpp
const char* API_KEY = "TU_API_KEY_DE_64_CARACTERES_AQUI";  // ← CAMBIAR
```

**Cómo obtenerla:**
```sql
-- Conectar a MySQL
mysql -u root -p

-- Usar la base de datos
USE sistema_riego;

-- Obtener API Key
SELECT id, nombre, api_key FROM dispositivos;
```

**Resultado:**
```
+----+------------------+------------------------------------------------------------------+
| id | nombre           | api_key                                                          |
+----+------------------+------------------------------------------------------------------+
|  1 | Arduino Riego 1  | d4d6b2bdfdb606e35287ef099910abf0c1cfdf598f14d4fcd0da1804b1ea4808 |
+----+------------------+------------------------------------------------------------------+
```
→ Copiar el valor de `api_key` (64 caracteres)

---

### **4. ID del Sensor de Temperatura (Línea 49)**
```cpp
const int SENSOR_TEMPERATURA_ID = 2;  // ← CAMBIAR
```

**Cómo obtenerlo:**
```sql
SELECT id, nombre, tipo FROM sensores WHERE dispositivo_id = 1;
```

**Resultado:**
```
+----+------------------+-------------+
| id | nombre           | tipo        |
+----+------------------+-------------+
|  2 | Temperatura      | temperatura |
+----+------------------+-------------+
```
→ Usar el valor de `id` (ej: 2)

---

### **5. Actuador (Líneas 53-54)**
```cpp
const int ACTUADOR_BOMBA_ID = 1;  // ← CAMBIAR
const int PIN_BOMBA = 7;          // ← CAMBIAR
```

**Cómo obtenerlos:**
```sql
SELECT id, nombre, pin FROM actuadores WHERE dispositivo_id = 1;
```

**Resultado:**
```
+----+-----------------+------+
| id | nombre          | pin  |
+----+-----------------+------+
|  1 | Bomba de Riego  | 7    |
+----+-----------------+------+
```
- `ACTUADOR_BOMBA_ID`: Usar el valor de `id` (ej: 1)
- `PIN_BOMBA`: Usar el pin físico donde conectaste la bomba (ej: 7)

---

## ✅ Checklist Final

Antes de cargar el código:

- [ ] WiFi SSID configurado (red 2.4GHz)
- [ ] WiFi Password configurado
- [ ] MQTT Broker configurado (público o EMQX Cloud)
- [ ] MQTT User/Password configurados (si usas EMQX Cloud)
- [ ] API Key obtenida de la base de datos
- [ ] Sensor Temperature ID obtenido de la base de datos
- [ ] Actuador Bomba ID obtenido de la base de datos
- [ ] Pin Bomba según tu conexión física

---

## 🎯 Configuración Mínima (Para probar rápido)

Si solo quieres probar que el sensor funciona:

```cpp
// 1. WiFi
const char* WIFI_SSID = "MiWiFi";
const char* WIFI_PASSWORD = "MiPassword";

// 2. MQTT (broker público)
const char* MQTT_BROKER = "broker.emqx.io";
const int MQTT_PORT = 1883;
const char* MQTT_USER = "";
const char* MQTT_PASSWORD = "";

// 3. Dejar el resto como está temporalmente
// (Luego actualizar con datos reales de la BD)
```

---

## 🚀 Cargar al Arduino

1. **Abrir Arduino IDE**
2. **Tools → Board → Arduino UNO R4 WiFi**
3. **Tools → Port → Seleccionar COM**
4. **Sketch → Upload** (Ctrl+U)
5. **Tools → Serial Monitor** (Ctrl+Shift+M)
6. Configurar: **115200 baud**

---

## 📊 Salida Esperada (Serial Monitor)

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
   Broker: broker.emqx.io  (o tu EMQX Cloud)
📡 Suscrito a tópicos de comandos
💓 Ping enviado

--- LECTURA DE SENSORES ---
🌡️  Temperatura LM35DZ/CZ (A1):
   ADC Raw: 512 | Voltaje: 2.500V | Temp: 25.0°C

📤 JSON a enviar: {"sensores":[{"sensor_id":2,"valor":25.0}]}
✅ Datos publicados exitosamente por MQTT
```

---

## 🆘 Problemas Comunes

### **Error: WiFi no conecta**
```
❌ Error: No se pudo conectar a WiFi
```
**Solución:**
- Verificar SSID correcto
- Verificar password correcto
- Confirmar red es 2.4GHz (NO 5GHz)
- Acercar Arduino al router

### **Error: MQTT no conecta**
```
❌ Error: -2
```
**Solución:**
- Si usas EMQX Cloud: verificar usuario/password
- Verificar que Arduino tenga internet
- Probar primero con `broker.emqx.io` (público)

### **Error: Compilación**
```
'WiFiS3.h' file not found
```
**Solución:**
- Verificar que Board sea "Arduino UNO R4 WiFi"
- Actualizar Arduino IDE a última versión
- Instalar "Arduino UNO R4 Boards" en Board Manager

---

## 📞 Ayuda Adicional

Ver documentación completa:
- `MQTT_MIGRATION.md` - Guía técnica completa
- `QUICKSTART_MQTT.md` - Inicio rápido
- `SENSOR_LM35CZ.md` - Configuración del sensor
- `DIAGNOSTICO_SENSORES.md` - Troubleshooting sensores

---

**✅ Una vez configurado, el código está listo para funcionar!** 🎉
