// boot.js — titik masuk Kota Karang: merakit renderer, pulau, langit, suara,
// pemain, lalu lintas, pejalan kaki, polisi, ekonomi, misi, HUD dan kamera
// menjadi satu lingkaran permainan. Juga menangani mulai / jeda / simpan /
// muat, masuk-keluar mobil, penangkapan, dan mode tangkapan layar (?shot=).

import { makeRng } from './rng.js';
import { TUNE, MISSIONS, SAVE_KEY, roadLine } from './tune.js';
import { buildIsland } from './island.js';
import { createAtmosphere } from './atmos.js';
import { createSfx } from './sfx.js';
import { createInput } from './keys.js';
import { createWalker } from './onfoot.js';
import { createDriving } from './cars.js';
import { createCrowd } from './crowd.js';
import { createPolice } from './police.js';
import { createBank } from './bank.js';
import { createMissions } from './missions.js';
import { createHud } from './hud.js';
import { createCamera } from './camera.js';

const params = new URLSearchParams(location.search);
const shotMode = params.get('shot');

// --- Renderer & dunia ------------------------------------------------------
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
if (THREE.sRGBEncoding !== undefined) renderer.outputEncoding = THREE.sRGBEncoding;
document.getElementById('scene').appendChild(renderer.domElement);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(62, window.innerWidth / window.innerHeight, 0.1, 1200);
const cam = createCamera();
cam.setAerial(40, 150, 210, 0, 0, 0); // latar menu: kota dari udara

const rng = makeRng(20261123);
const island = buildIsland(scene, rng);
const atmos = createAtmosphere(scene);
const sfx = createSfx();
const input = createInput();
const walker = createWalker(scene);
walker.setPosition(0, 56, Math.PI);

let lastCrashAt = 0;
const driving = createDriving(scene, rng, island.colliders, {
  onCrash(impact, pos) {
    const now = performance.now();
    if (now - lastCrashAt < 500) return;
    lastCrashAt = now;
    hud.damageFlash();
    sfx.crash();
    crowd.scareNear(pos.x, pos.z, 14);
    if (impact > 18) police.addWanted(1, 'tabrakan keras');
  },
});
const crowd = createCrowd(scene, rng, island.colliders);

const playerPos = () => (driving.player.inCar ? driving.player.pos : walker.state.pos);
const playerHeading = () => (driving.player.inCar ? driving.player.heading : walker.state.heading);
const playerSpeed = () => (driving.player.inCar ? driving.player.speed : walker.state.speed);

const police = createPolice(scene, rng, island.colliders, {
  playerPos,
  playerHeading,
  onWanted(n, reason) {
    hud.setStars(n);
    if (n > 0) hud.toast('Buronan naik: ' + n + ' bintang! (' + reason + ')');
  },
  onSiren(on) { sfx.siren(on); },
  onBusted() { bustPlayer(); },
  onRam() {
    if (driving.player.inCar) {
      driving.player.speed *= 0.65;
      hud.damageFlash();
      sfx.crash();
    }
  },
  onRoadblock() { hud.toast('Roadblock polisi di depan!'); },
});

const bank = createBank({
  onMoney(amount, reason, total) { hud.setMoney(total); },
  onCombo(n) { hud.showCombo(n); },
  onComboEnd() { hud.hideCombo(); },
  onFuelEmpty() { hud.toast('BBM habis! Cari pom bensin (ikon merah di peta).'); },
});

let freeMode = false;
let playerCarSpot = null;

const missionCtx = {
  scene, rng, landmarks: island.landmarks, driving, crowd, police, bank, atmos, sfx,
  hud: null, // diisi setelah hud dibuat (objek yang sama dipakai missions.js)
  playerPos,
  onAllComplete() {
    freeMode = true;
    hud.showEnd('Raka menembus Badai Karang dan menyalakan mercusuar. Kota Karang kini milikmu — 7 misi selesai, $' + bank.state.money.toLocaleString('en-US') + ' di kantong. Jelajahi pulau sesukamu!');
  },
  onMissionFailed() { /* toast sudah ditampilkan missions.js */ },
};
const missions = createMissions(missionCtx);

