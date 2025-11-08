-- ============================================
-- DATOS DE EJEMPLO PARA EL SISTEMA DE RIEGO
-- Ejecutar en Supabase SQL Editor
-- ============================================

-- IMPORTANTE: Este script inserta datos de ejemplo para probar el sistema
-- Puedes modificar los valores según tus necesidades

-- ============================================
-- 1. GREENHOUSES (Invernaderos)
-- ============================================

-- Ya existe "casa" con id=1, agregar más
INSERT INTO greenhouses (id, name, location) VALUES 
    (2, 'Invernadero Norte', 'Sector Industrial'),
    (3, 'Invernadero Sur', 'Zona Agrícola')
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 2. ZONE (Zonas dentro de invernaderos)
-- ============================================

INSERT INTO zone (id, name, description, greenhouseid) VALUES 
    -- Zonas para "casa" (id=1)
    (1, 'Zona A', 'Cultivos de hortalizas', 1),
    (2, 'Zona B', 'Área de germinación', 1),
    
    -- Zonas para "Invernadero Norte" (id=2)
    (3, 'Zona Tomates', 'Cultivo principal de tomates', 2),
    (4, 'Zona Lechugas', 'Lechugas hidropónicas', 2),
    
    -- Zonas para "Invernadero Sur" (id=3)
    (5, 'Zona Experimental', 'Pruebas de nuevos cultivos', 3)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 3. PLANTS (Plantas en cada zona)
-- ============================================

INSERT INTO plants (id, zoneid, "commonName", "scientificName", "optimalSoilHumidity", "soilHumidityMin", "optimalAmbientTemp") VALUES 
    -- Zona A (id=1)
    (1, 1, 'Tomate', 'Solanum lycopersicum', 65.0, 50.0, 22.0),
    (2, 1, 'Pepino', 'Cucumis sativus', 70.0, 55.0, 24.0),
    
    -- Zona B (id=2)
    (3, 2, 'Lechuga', 'Lactuca sativa', 70.0, 55.0, 18.0),
    (4, 2, 'Espinaca', 'Spinacia oleracea', 65.0, 50.0, 16.0),
    
    -- Zona Tomates (id=3)
    (5, 3, 'Tomate Cherry', 'Solanum lycopersicum var. cerasiforme', 65.0, 50.0, 23.0),
    
    -- Zona Lechugas (id=4)
    (6, 4, 'Lechuga Romana', 'Lactuca sativa var. longifolia', 68.0, 52.0, 18.0),
    (7, 4, 'Rúcula', 'Eruca vesicaria', 60.0, 45.0, 17.0),
    
    -- Zona Experimental (id=5)
    (8, 5, 'Fresa', 'Fragaria × ananassa', 65.0, 50.0, 20.0),
    (9, 5, 'Albahaca', 'Ocimum basilicum', 60.0, 45.0, 21.0)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 4. SENSORS (Sensores en cada zona)
-- ============================================

INSERT INTO sensors (id, zoneid, "sensorType", model, "installationDate") VALUES 
    -- Zona A (id=1)
    (1, 1, 'Humedad Suelo', 'DHT22', '2024-01-15'),
    (2, 1, 'Temperatura', 'DHT22', '2024-01-15'),
    (3, 1, 'Luz', 'BH1750', '2024-01-20'),
    
    -- Zona B (id=2)
    (4, 2, 'Humedad Suelo', 'DHT11', '2024-02-01'),
    (5, 2, 'Temperatura', 'DHT11', '2024-02-01'),
    
    -- Zona Tomates (id=3)
    (6, 3, 'Humedad Suelo', 'Capacitivo v1.2', '2024-03-10'),
    (7, 3, 'Temperatura', 'DS18B20', '2024-03-10'),
    (8, 3, 'pH', 'SEN0161', '2024-03-15'),
    
    -- Zona Lechugas (id=4)
    (9, 4, 'Humedad Suelo', 'Capacitivo v1.2', '2024-03-20'),
    (10, 4, 'Temperatura', 'DS18B20', '2024-03-20'),
    
    -- Zona Experimental (id=5)
    (11, 5, 'Humedad Suelo', 'DHT22', '2024-04-01'),
    (12, 5, 'Temperatura', 'DHT22', '2024-04-01'),
    (13, 5, 'Humedad Ambiente', 'DHT22', '2024-04-01')
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 5. ACTUATORS (Actuadores de riego)
-- ============================================

