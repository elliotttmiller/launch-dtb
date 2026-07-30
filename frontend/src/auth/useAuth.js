/**
 * frontend/src/auth/useAuth.js
 *
 * Cookie-based storefront authentication. Browser code never receives or stores
 * the raw token; the server sets an HttpOnly cookie and /validate confirms it.
 */

import { useState, useEffect, useCallback, useRef } from 'react';

const AUTH_BASE_PATH = '/wp-json/dtb/v1/auth';
const SESSION_SYNC_ERROR = 'Sign-in succeeded, but the server session could not be confirmed. Please try again; if it continues, contact support so we can inspect the auth session handoff.';
const SESSION_COOKIE_ERROR = 'Sign-in succeeded, but the server could not establish the secure browser session. Please try again.';
const CHECKOUT_SESSION_SYNC_ERROR = 'Your signed-in session is not ready for checkout yet. Please try again.';
const CHECKOUT_SESSION_CHANGED_ERROR = 'Your secure checkout identity changed while we reconciled your session. We refreshed your cart for safety. Review it, then select checkout again.';
const SESSION_VALIDATE_DELAYS_MS = [0, 150, 400, 800, 1500, 2500];
const PUBLIC_ENV = {
  REACT_APP_API_BASE_URL: process.env.REACT_APP_API_BASE_URL,
  REACT_APP_SITE_URL: process.env.REACT_APP_SITE_URL,
};

function readPublicEnv(name) {
  if (typeof window !== 'undefined') {
    const runtimeEnv = window.DTB_PUBLIC_ENV || window.dtbPublicEnv || {};
    if (typeof runtimeEnv[name] === 'string') return runtimeEnv[name];
  }
  if (typeof PUBLIC_ENV[name] === 'string') return PUBLIC_ENV[name];
  return '';
}

function trimSlash(value = '') {
  return String(value || '').replace(/\/+$/, '');
}

/**
 * Resolve the auth authority.
 *
 * Production authentication must remain first-party so modern browser cookie
 * restrictions cannot block the HttpOnly session between /login and /validate.
 * The configured remote API origin is retained only for explicit hosted preview
 * environments such as GitHub Pages.
 */
function baseUrl() {
  const runtimeHost = typeof window !== 'undefined' ? window.location.hostname : '';
  const runtimeOrigin = typeof window !== 'undefined' ? window.location.origin : '';
  const hostedPreview = /github\.io$/i.test(runtimeHost);

  if (!hostedPreview && runtimeOrigin) return trimSlash(runtimeOrigin);

  return trimSlash(readPublicEnv('REACT_APP_API_BASE_URL'))
    || (hostedPreview ? 'https://elliottm4.sg-host.com' : trimSlash(runtimeOrigin));
}

function authUrl(path) {
  const suffix = String(path || '').startsWith('/') ? path : `/${path}`;
  return `${baseUrl()}${AUTH_BASE_PATH}${suffix}`;
}

async function authJson(path, options = {}) {
  const method = options.method || 'POST';
  const headers = {
    Accept: 'application/json',
    'Cache-Control': 'no-store',
    Pragma: 'no-cache',
    ...(options.headers || {}),
  };
  if (options.body && !headers['Content-Type']) headers['Content-Type'] = 'application/json';

  const response = await fetch(authUrl(path), {
    ...options,
    method,
    headers,
    credentials: 'include',
    cache: 'no-store',
  });

  const text = await response.text();
  let data = null;
  if (text) {
    try { data = JSON.parse(text); }
    catch { throw { code: 'invalid_json_response', message: 'Authentication endpoint returned malformed JSON.', status: response.status }; }
  }

  if (!response.ok) {
    throw {
      code: data?.code || 'auth_error',
      message: data?.message || `Authentication request failed with status ${response.status}.`,
      status: response.status,
    };
  }

  return data || {};
}

const wait = (ms) => new Promise((resolve) => window.setTimeout(resolve, ms));

function emitLocalAuthChanged() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event('dtb:auth-changed'));
}

function emitAuthChanged(type) {
  if (typeof window === 'undefined') return;
  emitLocalAuthChanged();
  try { window.localStorage.setItem('dtb:auth-sync', JSON.stringify({ type, at: Date.now() })); }
  catch { /** storage may be unavailable */ }
}

