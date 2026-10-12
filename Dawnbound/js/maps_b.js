/* Dawnbound - maps: Act II (Greythorn) */
(function () {
  'use strict';
  var DB = window.DB, D = DB.defMap, E = DB.E;
  var mq = function (G) { return G.flags.mq || 0; };

  D('greythorn', { name: 'Greythorn', region: 'greythorn', music: 'greythorn',
    spawns: { start: [780, 980, 'up'], north: [780, 120, 'down'], plaza: [780, 560, 'down'] },
    portals: [
      { x: 700, y: 1000, w: 160, h: 24, to: 'greythorn_wilds', spawn: 'north', label: 'The Silent Forest' },
      { x: 740, y: 36, w: 92, h: 30, to: 'rotwood_hollow', spawn: 'start', label: 'Rotwood Hollow', cond: function (G) { return mq(G) >= 8; }, msg: 'Elder Brannoch must tell you about the Stag first.' }
    ],
    triggers: [
      { id: 'brannoch', x: 640, y: 560, w: 300, h: 60, cond: function (G) { return mq(G) === 7 && G.flags.rowan_met && !G.flags.q7_village; }, scene: 'q7_village' },
      { id: 'sq7', x: 620, y: 440, w: 300, h: 60, cond: function (G) { return mq(G) >= 8 && G.flags.rowan_met && !G.quests.sq7 && (G.roster.indexOf('rowan') >= 0); }, scene: 'sq7_start' }
    ],
    npcs: [
      { id: 'brannoch', sprite: 'brannoch', name: 'Elder Brannoch', x: 700, y: 575, dir: 'right', wander: 0, talk: 'brannoch_talk' },
      { id: 'woodcarver', sprite: 'scholar', name: 'Old Woodcarver', x: 1010, y: 500, dir: 'left', wander: 0, talk: 'woodcarver_talk', speaker: 'woodcarver', q: function (G) { return !G.quests.sq8 && mq(G) >= 8 || (G.quests.sq8 === 'active' && DB.has('heartwood', 3)); } },
      { id: 'g_merchant', sprite: 'refugee', name: 'Treehouse Trader', x: 905, y: 575, dir: 'down', wander: 0, shop: 'general', speaker: 'refugee' },
      { id: 'g_smith', sprite: 'guard', name: 'Greythorn Fletcher', x: 650, y: 440, dir: 'down', wander: 0, shop: 'smith' },
      { id: 'g_kid', sprite: 'orphan', name: 'Treehouse Kid', x: 860, y: 440, dir: 'down', wander: 40, lines: ['The Stag used to sing us to sleep. Now it just... hums wrong.', 'Everyone climbed into the treehouses when the roots started grabbing ankles.'] },
      { id: 'g_hunter', sprite: 'clan_warrior', name: 'Hunter', x: 810, y: 700, dir: 'up', wander: 20, lines: ['Wolf-friend! Ash is the only wolf the forest still trusts.', 'Keep to the paths south of the Hollow. The roots do not forgive trespassers.'] }
    ] });

  D('greythorn_wilds', { name: 'The Silent Forest', region: 'greythorn', music: 'silent',
    spawns: { start: [780, 960, 'up'], shore: [780, 960, 'up'], north: [780, 70, 'down'] },
    portals: [
      { x: 700, y: 1000, w: 160, h: 24, scene: 'wilds_shore', label: 'Shore (sail away)' },
      { x: 730, y: 4, w: 100, h: 28, to: 'greythorn', spawn: 'start', label: 'Greythorn Village', cond: function (G) { return G.flags.rowan_met || G.hero === 'rowan'; }, msg: 'You should not wander into the forest alone...' }
    ],
    triggers: [
      { id: 'q7enter', x: 690, y: 760, w: 180, h: 60, cond: function (G) { return mq(G) === 7 && !G.flags.rowan_met; }, scene: 'q7_enter' },
      { id: 'sq7found', x: 1280, y: 180, w: 200, h: 90, cond: function (G) { return G.quests.sq7 === 'active' && !G.flags.ember_found; }, scene: 'sq7_found' }
    ],
    enemies: [
      E('root', 12, [[790, 620], [770, 690]], { cond: function (G) { return G.flags.rowan_met; } }),
      E('soldier', 12, [[560, 470], [480, 450]]), E('root', 13, [[360, 400], [290, 370]]),
      E('root', 13, [[1040, 465], [1130, 440]]), E('rootwraith', 13, [[1250, 330], [1320, 270]]),
      E('soldier', 13, [[1100, 630], [1250, 620]]), E('rootwraith', 13, [[420, 650], [330, 650]]),
      E('root', 14, [[780, 260], [790, 200]], { cond: function (G) { return mq(G) >= 8; } })
    ],
    objs: [
      { t: 'chest', id: 'w_a', x: 225, y: 352, gold: 130, items: [['healing_potion', 2]] },
      { t: 'chest', id: 'w_b', x: 205, y: 650, items: [['mana_tonic', 2]] },
      { t: 'chest', id: 'w_c', x: 1372, y: 262, gold: 160, items: [['greater_potion', 1]] },
      { t: 'chest', id: 'w_d', x: 1396, y: 622, items: [['healing_potion', 3]] },
      { t: 'pickup', id: 'hw1', x: 330, y: 650, item: 'heartwood', flag: 'hw', cond: function (G) { return G.quests.sq8 === 'active'; } },
      { t: 'pickup', id: 'hw2', x: 1200, y: 630, item: 'heartwood', flag: 'hw', cond: function (G) { return G.quests.sq8 === 'active'; } },
      { t: 'pickup', id: 'hw3', x: 260, y: 360, item: 'heartwood', flag: 'hw', cond: function (G) { return G.quests.sq8 === 'active'; } }
    ] });

  D('rotwood_hollow', { name: 'The Rotwood Hollow', region: 'greythorn', music: 'rotwood', dungeon: true, noSail: true,
    spawns: { start: [780, 980, 'up'] },
    portals: [{ x: 700, y: 1000, w: 160, h: 24, to: 'greythorn', spawn: 'north', label: 'Back to Greythorn' }],
    triggers: [
      { id: 'horn', x: 700, y: 900, w: 160, h: 60, cond: function (G) { return G.hero === 'rowan' && mq(G) === 8 && !G.flags.horn_found; }, scene: 'q8_horn' },
      { id: 'boss', x: 690, y: 210, w: 180, h: 50, cond: function (G) { return !G.flags.boss_hollowed_stag && mq(G) === 8; }, scene: 'q8_boss_intro' }
    ],
    enemies: [
      E('root', 14, [[790, 780], [780, 700]]), E('rootwraith', 14, [[650, 645], [560, 680]]), E('root', 14, [[430, 735], [350, 700]]),
      E('rootwraith', 15, [[920, 650], [1030, 690]]), E('root', 15, [[1170, 735], [1250, 705]]),
      E('rootwraith', 15, [[790, 520], [800, 450]]), E('root', 15, [[640, 500], [530, 440]]), E('rootwraith', 15, [[1040, 470], [1140, 440]]),
      E('rootwraith', 15, [[920, 300], [1050, 290]]), E('root', 15, [[650, 300], [540, 285]]), E('rootwraith', 16, [[790, 330], [780, 250]]),
      E('root', 15, [[300, 420], [210, 360]])
    ],
    objs: [
      { t: 'chest', id: 'r1', x: 178, y: 645, gold: 200, items: [['greater_potion', 1]] },
      { t: 'chest', id: 'r2', x: 1292, y: 702, items: [['mana_tonic', 3]] },
      { t: 'chest', id: 'r3', x: 1305, y: 468, gold: 150, items: [['healing_potion', 3]] },
      { t: 'chest', id: 'r4', x: 1382, y: 85, items: [['ember_ring', 1]] },
      { t: 'chest', id: 'r5', x: 182, y: 152, gold: 250, items: [['greater_potion', 2]] },
      { t: 'chest', id: 'r6', x: 402, y: 232, items: [['swamp_charm', 1]] }
    ] });
})();
