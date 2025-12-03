const { Plantas, TipoPlanta, RangoTemperatura, RangoHumedad, Invernaderos, Calendario, Semanas, Acciones } = require('../models');

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

  // Mostrar formulario de programaciÃ³n de riego
  static async schedule(req, res) {
    try {
      const { id } = req.params;
      const planta = await Plantas.findByPk(id);
      const semanas = await Semanas.findAll();
      
      if (!planta) {
        return res.status(404).render('error', { message: 'Planta no encontrada' });
      }

      res.render('plantas/schedule', { 
        layout: false,
        planta: planta.toJSON(),
        semanas: semanas.map(s => s.toJSON()),
        user: req.user 
      });
    } catch (error) {
      console.error('Error al cargar formulario de riego:', error);
      res.status(500).render('error', { message: 'Error interno' });
    }
  }

  // Guardar programaciÃ³n y actualizar calendario automÃ¡ticamente
  static async saveSchedule(req, res) {
    try {
      const { id } = req.params;
      const { dias_semana, hora_inicio, duracion_minutos, semana_id, fecha_inicio, fecha_fin } = req.body;

      // Validar que se haya seleccionado al menos un dÃ­a
      if (!dias_semana || (Array.isArray(dias_semana) && dias_semana.length === 0)) {
          return res.status(400).render('error', { message: 'Debe seleccionar al menos un dÃ­a de la semana.' });
      }

      // Asegurar que dias_semana sea un array (si viene uno solo es string)
      const dias = Array.isArray(dias_semana) ? dias_semana : [dias_semana];

      // 1. Buscar la planta
      const planta = await Plantas.findByPk(id);
      if (!planta) {
        return res.status(404).send('Planta no encontrada');
      }

      // 2. Buscar invernadero asociado a esta planta
      // El requisito dice "actualiza automaticamente el calendario"
      const invernadero = await Invernaderos.findOne({ where: { planta_id: id } });
      
      if (!invernadero) {
        return res.status(400).render('error', { 
            message: 'No hay invernadero asociado a esta planta. Asigne la planta a un invernadero primero para programar el riego.' 
        });
      }

      // 3. Buscar o crear la acciÃ³n de "Riego"
      // Corregido: El modelo Acciones usa 'nombre', no 'descripcion'
      let accion = await Acciones.findOne({ where: { nombre: 'Riego' } });
      if (!accion) {
          accion = await Acciones.create({ nombre: 'Riego' });
      }

      // Calcular hora_final basado en hora_inicio + duracion_minutos
      const [hours, minutes] = hora_inicio.split(':').map(Number);
      const date = new Date();
      date.setHours(hours, minutes + parseInt(duracion_minutos), 0);
      const hora_final = date.toTimeString().slice(0, 5);

      // 4. Crear entradas en Calendario para cada dÃ­a seleccionado
      const promesas = dias.map(dia => {
          return Calendario.create({
            invernadero_id: invernadero.id,
            semana_id: semana_id,
            dia_semana: dia,
            fecha_inicio: fecha_inicio || null,
            fecha_fin: fecha_fin || null,
            hora_inicial: hora_inicio,
            hora_final: hora_final,
            usuario_id: req.user ? req.user.id : null
          });
      });

      await Promise.all(promesas);

      // Redirigir al calendario para confirmar visualmente
      res.redirect(`/invernaderos/${invernadero.id}/schedule`);

    } catch (error) {
      console.error('Error al guardar programaciÃ³n:', error);
      res.status(500).render('error', { message: 'Error al guardar programaciÃ³n' });
    }
  }
}

module.exports = PlantaController;
