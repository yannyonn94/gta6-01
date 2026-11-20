// Skor dan kombo.
// Skor diberi dari misi, kejar-kejaran, dan aksi kecil. Kombo naik tiap kali
// pemain mendapat skor dalam jendela waktu, dan turun kalau pemain berhenti
// bertindak terlalu lama — jadi HUD selalu punya angka yang bergerak.
export class Score {
  constructor() {
    this.value = 0;
    this.combo = 0;
    this.comboTimer = 0;
    this.best = 0;
    this.events = [];
  }

  /** Tambah skor; label dipakai HUD untuk pesan singkat. */
  add(points, label = '') {
    if (points <= 0) return;
    this.value += points;
    this.combo += 1;
    this.comboTimer = 4;
    this.best = Math.max(this.best, this.value);
    if (this.events.length > 4) this.events.shift();
    this.events.push({ points, label, at: performance.now() });
  }

  update(dt) {
    if (this.comboTimer > 0) {
      this.comboTimer -= dt;
      if (this.comboTimer <= 0) this.combo = 0;
    }
    const now = performance.now();
    while (this.events.length && now - this.events[0].at > 2600) this.events.shift();
  }

  get text() { return String(Math.round(this.value)); }

  get comboText() { return this.combo > 1 ? `x${this.combo}` : ''; }

  /** Satu baris ringkas untuk HUD. */
  statusText() {
    const last = this.events[this.events.length - 1];
    if (!last) return '';
    return `+${last.points} ${last.label}`.trim();
  }
}
