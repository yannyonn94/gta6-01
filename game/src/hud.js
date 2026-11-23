// hud.js — semua pembaruan DOM Kota Karang: bintang buronan, jam, cuaca,
// uang, skor, kombo, bar kesehatan dan stamina, teks tujuan, kecepatan,
// bahan bakar, toast pesan, minimap bundar di kanvas, dan banner mode foto.
var KKHUD = {
  _toastTimer: null,
  _els: {},

  init: function () {
    var ids = ['wanted', 'clock', 'weather', 'money', 'score', 'combo', 'comboBar',
      'healthBar', 'healthText', 'staminaBar', 'objective', 'speed', 'vehName',
      'fuel', 'fuelBar', 'toast', 'photoBanner', 'minimap', 'pauseStats', 'endTitle', 'endLine'];
    for (var i = 0; i < ids.length; i++) {
      this._els[ids[i]] = document.getElementById(ids[i]);
    }
  },

  toast: function (msg) {
    var el = this._els.toast;
    if (!el) return;
    el.textContent = msg;
    el.style.opacity = '1';
    if (this._toastTimer) clearTimeout(this._toastTimer);
    var self = this;
    this._toastTimer = setTimeout(function () { el.style.opacity = '0'; }, 3400);
  },

  stars: function (n) {
    var s = '';
    for (var i = 0; i < 5; i++) s += (i < n) ? '★' : '☆';
    return s;
  },

  update: function (G) {
    var e = this._els;
    if (e.wanted) {
      e.wanted.textContent = this.stars(G.wanted);
      e.wanted.style.color = G.wanted >= 3 ? '#ff5a4e' : '#e8c33a';
    }
    if (e.clock) e.clock.textContent = KKDAY.clockLabel();
    if (e.weather) e.weather.textContent = KKDAY.weatherLabel() + (G.raining ? ' (' + Math.round(G.rainAmount * 100) + '%)' : '');
    if (e.money) e.money.textContent = '$' + Math.floor(G.money);
    if (e.score) e.score.textContent = 'Skor ' + Math.floor(G.score);
    if (e.combo) e.combo.textContent = KKScore.comboLabel(G);
    if (e.comboBar) e.comboBar.style.width = Math.round(KKScore.comboFraction(G) * 100) + '%';
    if (e.healthBar) {
      e.healthBar.style.width = Math.max(0, G.player.health) + '%';
      e.healthBar.style.backgroundColor = G.player.health < 30 ? '#d92323' : '#3f8f5f';
    }
    if (e.healthText) e.healthText.textContent = 'Sehat ' + Math.ceil(G.player.health);
    if (e.staminaBar) {
      e.staminaBar.style.width = Math.max(0, G.player.stamina) + '%';
      e.staminaBar.style.backgroundColor = G.player.stamina < 20 ? '#d92323' : '#2a6fd8';
    }
    if (e.objective) e.objective.textContent = KKMISSIONS.objectiveText(G);
    var speedKmh = 0, vehName = 'Jalan kaki', fuelPct = 0;
    if (G.player.vehicle) {
      speedKmh = Math.round(Math.abs(G.player.vehicle.speed) * 3.6);
      vehName = G.player.vehicle.name;
      fuelPct = KKFUEL.percent(G.player.vehicle);
    } else {
      speedKmh = Math.round(G.player.speed * 3.6);
    }
    if (e.speed) e.speed.textContent = speedKmh + ' km/jam';
    if (e.vehName) e.vehName.textContent = vehName;
    if (e.fuel) {
      e.fuel.textContent = G.player.vehicle ? ('Bensin ' + fuelPct + '%') : '—';
      e.fuel.style.color = (G.player.vehicle && fuelPct < 18) ? '#ff5a4e' : '#f2ede2';
    }
    if (e.fuelBar && G.player.vehicle) e.fuelBar.style.width = fuelPct + '%';
    if (e.photoBanner) e.photoBanner.style.display = G.photoMode ? 'block' : 'none';
    this.drawMinimap(G);
  },

  drawMinimap: function (G) {
    var cv = this._els.minimap;
    if (!cv) return;
    var ctx = cv.getContext('2d');
    var S = cv.width, C = S / 2, scale = S / 460;
    ctx.clearRect(0, 0, S, S);
    // Lingkaran dasar minimap
    ctx.beginPath();
    ctx.arc(C, C, C - 2, 0, Math.PI * 2);
    ctx.fillStyle = '#101a26';
    ctx.fill();
    ctx.save();
    ctx.beginPath();
    ctx.arc(C, C, C - 2, 0, Math.PI * 2);
    ctx.clip();
    // Jalan
    ctx.strokeStyle = '#5d6b78';
    ctx.lineWidth = 4;
    KKWORLD.roadLines.forEach(function (c) {
      var p = C + c * scale;
      ctx.beginPath(); ctx.moveTo(p, 4); ctx.lineTo(p, S - 4); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(4, p); ctx.lineTo(S - 4, p); ctx.stroke();
    });
    // Laut di tepi
    ctx.strokeStyle = '#1d6f8e';
    ctx.lineWidth = 8;
    ctx.strokeRect(2, 2, S - 4, S - 4);
    function dot(x, z, r, color) {
      ctx.beginPath();
      ctx.arc(C + x * scale, C + z * scale, r, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
    }
    // Mercusuar, pasar, SPBU, gudang
    dot(KKWORLD.lighthouse.x, KKWORLD.lighthouse.z, 4, '#ffe9a8');
    dot(KKWORLD.market.x, KKWORLD.market.z, 4, '#e8a33a');
    dot(KKWORLD.stationNW.x, KKWORLD.stationNW.z, 3, '#d92323');
    dot(KKWORLD.stationSE.x, KKWORLD.stationSE.z, 3, '#d92323');
    dot(KKWORLD.warehouse.x, KKWORLD.warehouse.z, 4, '#b08a4a');
    // Penanda misi
    if (KKMISSIONS.markerMesh) {
      dot(KKMISSIONS.markerMesh.position.x, KKMISSIONS.markerMesh.position.z, 6, '#e8c33a');
      ctx.beginPath();
      ctx.arc(C + KKMISSIONS.markerMesh.position.x * scale, C + KKMISSIONS.markerMesh.position.z * scale, 9, 0, Math.PI * 2);
      ctx.strokeStyle = '#e8c33a';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    // Polisi
    KKPOLICE.list.forEach(function (cop) {
      dot(cop.mesh.position.x, cop.mesh.position.z, 3.5, '#2a6fd8');
    });
    // Pemain: panah emas di tengah
    var px = C + G.player.pos.x * scale, pz = C + G.player.pos.z * scale;
    ctx.save();
    ctx.translate(px, pz);
    ctx.rotate(-G.player.heading);
    ctx.beginPath();
    ctx.moveTo(0, -8); ctx.lineTo(6, 6); ctx.lineTo(-6, 6); ctx.closePath();
    ctx.fillStyle = '#e8c33a';
    ctx.fill();
    ctx.restore();
    ctx.restore();
    // Bingkai lingkaran
    ctx.beginPath();
    ctx.arc(C, C, C - 2, 0, Math.PI * 2);
    ctx.strokeStyle = '#e8c33a';
    ctx.lineWidth = 3;
    ctx.stroke();
  },

  showPauseStats: function (G) {
    var el = this._els.pauseStats;
    if (!el) return;
    var done = KKMISSIONS.index >= 7 ? 7 : KKMISSIONS.index;
    el.textContent = 'Misi selesai ' + done + '/7  •  Uang $' + Math.floor(G.money) +
      '  •  Skor ' + Math.floor(G.score) + '  •  Buronan ' + G.wanted +
      ' bintang  •  Waktu ' + Math.floor(G.elapsed / 60) + ' mnt ' +
      Math.floor(G.elapsed % 60) + ' dtk';
  },

  showEnd: function (G, won) {
    var t = this._els.endTitle, l = this._els.endLine;
    if (t) t.textContent = won ? 'KOTA KARANG TAKLUK!' : 'PERJALANAN BERAKHIR';
    if (l) l.textContent = won
      ? 'Semua 7 misi selesai. Skor ' + Math.floor(G.score) + ' • Uang $' + Math.floor(G.money)
      : 'Kesehatan habis. Skor ' + Math.floor(G.score) + ' • Misi ' + KKMISSIONS.index + '/7 selesai';
  }
};
