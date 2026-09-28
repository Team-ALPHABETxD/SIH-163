$ErrorActionPreference = 'Stop'
Write-Host 'Starting VulnWeave local stack...'
docker compose up --build
