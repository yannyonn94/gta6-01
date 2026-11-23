// atmos.js — langit Kota Karang: siklus siang-malam, matahari, kabut, dan
// badai (hujan + kilat + angin) untuk misi terakhir. Semua cahaya diatur
// dari satu jam permainan supaya tangkapan layar bisa memakai jam tetap.

import { TUNE } from './tune.js';

export function createAtmosphere(scene) {
  const sun = new THREE.DirectionalLight(0xfff2d0, 1.1);
  sun.position.set(120, 180, 60);
  scene.add(sun);
  const hemi = new THREE.HemisphereLight(0xbfd9ff, 0x3d5a3a, 0.85);
  scene.add(hemi);
  scene.fog = new THREE.Fog(0x9fc3e0, 260, 520);
  scene.background = new THREE.Color(0x8ec8ee);

  // Hujan: 900 titik yang jatuh berulang di sekitar pemain.
  const rainCount = 900;
  const rainPos = new Float32Array(rainCount * 3);
  for (let i = 0; i < rainCount; i++) {
    rainPos[i * 3] = (Math.random() - 0.5) * 120;
    rainPos[i * 3 + 1] = Math.random() * 50;
    rainPos[i * 3 + 2] = (Math.random() - 0.5) * 120;
  }
  const rainGeo = new THREE.BufferGeometry();
  rainGeo.setAttribute('position', new THREE.BufferAttribute(rainPos, 3));
  const rain = new THREE.Points(rainGeo, new THREE.PointsMaterial({
    color: 0xbcd6e8, size: 0.35, transparent: true, opacity: 0.0,
  }));
  rain.visible = false;
  scene.add(rain);

  // Kilat: bidang putih yang berkedip sesaat.
  const flash = new THREE.Mesh(
    new THREE.PlaneGeometry(600, 600),
    new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0 })
  );
  flash.position.set(0, 120, -100);
  flash.lookAt(0, 0, 0);
  scene.add(flash);

  const state = {
    hour: TUNE.startHour,   // jam permainan 0..24
    storm: 0,               // 0 = cerah, 1 = badai penuh
    flashTimer: 0,
    rainVel: 0,
  };

  function setHour(hour) {
    state.hour = ((hour % 24) + 24) % 24;
    const t = state.hour / 24;
    // Sudut matahari: terbit 06:00, tenggelam 18:00.
    const ang = (t - 0.25) * Math.PI * 2;
    const elev = Math.sin(ang);
    sun.position.set(Math.cos(ang) * 180, Math.max(elev, -0.15) * 190 + 12, 70);
    const day = Math.max(0, Math.min(1, elev * 1.6 + 0.25));
    const dusk = Math.max(0, 1 - Math.abs(elev) * 4) * (elev > -0.1 ? 1 : 0);
    sun.intensity = Math.max(0.18, 0.25 + day * 0.95 - state.storm * 0.45);
    hemi.intensity = 0.3 + day * 0.6;
    const sky = new THREE.Color().setHSL(0.58 - dusk * 0.06, 0.65 - state.storm * 0.25, 0.32 + day * 0.42 - state.storm * 0.14);
    if (dusk > 0.25) sky.setHSL(0.05 + dusk * 0.02, 0.7, 0.45 + day * 0.15);
    scene.background = sky;
    scene.fog.color.copy(sky);
    scene.fog.near = 260 - state.storm * 120;
    scene.fog.far = 520 - state.storm * 220;
    return { day, dusk };
  }

  function setStorm(amount) {
    state.storm = Math.max(0, Math.min(1, amount));
    rain.visible = state.storm > 0.05;
    rain.material.opacity = state.storm * 0.75;
    setHour(state.hour);
  }

  function update(dt, playerPos) {
    state.hour = (state.hour + dt / TUNE.dayLength * 24) % 24;
    setHour(state.hour);
    if (state.storm > 0.05) {
      const pos = rainGeo.attributes.position.array;
      for (let i = 0; i < rainCount; i++) {
        pos[i * 3 + 1] -= dt * (28 + state.storm * 14);
        pos[i * 3] += dt * state.storm * 6; // angin mendorong hujan
        if (pos[i * 3 + 1] < 0) {
          pos[i * 3 + 1] = 45 + Math.random() * 5;
          pos[i * 3] = playerPos.x + (Math.random() - 0.5) * 120;
          pos[i * 3 + 2] = playerPos.z + (Math.random() - 0.5) * 120;
        }
      }
      rainGeo.attributes.position.needsUpdate = true;
      rain.position.set(0, 0, 0);
      // Kilat acak tiap beberapa detik saat badai.
      state.flashTimer -= dt;
      if (state.flashTimer <= 0) {
        state.flashTimer = 4 + Math.random() * 7;
        flash.material.opacity = 0.55;
        setTimeout(() => { flash.material.opacity = 0; }, 120);
        setTimeout(() => { flash.material.opacity = 0.35; }, 220);
        setTimeout(() => { flash.material.opacity = 0; }, 340);
      }
    }
    return state.hour;
  }

  function clockText() {
    const h = Math.floor(state.hour);
    const m = Math.floor((state.hour - h) * 60);
    return String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0');
  }

  setHour(state.hour);
  return { sun, hemi, state, setHour, setStorm, update, clockText, rain, flash };
}
