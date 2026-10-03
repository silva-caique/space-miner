@echo off
cd /d "%~dp0"
echo Abra http://localhost:8000 no navegador. Para parar, feche esta janela.
start "" http://localhost:8000
where py >nul 2>nul && (py -m http.server 8000 & goto :eof)
where python >nul 2>nul && (python -m http.server 8000 & goto :eof)
npx --yes serve -l 8000 .
