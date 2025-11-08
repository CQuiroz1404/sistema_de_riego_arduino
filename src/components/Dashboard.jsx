import { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../config/supabaseClient';
import InvernaderoCard from './InvernaderoCard';
import SetupGuide from './SetupGuide';
import './Dashboard.css';

function Dashboard() {
  const [greenhouses, setGreenhouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Verificar si Supabase está configurado antes de hacer fetch
    if (isSupabaseConfigured()) {
      fetchGreenhouses();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchGreenhouses = async () => {
    try {
      setLoading(true);
      console.log('🔍 Fetching greenhouses from Supabase...');
      console.log('📡 Supabase client:', supabase);
      
      // Intentar sin order primero
      const { data, error, count } = await supabase
        .from('greenhouses')
        .select('*', { count: 'exact' });

      console.log('📊 Supabase response:', { data, error, count });
      console.log('📦 Data type:', typeof data, Array.isArray(data));
      console.log('📏 Data length:', data?.length);

      if (error) {
        console.error('❌ Supabase error:', error);
        console.error('Error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        throw error;
      }
      
      console.log('✅ Greenhouses data:', data);
      
      // Ordenar en el cliente si hay datos
      const sortedData = data && data.length > 0 
        ? [...data].sort((a, b) => (a.name || '').localeCompare(b.name || ''))
        : data || [];
      
      console.log('📋 Sorted data:', sortedData);
      setGreenhouses(sortedData);
    } catch (error) {
      setError(error.message);
      console.error('💥 Error fetching greenhouses:', error);
    } finally {
      setLoading(false);
    }
  };

  // Verificar si Supabase está configurado
  if (!isSupabaseConfigured()) {
    return <SetupGuide />;
  }

  if (loading) {
    return <div className="loading">Cargando invernaderos...</div>;
  }

  if (error) {
    return (
      <div className="dashboard">
        <div className="error">
          <h2>⚠️ Error al cargar datos</h2>
          <p><strong>Mensaje:</strong> {error}</p>
          <div className="error-help">
            <h3>Posibles soluciones:</h3>
            <ol>
              <li>Verifica que las políticas RLS estén configuradas en Supabase</li>
              <li>Ve a tu proyecto en Supabase → Database → Tables → greenhouses</li>
              <li>Haz clic en "Add RLS policy" y crea una política de lectura pública</li>
              <li>O ejecuta en SQL Editor: <br/>
                <code>CREATE POLICY "Enable read access for all users" ON greenhouses FOR SELECT USING (true);</code>
              </li>
            </ol>
            <button onClick={fetchGreenhouses} className="refresh-btn">
              🔄 Reintentar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <h1>Sistema de Riego Arduino</h1>
      <div className="dashboard-header">
        <h2>Invernaderos</h2>
        <button onClick={fetchGreenhouses} className="refresh-btn">
          🔄 Actualizar
        </button>
      </div>
      <div className="greenhouses-grid">
        {greenhouses.length === 0 ? (
          <div className="no-data-message">
            <h3>📦 No hay invernaderos registrados</h3>
            <p><strong>✅ Conexión exitosa a Supabase</strong></p>
            <p>Los datos se cargaron correctamente, pero no hay invernaderos en la base de datos.</p>
            <p>🔍 Verifica en Supabase que la tabla <code>greenhouses</code> tenga datos.</p>
            <details>
              <summary>💡 Ver información técnica</summary>
              <p>Tabla consultada: <code>greenhouses</code></p>
              <p>Datos recibidos: {JSON.stringify(greenhouses)}</p>
              <p>Cantidad: {greenhouses.length}</p>
            </details>
          </div>
        ) : (
          greenhouses.map((greenhouse) => (
            <InvernaderoCard key={greenhouse.id} greenhouse={greenhouse} />
          ))
        )}
      </div>
    </div>
  );
}

export default Dashboard;
