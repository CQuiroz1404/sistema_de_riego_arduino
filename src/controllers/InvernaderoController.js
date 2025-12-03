const { Op } = require('sequelize');
const {
  Invernaderos,
  Plantas,
  TipoPlanta,
  RangoTemperatura,
  RangoHumedad,
  Dispositivos,
  Sensores,
  Lecturas,
  Actuadores
} = require('../models');
const logger = require('../config/logger');


class InvernaderoController {
  // Listar todos los invernaderos
  static async index(req, res) {
    try {
      const invernaderos = await Invernaderos.findAll({
        include: [{
          model: Plantas,
          include: [TipoPlanta, RangoTemperatura, RangoHumedad]
        }]
      });
      
      // Si es una peticiÃ³n API, devolver JSON
      if (req.xhr || req.headers.accept.indexOf('json') > -1) {
        return res.json({ success: true, data: invernaderos });
      }

      res.render('invernaderos/index', { 
        activePage: 'invernaderos',
        invernaderos: invernaderos.map(i => i.toJSON()),
        user: req.user 
      });
    } catch (error) {
      console.error('Error al listar invernaderos:', error);
      res.status(500).render('error', { message: 'Error al obtener invernaderos' });
    }
  }

  // Mostrar formulario de creaciÃ³n
  static async create(req, res) {
    try {
      const plantas = await Plantas.findAll();
      res.render('invernaderos/create', { 
        plantas: plantas.map(p => p.toJSON()),
        user: req.user 
      });
    } catch (error) {
      console.error('Error al mostrar formulario:', error);
      res.status(500).render('error', { message: 'Error interno' });
    }
  }

  // Guardar nuevo invernadero
  static async store(req, res) {
    try {
      const { descripcion, ubicacion, planta_id } = req.body;
      
      await Invernaderos.create({
        descripcion,
        ubicacion: ubicacion || null,
        planta_id: planta_id || null,
        riego: false,
        temp_actual: 0,
        hum_actual: 0
      });

      if (req.xhr || req.headers.accept.indexOf('json') > -1) {
        return res.json({ success: true, message: 'Invernadero creado' });
      }
      
      res.redirect('/invernaderos');
    } catch (error) {
      console.error('Error al crear invernadero:', error);
      res.status(500).json({ success: false, message: 'Error al crear invernadero' });
    }
  }

  // Mostrar detalle
  static async show(req, res) {
    try {
      const { id } = req.params;
      const invernadero = await Invernaderos.findByPk(id, {
        include: [
          {
            model: Plantas,
            include: [TipoPlanta, RangoTemperatura, RangoHumedad]
          },
          {
            model: Dispositivos,
            as: 'dispositivos',

            attributes: ['id', 'nombre', 'ubicacion', 'descripcion', 'estado', 'ultima_conexion'],
            include: [{
              model: Actuadores,
              attributes: ['id', 'nombre', 'tipo', 'estado', 'pin'],
              where: { tipo: 'bomba' },
              required: false
            }]
          }
        ]
      });

      if (!invernadero) {
        return res.status(404).render('error', { message: 'Invernadero no encontrado' });
      }

      const invernaderoJson = invernadero.toJSON();
      
      // Buscar el primer actuador tipo bomba para el botón de riego manual
      let bombaActual = null;
      if (invernaderoJson.dispositivos && invernaderoJson.dispositivos.length > 0) {
        for (const dispositivo of invernaderoJson.dispositivos) {
          if (dispositivo.actuadores && dispositivo.actuadores.length > 0) {
            bombaActual = dispositivo.actuadores[0];
            logger.info(`Bomba encontrada para invernadero ${id}: ID=${bombaActual.id}, Estado=${bombaActual.estado}`);
            break;
          }
        }
      }
      
      if (!bombaActual) {
        logger.warn(`No se encontró bomba para invernadero ${id}. Dispositivos: ${invernaderoJson.dispositivos?.length || 0}`);
      }

      // Calcular promedios de sensores (Temperatura y Humedad Ambiente)
      let totalTemp = 0;
      let countTemp = 0;
      let totalHum = 0;
      let countHum = 0;

      if (invernaderoJson.dispositivos) {
        invernaderoJson.dispositivos.forEach(device => {
          if (device.sensores) {
            device.sensores.forEach(sensor => {
              if (sensor.lecturas && sensor.lecturas.length > 0) {
                const valor = parseFloat(sensor.lecturas[0].valor);
                
                if (sensor.tipo === 'temperatura') {
                  totalTemp += valor;
                  countTemp++;
                } else if (sensor.tipo === 'humedad_ambiente') {
                  totalHum += valor;
                  countHum++;
                }
              }
            });
          }
        });
      }

      // Si hay lecturas, usar el promedio. Si no, mantener el valor de la BD (o 0)
      if (countTemp > 0) {
        invernaderoJson.temp_actual = (totalTemp / countTemp).toFixed(2);
      }
      
      if (countHum > 0) {
        invernaderoJson.hum_actual = (totalHum / countHum).toFixed(2);
      }

      res.render('invernaderos/show', { 
        invernadero: invernaderoJson,
        bombaActual: bombaActual,
        user: req.user 
      });
    } catch (error) {
      console.error('Error al mostrar invernadero:', error);
      res.status(500).render('error', { message: 'Error interno' });
    }
  }

