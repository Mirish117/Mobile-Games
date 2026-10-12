/* Dawnbound - asset loading, sprite sheets, atlas manifest */
(function () {
  'use strict';
  var DB = window.DB;
  var A = DB.assets = { atlas: null, img: {}, pending: {}, tintCache: {} };
  A.loadImage = function (url) {
    if (A.img[url]) return Promise.resolve(A.img[url]);
    if (A.pending[url]) return A.pending[url];
    var p = new Promise(function (res, rej) {
      var im = new Image(); im.decoding = 'async';
      im.onload = function () { A.img[url] = im; delete A.pending[url]; res(im); };
      im.onerror = function () { delete A.pending[url]; console.warn('missing image', url); res(null); };
      im.src = url;
    });
    A.pending[url] = p; return p;
  };
  A.init = function () {
    return fetch('data/atlas.json').then(function (r) { return r.json(); }).then(function (j) { A.atlas = j; });
  };
  A.chars = function (id) { return A.atlas.chars[id]; };
  A.charSheet = function (id) { return A.img['assets/chars/' + id + '.webp']; };
  A.loadChars = function (ids) { return Promise.all(ids.map(function (id) { return A.loadImage('assets/chars/' + id + '.webp'); })); };
  A.loadMap = function (id) { return A.loadImage('assets/maps/' + id + '.webp'); };
  A.loadFx = function () { return Promise.all(['effects_spells', 'effects_interactive', 'items_inventory'].map(function (n) { return A.loadImage('assets/fx/' + n + '.webp'); })); };
  /* frame (col,row) of a character sheet into ctx at x,y (feet position) */
  A.drawFrame = function (ctx, id, col, row, x, y, o) {
    var c = A.atlas.chars[id], im = A.charSheet(id); if (!c || !im) return;
    o = o || {};
    var sc = o.scale || 1, w = c.w * sc, h = c.h * sc;
    var dx = x - c.ax * w, dy = y - c.ay * h;
    if (o.alpha != null) ctx.globalAlpha = o.alpha;
    if (o.flip) { ctx.save(); ctx.translate(x, 0); ctx.scale(-1, 1); dx = -c.ax * w; }
    var src = im;
    if (o.tint) src = A.tinted(id, o.tint, o.tintAmt == null ? 0.5 : o.tintAmt);
    ctx.drawImage(src, col * c.w, row * c.h, c.w, c.h, dx, dy, w, h);
    if (o.flip) ctx.restore();
    if (o.alpha != null) ctx.globalAlpha = 1;
  };
  /* tinted full-sheet copy (multiply-style colour wash that keeps alpha) */
  A.tinted = function (id, color, amt) {
    var key = id + '|' + color + '|' + amt;
    if (A.tintCache[key]) return A.tintCache[key];
    var im = A.charSheet(id), c = document.createElement('canvas'); c.width = im.width; c.height = im.height;
    var x = c.getContext('2d'); x.drawImage(im, 0, 0);
    x.globalCompositeOperation = 'source-atop'; x.globalAlpha = amt; x.fillStyle = color; x.fillRect(0, 0, c.width, c.height);
    A.tintCache[key] = c; return c;
  };
  /* sheet of effects / items / props */
  A.sheetFrame = function (ctx, sheet, name, x, y, o) {
    var s = A.atlas.sheets[sheet], im = A.img['assets/fx/' + sheet + '.webp']; if (!s || !im) return;
    var f = s.frames[name]; if (!f) return; o = o || {};
    var sc = o.scale || 1, w = s.w * sc, h = s.h * sc;
    if (o.alpha != null) ctx.globalAlpha = o.alpha;
    if (o.add) ctx.globalCompositeOperation = 'lighter';
    ctx.drawImage(im, f[0] * s.w, f[1] * s.h, s.w, s.h, x - w / 2 + (o.ox || 0), y - (o.anchorY == null ? .5 : o.anchorY) * h, w, h);
    if (o.add) ctx.globalCompositeOperation = 'source-over';
    if (o.alpha != null) ctx.globalAlpha = 1;
  };
  /* css background for portrait / item thumbnails */
  A.portraitStyle = function (hero, expr, size) {
    var id = hero + '_expressions', c = A.atlas.chars[id]; if (!c) return '';
    var f = c.expr[expr] || c.expr.neutral || [0, 0]; size = size || 96; var k = size / c.w;
    return 'background-image:url(assets/chars/' + id + '.webp);background-size:' + (c.w * c.c * k) + 'px ' + (c.h * c.r * k) + 'px;background-position:-' + (f[0] * c.w * k) + 'px -' + (f[1] * c.h * k) + 'px;width:' + size + 'px;height:' + size + 'px';
  };
  A.thumbStyle = function (id, col, row, size) {
    /* a character's first idle frame as an icon */
    var c = A.atlas.chars[id]; if (!c) return ''; size = size || 64; var k = size / c.w;
    return 'background-image:url(assets/chars/' + id + '.webp);background-size:' + (c.w * c.c * k) + 'px ' + (c.h * c.r * k) + 'px;background-position:-' + ((col || 0) * c.w * k) + 'px -' + ((row || 0) * c.h * k) + 'px;width:' + size + 'px;height:' + size + 'px';
  };
  A.itemStyle = function (name, size) {
    var s = A.atlas.sheets.items_inventory, f = s.frames[name]; if (!f) return 'width:' + (size || 40) + 'px;height:' + (size || 40) + 'px';
    size = size || 40; var k = size / s.w;
    return 'background-image:url(assets/fx/items_inventory.webp);background-size:' + (s.w * s.c * k) + 'px ' + (s.h * s.r * k) + 'px;background-position:-' + (f[0] * s.w * k) + 'px -' + (f[1] * s.h * k) + 'px;width:' + size + 'px;height:' + size + 'px';
  };
})();
