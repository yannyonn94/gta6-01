// [RONDE 5] Tujuh misi: curi mobil, kumpul kantong, hilangkan wanted, sprint,
// parkir presisi, koin Karang, dan antar van saat badai. Setiap misi punya
// objektif dan penanda yang jelas.
import { MISI, KOINS } from './config.js';
import { formatJarak, formatWaktu } from './world_config.js';

export const DAFTAR_MISI = [
  {
    id: 'm1', judul: 'Kereta Mati',
    briefing: 'Ambil mobil biru di garasi dan bawa ke dermaga.',
    jenis: 'curi', target: { x: 0, z: -190 }, hadiah: MISI.hadiah[0],
  },
  {
    id: 'm2', judul: 'Kantong Pasir',
    briefing: 'Kumpulkan 3 kantong di blok pasar sebelum polisi tiba.',
    jenis: 'kumpul', jumlah: 3, hadiah: MISI.hadiah[1],
    titik: [
      { x: 120, z: 40, diambil: false },
      { x: -90, z: 110, diambil: false },
      { x: 30, z: -60, diambil: false },
    ],
  },
  {
    id: 'm3', judul: 'Hilang Sejenak',
    briefing: 'Polisi sudah tahu. Turunkan bintang wanted kamu.',
    jenis: 'hindar', waktu: 45, hadiah: MISI.hadiah[2],
  },
  {
    id: 'm4', judul: 'Sprint Pantai',
    briefing: 'Tempuh 420 meter sebelum waktu habis.',
    jenis: 'sprint', waktu: 40, jarak: MISI.jarakSprint, hadiah: MISI.hadiah[3],
  },
  {
    id: 'm5', judul: 'Parkir Presisi',
    briefing: 'Parkir di garasi dalam 30 detik, mesin mati.',
    jenis: 'parkir', waktu: 30, target: { x: 60, z: 120 }, hadiah: MISI.hadiah[4],
  },
  {
    id: 'm6', judul: 'Koin Karang',
    briefing: 'Kumpulkan 5 koin emas yang tersebar di kota sebelum waktu habis.',
    jenis: 'koin', jumlah: KOINS.jumlah, waktu: KOINS.waktu, hadiah: MISI.hadiah[5],
    titik: [
      { x: -140, z: -140, diambil: false },
      { x: 150, z: -100, diambil: false },
      { x: -60, z: 150, diambil: false },
      { x: 100, z: 160, diambil: false },
      { x: 0, z: 0, diambil: false },
    ],
  },
  {
    id: 'm7', judul: 'Badai Karang',
    briefing: 'Hujan deras. Ambil van logistik di dekat pasar dan antar ke gudang pantai barat sebelum waktu habis.',
    jenis: 'antar', waktu: 60, target: { x: -150, z: 150 }, hadiah: MISI.hadiah[6],
    butuhVan: true,
  },
];

export class MisiState {
  constructor() {
    this.indeks = 0;
    this.aktif = null;
    this.terkumpul = 0;
    this.sisa = 0;
    this.jarak = 0;
    this.posAkhir = null;
  }

  mulai(m) {
    for (const t of m.titik ?? []) t.diambil = false;
    this.aktif = m;
    this.terkumpul = 0;
    this.sisa = m.waktu ?? 0;
    this.jarak = 0;
    this.posAkhir = null;
  }

  lanjut() {
    this.indeks = Math.min(this.indeks + 1, DAFTAR_MISI.length - 1);
    return DAFTAR_MISI[this.indeks];
  }

  tambahJarak(pos) {
    if (this.aktif?.jenis !== 'sprint') return;
    if (this.posAkhir) this.jarak += Math.hypot(pos.x - this.posAkhir.x, pos.z - this.posAkhir.z);
    this.posAkhir = { x: pos.x, z: pos.z };
  }

  teksObjektif(pos, wanted, diVan = false) {
    const m = this.aktif;
    if (!m) return 'Misi: —';
    const nomor = `Misi ${this.indeks + 1}/${DAFTAR_MISI.length} · `;
    if (m.jenis === 'curi') {
      const d = Math.hypot(pos.x - m.target.x, pos.z - m.target.z);
      return `${nomor}${m.judul}: ${m.briefing} (${formatJarak(d)})`;
    }
    if (m.jenis === 'kumpul') {
      return `${nomor}${m.judul}: ${this.terkumpul}/${m.jumlah} kantong (${formatWaktu(this.sisa)})`;
    }
    if (m.jenis === 'hindar') {
      return `${nomor}${m.judul}: turunkan wanted (${wanted > 0 ? `${wanted}★` : 'bersih'})`;
    }
    if (m.jenis === 'sprint') {
      return `${nomor}${m.judul}: ${Math.round(this.jarak)}/${m.jarak} m (${formatWaktu(this.sisa)})`;
    }
    if (m.jenis === 'parkir') {
      const d = Math.hypot(pos.x - m.target.x, pos.z - m.target.z);
      return `${nomor}${m.judul}: ${formatJarak(d)}, berhenti di zona (${formatWaktu(this.sisa)})`;
    }
    if (m.jenis === 'koin') {
      return `${nomor}${m.judul}: ${this.terkumpul}/${m.jumlah} koin (${formatWaktu(this.sisa)})`;
    }
    if (m.jenis === 'antar') {
      const d = Math.hypot(pos.x - m.target.x, pos.z - m.target.z);
      const naik = m.butuhVan && !diVan ? ' — ambil van dulu!' : '';
      return `${nomor}${m.judul}: ${formatJarak(d)} ke gudang (${formatWaktu(this.sisa)})${naik}`;
    }
    return `${nomor}${m.judul}`;
  }
}