  // Vista virtual 3D con sensores y dispositivos
  static async virtualView(req, res) {
    try {
      const { id } = req.params;
      const invernadero = await Invernaderos.findByPk(id, {
        include: [
          {
            model: Plantas,
            include: [TipoPlanta, RangoTemperatura, RangoHumedad]
          },
          {
            model: Dispositivos,
            as: 'dispositivos',
            attributes: ['id', 'nombre', 'ubicacion', 'descripcion', 'estado']
          }
        ]
      });

      if (!invernadero) {
        return res.status(404).render('error', { message: 'Invernadero no encontrado' });
      }

      const invernaderoJson = invernadero.toJSON();
      const dispositivos = invernaderoJson.dispositivos || [];
      let sensoresDetallados = [];

      if (dispositivos.length > 0) {
        const deviceIds = dispositivos.map(d => d.id);

        // Cargar sensores solo de los dispositivos vinculados
        const sensores = await Sensores.findAll({
          where: { dispositivo_id: { [Op.in]: deviceIds } }
        });

        const sensorIds = sensores.map(sensor => sensor.id);

        const lecturas = sensorIds.length ? await Lecturas.findAll({
          where: { sensor_id: { [Op.in]: sensorIds } },
          order: [['fecha_lectura', 'DESC']],
          raw: true
        }) : [];

        const lastReadingBySensor = {};
        for (const lectura of lecturas) {
          if (!lastReadingBySensor[lectura.sensor_id]) {
            lastReadingBySensor[lectura.sensor_id] = lectura;
          }
        }

        const deviceMap = dispositivos.reduce((acc, device) => {
          acc[device.id] = device;
          return acc;
        }, {});

        sensoresDetallados = sensores.map(sensor => {
          const sensorPlain = sensor.toJSON ? sensor.toJSON() : sensor;
          const ultimaLectura = lastReadingBySensor[sensorPlain.id] || null;
          return {
            ...sensorPlain,
            ultimaLectura: ultimaLectura ? parseFloat(ultimaLectura.valor) : null,
            fechaLectura: ultimaLectura ? ultimaLectura.fecha_lectura : null,
            dispositivo: deviceMap[sensorPlain.dispositivo_id] || null
          };
        });

        // Calcular promedios para la vista inicial
        let totalTemp = 0;
        let countTemp = 0;
        let totalHum = 0;
        let countHum = 0;

        sensores.forEach(sensor => {
            const lectura = lastReadingBySensor[sensor.id];
            if (lectura) {
                const valor = parseFloat(lectura.valor);
                if (sensor.tipo === 'temperatura') {
                    totalTemp += valor;
                    countTemp++;
                } else if (sensor.tipo === 'humedad_ambiente') {
                    totalHum += valor;
                    countHum++;
                }
            }
        });

        if (countTemp > 0) {
            invernaderoJson.temp_actual = (totalTemp / countTemp).toFixed(2);
        }
        if (countHum > 0) {
            invernaderoJson.hum_actual = (totalHum / countHum).toFixed(2);
        }
      }

      res.render('invernaderos/virtual', {
        layout: false,
        title: 'Vista 3D',
        useThreeJS: true,
        invernadero: invernaderoJson,
        user: req.user,
        sensores: sensoresDetallados,
        sensoresJson: JSON.stringify(sensoresDetallados),
        dispositivos: dispositivos,
        invernaderoJson: JSON.stringify(invernaderoJson)
      });
    } catch (error) {
      console.error('Error al cargar vista virtual del invernadero:', error);
      res.status(500).render('error', { message: 'Error al generar vista virtual' });
    }
  }

