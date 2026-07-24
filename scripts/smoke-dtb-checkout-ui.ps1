Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $PSScriptRoot
$commerce = Join-Path $repoRoot 'drywalltoolbox/wp/wp-content/mu-plugins/dtb-commerce'
$platform = Join-Path $repoRoot 'drywalltoolbox/wp/wp-content/mu-plugins/dtb-platform'
$theme = Join-Path $repoRoot 'drywalltoolbox/wp/wp-content/themes/drywall-toolbox'
$frontend = Join-Path $repoRoot 'frontend'
$wpConfigSamplePath = Join-Path $repoRoot 'drywalltoolbox/wp/wp-config-sample.php'

function Assert-True {
    param(
        [Parameter(Mandatory = $true)] [bool] $Condition,
        [Parameter(Mandatory = $true)] [string] $Message
    )
    if (-not $Condition) { throw $Message }
}

function Read-RequiredText {
    param([Parameter(Mandatory = $true)] [string] $Path)
    Assert-True (Test-Path -LiteralPath $Path -PathType Leaf) "Required checkout source file is missing: $Path"
    return Get-Content -LiteralPath $Path -Raw
}

$bootstrapPath = Join-Path $commerce 'bootstrap.php'
$performancePath = Join-Path $commerce 'assets/woo-native-checkout-performance.js'
$runtimeIntegrityPath = Join-Path $commerce 'Payment/CheckoutRuntimeIntegrity.php'
$nativeRuntimePath = Join-Path $commerce 'Payment/WooNativeCheckoutRuntime.php'
$officialStripePath = Join-Path $commerce 'Payment/OfficialStripeNativeCheckout.php'
$fieldPolicyPath = Join-Path $commerce 'Validation/CheckoutFieldPolicy.php'
$authHardeningPath = Join-Path $platform 'Auth/AuthCookieRuntimeHardening.php'
$sessionServicePath = Join-Path $platform 'Auth/SessionService.php'
$nativeIdentityPath = Join-Path $platform 'Auth/NativeCheckoutIdentityBridge.php'
$templatePath = Join-Path $theme 'templates/checkout/native-checkout.php'
$uiPath = Join-Path $theme 'assets/checkout/checkout-ui.js'
$cssPath = Join-Path $theme 'assets/checkout/checkout.css'
$refinementsPath = Join-Path $theme 'assets/checkout/checkout-refinements.css'
$flowPath = Join-Path $theme 'assets/checkout/checkout-flow.css'
$runtimeContextPath = Join-Path $theme 'assets/checkout/checkout-runtime-context.css'
$loginPath = Join-Path $frontend 'src/pages/Login.jsx'
$registerPath = Join-Path $frontend 'src/pages/Register.jsx'
$useAuthPath = Join-Path $frontend 'src/auth/useAuth.js'
$cartContextPath = Join-Path $frontend 'src/context/CartContext.jsx'

$bootstrap = Read-RequiredText $bootstrapPath
$performance = Read-RequiredText $performancePath
$runtimeIntegrity = Read-RequiredText $runtimeIntegrityPath
$nativeRuntime = Read-RequiredText $nativeRuntimePath
$officialStripe = Read-RequiredText $officialStripePath
$fieldPolicy = Read-RequiredText $fieldPolicyPath
$authHardening = Read-RequiredText $authHardeningPath
$sessionService = Read-RequiredText $sessionServicePath
$nativeIdentity = Read-RequiredText $nativeIdentityPath
$template = Read-RequiredText $templatePath
$ui = Read-RequiredText $uiPath
$css = Read-RequiredText $cssPath
$refinements = Read-RequiredText $refinementsPath
$flow = Read-RequiredText $flowPath
$runtimeContext = Read-RequiredText $runtimeContextPath
$login = Read-RequiredText $loginPath
$register = Read-RequiredText $registerPath
$useAuth = Read-RequiredText $useAuthPath
$cartContext = Read-RequiredText $cartContextPath
$wpConfigSample = Read-RequiredText $wpConfigSamplePath

