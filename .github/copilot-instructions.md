# Sistema de Riego Arduino IoT - AI Agent Instructions

## Project Overview
Node.js/Express IoT irrigation system with Arduino devices communicating via MQTT. Full-stack MVC with MySQL (Sequelize ORM), Handlebars views, Tailwind CSS, JWT auth, and real-time WebSocket updates. Arduino firmware publishes sensor data and subscribes to actuator commands through EMQX broker.

## Critical Architecture Patterns

### MQTT Communication (Core IoT Layer)
- **Topics Pattern**: `riego/{API_KEY}/{type}` where type = `sensores|comandos|comandos/all|eventos|ping`
- Arduino publishes sensor data every 10s to `/sensores`, server subscribes via `src/services/mqttService.js`
- Commands flow: User → Express → MQTT publish → Arduino callback (< 100ms latency)
- QoS 1 guaranteed delivery. Server maintains device cache by API_KEY
- Auto-provisioning: Devices register via API_KEY lookup in `dispositivos` table

### Authentication Flow
- **JWT in HTTP-only cookies** - Token stored client-side, verified in `src/middleware/auth.js`
- Three auth types: `verifyToken` (users), `verifyAdmin` (role check), `verifyApiKey` (Arduino devices)
- Global middleware in `server.js` refreshes user data from DB on every request (includes avatar updates)
- Rate limiting on `/auth/*` routes: 5 attempts per 15min (authLimiter), 100 req/15min on `/api/*`

### Database Schema (MySQL via Sequelize)
- 15+ models in `src/models/`, relationships defined in `src/models/index.js`
- Key chains: `usuarios → dispositivos → sensores → lecturas` and `dispositivos → actuadores`
- Cascade deletes configured (e.g., device deletion removes sensors/actuators/readings)
- Connection pooling: max 5 concurrent, acquire timeout 30s, idle 10s
- **NO auto-sync in production**: Schema managed via `database/initDB.sql`, Sequelize for ORM only

### View Layer (Handlebars + Tailwind)
- Layout system: `src/views/layouts/main.hbs` wraps all pages (auto-applied)
- Reusable partials: `card`, `button`, `form-field`, `alert` in `src/views/partials/`
- Conditional library loading: Pass `useSocketIO`, `useThreeJS`, `useFullCalendar` to `res.render()`
- **Mobile-first Tailwind**: Precompile CSS via `npm run build:css` before deploy
- Client validation: Add `data-validate="true"` to forms, loads `public/js/components/validation.js`

## Development Workflow

### Environment Setup
```bash
# 1. Install dependencies
npm install

# 2. Configure DB - Run ONCE to create schema + seed data
mysql -u root -p < database/initDB.sql

# 3. Copy and edit environment variables
Copy-Item .env.example .env  # Edit DB credentials, JWT_SECRET

# 4. Compile Tailwind CSS (required before first run)
npm run build:css

# 5. Start development server (auto-reload enabled)
npm run dev
```

### Key Commands
- `npm run dev`: nodemon server with live reload
- `npm run build:css`: Compile Tailwind (run after changing classes)
- `npm run dev:css`: Watch mode for Tailwind during development
- `npm test`: Run Jest test suite (integration + unit)
- `npm run test:watch`: Jest in watch mode

### Testing Patterns
- Integration tests in `tests/integration/` use supertest + real DB
- Mock cleanup: Always call `closePool()` and `closeSequelize()` in `afterAll()`
- Use unique emails: `email: \`test${Date.now()}@test.com\`` to avoid collisions
- Test both HTML (302 redirects) and JSON responses (`req.xhr` detection)

## Code Conventions

### Controller Response Pattern
```javascript
// Dual response: HTML for browsers, JSON for AJAX
if (req.xhr || req.headers.accept.indexOf('json') > -1) {
  return res.status(200).json({ success: true, data });
}
res.render('view', { data, user: req.user });
```

