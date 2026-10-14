/* Sunderbell editor - Story: scenes, dialogue lines, choices, commands, live dialogue preview. */
(function () {
  'use strict';
  var SB = window.SB, ED = window.ED, h = ED.h;

  /* ---- line model (keeps the script editable both as cards and as plain text) ---- */
  function toLines(script) {
    return String(script || '').split('\n').filter(function (l) { return l.trim() !== ''; }).map(function (raw) {
      var t = raw.trim(), m;
      if (t[0] === '#') return { k: 'com', text: t.slice(1).trim() };
      if (t[0] === ':') return { k: 'lab', label: t.slice(1).trim() };
      if (t[0] === '>') return { k: 'narr', text: t.slice(1).trim() };
      if (t[0] === '?') { m = /^\?\s*(.*?)\s*=>\s*:?(\S+)\s*$/.exec(t); return { k: 'cho', text: m ? m[1] : t.slice(1).trim(), label: m ? m[2] : '' }; }
      if ((m = /^([a-z_][a-z0-9_]*)\s*:\s?(.*)$/i.exec(t)) && !SB.COMMANDS[m[1].toLowerCase()]) return { k: 'say', who: m[1].toLowerCase(), text: m[2] };
      var p = t.split(/\s+/); return { k: 'cmd', cmd: p[0].toLowerCase(), args: t.slice(p[0].length).trim() };
    });
  }
  function fromLines(lines) {
    return lines.map(function (l) {
      if (l.k === 'com') return '# ' + l.text;
      if (l.k === 'lab') return ':' + l.label;
      if (l.k === 'narr') return '> ' + l.text;
      if (l.k === 'cho') return '? ' + l.text + ' => ' + l.label;
      if (l.k === 'say') return l.who + ': ' + l.text;
      return (l.cmd + ' ' + (l.args || '')).trim();
    }).join('\n');
  }
  ED.toLines = toLines; ED.fromLines = fromLines;

  var CHAPTER_ORDER = ['Prologue', 'Act I', 'Act II', 'Act III', 'Act IV', 'Epilogue', 'Any'];
  function chapters() { var s = {}; Object.values(ED.D.scenes).forEach(function (sc) { s[sc.chapter || 'Any'] = 1; }); return Object.keys(s).sort(function (a, b) { var ia = CHAPTER_ORDER.indexOf(a), ib = CHAPTER_ORDER.indexOf(b); return (ia < 0 ? 50 : ia) - (ib < 0 ? 50 : ib) || a.localeCompare(b); }); }

  ED.register('story', 'Story', function (main) {
    var D = ED.D, sel = ED.sel.story;
    if (sel && !D.scenes[sel]) sel = ED.sel.story = null;
    var chs = chapters(), items = [];
    chs.forEach(function (c) { Object.keys(D.scenes).forEach(function (id) { var s = D.scenes[id]; if ((s.chapter || 'Any') === c) items.push({ id: id, label: s.title || id, sub: id, group: c }); }); });
    var detail = ED.listDetail(main, {
      items: items, selected: sel, onSelect: function (id) { ED.sel.story = id; ED.rerender(); },
      add: function () { ED.prompt('New scene', 'Scene id (lowercase, no spaces)', 'new_scene', function (id) { if (!ED.validId(id)) { alert('Use lowercase letters, numbers and _'); return false; } if (D.scenes[id]) { alert('That id exists'); return false; } D.scenes[id] = { title: 'New scene', chapter: sel && D.scenes[sel] ? D.scenes[sel].chapter : 'Any', script: '> Something happens.\npell: Hello!\nend' }; ED.commit(); ED.sel.story = id; ED.rerender(); }); },
      extra: [ED.btn('Flags', showFlags, 'sm', 'Every flag the story uses')]
    });
    if (!sel) { detail.appendChild(h('div.big-empty', null, ['Pick a scene on the left, or tap + New.', h('p.hint', null, ['Scenes are the story: dialogue, choices and events. NPCs, signs, triggers and bosses on the Maps tab run them.'])])); return; }
    var sc = D.scenes[sel], mode = ED.sel.storyMode || 'cards';
    detail.appendChild(h('div.row', null, [detail.back(), h('h2.grow', null, [sc.title || sel]),
      ED.btn('▶ Preview talk', function () { preview(sel); }, 'hot sm'),
      ED.btn('▶ In game', function () { ED.playtest({ mode: 'scene', scene: sel }); }, 'sm')]));
    detail.appendChild(h('div.grid2', null, [
      ED.field(sc, 'title', { label: 'Title', onChange: function () { ED.rerender(); } }),
      (function () { var f = ED.field(sc, 'chapter', { label: 'Chapter', onChange: function () { ED.rerender(); } }); var dl = h('datalist#chlist', null, chs.map(function (c) { return h('option', { value: c }); })); f.querySelector('input').setAttribute('list', 'chlist'); f.appendChild(dl); return f; })()
    ]));
    detail.appendChild(h('div.row', { style: { marginTop: '6px' } }, [
      ED.btn('Rename id', function () { ED.prompt('Rename scene', 'New id', sel, function (nid) { if (!ED.validId(nid) || D.scenes[nid]) { alert('Invalid or taken'); return false; } D.scenes[nid] = sc; delete D.scenes[sel]; ED.sceneUses(sel).forEach(function (u) { D.maps[u.map].ents.forEach(function (e) { if (e.id === u.ent && e[u.key] === sel) e[u.key] = nid; }); }); if (D.meta.startScene === sel) D.meta.startScene = nid; ED.commit(); ED.sel.story = nid; ED.rerender(); }); }, 'sm'),
      ED.btn('Duplicate', function () { var n = sel + '_copy', i = 2; while (D.scenes[n]) n = sel + '_copy' + (i++); D.scenes[n] = SB.clone(sc); D.scenes[n].title += ' (copy)'; ED.commit(); ED.sel.story = n; ED.rerender(); }, 'sm'),
      ED.btn('Delete', function () { ED.confirm('Delete scene', 'Delete "' + sel + '"? Anything that runs it will do nothing.', function () { delete D.scenes[sel]; ED.commit(); ED.sel.story = null; ED.rerender(); }); }, 'sm danger'),
      h('span.grow'),
      ED.btn('Cards', function () { ED.sel.storyMode = 'cards'; ED.rerender(); }, 'sm' + (mode === 'cards' ? ' on' : '')),
      ED.btn('Script', function () { ED.sel.storyMode = 'script'; ED.rerender(); }, 'sm' + (mode === 'script' ? ' on' : ''))
    ]));
    var uses = ED.sceneUses(sel);
    var ub = h('div.usedby', null, ['Run by: ']);
    if (!uses.length) ub.appendChild(document.createTextNode(D.meta.startScene === sel ? 'the start of a new game' : 'nothing on a map (it may be started by a boss, chest or another scene)'));
    uses.forEach(function (u, i) { ub.appendChild(h('a', { on: { click: function () { ED.sel.maps = u.map; ED.sel.mapEnt = u.ent; ED.go('maps'); } } }, [u.map + ' / ' + u.ent])); if (i < uses.length - 1) ub.appendChild(document.createTextNode(', ')); });
    detail.appendChild(ub);
    var errBox = h('div.errs');
    function validate() { var p = SB.parseScript(sc.script); errBox.innerHTML = ''; p.errors.forEach(function (e) { errBox.appendChild(h('div', null, ['Line ' + e.line + ': ' + e.msg])); }); }
    if (mode === 'script') {
      var ta = h('textarea.script', { value: sc.script, spellcheck: false, on: { input: function () { sc.script = ta.value; validate(); }, change: function () { ED.commit(); } } });
      detail.appendChild(h('div.scriptwrap', null, [ta])); detail.appendChild(errBox); validate();
    } else {
      detail.appendChild(errBox); validate();
      detail.appendChild(cards(sc, validate));
    }
    detail.appendChild(reference());
  });

  /* ---- cards view ---- */
  function cards(sc, validate) {
    var lines = toLines(sc.script), wrap = h('div.lines');
    function save() { sc.script = fromLines(lines); ED.commit(); validate(); }
    function labels() { return lines.filter(function (l) { return l.k === 'lab'; }).map(function (l) { return l.label; }); }
    function draw() {
      wrap.innerHTML = '';
      lines.forEach(function (l, i) {
        var row = h('div.ln.' + l.k), body;
        if (l.k === 'say') {
          var pt = h('div.pt', null, [l.who === 'leader' ? h('span', { text: '★' }) : ED.charThumb(l.who, 32)]);
          var who = h('select', { on: { change: function () { l.who = who.value; save(); draw(); } } }, [h('option', { value: 'leader' }, ['(leader)'])].concat(ED.opts.chars().map(function (o) { return h('option', { value: o[0] }, [o[1]]); })));
          who.value = l.who; if (who.value !== l.who) { who.appendChild(h('option', { value: l.who }, [l.who + ' (?)'])); who.value = l.who; }
          var ta = h('textarea', { rows: 2, value: l.text, on: { change: function () { l.text = ta.value; save(); } } });
          row.appendChild(h('div.who', null, [pt, who])); body = ta;
        } else if (l.k === 'narr') { row.appendChild(h('div.tag', null, ['Narrator'])); body = h('textarea', { rows: 2, value: l.text, on: { change: function (e) { l.text = e.target.value; save(); } } }); }
        else if (l.k === 'cho') {
          row.appendChild(h('div.tag', null, ['Choice']));
          var ls = h('select', { on: { change: function () { l.label = ls.value; save(); } } }, labels().map(function (x) { return h('option', { value: x }, ['→ ' + x]); })); ls.value = l.label;
          body = h('div', { style: { flex: 1 } }, [h('input', { value: l.text, on: { change: function (e) { l.text = e.target.value; save(); } } }), ls]);
        }
        else if (l.k === 'lab') { row.appendChild(h('div.tag', null, ['Label'])); body = h('input', { value: l.label, on: { change: function (e) { var old = l.label; l.label = e.target.value.replace(/\s+/g, '_'); lines.forEach(function (o) { if (o.k === 'cho' && o.label === old) o.label = l.label; if (o.k === 'cmd' && /^(goto|if|ifnot)$/.test(o.cmd)) o.args = o.args.replace(new RegExp('(^|\\s):?' + old + '$'), '$1' + l.label); }); save(); draw(); } } }); }
        else if (l.k === 'com') { row.appendChild(h('div.tag', null, ['Note'])); body = h('input', { value: l.text, on: { change: function (e) { l.text = e.target.value; save(); } } }); }
        else {
          var cs = h('select', { style: { width: '92px', flex: 'none' }, on: { change: function () { l.cmd = cs.value; save(); draw(); } } }, Object.keys(SB.COMMANDS).map(function (c) { return h('option', { value: c }, [c]); }));
          cs.value = l.cmd; row.appendChild(cs);
          body = h('div', { style: { flex: 1 } }, [h('input', { value: l.args, placeholder: SB.COMMANDS[l.cmd] || '', on: { change: function (e) { l.args = e.target.value; save(); } } }), h('div.hint', null, [SB.COMMANDS[l.cmd] || ''])]);
        }
        body.style.flex = '1'; row.appendChild(body);
        row.appendChild(h('div.ops', null, [
          ED.btn('▲', function () { if (i > 0) { lines.splice(i - 1, 0, lines.splice(i, 1)[0]); save(); draw(); } }),
          ED.btn('+', function () { addMenu(i + 1); }),
          ED.btn('✕', function () { lines.splice(i, 1); save(); draw(); }),
          ED.btn('▼', function () { if (i < lines.length - 1) { lines.splice(i + 1, 0, lines.splice(i, 1)[0]); save(); draw(); } })
        ]));
        wrap.appendChild(row);
      });
      wrap.appendChild(h('div.cmdbar', null, [
        ED.btn('+ Line', function () { add(lines.length, 'say'); }, 'hot sm'), ED.btn('+ Narration', function () { add(lines.length, 'narr'); }, 'sm'),
        ED.btn('+ Choice', function () { add(lines.length, 'cho'); }, 'sm'), ED.btn('+ Label', function () { add(lines.length, 'lab'); }, 'sm'), ED.btn('+ Command', function () { add(lines.length, 'cmd'); }, 'sm')
      ]));
    }
    function add(at, k) {
      var last = lines.filter(function (x) { return x.k === 'say'; }).pop();
      var n = k === 'say' ? { k: 'say', who: last ? last.who : 'pell', text: '' } : k === 'narr' ? { k: 'narr', text: '' } : k === 'cho' ? { k: 'cho', text: 'Option', label: labels()[0] || 'next' } : k === 'lab' ? { k: 'lab', label: 'label' + (labels().length + 1) } : { k: 'cmd', cmd: 'set', args: 'my_flag' };
      lines.splice(at, 0, n); save(); draw();
      var el = wrap.children[at]; if (el) { var f = el.querySelector('textarea,input'); if (f) f.focus(); }
    }
    function addMenu(at) {
      ED.modal('Insert', h('div.typegrid', null, [['say', 'Dialogue line'], ['narr', 'Narration'], ['cho', 'Choice option'], ['lab', 'Label'], ['cmd', 'Command']].map(function (t) { return ED.btn(t[1], function () { ED.closeModal(); add(at, t[0]); }); })), [['Cancel', null]]);
    }
    draw(); setTimeout(grow, 0); wrap.addEventListener('input', function (e) { if (e.target.tagName === 'TEXTAREA') fit(e.target); }); return wrap;
    function fit(t) { t.style.height = 'auto'; t.style.height = (t.scrollHeight + 2) + 'px'; }
    function grow() { wrap.querySelectorAll('textarea').forEach(fit); }
  }

  function reference() {
    var d = h('details.card', null, [h('summary', null, ['Script reference (tap to open)'])]);
    var rows = [['who: text', 'A line of dialogue. who = a character id, or leader for whoever leads.'], ['> text', 'Narration.'], ['? text => label', 'A choice. Several in a row make one choice; each jumps to its :label.'], [':label', 'A jump target.']];
    Object.keys(SB.COMMANDS).forEach(function (c) { rows.push([SB.COMMANDS[c], ({ set: 'Turn a flag on. Flags remember story progress.', 'if': 'Jump to a label if the flag is on.', ifnot: 'Jump if the flag is off.', give: 'Items: key, heart_vessel, chimes, fork...', music: 'Change the music (see the Music tab).', warp: 'Move the party to another map (tile x y).', move: 'Walk a character to tile x y.', emote: 'Show ! ? ... above someone.', hide: 'Hide a map object (e.g. hide severin).', show: 'Show a hidden map object.', banner: 'Big title card.', quest: 'Set the goal shown at the top of the screen.', journal: 'Add an entry to the journal.', end: 'Stop the scene.', credits: 'Roll the credits.' })[c] || '']); });
    rows.push(['Characters', Object.keys(ED.D.characters).join(', ')]);
    d.appendChild(h('div', { style: { fontSize: '12px' } }, rows.map(function (r) { return h('div', { style: { margin: '4px 0' } }, [h('code', null, [r[0]]), ' ', r[1]]); })));
    return d;
  }
  function showFlags() {
    var f = ED.allFlags();
    ED.modal('Story flags', h('div', null, [h('p.hint', null, ['Flags are on/off switches that remember progress. Scenes turn them on with "set", and map objects use them in Show if / Hide if / Require.']), h('div.flaglist', null, f.map(function (x) { return h('div', null, [x]); }))]));
  }

  /* ---- dialogue preview with voices ---- */
  function preview(id) {
    SB.audio.unlock();
    var p = SB.parseScript(ED.D.scenes[id].script), pc = 0, ov = h('div.preview'), assume = !!ED.sel.assumeFlags;
    document.body.appendChild(ov);
    function close() { if (ov.parentNode) ov.parentNode.removeChild(ov); }
    function next() {
      if (pc >= p.cmds.length) { close(); return; }
      var c = p.cmds[pc++];
      if (c.c === 'say') return show(c);
      if (c.c === 'choice') { ov.innerHTML = ''; var box = h('div', { style: { maxWidth: '520px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '6px' } }); c.options.forEach(function (o) { box.appendChild(ED.btn(o.text, function () { pc = p.labels[o.label]; next(); }, 'hot')); }); ov.appendChild(box); return; }
      if (c.c === 'goto') { pc = p.labels[c.label]; return next(); }
      if (c.c === 'if' || c.c === 'ifnot') { var on = assume; if ((c.c === 'if') === on && c.label in p.labels) pc = p.labels[c.label]; return next(); }
      if (c.c === 'end') { close(); return; }
      if (c.c === 'sfx') SB.audio.sfx(c.args[0]);
      if (c.c === 'music') SB.audio.music(c.args[0]);
      return next();
    }
    function show(c) {
      ov.innerHTML = ''; var who = c.who === 'leader' ? 'pell' : c.who, ch = who ? ED.D.characters[who] || { name: who } : null;
      var tx = h('div.ptx'), box = h('div.pbox', null, [ch ? h('div.pp', null, [ED.charThumb(who, 54)]) : null, h('div.pt', null, [ch ? h('div.pn', { style: { color: ch.color } }, [ch.name]) : h('div.note', null, ['Narration']), tx, h('div.note', null, ['tap to continue · line ' + c.line])])]);
      ov.appendChild(box); var i = 0, voice = ch ? (ch.voice || who) : 'narrator';
      var iv = setInterval(function () { if (i >= c.text.length) { clearInterval(iv); return; } var chh = c.text[i++]; tx.textContent = c.text.slice(0, i); if (/[a-z0-9]/i.test(chh) && i % 2 === 0) SB.audio.blip(voice, chh); }, 22);
      ov.onclick = function () { if (i < c.text.length) { i = c.text.length; tx.textContent = c.text; return; } clearInterval(iv); next(); };
    }
    var top = h('div.row', { style: { maxWidth: '640px', margin: '0 auto 8px', justifyContent: 'space-between' } }, [h('label.row', { style: { color: '#fff' } }, [h('input', { type: 'checkbox', checked: assume, on: { change: function (e) { ED.sel.assumeFlags = e.target.checked; assume = e.target.checked; } } }), ' Treat "if" flags as ON']), ED.btn('Close', function (e) { e.stopPropagation(); close(); })]);
    next(); ov.insertBefore(top, ov.firstChild);
    var origShow = show; show = function (c) { origShow(c); ov.insertBefore(top, ov.firstChild); };
  }
})();
