// [RONDE 4] Kendaraan: mobil parkir yang bisa dicuri, motor, dan armada lalu lintas.
import { LALU, MOTOR } from './config.js';
import { batas, acak } from './world_config.js';
import { Tangki } from './fuel.js';

const T = window.THREE;
const WARNA = [0xc0392b, 0x2980b9, 0x27ae60, 0xf39c12, 0x8e44ad, 0xbdc3c7, 0x2c3e50];

export class Mobil {
  constructor(scene, warna = 0xc0392b) {
    this.kelompok = new T.Group();
    const bodiMat = new T.MeshLambertMaterial({ color: warna });
    const kacaMat = new T.MeshLambertMaterial({ color: 0x1d2a35 });
    const banMat = new T.MeshLambertMaterial({ color: 0x14161a });

    const bodi = new T.Mesh(new T.BoxGeometry(1.9, 0.55, 4.2), bodiMat);
    bodi.position.y = 0.55;
    const kabin = new T.Mesh(new T.BoxGeometry(1.7, 0.5, 2.1), kacaMat);
    kabin.position.set(0, 1.05, -0.1);
    this.kelompok.add(bodi, kabin);

    const geoRoda = new T.CylinderGeometry(0.36, 0.36, 0.3, 10);
    this.roda = [];
    for (const [x, z] of [[-0.95, 1.35], [0.95, 1.35], [-0.95, -1.35], [0.95, -1.35]]) {
      const r = new T.Mesh(geoRoda, banMat);
      r.rotation.z = Math.PI / 2;
      r.position.set(x, 0.36, z);
      this.kelompok.add(r);
      this.roda.push(r);
    }
    scene.add(this.kelompok);

    this.mesh = this.kelompok;
    this.pos = new T.Vector3();
    this.heading = 0;
    this.laju = 0;
    this.pengemudi = null;   // 'lalu' | 'pemain' | null
    this.nama = 'Mobil';
    this.tangki = new Tangki();
  }

  gerak(dt) {
    if (this.pengemudi === 'lalu') {
      this.laju += (LALU.laju - this.laju) * Math.min(1, dt * 0.8);
      this.pos.x += Math.sin(this.heading) * this.laju * dt;
      this.pos.z += Math.cos(this.heading) * this.laju * dt;
      this.kelompok.position.copy(this.pos);
      this.kelompok.rotation.y = this.heading;
      this.tangki.pakai(this.laju * dt);
    }
    for (const r of this.roda) r.rotation.x += this.laju * dt * 2.2;
  }
}

/** Armada yang berputar-putar di jalan, termasuk satu motor. */
export function buatLaluLintas(scene, jalan, jumlah = LALU.jumlah) {
  const armada = [];
  for (let i = 0; i < jumlah; i++) {
    const m = new Mobil(scene, WARNA[i % WARNA.length]);
    m.nama = ['Sedan', 'Coupe', 'Station', 'Pickup'][i % 4];
    const j = jalan[i % jalan.length];
    const sepanjang = acak(-j.setengah, j.setengah);
    const lajur = (i % 2 ? 1 : -1) * 2.6;
    if (j.vertikal) {
      m.pos.set(j.di + lajur, 0, sepanjang);
      m.heading = i % 4 < 2 ? 0 : Math.PI;
    } else {
      m.pos.set(sepanjang, 0, j.di + lajur);
      m.heading = i % 4 < 2 ? Math.PI / 2 : -Math.PI / 2;
    }
    m.pengemudi = 'lalu';
    m.kelompok.position.copy(m.pos);
    m.kelompok.rotation.y = m.heading;
    armada.push(m);
  }
  // Satu motor parkir di tepi jalan: lebih cepat dan lincah dari mobil.
  const motor = new Motor(scene, 0xe67e22);
  motor.nama = 'Motor';
  const j0 = jalan[3];
  motor.pos.set(j0.di + 2.6, 0, 30);
  motor.heading = 0;
  motor.kelompok.position.copy(motor.pos);
  motor.kelompok.rotation.y = motor.heading;
  armada.push(motor);
  return armada;
}

/** Motor: dua roda, badan ramping, top speed dan akselerasi di atas mobil. */
export class Motor extends Mobil {
  constructor(scene, warna = 0xe67e22) {
    super(scene, warna);
    // Ganti bodi mobil dengan rangka motor yang ramping.
    this.kelompok.clear();
    const bodiMat = new T.MeshLambertMaterial({ color: warna });
    const gelapMat = new T.MeshLambertMaterial({ color: 0x1d2a35 });
    const banMat = new T.MeshLambertMaterial({ color: 0x14161a });
    const rangka = new T.Mesh(new T.BoxGeometry(0.5, 0.35, 2.0), bodiMat);
    rangka.position.y = 0.75;
    const jok = new T.Mesh(new T.BoxGeometry(0.45, 0.18, 0.9), gelapMat);
    jok.position.set(0, 0.95, -0.35);
    const setang = new T.Mesh(new T.BoxGeometry(0.7, 0.08, 0.08), gelapMat);
    setang.position.set(0, 1.05, 0.85);
    this.kelompok.add(rangka, jok, setang);
    const geoRoda = new T.CylinderGeometry(0.34, 0.34, 0.18, 10);
    this.roda = [];
    for (const z of [0.85, -0.85]) {
      const r = new T.Mesh(geoRoda, banMat);
      r.rotation.z = Math.PI / 2;
      r.position.set(0, 0.34, z);
      this.kelompok.add(r);
      this.roda.push(r);
    }
    this.motor = true;
  }

  /** Motor memakai top speed dan akselerasi sendiri saat dikemudi pemain. */
  get top() { return MOTOR.top; }
  get akselerasi() { return MOTOR.akselerasi; }
}
