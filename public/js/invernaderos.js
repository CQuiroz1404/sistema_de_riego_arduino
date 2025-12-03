// Invernaderos JavaScript

/**
 * Activa o detiene el riego manual en el invernadero
 * Busca el primer dispositivo y actuador de tipo bomba asociado
 */
async function activarRiegoManual(invernaderoId) {
    try {
        showNotification('⏳ Buscando dispositivos y actuadores...', 'info');
        
        // Obtener el primer dispositivo del invernadero
        const deviceCard = document.querySelector('[data-device-id]');
        
        if (!deviceCard) {
            showNotification('⚠️ No hay dispositivos vinculados a este invernadero', 'warning');
            setTimeout(() => {
                showNotification('💡 Asigna un dispositivo desde la sección de Dispositivos', 'info');
            }, 1500);
            return;
        }
        
        const deviceId = deviceCard.getAttribute('data-device-id');
        
        // Hacer solicitud al endpoint para obtener actuadores del dispositivo
        const deviceResponse = await fetch(`/api/devices/${deviceId}/actuators`, {
            headers: {
                'Accept': 'application/json'
            }
        });
        
        if (!deviceResponse.ok) {
            // Si falla, intentar obtener del HTML actual
            const bombaActual = obtenerEstadoBombaDesdeDOM();
            if (bombaActual) {
                await controlarBomba(bombaActual.id, bombaActual.estado === 'encendido' ? 'apagar' : 'encender');
                return;
            }
            throw new Error('No se pudo obtener información del dispositivo');
        }
        
        const actuadores = await deviceResponse.json();
        
        // Buscar actuador de tipo bomba
        const bomba = actuadores.find(act => act.tipo === 'bomba' || act.tipo === 'rele' || act.nombre.toLowerCase().includes('bomba'));
        
        if (!bomba) {
            showNotification('⚠️ No se encontró ninguna bomba en el dispositivo', 'warning');
            setTimeout(() => {
                showNotification('💡 Configura un actuador tipo bomba en el dispositivo', 'info');
            }, 1500);
            return;
        }
        
        // Determinar acción según estado actual
        const accion = bomba.estado === 'encendido' ? 'apagar' : 'encender';
        await controlarBomba(bomba.id, accion);
        
    } catch (error) {
        console.error('Error:', error);
        showNotification('❌ Error al procesar solicitud: ' + error.message, 'error');
    }
}

/**
 * Obtiene el estado de la bomba desde el DOM si está disponible
 */
function obtenerEstadoBombaDesdeDOM() {
    // Intentar encontrar información de la bomba en el DOM
    const btnRiego = document.getElementById('btnRiegoManual');
    if (btnRiego && btnRiego.dataset.actuatorId) {
        return {
            id: parseInt(btnRiego.dataset.actuatorId),
            estado: btnRiego.dataset.estado || 'apagado'
        };
    }
    return null;
}

/**
 * Controla la bomba (enciende o apaga)
 */
async function controlarBomba(actuatorId, accion) {
    const actionText = accion === 'encender' ? 'Encendiendo' : 'Apagando';
    showNotification(`⏳ ${actionText} bomba...`, 'info');
    
    const result = await fetch('/api/arduino/control', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        body: JSON.stringify({
            actuator_id: actuatorId,
            accion: accion
        })
    });

    const response = await result.json();

    if (response.success) {
        const accionRealizada = accion === 'encender' ? 'encendido' : 'apagado';
        showNotification(`✅ Riego ${accionRealizada} exitosamente`, 'success');
        
        // Actualizar botón inmediatamente sin recargar
        actualizarBotonRiego(accion === 'encender' ? 'encendido' : 'apagado', actuatorId);
        
        if (response.calendario_desactivado) {
            setTimeout(() => {
                showNotification('📅 Calendario de riego automático desactivado', 'info');
            }, 1500);
        }
    } else if (response.offline) {
        // Dispositivo offline
        showNotification(`⚠️ ${response.message}`, 'warning');
        if (response.details) {
            setTimeout(() => {
                showNotification(`ℹ️ ${response.details}`, 'info');
            }, 1000);
        }
        if (response.suggestion) {
            setTimeout(() => {
                showNotification(`💡 ${response.suggestion}`, 'info');
            }, 2000);
        }
    } else {
        const errorMsg = response.message || 'Error al controlar riego';
        showNotification(`❌ ${errorMsg}`, 'error');
        
        if (response.details) {
            setTimeout(() => {
                showNotification(`ℹ️ ${response.details}`, 'info');
            }, 1000);
        }
    }
}

/**
 * Actualiza el botón de riego según el estado
 */
function actualizarBotonRiego(estado, actuatorId) {
    const btnRiego = document.getElementById('btnRiegoManual');
    const btnTexto = document.getElementById('btnRiegoTexto');
    const btnIcono = btnRiego ? btnRiego.querySelector('i') : null;
    
    if (!btnRiego) return;
    
    // Guardar estado en dataset
    btnRiego.dataset.estado = estado;
    btnRiego.dataset.actuatorId = actuatorId;
    
    if (estado === 'encendido') {
        // Cambiar a botón de "Detener Riego"
        btnRiego.classList.remove('bg-blue-600', 'hover:bg-blue-700');
        btnRiego.classList.add('bg-red-600', 'hover:bg-red-700');
        if (btnTexto) btnTexto.textContent = 'Detener Riego';
        if (btnIcono) {
            btnIcono.classList.remove('fa-shower');
            btnIcono.classList.add('fa-stop');
        }
    } else {
        // Cambiar a botón de "Activar Riego Manual"
        btnRiego.classList.remove('bg-red-600', 'hover:bg-red-700');
        btnRiego.classList.add('bg-blue-600', 'hover:bg-blue-700');
        if (btnTexto) btnTexto.textContent = 'Activar Riego Manual';
        if (btnIcono) {
            btnIcono.classList.remove('fa-stop');
            btnIcono.classList.add('fa-shower');
        }
    }
}
