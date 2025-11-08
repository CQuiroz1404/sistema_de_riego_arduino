import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '../../config/supabaseClient';
import ZonaDetalle from '../zona/ZonaDetalle';
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
        .eq('greenhouseid', greenhouse.id)
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

  const toggleExpand = (e) => {
    e.stopPropagation(); // Prevenir propagación del evento
    setExpanded(!expanded);
  };

  return (
    <div className={`invernadero-card ${expanded ? 'expanded' : ''}`} data-greenhouse-id={greenhouse.id}>
      <div className="invernadero-header" onClick={toggleExpand}>
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

      {selectedZone && createPortal(
        <ZonaDetalle 
          zona={selectedZone} 
          onClose={() => setSelectedZone(null)} 
        />,
        document.body
      )}
    </div>
  );
}

export default InvernaderoCard;
