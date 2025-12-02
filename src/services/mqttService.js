const mqtt = require('mqtt');
const { Dispositivos, Sensores, Actuadores, ConfiguracionesRiego, Alertas, Lecturas, EventosRiego, Usuarios } = require('../models');
const logger = require('../config/logger');
const weatherService = require('./weatherService');
const emailService = require('./emailService');

class MQTTService {
  constructor() {
    this.client = null;
    this.connected = false;
    this.devicesByApiKey = new Map(); // Cache de dispositivos
    this.io = null; // Instancia de Socket.io
    this.lastSuggestionTime = new Map(); // Cache para evitar spam de sugerencias
  }

  /**
   * Configura la instancia de Socket.io
   * @param {object} io - Instancia de Socket.io
   */
  setSocketIo(io) {
    this.io = io;
    logger.info('🔌 Socket.io configurado en MQTT Service');
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

      logger.info(`🔌 Conectando a broker MQTT: ${brokerUrl}...`);
      
      this.client = mqtt.connect(brokerUrl, options);

      // Eventos del cliente MQTT
      this.client.on('connect', () => {
        this.connected = true;
        logger.info('✅ Conectado al broker MQTT');
        this.subscribeToTopics();
      });

      this.client.on('error', (error) => {
        logger.error('❌ Error MQTT: %s', error.message);
        this.connected = false;
      });

      this.client.on('offline', () => {
        logger.warn('⚠️  Cliente MQTT offline');
        this.connected = false;
      });

      this.client.on('reconnect', () => {
        logger.info('🔄 Reconectando al broker MQTT...');
      });

      this.client.on('message', (topic, message) => {
        this.handleMessage(topic, message);
      });

    } catch (error) {
      logger.error('Error al inicializar MQTT: %o', error);
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
        logger.error('Error al suscribirse a tópicos: %o', err);
      } else {
        logger.info('📡 Suscrito a tópicos MQTT: %s', topics.join(', '));
      }
    });
  }

  /**
   * Procesa mensajes recibidos de dispositivos Arduino
   */
  async handleMessage(topic, message) {
    try {
      logger.info(`[MQTT] Mensaje recibido en ${topic}: ${message.toString()}`);
      const payload = JSON.parse(message.toString());
      const [, apiKey, type] = topic.split('/'); // riego/{apiKey}/{type}

      // Verificar dispositivo por API Key
      const device = await this.getDeviceByApiKey(apiKey);
      if (!device) {
        logger.warn(`⚠️  Mensaje rechazado: API Key inválida (${apiKey})`);
        return;
      }
      
      logger.info(`[MQTT] Dispositivo identificado: ${device.nombre} (ID: ${device.id})`);

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
          logger.warn(`Tipo de mensaje desconocido: ${type}`);
      }

    } catch (error) {
      logger.error('Error al procesar mensaje MQTT: %o', error);
    }
  }

  /**
   * Procesa datos de sensores
   */
  async processSensorData(device, payload) {
    try {
      const { sensores } = payload;

      logger.info(`🔍 Procesando datos de sensores - Dispositivo: ${device.nombre}`);
      
      if (!sensores || !Array.isArray(sensores)) {
        logger.warn('⚠️  Formato de datos de sensores inválido - Se esperaba array "sensores"');
        logger.warn(`   Payload recibido: ${JSON.stringify(payload)}`);
        return;
      }

      logger.info(`📊 Total de sensores en payload: ${sensores.length}`);
      
      const processedSensors = [];

      for (const sensorData of sensores) {
        const { sensor_id, pin, tipo, valor, estado, conectado } = sensorData;

        let sensor = null;

        // Estrategia 1: Buscar por ID directo (Legacy/Rápido)
        if (sensor_id) {
            sensor = await Sensores.findByPk(sensor_id);
        } 
        // Estrategia 2: Buscar por Pin + Tipo (Escalable)
        else if (pin && tipo) {
            sensor = await Sensores.findOne({
                where: {
                    dispositivo_id: device.id,
                    pin: pin.toString(),
                    tipo: tipo
                }
            });

            // Estrategia 3: Auto-Provisioning (Crear si no existe)
            if (!sensor) {
                logger.info(`✨ Detectado nuevo sensor en ${device.nombre}: ${tipo} en pin ${pin}. Creando...`);
                
                let nombreSensor = `Sensor ${tipo} (${pin})`;
                let unidad = '';
                let min = 0; 
                let max = 100;

                // Configurar defaults según tipo
                switch(tipo) {
                    case 'temperatura': 
                        nombreSensor = pin === 'A1' ? 'Temperatura Suelo' : 'Temperatura Aire';
                        unidad = '°C'; min = -10; max = 50; 
                        break;
                    case 'humedad_ambiente': 
                        nombreSensor = 'Humedad Aire';
                        unidad = '%'; 
                        break;
                    case 'humedad_suelo': 
                        nombreSensor = 'Humedad Suelo';
                        unidad = '%'; 
                        break;
                    case 'nivel_agua': 
                        nombreSensor = 'Nivel Tanque';
                        unidad = '%'; 
                        break;
                }

                sensor = await Sensores.create({
                    dispositivo_id: device.id,
                    nombre: nombreSensor,
                    tipo: tipo,
                    pin: pin.toString(),
                    unidad: unidad,
                    valor_minimo: min,
                    valor_maximo: max,
                    activo: true
                });
                
                logger.info(`✅ Sensor creado automáticamente: ${sensor.nombre} (ID: ${sensor.id})`);
            }
        }

        if (!sensor) {
          logger.warn(`❌ Sensor no identificado y no se pudo crear (ID: ${sensor_id}, Pin: ${pin}, Tipo: ${tipo})`);
          continue;
        }
        
        if (sensor.dispositivo_id !== device.id) {
          logger.warn(`❌ Sensor ${sensor.id} no pertenece al dispositivo ${device.id}`);
          continue;
        }

        // logger.info(`✅ Sensor válido: ${sensor.nombre} (ID: ${sensor.id})`);

        // Verificar estado del sensor (solo si se envían los campos opcionales)
        if (conectado === false || (estado && estado !== 'ok')) {
          const estadoMsg = estado === 'desconectado' ? 'DESCONECTADO' : 
                          estado === 'fuera_rango' ? 'FUERA DE RANGO' : 
                          estado === 'lectura_anormal' ? 'LECTURA ANORMAL' : 'ERROR';
          
          logger.warn(`⚠️  Sensor ${sensor.nombre} (${device.nombre}): ${estadoMsg} - Valor: ${valor}`);
          
          // Crear alerta de sensor desconectado o anormal
          await Alertas.create({
            dispositivo_id: device.id,
            tipo: 'sensor_error',
            severidad: 'alta',
            mensaje: `${sensor.nombre}: ${estadoMsg} (valor: ${valor} ${sensor.unidad})`,
            leido: false
          });
          
          // No procesar riego automático si el sensor no está conectado
          continue;
        }

        // Registrar lectura
        await Lecturas.create({
          sensor_id: sensor.id,
          valor: valor
        });

        // Verificar rangos y crear alertas
        if (sensor.valor_minimo !== null && valor < sensor.valor_minimo) {
          await this.createAlert(device, sensor, 'bajo', valor);
        }

        if (sensor.valor_maximo !== null && valor > sensor.valor_maximo) {
          await this.createAlert(device, sensor, 'alto', valor);
        }

        // Verificar configuraciones de riego automático (solo con sensor conectado)
        await this.checkAutoIrrigation(device.id, sensor.id, valor);

        logger.info(`📊 Sensor ${sensor.nombre} (${device.nombre}): ${valor} ${sensor.unidad} ✅`);
        
        processedSensors.push({
            sensor_id: sensor.id,
            valor: valor,
            tipo: sensor.tipo,
            pin: sensor.pin
        });
      }

      // Emitir evento WebSocket con todos los datos
      if (this.io) {
        logger.info(`📡 Emitiendo actualización WebSocket para dispositivo ${device.id} con ${processedSensors.length} sensores`);
        this.io.emit('sensor:update', {
          deviceId: device.id,
          sensores: processedSensors,
          timestamp: Date.now()
        });
      }

    } catch (error) {
      logger.error('Error al procesar datos de sensores: %o', error);
    }
  }

  /**
   * Verifica si se debe activar riego automático
   */
  async checkAutoIrrigation(deviceId, sensorId, valor) {
    try {
      // Buscar configuraciones activas (tanto manuales como automáticas)
      const configs = await ConfiguracionesRiego.findAll({
        where: {
          dispositivo_id: deviceId,
          activo: true
        }
      });
      
      for (const config of configs) {
        if (config.sensor_id === sensorId) {
          const actuator = await Actuadores.findByPk(config.actuador_id);
          
          if (config.modo === 'automatico') {
            // --- Lógica Automática ---
            
            // Activar riego si valor está por debajo del umbral inferior
            if (valor < config.umbral_inferior && actuator.estado === 'apagado') {
              
              // Verificar clima antes de regar
              const canWater = await weatherService.shouldWater();
              
              if (canWater) {
                await this.controlActuator(deviceId, config.actuador_id, 'encendido', 'automatico');
                logger.info(`[INFO] [irrigation] Riego automático iniciado en ${actuator.nombre} (Disp: ${deviceId})`);
              } else {
                logger.info(`[INFO] [irrigation] Riego pospuesto por lluvia en ${actuator.nombre} (Disp: ${deviceId})`);
              }
            }
            
            // Desactivar riego si valor está por encima del umbral superior
            if (valor > config.umbral_superior && actuator.estado === 'encendido') {
              await this.controlActuator(deviceId, config.actuador_id, 'apagado', 'automatico');
              logger.info(`[INFO] [irrigation] Riego automático detenido en ${actuator.nombre} (Disp: ${deviceId})`);
            }

          } else {
            // --- Lógica Manual (Sugerencias) ---
            
            // Si la humedad es baja y no se está regando, sugerir riego
            if (valor < config.umbral_inferior && actuator.estado === 'apagado') {
               const key = `${deviceId}-${config.actuador_id}`;
               const now = Date.now();
               const lastTime = this.lastSuggestionTime.get(key) || 0;
               
               // Solo sugerir cada 30 minutos (1800000 ms)
               if (now - lastTime > 1800000) {
                   if (this.io) {
                     this.io.emit('alert:riego_sugerido', {
                       deviceId: deviceId,
                       actuatorName: actuator.nombre,
                       sensorValue: valor,
                       threshold: config.umbral_inferior,
                       message: `Se sugiere regar: ${actuator.nombre} (Humedad: ${valor}%)`
                     });
                     this.lastSuggestionTime.set(key, now);
                   }
               }
            }
          }
        }
      }
    } catch (error) {
      logger.error('Error al verificar riego automático: %o', error);
    }
  }

  /**
   * Crea una alerta para sensor fuera de rango
   */
  async createAlert(device, sensor, tipo, valor) {
    try {
      const mensaje = tipo === 'bajo' 
        ? `${sensor.nombre}: Valor bajo (${valor} ${sensor.unidad})`
        : `${sensor.nombre}: Valor alto (${valor} ${sensor.unidad})`;
      
      await Alertas.create({
        dispositivo_id: device.id,
        tipo: 'sensor_fuera_rango',
        severidad: 'media',
        mensaje: mensaje,
        leido: false
      });
      
      logger.warn(`⚠️  ${mensaje}`);
    } catch (error) {
      logger.error('Error al crear alerta: %o', error);
    }
  }

  /**
   * Procesa eventos genéricos del dispositivo
   */
  async processEvent(device, payload) {
    try {
      const { tipo, mensaje } = payload;
      logger.info(`📢 Evento de ${device.nombre}: ${tipo} - ${mensaje}`);
      
      if (this.io) {
        this.io.emit('device:event', {
          deviceId: device.id,
          tipo,
          mensaje,
          timestamp: Date.now()
        });
      }
    } catch (error) {
      logger.error('Error al procesar evento: %o', error);
    }
  }

  /**
   * Procesa ping de dispositivo
   */
  async processPing(device, payload) {
    try {
      if (process.env.NODE_ENV !== 'production') {
        logger.debug(`💓 Ping recibido de ${device.nombre}`);
      }
      await Dispositivos.update({ ultima_conexion: new Date() }, { where: { id: device.id } });
    } catch (error) {
      logger.error('Error al procesar ping: %o', error);
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

      // Notificar inicio de riego vía Socket.io
      if (this.io && estado === 'encendido') {
        this.io.emit('alert:riego_activo', {
          deviceId: deviceId,
          actuatorName: actuator.nombre,
          modo: modo,
          message: `Riego iniciado en ${actuator.nombre} (${modo})`
        });
      }

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
            logger.error('Error al publicar comando: %o', err);
          } else {
            logger.info(`🎛️  Comando enviado a ${device.nombre}: Actuador ${actuator.nombre} -> ${estado}`);
          }
        });
      } else {
        logger.warn('⚠️  Cliente MQTT no conectado, no se pudo enviar comando');
      }

    } catch (error) {
      logger.error('Error al controlar actuador: %o', error);
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
        logger.info(`📤 Estado completo enviado a ${device.nombre}`);
      }

    } catch (error) {
      logger.error('Error al publicar estado del dispositivo: %o', error);
    }
  }

  /**
   * Get device by API Key (with cache integration)
   * @param {string} apiKey - Device API key
   * @returns {Promise<Object>} Device object
   */
  async getDeviceByApiKey(apiKey) {
    const cacheService = require('./cacheService');
    
    // 1. Try cache first
    const cached = await cacheService.getDevice(apiKey);
    if (cached) {
      return cached;
    }

    // 2. Query database
    const device = await Dispositivos.findOne({ 
      where: { api_key: apiKey },
      include: [
        { model: Sensores, as: 'sensores' },
        { model: Actuadores, as: 'actuadores' }
      ]
    });
    
    // 3. Store in cache
    if (device) {
      cacheService.setDevice(apiKey, device);
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
      logger.info('🔌 Desconectado del broker MQTT');
    }
  }

  /**
   * Verifica si el cliente está conectado
   */
  isConnected() {
    return this.connected;
  }

  /**
   * Crea una alerta y notifica al usuario si es necesario
   */
  async createAlert(device, sensor, tipo, valor) {
    try {
      const mensaje = `${sensor.nombre}: Valor ${tipo} (${valor} ${sensor.unidad})`;
      const severidad = 'media'; // Podría ser dinámica según qué tan fuera de rango esté

      // Guardar en BD
      await Alertas.create({
        dispositivo_id: device.id,
        tipo: 'sensor_fuera_rango',
        severidad: severidad,
        mensaje: mensaje
      });

      logger.warn(`⚠️ Alerta creada: ${mensaje} (Disp: ${device.id})`);

      // Obtener usuario para notificar
      const usuario = await Usuarios.findByPk(device.usuario_id);
      
      if (usuario && usuario.email) {
        // Enviar correo
        await emailService.sendAlert(
          usuario.email,
          `Alerta de Sensor - ${device.nombre}`,
          `El sensor <strong>${sensor.nombre}</strong> reportó un valor de <strong>${valor} ${sensor.unidad}</strong>, lo cual está fuera del rango permitido.`,
          'warning'
        );
      }

    } catch (error) {
      logger.error('Error al crear alerta y notificar: %o', error);
    }
  }
}

// Singleton
const mqttService = new MQTTService();

module.exports = mqttService;
