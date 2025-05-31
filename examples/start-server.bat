@echo off
echo 🥷 Shogun Core Examples - Avvio Server
echo =====================================
echo.

REM Controlla se Python è installato
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python non trovato! Installa Python 3.x per continuare.
    echo    Download: https://www.python.org/downloads/
    pause
    exit /b 1
)

echo ✅ Python trovato
echo 🚀 Avvio server HTTP sulla porta 8080...
echo.

REM Avvia il server in background
start /min cmd /c "python -m http.server 8080"

REM Aspetta un momento per il server
timeout /t 2 /nobreak >nul

echo 🌐 Server avviato su http://localhost:8080
echo 📂 Directory servita: %CD%
echo.

REM Apri il browser
echo 🔗 Apertura browser...
start http://localhost:8080

echo.
echo 📋 Esempi disponibili:
echo    • http://localhost:8080/index.html (Pagina principale)
echo    • http://localhost:8080/auth-nodom.html (Auth completo)
echo    • http://localhost:8080/test-button-simple.html (Test semplice)
echo.
echo ⚠️  Per fermare il server, chiudi questa finestra o premi Ctrl+C
echo.

pause 