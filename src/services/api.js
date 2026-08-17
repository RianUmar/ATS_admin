import axios from 'axios';
import * as mockDb from './mockData';

// Konfigurasi baseURL dari .env atau default ke Laravel backend lokal
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

// Instance Axios untuk Akses API Backend
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Accept': 'application/json',
  },
});

// Interceptor Request: Menyisipkan Bearer Token jika ada
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('ats_admin_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor Response: Logging dan error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      console.warn('[API Auth] Sesi autentikasi telah berakhir.');
    }
    return Promise.reject(error);
  }
);

export default api;

/**
 * 1. Mengambil Daftar Siswa ATS (Anak Tidak Sekolah)
 * Mendukung filter: search, kabupaten, kecamatan, status, filter_tindak_lanjut, page, per_page
 */
export const getStudentsAPI = async (params = {}) => {
  try {
    const response = await api.get('/ats', { params });
    // Format response Laravel: { success: true, data: { data: [...], total, per_page, ... } } atau { data: [...] }
    const rawData = response.data?.data;
    if (rawData && rawData.data && Array.isArray(rawData.data)) {
      return { data: rawData.data, meta: rawData };
    } else if (Array.isArray(rawData)) {
      return { data: rawData, meta: null };
    }
    return { data: response.data || [], meta: null };
  } catch (error) {
    console.warn('[API fallback] Gagal menghubungi backend API /ats, menggunakan data fallback lokal:', error.message);
    const mockList = mockDb.getStudents();
    
    // Filter lokal pada fallback mockData
    let filtered = [...mockList];
    if (params.filter_tindak_lanjut === 'belum_ditindaklanjuti') {
      filtered = filtered.filter(s => !s.tindakanLanjut && (!s.tindak_lanjuts || s.tindak_lanjuts.length === 0));
    } else if (params.filter_tindak_lanjut === 'sudah_ditindaklanjuti') {
      filtered = filtered.filter(s => s.tindakanLanjut || (s.tindak_lanjuts && s.tindak_lanjuts.length > 0));
    }
    if (params.kabupaten) {
      filtered = filtered.filter(s => s.kabupaten === params.kabupaten);
    }
    if (params.kecamatan) {
      filtered = filtered.filter(s => s.kecamatan === params.kecamatan);
    }
    if (params.search) {
      const q = params.search.toLowerCase();
      filtered = filtered.filter(s => 
        (s.nama && s.nama.toLowerCase().includes(q)) || 
        (s.nik && s.nik.includes(q)) ||
        (s.nisn && s.nisn.includes(q))
      );
    }
    return { data: filtered, meta: { total: filtered.length } };
  }
};

/**
 * 2. Mengambil Detail Siswa ATS Lengkap (43 Kolom + Relasi Tindak Lanjut)
 */
export const getStudentByIdAPI = async (id) => {
  try {
    const response = await api.get(`/ats/${id}`);
    const data = response.data?.data || response.data;
    return { data };
  } catch (error) {
    console.warn(`[API fallback] Gagal menghubungi backend API /ats/${id}, menggunakan mock detail:`, error.message);
    return { data: mockDb.getStudentById(id) };
  }
};

/**
 * 3. Menyimpan Form Tindak Lanjut (Khusus Admin / Petugas)
 * Mendukung upload dokumen pendukung dan foto dokumentasi (multipart/form-data)
 */
