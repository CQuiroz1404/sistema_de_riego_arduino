/**
 * Global Network Error Handler
 * Provides centralized error handling for all API calls
 */

// Error notification system
const ErrorHandler = {
    /**
     * Show notification to user
     * @param {string} message - Error message
     * @param {string} type - Type: 'error', 'warning', 'success', 'info'
     * @param {number} duration - Duration in ms (0 = permanent)
     */
    showNotification(message, type = 'error', duration = 5000) {
        // Remove existing notifications
        const existing = document.querySelectorAll('.error-notification');
        existing.forEach(el => el.remove());

        // Create notification element
        const notification = document.createElement('div');
        notification.className = `error-notification error-notification--${type}`;
        
        const colors = {
            error: 'bg-red-500',
            warning: 'bg-yellow-500',
            success: 'bg-green-500',
            info: 'bg-blue-500'
        };

        const icons = {
            error: 'fas fa-exclamation-circle',
            warning: 'fas fa-exclamation-triangle',
            success: 'fas fa-check-circle',
            info: 'fas fa-info-circle'
        };

        notification.innerHTML = `
            <div class="fixed top-4 right-4 ${colors[type]} text-white px-6 py-4 rounded-lg shadow-lg z-50 max-w-md animate-slideIn">
                <div class="flex items-start">
                    <i class="${icons[type]} mt-1 mr-3"></i>
                    <div class="flex-1">
                        <p class="font-semibold">${message}</p>
                    </div>
                    <button onclick="this.parentElement.parentElement.remove()" class="ml-4 text-white hover:text-gray-200">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(notification);

        // Auto-remove after duration
        if (duration > 0) {
            setTimeout(() => {
                if (notification.parentElement) {
                    notification.classList.add('animate-slideOut');
                    setTimeout(() => notification.remove(), 300);
                }
            }, duration);
        }
    },

    /**
     * Enhanced fetch wrapper with error handling
     * @param {string} url - API endpoint
     * @param {object} options - Fetch options
     * @returns {Promise} Response data
     */
    async apiCall(url, options = {}) {
        // Default options
        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            credentials: 'same-origin',
            ...options
        };

        try {
            const response = await fetch(url, defaultOptions);

            // Handle HTTP errors
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                
                let errorMessage = 'Error en la solicitud';
                
                switch (response.status) {
                    case 400:
                        errorMessage = errorData.message || 'Solicitud inválida';
                        break;
                    case 401:
                        errorMessage = 'Sesión expirada. Por favor, inicie sesión nuevamente';
                        setTimeout(() => window.location.href = '/auth/login', 2000);
                        break;
                    case 403:
                        errorMessage = 'No tiene permisos para realizar esta acción';
                        break;
                    case 404:
                        errorMessage = 'Recurso no encontrado';
                        break;
                    case 500:
                        errorMessage = 'Error del servidor. Intente nuevamente más tarde';
                        break;
                    case 503:
                        errorMessage = 'Servicio no disponible. Intente más tarde';
                        break;
                    default:
                        errorMessage = errorData.message || `Error HTTP ${response.status}`;
                }

                throw new Error(errorMessage);
            }

            // Parse response
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                return await response.json();
            }

            return await response.text();

        } catch (error) {
            // Network errors
            if (error.name === 'TypeError' || error.message.includes('Failed to fetch')) {
                this.showNotification(
                    'Error de conexión. Verifique su conexión a internet',
                    'error'
                );
                throw new Error('Network error');
            }

            // Other errors
            this.showNotification(error.message, 'error');
            throw error;
        }
    },

    /**
     * Handle form submission with error handling
     * @param {HTMLFormElement} form - Form element
     * @param {Function} onSuccess - Success callback
     */
    async handleFormSubmit(form, onSuccess) {
        try {
            const formData = new FormData(form);
            const url = form.action;
            const method = form.method.toUpperCase();

            // Convert FormData to JSON if needed
            let body;
            const contentType = form.enctype;

            if (contentType === 'application/json' || method === 'PUT' || method === 'DELETE') {
                const obj = {};
                formData.forEach((value, key) => obj[key] = value);
                body = JSON.stringify(obj);
            } else {
                body = formData;
            }

            const response = await this.apiCall(url, {
                method,
                body: method !== 'GET' ? body : undefined
            });

            this.showNotification('Operación exitosa', 'success');
            
            if (onSuccess) {
                onSuccess(response);
            }

            return response;

        } catch (error) {
            console.error('Form submission error:', error);
            throw error;
        }
    },

    /**
     * Retry failed request with exponential backoff
     * @param {Function} fn - Function to retry
     * @param {number} maxRetries - Maximum retry attempts
     * @param {number} delay - Initial delay in ms
     */
    async retry(fn, maxRetries = 3, delay = 1000) {
        for (let i = 0; i < maxRetries; i++) {
            try {
                return await fn();
            } catch (error) {
                if (i === maxRetries - 1) throw error;
                
                this.showNotification(
                    `Reintentando... (${i + 1}/${maxRetries})`,
                    'warning',
                    2000
                );
                
                await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
            }
        }
    }
};

// Global error handlers
window.addEventListener('unhandledrejection', event => {
    console.error('Unhandled promise rejection:', event.reason);
    ErrorHandler.showNotification(
        'Error inesperado. Por favor, recargue la página',
        'error'
    );
});

window.addEventListener('error', event => {
    console.error('Global error:', event.error);
});

// Check online/offline status
window.addEventListener('online', () => {
    ErrorHandler.showNotification('Conexión restaurada', 'success', 3000);
});

window.addEventListener('offline', () => {
    ErrorHandler.showNotification(
        'Sin conexión a internet',
        'warning',
        0  // Permanent until online
    );
});

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ErrorHandler;
}
