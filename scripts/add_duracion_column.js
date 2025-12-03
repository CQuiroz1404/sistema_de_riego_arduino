const { sequelize } = require('../src/config/baseDatos');

async function addColumn() {
  try {
    console.log('🚀 Agregando columna duracion_minutos...');
    
    await sequelize.query(
      'ALTER TABLE calendario ADD COLUMN duracion_minutos INT DEFAULT 10 COMMENT "Duracion del riego en minutos"'
    );
    
    console.log('✅ Columna agregada exitosamente');
    
    // Verificar
    const [columns] = await sequelize.query('DESCRIBE calendario');
    const col = columns.find(c => c.Field === 'duracion_minutos');
    
    if (col) {
      console.log('\n✅ Verificación exitosa:');
      console.log(`   - Campo: ${col.Field}`);
      console.log(`   - Tipo: ${col.Type}`);
      console.log(`   - Default: ${col.Default}`);
    }
    
    await sequelize.close();
    process.exit(0);
    
  } catch (error) {
    if (error.parent && error.parent.code === 'ER_DUP_FIELDNAME') {
      console.log('⚠️  La columna duracion_minutos ya existe (OK)');
      await sequelize.close();
      process.exit(0);
    } else {
      console.error('❌ Error:', error.message);
      await sequelize.close();
      process.exit(1);
    }
  }
}

addColumn();
