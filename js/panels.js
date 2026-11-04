// DRIFTHOLD - panels.js : settings, logbook, welcome-back, launch chooser
(function (DH) {
  'use strict';
  var R = DH.R, F = DH.Font, UI = DH.UI, U = DH.U, D = DH.D, Sim = DH.Sim, Spr = DH.Spr;
  var P = DH.Panels = DH.Panels || {};
  var G = function () { return DH.G; };

  // ------------------------------------------------------------------ settings
  P.settings = {
    open: function (p) { p.data.confirmReset = 0; p.data.msg = null; },
    draw: function (p, dt) {
      var s = G().state;
      var r = UI.panelRect(220, 170);
      var c = UI.panelFrame(r.x, r.y, r.w, r.h, 'SETUP', { icon: 'gear' });
      if (c.closed) return false;
      var y = c.y + 1, bw = 40;
      function toggle(label, key, apply) {
        F.draw(R.ctx, label, c.x + 2, y + 3, 6);
        var on = s.settings[key] !== false;
        if (UI.button(c.x + c.w - bw, y, bw, 13, on ? 'ON' : 'OFF', { style: on ? 'good' : 'off', id: 'set:' + key })) {
          s.settings[key] = !on; if (apply) apply(); G().markDirty();
        }
        y += 16;
      }
      toggle('SOUND FX', 'sfx', function () { DH.Snd.setSfx(s.settings.sfx); });
      toggle('MUSIC', 'music', function () { DH.Snd.setMusicOn(s.settings.music); });
      toggle('SCREEN SHAKE', 'shake');
      var hw = Math.floor((c.w - 4) / 2);
      if (UI.button(c.x, y, hw, 14, 'EXPORT', { style: 'primary', id: 'set:export' })) {
        G().save();
        var code = DH.Save.exportCode(s);
        var done = function () { p.data.msg = 'SAVE CODE COPIED!'; };
        try {
          if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(code).then(done, function () { window.prompt('Copy your DRIFTHOLD save code:', code); });
          } else { window.prompt('Copy your DRIFTHOLD save code:', code); }
        } catch (e) { window.prompt('Copy your DRIFTHOLD save code:', code); }
        p.data.msg = 'SAVE CODE READY';
      }
      if (UI.button(c.x + hw + 4, y, hw, 14, 'IMPORT', { style: 'primary', id: 'set:import' })) {
        var txt = window.prompt('Paste a DRIFTHOLD save code:');
        if (txt) {
          var res = DH.Save.importCode(txt);
          if (res.ok) {
            DH.G.state = res.state; DH.G.save(); DH.G.applySettings();
            p.data.msg = 'SAVE LOADED!';
            DH.G.setScene('ship');
            return false;
          } else p.data.msg = res.err;
        }
      }
      y += 18;
      var rs = p.data.confirmReset > 0;
      if (rs) p.data.confirmReset -= dt;
      if (UI.button(c.x, y, c.w, 14, rs ? 'TAP AGAIN TO ERASE EVERYTHING' : 'RESET GAME', { style: 'danger', font: rs ? 'small' : 'big', id: 'set:reset' })) {
        if (rs) {
          DH.Save.wipe(); DH.G.newGame(); DH.G.applySettings();
          DH.G.setScene('ship', { fromTitle: true });
          return false;
        }
        p.data.confirmReset = 3;
      }
      y += 18;
      if (p.data.msg) F.draw(R.ctx, p.data.msg, c.x + c.w / 2, y, 10, { align: 'center', font: 'small' });
      F.draw(R.ctx, 'PLAYED ' + U.fmtTime(s.stats.playTime) + '   RUNS ' + s.stats.runs, c.x + c.w / 2, c.y + c.h - 13, 13, { font: 'small', align: 'center' });
      F.draw(R.ctx, 'DRIFTHOLD V1.0 - SAVES AUTOMATICALLY', c.x + c.w / 2, c.y + c.h - 6, 5, { font: 'small', align: 'center' });
      return true;
    }
  };

  // ------------------------------------------------------------------ logbook
  var LOG_TABS = ['ORES', 'CREW', 'WORLDS', 'DRONE', 'TRINKETS'];
  function logEntries(s, tab) {
    var out = [];
    if (tab === 0) D.ORE_ORDER.forEach(function (o) {
      out.push({ known: !!s.seen.ores[o], icon: Spr.icon(D.ORES[o].icon), name: D.ORES[o].name, desc: D.ORES[o].desc + ' MINED: ' + (s.stats.mined[o] || 0) });
    });
    if (tab === 1) D.TRAIT_KEYS.forEach(function (t) {
      var m = s.seen.traits[t];
      var img = m ? DH.Crew.sprites({ id: 'log' + t + m.name, look: m.look }).stand[0] : null;
      out.push({ known: !!m, icon: img, sil: Spr.icon('crew'), name: D.TRAITS[t].name, desc: m ? 'FIRST MET: ' + m.name + '. ' + D.TRAITS[t].desc : 'MEET MORE CREW ON PLANETS.' });
    });
    if (tab === 2) {
      D.PLANET_ORDER.forEach(function (pid) {
        var pl = D.PLANETS[pid];
        out.push({ known: !!s.visited[pid], planet: pl, name: pl.name, desc: s.visited[pid] ? pl.desc + ' SECTOR: ' + D.sector(pl.sector).name : 'AN UNVISITED WORLD.' });
      });
      D.SECTORS.forEach(function (sec) {
        out.push({ known: !!s.seen.sectors[sec.id], icon: Spr.icon('sector'), name: sec.name, desc: s.seen.sectors[sec.id] ? sec.desc : 'UPGRADE THE OBSERVATORY TO REVEAL.' });
      });
    }
    if (tab === 3) {
      D.CHASSIS_ORDER.forEach(function (id) {
        out.push({ known: !!s.owned.chassis[id], icon: Spr.droneBase(id, s.paint), name: D.CHASSIS[id].name, desc: D.CHASSIS[id].desc + ' (HANGAR LV' + D.CHASSIS[id].lvl + ')' });
      });
      D.PART_ORDER.forEach(function (pt) {
        out.push({ known: s.parts[pt] > 0, icon: Spr.icon(D.PARTS[pt].icon), name: D.PARTS[pt].name + ' ' + s.parts[pt], desc: D.PARTS[pt].desc + '. LEVEL ' + s.parts[pt] + '/' + D.MAX_PART_LVL });
      });
    }
    if (tab === 4) {
      D.DECOR_ORDER.forEach(function (id) { out.push({ known: !!s.owned.decor[id], icon: Spr.decor(id), name: D.DECOR[id].name, desc: 'A DECORATION. PLACE IT IN ANY ROOM.' }); });
      D.PAINT_ORDER.forEach(function (id) { out.push({ known: !!s.owned.paint[id], icon: Spr.droneBase('standard', id), name: D.PAINTS[id].name, desc: 'DRONE PAINT JOB. EQUIP IT IN THE HANGAR.' }); });
      D.HULL_ORDER.forEach(function (id) { out.push({ known: !!s.owned.hull[id], icon: Spr.icon('hull'), hull: D.HULLS[id], name: D.HULLS[id].name + ' HULL', desc: 'HULL PAINT. APPLY IT FROM THE BRIDGE.' }); });
    }
    return out;
  }
  P.log = {
    open: function (p) { p.data.tab = p.data.tab || 0; p.data.sel = -1; UI.scrollTo('log', 0); },
    draw: function (p) {
      var s = G().state;
      var r = UI.panelRect(300, 172);
      var st = DH.Prog.logStats(s);
      var c = UI.panelFrame(r.x, r.y, r.w, r.h, 'LOGBOOK ' + Math.floor(st.found / st.total * 100) + '%', { icon: 'log' });
      if (c.closed) return false;
      var nt = UI.tabs('ltab', c.x, c.y, c.w, LOG_TABS, p.data.tab);
      if (nt !== p.data.tab) { p.data.tab = nt; p.data.sel = -1; UI.scrollTo('log', 0); }
      var list = logEntries(s, p.data.tab);
      var cell = 38, cols = Math.max(1, Math.floor((c.w - 4) / cell));
      var areaH = c.h - 15 - 16;
      var hgt = Math.ceil(list.length / cols) * 30;
      UI.scrollArea('log', c.x, c.y + 15, c.w, areaH, hgt, function (x, y) {
        list.forEach(function (e, i) {
          var cx = x + (i % cols) * cell, cy = y + Math.floor(i / cols) * 30;
          if (UI.button(cx, cy, cell - 3, 28, '', { style: p.data.sel === i ? 'primary' : 'dark', id: 'log:' + i, sound: 'tab' })) p.data.sel = i;
          var mx = cx + (cell - 3) / 2, my = cy + 10;
          if (e.planet) {
            if (e.known) R.imgC(Spr.planetFrame(e.planet, 6, DH.G.time * 0.05), mx, my);
            else { R.circ(mx, my, 6, 0); R.ring(mx, my, 6, 5); }
          } else if (e.hull && e.known) {
            R.box(mx - 7, my - 4, 14, 9, 0); R.rect(mx - 6, my - 3, 12, 7, e.hull.main); R.rect(mx - 6, my + 1, 12, 3, e.hull.shade);
          } else {
            var ic = e.icon || e.sil;
            if (ic) R.imgC(e.known ? ic : R.silhouette(ic, 5), mx, my);
          }
          var nm = e.known ? e.name : '???';
          while (F.measure(nm, 'small') > cell - 4 && nm.length > 3) nm = nm.slice(0, -1);
          F.draw(R.ctx, nm, mx, cy + 19, e.known ? 7 : 5, { font: 'small', align: 'center' });
        });
      });
      var sel = list[p.data.sel];
      var dy = c.y + c.h - 14;
      R.rect(c.x, dy - 2, c.w, 1, 13);
      if (sel) UI.para(sel.known ? sel.name + ': ' + sel.desc : '??? - ' + sel.desc, c.x, dy, c.w, sel.known ? 6 : 5);
      else F.draw(R.ctx, 'FOUND ' + st.found + ' OF ' + st.total + '. TAP AN ENTRY FOR DETAILS.', c.x, dy + 2, 13, { font: 'small' });
      return true;
    }
  };

  // ------------------------------------------------------------------ welcome back (offline summary)
  var ANECDOTES = ['REORGANISED THE TOOL WALL', 'NAMED A HOUSEPLANT', 'BEAT EVERYONE AT CARDS', 'POLISHED THE PORTHOLES',
    'HUMMED THE WHOLE TIME', 'FIXED A SQUEAKY BUNK', 'COUNTED STARS (LOST COUNT)', 'BAKED SOMETHING ODD', 'WROTE IN THE SHIP LOG',
    'TAUGHT THE CAT A TRICK', 'NAPPED IN THE AIRLOCK', 'TALKED TO THE DRONE'];
  P.welcome = {
    open: function (p) { p.data.t = 0; DH.Snd.play('jingle'); },
    draw: function (p, dt) {
      var s = G().state, d = p.data;
      d.t += dt;
      var r = UI.panelRect(230, 150);
      var c = UI.panelFrame(r.x, r.y, r.w, r.h, 'WELCOME BACK!', { icon: 'star' });
      if (c.closed) return false;
      var y = c.y + 1;
      F.draw(R.ctx, 'AWAY FOR ' + U.fmtTime(d.away) + (d.capped ? ' (8H MAX)' : ''), c.x, y, 6);
      y += 11;
      F.draw(R.ctx, 'WHILE YOU WERE GONE:', c.x, y, 13, { font: 'small' });
      y += 9;
      var k = Math.min(1, d.t / 1.2);
      var lines = [];
      if (d.food >= 1) lines.push(['food', '+' + Math.floor(d.food * k) + ' FOOD GROWN']);
      if (d.alloy >= 1) lines.push(['alloy', '+' + Math.floor(d.alloy * k) + ' ALLOY SMELTED']);
      if (d.data >= 1) lines.push(['data', '+' + Math.floor(d.data * k) + ' DATA GATHERED']);
      (d.partsDone || []).forEach(function (j) { lines.push([D.PARTS[j.part].icon, D.PARTS[j.part].name + ' LV' + j.lvl + ' FINISHED']); });
      lines.forEach(function (l) { R.img(Spr.icon(l[0]), c.x + 2, y); F.draw(R.ctx, l[1], c.x + 12, y, 7); y += 10; });
      if (k < 1 && Math.floor(d.t * 20) % 2) DH.Snd.play('tick', Math.floor(k * 20));
      if (s.crew.length) {
        var who = s.crew[Math.floor(d.away) % s.crew.length];
        y += 3;
        UI.para(who.name + ' ' + ANECDOTES[Math.floor(d.away / 7) % ANECDOTES.length] + '.', c.x, y, c.w, 14);
      }
      if (UI.button(c.x + c.w / 2 - 35, c.y + c.h - 18, 70, 16, 'NICE!', { style: 'good', id: 'wb:ok' })) return false;
      return true;
    }
  };

  // ------------------------------------------------------------------ launch chooser (only when a daily anomaly is up)
  P.launch = {
    draw: function (p) {
      var s = G().state;
      var r = UI.panelRect(230, 132);
      var c = UI.panelFrame(r.x, r.y, r.w, r.h, 'LAUNCH DRONE', { icon: 'launch' });
      if (c.closed) return false;
      var sec = D.sector(s.sector);
      var y = c.y + 1;
      if (UI.button(c.x, y, c.w, 26, '', { style: 'primary', id: 'l:normal', sound: 'click' })) { G().launch(null); return false; }
      R.img(Spr.icon('launch'), c.x + 4, y + 7);
      F.draw(R.ctx, 'NORMAL RUN', c.x + 18, y + 4, 7, { shadow: 1 });
      F.draw(R.ctx, sec.name, c.x + 18, y + 13, 1, { font: 'small' });
      y += 30;
      var an = DH.Prog.todayAnomaly();
      if (UI.button(c.x, y, c.w, 38, '', { style: 'warm', id: 'l:daily', sound: 'click' })) { G().launch(an); return false; }
      R.img(Spr.icon('anomaly'), c.x + 4, y + 5);
      F.draw(R.ctx, 'DAILY: ' + an.name, c.x + 18, y + 4, 7, { shadow: 4 });
      F.draw(R.ctx, an.desc, c.x + 18, y + 14, 1, { font: 'small' });
      F.draw(R.ctx, 'ORE X' + an.mult + ' + 3 STARDUST', c.x + 18, y + 22, 2, { font: 'small' });
      y += 42;
      UI.para('ONE ANOMALY A DAY. SKIP DAYS FREELY - NOTHING IS LOST.', c.x, y, c.w, 13);
      return true;
    }
  };
})(window.DH);
