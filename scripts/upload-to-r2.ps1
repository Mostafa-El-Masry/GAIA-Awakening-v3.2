# PowerShell script to upload file to R2
param(
    [Parameter(Mandatory=$true)]
    [string]$FilePath
)

$ErrorActionPreference = "Stop"

# R2 configuration
$accessKey = "YOUR_R2_ACCESS_KEY_ID"
$secretKey = "YOUR_R2_SECRET_ACCESS_KEY"
$bucket = "gaia-gallery"
$endpoint = "https://6d713c5d338247189469b3afa7b09fd7.r2.cloudflarestorage.com"

# File info
$fileName = Split-Path $FilePath -Leaf
$contentType = switch -Regex ($fileName.ToLower()) {
    '\.jpg$|\.jpeg$' { 'image/jpeg' }
    '\.png$' { 'image/png' }
    '\.gif$' { 'image/gif' }
    '\.webp$' { 'image/webp' }
    default { 'application/octet-stream' }
}

# Create date string for AWS signature
$date = (Get-Date).ToUniversalTime().ToString("yyyyMMdd")
$timestamp = (Get-Date).ToUniversalTime().ToString("yyyyMMddTHHmmssZ")
$region = "auto"
$service = "s3"

# Step 1: Create canonical request
$httpMethod = "PUT"
$canonicalUri = "/$bucket/$fileName"
$canonicalQueryString = ""
$hostHeader = ([Uri]$endpoint).Host
$canonicalHeaders = "host:$hostHeader`nx-amz-content-sha256:UNSIGNED-PAYLOAD`nx-amz-date:$timestamp`n"
$signedHeaders = "host;x-amz-content-sha256;x-amz-date"
$payloadHash = "UNSIGNED-PAYLOAD"
$canonicalRequest = "$httpMethod`n$canonicalUri`n$canonicalQueryString`n$canonicalHeaders`n$signedHeaders`n$payloadHash"

# Step 2: Create string to sign
$algorithm = "AWS4-HMAC-SHA256"
$credentialScope = "$date/$region/$service/aws4_request"
$stringToSign = "$algorithm`n$timestamp`n$credentialScope`n$((Get-FileHash -InputStream ([System.IO.MemoryStream]::new([System.Text.Encoding]::UTF8.GetBytes($canonicalRequest))) -Algorithm SHA256).Hash.ToLower())"

# Step 3: Calculate signature
$kSecret = [System.Text.Encoding]::UTF8.GetBytes("AWS4$secretKey")
$kDate = New-Object byte[] 32
$kRegion = New-Object byte[] 32
$kService = New-Object byte[] 32
$kSigning = New-Object byte[] 32

$hmacsha256 = New-Object System.Security.Cryptography.HMACSHA256
$hmacsha256.Key = $kSecret
$kDate = $hmacsha256.ComputeHash([System.Text.Encoding]::UTF8.GetBytes($date))
$hmacsha256.Key = $kDate
$kRegion = $hmacsha256.ComputeHash([System.Text.Encoding]::UTF8.GetBytes($region))
$hmacsha256.Key = $kRegion
$kService = $hmacsha256.ComputeHash([System.Text.Encoding]::UTF8.GetBytes($service))
$hmacsha256.Key = $kService
$kSigning = $hmacsha256.ComputeHash([System.Text.Encoding]::UTF8.GetBytes("aws4_request"))
$hmacsha256.Key = $kSigning
$signature = $hmacsha256.ComputeHash([System.Text.Encoding]::UTF8.GetBytes($stringToSign))
$signatureString = [BitConverter]::ToString($signature).Replace('-', '').ToLower()

# Create authorization header
$credential = "$accessKey/$date/$region/$service/aws4_request"
$authorizationHeader = "$algorithm Credential=$credential,SignedHeaders=$signedHeaders,Signature=$signatureString"

# Upload file
$headers = @{
    "Authorization" = $authorizationHeader
    "x-amz-content-sha256" = $payloadHash
    "x-amz-date" = $timestamp
    "Content-Type" = $contentType
}

$uri = "$endpoint/$bucket/$fileName"
$fileContent = [System.IO.File]::ReadAllBytes($FilePath)

try {
    Invoke-RestMethod -Uri $uri -Method Put -Headers $headers -Body $fileContent -ContentType $contentType
    Write-Host "Successfully uploaded $fileName"
    
    # Test public access
    $publicUrl = "https://pub-3354a96a3d194a9c95c8e51e1b20944e.r2.dev/$fileName"
    Write-Host "Testing public access at: $publicUrl"
    Invoke-WebRequest -Uri $publicUrl -Method Head
    Write-Host "File is publicly accessible"
} catch {
    Write-Error "Upload failed: $_"
    exit 1
}