import React, { useState, useEffect } from 'react';
import { Settings2, ChevronDown, Calendar as CalendarIcon, User, LogOut, CreditCard, FileText, ShoppingCart, Calendar, LayoutDashboard, CheckSquare, Filter, ArrowLeft, Download } from 'lucide-react';

const FILTER_OPTIONS = {
  group: ['All', 'Issuer Kredit', 'Issuer Debit', 'Acq ADC', 'Acq ATM', 'Acq Both', 'Issuer Both', 'Both'],
  klasifikasi: ['All', 'Internasional', 'Transaction Service', 'Lokal Service'],
  principal: ['All', 'Visa', 'Master Card', 'JCB', 'Lokal'],
  type: ['All', 'Monthly', 'Quarterly', 'Interchange', 'Daily', 'MTI'],
  status: ['All', 'Progress', 'Complete', 'Failed']
};

const generateDummyTransactions = (startDateStr = '', endDateStr = '') => {
  const data = [];
  const statuses = ['Progress', 'Complete', 'Failed']; 
  const startMs = startDateStr ? new Date(startDateStr).getTime() : new Date('2026-01-01').getTime();
  const endMs = endDateStr ? new Date(endDateStr).getTime() : new Date('2026-12-31').getTime();

  for (let i = 0; i < 100; i++) {
    const randomTime = startMs + Math.random() * (endMs - startMs);
    const dateObj = new Date(randomTime);
    const formattedDate = dateObj.toISOString().split('T')[0];

    data.push({
      id: `2ZN${Math.floor(Math.random() * 90000) + 10000}K`,
      group: FILTER_OPTIONS.group[Math.floor(Math.random() * 7) + 1],
      desc: `TRX-SYS-${Math.floor(Math.random() * 9000)}`,
      periode: formattedDate,
      klasifikasi: FILTER_OPTIONS.klasifikasi[Math.floor(Math.random() * 3) + 1],
      type: FILTER_OPTIONS.type[Math.floor(Math.random() * 5) + 1].toUpperCase(),
      principal: FILTER_OPTIONS.principal[Math.floor(Math.random() * 4) + 1],
      status: statuses[Math.floor(Math.random() * statuses.length)] 
    });
  }
  return data.sort((a, b) => new Date(b.periode) - new Date(a.periode));
};

