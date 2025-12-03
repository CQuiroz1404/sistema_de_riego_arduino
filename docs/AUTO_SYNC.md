# 🔄 Sistema de Auto-Sincronización Arduino ↔️ Servidor

## 🎯 Problema Resuelto

**ANTES:** Usuario necesitaba:
1. Crear dispositivo en web → Obtener ID
2. Crear sensores en web → Copiar IDs manualmente
3. Editar código Arduino con cada ID
4. Re-flashear Arduino cada vez que cambiaba configuración

**AHORA:** Usuario solo necesita:
1. ✅ Crear dispositivo en web
2. ✅ Copiar API_KEY al sketch
3. ✅ Configurar WiFi
4. ✅ **¡LISTO! Todo se sincroniza automáticamente**

---

## 🚀 Flujo de Auto-Sincronización

```
┌─────────────────────────────────────────────────────────────────┐
│                  SETUP - PRIMERA CONEXIÓN                       │
└─────────────────────────────────────────────────────────────────┘

Arduino                    Servidor Web                 Base de Datos
  │                             │                            │
  │ 1. Conectar WiFi           │                            │
  ├──────────────────────────► │                            │
  │                             │                            │
  │ 2. Conectar MQTT            │                            │
  ├──────────────────────────► │                            │
  │                             │                            │
  │ 3. GET /api/arduino/sync    │                            │
  │    + API_KEY en header      │                            │
  ├──────────────────────────► │                            │
  │                             │ 4. Verificar API_KEY       │
  │                             ├──────────────────────────► │
  │                             │                            │
  │                             │ 5. Buscar dispositivo      │
  │                             │    + sensores + actuadores │
  │                             │ ◄──────────────────────────┤
  │                             │                            │
  │                             │ 6. Si sensores NO existen  │
  │                             │    (auto-provisioning):    │
  │                             │    - Crear temp DHT11      │
  │                             │    - Crear humedad DHT11   │
  │                             │    - Crear nivel agua      │
  │                             ├──────────────────────────► │
  │                             │                            │
  │ ◄──────────────────────────┤ 7. Respuesta JSON:         │
  │ {                           │    {                       │
  │   "sensores": {             │      "sensores": {...},    │
  │     "D2_temperatura": {     │      "configuracion": {...}│
  │       "sensor_id": 123      │    }                       │
  │     },                      │                            │
  │     "A2_nivel_agua": {      │                            │
  │       "sensor_id": 125      │                            │
  │     }                       │                            │
  │   },                        │                            │
  │   "configuracion": {        │                            │
  │     "humedad_min": 55.0,    │                            │
  │     "humedad_max": 70.0     │                            │
  │   }                         │                            │
  │ }                           │                            │
  │                             │                            │
  │ 8. Guardar IDs en memoria   │                            │
  │    sensor_temp_id = 123     │                            │
  │    sensor_agua_id = 125     │                            │
  │    HUM_ON = 55.0            │                            │
  │    HUM_OFF = 70.0           │                            │
  │                             │                            │
  │ 9. ✅ SINCRONIZADO          │                            │


┌─────────────────────────────────────────────────────────────────┐
│              OPERACIÓN NORMAL - ENVÍO DE DATOS                  │
└─────────────────────────────────────────────────────────────────┘

Arduino                    MQTT Broker                Base de Datos
  │                             │                            │
  │ 1. Leer sensores            │                            │
  │    T: 24°C, H: 60%          │                            │
  │                             │                            │
  │ 2. MQTT Publish             │                            │
  │    riego/{API_KEY}/sensores │                            │
  │    {                        │                            │
  │      "sensores": [          │                            │
  │        {                    │                            │
  │          "sensor_id": 123,  │ ✅ CON ID                  │
  │          "tipo": "temp",    │                            │
  │          "valor": 24        │                            │
  │        }                    │                            │
  │      ]                      │                            │
  │    }                        │                            │
  ├──────────────────────────► │                            │
  │                             │ 3. Enrutar mensaje         │
  │                             ├──────────────────────────► │
  │                             │                            │
  │                             │ 4. Guardar lectura:        │
  │                             │    INSERT INTO lecturas    │
  │                             │    (sensor_id=123,         │
  │                             │     valor=24)              │
  │                             │                            │
  │                             │    ✅ NO crea duplicados   │


┌─────────────────────────────────────────────────────────────────┐
│           RE-SINCRONIZACIÓN AUTOMÁTICA (cada 5 min)             │
└─────────────────────────────────────────────────────────────────┘

Arduino                    Servidor                   Base de Datos
  │                             │                            │
  │ Timer: 5 minutos            │                            │
  │                             │                            │
  │ GET /api/arduino/sync       │                            │
  ├──────────────────────────► │                            │
  │                             │ Verificar cambios en BD    │
  │                             ├──────────────────────────► │
  │                             │                            │
  │                             │ Usuario cambió umbrales    │
  │                             │ desde web:                 │
  │                             │ HUM_MIN: 55% → 50%         │
  │                             │ HUM_MAX: 70% → 75%         │
  │                             │ ◄──────────────────────────┤
  │                             │                            │
  │ ◄──────────────────────────┤ Nuevos valores             │
  │                             │                            │
  │ Actualizar variables:       │                            │
  │ HUM_ON = 50.0 ✅            │                            │
  │ HUM_OFF = 75.0 ✅           │                            │
  │                             │                            │
  │ Mostrar en LCD:             │                            │
  │ "Umbrales nuevos"           │                            │
  │ "50% - 75%"                 │                            │
```

