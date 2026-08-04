// Data Mock Siswa ATS Lengkap dengan Koordinat GIS & Detail Alamat (Skema Baru)
let DUMMY_STUDENTS = [
  {
    id: 1,
    nama: 'Ahmad Nur Fauzi',
    nisn: '0075489621',
    tanggalLahir: '23 Agustus 2007',
    nik: '7207052308990001',
    jk: 'Laki-laki',
    idSekolah: 'SMPN 2 Gumbasa',
    kelas: '8',
    keterangan: 'Membantu orang tua bekerja di sawah akibat kendala ekonomi.',
    status: 'DO',
    kabupaten: 'Kab. Sigi',
    kecamatan: 'Gumbasa',
    desa: 'Pakuli',
    alamatJalan: 'Jln. Poros Palu-Kulawi KM 35, RT 02/RW 01',
    latitude: -1.2576,
    longitude: 119.9234,
    tindakanLanjut: null
  },
  {
    id: 2,
    nama: 'Siti Rahmawati',
    nisn: '0086214795',
    tanggalLahir: '15 September 2008',
    nik: '7203114509980002',
    jk: 'Perempuan',
    idSekolah: 'SDN 1 Banawa',
    kelas: '6',
    keterangan: 'Akses jalan menuju sekolah rusak berat dan tidak ada sarana transportasi.',
    status: 'LTM',
    kabupaten: 'Kab. Donggala',
    kecamatan: 'Banawa',
    desa: 'Ganti',
    alamatJalan: 'Jln. Trans Sulawesi, RT 01/RW 01',
    latitude: -0.6854,
    longitude: 119.7428,
    tindakanLanjut: null
  },
  {
    id: 3,
    nama: 'Putra Pratama',
    nisn: '0069824157',
    tanggalLahir: '12 Juli 2006',
    nik: '7271011207990003',
    jk: 'Laki-laki',
    idSekolah: 'SMAN 3 Palu',
    kelas: '10',
    keterangan: 'Sakit kronis sejak awal semester sehingga tidak dapat melanjutkan pembelajaran.',
    status: 'DO',
    kabupaten: 'Kota Palu',
    kecamatan: 'Palu Timur',
    desa: 'Besusu Tengah',
    alamatJalan: 'Jln. Kartini No. 45, RT 03/RW 02',
    latitude: -0.8932,
    longitude: 119.8875,
    tindakanLanjut: null
  },
  {
    id: 4,
    nama: 'Dewi Lestari',
    nisn: '0091245786',
    tanggalLahir: '05 Juni 2009',
    nik: '7208045506970001',
    jk: 'Perempuan',
    idSekolah: 'SDN 2 Parigi',
    kelas: '5',
    keterangan: 'Kurang minat belajar dan tidak memiliki biaya membeli buku/seragam.',
    status: 'LTM',
    kabupaten: 'Kab. Parigi Moutong',
    kecamatan: 'Parigi',
    desa: 'Masigi',
    alamatJalan: 'Jln. Hasanuddin No. 12, RT 01/RW 03',
    latitude: -0.8078,
    longitude: 120.1912,
    tindakanLanjut: null
  },
  {
    id: 5,
    nama: 'Mohammad Faisal',
    nisn: '0073216548',
    tanggalLahir: '28 April 2007',
    nik: '7202102804960002',
    jk: 'Laki-laki',
    idSekolah: 'SMPN 1 Poso Kota',
    kelas: '9',
    keterangan: 'Keluarga sering berpindah-pindah lokasi perkebunan.',
    status: 'DO',
    kabupaten: 'Kab. Poso',
    kecamatan: 'Poso Kota',
    desa: 'Gebangrejo',
    alamatJalan: 'Jln. Pulau Sumatera No. 8, RT 04/RW 02',
    latitude: -1.3965,
    longitude: 120.7534,
    tindakanLanjut: null
  },
  {
    id: 6,
    nama: 'Indah Permatasari',
    nisn: '0085432179',
    tanggalLahir: '22 Januari 2008',
    nik: '7206126201010003',
    jk: 'Perempuan',
    idSekolah: 'SMPN 2 Bungku',
    kelas: '9',
    keterangan: 'Yatim piatu, kesulitan membiayai kebutuhan harian sekolah.',
    status: 'LTM',
    kabupaten: 'Kab. Morowali',
    kecamatan: 'Bungku Tengah',
    desa: 'Marsaole',
    alamatJalan: 'Jln. Trans Bungku, RT 02/RW 01',
    latitude: -2.5401,
    longitude: 121.9322,
    tindakanLanjut: null
  },
  {
    id: 7,
    nama: 'Rian Hidayat',
    nisn: '0076543291',
    tanggalLahir: '15 Maret 2007',
    nik: '7201081503000004',
    jk: 'Laki-laki',
    idSekolah: 'SMPN 1 Luwuk',
    kelas: '7',
    keterangan: 'Putus sekolah karena harus bekerja mengupas kelapa sawit membantu orang tua.',
    status: 'DO',
    kabupaten: 'Kab. Banggai',
    kecamatan: 'Luwuk',
    desa: 'Hanga-Hanga',
    alamatJalan: 'Jln Runga Raflesia Arnoldi, RT 0/ RW 0',
    latitude: -0.9482,
    longitude: 122.7885,
    tindakanLanjut: {
      keterangan: 'sudah lanjut sekolah',
      alasan: 'Anak menyatakan berminat kuat untuk bersekolah kembali jika seragam dan buku disediakan.',
      dokumenName: 'surat_rekomendasi_kembali_sekolah_rian.pdf',
      fotoUrl: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=600&auto=format&fit=crop&q=60'
    }
  }
];

