/* The Fractured Path: core. Namespace, utilities, display, input, saves, sound effects. */
var FP = window.FP = window.FP || {};
(function (FP) {
  'use strict';

  /* ---------- utilities ---------- */
  FP.W = 160; FP.H = 144; FP.T = 16;
  FP.clamp = function (v, a, b) { return v < a ? a : v > b ? b : v; };
  FP.rnd = function () { return Math.random(); };
  FP.ri = function (a, b) { return a + Math.floor(Math.random() * (b - a + 1)); };
  FP.pick = function (arr) { return arr[Math.floor(Math.random() * arr.length)]; };
  FP.mulberry32 = function (a) {
    return function () {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      var t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  };
  FP.hash = function (a, b) {
    var h = Math.imul(a, 374761393) + Math.imul(b, 668265263) | 0;
    h = Math.imul(h ^ h >>> 13, 1274126177);
    return (h ^ h >>> 16) >>> 0;
  };
  FP.sleep = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };
  FP.shuffle = function (arr, rng) {
    rng = rng || Math.random;
    for (var i = arr.length - 1; i > 0; i--) { var j = Math.floor(rng() * (i + 1)); var t = arr[i]; arr[i] = arr[j]; arr[j] = t; }
    return arr;
  };
  FP.wrap = function (text, cols) {
    var out = [];
    String(text).split('\n').forEach(function (para) {
      var words = para.split(' '), line = '';
      words.forEach(function (w) {
        if (!line.length) { line = w; }
        else if ((line + ' ' + w).length <= cols) { line += ' ' + w; }
        else { out.push(line); line = w; }
      });
      out.push(line);
    });
    return out;
  };
  FP.fmt = function (n) { return String(Math.floor(n)); };
  FP.$ = function (id) { return document.getElementById(id); };

  /* ---------- settings ---------- */
  var defaultSettings = { mode: 'color', music: true, sfx: true, textSpeed: 2 };
  FP.settings = (function () {
    try { var s = JSON.parse(localStorage.getItem('fp1.settings') || 'null'); if (s) return Object.assign({}, defaultSettings, s); } catch (e) {}
    return Object.assign({}, defaultSettings);
  })();
  FP.saveSettings = function () { try { localStorage.setItem('fp1.settings', JSON.stringify(FP.settings)); } catch (e) {} };

  /* ---------- display ---------- */
  var view = FP.view = FP.$('view');
  var vctx = view.getContext('2d');
  var L = FP.L = document.createElement('canvas');
  L.width = FP.W; L.height = FP.H;
  var g = FP.g = L.getContext('2d');
  g.imageSmoothingEnabled = false;
  var Q = document.createElement('canvas'); Q.width = FP.W; Q.height = FP.H;
  var qctx = Q.getContext('2d');
  var vignette = null;
  FP.DMG = ['#e0f8d0', '#88c070', '#346856', '#081820'];
  var dmgRGB = FP.DMG.map(function (h) { return [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]; });
  FP.dmgCut = [150, 104, 56];
  var bayer = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]];

  FP.applyMode = function () {
    document.body.classList.toggle('green', FP.settings.mode === 'green');
  };

  FP.layout = function () {
    var dpr = window.devicePixelRatio || 1;
    var vw = window.innerWidth, vh = window.innerHeight;
    var desk = vw >= 900 && vh >= 600;
    var land = !desk && vw > vh && vh <= 520;
    var aw, ah;
    if (desk) { aw = vw * 0.5; ah = vh - 60; }
    else if (land) { aw = vw - 270; ah = vh - 46; }
    else { aw = vw - 14; ah = vh - 250; }
    var k = Math.floor(Math.min(aw * dpr / FP.W, ah * dpr / FP.H));
    if (k < 1) k = 1;
    FP.scale = k;
    var cssW = FP.W * k / dpr, cssH = FP.H * k / dpr;
    view.width = FP.W * k; view.height = FP.H * k;
    view.style.width = cssW + 'px'; view.style.height = cssH + 'px';
    var sw = FP.$('screenwrap'); sw.style.width = cssW + 'px'; sw.style.height = cssH + 'px';
    document.documentElement.style.setProperty('--u', (k / dpr) + 'px');
    vignette = null;
  };

  function buildVignette() {
    var c = document.createElement('canvas'); c.width = view.width; c.height = view.height;
    var x = c.getContext('2d');
    var gr = x.createRadialGradient(c.width / 2, c.height * 0.52, c.height * 0.35, c.width / 2, c.height * 0.52, c.height * 0.95);
    gr.addColorStop(0, 'rgba(8,4,24,0)'); gr.addColorStop(1, 'rgba(8,4,24,0.48)');
    x.fillStyle = gr; x.fillRect(0, 0, c.width, c.height);
    var t = x.createLinearGradient(0, 0, 0, c.height);
    t.addColorStop(0, 'rgba(255,200,140,0.07)'); t.addColorStop(0.5, 'rgba(0,0,0,0)'); t.addColorStop(1, 'rgba(30,10,70,0.12)');
    x.fillStyle = t; x.fillRect(0, 0, c.width, c.height);
    vignette = c;
  }

  FP.present = function () {
    vctx.imageSmoothingEnabled = false;
    if (FP.settings.mode === 'green') {
      var id = g.getImageData(0, 0, FP.W, FP.H), d = id.data;
      var c0 = FP.dmgCut[0], c1 = FP.dmgCut[1], c2 = FP.dmgCut[2];
      for (var y = 0, i = 0; y < FP.H; y++) {
        for (var x = 0; x < FP.W; x++, i += 4) {
          var lum = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
          lum += (bayer[y & 3][x & 3] - 7.5) * 1.2;
          var s = lum >= c0 ? 0 : lum >= c1 ? 1 : lum >= c2 ? 2 : 3;
          var col = dmgRGB[s];
          d[i] = col[0]; d[i + 1] = col[1]; d[i + 2] = col[2]; d[i + 3] = 255;
        }
      }
      qctx.putImageData(id, 0, 0);
      vctx.drawImage(Q, 0, 0, FP.W, FP.H, 0, 0, view.width, view.height);
    } else {
      vctx.drawImage(L, 0, 0, FP.W, FP.H, 0, 0, view.width, view.height);
      if (FP.fx && FP.fx.vignette !== false) {
        if (!vignette) buildVignette();
        vctx.drawImage(vignette, 0, 0);
      }
    }
  };

  /* ---------- focus stack and input ---------- */
  var held = FP.held = { up: false, down: false, left: false, right: false, a: false, b: false };
  var stack = FP.focusStack = [];
  FP.pushFocus = function (h) { stack.push(h); return h; };
  FP.popFocus = function (h) {
    var i = stack.lastIndexOf(h);
    if (i >= 0) stack.splice(i, 1);
  };
  FP.topFocus = function () { return stack[stack.length - 1]; };
  FP.press = function (k) {
    FP.unlockAudio();
    var h = FP.topFocus();
    if (h && h.onKey) h.onKey(k);
  };
  var rep = { k: null, t: 0, n: 0 };
  FP.pollRepeat = function (dt) {
    var dirs = ['up', 'down', 'left', 'right'], cur = null;
    for (var i = 0; i < 4; i++) if (held[dirs[i]]) { cur = dirs[i]; break; }
    if (!cur) { rep.k = null; return; }
    if (rep.k !== cur) { rep.k = cur; rep.t = 0.32; return; }
    rep.t -= dt;
    if (rep.t <= 0) {
      rep.t = 0.11;
      var h = FP.topFocus();
      if (h && h.repeat && h.onKey) h.onKey(cur);
    }
  };
  function setHeld(k, on) {
    if (held[k] === on) return;
    held[k] = on;
    var els = document.querySelectorAll('[data-k="' + k + '"]');
    for (var i = 0; i < els.length; i++) els[i].classList.toggle('on', on);
    if (on) FP.press(k);
  }
  FP.releaseAll = function () { Object.keys(held).forEach(function (k) { setHeld(k, false); }); };

  var keymap = {
    ArrowUp: 'up', KeyW: 'up', ArrowDown: 'down', KeyS: 'down', ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right',
    KeyZ: 'a', Enter: 'a', Space: 'a', KeyJ: 'a', KeyX: 'b', Escape: 'b', Backspace: 'b', KeyK: 'b'
  };
  document.addEventListener('keydown', function (e) {
    if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) {
      if (e.code === 'Enter') { var h = FP.topFocus(); if (h && h.onKey) { h.onKey('a'); e.preventDefault(); } }
      return;
    }
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    var k = keymap[e.code];
    if (k) { e.preventDefault(); if (!e.repeat) setHeld(k, true); }
    else if (e.code === 'KeyM' || e.code === 'Tab') { e.preventDefault(); if (!e.repeat) FP.press('menu'); }
  });
  document.addEventListener('keyup', function (e) {
    var k = keymap[e.code]; if (k) setHeld(k, false);
  });
  window.addEventListener('blur', function () { FP.releaseAll(); });

  FP.initPad = function () {
    var dpad = FP.$('dpad'), active = null;
    function dirFrom(e) {
      var r = dpad.getBoundingClientRect();
      var dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
      var dead = r.width * 0.12;
      var res = { up: false, down: false, left: false, right: false };
      if (Math.abs(dx) < dead && Math.abs(dy) < dead) return res;
      if (Math.abs(dx) > Math.abs(dy) * 0.6 + 0) { if (dx < 0) res.left = true; else res.right = true; }
      if (Math.abs(dy) > Math.abs(dx) * 1.0) { res.left = false; res.right = false; if (dy < 0) res.up = true; else res.down = true; }
      return res;
    }
    function apply(res) { ['up', 'down', 'left', 'right'].forEach(function (k) { setHeld(k, res[k]); }); }
    dpad.addEventListener('pointerdown', function (e) { e.preventDefault(); active = e.pointerId; try { dpad.setPointerCapture(e.pointerId); } catch (x) {} apply(dirFrom(e)); });
    dpad.addEventListener('pointermove', function (e) { if (e.pointerId === active) apply(dirFrom(e)); });
    var end = function (e) { if (e.pointerId === active) { active = null; apply({ up: false, down: false, left: false, right: false }); } };
    dpad.addEventListener('pointerup', end); dpad.addEventListener('pointercancel', end); dpad.addEventListener('lostpointercapture', end);
    ['a', 'b'].forEach(function (k) {
      var el = document.querySelector('.ab[data-k="' + k + '"]');
      el.addEventListener('pointerdown', function (e) { e.preventDefault(); try { el.setPointerCapture(e.pointerId); } catch (x) {} setHeld(k, true); });
      var up = function (e) { setHeld(k, false); };
      el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up); el.addEventListener('lostpointercapture', up);
    });
    var menu = document.querySelector('.mb[data-k="menu"]');
    menu.addEventListener('pointerdown', function (e) { e.preventDefault(); FP.press('menu'); menu.classList.add('on'); });
    menu.addEventListener('pointerup', function () { menu.classList.remove('on'); });
    menu.addEventListener('pointercancel', function () { menu.classList.remove('on'); });
    var mute = document.querySelector('.mb[data-k="mute"]');
    mute.addEventListener('pointerdown', function (e) {
      e.preventDefault(); FP.unlockAudio();
      var on = !(FP.settings.music || FP.settings.sfx);
      FP.settings.music = on; FP.settings.sfx = on; FP.saveSettings();
      if (FP.music) FP.music.refresh();
      if (FP.ui && FP.ui.toast) FP.ui.toast(on ? 'Sound on' : 'Sound off');
    });
    document.addEventListener('contextmenu', function (e) { e.preventDefault(); });
    document.addEventListener('gesturestart', function (e) { e.preventDefault(); });
    document.addEventListener('touchmove', function (e) { if (!(e.target.closest && e.target.closest('input,textarea,.scrollok'))) e.preventDefault(); }, { passive: false });
  };

  /* ---------- saves: slots keyed by hero name, only found by typing the name ---------- */
  FP.save = {
    norm: function (name) { return String(name || '').trim().replace(/\s+/g, ' ').toLowerCase(); },
    key: function (name) { return 'fp1.slot.' + FP.save.norm(name); },
    clean: function (name) { return String(name || '').replace(/[^A-Za-z0-9 _'\-]/g, '').replace(/\s+/g, ' ').trim().slice(0, 10); },
    exists: function (name) { try { return localStorage.getItem(FP.save.key(name)) !== null; } catch (e) { return false; } },
    read: function (name) {
      try { var raw = localStorage.getItem(FP.save.key(name)); return raw ? JSON.parse(raw) : null; } catch (e) { return null; }
    },
    write: function (data) {
      try { data.savedAt = Date.now(); localStorage.setItem(FP.save.key(data.name), JSON.stringify(data)); return true; } catch (e) { return false; }
    },
    remove: function (name) { try { localStorage.removeItem(FP.save.key(name)); } catch (e) {} },
    exportCode: function (name) {
      var d = FP.save.read(name); if (!d) return '';
      try { return btoa(unescape(encodeURIComponent(JSON.stringify(d)))); } catch (e) { return ''; }
    },
    importCode: function (code) {
      try {
        var d = JSON.parse(decodeURIComponent(escape(atob(String(code).trim()))));
        if (!d || !d.name || !d.cls || !d.arc) return null;
        return d;
      } catch (e) { return null; }
    }
  };

  /* ---------- audio context and sound effects ---------- */
  var AC = null, master = null, sfxGain = null, musicGain = null;
  FP.audio = {};
  FP.unlockAudio = function () {
    try {
      if (!AC) {
        var C = window.AudioContext || window.webkitAudioContext;
        if (!C) return;
        AC = new C();
        master = AC.createGain(); master.gain.value = 0.9; master.connect(AC.destination);
        sfxGain = AC.createGain(); sfxGain.gain.value = 0.55; sfxGain.connect(master);
        musicGain = AC.createGain(); musicGain.gain.value = 0.42; musicGain.connect(master);
        FP.audio.ctx = AC; FP.audio.sfxGain = sfxGain; FP.audio.musicGain = musicGain;
        if (FP.music) FP.music.onReady();
      }
      if (AC.state === 'suspended') AC.resume();
    } catch (e) {}
  };
  document.addEventListener('visibilitychange', function () {
    if (!AC) return;
    if (document.hidden) AC.suspend(); else AC.resume();
  });
  function tone(f0, f1, dur, type, vol, delay) {
    if (!AC || !FP.settings.sfx) return;
    try {
      var t = AC.currentTime + (delay || 0), o = AC.createOscillator(), gn = AC.createGain();
      o.type = type || 'square';
      o.frequency.setValueAtTime(f0, t);
      o.frequency.exponentialRampToValueAtTime(Math.max(30, f1), t + dur);
      gn.gain.setValueAtTime(vol || 0.05, t);
      gn.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(gn); gn.connect(sfxGain);
      o.start(t); o.stop(t + dur + 0.03);
    } catch (e) {}
  }
  function noise(dur, vol, delay, hp) {
    if (!AC || !FP.settings.sfx) return;
    try {
      var t = AC.currentTime + (delay || 0), n = Math.floor(AC.sampleRate * dur);
      var buf = AC.createBuffer(1, n, AC.sampleRate), d = buf.getChannelData(0);
      for (var i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
      var s = AC.createBufferSource(); s.buffer = buf;
      var gn = AC.createGain(); gn.gain.value = vol || 0.08;
      var f = AC.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = hp || 800;
      s.connect(f); f.connect(gn); gn.connect(sfxGain); s.start(t);
    } catch (e) {}
  }
  FP.tone = tone; FP.noise = noise;
  FP.sfx = {
    step: function () { tone(120, 90, 0.03, 'triangle', 0.02); },
    blip: function () { tone(880, 880, 0.025, 'square', 0.025); },
    select: function () { tone(660, 990, 0.07, 'square', 0.04); },
    move: function () { tone(520, 520, 0.03, 'square', 0.025); },
    back: function () { tone(440, 300, 0.07, 'square', 0.035); },
    bump: function () { tone(110, 80, 0.05, 'square', 0.03); },
    door: function () { tone(300, 600, 0.1, 'triangle', 0.05); tone(600, 900, 0.1, 'triangle', 0.04, 0.09); },
    hit: function () { noise(0.09, 0.12, 0, 600); tone(200, 70, 0.1, 'square', 0.06); },
    crit: function () { noise(0.12, 0.16, 0, 400); tone(900, 200, 0.14, 'sawtooth', 0.07); },
    miss: function () { tone(500, 250, 0.1, 'triangle', 0.03); },
    magic: function () { tone(300, 1200, 0.25, 'sawtooth', 0.04); tone(600, 1800, 0.2, 'triangle', 0.03, 0.05); },
    heal: function () { [660, 880, 1100, 1320].forEach(function (f, i) { tone(f, f, 0.12, 'triangle', 0.045, i * 0.07); }); },
    hurt: function () { noise(0.14, 0.14, 0, 300); tone(260, 70, 0.22, 'sawtooth', 0.06); },
    buff: function () { tone(440, 880, 0.18, 'square', 0.04); tone(660, 1320, 0.18, 'square', 0.03, 0.08); },
    debuff: function () { tone(660, 220, 0.25, 'sawtooth', 0.04); },
    coin: function () { tone(1100, 1100, 0.05, 'square', 0.03); tone(1650, 1650, 0.1, 'square', 0.03, 0.05); },
    chest: function () { [523, 659, 784, 1047].forEach(function (f, i) { tone(f, f, 0.1, 'square', 0.04, i * 0.07); }); },
    level: function () { [523, 659, 784, 1047, 1319].forEach(function (f, i) { tone(f, f, 0.16, 'square', 0.045, i * 0.09); }); },
    flee: function () { tone(500, 150, 0.3, 'triangle', 0.05); },
    capture: function () { [392, 523, 659, 784, 1047].forEach(function (f, i) { tone(f, f, 0.14, 'square', 0.04, i * 0.1); }); },
    tether: function () { tone(200, 900, 0.3, 'triangle', 0.05); },
    shake: function () { tone(300, 200, 0.08, 'square', 0.04); },
    encounter: function () { for (var i = 0; i < 6; i++) tone(300 + i * 90, 260 + i * 90, 0.07, 'square', 0.04, i * 0.06); noise(0.3, 0.07, 0.1, 1500); },
    quake: function () { noise(0.5, 0.18, 0, 80); tone(80, 40, 0.5, 'sawtooth', 0.08); },
    shatter: function () { noise(0.6, 0.2, 0, 1200); tone(1400, 100, 0.5, 'sawtooth', 0.05); tone(900, 60, 0.6, 'square', 0.04, 0.05); },
    mend: function () { [392, 494, 587, 784, 988, 1175].forEach(function (f, i) { tone(f, f * 1.01, 0.3, 'triangle', 0.05, i * 0.11); }); },
    save: function () { tone(660, 660, 0.08, 'square', 0.04); tone(880, 880, 0.08, 'square', 0.04, 0.08); tone(1320, 1320, 0.2, 'triangle', 0.05, 0.16); },
    stairs: function () { for (var i = 0; i < 4; i++) tone(300 - i * 30, 280 - i * 30, 0.06, 'triangle', 0.03, i * 0.06); }
  };
  FP.sfx.cursor = FP.sfx.move; FP.sfx.nope = FP.sfx.bump;
  FP.sfx.talk = function (who) { var f = 300 + (who && typeof who === 'string' ? (who.charCodeAt(0) % 7) * 40 : 80); tone(f, f * 0.9, 0.03, 'square', 0.014); };
  FP.sfx.rustle = function () { noise(0.12, 0.05, 0, 2000); };
  FP.sfx.fanfareTick = function () { tone(880, 1320, 0.05, 'square', 0.03); };

  /* ---------- tiny helpers shared across modules ---------- */
  FP.timeStr = function (sec) {
    sec = Math.floor(sec || 0);
    var h = Math.floor(sec / 3600), m = Math.floor(sec % 3600 / 60);
    return h + ':' + (m < 10 ? '0' : '') + m;
  };
})(FP);
