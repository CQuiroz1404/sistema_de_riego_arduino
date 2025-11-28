/**
 * Script de prueba para insertar lecturas manualmente
 * Simula que el Arduino envió datos
 */

const { Lecturas } = require('./src/models');

async function insertarLecturasPrueba() {
  console.log('Insertando lecturas de prueba para sensores 7, 8, 9...\n');

  try {
    // Sensor 7: LM35 Temperatura Suelo
    const l1 = await Lecturas.create({
      sensor_id: 7,
      valor: 22.5,
      fecha_lectura: new Date()
    });
    console.log('✅ Lectura creada - Sensor 7 (LM35): 22.5°C');

    // Sensor 8: DHT11 Temperatura Aire
    const l2 = await Lecturas.create({
      sensor_id: 8,
      valor: 28.5,
      fecha_lectura: new Date()
    });
    console.log('✅ Lectura creada - Sensor 8 (DHT11 Temp): 28.5°C');

    // Sensor 9: DHT11 Humedad Aire
    const l3 = await Lecturas.create({
      sensor_id: 9,
      valor: 45.0,
      fecha_lectura: new Date()
    });
    console.log('✅ Lectura creada - Sensor 9 (DHT11 Hum): 45%');

    console.log('\n✅ 3 lecturas insertadas correctamente');
    console.log('\n📱 Refresca el dashboard en: http://localhost:3000/devices/6');
    console.log('   Deberías ver los valores en los sensores');

  } catch (error) {
    console.error('❌ Error al insertar lecturas:', error);
  }

  process.exit(0);
}

insertarLecturasPrueba();
