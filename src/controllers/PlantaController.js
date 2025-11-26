const { Plantas, TipoPlanta, RangoTemperatura, RangoHumedad } = require('../models');

class PlantaController {
  static async index(req, res) {
    try {
      const plantas = await Plantas.findAll({
        include: [TipoPlanta, RangoTemperatura, RangoHumedad]
      });
      
      res.render('plantas/index', { 
        plantas: plantas.map(p => p.toJSON()),
        user: req.user 
      });
    } catch (error) {
      console.error('Error al listar plantas:', error);
      res.status(500).render('error', { message: 'Error al obtener plantas' });
    }
  }

  static async create(req, res) {
    try {
      const tipos = await TipoPlanta.findAll();
      const rangosTemp = await RangoTemperatura.findAll();
      const rangosHum = await RangoHumedad.findAll();

      res.render('plantas/create', { 
        tipos: tipos.map(t => t.toJSON()),
        rangosTemp: rangosTemp.map(r => r.toJSON()),
        rangosHum: rangosHum.map(r => r.toJSON()),
        user: req.user 
      });
    } catch (error) {
      console.error('Error al mostrar formulario:', error);
      res.status(500).render('error', { message: 'Error interno' });
    }
  }

  static async store(req, res) {
    try {
      const { nombre, tipo_planta_id, rango_temperatura_id, rango_humedad_id } = req.body;
      
      await Plantas.create({
        nombre,
        tipo_planta_id,
        rango_temperatura_id,
        rango_humedad_id
      });

      res.redirect('/plantas');
    } catch (error) {
      console.error('Error al crear planta:', error);
      res.status(500).render('error', { message: 'Error al crear planta' });
    }
  }
}

module.exports = PlantaController;
