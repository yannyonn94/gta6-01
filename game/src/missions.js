// missions.js — ketujuh misi Kota Karang sebagai state machine. Setiap misi
// punya satu penanda cahaya di dunia (beacon) yang menunjuk target aktif,
// progres yang dilaporkan ke HUD, hadiah uang, dan kondisi gagal sendiri
// (waktu habis, ketahuan polisi). Misi selesai berurutan 1 → 7.

import { MISSIONS, roadLine, blockCenter } from './tune.js';
import { makeCarMesh } from './cars.js';
import { range, pick } from './rng.js';

function makeBeacon(scene) {
  const g = new THREE.Group();
  const beam = new THREE.Mesh(
    new THREE.CylinderGeometry(1.1, 1.6, 42, 12, 1, true),
    new THREE.MeshBasicMaterial({ color: 0x19c2b8, transparent: true, opacity: 0.28, side: THREE.DoubleSide, depthWrite: false })
  );
  beam.position.y = 21;
  g.add(beam);
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(2.2, 3.0, 24),
    new THREE.MeshBasicMaterial({ color: 0xffd23e, transparent: true, opacity: 0.9, side: THREE.DoubleSide })
  );
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.12;
  g.add(ring);
  scene.add(g);
  g.visible = false;
  return g;
}

function makeCoin() {
  const m = new THREE.Mesh(
    new THREE.CylinderGeometry(0.55, 0.55, 0.16, 16),
    new THREE.MeshLambertMaterial({ color: 0xffd23e, emissive: 0xa8820a, emissiveIntensity: 0.7 })
  );
  m.rotation.x = Math.PI / 2;
  return m;
}

