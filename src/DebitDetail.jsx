import React, { useState, useEffect } from 'react';
import { ComposedChart, Line, Bar, XAxis, YAxis, ResponsiveContainer, LabelList, Tooltip, PieChart, Pie, Cell } from 'recharts';
import { Settings2, Calendar as CalendarIcon, FileText, CheckSquare, Filter, ArrowLeft, MoreVertical } from 'lucide-react';

const FILTER_OPTIONS = {
  group: ['All', 'Issuer Kredit', 'Issuer Debit', 'Acq ADC', 'Acq ATM', 'Acq Both', 'Issuer Both', 'Both'],
  klasifikasi: ['All', 'Internasional', 'Transaction Service', 'Lokal Service'],
  principal: ['All', 'Visa', 'Master Card', 'JCB', 'Lokal'],
  type: ['All', 'Monthly', 'Quarterly', 'Interchange', 'Daily', 'MTI']
};

const generateDummyTransactions = () => {
  const data = [];
  for (let i = 0; i < 50; i++) {
    data.push({
      id: `2ZN${Math.floor(Math.random() * 90000) + 10000}K`,
      group: FILTER_OPTIONS.group[Math.floor(Math.random() * 7) + 1],
      desc: '-', periode: '-',
      klasifikasi: FILTER_OPTIONS.klasifikasi[Math.floor(Math.random() * 3) + 1],
      type: FILTER_OPTIONS.type[Math.floor(Math.random() * 5) + 1].toUpperCase(),
      principal: FILTER_OPTIONS.principal[Math.floor(Math.random() * 4) + 1],
      status: '-'
    });
  }
  return data;
};

const initialChart = [
  { name: 'Q1', volume: 6.9, serviceFee: 117.0, costToVol: 1.7 },
  { name: 'Q2', volume: 6.6, serviceFee: 117.0, costToVol: 1.9 },
  { name: 'Q3', volume: 6.5, serviceFee: 111.3, costToVol: 1.7 },
  { name: 'Q4', volume: 7.0, serviceFee: 117.8, costToVol: 1.5 },
  { name: 'Q5', volume: 6.8, serviceFee: 105.5, costToVol: 1.5 },
  { name: 'Q6', volume: 6.1, serviceFee: 112.2, costToVol: 1.8 },
];

const initialDonut = [
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
  <div className="flex flex-col items-center justify-end gap-1.5 cursor-default">
    {isBar ? <div className="w-8 h-3 mt-0.5 rounded-sm" style={{ backgroundColor: color }}></div> : <div className="flex items-center justify-center w-10 h-5 relative"><div className="absolute w-full h-[2px]" style={{ backgroundColor: color }}></div><div className="absolute w-2 h-2 rounded-full ring-2 ring-white" style={{ backgroundColor: color }}></div></div>}
    <span className="text-[9px] font-semibold text-gray-500 uppercase tracking-wider">{label}</span>
  </div>
);

