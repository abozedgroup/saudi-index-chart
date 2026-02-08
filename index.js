import { dailyData } from './daily_chart.js';
import { weeklyData } from './weekly_chart.js';

// عنصر الشارت
const chartContainer = document.getElementById('chart');

// 1. إنشاء الشارت
const chart = window.LightweightCharts.createChart(chartContainer, {
    layout: {
        background: { type: 'solid', color: '#ffffff' },
        textColor: '#131722',
    },
    grid: {
        vertLines: { visible: false }, // إخفاء الخطوط العمودية لتقليل التشويش
        horzLines: { color: '#f0f3fa' },
    },
    // إخفاء مقياس السعر والوقت قليلاً لتوفير مساحة في الجوال
    rightPriceScale: {
        borderColor: '#e0e3eb',
        scaleMargins: {
            top: 0.1,
            bottom: 0.2,
        },
    },
    timeScale: {
        borderColor: '#e0e3eb',
        timeVisible: true,
    },
    crosshair: {
        vertLine: {
            labelVisible: false, // إخفاء التاريخ عند التحرك بالإصبع لرؤية أوضح
        },
    },
    // تفعيل التمرير السلس
    kineticScroll: {
        touch: true,
        mouse: true,
    },
});

// 2. إضافة السلاسل (Series)
// البارات (Bar Chart)
const mainSeries = chart.addBarSeries({
    upColor: '#089981',
    downColor: '#F23645',
    thinBars: false,
});

// الفوليوم
const volumeSeries = chart.addHistogramSeries({
    priceFormat: { type: 'volume' },
    priceScaleId: '', 
});

volumeSeries.priceScale().applyOptions({
    scaleMargins: { top: 0.8, bottom: 0 },
});

// 3. منطق تغيير الحجم (Resize Logic) - أهم جزء للجوال
// نستخدم ResizeObserver لمراقبة تغير حجم الحاوية بدقة
const resizeObserver = new ResizeObserver(entries => {
    if (entries.length === 0 || entries[0].target !== chartContainer) { return; }
    const newRect = entries[0].contentRect;
    chart.applyOptions({ height: newRect.height, width: newRect.width });
});
resizeObserver.observe(chartContainer);

// 4. وظائف تحديث البيانات والأسطورة (Legend)
const domElements = {
    open: document.getElementById('open-val'),
    high: document.getElementById('high-val'),
    low: document.getElementById('low-val'),
    close: document.getElementById('close-val'),
    vol: document.getElementById('vol-val'),
};

function updateLegend(param) {
    if (!param) return;
    const format = (n) => n.toFixed(2);
    const formatVol = (v) => v >= 1000000 ? (v/1000000).toFixed(2)+'M' : (v >= 1000 ? (v/1000).toFixed(0)+'K' : v);

    domElements.open.innerText = format(param.open);
    domElements.high.innerText = format(param.high);
    domElements.low.innerText = format(param.low);
    domElements.close.innerText = format(param.close);
    domElements.vol.innerText = formatVol(param.volume || param.value);
    
    // تلوين الإغلاق
    domElements.close.style.color = param.close >= param.open ? '#089981' : '#F23645';
}

function renderChart(data) {
    if (!data || data.length === 0) return;

    mainSeries.setData(data);

    const volData = data.map(d => ({
        time: d.time,
        value: d.volume,
        color: d.close >= d.open ? 'rgba(8, 153, 129, 0.3)' : 'rgba(242, 54, 69, 0.3)',
    }));
    volumeSeries.setData(volData);

    // تحديث الأسطورة لآخر شمعة
    updateLegend(data[data.length - 1]);
    
    // ضبط الزووم
    chart.timeScale().fitContent();
}

// التفاعل باللمس/الماوس
chart.subscribeCrosshairMove((param) => {
    if (param.time) {
        const p = param.seriesData.get(mainSeries);
        const v = param.seriesData.get(volumeSeries);
        if (p) updateLegend({ ...p, volume: v ? v.value : 0 });
    }
});

// 5. تفعيل الأزرار
const buttons = document.querySelectorAll('.tf-btn');
buttons.forEach(btn => {
    btn.addEventListener('click', function() {
        buttons.forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        const tf = this.getAttribute('data-tf');
        renderChart(tf === 'D' ? dailyData : weeklyData);
    });
});

// البدء باليومي
renderChart(dailyData);
