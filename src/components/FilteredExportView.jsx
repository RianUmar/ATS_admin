import React, { useState, useEffect, useMemo } from 'react';
import { 
  Download, 
  FileSpreadsheet, 
  FileText, 
  Filter, 
  CheckSquare, 
  Square, 
  BarChart3, 
  PieChart, 
  Layers, 
  MapPin, 
  GraduationCap, 
  ShieldAlert, 
  Users, 
  Check, 
  AlertTriangle, 
  RefreshCw, 
  Search, 
  FileCheck, 
  ChevronLeft, 
  ChevronRight, 
  RotateCcw,
  Sparkles,
  ArrowRight,
  Database,
  Printer,
  Gift,
  Clock,
  CheckCircle2
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { getSchoolName, detectJenjang } from '../utils/schoolHelper';
import { getStudentsAPI } from '../services/api';

export default function FilteredExportView({ onNavigateToDashboard }) {
  // State Data ATS dari Database
  const [allStudents, setAllStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);

  // State Filter Bertingkat
  const [selectedKabupaten, setSelectedKabupaten] = useState('');
  const [selectedKecamatan, setSelectedKecamatan] = useState('');
  const [selectedJenjang, setSelectedJenjang] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedPenanganan, setSelectedPenanganan] = useState('');
  const [selectedGender, setSelectedGender] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // State Seleksi Checkbox
  const [selectedRowIndices, setSelectedRowIndices] = useState(new Set());

  // State Pagination Tabel Preview
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [exporting, setExporting] = useState(false);
  const [isDownloadOpen, setIsDownloadOpen] = useState(false);

  // =========================================================================
  // 1. FETCH DATA ATS DARI BASIS DATA
  // =========================================================================
  const loadAtsDatabase = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      // Ambil seluruh data ATS dari backend (tanpa paginasi ketat)
      const res = await getStudentsAPI({ per_page: 5000 });
      const rawList = res.data || [];

      // Enrich Data dengan mapping nama sekolah dan jenjang
      const enriched = rawList.map((row, idx) => {
        const rawId = row.sekolah_id || row.idSekolah || '';
        const schoolName = getSchoolName(rawId);
        const jenjang = detectJenjang(rawId, row.tingkat_pendidikan || row.kelas || '', schoolName);
        const rawNik = String(row.nik || '').trim();
        const isNikValid = /^\d{16}$/.test(rawNik);

        // Cek riwayat tindak lanjut
        const hasTindakLanjut = (row.tindak_lanjuts && row.tindak_lanjuts.length > 0) || Boolean(row.tindakanLanjut);
        const latestTindakLanjut = (row.tindak_lanjuts && row.tindak_lanjuts.length > 0)
          ? row.tindak_lanjuts[row.tindak_lanjuts.length - 1]
          : (row.tindakanLanjut || null);

        const programIntervensi = latestTindakLanjut?.program_intervensi || latestTindakLanjut?.programIntervensi || '';
        const statusPenanganan = hasTindakLanjut ? 'sudah' : 'belum';

        return {
          ...row,
          _rawIndex: idx,
          _schoolName: schoolName,
          _jenjang: jenjang,
          _isNikValid: isNikValid,
          _statusPenanganan: statusPenanganan,
          _programIntervensi: programIntervensi,
          _latestTindakLanjut: latestTindakLanjut,
          _kabupatenNorm: (row.kabupaten || '').trim(),
          _kecamatanNorm: (row.kecamatan || '').trim(),
          _desaNorm: (row.desa_kelurahan || row.desa || '').trim(),
          _namaNorm: (row.nama || '').trim(),
          _statusNorm: (row.status || '').trim().toUpperCase(),
          _jkNorm: (row.jenis_kelamin || row.jk || '').trim()
        };
      });

      setAllStudents(enriched);
      // Default: Tandai semua data terpilih
      setSelectedRowIndices(new Set(enriched.map((_, i) => i)));
    } catch (err) {
      console.error('Gagal mengambil data ATS untuk ekspor:', err);
      setErrorMsg('Gagal memuat basis data ATS dari server. Pastikan backend aktif.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAtsDatabase();
  }, []);

  // =========================================================================
  // 2. LOGIKA FILTER BERTINGKAT (CASCADING FILTERS)
  // =========================================================================

  // Daftar Kabupaten Unik dengan Jumlah Baris
  const kabupatenList = useMemo(() => {
    const counts = {};
    allStudents.forEach((r) => {
      if (r._kabupatenNorm) {
        counts[r._kabupatenNorm] = (counts[r._kabupatenNorm] || 0) + 1;
      }
    });
    return Object.keys(counts).sort().map((kab) => ({
      name: kab,
      count: counts[kab]
    }));
  }, [allStudents]);

  // Daftar Kecamatan Unik (Menyesuaikan Kabupaten Terpilih)
  const kecamatanList = useMemo(() => {
    const counts = {};
    allStudents.forEach((r) => {
      if (!selectedKabupaten || r._kabupatenNorm === selectedKabupaten) {
        if (r._kecamatanNorm) {
          counts[r._kecamatanNorm] = (counts[r._kecamatanNorm] || 0) + 1;
        }
      }
    });
    return Object.keys(counts).sort().map((kec) => ({
      name: kec,
      count: counts[kec]
    }));
  }, [allStudents, selectedKabupaten]);

  // Daftar Jenjang Unik dengan Jumlah Baris
  const jenjangList = useMemo(() => {
    const counts = {};
    allStudents.forEach((r) => {
      if (
        (!selectedKabupaten || r._kabupatenNorm === selectedKabupaten) &&
        (!selectedKecamatan || r._kecamatanNorm === selectedKecamatan)
      ) {
        counts[r._jenjang] = (counts[r._jenjang] || 0) + 1;
      }
    });
    return ['SD / MI', 'SMP / MTs', 'SMA / SMK', 'PKBM / Kesetaraan', 'PAUD / TK', 'SLB / Khusus', 'Lainnya']
      .filter((j) => counts[j] > 0)
      .map((j) => ({ name: j, count: counts[j] || 0 }));
  }, [allStudents, selectedKabupaten, selectedKecamatan]);

  // Filter Data Utama
  const filteredRows = useMemo(() => {
    return allStudents.filter((r) => {
      // 1. Filter Kabupaten
      if (selectedKabupaten && r._rawIndex !== undefined && r._kabupatenNorm !== selectedKabupaten) return false;
      // 2. Filter Kecamatan
      if (selectedKecamatan && r._kecamatanNorm !== selectedKecamatan) return false;
      // 3. Filter Jenjang
      if (selectedJenjang && r._jenjang !== selectedJenjang) return false;
      // 4. Filter Status ATS
      if (selectedStatus && r._statusNorm !== selectedStatus) return false;
      // 5. Filter Status Penanganan (Sudah / Belum Ditindaklanjuti)
      if (selectedPenanganan && r._statusPenanganan !== selectedPenanganan) return false;
      // 6. Filter Gender
      if (selectedGender) {
        const isMale = r._jkNorm.toUpperCase().startsWith('L');
        if (selectedGender === 'L' && !isMale) return false;
        if (selectedGender === 'P' && isMale) return false;
      }

      // 7. Pencarian Teks Bebas
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = r._namaNorm.toLowerCase().includes(q);
        const matchNik = String(r.nik || '').includes(q);
        const matchNisn = String(r.nisn || '').includes(q);
        const matchSchool = r._schoolName.toLowerCase().includes(q);
        if (!matchName && !matchNik && !matchNisn && !matchSchool) return false;
      }

      return true;
    });
  }, [
    allStudents,
    selectedKabupaten,
    selectedKecamatan,
    selectedJenjang,
    selectedStatus,
    selectedPenanganan,
    selectedGender,
    searchQuery
  ]);

  const resetFilters = () => {
    setSelectedKabupaten('');
    setSelectedKecamatan('');
    setSelectedJenjang('');
    setSelectedStatus('');
    setSelectedPenanganan('');
    setSelectedGender('');
    setSearchQuery('');
  };

  // =========================================================================
  // 3. STATISTIK & DATA GRAFIK DINAMIS (REAL-TIME VISUAL ANALYTICS)
  // =========================================================================
  const analyticsData = useMemo(() => {
    const total = filteredRows.length;
    if (total === 0) return null;

    // 1. Distribusi per Wilayah (Kecamatan / Kabupaten)
    const wilayahCounts = {};
    filteredRows.forEach((r) => {
      const key = selectedKabupaten ? (r._kecamatanNorm || 'Kec. Tidak Terdata') : (r._kabupatenNorm || 'Kab. Tidak Terdata');
      wilayahCounts[key] = (wilayahCounts[key] || 0) + 1;
    });

    const sortedWilayah = Object.entries(wilayahCounts)
      .map(([name, count]) => ({ name, count, pct: ((count / total) * 100).toFixed(1) }))
      .sort((a, b) => b.count - a.count);

    // 2. Komposisi Jenjang
    const jenjangCounts = {
      'SD / MI': 0,
      'SMP / MTs': 0,
      'SMA / SMK': 0,
      'PKBM / Kesetaraan': 0,
      'Lainnya': 0
    };
    filteredRows.forEach((r) => {
      if (jenjangCounts[r._jenjang] !== undefined) {
        jenjangCounts[r._jenjang]++;
      } else {
        jenjangCounts['Lainnya']++;
      }
    });

    // 3. Status ATS & Penanganan
    let doCount = 0;
    let ltmCount = 0;
    let sudahTindakCount = 0;
    let belumTindakCount = 0;
    let maleCount = 0;
    let femaleCount = 0;

    filteredRows.forEach((r) => {
      if (r._statusNorm === 'DO') doCount++;
      else if (r._statusNorm === 'LTM') ltmCount++;

      if (r._statusPenanganan === 'sudah') sudahTindakCount++;
      else belumTindakCount++;

      if (r._jkNorm.toUpperCase().startsWith('L')) maleCount++;
      else femaleCount++;
    });

    return {
      total,
      sortedWilayah,
      jenjangCounts,
      doCount,
      ltmCount,
      doPct: ((doCount / total) * 100).toFixed(1),
      ltmPct: ((ltmCount / total) * 100).toFixed(1),
      sudahTindakCount,
      belumTindakCount,
      sudahTindakPct: ((sudahTindakCount / total) * 100).toFixed(1),
      belumTindakPct: ((belumTindakCount / total) * 100).toFixed(1),
      maleCount,
      femaleCount,
      malePct: ((maleCount / total) * 100).toFixed(1),
      femalePct: ((femaleCount / total) * 100).toFixed(1)
    };
  }, [filteredRows, selectedKabupaten]);

  // =========================================================================
  // 4. CHECKBOX SELEKSI
  // =========================================================================
  const toggleRowSelection = (rawIndex) => {
    const nextSet = new Set(selectedRowIndices);
    if (nextSet.has(rawIndex)) {
      nextSet.delete(rawIndex);
    } else {
      nextSet.add(rawIndex);
    }
    setSelectedRowIndices(nextSet);
  };

  const handleSelectAllFiltered = () => {
    const nextSet = new Set(selectedRowIndices);
    filteredRows.forEach((r) => nextSet.add(r._rawIndex));
    setSelectedRowIndices(nextSet);
  };

  const handleDeselectAllFiltered = () => {
    const nextSet = new Set(selectedRowIndices);
    filteredRows.forEach((r) => nextSet.delete(r._rawIndex));
    setSelectedRowIndices(nextSet);
  };

  const selectedFilteredRows = useMemo(() => {
    return filteredRows.filter((r) => selectedRowIndices.has(r._rawIndex));
  }, [filteredRows, selectedRowIndices]);

  // =========================================================================
  // 5. EKSPOR DATA KE BERBAGAI FORMAT (EXCEL, PDF, CSV)
  // =========================================================================

  // A. Ekspor Excel (.xlsx) Lengkap dengan Header Rekapan
  const handleExportExcel = () => {
    if (selectedFilteredRows.length === 0) return;
    setExporting(true);

    try {
      const exportList = selectedFilteredRows.map((r, idx) => ({
        'No': idx + 1,
        'NIK': r.nik || '-',
        'NISN': r.nisn || '-',
        'Nama Lengkap': r.nama || '-',
        'Jenis Kelamin': r.jenis_kelamin || r.jk || '-',
        'Tempat Lahir': r.tempat_lahir || '-',
        'Tanggal Lahir': r.tanggal_lahir ? r.tanggal_lahir.split('T')[0] : '-',
        'Nama Ibu Kandung': r.nama_ibu_kandung || '-',
        'Provinsi': r.provinsi || 'Sulawesi Tengah',
        'Kabupaten / Kota': r.kabupaten || '-',
        'Kecamatan': r.kecamatan || '-',
        'Desa / Kelurahan': r.desa_kelurahan || r.desa || '-',
        'Alamat Jalan': r.alamat_jalan || '-',
        'RT': r.rt || '-',
        'RW': r.rw || '-',
        'ID Sekolah Asal': r.sekolah_id || '-',
        'Nama Sekolah Asal': r._schoolName || '-',
        'Jenjang': r._jenjang || '-',
        'Tingkat / Kelas': r.tingkat_pendidikan || r.kelas || '-',
        'Kategori Status ATS': r.status === 'DO' ? 'Drop Out (DO)' : 'Lulus Tidak Melanjutkan (LTM)',
        'Status Penanganan': r._statusPenanganan === 'sudah' ? 'Sudah Ditindaklanjuti' : 'Belum Ditindaklanjuti',
        'Program Intervensi': r._programIntervensi || '-',
        'Tanggal Tindak Lanjut': r._latestTindakLanjut?.tanggal_tindak_lanjut || '-',
        'Alasan / Catatan Lapangan': r._latestTindakLanjut?.alasan || '-'
      }));

      const ws = XLSX.utils.json_to_sheet(exportList);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Rekapan_ATS');

      const fileName = `Rekapan_ATS_${selectedKabupaten || 'Sulteng'}_${selectedJenjang || 'SemuaJenjang'}_${Date.now()}.xlsx`;
      XLSX.writeFile(wb, fileName);
    } catch (err) {
      console.error('Gagal mengekspor Excel:', err);
    } finally {
      setExporting(false);
    }
  };

  // B. Ekspor Dokumen Laporan PDF Resmi (Print Preview Window)
  const handleExportPdf = () => {
    if (selectedFilteredRows.length === 0) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Izinkan pop-up pada browser untuk mencetak/menyimpan PDF.');
      return;
    }

    const title = `Laporan Rekapitulasi Data Anak Tidak Sekolah (ATS) Provinsi Sulawesi Tengah`;
    const filterInfo = [
      selectedKabupaten ? `Kabupaten: ${selectedKabupaten}` : 'Seluruh Kabupaten',
      selectedKecamatan ? `Kecamatan: ${selectedKecamatan}` : null,
      selectedJenjang ? `Jenjang: ${selectedJenjang}` : null,
      selectedStatus ? `Status: ${selectedStatus}` : null,
      selectedPenanganan ? `Penanganan: ${selectedPenanganan === 'sudah' ? 'Sudah Ditindak' : 'Belum Ditindak'}` : null
    ].filter(Boolean).join(' • ');

    const tableRowsHtml = selectedFilteredRows.map((r, idx) => `
      <tr>
        <td style="text-align: center; padding: 6px; border: 1px solid #cbd5e1; font-size: 10px;">${idx + 1}</td>
        <td style="padding: 6px; border: 1px solid #cbd5e1; font-size: 10px; font-weight: bold;">${r.nama || '-'}</td>
        <td style="padding: 6px; border: 1px solid #cbd5e1; font-size: 10px; font-family: monospace;">${r.nik || '-'}</td>
        <td style="text-align: center; padding: 6px; border: 1px solid #cbd5e1; font-size: 10px;">${r.jenis_kelamin || r.jk || '-'}</td>
        <td style="padding: 6px; border: 1px solid #cbd5e1; font-size: 10px;">${r.kabupaten || '-'}, Kec. ${r.kecamatan || '-'}</td>
        <td style="padding: 6px; border: 1px solid #cbd5e1; font-size: 10px;">${r._schoolName || '-'}</td>
        <td style="text-align: center; padding: 6px; border: 1px solid #cbd5e1; font-size: 10px; font-weight: bold;">${r._jenjang}</td>
        <td style="text-align: center; padding: 6px; border: 1px solid #cbd5e1; font-size: 10px;">${r.status === 'DO' ? 'Drop Out' : 'LTM'}</td>
        <td style="text-align: center; padding: 6px; border: 1px solid #cbd5e1; font-size: 10px;">${r._statusPenanganan === 'sudah' ? 'Sudah Ditindak' : 'Belum'}</td>
      </tr>
    `).join('');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${title}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; color: #1e293b; }
            h1 { font-size: 16px; text-transform: uppercase; margin-bottom: 4px; text-align: center; }
            h2 { font-size: 12px; color: #475569; margin-top: 0; text-align: center; font-weight: normal; }
            .meta-box { background: #f8fafc; border: 1px solid #e2e8f0; padding: 10px 14px; border-radius: 8px; font-size: 11px; margin-bottom: 16px; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th { background-color: #1e40af; color: white; font-size: 10px; padding: 8px 6px; border: 1px solid #1e40af; text-transform: uppercase; }
            tr:nth-child(even) { background-color: #f8fafc; }
            @media print {
              body { padding: 0; }
              @page { size: landscape; margin: 12mm; }
            }
          </style>
        </head>
        <body>
          <h1>PEMERINTAH PROVINSI SULAWESI TENGAH</h1>
          <h2>${title}</h2>
          <div class="meta-box">
            <strong>Kriteria Rekapitulasi:</strong> ${filterInfo}<br/>
            <strong>Total Data Tercetak:</strong> ${selectedFilteredRows.length} Siswa | <strong>Tanggal Unduh:</strong> ${new Date().toLocaleDateString('id-ID', { dateStyle: 'full' })}
          </div>
          <table>
            <thead>
              <tr>
                <th style="width: 25px;">No</th>
                <th>Nama Lengkap</th>
                <th>NIK</th>
                <th style="width: 30px;">JK</th>
                <th>Wilayah Domisili</th>
                <th>Sekolah Asal Terpetakan</th>
                <th>Jenjang</th>
                <th>Status</th>
                <th>Penanganan</th>
              </tr>
            </thead>
            <tbody>
              ${tableRowsHtml}
            </tbody>
          </table>
          <script>
            window.onload = function() {
              window.print();
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Pagination Slice
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return filteredRows.slice(start, start + rowsPerPage);
  }, [filteredRows, currentPage, rowsPerPage]);

  const totalPages = Math.ceil(filteredRows.length / rowsPerPage) || 1;

  // =========================================================================
  // RENDER UTAMA
  // =========================================================================
  return (
    <div className="space-y-8 animate-fadeIn">
      
      {/* Banner Header Fitur */}
      <div className="p-6 sm:p-8 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-3xl text-white shadow-xl shadow-blue-900/10 relative overflow-hidden">
        <div className="absolute right-0 bottom-0 opacity-10 translate-x-12 translate-y-12 scale-150 pointer-events-none">
          <Download size={240} />
        </div>
        <div className="relative z-10 max-w-3xl space-y-2">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-blue-500/20 text-blue-300 border border-blue-400/30 backdrop-blur-sm">
              <Sparkles size={13} /> Modul Rekapitulasi & Ekspor Laporan
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-display text-white">
            Rekapan & Ekspor Data ATS Terfilter
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-light">
            Saring data Anak Tidak Sekolah secara bertingkat (Kabupaten &rarr; Kecamatan &rarr; Jenjang &rarr; Status ATS &rarr; Penanganan & Bantuan) dan unduh laporan resmi dalam format <strong>Excel (.xlsx)</strong> atau <strong>Cetak PDF</strong>.
          </p>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 flex items-center justify-between text-xs font-bold animate-fadeIn">
          <div className="flex items-center gap-2.5">
            <AlertTriangle size={18} className="text-red-600 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg(null)} className="p-1 hover:bg-red-100 rounded-lg cursor-pointer">
            ✕
          </button>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 1. PANEL FILTER BERTINGKAT (CASCADING SMART FILTERS) */}
      {/* ===================================================================== */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-100 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <Filter size={18} className="text-blue-700" />
              1. Kriteria Penyaringan & Rekapitulasi Bertingkat
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Pilih wilayah, jenjang, atau kategori penanganan untuk mempersempit rekapan data.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={resetFilters}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-blue-700 px-3 py-1.5 bg-slate-100 hover:bg-blue-50 rounded-xl transition-all cursor-pointer"
            >
              <RotateCcw size={13} /> Reset Filter
            </button>

            <button
              onClick={loadAtsDatabase}
              title="Segarkan Basis Data"
              className="p-2 text-slate-400 hover:text-blue-700 hover:bg-blue-50 rounded-xl transition-all cursor-pointer border border-slate-200"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* Kontainer Filter Berkelompok - Sangat Mudah Dipahami Orang Awam */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Kelompok A: Filter Wilayah (📍 Lokasi Domisili) */}
          <div className="lg:col-span-1 bg-slate-50/70 p-5 rounded-2xl border border-slate-200/60 space-y-4">
            <div className="flex items-center gap-2.5 border-b border-slate-200/80 pb-3">
              <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                <MapPin size={16} />
              </div>
              <div>
                <h4 className="text-xs font-extrabold text-slate-800">1. Pilih Lokasi Wilayah</h4>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Wilayah Tugas Anda</p>
              </div>
            </div>
            
            <div className="space-y-4">
              {/* Filter 1: Kabupaten */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wide">
                  Kabupaten / Kota
                </label>
                <select
                  value={selectedKabupaten}
                  onChange={(e) => {
                    setSelectedKabupaten(e.target.value);
                    setSelectedKecamatan('');
                    setCurrentPage(1);
                  }}
                  className="w-full px-3.5 py-2.5 bg-white text-xs font-bold text-slate-700 rounded-xl border border-slate-200 focus:border-blue-700 focus:ring-2 focus:ring-blue-700/10 outline-none transition-all cursor-pointer shadow-2xs"
                >
                  <option value="">Tampilkan Semua Kabupaten ({kabupatenList.length})</option>
                  {kabupatenList.map((kab) => (
                    <option key={kab.name} value={kab.name}>
                      {kab.name} ({kab.count} anak)
                    </option>
                  ))}
                </select>
              </div>

              {/* Filter 2: Kecamatan (Dinamis dari Kabupaten) */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wide">
                  Kecamatan
                </label>
                <select
                  value={selectedKecamatan}
                  onChange={(e) => {
                    setSelectedKecamatan(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full px-3.5 py-2.5 bg-white text-xs font-bold text-slate-700 rounded-xl border border-slate-200 focus:border-blue-700 focus:ring-2 focus:ring-blue-700/10 outline-none transition-all cursor-pointer shadow-2xs"
                >
                  <option value="">
                    {selectedKabupaten 
                      ? `-- Semua Kecamatan di ${selectedKabupaten} (${kecamatanList.length}) --` 
                      : `Semua Kecamatan (${kecamatanList.length})`}
                  </option>
                  {kecamatanList.map((kec) => (
                    <option key={kec.name} value={kec.name}>
                      Kecamatan {kec.name} ({kec.count} anak)
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Kelompok B: Karakteristik Siswa & Status (👤 Kategori & Status Anak) */}
          <div className="lg:col-span-2 bg-slate-50/70 p-5 rounded-2xl border border-slate-200/60 space-y-4">
            <div className="flex items-center gap-2.5 border-b border-slate-200/80 pb-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                <Users size={16} />
              </div>
              <div>
                <h4 className="text-xs font-extrabold text-slate-800">2. Pilih Kategori & Karakteristik Anak</h4>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Pendidikan, Status & Gender</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Filter 3: Jenjang Pendidikan */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wide">
                  Jenjang Pendidikan Asal
                </label>
                <select
                  value={selectedJenjang}
                  onChange={(e) => {
                    setSelectedJenjang(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full px-3.5 py-2.5 bg-white text-xs font-bold text-slate-700 rounded-xl border border-slate-200 focus:border-blue-700 focus:ring-2 focus:ring-blue-700/10 outline-none transition-all cursor-pointer shadow-2xs"
                >
                  <option value="">Semua Jenjang Sekolah</option>
                  {jenjangList.map((j) => (
                    <option key={j.name} value={j.name}>
                      {j.name} ({j.count} anak)
                    </option>
                  ))}
                </select>
              </div>

              {/* Filter 6: Jenis Kelamin */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wide">
                  Jenis Kelamin (Gender)
                </label>
                <select
                  value={selectedGender}
                  onChange={(e) => {
                    setSelectedGender(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full px-3.5 py-2.5 bg-white text-xs font-bold text-slate-700 rounded-xl border border-slate-200 focus:border-blue-700 focus:ring-2 focus:ring-blue-700/10 outline-none transition-all cursor-pointer shadow-2xs"
                >
                  <option value="">Semua Jenis Kelamin</option>
                  <option value="L">Laki-laki (L)</option>
                  <option value="P">Perempuan (P)</option>
                </select>
              </div>

              {/* Filter 4: Status Kategori ATS */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wide">
                  Penyebab Tidak Sekolah (Kategori ATS)
                </label>
                <select
                  value={selectedStatus}
                  onChange={(e) => {
                    setSelectedStatus(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full px-3.5 py-2.5 bg-white text-xs font-bold text-slate-700 rounded-xl border border-slate-200 focus:border-blue-700 focus:ring-2 focus:ring-blue-700/10 outline-none transition-all cursor-pointer shadow-2xs"
                >
                  <option value="">Semua Kategori Masalah</option>
                  <option value="DO">Drop Out (DO)</option>
                  <option value="LTM">Lulus Tidak Melanjutkan (LTM)</option>
                </select>
              </div>

              {/* Filter 5: Status Penanganan */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wide">
                  Status Tindak Lanjut Petugas
                </label>
                <select
                  value={selectedPenanganan}
                  onChange={(e) => {
                    setSelectedPenanganan(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full px-3.5 py-2.5 bg-white text-xs font-bold text-slate-700 rounded-xl border border-slate-200 focus:border-blue-700 focus:ring-2 focus:ring-blue-700/10 outline-none transition-all cursor-pointer shadow-2xs"
                >
                  <option value="">Semua Status Tindak Lanjut</option>
                  <option value="sudah">Sudah Ditindaklanjuti</option>
                  <option value="belum">Belum Ditindaklanjuti</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* 2. VISUALISASI GRAFIK DINAMIS (DYNAMIC VISUAL ANALYTICS) */}
      {/* ===================================================================== */}
      {analyticsData && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <BarChart3 size={18} className="text-blue-700" />
              2. Ringkasan Grafik Sebaran Data Rekapan (Real-Time)
            </h3>
            <span className="text-xs font-bold text-slate-500">
              Total Lolos Filter: <strong className="text-blue-700">{analyticsData.total.toLocaleString('id-ID')} Siswa</strong>
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Grafik 1: Sebaran Wilayah */}
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <MapPin size={14} className="text-blue-600" />
                    Sebaran {selectedKabupaten ? `Kecamatan di ${selectedKabupaten}` : 'Kabupaten Terbanyak'}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
                    {analyticsData.sortedWilayah.length} Wilayah
                  </span>
                </div>

                <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
                  {analyticsData.sortedWilayah.slice(0, 6).map((item, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span className="text-slate-700 truncate max-w-[160px]">{item.name}</span>
                        <span className="text-slate-500 font-mono">{item.count} <span className="text-[10px] text-slate-400">({item.pct}%)</span></span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div 
                          className="bg-blue-600 h-full rounded-full transition-all duration-500"
                          style={{ width: `${Math.max(item.pct, 4)}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Grafik 2: Komposisi Jenjang */}
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <GraduationCap size={14} className="text-emerald-600" />
                    Komposisi Jenjang Pendidikan
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
                    Proporsi
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="p-3 bg-emerald-50/60 rounded-2xl border border-emerald-100">
                    <span className="text-[10px] font-bold text-emerald-800 uppercase block">SD / MI</span>
                    <p className="text-lg font-extrabold text-emerald-950 mt-0.5">
                      {analyticsData.jenjangCounts['SD / MI']}
                    </p>
                    <span className="text-[10px] text-emerald-700 font-bold">
                      {((analyticsData.jenjangCounts['SD / MI'] / analyticsData.total) * 100).toFixed(1)}%
                    </span>
                  </div>

                  <div className="p-3 bg-blue-50/60 rounded-2xl border border-blue-100">
                    <span className="text-[10px] font-bold text-blue-800 uppercase block">SMP / MTs</span>
                    <p className="text-lg font-extrabold text-blue-950 mt-0.5">
                      {analyticsData.jenjangCounts['SMP / MTs']}
                    </p>
                    <span className="text-[10px] text-blue-700 font-bold">
                      {((analyticsData.jenjangCounts['SMP / MTs'] / analyticsData.total) * 100).toFixed(1)}%
                    </span>
                  </div>

                  <div className="p-3 bg-indigo-50/60 rounded-2xl border border-indigo-100">
                    <span className="text-[10px] font-bold text-indigo-800 uppercase block">SMA / SMK</span>
                    <p className="text-lg font-extrabold text-indigo-950 mt-0.5">
                      {analyticsData.jenjangCounts['SMA / SMK']}
                    </p>
                    <span className="text-[10px] text-indigo-700 font-bold">
                      {((analyticsData.jenjangCounts['SMA / SMK'] / analyticsData.total) * 100).toFixed(1)}%
                    </span>
                  </div>

                  <div className="p-3 bg-amber-50/60 rounded-2xl border border-amber-100">
                    <span className="text-[10px] font-bold text-amber-800 uppercase block">PKBM / Lainnya</span>
                    <p className="text-lg font-extrabold text-amber-950 mt-0.5">
                      {analyticsData.jenjangCounts['PKBM / Kesetaraan'] + analyticsData.jenjangCounts['Lainnya']}
                    </p>
                    <span className="text-[10px] text-amber-700 font-bold">
                      {(((analyticsData.jenjangCounts['PKBM / Kesetaraan'] + analyticsData.jenjangCounts['Lainnya']) / analyticsData.total) * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>

                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden flex">
                  <div 
                    title="SD / MI"
                    className="bg-emerald-500 h-full"
                    style={{ width: `${(analyticsData.jenjangCounts['SD / MI'] / analyticsData.total) * 100}%` }}
                  ></div>
                  <div 
                    title="SMP / MTs"
                    className="bg-blue-600 h-full"
                    style={{ width: `${(analyticsData.jenjangCounts['SMP / MTs'] / analyticsData.total) * 100}%` }}
                  ></div>
                  <div 
                    title="SMA / SMK"
                    className="bg-indigo-600 h-full"
                    style={{ width: `${(analyticsData.jenjangCounts['SMA / SMK'] / analyticsData.total) * 100}%` }}
                  ></div>
                  <div 
                    title="PKBM / Lainnya"
                    className="bg-amber-500 h-full"
                    style={{ width: `${((analyticsData.jenjangCounts['PKBM / Kesetaraan'] + analyticsData.jenjangCounts['Lainnya']) / analyticsData.total) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Grafik 3: Status DO/LTM & Penanganan */}
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <PieChart size={14} className="text-red-500" />
                    Kategori Status & Penanganan
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                    Rasio Intervensi
                  </span>
                </div>

                <div className="space-y-4">
                  {/* Status Penanganan */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-emerald-700 flex items-center gap-1">
                        <CheckCircle2 size={12} /> Sudah Ditindak: {analyticsData.sudahTindakCount} ({analyticsData.sudahTindakPct}%)
                      </span>
                      <span className="text-amber-700 flex items-center gap-1">
                        <Clock size={12} /> Belum: {analyticsData.belumTindakCount} ({analyticsData.belumTindakPct}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden flex">
                      <div className="bg-emerald-500 h-full" style={{ width: `${analyticsData.sudahTindakPct}%` }}></div>
                      <div className="bg-amber-400 h-full" style={{ width: `${analyticsData.belumTindakPct}%` }}></div>
                    </div>
                  </div>

                  {/* Komparasi DO vs LTM */}
                  <div className="space-y-1.5 pt-2 border-t border-slate-100">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-red-600">
                        Drop Out: {analyticsData.doCount} ({analyticsData.doPct}%)
                      </span>
                      <span className="text-orange-600">
                        LTM: {analyticsData.ltmCount} ({analyticsData.ltmPct}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden flex">
                      <div className="bg-red-500 h-full" style={{ width: `${analyticsData.doPct}%` }}></div>
                      <div className="bg-orange-500 h-full" style={{ width: `${analyticsData.ltmPct}%` }}></div>
                    </div>
                  </div>

                  {/* Gender */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-bold">
                    <span className="text-blue-700">Laki-laki: {analyticsData.maleCount} ({analyticsData.malePct}%)</span>
                    <span className="text-pink-600">Perempuan: {analyticsData.femaleCount} ({analyticsData.femalePct}%)</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden flex">
                    <div className="bg-blue-500 h-full" style={{ width: `${analyticsData.maleCount}%` }}></div>
                    <div className="bg-pink-500 h-full" style={{ width: `${analyticsData.femaleCount}%` }}></div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 3. TABEL PRATINJAU REKAPAN & TOMBOL EKSPOR */}
      {/* ===================================================================== */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-100 space-y-6">
        
        {/* Header Toolbar Ekspor */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div>
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <FileSpreadsheet size={18} className="text-blue-700" />
              3. Pratinjau Tabel & Opsi Pengunduhan Rekapan
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Ditemukan <strong className="text-blue-700">{filteredRows.length.toLocaleString('id-ID')}</strong> data lolos kriteria. Terpilih: <strong className="text-emerald-700">{selectedFilteredRows.length.toLocaleString('id-ID')}</strong> siswa untuk diekspor.
            </p>
          </div>

          <div className="relative">
            {/* Tombol Unduh Utama Terpadu */}
            <button
              type="button"
              onClick={() => setIsDownloadOpen(!isDownloadOpen)}
              disabled={selectedFilteredRows.length === 0}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-800 hover:to-indigo-800 text-white text-xs font-extrabold rounded-xl transition-all shadow-md shadow-blue-700/10 cursor-pointer disabled:opacity-50"
            >
              <Download size={15} />
              <span>Unduh Rekapan Laporan ({selectedFilteredRows.length.toLocaleString('id-ID')})</span>
              <span className="text-[10px] ml-0.5 opacity-80">▼</span>
            </button>

            {isDownloadOpen && (
              <>
                {/* Overlay transparan untuk menutup dropdown saat klik luar */}
                <div className="fixed inset-0 z-10" onClick={() => setIsDownloadOpen(false)}></div>
                
                <div className="absolute right-0 mt-2 w-64 bg-white border border-slate-200/80 rounded-2xl shadow-xl py-2.5 z-20 animate-fadeIn">
                  <div className="px-4 py-1.5 border-b border-slate-100 mb-2">
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Pilih Format Berkas</span>
                  </div>
                  
                  {/* Pilihan 1: Excel */}
                  <button
                    type="button"
                    onClick={() => {
                      handleExportExcel();
                      setIsDownloadOpen(false);
                    }}
                    disabled={exporting}
                    className="w-full px-4 py-2.5 text-left hover:bg-emerald-50 text-slate-700 hover:text-slate-900 transition-colors flex items-center gap-2.5 text-xs font-bold disabled:opacity-50 cursor-pointer"
                  >
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-100 flex-shrink-0">
                      <FileSpreadsheet size={16} />
                    </div>
                    <div>
                      <span className="block text-emerald-800 font-extrabold">Spreadsheet Excel (.xlsx)</span>
                      <span className="text-[9px] text-emerald-600/70 block font-bold mt-0.5">Format data rekap tabel</span>
                    </div>
                  </button>

                  {/* Pilihan 2: PDF */}
                  <button
                    type="button"
                    onClick={() => {
                      handleExportPdf();
                      setIsDownloadOpen(false);
                    }}
                    className="w-full px-4 py-2.5 text-left hover:bg-red-50 text-slate-700 hover:text-slate-900 transition-colors flex items-center gap-2.5 text-xs font-bold cursor-pointer"
                  >
                    <div className="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center border border-red-100 flex-shrink-0">
                      <Printer size={16} />
                    </div>
                    <div>
                      <span className="block text-red-700 font-extrabold">Dokumen PDF (.pdf)</span>
                      <span className="text-[9px] text-red-600/70 block font-bold mt-0.5">Laporan cetak resmi Pemprov</span>
                    </div>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Bar Kontrol Seleksi Checkbox & Search */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/70 p-3.5 rounded-2xl border border-slate-200/80">
          <div className="flex items-center gap-2">
            <button
              onClick={handleSelectAllFiltered}
              className="inline-flex items-center gap-1 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-xl border border-blue-200 cursor-pointer transition-colors"
            >
              <CheckSquare size={13} /> Pilih Semua ({filteredRows.length})
            </button>

            <button
              onClick={handleDeselectAllFiltered}
              className="inline-flex items-center gap-1 text-xs font-bold text-slate-600 bg-white hover:bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200 cursor-pointer transition-colors"
            >
              <Square size={13} /> Batal Pilih
            </button>
          </div>

          <div className="relative flex-1 max-w-xs">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari nama, NIK, sekolah di preview..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-3 py-2 bg-white text-xs font-medium text-slate-700 rounded-xl border border-slate-200 focus:border-blue-700 focus:ring-2 focus:ring-blue-700/10 outline-none transition-all shadow-2xs"
            />
          </div>
        </div>

        {/* Tabel Render Data */}
        <div className="overflow-x-auto rounded-2xl border border-slate-200/80 shadow-2xs">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100/90 text-slate-600 font-extrabold uppercase tracking-wider text-[10px] border-b border-slate-200">
                <th className="py-3.5 px-4 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={selectedFilteredRows.length === filteredRows.length && filteredRows.length > 0}
                    onChange={(e) => {
                      if (e.target.checked) handleSelectAllFiltered();
                      else handleDeselectAllFiltered();
                    }}
                    className="rounded text-blue-700 focus:ring-blue-500 cursor-pointer w-4 h-4"
                  />
                </th>
                <th className="py-3.5 px-4">Nama Siswa & NIK</th>
                <th className="py-3.5 px-3">JK</th>
                <th className="py-3.5 px-4">Wilayah Domisili</th>
                <th className="py-3.5 px-4">Sekolah Asal Terpetakan</th>
                <th className="py-3.5 px-3">Jenjang</th>
                <th className="py-3.5 px-3">Status</th>
                <th className="py-3.5 px-3">Penanganan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <RefreshCw size={24} className="animate-spin mx-auto text-blue-700 mb-2" />
                    <p className="font-bold text-slate-700">Memuat Basis Data ATS...</p>
                  </td>
                </tr>
              ) : paginatedRows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <AlertTriangle size={24} className="mx-auto text-amber-500 mb-2 opacity-80" />
                    <p className="font-bold text-slate-700">Tidak Ada Data yang Cocok dengan Kriteria Filter</p>
                    <p className="text-xs text-slate-400 mt-1">Coba ubah pilihan filter di atas.</p>
                  </td>
                </tr>
              ) : (
                paginatedRows.map((row) => {
                  const isChecked = selectedRowIndices.has(row._rawIndex);
                  return (
                    <tr 
                      key={row._rawIndex}
                      onClick={() => toggleRowSelection(row._rawIndex)}
                      className={`hover:bg-blue-50/40 transition-colors cursor-pointer ${
                        isChecked ? 'bg-blue-50/20' : 'opacity-60 bg-slate-50/30'
                      }`}
                    >
                      <td className="py-3.5 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleRowSelection(row._rawIndex)}
                          className="rounded text-blue-700 focus:ring-blue-500 cursor-pointer w-4 h-4"
                        />
                      </td>
                      <td className="py-3.5 px-4">
                        <p className="font-extrabold text-slate-800">{row._namaNorm || '-'}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="font-mono text-[10px] text-slate-500">
                            NIK: {row.nik || '-'}
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-3 font-bold text-slate-700">
                        {row._jkNorm.toUpperCase().startsWith('L') ? (
                          <span className="text-blue-700 font-extrabold">L</span>
                        ) : (
                          <span className="text-pink-600 font-extrabold">P</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <p className="font-bold text-slate-800">{row._kabupatenNorm || '-'}</p>
                        <p className="text-[11px] text-slate-500">
                          Kec. {row._kecamatanNorm || '-'} • Desa {row._desaNorm || '-'}
                        </p>
                      </td>
                      <td className="py-3.5 px-4 max-w-xs">
                        <p className="font-bold text-slate-800 truncate" title={row._schoolName}>
                          {row._schoolName}
                        </p>
                        {row.sekolah_id && (
                          <span className="font-mono text-[10px] text-slate-400 block truncate" title={row.sekolah_id}>
                            ID: {row.sekolah_id}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-3">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${
                          row._jenjang === 'SD / MI' 
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                            : row._jenjang === 'SMP / MTs' 
                            ? 'bg-blue-50 text-blue-700 border-blue-200' 
                            : row._jenjang === 'SMA / SMK'
                            ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}>
                          {row._jenjang}
                        </span>
                      </td>
                      <td className="py-3.5 px-3">
                        {row._statusNorm === 'DO' ? (
                          <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-600 border border-red-200">
                            DO
                          </span>
                        ) : (
                          <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-50 text-orange-600 border border-orange-200">
                            LTM
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-3">
                        {row._statusPenanganan === 'sudah' ? (
                          <div className="space-y-0.5">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle2 size={10} /> Sudah Ditindak
                            </span>
                            {row._programIntervensi && (
                              <span className="block text-[9px] font-bold text-indigo-700 truncate max-w-[110px]" title={row._programIntervensi}>
                                🎁 {row._programIntervensi}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            <Clock size={10} /> Belum
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {filteredRows.length > 0 && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs">
            <div className="flex items-center gap-2 text-slate-500">
              <span>Tampilkan per halaman:</span>
              <select
                value={rowsPerPage}
                onChange={(e) => {
                  setRowsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 font-bold text-slate-700 outline-none cursor-pointer"
              >
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              <span>(Halaman {currentPage} dari {totalPages})</span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
                className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl border border-slate-200 disabled:opacity-40 cursor-pointer"
              >
                <ChevronLeft size={15} />
              </button>
              <span className="px-3 py-1 bg-blue-50 text-blue-700 font-extrabold rounded-xl border border-blue-200">
                {currentPage}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl border border-slate-200 disabled:opacity-40 cursor-pointer"
              >
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        )}

      </div>

    </div>
  );
}
