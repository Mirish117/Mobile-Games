/* Dawnbound - input: keyboard + touch joystick + action buttons */
(function () {
  'use strict';
  var DB = window.DB;
  var IN = DB.input = { ax: 0, ay: 0, held: {}, hits: {}, listeners: [], touch: false, enabled: true };
  var KEYMAP = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right', w: 'up', s: 'down', a: 'left', d: 'right', W: 'up', S: 'down', A: 'left', D: 'right',
    j: 'a', J: 'a', z: 'a', Z: 'a', ' ': 'a', Enter: 'a', k: 'b', K: 'b', x: 'b', X: 'b', Shift: 'b', u: 's1', U: 's1', i: 's2', I: 's2', l: 'burst', L: 'burst', Escape: 'menu', m: 'menu', M: 'menu', Tab: 'menu', q: 'cancel', Q: 'cancel', Backspace: 'cancel' };
  var keyState = { up: 0, down: 0, left: 0, right: 0 };
  function fire(name) { IN.hits[name] = true; IN.listeners.slice().forEach(function (f) { f(name); }); }
  function press(name) { if (IN.held[name]) return; IN.held[name] = true; fire(name); }
  function release(name) { IN.held[name] = false; }
  window.addEventListener('keydown', function (e) {
    if (/INPUT|TEXTAREA/.test((e.target || {}).tagName || '')) return;
    var n = KEYMAP[e.key]; if (!n) return;
    if (e.key === ' ' || e.key.indexOf('Arrow') === 0 || e.key === 'Tab') e.preventDefault();
    if (n in keyState) keyState[n] = 1; if (!e.repeat) press(n); else if (n === 'a' || n === 'up' || n === 'down' || n === 'left' || n === 'right') fire(n + '_rep');
    if (n === 'a' && e.key === 'Escape') { }
  });
  window.addEventListener('keyup', function (e) { var n = KEYMAP[e.key]; if (!n) return; if (n in keyState) keyState[n] = 0; release(n); });
  window.addEventListener('blur', function () { for (var k in keyState) keyState[k] = 0; IN.held = {}; });
  IN.update = function () {
    var x = keyState.right - keyState.left, y = keyState.down - keyState.up;
    if (IN.stick) { x += IN.stick.x; y += IN.stick.y; }
    var m = Math.sqrt(x * x + y * y); if (m > 1) { x /= m; y /= m; }
    IN.ax = x; IN.ay = y;
  };
  IN.down = function (n) { return !!IN.held[n]; };
  IN.lockUntil = 0;
  IN.lock = function (ms) { IN.lockUntil = performance.now() + ms; IN.hits = {}; };
  IN.hit = function (n) { var v = IN.hits[n]; IN.hits[n] = false; if (performance.now() < IN.lockUntil) return false; return !!v; };
  IN.flush = function () { IN.hits = {}; };
  IN.listen = function (fn) { IN.listeners.push(fn); return function () { IN.listeners = IN.listeners.filter(function (f) { return f !== fn; }); }; };
  /* touch UI */
  IN.initTouch = function () {
    var pad = DB.$('#pad'), knob = DB.$('#knob'), base = DB.$('#stickbase');
    var id = null, cx = 0, cy = 0, R = 52;
    function setStick(px, py) {
      var dx = px - cx, dy = py - cy, m = Math.sqrt(dx * dx + dy * dy); if (m > R) { dx = dx / m * R; dy = dy / m * R; m = R; }
      knob.style.transform = 'translate(' + dx + 'px,' + dy + 'px)';
      var dead = 8; IN.stick = m < dead ? { x: 0, y: 0 } : { x: dx / R, y: dy / R };
    }
    function start(e) {
      for (var i = 0; i < e.changedTouches.length; i++) { var t = e.changedTouches[i]; if (id === null) { id = t.identifier; var r = base.getBoundingClientRect(); cx = r.left + r.width / 2; cy = r.top + r.height / 2; setStick(t.clientX, t.clientY); } }
      e.preventDefault();
    }
    function move(e) { for (var i = 0; i < e.changedTouches.length; i++) { var t = e.changedTouches[i]; if (t.identifier === id) setStick(t.clientX, t.clientY); } e.preventDefault(); }
    function end(e) { for (var i = 0; i < e.changedTouches.length; i++) { if (e.changedTouches[i].identifier === id) { id = null; IN.stick = null; knob.style.transform = ''; } } }
    base.addEventListener('touchstart', start, { passive: false }); base.addEventListener('touchmove', move, { passive: false }); base.addEventListener('touchend', end); base.addEventListener('touchcancel', end);
    /* mouse drag on stick for desktop testing */
    var md = false;
    base.addEventListener('mousedown', function (e) { var r = base.getBoundingClientRect(); cx = r.left + r.width / 2; cy = r.top + r.height / 2; md = true; setStick(e.clientX, e.clientY); });
    window.addEventListener('mousemove', function (e) { if (md) setStick(e.clientX, e.clientY); });
    window.addEventListener('mouseup', function () { if (md) { md = false; IN.stick = null; knob.style.transform = ''; } });
    document.querySelectorAll('[data-btn]').forEach(function (b) {
      var n = b.getAttribute('data-btn');
      function dn(e) { e.preventDefault(); e.stopPropagation(); b.classList.add('on'); press(n); }
      function up(e) { e.preventDefault(); b.classList.remove('on'); release(n); }
      b.addEventListener('touchstart', dn, { passive: false }); b.addEventListener('touchend', up); b.addEventListener('touchcancel', up);
      b.addEventListener('mousedown', dn); b.addEventListener('mouseup', up); b.addEventListener('mouseleave', up);
    });
    if ('ontouchstart' in window || navigator.maxTouchPoints > 0) { IN.touch = true; document.body.classList.add('touch'); }
  };
  IN.showPad = function (on) { var p = DB.$('#pad'); if (p) p.classList.toggle('hidden', !on); };
})();
