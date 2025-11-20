const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/baseDatos');

const Lecturas = sequelize.define('lecturas', {
  id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
  sensor_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  valor: { type: DataTypes.DECIMAL(10,2), allowNull: false },
  fecha_lectura: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, { timestamps: false, freezeTableName: true });

module.exports = Lecturas;
