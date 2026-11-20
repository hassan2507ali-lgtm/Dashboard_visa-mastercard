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

// Step lebih rapat (1; 1,2; 1,5; 2; 2,5; 3; 4; 5; 6; 8; 10 x 10^n) supaya bar tidak jadi terlalu pendek
const niceStepFine = (raw) => {
  if (!(raw > 0)) return 1;
  const pow = Math.pow(10, Math.floor(Math.log10(raw)));
  const frac = raw / pow;
  const nice = [1, 1.2, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10].find(n => frac <= n + 1e-9);
  return nice * pow;
};

// Tick sumbu amount kiri: mulai 0, bar maks `maxFrac` dari tinggi chart (default ~50%)
export const buildAmountTicks = (maxValue, maxFrac = 0.5) => {
  const step = niceStep(Math.max(maxValue, 0) / (AXIS_INTERVALS * maxFrac));
  return Array.from({ length: AXIS_INTERVALS + 1 }, (_, i) => +(i * step).toPrecision(12));
};

// Rule: bar tidak boleh menabrak line, dicek PER BULAN (bar bulan i harus di bawah titik line bulan i).
// Hasilnya tick sumbu amount dengan bar setinggi mungkin (maks ~50% chart) tanpa menabrak line.
const LINE_GAP = 0.07; // jarak minimal puncak bar ke titik line (proporsi tinggi chart)
export const buildAmountTicksBelowLine = (barValues, lineValues, pctTicks) => {
  const barMax = Math.max(1, ...barValues);
  const range = pctTicks[AXIS_INTERVALS] - pctTicks[0];
  // Top sumbu minimal supaya setiap bar <= posisi line bulan itu dikurangi jarak
  const requiredTop = barValues.reduce((top, bar, i) => {
    const lineFrac = range > 0 ? (lineValues[i] - pctTicks[0]) / range : 1;
    return Math.max(top, bar / Math.max(lineFrac - LINE_GAP, 0.1));
  }, barMax / 0.5);
  const step = niceStepFine(requiredTop / AXIS_INTERVALS);
  return Array.from({ length: AXIS_INTERVALS + 1 }, (_, i) => +(i * step).toPrecision(12));
};

// Tick sumbu % kanan: cari step terkecil yang membuat garis berada di ~45% atas chart
// (di atas bar) tanpa tick negatif; kalau tidak bisa, mulai dari 0%.
const PCT_STEPS = [0.05, 0.1, 0.2, 0.25, 0.5, 0.75, 1, 1.5, 2, 2.5, 5, 7.5, 10, 15, 20, 25];
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
  // Fallback mulai 0%: pakai step terkecil yang masih memuat titik tertinggi (+5% ruang),
  // supaya line tidak turun terlalu rendah dan bar bisa lebih tinggi
  if (!axis) {
    const need = Math.max(hi, 0.01) * 1.05;
    const step = PCT_STEPS.find(st => st * AXIS_INTERVALS >= need) ?? niceStep(need / AXIS_INTERVALS);
    axis = { lo: 0, step };
  }
  return Array.from({ length: AXIS_INTERVALS + 1 }, (_, i) => +(axis.lo + i * axis.step).toFixed(2));
};

export const formatPctTick = (v) => `${v.toLocaleString('id-ID', { maximumFractionDigits: 2 })}%`;

// Props bersama untuk YAxis kiri & kanan (jarak label dari plot, tanpa garis)
export const yAxisBase = { axisLine: false, tickLine: false, tickMargin: 8, interval: 0, allowDataOverflow: true };

// Semua persentase rasio (Income / Cost / Margin to Volume) dibatasi maks 3% (nilai negatif juga maks -3%)
export const MAX_PCT = 3;
export const capPct = (v) => Math.max(-MAX_PCT, Math.min(MAX_PCT, v));
