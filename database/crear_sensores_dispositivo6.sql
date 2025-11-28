-- ============================================
-- Crear sensores para dispositivo 6 (arduino prueba)
-- ============================================
-- El Arduino está usando el API Key del dispositivo 6
-- pero ese dispositivo no tiene sensores registrados

-- Crear los 3 sensores para dispositivo 6
INSERT INTO sensores (dispositivo_id, nombre, tipo, pin, unidad, valor_minimo, valor_maximo, activo)
VALUES 
(6, 'LM35 Temperatura Suelo', 'temperatura', 'A1', '°C', 0.0, 50.0, 1),
(6, 'DHT11 Temperatura Aire', 'temperatura', 'D2', '°C', 0.0, 50.0, 1),
(6, 'DHT11 Humedad Aire', 'humedad_ambiente', 'D2', '%', 0.0, 100.0, 1);

-- Crear actuador para dispositivo 6
INSERT INTO actuadores (dispositivo_id, nombre, tipo, pin, estado)
VALUES 
(6, 'Bomba Riego', 'bomba', 'D7', 'apagado');

-- Obtener los IDs de los sensores recién creados
SELECT 
    id,
    dispositivo_id,
    nombre,
    tipo,
    pin,
    unidad
FROM sensores
WHERE dispositivo_id = 6
ORDER BY id;

-- Nota: Anota los IDs que te devuelve la consulta anterior
-- Necesitarás actualizar el Arduino con esos IDs
