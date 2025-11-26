const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/baseDatos');

const TipoPlanta = sequelize.define('tipo_planta', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  nombre: { type: DataTypes.STRING(100), allowNull: false },
  estado: { type: DataTypes.BOOLEAN, defaultValue: true }
}, { timestamps: false, freezeTableName: true });

module.exports = TipoPlanta;
