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
  position: relative;
}

#site-header .header-avatar {
  width: 32px; height: 32px;
  border-radius: 50%;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  display: flex; align-items: center; justify-content: center;
  font-size: 0.75rem; font-weight: 700; color: white;
  text-transform: uppercase;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  border: 2px solid transparent;
  user-select: none;
  overflow: hidden;
  flex-shrink: 0;
}
#site-header .header-avatar img {
  width: 100%; height: 100%;
  object-fit: cover;
  border-radius: 50%;
  display: block;
}
#site-header .header-avatar:hover {
  transform: scale(1.1);
  box-shadow: 0 0 0 3px rgba(99,102,241,0.35);
  border-color: rgba(99,102,241,0.5);
}

#site-header .header-role-badge {
  font-size: 0.7rem;
  padding: 0.2rem 0.6rem;
  border-radius: 99px;
  font-weight: 600;
}

#site-header .header-role-badge.admin   { background: rgba(239,68,68,0.15); color: #f87171; border: 1px solid rgba(239,68,68,0.2); }
#site-header .header-role-badge.manager { background: rgba(59,130,246,0.15); color: #60a5fa; border: 1px solid rgba(59,130,246,0.2); }

#site-header .header-date {
  font-size: 0.75rem;
  color: var(--text-secondary, #94a3b8);
  display: none;
}

@media (min-width: 1100px) {
  #site-header .header-date { display: block; }
}

/* ─── Profile Dropdown Panel ────────────────────────────────────────────── */
#profile-dropdown {
  position: fixed;
  top: 64px;
  right: 1.5rem;
  width: 300px;
  background: rgba(15, 20, 40, 0.97);
  backdrop-filter: blur(28px);
  -webkit-backdrop-filter: blur(28px);
  border: 1px solid rgba(99,102,241,0.25);
  border-radius: 16px;
  box-shadow: 0 24px 48px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04);
  z-index: 1000;
  overflow: hidden;
  opacity: 0;
  transform: translateY(-8px) scale(0.97);
  pointer-events: none;
  transition: opacity 0.22s ease, transform 0.22s ease;
}
#profile-dropdown.open {
  opacity: 1;
  transform: translateY(0) scale(1);
  pointer-events: auto;
}

.profile-header-section {
  background: linear-gradient(135deg, rgba(99,102,241,0.18) 0%, rgba(139,92,246,0.12) 100%);
  border-bottom: 1px solid rgba(255,255,255,0.06);
  padding: 1.4rem 1.25rem 1.2rem;
  display: flex;
  align-items: center;
  gap: 1rem;
}

.profile-avatar-wrap {
  position: relative;
  width: 64px; height: 64px;
  flex-shrink: 0;
  cursor: pointer;
}

.profile-big-avatar {
  width: 64px; height: 64px;
  border-radius: 50%;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  display: flex; align-items: center; justify-content: center;
  font-size: 1.5rem; font-weight: 700; color: white;
  text-transform: uppercase;
  box-shadow: 0 4px 14px rgba(99,102,241,0.4);
  border: 2px solid rgba(99,102,241,0.5);
  overflow: hidden;
  transition: filter 0.2s;
}
.profile-big-avatar img {
  width: 100%; height: 100%;
  object-fit: cover;
  border-radius: 50%;
  display: block;
}
.profile-avatar-wrap:hover .profile-big-avatar { filter: brightness(0.6); }

.profile-camera-overlay {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  opacity: 0;
  transition: opacity 0.2s;
  pointer-events: none;
}
.profile-avatar-wrap:hover .profile-camera-overlay { opacity: 1; }
.profile-camera-overlay svg { color: #fff; }
.profile-camera-label {
  font-size: 0.55rem;
  font-weight: 700;
  color: #fff;
  letter-spacing: 0.5px;
  text-transform: uppercase;
}

.profile-photo-uploading {
  position: absolute;
  inset: 0; border-radius: 50%;
  background: rgba(99,102,241,0.6);
  display: flex; align-items: center; justify-content: center;
  font-size: 0.6rem; color: white; font-weight: 700;
}

.profile-info-name {
  font-size: 0.95rem;
  font-weight: 700;
  color: #f1f5f9;
  line-height: 1.3;
  margin-bottom: 0.2rem;
}

.profile-info-email {
  font-size: 0.72rem;
  color: #64748b;
  word-break: break-all;
}

.profile-body {
  padding: 1rem 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.profile-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.6rem 0.75rem;
  border-radius: 10px;
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.05);
  transition: background 0.15s;
}
.profile-row:hover { background: rgba(255,255,255,0.06); }

