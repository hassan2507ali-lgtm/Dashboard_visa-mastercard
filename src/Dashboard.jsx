import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Menu, CreditCard, Book, ShoppingCart, FileText, 
  Calendar as CalendarIcon, User, ChevronUp, ChevronDown, LogOut, Filter, 
  BarChart2, Clock, CheckCircle2, AlertTriangle, AlertCircle, Settings, X,
  CardSim
} from 'lucide-react';

// RECHARTS UNTUK GRAFIK COMBO STANDARD
import { 
  ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip as RechartsTooltip, Legend as RechartsLegend, ResponsiveContainer 
} from 'recharts';

// CHART.JS UNTUK GRAFIK P/L DIVERGING BAR + LINE
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  LineController,
  BarController,
  Title,
  Tooltip as ChartJsTooltip,
  Legend as ChartJsLegend,
} from 'chart.js';
import { Chart as ChartJsComponent } from 'react-chartjs-2';

// REGISTER CHART.JS COMPONENTS
ChartJS.register(
  CategoryScale, LinearScale, BarElement, LineElement, PointElement, 
  LineController, BarController, Title, ChartJsTooltip, ChartJsLegend
);

// IMPORT GAMBAR LOGO
import LogoMandiri from  './danatara.png';
import LogoDanantara from './mandiri.png';

// ==========================================
// CUSTOM PLUGIN CHART.JS: TEKS ANGKA HANYA UNTUK LINE
// ==========================================
const customLabelsPlugin = {
  id: 'customLabels',
  afterDatasetsDraw(chart) {
    const { ctx, data } = chart;
    ctx.save();
    ctx.font = 'bold 10px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    data.datasets.forEach((dataset, i) => {
      const meta = chart.getDatasetMeta(i);
      // HANYA RENDER ANGKA UNTUK GRAFIK GARIS (LINE), BAR CHART DIABAIKAN
      if (!meta || meta.hidden || dataset.type !== 'line') return; 
      
      meta.data.forEach((element, index) => {
        const dataValue = dataset.data[index];
        // Hapus filter dataValue === 0 agar tulisan 0% tetap muncul saat Loss
        if (dataValue === undefined || dataValue === null || !element) return; 
        
        const x = element.x;
        // Tambahkan simbol persen (%) di teksnya (termasuk 0%)
        const displayValue = Math.abs(dataValue).toFixed(0) + '%';
        
        ctx.fillStyle = '#3b82f6'; // Warna biru untuk teks line
        const y = element.y - 12; // Posisi melayang sedikit di atas garis

        if(x !== undefined && y !== undefined) ctx.fillText(displayValue, x, y);
      });
    });
    ctx.restore();
  }
};

