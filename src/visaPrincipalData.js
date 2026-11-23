// ==========================================
// DATA BULANAN VISA (dari pivot Excel "eco")
// Dipakai menimpa komponen Income / Cost Visa di dummy Dashboard (Sales Volume, MDR, Kurs masih dummy).
// Urutan array = Jan..Des. null = data bulan itu belum ada di Excel.
// ==========================================

// 1. Service Fee (Jenis Transaksi = Service Fee) -> Cost: Service Fee
export const VISA_SERVICE_FEE = {
  2025: [26619224494, 2123266794, 1810886665, 26521729223, 2660699986, 2592036930, 26320676540, 2803849574, 2224024867, 37667824588, 3020696324, 2905222776],
  2026: [57751004477, 19758165404, 2915114763, 60329057210, 4031049975, 3009215038, 56090803255, 4104607239, 3923371404, null, null, null],
};

// 2. Interchange Fee -> Cost: Interchange Fee (sisi Acquiring). local = Visa Local, intl = Visa International
export const VISA_INTERCHANGE_FEE = {
  2025: {
    local: [48080457534, 49057174132, 61563849742, 59409945006, 67648571532, 64585296705, 69833012713, 68378567224, 61352257449, 66443035345, 68219857399, 75314854978],
    intl: [16598589941, 14579725242, 16208895963, 20129142588, 22483893131, 24457958713, 29436201711, 31420805818, 25656899137, 25406029206, 21073748732, 22280479867],
  },
  2026: {
    local: [67378230669, 60358123174, 53972693722, 57936248545, 69858999888, 82825419018, 79422564378, 89867193941, 82817100041, 68698195540, null, null],
    intl: [22529005236, 20163562553, 20144188785, 26736188717, 29338384558, 31840830096, 37905292437, 40139691479, 35741805550, 29287122993, null, null],
  },
};

// 3. Interchange Income -> Income: Interchange Fee & ATM (sisi Issuing: Kartu Debit & Kartu Kredit)
export const VISA_INTERCHANGE_INCOME = {
  2025: {
    debitLocal: [1116150514, 784308796, 815599475, 735196460, 740890356, 758086187, 776872555, 771349756, 709656414, 740440201, 991076308, 1753724409],
    debitIntl: [5392115438, 3997265965, 3959597343, 4189405833, 3729714453, 3983320543, 4035390178, 4021321404, 3941709327, 4597510369, 4897630582, 5108095925],
    debitValas: [5290003367, 3625749578, 2492789493, 4105442352, 3637538026, 3406070465, 4501183713, 3319153155, 3468227794, 3904539019, 3880997837, 5031240860],
    creditLocal: [9522143517, 8603542198, 9804201226, 8213289729, 9413113965, 9217216397, 9716305605, 9243860617, 8505840822, 9244735973, 9493719601, 12306043613],
    creditIntl: [10699830208, 7327880236, 8181767797, 9700236597, 8280358003, 8437657307, 8965891398, 7699249913, 8008865535, 8719195491, 9670976139, 11250727196],
  },
  2026: {
    debitLocal: [1070532991, 807831240, 841495416, 918265247, 1196619997, 1037009456, 905089501, 718664974, 663950040, null, null, null],
    debitIntl: [5858364336, 4988858652, 4370435809, 4290060271, 4544051427, 5453878218, 5265425735, 4775461356, 4772489977, null, null, null],
    debitValas: [5641686545, 3796084236, 3659086607, 4249302816, 4085277507, 3752959735, 4748572329, 3558308050, 3455969590, null, null, null],
    creditLocal: [13198012166, 22878579527, 24856825812, 23136585482, 24185133582, 10472982627, 10836722540, 10345567516, 9734902214, 7020870753, null, null],
    creditIntl: [10908512288, 7749325623, 10571138207, 9523107570, 9734929416, 9946764592, 10051585383, 9169698630, 9433419580, 7156384229, null, null],
  },
};

// 4. Sales Volume Visa — MASIH DUMMY (placeholder, belum ada di Excel). Ganti dengan angka asli.
// Satu sumber untuk semua halaman supaya rasio Cost / SV konsisten.
export const VISA_SALES_VOLUME = {
  2025: [5720e9, 6040e9, 7160e9, 7498e9, 6557e9, 6689e9, 7028e9, 6955e9, 6809e9, 7156e9, 7508e9, 8514e9],
  2026: [6406e9, 6757e9, 8003e9, 8372e9, 7314e9, 7453e9, 7823e9, 7735e9, 7566e9, 7944e9, 8327e9, 9434e9],
};

