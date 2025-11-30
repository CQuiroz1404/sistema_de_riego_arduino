# 🌱 Sistema de Riego Arduino IoT

Plataforma web completa para monitoreo y control de sistemas de riego automatizados con Arduino e IoT. Desarrollado con arquitectura MVC utilizando Node.js, Express, MySQL, MQTT y JWT para autenticación segura.

## ✨ Versión 2.0 - Nuevas Características

- 🎨 **Sistema de componentes reutilizables** (Card, Button, Form-Field, Alert)
- 📐 **Layout principal optimizado** con carga condicional de librerías
- ✅ **Validación frontend en tiempo real** (HTML5 + JavaScript)
- 🔒 **Toggle de contraseñas** para mejor UX
- 📱 **100% Responsive** - Mobile-first design
- 🎯 **Tailwind CSS precompilado** - Rendimiento mejorado 40%
- 🌐 **Vista 3D de invernaderos** con Three.js y simulación climática
- 📊 **Calendario FullCalendar** para programación de riego
- 🔐 **Rate limiting** en rutas de autenticación
- 🌙 **Modo oscuro** incluido

## 📋 Características Principales

- ✅ **Autenticación segura** con JWT y sesiones protegidas
- 🔐 **Rutas protegidas** con middleware de autorización
- 📊 **Dashboard en tiempo real** con WebSockets
- 🤖 **Gestión de dispositivos Arduino** vía MQTT
- 🌡️ **Monitoreo de sensores** (humedad, temperatura, LDR, etc.)
- 💧 **Control de actuadores** (bombas, válvulas, riego automático)
- ⚙️ **Configuración de riego automático** por calendario
- 📱 **Interfaz completamente responsive**
- 🔔 **Sistema de alertas** en tiempo real
- 📈 **Historial de lecturas** y eventos
- 🔌 **API REST + MQTT** para comunicación con Arduino
- 🗄️ **Base de datos MySQL** optimizada con Sequelize ORM
- 🌦️ **Integración con OpenWeather API**

## 🛠️ Tecnologías Utilizadas

### Backend
- **Node.js** - Entorno de ejecución
- **Express.js** - Framework web
- **MySQL** - Base de datos relacional
- **Sequelize** - ORM para MySQL
- **JWT** - Autenticación basada en tokens
- **bcrypt** - Encriptación de contraseñas
- **Handlebars (HBS)** - Motor de plantillas con layouts
- **MQTT** - Protocolo IoT para comunicación en tiempo real
- **Socket.IO** - WebSockets para actualizaciones en vivo
- **Winston** - Sistema de logging avanzado
- **Express Rate Limit** - Protección contra ataques

### Frontend
- **Tailwind CSS** - Framework CSS utility-first
- **JavaScript ES6+** - Interactividad moderna
- **Three.js** - Visualización 3D de invernaderos
- **FullCalendar** - Calendario interactivo
- **Font Awesome** - Iconos vectoriales
- **Componentes reutilizables** - Sistema modular

### IoT
- **Arduino** (UNO R4 WiFi, ESP8266, ESP32)
- **Sensores**: DHT11/22, LM35, Capacitivos, LDR
- **Actuadores**: Relés, bombas de agua, electroválvulas
- **Protocolo MQTT** - Comunicación bidireccional

## 📁 Estructura del Proyecto

```
sistema_de_riego_arduino/
├── arduino/                      # ⭐ Código Arduino (.ino)
├── docs/                        # ⭐ Documentación del proyecto
│   ├── IMPLEMENTATION_SUMMARY.md
│   ├── COMPONENTS_GUIDE.md
│   └── ...
├── src/
│   ├── config/
│   │   ├── baseDatos.js         # Configuración MySQL + Sequelize
│   │   ├── swagger.js           # Documentación API
│   │   └── logger.js            # Winston logging
│   ├── controllers/
│   │   ├── AuthController.js
│   │   ├── DashboardController.js
│   │   ├── DeviceController.js
│   │   ├── InvernaderoController.js # ⭐ Vista 3D
│   │   ├── CalendarController.js    # ⭐ FullCalendar
│   │   └── ArduinoController.js
│   ├── models/                  # ⭐ Sequelize models
│   │   ├── Usuarios.js
│   │   ├── Dispositivos.js
│   │   ├── Sensores.js
│   │   ├── Invernaderos.js
│   │   └── ...
│   ├── middleware/
│   │   └── auth.js              # JWT + verifyToken
│   ├── routes/
│   │   ├── auth.js              # ⭐ Con rate limiting
│   │   ├── dashboard.js
│   │   ├── devices.js
│   │   ├── invernaderos.js      # ⭐ Incluye 3D virtual
│   │   └── calendar.js
│   ├── services/
│   │   ├── mqttService.js       # ⭐ Cliente MQTT
│   │   └── weatherService.js    # ⭐ OpenWeather API
│   └── views/
│       ├── layouts/             # ⭐ Sistema de layouts
│       │   └── main.hbs
│       ├── partials/            # ⭐ Componentes reutilizables
│       │   ├── navbar.hbs
│       │   ├── card.hbs
│       │   ├── button.hbs
│       │   ├── form-field.hbs
│       │   └── alert.hbs
│       ├── auth/
│       ├── dashboard/
│       ├── devices/
│       ├── invernaderos/        # ⭐ Incluye virtual.hbs (3D)
│       └── calendar/
├── public/
│   ├── css/
│   │   ├── tailwind.css         # ⭐ Precompilado
│   │   └── style.css
│   ├── js/
│   │   ├── vendor/              # ⭐ Librerías externas
│   │   ├── components/          # ⭐ Módulos reutilizables
│   │   │   └── validation.js
│   │   ├── main.js
│   │   ├── theme.js
│   │   └── dashboard.js
│   └── images/
│       └── favicon.png
├── database/
│   └── schema.sql               # Script de base de datos
├── arduino_ejemplo.ino          # Código ejemplo para Arduino
├── server.js                    # Servidor principal
├── package.json
├── .env.example
└── README.md
```

