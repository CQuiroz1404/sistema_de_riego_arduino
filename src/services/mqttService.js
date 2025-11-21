const mqtt = require('mqtt');
const { Dispositivos, Sensores, Actuadores, ConfiguracionesRiego, Alertas, Lecturas, EventosRiego } = require('../models');
const { dbLogger } = require('../middleware/logger');

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
      // Toma la URL del archivo .env (debe comenzar con mqtts:// para SSL)
      const brokerUrl = process.env.MQTT_BROKER_URL || 'mqtt://broker.emqx.io:1883';
      
      const options = {
        // Generamos un ID único para el servidor para evitar conflictos con los Arduinos
        clientId: `riego_server_${Math.random().toString(16).substring(2, 8)}`,
        clean: true,
        connectTimeout: 4000,
        reconnectPeriod: 1000,
        // Credenciales desde .env
        username: process.env.MQTT_USERNAME || '',
        password: process.env.MQTT_PASSWORD || '',
        
        // Opciones SSL específicas (Node.js suele manejar los certificados públicos automáticamente)
        // Si tuvieras errores de certificado autofirmado, podrías descomentar:
        // rejectUnauthorized: false 
      };

      console.log(`🔌 Conectando a broker MQTT: ${brokerUrl}...`);
      
      this.client = mqtt.connect(brokerUrl, options);

      // --- EVENTOS DEL CLIENTE MQTT ---

      this.client.on('connect', () => {
        this.connected = true;
        console.log('✅ Servidor conectado al broker MQTT (SSL)');
        this.subscribeToTopics();
      });

      this.client.on('error', (error) => {
        console.error('❌ Error MQTT:', error.message);
        // No ponemos this.connected = false aquí porque el cliente intentará reconectar
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

    // Patrones Wildcard (+) para escuchar a TODOS los dispositivos
    const topics = [
      'riego/+/sensores',  // Datos de sensores
      'riego/+/eventos',   // Alertas o confirmaciones
      'riego/+/ping'       // Heartbeat
    ];

    this.client.subscribe(topics, (err) => {
      if (err) {
        console.error('Error al suscribirse a tópicos:', err);
      } else {
        console.log('📡 Servidor escuchando tópicos:', topics.join(', '));
      }
    });
  }

  /**
   * Procesa mensajes recibidos de dispositivos Arduino
   */
  async handleMessage(topic, message) {
    try {
      const msgString = message.toString();
      //console.log(`📩 Mensaje en ${topic}: ${msgString}`); // Descomentar para debug full

      const payload = JSON.parse(msgString);
      const parts = topic.split('/'); 
      // Estructura esperada: riego/{apiKey}/{type}
      
      if (parts.length < 3) return;
      
      const apiKey = parts[1];
      const type = parts[2];

      // 1. Identificar dispositivo
      const device = await this.getDeviceByApiKey(apiKey);
      if (!device) {
        console.warn(`⚠️ Mensaje rechazado: API Key desconocida (${apiKey})`);
        return;
      }

      // 2. Actualizar "última conexión" en BD
      // (Optimizamos no haciendo update en cada mensaje masivo, pero para este caso está bien)
      await Dispositivos.update({ ultima_conexion: new Date() }, { where: { id: device.id } });

      // 3. Enrutar según tipo
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
          // Ignoramos tipos desconocidos o tópicos de comandos (que el servidor mismo envía)
          break;
      }

    } catch (error) {
      console.error('Error procesando mensaje MQTT:', error.message);
    }
  }

  /**
   * Procesa datos de sensores
   */
  async processSensorData(device, payload) {
    try {
      const { sensores } = payload;

      if (!sensores || !Array.isArray(sensores)) return;

      for (const sensorData of sensores) {
        const { sensor_id, valor } = sensorData;

        // Validar que el sensor pertenezca al dispositivo (Seguridad)
        const sensor = await Sensores.findOne({ 
          where: { id: sensor_id, dispositivo_id: device.id } 
        });
        
        if (!sensor) {
          // console.warn(`Sensor ${sensor_id} no corresponde al dispositivo ${device.id}`);
          continue;
        }

        // Guardar lectura en BD
        await Lecturas.create({
          sensor_id: sensor_id,
          valor: valor
        });

        // LOG EN CONSOLA: Ver los datos llegar en tiempo real
        console.log(`📊 [${device.nombre}] ${sensor.nombre}: ${valor} ${sensor.unidad}`);

        // Verificar Alertas (Fuera de rango)
        if (sensor.valor_minimo !== null && valor < sensor.valor_minimo) {
          await this.createAlert(device.id, 'sensor_fuera_rango', 'media', 
            `${sensor.nombre}: Valor bajo (${valor} ${sensor.unidad})`);
        }

        if (sensor.valor_maximo !== null && valor > sensor.valor_maximo) {
          await this.createAlert(device.id, 'sensor_fuera_rango', 'media', 
            `${sensor.nombre}: Valor alto (${valor} ${sensor.unidad})`);
        }

        // Lógica de Riego Automático
        await this.checkAutoIrrigation(device.id, sensor_id, valor);
      }

    } catch (error) {
      console.error('Error procesando sensores:', error);
    }
  }

  /**
   * Verifica si se debe activar riego automático
   */
  async checkAutoIrrigation(deviceId, sensorId, valor) {
    try {
      // Buscar reglas automáticas activas para este dispositivo
      const configs = await ConfiguracionesRiego.findAll({
        where: {
          dispositivo_id: deviceId,
          activo: true,
          modo: 'automatico'
        }
      });
      
      for (const config of configs) {
        // Si la regla usa el sensor que acaba de reportar
        if (config.sensor_id === sensorId) {
          const actuator = await Actuadores.findByPk(config.actuador_id);
          if (!actuator) continue;
          
          // Regla: ENCENDER si baja del mínimo
          if (valor < config.umbral_inferior && actuator.estado === 'apagado') {
            console.log(`💧 Riego AUTO activado para ${actuator.nombre} (Valor: ${valor} < ${config.umbral_inferior})`);
            await this.controlActuator(deviceId, config.actuador_id, 'encendido', 'automatico');
          }
          
          // Regla: APAGAR si supera el máximo
          if (valor > config.umbral_superior && actuator.estado === 'encendido') {
            console.log(`🛑 Riego AUTO detenido para ${actuator.nombre} (Valor: ${valor} > ${config.umbral_superior})`);
            await this.controlActuator(deviceId, config.actuador_id, 'apagado', 'automatico');
          }
        }
      }
    } catch (error) {
      console.error('Error en lógica de riego auto:', error);
    }
  }

  async processEvent(device, payload) {
    // Loguear eventos genéricos del Arduino
    console.log(`📢 [${device.nombre}] Evento: ${payload.tipo} - ${payload.mensaje}`);
  }

  async processPing(device, payload) {
    // El ping ya actualiza la 'ultima_conexion' en handleMessage
    // Podríamos loguear si queremos debug
    // console.log(`💓 Ping de ${device.nombre}`);
  }

  /**
   * Envia comando al Arduino para controlar actuador
   */
  async controlActuator(deviceId, actuatorId, estado, modo = 'manual', userId = null) {
    try {
      const device = await Dispositivos.findByPk(deviceId);
      const actuator = await Actuadores.findByPk(actuatorId);

      if (!device || !actuator) throw new Error('Dispositivo o Actuador no encontrado');

      // 1. Actualizar estado en BD
      await Actuadores.update({ estado: estado }, { where: { id: actuatorId } });

      // 2. Registrar evento en historial
      await EventosRiego.create({
        dispositivo_id: deviceId,
        actuador_id: actuatorId,
        accion: estado === 'encendido' ? 'inicio' : 'fin', // Enum en BD
        modo: modo,
        usuario_id: userId // null si es automático
      });

      // 3. Enviar mensaje MQTT al Arduino
      const topic = `riego/${device.api_key}/comandos`;
      const payload = JSON.stringify({
        actuador_id: actuatorId, // ID en BD
        pin: actuator.pin,       // Pin físico (ej: 7)
        estado: estado === 'encendido' ? 1 : 0,
        timestamp: Date.now()
      });

      if (this.client && this.connected) {
        this.client.publish(topic, payload, { qos: 1 });
        console.log(`🎛️  Comando enviado a ${device.nombre}: Actuador ${actuatorId} -> ${estado}`);
      } else {
        console.error('❌ No se pudo enviar comando: Servidor desconectado de MQTT');
      }

    } catch (error) {
      console.error('Error controlando actuador:', error);
    }
  }

  // --- Helpers ---

  async createAlert(deviceId, tipo, severidad, mensaje) {
    await Alertas.create({
      dispositivo_id: deviceId,
      tipo,
      severidad,
      mensaje
    });
  }

  async getDeviceByApiKey(apiKey) {
    // Pequeña caché en memoria para no saturar la BD con cada mensaje MQTT
    if (this.devicesByApiKey.has(apiKey)) {
      return this.devicesByApiKey.get(apiKey);
    }

    const device = await Dispositivos.findOne({ where: { api_key: apiKey } });
    if (device) {
      this.devicesByApiKey.set(apiKey, device);
      // Limpiar caché cada 60 segundos para refrescar datos si cambian
      setTimeout(() => this.devicesByApiKey.delete(apiKey), 60000);
    }
    return device;
  }

  async disconnect() {
    if (this.client) {
      this.client.end();
      console.log('🔌 Servidor desconectado de MQTT');
    }
  }

  isConnected() {
    return this.connected;
  }
}

// Exportar como Singleton
module.exports = new MQTTService();