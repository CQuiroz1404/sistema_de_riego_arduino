const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/baseDatos');

const Actuadores = sequelize.define('actuadores', {
  id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
  dispositivo_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  nombre: { type: DataTypes.STRING(100), allowNull: false },
  tipo: { type: DataTypes.ENUM('bomba','valvula','electrovalvula'), allowNull: false },
  pin: { type: DataTypes.STRING(10), allowNull: true },
  estado: { type: DataTypes.ENUM('encendido','apagado'), defaultValue: 'apagado' },
  activo: { type: DataTypes.BOOLEAN, defaultValue: true },
  fecha_creacion: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, { timestamps: false, freezeTableName: true });

module.exports = Actuadores;
