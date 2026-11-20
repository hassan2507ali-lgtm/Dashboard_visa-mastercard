import React, { useMemo } from 'react';
import { ChevronDown } from 'lucide-react';
import { capPct } from './chartAxis';
import { QUARTERS, MONTH_RANGES, monthRangeLength, periodEndMonth } from './reportPeriod';

// ==========================================
// LAPORAN PROFITABILITAS PRINCIPAL
// Pilihan, Informasi Periode, dan tabel Segmen (Domestic / Int'l / Total + Δ)
// ==========================================

const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
const PRODUCT_OPTIONS = ['All', 'Credit Card', 'Debit Card', 'Acquiring'];
const PRINCIPAL_OPTIONS = ['Both', 'Visa', 'Mastercard'];
const SHOW_OPTIONS = ['Monthly', 'Quarterly'];
// Cumulative = YTD (Jan s.d. periode terpilih), Position = hanya periode terpilih
const TYPE_OPTIONS = ['Cumulative', 'Position'];

const pad = (n) => String(n).padStart(2, '0');
const lastDayOf = (year, monthIdx) => new Date(year, monthIdx + 1, 0).getDate();

// Rentang tanggal dari bulan awal s.d. bulan akhir (index bulan absolut: tahun * 12 + bulan, boleh lintas tahun)
const rangePeriod = (startAbs, endAbs, label) => {
  const sy = Math.floor(startAbs / 12), sm = startAbs % 12;
  const ey = Math.floor(endAbs / 12), em = endAbs % 12;
  const endDay = lastDayOf(ey, em);
  return {
    label,
    start: `${sy}-${pad(sm + 1)}-01`,
    end: `${ey}-${pad(em + 1)}-${pad(endDay)}`,
    rangeText: `1 ${MONTHS_SHORT[sm]} ${sy} s.d. ${endDay} ${MONTHS_SHORT[em]} ${ey}`,
  };
};
// Label rentang dalam satu tahun, mis. "Jan – Mar 2026"
const rangeLabel = (startAbs, endAbs) => `${MONTHS_SHORT[startAbs % 12]} – ${MONTHS_SHORT[endAbs % 12]} ${Math.floor(endAbs / 12)}`;

// Rentang tanggal berdasarkan Show, Tipe, Tahun, Bulan (rentang dari Januari) / Quarter
const buildPeriod = ({ show, type, year, month, quarter }) => {
  const y = Number(year);
  if (show === 'Monthly') {
    // Bulan = rentang dari Januari (All = Jan s.d. Des, 3 Bulan = Jan s.d. Mar, dst.)
    const startAbs = y * 12;
    const endAbs = startAbs + monthRangeLength(month) - 1;
    return rangePeriod(startAbs, endAbs, month === 'All' ? `${y}` : rangeLabel(startAbs, endAbs));
  }
  const endMonth = periodEndMonth({ show, month, quarter });
  const startMonth = type === 'Cumulative' ? 0 : endMonth - 2;
  const base = `${quarter} ${y}`;
  return rangePeriod(y * 12 + startMonth, y * 12 + endMonth, type === 'Cumulative' ? `YTD ${base}` : base);
};

// Pembanding (otomatis): (1) periode sebelumnya, (2) periode yang sama tahun lalu
const autoComparators = (sel) => {
  const y = Number(sel.year);
  // Monthly (rentang dari Januari): pembanding = rentang yang sama tahun lalu
  if (sel.show === 'Monthly') return [{ year: y - 1, month: sel.month, quarter: sel.quarter }];
  const q = QUARTERS.indexOf(sel.quarter);
  const prev = q === 0 ? { year: y - 1, month: sel.month, quarter: 'Q4' } : { year: y, month: sel.month, quarter: QUARTERS[q - 1] };
  return [prev, { year: y - 1, month: sel.month, quarter: sel.quarter }];
};

