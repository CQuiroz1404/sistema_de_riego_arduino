# ❌ PROBLEMA IDENTIFICADO: Arduino enviando a dispositivo incorrecto

## 🔍 Diagnóstico

El diagnóstico reveló que:

✅ **Arduino está funcionando correctamente** - Envía datos cada 10s  
✅ **Servidor MQTT recibe los datos** - Sin errores de conexión  
❌ **Los sensores están en dispositivo 1** - Pero Arduino usa API Key del dispositivo 3  
❌ **Dispositivo 3 NO tiene sensores** - Por eso no aparecen en la web  

### Estado actual:

| Dispositivo | ID | Sensores | API Key | Arduino usa |
|------------|-----|----------|---------|-------------|
| Controlador Invernadero 1 | 1 | ✅ 3 sensores (IDs 1,2,3) | `api_key_inv_principal_001` | ❌ NO |
| arduino Cristhian | 3 | ❌ 0 sensores | `1a3a499c6d98c6a6ddc3...` | ✅ SÍ |

**Resultado**: Los datos llegan pero no hay sensores en el dispositivo 3 para registrarlos.

---

## ✅ SOLUCIÓN RÁPIDA (Recomendada)

### Cambiar API Key en el Arduino

**Tiempo**: 2 minutos  
**Complejidad**: Muy fácil  

1. **Abre** `arduino/sistema_riego_completo.ino`

2. **Encuentra la línea 30**:
```cpp
const char* API_KEY = "1a3a499c6d98c6a6ddc381260d643d9d0915aa85458e9a96b0385738c33838b2";
```

3. **Cámbiala por**:
```cpp
const char* API_KEY = "api_key_inv_principal_001";
```

4. **Sube el código** al Arduino (Ctrl+U)

5. **Abre el monitor serial** (115200 baud) y verifica:
```
✅ Conectado a MQTT broker
📤 Datos enviados:
   LM35: 20.5 °C
   DHT T: 29.1 °C | H: 34 %
```

6. **Refresca el dashboard** en http://localhost:3000/devices/1

**¡Listo!** Los sensores aparecerán automáticamente.

---

## 🔧 SOLUCIÓN ALTERNATIVA

### Crear sensores para dispositivo 3

**Tiempo**: 5 minutos  
**Complejidad**: Medio  
**Ventaja**: Mantiene tu configuración actual  

### Paso 1: Ejecutar SQL

Abre HeidiSQL y ejecuta:

```sql
-- Eliminar sensores duplicados
DELETE FROM sensores WHERE id IN (4, 5, 6);

-- Crear sensores para dispositivo 3
INSERT INTO sensores (dispositivo_id, nombre, tipo, pin, unidad, valor_minimo, valor_maximo, activo)
VALUES 
(3, 'LM35 Temperatura Suelo', 'temperatura', 'A1', '°C', 0.0, 50.0, 1),
(3, 'DHT11 Temperatura Aire', 'temperatura', 'D2', '°C', 0.0, 50.0, 1),
(3, 'DHT11 Humedad Aire', 'humedad_ambiente', 'D2', '%', 0.0, 100.0, 1);

-- Crear actuador
INSERT INTO actuadores (dispositivo_id, nombre, tipo, pin, estado)
VALUES 
(3, 'Bomba Riego', 'bomba', 'D7', 'apagado');

-- Crear configuración de riego automático
INSERT INTO configuraciones_riego (dispositivo_id, nombre, sensor_id, actuador_id, umbral_inferior, umbral_superior, duracion_minutos, modo)
VALUES 
(3, 'Riego Automático por Humedad', (SELECT MAX(id) FROM sensores WHERE dispositivo_id = 3 AND tipo = 'humedad_ambiente'), (SELECT MAX(id) FROM actuadores WHERE dispositivo_id = 3), 40.0, 60.0, 15, 'automatico');
```

### Paso 2: Verificar

```sql
SELECT 
    s.id,
    s.dispositivo_id,
    d.nombre AS dispositivo,
    s.nombre AS sensor,
    s.tipo,
    s.pin
FROM sensores s
JOIN dispositivos d ON s.dispositivo_id = d.id
WHERE s.dispositivo_id = 3;
```

Deberías ver 3 sensores nuevos para dispositivo 3.

### Paso 3: Actualizar IDs en Arduino

Los nuevos sensores tendrán IDs diferentes (probablemente 7, 8, 9).

**Abre** `arduino/sistema_riego_completo.ino` y actualiza:

