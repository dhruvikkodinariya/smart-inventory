document.addEventListener('DOMContentLoaded', async () => {
    setActiveNav('dashboard');
    const user         = JSON.parse(localStorage.getItem('stocksense_user') || '{}');
    const businessName = localStorage.getItem('stocksense_businessName') || '';
    const joinCode     = localStorage.getItem('stocksense_joinCode') || '';

    // Show business name in sidebar badge
    const badge = document.getElementById('business-name-badge');
    const nameEl = document.getElementById('business-name-text');
    if (badge && nameEl && businessName) {
        nameEl.textContent = businessName;
        badge.style.display = 'block';
    }

    // Seed button (Admin only)
    const seedBtn = document.getElementById('seed-btn');
    if (seedBtn) {
        if (user.role === 'Admin') {
            seedBtn.style.display = 'block';
            seedBtn.addEventListener('click', async () => {
                const confirmed = await showConfirm('Seed 52 demo products into your business inventory?');
                if (confirmed) {
                    try {
                        const originalText = seedBtn.textContent;
                        seedBtn.textContent = 'Seeding...';
                        seedBtn.disabled = true;
                        await API.seed();
                        showToast('Demo data seeded successfully! 🎉');
                        window.location.reload();
                    } catch (err) {
                        showToast('Error: ' + (err.message || 'Seeding failed'), 'error');
                        seedBtn.textContent = 'Seed Demo Data';
                        seedBtn.disabled = false;
                    }
                }
            });
        } else {
            seedBtn.style.display = 'none';
        }
    }

    // Show Join Code panel for Admin
    const joinCodePanel = document.getElementById('join-code-panel');
    const joinCodeEl    = document.getElementById('join-code-display');
    if (joinCodePanel && user.role === 'Admin' && joinCode) {
        joinCodeEl.textContent   = joinCode;
        joinCodePanel.style.display = 'block';
    }

    // Load dashboard stats + charts
    try {
        const [summary, deadStock, salesTrend, byCategory] = await Promise.all([
            API.analytics.summary().catch(() => ({ totalProducts:0, totalInventoryValue:0, capitalLockedInDeadStock:0, lowStockCount:0 })),
            API.analytics.deadStock().catch(() => ({ deadStock:[] })),
            API.analytics.salesTrend().catch(() => ({ months:[], totals:[] })),
            API.analytics.byCategory().catch(() => ({ categories:[], values:[] }))
        ]);

        const animateValue = (id, start, end, duration, format = false) => {
            const obj = document.getElementById(id);
            if (!obj) return;
            let startTimestamp = null;
            const step = (timestamp) => {
                if (!startTimestamp) startTimestamp = timestamp;
                const progress = Math.min((timestamp - startTimestamp) / duration, 1);
                const current  = Math.floor(progress * (end - start) + start);
                obj.innerHTML  = format ? formatCurrency(current) : current;
                if (progress < 1) window.requestAnimationFrame(step);
            };
            window.requestAnimationFrame(step);
        };

        animateValue('stat-total-products',   0, summary.totalProducts            || 0, 1000);
        animateValue('stat-inventory-value',  0, summary.totalInventoryValue       || 0, 1000, true);
        animateValue('stat-dead-stock-value', 0, summary.capitalLockedInDeadStock || 0, 1000, true);
        animateValue('stat-low-stock',        0, summary.lowStockCount             || 0, 1000);

        const dsItems = deadStock.deadStock || deadStock;
        if (window.initDeadStockChart)  initDeadStockChart(dsItems.slice(0, 5));
        if (window.initSalesTrendChart) initSalesTrendChart(salesTrend);
        if (window.initCategoryChart)   initCategoryChart(byCategory);

    } catch (err) {
        showToast('Error loading dashboard data', 'error');
    }
});
