$baseUrl = "http://127.0.0.1:4000"

Write-Host "=== Health Check ==="
$health = Invoke-RestMethod -Uri "$baseUrl/api/health" -Method Get
$health | ConvertTo-Json

Write-Host "`n=== Register ==="
$registerBody = @{
    name = "E2E User"
    email = "e2e@example.com"
    password = "password123"
} | ConvertTo-Json
$register = Invoke-RestMethod -Uri "$baseUrl/api/auth/register" -Method Post -Body $registerBody -ContentType "application/json"
$register | ConvertTo-Json
$token = $register.token

Write-Host "`n=== Login ==="
$loginBody = @{
    email = "e2e@example.com"
    password = "password123"
} | ConvertTo-Json
$login = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" -Method Post -Body $loginBody -ContentType "application/json"
$login | ConvertTo-Json
$token = $login.token

Write-Host "`n=== Post Pulse ==="
$pulseBody = @{
    mood = 4
    note = "E2E test pulse"
} | ConvertTo-Json
$pulse = Invoke-RestMethod -Uri "$baseUrl/api/pulses" -Method Post -Headers @{"Authorization"="Bearer $token"} -Body $pulseBody -ContentType "application/json"
$pulse | ConvertTo-Json

Write-Host "`n=== Post Pulse Again (expect 409) ==="
try {
    $pulse2 = Invoke-RestMethod -Uri "$baseUrl/api/pulses" -Method Post -Headers @{"Authorization"="Bearer $token"} -Body $pulseBody -ContentType "application/json"
    $pulse2 | ConvertTo-Json
} catch {
    Write-Host "Error: $($_.Exception.Message)"
    $errorResponse = $_.ErrorDetails.Message | ConvertFrom-Json
    $errorResponse | ConvertTo-Json
}

Write-Host "`n=== Today Feed ==="
$today = Invoke-RestMethod -Uri "$baseUrl/api/pulses/today" -Method Get -Headers @{"Authorization"="Bearer $token"}
$today | ConvertTo-Json

Write-Host "`n=== My History ==="
$mine = Invoke-RestMethod -Uri "$baseUrl/api/pulses/mine" -Method Get -Headers @{"Authorization"="Bearer $token"}
$mine | ConvertTo-Json

Write-Host "`n=== Admin Login ==="
Write-Host "Note: Update ADMIN_PASSWORD in .env and use that password here"
Write-Host "Skipping admin login for this demo - requires actual admin password"

Write-Host "`n=== Admin Summary ==="
Write-Host "Skipped - requires admin token"
