$ErrorActionPreference = 'Stop'
$launcher = Join-Path $PSScriptRoot '..\..\start_nova_ai.ps1'
& $launcher @args
exit $LASTEXITCODE

