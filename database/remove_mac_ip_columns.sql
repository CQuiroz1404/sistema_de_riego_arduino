-- Script para eliminar columnas mac_address e ip_address de la tabla dispositivos
USE sistema_riego;

-- Eliminar columnas si existen
ALTER TABLE dispositivos 
DROP COLUMN IF EXISTS mac_address,
DROP COLUMN IF EXISTS ip_address;

-- Verificar cambios
SHOW COLUMNS FROM dispositivos;
