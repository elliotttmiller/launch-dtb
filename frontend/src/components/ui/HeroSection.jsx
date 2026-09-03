/**
 * ui/HeroSection.jsx — Light split hero: text/CTA column + product image column
 */

import { Link } from 'react-router-dom';
import { m as Motion, useReducedMotion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import TrustedBrands from './TrustedBrands';
import HeroQuickLinks from './HeroQuickLinks';
import { useEditableComponent } from '../../designer/useEditableComponent.js';
import {
  reducedContentVariants,
  staggerContainerVariants,
  staggerItemVariants,
  dtbTransition,
  reducedTransition,
} from '../../motion/dtbMotion.js';

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
  const reduceMotion = useReducedMotion();
  const { rootProps, hidden, getValue, getColorVar } = useEditableComponent('home', 'hero-section');

  if (hidden) return null;

  const ctaVisible = getValue('cta_visible', true);
  const backgroundColor = getColorVar('background_color', '#f8fafc');
  const containerVariants = reduceMotion ? reducedContentVariants : staggerContainerVariants;
  const itemVariants = reduceMotion ? reducedContentVariants : staggerItemVariants;

  return (
    <section
      {...rootProps}
      className={`dtb-ui-hero${className ? ` ${className}` : ''}`}
      style={{ background: backgroundColor }}
    >
      <div className="dtb-ui-hero__split">
        <Motion.div
          className="dtb-ui-hero__content"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {titleLines && titleLines.length > 0 ? (
            <Motion.h1 className="dtb-ui-hero__title" variants={itemVariants}>
              {titleLines.map((line, li) => (
                <span key={li} style={{ display: 'block' }}>{line}</span>
              ))}
            </Motion.h1>
          ) : (
            <Motion.h1 className="dtb-ui-hero__title" variants={itemVariants}>{title}</Motion.h1>
          )}

          {subtitle && (
            <Motion.p className="dtb-ui-hero__subtitle" variants={itemVariants}>{subtitle}</Motion.p>
          )}

          {ctaVisible && ctaLinks.length > 0 && (
            <Motion.div variants={itemVariants} className="dtb-hero-cta-wrap">
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
            initial={{ opacity: 0, y: reduceMotion ? 0 : 8, scale: reduceMotion ? 1 : 0.998 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={reduceMotion ? reducedTransition : dtbTransition.emphasized}
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
