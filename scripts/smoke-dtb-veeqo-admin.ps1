param(
    [string]$BaseUrl = ""
)

$ErrorActionPreference = "Stop"
$repoRoot = Split-Path -Parent $PSScriptRoot
$veeqoRoot = Join-Path $repoRoot "drywalltoolbox/wp/wp-content/mu-plugins/dtb-integrations/Veeqo"
$bootstrap = Join-Path $repoRoot "drywalltoolbox/wp/wp-content/mu-plugins/dtb-integrations/bootstrap.php"

$required = @(
    "README.md",
    "VeeqoClient.php",
    "VeeqoConfig.php",
    "VeeqoCredentialBoundary.php",
    "VeeqoProductionConfiguration.php",
    "VeeqoInventoryService.php",
    "VeeqoInventoryProjectionServiceV3.php",
    "VeeqoInventorySchedulePolicy.php",
    "VeeqoInventoryCoverageService.php",
    "VeeqoRuntimePolicy.php",
    "VeeqoOrderProjectionContract.php",
    "VeeqoInventoryBoundary.php",
    "VeeqoShippingService.php",
    "VeeqoSyncJob.php",
    "VeeqoHealthCheck.php",
    "Services/VeeqoOperationStore.php",
    "Services/VeeqoAdminReadModel.php",
    "Rest/VeeqoAdminController.php",
    "Rest/VeeqoCompatibilityController.php",
    "Admin/VeeqoAdminPage.php",
    "assets/veeqo-admin.css",
    "assets/veeqo-admin.js"
)

$forbiddenFiles = @(
    "VeeqoInventoryProjectionService.php",
    "VeeqoInventoryProjectionServiceV2.php",
    "VeeqoInventoryAdminController.php",
    "VeeqoOperationsAdmin.php",
    "VeeqoLegacyAdminRegistrationGuard.php",
    "Infrastructure/VeeqoAdminCache.php",
    "Services/VeeqoAdminInventoryReadService.php",
    "Services/VeeqoAdminOrderReadService.php"
)

$forbiddenDirectories = @(
    "Infrastructure"
)

$failures = New-Object System.Collections.Generic.List[string]

if (-not (Test-Path -LiteralPath $veeqoRoot -PathType Container)) {
    $failures.Add("Missing canonical Veeqo module directory: $veeqoRoot")
}

foreach ($relative in $required) {
    $path = Join-Path $veeqoRoot $relative
    if (-not (Test-Path -LiteralPath $path -PathType Leaf)) {
        $failures.Add("Missing required Veeqo file: $relative")
    }
}

foreach ($relative in $forbiddenFiles) {
    $path = Join-Path $veeqoRoot $relative
    if (Test-Path -LiteralPath $path -PathType Leaf) {
        $failures.Add("Retired Veeqo file is still present: $relative")
    }
}

foreach ($relative in $forbiddenDirectories) {
    $path = Join-Path $veeqoRoot $relative
    if (Test-Path -LiteralPath $path -PathType Container) {
        $failures.Add("Retired Veeqo directory is still present: $relative")
    }
}

if (-not (Test-Path -LiteralPath $bootstrap -PathType Leaf)) {
    $failures.Add("Missing dtb-integrations bootstrap.php")
} else {
    $bootstrapText = Get-Content -LiteralPath $bootstrap -Raw
    foreach ($needle in @(
        "VeeqoCredentialBoundary.php",
        "VeeqoInventoryProjectionServiceV3.php",
        "Services/VeeqoOperationStore.php",
        "Services/VeeqoAdminReadModel.php",
        "Rest/VeeqoAdminController.php",
        "Rest/VeeqoCompatibilityController.php",
        "Admin/VeeqoAdminPage.php"
    )) {
        if (-not $bootstrapText.Contains($needle)) {
            $failures.Add("Bootstrap is missing canonical Veeqo wiring: $needle")
        }
    }
    foreach ($needle in @(
        "VeeqoInventoryProjectionService.php",
        "VeeqoInventoryProjectionServiceV2.php",
        "VeeqoInventoryAdminController.php",
        "VeeqoOperationsAdmin.php",
        "VeeqoLegacyAdminRegistrationGuard.php",
        "Services/VeeqoAdminInventoryReadService.php",
        "Services/VeeqoAdminOrderReadService.php"
    )) {
        if ($bootstrapText.Contains($needle)) {
            $failures.Add("Bootstrap still references retired Veeqo wiring: $needle")
        }
    }

    $credentialBoundaryIndex = $bootstrapText.IndexOf("dtb-integrations/Veeqo/VeeqoCredentialBoundary.php", [System.StringComparison]::Ordinal)
    $compatibilityClientIndex = $bootstrapText.IndexOf("dtb-integrations/Veeqo/VeeqoClient.php", [System.StringComparison]::Ordinal)
    if ($credentialBoundaryIndex -lt 0 -or $compatibilityClientIndex -lt 0 -or $credentialBoundaryIndex -ge $compatibilityClientIndex) {
        $failures.Add("VeeqoCredentialBoundary.php must load before VeeqoClient.php")
    }
}

