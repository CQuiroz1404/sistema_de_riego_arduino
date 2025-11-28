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
                // Mapeo de días a números de FullCalendar (0=Domingo, 1=Lunes, etc.)
                const diasMap = {
                    'Domingo': 0, 'Lunes': 1, 'Martes': 2, 'Miércoles': 3, 
                    'Jueves': 4, 'Viernes': 5, 'Sábado': 6
                };
                
                const dayOfWeek = diasMap[evento.dia_semana];

                // Si tenemos un día válido, creamos un evento recurrente
                if (dayOfWeek !== undefined) {
                    const eventData = {
                        title: `Riego: ${evento.invernadero ? evento.invernadero.descripcion : 'Invernadero'}`,
                        daysOfWeek: [dayOfWeek], // Array con el día de la semana
                        startTime: evento.hora_inicial,
                        endTime: evento.hora_final,
                        color: '#10B981', // Green
                        description: `Semana ID: ${evento.semana_id}`,
                    };

                    // Agregar rango de fechas solo si existen
                    if (evento.fecha_inicio) {
                        eventData.startRecur = evento.fecha_inicio;
                    }
                    if (evento.fecha_fin) {
                        eventData.endRecur = evento.fecha_fin;
                    }

                    return eventData;
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
