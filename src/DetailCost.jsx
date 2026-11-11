import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Menu, CreditCard, Book, ShoppingCart, FileText, 
  Calendar as CalendarIcon, User, ChevronUp, ChevronDown, LogOut, 
  Filter, Settings2, X, ChevronLeft, ChevronRight
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer 
} from 'recharts';

// === IMPORT GAMBAR LOGO DARI FOLDER SRC ===
import LogoDanantara from './mandiri.png';
import LogoMandiri from './danatara.png';

// ==========================================
// 1. GENERATE DUMMY DATA UNTUK GRAFIK
// ==========================================
const generateChartData = () => {
  const data = [];
  // Data mulai dari tahun sebelumnya (2025) agar filter tanggal bisa mundur ke tahun lalu
  let currentDate = new Date(2025, 0, 1);
  const endDate = new Date(2026, 11, 31);
  // Target jumlah billing per bulan, dipisah antara billing Income & billing Cost
  // (masing-masing 15 - 100 / bulan, jadi total All = 30 - 200 / bulan)
  const monthlyBillingTarget = {};
  
  while (currentDate <= endDate) {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const day = currentDate.getDate();
    const monthKey = `${year}-${String(month + 1).padStart(2, '0')}`;

    // Dummy: Income & Cost dalam Rupiah
    const incomeRaw = Math.floor(Math.random() * 40000000) + 20000000;
    const costRaw = Math.floor(Math.random() * 25000000) + 5000000;

    // Billing Line: target bulanan dibagi rata ke hari-hari di bulan tsb,
    // sehingga total sebulan = target (mis. 33, 100, 187)
    if (!(monthKey in monthlyBillingTarget)) {
      monthlyBillingTarget[monthKey] = {
        income: Math.floor(Math.random() * 86) + 15,
        cost: Math.floor(Math.random() * 86) + 15,
      };
    }
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const spreadDaily = (target) => Math.floor(target / daysInMonth) + (day <= target % daysInMonth ? 1 : 0);
    const billingIncomeCount = spreadDaily(monthlyBillingTarget[monthKey].income);
    const billingCostCount = spreadDaily(monthlyBillingTarget[monthKey].cost);

    data.push({
      date: new Date(currentDate),
      dateString: `${monthKey}-${String(day).padStart(2,'0')}`,
      monthKey,
      income: incomeRaw,
      cost: costRaw,
      billingIncome: billingIncomeCount, // jumlah billing yang termasuk Income
      billingCost: billingCostCount      // jumlah billing yang termasuk Cost
    });
    currentDate.setDate(currentDate.getDate() + 1);
  }
  return data;
};

const CHART_DB = generateChartData();

// ==========================================
// 2. GENERATE DUMMY DATA UNTUK TABEL BARU (SESUAI EXCEL BARU)
// ==========================================
const TABLE_TEMPLATES = [
  { jenis: 'Interchange', tagging: 'Interchange Local', principal: 'Mastercard', group: 'Acquiring', status: 'Current Billing', ica: '-', billingLine: 'Interchange Local', desc: 'Mastercard Local', feeType: '-', category: '-', subCategory: '-' },
  { jenis: 'Interchange', tagging: 'Interchange International', principal: 'Mastercard', group: 'Acquiring', status: 'Current Billing', ica: '-', billingLine: 'Interchange International', desc: 'Mastercard International', feeType: '-', category: '-', subCategory: '-' },
  { jenis: 'Service Fee', tagging: 'Weekly', principal: 'Mastercard', group: '-', status: 'Current Billing', ica: '12375', billingLine: '2LS2000', desc: 'SMS Acquirer Non-Local Currency Fee', feeType: 'Acquirer Fees', category: 'Other Acquiring Services', subCategory: 'Currency Settlement' },
  { jenis: 'Service Fee', tagging: 'Daily', principal: 'Visa', group: 'Credit', status: 'Current Billing', ica: '-', billingLine: 'Daily', desc: 'Daily Service Visa Credit', feeType: '-', category: '-', subCategory: '-' },
  { jenis: 'Service Fee', tagging: 'Daily', principal: 'Visa', group: 'Debit', status: 'Current Billing', ica: '-', billingLine: 'Daily', desc: 'Daily Service Visa Debit', feeType: '-', category: '-', subCategory: '-' },
  { jenis: 'Service Fee', tagging: 'MTI', principal: 'Visa', group: 'Acquiring', status: 'Current Billing', ica: '-', billingLine: 'MTI', desc: 'Biaya Acquiring MTI', feeType: '-', category: '-', subCategory: '-' },
  { jenis: 'Service Fee', tagging: 'Monthly', principal: 'Visa', group: '-', status: 'Current Billing', ica: '-', billingLine: '4M6163460', desc: 'VISA ADVANCED AUTHORISATION AND VISA RISK MANAGER - DC', feeType: '-', category: '-', subCategory: '-' },
  { jenis: 'Service Fee', tagging: 'Lisence', principal: 'Visa', group: '-', status: 'Current Billing', ica: '-', billingLine: '4B1102010', desc: 'ACQUIRING LICENSE FEES - INTERNATIONAL', feeType: 'License Fees', category: 'License Fees', subCategory: 'Acquirer License Fee' },
  { jenis: 'Service Fee', tagging: 'Quarterly', principal: 'Visa', group: '-', status: 'Current Billing', ica: '-', billingLine: '4CSF03100', desc: 'VISA GOLD CARD FEES - CONSUMER PRODUCTS', feeType: '-', category: '-', subCategory: '-' },
];

