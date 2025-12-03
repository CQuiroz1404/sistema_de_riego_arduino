-- ============================================
-- Sistema de Riego Arduino IoT - Base de Datos Completa
-- Versión: 2.1.0
-- Fecha: 2 de diciembre de 2025
-- ============================================
-- Este archivo contiene:
-- 1. Creación de la base de datos
-- 2. Estructura de todas las tablas
-- 3. Datos de ejemplo para desarrollo y testing
-- ============================================

-- Crear y usar base de datos
CREATE DATABASE IF NOT EXISTS sistema_riego CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE sistema_riego;

-- ============================================
-- MÓDULO 1: USUARIOS Y AUTENTICACIÓN
-- ============================================

CREATE TABLE IF NOT EXISTS usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    avatar VARCHAR(255) NULL,
    password VARCHAR(255) NOT NULL,
    rol ENUM('admin', 'usuario') DEFAULT 'usuario',
    rut VARCHAR(20) UNIQUE,
    activo BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ultima_conexion TIMESTAMP NULL,
    INDEX idx_email (email),
    INDEX idx_rol (rol),
    INDEX idx_rut (rut)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- MÓDULO 2: HARDWARE (IoT)
-- ============================================

-- Dispositivos Arduino
CREATE TABLE IF NOT EXISTS dispositivos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    ubicacion VARCHAR(200),
    descripcion TEXT,
    api_key VARCHAR(100) UNIQUE NOT NULL,
    estado ENUM('activo', 'inactivo', 'mantenimiento') DEFAULT 'activo',
    ultima_conexion TIMESTAMP NULL,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    usuario_id INT NOT NULL,
    invernadero_id INT NULL,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    INDEX idx_api_key (api_key),
    INDEX idx_estado (estado),
    INDEX idx_usuario_id (usuario_id),
    INDEX idx_invernadero_id (invernadero_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Sensores
CREATE TABLE IF NOT EXISTS sensores (
    id INT AUTO_INCREMENT PRIMARY KEY,
    dispositivo_id INT NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    tipo ENUM('humedad_suelo', 'temperatura', 'humedad_ambiente', 'nivel_agua', 'lluvia', 'luz') NOT NULL,
    pin VARCHAR(10),
    unidad VARCHAR(20),
    valor_minimo DECIMAL(10, 2),
    valor_maximo DECIMAL(10, 2),
    activo BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (dispositivo_id) REFERENCES dispositivos(id) ON DELETE CASCADE,
    INDEX idx_dispositivo_id (dispositivo_id),
    INDEX idx_tipo (tipo),
    INDEX idx_activo (activo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Lecturas de sensores
CREATE TABLE IF NOT EXISTS lecturas (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    sensor_id INT NOT NULL,
    valor DECIMAL(10, 2) NOT NULL,
    fecha_lectura TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sensor_id) REFERENCES sensores(id) ON DELETE CASCADE,
    INDEX idx_sensor_id (sensor_id),
    INDEX idx_fecha_lectura (fecha_lectura)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Actuadores (bombas, válvulas)
CREATE TABLE IF NOT EXISTS actuadores (
    id INT AUTO_INCREMENT PRIMARY KEY,
    dispositivo_id INT NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    tipo ENUM('bomba', 'valvula', 'electrovalvula') NOT NULL,
    pin VARCHAR(10),
    estado ENUM('encendido', 'apagado') DEFAULT 'apagado',
    activo BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (dispositivo_id) REFERENCES dispositivos(id) ON DELETE CASCADE,
    INDEX idx_dispositivo_id (dispositivo_id),
    INDEX idx_estado (estado)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- MÓDULO 3: CONFIGURACIÓN DE RIEGO
-- ============================================

-- Configuraciones de riego automático
CREATE TABLE IF NOT EXISTS configuraciones_riego (
    id INT AUTO_INCREMENT PRIMARY KEY,
    dispositivo_id INT NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    sensor_id INT NOT NULL,
    actuador_id INT NOT NULL,
    umbral_inferior DECIMAL(10, 2) NOT NULL COMMENT 'Valor mínimo para activar riego',
    umbral_superior DECIMAL(10, 2) NOT NULL COMMENT 'Valor máximo para detener riego',
    duracion_minutos INT DEFAULT 10 COMMENT 'Duración del riego en minutos',
    modo ENUM('manual', 'automatico', 'programado') DEFAULT 'automatico',
    activo BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_modificacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (dispositivo_id) REFERENCES dispositivos(id) ON DELETE CASCADE,
    FOREIGN KEY (sensor_id) REFERENCES sensores(id) ON DELETE CASCADE,
    FOREIGN KEY (actuador_id) REFERENCES actuadores(id) ON DELETE CASCADE,
    INDEX idx_dispositivo_id (dispositivo_id),
    INDEX idx_activo (activo),
    INDEX idx_modo (modo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- MÓDULO 4: EVENTOS Y REGISTROS
-- ============================================

-- Eventos de riego (historial)
CREATE TABLE IF NOT EXISTS eventos_riego (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    dispositivo_id INT NOT NULL,
    actuador_id INT NOT NULL,
    accion ENUM('inicio', 'fin') NOT NULL,
    modo ENUM('manual', 'automatico', 'programado') NOT NULL,
    duracion_segundos INT,
    usuario_id INT NULL COMMENT 'NULL si fue automático',
    fecha_evento TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (dispositivo_id) REFERENCES dispositivos(id) ON DELETE CASCADE,
    FOREIGN KEY (actuador_id) REFERENCES actuadores(id) ON DELETE CASCADE,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL,
    INDEX idx_dispositivo_id (dispositivo_id),
    INDEX idx_fecha_evento (fecha_evento),
    INDEX idx_modo (modo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Logs del sistema
CREATE TABLE IF NOT EXISTS logs_sistema (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    nivel ENUM('info', 'warning', 'error', 'critical') NOT NULL,
    modulo VARCHAR(50),
    mensaje TEXT NOT NULL,
    dispositivo_id INT NULL,
    usuario_id INT NULL,
    fecha_log TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (dispositivo_id) REFERENCES dispositivos(id) ON DELETE SET NULL,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL,
    INDEX idx_nivel (nivel),
    INDEX idx_fecha_log (fecha_log),
    INDEX idx_modulo (modulo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Alertas
CREATE TABLE IF NOT EXISTS alertas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    dispositivo_id INT NOT NULL,
    tipo ENUM('sensor_fuera_rango', 'dispositivo_offline', 'error_actuador', 'bajo_nivel_agua', 'otro') NOT NULL,
    severidad ENUM('baja', 'media', 'alta', 'critica') DEFAULT 'media',
    mensaje TEXT NOT NULL,
    leida BOOLEAN DEFAULT FALSE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_lectura TIMESTAMP NULL,
    FOREIGN KEY (dispositivo_id) REFERENCES dispositivos(id) ON DELETE CASCADE,
    INDEX idx_dispositivo_id (dispositivo_id),
    INDEX idx_leida (leida),
    INDEX idx_fecha_creacion (fecha_creacion),
    INDEX idx_severidad (severidad)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- MÓDULO 5: MODELO DE NEGOCIO (Invernaderos)
-- ============================================

-- Tipos de plantas
CREATE TABLE IF NOT EXISTS tipo_planta (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    estado BOOLEAN DEFAULT TRUE,
    INDEX idx_estado (estado)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Rangos de temperatura ideales
CREATE TABLE IF NOT EXISTS rango_temperatura (
    id INT AUTO_INCREMENT PRIMARY KEY,
    temp_min DECIMAL(5,2) NOT NULL,
    temp_max DECIMAL(5,2) NOT NULL,
    estado BOOLEAN DEFAULT TRUE,
    INDEX idx_estado (estado)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Rangos de humedad ideales
CREATE TABLE IF NOT EXISTS rango_humedad (
    id INT AUTO_INCREMENT PRIMARY KEY,
    hum_min DECIMAL(5,2) NOT NULL,
    hum_max DECIMAL(5,2) NOT NULL,
    estado BOOLEAN DEFAULT TRUE,
    INDEX idx_estado (estado)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Catálogo de plantas
CREATE TABLE IF NOT EXISTS plantas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    tipo_planta_id INT,
    rango_temperatura_id INT,
    rango_humedad_id INT,
    estado BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (tipo_planta_id) REFERENCES tipo_planta(id) ON DELETE SET NULL,
    FOREIGN KEY (rango_temperatura_id) REFERENCES rango_temperatura(id) ON DELETE SET NULL,
    FOREIGN KEY (rango_humedad_id) REFERENCES rango_humedad(id) ON DELETE SET NULL,
    INDEX idx_tipo_planta (tipo_planta_id),
    INDEX idx_estado (estado)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Invernaderos
CREATE TABLE IF NOT EXISTS invernaderos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    descripcion TEXT,
    ubicacion VARCHAR(255),
    planta_id INT,
    riego BOOLEAN DEFAULT FALSE,
    temp_actual DECIMAL(5,2),
    hum_actual DECIMAL(5,2),
    estado BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (planta_id) REFERENCES plantas(id) ON DELETE SET NULL,
    INDEX idx_planta_id (planta_id),
    INDEX idx_estado (estado)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- MÓDULO 6: CALENDARIO Y PLANIFICACIÓN
-- ============================================

-- Semanas de ciclo de cultivo
CREATE TABLE IF NOT EXISTS semanas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Acciones posibles
CREATE TABLE IF NOT EXISTS acciones (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Calendario de actividades
CREATE TABLE IF NOT EXISTS calendario (
    id INT AUTO_INCREMENT PRIMARY KEY,
    invernadero_id INT,
    semana_id INT,
    dia_semana VARCHAR(20),
    fecha_inicio DATE,
    fecha_fin DATE,
    hora_inicial TIME,
    usuario_id INT,
    hora_final TIME,
    estado BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (invernadero_id) REFERENCES invernaderos(id) ON DELETE CASCADE,
    FOREIGN KEY (semana_id) REFERENCES semanas(id) ON DELETE CASCADE,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL,
    INDEX idx_invernadero_id (invernadero_id),
    INDEX idx_semana_id (semana_id),
    INDEX idx_estado (estado)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- MÓDULO 7: HISTORIAL
-- ============================================

-- Historial automático de condiciones
CREATE TABLE IF NOT EXISTS historial_automatico (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    invernadero_id INT,
    fecha DATE,
    hora TIME,
    temp DECIMAL(5,2),
    humedad DECIMAL(5,2),
    estado VARCHAR(50),
    FOREIGN KEY (invernadero_id) REFERENCES invernaderos(id) ON DELETE CASCADE,
    INDEX idx_invernadero_id (invernadero_id),
    INDEX idx_fecha (fecha)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Historial de acciones manuales
CREATE TABLE IF NOT EXISTS historial_acciones (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    invernadero_id INT,
    fecha DATE,
    hora TIME,
    temp DECIMAL(5,2),
    humedad DECIMAL(5,2),
    usuario_id INT,
    accion_id INT,
    estado VARCHAR(50),
    FOREIGN KEY (invernadero_id) REFERENCES invernaderos(id) ON DELETE CASCADE,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL,
    FOREIGN KEY (accion_id) REFERENCES acciones(id) ON DELETE SET NULL,
    INDEX idx_invernadero_id (invernadero_id),
    INDEX idx_usuario_id (usuario_id),
    INDEX idx_fecha (fecha)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- DATOS INICIALES
-- ============================================

-- La base de datos se crea vacía
-- Los usuarios pueden registrarse y crear sus propios datos desde cero

-- ============================================
-- VERIFICACIÓN FINAL
-- ============================================

SELECT '✅ Base de datos creada exitosamente' AS status;

SELECT 
    'Usuarios' AS tabla, 
    COUNT(*) AS registros 
FROM usuarios
UNION ALL
SELECT 'Dispositivos', COUNT(*) FROM dispositivos
UNION ALL
SELECT 'Sensores', COUNT(*) FROM sensores
UNION ALL
SELECT 'Lecturas', COUNT(*) FROM lecturas
UNION ALL
SELECT 'Actuadores', COUNT(*) FROM actuadores
UNION ALL
SELECT 'Configuraciones Riego', COUNT(*) FROM configuraciones_riego
UNION ALL
SELECT 'Eventos Riego', COUNT(*) FROM eventos_riego
UNION ALL
SELECT 'Alertas', COUNT(*) FROM alertas
UNION ALL
SELECT 'Logs Sistema', COUNT(*) FROM logs_sistema
UNION ALL
SELECT 'Plantas', COUNT(*) FROM plantas
UNION ALL
SELECT 'Invernaderos', COUNT(*) FROM invernaderos
UNION ALL
SELECT 'Calendario', COUNT(*) FROM calendario
UNION ALL
SELECT 'Historial Automático', COUNT(*) FROM historial_automatico
UNION ALL
SELECT 'Historial Acciones', COUNT(*) FROM historial_acciones;

-- ============================================
-- NOTAS IMPORTANTES
-- ============================================
-- 1. Cambiar las contraseñas en producción
-- 2. Actualizar los api_key de los dispositivos
-- 3. Configurar las credenciales MQTT en arduino/config.h
-- 4. Verificar los valores de umbrales según tus plantas
-- 5. Ajustar horarios de riego según tu zona horaria
-- ============================================
