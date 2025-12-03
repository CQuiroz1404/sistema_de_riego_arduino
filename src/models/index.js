const { sequelize } = require('../config/baseDatos');
const { DataTypes } = require('sequelize');

// Importar modelos individuales
const Usuarios = require('./Usuarios');
const Dispositivos = require('./Dispositivos');
const Sensores = require('./Sensores');
const Lecturas = require('./Lecturas');
const Actuadores = require('./Actuadores');
const ConfiguracionesRiego = require('./ConfiguracionesRiego');
const EventosRiego = require('./EventosRiego');
const LogsSistema = require('./LogsSistema');
const Alertas = require('./Alertas');

// Nuevos modelos
const TipoPlanta = require('./TipoPlanta');
const RangoTemperatura = require('./RangoTemperatura');
const RangoHumedad = require('./RangoHumedad');
const Plantas = require('./Plantas');
const Invernaderos = require('./Invernaderos');
const Semanas = require('./Semanas');
const Acciones = require('./Acciones');
const Calendario = require('./Calendario');
const HistorialAutomatico = require('./HistorialAutomatico');
const HistorialAcciones = require('./HistorialAcciones');

// Registrar asociaciones (según schema.sql)
// usuarios 1 - N dispositivos
Dispositivos.belongsTo(Usuarios, { foreignKey: 'usuario_id' });
Usuarios.hasMany(Dispositivos, { foreignKey: 'usuario_id' });

// dispositivos 1 - N sensores
Dispositivos.hasMany(Sensores, { foreignKey: 'dispositivo_id' });
Sensores.belongsTo(Dispositivos, { foreignKey: 'dispositivo_id' });

// Dispositivos pueden pertenecer a un invernadero
Dispositivos.belongsTo(Invernaderos, { foreignKey: 'invernadero_id', as: 'invernadero' });
Invernaderos.hasMany(Dispositivos, { foreignKey: 'invernadero_id', as: 'dispositivos' });

// dispositivos 1 - N actuadores
Dispositivos.hasMany(Actuadores, { foreignKey: 'dispositivo_id' });
Actuadores.belongsTo(Dispositivos, { foreignKey: 'dispositivo_id' });

// sensores 1 - N lecturas
Sensores.hasMany(Lecturas, { foreignKey: 'sensor_id' });
Lecturas.belongsTo(Sensores, { foreignKey: 'sensor_id' });

// dispositivos 1 - N configuraciones_riego
Dispositivos.hasMany(ConfiguracionesRiego, { foreignKey: 'dispositivo_id' });
ConfiguracionesRiego.belongsTo(Dispositivos, { foreignKey: 'dispositivo_id' });

// dispositivos 1 - N eventos_riego
Dispositivos.hasMany(EventosRiego, { foreignKey: 'dispositivo_id' });
EventosRiego.belongsTo(Dispositivos, { foreignKey: 'dispositivo_id' });

// dispositivos 1 - N alertas
Dispositivos.hasMany(Alertas, { foreignKey: 'dispositivo_id' });
Alertas.belongsTo(Dispositivos, { foreignKey: 'dispositivo_id' });

// Nuevas asociaciones
// Plantas
Plantas.belongsTo(TipoPlanta, { foreignKey: 'tipo_planta_id' });
Plantas.belongsTo(RangoTemperatura, { foreignKey: 'rango_temperatura_id' });
Plantas.belongsTo(RangoHumedad, { foreignKey: 'rango_humedad_id' });

// Invernaderos
Invernaderos.belongsTo(Plantas, { foreignKey: 'planta_id' });

// Dispositivos pueden tener muchos invernaderos
// (Ya definido arriba en la sección de Dispositivos)

// Calendario
Calendario.belongsTo(Invernaderos, { foreignKey: 'invernadero_id', as: 'invernadero' });
Calendario.belongsTo(Semanas, { foreignKey: 'semana_id' });
Calendario.belongsTo(Usuarios, { foreignKey: 'usuario_id', as: 'usuario' });

// Historial Automatico
HistorialAutomatico.belongsTo(Invernaderos, { foreignKey: 'invernadero_id' });

// Historial Acciones
HistorialAcciones.belongsTo(Invernaderos, { foreignKey: 'invernadero_id' });
HistorialAcciones.belongsTo(Usuarios, { foreignKey: 'usuario_id' });
HistorialAcciones.belongsTo(Acciones, { foreignKey: 'accion_id' });

// Logs del Sistema
LogsSistema.belongsTo(Usuarios, { foreignKey: 'usuario_id' });
Usuarios.hasMany(LogsSistema, { foreignKey: 'usuario_id' });

module.exports = {
  sequelize,
  Usuarios,
  Dispositivos,
  Sensores,
  Lecturas,
  Actuadores,
  ConfiguracionesRiego,
  EventosRiego,
  LogsSistema,
  Alertas,
  // Nuevos exports
  TipoPlanta,
  RangoTemperatura,
  RangoHumedad,
  Plantas,
  Invernaderos,
  Semanas,
  Acciones,
  Calendario,
  HistorialAutomatico,
  HistorialAcciones
};
