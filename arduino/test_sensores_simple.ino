/*
 * PRUEBA SIMPLE DE SENSORES - Solo LM35DZ/CZ
 * Sin WiFi ni MQTT - Solo lectura de temperatura
 * 
 * Compatible con LM35DZ y LM35CZ (funcionan igual)
 * Ambos modelos: 10mV/°C, rango 0-100°C
 */

// Pin del sensor de temperatura
const int PIN_LM35 = A1;

void setup() {
  Serial.begin(115200);
  while (!Serial && millis() < 3000);
  
  Serial.println("\n========================================");
  Serial.println("  PRUEBA SENSOR LM35DZ/CZ - MODO DEBUG");
  Serial.println("  Solo Temperatura");
  Serial.println("========================================");
  Serial.println("Leyendo cada 1 segundo...\n");
  
  // Configurar pines como entrada
  pinMode(PIN_LM35, INPUT);
  pinMode(LED_BUILTIN, OUTPUT);
}

void loop() {
  // Parpadeo LED para indicar que está funcionando
  digitalWrite(LED_BUILTIN, HIGH);
  
  Serial.println("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  Serial.print("⏰ Tiempo: ");
  Serial.print(millis() / 1000);
  Serial.println(" segundos");
  Serial.println();
  
  // ============================================
  // SENSOR LM35DZ/CZ (A1)
  // ============================================
  Serial.println("🌡️  SENSOR LM35DZ/CZ (Pin A1):");
  
  // Hacer varias lecturas para estabilizar
  int sumaLM35 = 0;
  for (int i = 0; i < 10; i++) {
    sumaLM35 += analogRead(PIN_LM35);
    delay(10);
  }
  int lm35Raw = sumaLM35 / 10;
  
  // Convertir a voltaje
  float voltaje = (lm35Raw * 5.0) / 1023.0;
  
  // Convertir a temperatura (10mV/°C)
  float temperatura = voltaje * 100.0;
  
  Serial.print("   └─ Lectura ADC: ");
  Serial.print(lm35Raw);
  Serial.print(" / 1023");
  Serial.print("  (");
  Serial.print((lm35Raw * 100.0) / 1023.0, 1);
  Serial.println("%)");
  
  Serial.print("   └─ Voltaje: ");
  Serial.print(voltaje, 3);
  Serial.println(" V");
  
  Serial.print("   └─ Temperatura: ");
  Serial.print(temperatura, 2);
  Serial.println(" °C");
  
  // Diagnóstico
  if (lm35Raw < 10) {
    Serial.println("   ❌ ERROR: Lectura casi 0 - ¿Pin 1 del LM35DZ/CZ conectado a A1?");
    Serial.println("   Verificar:");
    Serial.println("      - Pin 1 (Vout) → A1");
    Serial.println("      - Pin 2 (GND)  → GND");
    Serial.println("      - Pin 3 (Vcc)  → 5V");
  } else if (lm35Raw > 900) {
    Serial.println("   ❌ ERROR: Lectura muy alta - ¿Pin 1 conectado a 5V por error?");
  } else if (temperatura < 0 || temperatura > 60) {
    Serial.println("   ⚠️  ADVERTENCIA: Temperatura fuera de rango normal");
    Serial.println("      Temp normal ambiente: 15-35°C");
  } else {
    Serial.println("   ✅ Lectura normal");
  }
  
  // Sugerencia de temperatura esperada
  if (temperatura >= 15 && temperatura <= 35) {
    Serial.println("   ℹ️  Temperatura coherente con ambiente");
  }
  
  Serial.println();
  
  // ============================================
  // PRUEBAS ADICIONALES
  // ============================================
  Serial.println("🧪 PRUEBA MANUAL:");
  Serial.println("   1. Sostén el LM35DZ/CZ con tus dedos (5 seg)");
  Serial.println("      → La temperatura debe SUBIR a ~32-36°C");
  Serial.println("   2. Sopla aire cerca del sensor");
  Serial.println("      → La temperatura debe VARIAR ligeramente");
  Serial.println("   3. Acerca hielo (sin tocar)");
  Serial.println("      → La temperatura debe BAJAR");
  
  Serial.println("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
  
  digitalWrite(LED_BUILTIN, LOW);
  
  // Esperar 1 segundo para actualización rápida
  delay(1000);
}

/*
 * INTERPRETACIÓN DE RESULTADOS:
 * 
 * TEMPERATURA LM35DZ/CZ (A1):
 * - ADC ~102 (0.5V)   → 0°C (hielo)
 * - ADC ~153 (0.75V)  → 7.5°C (refrigerador)
 * - ADC ~204 (1.0V)   → 10°C
 * - ADC ~256 (1.25V)  → 12.5°C
 * - ADC ~307 (1.5V)   → 15°C
 * - ADC ~409 (2.0V)   → 20°C
 * - ADC ~460 (2.25V)  → 22.5°C
 * - ADC ~512 (2.5V)   → 25°C ← TEMPERATURA AMBIENTE TÍPICA
 * - ADC ~563 (2.75V)  → 27.5°C
 * - ADC ~614 (3.0V)   → 30°C
 * - ADC ~665 (3.25V)  → 32.5°C (temperatura corporal)
 * - ADC ~716 (3.5V)   → 35°C
 * - ADC ~767 (3.75V)  → 37.5°C
 * 
 * PROBLEMAS COMUNES:
 * 
 * 1. LM35DZ lee 0°C (ADC ~0-50):
 *    → Pin 1 no conectado o cable suelto a A1
 *    → Revisar conexiones
 * 
 * 2. LM35DZ lee 48.8°C constante (ADC ~1000):
 *    → Pin 1 conectado a 5V por error
 *    → Revisar polaridad del LM35DZ (parte plana hacia ti)
 * 
 * 3. Temperatura no varía al tocar:
 *    → Sensor dañado o en corto
 *    → Probar con multímetro: Pin 1 debe tener ~0.25V a 25°C
 */
