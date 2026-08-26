// dummyMciInvoiceData.js

// 1. Template Master Berdasarkan Gambar Excel
// Semua field yang punya korelasi dikelompokkan agar data random tetap masuk akal
const MCI_TEMPLATES = [
    {
      serviceCode: "LS", serviceCodeDesc: "Acquirer Debit Settlement",
      eventId: "2LS2000", eventDesc: "SMS Acquirer Non-Local Currency Fee",
      uom: "A", baseRate: 0.001,
      feeType: "Acquirer Fees", category: "Other Acquiring Services", subCategory: "Currency Settlement"
    },
    {
      serviceCode: "RP", serviceCodeDesc: "Reports",
      eventId: "TRP1012E", eventDesc: "Acquirer Clearing Detail Report IP755120-eService",
      uom: "Q", baseRate: 1065943.12,
      feeType: "Customer Fees", category: "Other Customer Services", subCategory: "Reports"
    },
    {
      serviceCode: "RP", serviceCodeDesc: "Reports",
      eventId: "TRP2216E", eventDesc: "Clearing Cycle Acknowledgement IP727010-AA - eService",
      uom: "Q", baseRate: 1338.704081633,
      feeType: "Customer Fees", category: "Reports", subCategory: "Global Clearing Management System"
    },
    {
      serviceCode: "CF", serviceCodeDesc: "Connectivity Fees",
      eventId: "TCF6400", eventDesc: "Mastercard Connectivity Fee",
      uom: "Q", baseRate: 0.116607403,
      feeType: "Customer Fees", category: "Other Customer Processing", subCategory: "Connectivity"
    },
    {
      serviceCode: "VF", serviceCodeDesc: "Marketing/Acceptance Funds",
      eventId: "TMF47101", eventDesc: "Southeast Asia Travel Marketing and Acceptance Fund",
      uom: "A", baseRate: 0.001,
      feeType: "Acquirer Fees", category: "Other Acquiring Assessments", subCategory: "Acquirer Development Funds"
    },
    {
      serviceCode: "D4", serviceCodeDesc: "Clearing Outgoing",
      eventId: "2DDORSSF21", eventDesc: "Acquirer Regional & Safety MDF - International ATM",
      uom: "A", baseRate: 0.0002,
      feeType: "Acquirer Fees", category: "Other Acquiring Assessments", subCategory: "Acquirer Development Funds"
    }
  ];
  
  // Fungsi Helper untuk Angka Random
  const getRandomQty = (uom) => {
    // Jika UOM = 'A' (Amount), angkanya miliaran/ratusan juta
    if (uom === "A") return Math.floor(Math.random() * 20000000000) + 1000000000;
    // Jika UOM = 'Q' (Quantity), angkanya puluhan/ratusan
    return Math.floor(Math.random() * 800) + 10;
  };
  
  // 2. Fungsi Generator 100 Data MCI Invoice
  export const generateMciInvoiceData = () => {
    const data = [];
    const baseInvoiceNumber = 267000300010780; // Base Invoice dari gambar
    let currentDate = new Date(2026, 0, 1); // Mulai dari 1 Jan 2026
  
    for (let i = 1; i <= 100; i++) {
      // Ambil template secara acak
      const template = MCI_TEMPLATES[Math.floor(Math.random() * MCI_TEMPLATES.length)];
      
      // Generate Quantity sesuai UOM
      const quantity = getRandomQty(template.uom);
      
      // Kalkulasi Charge
      const charge = Number((quantity * template.baseRate).toFixed(2));
  
      // Format Tanggal (Contoh: JAN 11 2026)
      const monthNames = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
      const billingDate = `${monthNames[currentDate.getMonth()]} ${String(currentDate.getDate()).padStart(2, '0')} ${currentDate.getFullYear()}`;
  
      data.push({
        id: i,
        documentType: "MCIINV",
        invoiceNumber: String(baseInvoiceNumber + i),
        currency: "IDR",
        billingCycleDate: billingDate,
        invoiceIca: "12375",
        activityIca: "12375",
        billableIca: "12375",
        collectionMethod: "SAM",
        serviceCode: template.serviceCode,
        serviceCodeDesc: template.serviceCodeDesc,
        periodStartDate: "", // Dikosongkan sesuai gambar
        periodEndDate: "",   // Dikosongkan sesuai gambar
        originalInvoiceNumb: "", // Dikosongkan sesuai gambar
        eventId: template.eventId,
        eventDesc: template.eventDesc,
        affiliate: "", // Dikosongkan sesuai gambar
        uom: template.uom,
        quantityAmount: quantity,
        rate: template.baseRate,
        charge: charge,
        taxCharge: 0, // 0 sesuai gambar
        totalCharge: charge,
        vatCharge: "",
        vatCurrency: "",
        vatCode: "",
        vatRate: "",
        sbfExplanatory: "",
        feeType: template.feeType,
        category: template.category,
        subCategory: template.subCategory
      });
  
      // Tambah hari setiap 2 transaksi agar tanggalnya bervariasi
      if (i % 2 === 0) {
        currentDate.setDate(currentDate.getDate() + 1);
      }
    }
  
    return data;
  };
  
  // 3. Ekspor Data
  export const MCI_INVOICE_DB_100 = generateMciInvoiceData();