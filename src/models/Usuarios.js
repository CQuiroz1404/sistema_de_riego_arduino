const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/baseDatos');

const Usuarios = sequelize.define('usuarios', {
  id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
  nombre: { type: DataTypes.STRING(100), allowNull: false },
  email: { type: DataTypes.STRING(100), allowNull: false, unique: true },
  avatar: { type: DataTypes.STRING(255), allowNull: true },
  password: { type: DataTypes.STRING(255), allowNull: false },
  rol: { type: DataTypes.ENUM('admin','usuario'), defaultValue: 'usuario' },
  rut: { type: DataTypes.STRING(20), unique: true },
  activo: { type: DataTypes.BOOLEAN, defaultValue: true },
  fecha_creacion: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  ultima_conexion: { type: DataTypes.DATE, allowNull: true }
  // ⚠️ reset_token y reset_token_expiry: Solo necesarios si implementas recuperación de contraseña
  // Descomentarlos cuando necesites esa funcionalidad
}, { timestamps: false, freezeTableName: true });

module.exports = Usuarios;
