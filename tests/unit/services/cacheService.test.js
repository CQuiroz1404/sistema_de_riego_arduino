const { describe, test, expect } = require('@jest/globals');
const cacheService = require('../../src/services/cacheService');

describe('Cache Service', () => {
    beforeEach(() => {
        // Clear caches before each test
        cacheService.clearAll();
    });

    describe('Device Cache', () => {
        test('should store and retrieve device', () => {
            const device = { id: 1, nombre: 'Test Device' };
            
            cacheService.setDevice(1, device);
            const cached = cacheService.getDevice(1);

            expect(cached).toEqual(device);
        });

        test('should return null for non-existent device', async () => {
            const cached = await cacheService.getDevice(999);
            expect(cached).toBeNull();
        });

        test('should invalidate device cache', () => {
            const device = { id: 1, nombre: 'Test Device' };
            
            cacheService.setDevice(1, device);
            cacheService.invalidateDevice(1);
            const cached = cacheService.getDevice(1);

            expect(cached).toBeUndefined();
        });

        test('should cache user devices', () => {
            const devices = [
                { id: 1, nombre: 'Device 1' },
                { id: 2, nombre: 'Device 2' }
            ];

            cacheService.setUserDevices(1, devices);
            const cached = cacheService.getUserDevices(1);

            expect(cached).toEqual(devices);
        });
    });

    describe('Sensor Cache', () => {
        test('should store and retrieve sensor', () => {
            const sensor = { id: 1, tipo: 'temperatura' };
            
            cacheService.setSensor(1, sensor);
            const cached = cacheService.getSensor(1);

            expect(cached).toEqual(sensor);
        });

        test('should cache device sensors', () => {
            const sensors = [
                { id: 1, tipo: 'temperatura' },
                { id: 2, tipo: 'humedad' }
            ];

            cacheService.setDeviceSensors(1, sensors);
            const cached = cacheService.getDeviceSensors(1);

            expect(cached).toEqual(sensors);
        });

        test('should invalidate sensors by device', () => {
            const sensors = [{ id: 1 }, { id: 2 }];

            cacheService.setDeviceSensors(1, sensors);
            cacheService.invalidateSensorsByDevice(1);
            const cached = cacheService.getDeviceSensors(1);

            expect(cached).toBeUndefined();
        });
    });

    describe('Configuration Cache', () => {
        test('should store and retrieve configuration', () => {
            const config = { id: 1, umbral: 40 };
            
            cacheService.setConfig(1, config);
            const cached = cacheService.getConfig(1);

            expect(cached).toEqual(config);
        });

        test('should invalidate configuration', () => {
            const config = { id: 1, umbral: 40 };
            
            cacheService.setConfig(1, config);
            cacheService.invalidateConfig(1);
            const cached = cacheService.getConfig(1);

            expect(cached).toBeUndefined();
        });
    });

    describe('User Cache', () => {
        test('should store and retrieve user', () => {
            const user = { id: 1, nombre: 'Test User' };
            
            cacheService.setUser(1, user);
            const cached = cacheService.getUser(1);

            expect(cached).toEqual(user);
        });

        test('should invalidate user and related caches', () => {
            const user = { id: 1, nombre: 'Test User' };
            const devices = [{ id: 1 }];

            cacheService.setUser(1, user);
            cacheService.setUserDevices(1, devices);
            cacheService.invalidateUser(1);

            expect(cacheService.getUser(1)).toBeUndefined();
            expect(cacheService.getUserDevices(1)).toBeUndefined();
        });
    });

    describe('Cache Management', () => {
        test('should get statistics', () => {
            cacheService.setDevice(1, { id: 1 });
            cacheService.setSensor(1, { id: 1 });

            const stats = cacheService.getStats();

            expect(stats).toHaveProperty('device');
            expect(stats).toHaveProperty('sensor');
            expect(stats).toHaveProperty('config');
            expect(stats).toHaveProperty('user');
        });

        test('should clear all caches', () => {
            cacheService.setDevice(1, { id: 1 });
            cacheService.setSensor(1, { id: 1 });
            cacheService.setConfig(1, { id: 1 });

            cacheService.clearAll();

            expect(cacheService.getDevice(1)).toBeUndefined();
            expect(cacheService.getSensor(1)).toBeUndefined();
            expect(cacheService.getConfig(1)).toBeUndefined();
        });

        test('should clear specific cache type', () => {
            cacheService.setDevice(1, { id: 1 });
            cacheService.setSensor(1, { id: 1 });

            cacheService.clear('device');

            expect(cacheService.getDevice(1)).toBeUndefined();
            expect(cacheService.getSensor(1)).toBeDefined();
        });
    });
});
