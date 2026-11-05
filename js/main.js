// DRIFTHOLD - main.js
// Boot, game loop, scene switching, the bottom bar, panel stack (max one), saving hooks.
(function (DH) {
  'use strict';
  var R = DH.R, In = DH.In, UI = DH.UI, F = DH.Font, Sim = DH.Sim, U = DH.U;
  var G = {
    state: null, scene: null, sceneName: null, panel: null, barH: 26, time: 0,
    trans: null, saveTimer: 0, dirty: false, booted: false, frameCount: 0
  };
  DH.G = G;
  DH.Scenes = DH.Scenes || {};
  DH.Panels = DH.Panels || {};

  // ------------------------------------------------------------------ scenes
  G.setScene = function (name, params, instant) {
    var go = function () {
      if (G.scene && G.scene.exit) G.scene.exit();
      G.sceneName = name;
      G.scene = DH.Scenes[name];
      G.panel = null;
      if (G.scene.enter) G.scene.enter(params || {});
    };
    if (instant || !G.scene) { go(); return; }
    G.trans = { t: 0, dur: 0.22, mid: go, done: false };
  };

  // ------------------------------------------------------------------ panels (only ever one)
  G.openPanel = function (kind, data) {
    var P = DH.Panels[kind];
    if (!P) { console.warn('no panel', kind); return; }
    G.panel = { kind: kind, data: data || {}, t: 0, view: P, openedAt: G.frameCount };
    if (P.open) P.open(G.panel);
    if (DH.Prog) DH.Prog.onPanel(kind, G.panel.data);
  };
  G.closePanel = function () {
    if (G.panel && G.panel.view.close) G.panel.view.close(G.panel);
    G.panel = null;
  };
  G.isPanel = function (kind) { return G.panel && G.panel.kind === kind; };
  // a tap that starts and ends on the dimmed backdrop (not on the bottom bar) closes the panel
  G.tapOutside = function (pan, showBar) {
    var r = UI.lastPanel;
    if (!r || !UI.enabled || !In.released || In.drag > 6 || pan.view.modal) return false;
    if (!(In.pressFrame >= pan.openedAt)) return false;
    var barTop = showBar ? R.H - G.barH : R.H;
    function out(x, y) { return y < barTop && !In.inRect(x, y, r.x - 2, r.y - 2, r.w + 4, r.h + 4); }
    return out(In.px, In.py) && out(In.rx, In.ry);
  };

  // ------------------------------------------------------------------ saving
  G.markDirty = function () { G.dirty = true; };
  G.save = function () {
    if (!G.state) return;
    G.state.lastTick = Date.now();
    DH.Save.write(G.state);
    G.dirty = false;
    G.saveTimer = 0;
  };

  // ------------------------------------------------------------------ bottom bar
  var BAR = [
    { id: 'ship', label: 'SHIP', icon: 'ship', key: '1' },
    { id: 'launch', label: 'LAUNCH', icon: 'launch', key: '2' },
    { id: 'map', label: 'MAP', icon: 'map', key: '3' },
    { id: 'log', label: 'LOG', icon: 'log', key: '4' },
    { id: 'settings', label: 'SETUP', icon: 'gear', key: '5' }
  ];
  G.barRects = {};
  G.drawBar = function () {
    var s = G.state;
    var items = BAR.filter(function (b) { return b.id === 'settings' || s.unlocked[b.id]; });
    var H = G.barH, y = R.H - H;
    R.rect(0, y, R.W, H, 0);
    R.rect(0, y, R.W, 1, 5);
    R.dither(0, y + 1, R.W, H - 1, 1);
    var bw = Math.min(56, Math.floor((R.W - 6) / items.length) - 2);
    var total = items.length * (bw + 2) - 2;
    var x0 = Math.floor((R.W - total) / 2);
    G.barRects = {};
    items.forEach(function (b, i) {
      var x = x0 + i * (bw + 2), by = y + 3, bh = H - 5;
      G.barRects[b.id] = { x: x, y: by, w: bw, h: bh };
      var current = (b.id === 'ship' && G.sceneName === 'ship' && !G.panel) ||
        (b.id === 'map' && G.sceneName === 'map' && !G.panel) ||
        (b.id === 'log' && G.isPanel('log')) || (b.id === 'settings' && G.isPanel('settings'));
      var style = b.id === 'launch' ? 'warm' : (current ? 'primary' : 'dark');
      var id = 'bar:' + b.id;
      var clicked = UI.hit(id, x, by, bw, bh) || (UI.enabled && In.key(b.key));
      var pressed = UI.isDown(id, x, by, bw, bh);
      var st = UI.STYLES[style];
      var off = pressed ? 2 : 0;
      R.box(x, by + off, bw, bh - off, 0);
      if (!pressed) R.rect(x + 1, by + bh - 3, bw - 2, 2, st.depth);
      R.rect(x + 1, by + 1 + off, bw - 2, bh - 4, UI.hover(x, by, bw, bh) ? DH.LIGHT[st.face] : st.face);
      R.rect(x + 2, by + 1 + off, bw - 4, 1, st.light);
      var ic = DH.Spr.icon(b.icon);
      R.img(ic, x + Math.floor((bw - ic.width) / 2), by + 2 + off);
      F.draw(R.ctx, b.label, x + Math.floor(bw / 2), by + 12 + off, b.id === 'launch' ? 7 : (current ? 7 : 6), { font: 'small', align: 'center', shadow: st.shadow });
      if (In.type === 'mouse' && bw >= 30) F.draw(R.ctx, b.key, x + 3, by + 2 + off, b.id === 'launch' ? 4 : 5, { font: 'small' });
      // "new" badge
      if (s.tut.seen['new:' + b.id] === false) {
        var on = Math.floor(G.time * 3) % 2;
        R.box(x + bw - 9, by - 3 + off, 11, 7, 0);
        R.rect(x + bw - 8, by - 2 + off, 9, 5, on ? 8 : 14);
        F.draw(R.ctx, 'NEW', x + bw - 7, by - 2 + off, 7, { font: 'small' });
      }
      if (clicked) {
        if (s.tut.seen['new:' + b.id] === false) s.tut.seen['new:' + b.id] = true;
        DH.Snd.play(b.id === 'launch' ? 'click' : 'tab');
        G.barAction(b.id);
      }
    });
  };
  G.barAction = function (id) {
    if (id === 'ship') { if (G.sceneName !== 'ship') G.setScene('ship'); else G.closePanel(); }
    else if (id === 'launch') { G.closePanel(); G.requestLaunch(); }
    else if (id === 'map') { if (G.sceneName !== 'map') G.setScene('map'); else G.closePanel(); }
    else if (id === 'log') { if (G.isPanel('log')) G.closePanel(); else G.openPanel('log'); }
    else if (id === 'settings') { if (G.isPanel('settings')) G.closePanel(); else G.openPanel('settings'); }
  };
  G.requestLaunch = function () {
    var s = G.state;
    if (DH.Prog && DH.Prog.dailyAvailable(s)) G.openPanel('launch');
    else G.launch(null);
  };
  G.launch = function (anomaly) {
    G.closePanel();
    G.setScene('run', { anomaly: anomaly });
  };
  G.unlockBar = function (id) {
    if (G.state.unlocked[id]) return;
    G.state.unlocked[id] = true;
    G.state.tut.seen['new:' + id] = false;
    G.markDirty();
  };

  // ------------------------------------------------------------------ offline / welcome back
  G.catchUp = function (showSummary) {
    var s = G.state;
    var now = Date.now();
    var away = (now - (s.lastTick || now)) / 1000;
    s.lastTick = now;
    if (away < 5) return null;
    var before = {}; DH.D.RES_ORDER.forEach(function (k) { before[k] = s.res[k]; });
    var res = Sim.catchUp(s, away);
    res.away = away;
    res.capped = away > Sim.OFFLINE_CAP;
    if (showSummary && away > 120 && (res.food >= 1 || res.alloy >= 1 || res.data >= 1 || res.partsDone.length)) {
      G.pendingWelcome = res;
    }
    G.markDirty();
    return res;
  };

  // ------------------------------------------------------------------ main loop
  var lastTs = 0;
  function frame(ts) {
    requestAnimationFrame(frame);
    var dt = lastTs ? Math.min(0.05, (ts - lastTs) / 1000) : 1 / 60;
    lastTs = ts;
    G.time += dt;
    G.frameCount++;
    R.t = G.time;
    UI.begin(dt);
    var s = G.state;

    var steps = G.timeScale || 1;
    if (s && G.sceneName !== 'title') {
      Sim.tick(s, dt * steps, false);
      s.stats.playTime += dt * steps;
      G.simTime = (G.simTime || 0) + dt * steps;
      s.lastTick = Date.now();
      G.saveTimer += dt;
      if ((G.dirty && G.saveTimer > 1.5) || G.saveTimer > 15) G.save();
    }

    // blocking tutorial tips swallow input for everything beneath them
    UI.enabled = !(DH.Prog && DH.Prog.blocking());
    if (G.trans) UI.enabled = false;

    var ctx = R.ctx;
    ctx.save();
    if (G.scene) {
      for (var st = 0; st < steps; st++) G.scene.update(dt);
      G.scene.draw(dt);
    }
    // panel (only one at a time)
    var showBar = G.scene && G.scene.showBar;
    if (G.panel) {
      var pan = G.panel;
      pan.t += dt;
      R.dim();
      // quick pop-in: the panel rises a few pixels into place as it opens
      UI.panelOffset = Math.round((1 - U.easeOutCubic(U.clamp(pan.t / 0.14, 0, 1))) * 10);
      UI.lastPanel = null;
      var keep = pan.view.draw(pan, dt);
      UI.panelOffset = 0;
      if (keep === false || (UI.enabled && In.key('Escape'))) G.closePanel();
      else if (G.panel === pan && G.tapOutside(pan, showBar)) { DH.Snd.play('back'); G.closePanel(); }
    }
    if (showBar && s) G.drawBar();
    ctx.restore();

    UI.enabled = true;
    if (G.trans) UI.enabled = false;
    if (DH.Prog && s && G.sceneName !== 'title') DH.Prog.drawOverlay(dt);
    UI.drawToasts(dt, G.sceneName === 'run' ? 31 : 1);

    // dithered wipe between scenes
    if (G.trans) {
      var tr = G.trans;
      tr.t += dt;
      var half = tr.dur;
      var k = tr.t < half ? tr.t / half : 1 - (tr.t - half) / half;
      if (tr.t >= half && !tr.done) { tr.done = true; tr.mid(); }
      k = U.clamp(k, 0, 1);
      if (k > 0.5) { R.rect(0, 0, R.W, R.H, 0); }
      else if (k > 0.05) R.dither(0, 0, R.W, R.H, 0);
      if (k > 0.5 && k < 0.95) R.dither(0, 0, R.W, R.H, 1);
      if (tr.t >= half * 2) G.trans = null;
    }

    UI.end();
    In.endFrame();
  }

  // ------------------------------------------------------------------ boot
  G.newGame = function () {
    G.state = DH.Save.defaultState();
    G.state.lastTick = Date.now();
    G.save();
  };
  G.loadOrNew = function () {
    var s = DH.Save.load();
    if (s) { G.state = s; return true; }
    return false;
  };
  G.applySettings = function () {
    var st = G.state.settings;
    DH.Snd.setSfx(st.sfx !== false);
    DH.Snd.setMusicOn(st.music !== false);
  };

  function boot() {
    // ?speed=N runs the simulation N times per frame (automated playtests only)
    var m = /[?&]speed=(\d+)/.exec(location.search);
    G.timeScale = m ? Math.max(1, Math.min(16, +m[1])) : 1;
    var cv = document.getElementById('game');
    R.init(cv);
    In.init(cv);
    var hadSave = G.loadOrNew();
    if (G.state) {
      G.applySettings();
      G.catchUp(true);
    }
    G.hadSave = hadSave;
    if (DH.Prog) DH.Prog.init();
    var onResize = function () { R.resize(); if (G.scene && G.scene.resize) G.scene.resize(); };
    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', function () { setTimeout(onResize, 120); });
    if (window.visualViewport) window.visualViewport.addEventListener('resize', onResize);

    document.addEventListener('visibilitychange', function () {
      if (!G.state) return;
      if (document.hidden) {
        if (G.sceneName === 'run' && DH.Scenes.run.pause) DH.Scenes.run.pause();
        G.save();
        DH.Snd.suspend();
        G.hiddenAt = Date.now();
      } else {
        DH.Snd.resume();
        if (G.sceneName && G.sceneName !== 'title') {
          G.catchUp(true);
          if (G.pendingWelcome && G.sceneName === 'ship' && !G.panel) {
            G.openPanel('welcome', G.pendingWelcome); G.pendingWelcome = null;
          }
        }
      }
    });
    window.addEventListener('pagehide', function () { G.save(); });
    window.addEventListener('beforeunload', function () { G.save(); });

    if (DH.Sim) Sim.on(function (type) {
      if (type !== 'produce' && type !== 'gain') G.markDirty();
    });

    G.setScene('title', {}, true);
    G.booted = true;
    requestAnimationFrame(frame);
  }

  G.boot = boot;
  window.addEventListener('load', boot);
})(window.DH = window.DH || {});
