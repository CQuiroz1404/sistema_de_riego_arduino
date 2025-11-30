-- ============================================
-- Actualizar sensores existentes para Arduino R4 WiFi
-- Sistema de Riego IoT Completo
-- ============================================
-- Los sensores del primer dispositivo son IDs 1, 2, 3
-- Arduino envía: LM35 (A1), DHT11 Temperatura (D2), DHT11 Humedad (D2)

-- Sensor ID 1: LM35 Temperatura del Suelo (ya existe como Humedad Suelo Tomates)
UPDATE sensores 
SET nombre = 'LM35 Temperatura Suelo',
    tipo = 'temperatura',
    pin = 'A1',
    unidad = '°C',
    valor_minimo = 0.0,
    valor_maximo = 50.0
WHERE id = 1;

-- Sensor ID 2: DHT11 Temperatura del Aire (ya existe como Temperatura Ambiente)
UPDATE sensores 
SET nombre = 'DHT11 Temperatura Aire',
    tipo = 'temperatura',
    pin = 'D2',
    unidad = '°C',
    valor_minimo = 0.0,
    valor_maximo = 50.0
WHERE id = 2;

-- Sensor ID 3: DHT11 Humedad del Aire (ya existe como Nivel Tanque Principal)
UPDATE sensores 
SET nombre = 'DHT11 Humedad Aire',
    tipo = 'humedad_ambiente',
    pin = 'D2',
    unidad = '%',
    valor_minimo = 0.0,
    valor_maximo = 100.0
WHERE id = 3;

-- ============================================
-- Actualizar configuración de riego automático
-- ============================================
-- La configuración de riego debe usar el sensor de Humedad Aire (ID 3)
UPDATE configuraciones_riego
SET sensor_id = 3,
    nombre = 'Riego Automático por Humedad Aire',
    umbral_inferior = 40.0,
    umbral_superior = 60.0
WHERE dispositivo_id = 1;

-- ============================================
-- Verificar resultado
-- ============================================
SELECT 
    id,
    dispositivo_id,
    nombre,
    tipo,
    pin,
    unidad,
    valor_minimo,
    valor_maximo,
    activo
FROM sensores
WHERE dispositivo_id = 1
ORDER BY id;
