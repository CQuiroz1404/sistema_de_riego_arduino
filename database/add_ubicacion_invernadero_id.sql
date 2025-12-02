-- ============================================
-- Migración: Agregar ubicacion a invernaderos y invernadero_id a dispositivos
-- ============================================

USE sistema_riego;

-- Agregar columna ubicacion a la tabla invernaderos
ALTER TABLE invernaderos 
ADD COLUMN ubicacion VARCHAR(200) AFTER descripcion;

-- Agregar columna invernadero_id a la tabla dispositivos
ALTER TABLE dispositivos 
ADD COLUMN invernadero_id INT AFTER nombre,
ADD FOREIGN KEY (invernadero_id) REFERENCES invernaderos(id) ON DELETE SET NULL;

-- Opcional: Migrar datos existentes si hay dispositivos con ubicacion
-- UPDATE dispositivos d
-- INNER JOIN invernaderos i ON d.ubicacion = i.ubicacion
-- SET d.invernadero_id = i.id
-- WHERE d.ubicacion IS NOT NULL;

COMMIT;
