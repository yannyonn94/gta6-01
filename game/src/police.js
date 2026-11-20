// [RONDE 3] Polisi: cruiser yang memprediksi gerak pemain dan saling membagi
// sisi saat mengejar, jadi kejar-kejaran terasa seperti dikepung.
import { MOBIL, POLISI } from './config.js';
import { batas, selisihSudut } from './world_config.js';

const T = window.THREE;

export class MobilPolisi {
  constructor(scene, indeks = 0) {
    this.kelompok = new T.Group();
    const badanMat = new T.MeshLambertMaterial({ color: 0xf2f4f6 });
    const garisMat = new T.MeshLambertMaterial({ color: 0x14213d });
    const badan = new T.Mesh(new T.BoxGeometry(1.95, 0.55, 4.3), badanMat);
    badan.position.y = 0.55;
    const garis = new T.Mesh(new T.BoxGeometry(2.0, 0.2, 4.32), garisMat);
    garis.position.y = 0.72;
    const batangLampu = new T.Mesh(new T.BoxGeometry(1.1, 0.18, 0.4),
      new T.MeshLambertMaterial({ color: 0x222222 }));
    batangLampu.position.set(0, 1.36, -0.2);
    this.lampuMerah = new T.Mesh(new T.SphereGeometry(0.14, 8, 6),
      new T.MeshBasicMaterial({ color: 0xff2222 }));
    this.lampuMerah.position.set(-0.35, 1.5, -0.2);
    this.lampuBiru = new T.Mesh(new T.SphereGeometry(0.14, 8, 6),
      new T.MeshBasicMaterial({ color: 0x2266ff }));
    this.lampuBiru.position.set(0.35, 1.5, -0.2);
    const banMat = new T.MeshLambertMaterial({ color: 0x14161a });
    const geoRoda = new T.CylinderGeometry(0.36, 0.36, 0.3, 10);
    this.roda = [];
    for (const [x, z] of [[-0.98, 1.4], [0.98, 1.4], [-0.98, -1.4], [0.98, -1.4]]) {
      const r = new T.Mesh(geoRoda, banMat);
      r.rotation.z = Math.PI / 2;
      r.position.set(x, 0.36, z);
      this.kelompok.add(r);
      this.roda.push(r);
    }
    this.kelompok.add(badan, garis, batangLampu, this.lampuMerah, this.lampuBiru);
    scene.add(this.kelompok);

    this.pos = new T.Vector3();
    this.heading = 0;
    this.laju = 0;
    this.kedip = 0;
    this.kepala = 0.85 + (indeks % 3) * 0.12;
    this.sisi = indeks % 2 ? 1 : -1;
  }

  kejar(dt, sasaran, aktif, kecepatanSasaran = null) {
    if (!aktif) {
      this.laju *= 0.9;
      this.kelompok.position.copy(this.pos);
      return;
    }
    const lead = POLISI.lead * (kecepatanSasaran ? Math.hypot(kecepatanSasaran.x, kecepatanSasaran.z) / MOBIL.top : 0);
    const bidikX = sasaran.x + (kecepatanSasaran ? kecepatanSasaran.x : 0) * lead;
    const bidikZ = sasaran.z + (kecepatanSasaran ? kecepatanSasaran.z : 0) * lead;
    const dx = bidikX - this.pos.x, dz = bidikZ - this.pos.z;
    const jarak = Math.hypot(dx, dz);
    const ingin = Math.atan2(dx, dz);
    this.heading += batas(selisihSudut(this.heading, ingin), -2.9 * this.kepala * dt, 2.9 * this.kepala * dt);

    const puncak = MOBIL.top * 1.25 * this.kepala;
    const sasaranLaju = jarak > 8 ? puncak : puncak * 0.4;
    this.laju += (sasaranLaju - this.laju) * Math.min(1, dt * 1.4);
    this.pos.x += Math.sin(this.heading) * this.laju * dt;
    this.pos.z += Math.cos(this.heading) * this.laju * dt;

    if (jarak < 14) {
      this.pos.x += Math.sin(this.heading + Math.PI / 2) * this.sisi * dt * 2.4;
      this.pos.z += Math.cos(this.heading + Math.PI / 2) * this.sisi * dt * 2.4;
    }

    this.kelompok.position.copy(this.pos);
    this.kelompok.rotation.y = this.heading;
    for (const r of this.roda) r.rotation.x += this.laju * dt * 2.2;

    this.kedip += dt * 12;
    const nyala = Math.floor(this.kedip) % 2 === 0;
    this.lampuMerah.material.color.setHex(nyala ? 0xff2222 : 0x550000);
    this.lampuBiru.material.color.setHex(nyala ? 0x112255 : 0x2266ff);
  }
}

/** Satu cruiser per bintang wanted, disebar melingkar di sekitarnya. */
export function buatPolisi(scene, jumlah) {
  const daftar = [];
  for (let i = 0; i < jumlah; i++) {
    const p = new MobilPolisi(scene, i);
    const sudut = (i / Math.max(1, jumlah)) * Math.PI * 2 + 0.7;
    p.pos.set(Math.sin(sudut) * 55, 0, Math.cos(sudut) * 55);
    p.heading = sudut + Math.PI;
    p.kelompok.position.copy(p.pos);
    p.kelompok.visible = false;
    daftar.push(p);
  }
  return daftar;
}