export default function DebitDetail({ onBack }) {
  const [chartData, setChartData] = useState(initialChart);
  const [donutData, setDonutData] = useState(initialDonut);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [allTransactions, setAllTransactions] = useState([]);
  const [displayedTransactions, setDisplayedTransactions] = useState([]);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [filters, setFilters] = useState({ group: 'All', klasifikasi: 'All', principal: 'All', type: 'All' });

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
    setDisplayedTransactions(filtered);
    closeDropdowns();
  };

  const handleChartSubmit = () => {
    if(!startDate || !endDate) return alert("Pilih Start Date dan End Date!");
    setChartData(chartData.map(item => ({ ...item, volume: +(Math.random() * 3 + 4).toFixed(1), serviceFee: +(Math.random() * 30 + 95).toFixed(1), costToVol: +(Math.random() * 0.5 + 1.4).toFixed(1) })));
    setDonutData(initialDonut.map(item => ({ ...item, value: Math.floor(Math.random() * 300) + 150 })));
    const newData = generateDummyTransactions();
    setAllTransactions(newData);
    let filtered = [...newData];
    if (filters.group !== 'All') filtered = filtered.filter(t => t.group === filters.group);
    if (filters.type !== 'All') filtered = filtered.filter(t => t.type === filters.type.toUpperCase());
    setDisplayedTransactions(filtered);
  };

  const getBadgeStyle = (type) => {
    switch (type) {
      case 'MONTHLY': return 'bg-blue-50 text-blue-600';
      case 'QUARTERLY': return 'bg-purple-50 text-purple-600';
      case 'DAILY': return 'bg-emerald-50 text-emerald-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  return (
    <div className="flex-1 ml-[88px] p-8 overflow-y-auto h-full scroll-smooth relative">
      {activeDropdown && <div className="fixed inset-0 z-40" onClick={closeDropdowns}></div>}
      <div className="flex justify-between items-start mb-8">
        <div>
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="p-1.5 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"><ArrowLeft className="w-5 h-5 text-gray-700" /></button>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Detail Transaksi - DEBIT</h1>
          </div>
          <p className="text-sm text-gray-500 mt-1 max-w-4xl font-medium">Trend biaya transaksi principal khusus kartu Debit Q1 - Q6.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3"><div className="w-8 h-5 bg-gradient-to-br from-[#f97316] to-[#ea580c] rounded flex items-center justify-center relative overflow-hidden"><div className="w-1.5 h-1.5 bg-yellow-300/90 rounded-full absolute left-1.5 top-1"></div></div><h3 className="font-bold text-xl italic tracking-tight text-gray-900">DEBIT</h3></div>
            <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Trend Analysis Q1 - Q6</span>
          </div>
          <div className="flex justify-around items-end mb-6 px-1 min-h-[40px]">
            <ChartLegend color="#3b82f6" label="Service fee" /><ChartLegend color="#cbd5e1" label="Cost To Vol" /><ChartLegend color="#3b82f6" label="Volume" isBar={true} />
          </div>
          <div className="h-64 w-full text-xs font-semibold mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 25, right: 15, left: 15, bottom: 0 }}>
                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
                <YAxis yAxisId="vol" hide={true} domain={[0, dataMax => Math.max(dataMax * 5.0, 10)]} /> 
                <YAxis yAxisId="ctv" hide={true} domain={[0, dataMax => Math.max(dataMax * 3.5, 5)]} />
                <YAxis yAxisId="sf"  hide={true} domain={[0, dataMax => Math.max(dataMax * 1.3, 100)]} /> 
                <XAxis dataKey="name" axisLine={{ stroke: '#e2e8f0', strokeWidth: 1.5 }} tickLine={false} tick={{ dy: 10, fill: '#64748b', fontSize: 11, fontWeight: 600 }} />
                <Bar yAxisId="vol" dataKey="volume" fill="#38bdf8" barSize={40} radius={[3, 3, 0, 0]} animationDuration={1000}><LabelList dataKey="volume" position="insideBottom" fill="#ffffff" formatter={(val) => `${val} T`} offset={10} fontSize={11} /></Bar>
                <Line yAxisId="ctv" type="linear" dataKey="costToVol" stroke="#cbd5e1" strokeWidth={2.5} dot={{ r: 4.5, fill: '#ffffff', stroke: '#94a3b8', strokeWidth: 2 }} animationDuration={1000}><LabelList dataKey="costToVol" position="top" fill="#64748b" formatter={(val) => `${val}%`} offset={10} fontSize={11} /></Line>
                <Line yAxisId="sf" type="linear" dataKey="serviceFee" stroke="#3b82f6" strokeWidth={2.5} dot={{ r: 4.5, fill: '#ffffff', stroke: '#3b82f6', strokeWidth: 2 }} animationDuration={1000}><LabelList dataKey="serviceFee" position="top" fill="#1e293b" formatter={(val) => `${val} M`} offset={10} fontSize={11} /></Line>
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
          <div className="bg-[#1e293b] p-4 text-center text-white"><h2 className="font-semibold text-sm tracking-wide">Universe Biaya Principal</h2></div>
          <div className="p-5 flex flex-col items-center flex-1">
            <div className="flex flex-col gap-2 text-[10px] font-semibold text-gray-700 w-full mb-4">
              {donutData.map((item) => (<div key={item.name} className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }}></div><span>{item.name}</span></div>))}
            </div>
            <div className="h-36 w-full relative mb-6">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart><Tooltip content={<CustomTooltip />} /><Pie data={donutData} innerRadius={45} outerRadius={60} paddingAngle={2} dataKey="value" stroke="none">{donutData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}</Pie></PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"><span className="text-[9px] font-semibold text-gray-400 tracking-wider">TOTAL</span><span className="font-bold text-lg text-gray-900">Rp 1,879 M</span></div>
            </div>
            <div className="w-full mt-auto">
              <div className="flex gap-2 mb-4">
                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="flex-1 border p-2 text-xs rounded-lg text-gray-600" />
                <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="flex-1 border p-2 text-xs rounded-lg text-gray-600" />
              </div>
              <button onClick={handleChartSubmit} className="w-full bg-[#6b7280] hover:bg-[#4b5563] text-white py-2.5 rounded-lg font-semibold text-xs shadow-sm">Submit</button>
            </div>
          </div>
        </div>
      </div>

      {/* TABEL TRANSAKSI */}
      <div className="bg-white rounded-2xl shadow-sm p-7 border border-gray-100 flex flex-col mb-8">
        <div className="flex justify-between items-center mb-6">
          <div><h2 className="text-lg font-bold text-gray-900">Transaction Configuration</h2></div>
          <div className="flex items-center gap-2 relative z-50">
            {[{ key: 'group', label: 'Group Mandiri' }, { key: 'type', label: 'Type' }].map((f) => (
              <div key={f.key} className="relative">
                <button onClick={() => setActiveDropdown(activeDropdown === f.key ? null : f.key)} className="flex items-center gap-1.5 px-3 py-1.5 border rounded-lg text-xs font-semibold bg-white text-gray-600 hover:bg-gray-50"><Settings2 className="w-3.5 h-3.5" /> {filters[f.key] === 'All' ? f.label : filters[f.key]}</button>
                {activeDropdown === f.key && (
                  <div className="absolute right-0 top-full mt-2 w-48 bg-white border rounded-lg shadow-xl py-1 z-50">
                    {FILTER_OPTIONS[f.key].map(opt => (
                      <div key={opt} onClick={() => { setFilters({...filters, [f.key]: opt}); closeDropdowns(); }} className="px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 cursor-pointer">{opt}</div>
                    ))}
                  </div>
                )}
              </div>
            ))}
            <button onClick={handleTableSubmit} className="flex items-center gap-1.5 px-4 py-1.5 bg-gray-900 text-white rounded-lg text-xs font-bold hover:bg-gray-800"><Filter className="w-3.5 h-3.5" /> Apply</button>
          </div>
        </div>
        <div className="overflow-y-auto max-h-[420px] rounded-xl border border-gray-100 custom-scrollbar relative">
          <table className="w-full text-left text-gray-600">
            <thead className="text-[10px] font-bold text-gray-500 uppercase bg-gray-50 sticky top-0 z-10">
              <tr><th className="px-5 py-3.5">ID BILLING</th><th className="px-5 py-3.5">GROUP MANDIRI</th><th className="px-5 py-3.5">TYPE</th><th className="px-5 py-3.5">PRINCIPAL</th></tr>
            </thead>
            <tbody className="text-[13px]">
              {displayedTransactions.map((row, index) => (
                <tr key={index} className="border-b hover:bg-gray-50">
                  <td className="px-5 py-4 font-bold text-gray-900">{row.id}</td>
                  <td className="px-5 py-4 font-semibold text-blue-600">{row.group}</td>
                  <td className="px-5 py-4"><span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase ${getBadgeStyle(row.type)}`}>{row.type}</span></td>
                  <td className="px-5 py-4 font-bold">{row.principal}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}