const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/baseDatos');

const RangoTemperatura = sequelize.define('rango_temperatura', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  temp_min: { type: DataTypes.DECIMAL(5, 2), allowNull: false },
  temp_max: { type: DataTypes.DECIMAL(5, 2), allowNull: false },
  estado: { type: DataTypes.BOOLEAN, defaultValue: true }
}, { timestamps: false, freezeTableName: true });

module.exports = RangoTemperatura;
