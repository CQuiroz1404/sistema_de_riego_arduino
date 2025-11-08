-- ============================================
-- SCRIPT PARA SOLUCIONAR PROBLEMA DE ACCESO
-- Ejecutar este script en Supabase SQL Editor
-- ============================================

-- 1. Verificar que RLS esté habilitado
ALTER TABLE greenhouses ENABLE ROW LEVEL SECURITY;
ALTER TABLE zone ENABLE ROW LEVEL SECURITY;
ALTER TABLE plants ENABLE ROW LEVEL SECURITY;
ALTER TABLE sensors ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Readings" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Actuators" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "HistoryIrrigation" ENABLE ROW LEVEL SECURITY;

-- 2. ELIMINAR POLÍTICAS EXISTENTES (si las hay)
DROP POLICY IF EXISTS "Enable read access for all users" ON greenhouses;
DROP POLICY IF EXISTS "Enable read access for all users" ON zone;
DROP POLICY IF EXISTS "Enable read access for all users" ON plants;
DROP POLICY IF EXISTS "Enable read access for all users" ON sensors;
DROP POLICY IF EXISTS "Enable read access for all users" ON "Readings";
DROP POLICY IF EXISTS "Enable read access for all users" ON "Actuators";
DROP POLICY IF EXISTS "Enable read access for all users" ON "HistoryIrrigation";

DROP POLICY IF EXISTS "Enable insert for all users" ON "Readings";
DROP POLICY IF EXISTS "Enable insert for all users" ON "HistoryIrrigation";

-- 3. CREAR NUEVAS POLÍTICAS DE LECTURA (SELECT)
CREATE POLICY "Enable read access for all users" 
ON greenhouses FOR SELECT 
USING (true);

CREATE POLICY "Enable read access for all users" 
ON zone FOR SELECT 
USING (true);

CREATE POLICY "Enable read access for all users" 
ON plants FOR SELECT 
USING (true);

CREATE POLICY "Enable read access for all users" 
ON sensors FOR SELECT 
USING (true);

CREATE POLICY "Enable read access for all users" 
ON "Readings" FOR SELECT 
USING (true);

CREATE POLICY "Enable read access for all users" 
ON "Actuators" FOR SELECT 
USING (true);

CREATE POLICY "Enable read access for all users" 
ON "HistoryIrrigation" FOR SELECT 
USING (true);

-- 4. CREAR POLÍTICAS DE INSERCIÓN (para Arduino y aplicación)
CREATE POLICY "Enable insert for all users" 
ON "Readings" FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Enable insert for all users" 
ON "HistoryIrrigation" FOR INSERT 
WITH CHECK (true);

-- 5. CREAR POLÍTICAS DE ACTUALIZACIÓN (para actuadores)
CREATE POLICY "Enable update for all users" 
ON "Actuators" FOR UPDATE 
USING (true);

CREATE POLICY "Enable update for all users" 
ON "HistoryIrrigation" FOR UPDATE 
USING (true);

-- 6. VERIFICAR QUE LAS POLÍTICAS SE CREARON
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- 7. VERIFICAR DATOS EN GREENHOUSES
SELECT * FROM greenhouses;

-- Si ves tus datos aquí, las políticas están correctas ✅