// ==========================================
// 1. GENERATE DUMMY DATABASE MASIF
// ==========================================
const generateDummyData = () => {
  const data = [];
  let currentDate = new Date(2026, 0, 1);
  const endDate = new Date(2026, 11, 31);
  
  let i = 0;
  while (currentDate <= endDate) {
    const numTrx = Math.floor(Math.random() * 10) + 8; 
    const monthIndex = currentDate.getMonth();
    const wave = Math.sin(monthIndex * 0.8) * 0.4 + 1.2; 

    for(let j=0; j < numTrx; j++) {
      const typeRand = Math.random();
      const type = typeRand > 0.55 ? 'Visa' : (typeRand > 0.15 ? 'Mastercard' : 'Others');
      
      const groupRand = Math.random();
      let groupName = groupRand > 0.4 ? 'Acquiring' : (groupRand > 0.2 ? 'Credit Card' : 'Debit Card');

      const dateString = `${currentDate.getFullYear()}-${String(currentDate.getMonth()+1).padStart(2,'0')}-${String(currentDate.getDate()).padStart(2,'0')}`;

      const baseCost = (Math.random() * 3 + 2) * wave; 
      const principalCost = Number(baseCost.toFixed(3));
      const salesVolume = Number((principalCost * (Math.random() * 1.2 + 1.2)).toFixed(0));
      
      const costRateBase = 0.038 + (wave - 1.2) * 0.005;
      const costRate = Number((costRateBase + (Math.random() * 0.002 - 0.001)).toFixed(4));

      data.push({
        id: `TRX-${currentDate.getFullYear()}${String(currentDate.getMonth()+1).padStart(2,'0')}-${1000 + i}`,
        date: dateString, 
        principal: type, 
        group: groupName, 
        salesVolume: salesVolume, 
        principalCost: principalCost, 
        costRate: Math.max(costRate, 0.01), 
      });
      i++;
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }
  return data;
};

const DUMMY_DB = generateDummyData();

const Dashboard = () => {
  const navigate = useNavigate();

  // ==========================================
  // 2. STATE MANAGEMENT 
  // ==========================================
  const [filters, setFilters] = useState({ periode: 'All', principal: 'All' });
  const [appliedFilters, setAppliedFilters] = useState({ ...filters });

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const [dashboardData, setDashboardData] = useState({
    summary: { sales: 0, cost: 0, rate: 0 },
    creditChartData: [], 
    debitChartData: [],  
    acquiringChartData: [],
    groupStats: [],
  });

  // ==========================================
  // 3. LOGIKA FILTERING & AGREGASI (DINAMIS)
  // ==========================================
  useEffect(() => {
    const periodMap = {
      'Agustus 2026': '2026-08', 'Juli 2026': '2026-07', 'Juni 2026': '2026-06',
      'Mei 2026': '2026-05', 'April 2026': '2026-04', 'All': 'All'
    };
    const targetPeriod = periodMap[appliedFilters.periode];
    const isAllPeriod = targetPeriod === 'All';

    const globalFilteredDB = DUMMY_DB.filter(item => {
      const passPeriode = isAllPeriod || item.date.startsWith(targetPeriod);
      const passPrincipal = appliedFilters.principal === 'All' || item.principal === appliedFilters.principal;
      return passPeriode && passPrincipal;
    });

    if (globalFilteredDB.length === 0) {
      setDashboardData({
        summary: { sales: 0, cost: 0, rate: 0 },
        creditChartData: [], debitChartData: [], acquiringChartData: [],
        groupStats: []
      });
      return;
    }

    let totalSales = 0, totalCost = 0;
    let creditService = 0, debitService = 0, acqService = 0;

    globalFilteredDB.forEach(item => {
      totalSales += item.salesVolume; 
      totalCost += item.principalCost;
      
      if (item.group === 'Credit Card') creditService += item.principalCost; 
      else if (item.group === 'Debit Card') debitService += item.principalCost; 
      else if (item.group === 'Acquiring') acqService += item.principalCost;
    });

    const getChartData = (baseDB, filterGroup) => {
      const chartFilteredDB = baseDB.filter(item => {
        if (filterGroup === 'Acquiring') return item.group === 'Acquiring';
        if (filterGroup === 'Issuing Debit') return item.group === 'Debit Card';
        if (filterGroup === 'Issuing Credit') return item.group === 'Credit Card';
        return true;
      });

      const chartMap = {};
      const monthsShort = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agt', 'Sep', 'Okt', 'Nov', 'Des'];

      chartFilteredDB.forEach(item => {
        const d = new Date(item.date);
        let groupKey, displayLabel;

        if (isAllPeriod) {
          groupKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`; 
          displayLabel = `${monthsShort[d.getMonth()]} '${String(d.getFullYear()).slice(-2)}`;
        } else {
          groupKey = item.date;
          displayLabel = `${d.getDate()} ${monthsShort[d.getMonth()]}`;
        }

        if (!chartMap[groupKey]) {
          chartMap[groupKey] = { 
            label: displayLabel, sortKey: groupKey, count: 0, totalRate: 0,
            salesVolume: 0, principalCost: 0, totalRevenue: 0
          };
        }
        
        chartMap[groupKey].salesVolume += item.salesVolume; 
        chartMap[groupKey].totalRate += item.costRate; 
        chartMap[groupKey].count += 1;
        
        const pCost = item.principalCost;
        const monthWave = Math.sin(d.getMonth() * Math.PI / 1.2); 
        const profitRatio = monthWave * 0.8 + 1.1; 

        const revenue = pCost * profitRatio;
        
        chartMap[groupKey].principalCost += pCost;
        chartMap[groupKey].totalRevenue += revenue; 
      });

      const rawChartData = Object.values(chartMap).sort((a, b) => a.sortKey.localeCompare(b.sortKey)).map(data => {
        const netPL = data.totalRevenue - data.principalCost;
        const marginPct = data.salesVolume ? (netPL / data.salesVolume) * 100 : 0;
        
        const plProfit = marginPct >= 0 ? marginPct : 0;
        const plLoss = marginPct < 0 ? marginPct : 0; 
        
        return {
          name: data.label,
          salesVolume: Number(data.salesVolume.toFixed(0)),
          principalCost: Number(data.principalCost.toFixed(2)),
          costToVolume: Number((data.totalRate / data.count).toFixed(4)), 
          plProfit: Number(plProfit.toFixed(1)),
          plLoss: Number(plLoss.toFixed(1)), 
        };
      });

      const maxProfit = Math.max(...rawChartData.map(d => d.plProfit));
      const lineGap = maxProfit * 0.15 || 5;

      return rawChartData.map(d => ({
        ...d,
        plLine: d.plProfit > 0 ? Number((d.plProfit + lineGap).toFixed(1)) : 0
      }));
    };

    setDashboardData({
      summary: { sales: totalSales.toFixed(0), cost: totalCost.toFixed(2), rate: 0 },
      creditChartData: getChartData(globalFilteredDB, 'Issuing Credit'),
      debitChartData: getChartData(globalFilteredDB, 'Issuing Debit'),
      acquiringChartData: getChartData(globalFilteredDB, 'Acquiring'),
      groupStats: [
        { name: 'Credit Card', totalSort: Number(creditService.toFixed(2)) }, 
        { name: 'Debit Card', totalSort: Number(debitService.toFixed(2)) }, 
        { name: 'Acquiring', totalSort: Number(acqService.toFixed(2)) }
      ]
    });
  }, [appliedFilters]);

  // ==========================================
  // 4. HANDLERS & CONFIGURATIONS
  // ==========================================
  const handleApply = () => setAppliedFilters({ ...filters });
  const handleReset = () => {
    setFilters({ periode: 'All', principal: 'All' });
    setAppliedFilters({ periode: 'All', principal: 'All' });
  };
  const handleLogout = () => alert("Logout berhasil!");
  const handleViewDetail = () => navigate('/detail-cost');
  
  // Tooltip Combo Chart (Recharts) dengan Background Transparan Putih
  const CustomTrendTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white/95 backdrop-blur-sm border border-slate-200 rounded-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)] p-4 text-[13px] text-slate-700 min-w-[200px] z-50">
          <p className="font-bold text-slate-800 mb-3 border-b border-slate-100 pb-2 text-[14px]">{label}</p>
          <div className="flex flex-col gap-1.5">
            {payload?.map((entry, index) => {
              const displayValue = entry.name === '% Cost To Volume' 
                ? Number(entry.value || 0).toFixed(4)
                : Math.abs(entry.value || 0).toFixed(2);
              return (
                <div key={index} className="flex justify-between items-center text-[12px]">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }}></div>
                    <span className="text-slate-600 font-medium">{entry.name}:</span>
                  </div>
                  <span className="font-bold text-slate-800 ml-4">{displayValue}</span>
                </div>
              );
            })}
          </div>
        </div>
      );
    }
    return null;
  };

  // Config Chart.js P/L Diverging Bar
  const getChartJsData = (dataArray) => ({
    labels: dataArray.map(d => d.name),
    datasets: [
      {
        type: 'line',
        label: '%Margin to Volume', 
        data: dataArray.map(d => d.plLine),
        borderColor: '#3b82f6', 
        borderWidth: 2.5, 
        pointRadius: 0, 
        pointHoverRadius: 0,
        fill: false,
        pointStyle: 'line', 
      },
      {
        type: 'bar',
        label: 'Profit',
        data: dataArray.map(d => d.plProfit),
        backgroundColor: '#22c55e', 
        borderColor: '#71717a',
        borderWidth: 1,
        borderRadius: { topLeft: 4, topRight: 4 }, 
        pointStyle: 'rect', 
      },
      {
        type: 'bar',
        label: 'Loss',
        data: dataArray.map(d => d.plLoss),
        backgroundColor: '#ef4444', 
        borderColor: '#71717a',
        borderWidth: 1,
        borderRadius: { bottomLeft: 4, bottomRight: 4 }, 
        pointStyle: 'rect', 
      }
    ]
  });

  const chartJsOptions = {
    responsive: true, maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    layout: { padding: { top: 30, bottom: 25 } },
    scales: {
      x: { stacked: true, grid: { display: false, drawBorder: false }, ticks: { font: { size: 10 }, color: '#64748b' } },
      y: {
        stacked: true,
        grace: '10%', 
        grid: { color: (c) => c.tick.value === 0 ? '#000000' : 'transparent', lineWidth: (c) => c.tick.value === 0 ? 1.5 : 0, drawBorder: false },
        ticks: { display: false } 
      }
    },
    plugins: {
      legend: { 
        display: true, 
        position: 'top', 
        labels: { 
          usePointStyle: true, 
          boxWidth: 16, 
          font: { size: 11 } 
        } 
      },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)', 
        titleColor: '#0f172a',
        bodyColor: '#334155',
        borderColor: '#e2e8f0',
        borderWidth: 1,
        padding: 12,
        boxPadding: 4,
        usePointStyle: true,
        callbacks: {
          label: (context) => {
            let label = context.dataset.label || '';
            if (label) label += ': ';
            
            // JIKA LINE CHART (Percentage Margin), ambil nilai aslinya untuk tooltip agar terlihat saat loss
            if (context.dataset.type === 'line') {
              const profitVal = context.chart.data.datasets[1].data[context.dataIndex] || 0;
              const lossVal = context.chart.data.datasets[2].data[context.dataIndex] || 0;
              const actualMargin = profitVal > 0 ? profitVal : lossVal; // Menangkap persentase asli (bisa minus)
              label += actualMargin.toFixed(1) + '%';
            } else {
              // Untuk bar Profit & Loss
              if (context.parsed.y !== null) label += Math.abs(context.parsed.y).toFixed(1) + '%';
            }
            return label;
          },
          labelColor: (context) => {
            return { borderColor: context.dataset.borderColor, backgroundColor: context.dataset.backgroundColor };
          }
        }
      }
    }
  };

  // ==========================================
  // 5. RENDER UI
  // ==========================================
  return (
    <div className="flex h-screen bg-[#f8fafc] font-sans text-slate-800 overflow-hidden relative">

      {/* --- OVERLAY MOBILE MENU --- */}
      <div className={`md:hidden fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 transition-opacity duration-300 ${isMobileMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={() => setIsMobileMenuOpen(false)}></div>

      {/* --- SIDEBAR KIRI --- */}
      <aside className={`fixed md:relative z-50 left-0 top-0 h-full bg-transparent md:bg-[#f8fafc] border-none md:border-r border-slate-200/60 transform transition-transform duration-300 ease-out ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 w-[100px] md:w-[104px] flex flex-col justify-between items-center py-6 sm:py-8 shrink-0`}>
        <div className="bg-white rounded-[2.5rem] flex flex-col items-center py-8 px-4 shadow-[0_8px_30px_rgb(0,0,0,0.12)] md:shadow-sm border border-slate-100/50 md:border-slate-100">
          <button className="md:hidden mb-8 text-slate-400 hover:text-blue-600 transition-colors" onClick={() => setIsMobileMenuOpen(false)}><X size={26} strokeWidth={1.5} /></button>
          <nav className="flex flex-col gap-8 items-center">
            <button className="text-blue-600 transition-colors" title="Dashboard"><CreditCard size={24} strokeWidth={1.5} /></button>
            <button onClick={() => navigate('/detail-cost')} className="text-slate-400 hover:text-blue-600 transition-colors" title="Detail Cost"><Book size={24} strokeWidth={1.5} /></button>
          </nav>
        </div>
        <div className="flex flex-col gap-4 relative">
          <div className="relative flex justify-center">
            <button onClick={() => setIsProfileOpen(!isProfileOpen)} className={`bg-white rounded-full w-14 h-14 flex items-center justify-center shadow-[0_8px_30px_rgb(0,0,0,0.12)] md:shadow-sm border text-slate-600 hover:bg-slate-50 transition-colors relative z-20 ${isProfileOpen ? 'border-blue-400 ring-2 ring-blue-100' : 'border-slate-100'}`}>
              <User size={22} strokeWidth={1.5} />
              <ChevronUp size={14} strokeWidth={2} className={`absolute top-2 right-1 text-slate-400 transition-transform duration-300 ${isProfileOpen ? 'rotate-180 text-blue-500' : ''}`} />
            </button>
          </div>
          <button onClick={handleLogout} className="bg-white rounded-[1.25rem] w-14 h-14 flex items-center justify-center shadow-[0_8px_30px_rgb(0,0,0,0.12)] md:shadow-sm border border-slate-100 text-slate-600 hover:bg-rose-50 hover:text-rose-600 transition-colors"><LogOut size={22} strokeWidth={1.5} className="transform rotate-180" /></button>
        </div>
      </aside>

      {/* --- KONTEN DASBOR UTAMA --- */}
      <main className="flex-1 flex flex-col h-screen overflow-x-hidden overflow-y-auto" onClick={() => setIsProfileOpen(false)}>
        
        {/* MOBILE HEADER BAR */}
        <div className="md:hidden flex justify-between items-center bg-white px-5 py-4 border-b border-slate-200 sticky top-0 z-20">
          <button onClick={() => setIsMobileMenuOpen(true)} className="text-slate-700 hover:text-blue-600"><Menu size={24} /></button>
          <h1 className="font-bold text-lg text-slate-900 tracking-tight">Dashboard</h1>
          <div className="w-8 h-8 bg-blue-50 rounded-full flex items-center justify-center text-blue-600"><User size={16} /></div>
        </div>

        <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto w-full">
          
          {/* BANNER BIRU KEPALA */}
          <div className="w-full h-12 sm:h-14 bg-[#0A3A6A] rounded-xl flex justify-between items-center px-5 sm:px-8 mb-8 shadow-md overflow-hidden">
            <div className="shrink-0 flex items-center"><img src={LogoMandiri} alt="Mandiri" className="h-10 sm:h-12 scale-[1.5] sm:scale-[1.8] transform origin-left object-contain" /></div>
            <div className="text-center flex-1 px-4 hidden md:block mt-1">
              <h2 className="text-white text-base lg:text-[18px] font-bold tracking-wide uppercase leading-none">Dashboard Principal Fee eChannel Transaction</h2>
              <p className="text-white text-[10px] lg:text-[11px] font-light mt-1 opacity-90 tracking-widest italic leading-none">ELECTRONIC CHANNEL OPERATIONS GROUP</p>
            </div>
            <div className="shrink-0 flex items-center"><img src={LogoDanantara} alt="Danantara" className="h-5 sm:h-4 scale-[2] sm:scale-[2.5] transform origin-right object-contain" /></div>
          </div>

          {/* FILTER UTAMA (KIRI TEKS, KANAN FILTER) */}
          <header className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-6 w-full gap-4 border-b border-slate-200/60 pb-6">
            <div className="text-[13px] font-bold text-slate-500 whitespace-nowrap order-2 xl:order-1 flex items-center gap-2">
              <CalendarIcon size={16} className="text-blue-600" /> Data per 31 Agu 2026 • Pembanding: Jul 2026
            </div>

            <div className="flex flex-wrap items-end justify-end gap-3 w-full xl:w-auto order-1 xl:order-2" onClick={(e) => e.stopPropagation()}>
              <div className="flex flex-col w-full sm:w-auto">
                <label className="text-[12px] font-bold text-[#1e3a8a] mb-1.5">Periode</label>
                <div className="relative">
                  <select className="w-full sm:w-[160px] text-[13px] font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg py-2 pl-3 pr-8 outline-none appearance-none cursor-pointer hover:border-blue-400 transition-colors shadow-sm" value={filters.periode} onChange={(e) => setFilters({...filters, periode: e.target.value})}>
                    <option value="All">All Periode</option><option value="Agustus 2026">Agustus 2026</option><option value="Juli 2026">Juli 2026</option><option value="Juni 2026">Juni 2026</option><option value="Mei 2026">Mei 2026</option><option value="April 2026">April 2026</option>
                  </select>
                  <ChevronDown size={14} className="text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
                </div>
              </div>

              <div className="flex flex-col w-full sm:w-auto">
                <label className="text-[12px] font-bold text-[#1e3a8a] mb-1.5">Principal</label>
                <div className="relative">
                  <select className="w-full sm:w-[160px] text-[13px] font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg py-2 pl-3 pr-8 outline-none appearance-none cursor-pointer hover:border-blue-400 transition-colors shadow-sm" value={filters.principal} onChange={(e) => setFilters({...filters, principal: e.target.value})}>
                    <option value="All">All Principals</option><option value="Visa">Visa</option><option value="Mastercard">Mastercard</option><option value="JCB">JCB</option><option value="QR Rintis">QR Rintis</option><option value="NPG Jalin">NPG Jalin</option><option value="NPG Artajasa">NPG Artajasa</option><option value="NPG Rintis">NPG Rintis</option>
                  </select>
                  <ChevronDown size={14} className="text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
                </div>
              </div>

              <button onClick={handleApply} className="bg-[#0f172a] hover:bg-black text-white text-[13px] font-semibold px-6 py-2 rounded-lg transition-all shadow-sm w-full sm:w-auto h-[38px]">Apply</button>
              <button onClick={handleReset} className="text-[#1e3a8a] hover:text-blue-800 hover:underline text-[13px] font-semibold px-2 py-2 transition-all w-full sm:w-auto h-[38px] bg-transparent border-none">Reset</button>
            </div>
          </header>

          {/* SUMMARY CARDS (5 GRID) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-3 xl:gap-4 mb-6">
            {[
              { label: 'Sales Volume', icon: BarChart2 },
              { label: 'Cost', icon: CreditCard },
              { label: 'Cost To Volume', icon: Clock },
              { label: 'Income', icon: BarChart2 },
              { label: 'Income To Volume', icon: BarChart2 }
            ].map((card, idx) => {
              
              const getDynamicStats = (groupName) => {
                const groupData = dashboardData.groupStats.find(g => g.name === groupName);
                const baseVal = groupData ? groupData.totalSort : 0;
                if (baseVal === 0) return { amount: '0', pct: '0%', isUp: true };
                let amountStr = '';
                if (card.label === 'Sales Volume') amountStr = ((baseVal % 5000) / 800 + 2.5).toFixed(2) + ' T';
                else if (card.label === 'Cost') amountStr = ((baseVal % 3000) / 500 + 0.5).toFixed(2) + ' B';
                else if (card.label === 'Cost To Volume') amountStr = ((baseVal % 2) / 10 + 0.01).toFixed(2);
                else if (card.label === 'Income') amountStr = ((baseVal % 2500) / 400 + 0.8).toFixed(2) + ' B';
                else if (card.label === 'Income To Volume') amountStr = ((baseVal % 2) / 10 + 0.03).toFixed(2); 
        
                const pctNum = (baseVal % 2.5 + 0.1).toFixed(1);
                const pct = `${pctNum}%`;
                const isUp = (Math.round(baseVal * 100) % 2 === 0);
                return { amount: amountStr, pct, isUp };
              };

              const statsGrid = [
                { label: 'Credit', ...getDynamicStats('Credit Card') },
                { label: 'Debit', ...getDynamicStats('Debit Card') },
                { label: 'Acquiring', ...getDynamicStats('Acquiring') }
              ];

              const isReverseTrend = card.label === 'Cost' || card.label === '% Cost To Volume';
              const colorUp = isReverseTrend ? 'text-rose-500' : 'text-emerald-500';
              const colorDown = isReverseTrend ? 'text-emerald-500' : 'text-rose-500';

              return (
                <div key={idx} className="bg-white p-4 xl:p-5 rounded-2xl shadow-sm border border-slate-200/60 relative overflow-hidden flex flex-col justify-between">
                  <div className="absolute top-0 left-0 w-full h-[3px] bg-amber-400 rounded-t-2xl"></div>
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-1.5">
                      <p className="text-[10px] xl:text-[11px] font-bold text-slate-500 uppercase tracking-wider">{card.label}</p>
                    </div>
                    <div className="w-8 h-8 xl:w-10 xl:h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                      <card.icon size={16} strokeWidth={1.5} />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5 mt-2 pt-2 border-t border-slate-100">
                    {statsGrid.map((stat, i) => (
                      <div key={i} className="flex flex-col items-center">
                        <span className="text-[8px] xl:text-[9px] text-slate-500 font-semibold text-center leading-tight mb-1">{stat.label}</span>
                        <div className="bg-slate-50/70 py-1.5 px-1 rounded-lg border border-slate-100 w-full text-center">
                          <span className="text-[11px] xl:text-[13px] font-bold text-slate-800">{stat.amount}</span>
                        </div>
                        <div className="flex flex-col items-center justify-center mt-1">
                          <div className="flex items-center gap-0.5">
                            <span className={`text-[8px] ${stat.isUp ? colorUp : colorDown}`}>{stat.isUp ? '▲' : '▼'}</span>
                            <span className={`text-[9px] font-bold ${stat.isUp ? colorUp : colorDown}`}>{stat.pct}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="text-center mt-3 pt-2 border-t border-slate-50 border-dashed">
                    <span className="text-[10px] font-medium text-slate-400">vs Jul 2026</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* MAIN CHARTS AREA */}
          <div className="grid grid-cols-12 gap-5 pb-10">

            {/* --- BARISAN 1: 3 COMBO GRIDS (CREDIT, DEBIT, ACQUIRING) --- */}
            <div className="col-span-12 lg:col-span-4 bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-slate-200/60 flex flex-col h-[350px]">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-bold text-[#0f172a] tracking-tight text-[15px]">Credit</h3>
              </div>
              <div className="flex-1 w-full overflow-visible mt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={dashboardData.creditChartData} barGap={0} barCategoryGap="20%" margin={{top: 10, bottom: 0, right: 0, left: -20}}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#64748b'}} dy={5} />
                    <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#64748b'}} dx={-5} width={35} domain={[0, dataMax => Math.ceil((dataMax || 1) * 1.8)]} />
                    <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#64748b'}} dx={5} width={35} domain={[0, dataMax => ((dataMax || 1) * 1.1)]} />
                    <RechartsTooltip content={<CustomTrendTooltip />} cursor={{ fill: '#f8fafc' }} />
                    <RechartsLegend verticalAlign="top" wrapperStyle={{ fontSize: '11px', paddingBottom: '10px' }} />
                    
                    <Bar yAxisId="left" dataKey="salesVolume" name="Sales Vol" fill="#2563eb" maxBarSize={15} radius={[2, 2, 0, 0]} />
                    <Bar yAxisId="left" dataKey="principalCost" name="Cost" fill="#eab308" maxBarSize={15} radius={[2, 2, 0, 0]} />
                    
                    <Line yAxisId="right" type="monotone" dataKey="costToVolume" name="% Cost To Volume" stroke="#ef4444" strokeWidth={2.5} dot={false} activeDot={false} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="col-span-12 lg:col-span-4 bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-slate-200/60 flex flex-col h-[350px]">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-bold text-[#0f172a] tracking-tight text-[15px]">Debit</h3>
              </div>
              <div className="flex-1 w-full overflow-visible mt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={dashboardData.debitChartData} barGap={0} barCategoryGap="20%" margin={{top: 10, bottom: 0, right: 0, left: -20}}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#64748b'}} dy={5} />
                    <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#64748b'}} dx={-5} width={35} domain={[0, dataMax => Math.ceil((dataMax || 1) * 1.8)]} />
                    <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#64748b'}} dx={5} width={35} domain={[0, dataMax => ((dataMax || 1) * 1.1)]} />
                    <RechartsTooltip content={<CustomTrendTooltip />} cursor={{ fill: '#f8fafc' }} />
                    <RechartsLegend verticalAlign="top" wrapperStyle={{ fontSize: '11px', paddingBottom: '10px' }} />
                    
                    <Bar yAxisId="left" dataKey="salesVolume" name="Sales Vol" fill="#2563eb" maxBarSize={15} radius={[2, 2, 0, 0]} />
                    <Bar yAxisId="left" dataKey="principalCost" name="Cost" fill="#eab308" maxBarSize={15} radius={[2, 2, 0, 0]} />
                    <Line yAxisId="right" type="monotone" dataKey="costToVolume" name="% Cost To Volume" stroke="#ef4444" strokeWidth={2.5} dot={false} activeDot={false} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="col-span-12 lg:col-span-4 bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-slate-200/60 flex flex-col h-[350px]">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-bold text-[#0f172a] tracking-tight text-[15px]">Acquiring</h3>
              </div>
              <div className="flex-1 w-full overflow-visible mt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={dashboardData.acquiringChartData} barGap={0} barCategoryGap="20%" margin={{top: 10, bottom: 0, right: 0, left: -20}}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#64748b'}} dy={5} />
                    <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#64748b'}} dx={-5} width={35} domain={[0, dataMax => Math.ceil((dataMax || 1) * 1.8)]} />
                    <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#64748b'}} dx={5} width={35} domain={[0, dataMax => ((dataMax || 1) * 1.1)]} />
                    <RechartsTooltip content={<CustomTrendTooltip />} cursor={{ fill: '#f8fafc' }} />
                    <RechartsLegend verticalAlign="top" wrapperStyle={{ fontSize: '11px', paddingBottom: '10px' }} />
                    
                    <Bar yAxisId="left" dataKey="salesVolume" name="Sales Vol" fill="#2563eb" maxBarSize={15} radius={[2, 2, 0, 0]} />
                    <Bar yAxisId="left" dataKey="principalCost" name="Cost" fill="#eab308" maxBarSize={15} radius={[2, 2, 0, 0]} />
                    <Line yAxisId="right" type="monotone" dataKey="costToVolume" name="% Cost To Volume" stroke="#ef4444" strokeWidth={2.5} dot={false} activeDot={false} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* --- BARISAN 2: 3 GRID P/L --- */}
            {['Credit', 'Debit', 'Acquiring'].map((group, index) => {
              
              const currentData = group === 'Credit' ? dashboardData.creditChartData : 
                                  group === 'Debit' ? dashboardData.debitChartData : 
                                  dashboardData.acquiringChartData;

              return (
                <div key={index} className="col-span-12 lg:col-span-4 bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-slate-200/60 flex flex-col h-[350px] relative group overflow-visible">
                  
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-bold text-[#0f172a] tracking-tight text-[15px]">P/L {group}</h3>
                  </div>

                  <div className="flex-1 w-full overflow-hidden mt-2 relative">
                    <ChartJsComponent 
                      type='bar'
                      data={getChartJsData(currentData)} 
                      options={chartJsOptions} 
                      plugins={[customLabelsPlugin]} 
                    />
                  </div>
                </div>
              );
            })}

          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;