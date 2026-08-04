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
      keterangan: 'Telah disalurkan bantuan seragam, tas, alat tulis, dan pembebasan biaya administrasi.',
      alasan: 'Anak menyatakan berminat kuat untuk bersekolah kembali jika seragam dan buku disediakan.',
      dokumenName: 'surat_rekomendasi_kembali_sekolah_rian.pdf',
      fotoUrl: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=600&auto=format&fit=crop&q=60'
    }
  }
];

// Helper Functions simulating API Calls
export const getStudents = () => {
  return [...DUMMY_STUDENTS];
};

export const getStudentById = (id) => {
  const student = DUMMY_STUDENTS.find(s => s.id === Number(id));
  return student ? { ...student } : null;
};

export const updateStudentTindakanLanjut = (id, tindakan) => {
  const index = DUMMY_STUDENTS.findIndex(s => s.id === Number(id));
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
