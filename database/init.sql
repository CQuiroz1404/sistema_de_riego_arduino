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
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    INDEX idx_api_key (api_key),
    INDEX idx_estado (estado),
    INDEX idx_usuario_id (usuario_id)
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

-- Horarios programados
CREATE TABLE IF NOT EXISTS horarios_riego (
    id INT AUTO_INCREMENT PRIMARY KEY,
    configuracion_id INT NOT NULL,
    dia_semana TINYINT NOT NULL COMMENT '0=Domingo, 1=Lunes, ..., 6=Sábado',
    hora_inicio TIME NOT NULL,
    duracion_minutos INT NOT NULL,
    activo BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (configuracion_id) REFERENCES configuraciones_riego(id) ON DELETE CASCADE,
    INDEX idx_configuracion_id (configuracion_id),
    INDEX idx_dia_semana (dia_semana)
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
    ip_address VARCHAR(45),
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
    planta_id INT,
    dispositivo_id INT,
    riego BOOLEAN DEFAULT FALSE,
    temp_actual DECIMAL(5,2),
    hum_actual DECIMAL(5,2),
    estado BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (planta_id) REFERENCES plantas(id) ON DELETE SET NULL,
    FOREIGN KEY (dispositivo_id) REFERENCES dispositivos(id) ON DELETE SET NULL,
    INDEX idx_planta_id (planta_id),
    INDEX idx_dispositivo_id (dispositivo_id),
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

-- Usuarios de prueba
-- Password para admin: admin123
-- Password para usuario: usuario123
INSERT INTO usuarios (nombre, email, password, rol, rut, activo) VALUES 
('Administrador Sistema', 'admin@sistemariego.com', '$2a$10$X5awRj/jEU2RZn4fvmEKb.8jKB7X5whAa8Ri45UnO//atW/eci.ge', 'admin', '12.345.678-9', TRUE),
('Usuario Demo', 'usuario@sistemariego.com', '$2a$10$OQvCO1kfH3rENq39f8P4A.paftefaep/vOuI48VdRLmBx6EvGTrgu', 'usuario', '98.765.432-1', TRUE),
('María González', 'maria@sistemariego.com', '$2a$10$OQvCO1kfH3rENq39f8P4A.paftefaep/vOuI48VdRLmBx6EvGTrgu', 'usuario', '11.222.333-4', TRUE);

-- Tipos de Planta
INSERT INTO tipo_planta (nombre, estado) VALUES 
('Hortaliza', TRUE),
('Frutal', TRUE),
('Ornamental', TRUE),
('Aromática', TRUE),
('Leguminosa', TRUE);

-- Rangos de Temperatura
INSERT INTO rango_temperatura (temp_min, temp_max, estado) VALUES 
(18.00, 24.00, TRUE), -- Templado (Tomate, Pimiento)
(24.00, 30.00, TRUE), -- Cálido (Melón, Sandía)
(10.00, 18.00, TRUE), -- Frío (Lechuga, Espinaca)
(15.00, 22.00, TRUE); -- Moderado (Cilantro, Perejil)

-- Rangos de Humedad
INSERT INTO rango_humedad (hum_min, hum_max, estado) VALUES 
(40.00, 60.00, TRUE), -- Moderada (Tomate)
(60.00, 80.00, TRUE), -- Alta (Lechuga)
(20.00, 40.00, TRUE), -- Baja (Cactus)
(50.00, 70.00, TRUE); -- Media-Alta (Albahaca)

-- Plantas
INSERT INTO plantas (nombre, tipo_planta_id, rango_temperatura_id, rango_humedad_id, estado) VALUES 
('Tomate Cherry', 1, 1, 1, TRUE),
('Lechuga Romana', 1, 3, 2, TRUE),
('Albahaca', 4, 1, 4, TRUE),
('Pimiento Morrón', 1, 1, 1, TRUE),
('Cilantro', 4, 4, 4, TRUE),
('Fresa', 2, 1, 1, TRUE);

-- Invernaderos
INSERT INTO invernaderos (descripcion, planta_id, dispositivo_id, riego, temp_actual, hum_actual, estado) VALUES 
('Invernadero Principal - Sector A', 1, 1, FALSE, 22.5, 55.0, TRUE),
('Invernadero Semilleros', 2, 2, FALSE, 15.0, 70.0, TRUE),
('Invernadero Experimental', 3, 3, FALSE, 21.0, 60.0, TRUE),
('Invernadero Hidropónico', 6, 4, TRUE, 20.5, 65.0, TRUE);

-- Semanas de cultivo
INSERT INTO semanas (nombre) VALUES 
('Semana 1 - Germinación'),
('Semana 2 - Crecimiento Vegetativo'),
('Semana 3 - Desarrollo'),
('Semana 4 - Floración'),
('Semana 5 - Fructificación'),
('Semana 6 - Maduración'),
('Semana 7 - Pre-Cosecha'),
('Semana 8 - Cosecha');

-- Acciones disponibles
INSERT INTO acciones (nombre) VALUES 
('Riego por Goteo'),
('Riego por Aspersión'),
('Ventilación'),
('Fertirrigación'),
('Nebulización'),
('Control de Plagas'),
('Poda'),
('Trasplante');

-- Calendario de actividades
INSERT INTO calendario (invernadero_id, semana_id, dia_semana, hora_inicial, usuario_id, hora_final, estado) VALUES 
(1, 1, 'Lunes', '08:00:00', 1, '08:30:00', TRUE),
(1, 1, 'Miércoles', '08:00:00', 1, '08:30:00', TRUE),
(1, 1, 'Viernes', '18:00:00', 1, '18:30:00', TRUE),
(2, 2, 'Lunes', '07:00:00', 1, '07:15:00', TRUE),
(2, 2, 'Jueves', '07:00:00', 1, '07:15:00', TRUE),
(3, 3, 'Martes', '09:00:00', 2, '09:45:00', TRUE);

-- Dispositivos Arduino
INSERT INTO dispositivos (nombre, ubicacion, descripcion, api_key, estado, usuario_id, ultima_conexion) VALUES 
('Arduino Invernadero Principal', 'Invernadero Principal - Sector A', 'Controlador principal con DHT11 y sensor de nivel', 'api_key_inv_principal_001', 'activo', 1, NOW()),
('Arduino Semilleros', 'Invernadero Semilleros', 'Control de humedad para semilleros', 'api_key_inv_semilleros_002', 'activo', 1, DATE_SUB(NOW(), INTERVAL 30 MINUTE)),
('Arduino Experimental', 'Invernadero Experimental', 'Prototipo con múltiples sensores', 'api_key_experimental_003', 'mantenimiento', 2, DATE_SUB(NOW(), INTERVAL 5 DAY)),
('Arduino Hidropónico', 'Invernadero Hidropónico', 'Sistema hidropónico automatizado', 'api_key_hidroponico_004', 'activo', 1, NOW());

-- Variables para dispositivos
SET @disp1 = 1;
SET @disp2 = 2;
SET @disp3 = 3;
SET @disp4 = 4;

-- Sensores Dispositivo 1 (Invernadero Principal)
INSERT INTO sensores (dispositivo_id, nombre, tipo, pin, unidad, valor_minimo, valor_maximo, activo) VALUES 
(@disp1, 'Temperatura Ambiente DHT11', 'temperatura', 'D2', '°C', -10.00, 50.00, TRUE),
(@disp1, 'Humedad Ambiente DHT11', 'humedad_ambiente', 'D2', '%', 0.00, 100.00, TRUE),
(@disp1, 'Nivel Tanque Principal', 'nivel_agua', 'A2', '%', 0.00, 100.00, TRUE),
(@disp1, 'Humedad Suelo Sector 1', 'humedad_suelo', 'A0', '%', 0.00, 100.00, TRUE);

SET @sensor_temp_d1 = LAST_INSERT_ID();
SET @sensor_hum_amb_d1 = @sensor_temp_d1 + 1;
SET @sensor_nivel_d1 = @sensor_temp_d1 + 2;
SET @sensor_hum_suelo_d1 = @sensor_temp_d1 + 3;

-- Sensores Dispositivo 2 (Semilleros)
INSERT INTO sensores (dispositivo_id, nombre, tipo, pin, unidad, valor_minimo, valor_maximo, activo) VALUES 
(@disp2, 'Temperatura Semillero', 'temperatura', 'D3', '°C', -10.00, 50.00, TRUE),
(@disp2, 'Humedad Semillero', 'humedad_ambiente', 'D3', '%', 0.00, 100.00, TRUE),
(@disp2, 'Sensor Luz', 'luz', 'A1', 'lux', 0.00, 1000.00, TRUE);

-- Actuadores Dispositivo 1
INSERT INTO actuadores (dispositivo_id, nombre, tipo, pin, estado, activo) VALUES 
(@disp1, 'Bomba Riego Principal', 'bomba', 'D7', 'apagado', TRUE),
(@disp1, 'Electroválvula Zona A', 'electrovalvula', 'D8', 'apagado', TRUE),
(@disp1, 'Ventilador Extractor', 'electrovalvula', 'D9', 'apagado', TRUE);

SET @act_bomba_d1 = LAST_INSERT_ID();
SET @act_valvula_d1 = @act_bomba_d1 + 1;
SET @act_ventilador_d1 = @act_bomba_d1 + 2;

-- Actuadores Dispositivo 2
INSERT INTO actuadores (dispositivo_id, nombre, tipo, pin, estado, activo) VALUES 
(@disp2, 'Nebulizador Semilleros', 'bomba', 'D6', 'apagado', TRUE);

-- Configuraciones de Riego
INSERT INTO configuraciones_riego (dispositivo_id, nombre, sensor_id, actuador_id, umbral_inferior, umbral_superior, duracion_minutos, modo, activo) VALUES 
(@disp1, 'Riego Automático Tomates', @sensor_hum_suelo_d1, @act_bomba_d1, 40.00, 60.00, 15, 'automatico', TRUE),
(@disp1, 'Riego Programado Noche', @sensor_hum_suelo_d1, @act_bomba_d1, 35.00, 55.00, 20, 'programado', TRUE),
(@disp2, 'Nebulización Semilleros', @sensor_hum_amb_d1 + 4, @act_bomba_d1 + 3, 50.00, 70.00, 5, 'automatico', TRUE);

SET @config1 = LAST_INSERT_ID();
SET @config2 = @config1 + 1;
SET @config3 = @config1 + 2;

-- Horarios de riego programado
INSERT INTO horarios_riego (configuracion_id, dia_semana, hora_inicio, duracion_minutos, activo) VALUES 
(@config2, 1, '06:00:00', 20, TRUE), -- Lunes 6:00 AM
(@config2, 3, '06:00:00', 20, TRUE), -- Miércoles 6:00 AM
(@config2, 5, '06:00:00', 20, TRUE), -- Viernes 6:00 AM
(@config2, 1, '18:00:00', 15, TRUE), -- Lunes 6:00 PM
(@config2, 3, '18:00:00', 15, TRUE), -- Miércoles 6:00 PM
(@config2, 5, '18:00:00', 15, TRUE); -- Viernes 6:00 PM

-- Lecturas de sensores (últimas 24 horas)
-- Temperatura Dispositivo 1
INSERT INTO lecturas (sensor_id, valor, fecha_lectura) VALUES 
(@sensor_temp_d1, 20.0, DATE_SUB(NOW(), INTERVAL 24 HOUR)),
(@sensor_temp_d1, 20.5, DATE_SUB(NOW(), INTERVAL 20 HOUR)),
(@sensor_temp_d1, 21.0, DATE_SUB(NOW(), INTERVAL 16 HOUR)),
(@sensor_temp_d1, 23.5, DATE_SUB(NOW(), INTERVAL 12 HOUR)),
(@sensor_temp_d1, 25.0, DATE_SUB(NOW(), INTERVAL 8 HOUR)),
(@sensor_temp_d1, 24.0, DATE_SUB(NOW(), INTERVAL 4 HOUR)),
(@sensor_temp_d1, 22.5, NOW());

-- Humedad Ambiente Dispositivo 1
INSERT INTO lecturas (sensor_id, valor, fecha_lectura) VALUES 
(@sensor_hum_amb_d1, 60.0, DATE_SUB(NOW(), INTERVAL 24 HOUR)),
(@sensor_hum_amb_d1, 59.0, DATE_SUB(NOW(), INTERVAL 20 HOUR)),
(@sensor_hum_amb_d1, 58.0, DATE_SUB(NOW(), INTERVAL 16 HOUR)),
(@sensor_hum_amb_d1, 56.0, DATE_SUB(NOW(), INTERVAL 12 HOUR)),
(@sensor_hum_amb_d1, 54.0, DATE_SUB(NOW(), INTERVAL 8 HOUR)),
(@sensor_hum_amb_d1, 55.5, DATE_SUB(NOW(), INTERVAL 4 HOUR)),
(@sensor_hum_amb_d1, 55.0, NOW());

-- Humedad Suelo
INSERT INTO lecturas (sensor_id, valor, fecha_lectura) VALUES 
(@sensor_hum_suelo_d1, 65.0, DATE_SUB(NOW(), INTERVAL 24 HOUR)),
(@sensor_hum_suelo_d1, 58.0, DATE_SUB(NOW(), INTERVAL 18 HOUR)),
(@sensor_hum_suelo_d1, 52.0, DATE_SUB(NOW(), INTERVAL 12 HOUR)),
(@sensor_hum_suelo_d1, 45.0, DATE_SUB(NOW(), INTERVAL 6 HOUR)),
(@sensor_hum_suelo_d1, 38.0, DATE_SUB(NOW(), INTERVAL 2 HOUR)),
(@sensor_hum_suelo_d1, 62.0, NOW()); -- Después del riego

-- Nivel de agua
INSERT INTO lecturas (sensor_id, valor, fecha_lectura) VALUES 
(@sensor_nivel_d1, 85.0, DATE_SUB(NOW(), INTERVAL 24 HOUR)),
(@sensor_nivel_d1, 78.0, DATE_SUB(NOW(), INTERVAL 12 HOUR)),
(@sensor_nivel_d1, 72.0, NOW());

-- Eventos de riego (últimos 7 días)
INSERT INTO eventos_riego (dispositivo_id, actuador_id, accion, modo, duracion_segundos, usuario_id, fecha_evento) VALUES 
(@disp1, @act_bomba_d1, 'inicio', 'programado', NULL, NULL, DATE_SUB(NOW(), INTERVAL 7 DAY)),
(@disp1, @act_bomba_d1, 'fin', 'programado', 1200, NULL, DATE_SUB(NOW(), INTERVAL 7 DAY) + INTERVAL 20 MINUTE),
(@disp1, @act_bomba_d1, 'inicio', 'automatico', NULL, NULL, DATE_SUB(NOW(), INTERVAL 5 DAY)),
(@disp1, @act_bomba_d1, 'fin', 'automatico', 900, NULL, DATE_SUB(NOW(), INTERVAL 5 DAY) + INTERVAL 15 MINUTE),
(@disp1, @act_bomba_d1, 'inicio', 'manual', NULL, 1, DATE_SUB(NOW(), INTERVAL 2 DAY)),
(@disp1, @act_bomba_d1, 'fin', 'manual', 600, 1, DATE_SUB(NOW(), INTERVAL 2 DAY) + INTERVAL 10 MINUTE),
(@disp1, @act_bomba_d1, 'inicio', 'automatico', NULL, NULL, DATE_SUB(NOW(), INTERVAL 2 HOUR)),
(@disp1, @act_bomba_d1, 'fin', 'automatico', 900, NULL, DATE_SUB(NOW(), INTERVAL 2 HOUR) + INTERVAL 15 MINUTE);

-- Historial Automático
INSERT INTO historial_automatico (invernadero_id, fecha, hora, temp, humedad, estado) VALUES 
(1, CURDATE(), '06:00:00', 19.5, 62.0, 'Normal'),
(1, CURDATE(), '08:00:00', 21.5, 54.0, 'Normal'),
(1, CURDATE(), '10:00:00', 23.5, 52.0, 'Normal'),
(1, CURDATE(), '12:00:00', 25.5, 48.0, 'Alerta Temp Alta'),
(1, CURDATE(), '14:00:00', 26.0, 45.0, 'Alerta Temp Alta'),
(1, CURDATE(), '16:00:00', 24.0, 50.0, 'Normal'),
(1, CURDATE(), '18:00:00', 22.5, 55.0, 'Normal');

-- Historial de Acciones
INSERT INTO historial_acciones (invernadero_id, fecha, hora, temp, humedad, usuario_id, accion_id, estado) VALUES 
(1, CURDATE() - INTERVAL 1 DAY, '08:05:00', 21.0, 56.0, 1, 1, 'Ejecutado'),
(1, CURDATE() - INTERVAL 1 DAY, '12:00:00', 25.5, 48.0, 1, 3, 'Ejecutado'),
(1, CURDATE(), '08:10:00', 21.5, 54.0, 1, 1, 'Ejecutado'),
(2, CURDATE(), '07:05:00', 14.5, 72.0, 1, 5, 'Ejecutado'),
(3, CURDATE(), '09:15:00', 21.0, 60.0, 2, 4, 'Ejecutado');

-- Alertas
INSERT INTO alertas (dispositivo_id, tipo, severidad, mensaje, leida, fecha_creacion, fecha_lectura) VALUES 
(@disp1, 'sensor_fuera_rango', 'media', 'Temperatura alta detectada: 26.0°C (máximo ideal: 24.0°C)', TRUE, DATE_SUB(NOW(), INTERVAL 2 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY)),
(@disp1, 'bajo_nivel_agua', 'alta', 'Nivel de agua bajo 30%: 28%', FALSE, DATE_SUB(NOW(), INTERVAL 1 DAY), NULL),
(@disp3, 'dispositivo_offline', 'critica', 'Dispositivo sin conexión por más de 4 días', FALSE, DATE_SUB(NOW(), INTERVAL 4 DAY), NULL),
(@disp1, 'sensor_fuera_rango', 'baja', 'Humedad del suelo baja: 38%', TRUE, DATE_SUB(NOW(), INTERVAL 3 HOUR), DATE_SUB(NOW(), INTERVAL 2 HOUR)),
(@disp2, 'sensor_fuera_rango', 'media', 'Temperatura baja en semillero: 12.5°C', FALSE, NOW(), NULL);

-- Logs del sistema
INSERT INTO logs_sistema (nivel, modulo, mensaje, dispositivo_id, usuario_id, ip_address, fecha_log) VALUES 
('info', 'system', 'Sistema iniciado correctamente', NULL, NULL, '192.168.1.100', DATE_SUB(NOW(), INTERVAL 7 DAY)),
('info', 'mqtt', 'Cliente MQTT conectado exitosamente', NULL, NULL, '192.168.1.100', DATE_SUB(NOW(), INTERVAL 7 DAY)),
('info', 'device', 'Dispositivo conectado', @disp1, NULL, '192.168.1.50', DATE_SUB(NOW(), INTERVAL 7 DAY)),
('warning', 'sensor', 'Lectura de sensor fuera de rango', @disp1, NULL, '192.168.1.50', DATE_SUB(NOW(), INTERVAL 2 DAY)),
('error', 'device', 'Timeout en comunicación con dispositivo', @disp3, NULL, '192.168.1.52', DATE_SUB(NOW(), INTERVAL 4 DAY)),
('info', 'auth', 'Usuario inició sesión', NULL, 1, '192.168.1.105', DATE_SUB(NOW(), INTERVAL 1 DAY)),
('info', 'irrigation', 'Riego automático iniciado', @disp1, NULL, '192.168.1.50', DATE_SUB(NOW(), INTERVAL 2 HOUR)),
('info', 'irrigation', 'Riego automático finalizado', @disp1, NULL, '192.168.1.50', DATE_SUB(NOW(), INTERVAL 2 HOUR) + INTERVAL 15 MINUTE);

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
SELECT 'Horarios', COUNT(*) FROM horarios_riego
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
