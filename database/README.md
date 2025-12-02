# 📊 Base de Datos - Sistema de Riego Arduino IoT

Este directorio contiene el archivo SQL necesario para inicializar la base de datos del proyecto.

## 📄 Archivo

### `init.sql`
**Archivo único y completo** que incluye:

1. ✅ **Creación de la base de datos** (`sistema_riego`)
2. ✅ **Estructura completa** (17 tablas)
3. ✅ **Datos de ejemplo** listos para desarrollo y testing
4. ✅ **Verificación final** con conteo de registros

---

## 🚀 Instalación

### Opción 1: Línea de comandos MySQL

```bash
# Importar la base de datos completa
mysql -u root -p < database/init.sql

# O especificando el host
mysql -h localhost -u root -p < database/init.sql
```

### Opción 2: phpMyAdmin

1. Accede a phpMyAdmin
2. Crea una nueva base de datos (opcional, el script lo hace automáticamente)
3. Selecciona la base de datos `sistema_riego`
4. Ve a la pestaña **"Importar"**
5. Selecciona el archivo `init.sql`
6. Click en **"Continuar"**

### Opción 3: MySQL Workbench

1. Abre MySQL Workbench
2. Conecta a tu servidor MySQL
3. Menú: **Server → Data Import**
4. Selecciona **"Import from Self-Contained File"**
5. Navega a `database/init.sql`
6. Click en **"Start Import"**

---

## 📋 Estructura de Tablas

### Módulo 1: Usuarios y Autenticación
- `usuarios` - Usuarios del sistema (admin, operadores)

### Módulo 2: Hardware (IoT)
- `dispositivos` - Arduinos/controladores
- `sensores` - Sensores de temperatura, humedad, etc.
- `lecturas` - Datos recopilados por sensores
- `actuadores` - Bombas, válvulas, electroválvulas

### Módulo 3: Configuración de Riego
- `configuraciones_riego` - Reglas de riego automático
- `horarios_riego` - Programación de horarios

### Módulo 4: Eventos y Registros
- `eventos_riego` - Historial de activaciones de riego
- `logs_sistema` - Logs generales del sistema
- `alertas` - Notificaciones y alertas

### Módulo 5: Modelo de Negocio
- `tipo_planta` - Tipos de cultivos
- `rango_temperatura` - Rangos ideales de temperatura
- `rango_humedad` - Rangos ideales de humedad
- `plantas` - Catálogo de plantas
- `invernaderos` - Invernaderos físicos

### Módulo 6: Calendario y Planificación
- `semanas` - Semanas del ciclo de cultivo
- `acciones` - Tipos de acciones (riego, ventilación, etc.)
- `calendario` - Planificación de actividades

### Módulo 7: Historial
- `historial_automatico` - Registro automático de condiciones
- `historial_acciones` - Registro de acciones manuales

---

## 👥 Usuarios de Prueba

El script incluye 3 usuarios de prueba:

| Email | Contraseña | Rol | RUT |
|-------|-----------|-----|-----|
| `admin@sistemariego.com` | `admin123` | admin | 12.345.678-9 |
| `usuario@sistemariego.com` | `usuario123` | usuario | 98.765.432-1 |
| `maria@sistemariego.com` | `usuario123` | usuario | 11.222.333-4 |

> ⚠️ **IMPORTANTE:** Cambia estas contraseñas en producción.

---

## 🔑 API Keys de Dispositivos

Los dispositivos Arduino incluidos tienen estas API keys:

- `api_key_inv_principal_001` - Invernadero Principal
- `api_key_inv_semilleros_002` - Invernadero Semilleros
- `api_key_experimental_003` - Invernadero Experimental
- `api_key_hidroponico_004` - Invernadero Hidropónico

> 🔒 Estas keys deben actualizarse en producción y configurarse en `arduino/config.h`

---

## 📊 Datos de Ejemplo

El script incluye:

- ✅ 3 usuarios
- ✅ 4 dispositivos Arduino
- ✅ 7 sensores
- ✅ 30+ lecturas de sensores
- ✅ 4 actuadores
- ✅ 3 configuraciones de riego
- ✅ 6 horarios programados
- ✅ 8 eventos de riego
- ✅ 5 alertas
- ✅ 8 logs del sistema
- ✅ 6 tipos de plantas
- ✅ 4 rangos de temperatura
- ✅ 4 rangos de humedad
- ✅ 6 plantas
- ✅ 4 invernaderos
- ✅ 8 semanas de cultivo
- ✅ 8 tipos de acciones
- ✅ 6 eventos de calendario
- ✅ 7 registros de historial automático
- ✅ 5 acciones manuales registradas

---

## 🔧 Configuración Adicional

### Variables de Entorno (.env)

Asegúrate de configurar correctamente tu archivo `.env`:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=tu_contraseña
DB_NAME=sistema_riego
DB_PORT=3306
```

### Verificar Instalación

Después de importar, verifica que todo esté correcto:

```sql
USE sistema_riego;

-- Ver todas las tablas
SHOW TABLES;

-- Verificar usuarios
SELECT id, nombre, email, rol FROM usuarios;

-- Verificar dispositivos
SELECT id, nombre, ubicacion, api_key, estado FROM dispositivos;

-- Verificar sensores
SELECT s.id, s.nombre, s.tipo, d.nombre AS dispositivo 
FROM sensores s 
JOIN dispositivos d ON s.dispositivo_id = d.id;
```

---

## 🗄️ Mantenimiento

### Respaldar Base de Datos

```bash
# Exportar base de datos completa
mysqldump -u root -p sistema_riego > backup_$(date +%Y%m%d).sql

# Exportar solo estructura
mysqldump -u root -p --no-data sistema_riego > estructura.sql

# Exportar solo datos
mysqldump -u root -p --no-create-info sistema_riego > datos.sql
```

### Reiniciar Base de Datos

```sql
-- CUIDADO: Esto elimina todos los datos
DROP DATABASE IF EXISTS sistema_riego;

-- Luego volver a importar init.sql
```

---

## 📝 Notas

1. El script está configurado con `utf8mb4` para soportar emojis y caracteres especiales
2. Todas las tablas usan `InnoDB` para garantizar integridad referencial
3. Los índices están optimizados para las consultas más frecuentes
4. Las relaciones `ON DELETE CASCADE` eliminan registros huérfanos automáticamente
5. Los timestamps se actualizan automáticamente con `CURRENT_TIMESTAMP`

---

## 🔗 Enlaces Útiles

- [Documentación Completa](../docs/README.md)
- [Guía de Inicio Rápido](../docs/QUICKSTART.md)
- [Arquitectura MQTT](../docs/ARCHITECTURE_MQTT.md)

---

**Última actualización:** 2 de diciembre de 2025 (v2.1.0)
