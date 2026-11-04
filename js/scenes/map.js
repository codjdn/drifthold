// DRIFTHOLD - scenes/map.js
// The star map: sectors revealed by the Observatory, the planets in each, drifting between
// them (a short warp, no waiting) and the planet visit panel (crew, trade, shop).
(function (DH) {
  'use strict';
  var R = DH.R, F = DH.Font, In = DH.In, UI = DH.UI, U = DH.U, D = DH.D, Sim = DH.Sim, Spr = DH.Spr;
  var Map = { showBar: true };
  var V = { t: 0, stars: null, warp: null, rects: {} };

  Map.enter = function () {
    if (!V.stars) V.stars = Spr.makeStarfield(17, 260);
    DH.Snd.setMusic('map');
    V.warp = null;
  };

  function nodePos(sec) {
    var top = 26, bottom = R.H - DH.G.barH - 16, left = 22, right = R.W - 22;
    var p = R.portrait ? sec.mapPosP : sec.mapPos;
    return { x: Math.round(left + p[0] * (right - left)), y: Math.round(top + p[1] * (bottom - top)) };
  }

  Map.planetRect = function (pid) { return V.rects[pid] || null; };

  Map.update = function (dt) {
    V.t += dt;
    if (V.warp) {
      V.warp.t += dt;
      if (V.warp.t > 1.4 && !V.warp.done) {
        V.warp.done = true;
        Sim.travel(DH.G.state, V.warp.to);
        DH.G.save();
        UI.toast('ARRIVED: ' + D.sector(V.warp.to).name, 'sector', 10);
      }
      if (V.warp.t > 2) V.warp = null;
    }
  };

  Map.draw = function () {
    var s = DH.G.state, t = V.t;
    R.clear(0);
    Spr.drawNebula(Spr.makeNebula(256, 256, 77, 1, 2), t * 1.5, 0);
    var warpK = V.warp ? Math.sin(Math.min(1, V.warp.t / 2) * Math.PI) : 0;
    if (warpK > 0.05) {
      for (var i = 0; i < 70; i++) {
        var sx = (i * 97 + Math.floor(t * 400 * warpK)) % (R.W + 60) - 30, sy = (i * 53) % R.H;
        R.rect(R.W - sx, sy, Math.floor(4 + 30 * warpK), 1, i % 3 ? 13 : 7);
      }
    } else V.stars.draw(t * 3, 0, t);

    F.drawOutlined(R.ctx, 'STAR MAP', 4, 4, 7, 0);
    var cur = D.sector(s.sector);
    F.drawOutlined(R.ctx, 'HERE: ' + cur.name, R.W - 4, 4, 10, 0, { font: 'small', align: 'right' });
    F.draw(R.ctx, 'HAZARD: ' + ({ shards: 'SHARD SWARMS', comets: 'ICE COMETS', storm: 'MAG STORMS', whales: 'SPACE WHALES', wells: 'GRAVITY WELLS' }[cur.hazard] || 'NONE'), R.W - 4, 11, 13, { font: 'small', align: 'right' });

    // routes
    var nodes = D.SECTORS.map(nodePos);
    for (i = 0; i < D.SECTORS.length - 1; i++) {
      var a = nodes[i], b = nodes[i + 1];
      var known = s.revealed >= i + 2;
      if (s.revealed >= i + 1) R.dline(a.x, a.y, b.x, b.y, known ? 13 : 1, known ? t * 4 : 0);
    }
    V.rects = {};
    var canClick = UI.enabled && !DH.G.panel && !V.warp;
    D.SECTORS.forEach(function (sec, idx) {
      var p = nodes[idx];
      var revealed = sec.id <= s.revealed;
      if (!revealed) {
        R.circ(p.x, p.y, 8, 1); R.ring(p.x, p.y, 8, 5);
        F.draw(R.ctx, '?', p.x - 2, p.y - 3, 13);
        if (sec.id === s.revealed + 1) F.drawOutlined(R.ctx, 'OBSERV. LV' + (sec.id - 1), p.x, p.y + 11, 5, 0, { font: 'small', align: 'center' });
        if (canClick && UI.hit('sec:' + sec.id, p.x - 10, p.y - 10, 20, 20)) { DH.Snd.play('nope'); UI.toast('UPGRADE THE OBSERVATORY TO REVEAL', 'lock', 13); }
        return;
      }
      var here = sec.id === s.sector;
      if (here) {
        var rr = 15 + Math.floor((t * 2) % 3);
        R.ring(p.x, p.y, rr, Math.floor(t * 4) % 2 ? 10 : 9);
      }
      // planets in this sector
      var n = sec.planets.length;
      sec.planets.forEach(function (pid, k) {
        var def = D.PLANETS[pid];
        var pr = n > 1 ? 7 : 9;
        var px = p.x + (n > 1 ? (k === 0 ? -9 : 9) : 0), py = p.y + (n > 1 ? (k === 0 ? -2 : 3) : 0);
        var img = Spr.planetFrame(def, pr, t * 0.03 + k * 0.3);
        R.imgC(img, px, py);
        V.rects[pid] = { x: px - pr - 2, y: py - pr - 2, w: pr * 2 + 4, h: pr * 2 + 4 };
        var rect = V.rects[pid];
        if (UI.hover(rect.x, rect.y, rect.w, rect.h)) R.frame(rect.x, rect.y, rect.w, rect.h, 7);
        if (canClick && UI.hit('pl:' + pid, rect.x, rect.y, rect.w, rect.h)) {
          DH.Snd.play('click');
          if (here) DH.G.openPanel('planet', { id: pid });
          else DH.G.openPanel('travel', { sector: sec.id });
        }
        if (!s.visited[pid] && here && Math.floor(t * 3) % 2) R.img(Spr.icon('bang'), px + pr - 1, py - pr - 5);
      });
      var label = sec.name;
      var ly = p.y + (n > 1 ? 12 : 12);
      F.drawOutlined(R.ctx, label, p.x, ly, here ? 10 : 6, 0, { font: 'small', align: 'center' });
      if (canClick && !here && UI.hit('secl:' + sec.id, p.x - 24, ly - 1, 48, 8)) { DH.Snd.play('click'); DH.G.openPanel('travel', { sector: sec.id }); }
      if (here) {
        var bob = Math.round(Math.sin(t * 2) * 1);
        R.img(Spr.icon('ship'), p.x - 4, p.y - 22 + bob);
        F.drawOutlined(R.ctx, 'YOU', p.x + 7, p.y - 20 + bob, 10, 0, { font: 'small' });
      }
    });
    F.draw(R.ctx, 'TAP A PLANET TO VISIT', 4, 14, 13, { font: 'small' });
  };

  // ------------------------------------------------------------------ travel confirm
  DH.Panels.travel = {
    draw: function (p) {
      var s = DH.G.state, sec = D.sector(p.data.sector);
      var pr = UI.panelRect(220, 112);
      var c = UI.panelFrame(pr.x, pr.y, pr.w, pr.h, sec.name, { icon: 'sector' });
      if (c.closed) return false;
      var y = c.y + 1;
      y += UI.para(sec.desc, c.x, y, c.w, 6) + 4;
      var ores = Object.keys(sec.ores).filter(function (k) { return k !== 'dust'; });
      F.draw(R.ctx, 'ORES:', c.x, y + 1, 13, { font: 'small' });
      ores.forEach(function (o, i) { R.img(s.seen.ores[o] ? Spr.icon(D.ORES[o].icon) : Spr.iconSil(D.ORES[o].icon, 5), c.x + 24 + i * 10, y); });
      y += 12;
      F.draw(R.ctx, 'DRIFTING THERE IS FREE AND QUICK.', c.x, y, 13, { font: 'small' });
      if (UI.button(c.x + c.w / 2 - 45, c.y + c.h - 18, 90, 16, 'DRIFT THERE', { style: 'good', id: 'travel:go', sound: 'warp' })) {
        V.warp = { t: 0, to: sec.id };
        return false;
      }
      return true;
    }
  };

  // ------------------------------------------------------------------ planet visit
  DH.Panels.planet = {
    open: function (p) {
      var s = DH.G.state;
      Sim.visit(s, p.data.id);
      p.data.tab = s.crew.length === 0 ? 0 : (p.data.tab || 0);
      DH.G.markDirty();
      UI.scrollTo('planet', 0);
    },
    draw: function (p) {
      var s = DH.G.state, pl = D.PLANETS[p.data.id];
      var pr = UI.panelRect(300, 172);
      var c = UI.panelFrame(pr.x, pr.y, pr.w, pr.h, 'PLANET ' + pl.name, { icon: 'planet' });
      if (c.closed) return false;
      // header: spinning planet + description
      var img = Spr.planetFrame(pl, 11, V.t * 0.04);
      R.imgC(img, c.x + 14, c.y + 12);
      UI.para(pl.desc, c.x + 32, c.y + 2, c.w - 34, 6);
      var ty = c.y + 26;
      var nt = UI.tabs('ptab', c.x, ty, c.w, ['CREW', 'TRADE', 'SHOP'], p.data.tab);
      if (nt !== p.data.tab) { p.data.tab = nt; UI.scrollTo('planet', 0); }
      var area = { x: c.x, y: ty + 15, w: c.w, h: c.h - (ty + 15 - c.y) };
      var tab = [crewTab, tradeTab, shopTab][p.data.tab];
      UI.scrollArea('planet', area.x, area.y, area.w, area.h, tab.h(s, pl, area.w - 4), function (x, y) { tab.draw(s, pl, x, y, area.w - 4); });
      return true;
    }
  };

  var crewTab = {
    h: function (s) { return 90; },
    draw: function (s, pl, x, y, w) {
      var beds = Sim.bedCount(s);
      var cost = Sim.recruitCost(s);
      var cands = DH.Crew.candidates(s, pl.id);
      var msg = null;
      if (!Sim.level(s, 'quarters')) msg = 'BUILD QUARTERS FIRST - CREW NEED A BED.';
      else if (s.crew.length >= beds) msg = 'NO FREE BEDS. UPGRADE THE QUARTERS FOR MORE.';
      F.draw(R.ctx, msg || ('LOOKING FOR WORK  (CREW ' + s.crew.length + '/' + beds + ')'), x, y, msg ? 9 : 13, { font: 'small' });
      y += 9;
      var bw = Math.floor((w - 4) / 2);
      cands.forEach(function (cand, i) {
        if (!s.seen.traits[cand.trait]) s.seen.traits[cand.trait] = { name: cand.name, look: cand.look, met: true };
        var bx = x + i * (bw + 4);
        R.box(bx, y, bw, 76, 0); R.rect(bx + 1, y + 1, bw - 2, 73, 1);
        var sp = DH.Crew.sprites(cand);
        var frame = Math.floor(V.t * 2 + i) % 4 === 0 ? sp.walkA[0] : sp.stand[0];
        var big = R.outlined(frame, 0);
        R.ctx.drawImage(big, bx + 5, y + 5, big.width * 2, big.height * 2);
        F.draw(R.ctx, cand.name, bx + 22, y + 5, 7);
        F.draw(R.ctx, DH.Crew.traitName(cand.trait), bx + 22, y + 14, 10, { font: 'small' });
        UI.para(D.TRAITS[cand.trait].desc, bx + 22, y + 21, bw - 25, 13);
        var ok = !msg && Sim.canAfford(s, cost);
        UI.costRow(bx + 4, y + 47, cost, s);
        if (UI.button(bx + 4, y + 57, bw - 8, 15, 'RECRUIT', { style: ok ? 'good' : 'off', disabled: !ok, id: 'rec:' + cand.id, sound: 'recruit' })) {
          if (Sim.recruit(s, cand)) DH.G.save();
        }
      });
    }
  };

  var tradeTab = {
    h: function (s, pl) { return pl.trades.length * 21 + 14; },
    draw: function (s, pl, x, y, w) {
      F.draw(R.ctx, 'SWAP ORE WITH THE LOCALS. TRADE AS OFTEN AS YOU LIKE.', x, y, 13, { font: 'small' });
      y += 10;
      pl.trades.forEach(function (tr, i) {
        R.box(x, y, w, 19, 0); R.rect(x + 1, y + 1, w - 2, 16, 1);
        var gw = UI.costRow(x + 4, y + 6, tr.give, s);
        F.draw(R.ctx, '►', x + 10 + gw, y + 5, 10);
        UI.costRow(x + 20 + gw, y + 6, tr.get, null, { col: 11 });
        var ok = Sim.canAfford(s, tr.give);
        if (UI.button(x + w - 44, y + 2, 42, 14, 'TRADE', { style: ok ? 'good' : 'off', disabled: !ok, id: 'tr:' + pl.id + i, font: 'small', sound: 'pickup' })) {
          if (Sim.trade(s, tr)) { UI.toast('TRADED!', 'trade', 11); DH.G.markDirty(); }
        }
        y += 21;
      });
    }
  };

  var shopTab = {
    h: function (s, pl) { return pl.unlocks.length * 23 + 4; },
    draw: function (s, pl, x, y, w) {
      pl.unlocks.forEach(function (u, i) {
        var owned = Sim.ownsUnlock(s, u);
        R.box(x, y, w, 21, 0); R.rect(x + 1, y + 1, w - 2, 18, owned ? 3 : 1);
        var icon = u.kind === 'room' ? 'room' : (u.kind === 'decor' ? 'decor' : (u.kind === 'paint' ? 'paint' : 'hull'));
        if (u.kind === 'decor') R.imgC(Spr.decor(u.id), x + 8, y + 10);
        else if (u.kind === 'paint') R.imgC(Spr.droneBase('standard', u.id), x + 8, y + 10);
        else R.img(Spr.icon(icon), x + 4, y + 7);
        var name = DH.Prog.cosmeticName(u);
        F.draw(R.ctx, name, x + 16, y + 3, u.kind === 'room' ? 10 : 7, { font: 'small' });
        if (owned) { F.draw(R.ctx, u.kind === 'room' ? 'BUILD IT IN AN EMPTY SLOT' : 'PLACE IT FROM ANY ROOM', x + 16, y + 11, 13, { font: 'small' }); F.draw(R.ctx, 'OWNED ✓', x + w - 4, y + 8, 11, { font: 'small', align: 'right' }); }
        else {
          var ok = Sim.canAfford(s, u.cost);
          UI.costRow(x + 16, y + 10, u.cost, s);
          if (UI.button(x + w - 46, y + 3, 44, 15, 'BUY', { style: ok ? 'good' : 'off', disabled: !ok, id: 'buy:' + u.id, sound: 'build' })) {
            if (Sim.buyUnlock(s, u)) DH.G.save();
          }
        }
        y += 23;
      });
    }
  };

  DH.Scenes.map = Map;
})(window.DH);
