/**
 * Script de Diagnóstico de Base de Datos
 * Verifica sensores, dispositivos y lecturas
 */

const { Dispositivos, Sensores, Actuadores, Lecturas } = require('./src/models');

async function diagnosticar() {
  console.log('\n========================================');
  console.log('  DIAGNÓSTICO DE BASE DE DATOS');
  console.log('========================================\n');

  try {
    // 1. DISPOSITIVOS
    console.log('📱 DISPOSITIVOS:');
    const dispositivos = await Dispositivos.findAll();
    
    if (dispositivos.length === 0) {
      console.log('   ❌ No hay dispositivos registrados');
    } else {
      dispositivos.forEach(d => {
        console.log(`   ✅ ID ${d.id}: ${d.nombre}`);
        console.log(`      API Key: ${d.api_key.substring(0, 20)}...`);
        console.log(`      Usuario ID: ${d.usuario_id}`);
        console.log(`      Estado: ${d.estado}`);
        console.log(`      Última conexión: ${d.ultima_conexion || 'Nunca'}`);
      });
    }

    console.log('\n📊 SENSORES:');
    const sensores = await Sensores.findAll({
      order: [['dispositivo_id', 'ASC'], ['id', 'ASC']]
    });
    
    if (sensores.length === 0) {
      console.log('   ❌ No hay sensores registrados');
    } else {
      console.log(`   Total: ${sensores.length} sensores\n`);
      
      sensores.forEach(s => {
        console.log(`   ✅ Sensor ID ${s.id}:`);
        console.log(`      Nombre: ${s.nombre}`);
        console.log(`      Dispositivo ID: ${s.dispositivo_id}`);
        console.log(`      Tipo: ${s.tipo}`);
        console.log(`      Pin: ${s.pin}`);
        console.log(`      Unidad: ${s.unidad}`);
        console.log(`      Activo: ${s.activo ? 'Sí' : 'No'}`);
        console.log(`      Rango: ${s.valor_minimo} - ${s.valor_maximo}`);
        console.log('');
      });
    }

    console.log('🎛️  ACTUADORES:');
    const actuadores = await Actuadores.findAll({
      order: [['dispositivo_id', 'ASC'], ['id', 'ASC']]
    });
    
    if (actuadores.length === 0) {
      console.log('   ❌ No hay actuadores registrados');
    } else {
      actuadores.forEach(a => {
        console.log(`   ✅ ID ${a.id}: ${a.nombre} (${a.tipo})`);
        console.log(`      Dispositivo ID: ${a.dispositivo_id}`);
        console.log(`      Pin: ${a.pin}`);
        console.log(`      Estado: ${a.estado}`);
      });
    }

    console.log('\n📈 LECTURAS RECIENTES (últimas 10):');
    const lecturas = await Lecturas.findAll({
      limit: 10,
      order: [['fecha_lectura', 'DESC']],
      include: [{ model: Sensores, attributes: ['nombre', 'unidad'] }]
    });
    
    if (lecturas.length === 0) {
      console.log('   ❌ No hay lecturas registradas');
    } else {
      lecturas.forEach(l => {
        const sensor = l.Sensore || { nombre: 'Desconocido', unidad: '' };
        console.log(`   📊 ${l.fecha_lectura.toISOString().substring(0, 19).replace('T', ' ')}`);
        console.log(`      Sensor ID ${l.sensor_id}: ${sensor.nombre}`);
        console.log(`      Valor: ${l.valor} ${sensor.unidad}`);
      });
    }

    console.log('\n========================================');
    console.log('  VERIFICACIONES');
    console.log('========================================\n');

    // Verificar sensores del dispositivo 1
    const sensoresDisp1 = sensores.filter(s => s.dispositivo_id === 1);
    console.log(`✓ Sensores del dispositivo 1: ${sensoresDisp1.length}`);
    
    if (sensoresDisp1.length === 0) {
      console.log('  ⚠️  NO HAY SENSORES para dispositivo 1');
      console.log('  ➜ Ejecuta: database/update_sensores.sql');
    } else {
      console.log('  ✓ IDs encontrados:', sensoresDisp1.map(s => s.id).join(', '));
      
      // Verificar IDs específicos
      const ids = [1, 2, 3];
      ids.forEach(id => {
        const sensor = sensoresDisp1.find(s => s.id === id);
        if (sensor) {
          console.log(`  ✅ Sensor ID ${id}: ${sensor.nombre}`);
        } else {
          console.log(`  ❌ Sensor ID ${id}: NO EXISTE`);
        }
      });
    }

    // Verificar API Key del Arduino
    const apiKeyArduino = '1a3a499c6d98c6a6ddc381260d643d9d0915aa85458e9a96b0385738c33838b2';
    const deviceWithKey = dispositivos.find(d => d.api_key === apiKeyArduino);
    
    console.log('\n✓ API Key del Arduino:');
    if (deviceWithKey) {
      console.log(`  ✅ Encontrado en dispositivo ID ${deviceWithKey.id}: ${deviceWithKey.nombre}`);
    } else {
      console.log('  ❌ NO ENCONTRADO en la base de datos');
      console.log('  ➜ API Key esperado:', apiKeyArduino.substring(0, 30) + '...');
      console.log('  ➜ API Keys en BD:');
      dispositivos.forEach(d => {
        console.log(`     - Dispositivo ${d.id}: ${d.api_key.substring(0, 30)}...`);
      });
    }

    console.log('\n========================================');
    console.log('  RESUMEN');
    console.log('========================================');
    console.log(`Dispositivos: ${dispositivos.length}`);
    console.log(`Sensores: ${sensores.length}`);
    console.log(`Actuadores: ${actuadores.length}`);
    console.log(`Lecturas: ${lecturas.length > 0 ? 'Sí (' + lecturas.length + ' recientes)' : 'No'}`);
    console.log('========================================\n');

  } catch (error) {
    console.error('❌ Error en diagnóstico:', error);
  }

  process.exit(0);
}

// Ejecutar
diagnosticar();
