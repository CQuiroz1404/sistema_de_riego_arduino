const { pool } = require('../config/database');

// Middleware para logging de solicitudes
const logger = (req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.url} - IP: ${req.ip}`);
  next();
};

// Middleware para registrar logs en la base de datos
const dbLogger = async (nivel, modulo, mensaje, dispositivo_id = null, usuario_id = null, ip_address = null) => {
  try {
    await pool.query(
      'INSERT INTO logs_sistema (nivel, modulo, mensaje, dispositivo_id, usuario_id, ip_address) VALUES (?, ?, ?, ?, ?, ?)',
      [nivel, modulo, mensaje, dispositivo_id, usuario_id, ip_address]
    );
  } catch (error) {
    console.error('Error al registrar log en BD:', error);
  }
};

// Middleware de manejo de errores
const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // Log en base de datos
  const userId = req.user ? req.user.id : null;
  dbLogger('error', 'sistema', err.message, null, userId, req.ip);

  // Responder según el tipo de solicitud
  if (req.xhr || req.headers.accept.indexOf('json') > -1) {
    res.status(err.status || 500).json({
      success: false,
      message: err.message || 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? err : {}
    });
  } else {
    res.status(err.status || 500).render('error', {
      message: err.message || 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? err : {}
    });
  }
};

// Middleware para validar datos de entrada
const validateRequest = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Error de validación',
        errors: error.details.map(detail => detail.message)
      });
    }
    next();
  };
};

module.exports = {
  logger,
  dbLogger,
  errorHandler,
  validateRequest
};
