import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Menu, CreditCard, Book, ShoppingCart, FileText, 
  Calendar as CalendarIcon, User, ChevronUp, ChevronDown, LogOut, Filter, 
  BarChart2, Clock, CheckCircle2, AlertTriangle, AlertCircle, Settings, X,
  Info,
  CardSim
} from 'lucide-react';

// RECHARTS UNTUK GRAFIK STANDARD
import { 
  ComposedChart, LineChart, Line, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip as RechartsTooltip, Legend as RechartsLegend, ResponsiveContainer, 
  PieChart, Pie, Cell, BarChart 
} from 'recharts';

// CHART.JS UNTUK DIVERGING BAR CHART (P/L)
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip as ChartJsTooltip,
  Legend as ChartJsLegend,
} from 'chart.js';
import { Bar as ChartJsBar } from 'react-chartjs-2';

// REGISTER CHART.JS COMPONENTS
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, ChartJsTooltip, ChartJsLegend);

// IMPORT GAMBAR LOGO
import LogoMandiri from  './danatara.png';
import LogoDanantara from './mandiri.png';

// ==========================================
// 1. GENERATE DUMMY DATABASE MASIF DENGAN LOGIKA REALISTIS
// ==========================================
const generateDummyData = () => {
  const data = [];
  let currentDate = new Date(2024, 0, 1);
  const endDate = new Date(2026, 11, 31);
  
  let i = 0;
  while (currentDate <= endDate) {
    const numTrx = Math.floor(Math.random() * 20) + 1; 

    for(let j=0; j < numTrx; j++) {
      const typeRand = Math.random();
      const type = typeRand > 0.55 ? 'Visa' : (typeRand > 0.15 ? 'Mastercard' : 'Others');
      
      const groupRand = Math.random();
      let groupName = groupRand > 0.4 ? 'Acquiring' : (groupRand > 0.2 ? 'Credit Card' : 'Debit Card');
      
      let subGroup = null;
      if (groupName === 'Acquiring') {
        subGroup = Math.random() > 0.4 ? 'Interchange' : 'Service';
      }

      const statusRand = Math.random();
      let status = '';
      if (statusRand > 0.55) status = 'Done Rekon (No Deviasi)';
      else if (statusRand > 0.35) status = 'Done Rekon (Deviasi)';
      else if (statusRand > 0.20) status = 'Belum Rekon';
      else if (statusRand > 0.10) status = 'Fixed Rate';
      else status = 'New Billing';

      const dateString = `${currentDate.getFullYear()}-${String(currentDate.getMonth()+1).padStart(2,'0')}-${String(currentDate.getDate()).padStart(2,'0')}`;

      const baseCost = Math.random() * 5 + 0.5; 
      const spikeMultiplier = Math.random() > 0.85 ? 3 : 1; 
      const principalCost = Number((baseCost * spikeMultiplier).toFixed(3));
      
      const salesVolume = Number((principalCost * (Math.random() * 10 + 5)).toFixed(0));
      const costRate = Number((Math.random() * 0.01 + 0.035).toFixed(3));

      data.push({
        id: `TRX-${currentDate.getFullYear()}${String(currentDate.getMonth()+1).padStart(2,'0')}-${1000 + i}`,
        date: dateString, 
        principal: type, 
        group: groupName, 
        subGroup: subGroup, 
        status: status,
        salesVolume: salesVolume, 
        principalCost: principalCost, 
        costRate: costRate,
        merchant: `Merchant ${String.fromCharCode(65 + (i % 5))}`,
      });
      i++;
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }
  return data;
};

const DUMMY_DB = generateDummyData();

// ==========================================
// CUSTOM TOOLTIP CHART.JS UNTUK P/L
// Membuat popup Chart.js persis seperti Recharts
// ==========================================
const getOrCreateTooltip = (chart) => {
  let tooltipEl = chart.canvas.parentNode.querySelector('div.chartjs-tooltip');

  if (!tooltipEl) {
    tooltipEl = document.createElement('div');
    tooltipEl.classList.add('chartjs-tooltip');
    tooltipEl.style.background = 'white';
    tooltipEl.style.borderRadius = '12px';
    tooltipEl.style.boxShadow = '0 10px 40px -10px rgba(0,0,0,0.15)';
    tooltipEl.style.border = '1px solid #e2e8f0';
    tooltipEl.style.opacity = 1;
    tooltipEl.style.pointerEvents = 'none';
    tooltipEl.style.position = 'absolute';
    tooltipEl.style.transform = 'translate(-50%, -100%)'; 
    tooltipEl.style.transition = 'all .1s ease';
    tooltipEl.style.minWidth = '200px';
    tooltipEl.style.zIndex = '50';
    tooltipEl.style.padding = '16px';
    
    const table = document.createElement('table');
    table.style.margin = '0px';
    table.style.width = '100%';
    table.style.borderCollapse = 'collapse';

    tooltipEl.appendChild(table);
    chart.canvas.parentNode.appendChild(tooltipEl);
  }
  return tooltipEl;
};

const externalTooltipHandler = (context) => {
  const {chart, tooltip} = context;
  const tooltipEl = getOrCreateTooltip(chart);

  if (tooltip.opacity === 0) {
    tooltipEl.style.opacity = 0;
    return;
  }

  if (tooltip.body) {
    const titleLines = tooltip.title || [];
    const bodyLines = tooltip.body.map(b => b.lines);

    let innerHtml = '<thead>';
    titleLines.forEach(title => {
      innerHtml += `<tr><th style="text-align:left; font-weight:bold; color:#1e293b; padding-bottom:8px; border-bottom:1px solid #f1f5f9; font-size:14px;">${title}</th></tr>`;
    });
    innerHtml += '</thead><tbody>';

    let baseVal = 0;
    bodyLines.forEach((body, i) => {
      const colors = tooltip.labelColors[i];
      const parts = body[0].split(':');
      const name = parts[0].trim();
      const valNum = parseFloat(parts[1].trim());
      
      baseVal += valNum;
      const displayVal = Math.abs(valNum).toFixed(2); // Angka absolute agar loss tidak pakai tanda minus di tooltip
      const colorSquare = `<span style="display:inline-block; width:10px; height:10px; border-radius:50%; background:${colors.backgroundColor}; margin-right:8px;"></span>`;

      innerHtml += `<tr><td style="padding-top:8px; font-size:12px; color:#475569; display:flex; justify-content:space-between; align-items:center;">
        <div style="display:flex; align-items:center;">${colorSquare} <span>${name}:</span></div>
        <strong style="color:#1e293b; margin-left:16px;">${displayVal}</strong>
      </td></tr>`;
    });

    const isUp = Math.round(baseVal) % 2 === 0;
    const dynamicPct = (Math.abs(baseVal) % 2.5 + 0.1).toFixed(1);
    const trendColor = isUp ? '#10b981' : '#ef4444';
    const trendArrow = isUp ? '▲' : '▼';

    innerHtml += `<tr><td style="padding-top:12px;">
      <div style="background:#f8fafc; border-radius:8px; padding:6px; display:flex; justify-content:center; align-items:center; gap:6px;">
        <span style="color:${trendColor}; font-size:12px; font-weight:bold;">${trendArrow} ${dynamicPct}%</span>
        <span style="font-size:11px; font-weight:bold; color:#1e293b;">vs Jul 2026</span>
      </div>
    </td></tr>`;

    innerHtml += '</tbody>';

    const tableRoot = tooltipEl.querySelector('table');
    tableRoot.innerHTML = innerHtml;
  }

  const {offsetLeft: positionX, offsetTop: positionY} = chart.canvas;
  tooltipEl.style.opacity = 1;
  tooltipEl.style.left = positionX + tooltip.caretX + 'px';
  tooltipEl.style.top = positionY + tooltip.caretY - 10 + 'px';
};


const Dashboard = () => {
  const navigate = useNavigate();

  // ==========================================
  // 2. STATE MANAGEMENT 
  // ==========================================
  const [filters, setFilters] = useState({ periode: 'All', principal: 'All' });
  const [appliedFilters, setAppliedFilters] = useState({ ...filters });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalData, setModalData] = useState([]);
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
  // 3. LOGIKA FILTERING & AGREGASI
  // ==========================================
  useEffect(() => {
    const periodMap = {
      'Agustus 2026': '2026-08', 'Juli 2026': '2026-07', 'Juni 2026': '2026-06',
      'Mei 2026': '2026-05', 'April 2026': '2026-04', 'All': 'All'
    };
    const targetPeriod = periodMap[appliedFilters.periode];

    const globalFilteredDB = DUMMY_DB.filter(item => {
      const passPeriode = targetPeriod === 'All' || item.date.startsWith(targetPeriod);
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

    let totalSales = 0, totalCost = 0, totalRate = 0;
    let creditService = 0, debitService = 0, acqInterchange = 0, acqService = 0;

    globalFilteredDB.forEach(item => {
      totalSales += item.salesVolume; totalCost += item.principalCost; totalRate += item.costRate;
      
      if (item.group === 'Credit Card') creditService += item.principalCost; 
      else if (item.group === 'Debit Card') debitService += item.principalCost; 
      else if (item.group === 'Acquiring') {
        if (item.subGroup === 'Interchange') acqInterchange += item.principalCost;
        else if (item.subGroup === 'Service') acqService += item.principalCost;
      }
    });

    const getChartData = (baseDB, filterGroup) => {
      const chartFilteredDB = baseDB.filter(item => {
        if (filterGroup === 'All') return true;
        if (filterGroup === 'Acquiring') return item.group === 'Acquiring';
        if (filterGroup === 'Issuing Debit') return item.group === 'Debit Card';
        if (filterGroup === 'Issuing Credit') return item.group === 'Credit Card';
        return true;
      });

      const chartMap = {};
      const monthsShort = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agt', 'Sep', 'Okt', 'Nov', 'Des'];

      chartFilteredDB.forEach(item => {
        const d = new Date(item.date);
        const groupKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`; 
        const displayLabel = `${monthsShort[d.getMonth()]} '${String(d.getFullYear()).slice(-2)}`;

        if (!chartMap[groupKey]) {
          chartMap[groupKey] = { 
            label: displayLabel, salesVolume: 0, principalCost: 0, count: 0, sortKey: groupKey,
            totalIncome: 0, negativeCost: 0
          };
        }
        
        chartMap[groupKey].salesVolume += item.salesVolume; 
        chartMap[groupKey].count += 1;

        const pCost = item.principalCost;
        const isLoss = Math.random() > 0.65; 
        const pInc = isLoss ? pCost * 0.7 : pCost * 1.5; 
        
        chartMap[groupKey].principalCost += pCost;
        chartMap[groupKey].totalIncome += pInc;
        chartMap[groupKey].negativeCost -= pCost; // Minus agar Bar merah mengarah ke bawah
      });

      return Object.values(chartMap).sort((a, b) => a.sortKey.localeCompare(b.sortKey)).map(data => ({
        name: data.label,
        salesVolume: Number(data.salesVolume.toFixed(0)),
        principalCost: Number(data.principalCost.toFixed(2)),
        totalIncome: Number(data.totalIncome.toFixed(2)),
        negativeCost: Number(data.negativeCost.toFixed(2))
      }));
    };

    const avgRate = (totalRate / globalFilteredDB.length).toFixed(3);

    setDashboardData({
      summary: { sales: totalSales.toFixed(0), cost: totalCost.toFixed(2), rate: avgRate },
      creditChartData: getChartData(globalFilteredDB, 'Issuing Credit'),
      debitChartData: getChartData(globalFilteredDB, 'Issuing Debit'),
      acquiringChartData: getChartData(globalFilteredDB, 'Acquiring'),
      groupStats: [
        { name: 'Credit Card', interchange: 0, service: Number(creditService.toFixed(2)), totalSort: Number(creditService.toFixed(2)) }, 
        { name: 'Debit Card', interchange: 0, service: Number(debitService.toFixed(2)), totalSort: Number(debitService.toFixed(2)) }, 
        { name: 'Acquiring', interchange: Number(acqInterchange.toFixed(2)), service: Number(acqService.toFixed(2)), totalSort: Number((acqInterchange + acqService).toFixed(2)) }
      ].sort((a,b) => b.totalSort - a.totalSort)
    });
  }, [appliedFilters]);

  // ==========================================
  // 4. HANDLERS & CHART.JS CONFIG
  // ==========================================
  const handleApply = () => setAppliedFilters({ ...filters });

  const handleReset = () => {
    setFilters({ periode: 'All', principal: 'All' });
    setAppliedFilters({ periode: 'All', principal: 'All' });
  };

  const handleLogout = () => alert("Logout berhasil!");
  const handleViewDetail = () => navigate('/detail-cost');
  
  const CustomInterchangeTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const baseVal = payload[0].value || 0;
      const isUp = Math.round(baseVal) % 2 === 0;
      const dynamicPct = (Math.abs(baseVal) % 2.5 + 0.1).toFixed(1);

      return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)] p-4 text-[13px] text-slate-700 min-w-[200px] z-50">
          <p className="font-bold text-slate-800 mb-3 border-b border-slate-100 pb-2 text-[14px]">{label}</p>
          <div className="flex flex-col gap-1.5">
            {payload.map((entry, index) => {
              const displayValue = Math.abs(entry.value || 0).toFixed(2);
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
          <div className="mt-3 pt-3 border-t border-slate-100 flex justify-center items-center gap-1.5 bg-slate-50/50 rounded-lg p-1.5">
            <span className={`text-[12px] font-bold ${isUp ? 'text-emerald-500' : 'text-rose-500'}`}>{isUp ? '▲' : '▼'} {dynamicPct}%</span>
            <span className="text-[11px] font-bold text-slate-800">vs Jul 2026</span>
          </div>
        </div>
      );
    }
    return null;
  };

  const getChartJsData = (dataArray) => {
    return {
      labels: dataArray.map(d => d.name),
      datasets: [
        {
          label: 'Profit',
          data: dataArray.map(d => d.totalIncome),
          backgroundColor: '#22c55e', 
          borderColor: '#a1a1aa',
          borderWidth: 1,
        },
        {
          label: 'Loss',
          data: dataArray.map(d => d.negativeCost),
          backgroundColor: '#ef4444', 
          borderColor: '#a1a1aa',
          borderWidth: 1,
        }
      ]
    };
  };

  const chartJsOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    layout: {
      padding: { top: 10, bottom: 10 }
    },
    scales: {
      x: {
        stacked: true,
        grid: { display: false, drawBorder: false },
        ticks: { font: { size: 10 }, color: '#64748b' }
      },
      y: {
        stacked: true,
        grid: {
          color: (context) => context.tick.value === 0 ? '#000000' : 'rgba(0,0,0,0)',
          lineWidth: (context) => context.tick.value === 0 ? 1.5 : 0,
          drawBorder: false
        },
        ticks: { display: false } 
      }
    },
    plugins: {
      legend: {
        display: true,
        position: 'top',
        labels: { boxWidth: 12, font: { size: 11 } }
      },
      tooltip: {
        enabled: false, 
        external: externalTooltipHandler // Menggunakan custom tooltip
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

          {/* FILTER UTAMA DI BAWAH HEADER (PERIODE, PRINCIPAL) */}
          <header className="flex flex-col xl:flex-row justify-between items-start xl:items-end mb-6 w-full gap-4">
            <div className="flex flex-wrap items-end gap-3 w-full xl:w-auto" onClick={(e) => e.stopPropagation()}>
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
            
            <div className="text-[11px] font-medium text-slate-500 whitespace-nowrap xl:pb-2">
              Data per 31 Agu 2026 • Pembanding: Jul 2026
            </div>
          </header>

          {/* SUMMARY CARDS (5 GRID DALAM 1 BARIS) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-3 xl:gap-4 mb-6">
            {[
              { label: 'Sales Volume', icon: BarChart2, tColor: 'text-emerald-600' },
              { label: 'Total Principal Cost', icon: CreditCard, tColor: 'text-emerald-600' },
              { label: 'Cost Per Volume', icon: Clock, tColor: 'text-rose-500' },
              { label: 'Income', icon: BarChart2, tColor: 'text-emerald-600' },
              { label: 'Income To Volume', icon: BarChart2, tColor: 'text-emerald-600' }
            ].map((card, idx) => {
              
              const getDynamicStats = (groupName) => {
                const groupData = dashboardData.groupStats.find(g => g.name === groupName);
                const baseVal = groupData ? groupData.totalSort : 0;
                if (baseVal === 0) return { amount: '0', pct: '0%', isUp: true };
                let amountStr = '';
                if (card.label === 'Sales Volume') amountStr = ((baseVal % 8000) / 400 + 1.2).toFixed(2) + ' T';
                else if (card.label === 'Total Principal Cost') amountStr = ((baseVal % 3000) / 500 + 0.5).toFixed(2) + ' B';
                else if (card.label === 'Cost Per Volume') amountStr = ((baseVal % 2) / 10 + 0.01).toFixed(2);
                else if (card.label === 'Income') amountStr = ((baseVal % 2500) / 400 + 0.8).toFixed(2) + ' B';
                else if (card.label === 'Income To Volume') amountStr = ((baseVal % 2) / 10 + 0.03).toFixed(2); 
        
                const pctNum = (baseVal % 2.5 + 0.1).toFixed(1);
                const pct = `${pctNum}%`;
                const isUp = (Math.round(baseVal * 100) % 2 === 0);
                return { amount: amountStr, pct, isUp };
              };

              const statsGrid = [
                { label: 'Credit', color: 'bg-blue-600', ...getDynamicStats('Credit Card') },
                { label: 'Debit', color: 'bg-amber-500', ...getDynamicStats('Debit Card') },
                { label: 'Acquiring', color: 'bg-emerald-500', ...getDynamicStats('Acquiring') }
              ];

              const overallIsUp = idx % 2 === 0;
              const overallPct = (1.2 + idx * 0.3).toFixed(1);

              return (
                <div key={idx} className="bg-white p-4 xl:p-5 rounded-2xl shadow-sm border border-slate-200/60 relative overflow-visible group flex flex-col justify-between hover:border-blue-300 transition-colors z-10 hover:z-50">
                  <div className="absolute top-0 left-0 w-full h-[3px] bg-amber-400 rounded-t-2xl"></div>
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-1.5 cursor-pointer">
                      <p className="text-[10px] xl:text-[11px] font-bold text-slate-400 uppercase tracking-wider">{card.label}</p>
                      <Info size={14} className="text-slate-300 group-hover:text-blue-500 transition-colors" />
                    </div>
                    <div className="w-8 h-8 xl:w-10 xl:h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
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
                        <div className="flex items-center justify-center gap-0.5 mt-1">
                          <span className={`text-[8px] ${stat.isUp ? 'text-emerald-500' : 'text-rose-500'}`}>{stat.isUp ? '▲' : '▼'}</span>
                          <span className={`text-[9px] font-bold ${stat.isUp ? 'text-emerald-600' : 'text-rose-600'}`}>{stat.pct}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="absolute z-50 left-1/2 -translate-x-1/2 top-full mt-2 w-[220px] bg-white border border-slate-200 rounded-xl shadow-[0_15px_40px_-10px_rgba(0,0,0,0.2)] p-4 text-[13px] text-slate-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 pointer-events-none origin-top scale-95 group-hover:scale-100">
                    <p className="font-bold text-slate-800 mb-3 border-b border-slate-100 pb-2 text-[14px]">{card.label} Breakdown</p>
                    <div className="flex flex-col gap-2">
                      {statsGrid.map((entry, idx2) => (
                        <div key={idx2} className="flex justify-between items-center text-[12px]">
                          <div className="flex items-center gap-2">
                            <div className={`w-2.5 h-2.5 rounded-full ${entry.color}`}></div>
                            <span className="text-slate-600 font-medium">{entry.label}:</span>
                          </div>
                          <span className="font-bold text-slate-800 ml-4">{entry.amount}</span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 pt-3 border-t border-slate-100 flex justify-center items-center gap-1.5 bg-slate-50/50 rounded-lg p-1.5">
                      <span className={`text-[12px] font-bold ${overallIsUp ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {overallIsUp ? '▲' : '▼'} {overallPct}%
                      </span>
                      <span className="text-[11px] font-bold text-slate-800">vs Jul 2026</span>
                    </div>
                  </div>

                </div>
              );
            })}
          </div>

          {/* MAIN CHARTS AREA */}
          <div className="grid grid-cols-12 gap-5 pb-10">

            {/* --- BARISAN 3 MINI GRIDS (CREDIT, DEBIT, ACQUIRING) --- */}
            <div className="col-span-12 lg:col-span-4 bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-slate-200/60 flex flex-col h-[320px]">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-bold text-[#0f172a] tracking-tight text-[15px]">Credit</h3>
              </div>
              <div className="flex-1 w-full overflow-visible mt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={dashboardData.creditChartData} margin={{top: 10, bottom: 0, right: 0, left: -20}}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#64748b'}} dy={5} />
                    <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#64748b'}} dx={-5} width={35} domain={[0, dataMax => Math.ceil(dataMax * 3.5)]} />
                    <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#64748b'}} dx={5} width={35} domain={[0, dataMax => Math.ceil(dataMax * 1.2)]} />
                    <RechartsTooltip content={<CustomInterchangeTooltip />} cursor={{ fill: '#f8fafc' }} />
                    <RechartsLegend verticalAlign="top" wrapperStyle={{ fontSize: '11px', paddingBottom: '10px' }} />
                    
                    <Bar yAxisId="left" dataKey="salesVolume" name="Sales Vol" fill="#2563eb" maxBarSize={30} radius={[4, 4, 0, 0]} />
                    <Line yAxisId="right" type="monotone" dataKey="principalCost" name="Cost" stroke="#ef4444" strokeWidth={2} dot={false} activeDot={{r: 4}} />
                    <Line yAxisId="right" type="monotone" dataKey="totalIncome" name="Income" stroke="#10b981" strokeWidth={2} dot={false} activeDot={{r: 4}} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="col-span-12 lg:col-span-4 bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-slate-200/60 flex flex-col h-[320px]">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-bold text-[#0f172a] tracking-tight text-[15px]">Debit</h3>
              </div>
              <div className="flex-1 w-full overflow-visible mt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={dashboardData.debitChartData} margin={{top: 10, bottom: 0, right: 0, left: -20}}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#64748b'}} dy={5} />
                    <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#64748b'}} dx={-5} width={35} domain={[0, dataMax => Math.ceil(dataMax * 3.5)]} />
                    <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#64748b'}} dx={5} width={35} domain={[0, dataMax => Math.ceil(dataMax * 1.2)]} />
                    <RechartsTooltip content={<CustomInterchangeTooltip />} cursor={{ fill: '#f8fafc' }} />
                    <RechartsLegend verticalAlign="top" wrapperStyle={{ fontSize: '11px', paddingBottom: '10px' }} />
                    
                    <Bar yAxisId="left" dataKey="salesVolume" name="Sales Vol" fill="#2563eb" maxBarSize={30} radius={[4, 4, 0, 0]} />
                    <Line yAxisId="right" type="monotone" dataKey="principalCost" name="Cost" stroke="#ef4444" strokeWidth={2} dot={false} activeDot={{r: 4}} />
                    <Line yAxisId="right" type="monotone" dataKey="totalIncome" name="Income" stroke="#10b981" strokeWidth={2} dot={false} activeDot={{r: 4}} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="col-span-12 lg:col-span-4 bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-slate-200/60 flex flex-col h-[320px]">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-bold text-[#0f172a] tracking-tight text-[15px]">Acquiring</h3>
              </div>
              <div className="flex-1 w-full overflow-visible mt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={dashboardData.acquiringChartData} margin={{top: 10, bottom: 0, right: 0, left: -20}}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#64748b'}} dy={5} />
                    <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#64748b'}} dx={-5} width={35} domain={[0, dataMax => Math.ceil(dataMax * 3.5)]} />
                    <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#64748b'}} dx={5} width={35} domain={[0, dataMax => Math.ceil(dataMax * 1.2)]} />
                    <RechartsTooltip content={<CustomInterchangeTooltip />} cursor={{ fill: '#f8fafc' }} />
                    <RechartsLegend verticalAlign="top" wrapperStyle={{ fontSize: '11px', paddingBottom: '10px' }} />
                    
                    <Bar yAxisId="left" dataKey="salesVolume" name="Sales Vol" fill="#2563eb" maxBarSize={30} radius={[4, 4, 0, 0]} />
                    <Line yAxisId="right" type="monotone" dataKey="principalCost" name="Cost" stroke="#ef4444" strokeWidth={2} dot={false} activeDot={{r: 4}} />
                    <Line yAxisId="right" type="monotone" dataKey="totalIncome" name="Income" stroke="#10b981" strokeWidth={2} dot={false} activeDot={{r: 4}} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* --- BARISAN KE-4: 3 GRID P/L MENGGUNAKAN CHART.JS AGAR PERSIS SEPERTI GAMBAR DIVERGING BAR CHART --- */}
            <div className="col-span-12 lg:col-span-4 bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-slate-200/60 flex flex-col h-[320px]">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-bold text-[#0f172a] tracking-tight text-[15px]">P/L Credit</h3>
              </div>
              <div className="flex-1 w-full overflow-hidden mt-2 relative">
                <ChartJsBar 
                  data={getChartJsData(dashboardData.creditChartData)} 
                  options={chartJsOptions} 
                />
              </div>
            </div>

            <div className="col-span-12 lg:col-span-4 bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-slate-200/60 flex flex-col h-[320px]">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-bold text-[#0f172a] tracking-tight text-[15px]">P/L Debit</h3>
              </div>
              <div className="flex-1 w-full overflow-hidden mt-2 relative">
                <ChartJsBar 
                  data={getChartJsData(dashboardData.debitChartData)} 
                  options={chartJsOptions} 
                />
              </div>
            </div>

            <div className="col-span-12 lg:col-span-4 bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-slate-200/60 flex flex-col h-[320px]">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-bold text-[#0f172a] tracking-tight text-[15px]">P/L Acquiring</h3>
              </div>
              <div className="flex-1 w-full overflow-hidden mt-2 relative">
                <ChartJsBar 
                  data={getChartJsData(dashboardData.acquiringChartData)} 
                  options={chartJsOptions} 
                />
              </div>ava
            </div>

          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;