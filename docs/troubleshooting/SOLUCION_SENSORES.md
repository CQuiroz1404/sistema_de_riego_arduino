# Solución: Registro de Datos de Sensores

## 🔍 Problema Identificado

El Arduino está enviando datos de sensores con IDs **4, 5, 6**, pero en la base de datos solo existen sensores con IDs **1, 2, 3** para el dispositivo 1.

### Datos que envía el Arduino:
```json
{
  "sensores": [
    {"sensor_id": 4, "valor": 206.6},  // LM35 Temperatura Suelo
    {"sensor_id": 5, "valor": 29.1},   // DHT11 Temperatura Aire
    {"sensor_id": 6, "valor": 34}      // DHT11 Humedad Aire
  ]
}
```

### Sensores existentes en BD (dispositivo_id = 1):
- **ID 1**: Humedad Suelo Tomates (A0) - No usado actualmente
- **ID 2**: Temperatura Ambiente (A1) - No usado actualmente  
- **ID 3**: Nivel Tanque Principal (A2) - No usado actualmente

## ✅ Solución Implementada

### 1. Actualización de Base de Datos

**Archivo**: `database/update_sensores.sql`

Este script actualiza los 3 sensores existentes para que coincidan con el hardware Arduino:

```sql
-- Sensor ID 1: LM35 Temperatura del Suelo
UPDATE sensores 
SET nombre = 'LM35 Temperatura Suelo',
    tipo = 'temperatura',
    pin = 'A1',
    unidad = '°C',
    valor_minimo = 0.0,
    valor_maximo = 50.0
WHERE id = 1;

-- Sensor ID 2: DHT11 Temperatura del Aire
UPDATE sensores 
SET nombre = 'DHT11 Temperatura Aire',
    tipo = 'temperatura',
    pin = 'D2',
    unidad = '°C',
    valor_minimo = 0.0,
    valor_maximo = 50.0
WHERE id = 2;

-- Sensor ID 3: DHT11 Humedad del Aire
UPDATE sensores 
SET nombre = 'DHT11 Humedad Aire',
    tipo = 'humedad_ambiente',
    pin = 'D2',
    unidad = '%',
    valor_minimo = 0.0,
    valor_maximo = 100.0
WHERE id = 3;
```

### 2. Actualización del Código Arduino

**Archivo**: `arduino/sistema_riego_completo.ino`

Los IDs de sensores se actualizaron a **1, 2, 3**:

```cpp
// IDs de base de datos (ACTUALIZADOS para coincidir con sensores existentes)
const int SENSOR_TEMPERATURA_SUELO_ID = 1;    // LM35 Temperatura Suelo (A1)
const int SENSOR_TEMPERATURA_AIRE_ID = 2;     // DHT11 Temperatura Aire (D2)
const int SENSOR_HUMEDAD_AIRE_ID = 3;         // DHT11 Humedad Aire (D2)
const int ACTUADOR_BOMBA_ID = 1;
```

### 3. Mejoras en Logs del Servidor

**Archivo**: `src/services/mqttService.js`

Se agregaron logs detallados para depuración:

- ✅ Confirma recepción de mensaje MQTT
- ✅ Muestra dispositivo encontrado por API Key
- ✅ Lista sensores procesados del payload
- ✅ Valida existencia de cada sensor en BD
- ✅ Confirma pertenencia al dispositivo correcto

## 📋 Pasos para Aplicar la Solución

### 1️⃣ Actualizar Base de Datos

Ejecuta el script SQL en HeidiSQL o MySQL Workbench:

```bash
# Abre HeidiSQL/Laragon
# Selecciona la base de datos: sistema_riego
# Abre y ejecuta: database/update_sensores.sql
```

Verifica los cambios:
```sql
SELECT id, nombre, tipo, pin, unidad FROM sensores WHERE dispositivo_id = 1;
```

Deberías ver:
```
ID | Nombre                    | Tipo              | Pin | Unidad
1  | LM35 Temperatura Suelo    | temperatura       | A1  | °C
2  | DHT11 Temperatura Aire    | temperatura       | D2  | °C
3  | DHT11 Humedad Aire        | humedad_ambiente  | D2  | %
```

### 2️⃣ Recargar Código Arduino

1. Cierra el monitor serial si está abierto
2. Abre `arduino/sistema_riego_completo.ino` en Arduino IDE
3. Verifica los IDs de sensores (líneas 47-50):
   ```cpp
   const int SENSOR_TEMPERATURA_SUELO_ID = 1;
   const int SENSOR_TEMPERATURA_AIRE_ID = 2;
   const int SENSOR_HUMEDAD_AIRE_ID = 3;
   ```
4. **Sube el código al Arduino** (Ctrl+U)
5. Abre el monitor serial (115200 baud)

### 3️⃣ Reiniciar Servidor Node.js

```powershell
# Detén el servidor actual (Ctrl+C en la terminal)
# Reinicia:
npm run dev
```

### 4️⃣ Verificar Funcionamiento

