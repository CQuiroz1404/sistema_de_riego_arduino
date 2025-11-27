const jwt = require('jsonwebtoken');

// Middleware para verificar el token JWT
const verifyToken = (req, res, next) => {
  try {
    // Obtener token de las cookies o del header Authorization
    const token = req.cookies.token || 
                  (req.headers.authorization && req.headers.authorization.split(' ')[1]);

    if (!token) {
      // Si es una solicitud AJAX, enviar JSON
      if (req.xhr || req.headers.accept.indexOf('json') > -1) {
        return res.status(401).json({ 
          success: false, 
          message: 'Acceso no autorizado. Token no proporcionado.' 
        });
      }
      // Si es una solicitud de navegador, redirigir al login
      return res.redirect('/auth/login');
    }

    // Verificar el token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Si el middleware global ya cargó la información fresca del usuario,
    // no la sobreescribimos. Solo guardamos el payload por si se necesita.
    if (!req.user) {
      req.user = decoded;
    }
    req.authPayload = decoded;
    next();
  } catch (error) {
    if (req.xhr || req.headers.accept.indexOf('json') > -1) {
      return res.status(401).json({ 
        success: false, 
        message: 'Token inválido o expirado.' 
      });
    }
    res.redirect('/auth/login');
  }
};

// Middleware para verificar rol de administrador
const verifyAdmin = (req, res, next) => {
  if (req.user && req.user.rol === 'admin') {
    next();
  } else {
    if (req.xhr || req.headers.accept.indexOf('json') > -1) {
      return res.status(403).json({ 
        success: false, 
        message: 'Acceso denegado. Se requieren permisos de administrador.' 
      });
    }
    res.status(403).render('error', { 
      message: 'Acceso denegado', 
      error: { status: 403 } 
    });
  }
};

// Middleware para verificar API Key de Arduino
const verifyApiKey = (req, res, next) => {
  const apiKey = req.headers['x-api-key'] || req.query.api_key;

  if (!apiKey) {
    return res.status(401).json({ 
      success: false, 
      message: 'API Key no proporcionada.' 
    });
  }

  // Almacenar la API key en la request para uso posterior
  req.apiKey = apiKey;
  next();
};

module.exports = {
  verifyToken,
  verifyAdmin,
  verifyApiKey
};
