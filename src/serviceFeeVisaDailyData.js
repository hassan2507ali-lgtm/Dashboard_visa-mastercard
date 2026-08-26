// serviceFeeVisaDailyData.js

// Fungsi helper untuk menghasilkan angka acak dengan 2 angka desimal
const getRandomAmount = (min, max) => {
    return Number((Math.random() * (max - min) + min).toFixed(2));
  };
  
  export const generateServiceFeeVisaDaily = () => {
    const data = [];
    
    // Sesuai gambar, data dimulai dari 1 Januari 2025
    let currentDate = new Date(2025, 0, 1); 
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  
    // Generate 100 baris data (100 hari)
    for (let i = 0; i < 100; i++) {
      // Format tanggal menjadi "1-Jan-25" sesuai dengan gambar
      const day = currentDate.getDate();
      const month = monthNames[currentDate.getMonth()];
      const year = String(currentDate.getFullYear()).slice(-2);
      const dateString = `${day}-${month}-${year}`;
  
      data.push({
        id: i + 1,
        tanggal: dateString,
        // Rentang angka disesuaikan dengan gambar (sekitar 130 juta - 310 juta)
        dailyServiceVisaCredit: getRandomAmount(130000000, 310000000), 
        // Rentang angka disesuaikan dengan gambar (sekitar 180 juta - 310 juta)
        dailyServiceVisaDebit: getRandomAmount(180000000, 310000000) 
      });
  
      // Tambah 1 hari untuk iterasi berikutnya
      currentDate.setDate(currentDate.getDate() + 1);
    }
  
    return data;
  };
  
  // Ekspor datanya
  export const SERVICE_FEE_VISA_DAILY_DB = generateServiceFeeVisaDaily();