function normalizeNativeCheckoutState(data) {
  const state = data?.session?.native_checkout || {};
  return {
    status: String(state.status || 'unknown'),
    ready: state.ready === true,
    cookieQueued: state.cookie_queued === true,
    cookieAlreadyValid: state.cookie_already_valid === true,
    identityConflictContained: state.identity_conflict_contained === true,
  };
}

function checkoutSessionError(code, message, state) {
  const error = new Error(message);
  error.name = 'CheckoutSessionError';
  error.code = code;
  error.checkoutSession = state;
  return error;
}

function sessionHandoffError(message, session = {}) {
  const error = new Error(message);
  error.name = 'AuthSessionHandoffError';
  error.code = 'auth_session_handoff_failed';
  error.session = {
    cookieQueued: session?.cookie_queued === true,
    cookieSameSite: String(session?.cookie_samesite || ''),
    cookieDomain: String(session?.cookie_domain || ''),
  };
  return error;
}

export function useAuth() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const epochRef = useRef(0);
  const nativeCheckoutStateRef = useRef(normalizeNativeCheckoutState(null));

  const validateSession = useCallback(async ({ retries = 0, publish = false, epoch = null } = {}) => {
    const activeEpoch = epoch ?? epochRef.current;
    const attempts = Math.max(1, retries + 1);

    for (let attempt = 0; attempt < attempts; attempt += 1) {
      const delay = SESSION_VALIDATE_DELAYS_MS[Math.min(attempt, SESSION_VALIDATE_DELAYS_MS.length - 1)];
      if (delay > 0) await wait(delay);

      const data = await authJson('/validate', { method: 'POST' });
      const nextUser = data?.authenticated === false ? null : data?.user || null;
      nativeCheckoutStateRef.current = normalizeNativeCheckoutState(data);
      if (nextUser) {
        if (epochRef.current === activeEpoch) {
          setUser(nextUser);
          if (publish) emitAuthChanged('login');
        }
        return { user: nextUser, nativeCheckout: nativeCheckoutStateRef.current, session: data?.session || {} };
      }
    }

    nativeCheckoutStateRef.current = normalizeNativeCheckoutState(null);
    if (epochRef.current === activeEpoch) {
      setUser(null);
      if (publish) emitAuthChanged('logout');
    }
    return { user: null, nativeCheckout: nativeCheckoutStateRef.current, session: {} };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const epoch = ++epochRef.current;
    setIsLoading(true);
    validateSession({ epoch })
      .catch(() => { if (!cancelled && epochRef.current === epoch) setUser(null); })
      .finally(() => { if (!cancelled && epochRef.current === epoch) setIsLoading(false); });
    return () => { cancelled = true; };
  }, [validateSession]);

  const logout = useCallback(async ({ remote = true, publish = true } = {}) => {
    const epoch = ++epochRef.current;
    setError(null);
    setIsLoading(remote);

    try {
      if (remote) {
        const result = await authJson('/logout', { method: 'DELETE' });
        if (result?.success !== true) throw new Error('The server did not confirm sign out. Please try again.');
      }

      nativeCheckoutStateRef.current = normalizeNativeCheckoutState(null);
      if (epochRef.current === epoch) {
        setUser(null);
        if (publish) emitAuthChanged('logout');
      }
      return true;
    } catch (logoutError) {
      if (epochRef.current === epoch) setError(logoutError?.message || 'Unable to sign out securely. Please try again.');
      throw logoutError;
    } finally {
      if (epochRef.current === epoch) setIsLoading(false);
    }
  }, []);

  const updateUser = useCallback((nextUser) => {
    setUser((current) => ({ ...(current || {}), ...(nextUser || {}) }));
  }, []);

  useEffect(() => {
    const handler = () => { void logout().catch(() => logout({ remote: false })); };
    window.addEventListener('auth:expired', handler);
    return () => window.removeEventListener('auth:expired', handler);
  }, [logout]);

  useEffect(() => {
    const handler = (event) => {
      if (event.key !== 'dtb:auth-sync' || !event.newValue) return;
      try {
        const payload = JSON.parse(event.newValue);
        if (payload?.type === 'logout') {
          void logout({ remote: false, publish: false }).catch(() => null).finally(emitLocalAuthChanged);
        }
        if (payload?.type === 'login') {
          void validateSession({ retries: 2 }).catch(() => null).finally(emitLocalAuthChanged);
        }
      } catch { /** ignore */ }
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, [logout, validateSession]);

  const login = useCallback(async (email, password) => {
    const epoch = ++epochRef.current;
    setError(null);
    setIsLoading(true);
    try {
      const data = await authJson('/login', { method: 'POST', body: JSON.stringify({ email, password }) });
      if (!data?.success || !data?.user) throw new Error(data?.message || 'Login failed.');
      if (data?.session?.cookie_queued !== true) throw sessionHandoffError(SESSION_COOKIE_ERROR, data?.session);
      const confirmed = await validateSession({ retries: 5, publish: true, epoch });
      if (!confirmed.user) throw sessionHandoffError(SESSION_SYNC_ERROR, data?.session);
      return { ...data, user: confirmed.user, nativeCheckoutReady: confirmed.nativeCheckout.ready };
    } catch (err) {
      if (epochRef.current === epoch) {
        setUser(null);
        setError(err?.message || 'Login failed.');
      }
      throw err;
    } finally {
      if (epochRef.current === epoch) setIsLoading(false);
    }
  }, [validateSession]);

  const register = useCallback(async ({ firstName, lastName, email, password }) => {
    const epoch = ++epochRef.current;
    setError(null);
    setIsLoading(true);
    try {
      const data = await authJson('/register', {
        method: 'POST',
        body: JSON.stringify({ first_name: firstName, last_name: lastName, email, password }),
      });
      if (!data?.success || !data?.user) throw new Error(data?.message || 'Registration failed.');
      if (data?.session?.cookie_queued !== true) throw sessionHandoffError(SESSION_COOKIE_ERROR, data?.session);
      const confirmed = await validateSession({ retries: 5, publish: true, epoch });
      if (!confirmed.user) throw sessionHandoffError(SESSION_SYNC_ERROR, data?.session);
      return { ...data, user: confirmed.user, nativeCheckoutReady: confirmed.nativeCheckout.ready };
    } catch (err) {
      if (epochRef.current === epoch) {
        setUser(null);
        setError(err?.message || 'Registration failed.');
      }
      throw err;
    } finally {
      if (epochRef.current === epoch) setIsLoading(false);
    }
  }, [validateSession]);

  const ensureNativeCheckoutReady = useCallback(async () => {
    const confirmed = await validateSession({ retries: 2 });
    const state = confirmed.nativeCheckout;
    if (!confirmed.user) throw checkoutSessionError('checkout_identity_unconfirmed', CHECKOUT_SESSION_SYNC_ERROR, state);
    if (state.identityConflictContained) {
      throw checkoutSessionError('checkout_identity_reconciled', CHECKOUT_SESSION_CHANGED_ERROR, state);
    }
    if (state.ready !== true || !['aligned', 'bridged'].includes(state.status)) {
      throw checkoutSessionError('checkout_identity_not_ready', CHECKOUT_SESSION_SYNC_ERROR, state);
    }
    return { user: confirmed.user, nativeCheckout: state };
  }, [validateSession]);

  const forgotPassword = useCallback(async (email) => {
    setError(null);
    try {
      const spaUrl = readPublicEnv('REACT_APP_SITE_URL') || (typeof window !== 'undefined' ? window.location.origin : '');
      return await authJson('/forgot-password', { method: 'POST', body: JSON.stringify({ email, ...(spaUrl ? { spa_url: spaUrl } : {}) }) });
    } catch (err) {
      setError(err?.message || 'Request failed.');
      throw err;
    }
  }, []);

  const resetPassword = useCallback(async (key, loginName, password) => {
    setError(null);
    try {
      return await authJson('/reset-password', { method: 'POST', body: JSON.stringify({ key, login: loginName, password }) });
    } catch (err) {
      setError(err?.message || 'Password reset failed.');
      throw err;
    }
  }, []);

  return {
    user,
    isAuthenticated: Boolean(user),
    isLoading,
    login,
    logout,
    register,
    forgotPassword,
    resetPassword,
    updateUser,
    refreshSession: validateSession,
    ensureNativeCheckoutReady,
    error,
  };
}

export default useAuth;