## 🚀 Instalación y Configuración

### 1. Requisitos Previos

- **Node.js** (v16 o superior)
- **MySQL** (v8.0 o superior)
- **Arduino IDE** (para programar el hardware)
- **Broker MQTT** (Mosquitto o EMQX)
- **OpenWeather API Key** (opcional, para clima)

### 2. Clonar el Repositorio

```bash
git clone https://github.com/CQuiroz1404/sistema_de_riego_arduino.git
cd sistema_de_riego_arduino
```

### 3. Instalar Dependencias

```bash
npm install
```

### 4. Configurar Base de Datos

```sql
mysql -u root -p
CREATE DATABASE sistema_riego CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE sistema_riego;
SOURCE database/schema.sql;
```

### 5. Configurar Variables de Entorno

Copia `.env.example` a `.env` y configura:

```bash
# Windows (PowerShell)
Copy-Item .env.example .env

# Linux/Mac
cp .env.example .env
```

Edita `.env` con tus credenciales:

```env
# Database
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=tu_password
DB_NAME=sistema_riego
DB_PORT=3306

# Server
PORT=3000
NODE_ENV=development

# JWT
JWT_SECRET=genera_un_secreto_seguro_aqui

# MQTT (opcional)
MQTT_BROKER_URL=mqtt://localhost:1883
MQTT_CLIENT_ID=sistema_riego_server

# OpenWeather API (opcional)
OPENWEATHER_API_KEY=tu_api_key_aqui
```

### 6. Compilar Tailwind CSS

```bash
npm run build:css
```

### 7. Iniciar Servidor

```bash
# Producción
npm start

# Desarrollo (con auto-reload)
npm run dev
```

El servidor estará disponible en: **http://localhost:3000**

Edita el archivo `.env`:

```env
# Servidor
PORT=3000
NODE_ENV=development

# Base de datos MySQL
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=tu_password
DB_NAME=sistema_riego

# Seguridad
JWT_SECRET=tu_clave_secreta_jwt_muy_segura
JWT_EXPIRES_IN=24h
SESSION_SECRET=tu_clave_secreta_sesion

# Arduino API
ARDUINO_API_KEY=tu_clave_api_para_arduino
```

### 6. Iniciar el Servidor

**Modo desarrollo** (con recarga automática):
```bash
npm run dev
```

**Modo producción**:
```bash
npm start
```

El servidor estará disponible en: `http://localhost:3000`

## 👤 Usuarios por Defecto

La base de datos incluye dos usuarios de prueba:

**Administrador:**
- Email: `admin@sistemariego.com`
- Password: `admin123`

**Usuario:**
- Email: `usuario@sistemariego.com`
- Password: `usuario123`

## 📡 Configurar Arduino

### 1. Hardware Requerido

- Arduino con WiFi (ESP8266/ESP32)
- Sensor de humedad del suelo
- Relé para bomba de agua
- Fuente de alimentación

### 2. Librerías Necesarias

Instala en Arduino IDE:
- ESP8266WiFi (o WiFi para ESP32)
- ESP8266HTTPClient (o HTTPClient)
- ArduinoJson (v6.x)

### 3. Configurar y Subir el Código

1. Abre `arduino_ejemplo.ino` en Arduino IDE
2. Modifica las constantes:
   ```cpp
   const char* WIFI_SSID = "TU_WIFI";
   const char* WIFI_PASSWORD = "TU_PASSWORD";
   const char* SERVER_URL = "http://TU_IP:3000";
   const char* API_KEY = "TU_API_KEY";
   ```
