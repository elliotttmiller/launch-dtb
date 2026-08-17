/**
 * ui/HeroSection.jsx — Light split hero: text/CTA column + product image column
 */

import { Link } from 'react-router-dom';
import { m as Motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import TrustedBrands from './TrustedBrands';
import HeroQuickLinks from './HeroQuickLinks';
import { useEditableComponent } from '../../designer/useEditableComponent.js';

const container = { hidden: {}, visible: { transition: { staggerChildren: 0.09 } } };
const item = {
  hidden: { opacity: 0, y: 22 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] } },
};

export default function HeroSection({
  title,
  titleLines,
  subtitle,
  ctaLinks = [],
  brands = [],
  showCarousel = true,
  className = '',
  imageSrc,
  imageAlt = '',
}) {
  const { rootProps, hidden, getValue, getColorVar } = useEditableComponent('home', 'hero-section');

  if (hidden) return null;

  const ctaVisible = getValue('cta_visible', true);
  const backgroundColor = getColorVar('background_color', '#f8fafc');

  return (
    <section
      {...rootProps}
      className={`dtb-ui-hero${className ? ` ${className}` : ''}`}
      style={{ background: backgroundColor }}
    >
      <div className="dtb-ui-hero__split">
        <Motion.div
          className="dtb-ui-hero__content"
          variants={container}
          initial="hidden"
          animate="visible"
        >
          {titleLines && titleLines.length > 0 ? (
            <Motion.h1 className="dtb-ui-hero__title" variants={item}>
              {titleLines.map((line, li) => (
                <span key={li} style={{ display: 'block' }}>{line}</span>
              ))}
            </Motion.h1>
          ) : (
            <Motion.h1 className="dtb-ui-hero__title" variants={item}>{title}</Motion.h1>
          )}

          {subtitle && (
            <Motion.p className="dtb-ui-hero__subtitle" variants={item}>{subtitle}</Motion.p>
          )}

          {ctaVisible && ctaLinks.length > 0 && (
            <Motion.div variants={item} className="dtb-hero-cta-wrap">
              {ctaLinks.map(({ to, label }, i) => (
                <Link
                  key={to}
                  to={to}
                  className={`dtb-hero-cta dtb-hero-cta--geo dtb-hero-cta--${i === 0 ? 'primary' : 'ghost'}`}
                >
                  <span>{label}</span>
                  <ChevronRight size={16} aria-hidden="true" />
                </Link>
              ))}
            </Motion.div>
          )}
        </Motion.div>

        {imageSrc && (
          <Motion.div
            className="dtb-ui-hero__image-col"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            <img src={imageSrc} alt={imageAlt} loading="eager" fetchPriority="high" decoding="async" />
          </Motion.div>
        )}
      </div>

      {showCarousel && <HeroQuickLinks />}

      {brands.length > 0 && (
        <TrustedBrands brands={brands} title="Trusted by professionals. Powered by quality." speed={32} />
      )}
    </section>
  );
}
