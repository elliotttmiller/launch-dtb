param(
    [string]$RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
)

$ErrorActionPreference = 'Stop'

function Assert-True {
    param(
        [bool]$Condition,
        [string]$Message
    )
    if (-not $Condition) {
        throw "ASSERTION FAILED: $Message"
    }
    Write-Host "PASS: $Message"
}

$controllerPath = Join-Path $RepoRoot 'drywalltoolbox/wp/wp-content/mu-plugins/dtb-catalog-platform/Rest/NivoSearchConfigController.php'
$routesPath = Join-Path $RepoRoot 'drywalltoolbox/wp/wp-content/mu-plugins/dtb-catalog-platform/Application/RegisterCatalogRoutes.php'
$bootstrapPath = Join-Path $RepoRoot 'drywalltoolbox/wp/wp-content/mu-plugins/dtb-catalog-platform/bootstrap.php'
$clientPath = Join-Path $RepoRoot 'frontend/src/api/nivoSearch.js'
$presentationPath = Join-Path $RepoRoot 'frontend/src/components/storefront/NivoSearchPresentation.jsx'
$headerPath = Join-Path $RepoRoot 'frontend/src/components/shell/Header.jsx'
$cssPath = Join-Path $RepoRoot 'frontend/src/styles/storefront-nivo-search.css'

foreach ($path in @($controllerPath, $routesPath, $bootstrapPath, $clientPath, $presentationPath, $headerPath, $cssPath)) {
    Assert-True (Test-Path $path) "Required NivoSearch integration file exists: $path"
}

$controller = Get-Content $controllerPath -Raw
$routes = Get-Content $routesPath -Raw
$bootstrap = Get-Content $bootstrapPath -Raw
$client = Get-Content $clientPath -Raw
$presentation = Get-Content $presentationPath -Raw
$header = Get-Content $headerPath -Raw
$css = Get-Content $cssPath -Raw

Assert-True ($controller.Contains("private const PRESET_ID = 930;")) 'NivoSearch preset 930 is the configured search authority.'
Assert-True ($controller.Contains("/catalog/search/nivo-config")) 'Read-safe NivoSearch runtime config route is registered.'
Assert-True ($controller.Contains("wp_create_nonce( 'nivo_search_nonce' )")) 'Config route emits the nonce required by NivoSearch AJAX.'
Assert-True ($controller.Contains("Cache-Control', 'no-store")) 'Nonce-bearing runtime config is explicitly non-cacheable.'
Assert-True ($routes.Contains('DTB_NivoSearchConfigController::register_routes();')) 'Catalog route composition wires the NivoSearch config controller.'
Assert-True ($bootstrap.Contains("/Rest/NivoSearchConfigController.php")) 'Catalog bootstrap loads the NivoSearch config controller.'

Assert-True ($client.Contains("body.set('preset_id', String(config.presetId));")) 'Frontend sends the configured preset ID to NivoSearch.'
Assert-True ($client.Contains("body.set('nonce', String(config.nonce));")) 'Frontend sends the NivoSearch nonce.'
Assert-True ($client.Contains("credentials: 'include'")) 'NivoSearch browser requests preserve same-origin session semantics.'
Assert-True ($client.Contains("wc-ajax") -or $controller.Contains("WC_AJAX::get_endpoint( 'nivo_search' )")) 'Integration uses the WooCommerce AJAX endpoint owned by NivoSearch.'

Assert-True ($presentation.Contains("searchWithNivo")) 'Desktop/mobile presentation executes NivoSearch.'
Assert-True ($presentation.Contains("searchProducts")) 'DTB catalog search remains a graceful fallback only.'
Assert-True ($presentation.Contains('Suggestions')) 'Desktop/mobile presentation includes the Suggestions surface.'
Assert-True ($presentation.Contains('createPortal')) 'Search presentation mounts into existing header search slots without replacing the header architecture.'
Assert-True ($header.Contains('<NivoSearchPresentation />')) 'Global storefront header mounts the NivoSearch presentation integration.'
Assert-True ($css.Contains('html.dtb-nivo-search-active .header-center--desktop-search > .dtb-desktop-search')) 'Legacy desktop live-search surface is suppressed while NivoSearch is mounted.'
Assert-True ($css.Contains('html.dtb-nivo-search-active .header-mobile-search-dock > .storefront-search-dock')) 'Legacy mobile live-search surface is suppressed while NivoSearch is mounted.'

Write-Host 'NivoSearch storefront integration smoke checks passed.'
