// [RONDE 4] Siklus siang-malam: matahari berputar, langit berubah, lampu
// kota menyala saat gelap, bintang dan bulan muncul di malam hari,
// dan jam bisa diatur untuk mode screenshot.
import { HARI } from './config.js';
import { batas } from './world_config.js';

const GELAP = 0x0a0f1e;
const FAJAR = 0xd98a5a;
const TENGAH = 0x87b5d9;
const SENJA = 0xc96f4a;

/** Bintang: titik-titik putih di kubah langit, transparan di siang hari. */
export function buatBintang(scene) {
  const T = window.THREE;
  const jumlah = 420;
  const pos = new Float32Array(jumlah * 3);
  for (let i = 0; i < jumlah; i++) {
    const a = Math.random() * Math.PI * 2;
    const e = Math.random() * Math.PI * 0.45 + 0.08;
    const r = 700;
    pos[i * 3] = Math.cos(a) * Math.cos(e) * r;
    pos[i * 3 + 1] = Math.sin(e) * r;
    pos[i * 3 + 2] = Math.sin(a) * Math.cos(e) * r;
  }
  const geo = new T.BufferGeometry();
  geo.setAttribute('position', new T.BufferAttribute(pos, 3));
  const mat = new T.PointsMaterial({ color: 0xffffff, size: 1.6, sizeAttenuation: false, transparent: true, opacity: 0 });
  const bintang = new T.Points(geo, mat);
  scene.add(bintang);
  return bintang;
}

/** Bulan: cakram pucat yang menggantung di langit malam. */
export function buatBulan(scene) {
  const T = window.THREE;
  const bulan = new T.Mesh(
    new T.CircleGeometry(18, 24),
    new T.MeshBasicMaterial({ color: 0xe8ecf4, transparent: true, opacity: 0, fog: false }),
  );
  bulan.position.set(-260, 260, -420);
  bulan.lookAt(0, 0, 0);
  scene.add(bulan);
  return bulan;
}

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

  /** Terapkan ke scene: latar, kabut, matahari, cahaya ambient, bintang, bulan. */
  terapkan(scene, matahari, ambient, lampu = null, bintang = null, bulan = null) {
    const t = this.terang;
    const langit = this.warnaLangit();
    scene.background.setHex(langit);
    scene.fog.color.setHex(langit);

    const sudut = ((this.jam - 6) / 12) * Math.PI;
    matahari.position.set(Math.cos(sudut) * 240, Math.max(14, Math.sin(sudut) * 200), 80);
    // Senja/malam tetap bisa dimainkan: cahaya minimum dinaikkan supaya
    // polisi dan mobil tetap terlihat, bukan siluet hitam.
    matahari.intensity = 0.28 + 0.72 * t;
    matahari.color.setHex(t > 0.6 ? 0xfff2d0 : t > 0.2 ? 0xffc48a : 0x9fb4d8);

    ambient.intensity = 0.38 + 0.5 * t;
    ambient.color.setHex(campur(0x2a3550, 0xbfdcff, t));
    ambient.groundColor.setHex(campur(0x141a1c, 0x3a4a3a, t));

    if (lampu) for (const l of lampu) l.visible = this.gelap;
    // Bintang dan bulan hanya terlihat saat gelap.
    const kegelapan = 1 - t;
    if (bintang) bintang.material.opacity = this.gelap ? kegelapan * 0.9 : 0;
    if (bulan) bulan.material.opacity = this.gelap ? kegelapan * 0.95 : 0;
  }
}
