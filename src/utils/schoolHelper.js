import schoolCsvRaw from '../assets/hasil_nama_sekolah.csv?raw';

// Map untuk pencarian cepat O(1) berdasarkan UUID sekolah_id
const schoolMap = new Map();

if (schoolCsvRaw) {
  const lines = schoolCsvRaw.split(/\r?\n/);
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    // Pisahkan berdasarkan koma pertama (sekolah_id,nama_sekolah)
    const commaIndex = line.indexOf(',');
    if (commaIndex !== -1) {
      const id = line.substring(0, commaIndex).trim();
      let name = line.substring(commaIndex + 1).trim();
      
      // Bersihkan tanda kutip jika ada
      name = name.replace(/^["']|["']$/g, '').trim();

      if (id && name) {
        schoolMap.set(id, name);
        schoolMap.set(id.toLowerCase(), name);
      }
    }
  }
}

/**
 * Mengambil nama sekolah berdasarkan sekolah_id.
 * Jika ID tidak ditemukan dalam data master, mengembalikan '-' atau ID sebagai fallback.
 */
export function getSchoolName(sekolahId) {
  if (!sekolahId) return '-';
  const cleanId = String(sekolahId).trim();
  
  // Ambil dari map
  const found = schoolMap.get(cleanId) || schoolMap.get(cleanId.toLowerCase());
  if (found) {
    return found;
  }
  
  return cleanId;
}

/**
 * Mendeteksi jenjang pendidikan (SD/MI, SMP/MTs, SMA/SMK, PAUD, PKBM)
 * berdasarkan sekolah_id, nama sekolah, atau tingkat_pendidikan / kelas.
 */
export function detectJenjang(sekolahId, tingkatPendidikan = '', rawNamaSekolah = '') {
  const schoolName = rawNamaSekolah || getSchoolName(sekolahId) || '';
  const textToAnalyze = `${schoolName} ${tingkatPendidikan}`.toUpperCase();

  // 1. Cek Pola PAUD / TK
  if (/\b(PAUD|TK|TKN|RA|KB|KELOMPOK BERMAIN)\b/.test(textToAnalyze)) {
    return 'PAUD / TK';
  }

  // 2. Cek Pola SLB
  if (/\b(SLB|SDLB|SMPLB|SMALB)\b/.test(textToAnalyze)) {
    return 'SLB / Khusus';
  }

  // 3. Cek Pola PKBM / Kesetaraan
  if (/\b(PKBM|PAKET A|PAKET B|PAKET C)\b/.test(textToAnalyze)) {
    return 'PKBM / Kesetaraan';
  }

  // 4. Cek Pola SD / MI (Kelas 1 - 6)
  if (
    /\b(SD|SDN|MIN|MIS|SDK|SDIT|SEKOLAH DASAR|DASAR)\b/.test(textToAnalyze) ||
    /\b(KELAS\s*[1-6]|TINGKAT\s*[1-6]|^[1-6]$)\b/.test(tingkatPendidikan.toUpperCase())
  ) {
    return 'SD / MI';
  }

  // 5. Cek Pola SMP / MTs (Kelas 7 - 9)
  if (
    /\b(SMP|SMPN|MTS|MTSN|MTSS|SMPIT|SLTP)\b/.test(textToAnalyze) ||
    /\b(KELAS\s*[7-9]|TINGKAT\s*[7-9]|^[7-9]$)\b/.test(tingkatPendidikan.toUpperCase())
  ) {
    return 'SMP / MTs';
  }

  // 6. Cek Pola SMA / SMK / MA (Kelas 10 - 12)
  if (
    /\b(SMA|SMAN|SMK|SMKN|MAN|MAS|SMAS|SMKS|SLTA|ALTIYA)\b/.test(textToAnalyze) ||
    /\b(KELAS\s*(10|11|12)|TINGKAT\s*(10|11|12)|^(10|11|12)$)\b/.test(tingkatPendidikan.toUpperCase())
  ) {
    return 'SMA / SMK';
  }

  return 'Lainnya';
}

export default getSchoolName;
