/**
 * Script para eliminar la columna ip_address de la tabla logs_sistema
 * 
 * Ejecutar con: node scripts/remove_ip_column.js
 */

const { sequelize } = require('../src/config/baseDatos');

async function removeIpColumn() {
    try {
        console.log('🔄 Conectando a la base de datos...');
        await sequelize.authenticate();
        console.log('✅ Conexión establecida');

        console.log('🔄 Eliminando columna ip_address de logs_sistema...');
        
        // Verificar si la columna existe antes de eliminarla
        const [results] = await sequelize.query(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = DATABASE() 
            AND TABLE_NAME = 'logs_sistema' 
            AND COLUMN_NAME = 'ip_address'
        `);

        if (results.length > 0) {
            // La columna existe, proceder a eliminarla
            await sequelize.query('ALTER TABLE logs_sistema DROP COLUMN ip_address');
            console.log('✅ Columna ip_address eliminada exitosamente');
        } else {
            console.log('ℹ️  La columna ip_address no existe en la tabla logs_sistema');
        }

        console.log('✅ Migración completada');
        process.exit(0);

    } catch (error) {
        console.error('❌ Error durante la migración:', error.message);
        console.error(error);
        process.exit(1);
    }
}

// Ejecutar la migración
removeIpColumn();
