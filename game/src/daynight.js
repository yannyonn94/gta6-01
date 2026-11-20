// [RONDE 3] Siklus siang-malam: matahari berputar, langit berubah, lampu
// kota menyala saat gelap, dan jam bisa diatur untuk mode screenshot.
import { HARI } from './config.js';
import { batas } from './world_config.js';

const GELAP = 0x0a0f1e;
const FAJAR = 0xd98a5a;
const TENGAH = 0x87b5d9;
const SENJA = 0xc96f4a;

function campur(a, b, t) {
  const ar = (a >> 16) & 255, ag = (a >> 8) & 255, ab = a & 255;
  const br = (b >> 16) & 255, bg = (b >> 8) & 255, bb = b & 255;
  return (
    (Math.round(ar + (br - ar) * t) << 16) |
    (Math.round(ag + (bg - ag) * t) << 8) |
    Math.round(ab + (bb - ab) * t)
  );
}

export class SiklusHari {
  constructor() {
    this.jam = HARI.mulai;
  }

  aturJam(h) { this.jam = ((h % 24) + 24) % 24; }

  langkah(dt) { this.jam = (this.jam + (dt / HARI.detik) * 24) % 24; }

  get terang() { return batas(Math.sin(((this.jam - 6) / 12) * Math.PI), 0, 1); }
  get gelap() { return this.terang < 0.22; }

  teksJam() {
    const h = Math.floor(this.jam);
    const m = Math.floor((this.jam - h) * 60);
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }

  warnaLangit() {
    const j = this.jam;
    if (j < 5 || j >= 20) return GELAP;
    if (j < 8) return campur(GELAP, FAJAR, (j - 5) / 3);
    if (j < 12) return campur(FAJAR, TENGAH, (j - 8) / 4);
    if (j < 17) return TENGAH;
    if (j < 20) return campur(TENGAH, SENJA, (j - 17) / 3);
    return GELAP;
  }

  /** Terapkan ke scene: latar, kabut, matahari, dan cahaya ambient. */
  terapkan(scene, matahari, ambient, lampu = null) {
    const t = this.terang;
    const langit = this.warnaLangit();
    scene.background.setHex(langit);
    scene.fog.color.setHex(langit);

    const sudut = ((this.jam - 6) / 12) * Math.PI;
    matahari.position.set(Math.cos(sudut) * 240, Math.max(14, Math.sin(sudut) * 200), 80);
    matahari.intensity = 0.1 + 0.85 * t;
    matahari.color.setHex(t > 0.6 ? 0xfff2d0 : t > 0.2 ? 0xffc48a : 0x9fb4d8);

    ambient.intensity = 0.2 + 0.62 * t;
    ambient.color.setHex(campur(0x2a3550, 0xbfdcff, t));
    ambient.groundColor.setHex(campur(0x141a1c, 0x3a4a3a, t));

    if (lampu) for (const l of lampu) l.visible = this.gelap;
  }
}
