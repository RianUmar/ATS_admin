import React, { useState, useEffect } from 'react';
import { 
  History, 
  FileSpreadsheet, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Search, 
  Filter, 
  Eye, 
  Download, 
  ArrowRight,
  User,
  Calendar,
  Layers,
  FileCheck,
  ChevronDown,
  ChevronUp,
  X
} from 'lucide-react';
import { getImportHistoryAPI } from '../services/api';
import * as XLSX from 'xlsx';

export default function ImportHistoryView({ onNavigateToImport, onNavigateToDashboard }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLog, setSelectedLog] = useState(null);
  const [expandedLogId, setExpandedLogId] = useState(null);

  useEffect(() => {
    // Panggil API backend Laravel /api/ats/riwayat-import
    getImportHistoryAPI()
      .then((res) => {
        if (res.data && Array.isArray(res.data) && res.data.length > 0) {
          const mapped = res.data.map(item => ({
            id: item.id ? (String(item.id).startsWith('IMP') ? item.id : `IMP-${item.id}`) : `IMP-${Date.now()}`,
            periode: item.periode_data || item.periode || 'Periode Baru',
            namaFile: item.nama_berkas || item.namaFile || 'berkas_ats.xlsx',
            tanggalImport: item.created_at || item.tanggalImport || new Date().toISOString(),
            importedCount: item.data_sukses ?? item.importedCount ?? 0,
            skippedCount: item.data_duplikat ?? item.skippedCount ?? 0,
            pengunggah: item.user?.name || item.pengunggah || 'Admin ATS',
            status: item.status || 'Selesai',
            catatan: item.catatan || 'Data terverifikasi backend',
            sampleStudents: item.sampleStudents || item.anak_tidak_sekolah || [
              { nama: 'Ahmad Nur Fauzi', nik: '7207052308990001', nisn: '0075489621', jk: 'Laki-laki', kabupaten: 'Kab. Sigi', kecamatan: 'Gumbasa', desa: 'Pakuli', status: 'DO', sekolah: 'SMPN 2 Gumbasa' }
            ]
          }));
          setLogs(mapped);
          if (mapped[0]) setExpandedLogId(mapped[0].id);
        }
      })
      .catch((err) => {
        console.warn('[ImportHistoryView] Menggunakan data mock histori:', err);
      });
  }, []);

  // Filter logs berdasarkan kata kunci pencarian (Nama file, ID, atau Periode)
  const filteredLogs = logs.filter((item) => {
    const q = searchQuery.toLowerCase();
    return (
      item.namaFile.toLowerCase().includes(q) ||
      item.periode.toLowerCase().includes(q) ||
      (item.id && item.id.toLowerCase().includes(q)) ||
      (item.pengunggah && item.pengunggah.toLowerCase().includes(q))
    );
  });

  // Hitung total akumulasi statistik
  const totalFiles = logs.length;
  const totalImportedRows = logs.reduce((sum, item) => sum + (item.importedCount || 0), 0);
  const totalSkippedRows = logs.reduce((sum, item) => sum + (item.skippedCount || 0), 0);

  // Fungsi Ekspor Ulang Data Batch ke Excel
  const handleExportBatchToExcel = (batchItem) => {
    if (!batchItem.sampleStudents || batchItem.sampleStudents.length === 0) return;

    const exportRows = batchItem.sampleStudents.map((s, idx) => ({
      'No': idx + 1,
      'Nama Lengkap': s.nama,
      'NIK': s.nik,
      'NISN': s.nisn,
      'Jenis Kelamin': s.jk,
      'Kabupaten': s.kabupaten,
      'Kecamatan': s.kecamatan,
      'Desa / Kelurahan': s.desa,
      'Status ATS': s.status,
      'Asal Sekolah': s.sekolah,
      'ID Periode Import': batchItem.id,
      'Tanggal Upload': new Date(batchItem.tanggalImport).toLocaleDateString('id-ID')
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Data ATS Batch');
    XLSX.writeFile(workbook, `Rekap_${batchItem.id}_${batchItem.namaFile}`);
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* 1. Banner Header Hero */}
      <div className="p-6 sm:p-8 bg-gradient-to-r from-blue-900 via-slate-900 to-black rounded-3xl text-white shadow-xl shadow-slate-900/10 relative overflow-hidden">
        <div className="absolute right-0 bottom-0 opacity-20 translate-x-12 translate-y-12 scale-150 pointer-events-none">
          <History size={300} />
        </div>
        <div className="relative z-10 max-w-4xl space-y-3">
          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight font-display">
            Riwayat & Log Pengimporan Data ATS
          </h2>
          <p className="text-sm sm:text-base text-blue-100/90 leading-relaxed font-light">
            Pantau jejak histori pengunggahan berkas Excel/CSV data Dapodik Anak Tidak Sekolah, audit rincian batch pengimporan, serta pratinjau data siswa per periode.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={onNavigateToImport}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-bold rounded-xl backdrop-blur-xs transition-colors cursor-pointer"
            >
              <Download size={14} />
              <span>Unggah Berkas Baru</span>
            </button>
          </div>

        </div>
      </div>

      {/* 2. Kartu Statistik Ringkasan Histori */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-5 hover:shadow-md transition-all duration-200">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold flex-shrink-0">
            <FileSpreadsheet size={26} />
          </div>
          <div>
            <p className="text-xs sm:text-sm text-slate-400 font-extrabold uppercase tracking-wider">Total Berkas Diimpor</p>
            <h3 className="text-3xl font-extrabold text-slate-800 mt-1">
              {totalFiles} Berkas
            </h3>
          </div>
        </div>

        <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-5 hover:shadow-md transition-all duration-200">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold flex-shrink-0">
            <CheckCircle2 size={26} />
          </div>
          <div>
            <p className="text-xs sm:text-sm text-slate-400 font-extrabold uppercase tracking-wider">Total Data ATS Masuk</p>
            <h3 className="text-3xl font-extrabold text-emerald-700 mt-1">
              {totalImportedRows.toLocaleString('id-ID')} Baris
            </h3>
          </div>
        </div>

        <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-5 hover:shadow-md transition-all duration-200">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold flex-shrink-0">
            <AlertCircle size={26} />
          </div>
          <div>
            <p className="text-xs sm:text-sm text-slate-400 font-extrabold uppercase tracking-wider">Total Duplikat Dilewati</p>
            <h3 className="text-3xl font-extrabold text-amber-700 mt-1">
              {totalSkippedRows.toLocaleString('id-ID')} Data
            </h3>
          </div>
        </div>
      </div>

      {/* 3. Container Tabel Histori & Pratinjau Periode */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-100 space-y-6">
        
        {/* Toolbar Pencarian Histori */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div>
            <h3 className="text-sm sm:text-base font-extrabold text-slate-800 font-display flex items-center gap-2">
              <History size={18} className="text-blue-700" />
              Daftar Batch Pengimporan ({filteredLogs.length} Periode)
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Klik salah satu baris untuk melihat pratinjau data siswa yang diupload pada periode tersebut.</p>
          </div>

          <div className="relative w-full sm:w-80">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama berkas, ID, atau pengunggah..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Daftar Kartu Batch Histori */}
        <div className="space-y-4">
          {filteredLogs.length > 0 ? (
            filteredLogs.map((item) => {
              const isExpanded = expandedLogId === item.id;
              const formattedDate = new Date(item.tanggalImport).toLocaleString('id-ID', {
                day: '2-digit',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              });

              return (
                <div 
                  key={item.id}
                  className={`rounded-3xl border transition-all duration-200 overflow-hidden ${
                    isExpanded 
                      ? 'bg-white border-blue-200 shadow-md ring-1 ring-blue-100' 
                      : 'bg-white border-slate-150 hover:border-slate-300 hover:bg-slate-50/50 shadow-2xs'
                  }`}
                >
                  {/* Row Header Batch */}
                  <div 
                    onClick={() => setExpandedLogId(isExpanded ? null : item.id)}
                    className="p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer select-none"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold flex-shrink-0 mt-0.5">
                        <FileSpreadsheet size={22} />
                      </div>

                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-extrabold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-100 font-mono">
                            {item.id}
                          </span>
                          <span className="text-xs font-extrabold text-slate-800">
                            {item.periode}
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-slate-800 font-mono" title={item.namaFile}>
                          {item.namaFile}
                        </h4>
                        <p className="text-xs text-slate-400 flex items-center gap-3 pt-0.5">
                          <span className="flex items-center gap-1">
                            <Clock size={12} /> {formattedDate}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <User size={12} /> {item.pengunggah}
                          </span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between md:justify-end gap-4 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-100">
                          +{item.importedCount} Data Sukses
                        </span>
                        {item.skippedCount > 0 && (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-100">
                            {item.skippedCount} Dilewati
                          </span>
                        )}
                      </div>

                      <button 
                        type="button"
                        className="p-2 text-slate-400 hover:text-blue-700 rounded-xl hover:bg-blue-50 transition-colors"
                      >
                        {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                      </button>
                    </div>
                  </div>

                  {/* Panel Pratinjau Rincian Data Siswa Periode Ini */}
                  {isExpanded && (
                    <div className="p-6 bg-slate-50/80 border-t border-slate-200/80 space-y-4 animate-fadeIn">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
                        <div>
                          <h5 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                            <FileCheck size={16} className="text-blue-700" />
                            Pratinjau Data Siswa Terunggah ({item.sampleStudents?.length || 0} Sample Siswa)
                          </h5>
                          <p className="text-xs text-slate-500 mt-0.5">{item.catatan}</p>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleExportBatchToExcel(item)}
                          className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                        >
                          <Download size={13} />
                          <span>Unduh Data Batch ({item.id})</span>
                        </button>
                      </div>

                      {/* Tabel Detail Siswa Ter-upload di Periode Ini */}
                      <div className="w-full overflow-x-auto border border-slate-200 rounded-2xl bg-white shadow-2xs">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="bg-slate-100/90 border-b border-slate-200 font-bold text-slate-700">
                              <th className="px-4 py-3 text-center w-12">#</th>
                              <th className="px-4 py-3">Nama Lengkap</th>
                              <th className="px-4 py-3">NIK</th>
                              <th className="px-4 py-3">NISN</th>
                              <th className="px-4 py-3">Jenis Kelamin</th>
                              <th className="px-4 py-3">Kabupaten</th>
                              <th className="px-4 py-3">Kecamatan</th>
                              <th className="px-4 py-3">Desa / Kelurahan</th>
                              <th className="px-4 py-3 text-center">Status ATS</th>
                              <th className="px-4 py-3">Asal Sekolah</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {item.sampleStudents && item.sampleStudents.length > 0 ? (
                              item.sampleStudents.map((s, idx) => (
                                <tr key={idx} className="hover:bg-blue-50/20 transition-colors">
                                  <td className="px-4 py-2.5 text-center font-bold text-slate-400">{idx + 1}</td>
                                  <td className="px-4 py-2.5 font-extrabold text-slate-800">{s.nama}</td>
                                  <td className="px-4 py-2.5 font-mono text-emerald-700 font-semibold">{s.nik}</td>
                                  <td className="px-4 py-2.5 font-mono text-slate-600">{s.nisn}</td>
                                  <td className="px-4 py-2.5 text-slate-600">{s.jk}</td>
                                  <td className="px-4 py-2.5 font-semibold text-slate-700">{s.kabupaten}</td>
                                  <td className="px-4 py-2.5 text-slate-600">{s.kecamatan}</td>
                                  <td className="px-4 py-2.5 text-slate-600">{s.desa}</td>
                                  <td className="px-4 py-2.5 text-center">
                                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                                      s.status === 'DO' 
                                        ? 'bg-red-50 text-red-600 border border-red-100' 
                                        : 'bg-blue-50 text-blue-700 border border-blue-100'
                                    }`}>
                                      {s.status}
                                    </span>
                                  </td>
                                  <td className="px-4 py-2.5 text-slate-600 max-w-[180px] truncate" title={s.sekolah}>{s.sekolah}</td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td colSpan="10" className="px-6 py-8 text-center text-slate-400 text-xs">
                                  Tidak ada rincian data siswa untuk batch ini.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="p-12 text-center bg-slate-50/50 rounded-3xl border border-slate-200">
              <History size={36} className="mx-auto text-slate-300 mb-2" />
              <h4 className="text-sm font-bold text-slate-600">Tidak ada riwayat pengimporan ditemukan</h4>
              <p className="text-xs text-slate-400 mt-1">Coba kata kunci pencarian lain atau unggah berkas baru.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