$retiredPaths = @(
    (Join-Path $commerce 'Payment/MobilePaymentSheet.php'),
    (Join-Path $commerce 'assets/woo-native-checkout-payment-sheet.js'),
    (Join-Path $commerce 'assets/woo-native-checkout-payment-sheet.css'),
    (Join-Path $commerce 'assets/woo-native-checkout-profile-refinements.js'),
    (Join-Path $commerce 'assets/woo-native-checkout-profile-refinements.css'),
    (Join-Path $commerce 'assets/woo-native-checkout.css'),
    (Join-Path $commerce 'assets/woo-native-checkout-refinements.css'),
    (Join-Path $commerce 'assets/woo-native-checkout-ui.js'),
    (Join-Path $commerce 'assets/woo-native-checkout-steps.js'),
    (Join-Path $commerce 'Templates/WooNativeCheckoutPage.php'),
    (Join-Path $theme 'assets/checkout/checkout-payment-sheet.js'),
    (Join-Path $theme 'assets/checkout/checkout-payment-sheet.css'),
    (Join-Path $theme 'assets/checkout/checkout-profile.js'),
    (Join-Path $theme 'assets/checkout/checkout-profile.css')
)
foreach ($retiredPath in $retiredPaths) {
    Assert-True (-not (Test-Path -LiteralPath $retiredPath)) "Retired/competing checkout artifact must remain deleted: $retiredPath"
}

Assert-True (-not $bootstrap.Contains('MobilePaymentSheet.php')) 'dtb-commerce bootstrap must not load a retired payment sheet.'
Assert-True (-not $officialStripe.Contains('enqueue_checkout_assets')) 'Official Stripe integration must not own checkout presentation assets.'
Assert-True (-not $fieldPolicy.Contains('wp_enqueue_style')) 'Checkout field policy must not own presentation CSS.'
Assert-True ($nativeRuntime.Contains("locate_template( 'templates/checkout/native-checkout.php'")) 'Native checkout runtime must delegate document presentation to the active theme.'
Assert-True ($nativeRuntime.Contains("remove_action( 'wp_enqueue_scripts', 'dtb_enqueue_react_app', 10 )")) 'Native checkout must disable React asset ownership on the checkout document.'
Assert-True ($nativeRuntime.Contains("remove_action( 'wp_enqueue_scripts', 'dtb_dequeue_non_react_assets', 9999 )")) 'Native checkout must preserve Woo/WP/Stripe assets from the headless theme stripper.'

Assert-True ($wpConfigSample.Contains("define( 'WP_HOME',    'https://elliottm4.sg-host.com' );")) 'Tracked redacted config must preserve the public root WP_HOME contract.'
Assert-True ($wpConfigSample.Contains("define( 'WP_SITEURL', 'https://elliottm4.sg-host.com/wp' );")) 'Tracked redacted config must preserve WordPress core under /wp.'
foreach ($rootCookieConstant in @("define( 'COOKIEPATH', '/' );", "define( 'SITECOOKIEPATH', '/' );", "define( 'ADMIN_COOKIE_PATH', '/' );")) {
    Assert-True ($wpConfigSample.Contains($rootCookieConstant)) "Native auth cookies must remain valid across the public root checkout/API aliases: $rootCookieConstant"
}

Assert-True ($template.Contains("'dtb-checkout-theme'")) 'Theme checkout template must enqueue the authoritative base checkout stylesheet.'
Assert-True ($template.Contains("'dtb-checkout-theme-refinements'")) 'Theme checkout template must enqueue same-origin wrapper refinements.'
Assert-True ($template.Contains("'dtb-checkout-theme-flow'")) 'Theme checkout template must enqueue responsive inline checkout flow styles.'
Assert-True ($template.Contains("'dtb-checkout-theme-runtime-context'")) 'Theme checkout template must enqueue the final live-context/touch layer after checkout flow.'
Assert-True ($template.Contains("[ 'dtb-checkout-theme-boot', 'wp-data', 'wc-blocks-data-store' ]")) 'Checkout UI must load after the official Woo block data store and wp.data dependencies.'
Assert-True ($template.Contains("'dtb-checkout-theme-ui'")) 'Theme checkout template must enqueue the presentation controller.'
Assert-True (-not $template.Contains('checkout-payment-sheet')) 'Theme checkout template must not enqueue a mobile payment sheet.'
Assert-True (-not $template.Contains('checkout-profile')) 'Theme checkout template must not enqueue the retired competing profile presentation layer.'
Assert-True ($template.Contains('the_content();')) 'Theme checkout template must delegate checkout rendering to the assigned Woo Checkout page.'

