/* Dawnbound - maps: Act III (Frostmark, Lumeria) */
(function () {
  'use strict';
  var DB = window.DB, D = DB.defMap, E = DB.E;
  var mq = function (G) { return G.flags.mq || 0; };

  /* ===== Frostmark ===== */
  D('frostmark_glacier', { name: 'Frostmark Glacier Road', region: 'frostmark', music: 'blizzard',
    spawns: { start: [770, 960, 'up'], shore: [770, 960, 'up'], north: [770, 170, 'down'] },
    portals: [
      { x: 700, y: 1000, w: 160, h: 24, scene: 'glacier_shore', label: 'Shore (sail away)' },
      { x: 700, y: 110, w: 160, h: 30, to: 'frostmark', spawn: 'glacier', label: 'Frostmark', cond: function (G) { return G.flags.brakka_met || G.hero === 'brakka'; }, msg: 'Wait for the big singing stranger...' },
      { x: 60, y: 120, w: 100, h: 40, to: 'wyrms_peak', spawn: 'start', label: "Wyrm's Peak", cond: function (G) { return G.quests.sq13 === 'active' || G.flags.sq13_done; }, msg: 'A narrow ledge, but nothing calls you there.' }
    ],
    triggers: [
      { id: 'q12', x: 690, y: 760, w: 170, h: 50, cond: function (G) { return mq(G) === 12 && !G.flags.brakka_met; }, scene: 'q12_enter' }
    ],
    enemies: [
      E('frost', 26, [[770, 720], [800, 690]], { cond: function (G) { return G.flags.brakka_met; } }), E('frost', 26, [[300, 560], [260, 540]]), E('harpy', 26, [[1240, 560], [1300, 520]]),
      E('frost', 27, [[440, 760], [380, 730]]), E('frost', 27, [[1150, 760], [1230, 730]]), E('harpy', 27, [[300, 220], [200, 170]]), E('frost', 27, [[1250, 200], [1340, 240]]),
      E('frost', 27, [[770, 230], [800, 190]])
    ],
    objs: [
      { t: 'chest', id: 'fg1', x: 175, y: 175, gold: 400, items: [['greater_potion', 2]] },
      { t: 'chest', id: 'fg2', x: 1230, y: 150, items: [['mana_tonic', 3]] },
      { t: 'chest', id: 'fg3', x: 150, y: 560, gold: 300, items: [['frost_pendant', 1]] },
      { t: 'chest', id: 'fg4', x: 1420, y: 650, items: [['greater_potion', 2]] }
    ] });

  D('frostmark', { name: 'Frostmark', region: 'frostmark', music: 'frostmark',
    spawns: { start: [770, 850, 'up'], gate: [770, 780, 'up'], plaza: [770, 520, 'down'], glacier: [150, 260, 'down'], hall: [770, 240, 'down'], forge: [1250, 470, 'left'], aurora: [1400, 215, 'down'] },
    portals: [
      { x: 700, y: 935, w: 150, h: 36, scene: 'frost_shore', label: 'Shore (sail away)' },
      { x: 110, y: 200, w: 90, h: 36, to: 'frostmark_glacier', spawn: 'north', label: 'Glacier Road' },
      { x: 710, y: 150, w: 120, h: 40, to: 'frostmark_mead_hall', spawn: 'start', label: 'Mead Hall', cond: function (G) { return !G.flags.hall_burning || G.flags.q13_done; }, msg: 'The great hall is burning!' },
      { x: 1255, y: 430, w: 70, h: 80, to: 'glacier_forge', spawn: 'start', label: 'Glacier Forge', cond: function (G) { return mq(G) >= 13; }, msg: 'The forge is cold and dark... for now.' },
      { x: 1360, y: 170, w: 90, h: 40, to: 'aurora_hillside', spawn: 'start', label: 'Aurora Hillside', cond: function (G) { return mq(G) >= 14; }, msg: 'A trail winds up into the snow. Not tonight.' }
    ],
    triggers: [
      { id: 'q13', x: 650, y: 500, w: 240, h: 60, cond: function (G) { return mq(G) === 13 && !G.flags.q13_siege; }, scene: 'q13_siege' }
    ],
    npcs: [
      { id: 'hald', sprite: 'hald', name: 'Jarl Hald', x: 770, y: 345, dir: 'down', wander: 0, talk: 'hald_talk', cond: function (G) { return G.flags.q13_siege; } },
      { id: 'sigrun', sprite: 'sigrun', name: 'Sigrun', x: 700, y: 440, dir: 'right', wander: 0, talk: 'sigrun_talk', cond: function (G) { return G.flags.q13_siege; } },
      { id: 'bera', sprite: 'hettie', name: 'Mead-wife Bera', x: 420, y: 490, dir: 'down', wander: 0, talk: 'bera_talk', speaker: 'hettie' },
      { id: 'f_merchant', sprite: 'scholar', name: 'Furrier', x: 1040, y: 580, dir: 'down', wander: 0, shop: 'general' },
      { id: 'f_smith', sprite: 'guard', name: 'Clan Smith', x: 1130, y: 420, dir: 'down', wander: 0, shop: 'smith' },
      { id: 'f_clan1', sprite: 'clan_warrior', name: 'Clan Warrior', x: 560, y: 560, dir: 'right', wander: 20, lines: function (G) { return mq(G) >= 14 ? ['The Jarl says the exile is over. I say good riddance to the exile *and* to the exile\'s snoring.'] : ['Brakka? He was the best of us. Then... the Rage. Nobody speaks his name.']; }, cond: function (G) { return G.flags.q13_siege; } },
      { id: 'f_clan2', sprite: 'clan_warrior', name: 'Clan Warrior', x: 1010, y: 470, dir: 'left', wander: 20, lines: ['Don\'t stand near the forge-mouth. The glacier is *melting* from the inside.', 'My cousin\'s wolf-pelt burned. She\'s furious. At the *wolf*.'], cond: function (G) { return G.flags.q13_siege; } },
      { id: 'rolf', sprite: 'clan_warrior', name: 'Rolf', x: 900, y: 600, dir: 'left', wander: 10, talk: 'rolf_talk', speaker: 'rolf', q: function (G) { return !G.quests.sq13 && mq(G) >= 14; }, cond: function (G) { return mq(G) >= 14; } },
      { id: 'f_kid', sprite: 'orphan', name: 'Frost Child', x: 880, y: 650, dir: 'down', wander: 30, lines: ['Uncle Brakka sang to me once. It was *terrible*. I loved it.'], cond: function (G) { return G.flags.q13_siege; } },
      { id: 'brakka_song', sprite: 'clan_warrior', name: 'Skald Torvi', x: 560, y: 700, dir: 'right', wander: 0, talk: 'torvi_talk', speaker: 'clan', q: function (G) { return mq(G) >= 14 && !G.quests.sq12; }, cond: function (G) { return mq(G) >= 14; } }
    ] ,
    enemies: [] });

  D('frostmark_mead_hall', { name: 'The Great Mead Hall', region: 'frostmark', music: 'feast', noSail: true,
    spawns: { start: [770, 960, 'up'] },
    portals: [{ x: 700, y: 1000, w: 160, h: 24, to: 'frostmark', spawn: 'hall', label: 'Out to Frostmark' }],
    triggers: [{ id: 'feast', x: 650, y: 500, w: 240, h: 60, cond: function (G) { return mq(G) === 14 && !G.flags.feast_done; }, scene: 'q14_feast' }],
    npcs: [
      { id: 'h_hald', sprite: 'hald', name: 'Jarl Hald', x: 770, y: 250, dir: 'down', wander: 0, talk: 'hald_talk' },
      { id: 'h_clan1', sprite: 'clan_warrior', name: 'Clansman', x: 520, y: 600, dir: 'right', wander: 10, lines: ['The mead is free tonight! Drink until your ancestors blush!'] },
      { id: 'h_clan2', sprite: 'clan_warrior', name: 'Clansman', x: 1020, y: 600, dir: 'left', wander: 10, lines: ['That Vex! Won a drinking contest by cheating — *openly*!'] }
    ] });

  D('glacier_forge', { name: 'The Glacier Forge', region: 'frostmark', music: 'forge', dungeon: true, noSail: true,
    spawns: { start: [770, 960, 'up'] },
    portals: [{ x: 700, y: 1000, w: 160, h: 24, to: 'frostmark', spawn: 'forge', label: 'Out of the forge' }],
    triggers: [{ id: 'boss', x: 690, y: 290, w: 160, h: 50, cond: function (G) { return !G.flags.boss_gorran && mq(G) === 13; }, scene: 'q13_boss_intro' }],
    enemies: [
      E('ember', 28, [[770, 820], [800, 790]]), E('frost', 28, [[560, 760], [480, 740]]), E('ember', 28, [[1000, 760], [1090, 740]]),
      E('ember', 29, [[770, 620], [780, 560]]), E('frost', 29, [[420, 540], [340, 520]]), E('ember', 29, [[1130, 540], [1210, 520]]),
      E('ember', 30, [[770, 450], [780, 400]]), E('frost', 30, [[300, 330], [230, 320]]), E('ember', 30, [[1300, 330], [1350, 280]]),
      E('ember', 31, [[550, 330], [470, 320]]), E('frost', 31, [[1000, 330], [1090, 320]])
    ],
    objs: [
      { t: 'chest', id: 'gf1', x: 150, y: 380, gold: 500, items: [['greater_potion', 2]] },
      { t: 'chest', id: 'gf2', x: 1400, y: 390, items: [['mana_tonic', 3]] },
      { t: 'chest', id: 'gf3', x: 250, y: 140, gold: 400, items: [['mana_draught', 1]] },
      { t: 'chest', id: 'gf4', x: 1380, y: 120, items: [['greater_potion', 3]] }
    ] });

  D('aurora_hillside', { name: 'Aurora Hillside', region: 'frostmark', music: 'aurora', noSail: true, autosave: false,
    spawns: { start: [770, 960, 'up'] },
    portals: [{ x: 680, y: 1000, w: 200, h: 24, to: 'frostmark', spawn: 'aurora', label: 'Back to Frostmark' }],
    triggers: [{ id: 'aurora', x: 700, y: 400, w: 150, h: 120, cond: function (G) { return mq(G) === 14 && G.flags.feast_done && !G.flags.aurora_done; }, scene: 'q14_aurora' }] });

  D('wyrms_peak', { name: "Wyrm's Peak", region: 'frostmark', music: 'blizzard', dungeon: true, noSail: true,
    spawns: { start: [770, 980, 'up'] },
    portals: [{ x: 700, y: 1000, w: 160, h: 24, to: 'frostmark_glacier', spawn: 'north', label: 'Down the glacier' }],
    triggers: [{ id: 'nest', x: 690, y: 250, w: 170, h: 50, cond: function (G) { return G.quests.sq13 === 'active' && !G.flags.sq13_done; }, scene: 'sq13_nest' }],
    enemies: [E('frost', 30, [[770, 800], [790, 760]]), E('frost', 30, [[1100, 640], [1180, 610]]), E('harpy', 31, [[400, 400], [330, 440]]), E('frost', 31, [[1200, 400], [1280, 360]]), E('harpy', 31, [[770, 400], [830, 350]])],
    objs: [{ t: 'chest', id: 'wp1', x: 150, y: 220, gold: 500, items: [['greater_potion', 2]] }, { t: 'chest', id: 'wp2', x: 1380, y: 240, items: [['mana_tonic', 3]] }] });

  /* ===== Lumeria ===== */
  D('skyroot_ascent', { name: 'The Skyroot Ascent', region: 'lumeria', music: 'skyroot', dungeon: true,
    spawns: { start: [770, 960, 'up'], top: [770, 150, 'down'] },
    portals: [
      { x: 700, y: 1000, w: 160, h: 24, scene: 'skyroot_shore', label: 'Descend (sail away)' },
      { x: 690, y: 80, w: 160, h: 30, to: 'lumeria', spawn: 'south', label: 'Lumeria', cond: function (G) { return G.flags.skyroot_done; }, msg: 'The Skyroot Guardian bars the way.' }
    ],
    triggers: [{ id: 'guardian', x: 690, y: 240, w: 160, h: 50, cond: function (G) { return !G.flags.skyroot_done && mq(G) === 15; }, scene: 'q15_guardian' }],
    enemies: [
      E('wisp', 33, [[770, 780], [800, 740]]), E('wisp', 33, [[650, 620], [600, 600]]), E('wisp', 33, [[470, 560], [430, 500]]),
      E('wisp', 34, [[600, 440], [650, 420]]), E('wisp', 34, [[920, 440], [980, 470]]), E('wisp', 34, [[1250, 490], [1300, 440]]),
      E('wisp', 34, [[1300, 330], [1330, 290]]), E('wisp', 34, [[450, 300], [380, 320]]), E('wisp', 35, [[770, 330], [790, 300]])
    ],
    objs: [
      { t: 'chest', id: 'sk1', x: 230, y: 300, gold: 600, items: [['greater_potion', 2]] },
      { t: 'chest', id: 'sk2', x: 1400, y: 175, items: [['mana_tonic', 3]] },
      { t: 'chest', id: 'sk3', x: 60, y: 490, gold: 450, items: [['star_pin', 1]] }
    ] });

  D('lumeria', { name: 'Lumeria — The Floating City', region: 'lumeria', music: 'lumeria',
    spawns: { start: [770, 960, 'up'], south: [770, 960, 'up'], plaza: [770, 520, 'down'], spire: [770, 250, 'down'], gardens: [1250, 250, 'down'] },
    portals: [
      { x: 700, y: 1000, w: 160, h: 24, to: 'skyroot_ascent', spawn: 'top', label: 'Skyroot Ascent' },
      { x: 710, y: 105, w: 120, h: 50, to: 'sealed_archives', spawn: 'start', label: 'Spire of Aster', cond: function (G) { return mq(G) >= 16 || G.flags.spire_open; }, msg: 'The Spire gates are sealed against you.' },
      { x: 1280, y: 190, w: 100, h: 50, to: 'lumeria_gardens', spawn: 'start', label: 'Floating Gardens', cond: function (G) { return mq(G) >= 15; } }
    ],
    triggers: [
      { id: 'q15', x: 690, y: 560, w: 170, h: 50, cond: function (G) { return mq(G) === 15 && G.flags.skyroot_done && !G.flags.sera_met; }, scene: 'q15_sera' },
      { id: 'sq14', x: 280, y: 700, w: 200, h: 80, cond: function (G) { return mq(G) >= 16 && G.members.seraphine && !G.quests.sq14; }, scene: 'sq14_start' }
    ],
    npcs: [
      { id: 'thessaly', sprite: 'thessaly', name: 'Archmagister Thessaly', x: 770, y: 215, dir: 'down', wander: 0, talk: 'thessaly_talk', cond: function (G) { return mq(G) >= 16 && !G.flags.thessaly_gone; } },
      { id: 'l_merchant', sprite: 'scholar', name: 'Spell-Peddler', x: 520, y: 540, dir: 'down', wander: 0, shop: 'general' },
      { id: 'l_smith', sprite: 'scholar', name: 'Rune-Smith', x: 1030, y: 540, dir: 'down', wander: 0, shop: 'smith' },
      { id: 'l_inn', sprite: 'bessa', name: 'Starlight Innkeeper', x: 205, y: 560, dir: 'right', wander: 0, talk: 'lumeria_inn_talk', speaker: 'bessa' },
      { id: 'l_scholar1', sprite: 'scholar', name: 'Scholar', x: 560, y: 380, dir: 'down', wander: 30, lines: ['Seraphine Vael? Expelled. Brilliant, rude, and — between us — probably right.', 'The Spire is closed to outsiders. Orders of the Archmagister.'] },
      { id: 'l_scholar2', sprite: 'squire', name: 'Apprentice', x: 400, y: 710, dir: 'right', wander: 0, talk: 'apprentice_talk', speaker: 'apprentice', q: function (G) { return G.quests.sq14 === 'active'; }, cond: function (G) { return G.quests.sq14 !== undefined || mq(G) >= 16; } }
    ],
    enemies: [] });

  D('lumeria_gardens', { name: 'The Floating Gardens', region: 'lumeria', music: 'gardens', noSail: true,
    spawns: { start: [770, 960, 'up'] },
    portals: [{ x: 700, y: 1000, w: 160, h: 24, to: 'lumeria', spawn: 'gardens', label: 'Back to Lumeria' }],
    npcs: [
      { id: 'cat', sprite: 'clockwork_cat', name: 'Clockwork Cat', x: 300, y: 530, dir: 'right', wander: 20, talk: 'cat_talk', cond: function (G) { return G.quests.sq15 === 'active' && !G.flags.cat_found; } },
      { id: 'pell', sprite: 'scholar', name: 'Magister Pell', x: 1230, y: 560, dir: 'left', wander: 0, talk: 'pell_talk', cond: function (G) { return G.quests.sq15 === 'active' || G.quests.sq15 === 'done' || mq(G) >= 15; }, q: function (G) { return !G.quests.sq15; } }
    ],
    enemies: [] });

  D('sealed_archives', { name: 'Spire of Aster — Sealed Archives', region: 'lumeria', music: 'archives', dungeon: true, noSail: true,
    spawns: { start: [770, 960, 'up'] },
    portals: [{ x: 690, y: 1000, w: 180, h: 24, to: 'lumeria', spawn: 'spire', label: 'Back to the Spire' }],
    triggers: [
      { id: 'thessaly', x: 690, y: 330, w: 160, h: 50, cond: function (G) { return mq(G) === 16 && !G.flags.thessaly_met; }, scene: 'q16_thessaly' },
      { id: 'boss', x: 690, y: 210, w: 160, h: 40, cond: function (G) { return mq(G) === 16 && G.flags.thessaly_met && !G.flags.boss_archive_guardian; }, scene: 'q16_vault' }
    ],
    enemies: [
      E('page', 35, [[770, 800], [800, 770]]), E('page', 35, [[560, 740], [480, 700]]), E('page', 35, [[1000, 740], [1090, 700]]),
      E('page', 36, [[400, 560], [330, 520]]), E('page', 36, [[1130, 560], [1200, 520]]), E('page', 36, [[770, 560], [780, 500]]),
      E('page', 37, [[330, 410], [250, 360]]), E('page', 37, [[1200, 410], [1280, 360]]), E('page', 37, [[550, 330], [430, 320]]), E('page', 37, [[1000, 330], [1110, 320]])
    ],
    objs: [
      { t: 'chest', id: 'sa1', x: 220, y: 160, gold: 700, items: [['greater_potion', 2]] },
      { t: 'chest', id: 'sa2', x: 1320, y: 160, items: [['mana_draught', 1]] },
      { t: 'chest', id: 'sa3', x: 150, y: 720, gold: 600, items: [['mana_tonic', 3]] },
      { t: 'chest', id: 'sa4', x: 1390, y: 720, items: [['greater_potion', 2]] }
    ] });
})();
