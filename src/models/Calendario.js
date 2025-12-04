const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/baseDatos');

const Calendario = sequelize.define('calendario', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  invernadero_id: { type: DataTypes.INTEGER },
  semana_id: { type: DataTypes.INTEGER },
  dia_semana: { type: DataTypes.STRING(20) },
  fecha_inicio: { type: DataTypes.DATEONLY },
  fecha_fin: { type: DataTypes.DATEONLY },
  hora_inicial: { type: DataTypes.TIME },
  usuario_id: { type: DataTypes.INTEGER },
  hora_final: { type: DataTypes.TIME },
  duracion_minutos: { type: DataTypes.INTEGER, defaultValue: 10, comment: 'Duración del riego en minutos' },
  estado: { type: DataTypes.BOOLEAN, defaultValue: true }
}, { timestamps: false, freezeTableName: true });

module.exports = Calendario;
