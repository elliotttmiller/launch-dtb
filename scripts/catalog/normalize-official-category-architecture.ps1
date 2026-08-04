[CmdletBinding()]
param(
    [string] $CatalogPath = 'products\launch\official\dtb_woocommerce_official_catalog.csv'
)

$ErrorActionPreference = 'Stop'

$brandSegments = @(
    'Columbia Tools',
    'Dura-Stilts',
    'LEVEL5',
    'Platinum Drywall Tools',
    'SurPro',
    'TapeTech'
)

$automaticTaperSkus = @(
    'COL-AUTOMATIC-TAPER',
    'PTAPER',
    'SPTAPER',
    '4-760',
    'TT-EASYCLEAN-AUTOMATIC-TAPER'
)

$semiAutomaticTaperSkus = @(
    'SAT',
    'PT-TP',
    '5-311'
)

$explicitFunctionalCategoryBySku = @{
    'COL-ANGLE-HEAD'              = 'Automatic Taping Tools > Angle Heads'
    'AHA'                         = 'Parts'
    '4-707'                       = 'Automatic Taping Tools > Corner Rollers'
    '4-792'                       = 'Automatic Taping Tools > Extendable Handles'
    '804003F'                     = 'Parts'
    'COL-PREDATOR-MATRIX-HANDLE'  = 'Automatic Taping Tools > Flat Box Handles'
    'COL-PREDATOR-ONE-HANDLE'     = 'Automatic Taping Tools > Flat Box Handles'
    'PHMP'                        = 'Automatic Taping Tools > Loading Pumps'
    'CTA01TT'                     = 'Semi-Automatic Taping Tools > Semi-Automatic Taping Tool Accessories'
    'TT-SUPPORT-HANDLE'           = 'Semi-Automatic Taping Tools > Semi-Automatic Taping Tool Accessories'
    'TT-SUPPORT-HANDLE-ADAPTER'   = 'Semi-Automatic Taping Tools > Semi-Automatic Taping Tool Accessories'
}

$partSkus = @(
    'AHA',
    'ATX01TT',
    'TT-FHTT-WITH-ADAPTER',
    '804003F'
)

$automaticChildCategories = @(
    'Angle Heads',
    'Automatic Compound Tubes',
    'Automatic Tapers',
    'Automatic Taping Tool Cases',
    'Automatic Taping Tool Sets',
    'Box Fillers',
    'Corner Boxes',
    'Corner Rollers',
    'Extendable Handles',
    'Fixed Handles',
    'Flat Box Handles',
    'Flat Boxes',
    'Goosenecks',
    'Loading Pumps',
    'Nail Spotters'
)

$semiAutomaticChildCategories = @(
    'Compound Applicators',
    'Compound Tubes',
    'Corner Flushers',
    'Semi-Automatic Tapers',
    'Semi-Automatic Taping Tool Sets',
    'Semi-Automatic Taping Tool Accessories',
    'Semi-Automatic Tool Cases',
    'Tape Pullers'
)

