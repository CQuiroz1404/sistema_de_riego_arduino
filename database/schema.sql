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
-- Datos iniciales
-- ============================================

-- Usuario administrador por defecto (password: admin123)
INSERT INTO usuarios (nombre, email, password, rol) VALUES 
('Administrador', 'admin@sistemariego.com', '$2a$10$X5awRj/jEU2RZn4fvmEKb.8jKB7X5whAa8Ri45UnO//atW/eci.ge', 'admin');

-- Usuario de prueba (password: usuario123)
INSERT INTO usuarios (nombre, email, password, rol) VALUES 
('Usuario Demo', 'usuario@sistemariego.com', '$2a$10$OQvCO1kfH3rENq39f8P4A.paftefaep/vOuI48VdRLmBx6EvGTrgu', 'usuario');

-- ============================================
-- Vistas útiles
-- ============================================

-- Vista: Estado actual de dispositivos
CREATE OR REPLACE VIEW vista_estado_dispositivos AS
SELECT 
    d.id,
    d.nombre,
    d.ubicacion,
    d.estado,
    d.ultima_conexion,
    COUNT(DISTINCT s.id) as total_sensores,
    COUNT(DISTINCT a.id) as total_actuadores,
    u.nombre as propietario
FROM dispositivos d
LEFT JOIN sensores s ON d.id = s.dispositivo_id AND s.activo = TRUE
LEFT JOIN actuadores a ON d.id = a.dispositivo_id AND a.activo = TRUE
LEFT JOIN usuarios u ON d.usuario_id = u.id
GROUP BY d.id;

-- Vista: Últimas lecturas de sensores
CREATE OR REPLACE VIEW vista_ultimas_lecturas AS
SELECT 
    s.id as sensor_id,
    s.nombre as sensor_nombre,
    s.tipo,
    s.unidad,
    l.valor,
    l.fecha_lectura,
    d.id as dispositivo_id,
    d.nombre as dispositivo_nombre
FROM sensores s
INNER JOIN dispositivos d ON s.dispositivo_id = d.id
LEFT JOIN lecturas l ON s.id = l.sensor_id
WHERE l.id IN (
    SELECT MAX(l2.id) 
    FROM lecturas l2 
    WHERE l2.sensor_id = s.id
)
ORDER BY l.fecha_lectura DESC;

-- Vista: Resumen de riegos del día
CREATE OR REPLACE VIEW vista_riegos_hoy AS
SELECT 
    d.nombre as dispositivo,
    a.nombre as actuador,
    COUNT(*) / 2 as veces_regado,
    SUM(CASE WHEN er.accion = 'fin' THEN er.duracion_segundos ELSE 0 END) as tiempo_total_segundos,
    MAX(er.fecha_evento) as ultimo_riego
FROM eventos_riego er
JOIN dispositivos d ON er.dispositivo_id = d.id
JOIN actuadores a ON er.actuador_id = a.id
WHERE DATE(er.fecha_evento) = CURDATE()
GROUP BY d.id, a.id;

-- ============================================
-- Procedimientos almacenados
-- ============================================

DELIMITER //

-- Procedimiento: Registrar evento de riego
CREATE PROCEDURE IF NOT EXISTS sp_registrar_evento_riego(
    IN p_dispositivo_id INT,
    IN p_actuador_id INT,
    IN p_accion ENUM('inicio', 'fin'),
    IN p_modo ENUM('manual', 'automatico', 'programado'),
    IN p_duracion_segundos INT,
    IN p_usuario_id INT
)
BEGIN
    INSERT INTO eventos_riego (dispositivo_id, actuador_id, accion, modo, duracion_segundos, usuario_id)
    VALUES (p_dispositivo_id, p_actuador_id, p_accion, p_modo, p_duracion_segundos, p_usuario_id);
    
    -- Actualizar estado del actuador
    UPDATE actuadores 
    SET estado = IF(p_accion = 'inicio', 'encendido', 'apagado')
    WHERE id = p_actuador_id;
END //

-- Procedimiento: Limpiar lecturas antiguas (más de 30 días)
CREATE PROCEDURE IF NOT EXISTS sp_limpiar_lecturas_antiguas()
BEGIN
    DECLARE registros_eliminados INT;
    
    DELETE FROM lecturas 
    WHERE fecha_lectura < DATE_SUB(NOW(), INTERVAL 30 DAY);
    
    SET registros_eliminados = ROW_COUNT();
    
    INSERT INTO logs_sistema (nivel, modulo, mensaje)
    VALUES ('info', 'mantenimiento', CONCAT('Lecturas antiguas eliminadas: ', registros_eliminados));
END //

DELIMITER ;

-- ============================================
-- Eventos programados
-- ============================================

-- Limpiar lecturas antiguas cada semana
-- CREATE EVENT IF NOT EXISTS evt_limpiar_lecturas
-- ON SCHEDULE EVERY 1 WEEK
-- STARTS CURRENT_TIMESTAMP
-- DO CALL sp_limpiar_lecturas_antiguas();

-- ============================================
-- Permisos (ajustar según necesidad)
-- ============================================
-- GRANT ALL PRIVILEGES ON sistema_riego.* TO 'usuario_riego'@'localhost' IDENTIFIED BY 'password_seguro';
-- FLUSH PRIVILEGES;

-- ============================================
-- Fin del script
-- ============================================
