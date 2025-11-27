const { Calendario, Invernaderos, Semanas } = require('../models');

const CalendarController = {
    index: async (req, res) => {
        try {
            const semanas = await Semanas.findAll();
            res.render('calendar/index', {
                title: 'Calendario de Riego',
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
                // Convertir día de la semana a fecha real (próximo ocurrencia)
                const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
                const diaIndex = dias.indexOf(evento.dia_semana);
                
                let date = new Date();
                // Si no hay día definido, usar hoy
                if (diaIndex === -1) {
                    // Mantener fecha actual
                } else {
                    // Calcular próximo día de la semana
                    const currentDay = date.getDay();
                    const distance = (diaIndex + 7 - currentDay) % 7;
                    date.setDate(date.getDate() + distance);
                }

                const dateStr = date.toISOString().split('T')[0];

                return {
                    title: `Riego: ${evento.invernadero ? evento.invernadero.descripcion : 'Invernadero'}`,
                    start: `${dateStr}T${evento.hora_inicial}`,
                    end: `${dateStr}T${evento.hora_final}`,
                    color: '#10B981', // Green
                    description: `Semana ID: ${evento.semana_id}`
                };
            });

            res.json(events);
        } catch (error) {
            console.error('Error al obtener eventos:', error);
            res.status(500).json([]);
        }
    }
};

module.exports = CalendarController;
