# 🔍 Guía de Diagnóstico - Sensores

## ⚠️ El Código SÍ Captura Datos Reales (No Simula)

El código `sistema_riego_mqtt.ino` **SÍ lee los sensores reales**, pero faltaba información de debug para verificarlo.

---

## ✅ Cambios Aplicados (Código Principal)

He agregado **debug detallado** al archivo `sistema_riego_mqtt.ino`:

### **Ahora muestra en Serial Monitor (cada 10 segundos):**

```
--- LECTURA DE SENSORES ---
🌱 Humedad Suelo (A0):
   ADC Raw: 512 | Porcentaje: 50%
🌡️  Temperatura LM35CZ (A1):
   ADC Raw: 512 | Voltaje: 2.500V | Temp: 25.0°C

📤 JSON a enviar: {"sensores":[{"sensor_id":1,"valor":50},{"sensor_id":2,"valor":25}]}
✅ Datos publicados exitosamente por MQTT
---------------------------
```

---

## 🧪 Prueba Rápida (Sin MQTT ni WiFi)

He creado **`test_sensores_simple.ino`** para verificar SOLO los sensores:

### **Cómo usar:**

1. **Abrir Arduino IDE** → Archivo → Abrir → `test_sensores_simple.ino`
2. **Cargar al Arduino** (sin modificar nada)
3. **Abrir Serial Monitor** (115200 baud)
4. **Observar lecturas cada 2 segundos**

### **Salida esperada:**

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⏰ Tiempo: 10 segundos

🌱 SENSOR DE HUMEDAD (Pin A0):
   └─ Lectura ADC: 456 / 1023  (44.6%)
   └─ Humedad: 44.6%
   ✅ Lectura normal

🌡️  SENSOR LM35CZ (Pin A1):
   └─ Lectura ADC: 512 / 1023  (50.0%)
   └─ Voltaje: 2.500 V
   └─ Temperatura: 25.00 °C
   ✅ Lectura normal
   ℹ️  Temperatura coherente con ambiente

🧪 PRUEBA MANUAL:
   1. Sostén el LM35CZ con tus dedos (5 seg)
      → La temperatura debe SUBIR a ~32-36°C
   2. Sopla aire cerca del LM35CZ
      → La temperatura debe VARIAR ligeramente
