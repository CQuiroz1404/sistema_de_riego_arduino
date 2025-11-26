const axios = require('axios');
const logger = require('../config/logger');

class WeatherService {
  constructor() {
    this.apiKey = process.env.OPENWEATHER_API_KEY;
    this.baseUrl = 'https://api.openweathermap.org/data/2.5';
    this.cache = new Map(); // Caché simple para no saturar la API
    this.cacheDuration = 30 * 60 * 1000; // 30 minutos
  }

  /**
   * Obtiene el pronóstico del tiempo para una ubicación
   * @param {string} lat - Latitud
   * @param {string} lon - Longitud
   * @returns {Promise<object>} Datos del clima
   */
  async getForecast(lat, lon) {
    if (!this.apiKey) {
      logger.warn('⚠️ OPENWEATHER_API_KEY no configurada. Se omite verificación del clima.');
      return null;
    }

    const cacheKey = `${lat},${lon}`;
    const cached = this.cache.get(cacheKey);

    if (cached && (Date.now() - cached.timestamp < this.cacheDuration)) {
      return cached.data;
    }

    try {
      const response = await axios.get(`${this.baseUrl}/forecast`, {
        params: {
          lat,
          lon,
          appid: this.apiKey,
          units: 'metric',
          lang: 'es',
          cnt: 4 // Próximos 4 periodos (12 horas aprox)
        }
      });

      const data = response.data;
      this.cache.set(cacheKey, {
        timestamp: Date.now(),
        data
      });

      return data;
    } catch (error) {
      logger.error('Error al consultar API del clima: %s', error.message);
      return null;
    }
  }

  /**
   * Determina si se debe regar basándose en el clima
   * @param {string} lat - Latitud (opcional, por defecto Santiago)
   * @param {string} lon - Longitud (opcional)
   * @returns {Promise<boolean>} true si se puede regar, false si va a llover
   */
  async shouldWater(lat = '-33.4489', lon = '-70.6693') {
    const forecast = await this.getForecast(lat, lon);
    
    if (!forecast) return true; // Si falla la API, regar por defecto (fail-safe)

    // Verificar si va a llover en las próximas 12 horas
    const willRain = forecast.list.some(item => {
      // Códigos de lluvia en OpenWeatherMap: 2xx, 3xx, 5xx
      const weatherId = item.weather[0].id;
      const isRaining = (weatherId >= 200 && weatherId < 600);
      const rainProb = item.pop || 0; // Probabilidad de precipitación (0-1)
      
      return isRaining || rainProb > 0.7;
    });

    if (willRain) {
      logger.info('🌧️ Se detectó lluvia próxima. Se recomienda posponer el riego.');
      return false;
    }

    return true;
  }
}

module.exports = new WeatherService();
