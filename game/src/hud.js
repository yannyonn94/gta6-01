// [RONDE 3] HUD: wanted, uang, skor, jam, speedometer, bahan bakar, objektif,
// dan minimap yang menampilkan lalu lintas, pejalan kaki, dan polisi.
import { KOTA } from './config.js';

export class Hud {
  constructor() {
    this.root = document.getElementById('hud');
    this.elWanted = document.getElementById('wanted');
    this.elUang = document.getElementById('uang');
    this.elSkor = document.getElementById('skor');
    this.elKombo = document.getElementById('kombo');
    this.elJam = document.getElementById('jam');
    this.elLaju = document.getElementById('laju');
    this.elMobil = document.getElementById('namaMobil');
    this.elBahan = document.getElementById('bahan');
    this.elObjektif = document.getElementById('objektif');
    this.elPesan = document.getElementById('pesan');
    this.elNyawa = document.querySelector('#nyawa > div');
    this.kanvas = document.getElementById('minimap');
    this.ctx = this.kanvas.getContext('2d');
    this.timerPesan = 0;
    this.lajuLama = -1;
  }

  tampil(on) { this.root.classList.toggle('on', on); }

  aturWanted(level) {
    let s = '';
    for (let i = 0; i < 5; i++) s += i < level ? '★' : '☆';
    this.elWanted.textContent = s;
    this.elWanted.style.color = level >= 3 ? '#ff6b6b' : level > 0 ? '#f2c94c' : '#8b93a3';
  }

  aturUang(v) { this.elUang.textContent = `$${Math.round(v)}`; }
  aturNyawa(v) { this.elNyawa.style.width = `${Math.max(0, Math.min(100, v))}%`; }
  aturObjektif(t) { this.elObjektif.textContent = t; }

  aturSkor(s) {
    this.elSkor.textContent = s.teks;
    const label = s.teksKombo || s.teksStatus;
    this.elKombo.textContent = label;
    this.elKombo.style.opacity = label ? '1' : '0';
  }

  aturJam(teks, gelap) {
    this.elJam.textContent = teks;
    this.elJam.style.color = gelap ? '#9fb4d8' : '#f2c94c';
  }

  aturLaju(ms, diMobil) {
    const kmh = Math.round(Math.abs(ms) * 3.6);
    if (kmh !== this.lajuLama) {
      this.elLaju.textContent = String(kmh);
      this.lajuLama = kmh;
    }
    this.elLaju.parentElement.style.opacity = diMobil ? '1' : '0.35';
  }

  aturMobil(nama) { this.elMobil.textContent = nama || ''; }

  aturBahan(persen, kosong) {
    this.elBahan.textContent = `BBM ${persen}`;
    this.elBahan.style.color = kosong ? '#ff6b6b' : '#9fe3a0';
    this.elBahan.parentElement.style.opacity = '1';
  }

  kilat(teks, detik = 2.4) {
    this.elPesan.textContent = teks;
    this.elPesan.style.opacity = '1';
    this.timerPesan = detik;
  }

  langkah(dt) {
    if (this.timerPesan > 0) {
      this.timerPesan -= dt;
      if (this.timerPesan <= 0) this.elPesan.style.opacity = '0';
    }
  }

  gambarMinimap(pos, heading, setengah, polisi, penanda, lalu = [], pejalan = [], pom = []) {
    const ctx = this.ctx;
    const ukuran = this.kanvas.width;
    const skala = ukuran / (setengah * 2.2);
    const ke = (x, z) => [ukuran / 2 + x * skala, ukuran / 2 + z * skala];

    ctx.clearRect(0, 0, ukuran, ukuran);
    ctx.fillStyle = 'rgba(10,14,18,.85)';
    ctx.fillRect(0, 0, ukuran, ukuran);

    ctx.strokeStyle = 'rgba(200,205,215,.28)';
    ctx.lineWidth = 2;
    const langkahJalan = KOTA.block + KOTA.roadWidth;
    for (let i = 0; i <= KOTA.grid; i++) {
      const c = -setengah + i * langkahJalan + 6;
      const [x1, y1] = ke(c, -setengah), [x2, y2] = ke(c, setengah);
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
      const [a1, b1] = ke(-setengah, c), [a2, b2] = ke(setengah, c);
      ctx.beginPath(); ctx.moveTo(a1, b1); ctx.lineTo(a2, b2); ctx.stroke();
    }

    ctx.fillStyle = '#d8b13c';
    for (const m of lalu) {
      const [x, y] = ke(m.pos.x, m.pos.z);
      ctx.fillRect(x - 1.5, y - 1.5, 3, 3);
    }

    ctx.fillStyle = '#b9c2d0';
    for (const p of pejalan) {
      const [x, y] = ke(p.pos.x, p.pos.z);
      ctx.fillRect(x - 1, y - 1, 2, 2);
    }

    ctx.fillStyle = '#2f9e6e';
    for (const p of pom) {
      const [x, y] = ke(p.x, p.z);
      ctx.beginPath(); ctx.arc(x, y, 4, 0, Math.PI * 2); ctx.fill();
    }

    if (penanda) {
      const [x, y] = ke(penanda.x, penanda.z);
      ctx.fillStyle = '#f2c94c';
      ctx.beginPath(); ctx.arc(x, y, 5, 0, Math.PI * 2); ctx.fill();
    }

    ctx.fillStyle = '#4d8dff';
    for (const p of polisi) {
      const [x, y] = ke(p.pos.x, p.pos.z);
      ctx.beginPath(); ctx.arc(x, y, 3, 0, Math.PI * 2); ctx.fill();
    }

    const [x, y] = ke(pos.x, pos.z);
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(Math.atan2(Math.sin(heading), Math.cos(heading)) * -1 + Math.PI);
    ctx.fillStyle = '#9fe3a0';
    ctx.beginPath();
    ctx.moveTo(0, -7); ctx.lineTo(5, 6); ctx.lineTo(-5, 6);
    ctx.closePath(); ctx.fill();
    ctx.restore();
  }
}
