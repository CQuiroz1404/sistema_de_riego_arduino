# 📁 Estructura del Proyecto

```
sistema_de_riego_arduino/
│
├── 📄 README.md                          # Documentación principal del proyecto
├── 📄 package.json                       # Dependencias y scripts npm
├── 📄 server.js                          # Servidor principal Node.js
├── ⚙️  .env.example                       # Plantilla de variables de entorno
├── 🚫 .gitignore                         # Archivos ignorados por Git
├── 🎨 tailwind.config.js                 # Configuración de Tailwind CSS
├── 📦 postcss.config.js                  # Configuración de PostCSS
│
├── 📂 arduino/                           # Código para Arduino
│   ├── 📄 sistema_riego_completo.ino    # Sketch principal con MQTT, LCD, RFID
│   ├── 📄 sistema_riego_mqtt.ino        # Versión MQTT simplificada
│   ├── 📄 arduino_uno_r4_wifi.ino       # Código específico para UNO R4 WiFi
│   ├── 📄 test_sensores_simple.ino      # Test de sensores
│   ├── 📄 prueba_conexion_simple.ino    # Test de conexión básica
│   ├── 📄 arduino_ejemplo.ino           # Ejemplo básico
│   ├── ⚙️  config.example.h              # Plantilla de configuración
│   └── 🔒 config.h                       # Credenciales (NO en Git)
│
├── 📂 database/                          # Scripts de base de datos
│   ├── 📄 schema.sql                    # Estructura de tablas
│   ├── 📄 sample_data.sql               # Datos de ejemplo
│   ├── 📄 update_sensores.sql           # Actualización de sensores
│   ├── 📄 fix_sensores_dispositivo.sql  # Fix de relaciones
│   └── 📄 ...                           # Otros scripts SQL
│
├── 📂 docs/                              # 📚 DOCUMENTACIÓN
│   ├── 📖 README.md                     # Índice de documentación
│   ├── 🚀 QUICKSTART.md                 # Inicio rápido
│   ├── 🚀 QUICKSTART_MQTT.md            # Inicio rápido MQTT
│   ├── 🏗️  ARCHITECTURE_MQTT.md         # Arquitectura del sistema
│   ├── 📋 IMPLEMENTATION_SUMMARY.md     # Resumen de implementación
│   ├── 🆕 MEJORAS_V2.1.0.md             # Últimas mejoras
│   ├── 🎨 COMPONENTS_GUIDE.md           # Guía de componentes
│   ├── ⚙️  CONFIGURACION_VARIABLES.md    # Variables de entorno
│   ├── 🔧 SENSOR_LM35CZ.md              # Doc sensor de temperatura
│   ├── 📝 CHANGELOG_MQTT.md             # Historial de cambios
│   ├── 🚢 DEPLOY.md                     # Guía de despliegue
│   └── 📂 troubleshooting/              # Solución de problemas
│       ├── 🐛 DIAGNOSTICO_SENSORES.md
│       ├── 🔧 SOLUCION_SENSORES.md
│       ├── 🔧 SOLUCION_SENSORES_COMPLETA.md
│       └── 🔧 SOLUCION_DASHBOARD.md
│
├── 📂 public/                            # Archivos estáticos
│   ├── 📂 css/
│   │   ├── 🎨 style.css                 # Estilos personalizados
│   │   └── 🎨 tailwind.css              # Tailwind compilado
│   ├── 📂 js/
│   │   ├── 📜 main.js                   # JavaScript principal
│   │   ├── 📜 dashboard.js              # Lógica del dashboard
│   │   ├── 📜 devices.js                # Gestión de dispositivos
│   │   ├── 📜 theme.js                  # Modo oscuro/claro
│   │   └── 📂 components/
│   │       ├── 📜 validation.js         # Validación de formularios
│   │       └── 📜 errorHandler.js       # Manejo de errores ✨ NUEVO
│   ├── 📂 images/
│   │   └── 🖼️  favicon.png
│   └── 📂 uploads/
│       └── 📂 avatars/                  # Avatares de usuarios
│
├── 📂 scripts/                           # Scripts de utilidad
│   ├── 📜 diagnostico_db.js
│   ├── 📜 test_email_simple.js
│   ├── 📜 test_weather_simple.js
│   └── 📜 ...
│
├── 📂 src/                               # Código fuente principal
│   │
│   ├── 📂 config/
│   │   ├── ⚙️  baseDatos.js              # Configuración MySQL + Sequelize
│   │   ├── 📝 logger.js                 # Winston logger
│   │   └── 📖 swagger.js                # Documentación API
│   │
│   ├── 📂 controllers/
│   │   ├── 🔐 AuthController.js
│   │   ├── 📊 DashboardController.js
│   │   ├── 🤖 DeviceController.js       # Con paginación ✨
│   │   ├── 🌡️  SensorController.js
│   │   ├── 🏭 InvernaderoController.js
│   │   ├── 🌿 PlantaController.js
│   │   ├── 📅 ScheduleController.js     # ✨ NUEVO (consolidado)
│   │   ├── 📜 HistorialController.js
│   │   ├── 👤 ProfileController.js
│   │   └── 🔌 ArduinoController.js
│   │
│   ├── 📂 middleware/
│   │   ├── 🔒 auth.js                   # JWT + verifyToken
│   │   └── 📤 upload.js                 # Multer (subida de archivos)
│   │
│   ├── 📂 models/                        # Sequelize Models (15+ modelos)
│   │   ├── 👤 Usuarios.js
│   │   ├── 🤖 Dispositivos.js
│   │   ├── 🌡️  Sensores.js
│   │   ├── 💧 Actuadores.js
│   │   ├── ⚙️  ConfiguracionesRiego.js
│   │   ├── 📅 Calendario.js
│   │   ├── 🏭 Invernaderos.js
│   │   ├── 🌿 Plantas.js
│   │   ├── 🔔 Alertas.js
│   │   ├── 📊 Lecturas.js
│   │   ├── 📜 EventosRiego.js
│   │   └── 📄 index.js                  # Definición de relaciones
│   │
│   ├── 📂 routes/
│   │   ├── 🔐 auth.js
│   │   ├── 📊 dashboard.js
│   │   ├── 🤖 devices.js
│   │   ├── 🌡️  sensors.js
│   │   ├── 🏭 invernaderos.js
│   │   ├── 🌿 plantas.js
│   │   ├── 📅 calendar.js               # ✨ Actualizado
│   │   ├── 👤 profile.js
│   │   └── 🔌 arduino.js
│   │
│   ├── 📂 services/
│   │   ├── 📡 mqttService.js            # Cliente MQTT + auto-provisioning
│   │   ├── 🌦️  weatherService.js        # OpenWeather API
│   │   ├── 📧 emailService.js           # Brevo (envío de emails)
│   │   └── 💾 cacheService.js           # ✨ NUEVO (node-cache)
│   │
│   ├── 📂 utils/                         # ✨ NUEVO
│   │   └── 📄 paginationHelper.js       # Helper de paginación
│   │
│   ├── 📂 styles/
│   │   └── 🎨 tailwind.css              # Fuente de Tailwind
│   │
│   └── 📂 views/                         # Vistas Handlebars
│       ├── 📂 layouts/
│       │   └── 📄 main.hbs              # Layout principal
│       ├── 📂 partials/
│       │   ├── 🧩 navbar.hbs
│       │   ├── 🧩 card.hbs
│       │   ├── 🧩 button.hbs
│       │   ├── 🧩 form-field.hbs
│       │   └── 🧩 alert.hbs
│       ├── 📂 auth/
│       │   ├── 🔐 login.hbs
│       │   └── 🔐 register.hbs
│       ├── 📂 dashboard/
│       │   └── 📊 index.hbs
│       ├── 📂 devices/
│       │   ├── 📋 index.hbs
│       │   ├── 📝 create.hbs
│       │   └── 👁️  show.hbs
│       ├── 📂 invernaderos/
│       │   ├── 📋 index.hbs
│       │   ├── 👁️  show.hbs
│       │   └── 🌐 virtual.hbs           # Vista 3D con Three.js
│       ├── 📂 plantas/
│       ├── 📂 calendar/
│       ├── 📂 calendario/
│       ├── 📂 profile/
│       ├── 📂 historial/
│       └── ❌ error.hbs
│
├── 📂 tests/                             # ✨ NUEVO - Tests
│   ├── 📂 integration/
│   │   └── 🧪 auth.test.js              # Tests de autenticación
│   └── 📂 unit/
│       ├── 📂 services/
│       │   ├── 🧪 mqttService.test.js
│       │   └── 🧪 cacheService.test.js
│       └── 📂 utils/
│           └── 🧪 paginationHelper.test.js
│
└── 📂 logs/                              # Logs de Winston (no en Git)
```

