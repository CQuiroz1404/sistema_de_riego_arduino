const mysql = require('mysql2/promise');
const { Sequelize } = require('sequelize');
require('dotenv').config();

// Configuración del pool de conexiones (mysql2)
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'sistema_riego',
  waitForConnections: true,
  connectionLimit: parseInt(process.env.DB_CONN_LIMIT, 10) || 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
});

// Sequelize (misma configuración, opcional)
const sequelize = new Sequelize(process.env.DB_NAME || 'sistema_riego', process.env.DB_USER || 'root', process.env.DB_PASSWORD || '', {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  dialect: 'mysql',
  logging: process.env.SEQUELIZE_LOG === 'true' ? console.log : false,
  pool: {
    max: parseInt(process.env.DB_CONN_LIMIT, 10) || 10,
    min: 0,
    acquire: 30000,
    idle: 10000
  },
  define: {
    timestamps: false,
    freezeTableName: true
  }
});

// Función para verificar la conexión usando pool
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('✓ Conexión exitosa a la base de datos MySQL (pool)');
    connection.release();
    return true;
  } catch (error) {
    console.error('✗ Error al conectar con la base de datos (pool):', error.message);
    return false;
  }
}

// Función para verificar la conexión Sequelize
async function testSequelizeConnection() {
  try {
    await sequelize.authenticate();
    console.log('✓ Conexión Sequelize establecida');
    return true;
  } catch (error) {
    console.error('✗ Error al conectar con la base de datos (Sequelize):', error.message || error);
    return false;
  }
}

// Sincronizar modelos con la base de datos (opcional)
async function syncDatabase(options = {}) {
  try {
    const syncOptions = {};
    if (options.alter) syncOptions.alter = true;
    if (options.force) syncOptions.force = true;
    if (Object.keys(syncOptions).length > 0) {
      console.log('⚠️  Ejecutando sequelize.sync con opciones:', syncOptions);
    }
    await sequelize.sync(syncOptions);
    console.log('✅ Sincronización Sequelize completada');
  } catch (error) {
    console.error('✗ Error en sincronización Sequelize:', error.message || error);
    throw error;
  }
}

// Cerrar pool y sequelize
async function closePool() {
  try {
    await pool.end();
    console.log('✓ Pool de conexiones cerrado');
  } catch (error) {
    console.error('Error cerrando pool:', error.message || error);
  }
}

async function closeSequelize() {
  try {
    await sequelize.close();
    console.log('✓ Sequelize cerrado');
  } catch (error) {
    console.error('Error cerrando Sequelize:', error.message || error);
  }
}

module.exports = { pool, testConnection, sequelize, testSequelizeConnection, syncDatabase, closePool, closeSequelize };
