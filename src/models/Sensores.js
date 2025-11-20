const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/baseDatos');

const Sensores = sequelize.define('sensores', {
  id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
  dispositivo_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  nombre: { type: DataTypes.STRING(100), allowNull: false },
  tipo: { type: DataTypes.ENUM('humedad_suelo','temperatura','humedad_ambiente','nivel_agua','lluvia','luz'), allowNull: false },
  pin: { type: DataTypes.STRING(10), allowNull: true },
  unidad: { type: DataTypes.STRING(20), allowNull: true },
  valor_minimo: { type: DataTypes.DECIMAL(10,2), allowNull: true },
  valor_maximo: { type: DataTypes.DECIMAL(10,2), allowNull: true },
  activo: { type: DataTypes.BOOLEAN, defaultValue: true },
  fecha_creacion: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, { timestamps: false, freezeTableName: true });

module.exports = Sensores;
