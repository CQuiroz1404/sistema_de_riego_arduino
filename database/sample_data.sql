-- ============================================
-- Datos de Ejemplo para Sistema de Riego
-- ============================================

USE sistema_riego;

-- 1. Usuarios
-- Password es '123456' (hash bcrypt aproximado para ejemplo, en producción usar hash real)

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


-- 7. Semanas (Ciclo de Cultivo)
INSERT INTO semanas (nombre) VALUES 
('Semana 1 - Germinación'),
('Semana 2 - Plántula'),
('Semana 3 - Crecimiento Vegetativo'),
('Semana 4 - Floración'),
('Semana 5 - Fructificación'),
('Semana 6 - Maduración'),
('Semana 7 - Cosecha');

-- 8. Accionesdispositivos
INSERT INTO acciones (nombre) VALUES 
('Regar'),
('Fertilizar'),
('Podar'),
('Transplantar'),
('Aplicar Insecticida'),
('Cosechar');

-- 10. Sensores
-- IDs asumidos: Dispositivo 1
INSERT INTO sensores (dispositivo_id, nombre, tipo, pin, unidad, valor_minimo, valor_maximo, activo) VALUES 
(1, 'Sensor Humedad Suelo', 'humedad_suelo', 'A0', '%', 20.00, 90.00, 1),
(1, 'Sensor Temperatura Aire', 'temperatura', 'D2', '°C', 0.00, 50.00, 1),
(1, 'Sensor Humedad Aire', 'humedad_ambiente', 'D2', '%', 20.00, 100.00, 1);

-- 11. Actuadores
INSERT INTO actuadores (dispositivo_id, nombre, tipo, pin, estado, activo) VALUES 
(1, 'Bomba de Agua Principal', 'bomba', 'D8', 'apagado', 1),