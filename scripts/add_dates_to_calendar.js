const { sequelize } = require('../src/config/baseDatos');

async function addDateColumns() {
  try {
    await sequelize.query("ALTER TABLE calendario ADD COLUMN fecha_inicio DATE NULL AFTER dia_semana;");
    await sequelize.query("ALTER TABLE calendario ADD COLUMN fecha_fin DATE NULL AFTER fecha_inicio;");
    console.log("Columnas fecha_inicio y fecha_fin agregadas exitosamente.");
  } catch (error) {
    console.log("Las columnas probablemente ya existen o hubo un error:", error.message);
  } finally {
    process.exit();
  }
}

addDateColumns();
