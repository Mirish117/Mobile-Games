/* Dawnbound - heroes, game state, leveling, equipment */
(function () {
  'use strict';
  var DB = window.DB;
  var H = DB.heroes = {
    caelan: { id: 'caelan', name: 'Caelan Ashford', short: 'Caelan', cls: 'Knight', home: 'Highcrest', age: 24, color: '#6f93e6', hp: 120, hpg: 19.5, mp: 30, mpg: 3, atk: 14, atkg: 2.2, def: 12, defg: 2.1, mag: 6, magg: .8, spd: 92, crit: 4, wstat: 'atk', pron: 'he',
      blurb: 'Sword and shield. Guard, counter, taunt. High defense.', quote: "Sworn to the Silver Oath. Sworn to the crown. Sworn to protect those who cannot protect themselves... So why does this mark on my hand feel like the first promise I ever truly chose? Let me carry it. I won't break.", pose: 'Kneels, sword planted in the ground, then rises.',
      ult: 'Oathkeeper', burstFx: 'dawnmark_burst', wep: 'caelan_w1', arm: 'caelan_a1', rangeAtk: false },
    liora: { id: 'liora', name: 'Liora Wyn', short: 'Liora', cls: 'Healer', home: 'Mistvale', age: 21, color: '#7fd4a0', hp: 92, hpg: 14.5, mp: 60, mpg: 5.5, atk: 7, atkg: 1, def: 7, defg: 1.25, mag: 15, magg: 2.5, spd: 96, crit: 3, wstat: 'mag', pron: 'she',
      blurb: 'Staff and light magic. Heals, barriers, holy bursts.', quote: "Every wound I mend, I think of the ones I couldn't. Maybe this light is a second chance. Take my hand — I'll keep you standing, no matter how dark it gets.", pose: 'Holds her glowing palm to her heart, smiles softly.',
      ult: 'Gentle Dawn', wep: 'liora_w1', arm: 'liora_a1', rangeAtk: true },
    vex: { id: 'vex', name: 'Vex Marlowe', short: 'Vex', cls: 'Rogue', home: 'Saltmire', age: 26, color: '#c4566a', hp: 96, hpg: 15, mp: 36, mpg: 3, atk: 15, atkg: 2.35, def: 8, defg: 1.35, mag: 6, magg: .7, spd: 114, crit: 14, wstat: 'atk', pron: 'they',
      blurb: 'Twin daggers. Speed, stealth, critical hits, stealing items from enemies.', quote: "Destiny, prophecy, glowing hand — very dramatic. Somebody clearly mistook me for a hero. But hey... if the world's about to end, I'd rather be the one robbing the Dark Lord blind. You in?", pose: 'Flips a coin, catches it, grins.',
      ult: 'Last Gambit', wep: 'vex_w1', arm: 'vex_a1', rangeAtk: false },
    rowan: { id: 'rowan', name: 'Rowan Thistlewood', short: 'Rowan', cls: 'Hunter', home: 'Greythorn', age: 19, color: '#6bb36a', hp: 100, hpg: 16, mp: 40, mpg: 3.6, atk: 14, atkg: 2.15, def: 9, defg: 1.5, mag: 8, magg: 1, spd: 102, crit: 8, wstat: 'atk', pron: 'they',
      blurb: 'Bow, traps, and a wolf companion named Ash.', quote: "The forest went silent the night this mark appeared. Even the birds stopped singing. ...I'm not good with words. But I'm good at following tracks. And these ones lead somewhere.", pose: 'Kneels beside Ash the wolf, who howls at the sky.',
      ult: 'Spirit of Greythorn', wep: 'rowan_w1', arm: 'rowan_a1', rangeAtk: true },
    brakka: { id: 'brakka', name: 'Brakka Stormhewn', short: 'Brakka', cls: 'Berserker', home: 'Frostmark', age: 31, color: '#e0793a', hp: 150, hpg: 23.5, mp: 20, mpg: 2, atk: 18, atkg: 2.85, def: 10, defg: 1.65, mag: 3, magg: .4, spd: 88, crit: 5, wstat: 'atk', pron: 'he',
      blurb: 'Two-handed axe. Rage meter, huge damage, lowers own defense.', quote: "HA! A glowing hand! My ancestors are either blessing me or laughing at me! Either way, there's a fight coming, and I've never once missed a good fight. Point me at the darkness, friend!", pose: 'Slams his axe onto his shoulder, laughs like thunder.',
      ult: 'Heart of the Storm', wep: 'brakka_w1', arm: 'brakka_a1', rangeAtk: false },
    seraphine: { id: 'seraphine', name: 'Seraphine Vael', short: 'Seraphine', cls: 'Mage', home: 'Lumeria', age: 22, color: '#a77bff', hp: 80, hpg: 12.5, mp: 80, mpg: 6.6, atk: 6, atkg: .9, def: 6, defg: 1.05, mag: 18, magg: 2.85, spd: 94, crit: 6, wstat: 'mag', pron: 'she',
      blurb: 'Elemental magic — fire, ice, lightning. Long cast times, devastating spells.', quote: "They called my research heresy. They threw me out of the Spire. And now the very thing I warned them about is waking up. I don't need them to believe me. I only need to be right — and I am.", pose: 'Sparks of fire and frost circle her fingers.',
      ult: 'Starfall Equation', wep: 'seraphine_w1', arm: 'seraphine_a1', rangeAtk: true }
  };
  DB.HERO_IDS = ['caelan', 'liora', 'vex', 'rowan', 'brakka', 'seraphine'];
  DB.CLASS_KEY = { Knight: 'caelan', Healer: 'liora', Rogue: 'vex', Hunter: 'rowan', Berserker: 'brakka', Mage: 'seraphine', knight: 'caelan', healer: 'liora', rogue: 'vex', hunter: 'rowan', berserker: 'brakka', mage: 'seraphine' };
  /* ---------------- XP curve ---------------- */
  var XP_ANCHORS = [[1, 0], [3, 300], [6, 1700], [9, 3300], [12, 5200], [16, 8000], [22, 12200], [26, 15600], [32, 22000], [35, 26200], [40, 31500], [45, 38500], [50, 46500], [55, 56000], [60, 68000], [99, 168000]];
  DB.xpFor = function (lv) { if (lv <= 1) return 0; for (var i = 1; i < XP_ANCHORS.length; i++) { var a = XP_ANCHORS[i - 1], b = XP_ANCHORS[i]; if (lv <= b[0]) return Math.round(a[1] + (b[1] - a[1]) * (lv - a[0]) / (b[0] - a[0])); } return 168000; };
  DB.levelFor = function (xp) { var lv = 1; while (lv < 99 && xp >= DB.xpFor(lv + 1)) lv++; return lv; };
  DB.LEVEL_CAP = 99; DB.MAXP = 4;
  /* ---------------- game state ---------------- */
  DB.newState = function (heroId, name) {
    var G = { v: 1, name: name, hero: heroId, heroName: H[heroId].name, party: [heroId], roster: [heroId], members: {}, gold: 120, inv: {}, flags: {}, quests: {}, map: 'wandering_gull_deck', x: 0, y: 0, time: 0, act: 0, noCount: 0, affinity: {}, hasAsh: heroId === 'rowan', saved: 0, opened: {}, killed: {}, kills: 0, lastInn: null, visited: {}, stamps: 0 };
    DB.G = G;
    DB.addMember(heroId, 1);
    if (heroId === 'rowan') G.hasAsh = true;
    return G;
  };
  DB.addMember = function (id, lv) {
    var G = DB.G, h = H[id];
    G.members[id] = { lv: lv || 1, xp: DB.xpFor(lv || 1), eq: { weapon: h.wep, armor: h.arm, acc: null }, hp: 1, mp: 1, ult: false };
    G.members[id].hp = DB.stats(id).hp; G.members[id].mp = DB.stats(id).mp;
    if (G.roster.indexOf(id) < 0) G.roster.push(id);
  };
  DB.mem = function (id) { return DB.G.members[id]; };
  DB.party = function () { return DB.G ? DB.G.party : []; };
  DB.stats = function (id) {
    var m = DB.G.members[id], h = H[id], L = m.lv, s = { hp: h.hp + h.hpg * (L - 1), mp: h.mp + h.mpg * (L - 1), atk: h.atk + h.atkg * (L - 1), def: h.def + h.defg * (L - 1), mag: h.mag + h.magg * (L - 1), spd: h.spd, crit: h.crit };
    ['weapon', 'armor', 'acc'].forEach(function (sl) { var it = DB.items[m.eq[sl]]; if (it && it.stats) for (var k in it.stats) s[k] = (s[k] || 0) + it.stats[k]; });
    if (m.buff) { if (m.buff.atkMul) { s.atk *= m.buff.atkMul; s.mag *= m.buff.atkMul; } if (m.buff.defMul) s.def *= m.buff.defMul; if (m.buff.spdMul) s.spd *= m.buff.spdMul; }
    for (var k in s) s[k] = Math.round(s[k]);
    return s;
  };
  DB.statsBase = function (id) { var b = DB.G.members[id].buff; DB.G.members[id].buff = null; var s = DB.stats(id); DB.G.members[id].buff = b; return s; };
  DB.heroForm = function (id) { var m = DB.G.members[id]; if (m.ult) return 'ultimate'; return m.lv >= 22 ? 'advanced' : 'starter'; };
  DB.heroSprite = function (id) { return id + '_' + DB.heroForm(id); };
  DB.heroName = function (id) { if (id === DB.G.hero && DB.G.heroName) return DB.G.heroName.split(' ')[0]; return H[id].short; };
  DB.gainXp = function (amount, silent) {
    var G = DB.G, gained = [];
    G.party.forEach(function (id) {
      var m = G.members[id]; m.xp += amount; var lv = DB.levelFor(m.xp);
      if (lv > m.lv) { var old = m.lv; m.lv = lv; var st = DB.stats(id); m.hp = Math.min(st.hp, m.hp + st.hp * .3); gained.push({ id: id, from: old, to: lv }); }
    });
    /* reserve members who aren't in the party gain half XP */
    G.roster.forEach(function (id) { if (G.party.indexOf(id) < 0) { var m = G.members[id]; m.xp += Math.round(amount * .6); var lv = DB.levelFor(m.xp); if (lv > m.lv) { m.lv = lv; m.hp = DB.stats(id).hp; } } });
    if (gained.length && !silent) { DB.audio.sfx('levelup'); gained.forEach(function (g) { DB.toast(H[g.id].short + ' reached level ' + g.to + '!'); }); DB.emit('levelup', gained); }
    return gained;
  };
  DB.levelAverage = function () { var G = DB.G; var s = 0; G.party.forEach(function (id) { s += G.members[id].lv; }); return s / Math.max(1, G.party.length); };
  /* ---------------- inventory ---------------- */
  DB.addItem = function (id, n) { var G = DB.G; n = n == null ? 1 : n; G.inv[id] = (G.inv[id] || 0) + n; if (G.inv[id] <= 0) delete G.inv[id]; };
  DB.has = function (id, n) { return (DB.G.inv[id] || 0) >= (n || 1); };
  DB.itemName = function (id) { var it = DB.items[id]; return it ? it.name : id; };
  DB.equip = function (heroId, id) {
    var G = DB.G, m = G.members[heroId], it = DB.items[id]; if (!it) return false;
    var slot = it.type === 'weapon' ? 'weapon' : it.type === 'armor' ? 'armor' : it.type === 'acc' ? 'acc' : null; if (!slot) return false;
    if (it.hero && it.hero !== heroId) return false;
    var old = m.eq[slot]; if (old === id) return false;
    if (G.inv[id] > 0 || true) { if (!(G.inv[id] > 0)) return false; DB.addItem(id, -1); }
    if (old && DB.items[old] && !DB.items[old].base) DB.addItem(old, 1);
    m.eq[slot] = id; var st = DB.stats(heroId); m.hp = Math.min(m.hp, st.hp); m.mp = Math.min(m.mp, st.mp); return true;
  };
  DB.unequip = function (heroId, slot) { var m = DB.G.members[heroId]; var old = m.eq[slot]; if (!old) return; DB.addItem(old, 1); m.eq[slot] = null; var st = DB.stats(heroId); m.hp = Math.min(m.hp, st.hp); };
  DB.useItem = function (id, heroId) {
    var it = DB.items[id], G = DB.G, m = G.members[heroId]; if (!it || it.type !== 'cons' || !DB.has(id)) return false;
    var st = DB.stats(heroId), used = false;
    if (it.revive) { if (m.hp <= 0) { m.hp = Math.max(1, Math.round(st.hp * it.revive)); used = true; } }
    else if (m.hp > 0) {
      if (it.heal && m.hp < st.hp) { m.hp = Math.min(st.hp, m.hp + it.heal); used = true; }
      if (it.healPct && m.hp < st.hp) { m.hp = Math.min(st.hp, m.hp + st.hp * it.healPct); used = true; }
      if (it.mp && m.mp < st.mp) { m.mp = Math.min(st.mp, m.mp + it.mp); used = true; }
    }
    if (used) { DB.addItem(id, -1); DB.audio.sfx('heal_cast'); DB.emit('usedItem', id, heroId); }
    return used;
  };
  /* ---------------- party helpers ---------------- */
  DB.join = function (id, o) {
    var G = DB.G; o = o || {};
    if (!G.members[id]) DB.addMember(id, Math.max(1, Math.round(DB.levelAverage()) - (o.lvOffset || 0)));
    else if (G.roster.indexOf(id) < 0) G.roster.push(id);
    if (G.party.indexOf(id) < 0 && (G.party.length < DB.MAXP || o.force)) G.party.push(id);
    if (o.guest) G.flags['guest_' + id] = true;
  };
  DB.leave = function (id) { var G = DB.G; G.party = G.party.filter(function (x) { return x !== id; }); };
  DB.isHero = function (id) { return DB.G.hero === id; };
  DB.heroKey = function (id) { return DB.CLASS_KEY[id] || id; };
  DB.healAll = function (full) { var G = DB.G; G.roster.forEach(function (id) { var st = DB.stats(id); G.members[id].hp = st.hp; G.members[id].mp = st.mp; }); };
  DB.addAffinity = function (id, n) { var G = DB.G; G.affinity[id] = (G.affinity[id] || 0) + n; };
})();
