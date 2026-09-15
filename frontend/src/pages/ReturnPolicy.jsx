/**
 * frontend/src/pages/ReturnPolicy.jsx
 *
 * Customer-facing return policy page. Operational eligibility is enforced by
 * DTB Returns against the authoritative WooCommerce order.
 */

import { Link } from 'react-router-dom';
import {
  AlertCircle,
  ArrowRight,
  CheckCircle,
  ClipboardCheck,
  CreditCard,
  Package,
  RotateCcw,
  ShieldCheck,
  Truck,
  Wrench,
} from 'lucide-react';
import SEOHead from '../components/shared/SEOHead';
import '../styles/store-policies.css';

const RETURN_STEPS = [
  {
    title: 'Verify the order',
    text: 'Open the Returns Portal and verify the purchase with the order number and checkout email.',
  },
  {
    title: 'Choose the exact items',
    text: 'Select eligible WooCommerce order lines and quantities, then classify the request as a standard return, order problem, or product problem.',
  },
  {
    title: 'Wait for approval',
    text: 'DTB reviews the request and provides a Return ID and instructions when the return is approved. Do not ship before approval.',
  },
  {
    title: 'Pack and follow instructions',
    text: 'Return only approved items and quantities using the packing, label, carrier, and destination instructions provided for that request.',
  },
];

const NOT_RETURNABLE = [
  'Used tools showing wear, compound residue, damage, or missing parts when the request is an ordinary standard return.',
  'Closeout, final-sale, outlet, discontinued, or specially priced items when marked non-returnable.',
  'Special-order or direct-ship items marked non-returnable on the product page or order terms.',
  'Partially used consumables such as sandpaper, tape, abrasives, or case quantities.',
  'Returns shipped without an approved Return ID or outside the instructions issued for the request.',
];

const PACKING_RESPONSIBILITIES = [
  'Keep original packaging, accessories, documentation, warranty materials, and included components together when required.',
  'Package approved merchandise securely so tools, parts, and accessories cannot move freely or damage one another in transit.',
  'Return only the items and quantities approved for the Return ID.',
  'Keep shipment tracking and follow the carrier and label instructions provided for the approved return.',
];

const ISSUE_PATHS = [
  {
    Icon: RotateCcw,
    title: 'Standard return',
    text: 'Use for buyer-remorse situations such as ordering by mistake or no longer needing an unused eligible item.',
  },
  {
    Icon: Package,
    title: 'Damaged or wrong order',
    text: 'Use when the shipment arrived damaged, incorrect, or materially different from what was ordered so DTB can review it separately from a standard return.',
  },
  {
    Icon: Wrench,
    title: 'Product problem',
    text: 'Use when an item is defective or not working as expected. DTB can then determine whether return, replacement, repair, or warranty handling is appropriate.',
  },
];

const RELATED_POLICIES = [
  {
    Icon: ShieldCheck,
    title: 'Warranty support',
    text: 'Manufacturer warranties still apply. Start with DTB so the issue can be routed through the correct return, replacement, repair, or warranty path.',
  },
  {
    Icon: AlertCircle,
    title: 'Damaged delivery',
    text: 'Report shipment damage promptly and keep the product, shipping carton, label, and visible damage available for review.',
  },
  {
    Icon: CreditCard,
    title: 'Refund timing',
    text: 'Approved refunds return to the original payment method after receipt and inspection. Financial-institution posting times can vary.',
  },
];

function PolicyPill({ children }) {
  return <span className="store-policy-pill">{children}</span>;
}

function StepCard({ step, title, text }) {
  return (
    <article className="store-policy-step">
      <span>{step}</span>
      <div>
        <h2>{title}</h2>
        <p>{text}</p>
      </div>
    </article>
  );
}

function RelatedPolicyCard({ Icon, title, text }) {
  return (
    <article className="store-policy-related-card">
      <Icon size={20} aria-hidden="true" />
      <h2>{title}</h2>
      <p>{text}</p>
    </article>
  );
}

