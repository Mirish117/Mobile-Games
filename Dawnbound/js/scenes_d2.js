/* Dawnbound - Act V: The Black Sun Citadel (Q23-Q26) */
(function () {
  'use strict';
  var DB = window.DB, SC = DB.scenes, QD = DB.quests.def;
  var mqs = function (G) { return G.flags.mq || 0; };
  DB.speakers.maren_first = { name: 'Ghost of Maren', npc: 'liora_starter' };
  DB.speakers.young_vael = { name: 'Young Vaelthorn', npc: 'squire' };

  QD('mq23', { name: 'Across the Dead Sea', type: 'main', lv: 50, obj: 'Talk to Captain Marisol on the Halcyon docks and set sail for the Hollow Wastes.' });
  QD('mq24', { name: 'The Hollow Wastes', type: 'main', lv: 52, obj: function (G) { return !G.flags.q24_start ? 'Walk into the Hollow Wastes.' : 'Enter the Sunken Kingdom of Vael (northeast corner of the Wastes).'; } });
  QD('mq25', { name: 'Return of the Heralds', type: 'main', lv: 55, obj: function (G) { var d = ['tides', 'veils', 'ash', 'oaths'].filter(function (k) { return G.flags['tower_' + k]; }).length; return !G.flags.q25_start ? 'Enter the Black Sun Citadel.' : d < 4 ? 'Clear the four towers (' + d + '/4): Tides, Veils, Ash, Oaths.' : 'Open the doors to the Throne of Swords.'; } });
  QD('mq26', { name: 'The Hollow King', type: 'main', lv: 60, obj: 'End it.' });

  SC.wastes_shore = async function (S) { var c = await S.choice('The Gull waits in the dark water.', ['Sail away', 'Stay']); if (c === 0) await S.sail(); else S.partyAt(770, 920, 'up'); };
  SC.trench_leave = SC.wastes_shore;

  /* ---------- Q23: Naval battle ---------- */
  SC.q23_sail = async function (S) {
    var G = S.G; await S.fade(1, 900); S.tint('#1a1a4a', .3); S.music('boss', 2);
    await S.map('wandering_gull_deck', 'start'); S.partyAt(700, 640, 'right'); S.cam(767, 500, 0);
    var m = S.ent('marisol'); if (m) m.scripted = true;
    await S.fade(0, 900);
    await S.narr("The Wandering Gull sails into permanent night. The Hollow Wastes rise on the horizon: black glass, broken cities. And between you and the shore — ghost lights.");
    await S.say('marisol', "Vashka's ghost-fleet! All hands! They're boarding!");
    S.camFollow(); S.shake(4); S.sfx('quake');
    await S.battle([{ type: 'ghost', lv: 50, n: 4, x: 700, y: 400 }, { type: 'tidespawn', lv: 50, n: 3, x: 900, y: 450 }], { onWin: 'q23_w2' });
  };
  SC.q23_w2 = async function (S) {
    await S.battle([{ type: 'ghost', lv: 51, n: 5, x: 767, y: 380 }, { type: 'tidespawn', lv: 51, n: 3, x: 500, y: 480 }], { onWin: 'q23_w3' });
  };
  SC.q23_w3 = async function (S) {
    S.shake(6);
    await S.narr("The deck lurches. A ghost-ship rams the Gull's flank. Marisol is thrown against the wheel — blood on her sleeve.");
    await S.say('marisol', "Twenty-eight years at sea. I'm not letting some drowned witch be the one to sink me. GO, Ember! I'll keep her afloat till you're back!");
    await S.battle([{ type: 'ghost', lv: 52, n: 6, x: 767, y: 400 }, { type: 'void', lv: 52, n: 2, x: 600, y: 420 }], { onWin: 'q23_done' });
  };
  SC.q23_done = async function (S) {
    var G = S.G; S.healAll(); S.tint(null); S.flag('marisol_wounded', 1);
    await S.narr("The last ghost-ship breaks apart into foam. The Hollow Wastes loom — black glass beneath an eclipsed sun.");
    S.done('mq23'); S.mq(24); S.quest('mq24'); S.xp(3000); S.ensureLevel(52);
    await S.fade(1, 900); await S.map('hollow_wastes', 'start'); S.partyAt(770, 930, 'up'); await S.fade(0, 900); S.camFollow();
    S.save(); S.toast('Marisol holds the Gull at the shore. Walk into the Wastes.', 'quest');
  };
  SC.q24_start = async function (S) {
    S.flag('q24_start', 1); S.music('wastes', 2); S.tint('#6a2bd0', .14);
    await S.narr("The Hollow Wastes. A dead continent beneath a black sun. Glass, ash, silence. Every footstep echoes for a hundred years.");
    await S.say('seraphine', "The Sunken Kingdom of Vael — the old capital. It's northeast, where the glass is cracked. If Vaelthorn kept anything of himself, it's there.");
    S.toast('Find the Sunken Kingdom of Vael — northeast corner.', 'quest');
  };

  /* ---------- Q24: Sunken Kingdom of Vael ---------- */
  function ghostSpawn(S, id, sprite, x, y, dir, name) { return S.spawn(id, sprite, x, y, dir, { name: name, tint: '#9ad4ff', tintAmt: .45, alpha: .75 }); }
  SC.q24_echo1 = async function (S) {
    S.flag('echo1', 1); S.partyWalk(770, 700, 30); S.tint('#6a8aff', .12);
    await S.narr("In the black glass beneath your feet, a memory plays.");
    ghostSpawn(S, 'e_boy', 'squire', 770, 640, 'down', 'Young Vaelthorn'); ghostSpawn(S, 'e_dad', 'varric', 770, 590, 'up', 'The King');
    await S.say('e_dad'.replace('e_dad', 'varric'), "...Today you are a man, Vael. Take it. It belonged to my father. It will belong to your children.", null);
    await S.narr("A boy, no more than twelve, receives a sword he can barely lift. He laughs, then tries to hide it.");
    S.despawn('e_boy'); S.despawn('e_dad'); S.tint(null); S.camFollow();
  };
  SC.q24_echo2 = async function (S) {
    S.flag('echo2', 1); S.partyWalk(770, 580, 30); S.tint('#6a8aff', .12);
    await S.narr("A campfire, flickering in the glass. Six figures laugh around it — the exact same scene as the party's own.");
    ['caelan', 'liora', 'vex', 'rowan', 'brakka', 'seraphine'].forEach(function (h, i) { ghostSpawn(S, 'f_' + h, h + '_starter', 700 + i * 24, 520 + (i % 2) * 20, 'down', DB.heroes[h].short); });
    await S.say('liora', "...They were just like us.", 'sad');
    await S.say('caelan', "Then we can be what he couldn't.");
    ['caelan', 'liora', 'vex', 'rowan', 'brakka', 'seraphine'].forEach(function (h) { S.despawn('f_' + h); }); S.tint(null); S.camFollow();
  };
  SC.q24_echo3 = async function (S) {
    S.flag('echo3', 1); S.partyWalk(1020, 410, 30); S.tint('#6a8aff', .12);
    await S.narr("A garden in the glass. A woman with a gentle face braids flowers into a young man's hair, while he pretends not to enjoy it.");
    ghostSpawn(S, 'e_m', 'liora_starter', 1000, 340, 'down', 'The First Maren'); ghostSpawn(S, 'e_v', 'squire', 1030, 360, 'left', 'Vaelthorn');
    await S.say('maren_first', "Hold still, Vael. You look like a very handsome meadow.");
    await S.say('young_vael', "I'm the King's heir. I'm not supposed to be a meadow.");
    await S.say('maren_first', "Nobody's supposed to be anything. Not when they're loved.");
    S.despawn('e_m'); S.despawn('e_v'); S.tint(null); S.camFollow();
  };
  SC.q24_echo4 = async function (S) {
    S.flag('echo4', 1); S.partyWalk(770, 330, 30); S.tint('#2a1a5a', .3); S.music('sad', 2);
    await S.narr("The last echo. A figure in black glass, alone in the dark. His mouth shapes names. No sound. For years.");
    await S.say('vaelthorn', "Maren. Caelen. Yssa. Torrin. Bray. Lysa. ...Maren. Maren. *Maren.*");
    await S.narr("He screams their names. Nothing answers. The echo keeps repeating, over and over, until it breaks.");
    await S.say('liora', "*quietly, crying* ...He didn't want to be alone.", 'sad');
    S.tint(null); S.camFollow();
  };
  SC.q24_boss_intro = async function (S) {
    S.music('boss', 1); S.partyWalk(770, 220, 40); S.tint('#6a2bd0', .14); S.shake(5);
    await S.narr("The throne of Vael. Six ghosts rise from its steps — armored in light, faces half-remembered. The Echo of the First Six.");
    await S.boss('echo_hero', { lv: 55, x: 770, y: 130, onWin: 'q24_win' });
  };
  SC.q24_win = async function (S) {
    S.tint(null); S.music('sad', 2); S.healAll();
    await S.narr("The echoes bow, one by one. The last to speak is a woman with a gentle face.");
    await S.say('maren_first', "Please. Free him. He's been alone so long.");
    S.done('mq24'); S.mq(25); S.quest('mq25'); S.xp(4000); S.ensureLevel(55); S.camFollow();
    S.toast('The Citadel gates are open. Return to the Wastes and go north.', 'quest'); S.save();
  };

  /* ---------- Q25: the four towers ---------- */
  SC.q25_start = async function (S) {
    S.flag('q25_start', 1); S.music('citadel', 2); S.partyWalk(770, 680, 40);
    await S.narr("The Black Sun Citadel. Four towers rise at its corners, each humming with a different shade of dark. At the center, great doors — sealed.");
    await S.say('seraphine', "The seal answers to the four towers. The Heralds' echoes are inside, revived. We have to break each one — separately, so the Covenant can't pull on all six of us at once.");
    await S.say('caelan', "Pairs. Vex and the hero, Tides and Veils. Brakka and Rowan, Ash. I'll take the Oaths alone.");
    await S.say('brakka', "ALONE? He's — Caelan, that's — ");
    await S.say('caelan', "It's his tower. Edran's. I need to be the one.");
    S.toast('Four towers: Tides (NW), Veils (NE), Ash (SW), Oaths (SE).', 'quest'); S.camFollow();
  };
  SC.q25_tides = async function (S) {
    var G = S.G; S.music('boss', 1); S.partyWalk(770, 330, 40);
    await S.say('vashka', "*rising from the water, wreathed in drowned robes* You came for the little fish again. How *faithful* you are, darling.");
    await S.boss('vashka', { lv: 55, x: 770, y: 170, onWin: 'q25_tides_win' });
  };
  SC.q25_tides_win = async function (S) { await endTower(S, 'tides', "The water goes still. Vashka's laugh dissolves into the sound of rain."); };
  SC.q25_veils = async function (S) {
    S.music('boss', 1); S.partyWalk(770, 330, 40);
    await S.say('nyx', "I've worn so many faces. Yours, I think, will be my masterpiece.");
    await S.boss('lady_nyx', { lv: 56, x: 770, y: 170, onWin: 'q25_veils_win' });
  };
  SC.q25_veils_win = async function (S) {
    var G = S.G;
    S.spawn('nyx_d', 'lady_nyx', 770, 230, 'down', { name: 'Lady Nyx' });
    await S.say('nyx', "*dying, on one knee* ...Your mother was a lovely mask, little thief. The best one I ever wore.");
    await S.say('vex', "*dagger raised, steady* This is for every face you ever stole.");
    await S.narr("The dagger falls. For once, nothing in the mirror moves.");
    S.despawn('nyx_d'); S.affinity('vex', 2);
    await endTower(S, 'veils', "The Tower of Veils falls silent. Even the mirrors are only mirrors again.");
  };
  SC.q25_ash = async function (S) {
    S.music('boss', 1); S.partyWalk(770, 330, 40);
    await S.say('gorran', "*cinders spilling* Burn. All of it. The Hollow King wants it quiet.");
    await S.say('brakka', "I've learned a new word since we last met, Gorran. The word is 'no.'");
    await S.boss('gorran', { lv: 56, x: 770, y: 170, onWin: 'q25_ash_win' });
  };
  SC.q25_ash_win = async function (S) { await endTower(S, 'ash', "Gorran falls into ash for the last time. Rowan lays a hand on Brakka's shoulder; neither says anything."); };
  SC.q25_oaths = async function (S) {
    var G = S.G; S.flag('tower_oaths_enter', 1); S.partyWalk(770, 340, 30); S.music('sad', 2);
    await S.narr("The Tower of Oaths. Empty. Silent. At its center, on a stand of black glass, only a suit of silver armor — Edran's.");
    await S.say('caelan', "...Master.");
    await S.narr("No fight. Caelan lays a single white flower at the armor's feet. A long, quiet moment. The only sound is the wind in the empty halls.");
    await S.say('caelan', "I'll do right by them. By all of them. Rest.");
    await endTower(S, 'oaths', "The tower is silent. For a little while, the Citadel is quieter than it has ever been.");
  };
  async function endTower(S, key, text) {
    var G = S.G; S.flag('tower_' + key, 1); S.healAll(); S.music('citadel', 2);
    await S.narr(text); S.xp(2500);
    S.restoreParty(); G.partyBackup = null; DB.ui.invalidateParty();
    await S.fade(1, 700); await S.map('black_sun_citadel', 'hub'); await S.fade(0, 700); S.camFollow();
    var done = ['tides', 'veils', 'ash', 'oaths'].filter(function (k) { return G.flags['tower_' + k]; }).length;
    S.toast('Tower silenced (' + done + '/4).', 'quest');
    if (done === 4) { return SC.q25_reunite(S); }
  }
  SC.q25_reunite = async function (S) {
    var G = S.G; if (G.flags.q25_reunite) return; S.flag('q25_reunite', 1);
    S.partyAt(770, 600, 'up');
    await S.narr("The four towers fall silent. At the heart of the Citadel, the great doors groan open.");
    await S.say('rowan', "...He's waiting.");
    S.done('mq25'); S.mq(26); S.quest('mq26'); S.xp(5000); S.ensureLevel(58); S.healAll(); S.camFollow(); S.save();
    S.toast('The Throne of Swords lies north.', 'quest');
  };

  /* ---------- Q26: The Hollow King ---------- */
  SC.q26_throne = async function (S) {
    var G = S.G; S.flag('q26_started', 1); S.music('sad', 2); S.partyWalk(770, 600, 30); S.tint('#6a2bd0', .1); S.cam(770, 420, 900);
    await S.narr("The Throne of Swords. Vaelthorn sits on a seat of fused blades — the swords of his fallen companions. Above him, the Black Sun burns through the ceiling.");
    S.spawn('vael_t', 'vaelthorn_armored', 770, 180, 'down', { name: 'Vaelthorn' });
    await S.say('vaelthorn', "You came back. All six. I'm almost proud. *rises* I watched you. In the Wastes, in the glass. I saw your campfires. Your feasts. Your songs under the aurora. *his voice breaks for the first time* We had all of that. And I lost it. And you will too. Every bond you've made is a wound waiting to open. Let me spare you. Please.");
    await S.hsay({ _: "The pain is the proof it was real." });
    await S.say('vaelthorn', "The pain is the *price*. And it is too high.");
    await S.hsay({
      knight: "My teacher died so I could choose. You won't take that from anyone.",
      healer: "I couldn't save my brother. It hurts every day. But I'd never trade loving him to stop the hurt.",
      rogue: "I spent my whole life being used. Your 'peace' is just another chain. I'm done with chains.",
      hunter: "My father's still here. In the forest. In me. Loss doesn't end love. You just forgot.",
      berserker: "I hurt my brother. And he forgave me. That's only possible because we're free. Free to fail. Free to forgive.",
      mage: "You want a world without pain. That's a world without learning, without growing. I'd rather be wrong and free."
    });
    if ((G.noCount || 0) >= 3) await S.hsay({ _: "You asked me to give up three times. I said no every time. I'll say it again." });
    await S.say('vaelthorn', "Then I will show you what three hundred years looks like.");
    S.despawn('vael_t'); S.tint(null); S.camFollow();
    DB.ui.hint('PHASE 1 — The Dark Lord. Dodge the red markings.'); setTimeout(function () { DB.ui.hint(null); }, 5000);
    await S.boss('vaelthorn1', { lv: 60, x: 770, y: 200, onWin: 'q26_phase2' });
  };
  SC.q26_phase2 = async function (S) {
    S.healAll(); S.music('finalboss', 1); S.shake(10); S.sfx('quake');
    S.spawn('vael_t', 'vaelthorn_dawnking', 770, 200, 'down', { name: 'Vaelthorn' }); S.partyWalk(770, 560, 30);
    await S.narr("The armor shatters. Beneath it, a man in gold — Vaelthorn, the Dawn-King, as he was. He lifts a sword that is not his own, and then a bow, and then a staff — each belonging to someone he lost.");
    await S.say('vaelthorn', "I remember all of them. I remember how they fought. Do you want to see?");
    S.despawn('vael_t');
    DB.ui.hint('PHASE 2 — The Dawn-King fights with the techniques of the First Six.'); setTimeout(function () { DB.ui.hint(null); }, 5000);
    await S.boss('vaelthorn2', { lv: 60, x: 770, y: 200, onWin: 'q26_phase3' });
  };
  SC.q26_phase3 = async function (S) {
    S.healAll(); S.flash('#ffffff', 900); S.shake(12); S.sfx('quake');
    await S.narr("The Dawn-King staggers. The Black Sun leans down through the ceiling — and swallows him. Vaelthorn's form unmakes into a violet-ringed hole in the sky. The floor of the Throne room cracks and floats away in pieces.");
    await S.fade(1, 800); await S.map('black_sun_sky', 'start'); S.partyAt(770, 780, 'up'); await S.fade(0, 900);
    DB.ui.hint('PHASE 3 — The Black Sun. Fight on the floating fragments!'); setTimeout(function () { DB.ui.hint(null); }, 6000);
    await S.boss('vaelthorn3', { lv: 60, x: 770, y: 250, thresholds: [{ at: .22, scene: 'q26_reach' }], onWin: 'q26_sunrise' });
  };
  SC.q26_reach = async function (S) {
    var G = S.G; S.music(null); S.shake(14); S.flash('#2a0050', 1000);
    await S.narr("At the climax, the Black Sun overwhelms the party. One by one, they fall. The HERO is the last standing, kneeling, the Dawnmark guttering.");
    await S.wait(1200);
    await S.say('liora', "We're here.", null);
    await S.say('rowan', "We're still here.", null);
    await S.say('vex', "Get up, hero. We've got a bet riding on you.", null);
    await S.say('brakka', "STAND, FRIEND!", null);
    await S.say('seraphine', "The equation needs all six. *Get up.*", null);
    await S.say('caelan', "Together. Always.", null);
    await S.narr("And beyond them, faint and far away — Elder Maren, Sir Edran, Rowan's father, Tam, and the ghosts of the first six.");
    await S.say('maren', "Reach for them, Ember.");
    S.music('finalboss', 2);
    await S.narr("The HERO reaches out. Five hands grab theirs. All six Dawnmarks blaze as one. The screen floods gold.");
    S.flash('#fff2b0', 1800); S.sfx('dawnmark_burst');
    var ok = await S.qte({ seconds: 6, label: 'DAWNBOUND' });
    var names = { caelan: 'OATHKEEPER!', liora: 'GENTLE DAWN!', vex: 'LAST GAMBIT!', rowan: 'SPIRIT OF GREYTHORN!', brakka: 'HEART OF THE STORM!', seraphine: 'STARFALL EQUATION!' };
    for (var i = 0; i < DB.HERO_IDS.length; i++) { var id = DB.HERO_IDS[i]; await S.say(id, names[id], null); S.flash('#ffe9a0', 280); S.sfx('dawnmark_burst'); }
    var b = DB.combat.boss; if (b) { b.hp = 0; DB.combat.enemyDown(b); }
  };
  SC.q26_sunrise = async function (S) {
    var G = S.G; S.healAll(); S.music('sunrise', 3);
    await S.flash('#ffffff', 1600);
    await S.narr("The Black Sun cracks. Violet light turns gold. For the first time in centuries, real sunlight pours into the Hollow Wastes.");
    S.spawn('vael_end', 'vaelthorn_dawnking', 770, 420, 'down', { name: 'Vaelthorn', alpha: 1 });
    DB.HERO_IDS.forEach(function (h, i) { S.spawn('g_' + h, h + '_starter', 650 + i * 46, 360 + (i % 2) * 40, 'down', { name: DB.heroes[h].short, tint: '#ffe9a0', tintAmt: .35, alpha: .75 }); });
    await S.narr("Vaelthorn lies on the broken floor, armor gone, a young man again. The ghosts of the first six — his friends — kneel around him.");
    await S.say('vaelthorn', "*looking at them, tears streaming* ...You're here.");
    await S.say('maren_first', "We never left, you foolish boy. You just stopped looking.");
    await S.say('vaelthorn', "*to the HERO* You did what I couldn't. You didn't carry it alone.");
    await S.hsay({ _: "You weren't supposed to either." });
    await S.say('vaelthorn', "...Thank you, Ember. *he closes his eyes* It doesn't hurt anymore.");
    await S.narr("He fades into light with his friends, smiling.");
    S.despawn('vael_end'); DB.HERO_IDS.forEach(function (h) { S.despawn('g_' + h); });
    S.done('mq26'); S.flag('ending_done', 1); S.xp(10000); S.ensureLevel(60);
    await S.fade(1, 1500, '#fff6d0');
    if (DB.cin && DB.cin.ending) await DB.cin.ending(S); else await S.card('DAWNBOUND', 'Thank you for playing', 4000);
    if (DB.cin && DB.cin.credits) await DB.cin.credits(S);
    await S.map('port_halcyon', 'dock'); S.partyAt(1000, 790, 'up'); S.tint(null); await S.fade(0, 1200); S.camFollow();
    S.toast('The Hall of Echoes has opened in the Halcyon lighthouse. New Game+ is now available.', 'quest');
    DB.meta && DB.meta.set('cleared', G.hero); S.save();
  };
})();
