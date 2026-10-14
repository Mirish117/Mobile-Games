/* Sunderbell editor - Music tracker, Voices, Sound effects. */
(function () {
  'use strict';
  var SB = window.SB, ED = window.ED, h = ED.h, A = SB.audio;
  var NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  function stopAll() { A.music('none'); }

  /* ============================== MUSIC ============================== */
  ED.register('music', 'Music', function (main) {
    var D = ED.D, sel = ED.sel.music; if (sel && !D.songs[sel]) sel = ED.sel.music = null;
    var detail = ED.listDetail(main, {
      items: Object.keys(D.songs).map(function (k) { var s = D.songs[k]; return { id: k, label: s.name, sub: k + '  ' + s.bpm + ' bpm' }; }),
      selected: sel, onSelect: function (id) { stopAll(); ED.sel.music = id; ED.sel.chan = 0; ED.rerender(); },
      add: function () {
        ED.prompt('New song', 'Id (lowercase)', 'new_song', function (id) {
          if (!ED.validId(id) || D.songs[id]) { alert('Invalid or existing id'); return false; }
          var blank = function () { return '. . . . . . . . . . . . . . . .'; };
          D.songs[id] = { name: 'New Song', bpm: 110, steps: 16, loop: true, channels: [{ name: 'Lead', wave: 'pulse25', vol: .5, env: 'pluck', vib: 1, notes: [blank(), blank(), blank(), blank()] }, { name: 'Harmony', wave: 'pulse12', vol: .2, env: 'pluck', notes: [blank(), blank(), blank(), blank()] }, { name: 'Bass', wave: 'triangle', vol: .6, env: 'hold', notes: [blank(), blank(), blank(), blank()] }, { name: 'Drums', wave: 'noise', vol: .4, env: 'drum', notes: ['k . h . s . h . k . h . s . h .', 'k . h . s . h . k . h . s . h .', 'k . h . s . h . k . h . s . h .', 'k . h . s . h . k . h . s . h .'] }] };
          ED.commit(); ED.sel.music = id; ED.rerender();
        });
      }
    });
    ED.cleanup = stopAll;
    if (!sel) { detail.appendChild(h('div.big-empty', null, ['Pick a song. Songs are chiptune patterns: each channel plays one note at a time, 16 steps per bar. Maps choose their music on the Maps tab; scenes change it with "music".'])); return; }
    tracker(detail, sel);
  });

  function tracker(root, id) {
    var D = ED.D, s = D.songs[id], ci = Math.min(ED.sel.chan || 0, s.channels.length - 1), ch = s.channels[ci];
    var selCell = ED.sel.cell || [0, 0], oct = ED.sel.oct || 5, player = null;
    var bars = function () { return ch.notes.map(function (b) { var t = b.trim().split(/\s+/); while (t.length < 16) t.push('.'); return t.slice(0, 16); }); };
    var grid = bars();
    function save() { ch.notes = grid.map(function (b) { return b.join(' '); }); ED.commit(); }
    root.appendChild(h('div.row', null, [root.back(), h('h2.grow', null, [s.name]),
      ED.btn('▶ Play', function () { play(0); }, 'hot sm'), ED.btn('▶ From bar', function () { play(selCell[0]); }, 'sm'), ED.btn('■ Stop', function () { stopAll(); clearPlay(); }, 'sm')]));
    root.appendChild(h('div.grid3', null, [ED.field(s, 'name', { label: 'Name' }), ED.field(s, 'bpm', { type: 'number', label: 'Tempo (bpm)' }), ED.field(s, 'swing', { type: 'number', step: .1, label: 'Swing 0-1', optional: true })]));
    root.appendChild(ED.field(s, 'loop', { type: 'check', label: 'Loops' }));
    /* channel tabs */
    var tabs = h('div.row', { style: { marginTop: '8px' } });
    s.channels.forEach(function (c, i) { tabs.appendChild(ED.btn(c.name || ('Ch ' + (i + 1)), function () { ED.sel.chan = i; ED.rerender(); }, 'sm' + (i === ci ? ' on' : ''))); });
    tabs.appendChild(ED.btn('+ Channel', function () { s.channels.push({ name: 'Ch ' + (s.channels.length + 1), wave: 'pulse50', vol: .3, env: 'pluck', notes: ch.notes.map(function () { return '. . . . . . . . . . . . . . . .'; }) }); ED.commit(); ED.sel.chan = s.channels.length - 1; ED.rerender(); }, 'sm'));
    root.appendChild(tabs);
    var drums = ch.wave === 'noise';
    root.appendChild(h('div.card', null, [h('div.grid3', null, [
      ED.field(ch, 'name', { label: 'Channel name', onChange: function () { ED.rerender(); } }),
      ED.field(ch, 'wave', { type: 'select', blank: false, label: 'Sound', options: [['pulse12', 'Thin pulse (12%)'], ['pulse25', 'Pulse (25%)'], ['pulse50', 'Square (50%)'], ['triangle', 'Triangle (soft bass)'], ['saw', 'Sawtooth (buzzy)'], ['sine', 'Sine (pure)'], ['noise', 'Drums (noise)']], onChange: function () { ED.rerender(); } }),
      ED.field(ch, 'vol', { type: 'number', step: .05, label: 'Volume 0-1' })]),
      drums ? null : h('div.grid3', null, [ED.field(ch, 'env', { type: 'select', blank: false, label: 'Shape', options: [['pluck', 'Pluck'], ['hold', 'Held'], ['soft', 'Soft attack'], ['bell', 'Bell (fades)']] }), ED.field(ch, 'vib', { type: 'number', label: 'Vibrato 0-3', optional: true }), h('div', null, [h('label', null, [' ']), ED.btn('Delete channel', function () { if (s.channels.length < 2) return; s.channels.splice(ci, 1); ED.commit(); ED.sel.chan = 0; ED.rerender(); }, 'sm danger')])])]));
    /* grid */
    var trk = h('div.trk'); root.appendChild(trk);
    var cells = [];
    function drawGrid() {
      trk.innerHTML = ''; cells = [];
      grid.forEach(function (bar, bi) {
        var row = h('div.bar'), cs = h('div.cells'); cells[bi] = [];
        bar.forEach(function (tok, si) {
          var c = h('div.c' + (si % 4 === 0 ? '.beat' : '') + (tok === '-' ? '.h' : tok === '.' ? '.r' : '.n') + (bi === selCell[0] && si === selCell[1] ? '.sel' : ''), { text: tok === '.' ? '·' : tok === '-' ? '—' : tok.replace(/(\d)$/, '$1'), on: { click: function () { selCell = [bi, si]; ED.sel.cell = selCell; drawGrid(); } } });
          cs.appendChild(c); cells[bi].push(c);
        });
        row.appendChild(h('div.bn', null, [String(bi + 1)])); row.appendChild(cs);
        row.appendChild(h('div.bops', null, [ED.btn('⧉', function () { grid.splice(bi + 1, 0, bar.slice()); s.channels.forEach(function (o, oi) { if (oi !== ci) o.notes.splice(bi + 1, 0, o.notes[bi] || '. . . . . . . . . . . . . . . .'); }); save(); drawGrid(); }, null, 'Duplicate this bar (all channels)'), ED.btn('✕', function () { if (grid.length < 2) return; grid.splice(bi, 1); s.channels.forEach(function (o, oi) { if (oi !== ci) o.notes.splice(bi, 1); }); save(); drawGrid(); }, null, 'Delete this bar (all channels)')]));
        trk.appendChild(row);
      });
      trk.appendChild(h('div.row', null, [ED.btn('+ Empty bar', function () { s.channels.forEach(function (o, oi) { if (oi === ci) grid.push('. . . . . . . . . . . . . . . .'.split(' ')); else o.notes.push('. . . . . . . . . . . . . . . .'); }); save(); drawGrid(); }, 'sm'), ED.btn('Transpose bar −', function () { transpose(-1); }, 'sm'), ED.btn('Transpose bar +', function () { transpose(1); }, 'sm')]));
    }
    function transpose(d) { var b = grid[selCell[0]]; grid[selCell[0]] = b.map(function (t) { var m = /^([A-G]#?)(\d)$/.exec(t); if (!m) return t; var v = NOTES.indexOf(m[1]) + (+m[2]) * 12 + d; return NOTES[(v % 12 + 12) % 12] + Math.floor(v / 12); }); save(); drawGrid(); }
    function put(tok) {
      grid[selCell[0]][selCell[1]] = tok; save();
      if (tok !== '.' && tok !== '-') { if (drums) A.sfxDef({ kind: 'noise', f0: tok === 'k' ? 150 : tok === 's' ? 1800 : 7000, f1: tok === 'k' ? 60 : tok === 's' ? 1500 : 6000, dur: .12, vol: .4 }); else A.sfxDef({ kind: 'synth', wave: ch.wave === 'noise' ? 'square' : ch.wave, f0: A.freq(tok), f1: A.freq(tok), dur: .25, vol: .4 }); }
      selCell = [selCell[0] + (selCell[1] === 15 ? 1 : 0), (selCell[1] + 1) % 16]; if (selCell[0] >= grid.length) selCell = [grid.length - 1, 15]; ED.sel.cell = selCell; drawGrid();
    }
    /* note pad */
    var pad = h('div.notepad');
    function drawPad() {
      pad.innerHTML = '';
      if (drums) pad.appendChild(h('div.keys', { style: { gridTemplateColumns: 'repeat(6,1fr)' } }, [['k', 'Kick'], ['s', 'Snare'], ['h', 'Hat'], ['o', 'Open hat'], ['.', 'Rest'], ['-', '—']].map(function (k) { return ED.btn(k[1], function () { A.unlock(); put(k[0]); }); })));
      else {
        pad.appendChild(h('div.keys', null, NOTES.map(function (n) { return h('button' + (n.length > 1 ? '.blk' : ''), { on: { click: function () { A.unlock(); put(n + oct); } } }, [n]); })));
        pad.appendChild(h('div.row', { style: { marginTop: '4px' } }, [ED.btn('Oct −', function () { oct = Math.max(1, oct - 1); ED.sel.oct = oct; drawPad(); }, 'sm'), h('b', null, ['Octave ' + oct]), ED.btn('Oct +', function () { oct = Math.min(7, oct + 1); ED.sel.oct = oct; drawPad(); }, 'sm'), ED.btn('— Hold', function () { put('-'); }, 'sm'), ED.btn('· Rest', function () { put('.'); }, 'sm'), h('span.hint', null, ['Tap a step, then a note. "Hold" continues the note before it.'])]));
      }
    }
    root.appendChild(pad); drawGrid(); drawPad();
    function clearPlay() { root.querySelectorAll('.c.play').forEach(function (c) { c.classList.remove('play'); }); }
    function play(fromBar) {
      A.unlock(); clearPlay();
      var song = SB.clone(s); if (fromBar) song.channels.forEach(function (c) { c.notes = c.notes.slice(fromBar).concat(c.notes.slice(0, fromBar)); });
      player = A.music('__ed', true, song);
      if (!player) { setTimeout(function () { play(fromBar); }, 100); return; }
      var total = grid.length * 16, last = null;
      player.onStep = function (st) { var g = (st + fromBar * 16) % total, b = Math.floor(g / 16), k = g % 16; setTimeout(function () { if (last) last.classList.remove('play'); last = cells[b] && cells[b][k]; if (last) last.classList.add('play'); }, 60); };
    }
  }

  /* ============================== VOICES ============================== */
  ED.register('voices', 'Voices', function (main) {
    var D = ED.D, sel = ED.sel.voices; if (sel && !D.voices[sel]) sel = ED.sel.voices = null;
    var detail = ED.listDetail(main, {
      items: Object.keys(D.voices).map(function (k) { var v = D.voices[k]; return { id: k, label: v.name || k, sub: k + (v.pitch ? '  ' + Math.round(v.pitch) + ' Hz' : '') }; }),
      selected: sel, onSelect: function (id) { ED.sel.voices = id; ED.rerender(); },
      add: function () { ED.prompt('New voice', 'Id', 'new_voice', function (id) { if (!ED.validId(id) || D.voices[id]) { alert('Invalid or taken'); return false; } D.voices[id] = SB.clone(D.voices.pell); D.voices[id].name = id; ED.commit(); ED.sel.voices = id; ED.rerender(); }); }
    });
    if (!sel) { detail.appendChild(h('div.big-empty', null, ['Voices are synthesised: a buzzy throat shaped into vowels. Each character has talk blips (while text types out) and short yells for attacking, getting hurt, lifting and cheering.'])); return; }
    var v = D.voices[sel]; v.talk = v.talk || {}; v.grunts = v.grunts || {};
    detail.appendChild(h('div.row', null, [detail.back(), h('h2.grow', null, [v.name || sel])]));
    var test = { text: 'Bellday, boy! Three hundred years.' };
    detail.appendChild(h('div.row', null, [h('div.grow', null, [ED.field(test, 'text', { label: 'Say something', bare: false })]), ED.btn('▶ Speak', function () { A.unlock(); var i = 0, t = test.text; var iv = setInterval(function () { if (i >= t.length) { clearInterval(iv); return; } var c = t[i++]; if (/[a-z0-9]/i.test(c) && i % (v.talk.every || 2) === 0) A.blip(sel, c); }, 30); }, 'hot')]));
    if (!v.pitch) { detail.appendChild(h('p.hint', null, ['This voice is a plain typewriter tick (used for narration).'])); return; }
    detail.appendChild(h('h3', null, ['Throat']));
    detail.appendChild(h('div.grid2', null, [
      ED.field(v, 'pitch', { type: 'range', min: 40, max: 700, step: 1, label: 'Pitch (Hz)' }), ED.field(v, 'size', { type: 'range', min: .5, max: 1.6, step: .01, label: 'Body size (low = big)' }),
      ED.field(v, 'breath', { type: 'range', min: 0, max: 1, step: .01, label: 'Breathiness' }), ED.field(v, 'gravel', { type: 'range', min: 0, max: 1, step: .01, label: 'Gravel / roughness' })]));
    detail.appendChild(ED.field(v, 'wave', { type: 'select', blank: false, label: 'Source', options: [['sawtooth', 'Natural (saw)'], ['square', 'Robotic (square)']] }));
    detail.appendChild(h('h3', null, ['Talking blips']));
    detail.appendChild(h('div.grid3', null, [ED.field(v.talk, 'vowels', { label: 'Vowels used (a e i o u)' }), ED.field(v.talk, 'len', { type: 'number', step: .005, label: 'Blip length (s)' }), ED.field(v.talk, 'every', { type: 'number', label: 'Blip every N letters' })]));
    detail.appendChild(h('div.grid2', null, [ED.field(v.talk, 'jitter', { type: 'number', step: .5, label: 'Pitch wobble' }), ED.field(v.talk, 'vol', { type: 'number', step: .05, label: 'Volume' })]));
    detail.appendChild(h('h3', null, ['Yells']));
    detail.appendChild(h('p.hint', null, ['attack / attack2: swinging a tool. hurt: taking a hit. swap: becoming leader. cheer: opening a chest, defeating a shadow. huh: shouted lines.']));
    Object.keys(v.grunts).forEach(function (k) {
      var g = v.grunts[k];
      detail.appendChild(h('div.card', null, [h('div.row', null, [h('b.grow', null, [k]), ED.btn('▶', function () { A.unlock(); A.voice(sel, k); }, 'hot sm')]),
        h('div.grid3', null, [ED.field(g, 'v', { label: 'Vowel(s)' }), ED.field(g, 'len', { type: 'number', step: .01, label: 'Length' }), ED.field(g, 'h', { type: 'number', step: .1, label: '"H" breath at start' })]),
        h('div.grid2', null, [ED.field(g, 'p0', { type: 'number', step: .05, label: 'Start pitch ×' }), ED.field(g, 'p1', { type: 'number', step: .05, label: 'End pitch ×' })])]));
    });
  });

  /* ============================== SOUND EFFECTS ============================== */
  ED.register('sfx', 'Sounds', function (main) {
    var D = ED.D, sel = ED.sel.sfx; if (sel && !D.sfx[sel]) sel = ED.sel.sfx = null;
    var detail = ED.listDetail(main, {
      items: Object.keys(D.sfx).map(function (k) { return { id: k, label: k, sub: D.sfx[k].kind }; }),
      selected: sel, onSelect: function (id) { ED.sel.sfx = id; ED.rerender(); A.unlock(); if (id) A.sfx(id); },
      add: function () { ED.prompt('New sound', 'Id', 'new_sound', function (id) { if (!ED.validId(id) || D.sfx[id]) { alert('Invalid or taken'); return false; } D.sfx[id] = { kind: 'synth', wave: 'square', f0: 660, f1: 330, dur: .15, vol: .3 }; ED.commit(); ED.sel.sfx = id; ED.rerender(); }); }
    });
    if (!sel) { detail.appendChild(h('div.big-empty', null, ['Sound effects are synthesised. Tap one to hear it. Scenes play them with "sfx name".'])); return; }
    var d = D.sfx[sel];
    detail.appendChild(h('div.row', null, [detail.back(), h('h2.grow', null, [sel]), ED.btn('▶ Play', function () { A.unlock(); A.sfx(sel); }, 'hot')]));
    if (d.kind === 'synth' || d.kind === 'noise' || d.kind === 'bell') {
      detail.appendChild(ED.field(d, 'kind', { type: 'select', blank: false, label: 'Kind', options: [['synth', 'Tone sweep'], ['noise', 'Noise sweep'], ['bell', 'Bell']], onChange: function () { ED.rerender(); } }));
      if (d.kind === 'synth') detail.appendChild(ED.field(d, 'wave', { type: 'select', blank: false, label: 'Wave', options: ['square', 'triangle', 'sawtooth', 'sine', 'pulse12', 'pulse25'] }));
      if (d.kind === 'bell') detail.appendChild(ED.field(d, 'f', { type: 'number', label: 'Pitch (Hz)' }));
      else detail.appendChild(h('div.grid2', null, [ED.field(d, 'f0', { type: 'number', label: 'Start frequency' }), ED.field(d, 'f1', { type: 'number', label: 'End frequency' })]));
      detail.appendChild(h('div.grid2', null, [ED.field(d, 'dur', { type: 'number', step: .01, label: 'Length (s)' }), ED.field(d, 'vol', { type: 'number', step: .05, label: 'Volume' })]));
      if (d.kind === 'noise') detail.appendChild(ED.field(d, 'q', { type: 'number', step: .1, label: 'Sharpness (Q)', optional: true }));
    }
    var ta = h('textarea', { rows: 10, value: JSON.stringify(d, null, 1), on: { change: function () { try { D.sfx[sel] = JSON.parse(ta.value); ED.commit(); A.sfx(sel); } catch (e) { alert('Not valid JSON'); } } } });
    detail.appendChild(h('details.card', { open: !(d.kind === 'synth' || d.kind === 'noise' || d.kind === 'bell') }, [h('summary', null, ['Advanced (JSON): seq = notes, mix = several sounds together']), ta]));
  });
})();
