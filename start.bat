@echo off
title Spotify OBS Overlay
cd /d "%~dp0"

echo =======================================================
echo          INICIANDO SPOTIFY OBS OVERLAY
echo =======================================================

if not exist node_modules (
    echo Instalando dependencias necessarias...
    call npm install
)

echo Abrindo o painel no seu navegador...
start http://localhost:3000

echo Iniciando o servidor...
npm start
pause