  // Editar
  static async edit(req, res) {
    try {
      const { id } = req.params;
      const invernadero = await Invernaderos.findByPk(id);
      const plantas = await Plantas.findAll();

      if (!invernadero) {
        return res.status(404).render('error', { message: 'Invernadero no encontrado' });
      }

      res.render('invernaderos/edit', { 
        invernadero: invernadero.toJSON(),
        plantas: plantas.map(p => p.toJSON()),
        user: req.user 
      });
    } catch (error) {
      console.error('Error al editar invernadero:', error);
      res.status(500).render('error', { message: 'Error interno' });
    }
  }

  // Actualizar
  static async update(req, res) {
    try {
      const { id } = req.params;
      const { descripcion, ubicacion, planta_id } = req.body;

      await Invernaderos.update({
        descripcion,
        ubicacion: ubicacion || null,
        planta_id: planta_id || null
      }, { where: { id } });

      if (req.xhr || req.headers.accept.indexOf('json') > -1) {
        return res.json({ success: true, message: 'Invernadero actualizado' });
      }

      res.redirect('/invernaderos');
    } catch (error) {
      console.error('Error al actualizar invernadero:', error);
      res.status(500).json({ success: false, message: 'Error al actualizar' });
    }
  }

  // Eliminar
  static async destroy(req, res) {
    try {
      const { id } = req.params;
      await Invernaderos.destroy({ where: { id } });
      res.json({ success: true, message: 'Invernadero eliminado' });
    } catch (error) {
      console.error('Error al eliminar invernadero:', error);
      res.status(500).json({ success: false, message: 'Error al eliminar' });
    }
  }

  // Activar/Desactivar Riego Manual
  static async toggleRiego(req, res) {
    try {
      const { id } = req.params;
      
      // 1. Buscar el invernadero y sus dispositivos
      const invernadero = await Invernaderos.findByPk(id, {
        include: [{
          model: Dispositivos,
          as: 'dispositivos',
          include: [Actuadores]
        }]
      });

      if (!invernadero) {
        return res.status(404).json({ success: false, message: 'Invernadero no encontrado' });
      }

      // 2. Buscar actuadores de tipo 'bomba' o 'electrovalvula'
      let actuadoresEncontrados = [];
      
      if (invernadero.dispositivos && invernadero.dispositivos.length > 0) {
        invernadero.dispositivos.forEach(device => {
          if (device.actuadores && device.actuadores.length > 0) {
            const bombas = device.actuadores.filter(a => 
              a.tipo === 'bomba' || a.tipo === 'electrovalvula' || a.tipo === 'valvula'
            );
            bombas.forEach(b => actuadoresEncontrados.push({ device, actuator: b }));
          }
        });
      }

      if (actuadoresEncontrados.length === 0) {
        return res.status(400).json({ success: false, message: 'No se encontraron actuadores de riego (bombas/válvulas) en este invernadero' });
      }

      // 3. Enviar comando MQTT para encender/apagar
      let accionRealizada = 'encendido';
      let mensajes = [];

      for (const item of actuadoresEncontrados) {
        const { device, actuator } = item;
        
        // Determinar nuevo estado (inverso al actual)
        const nuevoEstado = actuator.estado === 'encendido' ? 'apagado' : 'encendido';
        accionRealizada = nuevoEstado;

        // Enviar comando MQTT usando el servicio
        await mqttService.controlActuator(
            device.id, 
            actuator.id, 
            nuevoEstado, 
            'manual', 
            req.user ? req.user.id : null
        );
        
        mensajes.push(`${actuator.nombre} ${nuevoEstado}`);
      }

      // Actualizar estado de riego del invernadero
      const algunEncendido = accionRealizada === 'encendido';
      await invernadero.update({ riego: algunEncendido });

      // Log de auditoría
      if (req.user) {
        await LogsSistema.create({
          usuario_id: req.user.id,
          accion: `Riego Manual ${accionRealizada.toUpperCase()}`,
          detalles: `Invernadero ${invernadero.descripcion}: ${mensajes.join(', ')}`,
          ip: req.ip
        });
      }

      res.json({ 
        success: true, 
        message: `Riego ${accionRealizada} correctamente`,
        estado: accionRealizada
      });

    } catch (error) {
      console.error('Error al activar riego manual:', error);
      res.status(500).json({ success: false, message: 'Error interno al procesar la solicitud' });
    }
  }

