import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Menu, CreditCard, Book, FileText,
  User, ChevronUp, ChevronDown, LogOut, X
} from 'lucide-react';
import { 
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, Legend
} from 'recharts';

// === IMPORT GAMBAR LOGO DARI FOLDER SRC ===
import LogoDanantara from './mandiri.png';
import LogoMandiri from './danatara.png';

import { AXIS_INTERVALS, buildPctTicks, buildAmountTicksBelowLine, formatPctTick, yAxisBase, capPct } from './chartAxis';
import { BILLING_HIGHLIGHTS, BILLING_SUMMARY, SUMMARY_STATUSES, TOP_BILLING_LIMIT } from './billingData';
import { visaMonth } from './visaPrincipalData';

// ==========================================
// 1. GENERATE DUMMY DATA UNTUK GRAFIK
// ==========================================
const generateChartData = (scale = 1) => {
  const data = [];
  // Data mulai dari tahun sebelumnya (2025) agar filter tanggal bisa mundur ke tahun lalu
  let currentDate = new Date(2025, 0, 1);
  const endDate = new Date(2026, 11, 31);
  // Target jumlah billing per bulan, dipisah antara billing Income & billing Cost
  // (masing-masing 15 - 100 / bulan, jadi total All = 30 - 200 / bulan)
  const monthlyBillingTarget = {};
  
  while (currentDate <= endDate) {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const day = currentDate.getDate();
    const monthKey = `${year}-${String(month + 1).padStart(2, '0')}`;

    // Dummy: Income & Cost dalam Rupiah (harian). Skala dibuat supaya total per bulan
    // Service Fee / Interchange Fee per principal di kisaran puluhan - ratusan Miliar.
    const incomeRaw = Math.floor((Math.random() * 10e9 + 5e9) * scale);
    const costRaw = Math.floor((Math.random() * 6e9 + 1.5e9) * scale);
    // Sales Volume: diatur supaya Cost / SV selalu 1,2% - 2,8% (maks 3%)
    const salesVolume = Math.floor(costRaw / (0.012 + Math.random() * 0.016));

    // Billing Line: target bulanan dibagi rata ke hari-hari di bulan tsb,
    // sehingga total sebulan = target (mis. 33, 100, 187)
    if (!(monthKey in monthlyBillingTarget)) {
      monthlyBillingTarget[monthKey] = {
        income: Math.floor(Math.random() * 86) + 15,
        cost: Math.floor(Math.random() * 86) + 15,
      };
    }
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const spreadDaily = (target) => Math.floor(target / daysInMonth) + (day <= target % daysInMonth ? 1 : 0);
    const billingIncomeCount = spreadDaily(monthlyBillingTarget[monthKey].income);
    const billingCostCount = spreadDaily(monthlyBillingTarget[monthKey].cost);

    data.push({
      date: new Date(currentDate),
      dateString: `${monthKey}-${String(day).padStart(2,'0')}`,
      monthKey,
      income: incomeRaw,
      cost: costRaw,
      salesVolume,
      billingIncome: billingIncomeCount, // jumlah billing yang termasuk Income
      billingCost: billingCostCount      // jumlah billing yang termasuk Cost
    });
    currentDate.setDate(currentDate.getDate() + 1);
  }
  return data;
};

// Visa: angka bulanan dari Excel (visaPrincipalData.js) dibagi rata ke hari-hari di bulan itu.
// Interchange Fee -> Cost = Interchange Fee, Income = Interchange Income.
// Service Fee     -> Cost = Service Fee, Income = 0 (Service Fee tidak punya income).
// Sales Volume = placeholder bersama (sama dengan Dashboard). Bulan tanpa data Excel dilewati.
// Jumlah billing (billingIncome / billingCost) masih dummy dari generateChartData.
const generateVisaChartData = (section) => generateChartData(1).flatMap(item => {
  const [y, m] = item.monthKey.split('-').map(Number);
  const v = visaMonth(y, m - 1);
  const cost = v && (section === 'interchange' ? v.interchangeFee : v.serviceFee);
  if (cost == null) return [];
  const days = new Date(y, m, 0).getDate();
  const income = section === 'interchange' ? (v.interchangeIncome || 0) : 0;
  return [{ ...item, cost: cost / days, income: income / days, salesVolume: v.salesVolume / days }];
});

// Data chart dipisah per principal & jenis transaksi (Service Fee / Interchange Fee)
const CHART_DB = {
  Visa: { serviceFee: generateVisaChartData('serviceFee'), interchange: generateVisaChartData('interchange') },
  Mastercard: { serviceFee: generateChartData(0.5), interchange: generateChartData(0.5) },
};
const CHART_PRINCIPALS = ['Visa', 'Mastercard'];

// Bar Service Fee ditumpuk per jenis produk.
// Visa: Debit, Credit, Acquiring (nuansa biru, sama dengan bar stacked di Dashboard).
// Mastercard: hanya Credit & Acquiring (nuansa kuning - oranye - cokelat, warna khas Mastercard).
const SERVICE_FEE_PRODUCTS = {
  Visa: [
    { key: 'debit', label: 'Debit', color: '#06b6d4' },
    { key: 'credit', label: 'Credit', color: '#6366f1' },
    { key: 'acquiring', label: 'Acquiring', color: '#1e3a8a' },
  ],
  Mastercard: [
    { key: 'credit', label: 'Credit', color: '#f59e0b' },    // kuning / amber
    { key: 'acquiring', label: 'Acquiring', color: '#9a3412' }, // oranye cokelat
  ],
};
// Dummy porsi Service Fee per produk per bulan (dibuat sekali lalu di-cache, total = 100%)
const PRODUCT_SHARE_RANGE = { debit: [0.18, 0.28], credit: [0.3, 0.42], acquiring: [0.35, 0.48] };
const productShareCache = {};
const getProductShares = (principal, monthKey) => {
  const cacheKey = `${principal}-${monthKey}`;
  if (!productShareCache[cacheKey]) {
    const products = SERVICE_FEE_PRODUCTS[principal];
    const raw = products.map(p => { const [lo, hi] = PRODUCT_SHARE_RANGE[p.key]; return lo + Math.random() * (hi - lo); });
    const total = raw.reduce((a, b) => a + b, 0);
    productShareCache[cacheKey] = Object.fromEntries(products.map((p, i) => [p.key, raw[i] / total]));
  }
  return productShareCache[cacheKey];
};

