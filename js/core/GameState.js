// Máquina de estados do jogo: LOADING -> MENU <-> GAMEPLAY <-> PAUSED, e GAME_OVER após a morte.
export const States = { LOADING: 'LOADING', MENU: 'MENU', GAMEPLAY: 'GAMEPLAY', PAUSED: 'PAUSED', GAME_OVER: 'GAME_OVER' };
export class GameState {
  constructor() { this.state = States.LOADING; this.prev = null; this.listeners = []; }
  on(fn) { this.listeners.push(fn); }
  is(s) { return this.state === s; }
  set(s) {
    if (s === this.state) return;
    this.prev = this.state; this.state = s;
    for (const fn of this.listeners) { try { fn(s, this.prev); } catch (e) { console.error('[GameState]', e); } }
  }
}
