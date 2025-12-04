/**
 * Script para crear un evento de prueba para el minuto siguiente
 */

const { Calendario } = require('../src/models');

async function crearEventoPrueba() {
  try {
    const now = new Date();
    
    // Calcular siguiente minuto
    const proximaHora = new Date(now.getTime() + 2 * 60 * 1000); // 2 minutos en el futuro
    const hora = proximaHora.getHours().toString().padStart(2, '0');
    const minutos = proximaHora.getMinutes().toString().padStart(2, '0');
    const horaInicial = `${hora}:${minutos}:00`;
    
    // Hora final (1 minuto después)
    const horaFinalDate = new Date(proximaHora.getTime() + 60 * 1000);
    const horaFinal = `${horaFinalDate.getHours().toString().padStart(2, '0')}:${horaFinalDate.getMinutes().toString().padStart(2, '0')}:00`;
    
    const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const diaActual = dias[now.getDay()];

    console.log('\n🎯 Creando evento de prueba...\n');
    console.log(`📅 Día: ${diaActual}`);
    console.log(`🕐 Hora inicial: ${horaInicial}`);
    console.log(`🕐 Hora final: ${horaFinal}`);
    console.log(`⏱️  Duración: 1 minuto\n`);

    // Primero, necesitamos asociar el dispositivo a un invernadero
    const { Dispositivos } = require('../src/models');
    
    // Verificar a qué invernadero está asociado el dispositivo
    const dispositivo = await Dispositivos.findByPk(5);
    
    if (!dispositivo.invernadero_id) {
      console.log('⚙️  Asociando dispositivo al invernadero primero...');
      await Dispositivos.update(
        { invernadero_id: 3 }, // semillero exterior
        { where: { id: 5 } }
      );
      console.log('✅ Dispositivo asociado a invernadero ID: 3\n');
    }

    const evento = await Calendario.create({
      invernadero_id: 3, // semillero exterior (que tiene el evento a las 23:58)
      dia_semana: diaActual,
      hora_inicial: horaInicial,
      hora_final: horaFinal,
      duracion_minutos: 1, // 1 minuto para prueba rápida
      estado: true,
      usuario_id: 1 // Asumiendo que el usuario ID 1 existe
    });

    console.log('✅ Evento de prueba creado con ID:', evento.id);
    console.log(`\n⏰ El riego debería activarse automáticamente a las ${horaInicial}`);
    console.log('💧 Duración: 1 minuto');
    console.log('\n👀 Observa los logs del servidor para ver la activación...\n');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    process.exit(0);
  }
}

crearEventoPrueba();