// Komponen Income (sama dengan Dashboard): Interchange Fee & ATM, MDR, Kurs.
// Urutan = urutan legend & tooltip. Tumpukan bar dari bawah: Kurs (1) -> MDR (2) -> Interchange Fee & ATM (3).
const INCOME_COMPONENTS = {
  Visa: [
    { key: 'incomeInterchange', label: 'Interchange Fee & ATM', color: '#1e3a8a' },
    { key: 'incomeMdr', label: 'MDR', color: '#6366f1' },
    { key: 'incomeKurs', label: 'Kurs', color: '#06b6d4' },
  ],
  Mastercard: [
    { key: 'incomeInterchange', label: 'Interchange Fee & ATM', color: '#9a3412' },
    { key: 'incomeMdr', label: 'MDR', color: '#ea580c' },
    { key: 'incomeKurs', label: 'Kurs', color: '#f59e0b' },
  ],
};
// Dummy MDR & Kurs per bulan, relatif terhadap Interchange Income (belum ada data asli)
const incomeFactorCache = {};
const getIncomeFactors = (principal, monthKey) => {
  const cacheKey = `${principal}-${monthKey}`;
  if (!incomeFactorCache[cacheKey]) {
    incomeFactorCache[cacheKey] = { mdr: 0.25 + Math.random() * 0.15, kurs: 0.3 + Math.random() * 0.2 };
  }
  return incomeFactorCache[cacheKey];
};

// Data harian per grid. Setiap item: value (amount bar), salesVolume, + field komponen (untuk bar stacked)
const buildSectionItems = (principal) => ({
  // --- Cost ---
  interchangeFee: CHART_DB[principal].interchange.map(item => ({ ...item, value: item.cost })),
  serviceFee: CHART_DB[principal].serviceFee.map(item => {
    const shares = getProductShares(principal, item.monthKey);
    return { ...item, value: item.cost, ...Object.fromEntries(SERVICE_FEE_PRODUCTS[principal].map(p => [p.key, item.cost * shares[p.key]])) };
  }),
  // --- Income ---
  interchangeIncome: CHART_DB[principal].interchange.map(item => ({ ...item, value: item.income })),
  totalIncome: CHART_DB[principal].interchange.map(item => {
    const f = getIncomeFactors(principal, item.monthKey);
    const incomeInterchange = item.income;
    const incomeMdr = item.income * f.mdr;
    const incomeKurs = item.income * f.kurs;
    return { ...item, incomeInterchange, incomeMdr, incomeKurs, value: incomeInterchange + incomeMdr + incomeKurs };
  }),
});
// Grid Income per komponen (bar tunggal, gaya Interchange Income): value = komponen tsb
const withIncomeComponents = (sections) => ({
  ...sections,
  ...Object.fromEntries(['incomeInterchange', 'incomeMdr', 'incomeKurs'].map(k => [k, sections.totalIncome.map(item => ({ ...item, value: item[k] }))])),
});
const SECTION_DB = Object.fromEntries(CHART_PRINCIPALS.map(p => [p, withIncomeComponents(buildSectionItems(p))]));

// Threshold per grid (AMOUNT Rupiah per bulan, dibandingkan dengan bar amount) — DUMMY, silakan ganti sesuai ketentuan.
// Cost  : batas MAKSIMAL (amount di atas threshold = melebihi batas).
// Income: target MINIMAL (amount di bawah threshold = di bawah target).
// Accumulative: threshold ikut diakumulasi (threshold bulanan x jumlah bulan berjalan).
const THRESHOLD_COLOR = '#ef4444';
// Grid per Category. Visual sama (grid 1 = bar tunggal, grid 2 = bar stacked), hanya data & teks yang berganti.
// stacks: komponen bar (urutan legend); stackFromBottom: urutan tumpukan dari bawah.
const COST_SECTIONS = [
  { key: 'interchangeFee', title: 'Interchange Fee', threshold: { Visa: 110e9, Mastercard: 80e9 } },
  { key: 'serviceFee', title: 'Service Fee', stacks: SERVICE_FEE_PRODUCTS, threshold: { Visa: 40e9, Mastercard: 80e9 } },
];
const INCOME_SECTIONS = [
  // 3 grid per principal: Interchange Fee & ATM, MDR, Selisih Kurs. Threshold Income = target MINIMAL (amount).
  // (MDR & Selisih Kurs masih dummy, relatif terhadap Interchange Income)
  { key: 'incomeInterchange', title: 'Interchange Fee & ATM', isIncome: true, threshold: { Visa: 35e9, Mastercard: 70e9 } },
  { key: 'incomeMdr', title: 'MDR', isIncome: true, threshold: { Visa: 10e9, Mastercard: 22e9 } },
  { key: 'incomeKurs', title: 'Selisih Kurs', isIncome: true, threshold: { Visa: 13e9, Mastercard: 28e9 } },
];
// All = semua grid (Cost lalu Income)
const SECTIONS_BY_VIEW = { All: [...COST_SECTIONS, ...INCOME_SECTIONS], Cost: COST_SECTIONS, Income: INCOME_SECTIONS };

const PRINCIPAL_COLOR = { Visa: '#1e3a8a', Mastercard: '#ea580c' };

