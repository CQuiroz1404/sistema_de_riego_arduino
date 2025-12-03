const cron = require('node-cron');
const { Calendario, Invernaderos, Usuarios, Dispositivos, Alertas } = require('../models');
const emailService = require('./emailService');
const logger = require('../config/logger');

/**
 * Servicio de Programación Automática
 * Verifica el calendario de riego y envía notificaciones cuando es hora de regar
 */
class SchedulerService {
  constructor() {
    this.task = null;
    this.lastNotifications = new Map(); // Evitar duplicados
    this.io = null; // Socket.IO instance
  }

  /**
   * Configura Socket.IO para notificaciones en tiempo real
   */
  setSocketIo(io) {
    this.io = io;
    logger.info('📡 Socket.IO configurado en SchedulerService');
  }

  /**
   * Inicia el scheduler que verifica el calendario cada minuto
   */
  start() {
    if (this.task) {
      logger.warn('⚠️ Scheduler ya está en ejecución');
      return;
    }

    // Ejecutar cada minuto (cron: minuto hora día mes día_semana)
    this.task = cron.schedule('* * * * *', async () => {
      await this.checkSchedule();
      await this.checkDeviceHealth();
    });

    logger.info('✅ Scheduler de riego iniciado - Verificando calendario cada minuto');
  }

  /**
   * Detiene el scheduler
   */
  stop() {
    if (this.task) {
      this.task.stop();
      this.task = null;
      logger.info('🛑 Scheduler de riego detenido');
    }
  }

  /**
   * Verifica el calendario y envía notificaciones si es hora de regar
   */
  async checkSchedule() {
    try {
      const now = new Date();
      const currentDay = this.getDayName(now);
      const currentTime = this.formatTime(now);

      // Obtener eventos activos del día actual
      const eventos = await Calendario.findAll({
        where: {
          dia_semana: currentDay,
          estado: true
        },
        include: [
          {
            model: Invernaderos,
            as: 'invernadero',
            include: [
              {
                model: Dispositivos,
                as: 'dispositivos'
              }
            ]
          },
          {
            model: Usuarios,
            as: 'usuario',
            attributes: ['id', 'nombre', 'email']
          }
        ]
      });

      if (eventos.length === 0) {
        // No hay eventos programados para hoy
        return;
      }

      logger.debug(`🔍 Verificando ${eventos.length} eventos para ${currentDay} a las ${currentTime}`);

      for (const evento of eventos) {
        await this.processEvent(evento, currentTime, now);
      }
    } catch (error) {
      logger.error('❌ Error en checkSchedule: %o', error);
    }
  }