---

## 🎯 Puntos Clave

### ✨ Nuevas Adiciones (v2.1.0)
- `arduino/config.h` - Configuración segura
- `src/controllers/ScheduleController.js` - Controlador consolidado
- `src/services/cacheService.js` - Sistema de cache
- `src/utils/paginationHelper.js` - Helper de paginación
- `public/js/components/errorHandler.js` - Manejo de errores
- `tests/` - Suite completa de tests
- `docs/troubleshooting/` - Documentación de solución de problemas
- `docs/README.md` - Índice de documentación

### 📊 Estadísticas del Proyecto
- **Controllers:** 11 archivos
- **Models:** 15+ modelos Sequelize
- **Routes:** 9 archivos de rutas
- **Views:** 30+ vistas Handlebars
- **Tests:** 4 archivos de test (30+ tests)
- **Documentation:** 19 archivos Markdown
- **Arduino Sketches:** 6 archivos `.ino`

### 🔒 Archivos NO en Git
- `.env` - Variables de entorno
- `arduino/config.h` - Credenciales Arduino
- `node_modules/` - Dependencias
- `logs/` - Logs de la aplicación
- `public/uploads/avatars/` - Avatares de usuarios
- `coverage/` - Cobertura de tests

---

## 📖 Navegación Rápida

- **Documentación:** [docs/README.md](docs/README.md)
- **Inicio Rápido:** [docs/QUICKSTART.md](docs/QUICKSTART.md)
- **Arquitectura:** [docs/ARCHITECTURE_MQTT.md](docs/ARCHITECTURE_MQTT.md)
- **Tests:** [tests/](tests/)
- **Troubleshooting:** [docs/troubleshooting/](docs/troubleshooting/)

---

Última actualización: **2 de diciembre de 2025** (v2.1.0)
