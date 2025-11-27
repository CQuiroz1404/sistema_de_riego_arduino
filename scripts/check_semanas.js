const { Semanas } = require('../src/models');

async function listSemanas() {
  try {
    const semanas = await Semanas.findAll();
    console.log(JSON.stringify(semanas, null, 2));
  } catch (error) {
    console.error(error);
  } finally {
    process.exit();
  }
}

listSemanas();
