// Devices JavaScript

// Eliminar dispositivo
async function deleteDevice(deviceId) {
    if (!confirmAction('¿Estás seguro de que deseas eliminar este dispositivo? Esta acción no se puede deshacer.')) {
        return;
    }
    
    try {
        const result = await apiRequest(`/devices/${deviceId}`, {
            method: 'DELETE'
        });
        
        if (result.success) {
            showNotification('Dispositivo eliminado exitosamente', 'success');
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        } else {
            showNotification(result.data.message || 'Error al eliminar dispositivo', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showNotification('Error al eliminar dispositivo', 'error');
    }
}

// Ver detalles del dispositivo
function viewDevice(deviceId) {
    window.location.href = `/devices/${deviceId}`;
}

// Editar dispositivo
function editDevice(deviceId) {
    window.location.href = `/devices/${deviceId}/edit`;
}

// Control de actuador
async function controlActuator(actuatorId, action) {
    try {
        const response = await fetch('/api/arduino/control', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                actuator_id: actuatorId,
                accion: action
            })
        });

        const result = await response.json();

        if (result.success) {
            showNotification(`✅ Actuador ${action === 'encender' ? 'encendido' : 'apagado'} exitosamente`, 'success');
            
            // Si el calendario fue desactivado, notificar
            if (result.calendario_desactivado) {
                setTimeout(() => {
                    showNotification('📅 Calendario de riego automático desactivado', 'info');
                }, 1500);
            }
            
            setTimeout(() => {
                window.location.reload();
            }, 2000);
        } else if (result.offline) {
            // Dispositivo offline
            showNotification(`⚠️ ${result.message}`, 'warning');
            if (result.details) {
                setTimeout(() => {
                    showNotification(`ℹ️ ${result.details}`, 'info');
                }, 1000);
            }
            if (result.suggestion) {
                setTimeout(() => {
                    showNotification(`💡 ${result.suggestion}`, 'info');
                }, 2000);
            }
        } else {
            // Otros errores
            const errorMsg = result.message || 'Error al controlar actuador';
            showNotification(`❌ ${errorMsg}`, 'error');
            
            if (result.details) {
                setTimeout(() => {
                    showNotification(`ℹ️ ${result.details}`, 'info');
                }, 1000);
            }
        }
    } catch (error) {
        console.error('Error:', error);
        showNotification('❌ Error de conexión. Verifica tu red e intenta nuevamente.', 'error');
    }
}

// Actualizar estado del dispositivo en tiempo real
async function updateDeviceStatus(deviceId) {
    try {
        const result = await apiRequest(`/dashboard/device/${deviceId}`);

        if (result.success && result.data) {
            // Actualizar interfaz con los nuevos datos
            updateDeviceUI(result.data.device, result.data.sensors, result.data.actuators);
        } else {
            console.warn('No se pudieron obtener datos del dispositivo', result);
        }
    } catch (error) {
        console.error('Error al actualizar estado:', error);
    }
}

function updateDeviceUI(device, sensors, actuators) {
    // Implementar actualización de la interfaz
    console.log('Actualizando UI:', { device, sensors, actuators });
}

// Parada de emergencia - Detener todos los actuadores
async function emergencyStop(deviceId) {
    if (!confirmAction('🚨 ¿DETENER TODOS LOS ACTUADORES? Esta es una parada de emergencia que detendrá inmediatamente todo el riego.')) {
        return;
    }
    
    try {
        const result = await apiRequest('/api/arduino/emergency-stop', {
            method: 'POST',
            body: JSON.stringify({
                device_id: deviceId
            })
        });

        if (result.success) {
            showNotification('🚨 Parada de emergencia ejecutada - Todos los actuadores detenidos', 'warning');
            setTimeout(() => {
                window.location.reload();
            }, 2000);
        } else {
            showNotification(result.message || 'Error en parada de emergencia', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showNotification('Error en parada de emergencia', 'error');
    }
}

// Actualizar umbrales de humedad remotamente
async function updateThresholds(deviceId) {
    const humidityMin = prompt('Ingrese umbral mínimo de humedad (%) para ENCENDER riego:', '55');
    if (!humidityMin) return;
    
    const humidityMax = prompt('Ingrese umbral máximo de humedad (%) para APAGAR riego:', '70');
    if (!humidityMax) return;
    
    const min = parseFloat(humidityMin);
    const max = parseFloat(humidityMax);
    
    if (isNaN(min) || isNaN(max) || min < 0 || max > 100 || min >= max) {
        showNotification('❌ Valores inválidos. Min debe ser menor que Max y entre 0-100', 'error');
        return;
    }
    
    if (!confirmAction(`¿Actualizar umbrales del Arduino?\n\n🌡️ Encender si < ${min}%\n🌡️ Apagar si > ${max}%`)) {
        return;
    }
    
    try {
        const result = await apiRequest('/api/arduino/update-thresholds', {
            method: 'POST',
            body: JSON.stringify({
                device_id: deviceId,
                humedad_min: min,
                humedad_max: max
            })
        });

        if (result.success) {
            showNotification(`✅ Umbrales actualizados: ${min}% - ${max}%`, 'success');
        } else {
            showNotification(result.message || 'Error al actualizar umbrales', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showNotification('Error al actualizar umbrales', 'error');
    }
}
