[CmdletBinding()]
param(
    [string] $CatalogPath = 'products\launch\official\dtb_official_catalog.csv',
    [string] $OutputDir = 'products\dev\seo-pre-generation',
    [switch] $FailOnBlocking
)

$ErrorActionPreference = 'Stop'
$script = Join-Path $PSScriptRoot 'catalog_seo_pre_generation.py'
$args = @($script, '--catalog', $CatalogPath, '--output-dir', $OutputDir)
if ($FailOnBlocking) {
    $args += '--fail-on-blocking'
}

& python @args
if ($LASTEXITCODE -eq 2) {
    throw "SEO pre-generation completed but blocking findings remain. Review $OutputDir."
}
if ($LASTEXITCODE -ne 0) {
    throw "SEO pre-generation failed for $CatalogPath."
}
