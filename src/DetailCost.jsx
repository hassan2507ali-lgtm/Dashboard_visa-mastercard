import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Menu, CreditCard, Book, ShoppingCart, FileText, 
  Calendar as CalendarIcon, User, ChevronUp, ChevronDown, LogOut, 
  Filter, Settings2, X, ChevronLeft, ChevronRight
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer 
} from 'recharts';

// === IMPORT GAMBAR LOGO DARI FOLDER SRC ===
import LogoDanantara from './mandiri.png';
import LogoMandiri from './danatara.png';

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

    // Dummy: Income & Cost dalam Rupiah
    const incomeRaw = Math.floor((Math.random() * 40000000 + 20000000) * scale);
    const costRaw = Math.floor((Math.random() * 25000000 + 5000000) * scale);

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
      billingIncome: billingIncomeCount, // jumlah billing yang termasuk Income
      billingCost: billingCostCount      // jumlah billing yang termasuk Cost
    });
    currentDate.setDate(currentDate.getDate() + 1);
  }
  return data;
};

// Data chart dipisah per principal & jenis transaksi (Service Fee / Interchange Fee)
const CHART_DB = {
  Visa: { serviceFee: generateChartData(0.6), interchange: generateChartData(0.4) },
  Mastercard: { serviceFee: generateChartData(0.5), interchange: generateChartData(0.5) },
};
const CHART_PRINCIPALS = ['Visa', 'Mastercard'];
const CHART_SECTIONS = [
  { key: 'total', title: 'Total', sources: ['serviceFee', 'interchange'] },
  { key: 'serviceFee', title: 'Service Fee', sources: ['serviceFee'] },
  { key: 'interchange', title: 'Interchange Fee', sources: ['interchange'] },
];

// ==========================================
// 2. GENERATE DUMMY DATA UNTUK TABEL BARU (SESUAI EXCEL BARU)
// ==========================================
const TABLE_TEMPLATES = [
  { jenis: 'Interchange', tagging: 'Interchange Local', principal: 'Mastercard', group: 'Acquiring', status: 'Current Billing', ica: '-', billingLine: 'Interchange Local', desc: 'Mastercard Local', feeType: '-', category: '-', subCategory: '-' },
  { jenis: 'Interchange', tagging: 'Interchange International', principal: 'Mastercard', group: 'Acquiring', status: 'Current Billing', ica: '-', billingLine: 'Interchange International', desc: 'Mastercard International', feeType: '-', category: '-', subCategory: '-' },
  { jenis: 'Service Fee', tagging: 'Weekly', principal: 'Mastercard', group: '-', status: 'Current Billing', ica: '12375', billingLine: '2LS2000', desc: 'SMS Acquirer Non-Local Currency Fee', feeType: 'Acquirer Fees', category: 'Other Acquiring Services', subCategory: 'Currency Settlement' },
  { jenis: 'Service Fee', tagging: 'Daily', principal: 'Visa', group: 'Credit', status: 'Current Billing', ica: '-', billingLine: 'Daily', desc: 'Daily Service Visa Credit', feeType: '-', category: '-', subCategory: '-' },
  { jenis: 'Service Fee', tagging: 'Daily', principal: 'Visa', group: 'Debit', status: 'Current Billing', ica: '-', billingLine: 'Daily', desc: 'Daily Service Visa Debit', feeType: '-', category: '-', subCategory: '-' },
  { jenis: 'Service Fee', tagging: 'MTI', principal: 'Visa', group: 'Acquiring', status: 'Current Billing', ica: '-', billingLine: 'MTI', desc: 'Biaya Acquiring MTI', feeType: '-', category: '-', subCategory: '-' },
  { jenis: 'Service Fee', tagging: 'Monthly', principal: 'Visa', group: '-', status: 'Current Billing', ica: '-', billingLine: '4M6163460', desc: 'VISA ADVANCED AUTHORISATION AND VISA RISK MANAGER - DC', feeType: '-', category: '-', subCategory: '-' },
  { jenis: 'Service Fee', tagging: 'Lisence', principal: 'Visa', group: '-', status: 'Current Billing', ica: '-', billingLine: '4B1102010', desc: 'ACQUIRING LICENSE FEES - INTERNATIONAL', feeType: 'License Fees', category: 'License Fees', subCategory: 'Acquirer License Fee' },
  { jenis: 'Service Fee', tagging: 'Quarterly', principal: 'Visa', group: '-', status: 'Current Billing', ica: '-', billingLine: '4CSF03100', desc: 'VISA GOLD CARD FEES - CONSUMER PRODUCTS', feeType: '-', category: '-', subCategory: '-' },
];

