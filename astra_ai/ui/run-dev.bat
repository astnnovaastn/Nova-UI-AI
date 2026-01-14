@echo off
REM Get the current directory
set "DIR=%~dp0"
cd /d "%DIR%"

REM Run npm start
npm start
