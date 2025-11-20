const { sequelize } = require('../config/baseDatos');
const { DataTypes } = require('sequelize');

// Importar modelos individuales
const Usuarios = require('./Usuarios');
const Dispositivos = require('./Dispositivos');
const Sensores = require('./Sensores');
const Lecturas = require('./Lecturas');
const Actuadores = require('./Actuadores');
const ConfiguracionesRiego = require('./ConfiguracionesRiego');
const HorariosRiego = require('./HorariosRiego');
const EventosRiego = require('./EventosRiego');
const LogsSistema = require('./LogsSistema');
const Alertas = require('./Alertas');

// Registrar asociaciones (según schema.sql)
// usuarios 1 - N dispositivos
Dispositivos.belongsTo(Usuarios, { foreignKey: 'usuario_id' });
Usuarios.hasMany(Dispositivos, { foreignKey: 'usuario_id' });

// dispositivos 1 - N sensores
Sensores.belongsTo(Dispositivos, { foreignKey: 'dispositivo_id' });
Dispositivos.hasMany(Sensores, { foreignKey: 'dispositivo_id' });

// sensores 1 - N lecturas
Lecturas.belongsTo(Sensores, { foreignKey: 'sensor_id' });
Sensores.hasMany(Lecturas, { foreignKey: 'sensor_id' });

// dispositivos 1 - N actuadores
Actuadores.belongsTo(Dispositivos, { foreignKey: 'dispositivo_id' });
Dispositivos.hasMany(Actuadores, { foreignKey: 'dispositivo_id' });

// configuraciones_riego FK a dispositivo, sensor, actuador
ConfiguracionesRiego.belongsTo(Dispositivos, { foreignKey: 'dispositivo_id' });
ConfiguracionesRiego.belongsTo(Sensores, { foreignKey: 'sensor_id' });
ConfiguracionesRiego.belongsTo(Actuadores, { foreignKey: 'actuador_id' });

// horarios_riego -> configuraciones_riego
HorariosRiego.belongsTo(ConfiguracionesRiego, { foreignKey: 'configuracion_id' });
ConfiguracionesRiego.hasMany(HorariosRiego, { foreignKey: 'configuracion_id' });

// eventos_riego -> dispositivos, actuadores, usuarios
EventosRiego.belongsTo(Dispositivos, { foreignKey: 'dispositivo_id' });
EventosRiego.belongsTo(Actuadores, { foreignKey: 'actuador_id' });
EventosRiego.belongsTo(Usuarios, { foreignKey: 'usuario_id' });

// logs_sistema -> dispositivos, usuarios
LogsSistema.belongsTo(Dispositivos, { foreignKey: 'dispositivo_id' });
LogsSistema.belongsTo(Usuarios, { foreignKey: 'usuario_id' });

// alertas -> dispositivos
Alertas.belongsTo(Dispositivos, { foreignKey: 'dispositivo_id' });
Dispositivos.hasMany(Alertas, { foreignKey: 'dispositivo_id' });

module.exports = {
  sequelize,
  Usuarios,
  Dispositivos,
  Sensores,
  Lecturas,
  Actuadores,
  ConfiguracionesRiego,
  HorariosRiego,
  EventosRiego,
  LogsSistema,
  Alertas
};
