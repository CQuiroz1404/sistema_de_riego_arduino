const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/baseDatos');

const Alertas = sequelize.define('alertas', {
  id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
  dispositivo_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  tipo: { type: DataTypes.ENUM('sensor_fuera_rango','dispositivo_offline','error_actuador','bajo_nivel_agua','otro'), allowNull: false },
  severidad: { type: DataTypes.ENUM('baja','media','alta','critica'), defaultValue: 'media' },
  mensaje: { type: DataTypes.TEXT, allowNull: false },
  leida: { type: DataTypes.BOOLEAN, defaultValue: false },
  fecha_creacion: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  fecha_lectura: { type: DataTypes.DATE, allowNull: true }
}, { timestamps: false, freezeTableName: true });

module.exports = Alertas;
