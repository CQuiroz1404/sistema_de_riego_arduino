const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/baseDatos');

const ConfiguracionesRiego = sequelize.define('configuraciones_riego', {
  id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
  dispositivo_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  nombre: { type: DataTypes.STRING(100), allowNull: false },
  sensor_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  actuador_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  umbral_inferior: { type: DataTypes.DECIMAL(10,2), allowNull: false },
  umbral_superior: { type: DataTypes.DECIMAL(10,2), allowNull: false },
  duracion_minutos: { type: DataTypes.INTEGER, defaultValue: 10 },
  modo: { type: DataTypes.ENUM('manual','automatico','programado'), defaultValue: 'automatico' },
  activo: { type: DataTypes.BOOLEAN, defaultValue: true },
  fecha_creacion: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  fecha_modificacion: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, { timestamps: false, freezeTableName: true });

module.exports = ConfiguracionesRiego;
