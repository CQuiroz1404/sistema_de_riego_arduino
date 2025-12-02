-- ============================================
-- Datos de Ejemplo Completos (Sistema de Riego IoT)
-- ============================================
-- Este script puebla todas las tablas del sistema
-- Ejecuta DESPUÉS de schema.sql

USE sistema_riego;

-- ============================================
-- 0. ACTUALIZACIÓN DE USUARIOS (RUT)
-- ============================================
-- Actualizar usuarios existentes con RUT válido (necesario para la nueva lógica de Auth)
UPDATE usuarios SET rut = '12.345.678-9' WHERE email = 'admin@sistemariego.com';
UPDATE usuarios SET rut = '98.765.432-1' WHERE email = 'usuario@sistemariego.com';

-- ============================================
-- 1. DATOS MAESTROS (Nuevas Tablas)
-- ============================================

-- Tipos de Planta
INSERT INTO tipo_planta (nombre, estado) VALUES 
('Hortaliza', 1),
('Frutal', 1),
('Ornamental', 1),
('Aromática', 1);

-- Rangos de Temperatura
INSERT INTO rango_temperatura (temp_min, temp_max, estado) VALUES 
(18.00, 24.00, 1), -- Templado (Ideal Tomate)
(24.00, 30.00, 1), -- Cálido
(10.00, 18.00, 1); -- Frío (Ideal Lechuga)

-- Rangos de Humedad
INSERT INTO rango_humedad (hum_min, hum_max, estado) VALUES 
(40.00, 60.00, 1), -- Moderada (Ideal Tomate)
(60.00, 80.00, 1), -- Alta (Ideal Lechuga)
(20.00, 40.00, 1); -- Baja

-- Plantas
INSERT INTO plantas (nombre, tipo_planta_id, rango_temperatura_id, rango_humedad_id, estado) VALUES 
('Tomate Cherry', 1, 1, 1, 1), -- Temp: 18-24, Hum: 40-60
('Lechuga', 1, 3, 2, 1),       -- Temp: 10-18, Hum: 60-80
('Albahaca', 4, 2, 1, 1),
('Pimiento', 1, 2, 1, 1);

-- Invernaderos
-- Nota: Los valores actuales coincidirán con las últimas lecturas de los sensores
INSERT INTO invernaderos (descripcion, planta_id, riego, temp_actual, hum_actual, estado) VALUES 
('Invernadero Principal', 1, 0, 22.5, 55.0, 1), -- Asignado a Tomate Cherry
('Invernadero Semilleros', 2, 0, 15.0, 70.0, 1), -- Asignado a Lechuga
('Invernadero Experimental', 3, 1, 28.0, 45.0, 1);

-- Semanas
INSERT INTO semanas (nombre) VALUES 
('Semana 1 - Germinación'),
('Semana 2 - Crecimiento Vegetativo'),
('Semana 3 - Floración'),
('Semana 4 - Fructificación'),
('Semana 5 - Cosecha');

-- Acciones
INSERT INTO acciones (nombre) VALUES 
('Riego por Goteo'),
('Ventilación'),
('Fertirrigación'),
('Nebulización'),
('Control de Plagas');

-- Calendario
INSERT INTO calendario (invernadero_id, semana_id, hora_inicial, usuario_id, hora_final, estado) VALUES 
(1, 1, '08:00:00', 1, '08:30:00', 1),
(1, 1, '18:00:00', 1, '18:30:00', 1),
(2, 2, '07:00:00', 1, '07:15:00', 1);

-- Historial Automático (Simulado)
INSERT INTO historial_automatico (invernadero_id, fecha, hora, temp, humedad, estado) VALUES 
(1, CURDATE(), '08:00:00', 21.5, 54.0, 'Normal'),
(1, CURDATE(), '09:00:00', 22.0, 53.5, 'Normal'),
(1, CURDATE(), '10:00:00', 23.5, 52.0, 'Alerta Temp Alta');

-- Historial Acciones
INSERT INTO historial_acciones (invernadero_id, fecha, hora, temp, humedad, usuario_id, accion_id, estado) VALUES 
(1, CURDATE(), '08:05:00', 21.5, 54.0, 1, 1, 'Ejecutado'),
(1, CURDATE(), '12:00:00', 25.0, 50.0, 1, 2, 'Ejecutado');

-- ============================================
-- 2. HARDWARE (Dispositivos y Sensores)
-- ============================================

-- Dispositivo 1: Vinculado lógicamente al "Invernadero Principal"
INSERT INTO dispositivos (nombre, ubicacion, descripcion, api_key, estado, usuario_id) VALUES 
('Controlador Invernadero 1', 'Invernadero Principal', 'Control de riego para Tomates', 'api_key_inv_principal_001', 'activo', 1);

SET @dispositivo1_id = LAST_INSERT_ID();

-- Dispositivo 2: Vinculado lógicamente al "Invernadero Semilleros"
INSERT INTO dispositivos (nombre, ubicacion, descripcion, api_key, estado, usuario_id) VALUES 
('Controlador Semilleros', 'Invernadero Semilleros', 'Control de humedad para Lechugas', 'api_key_inv_semilleros_002', 'activo', 1);

SET @dispositivo2_id = LAST_INSERT_ID();