INSERT INTO "Actuators" (id, zoneid, name) VALUES 
    -- Zona A (id=1)
    (1, 1, 'Bomba Riego A1'),
    (2, 1, 'Válvula Principal A'),
    
    -- Zona B (id=2)
    (3, 2, 'Bomba Riego B1'),
    
    -- Zona Tomates (id=3)
    (4, 3, 'Sistema Goteo Tomates'),
    (5, 3, 'Válvula Norte'),
    
    -- Zona Lechugas (id=4)
    (6, 4, 'Sistema Hidropónico L1'),
    
    -- Zona Experimental (id=5)
    (7, 5, 'Bomba Experimental E1')
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 6. READINGS (Lecturas de sensores - últimas 24h)
-- ============================================

-- Generar lecturas para los últimos días
-- Sensor 1 (Humedad Suelo - Zona A)
INSERT INTO "Readings" (sensorid, value, "dateTime") VALUES 
    (1, 62.5, NOW() - INTERVAL '1 hour'),
    (1, 61.8, NOW() - INTERVAL '2 hours'),
    (1, 63.2, NOW() - INTERVAL '3 hours'),
    (1, 64.1, NOW() - INTERVAL '4 hours'),
    (1, 62.9, NOW() - INTERVAL '5 hours'),
    (1, 61.5, NOW() - INTERVAL '6 hours'),
    (1, 60.8, NOW() - INTERVAL '12 hours'),
    (1, 59.5, NOW() - INTERVAL '18 hours'),
    (1, 58.2, NOW() - INTERVAL '24 hours');

-- Sensor 2 (Temperatura - Zona A)
INSERT INTO "Readings" (sensorid, value, "dateTime") VALUES 
    (2, 22.5, NOW() - INTERVAL '1 hour'),
    (2, 23.1, NOW() - INTERVAL '2 hours'),
    (2, 23.8, NOW() - INTERVAL '3 hours'),
    (2, 24.2, NOW() - INTERVAL '4 hours'),
    (2, 23.5, NOW() - INTERVAL '5 hours'),
    (2, 22.8, NOW() - INTERVAL '6 hours'),
    (2, 21.5, NOW() - INTERVAL '12 hours'),
    (2, 20.2, NOW() - INTERVAL '18 hours'),
    (2, 19.8, NOW() - INTERVAL '24 hours');

-- Sensor 3 (Luz - Zona A)
INSERT INTO "Readings" (sensorid, value, "dateTime") VALUES 
    (3, 850.0, NOW() - INTERVAL '1 hour'),
    (3, 920.0, NOW() - INTERVAL '2 hours'),
    (3, 1100.0, NOW() - INTERVAL '3 hours'),
    (3, 1250.0, NOW() - INTERVAL '4 hours'),
    (3, 980.0, NOW() - INTERVAL '5 hours'),
    (3, 750.0, NOW() - INTERVAL '6 hours'),
    (3, 450.0, NOW() - INTERVAL '12 hours'),
    (3, 120.0, NOW() - INTERVAL '18 hours'),
    (3, 0.0, NOW() - INTERVAL '24 hours');

-- Sensor 4 (Humedad Suelo - Zona B)
INSERT INTO "Readings" (sensorid, value, "dateTime") VALUES 
    (4, 68.5, NOW() - INTERVAL '1 hour'),
    (4, 67.8, NOW() - INTERVAL '2 hours'),
    (4, 67.2, NOW() - INTERVAL '3 hours'),
    (4, 66.5, NOW() - INTERVAL '4 hours'),
    (4, 65.8, NOW() - INTERVAL '6 hours'),
    (4, 64.2, NOW() - INTERVAL '12 hours'),
    (4, 63.5, NOW() - INTERVAL '18 hours'),
    (4, 62.8, NOW() - INTERVAL '24 hours');

