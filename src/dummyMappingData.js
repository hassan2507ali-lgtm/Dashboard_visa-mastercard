// dummyMappingData.js

// 1. Template kombinasi data persis seperti di gambar Excel (ditambah variasi Cross Border dan Both)
const MAPPING_TEMPLATES = [
    { principal: 'Visa', tagging: 'Monthly', billingLine: '4CSF07600', newGrouping: 'Acq Both', kelompok: 'Transaction Service Fee', onUs: 'Y', region: 'Domestic' },
    { principal: 'Visa', tagging: 'Monthly', billingLine: '4CSF07610', newGrouping: 'Acq Both', kelompok: 'Transaction Service Fee', onUs: 'Y', region: 'Domestic' },
    { principal: 'Visa', tagging: 'Monthly', billingLine: '4CSF02510', newGrouping: 'Issuer Credit', kelompok: 'Card Service Fee', onUs: 'Y', region: 'Domestic' },
    { principal: 'Visa', tagging: 'Monthly', billingLine: '4CSF02515', newGrouping: 'Issuer Debit', kelompok: 'Card Service Fee', onUs: 'Y', region: 'Domestic' },
    { principal: 'Mastercard', tagging: 'Weekly', billingLine: '2HS2011', newGrouping: 'Issuer Credit', kelompok: 'Client Service', onUs: 'Y', region: 'Domestic' },
    { principal: 'Mastercard', tagging: 'Weekly', billingLine: '2HS2020', newGrouping: 'Issuer Credit', kelompok: 'Transaction Service Fee', onUs: 'Y', region: 'Cross Border' }, // Variasi Cross Border
    { principal: 'Mastercard', tagging: 'Weekly', billingLine: '2CB2511', newGrouping: 'Acq EDC', kelompok: 'Transaction Service Fee', onUs: 'Y', region: 'Domestic' },
    { principal: 'Mastercard', tagging: 'Weekly', billingLine: '2HV2011', newGrouping: 'Issuer Credit', kelompok: 'Transaction Service Fee', onUs: 'Y', region: 'Both' }, // Variasi Both
    { principal: 'Mastercard', tagging: 'Weekly', billingLine: '2HV2020', newGrouping: 'Issuer Credit', kelompok: 'Transaction Service Fee', onUs: 'Y', region: 'Domestic' },
    { principal: 'Mastercard', tagging: 'Weekly', billingLine: '2JB2011', newGrouping: 'Issuer Credit', kelompok: 'Transaction Service Fee', onUs: 'Y', region: 'Cross Border' }, // Variasi Cross Border
    { principal: 'Mastercard', tagging: 'Weekly', billingLine: '2JM2011', newGrouping: 'Issuer Credit', kelompok: 'Transaction Service Fee', onUs: 'Y', region: 'Domestic' },
    { principal: 'Mastercard', tagging: 'Weekly', billingLine: '2JM2020', newGrouping: 'Issuer Credit', kelompok: 'Transaction Service Fee', onUs: 'Y', region: 'Both' }, // Variasi Both
    { principal: 'Mastercard', tagging: 'Weekly', billingLine: '2QD2011', newGrouping: 'Issuer Credit', kelompok: 'Transaction Service Fee', onUs: 'Y', region: 'Domestic' },
    { principal: 'Mastercard', tagging: 'Weekly', billingLine: '2QD2020', newGrouping: 'Issuer Credit', kelompok: 'Transaction Service Fee', onUs: 'Y', region: 'Cross Border' }, // Variasi Cross Border
    { principal: 'Mastercard', tagging: 'Weekly', billingLine: '2QU2011', newGrouping: 'Issuer Credit', kelompok: 'Transaction Service Fee', onUs: 'Y', region: 'Domestic' },
    { principal: 'Mastercard', tagging: 'Weekly', billingLine: '2QU2020', newGrouping: 'Issuer Credit', kelompok: 'Transaction Service Fee', onUs: 'Y', region: 'Domestic' },
    { principal: 'Mastercard', tagging: 'Weekly', billingLine: '2QW2011', newGrouping: 'Issuer Credit', kelompok: 'Transaction Service Fee', onUs: 'Y', region: 'Both' }, // Variasi Both
    { principal: 'Mastercard', tagging: 'Weekly', billingLine: '2QW2020', newGrouping: 'Issuer Credit', kelompok: 'Transaction Service Fee', onUs: 'Y', region: 'Domestic' },
    { principal: 'Visa', tagging: 'Monthly', billingLine: '4J4251320', newGrouping: 'Issuer Both', kelompok: 'Transaction Service Fee', onUs: 'Y', region: 'Cross Border' }, // Variasi Cross Border
    { principal: 'Visa', tagging: 'Monthly', billingLine: '4F4030400', newGrouping: 'Issuer Both', kelompok: 'Network & Processing Fee', onUs: 'Both', region: 'Both' },
    { principal: 'Visa', tagging: 'Monthly', billingLine: '4W2221012', newGrouping: 'Issuer Both', kelompok: 'Network & Processing Fee', onUs: 'Both', region: 'Both' },
  ];
  
  // 2. Fungsi untuk men-generate 100 data berdasarkan template di atas
  export const generateMappingData100 = () => {
    const data = [];
    
    for (let i = 1; i <= 100; i++) {
      // Pilih template secara acak dari array MAPPING_TEMPLATES
      const randomIndex = Math.floor(Math.random() * MAPPING_TEMPLATES.length);
      const template = MAPPING_TEMPLATES[randomIndex];
  
      data.push({
        id: i, // Nomor urut 1 sampai 100
        principal: template.principal,
        tagging: template.tagging,
        billingLine: template.billingLine,
        newGrouping: template.newGrouping,
        kelompok: template.kelompok,
        onUs: template.onUs,
        region: template.region // Ini mewakili 'Column1' (Domestic, Both, Cross Border)
      });
    }
  
    return data;
  };
  
  // 3. Ekspor datanya agar bisa di-import di file lain
  export const MAPPING_DB_100 = generateMappingData100();