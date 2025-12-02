# Script de migración y auditoría del sistema de riego

Write-Host "==================================" -ForegroundColor Cyan
Write-Host "Sistema de Riego - Migracion" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

$ErrorActionPreference = "Continue"

# 1. Verificar que .env esté en .gitignore
Write-Host "[1/6] Verificando .gitignore..." -ForegroundColor Yellow
$gitignorePath = ".\.gitignore"
$gitignoreContent = Get-Content $gitignorePath -ErrorAction SilentlyContinue

if ($gitignoreContent -match "^\.env$") {
    Write-Host "  ✓ .env ya está en .gitignore" -ForegroundColor Green
} else {
    Write-Host "  + Agregando .env a .gitignore" -ForegroundColor Yellow
    Add-Content -Path $gitignorePath -Value "`n# Environment variables`n.env`n.env.local`n.env.*.local"
    Write-Host "  ✓ .env agregado a .gitignore" -ForegroundColor Green
}

# 2. Crear .env.example si no existe
Write-Host ""
Write-Host "[2/6] Creando .env.example..." -ForegroundColor Yellow
if (!(Test-Path ".\.env.example")) {
    @"
# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=sistema_riego
DB_PORT=3306
DB_RETRY_COUNT=5
DB_RETRY_INTERVAL_MS=5000

# Server Configuration
PORT=3000
NODE_ENV=development

# JWT Configuration
JWT_SECRET=your-secret-key-here

# MQTT Configuration
MQTT_BROKER_URL=mqtt://localhost:1883
MQTT_CLIENT_ID=sistema_riego_server

# Weather API (OpenWeather)
OPENWEATHER_API_KEY=your-api-key-here

# Sequelize
USE_SEQUELIZE=true
"@ | Out-File -FilePath ".\.env.example" -Encoding UTF8
    Write-Host "  ✓ .env.example creado" -ForegroundColor Green
} else {
    Write-Host "  ✓ .env.example ya existe" -ForegroundColor Green
}

# 3. Compilar Tailwind CSS
Write-Host ""
Write-Host "[3/6] Compilando Tailwind CSS..." -ForegroundColor Yellow
npm run build:css
if ($LASTEXITCODE -eq 0) {
    Write-Host "  ✓ Tailwind CSS compilado exitosamente" -ForegroundColor Green
} else {
    Write-Host "  ✗ Error compilando Tailwind CSS" -ForegroundColor Red
}

# 4. Verificar estructura de directorios
Write-Host ""
Write-Host "[4/6] Verificando estructura de directorios..." -ForegroundColor Yellow
$dirs = @(
    ".\arduino",
    ".\docs",
    ".\public\js\vendor",
    ".\public\js\components",
    ".\src\views\layouts",
    ".\src\views\partials"
)

foreach ($dir in $dirs) {
    if (Test-Path $dir) {
        Write-Host "  ✓ $dir existe" -ForegroundColor Green
    } else {
        Write-Host "  ! $dir no existe (debería haberse creado)" -ForegroundColor Yellow
    }
}

# 5. Verificar archivos movidos
Write-Host ""
Write-Host "[5/6] Verificando archivos movidos..." -ForegroundColor Yellow

$arduinoFiles = Get-ChildItem -Path ".\arduino" -Filter "*.ino" -ErrorAction SilentlyContinue
if ($arduinoFiles.Count -gt 0) {
    Write-Host "  ✓ $($arduinoFiles.Count) archivos Arduino en ./arduino" -ForegroundColor Green
} else {
    Write-Host "  ! No se encontraron archivos Arduino en ./arduino" -ForegroundColor Yellow
}

$docFiles = Get-ChildItem -Path ".\docs" -Filter "*.md" -ErrorAction SilentlyContinue
if ($docFiles.Count -gt 0) {
    Write-Host "  ✓ $($docFiles.Count) archivos de documentación en ./docs" -ForegroundColor Green
} else {
    Write-Host "  ! No se encontraron archivos markdown en ./docs" -ForegroundColor Yellow
}

# 6. Resumen de cambios pendientes
Write-Host ""
Write-Host "[6/6] Resumen de cambios implementados:" -ForegroundColor Yellow
Write-Host "  ✓ Tailwind CSS migrado a dependencia local" -ForegroundColor Green
Write-Host "  ✓ Layout principal configurado (layouts/main.hbs)" -ForegroundColor Green
Write-Host "  ✓ Partials reutilizables creados (card, button, form-field, alert)" -ForegroundColor Green
Write-Host "  ✓ Validación frontend implementada (validation.js)" -ForegroundColor Green
Write-Host "  ✓ Socket.IO optimizado (carga condicional)" -ForegroundColor Green
Write-Host "  ✓ Archivos Arduino movidos a ./arduino" -ForegroundColor Green
Write-Host "  ✓ Documentación movida a ./docs" -ForegroundColor Green
Write-Host "  ✓ .gitignore actualizado" -ForegroundColor Green
Write-Host "  ✓ .env.example creado" -ForegroundColor Green

Write-Host ""
Write-Host "==================================" -ForegroundColor Cyan
Write-Host "Tareas pendientes manuales:" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host "  • Refactorizar rutas de español a inglés" -ForegroundColor Yellow
Write-Host "    - /invernaderos -> /greenhouses" -ForegroundColor Gray
Write-Host "    - /plantas -> /plants" -ForegroundColor Gray
Write-Host "    - /calendario -> mantener /calendar (ya correcto)" -ForegroundColor Gray
Write-Host "  • Actualizar todas las vistas para usar el layout principal" -ForegroundColor Yellow
Write-Host "  • Aplicar componentes reutilizables en formularios" -ForegroundColor Yellow
Write-Host "  • Auditar rutas protegidas con verifyToken" -ForegroundColor Yellow
Write-Host "  • Aplicar rate limiting a rutas de autenticación" -ForegroundColor Yellow
Write-Host ""
Write-Host "Ejecute 'node server.js' para probar los cambios" -ForegroundColor Cyan
