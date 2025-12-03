const { Dispositivos, Sensores, Actuadores, ConfiguracionesRiego, Alertas, Lecturas, EventosRiego } = require('../models');
const mqttService = require('../services/mqttService');
const logger = require('../config/logger');

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
      logger.error(`[arduino] Error al recibir datos: ${error.message} (IP: ${req.ip})`);
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
            
            logger.info(`[irrigation] Riego automático iniciado en ${actuator.nombre} (Disp: ${deviceId})`);
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
            
            logger.info(`[irrigation] Riego automático detenido en ${actuator.nombre} (Disp: ${deviceId})`);
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

      // Verificar si el dispositivo está online (última conexión en los últimos 5 minutos)
      const TIMEOUT_MINUTES = 5;
      const now = new Date();
      const lastConnection = device.ultima_conexion ? new Date(device.ultima_conexion) : null;
      const minutesSinceLastConnection = lastConnection 
        ? Math.floor((now - lastConnection) / 1000 / 60) 
        : 9999;

      if (!lastConnection || minutesSinceLastConnection > TIMEOUT_MINUTES) {
        return res.status(503).json({
          success: false,
          message: `⚠️ Dispositivo "${device.nombre}" no está conectado`,
          details: lastConnection 
            ? `Última conexión hace ${minutesSinceLastConnection} minutos`
            : 'Nunca se ha conectado',
          offline: true,
          last_connection: lastConnection,
          device_name: device.nombre,
          suggestion: 'Verifica que el Arduino esté encendido y conectado a WiFi'
        });
      }

      const nuevoEstado = accion === 'encender' ? 'encendido' : 'apagado';

      // Si se enciende manualmente, desactivar calendario activo para ese invernadero
      if (accion === 'encender' && device.invernadero_id) {
        const { Calendario } = require('../models');
        const eventosDesactivados = await Calendario.update(
          { estado: false },
          { 
            where: { 
              invernadero_id: device.invernadero_id, 
              estado: true 
            } 
          }
        );
        
        if (eventosDesactivados[0] > 0) {
          logger.info(`📅 Calendario desactivado para invernadero ${device.invernadero_id} por riego manual (${eventosDesactivados[0]} eventos)`);
          
          // Notificar al usuario vía Socket.IO
          const socketService = require('../services/mqttService');
          if (socketService.io) {
            socketService.io.emit('calendar:disabled', {
              invernadero_id: device.invernadero_id,
              device_id: device.id,
              mensaje: 'Calendario desactivado por riego manual',
              eventos_desactivados: eventosDesactivados[0],
              timestamp: new Date().toISOString()
            });
          }
        }
      }

      // Usar servicio MQTT para controlar el actuador
      await mqttService.controlActuator(
        actuator.dispositivo_id,
        actuator_id,
        nuevoEstado,
        'manual',
        req.user.id
      );

      logger.info(`[irrigation] Control manual: ${actuator.nombre} ${accion} (Disp: ${actuator.dispositivo_id}, User: ${req.user.id}, IP: ${req.ip})`);

      res.json({
        success: true,
        message: `Actuador ${accion === 'encender' ? 'encendido' : 'apagado'} exitosamente`,
        estado: nuevoEstado,
        calendario_desactivado: accion === 'encender' && device.invernadero_id
      });

    } catch (error) {
      console.error('Error al controlar actuador:', error);
      res.status(500).json({
        success: false,
        message: 'Error al controlar actuador'
      });
    }
  }

  // Endpoint de EMERGENCIA - Detener TODOS los actuadores
  static async emergencyStop(req, res) {
    try {
      const { device_id } = req.body;

      if (!device_id) {
        return res.status(400).json({
          success: false,
          message: 'ID de dispositivo requerido'
        });
      }

      // Verificar permisos
      const device = await Dispositivos.findByPk(device_id);
      if (!device) {
        return res.status(404).json({
          success: false,
          message: 'Dispositivo no encontrado'
        });
      }

      if (req.user.rol !== 'admin' && device.usuario_id !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'No tienes permisos para este dispositivo'
        });
      }

      // Obtener todos los actuadores activos
      const actuadores = await Actuadores.findAll({
        where: { 
          dispositivo_id: device_id,
          activo: true 
        }
      });

      if (actuadores.length === 0) {
        return res.json({
          success: true,
          message: 'No hay actuadores activos para detener'
        });
      }

      // Apagar todos los actuadores
      const resultados = [];
      for (const actuador of actuadores) {
        try {
          await mqttService.controlActuator(
            device_id,
            actuador.id,
            'apagado',
            'emergencia',
            req.user.id
          );
          resultados.push({ id: actuador.id, nombre: actuador.nombre, resultado: 'apagado' });
        } catch (error) {
          logger.error(`Error apagando actuador ${actuador.id}: %o`, error);
          resultados.push({ id: actuador.id, nombre: actuador.nombre, resultado: 'error' });
        }
      }

      logger.warn(`🚨 EMERGENCIA: Todos los actuadores apagados en ${device.nombre} (User: ${req.user.id})`);

      // Desactivar calendario también
      if (device.invernadero_id) {
        const { Calendario } = require('../models');
        await Calendario.update(
          { estado: false },
          { where: { invernadero_id: device.invernadero_id } }
        );
      }

      res.json({
        success: true,
        message: 'Parada de emergencia ejecutada',
        actuadores_detenidos: resultados.length,
        detalles: resultados
      });

    } catch (error) {
      logger.error('Error en parada de emergencia: %o', error);
      res.status(500).json({
        success: false,
        message: 'Error en parada de emergencia'
      });
    }
  }

  // Endpoint para actualizar umbrales de humedad remotamente
  static async updateThresholds(req, res) {
    try {
      const { device_id, humedad_min, humedad_max } = req.body;

      if (!device_id || humedad_min === undefined || humedad_max === undefined) {
        return res.status(400).json({
          success: false,
          message: 'Parámetros insuficientes (device_id, humedad_min, humedad_max)'
        });
      }

      // Validar rangos
      if (humedad_min < 0 || humedad_min > 100 || humedad_max < 0 || humedad_max > 100) {
        return res.status(400).json({
          success: false,
          message: 'Los umbrales deben estar entre 0 y 100'
        });
      }

      if (humedad_min >= humedad_max) {
        return res.status(400).json({
          success: false,
          message: 'El umbral mínimo debe ser menor que el máximo'
        });
      }

      // Verificar permisos
      const device = await Dispositivos.findByPk(device_id);
      if (!device) {
        return res.status(404).json({
          success: false,
          message: 'Dispositivo no encontrado'
        });
      }

      if (req.user.rol !== 'admin' && device.usuario_id !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'No tienes permisos para configurar este dispositivo'
        });
      }

      // Actualizar configuración en BD
      const [config, created] = await ConfiguracionesRiego.findOrCreate({
        where: { dispositivo_id: device_id },
        defaults: {
          nombre: 'Configuración Automática',
          sensor_id: 1, // Temporal
          actuador_id: 1, // Temporal
          umbral_inferior: humedad_min,
          umbral_superior: humedad_max,
          activo: true
        }
      });

      if (!created) {
        await ConfiguracionesRiego.update(
          { 
            umbral_inferior: humedad_min,
            umbral_superior: humedad_max 
          },
          { where: { dispositivo_id: device_id } }
        );
      }

      // Enviar comando MQTT al Arduino para actualizar umbrales
      const topic = `riego/${device.api_key}/comandos`;
      const payload = JSON.stringify({
        configuracion: {
          humedad_min: parseFloat(humedad_min),
          humedad_max: parseFloat(humedad_max)
        },
        timestamp: Date.now()
      });

      if (mqttService.isConnected()) {
        mqttService.client.publish(topic, payload, { qos: 1 }, (err) => {
          if (err) {
            logger.error('Error al publicar configuración: %o', err);
          } else {
            logger.info(`⚙️ Umbrales actualizados en ${device.nombre}: ${humedad_min}% - ${humedad_max}%`);
          }
        });
      }

      res.json({
        success: true,
        message: 'Umbrales actualizados exitosamente',
        configuracion: {
          humedad_min,
          humedad_max,
          enviado_arduino: mqttService.isConnected()
        }
      });

    } catch (error) {
      logger.error('Error al actualizar umbrales: %o', error);
      res.status(500).json({
        success: false,
        message: 'Error al actualizar umbrales'
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

  // Obtener datos actualizados de sensores (para actualización en tiempo real)
  static async getSensoresActualizados(req, res) {
    try {
      const { dispositivo_id } = req.params;

      const sensores = await Sensores.findAll({ where: { dispositivo_id } });

      const sensoresConDatos = await Promise.all(sensores.map(async (s) => {
        const sensor = s.toJSON();
        const ultimaLectura = await Lecturas.findOne({
          where: { sensor_id: sensor.id },
          order: [['fecha_lectura', 'DESC']],
          limit: 1
        });

        if (ultimaLectura) {
          sensor.ultimo_valor = ultimaLectura.valor;
          sensor.ultima_fecha = ultimaLectura.fecha_lectura;
        }

        return sensor;
      }));

      res.json({
        success: true,
        sensores: sensoresConDatos
      });

    } catch (error) {
      console.error('Error al obtener sensores:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener datos'
      });
    }
  }
}

module.exports = ArduinoController;
