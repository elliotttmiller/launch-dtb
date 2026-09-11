import { Link } from 'react-router-dom';
import SEOHead from '../components/shared/SEOHead';
import { SCHEMATIC_DEFINITIONS } from '../data/schematicMappings';
import { getBrandLogo } from '../utils/brandAssets.js';
import '../styles/repair-landing.css';
import '../styles/repair-landing-responsive.css';

const SUPPORTED_BRANDS = Object.keys(SCHEMATIC_DEFINITIONS).sort((a, b) => a.localeCompare(b));

const PROCESS_STEPS = [
  {
    title: 'Identify the tool',
    description: 'Tell us the brand, tool family, model, symptoms, and service goal. Photos can be added during intake.',
  },
  {
    title: 'Choose service and shipping',
    description: 'Select a repair package or diagnostic path, then choose how the tool gets to DTB and how it should return.',
  },
  {
    title: 'Inspect and approve',
    description: 'We inspect the tool and follow the approval rules you select. Additional quote-first work waits for your approval.',
  },
  {
    title: 'Repair, test, and return',
    description: 'Approved work is completed, the tool is function-tested, and repair status stays available through return shipping.',
  },
];

const ASSURANCE_ITEMS = [
  {
    title: 'You control additional work',
    description: 'Choose quote-required approval or an eligible pre-approval limit during intake so inspection findings do not become surprise work.',
  },
  {
    title: 'Structured tool intake',
    description: 'Brand, tool family, model, symptoms, photos, shipping preferences, warranty review, and service package stay tied to one repair request.',
  },
  {
    title: 'Track the repair',
    description: 'Use your repair number and token to review the current status and any next action without starting a separate support thread.',
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
    question: 'Can I request faster service?',
    answer: 'Repair intake exposes the service-priority options currently supported for the request. Availability and timing are confirmed through the repair workflow rather than promised on this page.',
  },
  {
    question: 'Can replaced parts be returned with my tool?',
    answer: 'Yes. Intake includes an old-parts preference so you can request that replaced parts be returned instead of recycled or discarded.',
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
        description="Professional drywall tool repair, rebuild, diagnostic, shipping, approval, and tracking services for automatic finishing tools."
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
              Choose a repair package or diagnostic, send your tool to DTB, approve any additional quote-first work, and track the repair through return shipping.
            </p>

            <div className="repair-hero__actions" aria-label="Repair service actions">
              <Link className="repair-button repair-button--primary" to="/repairs/start">
                Start a Repair
                <span aria-hidden="true">→</span>
              </Link>
              <Link className="repair-button repair-button--secondary" to="/repairs/packages">
                Compare Packages
                <span aria-hidden="true">→</span>
              </Link>
              <Link className="repair-button repair-button--utility" to="/repairs/track">
                Track Repair
                <span aria-hidden="true">→</span>
              </Link>
            </div>

            <div className="repair-hero__assurance" aria-label="Repair service highlights">
              <span>Package or diagnostic paths</span>
              <span>Approval controls</span>
              <span>Repair tracking</span>
            </div>
          </div>
        </div>
      </section>

      <section className="repair-service-details" aria-labelledby="repair-service-paths-title">
        <div className="repair-section-shell">
          <div className="repair-section-heading repair-section-heading--center">
            <p className="repair-eyebrow">Choose a Service Path</p>
            <h2 id="repair-service-paths-title">Start with what you know about the tool.</h2>
            <p>The same repair workflow supports a known service package, a quote-first diagnostic, or a coverage review.</p>
          </div>

          <div className="repair-service-details__grid">
            <article className="repair-service-panel">
              <p className="repair-eyebrow">Standard Service</p>
              <h2>Know the service you need?</h2>
              <p>Choose a package built around the tool family and service scope, then continue into the same structured repair intake.</p>
              <ul>
                <li>Tool-family service packages and tune-ups</li>
                <li>Photos, symptoms, shipping, and return preferences</li>
                <li>Approval rules stay attached to the repair request</li>
              </ul>
              <Link to="/repairs/packages">Compare repair packages <span aria-hidden="true">→</span></Link>
            </article>

            <article className="repair-service-panel repair-service-panel--diagnostic">
              <p className="repair-eyebrow">Diagnostic & Coverage Review</p>
              <h2>Not sure what is wrong?</h2>
              <p>Start with a diagnostic when the failure is unclear, or flag the request for warranty or coverage review during intake.</p>
              <ul>
                <li>Inspection before quote-first repair work begins</li>
                <li>Warranty or eligibility-review request supported</li>
                <li>Approval required before additional quote-first work</li>
              </ul>
              <Link className="repair-button repair-button--primary" to="/repairs/start?package=dx">
                Start Diagnostic
                <span aria-hidden="true">→</span>
              </Link>
            </article>
          </div>
        </div>
      </section>

      <section className="repair-process" aria-labelledby="repair-process-title">
        <div className="repair-section-shell">
          <div className="repair-section-heading repair-section-heading--center">
            <p className="repair-eyebrow">Repair Workflow</p>
            <h2 id="repair-process-title">Know what happens before you send the tool.</h2>
            <p>A single request stays tied to the tool, service choice, approval rules, shipping preferences, and repair status.</p>
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

      <section className="repair-assurance" aria-labelledby="repair-assurance-title">
        <div className="repair-section-shell">
          <div className="repair-section-heading">
            <p className="repair-eyebrow">Built for Contractor Downtime</p>
            <h2 id="repair-assurance-title">Clear decisions. Fewer unknowns.</h2>
            <p>The repair workflow is designed to keep service scope, approvals, logistics, and status explicit.</p>
          </div>
          <div className="repair-assurance__grid">
            {ASSURANCE_ITEMS.map((item) => (
              <article className="repair-assurance__item" key={item.title}>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {featuredBrands.length > 0 && (
        <section className="repair-brands" aria-labelledby="repair-brands-title">
          <div className="repair-section-shell repair-brands__inner">
            <div>
              <p className="repair-eyebrow">Supported Brands</p>
              <h2 id="repair-brands-title">Service for the tools contractors rely on.</h2>
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

      <section className="repair-resources" aria-labelledby="repair-resources-title">
        <div className="repair-section-shell repair-resources__grid">
          <div className="repair-resources__copy">
            <p className="repair-eyebrow">Repair It Yourself?</p>
            <h2 id="repair-resources-title">Find the schematic and parts you need.</h2>
            <p>
              Use tool schematics to identify replacement parts for straightforward repairs. For inspection, calibration, or rebuild work, start a professional repair instead.
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
            <p>Key details about service selection, approval, shipping, parts, and tracking.</p>
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
            <h2 id="repair-closing-title">Choose the right service for your tool.</h2>
          </div>
          <div className="repair-closing-cta__actions">
            <Link className="repair-button repair-button--primary" to="/repairs/start">Start a Repair <span aria-hidden="true">→</span></Link>
            <Link to="/repairs/packages">View Repair Packages <span aria-hidden="true">→</span></Link>
            <Link to="/repairs/track">Track Existing Repair <span aria-hidden="true">→</span></Link>
          </div>
        </div>
      </section>
    </div>
  );
}
