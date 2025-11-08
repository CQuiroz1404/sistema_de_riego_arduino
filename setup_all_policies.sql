-- ============================================
-- POLÍTICAS RLS COMPLETAS PARA TODO EL SISTEMA
-- Ejecutar TODO este script en Supabase SQL Editor
-- ============================================

-- IMPORTANTE: Este script configura el acceso a TODAS las tablas
-- Para desarrollo/pruebas - En producción usar autenticación

-- ============================================
-- PASO 1: ELIMINAR políticas existentes
-- ============================================

DROP POLICY IF EXISTS "Enable read access for all users" ON greenhouses;
DROP POLICY IF EXISTS "Enable read access for all users" ON zone;
DROP POLICY IF EXISTS "Enable read access for all users" ON plants;
DROP POLICY IF EXISTS "Enable read access for all users" ON sensors;
DROP POLICY IF EXISTS "Enable read access for all users" ON "Readings";
DROP POLICY IF EXISTS "Enable read access for all users" ON "Actuators";
DROP POLICY IF EXISTS "Enable read access for all users" ON "HistoryIrrigation";

DROP POLICY IF EXISTS "Enable insert for all users" ON "Readings";
DROP POLICY IF EXISTS "Enable insert for all users" ON "HistoryIrrigation";
DROP POLICY IF EXISTS "Enable update for all users" ON "Actuators";
DROP POLICY IF EXISTS "Enable update for all users" ON "HistoryIrrigation";

-- ============================================
-- PASO 2: CREAR políticas de LECTURA (SELECT)
-- ============================================

-- Tabla: greenhouses
CREATE POLICY "Enable read access for all users" 
ON greenhouses 
FOR SELECT 
TO public
USING (true);

-- Tabla: zone
CREATE POLICY "Enable read access for all users" 
ON zone 
FOR SELECT 
TO public
USING (true);

-- Tabla: plants
CREATE POLICY "Enable read access for all users" 
ON plants 
FOR SELECT 
TO public
USING (true);

-- Tabla: sensors
CREATE POLICY "Enable read access for all users" 
ON sensors 
FOR SELECT 
TO public
USING (true);

-- Tabla: Readings
CREATE POLICY "Enable read access for all users" 
ON "Readings" 
FOR SELECT 
TO public
USING (true);

-- Tabla: Actuators
CREATE POLICY "Enable read access for all users" 
ON "Actuators" 
FOR SELECT 
TO public
USING (true);

-- Tabla: HistoryIrrigation
CREATE POLICY "Enable read access for all users" 
ON "HistoryIrrigation" 
FOR SELECT 
TO public
USING (true);

-- ============================================
-- PASO 3: CREAR políticas de INSERCIÓN (INSERT)
-- ============================================

-- Readings - Para que Arduino pueda insertar lecturas
CREATE POLICY "Enable insert for all users" 
ON "Readings" 
FOR INSERT 
TO public
WITH CHECK (true);

-- HistoryIrrigation - Para registrar activaciones de riego
CREATE POLICY "Enable insert for all users" 
ON "HistoryIrrigation" 
FOR INSERT 
TO public
WITH CHECK (true);

-- ============================================
-- PASO 4: CREAR políticas de ACTUALIZACIÓN (UPDATE)
-- ============================================

-- HistoryIrrigation - Para actualizar fecha de fin de riego
CREATE POLICY "Enable update for all users" 
ON "HistoryIrrigation" 
FOR UPDATE 
TO public
USING (true)
WITH CHECK (true);

-- ============================================
-- PASO 5: VERIFICAR que se crearon correctamente
-- ============================================

SELECT 
    tablename, 
    policyname, 
    cmd,
    roles
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Deberías ver políticas para todas estas tablas:
-- - greenhouses (SELECT)
-- - zone (SELECT)
-- - plants (SELECT)
-- - sensors (SELECT)
-- - Readings (SELECT, INSERT)
-- - Actuators (SELECT)
-- - HistoryIrrigation (SELECT, INSERT, UPDATE)

-- ============================================
-- PASO 6: PROBAR que funcionan
-- ============================================

SELECT 'greenhouses' as tabla, COUNT(*) as registros FROM greenhouses
UNION ALL
SELECT 'zone', COUNT(*) FROM zone
UNION ALL
SELECT 'plants', COUNT(*) FROM plants
UNION ALL
SELECT 'sensors', COUNT(*) FROM sensors
UNION ALL
SELECT 'Readings', COUNT(*) FROM "Readings"
UNION ALL
SELECT 'Actuators', COUNT(*) FROM "Actuators"
UNION ALL
SELECT 'HistoryIrrigation', COUNT(*) FROM "HistoryIrrigation";

-- Si ves los conteos, ¡todo está funcionando! ✅
