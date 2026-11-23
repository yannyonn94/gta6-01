// bank.js — ekonomi Kota Karang: uang, kombo, dan BBM. Kombo naik setiap
// kali pemain mendapat uang dalam waktu singkat dan melipatgandakan
// pemasukan berikutnya; BBM terkuras saat mengemudi dan diisi di pom.

import { TUNE } from './tune.js';

export function createBank(hooks) {
  const state = {
    money: 0,
    combo: 1,
    comboTimer: 0,
    comboCount: 0,
    fuel: TUNE.fuelMax,
    earned: 0,
  };

  function addMoney(base, reason) {
    const amount = Math.round(base * state.combo);
    state.money += amount;
    state.earned += amount;
    state.comboCount += 1;
    state.comboTimer = TUNE.comboWindow;
    if (state.comboCount >= 3 && state.combo < 5) {
      state.combo += 1;
      state.comboCount = 0;
      if (hooks.onCombo) hooks.onCombo(state.combo);
    }
    if (hooks.onMoney) hooks.onMoney(amount, reason, state.money);
    return amount;
  }

  function update(dt, driving, atPump) {
    // Kombo mendingin.
    if (state.comboTimer > 0) {
      state.comboTimer -= dt;
      if (state.comboTimer <= 0) {
        state.combo = 1;
        state.comboCount = 0;
        if (hooks.onComboEnd) hooks.onComboEnd();
      }
    }
    // BBM.
    if (driving) {
      state.fuel = Math.max(0, state.fuel - TUNE.fuelDrain * dt);
      if (state.fuel <= 0 && hooks.onFuelEmpty) hooks.onFuelEmpty();
    } else if (atPump) {
      state.fuel = Math.min(TUNE.fuelMax, state.fuel + TUNE.fuelRefillRate * dt);
    }
  }

  return {
    state,
    addMoney,
    update,
    reset() {
      state.money = 0; state.combo = 1; state.comboTimer = 0;
      state.comboCount = 0; state.fuel = TUNE.fuelMax; state.earned = 0;
    },
    load(saved) {
      if (!saved) return;
      state.money = saved.money || 0;
      state.fuel = saved.fuel !== undefined ? saved.fuel : TUNE.fuelMax;
    },
    snapshot() {
      return { money: state.money, fuel: state.fuel };
    },
  };
}
