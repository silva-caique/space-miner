import * as THREE from '../lib/three/build/three.module.js';
import { EffectComposer } from '../lib/three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from '../lib/three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from '../lib/three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from '../lib/three/examples/jsm/postprocessing/ShaderPass.js';
import { SaveData } from './SaveData.js';
import { GameState, States } from './GameState.js';
import { Config } from './Config.js';
import { AudioManager } from './Audio.js';
import { Particles } from './Particles.js';
import { Toon, Sky, lin } from './Toon.js';
import { PerformanceManager } from './PerformanceManager.js';
import { glowTexture } from '../mining/Resource.js';
import { ResourceManager } from '../mining/ResourceManager.js';
import { MiningSystem } from '../mining/MiningSystem.js';
import { PickupManager } from '../mining/Pickup.js';
import { Combo } from '../mining/Combo.js';
import { Scanner } from '../mining/Scanner.js';
import { ChestManager } from '../mining/Chest.js';
import { Inventory } from '../inventory/Inventory.js';
import { Economy } from '../economy/Economy.js';
import { UpgradeSystem } from '../upgrades/UpgradeSystem.js';
import { MissionSystem } from '../missions/MissionSystem.js';
import { Achievements } from '../missions/Achievements.js';
import { Codex } from '../codex/Codex.js';
import { PlanetManager } from '../planets/PlanetManager.js';
import { EnemyManager, HazardManager } from '../enemies/EnemyManager.js';
import { PlayerStats } from '../player/PlayerStats.js';
import { Player } from '../player/Player.js';
import { PlayerController } from '../player/PlayerController.js';
import { PlayerCombat } from '../player/PlayerCombat.js';
import { InputManager } from './InputManager.js';
import { CombatManager } from '../combat/CombatManager.js';
import { Pet } from '../pet/Pet.js';
import { UIManager } from '../ui/UIManager.js';
import { MainMenu } from '../ui/MainMenu.js';
import { HUD } from '../ui/HUD.js';
import { Minimap } from '../ui/Minimap.js';
import { ShopUI } from '../ui/ShopUI.js';
import { InventoryUI } from '../ui/InventoryUI.js';
import { CodexUI } from '../ui/CodexUI.js';
import { SettingsUI } from '../ui/SettingsUI.js';
import { PetUI } from '../ui/PetUI.js';
import { PauseMenu } from '../ui/PauseMenu.js';
import { GameOverUI } from '../ui/GameOverUI.js';
import { AdManager } from '../crazygames/AdManager.js';

// Ajustes visuais (fáceis de mexer): brilho, força do bloom, intensidade do sol
export const FX = { exposure: 1.05, bloomStrength: 0.7, bloomRadius: 0.55, bloomThreshold: 1.0, sun: 1.5, hemi: 0.6 };
const sleep = ms => new Promise(r => setTimeout(r, ms));

export class Game {
  constructor({ crazy, saves, raw, rendererFactory } = {}) {
    this.crazy = crazy; this.saves = saves; this.rendererFactory = rendererFactory;
    this.state = new SaveData(); this.state.load(raw);
    this.fsm = new GameState(); this.fsm.on((s, p) => this.onState(s, p));
    this.layer = 0; this.shake = 0; this.prompt = ''; this.near = null; this.busy = false; this.adActive = false; this.pulseCd = 0; this.lt = 0;
    this.recall = { on: false, t: 0 }; this.recallCd = 0; this.fogScale = 1; this.syncT = 0; this.lastLoss = { items: {}, count: 0, bonus: 0 };
  }
  get mode() { return this.fsm.is(States.GAMEPLAY) ? 'play' : 'menu'; }

