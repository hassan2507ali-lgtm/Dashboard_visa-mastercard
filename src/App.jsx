import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Dashboard from './Dashboard';
import DetailCost from './DetailCost';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/detail-cost" element={<DetailCost />} />
      </Routes>
    </BrowserRouter>
  );
}

// MASUKKAN BARIS INI AGAR BISA DIBACA OLEH main.jsx
export default App;