// Funciones globales para el sistema

// Logout
async function logout() {
    try {
        const response = await fetch('/auth/logout', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            window.location.href = '/auth/login';
        }
    } catch (error) {
        console.error('Error al cerrar sesión:', error);
        showNotification('Error al cerrar sesión', 'error');
    }
}

// Mostrar notificación
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    
    // Base classes
    let classes = 'fixed top-5 right-5 px-6 py-4 rounded-lg shadow-lg z-50 transform transition-all duration-300 translate-x-full flex items-center gap-3';
    
    // Type specific classes
    if (type === 'success') {
        classes += ' bg-green-500 text-white';
    } else if (type === 'error') {
        classes += ' bg-red-500 text-white';
    } else if (type === 'warning') {
        classes += ' bg-yellow-500 text-white';
    } else {
        classes += ' bg-blue-500 text-white';
    }
    
    notification.className = classes;
    
    // Icon based on type
    let icon = '';
    if (type === 'success') icon = '<i class="fas fa-check-circle"></i>';
    else if (type === 'error') icon = '<i class="fas fa-exclamation-circle"></i>';
    else if (type === 'warning') icon = '<i class="fas fa-exclamation-triangle"></i>';
    else icon = '<i class="fas fa-info-circle"></i>';
    
    notification.innerHTML = `${icon} <span class="font-medium">${message}</span>`;

    // Accessibility
    notification.setAttribute('role', 'status');
    notification.setAttribute('aria-live', type === 'error' ? 'assertive' : 'polite');

    document.body.appendChild(notification);

    // Animate in
    requestAnimationFrame(() => {
        notification.classList.remove('translate-x-full');
    });

    // Remove after delay
    setTimeout(() => {
        notification.classList.add('translate-x-full');
        setTimeout(() => {
            if (notification.parentNode) document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// Formatear fecha
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString('es', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Confirmar acción
function confirmAction(message) {
    return confirm(message);
}

// Hacer petición API
async function apiRequest(url, options = {}) {
    try {
        // Incluir cookies por defecto (sesiones JWT en cookies)
        const fetchOptions = {
            credentials: 'same-origin',
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            }
        };

        // Añadir token CSRF si existe en meta
        const csrfMeta = document.querySelector('meta[name="csrf-token"]');
        if (csrfMeta && csrfMeta.content) {
            fetchOptions.headers['X-CSRF-Token'] = csrfMeta.content;
        }

        const response = await fetch(url, fetchOptions);

        const contentType = response.headers.get('content-type') || '';

        let data;
        if (contentType.includes('application/json')) {
            try {
                data = await response.json();
            } catch (err) {
                console.warn('Respuesta JSON inválida:', err);
                data = null;
            }
        } else {
            data = await response.text();
        }

        if (!response.ok) {
            return { success: false, status: response.status, data };
        }

        return { success: true, status: response.status, data };
    } catch (error) {
        console.error('Error en la petición:', error);
        return { success: false, error: error.message };
    }
}

// --- Sistema de Notificaciones ---

// Solicitar permiso para notificaciones del navegador
function requestNotificationPermission() {
    if (!("Notification" in window)) {
        console.log("Este navegador no soporta notificaciones de escritorio");
        return;
    }

    if (Notification.permission !== "granted" && Notification.permission !== "denied") {
        Notification.requestPermission().then(permission => {
            if (permission === "granted") {
                console.log("Permiso de notificaciones concedido");
            }
        });
    }
}

// Mostrar notificación del sistema (navegador)
function showSystemNotification(title, body, icon = '/favicon.ico') {
    if (Notification.permission === "granted") {
        new Notification(title, {
            body: body,
            icon: icon
        });
    }
}

// Inicializar listeners de Socket.io para notificaciones
document.addEventListener('DOMContentLoaded', () => {
    // Solicitar permisos
    requestNotificationPermission();

    // Verificar si socket está definido (globalmente en layout)
    if (typeof socket !== 'undefined') {
        
        // Alerta: Sugerencia de Riego
        socket.on('alert:riego_sugerido', (data) => {
            console.log('Sugerencia de riego:', data);
            showNotification(data.message, 'warning');
            showSystemNotification('Sugerencia de Riego', data.message);
        });

        // Alerta: Riego Activo
        socket.on('alert:riego_activo', (data) => {
            console.log('Riego activo:', data);
            showNotification(data.message, 'success');
            showSystemNotification('Riego Iniciado', data.message);
        });
    }
});
