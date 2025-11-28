# Guía de Uso - Nuevos Componentes

## Configuración del Layout

### Uso Básico

Todas las vistas ahora usan automáticamente el layout principal `layouts/main.hbs`. Solo necesitas escribir el contenido:

```handlebars
{{!-- src/views/mi-vista.hbs --}}
<div class="container mx-auto px-4 py-8">
    <h1>Mi Vista</h1>
    <p>Contenido aquí</p>
</div>
```

### Configurar Librerías Externas

Puedes activar librerías específicas pasando opciones al renderizar:

```javascript
// En tu controlador
res.render('mi-vista', {
    useSocketIO: true,        // Carga Socket.IO
    useThreeJS: true,         // Carga Three.js
    useFullCalendar: true,    // Carga FullCalendar
    title: 'Mi Página',
    user: req.user
});
```

### Sin Navbar

Para vistas como login/register sin navbar:

```javascript
res.render('auth/login', {
    noNavbar: true,
    title: 'Login'
});
```

### Scripts y Estilos Adicionales

```javascript
res.render('mi-vista', {
    styles: '<link rel="stylesheet" href="/css/custom.css">',
    scripts: '<script src="/js/custom.js"></script>'
});
```

## Componentes Reutilizables

### 1. Card Component

```handlebars
{{!-- Card simple --}}
{{> card 
    title="Título de la Card"
    icon="fa-seedling"
    color="green"
    content="<p>Contenido HTML aquí</p>"
}}

{{!-- Card sin padding (para tablas) --}}
{{> card 
    title="Dispositivos"
    icon="fa-microchip"
    color="blue"
    noPadding=true
    content="<table>...</table>"
}}

{{!-- Card con subtítulo --}}
{{> card 
    title="Dashboard"
    subtitle="Vista general del sistema"
    icon="fa-chart-line"
    color="primary"
    class="mb-6"
    content="<div>...</div>"
}}
```

### 2. Button Component

```handlebars
{{!-- Botón con link --}}
{{> button 
    text="Crear Nuevo"
    icon="fa-plus"
    color="green"
    href="/devices/create"
}}

{{!-- Botón de submit --}}
{{> button 
    text="Guardar"
    icon="fa-save"
    color="blue"
    type="submit"
}}

{{!-- Botón deshabilitado --}}
{{> button 
    text="Procesando..."
    color="gray"
    disabled=true
}}

{{!-- Botón full width --}}
{{> button 
    text="Iniciar Sesión"
    icon="fa-sign-in-alt"
    color="green"
    fullWidth=true
}}

{{!-- Colores disponibles: green, blue, red, gray --}}
```

### 3. Form Field Component

```handlebars
{{!-- Input de texto --}}
{{> form-field 
    label="Nombre"
    name="nombre"
    type="text"
    required=true
    placeholder="Ingrese nombre"
    minlength="3"
    maxlength="50"
}}

{{!-- Input de email --}}
{{> form-field 
    label="Email"
    name="email"
    type="email"
    required=true
    placeholder="correo@ejemplo.com"
}}

{{!-- Input de número --}}
{{> form-field 
    label="Cantidad"
    name="cantidad"
    type="number"
    min="0"
    max="100"
    step="0.1"
    required=true
}}

{{!-- Textarea --}}
{{> form-field 
    label="Descripción"
    name="descripcion"
    textarea=true
    rows="4"
    maxlength="200"
    help="Máximo 200 caracteres"
}}

{{!-- Select --}}
{{> form-field 
    label="Tipo"
    name="tipo"
    select=true
    required=true
    placeholder="Seleccione una opción"
    options="<option value='1'>Opción 1</option><option value='2'>Opción 2</option>"
}}

{{!-- Password con toggle --}}
{{> form-field 
    label="Contraseña"
    name="password"
    type="password"
    required=true
    showPasswordToggle=true
}}

{{!-- Input con valor predefinido --}}
{{> form-field 
    label="IP Address"
    name="ip"
    type="text"
    value="192.168.1.1"
    pattern="^(\d{1,3}\.){3}\d{1,3}$"
}}
```

### 4. Alert Component

```handlebars
{{!-- Alert de éxito --}}
{{> alert 
    type="success"
    message="Operación completada exitosamente"
}}

{{!-- Alert de error --}}
{{> alert 
    type="error"
    title="Error de validación"
    message="Por favor revise los campos marcados en rojo"
}}

{{!-- Alert de advertencia --}}
{{> alert 
    type="warning"
    message="Esta acción no se puede deshacer"
}}

{{!-- Alert de información --}}
{{> alert 
    type="info"
    message="Recuerde guardar sus cambios"
    dismissible=true
}}

{{!-- Tipos disponibles: success, error, warning, info --}}
```

## Validación de Formularios

### Activar Validación Automática

