require('dotenv').config();
const { sequelize } = require('../src/config/baseDatos');

async function limpiarEventos() {
    try {
        console.log('\n🧹 Limpiando eventos con hora_inicial NULL...\n');
        
        // Eliminar eventos con hora_inicial NULL
        const [result] = await sequelize.query(
            'DELETE FROM calendario WHERE hora_inicial IS NULL'
        );
        
        console.log(`✅ ${result.affectedRows} evento(s) eliminado(s)`);
        
        // Mostrar eventos restantes
        const [eventos] = await sequelize.query(
            'SELECT id, dia_semana, hora_inicial, hora_final, duracion_minutos FROM calendario WHERE estado = true ORDER BY id DESC LIMIT 5'
        );
        
        console.log('\n📋 Últimos 5 eventos activos:');
        console.table(eventos);
        
        await sequelize.close();
        process.exit(0);
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

limpiarEventos();
