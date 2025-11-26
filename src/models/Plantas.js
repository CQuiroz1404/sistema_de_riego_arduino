const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/baseDatos');

const Plantas = sequelize.define('plantas', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  nombre: { type: DataTypes.STRING(100), allowNull: false },
  tipo_planta_id: { type: DataTypes.INTEGER },
  rango_temperatura_id: { type: DataTypes.INTEGER },
  rango_humedad_id: { type: DataTypes.INTEGER },
  estado: { type: DataTypes.BOOLEAN, defaultValue: true }
}, { timestamps: false, freezeTableName: true });

module.exports = Plantas;
