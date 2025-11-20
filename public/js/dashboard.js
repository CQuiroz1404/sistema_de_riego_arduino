// Dashboard JavaScript

let refreshInterval;
let connectionCheckInterval;

// Actualizar datos del dashboard
async function refreshData() {
    try {
        const result = await apiRequest('/dashboard/data');

        if (result.success && result.data) {
            updateStats(result.data.stats);
            updateDevices(result.data.devices);
            updateAlerts(result.data.alerts);
            showNotification('Datos actualizados', 'success');
        } else if (!result.success) {
            console.warn('Error al obtener dashboard/data', result);
            showNotification('Error al actualizar datos', 'warning');
        }
    } catch (error) {
        console.error('Error al actualizar datos:', error);
        showNotification('Error al actualizar datos', 'error');
    }
}

// Verificar estado de conexión de dispositivos
async function checkDeviceConnections() {
    const deviceCards = document.querySelectorAll('[data-device-id]');
    
    for (const card of deviceCards) {
        const deviceId = card.getAttribute('data-device-id');
        try {
            const result = await apiRequest(`/api/devices/${deviceId}/status`);
            if (result.success) {
                updateConnectionStatus(deviceId, result.data);
            } else {
                updateConnectionStatus(deviceId, { connected: false });
            }
        } catch (error) {
            console.error(`Error al verificar dispositivo ${deviceId}:`, error);
            updateConnectionStatus(deviceId, { connected: false });
        }
    }
}

// Actualizar indicador de conexión
function updateConnectionStatus(deviceId, data) {
    const statusElement = document.querySelector(`[data-connection-status="${deviceId}"]`);
    if (!statusElement) {
        console.warn(`No se encontró elemento de estado para dispositivo ${deviceId}`);
        return;
    }
    
    const dot = statusElement.querySelector('.connection-dot');
    const text = statusElement.querySelector('.connection-text');
    const lastConnectionElement = document.querySelector(`[data-last-connection="${deviceId}"]`);
    
    console.log(`[Device ${deviceId}] Estado:`, data);
    
    if (data.connected) {
        dot.classList.remove('offline');
        dot.classList.add('online');
        text.textContent = 'Conectado';
        
        if (lastConnectionElement && data.last_connection) {
            lastConnectionElement.textContent = `Hace ${getTimeAgo(data.last_connection)}`;
        }
    } else {
        dot.classList.remove('online');
        dot.classList.add('offline');
        text.textContent = 'Desconectado';
        
        if (lastConnectionElement && data.last_connection) {
            lastConnectionElement.textContent = `Última vez: ${getTimeAgo(data.last_connection)}`;
        } else if (lastConnectionElement) {
            lastConnectionElement.textContent = 'Sin conexión';
        }
    }
}

// Calcular tiempo transcurrido
function getTimeAgo(timestamp) {
    const now = new Date();
    const past = new Date(timestamp);
    const seconds = Math.floor((now - past) / 1000);
    
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
    return `${Math.floor(seconds / 86400)}d`;
}

// Actualizar estadísticas
function updateStats(stats) {
    if (stats) {
        const statElements = {
            total_dispositivos: document.querySelector('.stat-card:nth-child(1) h3'),
            dispositivos_activos: document.querySelector('.stat-card:nth-child(2) h3'),
            total_sensores: document.querySelector('.stat-card:nth-child(3) h3'),
            alertas_no_leidas: document.querySelector('.stat-card:nth-child(4) h3')
        };
        
        for (const [key, element] of Object.entries(statElements)) {
            if (element && stats[key] !== undefined) {
                element.textContent = stats[key];
            }
        }
    }
}

// Actualizar dispositivos
function updateDevices(devices) {
    // Aquí puedes implementar actualización dinámica de la lista de dispositivos
    console.log('Dispositivos actualizados:', devices);
}

// Actualizar alertas
function updateAlerts(alerts) {
    // Aquí puedes implementar actualización dinámica de alertas
    console.log('Alertas actualizadas:', alerts);
}

// Iniciar actualización automática cada 30 segundos
function startAutoRefresh() {
    refreshInterval = setInterval(refreshData, 30000);
    connectionCheckInterval = setInterval(checkDeviceConnections, 10000); // Cada 10 segundos
}

// Detener actualización automática
function stopAutoRefresh() {
    if (refreshInterval) {
        clearInterval(refreshInterval);
    }
    if (connectionCheckInterval) {
        clearInterval(connectionCheckInterval);
    }
}

// Inicializar cuando se carga la página
document.addEventListener('DOMContentLoaded', () => {
    // Verificar conexiones inmediatamente
    checkDeviceConnections();
    
    // Iniciar actualización automática
    startAutoRefresh();
    
    // Detener actualización cuando la página pierde el foco
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            stopAutoRefresh();
        } else {
            checkDeviceConnections(); // Verificar inmediatamente al volver
            startAutoRefresh();
        }
    });
});

// Limpiar al salir de la página
window.addEventListener('beforeunload', () => {
    stopAutoRefresh();
});
