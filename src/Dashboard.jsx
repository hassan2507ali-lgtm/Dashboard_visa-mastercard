import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Menu, CreditCard, Book, ShoppingCart, FileText, 
  Calendar as CalendarIcon, User, ChevronUp, ChevronDown, LogOut, Filter, 
  BarChart2, Clock, CheckCircle2, AlertTriangle, AlertCircle, Settings, X,
  ArrowRight,
  CardSim
} from 'lucide-react';
import { 
  ComposedChart, LineChart, Line, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, BarChart 
} from 'recharts';

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

const Dashboard = () => {
  const navigate = useNavigate();

  // ==========================================
  // 2. STATE MANAGEMENT 
  // ==========================================
  const [filters, setFilters] = useState({ principal: 'All' });
  const [appliedFilters, setAppliedFilters] = useState({ ...filters });

  const [salesChartFilters, setSalesChartFilters] = useState({ issuing: 'All' });
  const [incomeChartFilters, setIncomeChartFilters] = useState({ issuing: 'All' });
  const [costChartFilters, setCostChartFilters] = useState({ issuing: 'All' });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalData, setModalData] = useState([]);
  
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const [dashboardData, setDashboardData] = useState({
    summary: { sales: 0, cost: 0, rate: 0 },
    salesChartData: [], 
    incomeChartData: [],
    costChartData: [], 
    defaultChartData: [],
    principalStats: { 
      visa: {vol: 0, cost: 0, rate: 0, pct: 0}, 
      mc: {vol: 0, cost: 0, rate: 0, pct: 0}, 
      others: {vol: 0, cost: 0, rate: 0, pct: 0} 
    },
    groupStats: [],
    statusStats: []
  });

  // ==========================================
  // 3. LOGIKA FILTERING & AGREGASI
  // ==========================================
  useEffect(() => {
    const globalFilteredDB = DUMMY_DB.filter(item => {
      return appliedFilters.principal === 'All' || item.principal === appliedFilters.principal;
    });

    if (globalFilteredDB.length === 0) {
      setDashboardData({
        summary: { sales: 0, cost: 0, rate: 0 },
        salesChartData: [], incomeChartData: [], costChartData: [], defaultChartData: [],
        principalStats: { visa: {vol:0,cost:0,rate:0,pct:0}, mc: {vol:0,cost:0,rate:0,pct:0}, others: {vol:0,cost:0,rate:0,pct:0} },
        groupStats: [], statusStats: []
      });
      return;
    }

    let totalSales = 0, totalCost = 0, totalRate = 0;
    let visaCost = 0, mcCost = 0, othersCost = 0, visaVol = 0, mcVol = 0, othersVol = 0;
    let creditService = 0, debitService = 0, acqInterchange = 0, acqService = 0;
    
    const statusCount = { 'Done Rekon (No Deviasi)': 0, 'Done Rekon (Deviasi)': 0, 'Belum Rekon': 0, 'Fixed Rate': 0, 'New Billing': 0 };

    globalFilteredDB.forEach(item => {
      totalSales += item.salesVolume; totalCost += item.principalCost; totalRate += item.costRate;
      
      if (item.principal === 'Visa') { visaCost += item.principalCost; visaVol += item.salesVolume; } 
      else if (item.principal === 'Mastercard') { mcCost += item.principalCost; mcVol += item.salesVolume; }
      else { othersCost += item.principalCost; othersVol += item.salesVolume; }
      
      if (item.group === 'Credit Card') creditService += item.principalCost; 
      else if (item.group === 'Debit Card') debitService += item.principalCost; 
      else if (item.group === 'Acquiring') {
        if (item.subGroup === 'Interchange') acqInterchange += item.principalCost;
        else if (item.subGroup === 'Service') acqService += item.principalCost;
      }
      
      statusCount[item.status] = (statusCount[item.status] || 0) + 1;
    });

    // Fungsi Helper untuk menarik data spesifik per Chart
    const getChartData = (baseDB, chartFilterConfig) => {
      const chartFilteredDB = baseDB.filter(item => {
        if (chartFilterConfig.issuing === 'All') return true;
        if (chartFilterConfig.issuing === 'Acquiring') return item.group === 'Acquiring';
        if (chartFilterConfig.issuing === 'Issuing Debit') return item.group === 'Debit Card';
        if (chartFilterConfig.issuing === 'Issuing Credit') return item.group === 'Credit Card';
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
            label: displayLabel, salesVolume: 0, principalCost: 0, totalRate: 0, count: 0, sortKey: groupKey,
            interchangeFee: 0, serviceFee: 0,
            incomeVisa: 0, incomeMC: 0, 
            costVisa: 0, costMC: 0, costJCB: 0, costCUP: 0, costLocal: 0 
          };
        }
        
        chartMap[groupKey].salesVolume += item.salesVolume; 
        chartMap[groupKey].principalCost += item.principalCost; 
        chartMap[groupKey].totalRate += item.costRate; 
        chartMap[groupKey].count += 1;

        // Base Distribution
        let iCost = 0; let sCost = 0;
        if (item.subGroup === 'Interchange') { iCost = item.principalCost; } 
        else if (item.subGroup === 'Service') { sCost = item.principalCost; } 
        else { iCost = item.principalCost * 0.7; sCost = item.principalCost * 0.3; }
        
        chartMap[groupKey].interchangeFee += iCost;
        chartMap[groupKey].serviceFee += sCost;

        // DISTRIBUSI LINE DINAMIS (Dirapikan agar tidak tumpang tindih / nabrak)
        const pCost = item.principalCost;
        const pInc = item.principalCost * 1.2; 

        if (item.principal === 'Visa') {
            chartMap[groupKey].costVisa += pCost * 2.8;   // Tertinggi
            chartMap[groupKey].incomeVisa += pInc * 2.0; 
        } else if (item.principal === 'Mastercard') {
            chartMap[groupKey].costMC += pCost * 1.8;     // Menengah atas
            chartMap[groupKey].incomeMC += pInc * 1.0; 
        } else if (item.principal === 'JCB') {
            chartMap[groupKey].costJCB += pCost * 1.1;    // Tengah
        } else if (item.principal === 'CUP') {
            chartMap[groupKey].costCUP += pCost * 0.2;    // Paling Bawah
        } else {
            chartMap[groupKey].costLocal += pCost * 0.6;  // Menengah Bawah
        }
      });

      return Object.values(chartMap).sort((a, b) => a.sortKey.localeCompare(b.sortKey)).map(data => ({
        name: data.label,
        salesVolume: Number(data.salesVolume.toFixed(0)),
        principalCost: Number(data.principalCost.toFixed(2)),
        costRate: Number((data.totalRate / data.count).toFixed(3)),
        interchangeFee: Number(data.interchangeFee.toFixed(2)),
        serviceFee: Number(data.serviceFee.toFixed(2)),
        incomeVisa: Number(data.incomeVisa.toFixed(2)),
        incomeMC: Number(data.incomeMC.toFixed(2)),
        costVisa: Number(data.costVisa.toFixed(2)),
        costMC: Number(data.costMC.toFixed(2)),
        costJCB: Number(data.costJCB.toFixed(2)),
        costCUP: Number(data.costCUP.toFixed(2)),
        costLocal: Number(data.costLocal.toFixed(2))
      }));
    };

    const avgRate = (totalRate / globalFilteredDB.length).toFixed(3);
    const totalStatus = Object.values(statusCount).reduce((a,b)=>a+b, 0);

    setDashboardData({
      summary: { sales: totalSales.toFixed(0), cost: totalCost.toFixed(2), rate: avgRate },
      salesChartData: getChartData(globalFilteredDB, salesChartFilters),
      incomeChartData: getChartData(globalFilteredDB, incomeChartFilters),
      costChartData: getChartData(globalFilteredDB, costChartFilters),
      defaultChartData: getChartData(globalFilteredDB, { issuing: 'All' }),
      principalStats: {
        visa: { cost: visaCost.toFixed(2), rate: (visaCost/visaVol || 0).toFixed(3), pct: Math.round((visaCost/totalCost)*100) || 0 },
        mc: { cost: mcCost.toFixed(2), rate: (mcCost/mcVol || 0).toFixed(3), pct: Math.round((mcCost/totalCost)*100) || 0 },
        others: { cost: othersCost.toFixed(2), rate: (othersCost/othersVol || 0).toFixed(3), pct: Math.round((othersCost/totalCost)*100) || 0 }
      },
      groupStats: [
        { name: 'Credit Card', interchange: 0, service: Number(creditService.toFixed(2)), totalSort: Number(creditService.toFixed(2)) }, 
        { name: 'Debit Card', interchange: 0, service: Number(debitService.toFixed(2)), totalSort: Number(debitService.toFixed(2)) }, 
        { name: 'Acquiring', interchange: Number(acqInterchange.toFixed(2)), service: Number(acqService.toFixed(2)), totalSort: Number((acqInterchange + acqService).toFixed(2)) }
      ].sort((a,b) => b.totalSort - a.totalSort),
      statusStats: [
        { label: 'Done Rekon (No Deviasi)', val: Math.round((statusCount['Done Rekon (No Deviasi)']/totalStatus)*100) || 0, color: 'bg-emerald-500', icon: CheckCircle2, iconColor: 'text-emerald-500' },
        { label: 'Done Rekon (Deviasi)', val: Math.round((statusCount['Done Rekon (Deviasi)']/totalStatus)*100) || 0, color: 'bg-amber-400', icon: AlertTriangle, iconColor: 'text-amber-500' },
        { label: 'Belum Rekon', val: Math.round((statusCount['Belum Rekon']/totalStatus)*100) || 0, color: 'bg-rose-500', icon: AlertCircle, iconColor: 'text-rose-500' },
        { label: 'Fixed Rate', val: Math.round((statusCount['Fixed Rate']/totalStatus)*100) || 0, color: 'bg-slate-400', icon: Settings, iconColor: 'text-slate-500' },
        { label: 'New Billing', val: Math.round((statusCount['New Billing']/totalStatus)*100) || 0, color: 'bg-slate-400', icon: CardSim, iconColor: 'text-slate-500' }
      ]
    });
  }, [appliedFilters, salesChartFilters, incomeChartFilters, costChartFilters]);

  // ==========================================
  // 4. HANDLERS & CUSTOM COMPONENTS
  // ==========================================
  const handleApply = () => setAppliedFilters({ ...filters });
  const handleLogout = () => alert("Logout berhasil!");
  const handleViewDetail = () => navigate('/detail-cost');
  
  const openRekonDetail = (statusLabel) => {
    const detailData = DUMMY_DB.filter(item => item.status === statusLabel);
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
      <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={13} fontWeight="600" style={{ pointerEvents: 'none' }}>{`${(percent * 100).toFixed(0)}%`}</text>
    );
  };

  const customTooltipStyle = { backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '13px', fontWeight: '500', color: '#334155' };
  
  const CustomGroupTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white border border-slate-200 rounded-lg shadow-md p-3 text-[13px] text-slate-700 min-w-[150px]">
          <p className="font-bold text-slate-800 mb-1">{label}</p>
          <p className="text-blue-600 font-semibold mb-1">Total: {data.totalSort} B</p>
          
          {label === 'Acquiring' ? (
            <div className="mt-2 pt-2 border-t border-slate-100 flex flex-col gap-1">
              <div className="flex justify-between items-center text-[12px] text-slate-500">
                <span>Interchange:</span>
                <span className="font-semibold text-slate-700 ml-3">{data.interchange} B</span>
              </div>
              <div className="flex justify-between items-center text-[12px] text-slate-500">
                <span>Service:</span>
                <span className="font-semibold text-slate-700 ml-3">{data.service} B</span>
              </div>
            </div>
          ) : (
            <div className="mt-2 pt-2 border-t border-slate-100 flex flex-col gap-1">
              <div className="flex justify-between items-center text-[12px] text-slate-500">
                <span>Service:</span>
                <span className="font-semibold text-slate-700 ml-3">{data.service} B</span>
              </div>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  // ==========================================
  // 5. RENDER UI
  // ==========================================
  return (
    <div className="flex h-screen bg-[#f8fafc] font-sans text-slate-800 overflow-hidden relative">
      
      {/* --- MODAL POPUP TABEL --- */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 z-50 flex justify-center items-center backdrop-blur-[2px] p-4 transition-opacity">
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-200 border border-slate-100">
            <div className="px-4 sm:px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-white rounded-t-2xl">
              <h2 className="text-base sm:text-lg font-bold text-slate-800 tracking-tight">{modalTitle} {modalData.length === 50 && <span className="text-xs sm:text-sm font-normal text-slate-400 ml-2">(Showing first 50)</span>}</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-700"><X size={20} strokeWidth={2} /></button>
            </div>
            <div className="overflow-auto rounded-b-2xl">
              {modalData.length > 0 ? (
                <table className="w-full text-left text-sm border-collapse min-w-[700px]">
                  <thead className="bg-slate-50 sticky top-0 z-10">
                    <tr>
                      <th className="p-4 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">ID Transaksi</th>
                      <th className="p-4 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">Tanggal</th>
                      <th className="p-4 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">Merchant</th>
                      <th className="p-4 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">Principal</th>
                      <th className="p-4 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">Group</th>
                      <th className="p-4 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Cost (Rp B)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {modalData.map((row, idx) => (
                      <tr key={idx} className="hover:bg-blue-50/40 transition-colors">
                        <td className="p-4 font-medium text-slate-700">{row.id}</td><td className="p-4 text-slate-600">{row.date}</td>
                        <td className="p-4 text-slate-600">{row.merchant}</td><td className="p-4 font-medium text-slate-800">{row.principal}</td>
                        <td className="p-4 text-slate-600">{row.group}</td><td className="p-4 text-right font-semibold text-slate-800">{row.principalCost}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-slate-400"><AlertCircle size={48} strokeWidth={1.5} className="mb-4 text-slate-300" /><p className="text-sm font-medium">Tidak ada data untuk rentang waktu ini.</p></div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* --- OVERLAY MOBILE MENU DENGAN BLUR --- */}
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
            {isProfileOpen && (
              <div className="absolute left-[calc(100%+16px)] bottom-0 w-56 bg-white border border-slate-100 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] p-4 z-50 flex items-center gap-3 animate-in fade-in slide-in-from-left-2 duration-200">
                <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 shrink-0"><User size={20} strokeWidth={2} /></div>
                <div><p className="text-[14px] font-bold text-slate-800 leading-tight">Mandiri</p><p className="text-[12px] text-slate-500 font-medium">Administrator</p></div>
              </div>
            )}
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

          {/* HEADER & FILTER (HANYA PRINCIPAL) */}
          <header className="flex justify-end mb-8 w-full">
            <div className="flex flex-wrap items-center justify-end gap-3 w-full" onClick={(e) => e.stopPropagation()}>
             <div className="relative flex items-center w-full sm:w-auto">
                <div className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-xl shadow-sm w-full">
                  <Filter size={18} className="text-slate-400 shrink-0" />
                  <select className="text-[13px] font-semibold text-slate-700 outline-none bg-transparent w-full appearance-none pr-6 z-10 cursor-pointer" value={filters.principal} onChange={(e) => setFilters({...filters, principal: e.target.value})}>
                    <option value="All">Principal</option>
                    <option value="Visa">Visa</option>
                    <option value="Mastercard">Mastercard</option>
                    <option value="JCB">JCB</option>
                    <option value="QR Rintis">QR Rintis</option>
                    <option value="NPG Jalin">NPG Jalin</option>
                    <option value="NPG Artajasa">NPG Artajasa</option>
                    <option value="NPG Rintis">NPG Rintis</option>
                  </select>
                  <ChevronDown size={16} className="text-slate-400 absolute right-3 pointer-events-none" />
                </div>
              </div>
              <button onClick={handleApply} className="bg-[#0f172a] hover:bg-black text-white text-[13px] font-semibold px-6 py-2.5 rounded-xl transition-all shadow-sm w-full sm:w-auto">Apply</button>
            </div>
          </header>

          <div className="grid grid-cols-12 gap-5 pb-10">
            
            {/* SUMMARY CARDS */}
            {[
              { label: 'Sales Volume', icon: BarChart2, trend: ' ', tColor: 'text-emerald-600' },
              { label: 'Total Principal Cost', icon: CreditCard, trend: '', tColor: 'text-emerald-600' },
              { label: 'Cost Per Volume', icon: Clock, trend: '', tColor: 'text-rose-500' },
              { label: 'Income', icon: BarChart2, trend: '', tColor: 'text-emerald-600' },
            ].map((card, idx) => {
              const getDynamicStats = (groupName) => {
                const groupData = dashboardData.groupStats.find(g => g.name === groupName);
                const baseVal = groupData ? groupData.totalSort : 0;
                
                if (baseVal === 0) return { amount: '0', pct: '0%', isUp: true };
                
                let amountStr = '';
                if (card.label === 'Sales Volume') {
                     amountStr = ((baseVal % 8000) / 400 + 1.2).toFixed(2) + ' T';
                } else if (card.label === 'Total Principal Cost') {
                     amountStr = ((baseVal % 3000) / 500 + 0.5).toFixed(2) + ' B';
                } else if (card.label === 'Cost Per Volume') {
                     // FORMAT DESIMAL MURNI UNTUK COST PER VOLUME
                     amountStr = ((baseVal % 2) / 10 + 0.01).toFixed(2);
                } else {
                     amountStr = ((baseVal % 2500) / 400 + 0.8).toFixed(2) + ' B';
                }
        
                const pctNum = (baseVal % 2.5 + 0.1).toFixed(1);
                const pct = `${pctNum}%`;
                const isUp = (Math.round(baseVal * 100) % 2 === 0);
        
                return { amount: amountStr, pct, isUp };
              };

              const statsGrid = [
                { label: 'Issuing Credit', ...getDynamicStats('Credit Card') },
                { label: 'Issuing Debit', ...getDynamicStats('Debit Card') },
                { label: 'Acquiring', ...getDynamicStats('Acquiring') }
              ];

              return (
                <div key={idx} className="col-span-12 sm:col-span-6 lg:col-span-3 bg-white p-5 rounded-2xl shadow-sm border border-slate-200/60 relative overflow-hidden group flex flex-col justify-between">
                  <div className="absolute top-0 left-0 w-full h-[3px] bg-amber-400"></div>
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">{card.label}</p>
                      <p className={`text-[12px] font-semibold ${card.tColor}`}>{card.trend}</p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
                      <card.icon size={18} strokeWidth={1.5} />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-slate-100">
                    {statsGrid.map((stat, i) => (
                      <div key={i} className="flex flex-col items-center">
                        <span className="text-[9px] xl:text-[10px] text-slate-500 font-semibold text-center leading-tight mb-1">{stat.label}</span>
                        <div className="bg-slate-50/70 py-2 px-1 rounded-xl border border-slate-100 w-full text-center">
                          <span className="text-[13px] xl:text-[14px] font-bold text-slate-800">{stat.amount}</span>
                        </div>
                        <div className="flex items-center justify-center gap-0.5 mt-1">
                          <span className={`text-[9px] ${stat.isUp ? 'text-emerald-500' : 'text-rose-500'}`}>
                            {stat.isUp ? '▲' : '▼'}
                          </span>
                          <span className={`text-[10px] font-bold ${stat.isUp ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {stat.pct}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}

            {/* KIRI: CHART 1 SALES VOLUME VS COST TO VOLUME (FULL WIDTH) */}
            <div className="col-span-12 bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-200/60 flex flex-col h-[400px]">
              <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-4 gap-3">
                <h3 className="font-bold text-slate-800 tracking-tight text-base sm:text-lg">Sales Volume vs Cost To Volume</h3>
                
                <div className="relative flex-1 xl:flex-none w-full xl:w-auto">
                  <select 
                    className="pl-3 pr-7 py-1.5 w-full bg-slate-50 border border-slate-200 rounded-lg text-[11px] font-semibold text-slate-700 outline-none appearance-none cursor-pointer hover:border-blue-400 transition-colors"
                    value={salesChartFilters.issuing} 
                    onChange={(e) => setSalesChartFilters({...salesChartFilters, issuing: e.target.value})}
                  >
                    <option value="All">All Issuing</option>
                    <option value="Acquiring">Acquiring</option>
                    <option value="Issuing Debit">Issuing Debit</option>
                    <option value="Issuing Credit">Issuing Credit</option>
                  </select>
                  <ChevronDown size={14} className="text-slate-400 absolute right-2 top-2 pointer-events-none" />
                </div>
              </div>

              <div className="flex-1 w-full sm:ml-0 overflow-hidden">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={dashboardData.salesChartData} margin={{top: 10, bottom: 0, right: 10, left: -20}}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 11, fill: '#64748b'}} dy={10} />
                    <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{fontSize: 11, fill: '#64748b'}} dx={-5} width={40} />
                    <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{fontSize: 11, fill: '#64748b'}} dx={5} width={40} />
                    <Tooltip contentStyle={customTooltipStyle} />
                    
                    <Bar yAxisId="left" dataKey="salesVolume" name="Sales Vol (T)" fill="#2563eb" maxBarSize={50} radius={[4, 4, 0, 0]} />
                    {/* DOT DIHILANGKAN AGAR LEBIH RAPI */}
                    <Line yAxisId="right" type="monotone" dataKey="principalCost" name="Cost To Volume" stroke="#f59e0b" strokeWidth={2.5} dot={false} activeDot={{r: 5}} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>
            
            {/* KANAN ATAS: INTERCHANGE INCOME (2 LINE: VISA & MC) */}
            <div className="col-span-12 lg:col-span-6 bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-200/60 flex flex-col h-[350px]">
              <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-2 gap-3">
                <h3 className="font-bold text-slate-800 tracking-tight text-base sm:text-lg">Interchange Income</h3>
                <div className="relative flex-1 xl:flex-none w-full xl:w-auto z-10">
                  <select 
                    className="pl-3 pr-7 py-1.5 w-full bg-slate-50 border border-slate-200 rounded-lg text-[11px] font-semibold text-slate-700 outline-none appearance-none cursor-pointer hover:border-blue-400 transition-colors"
                    value={incomeChartFilters.issuing} 
                    onChange={(e) => setIncomeChartFilters({...incomeChartFilters, issuing: e.target.value})}
                  >
                    <option value="All">All Issuing</option>
                    <option value="Acquiring">Acquiring</option>
                    <option value="Issuing Debit">Issuing Debit</option>
                    <option value="Issuing Credit">Issuing Credit</option>
                  </select>
                  <ChevronDown size={14} className="text-slate-400 absolute right-2 top-2 pointer-events-none" />
                </div>
              </div>

              <div className="flex-1 w-full sm:ml-0 overflow-hidden">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={dashboardData.incomeChartData} margin={{top: 0, bottom: 0, right: 5, left: -20}}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#64748b'}} dy={5} />
                    <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#64748b'}} dx={5} width={40} />
                    <Tooltip contentStyle={customTooltipStyle} />
                    <Legend verticalAlign="top" wrapperStyle={{ fontSize: '11px', paddingBottom: '10px' }} />
                    
                    {/* 2 Lines untuk Income (Dot dihilangkan, warna dibedakan) */}
                    <Line yAxisId="right" type="monotone" dataKey="incomeVisa" name="Visa" stroke="#1e3a8a" strokeWidth={2.5} dot={false} activeDot={{r: 4}} />
                    <Line yAxisId="right" type="monotone" dataKey="incomeMC" name="Mastercard" stroke="#f59e0b" strokeWidth={2.5} dot={false} activeDot={{r: 4}} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* KANAN BAWAH: INTERCHANGE COST (5 LINE) */}
            <div className="col-span-12 lg:col-span-6 bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-200/60 flex flex-col h-[350px]">
              <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-2 gap-3">
                <h3 className="font-bold text-slate-800 tracking-tight text-base sm:text-lg">Interchange Cost</h3>
                <div className="relative flex-1 xl:flex-none w-full xl:w-auto z-10">
                  <select 
                    className="pl-3 pr-7 py-1.5 w-full bg-slate-50 border border-slate-200 rounded-lg text-[11px] font-semibold text-slate-700 outline-none appearance-none cursor-pointer hover:border-blue-400 transition-colors"
                    value={costChartFilters.issuing} 
                    onChange={(e) => setCostChartFilters({...costChartFilters, issuing: e.target.value})}
                  >
                    <option value="All">All Issuing</option>
                    <option value="Acquiring">Acquiring</option>
                    <option value="Issuing Debit">Issuing Debit</option>
                    <option value="Issuing Credit">Issuing Credit</option>
                  </select>
                  <ChevronDown size={14} className="text-slate-400 absolute right-2 top-2 pointer-events-none" />
                </div>
              </div>

              <div className="flex-1 w-full sm:ml-0 overflow-hidden">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={dashboardData.costChartData} margin={{top: 0, bottom: 0, right: 5, left: -20}}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#64748b'}} dy={5} />
                    <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#64748b'}} dx={5} width={40} />
                    <Tooltip contentStyle={customTooltipStyle} />
                    <Legend verticalAlign="top" wrapperStyle={{ fontSize: '11px', paddingBottom: '10px' }} />
                    
                    {/* 5 Lines untuk Cost (Dot dihilangkan, warna dibedakan agar mudah dibaca) */}
                    <Line yAxisId="right" type="monotone" dataKey="costVisa" name="Visa" stroke="#1e3a8a" strokeWidth={2.5} dot={false} activeDot={{r: 4}} />
                    <Line yAxisId="right" type="monotone" dataKey="costMC" name="Mastercard" stroke="#f59e0b" strokeWidth={2.5} dot={false} activeDot={{r: 4}} />
                    <Line yAxisId="right" type="monotone" dataKey="costJCB" name="JCB" stroke="#10b981" strokeWidth={2.5} dot={false} activeDot={{r: 4}} />
                    <Line yAxisId="right" type="monotone" dataKey="costCUP" name="CUP" stroke="#8b5cf6" strokeWidth={2.5} dot={false} activeDot={{r: 4}} />
                    <Line yAxisId="right" type="monotone" dataKey="costLocal" name="Local" stroke="#ef4444" strokeWidth={2.5} dot={false} activeDot={{r: 4}} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>
            
            {/* CHART 2: COST TRANSACTION */}
            <div className="col-span-12 lg:col-span-6 bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-200/60 flex flex-col h-[350px] sm:h-[400px]">
              <h3 className="font-bold text-slate-800 tracking-tight text-base sm:text-lg mb-4">Cost Transaction</h3>
              <div className="flex-1 w-full sm:ml-0 overflow-hidden">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={dashboardData.defaultChartData} margin={{top: 10, bottom: 0, right: 10}}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 11, fill: '#64748b'}} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{fontSize: 11, fill: '#64748b'}} dx={-5} width={45} />
                    <Tooltip contentStyle={customTooltipStyle} />
                    <Legend verticalAlign="top" wrapperStyle={{ fontSize: '12px', paddingBottom: '15px' }} />
                    <Bar dataKey="interchangeFee" name="Interchange Fee" stackId="a" fill="#94a3b8" stroke="#64748b" strokeWidth={1} maxBarSize={40} radius={[0, 0, 4, 4]} />
                    <Bar dataKey="serviceFee" name="Service Fee" stackId="a" fill="#fde047" stroke="#ca8a04" strokeWidth={1} maxBarSize={40} radius={[4, 4, 0, 0]} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* CHART 3: COST BY GROUP */}
            <div className="col-span-12 lg:col-span-6 bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-200/60 flex flex-col h-[350px] sm:h-[400px]">
              <h3 className="font-bold text-slate-800 tracking-tight text-base sm:text-lg mb-4 flex items-center gap-1.5">
                Cost by Group <span className="text-[13px] text-slate-400 font-medium">(Rp B)</span>
              </h3>
              <div className="flex-1 w-full overflow-hidden">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dashboardData.groupStats} layout="vertical" margin={{ top: 0, right: 35, left: 10, bottom: 0 }}>
                    <XAxis type="number" tick={{fontSize: 11, fill: '#94a3b8'}} axisLine={{stroke: '#e2e8f0'}} tickLine={false} />
                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} width={80} tick={{fontSize: 12, fill: '#475569', fontWeight: 600}} />
                    
                    <Tooltip cursor={{fill: '#f8fafc'}} content={<CustomGroupTooltip />} />
                    <Legend verticalAlign="top" wrapperStyle={{ fontSize: '11px', paddingBottom: '10px' }} />
                    
                    <Bar dataKey="interchange" name="Interchange" stackId="a" fill="#2563eb" barSize={32} />
                    <Bar dataKey="service" name="Service" stackId="a" fill="#fde047" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* CHART 4: COST BY PRINCIPAL */}
            <div className="col-span-12 lg:col-span-6 bg-white p-6 rounded-2xl shadow-sm border border-slate-200/60 flex flex-col h-auto min-h-[350px]">
              <h3 className="font-bold text-slate-800 tracking-tight text-base sm:text-lg mb-4 text-center sm:text-left">Cost by Principal</h3>
              <div className="flex-1 flex flex-col xl:flex-row items-center justify-center gap-4">
                <div className="w-full xl:w-[50%] h-[180px] xl:h-full max-w-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={[{ name: 'Visa', value: dashboardData.principalStats.visa.pct }, { name: 'Mastercard', value: dashboardData.principalStats.mc.pct }, { name: 'Others', value: dashboardData.principalStats.others.pct }]} innerRadius="50%" outerRadius="90%" dataKey="value" labelLine={false} label={renderCustomizedLabel} stroke="#ffffff" strokeWidth={3}>
                        <Cell fill="#1e3a8a" /><Cell fill="#3b82f6" /><Cell fill="#64748b" />
                      </Pie>
                      <Tooltip contentStyle={customTooltipStyle} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="w-full xl:w-[50%] flex flex-row xl:flex-col flex-wrap justify-center gap-3 xl:gap-4 pl-0 xl:pl-2">
                  <div className="flex items-start gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#1e3a8a] mt-1 shrink-0"></div>
                    <div><p className="text-slate-800 font-bold text-[11px] lg:text-[12px]">Visa: {dashboardData.principalStats.visa.pct}%</p><p className="text-slate-500 font-medium text-[10px] lg:text-[11px] mt-0.5 leading-snug">{dashboardData.principalStats.visa.cost} B</p></div>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#3b82f6] mt-1 shrink-0"></div>
                    <div><p className="text-slate-800 font-bold text-[11px] lg:text-[12px]">Mastercard: {dashboardData.principalStats.mc.pct}%</p><p className="text-slate-500 font-medium text-[10px] lg:text-[11px] mt-0.5 leading-snug">{dashboardData.principalStats.mc.cost} B</p></div>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#64748b] mt-1 shrink-0"></div>
                    <div><p className="text-slate-800 font-bold text-[11px] lg:text-[12px]">Others: {dashboardData.principalStats.others.pct}%</p><p className="text-slate-500 font-medium text-[10px] lg:text-[11px] mt-0.5 leading-snug">{dashboardData.principalStats.others.cost} B</p></div>
                  </div>
                </div>
              </div>
            </div>

            {/* REKONSILIASI STATUS */}
            <div className="col-span-12 lg:col-span-6 bg-white p-6 rounded-2xl shadow-sm border border-slate-200/60 flex flex-col h-auto min-h-[350px]">
              <h3 className="font-bold text-slate-800 tracking-tight text-base sm:text-lg mb-6 text-center sm:text-left">Rekonsiliasi Status</h3>
              <div className="flex flex-col gap-4 flex-1 justify-center">
                {dashboardData.statusStats.map((stat, idx) => (
                  <div key={idx} onClick={() => openRekonDetail(stat.label)} className="flex items-center justify-between group cursor-pointer hover:bg-slate-50 p-2.5 -mx-2.5 rounded-xl transition-colors">
                    <span className="flex items-center gap-2.5 text-slate-600 w-44 lg:w-48 text-[12px] lg:text-[13px] font-semibold"><stat.icon size={16} strokeWidth={2} className={stat.iconColor} /> {stat.label}</span>
                    <div className="flex-1 mx-2 h-2 bg-slate-100 rounded-full overflow-hidden flex"><div className={`h-full ${stat.color} transition-all duration-700`} style={{ width: `${stat.val}%` }}></div></div>
                    <span className={`font-bold text-[13px] w-8 text-right ${stat.iconColor}`}>{stat.val}%</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;