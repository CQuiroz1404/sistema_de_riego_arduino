require('dotenv').config();
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const morgan = require('morgan');
const { testConnection, syncDatabase, closePool, closeSequelize } = require('./src/config/baseDatos');
const mqttService = require('./src/services/mqttService');
const logger = require('./src/config/logger');
const http = require('http');
const { Server } = require('socket.io');
const rateLimit = require('express-rate-limit');
const swaggerUi = require('swagger-ui-express');
const swaggerSpecs = require('./src/config/swagger');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Configurar Socket.io en MQTT Service
mqttService.setSocketIo(io);

const PORT = process.env.PORT || 3000;

// Esperar a que la base de datos esté disponible (reintentos)
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function waitForDatabase() {
  const maxAttempts = parseInt(process.env.DB_RETRY_COUNT, 10) || 5;
  const intervalMs = parseInt(process.env.DB_RETRY_INTERVAL_MS, 10) || 5000;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      logger.info(`🔎 Intento ${attempt}/${maxAttempts} de conectar a la base de datos...`);
      const ok = await testConnection();
      if (ok) {
        // Si se usa Sequelize, también verificar su conexión si es posible
        if (process.env.USE_SEQUELIZE === 'true') {
          try {
            // testSequelizeConnection may be available via database module
            const dbModule = require('./src/config/database');
            if (typeof dbModule.testSequelizeConnection === 'function') {
              const seqOk = await dbModule.testSequelizeConnection();
              if (!seqOk) {
                logger.warn('⚠️  Sequelize no respondió correctamente, pero pool MySQL está disponible.');
              }
            }
          } catch (err) {
            logger.warn('⚠️  No se pudo verificar Sequelize: %s', err.message || err);
          }
        }
        return true;
      }
    } catch (err) {
      logger.error('Error comprobando la BD: %s', err.message || err);
    }

    if (attempt < maxAttempts) {
      logger.info(`Esperando ${intervalMs}ms antes del siguiente intento...`);
      await sleep(intervalMs);
    }
  }

  return false;
}

// ============================================
// Middlewares
// ============================================

// Rate Limiting (Seguridad)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // Limitar cada IP a 100 peticiones por ventana
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Demasiadas peticiones desde esta IP, por favor intente de nuevo después de 15 minutos'
});
app.use('/api/', limiter); // Aplicar solo a rutas API

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}
// app.use(logger); // Logger eliminado

// CORS
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}));

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Cookie parser
app.use(cookieParser());

// Middleware global para exponer usuario autenticado a las vistas
const jwt = require('jsonwebtoken');
app.use((req, res, next) => {
  try {
    const token = req.cookies && req.cookies.token;
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;
    }
  } catch (e) {
    req.user = null;
  }

  res.locals.user = req.user;
  next();
});

// Archivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

// Motor de vistas Handlebars
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'src', 'views'));

// Configurar Handlebars
const hbs = require('hbs');
hbs.registerPartials(path.join(__dirname, 'src', 'views', 'partials'));

// Registrar helpers de Handlebars
hbs.registerHelper('eq', function(a, b) {
  return a === b;
});

hbs.registerHelper('gt', function(a, b) {
  return a > b;
});

hbs.registerHelper('formatDate', function(date) {
  if (!date) return 'N/A';
  return new Date(date).toLocaleString('es');
});

hbs.registerHelper('limit', function(array, limit) {
  if (!Array.isArray(array)) return [];
  return array.slice(0, limit);
});

hbs.registerHelper('json', function(context) {
  return JSON.stringify(context);
});

// ============================================
// Rutas
// ============================================

// Ruta raíz
app.get('/', (req, res) => {
  if (req.user) {
    // Si ya hay sesión, ir directo al dashboard
    return res.redirect('/dashboard');
  }
  // Si no hay sesión, mostrar login
  return res.redirect('/auth/login');
});

// Importar rutas
const authRoutes = require('./src/routes/auth');
const dashboardRoutes = require('./src/routes/dashboard');
const deviceRoutes = require('./src/routes/devices');
const sensorRoutes = require('./src/routes/sensors');
const arduinoRoutes = require('./src/routes/arduino');
const calendarRoutes = require('./src/routes/calendar');
const invernaderoRoutes = require('./src/routes/invernaderos');
const plantaRoutes = require('./src/routes/plantas');
const profileRoutes = require('./src/routes/profile');

