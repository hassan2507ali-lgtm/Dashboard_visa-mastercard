import { useState, useMemo } from 'react';
import ColumnFilter from './ColumnFilter';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Menu, CreditCard, Book, FileText, User, ChevronUp, ChevronDown, LogOut,
  Filter, X, ChevronLeft, ChevronRight, Download, ArrowUp, ArrowDown
} from 'lucide-react';
import { downloadCsv, downloadXlsx } from './exportFile';

// === IMPORT GAMBAR LOGO DARI FOLDER SRC ===
import LogoDanantara from './mandiri.png';
import LogoMandiri from './danatara.png';

import {
  TABLE_DB, FILTER_OPTIONS, MONTH_ORDER, BILLING_HIGHLIGHTS,
  billingKey, BILLING_KEYS, TOP_BILLING_RANK, formatDecimal
} from './billingData';



const getBadgeType = (type) => {
  if (type.includes('Service')) return 'bg-amber-100 text-amber-700';
  if (type.includes('Interchange')) return 'bg-emerald-100 text-emerald-700';
  return 'bg-slate-100 text-slate-700';
};

// Urutan tanggal "15-Jan-2026" -> bulan (MONTH_ORDER) lalu hari
const tanggalSortValue = (r) => (MONTH_ORDER[r.month] || 0) * 100 + (parseInt(r.tanggal, 10) || 0);

// ==========================================
// KONFIGURASI KOLOM TABEL (urutan tampil di layar)
// Utama: Principal, Type, Region, Key (Billing Line + ICA + Tier Event), Rate, Unit, Amount, Description, Group, Tanggal
// key = field data untuk filter & sort header (ala Excel); number = kolom angka
// ==========================================
const TABLE_COLUMNS = [
  { key: 'principal', header: 'PRINCIPAL', className: 'py-4 px-5 text-[13px] font-bold text-slate-800', render: r => r.principal },
  { key: 'jenisTransaksi', header: 'TYPE', className: 'py-4 px-5', render: r => (
    <span className={`px-2.5 py-1 rounded-md text-[10px] font-extrabold tracking-wide uppercase whitespace-nowrap ${getBadgeType(r.jenisTransaksi)}`}>{r.jenisTransaksi}</span>
  ) },
  { key: 'region', header: 'REGION', className: 'py-4 px-5', render: r => (
    <span className={`px-2.5 py-1 rounded-md text-[10px] font-extrabold tracking-wide uppercase whitespace-nowrap ${r.region === 'International' ? 'bg-indigo-100 text-indigo-700' : 'bg-sky-100 text-sky-700'}`}>{r.region}</span>
  ) },
  { key: 'key', header: 'KEY', className: 'py-4 px-5 text-[13px] font-bold text-slate-700 whitespace-nowrap', render: r => r.key },
  { key: 'rate', number: true, header: 'RATE', right: true, className: 'py-4 px-5 text-[13px] font-semibold text-slate-700 text-right', render: r => formatDecimal(r.rate) },
  { key: 'unit', number: true, header: 'UNIT', right: true, className: 'py-4 px-5 text-[13px] font-semibold text-slate-700 text-right', render: r => r.unit.toLocaleString('id-ID') },
  { key: 'total', number: true, header: 'AMOUNT', right: true, className: 'py-4 px-5 text-[13px] font-bold text-slate-800 text-right', render: r => formatDecimal(r.total) },
  { key: 'description', header: 'DESCRIPTION', className: 'py-4 px-5 text-[13px] font-medium text-slate-500 max-w-[200px] truncate', render: r => <span title={r.description}>{r.description}</span> },
  { key: 'group', header: 'GROUP', className: 'py-4 px-5 text-[13px] font-bold', render: r => <span className={r.group.includes('Debit') ? 'text-blue-600' : 'text-slate-600'}>{r.group}</span> },
  // Filter Tanggal per bulan (pengganti filter Start / End Periode)
  { key: 'tanggal', header: 'TANGGAL', filterValue: r => r.month, filterOrder: m => MONTH_ORDER[m] || 0, sortValue: tanggalSortValue, className: 'py-4 px-5 text-[13px] font-medium text-slate-500', render: r => r.tanggal },
];
const COLUMN_BY_KEY = Object.fromEntries(TABLE_COLUMNS.map(c => [c.key, c]));