export default function ReportEngine({ setCurrentPage }) {
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

  const handleDateSubmit = () => {
    if(!startDate || !endDate) {
      alert("Periode tanggal awal dan akhir harus diisi.");
      return;
    }
    const newData = generateDummyTransactions(startDate, endDate);
    setAllTransactions(newData);
    let filtered = [...newData];
    if (filters.group !== 'All') filtered = filtered.filter(t => t.group === filters.group);
    if (filters.klasifikasi !== 'All') filtered = filtered.filter(t => t.klasifikasi === filters.klasifikasi);
    if (filters.principal !== 'All') filtered = filtered.filter(t => t.principal === filters.principal);
    if (filters.type !== 'All') filtered = filtered.filter(t => t.type === filters.type.toUpperCase());
    if (filters.status !== 'All') filtered = filtered.filter(t => t.status === filters.status);
    setDisplayedTransactions(filtered);
  };

  const handleDownloadExcel = () => {
    const headers = ['ID BILLING', 'GROUP MANDIRI', 'DESKRIPSI', 'PERIODE', 'KLASIFIKASI', 'TYPE', 'PRINCIPAL', 'STATUS REKON'];
    const csvRows = displayedTransactions.map(row => [row.id, row.group, row.desc, row.periode, row.klasifikasi, row.type, row.principal, row.status].join(','));
    const csvContent = [headers.join(','), ...csvRows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.setAttribute('href', URL.createObjectURL(blob));
    link.setAttribute('download', `Report_Transaksi_${startDate || 'All'}_to_${endDate || 'All'}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getBadgeStyle = (type) => {
    switch (type) { case 'MONTHLY': return 'bg-blue-50 text-blue-600'; case 'QUARTERLY': return 'bg-purple-50 text-purple-600'; case 'DAILY': return 'bg-emerald-50 text-emerald-600'; default: return 'bg-gray-100 text-gray-600'; }
  };
  const getStatusBadgeStyle = (status) => {
    switch (status) { case 'Complete': return 'text-emerald-600 bg-emerald-50 font-bold'; case 'Progress': return 'text-yellow-600 bg-yellow-50 font-bold'; case 'Failed': return 'text-red-600 bg-red-50 font-bold'; default: return 'text-gray-500'; }
  };
  const getSidebarItemStyle = (pageName) => pageName === 'report' ? "p-2.5 bg-slate-100 text-slate-800 rounded-xl cursor-pointer transition-all shadow-sm ring-1 ring-slate-200" : "p-2.5 text-gray-400 hover:text-gray-700 hover:bg-gray-50 rounded-xl cursor-pointer transition-all";

  return (
    <div className="flex h-screen bg-[#f4f7f9] font-sans overflow-hidden relative">
      {activeDropdown && <div className="fixed inset-0 z-40" onClick={closeDropdowns}></div>}

      {/* SIDEBAR */}
      <div className="w-[88px] fixed h-full flex flex-col items-center py-6 gap-6 bg-transparent z-10">
        <div className="bg-white p-3 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-3 items-center w-14">
          <div onClick={() => setCurrentPage('home')} className={getSidebarItemStyle('home')}><LayoutDashboard className="w-5 h-5" /></div>
          <div onClick={() => setCurrentPage('debit-detail')} className={getSidebarItemStyle('debit-detail')}><CreditCard className="w-5 h-5" /></div>
          <div onClick={() => setCurrentPage('credit-detail')} className={getSidebarItemStyle('credit-detail')}><FileText className="w-5 h-5" /></div>
          <div onClick={() => setCurrentPage('acquiring-detail')} className={getSidebarItemStyle('acquiring-detail')}><ShoppingCart className="w-5 h-5" /></div>
          <div onClick={() => setCurrentPage('report')} className={getSidebarItemStyle('report')}><Calendar className="w-5 h-5" strokeWidth={2.5} /></div>
        </div>
        <div className="mt-auto bg-white p-3 rounded-2xl shadow-sm border border-gray-100 w-14 flex justify-center"><div className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl cursor-pointer"><LogOut className="w-5 h-5" /></div></div>
      </div>

      <div className="flex-1 ml-[88px] p-8 overflow-y-auto h-full scroll-smooth">
        
        {/* HEADER */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <div className="flex items-center gap-3">
              <button onClick={() => setCurrentPage('home')} className="p-1.5 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors shadow-sm cursor-pointer"><ArrowLeft className="w-5 h-5 text-gray-700" /></button>
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Report Engine & Data Export</h1>
            </div>
            <p className="text-sm text-gray-500 mt-1 max-w-4xl font-medium">Modul ekspor data untuk penarikan laporan transaksi berdasarkan periode dan spesifikasi parameter.</p>
          </div>
          <div className="flex items-center gap-2.5 bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-100 hover:bg-gray-50 cursor-pointer"><div className="bg-blue-100 p-1.5 rounded-lg"><User className="w-4 h-4 text-blue-600" /></div><span className="text-[13px] font-semibold text-gray-700">Admin@gmail.com</span><ChevronDown className="w-3.5 h-3.5 text-gray-400 ml-1" /></div>
        </div>

        {/* EXPORT SECTION */}
        <div className="bg-white rounded-2xl shadow-sm p-8 border border-gray-100 flex flex-col mb-8">
          <div className="flex items-center gap-4 mb-8 pb-6 border-b border-gray-100">
            <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center">
              <Download className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-gray-900">Konfigurasi Ekspor Laporan</h2>
              <p className="text-xs text-gray-500 font-medium mt-1">Lengkapi parameter rentang waktu di bawah ini untuk menyaring data sebelum diekspor.</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
            <div className="flex flex-col gap-2">
              <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Periode Tanggal Awal</label>
              <div className="relative overflow-hidden rounded-xl">
                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                <div className="w-full border border-gray-200 bg-gray-50 p-3.5 flex items-center gap-3 shadow-sm hover:border-blue-400 transition-colors"><CalendarIcon className="w-5 h-5 text-blue-600" /><span className={`text-sm font-semibold ${startDate ? 'text-gray-900' : 'text-gray-400'}`}>{startDate || "Pilih tanggal awal..."}</span></div>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Periode Tanggal Akhir</label>
              <div className="relative overflow-hidden rounded-xl">
                <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                <div className="w-full border border-gray-200 bg-gray-50 p-3.5 flex items-center gap-3 shadow-sm hover:border-blue-400 transition-colors"><CalendarIcon className="w-5 h-5 text-blue-600" /><span className={`text-sm font-semibold ${endDate ? 'text-gray-900' : 'text-gray-400'}`}>{endDate || "Pilih tanggal akhir..."}</span></div>
              </div>
            </div>
          </div>

          {/* TOMBOL SUBMIT KECIL DI KANAN BAWAH KALENDER */}
          <div className="flex justify-end mb-8">
            <button onClick={handleDateSubmit} className="bg-slate-500 hover:bg-slate-600 text-white px-8 py-2.5 rounded-lg font-semibold text-xs transition-all shadow-sm active:scale-[0.98]">
              Submit
            </button>
          </div>

          <div className="bg-blue-50/50 p-5 rounded-xl border border-blue-100 flex justify-between items-center">
            <div className="text-sm">
              <span className="font-semibold text-gray-700">Total data siap diekspor: </span>
              <span className="font-bold text-blue-600">{displayedTransactions.length} Transaksi</span>
            
            </div>
            {/* TOMBOL EKSPOR BIRU TERANG */}
            <button onClick={handleDownloadExcel} className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-7 py-3 rounded-xl font-bold text-sm transition-all shadow-lg shadow-blue-500/30 active:scale-[0.98]">
              <Download className="w-4 h-4" /> Ekspor (.CSV)
            </button>
          </div>
        </div>

        {/* TABEL TRANSAKSI UNTUK REPORT */}
        <div className="bg-white rounded-2xl shadow-sm p-7 border border-gray-100 flex flex-col mb-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-lg font-bold tracking-tight text-gray-900">Konfigurasi Transaksi</h2>
            </div>
            <div className="flex items-center gap-2 relative z-50">
              {[{ key: 'group', label: 'Group Mandiri' }, { key: 'klasifikasi', label: 'Klasifikasi' }, { key: 'principal', label: 'Principal' }, { key: 'type', label: 'Type' }, { key: 'status', label: 'Status' }].map((f) => (
                <div key={f.key} className="relative">
                  <button onClick={() => setActiveDropdown(activeDropdown === f.key ? null : f.key)} className={`flex items-center gap-1.5 px-3 py-1.5 border rounded-lg text-xs font-semibold transition-all shadow-sm ${activeDropdown === f.key || filters[f.key] !== 'All' ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}><Settings2 className={`w-3.5 h-3.5 ${filters[f.key] !== 'All' ? 'text-blue-600' : 'text-gray-400'}`} /> {filters[f.key] === 'All' ? f.label : filters[f.key]}</button>
                  {activeDropdown === f.key && (
                    <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-xl py-1 z-50">
                      {FILTER_OPTIONS[f.key].map(opt => (<div key={opt} onClick={() => { setFilters({...filters, [f.key]: opt}); closeDropdowns(); }} className="px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 cursor-pointer flex justify-between items-center"><span className={filters[f.key] === opt ? 'font-bold text-blue-600' : ''}>{opt}</span>{filters[f.key] === opt && <CheckSquare className="w-4 h-4 text-blue-600" />}</div>))}
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
                <thead className="text-[10px] font-bold text-gray-500 uppercase bg-gray-50 border-b border-gray-100 tracking-wider sticky top-0 z-10 shadow-sm"><tr><th className="px-5 py-3.5">ID BILLING</th><th className="px-5 py-3.5">GROUP MANDIRI</th><th className="px-5 py-3.5">DESKRIPSI</th><th className="px-5 py-3.5">PERIODE</th><th className="px-5 py-3.5">KLASIFIKASI</th><th className="px-5 py-3.5">TYPE</th><th className="px-5 py-3.5">PRINCIPAL</th><th className="px-5 py-3.5 text-center">STATUS REKON</th></tr></thead>
                <tbody className="text-[13px]">
                  {displayedTransactions.map((row, index) => (
                    <tr key={index} className="border-b border-gray-50 hover:bg-blue-50/30 transition-colors"><td className="px-5 py-4 font-bold text-gray-900">{row.id}</td><td className={`px-5 py-4 font-semibold ${row.group === 'Issuer Debit' ? 'text-blue-600' : 'text-gray-600'}`}>{row.group}</td><td className="px-5 py-4 text-gray-400">{row.desc}</td><td className="px-5 py-4 text-gray-500 font-medium">{row.periode}</td><td className="px-5 py-4">{row.klasifikasi}</td><td className="px-5 py-4"><span className={`px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wide uppercase ${getBadgeStyle(row.type)}`}>{row.type}</span></td><td className="px-5 py-4 font-bold text-gray-900">{row.principal}</td><td className="px-5 py-4 text-center"><span className={`px-2.5 py-1 rounded-md text-[10px] uppercase tracking-wide ${getStatusBadgeStyle(row.status)}`}>{row.status}</span></td></tr>
                  ))}
                </tbody>
              </table>
            ) : (<div className="flex flex-col items-center justify-center h-48 text-gray-400 bg-gray-50/50"><p className="font-semibold text-xs">Data transaksi tidak ditemukan berdasarkan filter yang diterapkan.</p></div>)}
          </div>
        </div>
      </div>
    </div>
  );
}