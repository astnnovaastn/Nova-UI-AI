# AEGIS installer (V35). Run from an extracted AEGIS-Setup-<version> folder, or via "Install AEGIS.cmd".
#   -InstallRoot <dir>     default %LOCALAPPDATA%\Programs\AEGIS
#   -DesktopShortcut       also put AEGIS on the desktop
#   -ImportFrom <folder>   copy state\ and .env from a development copy of AEGIS (only if this computer has no AEGIS data yet)
#   -NoLaunch              do not start AEGIS when done
#   -Quiet                 no prompts (for tests)
# The stock Electron runtime from the bundle runs install.cjs as Node; install.cjs verifies the Ed25519 release
# signature and every checksum before extracting anything into the program folder.
param([string]$InstallRoot = (Join-Path $env:LOCALAPPDATA 'Programs\AEGIS'), [switch]$DesktopShortcut, [string]$ImportFrom = '', [switch]$NoLaunch, [switch]$Quiet, [string]$DataRoot = '', [switch]$NoShell)
$ErrorActionPreference = 'Stop'
$bundle = Split-Path -Parent $PSScriptRoot
Write-Host 'AEGIS installer' -ForegroundColor Cyan
if (-not [Environment]::Is64BitOperatingSystem) { throw 'AEGIS needs 64-bit Windows.' }
$tar = Join-Path $env:SystemRoot 'System32\tar.exe'
if (-not (Test-Path $tar)) { throw 'This version of Windows has no tar.exe (Windows 10 1803 or later is required).' }
$meta = Get-Content (Join-Path $bundle 'aegis-release.json') -Raw | ConvertFrom-Json
Write-Host ("Installing AEGIS {0} ({1}) into {2}" -f $meta.version, $meta.channel, $InstallRoot)

# Is AEGIS running? Upgrading under a running app is refused (the in-app updater handles that case).
$running = Get-CimInstance Win32_Process -Filter "name='electron.exe'" -ErrorAction SilentlyContinue | Where-Object { $_.ExecutablePath -like "$InstallRoot*" }
if ($running) { throw 'AEGIS is running. Close it, then run the installer again.' }

$temp = Join-Path $env:TEMP ('aegis-install-' + [guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Path $temp | Out-Null
try {
    & $tar -xf (Join-Path $bundle $meta.components.electron.asset) -C $temp
    if ($LASTEXITCODE -ne 0) { throw 'Could not unpack the Electron runtime.' }
    $env:ELECTRON_RUN_AS_NODE = '1'
    $arguments = @((Join-Path $PSScriptRoot 'install.cjs'), '--bundle', $bundle, '--root', $InstallRoot)
    if ($DesktopShortcut) { $arguments += '--desktop' }
    if ($ImportFrom) { $arguments += @('--import', $ImportFrom) }
    if ($DataRoot) { $arguments += @('--data', $DataRoot) }   # tests only
    if ($NoShell) { $arguments += '--no-shell' }             # tests only
    # electron.exe is a GUI-subsystem program: PowerShell's & would not wait for it, so it is started and awaited.
    $quoted = ($arguments | ForEach-Object { if ($_ -match '[\s"]') { '"' + ($_ -replace '"', '\"') + '"' } else { $_ } }) -join ' '
    $process = Start-Process -FilePath (Join-Path $temp 'electron.exe') -ArgumentList $quoted -NoNewWindow -Wait -PassThru
    if ($process.ExitCode -ne 0) { throw "The installation did not complete (code $($process.ExitCode)). Nothing in your data folder was changed." }
} finally {
    Remove-Item Env:ELECTRON_RUN_AS_NODE -ErrorAction SilentlyContinue
    Remove-Item $temp -Recurse -Force -ErrorAction SilentlyContinue
}
Copy-Item (Join-Path $PSScriptRoot 'Uninstall-AEGIS.ps1') (Join-Path $InstallRoot 'Uninstall-AEGIS.ps1') -Force
Write-Host 'AEGIS is installed. Start it from the Start Menu.' -ForegroundColor Green
if (-not $NoLaunch) {
    $current = Get-Content (Join-Path $InstallRoot 'current.json') -Raw | ConvertFrom-Json
    Start-Process (Join-Path $InstallRoot ("runtime\electron-{0}\electron.exe" -f $current.electron)) -ArgumentList ('"' + (Join-Path $InstallRoot 'launcher') + '"')
}
