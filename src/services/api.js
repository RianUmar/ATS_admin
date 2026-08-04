import axios from 'axios';

// Instance Axios untuk Akses Admin (membutuhkan otentikasi)
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Interceptor untuk Request: Menyisipkan token otentikasi admin
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('ats_admin_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor untuk Response: Penanganan global (misal token expired 401)
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      console.warn('Sesi admin kedaluwarsa atau tidak sah. Mengalihkan ke login...');
      // localStorage.removeItem('ats_admin_token');
      // window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

// Mock API integration for Frontend-only development
import * as mockDb from './mockData';

export const getStudentsAPI = () => {
  // Simulation of api.get('/admin/siswa')
  return Promise.resolve({ data: mockDb.getStudents() });
};

export const getStudentByIdAPI = (id) => {
  // Simulation of api.get(`/admin/siswa/${id}`)
  return Promise.resolve({ data: mockDb.getStudentById(id) });
};

export const updateStudentTindakanLanjutAPI = (id, tindakan) => {
  // Simulation of api.post(`/admin/siswa/${id}/tindakan-lanjut`, tindakan)
  return Promise.resolve({ data: mockDb.updateStudentTindakanLanjut(id, tindakan) });
};

export const importStudentsAPI = (studentsList, fileDetails) => {
  // Simulation of api.post('/admin/siswa/import', { students: studentsList, details: fileDetails })
  return Promise.resolve({ data: mockDb.importStudents(studentsList, fileDetails) });
};

export const getImportHistoryAPI = () => {
  // Simulation of api.get('/admin/siswa/import-history')
  return Promise.resolve({ data: mockDb.getImportHistory() });
};
