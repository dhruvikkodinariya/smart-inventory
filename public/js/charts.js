window.initDeadStockChart = function(data) {
    if(!document.getElementById('dead-stock-chart') || !data || data.length === 0) return;
    
    const options = {
        series: [{
            name: 'Capital Locked (₹)',
            data: data.map(d => d.capitalLocked)
        }],
        chart: {
            type: 'bar',
            height: 300,
            background: 'transparent',
            toolbar: { show: false }
        },
        theme: { mode: 'dark' },
        plotOptions: {
            bar: {
                borderRadius: 4,
                horizontal: true,
                barHeight: '60%',
            }
        },
        colors: ['#ef4444'],
        dataLabels: {
            enabled: true,
            formatter: function (val) {
                return '₹' + val.toLocaleString('en-IN');
            },
            style: { colors: ['#fff'] }
        },
        xaxis: {
            categories: data.map(d => d.productName),
            labels: { style: { colors: '#94a3b8' } },
            axisBorder: { show: false },
            axisTicks: { show: false }
        },
        yaxis: {
            labels: { style: { colors: '#f1f5f9' } }
        },
        grid: {
            borderColor: 'rgba(255,255,255,0.05)',
            xaxis: { lines: { show: true } },
            yaxis: { lines: { show: false } }
        },
        tooltip: {
            theme: 'dark',
            y: { formatter: function (val) { return '₹' + val.toLocaleString('en-IN') } }
        }
    };
    new ApexCharts(document.querySelector("#dead-stock-chart"), options).render();
}

window.initSalesTrendChart = function(data) {
    if(!document.getElementById('sales-trend-chart') || !data || !data.months) return;

    const options = {
        series: [{
            name: 'Total Sales',
            data: data.totals
        }],
        chart: {
            type: 'area',
            height: 350,
            background: 'transparent',
            toolbar: { show: false }
        },
        theme: { mode: 'dark' },
        colors: ['#6366f1'],
        fill: {
            type: 'gradient',
            gradient: {
                shadeIntensity: 1,
                opacityFrom: 0.7,
                opacityTo: 0.1,
                stops: [0, 90, 100]
            }
        },
        dataLabels: { enabled: false },
        stroke: { curve: 'smooth', width: 3 },
        xaxis: {
            categories: data.months,
            labels: { style: { colors: '#94a3b8' } },
            axisBorder: { show: false },
            axisTicks: { show: false }
        },
        yaxis: {
            labels: { 
                style: { colors: '#94a3b8' },
                formatter: (value) => '₹' + value.toLocaleString('en-IN')
            }
        },
        grid: { borderColor: 'rgba(255,255,255,0.05)' },
        tooltip: {
            theme: 'dark',
            y: { formatter: (value) => '₹' + value.toLocaleString('en-IN') }
        }
    };
    new ApexCharts(document.querySelector("#sales-trend-chart"), options).render();
}

window.initCategoryChart = function(data) {
    if(!document.getElementById('category-chart') || !data || !data.categories) return;

    const options = {
        series: data.values,
        labels: data.categories,
        chart: {
            type: 'donut',
            height: 300,
            background: 'transparent'
        },
        theme: { mode: 'dark' },
        colors: ['#6366f1','#10b981','#f59e0b','#ef4444','#3b82f6','#8b5cf6'],
        stroke: { show: true, colors: ['#0a0e1a'], width: 2 },
        dataLabels: { enabled: false },
        legend: {
            position: 'right',
            labels: { colors: '#f1f5f9' }
        },
        tooltip: {
            theme: 'dark',
            y: { formatter: (val) => val + ' items' }
        }
    };
    new ApexCharts(document.querySelector("#category-chart"), options).render();
}