  /**
   * Procesa un evento individual y envía notificaciones si corresponde
   */
  async processEvent(evento, currentTime, now) {
    try {
      const horaInicial = evento.hora_inicial;
      
      // Verificar si es la hora exacta (con margen de 1 minuto)
      if (!this.isTimeToWater(currentTime, horaInicial)) {
        return;
      }

      // Verificar si ya se envió notificación (evitar duplicados)
      const notificationKey = `${evento.id}-${currentTime}`;
      if (this.lastNotifications.has(notificationKey)) {
        return;
      }

      // Marcar como notificado
      this.lastNotifications.set(notificationKey, now);
      
      // Limpiar notificaciones antiguas (más de 2 horas)
      this.cleanOldNotifications(now);

      // Obtener información del invernadero
      const invernadero = evento.invernadero;
      const usuario = evento.usuario;

      if (!invernadero) {
        logger.warn(`⚠️ Evento ${evento.id} sin invernadero asociado`);
        return;
      }

      const mensaje = `Es hora de regar el ${invernadero.descripcion || `Invernadero #${invernadero.id}`}`;
      const detalles = {
        invernadero_id: invernadero.id,
        descripcion: invernadero.descripcion,
        hora_inicio: horaInicial,
        hora_fin: evento.hora_final,
        dia: evento.dia_semana
      };

      logger.info(`🚿 NOTIFICACIÓN DE RIEGO: ${mensaje}`);

      // 1. Enviar notificación por WebSocket (tiempo real)
      if (this.io) {
        this.io.emit('schedule:watering-time', {
          tipo: 'riego_programado',
          mensaje,
          evento_id: evento.id,
          invernadero: detalles,
          timestamp: now.toISOString()
        });
      }

      // 2. Enviar email al usuario (si existe)
      if (usuario && usuario.email) {
        await emailService.sendAlert(
          usuario.email,
          '🚿 Hora de Regar - Recordatorio Automático',
          `
            <h3>Es momento de regar tus plantas</h3>
            <p><strong>Invernadero:</strong> ${detalles.descripcion || `#${detalles.invernadero_id}`}</p>
            <p><strong>Horario programado:</strong> ${horaInicial} - ${evento.hora_final}</p>
            <p><strong>Día:</strong> ${evento.dia_semana}</p>
            <p>No olvides verificar el estado de tus sensores antes de activar el riego.</p>
          `,
          'info'
        );

        logger.info(`📧 Email enviado a ${usuario.email} (Evento #${evento.id})`);
      }

      // 3. Activar riego automático si hay dispositivo asociado
      if (invernadero.dispositivos && invernadero.dispositivos.length > 0) {
        const dispositivo = invernadero.dispositivos[0];
        
        // Obtener bomba asociada al dispositivo
        const { Actuadores } = require('../models');
        const actuadores = await Actuadores.findAll({ 
          where: { 
            dispositivo_id: dispositivo.id, 
            tipo: 'bomba',
            activo: true
          } 
        });
        
        if (actuadores.length > 0) {
          const bomba = actuadores[0];
          const mqttService = require('./mqttService');
          
          try {
            // Activar bomba vía MQTT
            await mqttService.controlActuator(
              dispositivo.id,
              bomba.id,
              'encendido',
              'calendario',
              usuario ? usuario.id : null
            );
            
            logger.info(`🚿 Riego automático activado: ${bomba.nombre} (Disp: ${dispositivo.id}, Evento: ${evento.id})`);
            
            // Notificación WebSocket de activación
            if (this.io) {
              this.io.emit('irrigation:started', {
                tipo: 'calendario',
                device_id: dispositivo.id,
                device_name: dispositivo.nombre,
                actuator_id: bomba.id,
                actuator_name: bomba.nombre,
                evento_id: evento.id,
                mensaje: `Riego iniciado automáticamente en ${invernadero.descripcion}`,
                timestamp: now.toISOString()
              });
            }
            
            // Programar apagado automático según duración del evento
            const duracionMinutos = evento.duracion_minutos || 10; // Default 10 minutos
            
            setTimeout(async () => {
              try {
                await mqttService.controlActuator(
                  dispositivo.id,
                  bomba.id,
                  'apagado',
                  'calendario',
                  usuario ? usuario.id : null
                );
                
                logger.info(`⏱️ Riego automático finalizado: ${bomba.nombre} (Duración: ${duracionMinutos} min)`);
                
                if (this.io) {
                  this.io.emit('irrigation:finished', {
                    tipo: 'calendario',
                    device_id: dispositivo.id,
                    actuator_id: bomba.id,
                    duracion_minutos: duracionMinutos,
                    mensaje: `Riego finalizado en ${invernadero.descripcion}`,
                    timestamp: new Date().toISOString()
                  });
                }
              } catch (error) {
                logger.error(`❌ Error al apagar bomba automáticamente: %o`, error);
              }
            }, duracionMinutos * 60 * 1000);
            
          } catch (error) {
            logger.error(`❌ Error activando riego automático: %o`, error);
          }
        } else {
          logger.warn(`⚠️ No se encontró bomba activa para dispositivo ${dispositivo.id}`);
        }
      } else if (invernadero.dispositivo) {
        // Compatibilidad con código anterior (notificación solo)
        const dispositivo = invernadero.dispositivo;
        
        if (this.io) {
          this.io.emit('device:schedule-reminder', {
            device_id: dispositivo.id,
            device_name: dispositivo.nombre,
            action: 'watering_reminder',
            mensaje,
            timestamp: now.toISOString()
          });
        }

        logger.info(`📱 Notificación enviada para dispositivo ${dispositivo.nombre} (ID: ${dispositivo.id})`);
      }

    } catch (error) {
      logger.error(`❌ Error procesando evento ${evento.id}: %o`, error);
    }
  }

  /**
   * Verifica si es el momento de regar (con margen de tolerancia)
   */
  isTimeToWater(currentTime, scheduledTime) {
    // Formato: "HH:MM"
    const [currentHour, currentMinute] = currentTime.split(':').map(Number);
    const [scheduledHour, scheduledMinute] = scheduledTime.split(':').map(Number);

    return currentHour === scheduledHour && currentMinute === scheduledMinute;
  }

  /**
   * Obtiene el nombre del día en español
   */
  getDayName(date) {
    const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    return days[date.getDay()];
  }

  /**
   * Formatea la hora actual en formato HH:MM
   */
  formatTime(date) {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  /**
   * Limpia notificaciones antiguas del mapa (más de 2 horas)
   */
  cleanOldNotifications(now) {
    const twoHoursAgo = now.getTime() - (2 * 60 * 60 * 1000);
    
    for (const [key, timestamp] of this.lastNotifications.entries()) {
      if (timestamp.getTime() < twoHoursAgo) {
        this.lastNotifications.delete(key);
      }
    }
  }

  /**
   * Verifica la salud de los dispositivos (Heartbeat)
   * Si un dispositivo no se ha conectado en 5 minutos, se marca como offline
   */
  async checkDeviceHealth() {
    try {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      const { Op } = require('sequelize');

      // Buscar dispositivos activos que no se han conectado recientemente
      const offlineDevices = await Dispositivos.findAll({
        where: {
          estado: 'activo',
          ultima_conexion: {
            [Op.lt]: fiveMinutesAgo
          }
        },
        include: [{ model: Usuarios, as: 'usuario' }] // Asegúrate de que el alias 'usuario' sea correcto en tu modelo
      });

      for (const device of offlineDevices) {
        logger.warn(`⚠️ Dispositivo ${device.nombre} (ID: ${device.id}) parece estar OFFLINE. Última conexión: ${device.ultima_conexion}`);

        // 1. Crear Alerta en BD
        // Verificar si ya existe una alerta reciente no leída para no spammear (ej: en la última hora)
        const existingAlert = await Alertas.findOne({
            where: {
                dispositivo_id: device.id,
                tipo: 'dispositivo_offline',
                leida: false,
                fecha_creacion: { [Op.gt]: new Date(Date.now() - 60 * 60 * 1000) } 
            }
        });

        if (!existingAlert) {
            await Alertas.create({
                dispositivo_id: device.id,
                tipo: 'dispositivo_offline',
                severidad: 'alta',
                mensaje: `El dispositivo ${device.nombre} ha perdido conexión. Última actividad: ${device.ultima_conexion ? device.ultima_conexion.toLocaleString() : 'Nunca'}`,
                leida: false
            });

            // 2. Notificar por Email
            if (device.usuario && device.usuario.email) {
                await emailService.sendAlert(
                    device.usuario.email,
                    `⚠️ Dispositivo Desconectado: ${device.nombre}`,
                    `El sistema ha detectado que el dispositivo <strong>${device.nombre}</strong> ha dejado de comunicarse.<br>
                     <strong>Última conexión:</strong> ${device.ultima_conexion ? device.ultima_conexion.toLocaleString() : 'Desconocida'}<br>
                     Por favor verifique que el dispositivo esté encendido y conectado a la red WiFi.`,
                    'critical'
                );
            }

            // 3. Notificar por WebSocket
            if (this.io) {
                this.io.emit('device:offline', {
                    id: device.id,
                    nombre: device.nombre,
                    mensaje: `Dispositivo ${device.nombre} desconectado`
                });
            }
        }
      }

    } catch (error) {
      logger.error('Error en checkDeviceHealth:', error);
    }
  }

  /**
   * Obtiene estadísticas del scheduler
   */
  getStats() {
    return {
      isRunning: this.task !== null,
      pendingNotifications: this.lastNotifications.size,
      socketIOConnected: this.io !== null
    };
  }
}

// Exportar instancia única (Singleton)
module.exports = new SchedulerService();
