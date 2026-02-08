import { dailyData } from './daily_chart.js';
import { weeklyData } from './weekly_chart.js';

// التحقق من المكتبة
if (!window.LightweightCharts) {
    console.error('LightweightCharts library not loaded!');
}

const chartContainer = document.getElementById('chart');

// --- 1. إعدادات الشارت المتطورة ---
const chartOptions = {
    layout: {
        background: { type: 'solid', color: '#ffffff' },
        textColor: '#131722',
    },
    grid: {
        vertLines: { color: '#F0F3FA', style: 1 }, // خطوط خفيفة جداً
        horzLines: { color: '#F0F3FA', style: 1 },
    },
    // العلامة المائية (Watermark)
    watermark: {
        visible: true,
        fontSize: 75,
        horzAlign: 'center',
        vertAlign: 'center',
        color: 'rgba(41, 98, 255, 0.08)', // لون أزرق شفاف جداً وأنيق
        text: 'SooqTrend',
        fontFamily: 'Impact, Arial', // خط سميك للعلامة المائية
    },
    rightPriceScale: {
        borderColor: '#E0E3EB',
        scaleMargins: {
            top: 0.1,
            bottom: 0.2, // ترك مساحة للفوليوم
        },
    },
    timeScale: {
        borderColor: '#E0E3EB',
        timeVisible: true,
        rightOffset: 5, // مسافة فارغة على اليمين
    },
    crosshair: {
        mode: window.LightweightCharts.CrosshairMode.Normal, // وضع المغناطيس
        vertLine: {
            width: 1,
            color: '#758696',
            style: 3,
            labelBackgroundColor: '#758696',
        },
        horzLine: {
            width: 1,
            color: '#758696',
            style: 3,
            labelBackgroundColor: '#758696',
        },
    },
};

const chart = window.LightweightCharts.createChart(chartContainer, chartOptions);

// --- 2. السلاسل (Series) ---

// استخدام البارات (Bar Chart) كما طلبت
const mainSeries = chart.addBarSeries({
    upColor: '#089981',      // أخضر تريدنج فيو الرسمي
    downColor: '#F23645',    // أحمر تريدنج فيو الرسمي
    thinBars: false,         // بارات واضحة
    openVisible: true,       // إظهار الافتتاح
});

// الفوليوم
const volumeSeries = chart.addHistogramSeries({
    priceFormat: { type: 'volume' },
    priceScaleId: '', 
});

volumeSeries.priceScale().applyOptions({
    scaleMargins: { top: 0.8, bottom: 0 },
});

// --- 3. وظائف التحديث ---

// مرجع لعناصر HTML
const domElements = {
    open: document.getElementById('open-val'),
    high: document.getElementById('high-val'),
    low: document.getElementById('low-val'),
    close: document.getElementById('close-val'),
    vol: document.getElementById('vol-val'),
};

function updateLegend(param) {
    if (!param) return;
    
    // تنسيق الأرقام
    const formatPrice = (p) => p.toFixed(2);
    const formatVol = (v) => {
        if (v >= 1000000) return (v / 1000000).toFixed(2) + 'M';
        if (v >= 1000) return (v / 1000).toFixed(2) + 'K';
        return v;
    };

    domElements.open.innerText = formatPrice(param.open);
    domElements.high.innerText = formatPrice(param.high);
    domElements.low.innerText = formatPrice(param.low);
    domElements.close.innerText = formatPrice(param.close);
    domElements.vol.innerText = formatVol(param.volume || param.value);
    
    // تلوين سعر الإغلاق حسب الحركة
    const color = param.close >= param.open ? '#089981' : '#F23645';
    domElements.close.style.color = color;
}

function renderChart(data) {
    if (!data || data.length === 0) return;

    mainSeries.setData(data);

    // تلوين الفوليوم
    const volData = data.map(d => ({
        time: d.time,
        value: d.volume,
        color: d.close >= d.open ? 'rgba(8, 153, 129, 0.4)' : 'rgba(242, 54, 69, 0.4)',
    }));
    volumeSeries.setData(volData);

    // تحديث الأسطورة لآخر شمعة
    updateLegend(data[data.length - 1]);
    
    // ضبط الزووم
    chart.timeScale().fitContent();
}

// التفاعل مع حركة الماوس
chart.subscribeCrosshairMove((param) => {
    if (param.time) {
        const p = param.seriesData.get(mainSeries);
        const v = param.seriesData.get(volumeSeries);
        if (p) updateLegend({ ...p, volume: v ? v.value : 0 });
    }
});

// --- 4. تفعيل الأزرار (Logic for Buttons) ---

// البدء باليومي
renderChart(dailyData);

// البحث عن كل الأزرار وربطها
const buttons = document.querySelectorAll('.tf-btn');

buttons.forEach(btn => {
    btn.addEventListener('click', function() {
        // 1. إزالة كلاس active من الجميع
        buttons.forEach(b => b.classList.remove('active'));
        
        // 2. إضافته للزر المضغوط
        this.classList.add('active');
        
        // 3. تحميل البيانات المناسبة
        const tf = this.getAttribute('data-tf');
        if (tf === 'D') {
            renderChart(dailyData);
        } else if (tf === 'W') {
            renderChart(weeklyData);
        }
    });
});

// تجاوب الشاشة
window.addEventListener('resize', () => {
    chart.applyOptions({ width: chartContainer.clientWidth });
});