// Agregasi data per region + komponen income / cost (komponen diturunkan dari data dummy)
const emptyBucket = () => ({ sv: 0, interchange: 0, mdr: 0, kurs: 0, serviceFee: 0, icFee: 0, incentive: 0 });
// Kolom tabel: Principal "Both" -> per produk (Credit / Debit / Acquiring), Visa / Mastercard -> per region (Domestic / Int'l).
// Jenis Produk memfilter data (mis. Credit Card -> hanya transaksi Credit).
const REGION_COLUMNS = [
  { key: 'Domestic', label: 'Domestic', of: (item) => (item.region === 'International' ? null : 'Domestic') },
  { key: 'International', label: "Int'l", of: (item) => (item.region === 'International' ? 'International' : null) },
];
const PRODUCT_COLUMNS = [
  { key: 'Credit Card', label: 'Credit' },
  { key: 'Debit Card', label: 'Debit' },
  { key: 'Acquiring', label: 'Acquiring' },
].map(c => ({ ...c, of: (item) => (item.group === c.key ? c.key : null) }));
const getColumns = (principal, product) => {
  if (principal !== 'Both') return REGION_COLUMNS;
  return product === 'All' ? PRODUCT_COLUMNS : PRODUCT_COLUMNS.filter(c => c.key === product);
};

const aggregate = (db, { principal, product, start, end }) => {
  const columns = getColumns(principal, product);
  const res = { days: new Set() };
  columns.forEach(c => { res[c.key] = emptyBucket(); });
  db.forEach(item => {
    if (principal === 'Both' ? !['Visa', 'Mastercard'].includes(item.principal) : item.principal !== principal) return;
    if (item.date < start || item.date > end) return;
    if (product !== 'All' && item.group !== product) return;
    const segKey = columns.map(c => c.of(item)).find(Boolean);
    if (!segKey) return;
    const b = res[segKey];
    b.sv += item.salesVolume;
    // Rincian komponen sama dengan stacked bar di chart Dashboard
    b.interchange += item.incomeInterchange;
    b.mdr += item.incomeMdr;
    b.kurs += item.incomeKurs;
    b.serviceFee += item.costService;
    b.icFee += item.costInterchange;
    b.incentive += item.principalCost * 0.1; // Incentive Principal = 10% dari Cost (sama dengan chart Dashboard)
    res.days.add(item.date);
  });
  const total = emptyBucket();
  Object.keys(total).forEach(k => { total[k] = columns.reduce((sum, c) => sum + res[c.key][k], 0); });
  const withDerived = (b) => {
    const income = b.interchange + b.mdr + b.kurs;
    const cost = b.serviceFee + b.icFee;
    const net = income - cost;
    const netInc = net + b.incentive;
    // Rasio terhadap Sales Volume (%), dibatasi maks 3% (sama dengan chart dashboard)
    const ratio = (v) => (b.sv ? capPct((v / b.sv) * 100) : null);
    return { ...b, income, cost, net, netInc, incomeToVol: ratio(income), costToVol: ratio(cost), margin: ratio(net), marginInc: ratio(netInc) };
  };
  const out = { Total: withDerived(total), days: res.days.size };
  columns.forEach(c => { out[c.key] = withDerived(res[c.key]); });
  return out;
};

// Baris tabel Segmen (sesuai format laporan)
const ROWS = [
  { label: 'Sales Volume (off us)', key: 'sv', bold: true },
  { label: 'Income', key: 'income', bold: true },
  { label: 'a. Interchange Fee & ATM', key: 'interchange' },
  { label: 'b. MDR', key: 'mdr' },
  { label: 'c. Kurs', key: 'kurs' },
  { label: 'Income to Volume', key: 'incomeToVol', pct: true },
  { label: 'Cost', key: 'cost', bold: true },
  { label: 'a. Service Fee', key: 'serviceFee' },
  { label: 'b. Interchange Fee', key: 'icFee' },
  { label: 'Cost to Volume', key: 'costToVol', pct: true },
  { label: 'Net Profit/Loss', key: 'net', bold: true, signColor: true },
  { label: 'Margin', key: 'margin', bold: true, pct: true, signColor: true },
  { spacer: true },
  { label: 'Incentive Principal', key: 'incentive' },
  { label: 'Net Profit/Loss (with incentive)', key: 'netInc', bold: true, signColor: true },
  { label: 'Margin (with incentive)', key: 'marginInc', bold: true, pct: true, signColor: true },
];

