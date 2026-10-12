/* Dawnbound - Act II part 1: Greythorn (Q7, Q8, Camp 1, SQ7, SQ8) */
(function () {
  'use strict';
  var DB = window.DB, SC = DB.scenes, QD = DB.quests.def;
  var mqs = function (G) { return G.flags.mq || 0; };

  QD('mq7', { name: 'The Silent Forest', type: 'main', lv: 12, obj: function (G) { return G.flags.rowan_met || G.hero === 'rowan' ? (G.flags.q7_village ? 'Enter Rotwood Hollow from the north end of Greythorn.' : 'Walk north through the forest to Greythorn village.') : 'Follow the path north from the shore into the Silent Forest.'; } });
  QD('mq8', { name: 'The Heart of Greythorn', type: 'main', lv: 14, obj: function (G) { return 'Fight through Rotwood Hollow (north of Greythorn) and heal the Old Stag.'; } });
  QD('mq9', { name: 'City of Lanterns and Liars', type: 'main', lv: 17, obj: 'Sail to Saltmire (menu → Map). Find the thief who stole the Compass of Dawn.' });

  SC.wilds_shore = async function (S) {
    var c = await S.choice('The Wandering Gull waits on the shore.', ['Set sail', 'Stay in the forest']);
    if (c === 0) { await S.sail(); } else { S.place('HERO', 780, 930, 'up'); S.partyAt(780, 920, 'up'); }
  };

  /* ---------- Q7: The Silent Forest ---------- */
  SC.q7_enter = async function (S) {
    var G = S.G; S.music('silent', 2); S.tint('#5a2d8a', .12);
    S.partyWalk(780, 700, 40);
    await S.narr("The Wandering Gull's lantern fades behind you. No birdsong. No wind. The trees are blackened, veined with violet. Somewhere, a branch creaks.");
    if (S.is('rowan')) {
      await S.say('rowan', "*kneels, touching the dirt* ...The tracks are wrong. Everything's wrong. Ash, stay close.");
      await S.narr("Ash presses against your leg, ears flat. At your feet, a black root twitches.");
      await S.say('rowan', "Hollow-root. Back off — slowly. It *grabs*.");
      S.flag('rowan_met', 1); S.flag('forest_known', 1);
      S.quest('mq7'); S.camFollow(); S.tint(null);
      DB.ui.hint('Hollow-roots grab ankles — fight them or step around. Head north to Greythorn village.'); setTimeout(function () { DB.ui.hint(null); }, 8000);
      return;
    }
    if (G.flags.rowan_early) {
      S.flag('rowan_met', 1); S.quest('mq7'); S.camFollow(); S.tint(null); G.hasAsh = true; DB.ui.invalidateParty();
      await S.say('rowan', "...It's so quiet. This is — this was my home. Ash, stay close. Hollow-roots grab ankles; keep to the path and I'll lead.", 'worried');
      await S.hsay({ _: "We'll get through it. Together." });
      S.ensureLevel(12); return;
    }
    S.sfx('arrow'); await S.wait(200); S.shake(3);
    await S.narr("THUNK. An arrow buries itself in the trunk an inch from your head.");
    await S.say('rowan', "Don't move. You're standing on a Hollow-root. It'll grab your ankle and drag you under.", null);
    await S.narr("You look down. A black root twitches against your boot.");
    S.spawnHero('rowan', 780, 600, 'down'); S.spawn('ash_n', 'ember_wolf', 820, 615, 'left', { name: 'Ash', tint: '#8a8f99', tintAmt: .5 });
    await S.partyWalk(780, 730, 30);
    await S.say('rowan', "...Sorry about the arrow. I don't really... talk to people. This is Ash. Ash, say hello.");
    await S.narr("Ash sniffs you and sneezes.");
    await S.say('rowan', "He likes you.");
    await S.hsay({ knight: "Then I'm in luck. I'm Caelan. I'm — I'm looking for others like me. With a mark.", healer: "Hello, Ash. *crouches, offers her hand* Hello, you handsome thing.", rogue: "Charming. Does he bite? Asking for a friend. The friend is me.", berserker: "A WOLF! Can I pet him? I'm going to pet him. I'm petting him.", mage: "A canine companion, a hunter with a bow, and a forest that has stopped making noise. Fascinating — and deeply unsettling." });
    await S.say('rowan', "*sees the glow beneath your glove, goes still, then slowly pulls off their own glove*", 'worried');
    await S.say('rowan', "I thought it was the forest's sickness. That I was turning into a Hollow-root too.");
    var lioraKnows = S.G.members.liora;
    if (lioraKnows) await S.say('liora', "Oh, honey, no. You're one of us.", 'happy');
    else await S.hsay({ _: "It isn't. You're one of us." });
    await S.say('rowan', "...Us.", 'happy');
    S.despawn('rowan'); S.despawn('ash_n');
    if (!G.members.rowan) S.join('rowan'); else { DB.join('rowan'); DB.ui.invalidateParty(); }
    G.hasAsh = true; DB.ui.invalidateParty();
    await S.say('rowan', "Ash fights with me. And the paths — I know them. Come on. The village is north. It's... I don't know what's left of it.");
    S.flag('rowan_met', 1); S.quest('mq7'); S.camFollow(); S.tint(null); S.ensureLevel(12);
    S.toast('Ash fights beside Rowan as a summoned companion.', 'quest');
  };
  SC.q7_village = async function (S) {
    var G = S.G; S.flag('q7_village', 1); S.partyWalk(760, 580, 40);
    S.cam(740, 520, 700);
    if (S.is('rowan')) {
      /* HOMECOMING VARIANT B */
      await S.narr("Greythorn. Your home. The village is empty. Rope ladders lead up into the canopy; every door is barred.");
      await S.say('brannoch', "Rowan. *wipes his eyes* By the Old Stag, you look like your father. Same eyes. Same stubborn chin.", 'happy');
      await S.say('rowan', "Elder. What happened here?");
      await S.say('brannoch', "The Stag. The forest spirit. It's been twisted by the dark — Hollow-roots grow where its blessing used to. We moved everyone into the treehouses. The Stag sits in the Rotwood Hollow to the north, and every hunter we send in comes back... changed.");
      await S.say('brannoch', "Your father went in, years ago. We never found him. But — his horn. We found it at the Hollow's mouth. I think he left it for you.");
      S.flag('horn_known', 1);
    } else {
      await S.narr("Greythorn: a village built into the great trees, rope bridges strung between treehouses. Every door is barred.");
      await S.say('rowan', "...Elder Brannoch? It's me.");
      await S.say('brannoch', "Rowan! Thank the roots. And these must be the friends you wrote about. *peers at your hand* ...Marked ones. So the old stories were true.", 'happy');
      await S.say('brannoch', "The forest spirit — the Old Stag — has been twisted by the dark. Hollow-roots grow where its blessing used to. We've moved everyone into the treehouses. Every hunter who enters the Rotwood Hollow to the north comes back... changed.");
      await S.say('rowan', "I'll go. It's my forest.");
      await S.hsay({ knight: "Not alone. We go together.", healer: "We're coming with you. All of us.", rogue: "I've never seen a haunted tree. I'm... curious.", berserker: "A corrupted forest god?! Finally, an opponent!", mage: "A spirit warped by the Black Sun — the Hollow King's reach is longer than the Order believes." });
    }
    S.done('mq7'); S.mq(8); S.quest('mq8'); S.xp(600); S.healAll(); S.ensureLevel(14); S.camFollow();
    S.toast('Rotwood Hollow is open — north end of the village.', 'quest');
  };
  SC.brannoch_talk = async function (S) {
    var G = S.G, mq = mqs(G);
    if (mq === 7 && !G.flags.q7_village) return SC.q7_village(S);
    if (G.flags.q8_done) { await S.say('brannoch', "Listen. Birds. I'd forgotten the sound. Thank you, all of you."); return; }
    var c = await S.choice('Elder Brannoch watches the canopy.', ['Rest in a treehouse (free) and save', 'Chat', 'Never mind']);
    if (c === 0) return DB.menus.inn(0);
    if (c === 1) await S.say('brannoch', mq >= 8 ? "The Hollow is north. Mind the roots. And, Rowan... look after your friends." : "Welcome to Greythorn, such as it is.");
  };
  SC.q8_horn = async function (S) {
    S.flag('horn_found', 1);
    await S.narr("At the Hollow's mouth, hung on a root, is a worn bone hunting horn.");
    await S.say('rowan', "*touches it with shaking fingers* Father's horn. He never went anywhere without it. ...He left it for me. I know he did.");
    S.give('hunting_horn', 1); S.toast("Rowan's Father's Hunting Horn obtained.", 'quest');
  };
  SC.q8_boss_intro = async function (S) {
    S.music('boss', 1); S.partyWalk(780, 340, 40); S.shake(5); S.sfx('roar'); S.tint('#6a2bd0', .16);
    await S.narr("At the root-throne's heart, the Old Stag stands — antlers black and weeping violet light. It turns its head, and its eyes are hollow.");
    await S.say('rowan', "...It doesn't know me. It doesn't know any of us. Ash — stay back.");
    await S.boss('hollowed_stag', { lv: 16, x: 780, y: 170, onWin: 'q8_win' });
  };
  SC.q8_win = async function (S) {
    S.tint(null); S.music('sad', 2); S.healAll(); S.flag('q8_done', 1);
    await S.narr("As the Stag falls, light pours from its antlers. Violet becomes gold. The roots uncurl and turn green.");
    await S.say('stag', "Little sapling. You grew.");
    await S.say('rowan', "...Father?", 'surprised');
    await S.say('stag', "When the darkness came to the forest, your father walked into my heart to hold it back. He has been holding it back all these years. He is part of the forest now. He is the wind in the high branches. He is the warmth of the den.");
    await S.narr("The great Stag lowers its head to Rowan's.");
    await S.say('stag', "He was so proud of you. He is still.");
    await S.narr("Rowan breaks down, clutching Ash. You kneel beside them.");
    var c = S.is('rowan')
      ? await S.choice('The Stag waits.', ['"Father. I\'m here. I\'m home."', '(Silently press your forehead to the Stag\'s.)'])
      : await S.choice('Rowan is shaking.', ['"He never left you."', '(Silently hold Rowan.)']);
    if (S.is('rowan')) { if (c === 0) await S.say('rowan', "I'm home. I kept going. I kept going, like you taught me.", 'sad'); else await S.narr("The wind in the high branches stirs, gentle as a hand in your hair."); }
    else if (c === 0) await S.say('rowan', "...He didn't. He was right here.", 'sad');
    else await S.narr("Rowan leans on you without a word, and you stay as long as they need.");
    S.affinity('rowan', 3);
    S.done('mq8'); S.mq(9); S.quest('mq9'); S.xp(1500); S.ensureLevel(16);
    await S.say(null, "Far above, one bird sings. Then another. The forest remembers how.");
    S.give('stag_charm', 1); S.fade(1, 700); await S.wait(800);
    await S.map('campfire_clearing', 'start', { noMode: true }); await SC.camp1(S);
  };

  /* ---------- Camp scene 1 ---------- */
  SC.camp1 = async function (S) {
    S.flag('camp1', 1); S.music('camp', 2); S.tint('#ff8a3c', .12); S.partyRing(767, 470, 60); S.cam(767, 440, 0);
    await S.fade(0, 900);
    await S.narr("Night. A little fire. Liora cooks, Rowan feeds Ash scraps of dried meat, and you sit between them.");
    var lioraH = S.G.members.liora, ro = S.G.members.rowan;
    if (S.is('liora')) await S.hsay({ healer: "So! Favorite food. Go." });
    else await S.say('liora', "So! Favorite food. Go.", 'happy');
    await S.say('rowan', "...Honeyed trout.");
    if (S.is('liora')) await S.hsay({ healer: "Mine's Hettie's blackberry pie. Obviously. And you?" }, 'happy');
    else await S.say('liora', "Mine's Hettie's blackberry pie. Obviously.", 'happy');
    if (S.is('liora')) { await S.narr("She looks at you, expecting a different answer. Rowan clears their throat. 'Obviously.'"); }
    else {
      await S.say('liora', "And you?");
      await S.hsay({ knight: "Barracks porridge. ...Don't laugh. It reminds me of home.", rogue: "Anything I didn't have to steal.", berserker: "All of it. Every food. Forever.", mage: "Lumerian starfruit tart. You wouldn't have heard of it.", hunter: "Honeyed trout. Same as Rowan. No — that's my line." });
    }
    await S.say('rowan', "*small smile* ...This is nice. I never had a campfire with friends before.", 'happy');
    await S.say('liora', "Well, you do now. Get used to it.", 'happy');
    await S.narr("For a while no one says anything. The fire pops. Ash snores. The Dawnmarks glow, soft as embers.");
    S.affinity('liora', 1); S.affinity('rowan', 1);
    S.tint(null); S.save(); S.healAll();
    await S.fade(1, 700); await S.map('greythorn', 'plaza'); S.partyAt(780, 600, 'down'); await S.fade(0, 600);
    S.camFollow(); S.toast('Sail to Saltmire: open the menu → Map.', 'quest');
  };

  /* ---------- SQ7: Ash's Lost Sister ---------- */
  QD('sq7', { name: "Ash's Lost Sister", type: 'side', lv: 13, obj: 'Track Ember, Ash\'s sister, through the Silent Forest (northeast, near the cave).' });
  SC.sq7_start = async function (S) {
    await S.say('rowan', "*kneeling beside Ash, quietly* There's something I never told you. Ash had a littermate. Ember. When the Silence came, she ran. I've looked for her every night since.");
    await S.say('rowan', "...Ash keeps looking northeast. Toward the old cave. Would you... would you help me?");
    S.quest('sq7');
  };
  SC.sq7_found = async function (S) {
    S.flag('ember_found', 1); S.partyWalk(1340, 230, 40);
    S.spawn('ember_w', 'ember_wolf', 1400, 160, 'left', { name: 'Ember' });
    await S.narr("A pack of grey wolves steps out of the cave mouth. In front stands one with a pale white streak down her muzzle — Ash's twin.");
    await S.say('rowan', "...Ember.");
    await S.narr("Ash trots forward. Ember lowers her head. They touch noses. Then they run, tails wagging, in a wide circle through the ferns.");
    await S.say('rowan', "She's the pack leader. *laughs, wiping their face* Of course she is. She was always the bossy one.");
    await S.narr("Ember pauses, looks at Rowan, and bows once. Then the pack melts into the trees.");
    S.done('sq7'); S.xp(700); S.give('wolf_fang', 1); S.affinity('rowan', 2); S.despawn('ember_w'); S.camFollow();
  };
  DB.speakers.ash = { name: 'Ash', npc: 'ember_wolf' };

  /* ---------- SQ8: Woodcarver's Last Commission ---------- */
  QD('sq8', { name: "The Woodcarver's Last Commission", type: 'side', lv: 15, obj: 'Gather 3 Rare Heartwood in the Silent Forest and bring them to the old woodcarver.' });
  SC.woodcarver_talk = async function (S) {
    var G = S.G;
    if (G.quests.sq8 === 'done') { await S.say('woodcarver', "*the statue gleams in the lantern light* Greythorn's founder. Finished. I can go now. Not yet, though. Tea first."); return; }
    if (G.quests.sq8 === 'active') {
      if (DB.has('heartwood', 3)) {
        S.take('heartwood', 3);
        await S.say('woodcarver', "*runs a thumb along the grain* Oh, this is the good stuff. Fifty years I've waited for a log like this. Watch.");
        await S.narr("The old man carves all night. By morning, a statue of a smiling woman with a bow stands in the plaza.");
        await S.say('woodcarver', "Greythorn's founder. Finished. *whispers* Now I can retire.");
        S.done('sq8'); S.xp(800); S.give('elven_cloak', 1); return;
      }
      await S.say('woodcarver', "Three pieces of heartwood, my dear. Dark, dense, fragrant. They're in the Silent Forest, where the roots haven't spoiled them."); return;
    }
    await S.say('woodcarver', "I've been working on a statue of Greythorn's founder for fifty years. I won't live to see another winter, and I haven't the wood. Heartwood — three pieces. Could you...?");
    var c = await S.choice('The old woodcarver looks hopeful.', ['I\'ll find the heartwood', 'Not now']);
    if (c === 0) S.quest('sq8');
  };
})();
