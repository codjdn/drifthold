module.exports = async (page) => {
  await page.waitForTimeout(800);
  const r = await page.evaluate(() => {
    const s = DH.Save.defaultState();
    s.res.cu = 123; s.crew.push(DH.Crew.generate('x', 'kettle')); s.slots[1] = { type: 'quarters', lvl: 2, decor: 'plant' };
    const code = DH.Save.exportCode(s);
    const back = DH.Save.importCode(code);
    const bad = DH.Save.importCode(code.slice(0, -4) + 'AAAA');
    const junk = DH.Save.importCode('hello');
    // old-version save migrates
    const old = JSON.parse(JSON.stringify(s)); old.v = 1; delete old.bought; delete old.settings;
    const mig = DH.Save.migrate(old);
    return { ok: back.ok, cu: back.state.res.cu, crew: back.state.crew.length, room: back.state.slots[1].type, badOk: bad.ok, badErr: bad.err, junkErr: junk.err, migV: mig.v, migSettings: !!mig.settings, migBought: !!mig.bought, len: code.length };
  });
  console.log(JSON.stringify(r));
};
