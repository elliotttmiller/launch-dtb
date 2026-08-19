[CmdletBinding()]
param(
    [string] $CatalogPath = 'products\launch\official\dtb_official_catalog.csv',
    [string] $OutputDir = 'products\dev\catalog-enrichment',
    [switch] $AllRows,
    [switch] $ApplySafeFixes,
    [switch] $FailOnSeoBlocking
)

$ErrorActionPreference = 'Stop'

function Get-UtcTimestamp { return (Get-Date).ToUniversalTime().ToString('o') }

function Get-RelativePath {
    param([Parameter(Mandatory)] [string] $Root, [Parameter(Mandatory)] [string] $Path)
    return [IO.Path]::GetRelativePath($Root, $Path).Replace('\', '/')
}

function Invoke-CatalogStage {
    param(
        [Parameter(Mandatory)] [string] $Name,
        [Parameter(Mandatory)] [string] $Script,
        [Parameter()] [string[]] $Arguments = @(),
        [Parameter()] [int[]] $AllowedExitCodes = @(0),
        [switch] $DiscardOutput
    )

    $started = Get-UtcTimestamp
    if ($DiscardOutput) { & python $Script @Arguments | Out-Null } else { & python $Script @Arguments }
    $exitCode = $LASTEXITCODE
    $script:stageResults += [ordered]@{
        name = $Name
        status = if ($AllowedExitCodes -contains $exitCode) { 'passed' } else { 'failed' }
        exit_code = $exitCode
        started_at = $started
        completed_at = Get-UtcTimestamp
    }
    if ($AllowedExitCodes -notcontains $exitCode) {
        throw "Catalog enrichment stage failed: $Name ($Script, exit $exitCode)."
    }
    return $exitCode
}

$runStarted = Get-UtcTimestamp
$catalog = (Resolve-Path -LiteralPath $CatalogPath).Path
$root = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '..\..')).Path
$output = Join-Path $root $OutputDir
New-Item -ItemType Directory -Path $output -Force | Out-Null

$validator = Join-Path $PSScriptRoot 'validate_official_catalog.py'
$safeFixes = Join-Path $PSScriptRoot 'clear_legacy_seo_canonicals.py'
$audit = Join-Path $PSScriptRoot 'audit_official_catalog_enrichment.py'
$seo = Join-Path $PSScriptRoot 'catalog_seo_pre_generation.py'

$safeFixPath = Join-Path $output 'safe-fixes.json'
$auditPath = Join-Path $output 'catalog-enrichment-audit.json'
$remediationPath = Join-Path $output 'catalog-remediation.csv'
$seoOutput = Join-Path $output 'seo-pre-generation'
$seoSummaryPath = Join-Path $seoOutput 'pre-generation-summary.json'
$summaryPath = Join-Path $output 'run-summary.json'
$stageResults = @()
$runStatus = 'passed'
$failureMessage = $null