### Error Handling
- Use Winston logger: `logger.error('Message: %o', error)` (never `console.log`)
- Global error middleware in `server.js` - returns HTML or JSON based on request type
- Sequelize errors: Catch in try/catch, log, return user-friendly messages
- MQTT errors: Service continues if MQTT fails (graceful degradation)

### Model Querying
```javascript
// Always include necessary associations
const device = await Dispositivos.findByPk(id, {
  include: [
    { model: Sensores, where: { activo: true } },
    { model: Actuadores }
  ]
});

// Use raw queries for complex aggregations (e.g., sensor stats in DashboardController)
const pool = require('../config/baseDatos').pool;
const [rows] = await pool.query('SELECT ...');
```

### MQTT Service Integration
- Import: `const mqttService = require('../services/mqttService')`
- Publish commands: `mqttService.publishCommand(apiKey, { actuador_id, estado })`
- Check connection: `mqttService.isConnected()` before publishing
- Service auto-reconnects on failure, caches devices for 5min

## File Locations & Naming

### When Creating Controllers
- Place in `src/controllers/`, PascalCase + "Controller" suffix (e.g., `SensorController.js`)
- Export multiple methods: `module.exports = { index, show, create, update, destroy }`
- Always include error logging and dual response (HTML/JSON)

### When Adding Routes
- Create in `src/routes/`, kebab-case filename (e.g., `schedule.js`)
- Use express.Router(), apply middleware: `router.use(verifyToken)`
- Register in `server.js` with `app.use('/path', routes)`

### When Adding Views
- Structure: `src/views/{resource}/{action}.hbs` (e.g., `devices/create.hbs`)
- Use layout system - NO `<!DOCTYPE>` declarations in views
- Import components: `{{> card title="..." content="..."}}`

### Arduino Firmware
- Main sketch: `arduino/sistema_riego_mqtt.ino` (production)
- Config template: `arduino/config.example.h` (NEVER commit actual `config.h`)
- WiFi + MQTT setup required: Uses WiFiS3 + PubSubClient libraries

## Common Tasks

### Adding a New Sensor Type
1. Update `sensores.tipo` ENUM in `database/initDB.sql`
2. Handle in `mqttService.js` → `handleSensorData()`
3. Add validation in `SensorController.js` → `create()`
4. Update form options in `devices/create.hbs`

### Creating Scheduled Tasks
- Use `node-cron` in `src/services/schedulerService.js`
- Start scheduler in `server.js` after DB connection
- Stop gracefully in `SIGINT`/`SIGTERM` handlers

### Adding API Endpoints
- Document with JSDoc + Swagger annotations in route files
- Access docs at `/api-docs` after starting server
- Arduino endpoints MUST use `verifyApiKey` middleware

### Working with Real-Time Updates
- Socket.IO instance passed to services via `setSocketIo(io)`
- Emit from anywhere: `io.emit('sensor:update', data)`
- Client connects automatically via layout script

## Troubleshooting

### "Cannot connect to MySQL"
- Check `.env` credentials match MySQL user/password
- Verify MySQL service running: `Get-Service mysql*`
- Test connection: `node -e "require('./src/config/baseDatos').testConnection()"`

### "MQTT not connected" warnings
- Server continues working (HTTP endpoints unaffected)
- Check broker URL in `.env` (public default: `mqtt://broker.emqx.io:1883`)
- For local broker: Install Mosquitto or EMQX, update URL to `mqtt://localhost:1883`

### Tailwind classes not applied
- Run `npm run build:css` to compile
- Check `public/css/tailwind.css` exists and is recent
- Clear browser cache (Ctrl+F5)

### Tests failing with DB errors
- Ensure test database permissions: `GRANT ALL ON sistema_riego.* TO 'root'@'localhost'`
- Run `database/initDB.sql` to reset schema
- Check no conflicting test data from previous runs

## Security Notes

- **Never commit**: `.env`, `arduino/config.h`, `node_modules/`, `logs/`, `public/uploads/avatars/`
- API Keys auto-generated as UUIDs on device creation
- Passwords hashed with bcrypt (cost factor 10)
- JWT expiry: 24h default (configurable via `JWT_EXPIRES_IN`)
- File uploads: Multer limits to 5MB, validates image MIME types

