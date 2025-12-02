const { describe, test, expect, beforeEach, jest } = require('@jest/globals');
const mqttService = require('../../src/services/mqttService');
const { Dispositivos, Sensores, Lecturas, Alertas } = require('../../src/models');

// Mock dependencies
jest.mock('../../src/models');
jest.mock('../../src/config/logger');

describe('MQTT Service', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('getDeviceByApiKey', () => {
        test('should return device from cache if available', async () => {
            const mockDevice = {
                id: 1,
                nombre: 'Test Device',
                api_key: 'test_api_key'
            };

            mqttService.devicesByApiKey.set('test_api_key', mockDevice);

            const device = await mqttService.getDeviceByApiKey('test_api_key');
            
            expect(device).toEqual(mockDevice);
            expect(Dispositivos.findOne).not.toHaveBeenCalled();
        });

        test('should query database if not in cache', async () => {
            const mockDevice = {
                id: 1,
                nombre: 'Test Device',
                api_key: 'new_api_key'
            };

            Dispositivos.findOne.mockResolvedValue(mockDevice);

            const device = await mqttService.getDeviceByApiKey('new_api_key');
            
            expect(device).toEqual(mockDevice);
            expect(Dispositivos.findOne).toHaveBeenCalledWith({
                where: { api_key: 'new_api_key' }
            });
        });

        test('should return null for invalid API key', async () => {
            Dispositivos.findOne.mockResolvedValue(null);

            const device = await mqttService.getDeviceByApiKey('invalid_key');
            
            expect(device).toBeNull();
        });
    });

    describe('processSensorData', () => {
        test('should process sensor data correctly', async () => {
            const mockDevice = {
                id: 1,
                nombre: 'Test Device',
                usuario_id: 1
            };

            const mockSensor = {
                id: 1,
                dispositivo_id: 1,
                nombre: 'Temperature Sensor',
                tipo: 'temperatura',
                valor_minimo: 0,
                valor_maximo: 50,
                unidad: '°C'
            };

            const payload = {
                sensores: [
                    {
                        sensor_id: 1,
                        valor: 25.5,
                        estado: 'ok'
                    }
                ]
            };

            Sensores.findByPk.mockResolvedValue(mockSensor);
            Lecturas.create.mockResolvedValue({});
            
            await mqttService.processSensorData(mockDevice, payload);

            expect(Lecturas.create).toHaveBeenCalledWith({
                sensor_id: 1,
                valor: 25.5
            });
        });

        test('should create alert for out of range values', async () => {
            const mockDevice = {
                id: 1,
                nombre: 'Test Device'
            };

            const mockSensor = {
                id: 1,
                dispositivo_id: 1,
                nombre: 'Temperature Sensor',
                tipo: 'temperatura',
                valor_minimo: 0,
                valor_maximo: 50,
                unidad: '°C'
            };

            const payload = {
                sensores: [
                    {
                        sensor_id: 1,
                        valor: 75,  // Out of range
                        estado: 'ok'
                    }
                ]
            };

            Sensores.findByPk.mockResolvedValue(mockSensor);
            Lecturas.create.mockResolvedValue({});
            Alertas.create.mockResolvedValue({});

            await mqttService.processSensorData(mockDevice, payload);

            expect(Alertas.create).toHaveBeenCalled();
        });

        test('should handle sensor auto-provisioning', async () => {
            const mockDevice = {
                id: 1,
                nombre: 'Test Device'
            };

            const payload = {
                sensores: [
                    {
                        pin: 'A1',
                        tipo: 'temperatura',
                        valor: 25.5
                    }
                ]
            };

            Sensores.findOne.mockResolvedValue(null);
            Sensores.create.mockResolvedValue({
                id: 2,
                dispositivo_id: 1,
                nombre: 'Temperatura Suelo',
                tipo: 'temperatura',
                pin: 'A1'
            });
            Lecturas.create.mockResolvedValue({});

            await mqttService.processSensorData(mockDevice, payload);

            expect(Sensores.create).toHaveBeenCalled();
        });
    });

    describe('controlActuator', () => {
        test('should send MQTT command to device', async () => {
            const mockDevice = {
                id: 1,
                api_key: 'test_key'
            };

            const mockActuator = {
                id: 1,
                nombre: 'Water Pump',
                pin: 'D7'
            };

            Dispositivos.findByPk.mockResolvedValue(mockDevice);
            Actuadores.findByPk.mockResolvedValue(mockActuator);
            Actuadores.update.mockResolvedValue([1]);
            EventosRiego.create.mockResolvedValue({});

            // Mock MQTT client
            mqttService.connected = true;
            mqttService.client = {
                publish: jest.fn((topic, payload, options, callback) => {
                    if (callback) callback(null);
                })
            };

            await mqttService.controlActuator(1, 1, 'encendido', 'manual', 1);

            expect(mqttService.client.publish).toHaveBeenCalled();
            expect(Actuadores.update).toHaveBeenCalledWith(
                { estado: 'encendido' },
                { where: { id: 1 } }
            );
        });
    });
});
