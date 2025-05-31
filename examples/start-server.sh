#!/bin/bash

echo "🥷 Shogun Core Examples - Avvio Server"
echo "====================================="
echo

# Controlla se Python è installato
if ! command -v python3 &> /dev/null && ! command -v python &> /dev/null; then
    echo "❌ Python non trovato! Installa Python 3.x per continuare."
    echo "   Ubuntu/Debian: sudo apt install python3"
    echo "   macOS: brew install python3"
    echo "   O scarica da: https://www.python.org/downloads/"
    exit 1
fi

# Usa python3 se disponibile, altrimenti python
PYTHON_CMD="python3"
if ! command -v python3 &> /dev/null; then
    PYTHON_CMD="python"
fi

echo "✅ Python trovato ($PYTHON_CMD)"
echo "🚀 Avvio server HTTP sulla porta 8080..."
echo

# Avvia il server in background
$PYTHON_CMD -m http.server 8080 &
SERVER_PID=$!

# Aspetta un momento per il server
sleep 2

echo "🌐 Server avviato su http://localhost:8080"
echo "📂 Directory servita: $(pwd)"
echo "🔧 PID del server: $SERVER_PID"
echo

# Apri il browser (funziona su macOS e Linux con desktop environment)
echo "🔗 Tentativo di apertura browser..."
if command -v open &> /dev/null; then
    # macOS
    open http://localhost:8080
elif command -v xdg-open &> /dev/null; then
    # Linux
    xdg-open http://localhost:8080
else
    echo "⚠️  Apri manualmente: http://localhost:8080"
fi

echo
echo "📋 Esempi disponibili:"
echo "   • http://localhost:8080/index.html (Pagina principale)"
echo "   • http://localhost:8080/auth-nodom.html (Auth completo)"
echo "   • http://localhost:8080/test-button-simple.html (Test semplice)"
echo
echo "⚠️  Per fermare il server, premi Ctrl+C"
echo

# Funzione per cleanup quando lo script viene terminato
cleanup() {
    echo
    echo "🛑 Fermando il server..."
    kill $SERVER_PID 2>/dev/null
    echo "✅ Server fermato"
    exit 0
}

# Cattura i segnali di terminazione
trap cleanup SIGINT SIGTERM

# Mantieni lo script in esecuzione
wait $SERVER_PID 