-- ============================================
-- Migración: Agregar campo duracion_minutos a tabla calendario
-- Fecha: 3 de diciembre de 2025
-- Descripción: Permite configurar la duración automática del riego
-- ============================================

USE sistema_riego;

-- Agregar columna duracion_minutos si no existe
ALTER TABLE calendario 
ADD COLUMN IF NOT EXISTS duracion_minutos INT DEFAULT 10 
COMMENT 'Duración del riego en minutos';

-- Actualizar eventos existentes con duración por defecto
UPDATE calendario 
SET duracion_minutos = 10 
WHERE duracion_minutos IS NULL;

SELECT '✅ Columna duracion_minutos agregada exitosamente a tabla calendario' AS resultado;
