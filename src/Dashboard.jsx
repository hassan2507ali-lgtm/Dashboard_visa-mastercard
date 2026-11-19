import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Menu, CreditCard, Book, ShoppingCart, FileText, 
  User, ChevronUp, ChevronDown, LogOut, Filter, 
  CheckCircle2, AlertTriangle, AlertCircle, Settings, X,
  CardSim, Table2
} from 'lucide-react';

// RECHARTS UNTUK LINE CHART PER PRINCIPAL
import {
  Line, Bar, ComposedChart, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, ResponsiveContainer, Legend, ReferenceLine, LabelList
} from 'recharts';
import ProfitabilityReport from './ProfitabilityReport';
import { AXIS_INTERVALS, buildAmountTicks, buildPctTicks, formatPctTick, yAxisBase, niceStep, capPct } from './chartAxis';

// IMPORT GAMBAR LOGO
import LogoMandiri from  './danatara.png';
import LogoDanantara from './mandiri.png';

// ==========================================
// KONFIGURASI GRID LINE CHART (PER PRINCIPAL)
// ==========================================
const PRINCIPAL_LIST = ['Visa', 'Mastercard'];
const METRIC_LIST = [
  { key: 'salesVolume', label: 'Sales Volume' },
  { key: 'income', label: 'Income', ratioKey: 'incomeRatio', ratioLabel: 'SV/Income', stacked: true },
  { key: 'cost', label: 'Cost', ratioKey: 'costRatio', ratioLabel: 'SV/Cost', stacked: true },
  { key: 'margin', label: 'P/L', ratioKey: 'marginLine', ratioLabel: '%Margin to Volume', pl: true },
];

// Warna chart P/L: bar Profit (hijau), Loss (merah), line %Margin to Volume (biru)
const PL_COLORS = { profit: '#22c55e', loss: '#ef4444', line: '#3b82f6' };

// Bar Income & Cost ditumpuk (stacked) per group: Debit / Credit / Acquiring
const STACK_GROUPS = [
  { group: 'Debit Card', suffix: 'Debit', label: 'Debit' },
  { group: 'Credit Card', suffix: 'Credit', label: 'Credit' },
  { group: 'Acquiring', suffix: 'Acquiring', label: 'Acquiring' },
];
const STACK_COLORS = {
  Visa: ['#06b6d4', '#6366f1', '#1e3a8a'],        // cyan, indigo, navy
  Mastercard: ['#facc15', '#f97316', '#dc2626'],  // kuning, oranye, merah
};

// Filter jenis transaksi -> mapping ke field `group` di data
const JENIS_OPTIONS = ['Debit', 'Credit', 'Acquiring'];
const JENIS_TO_GROUP = { Debit: 'Debit Card', Credit: 'Credit Card', Acquiring: 'Acquiring' };
// Periode: Monthly = nilai per bulan, Accumulative = akumulasi berjalan (YTD) dari bulan ke bulan
const PERIODE_OPTIONS = ['Monthly', 'Accumulative'];
const DEFAULT_FILTERS = { periode: 'Monthly', jenis: 'All', region: 'All' };

// Filter Domestic / International
const REGION_OPTIONS = ['Domestic', 'International'];

// Warna bar Sales Volume (Domestic & International)
const SV_COLORS = {
  Visa: { domestic: '#93c5fd', international: '#1e3a8a', line: '#f59e0b' },
  Mastercard: { domestic: '#fdba74', international: '#c2410c', line: '#0f766e' },
};

// Label sumbu amount: ringkas (mis. 0, 2,5, 1,2 rb, 3 jt)
const formatAxisCompact = (v) => Number(v).toLocaleString('id-ID', { notation: 'compact', maximumFractionDigits: 2 });
const formatValue = (val) => Number(val || 0).toLocaleString('id-ID', { maximumFractionDigits: 2 });
const formatRupiah = (val) => `${Number(val) < 0 ? '-' : ''}Rp ${formatValue(Math.abs(Number(val || 0)))}`;

