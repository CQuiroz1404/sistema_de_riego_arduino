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
        alert('Error al cerrar sesión');
    }
}

// Mostrar notificación
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;

    // Accessibility
    notification.setAttribute('role', 'status');
    notification.setAttribute('aria-live', type === 'error' ? 'assertive' : 'polite');

    notification.style.position = 'fixed';
    notification.style.top = '20px';
    notification.style.right = '20px';
    notification.style.padding = '1rem 1.5rem';
    notification.style.borderRadius = '4px';
    notification.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
    notification.style.zIndex = '9999';
    notification.style.animation = 'slideIn 0.3s ease';

    if (type === 'success') {
        notification.style.backgroundColor = '#27ae60';
        notification.style.color = '#fff';
    } else if (type === 'error') {
        notification.style.backgroundColor = '#e74c3c';
        notification.style.color = '#fff';
    } else if (type === 'warning') {
        notification.style.backgroundColor = '#f39c12';
        notification.style.color = '#fff';
    } else {
        notification.style.backgroundColor = '#3498db';
        notification.style.color = '#fff';
    }

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
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

// Animaciones CSS
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

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
