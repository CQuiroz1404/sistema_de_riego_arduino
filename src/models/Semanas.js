const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/baseDatos');

const Semanas = sequelize.define('semanas', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  nombre: { type: DataTypes.STRING(50), allowNull: false }
}, { timestamps: false, freezeTableName: true });

module.exports = Semanas;
