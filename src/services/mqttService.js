const mqtt = require('mqtt');
const { Dispositivos, Sensores, Actuadores, ConfiguracionesRiego, Alertas, Lecturas, EventosRiego } = require('../models');

class MQTTService {
  constructor() {
    this.client = null;
    this.connected = false;
    this.devicesByApiKey = new Map(); // Cache de dispositivos
  }

  /**
   * Inicializa la conexión MQTT al broker
   */
  async connect() {
    try {
      const brokerUrl = process.env.MQTT_BROKER_URL || 'mqtt://broker.emqx.io:1883';
      const options = {
        clientId: `riego_server_${Math.random().toString(16).substring(2, 8)}`,
        clean: true,
        connectTimeout: 4000,
        reconnectPeriod: 1000,
        username: process.env.MQTT_USERNAME || '',
        password: process.env.MQTT_PASSWORD || ''
      };

      console.log(`🔌 Conectando a broker MQTT: ${brokerUrl}...`);
      
      this.client = mqtt.connect(brokerUrl, options);

      // Eventos del cliente MQTT
      this.client.on('connect', () => {
        this.connected = true;
        console.log('✅ Conectado al broker MQTT');
        this.subscribeToTopics();
      });

      this.client.on('error', (error) => {
        console.error('❌ Error MQTT:', error.message);
        this.connected = false;
      });

      this.client.on('offline', () => {
        console.log('⚠️  Cliente MQTT offline');
        this.connected = false;
      });

      this.client.on('reconnect', () => {
        console.log('🔄 Reconectando al broker MQTT...');
      });

      this.client.on('message', (topic, message) => {
        this.handleMessage(topic, message);
      });

    } catch (error) {
      console.error('Error al inicializar MQTT:', error);
      throw error;
    }
  }

  /**
   * Suscribirse a los tópicos de sensores y eventos
   */
  subscribeToTopics() {
    if (!this.client || !this.connected) return;

    // Patrón para datos de sensores: riego/+/sensores
    // Patrón para eventos de dispositivos: riego/+/eventos
    const topics = [
      'riego/+/sensores',
      'riego/+/eventos',
      'riego/+/ping'
    ];

    this.client.subscribe(topics, (err) => {
      if (err) {
        console.error('Error al suscribirse a tópicos:', err);
      } else {
        console.log('📡 Suscrito a tópicos MQTT:', topics.join(', '));
      }
    });
  }

  /**
   * Procesa mensajes recibidos de dispositivos Arduino
   */
  async handleMessage(topic, message) {
    try {
      const payload = JSON.parse(message.toString());
      const [, apiKey, type] = topic.split('/'); // riego/{apiKey}/{type}

      // Verificar dispositivo por API Key
      const device = await this.getDeviceByApiKey(apiKey);
      if (!device) {
        console.warn(`⚠️  Mensaje rechazado: API Key inválida (${apiKey})`);
        return;
      }

      // Actualizar última conexión
      await Dispositivos.update({ ultima_conexion: new Date() }, { where: { id: device.id } });

      // Procesar según tipo de mensaje
      switch (type) {
        case 'sensores':
          await this.processSensorData(device, payload);
          break;
        case 'eventos':
          await this.processEvent(device, payload);
          break;
        case 'ping':
          await this.processPing(device, payload);
          break;
        default:
          console.warn(`Tipo de mensaje desconocido: ${type}`);
      }

    } catch (error) {
      console.error('Error al procesar mensaje MQTT:', error);
    }
  }

  /**
   * Procesa datos de sensores
   */
  async processSensorData(device, payload) {
    try {
      const { sensores } = payload;

      if (!sensores || !Array.isArray(sensores)) {
        console.warn('Formato de datos de sensores inválido');
        return;
      }

      for (const sensorData of sensores) {
        const { sensor_id, valor } = sensorData;

        const sensor = await Sensores.findByPk(sensor_id);
        
        if (!sensor || sensor.dispositivo_id !== device.id) {
          console.warn(`Sensor ${sensor_id} no encontrado o no pertenece al dispositivo ${device.id}`);
          continue;
        }

        // Registrar lectura
        await Lecturas.create({
          sensor_id: sensor_id,
          valor: valor
        });

        // Verificar rangos y crear alertas
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

        // Verificar configuraciones de riego automático
        await this.checkAutoIrrigation(device.id, sensor_id, valor);

        console.log(`📊 Sensor ${sensor.nombre} (${device.nombre}): ${valor} ${sensor.unidad}`);
      }

    } catch (error) {
      console.error('Error al procesar datos de sensores:', error);
      console.log(`[ERROR] [mqtt] Error al procesar sensores: ${error.message} (Disp: ${device.id})`);
    }
  }

