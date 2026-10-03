import { Loader } from './core/Loader.js';
import { Config } from './core/Config.js';
import { Game } from './core/Game.js';
import { Tex } from './core/Tex.js';
import { CrazyGamesService } from './crazygames/CrazyGamesService.js';
import { SaveManager } from './save/SaveManager.js';

const frame = () => new Promise(r => setTimeout(r, 0));
async function boot() {
  const loader = new Loader(), crazy = new CrazyGamesService(), saves = new SaveManager(crazy); let game;
  loader
    .add('Core', 2, async () => { await crazy.init(); crazy.loadingStart(); await Config.loadAll(); }, true)
    .add('Jogador', 1, async () => { const raw = await saves.load(); game = new Game({ crazy, saves, raw, rendererFactory: window.__rendererFactory }); game.initRenderer(); game.initScene(); game.initSystems(); }, true)
    .add('Mapa', 3, async () => { game.buildLayer(0); }, true)
    .add('Inimigos', 1, async () => { game.populate(0); game.placePlayer(0); }, true)
    .add('Assets', 2, async () => { for (const n of ['sand', 'sandB', 'rock', 'rockB', 'metal', 'metalB']) { Tex.get(n); await frame(); } try { game.renderer.compile(game.scene, game.camera); } catch (e) { /* opcional */ } })
    .add('Áudio', 1, async () => { game.audio.setPlatformMute(crazy.muteAudio); });
  try { await loader.run(); } catch (e) { return; }
  window.__spaceMiner = game; game.begin(); crazy.loadingStop(); loader.hide();
}
boot();
