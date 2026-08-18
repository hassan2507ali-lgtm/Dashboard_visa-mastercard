import React, { useState, useEffect } from 'react';
import { ComposedChart, Line, Bar, XAxis, YAxis, ResponsiveContainer, LabelList, Tooltip, PieChart, Pie, Cell } from 'recharts';
import { Settings2, ChevronDown, Calendar as CalendarIcon, User, LogOut, CreditCard, FileText, ShoppingCart, Calendar, LayoutDashboard, CheckSquare, Filter, ArrowLeft, MoreVertical } from 'lucide-react';

const FILTER_OPTIONS = {
  group: ['All', 'Issuer Kredit', 'Issuer Debit', 'Acq ADC', 'Acq ATM', 'Acq Both', 'Issuer Both', 'Both'],
  klasifikasi: ['All', 'Internasional', 'Transaction Service', 'Lokal Service'],
  principal: ['All', 'Visa', 'Master Card', 'JCB', 'Lokal'],
  type: ['All', 'Monthly', 'Quarterly', 'Interchange', 'Daily', 'MTI'],
  status: ['All', 'Progress', 'Complete', 'Failed']
};

const generateDummyTransactions = () => {
  const data = [];
  const statuses = ['Progress', 'Complete', 'Failed']; 
  for (let i = 0; i < 100; i++) {
    data.push({
      id: `2ZN${Math.floor(Math.random() * 90000) + 10000}K`,
      group: FILTER_OPTIONS.group[Math.floor(Math.random() * 7) + 1],
      desc: '-', periode: '-',
      klasifikasi: FILTER_OPTIONS.klasifikasi[Math.floor(Math.random() * 3) + 1],
      type: FILTER_OPTIONS.type[Math.floor(Math.random() * 5) + 1].toUpperCase(),
      principal: FILTER_OPTIONS.principal[Math.floor(Math.random() * 4) + 1],
      status: statuses[Math.floor(Math.random() * statuses.length)] 
    });
  }
  return data;
};

const initialDebitDetail = [
  { name: 'Q1', volume: 6.9, serviceFee: 117.0, costToVol: 1.7 },
  { name: 'Q2', volume: 6.6, serviceFee: 117.0, costToVol: 1.9 },
  { name: 'Q3', volume: 6.5, serviceFee: 111.3, costToVol: 1.7 },
  { name: 'Q4', volume: 7.0, serviceFee: 117.8, costToVol: 1.5 },
  { name: 'Q5', volume: 6.8, serviceFee: 105.5, costToVol: 1.5 },
  { name: 'Q6', volume: 6.1, serviceFee: 112.2, costToVol: 1.8 },
];

