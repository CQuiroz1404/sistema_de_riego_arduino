const { Invernaderos, Plantas, TipoPlanta, RangoTemperatura, RangoHumedad } = require('../models');

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
}

module.exports = InvernaderoController;
