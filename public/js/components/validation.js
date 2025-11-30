// Componentes reutilizables - Validaciones y utilidades

// Toggle de visibilidad de contraseña
function togglePasswordVisibility(fieldId) {
  const field = document.getElementById(fieldId);
  const icon = document.getElementById(fieldId + '-icon');
  
  if (field.type === 'password') {
    field.type = 'text';
    icon.classList.remove('fa-eye');
    icon.classList.add('fa-eye-slash');
  } else {
    field.type = 'password';
    icon.classList.remove('fa-eye-slash');
    icon.classList.add('fa-eye');
  }
}

// Validación en tiempo real de formularios (excepto passwords)
document.addEventListener('DOMContentLoaded', function() {
  const forms = document.querySelectorAll('form[data-validate="true"]');
  
  forms.forEach(form => {
    const inputs = form.querySelectorAll('input:not([type="password"]), textarea, select');
    
    inputs.forEach(input => {
      // Validación en blur
      input.addEventListener('blur', function() {
        validateField(this);
      });
      
      // Validación en input para campos con pattern
      if (input.hasAttribute('pattern')) {
        input.addEventListener('input', function() {
          validateField(this);
        });
      }
    });
    
    // Prevenir submit si hay errores
    form.addEventListener('submit', function(e) {
      let isValid = true;
      
      inputs.forEach(input => {
        if (!validateField(input)) {
          isValid = false;
        }
      });
      
      if (!isValid) {
        e.preventDefault();
        // Scroll al primer error
        const firstError = form.querySelector('.border-red-500');
        if (firstError) {
          firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
          firstError.focus();
        }
      }
    });
  });
});

// Función de validación de campo individual
function validateField(field) {
  // No validar passwords
  if (field.type === 'password') {
    return true;
  }
  
  let isValid = true;
  let errorMessage = '';
  
  // Limpiar errores previos
  field.classList.remove('border-red-500', 'border-green-500');
  const existingError = field.parentElement.querySelector('.validation-error');
  if (existingError) {
    existingError.remove();
  }
  
  // Required
  if (field.hasAttribute('required') && !field.value.trim()) {
    isValid = false;
    errorMessage = 'Este campo es obligatorio';
  }
  
  // Pattern
  else if (field.hasAttribute('pattern') && field.value) {
    const pattern = new RegExp(field.getAttribute('pattern'));
    if (!pattern.test(field.value)) {
      isValid = false;
      errorMessage = field.getAttribute('data-pattern-error') || 'Formato inválido';
    }
  }
  
  // Email
  else if (field.type === 'email' && field.value) {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(field.value)) {
      isValid = false;
      errorMessage = 'Email inválido';
    }
  }
  
  // Number
  else if (field.type === 'number' && field.value) {
    const num = parseFloat(field.value);
    if (isNaN(num)) {
      isValid = false;
      errorMessage = 'Debe ser un número';
    } else {
      if (field.hasAttribute('min') && num < parseFloat(field.getAttribute('min'))) {
        isValid = false;
        errorMessage = `Mínimo: ${field.getAttribute('min')}`;
      }
      if (field.hasAttribute('max') && num > parseFloat(field.getAttribute('max'))) {
        isValid = false;
        errorMessage = `Máximo: ${field.getAttribute('max')}`;
      }
    }
  }
  
  // MinLength
  else if (field.hasAttribute('minlength') && field.value) {
    if (field.value.length < parseInt(field.getAttribute('minlength'))) {
      isValid = false;
      errorMessage = `Mínimo ${field.getAttribute('minlength')} caracteres`;
    }
  }
  
  // MaxLength
  else if (field.hasAttribute('maxlength') && field.value) {
    if (field.value.length > parseInt(field.getAttribute('maxlength'))) {
      isValid = false;
      errorMessage = `Máximo ${field.getAttribute('maxlength')} caracteres`;
    }
  }
  
  // Mostrar resultado de validación
  if (!isValid) {
    field.classList.add('border-red-500');
    const errorDiv = document.createElement('p');
    errorDiv.className = 'validation-error mt-1 text-xs text-red-600 dark:text-red-400';
    errorDiv.textContent = errorMessage;
    
    // Insertar después del campo o su contenedor padre si existe
    const container = field.parentElement.classList.contains('relative') 
      ? field.parentElement 
      : field;
    container.parentNode.insertBefore(errorDiv, container.nextSibling);
  } else if (field.value) {
    field.classList.add('border-green-500');
  }
  
  return isValid;
}

// Utilidad para mostrar alertas dinámicas
function showAlert(message, type = 'info', duration = 5000) {
  const alertContainer = document.getElementById('alert-container') || createAlertContainer();
  
  const icons = {
    success: 'fa-check-circle text-green-500',
    error: 'fa-exclamation-circle text-red-500',
    warning: 'fa-exclamation-triangle text-yellow-500',
    info: 'fa-info-circle text-blue-500'
  };
  
  const colors = {
    success: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-300',
    error: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-300',
    warning: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800 text-yellow-800 dark:text-yellow-300',
    info: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-300'
  };
  
  const alert = document.createElement('div');
  alert.className = `mb-4 p-4 rounded-lg border relative pr-12 ${colors[type]} animate-fade-in`;
  alert.innerHTML = `
    <div class="flex items-start gap-3">
      <div class="flex-shrink-0 mt-0.5">
        <i class="fas ${icons[type]}"></i>
      </div>
      <div class="flex-1">
        <p class="text-sm">${message}</p>
      </div>
    </div>
    <button onclick="this.parentElement.remove()" class="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
      <i class="fas fa-times"></i>
    </button>
  `;
  
  alertContainer.appendChild(alert);
  
  if (duration > 0) {
    setTimeout(() => {
      alert.style.opacity = '0';
      alert.style.transition = 'opacity 0.5s';
      setTimeout(() => alert.remove(), 500);
    }, duration);
  }
}

function createAlertContainer() {
  const container = document.createElement('div');
  container.id = 'alert-container';
  container.className = 'fixed top-4 right-4 z-50 w-full max-w-md';
  document.body.appendChild(container);
  return container;
}

// Exponer funciones globalmente
window.togglePasswordVisibility = togglePasswordVisibility;
window.validateField = validateField;
window.showAlert = showAlert;
