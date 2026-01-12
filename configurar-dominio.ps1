# Script para configurar el dominio personalizado picante-sistema.com
# Debe ejecutarse como Administrador

Write-Host "=== Configurador de Dominio Local - Picante Sistema ===" -ForegroundColor Green
Write-Host ""

# Verificar si se ejecuta como administrador
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "ERROR: Este script debe ejecutarse como Administrador" -ForegroundColor Red
    Write-Host "Cierra este terminal y abre PowerShell como Administrador, luego ejecuta:" -ForegroundColor Yellow
    Write-Host "  cd 'c:\Users\USERS\Desktop\clon repo ds2'" -ForegroundColor Cyan
    Write-Host "  .\configurar-dominio.ps1" -ForegroundColor Cyan
    pause
    exit 1
}

# Obtener la IP local del adaptador de red principal
$ipLocal = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.InterfaceAlias -notlike "*Loopback*" -and $_.PrefixOrigin -eq "Dhcp" -or $_.PrefixOrigin -eq "Manual" } | Select-Object -First 1).IPAddress

if (-not $ipLocal) {
    Write-Host "ERROR: No se pudo detectar la IP local automáticamente" -ForegroundColor Red
    Write-Host "Ingresa tu IP local manualmente (ejemplo: 192.168.1.100):" -ForegroundColor Yellow
    $ipLocal = Read-Host
}

Write-Host "IP Local detectada: $ipLocal" -ForegroundColor Cyan
Write-Host ""

# Ruta del archivo hosts
$hostsPath = "$env:SystemRoot\System32\drivers\etc\hosts"

# Verificar si ya existe la entrada
$hostsContent = Get-Content $hostsPath -Raw
$dominio = "picante-sistema.com"

if ($hostsContent -match $dominio) {
    Write-Host "El dominio '$dominio' ya existe en el archivo hosts." -ForegroundColor Yellow
    Write-Host "¿Deseas actualizarlo con la IP actual? (S/N)" -ForegroundColor Yellow
    $respuesta = Read-Host
    
    if ($respuesta -eq 'S' -or $respuesta -eq 's') {
        # Eliminar entrada antigua
        $hostsContent = $hostsContent -replace "(?m)^.*$dominio.*`r?`n?", ""
        Set-Content -Path $hostsPath -Value $hostsContent.Trim()
        Write-Host "Entrada antigua eliminada." -ForegroundColor Green
    } else {
        Write-Host "Operación cancelada." -ForegroundColor Yellow
        pause
        exit 0
    }
}

# Agregar nueva entrada
$nuevaEntrada = "`n$ipLocal    $dominio"
Add-Content -Path $hostsPath -Value $nuevaEntrada

Write-Host ""
Write-Host "✓ Configuración completada exitosamente!" -ForegroundColor Green
Write-Host ""
Write-Host "=== INFORMACIÓN DE ACCESO ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Tu IP local: $ipLocal" -ForegroundColor White
Write-Host "Dominio configurado: http://$dominio:4201" -ForegroundColor White
Write-Host ""
Write-Host "=== INSTRUCCIONES PARA OTROS DISPOSITIVOS ===" -ForegroundColor Yellow
Write-Host ""
Write-Host "Para que otros dispositivos en tu red local puedan acceder:" -ForegroundColor White
Write-Host ""
Write-Host "1. En cada dispositivo (PC, tablet, celular), edita el archivo hosts:" -ForegroundColor White
Write-Host "   - Windows: C:\Windows\System32\drivers\etc\hosts" -ForegroundColor Gray
Write-Host "   - Mac/Linux: /etc/hosts" -ForegroundColor Gray
Write-Host "   - Android: /system/etc/hosts (requiere root)" -ForegroundColor Gray
Write-Host "   - iOS: usa una app como 'Hosts File Editor'" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Agrega esta línea al archivo hosts:" -ForegroundColor White
Write-Host "   $ipLocal    $dominio" -ForegroundColor Cyan
Write-Host ""
Write-Host "3. Guarda el archivo y accede desde el navegador a:" -ForegroundColor White
Write-Host "   http://$dominio:4201" -ForegroundColor Green
Write-Host ""
Write-Host "=== ASEGÚRATE DE: ===" -ForegroundColor Yellow
Write-Host "- Tener el firewall configurado para permitir conexiones en los puertos 8080 y 4201" -ForegroundColor White
Write-Host "- Que todos los dispositivos estén en la misma red WiFi" -ForegroundColor White
Write-Host ""

# Configurar reglas de firewall
Write-Host "¿Deseas agregar reglas de firewall automáticamente? (S/N)" -ForegroundColor Yellow
$firewall = Read-Host

if ($firewall -eq 'S' -or $firewall -eq 's') {
    Write-Host "Configurando firewall..." -ForegroundColor Cyan
    
    # Eliminar reglas existentes si existen
    Remove-NetFirewallRule -DisplayName "Picante Sistema - Backend" -ErrorAction SilentlyContinue
    Remove-NetFirewallRule -DisplayName "Picante Sistema - Frontend" -ErrorAction SilentlyContinue
    
    # Crear nuevas reglas
    New-NetFirewallRule -DisplayName "Picante Sistema - Backend" -Direction Inbound -LocalPort 8080 -Protocol TCP -Action Allow | Out-Null
    New-NetFirewallRule -DisplayName "Picante Sistema - Frontend" -Direction Inbound -LocalPort 4201 -Protocol TCP -Action Allow | Out-Null
    
    Write-Host "✓ Reglas de firewall configuradas" -ForegroundColor Green
}

Write-Host ""
Write-Host "Presiona cualquier tecla para salir..."
pause