const NEW_BILLING_TEMPLATES = [
  { jenis: 'Service Fee', tagging: 'Monthly', principal: 'Visa', group: '-', status: 'Current Billing', ica: '-', billingLine: '4M7201150', desc: 'VISA TOKEN SERVICE - PROVISIONING FEE', feeType: '-', category: '-', subCategory: '-' },
  { jenis: 'Service Fee', tagging: 'Monthly', principal: 'Visa', group: '-', status: 'Current Billing', ica: '-', billingLine: '4M7305020', desc: 'VISA DIRECT - ORIGINATION FEE', feeType: '-', category: '-', subCategory: '-' },
  { jenis: 'Service Fee', tagging: 'Weekly', principal: 'Mastercard', group: '-', status: 'Current Billing', ica: '12375', billingLine: '2LS3100', desc: 'MDES Token Lifecycle Management Fee', feeType: 'Issuer Fees', category: 'Digital Services', subCategory: 'Tokenization' },
  { jenis: 'Service Fee', tagging: 'Weekly', principal: 'Mastercard', group: '-', status: 'Current Billing', ica: '12375', billingLine: '2LS4205', desc: 'Decision Intelligence Scoring Fee', feeType: 'Issuer Fees', category: 'Fraud & Security', subCategory: 'Risk Scoring' },
];

const generateTableData = () => {
  const data = [];
  const months = ['Januari 2026', 'Februari 2026', 'Maret 2026', 'April 2026', 'Mei 2026', 'Juni 2026'];
  
  for (let i = 0; i < 75; i++) {
    const template = TABLE_TEMPLATES[Math.floor(Math.random() * TABLE_TEMPLATES.length)];
    const month = months[Math.floor(Math.random() * months.length)];
    const rawAmount = (Math.random() * 500000000) + 1000000;
    
    // Eqv Idr bisa berbeda jika ada rate exchange, disimulasikan secara acak
    const isUsd = Math.random() > 0.8;
    const eqvIdr = isUsd ? rawAmount * 15500 : rawAmount;

    // Buat format tanggal dummy sesuai dengan bulan terpilih (Contoh: 15-Jan-2026)
    const day = Math.floor(Math.random() * 28) + 1;
    const shortMonth = month.substring(0, 3);
    const year = month.slice(-4);
    const tanggal = `${day}-${shortMonth}-${year}`;

    data.push({
      id: `TRX-${10000 + i}`,
      jenisTransaksi: template.jenis,
      tagging: template.tagging,
      principal: template.principal,
      group: template.group,
      status: template.status,
      tanggal: tanggal,
      month: month, // Digunakan untuk filter logika Start/End Periode
      ica: template.ica,
      billingLine: template.billingLine,
      description: template.desc,
      total: rawAmount,
      eqvIdr: eqvIdr,
      principalFeeType: template.feeType,
      principalCategory: template.category,
      principalSubCategory: template.subCategory
    });
  }

  // Billing baru: hanya muncul di bulan terakhir (Juni 2026) -> dipakai untuk "New Billing"
  NEW_BILLING_TEMPLATES.forEach((template, i) => {
    const rawAmount = (Math.random() * 300000000) + 5000000;
    data.push({
      id: `TRX-NEW-${i}`,
      jenisTransaksi: template.jenis,
      tagging: template.tagging,
      principal: template.principal,
      group: template.group,
      status: template.status,
      tanggal: `${Math.floor(Math.random() * 28) + 1}-Jun-2026`,
      month: 'Juni 2026',
      ica: template.ica,
      billingLine: template.billingLine,
      description: template.desc,
      total: rawAmount,
      eqvIdr: rawAmount,
      principalFeeType: template.feeType,
      principalCategory: template.category,
      principalSubCategory: template.subCategory
    });
  });
  return data;
};

const TABLE_DB = generateTableData();

// ==========================================
// RINGKASAN DETAIL BILLING: TOP BILLING & NEW BILLING PER PRINCIPAL
// Top Billing  = billing line dengan total Eqv IDR terbesar (top 5)
// New Billing  = billing line yang pertama kali muncul di bulan terakhir data
// ==========================================
const TOP_BILLING_LIMIT = 5;
const buildBillingHighlights = (principal) => {
  const rows = TABLE_DB.filter(r => r.principal === principal);
  const lastMonthIdx = Math.max(...TABLE_DB.map(r => MONTH_ORDER[r.month] || 0));
  const lastMonthName = Object.keys(MONTH_ORDER).find(m => MONTH_ORDER[m] === lastMonthIdx);

  const byLine = {};
  rows.forEach(r => {
    const key = `${r.billingLine}|${r.description}`;
    if (!byLine[key]) {
      byLine[key] = { billingLine: r.billingLine, description: r.description, jenis: r.jenisTransaksi, total: 0, count: 0, firstMonth: 99 };
    }
    byLine[key].total += r.eqvIdr;
    byLine[key].count += 1;
    byLine[key].firstMonth = Math.min(byLine[key].firstMonth, MONTH_ORDER[r.month] || 99);
  });

  const all = Object.values(byLine);
  return {
    lastMonthName,
    top: [...all].sort((a, b) => b.total - a.total).slice(0, TOP_BILLING_LIMIT),
    newBilling: all.filter(b => b.firstMonth === lastMonthIdx).sort((a, b) => b.total - a.total),
  };
};

// Opsi dropdown disesuaikan dengan gambar
const FILTER_OPTIONS = {
  jenisTransaksi: ['Interchange', 'Service Fee'],
  tagging: ['Interchange Local', 'Interchange International', 'Weekly', 'Daily', 'MTI', 'Monthly', 'Lisence', 'Quarterly'],
  principal: ['Visa', 'Mastercard'],
  group: ['Acquiring', 'Credit', 'Debit'],
  month: ['Januari 2026', 'Februari 2026', 'Maret 2026', 'April 2026', 'Mei 2026', 'Juni 2026']
};

