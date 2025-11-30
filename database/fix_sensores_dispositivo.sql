-- ============================================
-- OPCIÓN 1: Cambiar API Key del Arduino
-- ============================================
-- El dispositivo 1 tiene los sensores pero el Arduino usa API Key del dispositivo 3
-- Esta consulta te muestra el API Key del dispositivo 1 para copiar al Arduino:

SELECT 
    id,
    nombre,
    api_key,
    usuario_id
FROM dispositivos
WHERE id = 1;

-- ⚠️ RESULTADO ESPERADO:
-- ID: 1
-- Nombre: Controlador Invernadero 1
-- API Key: api_key_inv_principal_001
-- Usuario ID: 1

-- ============================================
-- OPCIÓN 2: Crear sensores para dispositivo 3
-- ============================================
-- Si prefieres mantener el Arduino en dispositivo 3, ejecuta estos INSERTs:

-- Primero, eliminar sensores duplicados del dispositivo 1 (IDs 4, 5, 6)
DELETE FROM sensores WHERE id IN (4, 5, 6);

-- Luego, crear sensores para el dispositivo 3 (arduino Cristhian)
INSERT INTO sensores (dispositivo_id, nombre, tipo, pin, unidad, valor_minimo, valor_maximo, activo)
VALUES 
(3, 'LM35 Temperatura Suelo', 'temperatura', 'A1', '°C', 0.0, 50.0, 1),
(3, 'DHT11 Temperatura Aire', 'temperatura', 'D2', '°C', 0.0, 50.0, 1),
(3, 'DHT11 Humedad Aire', 'humedad_ambiente', 'D2', '%', 0.0, 100.0, 1);

-- Crear actuador para el dispositivo 3
INSERT INTO actuadores (dispositivo_id, nombre, tipo, pin, estado)
VALUES 
(3, 'Bomba Riego', 'bomba', 'D7', 'apagado');

-- ============================================
-- Verificar resultado
-- ============================================
SELECT 
    s.id,
    s.dispositivo_id,
    d.nombre AS dispositivo,
    s.nombre AS sensor,
    s.tipo,
    s.pin,
    s.unidad
FROM sensores s
JOIN dispositivos d ON s.dispositivo_id = d.id
WHERE s.dispositivo_id = 3
ORDER BY s.id;

-- ============================================
-- RECOMENDACIÓN
-- ============================================
-- OPCIÓN 1 es más simple: Solo cambia el API Key en el Arduino
-- OPCIÓN 2 mantiene tu estructura actual pero crea sensores nuevos
--
-- Para OPCIÓN 1, copia este API Key al Arduino (línea 30):
-- const char* API_KEY = "api_key_inv_principal_001";
--
-- Para OPCIÓN 2, ejecuta los INSERTs de arriba