-- Sensor 5 (Temperatura - Zona B)
INSERT INTO "Readings" (sensorid, value, "dateTime") VALUES 
    (5, 18.5, NOW() - INTERVAL '1 hour'),
    (5, 19.2, NOW() - INTERVAL '2 hours'),
    (5, 19.8, NOW() - INTERVAL '3 hours'),
    (5, 20.1, NOW() - INTERVAL '4 hours'),
    (5, 19.5, NOW() - INTERVAL '6 hours'),
    (5, 18.2, NOW() - INTERVAL '12 hours'),
    (5, 17.5, NOW() - INTERVAL '18 hours'),
    (5, 16.8, NOW() - INTERVAL '24 hours');

-- Más lecturas para otros sensores (últimas 7 días)
-- Sensor 6 (Humedad - Zona Tomates)
INSERT INTO "Readings" (sensorid, value, "dateTime") 
SELECT 6, 
       60 + (random() * 10)::numeric(5,2), 
       NOW() - (interval '1 hour' * generate_series)
FROM generate_series(1, 168); -- 168 horas = 7 días

-- Sensor 7 (Temperatura - Zona Tomates)
INSERT INTO "Readings" (sensorid, value, "dateTime") 
SELECT 7, 
       20 + (random() * 5)::numeric(5,2), 
       NOW() - (interval '1 hour' * generate_series)
FROM generate_series(1, 168);

-- ============================================
-- 7. HISTORY IRRIGATION (Historial de riego)
-- ============================================

INSERT INTO "HistoryIrrigation" (id, actuatorid, "dateTimeStart", "dateTimeEnd", mode) VALUES 
    -- Riegos completados
    (1, 1, NOW() - INTERVAL '6 hours', NOW() - INTERVAL '5 hours 45 minutes', 'manual'),
    (2, 1, NOW() - INTERVAL '12 hours', NOW() - INTERVAL '11 hours 50 minutes', 'automatico'),
    (3, 1, NOW() - INTERVAL '18 hours', NOW() - INTERVAL '17 hours 55 minutes', 'automatico'),
    (4, 2, NOW() - INTERVAL '8 hours', NOW() - INTERVAL '7 hours 40 minutes', 'manual'),
    (5, 3, NOW() - INTERVAL '10 hours', NOW() - INTERVAL '9 hours 50 minutes', 'automatico'),
    (6, 4, NOW() - INTERVAL '5 hours', NOW() - INTERVAL '4 hours 45 minutes', 'manual'),
    (7, 5, NOW() - INTERVAL '7 hours', NOW() - INTERVAL '6 hours 50 minutes', 'automatico'),
    
    -- Riego reciente completado
    (8, 1, NOW() - INTERVAL '1 hour', NOW() - INTERVAL '50 minutes', 'manual')
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 8. VERIFICACIÓN DE DATOS INSERTADOS
-- ============================================

SELECT 'RESUMEN DE DATOS INSERTADOS' as info;

SELECT 'greenhouses' as tabla, COUNT(*) as total FROM greenhouses
UNION ALL
SELECT 'zone', COUNT(*) FROM zone
UNION ALL
SELECT 'plants', COUNT(*) FROM plants
UNION ALL
SELECT 'sensors', COUNT(*) FROM sensors
UNION ALL
SELECT 'Readings', COUNT(*) FROM "Readings"
UNION ALL
SELECT 'Actuators', COUNT(*) FROM "Actuators"
UNION ALL
SELECT 'HistoryIrrigation', COUNT(*) FROM "HistoryIrrigation";

-- ============================================
-- ¡LISTO! Ahora tienes datos de ejemplo
-- ============================================

-- Puedes verificar con:
-- SELECT * FROM greenhouses;
-- SELECT * FROM zone WHERE greenhouseId = 1;
-- SELECT * FROM sensors WHERE zoneId = 1;
-- etc.
