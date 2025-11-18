-- ============================================
-- Datos de Ejemplo para Testing
-- ============================================
-- Este script agrega datos de prueba adicionales
-- Ejecuta DESPUÉS de schema.sql

USE sistema_riego;

-- ============================================
-- Dispositivo de ejemplo
-- ============================================
INSERT INTO dispositivos (nombre, ubicacion, descripcion, mac_address, api_key, estado, usuario_id) VALUES 
('Arduino Jardín Principal', 'Jardín trasero', 'Sistema de riego automático del jardín principal', 'AA:BB:CC:DD:EE:FF', 'ejemplo_api_key_12345678901234567890', 'activo', 1);

SET @dispositivo_id = LAST_INSERT_ID();

-- ============================================
-- Sensores de ejemplo
-- ============================================
INSERT INTO sensores (dispositivo_id, nombre, tipo, pin, unidad, valor_minimo, valor_maximo) VALUES 
(@dispositivo_id, 'Sensor Humedad Suelo Zona 1', 'humedad_suelo', 'A0', '%', 0, 100),
(@dispositivo_id, 'Sensor Temperatura Ambiente', 'temperatura', 'A1', '°C', -10, 50),
(@dispositivo_id, 'Sensor Nivel Tanque', 'nivel_agua', 'A2', 'cm', 0, 200);

SET @sensor_humedad_id = LAST_INSERT_ID();
SET @sensor_temp_id = @sensor_humedad_id + 1;
SET @sensor_nivel_id = @sensor_humedad_id + 2;

-- ============================================
-- Actuadores de ejemplo
-- ============================================
INSERT INTO actuadores (dispositivo_id, nombre, tipo, pin, estado) VALUES 
(@dispositivo_id, 'Bomba Principal', 'bomba', 'D1', 'apagado'),
(@dispositivo_id, 'Válvula Zona 1', 'electrovalvula', 'D2', 'apagado');

SET @actuador_bomba_id = LAST_INSERT_ID();
SET @actuador_valvula_id = @actuador_bomba_id + 1;

-- ============================================
-- Lecturas de ejemplo (últimas 24 horas)
-- ============================================

-- Lecturas de humedad (cada hora durante 24 horas)
INSERT INTO lecturas (sensor_id, valor, fecha_lectura) VALUES 
(@sensor_humedad_id, 45.5, DATE_SUB(NOW(), INTERVAL 24 HOUR)),
(@sensor_humedad_id, 44.2, DATE_SUB(NOW(), INTERVAL 23 HOUR)),
(@sensor_humedad_id, 43.8, DATE_SUB(NOW(), INTERVAL 22 HOUR)),
(@sensor_humedad_id, 42.5, DATE_SUB(NOW(), INTERVAL 21 HOUR)),
(@sensor_humedad_id, 41.0, DATE_SUB(NOW(), INTERVAL 20 HOUR)),
(@sensor_humedad_id, 39.5, DATE_SUB(NOW(), INTERVAL 19 HOUR)),
(@sensor_humedad_id, 38.2, DATE_SUB(NOW(), INTERVAL 18 HOUR)),
(@sensor_humedad_id, 37.0, DATE_SUB(NOW(), INTERVAL 17 HOUR)),
(@sensor_humedad_id, 35.5, DATE_SUB(NOW(), INTERVAL 16 HOUR)),
(@sensor_humedad_id, 34.0, DATE_SUB(NOW(), INTERVAL 15 HOUR)),
(@sensor_humedad_id, 32.5, DATE_SUB(NOW(), INTERVAL 14 HOUR)),
(@sensor_humedad_id, 31.0, DATE_SUB(NOW(), INTERVAL 13 HOUR)),
(@sensor_humedad_id, 55.0, DATE_SUB(NOW(), INTERVAL 12 HOUR)), -- Se regó
(@sensor_humedad_id, 60.5, DATE_SUB(NOW(), INTERVAL 11 HOUR)),
(@sensor_humedad_id, 58.2, DATE_SUB(NOW(), INTERVAL 10 HOUR)),
(@sensor_humedad_id, 56.0, DATE_SUB(NOW(), INTERVAL 9 HOUR)),
(@sensor_humedad_id, 54.5, DATE_SUB(NOW(), INTERVAL 8 HOUR)),
(@sensor_humedad_id, 52.8, DATE_SUB(NOW(), INTERVAL 7 HOUR)),
(@sensor_humedad_id, 51.0, DATE_SUB(NOW(), INTERVAL 6 HOUR)),
(@sensor_humedad_id, 49.5, DATE_SUB(NOW(), INTERVAL 5 HOUR)),
(@sensor_humedad_id, 48.0, DATE_SUB(NOW(), INTERVAL 4 HOUR)),
(@sensor_humedad_id, 46.5, DATE_SUB(NOW(), INTERVAL 3 HOUR)),
(@sensor_humedad_id, 45.0, DATE_SUB(NOW(), INTERVAL 2 HOUR)),
(@sensor_humedad_id, 43.5, DATE_SUB(NOW(), INTERVAL 1 HOUR)),
(@sensor_humedad_id, 42.0, NOW());

-- Lecturas de temperatura
INSERT INTO lecturas (sensor_id, valor, fecha_lectura) VALUES 
(@sensor_temp_id, 22.5, DATE_SUB(NOW(), INTERVAL 4 HOUR)),
(@sensor_temp_id, 24.0, DATE_SUB(NOW(), INTERVAL 3 HOUR)),
(@sensor_temp_id, 25.5, DATE_SUB(NOW(), INTERVAL 2 HOUR)),
(@sensor_temp_id, 26.0, DATE_SUB(NOW(), INTERVAL 1 HOUR)),
(@sensor_temp_id, 25.8, NOW());

