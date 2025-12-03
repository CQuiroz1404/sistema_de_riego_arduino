const { HistorialAutomatico, HistorialAcciones, Invernaderos, Acciones } = require('../models');

const HistorialController = {
    // Obtener historial de un invernadero
    async getByInvernadero(req, res) {
        try {
            const { invernaderoId } = req.params;
            const { tipo } = req.query; // 'automatico' o 'acciones'

            // Validar que se proporcione invernaderoId
            if (!invernaderoId) {
                return res.status(400).render('error', {
                    message: 'ID de invernadero no proporcionado',
                    error: { message: 'La URL debe incluir el ID del invernadero' },
                    user: req.user
                });
            }

            const invernadero = await Invernaderos.findByPk(invernaderoId);
            
            // Validar que el invernadero exista
            if (!invernadero) {
                return res.status(404).render('error', {
                    message: 'Invernadero no encontrado',
                    error: { message: `No se encontró el invernadero con ID ${invernaderoId}` },
                    user: req.user
                });
            }
            
            let historial = [];
            let view = 'historial/index';

            if (tipo === 'acciones') {
                historial = await HistorialAcciones.findAll({
                    where: { invernadero_id: invernaderoId },
                    include: [{ model: Acciones, as: 'accion' }],
                    order: [['fecha', 'DESC']],
                    limit: 100
                });
                view = 'historial/acciones';
            } else {
                // Por defecto historial automático (sensores)
                historial = await HistorialAutomatico.findAll({
                    where: { invernadero_id: invernaderoId },
                    order: [['fecha', 'DESC'], ['hora', 'DESC']],
                    limit: 100
                });
            }
            
            res.render(view, { 
                historial, 
                invernadero,
                tipo,
                user: req.user 
            });
        } catch (error) {
            console.error('Error al obtener historial:', error);
            res.status(500).render('error', { 
                message: 'Error al cargar el historial',
                error 
            });
        }
    }
};

module.exports = HistorialController;