// Arsip Riwayat Import Data ATS (Periode menggunakan ID sekuensial angka)
let DUMMY_IMPORTS = [
  {
    id: 1,
    periode: 1,
    tanggalImport: '2026-06-15T09:30:00+08:00',
    namaFile: 'ats_provinsi_sulteng_semester_1.xlsx',
    importedCount: 6,
    skippedCount: 1
  },
  {
    id: 2,
    periode: 2,
    tanggalImport: '2026-07-20T14:15:00+08:00',
    namaFile: 'ats_sigi_gumbasa_val.csv',
    importedCount: 1,
    skippedCount: 0
  }
];

// Helper Functions simulating API Calls
export const getStudents = () => {
  return [...DUMMY_STUDENTS];
};

export const getStudentById = (id) => {
  console.log("[mockDb] getStudentById searching for ID:", id, "Type:", typeof id);
  console.log("[mockDb] Current database student IDs:", DUMMY_STUDENTS.map(s => s.id));
  if (id === null || id === undefined) return null;
  const student = DUMMY_STUDENTS.find(s => String(s.id) === String(id));
  console.log("[mockDb] Found student result:", student);
  return student ? { ...student } : null;
};

export const updateStudentTindakanLanjut = (id, tindakan) => {
  const index = DUMMY_STUDENTS.findIndex(s => String(s.id) === String(id));
  if (index !== -1) {
    DUMMY_STUDENTS[index] = {
      ...DUMMY_STUDENTS[index],
      tindakanLanjut: {
        ...tindakan
      }
    };
    return { ...DUMMY_STUDENTS[index] };
  }
  return null;
};

// Ambil Riwayat Import
export const getImportHistory = () => {
  return [...DUMMY_IMPORTS].reverse(); // Urutan terbaru di atas
};

// Helper untuk mendapatkan nilai dari objek berdasarkan kumpulan nama kolom alternatif (case-insensitive & space-insensitive)
const getValueIgnoreCase = (obj, possibleKeys) => {
  if (!obj) return undefined;
  const keys = Object.keys(obj);
  const foundKey = keys.find(k => {
    const cleanK = k.toLowerCase().replace(/[^a-z0-9]/g, '');
    return possibleKeys.some(pk => pk.toLowerCase().replace(/[^a-z0-9]/g, '') === cleanK);
  });
  return foundKey ? obj[foundKey] : undefined;
};