export function createMissions(ctx) {
  const { scene, rng, landmarks, driving, crowd, police, bank, atmos, sfx } = ctx;
  const beacon = makeBeacon(scene);
  let index = -1;           // -1 = belum mulai
  let done = false;
  let timer = 0;
  let progress = 0;
  let target = 0;
  let phase = 0;
  let coins = [];
  let drops = [];
  let gates = [];
  let thief = null;
  let thiefHits = 0;
  let hitCooldown = 0;
  let passengers = 0;
  let failed = false;

  function clearWorldObjects() {
    for (const c of coins) scene.remove(c.mesh);
    coins = [];
    for (const g of gates) scene.remove(g.mesh);
    gates = [];
    if (thief) { scene.remove(thief.mesh); thief = null; }
    beacon.visible = false;
  }

  function setBeacon(x, z, visible) {
    beacon.position.set(x, 0, z);
    beacon.visible = visible !== false;
  }

  function info() {
    if (index < 0) return { title: 'Kota Karang', desc: 'Tekan MULAI untuk bermain.', progress: 0, sub: '' };
    if (done) return { title: 'Kota Karang — Bebas', desc: 'Semua misi selesai! Jelajahi pulau sesukamu, kumpulkan koin, dan jaga bintangmu tetap rendah.', progress: 1, sub: 'Mode bebas' };
    const m = MISSIONS[index];
    let sub = '';
    if (m.timeLimit) sub = 'Sisa waktu: ' + Math.max(0, Math.ceil(timer)) + ' dtk';
    if (m.type === 'stealth') sub = 'Bintang buronan harus tetap 0!';
    if (m.type === 'storm') sub = 'Badai! Sisa waktu: ' + Math.max(0, Math.ceil(timer)) + ' dtk';
    return { title: m.title, desc: m.brief, progress: progress / Math.max(1, target), sub };
  }

  function start(i) {
    clearWorldObjects();
    index = i;
    failed = false;
    const m = MISSIONS[i];
    target = m.target;
    progress = 0;
    phase = 0;
    timer = m.timeLimit || 0;
    passengers = 0;
    thiefHits = 0;
    if (m.type === 'collect') {
      // 8 koin di sekitar pasar.
      for (let k = 0; k < 8; k++) {
        const mesh = makeCoin();
        const x = landmarks.market.x + range(rng, -14, 14);
        const z = landmarks.market.z + range(rng, -12, 12);
        mesh.position.set(x, 1.1, z);
        scene.add(mesh);
        coins.push({ mesh, x, z, taken: false });
      }
      setBeacon(landmarks.market.x, landmarks.market.z);
    } else if (m.type === 'deliver') {
      // Fase 0: ambil van di depot.
      driving.placePlayerCar(landmarks.depot.x + 14, landmarks.depot.z + 4, Math.PI / 2, 'van', 0x3f6fb5);
      setBeacon(landmarks.depot.x + 14, landmarks.depot.z + 4);
      target = 4; // 1 ambil van + 3 antar
    } else if (m.type === 'taxi') {
      setBeacon(landmarks.market.x, landmarks.market.z);
    } else if (m.type === 'chase') {
      const mesh = makeCarMesh('sedan', 0x8a1f1f);
      scene.add(mesh);
      const p = ctx.playerPos();
      thief = {
        mesh, x: p.x + 30, z: p.z - 20, heading: Math.PI / 2,
        speed: 15, dir: 1, horizontal: true, line: p.z,
      };
      thief.mesh.position.set(thief.x, 0, thief.z);
      setBeacon(thief.x, thief.z);
    } else if (m.type === 'race') {
      // 5 gerbang keliling pulau.
      const spots = [
        [roadLine(8), roadLine(1)], [roadLine(8), roadLine(8)],
        [roadLine(1), roadLine(8)], [roadLine(1), roadLine(1)],
        [0, roadLine(5)],
      ];
      spots.forEach(([x, z], gi) => {
        const frame = new THREE.Group();
        const mat = new THREE.MeshBasicMaterial({ color: gi === 0 ? 0xffd23e : 0x19c2b8 });
        const post1 = new THREE.Mesh(new THREE.BoxGeometry(0.6, 6, 0.6), mat);
        post1.position.set(-4, 3, 0);
        const post2 = post1.clone(); post2.position.x = 4;
        const top = new THREE.Mesh(new THREE.BoxGeometry(8.6, 0.8, 0.8), mat);
        top.position.y = 6;
        frame.add(post1, post2, top);
        frame.position.set(x, 0, z);
        scene.add(frame);
        gates.push({ mesh: frame, x, z, passed: false });
      });
      setBeacon(gates[0].x, gates[0].z);
    } else if (m.type === 'stealth') {
      setBeacon(landmarks.port.x + 10, landmarks.port.z);
    } else if (m.type === 'storm') {
      atmos.setStorm(1);
      atmos.setHour(19.2);
      police.setWanted(3, 'badai');
      setBeacon(landmarks.lighthouse.x - 12, landmarks.lighthouse.z + 8);
    }
    if (ctx.hud) ctx.hud.setMission(info());
    if (sfx) sfx.pickup();
  }

  function complete() {
    const m = MISSIONS[index];
    bank.addMoney(m.reward, 'misi');
    if (sfx) sfx.jingle();
    if (ctx.hud) ctx.hud.toast('Misi selesai! +$' + m.reward + ' — ' + m.title);
    clearWorldObjects();
    if (index >= MISSIONS.length - 1) {
      done = true;
      if (atmos) atmos.setStorm(0);
      if (ctx.onAllComplete) ctx.onAllComplete();
    } else {
      start(index + 1);
    }
  }

  function fail(reason) {
    failed = true;
    if (sfx) sfx.fail();
    if (ctx.hud) ctx.hud.toast('Misi gagal: ' + reason + ' — coba lagi (R)');
    if (atmos && MISSIONS[index].type === 'storm') atmos.setStorm(0);
    if (ctx.onMissionFailed) ctx.onMissionFailed(index, reason);
  }

  function restart() {
    if (index < 0) { start(0); return; }
    if (MISSIONS[index].type === 'storm' && atmos) atmos.setStorm(0);
    start(index);
  }

  function update(dt, player) {
    if (index < 0 || done) return;
    const m = MISSIONS[index];
    // Denyut beacon.
    if (beacon.visible) {
      const s = 1 + Math.sin(performance.now() / 300) * 0.12;
      beacon.scale.set(s, 1, s);
    }
    // Timer.
    if (m.timeLimit) {
      timer -= dt;
      if (timer <= 0) { fail('waktu habis'); restart(); return; }
    }
    if (hitCooldown > 0) hitCooldown -= dt;
    const px = player.pos.x, pz = player.pos.z;
    const distTo = (x, z) => Math.hypot(px - x, pz - z);

    if (m.type === 'collect') {
      for (const c of coins) {
        if (c.taken) continue;
        c.mesh.rotation.z += dt * 2;
        c.mesh.position.y = 1.1 + Math.sin(performance.now() / 400 + c.x) * 0.15;
        if (distTo(c.x, c.z) < 2.0) {
          c.taken = true;
          scene.remove(c.mesh);
          progress += 1;
          bank.addMoney(25, 'koin');
          if (sfx) sfx.coin();
        }
      }
      if (progress >= target) complete();
    } else if (m.type === 'deliver') {
      if (phase === 0) {
        if (driving.player.inCar && distTo(landmarks.depot.x + 14, landmarks.depot.z + 4) < 9) {
          phase = 1;
          progress = 1;
          drops = [
            { x: roadLine(7), z: roadLine(2) },
            { x: roadLine(2), z: roadLine(7) },
            { x: landmarks.port.x + 12, z: landmarks.port.z },
          ];
          setBeacon(drops[0].x, drops[0].z);
          if (ctx.hud) ctx.hud.toast('Van diambil! Antar paket pertama.');
        }
      } else {
        const d = drops[progress - 1];
        if (d && distTo(d.x, d.z) < 7) {
          progress += 1;
          bank.addMoney(120, 'antar');
          if (sfx) sfx.pickup();
          if (progress > 3) { complete(); return; }
          setBeacon(drops[progress - 1].x, drops[progress - 1].z);
          if (ctx.hud) ctx.hud.toast('Paket ' + (progress - 1) + '/3 diantar.');
        }
      }
    } else if (m.type === 'taxi') {
      if (phase === 0) {
        const near = crowd.touristsNear(px, pz, 9);
        if (driving.player.inCar && near.length > 0) {
          const t = near[0];
          // Turis naik: hapus dari kerumunan.
          scene.remove(t.mesh);
          crowd.people.splice(crowd.people.indexOf(t), 1);
          passengers += 1;
          progress = passengers;
          bank.addMoney(60, 'turis');
          if (sfx) sfx.pickup();
          if (ctx.hud) ctx.hud.toast('Turis naik! (' + passengers + '/2)');
          if (passengers >= 2) {
            phase = 1;
            setBeacon(landmarks.lighthouse.x - 12, landmarks.lighthouse.z + 8);
            if (ctx.hud) ctx.hud.toast('Antar mereka ke mercusuar!');
          }
        } else if (passengers === 0) {
          setBeacon(landmarks.market.x, landmarks.market.z);
        }
      } else if (distTo(landmarks.lighthouse.x - 12, landmarks.lighthouse.z + 8) < 12) {
        progress = 2;
        complete();
      }
    } else if (m.type === 'chase') {
      // Pencuri kabur di jalan, belok acak di persimpangan.
      const t = thief;
      t.x += Math.sin(t.heading) * t.speed * dt;
      t.z += Math.cos(t.heading) * t.speed * dt;
      const nearLine = roadLine(Math.round((t.horizontal ? t.z : t.x) + 144) / 32);
      const along = t.horizontal ? t.z : t.x;
      if (Math.abs(along - nearLine) < 1.5 && Math.random() < 0.01) {
        t.heading += (Math.random() < 0.5 ? 1 : -1) * Math.PI / 2;
      }
      if (Math.abs(t.x) > 150 || Math.abs(t.z) > 150) t.heading += Math.PI;
      t.mesh.position.set(t.x, 0, t.z);
      t.mesh.rotation.y = t.heading;
      setBeacon(t.x, t.z);
      if (hitCooldown <= 0 && driving.player.inCar) {
        const d = Math.hypot(px - t.x, pz - t.z);
        if (d < 4.2 && Math.abs(driving.player.speed) > 5) {
          thiefHits += 1;
          progress = thiefHits;
          hitCooldown = 1.6;
          t.speed = 22;
          setTimeout(() => { if (thief) thief.speed = 15; }, 1500);
          if (sfx) sfx.crash();
          if (ctx.hud) ctx.hud.toast('Tabrakan! ' + thiefHits + '/3');
          if (thiefHits >= 3) complete();
        }
      }
    } else if (m.type === 'race') {
      const g = gates[progress];
      if (g) {
        if (distTo(g.x, g.z) < 6) {
          g.passed = true;
          g.mesh.children.forEach((ch) => { ch.material = new THREE.MeshBasicMaterial({ color: 0x7ed957 }); });
          progress += 1;
          bank.addMoney(150, 'gerbang');
          if (sfx) sfx.pickup();
          if (progress >= target) { complete(); return; }
          setBeacon(gates[progress].x, gates[progress].z);
        }
      }
    } else if (m.type === 'stealth') {
      if (police.wanted > 0) { fail('polisi melihatmu'); restart(); return; }
      if (distTo(landmarks.port.x + 10, landmarks.port.z) < 9) {
        progress = 1;
        complete();
      }
    } else if (m.type === 'storm') {
      if (distTo(landmarks.lighthouse.x - 12, landmarks.lighthouse.z + 8) < 13) {
        progress = 1;
        complete();
      }
    }
    if (ctx.hud) ctx.hud.setMission(info());
  }

  return {
    start, update, restart, info,
    get index() { return index; },
    get done() { return done; },
    get failed() { return failed; },
    skipTo(i) { start(i); },
    beaconPos() {
      return beacon.visible ? { x: beacon.position.x, z: beacon.position.z } : null;
    },
  };
}
