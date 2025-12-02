const NodeCache = require('node-cache');
const logger = require('../config/logger');

/**
 * Cache Service
 * Provides caching layer for frequently accessed data
 */
class CacheService {
    constructor() {
        // Initialize cache instances with different TTL
        this.deviceCache = new NodeCache({
            stdTTL: 300,  // 5 minutes
            checkperiod: 60,  // Check for expired keys every 60 seconds
            useClones: false  // Return references (faster, but be careful with mutations)
        });

        this.sensorCache = new NodeCache({
            stdTTL: 60,  // 1 minute (sensors update frequently)
            checkperiod: 10
        });

        this.configCache = new NodeCache({
            stdTTL: 600,  // 10 minutes (configs change rarely)
            checkperiod: 120
        });

        this.userCache = new NodeCache({
            stdTTL: 300,  // 5 minutes
            checkperiod: 60
        });

        // Setup event listeners
        this.setupEventListeners();
    }

    /**
     * Setup event listeners for cache operations
     */
    setupEventListeners() {
        const caches = [
            { name: 'device', cache: this.deviceCache },
            { name: 'sensor', cache: this.sensorCache },
            { name: 'config', cache: this.configCache },
            { name: 'user', cache: this.userCache }
        ];

        caches.forEach(({ name, cache }) => {
            cache.on('expired', (key, value) => {
                logger.debug(`Cache expired - ${name}: ${key}`);
            });

            cache.on('del', (key, value) => {
                logger.debug(`Cache deleted - ${name}: ${key}`);
            });

            cache.on('set', (key, value) => {
                logger.debug(`Cache set - ${name}: ${key}`);
            });
        });
    }

    /**
     * Get device by ID or API key
     * @param {string|number} identifier - Device ID or API key
     * @returns {Promise<object|null>} Device object or null
     */
    async getDevice(identifier) {
        const key = `device_${identifier}`;
        const cached = this.deviceCache.get(key);

        if (cached) {
            logger.debug(`Cache hit: ${key}`);
            return cached;
        }

        logger.debug(`Cache miss: ${key}`);
        return null;
    }

    /**
     * Set device in cache
     * @param {string|number} identifier - Device ID or API key
     * @param {object} device - Device object
     * @param {number} ttl - Optional custom TTL in seconds
     */
    setDevice(identifier, device, ttl) {
        const key = `device_${identifier}`;
        this.deviceCache.set(key, device, ttl);
    }

    /**
     * Invalidate device cache
     * @param {string|number} identifier - Device ID or API key
     */
    invalidateDevice(identifier) {
        const key = `device_${identifier}`;
        this.deviceCache.del(key);
        
        // Also invalidate related caches
        this.invalidateSensorsByDevice(identifier);
    }

    /**
     * Get all devices for a user
     * @param {number} userId - User ID
     * @returns {Promise<array|null>} Array of devices or null
     */
    async getUserDevices(userId) {
        const key = `user_devices_${userId}`;
        return this.deviceCache.get(key);
    }

    /**
     * Set user devices in cache
     * @param {number} userId - User ID
     * @param {array} devices - Array of devices
     * @param {number} ttl - Optional custom TTL
     */
    setUserDevices(userId, devices, ttl) {
        const key = `user_devices_${userId}`;
        this.deviceCache.set(key, devices, ttl);
    }

    /**
     * Get sensor data
     * @param {number} sensorId - Sensor ID
     * @returns {object|null} Sensor object or null
     */
    getSensor(sensorId) {
        const key = `sensor_${sensorId}`;
        return this.sensorCache.get(key);
    }

    /**
     * Set sensor in cache
     * @param {number} sensorId - Sensor ID
     * @param {object} sensor - Sensor object
     * @param {number} ttl - Optional custom TTL
     */
    setSensor(sensorId, sensor, ttl) {
        const key = `sensor_${sensorId}`;
        this.sensorCache.set(key, sensor, ttl);
    }

