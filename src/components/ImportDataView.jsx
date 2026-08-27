import React, { useState, useRef } from 'react';
import { 
  Upload, 
  Download, 
  FileSpreadsheet, 
  Check, 
  AlertTriangle, 
  RefreshCw, 
  Info,
  CheckCircle2,
  FileCheck,
  Users,
  ShieldCheck,
  X,
  ArrowRight,
  Database
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { importAtsExcelAPI, importStudentsAPI } from '../services/api';

export default function ImportDataView({ onNavigateToDashboard, onImportSuccess }) {
  const [file, setFile] = useState(null);
  const [parsedData, setParsedData] = useState([]);
  const [errorMsg, setErrorMsg] = useState(null);
  const [successReport, setSuccessReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  
  const fileInputRef = useRef(null);

  // Unduh Templat CSV dengan Header Kolom Standar
  const handleDownloadTemplate = () => {
    const headers = [
      'nama',
      'nik',
      'nisn',
      'no_kk',
      'jenis_kelamin',
      'tempat_lahir',
      'tanggal_lahir',
      'nama_ibu_kandung',
      'provinsi',
      'kabupaten',
      'kecamatan',
      'desa_kelurahan',
      'alamat_jalan',
      'rt',
      'rw',
      'lintang',
      'bujur',
      'status',
      'tingkat_pendidikan',
      'sekolah_id'
    ].join(',');

    const sampleRow1 = [
      'Ahmad Nur Fauzi',
      '7207052308990001',
      '0075489621',
      '7207052308990000',
      'Laki-laki',
      'Palu',
      '2007-08-23',
      'Siti Aminah',
      'Sulawesi Tengah',
      'Kab. Sigi',
      'Gumbasa',
      'Pakuli',
      'Jln. Poros Palu-Kulawi KM 35',
      '02',
      '01',
      '-1.2576',
      '119.9234',
      'DO',
      'Kelas 8',
      'SMPN 2 Gumbasa'
    ].join(',');

    const sampleRow2 = [
      'Siti Rahmawati',
      '7203114509980002',
      '0086214795',
      '7203114509980000',
      'Perempuan',
      'Donggala',
      '2008-09-15',
      'Nurhayati',
      'Sulawesi Tengah',
      'Kab. Donggala',
      'Banawa',
      'Ganti',
      'Jln. Trans Sulawesi',
      '01',
      '01',
      '-0.6854',
      '119.7428',
      'LTM',
      'Kelas 6',
      'SDN 1 Banawa'
    ].join(',');

    const csvContent = "data:text/csv;charset=utf-8," + headers + "\n" + sampleRow1 + "\n" + sampleRow2;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "template_import_ats_sulteng.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Drag & drop handlers
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  // Parsing File dengan SheetJS
  const processFile = (selectedFile) => {
    const fileExtension = selectedFile.name.split('.').pop().toLowerCase();
    if (!['xlsx', 'xls', 'csv'].includes(fileExtension)) {
      setErrorMsg('Format file tidak didukung! Pastikan menggunakan file berkas .xlsx, .xls, atau .csv');
      setFile(null);
      setParsedData([]);
      return;
    }

    setFile(selectedFile);
    setErrorMsg(null);
    setSuccessReport(null);
    setLoading(true);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Convert sheet to JSON
        const rawJson = XLSX.utils.sheet_to_json(worksheet, { defval: "" });
        
        if (rawJson.length === 0) {
          setErrorMsg('Berkas kosong atau tidak berisi baris data.');
          setParsedData([]);
          setLoading(false);
          return;
        }

        // Validate minimal column headers
        const keys = Object.keys(rawJson[0]).map(k => k.toLowerCase().trim());
        const hasNik = keys.some(k => k.includes('nik'));
        const hasNama = keys.some(k => k.includes('nama') || k.includes('name'));

        if (!hasNik && !hasNama) {
          setErrorMsg('Kolom tidak sesuai. Pastikan file memiliki baris header dengan nama kolom "nik" dan "nama".');
          setParsedData([]);
          setLoading(false);
          return;
        }

        setParsedData(rawJson);
        setLoading(false);
      } catch (err) {
        console.error(err);
        setErrorMsg('Gagal membaca file spreadsheet. Periksa apakah berkas rusak atau terkunci.');
        setParsedData([]);
        setLoading(false);
      }
    };

    reader.onerror = () => {
      setErrorMsg('Terjadi kesalahan saat membaca berkas dari sistem.');
      setLoading(false);
    };

    reader.readAsArrayBuffer(selectedFile);
  };

  // Simpan Data Import ke Backend / Local Storage
  const handleImportSave = async () => {
    if (!file) return;

    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await importAtsExcelAPI(file);
      setLoading(false);
      setSuccessReport({
        importedCount: parsedData.length,
        skippedCount: 0,
        message: res.message || 'Data Excel Anak Tidak Sekolah berhasil diimpor ke database terpadu.'
      });

      if (onImportSuccess) {
        onImportSuccess();
      }
    } catch (err) {
      console.warn('[ImportDataView] Backend offline / fallback to mock:', err);
      
      try {
        const fileDetails = { namaFile: file.name };
        const localRes = await importStudentsAPI(parsedData, fileDetails);
        setLoading(false);
        const { importedCount, skippedCount } = localRes.data;
        setSuccessReport({
          importedCount,
          skippedCount,
          message: 'Data berhasil diimpor ke sistem terpadu (mode offline).'
        });

        if (onImportSuccess) {
          onImportSuccess();
        }
      } catch (mockErr) {
        console.error(mockErr);
        setErrorMsg('Terjadi kesalahan saat memproses penyimpanan data ke sistem.');
        setLoading(false);
      }
    }
  };

  const handleReset = () => {
    setFile(null);
    setParsedData([]);
    setErrorMsg(null);
    setSuccessReport(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Metrik Pratinjau
  const validNikCount = parsedData.filter(r => {
    const rawNik = String(r.nik || r.NIK || '').trim();
    return /^\d{16}$/.test(rawNik);
  }).length;

  const detectedColumns = parsedData.length > 0 ? Object.keys(parsedData[0]) : [];

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* 1. Header & Hero Section */}
      <div className="p-6 sm:p-8 bg-gradient-to-r from-blue-900 via-slate-900 to-black rounded-3xl text-white shadow-lg shadow-slate-900/10 relative overflow-hidden">
        <div className="absolute right-0 bottom-0 opacity-20 translate-x-12 translate-y-12 scale-150 pointer-events-none">
          <FileSpreadsheet size={240} />
        </div>
        <div className="relative z-10 max-w-3xl space-y-3">
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-display">
            Upload Data Anak Tidak Sekolah (ATS)
          </h2>
          <p className="text-xs sm:text-sm text-blue-100/90 leading-relaxed font-light">
            Unggah berkas spreadsheet (.xlsx / .csv) hasil pendataan Dapodik atau Kunjungan Lapangan di 13 Kabupaten/Kota se-Provinsi Sulawesi Tengah untuk diunggah ke basis data terpadu.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleDownloadTemplate}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-bold rounded-xl backdrop-blur-xs transition-colors cursor-pointer"
            >
              <Download size={14} />
              <span>Unduh Format Templat CSV</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Success Banner */}
      {successReport && (
        <div className="p-6 sm:p-8 bg-emerald-50 border border-emerald-200/80 rounded-3xl space-y-4 shadow-sm animate-scaleUp">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold flex-shrink-0 shadow-md shadow-emerald-600/20">
              <CheckCircle2 size={26} />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-extrabold text-emerald-950 font-display">
                Data ATS Berhasil Diimpor!
              </h3>
              <p className="text-xs text-emerald-900 leading-relaxed font-medium">
                {successReport.message}
              </p>
              <div className="pt-2 flex items-center gap-4 text-xs font-bold text-emerald-900">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 border border-emerald-200">
                  <FileCheck size={14} className="text-emerald-700" />
                  {successReport.importedCount} Data Berhasil Disimpan
                </span>
                {successReport.skippedCount > 0 && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 border border-amber-200 text-amber-900">
                    {successReport.skippedCount} Duplikat Dilewati
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-emerald-200/60 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={onNavigateToDashboard}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-extrabold rounded-xl shadow-md shadow-emerald-700/20 transition-all cursor-pointer"
            >
              <Users size={15} />
              <span>Lihat Data di Dashboard ATS</span>
              <ArrowRight size={14} />
            </button>

            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-white hover:bg-emerald-100/50 text-emerald-800 border border-emerald-200 text-xs font-bold rounded-xl transition-colors cursor-pointer"
            >
              <RefreshCw size={14} />
              <span>Impor Berkas Lainnya</span>
            </button>
          </div>
        </div>
      )}

      {/* 3. Error Alert */}
      {errorMsg && (
        <div className="p-5 bg-red-50 border border-red-200/80 rounded-3xl flex items-start gap-4 text-xs text-red-800 shadow-xs">
          <div className="w-10 h-10 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center flex-shrink-0 font-bold">
            <AlertTriangle size={20} />
          </div>
          <div className="space-y-1">
            <h4 className="font-extrabold text-red-950 text-sm font-display">Gagal Memproses Berkas Excel</h4>
            <p className="leading-relaxed font-medium">{errorMsg}</p>
          </div>
        </div>
      )}

      {/* 4. Dropzone Upload (Jika belum ada file terpilih) */}
      {!file && !successReport && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-100 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-sm font-extrabold text-slate-800 font-display flex items-center gap-2">
                <Upload size={16} className="text-blue-700" />
                Unggah Berkas Spreadsheet
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Pilih atau seret berkas data ATS dalam format .xlsx, .xls, atau .csv</p>
            </div>
          </div>

          <div 
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            className={`rounded-3xl border-2 border-dashed transition-all duration-200 min-h-[260px] flex flex-col items-center justify-center text-center p-8 cursor-pointer group ${
              dragActive 
                ? 'border-blue-700 bg-blue-50/30 scale-[0.99]' 
                : 'border-slate-200 bg-slate-50/60 hover:bg-blue-50/20 hover:border-blue-500/50'
            }`}
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="w-16 h-16 rounded-3xl bg-blue-50 text-blue-700 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200 shadow-md shadow-blue-500/10 border border-blue-100">
              {loading ? <RefreshCw size={28} className="animate-spin" /> : <Upload size={28} />}
            </div>
            
            {loading ? (
              <div className="space-y-1">
                <span className="text-sm font-extrabold text-slate-800 block">Membaca & Memproses Struktur Berkas...</span>
                <span className="text-xs text-slate-400 block">Mohon tunggu sejenak</span>
              </div>
            ) : (
              <div className="space-y-1.5 max-w-md">
                <span className="text-base font-extrabold text-slate-800 block font-display">Tarik & Lepas Filedi Sini</span>
                <span className="text-xs text-slate-500 block">atau <strong className="text-blue-700 font-extrabold underline cursor-pointer">Klik untuk Menjelajahi File Komputer</strong></span>
                <p className="text-[11px] text-slate-400 pt-2 block border-t border-slate-200/60 mt-3">
                  Format yang didukung: <strong>.xlsx, .xls, .csv</strong>
                </p>
              </div>
            )}

            <input 
              type="file" 
              ref={fileInputRef}
              accept=".xlsx,.xls,.csv" 
              onChange={handleFileSelect}
              className="hidden" 
            />
          </div>
        </div>
      )}

      {/* 5. Pratinjau Data Interaktif (Live Data Preview Section) */}
      {file && parsedData.length > 0 && !successReport && (
        <div className="space-y-6">
          
          {/* Summary Cards Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
                <FileCheck size={22} />
              </div>
              <div>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Total Baris Data</p>
                <h3 className="text-xl font-extrabold text-slate-800 mt-0.5">
                  {parsedData.length.toLocaleString('id-ID')} Siswa
                </h3>
              </div>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                <ShieldCheck size={22} />
              </div>
              <div>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">NIK Valid (16 Digit)</p>
                <h3 className="text-xl font-extrabold text-emerald-700 mt-0.5">
                  {validNikCount} <span className="text-xs text-slate-400 font-normal">({((validNikCount / parsedData.length) * 100).toFixed(0)}%)</span>
                </h3>
              </div>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold">
                <Database size={22} />
              </div>
              <div>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Kolom Terdeteksi</p>
                <h3 className="text-xl font-extrabold text-slate-800 mt-0.5">
                  {detectedColumns.length} Kolom
                </h3>
              </div>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold">
                <FileSpreadsheet size={22} />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Berkas Terpilih</p>
                <h3 className="text-xs font-extrabold text-slate-800 mt-0.5 truncate" title={file.name}>
                  {file.name}
                </h3>
              </div>
            </div>
          </div>

          {/* Preview Table Card */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-100 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-sm font-extrabold text-slate-800 font-display flex items-center gap-2">
                  <FileCheck size={16} className="text-blue-700" />
                  Pratinjau Tabel Data Berkas ({parsedData.length} Baris)
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Periksa keakuratan isi data sebelum disimpan ke basis data terpadu.</p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-4 py-2 border border-slate-200 text-slate-600 hover:text-red-600 hover:bg-red-50 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Ganti Berkas
                </button>

                <button
                  type="button"
                  disabled={loading}
                  onClick={handleImportSave}
                  className={`inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-800 hover:to-indigo-800 text-white text-xs font-extrabold rounded-xl shadow-md shadow-blue-700/20 transition-all cursor-pointer ${
                    loading ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Menyimpan Ke Database...</span>
                    </>
                  ) : (
                    <>
                      <Check size={15} />
                      <span>Proses & Simpan Ke Database ({parsedData.length} Data)</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Scrollable Preview Table */}
            <div className="w-full overflow-x-auto border border-slate-200/80 rounded-2xl shadow-2xs max-h-[420px] overflow-y-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100/80 border-b border-slate-200 sticky top-0 z-10 font-bold text-slate-700">
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
                <tbody className="divide-y divide-slate-100 bg-white">
                  {parsedData.map((row, idx) => {
                    const nama = row.nama || row.Nama || row['Nama Lengkap'] || '-';
                    const nik = String(row.nik || row.NIK || '-').trim();
                    const nisn = String(row.nisn || row.NISN || '-').trim();
                    const jk = row.jenis_kelamin || row.jk || row.JK || '-';
                    const kab = row.kabupaten || row.Kabupaten || '-';
                    const kec = row.kecamatan || row.Kecamatan || '-';
                    const desa = row.desa_kelurahan || row.desa || row.Desa || '-';
                    const status = String(row.status || row.Status || 'DO').toUpperCase();
                    const sekolah = row.sekolah_id || row.sekolah || row.Sekolah || '-';
                    const isNikValid = /^\d{16}$/.test(nik);

                    return (
                      <tr key={idx} className={`hover:bg-blue-50/30 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'}`}>
                        <td className="px-4 py-3 text-center font-bold text-slate-400">{idx + 1}</td>
                        <td className="px-4 py-3 font-extrabold text-slate-800">{nama}</td>
                        <td className="px-4 py-3 font-mono font-medium">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] ${
                            isNikValid ? 'bg-emerald-50 text-emerald-700 font-bold' : 'bg-amber-50 text-amber-700'
                          }`}>
                            {nik}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-mono text-slate-600">{nisn}</td>
                        <td className="px-4 py-3 text-slate-600">{jk}</td>
                        <td className="px-4 py-3 font-semibold text-slate-700">{kab}</td>
                        <td className="px-4 py-3 text-slate-600">{kec}</td>
                        <td className="px-4 py-3 text-slate-600">{desa}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                            status === 'DO' 
                              ? 'bg-red-50 text-red-600 border border-red-100' 
                              : 'bg-blue-50 text-blue-700 border border-blue-100'
                          }`}>
                            {status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-600 max-w-[180px] truncate" title={sekolah}>{sekolah}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
