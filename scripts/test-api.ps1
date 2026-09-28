$api='http://localhost:8000/api'
Write-Host 'Health:'
curl.exe "$api/health"
Write-Host 'Target:'
curl.exe "$api/target"
Write-Host 'Modules:'
curl.exe "$api/modules"
Write-Host 'External tool inventory:'
curl.exe "$api/tools"
