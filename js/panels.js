// DRIFTHOLD - panels.js : settings, logbook, welcome-back, launch chooser
(function (DH) {
  'use strict';
  var R = DH.R, F = DH.Font, UI = DH.UI, U = DH.U, D = DH.D, Sim = DH.Sim, Spr = DH.Spr;
  var P = DH.Panels = DH.Panels || {};
  var G = function () { return DH.G; };

  // ------------------------------------------------------------------ settings
  P.settings = {
    open: function (p) { p.data.confirmReset = 0; p.data.msg = null; },
    draw: function (p, dt) {
      var s = G().state;
      var r = UI.panelRect(220, 170);
      var c = UI.panelFrame(r.x, r.y, r.w, r.h, 'SETUP', { icon: 'gear' });
      if (c.closed) return false;
      var y = c.y + 1, bw = 40;
      function toggle(label, key, apply) {
        F.draw(R.ctx, label, c.x + 2, y + 3, 6);
        var on = s.settings[key] !== false;
        if (UI.button(c.x + c.w - bw, y, bw, 13, on ? 'ON' : 'OFF', { style: on ? 'good' : 'off', id: 'set:' + key })) {
          s.settings[key] = !on; if (apply) apply(); G().markDirty();
        }
        y += 16;
      }
      toggle('SOUND FX', 'sfx', function () { DH.Snd.setSfx(s.settings.sfx); });
      toggle('MUSIC', 'music', function () { DH.Snd.setMusicOn(s.settings.music); });
      toggle('SCREEN SHAKE', 'shake');
      var hw = Math.floor((c.w - 4) / 2);
      if (UI.button(c.x, y, hw, 14, 'EXPORT', { style: 'primary', id: 'set:export' })) {
        G().save();
        var code = DH.Save.exportCode(s);
        var done = function () { p.data.msg = 'SAVE CODE COPIED!'; };
        try {
          if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(code).then(done, function () { window.prompt('Copy your DRIFTHOLD save code:', code); });
          } else { window.prompt('Copy your DRIFTHOLD save code:', code); }
        } catch (e) { window.prompt('Copy your DRIFTHOLD save code:', code); }
        p.data.msg = 'SAVE CODE READY';
      }
      if (UI.button(c.x + hw + 4, y, hw, 14, 'IMPORT', { style: 'primary', id: 'set:import' })) {
        var txt = window.prompt('Paste a DRIFTHOLD save code:');
        if (txt) {
          var res = DH.Save.importCode(txt);
          if (res.ok) {
            DH.G.state = res.state; DH.G.save(); DH.G.applySettings();
            p.data.msg = 'SAVE LOADED!';
            DH.G.setScene('ship');
            return false;
          } else p.data.msg = res.err;
        }
      }
      y += 18;
      var rs = p.data.confirmReset > 0;
      if (rs) p.data.confirmReset -= dt;
      if (UI.button(c.x, y, c.w, 14, rs ? 'TAP AGAIN TO ERASE EVERYTHING' : 'RESET GAME', { style: 'danger', font: rs ? 'small' : 'big', id: 'set:reset' })) {
        if (rs) {
          DH.Save.wipe(); DH.G.newGame(); DH.G.applySettings();
          DH.G.setScene('ship', { fromTitle: true });
          return false;
        }
        p.data.confirmReset = 3;
      }
      y += 18;
      if (p.data.msg) F.draw(R.ctx, p.data.msg, c.x + c.w / 2, y, 10, { align: 'center', font: 'small' });
      F.draw(R.ctx, 'PLAYED ' + U.fmtTime(s.stats.playTime) + '   RUNS ' + s.stats.runs, c.x + c.w / 2, c.y + c.h - 13, 13, { font: 'small', align: 'center' });
      F.draw(R.ctx, 'DRIFTHOLD V1.0 - SAVES AUTOMATICALLY', c.x + c.w / 2, c.y + c.h - 6, 5, { font: 'small', align: 'center' });
      return true;
    }
  };
})(window.DH);