## External Dependencies

- **OpenWeather API**: Optional, for climate data in `weatherService.js` (requires `OPENWEATHER_API_KEY`)
- **Brevo Email**: Optional, for notifications in `emailService.js` (requires Brevo API key)
- **MQTT Broker**: Required for Arduino communication (defaults to public EMQX broker)

## Documentation

Extensive docs in `docs/` - refer users to:
- `docs/QUICKSTART_MQTT.md` - MQTT setup guide
- `docs/COMPONENTS_GUIDE.md` - View component usage
- `docs/ARCHITECTURE_MQTT.md` - System architecture diagrams
- `docs/troubleshooting/` - Common error solutions

---

## 🔧 Estado de Funcionalidades Implementadas vs. Pendientes

### 🎯 **NUEVA FUNCIONALIDAD: AUTO-SINCRONIZACIÓN (v2.0)**

#### **Sistema de Configuración Automática**
- **Estado**: ✅ **IMPLEMENTADO Y FUNCIONAL**
- **Archivo**: `arduino/sistema_riego_mqtt_autosync.ino`
- **Documentación**: `docs/AUTO_SYNC.md`

**Características:**
- ✅ Arduino solo necesita API_KEY y WiFi (sin IDs manuales)
- ✅ Endpoint `/api/arduino/sync` devuelve mapeo completo de sensores/actuadores
- ✅ Umbrales se actualizan desde web sin re-flashear
- ✅ Re-sincronización automática cada 5 minutos
- ✅ Auto-provisioning mejorado (crea sensores si no existen)
- ✅ Sin duplicados en base de datos (usa pin+tipo como clave única)
- ✅ Confirmación visual en LCD y Serial Monitor

**Flujo de sincronización:**
```
1. Arduino conecta → GET /api/arduino/sync + API_KEY
2. Servidor busca dispositivo y sus sensores/actuadores
3. Si sensores no existen → Auto-provisioning los crea
4. Respuesta JSON con mapeo: {"D2_temperatura": {"sensor_id": 123}, ...}
5. Arduino guarda IDs en memoria: sensor_temp_id = 123
6. Envío de datos incluye IDs: {"sensor_id": 123, "valor": 24}
7. Servidor guarda lectura sin crear duplicados
8. Re-sincronización cada 5 min actualiza umbrales desde web
```

**Ventajas para usuarios:**
- Configuración inicial: 5 minutos (vs. 30 minutos antes)
- Cambio de umbrales: Desde web (vs. re-flashear código)
- Sin errores de IDs incorrectos o duplicados
- Experiencia no-técnica (solo copiar API_KEY)

---

### ✅ **FUNCIONALIDADES IMPLEMENTADAS Y FUNCIONANDO**

#### 1. **Riego Manual desde Web → Arduino**
- **Estado**: ✅ **FUNCIONA COMPLETAMENTE**
- **Flujo implementado**:
  1. Usuario hace clic en botón "Encender/Apagar Bomba" en `devices/show.hbs`
  2. `devices.js` llama a `/api/arduino/control` con `actuator_id` y `accion`
  3. `ArduinoController.controlActuator()` verifica permisos y llama `mqttService.controlActuator()`
  4. `mqttService.controlActuator()` (línea 442-503):
     - Actualiza estado en tabla `actuadores` de MySQL
     - Registra evento en `eventos_riego`
     - Publica comando MQTT a tópico `riego/{API_KEY}/comandos` con payload:
       ```json
       {
         "actuador_id": 1,
         "pin": "7",
         "estado": 1,  // 1 = encender, 0 = apagar
         "timestamp": 1701634800000
       }
       ```
  5. Arduino recibe en `callbackMQTT()` (línea 683-730 del sketch):
     - Parsea JSON con ArduinoJson
     - Verifica `doc["pin"]` coincide con `PIN_RELAY` (pin 7)
     - Activa `modoRemoto = true` (desactiva control automático)
     - Ejecuta `encenderBomba()` o `apagarBomba()` según `estado`
     - Aplica cambio con `digitalWrite(PIN_RELAY, HIGH/LOW)`
