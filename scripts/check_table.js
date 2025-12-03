const { sequelize } = require('../src/config/baseDatos');

async function checkTable() {
  try {
    const [columns] = await sequelize.query('DESCRIBE calendario');
    console.log('\n📋 Columnas de tabla calendario:\n');
    columns.forEach(col => {
      console.log(`- ${col.Field.padEnd(25)} | ${col.Type.padEnd(15)} | Default: ${col.Default || 'NULL'}`);
    });
    
    const duracionCol = columns.find(c => c.Field === 'duracion_minutos');
    if (duracionCol) {
      console.log('\n✅ Columna duracion_minutos EXISTE');
    } else {
      console.log('\n❌ Columna duracion_minutos NO EXISTE');
    }
    
    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkTable();
