// [RONDE 3] Inti permainan "Kota Karang": dunia, pemain, polisi, lalu lintas,
// misi, bahan bakar, dan mode screenshot.
import { KOTA, MOBIL, POLISI, SKOR, KUNCI_SIMPAN, MAX_FRAME } from './config.js';
import { batas, acak, jarak2 } from './world_config.js';
import { bangunKota } from './city.js';
import { Pemain } from './player.js';
import { Mobil, buatLaluLintas } from './vehicles.js';
import { buatPolisi } from './police.js';
import { buatPejalan } from './pedestrians.js';
import { buatPomBensin } from './fuel.js';
import { MisiState, DAFTAR_MISI } from './missions.js';
import { Hud } from './hud.js';
import { buatMasukan, AKSI_MOBIL, AKSI_TEMBAK, AKSI_JEDA } from './input.js';
import { SuaraGTA } from './gta_sound.js';
import { SiklusHari } from './daynight.js';
import { PapanSkor } from './score.js';
import { bacaQueryShot, tataShot } from './shots.js';

const T = window.THREE;

// ---------- renderer ----------
const kanvas = document.getElementById('kanvas');
const renderer = new T.WebGLRenderer({ canvas: kanvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = T.PCFSoftShadowMap;

const scene = new T.Scene();
scene.background = new T.Color(0x87b5d9);
scene.fog = new T.Fog(0x87b5d9, 140, 520);

const camera = new T.PerspectiveCamera(64, window.innerWidth / window.innerHeight, 0.1, 2000);
camera.position.set(0, 150, 230);

const matahari = new T.DirectionalLight(0xfff2d0, 0.9);
matahari.position.set(120, 200, 80);
matahari.castShadow = true;
matahari.shadow.mapSize.set(2048, 2048);
matahari.shadow.camera.near = 1;
matahari.shadow.camera.far = 700;
matahari.shadow.camera.left = -260;
matahari.shadow.camera.right = 260;
matahari.shadow.camera.top = 260;
matahari.shadow.camera.bottom = -260;
scene.add(matahari);

const ambient = new T.HemisphereLight(0xbfdcff, 0x3a4a3a, 0.8);
scene.add(ambient);

// ---------- dunia ----------
const query = bacaQueryShot();
const dunia = bangunKota(scene, query.seed);
const setengahKota = dunia.setengah;

const pemain = new Pemain(scene);
pemain.pos.set(0, 0, 12);
pemain.kelompok.position.copy(pemain.pos);

const lalu = buatLaluLintas(scene, dunia.jalan, 14);
const polisi = buatPolisi(scene, POLISI.jumlah);
const pejalan = buatPejalan(scene, setengahKota, 22);
const pom = buatPomBensin(scene, T, setengahKota);

// Mobil curian di garasi misi.
const mobilCuri = new Mobil(scene, 0x2980b9);
mobilCuri.nama = 'Sedan Biru';
mobilCuri.pos.set(0, 0, -190);
mobilCuri.heading = Math.PI / 2;
mobilCuri.kelompok.position.copy(mobilCuri.pos);
mobilCuri.kelompok.rotation.y = mobilCuri.heading;
lalu.push(mobilCuri);

// ---------- sistem ----------
const hud = new Hud();
const masukan = buatMasukan(kanvas);
const sound = new SuaraGTA();
const siklus = new SiklusHari();
const skor = new PapanSkor();
const misi = new MisiState();

const state = {
  started: false,
  wanted: 0,
  uang: 0,
  senjata: 0,
  misiIndex: 0,
  paused: false,
  crashCd: 0,
  nearCd: 0,
  refillMsg: 0,
  minimapCd: 0,
};

const overlay = document.getElementById('overlay');
const btnMulai = document.getElementById('btn-start');
const btnLanjut = document.getElementById('btn-continue');
const layarAkhir = document.getElementById('end');
const btnMainLagi = document.getElementById('btn-again');
const teksAkhir = document.getElementById('endText');
const teksAkhirJudul = document.getElementById('endTitle');

// Penanda misi di dunia.
const penanda = new T.Mesh(
  new T.CylinderGeometry(1.6, 1.6, 0.5, 16),
  new T.MeshBasicMaterial({ color: 0xf2c94c }),
);
penanda.position.set(0, 0.3, -190);
scene.add(penanda);

// Peluru: bola cahaya yang benar-benar bergerak.
const peluru = [];
const geoPeluru = new T.SphereGeometry(0.16, 6, 5);
const matPeluru = new T.MeshBasicMaterial({ color: 0xffe08a });

function tambahWanted(n) {
  state.wanted = batas(state.wanted + n, 0, 5);
  hud.aturWanted(state.wanted);
  if (state.wanted > 0) sound.sirene(true);
}

function beriUang(n) {
  state.uang += n;
  hud.aturUang(state.uang);
}

function simpan() {
  try {
    localStorage.setItem(KUNCI_SIMPAN, JSON.stringify({
      wanted: state.wanted,
      uang: state.uang,
      misiIndex: misi.indeks,
    }));
  } catch {}
}

function muat() {
  try {
    const raw = localStorage.getItem(KUNCI_SIMPAN);
    if (!raw) return false;
    const d = JSON.parse(raw);
    state.wanted = d.wanted ?? 0;
    state.uang = d.uang ?? 0;
    misi.indeks = d.misiIndex ?? 0;
    return true;
  } catch {
    return false;
  }
}

// ---------- interaksi mobil ----------
function dekatDenganMobilParkir() {
  let terbaik = null, jarakTerbaik = MOBIL.jarakCuri;
  for (const m of lalu) {
    if (m.pengemudi === 'pemain') continue;
    const d = jarak2(m.pos.x, m.pos.z, pemain.pos.x, pemain.pos.z);
    if (d < jarakTerbaik) { jarakTerbaik = d; terbaik = m; }
  }
  return terbaik;
}

function kendalikanMobil(dt) {
  const m = pemain.diMobil;
  const { x, y, lari, rem } = masukan.gerak();
  const aksi = masukan.ambilAksi();

  if (aksi & AKSI_MOBIL) {
    if (pemain.diMobil) {
      pemain.keluarMobil();
      m.pengemudi = null;
      m.laju = 0;
      hud.aturMobil('');
    } else {
      const target = dekatDenganMobilParkir();
      if (target) {
        pemain.masukMobil(target);
        target.pengemudi = 'pemain';
        tambahWanted(MOBIL.wantedCuri);
        hud.kilat(`Kamu mengambil ${target.nama}.`, 2);
        hud.aturMobil(target.nama);
        sound.blip(320, 0.12, 'triangle', 0.25);
      }
    }
  }

  if (!pemain.diMobil) return;

  const kosong = m.tangki.kosong;
  const puncak = kosong ? MOBIL.top * 0.4 : MOBIL.top;
  if (y > 0) {
    m.laju += (MOBIL.akselerasi + (lari ? 0.7 : 0)) * puncak * dt;
  } else if (y < 0 || rem) {
    m.laju -= (MOBIL.rem * 140 + 1.6) * dt * (rem ? 2.4 : 1);
  } else {
    m.laju *= 1 - Math.min(1, dt * 0.55);
  }
  m.laju = batas(m.laju, -puncak * 0.5, puncak);

  if (Math.abs(m.laju) > 0.3) {
    m.heading += -x * MOBIL.belok * dt * (m.laju >= 0 ? 1 : -1);
  }

  const jarakTempuh = m.laju * dt;
  m.pos.x = batas(m.pos.x + Math.sin(m.heading) * jarakTempuh, -setengahKota, setengahKota);
  m.pos.z = batas(m.pos.z + Math.cos(m.heading) * jarakTempuh, -setengahKota, setengahKota);
  m.kelompok.position.copy(m.pos);
  m.kelompok.rotation.y = m.heading;
  for (const r of m.roda) r.rotation.x += m.laju * dt * 2.2;

  m.tangki.pakai(Math.abs(jarakTempuh));
  pemain.pos.set(m.pos.x, 0, m.pos.z);
  pemain.heading = m.heading;

  // Isi ulang di pom bensin saat berhenti.
  for (const p of pom) {
    if (jarak2(m.pos.x, m.pos.z, p.x, p.z) < p.radius && Math.abs(m.laju) < 0.6) {
      m.tangki.isiUlang(dt);
      state.refillMsg -= dt;
      if (state.refillMsg <= 0) {
        state.refillMsg = 1.2;
        hud.kilat(`Isi bahan bakar… ${m.tangki.teks}`, 1.0);
        sound.blip(520, 0.08, 'sine', 0.2);
      }
    }
  }

  sound.mesin(Math.abs(m.laju) / MOBIL.top);
  hud.aturBahan(m.tangki.teks, kosong);
  if (kosong) hud.kilat('Bahan bakar habis! Mobil kehilangan tenaga.', 1.5);
}

// Menabrak mobil: nyawa berkurang; lewat dekat: skor nyaris.
function interaksiLalu(dt) {
  const m = pemain.diMobil;
  state.crashCd -= dt;
  state.nearCd -= dt;
  if (!m) return;
  const laju = Math.abs(m.laju);
  for (const t of lalu) {
    if (t === m) continue;
    const d = jarak2(t.pos.x, t.pos.z, m.pos.x, m.pos.z);
    if (d < 2.7 && laju > 4 && state.crashCd <= 0) {
      state.crashCd = 0.8;
      pemain.nyawa = Math.max(0, pemain.nyawa - 8);
      hud.aturNyawa(pemain.nyawa);
      hud.kilat('Tabrakan! Nyawa -8', 1.4);
      m.laju *= 0.4;
      sound.blip(180, 0.18, 'sawtooth', 0.3);
      tambahWanted(0.2);
    } else if (d < 5.6 && laju > 10 && state.nearCd <= 0) {
      state.nearCd = 1.2;
      skor.tambah(SKOR.nyaris, 'Nyaris tabrak');
    }
  }
}

// ---------- tembak ----------
function tembak() {
  if (!state.started || state.paused) return;
  const asal = pemain.diMobil
    ? new T.Vector3(pemain.diMobil.pos.x, 1.2, pemain.diMobil.pos.z)
    : new T.Vector3(pemain.pos.x, 1.2, pemain.pos.z);
  const { yaw, pitch } = masukan.pandang();
  let arah;
  if (pemain.diMobil) {
    arah = new T.Vector3(Math.sin(pemain.heading), 0, Math.cos(pemain.heading));
  } else {
    arah = new T.Vector3(
      Math.sin(yaw) * Math.cos(pitch),
      Math.sin(pitch),
      Math.cos(yaw) * Math.cos(pitch),
    );
  }
  const mesh = new T.Mesh(geoPeluru, matPeluru);
  mesh.position.copy(asal);
  mesh.userData = { vx: arah.x * 90, vy: arah.y * 90, vz: arah.z * 90, sisa: 1.6 };
  scene.add(mesh);
  peluru.push(mesh);
  sound.tembak();
}

function langkahPeluru(dt) {
  for (let i = peluru.length - 1; i >= 0; i--) {
    const p = peluru[i];
    p.position.x += p.userData.vx * dt;
    p.position.y += p.userData.vy * dt;
    p.position.z += p.userData.vz * dt;
    p.userData.sisa -= dt;

    let kena = false;
    for (const pol of polisi) {
      if (!pol.kelompok.visible) continue;
      if (jarak2(p.position.x, p.position.z, pol.pos.x, pol.pos.z) < 1.8 && p.position.y < 1.8) {
        kena = true;
        pol.laju *= 0.4;
        skor.tambah(SKOR.polisi, 'Polisi terkena');
        hud.kilat('Polisi terkena tembakan!', 1.4);
        break;
      }
    }
    if (!kena) {
      for (const ped of pejalan) {
        if (jarak2(p.position.x, p.position.z, ped.pos.x, ped.pos.z) < 1.2 && p.position.y < 1.9) {
          kena = true;
          ped.panik = true;
          skor.tambah(SKOR.pejalan, 'Pejalan kena');
          hud.kilat('Pejalan kena! Polisi makin agresif.', 1.6);
          tambahWanted(1);
          break;
        }
      }
    }
    if (kena || p.userData.sisa <= 0 || p.position.y < 0) {
      scene.remove(p);
      peluru.splice(i, 1);
    }
  }
}

// ---------- misi ----------
function jalankanMisi(dt) {
  if (!state.started || !misi.aktif) return;
  const pos = pemain.pos;

  if (misi.aktif.jenis === 'kumpul') {
    misi.sisa -= dt;
    for (const t of misi.aktif.titik) {
      if (!t.diambil && jarak2(pos.x, pos.z, t.x, t.z) < MISI_TARGET_JARAK) {
        t.diambil = true;
        misi.terkumpul += 1;
        beriUang(150);
        hud.kilat('Kantong pasir +$150', 1.6);
        sound.blip(880, 0.12, 'sine', 0.25);
      }
    }
    if (misi.terkumpul >= misi.aktif.jumlah) selesaiMisi();
    else if (misi.sisa <= 0) gagalMisi('Waktu habis.');
  } else if (misi.aktif.jenis === 'hindar') {
    misi.sisa -= dt;
    if (state.wanted <= 0 && misi.indeks === 2) selesaiMisi();
    else if (misi.sisa <= 0) gagalMisi('Waktu habis.');
  } else if (misi.aktif.jenis === 'sprint') {
    misi.sisa -= dt;
    misi.tambahJarak(pos);
    if (misi.jarak >= misi.aktif.jarak) selesaiMisi();
    else if (misi.sisa <= 0) gagalMisi('Waktu habis.');
  } else if (misi.aktif.jenis === 'parkir') {
    misi.sisa -= dt;
    const t = misi.aktif.target;
    if (jarak2(pos.x, pos.z, t.x, t.z) < 3.2 && Math.abs(pemain.diMobil?.laju ?? 99) < 0.6) {
      skor.tambah(SKOR.parkir, 'Parkir presisi');
      selesaiMisi();
    } else if (misi.sisa <= 0) gagalMisi('Waktu habis.');
  } else if (misi.aktif.jenis === 'curi') {
    if (pemain.diMobil === mobilCuri && jarak2(pos.x, pos.z, misi.aktif.target.x, misi.aktif.target.z) < 10) {
      selesaiMisi();
    }
  }
}

const MISI_TARGET_JARAK = 4;

function selesaiMisi() {
  const m = misi.aktif;
  beriUang(m.hadiah);
  skor.tambah(SKOR.misi, m.judul);
  hud.kilat(`Misi selesai: ${m.judul} (+$${m.hadiah})`, 3.4);
  sound.blip(740, 0.2, 'triangle', 0.3);
  misi.aktif = null;
  misi.indeks += 1;
  simpan();
  if (misi.indeks >= DAFTAR_MISI.length) {
    akhiri('Kamu menguasai Kota Karang.');
  } else {
    misi.mulai(DAFTAR_MISI[misi.indeks]);
  }
}

function gagalMisi(alasan) {
  hud.kilat(`Misi gagal: ${alasan}`, 3);
  misi.aktif = null;
  misi.mulai(DAFTAR_MISI[misi.indeks]);
}

function akhiri(pesan) {
  state.started = false;
  state.paused = true;
  sound.sirene(false);
  sound.mesin(0);
  teksAkhir.textContent = pesan;
  layarAkhir.classList.add('on');
  document.exitPointerLock?.();
}

// ---------- mulai / lanjut ----------
function begin(lanjutkan) {
  if (state.started) return;
  if (lanjutkan && muat()) {
    hud.kilat('Simpanan dimuat.', 1.8);
  } else if (lanjutkan && !muat()) {
    lanjutkan = false;
  }
  state.started = true;
  state.paused = false;
  overlay.classList.add('hidden');
  hud.tampil(true);
  hud.aturUang(state.uang);
  hud.aturWanted(state.wanted);
  hud.aturNyawa(pemain.nyawa);
  hud.aturSkor(skor);
  sound.lanjut();
  sound.musik(true);
  if (lanjutkan) sound.sirene(state.wanted > 0);
  if (!misi.aktif) misi.mulai(DAFTAR_MISI[misi.indeks]);
}

function berhenti() {
  state.paused = !state.paused;
  if (state.paused) {
    sound.mesin(0);
    sound.sirene(false);
    overlay.classList.remove('hidden');
    document.exitPointerLock?.();
  } else {
    overlay.classList.add('hidden');
    sound.lanjut();
    if (state.wanted > 0) sound.sirene(true);
  }
}

// ---------- loop ----------
let terakhir = performance.now();
function loop(now) {
  window.__frame = (window.__frame || 0) + 1;
  const dt = Math.min((now - terakhir) / 1000, MAX_FRAME);
  terakhir = now;
  const { yaw, pitch } = masukan.pandang();

  if (state.started && !state.paused) {
    const aksi = masukan.ambilAksi();
    if (aksi & AKSI_TEMBAK) tembak();
    if (aksi & AKSI_JEDA) berhenti();

    pemain.lentur(dt, masukan.gerak(), yaw, setengahKota);
    kendalikanMobil(dt);
    for (const m of lalu) {
      if (m.pengemudi === 'lalu') {
        m.gerak(dt);
        if (Math.abs(m.pos.x) > setengahKota + 8 || Math.abs(m.pos.z) > setengahKota + 8) {
          const j = dunia.jalan[Math.floor(Math.random() * dunia.jalan.length)];
          const sepanjang = acak(-setengahKota, setengahKota);
          const lajur = (Math.random() < 0.5 ? -1 : 1) * 2.6;
          if (j.vertikal) { m.pos.set(j.di + lajur, 0, sepanjang); m.heading = Math.random() < 0.5 ? 0 : Math.PI; }
          else { m.pos.set(sepanjang, 0, j.di + lajur); m.heading = Math.random() < 0.5 ? Math.PI / 2 : -Math.PI / 2; }
          m.kelompok.position.copy(m.pos);
          m.kelompok.rotation.y = m.heading;
        }
      }
    }
    interaksiLalu(dt);
    langkahPeluru(dt);

    const aktif = state.wanted > 0;
    polisi.forEach((p, i) => {
      p.kelompok.visible = i < state.wanted;
      const target = pemain.diMobil
        ? { x: pemain.diMobil.pos.x, z: pemain.diMobil.pos.z }
        : { x: pemain.pos.x, z: pemain.pos.z };
      const kecepatanSasaran = pemain.diMobil
        ? { x: Math.sin(pemain.heading) * pemain.diMobil.laju, z: Math.cos(pemain.heading) * pemain.diMobil.laju }
        : { x: Math.sin(pemain.heading) * pemain.laju, z: Math.cos(pemain.heading) * pemain.laju };
      p.kejar(dt, target, aktif && i < state.wanted, kecepatanSasaran);
    });

    for (const ped of pejalan) ped.lentur(dt, pemain.pos, state.wanted > 0, pemain.diMobil ? [pemain.diMobil] : []);
    jalankanMisi(dt);
    skor.langkah(dt);
    hud.langkah(dt);

    if (aktif) {
      state.wanted = batas(state.wanted - dt / POLISI.decay, 0, 5);
      hud.aturWanted(Math.round(state.wanted));
      if (state.wanted <= 0) sound.sirene(false);
    }

    siklus.langkah(dt);
    state.minimapCd -= dt;
    if (state.minimapCd <= 0) {
      state.minimapCd = 0.1;
      const m = misi.aktif;
      let penandaPos = null;
      if (m) {
        if (m.jenis === 'kumpul') {
          const t = m.titik.find((x) => !x.diambil);
          penandaPos = t ? { x: t.x, z: t.z } : null;
        } else {
          penandaPos = m.target;
        }
      }
      penanda.position.set(penandaPos ? penandaPos.x : 0, 0.3, penandaPos ? penandaPos.z : 0);
      penanda.visible = !!penandaPos;
      hud.gambarMinimap(pemain.pos, pemain.heading, setengahKota, polisi, penandaPos, lalu, pejalan);
    }

    hud.aturObjektif(misi.teksObjektif(pemain.pos, Math.round(state.wanted)));
    hud.aturSkor(skor);
    hud.aturJam(siklus.teksJam(), siklus.gelap);
    hud.aturLaju(pemain.diMobil ? pemain.diMobil.laju : pemain.laju, !!pemain.diMobil);
  }

  siklus.terapkan(scene, matahari, ambient, dunia.lampu);
  const target = pemain.diMobil
    ? new T.Vector3(pemain.diMobil.pos.x, 1.1, pemain.diMobil.pos.z)
    : new T.Vector3(pemain.pos.x, 1.5, pemain.pos.z);
  const kameraOffset = new T.Vector3(
    Math.sin(yaw) * Math.cos(pitch) * -6.5,
    2.4 - pitch * 5,
    Math.cos(yaw) * Math.cos(pitch) * -6.5,
  );
  camera.position.copy(target).add(kameraOffset);
  camera.lookAt(target.x, target.y + 0.5, target.z);

  renderer.render(scene, camera);
}

// ---------- mode shot ----------
const mode = tataShot(query.shot || '', {
  pemain, kamera: camera, lalu, polisi, pejalan, setengahKota, hud, overlay, siklus,
});
if (mode !== 'none') {
  state.started = false;
  // Biarkan animasi jalan di mode shot supaya gambar terlihat hidup.
  const acakAnim = setInterval(() => {
    pemain.animasi();
    for (const p of polisi) { p.kedip += 0.2; }
    for (const m of lalu) { m.gerak(0.016); }
  }, 50);
  setTimeout(() => clearInterval(acakAnim), 1200);
  requestAnimationFrame(loop);
} else {
  requestAnimationFrame(loop);
}

window.__kotaDebug = () => ({ started: state.started, paused: state.paused, misi: misi.indeks, aktif: misi.aktif?.id ?? null, wanted: state.wanted });
btnMulai.addEventListener('click', () => {
  localStorage.removeItem(KUNCI_SIMPAN);
  state.wanted = 0;
  state.uang = 0;
  misi.indeks = 0;
  misi.aktif = null;
  pemain.nyawa = 100;
  begin(false);
});
btnLanjut.addEventListener('click', () => begin(true));
btnMainLagi.addEventListener('click', () => window.location.reload());

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

document.addEventListener('visibilitychange', () => {
  if (document.hidden) terakhir = performance.now();
});