-- Lecturas de nivel de agua
INSERT INTO lecturas (sensor_id, valor, fecha_lectura) VALUES 
(@sensor_nivel_id, 150.0, DATE_SUB(NOW(), INTERVAL 4 HOUR)),
(@sensor_nivel_id, 145.0, DATE_SUB(NOW(), INTERVAL 3 HOUR)),
(@sensor_nivel_id, 140.0, DATE_SUB(NOW(), INTERVAL 2 HOUR)),
(@sensor_nivel_id, 135.0, DATE_SUB(NOW(), INTERVAL 1 HOUR)),
(@sensor_nivel_id, 130.0, NOW());

-- ============================================
-- Configuración de riego automático
-- ============================================
INSERT INTO configuraciones_riego (dispositivo_id, nombre, sensor_id, actuador_id, umbral_inferior, umbral_superior, duracion_minutos, modo) VALUES 
(@dispositivo_id, 'Riego Automático Zona 1', @sensor_humedad_id, @actuador_bomba_id, 30.0, 60.0, 15, 'automatico');

SET @config_id = LAST_INSERT_ID();

-- ============================================
-- Horarios de riego programado
-- ============================================
INSERT INTO horarios_riego (configuracion_id, dia_semana, hora_inicio, duracion_minutos) VALUES 
(@config_id, 1, '06:00:00', 15), -- Lunes 6:00 AM
(@config_id, 1, '18:00:00', 10), -- Lunes 6:00 PM
(@config_id, 3, '06:00:00', 15), -- Miércoles 6:00 AM
(@config_id, 3, '18:00:00', 10), -- Miércoles 6:00 PM
(@config_id, 5, '06:00:00', 15), -- Viernes 6:00 AM
(@config_id, 5, '18:00:00', 10); -- Viernes 6:00 PM

-- ============================================
-- Eventos de riego (historial)
-- ============================================
INSERT INTO eventos_riego (dispositivo_id, actuador_id, accion, modo, duracion_segundos, usuario_id, fecha_evento) VALUES 
(@dispositivo_id, @actuador_bomba_id, 'inicio', 'automatico', NULL, NULL, DATE_SUB(NOW(), INTERVAL 12 HOUR)),
(@dispositivo_id, @actuador_bomba_id, 'fin', 'automatico', 900, NULL, DATE_SUB(NOW(), INTERVAL 12 HOUR) + INTERVAL 15 MINUTE),
(@dispositivo_id, @actuador_bomba_id, 'inicio', 'manual', NULL, 1, DATE_SUB(NOW(), INTERVAL 6 HOUR)),
(@dispositivo_id, @actuador_bomba_id, 'fin', 'manual', 600, 1, DATE_SUB(NOW(), INTERVAL 6 HOUR) + INTERVAL 10 MINUTE);

-- ============================================
-- Alertas de ejemplo
-- ============================================
INSERT INTO alertas (dispositivo_id, tipo, severidad, mensaje, leida, fecha_creacion) VALUES 
(@dispositivo_id, 'sensor_fuera_rango', 'media', 'Humedad del suelo por debajo del 30%', FALSE, DATE_SUB(NOW(), INTERVAL 3 HOUR)),
(@dispositivo_id, 'bajo_nivel_agua', 'alta', 'Nivel de agua en tanque bajo (130 cm)', FALSE, NOW());

-- ============================================
-- Logs del sistema
-- ============================================
INSERT INTO logs_sistema (nivel, modulo, mensaje, dispositivo_id, usuario_id, fecha_log) VALUES 
('info', 'auth', 'Login exitoso: admin@sistemariego.com', NULL, 1, DATE_SUB(NOW(), INTERVAL 1 DAY)),
('info', 'devices', 'Nuevo dispositivo creado: Arduino Jardín Principal', @dispositivo_id, 1, DATE_SUB(NOW(), INTERVAL 1 DAY)),
('info', 'irrigation', 'Riego automático iniciado en Bomba Principal', @dispositivo_id, NULL, DATE_SUB(NOW(), INTERVAL 12 HOUR)),
('info', 'irrigation', 'Riego automático detenido en Bomba Principal', @dispositivo_id, NULL, DATE_SUB(NOW(), INTERVAL 12 HOUR) + INTERVAL 15 MINUTE),
('warning', 'sensors', 'Sensor Humedad Suelo Zona 1: Valor bajo (32.5%)', @dispositivo_id, NULL, DATE_SUB(NOW(), INTERVAL 3 HOUR));

-- ============================================
-- Verificar datos insertados
-- ============================================
SELECT 'Datos de ejemplo insertados correctamente' AS status;
SELECT COUNT(*) as total_usuarios FROM usuarios;
SELECT COUNT(*) as total_dispositivos FROM dispositivos;
SELECT COUNT(*) as total_sensores FROM sensores;
SELECT COUNT(*) as total_actuadores FROM actuadores;
SELECT COUNT(*) as total_lecturas FROM lecturas;
SELECT COUNT(*) as total_configuraciones FROM configuraciones_riego;
SELECT COUNT(*) as total_eventos FROM eventos_riego;
SELECT COUNT(*) as total_alertas FROM alertas;