export default function ReturnPolicy() {
  return (
    <div className="store-policy-page">
      <SEOHead
        title="Return Policy"
        description="Drywall Toolbox return policy: 45-day standard returns, item-level eligibility, approval before shipping, inspection, refund handling, damaged-order support, and warranty routing."
        canonical="/return-policy"
      />

      <section className="store-policy-hero">
        <div className="store-policy-hero__copy">
          <PolicyPill>Returns made straightforward</PolicyPill>
          <h1>Return Policy</h1>
          <p>
            Start with the actual order, select the exact merchandise involved,
            and let DTB Returns keep approval, shipping instructions, inspection,
            and resolution tied to one Return ID.
          </p>
          <div className="store-policy-hero__actions">
            <Link to="/returns" className="store-policy-button store-policy-button--primary">
              Start a return <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      <main className="store-policy-content">
        <section className="store-policy-section store-policy-section--intro">
          <div>
            <PolicyPill>Standard returns</PolicyPill>
            <h2>45-day return window. No restocking fee for unused approved returns.</h2>
          </div>
          <p>
            Standard returns are accepted within 45 days of invoice date. Items
            must be unused, in like-new condition, and include original packaging,
            accessories, documentation, warranty materials, and the applicable
            receipt or order confirmation. The Returns Portal verifies the order
            and projects item-level eligibility before a request is submitted.
          </p>
        </section>

        <section className="store-policy-related">
          <div className="store-policy-section__header">
            <PolicyPill>Choose the right path</PolicyPill>
            <h2>Not every return reason is the same operationally.</h2>
          </div>
          <div className="store-policy-related-grid">
            {ISSUE_PATHS.map((item) => <RelatedPolicyCard key={item.title} {...item} />)}
          </div>
        </section>

        <section className="store-policy-section">
          <div className="store-policy-section__header">
            <PolicyPill>How it works</PolicyPill>
            <h2>Four steps from verified order to approved shipment.</h2>
          </div>
          <div className="store-policy-steps">
            {RETURN_STEPS.map((item, index) => (
              <StepCard key={item.title} step={index + 1} {...item} />
            ))}
          </div>
          <div className="store-policy-alert">
            <AlertCircle size={18} aria-hidden="true" />
            <p>
              Do not ship merchandise to DTB or directly to a manufacturer until
              the request is approved and the Return ID instructions identify what
              should be returned and where it should go.
            </p>
          </div>
        </section>

        <section className="store-policy-section store-policy-section--split">
          <div>
            <PolicyPill>Before you ship</PolicyPill>
            <h2>Customer packing responsibilities begin after approval.</h2>
            <p>
              Approval defines the exact items and quantities authorized for the
              return. Secure packing helps preserve condition through carrier handoff
              and inspection.
            </p>
          </div>
          <ul className="store-policy-checklist">
            {PACKING_RESPONSIBILITIES.map((item) => (
              <li key={item}>
                <CheckCircle size={15} aria-hidden="true" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="store-policy-section store-policy-section--split">
          <div>
            <PolicyPill>Standard-return limits</PolicyPill>
            <h2>Items that cannot be treated as ordinary returns.</h2>
            <p>
              These restrictions prevent used, incomplete, specially sourced, or
              otherwise excluded merchandise from being reintroduced as normal
              saleable inventory. Damage, defect, and warranty issues should still
              be submitted through the appropriate problem path for review.
            </p>
          </div>
          <ul className="store-policy-checklist">
            {NOT_RETURNABLE.map((item) => (
              <li key={item}>
                <AlertCircle size={15} aria-hidden="true" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="store-policy-related">
          <div className="store-policy-section__header">
            <PolicyPill>Good to know</PolicyPill>
            <h2>Resolution and support details.</h2>
          </div>
          <div className="store-policy-related-grid">
            {RELATED_POLICIES.map((item) => <RelatedPolicyCard key={item.title} {...item} />)}
          </div>
        </section>

        <section className="store-policy-footer-cta">
          <ClipboardCheck size={24} aria-hidden="true" />
          <div>
            <h2>Ready to start?</h2>
            <p>
              Have the order number and checkout email available. The portal will
              verify the purchase, show the order lines available to request, and
              keep the request tied to one Return ID.
            </p>
          </div>
          <Link to="/returns" className="store-policy-button store-policy-button--primary">
            Open Returns Portal <ArrowRight size={16} />
          </Link>
        </section>
      </main>
    </div>
  );
}
