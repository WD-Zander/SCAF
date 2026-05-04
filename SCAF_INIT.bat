@echo off
setlocal enabledelayedexpansion
title SCAF INIT - Sistema de Control de Activos Fijos
color 0A
cd /d "%~dp0"

echo.
echo  =====================================================
echo        SCAF  -  Sistema de Control de Activos
echo        Iniciando servicios...
echo  =====================================================
echo.

:: ── Verificar node_modules ────────────────────────────────────
IF NOT EXIST "node_modules\" (
    echo  [INFO] Primera ejecucion detectada. Instalando dependencias...
    CALL npm install
    echo.
)

:: ── Detectar IP local ─────────────────────────────────────────
set IP=localhost
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4 Address" /c:"Direccion IPv4" /c:"Direcci"') do (
    set CANDIDATE=%%a
    set CANDIDATE=!CANDIDATE: =!
    echo !CANDIDATE! | findstr /r "^100\." >nul && set IP=!CANDIDATE!
    echo !CANDIDATE! | findstr /r "^192\.168\." >nul && set IP=!CANDIDATE!
    echo !CANDIDATE! | findstr /r "^10\." >nul && set IP=!CANDIDATE!
)

:: ── Compilar frontend siempre (para reflejar cambios recientes) ─
echo  [INFO] Compilando el frontend...
echo.
CALL npm run build
IF ERRORLEVEL 1 (
    echo.
    echo  [ERROR] La compilacion fallo. Revisa los errores arriba.
    pause
    exit /b 1
)
echo.

:: ── Iniciar Backend ───────────────────────────────────────────
echo  [1/2] Iniciando Backend (puerto 5000)...
set BACKENDDIR=%~dp0backend
start "SCAF Backend" cmd /k "cd /d "!BACKENDDIR!" && node server.js"

:: Esperar a que el backend levante
timeout /t 3 >nul

:: ── Iniciar Frontend (build) ──────────────────────────────────
echo  [2/2] Iniciando Frontend (puerto 4173)...
echo.
echo  =====================================================
echo.
echo    APP LISTA. Abre en tu navegador:
echo.
echo      Local:   http://localhost:4173
echo      Red:     http://!IP!:4173
echo.
echo    Backend API:
echo      Local:   http://localhost:5000
echo      Red:     http://!IP!:5000
echo.
echo    Para detener: cierra las ventanas negras o
echo    presiona Ctrl+C en cada una.
echo.
echo  =====================================================
echo.

npx serve dist --listen 4173 --single

pause