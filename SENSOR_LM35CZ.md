# 🌡️ Configuración Sensor LM35CZ

## ✅ Código Actualizado

El archivo `sistema_riego_mqtt.ino` ha sido **actualizado correctamente** para usar el sensor LM35CZ en el pin **A1**.

---

## 🔌 Conexión Física del LM35CZ

### **Pinout del LM35CZ (vista frontal, parte plana hacia ti):**

```
    ┌─────────┐
    │         │
    │  LM35CZ │
    │         │
    └─┬─┬─┬───┘
      │ │ │
      1 2 3

Pin 1: Vout  → Arduino A1 (señal analógica)
Pin 2: GND   → Arduino GND
Pin 3: Vcc   → Arduino 5V
```

### **Conexión en Arduino UNO R4 WiFi:**
```
LM35CZ Pin 1 (Vout) ───────► Arduino A1
LM35CZ Pin 2 (GND)  ───────► Arduino GND
LM35CZ Pin 3 (Vcc)  ───────► Arduino 5V
```

---

## 📐 Fórmula de Conversión Implementada

### **Características del LM35CZ:**
- **Salida:** 10mV por cada grado Celsius
- **Rango:** -55°C a +150°C
- **Precisión:** ±0.5°C (a 25°C)
- **Voltaje de alimentación:** 4V a 30V

### **Conversión en Arduino R4:**

Arduino R4 WiFi tiene ADC de **10 bits** (0-1023):
- **0** = 0V
- **1023** = 5V
- **Resolución:** 5V / 1023 = ~4.89 mV por paso

**Fórmula implementada:**
```cpp
int lecturaLM35 = analogRead(PIN_LM35);
float temperatura = (lecturaLM35 * 5.0 * 100.0) / 1023.0;
```

**Explicación paso a paso:**
1. `lecturaLM35` = valor ADC (0-1023)
2. `lecturaLM35 * 5.0` = voltaje en milivoltios
3. `/ 1023.0` = normalización del ADC
4. `* 100.0` = conversión de 10mV/°C a °C

**Ejemplo:**
- Lectura ADC: 512
- Voltaje: (512 * 5.0) / 1023 = 2.5V
- Temperatura: 2.5V / 0.01V = **25°C** ✅

---

## 🔍 Verificación en Serial Monitor

Al cargar el código, deberías ver:

```
📊 Sensores enviados: Humedad=65.5%, Temp=23.4°C
```

**Si la temperatura parece incorrecta:**
1. Verificar conexiones físicas (Pin 1 → A1, Pin 2 → GND, Pin 3 → 5V)
2. Verificar polaridad del LM35CZ (parte plana hacia ti)
3. Medir voltaje en Pin 1 con multímetro (debe ser ~250mV a 25°C)

---

## 🧪 Prueba de Calibración

### **Método 1: Temperatura Ambiente**
1. Dejar LM35CZ en reposo 5 minutos
2. Comparar con termómetro de referencia
3. Diferencia aceptable: ±1°C

### **Método 2: Mano**
1. Sostener LM35CZ con los dedos
2. Temperatura debe subir a ~30-35°C
3. Al soltar, debe volver a temperatura ambiente

### **Método 3: Hielo**
1. Colocar LM35CZ cerca de hielo (sin tocar)
2. Temperatura debe bajar hacia 0°C
3. Alejarlo, debe volver a subir

---

## ⚙️ Ajuste Fino (Opcional)

Si necesitas mayor precisión, puedes agregar un **offset de calibración**:

```cpp
// Después de la línea 343
float temperatura = (lecturaLM35 * 5.0 * 100.0) / 1023.0;

// Agregar offset si es necesario (ajustar según tu calibración)
const float OFFSET_LM35 = 0.0;  // Cambiar si hay diferencia constante
temperatura = temperatura + OFFSET_LM35;
```

**Ejemplo:**
- Si el sensor siempre lee 2°C menos, usa `OFFSET_LM35 = 2.0`
- Si siempre lee 1.5°C más, usa `OFFSET_LM35 = -1.5`

---

## 🛡️ Protección del Sensor

### **Recomendaciones:**
1. **No exceder 5.5V** en Vcc (puede dañarse)
2. **Evitar cortocircuitos** entre pines
3. **No tocar con dedos mojados** (interferencia)
4. **Alejar de fuentes de calor** directo (bombas, actuadores)

### **Filtrado de Ruido (Opcional):**

Si las lecturas son muy ruidosas, puedes promediar:

