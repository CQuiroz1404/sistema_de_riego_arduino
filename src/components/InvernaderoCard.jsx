import { useState, useEffect } from 'react';
import { supabase } from '../config/supabaseClient';
import ZonaDetalle from './ZonaDetalle';
import './InvernaderoCard.css';

function InvernaderoCard({ greenhouse }) {
  const [zones, setZones] = useState([]);
  const [selectedZone, setSelectedZone] = useState(null);
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (expanded) {
      fetchZones();
    }
  }, [expanded, greenhouse.id]);

  const fetchZones = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('zone')
        .select('*')
        .eq('greenhouseId', greenhouse.id)
        .order('name', { ascending: true });

      if (error) throw error;
      setZones(data || []);
    } catch (error) {
      console.error('Error fetching zones:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleZoneClick = (zone) => {
    setSelectedZone(zone);
  };

  return (
    <div className="invernadero-card">
      <div className="invernadero-header" onClick={() => setExpanded(!expanded)}>
        <h3>🏠 {greenhouse.name}</h3>
        <span className="expand-icon">{expanded ? '▼' : '▶'}</span>
      </div>
      
      {greenhouse.location && (
        <p className="invernadero-location">📍 {greenhouse.location}</p>
      )}

      {expanded && (
        <div className="invernadero-content">
          {loading ? (
            <p className="loading-text">Cargando zonas...</p>
          ) : (
            <>
              <h4>Zonas ({zones.length})</h4>
              <div className="zones-list">
                {zones.length === 0 ? (
                  <p className="no-data">No hay zonas registradas</p>
                ) : (
                  zones.map((zone) => (
                    <button
                      key={zone.id}
                      className="zone-btn"
                      onClick={() => handleZoneClick(zone)}
                    >
                      {zone.name}
                    </button>
                  ))
                )}
              </div>
            </>
          )}
        </div>
      )}

      {selectedZone && (
        <ZonaDetalle 
          zona={selectedZone} 
          onClose={() => setSelectedZone(null)} 
        />
      )}
    </div>
  );
}

export default InvernaderoCard;
