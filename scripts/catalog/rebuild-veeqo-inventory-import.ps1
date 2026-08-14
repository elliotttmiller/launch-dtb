[CmdletBinding()]
param(
    [string]$OfficialCatalog = 'products\launch\official\dtb_official_catalog.csv',
    [string]$VeeqoImport = 'products\launch\official\veeqo_inventory_import.csv'
)

$ErrorActionPreference = 'Stop'
$invariant = [System.Globalization.CultureInfo]::InvariantCulture
$officialPath = (Resolve-Path -LiteralPath $OfficialCatalog).Path
$veeqoPath = (Resolve-Path -LiteralPath $VeeqoImport).Path
$official = @(Import-Csv -LiteralPath $officialPath)
$existing = @(Import-Csv -LiteralPath $veeqoPath)
$veeqoHeaders = @($existing[0].PSObject.Properties.Name)
$expectedHeaders = @(
    'sku_code', 'product_title', 'variant_title', 'sales_price', 'cost_price',
    'description', 'brand', 'upc_code', 'image_url', 'country_origin_code',
    'weight_grams', 'product_id', 'min_reorder_level', 'quantity_to_reorder',
    'max_reorder_level', 'width', 'depth', 'height', 'dimensions_unit',
    'tax_rate', 'estimated_delivery', 'tags', 'product_properties',
    'variant_options', 'tariff_code', 'qty_on_hand', 'total_qty',
    'total_stock_value'
)

if (@(Compare-Object $veeqoHeaders $expectedHeaders).Count -ne 0) {
    throw 'Unexpected Veeqo import schema.'
}
if (@($official | Group-Object SKU | Where-Object { $_.Count -gt 1 }).Count -ne 0) {
    throw 'Official catalog contains duplicate SKUs.'
}
if (@($existing | Group-Object sku_code | Where-Object { $_.Count -gt 1 }).Count -ne 0) {
    throw 'Existing Veeqo import contains duplicate SKUs.'
}

$officialBySku = @{}
$official | ForEach-Object { $officialBySku[$_.SKU] = $_ }
$existingBySku = @{}
$existing | ForEach-Object { $existingBySku[$_.sku_code] = $_ }
$sellable = @($official | Where-Object { $_.Type -in @('simple', 'variation') })

foreach ($row in $sellable) {
    if (-not $row.SKU) { throw 'Sellable official product has no SKU.' }
    if ($row.Type -eq 'variation' -and (-not $row.Parent -or -not $officialBySku.ContainsKey($row.Parent))) {
        throw "Variation $($row.SKU) has no resolvable parent."
    }
    if (-not $row.'Regular price' -and -not $row.'Sale price') {
        throw "Sellable product $($row.SKU) has no price."
    }
}

function Get-UniformDefault {
    param([string]$Field)
    $values = @($existing.$Field | Where-Object { $_ -ne '' } | Sort-Object -Unique)
    if ($values.Count -ne 1) {
        throw "Cannot derive a single established Veeqo default for $Field."
    }
    return [string]$values[0]
}

$defaults = @{
    dimensions_unit = Get-UniformDefault 'dimensions_unit'
    tax_rate = Get-UniformDefault 'tax_rate'
    qty_on_hand = Get-UniformDefault 'qty_on_hand'
    total_qty = Get-UniformDefault 'total_qty'
}

function Get-FirstImage {
    param($CatalogRow, $ParentRow)
    $images = [string]$CatalogRow.Images
    if (-not $images -and $null -ne $ParentRow) { $images = [string]$ParentRow.Images }
    if (-not $images) { return '' }
    return [string](($images -split ',')[0].Trim())
}

function Format-Price {
    param([string]$Value)
    if (-not $Value) { return '' }
    return ([double]$Value).ToString('0.0#', $invariant)
}

function Format-Grams {
    param([string]$Pounds)
    if (-not $Pounds) { return '' }
    return ([math]::Round(([double]$Pounds) * 453.59237, 1)).ToString('0.0', $invariant)
}

function Get-PriorValue {
    param($PriorRow, [string]$Field, [string]$Default = '')
    if ($null -ne $PriorRow) { return [string]$PriorRow.$Field }
    return $Default
}

