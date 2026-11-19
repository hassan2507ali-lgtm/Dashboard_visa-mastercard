// Helper sumbu Y untuk chart bar (amount) + line (%) dengan 2 sumbu.
// Kedua sumbu memakai jumlah tick yang sama supaya sejajar dengan grid.

// Jumlah interval sumbu Y (5 tick: 0..4)
export const AXIS_INTERVALS = 4;

// Bulatkan step ke angka "cantik" (1, 2, 2.5, 5 x 10^n), dibulatkan ke atas
export const niceStep = (raw) => {
  if (!(raw > 0)) return 1;
  const pow = Math.pow(10, Math.floor(Math.log10(raw)));
  const frac = raw / pow;
  const nice = frac <= 1 ? 1 : frac <= 2 ? 2 : frac <= 2.5 ? 2.5 : frac <= 5 ? 5 : 10;
  return nice * pow;
};

// Tick sumbu amount kiri: mulai 0, bar maks ~50% tinggi chart
export const buildAmountTicks = (maxValue) => {
  const step = niceStep(Math.max(maxValue, 0) / (AXIS_INTERVALS * 0.5));
  return Array.from({ length: AXIS_INTERVALS + 1 }, (_, i) => +(i * step).toPrecision(12));
};

// Tick sumbu % kanan: cari step terkecil yang membuat garis berada di ~45% atas chart
// (di atas bar) tanpa tick negatif; kalau tidak bisa, mulai dari 0%.
const PCT_STEPS = [0.05, 0.1, 0.2, 0.25, 0.5, 1, 2, 2.5, 5, 10, 20, 25];
export const buildPctTicks = (lo, hi) => {
  let axis = null;
  for (const step of PCT_STEPS) {
    let top = Math.ceil(hi / step - 1e-9) * step;
    if (top - hi < step * 0.2) top += step; // ruang untuk titik paling atas
    const bottom = top - AXIS_INTERVALS * step;
    if (bottom >= 0 && lo - bottom >= 0.55 * AXIS_INTERVALS * step) {
      axis = { lo: bottom, step };
      break;
    }
  }
  if (!axis) axis = { lo: 0, step: niceStep((Math.max(hi, 0.01) * 1.15) / AXIS_INTERVALS) };
  return Array.from({ length: AXIS_INTERVALS + 1 }, (_, i) => +(axis.lo + i * axis.step).toFixed(2));
};

export const formatPctTick = (v) => `${v.toLocaleString('id-ID', { maximumFractionDigits: 2 })}%`;

// Props bersama untuk YAxis kiri & kanan (jarak label dari plot, tanpa garis)
export const yAxisBase = { axisLine: false, tickLine: false, tickMargin: 8, interval: 0, allowDataOverflow: true };

// Semua persentase rasio (Income / Cost / Margin to Volume) dibatasi maks 3% (nilai negatif juga maks -3%)
export const MAX_PCT = 3;
export const capPct = (v) => Math.max(-MAX_PCT, Math.min(MAX_PCT, v));
