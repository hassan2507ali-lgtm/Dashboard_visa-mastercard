import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Menu, CreditCard, Book, ShoppingCart, FileText, 
  Calendar as CalendarIcon, User, ChevronUp, ChevronDown, LogOut, 
  Filter, Settings2
} from 'lucide-react';
import { 
  ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer 
} from 'recharts';

// === IMPORT GAMBAR LOGO DARI FOLDER SRC ===
import LogoMandiri from './mandiri.png';
import LogoDanantara from './danatara.png';

// ==========================================
// 1. GENERATE DUMMY DATA UNTUK GRAFIK
// ==========================================
const generateChartData = () => {
  const data = [];
  let currentDate = new Date(2026, 0, 1);
  const endDate = new Date(2026, 11, 31);
  
  while (currentDate <= endDate) {
    const amountRaw = Math.floor(Math.random() * 40000000) + 5000000;
    const billingCount = Math.floor(Math.random() * 400) + 100;
    
    const startDate = new Date(currentDate.getFullYear(), 0, 1);
    const days = Math.floor((currentDate - startDate) / (24 * 60 * 60 * 1000));
    const weekNumber = Math.ceil((currentDate.getDay() + 1 + days) / 7);

    data.push({
      date: new Date(currentDate),
      dateString: `${currentDate.getFullYear()}-${String(currentDate.getMonth()+1).padStart(2,'0')}-${String(currentDate.getDate()).padStart(2,'0')}`,
      weekKey: `${currentDate.getFullYear()}-W${weekNumber}`,
      monthKey: `${currentDate.getFullYear()}-${String(currentDate.getMonth()+1).padStart(2,'0')}`,
      yearKey: `${currentDate.getFullYear()}`,
      amount: amountRaw,
      billing: billingCount
    });
    currentDate.setDate(currentDate.getDate() + 1);
  }
  return data;
};

const CHART_DB = generateChartData();

// ==========================================
// 2. DUMMY DATA UNTUK TABEL TRANSACTION CONFIG
// ==========================================
const TABLE_DB = [
  { id: '2ZN80637K', group: 'Issuer Debit', desc: '-', periode: '-', class: 'Transaction Service', type: 'DAILY', principal: 'Lokal', status: 'PROGRESS' },
  { id: '2ZN34257K', group: 'Issuer Kredit', desc: '-', periode: '-', class: 'International', type: 'MONTHLY', principal: 'Visa', status: 'COMPLETE' },
  { id: '2ZN62578K', group: 'Both', desc: '-', periode: '-', class: 'Transaction Service', type: 'QUARTERLY', principal: 'Master Card', status: 'PROGRESS' },
  { id: '2ZN74208K', group: 'Acq EDC', desc: '-', periode: '-', class: 'Transaction Service', type: 'QUARTERLY', principal: 'Lokal', status: 'FAILED' },
  { id: '2ZN63566K', group: 'Issuer Kredit', desc: '-', periode: '-', class: 'International', type: 'INTERCHANGE', principal: 'Master Card', status: 'PROGRESS' },
  { id: '2ZN34188K', group: 'Both', desc: '-', periode: '-', class: 'Transaction Service', type: 'INTERCHANGE', principal: 'JCB', status: 'COMPLETE' },
  { id: '2ZN93789K', group: 'Acq ATM', desc: '-', periode: '-', class: 'Transaction Service', type: 'DAILY', principal: 'Visa', status: 'COMPLETE' },
  { id: '2ZN11223K', group: 'Acq Both', desc: '-', periode: '-', class: 'International', type: 'MTI', principal: 'Visa', status: 'PROGRESS' },
  { id: '2ZN44556K', group: 'Issuer Both', desc: '-', periode: '-', class: 'Transaction Service', type: 'MONTHLY', principal: 'Master Card', status: 'FAILED' },
  { id: '2ZN77889K', group: 'Both', desc: '-', periode: '-', class: 'Transaction Service', type: 'DAILY', principal: 'Lokal', status: 'COMPLETE' },
];