  // API: Obtener datos de entorno (clima + sensores) para simulaciÃ³n 3D
  static async getEnvironment(req, res) {
    try {
      const { id } = req.params;
      const weatherService = require('../services/weatherService');

      // 1. Buscar invernadero con dispositivos, sensores y Ãºltima lectura
      const invernadero = await Invernaderos.findByPk(id, {
        include: [{
          model: Dispositivos,
          as: 'dispositivos',
          include: [{
            model: Sensores,
            required: false,
            include: [{
              model: Lecturas,
              limit: 1,
              order: [['fecha_lectura', 'DESC']]
            }]
          }]
        }]
      });

      if (!invernadero) {
        return res.status(404).json({ success: false, message: 'Invernadero no encontrado' });
      }

      // 2. Calcular promedios
      let totalTemp = 0;
      let countTemp = 0;
      let totalHum = 0;
      let countHum = 0;

      if (invernadero.dispositivos) {
        invernadero.dispositivos.forEach(device => {
          if (device.sensores) {
            device.sensores.forEach(sensor => {
              if (sensor.lecturas && sensor.lecturas.length > 0) {
                const valor = parseFloat(sensor.lecturas[0].valor);
                
                if (sensor.tipo === 'temperatura') {
                  totalTemp += valor;
                  countTemp++;
                } else if (sensor.tipo === 'humedad_ambiente') {
                  totalHum += valor;
                  countHum++;
                }
              }
            });
          }
        });
      }

      let currentTemp = invernadero.temp_actual || 20;
      let currentHum = invernadero.hum_actual || 50;

      if (countTemp > 0) {
        currentTemp = parseFloat((totalTemp / countTemp).toFixed(2));
      }
      
      if (countHum > 0) {
        currentHum = parseFloat((totalHum / countHum).toFixed(2));
      }

      // Obtener pronÃ³stico del clima (por defecto Santiago, Chile)
      const lat = process.env.WEATHER_LAT || '-33.4489';
      const lon = process.env.WEATHER_LON || '-70.6693';
      const forecast = await weatherService.getForecast(lat, lon);

      let isRaining = false;
      let rainIntensity = 0;
      let cloudCover = 0;

      if (forecast && forecast.list && forecast.list.length > 0) {
        const current = forecast.list[0];
        const weatherId = current.weather[0].id;
        isRaining = weatherId >= 200 && weatherId < 600;
        rainIntensity = current.rain?.['3h'] || 0;
        cloudCover = current.clouds?.all || 0;
      }

      // Determinar si es dÃ­a o noche basÃ¡ndose en la hora local
      const hour = new Date().getHours();
      const isDaytime = hour >= 6 && hour < 20;

      // Determinar intensidad de calor basÃ¡ndose en temperatura
      let heatLevel = 'normal';
      if (currentTemp > 30) heatLevel = 'high';
      else if (currentTemp > 25) heatLevel = 'warm';
      else if (currentTemp < 15) heatLevel = 'cool';

      res.json({
        success: true,
        data: {
          invernaderoId: id,
          weather: {
            isRaining,
            rainIntensity,
            cloudCover,
            isDaytime,
            hour
          },
          sensors: {
            temperature: currentTemp,
            humidity: currentHum,
            heatLevel
          },
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Error al obtener datos de entorno:', error);
      res.status(500).json({ success: false, message: 'Error al consultar entorno' });
    }
  }

  // Obtener actuadores de un invernadero (para riego manual)
  static async getActuators(req, res) {
    try {
      const { id } = req.params;
      
      const invernadero = await Invernaderos.findByPk(id, {
        include: [{
          model: Dispositivos,
          as: 'dispositivos',
          include: [{
            model: Actuadores,
            where: { activo: true },
            required: false
          }]
        }]
      });

      if (!invernadero) {
        return res.status(404).json({ error: 'Invernadero no encontrado' });
      }

      // Extraer todos los actuadores de todos los dispositivos
      const actuadores = [];
      if (invernadero.dispositivos) {
        invernadero.dispositivos.forEach(dispositivo => {
          if (dispositivo.actuadores) {
            actuadores.push(...dispositivo.actuadores);
          }
        });
      }

      return res.json(actuadores);
    } catch (error) {
      logger.error('Error al obtener actuadores del invernadero: %o', error);
      return res.status(500).json({ error: 'Error al obtener actuadores' });
    }
  }
}

module.exports = InvernaderoController;
