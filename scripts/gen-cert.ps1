# Generates a self-signed certificate for local HTTPS testing.
# Output: certs/pulseboard.key and certs/pulseboard.crt (gitignored).
# Run from the repo root:  powershell -ExecutionPolicy Bypass -File scripts/gen-cert.ps1

$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $PSScriptRoot
$certDir = Join-Path $repoRoot 'certs'
New-Item -ItemType Directory -Force -Path $certDir | Out-Null

# Docker Desktop on Windows needs a host-style path for -v; convert to forward slashes.
$certDirForDocker = ($certDir -replace '\\', '/')
if ($certDirForDocker -notmatch '^[A-Za-z]:/') {
    $certDirForDocker = '/' + $certDirForDocker
}

Write-Host "Generating self-signed cert into $certDir ..."

docker run --rm -v "${certDirForDocker}:/certs" alpine/openssl req -x509 -nodes -days 365 `
    -newkey rsa:2048 -keyout /certs/pulseboard.key -out /certs/pulseboard.crt `
    -subj "/CN=localhost"

if ($LASTEXITCODE -ne 0) {
    Write-Error "Certificate generation failed (docker exit code $LASTEXITCODE)."
    exit $LASTEXITCODE
}

Write-Host "Done. Files:"
Get-ChildItem $certDir | Format-Table Name, Length -AutoSize
