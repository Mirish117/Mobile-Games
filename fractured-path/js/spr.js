/* spr.js - the character art. Every character in the game is one of the six reference archetypes
   (Knight, Healer, Mage, Ranger, Rogue, Berserker) in one of three tiers (basic, mid, ultimate),
   drawn straight from the supplied sprite sheets (img/chars/*.png). NPCs and the villain classes
   are recolored copies. */
(function (FP) {
  'use strict';
  var art = FP.art, D = FP.D;
  var DATA = FP.SPRDATA, files = DATA.files, heads = DATA.heads;
  var S = FP.spr = { imgs: {}, ready: false };

  /* ---------- loading ---------- */
  S.load = function () {
    return new Promise(function (res) {
      var keys = Object.keys(files), left = keys.length + 1;
      FP.mapImgs = FP.mapImgs || {};
      var tm = new Image(); tm.onload = function () { FP.mapImgs.thistledown = tm; done(); }; tm.onerror = done; tm.src = 'img/town/thistledown.webp';
      function done() { if (--left <= 0) { S.ready = true; res(); } }
      keys.forEach(function (k) {
        var im = new Image();
        im.onload = function () { S.imgs[k] = im; done(); };
        im.onerror = function () { done(); };
        im.src = (FP.SPR_BASE || 'img/chars/') + k + '.png';
      });
    });
  };

  /* ---------- tint: [hueDegrees, saturationMul, lightnessMul] baked once per sprite ---------- */
  var tintCache = {};
  function rgb2hsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    var mx = Math.max(r, g, b), mn = Math.min(r, g, b), h = 0, s = 0, l = (mx + mn) / 2;
    if (mx !== mn) {
      var d = mx - mn; s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
      h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; h /= 6;
    }
    return [h, s, l];
  }
  function hue2(p, q, t) { if (t < 0) t += 1; if (t > 1) t -= 1; if (t < 1 / 6) return p + (q - p) * 6 * t; if (t < 1 / 2) return q; if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6; return p; }
  function hsl2rgb(h, s, l) {
    if (s === 0) return [l * 255, l * 255, l * 255];
    var q = l < 0.5 ? l * (1 + s) : l + s - l * s, p = 2 * l - q;
    return [hue2(p, q, h + 1 / 3) * 255, hue2(p, q, h) * 255, hue2(p, q, h - 1 / 3) * 255];
  }
  /* which hues count as 'the garment' for each archetype */
  var RANGE = { knight: [190, 262], healer: [110, 205], mage: [225, 312], ranger: [70, 172], rogue: [328, 18], berserker: [0, 40] };
  function inRange(h, r) { return r[0] <= r[1] ? (h >= r[0] && h <= r[1]) : (h >= r[0] || h <= r[1]); }
  function tinted(key, tint) {
    var im = S.imgs[key]; if (!im) return null;
    if (!tint || (!tint[0] && tint[1] === 1 && tint[2] === 1)) return im;
    var rng = RANGE[key.split('_')[1]] || [0, 360];
    var ck = key + tint.join(','); if (tintCache[ck]) return tintCache[ck];
    var c = document.createElement('canvas'); c.width = im.width; c.height = im.height;
    var x = c.getContext('2d'); x.drawImage(im, 0, 0);
    try {
      var d = x.getImageData(0, 0, c.width, c.height), a = d.data, i, hs, rgb, dh = (tint[0] || 0) / 360;
      for (i = 0; i < a.length; i += 4) {
        if (a[i + 3] === 0) continue;
        hs = rgb2hsl(a[i], a[i + 1], a[i + 2]);
        if (dh && hs[1] > 0.12 && inRange(hs[0] * 360, rng)) hs[0] = (hs[0] + dh + 1) % 1; /* only the garment colors turn; skin and hair stay */
        hs[1] = Math.min(1, hs[1] * tint[1]); hs[2] = Math.min(1, hs[2] * tint[2]);
        rgb = hsl2rgb(hs[0], hs[1], hs[2]); a[i] = rgb[0]; a[i + 1] = rgb[1]; a[i + 2] = rgb[2];
      }
      x.putImageData(d, 0, 0);
    } catch (e) { tintCache[ck] = im; return im; }
    tintCache[ck] = c; return c;
  }
  S.tinted = tinted;

  /* ---------- looks ---------- */
  var BASE = {
    vanguard: ['knight'], spellwright: ['mage'], wayfinder: ['ranger'], lampbearer: ['healer'], duelist: ['rogue'], bellringer: ['healer', [62, 1, 1.05]],
    reaver: ['berserker'], hexcaster: ['mage', [58, 1.1, 0.8]], shade: ['rogue', [165, 0.9, 0.85]], cinderbinder: ['ranger', [-80, 1.1, 0.95]],
    blightknight: ['knight', [72, 0.7, 0.65]], bonewright: ['healer', [0, 0.2, 0.85]]
  };
  function tierOf(cls) { var c = D && D.CLASSES && D.CLASSES[cls]; return c && c.ult ? 'ult' : c && c.asc ? 'mid' : 'basic'; }
  function look(arch, tier, tint, sc) { return { spr: arch, tier: tier, tint: tint || null, sc: sc || 1 }; }
  S.look = look;
  art.lookFor = function (cls) {
    var base = D.baseOf ? D.baseOf(cls) : cls, b = BASE[base] || BASE.vanguard;
    return look(b[0], tierOf(cls), b[1] || null, 1);
  };

  /* NPC kinds and named characters: [archetype, tier, tint, scale] */
  var NPCM = {
    villager: ['knight', 'basic', [-150, 0.7, 1], 0.9], villagerB: ['ranger', 'basic', [105, 0.9, 1], 0.9], villagerC: ['healer', 'basic', [150, 1, 1], 0.9],
    child: ['ranger', 'basic', [-55, 1, 1.05], 0.68], elder: ['mage', 'basic', [0, 0.25, 1.15], 0.92], merchant: ['rogue', 'basic', [-35, 1.3, 1.3], 0.92],
    guard: ['knight', 'mid', null, 0.95], royalguard: ['knight', 'mid', [135, 1, 0.95], 1], smith: ['berserker', 'basic', [0, 0.7, 0.9], 1], innkeeper: ['healer', 'basic', [165, 1.1, 1], 0.92],
    sage: ['mage', 'mid', [-85, 1, 1], 0.95], fisher: ['ranger', 'basic', [95, 0.8, 1], 0.9], sailor: ['knight', 'basic', [-25, 0.4, 1.1], 0.92],
    noble: ['mage', 'mid', [62, 1, 1.05], 0.95], king: ['knight', 'mid', [135, 1, 0.95], 1.05], ashen: ['berserker', 'basic', [-8, 0.4, 0.75], 1], raider: ['rogue', 'basic', [-35, 1.1, 0.9], 0.95],
    warden: ['healer', 'mid', [75, 1, 1], 0.95], ghost: ['healer', 'mid', [60, 0.15, 1.35], 0.95]
  };
  var CASTM = {
    tam: ['mage', 'basic', [-50, 1, 1], 0.95], odalys: ['healer', 'mid', [75, 1, 1], 1], corvin: ['rogue', 'mid', [18, 1.2, 1], 1], sable: ['mage', 'mid', [38, 0.9, 0.75], 1],
    berenhart: ['knight', 'mid', [135, 1, 0.95], 1.05], iola: ['ranger', 'mid', [105, 1, 1], 1], vane: ['berserker', 'mid', [-12, 0.9, 0.95], 1.05], harbor: ['knight', 'basic', [-25, 0.4, 1.1], 0.95],
    seren: ['mage', 'mid', [0, 0.25, 1.15], 0.97], nyx: ['healer', 'mid', [60, 0.15, 1.35], 0.97], wren: ['healer', 'basic', [150, 1, 1.05], 0.88], pell: ['ranger', 'basic', [-55, 1, 1.05], 0.68]
  };
  function fromRow(r) { return look(r[0], r[1], r[2], r[3]); }
  art.npcLook = function (kind) { return fromRow(NPCM[kind] || NPCM.villager); };
  Object.keys(art.CAST).forEach(function (k) { if (CASTM[k]) art.CAST[k].look = fromRow(CASTM[k]); });
  Object.keys(art.NPC).forEach(function (k) { art.NPC[k] = art.NPC[k]; });

  /* ---------- drawing ---------- */
  function keyOf(L) { return (L.tier || 'basic') + '_' + (L.spr || 'knight'); }
  function srcOf(L) { return tinted(keyOf(L), L.tint); }
  function sizeOf(L) { var f = files[keyOf(L)]; return f || [200, 280, 100]; }
  /* logical px per source px: the field figure is about 28 px tall (1.75 tiles) at scale 1 */
  var FIELD_K = 0.105;
  var SNAP = function (v) { return Math.round(v * FP.SS) / FP.SS; };

  var fieldCache = {};
  function fieldCanvas(L) {
    var key = JSON.stringify(L), c = fieldCache[key]; if (c) return c;
    var im = srcOf(L); if (!im) return null;
    var sz = sizeOf(L), k = FIELD_K * (L.sc || 1), w = Math.ceil(sz[0] * k) + 1, h = Math.ceil(sz[1] * k) + 1;
    c = art.hdCanvas(w, h); var x = c.getContext('2d'); x.imageSmoothingEnabled = true; x.imageSmoothingQuality = 'high';
    /* two-step reduction keeps the pixel art from shimmering */
    var mid = document.createElement('canvas'), mw = Math.round(sz[0] * k * FP.SS * 1.6), mh = Math.round(sz[1] * k * FP.SS * 1.6);
    mid.width = mw; mid.height = mh; var mx = mid.getContext('2d'); mx.imageSmoothingEnabled = true; mx.imageSmoothingQuality = 'high'; mx.drawImage(im, 0, 0, mw, mh);
    x.drawImage(mid, 0, 0, sz[0] * k, sz[1] * k);
    c.fw = sz[0] * k; c.fh = sz[1] * k; c.ffx = sz[2] * k;
    fieldCache[key] = c; return c;
  }
  art.drawChar = function (g, L, dir, f, px, py) {
    var c = fieldCanvas(L); if (!c) return;
    var w = c.fw, h = c.fh, fx = c.ffx, hop = (f & 1) ? -1 : 0, flip = (dir === 'r' || dir === 'u');
    var feetX = px + 8, feetY = py + 15 + hop, y = SNAP(feetY - h);
    if (flip) { g.save(); g.translate(SNAP(feetX), 0); g.scale(-1, 1); g.drawImage(c, SNAP(-fx), y); g.restore(); }
    else g.drawImage(c, SNAP(feetX - fx), y);
  };

  var bigCache = {};
  /* a larger figure for menus and battles: canvas is as tall as 22 x scale logical px, feet at the bottom */
  art.charBig = function (L, facing, scale) {
    scale = scale || 2;
    var key = JSON.stringify(L) + facing + scale, c = bigCache[key]; if (c) return c;
    var im = srcOf(L), sz = sizeOf(L), h = 22 * scale * (L.sc || 1), w = sz[0] * h / sz[1];
    c = art.hdCanvas(Math.ceil(w), Math.ceil(h)); var x = c.getContext('2d');
    if (!im) return c;
    x.imageSmoothingEnabled = true; x.imageSmoothingQuality = 'high';
    if (facing === 'r') { x.translate(Math.ceil(w), 0); x.scale(-1, 1); }
    x.drawImage(im, 0, 0, w, h);
    bigCache[key] = c;
    return c;
  };
  art.charFront = function (L, scale) { return art.charBig(L, 'l', scale); };
  art.charFrame = function (L, d) { return art.charBig(L, d === 'r' ? 'r' : 'l', 1); };

  /* ---------- portraits: the face from the sprite, framed on a painted backdrop ---------- */
  var pCache = {};
  art.portrait = function (spec) {
    var L = spec.look || look('knight', 'basic'), key = JSON.stringify([L, spec.mood, spec.bg]), c = pCache[key]; if (c) return c;
    c = art.hdCanvas(48, 48); var g = c.getContext('2d');
    var bg = spec.bg || ['#2a2f5a', '#5a3a7a'];
    var gr = g.createLinearGradient(0, 0, 0, 48); gr.addColorStop(0, bg[0]); gr.addColorStop(1, bg[1]); g.fillStyle = gr; g.fillRect(0, 0, 48, 48);
    var rg = g.createRadialGradient(24, 22, 2, 24, 22, 30); rg.addColorStop(0, 'rgba(255,240,210,0.30)'); rg.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = rg; g.fillRect(0, 0, 48, 48);
    var im = srcOf(L), hb = heads[keyOf(L)];
    if (!im) return c;
    g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high';
    g.drawImage(im, hb[0], hb[1], hb[2], hb[2], 0, 0, 48, 48);
    var m = spec.mood;
    if (m === 'cold') { g.fillStyle = 'rgba(40,60,120,0.18)'; g.fillRect(0, 0, 48, 48); }
    else if (m === 'sad') { g.fillStyle = 'rgba(60,60,90,0.16)'; g.fillRect(0, 0, 48, 48); }
    var vg = g.createRadialGradient(24, 24, 18, 24, 24, 36); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,20,0.35)'); g.fillStyle = vg; g.fillRect(0, 0, 48, 48);
    pCache[key] = c; return c;
  };
})(window.FP);