function Normalize-Path {
    param(
        [Parameter(Mandatory)] [string] $Path,
        [Parameter(Mandatory)] [string] $Sku,
        [Parameter(Mandatory)] [string] $Name
    )

    $segments = @($Path -split '\s*>\s*' | ForEach-Object { $_.Trim() } | Where-Object { $_ })
    if ($segments.Count -eq 0) {
        return ''
    }

    # Brand is represented by WooCommerce's dedicated Brands field. Removing it
    # from product categories prevents a separate Corner Tools, Finishing Boxes,
    # etc. term from being created beneath every manufacturer.
    $segments = @($segments | Where-Object { $brandSegments -notcontains $_ })

    $root = if ($segments[0] -eq 'Stilts & Accessories') { 'Stilts & Accessories' } else { 'Drywall Finishing Tools' }
    $leaf = $segments[-1]

    if ($partSkus -contains $Sku -or $leaf -eq 'Taping Tool Accessories') {
        return "$root > Parts"
    }

    if ($leaf -ne 'Predator Family' -and $explicitFunctionalCategoryBySku.ContainsKey($Sku)) {
        return "$root > $($explicitFunctionalCategoryBySku[$Sku])"
    }

    if ($automaticChildCategories -contains $leaf) {
        return "$root > Automatic Taping Tools > $leaf"
    }

    if ($semiAutomaticChildCategories -contains $leaf) {
        return "$root > Semi-Automatic Taping Tools > $leaf"
    }

    if ($automaticTaperSkus -contains $Sku -or $leaf -eq 'Automatic Tapers') {
        return "$root > Automatic Taping Tools > Automatic Tapers"
    }

    if ($semiAutomaticTaperSkus -contains $Sku -or $leaf -eq 'Semi-Automatic Tapers') {
        return "$root > Semi-Automatic Taping Tools > Semi-Automatic Tapers"
    }

    if ($leaf -eq 'Predator Family') {
        return "$root > Predator Family"
    }

    if ($leaf -eq 'Automatic Taping Tools') {
        if ($Name -match '(?i)extension|adapter|assembly') {
            return "$root > Parts"
        }
        return "$root > Automatic Taping Tools"
    }

    if ($leaf -eq 'Semi-Automatic Taping Tools') {
        if ($Name -match '(?i)compound tube|cam\s*lock tube') {
            return "$root > Semi-Automatic Taping Tools > Compound Tubes"
        }
        if ($Name -match '(?i)minishot') {
            return "$root > Semi-Automatic Taping Tools > Compound Applicators"
        }
        if ($Name -match '(?i)flusher') {
            return "$root > Semi-Automatic Taping Tools > Corner Flushers"
        }
        if ($Name -match '(?i)applicator|mudrunner') {
            return "$root > Semi-Automatic Taping Tools > Compound Applicators"
        }
        if ($Name -match '(?i)case') {
            return "$root > Semi-Automatic Taping Tools > Semi-Automatic Tool Cases"
        }
        if ($Name -match '(?i)set') {
            return "$root > Semi-Automatic Taping Tools > Semi-Automatic Taping Tool Sets"
        }
        if ($Name -match '(?i)tape puller') {
            return "$root > Semi-Automatic Taping Tools > Tape Pullers"
        }
        return "$root > Semi-Automatic Taping Tools > Semi-Automatic Taping Tool Accessories"
    }

    if ($leaf -eq 'Finishing Boxes') {
        return "$root > Automatic Taping Tools > Flat Boxes"
    }

    if ($leaf -eq 'Nail Spotters') {
        return "$root > Automatic Taping Tools > Nail Spotters"
    }

    if ($leaf -eq 'Tool Sets & Kits') {
        if ($Name -match '(?i)case') {
            return "$root > Automatic Taping Tools > Automatic Taping Tool Cases"
        }
        return "$root > Automatic Taping Tools > Automatic Taping Tool Sets"
    }

    if ($leaf -eq 'Mud Pans & Pumps') {
        if ($Name -match '(?i)box filler') {
            return "$root > Automatic Taping Tools > Box Fillers"
        }
        if ($Name -match '(?i)gooseneck') {
            return "$root > Automatic Taping Tools > Goosenecks"
        }
        if ($Name -match '(?i)pump') {
            return "$root > Automatic Taping Tools > Loading Pumps"
        }
        if ($Name -match '(?i)mudrunner|extension|adapter|riser|fill tube') {
            return "$root > Semi-Automatic Taping Tools > Semi-Automatic Taping Tool Accessories"
        }
        return "$root > Parts"
    }

    if ($leaf -eq 'Handles & Extensions') {
        if ($Name -match '(?i)grip assembly|adapter') {
            return "$root > Parts"
        }
        if ($Name -match '(?i)flat box handle|box handle|closet monster|matrix.*handle|one handle|mini box handle|box xtender|easyfinish|wizard') {
            return "$root > Automatic Taping Tools > Flat Box Handles"
        }
        if ($Name -match '(?i)extendable|extension|ext\.|xtender') {
            return "$root > Automatic Taping Tools > Extendable Handles"
        }
        if ($Name -match '(?i)fixed') {
            return "$root > Automatic Taping Tools > Fixed Handles"
        }
        return "$root > Automatic Taping Tools > Fixed Handles"
    }

    if ($leaf -eq 'Corner Tools') {
        if ($Name -match '(?i)angle head adapter') {
            return "$root > Parts"
        }
        if ($Name -match '(?i)angle head|corner finisher') {
            return "$root > Automatic Taping Tools > Angle Heads"
        }
        if ($Name -match '(?i)corner roller|corner cobra|outside corner tool') {
            return "$root > Automatic Taping Tools > Corner Rollers"
        }
        if ($Name -match '(?i)angle box|flusher box') {
            return "$root > Automatic Taping Tools > Corner Boxes"
        }
        if ($Name -match '(?i)flusher') {
            return "$root > Semi-Automatic Taping Tools > Corner Flushers"
        }
        if ($Name -match '(?i)applicator|mudrunner') {
            return "$root > Semi-Automatic Taping Tools > Compound Applicators"
        }
        if ($Name -match '(?i)compound tube|camlock tube') {
            return "$root > Semi-Automatic Taping Tools > Compound Tubes"
        }
        if ($Name -match '(?i)adapter|support handle') {
            return "$root > Semi-Automatic Taping Tools > Semi-Automatic Taping Tool Accessories"
        }
        return "$root > Parts"
    }

    if ($segments.Count -eq 1 -and $segments[0] -eq $root) {
        return $root
    }

    return "$root > $leaf"
}