```cpp
// Reemplazar línea 340-343 con:
float sumaLecturas = 0;
for (int i = 0; i < 10; i++) {
  sumaLecturas += analogRead(PIN_LM35);
  delay(10);
}
float promedioLectura = sumaLecturas / 10.0;
float temperatura = (promedioLectura * 5.0 * 100.0) / 1023.0;
```

---

## 📊 Comparación LM35 vs DHT22

| Característica | LM35CZ | DHT22 |
|---------------|--------|-------|
| **Precisión** | ±0.5°C | ±0.5°C |
| **Rango Temperatura** | -55 a +150°C | -40 a +80°C |
| **Humedad** | ❌ No | ✅ Sí (0-100%) |
| **Interfaz** | Analógica | Digital |
| **Complejidad** | Muy simple | Requiere librería |
| **Velocidad** | Instantáneo | ~2 segundos |
| **Precio** | ~$1-2 USD | ~$3-5 USD |

**Ventaja del LM35CZ:** Ideal para solo medir temperatura de forma simple y precisa.

---

## 🔧 Código Modificado

### **Cambios realizados en `sistema_riego_mqtt.ino`:**

1. **Línea 37:** Cambio de pin
   ```cpp
   // ANTES
   const int PIN_DHT = 2;  // Si usas DHT11/DHT22
   
   // DESPUÉS
   const int PIN_LM35 = A1;  // Sensor de temperatura LM35CZ
   ```

2. **Líneas 340-343:** Lectura real del sensor
   ```cpp
   // ANTES (simulado)
   float temperatura = 25.0 + random(-5, 5);
   
   // DESPUÉS (lectura real)
   int lecturaLM35 = analogRead(PIN_LM35);
   float temperatura = (lecturaLM35 * 5.0 * 100.0) / 1023.0;
   ```

3. **Líneas 1-15:** Documentación actualizada con conexión del LM35CZ

---

## ✅ Checklist de Verificación

Antes de cargar el código:

- [ ] LM35CZ conectado físicamente
  - [ ] Pin 1 (Vout) → Arduino A1
  - [ ] Pin 2 (GND) → Arduino GND
  - [ ] Pin 3 (Vcc) → Arduino 5V
- [ ] Código actualizado con la configuración correcta
- [ ] `PIN_LM35 = A1` configurado en línea 37
- [ ] Fórmula de conversión implementada en línea 340-343
- [ ] Arduino UNO R4 WiFi seleccionado en Arduino IDE
- [ ] Puerto COM correcto seleccionado

Después de cargar:

- [ ] Serial Monitor abierto (115200 baud)
- [ ] Temperatura mostrada es coherente con ambiente (~20-30°C)
- [ ] Temperatura varía al calentar/enfriar el sensor
- [ ] Datos enviados correctamente por MQTT

---

## 🎯 Resultado Esperado

```
📊 Sensores enviados: Humedad=67.2%, Temp=24.3°C
📊 Sensores enviados: Humedad=67.5%, Temp=24.4°C
📊 Sensores enviados: Humedad=67.1%, Temp=24.3°C
```

**Si ves valores como:**
- `Temp=0.0°C` → Pin 1 no conectado o cable suelto
- `Temp=48.8°C` → Revisa la fórmula o el pin configurado
- `Temp=100.0°C` → Pin 1 conectado a 5V (error de conexión)

---

## 📞 Soporte

Si la temperatura no es coherente:

1. **Verificar voltaje en Pin 1:**
   - Usar multímetro
   - A 25°C debe leer ~250mV (0.25V)
   - A 30°C debe leer ~300mV (0.30V)

2. **Verificar en Arduino Serial Monitor:**
   ```cpp
   // Agregar después de línea 340 para debug:
   Serial.print("Lectura ADC: ");
   Serial.print(lecturaLM35);
   Serial.print(" | Voltaje: ");
   Serial.print((lecturaLM35 * 5.0) / 1023.0);
   Serial.println("V");
   ```

3. **Probar con código simple:**
   ```cpp
   void loop() {
     int lectura = analogRead(A1);
     float voltaje = (lectura * 5.0) / 1023.0;
     float temp = voltaje * 100.0;
     
     Serial.print("ADC: ");
     Serial.print(lectura);
     Serial.print(" | V: ");
     Serial.print(voltaje);
     Serial.print(" | Temp: ");
     Serial.println(temp);
     
     delay(1000);
   }
   ```

---

**✅ Código actualizado y listo para usar con LM35CZ en pin A1.**
