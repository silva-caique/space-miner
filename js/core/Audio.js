// Sons sintetizados por WebAudio. Para usar arquivos reais, preencha AUDIO_FILES
// ex.: AUDIO_FILES.mine = 'assets/audio/mine.wav'; AUDIO_FILES.music = 'assets/audio/music.mp3'
export const AUDIO_FILES = { shot: null, shield: null, dash: null, hit: null, scan: null, combo: null, chest: null, mine: null, collect: null, sell: null, upgrade: null, discover: null, legend: null, hurt: null, pulse: null, slime: null, crab: null, rock: null, click: null, level: null, music: null };
export const AudioManager = class {
  constructor(state) { this.s = state; this.ctx = null; this.musicStarted = false; this.platformMute = false; this.adMute = false; this.pad = null; this.musicEl = null; }
  resume() {
    if (!this.ctx) { try { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {} }
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
  }
  tone(f, d, type = 'sine', vol = 0.3, slide = 0, delay = 0) {
    const c = this.ctx; if (!c || this.muted) return;
    const t = c.currentTime + delay, o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, f + slide), t + d);
    g.gain.setValueAtTime(Math.max(0.0001, vol * this.s.settings.sfx * this.s.settings.volume), t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    o.connect(g); g.connect(c.destination); o.start(t); o.stop(t + d + 0.02);
  }
  arp(notes, type, vol, step) { notes.forEach((f, i) => this.tone(f, 0.18, type, vol, 0, i * step)); }
  play(name, arg) {
    const file = AUDIO_FILES[name];
    if (file) { try { const a = new Audio(file); a.volume = this.s.settings.sfx * this.s.settings.volume; if (this.muted) return; a.play().catch(() => {}); } catch (e) {} return; }
    if (!this.ctx || this.muted || this.s.settings.sfx <= 0) return;
    switch (name) {
      case 'mine': this.tone(90 + Math.random() * 40, 0.08, 'sawtooth', 0.12, -30); break;
      case 'collect': this.tone(660, 0.1, 'triangle', 0.3); this.tone(990, 0.15, 'triangle', 0.3, 0, 0.08); break;
      case 'sell': this.arp([523, 659, 784, 1047], 'square', 0.12, 0.07); break;
      case 'upgrade': this.tone(300, 0.4, 'sawtooth', 0.15, 600); this.tone(600, 0.4, 'triangle', 0.2, 600, 0.1); break;
      case 'discover': this.arp([784, 988, 1175, 1568], 'sine', 0.25, 0.09); break;
      case 'legend': this.arp([523, 659, 784, 1047, 1319, 1568, 2093], 'triangle', 0.25, 0.08); break;
      case 'level': this.arp([440, 554, 659, 880], 'triangle', 0.25, 0.1); break;
      case 'hurt': this.tone(200, 0.25, 'sawtooth', 0.3, -120); break;
      case 'pulse': this.tone(500, 0.3, 'sine', 0.3, -400); break;
      case 'slime': this.tone(150, 0.2, 'sine', 0.2, 200); break;
      case 'crab': this.tone(900, 0.04, 'square', 0.1); this.tone(900, 0.04, 'square', 0.1, 0, 0.08); break;
      case 'rock': this.tone(60, 0.4, 'sawtooth', 0.25, -20); break;
      case 'growl': { const s = Math.max(1, arg || 1), f = Math.max(45, 180 / Math.sqrt(s)); this.tone(f, 0.35 + Math.min(0.5, s * 0.08), 'sawtooth', 0.22, -f * 0.35); this.tone(f * 1.5, 0.3, 'square', 0.1, -f * 0.5, 0.05); break; }
      case 'shot_blaster': this.tone(1100, 0.08, 'square', 0.1, -700); break;
      case 'shot_plasma': this.tone(380, 0.18, 'sawtooth', 0.14, -200); this.tone(190, 0.2, 'sine', 0.12, -60); break;
      case 'shot_shotgun': this.tone(120, 0.2, 'sawtooth', 0.22, -80); this.tone(240, 0.1, 'square', 0.15, -150); break;
      case 'shot_laser': this.tone(1400, 0.05, 'sine', 0.08, 200); break;
      case 'shot_rail': this.tone(2000, 0.3, 'sawtooth', 0.15, -1700); this.tone(80, 0.3, 'sine', 0.25); break;
      case 'shot_cannon': this.tone(90, 0.45, 'sawtooth', 0.28, -50); this.tone(300, 0.3, 'square', 0.1, -250); break;
      case 'hitmark': this.tone(1800, 0.03, 'square', 0.06); break;
      case 'kill': this.tone(700, 0.08, 'triangle', 0.18); this.tone(1100, 0.12, 'triangle', 0.18, 0, 0.06); break;
      case 'empty': this.tone(200, 0.06, 'square', 0.08); break;
      case 'shot': this.tone(1100, 0.08, 'square', 0.1, -700); break;
      case 'hit': this.tone(240, 0.06, 'square', 0.1, -120); break;
      case 'shield': this.tone(180, 0.35, 'sine', 0.3, 320); this.tone(540, 0.25, 'triangle', 0.12, 200, 0.05); break;
      case 'dash': this.tone(320, 0.18, 'sawtooth', 0.12, 700); break;
      case 'scan': this.tone(260, 0.7, 'sine', 0.3, 1100); this.tone(520, 0.7, 'triangle', 0.12, 1000, 0.15); break;
      case 'combo': this.tone(480 + Math.min(arg || 0, 30) * 28, 0.12, 'triangle', 0.22); break;
      case 'chest': this.arp([392, 494, 587, 784, 988], 'triangle', 0.22, 0.07); this.tone(120, 0.3, 'sawtooth', 0.2, -40); break;
      case 'click': this.tone(800, 0.05, 'square', 0.08); break;
    }
  }
  startMusic() {
    if (this.musicStarted) return; this.resume();
    if (AUDIO_FILES.music) { this.musicEl = new Audio(AUDIO_FILES.music); this.musicEl.loop = true; this.musicEl.volume = this.s.settings.music * this.s.settings.volume; this.musicEl.play().catch(() => {}); this.musicStarted = true; return; }
    const c = this.ctx; if (!c) return;
    this.musicStarted = true;
    const master = c.createGain(), lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 700;
    master.connect(lp); lp.connect(c.destination); this.pad = master;
    [110, 164.8, 220, 277.2, 329.6].forEach((f, i) => {
      const o = c.createOscillator(), g = c.createGain(), l = c.createOscillator(), lg = c.createGain();
      o.type = 'sine'; o.frequency.value = f; g.gain.value = 0.12;
      l.frequency.value = 0.05 + i * 0.03; lg.gain.value = 0.08; l.connect(lg); lg.connect(g.gain);
      o.connect(g); g.connect(master); o.start(); l.start();
    });
    this.setMusicVolume(this.s.settings.music);
  }
  setMusicVolume(v) {
    this.s.settings.music = v; this.refresh();
  }
  get muted() { return this.platformMute || this.adMute; }
  refresh() {
    const st = this.s.settings, m = this.muted ? 0 : st.music * st.volume;
    if (this.pad) this.pad.gain.value = m * 0.6;
    if (this.musicEl) this.musicEl.volume = m;
  }
  setPlatformMute(b) { if (b !== this.platformMute) { this.platformMute = b; this.refresh(); } }
  setAdMute(b) { this.adMute = b; this.refresh(); }
  setSuspended(b) { try { if (this.ctx) (b ? this.ctx.suspend() : this.ctx.resume()); } catch (e) { /* ignora */ } }
};
