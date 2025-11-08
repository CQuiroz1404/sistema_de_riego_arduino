-- ============================================
-- SOLUCIÓN DEFINITIVA - EJECUTAR ESTO AHORA
-- Copia y pega TODO en el SQL Editor de Supabase
-- ============================================

-- 1. ELIMINAR políticas existentes que pueden estar mal configuradas
DROP POLICY IF EXISTS "Enable read access for all users" ON greenhouses;
DROP POLICY IF EXISTS "Public read access" ON greenhouses;
DROP POLICY IF EXISTS "Allow public read" ON greenhouses;

-- 2. CREAR política correcta con TO public (esto es clave)
CREATE POLICY "Enable read access for all users" 
ON greenhouses 
FOR SELECT 
TO public
USING (true);

-- 3. VERIFICAR que se creó correctamente
SELECT 
    schemaname,
    tablename, 
    policyname, 
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'greenhouses';

-- Deberías ver:
-- roles: {public}
-- cmd: SELECT
-- qual: true

-- 4. PROBAR que funciona
SELECT * FROM greenhouses;

-- Si ves tus datos aquí, ¡está listo! ✅