const hud = createHud({
  onStart(useSave) { startGame(useSave); },
  onResume() { setPaused(false); },
  onSave() { saveGame(); hud.toast('Permainan disimpan.'); },
  onRestart() { localStorage.removeItem(SAVE_KEY); location.reload(); },
  onAgain() { hud.hideEnd(); freeMode = true; },
});
missionCtx.hud = hud;

let started = false;
let paused = false;
let photo = false;
let bustCooldown = 0;

function bustPlayer() {
  if (performance.now() - bustCooldown < 3000) return;
  bustCooldown = performance.now();
  const fine = Math.min(200, bank.state.money);
  bank.state.money -= fine;
  hud.setMoney(bank.state.money);
  police.reset();
  if (driving.player.inCar) {
    playerCarSpot = { x: driving.player.pos.x, z: driving.player.pos.z, kind: driving.player.kind, color: driving.player.color };
    driving.player.inCar = false;
    sfx.engine(false);
  }
  walker.setPosition(island.landmarks.market.x + 4, island.landmarks.market.z + 12, 0);
  cam.snapBehind(0);
  sfx.fail();
  hud.toast('Ditangkap polisi! Denda $' + fine + '. Kamu dibebaskan di pasar.');
}

function saveGame() {
  const p = playerPos();
  const data = {
    money: bank.state.money,
    fuel: bank.state.fuel,
    mission: missions.index,
    x: p.x, z: p.z,
    hour: atmos.state.hour,
  };
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(data)); } catch (e) { /* abaikan */ }
}

function loadSave() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) { return null; }
}

function startGame(useSave) {
  sfx.unlock();
  hud.hideStart();
  started = true;
  cam.clearAerial();
  cam.snapBehind(walker.state.heading);
  renderer.domElement.addEventListener('click', () => {
    if (started && !paused && !photo) input.lockPointer(renderer.domElement);
  });
  const save = useSave ? loadSave() : null;
  if (save) {
    bank.load(save);
    hud.setMoney(bank.state.money);
    walker.setPosition(save.x, save.z, 0);
    atmos.setHour(save.hour || TUNE.startHour);
    missions.skipTo(Math.max(0, save.mission || 0));
    hud.toast('Simpanan dimuat. Selamat datang kembali di Kota Karang!');
  } else {
    missions.start(0);
  }
}

function setPaused(on) {
  paused = on;
  if (on) {
    input.unlockPointer();
    hud.showPause('Uang $' + Math.floor(bank.state.money).toLocaleString('en-US') + ' · Misi ' + (missions.index + 1) + '/7 · Jam ' + atmos.clockText());
  } else {
    hud.hidePause();
  }
}

function togglePhoto() {
  photo = !photo;
  cam.setPhoto(photo);
  hud.setPhotoMode(photo);
  if (photo) input.unlockPointer();
  hud.toast(photo ? 'Mode foto: HUD disembunyikan. P lagi untuk kembali.' : 'Mode foto mati.');
}

// --- Masuk / keluar mobil ---------------------------------------------------
function tryEnterExitCar() {
  if (driving.player.inCar) {
    const spot = driving.exitCar();
    playerCarSpot = { x: driving.player.pos.x, z: driving.player.pos.z, kind: driving.player.kind, color: driving.player.color };
    walker.setPosition(spot.x, spot.z, driving.player.heading);
    cam.snapBehind(driving.player.heading);
    sfx.engine(false);
    return;
  }
  const wp = walker.state.pos;
  if (playerCarSpot && Math.hypot(wp.x - playerCarSpot.x, wp.z - playerCarSpot.z) < 5.5) {
    driving.placePlayerCar(playerCarSpot.x, playerCarSpot.z, 0, playerCarSpot.kind, playerCarSpot.color);
    driving.player.inCar = true;
    playerCarSpot = null;
    sfx.engine(true, 0);
    return;
  }
  const target = driving.nearestStealable(wp, 5.5);
  if (target) {
    driving.enterCar(target);
    police.addWanted(1, 'mencuri mobil');
    hud.toast('Mobil dicuri! Polisi mengejarmu — 1 bintang.');
    sfx.engine(true, 0);
  }
}