```cpp
// IDs de base de datos (ACTUALIZADOS para dispositivo 3)
const int SENSOR_TEMPERATURA_SUELO_ID = 7;    // LM35 Temperatura Suelo
const int SENSOR_TEMPERATURA_AIRE_ID = 8;     // DHT11 Temperatura Aire
const int SENSOR_HUMEDAD_AIRE_ID = 9;         // DHT11 Humedad Aire
const int ACTUADOR_BOMBA_ID = 3;              // Bomba Riego
```

**Nota**: Verifica los IDs reales con la consulta SQL anterior.

### Paso 4: Subir y Probar

1. Sube el código actualizado al Arduino
2. Abre monitor serial
3. Verifica que envía datos
4. Abre http://localhost:3000/devices/3

---

## 📊 Comparación de Soluciones

| Aspecto | Solución Rápida | Solución Alternativa |
|---------|----------------|---------------------|
| **Tiempo** | 2 minutos | 5 minutos |
| **Cambios en BD** | Ninguno | Crear sensores nuevos |
| **Cambios en Arduino** | 1 línea (API Key) | 4 líneas (IDs) |
| **Complejidad** | ⭐ Muy fácil | ⭐⭐ Media |
| **Resultado** | Usa dispositivo 1 | Usa dispositivo 3 |
| **Usuario web** | Usuario ID 1 (admin) | Usuario ID 2 |

---

## 🎯 RECOMENDACIÓN FINAL

**Usa la SOLUCIÓN RÁPIDA** porque:

✅ Cambias solo 1 línea de código  
✅ No requiere cambios en base de datos  
✅ Los sensores ya existen y están configurados  
✅ Menos posibilidad de error  
✅ Funciona inmediatamente  

---

## 🧪 Verificación Final

Después de aplicar cualquier solución:

### 1. Monitor Serial Arduino
```
📡 Conectando WiFi: D4rK_phone
✅ WiFi Conectado
   IP: 192.168.x.x
🔌 Conectando MQTT SSL... ✅ ¡Conectado!
📤 Datos enviados:
   LM35: 20.5 °C
   DHT T: 29.1 °C | H: 34 %
```

### 2. Consola Servidor Node.js
```
📨 Mensaje MQTT recibido - Topic: riego/api_key.../sensores
✅ Dispositivo encontrado: Controlador Invernadero 1 (ID: 1)
🔍 Procesando datos de sensores - Dispositivo: Controlador Invernadero 1
📊 Total de sensores en payload: 3
✅ Sensor válido: LM35 Temperatura Suelo (ID: 1)
📊 Sensor LM35 Temperatura Suelo: 20.5 °C ✅
```

### 3. Dashboard Web
- Abre http://localhost:3000/devices/1 (o /3 si usaste solución alternativa)
- Verás **3 sensores**:
  - LM35 Temperatura Suelo
  - DHT11 Temperatura Aire
  - DHT11 Humedad Aire
- Cada sensor mostrará su **último valor**
- Los valores se actualizan cada **10 segundos**

### 4. Base de Datos
```sql
-- Ver últimas lecturas
SELECT 
    l.id,
    l.sensor_id,
    s.nombre,
    l.valor,
    s.unidad,
    l.fecha_lectura
FROM lecturas l
JOIN sensores s ON l.sensor_id = s.id
ORDER BY l.fecha_lectura DESC
LIMIT 20;
```

Deberías ver lecturas nuevas cada 10 segundos.

---

## 🆘 Problemas Comunes

### "API Key inválida" en consola
- Verifica que copiaste el API Key completo sin espacios
- Revisa que sea exactamente: `api_key_inv_principal_001`

### "Sensor X no encontrado en la base de datos"
- Ejecuta: `node diagnostico_db.js`
- Verifica que los sensores existan con los IDs correctos
- Compara IDs del Arduino con IDs en base de datos

### "No hay sensores configurados" en web
- Refresca la página (F5)
- Verifica que estés viendo el dispositivo correcto
- Revisa logs del servidor para errores

### Lecturas no aparecen
- Espera 10-15 segundos (intervalo de envío)
- Verifica conexión MQTT en monitor serial
- Revisa logs del servidor Node.js

---

## 📝 Archivos Creados

- `database/fix_sensores_dispositivo.sql` - Scripts SQL para ambas soluciones
- `diagnostico_db.js` - Script de diagnóstico completo
- `SOLUCION_SENSORES_COMPLETA.md` - Este documento

---

**¿Necesitas ayuda?** Ejecuta `node diagnostico_db.js` para ver el estado actual de tu base de datos.