const generateTableData = () => {
  const data = [];
  const months = ['Januari 2026', 'Februari 2026', 'Maret 2026', 'April 2026', 'Mei 2026', 'Juni 2026'];
  
  for (let i = 0; i < 75; i++) {
    const template = TABLE_TEMPLATES[Math.floor(Math.random() * TABLE_TEMPLATES.length)];
    const month = months[Math.floor(Math.random() * months.length)];
    const rawAmount = (Math.random() * 500000000) + 1000000;
    
    // Eqv Idr bisa berbeda jika ada rate exchange, disimulasikan secara acak
    const isUsd = Math.random() > 0.8;
    const eqvIdr = isUsd ? rawAmount * 15500 : rawAmount;

    // Buat format tanggal dummy sesuai dengan bulan terpilih (Contoh: 15-Jan-2026)
    const day = Math.floor(Math.random() * 28) + 1;
    const shortMonth = month.substring(0, 3);
    const year = month.slice(-4);
    const tanggal = `${day}-${shortMonth}-${year}`;

    data.push({
      id: `TRX-${10000 + i}`,
      jenisTransaksi: template.jenis,
      tagging: template.tagging,
      principal: template.principal,
      group: template.group,
      status: template.status,
      tanggal: tanggal,
      month: month, // Digunakan untuk filter logika Start/End Periode
      ica: template.ica,
      billingLine: template.billingLine,
      description: template.desc,
      total: rawAmount,
      eqvIdr: eqvIdr,
      principalFeeType: template.feeType,
      principalCategory: template.category,
      principalSubCategory: template.subCategory
    });
  }
  return data;
};

const TABLE_DB = generateTableData();

// Opsi dropdown disesuaikan dengan gambar
const FILTER_OPTIONS = {
  jenisTransaksi: ['Interchange', 'Service Fee'],
  tagging: ['Interchange Local', 'Interchange International', 'Weekly', 'Daily', 'MTI', 'Monthly', 'Lisence', 'Quarterly'],
  principal: ['Visa', 'Mastercard'],
  group: ['Acquiring', 'Credit', 'Debit'],
  month: ['Januari 2026', 'Februari 2026', 'Maret 2026', 'April 2026', 'Mei 2026', 'Juni 2026']
};

// Logika pemetaan bulan untuk komparasi rentang tanggal Start & End
const MONTH_ORDER = {
  'Januari 2026': 1,
  'Februari 2026': 2,
  'Maret 2026': 3,
  'April 2026': 4,
  'Mei 2026': 5,
  'Juni 2026': 6,
};

const formatCurrency = (value) => {
  if (value >= 1000000000) return (value / 1000000000).toFixed(2) + ' bn';
  if (value >= 1000000) return (value / 1000000).toFixed(2) + ' M';
  if (value >= 1000) return (value / 1000).toFixed(2) + ' Rb';
  return value.toFixed(0);
};

const formatBilling = (value) => {
  if (value >= 1000) return (value / 1000).toFixed(1) + 'K';
  return value.toString();
};

// Warna line chart (mengikuti referensi: biru tua, oranye, biru muda)
const LINE_SERIES = [
  { key: 'billingLine', name: 'Billing Line', color: '#4A6FA5', axis: 'right', labelPos: 'top', labelColor: '#4A6FA5' },
  { key: 'income', name: 'Income', color: '#ED7D31', axis: 'left', labelPos: 'top', labelColor: '#D9661F' },
  { key: 'cost', name: 'Cost', color: '#8EC3EA', axis: 'left', labelPos: 'bottom', labelColor: '#3B8FD0' }, // label lebih gelap agar terbaca
];