// Format amount Rupiah: hanya T (Triliun) dan M (Miliar), mis. Rp 1,25 T / Rp 72,29 M / Rp 0,35 M
const formatCurrency = (value) => {
  const n = Number(value || 0);
  const abs = Math.abs(n);
  const [div, unit] = abs >= 1e12 ? [1e12, 'T'] : [1e9, 'M'];
  const num = (abs / div).toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return `${n < 0 ? '-' : ''}Rp ${num} ${unit}`;
};

// Default filter: awal tahun berjalan s/d hari ini
const toInputDate = (d) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
const TODAY = new Date();
const DEFAULT_START_DATE = `${TODAY.getFullYear()}-01-01`;
const DEFAULT_END_DATE = toInputDate(TODAY);
const DATE_MIN = CHART_DB.Mastercard.serviceFee[0].dateString;
const DATE_MAX = CHART_DB.Mastercard.serviceFee[CHART_DB.Mastercard.serviceFee.length - 1].dateString;

// Filter Tipe: Position = nilai per bulan, Accumulative = total berjalan sejak Start Date
const TYPE_OPTIONS = ['Position', 'Accumulative'];

// Filter "Tampilkan": line apa saja yang muncul di chart (Billing Line selalu tampil)
const VIEW_OPTIONS = {
  All: ['billingLine', 'income', 'cost'],
  Income: ['billingLine', 'income'],
  Cost: ['billingLine', 'cost'],
};

// ==========================================
// KOMPONEN CHART 1 GARIS (gaya Dashboard) untuk Service Fee & Interchange Fee
// Nilai garis mengikuti filter Category: Income -> Income, selain itu -> Cost
// ==========================================
// Label sumbu amount: hanya T (Triliun) dan M (Miliar), mis. 0, 0,5 M, 12 M, 1,2 T
const formatAxisAmount = (v) => {
  if (v === 0) return '0';
  const fmt = (n) => n.toLocaleString('id-ID', { maximumFractionDigits: 2 });
  return Math.abs(v) >= 1e12 ? `${fmt(v / 1e12)} T` : `${fmt(v / 1e9)} M`;
};

// Warna line % (dibedakan dari warna bar)
const RATIO_LINE_COLOR = { Visa: '#f59e0b', Mastercard: '#0f766e' };

// Pop up: bar = amount (+ rincian komponen), line = % (Cost / SV atau Income / SV)
const SimpleTooltip = ({ active, payload, label, metricLabel, stacks, ratioLabel, isIncome }) => {
  if (!active || !payload || payload.length === 0) return null;
  const row = payload[0].payload;
  const barColor = stacks ? stacks[0].color : payload.find(p => p.dataKey === 'value')?.color;
  const lineColor = payload.find(p => p.dataKey === 'ratio')?.color;
  return (
    <div className="bg-white/95 border border-slate-200 rounded-xl shadow-md px-3 py-2 text-[12px]">
      <p className="font-bold text-slate-800 mb-1">{label}</p>
      <div className="flex items-center gap-2">
        <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: barColor }}></div>
        <span className="text-slate-600 font-medium">Amount {metricLabel}:</span>
        <span className="font-bold text-slate-800">{formatCurrency(row.value)}</span>
      </div>
      {/* Rincian per komponen (bar stacked) */}
      {stacks && stacks.map(p => (
        <div key={p.key} className="flex items-center gap-2 pl-4">
          <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: p.color }}></div>
          <span className="text-slate-500">{p.label}:</span>
          <span className="font-semibold text-slate-700">{formatCurrency(row[p.key])}</span>
        </div>
      ))}
      <div className="flex items-center gap-2">
        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: lineColor }}></div>
        <span className="text-slate-600 font-medium">{ratioLabel}:</span>
        <span className="font-bold text-slate-800">{row.ratio.toLocaleString('id-ID', { maximumFractionDigits: 2 })}%</span>
      </div>
      {row.threshold != null && (
        <div className="flex items-center gap-2">
          <div className="w-2.5 border-t-2 border-dashed" style={{ borderColor: THRESHOLD_COLOR }}></div>
          <span className="text-slate-600 font-medium">Threshold:</span>
          <span className="font-bold text-slate-800">{formatCurrency(row.threshold)}</span>
          {/* Cost di atas batas / Income di bawah target -> diberi tanda merah */}
          {(isIncome ? row.value < row.threshold : row.value > row.threshold) && (
            <span className="font-semibold" style={{ color: THRESHOLD_COLOR }}>{isIncome ? '(di bawah target)' : '(melebihi)'}</span>
          )}
        </div>
      )}
    </div>
  );
};

