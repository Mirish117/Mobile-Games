/* The Fractured Path: pixel UI toolkit built from DOM nodes over the canvas.
   Everything here is sized in logical game pixels via the --u variable. */
(function (FP) {
  'use strict';
  var U = FP.ui = {};
  var root = null, dlg = null, dlgState = null, closeTimer = null, fadeEl = null;
  var COLS = 18, ROWS = 4;

  function u(n) { return 'calc(var(--u)*' + n + ')'; }
  U.u = u;
  U.esc = function (s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); };
  U.init = function () {
    root = FP.$('ui');
    fadeEl = document.createElement('div'); fadeEl.className = 'fade'; root.appendChild(fadeEl);
  };
  U.root = function () { return root; };
  U.el = function (cls, html, st, parent) {
    var d = document.createElement('div');
    if (cls) d.className = cls;
    if (html != null) d.innerHTML = html;
    if (st) for (var k in st) d.style[k] = st[k];
    (parent || root).appendChild(d);
    return d;
  };
  U.panel = function (x, y, w, h, cls, parent) {
    var st = { left: u(x), top: u(y), width: u(w) };
    if (h) st.height = u(h);
    return U.el('panel ' + (cls || ''), '', st, parent);
  };
  U.remove = function (el) { if (el && el.parentNode) el.parentNode.removeChild(el); };
  U.clearAll = function () {
    var kids = Array.prototype.slice.call(root.children);
    kids.forEach(function (k) { if (k !== fadeEl) root.removeChild(k); });
    dlg = null; dlgState = null;
  };
  U.bar = function (v, max, cls, w) {
    var p = Math.max(0, Math.min(1, max ? v / max : 0));
    return '<div class="bar ' + (cls || '') + '" style="width:' + (w ? u(w) : '100%') + '"><i style="width:' + Math.round(p * 100) + '%"></i></div>';
  };

  /* ---------- toast / banner ---------- */
  var toastEl = null, toastT = 0;
  U.toast = function (msg, ms) {
    if (!root) return;
    if (toastEl) U.remove(toastEl);
    toastEl = U.el('toast', U.esc(msg));
    clearTimeout(toastT);
    toastT = setTimeout(function () { U.remove(toastEl); toastEl = null; }, ms || 1400);
  };
  U.banner = function (msg, sub) {
    var b = U.el('panel center', '<div class="hi">' + U.esc(msg) + '</div>' + (sub ? '<div class="dim small" style="margin-top:' + u(2) + '">' + U.esc(sub) + '</div>' : ''), { left: u(20), top: u(8), width: u(120), zIndex: 20, pointerEvents: 'none' });
    b.style.opacity = '0'; b.style.transition = 'opacity .3s';
    setTimeout(function () { b.style.opacity = '1'; }, 16);
    setTimeout(function () { b.style.opacity = '0'; }, 1700);
    setTimeout(function () { U.remove(b); }, 2100);
  };
  U.fade = function (on, white, ms) {
    return new Promise(function (res) {
      fadeEl.classList.toggle('white', !!white);
      fadeEl.style.transitionDuration = (ms || 250) + 'ms';
      void fadeEl.offsetWidth;
      fadeEl.classList.toggle('on', !!on);
      setTimeout(res, (ms || 250) + 30);
    });
  };
  U.fadeOn = function () { return fadeEl.classList.contains('on'); };

  /* ---------- scrolling list ---------- */
  /* o: x,y,w,rows,items:[{label,right,off,data,sub}], onSelect(i,item), onCancel(), onMove(i,item), onSide(dir), title, start, parent, alt */
  U.list = function (o) {
    var rows = o.rows || Math.min(8, o.items.length || 1), rowH = 11;
    var p = U.panel(o.x, o.y, o.w, null, o.alt ? 'alt' : '', o.parent);
    if (o.title) U.el('hi small', U.esc(o.title), { marginBottom: u(2), marginLeft: u(2) }, p);
    var ul = document.createElement('ul'); ul.className = 'menu'; p.appendChild(ul);
    ul.style.height = u(rows * rowH);
    var more = U.el('dim small', '', { position: 'absolute', right: u(4), bottom: u(1) }, p);
    var items = o.items, sel = Math.min(o.start || 0, Math.max(0, items.length - 1)), top = 0;
    var self = { el: p, sel: function () { return sel; }, item: function () { return items[sel]; } };
    function draw() {
      if (sel < top) top = sel; if (sel >= top + rows) top = sel - rows + 1;
      ul.innerHTML = '';
      for (var i = top; i < Math.min(items.length, top + rows); i++) {
        (function (i) {
          var it = items[i], li = document.createElement('li');
          li.className = (i === sel ? 'sel ' : '') + (it.off ? 'off' : '');
          li.innerHTML = '<span>' + (it.html || U.esc(it.label)) + '</span>' + (it.right != null ? '<span class="r">' + (it.rightHtml ? it.right : U.esc(it.right)) + '</span>' : '');
          li.style.height = u(rowH);
          li.addEventListener('click', function () { if (i === sel) act(); else { sel = i; draw(); move(); FP.sfx && FP.sfx.cursor && FP.sfx.cursor(); } });
          ul.appendChild(li);
        })(i);
      }
      more.innerHTML = (items.length > rows) ? ((top > 0 ? '^' : ' ') + (top + rows < items.length ? 'v' : ' ')) : '';
    }
    function move() { if (o.onMove) o.onMove(sel, items[sel]); }
    function act() { var it = items[sel]; if (!it) return; if (it.off && !o.allowOff) { FP.sfx && FP.sfx.nope && FP.sfx.nope(); return; } FP.sfx && FP.sfx.select && FP.sfx.select(); if (o.onSelect) o.onSelect(sel, it); }
    var h = { repeat: true, onKey: function (k) {
      if (!items.length) { if (k === 'b' && o.onCancel) o.onCancel(); return; }
      if (k === 'up') { sel = (sel - 1 + items.length) % items.length; draw(); move(); FP.sfx && FP.sfx.cursor && FP.sfx.cursor(); }
      else if (k === 'down') { sel = (sel + 1) % items.length; draw(); move(); FP.sfx && FP.sfx.cursor && FP.sfx.cursor(); }
      else if (k === 'left' || k === 'right') { if (o.onSide) o.onSide(k === 'left' ? -1 : 1, items[sel], sel); }
      else if (k === 'a') act();
      else if (k === 'b') { if (o.onCancel) { FP.sfx && FP.sfx.back && FP.sfx.back(); o.onCancel(); } }
      else if (k === 'menu' && o.onMenu) o.onMenu();
    } };
    self.setItems = function (n, keep) { items = n; if (!keep) { sel = 0; top = 0; } if (sel >= items.length) sel = Math.max(0, items.length - 1); draw(); };
    self.redraw = draw;
    self.setSel = function (i) { sel = i; draw(); };
    self.focus = function () { FP.pushFocus(h); };
    self.blur = function () { FP.popFocus(h); };
    self.close = function () { FP.popFocus(h); U.remove(p); };
    self.handler = h;
    draw(); if (o.focus !== false) FP.pushFocus(h);
    if (o.onMove) move();
    return self;
  };

  /* promise-returning choice menu, shown bottom right over the dialogue box */
  U.choice = function (opts, o) {
    o = o || {};
    return new Promise(function (res) {
      var w = o.w || 0, i, mx = 0;
      for (i = 0; i < opts.length; i++) mx = Math.max(mx, String(opts[i]).length);
      w = w || Math.min(150, mx * 8 + 22);
      var rows = Math.min(opts.length, o.rows || 5);
      var h = rows * 11 + 8;
      var x = o.x !== undefined ? o.x : 156 - w - 4, y = o.y !== undefined ? o.y : (dlg ? 144 - 50 - h - 6 : 144 - h - 10);
      var L = U.list({ x: Math.max(2, x), y: y, w: w, rows: rows, title: o.title, items: opts.map(function (t) { return { label: t }; }),
        onSelect: function (i) { L.close(); res(i); }, onCancel: o.cancel === undefined ? null : function () { L.close(); res(o.cancel); } });
      L.el.style.zIndex = 15;
    });
  };
  U.confirm = function (yes, no, o) { return U.choice([yes || 'Yes', no || 'No'], Object.assign({ cancel: 1 }, o || {})).then(function (i) { return i === 0; }); };

  /* ---------- dialogue ---------- */
  function wrap(text) {
    var pages = [], lines = [];
    String(text).split('\n').forEach(function (para) {
      var words = para.split(' '), cur = '';
      words.forEach(function (w) {
        while (w.length > COLS) { if (cur) { lines.push(cur); cur = ''; } lines.push(w.slice(0, COLS - 1) + '-'); w = w.slice(COLS - 1); }
        if (!cur) cur = w; else if ((cur + ' ' + w).length <= COLS) cur += ' ' + w; else { lines.push(cur); cur = w; }
      });
      lines.push(cur);
    });
    for (var i = 0; i < lines.length; i += ROWS) pages.push(lines.slice(i, i + ROWS).join('\n'));
    return pages.length ? pages : [''];
  }
  U.wrap = wrap;
  function ensureDlg() {
    clearTimeout(closeTimer);
    if (dlg) return;
    dlg = U.el('', '<div class="name"></div><div class="txt"></div><div class="more"></div>', null);
    dlg.id = 'dlg'; dlg.style.zIndex = 10;
    dlg.portEl = document.createElement('canvas'); dlg.portEl.id = 'port'; dlg.portEl.width = 48; dlg.portEl.height = 48; dlg.portEl.style.zIndex = 10;
    root.appendChild(dlg.portEl);
  }
  U.hideDlg = function () {
    clearTimeout(closeTimer);
    if (dlg) { U.remove(dlg.portEl); U.remove(dlg); dlg = null; }
  };
  U.dlgOpen = function () { return !!dlg; };
  /* who: cast id, or {name, port}, or null. text may include \n. */
  U.say = function (who, text, o) {
    o = o || {};
    return new Promise(function (res) {
      ensureDlg();
      var name = '', port = null;
      if (who) {
        if (typeof who === 'string') { var c = FP.art.CAST[who]; name = c ? c.name : who; port = c ? c : null; }
        else { name = who.name || ''; port = who.port || (who.cast && FP.art.CAST[who.cast]) || null; }
      }
      var nm = dlg.firstChild, tx = dlg.children[1], more = dlg.children[2];
      nm.style.display = name ? 'block' : 'none'; nm.textContent = name;
      var pe = dlg.portEl;
      if (port) {
        pe.style.display = 'block';
        var pc = pe.getContext('2d'); pc.imageSmoothingEnabled = false; pc.clearRect(0, 0, 48, 48);
        var spec = Object.assign({}, port, o.mood ? { mood: o.mood } : null, o.mouth ? { mouth: o.mouth } : null);
        pc.drawImage(FP.art.portrait(spec), 0, 0);
      } else pe.style.display = 'none';
      var pages = wrap(text), pi = 0, ci = 0, typing = true, tmr = 0;
      var spd = [0.45, 1, 2.2][(FP.settings.textSpeed || 2) - 1] || 1;
      if (o.instant) spd = 999;
      var lastSfx = 0;
      function show() { tx.textContent = pages[pi].slice(0, Math.floor(ci)); }
      function startPage() { ci = 0; typing = true; more.style.visibility = 'hidden'; show(); }
      function tick() {
        if (!typing) return;
        ci += spd;
        var pg = pages[pi];
        if (ci >= pg.length) { ci = pg.length; typing = false; more.style.visibility = 'visible'; }
        else if (Math.floor(ci) - lastSfx >= 3 && pg[Math.floor(ci) - 1] !== ' ') { lastSfx = Math.floor(ci); FP.sfx && FP.sfx.talk && FP.sfx.talk(who); }
        show();
      }
      tmr = setInterval(tick, 32);
      var h = { onKey: function (k) {
        if (k !== 'a' && k !== 'b') return;
        if (typing) { ci = pages[pi].length; typing = false; more.style.visibility = 'visible'; show(); return; }
        if (pi < pages.length - 1) { pi++; FP.sfx && FP.sfx.cursor && FP.sfx.cursor(); startPage(); return; }
        clearInterval(tmr); FP.popFocus(h);
        if (!o.keep) closeTimer = setTimeout(U.hideDlg, 60);
        res();
      } };
      dlg.addEventListener('click', function cl() { dlg.removeEventListener('click', cl); }, { once: true });
      FP.pushFocus(h);
      dlg.onclick = function () { h.onKey('a'); };
      startPage();
    });
  };
  /* a sequence of lines: [['seren','text'], [null,'narration'], ...] */
  U.seq = async function (arr) { for (var i = 0; i < arr.length; i++) await U.say(arr[i][0], arr[i][1], arr[i][2]); };

  /* ---------- name entry with on-screen keyboard ---------- */
  U.nameEntry = function (o) {
    o = o || {};
    return new Promise(function (res) {
      var max = o.max || 10, val = (o.initial || '').slice(0, max), lower = false;
      var rowsU = ['ABCDEFGHIJ', 'KLMNOPQRST', 'UVWXYZ\'-_ ', '0123456789'];
      var p = U.panel(4, 4, 152, 136, 'full-ish');
      p.style.zIndex = 12;
      U.el('hi center', U.esc(o.title || 'Your name'), { marginBottom: u(2) }, p);
      if (o.sub) U.el('dim small center', U.esc(o.sub), { marginBottom: u(3) }, p);
      var disp = U.el('', '', { height: u(14), padding: u(3), background: 'rgba(0,0,0,.35)', boxShadow: '0 0 0 ' + u(1) + ' var(--ui-line)', marginBottom: u(5), fontSize: u(9), color: 'var(--ui-hi)', letterSpacing: u(1), textAlign: 'center' }, p);
      var kb = U.el('kb', '', null, p);
      var cells = [], cx = 0, cy = 0;
      function build() {
        kb.innerHTML = ''; cells = [];
        rowsU.forEach(function (r, ri) {
          for (var i = 0; i < r.length; i++) {
            (function (ri, i) {
              var ch = r[i], b = document.createElement('button');
              var shown = ch; if (lower && /[A-Z]/.test(ch)) shown = ch.toLowerCase();
              b.textContent = ch === ' ' ? '_' : shown; b.dataset.c = shown;
              b.addEventListener('click', function () { cx = i; cy = ri; type(ch === ' ' ? ' ' : shown); mark(); });
              kb.appendChild(b); (cells[ri] = cells[ri] || []).push(b);
            })(ri, i);
          }
        });
        var ctl = [['aA', 3], ['DEL', 3], ['OK', 4]];
        cells[4] = [];
        ctl.forEach(function (c, ci) {
          var b = document.createElement('button'); b.textContent = c[0]; b.style.gridColumn = 'span ' + c[1];
          b.addEventListener('click', function () { cx = ci; cy = 4; activate(); mark(); });
          kb.appendChild(b); cells[4].push(b);
        });
        mark();
      }
      function mark() {
        cells.forEach(function (r, ri) { r.forEach(function (b, i) { b.classList.toggle('sel', ri === cy && i === cx); }); });
        var t = U.esc(val) + (val.length < max ? '<span style="opacity:.6">_</span>' : '');
        disp.innerHTML = t || '<span class="dim">...</span>';
      }
      function type(ch) { if (val.length < max) { val += ch; FP.sfx && FP.sfx.cursor && FP.sfx.cursor(); } mark(); }
      function done() {
        var v = FP.save.clean(val);
        if (!v) { U.toast('Enter a name'); return; }
        cleanup(); res(v);
      }
      function activate() {
        if (cy < 4) { var b = cells[cy][cx]; type(b.dataset.c === '_' ? ' ' : b.dataset.c); return; }
        if (cx === 0) { lower = !lower; build(); }
        else if (cx === 1) { val = val.slice(0, -1); mark(); }
        else done();
      }
      var h = { repeat: true, onKey: function (k) {
        if (k === 'up') { cy = (cy + 4) % 5; clampx(); }
        else if (k === 'down') { cy = (cy + 1) % 5; clampx(); }
        else if (k === 'left') { cx = (cx + cells[cy].length - 1) % cells[cy].length; }
        else if (k === 'right') { cx = (cx + 1) % cells[cy].length; }
        else if (k === 'a') { activate(); return; }
        else if (k === 'b') { if (val) { val = val.slice(0, -1); } else if (o.cancel) { cleanup(); res(null); return; } }
        else if (k === 'menu') { done(); return; }
        mark();
      } };
      function clampx() { if (cx >= cells[cy].length) cx = cells[cy].length - 1; }
      var kd = function (e) {
        if (e.metaKey || e.ctrlKey || e.altKey) return;
        if (e.key.length === 1 && /[A-Za-z0-9 '_\-]/.test(e.key)) { e.stopImmediatePropagation(); e.preventDefault(); type(e.key); }
        else if (e.key === 'Backspace') { e.stopImmediatePropagation(); e.preventDefault(); val = val.slice(0, -1); mark(); }
        else if (e.key === 'Enter') { e.stopImmediatePropagation(); e.preventDefault(); done(); }
      };
      document.addEventListener('keydown', kd, true);
      function cleanup() { document.removeEventListener('keydown', kd, true); FP.popFocus(h); U.remove(p); }
      FP.pushFocus(h);
      build();
    });
  };

  /* ---------- paste box for export / import codes ---------- */
  U.pasteBox = function (title, text, editable) {
    return new Promise(function (res) {
      var p = U.panel(4, 4, 152, 136); p.style.zIndex = 12;
      U.el('hi center', U.esc(title), { marginBottom: u(3) }, p);
      var ta = document.createElement('textarea');
      ta.value = text || ''; ta.readOnly = !editable;
      ta.style.cssText = 'width:100%;height:' + u(80) + ';font:inherit;font-size:' + u(6) + ';background:rgba(0,0,0,.4);color:var(--ui-fg);border:0;box-shadow:0 0 0 ' + u(1) + ' var(--ui-line);padding:' + u(2) + ';resize:none;touch-action:auto;user-select:text;-webkit-user-select:text;outline:none';
      p.appendChild(ta);
      var row = U.el('row', '', { marginTop: u(4) }, p);
      function mk(label, fn) { var b = document.createElement('button'); b.className = 'tag'; b.style.padding = u(3) + ' ' + u(5); b.textContent = label; b.addEventListener('click', fn); row.appendChild(b); }
      var finish = function (v) { FP.popFocus(h); U.remove(p); res(v); };
      if (editable) { mk('Load', function () { finish(ta.value); }); }
      else mk('Copy', function () { ta.select(); try { document.execCommand('copy'); U.toast('Copied'); } catch (e) {} });
      mk('Close', function () { finish(null); });
      var h = { onKey: function (k) { if (k === 'b') finish(null); } };
      FP.pushFocus(h);
      if (!editable) setTimeout(function () { ta.focus(); ta.select(); }, 50);
    });
  };

  /* ---------- small helpers ---------- */
  U.waitKey = function (keys) {
    return new Promise(function (res) {
      var h = { onKey: function (k) { if (!keys || keys.indexOf(k) >= 0) { FP.popFocus(h); res(k); } } };
      FP.pushFocus(h);
    });
  };
  U.sleep = FP.sleep;
  U.portraitHTML = function (castId) {
    var c = FP.art.CAST[castId]; if (!c) return '';
    var cv = FP.art.portrait(c);
    return cv;
  };
  U.canvasEl = function (src, w, h, st, parent) {
    var c = document.createElement('canvas'); c.width = src.width; c.height = src.height;
    c.getContext('2d').drawImage(src, 0, 0);
    c.style.cssText = 'image-rendering:pixelated;width:' + u(w || src.width) + ';height:' + u(h || src.height) + ';display:block';
    if (st) for (var k in st) c.style[k] = st[k];
    if (parent) parent.appendChild(c);
    return c;
  };
})(FP);
