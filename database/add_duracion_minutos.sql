-- Agregar columna duracion_minutos a la tabla calendario
USE sistema_riego;

ALTER TABLE calendario 
ADD COLUMN duracion_minutos INT DEFAULT 10 COMMENT 'Duración del riego en minutos';

-- Verificar que se agregó correctamente
DESCRIBE calendario;
