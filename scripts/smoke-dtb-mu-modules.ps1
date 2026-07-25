param()

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$repoRoot = Split-Path -Parent $PSScriptRoot
$muRoot = Join-Path $repoRoot "drywalltoolbox/wp/wp-content/mu-plugins"
$loader = Join-Path $muRoot "00-dtb-loader.php"

$modules = @(
    "dtb-platform",
    "dtb-catalog-platform",
    "dtb-commerce",
    "dtb-order-platform",
    "dtb-schematics",
    "dtb-media",
    "dtb-marketing",
    "dtb-repair-service",
    "dtb-integrations",
    "dtb-support",
    "dtb-returns"
)

$failures = New-Object System.Collections.Generic.List[string]

if (-not (Test-Path -LiteralPath $muRoot -PathType Container)) {
    $failures.Add("Missing canonical MU-plugin root: $muRoot")
}

if (-not (Test-Path -LiteralPath $loader -PathType Leaf)) {
    $failures.Add("Missing canonical MU-plugin composition root: $loader")
}

$loaderText = ""
if (Test-Path -LiteralPath $loader -PathType Leaf) {
    $loaderText = Get-Content -LiteralPath $loader -Raw

    foreach ($needle in @(
        "function dtb_module_require( string `$relative ): void",
        "defined( 'ABSPATH' ) || exit;"
    )) {
        if (-not $loaderText.Contains($needle)) {
            $failures.Add("MU-plugin loader is missing required composition behavior: $needle")
        }
    }
}

$previousIndex = -1
$bootstrapFiles = New-Object System.Collections.Generic.List[System.IO.FileInfo]

foreach ($module in $modules) {
    $relative = "$module/bootstrap.php"
    $path = Join-Path $muRoot $relative

    if (-not (Test-Path -LiteralPath $path -PathType Leaf)) {
        $failures.Add("Missing required module bootstrap: $relative")
        continue
    }

    $bootstrapFiles.Add((Get-Item -LiteralPath $path))
    $bootstrapText = Get-Content -LiteralPath $path -Raw
    if (-not $bootstrapText.Contains("defined( 'ABSPATH' ) || exit;")) {
        $failures.Add("Module bootstrap lacks the canonical ABSPATH guard: $relative")
    }

    if ($loaderText) {
        $needle = "_dtb_require( `$_dtb_dir . '/$relative' );"
        $count = ([regex]::Matches($loaderText, [regex]::Escape($needle))).Count
        if ($count -ne 1) {
            $failures.Add("Expected exactly one loader reference for $relative; found $count")
            continue
        }

        $index = $loaderText.IndexOf($needle, [System.StringComparison]::Ordinal)
        if ($index -le $previousIndex) {
            $failures.Add("Module loader order is incorrect at $relative")
        }
        $previousIndex = $index
    }
}

if ($loaderText) {
    foreach ($retired in @(
        "dtb-order-operations-read-models.php",
        "dtb-order-operations-actions.php",
        "dtb-order-operations-ajax.php",
        "dtb-order-operations-dashboard.php"
    )) {
        $pattern = "(?m)^\s*_dtb_require\(\s*\`$_dtb_dir\s*\.\s*'/$([regex]::Escape($retired))'\s*\);"
        if ([regex]::IsMatch($loaderText, $pattern)) {
            $failures.Add("MU-plugin loader still actively requires retired root wrapper: $retired")
        }
    }
}

$phpFiles = @()
if (Test-Path -LiteralPath $muRoot -PathType Container) {
    foreach ($module in $modules) {
        $moduleRoot = Join-Path $muRoot $module
        if (Test-Path -LiteralPath $moduleRoot -PathType Container) {
            $phpFiles += @(Get-ChildItem -LiteralPath $moduleRoot -Recurse -File -Filter "*.php")
        }
    }
    if (Test-Path -LiteralPath $loader -PathType Leaf) {
        $phpFiles += @(Get-Item -LiteralPath $loader)
    }
}

foreach ($file in $phpFiles) {
    $bytes = [System.IO.File]::ReadAllBytes($file.FullName)
    if ($bytes.Length -ge 3 -and $bytes[0] -eq 0xEF -and $bytes[1] -eq 0xBB -and $bytes[2] -eq 0xBF) {
        $relative = $file.FullName.Substring($muRoot.Length).TrimStart('\', '/')
        $failures.Add("UTF-8 BOM found before PHP open tag: $relative")
    }
}

$php = Get-Command php -ErrorAction SilentlyContinue
if ($null -ne $php) {
    $syntaxTargets = @()
    if (Test-Path -LiteralPath $loader -PathType Leaf) {
        $syntaxTargets += @(Get-Item -LiteralPath $loader)
    }
    $syntaxTargets += @($bootstrapFiles)

    foreach ($file in $syntaxTargets) {
        & $php.Source -l $file.FullName | Out-Host
        if ($LASTEXITCODE -ne 0) {
            $relative = $file.FullName.Substring($repoRoot.Length).TrimStart('\', '/')
            $failures.Add("PHP syntax failed: $relative")
        }
    }
} else {
    Write-Warning "php is not available; loader/bootstrap syntax validation was skipped."
}

if ($failures.Count -gt 0) {
    Write-Error ("DTB MU-plugin composition smoke failed:`n - " + ($failures -join "`n - "))
    exit 1
}

Write-Host "DTB MU-plugin composition smoke passed." -ForegroundColor Green
