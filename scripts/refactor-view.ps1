# Script para refactorizar vistas Handlebars al nuevo sistema de layouts
param(
    [string]$ViewPath
)

$content = Get-Content $ViewPath -Raw -Encoding UTF8

# Detectar si ya está refactorizado
if ($content -match '<!DOCTYPE html>') {
    Write-Host "Refactorizando: $ViewPath" -ForegroundColor Yellow
    
    # Extraer título
    if ($content -match '<title>(.*?)</title>') {
        $title = $matches[1] -replace ' - Sistema de Riego IoT', ''
        Write-Host "  Título: $title" -ForegroundColor Gray
    }
    
    # Extraer contenido entre <body> y </body>
    if ($content -match '(?s)<body[^>]*>(.*)</body>') {
        $bodyContent = $matches[1]
        
        # Remover {{> navbar}}
        $bodyContent = $bodyContent -replace '\{\{> navbar\}\}', ''
        
        # Extraer el contenido principal (sin navbar)
        # Buscar el primer <div después del navbar
        $bodyContent = $bodyContent -replace '^\s*', ''
        
        # Extraer scripts al final
        $scripts = ''
        if ($bodyContent -match '(?s)(<script[^>]*>.*?</script>\s*)+$') {
            $scripts = $matches[0]
            $bodyContent = $bodyContent -replace '(?s)(<script[^>]*>.*?</script>\s*)+$', ''
        }
        
        # Extraer estilos inline
        $styles = ''
        if ($content -match '(?s)<style>(.*?)</style>') {
            $styles = "<style>`n" + $matches[1] + "`n</style>"
        }
        
        # Crear nuevo contenido
        $newContent = $bodyContent.Trim()
        
        if ($styles) {
            $newContent += "`n`n{{{styles}}}`n$styles"
        }
        
        if ($scripts) {
            $newContent += "`n`n{{{scripts}}}`n$scripts"
        }
        
        # Guardar archivo
        $newContent | Out-File $ViewPath -Encoding UTF8 -NoNewline
        
        Write-Host "  ✓ Refactorizado exitosamente" -ForegroundColor Green
    } else {
        Write-Host "  ! No se pudo extraer contenido del body" -ForegroundColor Red
    }
} else {
    Write-Host "  ✓ Ya refactorizado: $ViewPath" -ForegroundColor Green
}
