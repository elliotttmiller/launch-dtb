param(
    [string]$BaseUrl = ""
)

$ErrorActionPreference = "Stop"
$repoRoot = Split-Path -Parent $PSScriptRoot
$veeqoRoot = Join-Path $repoRoot "drywalltoolbox/wp/wp-content/mu-plugins/dtb-integrations/Veeqo"
$bootstrap = Join-Path $repoRoot "drywalltoolbox/wp/wp-content/mu-plugins/dtb-integrations/bootstrap.php"

$required = @(
    "VeeqoInventoryProjectionServiceV3.php",
    "VeeqoRuntimePolicy.php",
    "VeeqoProductionConfiguration.php",
    "Services/VeeqoOperationStore.php",
    "Services/VeeqoAdminReadModel.php",
    "Rest/VeeqoAdminController.php",
    "Rest/VeeqoCompatibilityController.php",
    "Admin/VeeqoAdminPage.php",
    "assets/veeqo-admin.css",
    "assets/veeqo-admin.js"
)

$forbidden = @(
    "VeeqoInventoryProjectionService.php",
    "VeeqoInventoryProjectionServiceV2.php",
    "VeeqoInventoryAdminController.php",
    "VeeqoOperationsAdmin.php",
    "VeeqoLegacyAdminRegistrationGuard.php",
    "Infrastructure/VeeqoAdminCache.php",
    "Services/VeeqoAdminInventoryReadService.php",
    "Services/VeeqoAdminOrderReadService.php"
)

$failures = New-Object System.Collections.Generic.List[string]

foreach ($relative in $required) {
    $path = Join-Path $veeqoRoot $relative
    if (-not (Test-Path -LiteralPath $path -PathType Leaf)) {
        $failures.Add("Missing required Veeqo file: $relative")
    }
}

foreach ($relative in $forbidden) {
    $path = Join-Path $veeqoRoot $relative
    if (Test-Path -LiteralPath $path -PathType Leaf) {
        $failures.Add("Retired Veeqo file is still present: $relative")
    }
}

if (-not (Test-Path -LiteralPath $bootstrap -PathType Leaf)) {
    $failures.Add("Missing dtb-integrations bootstrap.php")
} else {
    $bootstrapText = Get-Content -LiteralPath $bootstrap -Raw
    foreach ($needle in @(
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
}

$runtimePolicy = Join-Path $veeqoRoot "VeeqoRuntimePolicy.php"
if (Test-Path -LiteralPath $runtimePolicy) {
    $policyText = Get-Content -LiteralPath $runtimePolicy -Raw
    foreach ($needle in @(
        "remove_action( 'rest_api_init', 'dtb_veeqo_register_routes', 10 )",
        "remove_action( 'woocommerce_update_product', 'dtb_veeqo_map_product_sku', 20 )",
        "remove_action( 'dtb_veeqo_inventory_sync', 'dtb_veeqo_run_inventory_pull' )",
        "dtb_veeqo_remove_persisted_credentials"
    )) {
        if (-not $policyText.Contains($needle)) {
            $failures.Add("Runtime policy is missing retirement/security guard: $needle")
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

$client = Join-Path $veeqoRoot "VeeqoClient.php"
if (Test-Path -LiteralPath $client) {
    $clientText = Get-Content -LiteralPath $client -Raw
    if (-not $clientText.Contains("function dtb_veeqo_request")) {
        $failures.Add("Veeqo compatibility client no longer provides the canonical API request helper")
    }
}

$php = Get-Command php -ErrorAction SilentlyContinue
if ($null -ne $php) {
    $phpFiles = @(
        $bootstrap,
        (Join-Path $veeqoRoot "VeeqoInventoryProjectionServiceV3.php"),
        (Join-Path $veeqoRoot "VeeqoRuntimePolicy.php"),
        (Join-Path $veeqoRoot "VeeqoProductionConfiguration.php"),
        (Join-Path $veeqoRoot "Services/VeeqoOperationStore.php"),
        (Join-Path $veeqoRoot "Services/VeeqoAdminReadModel.php"),
        (Join-Path $veeqoRoot "Rest/VeeqoAdminController.php"),
        (Join-Path $veeqoRoot "Rest/VeeqoCompatibilityController.php"),
        (Join-Path $veeqoRoot "Admin/VeeqoAdminPage.php")
    )
    foreach ($file in $phpFiles) {
        if (Test-Path -LiteralPath $file) {
            & $php.Source -l $file | Out-Host
            if ($LASTEXITCODE -ne 0) {
                $failures.Add("PHP syntax failed: $file")
            }
        }
    }
} else {
    Write-Warning "php is not available; PHP syntax validation was skipped."
}

$node = Get-Command node -ErrorAction SilentlyContinue
$adminJs = Join-Path $veeqoRoot "assets/veeqo-admin.js"
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
