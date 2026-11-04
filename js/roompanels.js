// DRIFTHOLD - roompanels.js
// Panels opened from the ship: room details (upgrade, crew, drone parts, research,
// chassis & paint, decorations), building in an empty slot, hull expansion, the hold.
(function (DH) {
  'use strict';
  var R = DH.R, F = DH.Font, UI = DH.UI, U = DH.U, D = DH.D, Sim = DH.Sim, Spr = DH.Spr;
  var P = DH.Panels;
  function G() { return DH.G; }
  function S() { return DH.G.state; }

  function pct(v) { return Math.round(v * 100) + '%'; }
  function r1(v) { return (Math.round(v * 10) / 10).toFixed(1); }

  // ------------------------------------------------------------------ effect text per room
  P.roomEffects = function (s, slot, lvl) {
    var r = s.slots[slot];
    var type = r.type, L = lvl || r.lvl;
    var def = D.ROOMS[type], out = [];
    switch (type) {
      case 'bridge': out.push('HULL ROOMS: ' + D.slotsForBridge(L)); out.push('DRONE FUEL +' + (L - 1) + 'S'); break;
      case 'quarters': out.push('BEDS: ' + def.beds[L - 1]); out.push('MORALE +' + (L * 2) + '%'); break;
      case 'workshop': out.push('PART LEVEL LIMIT: ' + Math.min(10, L * 2)); out.push('BUILD SPEED X' + def.speed[L - 1]); break;
      case 'hydroponics': case 'observatory': case 'lab': case 'refinery':
        var base = def.rate[L - 1];
        out.push('MAKES ' + r1(base) + ' ' + D.resName(def.makes) + '/MIN (BASE)');
        if (type === 'refinery') out.push('USES ' + def.ratio[L - 1] + ' COPPER PER ALLOY');
        if (type === 'observatory') out.push('REVEALS UP TO SECTOR ' + Math.min(6, L + 1));
        if (type === 'lab') out.push('RESEARCH TIER ' + L);
        break;
      case 'galley': out.push('MORALE +' + def.morale[L - 1] + '% WHILE FED'); out.push('EATS ' + r1(def.eat[L - 1]) + ' FOOD/MIN'); break;
      case 'lounge': out.push('MORALE +' + def.morale[L - 1] + '%'); break;
      case 'hangar': out.push('DRONE CARGO +' + (L * 5)); out.push('CHASSIS UP TO TIER ' + L); break;
    }
    return out;
  };

  function tabsFor(type) {
    var t = [];
    if (type === 'workshop') t.push('DRONE');
    if (type === 'lab') t.push('RESEARCH');
    if (type === 'hangar') { t.push('CHASSIS'); t.push('PAINT'); }
    t.push('ROOM'); t.push('CREW');
    if (type === 'bridge') t.push('HULL');
    t.push('DECOR');
    return t;
  }

  // ------------------------------------------------------------------ room panel
  P.room = {
    open: function (p) {
      var r = S().slots[p.data.slot];
      p.data.tabs = tabsFor(r.type);
      p.data.tab = p.data.tab || 0;
      if (p.data.tabName) p.data.tab = Math.max(0, p.data.tabs.indexOf(p.data.tabName));
      p.data.pick = null;
      UI.scrollTo('roompanel', 0);
    },
    draw: function (p) {
      var s = S(), slot = p.data.slot, r = s.slots[slot];
      if (!r) return false;
      var def = D.ROOMS[r.type];
      var pr = UI.panelRect(300, 170);
      var c = UI.panelFrame(pr.x, pr.y, pr.w, pr.h, def.name + '  LV' + r.lvl, { icon: 'room' });
      if (c.closed) return false;
      var tabs = p.data.tabs;
      var nt = UI.tabs('rtab', c.x, c.y, c.w, tabs, p.data.tab);
      if (nt !== p.data.tab) { p.data.tab = nt; p.data.pick = null; UI.scrollTo('roompanel', 0); }
      var name = tabs[p.data.tab];
      p.data.tabName = name;
      var area = { x: c.x, y: c.y + 15, w: c.w, h: c.h - 15 };
      var fn = TABS[name];
      var hgt = fn.height ? fn.height(s, slot, area.w - 4, p) : area.h;
      UI.scrollArea('roompanel', area.x, area.y, area.w, area.h, hgt, function (x, y) { fn.draw(s, slot, x, y, area.w - 4, p); });
      return true;
    }
  };

  var TABS = {};

  TABS.ROOM = {
    height: function (s, slot, w) { return UI.paraH(D.ROOMS[s.slots[slot].type].desc, w) + 82; },
    draw: function (s, slot, x, y, w) {
      var r = s.slots[slot], def = D.ROOMS[r.type];
      y += UI.para(def.desc, x, y, w, 6) + 3;
      for (var i = 0; i < D.MAX_ROOM_LVL; i++) {
        R.box(x + i * 9, y, 8, 8, 0);
        R.rect(x + i * 9 + 1, y + 1, 6, 6, i < r.lvl ? 10 : 1);
        if (i < r.lvl) R.pset(x + i * 9 + 2, y + 2, 7);
      }
      F.draw(R.ctx, 'MORALE ' + pct(Sim.morale(s)), x + w, y + 1, 14, { font: 'small', align: 'right' });
      y += 12;
      var now = P.roomEffects(s, slot);
      F.draw(R.ctx, 'NOW', x, y, 13, { font: 'small' });
      now.forEach(function (l, i) { F.draw(R.ctx, l, x + 22, y + i * 7, 7, { font: 'small' }); });
      if (D.ROOMS[r.type].rate) {
        F.draw(R.ctx, 'WITH CREW & MORALE: ' + r1(Sim.roomRate(s, slot)) + '/MIN', x + 22, y + now.length * 7, 11, { font: 'small' });
        now.push('');
      }
      y += now.length * 7 + 3;
      var cost = Sim.upgradeCost(s, slot);
      if (cost) {
        var nxt = P.roomEffects(s, slot, r.lvl + 1);
        F.draw(R.ctx, 'NEXT', x, y, 13, { font: 'small' });
        nxt.forEach(function (l, i) { F.draw(R.ctx, l, x + 22, y + i * 7, 10, { font: 'small' }); });
        y += nxt.length * 7 + 4;
        var ok = Sim.canAfford(s, cost);
        UI.costRow(x, y + 3, cost, s);
        if (UI.button(x + w - 64, y, 64, 14, 'UPGRADE', { style: ok ? 'good' : 'off', id: 'up:' + slot, sound: 'upgrade', disabled: !ok })) {
          if (Sim.upgrade(s, slot)) {
            DH.ShipView.build(slot);
            UI.toast(D.ROOMS[r.type].name + ' LV' + r.lvl + '!', 'up', 11);
            DH.G.save();
          }
        }
      } else {
        F.draw(R.ctx, '★ MAX LEVEL ★', x + w / 2, y + 2, 10, { align: 'center' });
      }
    }
  };

  TABS.CREW = {
    height: function (s, slot, w, p) {
      if (p.data.pick !== null) return 14 + s.crew.length * 16;
      return 70;
    },
    draw: function (s, slot, x, y, w, p) {
      var r = s.slots[slot], def = D.ROOMS[r.type];
      var inRoom = Sim.crewIn(s, slot);
      if (p.data.pick !== null) {
        if (UI.button(x, y, 40, 12, '◄ BACK', { style: 'dark', font: 'small', id: 'crew:back', sound: 'back' })) { p.data.pick = null; return; }
        F.draw(R.ctx, 'CHOOSE WHO WORKS HERE', x + 46, y + 3, 13, { font: 'small' });
        y += 14;
        s.crew.forEach(function (c, i) {
          var here = c.room === slot;
          var loc = c.room !== null && c.room !== undefined && s.slots[c.room] ? 'IN ' + D.ROOMS[s.slots[c.room].type].short : 'RESTING';
          var match = D.TRAITS[c.trait].room === r.type;
          if (UI.button(x, y, w, 15, '', { style: here ? 'primary' : 'dark', id: 'pick:' + c.id })) {
            if (here) Sim.assign(s, c.id, null);
            else {
              var occupants = Sim.crewIn(s, slot);
              if (occupants.length >= D.crewSlots(r.lvl)) Sim.assign(s, occupants[occupants.length - 1].id, null);
              Sim.assign(s, c.id, slot);
              DH.Crew.actor(c).slot = slot;
            }
            p.data.pick = null;
            G().save();
          }
          R.img(DH.Crew.sprites(c).headBig, x + 3, y + 2);
          F.draw(R.ctx, c.name, x + 13, y + 2, 7, { font: 'small' });
          F.draw(R.ctx, DH.Crew.traitName(c.trait), x + 13, y + 8, match ? 11 : 13, { font: 'small' });
          F.draw(R.ctx, here ? 'TAP TO UNASSIGN' : loc, x + w - 3, y + 5, here ? 7 : 6, { font: 'small', align: 'right' });
          y += 16;
        });
        return;
      }
      UI.para(def.crewEffect + '. MATCHING TRAITS GIVE EVEN MORE.', x, y, w, 6);
      y += 15;
      var slots = D.crewSlots(r.lvl);
      var bw = Math.floor((w - 4) / 2);
      for (var i = 0; i < 2; i++) {
        var bx = x + i * (bw + 4);
        if (i >= slots) {
          R.box(bx, y, bw, 34, 0); R.dither(bx + 1, y + 1, bw - 2, 32, 1);
          R.img(Spr.icon('lock'), bx + 4, y + 4);
          F.draw(R.ctx, 'OPENS AT LV3', bx + 14, y + 5, 5, { font: 'small' });
          continue;
        }
        var c = inRoom[i];
        if (UI.button(bx, y, bw, 34, '', { style: c ? 'normal' : 'dark', id: 'cslot:' + i })) {
          if (!s.crew.length) UI.toast('RECRUIT CREW ON PLANETS', 'crew', 13);
          else { p.data.pick = i; UI.scrollTo('roompanel', 0); }
        }
        if (c) {
          var sp = DH.Crew.sprites(c);
          R.img(R.outlined(sp.stand[0], 0), bx + 4, y + 4);
          F.draw(R.ctx, c.name, bx + 14, y + 5, 7, { font: 'small' });
          F.draw(R.ctx, DH.Crew.traitName(c.trait), bx + 14, y + 12, D.TRAITS[c.trait].room === r.type ? 11 : 1, { font: 'small' });
          F.draw(R.ctx, 'TAP TO SWAP', bx + 14, y + 22, 1, { font: 'small' });
        } else {
          R.img(Spr.icon('plus'), bx + 4, y + 6);
          F.draw(R.ctx, s.crew.length ? 'ASSIGN CREW' : 'NO CREW YET', bx + 14, y + 8, 6, { font: 'small' });
        }
      }
      y += 38;
      var idle = s.crew.filter(function (c) { return c.room === null || c.room === undefined; }).length;
      F.draw(R.ctx, 'CREW ' + s.crew.length + '/' + Sim.bedCount(s) + ' BEDS   RESTING ' + idle, x, y, 13, { font: 'small' });
    }
  };

  function partStat(s, part, lvl) {
    var RUN = D.RUN;
    switch (part) {
      case 'fuel': return (RUN.baseFuel + RUN.fuelPerPart * lvl) + 'S';
      case 'cargo': return String(D.CARGO_TABLE[lvl]);
      case 'drill': return r1(RUN.baseDrill * Math.pow(RUN.drillMult, lvl)) + 'S X' + (1 + Math.floor(lvl / 3));
      case 'magnet': return (RUN.baseMagnet + RUN.magnetPerPart * lvl) + 'PX';
      case 'shield': return (RUN.baseShield + Math.floor((lvl + 1) / 2)) + ' HITS';
    }
    return '';
  }

  TABS.DRONE = {
    height: function () { return 22 + D.PART_ORDER.length * 21; },
    draw: function (s, slot, x, y, w) {
      var cap = Sim.partCap(s);
      if (s.job) {
        var left = (s.job.need - s.job.work) / Math.max(0.01, Sim.workshopSpeed(s));
        F.draw(R.ctx, 'BUILDING ' + D.PARTS[s.job.part].name + ' LV' + s.job.lvl + '  ' + U.fmtTime(left), x, y + 1, 10, { font: 'small' });
        UI.bar(x, y + 8, w, 6, s.job.work / s.job.need, 11, 1);
      } else {
        F.draw(R.ctx, 'PICK A PART TO BUILD. LIMIT: LV' + cap + (cap < 10 ? ' (UPGRADE ROOM FOR MORE)' : ''), x, y + 4, 13, { font: 'small' });
      }
      y += 18;
      D.PART_ORDER.forEach(function (part) {
        var lvl = s.parts[part];
        var info = D.PARTS[part];
        R.box(x, y, w, 19, 0); R.rect(x + 1, y + 1, w - 2, 16, 1);
        R.img(Spr.icon(info.icon), x + 3, y + 3);
        F.draw(R.ctx, info.name, x + 12, y + 3, 7, { font: 'small' });
        F.draw(R.ctx, 'LV' + lvl + ' ' + partStat(s, part, lvl) + (lvl < D.MAX_PART_LVL ? ' ► ' + partStat(s, part, lvl + 1) : ''), x + 12, y + 10, 13, { font: 'small' });
        var cost = Sim.partNextCost(s, part);
        var bx = x + w - 44;
        if (!cost) F.draw(R.ctx, 'MAX', bx + 22, y + 6, 10, { align: 'center', font: 'small' });
        else if (lvl >= cap) F.draw(R.ctx, 'NEEDS ROOM LV', bx + 20, y + 6, 5, { align: 'center', font: 'small' });
        else {
          var cw = UI.costWidth(cost);
          UI.costRow(bx - cw - 4, y + 6, cost, s);
          var ok = !s.job && Sim.canAfford(s, cost);
          if (UI.button(bx, y + 2, 42, 14, s.job ? 'BUSY' : 'BUILD', { style: ok ? 'good' : 'off', disabled: !ok, id: 'part:' + part, font: 'small', sound: 'build' })) {
            if (Sim.startPart(s, part)) { UI.toast('BUILDING ' + info.name + '...', info.icon, 10); G().save(); }
          }
        }
        y += 21;
      });
    }
  };

  TABS.RESEARCH = {
    height: function () { return 6 + D.RESEARCH_ORDER.length * 25; },
    draw: function (s, slot, x, y, w) {
      var lab = Sim.level(s, 'lab');
      D.RESEARCH_ORDER.forEach(function (id) {
        var rs = D.RESEARCH[id];
        var done = !!s.research[id];
        var locked = rs.tier > lab;
        R.box(x, y, w, 23, 0); R.rect(x + 1, y + 1, w - 2, 20, done ? 3 : 1);
        R.img(Spr.icon(locked ? 'lock' : 'research'), x + 3, y + 3);
        F.draw(R.ctx, locked ? '??? (LAB LV' + rs.tier + ')' : rs.name, x + 12, y + 3, locked ? 5 : 7, { font: 'small' });
        if (!locked) UI.para(rs.desc, x + 12, y + 10, w - 70, 13);
        if (done) F.draw(R.ctx, 'DONE ✓', x + w - 4, y + 8, 11, { font: 'small', align: 'right' });
        else if (!locked) {
          var ok = Sim.canAfford(s, rs.cost);
          UI.costRow(x + w - 46 - UI.costWidth(rs.cost) - 4, y + 3, rs.cost, s);
          if (UI.button(x + w - 46, y + 5, 44, 14, 'STUDY', { style: ok ? 'good' : 'off', disabled: !ok, font: 'small', id: 'rs:' + id, sound: 'upgrade' })) {
            if (Sim.doResearch(s, id)) { UI.toast('RESEARCHED ' + rs.name, 'research', 11); G().save(); }
          }
        }
        y += 25;
      });
    }
  };

  TABS.CHASSIS = {
    height: function () { return D.CHASSIS_ORDER.length * 23 + 4; },
    draw: function (s, slot, x, y, w) {
      var hl = Sim.level(s, 'hangar');
      D.CHASSIS_ORDER.forEach(function (id) {
        var ch = D.CHASSIS[id];
        var owned = !!s.owned.chassis[id], eq = s.chassis === id, locked = ch.lvl > hl;
        R.box(x, y, w, 21, 0); R.rect(x + 1, y + 1, w - 2, 18, eq ? 2 : 1);
        R.imgC(locked ? R.silhouette(Spr.droneBase(id, s.paint), 5) : Spr.droneBase(id, s.paint), x + 9, y + 10);
        F.draw(R.ctx, locked ? '??? (HANGAR LV' + ch.lvl + ')' : ch.name, x + 18, y + 3, locked ? 5 : 7, { font: 'small' });
        if (!locked) F.draw(R.ctx, ch.desc, x + 18, y + 11, 13, { font: 'small' });
        var bx = x + w - 46;
        if (eq) F.draw(R.ctx, 'IN USE', bx + 22, y + 7, 11, { font: 'small', align: 'center' });
        else if (owned) { if (UI.button(bx, y + 3, 44, 14, 'EQUIP', { style: 'primary', font: 'small', id: 'ch:' + id })) { s.chassis = id; G().save(); } }
        else if (!locked) {
          var cost = D.CHASSIS_COST[id], ok = Sim.canAfford(s, cost);
          UI.costRow(bx - UI.costWidth(cost) - 4, y + 7, cost, s);
          if (UI.button(bx, y + 3, 44, 14, 'BUY', { style: ok ? 'good' : 'off', disabled: !ok, font: 'small', id: 'chb:' + id, sound: 'build' })) {
            if (Sim.buyChassis(s, id)) { s.chassis = id; UI.toast(ch.name + ' CHASSIS!', 'launch', 11); G().save(); }
          }
        }
        y += 23;
      });
    }
  };

  // paint swatches: drone paints (hangar) or hull colours (bridge)
  function swatches(s, x, y, w, kind) {
    var order = kind === 'paint' ? D.PAINT_ORDER : D.HULL_ORDER;
    var owned = s.owned[kind];
    var cur = kind === 'paint' ? s.paint : s.hullColor;
    var cell = 40, cols = Math.max(1, Math.floor(w / cell));
    order.forEach(function (id, i) {
      var cx = x + (i % cols) * cell, cy = y + Math.floor(i / cols) * 34;
      var have = !!owned[id];
      if (UI.button(cx, cy, cell - 3, 31, '', { style: id === cur ? 'primary' : 'dark', id: 'sw:' + kind + id, disabled: !have })) {
        if (kind === 'paint') s.paint = id; else s.hullColor = id;
        G().save();
      }
      if (kind === 'paint') {
        var img = Spr.droneBase('standard', id);
        R.imgC(have ? img : R.silhouette(img, 5), cx + (cell - 3) / 2, cy + 10);
      } else {
        var h = D.HULLS[id];
        R.box(cx + 8, cy + 4, 20, 12, 0);
        if (have) { R.rect(cx + 9, cy + 5, 18, 10, h.main); R.rect(cx + 9, cy + 12, 18, 3, h.shade); R.rect(cx + 9, cy + 5, 18, 1, h.light); R.rect(cx + 12, cy + 8, 3, 2, 12); R.rect(cx + 17, cy + 8, 3, 2, 12); R.rect(cx + 22, cy + 9, 4, 1, h.trim); }
        else R.rect(cx + 9, cy + 5, 18, 10, 5);
      }
      F.draw(R.ctx, have ? (kind === 'paint' ? D.PAINTS[id].name : D.HULLS[id].name) : '???', cx + (cell - 3) / 2, cy + 21, have ? 7 : 5, { font: 'small', align: 'center' });
    });
    return Math.ceil(order.length / cols) * 34;
  }
  TABS.PAINT = {
    height: function (s, slot, w) { return Math.ceil(D.PAINT_ORDER.length / Math.max(1, Math.floor(w / 40))) * 34 + 14; },
    draw: function (s, slot, x, y, w) {
      F.draw(R.ctx, 'DRONE PAINT - PURELY FOR STYLE', x, y, 13, { font: 'small' });
      swatches(s, x, y + 9, w, 'paint');
    }
  };
  TABS.HULL = {
    height: function (s, slot, w) { return Math.ceil(D.HULL_ORDER.length / Math.max(1, Math.floor(w / 40))) * 34 + 14; },
    draw: function (s, slot, x, y, w) {
      F.draw(R.ctx, 'HULL PAINT - FIND MORE ON PLANETS', x, y, 13, { font: 'small' });
      swatches(s, x, y + 9, w, 'hull');
    }
  };

  TABS.DECOR = {
    height: function (s, slot, w) {
      var n = Object.keys(s.owned.decor).length + 1;
      return Math.ceil(n / Math.max(1, Math.floor(w / 40))) * 30 + 16;
    },
    draw: function (s, slot, x, y, w) {
      var r = s.slots[slot];
      var owned = D.DECOR_ORDER.filter(function (d) { return s.owned.decor[d]; });
      F.draw(R.ctx, owned.length ? 'PICK A DECORATION FOR THIS ROOM' : 'NO DECORATIONS YET. PLANETS SELL SOME!', x, y, 13, { font: 'small' });
      y += 9;
      var list = [null].concat(owned);
      var cell = 40, cols = Math.max(1, Math.floor(w / cell));
      list.forEach(function (id, i) {
        var cx = x + (i % cols) * cell, cy = y + Math.floor(i / cols) * 30;
        var here = r.decor === id;
        var where = id ? s.slots.findIndex(function (o) { return o && o.decor === id; }) : -1;
        if (UI.button(cx, cy, cell - 3, 27, '', { style: here ? 'primary' : 'dark', id: 'dec:' + id })) {
          if (id && where >= 0) s.slots[where].decor = null;
          r.decor = id;
          G().save();
        }
        if (id) { var img = Spr.decor(id); R.imgC(img, cx + (cell - 3) / 2, cy + 9); }
        else R.img(Spr.icon('close'), cx + 14, cy + 4);
        F.draw(R.ctx, id ? D.DECOR[id].name.split(' ').pop() : 'NONE', cx + (cell - 3) / 2, cy + 18, where >= 0 && !here ? 13 : 7, { font: 'small', align: 'center' });
      });
    }
  };

  // ------------------------------------------------------------------ build panel
  P.build = {
    open: function () { UI.scrollTo('build', 0); },
    draw: function (p) {
      var s = S(), slot = p.data.slot;
      if (s.slots[slot]) return false;
      var pr = UI.panelRect(280, 170);
      var c = UI.panelFrame(pr.x, pr.y, pr.w, pr.h, 'BUILD A ROOM', { icon: 'plus' });
      if (c.closed) return false;
      var list = D.ROOM_ORDER.filter(function (t) { return t !== 'bridge' && Sim.findSlot(s, t) < 0; });
      var known = list.filter(function (t) { return s.blueprints[t]; });
      var unknown = list.filter(function (t) { return !s.blueprints[t]; });
      var rowH = 34;
      var hgt = known.length * rowH + (unknown.length ? 12 + unknown.length * 12 : 0) + 4;
      var closeMe = false;
      UI.scrollArea('build', c.x, c.y, c.w, c.h, hgt, function (x, y) {
        var w = c.w - 4;
        if (!known.length) { F.draw(R.ctx, 'NO BLUEPRINTS. VISIT PLANETS ON THE MAP!', x, y + 2, 10, { font: 'small' }); y += 12; }
        known.forEach(function (t) {
          var def = D.ROOMS[t], cost = Sim.buildCost(t), ok = Sim.canAfford(s, cost);
          R.box(x, y, w, rowH - 2, 0); R.rect(x + 1, y + 1, w - 2, rowH - 4, 1);
          var img = DH.ShipView.roomImage(t, 1);
          R.ctx.drawImage(img, 0, 1, 42, rowH - 6, x + 2, y + 2, 42, rowH - 6);
          R.frame(x + 1, y + 1, 44, rowH - 4, 13);
          F.draw(R.ctx, def.name, x + 48, y + 3, 7, { font: 'small' });
          UI.para(def.desc, x + 48, y + 10, w - 100, 13);
          UI.costRow(x + 48, y + rowH - 11, cost, s);
          if (UI.button(x + w - 48, y + 8, 46, 15, 'BUILD', { style: ok ? 'good' : 'off', disabled: !ok, id: 'build:' + t, sound: 'build' })) {
            if (Sim.build(s, slot, t)) {
              DH.ShipView.build(slot);
              UI.toast(def.name + ' BUILT!', 'room', 11);
              G().save();
              closeMe = true;
            }
          }
          y += rowH;
        });
        if (unknown.length) {
          F.draw(R.ctx, 'UNDISCOVERED BLUEPRINTS', x, y + 3, 13, { font: 'small' }); y += 12;
          unknown.forEach(function () {
            R.img(Spr.iconSil('room', 5), x + 2, y);
            F.draw(R.ctx, '??? - FIND IT ON A PLANET', x + 12, y + 1, 5, { font: 'small' });
            y += 12;
          });
        }
      });
      return !closeMe;
    }
  };

  // ------------------------------------------------------------------ expand hull
  P.expand = {
    draw: function (p) {
      var s = S();
      var pr = UI.panelRect(220, 110);
      var c = UI.panelFrame(pr.x, pr.y, pr.w, pr.h, 'EXPAND THE HULL', { icon: 'hull' });
      if (c.closed) return false;
      var y = c.y + 2;
      if (s.hull >= D.MAX_SLOTS) { F.draw(R.ctx, 'THE HULL IS FULL SIZE!', c.x, y, 10); return true; }
      if (!Sim.canExpand(s)) {
        y += UI.para('THE BRIDGE CAN ONLY HANDLE ' + Sim.hullCap(s) + ' ROOMS RIGHT NOW. UPGRADE THE BRIDGE TO LV' + (Sim.level(s, 'bridge') + 1) + ' TO GROW THE SHIP.', c.x, y, c.w, 6, 'big') + 6;
        if (UI.button(c.x + c.w / 2 - 45, y, 90, 15, 'OPEN BRIDGE', { style: 'primary', id: 'exp:bridge' })) {
          G().closePanel(); G().openPanel('room', { slot: 0, tabName: 'ROOM' });
        }
        return true;
      }
      y += UI.para('BOLT ON A NEW SECTION OF HULL. ROOM ' + (s.hull + 1) + ' OF ' + D.MAX_SLOTS + '.', c.x, y, c.w, 6, 'big') + 8;
      var cost = Sim.hullCost(s), ok = Sim.canAfford(s, cost);
      UI.costRow(c.x, y + 4, cost, s);
      if (UI.button(c.x + c.w - 70, y, 70, 15, 'EXPAND', { style: ok ? 'good' : 'off', disabled: !ok, id: 'exp:go', sound: 'build' })) {
        if (Sim.expand(s)) { DH.ShipView.build(s.hull - 1); UI.toast('HULL EXPANDED!', 'hull', 11); G().save(); return false; }
      }
      return true;
    }
  };

  // ------------------------------------------------------------------ hold (all resources)
  P.hold = {
    draw: function (p) {
      var s = S();
      var pr = UI.panelRect(260, 170);
      var c = UI.panelFrame(pr.x, pr.y, pr.w, pr.h, 'THE HOLD', { icon: 'cargo' });
      if (c.closed) return false;
      var keys = D.RES_ORDER.filter(function (k) { return s.res[k] >= 1 || (D.ORES[k] && s.seen.ores[k]); });
      var rates = { food: 0, alloy: 0, data: 0 };
      s.slots.forEach(function (r, i) { if (r && D.ROOMS[r.type].rate) rates[D.ROOMS[r.type].makes] += Sim.roomRate(s, i); });
      var g = Sim.findSlot(s, 'galley');
      if (g >= 0) rates.food -= D.ROOMS.galley.eat[s.slots[g].lvl - 1];
      var hgt = keys.length * 11 + 30;
      UI.scrollArea('hold', c.x, c.y, c.w, c.h, hgt, function (x, y) {
        keys.forEach(function (k) {
          R.img(Spr.icon(D.resIcon(k)), x, y);
          F.draw(R.ctx, D.resName(k), x + 10, y, 6);
          var txt = U.fmt(s.res[k]);
          if (rates[k] !== undefined && rates[k] !== 0) F.draw(R.ctx, (rates[k] > 0 ? '+' : '') + r1(rates[k]) + '/MIN', x + c.w - 50, y + 1, rates[k] > 0 ? 11 : 8, { font: 'small', align: 'right' });
          F.draw(R.ctx, txt, x + c.w - 6, y, 7, { align: 'right' });
          y += 11;
        });
        y += 4;
        F.draw(R.ctx, 'MORALE ' + pct(Sim.morale(s)) + ' - BOOSTS EVERY ROOM', x, y, 14, { font: 'small' });
        F.draw(R.ctx, 'ROOMS KEEP WORKING WHILE YOU ARE AWAY (UP TO 8H)', x, y + 8, 13, { font: 'small' });
      });
      return true;
    }
  };
})(window.DH);
