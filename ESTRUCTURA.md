# Estructura del Proyecto

## 📁 Organización de Carpetas

```
src/
├── components/          # Componentes React organizados por funcionalidad
│   ├── dashboard/      # Dashboard principal
│   │   ├── Dashboard.jsx
│   │   ├── Dashboard.css
│   │   └── index.js
│   │
│   ├── invernadero/    # Componentes de invernaderos
│   │   ├── InvernaderoCard.jsx
│   │   ├── InvernaderoCard.css
│   │   └── index.js
│   │
│   ├── zona/           # Detalles de zonas
│   │   ├── ZonaDetalle.jsx
│   │   ├── ZonaDetalle.css
│   │   └── index.js
│   │
│   ├── sensors/        # Componentes de sensores
│   │   ├── SensorDisplay.jsx
│   │   ├── SensorDisplay.css
│   │   └── index.js
│   │
│   ├── actuators/      # Componentes de actuadores
│   │   ├── ActuadorBoton.jsx
│   │   ├── ActuadorBoton.css
│   │   └── index.js
│   │
│   ├── charts/         # Gráficos y visualizaciones
│   │   ├── HistoricoChart.jsx
│   │   ├── HistoricoChart.css
│   │   └── index.js
│   │
│   └── common/         # Componentes reutilizables
│       ├── SetupGuide.jsx
│       ├── SetupGuide.css
│       └── index.js
│
├── styles/             # Estilos globales
│   ├── theme.css      # Variables de tema (modo claro/oscuro)
│   ├── index.css      # Estilos base
│   └── App.css        # Estilos del componente principal
│
├── hooks/              # Hooks personalizados
│   └── useTheme.js    # Hook para manejo de tema
│
├── config/             # Configuración
│   └── supabaseClient.js  # Cliente de Supabase
│
├── assets/             # Recursos estáticos
│
├── App.jsx             # Componente raíz
└── main.jsx            # Punto de entrada

```

## 🎯 Convenciones

### Importaciones
Cada carpeta de componentes tiene un `index.js` para facilitar las importaciones:

```javascript
// ❌ Antes
import Dashboard from './components/dashboard/Dashboard';

// ✅ Ahora
import { Dashboard } from './components/dashboard';
```

### Estructura de Componente
Cada componente sigue este patrón:
- `ComponentName.jsx` - Lógica del componente
- `ComponentName.css` - Estilos específicos del componente
- `index.js` - Re-exportación para importaciones limpias

### Rutas Relativas
- Desde `components/`: usar `../../config/`, `../../hooks/`, etc.
- Los estilos globales están en `styles/`
- Los hooks están en `hooks/`
- La configuración está en `config/`

## 🔄 Relaciones entre Componentes

```
App
└── Dashboard
    └── InvernaderoCard
        └── ZonaDetalle (Portal)
            ├── SensorDisplay
            ├── ActuadorBoton
            ├── HistoricoChart
            └── (Lista de plantas)
```

## 🎨 Sistema de Temas

El sistema de temas usa CSS Variables definidas en `styles/theme.css`:
- Modo claro: Fondo gris azulado con gradiente
- Modo oscuro: Fondo negro con gradiente oscuro
- Hook: `useTheme()` para cambiar entre modos
