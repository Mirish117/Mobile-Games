/* Sunderbell editor - base: data, autosave, undo/redo, tabs, form helpers, list/detail layout, playtest. */
(function () {
  'use strict';
  var SB = window.SB;
  var ED = window.ED = { tabs: [], tab: null, sel: {} };

  /* ---------------- data ---------------- */
  var draft = SB.draft.get();
  ED.D = SB.normalize(draft || SB.clone(window.SB_DATA));
  ED.fromDraft = !!draft;
  ED.gfx = new SB.Gfx(ED.D);
  SB.audio.use(ED.D);

  /* ---------------- DOM helper ---------------- */
  ED.h = function (tag, attrs, kids) {
    var m = /^(\w+)?((?:[.#][\w-]+)*)$/.exec(tag), el = document.createElement(m[1] || 'div');
    (m[2].match(/[.#][\w-]+/g) || []).forEach(function (p) { if (p[0] === '.') el.classList.add(p.slice(1)); else el.id = p.slice(1); });
    if (attrs) Object.keys(attrs).forEach(function (k) {
      var v = attrs[k]; if (v == null || v === false) return;
      if (k === 'on') Object.keys(v).forEach(function (ev) { el.addEventListener(ev, v[ev]); });
      else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
      else if (k === 'html') el.innerHTML = v;
      else if (k === 'text') el.textContent = v;
      else if (k in el && k !== 'list' && k !== 'type') { try { el[k] = v; } catch (e) { el.setAttribute(k, v); } }
      else el.setAttribute(k, v === true ? '' : v);
    });
    (kids || []).forEach(function (c) { if (c == null || c === false) return; el.appendChild(typeof c === 'string' || typeof c === 'number' ? document.createTextNode(String(c)) : c); });
    return el;
  };
  var h = ED.h;
  ED.btn = function (label, fn, cls, title) { return h('button' + (cls ? '.' + cls.split(' ').join('.') : ''), { on: { click: fn }, title: title || '' }, [label]); };
  ED.thumb = function (id, box, f, variant) {
    var c = document.createElement('canvas'); c.className = 'px';
    var im = ED.gfx.frame(id, f || 0, variant); if (!im) { c.width = c.height = box || 16; return c; }
    var s = Math.max(1, Math.floor(Math.min((box || 32) / im.width, (box || 32) / im.height)));
    c.width = im.width * s; c.height = im.height * s; var x = c.getContext('2d'); x.imageSmoothingEnabled = false; x.drawImage(im, 0, 0, c.width, c.height); return c;
  };
  ED.charThumb = function (who, box) { var ch = ED.D.characters[who] || {}, base = ch.sprite || who; return ED.thumb(ED.gfx.has(base + '_down') ? base + '_down' : base, box || 32, 0, ch.ghost ? 'ghost' : ''); };

  /* ---------------- status / autosave / undo ---------------- */
  ED.status = function (msg) { document.getElementById('status').textContent = msg; };
  var hist = [JSON.stringify(ED.D)], pos = 0, saveT = null;
  ED.commit = function (why) {
    var j = JSON.stringify(ED.D); if (j === hist[pos]) return;
    hist = hist.slice(0, pos + 1); hist.push(j); if (hist.length > 60) hist.shift(); pos = hist.length - 1;
    ED.dirty = true; ED.status('Unsaved changes...');
    clearTimeout(saveT); saveT = setTimeout(ED.saveDraft, 450); ED.updUndo();
  };
  ED.saveDraft = function () { var ok = SB.draft.set(ED.D); ED.status(ok ? 'Saved on this device ' + new Date().toLocaleTimeString() + '  (Save ▾ to export)' : 'Could not save (storage full?)'); ED.dirty = false; };
  ED.replaceData = function (d) {
    Object.keys(ED.D).forEach(function (k) { delete ED.D[k]; }); Object.assign(ED.D, SB.normalize(d));
    ED.gfx.invalidate(); ED.rerender();
  };
  ED.undo = function () { if (pos <= 0) return; pos--; ED.replaceData(JSON.parse(hist[pos])); ED.saveDraft(); ED.updUndo(); };
  ED.redo = function () { if (pos >= hist.length - 1) return; pos++; ED.replaceData(JSON.parse(hist[pos])); ED.saveDraft(); ED.updUndo(); };
  ED.updUndo = function () { document.getElementById('bUndo').disabled = pos <= 0; document.getElementById('bRedo').disabled = pos >= hist.length - 1; };
  ED.resetHistory = function () { hist = [JSON.stringify(ED.D)]; pos = 0; ED.updUndo(); };

  /* ---------------- form fields ---------------- */
  /* ED.field(obj, key, opts) opts: label, type (text|number|textarea|check|select|color|range), options [[v,label]] or [v], min,max,step, placeholder, onChange, optional (delete when empty), rows */
  ED.field = function (obj, key, o) {
    o = o || {}; var type = o.type || (typeof obj[key] === 'number' ? 'number' : typeof obj[key] === 'boolean' ? 'check' : 'text'), el;
    var set = function (v) {
      if (type === 'number' || type === 'range') { v = v === '' ? null : +v; }
      if ((v === '' || v == null || (type === 'check' && !v && o.optional)) && o.optional) delete obj[key]; else obj[key] = v;
      ED.commit(key); if (o.onChange) o.onChange(v);
    };
    if (type === 'textarea') el = h('textarea', { rows: o.rows || 3, placeholder: o.placeholder || '', value: obj[key] == null ? '' : obj[key], on: { change: function () { set(el.value); } } });
    else if (type === 'check') { el = h('input', { type: 'checkbox', checked: !!obj[key], on: { change: function () { set(el.checked); } } }); }
    else if (type === 'select') {
      el = h('select', { on: { change: function () { set(el.value); } } });
      var opts = (typeof o.options === 'function' ? o.options() : o.options) || [];
      if (o.blank !== false) el.appendChild(h('option', { value: '' }, [o.blankLabel || '(none)']));
      var found = false;
      opts.forEach(function (op) { var v = Array.isArray(op) ? op[0] : op, l = Array.isArray(op) ? op[1] : op; if (String(v) === String(obj[key])) found = true; el.appendChild(h('option', { value: v }, [l])); });
      if (obj[key] != null && obj[key] !== '' && !found) el.appendChild(h('option', { value: obj[key] }, [obj[key] + ' (?)']));
      el.value = obj[key] == null ? '' : obj[key];
    }
    else if (type === 'range') { var out = h('span', { text: obj[key] }); el = h('div.row', null, [h('input', { type: 'range', min: o.min, max: o.max, step: o.step || .01, value: obj[key], style: { flex: 1 }, on: { input: function (e) { out.textContent = e.target.value; obj[key] = +e.target.value; if (o.live) o.live(+e.target.value); }, change: function (e) { set(e.target.value); } } }), out]); }
    else el = h('input', { type: type === 'color' ? 'color' : type === 'number' ? 'number' : type === 'password' ? 'password' : 'text', value: obj[key] == null ? '' : obj[key], placeholder: o.placeholder || '', min: o.min, max: o.max, step: o.step || (type === 'number' ? 'any' : null), on: { change: function () { set(el.value); } } });
    if (o.bare) return el;
    var lab = h('label', null, [o.label || key]);
    if (type === 'check') return h('label.row', { style: { color: 'var(--text)', fontSize: '13px' } }, [el, ' ' + (o.label || key)]);
    return h('div', null, [lab, el, o.hint ? h('div.hint', null, [o.hint]) : null]);
  };
  ED.opts = {
    scenes: function () { return Object.keys(ED.D.scenes).sort().map(function (k) { return [k, k + ' - ' + ED.D.scenes[k].title]; }); },
    maps: function () { return Object.keys(ED.D.maps).map(function (k) { return [k, k + ' - ' + ED.D.maps[k].name]; }); },
    chars: function () { return Object.keys(ED.D.characters).map(function (k) { return [k, ED.D.characters[k].name + ' (' + k + ')']; }); },
    songs: function () { return Object.keys(ED.D.songs).map(function (k) { return [k, k + ' - ' + ED.D.songs[k].name]; }); },
    sprites: function () { return Object.keys(ED.D.sprites).sort(); },
    voices: function () { return Object.keys(ED.D.voices); },
    enemies: function () { return Object.keys(ED.D.enemies); },
    bosses: function () { return Object.keys(ED.D.bosses); },
    items: function () { return Object.keys(ED.D.items); },
    dirs: ['down', 'up', 'left', 'right'],
    charBases: function () { var s = {}; Object.keys(ED.D.sprites).forEach(function (k) { var m = /^(.*)_down$/.exec(k); if (m) s[m[1]] = 1; }); return Object.keys(s).sort(); }
  };

  /* ---------------- modal ---------------- */
  ED.modal = function (title, body, buttons) {
    var m = document.getElementById('modal'), box = m.querySelector('.mbox'); box.innerHTML = '';
    box.appendChild(h('h2', null, [title])); if (body) box.appendChild(body);
    var row = h('div.row', { style: { marginTop: '12px', justifyContent: 'flex-end' } });
    (buttons || [['Close', null]]).forEach(function (b) { row.appendChild(ED.btn(b[0], function () { var keep = b[1] && b[1]() === false; if (!keep) ED.closeModal(); }, b[2])); });
    box.appendChild(row); m.classList.remove('hidden');
  };
  ED.closeModal = function () { document.getElementById('modal').classList.add('hidden'); };
  ED.prompt = function (title, label, val, cb) { var inp = h('input', { value: val || '' }); ED.modal(title, h('div', null, [h('label', null, [label]), inp]), [['Cancel', null], ['OK', function () { return cb(inp.value.trim()); }, 'hot']]); setTimeout(function () { inp.focus(); inp.select(); }, 50); };
  ED.confirm = function (title, text, cb) { ED.modal(title, h('p', null, [text]), [['Cancel', null], ['Yes', function () { cb(); }, 'danger']]); };
  ED.validId = function (s) { return /^[a-z][a-z0-9_]*$/.test(s); };

  /* ---------------- list / detail layout ---------------- */
  /* opts: items [{id,label,sub,group,icon}], selected, onSelect(id), add: fn, addLabel, search: true, extra: [buttons] */
  ED.listDetail = function (root, o) {
    var split = h('div.split' + (o.selected ? '.open' : '')), list = h('div.list'), detail = h('div.detail');
    var q = h('input', { placeholder: 'Search...', value: ED.sel['q_' + ED.tab] || '' });
    var head = h('div.lhead', null, [q].concat(o.add ? [ED.btn('+ ' + (o.addLabel || 'New'), o.add, 'hot')] : []).concat(o.extra || []));
    var items = h('div.items');
    function draw() {
      items.innerHTML = ''; var term = q.value.toLowerCase(), lastG = null;
      o.items.forEach(function (it) {
        if (term && (it.id + ' ' + it.label + ' ' + (it.sub || '') + ' ' + (it.group || '')).toLowerCase().indexOf(term) < 0) return;
        if (it.group && it.group !== lastG) { lastG = it.group; items.appendChild(h('div.grp', null, [it.group])); }
        var row = h('div.it' + (it.id === o.selected ? '.on' : ''), { on: { click: function () { o.onSelect(it.id); } } }, [it.icon ? it.icon() : null, h('div.t', null, [it.label, it.sub ? h('div', null, [h('small', null, [it.sub])]) : null])]);
        items.appendChild(row);
      });
    }
    q.addEventListener('input', function () { ED.sel['q_' + ED.tab] = q.value; draw(); });
    draw(); list.appendChild(head); list.appendChild(items);
    split.appendChild(list); split.appendChild(detail); root.appendChild(split);
    if (o.selected) { var on = items.querySelector('.on'); if (on) setTimeout(function () { on.scrollIntoView({ block: 'nearest' }); }, 0); }
    detail.back = function () { return ED.btn('◀ List', function () { o.onSelect(null); }, 'backbtn sm'); };
    return detail;
  };

  /* ---------------- tabs ---------------- */
  ED.register = function (id, label, render) { ED.tabs.push({ id: id, label: label, render: render }); };
  ED.show = function (id) {
    ED.tab = id; try { localStorage.setItem('sunderbell.edtab', id); } catch (e) { }
    document.querySelectorAll('#tabs button').forEach(function (b) { b.classList.toggle('on', b.dataset.id === id); });
    ED.rerender();
  };
  ED.rerender = function () {
    var main = document.getElementById('main'); if (ED.cleanup) { ED.cleanup(); ED.cleanup = null; } main.innerHTML = '';
    var t = ED.tabs.filter(function (x) { return x.id === ED.tab; })[0] || ED.tabs[0]; t.render(main);
  };
  ED.go = function (tab, sel) { if (sel) ED.sel[tab] = sel; ED.show(tab); var b = document.querySelector('#tabs button[data-id="' + tab + '"]'); if (b) b.scrollIntoView({ inline: 'center', block: 'nearest' }); };

  /* ---------------- references (what uses a scene / flag) ---------------- */
  ED.sceneUses = function (id) {
    var out = [];
    Object.keys(ED.D.maps).forEach(function (mid) { ED.D.maps[mid].ents.forEach(function (e) { ['scene', 'deny', 'outro'].forEach(function (k) { if (e[k] === id) out.push({ map: mid, ent: e.id, key: k }); }); }); });
    return out;
  };
  ED.allFlags = function () {
    var f = {};
    function add(expr) { String(expr || '').split(/[,|]/).forEach(function (t) { t = t.trim().replace(/^!+/, ''); if (t && !/^(plates|torches|party):/.test(t) && t !== 'clear' && t !== 'never' && t !== 'always') f[t] = 1; }); }
    Object.values(ED.D.scenes).forEach(function (s) { s.script.split('\n').forEach(function (l) { var m = /^\s*(set|unset|if|ifnot)\s+(\S+)/.exec(l); if (m) f[m[2]] = 1; }); });
    Object.values(ED.D.maps).forEach(function (m) { m.ents.forEach(function (e) { ['showIf', 'hideIf', 'require', 'once', 'when', 'latch', 'flag', 'greyIf', 'lockWhen'].forEach(function (k) { if (e[k]) add(e[k]); }); }); (m.musicIf || []).forEach(function (p) { add(p[0]); }); add(m.fogIf); });
    return Object.keys(f).sort();
  };

  /* ---------------- playtest ---------------- */
  ED.playtest = function (opts) {
    ED.saveDraft();
    var last = {}; try { last = JSON.parse(localStorage.getItem('sunderbell.edplay') || '{}'); } catch (e) { }
    var st = { mode: last.mode || 'new', map: last.map || ED.D.meta.startMap, x: last.x || 2, y: last.y || 2, flags: last.flags || '', scene: last.scene || '' };
    Object.assign(st, opts || {});
    var body = h('div', null, [
      h('p.hint', null, ['Your changes are saved on this device. The game opens in a new tab using them (your normal saved game is not touched).']),
      ED.field(st, 'mode', { type: 'select', blank: false, label: 'Start', options: [['new', 'New game from the very start'], ['cont', 'Continue my editor test save'], ['map', 'At a map position'], ['scene', 'Play one scene']] }),
      ED.field(st, 'map', { type: 'select', options: ED.opts.maps, label: 'Map (for "at a map position")', blank: false }),
      h('div.grid2', null, [ED.field(st, 'x', { type: 'number', label: 'Tile X' }), ED.field(st, 'y', { type: 'number', label: 'Tile Y' })]),
      ED.field(st, 'flags', { label: 'Flags already set (comma separated)', hint: 'For example: party_isla,party_tobin,party_mira,prologue_done' }),
      ED.field(st, 'scene', { type: 'select', options: ED.opts.scenes, label: 'Scene (for "play one scene")' })
    ]);
    ED.modal('Playtest', body, [['Cancel', null], ['▶ Play', function () {
      try { localStorage.setItem('sunderbell.edplay', JSON.stringify(st)); } catch (e) { }
      var url = 'index.html?draft=1';
      if (st.mode === 'new') { try { localStorage.removeItem('sunderbell.save.draft'); } catch (e) { } url += '&new=1'; }
      if (st.mode === 'map') url += '&map=' + encodeURIComponent(st.map) + '&x=' + st.x + '&y=' + st.y + '&flags=' + encodeURIComponent(st.flags || '');
      if (st.mode === 'scene' && st.scene) url += '&scene=' + encodeURIComponent(st.scene) + (st.flags ? '&flags=' + encodeURIComponent(st.flags) : '');
      var w = window.open(url, '_blank'); if (!w) location.href = url;
    }, 'hot']]);
  };

  /* ---------------- boot ---------------- */
  document.addEventListener('DOMContentLoaded', function () {
    var tabs = document.getElementById('tabs');
    ED.tabs.forEach(function (t) { tabs.appendChild(h('button', { 'data-id': t.id, on: { click: function () { ED.show(t.id); } } }, [t.label])); });
    tabs.querySelectorAll('button').forEach(function (b) { b.dataset.id = b.getAttribute('data-id'); });
    document.getElementById('bUndo').onclick = ED.undo; document.getElementById('bRedo').onclick = ED.redo;
    document.getElementById('bPlay').onclick = function () { ED.playtest(); };
    document.getElementById('bFile').onclick = function () { ED.fileMenu(); };
    var t0 = 'story'; try { t0 = localStorage.getItem('sunderbell.edtab') || 'story'; } catch (e) { }
    ED.show(ED.tabs.some(function (t) { return t.id === t0; }) ? t0 : 'story'); ED.updUndo();
    ED.status(ED.fromDraft ? 'Editing your saved changes (from this device).' : 'Editing the published game. Changes save on this device as you go.');
    window.addEventListener('beforeunload', function () { if (ED.dirty) ED.saveDraft(); });
    document.addEventListener('keydown', function (e) { if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !/INPUT|TEXTAREA/.test(document.activeElement.tagName)) { e.preventDefault(); e.shiftKey ? ED.redo() : ED.undo(); } });
  });
})();
