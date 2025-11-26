const { Calendario, Invernaderos } = require('../models');

const CalendarController = {
    index: (req, res) => {
        res.render('calendar/index', {
            title: 'Calendario de Riego',
            user: req.user
        });
    },

    getEvents: async (req, res) => {
        try {
            const eventos = await Calendario.findAll({
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
