// DRIFTHOLD - input.js
// Unified pointer (mouse / touch / pen) + keyboard input, in logical pixel coordinates.
(function (DH) {
  'use strict';
  var In = {
    x: -100, y: -100,          // current primary pointer position (logical px)
    px: -100, py: -100,        // where the primary pointer went down
    down: false,               // primary pointer held
    pressed: false,            // went down this frame
    released: false,           // went up this frame
    rx: -100, ry: -100,        // where it was released
    type: 'mouse',             // pointer type of the last pointer
    drag: 0,                   // max distance moved since press
    wheel: 0,
    keys: {}, hit: {},         // held keys / keys pressed this frame
    anyKey: false,
    hasTouch: (typeof window !== 'undefined') && (('ontouchstart' in window) || (navigator.maxTouchPoints > 0) || (window.matchMedia && window.matchMedia('(pointer: coarse)').matches)),
    lastActivity: Date.now()
  };
  var canvas, primary = null;

  function toLogical(e) {
    var r = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - r.left) / r.width * DH.R.W,
      y: (e.clientY - r.top) / r.height * DH.R.H
    };
  }

  In.init = function (cv) {
    canvas = cv;
    cv.addEventListener('pointerdown', function (e) {
      e.preventDefault();
      In.lastActivity = Date.now();
      if (DH.Snd) DH.Snd.unlock();
      try { cv.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
      if (primary !== null && primary !== e.pointerId) return;
      primary = e.pointerId;
      var p = toLogical(e);
      In.type = e.pointerType || 'mouse';
      if (In.type === 'touch') In.hasTouch = true;
      In.x = In.px = p.x; In.y = In.py = p.y;
      In.down = true; In.pressed = true; In.drag = 0;
      In.pressFrame = DH.G ? DH.G.frameCount : 0;
      cv.focus();
    }, { passive: false });
    cv.addEventListener('pointermove', function (e) {
      if (primary !== null && e.pointerId !== primary) return;
      var p = toLogical(e);
      In.x = p.x; In.y = p.y;
      if (e.pointerType) In.type = e.pointerType;
      if (In.down) In.drag = Math.max(In.drag, Math.abs(p.x - In.px) + Math.abs(p.y - In.py));
    }, { passive: true });
    function up(e) {
      if (e.pointerId !== primary) return;
      var p = toLogical(e);
      In.x = In.rx = p.x; In.y = In.ry = p.y;
      In.down = false; In.released = true;
      primary = null;
      In.lastActivity = Date.now();
    }
    cv.addEventListener('pointerup', up);
    cv.addEventListener('pointercancel', function (e) {
      if (e.pointerId !== primary) return;
      In.down = false; In.released = true; In.cancelled = true;
      In.rx = -1000; In.ry = -1000;
      primary = null;
    });
    cv.addEventListener('pointerleave', function (e) {
      if (e.pointerType === 'mouse' && !In.down) { In.x = -100; In.y = -100; }
    });
    cv.addEventListener('wheel', function (e) {
      e.preventDefault();
      In.wheel += e.deltaY > 0 ? 1 : (e.deltaY < 0 ? -1 : 0);
    }, { passive: false });
    cv.addEventListener('contextmenu', function (e) { e.preventDefault(); });

    window.addEventListener('keydown', function (e) {
      var k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' ', 'Tab', 'PageUp', 'PageDown', 'Home', 'End'].indexOf(e.key) >= 0) e.preventDefault();
      if (DH.Snd) DH.Snd.unlock();
      if (!In.keys[k]) In.hit[k] = true;
      In.keys[k] = true;
      In.anyKey = true;
      In.lastActivity = Date.now();
    });
    window.addEventListener('keyup', function (e) {
      var k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      In.keys[k] = false;
    });
    window.addEventListener('blur', function () { In.keys = {}; In.down = false; primary = null; });

    // stop the page from scrolling / zooming / bouncing on mobile
    document.addEventListener('touchmove', function (e) { e.preventDefault(); }, { passive: false });
    document.addEventListener('gesturestart', function (e) { e.preventDefault(); });
    document.addEventListener('dblclick', function (e) { e.preventDefault(); });
  };

  In.endFrame = function () {
    In.pressed = false; In.released = false; In.cancelled = false;
    In.wheel = 0; In.hit = {}; In.anyKey = false;
  };
  // was this key pressed this frame?
  In.key = function () {
    for (var i = 0; i < arguments.length; i++) if (In.hit[arguments[i]]) return true;
    return false;
  };
  In.held = function () {
    for (var i = 0; i < arguments.length; i++) if (In.keys[arguments[i]]) return true;
    return false;
  };
  In.inRect = function (x, y, rx, ry, rw, rh) { return x >= rx && y >= ry && x < rx + rw && y < ry + rh; };
  // consume the current tap so nothing else reacts to it
  In.consume = function () { In.pressed = false; In.released = false; In.px = In.py = -1000; In.rx = In.ry = -1000; };

  DH.In = In;
})(window.DH = window.DH || {});