function ConvertTo-MinimalCsvField {
    param([AllowNull()] [object] $Value)

    $stringValue = if ($null -eq $Value) { '' } else { [string] $Value }
    if ($stringValue.IndexOfAny([char[]] @( ',', '"', "`r", "`n" )) -ge 0) {
        return '"' + $stringValue.Replace('"', '""') + '"'
    }
    return $stringValue
}

$resolvedPath = (Resolve-Path -LiteralPath $CatalogPath).Path
$bytes = [System.IO.File]::ReadAllBytes($resolvedPath)
$hasBom = $bytes.Length -ge 3 -and $bytes[0] -eq 0xEF -and $bytes[1] -eq 0xBB -and $bytes[2] -eq 0xBF
$text = [System.Text.Encoding]::UTF8.GetString($bytes, $(if ($hasBom) { 3 } else { 0 }), $bytes.Length - $(if ($hasBom) { 3 } else { 0 }))
$usesCrLf = $text.Contains("`r`n")

$rows = @(Import-Csv -LiteralPath $resolvedPath)
if ($rows.Count -eq 0 -or -not ($rows[0].PSObject.Properties.Name -contains 'Categories')) {
    throw "Catalog is empty or does not contain a Categories column: $resolvedPath"
}

$changedRows = 0
$changedPaths = 0
foreach ($row in $rows) {
    if ([string]::IsNullOrWhiteSpace($row.Categories)) {
        continue
    }

    $original = $row.Categories
    $normalized = [System.Collections.Generic.List[string]]::new()
    foreach ($path in @($original -split '\s*,\s*')) {
        $value = Normalize-Path -Path $path -Sku $row.SKU -Name $row.Name
        if ($value -and -not $normalized.Contains($value)) {
            $normalized.Add($value)
        }
        if ($value -ne $path.Trim()) {
            $changedPaths++
        }
    }

    $replacement = $normalized -join ', '
    if ($replacement -ne $original) {
        $row.Categories = $replacement
        $changedRows++
    }
}

