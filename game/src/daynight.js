// [RONDE 5] Siklus siang-malam: matahari berputar, langit berubah, lampu
// kota menyala saat gelap, bintang dan bulan muncul di malam hari,
// hujan menggelapkan langit, dan jam bisa diatur untuk mode screenshot.
import { HARI, HUJAN } from './config.js';
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

/** Hujan: titik-titik jatuh di sekitar titik pusat, mengikuti pemain. */
export function buatHujan(scene, jumlah = 700) {
  const T = window.THREE;
  const pos = new Float32Array(jumlah * 3);
  for (let i = 0; i < jumlah; i++) {
    pos[i * 3] = (Math.random() - 0.5) * 90;
    pos[i * 3 + 1] = Math.random() * 30;
    pos[i * 3 + 2] = (Math.random() - 0.5) * 90;
  }
  const geo = new T.BufferGeometry();
  geo.setAttribute('position', new T.BufferAttribute(pos, 3));
  const mat = new T.PointsMaterial({
    color: 0xaec6e0, size: 0.22, sizeAttenuation: true, transparent: true, opacity: 0,
  });
  const hujan = new T.Points(geo, mat);
  hujan.visible = false;
  scene.add(hujan);
  return {
    mesh: hujan,
    /** Jatuhkan tetes dan pusatkan awan hujan di atas (x, z). */
    langkah(dt, x, z, intensitas) {
      const p = geo.attributes.position.array;
      for (let i = 0; i < jumlah; i++) {
        p[i * 3 + 1] -= dt * 26;
        if (p[i * 3 + 1] < 0) {
          p[i * 3 + 1] = 24 + Math.random() * 6;
          p[i * 3] = x + (Math.random() - 0.5) * 90;
          p[i * 3 + 2] = z + (Math.random() - 0.5) * 90;
        }
      }
      geo.attributes.position.needsUpdate = true;
      hujan.visible = intensitas > 0.02;
      mat.opacity = Math.min(0.85, intensitas * 0.85);
    },
  };
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
    this.hujan = 0; // 0 cerah .. 1 hujan deras
  }

  aturJam(h) { this.jam = ((h % 24) + 24) % 24; }

  /** Set intensitas hujan 0..1; langit ikut menggelap. */
  aturHujan(v) { this.hujan = batas(v, 0, 1); }

  /** Nama periode hari untuk HUD: Pagi, Siang, Sore, atau Malam. */
  teksPeriode() {
    const j = this.jam;
    if (j < 5 || j >= 20) return 'Malam';
    if (j < 11) return 'Pagi';
    if (j < 16) return 'Siang';
    return 'Sore';
  }

  /** Nama cuaca dari intensitas hujan: Cerah, Hujan, atau Hujan deras. */
  teksCuaca() {
    if (this.hujan > 0.6) return 'Hujan deras';
    if (this.hujan > 0.3) return 'Hujan';
    return 'Cerah';
  }

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
    let dasar;
    if (j < 5 || j >= 20) dasar = GELAP;
    else if (j < 8) dasar = campur(GELAP, FAJAR, (j - 5) / 3);
    else if (j < 12) dasar = campur(FAJAR, TENGAH, (j - 8) / 4);
    else if (j < 17) dasar = TENGAH;
    else if (j < 20) dasar = campur(TENGAH, SENJA, (j - 17) / 3);
    else dasar = GELAP;
    // Hujan menarik langit ke arah abu-abu gelap.
    return campur(dasar, 0x4a5560, this.hujan * HUJAN.gelap);
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
    // polisi dan mobil tetap terlihat, bukan siluet hitam. Hujan meredupkan lagi.
    matahari.intensity = (0.28 + 0.72 * t) * (1 - this.hujan * 0.45);
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