// --- Mode tangkapan layar (?shot=1..4&auto=1) -------------------------------
function applyShot(n) {
  started = true;
  hud.hideStart();
  cam.clearAerial();
  if (n === 1) {
    // Sampul: kota dari udara di siang hari, misi pertama aktif.
    atmos.setHour(10);
    missions.start(0);
    walker.setPosition(island.landmarks.market.x + 4, island.landmarks.market.z + 10, 0);
    cam.setAerial(70, 165, 185, -10, 0, -10);
  } else if (n === 2) {
    // Jalan kaki di pasar pagi, koin emas di depan.
    atmos.setHour(9);
    missions.start(0);
    walker.setPosition(island.landmarks.market.x + 6, island.landmarks.market.z + 12, Math.PI);
    cam.snapBehind(Math.PI);
    cam.update(0.5, { x: walker.state.pos.x, y: 1.5, z: walker.state.pos.z }, 'foot', { yaw: 0, pitch: 0 });
  } else if (n === 3) {
    // Kejar-kejaran sore: 3 bintang, polisi mengejar dari depan dan belakang.
    atmos.setHour(17.4);
    driving.placePlayerCar(roadLine(4), -60, 0, 'sedan', 0xd23b2e);
    driving.player.inCar = true;
    driving.player.speed = 12;
    missions.skipTo(3); // Misi 4 Kejar Pencuri: mobil pencuri ikut di jalan.
    police.setWanted(3, 'kejar-kejaran');
    // Dua unit polisi dipentaskan di depan pemain, menghadap pemain, supaya
    // terlihat jelas di frame (polisi dibekukan selama mode tangkapan layar).
    const ahead = [15, 28];
    police.units.slice(0, 2).forEach((u, i) => {
      u.pos.set(roadLine(4) + (i === 0 ? -3 : 3), 0, ahead[i]);
      u.heading = Math.PI;
      u.speed = 0;
      u.mesh.position.copy(u.pos);
      u.mesh.rotation.y = u.heading;
    });
    cam.snapBehind(0);
    cam.update(0.5, { x: roadLine(4), y: 1.5, z: -60 }, 'car', { yaw: 0, pitch: 0 });
  } else if (n === 4) {
    // Badai: van logistik menembus hujan menuju mercusuar, roadblock di depan.
    missions.skipTo(6);
    atmos.setHour(17.6); // senja badai: gelap dramatis tapi tetap terbaca
    const block = police.blocks[0];
    const bx = block ? block.x : 60;
    const bz = block ? block.z : roadLine(6);
    // Van ditempatkan jauh sebelum roadblock supaya saat jepretan diambil
    // ia masih melaju mendekatinya, bukan menempel di barier.
    driving.placePlayerCar(bx - 82, bz, Math.PI / 2, 'van', 0x3f6fb5);
    driving.player.inCar = true;
    driving.player.speed = 11;
    cam.snapBehind(Math.PI / 2);
    cam.update(0.5, { x: bx - 82, y: 1.5, z: bz }, 'car', { yaw: 0, pitch: 0 });
  }
  // Sinkronkan mesh polisi ke posisinya: tanpa update() per-frame (dibekukan
  // di mode tangkapan layar), mesh unit yang baru di-spawn masih di titik nol.
  for (const u of police.units) {
    u.mesh.position.copy(u.pos);
    u.mesh.rotation.y = u.heading;
  }
}

