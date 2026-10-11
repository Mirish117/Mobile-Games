/* The Fractured Path: the overworld and the generated dungeons. */
(function (FP) {
  'use strict';
  var TI = FP.TI, H = FP.mh;

  /* ---------- small utilities ---------- */
  function vnoise(x, y, scale, seed) {
    var fx = x / scale, fy = y / scale, x0 = Math.floor(fx), y0 = Math.floor(fy), tx = fx - x0, ty = fy - y0;
    function r(a, b) { return FP.hash(a * 7 + seed, b * 13 + seed * 3) / 4294967296; }
    var s = function (t) { return t * t * (3 - 2 * t); };
    var a = r(x0, y0), b = r(x0 + 1, y0), c = r(x0, y0 + 1), d = r(x0 + 1, y0 + 1);
    return a + (b - a) * s(tx) + (c - a) * s(ty) + (a - b - c + d) * s(tx) * s(ty);
  }
  /* cheapest-path carve: tiles along the route become `tile`; water becomes bridges */
  function route(m, ax, ay, bx, by, cost) {
    var W = m.w, Hh = m.h, dist = new Float32Array(W * Hh).fill(1e9), prev = new Int32Array(W * Hh).fill(-1), open = [[0, ay * W + ax]];
    dist[ay * W + ax] = 0;
    while (open.length) {
      var best = 0, i;
      for (i = 1; i < open.length; i++) if (open[i][0] < open[best][0]) best = i;
      var cur = open.splice(best, 1)[0], ci = cur[1], cx = ci % W, cy = (ci / W) | 0;
      if (cur[0] > dist[ci]) continue;
      if (cx === bx && cy === by) break;
      var d = [[1, 0], [-1, 0], [0, 1], [0, -1]];
      for (i = 0; i < 4; i++) {
        var nx = cx + d[i][0], ny = cy + d[i][1];
        if (nx < 1 || ny < 1 || nx >= W - 1 || ny >= Hh - 1) continue;
        var ni = ny * W + nx, nc = cur[0] + cost(m.t[ni], nx, ny) + (prev[ci] >= 0 && ((ci - prev[ci]) !== (ni - ci)) ? 0.35 : 0);
        if (nc < dist[ni]) { dist[ni] = nc; prev[ni] = ci; open.push([nc, ni]); }
      }
    }
    var path = [], k = by * W + bx;
    if (prev[k] < 0 && !(ax === bx && ay === by)) return path;
    while (k >= 0) { path.push([k % W, (k / W) | 0]); k = prev[k]; }
    return path.reverse();
  }
  FP.worldRoute = route;

  /* ================================================================ OVERWORLD */
  var OW = { w: 64, h: 48 };
  var LM = {
    thistle: { x: 16, y: 34, tile: 'OTOWN', to: 'thistle' },
    cinder: { x: 50, y: 34, tile: 'OTOWN2', to: 'cinder' },
    brine: { x: 30, y: 41, tile: 'OTOWN', to: 'brine' },
    highmoor: { x: 32, y: 9, tile: 'OCASTLE', to: 'highmoor' },
    wood: { x: 9, y: 19, tile: 'OCAVE', to: 'wood' },
    beacon: { x: 5, y: 40, tile: 'OTOWER', to: 'beacon1' },
    crypt: { x: 48, y: 12, tile: 'OCRYPT', to: 'crypt1' },
    archive: { x: 58, y: 8, tile: 'OARCH', to: 'arch1' },
    hollow: { x: 23, y: 29, tile: 'OCAVE', to: 'cave1' }
  };
  FP.LM = LM;
  FP.defMap('over', function () {
    var m = H.make(OW.w, OW.h, 'meadow', TI.GRASS), W = OW.w, Hh = OW.h, x, y, i;
    m.name = 'Myrrowen'; m.music = 'overworld'; m.overworld = true;
    var seed = 77;
    function inForest(x, y) { var dx = (x - 13) / 11, dy = (y - 20) / 10; return dx * dx + dy * dy < 1; }
    function isAsh(x, y) { return x >= 42 && y >= 22; }
    m.themeAt = function (x, y) { var t = m.t[y * W + x]; return isAsh(x, y) ? 'ash' : (inForest(x, y) ? 'forest' : (t === TI.WATER || t === TI.DEEP || t === TI.SAND ? 'coast' : 'meadow')); };
    m.zoneAt = function (x, y) {
      if (inForest(x, y)) return 'whisperwood';
      if (isAsh(x, y)) return 'ashplain';
      if (y >= 37 || (x <= 9 && y >= 33)) return 'coast';
      if (y < 20 && x >= 44) return 'crypt';
      if (y < 20) return 'highmoor';
      return 'meadow';
    };
    /* terrain */
    for (y = 0; y < Hh; y++) for (x = 0; x < W; x++) {
      var n1 = vnoise(x, y, 6, seed), n2 = vnoise(x, y, 3, seed + 9), n3 = vnoise(x, y, 10, seed + 5), t = TI.GRASS;
      var coastX = 2.4 + n1 * 2.2, coastY = Hh - 3.6 - n2 * 1.8;
      if (x < coastX - 1.2 || y > coastY + 1) t = TI.DEEP;
      else if (x < coastX || y > coastY) t = TI.WATER;
      else if (x < coastX + 1 || y > coastY - 1.1) t = TI.SAND;
      else if (y < 4 + n1 * 3 || x > W - 3 - n2 * 2) t = TI.MOUNT;
      else {
        if (isAsh(x, y)) { t = n3 > 0.62 ? TI.ASHTALL : (n2 > 0.7 ? TI.DEADTREE : (n1 > 0.78 ? TI.ROCK : (n2 < 0.18 ? TI.CRACK : TI.ASH))); }
        else if (inForest(x, y)) { t = n3 > 0.38 ? (n2 > 0.5 ? TI.PINE : TI.TREE) : (n2 > 0.55 ? TI.TALL : TI.GRASS); }
        else {
          if (n3 > 0.66 && n1 > 0.4) t = TI.TALL; else if (n2 > 0.86) t = TI.BUSH; else if (n2 < 0.1) t = TI.FLOWER;
          if (y < 14 && n1 > 0.62 && n2 > 0.4) t = TI.MOUNT;
        }
      }
      m.t[y * W + x] = t;
    }
    /* a lake in the north east, a river through the middle */
    for (y = 12; y <= 22; y++) for (x = 52; x <= 61; x++) { var dd = ((x - 56.5) / 5) * ((x - 56.5) / 5) + ((y - 17) / 5.5) * ((y - 17) / 5.5); if (dd < 1) m.t[y * W + x] = dd < 0.45 ? TI.DEEP : TI.WATER; }
    for (y = 8; y < 44; y++) { var rx = Math.round(37 + Math.sin(y / 4.3) * 2 + vnoise(0, y, 4, 12) * 2); m.t[y * W + rx] = TI.WATER; m.t[y * W + rx + 1] = TI.WATER; if (y % 5 === 0) m.t[y * W + rx - 1] = TI.WATER; }
    /* landmark clearings */
    var key;
    for (key in LM) { var L = LM[key]; for (y = L.y - 2; y <= L.y + 2; y++) for (x = L.x - 2; x <= L.x + 2; x++) { var cur = m.t[y * W + x]; if (cur !== TI.DEEP && cur !== TI.WATER) m.t[y * W + x] = isAsh(x, y) ? TI.ASH : (L.tile === 'OTOWER' ? TI.SAND : TI.GRASS); } }
    /* roads: cost function */
    function cost(t, x, y) {
      if (t === TI.DEEP) return 40; if (t === TI.WATER) return 7; if (t === TI.MOUNT) return 9; if (t === TI.TREE || t === TI.PINE) return 5;
      if (t === TI.TALL || t === TI.ASHTALL) return 2; if (t === TI.PATH || t === TI.ROAD) return 0.3; if (t === TI.ROCK || t === TI.BUSH || t === TI.DEADTREE) return 4; if (t === TI.CRACK) return 2.2; return 1;
    }
    function carve(a, b, tile) {
      var p = route(m, a.x, a.y + 1, b.x, b.y + 1, cost), prevT = null;
      p.forEach(function (c, idx) {
        var cur = m.t[c[1] * W + c[0]];
        if (cur === TI.WATER || cur === TI.DEEP) {
          var nxt = p[idx + 1] || p[idx - 1], horiz = nxt && nxt[1] === c[1];
          m.t[c[1] * W + c[0]] = horiz ? TI.BRIDGE : TI.BRIDGEV;
        } else if (cur !== TI.BRIDGE && cur !== TI.BRIDGEV && cur !== TI.ROAD) m.t[c[1] * W + c[0]] = tile;
      });
      return p;
    }
    var cross = { x: 30, y: 27 };
    m.t[cross.y * W + cross.x] = TI.OSHRINE;
    var routes = [
      [LM.thistle, cross, TI.ROAD], [cross, LM.highmoor, TI.ROAD], [cross, LM.cinder, TI.PATH], [cross, LM.brine, TI.PATH],
      [LM.thistle, LM.wood, TI.PATH], [LM.brine, LM.beacon, TI.PATH], [LM.highmoor, LM.crypt, TI.PATH], [LM.crypt, LM.archive, TI.PATH], [LM.thistle, LM.hollow, TI.PATH]
    ];
    m.t[cross.y * W + cross.x] = TI.PATH; m.t[(cross.y) * W + cross.x - 1] = TI.PATH;
    routes.forEach(function (r) { carve(r[0], r[1], r[2]); });
    m.t[cross.y * W + cross.x] = TI.OSHRINE; m.shrineTiles = [{ x: cross.x, y: cross.y }];
    /* a second shrine on the northern moor */
    m.t[14 * W + 40] = TI.OSHRINE; m.shrineTiles.push({ x: 40, y: 14 });
    /* make the tile south of the shrines a path so they are reachable */
    m.t[(cross.y + 1) * W + cross.x] = TI.PATH;
    for (y = 12; y <= 16; y++) for (x = 38; x <= 42; x++) { if (!(x === 40 && y === 14)) { var c0 = m.t[y * W + x]; if (c0 === TI.WATER || c0 === TI.DEEP || c0 === TI.MOUNT || c0 === TI.TREE || c0 === TI.PINE) m.t[y * W + x] = TI.GRASS; } }
    var p2 = route(m, 40, 15, 33, 11, cost); p2.forEach(function (c) { var cur = m.t[c[1] * W + c[0]]; if (cur === TI.WATER || cur === TI.DEEP) m.t[c[1] * W + c[0]] = TI.BRIDGE; else if (cur !== TI.BRIDGE && cur !== TI.BRIDGEV && cur !== TI.ROAD) m.t[c[1] * W + c[0]] = TI.PATH; });
    m.t[15 * W + 40] = TI.PATH;
    /* landmarks */
    for (key in LM) {
      var Lm = LM[key];
      m.t[Lm.y * W + Lm.x] = TI[Lm.tile];
      H.warp(m, Lm.x, Lm.y, Lm.to, 0, 0, 'd');
      var below = m.t[(Lm.y + 1) * W + Lm.x];
      if (below === TI.WATER || below === TI.DEEP || FP.art.isSolid(below)) m.t[(Lm.y + 1) * W + Lm.x] = TI.PATH;
    }
    /* scatter a few decor items along the roads */
    var rng = FP.mulberry32(909);
    H.scatter(m, rng, [TI.SIGN], 0, function () { return false; });
    m.entry = { x: LM.thistle.x, y: LM.thistle.y + 1, dir: 'd' };
    m.signs = [];
    function sign(x, y, text) { if (!FP.art.isSolid(m.t[y * W + x]) && m.t[y * W + x] !== TI.BRIDGE) { /* place beside the road */ } m.t[y * W + x] = TI.SIGN; H.act(m, x, y, { text: text }); }
    sign(LM.thistle.x + 1, LM.thistle.y + 2, 'THISTLEDOWN\nWest: Whisperwood. East: the Lantern Road.');
    sign(cross.x + 1, cross.y + 1, 'CROSSROADS\nN Highmoor / E Cinderhold / S Brinehaven / W Thistledown');
    return m;
  });
  /* overworld landmark positions are exported so that towns and dungeons can send you back to the right tile */
  FP.overReturn = function (mapId) {
    for (var k in LM) if (LM[k].to === mapId) return { x: LM[k].x, y: LM[k].y + 1, dir: 'd' };
    return { x: LM.thistle.x, y: LM.thistle.y + 1, dir: 'd' };
  };

  /* ================================================================ DUNGEON GENERATORS */
  function caGrid(w, h, rng, fill, iters) {
    var g = new Uint8Array(w * h), i, x, y;
    for (i = 0; i < g.length; i++) g[i] = rng() < fill ? 1 : 0;
    for (var it = 0; it < iters; it++) {
      var n = new Uint8Array(g);
      for (y = 1; y < h - 1; y++) for (x = 1; x < w - 1; x++) {
        var c = 0; for (var dy = -1; dy <= 1; dy++) for (var dx = -1; dx <= 1; dx++) c += g[(y + dy) * w + x + dx];
        n[y * w + x] = c >= 5 ? 1 : 0;
      }
      g = n;
    }
    for (x = 0; x < w; x++) { g[x] = 1; g[(h - 1) * w + x] = 1; }
    for (y = 0; y < h; y++) { g[y * w] = 1; g[y * w + w - 1] = 1; }
    return g;
  }
  function carveWalk(g, w, h, ax, ay, bx, by, wid, rng, trail) {
    var x = ax, y = ay, guard = 0;
    while ((x !== bx || y !== by) && guard++ < 4000) {
      for (var a = 0; a < wid; a++) for (var b = 0; b < wid; b++) { var px = x + a, py = y + b; if (px > 0 && py > 0 && px < w - 1 && py < h - 1) { g[py * w + px] = 0; if (trail) trail[py * w + px] = 1; } }
      var dx = bx - x, dy = by - y, r = rng();
      if (Math.abs(dx) > Math.abs(dy) ? r < 0.8 : r < 0.2) x += dx > 0 ? 1 : dx < 0 ? -1 : 0; else y += dy > 0 ? 1 : dy < 0 ? -1 : 0;
      if (rng() < 0.12) { if (rng() < 0.5) x += rng() < 0.5 ? -1 : 1; else y += rng() < 0.5 ? -1 : 1; }
      x = FP.clamp(x, 1, w - 2 - wid); y = FP.clamp(y, 1, h - 2 - wid);
      if (Math.abs(bx - x) < 2 && Math.abs(by - y) < 2) { x = bx; y = by; }
    }
  }
  function flood(g, w, h, sx, sy) {
    var seen = new Uint8Array(w * h), q = [sx, sy], qi = 0;
    seen[sy * w + sx] = 1;
    while (qi < q.length) {
      var x = q[qi++], y = q[qi++], d = [[1, 0], [-1, 0], [0, 1], [0, -1]];
      for (var i = 0; i < 4; i++) {
        var nx = x + d[i][0], ny = y + d[i][1];
        if (nx < 0 || ny < 0 || nx >= w || ny >= h || seen[ny * w + nx] || g[ny * w + nx]) continue;
        seen[ny * w + nx] = 1; q.push(nx, ny);
      }
    }
    return seen;
  }
  function bfsDist(m, sx, sy) {
    var W = m.w, dist = new Int32Array(W * m.h).fill(-1), q = [sx, sy], qi = 0;
    dist[sy * W + sx] = 0;
    while (qi < q.length) {
      var x = q[qi++], y = q[qi++], d = [[1, 0], [-1, 0], [0, 1], [0, -1]];
      for (var i = 0; i < 4; i++) {
        var nx = x + d[i][0], ny = y + d[i][1];
        if (nx < 0 || ny < 0 || nx >= W || ny >= m.h || dist[ny * W + nx] >= 0) continue;
        if (FP.art.isSolid(m.t[ny * W + nx])) continue;
        dist[ny * W + nx] = dist[y * W + x] + 1; q.push(nx, ny);
      }
    }
    return dist;
  }
  FP.bfsDist = bfsDist;
  /* free floor tiles that have at least 3 open neighbours (good spots for props) */
  function openSpots(m, dist, minD) {
    var out = [], d = [[1, 0], [-1, 0], [0, 1], [0, -1]];
    for (var y = 1; y < m.h - 1; y++) for (var x = 1; x < m.w - 1; x++) {
      if (dist[y * m.w + x] < (minD || 1)) continue;
      var t = m.t[y * m.w + x]; if (FP.art.isSolid(t)) continue;
      var n = 0; for (var i = 0; i < 4; i++) if (!FP.art.isSolid(m.t[(y + d[i][1]) * m.w + x + d[i][0]])) n++;
      out.push({ x: x, y: y, n: n });
    }
    return out;
  }
  FP.openSpots = openSpots;

  /* ---------- Whisperwood: a forest of glades ---------- */
  FP.defMap('wood', function () {
    var w = 44, h = 40, rng = FP.mulberry32(5511), g = caGrid(w, h, rng, 0.52, 5), x, y, i, trail = new Uint8Array(44 * 40);
    var glades = {
      start: { x: 18, y: 34, w: 9, h: 4 }, cage: { x: 6, y: 23, w: 8, h: 6 }, clear: { x: 31, y: 18, w: 9, h: 7 }, boss: { x: 15, y: 5, w: 13, h: 8 },
      nookA: { x: 4, y: 9, w: 5, h: 4 }, nookB: { x: 36, y: 6, w: 5, h: 4 }, mid: { x: 19, y: 20, w: 6, h: 5 }
    };
    for (var k in glades) { var G = glades[k]; for (y = G.y; y < G.y + G.h; y++) for (x = G.x; x < G.x + G.w; x++) { var cut = (x === G.x || x === G.x + G.w - 1) && (y === G.y || y === G.y + G.h - 1); if (!cut) g[y * w + x] = 0; } }
    function cc(G) { return { x: G.x + (G.w >> 1), y: G.y + (G.h >> 1) }; }
    var links = [['start', 'mid'], ['mid', 'cage'], ['mid', 'clear'], ['mid', 'boss'], ['cage', 'nookA'], ['clear', 'nookB'], ['clear', 'boss']];
    links.forEach(function (l) { var a = cc(glades[l[0]]), b = cc(glades[l[1]]); carveWalk(g, w, h, a.x, a.y, b.x, b.y, 2, rng, trail); });
    var st = cc(glades.start), seen = flood(g, w, h, st.x, st.y);
    var m = H.make(w, h, 'forest', TI.PINE);
    m.name = 'Whisperwood'; m.music = 'forest'; m.zone = 'whisperwood'; m.encRate = 1; m.dark = 0;
    for (y = 0; y < h; y++) for (x = 0; x < w; x++) {
      var idx = y * w + x;
      if (seen[idx]) {
        var v = vnoise(x, y, 3, 31);
        m.t[idx] = trail[idx] ? TI.FPATH : (v > 0.74 ? TI.MOSS : (v < 0.2 ? TI.TALL : TI.FGRASS));
      } else m.t[idx] = ((x + y * 3) % 5 === 0) ? TI.TREE : TI.PINE;
    }
    /* edge trees thicker looking */
    for (y = 0; y < h; y++) for (x = 0; x < w; x++) if (!seen[y * w + x] && (x === 0 || y === 0 || x === w - 1 || y === h - 1)) m.t[y * w + x] = TI.PINE;
    /* safe glades: grass & flowers */
    ['start', 'cage', 'clear', 'boss', 'nookA', 'nookB', 'mid'].forEach(function (kk) {
      var G = glades[kk];
      for (var yy = G.y; yy < G.y + G.h; yy++) for (var xx = G.x; xx < G.x + G.w; xx++) if (seen[yy * w + xx]) m.t[yy * w + xx] = ((xx * 7 + yy * 3) % 11 === 0) ? TI.FLOWER : TI.GRASS;
    });
    var sc = cc(glades.start);
    m.pts = { start: sc, cage: cc(glades.cage), clear: cc(glades.clear), boss: cc(glades.boss), nookA: cc(glades.nookA), nookB: cc(glades.nookB), mid: cc(glades.mid) };
    /* exit */
    for (i = -1; i <= 1; i++) { H.put(m, sc.x + i, h - 2, TI.GRASS); H.put(m, sc.x + i, h - 1, TI.GRASS); H.warp(m, sc.x + i, h - 1, 'over', 0, 0, 'd'); }
    H.put(m, sc.x, glades.start.y + 1, TI.SHRINE); m.shrine = { x: sc.x, y: glades.start.y + 1 };
    m.entry = { x: sc.x, y: h - 2, dir: 'u' }; m.exit = true;
    H.put(m, m.pts.mid.x, m.pts.mid.y, TI.SIGN); H.act(m, m.pts.mid.x, m.pts.mid.y, { text: 'A carved plank: "THE HEART-TREE LIES NORTH. DO NOT SING."' });
    /* props */
    H.chest(m, 'w_a', m.pts.nookA.x, m.pts.nookA.y, { item: 'hipotion', n: 1 });
    H.chest(m, 'w_b', m.pts.nookB.x, m.pts.nookB.y, { gold: 140 });
    H.chest(m, 'w_c', glades.cage.x + 6, glades.cage.y + 1, { item: 'ether', n: 2 });
    H.chest(m, 'w_d', glades.mid.x + 4, glades.mid.y + 3, { item: 'cord', n: 3 });
    /* boss arena: trigger at its southern lip */
    var b = glades.boss;
    m.zones = [{ x: b.x, y: b.y, w: b.w, h: b.h, ev: 'wood_boss' }, { x: glades.clear.x, y: glades.clear.y, w: glades.clear.w, h: glades.clear.h, ev: 'wren_scene' }];
    m.bossSpot = { x: b.x + 6, y: b.y + 1 };
    /* scene triggers and story people (see story.js) */
    var cg = m.pts.cage, cl = m.pts.clear;
    H.npc(m, 'cage_moss', cg.x, cg.y - 1, 'kin:mossback', 'Caged Mossback', 'ev:cage_moss', { kin: 'mossback', cage: true });
    H.npc(m, 'wren', cl.x, cl.y - 1, 'wren', 'Wren', 'ev:wren_forest', { cast: 'wren', show: function (G) { return G.arc === 'hero' && G.flags.h_wren_lost && !G.flags.h_wren_saved; } });
    H.npc(m, 'corvin_w', cl.x + 1, cl.y - 1, 'corvin', 'Corvin', 'ev:corvin_forest', { cast: 'corvin', show: function (G) { return G.arc === 'villain' && G.flags.v_started && !G.flags.v_corvin_met; } });
    m.glades = glades;
    return m;
  });

  /* ---------- rooms and corridors (lighthouse, crypt, archive, cave) ---------- */
  function genRooms(o) {
    var w = o.w, h = o.h, rng = FP.mulberry32(o.seed), g = new Uint8Array(w * h).fill(1), rooms = [], tries = 0, i, x, y;
    var rmin = o.rmin || 4, rmax = o.rmax || 8;
    function carveRoom(r) { for (var yy = r.y; yy < r.y + r.h; yy++) for (var xx = r.x; xx < r.x + r.w; xx++) g[yy * w + xx] = 0; }
    (o.fixed || []).forEach(function (r) { rooms.push(r); carveRoom(r); });
    while (rooms.length < o.n && tries++ < 600) {
      var rw = rmin + Math.floor(rng() * (rmax - rmin + 1)), rh = rmin - 1 + Math.floor(rng() * (rmax - rmin)), rx = 2 + Math.floor(rng() * (w - rw - 4)), ry = 2 + Math.floor(rng() * (h - rh - 4)), ok = true;
      for (i = 0; i < rooms.length; i++) { var r = rooms[i]; if (rx < r.x + r.w + 2 && rx + rw + 2 > r.x && ry < r.y + r.h + 2 && ry + rh + 2 > r.y) { ok = false; break; } }
      if (!ok) continue;
      var nr = { x: rx, y: ry, w: rw, h: rh }; rooms.push(nr); carveRoom(nr);
    }
    function ctr(r) { return { x: r.x + (r.w >> 1), y: r.y + (r.h >> 1) }; }
    var order = rooms.slice().sort(function (a, b) { return (ctr(a).x + ctr(a).y * 0.4) - (ctr(b).x + ctr(b).y * 0.4); });
    for (i = 1; i < order.length; i++) { var a = ctr(order[i - 1]), b = ctr(order[i]); carveWalk(g, w, h, a.x, a.y, b.x, b.y, o.corr || 1, rng); }
    for (i = 0; i < (o.loops || 2); i++) { var ra = rooms[Math.floor(rng() * rooms.length)], rb = rooms[Math.floor(rng() * rooms.length)]; carveWalk(g, w, h, ctr(ra).x, ctr(ra).y, ctr(rb).x, ctr(rb).y, 1, rng); }
    return { g: g, rooms: rooms, rng: rng, ctr: ctr };
  }
  /* theme descriptor for each dungeon */
  var DG = {
    beacon: { theme: 'lighthouse', floor: 'SFLOOR', safe: 'FLOORS', wall: 'SWALL', music: 'cave', zone: 'beacon', name: 'Saltwatch Beacon', dark: 0 },
    crypt: { theme: 'crypt', floor: 'CFLOOR', safe: 'FLOORS', wall: 'CWALL', music: 'crypt', zone: 'crypt', name: 'Hollowmoor Crypt', dark: 1 },
    arch: { theme: 'archive', floor: 'RUNE', safe: 'FLOORS', wall: 'SWALL', music: 'crypt', zone: 'archive', name: 'The Drowned Archive', dark: 0 },
    cave: { theme: 'cave', floor: 'CAVEF', safe: 'FLOORS', wall: 'SWALL', music: 'cave', zone: 'cave', name: 'Rootdeep Hollow', dark: 1 }
  };
  function buildFloor(dk, fl, o) {
    var D = DG[dk], rng, R, w = o.w, h = o.h, x, y, i;
    var fixedBoss = o.boss ? { x: Math.floor(w / 2) - 5, y: 2, w: 11, h: 7 } : null;
    var fixed = []; if (fixedBoss) fixed.push(fixedBoss);
    var startRoom = o.start === 'bottom' ? { x: Math.floor(w / 2) - 3, y: h - 7, w: 7, h: 5 } : null; if (startRoom) fixed.push(startRoom);
    R = genRooms({ w: w, h: h, seed: o.seed, n: o.n || 9, rmin: o.rmin, rmax: o.rmax, corr: o.corr, loops: o.loops, fixed: fixed });
    var m = H.make(w, h, D.theme, TI[D.wall]);
    m.name = D.name + (o.floors > 1 ? ' ' + (fl + 1) + 'F' : ''); m.music = o.music || D.music; m.zone = D.zone; m.dark = D.dark; m.dungeon = dk; m.floor = fl;
    for (y = 0; y < h; y++) for (x = 0; x < w; x++) if (!R.g[y * w + x]) m.t[y * w + x] = TI[D.floor];
    /* entry */
    var entry, dist;
    if (startRoom) { entry = R.ctr(startRoom); } else entry = R.ctr(R.rooms[0]);
    var seen = flood(R.g, w, h, entry.x, entry.y);
    for (y = 0; y < h; y++) for (x = 0; x < w; x++) if (!R.g[y * w + x] && !seen[y * w + x]) m.t[y * w + x] = TI[D.wall];
    /* safe start room */
    if (startRoom) for (y = startRoom.y; y < startRoom.y + startRoom.h; y++) for (x = startRoom.x; x < startRoom.x + startRoom.w; x++) m.t[y * w + x] = TI[D.safe];
    if (fixedBoss) for (y = fixedBoss.y; y < fixedBoss.y + fixedBoss.h; y++) for (x = fixedBoss.x; x < fixedBoss.x + fixedBoss.w; x++) m.t[y * w + x] = TI[D.safe];
    m.wallIds = [TI[D.wall]]; m.rooms = R.rooms; m.rng = R.rng; m.entryPt = entry; m.bossRoom = fixedBoss; m.startRoom = startRoom;
    return m;
  }
  function pickRooms(m, count, minD, avoid, dist) {
    var cands = m.rooms.filter(function (r) { var c = { x: r.x + (r.w >> 1), y: r.y + (r.h >> 1) }; return dist[c.y * m.w + c.x] >= (minD || 0) && r !== m.bossRoom && r !== m.startRoom && (!avoid || avoid.indexOf(r) < 0); });
    var rng = m.rng, out = [];
    FP.shuffle(cands, rng);
    for (var i = 0; i < count && i < cands.length; i++) out.push(cands[i]);
    return out;
  }
  function farthest(m, dist, avoidRooms) {
    var best = null, bd = -1;
    m.rooms.forEach(function (r) {
      if (r === m.bossRoom || r === m.startRoom || (avoidRooms && avoidRooms.indexOf(r) >= 0)) return;
      var c = { x: r.x + (r.w >> 1), y: r.y + (r.h >> 1) }, d = dist[c.y * m.w + c.x];
      if (d > bd) { bd = d; best = r; }
    });
    return best;
  }
  function center(r) { return { x: r.x + (r.w >> 1), y: r.y + (r.h >> 1) }; }

  /* a standard multi-floor dungeon. spec: {dk, floors:[{seed,w,h,n,...}], key} */
  function multi(dk, key, floorsSpec, hooks) {
    floorsSpec.forEach(function (fs, fl) {
      var id = key + (fl + 1);
      FP.defMap(id, function () {
        var o = Object.assign({ floors: floorsSpec.length }, fs);
        var m = buildFloor(dk, fl, o), dist = bfsDist(m, m.entryPt.x, m.entryPt.y), used = [];
        /* stairs: up leads onward, down leads back */
        var ent = m.entryPt;
        if (fl === 0) {
          /* the exit is below the starting room */
          var sr = m.startRoom, ex = center(sr);
          H.put(m, ex.x, sr.y + sr.h, TI[DG[dk].safe]); H.put(m, ex.x, sr.y + sr.h + 1, TI.EXIT);
          for (var xx = ex.x - 1; xx <= ex.x + 1; xx++) { H.put(m, xx, sr.y + sr.h, TI[DG[dk].safe]); }
          H.put(m, ex.x, sr.y + sr.h, TI[DG[dk].safe]);
          m.warps[ex.x + ',' + (sr.y + sr.h + 1)] = { to: 'over', x: 0, y: 0, dir: 'd' };
          m.entry = { x: ex.x, y: sr.y + sr.h - 1, dir: 'u' }; m.exit = true;
          m.shrine = { x: ex.x + 2, y: sr.y + 1 }; H.put(m, ex.x + 2, sr.y + 1, TI.SHRINE);
        } else {
          var prevDown = m.startRoom ? center(m.startRoom) : ent;
          m.entry = { x: prevDown.x, y: prevDown.y, dir: 'd' };
          H.put(m, prevDown.x, prevDown.y - 1, TI.STAIRD); m.warps[prevDown.x + ',' + (prevDown.y - 1)] = { to: key + fl, x: 0, y: 0, dir: 'd', stairs: 'up' };
          m.stairBack = { x: prevDown.x, y: prevDown.y - 1 };
          m.entry = { x: prevDown.x, y: prevDown.y, dir: 'd' };
        }
        var dist2 = bfsDist(m, m.entry.x, m.entry.y);
        used.push(m.startRoom);
        if (fl < floorsSpec.length - 1) {
          var far = farthest(m, dist2, used); used.push(far);
          var fc = center(far);
          H.put(m, fc.x, fc.y, TI.STAIRU); m.stairFwd = { x: fc.x, y: fc.y };
          m.warps[fc.x + ',' + fc.y] = { to: key + (fl + 2), x: 0, y: 0, dir: 'u', stairs: 'up', fwd: true };
          H.put(m, fc.x - 1, fc.y, TI[DG[dk].safe]); H.put(m, fc.x + 1, fc.y, TI[DG[dk].safe]); H.put(m, fc.x, fc.y + 1, TI[DG[dk].safe]);
          m.stairRoom = far;
        }
        /* chests */
        var nCh = fs.chests || 3, crooms = pickRooms(m, nCh, 4, used, dist2);
        crooms.forEach(function (r, i) {
          var c = center(r); used.push(r);
          H.chest(m, key + (fl + 1) + '_c' + i, c.x, c.y, (fs.loot && fs.loot[i]) || { gold: 40 + 20 * i });
        });
        m.freeRooms = m.rooms.filter(function (r) { return used.indexOf(r) < 0 && r !== m.bossRoom; });
        m.used = used;
        if (hooks && hooks[fl]) hooks[fl](m, { key: key, fl: fl, dist: dist2, center: center });
        H.finishWalls(m, m.wallIds);
        return m;
      });
    });
  }
  /* back-stairs: warps use floor-relative coords, resolved when entering a map */
  FP.resolveWarp = function (w, targetId) {
    /* returns {x,y,dir} for stair warps whose target coords are 0,0 */
    var tm = FP.getMap(targetId);
    if (w.stairs && w.fwd) { var e = tm.entry; return { x: e.x, y: e.y, dir: e.dir }; }
    if (w.stairs && !w.fwd) { var s = tm.stairFwd; return s ? { x: s.x, y: s.y + 1, dir: 'd' } : tm.entry; }
    return null;
  };

  /* Saltwatch Beacon */
  multi('beacon', 'beacon', [
    { seed: 6101, w: 28, h: 22, n: 8, rmin: 4, rmax: 7, start: 'bottom', chests: 2, loot: [{ item: 'hipotion', n: 2 }, { gold: 180 }] },
    { seed: 6102, w: 28, h: 22, n: 8, rmin: 4, rmax: 7, start: 'bottom', chests: 2, loot: [{ item: 'ether', n: 2 }, { gear: 'charm', id: 'c_2' }] },
    { seed: 6103, w: 26, h: 20, n: 5, rmin: 4, rmax: 6, start: 'bottom', boss: true, chests: 1, loot: [{ gold: 260 }] }
  ], [null, function (m, c) {
    var fr = m.freeRooms[0] || m.rooms[0], p = center(fr);
    H.npc(m, 'cage_wisp', p.x, p.y, 'kin:lampwisp', 'Caged Lampwisp', 'ev:cage_wisp', { kin: 'lampwisp', cage: true });
    m.shrine = m.shrine || null;
  }, function (m, c) {
    var b = m.bossRoom, bx = b.x + (b.w >> 1);
    m.zones = [{ x: b.x, y: b.y, w: b.w, h: b.h, ev: 'beacon_boss' }];
    m.bossSpot = { x: bx, y: b.y + 2 };
    var sr = m.startRoom; m.shrine = { x: center(sr).x + 2, y: sr.y + 1 }; H.put(m, center(sr).x + 2, sr.y + 1, TI.SHRINE);
    for (var xx = b.x; xx < b.x + b.w; xx++) { H.put(m, xx, b.y, TI.WATERI); }
    H.put(m, bx, b.y, TI.LSTONE);
  }]);
  /* Hollowmoor Crypt */
  multi('crypt', 'crypt', [
    { seed: 7101, w: 34, h: 26, n: 10, rmin: 4, rmax: 7, start: 'bottom', chests: 3, loot: [{ item: 'hiether', n: 1 }, { gold: 240 }, { gear: 'weapon', tier: 3 }] },
    { seed: 7102, w: 34, h: 26, n: 8, rmin: 4, rmax: 7, start: 'bottom', boss: true, chests: 2, loot: [{ item: 'seed', n: 2 }, { gear: 'armor', tier: 3 }] }
  ], [function (m, c) {
    var sr = m.startRoom;
    m.shrine = m.shrine || { x: center(sr).x + 2, y: sr.y + 1 };
    var fr = (m.freeRooms[0]) || m.rooms[1], p = center(fr);
    H.npc(m, 'cage_noble', p.x, p.y, 'noble', 'Young Lord Aldric', 'ev:crypt_noble', { cast: null });
  }, function (m, c) {
    var b = m.bossRoom, bx = b.x + (b.w >> 1);
    m.zones = [{ x: b.x, y: b.y, w: b.w, h: b.h, ev: 'crypt_boss' }];
    m.bossSpot = { x: bx, y: b.y + 2 };
    var sr = m.startRoom; m.shrine = { x: center(sr).x + 2, y: sr.y + 1 }; H.put(m, center(sr).x + 2, sr.y + 1, TI.SHRINE);
    H.put(m, bx - 3, b.y + 1, TI.PILLAR); H.put(m, bx + 3, b.y + 1, TI.PILLAR); H.put(m, bx, b.y, TI.THRONE);
  }]);
  /* The Drowned Archive */
  multi('arch', 'arch', [
    { seed: 8101, w: 30, h: 24, n: 7, rmin: 4, rmax: 7, start: 'bottom', chests: 2, loot: [{ item: 'hipotion', n: 3 }, { gold: 300 }] },
    { seed: 8102, w: 30, h: 24, n: 8, rmin: 4, rmax: 7, start: 'bottom', chests: 3, loot: [{ item: 'sunpotion', n: 1 }, { gold: 360 }, { item: 'hiether', n: 2 }] },
    { seed: 8103, w: 28, h: 22, n: 5, rmin: 4, rmax: 6, start: 'bottom', boss: true, chests: 1, loot: [{ gear: 'weapon', tier: 4 }] }
  ], [function (m, c) {
    var sr = m.startRoom; m.shrine = { x: center(sr).x + 2, y: sr.y + 1 }; H.put(m, center(sr).x + 2, sr.y + 1, TI.SHRINE);
    H.npc(m, 'archivist', center(sr).x, center(sr).y - 1, 'ghost', 'The Archivist', 'ev:archivist1', { cast: 'nyx', ghost: false });
  }, function (m, c) {
    var sr = m.startRoom, sf = m.stairFwd;
    if (sf) { m.warps[sf.x + ',' + sf.y].need = 'sentinel_done'; m.warps[sf.x + ',' + sf.y].ev = 'arch_sentinel'; m.zones = [{ x: sf.x - 2, y: sf.y - 2, w: 5, h: 5, ev: 'arch_sentinel' }]; }
    m.sentinelSpot = sf ? { x: sf.x, y: sf.y - 1 } : null;
    m.shrine = { x: center(sr).x + 2, y: sr.y + 1 }; H.put(m, center(sr).x + 2, sr.y + 1, TI.SHRINE);
  }, function (m, c) {
    var b = m.bossRoom, bx = b.x + (b.w >> 1);
    m.zones = [{ x: b.x, y: b.y, w: b.w, h: b.h, ev: 'arch_boss' }];
    m.bossSpot = { x: bx, y: b.y + 2 };
    var sr = m.startRoom; m.shrine = { x: center(sr).x + 2, y: sr.y + 1 }; H.put(m, center(sr).x + 2, sr.y + 1, TI.SHRINE);
    H.put(m, bx, b.y, TI.LSTONE_B); H.put(m, bx - 3, b.y + 1, TI.PILLARW); H.put(m, bx + 3, b.y + 1, TI.PILLARW);
  }]);

  /* Rootdeep Hollow: an optional cave full of Kin to catch */
  FP.defMap('cave1', function () {
    var w = 32, h = 28, rng = FP.mulberry32(9911), g = caGrid(w, h, rng, 0.46, 4), x, y;
    var sx = 16, sy = h - 4;
    for (y = sy - 1; y < sy + 2; y++) for (x = sx - 3; x <= sx + 3; x++) g[y * w + x] = 0;
    var tx = 16, ty = 5;
    for (y = ty - 2; y < ty + 2; y++) for (x = tx - 3; x <= tx + 3; x++) g[y * w + x] = 0;
    carveWalk(g, w, h, sx, sy, tx, ty, 2, rng); carveWalk(g, w, h, sx, sy, 5, 12, 2, rng); carveWalk(g, w, h, tx, ty, 26, 14, 2, rng);
    var seen = flood(g, w, h, sx, sy), m = H.make(w, h, 'cave', TI.SWALL);
    m.name = 'Rootdeep Hollow'; m.music = 'cave'; m.zone = 'cave'; m.dark = 1;
    for (y = 0; y < h; y++) for (x = 0; x < w; x++) if (seen[y * w + x]) m.t[y * w + x] = TI.CAVEF;
    for (y = sy - 1; y < sy + 2; y++) for (x = sx - 3; x <= sx + 3; x++) m.t[y * w + x] = TI.FLOORS;
    for (x = sx - 1; x <= sx + 1; x++) { m.t[(h - 2) * w + x] = TI.FLOORS; m.t[(h - 1) * w + x] = TI.EXIT; m.warps[x + ',' + (h - 1)] = { to: 'over', x: 0, y: 0, dir: 'd' }; }
    m.entry = { x: sx, y: h - 3, dir: 'u' }; m.exit = true;
    m.t[(sy - 1) * w + sx + 2] = TI.SHRINE; m.shrine = { x: sx + 2, y: sy - 1 };
    H.chest(m, 'c1_a', tx, ty, { gear: 'charm', id: 'c_6' });
    var dist = bfsDist(m, sx, sy), sp = openSpots(m, dist, 14).filter(function (p) { return p.n === 4; });
    FP.shuffle(sp, rng);
    H.finishWalls(m, [TI.SWALL]);
    var picks = sp.slice(0, 3);
    ['ore', 'hipotion', 'strongcord'].forEach(function (it, i) { if (picks[i]) H.chest(m, 'c1_' + (i + 1), picks[i].x, picks[i].y, { item: it, n: it === 'ore' ? 3 : 1 }); });
    return m;
  });
})(FP);
