const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/baseDatos');

const HorariosRiego = sequelize.define('horarios_riego', {
  id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
  configuracion_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  dia_semana: { type: DataTypes.TINYINT, allowNull: false },
  hora_inicio: { type: DataTypes.TIME, allowNull: false },
  duracion_minutos: { type: DataTypes.INTEGER, allowNull: false },
  activo: { type: DataTypes.BOOLEAN, defaultValue: true }
}, { timestamps: false, freezeTableName: true });

module.exports = HorariosRiego;
