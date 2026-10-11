/* The Fractured Path: hand-built character bodies, drawn as shaded shapes at full resolution.
   One builder serves every hero, villain, ally and townsperson through a "look" object. */
(function (FP) {
  'use strict';
  var art = FP.art, mix = art.mix;
  var SKIN = art.SKIN;

  function o(x, y, rx, ry, c) { return ['o', x, y, rx, ry, c]; }
  function b(x, y, w, h, r, c) { return ['b', x, y, w, h, r, c]; }
  function q(pts, c, sm) { return ['q', pts, c, sm ? 1 : 0]; }
  function ko(x, y, rx, ry, c) { return ['ko', x, y, rx, ry, c]; }
  function kb(x, y, w, h, r, c) { return ['kb', x, y, w, h, r, c]; }
  function kq(pts, c, sm) { return ['kq', pts, c, sm ? 1 : 0]; }
  function st(x1, y1, cx, cy, x2, y2, w, c) { return ['s', x1, y1, cx, cy, x2, y2, w, c]; }
  function gl(x, y, r, c, a) { return ['g', x, y, r, c, a]; }
  function kgl(x, y, r, c, a) { return ['kg', x, y, r, c, a]; }
  function sh(c, t) { return mix(c, '#10081e', t == null ? 0.3 : t); }
  function li(c, t) { return mix(c, '#ffffff', t == null ? 0.3 : t); }
  var WOOD = '#8a5a38', STEEL = '#dfe5f2';

  /* ---------- held items ---------- */
  function holdParts(L, hx, hy, P, dir) {
    var hd = L.hold; if (!hd) return;
    var tc = L.trim || '#f2c14e', hc = L.holdc;
    if (hd === 'staff') {
      var oc = L.orb || '#7af0ff';
      P.push(b(hx - 0.45, -1.5, 0.95, 16.5, 0.45, WOOD));
      P.push(o(hx, -2.4, 1.7, 1.7, oc), kgl(hx, -2.4, 5.2, oc, 0.55), ko(hx - 0.5, -3, 0.5, 0.4, '#ffffff'));
      P.push(kb(hx - 0.9, 0.2, 1.9, 0.6, 0.3, tc));
    } else if (hd === 'sword') {
      var bl = hc || STEEL;
      P.push(b(hx - 0.55, 0.6, 1.1, 11.2, 0.5, bl));
      P.push(q([[hx - 0.55, 0.9], [hx, -0.8], [hx + 0.55, 0.9]], bl));
      P.push(b(hx - 1.7, 11.5, 3.4, 0.95, 0.4, tc), b(hx - 0.45, 12.4, 0.9, 2.3, 0.3, WOOD), o(hx, 14.9, 0.7, 0.7, tc));
      P.push(st(hx, 1.5, hx, 5, hx, 10.5, 0.2, 'rgba(255,255,255,0.7)'));
      if (hc) P.push(kgl(hx, 5, 4.6, hc, 0.32));
    } else if (hd === 'rapier') {
      var bl2 = hc || '#eef2fa';
      P.push(b(hx - 0.28, 0.2, 0.56, 11.6, 0.28, bl2), o(hx, 11.9, 1.5, 0.75, tc), b(hx - 0.4, 12.5, 0.8, 2.2, 0.3, '#5a3a28'), o(hx, 14.9, 0.55, 0.55, tc));
      P.push(st(hx, 0.8, hx, 6, hx, 11, 0.16, 'rgba(255,255,255,0.8)'));
      if (hc) P.push(kgl(hx, 6, 4.4, hc, 0.3));
    } else if (hd === 'warblade') {
      var bw = hc || '#5a5a76';
      P.push(b(hx - 0.8, -1.2, 1.6, 12.6, 0.5, bw), q([[hx - 0.8, -0.9], [hx, -2.4], [hx + 0.8, -0.9]], bw));
      P.push(b(hx - 2, 11.3, 4, 1, 0.4, tc), b(hx - 0.5, 12.3, 1, 2.6, 0.3, '#2a2230'), o(hx, 15.1, 0.8, 0.8, tc));
      P.push(st(hx - 0.2, -0.5, hx - 0.2, 5, hx - 0.2, 10.5, 0.25, L.trim || '#a070ff'), kgl(hx, 5, 5, L.trim || '#a070ff', 0.3));
    } else if (hd === 'lantern') {
      var lc = hc || '#ffe27a';
      P.push(b(hx - 0.35, 1.5, 0.8, 12.5, 0.4, WOOD));
      P.push(b(hx - 1.6, 9.2, 3.2, 0.7, 0.3, '#3a3a4a'), b(hx - 1.5, 9.8, 3, 3.4, 0.7, '#2a2a38'), ko(hx, 11.5, 0.95, 1.2, lc), b(hx - 1.6, 13.1, 3.2, 0.6, 0.3, '#3a3a4a'));
      P.push(kgl(hx, 11.4, 6.5, lc, 0.55), ko(hx - 0.2, 11.1, 0.35, 0.5, '#ffffff'), b(hx - 0.7, 8.6, 1.4, 0.8, 0.3, '#3a3a4a'));
    } else if (hd === 'bow') {
      P.push(q([[hx - 1, 1.8], [hx + 1.2, 5], [hx + 1.4, 8.5], [hx - 0.6, 14], [hx + 0.2, 8.5], [hx + 0.1, 5]], hc || '#c8a060', true));
      P.push(st(hx - 1, 1.9, hx - 1.2, 8, hx - 0.6, 13.9, 0.2, '#f4f4f4'));
    } else if (hd === 'hammer') {
      P.push(b(hx - 0.45, 5.5, 0.9, 9.5, 0.4, WOOD), b(hx - 2.5, 2.6, 5, 3.4, 0.7, '#6a6a7a'), kb(hx - 2.3, 2.8, 4.6, 0.6, 0.3, '#a0a0b0'));
    } else if (hd === 'axe') {
      P.push(b(hx - 0.45, 1.5, 0.95, 13.5, 0.4, WOOD));
      P.push(q([[hx + 0.3, 2.2], [hx + 3.4, 1.6], [hx + 3.9, 5.2], [hx + 0.3, 6.6], [hx + 1.6, 4.4]], hc || '#cfd4e0', true));
      P.push(q([[hx - 0.3, 2.6], [hx - 2.8, 2.2], [hx - 3.1, 5.4], [hx - 0.3, 6.2], [hx - 1.3, 4.4]], hc || '#cfd4e0', true));
    } else if (hd === 'dagger') {
      P.push(b(hx - 0.45, 8.8, 0.9, 4.4, 0.4, hc || '#dfe5f2'), q([[hx - 0.45, 9], [hx, 7.6], [hx + 0.45, 9]], hc || '#dfe5f2'), b(hx - 1.2, 13.1, 2.4, 0.8, 0.3, '#4a4a58'), b(hx - 0.35, 13.9, 0.7, 1.4, 0.3, '#2a2230'));
    } else if (hd === 'book') {
      var bc = L.orb || '#8a5ab0';
      P.push(b(hx - 1.9, 9.3, 3.8, 4.5, 0.5, bc), kb(hx - 1.5, 9.8, 3, 3.5, 0.3, '#f4ecd0'), ko(hx, 11.5, 0.8, 0.8, tc), kgl(hx, 11.5, 4, tc, 0.25));
    } else if (hd === 'spear') {
      P.push(b(hx - 0.4, -1.2, 0.85, 17, 0.4, WOOD), q([[hx, -4.4], [hx + 1.3, -1.2], [hx, -0.4], [hx - 1.3, -1.2]], hc || STEEL), b(hx - 0.9, -0.4, 1.8, 0.7, 0.3, tc));
    } else if (hd === 'bell') {
      var bg = hc || '#f2c14e';
      P.push(b(hx - 0.35, 8.2, 0.7, 2, 0.3, WOOD));
      P.push(q([[hx - 2.4, 13.4], [hx - 2, 11], [hx - 1, 9.4], [hx + 1, 9.4], [hx + 2, 11], [hx + 2.4, 13.4]], bg, true), kb(hx - 2.5, 12.9, 5, 0.7, 0.3, li(bg, 0.3)), ko(hx, 14.1, 0.6, 0.6, '#8a6a2a'));
      P.push(kgl(hx, 11.6, 5, bg, 0.3), st(hx - 1, 10.4, hx - 1.4, 11.2, hx - 1.6, 12.2, 0.3, 'rgba(255,255,255,0.7)'));
    } else if (hd === 'bonestaff') {
      var oc2 = L.orb || '#7af0c0';
      P.push(b(hx - 0.45, 0, 0.95, 15, 0.45, '#d8d0b8'), kb(hx - 0.7, 5, 1.5, 0.6, 0.3, '#a89a80'), kb(hx - 0.7, 9, 1.5, 0.6, 0.3, '#a89a80'));
      P.push(o(hx, -2.2, 1.9, 1.7, '#ece4d0'), b(hx - 1, -1.1, 2, 1.4, 0.4, '#d8d0b8'), ko(hx - 0.8, -2.5, 0.5, 0.55, '#1b1626'), ko(hx + 0.8, -2.5, 0.5, 0.55, '#1b1626'), kgl(hx - 0.8, -2.5, 2, oc2, 0.8), kgl(hx + 0.8, -2.5, 2, oc2, 0.8), kgl(hx, -2, 6, oc2, 0.35));
    } else if (hd === 'broom') {
      P.push(b(hx - 0.4, 2, 0.8, 12, 0.4, WOOD), q([[hx - 1.8, 15.6], [hx + 1.8, 15.6], [hx + 0.6, 11.6], [hx - 0.6, 11.6]], '#d8bc60'));
    }
  }

  /* ---------- hats ---------- */
  function hatParts(L, dir, P, bob, hairShow) {
    var hat = L.hat; if (!hat) return;
    var c = L.hatc || '#4a3380', t = L.trim || '#f2c14e', y = bob;
    var d = dir === 'd', s = dir === 'l', u = dir === 'u';
    if (hat === 'pointed') {
      P.push(o(8, 1.5 + y, 7.1, 1.55, c));
      var tipx = s ? 6.6 : 9.2;
      P.push(q([[4.5, 1.8 + y], [s ? 5.4 : 6, -3 + y], [tipx, -9.3 + y], [s ? 10 : 11, -3.4 + y], [11.8, 1.8 + y]], c, true));
      P.push(kb(4.5, 0.55 + y, 7, 1, 0.4, t), kq([[tipx - 0.6, -8.6 + y], [tipx + 0.4, -9.1 + y], [tipx + 1.4, -7.4 + y]], sh(c, 0.35)), ko(8, 1.1 + y, 0.6, 0.6, li(t, 0.4)));
      if (!u) P.push(st(5, 1.3 + y, 8, 2.4 + y, 11.2, 1.3 + y, 0.25, 'rgba(0,0,0,0.28)'));
    } else if (hat === 'hood' || hat === 'cowl') {
      /* back of the hood, shoulders drape, then the rim around the face */
      var top = [[3.2, 5 + y], [3.4, 1.5 + y], [5.6, -0.8 + y], [8, -1.5 + y], [10.4, -0.8 + y], [12.6, 1.5 + y], [12.8, 5 + y]];
      if (u) { P.push(q(top.concat([[12.4, 10], [8, 11], [3.6, 10]]), c, true)); }
      else {
        P.push(q([[3, 6 + y], [3, 9.2], [8, 10.2], [13, 9.2], [13, 6 + y], [11.6, 1 + y], [8, -1.6 + y], [4.4, 1 + y]], c, true));
      }
      P.hoodRim = true;
    } else if (hat === 'cap') {
      P.push(o(8, 1.6 + y, 4.9, 2.7, c));
      if (d) P.push(b(3.6, 2.5 + y, 8.8, 1.1, 0.5, sh(c, 0.12)));
      else if (s) P.push(b(2.4, 2.5 + y, 6, 1.1, 0.5, sh(c, 0.12)));
      P.push(q([[10.6, 0.4 + y], [14.8, -2.6 + y], [13.2, 0.6 + y], [12.2, 2.4 + y]], '#e8503a', true), st(11, 0.8 + y, 13, -0.4 + y, 14.3, -2 + y, 0.2, 'rgba(255,255,255,0.5)'));
    } else if (hat === 'helm' || hat === 'horns') {
      var hs = c;
      P.push(o(8, 2.6 + y, 5.0, 3.5, hs));
      if (d) {
        P.push(b(3, 3.2 + y, 2.1, 5, 0.9, hs), b(10.9, 3.2 + y, 2.1, 5, 0.9, hs), b(7.3, 2.6 + y, 1.4, 4.6, 0.5, sh(hs, 0.1)), kb(5.2, 4.6 + y, 2, 0.7, 0.3, '#14101f'), kb(8.8, 4.6 + y, 2, 0.7, 0.3, '#14101f'));
        P.push(kb(3.4, 2.4 + y, 9.2, 0.7, 0.3, 'rgba(255,255,255,0.22)'));
      } else if (u) { P.push(o(8, 5.2 + y, 5.0, 4, hs)); }
      else { P.push(b(6.2, 3.2 + y, 5, 5, 0.9, hs), kb(3.9, 4.5 + y, 3.4, 0.7, 0.3, '#14101f'), kb(4.5, 2.2 + y, 6, 0.6, 0.3, 'rgba(255,255,255,0.22)')); }
      if (hat === 'horns') {
        var hornc = '#ece4d0';
        if (s) P.push(q([[7, 0.5 + y], [5, -3.4 + y], [2.4, -5.2 + y], [4.4, -1.6 + y]], hornc, true), q([[10, 0.8 + y], [11.6, -3.4 + y], [10.4, -6.2 + y], [9, -2 + y]], hornc, true));
        else P.push(q([[3.6, 1.8 + y], [1.2, -0.6 + y], [0.2, -4.6 + y], [2.8, -1.6 + y]], hornc, true), q([[12.4, 1.8 + y], [14.8, -0.6 + y], [15.8, -4.6 + y], [13.2, -1.6 + y]], hornc, true));
      }
      if (L.plume) P.push(q([[8, -0.6 + y], [9.5, -3.2 + y], [12.4, -2 + y], [11.8, 0.4 + y], [10.4, 0.2 + y]], L.plume, true), st(9, -0.4 + y, 10.5, -2.4 + y, 12, -1.6 + y, 0.2, 'rgba(255,255,255,0.4)'));
    } else if (hat === 'crown') {
      P.push(b(4.9, 0.1 + y, 6.2, 1.8, 0.4, '#f2c14e'), q([[4.9, 0.4 + y], [4.7, -2.4 + y], [6.4, -0.8 + y], [8, -3.3 + y], [9.6, -0.8 + y], [11.3, -2.4 + y], [11.1, 0.4 + y]], '#f2c14e'));
      P.push(ko(8, 1 + y, 0.6, 0.6, '#e8503a'), ko(6, 1 + y, 0.45, 0.45, '#7af0ff'), ko(10, 1 + y, 0.45, 0.45, '#7af0ff'));
      if (L.hatc && L.hatc !== '#4a3380') P.push(kb(4.9, 0.1 + y, 6.2, 1.8, 0.4, 'rgba(0,0,0,0)'));
    } else if (hat === 'bandana') {
      P.push(b(3.4, 0.9 + y, 9.2, 2.1, 0.8, c));
      if (s) P.push(q([[11.8, 1.6 + y], [15, 1.8 + y], [14, 3.4 + y], [11.8, 2.8 + y]], c, true));
      else P.push(q([[11.6, 1.8 + y], [14.4, 3.6 + y], [13.4, 4.8 + y], [11.4, 2.8 + y]], c, true));
      P.push(st(4, 1.6 + y, 8, 1.2 + y, 12, 1.6 + y, 0.2, 'rgba(255,255,255,0.3)'));
    } else if (hat === 'straw') {
      P.push(o(8, 2.1 + y, 7.9, 2.0, '#e8d080'), o(8, 0.6 + y, 4.2, 2.4, '#f0dc90'), kb(3.9, 1.3 + y, 8.2, 0.9, 0.3, '#c05a3a'));
      P.push(st(2, 2.2 + y, 8, 3.6 + y, 14, 2.2 + y, 0.2, 'rgba(120,90,30,0.4)'));
    } else if (hat === 'circlet') {
      P.push(kb(3.8, 1.5 + y, 8.4, 0.7, 0.3, '#f2c14e'), ko(8, 1.9 + y, 0.65, 0.65, '#7af0ff'), kgl(8, 1.9 + y, 2.4, '#7af0ff', 0.5));
    } else if (hat === 'embhorns') {
      var ec = c;
      if (s) P.push(q([[7, 0.8 + y], [5.4, -2.6 + y], [4.4, -5 + y], [7, -2.2 + y]], ec, true), q([[9.6, 1 + y], [10.8, -2.2 + y], [11.2, -4.4 + y], [10.8, -1.6 + y]], ec, true));
      else P.push(q([[4.4, 1.6 + y], [2.6, -1.4 + y], [3, -5.4 + y], [5.4, -1.4 + y]], ec, true), q([[11.6, 1.6 + y], [13.4, -1.4 + y], [13, -5.4 + y], [10.6, -1.4 + y]], ec, true));
      P.push(kgl(8, -1.6 + y, 6, ec, 0.28));
    }
    if (L.halo) {
      var hy = (hat === 'pointed' ? -10.4 : -3.4) + y;
      P.push(st(4.4, hy, 8, hy - 2.1, 11.6, hy, 0.65, L.halo), st(4.4, hy, 8, hy + 1.6, 11.6, hy, 0.65, L.halo), kgl(8, hy - 0.3, 7.5, L.halo, 0.4));
    }
  }

  /* ---------- hair ---------- */
  function hairBack(L, dir, P, y) {
    var h = L.hair, hs = L.hs | 0;
    if (L.hat === 'hood' || L.hat === 'helm' || L.hat === 'horns' || L.hat === 'cowl') return;
    if (hs === 1) {
      if (dir === 'd') P.push(q([[3.1, 3 + y], [2.8, 8.5], [3.4, 11.8], [5.2, 10.6], [10.8, 10.6], [12.6, 11.8], [13.2, 8.5], [12.9, 3 + y]], h, true));
      else if (dir === 'l') P.push(q([[7.4, 2 + y], [11.6, 3 + y], [12.4, 8], [11.8, 11.8], [9, 10.6], [8.2, 7]], h, true));
      else P.push(q([[3.1, 3 + y], [2.8, 8.5], [3.4, 12], [8, 12.6], [12.6, 12], [13.2, 8.5], [12.9, 3 + y]], h, true));
    } else if (hs === 3) {
      if (dir === 'l') P.push(q([[10.4, 2 + y], [14.4, 3.6 + y], [15, 8], [13.4, 11], [12.4, 7], [11.4, 4.6 + y]], h, true));
      else if (dir === 'u') P.push(q([[6.6, 4 + y], [9.4, 4 + y], [10.4, 9], [8, 12], [5.6, 9]], h, true));
      else P.push(q([[11.4, 0.8 + y], [14.6, 1.8 + y], [14.4, 6], [12.8, 4.4]], h, true));
    }
  }
  function hairFront(L, dir, P, y) {
    var h = L.hair, hs = L.hs | 0, hl = li(h, 0.32);
    if (L.hat === 'hood' || L.hat === 'helm' || L.hat === 'horns' || L.hat === 'cowl') return;
    var capHat = L.hat === 'cap' || L.hat === 'pointed' || L.hat === 'straw' || L.hat === 'bandana' || L.hat === 'crown';
    if (dir === 'd') {
      if (hs === 2) P.push(q([[3.4, 4.8 + y], [3.2, 1.6 + y], [4.6, -1.6 + y], [5.8, 0.6 + y], [7.2, -2.6 + y], [8.6, 0.2 + y], [10.2, -2.4 + y], [10.8, 0.6 + y], [12.6, -0.8 + y], [12.8, 2 + y], [12.6, 4.8 + y], [11.4, 3.2 + y], [9.6, 2.2 + y], [8.2, 3 + y], [6.6, 1.8 + y], [4.6, 3 + y]], h));
      else P.push(q([[3.4, 5 + y], [3.2, 2.2 + y], [5, -0.2 + y], [8, -1 + y], [11, -0.2 + y], [12.8, 2.2 + y], [12.6, 5 + y], [11.7, 3.4 + y], [10.2, 2.3 + y], [8.8, 3.2 + y], [7.6, 2 + y], [6, 3.1 + y], [4.6, 3.8 + y]], h, true));
      P.push(st(5.4, 0.4 + y, 8, -0.7 + y, 10.6, 0.5 + y, 0.4, hl), st(4.6, 2.2 + y, 5.6, 1 + y, 6.8, 0.6 + y, 0.25, hl));
    } else if (dir === 'u') {
      P.push(q([[3.2, 6 + y], [3.2, 2 + y], [5, -0.2 + y], [8, -1 + y], [11, -0.2 + y], [12.8, 2 + y], [12.8, 6 + y], [11, 8.2 + y], [8, 8.8 + y], [5, 8.2 + y]], h, true));
      P.push(st(5, 1 + y, 8, -0.2 + y, 11, 1 + y, 0.4, hl), st(8, 1 + y, 8.4, 4 + y, 8, 8 + y, 0.2, sh(h, 0.3)));
      if (hs === 2) P.push(q([[3.4, 2 + y], [4.6, -2 + y], [6.2, 0.4 + y], [8, -2.8 + y], [9.8, 0.4 + y], [11.4, -2 + y], [12.6, 2 + y]], h));
    } else {
      /* side */
      P.push(q([[4.3, 4 + y], [4.6, 1.8 + y], [6.4, -0.4 + y], [9, -1 + y], [11.6, 0.4 + y], [12.6, 3 + y], [12.4, 6.2 + y], [10.6, 6 + y], [9.4, 3.6 + y], [7.6, 2.2 + y], [5.8, 2.8 + y]], h, true));
      P.push(st(6.4, 0.6 + y, 8.8, -0.4 + y, 11, 0.8 + y, 0.4, hl));
      if (hs === 2) P.push(q([[4.8, 1.6 + y], [5.8, -2 + y], [7.2, 0.2 + y], [8.8, -2.8 + y], [10, 0.2 + y], [11.8, -1.6 + y], [12, 2 + y]], h));
    }
  }

  /* ---------- the body ---------- */
  function build(L, dir, f) {
    var P = [], main = L.main || '#4a78c0', trim = L.trim || '#f2c14e', skin = L.skin || SKIN[0];
    var pants = L.pants || '#4a3a52', boots = L.boots || '#2a2230', eye = L.eye || '#2a2038';
    if (!L.hair) L.hair = '#2a1d1a';
    var dd = dir === 'd', sd = dir === 'l', bk = dir === 'u';
    var step = f === 1 || f === 3, bob = step ? -0.45 : 0, sw = f === 1 ? 1 : f === 3 ? -1 : 0;
    var skShade = mix(skin, '#7a3a2a', 0.2);
    var armSw = sw * 0.6;

    /* effects behind the figure */
    if (L.aura) P.push(gl(8, 7, 12.5, L.aura, 0.36));
    if (L.wings) wings(L, dir, P, bob);
    /* cape behind the body */
    if (L.cape && !bk) {
      var cp = L.cape;
      if (dd) P.push(q([[3.6, 7.8 + bob], [2, 14.8], [5.4, 15.4], [8, 14.6], [10.6, 15.4], [14, 14.8], [12.4, 7.8 + bob]], cp, true));
      else P.push(q([[9.2, 7.8 + bob], [13.4, 10.6 + sw * 0.4], [13, 15.2 + sw * 0.5], [9.4, 14.6]], cp, true));
    }
    if (L.quiver && bk) P.push(q([[4.2, 7.4], [7.6, 7.2], [12.4, 14], [10.4, 14.6]], '#7a4a28', true), kb(9, 10.4, 2, 0.5, 0.2, '#5a3a20'));
    if (L.pack && bk) P.push(b(4.6, 8.4, 6.8, 5.4, 1.6, L.pack), kb(4.6, 10.8, 6.8, 0.5, 0.2, 'rgba(0,0,0,0.3)'));
    var robe = L.robe;

    /* legs and boots */
    if (!robe) {
      if (sd) {
        var fx = 6.2 + sw * 1.4, bx = 7.2 - sw * 1.4;
        P.push(b(bx, 12.6, 2.6, 3.4, 1, sh(pants, 0.18)), b(bx - 0.2, 14.5, 3.4, 1.8, 0.9, sh(boots, 0.15)));
        P.push(b(fx, 12.6, 2.7, 3.4 - (sw ? 0.3 : 0), 1, pants), b(fx - 0.5, 14.4 - (sw ? 0.3 : 0), 3.6, 1.9, 0.9, boots), kb(fx - 0.1, 14.4 - (sw ? 0.3 : 0), 2.8, 0.55, 0.3, li(boots, 0.22)));
      } else {
        var liftL = f === 1 ? 0.7 : 0, liftR = f === 3 ? 0.7 : 0;
        P.push(b(5, 12.6, 2.8, 3.4 - liftL, 1, pants), b(4.8, 14.4 - liftL, 3.2, 1.9, 0.9, boots), kb(4.9, 14.4 - liftL, 3, 0.55, 0.3, li(boots, 0.22)));
        P.push(b(8.2, 12.6, 2.8, 3.4 - liftR, 1, pants), b(8, 14.4 - liftR, 3.2, 1.9, 0.9, boots), kb(8.1, 14.4 - liftR, 3, 0.55, 0.3, li(boots, 0.22)));
      }
    } else {
      if (sd) P.push(b(5.2 + sw * 0.6, 14.6, 3.4, 1.7, 0.8, boots));
      else P.push(b(5, 14.6 + (f === 1 ? -0.5 : 0), 3, 1.7, 0.8, boots), b(8, 14.6 + (f === 3 ? -0.5 : 0), 3, 1.7, 0.8, boots));
    }

    /* far arm in side view */
    if (sd) P.push(b(7.4 - armSw, 8.2 + bob, 2.1, 4.4, 1, sh(main, 0.2)));

    /* torso */
    if (robe) {
      if (sd) P.push(q([[5.4, 7.6 + bob], [10.6, 7.6 + bob], [11.6, 15.4], [4.6, 15.4]], main, true));
      else P.push(q([[4.2, 7.6 + bob], [11.8, 7.6 + bob], [13, 15.4], [3, 15.4]], main, true));
      P.push(kb(sd ? 4.6 : 3, 14.5, sd ? 7 : 10, 0.95, 0.4, trim));
      if (L.sash && !bk) P.push(kb(sd ? 7.4 : 7.1, 8.4 + bob, 1.8, 6.6, 0.6, L.sash), kb(sd ? 5 : 4.3, 11 + bob, sd ? 6 : 7.4, 0.9, 0.4, L.sash));
      else if (!bk) P.push(kb(sd ? 5 : 4.3, 11 + bob, sd ? 6 : 7.4, 0.8, 0.4, sh(main, 0.35)));
      if (dd) P.push(st(5.6, 12.4, 5.2, 14, 4.8, 15, 0.18, 'rgba(0,0,0,0.2)'), st(10.4, 12.4, 10.8, 14, 11.2, 15, 0.18, 'rgba(0,0,0,0.2)'));
    } else {
      var tx = sd ? 5.4 : 4.1, tw = sd ? 5.4 : 7.8;
      P.push(b(tx, 7.4 + bob, tw, 5.9, 1.8, main));
      if (!bk) P.push(kb(tx, 11.5 + bob, tw, 1.1, 0.4, L.belt || sh(main, 0.45)), ko(sd ? 7 : 8, 12.05 + bob, 0.75, 0.6, trim));
      else P.push(kb(tx, 11.5 + bob, tw, 1, 0.4, L.belt || sh(main, 0.45)));
      if (dd) P.push(st(6.2, 7.9 + bob, 8, 9.6 + bob, 9.8, 7.9 + bob, 0.5, trim));
    }
    if (L.beads && !bk) { for (var bi = 0; bi < 5; bi++) P.push(ko(5.4 + bi * 1.3, 8.9 + bob + Math.abs(bi - 2) * -0.0 + (bi === 0 || bi === 4 ? 0 : 0.4), 0.42, 0.42, L.beads)); }
    if (L.tabard && !bk && !sd) P.push(kq([[6.2, 8 + bob], [9.8, 8 + bob], [9.4, 12.6], [8, 13.4], [6.6, 12.6]], L.tabard, true), kb(7.5, 9 + bob, 1, 2.4, 0.3, trim), kb(6.8, 9.8 + bob, 2.4, 0.9, 0.3, trim));

    /* arms (front and back views) */
    if (!sd) {
      var la = armSw, ra = -armSw;
      P.push(b(2.3, 8 + bob + la * 0.6, 2.3, 4.6, 1.1, main), kb(2.3, 11.5 + bob + la * 0.6, 2.3, 0.8, 0.3, trim), o(3.45, 13.2 + bob + la * 0.6, 0.95, 0.95, skin));
      P.push(b(11.4, 8 + bob + ra * 0.6, 2.3, 4.6, 1.1, main), kb(11.4, 11.5 + bob + ra * 0.6, 2.3, 0.8, 0.3, trim), o(12.55, 13.2 + bob + ra * 0.6, 0.95, 0.95, skin));
    }
    if (L.mantle) {
      var mc = L.mantle;
      if (sd) P.push(o(8.4, 8.5 + bob, 2.4, 1.7, mc), kb(6.6, 8 + bob, 3.6, 0.5, 0.2, 'rgba(255,255,255,0.35)'));
      else P.push(o(3.9, 8.6 + bob, 2.5, 1.8, mc), o(12.1, 8.6 + bob, 2.5, 1.8, mc), kb(2.5, 8 + bob, 3.2, 0.5, 0.2, 'rgba(255,255,255,0.35)'), kb(10.3, 8 + bob, 3.2, 0.5, 0.2, 'rgba(255,255,255,0.35)'));
      if (L.spikes) { if (sd) P.push(q([[7.6, 7.6 + bob], [8.4, 4.6 + bob], [9.4, 7.6 + bob]], '#dfe5f2')); else P.push(q([[2.6, 7.6 + bob], [3.4, 4.4 + bob], [4.8, 7.4 + bob]], '#dfe5f2'), q([[11.2, 7.4 + bob], [12.6, 4.4 + bob], [13.4, 7.6 + bob]], '#dfe5f2')); }
    }
    if (L.shield && !bk) {
      var sc = L.shield;
      if (sd) P.push(q([[5.2, 8.4 + bob], [8.2, 8.4 + bob], [8.2, 12.2 + bob], [6.7, 14 + bob], [5.2, 12.2 + bob]], sc, true), kq([[6.1, 9.4 + bob], [7.3, 9.4 + bob], [7.3, 11.2 + bob], [6.7, 11.8 + bob], [6.1, 11.2 + bob]], trim));
      else P.push(q([[0.5, 8.2 + bob], [4.9, 8.2 + bob], [4.9, 12.2 + bob], [2.7, 14.4 + bob], [0.5, 12.2 + bob]], sc, true), kq([[1.6, 9.3 + bob], [3.8, 9.3 + bob], [3.8, 11.6 + bob], [2.7, 12.6 + bob], [1.6, 11.6 + bob]], trim), kb(2.5, 9.6 + bob, 0.4, 2.4, 0.2, sc), kgl(2.7, 10.8 + bob, 3, trim, 0.2));
    }

    /* head */
    var hy = bob;
    var rimHat = L.hat === 'hood' || L.hat === 'cowl';
    if (rimHat && !bk) { var tmp = []; hatParts(L, dir, tmp, hy); P = P.concat(tmp.filter(function (p) { return p !== true; })); }
    hairBack(L, dir, P, hy);
    P.push(b(sd ? 7 : 6.9, 7.5 + hy, 2.1, 1.5, 0.5, skShade));
    if (dd) {
      if (!rimHat) P.push(o(3.55, 5.2 + hy, 0.95, 1.2, skin), o(12.45, 5.2 + hy, 0.95, 1.2, skin));
      P.push(o(8, 4.7 + hy, 4.65, 4.35, skin));
    } else if (sd) {
      P.push(o(8.5, 4.7 + hy, 4.3, 4.35, skin));
      if (!rimHat) P.push(o(9.8, 5.5 + hy, 0.95, 1.3, skShade), kb(9.5, 5.1 + hy, 0.5, 0.9, 0.2, sh(skin, 0.4)));
      P.push(ko(3.95, 5.9 + hy, 0.55, 0.55, skin));
    } else {
      P.push(o(8, 4.6 + hy, 4.65, 4.3, bk && L.hair ? L.hair : skin));
    }
    /* face */
    var masked = L.hat === 'cowl';
    if (dd) {
      var ey = 5.3 + hy, ec = L.glow || eye;
      P.push(['kE', 6, ey, ec, 1], ['kE', 10, ey, ec, 1]);
      if (L.glow) P.push(kgl(6, ey, 2.6, L.glow, 0.7), kgl(10, ey, 2.6, L.glow, 0.7));
      P.push(st(4.8, 3.7 + hy, 5.9, 3.2 + hy, 7.1, 3.6 + hy, 0.32, sh(L.hair, 0.1)), st(8.9, 3.6 + hy, 10.1, 3.2 + hy, 11.2, 3.7 + hy, 0.32, sh(L.hair, 0.1)));
      if (!masked) {
        P.push(st(7.2, 7.15 + hy, 8, 7.55 + hy, 8.8, 7.15 + hy, 0.3, '#8a3a34'), ko(8, 6.2 + hy, 0.3, 0.25, skShade));
        P.push(ko(4.9, 6.5 + hy, 0.95, 0.55, 'rgba(255,110,110,0.26)'), ko(11.1, 6.5 + hy, 0.95, 0.55, 'rgba(255,110,110,0.26)'));
      } else { P.push(b(4, 6.1 + hy, 8, 3, 1.2, L.hatc || '#1f2430'), st(4.4, 6.5 + hy, 8, 7.1 + hy, 11.6, 6.5 + hy, 0.25, 'rgba(255,255,255,0.2)')); }
      if (L.scar) P.push(st(5.2, 2.8 + hy, 6.4, 5, 7.4, 7.2 + hy, 0.3, '#b04040'));
      if (L.beard) P.push(q([[4.5, 6.4 + hy], [4.9, 8.6 + hy], [8, 10.8 + hy], [11.1, 8.6 + hy], [11.5, 6.4 + hy], [10, 7.5 + hy], [8, 7.2 + hy], [6, 7.5 + hy]], L.beard, true));
    } else if (sd) {
      var ec2 = L.glow || eye;
      P.push(['kE', 5.9, 5.3 + hy, ec2, 1]);
      if (L.glow) P.push(kgl(5.9, 5.3 + hy, 2.6, L.glow, 0.7));
      P.push(st(4.9, 3.7 + hy, 5.8, 3.2 + hy, 7, 3.6 + hy, 0.32, sh(L.hair, 0.1)));
      if (!masked) P.push(st(4.9, 7.2 + hy, 5.5, 7.5 + hy, 6.2, 7.2 + hy, 0.3, '#8a3a34'), ko(5.2, 6.7 + hy, 0.8, 0.5, 'rgba(255,110,110,0.24)'));
      else P.push(b(3.9, 6.2 + hy, 5.2, 2.9, 1.1, L.hatc || '#1f2430'));
      if (L.scar) P.push(st(5, 3 + hy, 5.6, 5, 6.2, 7 + hy, 0.3, '#b04040'));
      if (L.beard) P.push(q([[4.1, 6.5 + hy], [4.8, 8.4 + hy], [7.6, 10.4 + hy], [10, 8 + hy], [9.4, 6.4 + hy], [7.4, 7.4 + hy], [5.4, 7.2 + hy]], L.beard, true));
    }
    if (!rimHat) hairFront(L, dir, P, hy);
    if (rimHat && !bk) {
      /* the hood front framing the face */
      var hc = L.hatc || '#4a3380';
      if (dd) P.push(q([[3, 6.6 + hy], [3, 3 + hy], [4.8, -0.6 + hy], [8, -1.8 + hy], [11.2, -0.6 + hy], [13, 3 + hy], [13, 6.6 + hy], [12, 4 + hy], [10.6, 2 + hy], [8, 1.2 + hy], [5.4, 2 + hy], [4, 4 + hy]], hc, true), st(4.6, 3.4 + hy, 8, 0.6 + hy, 11.4, 3.4 + hy, 0.35, 'rgba(0,0,0,0.3)'));
      else P.push(q([[4.6, 6.8 + hy], [4.6, 3 + hy], [6, -0.2 + hy], [9, -1.8 + hy], [12, -0.4 + hy], [13, 4 + hy], [12.8, 8 + hy], [10.8, 6 + hy], [9.4, 3 + hy], [7.4, 1.8 + hy], [5.8, 2.6 + hy]], hc, true), st(6, 2.4 + hy, 8.5, 0.2 + hy, 11, 1.8 + hy, 0.35, 'rgba(0,0,0,0.3)'));
    } else if (rimHat && bk) { var tmp2 = []; hatParts(L, dir, tmp2, hy); P = P.concat(tmp2); }
    if (!rimHat) hatParts(L, dir, P, hy);

    /* cape over the back */
    if (L.cape && bk) {
      var cp2 = L.cape;
      P.push(q([[3.4, 7.6 + bob], [2.4, 15.4], [5.4, 16], [8, 15.2], [10.6, 16], [13.6, 15.4], [12.6, 7.6 + bob]], cp2, true), st(5.6, 9 + bob, 5.2, 12, 4.8, 15, 0.25, sh(cp2, 0.35)), st(10.4, 9 + bob, 10.8, 12, 11.2, 15, 0.25, sh(cp2, 0.35)), st(8, 9.4 + bob, 8, 12, 8, 15, 0.22, sh(cp2, 0.3)));
    }
    /* held item in the right hand */
    var hx = dd ? 12.9 : bk ? 12.9 : 5.1, hyy = bob + (sd ? sw * 0.5 : 0);
    var hp = [];
    if (L.hold) {
      holdParts(L, hx, 0, hp, dir);
      if (sd) P.push(b(5.9 - armSw, 8.2 + bob, 2.3, 4.4, 1.1, main), kb(5.9 - armSw, 11.4 + bob, 2.3, 0.8, 0.3, trim), o(7.05 - armSw, 13.1 + bob, 0.95, 0.95, skin));
      P = P.concat(hp.map(function (p) { return p; }));
      if (dd || bk) P.push(o(hx, 13.2 + bob, 1.0, 1.0, skin));
      if (sd) P.push(o(hx + 0.2, 13.0 + bob, 1.0, 1.0, skin));
    } else if (sd) {
      P.push(b(5.9 - armSw, 8.2 + bob, 2.3, 4.4, 1.1, main), kb(5.9 - armSw, 11.4 + bob, 2.3, 0.8, 0.3, trim), o(7.05 - armSw, 13.1 + bob, 0.95, 0.95, skin));
    }
    if (L.orbs) { var oc = L.orbs, tt = f * 0.9; P.push(kgl(1.4, 5 - Math.sin(tt) * 0.4, 3, oc, 0.7), ko(1.4, 5 - Math.sin(tt) * 0.4, 0.8, 0.8, '#ffffff'), kgl(14.6, 3.6 + Math.sin(tt) * 0.4, 3, oc, 0.7), ko(14.6, 3.6 + Math.sin(tt) * 0.4, 0.8, 0.8, '#ffffff')); }
    return P;
  }

  function wings(L, dir, P, bob) {
    var c = L.wingc || '#f4f0ff', kind = L.wings;
    if (dir === 'l') { P.push(q([[9, 7], [14.6, 1.6], [16.4, 6], [15, 10.4], [11, 11]], c, true)); return; }
    if (kind === 'bat' || kind === 'ember') {
      P.push(q([[4.4, 8], [-1, 1.6], [-3.6, 4], [-2.4, 6.6], [-3.8, 9.4], [-0.6, 10.2], [1, 12.4], [4.4, 11.4]], c, false));
      P.push(q([[11.6, 8], [17, 1.6], [19.6, 4], [18.4, 6.6], [19.8, 9.4], [16.6, 10.2], [15, 12.4], [11.6, 11.4]], c, false));
    } else {
      P.push(q([[4.4, 8.4], [-0.6, 2], [-4, 3.6], [-3.4, 8], [-1, 10.8], [3.6, 12]], c, true), q([[11.6, 8.4], [16.6, 2], [20, 3.6], [19.4, 8], [17, 10.8], [12.4, 12]], c, true));
      P.push(st(1, 6, -0.6, 6.6, -2.4, 6, 0.3, sh(c, 0.25)), st(1.6, 8.4, 0, 9, -1.8, 8.6, 0.3, sh(c, 0.25)), st(15, 6, 16.6, 6.6, 18.4, 6, 0.3, sh(c, 0.25)), st(14.4, 8.4, 16, 9, 17.8, 8.6, 0.3, sh(c, 0.25)));
    }
    P.push(kgl(8, 6, 10, c, 0.16));
  }


  /* ---------- class looks: base forms and their ascended variants ---------- */
  var CL = art.CLASS_LOOK;
  function look(o) { return o; }
  /* hero */
  CL.vanguard = look({ main: '#7a86a8', trim: '#e8d8a0', pants: '#4a5270', boots: '#3a3040', mantle: '#b4bed4', shield: '#3d68b8', hold: 'sword', cape: '#c0504a', tabard: '#3d68b8' });
  CL.paladin = look({ main: '#eceaf6', trim: '#f2c14e', pants: '#9aa4c0', boots: '#6a6a88', mantle: '#f2e8c0', shield: '#f4f0ff', hold: 'sword', holdc: '#fff2b0', cape: '#e8b83a', hat: 'helm', hatc: '#eceaf6', plume: '#f2c14e', halo: '#ffe27a', aura: '#fff0a0', tabard: '#f2c14e' });
  CL.warlord = look({ main: '#56688a', trim: '#d8a23a', pants: '#34344a', boots: '#2a2a3a', mantle: '#8a96b0', spikes: true, hold: 'sword', holdc: '#c8d0e0', cape: '#8a2030', hat: 'helm', hatc: '#66779a', plume: '#c0504a', tabard: '#8a2030', aura: '#ff6a5a' });
  CL.spellwright = look({ main: '#6a4aa8', trim: '#f2c14e', robe: true, hat: 'pointed', hatc: '#4a3380', hold: 'staff', orb: '#7af0ff', sash: '#f2c14e' });
  CL.archmage = look({ main: '#2a3a8a', trim: '#f2d06a', robe: true, hat: 'pointed', hatc: '#1f2a6a', hold: 'staff', orb: '#ffffff', sash: '#f2d06a', cape: '#1a2260', orbs: '#7aa0ff', aura: '#7aa0ff' });
  CL.runeblade = look({ main: '#3a4a78', trim: '#7af0ff', pants: '#2a3050', boots: '#222640', mantle: '#5a6a98', hat: 'circlet', hold: 'sword', holdc: '#7af0ff', cape: '#2a3a68', aura: '#7af0ff' });
  CL.wayfinder = look({ main: '#4a8a4a', trim: '#e8d080', pants: '#6a5a3a', boots: '#4a3a28', hat: 'cap', hatc: '#3a6a3a', hold: 'bow', cape: '#8a6a3a', quiver: true, pack: '#7a5a38' });
  CL.beastmaster = look({ main: '#7a5a34', trim: '#e8c870', pants: '#4a3a2a', boots: '#3a2a1c', mantle: '#c8a878', hat: 'bandana', hatc: '#c05a3a', hold: 'spear', cape: '#4a6a3a', pack: '#7a5a38', orbs: '#ffd890' });
  CL.stormranger = look({ main: '#3a5a9a', trim: '#7ab0e8', pants: '#2a3a68', boots: '#222a48', hat: 'cap', hatc: '#2a4a8a', hold: 'bow', holdc: '#9ad0ff', cape: '#2a3a6a', quiver: true, aura: '#9ad0ff', orbs: '#d8f0ff' });
  CL.lampbearer = look({ main: '#f0ecd8', trim: '#f2c14e', robe: true, hat: 'hood', hatc: '#f0ecd8', hold: 'lantern', sash: '#7ad6e0' });
  CL.embersaint = look({ main: '#f6e8d0', trim: '#ff9a3a', robe: true, hat: 'hood', hatc: '#e0703a', hold: 'lantern', holdc: '#ffb060', sash: '#ff9a3a', cape: '#f2a050', halo: '#ff9a3a', aura: '#ffb060' });
  CL.dawnkeeper = look({ main: '#e8f0f8', trim: '#f2c14e', robe: true, pants: '#8a96b0', hat: 'helm', hatc: '#e8f0f8', hold: 'lantern', holdc: '#fff0a0', shield: '#e8f0f8', mantle: '#b4c8d8', cape: '#3a8aa8', aura: '#fff0a0' });
  CL.duelist = look({ main: '#c8506a', trim: '#f2e0a0', pants: '#3a3040', boots: '#2a2030', hat: 'cap', hatc: '#a83a58', hold: 'rapier', cape: '#3a2a4a' });
  CL.windblade = look({ main: '#3aa890', trim: '#e8fff8', pants: '#24485a', boots: '#1c3442', hat: 'bandana', hatc: '#8affe8', hold: 'rapier', holdc: '#cfffff', cape: '#2a6a78', aura: '#a0fff0' });
  CL.miragefencer = look({ main: '#7a5ac0', trim: '#ffd0f0', pants: '#3a2a68', boots: '#241a48', hat: 'cap', hatc: '#5a3a98', hold: 'rapier', holdc: '#e8d8ff', cape: '#3a2a68', aura: '#c8a0ff', orbs: '#e8d0ff' });
  CL.bellringer = look({ main: '#e8d8f0', trim: '#f2c14e', robe: true, hat: 'hood', hatc: '#b890d8', hold: 'bell', sash: '#b890d8' });
  CL.chimemaster = look({ main: '#f4e8ff', trim: '#ffd05a', robe: true, hat: 'circlet', hold: 'bell', holdc: '#ffd05a', sash: '#d8b0f0', cape: '#b890d8', orbs: '#ffd05a', halo: '#ffd05a' });
  CL.dirgekeeper = look({ main: '#34345a', trim: '#8ac0ff', robe: true, hat: 'hood', hatc: '#24243e', hold: 'bell', holdc: '#7a8ab8', sash: '#8ac0ff', aura: '#6a8aff', cape: '#1a1a30' });
  /* villain */
  CL.reaver = look({ main: '#7a2a2a', trim: '#d8a23a', pants: '#3a2a2a', boots: '#2a1a1a', mantle: '#3a3a48', spikes: true, hat: 'horns', hatc: '#5a5a6a', hold: 'axe', cape: '#2a1a1a' });
  CL.warbringer = look({ main: '#8a2a1a', trim: '#ffb03a', pants: '#3a2220', boots: '#241410', mantle: '#4a2a2a', spikes: true, hat: 'horns', hatc: '#3a2a2a', hold: 'axe', holdc: '#e0a080', cape: '#4a1a0a', aura: '#ff5a2a' });
  CL.bloodtyrant = look({ main: '#5a0f2a', trim: '#d8a23a', pants: '#2a1018', boots: '#1a0a10', mantle: '#2a1a2a', spikes: true, hat: 'crown', hold: 'sword', holdc: '#ff6a8a', cape: '#7a0f3a', aura: '#ff2a5a', beard: null });
  CL.hexcaster = look({ main: '#3a2a5a', trim: '#c070ff', robe: true, hat: 'hood', hatc: '#2a1f48', hold: 'staff', orb: '#c070ff', glow: '#ff6ad8', sash: '#c070ff' });
  CL.plaguelord = look({ main: '#4a5a2a', trim: '#c8d84a', robe: true, hat: 'hood', hatc: '#2a3a1a', hold: 'staff', orb: '#b8e03a', glow: '#d8ff6a', sash: '#c8d84a', cape: '#2a3a1a', aura: '#9ac83a', orbs: '#b8e03a' });
  CL.voidwitch = look({ main: '#1e1236', trim: '#c070ff', robe: true, hat: 'hood', hatc: '#120a22', hold: 'staff', orb: '#4a1a8a', glow: '#e8a0ff', sash: '#c070ff', aura: '#8a50ff', wings: 'ethereal', wingc: '#3a1a6a', orbs: '#a070ff' });
  CL.shade = look({ main: '#2e3446', trim: '#7be0c9', pants: '#1f2430', boots: '#14181f', hat: 'cowl', hatc: '#1f2430', hold: 'dagger', cape: '#1a1f2a' });
  CL.nightblade = look({ main: '#1a2030', trim: '#7be0c9', pants: '#141a26', boots: '#0e1219', hat: 'cowl', hatc: '#161c2a', hold: 'dagger', holdc: '#cfe8ff', cape: '#10141c', glow: '#7be0c9' });
  CL.phantom = look({ main: '#c8d0e8', trim: '#ffffff', pants: '#8a9ac0', boots: '#6a7aa0', hat: 'cowl', hatc: '#aab8d8', hold: 'dagger', holdc: '#ffffff', cape: '#8a9ac0', aura: '#c8e0ff', glow: '#aaccff', orbs: '#e0f0ff' });
  CL.cinderbinder = look({ main: '#5a5058', trim: '#ff7a3d', pants: '#3a3238', boots: '#241e22', mantle: '#a89aa8', hat: 'embhorns', hatc: '#ff7a3d', hold: 'staff', orb: '#ff7a3d', beads: '#ff7a3d' });
  CL.emberlord = look({ main: '#4a2a2a', trim: '#ff9a3a', pants: '#2a1a1a', boots: '#1a1010', mantle: '#7a4a3a', hat: 'embhorns', hatc: '#ff7a3d', hold: 'staff', orb: '#ff5a1a', cape: '#8a2a0a', aura: '#ff7a3d', beads: '#ffd03a', spikes: true });
  CL.phoenixbinder = look({ main: '#f0a040', trim: '#fff2a0', robe: true, hat: 'embhorns', hatc: '#ffd03a', hold: 'staff', orb: '#ffd03a', wings: 'ember', wingc: '#ff7a3d', sash: '#fff2a0', aura: '#ffb03a', beads: '#fff2a0' });
  CL.blightknight = look({ main: '#3a3a48', trim: '#a070ff', pants: '#2a2a38', boots: '#1c1c28', mantle: '#5a5a6a', hat: 'helm', hatc: '#3a3a48', hold: 'warblade', shield: '#4a2a5a', cape: '#2a1a3a' });
  CL.deathknight = look({ main: '#22202e', trim: '#6ac8ff', pants: '#181622', boots: '#100e18', mantle: '#38364a', spikes: true, hat: 'horns', hatc: '#22202e', hold: 'warblade', holdc: '#2a3a5a', cape: '#10101a', aura: '#6ac8ff', glow: '#6ac8ff' });
  CL.doomherald = look({ main: '#3a1a4a', trim: '#ff6ad8', pants: '#24102e', boots: '#180a20', mantle: '#5a2a6a', hat: 'helm', hatc: '#2a1a3a', plume: '#ff6ad8', hold: 'bell', holdc: '#a050c0', cape: '#5a1a6a', aura: '#ff6ad8', glow: '#ff6ad8' });
  CL.bonewright = look({ main: '#cfc8b8', trim: '#7af0c0', robe: true, hat: 'hood', hatc: '#8a8478', hold: 'bonestaff', orb: '#7af0c0', sash: '#7af0c0' });
  CL.lich = look({ main: '#1a2a3a', trim: '#7affd8', robe: true, hat: 'crown', hold: 'bonestaff', orb: '#7affd8', cape: '#10202a', aura: '#7affd8', glow: '#7affd8', skin: '#d8d4c0', skinFixed: true, hair: '#d8d4c0', hs: 0, hatc: '#8affd0', orbs: '#7affd8' });
  CL.ossuaryking = look({ main: '#cfc8b8', trim: '#f2c14e', robe: true, hat: 'crown', hold: 'bonestaff', orb: '#a0d8c0', mantle: '#e8e0cc', spikes: true, cape: '#4a3a2a', aura: '#a0d8c0', sash: '#f2c14e' });

  var baseLookFor = art.lookFor;
  art.lookFor = function (cls, appearance) {
    var base = CL[cls] || CL.vanguard, Lk = {}, k;
    for (k in base) Lk[k] = base[k];
    appearance = appearance || {};
    if (!Lk.skinFixed) Lk.skin = SKIN[appearance.skin | 0] || SKIN[0];
    if (!Lk.skinFixed) { Lk.hair = art.HAIR[appearance.hair | 0] || art.HAIR[0]; Lk.hs = appearance.hs | 0; }
    var acc = art.ACCENTS[appearance.acc | 0] || art.ACCENTS[0];
    var isAsc = FP.D && FP.D.CLASSES && FP.D.CLASSES[cls] && FP.D.CLASSES[cls].asc;
    if (!isAsc) { Lk.trim = acc; if (Lk.sash) Lk.sash = acc; if (Lk.beads) Lk.beads = acc; }
    return Lk;
  };


  /* ---------- portraits: a painted bust, 48 x 48 ---------- */
  var pCache = {};
  art.portrait = function (spec) {
    var key = JSON.stringify(spec), c = pCache[key]; if (c) return c;
    c = art.hdCanvas(48, 48); var g = c.getContext('2d');
    var Lk = spec.look || {}, skin = Lk.skin || SKIN[0], hair = Lk.hair || art.HAIR[0], hs = Lk.hs | 0, main = Lk.main || '#4a78c0', trim = Lk.trim || '#f2c14e';
    var skS = mix(skin, '#7a3a2a', 0.22), skL = mix(skin, '#ffffff', 0.25);
    var bg = spec.bg || ['#2a2f5a', '#5a3a7a'], mood = spec.mood || 'calm', ec = spec.eye || '#3a5a9a';
    if (Lk.glow) ec = Lk.glow;
    /* backdrop */
    var gr = g.createLinearGradient(0, 0, 0, 48); gr.addColorStop(0, bg[0]); gr.addColorStop(1, bg[1]); g.fillStyle = gr; g.fillRect(0, 0, 48, 48);
    var rg = g.createRadialGradient(24, 20, 2, 24, 20, 30); rg.addColorStop(0, 'rgba(255,240,210,0.38)'); rg.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = rg; g.fillRect(0, 0, 48, 48);
    var rr = art.rnd(JSON.stringify(spec.look || {}).length * 13 + 7), i;
    for (i = 0; i < 10; i++) { var bx = rr() * 48, by = rr() * 30, br = 0.6 + rr() * 2; var bgx = g.createRadialGradient(bx, by, 0, bx, by, br * 2); bgx.addColorStop(0, 'rgba(255,255,255,0.35)'); bgx.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = bgx; g.fillRect(bx - br * 2, by - br * 2, br * 4, br * 4); }
    var P = [];
    var hood = Lk.hat === 'hood' || Lk.hat === 'cowl', helm = Lk.hat === 'helm' || Lk.hat === 'horns';
    /* back layers */
    if (Lk.wings) P.push(q([[10, 36], [-4, 22], [-6, 34], [4, 44]], Lk.wingc || '#f4f0ff', true), q([[38, 36], [52, 22], [54, 34], [44, 44]], Lk.wingc || '#f4f0ff', true));
    if (Lk.cape) P.push(q([[8, 48], [10, 34], [18, 30], [30, 30], [38, 34], [40, 48]], Lk.cape, true));
    if (!hood && !helm && hs === 1) P.push(q([[11, 16], [9.4, 30], [10.4, 42], [16, 45], [32, 45], [37.6, 42], [38.6, 30], [37, 16]], hair, true));
    if (!hood && !helm && hs === 3) P.push(o(24, 5.4, 4.6, 4.2, hair));
    if (hood) P.push(q([[7, 48], [8, 28], [12, 12], [24, 3], [36, 12], [40, 28], [41, 48]], Lk.hatc || '#4a3380', true));
    /* shoulders and clothing */
    P.push(q([[2, 48], [4, 40], [11, 35.5], [18, 33.5], [30, 33.5], [37, 35.5], [44, 40], [46, 48]], main, true));
    if (Lk.robe) P.push(kb(21, 35, 6, 13, 1, trim));
    else { P.push(st(17, 34, 24, 40, 31, 34, 1.4, trim)); }
    if (Lk.tabard) P.push(kq([[19, 36], [29, 36], [28, 48], [20, 48]], Lk.tabard, false), kb(23, 38, 2, 7, 0.5, trim));
    if (Lk.mantle) P.push(o(9, 40, 9, 6, Lk.mantle), o(39, 40, 9, 6, Lk.mantle), kb(2, 36.5, 14, 1, 0.5, 'rgba(255,255,255,0.35)'), kb(32, 36.5, 14, 1, 0.5, 'rgba(255,255,255,0.35)'));
    if (Lk.spikes) P.push(q([[4, 38], [2, 26], [10, 36]], '#dfe5f2'), q([[44, 38], [46, 26], [38, 36]], '#dfe5f2'));
    if (Lk.beads) for (i = 0; i < 7; i++) P.push(ko(16 + i * 2.7, 37.5 + Math.abs(i - 3) * -0.3 + 1.2, 1, 1, Lk.beads));
    if (Lk.shield) P.push(kq([[0, 42], [8, 40], [8, 48], [0, 48]], Lk.shield, false));
    /* neck, ears, head */
    P.push(b(19.5, 28, 9, 8.4, 3, skS));
    P.push(o(12.6, 22.5, 2.3, 3.4, skin), o(35.4, 22.5, 2.3, 3.4, skin));
    var hd = [[13.4, 19], [14.2, 13.4], [17.6, 9.4], [24, 8.2], [30.4, 9.4], [33.8, 13.4], [34.6, 19], [34, 25], [31.6, 30.2], [27.4, 33.6], [24, 34.2], [20.6, 33.6], [16.4, 30.2], [14, 25]];
    P.push(q(hd, skin, true));
    /* the face */
    var ey = 22, lx = 18.2, rx = 29.8;
    function eye(cx, flip) {
      P.push(['kq', [[cx - 4, ey], [cx - 2.2, ey - 2.4], [cx + 1.6, ey - 2.4], [cx + 4, ey - 0.4], [cx + 2.4, ey + 2], [cx - 2, ey + 2.2]], '#fbf8ff', 1]);
      P.push(ko(cx + (flip ? -0.2 : 0.2), ey - 0.1, 2.3, 2.4, ec), ko(cx + (flip ? -0.2 : 0.2), ey + 0.1, 1.1, 1.4, '#120c20'), ko(cx - 0.6, ey - 1, 0.8, 0.8, '#ffffff'), ko(cx + 1.2, ey + 1, 0.4, 0.4, 'rgba(255,255,255,0.7)'));
      P.push(st(cx - 4.2, ey + 0.2, cx - 1.6, ey - 3.2, cx + 4.4, ey - 0.8, 0.9, '#1b1626'));
      P.push(st(cx - 3, ey + 2.2, cx, ey + 3, cx + 3, ey + 2, 0.3, 'rgba(120,60,50,0.35)'));
      if (mood === 'hard' || mood === 'cold') P.push(kq([[cx - 4.4, ey - 1.6], [cx + 4.6, ey - 1.6 + (mood === 'hard' ? (flip ? -1.6 : 1.6) * 0 : 0)], [cx + 4.4, ey - 0.4], [cx - 4, ey - 0.2]], skin, false));
    }
    if (spec.eyePatch) { eye(lx, false); P.push(q([[rx - 4.6, ey - 3], [rx + 4.6, ey - 3], [rx + 4.6, ey + 3.6], [rx - 4.6, ey + 3.6]], '#1b1626', true), st(rx + 3, ey - 3, rx + 7, ey - 6, rx + 8, ey - 11, 0.8, '#1b1626')); }
    else { eye(lx, false); eye(rx, true); }
    var bc = spec.brow || hair, ba = mood === 'hard' ? [2.2, 0] : mood === 'sad' ? [-1.8, 0.6] : mood === 'cold' ? [0.8, 0.8] : [0, 0];
    P.push(st(lx - 4, ey - 4.4 + ba[1], lx - 0.5, ey - 6.2 + (ba[0] > 0 ? 0 : ba[0] * 0.2), lx + 4.2, ey - 4.6 + ba[0], 1.1, bc));
    P.push(st(rx - 4.2, ey - 4.6 + ba[0], rx + 0.5, ey - 6.2 + (ba[0] > 0 ? 0 : ba[0] * 0.2), rx + 4, ey - 4.4 + ba[1], 1.1, bc));
    P.push(st(24, 24.6, 23, 28, 24.8, 28.2, 0.5, skS), ko(24, 28.4, 1.2, 0.6, skL), ko(24.6, 24.2, 0.7, 2.2, 'rgba(255,255,255,0.12)'));
    var my = 30.6, lip = '#a8483e';
    if (!Lk.hat || Lk.hat !== 'cowl') {
      if (spec.mouth === 'smile') P.push(st(20.6, my - 0.4, 24, my + 2.4, 27.4, my - 0.4, 0.9, lip), ko(24, my + 1.5, 1.6, 0.4, 'rgba(255,200,190,0.35)'));
      else if (spec.mouth === 'frown') P.push(st(20.8, my + 1.4, 24, my - 0.6, 27.2, my + 1.4, 0.9, lip));
      else if (spec.mouth === 'grin') P.push(['kq', [[19.6, my - 0.6], [24, my + 0.6], [28.4, my - 0.6], [27.6, my + 2.4], [24, my + 3.8], [20.4, my + 2.4]], '#fbf8ff', 1], st(19.6, my - 0.6, 24, my + 1, 28.4, my - 0.6, 0.7, lip), st(20.4, my + 2.4, 24, my + 4, 27.6, my + 2.4, 0.7, lip));
      else if (spec.mouth === 'open') P.push(ko(24, my + 1.6, 2.6, 2.2, '#4a1a1a'), ko(24, my + 2.4, 1.6, 0.9, '#c8606a'), st(21.4, my, 24, my - 0.4, 26.6, my, 0.6, lip));
      else P.push(st(21.4, my + 0.4, 24, my + 1, 26.6, my + 0.4, 0.8, lip), st(22.6, my + 1.7, 24, my + 2.1, 25.4, my + 1.7, 0.4, 'rgba(255,200,190,0.35)'));
    }
    if (spec.blush || mood === 'calm') P.push(ko(15.8, 27, 2.6, 1.4, 'rgba(255,110,110,' + (spec.blush ? 0.42 : 0.16) + ')'), ko(32.2, 27, 2.6, 1.4, 'rgba(255,110,110,' + (spec.blush ? 0.42 : 0.16) + ')'));
    if (spec.wrinkles) P.push(st(14.4, 20, 16, 19.4, 17.4, 20, 0.35, skS), st(30.6, 20, 32, 19.4, 33.6, 20, 0.35, skS), st(15.4, 26, 17, 27.4, 18, 28.6, 0.35, skS), st(32.6, 26, 31, 27.4, 30, 28.6, 0.35, skS), st(21, 12.6, 24, 11.6, 27, 12.6, 0.35, skS));
    if (spec.scar || Lk.scar) P.push(st(29, 14, 31.6, 21, 31, 29, 1, '#b04040'), st(30, 14.4, 32.6, 21, 32, 28.6, 0.4, 'rgba(255,210,210,0.6)'));
    if (Lk.beard) P.push(q([[14.6, 25], [15.2, 30], [18, 35], [24, 38.4], [30, 35], [32.8, 30], [33.4, 25], [30, 29.4], [24, 28.4], [18, 29.4]], Lk.beard, true), st(20.4, 31.6, 24, 32.8, 27.6, 31.6, 0.8, '#a8483e'));
    if (spec.mask) P.push(q([[13.6, 24], [34.4, 24], [33, 32], [24, 36], [15, 32]], spec.mask, true));
    if (Lk.hat === 'cowl') P.push(q([[13.8, 25.4], [34.2, 25.4], [33.4, 33], [24, 37], [14.6, 33]], Lk.hatc || '#1f2430', true), st(15.6, 26.6, 24, 28.4, 32.4, 26.6, 0.6, 'rgba(255,255,255,0.2)'));
    /* hair or headgear in front */
    var hl = mix(hair, '#ffffff', 0.34);
    if (!hood && !helm) {
      if (hs === 2) P.push(q([[12.6, 21], [11.8, 13], [14, 5], [17.4, 11], [20, 2.8], [23.6, 10], [27.4, 1.6], [29.6, 9.6], [34, 3.4], [35.6, 12.4], [36, 21], [34.4, 16], [30.6, 12.6], [26.6, 14], [22.6, 11.8], [18.4, 14.4], [15, 17.4]], hair));
      else P.push(q([[12.4, 21], [11.8, 13.6], [14.6, 7.6], [24, 4.8], [33.4, 7.6], [36.2, 13.6], [35.6, 21], [34, 16.6], [30.4, 12.4], [26.4, 14], [22.4, 11.6], [18.2, 14.2], [15, 17]], hair, true));
      P.push(st(15.6, 10.6, 24, 6.2, 32.6, 10.6, 1, hl), st(14.6, 15.6, 16, 11.4, 19.6, 9.4, 0.7, hl), st(30.6, 9.8, 33.4, 12, 34.4, 16, 0.6, hl));
      if (hs === 1) { P.push(q([[12.4, 20], [10.2, 30], [10.8, 40], [14.6, 37], [14.8, 26]], hair, true), q([[35.6, 20], [37.8, 30], [37.2, 40], [33.4, 37], [33.2, 26]], hair, true), st(11.4, 24, 11.2, 31, 12, 37, 0.5, hl)); }
      if (hs === 3) P.push(st(20, 6, 24, 3, 28, 6, 0.8, hl));
    }
    var hc = Lk.hatc || '#4a3380', t2 = Lk.trim || '#f2c14e', hat = Lk.hat;
    if (hood) {
      P.push(q([[10, 30], [10.4, 14], [15.4, 5.8], [24, 3.4], [32.6, 5.8], [37.6, 14], [38, 30], [34.6, 22], [32.4, 15], [28, 10.6], [24, 9.8], [20, 10.6], [15.6, 15], [13.4, 22]], hc, true), st(14.6, 17, 24, 8.2, 33.4, 17, 0.9, 'rgba(0,0,0,0.3)'));
    } else if (helm) {
      P.push(q([[11.6, 24], [11.6, 13], [15.6, 6.4], [24, 3.8], [32.4, 6.4], [36.4, 13], [36.4, 24], [33.6, 22], [33.4, 14.4], [30, 11], [24, 10], [18, 11], [14.6, 14.4], [14.4, 22]], hc, true));
      P.push(kb(22.2, 8, 3.6, 17, 1, mix(hc, '#000000', 0.15)), kb(14, 24, 3.2, 8, 1.2, hc), kb(30.8, 24, 3.2, 8, 1.2, hc), kb(12.4, 12, 23.2, 1.2, 0.5, 'rgba(255,255,255,0.25)'));
      if (hat === 'horns') P.push(q([[13, 12], [8, 5], [3, -1], [11, 5], [15, 9]], '#ece4d0', true), q([[35, 12], [40, 5], [45, -1], [37, 5], [33, 9]], '#ece4d0', true));
      if (Lk.plume) P.push(q([[24, 4], [30, -2], [38, 1], [34, 6], [28, 6]], Lk.plume, true));
    } else if (hat === 'pointed') {
      P.push(o(24, 10.4, 17.4, 3.8, hc), q([[11, 10], [15, 3], [20, -3], [27, -9], [26, -2], [32, 3], [37, 10]], hc, true), kb(11.6, 7.4, 24.8, 2.6, 1, t2), ko(24, 8.7, 1.6, 1.6, '#7af0ff'));
    } else if (hat === 'cap') {
      P.push(q([[11.4, 12], [12.8, 6.4], [24, 3.2], [35.2, 6.4], [36.6, 12], [30, 10.4], [24, 10], [18, 10.4]], hc, true), b(9, 10.2, 30, 3, 1.4, mix(hc, '#000000', 0.12)), q([[30, 6], [43, -2], [37, 6], [34, 11]], '#e8503a', true));
    } else if (hat === 'crown') {
      P.push(b(13.4, 6.4, 21.2, 5, 1, '#f2c14e'), q([[13.4, 7], [13, -0.5], [18.6, 4.4], [24, -3], [29.4, 4.4], [35, -0.5], [34.6, 7]], '#f2c14e'), ko(24, 9, 1.6, 1.6, '#e8503a'), ko(17.4, 9, 1.1, 1.1, '#7af0ff'), ko(30.6, 9, 1.1, 1.1, '#7af0ff'));
    } else if (hat === 'bandana') {
      P.push(b(11.6, 10.6, 24.8, 5.2, 2, hc), q([[34, 12], [44, 16], [40, 20], [34, 15]], hc, true));
    } else if (hat === 'straw') {
      P.push(o(24, 11.4, 22, 5, '#e8d080'), o(24, 6.6, 11, 6.4, '#f0dc90'), kb(13.6, 8.4, 20.8, 2.2, 0.8, '#c05a3a'));
    } else if (hat === 'embhorns') {
      P.push(q([[14, 14], [8, 6], [9, -2], [17, 6]], hc, true), q([[34, 14], [40, 6], [39, -2], [31, 6]], hc, true), kgl(24, 4, 16, hc, 0.25));
    } else if (hat === 'circlet' || spec.circlet) {
      P.push(st(14.6, 13.6, 24, 11.6, 33.4, 13.6, 1.3, '#f2c14e'), ko(24, 12, 1.5, 1.5, '#7af0ff'), kgl(24, 12, 5, '#7af0ff', 0.6));
    }
    if (Lk.halo) P.push(st(12, -1, 24, -7, 36, -1, 1.2, Lk.halo), st(12, -1, 24, 4.4, 36, -1, 1.2, Lk.halo), kgl(24, 0, 18, Lk.halo, 0.3));
    if (Lk.aura) P.push(kgl(24, 22, 24, Lk.aura, 0.12));
    art.drawPartsHD(g, P, 1);
    /* soft finishing light from the upper left, and a faint vignette */
    var lg = g.createLinearGradient(0, 0, 48, 48); lg.addColorStop(0, 'rgba(255,240,210,0.16)'); lg.addColorStop(0.5, 'rgba(255,255,255,0)'); lg.addColorStop(1, 'rgba(10,0,30,0.22)'); g.fillStyle = lg; g.fillRect(0, 0, 48, 48);
    pCache[key] = c; return c;
  };

  art.charParts = build;
  var CW = 28, CH = 34, OX = 6, OY = 14;
  var charCache = {};
  function lookKey(L) { return JSON.stringify(L); }
  art.charFrame = function (L, dir, f) {
    var key = lookKey(L) + dir + f, c = charCache[key];
    if (c) return c;
    c = art.hdCanvas(CW, CH); var x = c.getContext('2d');
    x.translate(OX, OY);
    art.drawPartsHD(x, build(L, dir, f), 1);
    charCache[key] = c;
    return c;
  };
  art.drawChar = function (g, L, dir, f, px, py, bob) {
    var d = dir === 'r' ? 'l' : dir, c = art.charFrame(L, d, f), S3 = FP.SS;
    var x = Math.round(px * S3) / S3 - OX, y = Math.round((py + (bob || 0)) * S3) / S3 - OY;
    if (dir === 'r') { g.save(); g.translate(x + CW, y); g.scale(-1, 1); g.drawImage(c, 0, 0); g.restore(); }
    else g.drawImage(c, x, y);
  };
  var bigCache = {};
  /* a larger figure for menus and battles: canvas is 24s x 32s with the feet near the bottom */
  art.charBig = function (L, facing, scale) {
    scale = scale || 2;
    var key = lookKey(L) + facing + scale, c = bigCache[key]; if (c) return c;
    var w = 24 * scale, h = 32 * scale;
    c = art.hdCanvas(w, h); var x = c.getContext('2d');
    var tmp = art.hdCanvas(w, h), tx = tmp.getContext('2d');
    tx.translate(4 * scale, 14 * scale);
    art.drawPartsHD(tx, build(L, 'l', 0), scale);
    if (facing === 'r') { x.translate(w, 0); x.scale(-1, 1); }
    x.drawImage(tmp, 0, 0);
    bigCache[key] = c;
    return c;
  };
  art.charFront = function (L, scale) {
    scale = scale || 2;
    var key = lookKey(L) + 'F' + scale, c = bigCache[key]; if (c) return c;
    var w = 24 * scale, h = 32 * scale;
    c = art.hdCanvas(w, h); var x = c.getContext('2d');
    x.translate(4 * scale, 14 * scale);
    art.drawPartsHD(x, build(L, 'd', 0), scale);
    bigCache[key] = c;
    return c;
  };
})(FP);
