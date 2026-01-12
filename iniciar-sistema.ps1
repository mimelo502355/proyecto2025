# Script para iniciar el Sistema Picante
# Ejecutar en PowerShell normal (no requiere administrador)

Write-Host "=== Iniciando Sistema Picante ===" -ForegroundColor Green
Write-Host ""

# Obtener IP local
$ipLocal = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.InterfaceAlias -notlike "*Loopback*" -and $_.PrefixOrigin -eq "Dhcp" -or $_.PrefixOrigin -eq "Manual" } | Select-Object -First 1).IPAddress

Write-Host "Tu IP local es: $ipLocal" -ForegroundColor Cyan
Write-Host ""

# Parar procesos existentes
Write-Host "Deteniendo procesos anteriores..." -ForegroundColor Yellow
Get-Process java,node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

# Iniciar backend
Write-Host "Iniciando Backend (Puerto 8080)..." -ForegroundColor Cyan
$backendPath = "c:\Users\USERS\Desktop\clon repo ds2\Proyect-ing-soft"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$backendPath' ; java -jar target/Proyect-ing-soft-0.0.1-SNAPSHOT.jar" -WindowStyle Minimized

Start-Sleep -Seconds 10

# Iniciar frontend
Write-Host "Iniciando Frontend (Puerto 4201)..." -ForegroundColor Cyan
$frontendPath = "c:\Users\USERS\Desktop\clon repo ds2\frontend-picante-ng"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$frontendPath' ; npm run start" -WindowStyle Minimized

Start-Sleep -Seconds 5

Write-Host ""
Write-Host "✓ Sistema iniciado correctamente!" -ForegroundColor Green
Write-Host ""
Write-Host "=== INFORMACIÓN DE ACCESO ===" -ForegroundColor Yellow
Write-Host ""
Write-Host "Acceso local:" -ForegroundColor White
Write-Host "  http://localhost:4201" -ForegroundColor Cyan
Write-Host "  http://picante-sistema.com:4201" -ForegroundColor Cyan
Write-Host ""
Write-Host "Acceso desde otros dispositivos en la red:" -ForegroundColor White
Write-Host "  http://$($ipLocal):4201" -ForegroundColor Green
Write-Host "  http://picante-sistema.com:4201 (si configuraron el hosts)" -ForegroundColor Green
Write-Host ""
Write-Host "Backend API:" -ForegroundColor White
Write-Host "  http://$($ipLocal):8080" -ForegroundColor Cyan
Write-Host ""
Write-Host "Usuarios de prueba:" -ForegroundColor Yellow
Write-Host "  Admin:  admin / 123456" -ForegroundColor White
Write-Host "  Mesero: mozo1 / 123456" -ForegroundColor White
Write-Host "  Chef:   cocina1 / 123456" -ForegroundColor White
Write-Host ""
Write-Host "Presiona cualquier tecla para salir (los servidores seguirán corriendo)..."
pause
