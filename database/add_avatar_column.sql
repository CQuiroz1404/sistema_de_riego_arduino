-- Agregar columna avatar a la tabla usuarios
ALTER TABLE usuarios ADD COLUMN avatar VARCHAR(255) NULL AFTER email;
