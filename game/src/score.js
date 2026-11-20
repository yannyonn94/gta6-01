// [RONDE 4] Papan skor: skor, kombo, pengali kombo, dan jejak aksi terakhir untuk HUD.
// Kombo menaikkan pengali: tiap 3 aksi beruntun menambah +1 pengali (maks x4).
export class PapanSkor {
  constructor() {
    this.nilai = 0;
    this.kombo = 0;
    this.sisaKombo = 0;
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
    this.sisaKombo = 4;
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
  get teksStatus() {
    const a = this.jejak[this.jejak.length - 1];
    return a ? `+${a.poin} ${a.label}`.trim() : '';
  }
}
