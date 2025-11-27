const { Calendario } = require('./src/models');

async function checkCalendar() {
  try {
    const eventos = await Calendario.findAll({
      limit: 5,
      order: [['id', 'DESC']]
    });
    console.log(JSON.stringify(eventos, null, 2));
  } catch (error) {
    console.error(error);
  } finally {
    process.exit();
  }
}

checkCalendar();
