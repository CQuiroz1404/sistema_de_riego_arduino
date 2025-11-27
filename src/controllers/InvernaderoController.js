const { Op } = require('sequelize');
const {
  Invernaderos,
  Plantas,
  TipoPlanta,
  RangoTemperatura,
  RangoHumedad,
  Dispositivos,
  Sensores,
  Lecturas
} = require('../models');

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
      
      // Si es una petición API, devolver JSON
      if (req.xhr || req.headers.accept.indexOf('json') > -1) {
        return res.json({ success: true, data: invernaderos });
      }

      res.render('invernaderos/index', { 
        invernaderos: invernaderos.map(i => i.toJSON()),
        user: req.user 
      });
    } catch (error) {
      console.error('Error al listar invernaderos:', error);
      res.status(500).render('error', { message: 'Error al obtener invernaderos' });
    }
  }

  // Mostrar formulario de creación
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
      const { descripcion, planta_id } = req.body;
      
      await Invernaderos.create({
        descripcion,
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
        include: [{
          model: Plantas,
          include: [TipoPlanta, RangoTemperatura, RangoHumedad]
        }]
      });

      if (!invernadero) {
        return res.status(404).render('error', { message: 'Invernadero no encontrado' });
      }

      res.render('invernaderos/show', { 
        invernadero: invernadero.toJSON(),
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
        include: [{
          model: Plantas,
          include: [TipoPlanta, RangoTemperatura, RangoHumedad]
        }]
      });

      if (!invernadero) {
        return res.status(404).render('error', { message: 'Invernadero no encontrado' });
      }

      const dispositivos = await Dispositivos.findAll({
        where: { usuario_id: req.user.id },
        attributes: ['id', 'nombre', 'ubicacion', 'descripcion', 'estado']
      });

      const dispositivosPlain = dispositivos.map(d => (d.toJSON ? d.toJSON() : d));

      const deviceIds = dispositivosPlain.map(device => device.id);

      const sensores = deviceIds.length ? await Sensores.findAll({
        where: {
          dispositivo_id: { [Op.in]: deviceIds }
        }
      }) : [];

      const sensorIds = sensores.map(sensor => sensor.id);

      const lecturas = sensorIds.length ? await Lecturas.findAll({
        where: { sensor_id: { [Op.in]: sensorIds } },
        order: [['fecha_lectura', 'DESC']],
        raw: true
      }) : [];

      const deviceMap = dispositivosPlain.reduce((acc, device) => {
        acc[device.id] = device;
        return acc;
      }, {});

      const lastReadingBySensor = {};
      for (const lectura of lecturas) {
        if (!lastReadingBySensor[lectura.sensor_id]) {
          lastReadingBySensor[lectura.sensor_id] = lectura;
        }
      }

      const sensoresDetallados = sensores.map(sensor => {
        const sensorPlain = sensor.toJSON ? sensor.toJSON() : sensor;
        const ultimaLectura = lastReadingBySensor[sensorPlain.id] || null;
        return {
          ...sensorPlain,
          ultimaLectura: ultimaLectura ? parseFloat(ultimaLectura.valor) : null,
          fechaLectura: ultimaLectura ? ultimaLectura.fecha_lectura : null,
          dispositivo: deviceMap[sensorPlain.dispositivo_id] || null
        };
      });

      const invernaderoJson = invernadero.toJSON();

      res.render('invernaderos/virtual', {
        invernadero: invernaderoJson,
        user: req.user,
        sensores: sensoresDetallados,
        sensoresJson: JSON.stringify(sensoresDetallados),
        dispositivos: dispositivosPlain,
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
      const { descripcion, planta_id } = req.body;

      await Invernaderos.update({
        descripcion,
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

  // API: Obtener datos de entorno (clima + sensores) para simulación 3D
  static async getEnvironment(req, res) {
    try {
      const { id } = req.params;
      const weatherService = require('../services/weatherService');

      const invernadero = await Invernaderos.findByPk(id);
      if (!invernadero) {
        return res.status(404).json({ success: false, message: 'Invernadero no encontrado' });
      }

      // Obtener pronóstico del clima (por defecto Santiago, Chile)
      const lat = process.env.WEATHER_LAT || '-33.4489';
      const lon = process.env.WEATHER_LON || '-70.6693';
      const forecast = await weatherService.getForecast(lat, lon);

      let isRaining = false;
      let rainIntensity = 0;
      let cloudCover = 0;
      let currentTemp = invernadero.temp_actual || 20;

      if (forecast && forecast.list && forecast.list.length > 0) {
        const current = forecast.list[0];
        const weatherId = current.weather[0].id;
        isRaining = weatherId >= 200 && weatherId < 600;
        rainIntensity = current.rain?.['3h'] || 0;
        cloudCover = current.clouds?.all || 0;
      }

      // Determinar si es día o noche basándose en la hora local
      const hour = new Date().getHours();
      const isDaytime = hour >= 6 && hour < 20;

      // Determinar intensidad de calor basándose en temperatura
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
            humidity: invernadero.hum_actual || 50,
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
}

module.exports = InvernaderoController;
