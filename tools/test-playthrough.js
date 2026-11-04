// 30 game-minutes of real play: bot pilots runs, brain spends between runs
const H = require('./helpers');
const installBot = require('./bot');
const installBrain = require('./brain');
module.exports = async (page) => {
  const SP = process.env.SP;
  const MIN = +(process.env.MINUTES || 30);
  await page.waitForTimeout(800);
  await H.tapAnywhere(page);
  await page.waitForTimeout(600);
  await page.evaluate(installBot);
  await page.evaluate(installBrain);
  let lastShot = 0;
  for (;;) {
    await page.waitForTimeout(2000);
    const m = await page.evaluate(() => (DH.G.simTime || 0) / 60);
    if (m > lastShot + 10) { lastShot = m; await page.screenshot({ path: SP + '/play_' + Math.round(m) + '.png' }); }
    if (m >= MIN) break;
  }
  await page.evaluate(() => { window.__brain.stop = true; });
  const out = await page.evaluate(() => {
    const s = DH.G.state;
    return { log: window.__brain.log, runs: s.stats.runs, best: s.stats.bestHaul, ore: s.stats.totalOre, rooms: s.slots.filter(Boolean).map(r => r.type + r.lvl).join(' '), parts: s.parts, crew: s.crew.length, sector: s.sector, revealed: s.revealed, goalsDone: s.goalsDone, res: Object.fromEntries(Object.entries(s.res).filter(([k, v]) => v >= 1).map(([k, v]) => [k, Math.floor(v)])) };
  });
  out.log.forEach(l => console.log(l));
  delete out.log;
  console.log(JSON.stringify(out));
};
