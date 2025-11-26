const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/baseDatos');

const HistorialAcciones = sequelize.define('historial_acciones', {
  id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
  invernadero_id: { type: DataTypes.INTEGER },
  fecha: { type: DataTypes.DATEONLY },
  hora: { type: DataTypes.TIME },
  temp: { type: DataTypes.DECIMAL(5, 2) },
  humedad: { type: DataTypes.DECIMAL(5, 2) },
  usuario_id: { type: DataTypes.INTEGER },
  accion_id: { type: DataTypes.INTEGER },
  estado: { type: DataTypes.STRING(50) }
}, { timestamps: false, freezeTableName: true });

module.exports = HistorialAcciones;
