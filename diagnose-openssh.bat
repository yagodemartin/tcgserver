@echo off
setlocal enabledelayedexpansion

net session >nul 2>&1
if %errorLevel% neq 0 (
    echo Pidiendo permisos de administrador...
    powershell -Command "Start-Process -FilePath '%0' -Verb RunAs"
    exit /b
)

echo.
echo ========================================
echo   DIAGNÓSTICO OpenSSH
echo ========================================
echo.

echo [1] Estado de Windows Update...
powershell -Command "Get-Service wuauserv | Select-Object Name, Status"

echo.
echo [2] Verificando capacidades de OpenSSH disponibles...
dism /online /get-capabilities | find /i "openssh"

echo.
echo [3] Intento de instalación con DISM (verbose)...
dism /online /add-capability /capabilityname:OpenSSH.Server~~~~0.0.1.0 /all

echo.
echo [4] Después de instalación, buscando sshd...
sc query sshd

echo.
echo [5] Listando TODOS los servicios SSH (si existen)...
powershell -Command "Get-Service | Where-Object {$_.Name -like '*ssh*'}"

echo.
echo [6] Verificando archivos de OpenSSH en disco...
if exist "C:\Program Files\OpenSSH" (
    echo ✓ Carpeta C:\Program Files\OpenSSH encontrada
    dir "C:\Program Files\OpenSSH"
) else (
    echo ✗ Carpeta C:\Program Files\OpenSSH NO encontrada
)

echo.
echo [7] Verificando en System32...
if exist "C:\Windows\System32\OpenSSH" (
    echo ✓ Carpeta C:\Windows\System32\OpenSSH encontrada
    dir "C:\Windows\System32\OpenSSH"
) else (
    echo ✗ Carpeta C:\Windows\System32\OpenSSH NO encontrada
)

echo.
pause
