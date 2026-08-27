import React, { useState, useEffect, useCallback } from 'react';
import AdminAtsTable from '../components/AdminAtsTable';
import StudentDetail from '../components/StudentDetail';
import ImportModal from '../components/ImportModal';
import FilteredExportView from '../components/FilteredExportView';
import ImportDataView from '../components/ImportDataView';
import ImportHistoryView from '../components/ImportHistoryView';
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
  RefreshCw,
  Download,
  Filter,
  Sparkles,
  ArrowRight,
  FileSpreadsheet,
  Menu,
  X
} from 'lucide-react';

export default function AtsDashboard() {
  const [mainView, setMainView] = useState('dashboard'); // 'dashboard' | 'export'
  const [selectedDetailId, setSelectedDetailId] = useState(null);
  const [students, setStudents] = useState([]);
  const [importHistory, setImportHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('belum'); // 'belum', 'sudah', 'riwayat'
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
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
        console.error('[AtsDashboard] Gagal memuat data siswa:', error);
        setLoading(false);
      });
  }, [activeTab, filters]);

  // Ambil data riwayat import
  const fetchHistories = useCallback(() => {
    getImportHistoryAPI()
      .then((res) => {
        setImportHistory(res.data || []);
      })
      .catch((err) => console.error('Gagal mengambil riwayat import:', err));
  }, []);

  useEffect(() => {
    fetchStudents(activeTab, 1, filters);
    fetchGlobalMetrics();
    fetchHistories();
  }, [activeTab, fetchStudents, fetchGlobalMetrics, fetchHistories]);

  const handleAdminDetailClick = (id) => {
    setSelectedDetailId(id);
  };

  const handleImportSuccess = () => {
    fetchStudents(activeTab, 1, filters);
    fetchGlobalMetrics();
    fetchHistories();
  };

  const handleSaveSuccess = () => {
    fetchStudents(activeTab, currentPage, filters);
    fetchGlobalMetrics();
  };

  const handlePageChange = (newPage) => {
    fetchStudents(activeTab, newPage, filters);
  };

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    fetchStudents(activeTab, 1, newFilters);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* 1. SIDEBAR NAVIGATION */}
      {/* Backdrop overlay for mobile drawer */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 lg:hidden transition-opacity duration-300"
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}

      <aside className={`fixed inset-y-0 left-0 w-64 bg-white/60 backdrop-blur-2xl border-r border-white/50 shadow-[4px_0_30px_rgba(0,0,0,0.03)] flex flex-col justify-between z-50 transform transition-transform duration-300 lg:translate-x-0 lg:sticky lg:top-0 lg:h-screen lg:flex-shrink-0 ${
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        {/* Top: Logo & App Title */}
        <div className="space-y-6 relative">
          
          <div className="h-24 px-6 border-b border-white/50 flex items-center justify-between gap-3 relative overflow-hidden">
            {/* Subtle glass glow behind logo */}
            <div className="absolute -top-10 -left-10 w-40 h-40 bg-blue-500/15 rounded-full blur-3xl pointer-events-none"></div>

            <div className="flex items-center gap-3 relative z-10">
              {/* Logo Container */}
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-700 to-indigo-600 text-white flex items-center justify-center font-extrabold text-[10px] shadow-lg shadow-blue-700/20 border border-blue-500 flex-shrink-0 ring-4 ring-white/50">
                ATS
              </div>
              <div className="min-w-0">
                <h1 className="text-sm font-extrabold text-slate-800 tracking-tight truncate leading-tight font-display drop-shadow-sm">
                  ATS BERSAMA
                </h1>
                <span className="text-[10px] font-bold text-blue-600/90 uppercase tracking-wider block mt-0.5">
                  Panel Admin
                </span>
              </div>
            </div>
            
            {/* Close button on mobile */}
            <button 
              onClick={() => setIsSidebarOpen(false)}
              className="lg:hidden relative z-10 p-1.5 text-slate-400 hover:text-slate-700 hover:bg-white/80 rounded-lg cursor-pointer transition-colors shadow-sm"
            >
              <X size={16} />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="px-4 space-y-2 relative z-10">
            <button
              onClick={() => {
                setMainView('dashboard');
                setSelectedDetailId(null);
                setIsSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-xs font-bold transition-all duration-300 cursor-pointer ${
                mainView === 'dashboard' && !selectedDetailId
                  ? 'bg-white/80 text-blue-700 shadow-md shadow-slate-200/40 border border-white font-extrabold scale-[1.02]'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-white/50'
              }`}
            >
              <Users size={17} className={mainView === 'dashboard' && !selectedDetailId ? 'text-blue-700' : 'text-slate-400'} />
              <span>Dashboard & Data ATS</span>
            </button>

            <button
              onClick={() => {
                setMainView('export');
                setSelectedDetailId(null);
                setIsSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-xs font-bold transition-all duration-300 cursor-pointer ${
                mainView === 'export' && !selectedDetailId
                  ? 'bg-white/80 text-blue-700 shadow-md shadow-slate-200/40 border border-white font-extrabold scale-[1.02]'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-white/50'
              }`}
            >
              <Download size={17} className={mainView === 'export' && !selectedDetailId ? 'text-blue-700' : 'text-slate-400'} />
              <span>Unduh Rekapan Data ATS</span>
            </button>

            <button
              onClick={() => {
                setMainView('import');
                setSelectedDetailId(null);
                setIsSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-xs font-bold transition-all duration-300 cursor-pointer ${
                mainView === 'import' && !selectedDetailId
                  ? 'bg-white/80 text-blue-700 shadow-md shadow-slate-200/40 border border-white font-extrabold scale-[1.02]'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-white/50'
              }`}
            >
              <Upload size={17} className={mainView === 'import' && !selectedDetailId ? 'text-blue-700' : 'text-slate-400'} />
              <span>Upload Data ATS</span>
            </button>

            <button
              onClick={() => {
                setMainView('history');
                setSelectedDetailId(null);
                setIsSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-xs font-bold transition-all duration-300 cursor-pointer ${
                mainView === 'history' && !selectedDetailId
                  ? 'bg-white/80 text-blue-700 shadow-md shadow-slate-200/40 border border-white font-extrabold scale-[1.02]'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-white/50'
              }`}
            >
              <History size={17} className={mainView === 'history' && !selectedDetailId ? 'text-blue-700' : 'text-slate-400'} />
              <span>Histori Upload ATS</span>
            </button>
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-slate-100 text-center">
          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
            Sistem ATS • Prov. Sulteng
          </div>
        </div>
      </aside>

      {/* 2. MAIN CONTENT WRAPPER */}
      <div className="flex-1 min-w-0 flex flex-col justify-between min-h-screen">

        {/* Main Content Pane */}
        <main className="w-full max-w-[1850px] mx-auto px-6 sm:px-8 lg:px-10 py-8 flex-grow">
          {selectedDetailId ? (
            <StudentDetail 
              id={selectedDetailId} 
              onBack={() => setSelectedDetailId(null)}
              onSaveSuccess={handleSaveSuccess}
            />
          ) : mainView === 'export' ? (
            <FilteredExportView
              onNavigateToDashboard={() => {
                setMainView('dashboard');
                fetchStudents();
                fetchGlobalMetrics();
              }}
            />
          ) : mainView === 'import' ? (
            <ImportDataView
              onNavigateToDashboard={() => {
                setMainView('dashboard');
                fetchStudents();
                fetchGlobalMetrics();
              }}
              onImportSuccess={handleSaveSuccess}
            />
          ) : mainView === 'history' ? (
            <ImportHistoryView
              onNavigateToImport={() => {
                setMainView('import');
              }}
              onNavigateToDashboard={() => {
                setMainView('dashboard');
                fetchStudents();
                fetchGlobalMetrics();
              }}
            />
          ) : (
            <div className="space-y-8 animate-fadeIn">
              <div className="p-8 sm:p-10 bg-gradient-to-r from-blue-900 via-slate-900 to-black rounded-3xl text-white shadow-xl shadow-slate-900/10 relative overflow-hidden">
                <div className="absolute right-0 bottom-0 opacity-20 translate-x-12 translate-y-12 scale-150 pointer-events-none">
                  <Layers size={300} />
                </div>
                <div className="relative z-10 max-w-4xl space-y-3">
                  <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight font-display">
                    Dashboard Administrasi & Intervensi ATS
                  </h2>
                  <p className="text-sm sm:text-base text-blue-100/90 leading-relaxed font-light">
                    Kelola data Anak Tidak Sekolah (ATS) di 13 Kabupaten/Kota se-Provinsi Sulawesi Tengah, validasi lokasi domisili geospasial, serta input tindak lanjut kunjungan lapangan langsung ke basis data terpadu.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-5 hover:shadow-md transition-all duration-200">
                  <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold flex-shrink-0">
                    <Users size={26} />
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm text-slate-400 font-extrabold uppercase tracking-wider">Total ATS Provinsi</p>
                    <h3 className="text-3xl font-extrabold text-slate-800 mt-1">
                      {summaryCounts.total.toLocaleString('id-ID')} Jiwa
                    </h3>
                  </div>
                </div>

                <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-5 hover:shadow-md transition-all duration-200">
                  <div className="w-14 h-14 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center font-bold flex-shrink-0">
                    <ShieldAlert size={26} />
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm text-slate-400 font-extrabold uppercase tracking-wider">Drop Out (DO)</p>
                    <h3 className="text-3xl font-extrabold text-slate-800 mt-1">
                      {summaryCounts.doCount.toLocaleString('id-ID')} Anak
                    </h3>
                  </div>
                </div>

                <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-5 hover:shadow-md transition-all duration-200">
                  <div className="w-14 h-14 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center font-bold flex-shrink-0">
                    <GraduationCap size={26} />
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm text-slate-400 font-extrabold uppercase tracking-wider">LTM</p>
                    <h3 className="text-3xl font-extrabold text-slate-800 mt-1">
                      {summaryCounts.ltmCount.toLocaleString('id-ID')} Anak
                    </h3>
                  </div>
                </div>

                <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-5 hover:shadow-md transition-all duration-200">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold flex-shrink-0">
                    <CheckSquare size={26} />
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm text-slate-400 font-extrabold uppercase tracking-wider">Sudah Ditindak</p>
                    <h3 className="text-3xl font-extrabold text-slate-800 mt-1">
                      {summaryCounts.sudahCount.toLocaleString('id-ID')} Anak
                    </h3>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-100">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 mb-6 pb-2 gap-4">
                  <div className="flex overflow-x-auto whitespace-nowrap scrollbar-none gap-3">
                    <button
                      onClick={() => setActiveTab('belum')}
                      className={`flex items-center gap-2.5 px-6 py-3.5 font-extrabold text-sm transition-all border-b-2 cursor-pointer focus:outline-none ${
                        activeTab === 'belum' 
                          ? 'border-blue-700 text-blue-700' 
                          : 'border-transparent text-slate-400 hover:text-slate-600'
                      }`}
                    >
                      <Clock size={17} />
                      Belum Ditindaklanjuti
                      <span className={`text-xs px-2.5 py-0.5 rounded-full font-extrabold ml-1 ${
                        activeTab === 'belum' ? 'bg-blue-50 text-blue-700 border border-blue-100' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {summaryCounts.belumCount.toLocaleString('id-ID')}
                      </span>
                    </button>

                    <button
                      onClick={() => setActiveTab('sudah')}
                      className={`flex items-center gap-2.5 px-6 py-3.5 font-extrabold text-sm transition-all border-b-2 cursor-pointer focus:outline-none ${
                        activeTab === 'sudah' 
                          ? 'border-emerald-600 text-emerald-600' 
                          : 'border-transparent text-slate-400 hover:text-slate-600'
                      }`}
                    >
                      <CheckSquare size={17} />
                      Sudah Ditindaklanjuti
                      <span className={`text-xs px-2.5 py-0.5 rounded-full font-extrabold ml-1 ${
                        activeTab === 'sudah' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {summaryCounts.sudahCount.toLocaleString('id-ID')}
                      </span>
                    </button>
                  </div>
                </div>

                <div>
                  <AdminAtsTable 
                    data={students} 
                    loading={loading}
                    onDetailClick={handleAdminDetailClick} 
                    pagination={paginationMeta}
                    onPageChange={handlePageChange}
                    onFilterChange={handleFilterChange}
                  />
                </div>
              </div>

            </div>
          )}
        </main>

        <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-400">
          <div className="items-center ">
            <p>© 2026 BLPT - Dinas Pendidikan Provinsi Sulawesi Tengah</p>
          </div>
        </footer>
      </div>

      <ImportModal 
        isOpen={isImportModalOpen} 
        onClose={() => setIsImportModalOpen(false)}
        onImportSuccess={handleImportSuccess}
      />
    </div>
  );
}
