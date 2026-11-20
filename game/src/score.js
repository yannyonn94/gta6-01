// [RONDE 5] Papan skor: skor, kombo, pengali kombo, dan jejak aksi terakhir untuk HUD.
// Kombo menaikkan pengali: tiap 3 aksi beruntun menambah +1 pengali (maks x4).
// Jendela kombo ikut memanjang tiap tingkat pengali supaya rantai panjang
// masih bisa dipertahankan, dan HUD bisa menggambar sisa waktunya.
import { KOMBO } from './config.js';

export class PapanSkor {
  constructor() {
    this.nilai = 0;
    this.kombo = 0;
    this.sisaKombo = 0;
    this.jendelaKombo = KOMBO.jendela;
    this.jejak = [];
    this.komboTerbaik = 0;
  }

  /** Pengali dari kombo saat ini: 1 + floor(kombo/3), dibatasi x4. */
  get pengali() {
    return Math.min(4, 1 + Math.floor(this.kombo / 3));
  }

  tambah(poin, label = '') {
    if (poin <= 0) return;
    const efektif = poin * this.pengali;
    this.nilai += efektif;
    this.kombo += 1;
    // Jendela memanjang 0,4 detik per tingkat pengali (maks +1,2 detik).
    this.jendelaKombo = KOMBO.jendela
      + Math.min(KOMBO.tambahMaks, (this.pengali - 1) * KOMBO.tambahTingkat);
    this.sisaKombo = this.jendelaKombo;
    if (this.kombo > this.komboTerbaik) this.komboTerbaik = this.kombo;
    if (this.jejak.length > 4) this.jejak.shift();
    this.jejak.push({ poin: efektif, label, pada: performance.now() });
  }

  langkah(dt) {
    if (this.sisaKombo > 0) {
      this.sisaKombo -= dt;
      if (this.sisaKombo <= 0) this.kombo = 0;
    }
    const now = performance.now();
    while (this.jejak.length && now - this.jejak[0].pada > 2600) this.jejak.shift();
  }

  get teks() { return String(Math.round(this.nilai)); }
  get teksKombo() { return this.kombo > 1 ? `x${this.kombo}` : ''; }
  get teksPengali() { return this.pengali > 1 ? `pengali x${this.pengali}` : ''; }
  /** Sisa jendela kombo 0..1 untuk bar HUD; 0 kalau kombo sudah putus. */
  get fraksiKombo() {
    return this.kombo > 1 ? Math.max(0, Math.min(1, this.sisaKombo / this.jendelaKombo)) : 0;
  }
  /** Nol-kan semua untuk permainan baru. */
  reset() {
    this.nilai = 0;
    this.kombo = 0;
    this.sisaKombo = 0;
    this.jendelaKombo = KOMBO.jendela;
    this.jejak = [];
    this.komboTerbaik = 0;
  }
  get teksStatus() {
    const a = this.jejak[this.jejak.length - 1];
    return a ? `+${a.poin} ${a.label}`.trim() : '';
  }
}
