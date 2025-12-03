/**
 * Script para ejecutar migración de base de datos
 * Uso: node scripts/run_migration.js
 */

const fs = require('fs');
const path = require('path');

async function runMigration() {
  try {
    // Cargar configuración de base de datos (usa Sequelize)
    const { sequelize } = require('../src/config/baseDatos');
    
    // Leer archivo SQL
    const sqlFilePath = path.join(__dirname, '..', 'database', 'migrations', 'add_duracion_calendario.sql');
    const sql = fs.readFileSync(sqlFilePath, 'utf8');
    
    console.log('🚀 Ejecutando migración...\n');
    
    // Dividir en statements individuales (por punto y coma)
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));
    
    // Ejecutar cada statement
    for (const statement of statements) {
      if (statement.toLowerCase().includes('use sistema_riego')) {
        console.log('✓ Usando base de datos sistema_riego');
        await sequelize.query(statement);
        continue;
      }
      
      if (statement.toLowerCase().includes('alter table')) {
        console.log('✓ Alterando tabla calendario...');
        try {
          await sequelize.query(statement);
          console.log('  ✅ Columna duracion_minutos agregada');
        } catch (err) {
          if (err.parent && err.parent.code === 'ER_DUP_FIELDNAME') {
            console.log('  ⚠️  La columna ya existe (OK)');
          } else {
            throw err;
          }
        }
        continue;
      }
      
      if (statement.toLowerCase().includes('update calendario')) {
        console.log('✓ Actualizando registros existentes...');
        const [, metadata] = await sequelize.query(statement);
        console.log(`  ✅ ${metadata.affectedRows || 0} registros actualizados`);
        continue;
      }
      
      if (statement.toLowerCase().includes('select')) {
        const [rows] = await sequelize.query(statement);
        if (rows && rows[0]) {
          console.log('\n' + rows[0].resultado);
        }
      }
    }
    
    // Verificar que la columna existe
    console.log('\n🔍 Verificando estructura de tabla...');
    const [columns] = await sequelize.query('DESCRIBE calendario');
    const duracionColumn = columns.find(col => col.Field === 'duracion_minutos');
    
    if (duracionColumn) {
      console.log('✅ Columna duracion_minutos confirmada:');
      console.log(`   - Tipo: ${duracionColumn.Type}`);
      console.log(`   - Default: ${duracionColumn.Default}`);
      console.log(`   - Null: ${duracionColumn.Null}`);
    } else {
      console.error('❌ Error: Columna duracion_minutos no encontrada');
      process.exit(1);
    }
    
    console.log('\n✅ MIGRACIÓN COMPLETADA EXITOSAMENTE\n');
    
    await sequelize.close();
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ ERROR EN MIGRACIÓN:');
    console.error(error.message);
    console.error('\nDetalles:', error);
    process.exit(1);
  }
}

// Ejecutar migración
runMigration();