$phpFiles = @()
if (Test-Path -LiteralPath $veeqoRoot -PathType Container) {
    $phpFiles = @(Get-ChildItem -LiteralPath $veeqoRoot -Recurse -File -Filter "*.php")
}

foreach ($file in $phpFiles) {
    $text = Get-Content -LiteralPath $file.FullName -Raw
    if (-not $text.Contains("defined( 'ABSPATH' ) || exit;")) {
        $relative = $file.FullName.Substring($veeqoRoot.Length).TrimStart('\', '/')
        $failures.Add("Veeqo PHP file lacks the canonical ABSPATH guard: $relative")
    }
}

$symbolChecks = @(
    @{ Pattern = 'function\s+dtb_veeqo_remove_legacy_admin_registration\s*\('; Expected = 1; Label = 'legacy admin retirement function' },
    @{ Pattern = 'function\s+dtb_veeqo_inventory_reconcile_chunk\s*\('; Expected = 1; Label = 'canonical inventory chunk function' },
    @{ Pattern = 'function\s+dtb_veeqo_boundary_config\s*\('; Expected = 1; Label = 'credential-boundary configuration function' },
    @{ Pattern = 'function\s+dtb_veeqo_refresh_credential_boundary\s*\('; Expected = 1; Label = 'credential-boundary refresh function' },
    @{ Pattern = 'class\s+DTB_Veeqo_Operation_Store\b'; Expected = 1; Label = 'operation-store class' }
)
foreach ($check in $symbolChecks) {
    $count = 0
    foreach ($file in $phpFiles) {
        $text = Get-Content -LiteralPath $file.FullName -Raw
        $count += ([regex]::Matches($text, $check.Pattern)).Count
    }
    if ($count -ne $check.Expected) {
        $failures.Add("Expected exactly $($check.Expected) declaration(s) of $($check.Label); found $count")
    }
}

$credentialBoundary = Join-Path $veeqoRoot "VeeqoCredentialBoundary.php"
if (Test-Path -LiteralPath $credentialBoundary) {
    $credentialBoundaryText = Get-Content -LiteralPath $credentialBoundary -Raw
    foreach ($needle in @(
        "DTB_VEEQO_API_KEY",
        "DTB_VEEQO_WEBHOOK_SECRET",
        "`$stored['warehouse_id']",
        "`$stored['channel_id']",
        "`$stored['delivery_method_id']",
        "dtb_veeqo_refresh_credential_boundary();"
    )) {
        if (-not $credentialBoundaryText.Contains($needle)) {
            $failures.Add("Credential boundary is missing required configuration behavior: $needle")
        }
    }
    foreach ($forbidden in @(
        "`$stored['api_key']",
        "`$stored[`"api_key`"]",
        "`$stored['webhook_secret']",
        "`$stored[`"webhook_secret`"]",
        "update_option(",
        "delete_option(",
        "get_site_option("
    )) {
        if ($credentialBoundaryText.Contains($forbidden)) {
            $failures.Add("Credential boundary must not read option-stored secrets or mutate settings: $forbidden")
        }
    }
}

$runtimePolicy = Join-Path $veeqoRoot "VeeqoRuntimePolicy.php"
if (Test-Path -LiteralPath $runtimePolicy) {
    $policyText = Get-Content -LiteralPath $runtimePolicy -Raw
    foreach ($needle in @(
        "remove_action( 'rest_api_init', 'dtb_veeqo_register_routes', 10 )",
        "remove_action( 'woocommerce_update_product', 'dtb_veeqo_map_product_sku', 20 )",
        "remove_action( 'dtb_veeqo_inventory_sync', 'dtb_veeqo_run_inventory_pull' )",
        "dtb_veeqo_remove_persisted_credentials",
        "function_exists( 'dtb_veeqo_remove_legacy_admin_registration' )",
        "dtb_veeqo_refresh_credential_boundary()"
    )) {
        if (-not $policyText.Contains($needle)) {
            $failures.Add("Runtime policy is missing retirement/security guard: $needle")
        }
    }
}

$productionConfiguration = Join-Path $veeqoRoot "VeeqoProductionConfiguration.php"
if (Test-Path -LiteralPath $productionConfiguration) {
    $productionConfigurationText = Get-Content -LiteralPath $productionConfiguration -Raw
    foreach ($needle in @(
        "unset( `$settings['api_key'], `$settings['webhook_secret'] )",
        "dtb_veeqo_refresh_credential_boundary()"
    )) {
        if (-not $productionConfigurationText.Contains($needle)) {
            $failures.Add("Production configuration is missing credential-boundary behavior: $needle")
        }
    }
}

$controller = Join-Path $veeqoRoot "Rest/VeeqoAdminController.php"
if (Test-Path -LiteralPath $controller) {
    $controllerText = Get-Content -LiteralPath $controller -Raw
    if (-not $controllerText.Contains("current_user_can( 'manage_woocommerce' )")) {
        $failures.Add("Canonical Veeqo admin controller lacks manage_woocommerce authorization")
    }
    if ($controllerText -match "api_key['\"\s]*=>|webhook_secret['\"\s]*=>") {
        $failures.Add("Canonical Veeqo admin controller may expose a credential field")
    }
}

$adminPage = Join-Path $veeqoRoot "Admin/VeeqoAdminPage.php"
if (Test-Path -LiteralPath $adminPage) {
    $adminPageText = Get-Content -LiteralPath $adminPage -Raw
    if ($adminPageText -match 'DTB_VEEQO_API_KEY\s*[=:]\s*["'']') {
        $failures.Add("Veeqo admin page appears to embed a credential literal")
    }
}

$adminJs = Join-Path $veeqoRoot "assets/veeqo-admin.js"
if (Test-Path -LiteralPath $adminJs) {
    $adminJsText = Get-Content -LiteralPath $adminJs -Raw
    if ($adminJsText -match '(?i)authorization\s*:\s*["'']|api[_-]?key\s*[:=]\s*["'']|webhook[_-]?secret\s*[:=]\s*["'']') {
        $failures.Add("Veeqo admin JavaScript appears to embed credential material")
    }
}

$client = Join-Path $veeqoRoot "VeeqoClient.php"
if (Test-Path -LiteralPath $client) {
    $clientText = Get-Content -LiteralPath $client -Raw
    if (-not $clientText.Contains("function dtb_veeqo_request")) {
        $failures.Add("Veeqo compatibility client no longer provides the canonical API request helper")
    }
}

$php = Get-Command php -ErrorAction SilentlyContinue
if ($null -ne $php) {
    foreach ($file in @($phpFiles + (Get-Item -LiteralPath $bootstrap))) {
        & $php.Source -l $file.FullName | Out-Host
        if ($LASTEXITCODE -ne 0) {
            $failures.Add("PHP syntax failed: $($file.FullName)")
        }
    }
} else {
    Write-Warning "php is not available; PHP syntax validation was skipped."
}

$node = Get-Command node -ErrorAction SilentlyContinue
if ($null -ne $node -and (Test-Path -LiteralPath $adminJs)) {
    & $node.Source --check $adminJs | Out-Host
    if ($LASTEXITCODE -ne 0) {
        $failures.Add("JavaScript syntax failed: $adminJs")
    }
} else {
    Write-Warning "node or the admin JavaScript file is unavailable; JavaScript syntax validation was skipped."
}

if ($BaseUrl) {
    $root = $BaseUrl.TrimEnd('/')
    $routes = @(
        "/wp-json/dtb/v1/veeqo/admin/control-center/overview",
        "/wp-json/dtb/v1/veeqo/admin/control-center/inventory",
        "/wp-json/dtb/v1/veeqo/admin/control-center/orders",
        "/wp-json/dtb/v1/veeqo/admin/control-center/settings"
    )
    foreach ($route in $routes) {
        try {
            $response = Invoke-WebRequest -Uri ($root + $route) -Method Get -MaximumRedirection 0 -SkipHttpErrorCheck
            if ($response.StatusCode -notin @(401, 403)) {
                $failures.Add("Unauthenticated route was not rejected ($($response.StatusCode)): $route")
            }
        } catch {
            $status = [int]$_.Exception.Response.StatusCode
            if ($status -notin @(401, 403)) {
                $failures.Add("Unexpected unauthenticated route result ($status): $route")
            }
        }
    }
}

if ($failures.Count -gt 0) {
    Write-Error ("Veeqo control-center smoke failed:`n - " + ($failures -join "`n - "))
    exit 1
}

Write-Host "Veeqo control-center smoke passed." -ForegroundColor Green
