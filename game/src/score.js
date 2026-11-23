// score.js — uang, skor, dan pengali kombo.
// Tiap 3 aksi berantai menaikkan pengali sampai x4; jendela kombo
// bertambah panjang di tiap level, dan kombo putus bila waktu habis.
var KKScore = {
  add: function (G, action, basePoints) {
    // Aksi berantai: segarkan jendela kombo dan hitung pengali
    if (G.comboTimer > 0) {
      G.comboHits++;
    } else {
      G.comboHits = 1;
      G.comboLevel = 1;
    }
    var level = Math.min(KKCFG.comboMaxLevel, 1 + Math.floor((G.comboHits - 1) / KKCFG.comboHitsPerLevel));
    G.comboLevel = level;
    G.bestCombo = Math.max(G.bestCombo || 1, level);
    G.comboTimer = KKCFG.comboWindowBase + (level - 1) * KKCFG.comboWindowStep;
    var gained = Math.round(basePoints * level);
    G.score += gained;
    if (action === 'mission') G.money += 0; // hadiah misi sudah ditambah missions.js
    return gained;
  },

  update: function (G, dt) {
    if (G.comboTimer > 0) {
      G.comboTimer -= dt;
      if (G.comboTimer <= 0) {
        G.comboTimer = 0;
        G.comboHits = 0;
        G.comboLevel = 1;
      }
    }
  },

  comboLabel: function (G) {
    if (G.comboTimer <= 0) return '';
    return 'KOMBO x' + G.comboLevel + ' (' + G.comboHits + ' aksi)';
  },

  comboFraction: function (G) {
    if (G.comboTimer <= 0) return 0;
    var full = KKCFG.comboWindowBase + (G.comboLevel - 1) * KKCFG.comboWindowStep;
    return Math.max(0, Math.min(1, G.comboTimer / full));
  }
};
