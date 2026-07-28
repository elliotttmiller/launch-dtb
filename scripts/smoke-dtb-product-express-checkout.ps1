Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$RepositoryRoot = Split-Path -Parent $PSScriptRoot

function Read-RepositoryFile {
    param([Parameter(Mandatory = $true)][string]$RelativePath)
    $Path = Join-Path $RepositoryRoot $RelativePath
    if (-not (Test-Path -LiteralPath $Path -PathType Leaf)) {
        throw "Required repository file is missing: $RelativePath"
    }
    return Get-Content -LiteralPath $Path -Raw
}

function Assert-Contains {
    param(
        [Parameter(Mandatory = $true)][string]$Content,
        [Parameter(Mandatory = $true)][string]$Needle,
        [Parameter(Mandatory = $true)][string]$Description
    )
    if (-not $Content.Contains($Needle)) {
        throw "Contract failure: $Description. Missing: $Needle"
    }
}

function Assert-NotContains {
    param(
        [Parameter(Mandatory = $true)][string]$Content,
        [Parameter(Mandatory = $true)][string]$Needle,
        [Parameter(Mandatory = $true)][string]$Description
    )
    if ($Content.Contains($Needle)) {
        throw "Contract failure: $Description. Forbidden: $Needle"
    }
}

$productPanel = Read-RepositoryFile 'frontend/src/components/product/ProductPurchasePanel.jsx'
$productExpress = Read-RepositoryFile 'frontend/src/components/product/ProductExpressCheckout.jsx'
$productDetail = Read-RepositoryFile 'frontend/src/components/product/ProductDetail.jsx'
$capabilities = Read-RepositoryFile 'frontend/src/api/checkoutCapabilities.js'
$checkoutUrl = Read-RepositoryFile 'frontend/src/utils/checkoutUrl.js'
$checkoutTemplate = Read-RepositoryFile 'drywalltoolbox/wp/wp-content/themes/drywall-toolbox/templates/checkout/native-checkout.php'
$provider = Read-RepositoryFile 'drywalltoolbox/wp/wp-content/mu-plugins/dtb-commerce/Payment/PaymentPluginsStripeNativeCheckout.php'
$rateLimiter = Read-RepositoryFile 'drywalltoolbox/wp/wp-content/mu-plugins/dtb-platform/Security/StoreApiCheckoutRateLimiter.php'
$commerceBootstrap = Read-RepositoryFile 'drywalltoolbox/wp/wp-content/mu-plugins/dtb-commerce/bootstrap.php'

Assert-Contains $productPanel 'ProductExpressCheckout' 'The shared purchase panel must render the product express entry'
Assert-Contains $productPanel 'onExpressCheckout={onExpressCheckout}' 'The purchase panel must delegate the express action explicitly'
Assert-Contains $productDetail 'await addToCart(productToAdd, quantity)' 'The express action must mutate the authoritative Store API cart before navigation'
Assert-Contains $productDetail 'navigateDocument(getWooCheckoutUrl()' 'The express action must use a full-document native checkout handoff'
Assert-Contains $productExpress 'useCart' 'The product express entry must coordinate with global cart mutation state'
Assert-NotContains $productExpress 'requestExpressCheckoutHandoff' 'The product entry must not select or focus a payment surface'
Assert-NotContains $productExpress 'Apple Pay' 'The product surface must not advertise an unverified wallet'
Assert-NotContains $productExpress 'Google Pay' 'The product surface must not advertise an unverified wallet'
Assert-NotContains $productExpress "'Link'" 'Link must not be advertised as an approved product express method'
Assert-NotContains $productExpress '@stripe/' 'The React product surface must not import Stripe Elements'
Assert-NotContains $productExpress 'ExpressCheckoutElement' 'The React product surface must not mount a second Express Checkout Element'
Assert-NotContains $productExpress 'PaymentIntent' 'The React product surface must not create payment authority'

Assert-Contains $capabilities "provider === 'payment_plugins_stripe'" 'Frontend readiness must verify the replacement provider'
Assert-Contains $capabilities "gateway?.id === 'stripe_upm'" 'Frontend readiness must verify the Universal Payment Method gateway'
Assert-Contains $capabilities 'upmConfigurationReady' 'Frontend readiness must require a selected UPM configuration'
Assert-Contains $capabilities 'walletShippingReady' 'Frontend readiness must include WooCommerce shipping readiness'
Assert-Contains $capabilities 'noCompetingOfficialStripe' 'Frontend readiness must reject the retired Stripe extension'
Assert-Contains $capabilities 'noCompetingWooPayments' 'Frontend readiness must reject WooPayments as a competing authority'

Assert-NotContains $checkoutUrl 'dtb_express' 'The native checkout URL must not carry a payment-method preference'
Assert-NotContains $checkoutUrl 'EXPRESS_HANDOFF_TTL_MS' 'The retired express handoff must remain removed'
Assert-Contains $provider "'stripe_upm'" 'The provider adapter must recognize UPM by verified gateway ID'
Assert-NotContains $provider 'wc_stripe_express_payment_methods' 'Standalone Express Checkout filtering must remain retired'
Assert-NotContains $provider 'wc_stripe_get_element_options' 'Neutral checkout must not inject Stripe Elements appearance overrides'
Assert-Contains $provider 'payment-plugins-stripe-v1' 'New checkout orders must use the replacement provider contract'
Assert-Contains $provider 'payment_plugins_stripe' 'Paid evidence must identify the replacement provider'
Assert-NotContains $provider 'x-wcstripe-express-checkout' 'The adapter must not guess retired provider browser headers'
Assert-NotContains $rateLimiter 'x-wcstripe-express-checkout' 'The Store API limiter must not trust retired provider browser headers'
Assert-Contains $commerceBootstrap 'PaymentPluginsStripeNativeCheckout.php' 'The replacement provider adapter must be loaded by the commerce composition root'
Assert-NotContains $commerceBootstrap 'ExpressCheckoutAddressIntegrity.php' 'The retired official Stripe address shim must not be loaded'
Assert-NotContains $commerceBootstrap 'ExpressCheckoutShippingReadiness.php' 'The retired official Stripe shipping shim must not be loaded'

Assert-Contains $checkoutTemplate 'the_content();' 'Native checkout must render the provider-owned Checkout Block'
Assert-NotContains $checkoutTemplate 'wp_enqueue_style' 'Native checkout must not load a DTB presentation stylesheet'
Assert-NotContains $checkoutTemplate 'wp_enqueue_script' 'Native checkout must not load a DTB presentation controller'

Write-Host 'PASS: Product express handoff, replacement Stripe provider authority, and neutral checkout baseline contracts are intact.'
