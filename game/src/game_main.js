// Kota Karang — an original open-world crime game entry for make.fun gta6-01.
// Entry point: builds the world, runs the loop, wires input, HUD, missions,
// wanted level, save/continue and the ?shot= scenes used for screenshots.
import { buildCity } from './city.js';
import { Player } from './player.js';
import { Car, spawnTraffic } from './vehicles.js';
import { spawnPedestrians } from './pedestrians.js';
import { spawnPolice } from './police.js';
import { MissionState, MISSIONS } from './missions.js';
import { Hud } from './hud.js';
import { createInput, ACTION_CAR, ACTION_FIRE, ACTION_PAUSE } from './input.js';
import { GtaSound } from './gta_sound.js';
import { readShotQuery, stageShot } from './shots.js';
import { CAR, TRAFFIC, PEDS, POLICE, MISSION, SAVE_KEY } from './config.js';
import { clamp } from './world_config.js';

const T = window.THREE;
const shot = readShotQuery();

// ---------- renderer / scene ----------
const app = document.getElementById('app');
const renderer = new T.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
app.appendChild(renderer.domElement);

const scene = new T.Scene();
scene.background = new T.Color(0x87b5d9);
scene.fog = new T.Fog(0x87b5d9, 120, 420);

const camera = new T.PerspectiveCamera(62, window.innerWidth / window.innerHeight, 0.1, 900);

scene.add(new T.HemisphereLight(0xbfdcff, 0x3a4a3a, 0.85));
const sun = new T.DirectionalLight(0xfff2d0, 0.9);
sun.position.set(-120, 180, 90);
scene.add(sun);

// ---------- world ----------
const city = buildCity(scene, shot.seed);
const half = city.half;
const bounds = half - 4;

const player = new Player(scene);
const traffic = spawnTraffic(scene, city.roads, TRAFFIC.count);
const peds = spawnPedestrians(scene, half, PEDS.count);
const police = spawnPolice(scene, POLICE.count);

// parked cars to steal
const parked = [];
const PARK_COLORS = [0xc0392b, 0x2980b9, 0x27ae60, 0xf39c12];
for (let i = 0; i < 8; i++) {
  const c = new Car(scene, PARK_COLORS[i % 4]);
  const along = -half + 20 + i * 110;
  c.pos.set((i % 2 ? -1 : 1) * (6 + (i % 3)), 0, along);
  c.heading = i % 2 ? Math.PI / 2 : -Math.PI / 2;
  c.group.position.copy(c.pos);
  c.group.rotation.y = c.heading;
  parked.push(c);
}

// ---------- systems ----------
const hud = new Hud();
const input = createInput(renderer.domElement);
const sound = new GtaSound();
const missions = new MissionState();

const state = {
  cash: 0,
  wanted: 0,
  wantedTimer: 0,
  started: false,
  paused: false,
  over: false,
  currentCar: null,
  saveTimer: 0,
};

function save() {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify({
      cash: state.cash,
      wanted: state.wanted,
      pos: { x: player.pos.x, z: player.pos.z },
      missionIndex: missions.index,
    }));
  } catch {}
}

function load() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return false;
    const d = JSON.parse(raw);
    state.cash = d.cash ?? 0;
    state.wanted = d.wanted ?? 0;
    player.pos.set(d.pos?.x ?? 0, 0, d.pos?.z ?? 0);
    missions.index = d.missionIndex ?? 0;
    return true;
  } catch {
    return false;
  }
}

const overlay = document.getElementById('overlay');
const btnStart = document.getElementById('btn-start');
const btnContinue = document.getElementById('btn-continue');
if (localStorage.getItem(SAVE_KEY)) btnContinue.style.display = '';

function startMission(m) {
  missions.start(m);
  hud.flash(`Misi: ${m.title} — ${m.briefing}`, 3.5);
  sound.blip(880, 0.12, 'square', 0.25);
}

