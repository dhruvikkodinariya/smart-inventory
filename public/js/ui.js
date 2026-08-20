// Inject UI styles
const uiStyles = document.createElement('style');
uiStyles.innerHTML = `
.toast-container {
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 9999;
    display: flex;
    flex-direction: column;
    gap: 10px;
}
.toast {
    background: rgba(255,255,255,0.05);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(255,255,255,0.08);
    color: #f1f5f9;
    padding: 12px 24px;
    border-radius: 8px;
    box-shadow: 0 10px 15px -3px rgba(0,0,0,0.5);
    transform: translateX(120%);
    transition: transform 0.3s ease;
    display: flex;
    align-items: center;
    gap: 12px;
}
.toast.show { transform: translateX(0); }
.toast.success { border-left: 4px solid #10b981; }
.toast.error { border-left: 4px solid #ef4444; }
.toast.warning { border-left: 4px solid #f59e0b; }
.toast.info { border-left: 4px solid #3b82f6; }

.confirm-overlay {
    position: fixed;
    top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(10, 14, 26, 0.8);
    backdrop-filter: blur(5px);
    z-index: 10000;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.3s;
}
.confirm-overlay.show { opacity: 1; pointer-events: auto; }
.confirm-box {
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.08);
    padding: 24px;
    border-radius: 12px;
    text-align: center;
    max-width: 400px;
    box-shadow: 0 20px 25px -5px rgba(0,0,0,0.5);
}
.confirm-actions {
    margin-top: 20px;
    display: flex;
    gap: 12px;
    justify-content: center;
}
`;
document.head.appendChild(uiStyles);

const toastContainer = document.createElement('div');
toastContainer.className = 'toast-container';
document.body.appendChild(toastContainer);

function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<span>${message}</span>`;
    toastContainer.appendChild(toast);
    
    setTimeout(() => toast.classList.add('show'), 10);
    
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function showSpinner(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.dataset.originalContent = container.innerHTML;
    container.innerHTML = '<div class="spinner"></div>';
}

function hideSpinner(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = container.dataset.originalContent || '';
}

function showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('show');
        modal.style.display = 'flex';
    }
}

function hideModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('show');
        setTimeout(() => {
            modal.style.display = 'none';
        }, 300);
    }
}

function showConfirm(message) {
    return new Promise((resolve) => {
        const overlay = document.createElement('div');
        overlay.className = 'confirm-overlay';
        overlay.innerHTML = `
            <div class="confirm-box">
                <p style="margin-bottom: 20px; color: #f1f5f9; font-size: 1.1rem;">${message}</p>
                <div class="confirm-actions">
                    <button class="btn-outline" id="confirm-cancel">Cancel</button>
                    <button class="btn-primary" id="confirm-ok">Confirm</button>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);
        setTimeout(() => overlay.classList.add('show'), 10);

        const cleanUp = (result) => {
            overlay.classList.remove('show');
            setTimeout(() => overlay.remove(), 300);
            resolve(result);
        };

        overlay.querySelector('#confirm-cancel').onclick = () => cleanUp(false);
        overlay.querySelector('#confirm-ok').onclick = () => cleanUp(true);
    });
}

function formatCurrency(amount) {
    if (amount === undefined || amount === null) return '₹0';
    return '₹' + Number(amount).toLocaleString('en-IN');
}

function formatDate(timestamp) {
    if (!timestamp) return '-';
    const date = timestamp.seconds ? new Date(timestamp.seconds * 1000) : new Date(timestamp);
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function setActiveNav(page) {
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    const activeEl = document.querySelector(`.nav-item[data-page="${page}"]`);
    if (activeEl) activeEl.classList.add('active');
}

function updateUserInfo() {
    const user = JSON.parse(localStorage.getItem('stocksense_user') || '{}');
    const nameEl = document.getElementById('user-name');
    const roleEl = document.getElementById('user-role');
    if (nameEl) nameEl.textContent = user.name || 'User';
    if (roleEl) roleEl.textContent = user.role || 'Role';
}

function checkAuth() {
    const token = localStorage.getItem('stocksense_token');
    const user = JSON.parse(localStorage.getItem('stocksense_user') || '{}');
    const isAuthPage = window.location.pathname.endsWith('index.html') || window.location.pathname === '/';
    const isHomePage = window.location.pathname.endsWith('home.html');

    if (!token && !isAuthPage) {
        window.location.href = 'index.html';
    } else if (token && isAuthPage) {
        // Redirect based on role
        if (user.role === 'Staff') {
            window.location.href = 'home.html';
        } else {
            window.location.href = 'dashboard.html';
        }
    }
}

window.logout = function() {
    localStorage.removeItem('stocksense_token');
    localStorage.removeItem('stocksense_user');
    localStorage.removeItem('stocksense_businessId');
    localStorage.removeItem('stocksense_businessName');
    localStorage.removeItem('stocksense_joinCode');
    window.location.href = 'index.html';
};

document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    updateUserInfo();

    // Refresh dynamic branding (header/footer) if components.js is loaded
    if (typeof refreshBranding === 'function') refreshBranding();

    // Setup modal close buttons
    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const modal = e.target.closest('.modal-overlay');
            if (modal) hideModal(modal.id);
        });
    });
});

