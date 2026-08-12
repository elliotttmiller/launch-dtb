/**
 * frontend/src/pages/ReturnPolicy.jsx
 *
 * Customer-facing return policy page.
 */

import { Link } from 'react-router-dom';
import {
  AlertCircle,
  ArrowRight,
  CreditCard,
  RotateCcw,
  ShieldCheck,
} from 'lucide-react';
import SEOHead from '../components/shared/SEOHead';
import '../styles/store-policies.css';

const RETURN_STEPS = [
  {
    title: 'Start your request',
    text: 'Use our Returns Portal and enter your order number to begin.',
  },
  {
    title: 'Wait for return approval',
    text: 'We send your Return ID and return instructions by email, usually within 1 business day.',
  },
  {
    title: 'Pack and ship',
    text: 'Pack the item securely and include your Return ID with the package.',
  },
];

const NOT_RETURNABLE = [
  'Used tools showing wear, compound residue, damage, or missing parts.',
  'Closeout, final-sale, outlet, discontinued, or specially priced items.',
  'Special-order or direct-ship items marked non-returnable on the product page.',
  'Partially used consumables such as sandpaper, tape, abrasives, or case quantities.',
  'Returns shipped without an approved Return ID.',
];

const RELATED_POLICIES = [
  {
    Icon: ShieldCheck,
    title: 'Warranty support',
    text: 'Manufacturer warranties still apply. Contact us first and we will help route the claim.',
  },
  {
    Icon: AlertCircle,
    title: 'Damaged delivery',
    text: 'Tell us within 72 hours and keep the packaging so we can file a carrier claim.',
  },
  {
    Icon: CreditCard,
    title: 'Refund timing',
    text: 'Approved refunds go back to the original payment method within 3-5 business days.',
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
      <Icon size={20} />
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
        description="Drywall Toolbox return policy: 45-day returns, no restocking fee on unused approved returns, Return ID instructions, refund timing, and warranty support."
        canonical="/return-policy"
      />

      <section className="store-policy-hero">
        <div className="store-policy-hero__copy">
          <PolicyPill>Returns made straightforward</PolicyPill>
          <h1>Return Policy</h1>
          <p>
            We want the right tools in your hands. If something is wrong, damaged,
            or simply not the right fit, start here and we will help you get it handled.
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
            Returns are accepted within 45 days of invoice date. Items must be
            unused, in like-new condition, and include original packaging,
            accessories, documentation, warranty cards, and your receipt or order
            confirmation.
          </p>
        </section>

        <section className="store-policy-section">
          <div className="store-policy-section__header">
            <PolicyPill>How it works</PolicyPill>
            <h2>Three steps to start a return</h2>
          </div>
          <div className="store-policy-steps">
            {RETURN_STEPS.map((item, index) => (
              <StepCard key={item.title} step={index + 1} {...item} />
            ))}
          </div>
          <div className="store-policy-alert">
            <AlertCircle size={18} />
            <p>
              Do not ship returns directly to a manufacturer or without a Return ID.
              Returns without a valid Return ID may be refused or delayed.
            </p>
          </div>
        </section>

        <section className="store-policy-section store-policy-section--split">
          <div>
            <PolicyPill>Before you ship</PolicyPill>
            <h2>Items that cannot be returned</h2>
            <p>
              These limits keep return handling fair and keep used or incomplete
              products out of contractor orders.
            </p>
          </div>
          <ul className="store-policy-checklist">
            {NOT_RETURNABLE.map((item) => (
              <li key={item}>
                <AlertCircle size={15} />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="store-policy-related">
          <div className="store-policy-section__header">
            <PolicyPill>Good to know</PolicyPill>
            <h2>Related policy details</h2>
          </div>
          <div className="store-policy-related-grid">
            {RELATED_POLICIES.map((item) => <RelatedPolicyCard key={item.title} {...item} />)}
          </div>
        </section>

        <section className="store-policy-footer-cta">
          <RotateCcw size={24} />
          <div>
            <h2>Need help with a return?</h2>
            <p>
              Start online or email our support team. Include your order number,
              photos if the item arrived damaged, and a short description of what
              happened.
            </p>
          </div>
          <Link to="/returns" className="store-policy-button store-policy-button--primary">
            Open Return Portal <ArrowRight size={16} />
          </Link>
        </section>
      </main>
    </div>
  );
}
