const { sequelize } = require('../src/models');

async function migrate() {
  try {
    console.log('🔄 Aplicando migración...');
    
    // Agregar tipo_evento
    try {
      await sequelize.query(`
        ALTER TABLE eventos_riego 
        ADD COLUMN tipo_evento VARCHAR(50) NOT NULL DEFAULT 'riego' 
        COMMENT 'inicio_riego, fin_riego, error, etc' 
        AFTER actuador_id
      `);
      console.log('✅ Columna tipo_evento agregada');
    } catch (e) {
      if (e.message.includes('Duplicate')) {
        console.log('⚠️  Columna tipo_evento ya existe');
      } else {
        throw e;
      }
    }
    
    // Agregar detalle
    try {
      await sequelize.query(`
        ALTER TABLE eventos_riego 
        ADD COLUMN detalle TEXT NULL 
        COMMENT 'Información adicional del evento' 
        AFTER modo
      `);
      console.log('✅ Columna detalle agregada');
    } catch (e) {
      if (e.message.includes('Duplicate')) {
        console.log('⚠️  Columna detalle ya existe');
      } else {
        throw e;
      }
    }
    
    console.log('✅ Migración completada exitosamente');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error en migración:', error.message);
    process.exit(1);
  }
}

migrate();
