/* Dawnbound - map edits: applies data/map_edits.js (made with editor.html) on top of the built-in map definitions.
   Supports moving / hiding / patching existing things, adding new things with actions, and "walk-under" art overlays. */
(function () {
  'use strict';
  var DB = window.DB, W = DB.world;
  DB.MAPEDITS = DB.MAPEDITS || {};
  var KEYS = ['npcs', 'objs', 'enemies', 'portals', 'triggers'];
  var OCELL = 4; /* overlay mask resolution, map px per cell */

  /* edits for a map: the committed file, overridden by anything saved in this browser by the editor */
  DB.mapEditsFor = function (id) {
    var e = DB.MAPEDITS[id];
    try { var ls = JSON.parse(localStorage.getItem('dawnbound.mapedits') || 'null'); if (ls && ls[id]) e = ls[id]; } catch (x) { }
    return e || null;
  };

  /* ---------------- scripted actions ---------------- */
  /* acts: [{a:'say',who,text} | {a:'give',gold,item,n} | {a:'heal'} | {a:'toast',text} | {a:'warp',map,spawn} | {a:'scene',name} | {a:'flag',name}] */
  DB.edRun = function (S, acts, ent, o) {
    o = o || {};
    var onceKey = o.once ? 'ed_once_' + (W.mapId || '') + '_' + (o.id || '') : null;
    if (onceKey && DB.G.flags[onceKey]) { return o.doneText ? S.say(null, o.doneText) : Promise.resolve(); }
    if (onceKey) DB.G.flags[onceKey] = 1;
    var p = Promise.resolve();
    (acts || []).forEach(function (a) {
      p = p.then(function () {
        switch (a.a) {
          case 'say': { var who = a.who || null; if (who === '@' && ent) who = (ent.def && ent.def.speaker) || ent.sprite || null; if (who === 'HERO') who = 'HERO'; return S.say(who, a.text || ''); }
          case 'give': if (a.gold) S.gold(a.gold); if (a.item) S.give(a.item, a.n || 1); return null;
          case 'heal': S.healAll(); S.toast('Your party is fully restored.', 'item'); return null;
          case 'toast': S.toast(a.text || ''); return null;
          case 'warp': return S.map(a.map, a.spawn || 'start');
          case 'scene': if (DB.scenes[a.name]) return S.run(a.name); S.toast('(missing scene: ' + a.name + ')'); return null;
          case 'flag': S.flag(a.name, a.val == null ? 1 : a.val); return null;
          case 'shop': DB.menus.shop(a.kind || 'general', a.title || 'Shop'); return null;
        }
        return null;
      });
    });
    return p;
  };
  function regScene(name, acts, o) { DB.scenes[name] = function (S, ent) { return DB.edRun(S, acts, ent, o); }; return name; }

  /* ---------------- apply ---------------- */
  DB.applyMapEdits = function (def, id) {
    if (!def._orig) { def._orig = {}; KEYS.forEach(function (k) { def._orig[k] = (def[k] || []).slice(); }); def._orig.spawns = Object.assign({}, def.spawns || {}); }
    KEYS.forEach(function (k) { def[k] = def._orig[k].slice(); }); def.spawns = Object.assign({}, def._orig.spawns);
    var ed = DB.mapEditsFor(id); if (!ed) return;
    var hide = {}; (ed.hide || []).forEach(function (k) { hide[k] = 1; });
    var mv = ed.move || {}, patch = ed.patch || {};
    /* npcs and objs are addressed by id */
    ['npcs', 'objs'].forEach(function (list) {
      var pre = list === 'npcs' ? 'npc:' : 'obj:';
      def[list] = def[list].map(function (n) {
        var k = pre + n.id; if (hide[k]) return null;
        var m = mv[k], p = patch[k]; if (!m && !p) return n;
        var c = Object.assign({}, n); c._ed = 1;
        if (m) { c.x = m[0]; c.y = m[1]; }
        if (p) applyPatch(c, p, id, n.id, list === 'npcs');
        return c;
      }).filter(Boolean);
    });
    /* index addressed: portals, triggers */
    ['portals', 'triggers'].forEach(function (list) {
      var pre = list === 'portals' ? 'portal:' : 'trigger:';
      def[list] = def[list].map(function (n, i) {
        var k = pre + i; if (hide[k]) return null; var m = mv[k]; if (!m) return n;
        var c = Object.assign({}, n); c.x = m[0]; c.y = m[1]; if (m.length > 3) { c.w = m[2]; c.h = m[3]; } c._ed = 1; return c;
      }).filter(Boolean);
    });
    /* enemies: group g, point p */
    def.enemies = def.enemies.map(function (g, gi) {
      var pts = g.at || [[g.x, g.y]], out = [], changed = false;
      pts.forEach(function (pt, pi) { var k = 'enemy:' + gi + ':' + pi; if (hide[k]) { changed = true; return; } if (mv[k]) { changed = true; out.push([mv[k][0], mv[k][1]]); } else out.push(pt); });
      if (!changed) return g; if (!out.length) return null;
      var c = Object.assign({}, g); c.at = out; c._ed = 1; delete c.x; delete c.y; return c;
    }).filter(Boolean);
    /* spawn points */
    Object.keys(mv).forEach(function (k) { if (k.indexOf('spawn:') === 0) { var nm = k.slice(6), s = def.spawns[nm]; if (s) def.spawns[nm] = [mv[k][0], mv[k][1], s[2]]; } });
    /* additions */
    (ed.add || []).forEach(function (a) { addThing(def, id, a); });
  };
  function applyPatch(c, p, mapId, id, isNpc) {
    ['name', 'dir', 'wander', 'scale', 'shop', 'sprite', 'speaker'].forEach(function (f) { if (p[f] != null && p[f] !== '') c[f] = p[f]; });
    if (p.actions && p.actions.length) {
      var nm = regScene('ed_' + mapId + '_' + id, p.actions, { id: id, once: p.once, doneText: p.doneText });
      if (isNpc) { c.talk = nm; c.shop = null; } else c.scene = nm;
    } else if (p.lines && p.lines.length && isNpc) { c.lines = p.lines.slice(); if (p.replace) { c.talk = null; c.shop = null; } }
  }
  function addThing(def, mapId, a) {
    var d = Object.assign({}, a.def || {}); d._ed = 1; var id = d.id || ('ed' + Math.random().toString(36).slice(2, 6));
    if (a.k === 'npc') {
      d.id = id; d.sprite = d.sprite || 'orphan'; d.name = d.name || id; d.wander = d.wander || 0;
      if (d.actions && d.actions.length) d.talk = regScene('ed_' + mapId + '_' + id, d.actions, { id: id, once: d.once, doneText: d.doneText });
      else if (d.lines && d.lines.length) { /* plain lines */ } else d.lines = ['...'];
      def.npcs.push(d);
    } else if (a.k === 'obj') {
      d.id = id;
      if (d.actions && d.actions.length) d.scene = regScene('ed_' + mapId + '_' + id, d.actions, { id: id, once: d.once && d.t === 'spot', doneText: d.doneText });
      def.objs.push(d);
    } else if (a.k === 'enemy') {
      def.enemies.push({ type: d.type, lv: d.lv || 1, at: d.at || [[d.x, d.y]], _ed: 1 });
    } else if (a.k === 'portal') {
      def.portals.push({ x: d.x, y: d.y, w: d.w || 60, h: d.h || 30, to: d.to, spawn: d.spawn || 'start', label: d.label || '', _ed: 1 });
    } else if (a.k === 'trigger') {
      d.id = id; if (d.actions && d.actions.length) d.scene = regScene('ed_' + mapId + '_' + id, d.actions, { id: id });
      if (d.repeat) d.once = false; def.triggers.push(d);
    } else if (a.k === 'spawn') {
      def.spawns[d.name || id] = [d.x, d.y, d.dir || 'down'];
    }
  }

  /* ---------------- walk-under overlays ---------------- */
  /* An overlay is a piece of the map's own art (painted in the editor) that is drawn ON TOP of characters:
     mode 'above'  = always on top (arch tops, tree canopies, awnings)
     mode 'sorted' = on top only of characters standing behind the depth line sortY (trunks, statues, lamp posts)
     dx,dy shifts the piece, which makes it a copy-stamp of that art somewhere else. */
  DB.buildOverlays = function (def, id) {
    W.overs = []; var ed = DB.mapEditsFor(id); if (!ed || !ed.over || !W.img) return;
    var img = W.img, sx = (img.naturalWidth || img.width) / (def.w || 1536), sy = (img.naturalHeight || img.height) / (def.h || 1024);
    ed.over.forEach(function (o) {
      try {
        var bw = o.bw, bh = o.bh, mb = atob(o.m), mc = document.createElement('canvas'); mc.width = bw; mc.height = bh;
        var mx = mc.getContext('2d'), idt = mx.createImageData(bw, bh);
        for (var i = 0; i < bw * bh; i++) { if ((mb.charCodeAt(i >> 3) >> (i & 7)) & 1) { idt.data[i * 4 + 3] = 255; idt.data[i * 4] = 255; } }
        mx.putImageData(idt, 0, 0);
        var cv = document.createElement('canvas'); cv.width = bw * OCELL; cv.height = bh * OCELL; var c = cv.getContext('2d');
        c.drawImage(img, o.bx * OCELL * sx, o.by * OCELL * sy, bw * OCELL * sx, bh * OCELL * sy, 0, 0, bw * OCELL, bh * OCELL);
        c.globalCompositeOperation = 'destination-in'; c.imageSmoothingEnabled = true; c.drawImage(mc, 0, 0, bw * OCELL, bh * OCELL);
        var above = o.mode !== 'sorted';
        W.overs.push({ type: 'over', cv: cv, px: o.bx * OCELL + (o.dx || 0), py: o.by * OCELL + (o.dy || 0), z: above ? 50 : 0, y: above ? 1e6 : (o.sortY || 0), id: o.id });
      } catch (e) { console.warn('overlay failed', e); }
    });
  };
})();
