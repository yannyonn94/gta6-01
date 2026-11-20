// Siklus siang-malam Kota Karang.
// Matahari bergerak mengelilingi kota, langit dan kabut berubah warna, lampu
// jalan dan gedung menyala saat gelap. Jam dibaca HUD dan memengaruhi suasana
// tiap screenshot, jadi siang dan malam sama-sama terlihat di dalam game.
import { DAY, PALETTE } from './config.js';
import { clamp } from './world_config.js';

// Kanvas warna langit: malam, fajar, siang, senja, lalu kembali malam.
const NIGHT = 0x0a0f1e;
const DAWN = 0xd98a5a;
const NOON = 0x87b5d9;
const DUSK = 0xc96f4a;

function mix(a, b, t) {
  const ar = (a >> 16) & 255, ag = (a >> 8) & 255, ab = a & 255;
  const br = (b >> 16) & 255, bg = (b >> 8) & 255, bb = b & 255;
  const r = Math.round(ar + (br - ar) * t);
  const g = Math.round(ag + (bg - ag) * t);
  const bl = Math.round(ab + (bb - ab) * t);
  return (r << 16) | (g << 8) | bl;
}

export class DayNight {
  constructor() {
    this.hour = DAY.startHour;   // 0..24
    this.dayFactor = 1;
  }

  /** Lompat ke jam tertentu (dipakai mode shot supaya scene bisa diatur). */
  setHour(h) {
    this.hour = ((h % 24) + 24) % 24;
  }

  update(dt) {
    this.hour = (this.hour + (dt / DAY.seconds) * 24) % 24;
  }

  /** 1 di siang hari, 0 di tengah malam. */
  get daylight() {
    const sun = Math.sin(((this.hour - 6) / 12) * Math.PI);
    return clamp(sun, 0, 1);
  }

  get isNight() { return this.daylight < 0.22; }

  /** Teks jam untuk HUD, format 24 jam. */
  clockText() {
    const h = Math.floor(this.hour);
    const m = Math.floor((this.hour - h) * 60);
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }

  /** Warna langit sekarang, dari campuran empat titik warna. */
  skyColor() {
    const h = this.hour;
    if (h < 5 || h >= 20) return NIGHT;
    if (h < 8) return mix(NIGHT, DAWN, (h - 5) / 3);
    if (h < 12) return mix(DAWN, NOON, (h - 8) / 4);
    if (h < 17) return NOON;
    if (h < 20) return mix(NOON, DUSK, (h - 17) / 3);
    return NIGHT;
  }

  /** Terapkan pencahayaan ke scene: warna langit, kabut, matahari, hemispheric. */
  apply(scene, sun, hemi, lamps = null) {
    const df = this.daylight;
    this.dayFactor = df;
    const sky = this.skyColor();
    scene.background.setHex(sky);
    scene.fog.color.setHex(sky);

    // Matahari bergerak dari timur (jam 6) ke barat (jam 18).
    const angle = ((this.hour - 6) / 12) * Math.PI;
    sun.position.set(Math.cos(angle) * 220, Math.max(12, Math.sin(angle) * 190), 90);
    sun.intensity = 0.12 + 0.85 * df;
    sun.color.setHex(df > 0.6 ? 0xfff2d0 : df > 0.2 ? 0xffc48a : 0x9fb4d8);

    hemi.intensity = 0.22 + 0.62 * df;
    hemi.color.setHex(mix(0x2a3550, 0xbfdcff, df));
    hemi.groundColor.setHex(mix(0x141a1c, 0x3a4a3a, df));

    // Lampu jalan: matikan di siang, nyalakan di malam.
    if (lamps) {
      const on = this.isNight;
      for (const l of lamps) l.visible = on;
    }
  }
}