function begin(fresh) {
  if (fresh && !state.started) {
    state.cash = 0;
    state.wanted = 0;
    missions.index = 0;
    missions.active = null;
    try { localStorage.removeItem(SAVE_KEY); } catch {}
  } else if (!fresh) {
    load();
  }
  state.started = true;
  state.paused = false;
  overlay.classList.add('hidden');
  hud.show(true);
  hud.setCash(state.cash);
  hud.setWanted(state.wanted);
  sound.resume();
  sound.music(true);
  if (!missions.active) startMission(MISSIONS[missions.index]);
}

btnStart.addEventListener('click', () => begin(true));
btnContinue.addEventListener('click', () => begin(false));

// ---------- shooting ----------
const bullets = [];
function fireBullet() {
  const dir = new T.Vector3();
  camera.getWorldDirection(dir);
  const mesh = new T.Mesh(
    new T.BoxGeometry(0.06, 0.06, 1.4),
    new T.MeshBasicMaterial({ color: 0xffe08a }),
  );
  const origin = player.inCar ? player.inCar.mesh.position.clone() : player.pos.clone();
  origin.y += 1.3;
  mesh.position.copy(origin).addScaledVector(dir, 1.2);
  mesh.lookAt(origin.clone().addScaledVector(dir, 10));
  scene.add(mesh);
  bullets.push({ mesh, dir, life: 1.2 });
  sound.shot();
  addWanted(0.4);
}

function addWanted(amount) {
  state.wanted = clamp(state.wanted + amount, 0, 5);
  hud.setWanted(state.wanted);
}

// ---------- wanted / police ----------
function updateWanted(dt) {
  if (state.wanted > 0) {
    state.wantedTimer -= dt;
    if (state.wantedTimer <= 0) {
      state.wanted = Math.max(0, state.wanted - 1);
      hud.setWanted(state.wanted);
      state.wantedTimer = POLICE.wantedDecaySeconds;
    }
  }
  const active = state.wanted > 0;
  police.forEach((p, i) => {
    p.group.visible = active && i < state.wanted;
    if (p.group.visible) {
      const target = player.inCar ? player.inCar.mesh.position : player.pos;
      p.update(dt, target, true);
    }
  });
  sound.siren(active);
}

// ---------- mission progress ----------
function updateMission(dt) {
  const m = missions.active;
  if (!m) return;
  const pos = player.inCar ? player.inCar.mesh.position : player.pos;

  if (m.kind === 'go' || m.kind === 'steal') {
    const d = Math.hypot(pos.x - m.target.x, pos.z - m.target.z);
    if (d < MISSION.arriveRadius) completeMission(m);
  } else if (m.kind === 'collect') {
    missions.timer -= dt;
    for (const spot of m.spots) {
      if (spot.taken) continue;
      if (Math.hypot(pos.x - spot.x, pos.z - spot.z) < MISSION.pickupRadius) {
        spot.taken = true;
        missions.collected += 1;
        sound.blip(1200, 0.1, 'sine', 0.3);
        hud.flash(`Kantong ${missions.collected}/${m.count}`, 1.6);
      }
    }
    if (missions.collected >= m.count) completeMission(m);
    if (missions.timer <= 0) failMission('Waktu habis.');
  } else if (m.kind === 'evade') {
    if (state.wanted === 0) completeMission(m);
  }
  hud.setObjective(missions.objectiveText(pos, state.wanted));
}

function completeMission(m) {
  state.cash += m.reward;
  hud.setCash(state.cash);
  hud.flash(`Selesai: ${m.title} (+$${m.reward})`, 3);
  sound.blip(1040, 0.2, 'triangle', 0.3);
  missions.active = null;
  missions.next();
  setTimeout(() => { if (state.started && !missions.active) startMission(MISSIONS[missions.index]); }, 2500);
  save();
}

function failMission(text) {
  hud.flash(text, 2.5);
  missions.active = null;
  setTimeout(() => { if (state.started && !missions.active) startMission(MISSIONS[missions.index]); }, 2200);
}

// ---------- car enter / exit ----------
function nearestCar() {
  let best = null, bd = CAR.enterRange;
  const all = [...traffic, ...parked];
  for (const c of all) {
    const d = Math.hypot(c.mesh.position.x - player.pos.x, c.mesh.position.z - player.pos.z);
    if (d < bd) { bd = d; best = c; }
  }
  return best;
}

