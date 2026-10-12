/* Dawnbound - maps: Act IV (Highcrest) and Act V (Hollow Wastes, Citadel) + post-game */
(function () {
  'use strict';
  var DB = window.DB, D = DB.defMap, E = DB.E;
  var mq = function (G) { return G.flags.mq || 0; };

  D('highcrest', { name: 'Highcrest', region: 'highcrest', music: 'highcrest',
    spawns: { start: [770, 950, 'up'], gate: [770, 800, 'up'], plaza: [770, 540, 'down'], castle: [770, 180, 'down'] },
    portals: [
      { x: 700, y: 1000, w: 160, h: 24, scene: 'highcrest_shore', label: 'Shore (sail away)' },
    ],
    triggers: [
      { id: 'q18', x: 690, y: 600, w: 170, h: 40, cond: function (G) { return mq(G) === 18 && !G.flags.q18_met; }, scene: 'q18_arrive' },
      { id: 'q18b', x: 690, y: 240, w: 170, h: 40, cond: function (G) { return mq(G) === 18 && G.flags.q18_met && !G.flags.q18_balcony; }, scene: 'q18_balcony' }
    ],
    npcs: [
      { id: 'ilsabet', sprite: 'ilsabet', name: 'Queen Ilsabet', x: 770, y: 175, dir: 'down', wander: 0, talk: 'ilsabet_talk', cond: function (G) { return mq(G) >= 18; } },
      { id: 'varric_n', sprite: 'varric', name: 'Lord Varric', x: 650, y: 330, dir: 'right', wander: 0, talk: 'varric_talk', speaker: 'varric', cond: function (G) { return mq(G) >= 18; } },
      { id: 'hc_squire', sprite: 'squire', name: 'Frightened Squire', x: 255, y: 330, dir: 'down', wander: 10, talk: 'squire_talk', speaker: 'squire', q: function (G) { return !G.quests.sq16 && mq(G) >= 18; } },
      { id: 'hc_smith', sprite: 'guard', name: 'Royal Armorer', x: 470, y: 520, dir: 'down', wander: 0, shop: 'smith' },
      { id: 'hc_merchant', sprite: 'scholar', name: 'Highcrest Grocer', x: 1050, y: 540, dir: 'down', wander: 0, shop: 'general' },
      { id: 'hc_inn', sprite: 'bram', name: 'Innkeeper of the Silver Stag', x: 1215, y: 560, dir: 'left', wander: 0, talk: 'highcrest_inn_talk', speaker: 'bram' },
      { id: 'hc_guard1', sprite: 'guard', name: 'Royal Guard', x: 720, y: 760, dir: 'down', wander: 0, lines: ['Halt— oh. Heroes. Welcome to Highcrest. Mind the recruits; they swing wild.'] },
      { id: 'hc_guard2', sprite: 'guard', name: 'Royal Guard', x: 840, y: 760, dir: 'down', wander: 0, lines: ['The Queen hasn\'t slept in three days. Neither have we.'] },
      { id: 'hc_kid', sprite: 'orphan', name: 'Highcrest Kid', x: 590, y: 640, dir: 'down', wander: 40, lines: ['Sir Caelan taught me to hold a wooden sword. I hold it *wrong*, but I hold it!', 'Everybody says the Hollow King is coming. I think everybody\'s scared.'] },
      { id: 'hc_noble', sprite: 'refugee', name: 'Courtier', x: 960, y: 430, dir: 'left', wander: 20, lines: ['Heroes? Marked ones? In *my* city? Where was the Order when I needed...a nap?'] }
    ] });

  D('highcrest_siege', { name: 'Highcrest — The Walls', region: 'highcrest', music: 'siege', noSail: true, autosave: false,
    spawns: { start: [770, 960, 'up'], gate: [770, 960, 'up'] },
    portals: [{ x: 700, y: 1000, w: 160, h: 24, to: 'highcrest_countryside', spawn: 'gate', label: 'Out to the countryside', cond: function (G) { return mq(G) >= 21; } }],
    triggers: [
      { id: 'q19', x: 690, y: 780, w: 170, h: 50, cond: function (G) { return mq(G) === 19 && !G.flags.q19_started; }, scene: 'q19_attack' },
      { id: 'q20', x: 690, y: 190, w: 170, h: 50, cond: function (G) { return mq(G) === 20 && !G.flags.q20_started; }, scene: 'q20_eclipse' }
    ],
    npcs: [
      { id: 'brakka_s', sprite: 'brakka_starter', name: 'Brakka', x: 770, y: 560, dir: 'down', wander: 0, talk: 'reunion_brakka', cond: function (G) { return mq(G) >= 22 && !G.flags.found_brakka && G.hero !== 'brakka'; }, q: function () { return true; } },
      { id: 's_wounded', sprite: 'guard', name: 'Wounded Soldier', x: 640, y: 650, dir: 'down', wander: 0, lines: ['They fell like grass. We fell like grass. Just — keep going. Please.'], cond: function (G) { return mq(G) >= 21; } }
    ],
    enemies: [
      E('void', 44, [[770, 700], [800, 670]], { cond: function (G) { return mq(G) >= 21 && !G.flags.found_brakka; } }), E('soldier', 44, [[500, 600], [450, 560]], { cond: function (G) { return mq(G) >= 21 && !G.flags.found_brakka; } }),
      E('void', 45, [[1050, 600], [1100, 560]], { cond: function (G) { return mq(G) >= 21 && !G.flags.found_brakka; } })
    ],
    objs: [
      { t: 'chest', id: 'hs1', x: 250, y: 600, gold: 800, items: [['elixir_dawn', 1]] },
      { t: 'chest', id: 'hs2', x: 1290, y: 600, items: [['mana_draught', 3]] },
      { t: 'chest', id: 'hs3', x: 620, y: 150, gold: 900, items: [['oath_seal', 1]] }
    ] });

  D('highcrest_countryside', { name: 'Ruins Outside Highcrest', region: 'highcrest', music: 'solo', noSail: true,
    spawns: { start: [770, 960, 'up'], gate: [770, 200, 'down'], camp: [320, 430, 'right'] },
    portals: [
      { x: 700, y: 1000, w: 160, h: 24, scene: 'countryside_shore', label: 'Road to the shore' },
      { x: 700, y: 60, w: 140, h: 36, to: 'highcrest_siege', spawn: 'start', label: 'Ruined Highcrest', cond: function (G) { return mq(G) >= 22; }, msg: 'Not yet. Find your way through the ruins first.' }
    ],
    triggers: [
      { id: 'solo0', x: 690, y: 880, w: 170, h: 60, cond: function (G) { return mq(G) === 21 && !G.flags.solo0; }, scene: 'q21_wake' },
      { id: 'solo1', x: 690, y: 700, w: 170, h: 40, cond: function (G) { return mq(G) === 21 && G.flags.solo0 && !G.flags.solo1; }, scene: 'q21_whisper1' },
      { id: 'solo2', x: 690, y: 560, w: 170, h: 40, cond: function (G) { return mq(G) === 21 && G.flags.solo1 && !G.flags.solo2; }, scene: 'q21_whisper2' },
      { id: 'solo3', x: 360, y: 400, w: 120, h: 80, cond: function (G) { return mq(G) === 21 && G.flags.solo2 && !G.flags.solo3; }, scene: 'q21_whisper3' },
      { id: 'cross', x: 700, y: 400, w: 150, h: 100, cond: function (G) { return mq(G) === 21 && G.flags.solo3 && !G.flags.q21_done; }, scene: 'q21_reach' }
    ],
    npcs: [
      { id: 'refugee1', sprite: 'refugee', name: 'Refugee', x: 300, y: 340, dir: 'right', wander: 20, talk: 'refugee_talk', speaker: 'refugee' },
      { id: 'refugee2', sprite: 'farmer_mother', name: 'Refugee Mother', x: 230, y: 360, dir: 'down', wander: 10, talk: 'letter_give', q: function (G) { return G.quests.sq17 === 'active' && !G.flags.letter1; }, cond: function (G) { return mq(G) >= 21; } },
      { id: 'refugee3', sprite: 'farmer_father', name: 'Refugee Father', x: 410, y: 400, dir: 'left', wander: 10, talk: 'garden_give', q: function (G) { return !G.quests.sq18 && mq(G) >= 22; }, cond: function (G) { return mq(G) >= 22; } },
      { id: 'soldier_a', sprite: 'guard', name: 'Soldier', x: 1000, y: 540, dir: 'left', wander: 0, talk: 'letter_recv', q: function (G) { return G.quests.sq17 === 'active' && DB.has('refugee_letter') && !G.flags.letter_recv; }, cond: function (G) { return mq(G) >= 21; } },
      { id: 'liora_r', sprite: 'liora_starter', name: 'Liora', x: 340, y: 450, dir: 'right', wander: 0, talk: 'reunion_liora', cond: function (G) { return mq(G) >= 22 && !G.flags.found_liora && G.hero !== 'liora'; }, q: function () { return true; } },
      { id: 'caelan_r', sprite: 'caelan_advanced', name: 'Caelan', x: 770, y: 200, dir: 'down', wander: 0, talk: 'reunion_caelan', cond: function (G) { return mq(G) >= 22 && !G.flags.found_caelan && G.hero !== 'caelan'; }, q: function () { return true; } },
      { id: 'ilsabet_r', sprite: 'ilsabet', name: 'Queen Ilsabet', x: 820, y: 210, dir: 'left', wander: 0, lines: ['The Order ran. The people did not. Remember that.'], cond: function (G) { return mq(G) >= 22 && !G.flags.found_caelan; } },
      { id: 'grave_edran', sprite: 'refugee', name: 'Fresh Grave', x: 770, y: 470, dir: 'down', wander: 0, noInteract: true, cond: function () { return false; } }
    ],
    enemies: [
      E('void', 44, [[770, 780], [800, 750]], { cond: function (G) { return mq(G) === 21; } }), E('soldier', 44, [[560, 850], [500, 820]], { cond: function (G) { return mq(G) === 21; } }),
      E('void', 45, [[980, 820], [1040, 790]], { cond: function (G) { return mq(G) === 21; } }), E('soldier', 45, [[560, 600], [520, 570]], { cond: function (G) { return mq(G) === 21; } }),
      E('shade', 45, [[1000, 640], [1060, 600]], { cond: function (G) { return mq(G) === 21; } }), E('void', 46, [[1150, 520], [1200, 500]], { cond: function (G) { return mq(G) === 21; } }),
      E('void', 46, [[800, 330], [820, 300]], { cond: function (G) { return mq(G) === 21; } }), E('soldier', 46, [[400, 560], [350, 540]], { cond: function (G) { return mq(G) === 21; } })
    ],
    objs: [
      { t: 'chest', id: 'cs1', x: 160, y: 650, gold: 500, items: [['greater_potion', 3]] },
      { t: 'chest', id: 'cs2', x: 1340, y: 740, items: [['elixir_dawn', 1]] },
      { t: 'none', id: 'plot1', x: 600, y: 760, scene: 'garden_plant', cond: function (G) { return G.quests.sq18 === 'active' && !G.flags.plot1; } },
      { t: 'none', id: 'plot2', x: 760, y: 760, scene: 'garden_plant', cond: function (G) { return G.quests.sq18 === 'active' && !G.flags.plot2; } },
      { t: 'none', id: 'plot3', x: 920, y: 760, scene: 'garden_plant', cond: function (G) { return G.quests.sq18 === 'active' && !G.flags.plot3; } }
    ] });

  /* ================= ACT V ================= */
  D('hollow_wastes', { name: 'The Hollow Wastes', region: 'wastes', music: 'wastes', noSail: false,
    spawns: { start: [770, 970, 'up'], vael: [1385, 150, 'down'], citadel: [770, 120, 'down'] },
    portals: [
      { x: 700, y: 1000, w: 160, h: 24, scene: 'wastes_shore', label: 'Shore (sail away)' },
      { x: 1370, y: 80, w: 80, h: 50, to: 'sunken_vael', spawn: 'start', label: 'Sunken Kingdom of Vael', cond: function (G) { return mq(G) >= 24; } },
      { x: 710, y: 40, w: 120, h: 40, to: 'black_sun_citadel', spawn: 'start', label: 'Black Sun Citadel', cond: function (G) { return mq(G) >= 25; }, msg: 'The citadel gates are sealed. Free the king\'s memory first.' }
    ],
    triggers: [
      { id: 'q24', x: 690, y: 880, w: 170, h: 40, cond: function (G) { return mq(G) === 24 && !G.flags.q24_start; }, scene: 'q24_start' }
    ],
    objs: [
      { t: 'pickup', id: 'dp1', x: 300, y: 770, item: 'maren_page', flag: 'pages', cond: function (G) { return G.quests.sq19 === 'active'; } },
      { t: 'pickup', id: 'dp2', x: 1230, y: 750, item: 'maren_page', flag: 'pages', cond: function (G) { return G.quests.sq19 === 'active'; } },
      { t: 'pickup', id: 'dp3', x: 400, y: 440, item: 'maren_page', flag: 'pages', cond: function (G) { return G.quests.sq19 === 'active'; } },
      { t: 'pickup', id: 'dp4', x: 1230, y: 490, item: 'maren_page', flag: 'pages', cond: function (G) { return G.quests.sq19 === 'active'; } },
      { t: 'pickup', id: 'dp5', x: 1250, y: 330, item: 'maren_page', flag: 'pages', cond: function (G) { return G.quests.sq19 === 'active'; } },
      { t: 'none', id: 'wastes_fire', x: 770, y: 560, scene: 'sq19_read', cond: function (G) { return G.quests.sq19 === 'active'; } },
      { t: 'chest', id: 'hw1', x: 140, y: 150, gold: 1000, items: [['elixir_dawn', 2]] },
      { t: 'chest', id: 'hw2', x: 1470, y: 640, items: [['mana_draught', 3]] }
    ],
    npcs: [
      { id: 'sq19_start', sprite: 'liora_starter', name: 'Liora', x: 720, y: 880, dir: 'right', wander: 0, talk: 'sq19_start', cond: function (G) { return mq(G) >= 24 && !G.quests.sq19 && G.hero !== 'liora' && G.members.liora; }, q: function () { return true; } }
    ],
    enemies: [
      E('void', 52, [[770, 780], [800, 750]]), E('shade', 52, [[620, 640], [570, 600]]), E('void', 52, [[920, 640], [980, 600]]),
      E('shade', 53, [[440, 700], [380, 670]]), E('void', 53, [[1100, 700], [1160, 670]]), E('void', 53, [[770, 500], [790, 470]]),
      E('shade', 54, [[400, 400], [330, 380]]), E('void', 54, [[1250, 400], [1300, 360]]), E('shade', 54, [[770, 300], [800, 250]]), E('void', 54, [[1250, 250], [1300, 230]])
    ] });

  D('sunken_vael', { name: 'Sunken Kingdom of Vael', region: 'wastes', music: 'vael', dungeon: true, noSail: true,
    spawns: { start: [770, 960, 'up'] },
    portals: [{ x: 700, y: 1000, w: 160, h: 24, to: 'hollow_wastes', spawn: 'vael', label: 'Back to the Wastes' }],
    triggers: [
      { id: 'e1', x: 690, y: 780, w: 170, h: 50, cond: function (G) { return mq(G) === 24 && !G.flags.echo1; }, scene: 'q24_echo1' },
      { id: 'e2', x: 690, y: 520, w: 170, h: 50, cond: function (G) { return mq(G) === 24 && G.flags.echo1 && !G.flags.echo2; }, scene: 'q24_echo2' },
      { id: 'e3', x: 960, y: 380, w: 150, h: 70, cond: function (G) { return mq(G) === 24 && G.flags.echo2 && !G.flags.echo3; }, scene: 'q24_echo3' },
      { id: 'e4', x: 690, y: 250, w: 170, h: 50, cond: function (G) { return mq(G) === 24 && G.flags.echo3 && !G.flags.echo4; }, scene: 'q24_echo4' },
      { id: 'boss', x: 690, y: 130, w: 170, h: 40, cond: function (G) { return mq(G) === 24 && G.flags.echo4 && !G.flags.boss_echo_hero; }, scene: 'q24_boss_intro' }
    ],
    enemies: [
      E('ghost', 52, [[770, 700], [800, 670]]), E('void', 52, [[600, 600], [550, 570]]), E('shade', 53, [[1000, 600], [1060, 570]]),
      E('ghost', 53, [[400, 440], [350, 420]]), E('void', 53, [[1200, 440], [1250, 420]]), E('shade', 54, [[770, 420], [790, 390]]),
      E('ghost', 54, [[300, 250], [260, 230]]), E('void', 54, [[1250, 250], [1300, 230]]), E('shade', 54, [[600, 300], [560, 280]])
    ],
    objs: [
      { t: 'chest', id: 'sv1', x: 160, y: 130, gold: 1200, items: [['elixir_dawn', 2]] },
      { t: 'chest', id: 'sv2', x: 1400, y: 130, items: [['mana_draught', 3]] },
      { t: 'chest', id: 'sv3', x: 160, y: 640, gold: 1000, items: [['elixir_dawn', 1]] },
      { t: 'chest', id: 'sv4', x: 1260, y: 650, items: [['revive_feather', 2]] }
    ] });

  D('black_sun_citadel', { name: 'Black Sun Citadel', region: 'wastes', music: 'citadel', dungeon: true, noSail: true,
    spawns: { start: [770, 960, 'up'], hub: [770, 600, 'down'] },
    portals: [
      { x: 700, y: 1000, w: 160, h: 24, to: 'hollow_wastes', spawn: 'citadel', label: 'Back to the Wastes' },
      { x: 240, y: 225, w: 70, h: 50, to: 'tower_tides', spawn: 'start', label: 'Tower of Tides', cond: function (G) { return mq(G) === 25 && !G.flags.tower_tides; }, msg: 'The Tower of Tides is quiet.' },
      { x: 1260, y: 225, w: 70, h: 50, to: 'tower_veils', spawn: 'start', label: 'Tower of Veils', cond: function (G) { return mq(G) === 25 && !G.flags.tower_veils; }, msg: 'The Tower of Veils is quiet.' },
      { x: 220, y: 650, w: 70, h: 50, to: 'tower_ash', spawn: 'start', label: 'Tower of Ash', cond: function (G) { return mq(G) === 25 && !G.flags.tower_ash; }, msg: 'The Tower of Ash is quiet.' },
      { x: 1280, y: 650, w: 70, h: 50, to: 'tower_oaths', spawn: 'start', label: 'Tower of Oaths', cond: function (G) { return mq(G) === 25 && !G.flags.tower_oaths; }, msg: 'The Tower of Oaths is quiet.' },
      { x: 720, y: 140, w: 100, h: 50, to: 'throne_of_swords', spawn: 'start', label: 'Throne of Swords', cond: function (G) { return mq(G) >= 26 || (G.flags.tower_tides && G.flags.tower_veils && G.flags.tower_ash && G.flags.tower_oaths); }, msg: 'The great doors will not open until the four towers are silent.' }
    ],
    triggers: [
      { id: 'q25', x: 690, y: 800, w: 170, h: 50, cond: function (G) { return mq(G) === 25 && !G.flags.q25_start; }, scene: 'q25_start' },
      { id: 'q26', x: 690, y: 240, w: 170, h: 40, cond: function (G) { return mq(G) === 25 && G.flags.tower_tides && G.flags.tower_veils && G.flags.tower_ash && G.flags.tower_oaths && !G.flags.q25_reunite; }, scene: 'q25_reunite' }
    ],
    enemies: [
      E('void', 55, [[770, 700], [800, 670]]), E('shade', 55, [[560, 560], [500, 520]]), E('void', 56, [[980, 560], [1040, 520]]),
      E('void', 56, [[770, 420], [790, 380]]), E('shade', 56, [[500, 400], [440, 380]]), E('void', 56, [[1030, 400], [1090, 380]])
    ].map(function (g) { return g; }) });

  DB.setTowerParty = function (key) {
    var G = DB.G; if (G.flags['tower_' + key]) return; if (!G.partyBackup) G.partyBackup = G.party.slice();
    var h = G.hero, pair = { tides: [h, h === 'vex' ? 'liora' : 'vex'], veils: [h === 'vex' ? 'vex' : h, h === 'vex' ? 'liora' : 'vex'], ash: ['brakka', 'rowan'], oaths: ['caelan'] }[key];
    pair = pair.filter(function (v, i, a) { return a.indexOf(v) === i && G.members[v]; });
    if (key === 'ash' || key === 'oaths') { /* hero-led if hero is in the pair */ if (pair.indexOf(h) > 0) { pair.splice(pair.indexOf(h), 1); pair.unshift(h); } }
    G.party = pair; if (DB.ui && DB.ui.invalidateParty) DB.ui.invalidateParty();
  };
  function tower(id, name, boss, music) {
    var key = id.split('_')[1];
    D(id, { name: name, region: 'wastes', music: music || 'citadel', dungeon: true, noSail: true,
      beforeLoad: function () { DB.setTowerParty(key); },
      spawns: { start: [770, 960, 'up'] },
      portals: [{ x: 700, y: 1000, w: 160, h: 24, to: 'black_sun_citadel', spawn: 'hub', label: 'Back to the hub', cond: function (G) { return G.flags['tower_' + id.split('_')[1]] || id === 'tower_oaths'; }, msg: 'There is no turning back from this fight.' }],
      triggers: [{ id: 'boss', x: 690, y: 170, w: 170, h: 40, cond: function (G) { return !G.flags['tower_' + id.split('_')[1]]; }, scene: 'q25_' + id.split('_')[1] }],
      enemies: [
        E('void', 56, [[770, 800], [800, 770]]), E('shade', 56, [[500, 640], [440, 610]]), E('void', 56, [[1030, 640], [1090, 610]]),
        E('shade', 57, [[770, 540], [790, 500]]), E('void', 57, [[330, 400], [270, 380]]), E('void', 57, [[1200, 400], [1260, 380]]), E('shade', 57, [[770, 340], [790, 300]])
      ].slice(0, id === 'tower_oaths' ? 0 : 99),
      objs: [{ t: 'chest', id: id + '_c1', x: 200, y: 500, gold: 1500, items: [['elixir_dawn', 2]] }, { t: 'chest', id: id + '_c2', x: 1340, y: 500, items: [['mana_draught', 3]] }] });
  }
  tower('tower_tides', 'Tower of Tides', 'vashka', 'drowned');
  tower('tower_veils', 'Tower of Veils', 'lady_nyx', 'undercity');
  tower('tower_ash', 'Tower of Ash', 'gorran', 'forge');
  tower('tower_oaths', 'Tower of Oaths', null, 'sad');

  D('throne_of_swords', { name: 'The Throne of Swords', region: 'wastes', music: 'finalboss', dungeon: true, noSail: true, autosave: false,
    spawns: { start: [770, 960, 'up'] },
    portals: [],
    triggers: [{ id: 'q26', x: 690, y: 700, w: 170, h: 40, cond: function (G) { return mq(G) === 26 && !G.flags.q26_started; }, scene: 'q26_throne' }] });

  D('black_sun_sky', { name: 'The Black Sun', region: 'wastes', music: 'finalboss', dungeon: true, noSail: true, autosave: false,
    spawns: { start: [770, 800, 'up'] }, portals: [] });

  D('abyssal_trench', { name: 'The Abyssal Trench', region: 'trench', music: 'drowned', dungeon: true, noSail: true,
    spawns: { start: [770, 970, 'up'] },
    portals: [{ x: 700, y: 1000, w: 160, h: 24, scene: 'trench_leave', label: 'Surface (sail away)' }],
    triggers: [{ id: 'boss', x: 690, y: 90, w: 170, h: 40, cond: function (G) { return !G.flags.trench_done; }, scene: 'trench_boss_intro' }],
    enemies: [
      E('ghost', 50, [[770, 800], [800, 770]]), E('ironcrab', 50, [[560, 640], [500, 610]]), E('tidespawn', 51, [[1000, 640], [1060, 610]]),
      E('ghost', 51, [[770, 520], [790, 480]]), E('ironcrab', 51, [[280, 400], [230, 380]]), E('tidespawn', 52, [[1230, 400], [1280, 380]]), E('ghost', 52, [[770, 300], [790, 260]]),
      E('ironcrab', 52, [[300, 760], [250, 730]]), E('tidespawn', 52, [[1200, 760], [1250, 730]])
    ],
    objs: [
      { t: 'chest', id: 'at1', x: 130, y: 120, gold: 2000, items: [['elixir_dawn', 2]] },
      { t: 'chest', id: 'at2', x: 1400, y: 150, items: [['revive_feather', 2]] },
      { t: 'chest', id: 'at3', x: 100, y: 640, gold: 1500, items: [['mana_draught', 3]] }
    ] });

  D('hall_of_echoes', { name: 'The Hall of Echoes', region: 'hall', music: 'echoes', dungeon: true, noSail: true, autosave: false,
    spawns: { start: [770, 900, 'up'] },
    portals: [{ x: 700, y: 1000, w: 160, h: 24, scene: 'hall_leave', label: 'Leave the Hall' }],
    onEnter: function () { setTimeout(function () { if (DB.story && !DB.story.running) DB.story.run('hall_begin'); }, 400); } });
  /* reunion NPCs placed on existing maps */
  DB.addNpc = function (map, n) { var m = DB.maps[map]; if (m) { m.npcs = m.npcs || []; m.npcs.push(n); } };
  DB.addNpc('greythorn_wilds', { id: 'rowan_r', sprite: 'rowan_starter', name: 'Rowan', x: 780, y: 470, dir: 'down', wander: 0, talk: 'reunion_rowan', q: function () { return true; }, cond: function (G) { return mq(G) >= 22 && !G.flags.found_rowan && G.hero !== 'rowan'; } });
  DB.addNpc('saltmire_undercity', { id: 'vex_r', sprite: 'vex_starter', name: 'Vex', x: 770, y: 350, dir: 'down', wander: 0, talk: 'reunion_vex', q: function () { return true; }, cond: function (G) { return mq(G) >= 22 && !G.flags.found_vex && G.hero !== 'vex'; } });
  DB.addNpc('sealed_archives', { id: 'sera_r', sprite: 'seraphine_starter', name: 'Seraphine', x: 770, y: 420, dir: 'down', wander: 0, talk: 'reunion_seraphine', q: function () { return true; }, cond: function (G) { return mq(G) >= 22 && !G.flags.found_seraphine && G.hero !== 'seraphine'; } });
})();
