/**
 * Script de diagnóstico para verificar eventos del calendario
 */

const { Calendario, Invernaderos, Dispositivos, Actuadores, Usuarios } = require('../src/models');

async function verificarCalendario() {
  try {
    console.log('\n' + '='.repeat(60));
    console.log('🔍 DIAGNÓSTICO DE CALENDARIO');
    console.log('='.repeat(60) + '\n');

    // Obtener día actual
    const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const now = new Date();
    const diaActual = dias[now.getDay()];
    const horaActual = now.toTimeString().substring(0, 8);

    console.log(`📅 Hoy es: ${diaActual}`);
    console.log(`🕐 Hora actual: ${horaActual}\n`);

    // Buscar todos los eventos activos
    const eventos = await Calendario.findAll({
      where: { estado: true },
      include: [
        {
          model: Invernaderos,
          as: 'invernadero',
          include: [
            {
              model: Dispositivos,
              as: 'dispositivos'
            }
          ]
        },
        {
          model: Usuarios,
          as: 'usuario'
        }
      ]
    });

    console.log(`📋 Total de eventos activos en BD: ${eventos.length}\n`);

    if (eventos.length === 0) {
      console.log('⚠️  NO HAY EVENTOS CONFIGURADOS EN EL CALENDARIO');
      console.log('\n💡 Necesitas crear un evento desde la web:');
      console.log('   1. Ve a http://localhost:3000/calendar');
      console.log('   2. Crea un nuevo evento');
      console.log('   3. Selecciona día, hora y duración\n');
      process.exit(0);
    }

    // Mostrar eventos del día actual
    const eventosHoy = eventos.filter(e => e.dia_semana === diaActual);
    
    console.log(`📌 Eventos para ${diaActual}: ${eventosHoy.length}\n`);

    if (eventosHoy.length === 0) {
      console.log(`⚠️  No hay eventos programados para ${diaActual}`);
      console.log('\n📋 Eventos en otros días:');
      eventos.forEach(e => {
        console.log(`   - ${e.dia_semana} ${e.hora_inicial} (Invernadero: ${e.invernadero?.descripcion || 'N/A'})`);
      });
    } else {
      eventosHoy.forEach((evento, index) => {
        console.log(`\n${index + 1}. Evento ID: ${evento.id}`);
        console.log(`   Día: ${evento.dia_semana}`);
        console.log(`   Hora: ${evento.hora_inicial} - ${evento.hora_final}`);
        console.log(`   Duración: ${evento.duracion_minutos || 'NO CONFIGURADO (usar 10 min default)'} minutos`);
        console.log(`   Invernadero: ${evento.invernadero?.descripcion || 'N/A'} (ID: ${evento.invernadero_id})`);
        console.log(`   Usuario: ${evento.usuario?.nombre || 'N/A'}`);
        
        if (evento.invernadero?.dispositivos) {
          console.log(`   Dispositivos asociados: ${evento.invernadero.dispositivos.length}`);
          evento.invernadero.dispositivos.forEach(d => {
            console.log(`     - ${d.nombre} (ID: ${d.id}, API_KEY: ${d.api_key?.substring(0, 8)}..., Estado: ${d.estado})`);
          });
        } else {
          console.log(`   ⚠️  Invernadero sin dispositivos asociados`);
        }
      });
    }

    console.log('\n' + '='.repeat(60));
    console.log('🔍 VERIFICANDO ACTUADORES (BOMBAS)');
    console.log('='.repeat(60) + '\n');

    // Verificar actuadores
    const actuadores = await Actuadores.findAll({
      where: { tipo: 'bomba' },
      include: [{ model: Dispositivos, as: 'dispositivo' }]
    });

    console.log(`💧 Total de bombas en BD: ${actuadores.length}\n`);

    if (actuadores.length === 0) {
      console.log('❌ NO HAY BOMBAS CONFIGURADAS');
      console.log('\n💡 Necesitas crear un actuador tipo "bomba":');
      console.log('   1. Ve a dispositivos');
      console.log('   2. Edita tu dispositivo');
      console.log('   3. Agrega un actuador tipo "bomba"\n');
    } else {
      actuadores.forEach((bomba, index) => {
        console.log(`${index + 1}. ${bomba.nombre}`);
        console.log(`   ID: ${bomba.id}`);
        console.log(`   Pin: ${bomba.pin}`);
        console.log(`   Estado: ${bomba.estado}`);
        console.log(`   Activo: ${bomba.activo ? 'Sí' : 'No'}`);
        console.log(`   Dispositivo: ${bomba.dispositivo?.nombre || 'N/A'} (ID: ${bomba.dispositivo_id})\n`);
      });
    }

    console.log('='.repeat(60));
    console.log('✅ Diagnóstico completado');
    console.log('='.repeat(60) + '\n');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    process.exit(0);
  }
}

verificarCalendario();
