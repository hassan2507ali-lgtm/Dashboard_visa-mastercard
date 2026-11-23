// ==========================================
// DATA BILLING BERSAMA (dipakai Detail Cost & Detail Billing)
// ==========================================
import { VISA_SERVICE_FEE, visaMonth } from './visaPrincipalData';
// ==========================================
// 2. GENERATE DUMMY DATA UNTUK TABEL BARU (SESUAI EXCEL BARU)
// ==========================================
const TABLE_TEMPLATES = [
  { jenis: 'Interchange', tagging: 'Interchange Local', principal: 'Visa', group: 'Acquiring', status: 'Current Billing', ica: '-', billingLine: 'Interchange Local', desc: 'Visa Local', feeType: '-', category: '-', subCategory: '-' },
  { jenis: 'Interchange', tagging: 'Interchange International', principal: 'Visa', group: 'Acquiring', status: 'Current Billing', ica: '-', billingLine: 'Interchange International', desc: 'Visa International', feeType: '-', category: '-', subCategory: '-' },
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

// Bulan data billing: Januari s.d. Oktober 2026 (bulan terakhir yang sudah tutup)
const BILLING_MONTHS = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober'].map(m => `${m} 2026`);
const BILLING_YEAR = 2026;
const shortMonthOf = (month) => month.substring(0, 3);

// Mastercard: masih dummy acak (nanti diganti data asli)
const generateMastercardRows = () => {
  const data = [];
  const templates = TABLE_TEMPLATES.filter(t => t.principal === 'Mastercard');
  for (let i = 0; i < 40; i++) {
    const template = templates[Math.floor(Math.random() * templates.length)];
    const month = BILLING_MONTHS[Math.floor(Math.random() * BILLING_MONTHS.length)];
    const rawAmount = (Math.random() * 500000000) + 1000000;
    const day = Math.floor(Math.random() * 28) + 1;
    data.push(makeRow(`TRX-MC-${10000 + i}`, template, month, `${day}-${shortMonthOf(month)}-${month.slice(-4)}`, rawAmount));
  }
  // Billing baru Mastercard: hanya muncul di bulan terakhir -> "New Billing"
  const lastMonth = BILLING_MONTHS[BILLING_MONTHS.length - 1];
  NEW_BILLING_TEMPLATES.filter(t => t.principal === 'Mastercard').forEach((template, i) => {
    const rawAmount = (Math.random() * 300000000) + 5000000;
    data.push(makeRow(`TRX-MC-NEW-${i}`, template, lastMonth, `${Math.floor(Math.random() * 28) + 1}-${shortMonthOf(lastMonth)}-${lastMonth.slice(-4)}`, rawAmount));
  });
  return data;
};

const makeRow = (id, template, month, tanggal, amount) => ({
  id,
  jenisTransaksi: template.jenis,
  tagging: template.tagging,
  principal: template.principal,
  group: template.group,
  status: template.status,
  tanggal,
  month,
  ica: template.ica,
  billingLine: template.billingLine,
  description: template.desc,
  total: amount,
  eqvIdr: amount,
  principalFeeType: template.feeType,
  principalCategory: template.category,
  principalSubCategory: template.subCategory,
});

// Visa: total per bulan sama persis dengan Excel (visaPrincipalData.js)
// - Interchange Local / International = Interchange Fee Visa Local / International
// - Service Fee bulanan dipecah ke billing line Visa (Excel hanya punya total per bulan -> rincian per line masih estimasi):
//   bulan awal quarter (Jan/Apr/Jul/Okt) lonjakannya masuk ke billing line Quarterly, sisanya dibagi ke line reguler.
const VISA_SERVICE_WEIGHTS = { 'Daily|Daily Service Visa Credit': 0.25, 'Daily|Daily Service Visa Debit': 0.2, MTI: 0.15, '4M6163460': 0.2, '4B1102010': 0.2 };
const VISA_NEW_WEIGHTS = { '4M7201150': 0.08, '4M7305020': 0.05 }; // porsi billing line baru di bulan terakhir Service Fee
const weightOf = (t) => VISA_SERVICE_WEIGHTS[`${t.billingLine}|${t.desc}`] ?? VISA_SERVICE_WEIGHTS[t.billingLine];

const generateVisaRows = () => {
  const data = [];
  const visa = TABLE_TEMPLATES.filter(t => t.principal === 'Visa');
  const interchangeTpl = { local: visa.find(t => t.tagging === 'Interchange Local'), intl: visa.find(t => t.tagging === 'Interchange International') };
  const regularTpl = visa.filter(t => weightOf(t) != null);
  const quarterlyTpl = visa.find(t => t.tagging === 'Quarterly');
  const newTpl = NEW_BILLING_TEMPLATES.filter(t => t.principal === 'Visa');

  const serviceFees = VISA_SERVICE_FEE[BILLING_YEAR];
  // Baseline Service Fee reguler = median bulan non-awal-quarter (yang ada datanya)
  const regular = serviceFees.filter((v, m) => v != null && m % 3 !== 0).sort((a, b) => a - b);
  const baseline = regular[Math.floor(regular.length / 2)] || 0;
  const lastServiceIdx = serviceFees.reduce((last, v, m) => (v != null && m < BILLING_MONTHS.length ? m : last), -1);

  BILLING_MONTHS.forEach((month, m) => {
    const v = visaMonth(BILLING_YEAR, m);
    const lastDay = new Date(BILLING_YEAR, m + 1, 0).getDate();
    const tanggal = `${lastDay}-${shortMonthOf(month)}-${BILLING_YEAR}`;
    const push = (tpl, amount, suffix) => { if (amount) data.push(makeRow(`TRX-VISA-${m + 1}-${suffix}`, tpl, month, tanggal, amount)); };

    push(interchangeTpl.local, v.interchangeFeeLocal, 'ICL');
    push(interchangeTpl.intl, v.interchangeFeeIntl, 'ICI');

    const fee = v.serviceFee;
    if (fee == null) return;
    const regularPart = m % 3 === 0 ? Math.min(baseline, fee) : fee;
    push(quarterlyTpl, fee - regularPart, 'Q');
    // Bulan terakhir Service Fee: sebagian masuk ke billing line baru (New Billing)
    const newShare = m === lastServiceIdx ? Object.values(VISA_NEW_WEIGHTS).reduce((a, b) => a + b, 0) : 0;
    let given = 0;
    const parts = [
      ...regularTpl.map(t => [t, regularPart * (1 - newShare) * weightOf(t)]),
      ...(newShare ? newTpl.map(t => [t, regularPart * VISA_NEW_WEIGHTS[t.billingLine]]) : []),
    ];
    parts.forEach(([t, amount], i) => {
      const value = i === parts.length - 1 ? regularPart - given : Math.round(amount);
      given += value;
      push(t, value, `S${i}`);
    });
  });
  return data;
};

const generateTableData = () => [...generateVisaRows(), ...generateMastercardRows()];

// Region per baris: Interchange Local -> Domestic, Interchange International -> International, lainnya acak
const assignRegion = (row) => {
  if (row.tagging === 'Interchange Local') return 'Domestic';
  if (row.tagging === 'Interchange International') return 'International';
  return Math.random() > 0.4 ? 'Domestic' : 'International';
};
// Channel per baris: CP (Card Present) / CNP (Card Not Present) / ATM, acak
const assignChannel = () => {
  const r = Math.random();
  return r > 0.5 ? 'CP' : (r > 0.2 ? 'CNP' : 'ATM');
};
// Unit (jumlah transaksi) dummy, Rate = Amount (total) / Unit
const assignUnitRate = (row) => {
  const unit = Math.floor(Math.random() * 9900) + 100;
  return { unit, rate: row.total / unit };
};
// Tier Event (dummy): hanya Mastercard yang punya tier, Visa '-'
const assignTierEvent = (row) => (row.principal === 'Mastercard' ? `T${Math.floor(Math.random() * 3) + 1}` : '-');
// Key = Billing Line + ICA + Tier Event (bagian yang kosong / '-' dilewati)
export const billingRowKey = (row) => [row.billingLine, row.ica, row.tierEvent].filter(v => v && v !== '-').join('');
export const TABLE_DB = generateTableData().map(row => {
  const r = { ...row, region: assignRegion(row), channel: assignChannel(), tierEvent: assignTierEvent(row), ...assignUnitRate(row) };
  return { ...r, key: billingRowKey(r) };
});

// ==========================================
// RINGKASAN DETAIL BILLING: TOP BILLING & NEW BILLING PER PRINCIPAL
// Top Billing  = billing line dengan total Eqv IDR terbesar (top 5)
// New Billing  = billing line yang pertama kali muncul di bulan terakhir data
// ==========================================
export const TOP_BILLING_LIMIT = 5;
const buildBillingHighlights = (principal) => {
  const rows = TABLE_DB.filter(r => r.principal === principal);
  // Bulan terakhir per principal berdasarkan billing Service Fee (Interchange selalu ada tiap bulan)
  const lastMonthIdx = Math.max(...rows.filter(r => r.jenisTransaksi === 'Service Fee').map(r => MONTH_ORDER[r.month] || 0));
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
export const FILTER_OPTIONS = {
  jenisTransaksi: ['Interchange', 'Service Fee'],
  tagging: ['Interchange Local', 'Interchange International', 'Weekly', 'Daily', 'MTI', 'Monthly', 'Lisence', 'Quarterly'],
  principal: ['Visa', 'Mastercard'],
  group: ['Acquiring', 'Credit', 'Debit'],
  region: ['Domestic', 'International'],
  channel: ['CP', 'CNP', 'ATM'],
  billing: ['Top Billing', 'New Billing'],
  month: BILLING_MONTHS,
};

// Logika pemetaan bulan untuk komparasi rentang tanggal Start & End
export const MONTH_ORDER = Object.fromEntries(BILLING_MONTHS.map((m, i) => [m, i + 1]));

export const BILLING_HIGHLIGHTS = {
  Visa: buildBillingHighlights('Visa'),
  Mastercard: buildBillingHighlights('Mastercard'),
};

// Kunci unik billing line, dipakai untuk filter Top Billing / New Billing
export const billingKey = (principal, billingLine, description) => `${principal}|${billingLine}|${description}`;
export const BILLING_KEYS = {
  'Top Billing': new Set(Object.entries(BILLING_HIGHLIGHTS).flatMap(([p, hl]) => hl.top.map(b => billingKey(p, b.billingLine, b.description)))),
  'New Billing': new Set(Object.entries(BILLING_HIGHLIGHTS).flatMap(([p, hl]) => hl.newBilling.map(b => billingKey(p, b.billingLine, b.description)))),
};

// Peringkat Top Billing per principal (1 = terbesar)
export const TOP_BILLING_RANK = {};
Object.entries(BILLING_HIGHLIGHTS).forEach(([p, hl]) => {
  hl.top.forEach((b, i) => { TOP_BILLING_RANK[billingKey(p, b.billingLine, b.description)] = i + 1; });
});

export const formatDecimal = (num) => {
  return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

// ==========================================
// SUMMARY PER PRINCIPAL (jumlah item + amount Eqv IDR):
// - Total Cost, Interchange Fee, Service Fee
// - New      = baris dari billing line baru (New Billing)
// - Existing = billing lama
// ==========================================
const getBillingStatus = (row) => {
  if (BILLING_KEYS['New Billing'].has(billingKey(row.principal, row.billingLine, row.description))) return 'New';
  return 'Existing';
};
TABLE_DB.forEach(row => { row.billingStatus = getBillingStatus(row); });

export const SUMMARY_STATUSES = ['New', 'Existing'];

export const BILLING_SUMMARY = Object.fromEntries(
  Object.keys(BILLING_HIGHLIGHTS).map(principal => {
    const rows = TABLE_DB.filter(r => r.principal === principal);
    const sumOf = (list) => ({ count: list.length, amount: list.reduce((sum, r) => sum + r.eqvIdr, 0) });
    const byStatus = Object.fromEntries(SUMMARY_STATUSES.map(st => [st, sumOf(rows.filter(r => r.billingStatus === st))]));
    return [principal, {
      total: sumOf(rows),
      interchange: sumOf(rows.filter(r => r.jenisTransaksi === 'Interchange')),
      serviceFee: sumOf(rows.filter(r => r.jenisTransaksi === 'Service Fee')),
      ...byStatus,
    }];
  })
);