const FILTER_OPTIONS = {
  group: ['Issuer Kredit', 'Issuer Debit', 'Acq EDC', 'Acq ATM', 'Acq Both', 'Issuer Both', 'Both'],
  klasifikasi: ['International', 'Transaction Service'],
  principal: ['Visa', 'Master Card', 'JCB', 'Lokal'],
  type: ['MONTHLY', 'QUARTERLY', 'INTERCHANGE', 'DAILY', 'MTI'],
  status: ['PROGRESS', 'COMPLETE', 'FAILED']
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

const DetailCost = () => {
  const navigate = useNavigate();

  // ==========================================
  // 3. STATE MANAGEMENT
  // ==========================================
  const [chartFilters, setChartFilters] = useState({
    eventId: 'All', principal: 'All', eventDesc: 'All', timeView: 'Daily'
  });
  const [chartData, setChartData] = useState([]);

  const [tableFilters, setTableFilters] = useState({
    group: 'All', klasifikasi: 'All', principal: 'All', type: 'All', status: 'All'
  });
  const [appliedTableFilters, setAppliedTableFilters] = useState({ ...tableFilters });
  const [filteredTableData, setFilteredTableData] = useState(TABLE_DB);

  // --- STATE MENU MOBILE & POP-UP PROFILE ---
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // ==========================================
  // 4. LOGIKA AGREGASI GRAFIK
  // ==========================================
  useEffect(() => {
    const timeView = chartFilters.timeView;
    const aggMap = {};

    CHART_DB.forEach(item => {
      let key = '';
      let label = '';

      if (timeView === 'Daily') {
        key = item.dateString;
        label = item.date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
      } else if (timeView === 'Weekly') {
        key = item.weekKey;
        label = item.weekKey.replace('-', ' ');
      } else if (timeView === 'Monthly') {
        key = item.monthKey;
        label = item.date.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' });
      } else {
        key = item.yearKey;
        label = item.yearKey;
      }

      if (!aggMap[key]) {
        aggMap[key] = { dateLabel: label, amount: 0, billing: 0, sortKey: key };
      }
      aggMap[key].amount += item.amount;
      aggMap[key].billing += item.billing;
    });

    let newChartData = Object.values(aggMap).sort((a, b) => a.sortKey.localeCompare(b.sortKey));

    if (timeView === 'Daily') newChartData = newChartData.slice(-30); 
    if (timeView === 'Weekly') newChartData = newChartData.slice(-12);

    setChartData(newChartData);
  }, [chartFilters]);

  // ==========================================
  // 5. LOGIKA FILTERING TABEL
  // ==========================================
  useEffect(() => {
    const result = TABLE_DB.filter(row => {
      const passGroup = appliedTableFilters.group === 'All' || row.group === appliedTableFilters.group;
      const passClass = appliedTableFilters.klasifikasi === 'All' || row.class === appliedTableFilters.klasifikasi;
      const passPrincipal = appliedTableFilters.principal === 'All' || row.principal === appliedTableFilters.principal;
      const passType = appliedTableFilters.type === 'All' || row.type === appliedTableFilters.type;
      const passStatus = appliedTableFilters.status === 'All' || row.status === appliedTableFilters.status;

      return passGroup && passClass && passPrincipal && passType && passStatus;
    });
    setFilteredTableData(result);
  }, [appliedTableFilters]);

  const handleApplyTableFilter = () => {
    setAppliedTableFilters({ ...tableFilters });
  };

  const handleLogout = () => alert("Logout berhasil!");

  // ==========================================
  // 6. HELPER COMPONENTS (Pills)
  // ==========================================
  const getBadgeType = (type) => {
    switch(type) {
      case 'DAILY': return 'bg-emerald-100 text-emerald-700';
      case 'MONTHLY': return 'bg-blue-100 text-blue-700';
      case 'QUARTERLY': return 'bg-purple-100 text-purple-700';
      case 'INTERCHANGE': return 'bg-slate-100 text-slate-700';
      case 'MTI': return 'bg-teal-100 text-teal-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getBadgeStatus = (status) => {
    switch(status) {
      case 'PROGRESS': return 'bg-amber-100 text-amber-700';
      case 'COMPLETE': return 'bg-emerald-100 text-emerald-700';
      case 'FAILED': return 'bg-rose-100 text-rose-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const isDaily = chartFilters.timeView === 'Daily';

  // ==========================================
  // 7. RENDER UI
  // ==========================================
  return (
    <div className="flex h-screen bg-[#f8fafc] font-sans text-slate-800 overflow-hidden relative">
      
      {/* --- OVERLAY MOBILE MENU --- */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 bg-slate-900/50 z-30" onClick={() => setIsMobileMenuOpen(false)}></div>
      )}

      {/* --- SIDEBAR KIRI (Responsif) --- */}
      <aside className={`absolute md:relative z-40 left-0 top-0 h-full bg-[#f8fafc] border-r border-slate-200/60 transform transition-transform duration-300 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 w-[104px] flex flex-col justify-between items-center py-6 shrink-0`}>
        <div className="bg-white rounded-[2.5rem] flex flex-col items-center py-8 px-4 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100">
          
          <nav className="flex flex-col gap-8 items-center">
            <button onClick={() => navigate('/')} className="text-slate-400 hover:text-blue-600 transition-colors" title="Dashboard"><CreditCard size={24} strokeWidth={1.5} /></button>
            <button className="text-blue-600 transition-colors" title="Detail Cost"><Book size={24} strokeWidth={1.5} /></button>
    
          </nav>
        </div>
        
        {/* PROFILE & LOGOUT SECTION */}
        <div className="flex flex-col gap-4 relative">
          
          {/* PROFILE BUTTON DENGAN POP-UP */}
          <div className="relative flex justify-center">
            <button 
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className={`bg-white rounded-full w-14 h-14 flex items-center justify-center shadow-sm border text-slate-600 hover:bg-slate-50 transition-colors relative z-20 ${isProfileOpen ? 'border-blue-400 ring-2 ring-blue-100' : 'border-slate-100'}`} 
              title="Profile"
            >
              <User size={22} strokeWidth={1.5} />
              <ChevronUp size={14} strokeWidth={2} className={`absolute top-2 right-1 text-slate-400 transition-transform duration-300 ${isProfileOpen ? 'rotate-180 text-blue-500' : ''}`} />
            </button>

            {/* POP-UP PROFILE KESAMPING */}
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

          <button onClick={handleLogout} className="bg-white rounded-[1.25rem] w-14 h-14 flex items-center justify-center shadow-sm border border-slate-100 text-slate-600 hover:bg-rose-50 hover:text-rose-600 transition-colors">
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
          
          {/* --- TOP BANNER (HEADER BIRU) DENGAN LOGO IMPORT --- */}
          <div className="w-full h-12 sm:h-14 bg-[#0A3A6A] rounded-xl flex justify-between items-center px-5 sm:px-8 mb-8 shadow-md">
            
            {/* Logo Mandiri */}
            <div className="shrink-0 flex items-center">
              {/* Ukuran dasar dibesarkan ke h-10, lalu di-scale 1.8x lipat ke kiri */}
              <img 
                src={LogoMandiri} 
                alt="Mandiri" 
                className="h-2 sm:h-5 scale-[1.5] sm:scale-[1.8] transform origin-left object-contain" 
              />
            </div>

            {/* Teks Tengah */}
            <div className="text-center flex-1 px-4 hidden md:block mt-1">
              <h2 className="text-white text-base lg:text-[18px] font-bold tracking-wide uppercase leading-none">
                Dashboard Principal Fee eChannel Transaction
              </h2>
              <p className="text-white text-[10px] lg:text-[11px] font-light mt-1 opacity-90 tracking-widest italic leading-none">
                ELECTRONIC CHANNEL OPERATIONS GROUP
              </p>
            </div>

            {/* Logo Danantara */}
            <div className="shrink-0 flex items-center">
              {/* Ukuran dasar dibesarkan ke h-10, lalu di-scale ekstrem 2.5x lipat ke kanan untuk memakan ruang kosong */}
              <img 
                src={LogoDanantara} 
                alt="Danantara" 
                className="h-9 sm:h-12 scale-[2] sm:scale-[2.5] transform origin-right object-contain" 
              />
            </div>
            
          </div>

          {/* SECTION 1: CHART FILTERS */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 bg-white p-5 rounded-2xl shadow-sm border border-slate-200/60 gap-5">
            <div className="flex flex-col md:flex-row gap-5 md:gap-8 w-full md:w-2/3">
              <div className="flex flex-col gap-2 w-full md:w-1/3">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Event ID / Billing Line</label>
                <div className="relative border-b border-slate-200 pb-1 flex items-center">
                  <select className="w-full text-[13px] font-semibold text-slate-700 bg-transparent outline-none cursor-pointer appearance-none pr-6" value={chartFilters.eventId} onChange={(e) => setChartFilters({...chartFilters, eventId: e.target.value})}>
                    <option value="All">All</option>
                    <option value="2ZN80637K">2ZN80637K</option>
                    <option value="2ZN34257K">2ZN34257K</option>
                  </select>
                  <ChevronDown size={16} className="text-slate-400 absolute right-0 pointer-events-none" />
                </div>
              </div>

              <div className="flex flex-col gap-2 w-full md:w-1/3">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Principal</label>
                <div className="relative border-b border-slate-200 pb-1 flex items-center">
                  <select className="w-full text-[13px] font-semibold text-slate-700 bg-transparent outline-none cursor-pointer appearance-none pr-6" value={chartFilters.principal} onChange={(e) => setChartFilters({...chartFilters, principal: e.target.value})}>
                    <option value="All">All</option>
                    <option value="Visa">Visa</option>
                    <option value="Mastercard">Mastercard</option>
                  </select>
                  <ChevronDown size={16} className="text-slate-400 absolute right-0 pointer-events-none" />
                </div>
              </div>

              <div className="flex flex-col gap-2 w-full md:w-1/3">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Event Description</label>
                <div className="relative border-b border-slate-200 pb-1 flex items-center">
                  <select className="w-full text-[13px] font-semibold text-slate-700 bg-transparent outline-none cursor-pointer appearance-none pr-6" value={chartFilters.eventDesc} onChange={(e) => setChartFilters({...chartFilters, eventDesc: e.target.value})}>
                    <option value="All">All</option>
                    <option value="Account Inquiry">Account Inquiry</option>
                    <option value="Acquirer Chargebacks">Acquirer Chargebacks</option>
                  </select>
                  <ChevronDown size={16} className="text-slate-400 absolute right-0 pointer-events-none" />
                </div>
              </div>
            </div>

            <div className="flex flex-wrap bg-slate-100 p-1 rounded-xl border border-slate-200 shadow-inner w-full md:w-auto">
              {['Daily', 'Weekly', 'Monthly', 'Yearly'].map(view => (
                <button 
                  key={view}
                  onClick={() => setChartFilters({...chartFilters, timeView: view})}
                  className={`flex-1 md:flex-none px-4 py-1.5 text-[13px] font-bold rounded-lg transition-all ${chartFilters.timeView === view ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  {view}
                </button>
              ))}
            </div>
          </div>

          {/* SECTION 2: GRAFIK COMPOSED CHART */}
          <div className="w-full bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-200/60 h-[380px] mb-8">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 30, right: 0, left: -20, bottom: isDaily ? 20 : 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                
                <XAxis 
                  dataKey="dateLabel" 
                  axisLine={{stroke: '#cbd5e1'}} 
                  tickLine={false} 
                  tick={{fontSize: 11, fill: '#64748b'}} 
                  dy={10} 
                  angle={isDaily ? -45 : 0} 
                  textAnchor={isDaily ? "end" : "center"}
                  minTickGap={-5} 
                  height={isDaily ? 60 : 30}
                />
                <YAxis 
                  yAxisId="left" axisLine={false} tickLine={false} 
                  tickFormatter={(t) => formatCurrency(t)} tick={{fontSize: 11, fill: '#64748b', fontWeight: 600}} 
                  width={70}
                />
                <YAxis 
                  yAxisId="right" orientation="right" axisLine={false} tickLine={false} 
                  tickFormatter={(t) => formatBilling(t)} tick={{fontSize: 11, fill: '#64748b', fontWeight: 600}} 
                  width={50}
                />
                
                <Tooltip 
                  cursor={{fill: '#f8fafc'}}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontWeight: 500 }}
                  formatter={(value, name) => [name === 'Amount' ? formatCurrency(value) : formatBilling(value), name]}
                />
                
                <Legend verticalAlign="top" align="center" wrapperStyle={{ paddingBottom: '30px', fontSize: '13px', fontWeight: 600, color: '#334155' }} />

                <Bar yAxisId="left" dataKey="amount" name="Amount" fill="#3b82f6" barSize={isDaily ? 14 : 36} radius={[4, 4, 0, 0]} />
                <Line yAxisId="right" type="monotone" dataKey="billing" name="Billing" stroke="#1e3a8a" strokeWidth={3} dot={{r: 4, fill: '#1e3a8a'}} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* SECTION 3: TRANSACTION CONFIGURATION TABLE */}
          <div className="w-full bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden mb-10">
            
            {/* BAGIAN HEADER & FILTER TABEL YANG SUDAH DIUPDATE */}
            <div className="flex flex-col lg:flex-row justify-between items-start px-6 py-6 border-b border-slate-100 gap-5">
              <div>
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">Transaction Configuration</h2>
                <p className="text-[13px] text-slate-500 font-medium mt-1">Manage and classify billing accounts, group methods, and card issuers.</p>
              </div>

              {/* Wrapper Flex-Col untuk meletakkan tombol di bawah deretan filter */}
              <div className="flex flex-col items-end gap-3 w-full lg:w-auto">
                
                <div className="flex flex-wrap items-center justify-end gap-2 w-full">
                  {/* Filters Dropdown */}
                  <div className="relative flex items-center">
                    <Settings2 size={13} className="text-slate-400 absolute left-2.5 pointer-events-none" />
                    <select className="pl-7 pr-6 py-1.5 border border-slate-200 rounded-lg text-[12px] font-semibold text-slate-600 hover:bg-slate-50 transition-colors appearance-none outline-none bg-white cursor-pointer" value={tableFilters.group} onChange={(e) => setTableFilters({...tableFilters, group: e.target.value})}>
                      <option value="All">Group Mandiri</option>
                      {FILTER_OPTIONS.group.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                    <ChevronDown size={12} className="text-slate-400 absolute right-2.5 pointer-events-none" />
                  </div>

                  <div className="relative flex items-center">
                    <Settings2 size={13} className="text-slate-400 absolute left-2.5 pointer-events-none" />
                    <select className="pl-7 pr-6 py-1.5 border border-slate-200 rounded-lg text-[12px] font-semibold text-slate-600 hover:bg-slate-50 transition-colors appearance-none outline-none bg-white cursor-pointer" value={tableFilters.klasifikasi} onChange={(e) => setTableFilters({...tableFilters, klasifikasi: e.target.value})}>
                      <option value="All">Klasifikasi</option>
                      {FILTER_OPTIONS.klasifikasi.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                    <ChevronDown size={12} className="text-slate-400 absolute right-2.5 pointer-events-none" />
                  </div>

                  <div className="relative flex items-center">
                    <Settings2 size={13} className="text-slate-400 absolute left-2.5 pointer-events-none" />
                    <select className="pl-7 pr-6 py-1.5 border border-slate-200 rounded-lg text-[12px] font-semibold text-slate-600 hover:bg-slate-50 transition-colors appearance-none outline-none bg-white cursor-pointer" value={tableFilters.principal} onChange={(e) => setTableFilters({...tableFilters, principal: e.target.value})}>
                      <option value="All">Principal</option>
                      {FILTER_OPTIONS.principal.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                    <ChevronDown size={12} className="text-slate-400 absolute right-2.5 pointer-events-none" />
                  </div>

                  <div className="relative flex items-center">
                    <Settings2 size={13} className="text-slate-400 absolute left-2.5 pointer-events-none" />
                    <select className="pl-7 pr-6 py-1.5 border border-slate-200 rounded-lg text-[12px] font-semibold text-slate-600 hover:bg-slate-50 transition-colors appearance-none outline-none bg-white cursor-pointer" value={tableFilters.type} onChange={(e) => setTableFilters({...tableFilters, type: e.target.value})}>
                      <option value="All">Type</option>
                      {FILTER_OPTIONS.type.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                    <ChevronDown size={12} className="text-slate-400 absolute right-2.5 pointer-events-none" />
                  </div>

                  <div className="relative flex items-center">
                    <Settings2 size={13} className="text-slate-400 absolute left-2.5 pointer-events-none" />
                    <select className="pl-7 pr-6 py-1.5 border border-slate-200 rounded-lg text-[12px] font-semibold text-slate-600 hover:bg-slate-50 transition-colors appearance-none outline-none bg-white cursor-pointer" value={tableFilters.status} onChange={(e) => setTableFilters({...tableFilters, status: e.target.value})}>
                      <option value="All">Status</option>
                      {FILTER_OPTIONS.status.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                    <ChevronDown size={12} className="text-slate-400 absolute right-2.5 pointer-events-none" />
                  </div>
                </div>

                {/* Tombol Apply diletakkan di bawah deretan filter */}
                <button onClick={handleApplyTableFilter} className="flex items-center gap-1.5 px-6 py-2 bg-[#111827] hover:bg-black text-white rounded-lg text-[12px] font-bold shadow-sm transition-all active:scale-95">
                  <Filter size={13} /> Apply
                </button>

              </div>
            </div>

            <div className="w-full overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[1000px]">
                <thead className="bg-[#f8fafc]">
                  <tr>
                    {['ID BILLING', 'GROUP MANDIRI', 'DESKRIPSI', 'PERIODE', 'KLASIFIKASI', 'TYPE', 'PRINCIPAL', 'STATUS REKON'].map(head => (
                      <th key={head} className="py-4 px-6 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200/80">
                        {head}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredTableData.length > 0 ? (
                    filteredTableData.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/60 transition-colors group">
                        <td className="py-4 px-6 text-[13px] font-bold text-slate-800">{row.id}</td>
                        <td className={`py-4 px-6 text-[13px] font-bold ${row.group.includes('Issuer') ? 'text-blue-600' : 'text-slate-600'}`}>{row.group}</td>
                        <td className="py-4 px-6 text-[13px] font-medium text-slate-400">{row.desc}</td>
                        <td className="py-4 px-6 text-[13px] font-medium text-slate-400">{row.periode}</td>
                        <td className="py-4 px-6 text-[13px] font-medium text-slate-600">{row.class}</td>
                        <td className="py-4 px-6">
                          <span className={`px-2.5 py-1 rounded-md text-[10px] font-extrabold tracking-wide uppercase ${getBadgeType(row.type)}`}>
                            {row.type}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-[13px] font-bold text-slate-800">{row.principal}</td>
                        <td className="py-4 px-6">
                          <span className={`px-2.5 py-1 rounded-md text-[10px] font-extrabold tracking-wide uppercase ${getBadgeStatus(row.status)}`}>
                            {row.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="8" className="py-10 text-center text-slate-400 font-medium text-[13px]">
                        Tidak ada data yang sesuai dengan filter yang dipilih.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

          </div>

        </div>
      </main>
    </div>
  );
};

export default DetailCost;