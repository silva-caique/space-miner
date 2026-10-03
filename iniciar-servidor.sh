#!/bin/sh
# Inicia um servidor local e abre o jogo em http://localhost:8000
cd "$(dirname "$0")"
echo "Abra http://localhost:8000 no navegador. Para parar, pressione Ctrl+C."
if command -v python3 >/dev/null 2>&1; then python3 -m http.server 8000
elif command -v python >/dev/null 2>&1; then python -m http.server 8000
else npx --yes serve -l 8000 .; fi
