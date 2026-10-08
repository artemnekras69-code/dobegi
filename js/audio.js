/* =====================================================================
   ДОБЕГИ ДО КВАРТИРЫ — звук
   Все звуки синтезируются на лету через Web Audio API, без аудиофайлов.
   ===================================================================== */
(function (K) {
'use strict';

const CONFIG = K.CONFIG;

const MUSIC = {
  // Петля из 16 восьмых: бас и редкая мелодия. 0 — пауза.
  bass: [110, 0, 110, 164.81, 110, 0, 130.81, 146.83, 87.31, 0, 87.31, 130.81, 98, 0, 98, 146.83],
  lead: [659.25, 0, 0, 587.33, 0, 523.25, 0, 0, 440, 0, 523.25, 0, 587.33, 0, 0, 0,
         659.25, 0, 0, 783.99, 0, 659.25, 0, 0, 523.25, 0, 440, 0, 392, 0, 0, 0],
};

const SOUNDS = {
  jump(a) { a.tone({ freq: 360, to: 640, dur: 0.13, vol: 0.16 }); },
  land(a) { a.noise({ dur: 0.05, vol: 0.05, from: 500, to: 180 }); },
  duck(a) { a.noise({ dur: 0.12, vol: 0.07, from: 1400, to: 300 }); a.tone({ freq: 300, to: 170, dur: 0.1, vol: 0.08 }); },
  // хорошая квартира
  good(a) {
    a.tone({ freq: 784, dur: 0.08, vol: 0.16 });
    a.tone({ freq: 1175, dur: 0.16, vol: 0.16, delay: 0.07 });
  },
  // очень хорошая
  great(a) {
    [784, 988, 1175, 1568].forEach((f, i) => a.tone({ freq: f, dur: i === 3 ? 0.28 : 0.09, vol: 0.15, delay: i * 0.07 }));
    a.tone({ freq: 3136, type: 'sine', dur: 0.3, vol: 0.05, delay: 0.24 });
  },
  // плохая
  bad(a) {
    a.tone({ freq: 196, to: 98, type: 'sawtooth', dur: 0.24, vol: 0.13 });
    a.tone({ freq: 147, to: 73, type: 'square', dur: 0.26, vol: 0.07, delay: 0.09 });
  },
  // серия: чем выше множитель, тем выше нота
  combo(a, level) {
    const base = 523 * Math.pow(1.19, level || 1);
    [1, 1.26, 1.5, 2].forEach((k, i) => a.tone({ freq: base * k, dur: 0.09, vol: 0.14, delay: i * 0.06 }));
  },
  pickup(a) { a.tone({ freq: 1320, dur: 0.06, vol: 0.12 }); a.tone({ freq: 1760, dur: 0.12, vol: 0.12, delay: 0.05 }); },
  splash(a) { a.noise({ dur: 0.22, vol: 0.14, from: 2600, to: 500 }); },
  vanish(a) { a.tone({ freq: 720, to: 260, type: 'sine', dur: 0.2, vol: 0.12 }); },
  crash(a) {
    a.noise({ dur: 0.3, vol: 0.34, from: 1800, to: 110 });
    a.tone({ freq: 150, to: 44, type: 'sine', dur: 0.32, vol: 0.32 });
  },
  record(a) {
    [523, 659, 784, 1047, 1319].forEach((f, i) => a.tone({ freq: f, dur: i === 4 ? 0.4 : 0.1, vol: 0.15, delay: i * 0.085 }));
    a.tone({ freq: 1047, dur: 0.4, vol: 0.08, delay: 0.34 });
  },
  location(a) { a.noise({ dur: 0.35, vol: 0.06, from: 300, to: 3000 }); a.tone({ freq: 440, to: 660, dur: 0.22, vol: 0.08, delay: 0.05 }); },
  tick(a) { a.tone({ freq: 660, type: 'square', dur: 0.06, vol: 0.06 }); },
  go(a) { a.tone({ freq: 990, type: 'square', dur: 0.14, vol: 0.07 }); },
  click(a) { a.tone({ freq: 520, type: 'square', dur: 0.04, vol: 0.05 }); },
};

class AudioSystem {
  constructor(storage) {
    this.storage = storage;
    this.ctx = null;
    this.master = null;
    this.musicBus = null;
    this.noiseBuffer = null;
    this.musicTimer = null;
    this.step = 0;
    this.nextTime = 0;
  }

  /* Браузеры разрешают звук только после первого касания — вызывается из обработчика ввода */
  unlock() {
    try {
      if (!this.ctx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        this.ctx = new AC();
        this.master = this.ctx.createGain();
        this.master.gain.value = CONFIG.audio.volume;
        this.master.connect(this.ctx.destination);
        this.musicBus = this.ctx.createGain();
        this.musicBus.gain.value = CONFIG.audio.musicVolume;
        this.musicBus.connect(this.master);
        const len = this.ctx.sampleRate;
        this.noiseBuffer = this.ctx.createBuffer(1, len, len);
        const data = this.noiseBuffer.getChannelData(0);
        for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
      }
      if (this.ctx.state === 'suspended') this.ctx.resume();
      this.syncMusic();
    } catch (e) { /* без звука */ }
  }

  suspend() { try { if (this.ctx && this.ctx.state === 'running') this.ctx.suspend(); } catch (e) { /* ок */ } }
  resume() { try { if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume(); } catch (e) { /* ок */ } }

  tone({ freq, to = 0, type = 'triangle', dur = 0.1, vol = 0.15, delay = 0, out = null }) {
    const c = this.ctx, t = c.currentTime + delay;
    const osc = c.createOscillator(), gain = c.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    if (to) osc.frequency.exponentialRampToValueAtTime(to, t + dur);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(vol, t + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(gain);
    gain.connect(out || this.master);
    osc.start(t);
    osc.stop(t + dur + 0.03);
  }

  noise({ dur = 0.2, vol = 0.2, from = 1200, to = 200, delay = 0, out = null }) {
    const c = this.ctx, t = c.currentTime + delay;
    const src = c.createBufferSource(), filter = c.createBiquadFilter(), gain = c.createGain();
    src.buffer = this.noiseBuffer;
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(from, t);
    filter.frequency.exponentialRampToValueAtTime(to, t + dur);
    gain.gain.setValueAtTime(vol, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(out || this.master);
    src.start(t, Math.random() * 0.5);
    src.stop(t + dur + 0.03);
  }

  play(name, arg) {
    if (!this.storage.settings.sound || !this.ctx) return;
    try { SOUNDS[name](this, arg); } catch (e) { /* без звука */ }
  }

  /* Музыка: простой шаговый секвенсор */
  syncMusic() {
    const on = this.storage.settings.music && this.storage.settings.sound && this.ctx;
    if (on && !this.musicTimer) {
      this.step = 0;
      this.nextTime = this.ctx.currentTime + 0.06;
      this.musicTimer = setInterval(() => this._schedule(), 40);
    } else if (!on && this.musicTimer) {
      clearInterval(this.musicTimer);
      this.musicTimer = null;
    }
  }

  _schedule() {
    const c = this.ctx;
    if (!c || c.state !== 'running') return;
    const stepDur = 60 / CONFIG.audio.bpm / 2;
    if (this.nextTime < c.currentTime) this.nextTime = c.currentTime + 0.05;   // вкладка спала
    try {
      while (this.nextTime < c.currentTime + 0.14) {
        const delay = this.nextTime - c.currentTime;
        const bass = MUSIC.bass[this.step % 16], lead = MUSIC.lead[this.step % 32];
        if (bass) this.tone({ freq: bass, dur: stepDur * 0.92, vol: 0.2, delay, out: this.musicBus });
        if (lead) this.tone({ freq: lead, type: 'square', dur: stepDur * 0.8, vol: 0.035, delay, out: this.musicBus });
        if (this.step % 2 === 1) this.noise({ dur: 0.03, vol: 0.05, from: 9000, to: 5000, delay, out: this.musicBus });
        this.nextTime += stepDur;
        this.step++;
      }
    } catch (e) { /* без музыки */ }
  }
}

K.AudioSystem = AudioSystem;
K.SOUND_NAMES = Object.keys(SOUNDS);

})(window.KTM = window.KTM || {});
