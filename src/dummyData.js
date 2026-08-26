// dummyData.js

// Fungsi pembantu untuk membuat angka random di antara nilai min dan max
const getRandomAmount = (min, max) => {
    return Number((Math.random() * (max - min) + min).toFixed(2));
  };
  
  export const generateRealDummyData = () => {
    const data = [];
    // Mulai dari 1 Januari 2025 sesuai gambar
    let currentDate = new Date(2025, 0, 1); 
  
    // Generate persis 100 data (100 hari berturut-turut)
    for (let i = 0; i < 100; i++) {
      const dateString = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;
  
      data.push({
        id: `TRX-${i + 1}`,
        date: dateString,
        
        // Nilai-nilai di bawah disesuaikan dengan rentang (range) angka di gambar Excel-mu
        mastercardLocal: getRandomAmount(700000000, 950000000),      // ~700 Juta - 950 Juta
        mastercardInternational: getRandomAmount(500000000, 990000000),// ~500 Juta - 990 Juta
        jcbLocal: getRandomAmount(100000000, 170000000),             // ~100 Juta - 170 Juta
        jcbInternational: getRandomAmount(1500000, 6500000),         // ~1.5 Juta - 6.5 Juta
        cup: getRandomAmount(5000000, 8000000),                      // ~5 Juta - 8 Juta
        visaLocal: getRandomAmount(1200000000, 1600000000),          // ~1.2 Miliar - 1.6 Miliar
        visaInternational: getRandomAmount(400000000, 700000000),    // ~400 Juta - 700 Juta
        qrAj: getRandomAmount(230000000, 390000000),                 // ~230 Juta - 390 Juta
        qrJalin: getRandomAmount(50000000, 85000000),                // ~50 Juta - 85 Juta
        npgJalin: getRandomAmount(140000000, 260000000),             // ~140 Juta - 260 Juta
        npgArtajasa: getRandomAmount(110000000, 170000000),          // ~110 Juta - 170 Juta
        npgRintis: getRandomAmount(100000000, 150000000),            // ~100 Juta - 150 Juta
      });
  
      // Tambah 1 hari ke currentDate
      currentDate.setDate(currentDate.getDate() + 1);
    }
  
    return data;
  };
  
  // Ekspor datanya agar bisa langsung dipanggil
  export const EXCEL_DUMMY_DB = generateRealDummyData();