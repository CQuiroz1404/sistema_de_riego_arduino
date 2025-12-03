# Sistema de Recuperación de Contraseña

## 📧 Descripción

Sistema completo de recuperación de contraseña con envío de correos electrónicos mediante Brevo (anteriormente SendinBlue).

## 🔧 Configuración Necesaria

### 1. Ejecutar la migración SQL

Primero, ejecuta el script SQL para agregar las columnas necesarias a la base de datos:

```bash
mysql -u tu_usuario -p sistema_riego < database/add_password_reset_fields.sql
```

O manualmente desde MySQL:

```sql
USE sistema_riego;

ALTER TABLE usuarios 
ADD COLUMN reset_token VARCHAR(255) NULL AFTER ultima_conexion;

ALTER TABLE usuarios 
ADD COLUMN reset_token_expiry DATETIME NULL AFTER reset_token;
```

### 2. Configurar Variables de Entorno

Asegúrate de tener configuradas estas variables en tu archivo `.env`:

```env
# Brevo API Configuration
BREVO_API_KEY=tu_api_key_de_brevo
BREVO_SENDER_EMAIL=noreply@tudominio.com

# URL de tu aplicación (importante para los enlaces de recuperación)
APP_URL=http://localhost:3000
```

#### Cómo obtener tu API Key de Brevo:

1. Accede a [Brevo](https://www.brevo.com/)
2. Inicia sesión en tu cuenta
3. Ve a **Settings** > **SMTP & API** > **API Keys**
4. Crea una nueva API Key o copia una existente
5. El email del remitente debe estar validado en Brevo

## 🚀 Funcionalidades Implementadas

### 1. Vista de Login
- ✅ Agregado enlace "¿Olvidaste tu contraseña?"
- 📍 Ruta: `/auth/login`

### 2. Solicitud de Recuperación
- ✅ Formulario para ingresar email
- ✅ Validación de email en base de datos
- ✅ Generación de token único y seguro
- ✅ Token expira en 1 hora
- ✅ Envío de correo con enlace de recuperación
- ✅ Protección contra enumeración de usuarios
- 📍 Ruta: `/auth/forgot-password`

### 3. Restablecimiento de Contraseña
- ✅ Validación de token
- ✅ Verificación de expiración
- ✅ Formulario con confirmación de contraseña
- ✅ Encriptación de nueva contraseña con bcrypt
- ✅ Limpieza automática del token tras uso
- ✅ Correo de confirmación al cambiar contraseña
- 📍 Ruta: `/auth/reset-password?token=TOKEN_GENERADO`

## 📝 Flujo Completo

```
1. Usuario hace clic en "¿Olvidaste tu contraseña?"
   ↓
2. Ingresa su email y envía el formulario
   ↓
3. Sistema verifica si el email existe en la DB
   ↓
4. Se genera un token único (crypto.randomBytes)
   ↓
5. Token se guarda en DB con expiración de 1 hora
   ↓
6. Se envía correo con enlace: 
   APP_URL/auth/reset-password?token=TOKEN
   ↓
7. Usuario hace clic en el enlace del correo
   ↓
8. Sistema valida que el token existe y no ha expirado
   ↓
9. Usuario ingresa nueva contraseña (2 veces)
   ↓
10. Nueva contraseña se encripta y guarda
   ↓
11. Token se elimina de la DB
   ↓
12. Se envía correo de confirmación
   ↓
13. Usuario es redirigido al login
```

## 🔒 Seguridad

- ✅ **Rate limiting**: Máximo 5 intentos cada 15 minutos
- ✅ **Token único**: Generado con `crypto.randomBytes(32)`
- ✅ **Expiración**: Tokens válidos por 1 hora únicamente
- ✅ **Uso único**: Token se elimina tras ser usado
- ✅ **Protección contra enumeración**: Respuesta genérica aunque el email no exista
- ✅ **Contraseñas encriptadas**: Usando bcrypt con salt rounds
- ✅ **Logs de auditoría**: Todas las acciones se registran

## 📧 Plantilla del Email

El correo enviado incluye:
- Header con icono de recuperación
- Mensaje personalizado con nombre del usuario
- Botón destacado para restablecer contraseña
- URL del enlace (por si el botón no funciona)
- Advertencia de expiración (1 hora)
- Nota de seguridad
- Footer institucional

## 🧪 Pruebas

### Prueba Manual:

1. **Solicitar recuperación con email válido:**
   ```
   POST /auth/forgot-password
   { "email": "usuario@ejemplo.com" }
   ```

2. **Solicitar recuperación con email inexistente:**
   ```
   POST /auth/forgot-password
   { "email": "noexiste@ejemplo.com" }
   ```
   (Debe responder igual para evitar enumeración)

3. **Acceder con token válido:**
   ```
   GET /auth/reset-password?token=TOKEN_VALIDO
   ```

4. **Acceder con token expirado:**
   ```
   GET /auth/reset-password?token=TOKEN_EXPIRADO
   ```

5. **Restablecer contraseña:**
   ```
   POST /auth/reset-password
   {
     "token": "TOKEN_VALIDO",
     "password": "nuevacontraseña123",
     "confirmPassword": "nuevacontraseña123"
   }
   ```

## 📁 Archivos Modificados/Creados

### Modificados:
- ✅ `src/models/Usuarios.js` - Agregados campos reset_token y reset_token_expiry
- ✅ `src/services/emailService.js` - Método sendPasswordReset()
- ✅ `src/controllers/AuthController.js` - 4 nuevos métodos
- ✅ `src/routes/auth.js` - Nuevas rutas
- ✅ `src/views/auth/login.hbs` - Enlace de recuperación

### Creados:
- ✅ `database/add_password_reset_fields.sql` - Script de migración
- ✅ `src/views/auth/forgot-password.hbs` - Vista solicitud
- ✅ `src/views/auth/reset-password.hbs` - Vista restablecimiento

## 🎨 Diseño UI

- Diseño responsive (mobile-first)
- Modo oscuro compatible
- Iconos Font Awesome
- Estilos Tailwind CSS
- Animaciones y transiciones suaves
- Mensajes de error/éxito contextuales
- Toggle de visibilidad de contraseña

## 📊 Logs y Auditoría

Todas las acciones quedan registradas:
- ✅ Solicitudes de recuperación
- ✅ Tokens generados
- ✅ Contraseñas restablecidas
- ✅ Intentos fallidos
- ✅ IP del usuario
- ✅ Timestamp de operaciones

## ⚠️ Notas Importantes

1. **Email del remitente**: Debe estar validado en Brevo
2. **APP_URL**: Debe apuntar a tu dominio en producción
3. **HTTPS**: Recomendado en producción para seguridad
4. **Límites Brevo**: Plan gratuito tiene límite de 300 emails/día

## 🐛 Troubleshooting

### No llegan los correos:
- Verifica BREVO_API_KEY en .env
- Confirma que el sender email está validado en Brevo
- Revisa logs del servidor: `logger.error` en consola
- Verifica spam/correo no deseado

### Token expirado:
- Los tokens duran 1 hora
- Solicita un nuevo enlace

### Error de base de datos:
- Verifica que ejecutaste el script SQL
- Confirma que las columnas existen: `DESCRIBE usuarios;`

---

**Desarrollado para Sistema de Riego Arduino IoT** 🌱💧