// Label nilai di setiap titik (dot) line chart
// position: 'top' = di atas titik, 'bottom' = di bawah titik
const makePointLabel = (formatter, color, position = 'top') => (props) => {
  const { x, y, value } = props;
  if (value == null) return null;
  return (
    <text x={x} y={position === 'top' ? y - 12 : y + 20} fill={color} fontSize={10} fontWeight={700} textAnchor="middle">
      {formatter(value)}
    </text>
  );
};

// Default filter: awal tahun berjalan s/d hari ini
const toInputDate = (d) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
const TODAY = new Date();
const DEFAULT_START_DATE = `${TODAY.getFullYear()}-01-01`;
const DEFAULT_END_DATE = toInputDate(TODAY);
const DATE_MIN = CHART_DB[0].dateString;
const DATE_MAX = CHART_DB[CHART_DB.length - 1].dateString;

// Filter "Tampilkan": line apa saja yang muncul di chart (Billing Line selalu tampil)
const VIEW_OPTIONS = {
  All: ['billingLine', 'income', 'cost'],
  Income: ['billingLine', 'income'],
  Cost: ['billingLine', 'cost'],
};

// Jika rentang tanggal sangat panjang, label per titik disembunyikan agar tidak menumpuk
const MAX_POINTS_WITH_LABEL = 24;