-- Sensores para Dispositivo 1 (Invernadero Principal)
-- NOTA: Actualizado para coincidir con la configuración física del usuario (Sin LM35)
INSERT INTO sensores (dispositivo_id, nombre, tipo, pin, unidad, valor_minimo, valor_maximo) VALUES 
(@dispositivo1_id, 'Temperatura Ambiente', 'temperatura', 'D2', '°C', -10, 50), -- DHT11 en D2
(@dispositivo1_id, 'Humedad Ambiente', 'humedad_ambiente', 'D2', '%', 0, 100), -- DHT11 en D2
(@dispositivo1_id, 'Nivel Tanque Principal', 'nivel_agua', 'A2', '%', 0, 100); -- Sensor Agua en A2

SET @sensor_temp_d1 = LAST_INSERT_ID(); -- ID base
SET @sensor_hum_amb_d1 = @sensor_temp_d1 + 1;
SET @sensor_nivel_d1 = @sensor_temp_d1 + 2;

-- Actuadores para Dispositivo 1
INSERT INTO actuadores (dispositivo_id, nombre, tipo, pin, estado) VALUES 
(@dispositivo1_id, 'Bomba Riego Tomates', 'bomba', 'D7', 'apagado'), -- Relé en Pin 7
(@dispositivo1_id, 'Ventilador Principal', 'electrovalvula', 'D2', 'apagado');

SET @actuador_bomba_d1 = LAST_INSERT_ID();

-- ============================================
-- 3. LECTURAS (Sincronizadas con Invernaderos)
-- ============================================

-- Lecturas Dispositivo 1 (Invernadero Principal)
-- Objetivo: Terminar en Temp 22.5 y Hum 55.0 para coincidir con la tabla 'invernaderos'

-- Humedad (Tendencia a 55%)
INSERT INTO lecturas (sensor_id, valor, fecha_lectura) VALUES 
(@sensor_hum_amb_d1, 60.0, DATE_SUB(NOW(), INTERVAL 5 HOUR)),
(@sensor_hum_amb_d1, 59.0, DATE_SUB(NOW(), INTERVAL 4 HOUR)),
(@sensor_hum_amb_d1, 58.0, DATE_SUB(NOW(), INTERVAL 3 HOUR)),
(@sensor_hum_amb_d1, 57.0, DATE_SUB(NOW(), INTERVAL 2 HOUR)),
(@sensor_hum_amb_d1, 56.0, DATE_SUB(NOW(), INTERVAL 1 HOUR)),
(@sensor_hum_amb_d1, 55.0, NOW()); -- Coincide con Invernadero Principal

-- Temperatura (Tendencia a 22.5°C)
INSERT INTO lecturas (sensor_id, valor, fecha_lectura) VALUES 
(@sensor_temp_d1, 20.0, DATE_SUB(NOW(), INTERVAL 5 HOUR)),
(@sensor_temp_d1, 20.5, DATE_SUB(NOW(), INTERVAL 4 HOUR)),
(@sensor_temp_d1, 21.0, DATE_SUB(NOW(), INTERVAL 3 HOUR)),
(@sensor_temp_d1, 21.5, DATE_SUB(NOW(), INTERVAL 2 HOUR)),
(@sensor_temp_d1, 22.0, DATE_SUB(NOW(), INTERVAL 1 HOUR)),
(@sensor_temp_d1, 22.5, NOW()); -- Coincide con Invernadero Principal

-- ============================================
-- 4. CONFIGURACIONES Y EVENTOS
-- ============================================

-- Configuración Riego Tomates
INSERT INTO configuraciones_riego (dispositivo_id, nombre, sensor_id, actuador_id, umbral_inferior, umbral_superior, duracion_minutos, modo) VALUES 
(@dispositivo1_id, 'Riego Automático Tomates', @sensor_hum_amb_d1, @actuador_bomba_d1, 40.0, 60.0, 15, 'automatico');

SET @config_id = LAST_INSERT_ID();

-- Horarios
INSERT INTO horarios_riego (configuracion_id, dia_semana, hora_inicio, duracion_minutos) VALUES 
(@config_id, 1, '08:00:00', 15),
(@config_id, 3, '08:00:00', 15),
(@config_id, 5, '08:00:00', 15);

-- Eventos Recientes
INSERT INTO eventos_riego (dispositivo_id, actuador_id, accion, modo, duracion_segundos, usuario_id, fecha_evento) VALUES 
(@dispositivo1_id, @actuador_bomba_d1, 'inicio', 'automatico', NULL, NULL, DATE_SUB(NOW(), INTERVAL 24 HOUR)),
(@dispositivo1_id, @actuador_bomba_d1, 'fin', 'automatico', 900, NULL, DATE_SUB(NOW(), INTERVAL 24 HOUR) + INTERVAL 15 MINUTE);

-- Alertas
INSERT INTO alertas (dispositivo_id, tipo, severidad, mensaje, leida, fecha_creacion) VALUES 
(@dispositivo1_id, 'sensor_fuera_rango', 'baja', 'Temperatura levemente baja (18°C)', TRUE, DATE_SUB(NOW(), INTERVAL 2 DAY));

-- Logs
INSERT INTO logs_sistema (nivel, modulo, mensaje, dispositivo_id, usuario_id, fecha_log) VALUES 
('info', 'system', 'Sistema iniciado correctamente', NULL, NULL, NOW());

-- ============================================
-- Verificación
-- ============================================
SELECT 'Datos completos insertados correctamente' AS status;
SELECT COUNT(*) as invernaderos FROM invernaderos;
SELECT COUNT(*) as plantas FROM plantas;
SELECT COUNT(*) as dispositivos FROM dispositivos;
