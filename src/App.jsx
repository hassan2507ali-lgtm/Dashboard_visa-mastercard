import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Dashboard from './Dashboard';
import DetailCost from './DetailCost';
import DetailBilling from './DetailBilling';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/detail-cost" element={<DetailCost />} />
        <Route path="/detail-billing" element={<DetailBilling />} />
      </Routes>
    </BrowserRouter>
  );
}

// MASUKKAN BARIS INI AGAR BISA DIBACA OLEH main.jsx
export default App;