const { sequelize } = require('../src/config/baseDatos');

async function addColumn() {
  try {
    await sequelize.query("ALTER TABLE calendario ADD COLUMN dia_semana VARCHAR(20) AFTER semana_id;");
    console.log("Columna dia_semana agregada exitosamente.");
  } catch (error) {
    console.log("La columna probablemente ya existe o hubo un error:", error.message);
  } finally {
    process.exit();
  }
}

addColumn();