- **Archivo clave**: `src/services/mqttService.js:442` (método `controlActuator`)

#### 2. **Monitoreo de Sensores Arduino → Web**
- **Estado**: ✅ **FUNCIONA COMPLETAMENTE**
- **Flujo**:
  1. Arduino lee sensores cada 5s (DHT11, nivel agua)
  2. Publica JSON a `riego/{API_KEY}/sensores`:
     ```json
     {
       "sensores": [
         {"pin": "D2", "tipo": "temperatura", "valor": 23.5},
         {"pin": "D2", "tipo": "humedad_ambiente", "valor": 65.0},
         {"pin": "A2", "tipo": "nivel_agua", "valor": 80}
       ]
     }
     ```
  3. `mqttService.processSensorData()` recibe y procesa:
     - Auto-provisioning: Crea sensores en BD si no existen (línea 177-197)
     - Guarda lectura en tabla `lecturas`
     - Emite evento Socket.IO `sensor:update` para dashboard en tiempo real
  4. Frontend actualiza gráficos/valores sin recargar página

#### 3. **Control Automático en Arduino**
- **Estado**: ✅ **FUNCIONA (Solo en Arduino, no controlado por Web)**
- **Implementación actual**:
  - Arduino ejecuta `controlAutomatico()` cada 5 segundos
  - Lógica en sketch (línea 213-242):
    ```cpp
    if (humedad < 55% && hay_agua) → encender_bomba
    if (humedad > 70% || sin_agua) → apagar_bomba
    ```
  - **IMPORTANTE**: Este control es local en Arduino, NO recibe instrucciones de calendario web
- **Limitación**: Web no puede modificar umbrales de humedad del Arduino remotamente

#### 4. **Modo Remoto vs. Automático**
- **Estado**: ✅ **PARCIALMENTE IMPLEMENTADO**
- **En Arduino**: Variable `modoRemoto` (bool)
  - `false` = Control automático activo (evalúa humedad)
  - `true` = Control remoto (espera comandos MQTT, ignora sensores)
- **Cambio de modo**:
  - Desde web: Al enviar comando manual, Arduino activa `modoRemoto = true` automáticamente
  - Comando MQTT para cambiar modo (línea 723-736 del sketch):
    ```json
    {"modo": "automatico"}  // Reactiva control automático
    {"modo": "remoto"}      // Solo comandos manuales
    ```
- **Falta implementar**: Interfaz web para cambiar entre modos explícitamente

### ⚠️ **FUNCIONALIDADES PENDIENTES / INCOMPLETAS**

#### 0. **RESUELTO: IDs de Sensores Automáticos** ✅ **IMPLEMENTADO**
- **Solución aplicada**: Sistema de auto-sincronización (v2.0)
- **Archivo**: `sistema_riego_mqtt_autosync.ino` + endpoint `/api/arduino/sync`
- **Cómo funciona**:
  - Arduino llama a `/api/arduino/sync` al iniciar
  - Servidor devuelve IDs de sensores/actuadores mapeados por pin+tipo
  - Arduino guarda IDs en memoria y los usa en todos los envíos
  - Re-sincronización cada 5 min para obtener cambios de configuración
- **Ventajas**:
  - ✅ Usuario solo configura API_KEY y WiFi
  - ✅ Sin duplicados en BD (clave única: pin+tipo)
  - ✅ Umbrales actualizables desde web sin re-flashear
  - ✅ Auto-provisioning crea sensores si no existen

#### 1. **Calendario de Riego → Arduino** ❌ **NO FUNCIONA**
- **Estado actual**:
  - ✅ Backend tiene `SchedulerService` que verifica calendario cada minuto
  - ✅ `schedulerService.checkSchedule()` envía notificaciones email/WebSocket cuando es hora de regar
  - ❌ **NO envía comandos MQTT al Arduino para activar bomba automáticamente**
