-- ============================================
-- SCRIPT DE DIAGNÓSTICO
-- Ejecutar en Supabase SQL Editor
-- ============================================

-- 1. Verificar si la tabla existe
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'greenhouses';

-- 2. Ver estructura de la tabla
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'greenhouses'
ORDER BY ordinal_position;

-- 3. Contar registros
SELECT COUNT(*) as total_registros FROM greenhouses;

-- 4. Ver todos los datos
SELECT * FROM greenhouses;

-- 5. Verificar políticas RLS
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies 
WHERE tablename = 'greenhouses';

-- 6. Verificar si RLS está habilitado
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'greenhouses';

-- 7. Probar SELECT como lo hace la aplicación
SELECT * FROM greenhouses ORDER BY name ASC;

-- Si ves datos aquí pero no en la app, el problema puede ser:
-- - Las políticas RLS no están bien configuradas
-- - Hay un problema de CORS
-- - Las credenciales son incorrectas
