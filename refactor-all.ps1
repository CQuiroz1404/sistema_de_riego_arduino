$views = @(
    "src/views/devices/index.hbs",
    "src/views/devices/create.hbs",
    "src/views/devices/edit.hbs",
    "src/views/devices/show.hbs",
    "src/views/invernaderos/index.hbs",
    "src/views/invernaderos/create.hbs",
    "src/views/invernaderos/edit.hbs",
    "src/views/invernaderos/show.hbs",
    "src/views/plantas/index.hbs",
    "src/views/plantas/create.hbs",
    "src/views/plantas/edit.hbs",
    "src/views/calendar/index.hbs",
    "src/views/calendario/index.hbs",
    "src/views/calendario/create.hbs",
    "src/views/profile/index.hbs",
    "src/views/auth/register.hbs",
    "src/views/error.hbs",
    "src/views/historial/index.hbs"
)

foreach ($view in $views) {
    if (Test-Path $view) {
        $content = Get-Content $view -Raw
        if ($content -match "<!DOCTYPE html>") {
            $content = $content -replace "(?s)<!DOCTYPE html>.*?<body[^>]*>\s*\{\{> navbar\}\}\s*", ""
            $content = $content -replace "(?s)\s*<script src=`"/js/theme\.js`"></script>.*?</head>", ""
            $content = $content -replace "(?s)</body>\s*</html>\s*$", ""
            $content = $content -replace "<script src=`"https://cdn\.tailwindcss\.com`"></script>.*?</script>", "" -replace "\s{2,}", " "
            $content = $content.Trim()
            if ($content -match "(?s)(<script[^>]*>.*</script>)\s*$") {
                $scripts = $matches[1]
                $content = $content -replace "(?s)(<script[^>]*>.*</script>)\s*$", ""
                $content = $content.Trim() + "`n`n{{{scripts}}}`n" + $scripts
            }
            $content | Out-File $view -Encoding UTF8 -NoNewline
            Write-Host "Refactorizado: $view" -ForegroundColor Green
        }
    }
}