  // ---------- inicialização em etapas (chamadas pela tela de loading) ----------
  initRenderer() {
    const canvas = document.getElementById('game');
    this.renderer = this.rendererFactory ? this.rendererFactory(canvas) : new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
    this.renderer.outputEncoding = THREE.sRGBEncoding; this.renderer.toneMapping = THREE.ACESFilmicToneMapping; this.renderer.toneMappingExposure = FX.exposure;
    if (this.renderer.info) this.renderer.info.autoReset = false;
    this.renderer.shadowMap.enabled = true; this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.scene = new THREE.Scene(); this.camera = new THREE.PerspectiveCamera(60, 1, 0.1, 500);
  }
  initScene() {
    this.hemi = new THREE.HemisphereLight(0xffffff, 0x444444, 1); this.sun = new THREE.DirectionalLight(0xffffff, 1); this.sun.position.set(30, 60, 20);
    this.scene.add(this.hemi, this.sun, this.sun.target);
    const sh = this.sun.shadow; this.sun.castShadow = true; sh.mapSize.set(2048, 2048); const c = sh.camera; c.left = -45; c.right = 45; c.top = 45; c.bottom = -45; c.near = 1; c.far = 220; sh.bias = -0.0004; sh.normalBias = 0.06;
    const sp = new Float32Array(900 * 3);
    for (let i = 0; i < 900; i++) { const a = Math.random() * 6.283, u = Math.random() * 2 - 1, r = Math.sqrt(1 - u * u); sp[i * 3] = Math.cos(a) * r * 300; sp[i * 3 + 1] = Math.abs(u) * 300; sp[i * 3 + 2] = Math.sin(a) * r * 300; }
    const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.BufferAttribute(sp, 3));
    this.stars = new THREE.Points(sg, new THREE.PointsMaterial({ color: 0xffffff, size: 1.6, sizeAttenuation: false, fog: false })); this.scene.add(this.stars);
    this.sky = new THREE.Mesh(new THREE.SphereGeometry(420, 32, 16), new THREE.MeshBasicMaterial({ side: THREE.BackSide, fog: false, depthWrite: false })); this.sky.material.toneMapped = false; this.sky.renderOrder = -10; this.scene.add(this.sky);
    this.bgPlanet = new THREE.Group();
    const bp = new THREE.Mesh(new THREE.SphereGeometry(34, 24, 16), new THREE.MeshBasicMaterial({ map: Sky.moon(), fog: false }));
    const bo = new THREE.Mesh(new THREE.SphereGeometry(37, 24, 16), new THREE.MeshBasicMaterial({ color: 0x1a0d2e, side: THREE.BackSide, fog: false }));
    const bg = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(), color: 0xb98cff, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, fog: false })); bg.scale.set(150, 150, 1);
    bp.material.toneMapped = false; bo.material.toneMapped = false;
    this.bgPlanet.add(bg, bo, bp); this.bgPlanet.position.set(-130, 100, -230); this.scene.add(this.bgPlanet);
    this.world = new THREE.Group(); this.scene.add(this.world);
    this.particles = new Particles(this.scene);
  }
  initSystems() {
    this.audio = new AudioManager(this.state); this.ui = new UIManager(this); this.ads = new AdManager(this);
    this.upgrades = new UpgradeSystem(this); this.stats = new PlayerStats(this); this.inventory = new Inventory(this); this.economy = new Economy(this);
    this.missions = new MissionSystem(this); this.codex = new Codex(this); this.achievements = new Achievements(this);
    this.planets = new PlanetManager(this); this.planets.load(Config.planets); this.planet = this.planets.get('mars');
    this.resources = new ResourceManager(this); this.enemies = new EnemyManager(this); this.hazards = new HazardManager(this); this.mining = new MiningSystem(this); this.pickups = new PickupManager(this);
    this.input = new InputManager(this); this.player = new Player(this); this.controller = new PlayerController(this);
    this.combo = new Combo(this); this.scanner = new Scanner(this); this.chests = new ChestManager(this); this.pet = new Pet(this); this.pcombat = new PlayerCombat(this); this.combat = new CombatManager(this);
    this.hud = new HUD(this); this.menu = new MainMenu(this); this.minimap = new Minimap(this);
    this.shopUI = new ShopUI(this); this.invUI = new InventoryUI(this); this.codexUI = new CodexUI(this); this.settingsUI = new SettingsUI(this); this.petUI = new PetUI(this);
    this.pauseUI = new PauseMenu(this); this.gameOverUI = new GameOverUI(this);
    this.perf = new PerformanceManager(this); this.setupFX(); this.bindPlatform();
    this.stats.hp = this.stats.maxHp; this.stats.energy = this.stats.maxEnergy;
    this.resize(); this.perf.apply();
  }
  initAll() { this.initRenderer(); this.initScene(); this.initSystems(); this.loadLayer(0); }
  begin() { this.loop = this.loop.bind(this); requestAnimationFrame(this.loop); this.fsm.set(States.MENU); }

  setupFX() {
    this.fx = null;
    try {
      const w = window.innerWidth, h = window.innerHeight, F = FX;
      const rt = new THREE.WebGLRenderTarget(w, h, { type: THREE.HalfFloatType, format: THREE.RGBAFormat, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter });
      const comp = new EffectComposer(this.renderer, rt); comp.addPass(new RenderPass(this.scene, this.camera));
      const bloom = new UnrealBloomPass(new THREE.Vector2(w / 2, h / 2), F.bloomStrength, F.bloomRadius, F.bloomThreshold); comp.addPass(bloom);
      comp.addPass(new ShaderPass({ uniforms: { tDiffuse: { value: null }, exposure: { value: F.exposure } },
        vertexShader: 'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
        fragmentShader: 'uniform sampler2D tDiffuse;uniform float exposure;varying vec2 vUv;vec3 aces(vec3 x){return clamp((x*(2.51*x+0.03))/(x*(2.43*x+0.59)+0.14),0.0,1.0);}void main(){vec3 c=texture2D(tDiffuse,vUv).rgb*exposure;gl_FragColor=vec4(pow(aces(c),vec3(1.0/2.2)),1.0);}' }));
      this.fx = { comp, bloom };
    } catch (e) { console.warn('Efeitos desativados:', e); this.fx = null; }
    if (this.perf) this.perf.fxOn = null;
  }
  resize() {
    const w = window.innerWidth, h = window.innerHeight; this.renderer.setSize(w, h); if (this.fx) this.fx.comp.setSize(w, h);
    this.camera.aspect = w / h; this.camera.updateProjectionMatrix();
  }
  bindPlatform() {
    window.addEventListener('resize', () => this.resize());
    window.addEventListener('beforeunload', () => this.saves.flush(true));
    document.addEventListener('visibilitychange', () => { if (document.hidden) { this.autoPause(); this.audio.setSuspended(true); } else this.audio.setSuspended(false); });
    window.addEventListener('blur', () => this.autoPause());
    this.crazy.muteListeners.push(m => this.audio.setPlatformMute(m));
    // Evita que a página role com roda do mouse, setas ou espaço (exigência do portal)
    window.addEventListener('wheel', e => { const t = e.target; if (!(t && t.closest && t.closest('#panel-body'))) e.preventDefault(); }, { passive: false });
    window.addEventListener('keydown', e => { const t = e.target; if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code) && !(t && /INPUT|SELECT|TEXTAREA/.test(t.tagName || ''))) e.preventDefault(); });
    setInterval(() => { if (this.fsm.is(States.GAMEPLAY)) this.save(); }, 8000);
  }
  save() { this.saves.request(this.state); }
  applyFog() {
    const f = this.scene && this.scene.fog; if (!f || !this.planet) return;
    const L = this.planet.layers[this.layer]; f.near = L.fogNear * this.fogScale; f.far = L.fogFar * this.fogScale;
  }

  // ---------- estados ----------
  onState(s) {
    if (s !== States.GAMEPLAY) this.input.unlock();
    if (s !== States.MENU && s !== States.GAME_OVER) this.ads.hideBanners();
    if (s === States.MENU) { this.ui.closeAll(); this.hud.hide(); this.menu.show(); this.saves.flush(true); this.ads.showBanner('menu'); }
    else if (s === States.GAMEPLAY) { this.menu.hide(); this.hud.show(); }
    else if (s === States.PAUSED) { this.ui.open(this.pauseUI); this.saves.flush(true); }
    else if (s === States.GAME_OVER) { this.hud.hide(); this.ui.open(this.gameOverUI); this.ads.showBanner('gameover'); }
  }
  start() {
    if (!this.fsm.is(States.MENU)) return;
    this.audio.resume(); this.audio.startMusic(); this.fsm.set(States.GAMEPLAY); this.input.lock();
    this.missions.notify('depth', this.layer); this.ui.toast('WASD move · Espaço/clique minera · E interage', '');
  }
  pause() {
    if (!this.fsm.is(States.GAMEPLAY)) return;
    this.input.reset(); this.player.setBeam(null); this.hud.mineProgress(0); this.cancelRecall(); this.fsm.set(States.PAUSED);
  }
  autoPause() { if (this.fsm.is(States.GAMEPLAY) && !this.adActive) this.pause(); }
  resume() { if (!this.fsm.is(States.PAUSED)) return; this.ui.closeAll(); this.fsm.set(States.GAMEPLAY); this.input.lock(); }
  toMenu() {
    if (this.fsm.is(States.GAME_OVER)) { this.stats.hp = this.stats.maxHp; this.stats.energy = this.stats.maxEnergy * 0.5; this.loadLayer(0); }
    this.fsm.set(States.MENU); this.ads.interstitial('menu');
  }
  onEscape() {
    const f = this.fsm;
    if (f.is(States.GAMEPLAY)) { if (this.ui.panelOpen) this.ui.close(); else this.pause(); }
    else if (f.is(States.PAUSED)) { if (this.ui.comp === this.pauseUI) this.resume(); else this.ui.close(); }
    else if (f.is(States.MENU) && this.ui.panelOpen) this.ui.close();
  }
  canPlay() { return this.fsm.is(States.GAMEPLAY) && !this.ui.panelOpen && !this.busy && !this.adActive; }
  adStart() { this.adActive = true; this.audio.setAdMute(true); this.input.reset(); this.input.unlock(); this.player.setBeam(null); }
  adEnd() { this.adActive = false; this.audio.setAdMute(false); }
  newGame() {
    this.saves.wipe(); this.state.reset(); this.pet.build(); this.combo.reset(); this.stats.hp = this.stats.maxHp; this.stats.energy = this.stats.maxEnergy;
    this.loadLayer(0); this.ui.closeAll(); this.fsm.set(States.MENU); this.menu.show(); this.save(); this.ui.toast('Novo jogo iniciado!', 'discover');
  }
  onDeath() {
    if (this.busy || !this.fsm.is(States.GAMEPLAY)) return;
    this.pcombat.clear(); this.combat.clear(); this.cancelRecall(); this.state.stats.deaths++;
    this.lastLoss = { items: { ...this.state.inventory }, count: this.inventory.count, bonus: this.state.comboBonus };
    this.inventory.clear(); this.state.comboBonus = 0; this.combo.reset(); this.input.reset(); this.player.setBeam(null); this.hud.mineProgress(0);
    this.audio.play('hurt'); this.fsm.set(States.GAME_OVER); this.save();
  }
  async respawn() {
    if (this.busy) return; this.busy = true;
    await this.ads.interstitial('gameover');
    this.ui.closeAll(); const f = document.getElementById('fade'); f.classList.add('on'); await sleep(450);
    this.stats.hp = this.stats.maxHp; this.stats.energy = this.stats.maxEnergy * 0.5; this.loadLayer(0);
    f.classList.remove('on'); this.busy = false; this.fsm.set(States.GAMEPLAY); this.save();
  }
  recoverLoss() {
    const L = this.lastLoss; let got = 0;
    for (const id in L.items) for (let i = 0; i < L.items[id]; i++) if (this.inventory.add(id, 1)) got++;
    this.state.comboBonus += L.bonus; this.lastLoss = { items: {}, count: 0, bonus: 0 };
    this.ui.toast(`📦 ${got} itens recuperados!`, 'discover'); this.audio.play('collect'); this.save();
  }

  // ---------- mundo ----------
  loadLayer(i, from) { this.buildLayer(i); this.populate(i); this.placePlayer(i, from); }
  buildLayer(i) {
    this.layer = i; const L = this.planet.layers[i]; this.scanner.waves = []; this.pcombat.clear(); this.combat.clear(); this.pickups.clear();
    while (this.world.children.length) {
      const c = this.world.children[0]; this.world.remove(c);
      c.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose(); });
    }
    this.planet.build(this.world, i);
    this.scene.fog = new THREE.Fog(lin(L.fog), L.fogNear * this.fogScale, L.fogFar * this.fogScale); this.scene.background = this.scene.fog.color;
    if (this.sky.material.map) this.sky.material.map.dispose(); this.sky.material.map = Sky.texture(L); this.sky.material.needsUpdate = true;
    this.hemi.color.copy(lin(L.hemi[0])); this.hemi.groundColor.copy(lin(L.hemi[1])); this.hemi.intensity = L.light * FX.hemi; this.sun.color.copy(lin(L.sun || 0xfff0dc)); this.sun.intensity = L.light * FX.sun;
    this.stars.visible = i <= 1; this.bgPlanet.visible = i === 0;
  }
  populate(i) {
    const L = this.planet.layers[i];
    this.resources.spawn(i, this.world, this.planet); this.enemies.spawn(L, this.world, this.planet); this.hazards.spawn(L, this.world, this.planet); this.chests.spawn(i, this.world, this.planet);
    Toon.shadows(this.world, true);
    this.world.children.forEach(o => { if (o.geometry && o.geometry.type === 'PlaneGeometry') { o.castShadow = false; o.receiveShadow = true; } });
  }
  placePlayer(i, from) {
    let sx = 0, sz = 7;
    if (i > 0) { const pt = from === 'up' && this.planet.portalDown ? this.planet.portalDown : this.planet.portalUp; sx = pt.x + 3; sz = pt.z + 3; }
    this.player.pos.set(sx, this.planet.heightAt(sx, sz), sz); this.pet.reset();
    if (this.fsm.is(States.GAMEPLAY)) { this.missions.notify('depth', i); const nv = this.resources.veins.length; if (nv) this.ui.toast(`💎 ${nv} veio${nv > 1 ? 's' : ''} rico${nv > 1 ? 's' : ''} nesta camada. Procure a estrela dourada no minimapa!`, 'discover'); }
    this.state.stats.maxDepth = Math.max(this.state.stats.maxDepth, i);
  }
  async changeLayer(d) {
    if (this.busy) return; this.busy = true;
    if (this.enemies.threat < 0.05) await this.ads.interstitial('camada');
    const f = document.getElementById('fade'); f.classList.add('on');
    setTimeout(() => { this.loadLayer(this.layer + d, d > 0 ? 'down' : 'up'); f.classList.remove('on'); this.busy = false; this.audio.play('pulse'); this.save(); }, 380);
  }
  startRecall() {
    if (!this.canPlay() || this.recall.on) return; const P = this.player.pos;
    if (this.layer === 0 && Math.hypot(P.x, P.z) < 16) { this.ui.toast('Você já está perto da nave.', ''); return; }
    if (this.recallCd > 0) { this.ui.toast(`🌀 Retorno recarregando (${Math.ceil(this.recallCd)}s)`, 'warn'); return; }
    if (this.stats.energy < 25) { this.ui.toast('⚡ O retorno precisa de 25 de energia.', 'warn'); return; }
    this.recall.on = true; this.recall.t = 0; this.audio.play('pulse');
  }
  cancelRecall() { if (!this.recall.on) return; this.recall.on = false; this.recall.t = 0; this.hud.recallProgress(0); }
  doRecall() {
    this.cancelRecall(); this.stats.energy -= 25; this.recallCd = 45; this.state.stats.recalls++;
    if (this.busy) return; this.busy = true; const f = document.getElementById('fade'); f.classList.add('on');
    setTimeout(() => { this.loadLayer(0); f.classList.remove('on'); this.busy = false; this.audio.play('upgrade'); this.ui.toast('🌀 De volta à nave!', 'discover'); this.save(); }, 380);
  }
  interact() {
    if (!this.canPlay()) return;
    if (this.near === 'ship') this.ui.open(this.shopUI, 'sell');
    else if (this.near === 'down') this.changeLayer(1);
    else if (this.near === 'up') this.changeLayer(-1);
    else if (this.near === 'chest' && this.nearChest) this.chests.open(this.nearChest);
  }
  pulse() {
    if (!this.canPlay() || this.pulseCd > 0 || this.stats.energy < 10) return;
    this.stats.energy -= 10; this.pulseCd = 0.8; this.audio.play('pulse');
    const p = this.player.pos; this.particles.burst(new THREE.Vector3(p.x, p.y + 1, p.z), 0x7fefff, 30, 9);
    this.enemies.pulse(p, 7, 25);
  }
  updatePlay(dt, t) {
    const P = this.player.pos, pl = this.planet; this.pulseCd -= dt; this.recallCd = Math.max(0, this.recallCd - dt);
    this.state.playtime += dt; if (this.state.buffs.turbo > 0) this.state.buffs.turbo = Math.max(0, this.state.buffs.turbo - dt);
    if (this.recall.on) {
      this.recall.t += dt; this.hud.recallProgress(this.recall.t / 2.5);
      if (Math.random() < 0.5) this.particles.burst(new THREE.Vector3(P.x, P.y + 0.3 + this.recall.t, P.z), 0x7fefff, 3, 3);
      if (this.recall.t >= 2.5) this.doRecall();
    }
    this.achievements.update(dt);
    this.pcombat.update(dt); this.controller.update(dt); this.combat.update(dt); this.mining.update(dt); this.enemies.update(dt); this.pickups.update(dt); this.hazards.update(dt, t); this.combo.update(dt, this.player.mining);
    this.stats.energy = Math.min(this.stats.maxEnergy, this.stats.energy + 0.6 * dt);
    this.near = null; this.prompt = '';
    if (this.layer === 0 && Math.hypot(P.x, P.z) < 10) { this.near = 'ship'; this.prompt = '[E] Abrir a nave: vender e melhorar'; this.stats.refill(dt); }
    const pd = pl.portalDown, pu = pl.portalUp;
    if (pd && Math.hypot(P.x - pd.x, P.z - pd.z) < 4.5) { this.near = 'down'; this.prompt = `[E] Descer para ${pl.layers[this.layer + 1].name}`; }
    else if (pu && Math.hypot(P.x - pu.x, P.z - pu.z) < 4.5) { this.near = 'up'; this.prompt = `[E] Subir para ${pl.layers[this.layer - 1].name}`; }
    const ch = this.chests.nearest(P, 3.4); if (ch) { this.near = 'chest'; this.nearChest = ch; this.prompt = `[E] Abrir ${ch.tier.name}`; }
  }
  ambient(dt, t) {
    this.planet.update(t); this.resources.update(dt, t); this.scanner.update(dt); this.chests.update(dt); this.pet.update(dt, t);
  }
  loop(ms) {
    requestAnimationFrame(this.loop);
    const t = ms / 1000, raw = t - (this.lt || t), dt = Math.min(0.05, raw); this.lt = t;
    this.perf.tick(raw);
    const s = this.fsm.state;
    if (s === States.GAMEPLAY) {
      if (!this.adActive) {
        this.ambient(dt, t);
        if (this.canPlay()) { this.updatePlay(dt, t); this.minimap.update(t); } else { this.cancelRecall(); this.input.fireEdge = false; this.input.look.x = 0; this.input.look.y = 0; this.player.moving = false; this.player.setBeam(null); this.hud.mineProgress(0); }
        this.player.update(dt, t); this.particles.update(dt);
      }
      this.controller.updateCamera(dt); this.hud.update();
    } else if (s !== States.PAUSED) { // MENU, GAME_OVER: cena viva ao fundo
      this.ambient(dt, t); const P = this.player.pos, a = t * 0.12; this.player.moving = false; this.player.update(dt, t); this.particles.update(dt);
      this.camera.position.set(P.x + Math.cos(a) * 26, P.y + 12, P.z + Math.sin(a) * 26); this.camera.lookAt(P.x, P.y + 4, P.z);
    }
    this.syncT -= raw; if (this.syncT <= 0) { this.syncT = 0.5; this.audio.setPlatformMute(this.crazy.muteAudio); }
    this.crazy.setPlaying(s === States.GAMEPLAY && !this.ui.panelOpen && !this.busy && !this.adActive && !(typeof document !== 'undefined' && document.hidden));
    this.stars.position.copy(this.camera.position); this.sky.position.copy(this.camera.position); this.bgPlanet.position.set(this.camera.position.x - 150, 105, this.camera.position.z - 260);
    const P = this.player.pos; this.sun.target.position.copy(P); this.sun.position.set(P.x + 55, P.y + 50, P.z + 30);
    this.render();
  }
  render() {
    if (this.renderer.info) this.renderer.info.reset();
    if (this.perf.useFx) { try { this.fx.comp.render(); return; } catch (e) { console.warn('Efeitos desativados:', e); this.fx = null; this.perf.apply(); } }
    this.renderer.render(this.scene, this.camera);
  }
}
