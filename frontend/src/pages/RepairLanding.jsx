import { Link } from 'react-router-dom';
import SEOHead from '../components/shared/SEOHead';
import { SCHEMATIC_DEFINITIONS } from '../data/schematicMappings';
import { getBrandLogo } from '../utils/brandAssets.js';
import '../styles/repair-landing.css';
import '../styles/repair-merchandising.css';
import '../styles/repair-landing-responsive.css';
import '../styles/repair-landing-trust.css';

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
    title: 'No surprise additional work',
    description: 'Choose quote-required approval or an eligible pre-approval amount during intake before additional repair work is authorized.',
  },
  {
    title: 'Repair details stay together',
    description: 'Tool identity, symptoms, photos, inspection findings, service scope, shipping preferences, and approvals stay tied to one repair request.',
  },
  {
    title: 'Know where your tool stands',
    description: 'Use your repair number and token to review current status and any next action without opening another support thread.',
  },
  {
    title: 'Test before return',
    description: 'Completed repair work is function-tested before the tool moves into the return-shipping stage.',
  },
];

const PACKING_STEPS = [
  'Clean excess compound',
  'Secure loose parts',
  'Protect the tool',
  'Use a rigid box',
  'Pack against movement',
];

const FAQ_GROUPS = [
  {
    title: 'Choosing Service',
    items: [
      {
        question: 'What if I do not know which repair package I need?',
        answer: 'Choose Diagnose and Quote. We will physically inspect the tool and provide an estimate before quote-first repair work begins.',
      },
      {
        question: 'Can I request a warranty or coverage review?',
        answer: 'Yes. Repair intake supports paid service, manufacturer warranty evaluation requests, and eligibility-review requests.',
      },
    ],
  },
  {
    title: 'Inspection & Approval',
    items: [
      {
        question: 'Do photos or symptoms provide a final diagnosis?',
        answer: 'No. Photos and symptoms are intake evidence that help document the problem. Final repair scope is determined after physical inspection of the tool.',
      },
      {
        question: 'Will additional work be completed without my approval?',
        answer: 'No. Quote-first work requires approval, and eligible repairs can use the pre-approval limit selected during intake.',
      },
      {
        question: 'What happens if the repair does not make economic sense?',
        answer: 'We stop at the inspection and approval stage and present the findings before additional quote-first work is authorized.',
      },
    ],
  },
  {
    title: 'Shipping',
    items: [
      {
        question: 'How do I get the tool to DTB?',
        answer: 'Choose shipping or an eligible drop-off option during intake. You will also select your return delivery preference.',
      },
      {
        question: 'How should I prepare the tool for shipping?',
        answer: 'Remove excess compound, secure loose components, protect exposed surfaces, use a rigid shipping box, and pack the tool so it cannot move freely in transit.',
      },
    ],
  },
  {
    title: 'Pricing & Payment',
    items: [
      {
        question: 'Can I request faster service?',
        answer: 'Repair intake exposes the service-priority options currently supported for the request. Availability and timing are confirmed through the repair workflow rather than promised on this page.',
      },
    ],
  },
  {
    title: 'Repair & Parts',
    items: [
      {
        question: 'Can I upload photos of the problem?',
        answer: 'Yes. Add photos during intake to document leaks, damage, wear, or other symptoms before you send the tool.',
      },
      {
        question: 'Can replaced parts be returned with my tool?',
        answer: 'Yes. Intake includes an old-parts preference so you can request that replaced parts be returned instead of recycled or discarded.',
      },
    ],
  },
  {
    title: 'Tracking',
    items: [
      {
        question: 'Can I track an existing repair?',
        answer: 'Yes. Use Track Repair with your repair number and token to view current status and next steps.',
      },
    ],
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
              Professional repair for automatic drywall tools, with physical inspection, approval before additional quote-first work, structured shipping, and repair tracking from intake through return.
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
              <span>Major brands serviced</span>
              <span>Approval before added work</span>
              <span>Repair tracking</span>
              <span>Function-tested before return</span>
            </div>
          </div>
        </div>
      </section>

      <section className="repair-service-details" aria-labelledby="repair-service-paths-title">
        <div className="repair-section-shell">
          <div className="repair-section-heading repair-section-heading--center">
            <p className="repair-eyebrow">How Should We Start?</p>
            <h2 id="repair-service-paths-title">Start with what you know about the tool.</h2>
            <p>Use the same structured repair workflow whether you know the service you need or want the tool diagnosed first.</p>
          </div>

          <div className="repair-service-details__grid">
            <article className="repair-service-panel">
              <p className="repair-eyebrow">I Know What Service I Need</p>
              <h2>Choose a repair package.</h2>
              <p>Start with a package built around the tool family and service scope, then continue into the same structured repair intake.</p>
              <ul>
                <li>Tool-family service packages and tune-ups</li>
                <li>Photos, symptoms, shipping, and return preferences</li>
                <li>Approval rules stay attached to the repair request</li>
              </ul>
              <Link to="/repairs/packages">Compare repair packages <span aria-hidden="true">→</span></Link>
            </article>

            <article className="repair-service-panel repair-service-panel--diagnostic">
              <p className="repair-eyebrow">I Need the Tool Diagnosed</p>
              <h2>Send it for inspection first.</h2>
              <p>Photos and symptoms help document the problem, but final repair scope is determined after physical inspection of the tool.</p>
              <ul>
                <li>Inspection before quote-first repair work begins</li>
                <li>Warranty or eligibility-review request supported</li>
                <li>Approval required before additional quote-first work</li>
              </ul>
              <Link className="repair-button repair-button--primary" to="/repairs/start?package=diagnose_and_quote">
                Start Diagnostic
                <span aria-hidden="true">→</span>
              </Link>
            </article>
          </div>
        </div>
      </section>

      <section className="repair-assurance" aria-labelledby="repair-assurance-title">
        <div className="repair-section-shell">
          <div className="repair-section-heading">
            <p className="repair-eyebrow">Why Contractors Send Tools to DTB</p>
            <h2 id="repair-assurance-title">Know what happens before work moves forward.</h2>
            <p>Repair scope, approvals, logistics, testing, and status stay explicit throughout the request.</p>
          </div>
          <div className="repair-assurance__grid repair-assurance__grid--trust">
            {ASSURANCE_ITEMS.map((item) => (
              <article className="repair-assurance__item" key={item.title}>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="repair-process" aria-labelledby="repair-process-title">
        <div className="repair-section-shell">
          <div className="repair-section-heading repair-section-heading--center">
            <p className="repair-eyebrow">Repair Workflow</p>
            <h2 id="repair-process-title">One request from intake through return.</h2>
            <p>A single repair record stays tied to the tool, service choice, approval rules, shipping preferences, and repair status.</p>
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

      <section className="repair-packing" aria-labelledby="repair-packing-title">
        <div className="repair-section-shell repair-packing__inner">
          <div className="repair-packing__copy">
            <p className="repair-eyebrow">Before You Ship</p>
            <h2 id="repair-packing-title">Protect the tool before it leaves your hands.</h2>
            <p>Basic preparation helps reduce transit damage, missing components, and avoidable inspection delays.</p>
          </div>
          <ol className="repair-packing__steps">
            {PACKING_STEPS.map((step, index) => (
              <li key={step}>
                <span aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
                <strong>{step}</strong>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {featuredBrands.length > 0 && (
        <section className="repair-brands" aria-labelledby="repair-brands-title">
          <div className="repair-section-shell repair-brands__inner">
            <div className="repair-brands__copy">
              <p className="repair-eyebrow">Supported Brands</p>
              <h2 id="repair-brands-title">Repair support across major automatic finishing brands.</h2>
              <p>Choose the exact brand and tool family during intake so the repair request stays associated with the correct tool.</p>
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
            <h2 id="repair-resources-title">Know the part you need?</h2>
            <p>
              Use tool schematics to identify replacement parts for straightforward repairs. For inspection, calibration, or rebuild work, start a professional repair instead.
            </p>
          </div>
          <div className="repair-resources__actions">
            <Link to="/repairs/start">Start a Professional Repair <span aria-hidden="true">→</span></Link>
            <Link to="/schematics">Find It in a Schematic <span aria-hidden="true">→</span></Link>
            <Link to="/parts">Shop Repair Parts <span aria-hidden="true">→</span></Link>
          </div>
        </div>
      </section>

      <section className="repair-faq" aria-labelledby="repair-faq-title">
        <div className="repair-section-shell repair-faq__layout">
          <div className="repair-section-heading">
            <p className="repair-eyebrow">Repair FAQ</p>
            <h2 id="repair-faq-title">Before you send your tool.</h2>
            <p>Service selection, inspection, approval, shipping, parts, and tracking—grouped so the answer is easier to find.</p>
          </div>

          <div className="repair-faq__groups">
            {FAQ_GROUPS.map((group) => (
              <section className="repair-faq__group" key={group.title} aria-labelledby={`repair-faq-${group.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}>
                <h3 id={`repair-faq-${group.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}>{group.title}</h3>
                <div className="repair-faq__list">
                  {group.items.map((item) => (
                    <details key={item.question}>
                      <summary>{item.question}</summary>
                      <p>{item.answer}</p>
                    </details>
                  ))}
                </div>
              </section>
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
