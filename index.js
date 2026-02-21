import { dailyData } from './daily_chart.js';
import { weeklyData } from './weekly_chart.js';

const chartContainer = document.getElementById('chart');

// 1. إنشاء الشارت
const chart = window.LightweightCharts.createChart(chartContainer, {
    layout: {
        background: { type: 'solid', color: '#ffffff' },
        textColor: '#131722',
    },
    // إجبار المكتبة على استخدام اللغة الإنجليزية وتنسيق التاريخ المطلوب
    localization: {
        locale: 'en-US',
        dateFormat: 'yyyy-MM-dd',
    },
    grid: {
        vertLines: { visible: false }, 
        horzLines: { color: '#f0f3fa' },
    },
    rightPriceScale: {
        borderColor: '#e0e3eb',
        scaleMargins: {
            top: 0.1,
            bottom: 0.2,
        },
    },
    timeScale: {
        borderColor: '#e0e3eb',
        timeVisible: false, // إخفاء الوقت 00:00:00
    },
    crosshair: {
        vertLine: {
            labelVisible: false, // إبقاء التاريخ مخفي في المحور السفلي لتجنب التشويش والاعتماد على صندوق البيانات
        },
    },
    kineticScroll: {
        touch: true,
        mouse: true,
    },
});

// 2. إضافة السلاسل (Series)
const mainSeries = chart.addBarSeries({
    upColor: '#089981',
    downColor: '#F23645',
    thinBars: false,
});

const volumeSeries = chart.addHistogramSeries({
    priceFormat: { type: 'volume' },
    priceScaleId: '', 
});

volumeSeries.priceScale().applyOptions({
    scaleMargins: { top: 0.8, bottom: 0 },
});

// 3. منطق تغيير الحجم (Resize Logic)
const resizeObserver = new ResizeObserver(entries => {
    if (entries.length === 0 || entries[0].target !== chartContainer) { return; }
    const newRect = entries[0].contentRect;
    chart.applyOptions({ height: newRect.height, width: newRect.width });
});
resizeObserver.observe(chartContainer);

// 4. وظائف تحديث البيانات والأسطورة (Legend)
const domElements = {
    date: document.getElementById('date-val'),
    open: document.getElementById('open-val'),
    high: document.getElementById('high-val'),
    low: document.getElementById('low-val'),
    close: document.getElementById('close-val'),
    vol: document.getElementById('vol-val'),
};

function updateLegend(param, dateStr) {
    if (!param) return;
    const format = (n) => n.toFixed(2);
    const formatVol = (v) => v >= 1000000 ? (v/1000000).toFixed(2)+'M' : (v >= 1000 ? (v/1000).toFixed(0)+'K' : v);

    // تحديث التاريخ
    if (dateStr) {
        domElements.date.innerText = dateStr;
    }

    domElements.open.innerText = format(param.open);
    domElements.high.innerText = format(param.high);
    domElements.low.innerText = format(param.low);
    domElements.close.innerText = format(param.close);
    domElements.vol.innerText = formatVol(param.volume || param.value);
    
    domElements.close.style.color = param.close >= param.open ? '#089981' : '#F23645';
}

// دالة مساعدة لتنسيق التاريخ المستخرج من المكتبة
function extractDateString(timeParam) {
    if (!timeParam) return '--';
    if (typeof timeParam === 'object') {
        // تحويل الكائن إلى نص yyyy-mm-dd مع إضافة صفر للأرقام الفردية
        return `${timeParam.year}-${String(timeParam.month).padStart(2, '0')}-${String(timeParam.day).padStart(2, '0')}`;
    }
    return timeParam; // إذا كان نصاً في الأصل
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

    // تحديث الأسطورة لآخر شمعة عند التحميل
    const lastData = data[data.length - 1];
    const initialDate = extractDateString(lastData.time);
    updateLegend(lastData, initialDate);
    
    chart.timeScale().fitContent();
}

// التفاعل باللمس/الماوس
chart.subscribeCrosshairMove((param) => {
    if (param.time) {
        const p = param.seriesData.get(mainSeries);
        const v = param.seriesData.get(volumeSeries);
        const hoverDate = extractDateString(param.time);
        
        if (p) updateLegend({ ...p, volume: v ? v.value : 0 }, hoverDate);
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

renderChart(dailyData);