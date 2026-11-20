// Helper periode untuk Laporan Profitabilitas & filter chart Dashboard
export const MONTHS = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
export const QUARTERS = ['Q1', 'Q2', 'Q3', 'Q4'];
// Pilihan Bulan (Show = Monthly): rentang dari Januari. All = Jan s.d. Des, '3 Bulan' = Jan s.d. Mar, dst.
export const MONTH_RANGES = ['All', '3 Bulan', '6 Bulan', '9 Bulan', '12 Bulan'];
export const monthRangeLength = (range) => (range === 'All' ? 12 : parseInt(range, 10));

// Bulan terakhir (index 0-11) dari periode terpilih
export const periodEndMonth = ({ show, month, quarter }) => (show === 'Monthly' ? monthRangeLength(month) - 1 : (QUARTERS.indexOf(quarter) + 1) * 3 - 1);

// Pilihan default saat masuk mode EX (state dipegang Dashboard karena ikut memfilter chart Visa / Mastercard)
export const defaultReportSel = (year, now = new Date()) => ({
  product: 'All',
  principal: 'Both',
  show: 'Monthly',
  type: 'Position',
  year: String(year),
  month: 'All', // rentang bulan (Show = Monthly)
  quarter: QUARTERS[Math.floor(now.getMonth() / 3)], // quarter hari ini (dipakai saat Show = Quarterly)
});
