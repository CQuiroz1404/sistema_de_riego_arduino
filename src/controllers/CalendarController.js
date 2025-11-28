const { Calendario, Invernaderos, Semanas } = require('../models');

const CalendarController = {
    index: async (req, res) => {
        try {
            const semanas = await Semanas.findAll();
            res.render('calendar/index', {
                title: 'Calendario de Riego',
                useFullCalendar: true,
                user: req.user,
                semanas
            });
        } catch (error) {
            console.error('Error al cargar calendario:', error);
            res.status(500).render('error', { message: 'Error al cargar el calendario' });
        }
    },

    getEvents: async (req, res) => {
        try {
            const { semana_id } = req.query;
            const whereClause = {};
            
            if (semana_id) {
                whereClause.semana_id = semana_id;
            }

            const eventos = await Calendario.findAll({
                where: whereClause,
                include: [{ model: Invernaderos }]
            });

            const events = eventos.map(evento => {
                // Mapeo de dÃ­as a nÃºmeros de FullCalendar (0=Domingo, 1=Lunes, etc.)
                const diasMap = {
                    'Domingo': 0, 'Lunes': 1, 'Martes': 2, 'MiÃ©rcoles': 3, 
                    'Jueves': 4, 'Viernes': 5, 'SÃ¡bado': 6
                };
                
                const dayOfWeek = diasMap[evento.dia_semana];

                // Si tenemos un dÃ­a vÃ¡lido, creamos un evento recurrente
                if (dayOfWeek !== undefined) {
                    return {
                        title: `Riego: ${evento.invernadero ? evento.invernadero.descripcion : 'Invernadero'}`,
                        daysOfWeek: [dayOfWeek], // Array con el dÃ­a de la semana
                        startTime: evento.hora_inicial,
                        endTime: evento.hora_final,
                        startRecur: evento.fecha_inicio, // Fecha de inicio de la recurrencia
                        endRecur: evento.fecha_fin,     // Fecha de fin de la recurrencia
                        color: '#10B981', // Green
                        description: `Semana ID: ${evento.semana_id}`,
                    };
                }

                // Fallback para eventos antiguos sin dia_semana (si los hubiera)
                // ... (cÃ³digo anterior omitido por simplicidad, asumimos que todos tienen dia_semana ahora)
                return null;
            }).filter(e => e !== null);

            res.json(events);
        } catch (error) {
            console.error('Error al obtener eventos:', error);
            res.status(500).json([]);
        }
    }
};

module.exports = CalendarController;
