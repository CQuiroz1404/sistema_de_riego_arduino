require('dotenv').config();
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const morgan = require('morgan');
const { testConnection, syncDatabase, closePool, closeSequelize } = require('./src/config/baseDatos');
const mqttService = require('./src/services/mqttService');

const app = express();
const PORT = process.env.PORT || 3000;

// Esperar a que la base de datos esté disponible (reintentos)
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function waitForDatabase() {
  const maxAttempts = parseInt(process.env.DB_RETRY_COUNT, 10) || 5;
  const intervalMs = parseInt(process.env.DB_RETRY_INTERVAL_MS, 10) || 5000;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      console.log(`🔎 Intento ${attempt}/${maxAttempts} de conectar a la base de datos...`);
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
                console.warn('⚠️  Sequelize no respondió correctamente, pero pool MySQL está disponible.');
              }
            }
          } catch (err) {
            console.warn('⚠️  No se pudo verificar Sequelize:', err.message || err);
          }
        }
        return true;
      }
    } catch (err) {
      console.error('Error comprobando la BD:', err.message || err);
    }

    if (attempt < maxAttempts) {
      console.log(`Esperando ${intervalMs}ms antes del siguiente intento...`);
      await sleep(intervalMs);
    }
  }

  return false;
}

// ============================================
// Middlewares
// ============================================

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

// Usar rutas
app.use('/auth', authRoutes);
app.use('/dashboard', dashboardRoutes);
app.use('/devices', deviceRoutes);
app.use('/sensors', sensorRoutes);
app.use('/api/arduino', arduinoRoutes);
app.use('/calendar', calendarRoutes);
app.use('/invernaderos', invernaderoRoutes);
app.use('/plantas', plantaRoutes);

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
// app.use(errorHandler); // Error handler eliminado
app.use((err, req, res, next) => {
  console.error('Error:', err);
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
      console.error('✗ No se pudo conectar a la base de datos después de varios intentos. Abortando inicio del servidor.');
      process.exit(1);
    }

    // Si está habilitado, sincronizar usando Sequelize (opcional)
    if (process.env.USE_SEQUELIZE === 'true') {
      try {
        await syncDatabase({ alter: process.env.DB_SYNC_ALTER === 'true' });
      } catch (err) {
        console.error('⚠️  Error durante sequelize.sync:', err.message || err);
      }
    }

    // Inicializar servicio MQTT
    let mqttConnected = false;
    try {
      await mqttService.connect();
      mqttConnected = mqttService.isConnected();
    } catch (error) {
      console.error('⚠️  Error al inicializar MQTT:', error.message);
      console.log('El servidor continuará sin MQTT. Los dispositivos no podrán comunicarse.');
    }

    // Iniciar servidor en todas las interfaces (0.0.0.0)
    app.listen(PORT, '0.0.0.0', () => {
      console.log('');
      console.log('═══════════════════════════════════════════════════════');
      console.log('  🌱 Sistema de Riego Arduino IoT - MQTT');
      console.log('═══════════════════════════════════════════════════════');
      console.log(`  Servidor Local: http://localhost:${PORT}`);
      console.log(`  Servidor Red: http://192.168.1.169:${PORT}`);
      console.log(`  Entorno: ${process.env.NODE_ENV || 'development'}`);
      console.log(`  Base de datos: ${dbReady ? '✓ Conectada' : '✗ Desconectada'}`);
      console.log(`  MQTT Broker: ${mqttConnected ? '✓ Conectado' : '✗ Desconectado'}`);
      console.log('═══════════════════════════════════════════════════════');
      console.log('');
      console.log('Presione Ctrl+C para detener el servidor');
      console.log('');
    });
  } catch (error) {
    console.error('Error fatal al iniciar el servidor:', error);
    process.exit(1);
  }
}

// Manejo de errores no capturados
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

// Manejo de cierre graceful
process.on('SIGINT', async () => {
  console.log('\n\n🛑 Cerrando servidor...');
  try {
    await mqttService.disconnect();
    console.log('✓ MQTT desconectado');
  } catch (error) {
    console.error('Error al cerrar MQTT:', error);
  }
  try {
    await closePool();
    await closeSequelize();
  } catch (err) {
    console.error('Error cerrando recursos de BD:', err);
  }
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n\n🛑 Cerrando servidor...');
  try {
    await mqttService.disconnect();
    console.log('✓ MQTT desconectado');
  } catch (error) {
    console.error('Error al cerrar MQTT:', error);
  }
  try {
    await closePool();
    await closeSequelize();
  } catch (err) {
    console.error('Error cerrando recursos de BD:', err);
  }
  process.exit(0);
});

// Iniciar
startServer();

module.exports = app;
