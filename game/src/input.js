// Keyboard and pointer input for Kota Karang. Held keys steer, run and brake;
// one-shot presses (enter a car, fire, pause) are queued and taken once per frame.

export const ACTION_CAR = 1;      // E: enter / leave a car
export const ACTION_FIRE = 2;     // Space on foot: fire
export const ACTION_PAUSE = 4;    // Esc / P: pause

const UP = new Set(['KeyW', 'ArrowUp']);
const DOWN = new Set(['KeyS', 'ArrowDown']);
const LEFT = new Set(['KeyA', 'ArrowLeft']);
const RIGHT = new Set(['KeyD', 'ArrowRight']);
const RUN = new Set(['ShiftLeft', 'ShiftRight']);
const CAR = new Set(['KeyE']);
const FIRE = new Set(['Space']);
const PAUSE = new Set(['Escape', 'KeyP']);
const ALL_KEYS = new Set([...UP, ...DOWN, ...LEFT, ...RIGHT, ...RUN, ...CAR, ...FIRE, ...PAUSE]);

export function createInput(target) {
  const held = new Set();
  let actions = 0;

  window.addEventListener('keydown', (event) => {
    if (held.has(event.code)) return;          // ignore auto-repeat
    held.add(event.code);
    if (CAR.has(event.code)) actions |= ACTION_CAR;
    else if (FIRE.has(event.code)) actions |= ACTION_FIRE;
    else if (PAUSE.has(event.code)) actions |= ACTION_PAUSE;
    if (ALL_KEYS.has(event.code)) event.preventDefault();
  });
  window.addEventListener('keyup', (event) => held.delete(event.code));
  window.addEventListener('blur', () => held.clear());

  // Pointer look only counts while the canvas holds the pointer lock.
  let yaw = 0;
  let pitch = -0.18;
  let locked = false;
  target.addEventListener('mousedown', () => {
    if (!locked) target.requestPointerLock?.();
  });
  document.addEventListener('pointerlockchange', () => {
    locked = document.pointerLockElement === target;
  });
  window.addEventListener('mousemove', (event) => {
    if (!locked) return;
    yaw -= event.movementX * 0.0022;
    pitch = Math.max(-1.2, Math.min(0.5, pitch - event.movementY * 0.0022));
  });

  return {
    /** movement axes relative to the camera, plus run and brake state */
    move() {
      const x = (held.has('KeyD') || held.has('ArrowRight') ? 1 : 0)
        - (held.has('KeyA') || held.has('ArrowLeft') ? 1 : 0);
      const y = (held.has('KeyW') || held.has('ArrowUp') ? 1 : 0)
        - (held.has('KeyS') || held.has('ArrowDown') ? 1 : 0);
      return { x, y, run: RUN.has('ShiftLeft') || RUN.has('ShiftRight'), braking: held.has('Space') };
    },
    look() { return { yaw, pitch }; },
    /** The one-shot presses since the last call, as ACTION_* flags. */
    takeActions() {
      const taken = actions;
      actions = 0;
      return taken;
    },
  };
}
