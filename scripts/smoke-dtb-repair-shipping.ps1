param(
    [string]$BaseUrl = "https://elliottm4.sg-host.com"
)

$ErrorActionPreference = "Stop"
$base = $BaseUrl.TrimEnd('/')
$endpoint = "$base/wp-json/dtb/v1/repairs/shipping-quote"

function Invoke-JsonPost {
    param(
        [string]$Uri,
        [hashtable]$Body
    )

    Invoke-RestMethod `
        -Method Post `
        -Uri $Uri `
        -ContentType "application/json" `
        -Body ($Body | ConvertTo-Json -Depth 8 -Compress)
}

Write-Host "[repair-shipping] Valid quote without cart/session..."
$quote = Invoke-JsonPost -Uri $endpoint -Body @{
    destination = @{
        address = "14725 31st Ave North"
        city = "Plymouth"
        state = "MN"
        zip = "55447"
        country = "US"
    }
}

if (-not $quote.success) {
    throw "Repair shipping quote did not return success=true."
}

$rateIds = @($quote.rates | ForEach-Object { $_.id })
foreach ($requiredId in @("repair_standard", "repair_express", "repair_overnight", "repair_pickup")) {
    if ($rateIds -notcontains $requiredId) {
        throw "Missing expected repair shipping rate: $requiredId"
    }
}

if ($quote.source -ne "dtb-repair-policy") {
    throw "Unexpected repair shipping source: $($quote.source)"
}

Write-Host "[repair-shipping] Incomplete-address rejection..."
$rejected = $false
try {
    Invoke-JsonPost -Uri $endpoint -Body @{
        destination = @{
            city = "Plymouth"
            state = "MN"
            zip = "55447"
            country = "US"
        }
    } | Out-Null
} catch {
    $status = $_.Exception.Response.StatusCode.value__
    if ($status -eq 422) {
        $rejected = $true
    } else {
        throw
    }
}

if (-not $rejected) {
    throw "Incomplete repair shipping address was not rejected with HTTP 422."
}

Write-Host "[repair-shipping] PASS"
