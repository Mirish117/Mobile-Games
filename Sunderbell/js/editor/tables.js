/* Sunderbell editor - Characters, Heroes, Enemies, Bosses, Items, Game settings. */
(function () {
  'use strict';
  var SB = window.SB, ED = window.ED, h = ED.h;

  function idPrompt(title, coll, make, tab) {
    ED.prompt(title, 'Id (lowercase, no spaces)', '', function (id) { if (!ED.validId(id) || coll[id]) { alert('Invalid or existing id'); return false; } coll[id] = make(id); ED.commit(); ED.sel[tab] = id; ED.rerender(); });
  }
  function delBtn(coll, id, tab, warn) { return ED.btn('Delete', function () { ED.confirm('Delete', warn || ('Delete "' + id + '"?'), function () { delete coll[id]; ED.commit(); ED.sel[tab] = null; ED.rerender(); }); }, 'sm danger'); }

  /* ============================== CHARACTERS ============================== */
  ED.register('chars', 'Characters', function (main) {
    var D = ED.D, sel = ED.sel.chars; if (sel && !D.characters[sel]) sel = ED.sel.chars = null;
    var detail = ED.listDetail(main, {
      items: Object.keys(D.characters).map(function (k) { var c = D.characters[k]; return { id: k, label: c.name, sub: k, icon: function () { return ED.charThumb(k, 28); } }; }),
      selected: sel, onSelect: function (id) { ED.sel.chars = id; ED.rerender(); },
      add: function () { idPrompt('New character', D.characters, function (id) { return { name: id.charAt(0).toUpperCase() + id.slice(1), sprite: 'nim', voice: 'nim', color: '#ffffff' }; }, 'chars'); }
    });
    if (!sel) { detail.appendChild(h('div.big-empty', null, ['Characters are everyone who speaks: heroes, villagers, bosses and echoes. Pick one to change their name, look and voice.'])); return; }
    var c = D.characters[sel];
    detail.appendChild(h('div.row', null, [detail.back(), ED.charThumb(sel, 64), h('h2.grow', null, [c.name]), h('code', null, [sel])]));
    detail.appendChild(h('div.grid2', null, [ED.field(c, 'name', { label: 'Name shown in dialogue', onChange: function () { ED.rerender(); } }), ED.field(c, 'color', { type: 'color', label: 'Name colour' })]));
    detail.appendChild(h('div.row', null, [h('div.grow', null, [ED.field(c, 'sprite', { type: 'select', blank: false, label: 'Look (sprite set)', options: function () { return ED.opts.charBases().concat(Object.keys(D.sprites).filter(function (k) { return !/_(down|up|side|atk_\w+)$/.test(k); })); }, onChange: function () { ED.rerender(); } })]), ED.btn('Draw →', function () { ED.sel.sprites = ED.gfx.has(c.sprite + '_down') ? c.sprite + '_down' : c.sprite; ED.go('sprites'); }, 'sm')]));
    detail.appendChild(h('div.row', null, [h('div.grow', null, [ED.field(c, 'voice', { type: 'select', blank: false, label: 'Voice', options: ED.opts.voices })]), ED.btn('▶ Hear', function () { SB.audio.unlock(); var t = 'Hello! Nice to meet you.'; var i = 0; var iv = setInterval(function () { if (i >= t.length) { clearInterval(iv); return; } var ch = t[i++]; if (/[a-z]/i.test(ch) && i % 2 === 0) SB.audio.blip(c.voice, ch); }, 40); }, 'sm'), ED.btn('Edit voice →', function () { ED.sel.voices = c.voice; ED.go('voices'); }, 'sm')]));
    detail.appendChild(ED.field(c, 'ghost', { type: 'check', label: 'Ghostly echo (see-through)', optional: true }));
    detail.appendChild(ED.field(c, 'fogs', { type: 'check', label: 'Turns grey in the fog (villager)', optional: true }));
    detail.appendChild(ED.field(c, 'portrait', { type: 'select', label: 'Dialogue portrait', options: [['false', 'Show the whole sprite (big creatures)']], blankLabel: 'Normal face portrait', optional: true, onChange: function (v) { if (v === 'false') c.portrait = false; ED.commit(); } }));
    var lines = 0; Object.values(D.scenes).forEach(function (s) { s.script.split('\n').forEach(function (l) { if (l.indexOf(sel + ':') === 0) lines++; }); });
    detail.appendChild(h('p.hint', null, [sel + ' speaks ' + lines + ' lines in the story.']));
    detail.appendChild(delBtn(D.characters, sel, 'chars', lines ? 'This character still has ' + lines + ' lines in the story. Delete anyway?' : null));
  });

  /* ============================== HEROES ============================== */
  ED.register('heroes', 'Heroes', function (main) {
    var D = ED.D, wrap = h('div.detail', { style: { height: '100%' } }); main.appendChild(wrap);
    wrap.appendChild(h('h2', null, ['The four heroes']));
    wrap.appendChild(h('p.hint', null, ['Each hero has one tool. The tool types are built into the game (sword cuts, bow shoots, shield bashes and pushes, lantern burns and lights). Their look is the sprite set with the same id; their voice is on the Characters tab.']));
    D.heroes.forEach(function (hd, i) {
      var card = h('div.card');
      card.appendChild(h('div.row', null, [ED.charThumb(hd.id, 48), h('h3.grow', null, [hd.name + '  (' + hd.id + ')']), ED.thumb(hd.icon, 24), i > 0 ? ED.btn('▲', function () { D.heroes.splice(i - 1, 0, D.heroes.splice(i, 1)[0]); ED.commit(); ED.rerender(); }, 'sm', 'Move up (the first hero is who you start as)') : null]));
      card.appendChild(h('div.grid3', null, [ED.field(hd, 'name', { label: 'Name' }), ED.field(hd, 'tool', { type: 'select', blank: false, label: 'Tool type', options: ['sword', 'bow', 'shield', 'lantern'] }), ED.field(hd, 'toolName', { label: 'Tool name (button)' })]));
      card.appendChild(h('div.grid3', null, [ED.field(hd, 'damage', { type: 'number', label: 'Damage' }), ED.field(hd, 'cooldown', { type: 'number', step: .05, label: 'Seconds between uses' }), ED.field(hd, 'icon', { type: 'select', blank: false, label: 'Button icon', options: ED.opts.sprites })]));
      card.appendChild(ED.field(hd, 'joinFlag', { label: 'Joins the party when this flag is set', optional: true, hint: i === 0 ? 'The first hero is always in the party.' : '' }));
      card.appendChild(ED.field(hd, 'desc', { type: 'textarea', label: 'Description (pause menu)', rows: 2 }));
      wrap.appendChild(card);
    });
  });

  /* ============================== ENEMIES ============================== */
  var TOOLS = ['sword', 'bow', 'shield', 'lantern', 'team'];
  function toolChecks(obj, key, label) {
    var arr = obj[key] || [];
    return h('div', null, [h('label', null, [label]), h('div.chips', null, TOOLS.map(function (t) { return h('label', null, [h('input', { type: 'checkbox', checked: arr.indexOf(t) >= 0, on: { change: function (e) { var a = obj[key] || []; if (e.target.checked) { if (a.indexOf(t) < 0) a.push(t); } else a = a.filter(function (x) { return x !== t; }); if (a.length) obj[key] = a; else delete obj[key]; ED.commit(); } } }), t]); }))]);
  }
  ED.register('enemies', 'Enemies', function (main) {
    var D = ED.D, sel = ED.sel.enemies; if (sel && !D.enemies[sel]) sel = ED.sel.enemies = null;
    var detail = ED.listDetail(main, {
      items: Object.keys(D.enemies).map(function (k) { var e = D.enemies[k]; return { id: k, label: e.name, sub: k + '  hp ' + e.hp + '  ' + e.ai, icon: function () { return ED.thumb(e.sprite, 28); } }; }),
      selected: sel, onSelect: function (id) { ED.sel.enemies = id; ED.rerender(); },
      add: function () { idPrompt('New enemy', D.enemies, function () { return { name: 'New Foe', sprite: 'fogling', hp: 2, speed: 24, damage: 1, ai: 'chase', sight: 80, drops: { heart: .2, chime: .5 } }; }, 'enemies'); }
    });
    if (!sel) { detail.appendChild(h('div.big-empty', null, ['Pick an enemy to change its stats, look and behaviour. Place enemies on maps with + Object.'])); return; }
    var e = D.enemies[sel]; e.drops = e.drops || {};
    detail.appendChild(h('div.row', null, [detail.back(), ED.thumb(e.sprite, 48), h('h2.grow', null, [e.name]), h('code', null, [sel])]));
    detail.appendChild(h('div.grid2', null, [ED.field(e, 'name', { label: 'Name' }), ED.field(e, 'sprite', { type: 'select', blank: false, label: 'Sprite', options: ED.opts.sprites, onChange: function () { ED.rerender(); } })]));
    detail.appendChild(ED.field(e, 'ai', { type: 'select', blank: false, label: 'Behaviour', options: [['chase', 'Chase: walks toward the party when close'], ['wander', 'Wander: drifts around'], ['charge', 'Charge: lines up and rushes in a straight line'], ['fly', 'Fly: flutters over walls and water'], ['shell', 'Shell: armoured until Tobin flips it'], ['turret', 'Turret: stays put and shoots'], ['wisp', 'Wisp: drifts through walls toward the party']] }));
    detail.appendChild(h('div.grid3', null, [ED.field(e, 'hp', { type: 'number', label: 'Health' }), ED.field(e, 'speed', { type: 'number', label: 'Speed' }), ED.field(e, 'damage', { type: 'number', label: 'Damage (half hearts)' })]));
    detail.appendChild(h('div.grid3', null, [ED.field(e, 'sight', { type: 'number', label: 'Sight range', optional: true }), ED.field(e, 'chargeSpeed', { type: 'number', label: 'Charge speed', optional: true }), ED.field(e, 'fly', { type: 'check', label: 'Flies', optional: true })]));
    detail.appendChild(h('div.grid3', null, [ED.field(e, 'shot', { type: 'select', label: 'Shoots', options: ED.opts.sprites, optional: true }), ED.field(e, 'fireRate', { type: 'number', label: 'Seconds per shot', optional: true }), ED.field(e, 'shotSpeed', { type: 'number', label: 'Shot speed', optional: true })]));
    detail.appendChild(ED.field(e, 'flipSprite', { type: 'select', label: 'Flipped-over sprite (shell behaviour)', options: ED.opts.sprites, optional: true }));
    detail.appendChild(toolChecks(e, 'immune', 'Immune to'));
    detail.appendChild(toolChecks(e, 'weak', 'Weak to (double damage)'));
    detail.appendChild(h('div.grid2', null, [ED.field(e.drops, 'heart', { type: 'number', step: .05, label: 'Heart drop chance (0-1)' }), ED.field(e.drops, 'chime', { type: 'number', step: .05, label: 'Chime drop chance (0-1)' })]));
    detail.appendChild(ED.field(e, 'ghost', { type: 'check', label: 'See-through', optional: true }));
    detail.appendChild(delBtn(D.enemies, sel, 'enemies'));
  });

  /* ============================== BOSSES ============================== */
  ED.register('bosses', 'Bosses', function (main) {
    var D = ED.D, sel = ED.sel.bosses; if (sel && !D.bosses[sel]) sel = ED.sel.bosses = null;
    var detail = ED.listDetail(main, {
      items: Object.keys(D.bosses).map(function (k) { var b = D.bosses[k]; return { id: k, label: b.name, sub: k + '  hp ' + b.hp, icon: function () { return ED.thumb(b.sprite, 32); } }; }),
      selected: sel, onSelect: function (id) { ED.sel.bosses = id; ED.rerender(); }
    });
    if (!sel) { detail.appendChild(h('div.big-empty', null, ['Each boss has its own fight pattern built into the game. Here you can change their name, health, sprites and hint.'])); return; }
    var b = D.bosses[sel];
    var how = { matron: 'Wrapped in thorns. The lantern burns them off for a few seconds; then anything can hurt her. Fires spreads of thorns and calls minions.', brinejaw: 'Armoured. A shield bash flips him; then he is soft. Scuttles, shoots bubbles and lunges.', cindral: 'Eyes open and close. Hit both open eyes with arrows to open the furnace, then strike. Fireballs and a slam.', heart: 'Splits into one shadow per hero (each hurt only by that hero\'s tool). Then only TEAM strikes reach the core.' }[sel];
    detail.appendChild(h('div.row', null, [detail.back(), ED.thumb(b.sprite, 64), h('h2.grow', null, [b.name])]));
    detail.appendChild(h('p.hint', null, [how || '']));
    detail.appendChild(h('div.grid3', null, [ED.field(b, 'name', { label: 'Name (health bar)' }), ED.field(b, 'hp', { type: 'number', label: 'Health' }), ED.field(b, 'damage', { type: 'number', label: 'Contact damage' })]));
    ['sprite', 'bareSprite', 'flipSprite', 'eyesSprite', 'openSprite'].forEach(function (k) { if (k in b || k === 'sprite') detail.appendChild(ED.field(b, k, { type: 'select', blank: false, label: { sprite: 'Sprite', bareSprite: 'Sprite without thorns', flipSprite: 'Flipped sprite', eyesSprite: 'Eyes-open sprite', openSprite: 'Core-open sprite' }[k], options: ED.opts.sprites })); });
    detail.appendChild(h('div.grid2', null, [ED.field(b, 'w', { type: 'number', label: 'Hit width' }), ED.field(b, 'h', { type: 'number', label: 'Hit height' })]));
    if ('speed' in b) detail.appendChild(ED.field(b, 'speed', { type: 'number', label: 'Speed' }));
    detail.appendChild(ED.field(b, 'hint', { type: 'textarea', rows: 2, label: 'Hint' }));
  });

  /* ============================== ITEMS ============================== */
  ED.register('items', 'Items', function (main) {
    var D = ED.D, sel = ED.sel.items; if (sel && !D.items[sel]) sel = ED.sel.items = null;
    var detail = ED.listDetail(main, {
      items: Object.keys(D.items).map(function (k) { var it = D.items[k]; return { id: k, label: it.name, sub: k, icon: function () { return ED.thumb(it.sprite, 28); } }; }),
      selected: sel, onSelect: function (id) { ED.sel.items = id; ED.rerender(); },
      add: function () { idPrompt('New item', D.items, function (id) { return { name: id, sprite: 'key', desc: '' }; }, 'items'); }
    });
    if (!sel) { detail.appendChild(h('div.big-empty', null, ['Items go in chests or are given in scenes with "give". key, heart_vessel, chimes and heart have built-in effects; any new item is simply kept (check it in scenes with flags).'])); return; }
    var it = D.items[sel];
    detail.appendChild(h('div.row', null, [detail.back(), ED.thumb(it.sprite, 48), h('h2.grow', null, [it.name]), h('code', null, [sel])]));
    detail.appendChild(ED.field(it, 'name', { label: 'Name' }));
    detail.appendChild(ED.field(it, 'sprite', { type: 'select', blank: false, label: 'Sprite', options: ED.opts.sprites, onChange: function () { ED.rerender(); } }));
    detail.appendChild(ED.field(it, 'desc', { type: 'textarea', rows: 2, label: 'Description' }));
    if (['key', 'heart_vessel', 'chimes', 'heart'].indexOf(sel) < 0) detail.appendChild(delBtn(D.items, sel, 'items'));
  });

  /* ============================== GAME SETTINGS ============================== */
  ED.register('game', 'Game', function (main) {
    var D = ED.D, M = D.meta, wrap = h('div.detail', { style: { height: '100%' } }); main.appendChild(wrap);
    wrap.appendChild(h('h2', null, ['Game settings']));
    wrap.appendChild(h('div.grid2', null, [ED.field(M, 'title', { label: 'Title' }), ED.field(M, 'subtitle', { label: 'Subtitle' })]));
    wrap.appendChild(h('h3', null, ['New game starts']));
    wrap.appendChild(h('div.grid2', null, [ED.field(M, 'startMap', { type: 'select', blank: false, label: 'Map', options: ED.opts.maps }), ED.field(M, 'startScene', { type: 'select', label: 'Opening scene', options: ED.opts.scenes })]));
    wrap.appendChild(h('div.grid3', null, [ED.field(M, 'startX', { type: 'number', label: 'Tile X' }), ED.field(M, 'startY', { type: 'number', label: 'Tile Y' }), ED.field(M, 'startDir', { type: 'select', blank: false, label: 'Facing', options: ED.opts.dirs })]));
    wrap.appendChild(h('div.grid2', null, [ED.field(M, 'startHearts', { type: 'number', label: 'Starting hearts' }), ED.field(M, 'maxHearts', { type: 'number', label: 'Most hearts possible' })]));
    var cr = { text: (M.credits || []).join('\n') };
    wrap.appendChild(ED.field(cr, 'text', { type: 'textarea', rows: 10, label: 'Credits (one line each)', onChange: function (v) { M.credits = String(v).split('\n'); ED.commit(); } }));
    wrap.appendChild(h('h3', null, ['Flags used in the game']));
    wrap.appendChild(h('div.flaglist', null, ED.allFlags().map(function (f) { return h('div', null, [f]); })));
  });
})();