// Format angka ringkas: Rb (ribu), Jt (juta), M (miliar), T (triliun)
const formatAmount = (v) => {
  if (!v) return '-';
  const abs = Math.abs(v);
  const units = [[1e12, 'T'], [1e9, 'M'], [1e6, 'Jt'], [1e3, 'Rb']];
  const unit = units.find(([n]) => abs >= n);
  const num = unit ? v / unit[0] : v;
  const digits = unit ? (Math.abs(num) >= 10 ? 1 : 2) : 0;
  return `${num.toLocaleString('id-ID', { minimumFractionDigits: digits, maximumFractionDigits: digits })}${unit ? ` ${unit[1]}` : ''}`;
};
const formatPct = (v) => (v === null || v === undefined ? '-' : `${v.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`);
const signed = (v, digits) => `${v > 0 ? '+' : ''}${v.toLocaleString('id-ID', { minimumFractionDigits: digits, maximumFractionDigits: digits })}`;

// Δ: perubahan % untuk nominal, selisih bps untuk rasio
const computeDelta = (row, main, comp) => {
  const a = main.Total[row.key];
  const b = comp.Total[row.key];
  if (row.pct) {
    if (a === null || b === null) return null;
    const bps = (a - b) * 100;
    return { value: bps, text: `${signed(bps, 1)} bps` };
  }
  if (!b) return null;
  const pct = ((a - b) / Math.abs(b)) * 100;
  return { value: pct, text: `${signed(pct, 1)}%` };
};

// ---------- UI (gaya web, sama dengan kartu & filter dashboard) ----------
const CARD = 'bg-white rounded-2xl border border-slate-200/60 shadow-sm p-4';
const CARD_TITLE = 'text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3';

const FieldSelect = ({ label, value, onChange, options, disabled }) => (
  <div className="flex flex-col gap-1 min-w-0">
    <label className="text-[11px] font-semibold text-slate-500">{label}</label>
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={`w-full text-[12px] font-semibold border border-slate-200 rounded-lg py-1.5 pl-3 pr-7 outline-none appearance-none transition-colors ${disabled ? 'bg-slate-50 text-slate-300 cursor-not-allowed' : 'bg-white text-slate-700 cursor-pointer hover:border-blue-400'}`}
      >
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
      <ChevronDown size={12} className="text-slate-400 absolute right-2.5 top-2 pointer-events-none" />
    </div>
  </div>
);

const InfoRow = ({ label, children }) => (
  <div className="flex justify-between gap-3 py-1.5 border-b border-slate-100 last:border-0">
    <span className="text-[12px] text-slate-500">{label}</span>
    <span className="text-[12px] font-semibold text-slate-800 text-right">{children}</span>
  </div>
);

