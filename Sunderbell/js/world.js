/* Sunderbell - world: maps, tiles, collision, camera, rendering, lighting. */
(function () {
  'use strict';
  var SB = window.SB, T = 16;
  var W = SB.W = {
    map: null, mapId: null, tiles: null, ents: [], fx: [], cam: { x: 0, y: 0 }, time: 0,
    shake: 0, tint: null, fade: { a: 0, color: '#000' }, flash: { a: 0, color: '#fff' },
    vw: 320, vh: 200, scale: 3, buf: null, bctx: null, canvas: null, ctx: null, cutscene: 0, paused: false
  };

  /* ---------------- canvas sizing (integer pixel scaling) ---------------- */
  W.init = function () {
    W.canvas = document.getElementById('game'); W.ctx = W.canvas.getContext('2d');
    W.buf = document.createElement('canvas'); W.bctx = W.buf.getContext('2d');
    W.dark = document.createElement('canvas'); W.dctx = W.dark.getContext('2d');
    window.addEventListener('resize', W.resize); window.addEventListener('orientationchange', function () { setTimeout(W.resize, 250); });
    W.resize();
  };
  W.resize = function () {
    var dpr = Math.min(window.devicePixelRatio || 1, 3), w = window.innerWidth, h = window.innerHeight;
    W.canvas.width = Math.floor(w * dpr); W.canvas.height = Math.floor(h * dpr);
    W.canvas.style.width = w + 'px'; W.canvas.style.height = h + 'px';
    var target = Math.min(w, h) === h ? 208 : 300; /* landscape: ~13 tiles tall. portrait: a little more room */
    var s = Math.max(1, Math.floor(W.canvas.height / target)); if (W.canvas.height / s > 290) s++;
    W.scale = s; W.vw = Math.ceil(W.canvas.width / s); W.vh = Math.ceil(W.canvas.height / s);
    W.buf.width = W.vw; W.buf.height = W.vh; W.dark.width = W.vw; W.dark.height = W.vh;
    W.bctx.imageSmoothingEnabled = false; W.ctx.imageSmoothingEnabled = false;
  };

  /* ---------------- tiles ---------------- */
  W.tileAt = function (tx, ty) { if (!W.tiles || ty < 0 || tx < 0 || ty >= W.tiles.length || tx >= W.tiles[0].length) return ' '; return W.tiles[ty][tx]; };
  W.tileDef = function (ch) { return SB.D.tiles[ch] || SB.D.tiles['.'] || {}; };
  W.overrides = {}; /* tileswap results, key "x,y" -> char (recomputed every frame) */
  W.effTile = function (tx, ty) { var o = W.overrides[tx + ',' + ty]; return o !== undefined ? o : W.tileAt(tx, ty); };
  W.setTile = function (tx, ty, ch, persist) {
    if (!W.tiles[ty]) return; W.tiles[ty][tx] = ch;
    if (persist) { var G = SB.G, m = G.tileMods[W.mapId] = G.tileMods[W.mapId] || {}; m[ty * W.map.w + tx] = ch; }
  };
  W.tileSolid = function (tx, ty, fly) {
    var ch = W.effTile(tx, ty); if (ch === ' ' && (tx < 0 || ty < 0 || tx >= W.map.w || ty >= W.map.h)) return true;
    var d = W.tileDef(ch); if (!d.solid) return false;
    if (fly && (d.kind === 'water' || d.kind === 'lava')) return false;
    return true;
  };

  /* ---------------- map loading ---------------- */
  W.load = function (mapId, tx, ty, dir) {
    var D = SB.D, m = D.maps[mapId]; if (!m) { console.warn('no map', mapId); return; }
    W.map = m; W.mapId = mapId; W.fx = []; W.overrides = {};
    W.tiles = m.tiles.map(function (r) { return r.split(''); });
    var mods = SB.G.tileMods[mapId]; if (mods) Object.keys(mods).forEach(function (i) { var x = i % m.w, y = Math.floor(i / m.w); if (W.tiles[y]) W.tiles[y][x] = mods[i]; });
    W.ents = [];
    m.ents.forEach(function (d) { var e = SB.Actors.make(d); if (e) W.ents.push(e); });
    SB.Party.place(tx * T + 8, ty * T + 12, dir || 'down');
    W.snapCam = true; W.updateCam(1);
    W.applyMusic();
    SB.G.map = mapId;
  };
  W.applyMusic = function () {
    if (W.musicLock) return; var m = W.map, id = m.music;
    (m.musicIf || []).forEach(function (p) { if (SB.cond(p[0], SB.ctx)) id = p[1]; });
    SB.audio.music(id || 'none');
  };
  W.fogOn = function () { var m = W.map; return !!(m && (m.fog || (m.fogIf && SB.cond(m.fogIf, SB.ctx)))); };

  /* ---------------- collision ---------------- */
  /* box = feet rectangle centred at (x, y-h/2) */
  W.boxFree = function (x, y, w, h, self, fly) {
    var x0 = x - w / 2, y0 = y - h, x1 = x + w / 2 - .01, y1 = y - .01;
    var tx0 = Math.floor(x0 / T), tx1 = Math.floor(x1 / T), ty0 = Math.floor(y0 / T), ty1 = Math.floor(y1 / T);
    for (var ty = ty0; ty <= ty1; ty++) for (var tx = tx0; tx <= tx1; tx++) if (W.tileSolid(tx, ty, fly)) return false;
    for (var i = 0; i < W.ents.length; i++) {
      var e = W.ents[i]; if (e === self || !e.solid || !e.visible || e.dead) continue;
      var b = e.solidBox ? e.solidBox() : { x: e.x - 8, y: e.y - 16, w: 16, h: 16 };
      if (x1 > b.x && x0 < b.x + b.w && y1 > b.y && y0 < b.y + b.h) return false;
    }
    return true;
  };
  /* move with sliding + corner nudging; returns true if fully moved */
  W.move = function (e, dx, dy, w, h, fly) {
    var moved = true;
    if (dx) {
      if (W.boxFree(e.x + dx, e.y, w, h, e, fly)) e.x += dx;
      else { moved = false; if (!dy) { for (var n = 1; n <= 5; n++) { if (W.boxFree(e.x + dx, e.y - n, w, h, e, fly)) { e.y -= Math.min(1, n); break; } if (W.boxFree(e.x + dx, e.y + n, w, h, e, fly)) { e.y += Math.min(1, n); break; } } } }
    }
    if (dy) {
      if (W.boxFree(e.x, e.y + dy, w, h, e, fly)) e.y += dy;
      else { moved = false; if (!dx) { for (var k = 1; k <= 5; k++) { if (W.boxFree(e.x - k, e.y + dy, w, h, e, fly)) { e.x -= Math.min(1, k); break; } if (W.boxFree(e.x + k, e.y + dy, w, h, e, fly)) { e.x += Math.min(1, k); break; } } } }
    }
    return moved;
  };
  W.findEnt = function (id) { for (var i = 0; i < W.ents.length; i++) if (W.ents[i].def && W.ents[i].def.id === id) return W.ents[i]; return null; };

  /* ---------------- camera ---------------- */
  W.updateCam = function (dt) {
    var L = SB.Party.leader(); if (!L) return; var m = W.map;
    var tx = (W.camTarget ? W.camTarget.x : L.x) - W.vw / 2, ty = (W.camTarget ? W.camTarget.y : L.y - 8) - W.vh / 2;
    var mw = m.w * T, mh = m.h * T;
    tx = mw <= W.vw ? (mw - W.vw) / 2 : SB.clamp(tx, 0, mw - W.vw);
    ty = mh <= W.vh - 20 ? (mh - W.vh) / 2 - 10 : SB.clamp(ty, -14, mh - W.vh);
    if (W.snapCam) { W.cam.x = tx; W.cam.y = ty; W.snapCam = false; }
    else { var k = Math.min(1, dt * 7); W.cam.x += (tx - W.cam.x) * k; W.cam.y += (ty - W.cam.y) * k; }
  };

  /* ---------------- rendering ---------------- */
  W.render = function () {
    var c = W.bctx, gfx = SB.gfx, m = W.map; if (!m) return;
    var sx = 0, sy = 0; if (W.shake > 0) { sx = (Math.random() - .5) * W.shake * 6; sy = (Math.random() - .5) * W.shake * 6; }
    var cx = Math.round(W.cam.x + sx), cy = Math.round(W.cam.y + sy);
    c.fillStyle = m.interior || m.dark ? '#000' : '#0b0a12'; c.fillRect(0, 0, W.vw, W.vh);
    c.save(); c.translate(-cx, -cy);
    var tx0 = Math.max(0, Math.floor(cx / T)), ty0 = Math.max(0, Math.floor(cy / T)), tx1 = Math.min(m.w - 1, Math.floor((cx + W.vw) / T)), ty1 = Math.min(m.h - 1, Math.floor((cy + W.vh) / T));
    var af = Math.floor(W.time * 2.5);
    for (var ty = ty0; ty <= ty1; ty++) for (var tx = tx0; tx <= tx1; tx++) {
      var d = W.tileDef(W.effTile(tx, ty)); if (!d.sprite) continue;
      var fr = gfx.frame(d.sprite, af); if (fr) c.drawImage(fr, tx * T, ty * T);
    }
    /* entities sorted by y */
    var list = W.ents.filter(function (e) { return e.visible && e.draw; }).concat(SB.Party.members.filter(function (h) { return h.visible !== false; }));
    list.sort(function (a, b) { return (a.flat ? -1e6 : 0) + a.y - ((b.flat ? -1e6 : 0) + b.y); });
    list.forEach(function (e) { e.draw(c); });
    W.fx.forEach(function (f) { if (f.draw) f.draw(c); });
    c.restore();
    /* fog overlay */
    if (W.fogOn()) {
      c.globalAlpha = .16;
      for (var i = 0; i < 9; i++) { var px = ((i * 97 + W.time * (8 + i % 3 * 4)) % (W.vw + 80)) - 40, py = (i * 53 + Math.sin(W.time * .3 + i) * 20) % W.vh; var fr2 = gfx.frame('fogpuff', i % 2); if (fr2) c.drawImage(fr2, px, py, 64, 64); }
      c.globalAlpha = 1; c.fillStyle = 'rgba(190,190,215,.10)'; c.fillRect(0, 0, W.vw, W.vh);
    }
    if (m.dark) W.renderDark(cx, cy);
    if (W.tint) { c.globalAlpha = W.tint.a; c.fillStyle = W.tint.color; c.fillRect(0, 0, W.vw, W.vh); c.globalAlpha = 1; }
    if (W.flash.a > 0) { c.globalAlpha = W.flash.a; c.fillStyle = W.flash.color; c.fillRect(0, 0, W.vw, W.vh); c.globalAlpha = 1; }
    if (W.fade.a > 0) { c.globalAlpha = W.fade.a; c.fillStyle = W.fade.color; c.fillRect(0, 0, W.vw, W.vh); c.globalAlpha = 1; }
    /* upscale */
    W.ctx.imageSmoothingEnabled = false;
    W.ctx.drawImage(W.buf, 0, 0, W.vw * W.scale, W.vh * W.scale);
  };
  W.lights = function () {
    var out = [];
    SB.Party.members.forEach(function (h) { out.push([h.x, h.y - 8, h.id === 'mira' ? 78 : 30]); });
    W.ents.forEach(function (e) { if (e.visible && e.light) out.push([e.x, e.y - 8, e.light]); });
    W.fx.forEach(function (f) { if (f.light) out.push([f.x, f.y, f.light]); });
    return out;
  };
  W.renderDark = function (cx, cy) {
    var d = W.dctx; d.globalCompositeOperation = 'source-over'; d.fillStyle = 'rgba(4,3,10,.94)'; d.fillRect(0, 0, W.vw, W.vh);
    d.globalCompositeOperation = 'destination-out';
    W.lights().forEach(function (l) {
      var x = l[0] - cx, y = l[1] - cy, r = l[2] * (1 + Math.sin(W.time * 6 + x) * .02);
      var g = d.createRadialGradient(x, y, r * .2, x, y, r); g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(.7, 'rgba(0,0,0,.75)'); g.addColorStop(1, 'rgba(0,0,0,0)');
      d.fillStyle = g; d.beginPath(); d.arc(x, y, r, 0, 6.3); d.fill();
    });
    d.globalCompositeOperation = 'source-over';
    W.bctx.drawImage(W.dark, 0, 0);
  };
  W.toScreen = function (x, y) { return [(x - W.cam.x) * W.scale / (window.devicePixelRatio > 3 ? 3 : (window.devicePixelRatio || 1)), (y - W.cam.y) * W.scale / (window.devicePixelRatio > 3 ? 3 : (window.devicePixelRatio || 1))]; };

  /* ---------------- tweens for screen effects ---------------- */
  W.tween = function (obj, key, to, ms) {
    var from = obj[key], t0 = performance.now();
    return new Promise(function (res) { (function step() { var t = Math.min(1, (performance.now() - t0) / Math.max(1, ms)); obj[key] = from + (to - from) * t; if (t < 1) requestAnimationFrame(step); else res(); })(); });
  };
  W.doFade = function (to, color, ms) { if (color) W.fade.color = color; return W.tween(W.fade, 'a', to === 'out' ? 1 : 0, ms == null ? 500 : ms); };
  W.doFlash = function (color, ms) { W.flash.color = color || '#fff'; W.flash.a = 1; return W.tween(W.flash, 'a', 0, ms || 500); };
})();
