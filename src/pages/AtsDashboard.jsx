import React, { useState, useEffect } from 'react';
import AdminAtsTable from '../components/AdminAtsTable';
import StudentDetail from '../components/StudentDetail';
import ImportModal from '../components/ImportModal';
import { getStudentsAPI, getImportHistoryAPI } from '../services/api';
import { 
  Users, 
  GraduationCap, 
  ShieldAlert, 
  Layers, 
  ShieldCheck, 
  CheckSquare, 
  Clock,
  Upload,
  History
} from 'lucide-react';

export default function AtsDashboard() {
  const [selectedDetailId, setSelectedDetailId] = useState(null);
  const [students, setStudents] = useState([]);
  const [importHistory, setImportHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('belum'); // 'belum', 'sudah', atau 'riwayat'
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // Ambil data siswa dari mock API saat load dashboard
  const fetchStudents = () => {
    getStudentsAPI()
      .then((response) => {
        setStudents(response.data || []);
        setLoading(false);
      })
      .catch((error) => {
        console.error('Gagal mengambil data siswa:', error);
        setLoading(false);
      });
  };

  // Ambil data riwayat import
  const fetchImportHistory = () => {
    getImportHistoryAPI()
      .then((response) => {
        setImportHistory(response.data || []);
      })
      .catch((error) => {
        console.error('Gagal mengambil riwayat import:', error);
      });
  };

  useEffect(() => {
    fetchStudents();
    fetchImportHistory();
  }, []);

  const handleAdminDetailClick = (id) => {
    setSelectedDetailId(id);
  };

  const handleSaveSuccess = () => {
    fetchStudents(); // Refresh data setelah tindakan lanjut disimpan
    fetchImportHistory(); // Refresh riwayat import
  };

  // Membagi data siswa secara dinamis berdasarkan status tindakan lanjut
  const { studentsBelumTindakLanjut, studentsSudahTindakLanjut } = React.useMemo(() => {
    const belum = students.filter(s => s.tindakanLanjut === null);
    const sudah = students.filter(s => s.tindakanLanjut !== null);
    return {
      studentsBelumTindakLanjut: belum,
      studentsSudahTindakLanjut: sudah
    };
  }, [students]);

  // Kalkulasi statistik secara dinamis berdasarkan data siswa saat ini
  const stats = React.useMemo(() => {
    const total = students.length;
    const doCount = students.filter(s => s.status === 'DO').length;
    const ltmCount = students.filter(s => s.status === 'LTM').length;
    const tindakLanjutCount = students.filter(s => s.tindakanLanjut !== null).length;

    return {
      total,
      doCount,
      ltmCount,
      tindakLanjutCount
    };
  }, [students]);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header Premium */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-blue-700 flex items-center justify-center text-white font-extrabold text-lg shadow-md shadow-blue-700/20">
              ADM
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-800 tracking-tight font-display leading-none">
                ATS <span className="text-xs font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 ml-1.5 border border-blue-100">ADMIN</span>
              </h1>
              <p className="text-xs font-semibold text-slate-500 mt-1">
                Panel Administrasi Anak Tidak Sekolah Provinsi Sulawesi Tengah
              </p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-1.5 text-xs font-semibold text-blue-700 bg-blue-50 px-3 py-1.5 rounded-full border border-blue-100">
            <ShieldCheck size={14} className="text-blue-600" />
            Sesi Administrator Aktif
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Render Tampilan Detail jika ada siswa yang terpilih */}
        {selectedDetailId ? (
          <StudentDetail 
            id={selectedDetailId} 
            onBack={() => setSelectedDetailId(null)}
            onSaveSuccess={handleSaveSuccess}
          />
        ) : (
          /* Tampilan Utama Dashboard (Tabel & Statistik) */
          <div className="space-y-8 animate-fadeIn">
            {/* Info Banner - Sulteng */}
            <div className="p-6 bg-gradient-to-r from-blue-700 to-indigo-900 rounded-2xl text-white shadow-md relative overflow-hidden">
              <div className="absolute right-0 bottom-0 opacity-10 translate-x-12 translate-y-12 scale-150">
                <Layers size={240} />
              </div>
              <div className="relative z-10 max-w-3xl">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500/30 text-blue-100 border border-blue-400/20 mb-3">
                  Keamanan Data Penuh
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-display mb-2">
                  Panel Pengelolaan Data Anak Tidak Sekolah
                </h2>
                <p className="text-sm text-blue-100/90 leading-relaxed font-light font-sans">
                  Selamat datang di portal pengelolaan. Data NIK terbuka secara penuh untuk kebutuhan validasi dan integrasi instansi terkait. Jaga kerahasiaan data ini sesuai regulasi yang berlaku.
                </p>
              </div>
            </div>

            {/* Ringkasan Statistik Dinamis */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              
              <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-all duration-200">
                <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Users size={22} />
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Total ATS</p>
                  <h3 className="text-2xl font-bold text-slate-800 mt-0.5">
                    {loading ? '...' : `${stats.total} Jiwa`}
                  </h3>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-all duration-200">
                <div className="w-12 h-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
                  <ShieldAlert size={22} />
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Drop Out (DO)</p>
                  <h3 className="text-2xl font-bold text-slate-800 mt-0.5">
                    {loading ? '...' : `${stats.doCount} Anak`}
                  </h3>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-all duration-200">
                <div className="w-12 h-12 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center">
                  <GraduationCap size={22} />
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">LTM</p>
                  <h3 className="text-2xl font-bold text-slate-800 mt-0.5">
                    {loading ? '...' : `${stats.ltmCount} Anak`}
                  </h3>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-all duration-200">
                <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <CheckSquare size={22} />
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Ditindaklanjuti</p>
                  <h3 className="text-2xl font-bold text-slate-800 mt-0.5">
                    {loading ? '...' : `${stats.tindakLanjutCount} Anak`}
                  </h3>
                </div>
              </div>

            </div>

            {/* Pemisah Tabel Berdasarkan Status Tindakan & Fitur Import */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
              {/* Tab Selector & Import Button Row */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 mb-6 pb-2 gap-4">
                {/* Tab Selector Switcher */}
                <div className="flex overflow-x-auto whitespace-nowrap scrollbar-none gap-2">
                  <button
                    onClick={() => setActiveTab('belum')}
                    className={`flex items-center gap-2.5 px-6 py-3.5 font-bold text-sm transition-all duration-250 border-b-2 cursor-pointer focus:outline-none ${
                      activeTab === 'belum' 
                        ? 'border-blue-700 text-blue-700' 
                        : 'border-transparent text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    <Clock size={16} />
                    Belum Ditindaklanjuti
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ml-1 transition-colors ${
                      activeTab === 'belum' ? 'bg-blue-50 text-blue-700 border border-blue-100' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {studentsBelumTindakLanjut.length}
                    </span>
                  </button>
                  <button
                    onClick={() => setActiveTab('sudah')}
                    className={`flex items-center gap-2.5 px-6 py-3.5 font-bold text-sm transition-all duration-250 border-b-2 cursor-pointer focus:outline-none ${
                      activeTab === 'sudah' 
                        ? 'border-emerald-600 text-emerald-600' 
                        : 'border-transparent text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    <CheckSquare size={16} />
                    Sudah Ditindaklanjuti
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ml-1 transition-colors ${
                      activeTab === 'sudah' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {studentsSudahTindakLanjut.length}
                    </span>
                  </button>
                  <button
                    onClick={() => setActiveTab('riwayat')}
                    className={`flex items-center gap-2.5 px-6 py-3.5 font-bold text-sm transition-all duration-250 border-b-2 cursor-pointer focus:outline-none ${
                      activeTab === 'riwayat' 
                        ? 'border-indigo-600 text-indigo-600' 
                        : 'border-transparent text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    <History size={16} />
                    Riwayat Import
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ml-1 transition-colors ${
                      activeTab === 'riwayat' ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {importHistory.length}
                    </span>
                  </button>
                </div>
                
                {/* Tombol Import Data */}
                <button
                  type="button"
                  onClick={() => setIsImportModalOpen(true)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-700 hover:bg-blue-800 text-white text-sm font-bold rounded-xl shadow-md shadow-blue-700/10 transition-colors duration-200 cursor-pointer self-start sm:self-auto"
                >
                  <Upload size={16} />
                  Import Data ATS (Excel / CSV)
                </button>
              </div>

              {/* Render Tabel Aktif */}
              <div className="transition-all duration-300">
                {loading ? (
                  <div className="w-full text-center flex flex-col items-center justify-center min-h-[300px]">
                    <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-sm text-slate-500 mt-3 font-semibold">Memuat Data Siswa...</span>
                  </div>
                ) : activeTab === 'belum' ? (
                  <AdminAtsTable 
                    data={studentsBelumTindakLanjut} 
                    onDetailClick={handleAdminDetailClick} 
                  />
                ) : activeTab === 'sudah' ? (
                  <AdminAtsTable 
                    data={studentsSudahTindakLanjut} 
                    onDetailClick={handleAdminDetailClick} 
                  />
                ) : (
                  /* TABEL RIWAYAT IMPORT */
                  <div className="w-full overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-150 bg-slate-50/50">
                          <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-400">Tanggal & Waktu</th>
                          <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-400">Periode Data</th>
                          <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-400">Nama Berkas</th>
                          <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-400 text-center">Data Sukses</th>
                          <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-400 text-center">Data Duplikat/Skip</th>
                          <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-400 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {importHistory.length > 0 ? (
                          importHistory.map((item, index) => (
                            <tr 
                              key={item.id} 
                              className={`hover:bg-slate-100/30 transition-colors duration-150 ${
                                index % 2 === 0 ? 'bg-slate-50/50' : 'bg-white'
                              }`}
                            >
                              <td className="px-6 py-4 text-sm text-slate-600 font-semibold">
                                {new Date(item.tanggalImport).toLocaleString('id-ID', {
                                  day: '2-digit',
                                  month: 'long',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                  timeZoneName: 'short'
                                })}
                              </td>
                              <td className="px-6 py-4 text-sm font-bold text-slate-800">{item.periode}</td>
                              <td className="px-6 py-4 text-sm font-mono text-slate-500 max-w-[220px] truncate" title={item.namaFile}>
                                {item.namaFile}
                              </td>
                              <td className="px-6 py-4 text-sm text-center">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                                  +{item.importedCount} Jiwa
                                </span>
                              </td>
                              <td className="px-6 py-4 text-sm text-center">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                                  item.skippedCount > 0 ? 'bg-amber-50 text-amber-700 border-amber-100' : 'bg-slate-50 text-slate-400 border-slate-100'
                                }`}>
                                  {item.skippedCount} Dilewati
                                </span>
                              </td>
                              <td className="px-6 py-4 text-sm text-center">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-100">
                                  Selesai
                                </span>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="6" className="px-6 py-12 text-center text-slate-400 text-sm">
                              Belum ada arsip riwayat pengimporan data.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Import Modal */}
      <ImportModal 
        isOpen={isImportModalOpen} 
        onClose={() => setIsImportModalOpen(false)}
        onImportSuccess={handleSaveSuccess}
      />

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-8 mt-16 text-center text-xs text-slate-400">
        <p>© 2026 BLPT - Dinas Pendidikan Provinsi Sulawesi Tengah</p>
      </footer>
    </div>
  );
}
