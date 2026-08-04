import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AtsDashboard from './pages/AtsDashboard';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Route utama menampilkan dashboard admin */}
        <Route path="/" element={<AtsDashboard />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
