const { sequelize } = require('../src/config/baseDatos');

async function getApiKey() {
  try {
    const [devices] = await sequelize.query('SELECT id, nombre, api_key, activo FROM dispositivos');
    
    console.log('\n📱 Dispositivos registrados:\n');
    devices.forEach(device => {
      console.log(`ID: ${device.id}`);
      console.log(`Nombre: ${device.nombre}`);
      console.log(`API_KEY: ${device.api_key}`);
      console.log(`Activo: ${device.activo ? '✅' : '❌'}`);
      console.log('---');
    });
    
    if (devices.length > 0) {
      console.log('\n📝 Copia este API_KEY a tu config.h del Arduino:');
      console.log(`\nconst char* API_KEY = "${devices[0].api_key}";\n`);
    } else {
      console.log('\n⚠️  No hay dispositivos registrados en la base de datos');
    }
    
    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

getApiKey();
