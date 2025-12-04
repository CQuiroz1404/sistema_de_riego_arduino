/**
 * Script para asociar el dispositivo "prueba calendario" al invernadero del evento
 */

const { Dispositivos } = require('../src/models');

async function asociarDispositivo() {
  try {
    console.log('\n🔧 Asociando dispositivo al invernadero...\n');

    // Asociar dispositivo ID 5 al invernadero ID 3 (semillero exterior)
    await Dispositivos.update(
      { invernadero_id: 3 },
      { where: { id: 5 } }
    );

    console.log('✅ Dispositivo "prueba calendario" (ID: 5) asociado a invernadero "semillero exterior" (ID: 3)');
    console.log('\n💡 Ahora cuando el evento se active a las 23:58, encontrará el dispositivo y activará la bomba.\n');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    process.exit(0);
  }
}

asociarDispositivo();