foreach ($row in $rows) {
    if ($partSkus -contains $row.SKU -or $partSkus -contains $row.Parent) {
        $row.'Meta: _dtb_category_key' = 'parts'
        $row.'Meta: _dtb_display_category_key' = 'parts'
        $row.'Meta: _dtb_is_parts' = '1'
        $row.'Meta: _dtb_product_kind' = 'part'
    }
}

$propertyNames = @($rows[0].PSObject.Properties.Name)
$outputLines = [System.Collections.Generic.List[string]]::new()
$outputLines.Add((@($propertyNames | ForEach-Object { ConvertTo-MinimalCsvField $_ }) -join ','))
foreach ($row in $rows) {
    $outputLines.Add((@($propertyNames | ForEach-Object { ConvertTo-MinimalCsvField $row.$_ }) -join ','))
}
$csvText = $outputLines -join "`n"
$csvText += "`n"
if ($usesCrLf) {
    $csvText = $csvText -replace "(?<!`r)`n", "`r`n"
}

$utf8 = [System.Text.UTF8Encoding]::new($hasBom)
[System.IO.File]::WriteAllText($resolvedPath, $csvText, $utf8)

$reloaded = @(Import-Csv -LiteralPath $resolvedPath)
if ($reloaded.Count -ne $rows.Count) {
    throw "Row-count validation failed: expected $($rows.Count), found $($reloaded.Count)."
}
if (@($reloaded | Where-Object { $_.Categories -match '(?i)>\s*(Columbia Tools|Dura-Stilts|LEVEL5|Platinum Drywall Tools|SurPro|TapeTech)\s*>' }).Count -ne 0) {
    throw 'Validation failed: one or more brand segments remain inside product-category paths.'
}
if (@($reloaded | Where-Object { $_.Categories -match '(?i)(^|,\s*)[^,>]*Automatic Tapers(?:,|$)' }).Count -ne 0) {
    throw 'Validation failed: a flat Automatic Tapers category remains.'
}
if (@($reloaded | Where-Object { $_.Categories -match '(?i)(^|,\s*)[^,>]*Semi-Automatic Tapers(?:,|$)' }).Count -ne 0) {
    throw 'Validation failed: a flat Semi-Automatic Tapers category remains.'
}
$legacyBranchPattern = '(?i)Drywall Finishing Tools\s*>\s*Automatic Taping Tools\s*>\s*(Corner Tools|Finishing Boxes|Handles & Extensions|Mud Pans & Pumps|Tool Sets & Kits)(?:,|$)'
if (@($reloaded | Where-Object { $_.Categories -match $legacyBranchPattern }).Count -ne 0) {
    throw 'Validation failed: one or more broad legacy labels remain beneath Automatic Taping Tools.'
}
if (@($reloaded | Where-Object { $_.Categories -match '(?i)(^|,\s*)Drywall Finishing Tools\s*>\s*(Automatic|Semi-Automatic) Taping Tools(?:,|$)' }).Count -ne 0) {
    throw 'Validation failed: a product is assigned only to a Taping Tools parent instead of a functional child.'
}
if (@($reloaded | Where-Object { $_.Categories -match '(?i)Automatic Taping Tools\s*>\s*Taping Tool Accessories' }).Count -ne 0) {
    throw 'Validation failed: Taping Tool Accessories must not contain catalog products.'
}
if (@($reloaded | Where-Object {
    ($partSkus -contains $_.SKU -or $partSkus -contains $_.Parent) -and
    ($_.'Meta: _dtb_category_key' -ne 'parts' -or $_.'Meta: _dtb_display_category_key' -ne 'parts' -or $_.'Meta: _dtb_is_parts' -ne '1' -or $_.'Meta: _dtb_product_kind' -ne 'part')
}).Count -ne 0) {
    throw 'Validation failed: one or more reclassified products or variations have inconsistent parts metadata.'
}

Write-Output "rows=$($rows.Count) changed_rows=$changedRows changed_paths=$changedPaths bom=$hasBom crlf=$usesCrLf"
