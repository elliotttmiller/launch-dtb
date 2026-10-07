import TrustedBrands from '../ui/TrustedBrands.jsx';

export default function HomeHeroBrands({ brands = [] }) {
  return (
    <TrustedBrands
      brands={brands}
      title="Trusted by professionals. Powered by quality."
      speed={34}
      className="dtb-ui-trusted-brands--home"
    />
  );
}
