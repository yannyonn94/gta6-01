// [RONDE 3] Pejalan kaki: berjalan di trotoar, menyeberang, menghindar mobil,
// dan panik saat wanted naik.
import { PEJALAN } from './config.js';
import { batas, acak } from './world_config.js';

const T = window.THREE;
const KULIT = [0xc98f6b, 0x8d5a3b, 0xe0b48f];
const BAJU = [0x7f8c8d, 0xd35400, 0x16a085, 0x2c3e50, 0xf1c40f];

export class PejalanKaki {
  constructor(scene, x, z) {
    this.kelompok = new T.Group();
    const kulit = new T.MeshLambertMaterial({ color: KULIT[Math.floor(acak(0, KULIT.length))] });
    const baju = new T.MeshLambertMaterial({ color: BAJU[Math.floor(acak(0, BAJU.length))] });
    const badan = new T.Mesh(new T.BoxGeometry(0.42, 0.6, 0.26), baju);
    badan.position.y = 1.0;
    const kepala = new T.Mesh(new T.SphereGeometry(0.18, 8, 6), kulit);
    kepala.position.y = 1.5;
    const kakiL = new T.Mesh(new T.BoxGeometry(0.16, 0.6, 0.18),
      new T.MeshLambertMaterial({ color: 0x22262c }));
    kakiL.position.set(-0.1, 0.3, 0);
    const kakiR = kakiL.clone();
    kakiR.position.x = 0.1;
    this.kelompok.add(badan, kepala, kakiL, kakiR);
    this.bagian = { kakiL, kakiR };
    scene.add(this.kelompok);

    this.pos = new T.Vector3(x, 0, z);
    this.heading = acak(0, Math.PI * 2);
    this.laju = acak(0.8, 1.6);
    this.fase = acak(0, 6);
    this.panik = false;
    this.menyeberang = false;
    this.menunggu = acak(0, 2);
    this.terhalang = false;
  }

  lentur(dt, pemain, adaPanik, mobil = []) {
    if (adaPanik) this.panik = true;

    this.terhalang = false;
    for (const m of mobil) {
      const dx = this.pos.x - m.pos.x, dz = this.pos.z - m.pos.z;
      if (Math.hypot(dx, dz) < 7) {
        const depan = Math.sin(m.heading) * dx + Math.cos(m.heading) * dz;
        if (depan > 0) { this.terhalang = true; break; }
      }
    }

    if (this.panik) {
      const dx = this.pos.x - pemain.x, dz = this.pos.z - pemain.z;
      const d = Math.hypot(dx, dz) || 1;
      this.heading = Math.atan2(dx / d, dz / d);
      this.laju = PEJALAN.lariPanik;
      this.menyeberang = false;
    } else if (this.terhalang) {
      this.laju = 0;
    } else if (this.menyeberang) {
      this.laju = 2.4;
      this.menunggu -= dt;
      if (this.menunggu <= 0) {
        this.menyeberang = false;
        this.heading = acak(0, Math.PI * 2);
      }
    } else {
      this.laju = acak(0.8, 1.6);
      if (Math.random() < PEJALAN.peluangCross * dt * 0.4) {
        this.menyeberang = true;
        this.menunggu = acak(1.2, 2.4);
        this.heading += Math.PI / 2;
      }
    }

    this.pos.x = batas(this.pos.x + Math.sin(this.heading) * this.laju * dt, -220, 220);
    this.pos.z = batas(this.pos.z + Math.cos(this.heading) * this.laju * dt, -220, 220);
    this.fase += this.laju * dt * 2;
    this.kelompok.position.copy(this.pos);
    this.kelompok.rotation.y = this.heading;
    const s = Math.sin(this.fase);
    this.bagian.kakiL.rotation.x = s * 0.6;
    this.bagian.kakiR.rotation.x = -s * 0.6;
  }
}

/** Sebar pejalan kaki di sepanjang trotoar. */
export function buatPejalan(scene, setengah, jumlah = PEJALAN.jumlah) {
  const daftar = [];
  for (let i = 0; i < jumlah; i++) {
    const vertikal = Math.random() < 0.5;
    const diJalan = -setengah + Math.floor(acak(0, 10)) * 44 + 6;
    const sepanjang = acak(-setengah, setengah);
    const lajur = (Math.random() < 0.5 ? -1 : 1) * (6 + acak(0, 3));
    const x = vertikal ? diJalan + lajur : sepanjang;
    const z = vertikal ? sepanjang : diJalan + lajur;
    daftar.push(new PejalanKaki(scene, x, z));
  }
  return daftar;
}