- **Código faltante**:
  - En `schedulerService.js:processEvent()` (línea 137-180), solo notifica pero NO llama a `mqttService.controlActuator()`
  - **Solución requerida**: Agregar en línea ~177 (después de notificaciones):
    ```javascript
    // Activar riego automático si hay dispositivo asociado
    if (invernadero.dispositivos && invernadero.dispositivos.length > 0) {
      const dispositivo = invernadero.dispositivos[0];
      const actuadores = await Actuadores.findAll({ 
        where: { dispositivo_id: dispositivo.id, tipo: 'bomba' } 
      });
      
      if (actuadores.length > 0) {
        await mqttService.controlActuator(
          dispositivo.id,
          actuadores[0].id,
          'encendido',
          'calendario',
          usuario.id
        );
      }
    }
    ```

#### 2. **Detener Calendario al Activar Riego Manual** ❌ **NO IMPLEMENTADO**
- **Requisito**: Si usuario activa bomba manualmente, desactivar horarios programados para ese invernadero
- **Falta implementar**:
  1. En `ArduinoController.controlActuator()` (línea 210-260), agregar:
     ```javascript
     // Desactivar eventos de calendario activos para este dispositivo
     const invernadero = await Invernaderos.findOne({ 
       where: { id: device.invernadero_id } 
     });
     
     if (invernadero && accion === 'encender') {
       await Calendario.update(
         { estado: false },
         { where: { invernadero_id: invernadero.id, estado: true } }
       );
       logger.info(`Calendario desactivado para invernadero ${invernadero.id} por riego manual`);
     }
     ```
  2. Notificar al usuario vía Socket.IO que calendario fue desactivado

#### 3. **Configuración de Umbrales desde Web** ❌ **NO IMPLEMENTADO**
- **Actual**: Umbrales hardcodeados en Arduino (`HUM_ON = 55%`, `HUM_OFF = 70%`)
- **Necesario**:
  1. Agregar campos en tabla `configuraciones_riego` para umbrales personalizados
  2. Endpoint para actualizar configuración
  3. Comando MQTT para enviar umbrales al Arduino:
     ```json
     {"configuracion": {"humedad_min": 50, "humedad_max": 75}}
     ```
  4. Arduino guarda en variables y aplica

#### 4. **Duración Automática de Riego** ❌ **NO IMPLEMENTADO**
- **Requisito**: Apagar bomba automáticamente después de X minutos
- **Falta**:
  - Campo `duracion_minutos` en tabla `calendario`
  - Timer en scheduler que apague bomba después de tiempo configurado
  - Arduino podría tener timer local (más confiable) recibido vía MQTT

#### 5. **Confirmación de Ejecución Arduino → Web** ⚠️ **PARCIAL**
- **Actual**: Arduino envía estado en tópico `riego/{API_KEY}/eventos` cuando cambia bomba
- **Procesamiento**: `mqttService.processEvent()` recibe eventos pero NO actualiza UI en tiempo real
- **Falta**: Emitir Socket.IO event después de procesar evento para actualizar botones en frontend

### 🔄 **INTERACCIÓN COMPLETA: Flujo Esperado Ideal**

