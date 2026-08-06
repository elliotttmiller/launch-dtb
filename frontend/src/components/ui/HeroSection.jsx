/**
 * ui/HeroSection.jsx — Full-width dark centered hero
 */

import React, { memo } from 'react';
import { Link } from 'react-router-dom';
import { motion as Motion } from 'framer-motion';
import TrustedBrands from './TrustedBrands';
import NavigationCarousel from './NavigationCarousel';
import { useEditableComponent } from '../../designer/useEditableComponent.js';

const HERO_TITLE_AURORA_COLORS = [
  '#ffffff',
  '#e9eef6',
  '#ffffff',
  '#d8e0ec',
  '#bac5d4',
  '#ffffff',
  '#e6ebf3',
  '#ffffff',
];

// Static gradient text — chrome/silver shimmer without a continuous animation loop
const AuroraText = memo(function AuroraText({ children, className = '' }) {
  const gradientStyle = {
    backgroundImage: `linear-gradient(110deg, ${HERO_TITLE_AURORA_COLORS.join(', ')}, ${HERO_TITLE_AURORA_COLORS[0]})`,
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  };
  return (
    <span className={`dtb-aurora-text ${className}`}>
      <span className="dtb-sr-only">{children}</span>
      <span className="dtb-aurora-text__visible" style={gradientStyle} aria-hidden="true">
        {children}
      </span>
    </span>
  );
});

const container = { hidden: {}, visible: { transition: { staggerChildren: 0.09 } } };
const item = {
  hidden: { opacity: 0, y: 22 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] } },
};

// Animate the whole title as one unit — visually identical to per-char but with
// a single Motion element instead of 30+, saving significant render overhead.
function GradientTitle({ lines }) {
  return (
    <Motion.h1
      className="dtb-hero-title-gradient"
      variants={item}
      style={{
        margin: '0 0 var(--dtb-space-4)',
        fontSize: 'clamp(1.85rem, 5.5vw, 4.25rem)',
        fontWeight: 800,
        lineHeight: 1.07,
        letterSpacing: '-0.03em',
      }}
    >
      {lines.map((line, li) => (
        <span key={li} style={{ display: 'block' }}>
          <AuroraText>{line}</AuroraText>
        </span>
      ))}
    </Motion.h1>
  );
}

export default function HeroSection({
  title,
  titleLines,
  subtitle,
  ctaLinks = [],
  brands = [],
  showCarousel = true,
  className = '',
}) {
  const { rootProps, hidden, getValue, getColorVar } = useEditableComponent('home', 'hero-section');

  if (hidden) return null;

  const contentAlign = getValue('content_align', 'center');
  const ctaVisible = getValue('cta_visible', true);

  return (
    <section
      {...rootProps}
      className={`dtb-ui-hero${className ? ` ${className}` : ''}`}
      style={{
        position: 'relative',
        width: '100%',
        minHeight: `${getValue('min_height', 520)}px`,
        overflow: 'hidden',
        background: getColorVar('background_color', '#070d1c'),
        color: '#fff',
        display: 'flex',
        flexDirection: 'column',
        alignItems: contentAlign === 'left' ? 'flex-start' : contentAlign === 'right' ? 'flex-end' : 'center',
        justifyContent: 'center',
      }}
    >
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'radial-gradient(circle at 50% 0%, rgba(29,78,216,0.32) 0%, transparent 55%)' }} />
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'radial-gradient(circle at 50% 110%, rgba(56,189,248,0.13) 0%, transparent 55%)' }} />

      <Motion.div
        className="dtb-ui-hero__content"
        variants={container}
        initial="hidden"
        animate="visible"
        style={{
          position: 'relative',
          zIndex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          padding: 'clamp(2.75rem, 5.5vw, 4.25rem) clamp(1.25rem, 5vw, 3rem) clamp(0.75rem, 1.7vw, 1.25rem)',
          maxWidth: '860px',
          margin: '0 auto',
          width: '100%',
        }}
      >
        {titleLines && titleLines.length > 0 ? (
          <GradientTitle lines={titleLines} />
        ) : (
          <Motion.h1
            className="dtb-hero-title-gradient"
            variants={item}
            style={{
              margin: '0 0 var(--dtb-space-4)',
              fontSize: 'clamp(1.85rem, 5.5vw, 4.25rem)',
              fontWeight: 800,
              lineHeight: 1.07,
              letterSpacing: '-0.03em',
            }}
          >
            <AuroraText>{title}</AuroraText>
          </Motion.h1>
        )}

        {subtitle && (
          <Motion.p
            variants={item}
            style={{
              margin: '0 0 var(--dtb-space-5)',
              maxWidth: '580px',
              fontSize: 'clamp(0.95rem, 1.8vw, 1.08rem)',
              color: '#dbe3ef',
              lineHeight: 1.75,
              fontWeight: 400,
            }}
          >
            {subtitle}
          </Motion.p>
        )}

        {ctaVisible && ctaLinks.length > 0 && (
          <Motion.div variants={item} className="dtb-hero-cta-wrap" style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', justifyContent: 'center', marginBottom: '0', width: '100%' }}>
            {ctaLinks.map(({ to, label }, i) => (
              <Link key={to} to={to} style={{ textDecoration: 'none' }}>
                <button type="button" className={`dtb-hero-cta dtb-hero-cta--${i === 0 ? 'primary' : 'ghost'}`}>
                  {label}
                </button>
              </Link>
            ))}
          </Motion.div>
        )}
      </Motion.div>

      {showCarousel && (
        <div className="dtb-ui-hero__carousel" style={{ position: 'relative', zIndex: 1, width: '100%', marginBottom: 'clamp(0.4rem, 1.2vw, 0.75rem)' }}>
          <NavigationCarousel />
        </div>
      )}

      {brands.length > 0 && showCarousel && (
        <div aria-hidden="true" style={{ position: 'relative', zIndex: 1, width: 'min(920px, calc(100% - 2.5rem))', height: '1px', margin: '0 auto clamp(0.95rem, 2.5vw, 1.45rem)', background: 'linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(226,232,240,0.44) 18%, rgba(248,250,252,0.75) 50%, rgba(226,232,240,0.44) 82%, rgba(255,255,255,0) 100%)' }} />
      )}

      {brands.length > 0 && <TrustedBrands brands={brands} title="Trusted Brands" speed={32} transparent />}
    </section>
  );
}
