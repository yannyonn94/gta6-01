// sfx.js — semua suara Kota Karang disintesis dengan WebAudio, tanpa berkas
// audio sama sekali: dengung mesin, sirene polisi, koin, tabrakan, jingle
// misi, dan debur ombak. Aman dipanggil sebelum interaksi pengguna
// (konteks dibuat malas, dan semua pemutar dijaga try/catch).

export function createSfx() {
  let ctx = null;
  let master = null;
  let muted = false;
  let engineOsc = null;
  let engineGain = null;
  let waveNodes = null;

  function ensure() {
    if (ctx) return true;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return false;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = 0.5;
      master.connect(ctx.destination);
      startWaves();
      return true;
    } catch (e) {
      return false;
    }
  }

  function tone(freq, dur, type, vol, slideTo) {
    if (!ensure() || muted) return;
    try {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = type || 'sine';
      o.frequency.setValueAtTime(freq, ctx.currentTime);
      if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, ctx.currentTime + dur);
      g.gain.setValueAtTime(vol || 0.2, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
      o.connect(g); g.connect(master);
      o.start(); o.stop(ctx.currentTime + dur + 0.02);
    } catch (e) { /* suara tidak pernah boleh mematikan permainan */ }
  }

  function noiseBurst(dur, vol, filterFreq) {
    if (!ensure() || muted) return;
    try {
      const len = Math.floor(ctx.sampleRate * dur);
      const buf = ctx.createBuffer(1, len, ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
      const src = ctx.createBufferSource();
      src.buffer = buf;
      const f = ctx.createBiquadFilter();
      f.type = 'lowpass'; f.frequency.value = filterFreq || 800;
      const g = ctx.createGain(); g.gain.value = vol || 0.3;
      src.connect(f); f.connect(g); g.connect(master);
      src.start();
    } catch (e) { /* abaikan */ }
  }

  function startWaves() {
    // Ombak: noise yang difilter dan diayun pelan dengan LFO.
    try {
      const len = ctx.sampleRate * 2;
      const buf = ctx.createBuffer(1, len, ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
      const src = ctx.createBufferSource();
      src.buffer = buf; src.loop = true;
      const f = ctx.createBiquadFilter();
      f.type = 'lowpass'; f.frequency.value = 420;
      const g = ctx.createGain(); g.gain.value = 0.045;
      const lfo = ctx.createOscillator();
      lfo.frequency.value = 0.13;
      const lfoGain = ctx.createGain(); lfoGain.gain.value = 0.03;
      lfo.connect(lfoGain); lfoGain.connect(g.gain);
      src.connect(f); f.connect(g); g.connect(master);
      src.start(); lfo.start();
      waveNodes = { src, lfo };
    } catch (e) { /* abaikan */ }
  }

  return {
    unlock() { ensure(); if (ctx && ctx.state === 'suspended') ctx.resume().catch(() => {}); },
    toggleMute() {
      muted = !muted;
      if (master) master.gain.value = muted ? 0 : 0.5;
      return muted;
    },
    isMuted() { return muted; },
    coin() { tone(880, 0.12, 'sine', 0.22); setTimeout(() => tone(1318, 0.18, 'sine', 0.2), 70); },
    crash() { noiseBurst(0.25, 0.5, 500); tone(90, 0.2, 'sawtooth', 0.25, 45); },
    pickup() { tone(660, 0.1, 'triangle', 0.2, 990); },
    jingle() {
      [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => tone(f, 0.22, 'triangle', 0.22), i * 110));
    },
    fail() { tone(220, 0.3, 'sawtooth', 0.2, 110); },
    siren(on) {
      if (!ensure()) return;
      if (on && !this._siren) {
        try {
          const o = ctx.createOscillator(); o.type = 'square'; o.frequency.value = 700;
          const g = ctx.createGain(); g.gain.value = 0.05;
          const lfo = ctx.createOscillator(); lfo.frequency.value = 0.9;
          const lg = ctx.createGain(); lg.gain.value = 260;
          lfo.connect(lg); lg.connect(o.frequency);
          o.connect(g); g.connect(master);
          o.start(); lfo.start();
          this._siren = { o, lfo, g };
        } catch (e) { /* abaikan */ }
      } else if (!on && this._siren) {
        try { this._siren.o.stop(); this._siren.lfo.stop(); } catch (e) {}
        this._siren = null;
      }
    },
    engine(on, speedNorm) {
      if (!ensure()) return;
      try {
        if (on && !engineOsc) {
          engineOsc = ctx.createOscillator();
          engineOsc.type = 'sawtooth';
          engineOsc.frequency.value = 70;
          engineGain = ctx.createGain();
          engineGain.gain.value = 0.0;
          const f = ctx.createBiquadFilter();
          f.type = 'lowpass'; f.frequency.value = 900;
          engineOsc.connect(f); f.connect(engineGain); engineGain.connect(master);
          engineOsc.start();
        }
        if (engineOsc) {
          engineOsc.frequency.setTargetAtTime(60 + (speedNorm || 0) * 160, ctx.currentTime, 0.08);
          engineGain.gain.setTargetAtTime(on ? 0.05 + (speedNorm || 0) * 0.06 : 0, ctx.currentTime, 0.1);
        }
        if (!on && engineOsc) {
          try { engineOsc.stop(); } catch (e) {}
          engineOsc = null; engineGain = null;
        }
      } catch (e) { /* abaikan */ }
    },
    setWaveLevel(v) { if (waveNodes) { /* ombak tetap pelan */ void v; } },
  };
}