const initialDonutDebit = [
  { name: 'Master Card', value: 300, color: '#10b981' },
  { name: 'JCB & CUP', value: 200, color: '#3b82f6' },
];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/95 backdrop-blur-sm border border-gray-100 p-3 rounded-xl shadow-lg min-w-[150px] z-50 relative">
        <p className="font-bold text-gray-800 mb-2 pb-2 border-b border-gray-100">{label}</p>
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center justify-between gap-4 text-xs mb-1.5">
            <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }}></div><span className="text-gray-500 font-medium capitalize">{entry.name}</span></div>
            <span className="font-bold text-gray-900">{entry.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const ChartLegend = ({ color, label, isBar }) => (
  <div className="flex flex-col items-center justify-end gap-1.5 hover:opacity-80 transition-opacity cursor-default">
    {isBar ? <div className="w-8 h-3 mt-0.5 rounded-sm" style={{ backgroundColor: color }}></div> : <div className="flex items-center justify-center w-10 h-5 relative"><div className="absolute w-full h-[2px]" style={{ backgroundColor: color }}></div><div className="absolute w-2 h-2 rounded-full ring-2 ring-white" style={{ backgroundColor: color }}></div></div>}
    <span className="text-[9px] font-semibold text-gray-500 uppercase tracking-wider">{label}</span>
  </div>
);

export default function DebitDetail({ setCurrentPage }) {
  const [chartData, setChartData] = useState(initialDebitDetail);
  const [donutData, setDonutData] = useState(initialDonutDebit);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  const [allTransactions, setAllTransactions] = useState([]);
  const [displayedTransactions, setDisplayedTransactions] = useState([]);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [filters, setFilters] = useState({ group: 'All', klasifikasi: 'All', principal: 'All', type: 'All', status: 'All' });

  useEffect(() => {
    const data = generateDummyTransactions();
    setAllTransactions(data);
    setDisplayedTransactions(data);
  }, []);

  const closeDropdowns = () => setActiveDropdown(null);

  const handleTableSubmit = () => {
    let filtered = [...allTransactions];
    if (filters.group !== 'All') filtered = filtered.filter(t => t.group === filters.group);
    if (filters.klasifikasi !== 'All') filtered = filtered.filter(t => t.klasifikasi === filters.klasifikasi);
    if (filters.principal !== 'All') filtered = filtered.filter(t => t.principal === filters.principal);
    if (filters.type !== 'All') filtered = filtered.filter(t => t.type === filters.type.toUpperCase());
    if (filters.status !== 'All') filtered = filtered.filter(t => t.status === filters.status);
    setDisplayedTransactions(filtered);
    closeDropdowns();
  };

  const handleChartSubmit = () => {
    if(!startDate || !endDate) return alert("Pilih Start Date dan End Date dulu ya!");
    setChartData(chartData.map(item => ({ ...item, volume: +(Math.random() * 8 + 3).toFixed(1), serviceFee: +(Math.random() * 40 + 90).toFixed(1), costToVol: +(Math.random() * 0.8 + 1.2).toFixed(1) })));
    setDonutData(donutData.map(item => ({ ...item, value: Math.floor(Math.random() * 300) + 100 })));
    handleTableSubmit();
  };

  const getBadgeStyle = (type) => {
    switch (type) {
      case 'MONTHLY': return 'bg-blue-50 text-blue-600';
      case 'QUARTERLY': return 'bg-purple-50 text-purple-600';
      case 'DAILY': return 'bg-emerald-50 text-emerald-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const getStatusBadgeStyle = (status) => {
    switch (status) {
      case 'Complete': return 'text-emerald-600 bg-emerald-50 font-bold';
      case 'Progress': return 'text-yellow-600 bg-yellow-50 font-bold';
      case 'Failed': return 'text-red-600 bg-red-50 font-bold';
      default: return 'text-gray-500';
    }
  };

  const getSidebarItemStyle = (pageName) => pageName === 'debit-detail' ? "p-2.5 bg-slate-100 text-slate-800 rounded-xl cursor-pointer transition-all shadow-sm ring-1 ring-slate-200" : "p-2.5 text-gray-400 hover:text-gray-700 hover:bg-gray-50 rounded-xl cursor-pointer transition-all";

  return (
    <div className="flex h-screen bg-[#f4f7f9] font-sans overflow-hidden relative">
      {activeDropdown && <div className="fixed inset-0 z-40" onClick={closeDropdowns}></div>}

      <div className="w-[88px] fixed h-full flex flex-col items-center py-6 gap-6 bg-transparent z-10">
        <div className="bg-white p-3 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-3 items-center w-14">
          <div onClick={() => setCurrentPage('home')} className={getSidebarItemStyle('home')}><LayoutDashboard className="w-5 h-5" /></div>
          <div onClick={() => setCurrentPage('debit-detail')} className={getSidebarItemStyle('debit-detail')}><CreditCard className="w-5 h-5" /></div>
          <div onClick={() => setCurrentPage('credit-detail')} className={getSidebarItemStyle('credit-detail')}><FileText className="w-5 h-5" strokeWidth={2.5} /></div>
          <div onClick={() => setCurrentPage('acquiring-detail')} className={getSidebarItemStyle('acquiring-detail')}><ShoppingCart className="w-5 h-5" /></div>
          <div onClick={() => setCurrentPage('report')} className={getSidebarItemStyle('repot')}><Calendar className="w-5 h-5" /></div>
        </div>
        <div className="mt-auto bg-white p-3 rounded-2xl shadow-sm border border-gray-100 w-14 flex justify-center"><div className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl cursor-pointer"><LogOut className="w-5 h-5" /></div></div>
      </div>

      <div className="flex-1 ml-[88px] p-8 overflow-y-auto h-full scroll-smooth">
        <div className="flex justify-between items-start mb-8">
          <div>
            <div className="flex items-center gap-3">
              <button onClick={() => setCurrentPage('home')} className="p-1.5 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors shadow-sm cursor-pointer"><ArrowLeft className="w-5 h-5 text-gray-700" /></button>
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Detail Transaksi - DEBIT</h1>
            </div>
            <p className="text-sm text-gray-500 mt-1 max-w-4xl font-medium">Peningkatan biaya transaksi principal & switcher seiring dengan pertumbuhan transaksi dan menunjukan tren yang sehat.</p>
          </div>
          <div className="flex items-center gap-2.5 bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-100 hover:bg-gray-50 cursor-pointer"><div className="bg-blue-100 p-1.5 rounded-lg"><User className="w-4 h-4 text-blue-600" /></div><span className="text-[13px] font-semibold text-gray-700">Admin@gmail.com</span><ChevronDown className="w-3.5 h-3.5 text-gray-400 ml-1" /></div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3"><div className="w-8 h-5 bg-gradient-to-br from-[#f97316] to-[#ea580c] rounded flex items-center justify-center relative overflow-hidden"><div className="w-1.5 h-1.5 bg-yellow-300/90 rounded-full absolute left-1.5 top-1"></div></div><h3 className="font-bold text-xl italic tracking-tight text-gray-900">DEBIT</h3></div>
              <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Trend Analysis Q1 - Q6</span>
            </div>
            <div className="flex justify-around items-end mb-6 px-1 min-h-[40px]"><ChartLegend color="#3b82f6" label="Service fee" /><ChartLegend color="#cbd5e1" label="Cost To Vol" /><ChartLegend color="#3b82f6" label="Volume" isBar={true} /></div>
            <div className="h-64 w-full text-xs font-semibold mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData} margin={{ top: 25, right: 15, left: 15, bottom: 0 }}>
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
                  <YAxis yAxisId="vol" hide={true} domain={[0, dataMax => Math.max(dataMax * 6.0, 10)]} /> 
                  <YAxis yAxisId="ctv" hide={true} domain={[0, dataMax => Math.max(dataMax * 4.0, 5)]} />
                  <YAxis yAxisId="sf"  hide={true} domain={[0, dataMax => Math.max(dataMax * 1.3, 100)]} /> 
                  <XAxis dataKey="name" axisLine={{ stroke: '#e2e8f0', strokeWidth: 1.5 }} tickLine={false} tick={{ dy: 10, fill: '#64748b', fontSize: 11, fontWeight: 600 }} />
                  <Bar yAxisId="vol" dataKey="volume" name="Volume" fill="#38bdf8" barSize={40} radius={[3, 3, 0, 0]} animationDuration={1000}><LabelList dataKey="volume" position="insideTop" fill="#ffffff" formatter={(val) => `${val} T`} offset={10} fontSize={11} /></Bar>
                  <Line yAxisId="ctv" type="linear" dataKey="costToVol" name="Cost To Vol" stroke="#cbd5e1" strokeWidth={2.5} dot={{ r: 4.5, fill: '#ffffff', stroke: '#94a3b8', strokeWidth: 2 }} animationDuration={1000}><LabelList dataKey="costToVol" position="top" fill="#64748b" formatter={(val) => `${val}%`} offset={10} fontSize={11} /></Line>
                  <Line yAxisId="sf" type="linear" dataKey="serviceFee" name="Service Fee" stroke="#3b82f6" strokeWidth={2.5} dot={{ r: 4.5, fill: '#ffffff', stroke: '#3b82f6', strokeWidth: 2 }} animationDuration={1000}><LabelList dataKey="serviceFee" position="top" fill="#1e293b" formatter={(val) => `${val} M`} offset={10} fontSize={11} /></Line>
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="lg:col-span-1 bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col overflow-hidden">
            <div className="bg-[#2e5ea8] text-white text-center py-4 text-base font-bold tracking-wide shadow-inner">DEBIT 2026</div>
            <div className="p-6 flex flex-col justify-between flex-1 text-sm text-gray-700">
              <div className="border-b border-gray-200 pb-4 mb-4"><span className="text-[11px] text-gray-500 font-semibold block mb-1">Volume</span><span className="font-bold text-gray-900 text-[13px]">Rp 12.9 T (-4% YoY)</span></div>
              <div className="border-b border-gray-200 pb-4 mb-4"><span className="text-[11px] text-gray-500 font-semibold block mb-1">Cost</span><span className="font-bold text-gray-900 text-[13px]">Rp 217 M (-9% YoY)</span></div>
              <div><span className="text-[11px] text-gray-500 font-semibold block mb-1">Cost To Volume</span><span className="font-bold text-gray-900 text-[13px]">1.68% (-9 bps YoY)</span></div>
            </div>
          </div>

          <div className="lg:col-span-1 bg-white rounded-2xl shadow-sm overflow-hidden flex flex-col border border-gray-100">
            <div className="bg-[#1e293b] p-4 text-center text-white"><h2 className="font-semibold text-sm tracking-wide">Universe Biaya Principal</h2><p className="text-[11px] text-slate-300 mt-0.5 font-medium opacity-80">Januari - Desember 2026</p></div>
            <div className="p-5 flex flex-col items-center flex-1">
              <div className="flex flex-col gap-2 text-[10px] font-semibold text-gray-700 w-full mb-4">
                {donutData.map((item) => (<div key={item.name} className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: item.color }}></div><span>{item.name}</span></div>))}
              </div>
              <div className="h-36 w-full relative mb-6">
                <ResponsiveContainer width="100%" height="100%"><PieChart><Tooltip content={<CustomTooltip />} /><Pie data={donutData} innerRadius={45} outerRadius={60} paddingAngle={2} dataKey="value" stroke="none">{donutData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}</Pie></PieChart></ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"><span className="text-[9px] font-semibold text-gray-400 tracking-wider">TOTAL</span><span className="font-bold text-lg text-gray-900 leading-tight">Rp 1,879 M</span><span className="text-[9px] font-medium text-gray-400 mt-0.5">(+19% YoY)</span></div>
              </div>
              <div className="w-full mt-auto">
                <div className="flex gap-2 mb-4">
                  <div className="flex-1 relative overflow-hidden rounded-lg">
                    <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                    <div className="w-full border border-gray-200 bg-white p-2 flex items-center justify-center gap-2 shadow-sm"><CalendarIcon className="w-3.5 h-3.5 text-blue-500" /><span className={`text-[10px] xl:text-xs font-medium ${startDate ? 'text-gray-900' : 'text-gray-500'}`}>{startDate || "Start Date"}</span></div>
                  </div>
                  <div className="flex-1 relative overflow-hidden rounded-lg">
                    <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                    <div className="w-full border border-gray-200 bg-white p-2 flex items-center justify-center gap-2 shadow-sm"><CalendarIcon className="w-3.5 h-3.5 text-blue-500" /><span className={`text-[10px] xl:text-xs font-medium ${endDate ? 'text-gray-900' : 'text-gray-500'}`}>{endDate || "End Date"}</span></div>
                  </div>
                </div>
                <button onClick={handleChartSubmit} className="w-full bg-[#6b7280] hover:bg-[#4b5563] text-white py-2.5 rounded-lg font-semibold text-xs transition-all shadow-sm active:scale-[0.98]">Submit</button>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col xl:flex-row gap-6 mb-8">
          <div className={`flex-[1] bg-white rounded-2xl shadow-sm p-7 border border-gray-100 flex flex-col`}>
            <div className="flex justify-between items-center mb-6">
              <div><h2 className="text-lg font-bold tracking-tight text-gray-900">Transaction Configuration</h2><p className="text-xs text-gray-500 font-medium mt-0.5">Manage and classify billing accounts, group methods, and card issuers.</p></div>
              <div className="flex items-center gap-2 relative z-50">
                {[{ key: 'group', label: 'Group Mandiri' }, { key: 'klasifikasi', label: 'Klasifikasi' }, { key: 'principal', label: 'Principal' }, { key: 'type', label: 'Type' }, { key: 'status', label: 'Status' }].map((f) => (
                  <div key={f.key} className="relative">
                    <button onClick={() => setActiveDropdown(activeDropdown === f.key ? null : f.key)} className={`flex items-center gap-1.5 px-3 py-1.5 border rounded-lg text-xs font-semibold transition-all shadow-sm ${activeDropdown === f.key || filters[f.key] !== 'All' ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}><Settings2 className={`w-3.5 h-3.5 ${filters[f.key] !== 'All' ? 'text-blue-600' : 'text-gray-400'}`} /> {filters[f.key] === 'All' ? f.label : filters[f.key]}</button>
                    {activeDropdown === f.key && (
                      <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-xl py-1 z-50">
                        {FILTER_OPTIONS[f.key].map(opt => (
                          <div key={opt} onClick={() => { setFilters({...filters, [f.key]: opt}); closeDropdowns(); }} className="px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 cursor-pointer flex justify-between items-center"><span className={filters[f.key] === opt ? 'font-bold text-blue-600' : ''}>{opt}</span>{filters[f.key] === opt && <CheckSquare className="w-4 h-4 text-blue-600" />}</div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
                <div className="w-px h-6 bg-gray-200 mx-1"></div>
                <button onClick={handleTableSubmit} className="flex items-center gap-1.5 px-4 py-1.5 bg-gray-900 text-white border border-gray-900 rounded-lg text-xs font-bold hover:bg-gray-800 transition-all shadow-sm"><Filter className="w-3.5 h-3.5" /> Apply</button>
              </div>
            </div>

            <div className="overflow-y-auto max-h-[420px] rounded-xl border border-gray-100 custom-scrollbar relative">
              {displayedTransactions.length > 0 ? (
                <table className="w-full text-left text-gray-600">
                  <thead className="text-[10px] font-bold text-gray-500 uppercase bg-gray-50 border-b border-gray-100 tracking-wider sticky top-0 z-10 shadow-sm">
                    <tr><th className="px-5 py-3.5">ID BILLING</th><th className="px-5 py-3.5">GROUP MANDIRI</th><th className="px-5 py-3.5">DESKRIPSI</th><th className="px-5 py-3.5">PERIODE</th><th className="px-5 py-3.5">KLASIFIKASI</th><th className="px-5 py-3.5">TYPE</th><th className="px-5 py-3.5">PRINCIPAL</th><th className="px-5 py-3.5 text-center">STATUS REKON</th></tr>
                  </thead>
                  <tbody className="text-[13px]">
                    {displayedTransactions.map((row, index) => (
                      <tr key={index} className="border-b border-gray-50 hover:bg-blue-50/30 transition-colors">
                        <td className="px-5 py-4 font-bold text-gray-900">{row.id}</td><td className={`px-5 py-4 font-semibold ${row.group === 'Issuer Debit' ? 'text-blue-600' : 'text-gray-600'}`}>{row.group}</td><td className="px-5 py-4 text-gray-400">{row.desc}</td><td className="px-5 py-4 text-gray-400">{row.periode}</td><td className="px-5 py-4">{row.klasifikasi}</td><td className="px-5 py-4"><span className={`px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wide uppercase ${getBadgeStyle(row.type)}`}>{row.type}</span></td><td className="px-5 py-4 font-bold text-gray-900">{row.principal}</td><td className="px-5 py-4 text-center"><span className={`px-2.5 py-1 rounded-md text-[10px] uppercase tracking-wide ${getStatusBadgeStyle(row.status)}`}>{row.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (<div className="flex flex-col items-center justify-center h-48 text-gray-400 bg-gray-50/50"><FileText className="w-8 h-8 mb-2 opacity-50" /><p className="font-semibold text-xs">Oops, data tidak ditemukan. Coba filter lain.</p></div>)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}