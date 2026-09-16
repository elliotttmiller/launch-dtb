export default function RepairGuarantees() {
  return (
    <div className="repair-guarantees" aria-label="Our repair service promises">
      <ul className="repair-guarantees__grid">
        <li className="repair-guarantees__item">
          <div>
            <h2>Genuine OEM Parts</h2>
            <p>We use genuine OEM parts to keep your tools performing the way they were built to.</p>
          </div>
        </li>

        <li className="repair-guarantees__item">
          <div>
            <h2>Transparent Pricing</h2>
            <p>Clear estimates, no hidden fees, and no surprise charges. Nothing extra moves forward without your approval.</p>
          </div>
        </li>

        <li className="repair-guarantees__item">
          <div>
            <h2>Guaranteed Satisfaction</h2>
            <p>If something isn’t right after service, we’ll make it right at no cost to you.</p>
          </div>
        </li>
      </ul>
    </div>
  );
}