foreach ($requiredStep in @("id: 'contact'", "id: 'shipping'", "id: 'payment'")) {
    Assert-True ($ui.Contains($requiredStep)) "Mobile checkout UI is missing required step contract: $requiredStep"
}
Assert-True ($ui.Contains("'Continue to shipping'")) 'Mobile checkout UI must expose Contact -> Shipping navigation.'
Assert-True ($ui.Contains("'Continue to payment'")) 'Mobile checkout UI must expose Shipping -> Payment navigation.'
Assert-True ($ui.Contains("function goToNextStep()")) 'Mobile checkout must have one explicit forward-navigation owner.'
Assert-True ($ui.Contains("next.addEventListener( 'click'")) 'Mobile checkout forward CTA must bind directly to the rendered button.'
Assert-True ($ui.Contains("back.addEventListener( 'click'")) 'Mobile checkout Back CTA must bind directly to the rendered button.'
Assert-True ($ui.Contains("button.addEventListener( 'click'")) 'Mobile progress controls must bind directly to their rendered buttons.'
Assert-True (-not $ui.Contains('handleDocumentClick')) 'Checkout step navigation must not depend on a global delegated click interceptor.'
Assert-True ($ui.Contains('blockSelectors')) 'Step ownership must prefer stable Woo Checkout inner-block wrappers instead of broad internal implementation selectors.'
Assert-True ($ui.Contains('validateVisibleStepInputs')) 'Forward mobile navigation must surface invalid visible fields before hiding the current Woo section.'
Assert-True ($ui.Contains('shippingStepIsReady')) 'Shipping -> Payment navigation must wait for Woo shipping calculation readiness.'
Assert-True ($ui.Contains('getHasCalculatedShipping')) 'Shipping readiness must be read from WooCommerce cart state, not inferred from presentation text.'
Assert-True ($ui.Contains("callSelector( checkoutStore, 'isCalculating'")) 'Navigation must respect Woo checkout recalculation state.'
Assert-True ($ui.Contains('syncContactIdentityFields')) 'Theme controller must preserve contact-to-canonical-address synchronization.'
Assert-True ($ui.Contains('nativeInputsForField( field )')) 'Contact mirroring must resolve current Woo address inputs after Checkout Block rerenders.'
Assert-True ($ui.Contains('window.wp?.data')) 'Live checkout context must read the registered Woo block data stores through wp.data.'
Assert-True ($ui.Contains('getCartTotals')) 'Live checkout context must use authoritative Woo cart totals.'
Assert-True ($ui.Contains('getCustomerData')) 'Live checkout context must use authoritative Woo customer/shipping context.'
Assert-True ($ui.Contains('data-dtb-checkout-live-context')) 'Order summary must include one DTB read-only live shipping/tax context mount.'
Assert-True ($ui.Contains("totals.total_shipping")) 'Live order summary must track authoritative shipping totals.'
Assert-True ($ui.Contains("totals.total_tax")) 'Live order summary must track authoritative tax totals.'
Assert-True (-not $ui.Contains('paymentSheet')) 'Theme checkout UI must not implement payment-sheet state.'
Assert-True (-not $ui.Contains('openPaymentSheet')) 'Theme checkout UI must not open a custom payment sheet.'
Assert-True (-not $ui.Contains('cloneNode(')) 'Checkout presentation must not clone Woo/Stripe controls.'
Assert-True (-not $ui.Contains('replaceWith(')) 'Checkout presentation must not replace Woo/Stripe controls.'
Assert-True (-not $ui.Contains('appendChild( payment')) 'Checkout presentation must not reparent payment controls.'
Assert-True ($ui.Contains('is-dtb-single-gateway')) 'Single-gateway presentation marker must be applied by the active theme controller.'

