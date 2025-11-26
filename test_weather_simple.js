require('dotenv').config();
const weatherService = require('./src/services/weatherService');
const logger = require('./src/config/logger');

async function testWeather() {
  console.log('🔍 Probando servicio del clima...');
  
  if (!process.env.OPENWEATHER_API_KEY) {
    console.error('❌ Error: OPENWEATHER_API_KEY no está definida en el archivo .env');
    return;
  }

  try {
    // Coordenadas de Santiago por defecto
    const lat = '-33.4489';
    const lon = '-70.6693';
    
    console.log(`📍 Consultando clima para Lat: ${lat}, Lon: ${lon}`);
    const forecast = await weatherService.getForecast(lat, lon);
    
    if (forecast) {
      console.log('✅ Conexión exitosa con OpenWeatherMap');
      console.log(`🌡️ Temperatura actual (aprox): ${forecast.list[0].main.temp}°C`);
      console.log(`☁️ Clima: ${forecast.list[0].weather[0].description}`);
      
      const shouldWater = await weatherService.shouldWater(lat, lon);
      console.log(`🚿 ¿Se recomienda regar? ${shouldWater ? 'SÍ' : 'NO (Lluvia detectada)'}`);
    } else {
      console.log('❌ No se pudo obtener el pronóstico.');
    }
  } catch (error) {
    console.error('❌ Error en la prueba:', error);
  }
}

testWeather();
