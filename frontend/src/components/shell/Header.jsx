import { Hammer, MapPin, PackageCheck, RotateCcw, Truck } from 'lucide-react';
import StorefrontHeader from '../storefront/StorefrontHeader';
import '../../styles/storefront-top-banner.css';
import '../../styles/storefront-nivo-vendor-suppression.css';

export default function Header(props) {
  return (
    <div className="storefront-header-stack storefront-header-stack--with-banner">
      <div className="storefront-top-banner" role="region" aria-label="Store information">
        <div className="storefront-top-banner__inner">
          <div className="storefront-top-banner__group">
            <span><Hammer aria-hidden="true" />Professional Drywall Tools, Parts &amp; Accessories</span>
            <span><PackageCheck aria-hidden="true" />Built for Pros. Backed by Experience.</span>
          </div>
          <div className="storefront-top-banner__group storefront-top-banner__group--right">
            <span><Truck aria-hidden="true" />Fast Shipping</span>
            <span><RotateCcw aria-hidden="true" />90-Day Returns</span>
            <span><MapPin aria-hidden="true" />Expert Support</span>
          </div>
        </div>
      </div>
      <StorefrontHeader {...props} hasTopTicker />
    </div>
  );
}
