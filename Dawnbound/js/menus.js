/* Dawnbound - menus: title, character select, pause menu, saves, shops, world map */
(function () {
  'use strict';
  var DB = window.DB, W = DB.world, UI = DB.ui, A = DB.assets, $ = DB.$, el = DB.el;
  var M = DB.menus = {};
  var SAVEKEY = 'dawnbound.saves';
  /* ================= save system ================= */
  function readAll() { try { return JSON.parse(localStorage.getItem(SAVEKEY) || '{}'); } catch (e) { return {}; } }
  function writeAll(o) { try { localStorage.setItem(SAVEKEY, JSON.stringify(o)); return true; } catch (e) { DB.toast('Could not save (storage full?)'); return false; } }
  DB.savesList = function () {
    var all = readAll(), out = [];
    Object.keys(all).forEach(function (n) { ['manual', 'auto'].forEach(function (k) { if (all[n][k]) out.push({ name: n, kind: k, t: all[n][k].t, G: all[n][k].G }); }); });
    out.sort(function (a, b) { return b.t - a.t; }); return out;
  };
  function snapshot() {
    var G = DB.G; if (!G || !W.player) return null;
    G.x = Math.round(W.player.x); G.y = Math.round(W.player.y); G.map = W.mapId; G.dirP = W.player.dir; G.v = 1;
    return JSON.parse(JSON.stringify(G));
  }
  DB.saveAuto = function () { if (W.mode === 'title') return; var s = snapshot(); if (!s) return; var all = readAll(); all[s.name] = all[s.name] || {}; all[s.name].auto = { t: Date.now(), G: s }; writeAll(all); };
  DB.saveManual = function () { var s = snapshot(); if (!s) return false; var all = readAll(); all[s.name] = all[s.name] || {}; all[s.name].manual = { t: Date.now(), G: s }; var ok = writeAll(all); if (ok) { DB.toast('Game saved.', 'quest'); DB.audio.sfx('quest_complete'); } return ok; };
  DB.loadGame = function (G) {
    DB.G = JSON.parse(JSON.stringify(G)); var g = DB.G; g.flags = g.flags || {}; g.quests = g.quests || {}; g.opened = g.opened || {}; g.visited = g.visited || {};
    DB.combat.noMeter = false; DB.combat.boss = null; DB.combat.freeze = false; DB.combat.gameOverPending = false; DB.story.running = false; DB.story.queue.length = 0; DB.story.wave = null;
    UI.closeScreen(); $('#card').classList.add('hidden'); W.fade.a = 1; W.tint = null; W.letterbox = 0;
    return W.load(g.map, 'start').then(function () {
      if (g.x) { W.party.forEach(function (p, i) { p.x = g.x - i * 12; p.y = g.y + i * 4; W.snapToWalkable(p); p.dir = g.dirP || 'down'; }); if (W.ash) { W.ash.x = g.x + 14; W.ash.y = g.y + 6; } }
      W.cam.snap = true; W.updateCam(1); W.mode = 'field'; UI.hud(true); UI.invalidateParty(); W.doFade(0, 700); DB.input.lock(300);
      if (DB.afterLoad) DB.afterLoad();
    });
  };
  /* ================= helpers ================= */
  function win(title, onClose, wide) {
    var w = el('div', 'win'); if (wide) w.style.width = 'min(98vw,980px)';
    w.innerHTML = '<div class="wh"><span>' + DB.esc(title) + '</span><button class="btn sm close">✕ Close</button></div><div class="wb"></div>';
    w.querySelector('.close').onclick = function () { DB.audio.sfx('ui_cancel'); (onClose || M.closeAll)(); };
    return w;
  }
  function btn(txt, fn, cls) { var b = el('button', 'btn ' + (cls || '')); b.innerHTML = txt; b.onclick = function () { DB.audio.sfx('ui_confirm', { vol: .4 }); fn(b); }; return b; }
  function iconEl(id, size) { var it = DB.items[id], d = el('div', 'ic'); size = size || 40; d.setAttribute('style', DB.itemIconStyle(id, size)); if (it && !it.icon) { d.style.display = 'flex'; d.style.alignItems = 'center'; d.style.justifyContent = 'center'; d.style.fontSize = '22px'; d.textContent = DB.itemGlyph(it); } return d; }
  function heroPortrait(id, size, expr) { var d = el('div', 'ic'); d.setAttribute('style', UI.bgHero(id, expr || 'neutral', size) + 'width:' + size + 'px;height:' + size + 'px;border-radius:8px;border:1px solid #3d557c;flex:none'); return d; }
  M.closeAll = function () {
    UI.closeScreen(); UI.menuOpen = false; if (W.mode === 'menu') { W.mode = 'field'; } W.paused = false; if (W.mode === 'field') UI.hud(true); DB.input.lock(200);
    if (M._onClose) { var f = M._onClose; M._onClose = null; f(); }
  };
  /* ================= title screen ================= */
  M.title = function () {
    W.mode = 'title'; W.paused = false; UI.hud(false); $('#card').classList.add('hidden'); W.fade.a = 0; DB.audio.music('six_embers', 1);
    var wrap = el('div', 'titlewrap'); wrap.style.backgroundImage = 'url(assets/ui/class-select.webp)';
    wrap.innerHTML = '<h1 class="logo">DAWNBOUND</h1><div class="sublogo">THE SIX EMBERS</div><div class="menucol"></div><div class="dim" style="position:absolute;bottom:calc(10px + var(--sa-b));font-size:11px">v' + DB.VERSION + ' · add to Home Screen for fullscreen</div>';
    var col = wrap.querySelector('.menucol'), saves = DB.savesList();
    if (saves.length) col.appendChild(btn('Continue', function () { DB.audio.unlock(); DB.loadGame(saves[0].G); }));
    col.appendChild(btn('New Game', function () { DB.audio.unlock(); M.charSelect(); }));
    if (saves.length) col.appendChild(btn('Load Game', function () { M.loadScreen(); }));
    col.appendChild(btn('Settings', function () { M.settings(function () { M.title(); }); }));
    UI.screen(wrap, true);
  };
  /* ================= character select ================= */
  M.charSelect = function () {
    var sel = 'caelan', wrap = el('div', 'csel'); wrap.style.backgroundImage = 'url(assets/ui/class-select.webp)';
    wrap.innerHTML = '<div class="cs-top">CHOOSE YOUR EMBER</div><div class="cs-list"></div><div class="cs-detail"><div class="cs-big"></div><div class="cs-txt"></div></div><div class="cs-bot"></div>';
    var list = $('.cs-list', wrap), big = $('.cs-big', wrap), txt = $('.cs-txt', wrap), bot = $('.cs-bot', wrap), typer = null;
    DB.HERO_IDS.forEach(function (id) {
      var h = DB.heroes[id], c = el('div', 'cs-card'); c.dataset.id = id;
      c.innerHTML = '<div class="pic" style="' + UI.bgHero(id, 'neutral', 90) + 'background-size:' + (90 * 4) + 'px ' + (90 * 2) + 'px;"></div><div style="margin-top:3px">' + h.short + '</div><div class="dim" style="font-size:10px">' + h.cls + '</div>';
      c.onclick = function () { pick(id); }; list.appendChild(c);
    });
    function pick(id) {
      sel = id; var h = DB.heroes[id]; DB.audio.sfx('select');
      list.querySelectorAll('.cs-card').forEach(function (c) { c.classList.toggle('on', c.dataset.id === id); });
      var bs = Math.min(300, window.innerHeight * .46); big.setAttribute('style', UI.bgHero(id, 'determined', bs) + 'width:' + bs + 'px;height:' + bs + 'px;');
      txt.innerHTML = '<h2>' + h.name.toUpperCase() + '</h2><div class="meta">' + h.cls + ' · Hometown: ' + h.home + ' · Age ' + h.age + '</div><div class="pose">(' + DB.esc(h.pose) + ')</div><div class="qt"></div><div class="dim" style="margin-top:6px;font-size:12px">' + DB.esc(h.blurb) + '</div>';
      var q = $('.qt', txt), s = '“' + h.quote + '”', i = 0; clearInterval(typer); typer = setInterval(function () { i += 2; q.textContent = s.slice(0, i); if (i >= s.length) clearInterval(typer); }, 16);
    }
    bot.appendChild(btn('← Back', function () { clearInterval(typer); M.title(); }));
    bot.appendChild(btn('Choose this Ember', function () { clearInterval(typer); confirm(sel); }, ''));
    UI.screen(wrap, true); pick('caelan');
    function confirm(id) {
      list.querySelectorAll('.cs-card').forEach(function (c) { c.classList.toggle('dim2', c.dataset.id !== id); });
      txt.innerHTML = '<h2>' + DB.heroes[id].name.toUpperCase() + '</h2><p class="qt" style="margin-top:14px">The other Embers still burn. Your paths will cross.</p>'; bot.innerHTML = '';
      setTimeout(function () { nameEntry(id); }, 2200);
    }
    function nameEntry(id) {
      var w = el('div', 'titlewrap'); w.style.backgroundImage = 'url(assets/ui/class-select.webp)';
      w.innerHTML = '<div class="gold" style="letter-spacing:.2em;margin-bottom:10px">WHAT IS YOUR NAME?</div><input class="txt" maxlength="14" value="' + DB.heroes[id].short + '"><div class="dim" style="margin:8px 0 16px;font-size:12px">Your saves are filed under this name.</div><div class="menucol"></div>';
      var inp = $('input', w), col = $('.menucol', w);
      col.appendChild(btn('Begin the Journey', function () {
        var nm = inp.value.replace(/[^\w \-']/g, '').trim() || DB.heroes[id].short; DB.audio.unlock();
        var existing = readAll(); if (existing[nm] && !window.confirm('A save named "' + nm + '" exists. Starting a new game under this name will overwrite its saves when you save. Continue?')) return;
        DB.startNewGame(id, nm);
      }));
      col.appendChild(btn('← Back', function () { M.charSelect(); }));
      UI.screen(w, true);
    }
  };
  /* ================= load / save screens ================= */
  M.loadScreen = function (back) {
    var w = win('Load Game', function () { if (back) back(); else M.title(); }); var b = $('.wb', w), saves = DB.savesList();
    if (!saves.length) b.innerHTML = '<p class="dim">No saved games yet.</p>';
    saves.forEach(function (s) {
      var g = s.G, r = el('div', 'row'); r.appendChild(heroPortrait(g.hero, 44));
      var d = new Date(s.t); var mapn = (DB.maps[g.map] && DB.maps[g.map].name) || g.map;
      var rn = el('div', 'rn'); rn.innerHTML = '<b>' + DB.esc(g.name) + '</b> <span class="tag">' + (s.kind === 'auto' ? 'Auto' : 'Manual') + '</span><small>' + DB.esc(mapn) + ' · Lv ' + g.members[g.hero].lv + ' · ' + Math.floor(g.time / 3600) + 'h ' + Math.floor(g.time / 60) % 60 + 'm · ' + d.toLocaleString() + '</small>'; r.appendChild(rn);
      r.appendChild(btn('Load', function () { DB.audio.unlock(); DB.loadGame(g); }, 'sm'));
      r.appendChild(btn('✕', function () { if (window.confirm('Delete this save?')) { var all = readAll(); delete all[s.name][s.kind]; if (!all[s.name].auto && !all[s.name].manual) delete all[s.name]; writeAll(all); M.loadScreen(back); } }, 'sm red'));
      b.appendChild(r);
    });
    var ex = el('div', 'row'); ex.style.justifyContent = 'center'; ex.appendChild(btn('Export saves', function () { M.exportSaves(); }, 'sm')); ex.appendChild(btn('Import saves', function () { M.importSaves(); }, 'sm')); b.appendChild(ex);
    UI.screen(w, true);
  };
  M.exportSaves = function () {
    var w = win('Export Saves', function () { M.loadScreen(); }); var b = $('.wb', w);
    var data = localStorage.getItem(SAVEKEY) || '{}';
    b.innerHTML = '<p class="dim">Copy this text and keep it somewhere safe. Paste it into Import on any device to restore your saves.</p><textarea style="width:100%;height:160px;background:#0b1424;color:#cfe;border:1px solid #3d557c;border-radius:8px;-webkit-user-select:text;user-select:text" readonly></textarea>';
    $('textarea', b).value = data;
    var row = el('div', 'row'); row.appendChild(btn('Select all', function () { var t = $('textarea', b); t.focus(); t.select(); }, 'sm'));
    row.appendChild(btn('Download file', function () { var a = el('a'); a.href = URL.createObjectURL(new Blob([data], { type: 'application/json' })); a.download = 'dawnbound-saves.json'; a.click(); }, 'sm')); b.appendChild(row);
    UI.screen(w, true);
  };
  M.importSaves = function () {
    var w = win('Import Saves', function () { M.loadScreen(); }); var b = $('.wb', w);
    b.innerHTML = '<p class="dim">Paste exported save text here.</p><textarea style="width:100%;height:160px;background:#0b1424;color:#cfe;border:1px solid #3d557c;border-radius:8px;-webkit-user-select:text;user-select:text"></textarea>';
    b.appendChild(btn('Import', function () { try { var inc = JSON.parse($('textarea', b).value), all = readAll(); Object.keys(inc).forEach(function (k) { all[k] = Object.assign(all[k] || {}, inc[k]); }); writeAll(all); DB.toast('Saves imported.', 'quest'); M.loadScreen(); } catch (e) { DB.toast('That does not look like save data.'); } }));
    UI.screen(w, true);
  };
  /* ================= settings ================= */
  M.settings = function (back) {
    var w = win('Settings', back || M.closeAll), b = $('.wb', w), AU = DB.audio;
    function slider(label, key) {
      var r = el('div', 'row'); r.innerHTML = '<div class="rn">' + label + '</div>'; var s = el('input'); s.type = 'range'; s.min = 0; s.max = 100; s.value = Math.round((AU.vol[key] == null ? .7 : AU.vol[key]) * 100); s.style.flex = '1.5'; s.style.touchAction = 'pan-y';
      s.oninput = function () { AU.setVol(key, s.value / 100); if (key === 'sfx') AU.sfx('ui_confirm'); }; r.appendChild(s); b.appendChild(r);
    }
    slider('Music', 'music'); slider('Sound effects', 'sfx');
    var r2 = el('div', 'row'); r2.innerHTML = '<div class="rn">Mute all<small>Silences music and effects</small></div>'; var mb = btn(AU.muted ? 'Muted' : 'On', function () { AU.setMuted(!AU.muted); mb.innerHTML = AU.muted ? 'Muted' : 'On'; }, 'sm'); r2.appendChild(mb); b.appendChild(r2);
    var r3 = el('div', 'row'); r3.innerHTML = '<div class="rn">Zoom<small>Camera closeness</small></div>'; var zv = W.zoomMul;
    [['Wide', .85], ['Normal', 1], ['Close', 1.2]].forEach(function (z) { r3.appendChild(btn(z[0], function () { W.zoomMul = z[1]; try { localStorage.setItem('dawnbound.zoom', z[1]); } catch (e) { } W.resize(); }, 'sm')); }); b.appendChild(r3);
    var r4 = el('div', 'row'); r4.innerHTML = '<div class="rn">Controls<small>Keyboard: WASD/arrows move · J/Space act · K/Shift dash · U/I skills · L burst · Q swap · Esc menu</small></div>'; b.appendChild(r4);
    UI.screen(w, W.mode === 'title');
  };
  /* ================= pause menu ================= */
  var TABS = ['Party', 'Items', 'Equip', 'Skills', 'Quests', 'Map', 'Save', 'System'];
  M.open = function (tab) {
    if (UI.menuOpen || W.mode !== 'field' || DB.story.running) return;
    if (DB.combat.boss && DB.combat.boss.invuln) return;
    UI.menuOpen = true; W.paused = true; UI.hud(false); DB.audio.sfx('ui_confirm'); M.tab = tab || M.tab || 'Party'; M.render();
  };
  M.render = function () {
    var w = win('Menu', M.closeAll, true), body = $('.wb', w);
    var tabs = el('div', 'tabs'); TABS.forEach(function (t) { var b = el('button', 'tab' + (t === M.tab ? ' on' : '')); b.textContent = t; b.onclick = function () { M.tab = t; M.render(); }; tabs.appendChild(b); });
    w.insertBefore(tabs, body); $('.wh span', w).innerHTML = DB.esc(DB.G.name) + ' · <span class="gold">' + DB.fmt(DB.G.gold) + ' G</span> · ' + DB.esc((W.map && W.map.name) || '');
    (M['tab' + M.tab] || M.tabParty)(body); UI.screen(w);
  };
  function xpBar(id) { var m = DB.G.members[id], a = DB.xpFor(m.lv), b = DB.xpFor(m.lv + 1); return m.lv >= 99 ? 100 : Math.round(100 * (m.xp - a) / Math.max(1, b - a)); }
  M.tabParty = function (b) {
    var G = DB.G; b.innerHTML = '<div class="dim" style="font-size:12px;margin-bottom:6px">Active party (max ' + DB.MAXP + '). The first member leads. Tap a portrait in battle to swap leader.</div>';
    G.roster.forEach(function (id) {
      var h = DB.heroes[id], m = G.members[id], st = DB.stats(id), inP = G.party.indexOf(id) >= 0, r = el('div', 'row' + (G.party[0] === id ? ' sel' : ''));
      r.style.flexWrap = 'wrap'; r.appendChild(heroPortrait(id, 52, m.hp <= 0 ? 'sad' : 'neutral'));
      var rn = el('div', 'rn'); rn.style.minWidth = '150px';
      rn.innerHTML = '<b>' + DB.heroName(id) + '</b> <span class="tag">' + h.cls + '</span>' + (inP ? '<span class="tag main">Party</span>' : '') + '<small>Lv ' + m.lv + ' · HP ' + Math.ceil(m.hp) + '/' + st.hp + ' · MP ' + Math.floor(m.mp) + '/' + st.mp + ' · ' + (m.lv >= 99 ? 'MAX' : xpBar(id) + '% to next') + '</small>' +
        '<small>ATK ' + st.atk + ' · DEF ' + st.def + ' · MAG ' + st.mag + ' · SPD ' + st.spd + ' · CRIT ' + st.crit + '%</small>';
      r.appendChild(rn);
      var bc = el('div'); bc.style.display = 'flex'; bc.style.gap = '5px';
      if (!inP) bc.appendChild(btn('Add', function () { if (G.party.length >= DB.MAXP) { DB.toast('Party is full.'); return; } G.party.push(id); M.render(); }, 'sm'));
      else {
        if (G.party[0] !== id) bc.appendChild(btn('Lead', function () { G.party = [id].concat(G.party.filter(function (x) { return x !== id; })); M.render(); }, 'sm'));
        if (id !== G.hero && G.party.length > 1) bc.appendChild(btn('Remove', function () { G.party = G.party.filter(function (x) { return x !== id; }); M.render(); }, 'sm red'));
      }
      r.appendChild(bc); b.appendChild(r);
    });
    var af = el('div', 'dim'); af.style.fontSize = '12px'; af.style.marginTop = '8px'; var parts = []; G.roster.forEach(function (id) { if (id !== G.hero && G.affinity[id]) parts.push(DB.heroes[id].short + ' bond ' + G.affinity[id]); }); af.textContent = parts.length ? 'Bonds: ' + parts.join(' · ') : ''; b.appendChild(af);
    b.appendChild(el('div', 'dim', '<div style="margin-top:8px;font-size:12px">Play time ' + Math.floor(G.time / 3600) + 'h ' + Math.floor(G.time / 60) % 60 + 'm · Foes defeated ' + (G.kills || 0) + '</div>'));
  };
  var targetPick = null;
  M.tabItems = function (b) {
    var G = DB.G; b.innerHTML = ''; var any = false;
    ['cons', 'key'].forEach(function (type) {
      var head = el('div', 'gold'); head.style.margin = '6px 0 4px'; head.textContent = type === 'cons' ? 'Consumables' : 'Key items'; b.appendChild(head);
      var n = 0;
      Object.keys(G.inv).forEach(function (id) {
        var it = DB.items[id]; if (!it || it.type !== type || !G.inv[id]) return; n++; any = true;
        var r = el('div', 'row'); r.appendChild(iconEl(id)); var rn = el('div', 'rn'); rn.innerHTML = DB.esc(it.name) + '<small>' + DB.esc(it.desc || '') + '</small>'; r.appendChild(rn); r.appendChild(el('div', 'rr', '×' + G.inv[id]));
        if (type === 'cons') r.appendChild(btn('Use', function () { pickTarget(id); }, 'sm'));
        b.appendChild(r);
      });
      if (!n) b.appendChild(el('div', 'dim', '<small>None</small>'));
    });
    var tp = el('div'); tp.id = 'tgt'; b.appendChild(tp);
  };
  function pickTarget(itemId) {
    var G = DB.G, tp = $('#tgt'); tp.innerHTML = ''; var box = el('div', 'row'); box.style.flexWrap = 'wrap'; box.style.position = 'sticky'; box.style.bottom = '0'; box.innerHTML = '<div class="rn">Use ' + DB.esc(DB.itemName(itemId)) + ' on…</div>';
    G.roster.forEach(function (id) { box.appendChild(btn(DB.heroName(id) + ' (' + Math.ceil(G.members[id].hp) + ')', function () { if (!DB.useItem(itemId, id)) DB.toast('No effect.'); M.render(); }, 'sm')); });
    tp.appendChild(box); box.scrollIntoView({ block: 'end' });
  }
  var eqHero = null, eqSlot = null;
  M.tabEquip = function (b) {
    var G = DB.G; eqHero = eqHero && G.members[eqHero] ? eqHero : G.party[0]; b.innerHTML = '';
    var hr = el('div', 'row'); G.roster.forEach(function (id) { var x = btn(DB.heroName(id), function () { eqHero = id; eqSlot = null; M.render(); }, 'sm' + (id === eqHero ? '' : '')); if (id === eqHero) x.style.borderColor = '#fff3c4'; hr.appendChild(x); }); b.appendChild(hr);
    var m = G.members[eqHero], st = DB.stats(eqHero);
    var sm = el('div', 'dim'); sm.style.fontSize = '12px'; sm.style.margin = '4px 0'; sm.textContent = 'HP ' + st.hp + ' · MP ' + st.mp + ' · ATK ' + st.atk + ' · DEF ' + st.def + ' · MAG ' + st.mag + ' · SPD ' + st.spd + ' · CRIT ' + st.crit; b.appendChild(sm);
    [['weapon', 'Weapon'], ['armor', 'Armor'], ['acc', 'Accessory']].forEach(function (sl) {
      var cur = m.eq[sl[0]], it = cur && DB.items[cur], r = el('div', 'row' + (eqSlot === sl[0] ? ' sel' : ''));
      if (cur) r.appendChild(iconEl(cur)); var rn = el('div', 'rn'); rn.innerHTML = '<span class="dim">' + sl[1] + ':</span> ' + (it ? DB.esc(it.name) : '<span class="dim">— empty —</span>') + '<small>' + (it && it.stats ? DB.statLine(it.stats) : '') + '</small>'; r.appendChild(rn);
      r.appendChild(btn('Change', function () { eqSlot = eqSlot === sl[0] ? null : sl[0]; M.render(); }, 'sm')); if (cur && !(it && it.base)) r.appendChild(btn('Remove', function () { DB.unequip(eqHero, sl[0]); M.render(); }, 'sm red')); b.appendChild(r);
    });
    if (eqSlot) {
      var head = el('div', 'gold'); head.style.margin = '8px 0 4px'; head.textContent = 'Available'; b.appendChild(head); var n = 0;
      Object.keys(G.inv).forEach(function (id) {
        var it = DB.items[id]; if (!it || (it.type !== (eqSlot === 'acc' ? 'acc' : eqSlot)) || !G.inv[id]) return; if (it.hero && it.hero !== eqHero) return; n++;
        var r = el('div', 'row'); r.appendChild(iconEl(id)); var rn = el('div', 'rn'); rn.innerHTML = DB.esc(it.name) + '<small>' + DB.statLine(it.stats || {}) + '</small>'; r.appendChild(rn); r.appendChild(el('div', 'rr', '×' + G.inv[id]));
        r.appendChild(btn('Equip', function () { DB.equip(eqHero, id); DB.audio.sfx('select'); M.render(); }, 'sm')); b.appendChild(r);
      });
      if (!n) b.appendChild(el('div', 'dim', '<small>Nothing suitable in your pack.</small>'));
    }
  };
  M.tabSkills = function (b) {
    var G = DB.G; eqHero = eqHero && G.members[eqHero] ? eqHero : G.party[0]; b.innerHTML = '';
    var hr = el('div', 'row'); G.roster.forEach(function (id) { var x = btn(DB.heroName(id), function () { eqHero = id; M.render(); }, 'sm'); if (id === eqHero) x.style.borderColor = '#fff3c4'; hr.appendChild(x); }); b.appendChild(hr);
    var sk = DB.skills[eqHero], m = G.members[eqHero];
    [['basic', 'Attack (A)'], ['s1', 'Skill 1'], ['s2', 'Skill 2'], ['ult', 'Ultimate']].forEach(function (k) {
      var s = sk[k[0]], r = el('div', 'row'), locked = k[0] === 'ult' && !m.ult, rn = el('div', 'rn');
      rn.innerHTML = '<span class="dim">' + k[1] + ':</span> <b>' + DB.esc(s.name) + '</b>' + (s.mp ? ' <span class="tag">' + s.mp + ' MP</span>' : '') + (s.cd ? ' <span class="tag">' + s.cd + 's</span>' : '') + (locked ? '<span class="tag">Locked</span>' : '') + '<small>' + DB.esc(locked ? 'Awakens in Act IV, when this hero’s arc is resolved. Until then, the Dawnmark Burst is yours.' : s.desc || '') + '</small>'; r.appendChild(rn); b.appendChild(r);
    });
    b.appendChild(el('div', 'dim', '<div style="font-size:12px;margin-top:6px"><b class="gold">Dawnmark Burst</b>: fills as you fight. When the gauge is full, press ✦ to unleash a golden shockwave (or your ultimate once awakened).</div>'));
  };
  M.tabQuests = function (b) {
    var G = DB.G; b.innerHTML = ''; var groups = [['main', 'Main Story'], ['side', 'Side Quests'], ['pq', 'Companion Quests']];
    groups.forEach(function (gp) {
      var ids = Object.keys(DB.questDefs).filter(function (k) { return DB.questDefs[k].type === gp[0] && G.quests[k]; });
      if (!ids.length) return; var h = el('div', 'gold'); h.style.margin = '8px 0 4px'; h.textContent = gp[1]; b.appendChild(h);
      ids.sort(function (a, c) { return (G.quests[a] === 'done') - (G.quests[c] === 'done') || DB.questDefs[a].lv - DB.questDefs[c].lv; });
      ids.forEach(function (k) {
        var d = DB.questDefs[k], done = G.quests[k] === 'done', r = el('div', 'row'); var rn = el('div', 'rn'); rn.style.opacity = done ? .55 : 1;
        rn.innerHTML = DB.esc(d.name) + ' <span class="tag ' + gp[0] + '">Lv ' + d.lv + '</span>' + (done ? '<span class="tag">Done</span>' : '') + '<small>' + DB.esc(done ? (d.summary || 'Completed.') : (typeof d.obj === 'function' ? d.obj(G) : d.obj || '')) + '</small>'; r.appendChild(rn);
        if (!done) r.appendChild(btn(G.track === k ? '★' : '☆', function () { G.track = k; M.render(); }, 'sm')); b.appendChild(r);
      });
    });
    if (!b.children.length) b.innerHTML = '<p class="dim">No quests yet.</p>';
  };
  M.tabMap = function (b) {
    b.innerHTML = ''; var cur = el('div', 'dim'); cur.style.fontSize = '12px'; cur.textContent = 'You are in ' + ((W.map && W.map.name) || '?') + '.'; b.appendChild(cur);
    if (W.map && W.map.noSail) { b.appendChild(el('div', 'dim', '<p>The ship cannot be reached from here.</p>')); return; }
    if (!DB.G.flags.ship) { b.appendChild(el('div', 'dim', '<p>The Wandering Gull is not yet at your disposal. Finish the business at Port Halcyon first.</p>')); return; }
    M.destList(b, function () { });
  };
  DB.DEST = [
    { id: 'halcyon', name: 'Port Halcyon', sub: 'Brightwater Isle', map: 'port_halcyon', spawn: 'dock', ok: function () { return true; } },
    { id: 'greythorn', name: 'Greythorn', sub: 'The Silent Forest', map: 'greythorn_wilds', spawn: 'shore', ok: function (G) { return (G.flags.mq || 0) >= 7; } },
    { id: 'saltmire', name: 'Saltmire', sub: 'City of Lanterns', map: 'saltmire', spawn: 'start', ok: function (G) { return (G.flags.mq || 0) >= 9; } },
    { id: 'frostmark', name: 'Frostmark', sub: 'Clan hold of the north', map: 'frostmark', spawn: 'start', ok: function (G) { return (G.flags.mq || 0) >= 12; } },
    { id: 'lumeria', name: 'Lumeria (Skyroot Ascent)', sub: 'The floating city', map: 'skyroot_ascent', spawn: 'start', ok: function (G) { return (G.flags.mq || 0) >= 15; } },
    { id: 'mistvale', name: 'Mistvale', sub: 'Valley of the Gentle Flame', map: 'mistvale', spawn: 'start', ok: function (G) { return (G.flags.mq || 0) >= 11; } },
    { id: 'highcrest', name: 'Highcrest', sub: 'The royal capital', map: function (G) { return (G.flags.mq || 0) >= 21 ? 'highcrest_countryside' : 'highcrest'; }, spawn: 'start', ok: function (G) { return (G.flags.mq || 0) >= 18; } },
    { id: 'wastes', name: 'The Hollow Wastes', sub: 'Beneath the eclipse', map: 'hollow_wastes', spawn: 'start', ok: function (G) { return (G.flags.mq || 0) >= 24; } },
    { id: 'trench', name: 'The Abyssal Trench', sub: 'Optional · Lv 50', map: 'abyssal_trench', spawn: 'start', ok: function (G) { return (G.flags.mq || 0) >= 23; } }
  ];
  M.destList = function (b, after) {
    var G = DB.G;
    DB.DEST.forEach(function (d) {
      if (!d.ok(G)) return; var dmap = typeof d.map === 'function' ? d.map(G) : d.map; var here = W.mapId === dmap;
      var r = el('div', 'row'); var rn = el('div', 'rn'); rn.innerHTML = '⚓ ' + DB.esc(d.name) + '<small>' + DB.esc(d.sub) + '</small>'; r.appendChild(rn);
      r.appendChild(btn('Sail', function () {
        if (DB.story.lockSail && DB.story.lockSail(G)) { DB.toast(DB.story.lockSail(G)); return; }
        M.closeAll(); var go = dmap; DB.go(go, d.spawn); after();
      }, 'sm' + (here ? ' dis' : ''))); b.appendChild(r);
    });
  };
  M.worldMap = function () {
    return new Promise(function (res) {
      var w = win('The Wandering Gull — Where to?', function () { M.closeAll(); res(); }), b = $('.wb', w);
      b.style.backgroundImage = 'linear-gradient(#0e1a2ecc,#0e1a2ee8),url(assets/maps/eldmere-world.webp)'; b.style.backgroundSize = 'cover'; M.destList(b, res); UI.screen(w); UI.menuOpen = true;
    });
  };
  M.tabSave = function (b) {
    b.innerHTML = '<p class="dim">The game also saves automatically whenever you travel. Manual saves are kept under the name <b class="gold">' + DB.esc(DB.G.name) + '</b>.</p>';
    b.appendChild(btn('Save now', function () { DB.saveManual(); M.render(); }));
    var s = DB.savesList().filter(function (x) { return x.name === DB.G.name; }); s.forEach(function (x) { b.appendChild(el('div', 'row', '<div class="rn" style="margin-top:6px">' + x.kind + ' save<small>' + new Date(x.t).toLocaleString() + '</small></div>')); });
  };
  M.tabSystem = function (b) {
    b.innerHTML = ''; var r = el('div', 'row'); r.style.flexWrap = 'wrap'; r.appendChild(btn('Settings', function () { M.settings(M.render); })); r.appendChild(btn('Load Game', function () { M.loadScreen(M.render); }));
    r.appendChild(btn('Return to Title', function () { if (window.confirm('Return to the title screen? Unsaved progress will be lost.')) { UI.menuOpen = false; W.paused = false; M.title(); } }, 'red')); b.appendChild(r);
  };
  /* ================= shop ================= */
  M.shop = function (kind, title, actOverride) {
    var G = DB.G, act = actOverride != null ? actOverride : DB.currentAct(), mode = 'buy';
    UI.menuOpen = true; W.paused = true; UI.hud(false);
    function render() {
      var w = win(title || 'Shop', M.closeAll), b = $('.wb', w); $('.wh span', w).innerHTML = DB.esc(title || 'Shop') + ' · <span class="gold">' + DB.fmt(G.gold) + ' G</span>';
      var tabs = el('div', 'tabs'); ['buy', 'sell'].forEach(function (t) { var x = el('button', 'tab' + (t === mode ? ' on' : '')); x.textContent = t === 'buy' ? 'Buy' : 'Sell'; x.onclick = function () { mode = t; render(); }; tabs.appendChild(x); }); w.insertBefore(tabs, $('.wb', w));
      if (mode === 'buy') {
        var stock = DB.shopStock(kind, act).filter(function (id) { var it = DB.items[id]; return it && (!it.hero || G.roster.indexOf(it.hero) >= 0); });
        stock.forEach(function (id) {
          var it = DB.items[id], r = el('div', 'row'); r.appendChild(iconEl(id)); var rn = el('div', 'rn');
          rn.innerHTML = DB.esc(it.name) + (it.hero ? ' <span class="tag">' + DB.heroes[it.hero].short + '</span>' : '') + (G.inv[id] ? ' <span class="tag">own ' + G.inv[id] + '</span>' : '') + '<small>' + DB.esc(it.stats ? DB.statLine(it.stats) : it.desc || '') + '</small>'; r.appendChild(rn);
          r.appendChild(el('div', 'rr', it.price + ' G')); var bb = btn('Buy', function () { if (G.gold < it.price) { DB.toast('Not enough gold.'); return; } G.gold -= it.price; DB.addItem(id, 1); DB.audio.sfx('coin_pickup'); render(); }, 'sm' + (G.gold < it.price ? ' dis' : '')); r.appendChild(bb); b.appendChild(r);
        });
      } else {
        var n = 0; Object.keys(G.inv).forEach(function (id) {
          var it = DB.items[id]; if (!it || it.type === 'key' || !G.inv[id]) return; n++; var val = Math.floor((it.price || 20) * .4) || 5, r = el('div', 'row'); r.appendChild(iconEl(id)); var rn = el('div', 'rn'); rn.innerHTML = DB.esc(it.name) + '<small>×' + G.inv[id] + '</small>'; r.appendChild(rn); r.appendChild(el('div', 'rr', val + ' G'));
          r.appendChild(btn('Sell', function () { G.gold += val; DB.addItem(id, -1); DB.audio.sfx('coin_pickup'); render(); }, 'sm')); b.appendChild(r);
        });
        if (!n) b.innerHTML = '<p class="dim">Nothing to sell.</p>';
      }
      UI.screen(w);
    }
    render();
  };
  /* ================= inn ================= */
  M.inn = function (cost) {
    var G = DB.G; return DB.story.runFn(function (S) {
      return S.choice('Rest at the inn? (' + cost + ' G)', ['Rest and save', 'Not now']).then(function (i) {
        if (i !== 0) return;
        if (G.gold < cost) return S.say(null, 'You cannot afford a room tonight.');
        G.gold -= cost; return S.fade(1, 700).then(function () { DB.healAll(); G.lastInn = W.mapId; DB.audio.sfx('heal_cast'); return S.wait(900); }).then(function () { DB.saveManual(); return S.fade(0, 900); }).then(function () { return S.toast('Rested. HP and MP restored.', 'quest'); });
      });
    });
  };
  DB.currentAct = function () { var mq = (DB.G.flags.mq || 0); return mq <= 6 ? 1 : mq <= 11 ? 2 : mq <= 17 ? 3 : mq <= 22 ? 4 : 5; };
  /* ================= keyboard menu hook ================= */
  DB.input.listen(function (n) {
    if (n !== 'menu') return;
    if (UI.menuOpen) { if (W.mode === 'field' || W.paused) M.closeAll(); return; }
    if (W.mode === 'field') M.open();
  });
  document.addEventListener('DOMContentLoaded', function () { });
})();
