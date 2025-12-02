const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/baseDatos');

const Invernaderos = sequelize.define('invernaderos', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  descripcion: { type: DataTypes.TEXT },
  planta_id: { type: DataTypes.INTEGER },
  dispositivo_id: { type: DataTypes.INTEGER },
  riego: { type: DataTypes.BOOLEAN, defaultValue: false },
  temp_actual: { type: DataTypes.DECIMAL(5, 2) },
  hum_actual: { type: DataTypes.DECIMAL(5, 2) },
  estado: { type: DataTypes.BOOLEAN, defaultValue: true }
}, { timestamps: false, freezeTableName: true });

module.exports = Invernaderos;