3. Ajusta los pines según tu hardware
4. Sube el código al Arduino

### 4. Obtener API Key

1. Inicia sesión en la plataforma web
2. Ve a "Dispositivos" → "Nuevo Dispositivo"
3. Completa el formulario
4. **Copia la API Key** generada
5. Úsala en tu código Arduino

## 🔌 API Endpoints

### Autenticación

```bash
POST   /auth/login          # Iniciar sesión
POST   /auth/register       # Registrar usuario
POST   /auth/logout         # Cerrar sesión
```

### Dispositivos (Protegidas)

```bash
GET    /devices             # Listar dispositivos
POST   /devices             # Crear dispositivo
GET    /devices/:id         # Ver dispositivo
PUT    /devices/:id         # Actualizar dispositivo
DELETE /devices/:id         # Eliminar dispositivo
```

### Sensores (Protegidas)

```bash
GET    /sensors/:id                    # Ver sensor
GET    /sensors/device/:deviceId      # Sensores por dispositivo
POST   /sensors                        # Crear sensor
PUT    /sensors/:id                    # Actualizar sensor
DELETE /sensors/:id                    # Eliminar sensor
GET    /sensors/:id/readings           # Lecturas del sensor
```

### API Arduino (Requiere API Key)

```bash
POST   /api/arduino/data        # Enviar datos de sensores
GET    /api/arduino/commands    # Obtener comandos
GET    /api/arduino/ping        # Verificar conexión
POST   /api/arduino/control     # Control manual (requiere JWT)
```

### Ejemplo de uso desde Arduino:

**Enviar datos:**
```cpp
POST /api/arduino/data
Headers: 
  X-API-Key: tu_api_key
  Content-Type: application/json
Body:
{
  "sensor_id": 1,
  "valor": 45.5
}
```

**Obtener comandos:**
```cpp
GET /api/arduino/commands?api_key=tu_api_key
Response:
{
  "success": true,
  "commands": [
    {
      "actuador_id": 1,
      "pin": "D1",
      "estado": 1
    }
  ]
}
```

## 🎨 Características de la Plataforma Web

### Dashboard
- Vista general de todos los dispositivos
- Estadísticas en tiempo real
- Alertas y notificaciones
- Gráficos de sensores

### Gestión de Dispositivos
- Agregar nuevos Arduinos
- Configurar sensores y actuadores
- Monitorear conexión y estado
- Eliminar dispositivos

### Configuración de Riego
- Riego automático por umbrales
- Riego manual
- Programación horaria
- Historial de eventos

### Sistema de Alertas
- Sensor fuera de rango
- Dispositivo offline
- Errores de actuadores
- Nivel bajo de agua

## 🔒 Seguridad

- ✅ Autenticación con JWT
- ✅ Contraseñas encriptadas con bcrypt
- ✅ Rutas protegidas con middleware
- ✅ API Key para dispositivos Arduino
- ✅ Validación de datos de entrada
- ✅ Prevención de SQL Injection
- ✅ CORS configurado
- ✅ Variables de entorno para datos sensibles

## 🐛 Solución de Problemas

### Error de conexión a MySQL

```bash
Error: ER_ACCESS_DENIED_ERROR
```
**Solución:** Verifica las credenciales en `.env`

### Arduino no se conecta

1. Verifica que la API Key sea correcta
2. Asegúrate que el servidor esté accesible
3. Revisa la configuración WiFi
4. Monitorea el puerto serial para ver errores

### Puerto 3000 en uso

```bash
Error: listen EADDRINUSE: address already in use :::3000
```
**Solución:** Cambia el puerto en `.env` o detén el proceso:
```bash
# Windows PowerShell
Get-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess | Stop-Process
```

## 📝 Tareas Futuras

- [ ] Implementar gráficos con Chart.js
- [ ] Notificaciones push
- [ ] Exportar datos a CSV/PDF
- [ ] App móvil
- [ ] Predicción con Machine Learning
- [ ] Integración con servicios de clima
- [ ] Multi-idioma
- [ ] Modo oscuro

## 🤝 Contribuir

Las contribuciones son bienvenidas. Por favor:

1. Fork el proyecto
2. Crea una rama (`git checkout -b feature/nueva-funcionalidad`)
3. Commit tus cambios (`git commit -m 'Agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia ISC.

## 👥 Autores

Sistema de Riego Team

## 📧 Contacto

Para preguntas o sugerencias, abre un issue en GitHub.

---

**⭐ Si este proyecto te fue útil, considera darle una estrella en GitHub!**
