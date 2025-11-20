const { Dispositivos, Sensores, Actuadores, ConfiguracionesRiego, Alertas, Lecturas, EventosRiego } = require('../models');
const mqttService = require('../services/mqttService');

class ArduinoController {
  // Endpoint para que Arduino envíe datos de sensores
  static async sendData(req, res) {
    try {
      const apiKey = req.apiKey;
      const { sensor_id, valor, sensores } = req.body;

      // Buscar dispositivo por API Key
      const device = await Dispositivos.findOne({ where: { api_key: apiKey } });
      if (!device) {
        return res.status(401).json({
          success: false,
          message: 'API Key inválida'
        });
      }

      // Actualizar última conexión del dispositivo
      await device.update({ ultima_conexion: new Date() });

      // Si se envía un solo sensor
      if (sensor_id && valor !== undefined) {
        const sensor = await Sensores.findByPk(sensor_id);
        
        if (!sensor || sensor.dispositivo_id !== device.id) {
          return res.status(404).json({
            success: false,
            message: 'Sensor no encontrado o no pertenece a este dispositivo'
          });
        }

        // Registrar lectura
        await Lecturas.create({
          sensor_id: sensor_id,
          valor: valor
        });

        // Verificar si el valor está fuera de rango
        if (sensor.valor_minimo !== null && valor < sensor.valor_minimo) {
          await Alertas.create({
            dispositivo_id: device.id,
            tipo: 'sensor_fuera_rango',
            severidad: 'media',
            mensaje: `${sensor.nombre}: Valor bajo (${valor} ${sensor.unidad})`
          });
        }

        if (sensor.valor_maximo !== null && valor > sensor.valor_maximo) {
          await Alertas.create({
            dispositivo_id: device.id,
            tipo: 'sensor_fuera_rango',
            severidad: 'media',
            mensaje: `${sensor.nombre}: Valor alto (${valor} ${sensor.unidad})`
          });
        }

        // Verificar configuraciones automáticas
        await ArduinoController.checkAutoIrrigation(device.id, sensor_id, valor);
      }

      // Si se envían múltiples sensores
      if (sensores && Array.isArray(sensores)) {
        for (const sensorData of sensores) {
          const sensor = await Sensores.findByPk(sensorData.sensor_id);
          
          if (sensor && sensor.dispositivo_id === device.id) {
            await Lecturas.create({
              sensor_id: sensorData.sensor_id,
              valor: sensorData.valor
            });
            
            // Verificar rangos
            if (sensor.valor_minimo !== null && sensorData.valor < sensor.valor_minimo) {
              await Alertas.create({
                dispositivo_id: device.id,
                tipo: 'sensor_fuera_rango',
                severidad: 'media',
                mensaje: `${sensor.nombre}: Valor bajo (${sensorData.valor} ${sensor.unidad})`
              });
            }

            if (sensor.valor_maximo !== null && sensorData.valor > sensor.valor_maximo) {
              await Alertas.create({
                dispositivo_id: device.id,
                tipo: 'sensor_fuera_rango',
                severidad: 'media',
                mensaje: `${sensor.nombre}: Valor alto (${sensorData.valor} ${sensor.unidad})`
              });
            }

            await ArduinoController.checkAutoIrrigation(device.id, sensorData.sensor_id, sensorData.valor);
          }
        }
      }

      res.json({
        success: true,
        message: 'Datos recibidos correctamente',
        timestamp: new Date()
      });

    } catch (error) {
      console.error('Error al recibir datos de Arduino:', error);
      console.log(`[ERROR] [arduino] Error al recibir datos: ${error.message} (IP: ${req.ip})`);
      res.status(500).json({
        success: false,
        message: 'Error al procesar datos'
      });
    }
  }

