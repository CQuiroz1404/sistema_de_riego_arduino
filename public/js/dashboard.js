// Dashboard JavaScript

let refreshInterval;

// Actualizar datos del dashboard
async function refreshData() {
    try {
        const response = await fetch('/dashboard/data');
        const result = await response.json();
        
        if (result.success) {
            updateStats(result.stats);
            updateDevices(result.devices);
            updateAlerts(result.alerts);
            showNotification('Datos actualizados', 'success');
        }
    } catch (error) {
        console.error('Error al actualizar datos:', error);
        showNotification('Error al actualizar datos', 'error');
    }
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
}

// Detener actualización automática
function stopAutoRefresh() {
    if (refreshInterval) {
        clearInterval(refreshInterval);
    }
}

// Inicializar cuando se carga la página
document.addEventListener('DOMContentLoaded', () => {
    // Iniciar actualización automática
    startAutoRefresh();
    
    // Detener actualización cuando la página pierde el foco
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            stopAutoRefresh();
        } else {
            startAutoRefresh();
        }
    });
});

// Limpiar al salir de la página
window.addEventListener('beforeunload', () => {
    stopAutoRefresh();
});
