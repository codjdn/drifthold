// plays a few real runs with the bot and reports yields vs the pacing model
const H = require('./helpers');
const installBot = require('./bot');
module.exports = async (page) => {
  await page.waitForTimeout(800);
  await H.tapAnywhere(page);
  await page.waitForTimeout(600);
  await page.evaluate(installBot);
  const configs = [{ parts: {} }, { parts: { cargo: 2, drill: 2 } }, { parts: { cargo: 4, drill: 4, magnet: 4, fuel: 3, shield: 3 } }];
  for (const cfg of configs) {
    for (let rep = 0; rep < 2; rep++) {
      await page.evaluate((cfg) => { Object.assign(DH.G.state.parts, cfg.parts); DH.G.state.stats.runs = 5; DH.G.launch(null); window.__t0 = DH.G.time; }, cfg);
      // wait for the tally
      for (let i = 0; i < 400; i++) {
        await page.waitForTimeout(250);
        const ph = await page.evaluate(() => { const S = DH.Scenes.run.debug(); return S && S.phase; });
        if (ph === 'tally') break;
      }
      const r = await page.evaluate(() => { const S = DH.Scenes.run.debug(); return { ore: S.tally.base, cap: S.drone.cap, reason: S.endReason, simTime: S.t, hits: S.hits, st: { drill: +S.st.drillTime.toFixed(2), chunk: S.st.chunk, cargo: S.st.cargo, fuel: S.st.fuel } }; });
      console.log(JSON.stringify(cfg.parts), JSON.stringify(r), 'ore/s', (r.ore / r.simTime).toFixed(2));
      await page.waitForTimeout(2500);
      await H.hit(page, 'run:continue');
      await page.waitForTimeout(700);
    }
  }
};
