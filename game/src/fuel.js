// [RONDE 4] Bahan bakar mobil dan pom bensin.
// Mobil punya tangki; bahan bakar turun saat menempuh jarak. Dua pom bensin
// (barat-laut dan tenggara) mengisi ulang perlahan selama mobil berhenti di atasnya.
import { BAHAN, WARNA } from './config.js';
import { batas } from './world_config.js';

export class Tangki {
  constructor() {
    this.isi = BAHAN.kapasitas;
  }

  pakai(jarak) {
    this.isi = batas(this.isi - jarak * BAHAN.pakai, 0, BAHAN.kapasitas);
  }

  isiUlang(dt) {
    this.isi = batas(this.isi + BAHAN.isi * dt, 0, BAHAN.kapasitas);
  }

  get kosong() { return this.isi <= 0.5; }
  get rendah() { return this.isi <= BAHAN.rendah; }
  get penuh() { return this.isi >= BAHAN.kapasitas - 0.5; }
  get teks() { return `${Math.round(this.isi)}%`; }
}

/** Pom bensin terdekat dari (x, z) beserta jaraknya. */
export function stasiunTerdekat(x, z, daftar) {
  let terbaik = null, jarakTerbaik = Infinity;
  for (const p of daftar) {
    const d = Math.hypot(p.x - x, p.z - z);
    if (d < jarakTerbaik) { jarakTerbaik = d; terbaik = p; }
  }
  return { stasiun: terbaik, jarak: jarakTerbaik };
}

/** Bangun satu pom bensin di (x, z): tiang, atap, dan dua pompa. */
function bangunSatuPom(scene, T, x, z) {
  const lampak = new T.Mesh(
    new T.PlaneGeometry(34, 34),
    new T.MeshLambertMaterial({ color: 0x30363f }),
  );
  lampak.rotation.x = -Math.PI / 2;
  lampak.position.set(x, 0.03, z);
  scene.add(lampak);

  const atap = new T.Mesh(
    new T.BoxGeometry(22, 0.6, 14),
    new T.MeshLambertMaterial({ color: 0xc0392b }),
  );
  atap.position.set(x, 5.4, z);
  scene.add(atap);

  const tiangMat = new T.MeshLambertMaterial({ color: 0x6b7280 });
  for (const [ox, oz] of [[-9, -5], [9, -5], [-9, 5], [9, 5]]) {
    const tiang = new T.Mesh(new T.CylinderGeometry(0.3, 0.3, 5.4, 8), tiangMat);
    tiang.position.set(x + ox, 2.7, z + oz);
    scene.add(tiang);
  }

  const pompaMat = new T.MeshLambertMaterial({ color: WARNA.bensin });
  for (const ox of [-3, 3]) {
    const pompa = new T.Mesh(new T.BoxGeometry(1.1, 2.0, 0.8), pompaMat);
    pompa.position.set(x + ox, 1.0, z);
    scene.add(pompa);
  }
}

/** Bangun dua pom bensin dan kembalikan posisinya. */
export function buatPomBensin(scene, T, half) {
  const posisi = [
    { x: -half + 60, z: -half + 60 },
    { x: half - 60, z: half - 60 },
  ];
  for (const p of posisi) bangunSatuPom(scene, T, p.x, p.z);
  return posisi.map((p) => ({ x: p.x, z: p.z, radius: 16 }));
}
