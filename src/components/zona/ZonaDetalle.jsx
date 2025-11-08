import { useState, useEffect } from 'react';
import { supabase } from '../../config/supabaseClient';
import SensorDisplay from '../sensors/SensorDisplay';
import ActuadorBoton from '../actuators/ActuadorBoton';
import HistoricoChart from '../charts/HistoricoChart';
import './ZonaDetalle.css';

function ZonaDetalle({ zona, onClose }) {
  const [sensors, setSensors] = useState([]);
  const [actuators, setActuators] = useState([]);
  const [plants, setPlants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('sensores'); // sensores, actuadores, plantas, historico

  useEffect(() => {
    // Prevenir scroll del body cuando el modal está abierto
    document.body.style.overflow = 'hidden';
    
    fetchZoneData();
    
    // Suscripción a cambios en tiempo real
    const sensorsChannel = supabase
      .channel('sensors-channel')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'sensors', filter: `zoneid=eq.${zona.id}` },
        () => fetchSensors()
      )
      .subscribe();

    const actuatorsChannel = supabase
      .channel('actuators-channel')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'Actuators', filter: `zoneid=eq.${zona.id}` },
        () => fetchActuators()
      )
      .subscribe();

    return () => {
      // Restaurar scroll del body al cerrar
      document.body.style.overflow = 'unset';
      supabase.removeChannel(sensorsChannel);
      supabase.removeChannel(actuatorsChannel);
    };
  }, [zona.id]);

  const fetchZoneData = async () => {
    setLoading(true);
    await Promise.all([
      fetchSensors(),
      fetchActuators(),
      fetchPlants()
    ]);
    setLoading(false);
  };

  const fetchSensors = async () => {
    try {
      const { data, error } = await supabase
        .from('sensors')
        .select('*')
        .eq('zoneid', zona.id);

      if (error) throw error;
      setSensors(data || []);
    } catch (error) {
      console.error('Error fetching sensors:', error);
    }
  };

  const fetchActuators = async () => {
    try {
      const { data, error } = await supabase
        .from('Actuators')
        .select('*')
        .eq('zoneid', zona.id);

      if (error) throw error;
      setActuators(data || []);
    } catch (error) {
      console.error('Error fetching actuators:', error);
    }
  };

  const fetchPlants = async () => {
    try {
      const { data, error } = await supabase
        .from('plants')
        .select('*')
        .eq('zoneid', zona.id);

      if (error) throw error;
      setPlants(data || []);
    } catch (error) {
      console.error('Error fetching plants:', error);
    }
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleModalClick = (e) => {
    // Prevenir que los clicks dentro del modal se propaguen al overlay
    e.stopPropagation();
  };

  return (
    <div className="zona-detalle-overlay" onClick={handleOverlayClick}>
      <div className="zona-detalle-modal" onClick={handleModalClick}>
        <div className="modal-header">
          <div>
            <h2>{zona.name}</h2>
            {zona.description && <p className="zona-description">{zona.description}</p>}
          </div>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="tabs">
          <button 
            className={`tab ${activeTab === 'sensores' ? 'active' : ''}`}
            onClick={() => setActiveTab('sensores')}
          >
            📊 Sensores
          </button>
          <button 
            className={`tab ${activeTab === 'actuadores' ? 'active' : ''}`}
            onClick={() => setActiveTab('actuadores')}
          >
            ⚙️ Actuadores
          </button>
          <button 
            className={`tab ${activeTab === 'plantas' ? 'active' : ''}`}
            onClick={() => setActiveTab('plantas')}
          >
            🌱 Plantas
          </button>
          <button 
            className={`tab ${activeTab === 'historico' ? 'active' : ''}`}
            onClick={() => setActiveTab('historico')}
          >
            📈 Histórico
          </button>
        </div>

        <div className="modal-content">
          {loading ? (
            <p className="loading-text">Cargando datos...</p>
          ) : (
            <>
              {activeTab === 'sensores' && (
                <div className="sensors-grid">
                  {sensors.length === 0 ? (
                    <p className="no-data">No hay sensores registrados en esta zona</p>
                  ) : (
                    sensors.map((sensor) => (
                      <SensorDisplay key={sensor.id} sensor={sensor} />
                    ))
                  )}
                </div>
              )}

              {activeTab === 'actuadores' && (
                <div className="actuators-grid">
                  {actuators.length === 0 ? (
                    <p className="no-data">No hay actuadores registrados en esta zona</p>
                  ) : (
                    actuators.map((actuator) => (
                      <ActuadorBoton key={actuator.id} actuator={actuator} />
                    ))
                  )}
                </div>
              )}

              {activeTab === 'plantas' && (
                <div className="plants-list">
                  {plants.length === 0 ? (
                    <p className="no-data">No hay plantas registradas en esta zona</p>
                  ) : (
                    plants.map((plant) => (
                      <div key={plant.id} className="plant-card">
                        <h4>{plant.commonName}</h4>
                        {plant.scientificName && (
                          <p className="scientific-name"><em>{plant.scientificName}</em></p>
                        )}
                        <div className="plant-params">
                          <p>💧 Humedad óptima: {plant.optimalSoilHumidity}%</p>
                          <p>💧 Humedad mínima: {plant.soilHumidityMin}%</p>
                          <p>🌡️ Temperatura ambiente: {plant.optimalAmbientTemp}°C</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeTab === 'historico' && (
                <HistoricoChart zoneId={zona.id} />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default ZonaDetalle;
