Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $PSScriptRoot
$theme = Join-Path $repoRoot 'drywalltoolbox/wp/wp-content/themes/drywall-toolbox'
$commerce = Join-Path $repoRoot 'drywalltoolbox/wp/wp-content/mu-plugins/dtb-commerce'

function Assert-True {
    param(
        [Parameter(Mandatory = $true)] [bool] $Condition,
        [Parameter(Mandatory = $true)] [string] $Message
    )
    if (-not $Condition) { throw $Message }
}

function Read-RequiredText {
    param([Parameter(Mandatory = $true)] [string] $Path)
    Assert-True (Test-Path -LiteralPath $Path -PathType Leaf) "Required source file is missing: $Path"
    return Get-Content -LiteralPath $Path -Raw
}

$template = Read-RequiredText (Join-Path $theme 'templates/checkout/native-checkout.php')
$ui = Read-RequiredText (Join-Path $theme 'assets/checkout/checkout-ui.js')
$contactCss = Read-RequiredText (Join-Path $theme 'assets/checkout/checkout-contact-identity.css')
$fieldPolicy = Read-RequiredText (Join-Path $commerce 'Validation/CheckoutFieldPolicy.php')

$retiredBridge = Join-Path $theme 'assets/checkout/checkout-contact-identity.js'
Assert-True (-not (Test-Path -LiteralPath $retiredBridge)) 'Retired duplicate checkout-contact-identity.js controller must remain deleted.'

Assert-True ($template.Contains("'dtb-checkout-theme-ui'")) 'Native checkout must load the consolidated checkout UI controller.'
Assert-True (-not $template.Contains('checkout-contact-identity.js')) 'Native checkout must not load a second contact identity controller.'

foreach ($field in @('first_name', 'last_name', 'phone')) {
    Assert-True ($ui.Contains("key: '$field'")) "Mobile contact proxy is missing canonical field: $field"
}
Assert-True ($ui.Contains('function ensureContactProxy()')) 'Consolidated controller must own contact proxy rendering.'
Assert-True ($ui.Contains('data-dtb-canonical-contact-key')) 'Contact controls must be presentation proxies over canonical Woo properties.'
Assert-True ($ui.Contains('setNativeValue')) 'Contact proxy changes must propagate through canonical Woo inputs/events.'
Assert-True ($ui.Contains('getCustomerData')) 'Contact proxies must hydrate from authoritative Woo customer state.'
Assert-True ($ui.Contains("activeStep === 1 && commerceBusy()")) 'Only Shipping may be blocked by Woo recalculation; Contact progression must remain responsive.'
Assert-True ($ui.Contains("next.addEventListener( 'click'")) 'Contact/Shipping Continue control must retain a direct click handler.'
Assert-True ($ui.Contains('function validateContact()')) 'Contact progression must validate visible contact controls only.'
Assert-True (-not $ui.Contains('woocommerce_register_additional_checkout_field')) 'Theme controller must never register checkout business fields.'
Assert-True (-not $ui.Contains('paymentSheet')) 'Checkout controller must not introduce payment-sheet state.'
Assert-True (-not $ui.Contains('cloneNode(')) 'Checkout controller must not clone Woo/Stripe controls.'
Assert-True (-not $ui.Contains('replaceWith(')) 'Checkout controller must not replace Woo/Stripe controls.'

Assert-True ($contactCss.Contains('.dtb-contact-proxy-grid')) 'Contact identity stylesheet must style the restored mobile field group.'
Assert-True ($contactCss.Contains('.dtb-contact-proxy-field')) 'Contact identity stylesheet must style individual canonical proxy controls.'
Assert-True (-not ($contactCss -match 'iframe\s+[.#\[]')) 'Contact identity styling must never target provider iframe descendants.'

Assert-True (-not $fieldPolicy.Contains('woocommerce_register_additional_checkout_field')) 'Backend must not restore duplicate DTB required identity fields.'
Assert-True (-not $fieldPolicy.Contains('dtb-checkout/contact-first-name')) 'Backend must not restore retired duplicate first-name authority.'
Assert-True (-not $fieldPolicy.Contains('dtb-checkout/contact-last-name')) 'Backend must not restore retired duplicate last-name authority.'

Write-Host 'DTB mobile contact identity static smoke checks passed.' -ForegroundColor Green
