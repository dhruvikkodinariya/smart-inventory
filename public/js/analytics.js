document.addEventListener('DOMContentLoaded', async () => {
    setActiveNav('analytics');

    const deadTable = document.getElementById('dead-stock-table');
    const lowTable = document.getElementById('low-stock-table');
    const btnExportDead = document.getElementById('btn-export-dead');
    const btnExportLow = document.getElementById('btn-export-low');

    let deadData = [];
    let lowData = [];

    function exportCSV(filename, rows) {
        const csvContent = "data:text/csv;charset=utf-8," + rows.map(e => e.join(",")).join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    async function loadData() {
        try {
            deadData = await API.analytics.deadStock();
            lowData = await API.analytics.lowStock();

            // Populate summary cards
            const totalDead = document.getElementById('stat-total-dead');
            const totalDeadCap = document.getElementById('stat-dead-capital');
            const totalLow = document.getElementById('stat-total-low');

            if(totalDead) totalDead.textContent = deadData.length;
            if(totalDeadCap) totalDeadCap.textContent = formatCurrency(deadData.reduce((sum, item) => sum + (item.capitalLocked || 0), 0));
            if(totalLow) totalLow.textContent = lowData.length;

            // Render Dead Stock Table
            if (deadTable) {
                if (deadData.length === 0) {
                    deadTable.innerHTML = '<tr><td colspan="6" class="text-center empty-state">No dead stock found. Great job!</td></tr>';
                } else {
                    deadTable.innerHTML = deadData.sort((a,b) => b.daysInactive - a.daysInactive).map(item => `
                        <tr>
                            <td>${item.productName}</td>
                            <td>${item.category}</td>
                            <td>${item.currentStock}</td>
                            <td><span class="badge ${item.daysInactive > 120 ? 'badge-danger' : 'badge-warning'}">${item.daysInactive} days</span></td>
                            <td>${formatCurrency(item.costPrice)}</td>
                            <td class="text-danger font-weight-bold">${formatCurrency(item.capitalLocked)}</td>
                        </tr>
                    `).join('');
                }
            }

            // Render Low Stock Table
            if (lowTable) {
                if (lowData.length === 0) {
                    lowTable.innerHTML = '<tr><td colspan="5" class="text-center empty-state">No low stock items.</td></tr>';
                } else {
                    lowTable.innerHTML = lowData.map(item => `
                        <tr>
                            <td>${item.name}</td>
                            <td>${item.category}</td>
                            <td>${item.currentStock}</td>
                            <td>${item.reorderLevel}</td>
                            <td class="text-danger font-weight-bold">${item.currentStock - item.reorderLevel}</td>
                        </tr>
                    `).join('');
                }
            }

        } catch (err) {
            showToast('Error loading analytics', 'error');
        }
    }

    if (btnExportDead) {
        btnExportDead.addEventListener('click', () => {
            const rows = [
                ['Product', 'Category', 'Stock Qty', 'Days Inactive', 'Cost Price', 'Capital Locked']
            ];
            deadData.forEach(item => {
                rows.push([item.productName, item.category, item.currentStock, item.daysInactive, item.costPrice, item.capitalLocked]);
            });
            exportCSV('dead_stock_report.csv', rows);
        });
    }

    if (btnExportLow) {
        btnExportLow.addEventListener('click', () => {
            const rows = [
                ['Product', 'Category', 'Current Stock', 'Reorder Level', 'Shortage']
            ];
            lowData.forEach(item => {
                rows.push([item.name, item.category, item.currentStock, item.reorderLevel, item.currentStock - item.reorderLevel]);
            });
            exportCSV('low_stock_report.csv', rows);
        });
    }

    loadData();
});
