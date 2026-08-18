import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Menu, CreditCard, Book, ShoppingCart, FileText, 
  Calendar as CalendarIcon, User, ChevronUp, ChevronDown, LogOut, 
  Filter, Settings2
} from 'lucide-react';
import { 
  ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, LabelList 
} from 'recharts';

// ==========================================
// 1. GENERATE DUMMY DATA UNTUK GRAFIK
// ==========================================
const generateChartData = () => {
  const data = [];
  let currentDate = new Date(2026, 0, 1);
  const endDate = new Date(2026, 11, 31);
  
  while (currentDate <= endDate) {
    const amountRaw = Math.floor(Math.random() * 40000000) + 5000000; // 5M - 45M
    const billingCount = Math.floor(Math.random() * 400) + 100;
    
    // Mendapatkan minggu ke-berapa dalam tahun tersebut
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
  { id: '2ZN34257K', group: 'Issuer Debit', desc: '-', periode: '-', class: 'Internasional', type: 'MONTHLY', principal: 'Lokal', status: 'COMPLETE' },
  { id: '2ZN62578K', group: 'Both', desc: '-', periode: '-', class: 'Lokal Service', type: 'QUARTERLY', principal: 'Master Card', status: 'PROGRESS' },
  { id: '2ZN74208K', group: 'Issuer Debit', desc: '-', periode: '-', class: 'Transaction Service', type: 'QUARTERLY', principal: 'Lokal', status: 'FAILED' },
  { id: '2ZN63566K', group: 'Issuer Kredit', desc: '-', periode: '-', class: 'Transaction Service', type: 'INTERCHANGE', principal: 'Master Card', status: 'PROGRESS' },
  { id: '2ZN34188K', group: 'Both', desc: '-', periode: '-', class: 'Transaction Service', type: 'INTERCHANGE', principal: 'JCB', status: 'COMPLETE' },
  { id: '2ZN93789K', group: 'Acq ADC', desc: '-', periode: '-', class: 'Lokal Service', type: 'DAILY', principal: 'Visa', status: 'COMPLETE' },
];

// --- Formatter Uang Custom ---
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

    // Slice data agar grafik tidak terlalu padat dan terlihat rapi
    if (timeView === 'Daily') newChartData = newChartData.slice(-30); // 30 hari terakhir
    if (timeView === 'Weekly') newChartData = newChartData.slice(-12); // 12 minggu terakhir

    setChartData(newChartData);
  }, [chartFilters]);

  // ==========================================
  // 5. HELPER COMPONENTS (Pills & Colors)
  // ==========================================
  const getBadgeType = (type) => {
    switch(type) {
      case 'DAILY': return 'bg-emerald-100 text-emerald-700';
      case 'MONTHLY': return 'bg-blue-100 text-blue-700';
      case 'QUARTERLY': return 'bg-purple-100 text-purple-700';
      case 'INTERCHANGE': return 'bg-slate-100 text-slate-700';
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
  // 6. RENDER UI
  // ==========================================
  return (
    <div className="flex h-screen bg-[#f8fafc] font-sans text-slate-800 overflow-hidden relative">
      
      {/* --- SIDEBAR KIRI --- */}
      <aside className="w-[104px] flex flex-col justify-between items-center py-6 z-10 shrink-0 bg-[#f8fafc] border-r border-slate-200/60">
        <div className="bg-white rounded-[2.5rem] flex flex-col items-center py-8 px-4 shadow-sm border border-slate-200/60">
          <button className="mb-8 text-slate-800 hover:text-blue-600 transition-colors">
            <Menu size={26} strokeWidth={1.5} />
          </button>
          <nav className="flex flex-col gap-8 items-center">
            <button onClick={() => navigate('/')} className="text-slate-400 hover:text-blue-600 transition-colors" title="Dashboard"><CreditCard size={24} strokeWidth={1.5} /></button>
            <button className="text-blue-600 transition-colors" title="Detail Cost"><Book size={24} strokeWidth={1.5} /></button>
            <button className="text-slate-400 hover:text-blue-600 transition-colors" title="Store"><ShoppingCart size={24} strokeWidth={1.5} /></button>
            <button className="text-slate-400 hover:text-blue-600 transition-colors" title="Reports"><FileText size={24} strokeWidth={1.5} /></button>
            <button className="text-slate-400 hover:text-blue-600 transition-colors" title="Calendar"><CalendarIcon size={24} strokeWidth={1.5} /></button>
          </nav>
        </div>
        <div className="flex flex-col gap-4">
          <button className="bg-white rounded-full w-14 h-14 flex items-center justify-center shadow-sm border border-slate-200/60 text-slate-600 hover:bg-slate-50 transition-colors relative" title="Profile">
            <User size={22} strokeWidth={1.5} />
            <ChevronUp size={14} strokeWidth={2} className="absolute top-2 right-1 text-slate-400" />
          </button>
          <button onClick={() => alert("Logout berhasil!")} className="bg-white rounded-[1.25rem] w-14 h-14 flex items-center justify-center shadow-sm border border-slate-200/60 text-slate-600 hover:bg-rose-50 hover:border-rose-100 hover:text-rose-600 transition-colors" title="Logout">
            <LogOut size={22} strokeWidth={1.5} className="transform rotate-180" />
          </button>
        </div>
      </aside>

      {/* --- KONTEN UTAMA --- */}
      <main className="flex-1 flex flex-col h-screen overflow-x-hidden overflow-y-auto px-8 py-8">
        <div className="max-w-[1400px] w-full mx-auto">
          
          {/* SECTION 1: CHART FILTERS */}
          <div className="flex justify-between items-end mb-8 bg-white p-5 rounded-2xl shadow-sm border border-slate-200/60">
            <div className="flex gap-8 w-2/3">
              {/* Event ID Filter */}
              <div className="flex flex-col gap-2 w-1/3">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Event ID / Billing Line</label>
                <div className="relative border-b border-slate-200 pb-1 flex items-center">
                  <select className="w-full text-[13px] font-semibold text-slate-700 bg-transparent outline-none cursor-pointer appearance-none">
                    <option>All</option>
                    <option>2ZN80637K</option>
                    <option>2ZN34257K</option>
                  </select>
                  <ChevronDown size={16} className="text-slate-400 absolute right-0 pointer-events-none" />
                </div>
              </div>

              {/* Principal Filter */}
              <div className="flex flex-col gap-2 w-1/3">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Principal</label>
                <div className="relative border-b border-slate-200 pb-1 flex items-center">
                  <select className="w-full text-[13px] font-semibold text-slate-700 bg-transparent outline-none cursor-pointer appearance-none">
                    <option>All</option>
                    <option>Visa</option>
                    <option>Mastercard</option>
                  </select>
                  <ChevronDown size={16} className="text-slate-400 absolute right-0 pointer-events-none" />
                </div>
              </div>

              {/* Event Description Filter */}
              <div className="flex flex-col gap-2 w-1/3">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Event Description</label>
                <div className="relative border-b border-slate-200 pb-1 flex items-center">
                  <select className="w-full text-[13px] font-semibold text-slate-700 bg-transparent outline-none cursor-pointer appearance-none">
                    <option>All</option>
                    <option>Account Inquiry</option>
                    <option>Acquirer Chargebacks</option>
                  </select>
                  <ChevronDown size={16} className="text-slate-400 absolute right-0 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Time View Picklist (Daily/Weekly/Monthly/Yearly) */}
            <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 shadow-inner">
              {['Daily', 'Weekly', 'Monthly', 'Yearly'].map(view => (
                <button 
                  key={view}
                  onClick={() => setChartFilters({...chartFilters, timeView: view})}
                  className={`px-5 py-1.5 text-[13px] font-bold rounded-lg transition-all ${chartFilters.timeView === view ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  {view}
                </button>
              ))}
            </div>
          </div>

          {/* SECTION 2: GRAFIK COMPOSED CHART */}
          <div className="w-full bg-white p-6 rounded-2xl shadow-sm border border-slate-200/60 h-[380px] mb-8">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 20, right: 0, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                
                <XAxis 
                  dataKey="dateLabel" axisLine={{stroke: '#cbd5e1'}} tickLine={false} 
                  tick={{fontSize: 11, fill: '#64748b', fontWeight: 500}} dy={10} 
                  angle={isDaily ? -35 : 0} textAnchor={isDaily ? "end" : "center"}
                  minTickGap={-5} // Membantu merapatkan label X-axis jika Daily
                />
                <YAxis 
                  yAxisId="left" axisLine={false} tickLine={false} 
                  tickFormatter={(t) => formatCurrency(t)} tick={{fontSize: 11, fill: '#94a3b8', fontWeight: 500}} 
                  label={{ value: 'Amount', angle: -90, position: 'insideLeft', fill: '#475569', fontWeight: 700, fontSize: 13, dy: -50 }}
                />
                <YAxis 
                  yAxisId="right" orientation="right" axisLine={false} tickLine={false} 
                  tickFormatter={(t) => formatBilling(t)} tick={{fontSize: 11, fill: '#94a3b8', fontWeight: 500}} 
                  label={{ value: '#Billing', angle: -90, position: 'insideRight', fill: '#475569', fontWeight: 700, fontSize: 13, dy: -50 }}
                />
                
                <Tooltip 
                  cursor={{fill: '#f8fafc'}}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontWeight: 500 }}
                  formatter={(value, name) => [name === 'Amount' ? formatCurrency(value) : formatBilling(value), name]}
                />
                
                <Legend verticalAlign="top" align="center" wrapperStyle={{ paddingBottom: '25px', fontSize: '13px', fontWeight: 600, color: '#334155' }} />

                {/* BAR: Jika Daily, ukuran bar dikecilkan (barSize={12}) agar rapat & tidak berantakan */}
                <Bar yAxisId="left" dataKey="amount" name="Amount" fill="#3b82f6" barSize={isDaily ? 12 : 36} radius={[4, 4, 0, 0]}>
                  {/* Sembunyikan label di atas bar jika Daily agar tidak tumpang tindih */}
                  {!isDaily && (
                    <LabelList dataKey="amount" position="top" formatter={(val) => formatCurrency(val)} style={{ fill: '#64748b', fontSize: '11px', fontWeight: 600 }} dy={-5} />
                  )}
                </Bar>

                <Line yAxisId="right" type="monotone" dataKey="billing" name="#Billing" stroke="#1e3a8a" strokeWidth={3} dot={{r: isDaily ? 2 : 4, fill: '#1e3a8a'}}>
                  {!isDaily && (
                    <LabelList dataKey="billing" position="bottom" formatter={(val) => formatBilling(val)} style={{ fill: '#64748b', fontSize: '11px', fontWeight: 600 }} dy={5} />
                  )}
                </Line>
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* SECTION 3: TRANSACTION CONFIGURATION TABLE (SESUAI SCREENSHOT) */}
          <div className="w-full bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden">
            
            {/* Table Header & Filters */}
            <div className="flex justify-between items-center px-6 py-6 border-b border-slate-100">
              <div>
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">Transaction Configuration</h2>
                <p className="text-[13px] text-slate-500 font-medium mt-1">Manage and classify billing accounts, group methods, and card issuers.</p>
              </div>

              {/* Table Filter Pills */}
              <div className="flex items-center gap-2">
                {['Group Mandiri', 'Klasifikasi', 'Principal', 'Type', 'Status'].map(filterName => (
                  <button key={filterName} className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 rounded-lg text-[12px] font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
                    <Settings2 size={13} className="text-slate-400" />
                    {filterName}
                  </button>
                ))}
                <button className="flex items-center gap-1.5 px-5 py-1.5 bg-[#111827] hover:bg-black text-white rounded-lg text-[12px] font-bold shadow-sm transition-all ml-1">
                  <Filter size={13} />
                  Apply
                </button>
              </div>
            </div>

            {/* Table Content */}
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
                  {TABLE_DB.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/60 transition-colors group">
                      <td className="py-4 px-6 text-[13px] font-bold text-slate-800">{row.id}</td>
                      <td className={`py-4 px-6 text-[13px] font-bold ${row.group === 'Issuer Debit' ? 'text-blue-600' : 'text-slate-600'}`}>{row.group}</td>
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
                  ))}
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