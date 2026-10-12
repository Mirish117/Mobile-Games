/* Dawnbound: The Six Embers - utilities */
(function () {
  'use strict';
  var DB = window.DB = window.DB || {};
  DB.VERSION = '1.0.0';
  DB.$ = function (s, r) { return (r || document).querySelector(s); };
  DB.el = function (tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
  DB.clamp = function (v, a, b) { return v < a ? a : v > b ? b : v; };
  DB.lerp = function (a, b, t) { return a + (b - a) * t; };
  DB.dist = function (ax, ay, bx, by) { var dx = ax - bx, dy = ay - by; return Math.sqrt(dx * dx + dy * dy); };
  DB.sleep = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };
  DB.pick = function (a) { return a[Math.floor(Math.random() * a.length)]; };
  DB.rand = function (a, b) { return a + Math.random() * (b - a); };
  DB.randi = function (a, b) { return Math.floor(a + Math.random() * (b - a + 1)); };
  DB.hash = function (a, b) { var h = (a * 374761393 + b * 668265263) | 0; h = (h ^ (h >>> 13)) * 1274126177 | 0; return (h ^ (h >>> 16)) >>> 0; };
  DB.esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  DB.fmt = function (n) { return String(Math.floor(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ','); };
  /* tiny pub/sub */
  var subs = {};
  DB.on = function (ev, fn) { (subs[ev] = subs[ev] || []).push(fn); };
  DB.emit = function (ev, a, b) { (subs[ev] || []).slice().forEach(function (f) { f(a, b); }); };
  /* tween helper: runs fn(t 0..1) over ms using rAF and resolves at the end */
  DB.tween = function (ms, fn, ease) {
    return new Promise(function (res) {
      var t0 = performance.now();
      (function step(now) {
        var t = Math.min(1, (now - t0) / ms); if (ease) t = ease(t);
        fn(t);
        if (t < 1) requestAnimationFrame(step); else res();
      })(t0);
    });
  };
  DB.easeInOut = function (t) { return t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; };
  /* seeded rng */
  DB.rng = function (seed) { var s = seed >>> 0; return function () { s = (s + 0x6D2B79F5) >>> 0; var t = s; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; }; };
  DB.DIRS = ['down', 'left', 'right', 'up'];
  DB.dirOf = function (dx, dy) { return Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 'left' : 'right') : (dy < 0 ? 'up' : 'down'); };
  DB.dirVec = { down: [0, 1], up: [0, -1], left: [-1, 0], right: [1, 0] };
})();
