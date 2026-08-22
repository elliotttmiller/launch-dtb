import { Link } from 'react-router-dom';
import SEOHead from '../components/shared/SEOHead';
import { SCHEMATIC_DEFINITIONS } from '../data/schematicMappings';
import '../styles/repair-landing.css';
import '../styles/repair-landing-responsive.css';

const SUPPORTED_BRANDS = Object.keys(SCHEMATIC_DEFINITIONS).sort((a, b) => a.localeCompare(b));

const PROCESS_STEPS = [
  {
    title: 'Choose your repair path',
    description: 'Start a guided repair request, select a standard package, or request a diagnostic when the problem is not yet clear.',
  },
  {
    title: 'Ship or drop off your tool',
    description: 'Send the tool to DTB or use an eligible drop-off option. Your request stays tied to the exact tool and service selection.',
  },
  {
    title: 'Inspection and approval',
    description: 'We inspect the tool and confirm the work required. Additional work does not begin until it matches the approval option you selected.',
  },
  {
    title: 'Repair, test, and return',
    description: 'The tool is serviced, function-tested, and returned using your selected delivery preference with repair tracking available.',
  },
];

const ASSURANCES = [
  {
    title: 'Quote approval',
    description: 'Choose quote-first approval or set an eligible pre-approval limit before additional work is performed.',
  },
  {
    title: 'Flexible shipping',
    description: 'Use supported inbound shipping or an eligible drop-off path, then choose your preferred return option.',
  },
  {
    title: 'Repair tracking',
    description: 'Keep the repair request, status, and next steps connected from intake through return shipment.',
  },
];

const FAQ_ITEMS = [
  {
    question: 'What if I do not know which repair package I need?',
    answer: 'Use Diagnose and Quote. A technician can inspect the tool and provide a written estimate before repair work begins.',
  },
  {
    question: 'Will additional work be completed without my approval?',
    answer: 'No. The repair intake includes explicit approval options. Quote-first repairs require approval before additional work begins, and eligible repairs can use a customer-defined pre-approval limit.',
  },
  {
    question: 'Can I upload photos of the problem?',
    answer: 'Yes. The repair intake supports photo attachments so you can document symptoms, visible damage, leaks, or other conditions before shipping the tool.',
  },
  {
    question: 'Can I request a warranty or coverage review?',
    answer: 'Yes. The intake supports standard paid repair service, manufacturer warranty evaluation requests, and eligibility-review requests.',
  },
  {
    question: 'How do I get the tool to DTB?',
    answer: 'The repair workflow supports shipping to DTB as well as eligible local or partner drop-off selections. Return delivery preferences are chosen separately during intake.',
  },
  {
    question: 'Can I track an existing repair?',
    answer: 'Yes. Use Track Repair with your repair number and token to review current status and next steps.',
  },
];

export default function RepairLanding() {
  const featuredBrands = SUPPORTED_BRANDS.slice(0, 8);

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
              Professional repair, rebuild, and diagnostic service for automatic drywall finishing tools. Start with your tool, choose the right service path, and keep approval and repair status clear from intake through return.
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
            <p>Four clear stages from service selection to getting your tool back.</p>
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
            <p className="repair-eyebrow">Professional Service</p>
            <h2 id="repair-assurance-title">Clear decisions. No hidden repair path.</h2>
          </div>

          <div className="repair-assurance__grid">
            {ASSURANCES.map((item) => (
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
              <h2 id="repair-brands-title">Built around the tools contractors actually use.</h2>
            </div>
            <div className="repair-brands__list" aria-label="Supported repair brands">
              {featuredBrands.map((brand) => (
                <span key={brand}>{brand}</span>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="repair-service-details" aria-label="Repair service details">
        <div className="repair-section-shell repair-service-details__grid">
          <article className="repair-service-panel">
            <p className="repair-eyebrow">Shipping &amp; Return</p>
            <h2>Send it in. Keep the return path clear.</h2>
            <p>
              The intake captures how the tool will reach DTB, the return preference, the delivery address, and the selected shipping option. Packaging guidance is included before submission.
            </p>
            <ul>
              <li>Ship to DTB or choose an eligible drop-off option</li>
              <li>Select standard, expedited, or eligible pickup return preferences</li>
              <li>Keep outbound and repair status information connected to the request</li>
            </ul>
            <Link to="/repairs/start">Start repair intake <span aria-hidden="true">→</span></Link>
          </article>

          <article className="repair-service-panel repair-service-panel--diagnostic">
            <p className="repair-eyebrow">Not Sure What It Needs?</p>
            <h2>Start with a diagnostic.</h2>
            <p>
              Use the Diagnose and Quote path when the damage is uncertain, severe, unusual, or does not fit a standard service package. No repair work begins until the quote is approved.
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
            <h2 id="repair-resources-title">Use schematics and parts before you send the tool in.</h2>
            <p>
              Browse tool schematics and replacement parts when the repair is appropriate for self-service. Professional repair remains available when inspection, calibration, or a complete rebuild is the better path.
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
            <p>Answers to the questions that matter before a repair request is submitted.</p>
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
            <h2 id="repair-closing-title">Get your tool into the right repair path.</h2>
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