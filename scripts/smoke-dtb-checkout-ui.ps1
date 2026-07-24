Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $PSScriptRoot
$commerce = Join-Path $repoRoot 'drywalltoolbox/wp/wp-content/mu-plugins/dtb-commerce'
$platform = Join-Path $repoRoot 'drywalltoolbox/wp/wp-content/mu-plugins/dtb-platform'
$theme = Join-Path $repoRoot 'drywalltoolbox/wp/wp-content/themes/drywall-toolbox'
$frontend = Join-Path $repoRoot 'frontend'

function Assert-True {
    param([bool] $Condition, [string] $Message)
    if (-not $Condition) { throw $Message }
}
function Read-RequiredText {
    param([string] $Path)
    Assert-True (Test-Path -LiteralPath $Path -PathType Leaf) "Required checkout source file is missing: $Path"
    return Get-Content -LiteralPath $Path -Raw
}

$templatePath = Join-Path $theme 'templates/checkout/native-checkout.php'
$uiPath = Join-Path $theme 'assets/checkout/checkout-ui.js'
$contactCssPath = Join-Path $theme 'assets/checkout/checkout-contact-identity.css'
$flowPath = Join-Path $theme 'assets/checkout/checkout-flow.css'
$runtimeContextPath = Join-Path $theme 'assets/checkout/checkout-runtime-context.css'
$refinementsPath = Join-Path $theme 'assets/checkout/checkout-refinements.css'
$officialStripePath = Join-Path $commerce 'Payment/OfficialStripeNativeCheckout.php'
$nativeRuntimePath = Join-Path $commerce 'Payment/WooNativeCheckoutRuntime.php'
$nativeIdentityPath = Join-Path $platform 'Auth/NativeCheckoutIdentityBridge.php'
$loginPath = Join-Path $frontend 'src/pages/Login.jsx'

$template = Read-RequiredText $templatePath
$ui = Read-RequiredText $uiPath
$contactCss = Read-RequiredText $contactCssPath
$flow = Read-RequiredText $flowPath
$runtimeContext = Read-RequiredText $runtimeContextPath
$refinements = Read-RequiredText $refinementsPath
$officialStripe = Read-RequiredText $officialStripePath
$nativeRuntime = Read-RequiredText $nativeRuntimePath
$nativeIdentity = Read-RequiredText $nativeIdentityPath
$login = Read-RequiredText $loginPath

$retiredPaths = @(
    (Join-Path $commerce 'Payment/MobilePaymentSheet.php'),
    (Join-Path $commerce 'assets/woo-native-checkout-payment-sheet.js'),
    (Join-Path $commerce 'assets/woo-native-checkout-payment-sheet.css'),
    (Join-Path $commerce 'assets/woo-native-checkout.css'),
    (Join-Path $commerce 'assets/woo-native-checkout-ui.js'),
    (Join-Path $commerce 'assets/woo-native-checkout-steps.js'),
    (Join-Path $commerce 'Templates/WooNativeCheckoutPage.php'),
    (Join-Path $theme 'assets/checkout/checkout-payment-sheet.js'),
    (Join-Path $theme 'assets/checkout/checkout-payment-sheet.css'),
    (Join-Path $theme 'assets/checkout/checkout-profile.js'),
    (Join-Path $theme 'assets/checkout/checkout-profile.css'),
    (Join-Path $theme 'assets/checkout/checkout-contact-identity.js')
)
foreach ($path in $retiredPaths) {
    Assert-True (-not (Test-Path -LiteralPath $path)) "Retired/competing checkout artifact must remain deleted: $path"
}

Assert-True ($nativeRuntime.Contains("locate_template( 'templates/checkout/native-checkout.php'")) 'Native checkout runtime must delegate presentation to the active theme.'
Assert-True ($template.Contains("'dtb-checkout-theme-ui'")) 'Theme checkout template must enqueue one consolidated checkout UI controller.'
Assert-True (-not $template.Contains('checkout-contact-identity.js')) 'Contact identity behavior must not be split into a second controller.'
Assert-True ($template.Contains('the_content();')) 'Theme checkout template must render the assigned Woo Checkout page.'

