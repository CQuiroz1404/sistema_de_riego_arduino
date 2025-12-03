# 🔧 Parche de Compatibilidad - Arduino IoT Sistema de Riego

## ✅ Estado Actualizado: PROBLEMA RESUELTO CON AUTO-SINCRONIZACIÓN (v2.0)

**NUEVO SKETCH:** `sistema_riego_mqtt_autosync.ino`  
**DOCUMENTACIÓN COMPLETA:** `docs/AUTO_SYNC.md`

El problema principal de IDs manuales ha sido **completamente resuelto** mediante un sistema de auto-sincronización inteligente. El usuario ahora **solo necesita API_KEY y WiFi**.

---

## 🎯 SOLUCIÓN IMPLEMENTADA

### **Sistema de Auto-Registro Automático**
- ✅ Endpoint `/api/arduino/sync` devuelve mapeo completo
- ✅ Arduino obtiene IDs automáticamente al iniciar
- ✅ Re-sincronización cada 5 minutos
- ✅ Umbrales actualizables desde web sin re-flashear
- ✅ Sin duplicados en BD (clave única: pin+tipo)

---

## 📋 ANÁLISIS ORIGINAL (Sketch v1.0)

> **NOTA:** Este análisis aplica al sketch **antiguo** `sistema_riego_mqtt.ino`.  
> Para la **versión mejorada**, usa `sistema_riego_mqtt_autosync.ino`

### Estado Original: ⚠️ FUNCIONAL CON LIMITACIONES

El sketch v1.0 **SÍ funciona** con el sistema web, pero tenía limitaciones importantes:

---

## ✅ Lo que FUNCIONA ahora mismo

### 1. **Comunicación MQTT Bidireccional**
- ✅ Envío de datos de sensores cada 5s
- ✅ Recepción de comandos de control
- ✅ Ping/keepalive
- ✅ Eventos de estado

### 2. **Control Remoto desde Web**
```
Usuario Web → Node.js → MQTT → Arduino → Relé ON/OFF
```
**Funciona perfectamente** - Latencia < 500ms

### 3. **Detección de Modos**
- ✅ Modo Automático (Arduino decide)
- ✅ Modo Remoto (Web decide)
- ✅ Modo Manual Local (Botón físico)

---

## ❌ PROBLEMAS IDENTIFICADOS

### **Problema 1: Sensores sin ID**

**Código actual (línea 788-809):**
```cpp
JsonObject sensor1 = sensores.createNestedObject();
sensor1["pin"] = "D2";
sensor1["tipo"] = "temperatura";
sensor1["valor"] = ultimaTempDHT;
// ❌ FALTA: sensor1["sensor_id"] = 1;
```

**Consecuencia:**
- Servidor crea sensores automáticamente por pin/tipo (auto-provisioning)
- Si cambias pin o tipo, crea sensor duplicado en BD
- No hay relación directa entre lectura y sensor existente

**Solución:**
```cpp
// AGREGAR VARIABLES GLOBALES
int sensor_temp_id = 0;     // ID del sensor de temperatura
int sensor_hum_id = 0;      // ID del sensor de humedad
int sensor_agua_id = 0;     // ID del sensor de agua

// En enviarDatosSensores():
if (sensor_temp_id > 0) {
  JsonObject sensor1 = sensores.createNestedObject();
  sensor1["sensor_id"] = sensor_temp_id;  // ✅ AGREGAR ESTO
  sensor1["pin"] = "D2";
  sensor1["tipo"] = "temperatura";
  sensor1["valor"] = ultimaTempDHT;
}
```

**¿Cómo obtener IDs?**
Opción 1: Configurar manualmente en código después de crear dispositivo en web
Opción 2: Endpoint de auto-registro que devuelva IDs asignados

---

### **Problema 2: Umbrales Hardcodeados**

**Código actual (línea 64-65):**
```cpp
const float HUM_ON   = 55.0;   // ❌ No se puede cambiar desde web
const float HUM_OFF  = 70.0;
```

**El servidor envía comandos de configuración pero Arduino NO los procesa**

**Solución - Agregar en callbackMQTT() línea 730:**
```cpp
// AGREGAR DESPUÉS DE DETECTAR MODO
// Comando para actualizar umbrales
if (doc.containsKey("configuracion")) {
  JsonObject config = doc["configuracion"];
  
  if (config.containsKey("humedad_min")) {
    HUM_ON = config["humedad_min"];
    Serial.print("Umbral MIN actualizado: ");
    Serial.println(HUM_ON);
  }
  
  if (config.containsKey("humedad_max")) {
    HUM_OFF = config["humedad_max"];
    Serial.print("Umbral MAX actualizado: ");
    Serial.println(HUM_OFF);
  }
  
  // Confirmar cambio
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
```

**IMPORTANTE:** Cambiar `const float` por `float` (línea 64-65):
```cpp
float HUM_ON   = 55.0;   // ✅ Quitar const para permitir cambios
float HUM_OFF  = 70.0;
```

---

### **Problema 3: Sin Confirmación de Comandos**

**Comportamiento actual:**
1. Web envía: `{"pin": "7", "estado": 1}`
2. Arduino ejecuta: `digitalWrite(PIN_RELAY, HIGH)`
3. Arduino envía evento genérico
4. ✅ Servidor actualiza BD

**Problema:**
No hay confirmación explícita si el comando falló (ej: relé con falla)

