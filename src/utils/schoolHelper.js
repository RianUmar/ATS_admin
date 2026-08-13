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

export default getSchoolName;