// Grid Interchange / Service Fee (Cost) atau Interchange Income / Total Income (Income):
// bar = amount, line = % terhadap Sales Volume
const SimpleFeeChart = ({ principal, section, chartFilters }) => {
  // Label & arah warna mengikuti jenis grid (bukan filter), supaya benar saat Category = All
  const isIncome = !!section.isIncome;
  const metricLabel = isIncome ? 'Income' : 'Cost';
  const ratioLabel = isIncome ? 'Income / SV' : 'Cost / SV';
  const stacks = section.stacks ? section.stacks[principal] : null;
  const threshold = section.threshold ? section.threshold[principal] : null;
  const stacksFromBottom = stacks && section.stackFromBottom === 'reverse' ? [...stacks].reverse() : stacks;
  const items = SECTION_DB[principal][section.key];
  const isAccum = chartFilters.type === 'Accumulative';
  const barColor = PRINCIPAL_COLOR[principal];
  const ratioColor = RATIO_LINE_COLOR[principal];

  const data = useMemo(() => {
    const { startDate, endDate } = chartFilters;
    const [start, end] = startDate <= endDate ? [startDate, endDate] : [endDate, startDate];
    const sumKeys = ['value', 'salesVolume', ...(stacks || []).map(p => p.key)];
    const aggMap = {};
    items.forEach(item => {
      if ((start && item.dateString < start) || (end && item.dateString > end)) return;
      const key = item.monthKey;
      if (!aggMap[key]) {
        aggMap[key] = { sortKey: key, name: item.date.toLocaleDateString('id-ID', { month: 'short' }) };
        sumKeys.forEach(k => { aggMap[key][k] = 0; });
      }
      sumKeys.forEach(k => { aggMap[key][k] += item[k]; });
    });
    const months = Object.values(aggMap).sort((a, b) => a.sortKey.localeCompare(b.sortKey));
    // Accumulative: setiap bulan = total berjalan dari bulan pertama di rentang filter
    if (isAccum) {
      const running = Object.fromEntries(sumKeys.map(k => [k, 0]));
      months.forEach(d => {
        sumKeys.forEach(k => { running[k] += d[k]; d[k] = running[k]; });
      });
    }
    return months.map(d => ({
      ...d,
      // % amount terhadap Sales Volume, dibatasi maks 3%
      ratio: d.salesVolume ? capPct(Number(((d.value / d.salesVolume) * 100).toFixed(2))) : 0,
    }));
  }, [chartFilters, items, stacks, isAccum]);

  const last = data[data.length - 1];
  const lastVal = last ? last.value : 0;

  // MoM & YoY dihitung dari seluruh data (bukan hanya rentang filter), supaya bulan pembanding selalu ada
  const monthTotal = (monthKey) => items.reduce((sum, item) => (item.monthKey === monthKey ? sum + item.value : sum), 0);
  const shiftMonth = (monthKey, deltaMonths) => {
    const [y, m] = monthKey.split('-').map(Number);
    const d = new Date(y, m - 1 + deltaMonths, 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  };
  const pctChange = (base) => (base ? ((lastVal - base) / base) * 100 : null);
  // Accumulative: YoY = rentang tanggal yang sama tahun lalu, MoM = akumulasi s.d. bulan sebelumnya
  const shiftYear = (dateString) => `${Number(dateString.slice(0, 4)) - 1}${dateString.slice(4)}`;
  const rangeTotal = (from, to) => items.reduce((sum, item) => (item.dateString >= from && item.dateString <= to ? sum + item.value : sum), 0);
  const [rangeStart, rangeEnd] = chartFilters.startDate <= chartFilters.endDate
    ? [chartFilters.startDate, chartFilters.endDate] : [chartFilters.endDate, chartFilters.startDate];
  const yoyBase = !last ? null : isAccum
    ? rangeTotal(shiftYear(rangeStart), shiftYear(rangeEnd))
    : monthTotal(shiftMonth(last.sortKey, -12));
  const momBase = !last ? null : isAccum
    ? (data.length > 1 ? data[data.length - 2].value : null)
    : monthTotal(shiftMonth(last.sortKey, -1));
  const changeItems = last ? [
    { label: 'YoY', pct: pctChange(yoyBase) },
    { label: 'MoM', pct: pctChange(momBase) },
  ].filter(c => c.pct !== null) : [];
  // Sama seperti Main Dashboard: Cost naik = buruk, Income naik = baik. Hijau selalu ▲, merah selalu ▼
  const isGoodChange = (pct) => (pct >= 0) === isIncome;
  // Label periode: nama bulan lengkap, mis. "November 2026"
  const monthName = (key, opts) => new Date(Number(key.slice(0, 4)), Number(key.slice(5, 7)) - 1, 1).toLocaleDateString('id-ID', opts);
  const periodLabel = !last ? '-' : isAccum
    // Accumulative: rentang bulan, mis. "Januari – November 2026"
    ? (data[0].sortKey === last.sortKey ? monthName(last.sortKey, { month: 'long', year: 'numeric' })
      : `${monthName(data[0].sortKey, data[0].sortKey.slice(0, 4) === last.sortKey.slice(0, 4) ? { month: 'long' } : { month: 'long', year: 'numeric' })} – ${monthName(last.sortKey, { month: 'long', year: 'numeric' })}`)
    : monthName(last.sortKey, { month: 'long', year: 'numeric' });

  // Sumbu Y kiri (amount) & kanan (%) masing-masing 5 tick bulat, sejajar dengan grid.
  // Bar maks ~50% tinggi chart, line % diusahakan di pita atas supaya tidak bertumpuk.
  // Threshold (amount) ikut sumbu amount kiri; Accumulative = threshold bulanan x jumlah bulan berjalan
  const chartData = threshold != null ? data.map((d, i) => ({ ...d, threshold: isAccum ? threshold * (i + 1) : threshold })) : data;
  const ratios = data.map(d => d.ratio);
  const ratioLo = ratios.length ? Math.min(...ratios) : 0;
  const ratioHi = ratios.length ? Math.max(...ratios) : 3;
  const pctTicks = buildPctTicks(ratioLo, ratioHi);
  // Bar & garis threshold dijaga di bawah line % di tiap bulan (threshold selalu masuk rentang sumbu amount)
  const amtTicks = buildAmountTicksBelowLine(chartData.map(d => (d.threshold != null ? Math.max(d.value, d.threshold) : d.value)), ratios, pctTicks);
  const legendItems = [
    ...(stacks
      ? stacks.map(p => ({ value: p.label, type: 'square', color: p.color, id: p.key }))
      : [{ value: `Amount ${metricLabel}`, type: 'square', color: barColor, id: 'value' }]),
    { value: ratioLabel, type: 'line', color: ratioColor, id: 'ratio' },
    ...(threshold != null ? [{ value: 'Threshold', type: 'plainline', color: THRESHOLD_COLOR, id: 'threshold', payload: { strokeDasharray: '4 3' } }] : []),
  ];

  return (
    <div className="w-full bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-slate-200/60 h-[300px] flex flex-col">
      <div className="flex justify-between items-start gap-3">
        <div className="min-w-0">
          <p className="text-[13px] font-bold text-slate-700">{section.title}</p>
          {/* Sama seperti Dashboard: persentase (line periode terakhir) di samping amount */}
          <div className="flex items-baseline gap-1.5 mt-1">
            <p className="text-[20px] font-bold text-[#0f172a] leading-tight whitespace-nowrap">{formatCurrency(lastVal)}</p>
            {last && (
              <span className="text-[12px] font-semibold whitespace-nowrap" style={{ color: ratioColor }}>
                {last.ratio.toLocaleString('id-ID', { maximumFractionDigits: 2 })}%
              </span>
            )}
          </div>
          <p className="text-[10px] text-slate-400">{periodLabel}</p>
        </div>
        {changeItems.length > 0 && (
          <div className="flex gap-3 text-right shrink-0 pr-3">
            {changeItems.map(c => (
              <div key={c.label}>
                <p className={`text-[13px] font-bold whitespace-nowrap ${isGoodChange(c.pct) ? 'text-emerald-500' : 'text-rose-500'}`}>{isGoodChange(c.pct) ? '▲' : '▼'} {Math.abs(c.pct).toFixed(1)}%</p>
                <p className="text-[10px] text-slate-400">{c.label}</p>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="flex-1 min-h-0 mt-3">
        {data.length === 0 ? (
          <div className="h-full flex items-center justify-center text-slate-400 text-[13px] font-medium">
            Tidak ada data pada rentang tanggal yang dipilih.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 8, right: 4, bottom: 0, left: 4 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} dy={5} interval="preserveStartEnd" />
              <YAxis yAxisId="amt" {...yAxisBase} tick={{ fontSize: 10, fill: '#64748b' }} width={52} domain={[0, amtTicks[AXIS_INTERVALS]]} ticks={amtTicks} tickFormatter={formatAxisAmount} />
              <YAxis yAxisId="pct" orientation="right" {...yAxisBase} tick={{ fontSize: 10, fill: ratioColor, fontWeight: 600 }} width={44} domain={[pctTicks[0], pctTicks[AXIS_INTERVALS]]} ticks={pctTicks} tickFormatter={formatPctTick} />
              <Tooltip content={<SimpleTooltip metricLabel={isAccum ? `${metricLabel} (Accumulative)` : metricLabel} stacks={stacks} ratioLabel={ratioLabel} isIncome={isIncome} />} cursor={{ fill: '#f8fafc' }} />
              {/* Urutan legend: komponen bar, line %, lalu Threshold paling akhir (default Recharts = abjad) */}
              <Legend iconSize={8} wrapperStyle={{ fontSize: 10 }} itemSorter={(item) => {
                const order = legendItems.map(it => it.value);
                const i = order.indexOf(item.value);
                return i === -1 ? order.length : i;
              }} payload={legendItems} />
              {stacks ? (
                <>
                  {stacksFromBottom.map((p, i, arr) => (
                    <Bar key={p.key} yAxisId="amt" dataKey={p.key} name={p.label} stackId="stack" fill={p.color} radius={i === arr.length - 1 ? [3, 3, 0, 0] : 0} isAnimationActive={false} />
                  ))}
                </>
              ) : (
                <Bar yAxisId="amt" dataKey="value" name={`Amount ${metricLabel}`} fill={barColor} radius={[3, 3, 0, 0]} isAnimationActive={false} />
              )}
              <Line yAxisId="pct" type="linear" dataKey="ratio" name={ratioLabel} stroke={ratioColor} strokeWidth={2} dot={{ r: data.length > 15 ? 1.5 : 3, fill: ratioColor, strokeWidth: 0 }} activeDot={{ r: 4 }} isAnimationActive={false} />
              {threshold != null && (
                <Line yAxisId="amt" type="linear" dataKey="threshold" name="Threshold" stroke={THRESHOLD_COLOR} strokeWidth={1.5} strokeDasharray="4 3" dot={false} activeDot={false} isAnimationActive={false} />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};

// ==========================================
// BILLING (khusus Category = Cost): jumlah billing Cost per bulan (Interchange Fee + Service Fee).
// Visual sama dengan grid Interchange Fee: bar tunggal warna principal + YoY / MoM. Data jumlah billing masih dummy.
// ==========================================
// Threshold jumlah billing per bulan — DUMMY, silakan ganti sesuai ketentuan (batas MAKSIMAL, seperti Cost).
// Accumulative: threshold ikut diakumulasi (threshold bulanan x jumlah bulan berjalan).
const BILLING_THRESHOLD = { Visa: 150, Mastercard: 150 };
const BILLING_ITEMS = Object.fromEntries(CHART_PRINCIPALS.map(p => [p, [...CHART_DB[p].interchange, ...CHART_DB[p].serviceFee]]));

const BillingCountTooltip = ({ active, payload, label, barColor, isAccum }) => {
  if (!active || !payload || payload.length === 0) return null;
  const row = payload[0].payload;
  return (
    <div className="bg-white/95 border border-slate-200 rounded-xl shadow-md px-3 py-2 text-[12px]">
      <p className="font-bold text-slate-800 mb-1">{label}</p>
      <div className="flex items-center gap-2">
        <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: barColor }}></div>
        <span className="text-slate-600 font-medium">Jumlah Billing{isAccum ? ' (Accumulative)' : ''}:</span>
        <span className="font-bold text-slate-800">{row.value.toLocaleString('id-ID')}</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-2.5 border-t-2 border-dashed" style={{ borderColor: THRESHOLD_COLOR }}></div>
        <span className="text-slate-600 font-medium">Threshold:</span>
        <span className="font-bold text-slate-800">{row.threshold.toLocaleString('id-ID')}</span>
        {row.value > row.threshold && <span className="font-semibold" style={{ color: THRESHOLD_COLOR }}>(melebihi)</span>}
      </div>
    </div>
  );
};

const BillingCountChart = ({ principal, chartFilters }) => {
  const items = BILLING_ITEMS[principal];
  const isAccum = chartFilters.type === 'Accumulative';
  const barColor = PRINCIPAL_COLOR[principal];
  const [rangeStart, rangeEnd] = chartFilters.startDate <= chartFilters.endDate
    ? [chartFilters.startDate, chartFilters.endDate] : [chartFilters.endDate, chartFilters.startDate];

  const data = useMemo(() => {
    const aggMap = {};
    items.forEach(item => {
      if ((rangeStart && item.dateString < rangeStart) || (rangeEnd && item.dateString > rangeEnd)) return;
      const key = item.monthKey;
      if (!aggMap[key]) aggMap[key] = { sortKey: key, name: item.date.toLocaleDateString('id-ID', { month: 'short' }), value: 0 };
      aggMap[key].value += item.billingCost;
    });
    const months = Object.values(aggMap).sort((a, b) => a.sortKey.localeCompare(b.sortKey));
    if (isAccum) {
      let running = 0;
      months.forEach(d => { running += d.value; d.value = running; });
    }
    const monthly = BILLING_THRESHOLD[principal];
    return months.map((d, i) => ({ ...d, threshold: isAccum ? monthly * (i + 1) : monthly }));
  }, [items, rangeStart, rangeEnd, isAccum, principal]);

  const last = data[data.length - 1];
  const lastVal = last ? last.value : 0;

  // YoY & MoM (sama dengan grid Interchange Fee): dihitung dari seluruh data
  const monthTotal = (monthKey) => items.reduce((sum, item) => (item.monthKey === monthKey ? sum + item.billingCost : sum), 0);
  const shiftMonth = (monthKey, deltaMonths) => {
    const [y, m] = monthKey.split('-').map(Number);
    const d = new Date(y, m - 1 + deltaMonths, 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  };
  const shiftYear = (dateString) => `${Number(dateString.slice(0, 4)) - 1}${dateString.slice(4)}`;
  const rangeTotal = (from, to) => items.reduce((sum, item) => (item.dateString >= from && item.dateString <= to ? sum + item.billingCost : sum), 0);
  const pctChange = (base) => (base ? ((lastVal - base) / base) * 100 : null);
  const yoyBase = !last ? null : isAccum ? rangeTotal(shiftYear(rangeStart), shiftYear(rangeEnd)) : monthTotal(shiftMonth(last.sortKey, -12));
  const momBase = !last ? null : isAccum ? (data.length > 1 ? data[data.length - 2].value : null) : monthTotal(shiftMonth(last.sortKey, -1));
  const changeItems = last ? [
    { label: 'YoY', pct: pctChange(yoyBase) },
    { label: 'MoM', pct: pctChange(momBase) },
  ].filter(c => c.pct !== null) : [];
  // Billing termasuk Cost: naik = buruk (merah ▼), turun = baik (hijau ▲), sama dengan Interchange Fee
  const isGoodChange = (pct) => pct < 0;

  const monthName = (key, opts) => new Date(Number(key.slice(0, 4)), Number(key.slice(5, 7)) - 1, 1).toLocaleDateString('id-ID', opts);
  const periodLabel = !last ? '-' : isAccum
    ? (data[0].sortKey === last.sortKey ? monthName(last.sortKey, { month: 'long', year: 'numeric' })
      : `${monthName(data[0].sortKey, data[0].sortKey.slice(0, 4) === last.sortKey.slice(0, 4) ? { month: 'long' } : { month: 'long', year: 'numeric' })} – ${monthName(last.sortKey, { month: 'long', year: 'numeric' })}`)
    : monthName(last.sortKey, { month: 'long', year: 'numeric' });

  return (
    <div className="w-full bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-slate-200/60 h-[300px] flex flex-col">
      <div className="flex justify-between items-start gap-3">
        <div className="min-w-0">
          <p className="text-[13px] font-bold text-slate-700">Billing</p>
          <div className="flex items-baseline gap-1.5 mt-1">
            <p className="text-[20px] font-bold text-[#0f172a] leading-tight whitespace-nowrap">{lastVal.toLocaleString('id-ID')}</p>
            <span className="text-[12px] font-semibold text-slate-400 whitespace-nowrap">billing</span>
          </div>
          <p className="text-[10px] text-slate-400">{periodLabel}</p>
        </div>
        {changeItems.length > 0 && (
          <div className="flex gap-3 text-right shrink-0 pr-3">
            {changeItems.map(c => (
              <div key={c.label}>
                <p className={`text-[13px] font-bold whitespace-nowrap ${isGoodChange(c.pct) ? 'text-emerald-500' : 'text-rose-500'}`}>{isGoodChange(c.pct) ? '▲' : '▼'} {Math.abs(c.pct).toFixed(1)}%</p>
                <p className="text-[10px] text-slate-400">{c.label}</p>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="flex-1 min-h-0 mt-3">
        {data.length === 0 ? (
          <div className="h-full flex items-center justify-center text-slate-400 text-[13px] font-medium">
            Tidak ada data pada rentang tanggal yang dipilih.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={{ top: 8, right: 4, bottom: 0, left: 4 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} dy={5} interval="preserveStartEnd" />
              <YAxis {...yAxisBase} tick={{ fontSize: 10, fill: '#64748b' }} width={52} allowDecimals={false} tickFormatter={(v) => v.toLocaleString('id-ID')} />
              <Tooltip content={<BillingCountTooltip barColor={barColor} isAccum={isAccum} />} cursor={{ fill: '#f8fafc' }} />
              <Legend iconSize={8} wrapperStyle={{ fontSize: 10 }} payload={[
                { value: 'Jumlah Billing', type: 'square', color: barColor, id: 'value' },
                { value: 'Threshold', type: 'plainline', color: THRESHOLD_COLOR, id: 'threshold', payload: { strokeDasharray: '4 3' } },
              ]} />
              <Bar dataKey="value" name="Jumlah Billing" fill={barColor} radius={[3, 3, 0, 0]} isAnimationActive={false} />
              <Line type="linear" dataKey="threshold" name="Threshold" stroke={THRESHOLD_COLOR} strokeWidth={1.5} strokeDasharray="4 3" dot={false} activeDot={false} isAnimationActive={false} />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};

// ==========================================
// KARTU TOP BILLING / NEW BILLING
// Klik kartu -> buka halaman Detail Billing dengan filter principal + jenis billing
// ==========================================
const BillingListCard = ({ title, subtitle, items, accent, emptyText, onOpen }) => (
  <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-slate-200/60 flex flex-col h-full">
    <button
      type="button"
      onClick={onOpen}
      className="flex justify-between items-baseline mb-3 text-left group/title"
      title="Lihat di tabel Detail Billing"
    >
      <p className="text-[13px] font-bold text-slate-700 group-hover/title:text-blue-600 transition-colors">{title} <span className="text-slate-300 group-hover/title:text-blue-500">→</span></p>
      <p className="text-[10px] text-slate-400">{subtitle}</p>
    </button>
    {items.length === 0 ? (
      <p className="text-[12px] text-slate-400 py-6 text-center">{emptyText}</p>
    ) : (
      <ol className="flex flex-col divide-y divide-slate-100">
        {items.map((b, i) => (
          <li key={`${b.billingLine}-${i}`} className="flex items-center gap-3 py-2">
            <span className="w-6 h-6 shrink-0 rounded-full flex items-center justify-center text-[11px] font-bold text-white" style={{ backgroundColor: accent }}>{i + 1}</span>
            <div className="min-w-0 flex-1">
              <p className="text-[12px] font-bold text-slate-800 truncate" title={b.description}>{b.description}</p>
              <p className="text-[10px] text-slate-400 truncate" title={`${b.billingLine} · ${b.jenis}`}>{b.billingLine} · {b.jenis}</p>
            </div>
            <span className="text-[12px] font-bold text-slate-800 shrink-0">{formatCurrency(b.total)}</span>
          </li>
        ))}
      </ol>
    )}
  </div>
);

// ==========================================
// KARTU SUMMARY (per principal):
// atas  = 3 kartu kecil Total Cost, Interchange Fee, Service Fee
// bawah = tube oval New | Existing (label di dalam tube)
// ==========================================
const NEW_COLOR = '#10b981';
const EXISTING_COLOR = '#64748b';
const BillingSummaryCard = ({ principal, summary }) => {
  const accent = PRINCIPAL_COLOR[principal];
  const totalCount = SUMMARY_STATUSES.reduce((sum, st) => sum + summary[st].count, 0);
  const pct = (n) => (totalCount ? (n / totalCount) * 100 : 0);
  const STATUS_COLOR = { New: NEW_COLOR, Existing: EXISTING_COLOR };
  const parts = SUMMARY_STATUSES.map(st => ({ label: st, ...summary[st], color: STATUS_COLOR[st] }));
  const rp = formatCurrency;
  const miniCards = [
    { label: 'Total Cost', ...summary.total, highlight: true },
    { label: 'Interchange Fee', ...summary.interchange },
    { label: 'Service Fee', ...summary.serviceFee },
  ];
  return (
    <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-slate-200/60 relative overflow-hidden h-full flex flex-col justify-center">
      <div className="absolute top-0 left-0 w-full h-[3px]" style={{ backgroundColor: accent }}></div>
      <p className="text-[13px] font-bold text-slate-700 text-center mb-4 pb-3 border-b border-slate-100">Summary</p>

      {/* 3 kartu kecil */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {miniCards.map(c => (
          <div key={c.label} className="rounded-xl border border-slate-200/70 bg-slate-50/60 px-3 py-2.5 min-w-0">
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider truncate">{c.label}</p>
            <p className="text-[17px] font-bold leading-tight mt-1 truncate" style={{ color: c.highlight ? accent : '#0f172a' }} title={`Eqv IDR ${c.amount.toLocaleString('id-ID')}`}>{rp(c.amount)}</p>
            <p className="text-[11px] font-semibold text-slate-400 mt-0.5">{c.count.toLocaleString('id-ID')} item</p>
          </div>
        ))}
      </div>

      {/* Tube oval New | Existing (satu tube menyatu) — tipis, lebar mengikuti jumlah item, label di dalam tube */}
      <div className="flex h-6 w-full mt-4 rounded-full overflow-hidden bg-slate-100 shadow-sm">
        {parts.map(p => (
          <div
            key={p.label}
            className="flex items-center justify-center gap-1 px-2.5 text-white text-[10.5px] font-bold tracking-wide whitespace-nowrap"
            style={{ flex: `${Math.max(p.count, 0.0001)} 1 0`, minWidth: 92, background: `linear-gradient(180deg, ${p.color}e6, ${p.color})` }}
            title={`${p.label}: ${p.count} item · Eqv IDR ${p.amount.toLocaleString('id-ID')}`}
          >
            {p.label}<span className="font-semibold opacity-85">· {p.count.toLocaleString('id-ID')} ({pct(p.count).toFixed(0)}%)</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const DetailCost = () => {
  const navigate = useNavigate();

  // ==========================================
  // 3. STATE MANAGEMENT
  // ==========================================
  const [chartFilters, setChartFilters] = useState({
    startDate: DEFAULT_START_DATE, endDate: DEFAULT_END_DATE, view: 'All', type: 'Position'
  });

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const handleLogout = () => alert("Logout berhasil!");
  const isIncomeView = chartFilters.view === 'Income';
  const sections = SECTIONS_BY_VIEW[chartFilters.view] || COST_SECTIONS;
  const isCostView = chartFilters.view === 'Cost';


  // ==========================================
  // 7. RENDER UI
  // ==========================================
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
            <button className="text-blue-600 transition-colors" title="Performance Monitoring"><Book size={24} strokeWidth={1.5} /></button>
            <button onClick={() => navigate('/detail-billing')} className="text-slate-400 hover:text-blue-600 transition-colors" title="Monitoring fee"><FileText size={24} strokeWidth={1.5} /></button>
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
          <h1 className="font-bold text-lg text-slate-900 tracking-tight">Detail Cost</h1>
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

          {/* SECTION 1: CHART FILTERS (rata kanan, ukuran ringkas) */}
          <div className="flex justify-end mb-6">
            <div className="flex flex-wrap items-end gap-3 bg-white px-4 py-3 rounded-xl shadow-sm border border-slate-200/60 w-full sm:w-auto">
              <div className="flex flex-col gap-1 flex-1 sm:flex-none sm:w-[150px]">
                <label className="text-[11px] font-semibold text-slate-500">Start Date</label>
                <input
                  type="date"
                  min={DATE_MIN} max={DATE_MAX}
                  className="w-full border border-slate-300 rounded-md px-2 py-1 text-[12px] font-medium text-slate-700 bg-white outline-none focus:border-blue-400 cursor-pointer"
                  value={chartFilters.startDate}
                  onChange={(e) => setChartFilters({...chartFilters, startDate: e.target.value})}
                />
              </div>

              <div className="flex flex-col gap-1 flex-1 sm:flex-none sm:w-[150px]">
                <label className="text-[11px] font-semibold text-slate-500">End Date</label>
                <input
                  type="date"
                  min={DATE_MIN} max={DATE_MAX}
                  className="w-full border border-slate-300 rounded-md px-2 py-1 text-[12px] font-medium text-slate-700 bg-white outline-none focus:border-blue-400 cursor-pointer"
                  value={chartFilters.endDate}
                  onChange={(e) => setChartFilters({...chartFilters, endDate: e.target.value})}
                />
              </div>

              <div className="flex flex-col gap-1 flex-1 sm:flex-none sm:w-[130px]">
                <label className="text-[11px] font-semibold text-slate-500">Category</label>
                <div className="relative flex items-center">
                  <select
                    className="w-full border border-slate-300 rounded-md px-2 py-1 pr-7 text-[12px] font-medium text-slate-700 bg-white outline-none focus:border-blue-400 cursor-pointer appearance-none"
                    value={chartFilters.view}
                    onChange={(e) => setChartFilters({...chartFilters, view: e.target.value})}
                  >
                    {Object.keys(VIEW_OPTIONS).map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                  <ChevronDown size={14} className="text-slate-500 absolute right-2 pointer-events-none" />
                </div>
              </div>

              <div className="flex flex-col gap-1 flex-1 sm:flex-none sm:w-[130px]">
                <label className="text-[11px] font-semibold text-slate-500">Tipe</label>
                <div className="relative flex items-center">
                  <select
                    className="w-full border border-slate-300 rounded-md px-2 py-1 pr-7 text-[12px] font-medium text-slate-700 bg-white outline-none focus:border-blue-400 cursor-pointer appearance-none"
                    value={chartFilters.type}
                    onChange={(e) => setChartFilters({...chartFilters, type: e.target.value})}
                  >
                    {TYPE_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                  <ChevronDown size={14} className="text-slate-500 absolute right-2 pointer-events-none" />
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 2: LINE CHART PER PRINCIPAL (kiri Visa, kanan Mastercard; Interchange Fee, Service Fee, Summary, Top/New Billing) */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 mb-8">
            {CHART_PRINCIPALS.map(principal => (
              <div key={principal} className="flex flex-col gap-5 min-w-0 xl:grid xl:grid-rows-subgrid" style={{ gridRow: `span ${(isIncomeView ? 1 : 3) + sections.length + (isCostView ? 1 : 0)}` }}>
                <h2 className="text-[16px] font-bold text-slate-900 tracking-tight flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: principal === 'Visa' ? '#1e3a8a' : '#ea580c' }}></span>
                  {principal}
                </h2>

                {/* Category Income -> grid versi Income, selain itu -> grid versi Cost */}
                {sections.map(section => (
                  <SimpleFeeChart
                    key={section.key}
                    principal={principal}
                    section={section}
                    chartFilters={chartFilters}
                  />
                ))}

                {/* Category Cost: Grafik Billing di bawah Service Fee */}
                {isCostView && <BillingCountChart principal={principal} chartFilters={chartFilters} />}

                {/* Category Income: Summary, Top Billing & New Billing disembunyikan */}
                {!isIncomeView && (<>
                {/* Summary (di tengah, setelah chart Service Fee): Total Cost, Interchange Fee, Service Fee + New | Existing */}
                <BillingSummaryCard principal={principal} summary={BILLING_SUMMARY[principal]} />

                {/* Top Billing & New Billing */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch">
                  <BillingListCard
                    title="Top Billing"
                    subtitle={`Top ${TOP_BILLING_LIMIT} · Eqv IDR`}
                    items={BILLING_HIGHLIGHTS[principal].top}
                    accent={PRINCIPAL_COLOR[principal]}
                    emptyText="Belum ada billing."
                    onOpen={() => navigate('/detail-billing', { state: { filters: { principal, billing: 'Top Billing' } } })}
                  />
                  <BillingListCard
                    title="New Billing"
                    subtitle={`Baru di ${BILLING_HIGHLIGHTS[principal].lastMonthName}`}
                    items={BILLING_HIGHLIGHTS[principal].newBilling}
                    accent={NEW_COLOR}
                    emptyText="Tidak ada billing baru."
                    onOpen={() => navigate('/detail-billing', { state: { filters: { principal, billing: 'New Billing' } } })}
                  />
                </div>
                </>)}
              </div>
            ))}
          </div>

        </div>
      </main>
    </div>
  );
};

export default DetailCost;