    /**
     * Get sensors by device
     * @param {number} deviceId - Device ID
     * @returns {array|null} Array of sensors or null
     */
    getDeviceSensors(deviceId) {
        const key = `device_sensors_${deviceId}`;
        return this.sensorCache.get(key);
    }

    /**
     * Set device sensors in cache
     * @param {number} deviceId - Device ID
     * @param {array} sensors - Array of sensors
     * @param {number} ttl - Optional custom TTL
     */
    setDeviceSensors(deviceId, sensors, ttl) {
        const key = `device_sensors_${deviceId}`;
        this.sensorCache.set(key, sensors, ttl);
    }

    /**
     * Invalidate all sensor caches for a device
     * @param {number} deviceId - Device ID
     */
    invalidateSensorsByDevice(deviceId) {
        const key = `device_sensors_${deviceId}`;
        this.sensorCache.del(key);
        
        // Also clear individual sensor caches if needed
        const keys = this.sensorCache.keys();
        keys.forEach(k => {
            if (k.startsWith(`sensor_`) && k.includes(`_device_${deviceId}`)) {
                this.sensorCache.del(k);
            }
        });
    }

    /**
     * Get irrigation configuration
     * @param {number} configId - Configuration ID
     * @returns {object|null} Configuration object or null
     */
    getConfig(configId) {
        const key = `config_${configId}`;
        return this.configCache.get(key);
    }

    /**
     * Set configuration in cache
     * @param {number} configId - Configuration ID
     * @param {object} config - Configuration object
     * @param {number} ttl - Optional custom TTL
     */
    setConfig(configId, config, ttl) {
        const key = `config_${configId}`;
        this.configCache.set(key, config, ttl);
    }

    /**
     * Invalidate configuration cache
     * @param {number} configId - Configuration ID
     */
    invalidateConfig(configId) {
        const key = `config_${configId}`;
        this.configCache.del(key);
    }

    /**
     * Get user data
     * @param {number} userId - User ID
     * @returns {object|null} User object or null
     */
    getUser(userId) {
        const key = `user_${userId}`;
        return this.userCache.get(key);
    }

    /**
     * Set user in cache
     * @param {number} userId - User ID
     * @param {object} user - User object
     * @param {number} ttl - Optional custom TTL
     */
    setUser(userId, user, ttl) {
        const key = `user_${userId}`;
        this.userCache.set(key, user, ttl);
    }

    /**
     * Invalidate user cache
     * @param {number} userId - User ID
     */
    invalidateUser(userId) {
        const key = `user_${userId}`;
        this.userCache.del(key);
        
        // Also invalidate user devices
        const devicesKey = `user_devices_${userId}`;
        this.deviceCache.del(devicesKey);
    }

    /**
     * Get cache statistics
     * @returns {object} Statistics object
     */
    getStats() {
        return {
            device: this.deviceCache.getStats(),
            sensor: this.sensorCache.getStats(),
            config: this.configCache.getStats(),
            user: this.userCache.getStats()
        };
    }

    /**
     * Clear all caches
     */
    clearAll() {
        this.deviceCache.flushAll();
        this.sensorCache.flushAll();
        this.configCache.flushAll();
        this.userCache.flushAll();
        logger.info('All caches cleared');
    }

    /**
     * Clear specific cache type
     * @param {string} type - Cache type: 'device', 'sensor', 'config', 'user'
     */
    clear(type) {
        switch (type) {
            case 'device':
                this.deviceCache.flushAll();
                break;
            case 'sensor':
                this.sensorCache.flushAll();
                break;
            case 'config':
                this.configCache.flushAll();
                break;
            case 'user':
                this.userCache.flushAll();
                break;
            default:
                logger.warn(`Unknown cache type: ${type}`);
        }
        logger.info(`Cache cleared: ${type}`);
    }
}

// Singleton instance
const cacheService = new CacheService();

module.exports = cacheService;
