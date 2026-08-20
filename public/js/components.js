/**
 * components.js — Shared UI components for StockSense
 * Renders dynamic header and footer on every page.
 * Business name is automatically read from localStorage.
 */

// ── Add component styles ───────────────────────────────────────────────────
const compStyles = document.createElement('style');
compStyles.innerHTML = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

/* ─── Site Header ──────────────────────────────────────────────────────── */
#site-header {
  position: fixed;
  top: 0; left: 0; right: 0;
  height: 56px;
  background: rgba(10, 14, 26, 0.92);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border-bottom: 1px solid rgba(99,102,241,0.2);
  display: flex;
  align-items: center;
  justify-content: space-between;
  /* Left padding = sidebar width so content aligns with main-content */
  padding: 0 1.5rem 0 calc(var(--sidebar-width, 260px) + 1.5rem);
  z-index: 200;
  transition: all 0.3s ease;
}

#site-header .header-left {
  display: flex;
  align-items: center;
  gap: 1rem;
}

#site-header .business-name-header {
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--primary, #6366f1);
  background: rgba(99,102,241,0.1);
  border: 1px solid rgba(99,102,241,0.25);
  padding: 0.3rem 0.85rem;
  border-radius: 20px;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  animation: fadeIn 0.4s ease;
  max-width: 220px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

#site-header .header-right {
  display: flex;
  align-items: center;
  gap: 1rem;
}

#site-header .header-user-badge {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  font-size: 0.82rem;
  color: var(--text-secondary, #94a3b8);
}

#site-header .header-avatar {
  width: 32px; height: 32px;
  border-radius: 50%;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  display: flex; align-items: center; justify-content: center;
  font-size: 0.75rem; font-weight: 700; color: white;
  text-transform: uppercase;
}

#site-header .header-role-badge {
  font-size: 0.7rem;
  padding: 0.2rem 0.6rem;
  border-radius: 99px;
  font-weight: 600;
}

#site-header .header-role-badge.admin   { background: rgba(239,68,68,0.15); color: #f87171; border: 1px solid rgba(239,68,68,0.2); }
#site-header .header-role-badge.manager { background: rgba(59,130,246,0.15); color: #60a5fa; border: 1px solid rgba(59,130,246,0.2); }
#site-header .header-role-badge.staff   { background: rgba(16,185,129,0.15); color: #34d399; border: 1px solid rgba(16,185,129,0.2); }

#site-header .header-date {
  font-size: 0.75rem;
  color: var(--text-secondary, #94a3b8);
  display: none;
}

@media (min-width: 1100px) {
  #site-header .header-date { display: block; }
}

/* ─── Site Footer ──────────────────────────────────────────────────────── */
#site-footer {
  margin-left: var(--sidebar-width, 260px);
  border-top: 1px solid rgba(255,255,255,0.05);
  padding: 1.25rem 3rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 0.75rem;
  background: rgba(0,0,0,0.15);
}

#site-footer .footer-brand {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8rem;
  color: var(--text-secondary, #94a3b8);
}

#site-footer .footer-business {
  color: var(--primary, #6366f1);
  font-weight: 600;
}

#site-footer .footer-links {
  display: flex;
  gap: 1.5rem;
  font-size: 0.75rem;
  color: #475569;
}

#site-footer .footer-links a {
  color: #475569;
  text-decoration: none;
  transition: color 0.2s;
}
#site-footer .footer-links a:hover { color: var(--primary, #6366f1); }

#site-footer .footer-powered {
  font-size: 0.72rem;
  color: #334155;
}

/* Adjust main content to account for fixed header */
.main-content {
  padding-top: calc(56px + 2rem) !important;
}

/* Auth page: no header/footer adjustments needed */
.auth-layout ~ #site-footer { display: none; }

@media (max-width: 768px) {
  #site-header {
    padding: 0 1rem 0 1rem;
  }
  #site-footer {
    margin-left: 0;
    padding: 1rem;
    flex-direction: column;
    align-items: flex-start;
  }
  #site-header .business-name-header { display: none; }
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateX(-6px); }
  to   { opacity: 1; transform: translateX(0); }
}
`;
document.head.appendChild(compStyles);

// ── Render Dynamic Header ─────────────────────────────────────────────────
function renderHeader() {
  const headerEl = document.getElementById('site-header');
  if (!headerEl) return;

  const businessName = localStorage.getItem('stocksense_businessName') || '';
  const user = JSON.parse(localStorage.getItem('stocksense_user') || '{}');
  const userName = user.name || 'User';
  const role = user.role || '';
  const initial = userName.charAt(0).toUpperCase();
  const today = new Date().toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });

  const roleLower = role.toLowerCase();
  const roleLabel = role || '—';

  headerEl.innerHTML = `
    <div class="header-left">
      ${businessName ? `
        <div class="business-name-header">
          🏢 <span>${escHtml(businessName)}</span>
        </div>
      ` : ''}
    </div>
    <div class="header-right">
      <span class="header-date">📅 ${today}</span>
      <div class="header-user-badge">
        <div class="header-avatar">${initial}</div>
        <span>${escHtml(userName)}</span>
        <span class="header-role-badge ${roleLower}">${roleLabel}</span>
      </div>
    </div>
  `;
}

// ── Render Dynamic Footer ─────────────────────────────────────────────────
function renderFooter() {
  const footerEl = document.getElementById('site-footer');
  if (!footerEl) return;

  const businessName = localStorage.getItem('stocksense_businessName') || 'Your Business';
  const year = new Date().getFullYear();

  footerEl.innerHTML = `
    <div class="footer-brand">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6366f1" stroke-width="2">
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
      </svg>
      <span class="footer-business">${escHtml(businessName)}</span>
      <span style="color:#334155">·</span>
      <span>© ${year} All rights reserved</span>
    </div>
    <div class="footer-links">
      <a href="#">Help</a>
      <a href="#">Privacy</a>
      <a href="#">Contact</a>
    </div>
    <div class="footer-powered">Powered by <strong style="color:#6366f1">StockSense</strong> — Smart Inventory</div>
  `;
}

// ── Sidebar Logo Update ───────────────────────────────────────────────────
// The logo SVG is hardcoded inline in each HTML page's .sidebar-logo div,
// so it renders immediately without waiting for JS. This function only
// updates the business name badge below the logo.
function renderSidebarLogo() {
  const businessBadge = document.getElementById('business-name-badge');
  const businessNameText = document.getElementById('business-name-text');
  if (businessBadge && businessNameText) {
    const name = localStorage.getItem('stocksense_businessName') || '';
    if (name) {
      businessNameText.textContent = name;
      businessBadge.style.display = 'block';
    }
  }
}

// ── API extension for notices ─────────────────────────────────────────────
function extendApi() {
  if (typeof API !== 'undefined' && !API.notices) {
    API.notices = {
      getAll:  () => apiFetch('/api/notices'),
      post:    (data) => apiFetch('/api/notices', { method: 'POST', body: JSON.stringify(data) }),
      delete:  (id) => apiFetch(`/api/notices/${id}`, { method: 'DELETE' }),
    };
  }
}

// ── Helper: Escape HTML ───────────────────────────────────────────────────
function escHtml(str) {
  const d = document.createElement('div');
  d.textContent = str;
  return d.innerHTML;
}

// ── Initialize on DOM Ready ───────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  renderHeader();
  renderFooter();
  renderSidebarLogo();
  extendApi();
});

// Public refresh function (call after login to update with business name)
window.refreshBranding = function () {
  renderHeader();
  renderFooter();
  renderSidebarLogo();
};
