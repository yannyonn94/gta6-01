// [RONDE 3] Bahan bakar mobil dan pom bensin.
// Mobil punya tangki; bahan bakar turun saat menempuh jarak. Pom bensin
// di sudut kota mengisi ulang perlahan selama mobil berhenti di atasnya.
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
  get teks() { return `${Math.round(this.isi)}%`; }
}

/** Bangun pom bensin: tiang, atap, dan dua pompa. Mengembalikan posisinya. */
export function buatPomBensin(scene, T, half) {
  const lampak = new T.Mesh(
    new T.PlaneGeometry(34, 34),
    new T.MeshLambertMaterial({ color: 0x30363f }),
  );
  lampak.rotation.x = -Math.PI / 2;
  lampak.position.set(-half + 60, 0.03, -half + 60);
  scene.add(lampak);

  const atap = new T.Mesh(
    new T.BoxGeometry(22, 0.6, 14),
    new T.MeshLambertMaterial({ color: 0xc0392b }),
  );
  atap.position.set(-half + 60, 5.4, -half + 60);
  scene.add(atap);

  const tiangMat = new T.MeshLambertMaterial({ color: 0x6b7280 });
  for (const [ox, oz] of [[-9, -5], [9, -5], [-9, 5], [9, 5]]) {
    const tiang = new T.Mesh(new T.CylinderGeometry(0.3, 0.3, 5.4, 8), tiangMat);
    tiang.position.set(-half + 60 + ox, 2.7, -half + 60 + oz);
    scene.add(tiang);
  }

  const pompaMat = new T.MeshLambertMaterial({ color: WARNA.bensin });
  for (const ox of [-3, 3]) {
    const pompa = new T.Mesh(new T.BoxGeometry(1.1, 2.0, 0.8), pompaMat);
    pompa.position.set(-half + 60 + ox, 1.0, -half + 60);
    scene.add(pompa);
  }

  return [{ x: -half + 60, z: -half + 60, radius: 16 }];
}
