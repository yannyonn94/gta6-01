// [RONDE 5] Pemain: tubuh kecil yang berjalan/lari dan bisa masuk mobil.
// Lari (Shift) memakai stamina: habis berarti jalan biasa sampai pulih.
// Diam mempercepat pemulihan stamina; misi yang selesai memulihkan nyawa.
import { ORANG, STAMINA } from './config.js';
import { batas } from './world_config.js';

const T = window.THREE;

export class Pemain {
  constructor(scene) {
    this.kelompok = new T.Group();
    const kulit = new T.MeshLambertMaterial({ color: 0xc98f6b });
    const baju = new T.MeshLambertMaterial({ color: 0x2e6f8e });
    const celana = new T.MeshLambertMaterial({ color: 0x2a2d34 });

    const badan = new T.Mesh(new T.BoxGeometry(0.55, 0.75, 0.3), baju);
    badan.position.y = 1.15;
    const kepala = new T.Mesh(new T.SphereGeometry(0.22, 10, 8), kulit);
    kepala.position.y = 1.72;
    const kakiL = new T.Mesh(new T.BoxGeometry(0.2, 0.75, 0.22), celana);
    kakiL.position.set(-0.14, 0.38, 0);
    const kakiR = kakiL.clone();
    kakiR.position.x = 0.14;
    const tanganL = new T.Mesh(new T.BoxGeometry(0.16, 0.6, 0.18), kulit);
    tanganL.position.set(-0.36, 1.15, 0);
    const tanganR = tanganL.clone();
    tanganR.position.x = 0.36;
    this.kelompok.add(badan, kepala, kakiL, kakiR, tanganL, tanganR);
    this.bagian = { badan, kepala, kakiL, kakiR, tanganL, tanganR };
    scene.add(this.kelompok);

    this.pos = new T.Vector3(0, 0, 0);
    this.heading = 0;
    this.laju = 0;
    this.diMobil = null;
    this.nyawa = ORANG.nyawa;
    this.stamina = STAMINA.maks;
    this.faseJalan = 0;
  }

  /** Apakah pemain masih bisa lari (stamina di atas ambang). */
  get bisaLari() { return this.stamina > STAMINA.ambangLari; }

  /** Pulihkan nyawa (misalnya saat misi selesai), dibatasi 100. */
  pulihNyawa(n) {
    this.nyawa = batas(this.nyawa + n, 0, ORANG.nyawa);
    return this.nyawa;
  }

  /** Kurangi nyawa karena tabrakan atau tertembak, dibatasi 0. */
  terluka(n) {
    this.nyawa = batas(this.nyawa - n, 0, ORANG.nyawa);
    return this.nyawa;
  }

  lentur(dt, aksi, yawKamera, batasDunia) {
    if (this.diMobil) return;
    let mx = aksi.x, mz = aksi.y;
    const bergerak = mx !== 0 || mz !== 0;
    // Lari hanya jika Shift ditahan DAN stamina cukup; kalau tidak, jalan biasa.
    const mauLari = aksi.lari && this.bisaLari;
    if (mauLari && bergerak) this.stamina = Math.max(0, this.stamina - STAMINA.habisLari * dt);
    // Diam memulihkan stamina lebih cepat daripada sambil berjalan.
    else this.stamina = Math.min(STAMINA.maks, this.stamina + STAMINA.pulih * (bergerak ? 1 : 1.6) * dt);
    const sasaran = bergerak ? (mauLari ? ORANG.lari : ORANG.jalan) : 0;
    this.laju += (sasaran - this.laju) * Math.min(1, dt * 10);

    if (bergerak) {
      const len = Math.hypot(mx, mz) || 1;
      mx /= len; mz /= len;
      const cos = Math.cos(yawKamera), sin = Math.sin(yawKamera);
      const wx = mx * cos - mz * sin;
      const wz = mx * sin + mz * cos;
      this.pos.x = batas(this.pos.x + wx * this.laju * dt, -batasDunia, batasDunia);
      this.pos.z = batas(this.pos.z + wz * this.laju * dt, -batasDunia, batasDunia);
      this.heading = Math.atan2(wx, wz);
      this.faseJalan += this.laju * dt * 1.6;
    } else {
      this.faseJalan *= 0.9;
    }

    this.kelompok.position.copy(this.pos);
    this.kelompok.rotation.y = this.heading;
    this.animasi();
  }

  animasi() {
    const s = Math.sin(this.faseJalan);
    const amp = Math.min(1, this.laju / ORANG.jalan);
    this.bagian.kakiL.rotation.x = s * 0.7 * amp;
    this.bagian.kakiR.rotation.x = -s * 0.7 * amp;
    this.bagian.tanganL.rotation.x = -s * 0.5 * amp;
    this.bagian.tanganR.rotation.x = s * 0.5 * amp;
    this.bagian.badan.position.y = 1.15 + Math.abs(Math.cos(this.faseJalan)) * 0.03 * amp;
  }

  masukMobil(m) {
    this.diMobil = m;
    this.kelompok.visible = false;
    this.laju = 0;
  }

  keluarMobil() {
    if (!this.diMobil) return;
    const m = this.diMobil;
    this.diMobil = null;
    this.kelompok.visible = true;
    this.pos.set(m.mesh.position.x + 1.6, 0, m.mesh.position.z);
    this.kelompok.position.copy(this.pos);
  }
}
