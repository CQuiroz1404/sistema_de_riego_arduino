const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/baseDatos');

const EventosRiego = sequelize.define('eventos_riego', {
  id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
  dispositivo_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  actuador_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  accion: { type: DataTypes.ENUM('inicio','fin'), allowNull: false },
  modo: { type: DataTypes.ENUM('manual','automatico','programado'), allowNull: false },
  duracion_segundos: { type: DataTypes.INTEGER, allowNull: true },
  usuario_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
  fecha_evento: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, { timestamps: false, freezeTableName: true });

module.exports = EventosRiego;
