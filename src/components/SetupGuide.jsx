import './SetupGuide.css';

function SetupGuide() {
  return (
    <div className="setup-guide">
      <div className="setup-card">
        <h2>🚀 Configuración Necesaria</h2>
        <div className="setup-steps">
          <div className="step">
            <div className="step-number">1</div>
            <div className="step-content">
              <h3>Crea un proyecto en Supabase</h3>
              <p>Ve a <a href="https://supabase.com" target="_blank" rel="noopener noreferrer">supabase.com</a> y crea un nuevo proyecto</p>
            </div>
          </div>

          <div className="step">
            <div className="step-number">2</div>
            <div className="step-content">
              <h3>Ejecuta el script SQL</h3>
              <p>En el SQL Editor de Supabase, ejecuta el archivo <code>database_setup.sql</code></p>
            </div>
          </div>

          <div className="step">
            <div className="step-number">3</div>
            <div className="step-content">
              <h3>Configura las variables de entorno</h3>
              <p>Crea un archivo <code>.env</code> en la raíz del proyecto con:</p>
              <pre>
VITE_SUPABASE_URL=tu-url-aqui
VITE_SUPABASE_ANON_KEY=tu-key-aqui
              </pre>
            </div>
          </div>

          <div className="step">
            <div className="step-number">4</div>
            <div className="step-content">
              <h3>Reinicia el servidor de desarrollo</h3>
              <p>Detén el servidor (Ctrl+C) y ejecuta <code>npm run dev</code> nuevamente</p>
            </div>
          </div>
        </div>

        <div className="setup-help">
          <p>📖 Para más información, revisa el archivo <strong>SETUP.md</strong></p>
        </div>
      </div>
    </div>
  );
}

export default SetupGuide;
