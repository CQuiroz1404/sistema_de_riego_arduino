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
        const result = await apiRequest('/api/arduino/control', {
            method: 'POST',
            body: JSON.stringify({
                actuator_id: actuatorId,
                accion: action
            })
        });
        
        if (result.success) {
            showNotification(`Actuador ${action === 'encender' ? 'encendido' : 'apagado'} exitosamente`, 'success');
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        } else {
            showNotification(result.data.message || 'Error al controlar actuador', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showNotification('Error al controlar actuador', 'error');
    }
}

// Actualizar estado del dispositivo en tiempo real
async function updateDeviceStatus(deviceId) {
    try {
        const response = await fetch(`/dashboard/device/${deviceId}`);
        const result = await response.json();
        
        if (result.success) {
            // Actualizar interfaz con los nuevos datos
            updateDeviceUI(result.device, result.sensors, result.actuators);
        }
    } catch (error) {
        console.error('Error al actualizar estado:', error);
    }
}

function updateDeviceUI(device, sensors, actuators) {
    // Implementar actualización de la interfaz
    console.log('Actualizando UI:', { device, sensors, actuators });
}
