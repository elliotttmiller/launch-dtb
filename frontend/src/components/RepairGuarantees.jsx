function GenuinePartsIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M12 3.25 19 7.2v9.6L12 20.75 5 16.8V7.2L12 3.25Z" />
      <path d="m8.75 12.1 2.05 2.05 4.45-4.45" />
    </svg>
  );
}

function TransparentPricingIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M4.5 7.25h15" />
      <path d="M4.5 16.75h15" />
      <circle cx="9" cy="7.25" r="2" />
      <circle cx="15" cy="16.75" r="2" />
    </svg>
  );
}

function SatisfactionIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M12 3.25 18.5 5.7v5.45c0 4.15-2.55 7.45-6.5 9.6-3.95-2.15-6.5-5.45-6.5-9.6V5.7L12 3.25Z" />
      <path d="m8.8 12 2.05 2.05 4.35-4.35" />
    </svg>
  );
}

export default function RepairGuarantees() {
  return (
    <div className="repair-guarantees" aria-label="Our repair service promises">
      <ul className="repair-guarantees__grid">
        <li className="repair-guarantees__item">
          <span className="repair-guarantees__icon" aria-hidden="true"><GenuinePartsIcon /></span>
          <div>
            <h2>Genuine OEM Parts</h2>
            <p>We use genuine OEM parts to keep your tools performing the way they were built to.</p>
          </div>
        </li>

        <li className="repair-guarantees__item">
          <span className="repair-guarantees__icon" aria-hidden="true"><TransparentPricingIcon /></span>
          <div>
            <h2>Transparent Pricing</h2>
            <p>Clear estimates, no hidden fees, and no surprise charges. Nothing extra moves forward without your approval.</p>
          </div>
        </li>

        <li className="repair-guarantees__item">
          <span className="repair-guarantees__icon" aria-hidden="true"><SatisfactionIcon /></span>
          <div>
            <h2>Guaranteed Satisfaction</h2>
            <p>If something isn’t right after service, we’ll make it right at no cost to you.</p>
          </div>
        </li>
      </ul>
    </div>
  );
}