// Logika pemetaan bulan untuk komparasi rentang tanggal Start & End
const MONTH_ORDER = {
  'Januari 2026': 1,
  'Februari 2026': 2,
  'Maret 2026': 3,
  'April 2026': 4,
  'Mei 2026': 5,
  'Juni 2026': 6,
};

const BILLING_HIGHLIGHTS = {
  Visa: buildBillingHighlights('Visa'),
  Mastercard: buildBillingHighlights('Mastercard'),
};

const PRINCIPAL_COLOR = { Visa: '#1e3a8a', Mastercard: '#ea580c' };

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

// Warna line chart (mengikuti referensi: biru tua, oranye, biru muda)
const LINE_SERIES = [
  { key: 'billingLine', name: 'Billing Line', color: '#4A6FA5', axis: 'right', labelPos: 'top', labelColor: '#4A6FA5' },
  { key: 'income', name: 'Income', color: '#ED7D31', axis: 'left', labelPos: 'top', labelColor: '#D9661F' },
  { key: 'cost', name: 'Cost', color: '#8EC3EA', axis: 'left', labelPos: 'bottom', labelColor: '#3B8FD0' }, // label lebih gelap agar terbaca
];

// Label nilai di setiap titik (dot) line chart
// position: 'top' = di atas titik, 'bottom' = di bawah titik
const makePointLabel = (formatter, color, position = 'top') => (props) => {
  const { x, y, value } = props;
  if (value == null) return null;
  return (
    <text x={x} y={position === 'top' ? y - 12 : y + 20} fill={color} fontSize={10} fontWeight={700} textAnchor="middle">
      {formatter(value)}
    </text>
  );
};

// ==========================================
// THRESHOLD (khusus Billing Line)
// Garis hitam putus-putus yang mengikuti naik-turun Billing Line (digeser sedikit ke bawah),
// di ujung kanan ditampilkan rata-rata Billing Line sesuai hasil filter.
// ==========================================
const THRESHOLD_COLOR = '#111827';
const THRESHOLD_GAP_RATIO = 0.3; // jarak Billing Line -> Threshold (relatif terhadap rentang billing)

const formatAvg = (value) => {
  const rounded = Math.round(value * 10) / 10;
  return rounded >= 1000 ? formatBilling(rounded) : rounded.toLocaleString('id-ID', { maximumFractionDigits: 1 });
};

// Label rata-rata, hanya di titik paling kanan
const makeThresholdEndLabel = (lastIndex, avg) => (props) => {
  const { x, y, index } = props;
  if (index !== lastIndex) return null;
  return (
    <text x={x + 10} y={y + 4} fill={THRESHOLD_COLOR} fontSize={11} fontWeight={700} textAnchor="start">
      Avg {formatAvg(avg)}
    </text>
  );
};

