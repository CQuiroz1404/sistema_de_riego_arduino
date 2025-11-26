-- ============================================
-- Sistema de Riego Arduino IoT - Base de Datos
-- ============================================

-- Crear base de datos
CREATE DATABASE IF NOT EXISTS sistema_riego CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE sistema_riego;

-- ============================================
-- Tabla: usuarios
-- ============================================
CREATE TABLE IF NOT EXISTS usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    rol ENUM('admin', 'usuario') DEFAULT 'usuario',
    rut VARCHAR(20) UNIQUE,
    activo BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ultima_conexion TIMESTAMP NULL,
    INDEX idx_email (email),
    INDEX idx_rol (rol)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Tabla: dispositivos (Arduinos)
-- ============================================
CREATE TABLE IF NOT EXISTS dispositivos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    ubicacion VARCHAR(200),
    descripcion TEXT,
    mac_address VARCHAR(17) UNIQUE,
    ip_address VARCHAR(45),
    api_key VARCHAR(100) UNIQUE NOT NULL,
    estado ENUM('activo', 'inactivo', 'mantenimiento') DEFAULT 'activo',
    ultima_conexion TIMESTAMP NULL,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    usuario_id INT NOT NULL,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    INDEX idx_api_key (api_key),
    INDEX idx_estado (estado),
    INDEX idx_usuario_id (usuario_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Tabla: sensores
-- ============================================
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
    INDEX idx_tipo (tipo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Tabla: lecturas (datos de sensores)
-- ============================================
CREATE TABLE IF NOT EXISTS lecturas (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    sensor_id INT NOT NULL,
    valor DECIMAL(10, 2) NOT NULL,
    fecha_lectura TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sensor_id) REFERENCES sensores(id) ON DELETE CASCADE,
    INDEX idx_sensor_id (sensor_id),
    INDEX idx_fecha_lectura (fecha_lectura)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Tabla: actuadores (bombas, válvulas)
-- ============================================
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
-- Tabla: configuraciones_riego
-- ============================================
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
    INDEX idx_activo (activo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Tabla: horarios_riego
-- ============================================
CREATE TABLE IF NOT EXISTS horarios_riego (
    id INT AUTO_INCREMENT PRIMARY KEY,
    configuracion_id INT NOT NULL,
    dia_semana TINYINT NOT NULL COMMENT '0=Domingo, 1=Lunes, ..., 6=Sábado',
    hora_inicio TIME NOT NULL,
    duracion_minutos INT NOT NULL,
    activo BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (configuracion_id) REFERENCES configuraciones_riego(id) ON DELETE CASCADE,
    INDEX idx_configuracion_id (configuracion_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Tabla: eventos_riego (historial)
-- ============================================
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
    INDEX idx_fecha_evento (fecha_evento)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Tabla: logs_sistema
-- ============================================
CREATE TABLE IF NOT EXISTS logs_sistema (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    nivel ENUM('info', 'warning', 'error', 'critical') NOT NULL,
    modulo VARCHAR(50),
    mensaje TEXT NOT NULL,
    dispositivo_id INT NULL,
    usuario_id INT NULL,
    ip_address VARCHAR(45),
    fecha_log TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (dispositivo_id) REFERENCES dispositivos(id) ON DELETE SET NULL,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL,
    INDEX idx_nivel (nivel),
    INDEX idx_fecha_log (fecha_log)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Tabla: alertas
-- ============================================
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
    INDEX idx_fecha_creacion (fecha_creacion)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- NUEVAS TABLAS SEGUN DIAGRAMA (MODELO DE NEGOCIO)
-- ============================================

-- Tabla: tipo_planta
CREATE TABLE IF NOT EXISTS tipo_planta (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    estado BOOLEAN DEFAULT TRUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla: rango_temperatura (TEMPERATURA en diagrama)
CREATE TABLE IF NOT EXISTS rango_temperatura (
    id INT AUTO_INCREMENT PRIMARY KEY,
    temp_min DECIMAL(5,2) NOT NULL,
    temp_max DECIMAL(5,2) NOT NULL,
    estado BOOLEAN DEFAULT TRUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla: rango_humedad (HUMEDAD en diagrama)
CREATE TABLE IF NOT EXISTS rango_humedad (
    id INT AUTO_INCREMENT PRIMARY KEY,
    hum_min DECIMAL(5,2) NOT NULL,
    hum_max DECIMAL(5,2) NOT NULL,
    estado BOOLEAN DEFAULT TRUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla: plantas (PLANTA en diagrama)
CREATE TABLE IF NOT EXISTS plantas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    tipo_planta_id INT,
    rango_temperatura_id INT,
    rango_humedad_id INT,
    estado BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (tipo_planta_id) REFERENCES tipo_planta(id) ON DELETE SET NULL,
    FOREIGN KEY (rango_temperatura_id) REFERENCES rango_temperatura(id) ON DELETE SET NULL,
    FOREIGN KEY (rango_humedad_id) REFERENCES rango_humedad(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla: invernaderos (INVERNADERO en diagrama)
CREATE TABLE IF NOT EXISTS invernaderos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    descripcion TEXT,
    planta_id INT,
    riego BOOLEAN DEFAULT FALSE,
    temp_actual DECIMAL(5,2),
    hum_actual DECIMAL(5,2),
    estado BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (planta_id) REFERENCES plantas(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla: semanas (SEMANA en diagrama)
CREATE TABLE IF NOT EXISTS semanas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla: acciones (ACCIONES en diagrama)
CREATE TABLE IF NOT EXISTS acciones (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla: calendario (CALENDARIO en diagrama)
CREATE TABLE IF NOT EXISTS calendario (
    id INT AUTO_INCREMENT PRIMARY KEY,
    invernadero_id INT,
    semana_id INT,
    hora_inicial TIME,
    usuario_id INT, -- Referencia a usuarios (RUT_USUARI)
    hora_final TIME,
    estado BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (invernadero_id) REFERENCES invernaderos(id) ON DELETE CASCADE,
    FOREIGN KEY (semana_id) REFERENCES semanas(id) ON DELETE CASCADE,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla: historial_automatico (HISTORIAL - AUT en diagrama)
CREATE TABLE IF NOT EXISTS historial_automatico (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    invernadero_id INT,
    fecha DATE,
    hora TIME,
    temp DECIMAL(5,2),
    humedad DECIMAL(5,2),
    estado VARCHAR(50),
    FOREIGN KEY (invernadero_id) REFERENCES invernaderos(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla: historial_acciones (HISTORIAL - ACC en diagrama)
CREATE TABLE IF NOT EXISTS historial_acciones (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    invernadero_id INT,
    fecha DATE,
    hora TIME,
    temp DECIMAL(5,2),
    humedad DECIMAL(5,2),
    usuario_id INT, -- MANDANTE
    accion_id INT,
    estado VARCHAR(50),
    FOREIGN KEY (invernadero_id) REFERENCES invernaderos(id) ON DELETE CASCADE,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL,
    FOREIGN KEY (accion_id) REFERENCES acciones(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Datos iniciales
-- ============================================

-- Usuario administrador por defecto (password: admin123)
INSERT INTO usuarios (nombre, email, password, rol) VALUES 
('Administrador', 'admin@sistemariego.com', '$2a$10$X5awRj/jEU2RZn4fvmEKb.8jKB7X5whAa8Ri45UnO//atW/eci.ge', 'admin');

-- Usuario de prueba (password: usuario123)
INSERT INTO usuarios (nombre, email, password, rol) VALUES 
('Usuario Demo', 'usuario@sistemariego.com', '$2a$10$OQvCO1kfH3rENq39f8P4A.paftefaep/vOuI48VdRLmBx6EvGTrgu', 'usuario');

-- ============================================
-- Fin del script
-- ============================================
