// In-page "player brain" for automated playthroughs: makes the choices a goal-following
// player would make between runs, logs when each new thing unlocks (in game minutes).
module.exports = function installBrain() {
  if (window.__brain) return;
  const B = window.__brain = { log: [], seen: {} };
  const D = DH.D, Sim = DH.Sim;
  const t = () => ((DH.G.simTime || 0) / 60).toFixed(1);
  const note = (k, txt) => { if (!B.seen[k]) { B.seen[k] = 1; B.log.push(t() + 'm  ' + txt); } };
  Sim.on((type, d) => {
    if (type === 'build') note('b' + d.type, 'BUILT ' + d.type.toUpperCase());
    if (type === 'unlock') note('u' + d.u.id, 'UNLOCKED ' + d.u.kind + ':' + d.u.id);
    if (type === 'recruit') note('r' + DH.G.state.crew.length, 'RECRUIT #' + DH.G.state.crew.length + ' ' + d.crew.trait);
    if (type === 'reveal') note('s' + d.sector, 'SECTOR ' + d.sector + ' REVEALED');
    if (type === 'travel') note('t' + d.sector, 'TRAVEL TO SECTOR ' + d.sector);
    if (type === 'part') note('p' + d.part + d.lvl, 'PART ' + d.part + ' LV' + d.lvl);
    if (type === 'upgrade') note('up' + d.type + d.lvl, 'UPGRADE ' + d.type + ' LV' + d.lvl);
    if (type === 'expand') note('h' + d.hull, 'HULL ' + d.hull);
    if (type === 'research') note('rs' + d.id, 'RESEARCH ' + d.id);
  });
  function costSize(c) { let n = 0; for (const k in c) n += c[k]; return n; }
  function act() {
    const s = DH.G.state, G = DH.G;
    if (!s || G.trans) return;
    const tip = DH.Prog.currentTip();
    if (tip && tip.block) { s.tut.done[tip.id] = true; return; }
    if (G.sceneName === 'run') {
      const S = DH.Scenes.run.debug();
      if (S && S.phase === 'tally' && S.tally.done) DH.In.hit.Enter = true;
      else if (S && S.phase === 'tally') DH.In.released = true;
      return;
    }
    if (G.panel) G.closePanel();
    if (G.sceneName === 'map') { G.setScene('ship'); return; }
    if (G.sceneName !== 'ship') return;
    if (s.unlocked.goals) note('goals', 'GOALS ON');
    if (s.unlocked.log) note('log', 'LOGBOOK ON');
    if (s.unlocked.daily) note('daily', 'DAILY ANOMALY ON');
    // a greedy, goal-minded shopping list
    let bought = true, guard = 0;
    while (bought && guard++ < 12) {
      bought = false;
      const free = Sim.freeSlotIndex(s);
      const opts = [];
      if (s.crew.length < Sim.bedCount(s)) opts.push({ c: Sim.recruitCost(s), w: 0.5, f: () => { const pid = D.sector(s.sector).planets[0]; Sim.visit(s, pid); return Sim.recruit(s, DH.Crew.candidates(s, pid)[0]); } });
      if (s.crew.length) D.PLANET_ORDER.forEach(pid => { const p = D.PLANETS[pid]; if (p.sector <= s.revealed) p.unlocks.forEach(u => { if (u.kind === 'room' && !s.blueprints[u.id]) opts.push({ c: u.cost, w: 0.3, f: () => { Sim.visit(s, pid); return Sim.buyUnlock(s, u); } }); }); });
      Sim.buildable(s).forEach(ty => { if (free >= 0) opts.push({ c: Sim.buildCost(ty), w: 0.2, f: () => Sim.build(s, free, ty) }); });
      if (free < 0 && Sim.buildable(s).length && Sim.canExpand(s)) opts.push({ c: Sim.hullCost(s), w: 0.25, f: () => Sim.expand(s) });
      s.slots.forEach((r, i) => { if (!r) return; const c = Sim.upgradeCost(s, i); if (!c) return;
        let w = 1; if (r.type === 'bridge' && free < 0 && !Sim.canExpand(s) && Sim.buildable(s).length) w = 0.25; if (r.type === 'observatory') w = 0.45;
        opts.push({ c, w, f: () => Sim.upgrade(s, i) }); });
      if (!s.job && Sim.partCap(s)) D.PART_ORDER.forEach(p => { if (s.parts[p] < Sim.partCap(s)) opts.push({ c: Sim.partNextCost(s, p), w: p === 'cargo' || p === 'drill' ? 0.75 : 1, f: () => Sim.startPart(s, p) }); });
      if (Sim.level(s, 'lab')) D.RESEARCH_ORDER.forEach(id => { if (Sim.researchAvailable(s, id)) opts.push({ c: D.RESEARCH[id].cost, w: 0.7, f: () => Sim.doResearch(s, id) }); });
      opts.sort((a, b) => a.w * costSize(a.c) - b.w * costSize(b.c));
      const goal = opts[0];
      if (goal && Sim.canAfford(s, goal.c) && goal.f()) bought = true;
    }
    // put idle crew to work
    s.crew.forEach(c => { if (c.room !== null && c.room !== undefined) return; for (const ty of ['hydroponics', 'refinery', 'workshop', 'lab', 'observatory', 'bridge', 'galley']) { const i = Sim.findSlot(s, ty); if (i >= 0 && Sim.assign(s, c.id, i)) break; } });
    // drift to the most useful revealed sector now and then
    if (s.revealed > 1 && Math.random() < 0.3) { const target = Math.min(s.revealed, 1 + Math.floor(Math.random() * s.revealed)); if (target !== s.sector) Sim.travel(s, target); }
    if (s.stats.runs === 0 || Sim.builtCount(s) >= 1) {
      if (DH.Prog.dailyAvailable(s)) G.launch(DH.Prog.todayAnomaly()); else G.launch(null);
    }
  }
  setInterval(act, 60);
};
