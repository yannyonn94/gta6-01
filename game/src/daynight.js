// daynight.js — jam, matahari dan bulan, warna langit, dan cuaca hujan.
// Hujan datang dan pergi; saat hujan jalan licin dan warga berteduh.
var KKDAY = {
  hour: 11,
  raining: false,
  rainAmount: 0,      // 0 kering .. 1 badai
  _rainTimer: 40,
  _nextRainIn: 55,
  rainDrops: null,

  init: function (scene) {
    // Hujan: titik-titik putih jatuh di sekitar kamera
    var count = 900;
    var positions = new Float32Array(count * 3);
    for (var i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 90;
      positions[i * 3 + 1] = Math.random() * 30;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 90;
    }
    var geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    var mat = new THREE.PointsMaterial({ color: 0xcfe4f2, size: 0.28, transparent: true, opacity: 0.85 });
    this.rainDrops = new THREE.Points(geo, mat);
    this.rainDrops.visible = false;
    scene.add(this.rainDrops);
    // Bintang malam: titik-titik di kubah langit, hanya terlihat saat gelap
    var starCount = 400;
    var starPos = new Float32Array(starCount * 3);
    for (var s = 0; s < starCount; s++) {
      var a = Math.random() * Math.PI * 2;
      var el = Math.random() * Math.PI * 0.45 + 0.08;
      starPos[s * 3] = Math.cos(a) * Math.cos(el) * 480;
      starPos[s * 3 + 1] = Math.sin(el) * 480;
      starPos[s * 3 + 2] = Math.sin(a) * Math.cos(el) * 480;
    }
    var starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    this.stars = new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0xffffff, size: 1.6, sizeAttenuation: false }));
    this.stars.visible = false;
    scene.add(this.stars);
  },

  setHour: function (hour) {
    this.hour = ((hour % 24) + 24) % 24;
  },

  setRain: function (on, amount) {
    this.raining = on;
    this.rainAmount = on ? (amount || 0.7) : 0;
    if (this.rainDrops) this.rainDrops.visible = on;
    if (on) KKSound.rain(true);
    else KKSound.rain(false);
  },

  update: function (G, dt) {
    // Jam berjalan pelan: satu hari penuh = dayLengthSec detik
    if (!G.frozen) {
      this.hour += (dt / KKCFG.dayLengthSec) * 24;
      if (this.hour >= 24) this.hour -= 24;
    }
    // Siklus hujan acak, kecuali misi badai memaksa hujan
    if (KKMISSIONS.index === 6 && KKMISSIONS.state === 'active') {
      if (!this.raining) this.setRain(true, 1);
    } else {
      this._rainTimer -= dt;
      if (this._rainTimer <= 0) {
        if (this.raining) {
          this.setRain(false, 0);
          this._rainTimer = 45 + Math.random() * 50;
        } else {
          this.setRain(true, 0.45 + Math.random() * 0.35);
          this._rainTimer = 25 + Math.random() * 25;
        }
      }
    }
    G.raining = this.raining;
    G.rainAmount = this.rainAmount;
    G.hour = this.hour;

    // Matahari / bulan dan warna langit
    var h = this.hour;
    var sunAngle = ((h - 6) / 12) * Math.PI; // 06:00 terbit, 18:00 terbenam
    var sunH = Math.sin(sunAngle);
    var dayFactor = Math.max(0, Math.min(1, sunH * 1.6 + 0.25));
    var duskFactor = Math.max(0, 1 - Math.abs(sunH) * 4) * (h > 12 ? 1 : 0.6);
    var sky = new THREE.Color(KKWORLD.skyDay).lerp(new THREE.Color(KKWORLD.skyNight), 1 - dayFactor);
    if (duskFactor > 0) sky.lerp(new THREE.Color(KKWORLD.skyDusk), duskFactor * 0.7);
    if (this.raining) sky.lerp(new THREE.Color(KKWORLD.skyRain), this.rainAmount * 0.65);
    G.scene.background = sky;
    if (G.scene.fog) {
      G.scene.fog.color.copy(sky);
      G.scene.fog.near = this.raining ? 40 : 120;
      G.scene.fog.far = this.raining ? 160 : 520;
    }
    // Cahaya matahari
    if (G.sunLight) {
      G.sunLight.position.set(Math.cos(sunAngle) * 180, Math.max(12, sunH * 160 + 20), 60);
      G.sunLight.intensity = 0.25 + dayFactor * 0.95 - this.rainAmount * 0.45;
      G.sunLight.color.setHex(duskFactor > 0.3 ? 0xffb36b : 0xfff2d8);
    }
    if (G.ambientLight) {
      G.ambientLight.intensity = 0.35 + dayFactor * 0.4;
    }
    // Bintang hanya terlihat di malam yang cerah
    if (this.stars) {
      this.stars.visible = (dayFactor < 0.25 && !this.raining);
    }
    // Lampu mercusuar berputar di malam hari
    if (G.city && G.city.lighthouseBeam) {
      var night = dayFactor < 0.4;
      G.city.lighthouseBeam.visible = night;
      if (night) {
        G.city.lighthouseBeam.rotation.y = G.elapsed * 0.7;
        G.city.lighthouseBeam.rotation.z = Math.PI / 2;
        G.city.lighthouseBeam.rotation.x = 0;
        // Putar sinar mengelilingi menara
        var a = G.elapsed * 0.7;
        G.city.lighthouseBeam.position.set(
          KKWORLD.lighthouse.x + Math.cos(a) * 21,
          6 + KKWORLD.lighthouse.height + 2,
          KKWORLD.lighthouse.z + Math.sin(a) * 21
        );
        G.city.lighthouseBeam.lookAt(KKWORLD.lighthouse.x + Math.cos(a) * 60, 6 + KKWORLD.lighthouse.height + 2, KKWORLD.lighthouse.z + Math.sin(a) * 60);
      }
      if (G.city.lighthouseLight) G.city.lighthouseLight.intensity = night ? 1.4 : 0.25;
    }
    // Hujan jatuh
    if (this.rainDrops && this.raining) {
      var pos = this.rainDrops.geometry.attributes.position;
      for (var i = 0; i < pos.count; i++) {
        var y = pos.getY(i) - dt * (22 + this.rainAmount * 14);
        if (y < 0) y = 28 + Math.random() * 4;
        pos.setY(i, y);
      }
      pos.needsUpdate = true;
      // Hujan mengikuti pemain
      this.rainDrops.position.x = G.player.pos.x;
      this.rainDrops.position.z = G.player.pos.z;
    }
  },

  clockLabel: function () {
    var h = Math.floor(this.hour);
    var m = Math.floor((this.hour - h) * 60);
    return (h < 10 ? '0' : '') + h + ':' + (m < 10 ? '0' : '') + m;
  },

  weatherLabel: function () {
    if (this.raining) return this.rainAmount > 0.85 ? 'Badai' : 'Hujan';
    var h = this.hour;
    if (h < 6 || h >= 19) return 'Malam';
    if (h >= 17) return 'Senja';
    return 'Cerah';
  }
};