Assert-True ($refinements.Contains('.wc-block-components-express-payment__content')) 'Theme refinements must normalize the Express Checkout outer wrapper.'
Assert-True ($refinements.Contains(':not(button):not(iframe)')) 'Theme refinements must flatten wallet wrappers without applying generic resets to provider controls.'
Assert-True ($refinements.Contains('.checkout-order-summary-block-fill-wrapper')) 'Theme refinements must flatten Woo responsive order-summary fill wrappers.'
Assert-True ($refinements.Contains('.wp-block-woocommerce-checkout-order-summary-block')) 'Theme refinements must normalize the Woo order-summary shell.'
Assert-True ($refinements.Contains('.wc-block-components-order-summary-item__individual-prices')) 'Mobile order summary must suppress duplicate per-item pricing beneath the product name.'
Assert-True ($refinements.Contains('grid-template-areas: "image description total"')) 'Mobile order summary must use the cart-drawer-like image/product/line-total row hierarchy.'
Assert-True ($refinements.Contains('.dtb-native-identity-field')) 'Theme refinements must hide synchronized native identity duplicates only after classification.'
Assert-True (-not ($refinements -match 'iframe\s+[.#\[]')) 'Theme refinements must not target descendants inside provider iframes.'

Assert-True ($flow.Contains('[data-dtb-checkout-step="payment"].is-dtb-checkout-step-inactive')) 'Mobile flow must keep the inactive provider payment surface mounted/measurable.'
Assert-True ($flow.Contains('.dtb-mobile-checkout-progress')) 'Theme flow stylesheet must include the three-step progress UI.'
Assert-True ($flow.Contains('.dtb-mobile-checkout-actions')) 'Theme flow stylesheet must include non-submit mobile navigation controls.'
Assert-True ($flow.Contains('touch-action: manipulation')) 'Mobile checkout controls must use responsive touch interaction semantics.'
Assert-True ($flow.Contains('top: auto !important')) 'Theme flow must reset legacy sticky progress positioning.'
Assert-True ($flow.Contains('content: none !important')) 'Theme flow must suppress legacy duplicate progress chevrons.'
Assert-True (-not $flow.Contains('dtb-payment-sheet')) 'Theme flow stylesheet must not restore payment-sheet selectors.'
Assert-True ($runtimeContext.Contains('.dtb-checkout-live-context')) 'Final runtime-context stylesheet must style the live shipping/tax summary context.'
Assert-True ($runtimeContext.Contains('pointer-events: auto !important')) 'Final mobile action shell must remain directly tappable on iOS/Safari.'
Assert-True ($runtimeContext.Contains('.dtb-mobile-checkout-actions__status')) 'Mobile navigation must expose visible calculation/validation status.'
Assert-True (-not ($runtimeContext -match 'iframe\s+[.#\[]')) 'Runtime-context styling must never target descendants inside provider iframes.'

