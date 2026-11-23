// game_main.js — bootstrap Kota Karang: renderer, scene, kamera,
// game loop, dan penghubung semua modul. Juga jeda, mode foto,
// kamera, dan layar akhir permainan.
var G = null;

function bootKotaKarang() {
  var canvas = document.getElementById('gameCanvas');
  var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = false;

  var scene = new THREE.Scene();
  scene.background = new THREE.Color(KKWORLD.skyDay);
  scene.fog = new THREE.Fog(KKWORLD.skyDay, 120, 520);

  var camera = new THREE.PerspectiveCamera(62, window.innerWidth / window.innerHeight, 0.1, 1200);

  var sunLight = new THREE.DirectionalLight(0xfff2d8, 1.0);
  sunLight.position.set(120, 160, 60);
  scene.add(sunLight);
  var ambientLight = new THREE.AmbientLight(0xffffff, 0.55);
  scene.add(ambientLight);

  var seed = seedFromLocation();
  var rng = makeSeededRandom(seed);
  var city = buildKotaKarang(scene, rng);

  G = {
    scene: scene, camera: camera, renderer: renderer,
    sunLight: sunLight, ambientLight: ambientLight,
    city: city, rng: rng, seed: seed,
    player: null, elapsed: 0, hour: 11,
    raining: false, rainAmount: 0,
    wanted: 0, lastCrimeAt: -100,
    money: 250, score: 0,
    comboHits: 0, comboLevel: 1, comboTimer: 0,
    started: false, paused: false, photoMode: false,
    gameOver: false, gameWon: false, frozen: false,
    cameraMode: 'follow', aerialTarget: null,
    camDist: KKCFG.cameraDefaultDist, camHeight: KKCFG.cameraDefaultHeight, camYaw: 0, camPitch: 0.32,
    orbitYaw: 0.6, orbitPitch: 0.35, orbitDist: 16
  };
  window.GAME_PAUSED_FLAG = false;

  G.player = KKPLAYER.create(KKWORLD.playerStart);
  scene.add(G.player.mesh);
  KKInput.init(canvas);
  KKHUD.init();
  KKDAY.init(scene);
  KKDAY.setHour(11);
  KKPEDESTRIANS.spawn(scene, rng, city);
  KKVEHICLES.spawnTraffic(scene, rng, city);

  // Mobil biru misi 1 di garasi, motor di dekat pasar, van di barat
  var blueCar = KKVEHICLES.create(scene, 'car', 0x2a6fd8, rng);
  blueCar.mesh.position.set(KKWORLD.blueCarSpot.x, 0, KKWORLD.blueCarSpot.z);
  blueCar.heading = -Math.PI / 2; // menghadap timur, menyusuri jalan z=-32
  blueCar.mesh.rotation.y = blueCar.heading;
  blueCar.name = 'Mobil Biru';
  KKVEHICLES.list.push(blueCar);
  G.blueCar = blueCar;

  var moto = KKVEHICLES.create(scene, 'moto', 0xd92323, rng);
  moto.mesh.position.set(KKWORLD.motoSpot.x, 0, KKWORLD.motoSpot.z);
  moto.heading = 0;
  moto.mesh.rotation.y = 0;
  KKVEHICLES.list.push(moto);

  var van = KKVEHICLES.create(scene, 'van', 0xe8e2d2, rng);
  van.mesh.position.set(KKWORLD.vanSpot.x, 0, KKWORLD.vanSpot.z);
  van.heading = Math.PI / 2;
  van.mesh.rotation.y = van.heading;
  van.name = 'Van Logistik';
  KKVEHICLES.list.push(van);
  G.logVan = van;

  // Tombol overlay
  var startBtn = document.getElementById('startBtn');
  var continueBtn = document.getElementById('continueBtn');
  var againBtn = document.getElementById('againBtn');
  var resumeBtn = document.getElementById('resumeBtn');
  var restartBtn = document.getElementById('restartBtn');
  function startGame() {
    document.getElementById('startOverlay').style.display = 'none';
    document.getElementById('hud').style.display = 'block';
    KKSound.init();
    KKSound.resume();
    G.started = true;
    G.paused = false;
    window.GAME_PAUSED_FLAG = false;
    if (KKMISSIONS.state === 'idle') KKMISSIONS.start(G);
    KKHUD.toast('Selamat datang di Kota Karang! Misi 1: curi mobil biru di garasi.');
  }
  if (startBtn) startBtn.addEventListener('click', startGame);
  if (continueBtn) continueBtn.addEventListener('click', startGame);
  if (againBtn) againBtn.addEventListener('click', function () { window.location.reload(); });
  if (resumeBtn) resumeBtn.addEventListener('click', function () { togglePause(false); });
  if (restartBtn) restartBtn.addEventListener('click', function () { window.location.reload(); });

  // Staging screenshot dari URL
  var shotParams = KKSHOTS.params();
  if (shotParams.shot) {
    KKDAY.setHour(shotParams.hour);
    KKSHOTS.apply(G, shotParams.shot);
    if (shotParams.shot === 'start') {
      // Kamera udara sudah diatur apply(); mulai permainan
      G.started = true;
    }
  }

  window.addEventListener('resize', function () {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  var clock = new THREE.Clock();
  var firstFrame = true;
  function loop() {
    requestAnimationFrame(loop);
    var dt = Math.min(clock.getDelta(), 0.05);
    if (firstFrame) { firstFrame = false; dt = 0.016; }
    tick(dt);
    renderer.render(scene, camera);
  }

  function togglePause(force) {
    var next = (typeof force === 'boolean') ? force : !G.paused;
    G.paused = next;
    window.GAME_PAUSED_FLAG = next;
    var menu = document.getElementById('pauseMenu');
    if (menu) menu.style.display = next ? 'block' : 'none';
    if (next) KKHUD.showPauseStats(G);
  }
  window.KK_TOGGLE_PAUSE = togglePause;

  function tick(dt) {
    if (G.photoMode) {
      // Mode foto: dunia beku, kamera orbit dengan mouse. F keluar dari mode foto.
      if (KKInput.pressedOnce('KeyF')) {
        G.photoMode = false;
        document.getElementById('hud').style.display = 'block';
        KKHUD.toast('Kembali bermain.');
        return;
      }
      var m = KKInput.consumeMouse();
      G.orbitYaw -= m.dx * 0.005;
      G.orbitPitch = Math.max(0.05, Math.min(1.2, G.orbitPitch + m.dy * 0.004));
      G.orbitDist = Math.max(6, Math.min(60, G.orbitDist + KKInput.consumeWheel() * 1.5));
      var px = G.player.pos.x, pz = G.player.pos.z;
      camera.position.set(
        px + Math.sin(G.orbitYaw) * Math.cos(G.orbitPitch) * G.orbitDist,
        2 + Math.sin(G.orbitPitch) * G.orbitDist,
        pz + Math.cos(G.orbitYaw) * Math.cos(G.orbitPitch) * G.orbitDist
      );
      camera.lookAt(px, 2, pz);
      return;
    }
    if (!G.started || G.paused || G.gameOver) {
      // Kamera idle mengorbit kota sebelum mulai
      if (!G.started && !G.gameOver) {
        var a = G.elapsed * 0.05;
        camera.position.set(Math.sin(a) * 190, 95, Math.cos(a) * 190);
        camera.lookAt(0, 0, 0);
        G.elapsed += dt;
      }
      return;
    }
    G.elapsed += dt;
    G.frozen = false;

    // Input sekali tekan
    if (KKInput.pressedOnce('KeyE')) {
      if (G.player.onFoot) {
        var near = KKVEHICLES.nearestDrivable(G.player.pos.x, G.player.pos.z, 4.5);
        if (near) KKPLAYER.enterVehicle(G, near);
        else KKHUD.toast('Tidak ada kendaraan di dekatmu.');
      } else {
        KKPLAYER.exitVehicle(G);
      }
    }
    if (KKInput.pressedOnce('KeyH') && G.player.vehicle) KKSound.horn();
    if (KKInput.pressedOnce('KeyM')) {
      KKSound.setMuted(!KKSound.muted);
      KKHUD.toast(KKSound.muted ? 'Suara dimatikan (M).' : 'Suara dihidupkan (M).');
    }
    if (KKInput.pressedOnce('KeyF')) {
      G.photoMode = true;
      document.getElementById('hud').style.display = 'none';
      KKHUD.toast('Mode foto: geser mouse untuk memutar kamera, F untuk kembali.');
      return;
    }
    if (KKInput.pressedOnce('KeyR')) {
      G.camYaw = 0;
      KKHUD.toast('Kamera direset.');
    }
    if (KKInput.pressedOnce('Escape') || KKInput.pressedOnce('KeyP')) togglePause();
    if (KKInput.down('Space') && G.player.onFoot) KKPLAYER.shoot(G);
    if (KKInput.pressedOnce('Mouse0') && G.player.onFoot && KKInput.locked) KKPLAYER.shoot(G);

    // Perbarui pemain
    if (G.player.onFoot) KKPLAYER.updateOnFoot(G, dt);
    else KKPLAYER.updateDriving(G, dt);

    // Buronan turun saat bersembunyi (tidak ada polisi dekat + tidak berbuat jahat)
    if (G.wanted > 0 && G.elapsed - G.lastCrimeAt > KKCFG.wantedDecayDelay) {
      var nearestCop = 999;
      KKPOLICE.list.forEach(function (c) {
        var dx = c.mesh.position.x - G.player.pos.x, dz = c.mesh.position.z - G.player.pos.z;
        nearestCop = Math.min(nearestCop, Math.sqrt(dx * dx + dz * dz));
      });
      if (nearestCop > 30) {
        G._decayTimer = (G._decayTimer || 0) + dt;
        if (G._decayTimer > KKCFG.wantedDecayStep) {
          G._decayTimer = 0;
          G.wanted--;
          KKHUD.toast('Buronan turun: ' + G.wanted + ' bintang.');
        }
      } else {
        G._decayTimer = 0;
      }
    }

    // Modul dunia
    KKVEHICLES.update(G, dt);
    KKPOLICE.update(G, dt);
    KKPEDESTRIANS.update(G, dt);
    KKDAY.update(G, dt);
    KKMISSIONS.update(G, dt);
    KKScore.update(G, dt);
    KKFUEL.refuelTick(G, dt);

    // Suara mesin mengikuti beban
    if (G.player.vehicle) {
      KKSound.engine(Math.abs(G.player.vehicle.speed) / 34);
    } else {
      KKSound.engineOff();
    }
    // Sirene saat buronan tinggi
    if (G.wanted >= 3) KKSound.siren(performance.now());

    // Kamera orang ketiga
    updateCamera(dt);
    KKHUD.update(G);

    // Game over
    if (G.player.health <= 0 && !G.gameOver) {
      G.gameOver = true;
      KKHUD.showEnd(G, false);
      document.getElementById('endScreen').style.display = 'block';
      document.getElementById('hud').style.display = 'none';
    }
    if (G.gameWon && !G.gameOver) {
      G.gameOver = true;
      KKHUD.showEnd(G, true);
      document.getElementById('endScreen').style.display = 'block';
    }
  }

  function updateCamera(dt) {
    var p = G.player;
    var wheel = KKInput.consumeWheel();
    G.camDist = Math.max(KKCFG.cameraMinDist, Math.min(KKCFG.cameraMaxDist, G.camDist + wheel * 1.2));
    if (G.cameraMode === 'aerial') {
      camera.position.set(0, 190, 130);
      camera.lookAt(0, 0, 0);
      return;
    }
    var mouse = KKInput.consumeMouse();
    G.camYaw -= mouse.dx * 0.0028;
    G.camPitch = Math.max(0.08, Math.min(0.9, G.camPitch + mouse.dy * 0.002));
    var yaw = p.heading + G.camYaw;
    var dist = G.camDist, height = G.camHeight;
    var cx = p.pos.x + Math.sin(yaw) * Math.cos(G.camPitch) * dist;
    var cz = p.pos.z + Math.cos(yaw) * Math.cos(G.camPitch) * dist;
    var cy = 1.6 + Math.sin(G.camPitch) * dist * 0.9 + 2;
    camera.position.set(cx, cy, cz);
    camera.lookAt(p.pos.x, 2.2, p.pos.z);
  }

  loop();
}

window.addEventListener('DOMContentLoaded', bootKotaKarang);