// Nilai sel untuk filter (selalu string supaya bisa dibandingkan di checklist)
const filterValueOf = (col, row) => String(col.filterValue ? col.filterValue(row) : row[col.key] ?? '');

const DetailBilling = () => {
  const navigate = useNavigate();
  const location = useLocation();
  // Filter awal bisa dikirim dari halaman lain (mis. klik Top/New Billing di Detail Cost)
  const initialState = location.state?.filters || {};

  // ==========================================
  // STATE MANAGEMENT
  // ==========================================
  // Filter per kolom ala Excel: { [key kolom]: [nilai terpilih] } — kolom tanpa entri = semua nilai
  const [colFilters, setColFilters] = useState(() => (
    initialState.principal && initialState.principal !== 'All' ? { principal: [initialState.principal] } : {}
  ));
  const [sortState, setSortState] = useState(null); // { key, dir: 'asc' | 'desc' }
  const [billingMode, setBillingMode] = useState(initialState.billing || 'All'); // All / Top Billing / New Billing
  const [openFilter, setOpenFilter] = useState(null); // { key, rect }

  // --- STATE PAGINATION ---
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 7;

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isDownloadOpen, setIsDownloadOpen] = useState(false);

  // ==========================================
  // LOGIKA FILTERING (header kolom + Top/New Billing) & SORT
  // ==========================================
  // exceptKey: abaikan filter kolom itu sendiri (untuk daftar nilai di popover, seperti Excel)
  const rowPasses = (row, exceptKey = null) => {
    if (billingMode !== 'All' && !BILLING_KEYS[billingMode].has(billingKey(row.principal, row.billingLine, row.description))) return false;
    return Object.entries(colFilters).every(([key, values]) => (
      key === exceptKey || values.includes(filterValueOf(COLUMN_BY_KEY[key], row))
    ));
  };

  const filteredTableData = useMemo(() => {
    const rows = TABLE_DB.filter(row => rowPasses(row));
    if (sortState) {
      const col = COLUMN_BY_KEY[sortState.key];
      const valueOf = col.sortValue || (r => r[col.key]);
      const sign = sortState.dir === 'asc' ? 1 : -1;
      rows.sort((a, b) => {
        const va = valueOf(a), vb = valueOf(b);
        return sign * (typeof va === 'number' && typeof vb === 'number' ? va - vb : String(va).localeCompare(String(vb), 'id'));
      });
    }
    return rows;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [colFilters, sortState, billingMode]);

  // Daftar nilai unik untuk popover filter kolom (mengikuti filter kolom lain)
  const filterOptionsFor = (col) => {
    const map = new Map();
    TABLE_DB.forEach(row => {
      if (!rowPasses(row, col.key)) return;
      const v = filterValueOf(col, row);
      if (!map.has(v)) map.set(v, col.filterValue ? col.filterValue(row) : row[col.key]);
    });
    const list = [...map.entries()].map(([value, raw]) => ({
      value,
      raw,
      label: col.number ? formatDecimal(raw) : (value === '' ? '(Blanks)' : value),
    }));
    if (col.filterOrder) list.sort((a, b) => col.filterOrder(a.raw) - col.filterOrder(b.raw));
    else if (col.number) list.sort((a, b) => a.raw - b.raw);
    else list.sort((a, b) => a.label.localeCompare(b.label, 'id'));
    return list;
  };

  const applyColFilter = (key, values) => {
    setColFilters(prev => {
      const next = { ...prev };
      if (values) next[key] = values; else delete next[key];
      return next;
    });
    setCurrentPage(1);
    setOpenFilter(null);
  };
  const applySort = (key, dir) => {
    setSortState(dir ? { key, dir } : null);
    setCurrentPage(1);
    setOpenFilter(null);
  };
  const handleClearAll = () => {
    setColFilters({});
    setSortState(null);
    setBillingMode('All');
    setCurrentPage(1);
  };
  const activeFilterCount = Object.keys(colFilters).length + (billingMode !== 'All' ? 1 : 0);

  const totalPages = Math.ceil(filteredTableData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentTableData = filteredTableData.slice(startIndex, startIndex + itemsPerPage);

  const handleLogout = () => alert("Logout berhasil!");

  // ==========================================
  // DOWNLOAD DATA TABEL SESUAI FILTER (CSV / XLSX) — nilai mentah, bukan teks yang sudah diformat
  // ==========================================
  const EXPORT_FIELDS = [
    ['Principal', 'principal'], ['Type', 'jenisTransaksi'], ['Region', 'region'], ['Key', 'key'],
    ['Rate', 'rate'], ['Unit', 'unit'], ['Amount', 'total'], ['Description', 'description'],
    ['Group', 'group'], ['Tanggal', 'tanggal'],
  ];
  const handleDownload = (format) => {
    setIsDownloadOpen(false);
    const rows = [
      EXPORT_FIELDS.map(([h]) => h),
      ...filteredTableData.map(row => EXPORT_FIELDS.map(([, k]) => row[k] ?? '')),
    ];
    const name = `detail_billing_${new Date().toISOString().slice(0, 10)}`;
    if (format === 'csv') downloadCsv(rows, `${name}.csv`);
    else downloadXlsx(rows, `${name}.xlsx`, 'Detail Billing');
  };

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
            <button onClick={() => navigate('/')} className="text-slate-400 hover:text-blue-600 transition-colors" title="Main Dashboard"><CreditCard size={24} strokeWidth={1.5} /></button>
            <button onClick={() => navigate('/detail-cost')} className="text-slate-400 hover:text-blue-600 transition-colors" title="Performance Monitoring"><Book size={24} strokeWidth={1.5} /></button>
            <button className="text-blue-600 transition-colors" title="Monitoring fee"><FileText size={24} strokeWidth={1.5} /></button>
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

            {/* Judul + aksi. Filter per kolom ada di header tabel (klik ▾ seperti Excel) */}
            <div className="px-6 py-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">Detail Billing</h2>
                <p className="text-[12px] text-slate-400 mt-0.5">
                  {filteredTableData.length} billing sesuai filter
                  {activeFilterCount > 0 && <span className="text-blue-600 font-semibold"> · {activeFilterCount} filter aktif</span>}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {(activeFilterCount > 0 || sortState) && (
                  <button onClick={handleClearAll} className="flex items-center gap-1 text-[#1e3a8a] hover:text-blue-800 hover:underline text-[12px] font-semibold px-2 py-1.5 bg-transparent border-none">
                    <X size={13} /> Clear filter
                  </button>
                )}

                {/* Top / New Billing (bukan kolom tabel, jadi tetap di sini) */}
                <div className="relative flex items-center">
                  <select
                    className={`pl-3 pr-7 py-1.5 border rounded-lg text-[12px] font-semibold transition-colors appearance-none outline-none cursor-pointer ${billingMode !== 'All' ? 'border-blue-300 bg-blue-50 text-blue-700' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}
                    value={billingMode}
                    onChange={(e) => { setBillingMode(e.target.value); setCurrentPage(1); }}
                  >
                    <option value="All">All Billing</option>
                    {FILTER_OPTIONS.billing.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                  <ChevronDown size={12} className="text-slate-400 absolute right-2.5 pointer-events-none" />
                </div>

                {/* Sort berdasarkan Amount (sinkron dengan sort di header kolom AMOUNT) */}
                <div className="relative flex items-center">
                  <select
                    className={`pl-3 pr-7 py-1.5 border rounded-lg text-[12px] font-semibold transition-colors appearance-none outline-none cursor-pointer ${sortState?.key === 'total' ? 'border-blue-300 bg-blue-50 text-blue-700' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}
                    value={sortState?.key === 'total' ? sortState.dir : 'default'}
                    onChange={(e) => applySort('total', e.target.value === 'default' ? null : e.target.value)}
                    title="Sort berdasarkan Amount"
                  >
                    <option value="default">Sort: Default</option>
                    <option value="asc">Sort: Amount Lowest</option>
                    <option value="desc">Sort: Amount Highest</option>
                  </select>
                  <ChevronDown size={12} className="text-slate-400 absolute right-2.5 pointer-events-none" />
                </div>

                {/* Dropdown Download: unduh semua data sesuai filter */}
                <div className="relative">
                  <button
                    onClick={() => setIsDownloadOpen(o => !o)}
                    disabled={filteredTableData.length === 0}
                    className="flex items-center gap-1.5 pl-3 pr-2.5 py-1.5 border border-slate-200 rounded-lg text-[12px] font-semibold text-slate-600 bg-white hover:bg-slate-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Download size={12} /> Export
                    <ChevronDown size={12} className={`text-slate-400 transition-transform ${isDownloadOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {isDownloadOpen && (
                    <>
                      <div className="fixed inset-0 z-20" onClick={() => setIsDownloadOpen(false)}></div>
                      <div className="absolute right-0 mt-1 w-full min-w-[120px] bg-white border border-slate-200 rounded-lg shadow-lg z-30 overflow-hidden">
                        <button onClick={() => handleDownload('csv')} className="w-full text-left px-3 py-2 text-[12px] font-semibold text-slate-600 hover:bg-slate-50">CSV</button>
                        <button onClick={() => handleDownload('xlsx')} className="w-full text-left px-3 py-2 text-[12px] font-semibold text-slate-600 hover:bg-slate-50 border-t border-slate-100">XLSX</button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="w-full overflow-x-auto">
              {/* Kolomnya diperbanyak, min-w dilebarkan agar tidak terjepit */}
              <table className="w-full text-left border-collapse min-w-[1300px]">
                <thead className="bg-[#f8fafc]">
                  <tr>
                    {billingMode !== 'All' && (
                      <th className="py-4 px-5 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200/80">{billingMode.toUpperCase()}</th>
                    )}
                    {TABLE_COLUMNS.map(col => {
                      const isFiltered = !!colFilters[col.key];
                      const sortDir = sortState?.key === col.key ? sortState.dir : null;
                      const isOpen = openFilter?.key === col.key;
                      return (
                        <th key={col.key} className={`py-3 px-5 text-[11px] font-bold uppercase tracking-wider border-b border-slate-200/80 whitespace-nowrap ${isFiltered || sortDir ? 'text-blue-700' : 'text-slate-500'}`}>
                          <div className={`flex items-center gap-1.5 ${col.right ? 'justify-end' : ''}`}>
                            <span>{col.header}</span>
                            {/* Tombol filter ala Excel */}
                            <button
                              onClick={(e) => setOpenFilter(isOpen ? null : { key: col.key, rect: e.currentTarget.getBoundingClientRect() })}
                              title={`Filter / sort ${col.header}`}
                              className={`flex items-center gap-0.5 px-1 py-0.5 rounded border transition-colors ${isFiltered || sortDir || isOpen ? 'border-blue-300 bg-blue-50 text-blue-700' : 'border-slate-200 bg-white text-slate-400 hover:text-slate-600 hover:border-slate-300'}`}
                            >
                              {isFiltered && <Filter size={10} />}
                              {sortDir === 'asc' && <ArrowUp size={10} />}
                              {sortDir === 'desc' && <ArrowDown size={10} />}
                              {!isFiltered && !sortDir && <ChevronDown size={11} />}
                            </button>
                          </div>
                        </th>
                      );
                    })}
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
                          <td key={col.key} className={col.className}>{col.render(row)}</td>
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

            {openFilter && (
              <ColumnFilter
                key={openFilter.key}
                title={COLUMN_BY_KEY[openFilter.key].header}
                isNumber={!!COLUMN_BY_KEY[openFilter.key].number}
                options={filterOptionsFor(COLUMN_BY_KEY[openFilter.key])}
                selected={colFilters[openFilter.key] || null}
                sortDir={sortState?.key === openFilter.key ? sortState.dir : null}
                anchorRect={openFilter.rect}
                onSort={(dir) => applySort(openFilter.key, dir)}
                onApply={(values) => applyColFilter(openFilter.key, values)}
                onClose={() => setOpenFilter(null)}
              />
            )}

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
