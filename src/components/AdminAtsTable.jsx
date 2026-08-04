import React, { useState, useMemo } from 'react';
import { Search, Eye } from 'lucide-react';

// Data Dummy Lengkap dengan NIK utuh (Akses Admin)
const DUMMY_ADMIN_ATS = [
  { id: 1, nama: 'Ahmad Nur Fauzi', jk: 'Laki-laki', nik: '7207052308990001', kabupaten: 'Kab. Sigi', kecamatan: 'Gumbasa', status: 'DO' },
  { id: 2, nama: 'Siti Rahmawati', jk: 'Perempuan', nik: '7203114509980002', kabupaten: 'Kab. Donggala', kecamatan: 'Banawa', status: 'LTM' },
  { id: 3, nama: 'Putra Pratama', jk: 'Laki-laki', nik: '7271011207990003', kabupaten: 'Kota Palu', kecamatan: 'Palu Timur', status: 'DO' },
  { id: 4, nama: 'Dewi Lestari', jk: 'Perempuan', nik: '7208045506970001', kabupaten: 'Kab. Parigi Moutong', kecamatan: 'Parigi', status: 'LTM' },
  { id: 5, nama: 'Mohammad Faisal', jk: 'Laki-laki', nik: '7202102804960002', kabupaten: 'Kab. Poso', kecamatan: 'Poso Kota', status: 'DO' },
  { id: 6, nama: 'Indah Permatasari', jk: 'Perempuan', nik: '7206126201010003', kabupaten: 'Kab. Morowali', kecamatan: 'Bungku Tengah', status: 'LTM' },
  { id: 7, nama: 'Rian Hidayat', jk: 'Laki-laki', nik: '7201081503000004', kabupaten: 'Kab. Banggai', kecamatan: 'Luwuk', status: 'DO' },
];

