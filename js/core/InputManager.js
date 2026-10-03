// Entrada centralizada (teclado, mouse e captura do mouse). Os sistemas leem daqui, o que facilita adicionar toque/gamepad no futuro.
export class InputManager {
  constructor(game) {
    this.g = game; this.keys = {}; this.mouse = { left: false, right: false }; this.fireEdge = false; this.look = { x: 0, y: 0 }; this.wheel = 0;
    this.locked = false; this.releasing = false; this.inDir = null; this.canvas = document.getElementById('game');
    this.lockSupported = !!(this.canvas && typeof this.canvas.requestPointerLock === 'function');
    this.bind();
  }
  get fire() { return this.mouse.left && (this.locked || !this.lockSupported); }
  get mine() { return this.mouse.right || !!this.keys.Space; }
  reset() { this.keys = {}; this.mouse.left = false; this.mouse.right = false; this.fireEdge = false; this.look.x = 0; this.look.y = 0; this.wheel = 0; }
  lock() { if (!this.lockSupported || this.locked) return; try { const p = this.canvas.requestPointerLock(); if (p && p.catch) p.catch(() => {}); } catch (e) { /* ignora */ } }
  unlock() { if (this.locked) { this.releasing = true; try { document.exitPointerLock(); } catch (e) { this.releasing = false; } } }
  bind() {
    window.addEventListener('keydown', e => this.onKeyDown(e)); window.addEventListener('keyup', e => this.onKeyUp(e)); window.addEventListener('blur', () => this.reset());
    window.addEventListener('mouseup', e => this.onMouseUp(e)); window.addEventListener('mousemove', e => this.onMouseMove(e));
    if (this.canvas) { this.canvas.addEventListener('mousedown', e => this.onMouseDown(e)); this.canvas.addEventListener('contextmenu', e => e.preventDefault()); this.canvas.addEventListener('wheel', e => { this.wheel += Math.sign(e.deltaY); }, { passive: true }); }
    document.addEventListener('pointerlockchange', () => this.onLockChange()); document.addEventListener('pointerlockerror', () => this.g.ui.toast('Não foi possível capturar o mouse. Use as setas para girar a câmera.', 'warn'));
  }
  onKeyDown(e) {
    const g = this.g;
    if (e.code === 'F3') { if (e.preventDefault) e.preventDefault(); g.perf.toggleDebug(); return; }
    if (e.code === 'Escape') { g.onEscape(); return; }
    if (!g.fsm.is('GAMEPLAY')) return;
    this.keys[e.code] = true;
    if (e.repeat || g.ui.panelOpen) return;
    const c = e.code;
    if (c === 'KeyE') g.interact(); else if (c === 'KeyF') g.pulse(); else if (c === 'KeyR') g.startRecall(); else if (c === 'KeyQ') g.scanner.use();
    else if (c === 'KeyV') g.pcombat.shield(); else if (c === 'KeyZ') g.pcombat.dash(); else if (c === 'KeyP') g.ui.open(g.petUI); else if (c === 'KeyI') g.ui.open(g.invUI); else if (c === 'KeyC') g.ui.open(g.codexUI);
    else if (/^Digit[1-9]$/.test(c) && g.canPlay()) g.combat.weapons.selectSlot(+c[5] - 1);
  }
  onKeyUp(e) { this.keys[e.code] = false; if (e.code === 'KeyR') this.g.cancelRecall(); }
  onMouseDown(e) {
    const g = this.g; if (g.audio) g.audio.resume();
    if (!g.fsm.is('GAMEPLAY') || g.ui.panelOpen) return;
    if (this.lockSupported && !this.locked) { this.lock(); return; } // o primeiro clique só captura o mouse
    if (e.button === 0) { this.mouse.left = true; this.fireEdge = true; } else if (e.button === 2) this.mouse.right = true;
  }
  onMouseUp(e) { if (e.button === 0) this.mouse.left = false; else if (e.button === 2) this.mouse.right = false; }
  onMouseMove(e) { if (this.locked) { this.look.x += e.movementX || 0; this.look.y += e.movementY || 0; } }
  onLockChange() {
    const was = this.locked; this.locked = document.pointerLockElement === this.canvas;
    if (was && !this.locked) {
      this.mouse.left = false; this.mouse.right = false;
      if (this.releasing) this.releasing = false; else if (this.g.fsm.is('GAMEPLAY') && !this.g.ui.panelOpen) this.g.pause(); // Esc com o mouse capturado
    }
  }
}
