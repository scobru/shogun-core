#!/bin/bash

# Script per compilare e testare CryptoIdentityManager
# Usage: ./test-crypto-identities.sh [quick|full]

echo "🔨 Compilazione e Test CryptoIdentityManager"
echo "============================================="

# Controlla se siamo nella directory corretta
if [ ! -f "package.json" ]; then
    echo "❌ Errore: Esegui questo script dalla directory shogun-core"
    exit 1
fi

# Installa le dipendenze se necessario
if [ ! -d "node_modules" ]; then
    echo "📦 Installazione dipendenze..."
    npm install
fi

# Compila il progetto
echo "🔨 Compilazione TypeScript..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Errore durante la compilazione"
    exit 1
fi

echo "✅ Compilazione completata"

# Esegui i test
if [ "$1" = "quick" ]; then
    echo "⚡ Esecuzione test rapido..."
    node quick-test.js
elif [ "$1" = "full" ]; then
    echo "🧪 Esecuzione test completi..."
    node test-crypto-identities.js
else
    echo "ℹ️ Usage: $0 [quick|full]"
    echo "   quick - Test rapido delle funzionalità principali"
    echo "   full  - Test completi con tutti i metodi di autenticazione"
    echo ""
    echo "⚡ Esecuzione test rapido..."
    node quick-test.js
fi

echo ""
echo "🎊 Test completati!"
