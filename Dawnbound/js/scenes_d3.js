/* Dawnbound - personal quests, late side quests, Abyssal Trench, Hall of Echoes */
(function () {
  'use strict';
  var DB = window.DB, SC = DB.scenes, QD = DB.quests.def;
  var mqs = function (G) { return G.flags.mq || 0; };
  function hook(name, fn) { var o = SC[name]; SC[name] = async function (S, e) { if (await fn(S, e)) return; if (o) return o(S, e); }; }
  DB.speakers.thessaly = DB.speakers.thessaly || { name: 'Thessaly', npc: 'thessaly' };

  SC.mistvale_shore = async function (S) { var c = await S.choice('The Gull waits at the foot of the valley.', ['Set sail', 'Stay']); if (c === 0) await S.sail(); else S.partyAt(770, 880, 'up'); };
  SC.mistvale_inn_talk = async function (S) { var c = await S.choice('The innkeeper smiles.', ['Rest (70 G) and save', 'Chat', 'Never mind']); if (c === 0) return DB.menus.inn(70); if (c === 1) await S.say('hettie', "Mistvale quiet is the best quiet. Good for the soul."); };
  SC.anwen_talk = async function (S) {
    var G = S.G;
    if (G.hero === 'liora' || G.members.liora) await S.say('anwen', G.flags.pq_liora_done ? "A tree on Tam's grave. Of course you did. You've grown, child." : "Liora's valley is always open to her. And her friends. Sit — the Gentle Flame will warm you.");
    else await S.say('anwen', "Welcome to Mistvale, traveler. The Flame warms all who ask.");
  };

  /* ---------- availability helpers ---------- */
  function pqOK(G, hero, mq, aff) { return !!G.members[hero] && mqs(G) >= mq && (G.hero === hero || (G.affinity[hero] || 0) >= aff); }

  /* ---------- PQ Caelan: The Sword Without a Master ---------- */
  QD('pq_caelan', { name: 'The Sword Without a Master', type: 'personal', lv: 44, obj: "Return Edran's sword to its rest at the ruins outside Highcrest." });
  SC.pq_caelan = async function (S) {
    var G = S.G; if (G.quests.pq_caelan === 'done') { await S.narr("A cairn of stones and a flower. Edran's resting place."); return; }
    S.quest('pq_caelan');
    await S.narr("Outside the ruined gate, beneath a lone tree, a mound of earth and a broken shield.");
    await S.say(S.is('caelan') ? 'HERO' : 'caelan', "Master. I brought it back. I've carried it through the dark, and it kept faith even when I didn't.");
    var c = await S.choice('Edran\'s sword rests in your hands.', ['Lay it on his grave', 'Keep it, and carry him with you']);
    await S.narr(c === 0 ? "You lay the blade across the stones. For a moment the wind seems to hold its breath." : "You tuck the sword at your belt. He would have preferred it that way; a sword is for the living.");
    await S.say(S.is('caelan') ? 'HERO' : 'caelan', "I'm going to be a better knight than you. And then I'm going to teach someone to be better than me.");
    S.give('edrans_oath', 1); S.done('pq_caelan'); S.xp(3500); S.flag('pq_caelan_done', 1); S.affinity('caelan', 2);
  };
  /* ---------- PQ Liora: Tam's Garden ---------- */
  QD('pq_liora', { name: "Tam's Garden", type: 'personal', lv: 30, obj: "Plant a tree on Tam's grave in Mistvale." });
  SC.pq_liora = async function (S) {
    var G = S.G; if (!pqOK(G, 'liora', 12, 3)) { await S.narr("A small grave beneath white flowers. TAM, beloved brother."); return; }
    S.quest('pq_liora');
    await S.narr("The temple garden. A small stone, carved with a boy's name: TAM. Wildflowers grow thick around it.");
    await S.say(S.is('liora') ? 'HERO' : 'liora', "*kneeling* I brought you something, Tam. A sapling from the Greythorn. I'm sorry it took me so long.");
    await S.say(S.is('liora') ? 'HERO' : 'liora', "I told myself for years it wasn't enough. That I failed you. I wasn't ready. I was a child, trying to be a god.");
    var c = await S.choice('Liora presses the sapling into the earth.', ['"You didn\'t fail him."', '(Kneel beside her in silence.)']);
    await S.say('tam', "It's okay, Liora. You were my best friend.", 'happy');
    await S.narr("For a breath, the air shimmers. Warm. Then it is only the wind in the leaves, and a girl crying and smiling, and a tree.");
    await S.say(S.is('liora') ? 'HERO' : 'liora', "...I forgive you, Liora. *a small, shaky laugh* I think I just did.", 'happy');
    S.give('staff_gentle_dawn', 1); S.done('pq_liora'); S.flag('pq_liora_done', 1); S.xp(2500); S.affinity('liora', 2);
  };
  /* ---------- PQ Vex: The Name I Was Born With ---------- */
  QD('pq_vex', { name: 'The Name I Was Born With', type: 'personal', lv: 34, obj: 'Find the couple on the Saltmire docks who knew Vex as a baby.' });
  SC.pq_vex = async function (S) {
    var G = S.G; S.quest('pq_vex');
    await S.narr("A fisher couple, patching nets at the Saltmire dock. They look up — and one drops the shuttle.");
    await S.say('farmer_mother', "...It's the eyes. Oh, gods. It's the eyes.", 'surprised');
    await S.say('farmer_father', "We had a child. Little thing. The flood took the whole row of stilt-houses, twenty years ago. We looked for months. We looked for *years.*");
    await S.say(S.is('vex') ? 'HERO' : 'vex', "...You're not — I'm — *stops* I'm Vex. That's... who I am.");
    await S.say('farmer_mother', "Of course you are. Of course. It doesn't matter what we named you.");
    var c = await S.choice('Vex hesitates.', ['"Tell me about the name you gave me."', '"Keep the name. I\'ll keep \'Vex.\'"']);
    await S.say('farmer_mother', c === 0 ? "...Mira. It means 'wonder.' You were *loud* from the day you were born." : "Vex it is, then. A good, sharp name. We'd have picked it ourselves, if we'd thought of it.");
    await S.say(S.is('vex') ? 'HERO' : 'vex', "...I'm keeping Vex. But I'll come and visit. If that's alright.", 'happy');
    S.give('twin_fangs_saltmire', 1); S.done('pq_vex'); S.flag('pq_vex_done', 1); S.xp(3000); S.affinity('vex', 2);
  };
  SC.pq_vex_npc = SC.pq_vex;
  /* ---------- PQ Rowan: The Wind in the High Branches ---------- */
  QD('pq_rowan', { name: 'The Wind in the High Branches', type: 'personal', lv: 26, obj: 'Climb the tallest tree in Greythorn (north road, village).' });
  SC.pq_rowan = async function (S) {
    var G = S.G; if (G.quests.pq_rowan === 'done') { await S.narr("The wind in the high branches hums a note you almost recognize."); return; }
    if (!pqOK(G, 'rowan', 9, 3)) { await S.narr("A tall, ancient tree. Its upper branches are lost in mist."); return; }
    S.quest('pq_rowan');
    await S.narr("The tallest tree in Greythorn. Rowan climbs first. At the top, a platform of woven branches, a bone horn hung on a peg, and a breeze like a hand on your shoulder.");
    await S.say(S.is('rowan') ? 'HERO' : 'rowan', "Father. It's me.");
    await S.say('rowans_father', "Little sapling. You've grown. Look at your hands, steady as roots.");
    await S.say(S.is('rowan') ? 'HERO' : 'rowan', "I... I didn't say goodbye. I never got to. And you were here the whole time.");
    var c = await S.choice('The wind swirls.', ['Say goodbye', 'Say "See you soon"']);
    await S.say('rowans_father', c === 0 ? "Goodbye is only a word. I'll be in every wind that finds you." : "Soon enough, sapling. Not too soon. Live first.");
    await S.narr("The branches sway, soft as breath. When the wind settles, a young staghorn bough lies at your feet — still green. A bow's limb, waiting to be strung.");
    S.give('bow_old_stag', 1); S.done('pq_rowan'); S.flag('pq_rowan_done', 1); S.xp(2500); S.affinity('rowan', 2);
  };
  /* ---------- PQ Brakka: The Brother's Axe ---------- */
  QD('pq_brakka', { name: "The Brother's Axe", type: 'personal', lv: 38, obj: "Forge a new axe with Hald from their father's old weapon (Frostmark forge)." });
  SC.pq_brakka = async function (S) {
    var G = S.G; if (G.quests.pq_brakka === 'done') { await S.narr("A twin-bladed axe hangs over the forge, gleaming, carved with two names."); return; }
    if (!pqOK(G, 'brakka', 14, 3)) { await S.narr("The clan smithy. The anvil is cold."); return; }
    S.quest('pq_brakka');
    await S.say('hald', "Brakka. Father's axe. I've kept it all these years. I thought — maybe — it could be something new.");
    await S.say(S.is('brakka') ? 'HERO' : 'brakka', "Together?");
    await S.say('hald', "Together. Hammer and heat. Two brothers, one blade.");
    await S.narr("The forge roars. Hald holds the steel; Brakka strikes.");
    var r = await S.mini.timing({ title: "The Brother's Axe", rounds: 5, speed: 1.1, zone: .2, intro: 'Strike when the glowing marker lines up! Five blows. Forge it true.', label: 'STRIKE!' });
    await S.narr(r.hits >= 3 ? "The blade rings true. Two voices say the same word at once: 'Done.'" : "The blade has a flaw — but a flaw they made together. Hald laughs: 'It will hold. Like we do.'");
    await S.say('hald', "Stormhewn Twinblade. Two names on the haft: Hald and Brakka. Father would have wept.");
    S.give('stormhewn_twinblade', 1); S.done('pq_brakka'); S.flag('pq_brakka_done', 1); S.xp(3500); S.affinity('brakka', 2);
  };
  /* ---------- PQ Seraphine: The Ordinary Girl ---------- */
  QD('pq_seraphine', { name: 'The Ordinary Girl', type: 'personal', lv: 36, obj: "Visit Seraphine's parents in the Floating Gardens." });
  SC.pq_seraphine = async function (S) {
    var G = S.G; if (G.quests.pq_seraphine === 'done') { await S.say('farmer_mother', "Our girl. Our brilliant, impossible girl."); return; }
    if (!pqOK(G, 'seraphine', 16, 3)) { await S.say('farmer_mother', "We're just visiting. The city is very tall."); return; }
    S.quest('pq_seraphine');
    await S.say('farmer_father', "You must be Sera's friends! We're her parents. We grow turnips. *beaming* We're so proud of her. We don't understand a thing she says.");
    await S.say(S.is('seraphine') ? 'HERO' : 'seraphine', "...Mother? Father? What are you — you came to Lumeria?", 'surprised');
    await S.say('farmer_mother', "We wanted to see where you work. The turnips will be fine. The neighbor's boy is minding them.");
    await S.say(S.is('seraphine') ? 'HERO' : 'seraphine', "I — I never told the Spire I was from a farm. I told them my father was a landowner. A *scholar*. I'm so sorry.", 'sad');
    await S.say('farmer_father', "Sera, love. Do you think we mind being turnip farmers? We grew *you.* That's the best crop anyone ever had.");
    var c = await S.choice('Seraphine wipes her eyes.', ['"I\'m proud of you, too."', '(Quietly give them a Starfruit Tart.)']);
    await S.say(S.is('seraphine') ? 'HERO' : 'seraphine', "I'm going to be Archmagister one day. And I'm going to invite you both to the ceremony. In your *good* boots.", 'happy');
    S.give('rod_open_archive', 1); S.done('pq_seraphine'); S.flag('pq_seraphine_done', 1); S.xp(3000); S.affinity('seraphine', 2);
  };
  DB.speakers.rowans_father = DB.speakers.rowans_father || { name: "Rowan's Father", npc: 'rowans_father' };
  /* place the personal-quest hotspots */
  DB.addNpc && (function () {
    DB.addNpc('saltmire', { id: 'vex_parents', sprite: 'farmer_mother', name: 'Fisher Couple', x: 560, y: 760, dir: 'right', wander: 0, talk: 'pq_vex', speaker: 'farmer_mother', cond: function (G) { return pqOK(G, 'vex', 13, 3) && G.quests.pq_vex !== 'done'; }, q: function () { return true; } });
    DB.addNpc('lumeria_gardens', { id: 'sera_parents', sprite: 'farmer_father', name: "Seraphine's Parents", x: 770, y: 520, dir: 'down', wander: 0, talk: 'pq_seraphine', speaker: 'farmer_father', cond: function (G) { return pqOK(G, 'seraphine', 16, 3) || G.quests.pq_seraphine === 'done'; }, q: function (G) { return G.quests.pq_seraphine !== 'done'; } });
    DB.maps.greythorn.objs = (DB.maps.greythorn.objs || []).concat([{ t: 'none', id: 'high_tree', x: 790, y: 300, scene: 'pq_rowan', cond: function (G) { return !!G.members.rowan && mqs(G) >= 9; } }]);
    DB.maps.frostmark.objs = (DB.maps.frostmark.objs || []).concat([{ t: 'none', id: 'brothers_anvil', x: 1180, y: 480, scene: 'pq_brakka', cond: function (G) { return !!G.members.brakka && mqs(G) >= 14; } }]);
    DB.maps.highcrest_countryside.objs = DB.maps.highcrest_countryside.objs.concat([{ t: 'none', id: 'edran_grave', x: 770, y: 490, scene: 'pq_caelan', cond: function (G) { return !!G.members.caelan && mqs(G) >= 22 && G.quests.pq_caelan !== 'done'; } }]);
  })();
  DB.speakers.tam = DB.speakers.tam || { name: 'Tam', npc: 'tam' };

  /* ---------- SQ19: Diary of the First Healer ---------- */
  QD('sq19', { name: 'The Diary of the First Healer', type: 'side', lv: 52, obj: function (G) { var n = DB.G.inv.maren_page || 0; return n >= 5 ? 'Read the pages at the campfire (center of the Wastes).' : 'Find the scattered diary pages in the Hollow Wastes (' + n + '/5).'; } });
  SC.sq19_start = async function (S) {
    await S.say('liora', "There are pages scattered across the Wastes. Written in a hand I almost know. The first Maren's diary. I think we should find them.", 'worried');
    S.quest('sq19'); S.despawn('sq19_start');
  };
  SC.sq19_read = async function (S) {
    var G = S.G, n = G.inv.maren_page || 0;
    if (n < 5) { await S.narr("The campfire's cold. You still need diary pages (" + n + "/5)."); return; }
    S.take('maren_page', 5); S.music('sad', 2);
    await S.narr("By the fire's light, the pages: a woman's neat hand. 'He asked me today whether it would be selfish to want just one thing for himself. I told him no. I did not tell him what I wanted.'");
    await S.narr("'I love him. Of course I do. And I am so afraid he will carry the Sun alone, because he has never once let any of us carry anything for him.'");
    await S.say(G.hero === 'liora' ? 'HERO' : 'liora', "*reading the last page aloud, voice unsteady* 'If you find this, whoever you are — love him anyway. Stop him, if you must. But love him anyway.'", 'sad');
    await S.narr("No one speaks for a long time. The fire gutters. Somewhere, very faintly, someone hums.");
    S.done('sq19'); S.xp(4000); S.give('elixir_dawn', 3); S.affinity('liora', 2);
  };

  /* ---------- SQ20: Marisol's Last Voyage ---------- */
  QD('sq20', { name: "Marisol's Last Voyage", type: 'side', lv: 55, obj: function (G) { var d = [G.flags.sq20_cake && 'cake', G.flags.sq20_bunt && 'bunting', G.flags.sq20_stew && 'stew'].filter(Boolean); return "Throw Marisol a surprise party: gather cake (Hettie, inn), bunting (Pip), stew (Bram, inn). Have: " + (d.join(', ') || 'nothing yet') + "."; } });
  hook('marisol_hub', async function (S) {
    var G = S.G;
    if (mqs(G) >= 25 && !G.quests.sq20 && G.flags.ship) {
      await S.say('marisol', "...Ember. Come here a second. I'm — I'll keep this short. When this is all over, I'm retiring. Twenty-eight years. The Gull needs a younger hand. Don't tell Hettie. She'll cry. Then she'll bake.");
      S.quest('sq20'); S.toast('Secretly throw Marisol a party! Talk to Hettie, Bram (inn), and Pip.', 'quest'); return true;
    }
    if (G.quests.sq20 === 'active' && G.flags.sq20_cake && G.flags.sq20_bunt && G.flags.sq20_stew) { await SC.sq20_party(S); return true; }
    return false;
  });
  hook('hettie_talk', async function (S) { var G = S.G; if (G.quests.sq20 === 'active' && !G.flags.sq20_cake) { await S.say('hettie', "A party for the Captain? I've had a cake on standby for six years. *beaming* Take it. Don't let her see."); S.flag('sq20_cake', 1); S.toast('Got: cake.', 'item'); return true; } return false; });
  hook('bram_talk', async function (S) { var G = S.G; if (G.quests.sq20 === 'active' && !G.flags.sq20_stew) { await S.say('bram', "The *better* good stew. For the Captain. I'll be on the deck at sundown."); S.flag('sq20_stew', 1); S.toast('Got: stew.', 'item'); return true; } return false; });
  hook('pip_talk', async function (S) { var G = S.G; if (G.quests.sq20 === 'active' && !G.flags.sq20_bunt) { await S.say('pip', "A SURPRISE PARTY?! *whispering at a volume that carries* Take this bunting! I made it myself! Unofficially!"); S.flag('sq20_bunt', 1); S.toast('Got: bunting.', 'item'); return true; } return false; });
  SC.sq20_party = async function (S) {
    var G = S.G; await S.fade(1, 800); S.tint('#ff8a3c', .12);
    await S.map('wandering_gull_deck', 'start'); S.partyAt(700, 640, 'right'); S.cam(767, 500, 0);
    ['pip', 'hettie', 'bram'].forEach(function (id, i) { S.spawn(id + '_p', id, 600 + i * 60, 520, 'down', { name: id }); });
    await S.fade(0, 800); S.music('festival', 2);
    await S.narr("Sundown on the Wandering Gull. Bunting on every spar. A cake the size of a hatch cover. The crew hides behind the mast.");
    S.walk('marisol', 790, 600, 40);
    await S.say('pip', "SURPRISE!", null);
    await S.say('marisol', "...What in the hells is all this? I'll have the lot of you keelhauled. *her voice cracks* ...The cake's *lopsided.*");
    await S.say('hettie', "It's love. It lists a little. It's *supposed* to.");
    if (DB.has('ship_bell')) { await S.narr("You hand her the bell from the Abyssal Trench. She goes very quiet."); await S.say('marisol', "My first ship's bell. Lost off the Deepwater Reach thirty years ago. *rings it once; it sings true* ...Fine. FINE. I love you all. Don't say anything. I hate this."); S.take('ship_bell', 1); }
    else await S.say('marisol', "I hate this. I hate every minute of this. *wipes her eyes with a sleeve* ...Thank you.");
    ['pip', 'hettie', 'bram'].forEach(function (id) { S.despawn(id + '_p'); });
    S.tint(null); S.done('sq20'); S.xp(4000); S.give('mead_mug', 3); S.affinity('liora', 1); S.camFollow();
    await S.fade(1, 600); await S.map('port_halcyon', 'dock'); await S.fade(0, 600);
  };

  /* ---------- Abyssal Trench ---------- */
  SC.trench_boss_intro = async function (S) {
    S.music('boss', 1); S.partyWalk(770, 220, 40); S.shake(6); S.tint('#1a3a7a', .22);
    await S.narr("At the bottom of the Trench, a shape unfolds from the dark — something older than the kingdoms above.");
    await S.boss('trench_leviathan', { lv: 52, x: 770, y: 120, onWin: 'trench_win' });
  };
  SC.trench_win = async function (S) {
    S.tint(null); S.healAll(); S.flag('trench_done', 1);
    await S.narr("The Leviathan sinks into the silt. In the coral where it slept lies a salt-scoured brass bell, still ringing true.");
    S.give('ship_bell', 1); S.xp(3000); S.gold(3000);
  };

  /* ---------- Hall of Echoes (post-game) ---------- */
  SC.hall_door = async function (S) {
    var G = S.G; if (!G.flags.ending_done) return;
    var c = await S.choice('A door of pale stone, humming with a hundred faint voices.', ['Enter the Hall of Echoes', 'Not now']); if (c !== 0) return;
    await S.fade(1, 800); S.tint(null); await S.map('hall_of_echoes', 'start');
  };
  SC.hall_leave = async function (S) {
    var c = await S.choice('Leave the Hall?', ['Leave (progress is kept)', 'Stay']); if (c !== 0) { S.partyAt(770, 900, 'up'); return; }
    S.save(); await S.fade(1, 600); await S.map('halcyon_lighthouse', 'start', { noMode: true }); await S.fade(0, 600);
  };
  var BOSS_FLOORS = { 10: 'coral_matriarch', 15: 'harpy_queen', 20: 'vashka', 25: 'lady_nyx', 30: 'gorran', 35: 'archive_guardian', 40: 'edran', 45: 'vaelthorn2', 50: 'shadow_sun' };
  var POOLS = [['void', 'shade'], ['ghost', 'veil'], ['ember', 'frost'], ['rootwraith', 'page'], ['ironcrab', 'smuggler'], ['void', 'ghost'], ['shade', 'veil'], ['ember', 'void']];
  var MEMORY = {
    10: "The Echo of the Wandering Gull: a girl with a glowing hand, a captain with a pipe, the first storm.",
    20: "The Echo of Port Halcyon: lanterns on the water, a boy named Pip, a lamp relit.",
    30: "The Echo of the Aurora: six hands raised to a sky that danced.",
    40: "The Echo of Highcrest: an oath, a sword, a master who would not stop being a knight."
  };
  SC.hall_begin = async function (S) {
    var G = S.G; if (!G.hallFloor) { G.hallFloor = 1; S.music('echoes', 2); await S.narr("The Hall of Echoes. A tower of memories. Fifty floors; every foe you faced, every moment you shared, waiting to be met again. At the top, something older than the Black Sun."); }
    S.camFollow(); return hallFloor(S, G.hallFloor);
  };
  function hallFloor(S, f) {
    var G = S.G, lv = Math.min(99, 60 + Math.floor(f * .8)); DB.ui.banner && DB.ui.banner('Floor ' + f, f % 10 === 0 ? 'A guardian waits' : 'The Hall of Echoes');
    S.ensureLevel(Math.min(70, 58 + Math.floor(f / 4)));
    if (BOSS_FLOORS[f]) { S.music('boss', 1); return S.boss(BOSS_FLOORS[f], { lv: lv, x: 770, y: 250, onWin: 'hall_clear' }); }
    var pool = POOLS[(f * 7) % POOLS.length], n = 3 + Math.floor(f / 8);
    return S.battle([{ type: pool[0], lv: lv, n: n, x: 770, y: 420 }, { type: pool[1], lv: lv, n: Math.max(2, n - 1), x: 770, y: 340 }], { onWin: 'hall_clear' });
  }
  SC.hall_clear = async function (S) {
    var G = S.G, f = G.hallFloor || 1;
    S.healAll(); S.xp(1200 + f * 220); S.gold(400 + f * 80); G.hallFloor = f + 1;
    if (f === 50) return SC.hall_final(S);
    if (MEMORY[f]) { S.music('sad', 1); await S.narr(MEMORY[f]); }
    if (f % 5 === 0) { S.give('elixir_dawn', 1); S.save(); }
    var c = await S.choice('Floor ' + f + ' cleared.', ['Ascend to floor ' + (f + 1), 'Leave the Hall (progress saved)']);
    if (c === 0) return hallFloor(S, f + 1);
    return SC.hall_leave(S);
  };
  SC.hall_final = async function (S) {
    var G = S.G; S.music('sunrise', 2); G.flags.hall_done = 1; S.flash('#fff2b0', 1200);
    await S.narr("The Shadow of the Black Sun — pure, mindless darkness, unattached to any grief — shrinks, flickers, and goes out.");
    await S.narr("In its place: six ghosts, and six living heroes, standing side by side. They look at each other for a long moment. Then — together, all twelve — they salute.");
    S.give('dawn_locket', 1); S.xp(20000);
    await S.card('THE HALL OF ECHOES', 'Complete', 3600);
    S.save(); return SC.hall_leave(S);
  };
})();
