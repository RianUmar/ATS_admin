import React, { useState, useEffect, useCallback } from 'react';
import AdminAtsTable from '../components/AdminAtsTable';
import StudentDetail from '../components/StudentDetail';
import ImportModal from '../components/ImportModal';
import { 
  getStudentsAPI, 
  getImportHistoryAPI 
} from '../services/api';
import { 
  Users, 
  GraduationCap, 
  ShieldAlert, 
  Layers, 
  ShieldCheck, 
  CheckSquare, 
  Clock, 
  Upload, 
  History, 
  RefreshCw 
} from 'lucide-react';

export default function AtsDashboard() {
  const [selectedDetailId, setSelectedDetailId] = useState(null);
  const [students, setStudents] = useState([]);
  const [importHistory, setImportHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('belum'); // 'belum', 'sudah', 'riwayat'
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [paginationMeta, setPaginationMeta] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState({
    search: '',
    kabupaten: '',
    kecamatan: '',
    status: ''
  });

  // State ringkasan statistik akurat dari basis data
  const [summaryCounts, setSummaryCounts] = useState({
    total: 0,
    doCount: 0,
    ltmCount: 0,
    belumCount: 0,
    sudahCount: 0
  });

  // Ambil metrik ringkasan global dari backend secara akurat
  const fetchGlobalMetrics = useCallback(async () => {
    try {
      const [resAll, resDo, resLtm, resBelum, resSudah] = await Promise.all([
        getStudentsAPI({ per_page: 1 }),
        getStudentsAPI({ status: 'DO', per_page: 1 }),
        getStudentsAPI({ status: 'LTM', per_page: 1 }),
        getStudentsAPI({ filter_tindak_lanjut: 'belum_ditindaklanjuti', per_page: 1 }),
        getStudentsAPI({ filter_tindak_lanjut: 'sudah_ditindaklanjuti', per_page: 1 }),
      ]);

      setSummaryCounts({
        total: resAll.meta?.total ?? resAll.data?.length ?? 0,
        doCount: resDo.meta?.total ?? resDo.data?.length ?? 0,
        ltmCount: resLtm.meta?.total ?? resLtm.data?.length ?? 0,
        belumCount: resBelum.meta?.total ?? resBelum.data?.length ?? 0,
        sudahCount: resSudah.meta?.total ?? resSudah.data?.length ?? 0,
      });
    } catch (err) {
      console.warn('Gagal memuat metrik ringkasan:', err);
    }
  }, []);

  // Ambil data siswa dari backend API berdasarkan tab, halaman, dan filter
  const fetchStudents = useCallback((tab = activeTab, page = 1, currentFilters = filters) => {
    setLoading(true);
    setCurrentPage(page);
    const params = {
      page,
      per_page: 50,
      ...currentFilters
    };

    if (tab === 'belum') {
      params.filter_tindak_lanjut = 'belum_ditindaklanjuti';
    } else if (tab === 'sudah') {
      params.filter_tindak_lanjut = 'sudah_ditindaklanjuti';
    }

    // Bersihkan parameter bernilai kosong
    Object.keys(params).forEach(k => {
      if (params[k] === '' || params[k] === null || params[k] === undefined) {
        delete params[k];
      }
    });

    getStudentsAPI(params)
      .then((response) => {
        setStudents(response.data || []);
        if (response.meta) {
          setPaginationMeta(response.meta);
        }
        setLoading(false);
      })
      .catch((error) => {
        console.error('Gagal memuat data siswa ATS:', error);
        setLoading(false);
      });
  }, [activeTab, filters]);

  // Ambil data riwayat import
  const fetchHistories = () => {
    getImportHistoryAPI()
      .then((res) => {
        setImportHistory(res.data || []);
      })
      .catch((err) => console.error('Gagal mengambil riwayat import:', err));
  };

  useEffect(() => {
    fetchStudents(activeTab, 1, filters);
    fetchGlobalMetrics();
    fetchHistories();
  }, [activeTab, fetchStudents, fetchGlobalMetrics]);

  const handleAdminDetailClick = (id) => {
    setSelectedDetailId(id);
  };

  const handleSaveSuccess = () => {
    fetchStudents(activeTab, currentPage, filters);
    fetchGlobalMetrics();
    fetchHistories();
  };

  const handlePageChange = (newPage) => {
    fetchStudents(activeTab, newPage, filters);
  };

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    fetchStudents(activeTab, 1, newFilters);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      {/* Header Panel Administrator */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-700 flex items-center justify-center text-white font-extrabold text-lg shadow-md shadow-blue-700/20">
              ADM
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-800 tracking-tight font-display flex items-center gap-2">
                ATS <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-100 uppercase">Panel Admin</span>
              </h1>
              <p className="text-xs font-semibold text-slate-500 mt-0.5">
                Sistem Informasi Penanganan Anak Tidak Sekolah Provinsi Sulawesi Tengah
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-1.5 text-xs font-bold text-blue-700 bg-blue-50 px-3.5 py-1.5 rounded-full border border-blue-100">
              <ShieldCheck size={14} className="text-blue-700" />
              Sesi Admin Terhubung
            </div>
            <button
              onClick={() => { fetchStudents(activeTab, currentPage, filters); fetchGlobalMetrics(); fetchHistories(); }}
              title="Segarkan Data"
              className="p-2 text-slate-400 hover:text-blue-700 hover:bg-blue-50 rounded-xl transition-all cursor-pointer border border-transparent hover:border-blue-100"
            >
              <RefreshCw size={16} />
            </button>
          </div>
        </div>
      </header>

      {/* Konten Utama */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full">
        
        {/* Tampilan Detail Siswa */}
        {selectedDetailId ? (
          <StudentDetail 
            id={selectedDetailId} 
            onBack={() => setSelectedDetailId(null)}
            onSaveSuccess={handleSaveSuccess}
          />
        ) : (
          /* Tampilan Utama Dashboard */
          <div className="space-y-8 animate-fadeIn">
            
            {/* Banner Selamat Datang */}
            <div className="p-6 sm:p-8 bg-gradient-to-r from-blue-700 via-blue-800 to-indigo-900 rounded-3xl text-white shadow-lg shadow-blue-700/10 relative overflow-hidden">
              <div className="absolute right-0 bottom-0 opacity-10 translate-x-12 translate-y-12 scale-150 pointer-events-none">
                <Layers size={240} />
              </div>
              <div className="relative z-10 max-w-3xl space-y-2">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-bold bg-blue-500/30 text-blue-100 border border-blue-400/20">
                  Data Terintegrasi Backend Laravel • Basis Data MySQL (4.268 Data Se-Sulteng)
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-display">
                  Dashboard Administrasi & Intervensi ATS
                </h2>
                <p className="text-xs sm:text-sm text-blue-100/90 leading-relaxed font-light">
                  Kelola data Anak Tidak Sekolah (ATS) di 13 Kabupaten/Kota se-Provinsi Sulawesi Tengah, validasi lokasi domisili geospasial, serta input tindak lanjut kunjungan lapangan langsung ke basis data terpadu.
                </p>
              </div>
            </div>

            {/* Metrik Statistik Ringkas (Akurat dari Basis Data) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              
              <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-all duration-200">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
                  <Users size={22} />
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Total ATS Provinsi</p>
                  <h3 className="text-2xl font-bold text-slate-800 mt-0.5">
                    {summaryCounts.total} Jiwa
                  </h3>
                </div>
              </div>

              <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-all duration-200">
                <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center font-bold">
                  <ShieldAlert size={22} />
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Drop Out (DO)</p>
                  <h3 className="text-2xl font-bold text-slate-800 mt-0.5">
                    {summaryCounts.doCount} Anak
                  </h3>
                </div>
              </div>

              <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-all duration-200">
                <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center font-bold">
                  <GraduationCap size={22} />
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">LTM</p>
                  <h3 className="text-2xl font-bold text-slate-800 mt-0.5">
                    {summaryCounts.ltmCount} Anak
                  </h3>
                </div>
              </div>

              <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-all duration-200">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                  <CheckSquare size={22} />
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Sudah Ditindak</p>
                  <h3 className="text-2xl font-bold text-slate-800 mt-0.5">
                    {summaryCounts.sudahCount} Anak
                  </h3>
                </div>
              </div>

            </div>

            {/* Container Tabel dengan Tab Filter & Tombol Impor */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-100">
              
              {/* Tab Selector Row */}
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between border-b border-slate-200 mb-6 pb-2 gap-4">
                <div className="flex overflow-x-auto whitespace-nowrap scrollbar-none gap-2">
                  <button
                    onClick={() => setActiveTab('belum')}
                    className={`flex items-center gap-2 px-5 py-3 font-bold text-xs transition-all border-b-2 cursor-pointer focus:outline-none ${
                      activeTab === 'belum' 
                        ? 'border-blue-700 text-blue-700' 
                        : 'border-transparent text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    <Clock size={15} />
                    Belum Ditindaklanjuti
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ml-1 ${
                      activeTab === 'belum' ? 'bg-blue-50 text-blue-700 border border-blue-100' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {summaryCounts.belumCount}
                    </span>
                  </button>

                  <button
                    onClick={() => setActiveTab('sudah')}
                    className={`flex items-center gap-2 px-5 py-3 font-bold text-xs transition-all border-b-2 cursor-pointer focus:outline-none ${
                      activeTab === 'sudah' 
                        ? 'border-emerald-600 text-emerald-600' 
                        : 'border-transparent text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    <CheckSquare size={15} />
                    Sudah Ditindaklanjuti
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ml-1 ${
                      activeTab === 'sudah' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {summaryCounts.sudahCount}
                    </span>
                  </button>

                  <button
                    onClick={() => setActiveTab('riwayat')}
                    className={`flex items-center gap-2 px-5 py-3 font-bold text-xs transition-all border-b-2 cursor-pointer focus:outline-none ${
                      activeTab === 'riwayat' 
                        ? 'border-indigo-600 text-indigo-600' 
                        : 'border-transparent text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    <History size={15} />
                    Riwayat Import & Log
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ml-1 ${
                      activeTab === 'riwayat' ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {importHistory.length}
                    </span>
                  </button>
                </div>
                
                {/* Tombol Import Excel */}
                <button
                  type="button"
                  onClick={() => setIsImportModalOpen(true)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-700/10 transition-colors cursor-pointer self-start lg:self-auto"
                >
                  <Upload size={15} />
                  Import Data ATS (Excel / CSV)
                </button>
              </div>

              {/* Render Tabel Aktif */}
              <div>
                {activeTab === 'belum' || activeTab === 'sudah' ? (
                  <AdminAtsTable 
                    data={students} 
                    loading={loading}
                    onDetailClick={handleAdminDetailClick} 
                    pagination={paginationMeta}
                    onPageChange={handlePageChange}
                    onFilterChange={handleFilterChange}
                  />
                ) : (
                  /* TABEL RIWAYAT IMPORT & TINDAK LANJUT */
                  <div className="space-y-6">
                    <div className="w-full overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-slate-150 bg-slate-50/50">
                            <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-400">Tanggal & Waktu</th>
                            <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-400">Periode Data</th>
                            <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-400">Nama Berkas</th>
                            <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-400 text-center">Data Sukses</th>
                            <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-400 text-center">Data Duplikat/Skip</th>
                            <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-400 text-center">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {importHistory.length > 0 ? (
                            importHistory.map((item, index) => (
                              <tr 
                                key={item.id || index} 
                                className={`hover:bg-slate-100/30 transition-colors ${
                                  index % 2 === 0 ? 'bg-slate-50/50' : 'bg-white'
                                }`}
                              >
                                <td className="px-6 py-4 text-xs text-slate-600 font-semibold">
                                  {new Date(item.tanggalImport).toLocaleString('id-ID', {
                                    day: '2-digit',
                                    month: 'long',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </td>
                                <td className="px-6 py-4 text-xs font-bold text-slate-800">Periode #{item.periode}</td>
                                <td className="px-6 py-4 text-xs font-mono text-slate-600 max-w-[220px] truncate" title={item.namaFile}>
                                  {item.namaFile}
                                </td>
                                <td className="px-6 py-4 text-xs text-center">
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                                    +{item.importedCount} Data
                                  </span>
                                </td>
                                <td className="px-6 py-4 text-xs text-center">
                                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                                    item.skippedCount > 0 ? 'bg-amber-50 text-amber-700 border-amber-100' : 'bg-slate-50 text-slate-400 border-slate-100'
                                  }`}>
                                    {item.skippedCount} Dilewati
                                  </span>
                                </td>
                                <td className="px-6 py-4 text-xs text-center">
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-100">
                                    Selesai
                                  </span>
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan="6" className="px-6 py-12 text-center text-slate-400 text-xs">
                                Belum ada riwayat pengimporan berkas.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>

            </div>

          </div>
        )}
      </main>

      {/* Modal Import Berkas */}
      <ImportModal 
        isOpen={isImportModalOpen} 
        onClose={() => setIsImportModalOpen(false)}
        onImportSuccess={handleSaveSuccess}
      />

      {/* Footer Portal */}
      <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© 2026 BLPT - Dinas Pendidikan Provinsi Sulawesi Tengah</p>
          <p className="text-slate-400 font-semibold">Sistem Informasi ATS Bersama • Akses Administrator</p>
        </div>
      </footer>
    </div>
  );
}