// Tahun yang ditampilkan di chart & tahun pembanding untuk YoY
const CURRENT_YEAR = 2026;
const PREV_YEAR = CURRENT_YEAR - 1;

// ==========================================
// 1. GENERATE DUMMY DATABASE MASIF
// ==========================================
const generateDummyData = () => {
  const data = [];
  // Data mulai tahun sebelumnya supaya YoY (Year on Year) bisa dihitung
  let currentDate = new Date(PREV_YEAR, 0, 1);
  const endDate = new Date(CURRENT_YEAR, 11, 31);
  
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

      const region = Math.random() > 0.3 ? 'Domestic' : 'International';
      const channelRand = Math.random();
      const channel = channelRand > 0.5 ? 'CP' : (channelRand > 0.2 ? 'CNP' : 'ATM');

      const dateString = `${currentDate.getFullYear()}-${String(currentDate.getMonth()+1).padStart(2,'0')}-${String(currentDate.getDate()).padStart(2,'0')}`;

      const yearFactor = currentDate.getFullYear() === PREV_YEAR ? 0.92 : 1; // tahun lalu sedikit lebih kecil
      const baseCost = (Math.random() * 3 + 2) * wave * yearFactor; 
      const principalCost = Number(baseCost.toFixed(3));
      // SV dibuat jauh lebih besar dari cost -> Cost/SV ±1,1-1,8%, Income/SV maks ±2,8% (semua rasio < 3%)
      const salesVolume = Number((principalCost * (55 + Math.random() * 35)).toFixed(0));
      
      // Rasio income/cost naik-turun per bulan -> sebagian bulan profit, sebagian loss (untuk chart P/L)
      const incomeRatio = 1.05 + Math.sin(monthIndex * 2.2) * 0.25 + Math.random() * 0.1;
      const income = Number((principalCost * incomeRatio).toFixed(3));

      const costRateBase = 0.038 + (wave - 1.2) * 0.005;
      const costRate = Number((costRateBase + (Math.random() * 0.002 - 0.001)).toFixed(4));

      data.push({
        id: `TRX-${currentDate.getFullYear()}${String(currentDate.getMonth()+1).padStart(2,'0')}-${1000 + i}`,
        date: dateString, 
        principal: type, 
        group: groupName, 
        region: region,
        channel: channel,
        salesVolume: salesVolume, 
        principalCost: principalCost,
        income: income,
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
  const [filters, setFilters] = useState({ ...DEFAULT_FILTERS });
  const [appliedFilters, setAppliedFilters] = useState({ ...filters });

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Mode Laporan: tampilkan / sembunyikan Laporan Profitabilitas Principal (diingat di browser)
  const [showReport, setShowReport] = useState(() => {
    try { return localStorage.getItem('dashboard.showReport') === 'true'; } catch { return false; }
  });
  const toggleReport = () => {
    setShowReport(prev => {
      const next = !prev;
      try { localStorage.setItem('dashboard.showReport', String(next)); } catch { /* abaikan */ }
      return next;
    });
  };

  const [dashboardData, setDashboardData] = useState({
    summary: { sales: 0, cost: 0, rate: 0 },
    trendData: {},
    prevYearData: {},
    groupStats: [],
  });


  // ==========================================
  // 3. LOGIKA FILTERING & AGREGASI (DINAMIS)
  // ==========================================
  useEffect(() => {
    const isAccumulative = appliedFilters.periode === 'Accumulative';

    const allYearsDB = DUMMY_DB.filter(item => {
      const passJenis = appliedFilters.jenis === 'All' || item.group === JENIS_TO_GROUP[appliedFilters.jenis];
      const passRegion = appliedFilters.region === 'All' || item.region === appliedFilters.region;
      return passJenis && passRegion;
    });
    const globalFilteredDB = allYearsDB.filter(item => item.date.startsWith(`${CURRENT_YEAR}-`));
    const prevYearDB = allYearsDB.filter(item => item.date.startsWith(`${PREV_YEAR}-`));

    if (globalFilteredDB.length === 0) {
      setDashboardData({
        summary: { sales: 0, cost: 0, rate: 0 },
        trendData: {},
        prevYearData: {},
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

    // Agregasi trend per principal (Visa / Mastercard) untuk 4 metrik: Sales Volume, Income, Cost, Margin
    const monthsShort = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agt', 'Sep', 'Okt', 'Nov', 'Des'];
    const getTrendData = (principalName, sourceDB) => {
      const chartMap = {};
      sourceDB.forEach(item => {
        if (item.principal !== principalName) return;
        const d = new Date(item.date);
        const groupKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        const displayLabel = monthsShort[d.getMonth()];

        if (!chartMap[groupKey]) {
          chartMap[groupKey] = { name: displayLabel, sortKey: groupKey, salesVolume: 0, salesDomestic: 0, salesInternational: 0, income: 0, cost: 0 };
          STACK_GROUPS.forEach(g => { chartMap[groupKey][`income${g.suffix}`] = 0; chartMap[groupKey][`cost${g.suffix}`] = 0; });
        }
        const stack = STACK_GROUPS.find(g => g.group === item.group);
        if (stack) {
          chartMap[groupKey][`income${stack.suffix}`] += item.income;
          chartMap[groupKey][`cost${stack.suffix}`] += item.principalCost;
        }
        chartMap[groupKey].salesVolume += item.salesVolume;
        if (item.region === 'International') chartMap[groupKey].salesInternational += item.salesVolume;
        else chartMap[groupKey].salesDomestic += item.salesVolume;
        chartMap[groupKey].income += item.income;
        chartMap[groupKey].cost += item.principalCost;
      });

      const monthly = Object.values(chartMap).sort((a, b) => a.sortKey.localeCompare(b.sortKey));

      // Accumulative: setiap bulan = total berjalan dari bulan pertama s.d. bulan tersebut
      const rows = isAccumulative
        ? monthly.reduce((acc, d) => {
            const prev = acc[acc.length - 1];
            const next = { ...d };
            // Jumlahkan semua field angka dengan bulan sebelumnya
            if (prev) Object.keys(d).forEach(k => { if (typeof d[k] === 'number') next[k] = prev[k] + d[k]; });
            acc.push(next);
            return acc;
          }, [])
        : monthly;

      return rows.map(d => ({
          name: d.name,
          salesVolume: Number(d.salesVolume.toFixed(0)),
          salesDomestic: Number(d.salesDomestic.toFixed(0)),
          salesInternational: Number(d.salesInternational.toFixed(0)),
          intlShare: d.salesVolume ? Number(((d.salesInternational / d.salesVolume) * 100).toFixed(1)) : 0,
          income: Number(d.income.toFixed(2)),
          cost: Number(d.cost.toFixed(2)),
          margin: Number((d.income - d.cost).toFixed(2)),
          ...Object.fromEntries(STACK_GROUPS.flatMap(g => [
            [`income${g.suffix}`, Number(d[`income${g.suffix}`].toFixed(2))],
            [`cost${g.suffix}`, Number(d[`cost${g.suffix}`].toFixed(2))],
          ])),
          // Rasio terhadap Sales Volume (%) -> dipakai line chart Income / Cost / Margin
          // Rasio dibatasi maks 3%
          incomeRatio: d.salesVolume ? capPct(Number(((d.income / d.salesVolume) * 100).toFixed(2))) : 0,
          costRatio: d.salesVolume ? capPct(Number(((d.cost / d.salesVolume) * 100).toFixed(2))) : 0,
          marginRatio: d.salesVolume ? capPct(Number((((d.income - d.cost) / d.salesVolume) * 100).toFixed(2))) : 0,
          // P/L: bar Profit (margin positif) & Loss (margin negatif), line %Margin to Volume (0% saat loss)
          profit: d.income - d.cost >= 0 ? Number((d.income - d.cost).toFixed(2)) : null,
          loss: d.income - d.cost < 0 ? Number((d.income - d.cost).toFixed(2)) : null,
          marginLine: d.salesVolume ? Math.max(0, capPct(Number((((d.income - d.cost) / d.salesVolume) * 100).toFixed(2)))) : 0,
        }));
    };

    const trendData = {};
    const prevYearData = {};
    PRINCIPAL_LIST.forEach(p => {
      trendData[p] = getTrendData(p, globalFilteredDB);
      prevYearData[p] = getTrendData(p, prevYearDB);
    });

    setDashboardData({
      summary: { sales: totalSales.toFixed(0), cost: totalCost.toFixed(2), rate: 0 },
      trendData,
      prevYearData,
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
    setFilters({ ...DEFAULT_FILTERS });
    setAppliedFilters({ ...DEFAULT_FILTERS });
  };
  const handleLogout = () => alert("Logout berhasil!");
  
  // Tooltip Income / Cost / Margin
  const MetricTooltip = ({ active, payload, label, metricKey, metricLabel, ratioKey, ratioLabel, ratioColor, data, stackColors }) => {
    if (!active || !payload || !payload.length) return null;
    const row = payload[0].payload;
    const idx = data.indexOf(row);
    const prevVal = idx > 0 ? data[idx - 1][metricKey] : null;
    const changePct = prevVal ? ((row[metricKey] - prevVal) / Math.abs(prevVal)) * 100 : null;
    const isUp = changePct !== null && changePct >= 0;
    const goodWhenUp = metricKey !== 'cost';
    const changeColor = isUp === goodWhenUp ? 'text-emerald-500' : 'text-rose-500';
    return (
      <div className="bg-white/95 backdrop-blur-sm border border-slate-200 rounded-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)] px-3 py-2 text-[12px] text-slate-700 z-50">
        <p className="font-bold text-slate-800 mb-1">{label}</p>
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: payload[0].color }}></div>
          <span className="text-slate-600 font-medium">{metricLabel}:</span>
          <span className="font-bold text-slate-800">{formatValue(row[metricKey])}</span>
        </div>
        {stackColors && STACK_GROUPS.map((g, i) => (
          <div key={g.suffix} className="flex items-center gap-2 pl-4">
            <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: stackColors[i] }}></div>
            <span className="text-slate-500">{g.label}:</span>
            <span className="font-semibold text-slate-700">{formatValue(row[`${metricKey}${g.suffix}`])}</span>
          </div>
        ))}
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: ratioColor }}></div>
          <span className="text-slate-600 font-medium">{ratioLabel}:</span>
          <span className="font-bold text-slate-800">{formatValue(row[ratioKey])}%</span>
        </div>
        {changePct !== null && (
          <div className="mt-1 pt-1 border-t border-slate-100 flex justify-between gap-3">
            <span className="text-slate-500 font-medium">vs sebelumnya</span>
            <span className={`font-bold ${changeColor}`}>{isUp ? '▲' : '▼'} {Math.abs(changePct).toFixed(1)}%</span>
          </div>
        )}
      </div>
    );
  };

  // Tooltip Sales Volume: Domestic, International, dan porsi International (%)
  const SalesVolumeTooltip = ({ active, payload, label }) => {
    if (!active || !payload || !payload.length) return null;
    const row = payload[0].payload;
    const items = [
      { name: 'Domestic', value: formatValue(row.salesDomestic), color: payload.find(p => p.dataKey === 'salesDomestic')?.color },
      { name: 'International', value: formatValue(row.salesInternational), color: payload.find(p => p.dataKey === 'salesInternational')?.color },
      { name: 'Int\'l Share', value: `${row.intlShare}%`, color: payload.find(p => p.dataKey === 'intlShare')?.color },
    ];
    return (
      <div className="bg-white/95 backdrop-blur-sm border border-slate-200 rounded-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)] px-3 py-2 text-[12px] text-slate-700 z-50">
        <p className="font-bold text-slate-800 mb-1">{label}</p>
        {items.map(it => (
          <div key={it.name} className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: it.color }}></div>
            <span className="text-slate-600 font-medium">{it.name}:</span>
            <span className="font-bold text-slate-800">{it.value}</span>
          </div>
        ))}
        <div className="mt-1 pt-1 border-t border-slate-100 flex justify-between gap-3">
          <span className="text-slate-500 font-medium">Total</span>
          <span className="font-bold text-slate-800">{formatValue(row.salesVolume)}</span>
        </div>
      </div>
    );
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
            <button onClick={() => navigate('/detail-billing')} className="text-slate-400 hover:text-blue-600 transition-colors" title="Detail Billing"><FileText size={24} strokeWidth={1.5} /></button>
          </nav>
        </div>

        {/* TOMBOL LAPORAN (hanya di halaman Dashboard): klik = nyala & laporan muncul, klik lagi = mati & laporan hilang */}
        <button
          onClick={toggleReport}
          title={showReport ? 'Sembunyikan Laporan Profitabilitas' : 'Tampilkan Laporan Profitabilitas'}
          aria-pressed={showReport}
          className={`group mt-4 mb-auto flex flex-col items-center gap-1 transition-colors ${showReport ? 'text-blue-600' : 'text-slate-400 hover:text-blue-600'}`}
        >
          <span className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${showReport ? 'bg-blue-50' : 'group-hover:bg-white'}`}>
            <Table2 size={24} strokeWidth={1.5} />
          </span>
          <span className="text-[10px] font-semibold">EX</span>
        </button>
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

        <div className="p-4 sm:p-6 lg:py-8 lg:pl-4 lg:pr-6 max-w-[1600px] w-full">
          
          {/* BANNER BIRU KEPALA */}
          <div className="w-full h-12 sm:h-14 bg-[#0A3A6A] rounded-xl flex justify-between items-center px-5 sm:px-8 mb-8 shadow-md overflow-hidden">
            <div className="shrink-0 flex items-center"><img src={LogoMandiri} alt="Mandiri" className="h-10 sm:h-12 scale-[1.5] sm:scale-[1.8] transform origin-left object-contain" /></div>
            <div className="text-center flex-1 px-4 hidden md:block mt-1">
              <h2 className="text-white text-base lg:text-[18px] font-bold tracking-wide uppercase leading-none">Dashboard Principal Fee eChannel Transaction</h2>
              <p className="text-white text-[10px] lg:text-[11px] font-light mt-1 opacity-90 tracking-widest italic leading-none">ELECTRONIC CHANNEL OPERATIONS GROUP</p>
            </div>
            <div className="shrink-0 flex items-center"><img src={LogoDanantara} alt="Danantara" className="h-5 sm:h-4 scale-[2] sm:scale-[2.5] transform origin-right object-contain" /></div>
          </div>

          {/* FILTER UTAMA (RATA KANAN) */}
          <header className="flex flex-col xl:flex-row xl:justify-end items-start xl:items-center mb-6 w-full gap-4 border-b border-slate-200/60 pb-6 pt-2">
            <div className="flex flex-wrap items-end justify-end gap-3 w-full xl:w-auto order-1 xl:order-2" onClick={(e) => e.stopPropagation()}>
              <div className="flex flex-col w-full sm:w-auto">
                <label className="text-[12px] font-bold text-[#1e3a8a] mb-1.5">Periode</label>
                <div className="relative">
                  <select className="w-full sm:w-[160px] text-[13px] font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg py-2 pl-3 pr-8 outline-none appearance-none cursor-pointer hover:border-blue-400 transition-colors shadow-sm" value={filters.periode} onChange={(e) => setFilters({...filters, periode: e.target.value})}>
                    {PERIODE_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                  <ChevronDown size={14} className="text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
                </div>
              </div>

              <div className="flex flex-col w-full sm:w-auto">
                <label className="text-[12px] font-bold text-[#1e3a8a] mb-1.5">Jenis</label>
                <div className="relative">
                  <select className="w-full sm:w-[160px] text-[13px] font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg py-2 pl-3 pr-8 outline-none appearance-none cursor-pointer hover:border-blue-400 transition-colors shadow-sm" value={filters.jenis} onChange={(e) => setFilters({...filters, jenis: e.target.value})}>
                    <option value="All" disabled hidden>Pilih Jenis</option>
                    {JENIS_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                  <ChevronDown size={14} className="text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
                </div>
              </div>

              <div className="flex flex-col w-full sm:w-auto">
                <label className="text-[12px] font-bold text-[#1e3a8a] mb-1.5">Domestic / International</label>
                <div className="relative">
                  <select className="w-full sm:w-[160px] text-[13px] font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg py-2 pl-3 pr-8 outline-none appearance-none cursor-pointer hover:border-blue-400 transition-colors shadow-sm" value={filters.region} onChange={(e) => setFilters({...filters, region: e.target.value})}>
                    <option value="All">Both</option>
                    {REGION_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                  <ChevronDown size={14} className="text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
                </div>
              </div>

              <button onClick={handleApply} className="bg-[#0f172a] hover:bg-black text-white text-[13px] font-semibold px-6 py-2 rounded-lg transition-all shadow-sm w-full sm:w-auto h-[38px]">Apply</button>
              <button onClick={handleReset} className="text-[#1e3a8a] hover:text-blue-800 hover:underline text-[13px] font-semibold px-2 py-2 transition-all w-full sm:w-auto h-[38px] bg-transparent border-none">Reset</button>
            </div>
          </header>

          {/* MAIN CHARTS AREA: GRID LINE CHART PER PRINCIPAL (SALES VOLUME, INCOME, COST, MARGIN) */}
          <div className="flex flex-col gap-6 pb-10">
            {/* LAPORAN PROFITABILITAS PRINCIPAL (di atas grid Visa) — muncul jika tombol Mode di sidebar ON */}
            {showReport && <ProfitabilityReport db={DUMMY_DB} />}

            {Object.keys(dashboardData.trendData).length === 0 && (
              <div className="bg-white rounded-2xl border border-slate-200/60 p-10 text-center text-[13px] text-slate-400">Tidak ada data untuk filter ini.</div>
            )}
            {Object.entries(dashboardData.trendData).map(([principalName, data]) => {
              const lineColor = principalName === 'Visa' ? '#1e3a8a' : '#ea580c';
              return (
                <section key={principalName}>
                  <h3 className="font-bold text-[#0f172a] tracking-tight text-[15px] mb-3 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: lineColor }}></span>
                    {principalName}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                    {METRIC_LIST.map(metric => {
                      // Sumbu Y kiri (amount) & kanan (%) masing-masing 5 tick bulat, sejajar dengan grid.
                      // Bar maks ~50% tinggi chart, line % diusahakan di pita atas supaya tidak bertumpuk.
                      const isSV = metric.key === 'salesVolume';
                      const lineKey = isSV ? 'intlShare' : metric.ratioKey;
                      const barMax = Math.max(0, ...data.map(d => d[metric.key]));
                      const amtTicks = buildAmountTicks(barMax || 1);
                      const lineVals = data.map(d => d[lineKey]);
                      const lineLo = lineVals.length ? Math.min(...lineVals) : 0;
                      const lineHi = lineVals.length ? Math.max(...lineVals) : 100;
                      const pctTicks = buildPctTicks(lineLo, lineHi);
                      const ratioColor = SV_COLORS[principalName].line;
                      const leftAxisProps = { ...yAxisBase, tick: { fontSize: 10, fill: '#64748b' }, width: 46, domain: [0, amtTicks[AXIS_INTERVALS]], ticks: amtTicks, tickFormatter: formatAxisCompact };
                      const rightAxisProps = { ...yAxisBase, orientation: 'right', tick: { fontSize: 10, fill: ratioColor, fontWeight: 600 }, width: 44, domain: [pctTicks[0], pctTicks[AXIS_INTERVALS]], ticks: pctTicks, tickFormatter: formatPctTick };
                      const last = data[data.length - 1];
                      const prev = data[data.length - 2];
                      const lastVal = last ? last[metric.key] : 0;
                      const prevVal = prev ? prev[metric.key] : null;
                      // MoM: vs bulan sebelumnya, YoY: vs bulan yang sama tahun lalu
                      const lastYearRow = last ? (dashboardData.prevYearData[principalName] || []).find(r => r.name === last.name) : null;
                      const lastYearVal = lastYearRow ? lastYearRow[metric.key] : null;
                      const pctChange = (base) => (base ? ((lastVal - base) / Math.abs(base)) * 100 : null);
                      const goodWhenUp = metric.key !== 'cost';
                      const changeItems = [
                        { label: 'YoY', pct: pctChange(lastYearVal) },
                        { label: 'MoM', pct: pctChange(prevVal) },
                      ].filter(c => c.pct !== null);
                      // P/L: 4 interval -> 3 di atas nol (profit) & 1 di bawah nol (loss), jadi garis nol turun ke bawah.
                      // Line % pakai sumbu kanan tersembunyi dengan nol yang sejajar.
                      const plMaxPos = Math.max(0, ...data.map(d => d.margin));
                      const plMaxNeg = Math.max(0, ...data.map(d => -d.margin));
                      const plNegSteps = plMaxNeg > 0 ? 1 : 0;
                      const plStep = niceStep(Math.max(1e-9, plMaxPos / (AXIS_INTERVALS - plNegSteps), plMaxNeg));
                      const plTicks = Array.from({ length: AXIS_INTERVALS + 1 }, (_, i) => +((i - plNegSteps) * plStep).toPrecision(12));
                      const plPctTop = Math.max(0.01, ...data.map(d => d.marginLine)) * 1.3;
                      const plPctDomain = [-plPctTop * plNegSteps / (AXIS_INTERVALS - plNegSteps), plPctTop];
                      const changeColor = (pct) => ((pct >= 0) === goodWhenUp ? 'text-emerald-500' : 'text-rose-500');

                      return (
                        <div key={metric.key} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200/60 flex flex-col h-[300px]">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="text-[13px] font-bold text-slate-700">{metric.label}</p>
                              <p className="text-[20px] font-bold text-[#0f172a] leading-tight mt-1">{formatRupiah(lastVal)}</p>
                              <p className="text-[10px] text-slate-400">Periode</p>
                            </div>
                            {changeItems.length > 0 && (
                              <div className="flex gap-3 text-right">
                                {changeItems.map(c => (
                                  <div key={c.label}>
                                    <p className={`text-[13px] font-bold ${changeColor(c.pct)}`}>{c.pct >= 0 ? '▲' : '▼'} {Math.abs(c.pct).toFixed(1)}%</p>
                                    <p className="text-[10px] text-slate-400">{c.label}</p>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                          <div className="flex-1 w-full mt-3">
                            <ResponsiveContainer width="100%" height="100%">
                              {metric.pl ? (
                                <ComposedChart data={data} margin={{ top: 16, right: 4, bottom: 0, left: -8 }}>
                                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} dy={5} interval="preserveStartEnd" />
                                  <YAxis yAxisId="val" {...yAxisBase} tickMargin={4} tick={{ fontSize: 10, fill: '#64748b' }} width={40} domain={[plTicks[0], plTicks[AXIS_INTERVALS]]} ticks={plTicks} tickFormatter={formatAxisCompact} />
                                  <YAxis yAxisId="pct" orientation="right" hide domain={plPctDomain} allowDataOverflow />
                                  <RechartsTooltip content={<MetricTooltip metricKey="margin" metricLabel="P/L" ratioKey="marginLine" ratioLabel="%Margin to Volume" ratioColor={PL_COLORS.line} data={data} />} cursor={{ fill: '#f8fafc' }} />
                                  <Legend iconSize={8} wrapperStyle={{ fontSize: 10 }} />
                                  <ReferenceLine yAxisId="val" y={0} stroke="#0f172a" strokeWidth={1.5} />
                                  <Bar yAxisId="val" dataKey="profit" name="Profit" stackId="pl" fill={PL_COLORS.profit} radius={[3, 3, 0, 0]} />
                                  <Bar yAxisId="val" dataKey="loss" name="Loss" stackId="pl" fill={PL_COLORS.loss} radius={[0, 0, 3, 3]} />
                                  <Line yAxisId="pct" type="linear" dataKey="marginLine" name="%Margin to Volume" stroke={PL_COLORS.line} strokeWidth={2} dot={false} activeDot={{ r: 4 }}>
                                    <LabelList dataKey="marginLine" position="top" offset={6} formatter={formatPctTick} style={{ fontSize: 9, fontWeight: 700, fill: '#0f172a' }} />
                                  </Line>
                                </ComposedChart>
                              ) : metric.key === 'salesVolume' ? (
                                <ComposedChart data={data} margin={{ top: 8, right: 4, bottom: 0, left: 4 }}>
                                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} dy={5} interval="preserveStartEnd" />
                                  <YAxis yAxisId="vol" {...leftAxisProps} />
                                  <YAxis yAxisId="pct" {...rightAxisProps} />
                                  <RechartsTooltip content={<SalesVolumeTooltip />} cursor={{ fill: '#f8fafc' }} />
                                  <Legend iconSize={8} wrapperStyle={{ fontSize: 10 }} />
                                  <Bar yAxisId="vol" dataKey="salesDomestic" name="Domestic" stackId="sv" fill={SV_COLORS[principalName].domestic} />
                                  <Bar yAxisId="vol" dataKey="salesInternational" name="International" stackId="sv" fill={SV_COLORS[principalName].international} radius={[3, 3, 0, 0]} />
                                  <Line yAxisId="pct" type="linear" dataKey="intlShare" name="Int'l %" stroke={SV_COLORS[principalName].line} strokeWidth={2} dot={{ r: data.length > 15 ? 1.5 : 3, fill: SV_COLORS[principalName].line, strokeWidth: 0 }} activeDot={{ r: 4 }} />
                                </ComposedChart>
                              ) : (
                                <ComposedChart data={data} margin={{ top: 8, right: 4, bottom: 0, left: 4 }}>
                                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} dy={5} interval="preserveStartEnd" />
                                  <YAxis yAxisId="val" {...leftAxisProps} />
                                  <YAxis yAxisId="pct" {...rightAxisProps} />
                                  <RechartsTooltip content={<MetricTooltip metricKey={metric.key} metricLabel={metric.label} ratioKey={metric.ratioKey} ratioLabel={metric.ratioLabel} ratioColor={ratioColor} data={data} stackColors={metric.stacked ? STACK_COLORS[principalName] : null} />} cursor={{ fill: '#f8fafc' }} />
                                  {metric.stacked ? (
                                    <>
                                      <Legend iconSize={8} wrapperStyle={{ fontSize: 10 }} />
                                      {STACK_GROUPS.map((g, i) => (
                                        <Bar key={g.suffix} yAxisId="val" dataKey={`${metric.key}${g.suffix}`} name={g.label} stackId={metric.key} fill={STACK_COLORS[principalName][i]} radius={i === STACK_GROUPS.length - 1 ? [3, 3, 0, 0] : 0} />
                                      ))}
                                    </>
                                  ) : (
                                    <Bar yAxisId="val" dataKey={metric.key} name={metric.label} fill={lineColor} radius={[3, 3, 0, 0]} />
                                  )}
                                  <Line yAxisId="pct" type="linear" dataKey={metric.ratioKey} name={metric.ratioLabel} stroke={ratioColor} strokeWidth={2} dot={{ r: data.length > 15 ? 1.5 : 3, fill: ratioColor, strokeWidth: 0 }} activeDot={{ r: 4 }} />
                                </ComposedChart>
                              )}
                            </ResponsiveContainer>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;