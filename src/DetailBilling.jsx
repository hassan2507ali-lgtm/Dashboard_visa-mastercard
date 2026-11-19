import { useState, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Menu, CreditCard, Book, FileText, User, ChevronUp, ChevronDown, LogOut,
  Filter, X, ChevronLeft, ChevronRight
} from 'lucide-react';

// === IMPORT GAMBAR LOGO DARI FOLDER SRC ===
import LogoDanantara from './mandiri.png';
import LogoMandiri from './danatara.png';

import {
  TABLE_DB, FILTER_OPTIONS, MONTH_ORDER, BILLING_HIGHLIGHTS,
  billingKey, BILLING_KEYS, TOP_BILLING_RANK, formatDecimal
} from './billingData';



// Daftar filter tabel (urutan tampil di layar)
const TABLE_FILTER_FIELDS = [
  { key: 'startPeriode', label: 'Start Periode', allLabel: 'All', options: FILTER_OPTIONS.month },
  { key: 'endPeriode', label: 'End Periode', allLabel: 'All', options: FILTER_OPTIONS.month },
  { key: 'jenisTransaksi', label: 'Jenis Transaksi', allLabel: 'All', options: FILTER_OPTIONS.jenisTransaksi },
  { key: 'tagging', label: 'Tagging', allLabel: 'All', options: FILTER_OPTIONS.tagging },
  { key: 'principal', label: 'Principal', allLabel: 'All', options: FILTER_OPTIONS.principal },
  { key: 'group', label: 'Group', allLabel: 'All', options: FILTER_OPTIONS.group },
  { key: 'region', label: 'Domestic / International', allLabel: 'Both', options: FILTER_OPTIONS.region },
  { key: 'channel', label: 'CP / CNP / ATM', allLabel: 'All', options: FILTER_OPTIONS.channel },
  { key: 'billing', label: 'Top / New Billing', allLabel: 'All', options: FILTER_OPTIONS.billing },
  { key: 'sort', label: 'Sort (Total)', allLabel: 'Default', options: ['Lowest', 'Highest'] },
];

const DEFAULT_TABLE_FILTERS = {
  jenisTransaksi: 'All',
  tagging: 'All',
  principal: 'All',
  group: 'All',
  region: 'All',   // All = Both
  channel: 'All',
  billing: 'All',
  startPeriode: 'All',
  endPeriode: 'All',
  sort: 'All'      // All = Default, Lowest / Highest berdasarkan Total
};

