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

// ... (asociaciones existentes) ...

// Nuevas asociaciones
// Plantas
Plantas.belongsTo(TipoPlanta, { foreignKey: 'tipo_planta_id' });
Plantas.belongsTo(RangoTemperatura, { foreignKey: 'rango_temperatura_id' });
Plantas.belongsTo(RangoHumedad, { foreignKey: 'rango_humedad_id' });

// Invernaderos
Invernaderos.belongsTo(Plantas, { foreignKey: 'planta_id' });

// Calendario
Calendario.belongsTo(Invernaderos, { foreignKey: 'invernadero_id' });
Calendario.belongsTo(Semanas, { foreignKey: 'semana_id' });
Calendario.belongsTo(Usuarios, { foreignKey: 'usuario_id' });

// Historial Automatico
HistorialAutomatico.belongsTo(Invernaderos, { foreignKey: 'invernadero_id' });

// Historial Acciones
HistorialAcciones.belongsTo(Invernaderos, { foreignKey: 'invernadero_id' });
HistorialAcciones.belongsTo(Usuarios, { foreignKey: 'usuario_id' });
HistorialAcciones.belongsTo(Acciones, { foreignKey: 'accion_id' });

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
