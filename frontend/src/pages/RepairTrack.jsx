import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SEOHead from '../components/shared/SEOHead';
import '../styles/repair-track.css';

function normalizeRepairId(value) {
  return String(value || '').trim().replace(/^DTB-/i, '');
}

const TRACKING_FEATURES = [
  ['View current repair status', 'From intake to return shipment'],
  ['See quote details and actions', 'Approve, decline, or request changes'],
  ['Track shipping information', 'Inbound and return tracking'],
  ['Read messages from our team', 'All communication in one place'],
];

export default function RepairTrack() {
  const navigate = useNavigate();
  const [repairId, setRepairId] = useState('');
  const [token, setToken] = useState('');
  const [error, setError] = useState('');

  function handleSubmit(e) {
    e.preventDefault();
    const id = normalizeRepairId(repairId);
    const publicToken = token.trim();

    if (!id) {
      setError('Enter your repair number.');
      return;
    }

    if (!publicToken) {
      setError('Enter the tracking token from your repair confirmation email.');
      return;
    }

    navigate(`/repairs/status/${encodeURIComponent(id)}?token=${encodeURIComponent(publicToken)}`);
  }

  return (
    <div className="repair-track page-wrapper">
      <SEOHead
        title="Track Repair"
        description="Track a DTB drywall tool repair request by repair number and token."
        canonical="/repairs/track"
      />

      <main className="repair-track__main">
        <section className="repair-track__card" aria-labelledby="repair-track-title">
          <div className="repair-track__form-panel">
            <p className="repair-track__eyebrow">Repair Services</p>
            <h1 id="repair-track-title">Track a repair</h1>
            <p className="repair-track__intro">
              Enter your repair number and tracking token from your confirmation email to view real-time status, quote actions, shipping details, and messages.
            </p>

            <form className="repair-track__form" onSubmit={handleSubmit} noValidate>
              <label className="repair-track__field">
                <span className="repair-track__field-icon" aria-hidden="true">#</span>
                <span className="repair-track__field-content">
                  <span className="repair-track__label">Repair Number</span>
                  <input
                    value={repairId}
                    onChange={(e) => { setRepairId(e.target.value); setError(''); }}
                    placeholder="DTB-1234"
                    autoComplete="off"
                    aria-describedby={error ? 'repair-track-error' : undefined}
                  />
                </span>
              </label>

              <label className="repair-track__field">
                <span className="repair-track__field-icon repair-track__field-icon--lock" aria-hidden="true">
                  <span className="repair-track__lock" />
                </span>
                <span className="repair-track__field-content">
                  <span className="repair-track__label">Tracking Token</span>
                  <input
                    value={token}
                    onChange={(e) => { setToken(e.target.value); setError(''); }}
                    placeholder="Token from confirmation email"
                    autoComplete="off"
                    aria-describedby={error ? 'repair-track-error' : 'repair-track-token-help'}
                  />
                  <span id="repair-track-token-help" className="repair-track__field-help">Found in your repair confirmation email</span>
                </span>
              </label>

              {error && (
                <p id="repair-track-error" className="repair-track__error" role="alert">
                  {error}
                </p>
              )}

              <button type="submit" className="repair-track__submit">
                <span>View Repair Status</span>
                <span aria-hidden="true">→</span>
              </button>
            </form>

            <div className="repair-track__help">
              <span aria-hidden="true" />
              <b>OR</b>
              <span aria-hidden="true" />
            </div>
            <a className="repair-track__help-link" href="mailto:support@drywalltoolbox.com?subject=Help%20finding%20repair%20tracking%20information">
              Need help finding your repair information?
            </a>
          </div>

          <aside className="repair-track__updates" aria-labelledby="repair-track-updates-title">
            <p className="repair-track__eyebrow">Stay Informed</p>
            <h2 id="repair-track-updates-title">Real-time<br />repair updates</h2>

            <ul className="repair-track__features">
              {TRACKING_FEATURES.map(([title, description]) => (
                <li key={title}>
                  <span className="repair-track__check" aria-hidden="true">✓</span>
                  <span>
                    <strong>{title}</strong>
                    <small>{description}</small>
                  </span>
                </li>
              ))}
            </ul>

            <div className="repair-track__email-note">
              <p>Your repair number and tracking token can be found in your confirmation email from Drywall Toolbox.</p>
              <span className="repair-track__mail" aria-hidden="true" />
            </div>
          </aside>
        </section>
      </main>
    </div>
  );
}