---

## 📡 Endpoint de Sincronización

### **GET /api/arduino/sync**

**Headers:**
```
X-API-Key: eb9d9266f75eec7ab0ed643818259a3edf4e39c255c82be804bed2463ec542e9
```

**Respuesta Exitosa (200 OK):**
```json
{
  "success": true,
  "device": {
    "id": 1,
    "nombre": "Arduino Invernadero 1",
    "estado": "activo"
  },
  "sensores": {
    "D2_temperatura": {
      "sensor_id": 123,
      "nombre": "Temperatura Aire",
      "pin": "D2",
      "tipo": "temperatura",
      "unidad": "°C",
      "valor_minimo": -10,
      "valor_maximo": 50
    },
    "D2_humedad_ambiente": {
      "sensor_id": 124,
      "nombre": "Humedad Aire",
      "pin": "D2",
      "tipo": "humedad_ambiente",
      "unidad": "%",
      "valor_minimo": 0,
      "valor_maximo": 100
    },
    "A2_nivel_agua": {
      "sensor_id": 125,
      "nombre": "Nivel Tanque",
      "pin": "A2",
      "tipo": "nivel_agua",
      "unidad": "%",
      "valor_minimo": 0,
      "valor_maximo": 100
    }
  },
  "actuadores": {
    "7": {
      "actuador_id": 10,
      "nombre": "Bomba Principal",
      "pin": "7",
      "tipo": "bomba",
      "estado": "apagado"
    }
  },
  "configuracion": {
    "humedad_min": 55.0,
    "humedad_max": 70.0,
    "modo": "automatico"
  },
  "timestamp": "2025-12-03T15:30:00.000Z"
}
```

**Respuesta Error (401 Unauthorized):**
```json
{
  "success": false,
  "message": "API Key inválida"
}
```

---

## 🔧 Código Arduino - Uso del Sistema

### **1. Configuración Inicial (Solo WiFi + API_KEY)**

```cpp
// ===== TODO LO QUE NECESITAS CONFIGURAR =====
const char* WIFI_SSID = "TuWiFi";
const char* WIFI_PASSWORD = "TuPassword";
const char* HTTP_SERVER = "tu-servidor.com";  // O dirección IP
const int HTTP_PORT = 3000;
const char* API_KEY = "tu_api_key_desde_web";

// ===== TODO LO DEMÁS SE SINCRONIZA AUTOMÁTICAMENTE =====
```

### **2. Sincronización Manual desde Serial Monitor**

Envía comando MQTT para forzar re-sincronización:
```json
{"comando": "resync"}
```

### **3. Verificar Estado de Sincronización**

En LCD, pantalla 3 muestra:
```
WiFi:OK MQTT:OK
Sync:OK IDs:OK
```

En Serial Monitor:
```
========================================
  SINCRONIZACIÓN EXITOSA
========================================
✅ Sensor Temperatura ID: 123
✅ Sensor Humedad ID: 124
✅ Sensor Agua ID: 125
✅ Actuador Bomba ID: 10
✅ Umbral MIN: 55.0%
✅ Umbral MAX: 70.0%
========================================
```

---

## 🌐 Flujo Web para Usuario Final

### **Paso 1: Crear Dispositivo**
1. Ir a "Dispositivos" → "Nuevo Dispositivo"
2. Completar formulario:
   - Nombre: "Arduino Invernadero 1"
   - Ubicación: "Sector A"
   - Tipo: "arduino_r4_wifi"
3. Hacer clic en "Guardar"
4. **Copiar API_KEY generada automáticamente**

### **Paso 2: Programar Arduino**
1. Abrir `sistema_riego_mqtt_autosync.ino`
2. Editar solo 3 líneas:
   ```cpp
   const char* WIFI_SSID = "MiWiFi";
   const char* WIFI_PASSWORD = "MiPassword";
   const char* API_KEY = "API_KEY_COPIADA_DEL_PASO_1";
   ```
3. Cargar a Arduino
4. **¡LISTO!**

### **Paso 3: Verificar en Dashboard**
1. Ir a "Dashboard"
2. En ~10 segundos aparecerán:
   - ✅ Sensores auto-creados (Temp, Humedad, Agua)
   - ✅ Gráficos con lecturas en tiempo real
   - ✅ Estado de conexión

### **Paso 4: Configurar Umbrales (Opcional)**
1. Ir a "Dispositivos" → "Arduino Invernadero 1"
2. Hacer clic en "Configuración de Riego"
3. Cambiar umbrales:
   - Mínimo: 50%
   - Máximo: 75%
4. Hacer clic en "Guardar"
5. En máximo 5 minutos, Arduino se actualiza automáticamente

