export default function RepairGuarantees() {
  return (
    <section className="repair-guarantees" aria-label="Our repair service guarantees">
      <div className="repair-section-shell">
        <ul className="repair-guarantees__grid">
          <li className="repair-guarantees__item">
            <span className="repair-guarantees__icon" aria-hidden="true">
              <svg viewBox="0 0 24 24">
                <path d="M12 3 19 6v5c0 4.8-2.8 8-7 10-4.2-2-7-5.2-7-10V6l7-3Z" />
                <path d="m8.5 12 2.2 2.2 4.8-5" />
              </svg>
            </span>
            <div>
              <h2>We stand behind every repair</h2>
              <p>If something isn’t right after service, we’ll make it right at no cost to you.</p>
            </div>
          </li>

          <li className="repair-guarantees__item">
            <span className="repair-guarantees__icon" aria-hidden="true">
              <svg viewBox="0 0 24 24">
                <path d="M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Z" />
                <path d="m19 13.5 1.6 1.2-1.5 2.6-1.9-.8a7.7 7.7 0 0 1-2.1 1.2l-.2 2.1h-3l-.2-2.1a7.7 7.7 0 0 1-2.1-1.2l-1.9.8-1.5-2.6 1.6-1.2a8 8 0 0 1 0-2.5L6.2 9.8l1.5-2.6 1.9.8a7.7 7.7 0 0 1 2.1-1.2l.2-2.1h3l.2 2.1A7.7 7.7 0 0 1 17.2 8l1.9-.8 1.5 2.6L19 11a8 8 0 0 1 0 2.5Z" />
              </svg>
            </span>
            <div>
              <h2>Genuine OEM parts only</h2>
              <p>We use genuine OEM parts to keep your tools performing the way they were built to.</p>
            </div>
          </li>

          <li className="repair-guarantees__item">
            <span className="repair-guarantees__icon" aria-hidden="true">
              <svg viewBox="0 0 24 24">
                <path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3Z" />
                <path d="M9 8h6M9 12h6M9 16h3" />
              </svg>
            </span>
            <div>
              <h2>No hidden fees or surprise charges</h2>
              <p>You’ll receive clear pricing before added work begins, and nothing extra moves forward without your approval.</p>
            </div>
          </li>
        </ul>
      </div>
    </section>
  );
}