export const createTindakLanjutAPI = async (formDataPayload) => {
  try {
    let payload;
    let isMultipart = false;

    if (formDataPayload instanceof FormData) {
      payload = formDataPayload;
      isMultipart = true;
    } else {
      payload = new FormData();
      Object.keys(formDataPayload).forEach(key => {
        if (formDataPayload[key] !== null && formDataPayload[key] !== undefined) {
          payload.append(key, formDataPayload[key]);
        }
      });
      isMultipart = true;
    }

    const response = await api.post('/tindak-lanjut', payload, {
      headers: isMultipart ? { 'Content-Type': 'multipart/form-data' } : {},
    });
    return response.data;
  } catch (error) {
    console.warn('[API fallback] Gagal menghubungi backend API POST /tindak-lanjut, menyimpan ke local state:', error.message);
    // Simpan ke mock database lokal jika offline
    const atsId = formDataPayload instanceof FormData 
      ? formDataPayload.get('anak_tidak_sekolah_id') 
      : formDataPayload.anak_tidak_sekolah_id;
      
    const keterangan = formDataPayload instanceof FormData 
      ? formDataPayload.get('keterangan') 
      : formDataPayload.keterangan;
      
    const alasan = formDataPayload instanceof FormData 
      ? formDataPayload.get('alasan') 
      : formDataPayload.alasan;

    const program_intervensi = formDataPayload instanceof FormData 
      ? formDataPayload.get('program_intervensi') 
      : formDataPayload.program_intervensi;

    const mockSaved = mockDb.updateStudentTindakanLanjut(atsId, {
      keterangan,
      alasan,
      program_intervensi,
      tanggal_tindak_lanjut: new Date().toISOString().split('T')[0],
      dokumenName: 'dokumen_pendukung.pdf',
      fotoUrl: 'https://images.unsplash.com/photo-1577896851231-70ef18881754?w=600&auto=format&fit=crop&q=60'
    });
    return { success: true, data: mockSaved, message: 'Data tindak lanjut disimpan secara lokal (mode offline).' };
  }
};

/**
 * 4. Mengubah Form Tindak Lanjut
 */
export const updateTindakLanjutAPI = async (id, formDataPayload) => {
  try {
    let payload = formDataPayload;
    if (formDataPayload instanceof FormData) {
      // Laravel menangani multipart update melalui POST dengan _method: PUT
      payload.append('_method', 'PUT');
      const response = await api.post(`/tindak-lanjut/${id}`, payload, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    } else {
      const response = await api.put(`/tindak-lanjut/${id}`, payload);
      return response.data;
    }
  } catch (error) {
    console.warn(`[API fallback] Gagal menghubungi backend API PUT /tindak-lanjut/${id}:`, error.message);
    return { success: false, message: error.message };
  }
};

/**
 * 4b. Menghapus Data Tindak Lanjut dari Backend
 */
export const deleteTindakLanjutAPI = async (id) => {
  try {
    const response = await api.delete(`/tindak-lanjut/${id}`);
    return response.data;
  } catch (error) {
    console.warn(`[API fallback] Gagal menghubungi backend API DELETE /tindak-lanjut/${id}:`, error.message);
    throw error;
  }
};

/**
 * 5. Mengambil Riwayat Tindak Lanjut dari Backend
 */
export const getTindakLanjutListAPI = async (params = {}) => {
  try {
    const response = await api.get('/tindak-lanjut', { params });
    const rawData = response.data?.data;
    if (rawData && rawData.data && Array.isArray(rawData.data)) {
      return { data: rawData.data, meta: rawData };
    }
    return { data: rawData || response.data || [], meta: null };
  } catch (error) {
    console.warn('[API fallback] Gagal mengambil list tindak lanjut:', error.message);
    return { data: [], meta: null };
  }
};

/**
 * 6. Mengimpor Berkas Excel ATS ke Backend (/api/ats/import)
 */
export const importAtsExcelAPI = async (file) => {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post('/ats/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    console.warn('[API fallback] Gagal mengunggah file ke backend /ats/import:', error.message);
    throw error;
  }
};

/**
 * 7. Kompatibilitas Legacy Mock Import untuk UI History
 */
export const importStudentsAPI = (studentsList, fileDetails) => {
  return Promise.resolve({ data: mockDb.importStudents(studentsList, fileDetails) });
};

export const getImportHistoryAPI = async (params = {}) => {
  try {
    const response = await api.get('/ats/riwayat-import', { params });
    const rawData = response.data?.data;
    if (rawData && rawData.data && Array.isArray(rawData.data)) {
      return { data: rawData.data, meta: rawData };
    } else if (Array.isArray(rawData)) {
      return { data: rawData, meta: null };
    }
    return { data: response.data || [], meta: null };
  } catch (error) {
    console.warn('[API fallback] Gagal menghubungi backend API /ats/riwayat-import:', error.message);
    return { data: mockDb.getImportHistory(), meta: null };
  }
};

// Aliases for compatibility
export const updateStudentTindakanLanjutAPI = createTindakLanjutAPI;
