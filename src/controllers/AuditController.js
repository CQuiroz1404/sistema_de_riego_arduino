const { LogsSistema, Usuarios } = require('../models');

class AuditController {
    static async index(req, res) {
        try {
            // Solo administradores deberían ver esto, o el propio usuario sus logs
            // Por ahora, mostraremos todo si es admin, o solo los suyos si es usuario normal
            const whereClause = {};
            if (req.user.rol !== 'admin') {
                whereClause.usuario_id = req.user.id;
            }

            const logs = await LogsSistema.findAll({
                where: whereClause,
                include: [{ model: Usuarios, attributes: ['nombre', 'email'] }],
                order: [['fecha_log', 'DESC']],
                limit: 100 // Limitar a los últimos 100 eventos
            });

            res.render('audit/index', {
                title: 'Auditoría del Sistema',
                logs: logs.map(log => log.toJSON()),
                user: req.user
            });
        } catch (error) {
            console.error('Error al obtener logs:', error);
            res.status(500).render('error', { message: 'Error al cargar auditoría' });
        }
    }
}

module.exports = AuditController;