  /**
   * Verifica si se debe activar riego automático
   */
  async checkAutoIrrigation(deviceId, sensorId, valor) {
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
          
          // Activar riego si valor está por debajo del umbral inferior
          if (valor < config.umbral_inferior && actuator.estado === 'apagado') {
            await this.controlActuator(deviceId, config.actuador_id, 'encendido', 'automatico');
            console.log(`[INFO] [irrigation] Riego automático iniciado en ${actuator.nombre} (Disp: ${deviceId})`);
          }
          
          // Desactivar riego si valor está por encima del umbral superior
          if (valor > config.umbral_superior && actuator.estado === 'encendido') {
            await this.controlActuator(deviceId, config.actuador_id, 'apagado', 'automatico');
            console.log(`[INFO] [irrigation] Riego automático detenido en ${actuator.nombre} (Disp: ${deviceId})`);
          }
        }
      }
    } catch (error) {
      console.error('Error al verificar riego automático:', error);
    }
  }

  /**
   * Procesa eventos genéricos del dispositivo
   */
  async processEvent(device, payload) {
    try {
      const { tipo, mensaje } = payload;
      console.log(`📢 Evento de ${device.nombre}: ${tipo} - ${mensaje}`);
      console.log(`[INFO] [device] ${tipo}: ${mensaje} (Disp: ${device.id})`);
    } catch (error) {
      console.error('Error al procesar evento:', error);
    }
  }

  /**
   * Procesa ping de dispositivo
   */
  async processPing(device, payload) {
    try {
      console.log(`💓 Ping recibido de ${device.nombre}`);
      await Dispositivos.update({ ultima_conexion: new Date() }, { where: { id: device.id } });
    } catch (error) {
      console.error('Error al procesar ping:', error);
    }
  }

  /**
   * Publica comando para controlar actuador
   * @param {number} deviceId - ID del dispositivo
   * @param {number} actuatorId - ID del actuador
   * @param {string} estado - 'encendido' o 'apagado'
   * @param {string} modo - 'manual' o 'automatico'
   */
  async controlActuator(deviceId, actuatorId, estado, modo = 'manual', userId = null) {
    try {
      const device = await Dispositivos.findByPk(deviceId);
      if (!device) {
        throw new Error('Dispositivo no encontrado');
      }

      const actuator = await Actuadores.findByPk(actuatorId);
      if (!actuator) {
        throw new Error('Actuador no encontrado');
      }

      // Actualizar estado en base de datos
      await Actuadores.update({ estado: estado }, { where: { id: actuatorId } });

      // Registrar evento
      await EventosRiego.create({
        dispositivo_id: deviceId,
        actuador_id: actuatorId,
        tipo_evento: estado === 'encendido' ? 'inicio_riego' : 'fin_riego',
        detalle: `Riego ${modo} ${estado}`,
        usuario_id: userId
      });

      // Publicar comando MQTT al dispositivo
      const topic = `riego/${device.api_key}/comandos`;
      const payload = JSON.stringify({
        actuador_id: actuatorId,
        pin: actuator.pin,
        estado: estado === 'encendido' ? 1 : 0,
        timestamp: Date.now()
      });

      if (this.client && this.connected) {
        this.client.publish(topic, payload, { qos: 1 }, (err) => {
          if (err) {
            console.error('Error al publicar comando:', err);
          } else {
            console.log(`🎛️  Comando enviado a ${device.nombre}: Actuador ${actuator.nombre} -> ${estado}`);
          }
        });
      } else {
        console.warn('⚠️  Cliente MQTT no conectado, no se pudo enviar comando');
      }

    } catch (error) {
      console.error('Error al controlar actuador:', error);
      throw error;
    }
  }

  /**
   * Publica actualización de todos los actuadores de un dispositivo
   */
  async publishDeviceState(deviceId) {
    try {
      const device = await Dispositivos.findByPk(deviceId);
      if (!device) return;

      const actuators = await Actuadores.findAll({ where: { dispositivo_id: deviceId } });
      
      const topic = `riego/${device.api_key}/comandos/all`;
      const payload = JSON.stringify({
        actuadores: actuators.map(act => ({
          actuador_id: act.id,
          pin: act.pin,
          estado: act.estado === 'encendido' ? 1 : 0
        })),
        timestamp: Date.now()
      });

      if (this.client && this.connected) {
        this.client.publish(topic, payload, { qos: 1 });
        console.log(`📤 Estado completo enviado a ${device.nombre}`);
      }

    } catch (error) {
      console.error('Error al publicar estado del dispositivo:', error);
    }
  }

  /**
   * Obtiene dispositivo por API Key (con caché)
   */
  async getDeviceByApiKey(apiKey) {
    if (this.devicesByApiKey.has(apiKey)) {
      return this.devicesByApiKey.get(apiKey);
    }

    const device = await Dispositivos.findOne({ where: { api_key: apiKey } });
    if (device) {
      this.devicesByApiKey.set(apiKey, device);
      // Limpiar caché después de 5 minutos
      setTimeout(() => this.devicesByApiKey.delete(apiKey), 5 * 60 * 1000);
    }

    return device;
  }

  /**
   * Cierra la conexión MQTT
   */
  async disconnect() {
    if (this.client) {
      this.client.end();
      this.connected = false;
      console.log('🔌 Desconectado del broker MQTT');
    }
  }

  /**
   * Verifica si el cliente está conectado
   */
  isConnected() {
    return this.connected;
  }
}

// Singleton
const mqttService = new MQTTService();

module.exports = mqttService;
