-- Agregar columnas faltantes a eventos_riego
-- Ejecutar: mysql -u root -p sistema_riego < database/migrations/fix_eventos_riego.sql

USE sistema_riego;

-- Agregar tipo_evento si no existe
SET @exist := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'sistema_riego' AND TABLE_NAME = 'eventos_riego' AND COLUMN_NAME = 'tipo_evento');

SET @sqlstmt := IF(@exist = 0, 
  'ALTER TABLE eventos_riego ADD COLUMN tipo_evento VARCHAR(50) NOT NULL DEFAULT "riego" COMMENT "inicio_riego, fin_riego, error, etc" AFTER actuador_id',
  'SELECT "Columna tipo_evento ya existe" AS mensaje');

PREPARE stmt FROM @sqlstmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Agregar detalle si no existe
SET @exist := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'sistema_riego' AND TABLE_NAME = 'eventos_riego' AND COLUMN_NAME = 'detalle');

SET @sqlstmt := IF(@exist = 0, 
  'ALTER TABLE eventos_riego ADD COLUMN detalle TEXT NULL COMMENT "Información adicional del evento" AFTER modo',
  'SELECT "Columna detalle ya existe" AS mensaje');

PREPARE stmt FROM @sqlstmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SELECT '✅ Migración completada' AS resultado;