function Get-VariantOptions {
    param($CatalogRow)
    if ($CatalogRow.Type -ne 'variation' -or -not $CatalogRow.'Attribute 1 name') { return '{}' }
    $nameJson = [string]($CatalogRow.'Attribute 1 name' | ConvertTo-Json -Compress)
    $valueJson = [string]($CatalogRow.'Attribute 1 value(s)' | ConvertTo-Json -Compress)
    return '{' + $nameJson + ': ' + $valueJson + '}'
}

$output = [System.Collections.Generic.List[object]]::new()
foreach ($row in $sellable) {
    $prior = if ($existingBySku.ContainsKey($row.SKU)) { $existingBySku[$row.SKU] } else { $null }
    $parent = if ($row.Parent) { $officialBySku[$row.Parent] } else { $null }
    $officialImage = Get-FirstImage -CatalogRow $row -ParentRow $parent
    $officialWeight = Format-Grams -Pounds ([string]$row.'Weight (lbs)')
    $tags = [string]$row.Tags
    if (-not $tags -and $null -ne $parent) { $tags = [string]$parent.Tags }

    $record = [ordered]@{
        sku_code = [string]$row.SKU
        product_title = if ($row.Type -eq 'variation') { [string]$parent.Name } else { [string]$row.Name }
        variant_title = if ($row.Type -eq 'variation') { [string]$row.'Attribute 1 value(s)' } else { '' }
        sales_price = Format-Price -Value $(if ($row.'Sale price') { [string]$row.'Sale price' } else { [string]$row.'Regular price' })
        cost_price = Get-PriorValue $prior 'cost_price'
        description = [string]$row.'Short description'
        brand = [string]$row.Brands
        upc_code = if ($row.'GTIN, UPC, EAN, or ISBN') { [string]$row.'GTIN, UPC, EAN, or ISBN' } else { Get-PriorValue $prior 'upc_code' }
        image_url = if ($officialImage) { $officialImage } else { Get-PriorValue $prior 'image_url' }
        country_origin_code = Get-PriorValue $prior 'country_origin_code'
        weight_grams = if ($officialWeight) { $officialWeight } else { Get-PriorValue $prior 'weight_grams' }
        product_id = Get-PriorValue $prior 'product_id'
        min_reorder_level = Get-PriorValue $prior 'min_reorder_level'
        quantity_to_reorder = Get-PriorValue $prior 'quantity_to_reorder'
        max_reorder_level = Get-PriorValue $prior 'max_reorder_level'
        width = if ($row.'Width (in)') { [string]$row.'Width (in)' } else { Get-PriorValue $prior 'width' }
        depth = if ($row.'Length (in)') { [string]$row.'Length (in)' } else { Get-PriorValue $prior 'depth' }
        height = if ($row.'Height (in)') { [string]$row.'Height (in)' } else { Get-PriorValue $prior 'height' }
        dimensions_unit = Get-PriorValue $prior 'dimensions_unit' $defaults.dimensions_unit
        tax_rate = Get-PriorValue $prior 'tax_rate' $defaults.tax_rate
        estimated_delivery = Get-PriorValue $prior 'estimated_delivery'
        tags = $tags
        product_properties = Get-PriorValue $prior 'product_properties'
        variant_options = Get-VariantOptions -CatalogRow $row
        tariff_code = Get-PriorValue $prior 'tariff_code'
        qty_on_hand = Get-PriorValue $prior 'qty_on_hand' $defaults.qty_on_hand
        total_qty = Get-PriorValue $prior 'total_qty' $defaults.total_qty
        total_stock_value = Get-PriorValue $prior 'total_stock_value'
    }
    $output.Add([pscustomobject]$record)
}

$csvLines = @($output | ConvertTo-Csv -NoTypeInformation -UseQuotes AsNeeded)
$text = [string]::Join("`r`n", $csvLines) + "`r`n"
[System.IO.File]::WriteAllText($veeqoPath, $text, [System.Text.UTF8Encoding]::new($false))

[pscustomobject]@{
    official_rows = $official.Count
    sellable_rows = $sellable.Count
    output_rows = $output.Count
    preserved_skus = @($output | Where-Object { $existingBySku.ContainsKey($_.sku_code) }).Count
    added_skus = @($output | Where-Object { -not $existingBySku.ContainsKey($_.sku_code) }).Count
    removed_skus = @($existing | Where-Object { -not $officialBySku.ContainsKey($_.sku_code) -or $officialBySku[$_.sku_code].Type -notin @('simple', 'variation') }).Count
}