#### En el Monitor Serial del Arduino:
```
✅ WiFi conectado: 192.168.x.x
✅ Conectado a MQTT broker
📤 Datos enviados:
   LM35: 20.5 °C
   DHT T: 29.1 °C | H: 34 %
```

#### En la Consola del Servidor Node.js:
```
📨 Mensaje MQTT recibido - Topic: riego/1a3a499c.../sensores
✅ Dispositivo encontrado: Controlador Invernadero 1 (ID: 1)
🔍 Procesando datos de sensores - Dispositivo: Controlador Invernadero 1
📊 Total de sensores en payload: 3
✅ Sensor válido: LM35 Temperatura Suelo (ID: 1)
📊 Sensor LM35 Temperatura Suelo (Controlador Invernadero 1): 20.5 °C ✅
✅ Sensor válido: DHT11 Temperatura Aire (ID: 2)
📊 Sensor DHT11 Temperatura Aire (Controlador Invernadero 1): 29.1 °C ✅
✅ Sensor válido: DHT11 Humedad Aire (ID: 3)
📊 Sensor DHT11 Humedad Aire (Controlador Invernadero 1): 34 % ✅
```

#### En la Página Web (http://localhost:3000/devices):
1. Ingresa al dashboard
2. Ve a "Dispositivos"
3. Haz clic en "Controlador Invernadero 1"
4. Deberías ver:
   - **3 sensores activos** (LM35, DHT11 Temp, DHT11 Hum)
   - **Lecturas en tiempo real** actualizándose cada 10 segundos
   - **Gráficos** con histórico de datos

## 🔍 Diagnóstico de Problemas

### Problema: "No hay sensores conectados"

**Causa**: Los sensores en BD no coinciden con los IDs del Arduino

**Solución**: Ejecutar `update_sensores.sql` y reiniciar todo

### Problema: "Sensor X no encontrado en la base de datos"

**Verificar**:
```sql
SELECT id, dispositivo_id, nombre FROM sensores ORDER BY id;
```

**Asegurar**:
- Existen sensores con IDs 1, 2, 3
- `dispositivo_id = 1` para los 3 sensores
- Arduino usa los mismos IDs (1, 2, 3)

### Problema: "API Key inválida"

**Verificar API Key del dispositivo**:
```sql
SELECT id, nombre, api_key FROM dispositivos WHERE id = 1;
```

**Comparar** con el Arduino (línea 30):
```cpp
const char* API_KEY = "1a3a499c6d98c6a6ddc381260d643d9d0915aa85458e9a96b0385738c33838b2";
```

Deben coincidir exactamente.

### Problema: Datos no aparecen en la web

1. **Verifica tabla lecturas**:
   ```sql
   SELECT * FROM lecturas ORDER BY fecha_lectura DESC LIMIT 10;
   ```

2. **Revisa logs del servidor** (consola Node.js)

3. **Abre consola del navegador** (F12) y busca errores

4. **Recarga la página** del dispositivo (F5)

## 📊 Estructura Final del Sistema

```
Arduino UNO R4 WiFi
├── LM35 (A1) ─────────► Sensor ID 1 (LM35 Temperatura Suelo)
├── DHT11 (D2)
│   ├── Temperatura ───► Sensor ID 2 (DHT11 Temperatura Aire)
│   └── Humedad ───────► Sensor ID 3 (DHT11 Humedad Aire)
└── Relay (D7) ────────► Actuador ID 1 (Bomba Riego)

MQTT Broker (EMQX)
└── Topic: riego/{API_KEY}/sensores
    └── Payload: {"sensores": [{"sensor_id":1,"valor":20.5}, ...]}

Backend Node.js
├── mqttService.js ────► Recibe datos MQTT
├── Valida sensor_id
├── Guarda en tabla: lecturas
└── Emite via Socket.io al navegador

Dashboard Web
└── devices/show/{id} ─► Muestra sensores en tiempo real
```

## ✅ Checklist de Verificación

- [ ] SQL ejecutado correctamente
- [ ] Arduino actualizado y subido
- [ ] Servidor Node.js reiniciado
- [ ] Monitor Serial muestra "Datos enviados"
- [ ] Consola del servidor muestra "Sensor válido"
- [ ] Tabla `lecturas` tiene nuevos registros
- [ ] Dashboard web muestra sensores activos
- [ ] Gráficos se actualizan automáticamente

## 🎯 Resultado Esperado

Ahora el sistema debería:

✅ **Recibir datos cada 10 segundos** del Arduino  
✅ **Registrar lecturas en BD** (tabla `lecturas`)  
✅ **Mostrar 3 sensores activos** en el dashboard  
✅ **Actualizar gráficos en tiempo real**  
✅ **Generar alertas** si valores están fuera de rango  
✅ **Activar riego automático** según configuración  

---

**Nota**: Si después de aplicar todos los pasos sigues sin ver datos, revisa los logs del servidor Node.js para identificar el error específico.
