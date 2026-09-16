export default function RepairGuarantees() {
  return (
    <div className="repair-guarantees" aria-label="Our repair service promises">
      <ul className="repair-guarantees__grid">
        <li className="repair-guarantees__item">
          <div>
            <h2>We stand behind every repair</h2>
            <p>If something isn’t right after service, we’ll make it right at no cost to you.</p>
          </div>
        </li>

        <li className="repair-guarantees__item">
          <div>
            <h2>Genuine OEM Parts</h2>
            <p>We use genuine OEM parts when replacement parts are required.</p>
          </div>
        </li>

        <li className="repair-guarantees__item">
          <div>
            <h2>Clear pricing before added work</h2>
            <p>No hidden fees. No surprises before additional work begins.</p>
          </div>
        </li>
      </ul>
    </div>
  );
}
