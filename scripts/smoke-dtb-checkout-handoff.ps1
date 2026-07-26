Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $PSScriptRoot
$handoffPath = Join-Path $repoRoot 'frontend/src/utils/checkoutHandoff.js'
$checkoutUrlPath = Join-Path $repoRoot 'frontend/src/utils/checkoutUrl.js'
$cartPath = Join-Path $repoRoot 'frontend/src/pages/Cart.jsx'
$sidebarPath = Join-Path $repoRoot 'frontend/src/components/shell/CartSidebar.jsx'

function Assert-True {
    param(
        [Parameter(Mandatory = $true)] [bool] $Condition,
        [Parameter(Mandatory = $true)] [string] $Message
    )

    if (-not $Condition) {
        throw $Message
    }
}

foreach ($path in @($handoffPath, $checkoutUrlPath, $cartPath, $sidebarPath)) {
    Assert-True (Test-Path -LiteralPath $path -PathType Leaf) "Required checkout handoff source file is missing: $path"
}

$handoff = Get-Content -LiteralPath $handoffPath -Raw
$checkoutUrl = Get-Content -LiteralPath $checkoutUrlPath -Raw
$cart = Get-Content -LiteralPath $cartPath -Raw
$sidebar = Get-Content -LiteralPath $sidebarPath -Raw

Assert-True ($checkoutUrl.Contains("return buildCheckoutUrl('/checkout/');")) 'Canonical checkout URL must remain the public /checkout/ route.'
Assert-True ($checkoutUrl.Contains("return buildCheckoutUrl('/wp/index.php?pagename=checkout');")) 'Supported WordPress front-controller fallback must remain available.'
Assert-True ($handoff.Contains("credentials: 'include'")) 'Checkout probe must include the browser WooCommerce session cookies.'
Assert-True ($handoff.Contains("cache: 'no-store'")) 'Checkout probe must bypass cached checkout/cart responses.'
Assert-True ($handoff.Contains('DTB_CHECKOUT_HANDOFF_REJECTED')) 'Confirmed checkout-to-cart loops must produce an explicit typed error.'
Assert-True ($handoff.Contains('isCartDestination')) 'Checkout handoff must detect cart redirects.'
Assert-True ($handoff.Contains('getWooCheckoutFallbackUrl')) 'Checkout handoff must use only the centralized supported fallback URL.'
Assert-True (-not $handoff.Contains('Cart-Token')) 'Native checkout handoff must not introduce a second Cart-Token authority.'
Assert-True ($cart.Contains('resolveWooCheckoutHandoffUrl')) 'Full cart checkout must resolve the verified native destination.'
Assert-True ($sidebar.Contains('resolveWooCheckoutHandoffUrl')) 'Cart drawer checkout must resolve the verified native destination.'
Assert-True ($cart.Contains("aria-busy={checkoutPending ? 'true' : undefined}")) 'Full cart checkout must expose pending state accessibly.'
Assert-True ($sidebar.Contains("anchor.setAttribute('aria-busy', 'true')")) 'Cart drawer checkout must expose pending state accessibly.'
Assert-True (-not $cart.Contains("navigateDocument(getWooCheckoutUrl()")) 'Full cart must not navigate before the checkout route is verified.'
Assert-True (-not $sidebar.Contains("navigateDocument(getWooCheckoutUrl()")) 'Cart drawer must not navigate before the checkout route is verified.'

Write-Host 'DTB checkout handoff static smoke checks passed.' -ForegroundColor Green
