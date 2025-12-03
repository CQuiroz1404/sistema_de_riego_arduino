const { LogsSistema } = require('../models');

/**
 * Middleware para auditoría de acciones de usuario
 * Registra automáticamente las peticiones POST, PUT, PATCH, DELETE en la base de datos
 */
const auditLogger = (req, res, next) => {
    // Interceptamos el evento 'finish' de la respuesta
    res.on('finish', async () => {
        // Solo registramos si:
        // 1. Hay un usuario autenticado (req.user existe)
        // 2. Es una petición que modifica datos (no GET)
        // 3. La respuesta fue exitosa (código 2xx o 3xx)
        if (req.user && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method) && res.statusCode < 400) {
            try {
                // Determinar el módulo basado en la URL
                // Ejemplo: /plantas/create -> modulo: plantas
                const pathParts = req.originalUrl.split('/').filter(p => p);
                const modulo = pathParts[0] || 'general';
                
                // Construir mensaje descriptivo
                let accion = '';
                switch(req.method) {
                    case 'POST': accion = 'Creación/Registro'; break;
                    case 'PUT': accion = 'Actualización'; break;
                    case 'PATCH': accion = 'Modificación parcial'; break;
                    case 'DELETE': accion = 'Eliminación'; break;
                }

                const mensaje = `Acción: ${accion} en módulo ${modulo}. Ruta: ${req.originalUrl}`;

                // Guardar en base de datos
                await LogsSistema.create({
                    nivel: 'info',
                    modulo: modulo,
                    mensaje: mensaje,
                    usuario_id: req.user.id,
                    ip_address: req.ip || req.connection.remoteAddress,
                    fecha_log: new Date()
                });

                // También mostrar en consola para debug
                console.log(`📝 Auditoría: ${mensaje} por usuario ${req.user.email}`);

            } catch (error) {
                console.error('Error al guardar log de auditoría:', error);
            }
        }
    });

    next();
};

module.exports = auditLogger;
