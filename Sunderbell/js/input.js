/* Sunderbell - input: floating touch joystick, on-screen buttons, keyboard and gamepad. */
(function () {
  'use strict';
  var SB = window.SB;
  var I = SB.input = { x: 0, y: 0, held: {}, pressed: {}, touchActive: false, enabled: true };
  var BTN = ['a', 'swap', 'hold', 'team', 'menu'];
  I.press = function (b) { if (!I.held[b]) I.pressed[b] = true; I.held[b] = true; };
  I.release = function (b) { I.held[b] = false; };
  I.take = function (b) { var p = I.pressed[b]; I.pressed[b] = false; return !!p; };
  I.endFrame = function () { I.pressed = {}; };

  /* ---- keyboard ---- */
  var keys = {};
  var KMAP = { KeyZ: 'a', KeyJ: 'a', Enter: 'a', KeyX: 'swap', KeyK: 'swap', KeyC: 'hold', KeyL: 'hold', KeyV: 'team', Space: 'team', Escape: 'menu', KeyM: 'menu' };
  window.addEventListener('keydown', function (e) {
    if (e.target && /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return;
    keys[e.code] = true; if (KMAP[e.code]) { I.press(KMAP[e.code]); e.preventDefault(); }
    if (/^Digit[1-4]$/.test(e.code)) I.pressed['hero' + e.code.slice(5)] = true;
    if (/^Arrow/.test(e.code)) e.preventDefault();
  });
  window.addEventListener('keyup', function (e) { keys[e.code] = false; if (KMAP[e.code]) I.release(KMAP[e.code]); });
  window.addEventListener('blur', function () { keys = {}; I.held = {}; });

  /* ---- touch joystick (left part of the screen) + buttons ---- */
  var stick = { id: null, ox: 0, oy: 0, x: 0, y: 0 }, R = 46;
  I.bind = function () {
    var base = document.getElementById('stick'), knob = document.getElementById('knob');
    var zone = document.getElementById('stickzone');
    function place(show) { if (!base) return; base.style.display = show ? 'block' : 'none'; base.style.left = (stick.ox - 60) + 'px'; base.style.top = (stick.oy - 60) + 'px'; knob.style.transform = 'translate(' + (stick.x * R) + 'px,' + (stick.y * R) + 'px)'; }
    zone.addEventListener('touchstart', function (e) {
      I.touchActive = true; document.body.classList.add('touch');
      for (var i = 0; i < e.changedTouches.length; i++) { var t = e.changedTouches[i]; if (stick.id === null) { stick.id = t.identifier; stick.ox = t.clientX; stick.oy = t.clientY; stick.x = stick.y = 0; place(true); } }
      e.preventDefault();
    }, { passive: false });
    zone.addEventListener('touchmove', function (e) {
      for (var i = 0; i < e.changedTouches.length; i++) {
        var t = e.changedTouches[i]; if (t.identifier !== stick.id) continue;
        var dx = t.clientX - stick.ox, dy = t.clientY - stick.oy, d = Math.sqrt(dx * dx + dy * dy);
        if (d > R) { /* drag the base along so the stick never "runs out" */ stick.ox += dx / d * (d - R); stick.oy += dy / d * (d - R); dx = t.clientX - stick.ox; dy = t.clientY - stick.oy; d = R; }
        stick.x = dx / R; stick.y = dy / R; place(true);
      }
      e.preventDefault();
    }, { passive: false });
    function end(e) { for (var i = 0; i < e.changedTouches.length; i++) if (e.changedTouches[i].identifier === stick.id) { stick.id = null; stick.x = stick.y = 0; place(false); } }
    zone.addEventListener('touchend', end); zone.addEventListener('touchcancel', end);
    /* mouse drag on the zone (desktop testing) */
    var md = false;
    zone.addEventListener('mousedown', function (e) { md = true; stick.ox = e.clientX; stick.oy = e.clientY; stick.x = stick.y = 0; place(true); });
    window.addEventListener('mousemove', function (e) { if (!md) return; var dx = e.clientX - stick.ox, dy = e.clientY - stick.oy, d = Math.sqrt(dx * dx + dy * dy); if (d > R) { dx = dx / d * R; dy = dy / d * R; } stick.x = dx / R; stick.y = dy / R; place(true); });
    window.addEventListener('mouseup', function () { if (md) { md = false; stick.x = stick.y = 0; place(false); } });
    document.querySelectorAll('[data-btn]').forEach(function (el) {
      var b = el.getAttribute('data-btn');
      var down = function (e) { e.preventDefault(); e.stopPropagation(); I.press(b); el.classList.add('down'); if (SB.audio) SB.audio.unlock(); };
      var up = function (e) { e.preventDefault(); I.release(b); el.classList.remove('down'); };
      el.addEventListener('touchstart', down, { passive: false }); el.addEventListener('touchend', up); el.addEventListener('touchcancel', up);
      el.addEventListener('mousedown', down); el.addEventListener('mouseup', up); el.addEventListener('mouseleave', function () { if (I.held[b]) up({ preventDefault: function () { } }); });
    });
  };

  I.poll = function () {
    var x = stick.x, y = stick.y;
    if (keys.ArrowLeft || keys.KeyA) x -= 1; if (keys.ArrowRight || keys.KeyD) x += 1;
    if (keys.ArrowUp || keys.KeyW) y -= 1; if (keys.ArrowDown || keys.KeyS) y += 1;
    var gp = navigator.getGamepads ? navigator.getGamepads() : [];
    for (var i = 0; i < gp.length; i++) {
      var g = gp[i]; if (!g) continue;
      if (Math.abs(g.axes[0]) > .25) x += g.axes[0]; if (Math.abs(g.axes[1]) > .25) y += g.axes[1];
      if (g.buttons[14] && g.buttons[14].pressed) x -= 1; if (g.buttons[15] && g.buttons[15].pressed) x += 1; if (g.buttons[12] && g.buttons[12].pressed) y -= 1; if (g.buttons[13] && g.buttons[13].pressed) y += 1;
      [['a', 0], ['swap', 2], ['hold', 1], ['team', 3], ['menu', 9]].forEach(function (p) { var bb = g.buttons[p[1]]; var on = bb && bb.pressed; if (on && !I['gp' + p[0]]) I.press(p[0]); if (!on && I['gp' + p[0]]) I.release(p[0]); I['gp' + p[0]] = on; });
    }
    var d = Math.sqrt(x * x + y * y); if (d > 1) { x /= d; y /= d; d = 1; }
    if (d < .2) { x = 0; y = 0; }
    I.x = x; I.y = y;
  };
})();
