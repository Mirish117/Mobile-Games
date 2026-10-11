/* The Fractured Path: map helpers, towns and interiors.
   Maps are built in code (so they can be checked for reachability by the test harness). */
(function (FP) {
  'use strict';
  var TI = FP.TI;
  var defs = {}, cache = {};
  FP.defMap = function (id, fn) { defs[id] = fn; };
  FP.getMap = function (id) {
    if (!cache[id]) {
      if (!defs[id]) throw new Error('no map ' + id);
      var m = defs[id]();
      m.id = id;
      m.npcs = m.npcs || []; m.warps = m.warps || {}; m.acts = m.acts || {}; m.steps = m.steps || {}; m.chests = m.chests || [];
      cache[id] = m;
    }
    return cache[id];
  };
  FP.mapIds = function () { return Object.keys(defs); };

  /* ---------- builders ---------- */
  var H = FP.mh = {};
  H.make = function (w, h, theme, fill) {
    var m = { w: w, h: h, theme: theme, t: new Uint8Array(w * h), npcs: [], warps: {}, acts: {}, steps: {}, chests: [] };
    if (fill !== undefined) for (var i = 0; i < m.t.length; i++) m.t[i] = fill;
    return m;
  };
  H.put = function (m, x, y, t) { if (x >= 0 && y >= 0 && x < m.w && y < m.h) m.t[y * m.w + x] = t; };
  H.get = function (m, x, y) { return (x < 0 || y < 0 || x >= m.w || y >= m.h) ? TI.VOID : m.t[y * m.w + x]; };
  H.rect = function (m, x, y, w, h, t) { for (var j = 0; j < h; j++) for (var i = 0; i < w; i++) H.put(m, x + i, y + j, t); };
  H.hline = function (m, x1, x2, y, t) { for (var x = x1; x <= x2; x++) H.put(m, x, y, t); };
  H.vline = function (m, x, y1, y2, t) { for (var y = y1; y <= y2; y++) H.put(m, x, y, t); };
  H.border = function (m, t, th) { th = th || 1; for (var k = 0; k < th; k++) { H.hline(m, 0, m.w - 1, k, t); H.hline(m, 0, m.w - 1, m.h - 1 - k, t); H.vline(m, k, 0, m.h - 1, t); H.vline(m, m.w - 1 - k, 0, m.h - 1, t); } };
  /* a house: 3 rows (ridge, roof, wall with door). returns door tile */
  H.house = function (m, x, y, w, ci, doorOff, rows) {
    rows = rows || 3;
    for (var i = 0; i < w; i++) {
      H.put(m, x + i, y, TI['ROOFT' + ci]);
      for (var r = 1; r < rows - 1; r++) H.put(m, x + i, y + r, TI['ROOF' + ci]);
      H.put(m, x + i, y + rows - 1, TI.WALLB);
    }
    for (var j = 0; j < rows; j++) { /* give edge wall tiles solid plain wall */ }
    H.put(m, x + doorOff, y + rows - 1, TI.DOOR);
    return { x: x + doorOff, y: y + rows - 1 };
  };
  /* a stone building (castle themed) */
  H.stoneHouse = function (m, x, y, w, ci, doorOff, rows) {
    rows = rows || 3;
    for (var i = 0; i < w; i++) {
      H.put(m, x + i, y, TI['ROOFT' + ci]);
      for (var r = 1; r < rows - 1; r++) H.put(m, x + i, y + r, TI['ROOF' + ci]);
      H.put(m, x + i, y + rows - 1, (i % 2) ? TI.WALLS : TI.WALLP);
    }
    H.put(m, x + doorOff, y + rows - 1, TI.DOOR);
    return { x: x + doorOff, y: y + rows - 1 };
  };
  /* dark wall mass becomes void; only wall faces that touch floor are drawn */
  H.finishWalls = function (m, wallIds) {
    var keep = new Uint8Array(m.w * m.h), x, y, dx, dy;
    for (y = 0; y < m.h; y++) for (x = 0; x < m.w; x++) {
      if (wallIds.indexOf(m.t[y * m.w + x]) < 0) continue;
      for (dy = -1; dy <= 1; dy++) for (dx = -1; dx <= 1; dx++) { var nx = x + dx, ny = y + dy; if (nx >= 0 && ny >= 0 && nx < m.w && ny < m.h && !FP.art.isSolid(m.t[ny * m.w + nx])) keep[y * m.w + x] = 1; }
    }
    for (var i = 0; i < m.t.length; i++) if (wallIds.indexOf(m.t[i]) >= 0 && !keep[i]) m.t[i] = TI.VOID;
  };
  H.scatter = function (m, rng, tiles, count, ok) {
    var n = 0, guard = 0;
    while (n < count && guard++ < count * 40) {
      var x = Math.floor(rng() * m.w), y = Math.floor(rng() * m.h);
      if (ok(x, y, H.get(m, x, y))) { H.put(m, x, y, tiles[Math.floor(rng() * tiles.length)]); n++; }
    }
  };
  H.npc = function (m, id, x, y, kind, name, say, o) {
    var n = { id: id, x: x, y: y, kind: kind, name: name, dir: 'd', say: say };
    if (o) for (var k in o) n[k] = o[k];
    m.npcs.push(n); return n;
  };
  H.chest = function (m, id, x, y, loot) { m.chests.push({ id: id, x: x, y: y, loot: loot }); };
  H.warp = function (m, x, y, to, tx, ty, dir) { m.warps[x + ',' + y] = { to: to, x: tx, y: ty, dir: dir || 'd' }; };
  H.act = function (m, x, y, a) { m.acts[x + ',' + y] = a; };

  /* breadth-first reachability from (sx,sy) over walkable tiles. NPC and chest tiles block. */
  H.reach = function (m, sx, sy) {
    var seen = new Uint8Array(m.w * m.h), q = [[sx, sy]], block = {}, i;
    m.npcs.forEach(function (n) { if (!n.ghost) block[n.x + ',' + n.y] = 1; });
    m.chests.forEach(function (c) { block[c.x + ',' + c.y] = 1; });
    seen[sy * m.w + sx] = 1;
    while (q.length) {
      var c = q.shift(), d = [[1, 0], [-1, 0], [0, 1], [0, -1]];
      for (i = 0; i < 4; i++) {
        var nx = c[0] + d[i][0], ny = c[1] + d[i][1];
        if (nx < 0 || ny < 0 || nx >= m.w || ny >= m.h || seen[ny * m.w + nx]) continue;
        if (FP.art.isSolid(m.t[ny * m.w + nx]) || block[nx + ',' + ny]) continue;
        seen[ny * m.w + nx] = 1; q.push([nx, ny]);
      }
    }
    return seen;
  };

  /* ---------- interiors ---------- */
  /* opts: id, theme, w, h, name, music, parent, door:{x,y}, fill(m), npcs */
  function interior(o) {
    FP.defMap(o.id, function () {
      var w = o.w || 9, h = o.h || 7, m = H.make(w, h, o.theme || 'interior', TI.FLOOR);
      m.name = o.name; m.music = o.music || 'hearth'; m.interior = true; m.zone = null;
      H.rect(m, 0, 0, w, 1, TI.WALLT); H.rect(m, 0, 1, w, 1, TI.WALLI);
      H.vline(m, 0, 2, h - 1, TI.WALLI); H.vline(m, w - 1, 2, h - 1, TI.WALLI); H.hline(m, 0, w - 1, h - 1, TI.WALLI);
      var ex = o.exitX !== undefined ? o.exitX : Math.floor(w / 2);
      H.put(m, ex, h - 1, TI.EXIT);
      H.warp(m, ex, h - 1, o.parent, o.door.x, o.door.y + 1, 'd');
      m.entry = { x: ex, y: h - 2, dir: 'u' };
      if (o.fill) o.fill(m, w, h, ex);
      return m;
    });
  }
  FP.interior = interior;
  var shelfRow = function (m, x1, x2, y) { for (var x = x1; x <= x2; x++) H.put(m, x, y, TI.SHELF); };
  /* link a door in a parent map to its interior */
  function link(parent, door, id, w, h, exitX) {
    var ex = exitX !== undefined ? exitX : Math.floor(w / 2);
    H.warp(parent, door.x, door.y, id, ex, h - 2, 'u');
    H.put(parent, door.x, door.y + 1, TI.PATH);
  }

  /* house with beds, hearth, table */
  function homeFill(extra) {
    return function (m, w, h) {
      H.put(m, 1, 1, TI.WINDOWI); H.put(m, w - 2, 1, TI.WINDOWI); H.put(m, Math.floor(w / 2), 1, TI.HEARTH);
      H.put(m, 1, 2, TI.BED); H.put(m, 2, 2, TI.BED); H.rect(m, 3, 4, w - 6, 2, TI.RUG);
      H.put(m, w - 3, 2, TI.SHELF); H.put(m, w - 2, 2, TI.POT);
      H.put(m, 3, 3, TI.TABLE); H.put(m, 4, 3, TI.CHAIR);
      if (extra) extra(m, w, h);
    };
  }

  /* =============================================================== THISTLEDOWN */
  FP.defMap('thistle', function () {
    var m = H.make(30, 24, 'meadow', TI.GRASS), rng = FP.mulberry32(1101);
    m.name = 'Thistledown'; m.music = 'thistledown'; m.zone = null;
    H.border(m, TI.PINE, 2);
    H.rect(m, 14, 22, 2, 2, TI.PATH); H.rect(m, 14, 6, 2, 16, TI.PATH);
    H.hline(m, 3, 27, 7, TI.PATH); H.hline(m, 3, 27, 16, TI.PATH);
    var d1 = H.house(m, 3, 3, 4, 0, 1), d2 = H.house(m, 8, 3, 5, 1, 2), d3 = H.house(m, 17, 3, 6, 2, 2), d4 = H.house(m, 24, 3, 4, 3, 1);
    var d5 = H.house(m, 3, 12, 4, 3, 1), d6 = H.house(m, 8, 12, 5, 1, 2), d7 = H.house(m, 17, 12, 4, 0, 2);
    [d1, d2, d3, d4, d5, d6, d7].forEach(function (d) { H.put(m, d.x, d.y + 1, TI.PATH); });
    link(m, d1, 'th_home', 9, 7); link(m, d2, 'th_elder', 10, 8); link(m, d3, 'th_inn', 10, 8); link(m, d4, 'th_smith', 9, 7);
    link(m, d5, 'th_shop', 9, 7); link(m, d6, 'th_pen', 10, 8); link(m, d7, 'th_wren', 9, 7);
    /* shrine plaza */
    H.put(m, 14, 4, TI.SHRINE); H.put(m, 13, 4, TI.FLOWER); H.put(m, 15, 4, TI.FLOWER); H.put(m, 13, 5, TI.FLOWER); H.put(m, 15, 5, TI.FLOWER);
    H.put(m, 13, 3, TI.LAMP); H.put(m, 16, 3, TI.LAMP);
    H.put(m, 11, 10, TI.WELL); H.put(m, 19, 10, TI.SIGN); H.put(m, 13, 17, TI.SIGN);
    /* farm */
    H.rect(m, 23, 11, 5, 5, TI.TALL); H.rect(m, 22, 10, 7, 1, TI.FENCE); H.rect(m, 22, 16, 1, 1, TI.FENCE); H.vline(m, 22, 11, 15, TI.FENCE); H.hline(m, 22, 28, 10, TI.FENCE); H.put(m, 23, 16, TI.FENCE);
    H.hline(m, 24, 27, 16, TI.PATH); H.vline(m, 27, 11, 15, TI.FENCE);
    H.put(m, 22, 15, TI.PATH); H.put(m, 22, 14, TI.PATH);
    H.scatter(m, rng, [TI.FLOWER, TI.FLOWER, TI.BUSH, TI.TREE], 40, function (x, y, t) { return t === TI.GRASS && x > 2 && x < 27 && y > 2 && y < 21 && !(x >= 13 && x <= 16) && !(y === 6 || y === 15) && !(x > 21 && y > 9 && y < 17); });
    /* the road leaves south */
    H.warp(m, 14, 23, 'over', 0, 0, 'd'); H.warp(m, 15, 23, 'over', 0, 0, 'd'); m.exit = true;
    m.entry = { x: 14, y: 21, dir: 'u' };
    m.shrine = { x: 14, y: 4 };
    H.act(m, 19, 10, { text: 'THISTLEDOWN\nPop. 61 and a goat.' });
    H.act(m, 13, 17, { text: 'South road: Whisperwood, Brinehaven, the Lantern Road.' });
    H.act(m, 11, 10, { text: 'The well water is sweet. Someone has left a small bell on the rim.' });
    /* people */
    H.npc(m, 'pell', 12, 8, 'child', 'Pell', function (G) {
      return G.arc === 'hero'
        ? [['pell', 'I am going to be a Wayfinder! I practice Tethering on the goat. The goat is not impressed.']]
        : [['pell', 'Mum says Ashen folk steal. Do you steal? You do not look like you steal.']];
    }, { cast: 'pell', wander: 2 });
    H.npc(m, 'tobin', 24, 14, 'villagerB', 'Tobin', function (G) {
      return G.arc === 'hero' ? ['Dry spring. The tall grass is crawling with little wild Kin, though. Careful. Tether one if you can; they make good company.']
        : ['You are not from here. Keep walking, friend. We have nothing worth the trouble.'];
    });
    H.npc(m, 'nan', 6, 9, 'villagerC', 'Nan', function (G) {
      return G.flags.h_matron_done || G.flags.v_matron_done ? ['The Whisperwood has gone quiet. Quieter than quiet. Hm. I do not trust it.'] : ['Ability points? Open the menu, pick Skills, spend them. A trained mind is worth two good swords. My late husband said that. He lost a lot of arguments to swords, though.'];
    }, { wander: 2 });
    H.npc(m, 'goatherd', 20, 8, 'villager', 'Old Fenn', function (G) { return ['Lamp Shrines heal you and keep your place. Stand next to one and press A. Handy, those.']; }, { wander: 1 });
    H.npc(m, 'kid2', 9, 17, 'child', 'Little Ro', function () { return ['If you find a cage in the forest, there is a Kin inside. A good person lets them out. A smart one asks first.']; }, { wander: 2 });
    return m;
  });
  interior({ id: 'th_home', parent: 'thistle', door: { x: 4, y: 5 }, w: 9, h: 7, name: 'Your Home', fill: homeFill(function (m) {
    H.act(m, 1, 2, { text: 'Your bed. It is exactly as comfortable as you remember.', rest: true });
    H.act(m, 8, 2, { text: 'A cracked clay pot. Your mother keeps the spare lamp-oil here.' });
  }) });
  interior({ id: 'th_elder', parent: 'thistle', door: { x: 10, y: 5 }, w: 10, h: 8, name: 'Elder Maro\'s House', fill: function (m, w, h) {
    H.put(m, 1, 1, TI.SHELF); H.put(m, 2, 1, TI.SHELF); H.put(m, 3, 1, TI.WINDOWI); H.put(m, 5, 1, TI.HEARTH); H.put(m, 7, 1, TI.WINDOWI); H.put(m, 8, 1, TI.SHELF);
    H.rect(m, 2, 3, 6, 3, TI.RUG); H.put(m, 3, 2, TI.TABLE); H.put(m, 4, 2, TI.TABLE); H.put(m, 6, 2, TI.CHAIR); H.put(m, 8, 3, TI.BED); H.put(m, 8, 4, TI.BED);
    H.npc(m, 'maro', 5, 4, 'elder', 'Elder Maro', 'ev:maro', { cast: 'seren' });
    H.act(m, 1, 2, { text: 'Books on every shelf. One is titled "The Bell Sang Once" and is mostly crumbs.' });
  } });
  interior({ id: 'th_inn', parent: 'thistle', door: { x: 19, y: 5 }, w: 10, h: 8, name: 'Thistle & Thorn Inn', music: 'hearth', fill: function (m, w, h) {
    H.put(m, 2, 1, TI.WINDOWI); H.put(m, 7, 1, TI.WINDOWI); H.put(m, 4, 1, TI.HEARTH); H.rect(m, 1, 3, 8, 1, TI.COUNTER); H.put(m, 1, 5, TI.BED); H.put(m, 2, 5, TI.BED); H.put(m, 7, 5, TI.BED); H.put(m, 8, 5, TI.BED);
    H.rect(m, 3, 5, 4, 2, TI.RUG); H.put(m, 8, 2, TI.TABLE); H.put(m, 8, 3, TI.CHAIR);
    H.npc(m, 'dorrin', 4, 2, 'innkeeper', 'Dorrin', null, { inn: 12, face: 'd' });
  } });
  interior({ id: 'th_shop', parent: 'thistle', door: { x: 4, y: 14 }, w: 9, h: 7, name: 'Mara\'s Goods', music: 'hearth', fill: function (m, w, h) {
    shelfRow(m, 1, 2, 1); H.put(m, 3, 1, TI.WINDOWI); shelfRow(m, 5, 7, 1); H.put(m, 4, 1, TI.SHELF);
    H.rect(m, 1, 3, 7, 1, TI.COUNTER); H.rect(m, 2, 5, 5, 1, TI.RUG);
    H.npc(m, 'mara', 4, 2, 'merchant', 'Mara', null, { shop: 'thistle', face: 'd' });
  } });
  interior({ id: 'th_pen', parent: 'thistle', door: { x: 10, y: 14 }, w: 10, h: 8, name: 'Kin Keeper', music: 'hearth', fill: function (m, w, h) {
    H.rect(m, 1, 2, 8, 1, TI.FENCE); H.put(m, 3, 1, TI.WINDOWI); H.put(m, 6, 1, TI.WINDOWI);
    H.npc(m, 'kin_a', 2, 3, 'kin:pipsprout', 'Pipsprout', function () { return ['A leaf-eared bud snores softly in the straw.']; }, { kin: 'pipsprout' });
    H.npc(m, 'kin_b', 5, 3, 'kin:mossback', 'Mossback', function () { return ['A mossy shell, breathing slowly. A beetle walks across it. It does not mind.']; }, { kin: 'mossback' });
    H.rect(m, 1, 5, 8, 1, TI.RUG);
    H.npc(m, 'keeper_t', 7, 3, 'fisher', 'Keeper Ilse', null, { kinshop: 'thistle', face: 'd' });
  } });
  interior({ id: 'th_smith', parent: 'thistle', door: { x: 25, y: 5 }, w: 9, h: 7, name: 'Hale\'s Forge', music: 'hearth', fill: function (m, w, h) {
    H.put(m, 2, 1, TI.FORGE); H.put(m, 3, 1, TI.WINDOWI); H.put(m, 6, 1, TI.WINDOWI); H.put(m, 5, 2, TI.ANVIL); shelfRow(m, 7, 7, 2); H.rect(m, 1, 4, 6, 1, TI.COUNTER);
    H.npc(m, 'hale', 3, 3, 'smith', 'Hale', null, { smith: true, face: 'd' });
  } });
  interior({ id: 'th_wren', parent: 'thistle', door: { x: 19, y: 14 }, w: 9, h: 7, name: 'Wren\'s House', fill: homeFill(function (m, w, h) {
    H.npc(m, 'wrengran', 6, 4, 'elder', 'Gran Tilly', function (G) {
      if (G.arc !== 'hero') return ['You are Ashen. You have my granddaughter\'s eyes. No. I am tired. Go on, take the stairs.', 'There are no stairs. Take the door.'];
      if (G.flags.h_wren_saved) return ['She is safe because of you. Sit. Eat. I made too much, as always.'];
      if (G.flags.h_wren_lost) return ['Wren went into the Whisperwood after a runaway Kin and did not come out. Please. Please bring her back.'];
      return ['Wren is out gathering lampreed. She will be back by dark. She is always back by dark.'];
    });
    H.act(m, 1, 2, { text: 'Wren\'s bed. A sketch of a fox-like Kin is pinned above it.' });
  }) });

  /* =============================================================== CINDERHOLD */
  FP.defMap('cinder', function () {
    var m = H.make(30, 24, 'ash', TI.ASH), rng = FP.mulberry32(2202);
    m.name = 'Cinderhold'; m.music = 'cinderhold'; m.zone = null;
    H.border(m, TI.WALLS, 2);
    H.rect(m, 14, 22, 2, 2, TI.PATH); H.rect(m, 14, 6, 2, 16, TI.PATH);
    H.hline(m, 3, 27, 12, TI.PATH); H.hline(m, 3, 27, 18, TI.PATH);
    var hall = H.house(m, 10, 2, 10, 1, 4, 4);
    var d2 = H.house(m, 3, 8, 6, 0, 2), d3 = H.house(m, 21, 8, 6, 2, 2), d4 = H.house(m, 3, 14, 5, 1, 2), d5 = H.house(m, 21, 14, 6, 3, 2);
    [hall, d2, d3, d4, d5].forEach(function (d) { H.put(m, d.x, d.y + 1, TI.PATH); });
    H.put(m, hall.x, hall.y + 1, TI.PATH);
    link(m, hall, 'ci_hall', 12, 9, 6); link(m, d2, 'ci_inn', 10, 8); link(m, d3, 'ci_shop', 9, 7); link(m, d4, 'ci_smith', 9, 7); link(m, d5, 'ci_pit', 10, 8);
    /* brazier shrine */
    H.put(m, 12, 8, TI.SHRINE); H.put(m, 17, 8, TI.LAMPC); H.put(m, 12, 6, TI.LAMPC); H.put(m, 17, 6, TI.LAMPC);
    /* lava pools (solid) and dead trees */
    H.rect(m, 3, 3, 3, 2, TI.LAVA); H.rect(m, 24, 3, 3, 2, TI.LAVA); H.rect(m, 3, 20, 4, 1, TI.LAVA); H.rect(m, 23, 20, 4, 1, TI.LAVA);
    H.put(m, 8, 6, TI.DEADTREE); H.put(m, 21, 6, TI.DEADTREE); H.put(m, 9, 20, TI.DEADTREE); H.put(m, 20, 20, TI.DEADTREE);
    H.scatter(m, rng, [TI.ROCK, TI.DEADTREE, TI.ASH, TI.ASH], 24, function (x, y, t) { return t === TI.ASH && x > 2 && x < 27 && y > 2 && y < 21 && !(x >= 13 && x <= 16) && y !== 11 && y !== 12 && y !== 17 && y !== 18 && !(y === 6) && !(x < 9 && y > 5 && y < 11) ; });
    H.warp(m, 14, 23, 'over', 0, 0, 'd'); H.warp(m, 15, 23, 'over', 0, 0, 'd'); m.exit = true;
    m.entry = { x: 14, y: 21, dir: 'u' };
    m.shrine = { x: 12, y: 8 };
    H.put(m, 16, 19, TI.SIGN); H.act(m, 16, 19, { text: 'CINDERHOLD\nWe burned. We stayed.' });
    H.npc(m, 'ember', 9, 11, 'child', 'Ember', function (G) {
      return G.arc === 'villain' ? ['Sable says you are going to bring us the Chimes. I told everyone you would. Do not make me wrong.']
        : ['You smell like soap. Are you a Warden? I will not talk to a Warden. I am talking to you right now though, so. Hm.'];
    }, { wander: 2 });
    H.npc(m, 'cinder_vet', 19, 14, 'raider', 'Old Brand', function (G) {
      return G.arc === 'villain' ? ['Eleven years ago the Wardens walled the ash in and called it mercy. Eleven years. Go on, make them remember us.']
        : ['Not many surface-folk come this far down the road. Your Warden friends know the way, though. They brought the wall.'];
    }, { wander: 1 });
    H.npc(m, 'cinder_cook', 22, 11, 'villagerC', 'Cook Hesper', function (G) { return ['Ash-bread. It tastes like regret and it is the best thing in the valley.']; }, { wander: 2 });
    H.npc(m, 'cinder_guard', 13, 19, 'ashen', 'Ashen Sentry', function (G) {
      return G.arc === 'villain' ? ['The road is open to you, kin of ash. The Crown Guard at the old fence will not let our like pass. Remember that.'] : ['Warden? Hm. You may walk. You may not stay long.'];
    }, { wander: 0 });
    H.npc(m, 'cinder_old', 6, 17, 'elder', 'Grandmother Ash', function () { return ['The Bell used to ring over this valley. Then the ash came, and no one rang it for us.']; });
    return m;
  });
  interior({ id: 'ci_hall', parent: 'cinder', door: { x: 14, y: 5 }, w: 12, h: 9, exitX: 6, name: 'The Ember Hall', music: 'cinderhold', fill: function (m, w, h) {
    H.put(m, 2, 1, TI.BANNER); H.put(m, 4, 1, TI.TORCH); H.put(m, 6, 1, TI.HEARTH); H.put(m, 8, 1, TI.TORCH); H.put(m, 10, 1, TI.BANNER);
    H.rect(m, 4, 3, 5, 5, TI.CARPET); H.rect(m, 5, 2, 3, 1, TI.CARPET);
    H.put(m, 3, 3, TI.PILLAR); H.put(m, 9, 3, TI.PILLAR); H.put(m, 3, 6, TI.PILLAR); H.put(m, 9, 6, TI.PILLAR);
    H.put(m, 1, 3, TI.TABLE); H.put(m, 1, 4, TI.CHAIR); H.put(m, 10, 3, TI.TABLE); H.put(m, 10, 4, TI.CHAIR);
    H.npc(m, 'sable', 6, 3, 'sable', 'Sable', 'ev:sable', { cast: 'sable', npcCast: 'sable' });
    H.npc(m, 'corvin_h', 8, 4, 'corvin', 'Corvin', 'ev:corvinhall', { cast: 'corvin', npcCast: 'corvin' });
  } });
  interior({ id: 'ci_inn', parent: 'cinder', door: { x: 5, y: 10 }, w: 10, h: 8, name: 'The Banked Fire', music: 'hearth', fill: function (m, w, h) {
    H.put(m, 2, 1, TI.WINDOWI); H.put(m, 4, 1, TI.HEARTH); H.put(m, 7, 1, TI.WINDOWI); H.rect(m, 1, 3, 8, 1, TI.COUNTER); H.put(m, 1, 5, TI.BED); H.put(m, 2, 5, TI.BED); H.put(m, 7, 5, TI.BED); H.put(m, 8, 5, TI.BED);
    H.npc(m, 'rue', 4, 2, 'innkeeper', 'Rue', null, { inn: 10, face: 'd' });
  } });
  interior({ id: 'ci_shop', parent: 'cinder', door: { x: 23, y: 10 }, w: 9, h: 7, name: 'Ashmarket', music: 'hearth', fill: function (m, w, h) {
    shelfRow(m, 1, 2, 1); H.put(m, 3, 1, TI.WINDOWI); shelfRow(m, 5, 7, 1); H.rect(m, 1, 3, 7, 1, TI.COUNTER);
    H.npc(m, 'kettle', 4, 2, 'merchant', 'Kettle', null, { shop: 'cinder', face: 'd' });
  } });
  interior({ id: 'ci_smith', parent: 'cinder', door: { x: 5, y: 16 }, w: 9, h: 7, name: 'The Anvil Pit', music: 'hearth', fill: function (m, w, h) {
    H.put(m, 2, 1, TI.FORGE); H.put(m, 4, 1, TI.FORGE); H.put(m, 6, 1, TI.WINDOWI); H.put(m, 5, 2, TI.ANVIL); H.rect(m, 1, 4, 6, 1, TI.COUNTER);
    H.npc(m, 'tallow', 3, 3, 'smith', 'Tallow', null, { smith: true, face: 'd' });
  } });
  interior({ id: 'ci_pit', parent: 'cinder', door: { x: 23, y: 16 }, w: 10, h: 8, name: 'The Kin Pit', music: 'hearth', fill: function (m, w, h) {
    H.put(m, 3, 1, TI.WINDOWI); H.put(m, 6, 1, TI.WINDOWI); H.rect(m, 1, 2, 8, 1, TI.FENCE);
    H.npc(m, 'kin_s', 2, 3, 'kin:soot', 'Soot', function () { return ['A scrap of ash growls, then wags the one part of itself that is not on fire.']; }, { kin: 'soot' });
    H.npc(m, 'kin_g', 5, 3, 'kin:gloamhound', 'Gloamhound', function () { return ['A gaunt dusk-hound watches you. It has decided nothing yet.']; }, { kin: 'gloamhound' });
    H.npc(m, 'keeper_c', 7, 3, 'raider', 'Fen', null, { kinshop: 'cinder', face: 'd' });
  } });

  /* =============================================================== BRINEHAVEN */
  FP.defMap('brine', function () {
    var m = H.make(32, 24, 'coast', TI.GRASS), rng = FP.mulberry32(3303);
    m.name = 'Brinehaven'; m.music = 'brinehaven'; m.zone = null;
    var x, y;
    H.rect(m, 0, 0, 32, 5, TI.WATER); H.rect(m, 0, 0, 32, 2, TI.DEEP); H.rect(m, 0, 5, 32, 1, TI.SAND);
    H.border(m, TI.PINE, 1); H.rect(m, 0, 0, 32, 2, TI.DEEP); H.rect(m, 0, 2, 32, 3, TI.WATER);
    H.vline(m, 0, 6, 23, TI.PINE); H.vline(m, 31, 6, 23, TI.PINE); H.hline(m, 0, 31, 23, TI.PINE);
    /* piers */
    [7, 15, 24].forEach(function (px) { for (y = 2; y <= 5; y++) H.put(m, px, y, TI.DOCK); });
    H.put(m, 6, 3, TI.BOAT); H.put(m, 8, 3, TI.BOAT); H.put(m, 16, 3, TI.BOAT); H.put(m, 23, 3, TI.BOAT);
    H.rect(m, 14, 6, 2, 17, TI.PATH); H.rect(m, 14, 22, 2, 2, TI.PATH);
    H.hline(m, 2, 29, 12, TI.PATH); H.hline(m, 2, 29, 18, TI.PATH); H.hline(m, 2, 29, 6, TI.SAND);
    var d1 = H.house(m, 3, 8, 6, 3, 2), d2 = H.house(m, 17, 8, 6, 1, 2), d3 = H.house(m, 24, 8, 5, 0, 2);
    var d4 = H.house(m, 3, 14, 5, 2, 2), d5 = H.house(m, 9, 14, 4, 1, 1), d6 = H.house(m, 17, 14, 5, 3, 2), d7 = H.house(m, 24, 14, 5, 0, 2);
    [d1, d2, d3, d4, d5, d6, d7].forEach(function (d) { H.put(m, d.x, d.y + 1, TI.PATH); });
    link(m, d1, 'br_inn', 10, 8); link(m, d2, 'br_harbor', 10, 8); link(m, d3, 'br_shop', 9, 7);
    link(m, d4, 'br_smith', 9, 7); link(m, d5, 'br_kin', 10, 8); link(m, d6, 'br_net', 9, 7); link(m, d7, 'br_home', 9, 7);
    /* market stalls and cargo */
    H.put(m, 10, 8, TI.STALL0); H.put(m, 11, 8, TI.STALL2); H.put(m, 12, 8, TI.STALL1);
    H.put(m, 10, 9, TI.CRATE); H.put(m, 12, 9, TI.BARREL); H.put(m, 20, 6, TI.CRATE); H.put(m, 9, 6, TI.BARREL); H.put(m, 22, 6, TI.NET);
    H.put(m, 13, 20, TI.LAMP); H.put(m, 16, 20, TI.LAMP); H.put(m, 6, 11, TI.SIGN); H.put(m, 16, 11, TI.SIGN);
    H.put(m, 20, 20, TI.WELL);
    H.scatter(m, rng, [TI.FLOWER, TI.BUSH, TI.TREE, TI.ROCK], 36, function (x, y, t) { return t === TI.GRASS && x > 1 && x < 30 && y > 6 && y < 22 && !(x >= 13 && x <= 16) && y !== 12 && y !== 18 && y !== 11 && y !== 17 && y !== 13; });
    m.shrine = { x: 12, y: 20 }; H.put(m, 12, 20, TI.SHRINE);
    H.warp(m, 14, 23, 'over', 0, 0, 'd'); H.warp(m, 15, 23, 'over', 0, 0, 'd'); m.exit = true;
    m.entry = { x: 14, y: 21, dir: 'u' };
    H.act(m, 6, 11, { text: 'BRINEHAVEN HARBOR\nTide tables posted daily. Fines for feeding the gulls.' });
    H.act(m, 16, 11, { text: 'Notice: The Saltwatch Beacon is dark. Ships stay in port. Ask the Harbormaster.' });
    return m;
  });
  interior({ id: 'br_inn', parent: 'brine', door: { x: 5, y: 10 }, w: 10, h: 8, name: 'Gull & Anchor Inn', music: 'hearth', fill: function (m, w, h) {
    H.put(m, 2, 1, TI.WINDOWI); H.put(m, 7, 1, TI.WINDOWI); H.put(m, 4, 1, TI.HEARTH); H.rect(m, 1, 3, 8, 1, TI.COUNTER); H.put(m, 1, 5, TI.BED); H.put(m, 2, 5, TI.BED); H.put(m, 7, 5, TI.BED); H.put(m, 8, 5, TI.BED);
    H.npc(m, 'marta', 4, 2, 'innkeeper', 'Marta', null, { inn: 20, face: 'd' });
    H.npc(m, 'sailorA', 8, 3, 'sailor', 'Sailor Jem', function (G) { return ['Dark beacon means no ships. No ships means I drink here. I am not complaining, but I am concerned.']; });
  } });
  interior({ id: 'br_harbor', parent: 'brine', door: { x: 19, y: 10 }, w: 10, h: 8, name: 'Harbormaster\'s Office', music: 'hearth', fill: function (m, w, h) {
    H.put(m, 2, 1, TI.WINDOWI); H.put(m, 7, 1, TI.WINDOWI); H.put(m, 4, 1, TI.SHELF); H.put(m, 5, 1, TI.SHELF); H.rect(m, 1, 3, 4, 1, TI.COUNTER); H.rect(m, 3, 5, 4, 2, TI.RUG); H.put(m, 8, 2, TI.TABLE);
    H.npc(m, 'hollis', 3, 2, 'harbormaster', 'Hollis', 'ev:hollis', { cast: 'harbor' });
    H.npc(m, 'iola', 7, 5, 'iola', 'Iola Quill', 'ev:iola', { cast: 'iola' });
  } });
  interior({ id: 'br_shop', parent: 'brine', door: { x: 26, y: 10 }, w: 9, h: 7, name: 'Gull & Anchor Supply', music: 'hearth', fill: function (m, w, h) {
    shelfRow(m, 1, 2, 1); H.put(m, 3, 1, TI.WINDOWI); shelfRow(m, 5, 7, 1); H.rect(m, 1, 3, 7, 1, TI.COUNTER);
    H.npc(m, 'bosun', 4, 2, 'sailor', 'Bosun', null, { shop: 'brine', face: 'd' });
  } });
  interior({ id: 'br_smith', parent: 'brine', door: { x: 5, y: 16 }, w: 9, h: 7, name: 'Gorm\'s Ironworks', music: 'hearth', fill: function (m, w, h) {
    H.put(m, 2, 1, TI.FORGE); H.put(m, 3, 1, TI.WINDOWI); H.put(m, 5, 2, TI.ANVIL); H.put(m, 7, 2, TI.BARREL); H.rect(m, 1, 4, 6, 1, TI.COUNTER);
    H.npc(m, 'gorm', 3, 3, 'smith', 'Gorm', null, { smith: true, face: 'd' });
  } });
  interior({ id: 'br_kin', parent: 'brine', door: { x: 10, y: 16 }, w: 10, h: 8, name: 'Seabird Kin Shop', music: 'hearth', fill: function (m, w, h) {
    H.put(m, 3, 1, TI.WINDOWI); H.put(m, 6, 1, TI.WINDOWI); H.rect(m, 1, 2, 8, 1, TI.FENCE);
    H.npc(m, 'kin_gw', 2, 3, 'kin:gullwing', 'Gullwing', function () { return ['A gull-Kin preens. It looks at your pockets. It looks at you. It looks at your pockets.']; }, { kin: 'gullwing' });
    H.npc(m, 'kin_bc', 5, 3, 'kin:brinecrab', 'Brinecrab', function () { return ['A little crab with large opinions clacks at you from a bucket.']; }, { kin: 'brinecrab' });
    H.npc(m, 'keeper_b', 7, 3, 'fisher', 'Seabird Sue', null, { kinshop: 'brine', face: 'd' });
  } });
  interior({ id: 'br_net', parent: 'brine', door: { x: 19, y: 16 }, w: 9, h: 7, name: 'Net Mender\'s', fill: homeFill(function (m, w, h) {
    H.npc(m, 'netwife', 6, 4, 'villagerC', 'Dara', function (G) { return ['My husband takes the Marrow Skiff out past the Beacon. He has not come back. The Hush sits out there, I think. Just sits.']; });
    H.put(m, 2, 3, TI.NET);
  }) });
  interior({ id: 'br_home', parent: 'brine', door: { x: 26, y: 16 }, w: 9, h: 7, name: 'Cottage', fill: homeFill(function (m, w, h) {
    H.npc(m, 'cottagekid', 5, 4, 'child', 'Fiddle', function (G) { return ['There is a Lampwisp in the lighthouse. Everybody knows. Nobody goes up. It is crying.']; });
  }) });

  /* =============================================================== HIGHMOOR */
  FP.defMap('highmoor', function () {
    var m = H.make(34, 32, 'castle', TI.GRASS), rng = FP.mulberry32(4404);
    m.name = 'Highmoor'; m.music = 'castle'; m.zone = null;
    H.border(m, TI.WALLS, 1);
    /* keep and towers */
    H.stoneHouse(m, 9, 2, 16, 1, 7, 7);
    H.put(m, 16, 8, TI.GATE); H.put(m, 17, 8, TI.GATE);
    [7, 25].forEach(function (tx) { H.rect(m, tx, 3, 2, 6, TI.WALLS); H.put(m, tx, 2, TI.ROOFT3); H.put(m, tx + 1, 2, TI.ROOFT3); H.put(m, tx, 3, TI.ROOF3); H.put(m, tx + 1, 3, TI.ROOF3); H.put(m, tx, 5, TI.WINDOWI); H.put(m, tx + 1, 5, TI.WINDOWI); });
    [11, 13, 20, 22].forEach(function (bx) { H.put(m, bx, 6, TI.WINDOWI); });
    /* roads and plaza */
    H.rect(m, 15, 9, 4, 21, TI.COBBLE); H.rect(m, 3, 15, 28, 1, TI.COBBLE); H.rect(m, 3, 23, 28, 1, TI.COBBLE);
    H.rect(m, 10, 9, 14, 2, TI.COBBLE); H.rect(m, 11, 17, 12, 3, TI.COBBLE);
    var inn = H.stoneHouse(m, 3, 12, 6, 1, 2), arm = H.stoneHouse(m, 3, 20, 6, 3, 2), smi = H.stoneHouse(m, 25, 12, 6, 0, 2), stb = H.stoneHouse(m, 25, 20, 6, 2, 2);
    [inn, arm, smi, stb].forEach(function (d) { H.put(m, d.x, d.y + 1, TI.COBBLE); });
    link(m, inn, 'hm_inn', 10, 8); link(m, arm, 'hm_shop', 9, 7); link(m, smi, 'hm_smith', 9, 7); link(m, stb, 'hm_stable', 10, 8);
    for (var i = 0; i < 2; i++) { H.put(m, inn.x, inn.y + 1 + i, TI.COBBLE); }
    H.put(m, 12, 18, TI.FOUNTAIN); H.put(m, 21, 18, TI.FOUNTAIN); H.put(m, 11, 10, TI.LAMPC); H.put(m, 22, 10, TI.LAMPC); H.put(m, 14, 26, TI.LAMPC); H.put(m, 19, 26, TI.LAMPC);
    H.put(m, 13, 9, TI.STATUE); H.put(m, 20, 9, TI.STATUE); H.put(m, 14, 28, TI.BANNER); H.put(m, 19, 28, TI.BANNER);
    H.rect(m, 10, 25, 3, 3, TI.FLOWER); H.rect(m, 21, 25, 3, 3, TI.FLOWER); H.rect(m, 10, 12, 3, 2, TI.FLOWER); H.rect(m, 21, 12, 3, 2, TI.FLOWER);
    H.scatter(m, rng, [TI.BUSH, TI.FLOWER, TI.TREE], 14, function (x, y, t) { return t === TI.GRASS && x > 1 && x < 32 && y > 10 && y < 29 && !(x >= 14 && x <= 19) && y !== 14 && y !== 15 && y !== 22 && y !== 23 && !(x < 10 && y > 10) && !(x > 23 && y > 10) && !(y >= 17 && y <= 19); });
    H.hline(m, 16, 17, 30, TI.GATE);
    H.warp(m, 16, 8, 'hm_keep', 6, 12, 'u'); H.warp(m, 17, 8, 'hm_keep', 7, 12, 'u');
    H.warp(m, 16, 30, 'over', 0, 0, 'd'); H.warp(m, 17, 30, 'over', 0, 0, 'd'); m.exit = true;
    m.entry = { x: 16, y: 28, dir: 'u' };
    m.shrine = { x: 12, y: 18 }; H.put(m, 12, 18, TI.SHRINE);
    H.npc(m, 'hm_guardA', 15, 10, 'royalguard', 'Royal Guard', function (G) { return G.arc === 'hero' ? ['The King will see Wardens and Lamp-folk. Walk in. Mind the carpet, it is older than the kingdom.'] : ['Ashen in Highmoor? Keep to the road and keep your hands empty. The King does not receive your kind.']; });
    H.npc(m, 'hm_guardB', 18, 10, 'royalguard', 'Royal Guard', function (G) { return ['Captain Vane is in the keep. He is in a mood. He is always in a mood.']; });
    H.npc(m, 'hm_noble', 7, 17, 'noble', 'Lady Orsolya', function (G) { return ['My nephew went down to the crypt to "see what all the noise was." That was nine days ago. He is a very curious boy.']; }, { wander: 2 });
    H.npc(m, 'hm_page', 22, 17, 'child', 'Page Wick', function (G) { return ['I carry messages. I am not allowed to read them. I read all of them.']; }, { wander: 2 });
    H.npc(m, 'hm_scribe', 28, 17, 'sage', 'Scribe Ebb', function (G) { return ['The old records say the Bell rang from this very moor. They also say it had a voice. Nobody wrote down what it said.']; });
    H.npc(m, 'hm_vet', 10, 25, 'villager', 'Veteran Lum', function (G) { return ['Forty years of watch duty and I have never seen the dead be this restless. Something under the moor is tuning up.']; }, { wander: 1 });
    return m;
  });
  interior({ id: 'hm_keep', parent: 'highmoor', door: { x: 16, y: 8 }, w: 14, h: 14, exitX: 6, name: 'The Keep', music: 'castle', fill: function (m, w, h) {
    H.vline(m, 0, 2, h - 1, TI.WALLI);
    H.rect(m, 5, 2, 4, 9, TI.CARPET); H.rect(m, 4, 2, 6, 1, TI.CARPET);
    [3, 5, 8, 10].forEach(function (x) { H.put(m, x, 1, TI.BANNER); });
    H.put(m, 6, 1, TI.TORCH); H.put(m, 7, 1, TI.TORCH);
    [3, 10].forEach(function (x) { H.put(m, x, 4, TI.PILLAR); H.put(m, x, 7, TI.PILLAR); });
    H.put(m, 6, 2, TI.THRONE); H.put(m, 7, 2, TI.THRONE);
    H.put(m, 1, 3, TI.SHELF); H.put(m, 1, 4, TI.SHELF); H.put(m, 12, 3, TI.SHELF); H.put(m, 12, 4, TI.SHELF);
    H.npc(m, 'king', 6, 3, 'king', 'King Berenhart', 'ev:king', { cast: 'berenhart' });
    H.npc(m, 'vane', 9, 5, 'vane', 'Captain Vane', 'ev:vane', { cast: 'vane' });
    H.put(m, 7, 13, TI.EXIT); H.warp(m, 7, 13, 'highmoor', 17, 9, 'd');
    m.entry = { x: 6, y: 12, dir: 'u' };
  } });
  interior({ id: 'hm_inn', parent: 'highmoor', door: { x: 5, y: 14 }, w: 10, h: 8, name: 'The Pale Lantern', music: 'hearth', fill: function (m, w, h) {
    H.put(m, 2, 1, TI.WINDOWI); H.put(m, 7, 1, TI.WINDOWI); H.put(m, 4, 1, TI.HEARTH); H.rect(m, 1, 3, 8, 1, TI.COUNTER); H.put(m, 1, 5, TI.BED); H.put(m, 2, 5, TI.BED); H.put(m, 7, 5, TI.BED); H.put(m, 8, 5, TI.BED);
    H.npc(m, 'ottilie', 4, 2, 'innkeeper', 'Ottilie', null, { inn: 30, face: 'd' });
  } });
  interior({ id: 'hm_shop', parent: 'highmoor', door: { x: 5, y: 22 }, w: 9, h: 7, name: 'Highmoor Armory', music: 'hearth', fill: function (m, w, h) {
    shelfRow(m, 1, 2, 1); H.put(m, 3, 1, TI.WINDOWI); shelfRow(m, 5, 7, 1); H.rect(m, 1, 3, 7, 1, TI.COUNTER);
    H.npc(m, 'quartermaster', 4, 2, 'guard', 'Quartermaster', null, { shop: 'highmoor', face: 'd' });
  } });
  interior({ id: 'hm_smith', parent: 'highmoor', door: { x: 27, y: 14 }, w: 9, h: 7, name: 'The Royal Forge', music: 'hearth', fill: function (m, w, h) {
    H.put(m, 2, 1, TI.FORGE); H.put(m, 3, 1, TI.WINDOWI); H.put(m, 5, 2, TI.ANVIL); H.rect(m, 1, 4, 6, 1, TI.COUNTER);
    H.npc(m, 'brunhild', 3, 3, 'smith', 'Brunhild', null, { smith: true, face: 'd' });
  } });
  interior({ id: 'hm_stable', parent: 'highmoor', door: { x: 27, y: 22 }, w: 10, h: 8, name: 'Moor Stables', music: 'hearth', fill: function (m, w, h) {
    H.put(m, 3, 1, TI.WINDOWI); H.put(m, 6, 1, TI.WINDOWI); H.rect(m, 1, 2, 8, 1, TI.FENCE);
    H.npc(m, 'kin_cm', 2, 3, 'kin:cragmole', 'Cragmole', function () { return ['A bristly mole in a feed trough. It sniffs your boots professionally.']; }, { kin: 'cragmole' });
    H.npc(m, 'kin_em', 5, 3, 'kin:emberling', 'Emberling', function () { return ['A fox of tiny flame tries to look dignified and fails.']; }, { kin: 'emberling' });
    H.npc(m, 'keeper_h', 7, 3, 'guard', 'Stablehand Moss', null, { kinshop: 'highmoor', face: 'd' });
  } });
})(FP);
