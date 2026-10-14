/* Sunderbell editor - Art: pixel sprite editor with frames, tiles, palette. */
(function () {
  'use strict';
  var SB = window.SB, ED = window.ED, h = ED.h;
  var FREE_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$%&*+=-~!?^:;<>{}[]()|/\\\'",`_';

  function groupOf(id) {
    var D = ED.D;
    if (/^t_/.test(id)) return 'Tiles';
    var m = /^(.*?)_(down|up|side|atk_down|atk_up|atk_side)$/.exec(id); if (m) return 'Character: ' + m[1];
    if (Object.values(D.bosses).some(function (b) { return [b.sprite, b.bareSprite, b.flipSprite, b.eyesSprite, b.openSprite].indexOf(id) >= 0; })) return 'Bosses';
    if (Object.values(D.enemies).some(function (e) { return e.sprite === id || e.flipSprite === id; })) return 'Enemies';
    if (/^(icon_|ui_|tone_|orb_)/.test(id)) return 'Icons, tones & effects';
    return 'Objects';
  }

  /* ============================== SPRITES ============================== */
  ED.register('sprites', 'Sprites', function (main) {
    var D = ED.D, sel = ED.sel.sprites;
    if (sel && !D.sprites[sel]) sel = ED.sel.sprites = null;
    var items = Object.keys(D.sprites).map(function (id) { return { id: id, label: id, sub: D.sprites[id].w + '×' + D.sprites[id].h + '  ' + D.sprites[id].frames.length + ' frame' + (D.sprites[id].frames.length > 1 ? 's' : ''), group: groupOf(id), icon: function () { return ED.thumb(id, 28); } }; });
    items.sort(function (a, b) { return a.group.localeCompare(b.group) || a.id.localeCompare(b.id); });
    var detail = ED.listDetail(main, {
      items: items, selected: sel, onSelect: function (id) { ED.sel.sprites = id; ED.sel.frame = 0; ED.rerender(); },
      add: newSprite, extra: [ED.btn('+ Character set', newCharSet, 'sm', 'Copy a whole character (all directions) to a new id')]
    });
    if (!sel) { detail.appendChild(h('div.big-empty', null, ['Pick a sprite to draw on.', h('p.hint', null, ['Characters use a set of sprites: NAME_down, NAME_up, NAME_side (3 frames each: standing, step, step) and NAME_atk_down/up/side. Use "+ Character set" to start a new character from an existing one.'])])); return; }
    pixelEditor(detail, sel);
  });
  function newSprite() {
    var o = { id: 'new_sprite', w: 16, h: 16 };
    ED.modal('New sprite', h('div', null, [ED.field(o, 'id', { label: 'Id' }), h('div.grid2', null, [ED.field(o, 'w', { type: 'number', label: 'Width' }), ED.field(o, 'h', { type: 'number', label: 'Height' })])]), [['Cancel', null], ['Create', function () {
      if (!/^[a-z0-9_]+$/.test(o.id) || ED.D.sprites[o.id]) { alert('Invalid or existing id'); return false; }
      var w = Math.max(1, Math.min(96, o.w | 0)), hh = Math.max(1, Math.min(96, o.h | 0)), row = new Array(w + 1).join('.');
      ED.D.sprites[o.id] = { w: w, h: hh, frames: [Array.from({ length: hh }, function () { return row; })] }; ED.commit(); ED.sel.sprites = o.id; ED.rerender();
    }, 'hot']]);
  }
  function newCharSet() {
    var o = { from: 'pell', to: 'new_hero', char: true };
    ED.modal('New character set', h('div', null, [ED.field(o, 'from', { type: 'select', blank: false, options: ED.opts.charBases, label: 'Copy from' }), ED.field(o, 'to', { label: 'New id (lowercase)' }), ED.field(o, 'char', { type: 'check', label: 'Also add a speaking character with this id' })]), [['Cancel', null], ['Create', function () {
      if (!ED.validId(o.to)) { alert('Invalid id'); return false; }
      var n = 0; Object.keys(ED.D.sprites).forEach(function (k) { if (k.indexOf(o.from + '_') === 0 && /_(down|up|side|atk_down|atk_up|atk_side)$/.test(k)) { ED.D.sprites[o.to + k.slice(o.from.length)] = SB.clone(ED.D.sprites[k]); n++; } });
      if (o.char && !ED.D.characters[o.to]) ED.D.characters[o.to] = { name: o.to.charAt(0).toUpperCase() + o.to.slice(1), sprite: o.to, voice: (ED.D.characters[o.from] || {}).voice || 'pell', color: '#ffffff' };
      ED.commit(); ED.sel.sprites = o.to + '_down'; ED.rerender(); ED.status('Copied ' + n + ' sprites.');
    }, 'hot']]);
  }

  function pixelEditor(root, id) {
    var D = ED.D, s = D.sprites[id], f = Math.min(ED.sel.frame || 0, s.frames.length - 1);
    var st = { color: ED.sel.pxColor || '0', tool: ED.sel.pxTool || 'pen' };
    root.appendChild(h('div.row', null, [root.back(), h('h2.grow', null, [id]), h('span.hint', null, [s.w + '×' + s.h])]));
    /* frames */
    var frames = h('div.frames');
    function drawFrames() {
      frames.innerHTML = '';
      s.frames.forEach(function (_, i) { frames.appendChild(h('div.fr' + (i === f ? '.on' : ''), { on: { click: function () { f = i; ED.sel.frame = i; drawFrames(); render(); } } }, [ED.thumb(id, 40, i)])); });
      frames.appendChild(ED.btn('+ Copy', function () { s.frames.splice(f + 1, 0, s.frames[f].slice()); f++; ED.sel.frame = f; changed(); drawFrames(); }, 'sm'));
      frames.appendChild(ED.btn('+ Blank', function () { s.frames.splice(f + 1, 0, s.frames[f].map(function (r) { return r.replace(/./g, '.'); })); f++; ED.sel.frame = f; changed(); drawFrames(); }, 'sm'));
      if (s.frames.length > 1) { frames.appendChild(ED.btn('◀', function () { if (f > 0) { var t = s.frames[f]; s.frames[f] = s.frames[f - 1]; s.frames[f - 1] = t; f--; changed(); drawFrames(); } }, 'sm')); frames.appendChild(ED.btn('▶', function () { if (f < s.frames.length - 1) { var t = s.frames[f]; s.frames[f] = s.frames[f + 1]; s.frames[f + 1] = t; f++; changed(); drawFrames(); } }, 'sm')); frames.appendChild(ED.btn('Delete frame', function () { s.frames.splice(f, 1); f = Math.max(0, f - 1); changed(); drawFrames(); render(); }, 'sm danger')); }
    }
    /* canvas */
    var avail = Math.min(window.innerWidth - (window.innerWidth > 760 ? 300 : 30), window.innerHeight - 260, 440), cell = Math.max(4, Math.floor(avail / Math.max(s.w, s.h)));
    var cv = h('canvas.pxcanvas.px'); cv.width = s.w * cell; cv.height = s.h * cell; var cx = cv.getContext('2d');
    var anim = h('canvas.px', { style: { background: '#2a2344', borderRadius: '8px' } }); anim.width = s.w * 3; anim.height = s.h * 3;
    function render() {
      cx.clearRect(0, 0, cv.width, cv.height); var rows = s.frames[f], pal = D.palette;
      for (var y = 0; y < s.h; y++) for (var x = 0; x < s.w; x++) { var c = rows[y][x]; if (c && c !== '.' && pal[c]) { cx.fillStyle = pal[c]; cx.fillRect(x * cell, y * cell, cell, cell); } }
      if (cell >= 8) { cx.strokeStyle = 'rgba(255,255,255,.08)'; cx.beginPath(); for (var i = 0; i <= s.w; i++) { cx.moveTo(i * cell + .5, 0); cx.lineTo(i * cell + .5, cv.height); } for (var j = 0; j <= s.h; j++) { cx.moveTo(0, j * cell + .5); cx.lineTo(cv.width, j * cell + .5); } cx.stroke(); }
    }
    var at = 0, animIv = setInterval(function () { at++; var a = anim.getContext('2d'); a.imageSmoothingEnabled = false; a.clearRect(0, 0, anim.width, anim.height); var im = ED.gfx.frame(id, at % s.frames.length); if (im) a.drawImage(im, 0, 0, anim.width, anim.height); }, 220);
    ED.cleanup = function () { clearInterval(animIv); };
    function setPx(x, y, c) { if (x < 0 || y < 0 || x >= s.w || y >= s.h) return false; var r = s.frames[f][y]; if (r[x] === c) return false; s.frames[f][y] = r.slice(0, x) + c + r.slice(x + 1); return true; }
    function changed() { ED.gfx.invalidate(id); ED.commit(); }
    function flood(x, y, c) { var rows = s.frames[f].map(function (r) { return r.split(''); }), from = rows[y][x]; if (from === c) return; var q = [[x, y]]; while (q.length) { var p = q.pop(); if (p[0] < 0 || p[1] < 0 || p[0] >= s.w || p[1] >= s.h || rows[p[1]][p[0]] !== from) continue; rows[p[1]][p[0]] = c; q.push([p[0] + 1, p[1]], [p[0] - 1, p[1]], [p[0], p[1] + 1], [p[0], p[1] - 1]); } s.frames[f] = rows.map(function (r) { return r.join(''); }); }
    var down = false, dirty = false;
    function pos(e) { var r = cv.getBoundingClientRect(); return [Math.floor((e.clientX - r.left) / r.width * s.w), Math.floor((e.clientY - r.top) / r.height * s.h)]; }
    cv.addEventListener('pointerdown', function (e) {
      cv.setPointerCapture(e.pointerId); var p = pos(e);
      if (st.tool === 'pick') { st.color = s.frames[f][p[1]][p[0]]; ED.sel.pxColor = st.color; drawPal(); return; }
      if (st.tool === 'fill') { flood(p[0], p[1], st.color); render(); changed(); return; }
      down = true; dirty = setPx(p[0], p[1], st.tool === 'erase' ? '.' : st.color) || dirty; render();
    });
    cv.addEventListener('pointermove', function (e) { if (!down) return; var p = pos(e); dirty = setPx(p[0], p[1], st.tool === 'erase' ? '.' : st.color) || dirty; render(); });
    function up() { if (down && dirty) changed(); down = false; dirty = false; }
    cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
    /* tools + palette */
    var toolRow = h('div.row');
    function drawTools() { toolRow.innerHTML = ''; [['pen', '✏ Pen'], ['erase', '⌫ Erase'], ['fill', '◉ Fill'], ['pick', '⌖ Pick']].forEach(function (t) { toolRow.appendChild(ED.btn(t[1], function () { st.tool = t[0]; ED.sel.pxTool = t[0]; drawTools(); }, 'sm' + (st.tool === t[0] ? ' on' : ''))); }); }
    var pal = h('div.pal');
    function drawPal() {
      pal.innerHTML = '';
      pal.appendChild(h('div.sw.clear' + (st.color === '.' ? '.on' : ''), { title: 'transparent', on: { click: function () { st.color = '.'; ED.sel.pxColor = '.'; drawPal(); } } }));
      Object.keys(D.palette).forEach(function (k) { pal.appendChild(h('div.sw' + (k === st.color ? '.on' : ''), { title: k + ' ' + D.palette[k], style: { background: D.palette[k] }, on: { click: function () { st.color = k; ED.sel.pxColor = k; if (st.tool === 'erase' || st.tool === 'pick') { st.tool = 'pen'; drawTools(); } drawPal(); } } })); });
      pal.appendChild(ED.btn('Edit colours', function () { ED.go('palette'); }, 'sm'));
    }
    function transform(fn) { s.frames[f] = fn(s.frames[f]); render(); changed(); drawFrames(); }
    var ops = h('div.row', { style: { marginTop: '6px' } }, [
      ED.btn('⇆ Mirror', function () { transform(function (r) { return r.map(function (x) { return x.split('').reverse().join(''); }); }); }, 'sm'),
      ED.btn('⇅ Flip', function () { transform(function (r) { return r.slice().reverse(); }); }, 'sm'),
      ED.btn('←', function () { transform(function (r) { return r.map(function (x) { return x.slice(1) + x[0]; }); }); }, 'sm'),
      ED.btn('→', function () { transform(function (r) { return r.map(function (x) { return x[x.length - 1] + x.slice(0, -1); }); }); }, 'sm'),
      ED.btn('↑', function () { transform(function (r) { return r.slice(1).concat([r[0]]); }); }, 'sm'),
      ED.btn('↓', function () { transform(function (r) { return [r[r.length - 1]].concat(r.slice(0, -1)); }); }, 'sm'),
      ED.btn('Clear', function () { transform(function (r) { return r.map(function (x) { return x.replace(/./g, '.'); }); }); }, 'sm danger')
    ]);
    var meta = h('div.row', { style: { marginTop: '10px' } }, [
      ED.btn('Resize', function () { resize(s, id); }, 'sm'),
      ED.btn('Duplicate', function () { var n = id + '_copy', i = 2; while (D.sprites[n]) n = id + '_copy' + (i++); D.sprites[n] = SB.clone(s); ED.commit(); ED.sel.sprites = n; ED.rerender(); }, 'sm'),
      ED.btn('Rename', function () { ED.prompt('Rename sprite', 'New id', id, function (nid) { if (!/^[a-z0-9_]+$/.test(nid) || D.sprites[nid]) { alert('Invalid or taken'); return false; } renameSprite(id, nid); ED.sel.sprites = nid; ED.rerender(); }); }, 'sm'),
      ED.btn('Delete', function () { ED.confirm('Delete sprite', 'Delete "' + id + '"?', function () { delete D.sprites[id]; ED.commit(); ED.sel.sprites = null; ED.rerender(); }); }, 'sm danger')
    ]);
    root.appendChild(frames); drawFrames();
    root.appendChild(h('div.pxwrap', null, [cv, h('div', null, [h('div.hint', null, ['Animation']), anim, h('div', { style: { height: '8px' } }), toolRow, h('div', { style: { height: '6px' } }), pal])]));
    root.appendChild(ops); root.appendChild(meta);
    root.appendChild(h('p.hint', null, ['Tip: everything that uses this sprite in the game updates when you draw. Colours come from the shared palette.']));
    drawTools(); drawPal(); render();
  }
  function resize(s, id) {
    var o = { w: s.w, h: s.h, anchor: 'bottom' };
    ED.modal('Resize ' + id, h('div', null, [h('div.grid2', null, [ED.field(o, 'w', { type: 'number', label: 'Width' }), ED.field(o, 'h', { type: 'number', label: 'Height' })]), ED.field(o, 'anchor', { type: 'select', blank: false, label: 'Keep the picture at', options: [['bottom', 'bottom centre (characters)'], ['center', 'centre'], ['topleft', 'top left']] })]), [['Cancel', null], ['Resize', function () {
      var w = Math.max(1, Math.min(96, o.w | 0)), hh = Math.max(1, Math.min(96, o.h | 0));
      var dx = o.anchor === 'topleft' ? 0 : Math.floor((w - s.w) / 2), dy = o.anchor === 'topleft' ? 0 : o.anchor === 'center' ? Math.floor((hh - s.h) / 2) : hh - s.h;
      s.frames = s.frames.map(function (fr) { var out = []; for (var y = 0; y < hh; y++) { var r = ''; for (var x = 0; x < w; x++) { var sy = y - dy, sx = x - dx; r += (sy >= 0 && sy < s.h && sx >= 0 && sx < s.w) ? fr[sy][sx] : '.'; } out.push(r); } return out; });
      s.w = w; s.h = hh; ED.gfx.invalidate(id); ED.commit(); ED.rerender();
    }, 'hot']]);
  }
  function renameSprite(a, b) {
    var D = ED.D; D.sprites[b] = D.sprites[a]; delete D.sprites[a];
    Object.values(D.tiles).forEach(function (t) { if (t.sprite === a) t.sprite = b; });
    Object.values(D.enemies).forEach(function (e) { ['sprite', 'flipSprite', 'shot'].forEach(function (k) { if (e[k] === a) e[k] = b; }); });
    Object.values(D.bosses).forEach(function (e) { ['sprite', 'bareSprite', 'flipSprite', 'eyesSprite', 'openSprite'].forEach(function (k) { if (e[k] === a) e[k] = b; }); });
    Object.values(D.items).forEach(function (e) { if (e.sprite === a) e.sprite = b; });
    D.heroes.forEach(function (e) { if (e.icon === a) e.icon = b; });
    Object.values(D.maps).forEach(function (m) { m.ents.forEach(function (e) { if (e.sprite === a) e.sprite = b; if (e.skin === a) e.skin = b; }); });
    ED.gfx.invalidate(); ED.commit();
  }

  /* ============================== TILES ============================== */
  ED.register('tiles', 'Tiles', function (main) {
    var D = ED.D, sel = ED.sel.tiles;
    if (sel != null && !D.tiles[sel]) sel = ED.sel.tiles = null;
    var detail = ED.listDetail(main, {
      items: Object.keys(D.tiles).map(function (k) { var t = D.tiles[k]; return { id: k, label: t.name, sub: 'key ' + JSON.stringify(k) + (t.solid ? '  solid' : '') + (t.kind ? '  ' + t.kind : ''), icon: function () { return ED.thumb(t.sprite, 28); } }; }),
      selected: sel, onSelect: function (id) { ED.sel.tiles = id; ED.rerender(); },
      add: function () {
        var used = Object.keys(D.tiles).join(''), ch = FREE_CHARS.split('').filter(function (c) { return used.indexOf(c) < 0; })[0];
        if (!ch) { alert('No free tile keys left'); return; }
        D.tiles[ch] = { name: 'New tile', sprite: 't_grass' }; ED.commit(); ED.sel.tiles = ch; ED.rerender();
      }
    });
    if (sel == null) { detail.appendChild(h('div.big-empty', null, ['Tiles are the squares maps are painted with. Each tile shows a sprite and can be solid, water, a pit, or something a hero can cut, smash, burn or reveal.'])); return; }
    var t = D.tiles[sel];
    detail.appendChild(h('div.row', null, [detail.back(), ED.thumb(t.sprite, 48), h('h2.grow', null, [t.name]), h('code', null, ['key ' + JSON.stringify(sel)])]));
    detail.appendChild(ED.field(t, 'name', { label: 'Name', onChange: function () { ED.rerender(); } }));
    detail.appendChild(h('div.row', null, [h('div.grow', null, [ED.field(t, 'sprite', { type: 'select', blank: false, options: ED.opts.sprites, label: 'Sprite', onChange: function () { ED.rerender(); } })]), ED.btn('Draw it →', function () { ED.sel.sprites = t.sprite; ED.go('sprites'); }, 'sm')]));
    detail.appendChild(ED.field(t, 'solid', { type: 'check', label: 'Solid (can\'t walk through)', optional: true }));
    detail.appendChild(ED.field(t, 'kind', { type: 'select', label: 'Special', optional: true, options: [['water', 'Water (arrows and flyers cross)'], ['lava', 'Lava'], ['pit', 'Pit (fall in, lose half a heart)'], ['cut', 'Cuttable (sword, shield, lantern)'], ['smash', 'Smashable (Tobin\'s shield)'], ['burn', 'Burnable (Mira\'s lantern)'], ['veil', 'Hidden wall (revealed by the lantern)']] }));
    detail.appendChild(ED.field(t, 'to', { type: 'select', label: 'Turns into (after cut / smash / burn / reveal)', optional: true, options: function () { return Object.keys(D.tiles).map(function (k) { return [k, JSON.stringify(k) + ' ' + D.tiles[k].name]; }); } }));
    var uses = 0; Object.values(D.maps).forEach(function (m) { m.tiles.forEach(function (r) { for (var i = 0; i < r.length; i++) if (r[i] === sel) uses++; }); });
    detail.appendChild(h('p.hint', null, ['Used ' + uses + ' times across all maps.']));
    detail.appendChild(ED.btn('Delete tile', function () { if (uses) { alert('This tile is still painted on maps. Paint over it first.'); return; } delete D.tiles[sel]; ED.commit(); ED.sel.tiles = null; ED.rerender(); }, 'sm danger'));
  });

  /* ============================== PALETTE ============================== */
  ED.register('palette', 'Colours', function (main) {
    var D = ED.D, wrap = h('div.detail', { style: { height: '100%' } });
    main.appendChild(wrap);
    wrap.appendChild(h('h2', null, ['Colour palette']));
    wrap.appendChild(h('p.hint', null, ['Every sprite is drawn with these colours. Change one and everything using it changes. Each colour has a one-letter key used inside sprite data.']));
    var counts = {}; Object.values(D.sprites).forEach(function (s) { s.frames.forEach(function (fr) { fr.forEach(function (r) { for (var i = 0; i < r.length; i++) counts[r[i]] = (counts[r[i]] || 0) + 1; }); }); });
    var grid = h('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(150px,1fr))', gap: '6px' } });
    Object.keys(D.palette).forEach(function (k) {
      var inp = h('input', { type: 'color', value: D.palette[k], on: { input: function () { D.palette[k] = inp.value; ED.gfx.invalidate(); }, change: function () { ED.commit(); } } });
      grid.appendChild(h('div.card.row', { style: { margin: 0 } }, [inp, h('div', null, [h('code', null, [k]), h('div.hint', null, [(counts[k] || 0) + ' pixels'])]), !counts[k] ? ED.btn('✕', function () { delete D.palette[k]; ED.commit(); ED.rerender(); }, 'sm') : null]));
    });
    wrap.appendChild(grid);
    wrap.appendChild(ED.btn('+ Add colour', function () {
      var used = Object.keys(D.palette).join('') + '.', ch = FREE_CHARS.split('').filter(function (c) { return used.indexOf(c) < 0; })[0];
      if (!ch) { alert('Palette is full'); return; } D.palette[ch] = '#88cc88'; ED.commit(); ED.rerender();
    }, 'hot'));
  });
})();
