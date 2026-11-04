// usage: node tools/shot.js out.png [w h dpr] [script-file]
// Loads index.html in Chromium, optionally runs steps, takes a screenshot.
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const [out, w = 1280, h = 720, dpr = 1, stepsFile] = process.argv.slice(2);
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: +w, height: +h }, deviceScaleFactor: +dpr, hasTouch: true });
  const errors = [];
  page.on('pageerror', e => errors.push('PAGEERROR ' + e.message));
  page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errors.push(m.type() + ' ' + m.text()); });
  await page.goto('file://' + path.join(__dirname, '..', 'index.html') + (process.env.Q || ''));
  await page.waitForTimeout(400);
  if (stepsFile) { const steps = require(path.resolve(stepsFile)); try { await steps(page); } catch (e) { console.log('STEP FAIL', e.message.split('\n')[0]); } }
  await page.screenshot({ path: out });
  const info = await page.evaluate(() => ({ W: DH.R.W, H: DH.R.H, scale: DH.R.scale, scene: DH.G.sceneName }));
  console.log(JSON.stringify(info));
  if (errors.length) console.log(errors.join('\n'));
  await browser.close();
})();
