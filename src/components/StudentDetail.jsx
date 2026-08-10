import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  User, 
  FileText, 
  MapPin, 
  Calendar, 
  AlertTriangle, 
  Upload, 
  Save, 
  X, 
  Check, 
  Sparkles, 
  Briefcase, 
  GraduationCap,
  FileCheck,
  Image as ImageIcon,
  History,
  MapPinOff,
  CheckCircle2,
  Plus,
  ExternalLink,
  Download,
  ChevronDown,
  ChevronUp,
  Clock,
  Trash2
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { getStudentByIdAPI, createTindakLanjutAPI, deleteTindakLanjutAPI } from '../services/api';

// Helper format tanggal Indonesia (contoh: 2008-05-04T00:00:00.000000Z -> 4 Mei 2008)
const formatDateIndo = (dateStr) => {
  if (!dateStr || dateStr === '-') return '-';
  try {
    const cleanDate = String(dateStr).split('T')[0];
    const [year, month, day] = cleanDate.split('-');
    if (!year || !month || !day) return String(dateStr);
    
    const months = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    const monthIndex = parseInt(month, 10) - 1;
    const monthName = (monthIndex >= 0 && monthIndex < 12) ? months[monthIndex] : month;
    return `${parseInt(day, 10)} ${monthName} ${year}`;
  } catch (e) {
    return String(dateStr);
  }
};

// Helper normalisasi koordinat (menangani format angka integer desimal Excel seperti 1040500000000 atau -1408700000000)
const normalizeCoordinate = (val, isLatitude = true) => {
  if (val === null || val === undefined || val === '') return null;
  let str = String(val).trim().replace(/,/g, '.').replace(/[^\d.-]/g, '');
  let num = parseFloat(str);
  if (isNaN(num) || !isFinite(num) || num === 0) return null;

  // Jika format eksponensial / integer raksasa dari Excel tanpa tanda koma (contoh: 1040500000000 atau 120815500000000)
  if (Math.abs(num) > 180) {
    const isNegative = num < 0;
    const digits = Math.abs(num).toString().replace('.', '');
    
    if (isLatitude) {
      // Latitude di Sulawesi Tengah: 1 digit sebelum koma (antara -4 s.d. +2)
      const normalizedStr = (isNegative ? '-' : '') + digits.slice(0, 1) + '.' + digits.slice(1);
      num = parseFloat(normalizedStr);
    } else {
      // Longitude di Sulawesi Tengah: 3 digit sebelum koma (antara 118 s.d. 125)
      if (digits.startsWith('1')) {
        const normalizedStr = digits.slice(0, 3) + '.' + digits.slice(3);
        num = parseFloat(normalizedStr);
      } else {
        const normalizedStr = digits.slice(0, 2) + '.' + digits.slice(2);
        num = parseFloat(normalizedStr);
      }
    }
  }

  // Validasi batas rentang geografis bumi
  if (isLatitude && num >= -90 && num <= 90) return num;
  if (!isLatitude && num >= -180 && num <= 180) return num;

  return null;
};

// Sub-komponen untuk update view peta saat koordinat berubah secara dinamis & responsif
function ChangeMapView({ center, zoom = 14 }) {
  const map = useMap();
  useEffect(() => {
    if (
      Array.isArray(center) &&
      center.length === 2 &&
      typeof center[0] === 'number' &&
      typeof center[1] === 'number' &&
      !isNaN(center[0]) &&
      !isNaN(center[1]) &&
      isFinite(center[0]) &&
      isFinite(center[1]) &&
      center[0] >= -90 &&
      center[0] <= 90 &&
      center[1] >= -180 &&
      center[1] <= 180
    ) {
      try {
        map.invalidateSize();
        map.flyTo(center, zoom, {
          animate: true,
          duration: 1.2
        });
      } catch (e) {
        console.warn('Map flyTo safe catch:', e);
      }
    }
  }, [center, zoom, map]);
  return null;
}

// Marker Icon WebGIS Leaflet
const createCustomIcon = () => {
  return L.divIcon({
    html: `
      <div class="relative flex items-center justify-center">
        <div class="absolute w-8 h-8 rounded-full bg-blue-500 opacity-30 animate-ping"></div>
        <div class="relative w-9 h-9 rounded-full bg-[#1C40AC] border-2 border-white shadow-xl flex items-center justify-center text-white transition-all duration-300 hover:scale-110">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-5 h-5">
            <path d="M11.47 3.84a.75.75 0 011.06 0l8.69 8.69a.75.75 0 101.06-1.06l-8.689-8.69a2.25 2.25 0 00-3.182 0l-8.69 8.69a.75.75 0 001.061 1.06l8.69-8.69z" />
            <path d="M12 5.432l8.159 8.159c.03.03.06.058.091.086v6.198c0 1.035-.84 1.875-1.875 1.875H15a.75.75 0 01-.75-.75v-4.5a.75.75 0 00-.75-.75h-3a.75.75 0 00-.75.75V21a.75.75 0 01-.75.75H5.625a1.875 1.875 0 01-1.875-1.875v-6.198a2.29 2.29 0 00.091-.086L12 5.43z" />
          </svg>
        </div>
      </div>
    `,
    className: 'custom-leaflet-marker-wrapper',
    iconSize: [36, 36],
    iconAnchor: [18, 36],
    popupAnchor: [0, -36]
  });
};