// Usar rutas
app.use('/auth', authRoutes);
app.use('/dashboard', dashboardRoutes);
app.use('/devices', deviceRoutes);
app.use('/sensors', sensorRoutes);
app.use('/api/arduino', arduinoRoutes);
app.use('/calendar', calendarRoutes);
app.use('/invernaderos', invernaderoRoutes);
app.use('/plantas', plantaRoutes);
app.use('/profile', profileRoutes);

// Documentación API (Swagger)
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs));

// Ruta API para verificar estado de dispositivos
const DeviceController = require('./src/controllers/DeviceController');
const { verifyToken } = require('./src/middleware/auth');
app.get('/api/devices/:id/status', verifyToken, DeviceController.checkStatus);

// Ruta 404
app.use((req, res) => {
  res.status(404).render('error', {
    message: 'Página no encontrada',
    error: { status: 404 }
  });
});

// ============================================
// Manejo de errores
// ============================================
app.use((err, req, res, next) => {
  logger.error('Error: %o', err);
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
});

// ============================================
// Iniciar servidor
// ============================================
async function startServer() {
  try {
    // Esperar a que la base de datos esté disponible (reintentos configurables)
    const dbReady = await waitForDatabase();
    if (!dbReady) {
      logger.error('✗ No se pudo conectar a la base de datos después de varios intentos. Abortando inicio del servidor.');
      process.exit(1);
    }

    // Si está habilitado, sincronizar usando Sequelize (opcional)
    if (process.env.USE_SEQUELIZE === 'true') {
      try {
        await syncDatabase({ alter: process.env.DB_SYNC_ALTER === 'true' });
      } catch (err) {
        logger.error('⚠️  Error durante sequelize.sync: %s', err.message || err);
      }
    }

    // Inicializar servicio MQTT
    let mqttConnected = false;
    try {
      await mqttService.connect();
      mqttConnected = mqttService.isConnected();
    } catch (error) {
      logger.error('⚠️  Error al inicializar MQTT: %s', error.message);
      logger.info('El servidor continuará sin MQTT. Los dispositivos no podrán comunicarse.');
    }

    // Iniciar servidor en todas las interfaces (0.0.0.0)
    server.listen(PORT, '0.0.0.0', () => {
      logger.info('');
      logger.info('═══════════════════════════════════════════════════════');
      logger.info('  🌱 Sistema de Riego Arduino IoT - MQTT');
      logger.info('═══════════════════════════════════════════════════════');
      logger.info(`  Servidor Local: http://localhost:${PORT}`);
      logger.info(`  Entorno: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`  Base de datos: ${dbReady ? '✓ Conectada' : '✗ Desconectada'}`);
      logger.info(`  MQTT Broker: ${mqttConnected ? '✓ Conectado' : '✗ Desconectado'}`);
      logger.info(`  WebSockets: ✓ Activo`);
      logger.info('═══════════════════════════════════════════════════════');
      logger.info('');
      logger.info('Presione Ctrl+C para detener el servidor');
      logger.info('');
    });
  } catch (error) {
    logger.error('Error fatal al iniciar el servidor: %o', error);
    process.exit(1);
  }
}

// Manejo de errores no capturados
process.on('unhandledRejection', (err) => {
  logger.error('Unhandled Rejection: %o', err);
});

process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception: %o', err);
  process.exit(1);
});

// Manejo de cierre graceful
process.on('SIGINT', async () => {
  logger.info('\n\n🛑 Cerrando servidor...');
  try {
    await mqttService.disconnect();
    logger.info('✓ MQTT desconectado');
  } catch (error) {
    logger.error('Error al cerrar MQTT: %o', error);
  }
  try {
    await closePool();
    await closeSequelize();
  } catch (err) {
    logger.error('Error cerrando recursos de BD: %o', err);
  }
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('\n\n🛑 Cerrando servidor...');
  try {
    await mqttService.disconnect();
    logger.info('✓ MQTT desconectado');
  } catch (error) {
    logger.error('Error al cerrar MQTT: %o', error);
  }
  try {
    await closePool();
    await closeSequelize();
  } catch (err) {
    logger.error('Error cerrando recursos de BD: %o', err);
  }
  process.exit(0);
});

// Iniciar solo si es el archivo principal
if (require.main === module) {
  startServer();
}

module.exports = app;
