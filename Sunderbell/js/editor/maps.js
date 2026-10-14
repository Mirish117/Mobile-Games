/* Sunderbell editor - Maps: paint tiles, place and edit objects (NPCs, enemies, chests, doors, triggers, puzzles), map settings. */
(function () {
  'use strict';
  var SB = window.SB, ED = window.ED, h = ED.h, T = 16;

  /* object types and their editable fields: [key, type, extra] */
  var C = 'text';
  var TYPES = {
    npc: { label: 'Character (NPC)', f: [['who', 'char'], ['scene', 'scene'], ['dir', 'dir'], ['wander', 'check'], ['ghost', 'check'], ['greyIf', C]] },
    sign: { label: 'Sign / readable', f: [['scene', 'scene'], ['sprite', 'sprite']] },
    chest: { label: 'Chest', f: [['item', 'item'], ['n', 'number'], ['flag', C]] },
    pot: { label: 'Pot (breakable)', f: [] },
    enemy: { label: 'Enemy', f: [['kind', 'enemy']] },
    boss: { label: 'Boss', f: [['kind', 'boss'], ['flag', C], ['outro', 'scene']] },
    warp: { label: 'Exit / door (warp)', zone: true, f: [['w', 'number'], ['h', 'number'], ['to', 'map'], ['tx', 'number'], ['ty', 'number'], ['dir', 'dir'], ['require', C], ['deny', 'scene']] },
    trigger: { label: 'Trigger zone (runs a scene)', zone: true, f: [['w', 'number'], ['h', 'number'], ['scene', 'scene'], ['require', C], ['once', C]] },
    watch: { label: 'Watcher (runs a scene when a condition is true)', nopos: true, f: [['when', C], ['scene', 'scene'], ['once', C]] },
    block: { label: 'Pushable block', f: [['weight', 'number'], ['skin', 'sel:block,crate,block_heavy'], ['lockWhen', C]] },
    plate: { label: 'Pressure plate', f: [['group', C]] },
    gate: { label: 'Gate (opens on a condition)', f: [['when', C], ['latch', C], ['scene', 'scene']] },
    crystal: { label: 'Crystal switch', f: [['flag', C], ['scene', 'scene']] },
    torch: { label: 'Torch (Mira lights it)', f: [['group', C], ['lit', 'check']] },
    lamp: { label: 'Lamp (lit once, sets a flag)', f: [['flag', C], ['scene', 'scene'], ['require', C]] },
    lockdoor: { label: 'Locked door (needs a key)', f: [['flag', C]] },
    fogwall: { label: 'Fog wall (blocks until hidden)', zone: true, f: [['w', 'number'], ['h', 'number'], ['scene', 'scene']] },
    tileswap: { label: 'Tile swap (changes tiles on a condition)', zone: true, f: [['w', 'number'], ['h', 'number'], ['tile', 'tile'], ['when', C]] },
    carving: { label: 'Wall carving (readable)', f: [['scene', 'scene']] },
    tone: { label: 'Tone pickup', f: [['sprite', 'sprite'], ['scene', 'scene']] },
    deco: { label: 'Decoration sprite', f: [['sprite', 'sprite'], ['solid', 'check'], ['light', 'number']] },
    heal: { label: 'Bed (heal + save)', f: [['sprite', 'sprite']] },
    bell: { label: 'The Sunderbell', f: [['scene', 'scene']] }
  };
  var COMMON = [['id', C], ['x', 'number'], ['y', 'number'], ['showIf', C], ['hideIf', C]];
  ED.ENT_TYPES = TYPES;

  function entSprite(e) {
    var D = ED.D;
    switch (e.type) {
      case 'npc': { var ch = D.characters[e.who] || {}, b = ch.sprite || e.who; return [ED.gfx.has(b + '_' + (e.dir === 'left' || e.dir === 'right' ? 'side' : e.dir || 'down')) ? b + '_' + (e.dir === 'left' || e.dir === 'right' ? 'side' : e.dir || 'down') : b + '_down', 0, e.dir === 'left']; }
      case 'enemy': return [(D.enemies[e.kind] || {}).sprite || 'fogling', 0];
      case 'boss': return [(D.bosses[e.kind] || {}).sprite || 'heart', 0];
      case 'chest': return ['chest', 0]; case 'sign': return [e.sprite || 'sign', 0]; case 'pot': return ['pot', 0];
      case 'block': return [e.skin || 'block', 0]; case 'plate': return ['plate', 0]; case 'gate': return ['gate', 0];
      case 'crystal': return ['crystal', 0]; case 'torch': return ['torch', e.lit ? 1 : 0]; case 'lamp': return ['lamp', 0];
      case 'lockdoor': return ['lockdoor', 0]; case 'tone': return [e.sprite || 'tone_wood', 0]; case 'deco': return [e.sprite, 0];
      case 'heal': return [e.sprite || 'bed', 0]; case 'bell': return ['bell', 0]; case 'carving': return ['carving', 0];
    }
    return null;
  }

  ED.register('maps', 'Maps', function (main) {
    var D = ED.D, sel = ED.sel.maps;
    if (sel && !D.maps[sel]) sel = ED.sel.maps = null;
    var detail = ED.listDetail(main, {
      items: Object.keys(D.maps).map(function (id) { var m = D.maps[id]; return { id: id, label: m.name || id, sub: id + '  ' + m.tiles[0].length + '×' + m.tiles.length + (m.dark ? '  dark' : '') }; }),
      selected: sel, onSelect: function (id) { ED.sel.maps = id; ED.sel.mapEnt = null; ED.rerender(); },
      add: newMap
    });
    if (!sel) { detail.appendChild(h('div.big-empty', null, ['Pick a map to edit, or tap + New.'])); return; }
    detail.style.padding = '0'; detail.style.display = 'flex'; detail.style.flexDirection = 'column'; detail.style.overflow = 'hidden';
    mapEditor(detail, sel);
  });

  function newMap() {
    var o = { id: 'new_map', name: 'New Map', w: 24, h: 16, fill: '.', wall: 'T' };
    ED.modal('New map', h('div', null, [ED.field(o, 'id', { label: 'Id (lowercase)' }), ED.field(o, 'name', { label: 'Name' }), h('div.grid2', null, [ED.field(o, 'w', { type: 'number', label: 'Width (tiles)' }), ED.field(o, 'h', { type: 'number', label: 'Height (tiles)' })]), h('div.grid2', null, [ED.field(o, 'fill', { type: 'select', blank: false, label: 'Ground tile', options: tileOpts }), ED.field(o, 'wall', { type: 'select', label: 'Border tile', options: tileOpts })])]), [['Cancel', null], ['Create', function () {
      if (!ED.validId(o.id) || ED.D.maps[o.id]) { alert('Invalid or existing id'); return false; }
      var w = Math.max(4, Math.min(200, o.w | 0)), hh = Math.max(4, Math.min(200, o.h | 0)), rows = [];
      for (var y = 0; y < hh; y++) { var r = ''; for (var x = 0; x < w; x++) r += (o.wall && (x === 0 || y === 0 || x === w - 1 || y === hh - 1)) ? o.wall : o.fill; rows.push(r); }
      ED.D.maps[o.id] = { name: o.name, music: 'village', w: w, h: hh, tiles: rows, start: [1, 1], ents: [] };
      ED.commit(); ED.sel.maps = o.id; ED.rerender();
    }, 'hot']]);
  }
  function tileOpts() { return Object.keys(ED.D.tiles).map(function (k) { return [k, JSON.stringify(k) + ' ' + ED.D.tiles[k].name]; }); }

  /* ======================= the map canvas editor ======================= */
  function mapEditor(root, mid) {
    var D = ED.D, m = D.maps[mid];
    var view = ED.mapViews = ED.mapViews || {};
    var V = view[mid] = view[mid] || { z: 0, ox: 0, oy: 0 };
    var st = { mode: ED.sel.mapMode || 'pan', tile: ED.sel.mapTile || '.', ent: ED.sel.mapEnt ? m.ents.filter(function (e) { return e.id === ED.sel.mapEnt; })[0] : null, placing: null, testHere: false };
    var wrap = h('div.mapwrap'), cv = h('canvas'), ctx = cv.getContext('2d');
    var tools = h('div.mtools'), tileBar = h('div.tilebar'), info = h('div.mapinfo'), sheet = h('div.sheet.hidden');
    wrap.appendChild(cv); wrap.appendChild(tools); wrap.appendChild(info); wrap.appendChild(tileBar); wrap.appendChild(sheet);
    root.appendChild(wrap);
    function rows() { return m.tiles; }
    function W() { return m.tiles[0].length; } function H() { return m.tiles.length; }

    /* ---- toolbar ---- */
    function toolBtn(id, label, title) { return ED.btn(label, function () { st.mode = id; ED.sel.mapMode = id; st.placing = null; st.testHere = false; drawTools(); render(); }, 'sm' + (st.mode === id ? ' on' : ''), title); }
    function drawTools() {
      tools.innerHTML = '';
      tools.appendChild(ED.btn('◀', function () { ED.sel.maps = null; ED.rerender(); }, 'sm backbtn'));
      [['pan', '✋ Move', 'Drag to look around'], ['paint', '✏ Paint', 'Paint tiles'], ['rect', '▭ Box', 'Fill a rectangle'], ['fill', '◉ Fill', 'Flood fill'], ['pick', '⌖ Pick', 'Pick a tile from the map'], ['obj', '◆ Objects', 'Select, move and edit objects']].forEach(function (t) { tools.appendChild(toolBtn(t[0], t[1], t[2])); });
      tools.appendChild(ED.btn('+ Object', function () { addObject(); }, 'sm hot'));
      tools.appendChild(ED.btn('☰ List', listObjects, 'sm'));
      tools.appendChild(ED.btn('⚙ Map', mapSettings, 'sm'));
      tools.appendChild(ED.btn('▶ Test here', function () { st.testHere = true; ED.status('Tap where the party should start.'); }, 'sm'));
      tools.appendChild(ED.btn('−', function () { zoomAt(cv.width / 2, cv.height / 2, 1 / 1.4); }, 'sm'));
      tools.appendChild(ED.btn('+', function () { zoomAt(cv.width / 2, cv.height / 2, 1.4); }, 'sm'));
      tileBar.classList.toggle('hidden', !/paint|rect|fill|pick/.test(st.mode));
    }
    function drawTileBar() {
      tileBar.innerHTML = '';
      Object.keys(D.tiles).forEach(function (k) {
        var t = D.tiles[k], b = h('div.tb' + (k === st.tile ? '.on' : ''), { title: t.name + ' (' + k + ')', on: { click: function () { st.tile = k; ED.sel.mapTile = k; if (st.mode === 'pan' || st.mode === 'obj' || st.mode === 'pick') { st.mode = 'paint'; drawTools(); } drawTileBar(); } } }, [ED.thumb(t.sprite, 32), h('b', null, [k === ' ' ? '␣' : k])]);
        tileBar.appendChild(b);
      });
      tileBar.appendChild(ED.btn('+ Tile', function () { ED.go('tiles'); }, 'sm'));
    }

    /* ---- view ---- */
    function fit() { var r = wrap.getBoundingClientRect(); var z = Math.max(.5, Math.min(4, Math.min(r.width / (W() * T), (r.height - 60) / (H() * T)))); V.z = z; V.ox = (r.width - W() * T * z) / 2; V.oy = Math.max(44, (r.height - H() * T * z) / 2); }
    function resize() { var r = wrap.getBoundingClientRect(), dpr = window.devicePixelRatio || 1; cv.width = r.width * dpr; cv.height = r.height * dpr; cv.style.width = r.width + 'px'; cv.style.height = r.height + 'px'; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); if (!V.z) fit(); render(); }
    function toTile(px, py) { return [Math.floor((px - V.ox) / (T * V.z)), Math.floor((py - V.oy) / (T * V.z))]; }
    function zoomAt(px, py, k) { var dpr = window.devicePixelRatio || 1; if (px > cv.width / dpr) { px /= dpr; py /= dpr; } var nz = Math.max(.25, Math.min(8, V.z * k)); V.ox = px - (px - V.ox) * nz / V.z; V.oy = py - (py - V.oy) * nz / V.z; V.z = nz; render(); }

    var frameT = 0;
    function render() {
      var r = cv.getBoundingClientRect(); ctx.imageSmoothingEnabled = false; ctx.fillStyle = '#07050c'; ctx.fillRect(0, 0, r.width, r.height);
      var s = T * V.z, tr = rows();
      var x0 = Math.max(0, Math.floor(-V.ox / s)), y0 = Math.max(0, Math.floor(-V.oy / s)), x1 = Math.min(W() - 1, Math.ceil((r.width - V.ox) / s)), y1 = Math.min(H() - 1, Math.ceil((r.height - V.oy) / s));
      for (var y = y0; y <= y1; y++) for (var x = x0; x <= x1; x++) { var td = D.tiles[tr[y][x]]; var im = td && ED.gfx.frame(td.sprite, 0); if (im) ctx.drawImage(im, V.ox + x * s, V.oy + y * s, s + .5, s + .5); else { ctx.fillStyle = '#f0f'; ctx.fillRect(V.ox + x * s, V.oy + y * s, s, s); } }
      if (V.z >= 1.5) { ctx.strokeStyle = 'rgba(255,255,255,.07)'; ctx.lineWidth = 1; ctx.beginPath(); for (var gx = x0; gx <= x1 + 1; gx++) { ctx.moveTo(V.ox + gx * s, V.oy + y0 * s); ctx.lineTo(V.ox + gx * s, V.oy + (y1 + 1) * s); } for (var gy = y0; gy <= y1 + 1; gy++) { ctx.moveTo(V.ox + x0 * s, V.oy + gy * s); ctx.lineTo(V.ox + (x1 + 1) * s, V.oy + gy * s); } ctx.stroke(); }
      if (m.dark) { ctx.fillStyle = 'rgba(0,0,30,.25)'; ctx.fillRect(V.ox, V.oy, W() * s, H() * s); }
      /* objects */
      var showObj = st.mode === 'obj' || ED.sel.alwaysObj !== false;
      if (showObj) m.ents.forEach(function (e) {
        if (TYPES[e.type] && TYPES[e.type].nopos) return;
        var ex = V.ox + e.x * s, ey = V.oy + e.y * s, sel = e === st.ent;
        if (TYPES[e.type] && TYPES[e.type].zone) {
          var col = { warp: '0,200,255', trigger: '255,80,255', tileswap: '80,255,120', fogwall: '200,200,220' }[e.type] || '255,255,255';
          ctx.fillStyle = 'rgba(' + col + ',' + (sel ? .35 : .18) + ')'; ctx.fillRect(ex, ey, (e.w || 1) * s, (e.h || 1) * s);
          ctx.strokeStyle = 'rgba(' + col + ',.9)'; ctx.lineWidth = sel ? 2 : 1; ctx.strokeRect(ex + .5, ey + .5, (e.w || 1) * s - 1, (e.h || 1) * s - 1);
          if (e.type === 'tileswap') { var ti = D.tiles[e.tile]; var timg = ti && ED.gfx.frame(ti.sprite, 0); if (timg) { ctx.globalAlpha = .55; for (var yy = 0; yy < (e.h || 1); yy++) for (var xx = 0; xx < (e.w || 1); xx++) ctx.drawImage(timg, ex + xx * s, ey + yy * s, s, s); ctx.globalAlpha = 1; } }
          if (V.z > .7) { ctx.fillStyle = '#fff'; ctx.font = '10px system-ui'; ctx.fillText(e.type === 'warp' ? '→ ' + e.to : e.type === 'trigger' ? '⚡ ' + (e.scene || '') : e.type, ex + 2, ey + 11); }
        } else {
          var sp = entSprite(e);
          if (sp && sp[0]) { var im2 = ED.gfx.frame(sp[0], sp[1]); if (im2) { var w2 = im2.width * V.z, h2 = im2.height * V.z; if (e.type === 'bell' || e.type === 'boss') { ctx.drawImage(im2, ex, ey, w2, h2); } else { if (sp[2]) { ctx.save(); ctx.translate(ex + s / 2 + w2 / 2, 0); ctx.scale(-1, 1); ctx.drawImage(im2, 0, ey + s - h2, w2, h2); ctx.restore(); } else ctx.drawImage(im2, ex + s / 2 - w2 / 2, ey + s - h2, w2, h2); } } }
          else { ctx.fillStyle = 'rgba(255,255,255,.4)'; ctx.fillRect(ex + 3, ey + 3, s - 6, s - 6); }
          if (e.showIf || e.hideIf) { ctx.fillStyle = '#ffd84a'; ctx.beginPath(); ctx.arc(ex + s - 3, ey + 3, 3, 0, 6.3); ctx.fill(); }
          if (sel) { ctx.strokeStyle = '#ffd84a'; ctx.lineWidth = 2; ctx.strokeRect(ex + 1, ey + 1, s - 2, s - 2); }
        }
      });
      if (m.start) { ctx.strokeStyle = '#7fe0a0'; ctx.setLineDash([3, 3]); ctx.strokeRect(V.ox + m.start[0] * s + 2, V.oy + m.start[1] * s + 2, s - 4, s - 4); ctx.setLineDash([]); }
      if (st.rect) { var a = st.rect; ctx.strokeStyle = '#ffd84a'; ctx.lineWidth = 2; ctx.strokeRect(V.ox + Math.min(a[0], a[2]) * s, V.oy + Math.min(a[1], a[3]) * s, (Math.abs(a[2] - a[0]) + 1) * s, (Math.abs(a[3] - a[1]) + 1) * s); }
      if (st.hover) { ctx.strokeStyle = 'rgba(255,255,255,.6)'; ctx.lineWidth = 1; ctx.strokeRect(V.ox + st.hover[0] * s + .5, V.oy + st.hover[1] * s + .5, s - 1, s - 1); }
      info.textContent = mid + '  ' + W() + '×' + H() + (st.hover ? '   tile ' + st.hover[0] + ',' + st.hover[1] + '  ' + JSON.stringify(tr[st.hover[1]] ? tr[st.hover[1]][st.hover[0]] || '' : '') : '') + (st.placing ? '   tap to place: ' + st.placing : '') + (st.testHere ? '   tap where to start' : '');
    }

    /* ---- painting ---- */
    function setTile(x, y, ch) { if (x < 0 || y < 0 || x >= W() || y >= H()) return; var r = m.tiles[y]; if (r[x] === ch) return; m.tiles[y] = r.slice(0, x) + ch + r.slice(x + 1); }
    function flood(x, y, ch) {
      var from = m.tiles[y] && m.tiles[y][x]; if (from == null || from === ch) return; var g = m.tiles.map(function (r) { return r.split(''); }), q = [[x, y]], n = 0;
      while (q.length && n < 20000) { var p = q.pop(), px = p[0], py = p[1]; if (px < 0 || py < 0 || px >= W() || py >= H() || g[py][px] !== from) continue; g[py][px] = ch; n++; q.push([px + 1, py], [px - 1, py], [px, py + 1], [px, py - 1]); }
      m.tiles = g.map(function (r) { return r.join(''); });
    }
    function entAt(tx, ty) {
      var best = null, ba = 1e9;
      m.ents.forEach(function (e) { if (TYPES[e.type] && TYPES[e.type].nopos) return; var w = e.w || (e.type === 'bell' ? 2 : e.type === 'boss' ? 3 : 1), hh = e.h || (e.type === 'bell' ? 2 : e.type === 'boss' ? 3 : 1); if (tx >= e.x && tx < e.x + w && ty >= e.y && ty < e.y + hh) { var a = w * hh; if (a < ba) { ba = a; best = e; } } });
      return best;
    }

    /* ---- pointer handling: one finger edits (or pans), two fingers pan + zoom ---- */
    var pts = {}, drag = null;
    function local(e) { var r = cv.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; }
    cv.addEventListener('pointerdown', function (e) {
      cv.setPointerCapture(e.pointerId); var p = local(e); pts[e.pointerId] = p;
      var ids = Object.keys(pts);
      if (ids.length === 2) { var a = pts[ids[0]], b = pts[ids[1]]; drag = { kind: 'pinch', d: Math.hypot(a[0] - b[0], a[1] - b[1]), cx: (a[0] + b[0]) / 2, cy: (a[1] + b[1]) / 2, z: V.z, ox: V.ox, oy: V.oy, undo: drag && drag.kind === 'paint' }; if (drag.undo) { /* cancel stroke */ } return; }
      if (ids.length > 2) return;
      var t = toTile(p[0], p[1]); st.hover = t;
      if (st.testHere) { st.testHere = false; ED.playtest({ mode: 'map', map: mid, x: t[0], y: t[1] }); render(); return; }
      if (st.placing) { placeAt(t[0], t[1]); return; }
      if (st.mode === 'pan' || e.button === 1 || e.button === 2) { drag = { kind: 'pan', sx: p[0], sy: p[1], ox: V.ox, oy: V.oy }; return; }
      if (st.mode === 'paint') { drag = { kind: 'paint' }; setTile(t[0], t[1], st.tile); render(); return; }
      if (st.mode === 'rect') { st.rect = [t[0], t[1], t[0], t[1]]; drag = { kind: 'rect' }; render(); return; }
      if (st.mode === 'fill') { flood(t[0], t[1], st.tile); ED.commit(); render(); return; }
      if (st.mode === 'pick') { var ch = m.tiles[t[1]] && m.tiles[t[1]][t[0]]; if (ch != null) { st.tile = ch; ED.sel.mapTile = ch; st.mode = 'paint'; drawTools(); drawTileBar(); } return; }
      if (st.mode === 'obj') {
        var en = entAt(t[0], t[1]);
        if (en) { st.ent = en; ED.sel.mapEnt = en.id; drag = { kind: 'move', e: en, dx: t[0] - en.x, dy: t[1] - en.y, moved: false }; entSheet(); }
        else { st.ent = null; ED.sel.mapEnt = null; sheet.classList.add('hidden'); drag = { kind: 'pan', sx: p[0], sy: p[1], ox: V.ox, oy: V.oy }; }
        render();
      }
    });
    cv.addEventListener('pointermove', function (e) {
      var p = local(e); if (pts[e.pointerId]) pts[e.pointerId] = p;
      var ids = Object.keys(pts);
      if (drag && drag.kind === 'pinch' && ids.length >= 2) { var a = pts[ids[0]], b = pts[ids[1]], d = Math.hypot(a[0] - b[0], a[1] - b[1]), cx = (a[0] + b[0]) / 2, cy = (a[1] + b[1]) / 2; var nz = Math.max(.25, Math.min(8, drag.z * d / drag.d)); V.z = nz; V.ox = cx - (drag.cx - drag.ox) * nz / drag.z; V.oy = cy - (drag.cy - drag.oy) * nz / drag.z; render(); return; }
      var t = toTile(p[0], p[1]); st.hover = t;
      if (!drag) { render(); return; }
      if (drag.kind === 'pan') { V.ox = drag.ox + p[0] - drag.sx; V.oy = drag.oy + p[1] - drag.sy; }
      else if (drag.kind === 'paint') setTile(t[0], t[1], st.tile);
      else if (drag.kind === 'rect') { st.rect[2] = t[0]; st.rect[3] = t[1]; }
      else if (drag.kind === 'move') { var nx = t[0] - drag.dx, ny = t[1] - drag.dy; if (nx !== drag.e.x || ny !== drag.e.y) { drag.e.x = nx; drag.e.y = ny; drag.moved = true; } }
      render();
    });
    function up(e) {
      delete pts[e.pointerId];
      if (!drag) return; var k = drag.kind;
      if (k === 'pinch') { if (Object.keys(pts).length === 0) drag = null; return; }
      if (k === 'paint') ED.commit();
      if (k === 'rect' && st.rect) { var a = st.rect; for (var y = Math.min(a[1], a[3]); y <= Math.max(a[1], a[3]); y++) for (var x = Math.min(a[0], a[2]); x <= Math.max(a[0], a[2]); x++) setTile(x, y, st.tile); st.rect = null; ED.commit(); }
      if (k === 'move' && drag.moved) { ED.commit(); entSheet(); }
      drag = null; render();
    }
    cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
    cv.addEventListener('wheel', function (e) { e.preventDefault(); var p = local(e); zoomAt(p[0], p[1], e.deltaY < 0 ? 1.15 : 1 / 1.15); }, { passive: false });
    cv.addEventListener('contextmenu', function (e) { e.preventDefault(); });

    /* ---- objects ---- */
    function uniqueId(base) { var n = 1, id = base; var ids = m.ents.map(function (e) { return e.id; }); while (ids.indexOf(id) >= 0) id = base + (++n); return id; }
    function addObject() {
      ED.modal('Add an object', h('div.typegrid', null, Object.keys(TYPES).map(function (t) {
        var sp = entSprite({ type: t, who: 'pell', kind: t === 'enemy' ? 'fogling' : t === 'boss' ? 'matron' : undefined, sprite: t === 'deco' ? 'well' : t === 'tone' ? 'tone_wood' : undefined });
        return h('button', { on: { click: function () { ED.closeModal(); if (TYPES[t].nopos) { placeAt(0, 0, t); return; } st.placing = t; st.mode = 'obj'; ED.sel.mapMode = 'obj'; drawTools(); ED.status('Tap the map to place: ' + TYPES[t].label); render(); } } }, [sp && sp[0] ? ED.thumb(sp[0], 28) : h('span', { text: '▢', style: { fontSize: '22px' } }), TYPES[t].label]);
      })), [['Cancel', null]]);
    }
    function placeAt(tx, ty, typeArg) {
      var type = typeArg || st.placing; st.placing = null;
      var e = { id: uniqueId(type), type: type, x: tx, y: ty };
      if (type === 'npc') { e.who = 'nim'; e.dir = 'down'; e.scene = ''; }
      if (type === 'enemy') e.kind = 'fogling';
      if (type === 'boss') { e.kind = 'matron'; e.flag = uniqueId('boss') + '_down'; }
      if (type === 'chest') { e.item = 'chimes'; e.n = 20; e.flag = mid + '_' + e.id; }
      if (type === 'warp') { e.w = 1; e.h = 1; e.to = mid; e.tx = 1; e.ty = 1; e.dir = 'down'; }
      if (type === 'trigger' || type === 'fogwall' || type === 'tileswap') { e.w = 2; e.h = 2; }
      if (type === 'trigger') { e.scene = ''; e.once = mid + '_' + e.id; }
      if (type === 'tileswap') { e.tile = 'b'; e.when = 'some_flag'; }
      if (type === 'watch') { e.when = 'plates:A'; e.scene = ''; e.once = mid + '_' + e.id; delete e.x; delete e.y; }
      if (type === 'block') { e.weight = 1; e.skin = 'block'; }
      if (type === 'plate') e.group = 'A';
      if (type === 'gate') { e.when = 'plates:A'; }
      if (type === 'crystal' || type === 'lamp' || type === 'lockdoor') e.flag = mid + '_' + e.id;
      if (type === 'torch') e.group = 'A';
      if (type === 'deco') { e.sprite = 'well'; e.solid = true; }
      if (type === 'tone') { e.sprite = 'tone_wood'; e.scene = ''; }
      m.ents.push(e); ED.commit(); st.ent = e; ED.sel.mapEnt = e.id; entSheet(); render();
    }
    function listObjects() {
      var box = h('div', null, m.ents.map(function (e) {
        var sp = entSprite(e);
        return h('div.row', { style: { padding: '4px 0', borderBottom: '1px solid var(--line)', cursor: 'pointer' }, on: { click: function () { ED.closeModal(); st.ent = e; ED.sel.mapEnt = e.id; st.mode = 'obj'; drawTools(); if (e.x != null) { var r = wrap.getBoundingClientRect(); V.ox = r.width / 2 - (e.x + .5) * T * V.z; V.oy = r.height / 2 - (e.y + .5) * T * V.z; } entSheet(); render(); } } }, [sp && sp[0] ? ED.thumb(sp[0], 24) : h('span', { style: { width: '24px' } }), h('b', null, [e.id]), h('span.hint', null, [(TYPES[e.type] || {}).label || e.type, e.x != null ? ' @ ' + e.x + ',' + e.y : '', e.scene ? '  ⚡' + e.scene : ''])]);
      }));
      ED.modal('Objects on ' + mid + ' (' + m.ents.length + ')', box);
    }
    function entSheet() {
      var e = st.ent; if (!e) { sheet.classList.add('hidden'); return; }
      sheet.classList.remove('hidden'); sheet.innerHTML = '';
      var tdef = TYPES[e.type] || { label: e.type, f: [] };
      sheet.appendChild(h('div.row', null, [h('h2.grow', null, [tdef.label]), ED.btn('✕', function () { st.ent = null; ED.sel.mapEnt = null; sheet.classList.add('hidden'); render(); }, 'sm')]));
      var fields = (tdef.nopos ? COMMON.filter(function (f) { return f[0] !== 'x' && f[0] !== 'y'; }) : COMMON).concat(tdef.f);
      var known = {}; fields.forEach(function (f) { known[f[0]] = 1; }); known.type = 1;
      var grid = h('div');
      fields.forEach(function (f) {
        var k = f[0], t = f[1], o = { label: LABELS[k] || k, optional: k !== 'id' && k !== 'x' && k !== 'y', onChange: function () { render(); if (k === 'id') ED.sel.mapEnt = e.id; } };
        if (t === 'number') o.type = 'number'; else if (t === 'check') o.type = 'check';
        else if (t === 'scene') { o.type = 'select'; o.options = ED.opts.scenes; }
        else if (t === 'char') { o.type = 'select'; o.options = ED.opts.chars; o.blank = false; }
        else if (t === 'map') { o.type = 'select'; o.options = ED.opts.maps; o.blank = false; }
        else if (t === 'dir') { o.type = 'select'; o.options = ED.opts.dirs; }
        else if (t === 'enemy') { o.type = 'select'; o.options = ED.opts.enemies; o.blank = false; }
        else if (t === 'boss') { o.type = 'select'; o.options = ED.opts.bosses; o.blank = false; }
        else if (t === 'item') { o.type = 'select'; o.options = ED.opts.items; o.blank = false; }
        else if (t === 'sprite') { o.type = 'select'; o.options = ED.opts.sprites; }
        else if (t === 'tile') { o.type = 'select'; o.options = tileOpts; o.blank = false; }
        else if (t.indexOf('sel:') === 0) { o.type = 'select'; o.options = t.slice(4).split(','); }
        if (HINTS[k]) o.hint = HINTS[k];
        var fe = ED.field(e, k, o);
        if (t === 'scene') {
          fe.appendChild(h('div.row', { style: { marginTop: '3px' } }, [e[k] ? ED.btn('Edit scene →', function () { ED.sel.story = e[k]; ED.go('story'); }, 'sm') : null, ED.btn('+ New scene', function () {
            var id = uniqueSceneId(mid + '_' + e.id); ED.D.scenes[id] = { title: (e.who ? (ED.D.characters[e.who] || {}).name + ' talk' : 'New scene'), chapter: 'Any', script: e.who ? e.who + ': Hello there!\nend' : '> Something happens.\nend' }; e[k] = id; ED.commit(); ED.sel.story = id; ED.go('story');
          }, 'sm')]));
        }
        if (k === 'to') fe.appendChild(ED.btn('Go to that map', function () { ED.sel.maps = e.to; ED.sel.mapEnt = null; ED.rerender(); }, 'sm'));
        grid.appendChild(fe);
      });
      sheet.appendChild(grid);
      var extra = {}; Object.keys(e).forEach(function (k) { if (!known[k]) extra[k] = e[k]; });
      var ex = h('textarea', { rows: 3, value: Object.keys(extra).length ? JSON.stringify(extra) : '', placeholder: '{"other": "settings"}', on: { change: function () { try { var o = ex.value.trim() ? JSON.parse(ex.value) : {}; Object.keys(extra).forEach(function (k) { delete e[k]; }); Object.assign(e, o); ED.commit(); } catch (err) { alert('That is not valid JSON'); } } } });
      sheet.appendChild(h('div', null, [h('label', null, ['Other settings (JSON)']), ex]));
      sheet.appendChild(h('div.row', { style: { marginTop: '10px' } }, [
        ED.btn('Duplicate', function () { var c = SB.clone(e); c.id = uniqueId(e.id); if (c.x != null) c.x += 1; m.ents.push(c); ED.commit(); st.ent = c; ED.sel.mapEnt = c.id; entSheet(); render(); }, 'sm'),
        ED.btn('Delete', function () { m.ents.splice(m.ents.indexOf(e), 1); ED.commit(); st.ent = null; sheet.classList.add('hidden'); render(); }, 'sm danger'),
        ED.btn('Done', function () { st.ent = null; ED.sel.mapEnt = null; sheet.classList.add('hidden'); render(); }, 'sm hot')
      ]));
      sheet.appendChild(h('p.hint', null, ['Conditions: flag names separated by commas (all must be true). Put ! in front for "not". Special: plates:GROUP, torches:GROUP, clear (no enemies left), never.']));
    }
    function uniqueSceneId(b) { b = b.replace(/[^a-z0-9_]/g, '_'); var id = b, n = 2; while (ED.D.scenes[id]) id = b + '_' + (n++); return id; }

    /* ---- map settings ---- */
    function mapSettings() {
      sheet.classList.remove('hidden'); sheet.innerHTML = ''; st.ent = null;
      sheet.appendChild(h('div.row', null, [h('h2.grow', null, ['Map settings']), ED.btn('✕', function () { sheet.classList.add('hidden'); }, 'sm')]));
      m.start = m.start || [1, 1];
      var mi = { musicIf: (m.musicIf || []).map(function (p) { return p[0] + ' => ' + p[1]; }).join('\n') };
      sheet.appendChild(h('div', null, [
        ED.field(m, 'name', { label: 'Name (shown in the journal)' }),
        ED.field(m, 'music', { type: 'select', options: ED.opts.songs, label: 'Music' }),
        ED.field(mi, 'musicIf', { type: 'textarea', label: 'Music changes (one per line: condition => song)', rows: 2, onChange: function (v) { m.musicIf = String(v || '').split('\n').map(function (l) { var p = l.split('=>'); return p.length === 2 ? [p[0].trim(), p[1].trim()] : null; }).filter(Boolean); if (!m.musicIf.length) delete m.musicIf; ED.commit(); } }),
        ED.field(m, 'dark', { type: 'check', label: 'Dark (needs light; Mira\'s lantern helps)', optional: true }),
        ED.field(m, 'fog', { type: 'check', label: 'Always foggy', optional: true }),
        ED.field(m, 'fogIf', { label: 'Foggy when (condition)', optional: true, hint: 'Fog also turns villagers grey.' }),
        ED.field(m, 'interior', { type: 'check', label: 'Interior (black outside)', optional: true }),
        h('div.grid2', null, [ED.field(m.start, 0, { type: 'number', label: 'Default start X' }), ED.field(m.start, 1, { type: 'number', label: 'Default start Y' })]),
        h('h3', null, ['Size: ' + W() + ' × ' + H()]),
        h('div.row', null, ['Right edge:', ED.btn('+1', function () { resizeMap(1, 0, 0, 0); }, 'sm'), ED.btn('−1', function () { resizeMap(-1, 0, 0, 0); }, 'sm'), ' Bottom:', ED.btn('+1', function () { resizeMap(0, 1, 0, 0); }, 'sm'), ED.btn('−1', function () { resizeMap(0, -1, 0, 0); }, 'sm')]),
        h('div.row', { style: { marginTop: '4px' } }, ['Left edge:', ED.btn('+1', function () { resizeMap(0, 0, 1, 0); }, 'sm'), ED.btn('−1', function () { resizeMap(0, 0, -1, 0); }, 'sm'), ' Top:', ED.btn('+1', function () { resizeMap(0, 0, 0, 1); }, 'sm'), ED.btn('−1', function () { resizeMap(0, 0, 0, -1); }, 'sm')]),
        h('p.hint', null, ['New rows and columns use the selected paint tile.']),
        h('div.row', { style: { marginTop: '10px' } }, [
          ED.btn('Rename id', function () { ED.prompt('Rename map', 'New id', mid, function (nid) { if (!ED.validId(nid) || ED.D.maps[nid]) { alert('Invalid or taken'); return false; } ED.D.maps[nid] = m; delete ED.D.maps[mid]; Object.values(ED.D.maps).forEach(function (mm) { mm.ents.forEach(function (e) { if (e.to === mid) e.to = nid; }); }); Object.values(ED.D.scenes).forEach(function (s) { s.script = s.script.replace(new RegExp('^(\\s*warp\\s+)' + mid + '(\\s)', 'gm'), '$1' + nid + '$2'); }); if (ED.D.meta.startMap === mid) ED.D.meta.startMap = nid; ED.commit(); ED.sel.maps = nid; ED.rerender(); }); }, 'sm'),
          ED.btn('Duplicate', function () { var n = mid + '_copy', i = 2; while (ED.D.maps[n]) n = mid + '_copy' + (i++); ED.D.maps[n] = SB.clone(m); ED.D.maps[n].name += ' (copy)'; ED.commit(); ED.sel.maps = n; ED.rerender(); }, 'sm'),
          ED.btn('Delete map', function () { ED.confirm('Delete map', 'Delete "' + mid + '"? Exits that lead here will stop working.', function () { delete ED.D.maps[mid]; ED.commit(); ED.sel.maps = null; ED.rerender(); }); }, 'sm danger')
        ])
      ]));
    }
    function resizeMap(dr, db, dl, dt) {
      var ch = st.tile, w = W(), hh = H();
      if (w + dr + dl < 4 || hh + db + dt < 4) return;
      var rs = m.tiles.slice();
      if (dt > 0) for (var i = 0; i < dt; i++) rs.unshift(new Array(w + 1).join(ch)); if (dt < 0) rs = rs.slice(-dt);
      if (db > 0) for (var j = 0; j < db; j++) rs.push(new Array(w + 1).join(ch)); if (db < 0) rs = rs.slice(0, rs.length + db);
      rs = rs.map(function (r) { if (dl > 0) r = new Array(dl + 1).join(ch) + r; if (dl < 0) r = r.slice(-dl); if (dr > 0) r = r + new Array(dr + 1).join(ch); if (dr < 0) r = r.slice(0, r.length + dr); return r; });
      m.tiles = rs; m.w = rs[0].length; m.h = rs.length;
      if (dl || dt) m.ents.forEach(function (e) { if (e.x != null) { e.x += dl; e.y += dt; } });
      ED.commit(); mapSettings(); render();
    }

    drawTools(); drawTileBar();
    var ro = new ResizeObserver(function () { resize(); }); ro.observe(wrap);
    ED.cleanup = function () { ro.disconnect(); };
    if (st.ent) { st.mode = 'obj'; drawTools(); entSheet(); }
    setTimeout(resize, 0);
  }
  var LABELS = { who: 'Character', scene: 'Scene to run', dir: 'Facing', wander: 'Wanders around', ghost: 'Ghostly echo', greyIf: 'Grey (fogged) when', item: 'Item', n: 'Amount', flag: 'Remember with flag', kind: 'Kind', outro: 'Scene after defeat', w: 'Width (tiles)', h: 'Height (tiles)', to: 'Leads to map', tx: 'Arrive at X', ty: 'Arrive at Y', require: 'Only works when', deny: 'Scene if not allowed', once: 'Only once (flag)', when: 'Condition', weight: 'Heroes needed to push', skin: 'Look', lockWhen: 'Stop moving when', group: 'Group name', latch: 'Stay open (flag)', lit: 'Starts lit', tile: 'Change to tile', sprite: 'Sprite', solid: 'Solid', light: 'Light radius', showIf: 'Show only if', hideIf: 'Hide if', id: 'Id', x: 'Tile X', y: 'Tile Y' };
  var HINTS = { weight: 'Tobin counts as 2. Friends close behind the leader help push.', group: 'Plates/torches with the same group work together (use plates:GROUP or torches:GROUP in a gate condition).', when: 'e.g. plates:A  or  torches:A,plates:B  or  my_flag  or  clear', once: 'A flag that is set the first time, so it never runs again.' };
})();
