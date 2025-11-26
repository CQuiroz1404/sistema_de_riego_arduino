const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/baseDatos');

const RangoHumedad = sequelize.define('rango_humedad', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  hum_min: { type: DataTypes.DECIMAL(5, 2), allowNull: false },
  hum_max: { type: DataTypes.DECIMAL(5, 2), allowNull: false },
  estado: { type: DataTypes.BOOLEAN, defaultValue: true }
}, { timestamps: false, freezeTableName: true });

module.exports = RangoHumedad;
