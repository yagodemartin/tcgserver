@echo off
REM Script para instalar OpenSSH Server en Windows
REM Se auto-eleva a permisos de administrador

:: Verificar si ya está corriendo como admin
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo Pidiendo permisos de administrador...
    powershell -Command "Start-Process -FilePath '%0' -Verb RunAs"
    exit /b
)

echo.
echo ========================================
echo   Instalando OpenSSH Server
echo ========================================
echo.

powershell -Command "Add-WindowsCapability -Online -Name OpenSSH.Server~~~~0.0.1.0"

if %errorLevel% equ 0 (
    echo.
    echo ✓ Instalacion completada
    echo.
    echo Iniciando servicio SSH...
    powershell -Command "Start-Service sshd; Set-Service -Name sshd -StartupType 'Automatic'"
    echo ✓ Servicio SSH habilitado
) else (
    echo.
    echo ✗ Error durante la instalacion
)

echo.
pause