try {
    Write-Host 'Validate canonical catalog'
    Invoke-CatalogStage -Name 'validate' -Script $validator -Arguments @('--catalog', $catalog) -DiscardOutput | Out-Null

    if ($ApplySafeFixes) {
        Write-Host 'Apply reviewed deterministic safe fixes'
        Invoke-CatalogStage -Name 'safe_fixes' -Script $safeFixes -Arguments @('--catalog', $catalog, '--report', $safeFixPath, '--apply') -DiscardOutput | Out-Null
    }

    Write-Host 'Audit actionable enrichment quality'
    $auditArgs = @('--catalog', $catalog, '--report-json', $auditPath, '--remediation-csv', $remediationPath)
    if ($AllRows) { $auditArgs += '--all' }
    Invoke-CatalogStage -Name 'enrichment_audit' -Script $audit -Arguments $auditArgs -DiscardOutput | Out-Null

    Write-Host 'Prepare evidence-bounded content/SEO packets'
    $seoArgs = @('--catalog', $catalog, '--output-dir', $seoOutput)
    if ($FailOnSeoBlocking) { $seoArgs += '--fail-on-blocking' }
    $allowedSeoExitCodes = if ($FailOnSeoBlocking) { @(0, 2) } else { @(0) }
    $seoExit = Invoke-CatalogStage -Name 'seo_pre_generation' -Script $seo -Arguments $seoArgs -AllowedExitCodes $allowedSeoExitCodes -DiscardOutput
    if ($FailOnSeoBlocking -and $seoExit -eq 2) {
        $runStatus = 'blocked'
        throw "SEO pre-generation completed, but blocking findings remain. Review $seoOutput."
    }
}
catch {
    if ($runStatus -ne 'blocked') { $runStatus = 'failed' }
    $failureMessage = $_.Exception.Message
}
finally {
    $safeFixSummary = if (Test-Path -LiteralPath $safeFixPath) { Get-Content -LiteralPath $safeFixPath -Raw | ConvertFrom-Json } else { $null }
    $auditSummary = if (Test-Path -LiteralPath $auditPath) { Get-Content -LiteralPath $auditPath -Raw | ConvertFrom-Json } else { $null }
    $seoSummary = if (Test-Path -LiteralPath $seoSummaryPath) { Get-Content -LiteralPath $seoSummaryPath -Raw | ConvertFrom-Json } else { $null }
    $gitCommit = (& git -C $root rev-parse HEAD 2>$null)
    if ($LASTEXITCODE -ne 0) { $gitCommit = '' }

    $summary = [ordered]@{
        schema_version = 3
        status = $runStatus
        started_at = $runStarted
        completed_at = Get-UtcTimestamp
        repository_commit = ([string]$gitCommit).Trim()
        catalog = Get-RelativePath -Root $root -Path $catalog
        catalog_sha256 = (Get-FileHash -LiteralPath $catalog -Algorithm SHA256).Hash.ToLowerInvariant()
        scope = if ($AllRows) { 'all' } else { 'published' }
        mutates_catalog = [bool]$ApplySafeFixes
        stages = $stageResults
        outputs = [ordered]@{
            safe_fixes = if ($ApplySafeFixes) { Get-RelativePath -Root $root -Path $safeFixPath } else { $null }
            audit = Get-RelativePath -Root $root -Path $auditPath
            remediation = Get-RelativePath -Root $root -Path $remediationPath
            seo_pre_generation = Get-RelativePath -Root $root -Path $seoOutput
        }
        safe_fixes = if ($safeFixSummary) {
            [ordered]@{
                applied = $safeFixSummary.applied
                eligible_overrides = $safeFixSummary.eligible_overrides
                conflicting = $safeFixSummary.conflicting
                redundant = $safeFixSummary.redundant
            }
        } else { $null }
        catalog_quality = if ($auditSummary) {
            [ordered]@{
                rows = $auditSummary.quality.rows
                parts = $auditSummary.quality.parts
                actionable_remediation = $auditSummary.quality.remediation.count
                remediation_by_finding = $auditSummary.quality.remediation.by_finding
                operational_coverage = $auditSummary.quality.operational_coverage
                gtin_coverage = $auditSummary.quality.coverage.gtin
                image_coverage = $auditSummary.quality.coverage.images
                structured_spec_coverage = $auditSummary.quality.coverage.structured_specs
                compatibility_research_rows = $auditSummary.quality.relationships.primary_part_research_rows
                compatible_tool_references = $auditSummary.quality.relationships.compatible_tool_reference_count
                replacement_references = $auditSummary.quality.relationships.replacement_reference_count
            }
        } else { $null }
        seo = if ($seoSummary) {
            [ordered]@{
                generation_eligible = $seoSummary.generation_eligible
                blocking_findings = $seoSummary.blocking_findings
                findings_by_workflow = $seoSummary.findings_by_workflow
            }
        } else { $null }
        failure = $failureMessage
    }
    $summary | ConvertTo-Json -Depth 12 | Set-Content -LiteralPath $summaryPath -Encoding utf8
}

if ($runStatus -ne 'passed') { throw $failureMessage }
Write-Host "Catalog enrichment run complete: $summaryPath"
