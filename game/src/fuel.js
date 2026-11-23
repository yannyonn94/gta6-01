// fuel.js — model tangki bahan bakar: terkuras saat berkendara,
// diisi ulang di SPBU, dan memberi peringatan saat menipis.
var KKFUEL = {
  // Kurangi bahan bakar sebanding dengan beban mesin (0 diam .. 1 gas penuh).
  drain: function (vehicle, load, dt) {
    if (!vehicle) return;
    var use = (KKCFG.fuelUseIdle + load * KKCFG.fuelUseFull) * dt;
    vehicle.fuel = Math.max(0, vehicle.fuel - use);
  },

  // Apakah kendaraan berada di area SPBU?
  nearStation: function (G, x, z) {
    for (var i = 0; i < G.city.stations.length; i++) {
      var st = G.city.stations[i];
      var dx = x - st.x, dz = z - st.z;
      if (dx * dx + dz * dz < 14 * 14) return st;
    }
    return null;
  },

  // Isi ulang saat kendaraan pemain berhenti di area SPBU.
  // Biaya $0,50 per liter, dipotong langsung dari uang pemain.
  refuelTick: function (G, dt) {
    var p = G.player;
    if (!p.vehicle) return false;
    var st = this.nearStation(G, p.pos.x, p.pos.z);
    if (!st) return false;
    var v = p.vehicle;
    if (v.fuel >= v.tank) return false;
    var before = v.fuel;
    v.fuel = Math.min(v.tank, v.fuel + KKCFG.refuelRate * dt);
    var liters = v.fuel - before;
    G.money = Math.max(0, G.money - liters * 0.5);
    if (v.fuel >= v.tank && before < v.tank) {
      KKHUD.toast('Tangki penuh! Total isi bensin dipotong dari uangmu.');
    }
    return true;
  },

  percent: function (vehicle) {
    if (!vehicle) return 0;
    return Math.round((vehicle.fuel / vehicle.tank) * 100);
  },

  isLow: function (vehicle) {
    return vehicle && vehicle.fuel < KKCFG.fuelLowWarn;
  }
};