```

---

## 🔬 Pruebas para Verificar que Funciona

### **Prueba 1: Temperatura (LM35CZ)**

#### **Método 1: Calentar con los dedos**
1. Abrir Serial Monitor
2. Anotar temperatura inicial (ej: 23.5°C)
3. **Sostener el LM35CZ entre tus dedos** durante 10 segundos
4. Observar Serial Monitor

**✅ Resultado esperado:**
- Temperatura **SUBE** gradualmente
- Debe alcanzar **30-36°C** (temperatura corporal)
- Al soltar, vuelve a **bajar** a ambiente

**❌ Si no cambia:**
- Sensor no conectado correctamente
- Pin 1 no está en A1

#### **Método 2: Enfriar con hielo**
1. Acercar hielo al LM35CZ (sin tocar)
2. Temperatura debe **BAJAR** hacia 0-10°C
3. Alejar hielo
4. Temperatura debe **SUBIR** nuevamente

#### **Método 3: Soplar aire**
1. Soplar aire tibio cerca del sensor
2. Temperatura debe **variar** ligeramente

---

### **Prueba 2: Humedad de Suelo**

#### **Método 1: Sensor en aire**
- Lectura ADC: **~100-300** (bajo)
- Significa: **Seco**

#### **Método 2: Tocar con dedo húmedo**
1. Humedecer tu dedo con agua
2. Tocar las puntas del sensor de humedad
3. **ADC debe subir** inmediatamente a ~600-800

#### **Método 3: Sumergir en agua**
1. Colocar sensor en vaso con agua (solo las puntas)
2. ADC debe ir a **~900-1023** (máximo)

**⚠️ IMPORTANTE:** No sumergir el circuito electrónico, solo las puntas metálicas.

---

## 📊 Valores de Referencia

### **LM35CZ (Pin A1):**

| Temperatura | ADC Esperado | Voltaje | Qué significa |
|-------------|-------------|---------|---------------|
| 0°C (hielo) | ~102 | 0.50V | Muy frío |
| 15°C | ~307 | 1.50V | Fresco |
| 20°C | ~409 | 2.00V | Ambiente frío |
| **25°C** | **~512** | **2.50V** | **Ambiente normal** ✅ |
| 30°C | ~614 | 3.00V | Ambiente cálido |
| 35°C (cuerpo) | ~716 | 3.50V | Temperatura corporal |
| 40°C | ~818 | 4.00V | Muy caliente |

### **Sensor Humedad (Pin A0):**

| Condición | ADC Esperado | Qué significa |
|-----------|-------------|---------------|
| Aire seco | 0-200 | No hay humedad o no conectado |
| Suelo seco | 200-400 | Necesita riego |
| Suelo húmedo | 400-700 | Humedad adecuada |
| Muy húmedo | 700-900 | Exceso de agua |
| En agua | 900-1023 | Sumergido |

---

## 🐛 Diagnóstico de Problemas

### **Problema 1: LM35CZ siempre marca 0°C**

**Síntoma:**
```
ADC Raw: 0-50 | Voltaje: 0.000V | Temp: 0.0°C
```

**Causa:** Pin 1 (Vout) no conectado a A1

**Solución:**
1. Verificar que el cable de Pin 1 llegue a A1
2. Revisar que no esté suelto
3. Probar con otro cable
4. **Verificar con multímetro:** Medir voltaje entre Pin 1 y GND
   - Debe leer **~0.25V a temperatura ambiente**

---

### **Problema 2: LM35CZ siempre marca ~48.8°C**

**Síntoma:**
```
ADC Raw: 950-1023 | Voltaje: 4.9-5.0V | Temp: 48-50°C
```

**Causa:** Pin 1 conectado a 5V por error (polaridad invertida)

**Solución:**
1. **REVISAR CONEXIÓN DEL LM35CZ** (parte plana hacia ti):
   ```
   Pin 1 (izquierda) → A1
   Pin 2 (centro)    → GND
   Pin 3 (derecha)   → 5V
   ```
2. Si están al revés, **CORREGIR INMEDIATAMENTE**

---

### **Problema 3: Temperatura no varía al calentar/enfriar**

**Síntoma:**
```
Siempre marca la misma temperatura (ej: 23.4°C)
Al tocar con dedos, NO cambia
```

**Causa:** Sensor dañado o en corto

**Solución:**
1. Desconectar LM35CZ del Arduino
2. Medir con multímetro:
   - **Entre Pin 3 y Pin 2:** Debe haber ~5V
   - **Entre Pin 1 y Pin 2:** Debe haber ~0.25V a 25°C
3. Si no hay voltaje en Pin 1: **Sensor dañado**, reemplazar

---

### **Problema 4: Humedad siempre 0% o 100%**

**Síntoma ADC = 0:**
```
ADC Raw: 0-10 | Humedad: 0%
```
**Causa:** Cable a A0 no conectado

**Síntoma ADC = 1023:**
```
ADC Raw: 1020-1023 | Humedad: 100%
```
**Causa:** Cable en corto con 5V o GND

**Solución:**
1. Verificar cable a A0
2. Revisar que no haya cortos
3. Probar tocar el sensor con dedo húmedo → debe cambiar

---

### **Problema 5: Valores muy ruidosos (saltan mucho)**

**Síntoma:**
```
Lectura 1: 512 ADC → 25.0°C
Lectura 2: 487 ADC → 23.8°C
Lectura 3: 535 ADC → 26.2°C
```

**Causa:** Interferencia eléctrica o cables largos

**Solución:**
El código de prueba ya hace **promedio de 10 lecturas**, pero si persiste:
1. Usar cables más cortos
2. Alejar de motores/bombas
3. Agregar capacitor 0.1µF entre Pin 1 y GND del LM35CZ

---

## 📋 Checklist de Verificación

### **Antes de cargar código:**

- [ ] **LM35CZ conectado correctamente:**
  - [ ] Pin 1 (Vout) → Arduino A1
  - [ ] Pin 2 (GND) → Arduino GND
  - [ ] Pin 3 (Vcc) → Arduino 5V
  
- [ ] **Sensor humedad conectado:**
  - [ ] Cable a Arduino A0
  - [ ] GND a Arduino GND
  - [ ] VCC a Arduino 5V (si aplica)

### **Después de cargar código de prueba:**

- [ ] Serial Monitor abierto (115200 baud)
- [ ] Se muestran lecturas cada 2 segundos
- [ ] ADC de temperatura entre 300-700 (~15-35°C)
- [ ] Al tocar LM35CZ con dedos, **temperatura SUBE**
- [ ] Al soltar, temperatura **BAJA** de nuevo
- [ ] Humedad varía al tocar con dedo húmedo

---

## 🎯 Resultado Esperado

### **Con `test_sensores_simple.ino`:**

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⏰ Tiempo: 12 segundos

🌱 SENSOR DE HUMEDAD (Pin A0):
   └─ Lectura ADC: 345 / 1023  (33.7%)
   └─ Humedad: 33.7%
   ✅ Lectura normal

🌡️  SENSOR LM35CZ (Pin A1):
   └─ Lectura ADC: 487 / 1023  (47.6%)
   └─ Voltaje: 2.379 V
   └─ Temperatura: 23.79 °C
   ✅ Lectura normal
   ℹ️  Temperatura coherente con ambiente
```

**Si ves esto → Sensores funcionan correctamente** ✅

---

## 🚀 Siguiente Paso

Una vez verificado que los sensores funcionan con `test_sensores_simple.ino`:

1. **Cargar `sistema_riego_mqtt.ino`** (el código principal con WiFi y MQTT)
2. **Abrir Serial Monitor** (115200 baud)
3. **Buscar el bloque de debug cada 10 segundos:**
   ```
   --- LECTURA DE SENSORES ---
   🌱 Humedad Suelo (A0):
      ADC Raw: 345 | Porcentaje: 33.7%
   🌡️  Temperatura LM35CZ (A1):
      ADC Raw: 487 | Voltaje: 2.379V | Temp: 23.8°C
   ```

Si los valores son coherentes → **¡Todo funciona!** 🎉

---

## 📞 Soporte Adicional

Si después de las pruebas sigues teniendo problemas:

1. **Compartir salida completa del Serial Monitor**
2. **Foto de las conexiones físicas**
3. **Probar con multímetro:**
   - Voltaje en Pin 1 del LM35CZ (debe ser ~0.25V a 25°C)
   - Continuidad de cables

---

**✅ Archivos actualizados:**
- `sistema_riego_mqtt.ino` - Con debug detallado
- `test_sensores_simple.ino` - Sketch de prueba solo sensores
- Esta guía de diagnóstico