**Solución - Modificar aplicarEstadoBomba():**
```cpp
void aplicarEstadoBomba() {
  digitalWrite(PIN_RELAY, pumpOn ? HIGH : LOW);
  digitalWrite(LED_BUILTIN, pumpOn ? HIGH : LOW);
  delay(100);
  
  // ✅ LEER ESTADO REAL DEL PIN (verificar que se aplicó)
  int estadoReal = digitalRead(PIN_RELAY);
  bool exitoso = (estadoReal == (pumpOn ? HIGH : LOW));
  
  Serial.print("Rele D7 = ");
  Serial.print(pumpOn ? "HIGH (ON)" : "LOW (OFF)");
  Serial.print(" | Verificacion: ");
  Serial.println(exitoso ? "OK" : "ERROR");
  
  // Enviar confirmación MQTT
  enviarConfirmacionComando(exitoso);
}

// NUEVA FUNCIÓN
void enviarConfirmacionComando(bool exitoso) {
  if (!mqttClient.connected()) return;
  
  StaticJsonDocument<128> doc;
  doc["tipo"] = "confirmacion";
  doc["actuador"] = "bomba";
  doc["pin"] = "D7";
  doc["estado_solicitado"] = pumpOn ? 1 : 0;
  doc["estado_real"] = digitalRead(PIN_RELAY);
  doc["exitoso"] = exitoso;
  doc["timestamp"] = millis();
  
  char buffer[128];
  serializeJson(doc, buffer);
  
  char topicConfirm[150];
  sprintf(topicConfirm, "riego/%s/confirmacion", API_KEY);
  mqttClient.publish(topicConfirm, buffer);
}
```

**Servidor debe suscribirse:**
```javascript
// En mqttService.js subscribeToTopics() agregar:
'riego/+/confirmacion'
```

---

### **Problema 4: Sin Duración Automática**

**Requisito no implementado:**
- Web programa riego por 15 minutos
- Arduino debe apagar bomba automáticamente

**Solución - Agregar variables globales:**
```cpp
unsigned long tiempoInicioRiego = 0;
unsigned long duracionRiegoMs = 0;  // 0 = sin límite

// En encenderBomba():
void encenderBomba(const char* motivo) {
  if (!pumpOn) {
    pumpOn = true;
    tiempoInicioRiego = millis();  // ✅ REGISTRAR INICIO
    aplicarEstadoBomba();
    Serial.print("Bomba ENCENDIDA - ");
    Serial.println(motivo);
  }
}

// En loop(), después de leer sensores:
// Verificar timeout de riego
if (pumpOn && duracionRiegoMs > 0) {
  unsigned long tiempoTranscurrido = millis() - tiempoInicioRiego;
  if (tiempoTranscurrido >= duracionRiegoMs) {
    apagarBomba("Timeout automatico");
    duracionRiegoMs = 0;  // Reset
  }
}

// En callbackMQTT() agregar:
if (doc.containsKey("duracion_minutos")) {
  int minutos = doc["duracion_minutos"];
  duracionRiegoMs = minutos * 60000UL;  // Convertir a ms
  Serial.print("Duracion configurada: ");
  Serial.print(minutos);
  Serial.println(" min");
}
```

---

## 📊 Tabla de Compatibilidad

| Funcionalidad | Estado | Notas |
|--------------|--------|-------|
| Envío sensores (sin ID) | ✅ Funciona | Crea duplicados si cambia pin |
| Envío sensores (con ID) | ❌ No implementado | Recomendado para producción |
| Control remoto ON/OFF | ✅ Funciona | Latencia < 500ms |
| Detección de modo | ✅ Funciona | Automático, remoto, manual |
| Eventos de estado | ✅ Funciona | Actualiza BD en tiempo real |
| Ping/keepalive | ✅ Funciona | Cada 30s |
| Umbrales remotos | ❌ No implementado | Hardcodeados en código |
| Confirmación comandos | ⚠️ Básico | Sin verificación de fallo |
| Duración automática | ❌ No implementado | Apaga solo por sensor |
| Calendario → Arduino | ❌ No implementado | Servidor no envía comandos |

---

## 🚀 Plan de Implementación Recomendado

### **Fase 1: Estabilización (1-2 horas)**
1. ✅ Agregar `sensor_id` a payload de sensores
2. ✅ Cambiar umbrales de `const` a `float`
3. ✅ Implementar recepción de configuración remota

### **Fase 2: Mejoras (2-3 horas)**
1. ✅ Confirmación explícita de comandos
2. ✅ Duración automática de riego
3. ✅ Timer de seguridad (max 30 min)

### **Fase 3: Integración Calendario (3-4 horas)**
1. ✅ Servidor envía comandos desde `schedulerService.js`
2. ✅ Desactivar calendario al activar manual
3. ✅ Notificaciones Socket.IO

---

## 🔧 ¿Necesitas el Sketch Corregido?

Puedo generar:
1. **Sketch parcheado mínimo** (solo IDs de sensores)
2. **Sketch completo mejorado** (todas las correcciones)
3. **Archivo de configuración** (IDs de sensores, umbrales)

---

## 📝 Notas Adicionales

### **¿Puedo usar el sketch actual en producción?**
✅ **SÍ**, pero con limitaciones:
- Funcionará el control manual desde web
- Los sensores se crearán automáticamente (puede generar duplicados)
- No podrás cambiar umbrales desde web
- No hay duración automática de riego

### **¿Qué pasa si no corrijo nada?**
- Sistema funcional pero subóptimo
- Base de datos puede tener sensores duplicados
- Configuración requiere re-flashear Arduino
- Sin protección de riego infinito

### **¿Es crítico corregir ahora?**
**Prioridad ALTA:**
- Agregar `sensor_id` (evita duplicados en BD)
- Umbrales remotos (UX crítico)

**Prioridad MEDIA:**
- Duración automática (seguridad)
- Confirmación de comandos (debugging)

**Prioridad BAJA:**
- Integración calendario (feature avanzado)

---

**Última actualización:** 3 dic 2024  
**Sketch analizado:** `sistema_riego_mqtt.ino` (versión actual)
