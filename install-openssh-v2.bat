@echo off
REM Script mejorado para instalar OpenSSH Server en Windows
setlocal enabledelayedexpansion

:: Verificar si ya está corriendo como admin
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo Pidiendo permisos de administrador...
    powershell -Command "Start-Process -FilePath '%0' -Verb RunAs"
    exit /b
)

echo.
echo ========================================
echo   Instalando OpenSSH Server (v2)
echo ========================================
echo.

echo [1/3] Intentando Add-WindowsCapability...
powershell -Command "Add-WindowsCapability -Online -Name OpenSSH.Server~~~~0.0.1.0"

timeout /t 2 >nul

echo.
echo [2/3] Verificando si se instaló...
powershell -Command "Get-Service sshd -ErrorAction SilentlyContinue" >nul 2>&1

if %errorLevel% equ 0 (
    echo ✓ Servicio encontrado
) else (
    echo ✗ Servicio no encontrado. Intentando método alternativo...
    echo [Alt] Usando DISM...
    dism /online /add-capability /capabilityname:OpenSSH.Server~~~~0.0.1.0
    timeout /t 2 >nul
)

echo.
echo [3/3] Iniciando servicio SSH...
powershell -Command "Start-Service sshd; Set-Service -Name sshd -StartupType 'Automatic'; Get-Service sshd"

echo.
echo ========================================
echo   Instalacion completada
echo ========================================
echo.
pause