// --- Lingkaran permainan ----------------------------------------------------
const clock = new THREE.Clock();

function frame() {
  requestAnimationFrame(frame);
  const dt = Math.min(clock.getDelta(), 0.05);
  const look = input.look();

  if (started && !paused) {
    if (input.wasPressed('KeyE')) tryEnterExitCar();
    if (input.wasPressed('KeyP')) togglePhoto();
    if (input.wasPressed('KeyM')) {
      const m = sfx.toggleMute();
      hud.toast(m ? 'Suara dimatikan.' : 'Suara dihidupkan.');
    }
    if (input.wasPressed('Escape')) setPaused(true);
    if (input.wasPressed('KeyR')) { missions.restart(); hud.toast('Misi diulang dari awal.'); }

    const inCar = driving.player.inCar;
    if (inCar) {
      const res = driving.updatePlayer(dt, input);
      hud.setSpeed(res.speedKmh);
      sfx.engine(true, Math.abs(driving.player.speed) / TUNE.carMaxSpeed);
      if (bank.state.fuel <= 0) driving.player.speed *= (1 - 1.6 * dt);
      // Mode tangkapan layar: tidak ada tombol ditekan, jadi mobil dijaga
      // tetap melaju (cruise) supaya jepretan menunjukkan kendaraan bergerak.
      if (shotMode && driving.player.speed < 11) driving.player.speed = 11;
    } else {
      walker.update(dt, input, cam.yaw, island.colliders);
      hud.setSpeed(walker.state.moving ? walker.state.speed * 3.6 : 0);
      sfx.engine(false);
    }

    const p = playerPos();
    const nearPump = Math.hypot(p.x - island.landmarks.gas.x, p.z - island.landmarks.gas.z) < 9;
    bank.update(dt, inCar && Math.abs(driving.player.speed) > 0.5, nearPump);
    hud.setFuel(bank.state.fuel / TUNE.fuelMax);

    crowd.update(dt, p, Math.abs(playerSpeed()), (person) => {
      police.addWanted(1, 'menabrak pejalan kaki');
      hud.toast('Kamu menabrak pejalan kaki! +1 bintang.');
      sfx.crash();
    });
    // Mode tangkapan layar: polisi dibekukan pada posisi pentas supaya
    // komposisi jepretan stabil; di permainan biasa mereka mengejar bebas.
    if (!shotMode) police.update(dt, p, inCar, playerSpeed());
    missions.update(dt, { pos: p });
    atmos.update(dt, p);
    hud.setClock(atmos.clockText());

    cam.update(dt, { x: p.x, y: 1.6, z: p.z }, inCar ? 'car' : 'foot', look);
    hud.drawMinimap({
      player: { x: p.x, z: p.z, heading: playerHeading() },
      police: police.units.map((u) => ({ x: u.pos.x, z: u.pos.z })),
      cars: driving.cars.map((c) => ({ x: c.mesh.position.x, z: c.mesh.position.z })),
      beacon: missions.index >= 0 && !missions.done ? missions.beaconPos() : null,
      landmarks: island.landmarks,
    });
    driving.updateTraffic(dt, p);
  } else if (!started) {
    // Menu: kamera mengorbit perlahan di atas kota.
    cam.update(dt, { x: 0, y: 2, z: 0 }, 'foot', { yaw: dt * 0.1, pitch: 0 });
    atmos.update(dt, { x: 0, z: 0 });
  }

  cam.apply(camera);
  renderer.render(scene, camera);
  input.poll();
}

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

if (shotMode) {
  // Tangkap layar otomatis: langsung masuk permainan tanpa layar mulai.
  applyShot(parseInt(shotMode, 10) || 1);
}

// Pegangan baca-saja untuk pengujian (konsol peramban): posisi pemain,
// misi, polisi, uang. Tidak mengubah permainan.
window.__kota = { walker, driving, missions, police, bank, atmos, island };

frame();