const formatDecimal = (num) => {
  return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const DetailCost = () => {
  const navigate = useNavigate();

  // ==========================================
  // 3. STATE MANAGEMENT
  // ==========================================
  const [chartFilters, setChartFilters] = useState({
    startDate: DEFAULT_START_DATE, endDate: DEFAULT_END_DATE, view: 'All'
  });

  // State Tabel Diperbarui (Sesuai dengan kolom baru, Periode tetap dipertahankan)
  const [tableFilters, setTableFilters] = useState({
    jenisTransaksi: 'All', 
    tagging: 'All',
    principal: 'All', 
    group: 'All', 
    startPeriode: 'All', 
    endPeriode: 'All'
  });
  const [appliedTableFilters, setAppliedTableFilters] = useState({ ...tableFilters });
  const [filteredTableData, setFilteredTableData] = useState(TABLE_DB);

  // --- STATE PAGINATION ---
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 7;

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // ==========================================
  // 4. LOGIKA AGREGASI GRAFIK
  // ==========================================
  const chartData = useMemo(() => {
    const { startDate, endDate, view } = chartFilters;
    // Jika tanggal awal > tanggal akhir, tukar otomatis
    const [start, end] = startDate <= endDate ? [startDate, endDate] : [endDate, startDate];
    const aggMap = {};

    CHART_DB.forEach(item => {
      // Filter rentang tanggal (format YYYY-MM-DD bisa dibandingkan sebagai string)
      if ((start && item.dateString < start) || (end && item.dateString > end)) return;

      // Agregasi per bulan (sumbu X = bulan)
      const key = item.monthKey;
      const label = item.date.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' });

      if (!aggMap[key]) {
        aggMap[key] = { dateLabel: label, income: 0, cost: 0, billingIncome: 0, billingCost: 0, sortKey: key };
      }
      aggMap[key].income += item.income;
      aggMap[key].cost += item.cost;
      aggMap[key].billingIncome += item.billingIncome;
      aggMap[key].billingCost += item.billingCost;
    });

    // Billing Line mengikuti filter "Tampilkan":
    // Income -> hanya billing Income, Cost -> hanya billing Cost, All -> keduanya dijumlah
    return Object.values(aggMap)
      .sort((a, b) => a.sortKey.localeCompare(b.sortKey))
      .map(d => ({
        ...d,
        billingLine: view === 'Income' ? d.billingIncome
          : view === 'Cost' ? d.billingCost
          : d.billingIncome + d.billingCost,
      }));
  }, [chartFilters]);

  // Line yang ditampilkan sesuai filter "Tampilkan"
  const visibleSeries = LINE_SERIES.filter(s => VIEW_OPTIONS[chartFilters.view].includes(s.key));

  // Sumbu Y disembunyikan, tapi domain diatur supaya Billing Line (jumlah) ada di area atas
  // dan Income/Cost (Rupiah) di area bawah, jadi line & label tidak saling tumpuk
  const yDomains = useMemo(() => {
    if (chartData.length === 0) return { left: [0, 1], right: [0, 1] };
    const bill = chartData.map(d => d.billingLine);
    const moneyKeys = VIEW_OPTIONS[chartFilters.view].filter(k => k !== 'billingLine');
    const money = chartData.flatMap(d => moneyKeys.map(k => d[k]));
    const bMin = Math.min(...bill), bMax = Math.max(...bill), bRange = (bMax - bMin) || bMax || 1;
    const mMin = Math.min(...money), mMax = Math.max(...money), mRange = (mMax - mMin) || mMax || 1;
    return {
      right: [bMin - bRange * 2.2, bMax + bRange * 0.4],
      left: [mMin - mRange * 0.4, mMax + mRange * 1.5],
    };
  }, [chartData, chartFilters.view]);

  const showPointLabels = chartData.length <= MAX_POINTS_WITH_LABEL;

  // ==========================================
  // 5. LOGIKA FILTERING & RESET HALAMAN TABEL
  // ==========================================
  useEffect(() => {
    const result = TABLE_DB.filter(row => {
      const passJenis = appliedTableFilters.jenisTransaksi === 'All' || row.jenisTransaksi === appliedTableFilters.jenisTransaksi;
      const passTagging = appliedTableFilters.tagging === 'All' || row.tagging === appliedTableFilters.tagging;
      const passPrincipal = appliedTableFilters.principal === 'All' || row.principal === appliedTableFilters.principal;
      const passGroup = appliedTableFilters.group === 'All' || row.group === appliedTableFilters.group;

      // Logika Filter Rentang Periode (Bulan) TETAP DIPERTAHANKAN
      let passPeriode = true;
      const rowMonthIdx = MONTH_ORDER[row.month];
      const startIdx = appliedTableFilters.startPeriode !== 'All' ? MONTH_ORDER[appliedTableFilters.startPeriode] : 0;
      const endIdx = appliedTableFilters.endPeriode !== 'All' ? MONTH_ORDER[appliedTableFilters.endPeriode] : 999;

      if (rowMonthIdx) {
        passPeriode = rowMonthIdx >= startIdx && rowMonthIdx <= endIdx;
      }

      return passJenis && passTagging && passPrincipal && passGroup && passPeriode;
    });
    setFilteredTableData(result);
    setCurrentPage(1); // Reset ke halaman 1 setiap kali filter diterapkan
  }, [appliedTableFilters]);

  const handleApplyTableFilter = () => {
    setAppliedTableFilters({ ...tableFilters });
  };

  // Logika Data yang akan dirender di halaman aktif
  const totalPages = Math.ceil(filteredTableData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentTableData = filteredTableData.slice(startIndex, startIndex + itemsPerPage);

  const handleLogout = () => alert("Logout berhasil!");

  const getBadgeType = (type) => {
    if (type.includes('Service')) return 'bg-amber-100 text-amber-700';
    if (type.includes('Interchange')) return 'bg-emerald-100 text-emerald-700';
    return 'bg-slate-100 text-slate-700';
  };


  // ==========================================
  // 7. RENDER UI
  // ==========================================
  return (
    <div className="flex h-screen bg-[#f8fafc] font-sans text-slate-800 overflow-hidden relative">
      
      {/* --- OVERLAY MOBILE MENU DENGAN BLUR KACA --- */}
      <div 
        className={`md:hidden fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 transition-opacity duration-300 ${isMobileMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} 
        onClick={() => setIsMobileMenuOpen(false)}
      ></div>

      {/* --- SIDEBAR KIRI --- */}
      <aside className={`fixed md:relative z-50 left-0 top-0 h-full bg-transparent md:bg-[#f8fafc] border-none md:border-r border-slate-200/60 transform transition-transform duration-300 ease-out ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 w-[100px] md:w-[104px] flex flex-col justify-between items-center py-6 sm:py-8 shrink-0`}>
        
        <div className="bg-white rounded-[2.5rem] flex flex-col items-center py-8 px-4 shadow-[0_8px_30px_rgb(0,0,0,0.12)] md:shadow-sm border border-slate-100/50 md:border-slate-100">
          <button className="md:hidden mb-8 text-slate-400 hover:text-blue-600 transition-colors" onClick={() => setIsMobileMenuOpen(false)}>
            <X size={26} strokeWidth={1.5} />
          </button>

          <nav className="flex flex-col gap-8 items-center">
            <button onClick={() => navigate('/')} className="text-slate-400 hover:text-blue-600 transition-colors" title="Dashboard"><CreditCard size={24} strokeWidth={1.5} /></button>
            <button className="text-blue-600 transition-colors" title="Detail Cost"><Book size={24} strokeWidth={1.5} /></button>
          </nav>
        </div>
        
        <div className="flex flex-col gap-4 relative">
          <div className="relative flex justify-center">
            <button 
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className={`bg-white rounded-full w-14 h-14 flex items-center justify-center shadow-[0_8px_30px_rgb(0,0,0,0.12)] md:shadow-sm border text-slate-600 hover:bg-slate-50 transition-colors relative z-20 ${isProfileOpen ? 'border-blue-400 ring-2 ring-blue-100' : 'border-slate-100'}`} 
              title="Profile"
            >
              <User size={22} strokeWidth={1.5} />
              <ChevronUp size={14} strokeWidth={2} className={`absolute top-2 right-1 text-slate-400 transition-transform duration-300 ${isProfileOpen ? 'rotate-180 text-blue-500' : ''}`} />
            </button>

            {isProfileOpen && (
              <div className="absolute left-[calc(100%+16px)] bottom-0 w-56 bg-white border border-slate-100 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] p-4 z-50 flex items-center gap-3 animate-in fade-in slide-in-from-left-2 duration-200">
                <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 shrink-0">
                  <User size={20} strokeWidth={2} />
                </div>
                <div>
                  <p className="text-[14px] font-bold text-slate-800 leading-tight">Mandiri</p>
                  <p className="text-[12px] text-slate-500 font-medium">Administrator</p>
                </div>
              </div>
            )}
          </div>

          <button onClick={handleLogout} className="bg-white rounded-[1.25rem] w-14 h-14 flex items-center justify-center shadow-[0_8px_30px_rgb(0,0,0,0.12)] md:shadow-sm border border-slate-100 text-slate-600 hover:bg-rose-50 hover:text-rose-600 transition-colors">
            <LogOut size={22} strokeWidth={1.5} className="transform rotate-180" />
          </button>
        </div>
      </aside>

      {/* --- KONTEN UTAMA --- */}
      <main className="flex-1 flex flex-col h-screen overflow-x-hidden overflow-y-auto" onClick={() => setIsProfileOpen(false)}>
        
        {/* MOBILE HEADER BAR */}
        <div className="md:hidden flex justify-between items-center bg-white px-5 py-4 border-b border-slate-200 sticky top-0 z-20">
          <button onClick={() => setIsMobileMenuOpen(true)} className="text-slate-700 hover:text-blue-600"><Menu size={24} /></button>
          <h1 className="font-bold text-lg text-slate-900 tracking-tight">Detail Cost</h1>
          <div className="w-8 h-8 bg-blue-50 rounded-full flex items-center justify-center text-blue-600"><User size={16} /></div>
        </div>

        <div className="p-4 sm:p-6 lg:p-8 max-w-[1400px] w-full mx-auto">
          
          {/* BANNER BIRU KEPALA */}
          <div className="w-full h-12 sm:h-14 bg-[#0A3A6A] rounded-xl flex justify-between items-center px-5 sm:px-8 mb-8 shadow-md overflow-hidden">
            <div className="shrink-0 flex items-center"><img src={LogoMandiri} alt="Mandiri" className="h-10 sm:h-12 scale-[1.5] sm:scale-[1.8] transform origin-left object-contain" /></div>
            <div className="text-center flex-1 px-4 hidden md:block mt-1">
              <h2 className="text-white text-base lg:text-[18px] font-bold tracking-wide uppercase leading-none">Dashboard Principal Fee eChannel Transaction</h2>
              <p className="text-white text-[10px] lg:text-[11px] font-light mt-1 opacity-90 tracking-widest italic leading-none">ELECTRONIC CHANNEL OPERATIONS GROUP</p>
            </div>
            <div className="shrink-0 flex items-center"><img src={LogoDanantara} alt="Danantara" className="h-5 sm:h-4 scale-[2] sm:scale-[2.5] transform origin-right object-contain" /></div>
          </div>

          {/* SECTION 1: CHART FILTERS (rata kanan, ukuran ringkas) */}
          <div className="flex justify-end mb-6">
            <div className="flex flex-wrap items-end gap-3 bg-white px-4 py-3 rounded-xl shadow-sm border border-slate-200/60 w-full sm:w-auto">
              <div className="flex flex-col gap-1 flex-1 sm:flex-none sm:w-[150px]">
                <label className="text-[11px] font-semibold text-slate-500">Start Date</label>
                <input
                  type="date"
                  min={DATE_MIN} max={DATE_MAX}
                  className="w-full border border-slate-300 rounded-md px-2 py-1 text-[12px] font-medium text-slate-700 bg-white outline-none focus:border-blue-400 cursor-pointer"
                  value={chartFilters.startDate}
                  onChange={(e) => setChartFilters({...chartFilters, startDate: e.target.value})}
                />
              </div>

              <div className="flex flex-col gap-1 flex-1 sm:flex-none sm:w-[150px]">
                <label className="text-[11px] font-semibold text-slate-500">End Date</label>
                <input
                  type="date"
                  min={DATE_MIN} max={DATE_MAX}
                  className="w-full border border-slate-300 rounded-md px-2 py-1 text-[12px] font-medium text-slate-700 bg-white outline-none focus:border-blue-400 cursor-pointer"
                  value={chartFilters.endDate}
                  onChange={(e) => setChartFilters({...chartFilters, endDate: e.target.value})}
                />
              </div>

              <div className="flex flex-col gap-1 flex-1 sm:flex-none sm:w-[130px]">
                <label className="text-[11px] font-semibold text-slate-500">Category</label>
                <div className="relative flex items-center">
                  <select
                    className="w-full border border-slate-300 rounded-md px-2 py-1 pr-7 text-[12px] font-medium text-slate-700 bg-white outline-none focus:border-blue-400 cursor-pointer appearance-none"
                    value={chartFilters.view}
                    onChange={(e) => setChartFilters({...chartFilters, view: e.target.value})}
                  >
                    {Object.keys(VIEW_OPTIONS).map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                  <ChevronDown size={14} className="text-slate-500 absolute right-2 pointer-events-none" />
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 2: LINE CHART (Billing Line, Income, Cost per bulan) */}
          <div className="w-full bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-200/60 h-[400px] mb-8">
            {chartData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-400 text-[13px] font-medium">
                Tidak ada data pada rentang tanggal yang dipilih.
              </div>
            ) : (
            <ResponsiveContainer width="100%" height="100%">
              {/* Margin kiri/kanan & padding sumbu X supaya titik + label di ujung tidak terpotong */}
              <LineChart data={chartData} margin={{ top: 10, right: 30, left: 30, bottom: 5 }}>
                <CartesianGrid vertical={false} stroke="#eef2f6" />
                
                <XAxis 
                  dataKey="dateLabel" 
                  axisLine={{stroke: '#cbd5e1'}} 
                  tickLine={false} 
                  tick={{fontSize: 11, fill: '#64748b', fontWeight: 600}} 
                  dy={10} 
                  padding={{ left: 20, right: 20 }}
                  interval="preserveStartEnd"
                  height={35}
                />
                {/* Sumbu Y disembunyikan, nilai ditampilkan langsung di setiap titik */}
                <YAxis yAxisId="left" hide domain={yDomains.left} />
                <YAxis yAxisId="right" orientation="right" hide domain={yDomains.right} />
                
                <Tooltip
                  cursor={{ stroke: '#cbd5e1', strokeWidth: 1 }}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontWeight: 500 }}
                  formatter={(value, name) => [name === 'Billing Line' ? formatBilling(value) : formatCurrency(value), name]}
                />

                <Legend
                  verticalAlign="top" align="left" iconType="square" iconSize={14}
                  wrapperStyle={{ paddingBottom: '24px', fontSize: '13px', fontWeight: 600 }}
                  formatter={(value) => <span style={{ color: '#334155', marginRight: 40 }}>{value}</span>}
                />

                {visibleSeries.map(s => (
                  <Line
                    key={s.key}
                    yAxisId={s.axis}
                    type="linear"
                    dataKey={s.key}
                    name={s.name}
                    stroke={s.color}
                    strokeWidth={3}
                    dot={{ r: 6, fill: s.color, stroke: s.color }}
                    activeDot={{ r: 8, fill: s.color, stroke: '#fff', strokeWidth: 2 }}
                    label={showPointLabels ? makePointLabel(s.axis === 'right' ? formatBilling : formatCurrency, s.labelColor, s.labelPos) : false}
                    isAnimationActive={false}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
            )}
          </div>

          {/* SECTION 3: TRANSACTION CONFIGURATION TABLE */}
          <div className="w-full bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden mb-10">
            
            <div className="flex flex-col lg:flex-row justify-between items-start px-6 py-6 border-b border-slate-100 gap-5">
              <div>
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">Detail Billing</h2>
              </div>

              <div className="flex flex-col items-end gap-3 w-full lg:w-auto">
                <div className="flex flex-wrap items-center justify-end gap-2 w-full">
                  
                  {/* --- FILTER START PERIODE --- */}
                  <div className="relative flex items-center">
                    <Settings2 size={13} className="text-slate-400 absolute left-2.5 pointer-events-none" />
                    <select className="pl-7 pr-6 py-1.5 border border-slate-200 rounded-lg text-[12px] font-semibold text-slate-600 hover:bg-slate-50 transition-colors appearance-none outline-none bg-white cursor-pointer" value={tableFilters.startPeriode} onChange={(e) => setTableFilters({...tableFilters, startPeriode: e.target.value})}>
                      <option value="All">Start Periode</option>
                      {FILTER_OPTIONS.month.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                    <ChevronDown size={12} className="text-slate-400 absolute right-2.5 pointer-events-none" />
                  </div>

                  {/* --- FILTER END PERIODE --- */}
                  <div className="relative flex items-center">
                    <span className="text-slate-400 mx-1 text-xs font-bold">-</span>
                    <Settings2 size={13} className="text-slate-400 absolute left-5 pointer-events-none" />
                    <select className="pl-9 pr-6 py-1.5 border border-slate-200 rounded-lg text-[12px] font-semibold text-slate-600 hover:bg-slate-50 transition-colors appearance-none outline-none bg-white cursor-pointer" value={tableFilters.endPeriode} onChange={(e) => setTableFilters({...tableFilters, endPeriode: e.target.value})}>
                      <option value="All">End Periode</option>
                      {FILTER_OPTIONS.month.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                    <ChevronDown size={12} className="text-slate-400 absolute right-2.5 pointer-events-none" />
                  </div>

                  {/* Filter Jenis Transaksi */}
                  <div className="relative flex items-center">
                    <Settings2 size={13} className="text-slate-400 absolute left-2.5 pointer-events-none" />
                    <select className="pl-7 pr-6 py-1.5 border border-slate-200 rounded-lg text-[12px] font-semibold text-slate-600 hover:bg-slate-50 transition-colors appearance-none outline-none bg-white cursor-pointer" value={tableFilters.jenisTransaksi} onChange={(e) => setTableFilters({...tableFilters, jenisTransaksi: e.target.value})}>
                      <option value="All">Jenis Transaksi</option>
                      {FILTER_OPTIONS.jenisTransaksi.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                    <ChevronDown size={12} className="text-slate-400 absolute right-2.5 pointer-events-none" />
                  </div>

                  {/* Filter Tagging */}
                  <div className="relative flex items-center">
                    <Settings2 size={13} className="text-slate-400 absolute left-2.5 pointer-events-none" />
                    <select className="pl-7 pr-6 py-1.5 border border-slate-200 rounded-lg text-[12px] font-semibold text-slate-600 hover:bg-slate-50 transition-colors appearance-none outline-none bg-white cursor-pointer" value={tableFilters.tagging} onChange={(e) => setTableFilters({...tableFilters, tagging: e.target.value})}>
                      <option value="All">Tagging</option>
                      {FILTER_OPTIONS.tagging.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                    <ChevronDown size={12} className="text-slate-400 absolute right-2.5 pointer-events-none" />
                  </div>

                  {/* Filter Principal */}
                  <div className="relative flex items-center">
                    <Settings2 size={13} className="text-slate-400 absolute left-2.5 pointer-events-none" />
                    <select className="pl-7 pr-6 py-1.5 border border-slate-200 rounded-lg text-[12px] font-semibold text-slate-600 hover:bg-slate-50 transition-colors appearance-none outline-none bg-white cursor-pointer" value={tableFilters.principal} onChange={(e) => setTableFilters({...tableFilters, principal: e.target.value})}>
                      <option value="All">Principal</option>
                      {FILTER_OPTIONS.principal.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                    <ChevronDown size={12} className="text-slate-400 absolute right-2.5 pointer-events-none" />
                  </div>

                  {/* Filter Group */}
                  <div className="relative flex items-center">
                    <Settings2 size={13} className="text-slate-400 absolute left-2.5 pointer-events-none" />
                    <select className="pl-7 pr-6 py-1.5 border border-slate-200 rounded-lg text-[12px] font-semibold text-slate-600 hover:bg-slate-50 transition-colors appearance-none outline-none bg-white cursor-pointer" value={tableFilters.group} onChange={(e) => setTableFilters({...tableFilters, group: e.target.value})}>
                      <option value="All">Group</option>
                      {FILTER_OPTIONS.group.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                    <ChevronDown size={12} className="text-slate-400 absolute right-2.5 pointer-events-none" />
                  </div>

                </div>

                <button onClick={handleApplyTableFilter} className="flex items-center gap-1.5 px-6 py-2 bg-[#111827] hover:bg-black text-white rounded-lg text-[12px] font-bold shadow-sm transition-all active:scale-95">
                  <Filter size={13} /> Apply
                </button>

              </div>
            </div>

            <div className="w-full overflow-x-auto">
              {/* Kolomnya diperbanyak, min-w dilebarkan agar tidak terjepit */}
              <table className="w-full text-left border-collapse min-w-[1800px]">
                <thead className="bg-[#f8fafc]">
                  <tr>
                    {['JENIS TRANSAKSI', 'TAGGING', 'PRINCIPAL', 'GROUP', 'STATUS', 'TANGGAL', 'ICA', 'BILLING LINE', 'DESCRIPTION', 'TOTAL', 'EQV IDR', 'PRINCIPAL FEE TYPE', 'PRINCIPAL CATEGORY', 'PRINCIPAL SUB CATEGORY'].map(head => (
                      <th key={head} className={`py-4 px-5 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200/80 ${head === 'TOTAL' || head === 'EQV IDR' ? 'text-right' : ''}`}>
                        {head}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {currentTableData.length > 0 ? (
                    currentTableData.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/60 transition-colors group">
                        
                        <td className="py-4 px-5">
                          <span className={`px-2.5 py-1 rounded-md text-[10px] font-extrabold tracking-wide uppercase ${getBadgeType(row.jenisTransaksi)}`}>
                            {row.jenisTransaksi}
                          </span>
                        </td>
                        
                        <td className="py-4 px-5 text-[13px] font-bold text-slate-800">{row.tagging}</td>
                        <td className="py-4 px-5 text-[13px] font-bold text-slate-800">{row.principal}</td>
                        <td className={`py-4 px-5 text-[13px] font-bold ${row.group.includes('Debit') ? 'text-blue-600' : 'text-slate-600'}`}>{row.group}</td>
                        <td className="py-4 px-5 text-[13px] font-semibold text-slate-500">{row.status}</td>
                        <td className="py-4 px-5 text-[13px] font-medium text-slate-500">{row.tanggal}</td>
                        <td className="py-4 px-5 text-[13px] font-medium text-slate-500">{row.ica}</td>
                        <td className="py-4 px-5 text-[13px] font-bold text-slate-700">{row.billingLine}</td>
                        <td className="py-4 px-5 text-[13px] font-medium text-slate-500 max-w-[200px] truncate" title={row.description}>
                          {row.description}
                        </td>
                        <td className="py-4 px-5 text-[13px] font-bold text-slate-800 text-right">
                          {formatDecimal(row.total)}
                        </td>
                        <td className="py-4 px-5 text-[13px] font-bold text-slate-800 text-right">
                          {formatDecimal(row.eqvIdr)}
                        </td>
                        <td className="py-4 px-5 text-[13px] font-medium text-slate-500">{row.principalFeeType}</td>
                        <td className="py-4 px-5 text-[13px] font-medium text-slate-500">{row.principalCategory}</td>
                        <td className="py-4 px-5 text-[13px] font-medium text-slate-500">{row.principalSubCategory}</td>

                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="14" className="py-10 text-center text-slate-400 font-medium text-[13px]">
                        Tidak ada data yang sesuai dengan filter yang dipilih.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* --- FOOTER PAGINATION --- */}
            <div className="flex flex-col sm:flex-row justify-between items-center px-6 py-4 border-t border-slate-100 gap-4 bg-white">
              <p className="text-[13px] text-slate-500 font-medium">
                Showing <span className="font-bold text-slate-700">{filteredTableData.length > 0 ? startIndex + 1 : 0}</span> to <span className="font-bold text-slate-700">{Math.min(startIndex + itemsPerPage, filteredTableData.length)}</span> of <span className="font-bold text-slate-700">{filteredTableData.length}</span> entries
              </p>

              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="flex items-center gap-1 px-3 py-1.5 border border-slate-200 rounded-lg text-[12px] font-bold text-slate-600 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronLeft size={14} /> Previous
                </button>

                <div className="px-3 py-1 text-[13px] font-bold text-slate-700 bg-slate-100 rounded-lg">
                  {currentPage} / {totalPages || 1}
                </div>

                <button 
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages || totalPages === 0}
                  className="flex items-center gap-1 px-3 py-1.5 border border-slate-200 rounded-lg text-[12px] font-bold text-slate-600 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  Next <ChevronRight size={14} />
                </button>
              </div>
            </div>

          </div>

        </div>
      </main>
    </div>
  );
};

export default DetailCost;