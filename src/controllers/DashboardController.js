const { Dispositivos, Sensores, Actuadores, Alertas, Lecturas, Invernaderos } = require('../models');
const { Op } = require('sequelize');
const { sequelize } = require('../models'); // Para consultas raw si es necesario
const logger = require('../config/logger');

class DashboardController {
  // Vista principal del dashboard
  static async index(req, res) {
    try {
      // Obtener dispositivos del usuario
      let devices;
      if (req.user.rol === 'admin') {
        devices = await Dispositivos.findAll();
      } else {
        devices = await Dispositivos.findAll({ 
          where: { usuario_id: req.user.id }
        });
      }

      // Calcular estado de conexión (encendido/apagado) para cada dispositivo
      const now = new Date();
      const devicesWithStatus = devices.map(d => {
        const device = d.toJSON();
        const lastConnection = device.ultima_conexion ? new Date(device.ultima_conexion) : null;
        const secondsAgo = lastConnection ? Math.floor((now - lastConnection) / 1000) : null;
        
        // Estado de encendido: está enviando datos (última conexión < 30 segundos)
        device.isOnline = lastConnection && secondsAgo < 30;
        device.estadoConexion = device.isOnline ? 'encendido' : 'apagado';
        device.secondsAgo = secondsAgo;
        
        return device;
      });

      // Obtener alertas no leídas
      const alerts = await Alertas.findAll({ where: { leida: false } });

      // Estadísticas generales
      const stats = await DashboardController.getGeneralStats(req.user);

      res.render('dashboard/index', {
        title: 'Dashboard',
        useSocketIO: true,
        user: req.user,
        devices: devicesWithStatus,
        alerts: alerts.map(a => a.toJSON()),
        stats
      });
    } catch (error) {
      logger.error('Error al cargar dashboard: %o', error);
      res.status(500).render('error', {
        message: 'Error al cargar el dashboard'
      });
    }
  }

  // Obtener estadísticas generales
  static async getGeneralStats(user) {
    try {
      const userId = user.rol === 'admin' ? null : user.id;
      
      // Usar Sequelize para evitar SQL injection
      const whereClause = userId ? { usuario_id: userId } : {};
      
      // Contar dispositivos totales
      const total_dispositivos = await Dispositivos.count({
        where: whereClause
      });
      
      // Contar dispositivos activos
      const dispositivos_activos = await Dispositivos.count({
        where: { ...whereClause, estado: 'activo' }
      });
      
      // Contar sensores activos
      const total_sensores = await Sensores.count({
        where: { activo: true },
        include: [{
          model: Dispositivos,
          where: whereClause,
          attributes: []
        }]
      });
      
      // Contar actuadores activos
      const total_actuadores = await Actuadores.count({
        where: { activo: true },
        include: [{
          model: Dispositivos,
          where: whereClause,
          attributes: []
        }]
      });
      
      // Contar alertas no leídas (siempre todas para el usuario)
      const alertas_no_leidas = await Alertas.count({
        where: { leida: false }
      });
      
      return {
        total_dispositivos,
        dispositivos_activos,
        total_sensores,
        total_actuadores,
        alertas_no_leidas
      };
    } catch (error) {
      logger.error('Error al obtener estadísticas: %o', error);
      return {};
    }
  }

  // API: Obtener datos del dashboard
  static async getData(req, res) {
    try {
      let devices;
      if (req.user.rol === 'admin') {
        devices = await Dispositivos.findAll();
      } else {
        devices = await Dispositivos.findAll({ where: { usuario_id: req.user.id } });
      }

      // Obtener última lectura de cada dispositivo
      const devicesWithData = await Promise.all(
        devices.map(async (device) => {
          const sensors = await Sensores.findAll({ where: { dispositivo_id: device.id } });
          const sensorsWithReadings = await Promise.all(
            sensors.map(async (sensor) => {
              const lastReading = await Lecturas.findOne({ 
                where: { sensor_id: sensor.id },
                order: [['fecha_lectura', 'DESC']]
              });
              return { ...sensor.toJSON(), lastReading: lastReading ? lastReading.toJSON() : null };
            })
          );
          return { ...device.toJSON(), sensors: sensorsWithReadings };
        })
      );

      const stats = await DashboardController.getGeneralStats(req.user);
      const alerts = await Alertas.findAll({ where: { leida: false } });

      res.json({
        success: true,
        devices: devicesWithData,
        stats,
        alerts: alerts.map(a => a.toJSON())
      });
    } catch (error) {
      logger.error('Error al obtener datos: %o', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener datos del dashboard'
      });
    }
  }

  // API: Obtener datos de un dispositivo específico
  static async getDeviceData(req, res) {
    try {
      const { id } = req.params;
      const device = await Dispositivos.findByPk(id);

      if (!device) {
        return res.status(404).json({
          success: false,
          message: 'Dispositivo no encontrado'
        });
      }

      // Verificar permisos
      if (req.user.rol !== 'admin' && device.usuario_id !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'No tienes permisos para ver este dispositivo'
        });
      }

      const sensors = await Sensores.findAll({ where: { dispositivo_id: id } });
      const actuators = await Actuadores.findAll({ where: { dispositivo_id: id } });

      // Obtener última lectura de cada sensor
      const sensorsWithReadings = await Promise.all(
        sensors.map(async (sensor) => {
          const lastReading = await Lecturas.findOne({ 
            where: { sensor_id: sensor.id },
            order: [['fecha_registro', 'DESC']]
          });
          return { ...sensor.toJSON(), lastReading: lastReading ? lastReading.toJSON() : null };
        })
      );

      res.json({
        success: true,
        device: device.toJSON(),
        sensors: sensorsWithReadings,
        actuators: actuators.map(a => a.toJSON())
      });
    } catch (error) {
      logger.error('Error al obtener datos del dispositivo: %o', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener datos'
      });
    }
  }
}

module.exports = DashboardController;
