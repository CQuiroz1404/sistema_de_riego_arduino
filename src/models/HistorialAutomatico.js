const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/baseDatos');

const HistorialAutomatico = sequelize.define('historial_automatico', {
  id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
  invernadero_id: { type: DataTypes.INTEGER },
  fecha: { type: DataTypes.DATEONLY },
  hora: { type: DataTypes.TIME },
  temp: { type: DataTypes.DECIMAL(5, 2) },
  humedad: { type: DataTypes.DECIMAL(5, 2) },
  estado: { type: DataTypes.STRING(50) }
}, { timestamps: false, freezeTableName: true });

module.exports = HistorialAutomatico;