const ProfitabilityReport = ({ db, sel, onChange }) => {
  const years = useMemo(() => [...new Set(db.map(d => d.date.slice(0, 4)))].sort(), [db]);
  const set = (key) => (v) => onChange(s => ({ ...s, [key]: v }));
  const isMonthly = sel.show === 'Monthly';

  const mainPeriod = buildPeriod(sel);
  const compPeriods = autoComparators(sel).map(c => buildPeriod({ ...sel, ...c, year: String(c.year) }));

  const mainData = aggregate(db, { ...sel, ...mainPeriod });
  const compData = compPeriods.map(p => aggregate(db, { ...sel, ...p }));
  const hasData = mainData.days > 0;
  // Kolom tabel per produk (Both) atau per region (Visa / Mastercard) + Total
  const columns = [...getColumns(sel.principal, sel.product), { key: 'Total', label: 'Total' }];

  const valueClass = (row, v) => (row.signColor && v < 0 ? 'text-rose-600' : 'text-slate-800');
  const renderVal = (row, v) => (row.pct ? formatPct(v) : formatAmount(v));
  const th = 'py-2.5 px-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider';

  return (
    <section className="flex flex-col gap-4">
      {/* Judul */}
      <div>
        <h3 className="font-bold text-[#0f172a] tracking-tight text-[15px]">Laporan Profitabilitas Principal</h3>
        <p className="text-[12px] text-slate-500 mt-0.5">
          {sel.product} – {sel.principal} · {mainPeriod.label} ({sel.show}, {sel.type})
        </p>
      </div>

      {/* 2 kartu atas: Pilihan, Informasi Periode */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className={CARD}>
          <p className={CARD_TITLE}>Pilihan</p>
          <div className="grid grid-cols-2 gap-3">
            <FieldSelect label="Jenis Produk" value={sel.product} onChange={set('product')} options={PRODUCT_OPTIONS} />
            <FieldSelect label="Principal" value={sel.principal} onChange={set('principal')} options={PRINCIPAL_OPTIONS} />
            <FieldSelect label="Show" value={sel.show} onChange={set('show')} options={SHOW_OPTIONS} />
            <FieldSelect label="Tipe" value={sel.type} onChange={set('type')} options={TYPE_OPTIONS} />
            <FieldSelect label="Tahun" value={sel.year} onChange={set('year')} options={years} />
            {isMonthly
              ? <FieldSelect label="Bulan" value={sel.month} onChange={set('month')} options={MONTH_RANGES} />
              : <FieldSelect label="Quarter" value={sel.quarter} onChange={set('quarter')} options={QUARTERS} />}
          </div>
        </div>

        <div className={CARD}>
          <p className={CARD_TITLE}>Informasi Periode</p>
          <InfoRow label="Periode">{mainPeriod.label}</InfoRow>
          <InfoRow label="Rentang">{mainPeriod.rangeText}</InfoRow>
          <InfoRow label="Hari data">{mainData.days} hari</InfoRow>
          <InfoRow label="Status">
            {hasData
              ? <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase bg-emerald-100 text-emerald-700">OK</span>
              : <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase bg-rose-100 text-rose-700">Tidak ada data</span>}
          </InfoRow>
        </div>
      </div>

      {/* Tabel Segmen */}
      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
        <div className="w-full overflow-x-auto">
          <table className="w-full border-collapse min-w-[1100px] text-[12px]">
            <thead className="bg-[#f8fafc]">
              <tr className="border-b border-slate-200/80">
                <th rowSpan={2} className={`${th} text-left w-[230px]`}>Segmen</th>
                <th colSpan={columns.length} className={`${th} text-center text-[#1e3a8a] border-l border-slate-200/80`}>{mainPeriod.label}</th>
                {compPeriods.map((p, i) => <th key={i} colSpan={columns.length + 1} className={`${th} text-center border-l border-slate-200/80`}>vs {p.label}</th>)}
              </tr>
              <tr className="border-b border-slate-200/80">
                {columns.map((c, j) => <th key={`m-${c.key}`} className={`${th} text-right ${j === 0 ? 'border-l border-slate-200/80' : ''}`}>{c.label}</th>)}
                {compPeriods.map((_, i) => [...columns.map(c => c.label), 'Δ'].map((h, j) => <th key={`${i}-${h}`} className={`${th} text-right ${j === 0 ? 'border-l border-slate-200/80' : ''}`}>{h}</th>))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {ROWS.map((row, idx) => {
                if (row.spacer) return <tr key={`sp-${idx}`} className="bg-slate-50/60"><td colSpan={1 + columns.length + compPeriods.length * (columns.length + 1)} className="h-3"></td></tr>;
                const weight = row.bold ? 'font-bold' : 'font-medium';
                const sub = !row.bold && !row.pct;
                const renderGroup = (data) => columns.map(({ key: r }, j) => {
                  const v = data[r][row.key];
                  return <td key={r} className={`py-2 px-3 text-right ${weight} ${valueClass(row, v)} ${j === 0 ? 'border-l border-slate-100' : ''}`}>{renderVal(row, v)}</td>;
                });
                return (
                  <tr key={row.key} className={`transition-colors hover:bg-slate-50/60 ${row.bold ? 'bg-white' : ''}`}>
                    <td className={`py-2 px-3 ${row.bold ? 'font-bold text-slate-800' : sub ? 'pl-6 text-slate-500' : 'text-slate-500 italic'}`}>{row.label}</td>
                    {renderGroup(mainData)}
                    {compData.map((cd, i) => {
                      const delta = computeDelta(row, mainData, cd);
                      return (
                        <React.Fragment key={i}>
                          {renderGroup(cd)}
                          <td className="py-2 px-3 text-right">
                            {delta
                              ? <span className={`px-1.5 py-0.5 rounded-md text-[11px] font-bold ${delta.value < 0 ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>{delta.text}</span>
                              : <span className="text-slate-300">-</span>}
                          </td>
                        </React.Fragment>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
};

export default ProfitabilityReport;
