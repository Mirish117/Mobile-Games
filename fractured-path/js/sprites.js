/* The Fractured Path: characters, portraits and creatures.
   Everything is described as shape lists and drawn in code with an automatic pixel outline. */
(function (FP) {
  'use strict';
  var art = FP.art, OUT = art.OUT;

  /* ---------- character bodies ---------- */
  var SKIN = ['#f6d3b0', '#e4b088', '#c58a60', '#8a5a3c'];
  var HAIRC = ['#2a1d1a', '#6b4328', '#c9953a', '#d8d4e0', '#b8452e', '#3a5a9a'];
  art.SKIN = SKIN; art.HAIR = HAIRC;
  var ACCENTS = ['#f2c14e', '#e0504a', '#4aa0e8', '#7ad66e'];
  art.ACCENTS = ACCENTS;

  function legs(L, dir, f, P) {
    var pants = L.pants || '#4a3a52', boots = L.boots || '#2a2230';
    if (L.robe) return;
    if (dir === 'l') {
      var a = f === 1 ? 4 : f === 3 ? 8 : 6, b = f === 1 ? 8 : f === 3 ? 4 : 7;
      P.push(['r', b, 12, 3, 4, pants], ['kr', b, 15, 3, 1, boots]);
      P.push(['r', a, 12, 3, f === 0 || f === 2 ? 4 : 3, pants], ['kr', a, f === 0 || f === 2 ? 15 : 14, 3, 1, boots]);
    } else {
      var lh = f === 1 ? 3 : 4, rh = f === 3 ? 3 : 4;
      P.push(['r', 5, 12, 3, lh, pants], ['kr', 5, 11 + lh, 3, 1, boots]);
      P.push(['r', 8, 12, 3, rh, pants], ['kr', 8, 11 + rh, 3, 1, boots]);
    }
  }
  function hairParts(L, dir, P, front) {
    var h = L.hair, hs = L.hs | 0;
    if (L.hat === 'hood' || L.hat === 'helm' || L.hat === 'horns' || L.hat === 'pointed' && false) return;
    if (dir === 'd') {
      P.push(['r', 3, 0, 10, 3, h]);
      P.push(['r', 3, 2, 2, 4, h], ['r', 11, 2, 2, 4, h]);
      P.push(['kr', 5, 3, 3, 1, h], ['kr', 9, 3, 2, 1, h]);
      if (hs === 1) { P.push(['r', 3, 4, 2, 7, h], ['r', 11, 4, 2, 7, h]); }
      if (hs === 2) { P.push(['t', 3, 1, 4, -3, 6, 1, h], ['t', 6, 1, 8, -4, 10, 1, h], ['t', 9, 1, 12, -3, 13, 1, h]); }
      if (hs === 3) { P.push(['e', 8, -1, 3, 2, h]); }
    } else if (dir === 'u') {
      P.push(['r', 3, 0, 10, 8, h]);
      if (hs === 1) { P.push(['r', 3, 6, 10, 5, h]); }
      if (hs === 2) { P.push(['t', 3, 1, 4, -3, 6, 1, h], ['t', 6, 1, 8, -4, 10, 1, h], ['t', 9, 1, 12, -3, 13, 1, h]); }
      if (hs === 3) { P.push(['e', 8, -1, 3, 2, h], ['r', 7, 7, 2, 5, h]); }
    } else {
      P.push(['r', 4, 0, 9, 3, h], ['r', 9, 2, 4, 5, h]);
      P.push(['kr', 5, 3, 2, 1, h]);
      if (hs === 1) { P.push(['r', 9, 6, 4, 6, h]); }
      if (hs === 2) { P.push(['t', 5, 1, 7, -4, 9, 1, h], ['t', 8, 1, 11, -3, 12, 1, h]); }
      if (hs === 3) { P.push(['e', 11, 0, 2, 2, h], ['r', 11, 6, 2, 4, h]); }
    }
  }
  function hatParts(L, dir, P) {
    var c = L.hatc || '#4a3380', t = L.trim || '#f2c14e', hat = L.hat;
    if (!hat) return;
    if (hat === 'hood') {
      if (dir === 'd') { P.push(['r', 3, -1, 10, 4, c], ['r', 3, 2, 2, 7, c], ['r', 11, 2, 2, 7, c], ['kr', 5, 3, 6, 1, 'rgba(0,0,0,0.35)']); }
      else if (dir === 'u') { P.push(['r', 3, -1, 10, 11, c]); }
      else { P.push(['r', 4, -1, 9, 4, c], ['r', 9, 2, 4, 8, c], ['r', 4, 2, 2, 2, c], ['kr', 5, 3, 2, 1, 'rgba(0,0,0,0.35)']); }
    } else if (hat === 'pointed') {
      P.push(['r', 2, 1, 12, 2, c]);
      if (dir === 'l') P.push(['t', 11, 1, 5, 1, 15, -9, c]); else P.push(['t', 4, 1, 12, 1, 9, -9, c]);
      P.push(['kr', 4, 0, 8, 1, t]);
    } else if (hat === 'cap') {
      if (dir === 'd') { P.push(['r', 3, -1, 10, 4, c], ['r', 3, 3, 10, 1, c], ['kt', 11, -1, 14, -4, 13, 1, '#e8503a']); }
      else if (dir === 'u') { P.push(['r', 3, -1, 10, 6, c], ['kt', 11, -1, 14, -4, 13, 1, '#e8503a']); }
      else { P.push(['r', 4, -1, 9, 4, c], ['r', 2, 3, 5, 1, c], ['kt', 11, -1, 15, -3, 13, 1, '#e8503a']); }
    } else if (hat === 'helm' || hat === 'horns') {
      var st = L.hatc || '#9aa4bc';
      if (dir === 'd') { P.push(['r', 3, -1, 10, 5, st], ['r', 3, 4, 2, 4, st], ['r', 11, 4, 2, 4, st], ['kr', 7, 3, 2, 4, st], ['kr', 5, 4, 2, 1, '#14101f'], ['kr', 9, 4, 2, 1, '#14101f']); }
      else if (dir === 'u') { P.push(['r', 3, -1, 10, 9, st]); }
      else { P.push(['r', 4, -1, 9, 5, st], ['r', 9, 4, 4, 4, st], ['kr', 4, 3, 3, 1, '#14101f']); }
      if (hat === 'horns') {
        if (dir === 'l') P.push(['t', 5, 0, 2, -5, 8, -1, '#ece4d0'], ['t', 10, 0, 12, -5, 12, -1, '#ece4d0']);
        else P.push(['t', 3, 1, 0, -5, 5, -1, '#ece4d0'], ['t', 13, 1, 16, -5, 11, -1, '#ece4d0']);
      }
    } else if (hat === 'crown') {
      P.push(['r', 4, -1, 8, 2, '#f2c14e'], ['t', 4, -1, 4, -3, 6, -1, '#f2c14e'], ['t', 7, -1, 8, -4, 9, -1, '#f2c14e'], ['t', 10, -1, 12, -3, 12, -1, '#f2c14e'], ['kp', 8, 0, '#e8503a']);
    } else if (hat === 'bandana') {
      P.push(['r', 3, 1, 10, 2, c]);
      if (dir === 'l') P.push(['r', 12, 2, 3, 2, c]); else P.push(['kt', 12, 2, 15, 4, 12, 4, c]);
    } else if (hat === 'straw') {
      P.push(['e', 8, 1, 8, 2, '#e8d080'], ['kr', 4, -1, 8, 2, '#d8bc60']);
    } else if (hat === 'cowl') {
      if (dir === 'd') { P.push(['r', 3, -1, 10, 4, c], ['r', 3, 3, 2, 5, c], ['r', 11, 3, 2, 5, c], ['r', 4, 6, 8, 3, c]); }
      else if (dir === 'u') { P.push(['r', 3, -1, 10, 10, c]); }
      else { P.push(['r', 4, -1, 9, 4, c], ['r', 9, 3, 4, 6, c], ['r', 4, 6, 6, 3, c]); }
    } else if (hat === 'circlet') {
      P.push(['kr', 4, 1, 8, 1, '#f2c14e'], ['kp', 8, 1, '#7af0ff']);
    } else if (hat === 'embhorns') {
      if (dir === 'l') P.push(['t', 6, 0, 4, -4, 8, -1, c], ['t', 9, 0, 10, -4, 11, -1, c]);
      else P.push(['t', 4, 1, 2, -4, 6, 0, c], ['t', 12, 1, 14, -4, 10, 0, c]);
    }
  }
  function faceParts(L, dir, P) {
    var eye = L.eye || '#1b1626';
    if (L.glow) eye = L.glow;
    var masked = L.hat === 'cowl';
    if (dir === 'd') {
      P.push(['kE', 6, 5, eye], ['kE', 9, 5, eye]);
      if (L.glow) { P.push(['kp', 5, 5, 'rgba(255,100,220,0.5)'], ['kp', 10, 5, 'rgba(255,100,220,0.5)']); }
      if (!masked) P.push(['kr', 7, 7, 2, 1, 'rgba(120,50,40,0.45)']);
      if (L.scar) P.push(['kl', 5, 3, 7, 7, '#a03a3a']);
      if (L.beard) P.push(['kr', 4, 6, 8, 3, L.beard], ['kr', 6, 5, 4, 1, L.beard]);
    } else if (dir === 'l') {
      P.push(['kE', 5, 5, eye]);
      if (!masked) P.push(['kp', 4, 7, 'rgba(120,50,40,0.45)']);
      if (L.scar) P.push(['kl', 5, 3, 6, 7, '#a03a3a']);
      if (L.beard) P.push(['kr', 4, 6, 5, 3, L.beard]);
    }
  }
  function holdParts(L, dir, P, f) {
    var hd = L.hold; if (!hd) return;
    var sx = dir === 'l' ? 1 : 13, sy = (f === 1 || f === 3) ? 0 : 0;
    var wood = '#8a5a38';
    if (hd === 'staff') { P.push(['r', sx + 1, 3, 1, 13, wood], ['e', sx + 1, 2, 2, 2, L.orb || '#7af0ff'], ['kp', sx + 1, 1, '#ffffff']); }
    else if (hd === 'sword') { P.push(['r', sx + 1, 3, 1, 9, '#e0e6f2'], ['r', sx, 11, 3, 1, L.trim || '#f2c14e'], ['r', sx + 1, 12, 1, 3, wood]); }
    else if (hd === 'lantern') { P.push(['r', sx, 10, 4, 5, '#2a2a38'], ['kr', sx + 1, 11, 2, 3, '#ffe27a'], ['kr', sx + 1, 9, 2, 1, '#2a2a38'], ['r', sx + 1, 3, 1, 7, wood]); }
    else if (hd === 'bow') { P.push(['kl', sx + 1, 3, sx + 3, 8, '#c8a060'], ['kl', sx + 3, 8, sx + 1, 14, '#c8a060'], ['kl', sx + 1, 3, sx + 1, 14, '#f0f0f0']); }
    else if (hd === 'hammer') { P.push(['r', sx + 1, 7, 1, 8, wood], ['r', sx - 1, 4, 5, 4, '#6a6a7a'], ['kr', sx - 1, 4, 5, 1, '#9a9aaa']); }
    else if (hd === 'axe') { P.push(['r', sx + 1, 3, 1, 12, wood], ['t', sx + 1, 3, sx + 5, 4, sx + 1, 8, '#c8ccd8'], ['t', sx + 1, 3, sx - 3, 4, sx + 1, 8, '#c8ccd8']); }
    else if (hd === 'dagger') { P.push(['r', sx + 1, 9, 1, 4, '#d8dde8'], ['r', sx, 13, 3, 1, '#4a4a58']); }
    else if (hd === 'book') { P.push(['r', sx - 1, 9, 5, 5, L.orb || '#8a5ab0'], ['kr', sx, 10, 3, 3, '#f2c14e']); }
    else if (hd === 'broom') { P.push(['r', sx + 1, 2, 1, 12, wood], ['t', sx - 1, 15, sx + 3, 15, sx + 1, 11, '#d8bc60']); }
    else if (hd === 'spear') { P.push(['r', sx + 1, 1, 1, 14, wood], ['t', sx + 1, -2, sx - 1, 3, sx + 3, 3, '#e0e6f2']); }
  }
  function charParts(L, dir, f) {
    var P = [], main = L.main || '#4a78c0', trim = L.trim || '#f2c14e', skin = L.skin || SKIN[0];
    var side = dir === 'l';
    if (L.cape && dir === 'u') P.push(['r', 3, 7, 10, 9, L.cape]);
    legs(L, dir, f, P);
    if (L.cape && side) P.push(['r', 10, 7, 3, 8, L.cape]);
    if (L.cape && dir === 'd') P.push(['r', 2, 8, 2, 6, L.cape], ['r', 12, 8, 2, 6, L.cape]);
    if (side) {
      P.push(['r', 5, 7, 6, L.robe ? 8 : 6, main]);
      if (L.robe) P.push(['r', 4, 13, 8, 2, main], ['kr', 4, 14, 8, 1, trim]);
      P.push(['kr', 5, 11, 6, 1, trim]);
      var sw = (f === 1) ? 1 : (f === 3) ? -1 : 0;
      P.push(['r', 6 + sw, 8, 3, 4, main], ['kp', 6 + sw, 12, skin], ['kp', 7 + sw, 12, skin]);
    } else {
      P.push(['r', 4, 7, 8, L.robe ? 8 : 6, main]);
      if (L.robe) P.push(['r', 3, 13, 10, 2, main], ['kr', 3, 14, 10, 1, trim]);
      P.push(['kr', 4, 11, 8, 1, trim]);
      var bobL = f === 1 ? 1 : 0, bobR = f === 3 ? 1 : 0;
      P.push(['r', 2, 8 + bobR, 2, 4, main], ['r', 12, 8 + bobL, 2, 4, main]);
      P.push(['kp', 2, 12 + bobR, skin], ['kp', 3, 12 + bobR, skin], ['kp', 12, 12 + bobL, skin], ['kp', 13, 12 + bobL, skin]);
      if (L.robe && L.sash) P.push(['kr', 7, 8, 2, 6, L.sash]);
    }
    if (L.mantle && dir !== 'u') P.push(['r', side ? 4 : 2, 6, side ? 5 : 5, 3, L.mantle], ['r', side ? 9 : 9, 6, side ? 3 : 5, 3, L.mantle], ['kr', side ? 4 : 2, 6, side ? 5 : 5, 1, 'rgba(255,255,255,0.3)']);
    if (L.mantle && dir === 'u') P.push(['r', 2, 6, 12, 3, L.mantle]);
    if (L.spikes) { if (side) P.push(['kt', 5, 6, 4, 3, 7, 6, '#d8dde8']); else P.push(['kt', 2, 6, 1, 3, 4, 6, '#d8dde8'], ['kt', 12, 6, 14, 3, 15, 6, '#d8dde8']); }
    if (L.shield && dir !== 'u') {
      var sc = L.shield;
      if (side) P.push(['r', 3, 8, 4, 6, sc], ['kr', 4, 9, 2, 1, trim], ['kr', 4, 11, 2, 1, trim]);
      else P.push(['r', 0, 8, 4, 7, sc], ['kr', 1, 9, 2, 1, trim], ['kr', 1, 12, 2, 1, trim], ['kr', 1, 9, 1, 4, trim]);
    }
    if (L.pack && dir === 'u') P.push(['r', 4, 8, 8, 6, L.pack]);
    if (L.quiver) { if (dir === 'u') P.push(['kl', 4, 7, 12, 13, '#8a5a38']); else P.push(['kr', 11, 5, 2, 4, '#8a5a38'], ['kp', 12, 4, '#e8503a']); }
    if (L.beads) P.push(['kr', side ? 5 : 5, 7, side ? 5 : 6, 1, L.beads], ['kp', side ? 7 : 8, 8, L.beads]);
    // head
    if (side) P.push(['r', 4, 1, 8, 7, skin], ['kr', 11, 3, 1, 3, 'rgba(0,0,0,0.12)']);
    else P.push(['r', 4, 1, 8, 7, skin]);
    if (dir !== 'u') faceParts(L, dir, P);
    if (L.hat !== 'hood' || true) hairParts(L, dir, P);
    hatParts(L, dir, P);
    if (dir !== 'u') holdParts(L, dir, P, f);
    else holdParts(L, dir, P, f);
    return P;
  }
  art.charParts = charParts;

  var charCache = {};
  function lookKey(L) { return JSON.stringify(L); }
  art.charFrame = function (L, dir, f) {
    var key = lookKey(L) + dir + f;
    var c = charCache[key];
    if (c) return c;
    c = art.hdCanvas(20, 24); var x = c.getContext('2d');
    x.translate(2, 6);
    art.drawParts(x, charParts(L, dir, f), 1);
    charCache[key] = c;
    return c;
  };
  /* draws a character with its feet at the bottom of the 16x16 tile at (px,py) */
  art.drawChar = function (g, L, dir, f, px, py, bob) {
    var d = dir === 'r' ? 'l' : dir, c = art.charFrame(L, d, f);
    var x = Math.round(px) - 2, y = Math.round(py) - 6 + (bob || 0);
    if (dir === 'r') { g.save(); g.translate(x + 20, y); g.scale(-1, 1); g.drawImage(c, 0, 0); g.restore(); }
    else g.drawImage(c, x, y);
  };
  var bigCache = {};
  art.charBig = function (L, facing, scale) {
    scale = scale || 2;
    var key = lookKey(L) + facing + scale;
    var c = bigCache[key]; if (c) return c;
    c = art.hdCanvas(24 * scale, 26 * scale); var x = c.getContext('2d');
    var tmp = art.hdCanvas(24 * scale, 26 * scale), tx = tmp.getContext('2d');
    tx.translate(3 * scale, 6 * scale);
    art.drawParts(tx, charParts(L, 'l', 0), scale);
    if (facing === 'r') { x.translate(24 * scale, 0); x.scale(-1, 1); }
    x.drawImage(tmp, 0, 0);
    bigCache[key] = c;
    return c;
  };

  /* ---------- class looks ---------- */
  art.CLASS_LOOK = {
    vanguard: { main: '#7a86a8', trim: '#e8d8a0', pants: '#4a5270', mantle: '#b4bed4', shield: '#3d68b8', hold: 'sword', cape: '#c0504a', hat: null },
    spellwright: { main: '#6a4aa8', trim: '#f2c14e', robe: true, hat: 'pointed', hatc: '#4a3380', hold: 'staff', orb: '#7af0ff', sash: '#f2c14e' },
    wayfinder: { main: '#4a8a4a', trim: '#e8d080', pants: '#6a5a3a', hat: 'cap', hatc: '#3a6a3a', hold: 'bow', cape: '#8a6a3a', quiver: true },
    lampbearer: { main: '#f0ecd8', trim: '#f2c14e', robe: true, hat: 'hood', hatc: '#f0ecd8', hold: 'lantern', sash: '#7ad6e0' },
    reaver: { main: '#7a2a2a', trim: '#d8a23a', pants: '#3a2a2a', mantle: '#3a3a48', spikes: true, hat: 'horns', hatc: '#5a5a6a', hold: 'axe', cape: '#2a1a1a' },
    hexcaster: { main: '#3a2a5a', trim: '#c070ff', robe: true, hat: 'hood', hatc: '#2a1f48', hold: 'staff', orb: '#c070ff', glow: '#ff6ad8', sash: '#c070ff' },
    shade: { main: '#2e3446', trim: '#7be0c9', pants: '#1f2430', hat: 'cowl', hatc: '#1f2430', hold: 'dagger', cape: '#1a1f2a' },
    cinderbinder: { main: '#5a5058', trim: '#ff7a3d', pants: '#3a3238', mantle: '#a89aa8', hat: 'embhorns', hatc: '#ff7a3d', hold: 'staff', orb: '#ff7a3d', beads: '#ff7a3d' }
  };
  art.lookFor = function (cls, appearance) {
    var base = art.CLASS_LOOK[cls] || art.CLASS_LOOK.vanguard, L = {}, k;
    for (k in base) L[k] = base[k];
    appearance = appearance || {};
    L.skin = SKIN[appearance.skin | 0] || SKIN[0];
    L.hair = HAIRC[appearance.hair | 0] || HAIRC[0];
    L.hs = appearance.hs | 0;
    var acc = ACCENTS[appearance.acc | 0] || ACCENTS[0];
    L.trim = acc;
    if (L.sash) L.sash = acc;
    if (L.beads) L.beads = acc;
    if (L.cape && (cls === 'vanguard' || cls === 'wayfinder')) L.cape = acc === '#f2c14e' ? L.cape : acc;
    return L;
  };
  /* NPC archetypes */
  var NPC = {
    villager: { main: '#c8a070', trim: '#8a5a38', pants: '#5a4a3a' },
    villagerB: { main: '#7aa0c8', trim: '#e8e0d0', pants: '#4a5a6a' },
    villagerC: { main: '#c87a8a', trim: '#f0e0d0', pants: '#6a4a5a', robe: true },
    child: { main: '#e0c050', trim: '#fff', pants: '#5a7a5a' },
    elder: { main: '#8a7aa8', trim: '#f2c14e', robe: true, beard: '#e8e4ee', hair: '#e8e4ee', hold: 'staff', orb: '#ffe27a' },
    merchant: { main: '#4a9a8a', trim: '#f2c14e', pants: '#3a5a5a', hat: 'cap', hatc: '#c0504a' },
    guard: { main: '#6a7a9a', trim: '#d8d8e8', pants: '#3a4a6a', hat: 'helm', hatc: '#b4bed4', mantle: '#8a96b0', hold: 'spear', shield: '#3d68b8' },
    royalguard: { main: '#9a2f4a', trim: '#f2c14e', pants: '#3a2a3a', hat: 'helm', hatc: '#d8c070', mantle: '#d8c070', hold: 'spear' },
    smith: { main: '#8a6a4a', trim: '#4a4a58', pants: '#3a3a3a', beard: '#6b4328', hold: 'hammer', mantle: '#4a3a2a' },
    innkeeper: { main: '#c0504a', trim: '#fff', pants: '#4a3a3a', robe: true },
    sage: { main: '#3a7a9a', trim: '#7af0ff', robe: true, hat: 'hood', hatc: '#3a7a9a', hold: 'book', orb: '#3a5a9a' },
    fisher: { main: '#5a8aa0', trim: '#e8e0d0', pants: '#4a4a3a', hat: 'straw' },
    sailor: { main: '#f0f0f8', trim: '#3d68b8', pants: '#3a4a7a', hat: 'bandana', hatc: '#3d68b8' },
    noble: { main: '#7a3a8a', trim: '#f2c14e', pants: '#3a2a4a', robe: true },
    king: { main: '#9a2f4a', trim: '#f2c14e', robe: true, hat: 'crown', beard: '#c9953a', hair: '#c9953a', cape: '#6e1f34' },
    ashen: { main: '#6a6068', trim: '#ff7a3d', pants: '#3a3238', hat: 'embhorns', hatc: '#ff7a3d', mantle: '#8a7e88' },
    raider: { main: '#7a4a3a', trim: '#d8a23a', pants: '#3a2a2a', hat: 'bandana', hatc: '#c0504a', hold: 'dagger', mantle: '#5a4a4a' },
    warden: { main: '#e8e4f0', trim: '#7ad6e0', pants: '#8a96b0', hat: 'helm', hatc: '#e8e4f0', hold: 'lantern', shield: '#e8e4f0', mantle: '#b4bed4' },
    ghost: { main: '#b8c8e8', trim: '#fff', robe: true, hat: 'hood', hatc: '#b8c8e8', glow: '#7af0ff' }
  };
  art.NPC = NPC;
  art.npcLook = function (kind, seed) {
    var base = NPC[kind] || NPC.villager, L = {}, k, h = FP.hash(seed | 0, 77);
    for (k in base) L[k] = base[k];
    if (!L.skin) L.skin = SKIN[h % 4];
    if (!L.hair) L.hair = HAIRC[(h >> 3) % 6];
    if (L.hs === undefined) L.hs = (h >> 6) % 4;
    return L;
  };

  /* ---------- portraits (48x48 bust) ---------- */
  var pCache = {};
  art.portrait = function (spec) {
    var key = JSON.stringify(spec), c = pCache[key];
    if (c) return c;
    c = art.hdCanvas(48, 48); var x = c.getContext('2d');
    art.setCtx(x);
    var R = art.R, P = art.P, E = art.E, TRI = art.TRI;
    var L = spec.look || {}, skin = L.skin || SKIN[0], hair = L.hair || HAIRC[0], hs = L.hs | 0;
    var shade = spec.skinShade || shadeOf(skin), main = L.main || '#4a78c0', trim = L.trim || '#f2c14e';
    // background
    var bg = spec.bg || ['#2a2f5a', '#5a3a7a'];
    var gr = x.createLinearGradient(0, 0, 0, 48); gr.addColorStop(0, bg[0]); gr.addColorStop(1, bg[1]);
    x.fillStyle = gr; x.fillRect(0, 0, 48, 48);
    var rg = x.createRadialGradient(24, 20, 2, 24, 20, 26); rg.addColorStop(0, 'rgba(255,255,255,0.28)'); rg.addColorStop(1, 'rgba(255,255,255,0)');
    x.fillStyle = rg; x.fillRect(0, 0, 48, 48);
    for (var i = 0; i < 7; i++) { var q = FP.hash(i * 5, 9); P(q % 48, (q >> 6) % 30, 'rgba(255,255,255,0.35)'); }
    // hair back
    var hb = [];
    if (L.hat !== 'hood' && L.hat !== 'cowl') {
      if (hs === 1) hb.push(['e', 24, 24, 14, 17, hair]);
      if (hs === 3) hb.push(['e', 24, 8, 5, 5, hair]);
    }
    // cape / mantle / body
    var body = [];
    if (L.cape) body.push(['e', 24, 52, 25, 18, L.cape]);
    body.push(['e', 24, 54, 22, 16, main], ['kr', 6, 42, 36, 2, 'rgba(255,255,255,0.18)']);
    if (L.robe) body.push(['kr', 21, 36, 6, 12, trim]);
    else body.push(['kr', 19, 36, 10, 2, trim]);
    if (L.mantle) body.push(['e', 10, 42, 7, 5, L.mantle], ['e', 38, 42, 7, 5, L.mantle], ['kr', 6, 38, 8, 2, 'rgba(255,255,255,0.3)'], ['kr', 34, 38, 8, 2, 'rgba(255,255,255,0.3)']);
    if (L.spikes) body.push(['kt', 5, 38, 3, 30, 10, 37, '#d8dde8'], ['kt', 43, 38, 45, 30, 38, 37, '#d8dde8']);
    if (L.beads) body.push(['kr', 17, 37, 14, 1, L.beads], ['kp', 24, 39, L.beads], ['kp', 22, 38, L.beads], ['kp', 26, 38, L.beads]);
    body.push(['r', 21, 31, 6, 7, shade]);
    art.drawParts(x, hb.concat(body), 1);
    // head
    var head = [['e', 24, 21, 11, 12, skin], ['e', 24, 27, 9, 8, skin], ['e', 13, 22, 2, 3, skin], ['e', 35, 22, 2, 3, skin]];
    art.drawParts(x, head, 1);
    // face shading
    R(15, 24, 18, 1, 'rgba(0,0,0,0.0)');
    var det = [['ke', 24, 31, 5, 1, shade], ['kr', 14, 22, 1, 3, shade], ['kr', 34, 22, 1, 3, shade]];
    art.drawParts(x, det, 1);
    // eyes
    var ey = 22, ec = spec.eye || '#3a5a9a', lids = spec.mood || 'calm';
    function eye(ex, flip) {
      R(ex - 3, ey - 1, 7, 4, '#f4f0ff');
      R(ex - 1, ey - 1, 3, 4, ec);
      R(ex, ey, 1, 2, '#0d0b1a');
      P(ex - 1, ey - 1, '#ffffff');
      R(ex - 3, ey - 2, 7, 1, '#1b1626');
      if (lids === 'hard' || lids === 'cold') R(ex - 3, ey - 1, 7, 1, '#1b1626');
      R(ex - 3, ey + 3, 7, 1, shade);
    }
    if (L.glow) { ec = L.glow; }
    if (spec.eyePatch) { eye(19); R(29 - 4, ey - 3, 9, 7, '#1b1626'); LN(33, 19, 36, 14, '#1b1626'); } else { eye(19); eye(29); }
    // brows
    var bc = spec.brow || hair;
    if (lids === 'hard') { R(15, 17, 7, 2, bc); P(22, 18, bc); R(26, 18, 1, 1, bc); R(26, 17, 7, 2, bc); P(22, 19, bc); }
    else if (lids === 'sad') { R(16, 18, 6, 1, bc); P(15, 19, bc); R(26, 18, 6, 1, bc); P(32, 19, bc); }
    else if (lids === 'cold') { R(15, 18, 7, 1, bc); R(27, 18, 7, 1, bc); P(22, 17, bc); P(27, 17, bc); }
    else { R(16, 18, 6, 1, bc); R(27, 18, 6, 1, bc); }
    // nose and mouth
    R(24, 25, 1, 2, shade); P(23, 27, shade);
    var mc = '#8a3a3a';
    if (spec.mouth === 'smile') { R(21, 30, 7, 1, mc); P(20, 29, mc); P(28, 29, mc); }
    else if (spec.mouth === 'frown') { R(21, 30, 7, 1, mc); P(20, 31, mc); P(28, 31, mc); }
    else if (spec.mouth === 'grin') { R(20, 29, 9, 2, '#f4f0ff'); R(20, 29, 9, 1, mc); R(20, 31, 9, 1, mc); }
    else if (spec.mouth === 'open') { R(22, 29, 5, 3, '#4a1a1a'); }
    else { R(21, 30, 7, 1, mc); }
    if (spec.blush) { R(14, 26, 3, 1, 'rgba(255,100,100,0.45)'); R(32, 26, 3, 1, 'rgba(255,100,100,0.45)'); }
    if (spec.scar) { LN(30, 17, 33, 28, '#a03a3a'); LN(31, 17, 34, 28, 'rgba(255,200,200,0.5)'); }
    if (spec.wrinkles) { R(16, 20, 3, 1, shade); R(30, 20, 3, 1, shade); R(18, 26, 2, 1, shade); R(29, 26, 2, 1, shade); }
    if (L.beard) { art.drawParts(x, [['e', 24, 30, 9, 6, L.beard], ['kr', 17, 27, 14, 3, L.beard], ['kr', 21, 28, 7, 1, mc]], 1); R(21, 28, 7, 1, mc); }
    if (spec.mask) { art.drawParts(x, [['kr', 14, 25, 20, 10, spec.mask], ['kr', 14, 25, 20, 1, 'rgba(255,255,255,0.2)']], 1); }
    // hair front / hats
    var hf = [];
    if (L.hat === 'hood') hf.push(['e', 24, 10, 15, 9, L.hatc], ['kr', 9, 12, 5, 28, L.hatc], ['kr', 34, 12, 5, 28, L.hatc], ['kr', 14, 17, 20, 1, 'rgba(0,0,0,0.4)']);
    else if (L.hat === 'cowl') hf.push(['e', 24, 10, 15, 9, L.hatc], ['kr', 9, 12, 5, 30, L.hatc], ['kr', 34, 12, 5, 30, L.hatc], ['kr', 14, 17, 20, 1, 'rgba(0,0,0,0.4)'], ['kr', 14, 26, 20, 10, L.hatc]);
    else if (L.hat === 'helm' || L.hat === 'horns') {
      var st = L.hatc || '#9aa4bc';
      hf.push(['e', 24, 11, 13, 8, st], ['kr', 11, 12, 4, 14, st], ['kr', 33, 12, 4, 14, st], ['kr', 11, 16, 26, 2, st], ['kr', 11, 12, 26, 2, 'rgba(255,255,255,0.28)']);
    }
    else {
      var hc = [];
      if (hs === 2) { hc.push(['e', 24, 12, 12, 7, hair], ['t', 12, 12, 13, 1, 19, 8, hair], ['t', 18, 10, 24, -3, 29, 9, hair], ['t', 28, 9, 36, 0, 36, 14, hair]); }
      else if (hs === 3) { hc.push(['e', 24, 12, 12, 7, hair], ['kr', 12, 12, 3, 8, hair], ['kr', 33, 12, 3, 8, hair]); }
      else { hc.push(['e', 24, 12, 12, 7, hair], ['kr', 12, 12, 3, 9, hair], ['kr', 33, 12, 3, 9, hair]); }
      hc.push(['kt', 12, 14, 24, 8, 36, 14, hair]);
      hc.push(['kr', 15, 15, 9, 3, hair], ['kr', 26, 15, 8, 2, hair]);
      hf = hf.concat(hc);
    }
    if (L.hat === 'pointed') hf.push(['r', 8, 10, 32, 3, L.hatc], ['t', 11, 10, 36, 10, 30, -10, L.hatc], ['kr', 12, 9, 25, 2, L.trim], ['kp', 24, 9, '#7af0ff']);
    if (L.hat === 'cap') hf.push(['e', 24, 11, 13, 7, L.hatc], ['kr', 11, 14, 27, 3, L.hatc], ['kt', 34, 6, 44, -4, 38, 12, '#e8503a']);
    if (L.hat === 'crown') hf.push(['r', 14, 6, 20, 5, '#f2c14e'], ['t', 14, 6, 15, -1, 19, 6, '#f2c14e'], ['t', 21, 6, 24, -3, 27, 6, '#f2c14e'], ['t', 29, 6, 33, -1, 34, 6, '#f2c14e'], ['kp', 24, 8, '#e8503a'], ['kp', 17, 8, '#7af0ff'], ['kp', 31, 8, '#7af0ff']);
    if (L.hat === 'bandana') hf.push(['r', 12, 11, 24, 4, L.hatc], ['kt', 34, 12, 42, 16, 34, 18, L.hatc]);
    if (L.hat === 'embhorns') hf.push(['t', 13, 12, 7, -2, 20, 8, L.hatc], ['t', 35, 12, 41, -2, 28, 8, L.hatc]);
    if (L.hat === 'straw') hf.push(['e', 24, 12, 22, 4, '#e8d080'], ['e', 24, 8, 11, 6, '#e8d080'], ['kr', 13, 9, 22, 2, '#c05a3a']);
    if (L.hat === 'horns') hf.push(['t', 12, 12, 4, -2, 17, 6, '#ece4d0'], ['t', 36, 12, 44, -2, 31, 6, '#ece4d0']);
    art.drawParts(x, hf, 1);
    if (spec.circlet) { R(15, 11, 18, 2, '#f2c14e'); P(24, 11, '#7af0ff'); P(24, 12, '#7af0ff'); }
    pCache[key] = c;
    return c;
  };
  function LN(a, b, c2, d, col) { art.LN(a, b, c2, d, col); }
  function shadeOf(hex) {
    var n = parseInt(hex.slice(1), 16), r = n >> 16, g2 = (n >> 8) & 255, b = n & 255;
    return 'rgb(' + Math.floor(r * 0.78) + ',' + Math.floor(g2 * 0.7) + ',' + Math.floor(b * 0.68) + ')';
  }

  /* named characters: look + portrait extras */
  art.CAST = {
    tam: { name: 'Odalys', look: { skin: SKIN[2], hair: '#d8d4e0', hs: 3, main: '#3a6a8a', trim: '#7ad6e0', hat: 'hood', hatc: '#3a6a8a', hold: 'lantern', robe: true, cape: '#2a4a6a' }, mood: 'calm', wrinkles: false, bg: ['#1f3a5a', '#4a6a9a'], eye: '#3a8aa8' },
    odalys: { name: 'Odalys', look: { skin: SKIN[2], hair: '#d8d4e0', hs: 3, main: '#e8e4f0', trim: '#7ad6e0', pants: '#8a96b0', hat: 'helm', hatc: '#e8e4f0', hold: 'lantern', shield: '#e8e4f0', mantle: '#b4bed4', cape: '#3a6a8a' }, mood: 'calm', bg: ['#1f3a5a', '#4a6a9a'], eye: '#3a8aa8', scar: false },
    corvin: { name: 'Corvin', look: { skin: SKIN[1], hair: '#2a1d1a', hs: 2, main: '#5a4a5a', trim: '#ff7a3d', pants: '#2a2230', hat: 'embhorns', hatc: '#ff7a3d', mantle: '#8a7e88', hold: 'dagger', cape: '#2a1a2a' }, mood: 'cold', bg: ['#3a1a2a', '#8a3a2a'], eye: '#d8602a', scar: true },
    sable: { name: 'Sable', look: { skin: SKIN[3], hair: '#d8d4e0', hs: 1, main: '#4a3a52', trim: '#ff7a3d', robe: true, hat: null, mantle: '#8a7e88', beads: '#ff7a3d', cape: '#2a1f30' }, mood: 'calm', wrinkles: true, bg: ['#2a1a2a', '#7a3a2a'], eye: '#d8602a' },
    berenhart: { name: 'King Berenhart', look: NPC.king, mood: 'sad', wrinkles: true, bg: ['#3a1a3a', '#8a5a3a'], eye: '#5a7a9a' },
    iola: { name: 'Iola Quill', look: { skin: SKIN[1], hair: '#b8452e', hs: 3, main: '#e8e4f0', trim: '#7ad6e0', pants: '#8a96b0', hat: 'bandana', hatc: '#3d68b8', hold: 'spear', mantle: '#b4bed4' }, mood: 'hard', bg: ['#1f3a5a', '#3a7aa8'], eye: '#3d68b8' },
    vane: { name: 'Rothgar Vane', look: { skin: SKIN[0], hair: '#6b4328', hs: 0, main: '#9a2f4a', trim: '#f2c14e', pants: '#3a2a3a', hat: 'helm', hatc: '#b4bed4', mantle: '#d8c070', hold: 'axe', beard: '#6b4328' }, mood: 'hard', bg: ['#3a1a2a', '#7a3a4a'], eye: '#5a3a2a' },
    harbor: { name: 'Harbormaster', look: { skin: SKIN[2], hair: '#e8e4ee', hs: 0, main: '#3d68b8', trim: '#f2c14e', pants: '#3a4a7a', hat: 'cap', hatc: '#3d68b8', beard: '#e8e4ee' }, mood: 'calm', wrinkles: true, bg: ['#1f3a5a', '#3a7aa8'], eye: '#3a6a8a' },
    seren: { name: 'Elder Maro', look: NPC.elder, mood: 'calm', wrinkles: true, bg: ['#2a3a2a', '#6a8a4a'], eye: '#5a7a4a' },
    nyx: { name: 'The Archivist', look: NPC.ghost, mood: 'calm', bg: ['#0f2a3a', '#2a6a8a'], eye: '#7af0ff' },
    wren: { name: 'Wren', look: { skin: SKIN[1], hair: '#c9953a', hs: 1, main: '#c87a8a', trim: '#f0e0d0', robe: true, hat: null }, mood: 'calm', blush: true, bg: ['#3a2a4a', '#8a5a7a'], eye: '#4a8a6a', mouth: 'smile' },
    pell: { name: 'Pell', look: { skin: SKIN[0], hair: '#6b4328', hs: 2, main: '#e0c050', trim: '#fff', hat: null }, mood: 'calm', blush: true, bg: ['#2a3a2a', '#6a8a4a'], eye: '#4a6a3a', mouth: 'grin' }
  };

  /* ---------- creatures ---------- */
  var C = {};
  art.CRE = C;
  C.wick = { size: 32, parts: [
    ['e', 8, 22, 5, 3, '#f0a040'], ['e', 4, 23, 3, 3, '#fff1a8'], ['e', 16, 21, 8, 5, '#f4b860'], ['r', 11, 24, 3, 6, '#d98a38'], ['r', 19, 24, 3, 6, '#d98a38'],
    ['e', 24, 15, 6, 5, '#f4b860'], ['t', 20, 12, 21, 3, 25, 11, '#f4b860'], ['t', 25, 11, 28, 3, 29, 13, '#f4b860'], ['e', 29, 17, 3, 2, '#fde6b0'],
    ['kt', 21, 11, 22, 5, 24, 11, '#c0602a'], ['kt', 26, 11, 28, 5, 28, 12, '#c0602a'], ['kp', 31, 16, '#1b1626'], ['kr', 25, 14, 2, 2, '#1b1626'], ['kp', 25, 14, '#ffffff'],
    ['ke', 17, 24, 5, 2, '#fde6b0'], ['kr', 21, 19, 4, 2, '#fff1c0'], ['ke', 14, 18, 4, 1, '#f9cf88'], ['kp', 4, 22, '#ffffff'], ['kr', 11, 29, 3, 1, '#fde6b0'], ['kr', 19, 29, 3, 1, '#fde6b0'], ['kp', 22, 21, '#ffe27a']
  ] };
  C.soot = { size: 32, parts: [
    ['e', 8, 21, 5, 3, '#4a4658'], ['e', 4, 20, 3, 3, '#ff9a3a'], ['e', 15, 21, 8, 6, '#4a4658'], ['r', 10, 25, 3, 5, '#38344a'], ['r', 18, 25, 3, 5, '#38344a'],
    ['e', 23, 14, 6, 6, '#5a566a'], ['e', 18, 12, 3, 5, '#38344a'], ['e', 28, 14, 2, 3, '#38344a'], ['e', 28, 18, 3, 2, '#8a8698'],
    ['kr', 24, 12, 3, 3, '#ff9a3a'], ['kp', 25, 13, '#ffffff'], ['kp', 30, 17, '#1b1626'], ['ke', 14, 24, 5, 2, '#6a667a'], ['kr', 10, 29, 3, 1, '#8a8698'], ['kr', 18, 29, 3, 1, '#8a8698'],
    ['ke', 6, 12, 2, 1, 'rgba(200,200,220,0.55)'], ['ke', 9, 8, 2, 1, 'rgba(200,200,220,0.4)'], ['kp', 4, 18, '#ffd23a'], ['kp', 3, 20, '#fff']
  ] };
  C.mossback = { size: 32, parts: [
    ['e', 15, 19, 11, 9, '#3f7a44'], ['e', 15, 17, 10, 7, '#56a05a'], ['e', 27, 22, 4, 3, '#c8b078'], ['r', 6, 25, 4, 5, '#a8946a'], ['r', 20, 25, 4, 5, '#a8946a'], ['t', 3, 24, 7, 22, 5, 27, '#a8946a'],
    ['kl', 15, 10, 15, 24, '#2d5a32'], ['kl', 8, 14, 10, 24, '#2d5a32'], ['kl', 22, 14, 20, 24, '#2d5a32'], ['ke', 11, 13, 4, 2, '#8bd36a'], ['ke', 19, 12, 3, 2, '#8bd36a'], ['ke', 15, 9, 2, 1, '#bff09a'],
    ['kr', 28, 21, 2, 2, '#1b1626'], ['kp', 28, 21, '#fff'], ['kr', 6, 29, 4, 1, '#d8c898'], ['kr', 20, 29, 4, 1, '#d8c898'], ['kp', 14, 8, '#ff8ab0']
  ] };
  C.pipsprout = { size: 32, parts: [
    ['e', 16, 22, 8, 7, '#84d870'], ['e', 12, 11, 4, 6, '#4aa24e'], ['e', 20, 11, 4, 6, '#4aa24e'], ['r', 15, 12, 2, 6, '#3f8a44'], ['r', 11, 28, 4, 2, '#d8bc7a'], ['r', 18, 28, 4, 2, '#d8bc7a'],
    ['r', 6, 22, 3, 2, '#84d870'], ['r', 24, 22, 3, 2, '#84d870'],
    ['kr', 12, 20, 3, 4, '#1b1626'], ['kr', 19, 20, 3, 4, '#1b1626'], ['kp', 12, 20, '#fff'], ['kp', 19, 20, '#fff'], ['kr', 15, 26, 3, 1, '#b84a4a'],
    ['ke', 16, 20, 7, 3, '#a6ec92'], ['kl', 12, 8, 12, 14, '#2d7a38'], ['kl', 20, 8, 20, 14, '#2d7a38'], ['kp', 11, 6, '#bff09a'], ['kp', 21, 6, '#bff09a'], ['ke', 9, 21, 1, 1, '#ff8ab0'], ['ke', 25, 21, 1, 1, '#ff8ab0']
  ] };
  C.gullwing = { size: 32, parts: [
    ['t', 3, 15, 10, 13, 10, 19, '#9aa6c0'], ['e', 16, 17, 8, 4, '#f4f4fc'], ['e', 25, 14, 4, 4, '#f4f4fc'], ['t', 28, 14, 31, 16, 28, 17, '#f2b43a'],
    ['t', 12, 15, 5, 3, 22, 13, '#c4cce0'], ['t', 12, 15, 9, 6, 20, 13, '#aeb8d0'], ['r', 15, 21, 1, 3, '#f2b43a'], ['r', 19, 21, 1, 3, '#f2b43a'],
    ['kr', 25, 13, 2, 2, '#1b1626'], ['kp', 25, 13, '#fff'], ['ke', 17, 19, 5, 2, '#d8def0'], ['kr', 5, 14, 4, 1, '#3a4a6a'], ['kr', 14, 14, 6, 1, '#6a7a9a']
  ] };
  C.brinecrab = { size: 32, parts: [
    ['e', 16, 22, 10, 6, '#d8503a'], ['e', 16, 20, 9, 4, '#f0704a'], ['e', 5, 12, 4, 4, '#d8503a'], ['e', 27, 12, 4, 4, '#d8503a'], ['r', 6, 15, 2, 5, '#b83a2a'], ['r', 24, 15, 2, 5, '#b83a2a'],
    ['r', 7, 28, 2, 3, '#b83a2a'], ['r', 11, 28, 2, 3, '#b83a2a'], ['r', 19, 28, 2, 3, '#b83a2a'], ['r', 23, 28, 2, 3, '#b83a2a'],
    ['r', 12, 14, 1, 5, '#b83a2a'], ['r', 19, 14, 1, 5, '#b83a2a'], ['kr', 11, 12, 3, 3, '#f4f0ff'], ['kr', 18, 12, 3, 3, '#f4f0ff'], ['kp', 12, 13, '#1b1626'], ['kp', 19, 13, '#1b1626'],
    ['kr', 3, 11, 2, 1, '#1b1626'], ['kr', 27, 11, 2, 1, '#1b1626'], ['ke', 13, 19, 5, 1, '#ff9a7a'], ['kr', 14, 24, 4, 1, '#8a2a1a'], ['kp', 10, 21, '#ff9a7a'], ['kp', 22, 21, '#ff9a7a']
  ] };
  C.cragmole = { size: 32, parts: [
    ['e', 14, 21, 9, 7, '#8a6a4a'], ['e', 24, 22, 5, 4, '#8a6a4a'], ['t', 28, 20, 31, 23, 28, 25, '#d88aa0'], ['e', 25, 28, 4, 2, '#c8a880'], ['e', 20, 28, 4, 2, '#c8a880'], ['r', 8, 26, 4, 4, '#6a4a30'], ['r', 14, 26, 4, 4, '#6a4a30'],
    ['t', 8, 15, 10, 8, 13, 15, '#7af0ff'], ['t', 13, 14, 16, 6, 19, 14, '#a8f8ff'], ['t', 18, 15, 21, 9, 22, 15, '#7af0ff'],
    ['kr', 23, 20, 2, 2, '#1b1626'], ['kp', 23, 20, '#fff'], ['kr', 25, 29, 4, 1, '#f0e0c0'], ['kr', 20, 29, 3, 1, '#f0e0c0'], ['ke', 12, 24, 6, 2, '#a88a68'], ['kp', 29, 21, '#1b1626'], ['kp', 14, 12, '#fff']
  ] };
  C.emberling = { size: 32, parts: [
    ['e', 6, 24, 5, 3, '#f08040'], ['e', 3, 20, 3, 4, '#f08040'], ['t', 1, 18, 2, 8, 5, 18, '#ffb03a'], ['t', 2, 16, 3, 9, 5, 16, '#e8503a'], ['e', 15, 22, 8, 4, '#f08040'], ['r', 10, 25, 3, 5, '#d86030'], ['r', 19, 25, 3, 5, '#d86030'],
    ['e', 24, 18, 5, 4, '#f4904a'], ['t', 22, 13, 24, 8, 26, 14, '#e8503a'], ['t', 25, 13, 27, 8, 29, 15, '#e8503a'], ['e', 29, 20, 2, 2, '#f4904a'],
    ['ke', 15, 24, 6, 2, '#ffe0a0'], ['kr', 25, 17, 2, 2, '#1b1626'], ['kp', 25, 17, '#ffe27a'], ['kp', 31, 20, '#1b1626'], ['kr', 10, 29, 3, 1, '#ffe0a0'], ['kr', 19, 29, 3, 1, '#ffe0a0'], ['kp', 4, 15, '#fff2a0'], ['kp', 12, 20, '#ffb03a'], ['kp', 16, 19, '#ffb03a']
  ] };
  C.gloamhound = { size: 32, parts: [
    ['e', 6, 21, 5, 2, '#3a3450'], ['e', 15, 19, 10, 6, '#3a3450'], ['r', 8, 22, 3, 8, '#2a2540'], ['r', 13, 23, 3, 7, '#2a2540'], ['r', 19, 23, 3, 7, '#2a2540'], ['r', 22, 22, 3, 8, '#2a2540'],
    ['e', 25, 12, 5, 5, '#4a4468'], ['t', 21, 10, 22, 2, 25, 8, '#2a2540'], ['t', 26, 8, 28, 1, 30, 10, '#2a2540'], ['e', 29, 14, 3, 3, '#4a4468'],
    ['t', 12, 14, 14, 9, 16, 14, '#a070ff'], ['t', 17, 14, 19, 8, 21, 14, '#a070ff'],
    ['kr', 26, 11, 3, 2, '#ff6ad8'], ['kp', 31, 14, '#ff6ad8'], ['kr', 28, 17, 3, 1, '#fff'], ['kl', 10, 18, 22, 20, '#a070ff'], ['kr', 8, 29, 3, 1, '#a070ff'], ['kr', 22, 29, 3, 1, '#a070ff'], ['kp', 9, 20, '#ff6ad8']
  ] };
  C.duskmoth = { size: 32, parts: [
    ['e', 9, 11, 7, 6, '#8a6ad0'], ['e', 23, 11, 7, 6, '#8a6ad0'], ['e', 10, 21, 5, 5, '#6a4aa8'], ['e', 22, 21, 5, 5, '#6a4aa8'], ['e', 16, 16, 3, 7, '#4a3a68'],
    ['kl', 14, 8, 11, 2, '#c8b0ff'], ['kl', 18, 8, 21, 2, '#c8b0ff'], ['ke', 9, 11, 3, 3, '#f2c14e'], ['ke', 23, 11, 3, 3, '#f2c14e'], ['kp', 9, 11, '#1b1626'], ['kp', 23, 11, '#1b1626'],
    ['ke', 10, 21, 2, 2, '#c8b0ff'], ['ke', 22, 21, 2, 2, '#c8b0ff'], ['kr', 15, 12, 1, 1, '#ff6ad8'], ['kr', 17, 12, 1, 1, '#ff6ad8'], ['kr', 15, 17, 3, 1, '#8a6ad0'], ['kr', 15, 20, 3, 1, '#8a6ad0']
  ] };
  C.eelwyrm = { size: 32, parts: [
    ['e', 6, 26, 4, 3, '#3d8fd8'], ['e', 11, 27, 4, 3, '#3d8fd8'], ['e', 16, 25, 4, 4, '#3d8fd8'], ['e', 20, 20, 4, 4, '#3d8fd8'], ['e', 22, 15, 4, 4, '#3d8fd8'], ['e', 25, 10, 5, 4, '#5aa8ec'],
    ['t', 29, 10, 31, 12, 29, 13, '#5aa8ec'], ['t', 23, 4, 25, 8, 28, 6, '#f2c14e'], ['t', 4, 24, 0, 21, 3, 27, '#f2c14e'],
    ['kr', 26, 9, 2, 2, '#ffe27a'], ['kp', 26, 9, '#1b1626'], ['ke', 11, 28, 3, 1, '#b8e0ff'], ['ke', 16, 27, 3, 1, '#b8e0ff'], ['ke', 21, 21, 2, 1, '#b8e0ff'], ['kr', 27, 12, 3, 1, '#b8e0ff'], ['kp', 8, 24, '#7cc6f2'], ['kp', 18, 23, '#7cc6f2']
  ] };
  C.rimestag = { size: 40, parts: [
    ['e', 17, 25, 11, 6, '#9a8a7a'], ['r', 8, 29, 3, 10, '#6a5a4a'], ['r', 13, 30, 3, 9, '#6a5a4a'], ['r', 22, 30, 3, 9, '#6a5a4a'], ['r', 26, 29, 3, 10, '#6a5a4a'],
    ['e', 27, 17, 4, 4, '#9a8a7a'], ['r', 24, 18, 4, 9, '#9a8a7a'], ['e', 31, 19, 3, 2, '#c8b8a8'], ['t', 4, 24, 0, 21, 6, 28, '#9a8a7a'],
    ['l', 26, 13, 24, 6, '#c8f0ff'], ['l', 24, 6, 20, 2, '#c8f0ff'], ['l', 24, 6, 27, 1, '#c8f0ff'], ['l', 28, 13, 31, 6, '#c8f0ff'], ['l', 31, 6, 34, 2, '#c8f0ff'], ['l', 31, 6, 29, 1, '#c8f0ff'],
    ['ke', 15, 22, 7, 3, '#e8f4ff'], ['ke', 24, 28, 4, 2, '#e8f4ff'], ['kr', 28, 16, 2, 2, '#1b1626'], ['kp', 28, 16, '#7af0ff'], ['kp', 34, 19, '#1b1626'], ['kr', 8, 38, 3, 1, '#2a2230'], ['kr', 26, 38, 3, 1, '#2a2230'], ['kr', 13, 38, 3, 1, '#2a2230'], ['kr', 22, 38, 3, 1, '#2a2230'],
    ['kp', 12, 20, '#fff'], ['kp', 20, 21, '#fff']
  ] };
  C.lampwisp = { size: 32, parts: [
    ['t', 16, 3, 7, 22, 25, 22, '#ffd96a'], ['e', 16, 20, 9, 7, '#ffd96a'], ['t', 16, 8, 11, 20, 21, 20, '#fff1a8'], ['e', 16, 21, 6, 4, '#fff6c8'],
    ['kr', 12, 18, 2, 3, '#1b1626'], ['kr', 19, 18, 2, 3, '#1b1626'], ['kp', 12, 18, '#fff'], ['kp', 19, 18, '#fff'], ['kr', 15, 23, 3, 1, '#c0782a'],
    ['kt', 16, 1, 15, 6, 17, 6, '#ffffff'], ['kp', 6, 14, '#ffe27a'], ['kp', 26, 12, '#ffe27a'], ['kp', 4, 24, '#ffe27a'], ['kr', 8, 28, 16, 1, 'rgba(255,230,150,0.5)']
  ] };
  C.stormkite = { size: 32, parts: [
    ['t', 2, 14, 16, 4, 30, 14, '#5a8ac8'], ['t', 4, 17, 16, 28, 28, 17, '#3d68b8'], ['e', 16, 16, 7, 5, '#7ab0e8'], ['l', 16, 20, 14, 31, '#7ab0e8'], ['l', 16, 21, 17, 31, '#7ab0e8'],
    ['t', 13, 12, 16, 7, 19, 12, '#a8d0f8'], ['kr', 12, 15, 2, 2, '#1b1626'], ['kr', 19, 15, 2, 2, '#1b1626'], ['kp', 12, 15, '#fff'], ['kp', 19, 15, '#fff'],
    ['kr', 15, 19, 3, 1, '#f4f0ff'], ['kl', 6, 14, 12, 8, '#d8ecff'], ['kl', 26, 14, 20, 8, '#d8ecff'], ['kp', 4, 15, '#fff'], ['kp', 28, 15, '#fff']
  ] };
  /* enemies that are not capturable creatures */
  C.shade = { size: 32, parts: [
    ['t', 16, 2, 4, 28, 28, 28, '#2a2540'], ['e', 16, 12, 6, 7, '#3a3450'], ['t', 4, 28, 8, 24, 10, 30, '#2a2540'], ['t', 28, 28, 24, 24, 22, 30, '#2a2540'],
    ['kr', 12, 11, 3, 3, '#ffffff'], ['kr', 18, 11, 3, 3, '#ffffff'], ['kp', 13, 12, '#7a4ac0'], ['kp', 19, 12, '#7a4ac0'], ['kl', 10, 22, 22, 24, '#4a4468'], ['kl', 8, 26, 24, 26, '#4a4468'],
    ['ke', 16, 5, 2, 1, '#6a5a8a'], ['kp', 6, 20, '#a070ff'], ['kp', 27, 18, '#a070ff']
  ] };
  C.boneknight = { size: 32, parts: [
    ['r', 11, 25, 3, 6, '#e8e0cc'], ['r', 17, 25, 3, 6, '#e8e0cc'], ['r', 10, 14, 11, 12, '#6a6a88'], ['r', 12, 7, 7, 8, '#ece4d0'], ['r', 11, 5, 9, 4, '#8a8aa8'],
    ['r', 22, 8, 2, 18, '#d8dde8'], ['r', 21, 24, 4, 2, '#8a6a3a'], ['r', 3, 14, 7, 10, '#4a5a9a'], ['kr', 5, 16, 3, 1, '#f2c14e'], ['kr', 5, 19, 3, 1, '#f2c14e'],
    ['kr', 13, 10, 2, 2, '#1b1626'], ['kr', 17, 10, 2, 2, '#1b1626'], ['kp', 14, 10, '#ff6a5a'], ['kp', 18, 10, '#ff6a5a'], ['kr', 14, 13, 4, 1, '#1b1626'],
    ['kr', 11, 17, 9, 1, '#4a4a66'], ['kr', 11, 20, 9, 1, '#4a4a66'], ['kr', 12, 29, 3, 2, '#c8c0a8'], ['kr', 18, 29, 3, 2, '#c8c0a8']
  ] };
  C.construct = { size: 32, parts: [
    ['r', 8, 26, 6, 5, '#6a7a8a'], ['r', 18, 26, 6, 5, '#6a7a8a'], ['r', 7, 12, 18, 15, '#8a9aa8'], ['r', 11, 4, 10, 9, '#9aaab8'], ['r', 1, 13, 6, 11, '#7a8a98'], ['r', 25, 13, 6, 11, '#7a8a98'],
    ['kr', 13, 7, 2, 2, '#7af0ff'], ['kr', 17, 7, 2, 2, '#7af0ff'], ['kr', 14, 17, 4, 4, '#7af0ff'], ['kr', 15, 14, 2, 10, '#4ac8e0'], ['kr', 9, 14, 14, 1, '#b8c8d0'], ['kr', 2, 14, 4, 1, '#b8c8d0'], ['kr', 26, 14, 4, 1, '#b8c8d0'],
    ['kl', 8, 20, 12, 24, '#5a6a78'], ['kp', 3, 20, '#7af0ff'], ['kp', 28, 20, '#7af0ff']
  ] };
  /* bosses (48 px) */
  C.matron = { size: 48, parts: [
    ['r', 18, 28, 12, 20, '#5a3a22'], ['r', 6, 40, 8, 8, '#5a3a22'], ['r', 34, 40, 8, 8, '#5a3a22'], ['e', 24, 18, 18, 14, '#2a6a3a'], ['e', 12, 14, 10, 9, '#3a8a4a'], ['e', 36, 14, 10, 9, '#3a8a4a'], ['e', 24, 8, 12, 8, '#4aa24e'],
    ['t', 14, 10, 8, -2, 18, 6, '#8a5a38'], ['t', 34, 10, 40, -2, 30, 6, '#8a5a38'],
    ['kr', 17, 20, 5, 4, '#1b1626'], ['kr', 27, 20, 5, 4, '#1b1626'], ['kr', 18, 21, 3, 2, '#ff6ad8'], ['kr', 28, 21, 3, 2, '#ff6ad8'], ['kr', 20, 29, 9, 2, '#1b1626'], ['kr', 22, 31, 5, 2, '#1b1626'],
    ['kl', 20, 36, 20, 47, '#3a2412'], ['kl', 28, 34, 28, 47, '#3a2412'], ['kp', 10, 10, '#ff6ad8'], ['kp', 38, 12, '#ff6ad8'], ['kp', 24, 4, '#ff6ad8'], ['ke', 22, 12, 6, 2, '#6acc6a'], ['kp', 30, 5, '#8bd36a'], ['kp', 16, 7, '#8bd36a']
  ] };
  C.sentinel = { size: 48, parts: [
    ['r', 14, 36, 8, 11, '#6a7a6a'], ['r', 26, 36, 8, 11, '#6a7a6a'], ['r', 12, 14, 24, 24, '#8a9a8a'], ['r', 17, 3, 14, 13, '#9aaa9a'], ['r', 1, 16, 10, 22, '#7a8a7a'], ['r', 37, 16, 10, 22, '#7a8a7a'],
    ['kr', 20, 8, 3, 3, '#7af0ff'], ['kr', 25, 8, 3, 3, '#7af0ff'], ['kr', 21, 21, 6, 8, '#7af0ff'], ['kr', 23, 18, 2, 18, '#4ac8e0'], ['kr', 13, 17, 22, 2, '#b8c8b8'],
    ['kl', 3, 22, 7, 36, '#3a7a3a'], ['kl', 44, 22, 40, 36, '#3a7a3a'], ['kl', 14, 28, 20, 34, '#4a8a4a'], ['kl', 34, 26, 30, 34, '#4a8a4a'], ['ke', 12, 12, 5, 2, '#4aa24e'], ['ke', 36, 12, 5, 2, '#4aa24e'], ['ke', 5, 14, 3, 2, '#4aa24e'], ['ke', 43, 14, 3, 2, '#4aa24e'], ['kp', 24, 2, '#fff']
  ] };
  C.saltmaw = { size: 48, parts: [
    ['e', 12, 36, 10, 8, '#2d6aa8'], ['e', 26, 34, 14, 10, '#3d8fd8'], ['e', 38, 22, 8, 10, '#3d8fd8'], ['e', 38, 14, 9, 7, '#3d8fd8'], ['e', 12, 30, 5, 4, '#f2c14e'], ['t', 4, 38, 0, 30, 6, 33, '#f2c14e'],
    ['t', 30, 8, 36, 0, 36, 8, '#f2c14e'], ['t', 40, 8, 45, 0, 44, 9, '#f2c14e'], ['t', 41, 18, 47, 20, 41, 22, '#3d8fd8'],
    ['kr', 40, 11, 4, 4, '#ffe27a'], ['kp', 41, 12, '#1b1626'], ['kr', 38, 19, 9, 2, '#1b1626'], ['kp', 39, 19, '#fff'], ['kp', 41, 19, '#fff'], ['kp', 43, 19, '#fff'], ['kp', 45, 19, '#fff'],
    ['ke', 26, 40, 11, 3, '#b8e0ff'], ['ke', 12, 40, 6, 2, '#b8e0ff'], ['ke', 36, 24, 4, 3, '#b8e0ff'], ['kp', 20, 30, '#7cc6f2'], ['kp', 30, 28, '#7cc6f2'], ['kp', 14, 34, '#7cc6f2'], ['kp', 24, 26, '#7cc6f2']
  ] };
  C.paleking = { size: 48, parts: [
    ['r', 17, 38, 5, 9, '#e8e0cc'], ['r', 26, 38, 5, 9, '#e8e0cc'], ['r', 12, 20, 24, 20, '#4a3a6a'], ['r', 17, 8, 14, 13, '#ece4d0'], ['r', 14, 20, 20, 4, '#6a5a8a'],
    ['r', 38, 10, 3, 34, '#d8dde8'], ['r', 36, 30, 7, 3, '#f2c14e'], ['r', 2, 22, 10, 14, '#9a2f4a'], ['r', 14, 4, 20, 5, '#f2c14e'], ['t', 14, 4, 15, -1, 19, 4, '#f2c14e'], ['t', 21, 4, 24, -3, 27, 4, '#f2c14e'], ['t', 29, 4, 33, -1, 34, 4, '#f2c14e'],
    ['kr', 19, 12, 4, 4, '#1b1626'], ['kr', 26, 12, 4, 4, '#1b1626'], ['kp', 20, 13, '#7af0ff'], ['kp', 27, 13, '#7af0ff'], ['kr', 20, 18, 9, 1, '#1b1626'], ['kr', 22, 17, 1, 3, '#ece4d0'], ['kr', 25, 17, 1, 3, '#ece4d0'],
    ['kr', 14, 26, 20, 2, '#f2c14e'], ['kr', 21, 24, 6, 6, '#7af0ff'], ['kr', 4, 26, 6, 2, '#f2c14e'], ['kr', 4, 31, 6, 2, '#f2c14e'], ['kp', 24, 6, '#e8503a']
  ] };
  C.undertow = { size: 48, parts: [
    ['e', 24, 30, 20, 16, '#1a1030'], ['e', 24, 20, 12, 12, '#2a1a48'], ['e', 12, 36, 8, 8, '#2a1a48'], ['e', 36, 36, 8, 8, '#2a1a48'],
    ['t', 8, 20, 2, 8, 14, 16, '#2a1a48'], ['t', 40, 20, 46, 8, 34, 16, '#2a1a48'],
    ['kr', 16, 18, 6, 5, '#ffffff'], ['kr', 27, 18, 6, 5, '#ffffff'], ['kr', 18, 19, 3, 4, '#a070ff'], ['kr', 29, 19, 3, 4, '#a070ff'],
    ['ke', 24, 34, 8, 3, '#4a2a78'], ['kl', 10, 38, 38, 38, '#5a3a98'], ['kl', 12, 42, 36, 42, '#5a3a98'], ['kp', 6, 12, '#a070ff'], ['kp', 42, 14, '#a070ff'], ['kp', 24, 6, '#a070ff'], ['kr', 20, 28, 9, 2, '#c8a0ff']
  ] };

  var cCache = {};
  art.creature = function (id, flip) {
    var key = id + (flip ? 'f' : 'n'), c = cCache[key];
    if (c) return c;
    var d = C[id]; if (!d) d = C.shade;
    var tmp = art.hdCanvas(d.size + 4, d.size + 4), tx = tmp.getContext('2d');
    tx.translate(2, 2);
    art.drawParts(tx, d.parts, 1);
    c = art.hdCanvas(d.size + 4, d.size + 4);
    var x = c.getContext('2d');
    if (flip) { x.translate(d.size + 4, 0); x.scale(-1, 1); }
    x.drawImage(tmp, 0, 0);
    cCache[key] = c;
    return c;
  };
  var iCache = {};
  art.creatureIcon = function (id) {
    var c = iCache[id]; if (c) return c;
    var src = art.creature(id, false), d = C[id] || C.shade;
    c = art.hdCanvas(16, 16);
    var x = c.getContext('2d');
    x.drawImage(src, 0, 0, src.width, src.height, 0, 0, 16, 16);
    iCache[id] = c; return c;
  };
})(FP);
