const { HistorialAutomatico, HistorialAcciones, Invernaderos, Acciones } = require('../models');

const HistorialController = {
    // Obtener historial de un invernadero
    async getByInvernadero(req, res) {
        try {
            const { invernaderoId } = req.params;
            const { tipo } = req.query; // 'automatico' o 'acciones'

            const invernadero = await Invernaderos.findByPk(invernaderoId);
            
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
                // Por defecto historial automÃ¡tico (sensores)
                historial = await HistorialAutomatico.findAll({
                    where: { invernadero_id: invernaderoId },
                    order: [['fecha_registro', 'DESC']],
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
