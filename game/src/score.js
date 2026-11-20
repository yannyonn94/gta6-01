// [RONDE 3] Papan skor: skor, kombo, dan jejak aksi terakhir untuk HUD.
export class PapanSkor {
  constructor() {
    this.nilai = 0;
    this.kombo = 0;
    this.sisaKombo = 0;
    this.jejak = [];
  }

  tambah(poin, label = '') {
    if (poin <= 0) return;
    this.nilai += poin;
    this.kombo += 1;
    this.sisaKombo = 4;
    if (this.jejak.length > 4) this.jejak.shift();
    this.jejak.push({ poin, label, pada: performance.now() });
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
  get teksStatus() {
    const a = this.jejak[this.jejak.length - 1];
    return a ? `+${a.poin} ${a.label}`.trim() : '';
  }
}
