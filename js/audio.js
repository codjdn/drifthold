// DRIFTHOLD - audio.js
// Chiptune sound effects and a soft generative music loop, synthesised with the Web Audio API.
(function (DH) {
  'use strict';
  var Snd = { ctx: null, sfxOn: true, musicOn: true, track: null };
  var master, sfxBus, musicBus, noiseBuf, thrust = null;

  Snd.unlock = function () {
    if (!Snd.ctx) {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      try { Snd.ctx = new AC(); } catch (e) { return; }
      var c = Snd.ctx;
      master = c.createGain(); master.gain.value = 0.55; master.connect(c.destination);
      sfxBus = c.createGain(); sfxBus.gain.value = Snd.sfxOn ? 1 : 0; sfxBus.connect(master);
      musicBus = c.createGain(); musicBus.gain.value = Snd.musicOn ? 0.5 : 0; musicBus.connect(master);
      noiseBuf = c.createBuffer(1, c.sampleRate, c.sampleRate);
      var d = noiseBuf.getChannelData(0);
      for (var i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      startScheduler();
    }
    if (Snd.ctx.state === 'suspended') Snd.ctx.resume();
  };

  Snd.setSfx = function (on) {
    Snd.sfxOn = on;
    if (sfxBus) sfxBus.gain.setTargetAtTime(on ? 1 : 0, Snd.ctx.currentTime, 0.02);
  };
  Snd.setMusicOn = function (on) {
    Snd.musicOn = on;
    if (musicBus) musicBus.gain.setTargetAtTime(on ? 0.5 : 0, Snd.ctx.currentTime, 0.1);
  };
  Snd.suspend = function () { if (Snd.ctx && Snd.ctx.state === 'running') Snd.ctx.suspend(); };
  Snd.resume = function () { if (Snd.ctx && Snd.ctx.state === 'suspended') Snd.ctx.resume(); };

  // ------------------------------------------------------------------ voices
  function tone(freq, dur, o) {
    var c = Snd.ctx; if (!c) return;
    o = o || {};
    var t0 = c.currentTime + (o.delay || 0);
    var osc = c.createOscillator(), g = c.createGain();
    osc.type = o.type || 'square';
    osc.frequency.setValueAtTime(freq, t0);
    if (o.slide) osc.frequency.exponentialRampToValueAtTime(Math.max(20, o.slide), t0 + dur);
    var v = (o.vol || 0.12);
    var a = o.attack || 0.004;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(v, t0 + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g); g.connect(o.bus || sfxBus);
    osc.start(t0); osc.stop(t0 + dur + 0.02);
  }
  function noise(dur, o) {
    var c = Snd.ctx; if (!c) return;
    o = o || {};
    var t0 = c.currentTime + (o.delay || 0);
    var src = c.createBufferSource(); src.buffer = noiseBuf; src.loop = true;
    var f = c.createBiquadFilter(); f.type = o.filter || 'lowpass';
    f.frequency.setValueAtTime(o.freq || 2000, t0);
    if (o.slide) f.frequency.exponentialRampToValueAtTime(o.slide, t0 + dur);
    f.Q.value = o.q || 1;
    var g = c.createGain();
    g.gain.setValueAtTime(o.vol || 0.15, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(f); f.connect(g); g.connect(o.bus || sfxBus);
    src.start(t0, Math.random() * 0.5); src.stop(t0 + dur + 0.02);
  }
  function arp(notes, step, o) {
    o = o || {};
    notes.forEach(function (n, i) {
      var p = {}; for (var k in o) p[k] = o[k];
      p.delay = (o.delay || 0) + i * step;
      tone(n, o.len || step * 1.6, p);
    });
  }
  var NOTE = function (n) { return 440 * Math.pow(2, (n - 69) / 12); };
  Snd.NOTE = NOTE;

  var last = {};
  Snd.play = function (name, p) {
    if (!Snd.ctx || !Snd.sfxOn) return;
    var now = Snd.ctx.currentTime;
    // simple rate limiting so bursts don't get noisy
    var gap = { drill: 0.06, pickup: 0.03, tick: 0.03, click: 0.03, crack: 0.05 }[name] || 0.015;
    if (last[name] && now - last[name] < gap) return;
    last[name] = now;
    switch (name) {
      case 'click': tone(740, 0.05, { vol: 0.08 }); tone(1110, 0.04, { delay: 0.025, vol: 0.06 }); break;
      case 'back': tone(520, 0.07, { vol: 0.08, slide: 330 }); break;
      case 'nope': tone(160, 0.12, { vol: 0.1 }); tone(150, 0.1, { delay: 0.1, vol: 0.08 }); break;
      case 'tab': tone(880, 0.03, { vol: 0.06, type: 'triangle' }); break;
      case 'pickup': tone(NOTE(76 + (p || 0)), 0.06, { vol: 0.07 }); tone(NOTE(83 + (p || 0)), 0.06, { delay: 0.04, vol: 0.06 }); break;
      case 'drill': noise(0.05, { filter: 'bandpass', freq: 1700 + Math.random() * 600, vol: 0.09, q: 3 }); tone(95 + Math.random() * 20, 0.05, { type: 'sawtooth', vol: 0.04 }); break;
      case 'chunk': tone(NOTE(64 + (p || 0)), 0.07, { type: 'triangle', vol: 0.12, slide: NOTE(76 + (p || 0)) }); break;
      case 'crack': noise(0.22, { freq: 1600, slide: 200, vol: 0.18 }); tone(140, 0.12, { vol: 0.06, slide: 60 }); break;
      case 'hit': noise(0.35, { freq: 2400, slide: 120, vol: 0.25 }); tone(180, 0.3, { vol: 0.12, slide: 40 }); break;
      case 'power': arp([NOTE(72), NOTE(76), NOTE(79), NOTE(84)], 0.05, { vol: 0.08 }); break;
      case 'fuelLow': tone(990, 0.07, { vol: 0.07 }); tone(990, 0.07, { delay: 0.12, vol: 0.07 }); break;
      case 'launch': noise(0.7, { filter: 'highpass', freq: 400, slide: 3000, vol: 0.12 }); tone(160, 0.6, { type: 'triangle', slide: 700, vol: 0.12 }); break;
      case 'return': tone(700, 0.4, { type: 'triangle', slide: 220, vol: 0.1 }); noise(0.4, { freq: 3000, slide: 300, vol: 0.06 }); break;
      case 'dock': tone(NOTE(60), 0.1, { vol: 0.08 }); tone(NOTE(67), 0.14, { delay: 0.08, vol: 0.08 }); break;
      case 'tick': tone(NOTE(70 + Math.min(24, p || 0)), 0.035, { vol: 0.05 }); break;
      case 'jingle':
        arp([NOTE(72), NOTE(76), NOTE(79), NOTE(84), NOTE(83), NOTE(84)], 0.09, { vol: 0.08, len: 0.14 });
        arp([NOTE(48), NOTE(55), NOTE(60)], 0.18, { type: 'triangle', vol: 0.12, len: 0.3 });
        tone(NOTE(88), 0.5, { delay: 0.56, vol: 0.06, type: 'triangle' });
        break;
      case 'build':
        arp([NOTE(67), NOTE(71), NOTE(74), NOTE(79)], 0.06, { vol: 0.08 });
        noise(0.3, { filter: 'highpass', freq: 5000, vol: 0.05, delay: 0.2 });
        break;
      case 'upgrade': arp([NOTE(72), NOTE(79), NOTE(84)], 0.07, { vol: 0.09, type: 'square' }); tone(NOTE(88), 0.25, { delay: 0.21, vol: 0.05, type: 'triangle' }); break;
      case 'goal':
        arp([NOTE(76), NOTE(79), NOTE(84), NOTE(88)], 0.08, { vol: 0.08 });
        arp([NOTE(52), NOTE(59)], 0.16, { type: 'triangle', vol: 0.1 });
        break;
      case 'warp': tone(90, 1.1, { type: 'sawtooth', slide: 1800, vol: 0.06, attack: 0.2 }); noise(1.2, { filter: 'bandpass', freq: 300, slide: 6000, vol: 0.08, q: 2 }); break;
      case 'toast': tone(NOTE(84), 0.05, { vol: 0.05, type: 'triangle' }); tone(NOTE(91), 0.07, { delay: 0.05, vol: 0.04, type: 'triangle' }); break;
      case 'recruit': arp([NOTE(67), NOTE(72), NOTE(76), NOTE(72), NOTE(79)], 0.08, { vol: 0.08, type: 'triangle' }); break;
      case 'whale': tone(140, 1.4, { type: 'sine', slide: 95, vol: 0.12, attack: 0.3 }); tone(210, 1.0, { type: 'sine', slide: 160, vol: 0.05, attack: 0.3, delay: 0.5 }); break;
      case 'storm': noise(1.2, { freq: 800, slide: 3000, vol: 0.12 }); break;
      case 'warn': tone(1320, 0.05, { vol: 0.06 }); tone(1320, 0.05, { delay: 0.1, vol: 0.06 }); break;
      case 'zap': noise(0.12, { filter: 'highpass', freq: 3000, vol: 0.1 }); tone(1500, 0.08, { slide: 400, vol: 0.05 }); break;
      case 'blip': tone(NOTE(88), 0.03, { vol: 0.04 }); break;
      case 'spill': arp([NOTE(76), NOTE(72), NOTE(67)], 0.04, { vol: 0.06 }); break;
      case 'shield': arp([NOTE(64), NOTE(71)], 0.06, { vol: 0.07, type: 'triangle' }); break;
      default: tone(600, 0.05, { vol: 0.05 });
    }
  };

  // ------------------------------------------------------------------ thruster loop
  Snd.thrust = function (amount) {
    if (!Snd.ctx) return;
    var c = Snd.ctx;
    if (!thrust) {
      var src = c.createBufferSource(); src.buffer = noiseBuf; src.loop = true;
      var f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 400;
      var g = c.createGain(); g.gain.value = 0;
      src.connect(f); f.connect(g); g.connect(sfxBus);
      src.start();
      thrust = { src: src, f: f, g: g };
    }
    var a = Math.max(0, Math.min(1, amount));
    thrust.g.gain.setTargetAtTime(a * 0.07, c.currentTime, 0.05);
    thrust.f.frequency.setTargetAtTime(300 + a * 700, c.currentTime, 0.05);
  };

  // ------------------------------------------------------------------ music
  // a tiny step sequencer: soft pad + sparse arpeggio, different moods per track
  var TRACKS = {
    title: { bpm: 70, chords: [[57, 60, 64], [53, 57, 60], [48, 52, 55], [55, 59, 62]], arp: true, bass: false },
    ship: { bpm: 64, chords: [[50, 57, 62], [46, 53, 58], [48, 55, 60], [45, 52, 57]], arp: true, bass: false },
    run: { bpm: 128, chords: [[45, 52, 57], [41, 48, 53], [43, 50, 55], [40, 47, 52]], arp: true, bass: true },
    map: { bpm: 60, chords: [[52, 59, 64], [48, 55, 60], [50, 57, 62], [47, 54, 59]], arp: true, bass: false }
  };
  var seq = { step: 0, next: 0 };
  Snd.setMusic = function (name) {
    if (Snd.track === name) return;
    Snd.track = name;
    seq.step = 0;
    if (Snd.ctx) seq.next = Snd.ctx.currentTime + 0.1;
  };
  function startScheduler() {
    seq.next = Snd.ctx.currentTime + 0.2;
    setInterval(function () {
      if (!Snd.ctx || Snd.ctx.state !== 'running') return;
      var tr = TRACKS[Snd.track];
      if (!tr) { seq.next = Snd.ctx.currentTime + 0.1; return; }
      var spb = 60 / tr.bpm / 2; // eighth notes
      while (seq.next < Snd.ctx.currentTime + 0.35) {
        scheduleStep(tr, seq.step, seq.next, spb);
        seq.step++;
        seq.next += spb;
      }
    }, 90);
  }
  var ARP_PAT = [0, 1, 2, 1, 2, 0, 1, 2];
  function scheduleStep(tr, step, when, spb) {
    var c = Snd.ctx;
    var bar = Math.floor(step / 8) % tr.chords.length;
    var chord = tr.chords[bar];
    var inBar = step % 8;
    var delay = Math.max(0, when - c.currentTime);
    if (inBar === 0) {
      // soft pad
      chord.forEach(function (n, i) {
        tone(NOTE(n), spb * 8.5, { type: 'triangle', vol: 0.035 - i * 0.006, attack: 0.5, delay: delay, bus: musicBus });
      });
    }
    if (tr.bass && inBar % 2 === 0) {
      tone(NOTE(chord[0] - 12), spb * 0.9, { type: 'square', vol: 0.03, delay: delay, bus: musicBus });
    }
    if (tr.arp) {
      var dense = tr.bass ? 1 : ((step * 7) % 5 < 2 ? 1 : 0);
      if (dense) {
        var n = chord[ARP_PAT[inBar]] + 12 + (inBar === 7 && bar % 2 ? 2 : 0);
        tone(NOTE(n), spb * 1.5, { type: tr.bass ? 'square' : 'sine', vol: tr.bass ? 0.018 : 0.035, delay: delay, bus: musicBus, attack: 0.01 });
      }
    }
    if (tr.bass && inBar === 4) noise(0.05, { filter: 'highpass', freq: 6000, vol: 0.03, delay: delay, bus: musicBus });
  }

  DH.Snd = Snd;
})(window.DH = window.DH || {});
