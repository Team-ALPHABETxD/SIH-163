$base='http://localhost:9000'
Write-Host "1. Missing security headers"
curl.exe -I "$base/"

Write-Host "2. CORS reflection check"
curl.exe -i -H "Origin: https://vulnweave-invalid-origin.example" "$base/"

Write-Host "3. BOLA/IDOR: compare object 1 and 2"
curl.exe "$base/api/v1/users/1"
curl.exe "$base/api/v1/users/2"

Write-Host "4. SQL error signal: benign quote only"
curl.exe -i --get --data-urlencode "q=test'" "$base/api/v1/search"

Write-Host "5. Reflected-input check with harmless marker"
curl.exe -s --get --data-urlencode "q=VWREFLECT_TEST" "$base/"

Write-Host "6. Sensitive API response"
curl.exe "$base/api/v1/users"

Write-Host "7. Bounded authentication throttling check (5 requests)"
1..5 | ForEach-Object { curl.exe -s -o NUL -w "HTTP %{http_code}`n" -X POST "$base/api/v1/auth/token" -H "Content-Type: application/json" -d '{"username":"vulnweave-test","password":"invalid"}' }
