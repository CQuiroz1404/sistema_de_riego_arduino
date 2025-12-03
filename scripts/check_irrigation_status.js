const { sequelize } = require('../src/config/baseDatos');

async function checkLastIrrigation() {
  try {
    console.log('\n🔍 Verificando última activación de riego...\n');
    
    // Verificar última actualización en actuadores
    const [actuadores] = await sequelize.query(`
      SELECT 
        a.id,
        a.tipo,
        a.pin,
        a.estado,
        a.ultima_actualizacion,
        d.nombre as dispositivo
      FROM actuadores a
      JOIN dispositivos d ON a.dispositivo_id = d.id
      WHERE a.tipo = 'bomba'
      ORDER BY a.ultima_actualizacion DESC
      LIMIT 5
    `);
    
    console.log('📊 Estado de Bombas:\n');
    actuadores.forEach(act => {
      const estadoIcon = act.estado ? '✅ ENCENDIDA' : '❌ APAGADA';
      console.log(`${estadoIcon} - ${act.dispositivo}`);
      console.log(`   ID: ${act.id} | Pin: ${act.pin}`);
      console.log(`   Última actualización: ${act.ultima_actualizacion || 'Nunca'}\n`);
    });
    
    // Verificar últimos eventos de riego
    const [eventos] = await sequelize.query(`
      SELECT 
        e.*,
        d.nombre as dispositivo
      FROM eventos_riego e
      JOIN dispositivos d ON e.dispositivo_id = d.id
      ORDER BY e.fecha_evento DESC
      LIMIT 10
    `);
    
    if (eventos.length > 0) {
      console.log('📋 Últimos 10 Eventos de Riego:\n');
      eventos.forEach(ev => {
        const tipoIcon = ev.tipo_evento === 'inicio' ? '🟢 INICIO' : '🔴 FIN';
        console.log(`${tipoIcon} - ${ev.dispositivo}`);
        console.log(`   Modo: ${ev.modo || 'N/A'}`);
        console.log(`   Fecha: ${ev.fecha_evento}`);
        console.log(`   Duración: ${ev.duracion_minutos || 'N/A'} min\n`);
      });
    } else {
      console.log('⚠️  No hay eventos de riego registrados\n');
    }
    
    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkLastIrrigation();
