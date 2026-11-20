// ==========================================
// DATA BILLING BERSAMA (dipakai Detail Cost & Detail Billing)
// ==========================================
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

// Tarif pajak dummy untuk kolom TAX OF (PPN 11% dari Eqv IDR)
export const TAX_RATE = 0.11;

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
      taxOf: eqvIdr * TAX_RATE, // nominal pajak (Rp) dari Eqv IDR
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
      taxOf: rawAmount * TAX_RATE,
      principalFeeType: template.feeType,
      principalCategory: template.category,
      principalSubCategory: template.subCategory
    });
  });
  return data;
};

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
export const TABLE_DB = generateTableData().map(row => ({ ...row, region: assignRegion(row), channel: assignChannel(), ...assignUnitRate(row) }));

// ==========================================
// RINGKASAN DETAIL BILLING: TOP BILLING & NEW BILLING PER PRINCIPAL
// Top Billing  = billing line dengan total Eqv IDR terbesar (top 5)
// New Billing  = billing line yang pertama kali muncul di bulan terakhir data
// ==========================================
export const TOP_BILLING_LIMIT = 5;
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
export const FILTER_OPTIONS = {
  jenisTransaksi: ['Interchange', 'Service Fee'],
  tagging: ['Interchange Local', 'Interchange International', 'Weekly', 'Daily', 'MTI', 'Monthly', 'Lisence', 'Quarterly'],
  principal: ['Visa', 'Mastercard'],
  group: ['Acquiring', 'Credit', 'Debit'],
  region: ['Domestic', 'International'],
  channel: ['CP', 'CNP', 'ATM'],
  billing: ['Top Billing', 'New Billing'],
  month: ['Januari 2026', 'Februari 2026', 'Maret 2026', 'April 2026', 'Mei 2026', 'Juni 2026']
};

// Logika pemetaan bulan untuk komparasi rentang tanggal Start & End
export const MONTH_ORDER = {
  'Januari 2026': 1,
  'Februari 2026': 2,
  'Maret 2026': 3,
  'April 2026': 4,
  'Mei 2026': 5,
  'Juni 2026': 6,
};

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
// SUMMARY PER PRINCIPAL: Total Item, New, Repricing, Existing (jumlah item + amount Eqv IDR)
// New       = baris dari billing line baru (New Billing)
// Repricing = billing lama yang tarifnya berubah
// Existing  = billing lama dengan tarif tetap
// (Dummy: status Repricing / Existing diacak ~75% / 25%, nanti diganti data asli)
// ==========================================
const getBillingStatus = (row) => {
  if (BILLING_KEYS['New Billing'].has(billingKey(row.principal, row.billingLine, row.description))) return 'New';
  return Math.random() < 0.75 ? 'Repricing' : 'Existing';
};
TABLE_DB.forEach(row => { row.billingStatus = getBillingStatus(row); });

export const SUMMARY_STATUSES = ['New', 'Repricing', 'Existing'];

export const BILLING_SUMMARY = Object.fromEntries(
  Object.keys(BILLING_HIGHLIGHTS).map(principal => {
    const rows = TABLE_DB.filter(r => r.principal === principal);
    const sumOf = (list) => ({ count: list.length, amount: list.reduce((sum, r) => sum + r.eqvIdr, 0) });
    const byStatus = Object.fromEntries(SUMMARY_STATUSES.map(st => [st, sumOf(rows.filter(r => r.billingStatus === st))]));
    return [principal, { total: sumOf(rows), ...byStatus }];
  })
);
