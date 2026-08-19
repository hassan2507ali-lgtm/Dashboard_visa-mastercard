import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Menu, CreditCard, Book, ShoppingCart, FileText, 
  Calendar as CalendarIcon, User, ChevronUp, ChevronDown, LogOut, Filter, 
  BarChart2, Clock, CheckCircle2, AlertTriangle, AlertCircle, Settings, X,
  ArrowRight
} from 'lucide-react';
import { 
  ComposedChart, LineChart, Line, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, BarChart 
} from 'recharts';

// ==========================================
// 1. GENERATE DUMMY DATABASE MASIF (2024 - 2026)
// ==========================================
const generateDummyData = () => {
  const data = [];
  let currentDate = new Date(2024, 0, 1);
  const endDate = new Date(2026, 11, 31);
  
  let i = 0;
  while (currentDate <= endDate) {
    const numTrx = Math.floor(Math.random() * 3) + 1;
    
    for(let j=0; j < numTrx; j++) {
      const type = Math.random() > 0.45 ? 'Visa' : 'Mastercard';
      const productRand = Math.random();
      const product = productRand > 0.55 ? 'Credit' : (productRand > 0.2 ? 'Debit' : 'Prepaid');
      
      const statusRand = Math.random();
      let status = '';
      if (statusRand > 0.48) status = 'Done Rekon (No Deviasi)';
      else if (statusRand > 0.3) status = 'Done Rekon (Deviasi)';
      else if (statusRand > 0.1) status = 'Belum Rekon';
      else status = 'Fixed Rate';

      const dateString = `${currentDate.getFullYear()}-${String(currentDate.getMonth()+1).padStart(2,'0')}-${String(currentDate.getDate()).padStart(2,'0')}`;

      data.push({
        id: `TRX-${currentDate.getFullYear()}${String(currentDate.getMonth()+1).padStart(2,'0')}-${1000 + i}`,
        date: dateString,
        principal: type,
        product: product,
        status: status,
        salesVolume: Math.random() * 8 + 2, 
        principalCost: Number((Math.random() * 0.03 + 0.01).toFixed(3)), 
        costRate: Number((Math.random() * 0.01 + 0.035).toFixed(3)),
        merchant: `Merchant ${String.fromCharCode(65 + (i % 5))}`,
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
  const [filters, setFilters] = useState({
    startDate: '2026-01-01',
    endDate: '2026-12-31',
    type: 'monthly' 
  });
  
  const [appliedFilters, setAppliedFilters] = useState({ ...filters });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalData, setModalData] = useState([]);

  // --- STATE BARU UNTUK POP-UP PROFILE ---
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const [dashboardData, setDashboardData] = useState({
    summary: { sales: 0, cost: 0, rate: 0, recovery: 0 },
    chartData: [], 
    principalStats: { visa: {vol: 0, cost: 0, rate: 0, pct: 0}, mc: {vol: 0, cost: 0, rate: 0, pct: 0} },
    productStats: [{name: 'Credit', value: 0}, {name: 'Debit', value: 0}, {name: 'Prepaid', value: 0}],
    statusStats: []
  });

  // ==========================================
  // 3. LOGIKA FILTERING & AGREGASI DINAMIS
  // ==========================================
  useEffect(() => {
    const filteredDB = DUMMY_DB.filter(item => {
      const start = appliedFilters.startDate ? appliedFilters.startDate : '2000-01-01';
      const end = appliedFilters.endDate ? appliedFilters.endDate : '2100-01-01';
      return item.date >= start && item.date <= end;
    });

    if (filteredDB.length === 0) {
      setDashboardData({
        summary: { sales: 0, cost: 0, rate: 0, recovery: 0 },
        chartData: [],
        principalStats: { visa: {vol:0,cost:0,rate:0,pct:0}, mc: {vol:0,cost:0,rate:0,pct:0} },
        productStats: [],
        statusStats: []
      });
      return;
    }

    let totalSales = 0, totalCost = 0, totalRate = 0;
    let visaCost = 0, mcCost = 0, visaVol = 0, mcVol = 0;
    let credit = 0, debit = 0, prepaid = 0;
    const statusCount = { 'Done Rekon (No Deviasi)': 0, 'Done Rekon (Deviasi)': 0, 'Belum Rekon': 0, 'Fixed Rate': 0 };
    
    const chartMap = {};

    filteredDB.forEach(item => {
      totalSales += item.salesVolume;
      totalCost += item.principalCost;
      totalRate += item.costRate;

      if (item.principal === 'Visa') { visaCost += item.principalCost; visaVol += item.salesVolume; }
      else { mcCost += item.principalCost; mcVol += item.salesVolume; }

      if (item.product === 'Credit') credit += item.principalCost;
      else if (item.product === 'Debit') debit += item.principalCost;
      else if (item.product === 'Prepaid') prepaid += item.principalCost;

      statusCount[item.status] = (statusCount[item.status] || 0) + 1;

      const d = new Date(item.date);
      let groupKey = '';
      let displayLabel = '';

      if (appliedFilters.type === 'daily') {
        groupKey = item.date; 
        displayLabel = d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }); 
      } else if (appliedFilters.type === 'yearly') {
        groupKey = d.getFullYear().toString(); 
        displayLabel = groupKey;
      } else {
        groupKey = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`; 
        displayLabel = d.toLocaleDateString('id-ID', { month: 'short', year: '2-digit' }); 
      }

      if (!chartMap[groupKey]) {
        chartMap[groupKey] = { label: displayLabel, salesVolume: 0, principalCost: 0, totalRate: 0, count: 0 };
      }
      chartMap[groupKey].salesVolume += item.salesVolume;
      chartMap[groupKey].principalCost += item.principalCost;
      chartMap[groupKey].totalRate += item.costRate;
      chartMap[groupKey].count += 1;
    });

    const avgRate = (totalRate / filteredDB.length).toFixed(3);
    const totalStatus = Object.values(statusCount).reduce((a,b)=>a+b, 0);

    const newChartData = Object.keys(chartMap).sort().map(key => ({
      name: chartMap[key].label,
      salesVolume: Number(chartMap[key].salesVolume.toFixed(0)),
      principalCost: Number(chartMap[key].principalCost.toFixed(2)),
      costRate: Number((chartMap[key].totalRate / chartMap[key].count).toFixed(3))
    }));

    setDashboardData({
      summary: {
        sales: totalSales.toFixed(0),
        cost: totalCost.toFixed(2),
        rate: avgRate,
        recovery: (totalCost * 0.15 * 1000).toFixed(0) 
      },
      chartData: newChartData,
      principalStats: {
        visa: { cost: visaCost.toFixed(2), rate: (visaCost/visaVol || 0).toFixed(3), pct: Math.round((visaCost/totalCost)*100) || 0 },
        mc: { cost: mcCost.toFixed(2), rate: (mcCost/mcVol || 0).toFixed(3), pct: Math.round((mcCost/totalCost)*100) || 0 }
      },
      productStats: [
        {name: 'Credit', value: Number(credit.toFixed(2))},
        {name: 'Debit', value: Number(debit.toFixed(2))},
        {name: 'Prepaid', value: Number(prepaid.toFixed(2))}
      ].sort((a,b) => b.value - a.value),
      statusStats: [
        { label: 'Done Rekon (No Deviasi)', val: Math.round((statusCount['Done Rekon (No Deviasi)']/totalStatus)*100) || 0, color: 'bg-emerald-500', icon: CheckCircle2, iconColor: 'text-emerald-500' },
        { label: 'Done Rekon (Deviasi)', val: Math.round((statusCount['Done Rekon (Deviasi)']/totalStatus)*100) || 0, color: 'bg-amber-400', icon: AlertTriangle, iconColor: 'text-amber-500' },
        { label: 'Belum Rekon', val: Math.round((statusCount['Belum Rekon']/totalStatus)*100) || 0, color: 'bg-rose-500', icon: AlertCircle, iconColor: 'text-rose-500' },
        { label: 'Fixed Rate', val: Math.round((statusCount['Fixed Rate']/totalStatus)*100) || 0, color: 'bg-slate-400', icon: Settings, iconColor: 'text-slate-500' }
      ]
    });

  }, [appliedFilters]);

  // ==========================================
  // 4. HANDLERS
  // ==========================================
  const handleApply = () => setAppliedFilters({ ...filters });
  const handleLogout = () => alert("Logout berhasil!");

  const handleViewDetail = () => {
    navigate('/detail-cost');
  };

  const openRekonDetail = (statusLabel) => {
    const detailData = DUMMY_DB.filter(item => {
       const start = appliedFilters.startDate ? appliedFilters.startDate : '2000-01-01';
       const end = appliedFilters.endDate ? appliedFilters.endDate : '2100-01-01';
       return item.status === statusLabel && (item.date >= start && item.date <= end);
    });
    setModalTitle(`Detail Data: ${statusLabel} (${detailData.length} TRX)`);
    setModalData(detailData.slice(0, 50)); 
    setIsModalOpen(true);
  };

  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * Math.PI / 180);
    const y = cy + radius * Math.sin(-midAngle * Math.PI / 180);
    if(percent === 0) return null;
    return (
      <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={13} fontWeight="600" style={{ pointerEvents: 'none' }}>
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  const customTooltipStyle = {
    backgroundColor: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    fontSize: '13px',
    fontWeight: '500',
    color: '#334155'
  };

  const chartTimeLabel = appliedFilters.type === 'daily' ? 'Day' : appliedFilters.type === 'yearly' ? 'Year' : 'Month';

  // ==========================================
  // 5. RENDER UI
  // ==========================================
  return (
    <div className="flex h-screen bg-[#f8fafc] font-sans text-slate-800 overflow-hidden relative">
      
      {/* --- MODAL POPUP DETAIL TABEL --- */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 z-50 flex justify-center items-center backdrop-blur-[2px] p-4 transition-opacity">
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-200 border border-slate-100">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-white rounded-t-2xl">
              <h2 className="text-lg font-bold text-slate-800 tracking-tight">{modalTitle} {modalData.length === 50 && <span className="text-sm font-normal text-slate-400 ml-2">(Showing first 50)</span>}</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-700">
                <X size={20} strokeWidth={2} />
              </button>
            </div>
            <div className="overflow-auto rounded-b-2xl">
              {modalData.length > 0 ? (
                <table className="w-full text-left text-sm border-collapse">
                  <thead className="bg-slate-50 sticky top-0 z-10">
                    <tr>
                      <th className="p-4 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">ID Transaksi</th>
                      <th className="p-4 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">Tanggal</th>
                      <th className="p-4 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">Merchant</th>
                      <th className="p-4 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">Principal</th>
                      <th className="p-4 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">Product</th>
                      <th className="p-4 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Cost (Rp B)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {modalData.map((row, idx) => (
                      <tr key={idx} className="hover:bg-blue-50/40 transition-colors">
                        <td className="p-4 font-medium text-slate-700">{row.id}</td>
                        <td className="p-4 text-slate-600">{row.date}</td>
                        <td className="p-4 text-slate-600">{row.merchant}</td>
                        <td className="p-4 font-medium text-slate-800">{row.principal}</td>
                        <td className="p-4 text-slate-600">{row.product}</td>
                        <td className="p-4 text-right font-semibold text-slate-800">{row.principalCost}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                  <AlertCircle size={48} strokeWidth={1.5} className="mb-4 text-slate-300" />
                  <p className="text-sm font-medium">Tidak ada data untuk rentang waktu ini.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* --- SIDEBAR KIRI --- */}
      <aside className="w-[104px] flex flex-col justify-between items-center py-6 z-10 shrink-0 bg-[#f8fafc] border-r border-slate-200/60">
        <div className="bg-white rounded-[2.5rem] flex flex-col items-center py-8 px-4 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100">
          <button className="mb-8 text-slate-800 hover:text-blue-600 transition-colors">
            <Menu size={26} strokeWidth={1.5} />
          </button>
          <nav className="flex flex-col gap-8 items-center">
            <button className="text-blue-600 transition-colors" title="Dashboard"><CreditCard size={24} strokeWidth={1.5} /></button>
            <button className="text-slate-400 hover:text-blue-600 transition-colors" title="Transactions"><Book size={24} strokeWidth={1.5} /></button>
            <button className="text-slate-400 hover:text-blue-600 transition-colors" title="Store"><ShoppingCart size={24} strokeWidth={1.5} /></button>
            <button className="text-slate-400 hover:text-blue-600 transition-colors" title="Reports"><FileText size={24} strokeWidth={1.5} /></button>
            <button className="text-slate-400 hover:text-blue-600 transition-colors" title="Calendar"><CalendarIcon size={24} strokeWidth={1.5} /></button>
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
                  <p className="text-[14px] font-bold text-slate-800 leading-tight">Hassan Ali</p>
                  <p className="text-[12px] text-slate-500 font-medium">Administrator</p>
                </div>
              </div>
            )}
          </div>

          <button onClick={handleLogout} className="bg-white rounded-[1.25rem] w-14 h-14 flex items-center justify-center shadow-sm border border-slate-100 text-slate-600 hover:bg-rose-50 hover:border-rose-100 hover:text-rose-600 transition-colors" title="Logout">
            <LogOut size={22} strokeWidth={1.5} className="transform rotate-180" />
          </button>
        </div>
      </aside>

      {/* --- KONTEN DASBOR UTAMA --- */}
      <main className="flex-1 flex flex-col h-screen overflow-x-hidden overflow-y-auto px-4 py-8" onClick={() => setIsProfileOpen(false)}>
        
        {/* Header & Filter */}
        <header className="flex justify-between items-end mb-8 px-2">
          <div className="max-w-2xl">
            <h1 className="text-[28px] font-bold text-slate-900 tracking-tight mb-1.5">Trend Biaya Principal & Switcher</h1>
            <p className="text-sm text-slate-500 leading-relaxed font-medium">
              Peningkatan biaya transaksi principal & switcher seiring dengan pertumbuhan transaksi dan menunjukkan tren yang sehat.
            </p>
          </div>

          <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-2.5 px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl shadow-sm focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-all">
              <CalendarIcon size={18} strokeWidth={1.5} className="text-slate-400" />
              <input type="date" className="text-[13px] font-semibold text-slate-700 outline-none bg-transparent cursor-pointer" value={filters.startDate} onChange={(e) => setFilters({...filters, startDate: e.target.value})} />
            </div>
            <div className="flex items-center gap-2.5 px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl shadow-sm focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-all">
              <span className="text-[13px] font-semibold text-slate-400">-</span>
              <CalendarIcon size={18} strokeWidth={1.5} className="text-slate-400 ml-1" />
              <input type="date" className="text-[13px] font-semibold text-slate-700 outline-none bg-transparent cursor-pointer" value={filters.endDate} onChange={(e) => setFilters({...filters, endDate: e.target.value})} />
            </div>
            <div className="flex items-center gap-2.5 px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl shadow-sm relative focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-all">
              <Filter size={18} strokeWidth={1.5} className="text-slate-400" />
              <select className="text-[13px] font-semibold text-slate-700 outline-none bg-transparent cursor-pointer appearance-none pr-6 z-10" value={filters.type} onChange={(e) => setFilters({...filters, type: e.target.value})}>
                <option value="all">All Data</option>
                <option value="daily">Daily View</option>
                <option value="monthly">Monthly View</option>
                <option value="yearly">Yearly View</option>
              </select>
              <ChevronDown size={16} strokeWidth={1.5} className="text-slate-400 absolute right-3.5 pointer-events-none" />
            </div>
            <button onClick={handleApply} className="bg-slate-900 hover:bg-slate-800 text-white text-[13px] font-semibold px-6 py-2.5 rounded-xl transition-all active:scale-[0.97] shadow-sm flex items-center justify-center">
              Apply Filter
            </button>
          </div>
        </header>

        <div className="grid grid-cols-12 gap-5 px-2 pb-10">
          
          {/* --- BARIS 1: 4 KARTU SUMMARY --- */}
          {[
            { label: 'Sales Volume', value: `Rp ${dashboardData.summary.sales} T`, icon: BarChart2, trend: '▲ 12.4% YoY', tColor: 'text-emerald-600' },
            { label: 'Total Principal Cost', value: `Rp ${dashboardData.summary.cost} B`, icon: CreditCard, trend: '▲ 8.1% YoY', tColor: 'text-emerald-600' },
            { label: 'Cost Rate', value: `${dashboardData.summary.rate} bps`, icon: Clock, trend: '▼ -0.01 bps vs PY', tColor: 'text-rose-500' },
            { label: 'Potential Recovery', value: `Rp ${dashboardData.summary.recovery} M`, icon: null, trend: '▲ 18% vs Reconciled', tColor: 'text-emerald-600' }
          ].map((card, idx) => (
            <div key={idx} className="col-span-3 bg-white p-6 rounded-2xl shadow-sm border border-slate-200/60 relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-full h-[3px] bg-amber-400"></div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">{card.label}</p>
              <h2 className="text-[26px] font-bold text-slate-800 tracking-tight mb-2.5 flex items-center gap-3">
                {card.icon ? (
                  <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
                    <card.icon size={20} strokeWidth={1.5} />
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-full bg-blue-900 flex items-center justify-center text-white font-bold text-sm group-hover:scale-110 transition-transform">Rp</div>
                )}
                {card.value}
              </h2>
              <p className={`text-[13px] font-semibold ${card.tColor}`}>{card.trend}</p>
            </div>
          ))}

          {/* --- BARIS 2: 2 GRAFIK BESAR --- */}
          <div className="col-span-6 bg-white p-6 rounded-2xl shadow-sm border border-slate-200/60 flex flex-col h-[380px]">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-bold text-slate-800 tracking-tight text-lg">Sales Volume vs Principal Cost by {chartTimeLabel}</h3>
              <button 
                onClick={handleViewDetail}
                className="flex items-center gap-1.5 text-[14px] font-bold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-xl transition-colors group shadow-sm"
              >
                View Detail
                <ArrowRight size={16} strokeWidth={2.5} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
            
            <div className="flex-1 w-full mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={dashboardData.chartData} margin={{top: 20}}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b', fontWeight: 500}} dy={10} />
                  <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b', fontWeight: 500}} dx={-10} />
                  <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b', fontWeight: 500}} dx={10} />
                  <Tooltip contentStyle={customTooltipStyle} cursor={{fill: '#f8fafc'}} />
                  <Legend verticalAlign="top" align="center" iconType="circle" wrapperStyle={{ fontSize: '13px', fontWeight: 600, color: '#334155', paddingBottom: '25px' }} />
                  
                  <Bar yAxisId="left" dataKey="salesVolume" name="Sales Volume (Rp T)" fill="#2563eb" barSize={16} radius={[6, 6, 0, 0]} />
                  <Line yAxisId="right" type="monotone" dataKey="principalCost" name="Principal Cost (Rp B)" stroke="#f59e0b" strokeWidth={3} dot={{r: 5, strokeWidth: 2, fill: '#fff', stroke: '#f59e0b'}} activeDot={{r: 7, fill: '#f59e0b', stroke: '#fff'}} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          <div className="col-span-6 bg-white p-6 rounded-2xl shadow-sm border border-slate-200/60 flex flex-col h-[380px]">
            <h3 className="font-bold text-slate-800 tracking-tight text-lg mb-6 mt-1">Cost Rate (bps) by {chartTimeLabel}</h3>
            <div className="flex-1 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dashboardData.chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b', fontWeight: 500}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b', fontWeight: 500}} domain={['dataMin - 0.005', 'dataMax + 0.005']} dx={-10} />
                  <Tooltip contentStyle={customTooltipStyle} />
                  <Line type="monotone" dataKey="costRate" name="Cost Rate (bps)" stroke="#2563eb" strokeWidth={3} dot={{r: 5, strokeWidth: 2, fill: '#fff', stroke: '#2563eb'}} activeDot={{r: 7, fill: '#2563eb', stroke: '#fff'}} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* --- BARIS 3: 3 KARTU BAWAH --- */}
          <div className="col-span-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200/60 flex flex-col h-[320px]">
            <h3 className="font-bold text-slate-800 tracking-tight text-[15px] mb-4">Cost by Principal</h3>
            <div className="flex-1 flex items-center">
              <div className="w-[55%] h-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie 
                      data={[{ name: 'Visa', value: dashboardData.principalStats.visa.pct }, { name: 'Mastercard', value: dashboardData.principalStats.mc.pct }]} 
                      innerRadius="50%" outerRadius="90%" dataKey="value"
                      labelLine={false} label={renderCustomizedLabel} stroke="#ffffff" strokeWidth={3}
                    >
                      <Cell fill="#1e3a8a" />
                      <Cell fill="#3b82f6" />
                    </Pie>
                    <Tooltip contentStyle={customTooltipStyle} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="w-[45%] flex flex-col justify-center gap-5 pl-2">
                <div className="flex items-start gap-3">
                  <div className="w-3 h-3 rounded-full bg-[#1e3a8a] mt-1 shrink-0"></div>
                  <div>
                    <p className="text-slate-800 font-bold text-[13px]">Visa: {dashboardData.principalStats.visa.pct}%</p>
                    <p className="text-slate-500 font-medium text-[12px] mt-0.5 leading-snug">{dashboardData.principalStats.visa.cost} B <br/><span className="text-slate-400">({dashboardData.principalStats.visa.rate} bps)</span></p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-3 h-3 rounded-full bg-[#3b82f6] mt-1 shrink-0"></div>
                  <div>
                    <p className="text-slate-800 font-bold text-[13px]">Mastercard: {dashboardData.principalStats.mc.pct}%</p>
                    <p className="text-slate-500 font-medium text-[12px] mt-0.5 leading-snug">{dashboardData.principalStats.mc.cost} B <br/><span className="text-slate-400">({dashboardData.principalStats.mc.rate} bps)</span></p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-span-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200/60 flex flex-col h-[320px]">
            <h3 className="font-bold text-slate-800 tracking-tight text-[15px] mb-2 flex gap-1.5 items-center">
              Cost by Product <span className="text-[12px] text-slate-400 font-medium">(Rp B)</span>
            </h3>
            <div className="flex-1 w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dashboardData.productStats} layout="vertical" margin={{ top: 0, right: 35, left: -10, bottom: 0 }}>
                  <XAxis type="number" tick={{fontSize: 12, fill: '#94a3b8', fontWeight: 500}} axisLine={{stroke: '#e2e8f0'}} tickLine={false} />
                  <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} width={70} tick={{fontSize: 13, fill: '#475569', fontWeight: 600}} />
                  <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={customTooltipStyle} />
                  <Bar dataKey="value" fill="#2563eb" barSize={20} radius={[0, 4, 4, 0]} label={{ position: 'right', fill: '#475569', fontSize: 12, fontWeight: 700 }} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="col-span-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200/60 flex flex-col h-[320px]">
            <h3 className="font-bold text-slate-800 tracking-tight text-[15px] mb-6">Rekonsiliasi Status</h3>
            <div className="flex flex-col gap-4 flex-1 justify-center">
              {dashboardData.statusStats.map((stat, idx) => (
                <div 
                  key={idx} 
                  onClick={() => openRekonDetail(stat.label)}
                  className="flex items-center justify-between group cursor-pointer hover:bg-slate-50 p-2.5 -mx-2.5 rounded-xl transition-colors"
                >
                  <span className="flex items-center gap-3 text-slate-600 w-52 text-[13px] font-semibold">
                    <stat.icon size={18} strokeWidth={2} className={stat.iconColor} />
                    {stat.label}
                  </span>
                  <div className="flex-1 mx-3 h-2 bg-slate-100 rounded-full overflow-hidden flex">
                    <div className={`h-full ${stat.color} transition-all duration-700 ease-out`} style={{ width: `${stat.val}%` }}></div>
                  </div>
                  <span className={`font-bold text-[14px] w-9 text-right ${stat.iconColor}`}>{stat.val}%</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </main>
    </div>
  );
};

export default Dashboard;