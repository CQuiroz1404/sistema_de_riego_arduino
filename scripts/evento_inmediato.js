require('dotenv').config();
const { Calendario, Invernaderos } = require('../src/models');

async function crearEventoInmediato() {
    try {
        const ahora = new Date();
        
        // Obtener minuto actual + 1
        const minutoProximo = new Date(ahora);
        minutoProximo.setMinutes(minutoProximo.getMinutes() + 1);
        minutoProximo.setSeconds(0);
        minutoProximo.setMilliseconds(0);
        
        // Obtener día de la semana (0=Domingo, 1=Lunes, etc.)
        const diasSemana = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
        const diaSemana = diasSemana[minutoProximo.getDay()];
        
        // Hora y minuto
        const hora = minutoProximo.getHours().toString().padStart(2, '0');
        const minuto = minutoProximo.getMinutes().toString().padStart(2, '0');
        const horaInicio = `${hora}:${minuto}:00`;
        
        // Calcular hora fin (1 minuto después)
        const minutoFin = new Date(minutoProximo);
        minutoFin.setMinutes(minutoFin.getMinutes() + 1);
        const horaFin = `${minutoFin.getHours().toString().padStart(2, '0')}:${minutoFin.getMinutes().toString().padStart(2, '0')}:00`;
        
        console.log('\n🎯 Creando evento INMEDIATO...\n');
        console.log(`📅 Día: ${diaSemana}`);
        console.log(`🕐 Hora: ${horaInicio} - ${horaFin}`);
        console.log(`⏱️  Se activará en ~${60 - ahora.getSeconds()} segundos\n`);
        
        const evento = await Calendario.create({
            invernadero_id: 3,
            usuario_id: 1,
            dia_semana: diaSemana,
            hora_inicial: horaInicio,  // CORREGIDO: era hora_inicio
            hora_final: horaFin,
            duracion_minutos: 1,
            estado: true
        });
        
        console.log(`✅ Evento creado con ID: ${evento.id}`);
        console.log(`⏰ El riego se activará automáticamente a las ${horaInicio}`);
        console.log(`💧 Duración: 1 minuto\n`);
        console.log(`📺 Monitorea los logs del servidor...`);
        
        process.exit(0);
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

crearEventoInmediato();
