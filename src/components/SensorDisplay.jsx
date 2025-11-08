import { useState, useEffect } from 'react';
import { supabase } from '../config/supabaseClient';
import './SensorDisplay.css';

function SensorDisplay({ sensor }) {
  const [latestReading, setLatestReading] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLatestReading();
    
    // Actualizar cada 30 segundos
    const interval = setInterval(fetchLatestReading, 30000);
    
    return () => clearInterval(interval);
  }, [sensor.id]);

  const fetchLatestReading = async () => {
    try {
      const { data, error } = await supabase
        .from('Readings')
        .select('*')
        .eq('sensorId', sensor.id)
        .order('dateTime', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows
      setLatestReading(data);
    } catch (error) {
      console.error('Error fetching reading:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSensorIcon = (type) => {
    switch (type?.toLowerCase()) {
      case 'humedad': return '💧';
      case 'temperatura': return '🌡️';
      case 'luz': return '☀️';
      case 'ph': return '⚗️';
      default: return '📊';
    }
  };

  const getStatusClass = (value) => {
    if (!value || !sensor.model) return 'normal';
    // Puedes agregar lógica más compleja basada en umbrales
    return 'normal';
  };

  return (
    <div className={`sensor-card ${getStatusClass(latestReading?.value)}`}>
      <div className="sensor-header">
        <span className="sensor-icon">{getSensorIcon(sensor.sensorType)}</span>
        <h4>{sensor.sensorType || 'Sensor'}</h4>
      </div>
      
      <div className="sensor-body">
        {loading ? (
          <p className="loading-text">Cargando...</p>
        ) : latestReading ? (
          <>
            <p className="sensor-value">{latestReading.value?.toFixed(2)}</p>
            <p className="sensor-time">
              {new Date(latestReading.dateTime).toLocaleString('es-ES')}
            </p>
          </>
        ) : (
          <p className="no-data">Sin lecturas</p>
        )}
      </div>
      
      <div className="sensor-footer">
        <span className="sensor-model">{sensor.model || 'Modelo desconocido'}</span>
        {sensor.installationDate && (
          <span className="sensor-install">
            Instalado: {new Date(sensor.installationDate).toLocaleDateString('es-ES')}
          </span>
        )}
      </div>
    </div>
  );
}

export default SensorDisplay;
