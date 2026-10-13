param([switch]$NoBrowser)
$ErrorActionPreference = 'Stop'
$root = $PSScriptRoot
$backend = Join-Path $root 'astra_ai\ui\backend'
$backendEntry = Join-Path $root 'scripts\nova_runtime.py'
$frontend = Join-Path $root 'astra_ai\ui\frontend'
$venv = Join-Path $root '.venv'
$python = Join-Path $venv 'Scripts\python.exe'
$logs = Join-Path $root 'logs'
New-Item -ItemType Directory -Path $logs -Force | Out-Null

$envFile = Join-Path $root '.env'
$keyConfigured = -not [string]::IsNullOrWhiteSpace($env:GEMINI_API_KEY)
if (Test-Path $envFile) {
    $keyConfigured = Select-String -Path $envFile -Pattern '^\s*GEMINI_API_KEY\s*=\s*\S' -Quiet
    if (Select-String -Path $envFile -Pattern '^\s*GEMINI_API_KEY\s*=\s*replace_with_a_new_gemini_api_key\s*$' -Quiet) { $keyConfigured = $false }
}
if (-not $keyConfigured) { Write-Warning 'Gemini is not configured. Add GEMINI_API_KEY to the root .env to enable AI conversations.' }
if (-not (Test-Path (Join-Path $backend 'server.py')) -or -not (Test-Path (Join-Path $frontend 'vite.config.ts'))) {
    throw 'Run this launcher from the Nova project root; backend or frontend files are missing.'
}

if (-not (Test-Path $python)) {
    $bundledPython = Join-Path $env:USERPROFILE '.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe'
    if (Test-Path $bundledPython) {
        & $bundledPython -m venv $venv
        if ($LASTEXITCODE -ne 0) { throw 'Could not create the Python environment.' }
    } else {
    $py = Get-Command py -ErrorAction SilentlyContinue
    if (-not $py) { throw 'Python 3.12 is required. Install Python 3.12 with the Windows py launcher, then run this again.' }
    & $py.Source -3.12 -m venv $venv
    if ($LASTEXITCODE -ne 0) { throw 'Could not create the Python 3.12 environment.' }
    }
}

$runtimeReady = $false
& $python -c 'import fastapi, uvicorn, google.genai, dotenv, yaml, PIL, icalendar, caldav' 2>$null | Out-Null
$runtimeReady = ($LASTEXITCODE -eq 0)
if (-not $runtimeReady) {
    Write-Host 'Installing backend packages from the project requirements...'
    & $python -m pip install -r (Join-Path $backend 'requirements.txt')
    if ($LASTEXITCODE -ne 0) { throw 'Backend dependency installation failed.' }
}

$npm = Get-Command npm.cmd -ErrorAction SilentlyContinue
$node = Get-Command node.exe -ErrorAction SilentlyContinue
if (-not $node) {
    $bundledNode = Join-Path $env:USERPROFILE '.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe'
    if (Test-Path $bundledNode) { $node = Get-Item $bundledNode | Select-Object @{Name='Source';Expression={$_.FullName}} }
}
if (-not $node) { throw 'Node.js is required to run the frontend.' }
$vite = Join-Path $frontend 'node_modules\vite\bin\vite.js'
if (-not (Test-Path $vite)) {
    if (-not $npm) { throw 'Install npm to restore frontend dependencies from package-lock.json.' }
    Write-Host 'Installing frontend packages from package-lock.json...'
    Push-Location $frontend
    try { & $npm.Source ci --no-audit --no-fund; if ($LASTEXITCODE -ne 0) { throw 'Frontend dependency installation failed.' } }
    finally { Pop-Location }
}


$health = $null
try { $health = Invoke-RestMethod 'http://127.0.0.1:8340/api/health' -TimeoutSec 2 } catch { }
if ($health) {
    $runtimeStatus = $null
    try { $runtimeStatus = Invoke-RestMethod 'http://127.0.0.1:8341/api/runtime/status' -TimeoutSec 2 } catch { }
    if (-not $runtimeStatus -or -not $runtimeStatus.backendPid) {
        $owners = @(Get-NetTCPConnection -LocalPort 8340 -State Listen -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique)
        foreach ($ownerId in $owners) {
            $owner = Get-CimInstance Win32_Process -Filter "ProcessId = $ownerId"
            if (-not $owner.CommandLine.Contains((Join-Path $backend 'server.py'))) { throw 'Port 8340 belongs to another application. Stop it before launching Nova.' }
            Stop-Process -Id $ownerId -Force
        }
        $health = $null
    }
}
$backendProcess = $null
if (-not $health -or $health.status -ne 'healthy') {
    $backendLog = Join-Path $logs 'backend-console.log'
    $backendError = Join-Path $logs 'backend-errors.log'
    $backendProcess = Start-Process -FilePath $python -ArgumentList @("`"$backendEntry`"") -WorkingDirectory $backend -WindowStyle Hidden -PassThru -RedirectStandardOutput $backendLog -RedirectStandardError $backendError
    $until = (Get-Date).AddSeconds(45)
    do {
        Start-Sleep -Milliseconds 500
        try { $health = Invoke-RestMethod 'http://127.0.0.1:8340/api/health' -TimeoutSec 2 } catch { $health = $null }
    } while ((-not $health -or $health.status -ne 'healthy') -and (Get-Date) -lt $until)
    if (-not $health -or $health.status -ne 'healthy') { throw "Backend did not become healthy. See $backendLog and $backendError." }
} elseif ($keyConfigured -and -not $health.gemini_live_configured) {
    throw 'The backend is already running without Gemini credentials. Stop the current Nova services, then run this launcher again so the backend reloads .env.'
}

$frontendResponse = $null
try { $frontendResponse = Invoke-WebRequest 'http://127.0.0.1:5173/' -UseBasicParsing -TimeoutSec 2 } catch { }
$frontendProcess = $null
if (-not $frontendResponse -or $frontendResponse.StatusCode -ne 200) {
    $frontendLog = Join-Path $logs 'frontend-console.log'
    $frontendError = Join-Path $logs 'frontend-errors.log'
    $frontendProcess = Start-Process -FilePath $node.Source -ArgumentList @("`"$vite`"", '--host', '127.0.0.1') -WorkingDirectory $frontend -WindowStyle Hidden -PassThru -RedirectStandardOutput $frontendLog -RedirectStandardError $frontendError
    $until = (Get-Date).AddSeconds(30)
    do {
        Start-Sleep -Milliseconds 500
        try { $frontendResponse = Invoke-WebRequest 'http://127.0.0.1:5173/' -UseBasicParsing -TimeoutSec 2 } catch { $frontendResponse = $null }
    } while ((-not $frontendResponse -or $frontendResponse.StatusCode -ne 200) -and (Get-Date) -lt $until)
    if (-not $frontendResponse -or $frontendResponse.StatusCode -ne 200) { throw "Frontend did not become ready. See $frontendLog and $frontendError." }
}

Write-Host 'Nova AI services are running:'
Write-Host '  UI:      http://127.0.0.1:5173/'
Write-Host '  Backend: http://127.0.0.1:8340/api/health'
Write-Host ("  Gemini:  " + $(if ($health.gemini_live_configured) { 'configured' } else { 'not configured' }))
Write-Host 'Click the microphone in the UI to grant microphone access and start talking.'
if (-not $NoBrowser) { Start-Process 'http://127.0.0.1:5173/' }


