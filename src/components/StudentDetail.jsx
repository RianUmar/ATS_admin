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
  Layers,
  CheckCircle2,
  FileCheck
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { getStudentByIdAPI, updateStudentTindakanLanjutAPI } from '../services/api';

// Sub-komponen untuk memfokuskan ulang peta saat koordinat siswa berubah
function ChangeMapView({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center && center[0] !== 0) {
      map.setView(center, 15);
    }
  }, [center, map]);
  return null;
}

// Custom Marker Icon: Ikon Pinpoint Rumah berwarna Biru dengan Animasi Pulsating
const createCustomIcon = () => {
  return new L.divIcon({
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

export default function StudentDetail({ id, onBack, onSaveSuccess }) {
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // State Form Tindakan Lanjut (Skema Terupdate)
  const [keterangan, setKeterangan] = useState('');
  const [alasan, setAlasan] = useState('');
  
  // State File Dokumen Pendukung & Foto Kunjungan
  const [dokumenFile, setDokumenFile] = useState(null);
  const [dokumenName, setDokumenName] = useState('');
  const [fotoFile, setFotoFile] = useState(null);
  const [fotoPreview, setFotoPreview] = useState('');
  
  // State UI
  const [submitting, setSubmitting] = useState(false);
  const [alertMsg, setAlertMsg] = useState(null); // { type: 'success' | 'error', text: '' }

  // Load Data Siswa
  useEffect(() => {
    setLoading(true);
    // Mensimulasikan delay API (400ms) untuk efek loading yang premium
    const timer = setTimeout(() => {
      getStudentByIdAPI(id)
        .then(response => {
          if (response.data) {
            setStudent(response.data);
            // Pre-fill form jika sudah ada tindakan lanjut sebelumnya
            if (response.data.tindakanLanjut) {
              setKeterangan(response.data.tindakanLanjut.keterangan || '');
              setAlasan(response.data.tindakanLanjut.alasan || '');
              setDokumenName(response.data.tindakanLanjut.dokumenName || '');
              setFotoPreview(response.data.tindakanLanjut.fotoUrl || '');
            } else {
              setKeterangan('');
              setAlasan('');
              setDokumenName('');
              setFotoPreview('');
            }
          } else {
            setAlertMsg({ type: 'error', text: 'Data siswa tidak ditemukan!' });
          }
          setLoading(false);
        })
        .catch(err => {
          console.error(err);
          setAlertMsg({ type: 'error', text: 'Gagal mengambil data dari server.' });
          setLoading(false);
        });
    }, 400);

    return () => clearTimeout(timer);
  }, [id]);

  // Handle Upload Dokumen Surat Pendukung
  const handleDokumenChange = (e) => {
    const file = e.target.files[0];
    if (file) {
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

  // Handle Upload Foto Dokumentasi Kunjungan
  const handleFotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
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

  // Submit Form Tindakan Lanjut
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!keterangan || !alasan) {
      setAlertMsg({ type: 'error', text: 'Mohon lengkapi kolom Keterangan dan Alasan!' });
      return;
    }

    setSubmitting(true);
    
    // Simulasi pengiriman data ke backend
    setTimeout(() => {
      const dataTindakan = {
        keterangan,
        alasan,
        dokumenName: dokumenName || 'surat_pendukung_ats.pdf',
        fotoUrl: fotoPreview || 'https://images.unsplash.com/photo-1577896851231-70ef18881754?w=600&auto=format&fit=crop&q=60'
      };

      // Simulasikan penanganan file fisik di server real
      if (dokumenFile) {
        console.log(`[Mock API] Mengunggah dokumen surat pendukung: ${dokumenFile.name} (${(dokumenFile.size / 1024).toFixed(1)} KB)`);
      }
      if (fotoFile) {
        console.log(`[Mock API] Mengunggah foto dokumentasi kunjungan: ${fotoFile.name} (${(fotoFile.size / 1024).toFixed(1)} KB)`);
      }

      updateStudentTindakanLanjutAPI(id, dataTindakan)
        .then(response => {
          setSubmitting(false);
          setAlertMsg({ type: 'success', text: 'Data Tindakan Lanjut berhasil disimpan!' });
          
          // Refresh data siswa lokal
          if (response.data) {
            setStudent(response.data);
          }
          
          // Trigger refresh di dashboard utama
          if (onSaveSuccess) {
            setTimeout(() => onSaveSuccess(), 1200);
          }
        })
        .catch(err => {
          console.error(err);
          setSubmitting(false);
          setAlertMsg({ type: 'error', text: 'Gagal menyimpan data tindakan lanjut.' });
        });
    }, 800);
  };

  // Reset form kembali ke kondisi semula
  const handleResetForm = () => {
    if (student && student.tindakanLanjut) {
      setKeterangan(student.tindakanLanjut.keterangan || '');
      setAlasan(student.tindakanLanjut.alasan || '');
      setDokumenName(student.tindakanLanjut.dokumenName || '');
      setFotoPreview(student.tindakanLanjut.fotoUrl || '');
    } else {
      setKeterangan('');
      setAlasan('');
      setDokumenName('');
      setFotoPreview('');
    }
    setDokumenFile(null);
    setFotoFile(null);
    setAlertMsg(null);
  };

  // Loading Screen Skeleton
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
        <p className="text-slate-500 mt-2">Data siswa dengan ID tersebut tidak berada di sistem.</p>
        <button 
          onClick={onBack} 
          className="mt-6 px-5 py-2.5 bg-[#1C40AC] text-white text-sm font-semibold rounded-xl hover:bg-[#15328c] transition-all cursor-pointer"
        >
          Kembali ke Dashboard
        </button>
      </div>
    );
  }

  const mapCenter = [student.latitude || -0.9482, student.longitude || 122.7885];
  const hasTindakan = student.tindakanLanjut !== null;
  const statusTindakLanjutLabel = hasTindakan ? 'sudah di tindak lanjut' : 'Belum Ditindaklanjuti';

  return (
    <div className="w-full flex flex-col gap-8 transition-all duration-300">
      
      {/* Tombol Back & Breadcrumbs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
          <span className="cursor-pointer hover:text-[#1C40AC] transition-colors" onClick={onBack}>Dashboard</span>
          <span>/</span>
          <span className="text-slate-600">Detail Anak Tidak Sekolah</span>
        </div>
        
        <button 
          onClick={onBack}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 text-sm font-bold rounded-xl border border-slate-200 shadow-sm transition-all duration-200 cursor-pointer w-fit"
        >
          <ArrowLeft size={16} />
          Kembali ke Tabel
        </button>
      </div>

      {/* Header Profil Siswa */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative overflow-hidden">
        {/* Glow hiasan */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
        
        <div className="flex items-center gap-4 sm:gap-6 relative z-10">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-blue-700 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-700/20">
            <User size={32} className="sm:hidden" />
            <User size={40} className="hidden sm:block" />
          </div>
          <div>
            <div className="flex items-center flex-wrap gap-2.5">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-800 font-display tracking-tight leading-none">
                {student.nama}
              </h2>
              {student.status === 'DO' ? (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-red-50 text-red-600 border border-red-100">
                  Drop Out (DO)
                </span>
              ) : (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-orange-50 text-orange-600 border border-orange-100">
                  LTM (Lulus Tidak Melanjutkan)
                </span>
              )}
            </div>
            <p className="text-sm font-mono text-slate-500 mt-2 font-semibold flex items-center gap-1.5">
              <FileText size={14} className="text-slate-400" />
              NIK: <span className="text-slate-800">{student.nik}</span>
            </p>
          </div>
        </div>

        {/* Indikator Status Tindakan */}
        <div className="relative z-10 flex items-center gap-3 bg-slate-50 px-5 py-4 rounded-2xl border border-slate-100">
          <div className={`w-3.5 h-3.5 rounded-full ${hasTindakan ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`}></div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Status Tindakan</p>
            <p className={`text-sm font-extrabold mt-0.5 ${hasTindakan ? 'text-emerald-700 font-display' : 'text-amber-600'}`}>
              {statusTindakLanjutLabel}
            </p>
          </div>
        </div>
      </div>

      {/* Alert Banner / Toast Notification */}
      {alertMsg && (
        <div className={`p-4 rounded-2xl text-sm flex items-start justify-between shadow-sm border ${
          alertMsg.type === 'success' 
            ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
            : 'bg-red-50 text-red-800 border-red-200'
        }`}>
          <div className="flex items-center gap-2.5 font-medium">
            {alertMsg.type === 'success' ? <Check className="w-5 h-5 text-emerald-600 flex-shrink-0" /> : <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />}
            <span>{alertMsg.text}</span>
          </div>
          <button onClick={() => setAlertMsg(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
            <X size={16} />
          </button>
        </div>
      )}

      {/* KARTU BIODATA (BAGIAN ATAS) */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 sm:p-8 border-b border-slate-100 flex items-center gap-3 bg-gradient-to-r from-slate-50 to-white">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center shadow-sm">
            <Sparkles size={20} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-800 font-display">Biodata Anak</h3>
            <p className="text-xs text-slate-400 mt-0.5">Rincian identitas diri dan informasi status sekolah asal</p>
          </div>
        </div>
        
        <div className="p-6 sm:p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          
          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <User size={12} className="text-slate-300" /> Nama Lengkap
            </span>
            <span className="text-base font-bold text-slate-800">{student.nama}</span>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <GraduationCap size={12} className="text-slate-300" /> NISN
            </span>
            <span className="text-base font-mono font-bold text-slate-800">{student.nisn || '-'}</span>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Calendar size={12} className="text-slate-300" /> Tanggal Lahir
            </span>
            <span className="text-base font-bold text-slate-800">{student.tanggalLahir}</span>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <FileText size={12} className="text-slate-300" /> NIK
            </span>
            <span className="text-base font-mono font-bold text-slate-800">{student.nik}</span>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <User size={12} className="text-slate-300" /> Jenis Kelamin
            </span>
            <span className="text-base font-bold text-slate-800">{student.jk}</span>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Briefcase size={12} className="text-slate-300" /> ID Sekolah Asal
            </span>
            <span className="text-base font-bold text-slate-800">{student.idSekolah || '-'}</span>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Layers size={12} className="text-slate-300" /> Kelas Terakhir
            </span>
            <span className="text-base font-bold text-slate-800">Kelas {student.kelas || '-'}</span>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle2 size={12} className="text-slate-300" /> Status Keaktifan
            </span>
            <span className="text-base font-bold text-slate-800">
              {student.status === 'DO' ? 'Putus Sekolah (Drop Out)' : 'Lulus Tidak Melanjutkan'}
            </span>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <FileCheck size={12} className="text-slate-300" /> Status Tindak Lanjut
            </span>
            <span className={`text-base font-bold px-3 py-0.5 rounded-lg border w-fit leading-relaxed uppercase text-[10px] ${
              hasTindakan 
                ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                : 'bg-amber-50 text-amber-600 border-amber-100'
            }`}>
              {statusTindakLanjutLabel}
            </span>
          </div>

          <div className="flex flex-col gap-1 lg:col-span-3 border-t border-slate-50 pt-4">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <AlertTriangle size={12} className="text-slate-300" /> Keterangan / Penyebab
            </span>
            <span className="text-sm font-bold text-slate-700 mt-1 leading-relaxed block bg-slate-50 p-3.5 rounded-xl border border-slate-100">
              {student.keterangan || '-'}
            </span>
          </div>

        </div>
      </div>

      {/* KARTU ALAMAT & PEMETAAN (GIS MAP CARD) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        
        {/* PANEL KIRI: DETAIL TEKS ALAMAT */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-between min-h-[380px] h-full">
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center shadow-sm">
                <MapPin size={20} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800 font-display">Informasi Alamat</h3>
                <p className="text-xs text-slate-400">Lokasi domisili anak secara administratif</p>
              </div>
            </div>

            {/* List Detail Alamat */}
            <div className="space-y-4 sm:space-y-5">
              <div className="grid grid-cols-3 items-baseline gap-4 border-b border-slate-50 pb-3">
                <span className="text-sm font-normal text-slate-400">Kabupaten / Kota</span>
                <span className="text-sm font-bold text-slate-900 col-span-2">{student.kabupaten}</span>
              </div>
              
              <div className="grid grid-cols-3 items-baseline gap-4 border-b border-slate-50 pb-3">
                <span className="text-sm font-normal text-slate-400">Kecamatan</span>
                <span className="text-sm font-bold text-slate-900 col-span-2">{student.kecamatan}</span>
              </div>

              <div className="grid grid-cols-3 items-baseline gap-4 border-b border-slate-50 pb-3">
                <span className="text-sm font-normal text-slate-400">Desa / Kelurahan</span>
                <span className="text-sm font-bold text-slate-900 col-span-2">{student.desa}</span>
              </div>

              <div className="grid grid-cols-3 items-baseline gap-4">
                <span className="text-sm font-normal text-slate-400">Alamat Jalan</span>
                <span className="text-sm font-bold text-slate-900 col-span-2 leading-relaxed">{student.alamatJalan}</span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center gap-3 text-xs text-slate-400">
            <span className="bg-slate-100 px-2.5 py-1 rounded-md font-mono font-semibold text-slate-600">Lat: {student.latitude}</span>
            <span className="bg-slate-100 px-2.5 py-1 rounded-md font-mono font-semibold text-slate-600">Lng: {student.longitude}</span>
          </div>
        </div>

        {/* PANEL KANAN: MAP WEBGIS */}
        <div className="relative min-h-[380px] h-full rounded-3xl overflow-hidden border border-slate-200/60 shadow-sm">
          <MapContainer 
            center={mapCenter} 
            zoom={15} 
            scrollWheelZoom={false}
            className="w-full h-full min-h-[380px]"
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              opacity={0.8}
            />
            
            <Marker position={mapCenter} icon={createCustomIcon()}>
              <Popup>
                <div className="text-xs p-1">
                  <p className="font-bold text-slate-800">{student.nama}</p>
                  <p className="text-slate-500 mt-0.5">{student.alamatJalan}</p>
                  <p className="text-[#1C40AC] font-semibold mt-1">{student.kabupaten}</p>
                </div>
              </Popup>
            </Marker>

            <ChangeMapView center={mapCenter} />
          </MapContainer>
          
          <div className="absolute top-3 right-3 z-10 bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-full text-[10px] font-bold text-[#1C40AC] border border-blue-100 shadow-sm tracking-wide uppercase">
            WebGIS Sulawesi Tengah
          </div>
        </div>

      </div>

      {/* KARTU TINDAKAN LANJUT (BAGIAN BAWAH) */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 sm:p-8 border-b border-slate-100 flex items-center gap-3 bg-gradient-to-r from-slate-50 to-white">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center shadow-sm">
            <Briefcase size={20} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-800 font-display">Tindakan Lanjut Admin</h3>
            <p className="text-xs text-slate-400 mt-0.5">Formulir intervensi lapangan untuk penuntasan anak putus sekolah</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* SISI KIRI FORM: KETERANGAN DROPDOWN & ALASAN TEXTAREA */}
            <div className="flex flex-col gap-5">
              
              {/* Dropdown Keterangan (Paling Atas) */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                  Keterangan Status <span className="text-red-500">*</span>
                </label>
                <select
                  value={keterangan}
                  onChange={(e) => setKeterangan(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-slate-50 hover:bg-slate-100/50 focus:bg-white text-sm text-slate-700 rounded-xl border border-slate-200 focus:border-[#1C40AC] focus:ring-2 focus:ring-[#1C40AC]/10 outline-none transition-all duration-200 cursor-pointer"
                >
                  <option value="" disabled>-- Pilih Keterangan Status --</option>
                  <option value="tidak lanjut sekolah">Tidak lanjut sekolah</option>
                  <option value="sudah lanjut sekolah">Sudah lanjut sekolah</option>
                </select>
              </div>

              {/* Textarea Alasan (Di Bawah Keterangan) */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                  Alasan <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={alasan}
                  onChange={(e) => setAlasan(e.target.value)}
                  required
                  placeholder="Masukkan alasan dilaksanakannya tindakan / hasil mediasi lapangan..."
                  rows={4}
                  className="w-full px-4 py-3 bg-slate-50 hover:bg-slate-100/50 focus:bg-white text-sm text-slate-700 rounded-xl border border-slate-200 focus:border-[#1C40AC] focus:ring-2 focus:ring-[#1C40AC]/10 outline-none transition-all duration-200 resize-none h-[115px]"
                ></textarea>
              </div>

            </div>

            {/* SISI KANAN FORM: UPLOAD DOKUMEN & FOTO DOKUMENTASI */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Form Upload Dokumen / Surat Pendukung */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                  Surat Pendukung / Dokumen
                </label>
                {dokumenName ? (
                  <div className="relative rounded-2xl border border-slate-200 bg-slate-50 p-4 h-[190px] flex flex-col justify-between shadow-inner">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center flex-shrink-0">
                        <FileText size={16} />
                      </div>
                      <p className="text-xs font-bold text-slate-700 truncate">{dokumenName}</p>
                    </div>
                    <div className="flex items-center justify-between border-t border-slate-100 pt-2">
                      <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-0.5">
                        <Check size={10} /> Siap
                      </span>
                      <button
                        type="button"
                        onClick={handleRemoveDokumen}
                        className="p-1 hover:bg-slate-200 text-slate-400 hover:text-slate-600 rounded-full transition-colors cursor-pointer"
                        title="Hapus Dokumen"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <label 
                    htmlFor="dokumen-upload"
                    className="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 hover:bg-slate-100/50 hover:border-[#1C40AC]/40 transition-all duration-200 h-[190px] flex flex-col items-center justify-center text-center p-3 cursor-pointer group"
                  >
                    <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-1.5 group-hover:scale-110 transition-transform duration-200">
                      <Upload size={16} />
                    </div>
                    <span className="text-[11px] font-bold text-slate-700 leading-none">Dokumen / Surat</span>
                    <span className="text-[9px] text-slate-400 mt-1.5">PDF, DOC atau DOCX</span>
                    <span className="text-[9px] text-slate-400">(Maks. 5MB)</span>
                    <input
                      type="file"
                      id="dokumen-upload"
                      accept=".pdf,.doc,.docx"
                      onChange={handleDokumenChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              {/* Form Upload Foto Dokumentasi Kunjungan */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                  Foto Dokumentasi Kunjungan
                </label>
                {fotoPreview ? (
                  <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 h-[190px] flex items-center justify-center group shadow-inner">
                    <img 
                      src={fotoPreview} 
                      alt="Pratinjau Foto" 
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
                    className="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 hover:bg-slate-100/50 hover:border-[#1C40AC]/40 transition-all duration-200 h-[190px] flex flex-col items-center justify-center text-center p-3 cursor-pointer group"
                  >
                    <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-1.5 group-hover:scale-110 transition-transform duration-200">
                      <Upload size={16} />
                    </div>
                    <span className="text-[11px] font-bold text-slate-700 leading-none">Foto Kunjungan</span>
                    <span className="text-[9px] text-slate-400 mt-1.5">PNG, JPG atau JPEG</span>
                    <span className="text-[9px] text-slate-400">(Maks. 2MB)</span>
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

          {/* BUTTON ACTIONS */}
          <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-end gap-3.5">
            <button
              type="button"
              onClick={handleResetForm}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 border border-red-200 bg-red-50 hover:bg-red-100 text-red-600 font-bold text-sm rounded-xl transition-all duration-200 cursor-pointer"
            >
              <X size={16} />
              Batal / Reset
            </button>

            <button
              type="submit"
              disabled={submitting}
              className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl shadow-md shadow-emerald-600/10 transition-all duration-200 cursor-pointer ${
                submitting ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Menyimpan...
                </>
              ) : (
                <>
                  <Save size={16} />
                  Simpan Tindakan
                </>
              )}
            </button>
          </div>

        </form>
      </div>

    </div>
  );
}
