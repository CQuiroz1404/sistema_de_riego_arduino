const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/baseDatos');

const Dispositivos = sequelize.define('dispositivos', {
  id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
  nombre: { type: DataTypes.STRING(100), allowNull: false },
  ubicacion: { type: DataTypes.STRING(200), allowNull: true },
  descripcion: { type: DataTypes.TEXT, allowNull: true },
  api_key: { type: DataTypes.STRING(100), allowNull: false, unique: true },
  estado: { type: DataTypes.ENUM('activo','inactivo','mantenimiento'), defaultValue: 'activo' },
  ultima_conexion: { type: DataTypes.DATE, allowNull: true },
  fecha_creacion: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  usuario_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false }
}, { timestamps: false, freezeTableName: true });

module.exports = Dispositivos;
