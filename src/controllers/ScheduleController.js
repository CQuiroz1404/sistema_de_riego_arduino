const { Calendario, Invernaderos, Semanas } = require('../models');

/**
 * Schedule Controller - Unified calendar management
 * Combines functionality from CalendarController (overview) and CalendarioController (CRUD)
 */
const ScheduleController = {
    /**
     * Calendar Overview - Shows all irrigation events in FullCalendar view
     * Route: GET /schedule or GET /calendar
     */
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
            console.error('Error loading calendar:', error);
            res.status(500).render('error', { 
                message: 'Error al cargar el calendario',
                error 
            });
        }
    },

    /**
     * Get Events API - Returns events in FullCalendar format
     * Route: GET /schedule/events
     */
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
                // Map Spanish days to FullCalendar day numbers (0=Sunday, 1=Monday, etc.)
                const diasMap = {
                    'Domingo': 0, 'Lunes': 1, 'Martes': 2, 'Miércoles': 3, 
                    'Jueves': 4, 'Viernes': 5, 'Sábado': 6
                };
                
                const dayOfWeek = diasMap[evento.dia_semana];

                // Create recurring event if day is valid
                if (dayOfWeek !== undefined) {
                    const eventData = {
                        title: `Riego: ${evento.invernadero ? evento.invernadero.descripcion : 'Invernadero'}`,
                        daysOfWeek: [dayOfWeek],
                        startTime: evento.hora_inicial,
                        endTime: evento.hora_final,
                        color: '#10B981', // Green
                        description: `Semana ID: ${evento.semana_id}`,
                    };

                    // Add date range if exists
                    if (evento.fecha_inicio) {
                        eventData.startRecur = evento.fecha_inicio;
                    }
                    if (evento.fecha_fin) {
                        eventData.endRecur = evento.fecha_fin;
                    }

                    return eventData;
                }

                return null;
            }).filter(e => e !== null);

            res.json(events);
        } catch (error) {
            console.error('Error fetching events:', error);
            res.status(500).json({ error: 'Error fetching events' });
        }
    },

    /**
     * Get schedule by greenhouse - Shows CRUD interface for specific greenhouse
     * Route: GET /greenhouses/:greenhouseId/schedule
     */
    async getByGreenhouse(req, res) {
        try {
            const { greenhouseId } = req.params;
            const calendario = await Calendario.findAll({
                where: { invernadero_id: greenhouseId },
                include: [
                    { model: Semanas, as: 'semana' }
                ],
                order: [
                    ['semana_id', 'ASC'],
                    ['hora_inicial', 'ASC']
                ]
            });
            
            const invernadero = await Invernaderos.findByPk(greenhouseId);
            
            if (!invernadero) {
                return res.status(404).render('error', { 
                    message: 'Invernadero no encontrado' 
                });
            }
            
            res.render('calendar/greenhouse', {
                title: 'Calendario', 
                calendario: calendario.map(c => c.toJSON()), 
                invernadero: invernadero.toJSON(),
                user: req.user 
            });
        } catch (error) {
            console.error('Error loading greenhouse schedule:', error);
            res.status(500).render('error', { 
                message: 'Error al cargar el calendario',
                error 
            });
        }
    },

    /**
     * Show create form
     * Route: GET /greenhouses/:greenhouseId/schedule/create
     */
    async create(req, res) {
        try {
            const { greenhouseId } = req.params;
            const semanas = await Semanas.findAll();
            const invernadero = await Invernaderos.findByPk(greenhouseId);

            if (!invernadero) {
                return res.status(404).render('error', { 
                    message: 'Invernadero no encontrado' 
                });
            }

            res.render('calendar/create', {
                title: 'Programar Evento',
                invernadero: invernadero.toJSON(),
                semanas: semanas.map(s => s.toJSON()),
                user: req.user
            });
        } catch (error) {
            console.error('Error loading create form:', error);
            res.status(500).render('error', { 
                message: 'Error al cargar formulario' 
            });
        }
    },

    /**
     * Store new schedule event
     * Route: POST /greenhouses/:greenhouseId/schedule
     */
    async store(req, res) {
        try {
            const { greenhouseId } = req.params;
            const { 
                semana_id, 
                hora_inicio, 
                duracion_minutos, 
                dias_semana, 
                fecha_inicio, 
                fecha_fin 
            } = req.body;

            // Validate at least one day is selected
            if (!dias_semana || (Array.isArray(dias_semana) && dias_semana.length === 0)) {
                return res.status(400).render('error', { 
                    message: 'Debe seleccionar al menos un día de la semana.' 
                });
            }

            // Ensure dias_semana is an array
            const dias = Array.isArray(dias_semana) ? dias_semana : [dias_semana];

            // Calculate end time
            const [hours, minutes] = hora_inicio.split(':').map(Number);
            const date = new Date();
            date.setHours(hours, minutes + parseInt(duracion_minutos), 0);
            const hora_final = date.toTimeString().slice(0, 5);

            // Create entries for each selected day
            const promesas = dias.map(dia => {
                return Calendario.create({
                    invernadero_id: greenhouseId,
                    semana_id,
                    dia_semana: dia,
                    fecha_inicio: fecha_inicio || null,
                    fecha_fin: fecha_fin || null,
                    hora_inicial: hora_inicio,
                    hora_final: hora_final,
                    usuario_id: req.user ? req.user.id : null
                });
            });

            await Promise.all(promesas);

            res.redirect(`/invernaderos/${greenhouseId}/schedule`);
        } catch (error) {
            console.error('Error storing schedule event:', error);
            res.status(500).render('error', { 
                message: 'Error al guardar evento',
                error 
            });
        }
    },

    /**
     * Delete schedule event
     * Route: DELETE /schedule/:id
     */
    async delete(req, res) {
        try {
            const { id } = req.params;
            const evento = await Calendario.findByPk(id);
            
            if (!evento) {
                return res.status(404).json({ 
                    success: false, 
                    message: 'Evento no encontrado' 
                });
            }

            const invernaderoId = evento.invernadero_id;
            await evento.destroy();

            // Handle both AJAX and regular requests
            if (req.xhr || req.headers.accept.indexOf('json') > -1) {
                return res.json({ 
                    success: true, 
                    message: 'Evento eliminado' 
                });
            }

            res.redirect(`/invernaderos/${invernaderoId}/schedule`);
        } catch (error) {
            console.error('Error deleting schedule event:', error);
            
            if (req.xhr || req.headers.accept.indexOf('json') > -1) {
                return res.status(500).json({ 
                    success: false, 
                    message: 'Error al eliminar evento' 
                });
            }

            res.status(500).render('error', { 
                message: 'Error al eliminar evento',
                error 
            });
        }
    },

    /**
     * Get single event details
     * Route: GET /schedule/:id
     */
    async show(req, res) {
        try {
            const { id } = req.params;
            const evento = await Calendario.findByPk(id, {
                include: [
                    { model: Invernaderos },
                    { model: Semanas, as: 'semana' }
                ]
            });

            if (!evento) {
                return res.status(404).render('error', { 
                    message: 'Evento no encontrado' 
                });
            }

            res.render('calendar/show', {
                title: 'Detalle de Evento',
                evento: evento.toJSON(),
                user: req.user
            });
        } catch (error) {
            console.error('Error loading event details:', error);
            res.status(500).render('error', { 
                message: 'Error al cargar evento',
                error 
            });
        }
    }
};

module.exports = ScheduleController;
