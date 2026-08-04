[CmdletBinding()]
param(
    [string]$OfficialCatalog = 'products\launch\official\dtb_woocommerce_official_catalog.csv',
    [string]$VeeqoImport = 'products\launch\official\veeqo_inventory_import.csv'
)

$ErrorActionPreference = 'Stop'
$invariant = [System.Globalization.CultureInfo]::InvariantCulture
$officialPath = (Resolve-Path -LiteralPath $OfficialCatalog).Path
$veeqoPath = (Resolve-Path -LiteralPath $VeeqoImport).Path
$official = @(Import-Csv -LiteralPath $officialPath)
$veeqo = @(Import-Csv -LiteralPath $veeqoPath)

if (@($official | Group-Object SKU | Where-Object { $_.Count -gt 1 }).Count -ne 0) {
    throw 'Official catalog contains duplicate SKUs.'
}
if (@($veeqo | Group-Object sku_code | Where-Object { $_.Count -gt 1 }).Count -ne 0) {
    throw 'Veeqo import contains duplicate SKUs.'
}

$veeqoBySku = @{}
$veeqo | ForEach-Object { $veeqoBySku[$_.sku_code] = $_ }
$weightRows = 0
$dimensionRows = 0
$weightFields = 0
$dimensionFields = 0

function Format-Decimal {
    param([double]$Value)
    return $Value.ToString('0.##', $invariant)
}

foreach ($row in $official) {
    if ($row.Type -notin @('simple', 'variation') -or -not $veeqoBySku.ContainsKey($row.SKU)) {
        continue
    }

    $source = $veeqoBySku[$row.SKU]
    $filledWeight = $false
    $filledDimension = $false

    if ([string]::IsNullOrWhiteSpace($row.'Weight (lbs)') -and
        -not [string]::IsNullOrWhiteSpace($source.weight_grams)) {
        $row.'Weight (lbs)' = Format-Decimal ([math]::Round(([double]$source.weight_grams / 453.59237), 2))
        $weightFields++
        $filledWeight = $true
    }

    $dimensionMap = @(
        @{ Official = 'Width (in)'; Veeqo = 'width' },
        @{ Official = 'Length (in)'; Veeqo = 'depth' },
        @{ Official = 'Height (in)'; Veeqo = 'height' }
    )
    foreach ($mapping in $dimensionMap) {
        if ([string]::IsNullOrWhiteSpace($row.($mapping.Official)) -and
            -not [string]::IsNullOrWhiteSpace($source.($mapping.Veeqo))) {
            $row.($mapping.Official) = [string]$source.($mapping.Veeqo)
            $dimensionFields++
            $filledDimension = $true
        }
    }

    if ($filledWeight) { $weightRows++ }
    if ($filledDimension) { $dimensionRows++ }
}

$csvLines = @($official | ConvertTo-Csv -NoTypeInformation -UseQuotes AsNeeded)
$text = [string]::Join("`r`n", $csvLines) + "`r`n"
[System.IO.File]::WriteAllText($officialPath, $text, [System.Text.UTF8Encoding]::new($true))

[pscustomobject]@{
    catalog_rows = $official.Count
    weight_rows_updated = $weightRows
    weight_fields_updated = $weightFields
    dimension_rows_updated = $dimensionRows
    dimension_fields_updated = $dimensionFields
}
