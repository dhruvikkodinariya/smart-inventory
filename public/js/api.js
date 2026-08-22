const API_BASE = '';

// ─── Auth Ready Promise ────────────────────────────────────────────────────
// Firebase restores auth session asynchronously on page load (~200-500ms).
// We wait for it before making any API calls to guarantee a valid token.
let _authReadyPromise = null;

function waitForAuthReady() {
  if (_authReadyPromise) return _authReadyPromise;
  _authReadyPromise = new Promise((resolve) => {
    if (typeof firebase === 'undefined') {
      resolve(null);
      return;
    }
    // onAuthStateChanged fires once immediately with the restored user (or null)
    const unsubscribe = firebase.auth().onAuthStateChanged((user) => {
      unsubscribe(); // unsubscribe after first call
      resolve(user);
    });
  });
  return _authReadyPromise;
}

// ─── Token Getter ──────────────────────────────────────────────────────────
async function getToken() {
  try {
    const user = await waitForAuthReady();
    if (user) {
      const freshToken = await user.getIdToken(true); // force refresh
      localStorage.setItem('stocksense_token', freshToken);
      return freshToken;
    }
  } catch (e) {
    console.warn('Token refresh failed:', e.message);
  }
  // Fallback to stored token (may be expired — user needs to re-login)
  return localStorage.getItem('stocksense_token');
}

// ─── Fetch Wrapper ─────────────────────────────────────────────────────────
async function apiFetch(endpoint, options = {}) {
  const token = await getToken();
  const response = await fetch(API_BASE + endpoint, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : '',
      ...options.headers
    }
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(err.error || `HTTP ${response.status}`);
  }
  return response.json();
}

// ─── API Methods ───────────────────────────────────────────────────────────
const API = {
  auth: {
    register:      (data) => apiFetch('/api/auth/register', { method: 'POST', body: JSON.stringify(data) }),
    login:         (data) => apiFetch('/api/auth/login',    { method: 'POST', body: JSON.stringify(data) }),
    updateProfile: (data) => apiFetch('/api/auth/profile',  { method: 'PUT',  body: JSON.stringify(data) })
  },
  products: {
    getAll:  (params) => apiFetch('/api/products' + (params ? '?' + new URLSearchParams(params) : '')),
    add:     (data)   => apiFetch('/api/products',        { method: 'POST',   body: JSON.stringify(data) }),
    update:  (id, data)=> apiFetch(`/api/products/${id}`, { method: 'PUT',    body: JSON.stringify(data) }),
    delete:  (id)     => apiFetch(`/api/products/${id}`,  { method: 'DELETE' })
  },
  inventory: {
    getAll:  ()       => apiFetch('/api/inventory'),
    update:  (id, data)=> apiFetch(`/api/inventory/${id}`, { method: 'PUT', body: JSON.stringify(data) })
  },
  sales: {
    log:    (data) => apiFetch('/api/sales',   { method: 'POST', body: JSON.stringify(data) }),
    getAll: ()     => apiFetch('/api/sales')
  },
  analytics: {
    deadStock:  () => apiFetch('/api/analytics/dead-stock'),
    lowStock:   () => apiFetch('/api/analytics/low-stock'),
    summary:    () => apiFetch('/api/analytics/summary'),
    salesTrend: () => apiFetch('/api/analytics/sales-trend'),
    byCategory: () => apiFetch('/api/analytics/by-category')
  },
  notices: {
    getAll: () => apiFetch('/api/notices'),
    post:   (data) => apiFetch('/api/notices', { method: 'POST', body: JSON.stringify(data) }),
    delete: (id)  => apiFetch(`/api/notices/${id}`, { method: 'DELETE' })
  },
  otp: {
    send:   (data) => apiFetch('/api/auth/send-otp',   { method: 'POST', body: JSON.stringify(data) }),
    verify: (data) => apiFetch('/api/auth/verify-otp', { method: 'POST', body: JSON.stringify(data) })
  },
  seed: () => apiFetch('/api/seed', { method: 'POST' })
};
