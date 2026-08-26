[CmdletBinding()]
param(
    [ValidateSet('Both', 'Staging', 'Production')]
    [string] $Target,

    [switch] $Install
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

$repositoryRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$frontendRoot = Join-Path $repositoryRoot 'frontend'
$originalLocation = Get-Location

function Write-BuildMessage {
    param([Parameter(Mandatory)][string] $Message)

    Write-Host "[dtb-build] $Message"
}

function Resolve-BuildTarget {
    if ($Target) {
        return $Target
    }

    Write-Host ''
    Write-Host 'Drywall Toolbox Frontend Build'
    Write-Host '--------------------------------'
    Write-Host '  1. Build staging and production'
    Write-Host '  2. Build staging only'
    Write-Host '  3. Build production only'
    Write-Host ''

    while ($true) {
        $selection = Read-Host 'Select an option [1-3]'
        switch ($selection.Trim()) {
            '1' { return 'Both' }
            '2' { return 'Staging' }
            '3' { return 'Production' }
            default { Write-Warning 'Enter 1, 2, or 3.' }
        }
    }
}

function Assert-RequiredFile {
    param([Parameter(Mandatory)][string] $Path)

    if (-not (Test-Path -LiteralPath $Path -PathType Leaf)) {
        throw "Required build file is missing: $Path"
    }
}

function Get-NpmInvocation {
    $nodeCommand = Get-Command 'node' -ErrorAction SilentlyContinue
    if ($nodeCommand) {
        $nodeDirectory = Split-Path -Parent $nodeCommand.Source
        $bundledNpmCli = Join-Path $nodeDirectory 'node_modules\npm\bin\npm-cli.js'
        if (Test-Path -LiteralPath $bundledNpmCli -PathType Leaf) {
            return @($nodeCommand.Source, $bundledNpmCli)
        }
    }

    $npmCommand = Get-Command 'npm.cmd' -ErrorAction SilentlyContinue
    if (-not $npmCommand) {
        $npmCommand = Get-Command 'npm' -ErrorAction SilentlyContinue
    }
    if (-not $npmCommand) {
        throw 'Node.js/npm was not found on PATH. Install the repository Node.js version first.'
    }

    return @($npmCommand.Source)
}

function Invoke-Npm {
    param([Parameter(Mandatory)][string[]] $Arguments)

    $invocation = Get-NpmInvocation
    $executable = $invocation[0]
    $prefixArguments = @()
    if ($invocation.Count -gt 1) {
        $prefixArguments = $invocation[1..($invocation.Count - 1)]
    }
    $displayArguments = @($prefixArguments) + $Arguments

    Write-BuildMessage "Running: npm $($Arguments -join ' ')"
    & $executable @displayArguments
    if ($LASTEXITCODE -ne 0) {
        throw "npm $($Arguments -join ' ') failed with exit code $LASTEXITCODE."
    }
}

function Assert-BuildOutput {
    param(
        [Parameter(Mandatory)][string] $Environment,
        [Parameter(Mandatory)][string] $OutputRoot
    )

    $requiredOutputs = @(
        'index.html',
        '.htaccess',
        'asset-manifest.json',
        'site.webmanifest'
    )

    foreach ($relativePath in $requiredOutputs) {
        $outputPath = Join-Path $OutputRoot $relativePath
        if (-not (Test-Path -LiteralPath $outputPath -PathType Leaf)) {
            throw "$Environment build completed without required artifact: $outputPath"
        }
    }
}

function Invoke-FrontendBuild {
    param([Parameter(Mandatory)][ValidateSet('Staging', 'Production')][string] $Environment)

    if ($Environment -eq 'Staging') {
        $npmScript = 'build:staging'
        $outputRoot = Join-Path $repositoryRoot 'dist-staging'
    }
    else {
        $npmScript = 'build'
        $outputRoot = Join-Path $repositoryRoot 'dist'
    }

    Write-Host ''
    Write-BuildMessage "Starting $Environment build."
    Invoke-Npm -Arguments @('run', $npmScript)
    Assert-BuildOutput -Environment $Environment -OutputRoot $outputRoot
    Write-BuildMessage "$Environment build complete: $outputRoot"
}

try {
    Assert-RequiredFile (Join-Path $frontendRoot 'package.json')
    Assert-RequiredFile (Join-Path $frontendRoot 'package-lock.json')
    Assert-RequiredFile (Join-Path $frontendRoot '.env.staging')
    Assert-RequiredFile (Join-Path $frontendRoot '.env.production')
    Assert-RequiredFile (Join-Path $repositoryRoot 'drywalltoolbox\htaccess.hostgator-staging')
    Assert-RequiredFile (Join-Path $repositoryRoot 'drywalltoolbox\.htaccess')

    $selectedTarget = Resolve-BuildTarget
    Set-Location -LiteralPath $frontendRoot

    $nodeModulesPath = Join-Path $frontendRoot 'node_modules'
    if ($Install -or -not (Test-Path -LiteralPath $nodeModulesPath -PathType Container)) {
        Write-BuildMessage 'Installing locked frontend dependencies with npm ci.'
        Invoke-Npm -Arguments @('ci')
    }

    switch ($selectedTarget) {
        'Both' {
            Invoke-FrontendBuild -Environment 'Staging'
            Invoke-FrontendBuild -Environment 'Production'
        }
        'Staging' { Invoke-FrontendBuild -Environment 'Staging' }
        'Production' { Invoke-FrontendBuild -Environment 'Production' }
        default { throw "Unsupported build target: $selectedTarget" }
    }

    Write-Host ''
    Write-BuildMessage "Selected build target completed successfully: $selectedTarget"
}
catch {
    Write-Error "Build failed: $($_.Exception.Message)"
    exit 1
}
finally {
    Set-Location -LiteralPath $originalLocation
}
