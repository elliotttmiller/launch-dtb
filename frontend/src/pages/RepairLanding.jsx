import { Link } from 'react-router-dom';
import SEOHead from '../components/shared/SEOHead';
import { SCHEMATIC_DEFINITIONS } from '../data/schematicMappings';
import { getBrandLogo } from '../utils/brandAssets.js';
import '../styles/repair-landing.css';
import '../styles/repair-landing-responsive.css';

const SUPPORTED_BRANDS = Object.keys(SCHEMATIC_DEFINITIONS).sort((a, b) => a.localeCompare(b));

const PROCESS_STEPS = [
  {
    title: 'Choose a service path',
    description: 'Start a repair, choose a service package, or request a diagnostic.',
  },
  {
    title: 'Send us your tool',
    description: 'Ship your tool to DTB or choose an eligible drop-off option.',
  },
  {
    title: 'Review and approve',
    description: 'We inspect the tool and request approval for additional work when needed.',
  },
  {
    title: 'Repair and return',
    description: 'We complete the approved work, test the tool, and return it.',
  },
];

const FAQ_ITEMS = [
  {
    question: 'What if I do not know which repair package I need?',
    answer: 'Choose Diagnose and Quote. We will inspect the tool and provide an estimate before repair work begins.',
  },
  {
    question: 'Will additional work be completed without my approval?',
    answer: 'No. Quote-first work requires approval, and eligible repairs can use the pre-approval limit selected during intake.',
  },
  {
    question: 'Can I upload photos of the problem?',
    answer: 'Yes. Add photos during intake to document leaks, damage, wear, or other symptoms before you send the tool.',
  },
  {
    question: 'Can I request a warranty or coverage review?',
    answer: 'Yes. Repair intake supports paid service, manufacturer warranty evaluation requests, and eligibility-review requests.',
  },
  {
    question: 'How do I get the tool to DTB?',
    answer: 'Choose shipping or an eligible drop-off option during intake. You will also select your return delivery preference.',
  },
  {
    question: 'Can I track an existing repair?',
    answer: 'Yes. Use Track Repair with your repair number and token to view current status and next steps.',
  },
];

