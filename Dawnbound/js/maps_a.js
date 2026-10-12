/* Dawnbound - maps: Brightwater Isle & Port Halcyon */
(function () {
  'use strict';
  var DB = window.DB, D = DB.defMap;
  var mq = function (G) { return G.flags.mq || 0; };
  DB.E = function (type, lv, pts, o) { var g = { type: type, lv: lv, at: pts }; if (o) for (var k in o) g[k] = o[k]; return g; };
  var E = DB.E;
  DB.mq = mq;

  D('wandering_gull_deck', { name: 'The Wandering Gull', region: 'sea', music: 'sea', noSail: true, autosave: false,
    spawns: { start: [700, 640, 'right'] },
    npcs: [
      { id: 'marisol', sprite: 'marisol', name: 'Captain Marisol', x: 905, y: 610, dir: 'left', wander: 0, talk: 'gull_marisol' },
      { id: 'fenn', sprite: 'fenn', name: 'Sailor Fenn', x: 520, y: 470, dir: 'down', wander: 24, talk: 'gull_fenn' },
      { id: 'bessa', sprite: 'bessa', name: 'Cook Bessa', x: 1030, y: 450, dir: 'down', wander: 20, talk: 'gull_bessa' },
      { id: 'ivo', sprite: 'ivo', name: 'Lookout Ivo', x: 700, y: 210, dir: 'up', wander: 0, talk: 'gull_ivo' }
    ],
    triggers: [{ id: 'storm', x: 300, y: 330, w: 950, h: 40, cond: function (G) { return G.flags.p1 && !G.flags.p2; }, scene: 'prologue_p2' }],
    portals: [] });

  D('port_halcyon', { name: 'Port Halcyon', region: 'halcyon', music: 'halcyon',
    spawns: { start: [768, 560, 'up'], dock: [1000, 800, 'up'], inn: [388, 450, 'down'], lighthouse: [1240, 225, 'down'], coast: [650, 40, 'down'] },
    triggers: [{ id: 'q17', x: 900, y: 740, w: 220, h: 120, cond: function (G) { return G.flags.mq === 17 && !G.flags.halcyon_back; }, scene: 'q17_halcyon' }, { id: 'note', x: 330, y: 400, w: 110, h: 70, cond: function (G) { return G.flags.q6_inn_trigger && !G.flags.q6_planned; }, scene: 'q6_inn_note' }],
    objs: [{ t: 'none', id: 'divespot', x: 1395, y: 600, scene: 'sq3_dive', cond: function (G) { return G.quests.sq3 === 'active' && !DB.has('wedding_ring'); } }, { t: 'none', id: 'fishspot', x: 1395, y: 640, scene: 'sq1_fish', cond: function (G) { return G.quests.sq1 === 'active' && !G.flags.whiskers_caught; } }],
    onEnter: function () { var G = DB.G; if (G.flags.festival_on) { var W = DB.world; } },
    portals: [
      { x: 590, y: 0, w: 130, h: 24, to: 'brightwater_coast', spawn: 'town', label: 'Cliff Road', cond: function (G) { return (G.flags.mq || 0) >= 2; }, msg: 'Pip says Elder Maren is waiting at the lighthouse first.' },
      { x: 350, y: 398, w: 70, h: 30, to: 'salty_lantern_inn', spawn: 'start', label: 'Salty Lantern Inn' },
      { x: 1215, y: 178, w: 50, h: 26, to: 'halcyon_lighthouse', spawn: 'start', label: 'Lighthouse' }
    ],
    npcs: [
      { id: 'toss_keeper', sprite: 'fenn', name: 'Lantern Toss', x: 880, y: 500, dir: 'down', wander: 0, talk: 'toss_stall', cond: function (G) { return G.flags.festival_on; } },
      { id: 'fiddler_n', sprite: 'scholar', name: 'Festival Fiddler', x: 560, y: 600, dir: 'right', wander: 0, talk: 'fiddler_talk', speaker: 'fiddler', cond: function (G) { return G.flags.festival_on; } },
      { id: 'pip', sprite: 'pip', name: 'Pip', x: 1010, y: 770, dir: 'up', wander: 30, talk: 'pip_talk', q: function (G) { return (G.flags.mq === 1 && G.flags.inn && !G.flags.pip_guides) || (G.quests.sq1 === 'active' && DB.has('whiskers_net')); } },
      { id: 'odell', sprite: 'odell', name: 'Mayor Odell', x: 690, y: 440, dir: 'down', wander: 40, talk: 'odell_talk', q: function (G) { return G.quests.sq6 !== 'done' && (G.flags.mq || 0) >= 5 && G.quests.sq6 !== 'active'; } },
      { id: 'marisol_hub', sprite: 'marisol', name: 'Captain Marisol', x: 1075, y: 760, dir: 'left', wander: 0, talk: 'marisol_hub', cond: function (G) { return (G.flags.mq || 0) >= 1; } },
      { id: 'merchant', sprite: 'scholar', name: 'Odo the Peddler', x: 985, y: 470, dir: 'down', wander: 0, shop: 'general', speaker: 'scholar' },
      { id: 'smith', sprite: 'guard', name: 'Brannock the Smith', x: 945, y: 730, dir: 'down', wander: 0, shop: 'smith', cond: function (G) { return (G.flags.mq || 0) >= 2; } },
      { id: 'tomas', sprite: 'tomas', name: 'Tomas', x: 1290, y: 585, dir: 'left', wander: 0, talk: 'tomas_talk', q: function (G) { return !G.quests.sq3 && (G.flags.mq || 0) >= 3; } },
      { id: 'archivist', sprite: 'scholar', name: 'Archivist Lenn', x: 520, y: 470, dir: 'right', wander: 20, talk: 'archivist_talk' },
      { id: 'kid1', sprite: 'orphan', name: 'Dock Kid', x: 800, y: 700, dir: 'down', wander: 70, lines: ['Pip says he is the harbor master. He is not. But he is the best at skipping stones.'] },
      { id: 'guard1', sprite: 'guard', name: 'Harbor Guard', x: 690, y: 120, dir: 'down', wander: 0, lines: function (G) { return (G.flags.mq || 0) >= 2 ? ['The Cliff Road is open. Mind the harpies on the high shrine, friend.'] : ['Elder Maren has asked to see you before you leave the town. The lighthouse is up the stairs, to the northeast.']; } },
      { id: 'hettie_festival', sprite: 'hettie', name: 'Hettie', x: 650, y: 520, dir: 'down', wander: 0, talk: 'hettie_stall', cond: function (G) { return G.flags.festival_on; } }
    ] });

  D('salty_lantern_inn', { name: 'The Salty Lantern', region: 'halcyon', music: 'inn',
    spawns: { start: [767, 760, 'up'] },
    portals: [{ x: 690, y: 880, w: 150, h: 60, to: 'port_halcyon', spawn: 'inn', label: 'Out to the harbor' }],
    npcs: [
      { id: 'bram', sprite: 'bram', name: 'Bram', x: 800, y: 305, dir: 'down', wander: 0, talk: 'bram_talk' },
      { id: 'hettie', sprite: 'hettie', name: 'Hettie', x: 410, y: 240, dir: 'down', wander: 16, talk: 'hettie_talk', q: function (G) { return !G.flags.inn && (G.flags.mq || 0) === 1 || (G.flags.mq || 0) >= 2 && !G.quests.sq2; } },
      { id: 'inn_guest', sprite: 'refugee', name: 'Weary Traveler', x: 1160, y: 440, dir: 'left', wander: 0, lines: ['Best bed on the whole isle. I was only meaning to stay a night. That was three weeks ago.'] },
      { id: 'inn_sailor', sprite: 'fenn', name: 'Sailor Fenn', x: 580, y: 460, dir: 'down', wander: 30, lines: ['Cap says the Gull will be fixed by the festival. Cap says a lot of things.'], cond: function (G) { return (G.flags.mq || 0) >= 1; } }
    ] });

  D('halcyon_lighthouse', { name: 'Halcyon Lighthouse', region: 'halcyon', music: 'lanterns',
    spawns: { start: [767, 930, 'up'] },
    portals: [{ x: 690, y: 985, w: 150, h: 38, to: 'port_halcyon', spawn: 'lighthouse', label: 'Down to the town' }],
    triggers: [{ id: 'q17', x: 640, y: 780, w: 260, h: 120, cond: function (G) { return G.flags.mq === 17 && G.flags.halcyon_back; }, scene: 'q17_lighthouse' }],
    npcs: [
      { id: 'maren', sprite: 'elder_maren', name: 'Elder Maren', x: 600, y: 470, dir: 'right', wander: 0, talk: 'maren_talk', q: function (G) { return G.flags.mq === 2 && !G.flags.maren_met; }, cond: function (G) { return !G.flags.maren_dead; } },
      { id: 'lh_pip', sprite: 'pip', name: 'Pip', x: 880, y: 520, dir: 'up', wander: 20, talk: 'pip_lh_talk', cond: function (G) { return (G.flags.mq || 0) >= 2 && !G.flags.maren_dead; } }
    ],
    objs: [
      { t: 'none', id: 'lamp', x: 767, y: 425, scene: 'lamp_use' },
      { t: 'door', kind: 'rune', id: 'echo_door', x: 1370, y: 505, scene: 'hall_door', cond: function (G) { return G.flags.ending_done; } }
    ] });

  D('brightwater_coast', { name: 'Brightwater Coast', region: 'halcyon', music: 'cliffs',
    spawns: { start: [745, 960, 'up'], town: [745, 960, 'up'], grotto: [75, 215, 'right'], cliffs: [750, 50, 'down'], dock: [1380, 575, 'left'], cove: [1050, 840, 'up'] },
    portals: [
      { x: 700, y: 1003, w: 100, h: 20, to: 'port_halcyon', spawn: 'coast', label: 'Port Halcyon' },
      { x: 0, y: 185, w: 26, h: 55, to: 'tidecaller_grotto', spawn: 'start', label: 'Tidecaller Grotto', cond: function (G) { return (G.flags.mq || 0) >= 3; }, msg: 'Maren has not yet sent you to the grotto.' },
      { x: 700, y: 0, w: 100, h: 22, to: 'whispering_cliffs_shrine', spawn: 'start', label: 'Whispering Cliffs', cond: function (G) { return (G.flags.mq || 0) >= 5; }, msg: 'The cliff shrine is for later — the first shard comes first.' },
      { x: 1430, y: 545, w: 60, h: 70, to: 'drowned_lighthouse', spawn: 'start', label: 'Low Tide Crossing', cond: function (G) { return G.flags.mq === 6; }, msg: 'The tide is high. The Drowned Lighthouse cannot be reached.' },
      { x: 1000, y: 880, w: 130, h: 40, to: 'smugglers_cove', spawn: 'start', label: "Smuggler's Cove", cond: function (G) { return !!G.quests.sq4; }, msg: 'A path of footprints leads off the sand, but you see no way in.' }
    ],
    npcs: [
      { id: 'ghost_sailor', sprite: 'ghost_sailor', name: 'Ghost Sailor', x: 1050, y: 745, dir: 'left', wander: 0, alpha: .62, tint: '#9fd0ff', tintAmt: .3, talk: 'ghost_talk', cond: function (G) { return (G.flags.mq || 0) >= 5 && G.quests.sq5 !== 'done'; }, q: function (G) { return !G.quests.sq5; } },
      { id: 'gk_fisher', sprite: 'garrick', name: 'Fisherman', x: 1070, y: 620, dir: 'down', wander: 20, lines: ['Plenty of crabs on the beach. Grumpy ones. They pinch.'] }
    ],
    triggers: [{ id: 'cove', x: 940, y: 820, w: 200, h: 60, cond: function (G) { return (G.flags.mq || 0) >= 5 && !G.quests.sq4; }, scene: 'sq4_start' }, { id: 'maren', x: 650, y: 300, w: 200, h: 60, cond: function (G) { return G.flags.mq === 5 && !G.flags.maren_story; }, scene: 'q5_maren' }],
    objs: [
      { t: 'pickup', id: 'bb1', x: 575, y: 560, item: 'blackberries', flag: 'berries', cond: function (G) { return G.quests.sq2 === 'active'; } },
      { t: 'pickup', id: 'bb2', x: 650, y: 640, item: 'blackberries', flag: 'berries', cond: function (G) { return G.quests.sq2 === 'active'; } },
      { t: 'pickup', id: 'bb3', x: 840, y: 650, item: 'blackberries', flag: 'berries', cond: function (G) { return G.quests.sq2 === 'active'; } },
      { t: 'pickup', id: 'bb4', x: 960, y: 760, item: 'blackberries', flag: 'berries', cond: function (G) { return G.quests.sq2 === 'active'; } },
      { t: 'pickup', id: 'bb5', x: 880, y: 790, item: 'blackberries', flag: 'berries', cond: function (G) { return G.quests.sq2 === 'active'; } },
      { t: 'chest', id: 'cst1', x: 1080, y: 395, gold: 60, items: [['healing_potion', 1]] }
    ],
    enemies: [
      E('crab', 3, [[920, 700], [1000, 740], [1040, 690]], { cond: function (G) { return (G.flags.mq || 0) >= 2 && G.quests.sq2 === 'active'; } }),
      E('crab', 3, [[840, 700], [900, 790]], { cond: function (G) { return G.quests.sq2 === 'active'; } }),
      E('tidespawn', 5, [[560, 500], [620, 440]], { cond: function (G) { return (G.flags.mq || 0) >= 3 && (G.flags.mq || 0) <= 5; } })
    ] });

  D('tidecaller_grotto', { name: 'Tidecaller Grotto', region: 'halcyon', music: 'grotto', dungeon: true, noSail: true,
    spawns: { start: [767, 950, 'up'] },
    portals: [{ x: 700, y: 995, w: 130, h: 28, to: 'brightwater_coast', spawn: 'grotto', label: 'Leave the grotto' }],
    enemies: [
      E('tidespawn', 4, [[760, 820], [800, 780]]), E('crab', 4, [[740, 700]]),
      E('tidespawn', 5, [[300, 760], [220, 700]]), E('crab', 5, [[100, 590], [150, 560]]),
      E('tidespawn', 5, [[1250, 400], [1320, 450]]), E('crab', 5, [[1350, 200], [1300, 260]]),
      E('tidespawn', 5, [[760, 540], [800, 500]], { cond: function (G) { return G.flags.grotto_drained; } }),
      E('tidespawn', 6, [[740, 330], [790, 300]], { cond: function (G) { return G.flags.grotto_drained; } })
    ],
    objs: [
      { t: 'door', kind: 'portcullis', id: 'tide_gate', x: 767, y: 455, block: [715, 430, 110, 36] },
      { t: 'valve', id: 'valve1', x: 1330, y: 440, target: ['tide_gate'], scene: 'grotto_valve' },
      { t: 'chest', id: 'g1', x: 90, y: 530, gold: 80, items: [['mana_tonic', 1]] },
      { t: 'chest', id: 'g2', x: 1390, y: 180, gold: 40, items: [['healing_potion', 2]] },
      { t: 'chest', id: 'g3', x: 400, y: 850, items: [['travel_rations', 1]] }
    ],
    triggers: [{ id: 'boss', x: 640, y: 250, w: 260, h: 50, cond: function (G) { return !G.flags.boss_coral_matriarch && G.flags.mq === 3; }, scene: 'q3_boss_intro' },
      { id: 'liora', x: 600, y: 900, w: 330, h: 60, cond: function (G) { return !G.flags.liora_met && G.flags.mq === 3; }, scene: 'q3_liora' }] });

  D('whispering_cliffs_shrine', { name: 'Whispering Cliffs Shrine', region: 'halcyon', music: 'cliffs', dungeon: true, noSail: true,
    spawns: { start: [767, 960, 'up'] },
    portals: [{ x: 700, y: 995, w: 130, h: 28, to: 'brightwater_coast', spawn: 'cliffs', label: 'Down the cliff road' }],
    enemies: [E('harpy', 8, [[760, 740], [800, 700]]), E('harpy', 8, [[750, 540], [820, 520]]), E('harpy', 8, [[300, 430], [250, 400]]), E('harpy', 9, [[1290, 430], [1340, 400]]), E('harpy', 9, [[700, 360], [850, 360]]), E('harpy', 9, [[560, 200], [980, 200]])],
    objs: [{ t: 'chest', id: 'w1', x: 215, y: 470, gold: 120, items: [['healing_potion', 2]] }, { t: 'chest', id: 'w2', x: 1335, y: 470, items: [['mana_tonic', 2]] }],
    triggers: [{ id: 'boss', x: 600, y: 270, w: 340, h: 50, cond: function (G) { return !G.flags.boss_harpy_queen && G.flags.mq === 5; }, scene: 'q5_boss_intro' }] });

  D('drowned_lighthouse', { name: 'The Drowned Lighthouse', region: 'halcyon', music: 'drowned', dungeon: true, noSail: true,
    spawns: { start: [767, 950, 'up'] },
    portals: [{ x: 700, y: 995, w: 130, h: 28, to: 'brightwater_coast', spawn: 'dock', label: 'Back to shore' }],
    onEnter: function () { if (!DB.G.flags.q6_done) DB.story.setTimer(540, 'q6_tide_fail', 'The tide'); },
    enemies: [E('tidespawn', 10, [[760, 800], [800, 770]]), E('crab', 10, [[300, 700], [250, 650]]), E('ghost', 10, [[1200, 640], [1280, 690]]), E('tidespawn', 11, [[760, 480], [800, 440]]), E('ghost', 11, [[260, 320], [200, 280]]), E('tidespawn', 11, [[1280, 380], [1360, 330]]), E('ghost', 11, [[640, 200], [900, 200]])],
    objs: [{ t: 'chest', id: 'd1', x: 220, y: 700, gold: 150, items: [['greater_potion', 1]] }, { t: 'chest', id: 'd2', x: 1360, y: 690, items: [['mana_tonic', 2]] },
      { t: 'cage', id: 'pipcage', x: 1335, y: 335, scene: null }],
    triggers: [{ id: 'boss', x: 600, y: 260, w: 340, h: 50, cond: function (G) { return !G.flags.boss_vashka && G.flags.mq === 6; }, scene: 'q6_boss_intro' }] });

  D('smugglers_cove', { name: "Smuggler's Cove", region: 'halcyon', music: 'saltmire', dungeon: true, noSail: true,
    spawns: { start: [767, 800, 'up'] },
    portals: [{ x: 700, y: 840, w: 130, h: 40, to: 'brightwater_coast', spawn: 'cove', label: 'Back to the beach' }],
    enemies: [E('smuggler', 6, [[760, 620], [830, 600]]), E('smuggler', 6, [[400, 480], [320, 500]]), E('smuggler', 6, [[1050, 450], [1100, 480]]), E('smuggler', 7, [[700, 270], [800, 250]]), E('smuggler', 7, [[1150, 250], [1100, 300]], { cond: function (G) { return !G.flags.cove_peace; } })],
    objs: [{ t: 'chest', id: 's1', x: 300, y: 330, gold: 90, items: [['sea_biscuits', 3]] }, { t: 'chest', id: 's2', x: 1230, y: 460, gold: 150, item: 'rusty_cutlass' }],
    npcs: [{ id: 'cove_boss', sprite: 'guild_thug', name: 'Captain Redd', x: 770, y: 180, dir: 'down', wander: 0, talk: 'cove_redd', cond: function (G) { return !G.flags.cove_done; } }] });

  D('campfire_clearing', { name: 'Campfire Clearing', region: 'camp', music: 'camp', noSail: true, autosave: false,
    spawns: { start: [767, 520, 'up'] }, portals: [] });
})();
