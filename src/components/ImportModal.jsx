import React, { useState, useRef } from 'react';
import { 
  X, 
  Upload, 
  Download, 
  FileSpreadsheet, 
  Check, 
  AlertTriangle, 
  RefreshCw, 
  Info,
  CheckCircle2
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { importStudentsAPI } from '../services/api';

export default function ImportModal({ isOpen, onClose, onImportSuccess }) {
  const [file, setFile] = useState(null);
  const [parsedData, setParsedData] = useState([]);
  const [errorMsg, setErrorMsg] = useState(null);
  const [successReport, setSuccessReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  // Unduh Templat CSV dengan Header Kolom yang Tepat secara Dinamis
  const handleDownloadTemplate = () => {
    const headers = [
      'nama',
      'nik',
      'nisn',
      'jk',
      'tanggal_lahir',
      'id_sekolah',
      'kelas',
      'keterangan',
      'status',
      'kabupaten',
      'kecamatan',
      'desa',
      'alamat_jalan',
      'lintang',
      'bujur'
    ].join(',');

    const sampleRow1 = [
      'Budi Santoso',
      '7207052308990008',
      '0076214589',
      'Laki-laki',
      '10 Mei 2008',
      'SMPN 1 Sigi',
      '8',
      'Putus sekolah karena kendala ekonomi keluarga',
      'DO',
      'Kab. Sigi',
      'Gumbasa',
      'Pakuli',
      'Jln. Poros Palu-Kulawi KM 10, RT 01/RW 01',
      '-1.2583',
      '119.9234'
    ].join(',');

    const sampleRow2 = [
      'Siti Aisyah',
      '7203114509980009',
      '0081245789',
      'Perempuan',
      '12 November 2007',
      'SDN 2 Banawa',
      '6',
      'Lulus SD namun tidak melanjutkan karena tidak memiliki biaya seragam',
      'LTM',
      'Kab. Donggala',
      'Banawa',
      'Ganti',
      'Jln. Trans Sulawesi RT 02/RW 01',
      '-0.6854',
      '119.7428'
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

  // Proses drag & drop file
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

  // Parsing File dengan SheetJS (Excel / CSV)
  const processFile = (selectedFile) => {
    const fileExtension = selectedFile.name.split('.').pop().toLowerCase();
    if (!['xlsx', 'xls', 'csv'].includes(fileExtension)) {
      setErrorMsg('Format file tidak didukung! Pastikan menggunakan file .xlsx, .xls, atau .csv');
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
        
        // Ubah worksheet ke JSON
        const rawJson = XLSX.utils.sheet_to_json(worksheet, { defval: "" });
        
        if (rawJson.length === 0) {
          setErrorMsg('File kosong atau tidak memiliki baris data.');
          setParsedData([]);
          setLoading(false);
          return;
        }

        // Cek header minimal (nik & nama wajib ada)
        const keys = Object.keys(rawJson[0]).map(k => k.toLowerCase().trim());
        const hasNik = keys.includes('nik');
        const hasNama = keys.includes('nama') || keys.includes('nama lengkap') || keys.includes('nama_lengkap');

        if (!hasNik || !hasNama) {
          setErrorMsg('Format kolom salah. Pastikan file memiliki baris header dengan nama kolom "nik" dan "nama".');
          setParsedData([]);
          setLoading(false);
          return;
        }

        setParsedData(rawJson);
        setLoading(false);
      } catch (err) {
        console.error(err);
        setErrorMsg('Gagal membaca file spreadsheet. Periksa apakah berkas tidak rusak.');
        setParsedData([]);
        setLoading(false);
      }
    };

    reader.onerror = () => {
      setErrorMsg('Gagal membaca file.');
      setLoading(false);
    };

    reader.readAsArrayBuffer(selectedFile);
  };

  // Simpan Data Hasil Import ke Sistem
  const handleImportSave = () => {
    if (parsedData.length === 0) return;

    setLoading(true);
    
    const fileDetails = {
      namaFile: file.name
    };

    importStudentsAPI(parsedData, fileDetails)
      .then(res => {
        setLoading(false);
        const { importedCount, skippedCount } = res.data;
        setSuccessReport({ importedCount, skippedCount });
        
        // Reset state upload
        setFile(null);
        setParsedData([]);

        // Panggil callback sukses agar dashboard ter-update
        if (onImportSuccess) {
          onImportSuccess();
        }
      })
      .catch(err => {
        console.error(err);
        setErrorMsg('Terjadi kesalahan saat memproses penyimpanan data ke sistem.');
        setLoading(false);
      });
  };

  // Tombol batal / bersihkan upload saat ini
  const handleReset = () => {
    setFile(null);
    setParsedData([]);
    setErrorMsg(null);
    setSuccessReport(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      {/* Modal Card */}
      <div className="bg-white rounded-3xl w-full max-w-3xl overflow-hidden shadow-2xl border border-slate-100 flex flex-col max-h-[90vh] animate-scaleUp">
        
        {/* Header Modal */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50 to-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center shadow-sm">
              <FileSpreadsheet size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800 font-display">Import Data ATS</h3>
              <p className="text-xs text-slate-400 mt-0.5">Unggah berkas excel / csv berkala untuk pembaruan data daerah</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Container (Scrollable) */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-6 flex-1">
          
          {/* Petunjuk format dan tombol unduh template */}
          <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-2xl flex items-start gap-3">
            <Info className="text-blue-600 w-5 h-5 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-slate-600 space-y-2 leading-relaxed">
              <p className="font-bold text-blue-800">Petunjuk Format Berkas:</p>
              <p>Pastikan file spreadsheet memiliki baris paling atas berisi header kolom dalam bahasa Indonesia/Inggris (misal: <strong>nama, nik, nisn, jk, tanggal_lahir, kabupaten, kecamatan, desa, alamat_jalan, lintang, bujur</strong>).</p>
              <button 
                type="button"
                onClick={handleDownloadTemplate}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-700 hover:bg-blue-800 text-white font-bold rounded-lg shadow-sm transition-colors cursor-pointer mt-1"
              >
                <Download size={12} />
                Unduh Templat CSV (.csv)
              </button>
            </div>
          </div>

          {/* Menampilkan Pesan Hasil Sukses */}
          {successReport && (
            <div className="p-5 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-start gap-3 text-sm text-emerald-800">
              <CheckCircle2 className="text-emerald-600 w-6 h-6 flex-shrink-0" />
              <div>
                <h4 className="font-bold text-emerald-950 font-display">Proses Import Berhasil Selesai!</h4>
                <div className="mt-2 space-y-1">
                  <p>• <strong className="font-bold text-emerald-900">{successReport.importedCount} data anak baru</strong> berhasil ditambahkan ke dashboard.</p>
                  {successReport.skippedCount > 0 && (
                    <p className="text-slate-500">• {successReport.skippedCount} data di-skip / dilewati karena duplikasi NIK atau data tidak memiliki NIK.</p>
                  )}
                </div>
                <button
                  onClick={handleReset}
                  className="mt-3 text-xs font-bold text-blue-700 hover:text-blue-800 cursor-pointer underline block"
                >
                  Import file lainnya
                </button>
              </div>
            </div>
          )}

          {/* Menampilkan Pesan Error */}
          {errorMsg && (
            <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-3 text-xs text-red-800">
              <AlertTriangle className="text-red-600 w-5 h-5 flex-shrink-0" />
              <div className="font-medium leading-relaxed">
                <p className="font-bold text-red-950 font-display">Gagal Memproses Berkas:</p>
                <p className="mt-1">{errorMsg}</p>
              </div>
            </div>
          )}

          {/* Skenario 1: Upload Dropzone (jika file belum di-select) */}
          {!file && !successReport && (
            <div 
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              className={`rounded-3xl border-2 border-dashed transition-all duration-200 min-h-[220px] flex flex-col items-center justify-center text-center p-8 cursor-pointer group ${
                dragActive 
                  ? 'border-blue-700 bg-blue-50/20' 
                  : 'border-slate-200 bg-slate-50 hover:bg-slate-100/50 hover:border-blue-600/40'
              }`}
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="w-14 h-14 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200 shadow-sm">
                {loading ? <RefreshCw size={24} className="animate-spin" /> : <Upload size={24} />}
              </div>
              
              {loading ? (
                <div>
                  <span className="text-sm font-bold text-slate-700">Membaca dan mengurai file...</span>
                  <p className="text-xs text-slate-400 mt-1">Menggunakan engine SheetJS</p>
                </div>
              ) : (
                <div>
                  <span className="text-sm font-bold text-slate-700 block">Tarik & lepas file spreadsheet ke sini</span>
                  <span className="text-xs text-slate-400 mt-1 block">atau <strong className="text-blue-700 font-bold underline">klik untuk cari file</strong> di komputer Anda</span>
                  <span className="text-[10px] text-slate-400 mt-2 block">Mendukung berkas format .xlsx, .xls, .csv (Maks. 10MB)</span>
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
          )}

          {/* Skenario 2: Pratinjau Grid Data */}
          {file && parsedData.length > 0 && (
            <div className="space-y-4">
              {/* Header Pratinjau */}
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-700 font-display">Pratinjau Data Impor</h4>
                  <p className="text-xs text-slate-400 mt-0.5">Menemukan total <strong className="font-bold text-slate-600">{parsedData.length} baris</strong> data di dalam file <strong className="font-bold text-slate-600">"{file.name}"</strong></p>
                </div>
                <button 
                  type="button" 
                  onClick={handleReset} 
                  className="text-xs font-bold text-red-600 hover:text-red-700 cursor-pointer flex items-center gap-1.5"
                >
                  <X size={14} /> Batalkan
                </button>
              </div>

              {/* Grid Scrollable Tabel Pratinjau */}
              <div className="border border-slate-100 rounded-2xl overflow-hidden shadow-sm max-h-[220px] overflow-y-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 sticky top-0">
                      <th className="px-4 py-3 font-semibold text-slate-500">Nama</th>
                      <th className="px-4 py-3 font-semibold text-slate-500">NIK</th>
                      <th className="px-4 py-3 font-semibold text-slate-500">NISN</th>
                      <th className="px-4 py-3 font-semibold text-slate-500">Kabupaten</th>
                      <th className="px-4 py-3 font-semibold text-slate-500 text-center">Lintang (Lat)</th>
                      <th className="px-4 py-3 font-semibold text-slate-500 text-center">Bujur (Lng)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 bg-white">
                    {parsedData.slice(0, 5).map((row, idx) => {
                      const lat = row.lintang || row.latitude || row.Latitude || '-';
                      const lng = row.bujur || row.longitude || row.Longitude || '-';
                      return (
                        <tr key={idx} className="hover:bg-slate-50/50">
                          <td className="px-4 py-2.5 font-semibold text-slate-700">{row.nama || row.Nama || row['Nama Lengkap'] || '-'}</td>
                          <td className="px-4 py-2.5 font-mono text-slate-600">{row.nik || row.NIK || '-'}</td>
                          <td className="px-4 py-2.5 font-mono text-slate-600">{row.nisn || row.NISN || '-'}</td>
                          <td className="px-4 py-2.5 text-slate-600">{row.kabupaten || row.Kabupaten || '-'}</td>
                          <td className="px-4 py-2.5 font-mono text-center text-slate-500">{lat}</td>
                          <td className="px-4 py-2.5 font-mono text-center text-slate-500">{lng}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <p className="text-[10px] text-slate-400 text-right italic">*Menampilkan maksimal 5 baris pertama untuk peninjauan.</p>
            </div>
          )}

        </div>

        {/* Footer Modal */}
        <div className="p-6 border-t border-slate-100 flex items-center justify-end gap-3 bg-slate-50">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-sm font-semibold rounded-xl transition-colors cursor-pointer"
          >
            Tutup
          </button>
          
          {file && parsedData.length > 0 && (
            <button
              type="button"
              disabled={loading}
              onClick={handleImportSave}
              className={`px-5 py-2.5 bg-blue-700 hover:bg-blue-800 text-white text-sm font-semibold rounded-xl shadow-md shadow-blue-700/10 transition-colors flex items-center gap-1.5 cursor-pointer ${
                loading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Menyimpan...
                </>
              ) : (
                <>
                  <Check size={16} />
                  Simpan & Import ({parsedData.length} Baris)
                </>
              )}
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
