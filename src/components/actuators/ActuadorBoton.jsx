import { useState } from 'react';
import { supabase } from '../../config/supabaseClient';
import './ActuadorBoton.css';

function ActuadorBoton({ actuator }) {
  const [loading, setLoading] = useState(false);
  const [localActuator, setLocalActuator] = useState(actuator);

  const handleToggle = async () => {
    try {
      setLoading(true);
      
      // Registrar en el historial
      const { error: historyError } = await supabase
        .from('HistoryIrrigation')
        .insert({
          actuatorid: localActuator.id,
          dateTimeStart: new Date().toISOString(),
          dateTimeEnd: new Date().toISOString(), // Debe tener fecha de fin
          mode: 'manual'
        });

      if (historyError) throw historyError;

      // Aquí deberías enviar una señal al Arduino
      // Por ahora, solo actualizamos el estado local
      setLocalActuator(prev => ({
        ...prev,
        // Puedes agregar un campo de estado si lo tienes en tu tabla
      }));

      alert(`Actuador ${localActuator.name} activado`);
      
    } catch (error) {
      console.error('Error toggling actuator:', error);
      alert('Error al activar el actuador');
    } finally {
      setLoading(false);
    }
  };

  const getActuatorIcon = () => {
    const name = localActuator.name?.toLowerCase() || '';
    if (name.includes('bomba')) return '💧';
    if (name.includes('valvula')) return '🚰';
    if (name.includes('ventilador')) return '🌀';
    if (name.includes('luz')) return '💡';
    return '⚙️';
  };

  return (
    <div className="actuador-card">
      <div className="actuador-header">
        <span className="actuador-icon">{getActuatorIcon()}</span>
        <h4>{localActuator.name}</h4>
      </div>
      
      <button 
        className={`actuador-btn ${loading ? 'loading' : ''}`}
        onClick={handleToggle}
        disabled={loading}
      >
        {loading ? 'Procesando...' : 'Activar'}
      </button>
      
      <div className="actuador-info">
        <p className="actuador-zone">Zona: {localActuator.zoneId}</p>
      </div>
    </div>
  );
}

export default ActuadorBoton;
