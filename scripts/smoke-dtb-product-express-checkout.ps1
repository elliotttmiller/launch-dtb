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
$expressEntry = Read-RepositoryFile 'drywalltoolbox/wp/wp-content/themes/drywall-toolbox/assets/checkout/checkout-express-entry.js'
$checkoutUi = Read-RepositoryFile 'drywalltoolbox/wp/wp-content/themes/drywall-toolbox/assets/checkout/checkout-ui.js'
$checkoutCss = Read-RepositoryFile 'drywalltoolbox/wp/wp-content/themes/drywall-toolbox/assets/checkout/checkout.css'
$checkoutTemplate = Read-RepositoryFile 'drywalltoolbox/wp/wp-content/themes/drywall-toolbox/templates/checkout/native-checkout.php'
$shippingReadiness = Read-RepositoryFile 'drywalltoolbox/wp/wp-content/mu-plugins/dtb-commerce/Payment/ExpressCheckoutShippingReadiness.php'
$addressIntegrity = Read-RepositoryFile 'drywalltoolbox/wp/wp-content/mu-plugins/dtb-commerce/Payment/ExpressCheckoutAddressIntegrity.php'
$rateLimiter = Read-RepositoryFile 'drywalltoolbox/wp/wp-content/mu-plugins/dtb-platform/Security/StoreApiCheckoutRateLimiter.php'
$commerceBootstrap = Read-RepositoryFile 'drywalltoolbox/wp/wp-content/mu-plugins/dtb-commerce/bootstrap.php'

Assert-Contains $productPanel 'ProductExpressCheckout' 'The shared purchase panel must render the product express entry'
Assert-Contains $productPanel 'onExpressCheckout={onExpressCheckout}' 'The purchase panel must delegate the express action explicitly'
Assert-Contains $productDetail 'await addToCart(productToAdd, quantity)' 'The express action must mutate the authoritative Store API cart before navigation'
Assert-Contains $productDetail 'navigateDocument(getWooCheckoutUrl()' 'The express action must use a full-document native checkout handoff'
Assert-Contains $productExpress 'useCart' 'The product express entry must coordinate with global cart mutation state'
Assert-Contains $productExpress 'requestExpressCheckoutHandoff' 'The product express entry must create only a short-lived presentation handoff'
Assert-Contains $productExpress 'Apple Pay' 'The product surface must communicate eligible wallet methods without mounting them'
Assert-Contains $productExpress 'Google Pay' 'The product surface must communicate eligible wallet methods without mounting them'
Assert-Contains $productExpress 'Link' 'The product surface must communicate eligible wallet methods without mounting them'
Assert-NotContains $productExpress '@stripe/' 'The React product surface must not import Stripe Elements'
Assert-NotContains $productExpress 'ExpressCheckoutElement' 'The React product surface must not mount a second Express Checkout Element'
Assert-NotContains $productExpress 'PaymentIntent' 'The React product surface must not create payment authority'

Assert-Contains $capabilities 'expressCheckoutEnabled' 'Frontend readiness must require Express Checkout enablement'
Assert-Contains $capabilities 'expressCheckoutCheckoutLocation' 'Frontend readiness must require the checkout location'
Assert-Contains $capabilities 'walletShippingReady' 'Frontend readiness must include WooCommerce shipping readiness'
Assert-Contains $capabilities 'noCompetingWooPayments' 'Frontend readiness must reject a competing payment authority'

Assert-Contains $checkoutUrl 'dtb_express' 'The native checkout URL must carry bounded presentation metadata'
Assert-Contains $checkoutUrl 'EXPRESS_HANDOFF_TTL_MS' 'The express handoff must expire'
Assert-Contains $expressEntry 'providerSurfaceReady' 'Native checkout must wait for the provider-owned surface to be ready'
Assert-Contains $expressEntry 'dtb:checkout-express-entry-unavailable' 'Native checkout must fail open when the provider surface is unavailable'
Assert-NotContains $expressEntry 'confirmPayment' 'Theme presentation must not confirm payment'
Assert-NotContains $expressEntry 'createPaymentMethod' 'Theme presentation must not tokenize payment methods'

Assert-Contains $shippingReadiness 'wp_verify_nonce' 'Wallet shipping hardening must verify the official express nonce'
Assert-Contains $shippingReadiness 'dtb_commerce_invalidate_shipping_package_cache' 'Wallet address changes must invalidate stale shipping packages'
Assert-Contains $shippingReadiness 'stripe_express_checkout_shipping_rates_missing' 'Missing wallet shipping rates must be observable'
Assert-Contains $shippingReadiness 'stripe_express_checkout_shipping_rate_unselected' 'Unselected wallet shipping rates must be observable'
Assert-Contains $shippingReadiness 'stripe_express_checkout_total_invalid' 'Invalid wallet totals must be observable'
Assert-Contains $shippingReadiness 'wallet_shipping_ready' 'The public readiness response must include shipping readiness'
Assert-NotContains $shippingReadiness 'shipping_address' 'Shipping readiness diagnostics must not log raw address payloads'
Assert-Contains $addressIntegrity 'wc_stripe_express_checkout_normalize_address' 'Official Stripe address normalization must remain integrated'
Assert-Contains $addressIntegrity 'x-wcstripe-express-checkout-nonce' 'Address normalization must require the official express request context'
Assert-Contains $rateLimiter 'dtb_store_api_checkout_rate_limit_bypass_for_express_checkout' 'Verified wallet callbacks must not be converted into false rate-limit failures'
Assert-Contains $commerceBootstrap "ExpressCheckoutShippingReadiness.php" 'The shipping hardening module must be loaded by the commerce composition root'

Assert-Contains $checkoutTemplate 'checkout-express-entry.js' 'Native checkout must enqueue the express handoff presentation script'
Assert-Contains $checkoutTemplate 'checkout.css' 'Native checkout must enqueue the single authoritative checkout stylesheet'
Assert-Contains $checkoutCss '.wc-block-components-payment-methods' 'Payment methods must receive the cohesive card treatment'
Assert-Contains $checkoutCss '.wc-block-components-order-summary-item' 'Order summary rows must receive deterministic compact spacing'
Assert-Contains $checkoutCss '.wc-block-components-totals-footer-item' 'The grand total hierarchy must be explicitly styled'
Assert-NotContains $checkoutUi 'createProxyField' 'Checkout UI must not create duplicate identity fields'
Assert-NotContains $checkoutUi 'aria-hidden' 'Checkout UI must not hide provider-owned sections'
Assert-NotContains $checkoutCss 'confidence' 'The checkout styles must not retain confidence panel rules'

Write-Host 'PASS: Product express checkout architecture, wallet shipping integrity, and checkout presentation contracts are intact.'
