// Dashboard JavaScript

let refreshInterval;
let connectionCheckInterval;
const socket = io();

// Escuchar eventos de Socket.io
socket.on('connect', () => {
    console.log('🔌 Conectado a WebSockets');
    showNotification('Conexión en tiempo real activa', 'success');
});

socket.on('sensor:update', (data) => {
    console.log('📡 Datos de sensores recibidos:', data);
    // Actualizar UI específica si es necesario
    // Por ahora, refrescamos todo el dashboard para simplificar
    // En una implementación más avanzada, actualizaríamos solo los elementos DOM específicos
    refreshData();
});

socket.on('device:event', (data) => {
    console.log('📢 Evento de dispositivo:', data);
    showNotification(`${data.tipo}: ${data.mensaje}`, 'info');
    refreshData();
});

// Escuchar notificaciones de riego programado
socket.on('schedule:watering-time', (data) => {
    console.log('🚿 Notificación de riego:', data);
    
    // Mostrar notificación prominente
    showNotification(
        `🚿 ${data.mensaje}`,
        'info',
        10000 // Duración 10 segundos
    );
    
    // Reproducir sonido (opcional)
    playNotificationSound();
    
    // Actualizar dashboard
    refreshData();
});

// Escuchar recordatorios de dispositivos
socket.on('device:schedule-reminder', (data) => {
    console.log('📱 Recordatorio de dispositivo:', data);
    showNotification(
        `📱 ${data.device_name}: ${data.mensaje}`,
        'warning',
        8000
    );
});

// Escuchar inicio de riego automático
socket.on('irrigation:started', (data) => {
    console.log('🚿 Riego iniciado:', data);
    showNotification(
        `🚿 ${data.mensaje}`,
        'success',
        5000
    );
    playNotificationSound();
    refreshData();
});

// Escuchar fin de riego automático
socket.on('irrigation:finished', (data) => {
    console.log('⏱️ Riego finalizado:', data);
    showNotification(
        `✅ ${data.mensaje} (${data.duracion_minutos} min)`,
        'info',
        5000
    );
    refreshData();
});

// Escuchar cambios de estado de actuadores en tiempo real
socket.on('actuator:state-changed', (data) => {
    console.log('🎛️ Estado de actuador cambiado:', data);
    showNotification(
        `${data.actuatorName}: ${data.estado}`,
        data.estado === 'encendido' ? 'success' : 'info',
        3000
    );
    
    // Actualizar UI del actuador específico si existe
    updateActuatorUI(data);
});

// Escuchar desactivación de calendario
socket.on('calendar:disabled', (data) => {
    console.log('📅 Calendario desactivado:', data);
    showNotification(
        '📅 ' + data.mensaje,
        'warning',
        5000
    );
});

// Función para actualizar UI de actuador específico
function updateActuatorUI(data) {
    const actuatorButton = document.querySelector(`[data-actuator-id="${data.actuatorId}"]`);
    if (actuatorButton) {
        if (data.estado === 'encendido') {
            actuatorButton.classList.remove('bg-gray-600', 'hover:bg-gray-700');
            actuatorButton.classList.add('bg-green-600', 'hover:bg-green-700');
            actuatorButton.textContent = '🟢 Encendido';
        } else {
            actuatorButton.classList.remove('bg-green-600', 'hover:bg-green-700');
            actuatorButton.classList.add('bg-gray-600', 'hover:bg-gray-700');
            actuatorButton.textContent = '⚪ Apagado';
        }
    }
}

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
    
    const text = statusElement.querySelector('.connection-text');
    const lastConnectionElement = document.querySelector(`[data-last-connection="${deviceId}"]`);
    
    console.log(`[Device ${deviceId}] Estado:`, data);
    
    // Actualizar clases y texto basado en si está encendido (online) o apagado
    const isOnline = data.online || data.estadoConexion === 'encendido';
    
    if (isOnline) {
        // Remover clases de apagado
        statusElement.classList.remove('bg-red-100', 'text-red-800', 'dark:bg-red-900/30', 'dark:text-red-400');
        // Agregar clases de encendido
        statusElement.classList.add('bg-green-100', 'text-green-800', 'dark:bg-green-900/30', 'dark:text-green-400');
        text.textContent = 'encendido';
        
        if (lastConnectionElement && data.last_connection) {
            lastConnectionElement.textContent = `Hace ${getTimeAgo(data.last_connection)}`;
        }
    } else {
        // Remover clases de encendido
        statusElement.classList.remove('bg-green-100', 'text-green-800', 'dark:bg-green-900/30', 'dark:text-green-400');
        // Agregar clases de apagado
        statusElement.classList.add('bg-red-100', 'text-red-800', 'dark:bg-red-900/30', 'dark:text-red-400');
        text.textContent = 'apagado';
        
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

// Reproducir sonido de notificación
function playNotificationSound() {
    try {
        // Usar Web Audio API para generar un tono simple
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = 800; // Frecuencia en Hz
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.5);
    } catch (error) {
        console.log('No se pudo reproducir sonido de notificación:', error);
    }
}