foreach ($requiredStep in @("id: 'contact'", "id: 'shipping'", "id: 'payment'")) {
    Assert-True ($ui.Contains($requiredStep)) "Missing mobile checkout step contract: $requiredStep"
}
Assert-True ($ui.Contains("'Continue to shipping'")) 'Contact step must expose Continue to shipping.'
Assert-True ($ui.Contains("'Continue to payment'")) 'Shipping step must expose Continue to payment.'
Assert-True ($ui.Contains('function goNext()')) 'Mobile checkout must have one explicit forward-navigation owner.'
Assert-True ($ui.Contains("next.addEventListener( 'click'")) 'Forward CTA must have a direct click listener.'
Assert-True ($ui.Contains("back.addEventListener( 'click'")) 'Back CTA must have a direct click listener.'
Assert-True ($ui.Contains('function ensureContactProxy()')) 'Consolidated controller must render visible canonical contact proxies.'
Assert-True ($ui.Contains("id: 'dtb-contact-first-name'")) 'Mobile Contact must include First name.'
Assert-True ($ui.Contains("id: 'dtb-contact-last-name'")) 'Mobile Contact must include Last name.'
Assert-True ($ui.Contains("id: 'dtb-contact-phone'")) 'Mobile Contact must include optional Phone.'
Assert-True ($ui.Contains('function validateContact()')) 'Contact progression must validate visible contact controls only.'
Assert-True ($ui.Contains('function validateShipping()')) 'Shipping progression must validate shipping readiness.'
Assert-True ($ui.Contains('getHasCalculatedShipping')) 'Shipping readiness must come from Woo cart state.'
Assert-True ($ui.Contains("activeStep === 1 && commerceBusy()")) 'Only Shipping progression may be blocked by Woo background recalculation.'
Assert-True ($ui.Contains('data-dtb-checkout-live-context')) 'Order summary must retain live shipping/tax context.'
Assert-True ($ui.Contains('totals.total_tax')) 'Order summary context must read authoritative Woo tax totals.'
Assert-True ($ui.Contains('totals.total_shipping')) 'Order summary context must read authoritative Woo shipping totals.'
Assert-True (-not $ui.Contains('paymentSheet')) 'Checkout UI must not implement a custom payment sheet.'
Assert-True (-not $ui.Contains('cloneNode(')) 'Checkout UI must not clone provider controls.'
Assert-True (-not $ui.Contains('replaceWith(')) 'Checkout UI must not replace provider controls.'

Assert-True ($contactCss.Contains('.dtb-contact-proxy-grid')) 'Contact proxy presentation CSS must remain available.'
Assert-True ($flow.Contains('[data-dtb-checkout-step="payment"].is-dtb-checkout-step-inactive')) 'Inactive payment surface must remain mounted/measurable.'
Assert-True ($flow.Contains('touch-action: manipulation')) 'Mobile controls must retain responsive touch semantics.'
Assert-True ($runtimeContext.Contains('pointer-events: auto !important')) 'Mobile action shell must remain tappable on Safari/iOS.'
Assert-True ($refinements.Contains('.wc-block-components-express-payment__content')) 'Express Checkout wrapper normalization must remain.'
Assert-True (-not ($refinements -match 'iframe\s+[.#\[]')) 'Theme CSS must not target descendants inside provider iframes.'

Assert-True ($nativeIdentity.Contains('static $resolving = false')) 'Native identity bridge must retain recursion protection.'
Assert-True (-not $nativeIdentity.Contains('discard_woocommerce_session_for_identity_conflict')) 'determine_current_user must not initialize/destroy Woo sessions.'
Assert-True ($nativeIdentity.Contains('dtb_native_checkout_expire_woocommerce_browser_state')) 'Identity conflicts must use side-effect-light browser-state containment.'
Assert-True ($login.Contains('navigateDocument(getWooCheckoutUrl()')) 'Checkout login return must use a full-document Woo checkout handoff.'

Assert-True ($officialStripe.Contains("'wc_stripe_upe_params'")) 'Official Stripe integration must remain authoritative.'
Assert-True ($officialStripe.Contains("'blocksAppearance'")) 'Stripe Appearance must use the provider-supported configuration path.'

Write-Host 'DTB checkout UI/session static smoke checks passed.' -ForegroundColor Green