Assert-True ($login.Contains('navigateDocument(getWooCheckoutUrl()')) 'Checkout login return must use a full-document handoff directly to native Woo checkout.'
Assert-True ($login.Contains('isCheckoutReturnTarget')) 'Login return handling must distinguish the native checkout transaction surface from SPA routes.'
Assert-True ($login.Contains('nativeCheckoutReady !== true')) 'Checkout login return must fail closed unless native checkout auth convergence was confirmed.'
Assert-True ($register.Contains('navigateDocument(getWooCheckoutUrl()')) 'Checkout registration return must use a full-document handoff directly to native Woo checkout.'
Assert-True ($register.Contains('nativeCheckoutReady !== true')) 'Checkout registration return must fail closed unless native checkout auth convergence was confirmed.'
Assert-True ($authHardening.Contains('wp_validate_auth_cookie')) 'Native customer-cookie convergence must validate the cookie instead of trusting cookie presence.'
Assert-True ($authHardening.Contains('wp_set_auth_cookie')) 'Same-origin customer storefront auth must establish native WordPress auth for Woo checkout compatibility.'
Assert-True ($authHardening.Contains("wp_set_auth_cookie( (int) `$user->ID, false")) 'Native customer compatibility cookies must be session-scoped, not a second persistent storefront auth authority.'
Assert-True (-not $authHardening.Contains("do_action( 'wp_login'")) 'DTB must not manually replay the wp_login lifecycle; Woo owns native session migration during session initialization.'
Assert-True (-not $authHardening.Contains('dtb_auth_refresh_cookie_from_response')) 'Auth hardening must not regenerate or overwrite the dtb_auth JWT owned by AuthRoutes.'
Assert-True ($authHardening.Contains('identity_conflict_contained')) 'Auth handoff must expose redacted identity-conflict containment diagnostics.'
Assert-True ($authHardening.Contains('blocked_native_privileged_conflict')) 'Storefront auth must fail closed rather than clear/replace a privileged native WordPress session.'
Assert-True ($sessionService.Contains('discard_woocommerce_session_for_identity_conflict')) 'Identity mismatch handling must discard, not transfer, Woo customer session/cart state.'
Assert-True (-not $sessionService.Contains("function_exists( 'get_current_user_id' )")) 'Identity-conflict cleanup may run during determine_current_user and must not recursively resolve the current user.'
Assert-True ($sessionService.Contains("user_can( `$current_user, 'manage_options' )")) 'Storefront logout must not rotate/destroy a privileged native WordPress session.'
Assert-True ($nativeIdentity.Contains('discard_woocommerce_session_for_identity_conflict')) 'Native checkout must fail closed on conflicting customer identities without cross-customer cart transfer.'
Assert-True ($nativeIdentity.Contains("wp_set_auth_cookie( `$resolved, false")) 'Direct native checkout self-healing must use a session-scoped compatibility cookie.'
Assert-True ($nativeIdentity.Contains('native_checkout_privileged_identity_conflict_blocked')) 'Native checkout must preserve and report privileged native identity conflicts instead of replacing them.'
Assert-True ($nativeIdentity.Contains('dtb_native_checkout_clear_stale_customer_cookie')) 'Native checkout must clear stale non-privileged compatibility auth when no valid DTB session exists.'
Assert-True (-not $nativeIdentity.Contains('dtb_security_log(')) 'determine_current_user bridge must not call a logger that recursively resolves the current user.'
Assert-True ($nativeIdentity.Contains('dtb_native_checkout_log_security_event')) 'Native checkout identity conflicts must retain redacted recursion-safe observability.'
Assert-True ($useAuth.Contains('nativeCheckoutReady')) 'Frontend auth must retain non-secret native checkout handoff readiness returned by the server.'
Assert-True ($useAuth.Contains(".catch(() => null)")) 'Cross-tab auth reconciliation must contain failed async validation/logout promises.'
Assert-True ($cartContext.Contains("window.addEventListener('dtb:auth-changed'")) 'Cart state must reconcile after login/logout identity transitions.'
Assert-True ($cartContext.Contains('mutationQueueRef.current')) 'Auth-driven cart reconciliation must serialize with cart mutations.'
Assert-True ($cartContext.Contains('return refreshCart();')) 'Auth-driven cart reconciliation must refresh Woo Store API cart and nonce state.'

Assert-True ($runtimeIntegrity.Contains("'dtb-checkout-theme-ui'")) 'Runtime integrity must recognize the theme-owned checkout UI handle.'
Assert-True (-not $runtimeIntegrity.Contains('dtb-checkout-theme-profile')) 'Runtime integrity must not retain the retired theme profile handle.'
Assert-True (-not $runtimeIntegrity.Contains('dtb-woo-native-checkout-ui')) 'Runtime integrity must not retain the retired MU presentation handle.'
Assert-True ($performance.Contains("document.body.classList.contains( 'dtb-checkout-step-payment' )")) 'Checkout telemetry must arm provider timeout monitoring from the inline Payment step.'
Assert-True (-not $performance.Contains('dtb-payment-sheet-open')) 'Checkout telemetry must not depend on retired payment-sheet state.'

Assert-True ($officialStripe.Contains("'wc_stripe_upe_params'")) 'Official Stripe integration must continue using the supported gateway Appearance filter.'
Assert-True ($officialStripe.Contains("'blocksAppearance'")) 'Official Stripe integration must continue using provider-supported Appearance configuration.'
Assert-True ($officialStripe -match "'theme'\s*=>\s*'stripe'") 'Stripe Appearance theme must match the unified checkout design contract.'

Assert-True ($css.Contains('.wc-block-components-express-payment')) 'Base theme checkout stylesheet must retain Express Checkout presentation support.'

Write-Host 'DTB checkout presentation/session/live-context static smoke checks passed.' -ForegroundColor Green
