// menu quality-of-life + the new toys: tab badges, room flipping, keyboard tabs, shortfall toasts,
// tap-outside-to-close, flotsam on the ship, the run bounty, the nova bomb and the pause menu.
// usage: SP=/tmp node tools/shot.js /tmp/out.png 1280 720 1 tools/test-menus.js
const H = require('./helpers');
module.exports = async (page) => {
  const SP = process.env.SP;
  const fails = [];
  const check = (name, ok, info) => { console.log((ok ? 'PASS ' : 'FAIL ') + name + (info !== undefined ? ' ' + JSON.stringify(info) : '')); if (!ok) fails.push(name); };
  const ev = (fn, arg) => page.evaluate(fn, arg);
  const panel = () => ev(() => DH.G.panel && { kind: DH.G.panel.kind, slot: DH.G.panel.data.slot, tab: DH.G.panel.data.tabName });
  const key = async (k) => { await page.keyboard.press(k); await page.waitForTimeout(120); };

  await ev(() => {
    const s = DH.Save.defaultState();
    s.hull = 6; s.revealed = 2;
    s.slots = [{ type: 'bridge', lvl: 2 }, { type: 'quarters', lvl: 2 }, { type: 'workshop', lvl: 2 }, { type: 'hydroponics', lvl: 1 }, { type: 'refinery', lvl: 1 }, { type: 'lab', lvl: 1 }];
    s.slots.forEach(r => r.decor = null);
    Object.assign(s.res, { cu: 30, ice: 20, food: 4, alloy: 2, data: 5 });
    s.seen.ores = { cu: true, ice: true };
    ['quarters', 'workshop', 'hydroponics', 'refinery', 'lab'].forEach(t => s.blueprints[t] = true);
    for (let i = 0; i < 3; i++) { const c = DH.Crew.generate('mn' + i, 'kettle'); c.room = i === 0 ? null : 1 + i; s.crew.push(c); }
    s.visited = { kettle: 1, moss: 1 };
    s.stats.runs = 6; s.stats.partsBuilt = 2; s.stats.bestHaul = 30;
    s.unlocked = { ship: true, launch: true, map: true, log: true, goals: true, daily: false };
    ['welcome', 'build1', 'map', 'visit', 'goals', 'expand', 'workshop', 'assign', 'log', 'food', 'daily', 'refinery', 'travel', 'lab'].forEach(k => s.tut.done[k] = true);
    s.tut.done.logOpened = true; s.streak.claimed = DH.U.dayNumber();
    localStorage.setItem('drifthold.save', JSON.stringify(s));
  });
  await page.reload();
  await page.waitForTimeout(900);
  await H.tapAnywhere(page);
  await page.waitForTimeout(1200);

  // --- room panel: badges, flip with ◄ ►, keyboard tabs
  await H.hit(page, 'room:2'); await page.waitForTimeout(400);
  let p = await panel();
  check('room opens (not a crew poke)', p && p.kind === 'room' && p.slot === 2, p);
  const badges = await ev(() => DH.Panels.roomBadges(DH.G.state, 2, DH.G.panel.data.tabs));
  check('workshop DRONE tab badge (part affordable)', badges[0] === true, badges);
  await page.screenshot({ path: SP + '/n1_room.png' });
  await H.hit(page, 'room:next'); await page.waitForTimeout(250);
  p = await panel(); check('► goes to next room', p.slot === 3, p);
  await key(']'); p = await panel(); check('] goes to next room', p.slot === 4, p);
  await key('['); await key('['); p = await panel(); check('[ goes back', p.slot === 2, p);
  check('flipping rooms keeps the tab', p.tab === 'ROOM', p);
  const tabs = await ev(() => DH.G.panel.data.tabs);   // DRONE ROOM CREW DECOR
  await key('ArrowRight'); p = await panel(); check('ArrowRight switches tab', p.tab === 'CREW', p);
  await key('Tab'); p = await panel(); check('Tab switches tab', p.tab === 'DECOR', p);
  await key('ArrowRight'); p = await panel(); check('ArrowRight wraps around', p.tab === tabs[0], p);
  await key('ArrowLeft'); p = await panel(); check('ArrowLeft goes back', p.tab === 'DECOR', p);
  // flip to the lab, keep tab by name where possible
  await H.hit(page, 'room:prev'); await page.waitForTimeout(200);
  p = await panel(); check('◄ goes to previous room', p.slot === 1, p);

  // --- shortfall toast on an unaffordable button
  await ev(() => { DH.G.closePanel(); DH.G.openPanel('room', { slot: 0, tabName: 'ROOM' }); });
  await page.waitForTimeout(300);
  await ev(() => { DH.G.state.res.cu = 2; DH.G.state.res.ice = 1; });
  await page.waitForTimeout(100);
  await H.hit(page, 'up:0'); await page.waitForTimeout(250);
  const toast = await ev(() => DH.UI.toasts.map(t => t.text));
  check('shortfall toast explains the cost', toast.some(t => /^NEED .*COPPER.*MORE$/.test(t)), toast);
  await page.screenshot({ path: SP + '/n2_shortfall.png' });

  // --- tap outside closes, tap on the bar doesn't double-toggle
  const out = await ev(() => { const r = DH.UI.lastPanel; return r.x > 8 ? { x: 2, y: r.y + 30 } : { x: DH.R.W / 2, y: Math.max(1, r.y - 6) }; });
  await H.clickL(page, out.x, out.y); await page.waitForTimeout(200);
  check('tap on backdrop closes panel', !(await panel()));
  await H.hit(page, 'bar:log'); await page.waitForTimeout(300);
  check('LOG opens', (await panel()).kind === 'log');
  await H.hit(page, 'bar:log'); await page.waitForTimeout(300);
  check('LOG button toggles closed (no reopen)', !(await panel()));
  await ev(() => DH.G.openPanel('hold')); await page.waitForTimeout(300);
  await H.clickL(page, 160, 90); await page.waitForTimeout(200);
  check('tap inside panel keeps it open', (await panel()) && (await panel()).kind === 'hold');
  await key('Escape');

  // --- flotsam
  const kinds = ['pod', 'comet', 'bottle', 'jelly'];
  for (let i = 0; i < kinds.length; i++) {
    await ev((k) => { const f = DH.ShipView.spawnFlotsam(k); f.x = 60 + 40 * ['pod', 'comet', 'bottle', 'jelly'].indexOf(k); f.vx = 0.01; }, kinds[i]);
    await page.waitForTimeout(250);
    if (i === 3) await page.screenshot({ path: SP + '/n3_flotsam.png' });
    const before = await ev(() => DH.G.state.stats.flotsam || 0);
    await H.hit(page, 'flotsam'); await page.waitForTimeout(250);
    const after = await ev(() => DH.G.state.stats.flotsam || 0);
    check('flotsam ' + kinds[i] + ' collected', after === before + 1, { before, after, toast: await ev(() => DH.UI.toasts.map(t => t.text).slice(-1)[0]) });
  }
  await page.screenshot({ path: SP + '/n4_flotsam_toast.png' });

  // --- run: bounty, nova, pause menu
  await ev(() => DH.G.launch(null));
  await page.waitForTimeout(1800);
  const b = await ev(() => { const S = DH.Scenes.run.debug(); return S.bounty && { id: S.bounty.id, text: S.bounty.text, n: S.bounty.n }; });
  check('run has a bounty', !!b, b);
  await page.screenshot({ path: SP + '/n5_bounty_banner.png' });
  // force a smash bounty and finish it with a nova
  await ev(() => {
    const S = DH.Scenes.run.debug(), d = S.drone;
    S.bounty = { id: 'smash', n: 3, have: 0, done: false, ore: null, pop: 0, text: 'SMASH 3 GREY ROCKS', shown: true };
    let k = 0;
    S.ast.filter(a => a.kind === 'rock').slice(0, 5).forEach(a => { const ang = k++ * 1.25; a.x = d.x + Math.cos(ang) * 40; a.y = d.y + Math.sin(ang) * 40; a.vx = a.vy = 0; });
    S.pickups.push({ x: d.x + 3, y: d.y, type: 'nova', t: 0, life: 9999 });
  });
  await page.waitForTimeout(260);
  await page.screenshot({ path: SP + '/n6_nova.png' });
  await page.waitForTimeout(500);
  const nv = await ev(() => { const S = DH.Scenes.run.debug(); return { smashed: S.smashed, bounty: S.bounty.done, have: S.bounty.have, fuel: S.drone.fuel }; });
  check('nova smashes rocks and completes the bounty', nv.smashed >= 3 && nv.bounty, nv);
  await page.waitForTimeout(800);
  await page.screenshot({ path: SP + '/n7_bounty_done.png' });
  // pause menu
  await key('p');
  check('P pauses', await ev(() => DH.Scenes.run.debug().paused));
  await page.waitForTimeout(400);
  await page.screenshot({ path: SP + '/n8_pause.png' });
  const sfx0 = await ev(() => DH.G.state.settings.sfx !== false);
  await H.hit(page, 'pause:sfx'); await page.waitForTimeout(150);
  check('pause SFX toggle', (await ev(() => DH.G.state.settings.sfx !== false)) === !sfx0);
  check('still paused after toggling', await ev(() => DH.Scenes.run.debug().paused));
  await H.hit(page, 'pause:sfx'); await page.waitForTimeout(150);
  await H.hit(page, 'pause:resume'); await page.waitForTimeout(200);
  check('RESUME resumes', !(await ev(() => DH.Scenes.run.debug().paused)));
  await key('p'); await page.waitForTimeout(400);
  await H.hit(page, 'pause:home'); await page.waitForTimeout(200);
  check('HEAD HOME ends the run', await ev(() => { const S = DH.Scenes.run.debug(); return !S.paused && S.phase !== 'play'; }));
  await page.waitForTimeout(6000);
  await page.screenshot({ path: SP + '/n9_tally.png' });
  const tl = await ev(() => { const T = DH.Scenes.run.debug().tally; return T && T.lines.map(l => l.txt); });
  check('tally pays the bounty', tl && tl.some(t => t.indexOf('BOUNTY DONE') >= 0), tl);
  check('bounty stat counted', (await ev(() => DH.G.state.stats.bounties)) === 1);
  console.log(fails.length ? 'FAILURES: ' + fails.join(', ') : 'ALL PASS');
};