// Error boundary khusus untuk komponen Map Leaflet agar tidak pernah memblokir tampilan biodata
class MapErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.warn('Leaflet Map rendering error caught gracefully:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="w-full h-full min-h-[380px] bg-slate-50 flex flex-col items-center justify-center p-6 text-center text-slate-400">
          <MapPin size={32} className="text-slate-300 mb-2" />
          <p className="text-xs font-bold text-slate-600">Format Koordinat Tidak Valid</p>
          <p className="text-[11px] text-slate-400 mt-1">Titik peta tidak dapat dirender untuk koordinat ini.</p>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function StudentDetail({ id, onBack, onSaveSuccess }) {
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // State Form Tindak Lanjut
  const [keterangan, setKeterangan] = useState('');
  const [alasan, setAlasan] = useState('');
  const [tanggalTindakLanjut, setTanggalTindakLanjut] = useState(
    new Date().toISOString().split('T')[0]
  );
  
  // State Dokumen & Foto File
  const [dokumenFile, setDokumenFile] = useState(null);
  const [dokumenName, setDokumenName] = useState('');
  const [fotoFile, setFotoFile] = useState(null);
  const [fotoPreview, setFotoPreview] = useState('');
  
  // State UI
  const [submitting, setSubmitting] = useState(false);
  const [showNewForm, setShowNewForm] = useState(false);
  const [alertMsg, setAlertMsg] = useState(null); // { type: 'success' | 'error', text: '' }

  // Load Data Siswa
  const loadDetail = () => {
    setLoading(true);
    getStudentByIdAPI(id)
      .then(response => {
        if (response && response.data) {
          const data = response.data;
          setStudent(data);
          
          // Cek apakah ada riwayat tindak lanjut dari relasi Laravel `tindak_lanjuts` atau legacy `tindakanLanjut`
          const existingTindakLanjut = (data.tindak_lanjuts && data.tindak_lanjuts.length > 0)
            ? data.tindak_lanjuts[data.tindak_lanjuts.length - 1]
            : (data.tindakanLanjut || null);

          if (existingTindakLanjut) {
            setKeterangan(existingTindakLanjut.keterangan || '');
            setAlasan(existingTindakLanjut.alasan || '');
            if (existingTindakLanjut.tanggal_tindak_lanjut) {
              setTanggalTindakLanjut(existingTindakLanjut.tanggal_tindak_lanjut.split('T')[0]);
            }
            if (existingTindakLanjut.dokumen_pendukung_path) {
              setDokumenName(existingTindakLanjut.dokumen_pendukung_path.split('/').pop());
            } else if (existingTindakLanjut.dokumenName) {
              setDokumenName(existingTindakLanjut.dokumenName);
            }
            if (existingTindakLanjut.foto_dokumentasi_path) {
              const backendUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:8000';
              setFotoPreview(`${backendUrl}/storage/${existingTindakLanjut.foto_dokumentasi_path}`);
            } else if (existingTindakLanjut.fotoUrl) {
              setFotoPreview(existingTindakLanjut.fotoUrl);
            }
          }
        } else {
          setAlertMsg({ type: 'error', text: 'Data Anak Tidak Sekolah tidak ditemukan!' });
        }
        setLoading(false);
      })
      .catch(err => {
        console.error("[StudentDetail] Gagal mengambil data detail:", err);
        setAlertMsg({ type: 'error', text: 'Gagal mengambil data dari server.' });
        setLoading(false);
      });
  };

  useEffect(() => {
    loadDetail();
  }, [id]);

  // Handle Dokumen
  const handleDokumenChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setAlertMsg({ type: 'error', text: 'Ukuran dokumen maksimal 10 MB!' });
        return;
      }
      setDokumenFile(file);
      setDokumenName(file.name);
    }
  };

  const handleRemoveDokumen = () => {
    setDokumenFile(null);
    setDokumenName('');
    const input = document.getElementById('dokumen-upload');
    if (input) input.value = '';
  };

  // Handle Foto
  const handleFotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setAlertMsg({ type: 'error', text: 'Ukuran foto maksimal 10 MB!' });
        return;
      }
      setFotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setFotoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveFoto = () => {
    setFotoFile(null);
    setFotoPreview('');
    const input = document.getElementById('foto-upload');
    if (input) input.value = '';
  };

  // Submit Form Tindak Lanjut ke Backend
  const handleSubmitTindakLanjut = async (e) => {
    e.preventDefault();
    if (!keterangan) {
      setAlertMsg({ type: 'error', text: 'Pilih keterangan status tindak lanjut terlebih dahulu!' });
      return;
    }

    setSubmitting(true);
    setAlertMsg(null);

    const formData = new FormData();
    formData.append('anak_tidak_sekolah_id', id);
    formData.append('keterangan', keterangan);
    formData.append('tanggal_tindak_lanjut', tanggalTindakLanjut || '');
    formData.append('alasan', alasan || '');

    if (dokumenFile) {
      formData.append('dokumen_pendukung', dokumenFile);
    }
    if (fotoFile) {
      formData.append('foto_dokumentasi', fotoFile);
    }

    try {
      await createTindakLanjutAPI(formData);
      setAlertMsg({
        type: 'success',
        text: 'Data tindak lanjut berhasil disimpan ke basis data backend!'
      });
      loadDetail();
      if (onSaveSuccess) onSaveSuccess();
      setShowNewForm(false);
    } catch (err) {
      console.error("[StudentDetail] Gagal menyimpan tindak lanjut:", err);
      const errDetail = err.response?.data?.message || err.message || 'Terjadi kesalahan sistem.';
      setAlertMsg({
        type: 'error',
        text: `Gagal menyimpan tindak lanjut: ${errDetail}`
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Hapus Data Tindak Lanjut dari Backend
  const handleDeleteTindakLanjut = async (tindakLanjutId) => {
    if (!tindakLanjutId) return;
    const confirmDelete = window.confirm(
      'Apakah Anda yakin ingin menghapus data tindak lanjut ini? Status anak akan kembali menjadi "Belum Ditindaklanjuti".'
    );
    if (!confirmDelete) return;

    setSubmitting(true);
    try {
      await deleteTindakLanjutAPI(tindakLanjutId);
      setAlertMsg({
        type: 'success',
        text: 'Data tindak lanjut berhasil dihapus. Status anak kini Belum Ditindaklanjuti.'
      });
      handleResetForm();
      loadDetail();
      if (onSaveSuccess) onSaveSuccess();
    } catch (err) {
      console.error("[StudentDetail] Gagal menghapus tindak lanjut:", err);
      const errDetail = err.response?.data?.message || err.message || 'Terjadi kesalahan sistem.';
      setAlertMsg({
        type: 'error',
        text: `Gagal menghapus tindak lanjut: ${errDetail}`
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetForm = () => {
    setKeterangan('');
    setAlasan('');
    setTanggalTindakLanjut(new Date().toISOString().split('T')[0]);
    setDokumenFile(null);
    setDokumenName('');
    setFotoFile(null);
    setFotoPreview('');
    setAlertMsg(null);
  };

  if (loading) {
    return (
      <div className="w-full bg-white rounded-3xl p-8 shadow-sm border border-slate-100 animate-pulse min-h-[600px] flex flex-col gap-6">
        <div className="h-8 bg-slate-200 rounded-lg w-1/4 mb-4"></div>
        <div className="h-40 bg-slate-100 rounded-2xl w-full"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-64 bg-slate-100 rounded-2xl w-full"></div>
          <div className="h-64 bg-slate-100 rounded-2xl w-full"></div>
        </div>
        <div className="h-48 bg-slate-100 rounded-2xl w-full"></div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="w-full bg-white rounded-3xl p-12 shadow-sm border border-slate-100 text-center min-h-[400px] flex flex-col items-center justify-center">
        <AlertTriangle className="text-red-500 w-16 h-16 mb-4" />
        <h3 className="text-xl font-bold text-slate-800">Siswa Tidak Ditemukan</h3>
        <p className="text-slate-500 mt-2">Data Anak Tidak Sekolah dengan ID #{id} tidak tersedia.</p>
        <button 
          onClick={onBack} 
          className="mt-6 px-5 py-2.5 bg-blue-700 text-white text-sm font-bold rounded-xl hover:bg-blue-800 transition-all cursor-pointer"
        >
          Kembali ke Tabel
        </button>
      </div>
    );
  }

  // Ekstraksi & resolusi koordinat lokasi presisi
  let rawLat = normalizeCoordinate(student.lintang ?? student.latitude, true);
  let rawLng = normalizeCoordinate(student.bujur ?? student.longitude, false);

  // Deteksi jika koordinat tertukar di data Excel (misal Lintang diisi 119.88 dan Bujur diisi -0.89)
  if (rawLat !== null && rawLng !== null) {
    if (rawLat > 90 || (rawLat > 100 && rawLat < 140 && rawLng >= -10 && rawLng <= 10)) {
      const temp = rawLat;
      rawLat = rawLng;
      rawLng = temp;
    }
  }

  // Cek apakah data koordinat presisi siswa benar-benar tersedia di basis data
  const hasCoordinates = typeof rawLat === 'number' && typeof rawLng === 'number' && !isNaN(rawLat) && !isNaN(rawLng);
  const mapCenter = hasCoordinates ? [rawLat, rawLng] : null;

  // Riwayat tindak lanjut
  const tindakLanjutList = student.tindak_lanjuts || (student.tindakanLanjut ? [student.tindakanLanjut] : []);
  const isHandled = Array.isArray(tindakLanjutList) && tindakLanjutList.length > 0;

  return (
    <div className="w-full flex flex-col gap-8 transition-all duration-300">
      
      {/* Breadcrumb & Tombol Kembali */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
          <span className="cursor-pointer hover:text-blue-700 transition-colors" onClick={onBack}>Dashboard ATS</span>
          <span>/</span>
          <span className="text-slate-700">Detail Biodata & Tindak Lanjut</span>
        </div>
        
        <button 
          onClick={onBack} 
          className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 shadow-sm transition-all duration-200 cursor-pointer w-fit"
        >
          <ArrowLeft size={15} />
          Kembali ke Tabel ATS
        </button>
      </div>

      {/* Header Utama Profil Siswa */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
        
        <div className="flex items-center gap-4 sm:gap-6 relative z-10">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-blue-700 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-700/20 flex-shrink-0">
            <User size={36} />
          </div>
          <div>
            <div className="flex items-center flex-wrap gap-2.5">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-800 font-display tracking-tight leading-none">
                {student.nama || 'Nama Tidak Terdata'}
              </h2>
              {student.status === 'DO' ? (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-red-50 text-red-600 border border-red-100">
                  Drop Out (DO)
                </span>
              ) : (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-orange-50 text-orange-600 border border-orange-100">
                  Lulus Tidak Melanjutkan (LTM)
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 relative z-10">
          {isHandled ? (
            <div className="px-4 py-2.5 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-600" />
              <span className="text-xs font-bold">Sudah Ditindaklanjuti</span>
            </div>
          ) : (
            <div className="px-4 py-2.5 rounded-2xl bg-amber-50 text-amber-700 border border-amber-100 flex items-center gap-2">
              <Clock size={16} className="text-amber-600" />
              <span className="text-xs font-bold">Belum Ditindaklanjuti</span>
            </div>
          )}
        </div>
      </div>

      {/* Alert Notifikasi Pesan */}
      {alertMsg && (
        <div className={`p-4 rounded-2xl flex items-center justify-between text-xs font-bold animate-fadeIn ${
          alertMsg.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          <div className="flex items-center gap-2">
            {alertMsg.type === 'success' ? <Check size={16} /> : <AlertTriangle size={16} />}
            <span>{alertMsg.text}</span>
          </div>
          <button onClick={() => setAlertMsg(null)} className="p-1 hover:bg-black/5 rounded-lg cursor-pointer">
            <X size={14} />
          </button>
        </div>
      )}

      {/* ============================================================ */}
      {/* 1. KARTU BIODATA LENGKAP ATS (43 KOLOM ASLI DAPODIK / EMIS) */}
      {/* ============================================================ */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 sm:p-8 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50 to-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center shadow-sm font-bold">
              <User size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800 font-display">Biodata Lengkap Siswa</h3>
            </div>
          </div>
        </div>
        
        <div className="p-6 sm:p-8 space-y-8">
          
          {/* Sub-Section A: Identitas Personal & Kependudukan */}
          <div>
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-blue-700 flex items-center gap-2 mb-4 border-b border-blue-50 pb-2">
              <User size={14} /> Identitas Pribadi & Kependudukan
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 text-xs">
              <div className="bg-slate-50/60 p-3.5 rounded-2xl border border-slate-100">
                <span className="text-slate-400 block uppercase font-bold text-[10px]">Nama Lengkap</span>
                <span className="font-bold text-slate-800 text-sm mt-1 block">{student.nama || '-'}</span>
              </div>
              <div className="bg-slate-50/60 p-3.5 rounded-2xl border border-slate-100">
                <span className="text-slate-400 block uppercase font-bold text-[10px]">Nomor Induk Kependudukan (NIK)</span>
                <span className="font-mono font-bold text-slate-900 text-sm mt-1 block">{student.nik || '-'}</span>
              </div>
              <div className="bg-slate-50/60 p-3.5 rounded-2xl border border-slate-100">
                <span className="text-slate-400 block uppercase font-bold text-[10px]">Nomor Kartu Keluarga (No KK)</span>
                <span className="font-mono font-bold text-slate-800 text-sm mt-1 block">{student.no_kk || '-'}</span>
              </div>
              <div className="bg-slate-50/60 p-3.5 rounded-2xl border border-slate-100">
                <span className="text-slate-400 block uppercase font-bold text-[10px]">NISN</span>
                <span className="font-mono font-bold text-slate-800 text-sm mt-1 block">{student.nisn || '-'}</span>
              </div>
              <div className="bg-slate-50/60 p-3.5 rounded-2xl border border-slate-100">
                <span className="text-slate-400 block uppercase font-bold text-[10px]">Jenis Kelamin</span>
                <span className="font-bold text-slate-800 mt-1 block">{student.jenis_kelamin || student.jk || '-'}</span>
              </div>
              <div className="bg-slate-50/60 p-3.5 rounded-2xl border border-slate-100">
                <span className="text-slate-400 block uppercase font-bold text-[10px]">Tempat, Tanggal Lahir</span>
                <span className="font-bold text-slate-800 mt-1 block">
                  {student.tempat_lahir ? `${student.tempat_lahir}, ` : ''}{formatDateIndo(student.tanggal_lahir || student.tanggalLahir)}
                </span>
              </div>
              <div className="bg-slate-50/60 p-3.5 rounded-2xl border border-slate-100 sm:col-span-2">
                <span className="text-slate-400 block uppercase font-bold text-[10px]">Nama Ibu Kandung</span>
                <span className="font-bold text-slate-800 mt-1 block">{student.nama_ibu_kandung || '-'}</span>
              </div>
            </div>
          </div>

          {/* Sub-Section B: Data Akademik & Status Sekolah Asal */}
          <div>
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-blue-700 flex items-center gap-2 mb-4 border-b border-blue-50 pb-2">
              <GraduationCap size={14} /> Data Sekolah Asal & Status ATS
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 text-xs">
              <div className="bg-slate-50/60 p-3.5 rounded-2xl border border-slate-100">
                <span className="text-slate-400 block uppercase font-bold text-[10px]">ID / Nama Sekolah Asal</span>
                <span className="font-bold text-slate-800 text-sm mt-1 block">{student.sekolah_id || student.idSekolah || '-'}</span>
              </div>
              <div className="bg-slate-50/60 p-3.5 rounded-2xl border border-slate-100">
                <span className="text-slate-400 block uppercase font-bold text-[10px]">Tingkat Pendidikan / Kelas</span>
                <span className="font-bold text-slate-800 text-sm mt-1 block">
                  {student.tingkat_pendidikan || `Kelas ${student.kelas || '-'}`}
                </span>
              </div>
              <div className="bg-slate-50/60 p-3.5 rounded-2xl border border-slate-100">
                <span className="text-slate-400 block uppercase font-bold text-[10px]">Tahun / Semester</span>
                <span className="font-bold text-slate-800 mt-1 block">{student.tahun || '-'} / {student.semester_id || '-'}</span>
              </div>
              <div className="bg-slate-50/60 p-3.5 rounded-2xl border border-slate-100">
                <span className="text-slate-400 block uppercase font-bold text-[10px]">Status Kategori ATS</span>
                <span className="font-bold text-slate-800 mt-1 block">
                  {student.status === 'DO' ? 'Putus Sekolah (Drop Out)' : 'Lulus Tidak Melanjutkan (LTM)'}
                </span>
              </div>
            </div>
          </div>

          {/* Sub-Section C: Keterangan Penyebab Putus Sekolah */}
          {(student.keterangan || student.alasan_lainnya || student.keterangan_approval || student.alasan_approval_keterangan) && (
            <div className="bg-amber-50/50 p-4 rounded-2xl border border-amber-100 text-xs">
              <span className="text-amber-800 font-bold uppercase tracking-wider flex items-center gap-1.5 mb-1 text-[11px]">
                <AlertTriangle size={13} /> Keterangan Penyebab Anak Tidak Sekolah
              </span>
              <p className="text-slate-700 leading-relaxed font-medium">
                {student.keterangan || student.alasan_lainnya || student.keterangan_approval || student.alasan_approval_keterangan}
              </p>
            </div>
          )}

        </div>
      </div>

      {/* ============================================================ */}
      {/* 2. KARTU ALAMAT & PEMETAAN WEBGIS                            */}
      {/* ============================================================ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        
        {/* PANEL KIRI: DETAIL TEKS ALAMAT LENGKAP */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-between min-h-[380px] h-full">
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center shadow-sm">
                <MapPin size={20} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800 font-display">Wilayah & Alamat Domisili</h3>
              </div>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="grid grid-cols-3 items-baseline gap-2 border-b border-slate-50 pb-2.5">
                <span className="text-slate-400 font-semibold">Provinsi</span>
                <span className="font-bold text-slate-900 col-span-2">{student.provinsi || 'Sulawesi Tengah'}</span>
              </div>
              
              <div className="grid grid-cols-3 items-baseline gap-2 border-b border-slate-50 pb-2.5">
                <span className="text-slate-400 font-semibold">Kabupaten / Kota</span>
                <span className="font-bold text-slate-900 col-span-2">{student.kabupaten || '-'}</span>
              </div>
              
              <div className="grid grid-cols-3 items-baseline gap-2 border-b border-slate-50 pb-2.5">
                <span className="text-slate-400 font-semibold">Kecamatan</span>
                <span className="font-bold text-slate-900 col-span-2">{student.kecamatan || '-'}</span>
              </div>

              <div className="grid grid-cols-3 items-baseline gap-2 border-b border-slate-50 pb-2.5">
                <span className="text-slate-400 font-semibold">Desa / Kelurahan</span>
                <span className="font-bold text-slate-900 col-span-2">{student.desa_kelurahan || student.desa || '-'}</span>
              </div>

              <div className="grid grid-cols-3 items-baseline gap-2 border-b border-slate-50 pb-2.5">
                <span className="text-slate-400 font-semibold">Alamat Jalan & RT/RW</span>
                <span className="font-bold text-slate-900 col-span-2 leading-relaxed">
                  {student.alamat_jalan || student.alamatJalan || '-'} {student.rt ? `RT ${student.rt}` : ''} {student.rw ? `RW ${student.rw}` : ''}
                </span>
              </div>

              <div className="grid grid-cols-3 items-baseline gap-2">
                <span className="text-slate-400 font-semibold">Kode Wilayah / Dagri</span>
                <span className="font-mono text-slate-700 col-span-2">
                  {student.kode_wilayah || student.kode_dagri || '-'}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center gap-3 text-xs text-slate-400">
            <span className="bg-slate-100 px-3 py-1 rounded-lg font-mono font-bold text-slate-700">Lat: {student.lintang || student.latitude || '-'}</span>
            <span className="bg-slate-100 px-3 py-1 rounded-lg font-mono font-bold text-slate-700">Lng: {student.bujur || student.longitude || '-'}</span>
          </div>
        </div>

        {/* PANEL KANAN: MAP WEBGIS LEAFLET / INFORMASI DATA BELUM TERSEDIA */}
        {hasCoordinates ? (
          <div className="relative min-h-[380px] h-full rounded-3xl overflow-hidden border border-slate-200 shadow-sm">
            <MapErrorBoundary>
              <MapContainer 
                key={`${student.id || 'ats'}-${mapCenter[0]}-${mapCenter[1]}`}
                center={mapCenter} 
                zoom={15} 
                scrollWheelZoom={false}
                className="w-full h-full min-h-[380px]"
                style={{ height: '100%', width: '100%' }}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                
                <Marker position={mapCenter} icon={createCustomIcon()}>
                  <Popup>
                    <div className="text-xs p-1">
                      <p className="font-bold text-slate-900">{student.nama}</p>
                      <p className="text-slate-500 mt-0.5">{student.alamat_jalan || student.alamatJalan || '-'}</p>
                      <p className="text-blue-700 font-bold mt-1">{student.kabupaten || 'Sulawesi Tengah'}</p>
                    </div>
                  </Popup>
                </Marker>

                <ChangeMapView center={mapCenter} zoom={15} />
              </MapContainer>
            </MapErrorBoundary>
            
            <div className="absolute top-3 right-3 z-10 bg-white/95 backdrop-blur-sm px-3.5 py-1.5 rounded-full text-[10px] font-bold border border-blue-100 shadow-sm uppercase tracking-wide flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-blue-800">
                Koordinat Presisi ({rawLat.toFixed(4)}, {rawLng.toFixed(4)})
              </span>
            </div>
          </div>
        ) : (
          <div className="min-h-[380px] h-full rounded-3xl border-2 border-dashed border-slate-200 bg-slate-50/70 p-8 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-3xl bg-slate-100 border border-slate-200 text-slate-400 flex items-center justify-center mb-4 shadow-inner">
              <MapPinOff size={28} />
            </div>
            <h4 className="text-sm font-bold text-slate-700 font-display">Data Koordinat Peta Belum Tersedia</h4>
            <p className="text-xs text-slate-500 max-w-sm mt-1.5 leading-relaxed">
              Data spasial titik lintang dan bujur anak ini belum tercatat di basis data. Peta hanya dapat ditampilkan untuk data yang memiliki titik koordinat valid.
            </p>
            <div className="mt-5 p-3.5 bg-white rounded-2xl border border-slate-200/80 text-xs text-slate-600 w-full max-w-sm text-left shadow-xs">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Rujukan Wilayah Domisili</p>
              <p className="font-semibold text-slate-800">
                {student.kabupaten || 'Kabupaten -'}, Kec. {student.kecamatan || '-'}
              </p>
              <p className="text-slate-500 text-[11px] mt-0.5">
                Desa/Kelurahan: {student.desa_kelurahan || student.desa || '-'}
              </p>
            </div>
          </div>
        )}

      </div>

      {/* ============================================================ */}
      {/* 3. CARD TINDAK LANJUT (HASIL TINDAK LANJUT / FORMULIR INPUT) */}
      {/* ============================================================ */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        
        {/* Header Card Tindak Lanjut */}
        <div className="p-6 sm:p-8 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-50 to-white">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm font-bold ${
              isHandled ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-700'
            }`}>
              {isHandled ? <CheckCircle2 size={20} /> : <Briefcase size={20} />}
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800 font-display">
                {isHandled ? 'Hasil Tindak Lanjut & Intervensi Lapangan' : 'Formulir Tindak Lanjut Lapangan'}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isHandled ? (
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-xs">
                <CheckCircle2 size={13} /> Sudah Ditindaklanjuti
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                <Clock size={13} /> Belum Ditindaklanjuti
              </span>
            )}
          </div>
        </div>

        <div className="p-6 sm:p-8 space-y-8">
          
          {/* TAMPILAN 1: JIKA ATS SUDAH DITINDAKLANJUTI -> TAMPILKAN HASIL DENGAN LAYOUT RAPI & TERSTRUKTUR */}
          {isHandled ? (
            <div className="space-y-6">
              {tindakLanjutList.map((item, idx) => {
                const tgl = item.tanggal_tindak_lanjut || item.created_at;
                const backendBase = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:8000';
                const docUrl = item.dokumen_pendukung_path ? `${backendBase}/storage/${item.dokumen_pendukung_path}` : null;
                const docName = item.dokumen_pendukung_path ? item.dokumen_pendukung_path.split('/').pop() : (item.dokumenName || 'Berkas Dokumen');
                const photoUrl = item.foto_dokumentasi_path ? `${backendBase}/storage/${item.foto_dokumentasi_path}` : (item.fotoUrl || null);

                return (
                  <div key={item.id || idx} className="bg-slate-50/60 rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-2xs space-y-6">
                                       {/* Baris 1: 2 Kartu Metrik Utama (Full Width Grid) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      
                      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-2xs flex items-center gap-3.5">
                        <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center flex-shrink-0">
                          <CheckCircle2 size={20} />
                        </div>
                        <div className="min-w-0">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Status Intervensi</span>
                          <p className="text-xs font-extrabold text-slate-800 capitalize truncate mt-0.5" title={item.keterangan}>
                            {item.keterangan || 'Sudah Ditindaklanjuti'}
                          </p>
                        </div>
                      </div>

                      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-2xs flex items-center gap-3.5">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center flex-shrink-0">
                          <Calendar size={20} />
                        </div>
                        <div className="min-w-0">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Tanggal Pelaksanaan</span>
                          <p className="text-xs font-bold text-slate-800 truncate mt-0.5">
                            {formatDateIndo(tgl)}
                          </p>
                        </div>
                      </div>

                    </div>

                    {/* Baris 2: Grid 2 Kolom (Kolom Kiri: Catatan & Dokumen | Kolom Kanan: Foto Dokumentasi) */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                      
                      {/* Kolom Kiri (7/12): Catatan Hasil & Lampiran Dokumen */}
                      <div className="lg:col-span-7 flex flex-col justify-between gap-4">
                        
                        {/* Box Catatan Hasil Kunjungan */}
                        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs flex-1 flex flex-col">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-2.5">
                            <FileText size={13} className="text-blue-600" /> Catatan & Rincian Hasil Lapangan
                          </span>
                          <div className="bg-slate-50/70 p-3.5 rounded-xl border border-slate-100 flex-1">
                            <p className="text-xs text-slate-700 leading-relaxed font-medium">
                              {item.alasan || 'Tidak ada catatan rincian tambahan.'}
                            </p>
                          </div>
                        </div>

                        {/* Box Berkas / Dokumen Pendukung */}
                        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                            Dokumen / Surat Pendukung
                          </span>
                          {docUrl || item.dokumenName ? (
                            <div className="flex items-center justify-between gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center flex-shrink-0">
                                  <FileCheck size={16} />
                                </div>
                                <div className="min-w-0">
                                  <p className="text-xs font-bold text-slate-800 truncate" title={docName}>{docName}</p>
                                  <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-0.5">
                                    <Check size={10} /> Berkas Terlampir
                                  </span>
                                </div>
                              </div>
                              {docUrl && (
                                <a
                                  href={docUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold rounded-lg shadow-sm transition-colors cursor-pointer flex-shrink-0"
                                >
                                  <Download size={12} /> Unduh
                                </a>
                              )}
                            </div>
                          ) : (
                            <div className="p-3 bg-slate-50/70 rounded-xl border border-dashed border-slate-200 text-center text-xs text-slate-400">
                              Tidak ada berkas dokumen yang dilampirkan.
                            </div>
                          )}
                        </div>

                      </div>

                      {/* Kolom Kanan (5/12): Foto Bukti Lapangan */}
                      <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col justify-between min-h-[260px]">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-2.5">
                          <ImageIcon size={13} className="text-emerald-600" /> Foto Dokumentasi Kunjungan
                        </span>
                        
                        {photoUrl ? (
                          <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-50 flex-1 flex items-center justify-center group min-h-[190px]">
                            <img
                              src={photoUrl}
                              alt="Dokumentasi Kunjungan"
                              className="w-full h-full max-h-[220px] object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                            <a
                              href={photoUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="absolute inset-0 bg-slate-900/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold gap-1.5"
                            >
                              <ExternalLink size={14} /> Buka Foto Ukuran Penuh
                            </a>
                          </div>
                        ) : (
                          <div className="rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/70 flex-1 flex flex-col items-center justify-center p-6 text-center text-slate-400 min-h-[190px]">
                            <ImageIcon size={32} className="text-slate-300 mb-2" />
                            <p className="text-xs font-medium text-slate-500">Tidak ada foto dokumentasi</p>
                            <span className="text-[10px] text-slate-400 mt-0.5">Kunjungan belum menyertakan foto lapangan</span>
                          </div>
                        )}
                      </div>

                    </div>

                    {/* Baris 3: Bagian Kiri Bawah Card (Tombol Tambah Catatan & Hapus Berdampingan) */}
                    <div className="pt-4 border-t border-slate-200/70 flex flex-col sm:flex-row sm:items-center justify-start gap-3">
                      <button
                        type="button"
                        onClick={() => setShowNewForm(!showNewForm)}
                        className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs self-stretch sm:self-auto"
                      >
                        {showNewForm ? <ChevronUp size={15} /> : <Plus size={15} />}
                        {showNewForm ? 'Tutup Formulir Tambahan' : 'Tambah Catatan / Pembaruan'}
                      </button>

                      <button
                        type="button"
                        disabled={submitting}
                        onClick={() => handleDeleteTindakLanjut(item.id)}
                        className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs self-stretch sm:self-auto"
                        title="Hapus Data Tindak Lanjut"
                      >
                        <Trash2 size={14} />
                        Hapus Tindak Lanjut
                      </button>
                    </div>

                  </div>
                );
              })}

            </div>
          ) : null}

          {/* TAMPILAN 2: FORMULIR TINDAK LANJUT (Ditampilkan jika belum ditindaklanjuti ATAU tombol buka ditekan) */}
          {(!isHandled || showNewForm) && (
            <form onSubmit={handleSubmitTindakLanjut} className={`space-y-6 ${isHandled ? 'pt-6 border-t border-slate-200' : ''}`}>
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                  <FileCheck size={15} className="text-blue-700" /> Formulir Input Tindak Lanjut
                </h4>
                {isHandled && (
                  <span className="text-[11px] font-bold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-md border border-blue-100">
                    Mode Pembaruan / Catatan Tambahan
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Kolom Kiri: Keterangan, Tanggal & Alasan */}
                <div className="flex flex-col gap-4">
                  
                  {/* Dropdown Keterangan Status */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">
                      Keterangan Tindak Lanjut <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={keterangan}
                      onChange={(e) => setKeterangan(e.target.value)}
                      required
                      className="w-full px-4 py-3 bg-slate-50 hover:bg-slate-100/60 focus:bg-white text-xs font-semibold text-slate-700 rounded-2xl border border-slate-200 focus:border-blue-700 focus:ring-2 focus:ring-blue-700/10 outline-none transition-all cursor-pointer"
                    >
                      <option value="" disabled>-- Pilih Hasil Tindak Lanjut --</option>
                      <option value="sudah lanjut sekolah">Sudah Lanjut Sekolah</option>
                      <option value="tidak lanjut sekolah">Tidak Lanjut Sekolah</option>
                      <option value="dalam proses mediasi">Dalam Proses Mediasi & Bantuan</option>
                      <option value="pindah domisili">Pindah Domisili ke Luar Daerah</option>
                      <option value="bekerja">Bekerja / Menikah</option>
                    </select>
                  </div>

                  {/* Tanggal Pelaksanaan Kunjungan */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">
                      Tanggal Pelaksanaan Kunjungan / Mediasi
                    </label>
                    <input
                      type="date"
                      value={tanggalTindakLanjut}
                      onChange={(e) => setTanggalTindakLanjut(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 hover:bg-slate-100/60 focus:bg-white text-xs font-semibold text-slate-700 rounded-2xl border border-slate-200 focus:border-blue-700 focus:ring-2 focus:ring-blue-700/10 outline-none transition-all"
                    />
                  </div>

                  {/* Textarea Alasan */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">
                      Rincian Alasan / Hasil Kunjungan Lapangan
                    </label>
                    <textarea
                      value={alasan}
                      onChange={(e) => setAlasan(e.target.value)}
                      placeholder="Tuliskan catatan hasil mediasi dengan orang tua, kendala seragam/biaya, atau nama sekolah baru penerima..."
                      rows={4}
                      className="w-full px-4 py-3 bg-slate-50 hover:bg-slate-100/60 focus:bg-white text-xs font-medium text-slate-700 rounded-2xl border border-slate-200 focus:border-blue-700 focus:ring-2 focus:ring-blue-700/10 outline-none transition-all resize-none"
                    ></textarea>
                  </div>

                </div>

                {/* Kolom Kanan: Upload Dokumen & Foto Kunjungan (Max 10MB) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  
                  {/* Upload Dokumen Pendukung */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">
                      Dokumen / Surat Pendukung
                    </label>
                    {dokumenName ? (
                      <div className="relative rounded-2xl border border-slate-200 bg-slate-50 p-4 h-[210px] flex flex-col justify-between shadow-inner">
                        <div className="flex items-center gap-2 overflow-hidden">
                          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center flex-shrink-0">
                            <FileText size={16} />
                          </div>
                          <p className="text-xs font-bold text-slate-700 truncate">{dokumenName}</p>
                        </div>
                        <div className="flex items-center justify-between border-t border-slate-100 pt-2">
                          <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-0.5">
                            <Check size={10} /> Berkas Siap
                          </span>
                          <button
                            type="button"
                            onClick={handleRemoveDokumen}
                            className="p-1 hover:bg-slate-200 text-slate-400 hover:text-slate-600 rounded-full transition-colors cursor-pointer"
                            title="Hapus Berkas"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <label 
                        htmlFor="dokumen-upload"
                        className="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 hover:bg-slate-100/50 hover:border-blue-600/40 transition-all duration-200 h-[210px] flex flex-col items-center justify-center text-center p-3 cursor-pointer group"
                      >
                        <div className="w-9 h-9 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center mb-1.5 group-hover:scale-110 transition-transform duration-200 shadow-sm">
                          <Upload size={16} />
                        </div>
                        <span className="text-xs font-bold text-slate-700 leading-tight">Unggah Berkas</span>
                        <span className="text-[10px] text-slate-400 mt-1">PDF, DOC, DOCX, PNG</span>
                        <span className="text-[9px] text-slate-400">(Maks. 10 MB)</span>
                        <input
                          type="file"
                          id="dokumen-upload"
                          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                          onChange={handleDokumenChange}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>

                  {/* Upload Foto Dokumentasi Lapangan */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">
                      Foto Dokumentasi Kunjungan
                    </label>
                    {fotoPreview ? (
                      <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 h-[210px] flex items-center justify-center group shadow-inner">
                        <img 
                          src={fotoPreview} 
                          alt="Pratinjau Dokumentasi" 
                          className="w-full h-full object-cover" 
                        />
                        <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                          <button
                            type="button"
                            onClick={handleRemoveFoto}
                            className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-full transition-transform duration-200 hover:scale-110 shadow-lg cursor-pointer"
                            title="Hapus Foto"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <label 
                        htmlFor="foto-upload"
                        className="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 hover:bg-slate-100/50 hover:border-blue-600/40 transition-all duration-200 h-[210px] flex flex-col items-center justify-center text-center p-3 cursor-pointer group"
                      >
                        <div className="w-9 h-9 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center mb-1.5 group-hover:scale-110 transition-transform duration-200 shadow-sm">
                          <Upload size={16} />
                        </div>
                        <span className="text-xs font-bold text-slate-700 leading-tight">Unggah Foto</span>
                        <span className="text-[10px] text-slate-400 mt-1">JPG, JPEG, PNG, WEBP</span>
                        <span className="text-[9px] text-slate-400">(Maks. 10 MB)</span>
                        <input
                          type="file"
                          id="foto-upload"
                          accept="image/*"
                          onChange={handleFotoChange}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>

                </div>

              </div>

              {/* Tombol Aksi Simpan Form */}
              <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={handleResetForm}
                  className="w-full sm:w-auto px-5 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold text-xs rounded-xl transition-all cursor-pointer"
                >
                  Reset Formulir
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-600/10 transition-all cursor-pointer ${
                    submitting ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {submitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Menyimpan ke Database Backend...
                    </>
                  ) : (
                    <>
                      <Save size={15} />
                      Simpan Tindak Lanjut
                    </>
                  )}
                </button>
              </div>

            </form>
          )}

        </div>
      </div>

    </div>
  );
}
