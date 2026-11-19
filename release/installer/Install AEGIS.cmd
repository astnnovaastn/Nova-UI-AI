@echo off
rem AEGIS installer. Installs for the current user (no administrator rights) into %LOCALAPPDATA%\Programs\AEGIS.
rem Your data (%APPDATA%\AEGIS) is never removed or replaced by installing or upgrading.
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0installer\Install-AEGIS.ps1" %*
if errorlevel 1 pause