.profile-row-label {
  font-size: 0.72rem;
  color: #64748b;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.profile-row-value {
  font-size: 0.78rem;
  color: #cbd5e1;
  font-weight: 600;
  text-align: right;
  max-width: 160px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.profile-joincode {
  font-family: 'Courier New', monospace;
  letter-spacing: 2px;
  color: #818cf8 !important;
  background: rgba(99,102,241,0.1);
  padding: 0.15rem 0.5rem;
  border-radius: 6px;
  font-size: 0.8rem !important;
  cursor: pointer;
  border: 1px solid rgba(99,102,241,0.25);
  transition: background 0.15s;
}
.profile-joincode:hover { background: rgba(99,102,241,0.2); }

.profile-footer {
  padding: 0.85rem 1.25rem;
  border-top: 1px solid rgba(255,255,255,0.05);
}

.profile-logout-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.65rem 1rem;
  border-radius: 10px;
  border: 1px solid rgba(239,68,68,0.25);
  background: rgba(239,68,68,0.08);
  color: #f87171;
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s ease, transform 0.15s ease;
  font-family: inherit;
}
.profile-logout-btn:hover {
  background: rgba(239,68,68,0.18);
  transform: translateY(-1px);
}
.profile-logout-btn:active { transform: translateY(0); }

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
  #profile-dropdown { right: 0.75rem; width: calc(100vw - 1.5rem); }
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
  const joinCode     = localStorage.getItem('stocksense_joinCode') || '';
  const user = JSON.parse(localStorage.getItem('stocksense_user') || '{}');
  const userName = user.name    || 'User';
  const photoURL = user.photoURL || '';
  const role     = user.role    || '';
  const initial  = userName.charAt(0).toUpperCase();
  const today    = new Date().toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
  const roleLower = role.toLowerCase();
  const roleLabel = role || '—';

  // Small avatar: show photo or initial
  const smallAvatarInner = photoURL
    ? `<img src="${photoURL}" alt="${escHtml(userName)}">`
    : initial;

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
        <div class="header-avatar" id="profile-avatar-btn" title="View Profile">${smallAvatarInner}</div>
        <span>${escHtml(userName)}</span>
        <span class="header-role-badge ${roleLower}">${roleLabel}</span>
      </div>
    </div>
  `;

  // ── Inject Profile Dropdown ──────────────────────────────────────────────
  let dropdown = document.getElementById('profile-dropdown');
  if (!dropdown) {
    dropdown = document.createElement('div');
    dropdown.id = 'profile-dropdown';
    document.body.appendChild(dropdown);
  }

  // Format member since date
  let memberSince = '—';
  if (user.createdAt) {
    const ts = user.createdAt;
    const d = ts?._seconds ? new Date(ts._seconds * 1000)
            : ts?.seconds  ? new Date(ts.seconds  * 1000)
            : new Date(ts);
    if (!isNaN(d.getTime())) memberSince = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  const roleColors = { admin: '#f87171', manager: '#60a5fa' };
  const roleColor  = roleColors[roleLower] || '#94a3b8';

  // Big avatar in dropdown: photo or initial + camera overlay
  const bigAvatarInner = photoURL
    ? `<img src="${photoURL}" alt="${escHtml(userName)}">`
    : initial;

  dropdown.innerHTML = `
    <div class="profile-header-section">
      <div class="profile-avatar-wrap" id="profile-photo-btn" title="Change photo">
        <div class="profile-big-avatar" id="profile-big-avatar">${bigAvatarInner}</div>
        <div class="profile-camera-overlay">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
            <circle cx="12" cy="13" r="4"/>
          </svg>
          <span class="profile-camera-label">Change</span>
        </div>
      </div>
      <div>
        <div class="profile-info-name">${escHtml(userName)}</div>
        <div class="profile-info-email">${escHtml(user.email || '—')}</div>
      </div>
    </div>
    <div class="profile-body">
      <div class="profile-row">
        <span class="profile-row-label">👤 Role</span>
        <span class="profile-row-value" style="color:${roleColor}">${roleLabel}</span>
      </div>
      <div class="profile-row">
        <span class="profile-row-label">🏢 Business</span>
        <span class="profile-row-value">${escHtml(businessName || '—')}</span>
      </div>
      ${(role === 'Admin' || role === 'Manager') && joinCode ? `
      <div class="profile-row">
        <span class="profile-row-label">🔑 Join Code</span>
        <span class="profile-row-value profile-joincode" id="profile-joincode-copy" title="Click to copy">${escHtml(joinCode)}</span>
      </div>` : ''}
      <div class="profile-row">
        <span class="profile-row-label">📅 Member Since</span>
        <span class="profile-row-value">${memberSince}</span>
      </div>
    </div>
    <div class="profile-footer">
      <button class="profile-logout-btn" id="profile-logout-btn">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
        Sign Out
      </button>
    </div>
  `;

  // Hidden file input for photo upload
  let fileInput = document.getElementById('profile-photo-file-input');
  if (!fileInput) {
    fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.id   = 'profile-photo-file-input';
    fileInput.accept = 'image/*';
    fileInput.style.display = 'none';
    document.body.appendChild(fileInput);
  }

  // ── Photo Upload Logic ──────────────────────────────────────────────────
  document.getElementById('profile-photo-btn')?.addEventListener('click', (e) => {
    e.stopPropagation();
    fileInput.click();
  });

  fileInput.onchange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    fileInput.value = ''; // reset so same file can be picked again

    // Compress image using Canvas
    const wrap = document.getElementById('profile-photo-btn');
    if (wrap) {
      const uploading = document.createElement('div');
      uploading.className = 'profile-photo-uploading';
      uploading.textContent = '⏳';
      wrap.appendChild(uploading);
    }

    try {
      const dataURL = await compressImage(file, 300, 0.82);

      // Upload to server
      const result = await API.auth.updateProfile({ photoURL: dataURL });

      // Update localStorage with fresh user data
      const updatedUser = { ...user, photoURL: dataURL, ...result.user };
      localStorage.setItem('stocksense_user', JSON.stringify(updatedUser));

      // Update all avatars on page without full re-render
      document.querySelectorAll('.header-avatar, .header-avatar img').forEach(el => {
        if (el.tagName === 'IMG') { el.src = dataURL; }
        else {
          el.innerHTML = `<img src="${dataURL}" alt="${escHtml(userName)}">`;
        }
      });
      const bigAv = document.getElementById('profile-big-avatar');
      if (bigAv) bigAv.innerHTML = `<img src="${dataURL}" alt="${escHtml(userName)}">`;

      if (typeof showToast === 'function') showToast('Profile picture updated! 🎉', 'success');
    } catch (err) {
      if (typeof showToast === 'function') showToast(err.message || 'Upload failed', 'error');
    } finally {
      document.querySelector('.profile-photo-uploading')?.remove();
    }
  };

  // ── Toggle Logic ────────────────────────────────────────────────────────
  const avatarBtn = document.getElementById('profile-avatar-btn');
  let isOpen = false;

  function openDropdown() {
    dropdown.classList.add('open');
    isOpen = true;
  }
  function closeDropdown() {
    dropdown.classList.remove('open');
    isOpen = false;
  }

  avatarBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    isOpen ? closeDropdown() : openDropdown();
  });

  // Close on outside click
  document.addEventListener('click', (e) => {
    if (isOpen && !dropdown.contains(e.target)) closeDropdown();
  });

  // Close on Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isOpen) closeDropdown();
  });

  // Copy join code on click
  document.getElementById('profile-joincode-copy')?.addEventListener('click', () => {
    navigator.clipboard.writeText(joinCode).then(() => {
      if (typeof showToast === 'function') showToast('Join code copied!', 'success');
    }).catch(() => {});
  });

  // Logout button inside dropdown
  document.getElementById('profile-logout-btn')?.addEventListener('click', () => {
    if (typeof logout === 'function') logout();
  });
}

// ── Image Compression via Canvas ──────────────────────────────────────────
function compressImage(file, maxSizePx = 300, quality = 0.82) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let w = img.width, h = img.height;
        // Scale down if larger than maxSizePx
        if (w > maxSizePx || h > maxSizePx) {
          if (w > h) { h = Math.round(h * maxSizePx / w); w = maxSizePx; }
          else       { w = Math.round(w * maxSizePx / h); h = maxSizePx; }
        }
        canvas.width  = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
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

