/* Dawnbound - items, equipment tables */
(function () {
  'use strict';
  var DB = window.DB;
  var I = DB.items = {};
  function item(id, o) { o.id = id; I[id] = o; return o; }
  /* ---------- consumables ---------- */
  item('sea_biscuits', { name: 'Sea Biscuits', type: 'cons', icon: 'sea_biscuits', desc: 'Hard, salty, surprisingly filling. Restores 60 HP.', heal: 60, price: 15 });
  item('healing_potion', { name: 'Healing Potion', type: 'cons', icon: 'healing_potion', desc: 'Restores 150 HP.', heal: 150, price: 40 });
  item('greater_potion', { name: 'Greater Potion', type: 'cons', icon: 'healing_potion', desc: 'Restores 500 HP.', heal: 500, price: 140 });
  item('elixir_dawn', { name: 'Dawn Elixir', type: 'cons', icon: 'healing_potion', desc: 'Restores 1500 HP.', heal: 1500, price: 420 });
  item('mana_tonic', { name: 'Mana Tonic', type: 'cons', icon: 'travel_rations', desc: 'Restores 40 MP.', mp: 40, price: 50 });
  item('mana_draught', { name: 'Mana Draught', type: 'cons', icon: 'travel_rations', desc: 'Restores 150 MP.', mp: 150, price: 190 });
  item('travel_rations', { name: 'Travel Rations', type: 'cons', icon: 'travel_rations', desc: 'Restores 35% HP.', healPct: .35, price: 60 });
  item('blackberry_pie', { name: "Hettie's Blackberry Pie", type: 'cons', icon: 'hettie_s_blackberry_pie', desc: 'Fully restores HP. Legendary.', healPct: 1, price: 0 });
  item('honeyed_trout', { name: 'Honeyed Trout', type: 'cons', icon: 'honeyed_trout', desc: 'Restores 50% HP and 30 MP.', healPct: .5, mp: 30, price: 90 });
  item('barracks_porridge', { name: 'Barracks Porridge', type: 'cons', icon: 'barracks_porridge', desc: 'Restores 40% HP. Tastes like home.', healPct: .4, price: 50 });
  item('starfruit_tart', { name: 'Lumerian Starfruit Tart', type: 'cons', icon: 'starfruit_tart', desc: 'Restores 100 MP.', mp: 100, price: 110 });
  item('mead_mug', { name: 'Frostmark Mead', type: 'cons', icon: 'mead_mug', desc: 'Restores 30% HP; fortifies you for a time.', healPct: .3, price: 70 });
  item('revive_feather', { name: 'Phoenix Feather', type: 'cons', icon: 'dawnmark', desc: 'Revives a fallen ally with 50% HP.', revive: .5, price: 250 });
  item('smoke_bomb', { name: 'Smoke Bomb', type: 'cons', icon: 'travel_rations', desc: 'Enemies lose track of you briefly (in battle).', smoke: 1, price: 60 });
  item('flower_crown', { name: 'Flower Crown', type: 'key', icon: 'flower_crown', desc: 'Woven from the flowers of a field that burned three hundred years ago.' });
  /* ---------- key / quest ---------- */
  item('lumen1', { name: 'First Lumen Shard', type: 'key', icon: 'first_lumen_shard', desc: 'A shard of captured dawn.' });
  item('lumen2', { name: 'Second Lumen Shard', type: 'key', icon: 'second_lumen_shard', desc: 'A shard of captured dawn.' });
  item('lumen3', { name: 'Third Lumen Shard', type: 'key', icon: 'third_lumen_shard', desc: 'A shard of captured dawn.' });
  item('compass', { name: 'Compass of Dawn', type: 'key', icon: 'compass_of_dawn', desc: 'It points toward the other Dawnmarks.' });
  item('blackberries', { name: 'Wild Blackberries', type: 'key', icon: 'wild_blackberries', desc: 'Sweet, sun-warmed, and guarded by crabs.' });
  item('wedding_ring', { name: 'Wedding Ring', type: 'key', icon: 'wedding_ring', desc: 'Lost off the pier by a nervous fisherman.' });
  item('wife_letter', { name: "Wife's Letter", type: 'key', icon: 'wife_s_letter', desc: 'Fifty years late.' });
  item('frost_egg', { name: 'Frost Wyrm Egg', type: 'key', icon: 'frost_wyrm_egg', desc: 'Warm, strangely. Something moves inside.' });
  item('hunting_horn', { name: "Father's Hunting Horn", type: 'key', icon: 'hunting_horn', desc: "Rowan's father's horn." });
  item('heartwood', { name: 'Rare Heartwood', type: 'key', icon: 'rare_heartwood', desc: 'Dense, fragrant, perfect for carving.' });
  item('refugee_letter', { name: 'Refugee Letter', type: 'key', icon: 'refugee_letter', desc: 'A letter addressed to a soldier at the front.' });
  item('maren_page', { name: 'Page of the First Healer\'s Diary', type: 'key', icon: 'first_maren_diary_page', desc: 'Written in a careful, loving hand.' });
  item('ship_bell', { name: "Marisol's First Ship's Bell", type: 'key', icon: 'ship_s_bell', desc: 'Salt-scoured and still ringing true.' });
  item('seeds', { name: 'Seeds for Tomorrow', type: 'key', icon: 'seeds_for_tomorrow', desc: 'Small, quiet, hopeful.' });
  /* ---------- accessories ---------- */
  function acc(id, name, icon, desc, stats, price, o) { var it = item(id, { name: name, type: 'acc', icon: icon, desc: desc, stats: stats, price: price || 0 }); if (o) for (var k in o) it[k] = o[k]; }
  acc('rusty_cutlass', 'Rusty Cutlass', 'rusty_cutlass', 'Pitted, ugly, and strangely lucky. +6 ATK, +4% crit.', { atk: 6, crit: 4 }, 300);
  acc('lucky_coin', 'Lucky Coin', 'lucky_coin', 'A coin that always lands the way you hoped. +8% crit.', { crit: 8 }, 600);
  acc('swamp_charm', 'Swamp Charm', 'swamp_charm', 'Smells like the marsh. +18 magic.', { mag: 18 }, 900);
  acc('maren_lantern', "Maren's Lantern", 'maren_s_lantern', 'Once per battle, a fallen bearer rises again.', { hp: 120 }, 0, { revive: true });
  acc('rusty_cutlass_charm', 'Rusty Cutlass', 'rusty_cutlass', 'Not much of a weapon. A fine keepsake. +6 attack.', { atk: 6 }, 0);
  acc('lucky_hook', 'Pip\'s Lucky Hook', 'dawnmark', 'Pip swears it brings luck. +5% crit.', { crit: 5 }, 0);
  acc('ghost_charm', 'Ghost Captain\'s Charm', 'dawnmark', 'A sailor\'s blessing. +60 HP.', { hp: 60 }, 0);
  item('compass_dawn', { name: 'Compass of Dawn', type: 'key', icon: 'dawnmark', desc: 'It points to the others. Its needle trembles.' });
  item('maren_page_first', { name: 'First Dawnbound Record', type: 'key', icon: 'dawnmark', desc: 'Pages from the Sealed Archives.' });
  item('fathers_horn', { name: "Rowan's Father's Horn", type: 'key', icon: 'dawnmark', desc: 'Worn bone, warm to the touch.' });
  acc('stag_charm', "Old Stag's Blessing", 'dawnmark', 'Antler-light. +50 HP, +6 defense.', { hp: 50, def: 6 }, 0);
  acc('wolf_fang', "Ember's Fang", 'dawnmark', 'Given by a wolf queen. +8 attack, +6 speed.', { atk: 8, spd: 6 }, 0);
  acc('elven_cloak', "Founder's Cloak", 'dawnmark', 'Carved heartwood clasp. +10 defense.', { def: 10 }, 0);
  acc('wyrm_scale', "Mother Wyrm's Scale", 'dawnmark', 'A gift from a grateful mother. +10 defense, +60 HP.', { def: 10, hp: 60 }, 0);
  acc('sea_glass', 'Sea-glass Charm', 'dawnmark', 'Polished by tides. +40 HP.', { hp: 40 }, 220);
  acc('iron_band', 'Iron Band', 'dawnmark', 'Plain, honest, sturdy. +5 defense.', { def: 5 }, 260);
  acc('ember_ring', 'Ember Ring', 'dawnmark', 'Warm against the skin. +10 attack.', { atk: 10 }, 540);
  acc('gale_boots_charm', 'Gale Charm', 'dawnmark', 'A knot of cord that hums in the wind. +10 speed.', { spd: 10 }, 480);
  acc('frost_pendant', 'Frostmark Pendant', 'dawnmark', 'Carved from glacier-ice that never melts. +14 defense.', { def: 14 }, 1100);
  acc('star_pin', 'Spire Star-pin', 'dawnmark', 'Lumerian craftsmanship. +30 magic, +40 MP.', { mag: 30, mp: 40 }, 1600);
  acc('oath_seal', 'Silver Oath Seal', 'dawnmark', 'Weight of a promise. +24 defense, +120 HP.', { def: 24, hp: 120 }, 2400);
  acc('dawn_locket', 'Dawn Locket', 'dawnmark', 'Glows faintly when its owner is near their friends. +40 attack, +40 magic.', { atk: 40, mag: 40 }, 4200);
  /* ---------- weapons ---------- */
  var TIER_ATK = [0, 6, 14, 26, 42, 64, 92, 128, 170], TIER_LV = [0, 1, 6, 14, 22, 32, 42, 52, 58], TIER_PRICE = [0, 60, 220, 600, 1500, 3400, 7000, 13000, 26000];
  DB.TIER_LV = TIER_LV;
  var WEAPONS = {
    caelan: ['Recruit\'s Blade', 'Ironbrand', 'Silver Oath Blade', 'Highcrest Longsword', 'Knight-Captain\'s Edge', 'Sunsteel Claymore', 'Aegisbrand', 'Dawnforged Oathblade'],
    liora: ['Willow Staff', 'Mistvale Crook', 'Staff of Quiet Prayers', 'Gentle Flame Staff', 'Lantern-bearer\'s Staff', 'Staff of Morning Mercy', 'Sunwell Staff', 'Dawnforged Crook'],
    vex: ['Pair of Paring Knives', 'Alley Fangs', 'Silent Daggers', 'Marsh-glass Stilettos', 'Veilcutters', 'Moonlit Twinblades', 'Nightglass Fangs', 'Dawnforged Twinfangs'],
    rowan: ['Hunter\'s Shortbow', 'Greythorn Longbow', 'Heartwood Bow', 'Stagwood Bow', 'Windsong Bow', 'Ashen Recurve', 'Starlit Longbow', 'Dawnforged Longbow'],
    brakka: ['Woodsman\'s Axe', 'Frostmark Hatchet', 'Clanbreaker', 'Stormhewn Greataxe', 'Mammoth Cleaver', 'Aurora Splitter', 'Thunderfall Axe', 'Dawnforged Greataxe'],
    seraphine: ['Apprentice Rod', 'Copper-coil Wand', 'Rod of Sparks', 'Frostglass Scepter', 'Stormcaller Rod', 'Spire Scepter', 'Starweave Staff', 'Dawnforged Scepter']
  };
  var WSTAT = { caelan: 'atk', liora: 'mag', vex: 'atk', rowan: 'atk', brakka: 'atk', seraphine: 'mag' };
  Object.keys(WEAPONS).forEach(function (h) {
    WEAPONS[h].forEach(function (nm, i) {
      var t = i + 1, st = {}; st[WSTAT[h]] = TIER_ATK[t]; if (WSTAT[h] === 'mag') st.atk = Math.round(TIER_ATK[t] * .25);
      if (h === 'vex') st.crit = 2 + t; if (h === 'brakka') st.atk = Math.round(TIER_ATK[t] * 1.1);
      item(h + '_w' + t, { name: nm, type: 'weapon', hero: h, tier: t, stats: st, price: TIER_PRICE[t], icon: null, desc: 'Tier ' + t + ' weapon.' });
    });
  });
  /* unique quest weapons (slightly above their tier) */
  function uw(id, hero, name, icon, tier, desc) { var base = I[hero + '_w' + tier]; var st = {}; for (var k in base.stats) st[k] = Math.round(base.stats[k] * 1.18); item(id, { name: name, type: 'weapon', hero: hero, tier: tier, stats: st, price: 0, icon: icon, unique: true, desc: desc }); }
  uw('edrans_oath', 'caelan', "Edran's Oath", 'edran_s_oath', 6, 'A teacher\'s last gift. It remembers every lesson.');
  uw('staff_gentle_dawn', 'liora', 'Staff of the Gentle Dawn', 'staff_of_the_gentle_dawn', 5, 'Grown from the tree at Tam\'s grave.');
  uw('twin_fangs_saltmire', 'vex', 'Twin Fangs of Saltmire', 'twin_fangs_of_saltmire', 5, 'For someone who finally knows where they come from.');
  uw('bow_old_stag', 'rowan', 'Bow of the Old Stag', 'bow_of_the_old_stag', 4, 'Antler-wood and a father\'s blessing.');
  uw('stormhewn_twinblade', 'brakka', 'Stormhewn Twinblade', 'stormhewn_twinblade', 6, 'Forged by two brothers from their father\'s axe.');
  uw('rod_open_archive', 'seraphine', 'Rod of the Open Archive', 'rod_of_the_open_archive', 5, 'Knowledge, meant to be shared.');
  item('mercy_mistvale', { name: 'The Mercy of Mistvale', type: 'weapon', hero: 'liora', tier: 2, stats: { mag: 18, atk: 4 }, icon: 'mercy_of_mistvale', unique: true, desc: 'Sister Anwen\'s old staff.' });
  /* ---------- armor ---------- */
  var ARM = {
    heavy: { heroes: ['caelan', 'brakka'], names: ['Padded Mail', 'Ringmail', 'Steel Cuirass', 'Highcrest Plate', 'Oathguard Harness', 'Sunplate', 'Aegis Mail', 'Dawnforged Plate'], def: [4, 10, 19, 31, 48, 70, 98, 132], hp: [20, 45, 80, 130, 200, 300, 430, 600] },
    mid: { heroes: ['vex', 'rowan'], names: ['Leather Jerkin', 'Studded Leathers', 'Shadowhide Coat', 'Wildwood Mantle', 'Windrunner Garb', 'Nightbark Vest', 'Starhide Coat', 'Dawnforged Leathers'], def: [3, 7, 14, 23, 36, 52, 73, 99], hp: [15, 35, 60, 100, 150, 230, 330, 460], spd: [0, 0, 2, 3, 4, 5, 6, 8] },
    robe: { heroes: ['liora', 'seraphine'], names: ['Novice Robes', 'Silken Vestments', 'Gentle Flame Robes', 'Spire Mantle', 'Aurora Raiment', 'Starweave Robes', 'Sunwell Vestments', 'Dawnforged Raiment'], def: [2, 5, 10, 17, 26, 38, 54, 72], hp: [12, 28, 50, 80, 125, 190, 270, 380], mp: [8, 16, 28, 44, 64, 90, 124, 165], mag: [0, 2, 5, 9, 14, 20, 28, 38] }
  };
  Object.keys(ARM).forEach(function (k) {
    ARM[k].names.forEach(function (nm, i) {
      var t = i + 1, st = { def: ARM[k].def[i], hp: ARM[k].hp[i] }; if (ARM[k].spd) st.spd = ARM[k].spd[i]; if (ARM[k].mp) { st.mp = ARM[k].mp[i]; st.mag = ARM[k].mag[i]; }
      ARM[k].heroes.forEach(function (h) { item(h + '_a' + t, { name: nm, type: 'armor', hero: h, tier: t, stats: st, price: Math.round(TIER_PRICE[t] * .8), icon: null, desc: 'Tier ' + t + ' armor.' }); });
    });
  });
  DB.weaponOf = function (h, t) { return h + '_w' + t; }; DB.armorOf = function (h, t) { return h + '_a' + t; };
  DB.statLabel = { hp: 'HP', mp: 'MP', atk: 'ATK', def: 'DEF', mag: 'MAG', spd: 'SPD', crit: 'CRIT' };
  DB.statLine = function (st) { var o = []; for (var k in st) if (st[k]) o.push(DB.statLabel[k] + ' +' + st[k]); return o.join('  '); };
  /* shop stock by act */
  DB.shopStock = function (kind, act) {
    var maxT = [0, 2, 3, 5, 6, 7, 8][Math.min(6, act)] || 2, minT = Math.max(1, maxT - 2), out = [];
    if (kind === 'general') {
      out = ['sea_biscuits', 'healing_potion', 'mana_tonic', 'travel_rations'];
      if (act >= 2) out.push('greater_potion', 'mana_draught', 'smoke_bomb'); if (act >= 3) out.push('honeyed_trout', 'starfruit_tart', 'revive_feather', 'mead_mug'); if (act >= 4) out.push('elixir_dawn');
      if (act >= 1) out.push('sea_glass', 'iron_band'); if (act >= 2) out.push('ember_ring', 'gale_boots_charm'); if (act >= 3) out.push('frost_pendant', 'star_pin'); if (act >= 4) out.push('oath_seal'); if (act >= 5) out.push('dawn_locket');
    } else if (kind === 'smith') {
      for (var t = minT; t <= maxT; t++) ['caelan', 'liora', 'vex', 'rowan', 'brakka', 'seraphine'].forEach(function (h) { out.push(h + '_w' + t); });
      for (t = minT; t <= maxT; t++) ['caelan', 'liora', 'vex', 'rowan', 'brakka', 'seraphine'].forEach(function (h) { out.push(h + '_a' + t); });
    }
    return out;
  };
  /* resolve an equipment/inventory icon to a css style string */
  DB.itemIconStyle = function (id, size) {
    var it = I[id]; if (!it) return '';
    if (it.icon) return DB.assets.itemStyle(it.icon, size);
    return 'width:' + size + 'px;height:' + size + 'px';
  };
  DB.itemGlyph = function (it) { if (it.icon) return ''; if (it.type === 'weapon') return { caelan: '⚔', liora: '✦', vex: '🗡', rowan: '🏹', brakka: '🪓', seraphine: '☄' }[it.hero] || '⚔'; return '🛡'; };
})();
