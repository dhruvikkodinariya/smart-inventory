document.addEventListener('DOMContentLoaded', async () => {
    const user = JSON.parse(localStorage.getItem('stocksense_user') || '{}');
    const role = user.role || 'Staff';
    const name = user.name || 'User';
    const businessName = localStorage.getItem('stocksense_businessName') || 'Your Business';

    // ── Welcome Banner ─────────────────────────────────────────────────────
    const hour = new Date().getHours();
    let greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
    const greetEl = document.getElementById('welcome-greeting');
    const subEl   = document.getElementById('welcome-sub');
    const bizEl   = document.getElementById('welcome-business-name');
    const roleBadge = document.getElementById('welcome-role-badge');

    if (greetEl) greetEl.textContent = `${greeting}, ${name}! 👋`;
    if (subEl)   subEl.textContent   = `Welcome to your ${role.toLowerCase()} dashboard — ${new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}`;
    if (bizEl)   bizEl.innerHTML     = `🏢 <span>${businessName}</span>`;
    if (roleBadge) {
        roleBadge.textContent = role;
        roleBadge.className   = `welcome-role-badge ${role.toLowerCase()}`;
    }

    // ── Sidebar Nav: show/hide based on role ──────────────────────────────
    if (role === 'Admin' || role === 'Manager') {
        ['nav-dashboard', 'nav-inventory', 'nav-analytics', 'nav-notices'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.style.display = 'block';
        });
        const manageLink = document.getElementById('manage-notices-link');
        if (manageLink) manageLink.style.display = 'inline-flex';
    }

    // ── Quick Links ────────────────────────────────────────────────────────
    const quickLinksGrid = document.getElementById('quick-links-grid');
    const links = [
        { href: 'sales.html', icon: '🛒', label: 'Log Sale' },
        { href: 'home.html', icon: '🔍', label: 'Stock Check' },
    ];
    if (role === 'Admin' || role === 'Manager') {
        links.push(
            { href: 'dashboard.html', icon: '📊', label: 'Dashboard' },
            { href: 'inventory.html', icon: '📦', label: 'Inventory' },
            { href: 'analytics.html', icon: '📈', label: 'Analytics' },
            { href: 'notices.html',   icon: '📌', label: 'Notices' }
        );
    }
    if (quickLinksGrid) {
        quickLinksGrid.innerHTML = links.map(l =>
            `<a href="${l.href}" class="quick-link-card">
                <span class="quick-link-icon">${l.icon}</span>
                <span class="quick-link-label">${l.label}</span>
            </a>`
        ).join('');
    }

    // ── Load Notices ───────────────────────────────────────────────────────
    const noticeList = document.getElementById('notice-list');
    try {
        const { notices } = await API.notices.getAll();
        if (!notices || notices.length === 0) {
            noticeList.innerHTML = '<div class="lookup-empty">📭 No notices posted yet.</div>';
        } else {
            // Sort pinned first
            const sorted = notices.sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));
            noticeList.innerHTML = sorted.map(n => `
                <div class="notice-card ${n.pinned ? 'pinned' : ''}">
                    <div class="notice-title">
                        ${n.pinned ? '📌 ' : ''}${escHtml(n.title)}
                    </div>
                    <div class="notice-body">${escHtml(n.body)}</div>
                    <div class="notice-meta">
                        <span>By ${escHtml(n.postedBy || 'Admin')}</span>
                        <span>${n.createdAt ? formatDate(n.createdAt) : ''}</span>
                        ${n.pinned ? '<span class="notice-pin-badge">Pinned</span>' : ''}
                    </div>
                </div>
            `).join('');
        }
    } catch (err) {
        noticeList.innerHTML = '<div class="lookup-empty" style="color:var(--text-secondary);">Unable to load notices.</div>';
    }

    // ── Quick Stock Lookup ─────────────────────────────────────────────────
    let allProducts = [];
    try {
        const resp = await API.products.getAll();
        allProducts = resp.products || resp || [];
    } catch (e) { allProducts = []; }

    const searchInput    = document.getElementById('stock-search');
    const lookupResults  = document.getElementById('lookup-results');
    const clearSearchBtn = document.getElementById('clear-search');
    let debounceTimer;

    function renderLookup(query) {
        query = query.trim().toLowerCase();
        if (!query) {
            lookupResults.innerHTML = '<div class="lookup-empty">Start typing to search products...</div>';
            return;
        }
        const matches = allProducts.filter(p =>
            (p.productName || p.name || '').toLowerCase().includes(query) ||
            (p.categoryName || p.category || '').toLowerCase().includes(query)
        ).slice(0, 10);

        if (matches.length === 0) {
            lookupResults.innerHTML = '<div class="lookup-empty">No products found.</div>';
            return;
        }

        lookupResults.innerHTML = matches.map(p => {
            const stock = p.currentStock ?? p.stock ?? 0;
            const status = p.status || (stock <= 0 ? 'Dead Stock' : stock <= (p.reorderLevel || 5) ? 'Low Stock' : 'In Stock');
            const stockColor = status === 'In Stock' ? 'var(--success)' : status === 'Low Stock' ? 'var(--warning)' : 'var(--danger)';
            const badge = status === 'In Stock' ? 'badge-success' : status === 'Low Stock' ? 'badge-warning' : 'badge-danger';
            return `
                <div class="lookup-item">
                    <div>
                        <div class="lookup-item-name">${escHtml(p.productName || p.name || '—')}</div>
                        <div class="lookup-item-cat">${escHtml(p.categoryName || p.category || '—')}</div>
                    </div>
                    <div style="text-align:right">
                        <div class="lookup-item-stock" style="color:${stockColor}">${stock}</div>
                        <span class="badge ${badge}" style="font-size:0.65rem;">${status}</span>
                    </div>
                </div>
            `;
        }).join('');
    }

    searchInput?.addEventListener('input', () => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => renderLookup(searchInput.value), 200);
    });

    clearSearchBtn?.addEventListener('click', () => {
        searchInput.value = '';
        renderLookup('');
    });

    // ── Shift Summary (today's sales by this user) ─────────────────────────
    try {
        // API.sales.getAll() returns a raw array from the server
        const salesResp = await API.sales.getAll();
        const sales = Array.isArray(salesResp) ? salesResp : (salesResp.sales || []);
        const today = new Date().toDateString();
        const todaySales = sales.filter(s => {
            // Firestore Admin SDK serializes Timestamps as { _seconds, _nanoseconds }
            const ts = s.transactionDate || s.date;
            let d;
            if (ts?._seconds !== undefined)      d = new Date(ts._seconds * 1000);
            else if (ts?.seconds !== undefined)  d = new Date(ts.seconds * 1000);
            else                                 d = new Date(ts);
            return d.toDateString() === today &&
                   (s.soldBy === user.uid || s.loggedByUid === user.uid || s.uid === user.uid);
        });

        const count  = todaySales.length;
        const total  = todaySales.reduce((sum, s) => sum + (s.totalAmount || s.total || 0), 0);
        const unique = new Set(todaySales.map(s => s.productId)).size;

        const salesCount = document.getElementById('shift-sales-count');
        const salesAmt   = document.getElementById('shift-sales-amount');
        const prodCount  = document.getElementById('shift-products-count');

        if (salesCount) salesCount.textContent = count;
        if (salesAmt)   salesAmt.textContent   = formatCurrency(total);
        if (prodCount)  prodCount.textContent  = unique;
    } catch (e) {
        ['shift-sales-count', 'shift-sales-amount', 'shift-products-count'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.textContent = '—';
        });
    }

    // ── Utility: Escape HTML ──────────────────────────────────────────────
    function escHtml(str) {
        if (!str) return '';
        const d = document.createElement('div');
        d.textContent = str;
        return d.innerHTML;
    }
});
