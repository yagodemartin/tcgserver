@echo off
REM Descargar e instalar OpenSSH Server desde GitHub (Microsoft)

net session >nul 2>&1
if %errorLevel% neq 0 (
    echo Pidiendo permisos de administrador...
    powershell -Command "Start-Process -FilePath '%0' -Verb RunAs"
    exit /b
)

setlocal enabledelayedexpansion

echo.
echo ========================================
echo   Instalando OpenSSH Server desde GitHub
echo ========================================
echo.

REM Crear carpeta temporal
set TEMP_DIR=%TEMP%\openssh_install
if exist "%TEMP_DIR%" rmdir /s /q "%TEMP_DIR%"
mkdir "%TEMP_DIR%"
cd /d "%TEMP_DIR%"

echo [1] Descargando OpenSSH...
REM URL de la ultima release de OpenSSH para Windows
powershell -Command "
$ProgressPreference = 'SilentlyContinue'
$url = 'https://github.com/PowerShell/Win32-OpenSSH/releases/download/v9.9.1.0p1-Beta/OpenSSH-Win64.zip'
Invoke-WebRequest -Uri $url -OutFile 'OpenSSH-Win64.zip'
Write-Host 'Descarga completada'
"

echo [2] Descomprimiendo...
powershell -Command "Expand-Archive -Path 'OpenSSH-Win64.zip' -DestinationPath '.' -Force"

echo [3] Instalando archivos...
xcopy /E /I /Y "OpenSSH-Win64\*" "C:\Windows\System32\OpenSSH\"

echo [4] Ejecutando script de instalacion...
cd /d "C:\Windows\System32\OpenSSH"
powershell -ExecutionPolicy Bypass -File ".\install-sshd.ps1"

echo [5] Registrando servicio...
sc create sshd binPath= "C:\Windows\System32\OpenSSH\sshd.exe" start= auto DisplayName= "OpenSSH Server"

echo [6] Generando claves...
powershell -Command "& 'C:\Windows\System32\OpenSSH\ssh-keygen.exe' -A"

echo [7] Iniciando servicio...
net start sshd

echo [8] Verificando...
sc query sshd

echo.
echo ========================================
echo   ✓ OpenSSH Server instalado
echo ========================================
echo.

REM Limpiar
cd /d "%TEMP%"
rmdir /s /q "%TEMP_DIR%"

pause
