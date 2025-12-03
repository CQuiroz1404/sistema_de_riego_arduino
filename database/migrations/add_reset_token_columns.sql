-- Agregar columnas para recuperación de contraseña
-- Fecha: 3 diciembre 2025

USE sistema_riego;

-- Verificar si las columnas ya existen antes de agregarlas
SET @dbname = 'sistema_riego';
SET @tablename = 'usuarios';
SET @columnname1 = 'reset_token';
SET @columnname2 = 'reset_token_expiry';

-- Agregar reset_token si no existe
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE 
      TABLE_SCHEMA = @dbname
      AND TABLE_NAME = @tablename
      AND COLUMN_NAME = @columnname1
  ) > 0,
  'SELECT 1', -- La columna existe, no hacer nada
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN reset_token VARCHAR(255) NULL COMMENT \'Token para recuperación de contraseña\';')
));

PREPARE alterIfNotExists1 FROM @preparedStatement;
EXECUTE alterIfNotExists1;
DEALLOCATE PREPARE alterIfNotExists1;

-- Agregar reset_token_expiry si no existe
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE 
      TABLE_SCHEMA = @dbname
      AND TABLE_NAME = @tablename
      AND COLUMN_NAME = @columnname2
  ) > 0,
  'SELECT 1', -- La columna existe, no hacer nada
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN reset_token_expiry DATETIME NULL COMMENT \'Fecha de expiración del token (1 hora)\';')
));

PREPARE alterIfNotExists2 FROM @preparedStatement;
EXECUTE alterIfNotExists2;
DEALLOCATE PREPARE alterIfNotExists2;

-- Crear índice para reset_token si no existe
SET @indexExists = (SELECT COUNT(*) 
                    FROM INFORMATION_SCHEMA.STATISTICS 
                    WHERE TABLE_SCHEMA = @dbname 
                    AND TABLE_NAME = @tablename 
                    AND INDEX_NAME = 'idx_reset_token');

SET @preparedStatement = IF(@indexExists > 0,
  'SELECT 1',
  CONCAT('CREATE INDEX idx_reset_token ON ', @tablename, ' (reset_token);')
);

PREPARE createIndexIfNotExists FROM @preparedStatement;
EXECUTE createIndexIfNotExists;
DEALLOCATE PREPARE createIndexIfNotExists;

-- Verificar resultado
SELECT 
    COLUMN_NAME, 
    DATA_TYPE, 
    IS_NULLABLE, 
    COLUMN_DEFAULT,
    COLUMN_COMMENT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = 'sistema_riego'
  AND TABLE_NAME = 'usuarios'
  AND COLUMN_NAME IN ('reset_token', 'reset_token_expiry');

SELECT '✅ Migración completada: Columnas reset_token agregadas' AS resultado;
