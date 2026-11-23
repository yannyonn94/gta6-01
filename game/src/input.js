// input.js — keyboard, mouse, dan pointer lock untuk Kota Karang.
// Semua modul lain membaca KKInput, tidak menyentuh DOM event sendiri.
var KKInput = {
  keys: {},
  mouseDX: 0,
  mouseDY: 0,
  wheel: 0,
  locked: false,
  anyKey: false,
  _canvas: null,

  init: function (canvas) {
    this._canvas = canvas;
    var self = this;
    window.addEventListener('keydown', function (e) {
      self.keys[e.code] = true;
      self.anyKey = true;
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].indexOf(e.code) >= 0) {
        e.preventDefault();
      }
    });
    window.addEventListener('keyup', function (e) {
      self.keys[e.code] = false;
    });
    window.addEventListener('blur', function () {
      self.keys = {};
    });
    document.addEventListener('mousemove', function (e) {
      if (self.locked) {
        self.mouseDX += e.movementX || 0;
        self.mouseDY += e.movementY || 0;
      }
    });
    document.addEventListener('pointerlockchange', function () {
      self.locked = (document.pointerLockElement === canvas);
    });
    canvas.addEventListener('click', function () {
      if (!self.locked && !window.GAME_PAUSED_FLAG) {
        try { canvas.requestPointerLock(); } catch (err) { /* pointer lock opsional */ }
      }
    });
    canvas.addEventListener('wheel', function (e) {
      self.wheel += (e.deltaY > 0 ? 1 : -1);
      e.preventDefault();
    }, { passive: false });
    window.addEventListener('mousedown', function (e) {
      if (e.button === 0) self.keys['Mouse0'] = true;
    });
    window.addEventListener('mouseup', function (e) {
      if (e.button === 0) self.keys['Mouse0'] = false;
    });
  },

  down: function (code) {
    return !!this.keys[code];
  },
  clearKeys: function () {
    this.keys = {};
    this.mouseDX = 0;
    this.mouseDY = 0;
  },
  // WASD atau panah: kembalikan vektor gerak -1..1 pada sumbu X (samping) dan Z (maju).
  moveAxes: function () {
    var x = 0, z = 0;
    if (this.down('KeyA') || this.down('ArrowLeft')) x -= 1;
    if (this.down('KeyD') || this.down('ArrowRight')) x += 1;
    if (this.down('KeyW') || this.down('ArrowUp')) z -= 1;
    if (this.down('KeyS') || this.down('ArrowDown')) z += 1;
    return { x: x, z: z };
  },
  consumeMouse: function () {
    var dx = this.mouseDX, dy = this.mouseDY;
    this.mouseDX = 0;
    this.mouseDY = 0;
    return { dx: dx, dy: dy };
  },
  consumeWheel: function () {
    var w = this.wheel;
    this.wheel = 0;
    return w;
  },
  // Tombol yang ditekan sekali (edge): dipakai game_main untuk aksi sekali tekan.
  pressedOnce: function (code) {
    if (this.down(code) && !this['_was_' + code]) {
      this['_was_' + code] = true;
      return true;
    }
    if (!this.down(code)) this['_was_' + code] = false;
    return false;
  }
};
