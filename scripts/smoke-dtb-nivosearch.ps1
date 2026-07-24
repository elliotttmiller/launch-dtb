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
$suggestionsPath = Join-Path $RepoRoot 'frontend/src/api/searchSuggestions.js'
$bridgePath = Join-Path $RepoRoot 'frontend/src/components/storefront/NivoSearchRuntimeBridge.jsx'
$headerPath = Join-Path $RepoRoot 'frontend/src/components/shell/Header.jsx'
$storefrontHeaderPath = Join-Path $RepoRoot 'frontend/src/components/storefront/StorefrontHeader.jsx'
$dockPath = Join-Path $RepoRoot 'frontend/src/components/storefront/StorefrontSearchDock.jsx'
$bridgeCssPath = Join-Path $RepoRoot 'frontend/src/styles/storefront-nivo-runtime-bridge.css'
$retiredPresentationPath = Join-Path $RepoRoot 'frontend/src/components/storefront/NivoSearchPresentation.jsx'

foreach ($path in @($controllerPath, $routesPath, $bootstrapPath, $clientPath, $suggestionsPath, $bridgePath, $headerPath, $storefrontHeaderPath, $dockPath, $bridgeCssPath)) {
    Assert-True (Test-Path $path) "Required NivoSearch integration file exists: $path"
}
Assert-True (-not (Test-Path $retiredPresentationPath)) 'Competing NivoSearch replacement presentation is retired.'

$controller = Get-Content $controllerPath -Raw
$routes = Get-Content $routesPath -Raw
$bootstrap = Get-Content $bootstrapPath -Raw
$client = Get-Content $clientPath -Raw
$suggestions = Get-Content $suggestionsPath -Raw
$bridge = Get-Content $bridgePath -Raw
$header = Get-Content $headerPath -Raw
$storefrontHeader = Get-Content $storefrontHeaderPath -Raw
$dock = Get-Content $dockPath -Raw
$bridgeCss = Get-Content $bridgeCssPath -Raw

Assert-True ($controller.Contains("private const PRESET_ID = 930;")) 'NivoSearch preset 930 is the configured search authority.'
Assert-True ($controller.Contains('/catalog/search/nivo-config')) 'Read-safe NivoSearch runtime config route is registered.'
Assert-True ($controller.Contains("wp_create_nonce( 'nivo_search_nonce' )")) 'Config route emits the nonce required by NivoSearch AJAX.'
Assert-True ($controller.Contains("Cache-Control', 'no-store")) 'Nonce-bearing runtime config is explicitly non-cacheable.'
Assert-True ($routes.Contains('DTB_NivoSearchConfigController::register_routes();')) 'Catalog route composition wires the NivoSearch config controller.'
Assert-True ($bootstrap.Contains('/Rest/NivoSearchConfigController.php')) 'Catalog bootstrap loads the NivoSearch config controller.'

Assert-True ($client.Contains("body.set('preset_id', String(config.presetId));")) 'Frontend sends the configured preset ID to NivoSearch.'
Assert-True ($client.Contains("body.set('nonce', String(config.nonce));")) 'Frontend sends the NivoSearch nonce.'
Assert-True ($client.Contains("credentials: 'include'")) 'NivoSearch browser requests preserve same-origin session semantics.'
Assert-True ($client.Contains("WC_AJAX::get_endpoint") -or $controller.Contains("WC_AJAX::get_endpoint( 'nivo_search' )")) 'Integration uses the WooCommerce AJAX endpoint owned by NivoSearch.'
Assert-True ($client.Contains('executeWithCorrection')) 'NivoSearch did-you-mean corrections are resolved once before an empty result is rendered.'
Assert-True ($client.Contains('inferCatalogCorrection')) 'Bounded catalog-term correction is available when the installed Nivo index emits no correction.'
Assert-True ($suggestions.Contains('editDistance')) 'Catalog typo fallback is explicit and bounded.'
Assert-True ($suggestions.Contains('FACETS_ENDPOINT')) 'Suggestion fallback is constrained to backend-owned catalog facets.'

Assert-True ($bridge.Contains('searchWithNivo')) 'Runtime bridge executes NivoSearch against the existing DTB inputs.'
Assert-True ($bridge.Contains('searchProducts')) 'DTB catalog product search remains graceful degradation/resolution only.'
Assert-True ($bridge.Contains('Suggestions')) 'Desktop/mobile result presentation includes Suggestions.'
Assert-True ($bridge.Contains('createPortal')) 'Only result content is portaled into existing DTB result containers.'
Assert-True ($header.Contains('<NivoSearchRuntimeBridge />')) 'Global storefront header mounts the headless Nivo runtime bridge.'
Assert-True (-not $header.Contains('NivoSearchPresentation')) 'Global header does not mount a competing Nivo search bar or overlay.'
Assert-True ($storefrontHeader.Contains('dtb-desktop-search--header')) 'Established DTB desktop expandable search remains the presentation owner.'
Assert-True ($dock.Contains('storefront-search-dock')) 'Established DTB mobile search dock remains the presentation owner.'
Assert-True ($bridgeCss.Contains('.dtb-nivo-runtime-owned > :not(.dtb-nivo-runtime-layer)')) 'Nivo results replace result content without replacing the search shell.'
Assert-True (-not $bridgeCss.Contains('backdrop-filter: blur')) 'Nivo runtime bridge does not introduce a competing blurred overlay.'

Write-Host 'NivoSearch storefront integration smoke checks passed.'
