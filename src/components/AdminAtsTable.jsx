import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Search, Eye, CheckCircle2, Clock, User, FileText, ChevronLeft, ChevronRight, X, Loader2, Filter } from 'lucide-react';

const SULTENG_KABUPATEN = [
  'Kota Palu',
  'Kab. Banggai',
  'Kab. Banggai Kepulauan',
  'Kab. Banggai Laut',
  'Kab. Buol',
  'Kab. Donggala',
  'Kab. Morowali',
  'Kab. Morowali Utara',
  'Kab. Parigi Moutong',
  'Kab. Poso',
  'Kab. Sigi',
  'Kab. Tojo Una-Una',
  'Kab. Tolitoli'
];

export default function AdminAtsTable({ 
  data = [], 
  loading = false,
  onDetailClick,
  pagination = null,
  onPageChange = null,
  onFilterChange = null
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedKabupaten, setSelectedKabupaten] = useState('');
  const [selectedKecamatan, setSelectedKecamatan] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const isFirstMount = useRef(true);

  const handleDetail = (item) => {
    if (onDetailClick) {
      onDetailClick(item.id, item);
    }
  };

  // Debounced filter trigger agar tidak unmount input saat mengetik
  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }

    const timer = setTimeout(() => {
      if (onFilterChange) {
        onFilterChange({
          search: searchTerm.trim(),
          kabupaten: selectedKabupaten,
          kecamatan: selectedKecamatan,
          status: selectedStatus
        });
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [searchTerm, selectedKabupaten, selectedKecamatan, selectedStatus]);

  // Ekstraksi daftar kecamatan unik berdasarkan data yang ada
  const listKecamatan = useMemo(() => {
    const filtered = selectedKabupaten 
      ? data.filter(item => item.kabupaten === selectedKabupaten)
      : data;
    const kecs = filtered
      .map(item => item.kecamatan)
      .filter(Boolean);
    return [...new Set(kecs)];
  }, [data, selectedKabupaten]);

  const handleKabupatenChange = (e) => {
    setSelectedKabupaten(e.target.value);
    setSelectedKecamatan('');
  };

  const handleKecamatanChange = (e) => {
    setSelectedKecamatan(e.target.value);
  };

  const handleStatusChange = (e) => {
    setSelectedStatus(e.target.value);
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    if (onFilterChange) {
      onFilterChange({
        search: '',
        kabupaten: selectedKabupaten,
        kecamatan: selectedKecamatan,
        status: selectedStatus
      });
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (onFilterChange) {
      onFilterChange({
        search: searchTerm.trim(),
        kabupaten: selectedKabupaten,
        kecamatan: selectedKecamatan,
        status: selectedStatus
      });
    }
  };

  // Helper formatting jenis kelamin
  const getJkLabel = (jk) => {
    if (!jk) return '-';
    if (jk.toUpperCase() === 'L' || jk.toLowerCase().includes('laki')) return 'Laki-laki';
    if (jk.toUpperCase() === 'P' || jk.toLowerCase().includes('perempuan')) return 'Perempuan';
    return jk;
  };

  // Helper status tindak lanjut
  const hasTindakLanjut = (item) => {
    if (item.tindakanLanjut) return true;
    if (item.tindak_lanjuts && Array.isArray(item.tindak_lanjuts) && item.tindak_lanjuts.length > 0) return true;
    return false;
  };

  return (
    <div className="w-full bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden relative">
      
      {/* Header Tabel & Filter */}
      <div className="p-6 border-b border-slate-100 flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4 bg-gradient-to-r from-slate-50/70 to-white">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
              <FileText size={18} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800 font-display">Tabel Data Anak Tidak Sekolah (ATS)</h2>
              <p className="text-xs text-slate-500">Provinsi Sulawesi Tengah</p>
            </div>
          </div>
        </div>
        
        {/* Kontrol Filter & Search */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-wrap">
          
          {/* Form Pencarian (Tetap Terfokus saat Mengetik) */}
          <form onSubmit={handleSearchSubmit} className="relative flex items-center min-w-[240px]">
            <input
              type="text"
              placeholder="Cari Nama / NIK / NISN..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="w-full pl-4 pr-16 py-2 bg-slate-50 hover:bg-slate-100/75 focus:bg-white text-xs text-slate-700 rounded-full border border-slate-200 focus:border-blue-700 focus:ring-2 focus:ring-blue-700/10 outline-none transition-all duration-200"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="absolute right-9 p-1 text-slate-400 hover:text-slate-600 rounded-full cursor-pointer"
                title="Hapus pencarian"
              >
                <X size={13} />
              </button>
            )}
            <button
              type="submit"
              className="absolute right-1 top-1 bottom-1 w-7 h-7 rounded-full bg-blue-700 hover:bg-blue-800 flex items-center justify-center text-white cursor-pointer shadow-sm transition-colors"
              title="Cari Data"
            >
              {loading ? <Loader2 size={13} className="animate-spin" /> : <Search size={13} />}
            </button>
          </form>

          {/* Tombol Filter Kategori (Membuka Panel Dropdown) */}
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className={`inline-flex items-center gap-1.5 px-4.5 py-2 text-xs font-bold rounded-full border transition-all cursor-pointer ${
              showFilters 
                ? 'bg-blue-50 text-blue-700 border-blue-200 shadow-2xs' 
                : 'bg-white hover:bg-slate-50 text-slate-600 border-slate-200'
            }`}
          >
            <Filter size={13} />
            <span>Filter Kategori</span>
            {(selectedKabupaten || selectedKecamatan || selectedStatus) && (
              <span className="w-2 h-2 rounded-full bg-blue-700 inline-block ml-1"></span>
            )}
          </button>

        </div>
      </div>

      {/* Panel Dropdown Filter Bertingkat Collapsible */}
      {showFilters && (
        <div className="px-6 py-4.5 bg-slate-50/60 border-b border-slate-100 flex flex-wrap items-center gap-4 animate-fadeIn">
          
          {/* Dropdown Kabupaten */}
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Kabupaten / Kota</span>
            <select
              value={selectedKabupaten}
              onChange={handleKabupatenChange}
              className="px-3 py-2 bg-white text-xs font-semibold text-slate-700 rounded-xl border border-slate-200 focus:border-blue-700 outline-none transition-all cursor-pointer min-w-[170px]"
            >
              <option value="">Semua Kab / Kota ({SULTENG_KABUPATEN.length})</option>
              {SULTENG_KABUPATEN.map((kab, index) => (
                <option key={index} value={kab}>{kab}</option>
              ))}
            </select>
          </div>

          {/* Dropdown Kecamatan */}
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Kecamatan</span>
            <select
              value={selectedKecamatan}
              onChange={handleKecamatanChange}
              className="px-3 py-2 bg-white text-xs font-semibold text-slate-700 rounded-xl border border-slate-200 focus:border-blue-700 outline-none transition-all cursor-pointer min-w-[170px]"
            >
              <option value="">Semua Kecamatan</option>
              {listKecamatan.map((kec, index) => (
                <option key={index} value={kec}>{kec}</option>
              ))}
            </select>
          </div>

          {/* Dropdown Status ATS */}
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Status ATS</span>
            <select
              value={selectedStatus}
              onChange={handleStatusChange}
              className="px-3 py-2 bg-white text-xs font-semibold text-slate-700 rounded-xl border border-slate-200 focus:border-blue-700 outline-none transition-all cursor-pointer min-w-[170px]"
            >
              <option value="">Semua Status ATS</option>
              <option value="DO">Drop Out (DO)</option>
              <option value="LTM">Lulus Tidak Melanjutkan (LTM)</option>
            </select>
          </div>

          {/* Reset Button */}
          {(selectedKabupaten || selectedKecamatan || selectedStatus) && (
            <button
              type="button"
              onClick={() => {
                setSelectedKabupaten('');
                setSelectedKecamatan('');
                setSelectedStatus('');
              }}
              className="self-end px-3 py-2 text-xs font-bold text-slate-500 hover:text-blue-750 transition-colors cursor-pointer"
            >
              Reset Filter
            </button>
          )}

        </div>
      )}

      {/* Tabel Data ATS */}
      <div className="w-full overflow-auto max-h-[600px] relative min-h-[300px]">
        {loading && (
          <div className="absolute inset-0 bg-white/70 backdrop-blur-[1px] z-20 flex flex-col items-center justify-center gap-2">
            <div className="w-8 h-8 border-3 border-blue-700 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-xs font-bold text-slate-600">Menyaring Data...</span>
          </div>
        )}

        <table className="w-full text-left border-collapse">
          <thead className="sticky top-0 z-10 bg-slate-100 shadow-2xs">
            <tr className="border-b-2 border-slate-200/80 bg-slate-100 text-slate-700">
              <th className="sticky top-0 z-10 bg-slate-100/95 backdrop-blur-xs px-6 py-4 text-[10px] font-extrabold uppercase tracking-wider text-slate-700 border-b border-slate-200">Nama & NISN</th>
              <th className="sticky top-0 z-10 bg-slate-100/95 backdrop-blur-xs px-6 py-4 text-[10px] font-extrabold uppercase tracking-wider text-slate-700 border-b border-slate-200">NIK (Utuh)</th>
              <th className="sticky top-0 z-10 bg-slate-100/95 backdrop-blur-xs px-6 py-4 text-[10px] font-extrabold uppercase tracking-wider text-slate-700 border-b border-slate-200">Jenis Kelamin</th>
              <th className="sticky top-0 z-10 bg-slate-100/95 backdrop-blur-xs px-6 py-4 text-[10px] font-extrabold uppercase tracking-wider text-slate-700 border-b border-slate-200">Domisili Wilayah</th>
              <th className="sticky top-0 z-10 bg-slate-100/95 backdrop-blur-xs px-6 py-4 text-[10px] font-extrabold uppercase tracking-wider text-slate-700 text-center border-b border-slate-200">Status ATS</th>
              <th className="sticky top-0 z-10 bg-slate-100/95 backdrop-blur-xs px-6 py-4 text-[10px] font-extrabold uppercase tracking-wider text-slate-700 text-center border-b border-slate-200">Tindak Lanjut</th>
              <th className="sticky top-0 z-10 bg-slate-100/95 backdrop-blur-xs px-6 py-4 text-[10px] font-extrabold uppercase tracking-wider text-slate-700 text-center border-b border-slate-200">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.length > 0 ? (
              data.map((item, index) => {
                const isHandled = hasTindakLanjut(item);
                const jkLabel = getJkLabel(item.jenis_kelamin || item.jk);
                const desa = item.desa_kelurahan || item.desa || '-';
                const statusAts = item.status || 'DO';

                return (
                  <tr 
                    key={item.id || index} 
                    className={`hover:bg-blue-50/30 transition-colors duration-150 ${
                      index % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'
                    }`}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-blue-100/70 text-blue-700 flex items-center justify-center font-bold text-xs flex-shrink-0">
                          {item.nama ? item.nama.charAt(0).toUpperCase() : 'A'}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-800 leading-snug">{item.nama}</p>
                          <span className="text-xs font-mono text-slate-400 block mt-0.5">
                            NISN: {item.nisn || '-'}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <span className="text-xs font-mono font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200/60">
                        {item.nik || '-'}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-xs text-slate-600 font-medium">
                      {jkLabel}
                    </td>

                    <td className="px-6 py-4">
                      <div className="text-xs text-slate-700">
                        <span className="font-bold block">{item.kabupaten || '-'}</span>
                        <span className="text-slate-400 block mt-0.5">
                          Kec. {item.kecamatan || '-'}, Desa {desa}
                        </span>
                      </div>
                    </td>

                    <td className="px-6 py-4 text-center">
                      {statusAts === 'DO' ? (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-red-50 text-red-600 border border-red-100">
                          Drop Out
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-orange-50 text-orange-600 border border-orange-100">
                          LTM
                        </span>
                      )}
                    </td>

                    <td className="px-6 py-4 text-center">
                      {isHandled ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                          <CheckCircle2 size={12} />
                          Sudah Ditindak
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-600 border border-amber-100">
                          <Clock size={12} />
                          Belum Ditindak
                        </span>
                      )}
                    </td>

                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => handleDetail(item)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold rounded-xl shadow-sm transition-all duration-200 cursor-pointer focus:ring-2 focus:ring-blue-700/30"
                      >
                        <Eye size={14} />
                        Detail
                      </button>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="7" className="px-6 py-16 text-center text-slate-400 text-sm">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <User size={32} className="text-slate-300" />
                    <p className="font-semibold text-slate-500">Tidak ada data Anak Tidak Sekolah yang sesuai pencarian / filter.</p>
                    <p className="text-xs text-slate-400">Coba ubah kata kunci pencarian atau filter wilayah.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Footer / Pagination Controls */}
      <div className="px-6 py-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 bg-slate-50/50">
        <div>
          <span>Menampilkan <strong className="text-slate-800 font-bold">{data.length}</strong> data</span>
          {pagination && pagination.total !== undefined && (
            <span> dari total <strong className="text-slate-800 font-bold">{pagination.total}</strong> di database</span>
          )}
        </div>

        {pagination && pagination.last_page > 1 && (
          <div className="flex items-center gap-2">
            <button
              disabled={pagination.current_page <= 1}
              onClick={() => onPageChange && onPageChange(pagination.current_page - 1)}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="font-bold text-slate-700">
              Halaman {pagination.current_page} dari {pagination.last_page}
            </span>
            <button
              disabled={pagination.current_page >= pagination.last_page}
              onClick={() => onPageChange && onPageChange(pagination.current_page + 1)}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
