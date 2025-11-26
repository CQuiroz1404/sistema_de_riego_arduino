const { Calendario, Invernaderos, Semanas } = require('../models');

const CalendarioController = {
    // Obtener calendario de un invernadero
    async getByInvernadero(req, res) {
        try {
            const { invernaderoId } = req.params;
            const calendario = await Calendario.findAll({
                where: { invernadero_id: invernaderoId },
                include: [
                    { model: Semanas, as: 'semana' }
                ],
                order: [
                    ['semana_id', 'ASC'],
                    ['hora_inicial', 'ASC']
                ]
            });
            
            const invernadero = await Invernaderos.findByPk(invernaderoId);
            
            res.render('calendario/index', { 
                calendario: calendario.map(c => c.toJSON()), 
                invernadero: invernadero.toJSON(),
                user: req.user 
            });
        } catch (error) {
            console.error('Error al obtener calendario:', error);
            res.status(500).render('error', { 
                message: 'Error al cargar el calendario',
                error 
            });
        }
    },

    // Vista para crear evento
    async create(req, res) {
        try {
            const { invernaderoId } = req.params;
            const semanas = await Semanas.findAll();
            const invernadero = await Invernaderos.findByPk(invernaderoId);

            res.render('calendario/create', {
                invernadero: invernadero.toJSON(),
                semanas: semanas.map(s => s.toJSON()),
                user: req.user
            });
        } catch (error) {
            console.error('Error al cargar formulario:', error);
            res.status(500).render('error', { message: 'Error al cargar formulario' });
        }
    },

    // Guardar evento
    async store(req, res) {
        try {
            const { invernaderoId } = req.params;
            const { semana_id, hora_inicio, duracion_minutos } = req.body;

            // Calcular hora_final
            const [hours, minutes] = hora_inicio.split(':').map(Number);
            const date = new Date();
            date.setHours(hours, minutes + parseInt(duracion_minutos), 0);
            const hora_final = date.toTimeString().slice(0, 5);

            await Calendario.create({
                invernadero_id: invernaderoId,
                semana_id,
                hora_inicial: hora_inicio,
                hora_final: hora_final,
                usuario_id: req.user ? req.user.id : null
            });

            res.redirect(`/invernaderos/${invernaderoId}/calendario`);
        } catch (error) {
            console.error('Error al guardar evento:', error);
            res.status(500).render('error', { message: 'Error al guardar evento' });
        }
    },

    // Eliminar evento
    async delete(req, res) {
        try {
            const { id } = req.params;
            const evento = await Calendario.findByPk(id);
            
            if (evento) {
                const invernaderoId = evento.invernadero_id;
                await evento.destroy();
                res.redirect(`/invernaderos/${invernaderoId}/calendario`);
            } else {
                res.status(404).send('Evento no encontrado');
            }
        } catch (error) {
            console.error('Error al eliminar evento:', error);
            res.status(500).render('error', { message: 'Error al eliminar evento' });
        }
    }
};

module.exports = CalendarioController;
