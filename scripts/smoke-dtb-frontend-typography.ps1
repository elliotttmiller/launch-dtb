Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $PSScriptRoot
$frontend = Join-Path $repoRoot 'frontend'
$theme = Join-Path $repoRoot 'drywalltoolbox/wp/wp-content/themes/drywall-toolbox'
$commerce = Join-Path $repoRoot 'drywalltoolbox/wp/wp-content/mu-plugins/dtb-commerce'

$paths = [ordered]@{
    Main = Join-Path $frontend 'src/main.jsx'
    Typography = Join-Path $frontend 'src/styles/global-typography.css'
    FrontendDocument = Join-Path $frontend 'index.html'
    Tailwind = Join-Path $frontend 'tailwind.config.js'
    ErrorDocument = Join-Path $frontend 'error-page.html'
    ErrorStyles = Join-Path $frontend 'public/errors/error.css'
    ThemeDocument = Join-Path $theme 'index.php'
    CheckoutTemplate = Join-Path $theme 'templates/checkout/native-checkout.php'
    StripeAppearance = Join-Path $commerce 'Payment/OfficialStripeNativeCheckout.php'
}

function Assert-True {
    param(
        [Parameter(Mandatory = $true)] [bool] $Condition,
        [Parameter(Mandatory = $true)] [string] $Message
    )
    if (-not $Condition) { throw $Message }
}

foreach ($entry in $paths.GetEnumerator()) {
    Assert-True (Test-Path -LiteralPath $entry.Value -PathType Leaf) "Required typography source file is missing: $($entry.Value)"
}

$content = @{}
foreach ($entry in $paths.GetEnumerator()) {
    $content[$entry.Key] = Get-Content -LiteralPath $entry.Value -Raw
}

Assert-True ($content.Main.Contains("import './styles/global-typography.css'")) 'React bootstrap must load the global typography authority.'
Assert-True ($content.Main.LastIndexOf("global-typography.css") -gt $content.Main.LastIndexOf("mobile-ui-polish.css")) 'Global typography must be imported after route/component presentation styles.'
Assert-True ($content.Typography.Contains('--dtb-font-sans: "Nunito"')) 'Global typography must define Nunito as the customer-facing font.'
Assert-True ($content.Typography.Contains('body *')) 'Global typography must cover all customer-facing React descendants.'
Assert-True ($content.Typography.Contains('--font-mono: var(--dtb-font-sans)')) 'Legacy code/SKU typography aliases must resolve to Nunito.'
Assert-True ($content.FrontendDocument.Contains('family=Nunito:wght@300..900')) 'Webpack storefront document must load Nunito from Google Fonts.'
Assert-True (-not $content.FrontendDocument.Contains('family=Geist')) 'Webpack storefront document must not load Geist.'
Assert-True (-not $content.FrontendDocument.Contains('JetBrains+Mono')) 'Webpack storefront document must not load a second customer-facing font family.'
Assert-True ($content.Tailwind.Contains("sans: ['Nunito'")) 'Tailwind sans utilities must resolve to Nunito.'
Assert-True ($content.ErrorDocument.Contains('family=Nunito:wght@300..900')) 'Standalone error documents must load Nunito.'
Assert-True ($content.ErrorStyles.Contains('font-family: "Nunito"')) 'Standalone error styles must use Nunito.'
Assert-True ($content.ThemeDocument.Contains('family=Nunito:wght@300..900')) 'WordPress storefront shell must load Nunito.'
Assert-True ($content.CheckoutTemplate.Contains("'dtb-customer-font-nunito'")) 'Native checkout must enqueue Nunito independently of the React document.'
Assert-True ($content.CheckoutTemplate.Contains('wp_add_inline_style')) 'Native checkout must attach its final typography authority to the checkout style stack.'
Assert-True ($content.StripeAppearance.Contains("'fontFamily'           => 'Nunito")) 'Stripe Appearance must use Nunito inside provider-hosted payment fields.'
Assert-True ($content.StripeAppearance.Contains("STRIPE_APPEARANCE_VERSION = '2026.07.26.1'")) 'Stripe Appearance version must be incremented for the Nunito rollout.'

Write-Host 'DTB customer-facing Nunito typography static smoke checks passed.' -ForegroundColor Green