function toggleCar() {
  if (player.inCar) {
    const car = player.inCar;
    car.driver = null;
    player.exitCar();
    state.currentCar = null;
    sound.engine(0);
    return;
  }
  const car = nearestCar();
  if (!car) return;
  player.enterCar(car);
  car.driver = 'player';
  state.currentCar = car;
  addWanted(CAR.stealWanted);
  hud.flash('Mobil dicuri', 1.4);
  sound.blip(440, 0.1, 'square', 0.2);
}

// ---------- driving ----------
function driveCar(dt, move) {
  const car = player.inCar;
  if (!car) return;
  const top = CAR.topSpeed;
  car.speed += (move.y * top - car.speed) * Math.min(1, dt * CAR.acceleration);
  if (move.braking) car.speed *= Math.pow(CAR.brakeDamping, dt);
  if (Math.abs(car.speed) > 0.4) {
    car.heading += move.x * dt * CAR.turnRate * Math.sign(car.speed) * Math.min(1, Math.abs(car.speed) / 6);
  }
  car.pos.x = clamp(car.pos.x + Math.sin(car.heading) * car.speed * dt, -bounds, bounds);
  car.pos.z = clamp(car.pos.z + Math.cos(car.heading) * car.speed * dt, -bounds, bounds);
  car.group.position.copy(car.pos);
  car.group.rotation.y = car.heading;
  for (const w of car.wheels) w.rotation.x += car.speed * dt * 2.2;
  sound.engine(Math.abs(car.speed) / top);
}

// ---------- camera ----------
function updateCamera(dt, yaw) {
  if (player.inCar) {
    const car = player.inCar;
    const back = new T.Vector3(Math.sin(car.heading), 0, Math.cos(car.heading)).multiplyScalar(-9);
    const want = car.mesh.position.clone().add(back).add(new T.Vector3(0, 4.2, 0));
    camera.position.lerp(want, Math.min(1, dt * 5));
    camera.lookAt(car.mesh.position.x, 1.4, car.mesh.position.z);
  } else {
    const want = new T.Vector3(
      player.pos.x - Math.sin(yaw) * 6.5,
      player.pos.y + 3.2,
      player.pos.z - Math.cos(yaw) * 6.5,
    );
    camera.position.lerp(want, Math.min(1, dt * 8));
    camera.lookAt(player.pos.x, 1.6, player.pos.z);
  }
}

// ---------- shot mode ----------
const shotCtx = { player, camera, traffic, police, pedestrians: peds, cityHalf: half, hud, overlay };
const staged = state.started ? '' : stageShot(shot.shot, shotCtx);

// ---------- main loop ----------
let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;

  if (state.started && !state.paused && !state.over) {
    const actions = input.takeActions();
    const move = input.move();
    const look = input.look();

    if (actions & ACTION_PAUSE) {
      state.paused = !state.paused;
      overlay.classList.toggle('hidden', !state.paused);
    }
    if (actions & ACTION_CAR) toggleCar();
    if ((actions & ACTION_FIRE) && !player.inCar) fireBullet();

    if (player.inCar) driveCar(dt, move);
    else player.update(dt, move, look.yaw, bounds);
    updateCamera(dt, look.yaw);

    for (const t of traffic) if (t.driver === 'traffic') t.update(dt);
    for (const p of peds) p.update(dt, player.pos, state.wanted > 0);
    updateWanted(dt);
    updateMission(dt);
    hud.update(dt);
    const marker = missions.active?.target ?? missions.active?.spots?.find((s) => !s.taken) ?? null;
    hud.drawMinimap(
      player.inCar ? player.inCar.mesh.position : player.pos,
      player.inCar ? player.inCar.heading : player.heading,
      half,
      police.filter((p) => p.group.visible),
      marker,
    );

    state.saveTimer -= dt;
    if (state.saveTimer <= 0) { save(); state.saveTimer = 5; }
  }

  renderer.render(scene, camera);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

console.log('[kota-karang]', staged || 'free play', 'seed', shot.seed);
