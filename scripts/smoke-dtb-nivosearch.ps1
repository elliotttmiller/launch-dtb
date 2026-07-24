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
$headerPath = Join-Path $RepoRoot 'frontend/src/components/shell/Header.jsx'
$storefrontHeaderPath = Join-Path $RepoRoot 'frontend/src/components/storefront/StorefrontHeader.jsx'
$overlayPath = Join-Path $RepoRoot 'frontend/src/components/storefront/StorefrontSearchOverlay.jsx'
$dockPath = Join-Path $RepoRoot 'frontend/src/components/storefront/StorefrontSearchDock.jsx'
$resultCssPath = Join-Path $RepoRoot 'frontend/src/styles/storefront-nivo-runtime-bridge.css'
$vendorCssPath = Join-Path $RepoRoot 'frontend/src/styles/storefront-nivo-vendor-suppression.css'
$retiredBridgePath = Join-Path $RepoRoot 'frontend/src/components/storefront/NivoSearchRuntimeBridge.jsx'
$retiredPresentationPath = Join-Path $RepoRoot 'frontend/src/components/storefront/NivoSearchPresentation.jsx'

foreach ($path in @($controllerPath, $routesPath, $bootstrapPath, $clientPath, $suggestionsPath, $headerPath, $storefrontHeaderPath, $overlayPath, $dockPath, $resultCssPath, $vendorCssPath)) {
    Assert-True (Test-Path $path) "Required NivoSearch integration file exists: $path"
}
Assert-True (-not (Test-Path $retiredBridgePath)) 'Parallel NivoSearch runtime bridge is retired.'
Assert-True (-not (Test-Path $retiredPresentationPath)) 'Competing NivoSearch replacement presentation is retired.'

$controller = Get-Content $controllerPath -Raw
$routes = Get-Content $routesPath -Raw
$bootstrap = Get-Content $bootstrapPath -Raw
$client = Get-Content $clientPath -Raw
$suggestions = Get-Content $suggestionsPath -Raw
$header = Get-Content $headerPath -Raw
$storefrontHeader = Get-Content $storefrontHeaderPath -Raw
$overlay = Get-Content $overlayPath -Raw
$dock = Get-Content $dockPath -Raw
$resultCss = Get-Content $resultCssPath -Raw
$vendorCss = Get-Content $vendorCssPath -Raw

Assert-True ($controller.Contains("private const PRESET_ID = 930;")) 'NivoSearch preset 930 is the configured search authority.'
Assert-True ($controller.Contains('/catalog/search/nivo-config')) 'Read-safe NivoSearch runtime config route is registered.'
Assert-True ($controller.Contains("wp_create_nonce( 'nivo_search_nonce' )")) 'Config route emits the nonce required by NivoSearch AJAX.'
Assert-True ($controller.Contains("Cache-Control', 'no-store")) 'Nonce-bearing runtime config is explicitly non-cacheable.'
Assert-True ($routes.Contains('DTB_NivoSearchConfigController::register_routes();')) 'Catalog route composition wires the NivoSearch config controller.'
Assert-True ($bootstrap.Contains('/Rest/NivoSearchConfigController.php')) 'Catalog bootstrap loads the NivoSearch config controller.'

Assert-True ($client.Contains("body.set('preset_id', String(config.presetId));")) 'Frontend sends the configured preset ID to NivoSearch.'
Assert-True ($client.Contains("body.set('nonce', String(config.nonce));")) 'Frontend sends the NivoSearch nonce.'
Assert-True ($client.Contains("credentials: 'include'")) 'NivoSearch browser requests preserve same-origin session semantics.'
Assert-True ($controller.Contains("WC_AJAX::get_endpoint( 'nivo_search' )")) 'Integration uses the WooCommerce AJAX endpoint owned by NivoSearch.'
Assert-True ($client.Contains('executeWithCorrection')) 'NivoSearch correction is resolved within the single search client lifecycle.'
Assert-True ($client.Contains('inferCatalogCorrection')) 'Bounded catalog-term correction is available when Nivo emits no correction.'
Assert-True ($client.Contains('stock_status')) 'Nivo product normalization supports native DTB product presentation.'
Assert-True ($suggestions.Contains('closestDistance')) 'Catalog typo fallback compares full labels and significant tokens.'
Assert-True ($suggestions.Contains('FACETS_ENDPOINT')) 'Suggestion fallback is constrained to backend-owned catalog facets.'

Assert-True ($storefrontHeader.Contains("import { searchWithNivo } from '../../api/nivoSearch.js';")) 'StorefrontHeader directly owns NivoSearch execution.'
Assert-True ($storefrontHeader.Contains('desktopSearchAbortRef')) 'Desktop search owns explicit abortable request lifecycle.'
Assert-True ($storefrontHeader.Contains('mobileSearchAbortRef')) 'Mobile search owns explicit abortable request lifecycle.'
Assert-True ($storefrontHeader.Contains('setDesktopSearchSuggestions')) 'Desktop search owns Suggestions state.'
Assert-True ($storefrontHeader.Contains('setMobileSearchSuggestions')) 'Mobile search owns Suggestions state.'
Assert-True ($storefrontHeader.Contains('searchWithNivo(query')) 'StorefrontHeader executes Nivo within its established debounced effects.'
Assert-True ($storefrontHeader.Contains("console.warn('[search] NivoSearch unavailable; using DTB catalog fallback.'")) 'DTB product search is failure fallback, not a parallel primary request.'
Assert-True ($storefrontHeader.Contains('dtb-desktop-search--header')) 'Established DTB desktop expandable search remains the presentation owner.'
Assert-True ($dock.Contains('storefront-search-dock')) 'Established DTB mobile search dock remains the presentation owner.'
Assert-True ($overlay.Contains('termSuggestions')) 'Mobile overlay distinguishes query suggestions from product results.'
Assert-True ($overlay.Contains('onSuggestionSelect')) 'Mobile suggestions feed the existing controlled DTB search input.'
Assert-True (-not $header.Contains('NivoSearchRuntimeBridge')) 'Global header no longer mounts a parallel Nivo runtime bridge.'
Assert-True (-not $header.Contains('NivoSearchPresentation')) 'Global header does not mount a competing Nivo search bar or overlay.'
Assert-True ($resultCss.Contains('.dtb-nivo-runtime__suggestions')) 'DTB result styling includes the Suggestions presentation.'
Assert-True ($vendorCss.Contains('.nivo-mobile-overlay')) 'Vendor Nivo mobile presentation remains explicitly suppressed.'
Assert-True (-not $storefrontHeader.Contains('createPortal')) 'Search results render directly from StorefrontHeader state without portal bridge ownership.'

Write-Host 'NivoSearch storefront integration smoke checks passed.'
