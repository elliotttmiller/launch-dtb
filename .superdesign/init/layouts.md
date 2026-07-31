# Shared layouts

## Header shell

Path: `frontend/src/components/shell/Header.jsx`

The shell composes the optional home utility strip and the responsive storefront header.

```jsx
import { Phone } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import StorefrontHeader from '../storefront/StorefrontHeader';
import '../../styles/storefront-top-banner.css';
import '../../styles/storefront-nivo-vendor-suppression.css';

const STORE_PHONE_DISPLAY = '(609) 866-5269';
const STORE_PHONE_HREF = 'tel:+16098665269';

export default function Header(props) {
  const { pathname } = useLocation();
  const showHomeUtilityBar = pathname === '/';
  const hasTopTicker = Boolean(props.hasTopTicker || showHomeUtilityBar);

  return (
    <div className={`storefront-header-stack${showHomeUtilityBar ? ' storefront-header-stack--with-banner' : ''}`}>
      {showHomeUtilityBar ? (
        <div className="storefront-top-banner" role="region" aria-label="Store information">
          <div className="storefront-top-banner__inner">
            <span className="storefront-top-banner__spacer" aria-hidden="true" />
            <span className="storefront-top-banner__shipping">Free Shipping on Orders +$50</span>
            <div className="storefront-top-banner__utilities">
              <a className="storefront-top-banner__phone" href={STORE_PHONE_HREF} aria-label={`Call Drywall Toolbox at ${STORE_PHONE_DISPLAY}`}>
                <Phone size={13} strokeWidth={2} aria-hidden="true" />
                <span>{STORE_PHONE_DISPLAY}</span>
              </a>
              <Link className="storefront-top-banner__support" to="/contact">Support</Link>
            </div>
          </div>
        </div>
      ) : null}
      <StorefrontHeader {...props} hasTopTicker={hasTopTicker} />
    </div>
  );
}
```

## StorefrontHeader

Path: `frontend/src/components/storefront/StorefrontHeader.jsx`

Responsive global header. Desktop renders logo, `StorefrontDesktopNavigation`, Base UI catalog autocomplete, account control, and cart control. Mobile renders menu, logo, account, cart, and a full-width search field. The desktop render is the active branch at widths above 1024px.
