# Runs the PulseBoard seed script inside the running api container.
# Prerequisite: docker compose up -d (api healthy).
# Run from the repo root or anywhere:  powershell -ExecutionPolicy Bypass -File scripts/seed-prod.ps1

$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $PSScriptRoot
Set-Location $repoRoot

docker compose exec api node src/seed.js
exit $LASTEXITCODE