export default function AdminAtsTable({ data = DUMMY_ADMIN_ATS, onDetailClick }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedKabupaten, setSelectedKabupaten] = useState('');
  const [selectedKecamatan, setSelectedKecamatan] = useState('');

  const handleDetail = (item) => {
    console.log(`[ADMIN ATS] Mengakses Detail Anak dengan ID: ${item.id}`, item);
    if (onDetailClick) {
      onDetailClick(item.id, item);
    } else {
      alert(`Membuka detail untuk: ${item.nama} (ID: ${item.id})`);
    }
  };

  const listKabupaten = useMemo(() => {
    return [...new Set(data.map(item => item.kabupaten))];
  }, [data]);

  const listKecamatan = useMemo(() => {
    const filtered = selectedKabupaten 
      ? data.filter(item => item.kabupaten === selectedKabupaten)
      : data;
    return [...new Set(filtered.map(item => item.kecamatan))];
  }, [data, selectedKabupaten]);

  const handleKabupatenChange = (e) => {
    setSelectedKabupaten(e.target.value);
    setSelectedKecamatan('');
  };

  const filteredData = useMemo(() => {
    return data.filter(item => {
      const matchSearch = item.nama.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          item.nik.includes(searchTerm);
      const matchKabupaten = selectedKabupaten ? item.kabupaten === selectedKabupaten : true;
      const matchKecamatan = selectedKecamatan ? item.kecamatan === selectedKecamatan : true;
      
      return matchSearch && matchKabupaten && matchKecamatan;
    });
  }, [data, searchTerm, selectedKabupaten, selectedKecamatan]);

  return (
    <div className="w-full bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      
      {/* Header Tabel & Filter */}
      <div className="p-6 border-b border-slate-100 flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-800 font-display">Data Anak Tidak Sekolah</h2>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
              Admin Panel
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">Provinsi Sulawesi Tengah (Akses Penuh - Full Access NIK)</p>
        </div>
        
        {/* Elemen Filter Kanan */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          
          {/* Input Pencarian (rounded-full) */}
          <div className="relative flex items-center min-w-[240px]">
            <input
              type="text"
              placeholder="Cari Nama / NIK..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-4 pr-12 py-2.5 bg-slate-50 hover:bg-slate-100/75 focus:bg-white text-sm text-slate-700 rounded-full border border-slate-200 focus:border-[#1C40AC] focus:ring-2 focus:ring-[#1C40AC]/10 outline-none transition-all duration-200"
            />
            <div className="absolute right-1 top-1 bottom-1 w-9 h-9 rounded-full bg-[#1C40AC] hover:bg-blue-800 flex items-center justify-center text-white cursor-pointer shadow-sm transition-colors duration-200">
              <Search size={16} />
            </div>
          </div>

          {/* Dropdown Select Kecamatan */}
          <select
            value={selectedKecamatan}
            onChange={(e) => setSelectedKecamatan(e.target.value)}
            className="px-4 py-2.5 bg-white text-sm text-slate-600 rounded-full border border-slate-200 focus:border-[#1C40AC] focus:ring-2 focus:ring-[#1C40AC]/10 outline-none transition-all duration-200 cursor-pointer appearance-none pr-8 relative bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%2364748B%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22/%3E%3C/svg%3E')] bg-[length:0.65rem_auto] bg-[right_1rem_center] bg-no-repeat"
          >
            <option value="">Semua Kecamatan</option>
            {listKecamatan.map((kec, index) => (
              <option key={index} value={kec}>{kec}</option>
            ))}
          </select>

          {/* Dropdown Select Kabupaten */}
          <select
            value={selectedKabupaten}
            onChange={handleKabupatenChange}
            className="px-4 py-2.5 bg-white text-sm text-slate-600 rounded-full border border-slate-200 focus:border-[#1C40AC] focus:ring-2 focus:ring-[#1C40AC]/10 outline-none transition-all duration-200 cursor-pointer appearance-none pr-8 relative bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%2364748B%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22/%3E%3C/svg%3E')] bg-[length:0.65rem_auto] bg-[right_1rem_center] bg-no-repeat"
          >
            <option value="">Semua Kabupaten/Kota</option>
            {listKabupaten.map((kab, index) => (
              <option key={index} value={kab}>{kab}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Tabel Data ATS */}
      <div className="w-full overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-100">
              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-400">Nama Lengkap</th>
              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-400">Jenis Kelamin</th>
              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-400">NIK</th>
              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-400">Kabupaten / Kota</th>
              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-400">Status Saat Ini</th>
              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-400 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredData.length > 0 ? (
              filteredData.map((item, index) => (
                <tr 
                  key={item.id} 
                  className={`hover:bg-slate-100/50 transition-colors duration-150 ${
                    index % 2 === 0 ? 'bg-slate-50' : 'bg-white'
                  }`}
                >
                  <td className="px-6 py-4 text-sm font-semibold text-slate-700">{item.nama}</td>
                  <td className="px-6 py-4 text-sm text-slate-700">{item.jk}</td>
                  <td className="px-6 py-4 text-sm font-mono text-slate-800 font-semibold">{item.nik}</td>
                  <td className="px-6 py-4 text-sm text-slate-700">
                    <span className="font-medium">{item.kabupaten}</span>
                    <span className="text-xs text-slate-400 block">Kec. {item.kecamatan}</span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {item.status === 'DO' ? (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-600 border border-red-100">
                        Drop Out (DO)
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-orange-50 text-orange-600 border border-orange-100">
                        Lulus Tidak Melanjutkan (LTM)
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-center">
                    <button
                      onClick={() => handleDetail(item)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#1C40AC] hover:bg-[#15328c] text-white text-xs font-medium rounded-md shadow-sm transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#1C40AC]/40"
                    >
                      <Eye size={14} />
                      Detail
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="px-6 py-12 text-center text-slate-400 text-sm">
                  Tidak ada data anak tidak sekolah yang ditemukan.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Footer / Pagination Minimalis */}
      <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
        <span>Menampilkan <strong className="text-slate-700">{filteredData.length}</strong> dari <strong className="text-slate-700">{data.length}</strong> data</span>
        <span className="italic">Panel Kontrol Admin ATS Sulteng</span>
      </div>
    </div>
  );
}
