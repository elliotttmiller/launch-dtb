[CmdletBinding()]
param(
    [string] $OfficialCatalogPath = 'products\launch\official\dtb_woocommerce_official_catalog.csv',
    [string] $WooExportPath = 'products\launch\official\dtb_woocommerce_official_catalog_wc_export.csv',
    [bool] $PreserveOfficialWhenExportBlank = $true
)

$ErrorActionPreference = 'Stop'

function ConvertTo-MinimalCsvField {
    param([AllowNull()] [object] $Value)

    $stringValue = if ($null -eq $Value) { '' } else { [string] $Value }
    if ($stringValue.IndexOfAny([char[]] @( ',', '"', "`r", "`n" )) -ge 0) {
        return '"' + $stringValue.Replace('"', '""') + '"'
    }
    return $stringValue
}

$officialResolved = (Resolve-Path -LiteralPath $OfficialCatalogPath).Path
$exportResolved = (Resolve-Path -LiteralPath $WooExportPath).Path

$bytes = [System.IO.File]::ReadAllBytes($officialResolved)
$hasBom = $bytes.Length -ge 3 -and $bytes[0] -eq 0xEF -and $bytes[1] -eq 0xBB -and $bytes[2] -eq 0xBF
$text = [System.Text.Encoding]::UTF8.GetString($bytes, $(if ($hasBom) { 3 } else { 0 }), $bytes.Length - $(if ($hasBom) { 3 } else { 0 }))
$usesCrLf = $text.Contains("`r`n")

$officialRows = @(Import-Csv -LiteralPath $officialResolved)
$exportRows = @(Import-Csv -LiteralPath $exportResolved)
if ($officialRows.Count -eq 0 -or $exportRows.Count -eq 0) {
    throw 'The official catalog and WooCommerce export must both contain data rows.'
}
foreach ($required in @('Type', 'SKU', 'Name', 'Parent', 'Images')) {
    if (-not ($officialRows[0].PSObject.Properties.Name -contains $required)) {
        throw "Official catalog is missing required column: $required"
    }
    if (-not ($exportRows[0].PSObject.Properties.Name -contains $required)) {
        throw "WooCommerce export is missing required column: $required"
    }
}

$officialBySku = @{}
foreach ($row in $officialRows) {
    if ([string]::IsNullOrWhiteSpace($row.SKU)) {
        throw 'Official catalog contains a blank SKU.'
    }
    if ($officialBySku.ContainsKey($row.SKU)) {
        throw "Official catalog contains duplicate SKU: $($row.SKU)"
    }
    $officialBySku[$row.SKU] = $row
}

$exportBySku = @{}
foreach ($row in $exportRows) {
    if ([string]::IsNullOrWhiteSpace($row.SKU)) {
        throw 'WooCommerce export contains a blank SKU.'
    }
    if ($exportBySku.ContainsKey($row.SKU)) {
        throw "WooCommerce export contains duplicate SKU: $($row.SKU)"
    }
    $exportBySku[$row.SKU] = $row
}

$changed = 0
$matched = 0
$protectedNonblank = 0
foreach ($row in $officialRows) {
    if (-not $exportBySku.ContainsKey($row.SKU)) {
        continue
    }

    $source = $exportBySku[$row.SKU]
    if ($row.Type -cne $source.Type -or $row.Parent -cne $source.Parent -or $row.Name -cne $source.Name) {
        throw "Identity conflict for matched SKU $($row.SKU): Type, Parent, or Name differs."
    }

    $matched++
    if ($PreserveOfficialWhenExportBlank -and -not $source.Images -and $row.Images) {
        $protectedNonblank++
        continue
    }
    if ([string] $row.Images -cne [string] $source.Images) {
        $row.Images = [string] $source.Images
        $changed++
    }
}

$propertyNames = @($officialRows[0].PSObject.Properties.Name)
$outputLines = [System.Collections.Generic.List[string]]::new()
$outputLines.Add((@($propertyNames | ForEach-Object { ConvertTo-MinimalCsvField $_ }) -join ','))
foreach ($row in $officialRows) {
    $outputLines.Add((@($propertyNames | ForEach-Object { ConvertTo-MinimalCsvField $row.$_ }) -join ','))
}
$csvText = ($outputLines -join "`n") + "`n"
if ($usesCrLf) {
    $csvText = $csvText -replace "(?<!`r)`n", "`r`n"
}
[System.IO.File]::WriteAllText($officialResolved, $csvText, [System.Text.UTF8Encoding]::new($hasBom))

$reloaded = @(Import-Csv -LiteralPath $officialResolved)
if ($reloaded.Count -ne $officialRows.Count) {
    throw "Row-count validation failed: expected $($officialRows.Count), found $($reloaded.Count)."
}
foreach ($row in $reloaded) {
    if (
        $exportBySku.ContainsKey($row.SKU) -and
        -not ($PreserveOfficialWhenExportBlank -and -not $exportBySku[$row.SKU].Images -and $row.Images) -and
        [string] $row.Images -cne [string] $exportBySku[$row.SKU].Images
    ) {
        throw "Image synchronization validation failed for matched SKU: $($row.SKU)"
    }
}

$officialOnly = @($officialBySku.Keys | Where-Object { -not $exportBySku.ContainsKey($_) }).Count
$exportOnly = @($exportBySku.Keys | Where-Object { -not $officialBySku.ContainsKey($_) }).Count
Write-Output "official_rows=$($officialRows.Count) export_rows=$($exportRows.Count) matched=$matched changed=$changed protected_nonblank=$protectedNonblank official_only=$officialOnly export_only=$exportOnly bom=$hasBom crlf=$usesCrLf"
