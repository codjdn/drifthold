// the run toys: dash + smash, star core perk draft, fever, surprise events; and poking crew on the ship
const H = require('./helpers');
module.exports = async (page) => {
  const SP = process.env.SP;
  const log = (k, v) => console.log(k, JSON.stringify(v));
  await page.evaluate(() => {
    const s = DH.Save.defaultState();
    s.hull = 4; s.revealed = 2;
    s.slots = [{ type: 'bridge', lvl: 2 }, { type: 'quarters', lvl: 2 }, { type: 'workshop', lvl: 1 }, { type: 'hydroponics', lvl: 1 }];
    s.slots.forEach(r => r.decor = null);
    for (let i = 0; i < 3; i++) { const c = DH.Crew.generate('fun' + i, 'kettle'); c.room = 1 + i; s.crew.push(c); }
    s.seen.ores = { cu: true, ice: true }; s.stats.runs = 6; s.stats.bestHaul = 40;
    s.unlocked = { ship: true, launch: true, map: true, log: true, goals: true, daily: false };
    Object.keys({ welcome: 1, build1: 1, map: 1, visit: 1, goals: 1, expand: 1, workshop: 1, assign: 1, log: 1, food: 1, daily: 1, refinery: 1, travel: 1 }).forEach(k => s.tut.done[k] = true);
    s.tut.done.logOpened = true; s.streak.claimed = DH.U.dayNumber();
    localStorage.setItem('drifthold.save', JSON.stringify(s));
  });
  await page.reload();
  await page.waitForTimeout(900);
  await H.tapAnywhere(page);
  await page.waitForTimeout(1500);
  // poke every crew member a few times
  for (let k = 0; k < 5; k++) {
    const ids = await page.evaluate(() => DH.G.state.crew.map(c => c.id));
    for (const id of ids) { try { await H.hit(page, 'crew:' + id); } catch (e) { } }
  }
  await page.waitForTimeout(150);
  await page.screenshot({ path: SP + '/u1_poke.png' });
  log('pokes', await page.evaluate(() => DH.G.state.crew.map(c => { const a = DH.Crew.actor(c); return [a.pokes || 0, a.say && a.say.text]; })));
  // run
  await page.evaluate(() => DH.G.launch(null));
  await page.waitForTimeout(1500);
  // put a small grey rock right ahead and dash into it
  const smash = await page.evaluate(() => {
    const S = DH.Scenes.run.debug(), d = S.drone;
    const r = S.ast.find(a => a.kind === 'rock' && a.r <= 9);
    r.x = d.x + 26; r.y = d.y; r.vx = r.vy = 0; d.vx = 40; d.vy = 0; d.ang = 0;
    return S.smashed;
  });
  await page.keyboard.press('Space');
  await page.waitForTimeout(120);
  await page.screenshot({ path: SP + '/u2_dash.png' });
  await page.waitForTimeout(500);
  log('smashed', await page.evaluate(() => { const S = DH.Scenes.run.debug(); return { smashed: S.smashed, shields: S.drone.shields, max: S.drone.maxShields, cd: +S.dash.cd.toFixed(2) }; }));
  // star core -> draft
  await page.evaluate(() => { const S = DH.Scenes.run.debug(); S.pickups.push({ x: S.drone.x, y: S.drone.y, type: 'core', t: 0, life: 9999 }); S.cores = 1; });
  await page.waitForTimeout(900);
  await page.screenshot({ path: SP + '/u3_draft.png' });
  log('draft', await page.evaluate(() => DH.Scenes.run.debug().draft));
  await H.hit(page, 'perk:1');
  await page.waitForTimeout(300);
  log('perks', await page.evaluate(() => DH.Scenes.run.debug().perkList));
  // fever + event banner
  await page.evaluate(() => { const S = DH.Scenes.run.debug(); S.comboT = 2; S.combo = 29; S.eventAt = S.t + 0.1; });
  await H.autoMine(page, 2500);
  await page.screenshot({ path: SP + '/u4_fever_event.png' });
  log('fever', await page.evaluate(() => { const S = DH.Scenes.run.debug(); return { fever: S.fever, combo: S.combo, event: S.event && S.event.id, music: DH.Snd.track }; }));
  await H.autoMine(page, 5000);
  await page.screenshot({ path: SP + '/u5_later.png' });
  await page.evaluate(() => { DH.Scenes.run.debug().drone.fuel = 0.3; });
  await page.waitForTimeout(5000);
  await page.keyboard.press('Enter');
  await page.waitForTimeout(2500);
  await page.screenshot({ path: SP + '/u6_tally.png' });
  log('tally', await page.evaluate(() => { const T = DH.Scenes.run.debug().tally; return T && { lines: T.lines.map(l => l.txt), total: T.total }; }));
};
