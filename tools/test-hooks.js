// engagement systems: daily care package, rank panel, combo chain, salvage crate, records tally, AGAIN
const H = require('./helpers');
module.exports = async (page) => {
  const SP = process.env.SP;
  const log = (k, v) => console.log(k, JSON.stringify(v));
  await page.evaluate(() => {
    const s = DH.Save.defaultState();
    s.hull = 6; s.revealed = 2;
    s.slots = [{ type: 'bridge', lvl: 3 }, { type: 'quarters', lvl: 2 }, { type: 'workshop', lvl: 2 }, { type: 'hydroponics', lvl: 2 }, { type: 'refinery', lvl: 1 }, { type: 'observatory', lvl: 1 }];
    s.slots.forEach(r => r.decor = null);
    Object.assign(s.res, { cu: 120, ice: 80, cry: 10, food: 5, alloy: 3 });
    s.seen.ores = { cu: true, ice: true, cry: true }; s.seen.sectors = { 1: true, 2: true };
    ['quarters', 'workshop', 'hydroponics', 'refinery', 'observatory'].forEach(t => s.blueprints[t] = true);
    s.visited = { kettle: 1, moss: 1 };
    s.parts.cargo = 3; s.parts.drill = 3; s.parts.magnet = 3;
    s.stats.runs = 9; s.stats.partsBuilt = 3; s.stats.bestHaul = 50; s.stats.bestCombo = 12;
    s.rank = 4; s.xp = 100;
    // streak: last claimed two days ago (one missed day is forgiven)
    const today = DH.U.dayNumber();
    s.streak = { lastDay: today - 2, days: 3, best: 3, claimed: today - 2 };
    s.unlocked = { ship: true, launch: true, map: true, log: true, goals: true, daily: true };
    Object.keys({ welcome: 1, build1: 1, map: 1, visit: 1, goals: 1, expand: 1, workshop: 1, assign: 1, log: 1, food: 1, daily: 1, refinery: 1, travel: 1 }).forEach(k => s.tut.done[k] = true);
    s.tut.done.logOpened = true; s.tut.done.dailySeen = true;
    s.daily.last = DH.U.dayKey();
    localStorage.setItem('drifthold.save', JSON.stringify(s));
  });
  await page.reload();
  await page.waitForTimeout(900);
  await H.tapAnywhere(page);
  await page.waitForTimeout(2000);
  await page.screenshot({ path: SP + '/h1_gift.png' });
  log('gift panel', await page.evaluate(() => DH.G.panel && { kind: DH.G.panel.kind, days: DH.G.panel.data.days, reward: DH.G.panel.data.reward }));
  await H.hit(page, 'gift:claim');
  await page.waitForTimeout(700);
  await page.screenshot({ path: SP + '/h2_gift_claimed.png' });
  log('streak', await page.evaluate(() => DH.G.state.streak));
  await H.hit(page, 'gift:ok');
  await page.waitForTimeout(600);
  await page.screenshot({ path: SP + '/h3_ship.png' });
  await H.hit(page, 'ship:rank');
  await page.waitForTimeout(400);
  await page.screenshot({ path: SP + '/h4_rank.png' });
  await H.hit(page, 'panelclose');
  // a run with a forced crate and a long chain
  await page.evaluate(() => DH.G.launch(null));
  await page.waitForTimeout(1400);
  await page.evaluate(() => { const S = DH.Scenes.run.debug(); S.crateAt = S.t + 0.5; });
  await H.autoMine(page, 6000);
  await page.screenshot({ path: SP + '/h5_run_combo.png' });
  log('run', await page.evaluate(() => { const S = DH.Scenes.run.debug(); return { combo: S.combo, best: S.bestCombo, bonus: S.comboBonus, crate: S.pickups.filter(p => p.type === 'crate').length, n: S.drone.n }; }));
  // fly the drone onto the crate
  await page.evaluate(() => { const S = DH.Scenes.run.debug(); const c = S.pickups.find(p => p.type === 'crate'); if (c) { S.drone.x = c.x; S.drone.y = c.y; } });
  await page.waitForTimeout(400);
  log('crateGot', await page.evaluate(() => DH.Scenes.run.debug().crateGot));
  await page.evaluate(() => { const S = DH.Scenes.run.debug(); S.drone.fuel = 0.3; });
  await page.waitForTimeout(4200);
  await page.screenshot({ path: SP + '/h6_tally_crate.png' });
  await page.waitForTimeout(2500);
  await page.screenshot({ path: SP + '/h7_tally_done.png' });
  log('tally', await page.evaluate(() => { const T = DH.Scenes.run.debug().tally; return { total: T.total, crate: T.crate, open: T.crateOpen, stars: T.stars.map(x => x.txt), lines: T.lines.map(x => x.txt), xp: T.xpShown, rank: DH.G.state.rank }; }));
  await H.hit(page, 'run:again');
  await page.waitForTimeout(1500);
  log('again', await page.evaluate(() => ({ scene: DH.G.sceneName, phase: DH.Scenes.run.debug().phase, runs: DH.G.state.stats.runs, dayBonus: DH.G.state.dayBonus === DH.U.dayNumber() })));
};