// Pop up tooltip: nilai per bulan + ringkasan Threshold dari hasil filter
const ChartTooltip = ({ active, payload, label, summary, data }) => {
  if (!active || !payload || payload.length === 0) return null;
  const row = payload[0].payload;
  const items = payload.filter(p => p.dataKey !== 'threshold');

  // Selisih bulan yang di-hover ke bulan berikutnya (mis. Feb -> Mar)
  const idx = data.findIndex(d => d.sortKey === row.sortKey);
  const next = idx >= 0 ? data[idx + 1] : undefined;
  const diffNext = next ? next.billingLine - row.billingLine : null;

  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-md px-3 py-2 text-[12px] min-w-[220px]">
      <div className="font-bold text-slate-800 mb-1">{label}</div>
      {items.map(p => (
        <div key={p.dataKey} className="flex justify-between gap-4" style={{ color: p.color }}>
          <span className="font-semibold">{p.name}</span>
          <span className="font-bold">{p.dataKey === 'billingLine' ? formatBilling(p.value) : formatCurrency(p.value)}</span>
        </div>
      ))}

      <div className="border-t border-dashed border-slate-300 mt-2 pt-2">
        
        <div className="flex justify-between gap-4 text-slate-600"><span>Periode</span><span className="font-semibold text-slate-800">{summary.periodLabel}</span></div>
        <div className="flex justify-between gap-4 text-slate-600"><span>Jumlah bulan</span><span className="font-semibold text-slate-800">{summary.count}</span></div>
        <div className="flex justify-between gap-4 text-slate-600"><span>Total billing</span><span className="font-semibold text-slate-800">{formatBilling(summary.total)}</span></div>
        <div className="flex justify-between gap-4 text-slate-600"><span>Rata-rata billing</span><span className="font-bold text-slate-900">{formatAvg(summary.avg)}</span></div>
        <div className="flex justify-between gap-4 text-slate-600">
          <span>{next ? `${label} → ${next.dateLabel}` : 'Bulan berikutnya'}</span>
          {diffNext === null ? (
            <span className="font-semibold text-slate-400">-</span>
          ) : (
            // Selisih = bulan berikutnya - bulan ini (mis. Jan 120, Feb 130 -> +10; Feb 120, Mar 90 -> -30)
            <span className={`font-bold ${diffNext > 0 ? 'text-emerald-600' : diffNext < 0 ? 'text-rose-600' : 'text-slate-500'}`}>
              {diffNext > 0 ? '+' : diffNext < 0 ? '-' : ''}{Math.abs(diffNext).toLocaleString('id-ID')}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

// Default filter: awal tahun berjalan s/d hari ini
const toInputDate = (d) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
const TODAY = new Date();
const DEFAULT_START_DATE = `${TODAY.getFullYear()}-01-01`;
const DEFAULT_END_DATE = toInputDate(TODAY);
const DATE_MIN = CHART_DB.Visa.serviceFee[0].dateString;
const DATE_MAX = CHART_DB.Visa.serviceFee[CHART_DB.Visa.serviceFee.length - 1].dateString;

// Filter "Tampilkan": line apa saja yang muncul di chart (Billing Line selalu tampil)
const VIEW_OPTIONS = {
  All: ['billingLine', 'income', 'cost'],
  Income: ['billingLine', 'income'],
  Cost: ['billingLine', 'cost'],
};

// Jika rentang tanggal sangat panjang, label per titik disembunyikan agar tidak menumpuk
const MAX_POINTS_WITH_LABEL = 12;

const formatDecimal = (num) => {
  return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

// ==========================================
// KOMPONEN CHART 1 GARIS (gaya Dashboard) untuk Service Fee & Interchange Fee
// Nilai garis mengikuti filter Category: Income -> Income, selain itu -> Cost
// ==========================================
const SimpleTooltip = ({ active, payload, label }) => {
  if (!active || !payload || payload.length === 0) return null;
  const entry = payload[0];
  return (
    <div className="bg-white/95 border border-slate-200 rounded-xl shadow-md px-3 py-2 text-[12px]">
      <p className="font-bold text-slate-800 mb-1">{label}</p>
      <div className="flex items-center gap-2">
        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }}></div>
        <span className="text-slate-600 font-medium">{entry.name}:</span>
        <span className="font-bold text-slate-800">{formatCurrency(entry.value)}</span>
      </div>
    </div>
  );
};

const SimpleFeeChart = ({ principal, title, sources, chartFilters }) => {
  const metricKey = chartFilters.view === 'Income' ? 'income' : 'cost';
  const metricLabel = metricKey === 'income' ? 'Income' : 'Cost';
  const lineColor = PRINCIPAL_COLOR[principal];

  const data = useMemo(() => {
    const { startDate, endDate } = chartFilters;
    const [start, end] = startDate <= endDate ? [startDate, endDate] : [endDate, startDate];
    const aggMap = {};
    sources.flatMap(src => CHART_DB[principal][src]).forEach(item => {
      if ((start && item.dateString < start) || (end && item.dateString > end)) return;
      const key = item.monthKey;
      if (!aggMap[key]) {
        aggMap[key] = { sortKey: key, name: item.date.toLocaleDateString('id-ID', { month: 'short' }), value: 0 };
      }
      aggMap[key].value += item[metricKey];
    });
    return Object.values(aggMap).sort((a, b) => a.sortKey.localeCompare(b.sortKey));
  }, [chartFilters, principal, sources, metricKey]);

  const last = data[data.length - 1];
  const prev = data[data.length - 2];
  const lastVal = last ? last.value : 0;
  const diffPct = prev && prev.value ? ((lastVal - prev.value) / prev.value) * 100 : null;
  const isUp = diffPct !== null && diffPct >= 0;
  // Cost naik = buruk (merah), Income naik = baik (hijau)
  const trendColor = diffPct === null ? 'text-slate-400' : (isUp === (metricKey === 'income') ? 'text-emerald-500' : 'text-rose-500');

  return (
    <div className="w-full bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-slate-200/60 h-[260px] flex flex-col">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-[13px] font-bold text-slate-700">{title}</p>
          <p className="text-[20px] font-bold text-[#0f172a] leading-tight mt-1">{formatCurrency(lastVal)}</p>
          <p className="text-[10px] text-slate-400">{metricLabel} · {last ? last.name : '-'}</p>
        </div>
        {diffPct !== null && (
          <div className="text-right">
            <p className={`text-[13px] font-bold ${trendColor}`}>{isUp ? '▲' : '▼'} {Math.abs(diffPct).toFixed(1)}%</p>
            <p className="text-[10px] text-slate-400">vs {prev.name}</p>
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
            <LineChart data={data} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} dy={5} interval="preserveStartEnd" />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} width={55} domain={['auto', 'auto']} tickFormatter={formatCurrency} />
              <Tooltip content={<SimpleTooltip />} />
              <Line type="linear" dataKey="value" name={metricLabel} stroke={lineColor} strokeWidth={2.5} dot={{ r: data.length > 15 ? 2 : 4, fill: lineColor, strokeWidth: 0 }} activeDot={{ r: 5 }} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};

// ==========================================
// KARTU TOP BILLING / NEW BILLING
// ==========================================
const BillingListCard = ({ title, subtitle, items, accent, emptyText }) => (
  <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-slate-200/60 flex flex-col">
    <div className="flex justify-between items-baseline mb-3">
      <p className="text-[13px] font-bold text-slate-700">{title}</p>
      <p className="text-[10px] text-slate-400">{subtitle}</p>
    </div>
    {items.length === 0 ? (
      <p className="text-[12px] text-slate-400 py-6 text-center">{emptyText}</p>
    ) : (
      <ol className="flex flex-col divide-y divide-slate-100">
        {items.map((b, i) => (
          <li key={`${b.billingLine}-${i}`} className="flex items-center gap-3 py-2">
            <span className="w-6 h-6 shrink-0 rounded-full flex items-center justify-center text-[11px] font-bold text-white" style={{ backgroundColor: accent }}>{i + 1}</span>
            <div className="min-w-0 flex-1">
              <p className="text-[12px] font-bold text-slate-800 truncate" title={b.description}>{b.description}</p>
              <p className="text-[10px] text-slate-400">{b.billingLine} · {b.jenis}</p>
            </div>
            <span className="text-[12px] font-bold text-slate-800 shrink-0">{formatCurrency(b.total)}</span>
          </li>
        ))}
      </ol>
    )}
  </div>
);

// ==========================================
// KOMPONEN CHART (dipakai per principal untuk Total)
// ==========================================
const CostChart = ({ principal, title, sources, chartFilters }) => {
  const chartData = useMemo(() => {
    const { startDate, endDate, view } = chartFilters;
    // Jika tanggal awal > tanggal akhir, tukar otomatis
    const [start, end] = startDate <= endDate ? [startDate, endDate] : [endDate, startDate];
    const aggMap = {};

    const rows = sources.flatMap(src => CHART_DB[principal][src]);
    rows.forEach(item => {
      // Filter rentang tanggal (format YYYY-MM-DD bisa dibandingkan sebagai string)
      if ((start && item.dateString < start) || (end && item.dateString > end)) return;

      // Agregasi per bulan (sumbu X = bulan)
      const key = item.monthKey;
      const label = item.date.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' });

      if (!aggMap[key]) {
        aggMap[key] = { dateLabel: label, income: 0, cost: 0, billingIncome: 0, billingCost: 0, sortKey: key };
      }
      aggMap[key].income += item.income;
      aggMap[key].cost += item.cost;
      aggMap[key].billingIncome += item.billingIncome;
      aggMap[key].billingCost += item.billingCost;
    });

    // Billing Line mengikuti filter "Tampilkan":
    // Income -> hanya billing Income, Cost -> hanya billing Cost, All -> keduanya dijumlah
    return Object.values(aggMap)
      .sort((a, b) => a.sortKey.localeCompare(b.sortKey))
      .map(d => ({
        ...d,
        billingLine: view === 'Income' ? d.billingIncome
          : view === 'Cost' ? d.billingCost
          : d.billingIncome + d.billingCost,
      }));
  }, [chartFilters, principal, sources]);

  // Line yang ditampilkan sesuai filter "Tampilkan"
  const visibleSeries = LINE_SERIES.filter(s => VIEW_OPTIONS[chartFilters.view].includes(s.key));

  // Sumbu Y disembunyikan, tapi domain diatur supaya Billing Line (jumlah) ada di area atas
  // dan Income/Cost (Rupiah) di area bawah, jadi line & label tidak saling tumpuk
  const yDomains = useMemo(() => {
    if (chartData.length === 0) return { left: [0, 1], right: [0, 1] };
    const bill = chartData.map(d => d.billingLine);
    const moneyKeys = VIEW_OPTIONS[chartFilters.view].filter(k => k !== 'billingLine');
    const money = chartData.flatMap(d => moneyKeys.map(k => d[k]));
    const bMin = Math.min(...bill), bMax = Math.max(...bill), bRange = (bMax - bMin) || bMax || 1;
    const mMin = Math.min(...money), mMax = Math.max(...money), mRange = (mMax - mMin) || mMax || 1;
    // Area atas: Billing Line + Threshold (berdekatan), area bawah: Income/Cost (jarak cukup jauh)
    return {
      right: [bMin - bRange * 3.0, bMax + bRange * 0.4],
      left: [mMin - mRange * 0.4, mMax + mRange * 2.0],
      bRange,
    };
  }, [chartData, chartFilters.view]);

  // Ringkasan Billing Line dari hasil filter (dipakai Threshold)
  const billingSummary = useMemo(() => {
    const total = chartData.reduce((sum, d) => sum + d.billingLine, 0);
    const count = chartData.length;
    const first = chartData[0]?.dateLabel ?? '-';
    const last = chartData[count - 1]?.dateLabel ?? '-';
    return {
      total,
      count,
      avg: count ? total / count : 0,
      periodLabel: count > 1 ? `${first} – ${last}` : first,
    };
  }, [chartData]);

  // Threshold = Billing Line digeser sedikit ke bawah, jadi ikut naik-turun
  const chartDataWithThreshold = useMemo(() => {
    const gap = (yDomains.bRange || 1) * THRESHOLD_GAP_RATIO;
    return chartData.map(d => ({ ...d, threshold: d.billingLine - gap }));
  }, [chartData, yDomains.bRange]);

  const showPointLabels = chartData.length <= MAX_POINTS_WITH_LABEL;

  return (
    <div className="w-full bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-slate-200/60 h-[360px] flex flex-col">
      <h3 className="font-bold text-[#0f172a] tracking-tight text-[14px] mb-2">{title}</h3>
      <div className="flex-1 min-h-0">
            {chartData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-400 text-[13px] font-medium">
                Tidak ada data pada rentang tanggal yang dipilih.
              </div>
            ) : (
            <ResponsiveContainer width="100%" height="100%">
              {/* Margin kiri/kanan & padding sumbu X supaya titik + label di ujung tidak terpotong */}
              <LineChart data={chartDataWithThreshold} margin={{ top: 5, right: 70, left: 20, bottom: 5 }}>
                <CartesianGrid vertical={false} stroke="#eef2f6" />
                
                <XAxis 
                  dataKey="dateLabel" 
                  axisLine={{stroke: '#cbd5e1'}} 
                  tickLine={false} 
                  tick={{fontSize: 11, fill: '#64748b', fontWeight: 600}} 
                  dy={10} 
                  padding={{ left: 20, right: 20 }}
                  interval="preserveStartEnd"
                  height={35}
                />
                {/* Sumbu Y disembunyikan, nilai ditampilkan langsung di setiap titik */}
                <YAxis yAxisId="left" hide domain={yDomains.left} />
                <YAxis yAxisId="right" orientation="right" hide domain={yDomains.right} />
                
                <Tooltip
                  cursor={{ stroke: '#cbd5e1', strokeWidth: 1 }}
                  content={<ChartTooltip summary={billingSummary} data={chartData} />}
                />

                <Legend
                  verticalAlign="top" align="left" iconType="square" iconSize={14}
                  wrapperStyle={{ paddingBottom: '16px', fontSize: '12px', fontWeight: 600 }}
                  formatter={(value) => <span style={{ color: '#334155', marginRight: 16 }}>{value}</span>}
                />

                {visibleSeries.map(s => (
                  <Line
                    key={s.key}
                    yAxisId={s.axis}
                    type="linear"
                    dataKey={s.key}
                    name={s.name}
                    stroke={s.color}
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: s.color, stroke: s.color }}
                    activeDot={{ r: 8, fill: s.color, stroke: '#fff', strokeWidth: 2 }}
                    label={showPointLabels ? makePointLabel(s.axis === 'right' ? formatBilling : formatCurrency, s.labelColor, s.labelPos) : false}
                    isAnimationActive={false}
                  />
                ))}

                {/* Threshold: hanya untuk Billing Line (sumbu kanan yang sama) */}
                <Line
                  yAxisId="right"
                  type="linear"
                  dataKey="threshold"
                  name="Threshold"
                  stroke={THRESHOLD_COLOR}
                  strokeWidth={2}
                  strokeDasharray="6 4"
                  dot={false}
                  activeDot={{ r: 5, fill: THRESHOLD_COLOR, stroke: '#fff', strokeWidth: 2 }}
                  label={makeThresholdEndLabel(chartDataWithThreshold.length - 1, billingSummary.avg)}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
            )}
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
    startDate: DEFAULT_START_DATE, endDate: DEFAULT_END_DATE, view: 'All'
  });

  // State Tabel Diperbarui (Sesuai dengan kolom baru, Periode tetap dipertahankan)
  const [tableFilters, setTableFilters] = useState({
    jenisTransaksi: 'All', 
    tagging: 'All',
    principal: 'All', 
    group: 'All', 
    startPeriode: 'All', 
    endPeriode: 'All'
  });
  const [appliedTableFilters, setAppliedTableFilters] = useState({ ...tableFilters });
  const [filteredTableData, setFilteredTableData] = useState(TABLE_DB);

  // --- STATE PAGINATION ---
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 7;

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // ==========================================
  // 5. LOGIKA FILTERING & RESET HALAMAN TABEL
  // ==========================================
  useEffect(() => {
    const result = TABLE_DB.filter(row => {
      const passJenis = appliedTableFilters.jenisTransaksi === 'All' || row.jenisTransaksi === appliedTableFilters.jenisTransaksi;
      const passTagging = appliedTableFilters.tagging === 'All' || row.tagging === appliedTableFilters.tagging;
      const passPrincipal = appliedTableFilters.principal === 'All' || row.principal === appliedTableFilters.principal;
      const passGroup = appliedTableFilters.group === 'All' || row.group === appliedTableFilters.group;

      // Logika Filter Rentang Periode (Bulan) TETAP DIPERTAHANKAN
      let passPeriode = true;
      const rowMonthIdx = MONTH_ORDER[row.month];
      const startIdx = appliedTableFilters.startPeriode !== 'All' ? MONTH_ORDER[appliedTableFilters.startPeriode] : 0;
      const endIdx = appliedTableFilters.endPeriode !== 'All' ? MONTH_ORDER[appliedTableFilters.endPeriode] : 999;

      if (rowMonthIdx) {
        passPeriode = rowMonthIdx >= startIdx && rowMonthIdx <= endIdx;
      }

      return passJenis && passTagging && passPrincipal && passGroup && passPeriode;
    });
    setFilteredTableData(result);
    setCurrentPage(1); // Reset ke halaman 1 setiap kali filter diterapkan
  }, [appliedTableFilters]);

  const handleApplyTableFilter = () => {
    setAppliedTableFilters({ ...tableFilters });
  };

  // Logika Data yang akan dirender di halaman aktif
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
            <button onClick={() => navigate('/')} className="text-slate-400 hover:text-blue-600 transition-colors" title="Dashboard"><CreditCard size={24} strokeWidth={1.5} /></button>
            <button className="text-blue-600 transition-colors" title="Detail Cost"><Book size={24} strokeWidth={1.5} /></button>
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
            </div>
          </div>

          {/* SECTION 2: LINE CHART PER PRINCIPAL (kiri Visa, kanan Mastercard; masing-masing Total, Service Fee, Interchange Fee) */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 mb-8">
            {CHART_PRINCIPALS.map(principal => (
              <div key={principal} className="flex flex-col gap-5 min-w-0">
                <h2 className="text-[16px] font-bold text-slate-900 tracking-tight flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: principal === 'Visa' ? '#1e3a8a' : '#ea580c' }}></span>
                  {principal}
                </h2>
                {CHART_SECTIONS.map(section => {
                  const ChartComponent = section.key === 'total' ? CostChart : SimpleFeeChart;
                  return (
                    <ChartComponent
                      key={section.key}
                      principal={principal}
                      title={section.title}
                      sources={section.sources}
                      chartFilters={chartFilters}
                    />
                  );
                })}
              </div>
            ))}
          </div>

          {/* SECTION 2B: DETAIL BILLING (TOP BILLING & NEW BILLING PER PRINCIPAL) */}
          <div className="w-full bg-white/60 p-4 sm:p-6 rounded-2xl border border-slate-200/60 mb-8">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight mb-4">Detail Billing</h2>
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
              {CHART_PRINCIPALS.map(principal => {
                const hl = BILLING_HIGHLIGHTS[principal];
                return (
                  <div key={principal} className="flex flex-col gap-4 min-w-0">
                    <h3 className="text-[14px] font-bold text-slate-800 flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PRINCIPAL_COLOR[principal] }}></span>
                      {principal}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <BillingListCard
                        title="Top Billing"
                        subtitle={`Top ${TOP_BILLING_LIMIT} · Eqv IDR`}
                        items={hl.top}
                        accent={PRINCIPAL_COLOR[principal]}
                        emptyText="Belum ada billing."
                      />
                      <BillingListCard
                        title="New Billing"
                        subtitle={`Baru di ${hl.lastMonthName}`}
                        items={hl.newBilling}
                        accent="#10b981"
                        emptyText="Tidak ada billing baru."
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* SECTION 3: TRANSACTION CONFIGURATION TABLE */}
          <div className="w-full bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden mb-10">
            
            <div className="flex flex-col lg:flex-row justify-between items-start px-6 py-6 border-b border-slate-100 gap-5">
              <div>
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">Detail Billing</h2>
              </div>

              <div className="flex flex-col items-end gap-3 w-full lg:w-auto">
                <div className="flex flex-wrap items-center justify-end gap-2 w-full">
                  
                  {/* --- FILTER START PERIODE --- */}
                  <div className="relative flex items-center">
                    <Settings2 size={13} className="text-slate-400 absolute left-2.5 pointer-events-none" />
                    <select className="pl-7 pr-6 py-1.5 border border-slate-200 rounded-lg text-[12px] font-semibold text-slate-600 hover:bg-slate-50 transition-colors appearance-none outline-none bg-white cursor-pointer" value={tableFilters.startPeriode} onChange={(e) => setTableFilters({...tableFilters, startPeriode: e.target.value})}>
                      <option value="All">Start Periode</option>
                      {FILTER_OPTIONS.month.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                    <ChevronDown size={12} className="text-slate-400 absolute right-2.5 pointer-events-none" />
                  </div>

                  {/* --- FILTER END PERIODE --- */}
                  <div className="relative flex items-center">
                    <span className="text-slate-400 mx-1 text-xs font-bold">-</span>
                    <Settings2 size={13} className="text-slate-400 absolute left-5 pointer-events-none" />
                    <select className="pl-9 pr-6 py-1.5 border border-slate-200 rounded-lg text-[12px] font-semibold text-slate-600 hover:bg-slate-50 transition-colors appearance-none outline-none bg-white cursor-pointer" value={tableFilters.endPeriode} onChange={(e) => setTableFilters({...tableFilters, endPeriode: e.target.value})}>
                      <option value="All">End Periode</option>
                      {FILTER_OPTIONS.month.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                    <ChevronDown size={12} className="text-slate-400 absolute right-2.5 pointer-events-none" />
                  </div>

                  {/* Filter Jenis Transaksi */}
                  <div className="relative flex items-center">
                    <Settings2 size={13} className="text-slate-400 absolute left-2.5 pointer-events-none" />
                    <select className="pl-7 pr-6 py-1.5 border border-slate-200 rounded-lg text-[12px] font-semibold text-slate-600 hover:bg-slate-50 transition-colors appearance-none outline-none bg-white cursor-pointer" value={tableFilters.jenisTransaksi} onChange={(e) => setTableFilters({...tableFilters, jenisTransaksi: e.target.value})}>
                      <option value="All">Jenis Transaksi</option>
                      {FILTER_OPTIONS.jenisTransaksi.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                    <ChevronDown size={12} className="text-slate-400 absolute right-2.5 pointer-events-none" />
                  </div>

                  {/* Filter Tagging */}
                  <div className="relative flex items-center">
                    <Settings2 size={13} className="text-slate-400 absolute left-2.5 pointer-events-none" />
                    <select className="pl-7 pr-6 py-1.5 border border-slate-200 rounded-lg text-[12px] font-semibold text-slate-600 hover:bg-slate-50 transition-colors appearance-none outline-none bg-white cursor-pointer" value={tableFilters.tagging} onChange={(e) => setTableFilters({...tableFilters, tagging: e.target.value})}>
                      <option value="All">Tagging</option>
                      {FILTER_OPTIONS.tagging.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                    <ChevronDown size={12} className="text-slate-400 absolute right-2.5 pointer-events-none" />
                  </div>

                  {/* Filter Principal */}
                  <div className="relative flex items-center">
                    <Settings2 size={13} className="text-slate-400 absolute left-2.5 pointer-events-none" />
                    <select className="pl-7 pr-6 py-1.5 border border-slate-200 rounded-lg text-[12px] font-semibold text-slate-600 hover:bg-slate-50 transition-colors appearance-none outline-none bg-white cursor-pointer" value={tableFilters.principal} onChange={(e) => setTableFilters({...tableFilters, principal: e.target.value})}>
                      <option value="All">Principal</option>
                      {FILTER_OPTIONS.principal.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                    <ChevronDown size={12} className="text-slate-400 absolute right-2.5 pointer-events-none" />
                  </div>

                  {/* Filter Group */}
                  <div className="relative flex items-center">
                    <Settings2 size={13} className="text-slate-400 absolute left-2.5 pointer-events-none" />
                    <select className="pl-7 pr-6 py-1.5 border border-slate-200 rounded-lg text-[12px] font-semibold text-slate-600 hover:bg-slate-50 transition-colors appearance-none outline-none bg-white cursor-pointer" value={tableFilters.group} onChange={(e) => setTableFilters({...tableFilters, group: e.target.value})}>
                      <option value="All">Group</option>
                      {FILTER_OPTIONS.group.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                    <ChevronDown size={12} className="text-slate-400 absolute right-2.5 pointer-events-none" />
                  </div>

                </div>

                <button onClick={handleApplyTableFilter} className="flex items-center gap-1.5 px-6 py-2 bg-[#111827] hover:bg-black text-white rounded-lg text-[12px] font-bold shadow-sm transition-all active:scale-95">
                  <Filter size={13} /> Apply
                </button>

              </div>
            </div>

            <div className="w-full overflow-x-auto">
              {/* Kolomnya diperbanyak, min-w dilebarkan agar tidak terjepit */}
              <table className="w-full text-left border-collapse min-w-[1800px]">
                <thead className="bg-[#f8fafc]">
                  <tr>
                    {['JENIS TRANSAKSI', 'TAGGING', 'PRINCIPAL', 'GROUP', 'STATUS', 'TANGGAL', 'ICA', 'BILLING LINE', 'DESCRIPTION', 'TOTAL', 'EQV IDR', 'PRINCIPAL FEE TYPE', 'PRINCIPAL CATEGORY', 'PRINCIPAL SUB CATEGORY'].map(head => (
                      <th key={head} className={`py-4 px-5 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200/80 ${head === 'TOTAL' || head === 'EQV IDR' ? 'text-right' : ''}`}>
                        {head}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {currentTableData.length > 0 ? (
                    currentTableData.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/60 transition-colors group">
                        
                        <td className="py-4 px-5">
                          <span className={`px-2.5 py-1 rounded-md text-[10px] font-extrabold tracking-wide uppercase ${getBadgeType(row.jenisTransaksi)}`}>
                            {row.jenisTransaksi}
                          </span>
                        </td>
                        
                        <td className="py-4 px-5 text-[13px] font-bold text-slate-800">{row.tagging}</td>
                        <td className="py-4 px-5 text-[13px] font-bold text-slate-800">{row.principal}</td>
                        <td className={`py-4 px-5 text-[13px] font-bold ${row.group.includes('Debit') ? 'text-blue-600' : 'text-slate-600'}`}>{row.group}</td>
                        <td className="py-4 px-5 text-[13px] font-semibold text-slate-500">{row.status}</td>
                        <td className="py-4 px-5 text-[13px] font-medium text-slate-500">{row.tanggal}</td>
                        <td className="py-4 px-5 text-[13px] font-medium text-slate-500">{row.ica}</td>
                        <td className="py-4 px-5 text-[13px] font-bold text-slate-700">{row.billingLine}</td>
                        <td className="py-4 px-5 text-[13px] font-medium text-slate-500 max-w-[200px] truncate" title={row.description}>
                          {row.description}
                        </td>
                        <td className="py-4 px-5 text-[13px] font-bold text-slate-800 text-right">
                          {formatDecimal(row.total)}
                        </td>
                        <td className="py-4 px-5 text-[13px] font-bold text-slate-800 text-right">
                          {formatDecimal(row.eqvIdr)}
                        </td>
                        <td className="py-4 px-5 text-[13px] font-medium text-slate-500">{row.principalFeeType}</td>
                        <td className="py-4 px-5 text-[13px] font-medium text-slate-500">{row.principalCategory}</td>
                        <td className="py-4 px-5 text-[13px] font-medium text-slate-500">{row.principalSubCategory}</td>

                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="14" className="py-10 text-center text-slate-400 font-medium text-[13px]">
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

export default DetailCost;