// Angka bulanan Visa (year = 2025/2026, m = 0..11). Nilai null = belum ada data di Excel.
const sumOrNull = (...vals) => (vals.every(v => v == null) ? null : vals.reduce((s, v) => s + (v || 0), 0));
export const visaMonth = (year, m) => {
  const icf = VISA_INTERCHANGE_FEE[year];
  const ici = VISA_INTERCHANGE_INCOME[year];
  if (!icf) return null;
  return {
    salesVolume: VISA_SALES_VOLUME[year][m],
    serviceFee: VISA_SERVICE_FEE[year][m],
    interchangeFeeLocal: icf.local[m],
    interchangeFeeIntl: icf.intl[m],
    interchangeFee: sumOrNull(icf.local[m], icf.intl[m]),
    interchangeIncome: sumOrNull(ici.debitLocal[m], ici.debitIntl[m], ici.debitValas[m], ici.creditLocal[m], ici.creditIntl[m]),
  };
};

// Bagi `amount` ke baris-baris secara proporsional Sales Volume (sisa pembulatan ke baris terakhir).
// Jika tidak ada baris yang cocok, buat baris baru (Sales Volume 0) supaya total tetap sama dengan Excel.
const allocate = (db, rows, amount, field, template) => {
  if (!amount) return;
  if (rows.length === 0) {
    db.push({
      ...template, salesVolume: 0, incomeInterchange: 0, incomeMdr: 0, incomeKurs: 0,
      costService: 0, costInterchange: 0, [field]: amount,
    });
    return;
  }
  const totalSv = rows.reduce((s, r) => s + r.salesVolume, 0);
  let given = 0;
  rows.forEach((r, i) => {
    const part = i === rows.length - 1 ? amount - given : Math.round(totalSv ? amount * r.salesVolume / totalSv : amount / rows.length);
    r[field] += part;
    given += part;
  });
};

// Timpa Service Fee, Interchange Fee & Interchange Income semua baris Visa dengan angka Excel,
// lalu hitung ulang total Income & Cost per baris. Mengubah `db` langsung (dipanggil sekali saat load).
export const applyVisaExcelData = (db) => {
  const byMonth = {};
  db.forEach(r => {
    if (r.principal !== 'Visa') return;
    r.costService = 0;
    r.costInterchange = 0;
    r.incomeInterchange = 0;
    const ym = r.date.slice(0, 7);
    (byMonth[ym] ||= []).push(r);
  });

  Object.keys(VISA_SERVICE_FEE).forEach(yearKey => {
    const year = Number(yearKey);
    for (let m = 0; m < 12; m++) {
      const ym = `${year}-${String(m + 1).padStart(2, '0')}`;
      const rows = byMonth[ym] || [];

      // Sales Volume Visa per bulan disamakan dengan VISA_SALES_VOLUME (MDR & Kurs ikut diskalakan)
      const rawSv = rows.reduce((s, r) => s + r.salesVolume, 0);
      const svFactor = rawSv ? VISA_SALES_VOLUME[year][m] / rawSv : 1;
      rows.forEach(r => {
        r.salesVolume = Math.round(r.salesVolume * svFactor);
        r.incomeMdr = Math.round(r.incomeMdr * svFactor);
        r.incomeKurs = Math.round(r.incomeKurs * svFactor);
      });

      const template = { id: `VISA-XLS-${ym}`, date: `${ym}-15`, principal: 'Visa', group: 'Acquiring', region: 'Domestic', channel: 'CP', costRate: 0.01 };
      const pick = (group, region) => rows.filter(r => r.group === group && (region === 'International') === (r.region === 'International'));
      const add = (amount, field, group, region) => allocate(db, group ? pick(group, region) : rows, amount, field, { ...template, ...(group ? { group, region } : {}) });

      // Service Fee: Excel tidak memecah per produk / region -> dibagi proporsional Sales Volume Visa bulan itu
      add(VISA_SERVICE_FEE[year][m], 'costService');

      const icf = VISA_INTERCHANGE_FEE[year];
      add(icf.local[m], 'costInterchange', 'Acquiring', 'Domestic');
      add(icf.intl[m], 'costInterchange', 'Acquiring', 'International');

      const ici = VISA_INTERCHANGE_INCOME[year];
      add(ici.debitLocal[m], 'incomeInterchange', 'Debit Card', 'Domestic');
      add((ici.debitIntl[m] || 0) + (ici.debitValas[m] || 0), 'incomeInterchange', 'Debit Card', 'International');
      add(ici.creditLocal[m], 'incomeInterchange', 'Credit Card', 'Domestic');
      add(ici.creditIntl[m], 'incomeInterchange', 'Credit Card', 'International');
    }
  });

  db.forEach(r => {
    if (r.principal !== 'Visa') return;
    r.principalCost = r.costService + r.costInterchange;
    r.income = r.incomeInterchange + r.incomeMdr + r.incomeKurs;
  });
  return db;
};
