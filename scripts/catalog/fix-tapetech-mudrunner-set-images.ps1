[CmdletBinding()]
param(
    [string] $CatalogPath = 'products\launch\official\dtb_official_catalog.csv',
    [string] $MediaPath = 'products\launch\media\media\tapetech_ttcfs_m_01.webp'
)

$ErrorActionPreference = 'Stop'
. (Join-Path $PSScriptRoot 'catalog-write-guard.ps1')

function ConvertTo-MinimalCsvField {
    param([AllowNull()] [object] $Value)

    $stringValue = if ($null -eq $Value) { '' } else { [string] $Value }
    if ($stringValue.IndexOfAny([char[]] @( ',', '"', "`r", "`n" )) -ge 0) {
        return '"' + $stringValue.Replace('"', '""') + '"'
    }
    return $stringValue
}

function Get-PrimaryImage {
    param([Parameter(Mandatory)] [string] $Images)

    return (($Images -split '\s*,\s*')[0]).Trim()
}

$catalogResolved = (Resolve-Path -LiteralPath $CatalogPath).Path
Assert-CanonicalCatalog -CatalogPath $catalogResolved
$mediaResolved = (Resolve-Path -LiteralPath $MediaPath).Path
if ([IO.Path]::GetFileName($mediaResolved) -cne 'tapetech_ttcfs_m_01.webp') {
    throw 'The normalized TTCFS-M set image must be named tapetech_ttcfs_m_01.webp.'
}

$bytes = [IO.File]::ReadAllBytes($catalogResolved)
$hasBom = $bytes.Length -ge 3 -and $bytes[0] -eq 0xEF -and $bytes[1] -eq 0xBB -and $bytes[2] -eq 0xBF
$text = [Text.Encoding]::UTF8.GetString($bytes, $(if ($hasBom) { 3 } else { 0 }), $bytes.Length - $(if ($hasBom) { 3 } else { 0 }))
$usesCrLf = $text.Contains("`r`n")

$rows = @(Import-Csv -LiteralPath $catalogResolved)
$bySku = @{}
foreach ($row in $rows) {
    if ($row.SKU) {
        if ($bySku.ContainsKey($row.SKU)) {
            throw "Duplicate catalog SKU: $($row.SKU)"
        }
        $bySku[$row.SKU] = $row
    }
}

foreach ($requiredSku in @('TTCFS-M', '48TT', '14TT', '76TT', '90T')) {
    if (-not $bySku.ContainsKey($requiredSku)) {
        throw "Required TTCFS-M gallery SKU is missing: $requiredSku"
    }
}

$set = $bySku['TTCFS-M']
if ($set.Name -cne 'TapeTech MudRunner Corner Finishing Set') {
    throw 'TTCFS-M product identity does not match the expected toolset.'
}

$primaryUrl = 'https://elliottm4.sg-host.com/wp/wp-content/uploads/2026/media/tapetech_ttcfs_m_01.webp'
$gallery = @(
    $primaryUrl,
    (Get-PrimaryImage -Images $bySku['48TT'].Images),
    (Get-PrimaryImage -Images $bySku['14TT'].Images),
    (Get-PrimaryImage -Images $bySku['76TT'].Images),
    (Get-PrimaryImage -Images $bySku['90T'].Images)
)

if (@($gallery | Where-Object { [string]::IsNullOrWhiteSpace($_) }).Count -ne 0) {
    throw 'One or more TTCFS-M included tools has no canonical primary image.'
}
if (@($gallery | Sort-Object -Unique).Count -ne $gallery.Count) {
    throw 'The TTCFS-M gallery contains a duplicate image mapping.'
}

$expected = $gallery -join ', '
$changed = [string] $set.Images -cne $expected
$set.Images = $expected

$propertyNames = @($rows[0].PSObject.Properties.Name)
$outputLines = [Collections.Generic.List[string]]::new()
$outputLines.Add((@($propertyNames | ForEach-Object { ConvertTo-MinimalCsvField $_ }) -join ','))
foreach ($row in $rows) {
    $outputLines.Add((@($propertyNames | ForEach-Object { ConvertTo-MinimalCsvField $row.$_ }) -join ','))
}
$csvText = ($outputLines -join "`n") + "`n"
if ($usesCrLf) {
    $csvText = $csvText -replace "(?<!`r)`n", "`r`n"
}
$backupPath = New-CatalogRollbackSnapshot -CatalogPath $catalogResolved
[IO.File]::WriteAllText($catalogResolved, $csvText, [Text.UTF8Encoding]::new($hasBom))
Assert-CanonicalCatalog -CatalogPath $catalogResolved

$reloaded = @(Import-Csv -LiteralPath $catalogResolved | Where-Object SKU -eq 'TTCFS-M')
if ($reloaded.Count -ne 1 -or [string] $reloaded[0].Images -cne $expected) {
    throw 'TTCFS-M gallery validation failed after writing the official catalog.'
}

Write-Output "sku=TTCFS-M changed=$changed gallery_images=$($gallery.Count) bom=$hasBom crlf=$usesCrLf backup=$backupPath"
