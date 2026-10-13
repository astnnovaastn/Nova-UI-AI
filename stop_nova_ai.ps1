$ErrorActionPreference = 'Stop'
$root = $PSScriptRoot
try {
    $runtime = Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -and $_.CommandLine.Contains((Join-Path $root 'scripts\nova_runtime.py')) }
    if ($runtime) {
        Invoke-RestMethod 'http://127.0.0.1:8341/api/runtime/stop' -Method Post -Headers @{ 'X-Nova-Control' = '1' } -TimeoutSec 3 | Out-Null
        Start-Sleep -Seconds 2
    }
} catch { Write-Warning 'Runtime graceful stop failed; stopping only identified Nova processes.' }
$targets = @(
    @{ Port = 8341; Marker = Join-Path $root 'scripts\nova_runtime.py'; Label = 'Nova runtime' },
    @{ Port = 8340; Marker = Join-Path $root 'astra_ai\ui\backend\server.py'; Label = 'Nova backend' },
    @{ Port = 5173; Marker = Join-Path $root 'astra_ai\ui\frontend\node_modules\vite\bin\vite.js'; Label = 'Nova frontend' }
)
foreach ($target in $targets) {
    $listeners = @(Get-NetTCPConnection -LocalPort $target.Port -State Listen -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique)
    foreach ($processId in $listeners) {
        $process = Get-CimInstance Win32_Process -Filter "ProcessId = $processId" -ErrorAction SilentlyContinue
        if ($process -and $process.CommandLine -and $process.CommandLine.Contains($target.Marker)) {
            Stop-Process -Id $processId -Force
            Write-Host ("Stopped " + $target.Label + '.')
        }
    }
}