```handlebars
<form data-validate="true" method="POST" action="/devices">
    {{> form-field 
        label="Nombre"
        name="nombre"
        type="text"
        required=true
        minlength="3"
    }}
    
    {{> form-field 
        label="Email"
        name="email"
        type="email"
        required=true
    }}
    
    {{> button 
        text="Guardar"
        type="submit"
        color="green"
    }}
</form>
```

### Validación Manual

```javascript
// Validar un campo específico
const isValid = validateField(document.getElementById('email'));

// Mostrar alerta dinámica
showAlert('Formulario enviado exitosamente', 'success');
showAlert('Error al procesar', 'error', 5000); // 5 segundos
```

### Toggle de Contraseña

```handlebars
<input type="password" id="password" name="password">
<button type="button" onclick="togglePasswordVisibility('password')">
    <i class="fas fa-eye" id="password-icon"></i>
</button>
```

## Estilos Responsive

### Breakpoints de Tailwind

```handlebars
{{!-- Mobile first --}}
<div class="text-sm sm:text-base md:text-lg lg:text-xl">
    Texto responsive
</div>

{{!-- Grid responsive --}}
<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
    {{!-- Cards --}}
</div>

{{!-- Flex responsive --}}
<div class="flex flex-col sm:flex-row gap-4">
    <div>Columna 1</div>
    <div>Columna 2</div>
</div>

{{!-- Padding responsive --}}
<div class="p-4 sm:p-6 lg:p-8">
    Contenido
</div>
```

### Breakpoints disponibles:
- `sm:` - 640px
- `md:` - 768px
- `lg:` - 1024px
- `xl:` - 1280px
- `2xl:` - 1536px

## Ejemplos Completos

### Formulario de Creación

```handlebars
<div class="container mx-auto px-4 py-8">
    <div class="max-w-2xl mx-auto">
        {{> card 
            title="Crear Dispositivo"
            subtitle="Registra un nuevo dispositivo Arduino"
            icon="fa-plus-circle"
            color="green"
            content='
                <form data-validate="true" method="POST" action="/devices">
                    <div class="space-y-4">
                        ' (form-field 
                            label="Nombre del Dispositivo"
                            name="nombre"
                            type="text"
                            required=true
                            minlength="3"
                            placeholder="Arduino Riego 01"
                        ) '
                        
                        ' (form-field 
                            label="MAC Address"
                            name="mac_address"
                            type="text"
                            required=true
                            pattern="^([0-9A-Fa-f]{2}:){5}[0-9A-Fa-f]{2}$"
                            placeholder="AA:BB:CC:DD:EE:FF"
                        ) '
                        
                        ' (form-field 
                            label="Descripción"
                            name="descripcion"
                            textarea=true
                            rows="3"
                        ) '
                    </div>
                    
                    <div class="flex gap-4 mt-6">
                        ' (button 
                            text="Cancelar"
                            color="gray"
                            href="/devices"
                        ) '
                        ' (button 
                            text="Crear"
                            icon="fa-save"
                            color="green"
                            type="submit"
                        ) '
                    </div>
                </form>
            '
        }}
    </div>
</div>
```

### Dashboard con Cards

```handlebars
<div class="container mx-auto px-4 py-8">
    <h1 class="text-2xl sm:text-3xl font-bold mb-6">Dashboard</h1>
    
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {{> card 
            title="Dispositivos"
            icon="fa-microchip"
            color="blue"
            content="<p class='text-3xl font-bold'>12</p>"
        }}
        
        {{> card 
            title="Activos"
            icon="fa-check-circle"
            color="green"
            content="<p class='text-3xl font-bold'>8</p>"
        }}
    </div>
</div>
```

## Migración de Vistas Antiguas

### Antes (Vista antigua):

```handlebars
<!DOCTYPE html>
<html>
<head>
    <title>Mi Vista</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="...">
</head>
<body>
    {{> navbar}}
    <div class="container">
        <h1>Contenido</h1>
    </div>
    <script src="/js/main.js"></script>
</body>
</html>
```

### Después (Vista nueva):

```handlebars
{{!-- El layout se aplica automáticamente --}}
<div class="container mx-auto px-4 py-8">
    <h1 class="text-2xl sm:text-3xl font-bold mb-6">Contenido</h1>
    {{!-- Resto del contenido --}}
</div>
```

## Solución de Problemas

### Error: "Layout not found"
- Verificar que exista `src/views/layouts/main.hbs`
- Verificar configuración en `server.js`

### Estilos de Tailwind no funcionan
- Ejecutar `npm run build:css`
- Verificar que `/public/css/tailwind.css` existe

### Validación no funciona
- Agregar `data-validate="true"` al form
- Verificar que `/js/components/validation.js` se cargue

### Toggle de password no funciona
- Verificar función `togglePasswordVisibility()` en scope global
- Usar `showPasswordToggle=true` en form-field

---

**Documentación completa**: Ver `IMPLEMENTATION_SUMMARY.md`
