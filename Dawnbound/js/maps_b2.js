/* Dawnbound - maps: Act II (Saltmire) */
(function () {
  'use strict';
  var DB = window.DB, D = DB.defMap, E = DB.E;
  var mq = function (G) { return G.flags.mq || 0; };

  D('saltmire', { name: 'Saltmire', region: 'saltmire', music: 'saltmire',
    spawns: { start: [770, 880, 'up'], plaza: [770, 520, 'down'], marsh: [1440, 820, 'left'], under: [190, 440, 'right'] },
    portals: [
      { x: 120, y: 410, w: 60, h: 70, to: 'saltmire_undercity', spawn: 'start', label: 'Undercity Hatch', cond: function (G) { return mq(G) >= 10 || G.flags.q10_open; }, msg: 'The hatch is bolted. Someone with a key would know the way in.' },
      { x: 1400, y: 770, w: 90, h: 80, to: 'saltmire_marsh', spawn: 'start', label: 'Saltmire Marsh', cond: function (G) { return mq(G) >= 9; } }
    ],
    triggers: [
      { id: 'ambush', x: 680, y: 560, w: 180, h: 50, cond: function (G) { return mq(G) === 9 && !G.flags.vex_met; }, scene: 'q9_ambush' },
      { id: 'sq10', x: 250, y: 640, w: 220, h: 80, cond: function (G) { return mq(G) >= 10 && G.members.vex && !G.quests.sq10; }, scene: 'sq10_start' }
    ],
    npcs: [
      { id: 'dorrin', sprite: 'bram', name: 'Innkeeper Dorrin', x: 335, y: 490, dir: 'down', wander: 0, talk: 'dorrin_talk', speaker: 'bram' },
      { id: 's_merchant', sprite: 'scholar', name: 'Lantern-Seller', x: 875, y: 305, dir: 'down', wander: 0, shop: 'general' },
      { id: 's_smith', sprite: 'guard', name: 'Saltmire Armorer', x: 655, y: 300, dir: 'down', wander: 0, shop: 'smith' },
      { id: 'mordo', sprite: 'guild_thug', name: 'Mordo the Dice-Boss', x: 1130, y: 490, dir: 'down', wander: 0, talk: 'mordo_talk', speaker: 'thug', q: function (G) { return !G.quests.sq9 && mq(G) >= 9 || (G.quests.sq9 === 'active' && G.flags.dice_rigged && !G.flags.dice_done); } },
      { id: 'wick', sprite: 'orphan', name: 'Wick', x: 330, y: 700, dir: 'right', wander: 20, talk: 'wick_talk', speaker: 'orphan', q: function (G) { return G.quests.sq10 === 'active' && !G.flags.sq10_done; } },
      { id: 's_gambler', sprite: 'refugee', name: 'Sore Loser', x: 1060, y: 600, dir: 'left', wander: 10, lines: ['The dice at Mordo\'s hate me. Personally. By name.', 'I lost my boat. And my boots. Not in that order.'] },
      { id: 's_guard', sprite: 'guard', name: 'Guild Lookout', x: 770, y: 780, dir: 'down', wander: 0, lines: ['Move along. Nothing to see. Definitely not a thieves\' guild.'] },
      { id: 's_kid', sprite: 'orphan', name: 'Dock Urchin', x: 580, y: 800, dir: 'down', wander: 50, lines: ['Psst — five coppers and I\'ll tell you which rooftops are guarded.', 'Don\'t go near the Undercity hatch. The Mother doesn\'t like visitors.'] }
    ],
    enemies: [] });

  D('saltmire_marsh', { name: 'Saltmire Marsh', region: 'saltmire', music: 'marsh',
    spawns: { start: [770, 960, 'up'] },
    portals: [{ x: 700, y: 1000, w: 160, h: 24, to: 'saltmire', spawn: 'marsh', label: 'Back to Saltmire' }],
    npcs: [
      { id: 'witch', sprite: 'marsh_witch', name: 'The Marsh Witch', x: 205, y: 270, dir: 'right', wander: 0, talk: 'witch_talk', q: function (G) { return !G.quests.sq11 && mq(G) >= 11; }, cond: function (G) { return mq(G) >= 10; } }
    ],
    enemies: [
      E('crab', 20, [[770, 780], [800, 740]]), E('ironcrab', 21, [[770, 600], [790, 560]]), E('rootwraith', 21, [[600, 400], [500, 420]]),
      E('crab', 21, [[1100, 440], [1200, 450]]), E('ironcrab', 22, [[1300, 500], [1340, 450]]), E('rootwraith', 21, [[250, 560], [180, 600]]),
      E('crab', 22, [[780, 300], [790, 250]])
    ],
    objs: [
      { t: 'chest', id: 'm1', x: 300, y: 680, gold: 280, items: [['greater_potion', 2]] },
      { t: 'chest', id: 'm2', x: 1180, y: 160, items: [['mana_tonic', 3]] },
      { t: 'chest', id: 'm3', x: 1380, y: 520, gold: 200, items: [['healing_potion', 3]] },
      { t: 'chest', id: 'm4', x: 770, y: 120, items: [['gale_boots_charm', 1]] }
    ] });

  D('saltmire_undercity', { name: 'Undercity of Saltmire', region: 'saltmire', music: 'undercity', dungeon: true, noSail: true,
    spawns: { start: [770, 980, 'up'] },
    portals: [{ x: 690, y: 1000, w: 160, h: 24, to: 'saltmire', spawn: 'under', label: 'Up to the city' }],
    triggers: [
      { id: 'vault', x: 690, y: 300, w: 160, h: 50, cond: function (G) { return !G.flags.boss_lady_nyx && mq(G) === 10; }, scene: 'q10_vault' }
    ],
    enemies: [
      E('thug', 19, [[770, 850], [800, 820]]), E('thug', 19, [[560, 740], [480, 700]]), E('thug', 19, [[1000, 740], [1090, 700]]),
      E('veil', 20, [[400, 560], [320, 520]]), E('veil', 20, [[1130, 560], [1210, 520]]), E('thug', 20, [[770, 620], [780, 560]]),
      E('veil', 21, [[330, 410], [250, 360]]), E('veil', 21, [[1200, 410], [1280, 360]]), E('thug', 21, [[770, 460], [780, 410]]),
      E('veil', 21, [[550, 250], [430, 240]]), E('veil', 21, [[1000, 250], [1110, 240]])
    ],
    objs: [
      { t: 'chest', id: 'u1', x: 90, y: 90, gold: 300, items: [['greater_potion', 2]] },
      { t: 'chest', id: 'u2', x: 1440, y: 90, items: [['mana_tonic', 3]] },
      { t: 'chest', id: 'u3', x: 90, y: 560, gold: 250, items: [['healing_potion', 3]] },
      { t: 'chest', id: 'u4', x: 1450, y: 560, items: [['lucky_coin', 1]] },
      { t: 'chest', id: 'u5', x: 340, y: 340, gold: 220, items: [['greater_potion', 1]] },
      { t: 'chest', id: 'u6', x: 1200, y: 340, items: [['mana_tonic', 2]] }
    ] });
})();
