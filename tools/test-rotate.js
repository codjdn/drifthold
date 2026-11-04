const H = require('./helpers');
module.exports = async (page) => {
  const SP = process.env.SP;
  await page.waitForTimeout(800);
  await H.tapAnywhere(page);
  await page.waitForTimeout(500);
  await page.evaluate(() => { const s = DH.G.state; s.hull = 5; s.slots = [{ type: 'bridge', lvl: 2 }, { type: 'quarters', lvl: 1 }, { type: 'workshop', lvl: 1 }, { type: 'hydroponics', lvl: 1 }, null]; s.tut.done.welcome = 1; s.stats.runs = 3; s.tut.done.build1 = 1; });
  await page.waitForTimeout(500);
  await page.screenshot({ path: SP + '/r1.png' });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(700);
  await page.screenshot({ path: SP + '/r2.png' });
  console.log(JSON.stringify(await page.evaluate(() => ({ W: DH.R.W, H: DH.R.H, layout: DH.ShipView.layoutName(), canvasCss: DH.R.canvas.style.width + 'x' + DH.R.canvas.style.height }))));
  await page.evaluate(() => DH.G.launch(null));
  await page.waitForTimeout(1500);
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.waitForTimeout(700);
  await page.screenshot({ path: SP + '/r3.png' });
};
