/**
 * Debug Logger - Only logs in development mode
 * Prevents console logs in production
 */

const isDevelopment = window.location.hostname === 'localhost' || 
                      window.location.hostname === '127.0.0.1' ||
                      window.location.hostname.includes('.local');

/**
 * Logs message only in development mode
 * @param {...any} args - Arguments to log
 */
function debugLog(...args) {
    if (isDevelopment) {
        console.log(...args);
    }
}

/**
 * Logs error message only in development mode
 * @param {...any} args - Arguments to log
 */
function debugError(...args) {
    if (isDevelopment) {
        console.error(...args);
    }
}

/**
 * Logs warning message only in development mode
 * @param {...any} args - Arguments to log
 */
function debugWarn(...args) {
    if (isDevelopment) {
        console.warn(...args);
    }
}

/**
 * Logs info message only in development mode
 * @param {...any} args - Arguments to log
 */
function debugInfo(...args) {
    if (isDevelopment) {
        console.info(...args);
    }
}

// Make functions available globally
if (typeof window !== 'undefined') {
    window.debugLog = debugLog;
    window.debugError = debugError;
    window.debugWarn = debugWarn;
    window.debugInfo = debugInfo;
}
