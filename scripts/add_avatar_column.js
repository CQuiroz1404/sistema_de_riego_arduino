const { sequelize } = require('../src/config/baseDatos');

async function addAvatarColumn() {
  try {
    await sequelize.query("ALTER TABLE usuarios ADD COLUMN avatar VARCHAR(255) NULL AFTER email;");
    console.log("Columna avatar agregada exitosamente.");
  } catch (error) {
    console.log("La columna probablemente ya existe o hubo un error:", error.message);
  } finally {
    process.exit();
  }
}

addAvatarColumn();
