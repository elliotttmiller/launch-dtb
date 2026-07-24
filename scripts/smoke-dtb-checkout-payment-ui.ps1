Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $PSScriptRoot
$theme = Join-Path $repoRoot 'drywalltoolbox/wp/wp-content/themes/drywall-toolbox'
$runtimeContextPath = Join-Path $theme 'assets/checkout/checkout-runtime-context.css'
$flowPath = Join-Path $theme 'assets/checkout/checkout-flow.css'
$uiPath = Join-Path $theme 'assets/checkout/checkout-ui.js'

function Assert-True {
    param(
        [Parameter(Mandatory = $true)] [bool] $Condition,
        [Parameter(Mandatory = $true)] [string] $Message
    )
    if (-not $Condition) { throw $Message }
}

foreach ($path in @($runtimeContextPath, $flowPath, $uiPath)) {
    Assert-True (Test-Path -LiteralPath $path -PathType Leaf) "Required checkout payment source file is missing: $path"
}

$runtimeContext = Get-Content -LiteralPath $runtimeContextPath -Raw
$flow = Get-Content -LiteralPath $flowPath -Raw
$ui = Get-Content -LiteralPath $uiPath -Raw

Assert-True ($runtimeContext.Contains('.wc-block-components-payment-method-content')) 'Payment runtime contract must explicitly normalize the Woo payment content wrapper.'
Assert-True ($runtimeContext.Contains('.wc-stripe-upe-element')) 'Payment runtime contract must explicitly preserve the official Stripe UPE mount.'
Assert-True ($runtimeContext.Contains('pointer-events: auto !important')) 'Provider payment surfaces must remain interactive.'
Assert-True ($runtimeContext.Contains('overflow: visible !important')) 'Provider payment surfaces must not be clipped by DTB wrappers.'
Assert-True ($runtimeContext.Contains('body.dtb-checkout-step-payment.dtb-official-stripe-checkout .dtb-mobile-checkout-actions')) 'DTB fixed navigation must be removed from the active Payment step.'
Assert-True ($runtimeContext.Contains('display: none !important')) 'Payment-step DTB navigation shell must not overlay provider/payment controls.'
Assert-True (-not ($runtimeContext -match 'iframe\s+[.#\[]')) 'DTB payment CSS must never style descendants inside provider iframes.'
Assert-True ($flow.Contains('[data-dtb-checkout-step="payment"].is-dtb-checkout-step-inactive')) 'Inactive Payment must remain mounted for provider initialization.'
Assert-True (-not $ui.Contains('cloneNode(')) 'Checkout UI must never clone payment controls.'
Assert-True (-not $ui.Contains('replaceWith(')) 'Checkout UI must never replace payment controls.'
Assert-True (-not $ui.Contains('paymentSheet')) 'Checkout UI must not restore the retired custom payment sheet.'
Assert-True ($ui.Contains("id: 'payment'")) 'Progressive checkout must retain one Payment step.'

Write-Host 'DTB checkout payment interaction static smoke checks passed.' -ForegroundColor Green
