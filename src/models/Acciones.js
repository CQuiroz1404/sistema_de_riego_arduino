const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/baseDatos');

const Acciones = sequelize.define('acciones', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  nombre: { type: DataTypes.STRING(100), allowNull: false }
}, { timestamps: false, freezeTableName: true });

module.exports = Acciones;
