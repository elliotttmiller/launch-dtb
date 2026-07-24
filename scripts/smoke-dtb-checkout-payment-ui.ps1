Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $PSScriptRoot
$theme = Join-Path $repoRoot 'drywalltoolbox/wp/wp-content/themes/drywall-toolbox'
$templatePath = Join-Path $theme 'templates/checkout/native-checkout.php'
$runtimeContextPath = Join-Path $theme 'assets/checkout/checkout-runtime-context.css'
$paymentCssPath = Join-Path $theme 'assets/checkout/checkout-payment-interaction.css'
$paymentRuntimePath = Join-Path $theme 'assets/checkout/checkout-payment-runtime.js'
$flowPath = Join-Path $theme 'assets/checkout/checkout-flow.css'
$uiPath = Join-Path $theme 'assets/checkout/checkout-ui.js'

function Assert-True {
    param(
        [Parameter(Mandatory = $true)] [bool] $Condition,
        [Parameter(Mandatory = $true)] [string] $Message
    )
    if (-not $Condition) { throw $Message }
}

foreach ($path in @($templatePath, $runtimeContextPath, $paymentCssPath, $paymentRuntimePath, $flowPath, $uiPath)) {
    Assert-True (Test-Path -LiteralPath $path -PathType Leaf) "Required checkout payment source file is missing: $path"
}

$template = Get-Content -LiteralPath $templatePath -Raw
$runtimeContext = Get-Content -LiteralPath $runtimeContextPath -Raw
$paymentCss = Get-Content -LiteralPath $paymentCssPath -Raw
$paymentRuntime = Get-Content -LiteralPath $paymentRuntimePath -Raw
$flow = Get-Content -LiteralPath $flowPath -Raw
$ui = Get-Content -LiteralPath $uiPath -Raw

Assert-True ($template.Contains("'dtb-checkout-theme-payment-interaction'")) 'Checkout template must load the final payment interaction stylesheet.'
Assert-True ($template.Contains("'dtb-checkout-theme-payment-runtime'")) 'Checkout template must load the narrow payment runtime after the main UI controller.'
Assert-True ($runtimeContext.Contains('.wc-block-components-payment-method-content')) 'Payment runtime context must normalize the Woo payment content wrapper.'
Assert-True ($paymentCss.Contains('.wc-stripe-upe-element')) 'Final payment layer must preserve the official Stripe UPE mount.'
Assert-True ($paymentCss.Contains('pointer-events: auto !important')) 'Provider payment surfaces must remain interactive.'
Assert-True ($paymentCss.Contains('overflow: visible !important')) 'Provider payment surfaces must not be clipped by DTB wrappers.'
Assert-True ($paymentCss.Contains('body.dtb-checkout-step-payment.dtb-official-stripe-checkout .dtb-mobile-checkout-actions')) 'DTB fixed navigation must be removed from the active Payment step.'
Assert-True ($paymentCss.Contains('is-dtb-single-gateway')) 'Single official gateway shell must be normalized without replacing Stripe payment methods.'
Assert-True ($paymentRuntime.Contains('classifySingleGateway')) 'Payment runtime must classify the redundant Woo single-gateway shell.'
Assert-True ($paymentRuntime.Contains("actionBar.hidden = true")) 'Payment runtime must mechanically remove the fixed DTB navigation overlay on Payment.'
Assert-True ($paymentRuntime.Contains("paymentRoot.removeAttribute( 'inert' )")) 'Payment runtime must remove accidental same-origin inert state from the active provider mount.'
Assert-True (-not ($paymentCss -match 'iframe\s+[.#\[]')) 'DTB payment CSS must never style descendants inside provider iframes.'
Assert-True (-not $paymentRuntime.Contains('contentWindow')) 'Payment runtime must never inspect or mutate provider iframe contents.'
Assert-True (-not $paymentRuntime.Contains('postMessage')) 'Payment runtime must not synthesize provider payment interactions.'
Assert-True ($flow.Contains('[data-dtb-checkout-step="payment"].is-dtb-checkout-step-inactive')) 'Inactive Payment must remain mounted for provider initialization.'
Assert-True (-not $ui.Contains('cloneNode(')) 'Checkout UI must never clone payment controls.'
Assert-True (-not $ui.Contains('replaceWith(')) 'Checkout UI must never replace payment controls.'
Assert-True (-not $ui.Contains('paymentSheet')) 'Checkout UI must not restore the retired custom payment sheet.'
Assert-True ($ui.Contains("id: 'payment'")) 'Progressive checkout must retain one Payment step.'

Write-Host 'DTB checkout payment interaction static smoke checks passed.' -ForegroundColor Green
