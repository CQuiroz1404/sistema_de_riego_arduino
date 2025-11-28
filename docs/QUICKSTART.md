# 🚀 Guía de Inicio Rápido

## Pasos para poner en marcha el sistema

### 1. Instalar Dependencias
```bash
npm install
```

### 2. Configurar MySQL

**Opción A: Línea de comandos**
```bash
mysql -u root -p
```

Luego ejecuta:
```sql
CREATE DATABASE sistema_riego CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE sistema_riego;
SOURCE database/schema.sql;
EXIT;
```

**Opción B: Usando el archivo directamente**
```bash
mysql -u root -p < database/schema.sql
```

### 3. Configurar Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto:

```env
PORT=3000
NODE_ENV=development

DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=tu_password_mysql
DB_NAME=sistema_riego

JWT_SECRET=mi_clave_secreta_jwt_2024
JWT_EXPIRES_IN=24h
SESSION_SECRET=mi_clave_secreta_sesion_2024
```

### 4. Iniciar el Servidor

**Desarrollo (con auto-reload):**
```bash
npm run dev
```

**Producción:**
```bash
npm start
```

### 5. Acceder a la Plataforma

Abre tu navegador en: http://localhost:3000

**Credenciales de prueba:**
- Email: `admin@sistemariego.com`
- Password: `admin123`

### 6. Crear tu Primer Dispositivo

1. Inicia sesión
2. Ve a "Dispositivos" → "Nuevo Dispositivo"
3. Completa el formulario:
   - Nombre: "Arduino Jardín"
   - Ubicación: "Jardín trasero"
   - MAC Address: (dirección MAC de tu Arduino)
4. **Guarda la API Key generada** - la necesitarás para Arduino

### 7. Configurar Arduino

1. Abre `arduino_ejemplo.ino`
2. Modifica estas líneas:
```cpp
const char* WIFI_SSID = "TU_RED_WIFI";
const char* WIFI_PASSWORD = "TU_CONTRASEÑA_WIFI";
const char* SERVER_URL = "http://TU_IP:3000";
const char* API_KEY = "LA_API_KEY_GENERADA";
```

3. Sube el código a tu Arduino
4. Abre el Monitor Serial (115200 baud)

### 8. Agregar Sensores y Actuadores

En la plataforma web:

1. Ve a tu dispositivo
2. Agrega un sensor:
   - Nombre: "Sensor Humedad Suelo"
   - Tipo: "humedad_suelo"
   - Pin: "A0"
   - Unidad: "%"
   - Valor mínimo: 0
   - Valor máximo: 100

3. Agrega un actuador:
   - Nombre: "Bomba Principal"
   - Tipo: "bomba"
   - Pin: "D1"

### 9. Configurar Riego Automático

1. Ve a "Configuraciones"
2. Crea una nueva regla:
   - Sensor: "Sensor Humedad Suelo"
   - Actuador: "Bomba Principal"
   - Umbral inferior: 30 (activar riego si humedad < 30%)
   - Umbral superior: 70 (detener riego si humedad > 70%)
   - Modo: "automático"

## ✅ Verificación

### El sistema está funcionando correctamente si:

- ✅ El servidor inicia sin errores
- ✅ Puedes iniciar sesión en la web
- ✅ Arduino se conecta al WiFi
- ✅ Arduino hace ping al servidor exitosamente
- ✅ Los datos de sensores aparecen en el dashboard
- ✅ Puedes controlar actuadores desde la web

## 🔍 Monitoreo

### Ver logs del servidor:
```bash
# El servidor muestra logs en la consola
# Para guardar en archivo:
npm start > logs.txt 2>&1
```

### Ver logs de Arduino:
```
Abre el Monitor Serial en Arduino IDE (Ctrl+Shift+M)
Velocidad: 115200 baud
```

## 🐛 Problemas Comunes

### Error: Cannot find module
```bash
npm install
```

### Error: MySQL connection
Verifica que MySQL esté corriendo:
```bash
# Windows
net start MySQL

# Linux/Mac
sudo systemctl start mysql
```

### Arduino no envía datos
1. Verifica la conexión WiFi
2. Comprueba la API Key
3. Asegúrate que el servidor sea accesible desde la red del Arduino
4. Revisa el Monitor Serial para ver errores

### Puerto 3000 ocupado
Cambia el puerto en `.env`:
```env
PORT=3001
```

## 📊 Próximos Pasos

1. **Personaliza el sistema:**
   - Agrega más sensores (temperatura, luz, etc.)
   - Configura alertas personalizadas
   - Ajusta los umbrales según tu cultivo

2. **Optimiza el riego:**
   - Revisa el historial de lecturas
   - Ajusta los intervalos de riego
   - Configura horarios programados

3. **Escala el sistema:**
   - Agrega más dispositivos Arduino
   - Crea zonas de riego independientes
   - Integra sensores meteorológicos

## 💡 Consejos

- **Calibra tus sensores:** Los sensores de humedad varían, ajusta los valores según tu tierra
- **Prueba primero sin agua:** Verifica el sistema completo antes de conectar la bomba real
- **Usa fuentes de alimentación adecuadas:** Los relés y bombas requieren alimentación externa
- **Protege tu hardware:** Usa cajas resistentes al agua para exteriores
- **Respaldo de datos:** Haz backups regulares de la base de datos

## 📱 Acceso Remoto (Opcional)

Para acceder desde internet:

1. **Opción 1: Ngrok (Desarrollo)**
```bash
npm install -g ngrok
ngrok http 3000
```

2. **Opción 2: Port Forwarding (Producción)**
   - Configura port forwarding en tu router (puerto 3000)
   - Usa un DNS dinámico (No-IP, DuckDNS)
   - Considera usar HTTPS con Let's Encrypt

## 📚 Recursos Adicionales

- [Documentación de Express.js](https://expressjs.com/)
- [Guía de Arduino WiFi](https://www.arduino.cc/en/Guide/WiFi)
- [Tutorial de sensores de humedad](https://www.youtube.com/results?search_query=arduino+soil+moisture+sensor)
- [MySQL Documentation](https://dev.mysql.com/doc/)

## ❓ Ayuda

Si tienes problemas:

1. Revisa los logs del servidor
2. Verifica el Monitor Serial de Arduino
3. Consulta la sección de solución de problemas en README.md
4. Abre un issue en GitHub

---

**¡Feliz cultivo! 🌱💧**
