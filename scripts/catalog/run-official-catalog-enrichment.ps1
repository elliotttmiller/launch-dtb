[CmdletBinding()]
param(
    [string] $CatalogPath = 'products\launch\official\dtb_official_catalog.csv',
    [string] $OutputDir = 'products\dev\catalog-enrichment',
    [switch] $AllRows,
    [switch] $FailOnSeoBlocking
)

$ErrorActionPreference = 'Stop'

function Invoke-CheckedPython {
    param(
        [Parameter(Mandatory)] [string] $Script,
        [Parameter()] [string[]] $Arguments = @(),
        [Parameter()] [int[]] $AllowedExitCodes = @(0)
    )

    & python $Script @Arguments
    if ($AllowedExitCodes -notcontains $LASTEXITCODE) {
        throw "Catalog enrichment stage failed: $Script (exit $LASTEXITCODE)."
    }
    return $LASTEXITCODE
}

$catalog = (Resolve-Path -LiteralPath $CatalogPath).Path
$root = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '..\..')).Path
$output = Join-Path $root $OutputDir
New-Item -ItemType Directory -Path $output -Force | Out-Null

$validator = Join-Path $PSScriptRoot 'validate_official_catalog.py'
$audit = Join-Path $PSScriptRoot 'audit_official_catalog_enrichment.py'
$seo = Join-Path $PSScriptRoot 'catalog_seo_pre_generation.py'

Write-Host '1/3 Validate canonical catalog'
Invoke-CheckedPython -Script $validator -Arguments @('--catalog', $catalog) | Out-Null

Write-Host '2/3 Audit enrichment quality'
$auditArgs = @('--catalog', $catalog)
if ($AllRows) { $auditArgs += '--all' }
$auditPath = Join-Path $output 'catalog-enrichment-audit.json'
$auditJson = & python $audit @auditArgs
if ($LASTEXITCODE -ne 0) {
    throw "Catalog enrichment audit failed (exit $LASTEXITCODE)."
}
$auditJson | Set-Content -LiteralPath $auditPath -Encoding utf8

Write-Host '3/3 Prepare evidence-bounded content/SEO packets'
$seoOutput = Join-Path $output 'seo-pre-generation'
$seoArgs = @('--catalog', $catalog, '--output-dir', $seoOutput)
if ($FailOnSeoBlocking) { $seoArgs += '--fail-on-blocking' }
$allowedSeoExitCodes = if ($FailOnSeoBlocking) { @(0, 2) } else { @(0) }
$seoExit = Invoke-CheckedPython -Script $seo -Arguments $seoArgs -AllowedExitCodes $allowedSeoExitCodes
if ($FailOnSeoBlocking -and $seoExit -eq 2) {
    throw "SEO pre-generation completed, but blocking findings remain. Review $seoOutput."
}

$summary = [ordered]@{
    catalog = $catalog
    output = $output
    all_rows = [bool]$AllRows
    stages = @('validate', 'enrichment_audit', 'seo_pre_generation')
    mutates_catalog = $false
    audit = $auditPath
    seo_pre_generation = $seoOutput
}
$summaryPath = Join-Path $output 'run-summary.json'
$summary | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath $summaryPath -Encoding utf8

Write-Host "Catalog enrichment preparation complete: $summaryPath"
