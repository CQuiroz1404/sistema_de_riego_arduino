require('dotenv').config();
const { sequelize } = require('../src/config/baseDatos');

async function fixBomba() {
    try {
        console.log('\n🔍 Verificando estado actual de la bomba...\n');
        
        // Consulta directa con Sequelize
        const [results] = await sequelize.query(
            'SELECT id, dispositivo_id, nombre, tipo, pin, activo, estado FROM actuadores WHERE dispositivo_id = 5 AND tipo = "bomba"'
        );
        
        console.log('📊 Estado ANTES del cambio:');
        console.table(results);
        
        console.log('\n🔧 Actualizando campo activo a TRUE (1)...\n');
        
        // UPDATE directo en MySQL
        const [updateResult] = await sequelize.query(
            'UPDATE actuadores SET activo = 1 WHERE dispositivo_id = 5 AND tipo = "bomba"'
        );
        
        console.log(`✅ UPDATE ejecutado correctamente`);
        
        // Verificar el cambio
        const [newResults] = await sequelize.query(
            'SELECT id, dispositivo_id, nombre, tipo, pin, activo, estado FROM actuadores WHERE dispositivo_id = 5 AND tipo = "bomba"'
        );
        
        console.log('\n📊 Estado DESPUÉS del cambio:');
        console.table(newResults);
        
        if (newResults[0] && newResults[0].activo === 1) {
            console.log('\n✅ ¡BOMBA ACTIVADA CORRECTAMENTE!');
            console.log('   La bomba ahora debería ser detectada por el scheduler.');
            console.log('\n🔄 Reinicia el servidor para que detecte el cambio.');
        } else {
            console.log('\n❌ ERROR: La bomba sigue inactiva (activo = ' + newResults[0]?.activo + ')');
            console.log('   Verificando estructura de tabla...');
            
            const [describe] = await sequelize.query('DESCRIBE actuadores');
            console.log('\n📋 Estructura de la tabla actuadores:');
            console.table(describe);
        }
        
        await sequelize.close();
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error('Stack:', error.stack);
        process.exit(1);
    }
}

fixBomba();
