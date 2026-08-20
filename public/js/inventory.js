document.addEventListener('DOMContentLoaded', () => {
    setActiveNav('inventory');
    const user = JSON.parse(localStorage.getItem('stocksense_user') || '{}');
    const businessName = localStorage.getItem('stocksense_businessName') || 'Your Business';

    // Show business name in header
    const pageTitle = document.querySelector('.page-title');
    if (pageTitle) pageTitle.textContent = `${businessName} — Inventory`;

    const tableBody    = document.getElementById('inventory-table-body');
    const searchInput  = document.getElementById('search-product');
    const statusFilter = document.getElementById('filter-status');
    const addBtn       = document.getElementById('btn-add-product');
    const catTabsEl    = document.getElementById('category-tabs');

    // Category emoji map
    const catEmoji = {
        'Electronics':      '💻',
        'Clothing':         '👕',
        'Food & Beverage':  '🍎',
        'Stationery':       '✏️',
        'Hardware':         '🔧',
        'Furniture':        '🛋️',
        'default':          '📦'
    };

    const categories = ['Electronics', 'Clothing', 'Food & Beverage', 'Stationery', 'Hardware', 'Furniture'];

    // Populate category dropdowns in modals
    document.querySelectorAll('.category-select').forEach(select => {
        select.innerHTML = '<option value="">Select Category</option>' +
            categories.map(c => `<option value="${c}">${catEmoji[c] || '📦'} ${c}</option>`).join('');
    });

    let products = [];
    let activeCat = ''; // currently selected category tab

    // ── Build category tabs from loaded data ──────────────────────────────
    function buildCategoryTabs(items) {
        if (!catTabsEl) return;
        const cats = [...new Set(items.map(p => p.categoryName).filter(Boolean))].sort();

        catTabsEl.innerHTML = `<button class="cat-tab ${activeCat === '' ? 'active' : ''}" data-cat="" style="${tabStyle(activeCat === '')}">🏪 All (${items.length})</button>`;

        cats.forEach(cat => {
            const count = items.filter(p => p.categoryName === cat).length;
            const emoji = catEmoji[cat] || '📦';
            const isActive = activeCat === cat;
            catTabsEl.innerHTML += `<button class="cat-tab ${isActive ? 'active' : ''}" data-cat="${cat}" style="${tabStyle(isActive)}">${emoji} ${cat} (${count})</button>`;
        });

        // Attach click handlers
        catTabsEl.querySelectorAll('.cat-tab').forEach(btn => {
            btn.addEventListener('click', () => {
                activeCat = btn.dataset.cat;
                buildCategoryTabs(products);
                renderTable();
            });
        });
    }

    function tabStyle(isActive) {
        return isActive
            ? 'padding:0.45rem 1.1rem;border-radius:20px;border:1px solid rgba(99,102,241,0.6);background:rgba(99,102,241,0.35);color:#a5b4fc;font-size:0.82rem;font-weight:700;cursor:pointer;transition:all 0.2s;'
            : 'padding:0.45rem 1.1rem;border-radius:20px;border:1px solid rgba(255,255,255,0.1);background:rgba(255,255,255,0.04);color:var(--text-secondary);font-size:0.82rem;font-weight:500;cursor:pointer;transition:all 0.2s;';
    }

    // ── Load products from API (scoped to THIS business by server) ─────────
    async function loadProducts() {
        if (tableBody) tableBody.innerHTML = '<tr><td colspan="10" class="text-center py-4">Loading your inventory...</td></tr>';
        try {
            products = await API.products.getAll();
            buildCategoryTabs(products);
            renderTable();
        } catch (err) {
            const msg = err.message || 'Unknown error';
            showToast('Failed to load products: ' + msg, 'error');
            if (tableBody) tableBody.innerHTML = `<tr><td colspan="10" class="text-center py-4 text-danger">⚠️ ${msg}</td></tr>`;
        }
    }

    // ── Render table with current filters ─────────────────────────────────
    function renderTable() {
        if (!tableBody) return;
        const searchTerm = (searchInput?.value || '').toLowerCase();
        const statFilter = statusFilter?.value || '';

        const filtered = products.filter(p => {
            const matchesCat    = !activeCat || p.categoryName === activeCat;
            const matchesSearch = (p.productName || '').toLowerCase().includes(searchTerm);

            const lastSaleMs    = p.lastSaleAt?._seconds
                ? p.lastSaleAt._seconds * 1000
                : Date.now();
            const daysInactive  = Math.floor((Date.now() - lastSaleMs) / 86400000);

            let status = 'In Stock';
            if (daysInactive > 90 && p.currentStock > 0)          status = 'Dead Stock';
            else if (p.currentStock <= p.reorderLevel && p.currentStock > 0) status = 'Low Stock';
            else if (p.currentStock === 0)                          status = 'Out of Stock';

            const matchesStat = !statFilter || status === statFilter;
            return matchesCat && matchesSearch && matchesStat;
        });

        if (filtered.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="10" class="text-center py-4 empty-state">
                No products found${activeCat ? ` in <strong>${activeCat}</strong>` : ''}.
            </td></tr>`;
            return;
        }

        tableBody.innerHTML = filtered.map((p, i) => {
            const lastSaleMs   = p.lastSaleAt?._seconds ? p.lastSaleAt._seconds * 1000 : Date.now();
            const daysInactive = Math.floor((Date.now() - lastSaleMs) / 86400000);

            let status = 'In Stock', badgeClass = 'badge-success';
            if (p.currentStock === 0)                                            { status = 'Out of Stock'; badgeClass = 'badge-danger'; }
            else if (daysInactive > 90 && p.currentStock > 0)                   { status = 'Dead Stock';   badgeClass = 'badge-danger'; }
            else if (p.currentStock <= p.reorderLevel && p.currentStock > 0)    { status = 'Low Stock';    badgeClass = 'badge-warning'; }

            const emoji = catEmoji[p.categoryName] || '📦';
            const deleteBtn = user.role === 'Admin'
                ? `<button class="btn-icon text-danger" onclick="deleteProduct('${p.id}')" title="Delete">
                     <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"></path></svg>
                   </button>` : '';

            return `
            <tr>
                <td style="color:var(--text-secondary)">${i + 1}</td>
                <td><strong>${p.productName || ''}</strong>${status === 'Dead Stock' ? ' <span class="badge badge-info" style="font-size:0.65em;">Clearance</span>' : ''}</td>
                <td>${emoji} ${p.categoryName || '—'}</td>
                <td><strong style="color:${p.currentStock <= p.reorderLevel ? 'var(--warning)' : 'var(--success)'}">${p.currentStock}</strong></td>
                <td style="color:var(--text-secondary)">${p.reorderLevel}</td>
                <td style="color:var(--text-secondary)">${formatDate(p.expiryDate)}</td>
                <td>${formatCurrency(p.unitPrice)}</td>
                <td style="color:var(--text-secondary)">${formatCurrency(p.costPrice)}</td>
                <td><span class="badge ${badgeClass}">${status}</span></td>
                <td class="table-actions">
                    <button class="btn-icon text-info" onclick="editProduct('${p.id}')" title="Edit">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                    </button>
                    ${deleteBtn}
                </td>
            </tr>`;
        }).join('');
    }

    // ── Filter event listeners ─────────────────────────────────────────────
    searchInput?.addEventListener('input', renderTable);
    statusFilter?.addEventListener('change', renderTable);

    // ── Add Product ────────────────────────────────────────────────────────
    addBtn?.addEventListener('click', () => {
        document.getElementById('add-product-form').reset();
        // Pre-select current category tab
        const catSelect = document.querySelector('#add-product-form .category-select');
        if (catSelect && activeCat) catSelect.value = activeCat;
        showModal('add-product-modal');
    });

    document.getElementById('add-product-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data     = Object.fromEntries(formData.entries());
        data.categoryName  = data.category;
        data.unitPrice     = Number(data.unitPrice);
        data.costPrice     = Number(data.costPrice);
        data.reorderLevel  = Number(data.reorderLevel);
        data.initialStock  = Number(data.initialStock);
        try {
            await API.products.add(data);
            showToast('✅ Product added successfully!');
            hideModal('add-product-modal');
            await loadProducts();
        } catch (err) {
            showToast('Error: ' + (err.message || 'Adding product failed'), 'error');
        }
    });

    // ── Edit Product ───────────────────────────────────────────────────────
    document.getElementById('edit-product-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id      = document.getElementById('edit-product-id').value;
        const formData = new FormData(e.target);
        const data     = Object.fromEntries(formData.entries());
        data.categoryName = data.category;
        data.unitPrice    = Number(data.unitPrice);
        data.costPrice    = Number(data.costPrice);
        data.reorderLevel = Number(data.reorderLevel);
        try {
            await API.products.update(id, data);
            showToast('✅ Product updated successfully!');
            hideModal('edit-product-modal');
            await loadProducts();
        } catch (err) {
            showToast('Error: ' + (err.message || 'Update failed'), 'error');
        }
    });

    window.editProduct = (id) => {
        const p = products.find(x => x.id === id);
        if (!p) return;
        document.getElementById('edit-product-id').value    = p.id;
        document.getElementById('edit-name').value          = p.productName || '';
        document.getElementById('edit-category').value      = p.categoryName || '';
        document.getElementById('edit-unitPrice').value     = p.unitPrice;
        document.getElementById('edit-costPrice').value     = p.costPrice;
        document.getElementById('edit-reorderLevel').value  = p.reorderLevel;
        showModal('edit-product-modal');
    };

    window.deleteProduct = async (id) => {
        if (await showConfirm('Delete this product permanently?')) {
            try {
                await API.products.delete(id);
                showToast('Product deleted');
                await loadProducts();
            } catch (err) {
                showToast('Error: ' + err.message, 'error');
            }
        }
    };

    // ── Initial load ───────────────────────────────────────────────────────
    loadProducts();
});