const DetailBilling = () => {
  const navigate = useNavigate();
  const location = useLocation();
  // Filter awal bisa dikirim dari halaman lain (mis. klik Top/New Billing di Detail Cost)
  const initialFilters = { ...DEFAULT_TABLE_FILTERS, ...(location.state?.filters || {}) };

  // ==========================================
  // STATE MANAGEMENT
  // ==========================================
  const [tableFilters, setTableFilters] = useState(initialFilters);
  const [appliedTableFilters, setAppliedTableFilters] = useState(initialFilters);

  // --- STATE PAGINATION ---
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 7;

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // ==========================================
  // LOGIKA FILTERING & RESET HALAMAN TABEL
  // ==========================================
  const filteredTableData = useMemo(() => {
    const f = appliedTableFilters;
    const rows = TABLE_DB.filter(row => {
      const passJenis = f.jenisTransaksi === 'All' || row.jenisTransaksi === f.jenisTransaksi;
      const passTagging = f.tagging === 'All' || row.tagging === f.tagging;
      const passPrincipal = f.principal === 'All' || row.principal === f.principal;
      const passGroup = f.group === 'All' || row.group === f.group;
      const passRegion = f.region === 'All' || row.region === f.region;
      const passChannel = f.channel === 'All' || row.channel === f.channel;
      const passBilling = f.billing === 'All' || BILLING_KEYS[f.billing].has(billingKey(row.principal, row.billingLine, row.description));

      // Filter rentang periode (bulan)
      let passPeriode = true;
      const rowMonthIdx = MONTH_ORDER[row.month];
      const startIdx = f.startPeriode !== 'All' ? MONTH_ORDER[f.startPeriode] : 0;
      const endIdx = f.endPeriode !== 'All' ? MONTH_ORDER[f.endPeriode] : 999;
      if (rowMonthIdx) {
        passPeriode = rowMonthIdx >= startIdx && rowMonthIdx <= endIdx;
      }

      return passJenis && passTagging && passPrincipal && passGroup && passRegion && passChannel && passBilling && passPeriode;
    });

    // Urutkan berdasarkan Total: Lowest (kecil -> besar) / Highest (besar -> kecil)
    if (f.sort === 'Lowest') rows.sort((a, b) => a.total - b.total);
    if (f.sort === 'Highest') rows.sort((a, b) => b.total - a.total);
    return rows;
  }, [appliedTableFilters]);

  // Reset ke halaman 1 setiap kali filter diterapkan
  const handleApplyTableFilter = () => {
    setAppliedTableFilters({ ...tableFilters });
    setCurrentPage(1);
  };
  const handleResetTableFilter = () => {
    setTableFilters({ ...DEFAULT_TABLE_FILTERS });
    setAppliedTableFilters({ ...DEFAULT_TABLE_FILTERS });
    setCurrentPage(1);
  };

  // Kolom penanda muncul sesuai filter Billing yang sedang diterapkan
  const billingMode = appliedTableFilters.billing;

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
  // RENDER UI
  // ==========================================
  // ==========================================
  // KONFIGURASI KOLOM TABEL (urutan tampil di layar)
  // Utama: Principal, Type, Region, Billing Line, Rate, Unit, Amount, Description, Tagging
  // ==========================================
  const TABLE_COLUMNS = [
    { header: 'PRINCIPAL', className: 'py-4 px-5 text-[13px] font-bold text-slate-800', render: r => r.principal },
    { header: 'TYPE', className: 'py-4 px-5', render: r => (
      <span className={`px-2.5 py-1 rounded-md text-[10px] font-extrabold tracking-wide uppercase ${getBadgeType(r.jenisTransaksi)}`}>{r.jenisTransaksi}</span>
    ) },
    { header: 'REGION', className: 'py-4 px-5', render: r => (
      <span className={`px-2.5 py-1 rounded-md text-[10px] font-extrabold tracking-wide uppercase ${r.region === 'International' ? 'bg-indigo-100 text-indigo-700' : 'bg-sky-100 text-sky-700'}`}>{r.region}</span>
    ) },
    { header: 'BILLING LINE', className: 'py-4 px-5 text-[13px] font-bold text-slate-700', render: r => r.billingLine },
    { header: 'RATE', right: true, className: 'py-4 px-5 text-[13px] font-semibold text-slate-700 text-right', render: r => formatDecimal(r.rate) },
    { header: 'UNIT', right: true, className: 'py-4 px-5 text-[13px] font-semibold text-slate-700 text-right', render: r => r.unit.toLocaleString('id-ID') },
    { header: 'AMOUNT', right: true, className: 'py-4 px-5 text-[13px] font-bold text-slate-800 text-right', render: r => formatDecimal(r.total) },
    { header: 'DESCRIPTION', className: 'py-4 px-5 text-[13px] font-medium text-slate-500 max-w-[200px] truncate', render: r => <span title={r.description}>{r.description}</span> },
    { header: 'TAGGING', className: 'py-4 px-5 text-[13px] font-bold text-slate-800', render: r => r.tagging },
    // Kolom lainnya (tetap ditampilkan)
    { header: 'GROUP', className: 'py-4 px-5 text-[13px] font-bold', render: r => <span className={r.group.includes('Debit') ? 'text-blue-600' : 'text-slate-600'}>{r.group}</span> },
    { header: 'CHANNEL', className: 'py-4 px-5', render: r => (
      <span className={`px-2.5 py-1 rounded-md text-[10px] font-extrabold tracking-wide uppercase ${r.channel === 'ATM' ? 'bg-violet-100 text-violet-700' : r.channel === 'CNP' ? 'bg-rose-100 text-rose-700' : 'bg-teal-100 text-teal-700'}`}>{r.channel}</span>
    ) },
    { header: 'STATUS', className: 'py-4 px-5 text-[13px] font-semibold text-slate-500', render: r => r.status },
    { header: 'TANGGAL', className: 'py-4 px-5 text-[13px] font-medium text-slate-500', render: r => r.tanggal },
    { header: 'ICA', className: 'py-4 px-5 text-[13px] font-medium text-slate-500', render: r => r.ica },
    { header: 'EQV IDR', right: true, className: 'py-4 px-5 text-[13px] font-bold text-slate-800 text-right', render: r => formatDecimal(r.eqvIdr) },
    { header: 'PRINCIPAL FEE TYPE', className: 'py-4 px-5 text-[13px] font-medium text-slate-500', render: r => r.principalFeeType },
    { header: 'PRINCIPAL CATEGORY', className: 'py-4 px-5 text-[13px] font-medium text-slate-500', render: r => r.principalCategory },
    { header: 'PRINCIPAL SUB CATEGORY', className: 'py-4 px-5 text-[13px] font-medium text-slate-500', render: r => r.principalSubCategory },
  ];

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
            <button onClick={() => navigate('/detail-cost')} className="text-slate-400 hover:text-blue-600 transition-colors" title="Detail Cost"><Book size={24} strokeWidth={1.5} /></button>
            <button className="text-blue-600 transition-colors" title="Detail Billing"><FileText size={24} strokeWidth={1.5} /></button>
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
          <h1 className="font-bold text-lg text-slate-900 tracking-tight">Detail Billing</h1>
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

          {/* TABEL DETAIL BILLING */}
          <div className="w-full bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden mb-10">

            <div className="px-6 py-6 border-b border-slate-100 flex flex-col gap-5">
              {/* Baris judul + tombol aksi */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 tracking-tight">Detail Billing</h2>
                  <p className="text-[12px] text-slate-400 mt-0.5">{filteredTableData.length} billing sesuai filter</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={handleResetTableFilter} className="text-[#1e3a8a] hover:text-blue-800 hover:underline text-[12px] font-semibold px-2 py-2 transition-all bg-transparent border-none">Reset</button>
                  <button onClick={handleApplyTableFilter} className="flex items-center gap-1.5 px-6 py-2 bg-[#111827] hover:bg-black text-white rounded-lg text-[12px] font-bold shadow-sm transition-all active:scale-95">
                    <Filter size={13} /> Apply
                  </button>
                </div>
              </div>

              {/* Grid filter berlabel, rapi di semua ukuran layar */}
              <div className="grid grid-cols-2 sm:grid-cols-5 xl:grid-cols-10 gap-3 items-end">
                {TABLE_FILTER_FIELDS.map(field => (
                  <div key={field.key} className="flex flex-col gap-1 min-w-0">
                    <label className="text-[11px] font-semibold text-slate-500 leading-tight">{field.label}</label>
                    <div className="relative flex items-center">
                      <select
                        className="w-full pl-3 pr-7 py-1.5 border border-slate-200 rounded-lg text-[12px] font-semibold text-slate-600 hover:bg-slate-50 transition-colors appearance-none outline-none bg-white cursor-pointer truncate"
                        value={tableFilters[field.key]}
                        onChange={(e) => setTableFilters({ ...tableFilters, [field.key]: e.target.value })}
                      >
                        <option value="All">{field.allLabel}</option>
                        {field.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                      </select>
                      <ChevronDown size={12} className="text-slate-400 absolute right-2.5 pointer-events-none" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="w-full overflow-x-auto">
              {/* Kolomnya diperbanyak, min-w dilebarkan agar tidak terjepit */}
              <table className="w-full text-left border-collapse min-w-[2000px]">
                <thead className="bg-[#f8fafc]">
                  <tr>
                    {billingMode !== 'All' && (
                      <th className="py-4 px-5 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200/80">{billingMode.toUpperCase()}</th>
                    )}
                    {TABLE_COLUMNS.map(col => (
                      <th key={col.header} className={`py-4 px-5 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200/80 ${col.right ? 'text-right' : ''}`}>
                        {col.header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {currentTableData.length > 0 ? (
                    currentTableData.map((row, idx) => (
                      <tr key={row.id ?? idx} className="transition-colors group hover:bg-slate-50/60">
                        {billingMode === 'Top Billing' && (
                          <td className="py-4 px-5">
                            <span className="px-2.5 py-1 rounded-md text-[10px] font-extrabold tracking-wide uppercase bg-amber-100 text-amber-700 whitespace-nowrap">
                              Top #{TOP_BILLING_RANK[billingKey(row.principal, row.billingLine, row.description)]}
                            </span>
                          </td>
                        )}
                        {billingMode === 'New Billing' && (
                          <td className="py-4 px-5">
                            <span className="px-2.5 py-1 rounded-md text-[10px] font-extrabold tracking-wide uppercase bg-emerald-100 text-emerald-700 whitespace-nowrap">
                              New · {BILLING_HIGHLIGHTS[row.principal].lastMonthName}
                            </span>
                          </td>
                        )}
                        
                        {TABLE_COLUMNS.map(col => (
                          <td key={col.header} className={col.className}>{col.render(row)}</td>
                        ))}
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={TABLE_COLUMNS.length + (billingMode !== 'All' ? 1 : 0)} className="py-10 text-center text-slate-400 font-medium text-[13px]">
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

export default DetailBilling;
