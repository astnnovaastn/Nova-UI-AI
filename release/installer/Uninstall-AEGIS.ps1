# AEGIS uninstaller (V35). Removes the program, its shortcuts and its Apps & features entry.
# Your data (%APPDATA%\AEGIS: research, Work sessions, browser profile, settings, keys) is kept unless -RemoveData.
param([switch]$RemoveData, [switch]$Quiet, [string]$DataRoot = '', [switch]$NoShell)
# -DataRoot / -NoShell are for tests: a throwaway data folder, and no change to the real shortcuts or Apps & features.
$ErrorActionPreference = 'Stop'
$root = $PSScriptRoot
$running = Get-CimInstance Win32_Process -Filter "name='electron.exe'" -ErrorAction SilentlyContinue | Where-Object { $_.ExecutablePath -like "$root*" }
if ($running) { throw 'AEGIS is running. Close it first.' }
if (-not $Quiet) {
    $answer = Read-Host 'Remove AEGIS from this computer? Your data stays unless you add -RemoveData. (y/n)'
    if ($answer -notmatch '^[yY]') { exit 0 }
}
if (-not $NoShell) { foreach ($lnk in @((Join-Path $env:APPDATA 'Microsoft\Windows\Start Menu\Programs\AEGIS.lnk'), (Join-Path ([Environment]::GetFolderPath('Desktop')) 'AEGIS.lnk'))) {
    Remove-Item $lnk -Force -ErrorAction SilentlyContinue
}
& reg.exe delete 'HKCU\Software\Microsoft\Windows\CurrentVersion\Uninstall\AEGIS' /f 2>$null | Out-Null }
$data = if ($DataRoot) { $DataRoot } else { Join-Path $env:APPDATA 'AEGIS' }
if ($RemoveData) { Remove-Item $data -Recurse -Force -ErrorAction SilentlyContinue }
# The script deletes its own folder last, from a temporary copy of PowerShell's working directory.
Set-Location $env:TEMP
Remove-Item $root -Recurse -Force
Write-Host ('AEGIS was removed.' + $(if ($RemoveData) { '' } else { ' Your data was kept in %APPDATA%\AEGIS.' }))
