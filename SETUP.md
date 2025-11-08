# Sistema de Riego Arduino con React + Supabase

Sistema de monitoreo y control de riego automatizado con Arduino, utilizando React para el frontend y Supabase como Backend as a Service (BaaS).

## 🚀 Características

- **Dashboard Principal**: Vista general de todos los invernaderos
- **Gestión de Zonas**: Organización por zonas dentro de cada invernadero
- **Monitoreo de Sensores**: Visualización en tiempo real de datos de sensores
- **Control de Actuadores**: Activación manual de sistemas de riego
- **Histórico de Datos**: Gráficas temporales de lecturas de sensores
- **Gestión de Plantas**: Información sobre plantas y sus requerimientos

## 📋 Requisitos Previos

- Node.js (v16 o superior)
- npm o yarn
- Cuenta en Supabase
- Arduino con conexión a internet

## 🛠️ Instalación

1. Clona el repositorio:
```bash
git clone <url-del-repositorio>
cd sistema_de_riego_arduino
```

2. Instala las dependencias:
```bash
npm install
```

3. Configura las variables de entorno:

Crea un archivo `.env` en la raíz del proyecto con tus credenciales de Supabase:

```env
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key-aqui
```

Puedes encontrar estas credenciales en tu proyecto de Supabase en:
Settings → API → Project URL y anon/public key

## 🗄️ Configuración de Supabase

### Estructura de Base de Datos

El proyecto utiliza las siguientes tablas:

#### `greenhouses`
- `id` (int8, primary key)
- `name` (varchar)
- `location` (varchar)

#### `zone`
- `id` (int8, primary key)
- `name` (varchar)
- `description` (varchar)
- `greenhouseId` (int8, foreign key → greenhouses)

#### `sensors`
- `id` (int8, primary key)
- `zoneId` (int8, foreign key → zone)
- `sensorType` (varchar)
- `model` (varchar)
- `installationDate` (date)

#### `Readings`
- `id` (int8, primary key)
- `sensorId` (int8, foreign key → sensors)
- `value` (float8)
- `dateTime` (timestamptz)

#### `Actuators`
- `id` (int8, primary key)
- `zoneId` (int8, foreign key → zone)
- `name` (varchar)

#### `HistoryIrrigation`
- `id` (int8, primary key)
- `actuatorId` (int8, foreign key → Actuators)
- `dateTimeStart` (timestamptz)
- `dateTimeEnd` (timestamptz)
- `mode` (varchar)

#### `plants`
- `id` (int8, primary key)
- `zoneId` (int8, foreign key → zone)
- `commonName` (varchar)
- `scientificName` (varchar)
- `optimalSoilHumidity` (float8)
- `soilHumidityMin` (float8)
- `optimalAmbientTemp` (float8)

### Configurar Row Level Security (RLS)

Para desarrollo, puedes desactivar temporalmente RLS o crear políticas básicas:

```sql
-- Permitir lectura pública (desarrollo)
CREATE POLICY "Enable read access for all users" ON "public"."greenhouses"
FOR SELECT USING (true);

-- Repetir para cada tabla
```

### Habilitar Realtime

Para actualizaciones en tiempo real, habilita Realtime en las tablas:

1. Ve a Database → Replication
2. Habilita Realtime para las tablas `sensors`, `Actuators`, y `Readings`

## 🎮 Uso

### Modo Desarrollo

```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:5173`

### Compilar para Producción

```bash
npm run build
```

### Vista Previa de la Compilación

```bash
npm run preview
```

## 📁 Estructura del Proyecto

```
src/
├── components/
│   ├── Dashboard.jsx           # Componente principal
│   ├── InvernaderoCard.jsx     # Tarjeta de invernadero
│   ├── ZonaDetalle.jsx         # Modal de detalles de zona
│   ├── SensorDisplay.jsx       # Visualización de sensores
│   ├── ActuadorBoton.jsx       # Control de actuadores
│   ├── HistoricoChart.jsx      # Gráficas históricas
│   └── *.css                   # Estilos de componentes
├── config/
│   └── supabaseClient.js       # Configuración de Supabase
├── App.jsx
├── main.jsx
└── index.css
```

## 🔄 Flujo de Datos

1. **Arduino → Supabase**: Los sensores envían datos a Supabase mediante API REST
2. **Supabase → React**: La aplicación recibe datos en tiempo real mediante Realtime subscriptions
3. **React → Supabase**: Los comandos de actuadores se envían a Supabase
4. **Supabase → Arduino**: Arduino consulta periódicamente los comandos pendientes

## 🤝 Arduino Integration

Para integrar con Arduino, necesitarás:

1. Biblioteca HTTP para Arduino (ESP8266HTTPClient o similar)
2. Credenciales de Supabase (URL y anon key)
3. Código para enviar lecturas:

```cpp
// Ejemplo básico
void sendReading(int sensorId, float value) {
  HTTPClient http;
  http.begin("https://tu-proyecto.supabase.co/rest/v1/Readings");
  http.addHeader("apikey", "tu-anon-key");
  http.addHeader("Content-Type", "application/json");
  
  String payload = "{\"sensorId\":" + String(sensorId) + 
                   ",\"value\":" + String(value) + 
                   ",\"dateTime\":\"" + getCurrentTimestamp() + "\"}";
  
  int httpCode = http.POST(payload);
  http.end();
}
```

## 📊 Características Principales

### Dashboard
- Vista de todos los invernaderos
- Navegación intuitiva por zonas
- Actualización automática de datos

### Sensores
- Visualización en tiempo real
- Histórico de lecturas con gráficas
- Soporte para múltiples tipos de sensores

### Actuadores
- Control manual de riego
- Registro de activaciones
- Estado en tiempo real

### Plantas
- Base de datos de plantas
- Parámetros óptimos de crecimiento
- Asociación a zonas específicas

## 🛡️ Seguridad

Para producción, asegúrate de:

1. Configurar políticas RLS adecuadas en Supabase
2. Usar autenticación de usuarios
3. Validar datos en el backend
4. Proteger las credenciales de Supabase
5. Usar HTTPS para todas las comunicaciones

## 📝 Licencia

Este proyecto está bajo la licencia MIT.

## 👥 Contribución

Las contribuciones son bienvenidas. Por favor:

1. Fork el proyecto
2. Crea una rama para tu característica (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📧 Contacto

Para preguntas o sugerencias, abre un issue en el repositorio.

---

Desarrollado con ❤️ usando React, Vite y Supabase