```
┌─────────────────────────────────────────────────────────────────┐
│                    CASO 1: RIEGO MANUAL                         │
└─────────────────────────────────────────────────────────────────┘

Usuario Web          Node.js Server          MQTT Broker          Arduino
    │                       │                      │                  │
    │ 1. Click "Encender"   │                      │                  │
    ├──────────────────────►│                      │                  │
    │                       │ 2. Verificar permisos│                  │
    │                       │ 3. Guardar en BD     │                  │
    │                       │                      │                  │
    │                       │ 4. Publicar comando  │                  │
    │                       ├─────────────────────►│                  │
    │                       │                      │ 5. Enrutar       │
    │                       │                      ├─────────────────►│
    │                       │                      │                  │ 6. Activar relé
    │                       │                      │                  │ 7. modoRemoto=true
    │                       │                      │                  │
    │                       │                      │ 8. Confirmar     │
    │                       │ ◄────────────────────┼──────────────────┤
    │                       │ 9. Socket.IO update  │                  │
    │ ◄─────────────────────┤                      │                  │
    │ 10. UI actualizada    │                      │                  │
    │     Botón verde ON    │                      │                  │


┌─────────────────────────────────────────────────────────────────┐
│              CASO 2: CALENDARIO AUTOMÁTICO (FALTA)              │
└─────────────────────────────────────────────────────────────────┘

Scheduler (cron)    Node.js Server          MQTT Broker          Arduino
    │                       │                      │                  │
    │ 1. Verificar hora     │                      │                  │
    │   (cada minuto)       │                      │                  │
    ├──────────────────────►│                      │                  │
    │                       │ 2. Consultar BD      │                  │
    │                       │    ¿Hay eventos?     │                  │
    │                       │                      │                  │
    │                       │ 3. Enviar email ✅   │                  │
    │                       │    Notificación ✅   │                  │
    │                       │                      │                  │
    │                       │ 4. ❌ FALTA:         │                  │
    │                       │    Activar bomba MQTT│                  │
    │                       ├─────────────────────►│                  │
    │                       │                      ├─────────────────►│
    │                       │                      │                  │ 5. Encender bomba
    │                       │                      │                  │
    │                       │                      │ 6. Timer interno │
    │                       │                      │    (duración)    │
    │                       │                      │                  │
    │                       │                      │ 7. Apagar auto   │
    │                       │ ◄────────────────────┼──────────────────┤
```

### 🚨 **FUNCIONALIDADES VITALES ADICIONALES**

#### 1. **Sistema de Emergencia**
- Detector de fugas: Si nivel agua baja rápido → alerta + apagar bomba
- Límite de tiempo máximo de riego (ej: 30 min) para evitar inundaciones
- Botón de emergencia en web que apague TODAS las bombas inmediatamente

#### 2. **Historial y Analíticas**
- Gráficos de consumo de agua por día/semana
- Estadísticas de tiempo de riego efectivo
- Predicción de próximo riego basado en tendencia de humedad

#### 3. **Notificaciones Inteligentes**
- Alerta si Arduino lleva >5 minutos offline
- Notificar si sensor reporta valores imposibles (ej: humedad 200%)
- Resumen diario por email: "Hoy se regó 3 veces, 45 litros consumidos"

#### 4. **Gestión Multi-Zona**
- Riego secuencial: Zona 1 → espera → Zona 2 (evitar sobrecarga eléctrica)
- Priorización: Si agua baja, regar solo zonas críticas

#### 5. **Integración Climática**
- Cancelar riego automático si sensores externos detectan lluvia
- Ajustar duración según temperatura (más calor = más riego)
- API OpenWeather: Si lluvia pronosticada, postponer riego

---

## 📋 Checklist de Implementación Prioritaria

### Alta Prioridad (Semana 1)
- [ ] Implementar activación de bomba desde calendario (`schedulerService.js`)
- [ ] Desactivar calendario al activar riego manual (`ArduinoController.js`)
- [ ] Confirmación de ejecución Arduino → Web (Socket.IO en `mqttService.processEvent`)
- [ ] Botón de emergencia "Detener Todo" en dashboard

### Media Prioridad (Semana 2-3)
- [ ] Interfaz web para cambiar modo automático/remoto
- [ ] Configuración de umbrales desde web + comando MQTT
- [ ] Duración automática de riego con timer
- [ ] Alertas offline si Arduino >5 min sin ping

### Baja Prioridad (Mejoras futuras)
- [ ] Historial gráfico de consumo de agua
- [ ] Gestión multi-zona con secuenciamiento
- [ ] Integración con API climática (OpenWeather)
- [ ] Sistema de predicción de próximo riego

---

**When in doubt**: Check existing controllers for patterns, prioritize mobile responsiveness, log errors with Winston, and maintain MQTT-first architecture for device communication.
