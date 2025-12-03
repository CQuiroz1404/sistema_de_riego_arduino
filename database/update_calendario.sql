-- Actualización de la tabla calendario
-- Agrega las columnas fecha_inicio y fecha_fin para soportar rangos de fechas en la programación

USE sistema_riego;

ALTER TABLE calendario 
ADD COLUMN fecha_inicio DATE NULL AFTER dia_semana,
ADD COLUMN fecha_fin DATE NULL AFTER fecha_inicio;

SELECT '✅ Tabla calendario actualizada correctamente' AS status;