  // Verificar si se debe activar riego automático
  static async checkAutoIrrigation(deviceId, sensorId, valor) {
    try {
      const configs = await ConfiguracionesRiego.findAll({
        where: {
          dispositivo_id: deviceId,
          activo: true,
          modo: 'automatico'
        }
      });
      
      for (const config of configs) {
        if (config.sensor_id === sensorId) {
          const actuator = await Actuadores.findByPk(config.actuador_id);
          
          // Si el valor está por debajo del umbral inferior y el actuador está apagado
          if (valor < config.umbral_inferior && actuator.estado === 'apagado') {
            // Activar riego
            await actuator.update({ estado: 'encendido' });
            await EventosRiego.create({
              dispositivo_id: deviceId,
              actuador_id: config.actuador_id,
              tipo_evento: 'inicio_riego',
              detalle: 'Riego automático iniciado',
              usuario_id: null
            });
            
            console.log(`[INFO] [irrigation] Riego automático iniciado en ${actuator.nombre} (Disp: ${deviceId})`);
          }
          
          // Si el valor está por encima del umbral superior y el actuador está encendido
          if (valor > config.umbral_superior && actuator.estado === 'encendido') {
            // Desactivar riego
            await actuator.update({ estado: 'apagado' });
            await EventosRiego.create({
              dispositivo_id: deviceId,
              actuador_id: config.actuador_id,
              tipo_evento: 'fin_riego',
              detalle: 'Riego automático detenido',
              usuario_id: null
            });
            
            console.log(`[INFO] [irrigation] Riego automático detenido en ${actuator.nombre} (Disp: ${deviceId})`);
          }
        }
      }
    } catch (error) {
      console.error('Error al verificar riego automático:', error);
    }
  }

  // Endpoint para que Arduino obtenga comandos
  static async getCommands(req, res) {
    try {
      const apiKey = req.apiKey;

      // Buscar dispositivo por API Key
      const device = await Dispositivos.findOne({ where: { api_key: apiKey } });
      if (!device) {
        return res.status(401).json({
          success: false,
          message: 'API Key inválida'
        });
      }

      // Actualizar última conexión
      await device.update({ ultima_conexion: new Date() });

      // Obtener estado de los actuadores
      const actuators = await Actuadores.findAll({ where: { dispositivo_id: device.id } });

      // Formatear comandos para Arduino
      const commands = actuators.map(actuator => ({
        actuador_id: actuator.id,
        pin: actuator.pin,
        estado: actuator.estado === 'encendido' ? 1 : 0
      }));

      res.json({
        success: true,
        device_id: device.id,
        commands,
        timestamp: new Date()
      });

    } catch (error) {
      console.error('Error al obtener comandos:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener comandos'
      });
    }
  }

  // Endpoint para controlar actuadores manualmente (ahora usa MQTT)
  static async controlActuator(req, res) {
    try {
      const { actuator_id, accion } = req.body; // accion: 'encender' o 'apagar'

      if (!actuator_id || !accion) {
        return res.status(400).json({
          success: false,
          message: 'Parámetros insuficientes'
        });
      }

      const actuator = await Actuadores.findByPk(actuator_id);
      if (!actuator) {
        return res.status(404).json({
          success: false,
          message: 'Actuador no encontrado'
        });
      }

      // Verificar permisos
      const device = await Dispositivos.findByPk(actuator.dispositivo_id);
      if (req.user.rol !== 'admin' && device.usuario_id !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'No tienes permisos para controlar este actuador'
        });
      }

      const nuevoEstado = accion === 'encender' ? 'encendido' : 'apagado';

      // Usar servicio MQTT para controlar el actuador
      await mqttService.controlActuator(
        actuator.dispositivo_id,
        actuator_id,
        nuevoEstado,
        'manual',
        req.user.id
      );

      console.log(`[INFO] [irrigation] Control manual: ${actuator.nombre} ${accion} (Disp: ${actuator.dispositivo_id}, User: ${req.user.id}, IP: ${req.ip})`);

      res.json({
        success: true,
        message: `Actuador ${accion === 'encender' ? 'encendido' : 'apagado'} exitosamente`,
        estado: nuevoEstado
      });

    } catch (error) {
      console.error('Error al controlar actuador:', error);
      res.status(500).json({
        success: false,
        message: 'Error al controlar actuador'
      });
    }
  }

  // Endpoint de diagnóstico
  static async ping(req, res) {
    try {
      const apiKey = req.apiKey;

      const device = await Dispositivos.findOne({ where: { api_key: apiKey } });
      if (!device) {
        return res.status(401).json({
          success: false,
          message: 'API Key inválida'
        });
      }

      await device.update({ ultima_conexion: new Date() });

      res.json({
        success: true,
        message: 'Pong',
        device: {
          id: device.id,
          nombre: device.nombre,
          estado: device.estado
        },
        timestamp: new Date()
      });

    } catch (error) {
      console.error('Error en ping:', error);
      res.status(500).json({
        success: false,
        message: 'Error en el servidor'
      });
    }
  }
}

module.exports = ArduinoController;
