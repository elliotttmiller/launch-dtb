[CmdletBinding()]
param(
    [Parameter()]
    [string] $InputPath = (Join-Path $PSScriptRoot '..\..\docs\reference\data\TSW\TSW Product Data.xlsx'),

    [Parameter()]
    [string] $OutputPath = (Join-Path $PSScriptRoot '..\..\docs\reference\data\TSW\TSW Product Data - DTB Brands.csv'),

    [Parameter()]
    [string] $ReportPath = (Join-Path $PSScriptRoot 'results\tsw-product-data-extraction-report.json')
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

$brandPrefixes = [ordered]@{
    TTT = 'TapeTech'
    CTT = 'Columbia Tools'
    DSS = 'Dura-Stilts'
    SUR = 'SurPro'
}
$excludedNamePattern = '(?i)\b(trowels?|knife|knives|cloth(?:e|es|ing)?|shirts?|t[- ]?shirts?|jackets?|jkt|trousers?|pants?|shorts|hoodies?|sweatshirts?|coats?|vests?|hats?|beanies?|aprons?|gloves?|workgloves?|dry[- ]fit|socks?|kits?|sanders?|sanding|tools?)\b'
$excludedNameSubstringPattern = '(?i)(wire|batter(?:y|ies)|sand)'
$excludedCategoryPattern = '(?i)\b(apparel|clothing|garments?|gloves?)\b'

$requiredHeaders = @(
    'Categaory', 'prod', 'countryoforigin', 'tariffcd', 'eccnclasscd',
    'Prod Description', 'Stocking Unit', 'Selling Unit', 'Selling_Conv',
    'weight', 'Length', 'Width', 'Height', 'Pack Qty', 'BOX Qty', 'CASE Qty',
    'CTN Qty', 'PLT Qty', 'All_Barcodes', 'UPC_List'
)
$outputHeaderMap = [ordered]@{
    Brand = 'brand'
    'Prod Description' = 'name'
    normalized_sku = 'sku'
    weight = 'weight'
    Length = 'length'
    Width = 'width'
    Height = 'height'
    prod = 'supplier_sku'
    Categaory = 'category'
}

function Resolve-TargetPath {
    param([string] $Path, [string] $BasePath)

    if ([System.IO.Path]::IsPathRooted($Path)) {
        return [System.IO.Path]::GetFullPath($Path)
    }
    return [System.IO.Path]::GetFullPath((Join-Path $BasePath $Path))
}

$repositoryRoot = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..\..'))
$resolvedInput = Resolve-TargetPath -Path $InputPath -BasePath $repositoryRoot
$resolvedOutput = Resolve-TargetPath -Path $OutputPath -BasePath $repositoryRoot
$resolvedReport = Resolve-TargetPath -Path $ReportPath -BasePath $repositoryRoot

if (-not (Test-Path -LiteralPath $resolvedInput -PathType Leaf)) {
    throw "TSW workbook not found: $resolvedInput"
}
if ([System.IO.Path]::GetExtension($resolvedInput) -ne '.xlsx') {
    throw "Input must be an .xlsx workbook: $resolvedInput"
}

$excel = $null
$workbook = $null
$worksheet = $null
$usedRange = $null
$records = [System.Collections.Generic.List[object]]::new()
$brandCounts = [ordered]@{}
foreach ($brand in $brandPrefixes.Values) {
    $brandCounts[$brand] = 0
}

try {
    $excel = New-Object -ComObject Excel.Application
    $excel.Visible = $false
    $excel.DisplayAlerts = $false
    $workbook = $excel.Workbooks.Open($resolvedInput, 0, $true)

    if ($workbook.Worksheets.Count -ne 1) {
        throw "Expected exactly one worksheet; found $($workbook.Worksheets.Count)"
    }
    $worksheet = $workbook.Worksheets.Item(1)
    $usedRange = $worksheet.UsedRange
    $values = $usedRange.Value2
    $rowCount = $usedRange.Rows.Count
    $columnCount = $usedRange.Columns.Count

    if ($columnCount -ne $requiredHeaders.Count) {
        throw "Expected $($requiredHeaders.Count) columns; found $columnCount"
    }
    for ($column = 1; $column -le $columnCount; $column++) {
        $actual = ([string] $values[1, $column]).Trim()
        $expected = $requiredHeaders[$column - 1]
        if ($actual -cne $expected) {
            throw "Header mismatch at column ${column}: expected '$expected', found '$actual'"
        }
    }

    for ($row = 2; $row -le $rowCount; $row++) {
        $supplierSku = ([string] $values[$row, 2]).Trim()
        if (-not $supplierSku) {
            continue
        }
        $upperSku = $supplierSku.ToUpperInvariant()
        $matchedPrefix = $null
        foreach ($prefix in $brandPrefixes.Keys) {
            if ($upperSku.StartsWith($prefix, [System.StringComparison]::Ordinal)) {
                $matchedPrefix = $prefix
                break
            }
        }
        if (-not $matchedPrefix) {
            continue
        }

        $normalizedSku = $supplierSku.Substring($matchedPrefix.Length).Trim()
        if (-not $normalizedSku) {
            throw "Supplier SKU '$supplierSku' produced an empty normalized SKU"
        }
        $record = [ordered]@{
            brand = $brandPrefixes[$matchedPrefix]
            name = [string] $values[$row, 6]
            sku = $normalizedSku
            weight = [string] $values[$row, 10]
            length = [string] $values[$row, 11]
            width = [string] $values[$row, 12]
            height = [string] $values[$row, 13]
            supplier_sku = $supplierSku
            category = [string] $values[$row, 1]
        }
        if (
            $record.name -match $excludedNamePattern -or
            $record.name -match $excludedNameSubstringPattern -or
            $record.category -match $excludedCategoryPattern
        ) {
            continue
        }
        $records.Add([pscustomobject] $record)
        $brandCounts[$brandPrefixes[$matchedPrefix]]++
    }
}
finally {
    if ($workbook) {
        $workbook.Close($false)
    }
    foreach ($comObject in @($usedRange, $worksheet, $workbook)) {
        if ($comObject) {
            [void] [System.Runtime.InteropServices.Marshal]::ReleaseComObject($comObject)
        }
    }
    if ($excel) {
        $excel.Quit()
        [void] [System.Runtime.InteropServices.Marshal]::ReleaseComObject($excel)
    }
    [GC]::Collect()
    [GC]::WaitForPendingFinalizers()
}

$duplicateGroups = @($records | Group-Object -Property supplier_sku | Where-Object Count -gt 1)
$duplicateRowsCollapsed = 0
foreach ($group in $duplicateGroups) {
    $signatures = @(
        $group.Group |
            ForEach-Object { $_ | ConvertTo-Json -Compress -Depth 3 } |
            Sort-Object -Unique
    )
    if ($signatures.Count -ne 1) {
        throw "Filtered workbook contains conflicting specifications for product identifier $($group.Name)"
    }
    $duplicateRowsCollapsed += $group.Count - 1
}
if ($duplicateRowsCollapsed -gt 0) {
    $records = [System.Collections.Generic.List[object]]::new(
        [object[]] @($records | Group-Object -Property supplier_sku | ForEach-Object { $_.Group[0] })
    )
}
$rawBrandCounts = [ordered]@{}
foreach ($brand in @($brandCounts.Keys)) {
    $rawBrandCounts[$brand] = $brandCounts[$brand]
    $brandCounts[$brand] = @($records | Where-Object brand -eq $brand).Count
}
$fieldCompleteness = [ordered]@{}
foreach ($outputHeader in $outputHeaderMap.Values) {
    $populated = @($records | Where-Object { -not [string]::IsNullOrWhiteSpace([string] $_.$outputHeader) }).Count
    $fieldCompleteness[$outputHeader] = [ordered]@{
        populated = $populated
        blank = $records.Count - $populated
    }
}

$outputDirectory = Split-Path -Parent $resolvedOutput
$reportDirectory = Split-Path -Parent $resolvedReport
[System.IO.Directory]::CreateDirectory($outputDirectory) | Out-Null
[System.IO.Directory]::CreateDirectory($reportDirectory) | Out-Null
$outputTemp = Join-Path $outputDirectory ([System.IO.Path]::GetRandomFileName())
$reportTemp = Join-Path $reportDirectory ([System.IO.Path]::GetRandomFileName())

try {
    $records | Export-Csv -LiteralPath $outputTemp -NoTypeInformation -Encoding utf8
    Move-Item -LiteralPath $outputTemp -Destination $resolvedOutput -Force

    $report = [ordered]@{
        schema_version = 1
        source_workbook = $resolvedInput
        source_worksheet = 'Sheet1'
        source_data_rows = $rowCount - 1
        source_columns = $columnCount
        output_columns = @($outputHeaderMap.Values)
        allowed_prefixes = $brandPrefixes
        excluded_name_pattern = $excludedNamePattern
        excluded_name_substring_pattern = $excludedNameSubstringPattern
        excluded_category_pattern = $excludedCategoryPattern
        matched_source_rows = ($rawBrandCounts.Values | Measure-Object -Sum).Sum
        extracted_rows = $records.Count
        brand_counts = $brandCounts
        raw_brand_counts = $rawBrandCounts
        field_completeness = $fieldCompleteness
        duplicate_product_identifiers = $duplicateGroups.Count
        identical_duplicate_rows_collapsed = $duplicateRowsCollapsed
        output_csv = $resolvedOutput
        output_sha256 = (Get-FileHash -LiteralPath $resolvedOutput -Algorithm SHA256).Hash.ToLowerInvariant()
        surpro_note = if ($brandCounts['SurPro'] -eq 0) { 'No SUR-prefixed rows exist in the source workbook.' } else { '' }
    }
    $report | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath $reportTemp -Encoding utf8
    Move-Item -LiteralPath $reportTemp -Destination $resolvedReport -Force
}
finally {
    Remove-Item -LiteralPath $outputTemp, $reportTemp -Force -ErrorAction SilentlyContinue
}

Write-Host "Extracted $($records.Count) TSW product-data rows to $resolvedOutput"
foreach ($brand in $brandCounts.Keys) {
    Write-Host "  ${brand}: $($brandCounts[$brand])"
}
