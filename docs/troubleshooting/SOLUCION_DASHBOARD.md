# ✅ SOLUCIÓN: Datos no se muestran en el dashboard

## 🔍 Problema Identificado

Los sensores están creados correctamente (IDs 7, 8, 9) y el Arduino está enviando datos, pero **las lecturas no se guardan en la base de datos** porque el servidor Node.js necesita ser reiniciado.

---

## 🚀 SOLUCIÓN RÁPIDA (3 pasos)

### 1️⃣ Reiniciar el Servidor Node.js

En la terminal donde corre `npm run dev`:

1. **Detén el servidor**: Presiona `Ctrl + C`
2. **Reinicia el servidor**: 
   ```powershell
   npm run dev
   ```
3. **Espera a ver**:
   ```
   ✅ Conectado al broker MQTT
   📡 Suscrito a tópicos MQTT: riego/+/sensores, riego/+/eventos, riego/+/ping
   ```

### 2️⃣ Verificar que el Arduino esté enviando datos

Abre el **Monitor Serial** del Arduino (115200 baud) y verifica:

```
📤 Datos enviados:
   LM35: 20.5 °C
   DHT T: 29.1 °C | H: 34 %
💓 Ping enviado
```

### 3️⃣ Verificar en el Servidor Node.js

En la consola del servidor deberías ver:

```
📨 Mensaje MQTT recibido - Topic: riego/78d3f3a7.../sensores
✅ Dispositivo encontrado: arduino prueba (ID: 6)
🔍 Procesando datos de sensores - Dispositivo: arduino prueba
📊 Total de sensores en payload: 3
✅ Sensor válido: LM35 Temperatura Suelo (ID: 7)
📊 Sensor LM35 Temperatura Suelo (arduino prueba): 20.5 °C ✅
✅ Sensor válido: DHT11 Temperatura Aire (ID: 8)
📊 Sensor DHT11 Temperatura Aire (arduino prueba): 28.5 °C ✅
✅ Sensor válido: DHT11 Humedad Aire (ID: 9)
📊 Sensor DHT11 Humedad Aire (arduino prueba): 45 % ✅
```

### 4️⃣ Refrescar el Dashboard

1. Abre http://localhost:3000/devices/6
2. Presiona **F5** para refrescar
3. Los sensores mostrarán valores cada 10 segundos

---

## ✅ Verificación

Ya inserté lecturas de prueba manualmente. **Refresca el dashboard** (F5) y deberías ver:

- **LM35 Temperatura Suelo**: 22.5°C
- **DHT11 Temperatura Aire**: 28.5°C  
- **DHT11 Humedad Aire**: 45%

Después de reiniciar el servidor, estos valores se actualizarán automáticamente cada 10 segundos con los datos reales del Arduino.

---

## 🔧 Si aún no funciona

### Verificar conexión MQTT del Arduino

En el monitor serial del Arduino:

- ✅ Debe mostrar: `✅ Conectado a MQTT broker`
- ✅ Debe mostrar: `📤 Datos enviados` cada 10 segundos
- ❌ Si muestra: `❌ Fallo, rc=X` → Problema de conexión MQTT

### Verificar logs del servidor

Si no ves los mensajes de procesamiento:

1. **Revisa la consola del servidor** - Debe mostrar "Mensaje MQTT recibido"
2. **Verifica la conexión MQTT**: Debe decir "Conectado al broker MQTT"
3. **Si no hay mensajes**: El Arduino no está conectado o usa otro API Key

### Verificar API Key

**Arduino** (línea 36):
```cpp
const char* API_KEY = "78d3f3a76ff81723752ce8632a4691efcd5d83fed37fe16d42f495a98415a8f3";
```

**Base de datos** (dispositivo 6):
```
API Key: 78d3f3a76ff81723752ce8632a4691efcd5d83fed37fe16d42f495a98415a8f3
```

✅ Coinciden correctamente

---

## 📊 Estado Actual

| Componente | Estado | Detalles |
|------------|--------|----------|
| **Sensores en BD** | ✅ Creados | IDs 7, 8, 9 para dispositivo 6 |
| **Actuador en BD** | ✅ Creado | ID 3 (Bomba Riego) |
| **Config. Riego** | ✅ Creada | Sensor 9 → Actuador 3 (40%-60%) |
| **Arduino IDs** | ✅ Correctos | 7, 8, 9 en el código |
| **API Key** | ✅ Correcto | Coincide con dispositivo 6 |
| **Lecturas prueba** | ✅ Insertadas | Visibles tras refrescar |
| **Servidor** | ⚠️ Reiniciar | Para procesar datos MQTT |

---

## 🎯 Resumen

**PASO 1**: Reinicia el servidor Node.js (`Ctrl+C` → `npm run dev`)  
**PASO 2**: Verifica que el Arduino envíe datos (monitor serial)  
**PASO 3**: Refresca el dashboard (F5 en http://localhost:3000/devices/6)  

**Resultado esperado**: Los 3 sensores muestran valores que se actualizan cada 10 segundos automáticamente. 🎉