---

## ⚙️ Intervalos de Sincronización

| Evento | Frecuencia | Propósito |
|--------|-----------|-----------|
| **Sincronización inicial** | 1 vez al inicio | Obtener IDs y configuración |
| **Re-sincronización periódica** | Cada 5 minutos | Actualizar umbrales y detectar cambios |
| **Envío de datos** | Cada 5 segundos | Lecturas de sensores |
| **Ping** | Cada 30 segundos | Mantener conexión activa |

---

## 🛠️ Troubleshooting

### **Problema: "Sync:PEND IDs:X" en LCD**

**Causa:** No se pudo conectar al servidor HTTP

**Solución:**
1. Verificar que `HTTP_SERVER` sea correcto (IP o dominio)
2. Verificar que puerto sea `3000` (o el que uses)
3. Verificar que servidor esté corriendo: `npm run dev`
4. Verificar firewall no bloquee puerto 3000

**Comando de verificación:**
```powershell
Test-NetConnection -ComputerName tu-servidor.com -Port 3000
```

---

### **Problema: Arduino no encuentra sensores en BD**

**Causa:** Dispositivo no tiene sensores creados y auto-provisioning falló

**Solución Automática:**
1. Arduino envía datos con pin + tipo (sin ID)
2. `mqttService.js` crea sensores automáticamente (línea 177-220)
3. En siguiente sincronización (5 min), Arduino obtiene IDs

**Solución Manual (más rápida):**
1. Ir a "Dispositivos" → "Arduino X" → "Sensores"
2. Crear sensores manualmente:
   - Pin: D2, Tipo: temperatura
   - Pin: D2, Tipo: humedad_ambiente
   - Pin: A2, Tipo: nivel_agua
3. Forzar re-sync enviando MQTT: `{"comando": "resync"}`

---

### **Problema: Umbrales no se actualizan en Arduino**

**Causa:** Re-sincronización no ocurrió o servidor no tiene configuración

**Debug:**
1. Verificar en BD tabla `configuraciones_riego`:
   ```sql
   SELECT * FROM configuraciones_riego WHERE dispositivo_id = 1;
   ```
2. Si no existe, crear desde web: "Configuración de Riego"
3. Forzar re-sync desde Serial Monitor:
   - Enviar por MQTT: `{"comando": "resync"}`

**Verificar en Serial:**
```
✅ Umbral MIN actualizado: 50.0
✅ Umbral MAX actualizado: 75.0
```

---

### **Problema: Sensores duplicados en BD**

**Causa:** Arduino envió datos antes de sincronizar (primera conexión)

**Prevención:**
- ✅ Nueva versión sincroniza ANTES de enviar datos
- ✅ Auto-provisioning usa pin+tipo como clave única

**Limpieza:**
```sql
-- Ver duplicados
SELECT pin, tipo, COUNT(*) 
FROM sensores 
WHERE dispositivo_id = 1 
GROUP BY pin, tipo 
HAVING COUNT(*) > 1;

-- Eliminar duplicados (dejar más reciente)
DELETE s1 FROM sensores s1
INNER JOIN sensores s2 
WHERE s1.id < s2.id 
  AND s1.pin = s2.pin 
  AND s1.tipo = s2.tipo 
  AND s1.dispositivo_id = s2.dispositivo_id;
```

---

## 📊 Comparación: Antes vs Ahora

| Aspecto | Versión Anterior | Versión Auto-Sync |
|---------|-----------------|-------------------|
| **Configuración inicial** | 20-30 min (manual) | 5 min (automático) |
| **Cambiar umbrales** | Re-flashear Arduino | Desde web, actualiza en 5 min |
| **Agregar sensor** | Editar código + flashear | Web crea sensor, Arduino detecta |
| **Duplicados en BD** | ⚠️ Frecuentes | ✅ Prevenidos |
| **Experiencia usuario** | Técnica (necesita código) | Simple (solo API_KEY) |
| **Detección de errores** | Serial Monitor | LCD + Web Dashboard |

---

## 🔐 Seguridad

### **Protección de API_KEY**
- ✅ Transmitida vía HTTPS (puerto 443 en producción)
- ✅ Validada en middleware `verifyApiKey`
- ✅ No expuesta en logs públicos

### **Rotación de API_KEY**
Si API_KEY se compromete:
1. Ir a "Dispositivos" → "Regenerar API Key"
2. Copiar nueva key
3. Actualizar Arduino y re-flashear
4. Key anterior queda invalidada inmediatamente

---

## 🚀 Próximas Mejoras

### **V2.1: Sincronización OTA (Over-The-Air)**
- Arduino descarga configuración sin Serial Monitor
- Actualización de firmware remota

### **V2.2: Configuración Multi-Zona**
- Múltiples actuadores con horarios independientes
- Priorización automática de riego

### **V2.3: Modo Offline Inteligente**
- Arduino guarda configuración en EEPROM
- Funciona sin servidor (usa última config conocida)

---

**Última actualización:** 3 diciembre 2025  
**Versión:** 2.0 - Auto-Sincronización  
**Autor:** Sistema de Riego IoT Team
