const { Calendario, Invernadero, Semanas, Acciones } = require('../models');

const CalendarioController = {
    // Obtener calendario de un invernadero
    async getByInvernadero(req, res) {
        try {
            const { invernaderoId } = req.params;
            const calendario = await Calendario.findAll({
                where: { invernadero_id: invernaderoId },
                include: [
                    { model: Semanas, as: 'semana' },
                    { model: Acciones, as: 'accion' }
                ],
                order: [
                    ['semana_id', 'ASC'],
                    ['dia_semana', 'ASC'],
                    ['hora_inicio', 'ASC']
                ]
            });
            
            const invernadero = await Invernadero.findByPk(invernaderoId);
            
            res.render('calendario/index', { 
                calendario, 
                invernadero,
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
            const acciones = await Acciones.findAll();
            const invernadero = await Invernadero.findByPk(invernaderoId);

            res.render('calendario/create', {
                invernadero,
                semanas,
                acciones,
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
            const { semana_id, dia_semana, hora_inicio, duracion_minutos, accion_id } = req.body;

            await Calendario.create({
                invernadero_id: invernaderoId,
                semana_id,
                dia_semana,
                hora_inicio,
                duracion_minutos,
                accion_id
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
