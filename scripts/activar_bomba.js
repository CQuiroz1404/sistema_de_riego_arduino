/**
 * Script para activar la bomba del dispositivo 5
 */

const { Actuadores } = require('../src/models');

async function activarBomba() {
  try {
    console.log('\n🔧 Activando bomba...\n');

    const result = await Actuadores.update(
      { activo: true },
      { where: { dispositivo_id: 5, tipo: 'bomba' } }
    );

    console.log(`✅ ${result[0]} bomba(s) activada(s)`);

    // Verificar
    const bombas = await Actuadores.findAll({
      where: { dispositivo_id: 5, tipo: 'bomba' }
    });

    console.log('\n📋 Estado actual de bombas:');
    bombas.forEach(b => {
      console.log(`   - ID: ${b.id}, Nombre: ${b.nombre}, Activo: ${b.activo}, Pin: ${b.pin}`);
    });
    console.log();

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    process.exit(0);
  }
}

activarBomba();
