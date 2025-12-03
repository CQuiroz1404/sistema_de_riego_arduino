-- ============================================
-- Datos de Ejemplo para Sistema de Riego
-- ============================================

USE sistema_riego;

-- 1. Usuarios
-- Password es '123456' (hash bcrypt aproximado para ejemplo, en producción usar hash real)
INSERT INTO usuarios (nombre, email, password, rol, rut, activo) VALUES 
('Administrador', 'admin@sistema.com', '$2b$10$X7V.j.X7V.j.X7V.j.X7V.j.X7V.j.X7V.j.X7V.j.X7V.j.X7V.j', 'admin', '11111111-1', 1),
('Usuario Demo', 'user@sistema.com', '$2b$10$X7V.j.X7V.j.X7V.j.X7V.j.X7V.j.X7V.j.X7V.j.X7V.j.X7V.j', 'usuario', '22222222-2', 1);

-- 2. Tipos de Planta
INSERT INTO tipo_planta (nombre, estado) VALUES 
('Hortaliza', 1),
('Frutal', 1),
('Ornamental', 1),
('Aromática', 1),
('Suculenta', 1);

-- 3. Rangos de Temperatura
INSERT INTO rango_temperatura (temp_min, temp_max, estado) VALUES 
(10.00, 20.00, 1), -- Clima Frío
(18.00, 28.00, 1), -- Clima Templado
(25.00, 35.00, 1); -- Clima Cálido

-- 4. Rangos de Humedad
INSERT INTO rango_humedad (hum_min, hum_max, estado) VALUES 
(30.00, 50.00, 1), -- Baja
(40.00, 70.00, 1), -- Media
(60.00, 90.00, 1); -- Alta

-- 5. Plantas
-- Asumiendo IDs secuenciales: 
-- Tomate: Hortaliza (1), Templado (2), Media (2)
-- Lechuga: Hortaliza (1), Frío (1), Alta (3)
-- Albahaca: Aromática (4), Cálido (3), Media (2)
INSERT INTO plantas (nombre, tipo_planta_id, rango_temperatura_id, rango_humedad_id, estado) VALUES 
('Tomate Cherry', 1, 2, 2, 1),
('Lechuga Hidropónica', 1, 1, 3, 1),
('Albahaca Genovesa', 4, 3, 2, 1),
('Cactus', 5, 3, 1, 1);

-- 6. Invernaderos
INSERT INTO invernaderos (descripcion, ubicacion, planta_id, riego, temp_actual, hum_actual, estado) VALUES 
('Invernadero Principal', 'Patio Trasero', 1, 0, 24.5, 65.0, 1),
('Semillero Interior', 'Laboratorio', 2, 0, 20.0, 80.0, 1);

-- 7. Semanas (Ciclo de Cultivo)
INSERT INTO semanas (nombre) VALUES 
('Semana 1 - Germinación'),
('Semana 2 - Plántula'),
('Semana 3 - Crecimiento Vegetativo'),
('Semana 4 - Floración'),
('Semana 5 - Fructificación'),
('Semana 6 - Maduración'),
('Semana 7 - Cosecha');

-- 8. Acciones
INSERT INTO acciones (nombre) VALUES 
('Regar'),
('Fertilizar'),
('Podar'),
('Transplantar'),
('Aplicar Insecticida'),
('Cosechar');

-- 9. Dispositivos IoT
INSERT INTO dispositivos (nombre, ubicacion, descripcion, api_key, estado, usuario_id, invernadero_id) VALUES 
('Arduino Uno R4 WiFi', 'Invernadero Principal', 'Controlador central de riego', 'api_key_demo_12345', 'activo', 1, 1);

-- 10. Sensores
-- IDs asumidos: Dispositivo 1
INSERT INTO sensores (dispositivo_id, nombre, tipo, pin, unidad, valor_minimo, valor_maximo, activo) VALUES 
(1, 'Sensor Humedad Suelo', 'humedad_suelo', 'A0', '%', 20.00, 90.00, 1),
(1, 'Sensor Temperatura Aire', 'temperatura', 'D2', '°C', 0.00, 50.00, 1),
(1, 'Sensor Humedad Aire', 'humedad_ambiente', 'D2', '%', 20.00, 100.00, 1);

-- 11. Actuadores
INSERT INTO actuadores (dispositivo_id, nombre, tipo, pin, estado, activo) VALUES 
(1, 'Bomba de Agua Principal', 'bomba', 'D8', 'apagado', 1),
(1, 'Ventilador', 'valvula', 'D9', 'apagado', 1);

-- 12. Configuraciones de Riego
INSERT INTO configuraciones_riego (dispositivo_id, nombre, sensor_id, actuador_id, umbral_inferior, umbral_superior, duracion_minutos, modo, activo) VALUES 
(1, 'Riego Automático Tomates', 1, 1, 30.00, 70.00, 5, 'automatico', 1);

-- 13. Calendario (Ejemplo)
-- Invernadero 1, Semana 1, Lunes, 8am
INSERT INTO calendario (invernadero_id, semana_id, dia_semana, hora_inicial, hora_final, usuario_id, estado) VALUES 
(1, 1, 'Lunes', '08:00:00', '08:30:00', 1, 1),
(1, 1, 'Miércoles', '08:00:00', '08:30:00', 1, 1),
(1, 1, 'Viernes', '08:00:00', '08:30:00', 1, 1);

SELECT '✅ Datos de ejemplo insertados correctamente' AS status;
