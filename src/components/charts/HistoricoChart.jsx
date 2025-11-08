import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../config/supabaseClient';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import './HistoricoChart.css';

function HistoricoChart({ zoneId }) {
  const [historicData, setHistoricData] = useState([]);
  const [sensors, setSensors] = useState([]);
  const [selectedSensor, setSelectedSensor] = useState(null);
  const [dateRange, setDateRange] = useState('24h'); // 24h, 7d, 30d
  const [loading, setLoading] = useState(true);

  const fetchSensors = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('sensors')
        .select('*')
        .eq('zoneid', zoneId);

      if (error) throw error;
      setSensors(data || []);
      if (data && data.length > 0) {
        setSelectedSensor(data[0].id);
      }
    } catch (error) {
      console.error('Error fetching sensors:', error);
    }
  }, [zoneId]);

  const fetchHistoricData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Calcular fecha de inicio según el rango
      const now = new Date();
      const startDate = new Date();
      switch (dateRange) {
        case '24h':
          startDate.setHours(now.getHours() - 24);
          break;
        case '7d':
          startDate.setDate(now.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(now.getDate() - 30);
          break;
      }

      const { data, error } = await supabase
        .from('Readings')
        .select('*')
        .eq('sensorid', selectedSensor)
        .gte('dateTime', startDate.toISOString())
        .order('dateTime', { ascending: true });

      if (error) throw error;

      // Formatear datos para el gráfico
      const formattedData = (data || []).map(reading => ({
        time: new Date(reading.dateTime).toLocaleString('es-ES', {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }),
        valor: reading.value
      }));

      setHistoricData(formattedData);
    } catch (error) {
      console.error('Error fetching historic data:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedSensor, dateRange]);

  useEffect(() => {
    fetchSensors();
  }, [fetchSensors]);

  useEffect(() => {
    if (selectedSensor) {
      fetchHistoricData();
    }
  }, [selectedSensor, fetchHistoricData]);

  const selectedSensorData = sensors.find(s => s.id === selectedSensor);

  return (
    <div className="historico-chart">
      <div className="chart-controls">
        <div className="control-group">
          <label>Sensor:</label>
          <select 
            value={selectedSensor || ''} 
            onChange={(e) => setSelectedSensor(parseInt(e.target.value))}
          >
            {sensors.map(sensor => (
              <option key={sensor.id} value={sensor.id}>
                {sensor.sensorType} - {sensor.model}
              </option>
            ))}
          </select>
        </div>

        <div className="control-group">
          <label>Rango:</label>
          <div className="range-buttons">
            <button 
              className={dateRange === '24h' ? 'active' : ''}
              onClick={() => setDateRange('24h')}
            >
              24h
            </button>
            <button 
              className={dateRange === '7d' ? 'active' : ''}
              onClick={() => setDateRange('7d')}
            >
              7d
            </button>
            <button 
              className={dateRange === '30d' ? 'active' : ''}
              onClick={() => setDateRange('30d')}
            >
              30d
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <p className="loading-text">Cargando datos históricos...</p>
      ) : historicData.length === 0 ? (
        <p className="no-data">No hay datos históricos para este sensor</p>
      ) : (
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={historicData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="time" 
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis 
              label={{ 
                value: selectedSensorData?.sensorType || 'Valor', 
                angle: -90, 
                position: 'insideLeft' 
              }}
            />
            <Tooltip />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="valor" 
              stroke="#8884d8" 
              name={selectedSensorData?.sensorType || 'Valor'}
              strokeWidth={2}
              dot={{ r: 3 }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

export default HistoricoChart;