// Tambah Data dan Simpan ke Riwayat (Periode dihitung secara otomatis sebagai increment ID)
export const importStudents = (studentsList, fileDetails) => {
  let importedCount = 0;
  let skippedCount = 0;

  studentsList.forEach(studentInput => {
    // Normalisasi field keys dari excel/csv ke skema internal
    const normName = String(getValueIgnoreCase(studentInput, ['nama', 'namalengkap', 'name']) || '').trim();
    const normNik = String(getValueIgnoreCase(studentInput, ['nik', 'nomorinduk', 'nomorindukkependudukan']) || '').trim();
    const normNisn = String(getValueIgnoreCase(studentInput, ['nisn', 'nomorinduksiswanasional']) || '').trim();
    const normJkRaw = String(getValueIgnoreCase(studentInput, ['jk', 'jeniskelamin', 'sex']) || 'Laki-laki').trim();
    const normTanggalLahir = String(getValueIgnoreCase(studentInput, ['tanggallahir', 'tgllahir', 'birthdate']) || '').trim();
    const normIdSekolah = String(getValueIgnoreCase(studentInput, ['idsekolah', 'sekolah', 'sekolahasal']) || '').trim();
    const normKelas = String(getValueIgnoreCase(studentInput, ['kelas', 'grade']) || '').trim();
    const normKeterangan = String(getValueIgnoreCase(studentInput, ['keterangan', 'penyebab', 'alasan', 'keteranganpenyebab']) || '').trim();
    const normStatusRaw = String(getValueIgnoreCase(studentInput, ['status', 'keaktifan']) || 'DO').trim();
    const normKabupaten = String(getValueIgnoreCase(studentInput, ['kabupaten', 'kota', 'kabupatenkota', 'kab']) || '').trim();
    const normKecamatan = String(getValueIgnoreCase(studentInput, ['kecamatan', 'kec']) || '').trim();
    const normDesa = String(getValueIgnoreCase(studentInput, ['desa', 'kelurahan', 'desakelurahan']) || '').trim();
    const normAlamatJalan = String(getValueIgnoreCase(studentInput, ['alamatjalan', 'alamat', 'alamatrumah']) || '').trim();
    
    const rawLat = getValueIgnoreCase(studentInput, ['lintang', 'latitude', 'lat']);
    const rawLng = getValueIgnoreCase(studentInput, ['bujur', 'longitude', 'lng']);
    const normLatitude = parseFloat(rawLat !== undefined && rawLat !== null ? rawLat : 0) || 0;
    const normLongitude = parseFloat(rawLng !== undefined && rawLng !== null ? rawLng : 0) || 0;

    if (!normNik) {
      skippedCount++;
      return;
    }

    // Hindari duplikasi NIK
    const isExist = DUMMY_STUDENTS.some(s => String(s.nik).trim() === normNik);
    if (isExist) {
      skippedCount++;
      return;
    }

    // Normalisasi Jenis Kelamin (JK)
    let finalJk = 'Laki-laki';
    if (normJkRaw.toLowerCase() === 'p' || normJkRaw.toLowerCase() === 'perempuan') {
      finalJk = 'Perempuan';
    }

    // Normalisasi Status Keaktifan
    let finalStatus = 'DO';
    if (normStatusRaw.toLowerCase() === 'ltm' || normStatusRaw.toLowerCase() === 'lulus tidak melanjutkan' || normStatusRaw.toLowerCase() === 'lulus') {
      finalStatus = 'LTM';
    }

    // Generate new sequential ID safely to prevent NaN
    const newId = DUMMY_STUDENTS.length > 0 
      ? Math.max(...DUMMY_STUDENTS.map(s => Number(s.id) || 0)) + 1 
      : 1;

    DUMMY_STUDENTS.push({
      id: newId,
      nama: normName,
      nik: normNik,
      nisn: normNisn,
      jk: finalJk,
      tanggalLahir: normTanggalLahir,
      idSekolah: normIdSekolah,
      kelas: normKelas,
      keterangan: normKeterangan,
      status: finalStatus,
      kabupaten: normKabupaten,
      kecamatan: normKecamatan,
      desa: normDesa,
      alamatJalan: normAlamatJalan,
      latitude: normLatitude,
      longitude: normLongitude,
      tindakanLanjut: null
    });
    importedCount++;
  });

  // Simpan log ke arsip riwayat import jika ada data yang diproses
  if (importedCount > 0 || skippedCount > 0) {
    const newImportId = DUMMY_IMPORTS.length > 0 ? Math.max(...DUMMY_IMPORTS.map(i => Number(i.id) || 0)) + 1 : 1;
    const nextPeriod = DUMMY_IMPORTS.length > 0 ? Math.max(...DUMMY_IMPORTS.map(i => Number(i.periode) || 0)) + 1 : 1;
    
    DUMMY_IMPORTS.push({
      id: newImportId,
      periode: nextPeriod, // Integer ID pengimporan berurutan (1, 2, 3...)
      tanggalImport: new Date().toISOString(),
      namaFile: fileDetails.namaFile || 'file_eksternal',
      importedCount,
      skippedCount
    });
  }

  return { importedCount, skippedCount };
};
