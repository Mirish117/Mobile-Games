/* Dawnbound - Mistvale and extra hooks */
(function () {
  'use strict';
  var DB = window.DB, D = DB.defMap, E = DB.E;
  var mq = function (G) { return G.flags.mq || 0; };
  D('mistvale', { name: 'Mistvale', region: 'mistvale', music: 'mistvale',
    spawns: { start: [770, 930, 'up'], plaza: [770, 520, 'down'] },
    portals: [{ x: 700, y: 1000, w: 160, h: 24, scene: 'mistvale_shore', label: 'Shore (sail away)' }],
    npcs: [
      { id: 'anwen_m', sprite: 'anwen', name: 'Sister Anwen', x: 770, y: 250, dir: 'down', wander: 0, talk: 'anwen_talk', speaker: 'anwen' },
      { id: 'garrick_m', sprite: 'garrick', name: 'Garrick', x: 600, y: 500, dir: 'right', wander: 20, lines: ['Sister Anwen says I should stop climbing the temple roof. I say the roof started it.'], speaker: 'garrick' },
      { id: 'm_inn', sprite: 'hettie', name: 'Mistvale Innkeeper', x: 1180, y: 620, dir: 'left', wander: 0, talk: 'mistvale_inn_talk', speaker: 'hettie' },
      { id: 'm_merchant', sprite: 'scholar', name: 'Herbalist', x: 420, y: 520, dir: 'down', wander: 0, shop: 'general' },
      { id: 'm_kid', sprite: 'orphan', name: 'Valley Child', x: 900, y: 600, dir: 'down', wander: 40, lines: ['They say the Gentle Flame never goes out. I\'ve tried blowing on it. It just winks.'] },
      { id: 'm_monk', sprite: 'refugee', name: 'Temple Brother', x: 1290, y: 420, dir: 'left', wander: 10, lines: ['Liora Wyn? The girl who healed half the valley before she was twenty? She\'s a legend here. Don\'t tell her; it embarrasses her.'] }
    ],
    objs: [{ t: 'none', id: 'tam_grave', x: 235, y: 215, scene: 'pq_liora', cond: function (G) { return !!G.members.liora && mq(G) >= 12 && G.quests.pq_liora !== 'done'; } }] });
})();
