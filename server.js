require('dotenv').config();
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const morgan = require('morgan');
const { testConnection, syncDatabase, closePool, closeSequelize } = require('./src/config/database');
const { errorHandler, logger } = require('./src/middleware/logger');
const mqttService = require('./src/services/mqttService');

const app = express();
const PORT = process.env.PORT || 3000;

// ============================================
// Middlewares
// ============================================

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}
app.use(logger);

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
  res.redirect('/auth/login');
});

// Importar rutas
const authRoutes = require('./src/routes/auth');
const dashboardRoutes = require('./src/routes/dashboard');
const deviceRoutes = require('./src/routes/devices');
const sensorRoutes = require('./src/routes/sensors');
const arduinoRoutes = require('./src/routes/arduino');

// Usar rutas
app.use('/auth', authRoutes);
app.use('/dashboard', dashboardRoutes);
app.use('/devices', deviceRoutes);
app.use('/sensors', sensorRoutes);
app.use('/api/arduino', arduinoRoutes);

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
app.use(errorHandler);

// ============================================
// Iniciar servidor
// ============================================
async function startServer() {
  try {
    // Verificar conexión a la base de datos
    const dbConnected = await testConnection();
    
    if (!dbConnected) {
      console.error('⚠️  No se pudo conectar a la base de datos. Verifique la configuración.');
      console.log('El servidor continuará ejecutándose, pero las funciones de BD no estarán disponibles.');
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
      console.log(`  Base de datos: ${dbConnected ? '✓ Conectada' : '✗ Desconectada'}`);
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
