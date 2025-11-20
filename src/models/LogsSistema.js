const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/baseDatos');

const LogsSistema = sequelize.define('logs_sistema', {
  id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
  nivel: { type: DataTypes.ENUM('info','warning','error','critical'), allowNull: false },
  modulo: { type: DataTypes.STRING(50), allowNull: true },
  mensaje: { type: DataTypes.TEXT, allowNull: false },
  dispositivo_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
  usuario_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
  ip_address: { type: DataTypes.STRING(45), allowNull: true },
  fecha_log: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, { timestamps: false, freezeTableName: true });

module.exports = LogsSistema;
