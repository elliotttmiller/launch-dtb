/**
 * frontend/src/pages/ResetPassword.jsx
 *
 * Password reset form reached from the link emailed by /forgot-password.
 *
 * Reads `key` and `login` from the URL query string via useSearchParams.
 * Displays a form with password + confirm-password fields.
 * On success, shows a confirmation with a link to /login.
 * On failure (invalid/expired key), shows an error with a link to /forgot-password.
 *
 * Auth:
 *   Calls useAuthContext().resetPassword(key, login, password)
 *   → POST /dtb/v1/auth/reset-password
 */

import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { m as Motion, AnimatePresence } from 'framer-motion';
import { KeyRound, Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react';

import { useAuthContext } from '../auth/AuthContext.js';
import { dtbDuration, dtbEase } from '../motion/dtbMotion.js';
import '../styles/auth-form-templates.css';

const cardVariants = {
  hidden: { opacity: 0, y: 18, scale: 0.985 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: dtbDuration.normal, ease: dtbEase.standard },
  },
};

const noticeVariants = {
  initial: { opacity: 0, y: -6, height: 0 },
  animate: {
    opacity: 1,
    y: 0,
    height: 'auto',
    transition: { duration: dtbDuration.normal, ease: dtbEase.standard },
  },
  exit: { opacity: 0, y: -4, height: 0, transition: { duration: dtbDuration.fast } },
};

function SubmitLoader() {
  return (
    <span className="dtb-auth-template__loader" aria-label="Resetting password">
      {[0, 1, 2].map((index) => (
        <Motion.span
          key={index}
          className="dtb-auth-template__loader-dot"
          animate={{ scale: [1, 1.45, 1], opacity: [0.45, 1, 0.45] }}
          transition={{ duration: 1.05, repeat: Infinity, delay: index * 0.17, ease: 'easeInOut' }}
        />
      ))}
    </span>
  );
}

export default function ResetPassword() {
  const { resetPassword } = useAuthContext();
  const [searchParams] = useSearchParams();

  const resetKey = searchParams.get('key') || '';
  const resetLogin = searchParams.get('login') || '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  // If the URL is missing the required params, show a broken-link notice.
  const missingParams = !resetKey || !resetLogin;

  const confirmMismatch = confirm.length > 0 && confirm !== password;
  const confirmMatch = confirm.length > 0 && confirm === password;

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitError(null);

    if (password !== confirm) {
      setSubmitError('Passwords do not match.');
      return;
    }
    if (password.length < 8) {
      setSubmitError('Password must be at least 8 characters.');
      return;
    }

    setSubmitting(true);
    try {
      await resetPassword(resetKey, resetLogin, password);
      setSuccess(true);
    } catch (err) {
      setSubmitError(err.message || 'This link is invalid or has expired.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="page-wrapper dtb-auth-template dtb-auth-template--recovery">
      <Motion.section
        className="dtb-auth-template__card"
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        aria-labelledby="reset-password-title"
      >
        <header className="dtb-auth-template__header">
          <span className="dtb-auth-template__icon" aria-hidden="true">
            <KeyRound size={20} strokeWidth={1.9} />
          </span>
          <h1 id="reset-password-title" className="dtb-auth-template__title">Set new password</h1>
          <p className="dtb-auth-template__subtitle">Choose a new password for your account.</p>
        </header>

        {missingParams && (
          <div className="dtb-auth-template__error" role="alert">
            <AlertCircle size={16} />
            <div>
              <p style={{ margin: '0 0 6px' }}>This reset link is incomplete or has expired.</p>
              <Link className="dtb-auth-template__link" to="/forgot-password">
                Request a new reset link →
              </Link>
            </div>
          </div>
        )}

        {!missingParams && success && (
          <Motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <div className="dtb-auth-template__success" role="status">
              <CheckCircle size={18} />
              <div>
                <strong>Password updated!</strong>
                <p>You can now sign in with your new password.</p>
              </div>
            </div>

            <Link
              to="/login"
              className="dtb-auth-template__submit"
              style={{ textDecoration: 'none', marginTop: '18px' }}
            >
              Sign In
            </Link>
          </Motion.div>
        )}

        {!missingParams && !success && (
          <>
            <AnimatePresence initial={false}>
              {submitError ? (
                <Motion.div
                  className="dtb-auth-template__error"
                  variants={noticeVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  role="alert"
                >
                  <AlertCircle size={16} />
                  <div>
                    <p style={{ margin: '0 0 6px' }}>{submitError}</p>
                    <Link className="dtb-auth-template__link" to="/forgot-password">
                      Request a new reset link
                    </Link>
                  </div>
                </Motion.div>
              ) : null}
            </AnimatePresence>

            <form className="dtb-auth-template__form" onSubmit={handleSubmit}>
              <div className="dtb-auth-field">
                <label className="dtb-auth-field__label" htmlFor="rp-password">New Password</label>
                <div className="dtb-auth-field__control">
                  <input
                    id="rp-password"
                    className="dtb-auth-field__input has-action"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="At least 8 characters"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                    autoComplete="new-password"
                    disabled={submitting}
                  />
                  <button
                    className="dtb-auth-field__action"
                    type="button"
                    onClick={() => setShowPassword((visible) => !visible)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    aria-pressed={showPassword}
                    disabled={submitting}
                  >
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </div>

              <div className="dtb-auth-field">
                <label className="dtb-auth-field__label" htmlFor="rp-confirm">Confirm Password</label>
                <div className="dtb-auth-field__control">
                  <input
                    id="rp-confirm"
                    className="dtb-auth-field__input has-action"
                    type={showConfirm ? 'text' : 'password'}
                    placeholder="Repeat your new password"
                    value={confirm}
                    onChange={(event) => setConfirm(event.target.value)}
                    required
                    autoComplete="new-password"
                    disabled={submitting}
                    style={confirmMismatch ? { borderColor: '#f87171' } : undefined}
                  />
                  {confirmMatch && (
                    <CheckCircle
                      size={16}
                      style={{
                        position: 'absolute', right: '44px', top: '50%',
                        transform: 'translateY(-50%)', color: '#16a34a',
                      }}
                    />
                  )}
                  <button
                    className="dtb-auth-field__action"
                    type="button"
                    onClick={() => setShowConfirm((visible) => !visible)}
                    aria-label={showConfirm ? 'Hide confirm password' : 'Show confirm password'}
                    aria-pressed={showConfirm}
                    disabled={submitting}
                  >
                    {showConfirm ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
                <AnimatePresence>
                  {confirmMismatch && (
                    <Motion.p
                      className="dtb-auth-template__field-message"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      style={{ overflow: 'hidden' }}
                    >
                      Passwords don&apos;t match
                    </Motion.p>
                  )}
                </AnimatePresence>
              </div>

              <button className="dtb-auth-template__submit" type="submit" disabled={submitting}>
                {submitting ? <SubmitLoader /> : 'Reset Password'}
              </button>
            </form>
          </>
        )}
      </Motion.section>
    </main>
  );
}
