document.addEventListener('DOMContentLoaded', () => {
    setActiveNav('sales');
    const productSelect = document.getElementById('sale-product');
    const qtyInput = document.getElementById('sale-qty');
    const stockDisplay = document.getElementById('current-stock-display');
    const totalDisplay = document.getElementById('sale-total');
    const form = document.getElementById('sale-form');
    const recentTable = document.getElementById('recent-sales-table');

    let products = [];
    let currentSelectedProduct = null;

    async function init() {
        try {
            products = await API.products.getAll();
            if (productSelect) {
                productSelect.innerHTML = '<option value="">Select Product...</option>' + 
                    products.map(p => `<option value="${p.id}">${p.productName || p.name || 'Unknown'} (Stock: ${p.currentStock ?? 0})</option>`).join('');
            }
            loadRecentSales();
        } catch(e) {
            showToast('Error loading products', 'error');
        }
    }

    if (productSelect) {
        productSelect.addEventListener('change', (e) => {
            currentSelectedProduct = products.find(p => p.id === e.target.value);
            if (currentSelectedProduct) {
                stockDisplay.textContent = currentSelectedProduct.currentStock ?? 0;
                qtyInput.max = currentSelectedProduct.currentStock;
                qtyInput.value = '';
                totalDisplay.textContent = '₹0';
            } else {
                stockDisplay.textContent = '-';
                qtyInput.max = 0;
                totalDisplay.textContent = '₹0';
            }
        });
    }

    if (qtyInput) {
        qtyInput.addEventListener('input', (e) => {
            if (currentSelectedProduct && e.target.value) {
                let qty = parseInt(e.target.value);
                if (qty > currentSelectedProduct.currentStock) {
                    qty = currentSelectedProduct.currentStock;
                    e.target.value = qty;
                    showToast('Cannot sell more than current stock', 'warning');
                }
                totalDisplay.textContent = formatCurrency(qty * (currentSelectedProduct.unitPrice || 0));
            } else {
                totalDisplay.textContent = '₹0';
            }
        });
    }

    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (!currentSelectedProduct) return showToast('Select a product', 'warning');
            
            const qty = parseInt(qtyInput.value);
            if (!qty || qty <= 0) return showToast('Enter valid quantity', 'warning');

            const btn = form.querySelector('button');
            btn.disabled = true;
            btn.textContent = 'Recording...';

            try {
                await API.sales.log({
                    productId: currentSelectedProduct.id,
                    quantitySold: qty
                });
                showToast('Sale recorded successfully!');
                form.reset();
                stockDisplay.textContent = '-';
                totalDisplay.textContent = '₹0';
                currentSelectedProduct = null;
                init(); // reload products to update stock in dropdown
            } catch(err) {
                showToast('Failed to record sale', 'error');
            } finally {
                btn.disabled = false;
                btn.textContent = 'Record Sale';
            }
        });
    }

    async function loadRecentSales() {
        if (!recentTable) return;
        try {
            const sales = await API.sales.getAll(); // Assuming API returns recent first
            if (sales.length === 0) {
                recentTable.innerHTML = '<tr><td colspan="5" class="text-center empty-state">No recent sales.</td></tr>';
                return;
            }
            recentTable.innerHTML = sales.slice(0, 20).map(s => `
                <tr>
                    <td>${s.productName || 'Unknown Product'}</td>
                    <td>${s.quantity}</td>
                    <td>${formatCurrency(s.totalAmount)}</td>
                    <td>${formatDate(s.date)}</td>
                    <td>${s.loggedBy || 'System'}</td>
                </tr>
            `).join('');
        } catch(err) {
            recentTable.innerHTML = '<tr><td colspan="5" class="text-center text-danger">Error loading sales data</td></tr>';
        }
    }

    init();
});
