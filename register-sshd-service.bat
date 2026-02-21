@echo off
REM Registrar manualmente el servicio sshd de OpenSSH

net session >nul 2>&1
if %errorLevel% neq 0 (
    echo Pidiendo permisos de administrador...
    powershell -Command "Start-Process -FilePath '%0' -Verb RunAs"
    exit /b
)

echo.
echo ========================================
echo   Registrando servicio SSHD
echo ========================================
echo.

echo [1] Eliminando servicio anterior si existe...
sc delete sshd >nul 2>&1

echo [2] Registrando nuevo servicio sshd...
sc create sshd binPath= "C:\Windows\System32\OpenSSH\sshd.exe" start= auto DisplayName= "OpenSSH Server"

echo [3] Configurando permisos...
icacls "C:\Windows\System32\OpenSSH\sshd.exe" /grant:r "NT SERVICE\sshd:(F)" >nul 2>&1

echo [4] Generando claves SSH si no existen...
if not exist "C:\ProgramData\ssh\ssh_host_key" (
    echo Generando host keys...
    powershell -Command "& 'C:\Windows\System32\OpenSSH\ssh-keygen.exe' -A"
)

echo [5] Fijando permisos en carpeta ssh...
icacls "C:\ProgramData\ssh" /inheritance:r /grant:r "SYSTEM:(OI)(CI)(F)" "Administrators:(OI)(CI)(F)" >nul 2>&1

echo [6] Iniciando servicio...
net start sshd

echo [7] Verificando estado...
sc query sshd

echo.
echo ========================================
echo   ✓ Servicio SSHD registrado
echo ========================================
echo.
pause