export default function RepairLanding() {
  const featuredBrands = SUPPORTED_BRANDS.slice(0, 8)
    .map((brand) => ({ brand, logo: getBrandLogo(brand) }))
    .filter(({ logo }) => Boolean(logo));

  return (
    <div className="repair-landing page-wrapper">
      <SEOHead
        title="Drywall Tool Repair Services"
        description="Drywall tool repair, rebuild, diagnostics, shipping, approval, and tracking for automatic finishing tools."
        canonical="/repairs"
      />

      <section className="repair-hero" aria-labelledby="repair-hero-title">
        <div className="repair-hero__inner">
          <div className="repair-hero__content">
            <p className="repair-eyebrow">Professional Tool Repair</p>
            <h1 id="repair-hero-title">
              Get Your Tools<br />
              <span>Back on the Job.</span>
            </h1>
            <p className="repair-hero__lead">
              Repair, rebuild, and diagnostic services for automatic drywall finishing tools. Start a request, approve quoted work, and track your repair.
            </p>

            <div className="repair-hero__actions" aria-label="Repair service actions">
              <Link className="repair-button repair-button--primary" to="/repairs/start">
                Start a Repair
                <span aria-hidden="true">→</span>
              </Link>
              <Link className="repair-button repair-button--secondary" to="/repairs/packages">
                Repair Packages
                <span aria-hidden="true">→</span>
              </Link>
              <Link className="repair-button repair-button--utility" to="/repairs/track">
                Track Repair
                <span aria-hidden="true">→</span>
              </Link>
            </div>

            <div className="repair-hero__assurance" aria-label="Repair service highlights">
              <span>Major tool categories</span>
              <span>Quote approval options</span>
              <span>Repair tracking</span>
            </div>
          </div>
        </div>
      </section>

      <section className="repair-process" aria-labelledby="repair-process-title">
        <div className="repair-section-shell">
          <div className="repair-section-heading repair-section-heading--center">
            <p className="repair-eyebrow">Repair Workflow</p>
            <h2 id="repair-process-title">How Repairs Work</h2>
            <p>A straightforward process from intake to return.</p>
          </div>

          <ol className="repair-process__grid">
            {PROCESS_STEPS.map((step, index) => (
              <li className="repair-process__step" key={step.title}>
                <span className="repair-process__number" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
                <div>
                  <h3>{step.title}</h3>
                  <p>{step.description}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {featuredBrands.length > 0 && (
        <section className="repair-brands" aria-labelledby="repair-brands-title">
          <div className="repair-section-shell repair-brands__inner">
            <div>
              <p className="repair-eyebrow">Supported Brands</p>
              <h2 id="repair-brands-title">Service for leading drywall tool brands.</h2>
            </div>
            <div className="repair-brands__list" aria-label="Supported repair brands">
              {featuredBrands.map(({ brand, logo }) => (
                <span key={brand} title={brand}>
                  <img
                    src={logo}
                    alt={brand}
                    loading="lazy"
                    decoding="async"
                    style={{ width: '150px', maxWidth: '100%', height: '44px', objectFit: 'contain' }}
                  />
                </span>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="repair-service-details" aria-label="Repair service details">
        <div className="repair-section-shell repair-service-details__grid">
          <article className="repair-service-panel">
            <p className="repair-eyebrow">Shipping &amp; Return</p>
            <h2>Choose how to send and receive your tool.</h2>
            <p>
              Select inbound and return options during repair intake.
            </p>
            <ul>
              <li>Ship to DTB or choose an eligible drop-off option</li>
              <li>Select an available return delivery preference</li>
              <li>Keep repair and shipping details tied to one request</li>
            </ul>
            <Link to="/repairs/start">Start repair intake <span aria-hidden="true">→</span></Link>
          </article>

          <article className="repair-service-panel repair-service-panel--diagnostic">
            <p className="repair-eyebrow">Not Sure What It Needs?</p>
            <h2>Start with a diagnostic.</h2>
            <p>
              Choose Diagnose and Quote when the issue is unclear. We inspect the tool and send a quote before repair work begins.
            </p>
            <Link className="repair-button repair-button--primary" to="/repairs/start?package=diagnose_and_quote">
              Request Diagnostic
              <span aria-hidden="true">→</span>
            </Link>
          </article>
        </div>
      </section>

      <section className="repair-resources" aria-labelledby="repair-resources-title">
        <div className="repair-section-shell repair-resources__grid">
          <div className="repair-resources__copy">
            <p className="repair-eyebrow">Repair It Yourself?</p>
            <h2 id="repair-resources-title">Find the schematic and parts you need.</h2>
            <p>
              Use schematics to identify replacement parts for straightforward repairs. For inspection, calibration, or rebuild work, start a repair.
            </p>
          </div>
          <div className="repair-resources__actions">
            <Link to="/schematics">View Schematics <span aria-hidden="true">→</span></Link>
            <Link to="/parts">Shop Repair Parts <span aria-hidden="true">→</span></Link>
          </div>
        </div>
      </section>

      <section className="repair-faq" aria-labelledby="repair-faq-title">
        <div className="repair-section-shell repair-faq__layout">
          <div className="repair-section-heading">
            <p className="repair-eyebrow">Repair FAQ</p>
            <h2 id="repair-faq-title">Before you send your tool.</h2>
            <p>Key details about service, approval, shipping, and tracking.</p>
          </div>

          <div className="repair-faq__list">
            {FAQ_ITEMS.map((item) => (
              <details key={item.question}>
                <summary>{item.question}</summary>
                <p>{item.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="repair-closing-cta" aria-labelledby="repair-closing-title">
        <div className="repair-section-shell repair-closing-cta__inner">
          <div>
            <p className="repair-eyebrow">Ready to Start?</p>
            <h2 id="repair-closing-title">Choose a service path for your tool.</h2>
          </div>
          <div className="repair-closing-cta__actions">
            <Link className="repair-button repair-button--primary" to="/repairs/start">Start a Repair <span aria-hidden="true">→</span></Link>
            <Link to="/repairs/packages">View Repair Packages <span aria-hidden="true">→</span></Link>
          </div>
        </div>
      </section>
    </div>
  );
}