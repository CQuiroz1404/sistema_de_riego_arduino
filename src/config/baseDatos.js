const { Sequelize } = require('sequelize');
require('dotenv').config();

// Configuración por defecto, se puede sobrescribir con variables de entorno
const DB_NAME = process.env.DB_NAME || 'sistema_riego';
const DB_USER = process.env.DB_USER || 'root';
const DB_PASS = process.env.DB_PASSWORD || '';
const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_PORT = process.env.DB_PORT || 3306;

const sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASS, {
  host: DB_HOST,
  port: DB_PORT,
  dialect: 'mysql',
  logging: process.env.SEQUELIZE_LOG === 'true' ? console.log : false,
  define: {
    timestamps: false,
    freezeTableName: true
  },
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
});

const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Conexión a la base de datos establecida correctamente.');
    return true;
  } catch (error) {
    console.error('❌ No se pudo conectar a la base de datos:', error.message);
    return false;
  }
};

const syncDatabase = async (options = {}) => {
  try {
    await sequelize.sync(options);
    console.log('✅ Modelos sincronizados con la base de datos.');
    return true;
  } catch (error) {
    console.error('❌ Error al sincronizar modelos:', error);
    return false;
  }
};

const closeSequelize = async () => {
  try {
    await sequelize.close();
    console.log('✅ Conexión a la base de datos cerrada.');
  } catch (error) {
    console.error('❌ Error al cerrar la conexión:', error);
  }
};

const closePool = closeSequelize;

module.exports = {
  sequelize,
  testConnection,
  syncDatabase,
  closeSequelize,
  closePool
};
