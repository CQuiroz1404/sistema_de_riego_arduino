-- Script para crear las tablas del sistema de riego en Supabase
-- Ejecutar en el SQL Editor de Supabase

-- Tabla de invernaderos
CREATE TABLE IF NOT EXISTS greenhouses (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    location VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de zonas
CREATE TABLE IF NOT EXISTS zone (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    greenhouseId BIGINT REFERENCES greenhouses(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de plantas
CREATE TABLE IF NOT EXISTS plants (
    id BIGSERIAL PRIMARY KEY,
    zoneId BIGINT REFERENCES zone(id) ON DELETE CASCADE,
    commonName VARCHAR(255) NOT NULL,
    scientificName VARCHAR(255),
    optimalSoilHumidity FLOAT8,
    soilHumidityMin FLOAT8,
    optimalAmbientTemp FLOAT8,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de sensores
CREATE TABLE IF NOT EXISTS sensors (
    id BIGSERIAL PRIMARY KEY,
    zoneId BIGINT REFERENCES zone(id) ON DELETE CASCADE,
    sensorType VARCHAR(100),
    model VARCHAR(100),
    installationDate DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de lecturas de sensores
CREATE TABLE IF NOT EXISTS "Readings" (
    id BIGSERIAL PRIMARY KEY,
    sensorId BIGINT REFERENCES sensors(id) ON DELETE CASCADE,
    value FLOAT8 NOT NULL,
    dateTime TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de actuadores
CREATE TABLE IF NOT EXISTS "Actuators" (
    id BIGSERIAL PRIMARY KEY,
    zoneId BIGINT REFERENCES zone(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de historial de riego
CREATE TABLE IF NOT EXISTS "HistoryIrrigation" (
    id BIGSERIAL PRIMARY KEY,
    actuatorId BIGINT REFERENCES "Actuators"(id) ON DELETE CASCADE,
    dateTimeStart TIMESTAMPTZ NOT NULL,
    dateTimeEnd TIMESTAMPTZ,
    mode VARCHAR(50) DEFAULT 'manual',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_zone_greenhouse ON zone(greenhouseId);
CREATE INDEX IF NOT EXISTS idx_plants_zone ON plants(zoneId);
CREATE INDEX IF NOT EXISTS idx_sensors_zone ON sensors(zoneId);
CREATE INDEX IF NOT EXISTS idx_readings_sensor ON "Readings"(sensorId);
CREATE INDEX IF NOT EXISTS idx_readings_datetime ON "Readings"(dateTime);
CREATE INDEX IF NOT EXISTS idx_actuators_zone ON "Actuators"(zoneId);
CREATE INDEX IF NOT EXISTS idx_history_actuator ON "HistoryIrrigation"(actuatorId);

-- Habilitar Row Level Security (RLS)
ALTER TABLE greenhouses ENABLE ROW LEVEL SECURITY;
ALTER TABLE zone ENABLE ROW LEVEL SECURITY;
ALTER TABLE plants ENABLE ROW LEVEL SECURITY;
ALTER TABLE sensors ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Readings" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Actuators" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "HistoryIrrigation" ENABLE ROW LEVEL SECURITY;

-- Políticas básicas para desarrollo (MODIFICAR PARA PRODUCCIÓN)
-- Permitir lectura pública
CREATE POLICY "Enable read access for all users" ON greenhouses FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON zone FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON plants FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON sensors FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON "Readings" FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON "Actuators" FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON "HistoryIrrigation" FOR SELECT USING (true);

-- Permitir inserción pública (SOLO PARA DESARROLLO - Remover en producción)
CREATE POLICY "Enable insert for all users" ON "Readings" FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable insert for all users" ON "HistoryIrrigation" FOR INSERT WITH CHECK (true);

-- Datos de ejemplo (opcional)
-- Insertar un invernadero de prueba
INSERT INTO greenhouses (name, location) VALUES 
    ('Invernadero Principal', 'Sector Norte'),
    ('Invernadero Experimental', 'Sector Sur');

-- Insertar zonas de prueba
INSERT INTO zone (name, description, greenhouseId) VALUES 
    ('Zona A', 'Cultivos de temporada', 1),
    ('Zona B', 'Cultivos permanentes', 1),
    ('Zona Experimental', 'Pruebas de nuevos cultivos', 2);

-- Insertar plantas de ejemplo
INSERT INTO plants (zoneId, commonName, scientificName, optimalSoilHumidity, soilHumidityMin, optimalAmbientTemp) VALUES 
    (1, 'Tomate', 'Solanum lycopersicum', 65.0, 50.0, 22.0),
    (1, 'Lechuga', 'Lactuca sativa', 70.0, 55.0, 18.0),
    (2, 'Fresa', 'Fragaria × ananassa', 65.0, 50.0, 20.0);

-- Insertar sensores de ejemplo
INSERT INTO sensors (zoneId, sensorType, model, installationDate) VALUES 
    (1, 'Humedad', 'DHT22', CURRENT_DATE),
    (1, 'Temperatura', 'DHT22', CURRENT_DATE),
    (2, 'Humedad', 'DHT11', CURRENT_DATE);

-- Insertar actuadores de ejemplo
INSERT INTO "Actuators" (zoneId, name) VALUES 
    (1, 'Bomba de Riego A'),
    (2, 'Válvula Principal B');
