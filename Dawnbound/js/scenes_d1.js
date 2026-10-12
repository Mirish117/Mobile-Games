/* Dawnbound - Act IV: The Fall of Highcrest (Q18-Q22, SQ16-SQ18) */
(function () {
  'use strict';
  var DB = window.DB, SC = DB.scenes, QD = DB.quests.def;
  var mqs = function (G) { return G.flags.mq || 0; };
  DB.speakers.varric = { name: 'Lord Varric', npc: 'varric' };

  QD('mq18', { name: 'The Silver Oath', type: 'main', lv: 40, obj: function (G) { return !G.flags.q18_met ? 'Sail to Highcrest and enter the capital.' : !G.flags.q18_balcony ? 'Go to the castle steps (north end of the city).' : 'Rest at the Silver Stag inn. The Hollow King will not wait.'; } });
  QD('mq19', { name: 'The Knight Who Fell', type: 'main', lv: 42, obj: 'Defend the Highcrest walls.' });
  QD('mq20', { name: 'Highcrest Burns', type: 'main', lv: 45, obj: 'Survive.' });
  QD('mq21', { name: 'Alone', type: 'main', lv: 45, obj: function (G) { return G.flags.q21_done ? 'Reach for them.' : 'Wake. Walk north through the ruins. Keep going.'; } });
  QD('mq22', { name: 'Gathering the Embers', type: 'main', lv: 47, obj: function (G) { var f = []; ['liora', 'rowan', 'vex', 'brakka', 'seraphine', 'caelan'].forEach(function (id) { if (G.hero !== id && !G.flags['found_' + id]) f.push(DB.heroes[id].short + ' (' + ({ liora: 'Highcrest camp', rowan: 'Greythorn forest', vex: 'Saltmire Undercity', brakka: 'Highcrest walls', seraphine: 'Lumeria archives', caelan: 'Highcrest ruins' })[id] + ')'); }); return f.length ? 'Follow the pulses of light: ' + f.join(', ') + '.' : 'Return to Port Halcyon.'; } });

  SC.highcrest_shore = async function (S) { var c = await S.choice('The Gull waits at the foot of the road.', ['Set sail', 'Stay']); if (c === 0) await S.sail(); else S.partyAt(770, 900, 'up'); };
  SC.countryside_shore = SC.highcrest_shore;
  SC.highcrest_inn_talk = async function (S) {
    var G = S.G;
    if (mqs(G) === 18 && G.flags.q18_balcony) {
      var c = await S.choice('The innkeeper offers a bed. Outside, the bells have not stopped.', ['Sleep — until dawn', 'Not yet']);
      if (c === 0) { S.healAll(); S.save(); await S.fade(1, 900); await S.wait(600); S.mq(19); S.quest('mq19'); S.done('mq18'); await S.map('highcrest_siege', 'start'); S.camFollow(); return SC.q19_attack(S); }
      return;
    }
    var c2 = await S.choice('The innkeeper nods.', ['Rest (80 G) and save', 'Chat', 'Never mind']);
    if (c2 === 0) return DB.menus.inn(80);
    if (c2 === 1) await S.say('bram', "The Silver Stag's seen worse nights than this. Not many.");
  };
  SC.ilsabet_talk = async function (S) {
    var G = S.G;
    if (!G.flags.q18_met) return;
    await S.say('ilsabet', mqs(G) >= 18 && G.flags.q18_balcony ? "Rest while you can. The dawn will come whether we are ready or not." : "Highcrest welcomes the marked ones. Forgive the state of the walls; we are building as fast as we can.");
  };
  SC.varric_talk = async function (S) { await S.say('varric', S.G.flags.edran_known ? "The Order is... reconsidering its position on certain matters." : "The Order has the situation in hand. The Order always has the situation in hand."); };

  /* ---------- Q18 ---------- */
  SC.q18_arrive = async function (S) {
    var G = S.G; S.flag('q18_met', 1); S.music('highcrest', 2); S.partyWalk(770, 560, 40); S.cam(770, 480, 600);
    await S.narr("Highcrest, the royal capital. Banners and bells; armies mustering in the squares. Queen Ilsabet's knights prepare for war.");
    if (S.is('caelan')) {
      /* HOMECOMING VARIANT F */
      await S.narr("Guards turn as you pass. One by one, they bring their fists to their chests. Word has spread: Sir Caelan of the Silver Oath has come home.");
      S.spawn('ilsabet_h', 'ilsabet', 770, 380, 'down', { name: 'Queen Ilsabet' }); await S.partyWalk(770, 460, 40);
      await S.say('ilsabet', "Sir Caelan Ashford. You have been gone a very long time. And you return with — *glowing hands* — the Order's old prophecy, walking through my gates.");
      await S.hsay({ knight: "Your Majesty. I'm sorry to return like this. I'm sorry to return at all." });
      await S.say('ilsabet', "Do not apologise. You are home. Rise.");
      S.spawn('varric_h', 'varric', 700, 400, 'right', { name: 'Lord Varric' });
      await S.say('varric', "*stepping between you and the Queen* Your Majesty — with respect — Ashford keeps company with *deserters*. Reports reach me of a hunter, a thief, a barbarian—");
      await S.hsay({ knight: "These are my friends, my lord. Better knights than half your Order." });
      await S.say('varric', "And the reports of Sir Edran's sightings in the Wastes? The ones the Order has *buried*? Do you deny that Edran — *the Order's greatest* — deserted?");
      await S.hsay({ knight: "...Sightings. Reports. The Order has been *suppressing* them." }, 'surprised');
      await S.say('ilsabet', "Lord Varric. That is enough. Sir Caelan — I will hear you tonight. Rest. We will speak.");
      S.flag('edran_known', 1); S.despawn('ilsabet_h'); S.despawn('varric_h');
    } else {
      S.camFollow(); S.cam(250, 300, 1200);
      S.spawnHero('caelan', 200, 300, 'down'); S.spawn('rec1', 'squire', 140, 330, 'right', { name: 'Recruit' }); S.spawn('rec2', 'squire', 260, 330, 'left', { name: 'Recruit' });
      await S.say('caelan', "Shields up! Higher! If you drop your guard in a real fight, you won't get a second — *sees you; sees your hands* ...Five of you.");
      S.cam(500, 320, 700); await S.partyWalk(300, 340, 40);
      await S.hsay({ _: "Six, with you." });
      await S.say('caelan', "*looks at his gloved hand, then removes the glove; the Dawnmark burns bright* The Queen ordered me to keep it hidden. She said it would cause panic. ...I obeyed. I've always obeyed. But I've been waiting for you.");
      S.despawn('caelan'); S.despawn('rec1'); S.despawn('rec2');
      S.join('caelan'); S.ensureLevel(40);
      S.toast('THE SIX ARE TOGETHER.', 'quest'); S.sfx('quest_complete');
    }
    S.camFollow(); S.xp(1200); S.quest('mq18');
    S.toast('Go to the castle steps at the north end of Highcrest.', 'quest');
  };
  SC.q18_varric = async function () { };
  SC.q18_balcony = async function (S) {
    var G = S.G; S.flag('q18_balcony', 1); S.music('lanterns', 2); S.tint('#ff8a3c', .14); S.partyAt(770, 180, 'up'); S.cam(770, 150, 0);
    await S.narr("That night. The castle balcony. Highcrest's lights spread out below like a second sky.");
    await S.say('liora', "*quietly* Six. All six of us. I didn't think it was possible.", 'happy');
    await S.say('vex', "I thought it'd be more dignified.");
    await S.narr("They stand shoulder to shoulder. One by one they remove their gloves. All six Dawnmarks shine together — and a pillar of golden light rises into the sky, visible across the continent.");
    S.flash('#ffe9a0', 1200); S.sfx('dawnmark_burst'); S.shake(5);
    await S.say('seraphine', "...Well. Subtle, we are not.");
    await S.say('brakka', "Let him see it! Let the Hollow King see we're coming!");
    await S.say('caelan', "He'll see it. That's what worries me.");
    S.tint(null); S.camFollow();
    S.toast('Rest at the Silver Stag Inn when ready — the attack comes at dawn. (Do side quests first!)', 'quest');
    S.ensureLevel(41);
  };

  /* ---------- SQ16: The Squire's Courage ---------- */
  QD('sq16', { name: "The Squire's Courage", type: 'side', lv: 41, obj: 'Help the frightened squire in the training yard.' });
  SC.squire_talk = async function (S) {
    var G = S.G;
    if (G.quests.sq16 === 'done') { await S.say('squire', "I held the line. I held it *shaking*, but I held it!"); return; }
    await S.say('squire', "Sir — I mean — heroes — I'm Tobin. It's my first real battle tomorrow. I'm so afraid. I can't feel my hands. What if I run? What if I'm the one who runs?");
    var c = await S.choice('Tobin trembles.', ['"Everyone is afraid."', '"Being afraid is how you know it matters."', '"Hold the line for the person beside you."']);
    S.quest('sq16');
    if (S.is('caelan') || G.members.caelan) {
      await S.say(S.is('caelan') ? 'HERO' : 'caelan', "*kneels, eye to eye* Master Edran taught me the same lesson. 'Courage isn't not being afraid, boy. It's being afraid and choosing the person next to you anyway.'");
      await S.say(S.is('caelan') ? 'HERO' : 'caelan', "He's gone now. But I can hear him say it every time I draw my sword. Now you will too.");
    } else {
      await S.narr("You kneel to Tobin's eye level and tell him what someone once told you.");
    }
    await S.say('squire', "...Hold the line for the person beside you. Yes. Yes, sir. I think I can do that.");
    S.done('sq16'); S.xp(2500); S.give('barracks_porridge', 3);
  };

  /* ---------- Q19: The Knight Who Fell ---------- */
  SC.q19_attack = async function (S) {
    var G = S.G; S.flag('q19_started', 1); S.music('siege', 2); S.tint('#3a1a5a', .2);
    S.partyAt(770, 900, 'up'); S.cam(770, 800, 0); await S.fade(0, 900);
    await S.narr("Dawn on the Highcrest walls. Not a sunrise — a violet smear on the horizon. War horns. The Hollow King's army is here.");
    await S.say('caelan', "Shields up! Hold the south gate! Everyone — *Hold!*");
    S.camFollow();
    DB.ui.hint('Defend the gate! Fight the Hollow King\'s vanguard.'); setTimeout(function () { DB.ui.hint(null); }, 6000);
    await S.battle([{ type: 'void', lv: 43, n: 4, x: 770, y: 700 }, { type: 'soldier', lv: 43, n: 3, x: 560, y: 640 }, { type: 'soldier', lv: 43, n: 3, x: 980, y: 640 }], { onWin: 'q19_wave2' });
  };
  SC.q19_wave2 = async function (S) {
    await S.battle([{ type: 'shade', lv: 44, n: 3, x: 770, y: 520 }, { type: 'void', lv: 44, n: 4, x: 770, y: 420 }], { onWin: 'q19_edran' });
  };
  SC.q19_edran = async function (S) {
    S.music('boss', 1); S.partyWalk(770, 480, 40); S.tint('#6a1aa0', .2); S.cam(770, 360, 800);
    await S.narr("Then the army parts. At its head: a knight in corrupted silver armor, violet light where his eyes should be.");
    S.spawn('edran_f', 'edran_fallen', 770, 300, 'down', { name: 'Sir Edran' });
    await S.say('caelan', "...Master Edran.", 'surprised');
    await S.say('edran', "The boy who held his sword wrong. You still lead with your left foot.");
    await S.say('caelan', "They said you deserted. I never believed them. I *never* —");
    await S.say('edran', "I didn't desert. I went to the Wastes to scout the Black Sun. He found me. He showed me... a world without loss, Caelan. A world where no squire ever has to bury his teacher. *raises his sword* Join us.");
    await S.say('caelan', "*steadying himself* ...No. I'm sorry, Master. I can't.");
    S.despawn('edran_f'); S.flag('edran_known', 1);
    await S.boss('edran', { lv: 45, x: 770, y: 250, thresholds: [{ at: .66, scene: 'q19_t1' }, { at: .33, scene: 'q19_t2' }], onWin: 'q19_win' });
  };
  SC.q19_t1 = async function (S) { await S.say('caelan', "*dodging a thrust* ...He leads with the right. He always led with the right. I've been fighting his *shadow* all my life.", null); };
  SC.q19_t2 = async function (S) { await S.say('caelan', "'Never step where your enemy wants you to step.' Master Edran told me that. I remember. I *remember.* Hold on, Master.", null); };
  SC.q19_win = async function (S) {
    S.tint('#3a1a5a', .1); S.music('sad', 2); S.healAll();
    S.spawn('edran_d', 'edran_restored', 770, 320, 'down', { name: 'Sir Edran' }); S.partyWalk(770, 400, 30);
    await S.narr("Edran falls. The violet light flickers in his eyes, then fades. For a moment, he is himself.");
    await S.say('edran', "...Caelan. You won. You fixed your footwork.");
    await S.say('caelan', "Don't — Liora, please —");
    await S.say('liora', "*hands glowing, then trembling* The Covenant's eaten too much of him. I can't — I'm sorry, I can't —", 'sad');
    await S.say('edran', "Lady healer. Don't cry. Not every wound is yours to close. *to Caelan* A knight's oath isn't to a crown, boy. It's to the people. Even when the crown is wrong. Even when *I* was wrong.");
    await S.narr("He presses his sword into Caelan's hands.");
    await S.say('edran', "Make a better knight than I was.");
    await S.narr("He dies. Caelan holds him.");
    S.despawn('edran_d'); S.flag('has_edran_sword', 1); S.affinity('caelan', 3); S.affinity('liora', 1);
    S.done('mq19'); S.mq(20); S.quest('mq20'); S.xp(3000); S.ensureLevel(45);
    S.partyWalk(770, 330, 40); await S.wait(500);
    return SC.q20_eclipse(S);
  };

  /* ---------- Q20: Highcrest Burns ---------- */
  SC.q20_eclipse = async function (S) {
    var G = S.G; S.flag('q20_started', 1); S.tint(null); S.music(null); S.shake(8); S.sfx('quake');
    await S.narr("The sky goes black. The Black Sun rises fully for the first time — a violet-ringed hole in the heavens. Wind from nowhere. The torches gutter and die.");
    S.spawn('vael_f', 'vaelthorn_armored', 770, 170, 'down', { name: 'Vaelthorn' });
    S.music('finalboss', 3);
    await S.narr("And Vaelthorn descends onto the castle walls in person.");
    await S.say('vaelthorn', "Six embers. Together. Just like before. *he removes his helm. Beneath it is the young man from the opening — pale, ageless, his eyes black with violet stars* Hello, children.");
    await S.say('seraphine', "Vaelthorn. The Dawn-King.");
    await S.say('vaelthorn', "No one has called me that in three hundred years. *he looks at each of them* A knight. A healer. A thief. A hunter. A warrior. A mage. I loved six people exactly like you. I watched them die. One by one. I held each of them. And then I sat alone in the dark with the thing that killed them for three centuries.");
    await S.say('vaelthorn', "Do you understand? I am not trying to hurt you. I am trying to make sure no one ever hurts like *that* again.");
    S.despawn('vael_f');
    DB.ui.hint('You cannot win this fight. SURVIVE.'); setTimeout(function () { DB.ui.hint(null); }, 6000);
    await S.boss('vaelthorn_hl', { lv: 60, x: 770, y: 200, surviveT: 60, onSurvive: 'act4_scattered' });
  };
  SC.act4_scattered = async function (S) {
    var G = S.G; S.healAll(); S.flash('#b080ff', 1200); S.shake(14); S.sfx('quake');
    var b = DB.combat.boss; if (b) { b.invuln = true; b.hp = b.maxhp; DB.combat.boss = null; DB.world.ents = DB.world.ents.filter(function (e) { return e !== b; }); }
    await S.narr("Vaelthorn raises a hand. The Black Sun pulses. A wave of violet force shatters the castle wall. The six are thrown in six directions.");
    await S.say('vaelthorn', "Run home, little embers. I'll come for each of you when the Covenant is ready. And then — no more tears. I promise.");
    await S.fade(1, 1500, '#000'); S.music(null);
    S.done('mq20'); S.mq(21); S.quest('mq21'); S.setParty([G.hero]); G.flags.noMeter = 1; G.flags.ship = 1;
    S.xp(1500); S.ensureLevel(45); S.healAll();
    await S.map('highcrest_countryside', 'start'); S.partyAt(770, 930, 'up'); await SC.q21_wake(S);
  };

  /* ---------- Q21: Alone ---------- */
  SC.q21_wake = async function (S) {
    var G = S.G; S.flag('solo0', 1); S.music('solo', 3); S.tint('#4a5a7a', .2); S.partyAt(770, 930, 'up'); S.cam(770, 900, 0);
    await S.fade(0, 2000);
    await S.narr("The HERO wakes in the ruins outside Highcrest. Rain. Smoke. No party. The Dawnmark flickers weakly.");
    await S.hsay({ knight: "...Liora? Seraphine? ...Edran's sword. Still here. Still here.", healer: "...Rowan? Caelan? Somebody? *coughs, tries to light her hand; it flickers*", rogue: "...Anyone? Anyone at all? I'll even take Brakka's singing.", hunter: "...Ash? ...Ash? *only the rain answers*", berserker: "...Friends? ...HEY. FRIENDS. *the rain swallows the shout*", mage: "...The equation. I need the equation. I need — I need someone." }, 'sad');
    S.camFollow(); S.toast('SOLO: no party, no Dawnmark Burst. Head north through the ruins.', 'quest');
    DB.ui.invalidateParty && DB.ui.invalidateParty();
  };
  var whisper = async function (S, key, n) {
    var G = S.G; S.flag(key, 1); S.tint('#5a2a8a', .18); S.sfx('quake');
    var lines = [
      "Why fight? You've already lost. Your mentor is dead. Your friends are scattered. Just stop. Just rest. I can make it all stop hurting.",
      "They are gone. Every one of them. You are the last ember. Put it out, and the pain will go with it.",
      "Look at what you've done. All this ruin — it is *your* light that draws him. If you were never here, none of this would be."
    ];
    await S.say('vaelthorn', lines[n]);
    var c = await S.choice('The voice waits.', ['"...Maybe he\'s right."', '"No."']);
    if (c === 1) { G.noCount = (G.noCount || 0) + 1; await S.narr("You stagger on. The rain keeps falling. Somewhere, a bell tolls once."); }
    else await S.narr("You walk on anyway. The voice laughs, softly, and fades.");
    S.tint('#4a5a7a', .2);
  };
  SC.q21_whisper1 = function (S) { return whisper(S, 'solo1', 0); };
  SC.q21_whisper2 = function (S) { return whisper(S, 'solo2', 1); };
  SC.q21_whisper3 = function (S) { return whisper(S, 'solo3', 2); };
  SC.q21_reach = async function (S) {
    var G = S.G; S.flag('q21_done', 1); S.music('sad', 2); S.partyAt(770, 450, 'down');
    await S.narr("The HERO collapses in the rain at a crossroads.");
    await S.say('maren', "When it's dark — and it will be so dark — reach for them.");
    await S.narr("The HERO raises a trembling hand. The Dawnmark flickers... then pulses. Far away, five other lights pulse back.");
    S.flash('#ffe9a0', 1200); S.sfx('dawnmark_burst');
    if (G.noCount >= 3) await S.hsay({ _: "...Three times. Three times you asked me to give up. And I said no. *I'll say it again.*" }, 'happy');
    S.tint(null); G.flags.noMeter = 0; S.done('mq21'); S.mq(22); S.quest('mq22'); S.xp(1500);
    S.toast('Five lights pulse back — follow them. Liora (nearby camp), Rowan (Greythorn), Vex (Saltmire Undercity), Brakka & Caelan (Highcrest ruins), Seraphine (Lumeria Archives).', 'quest');
    G.flags['found_' + G.hero] = 1;
    await SC.reach_self(S);
    S.camFollow();
  };
  SC.reach_self = async function (S) {
    var h = S.G.hero, m = {
      caelan: "Edran's sword is heavy in my hands. It's heavier with the weight of everything it *means*. But he said: to the people. Not the crown. ...I'll carry it. I will.",
      liora: "I couldn't save Tam. I couldn't save Maren. I couldn't save Edran. But there are living people behind me. That is not nothing. That is *everything*.",
      vex: "I had a boat. A real one. And I'd have taken it, once. ...Funny. The only thing that scares me now is being the one who isn't there when they come looking.",
      rowan: "Father. If you can hear me in the wind — I'm not alone anymore. I think that's what you wanted all along.",
      brakka: "I've lost control before. I hurt the one I loved. But the rage has a face now — and it's mine. I'll hold it. Together with them, I can hold it.",
      seraphine: "I pretended for so long that I didn't need anyone. The equation says six. It always said six. I just kept not reading the answer."
    }[h];
    await S.narr("(Internal monologue)"); await S.hsay({ _: m });
    S.give('compass', 0, true);
  };

  /* ---------- Q22 reunions ---------- */
  function checkAllFound(S) {
    var G = S.G, all = true; DB.HERO_IDS.forEach(function (id) { if (!G.flags['found_' + id]) all = false; });
    if (all && !G.flags.q22_done) { G.flags.q22_done = 1; setTimeout(function () { DB.story.run('q22_halcyon'); }, 300); }
  }
  function ult(S, id, name) { if (!S.G.members[id]) DB.join(id); S.G.members[id].ult = true; S.toast(DB.heroes[id].short + "'s ultimate unlocked: " + name, 'quest'); S.sfx('quest_complete'); }
  function rejoin(S, id) { DB.join(id); S.G.partyBackup = null; DB.ui.invalidateParty(); }
  SC.reunion_liora = async function (S) {
    S.flag('found_liora', 1); S.music('sad', 1); S.partyWalk(400, 460, 40);
    await S.narr("A refugee camp in the ruins. Dozens of wounded lie on bedrolls. A figure, exhausted, hands trembling with light, moves from one to the next.");
    await S.say('liora', "I couldn't save them all. I tried. I tried so hard —", 'sad');
    await S.hsay({ _: "You saved *these.* Look at them, Liora." });
    await S.narr("She looks at the crowd of living people. She laughs through tears.");
    await S.say('liora', "...I really did, didn't I?", 'happy');
    S.despawn('liora_r'); S.affinity('liora', 3); ult(S, 'liora', 'Gentle Dawn'); rejoin(S, 'liora'); checkAllFound(S);
  };
  SC.reunion_rowan = async function (S) {
    S.flag('found_rowan', 1); S.music('sad', 1);
    await S.narr("A burned stretch of forest. Charred trunks, ash like snow. Between the roots, a family of orphaned fox kits sleep curled against a grey wolf — and Rowan, who sits guard.");
    await S.say('rowan', "I didn't know if you'd come. I... I wanted to go looking for you. But I'm not good at —", 'sad');
    await S.hsay({ _: "You found me first, you know. The light." });
    await S.say('rowan', "...I wasn't going to stop calling until you answered.", 'happy');
    S.despawn('rowan_r'); S.affinity('rowan', 3); ult(S, 'rowan', 'Spirit of Greythorn'); rejoin(S, 'rowan'); S.G.hasAsh = true; checkAllFound(S);
  };
  SC.reunion_vex = async function (S) {
    S.flag('found_vex', 1); S.music('undercity', 1);
    await S.narr("A bandit hideout in the dark. Lanterns, rope, loot — and a locked chest labelled PASSAGE: ONE.");
    await S.say('vex', "I had a boat. A real one, ready to go. Somewhere warm, no Dark Lords.");
    await S.hsay({ _: "Why didn't you get on it?" });
    await S.say('vex', "*long pause* ...Because you'd come looking for me. And I'd rather be dead than be the one who wasn't there when you did.", 'sad');
    S.despawn('vex_r'); S.affinity('vex', 3); ult(S, 'vex', 'Last Gambit'); rejoin(S, 'vex'); checkAllFound(S);
  };
  SC.reunion_brakka = async function (S) {
    S.flag('found_brakka', 1); S.music('boss', 1);
    await S.narr("A battlefield. Defeated soldiers on every side. In the middle, a giant, hair matted with blood, axe raised, rage burning out of control.");
    await S.say('brakka', "*roaring, axe raised at you* — get BACK —");
    await S.hsay({ _: "Brakka. It's me." });
    await S.narr("You don't move. Brakka's axe stops an inch away. He drops it and falls to his knees.");
    await S.say('brakka', "I saw your face. This time... I saw your face.", 'sad');
    S.despawn('brakka_s'); S.affinity('brakka', 3); ult(S, 'brakka', 'Heart of the Storm'); rejoin(S, 'brakka'); checkAllFound(S);
  };
  SC.reunion_seraphine = async function (S) {
    S.flag('found_seraphine', 1); S.music('archives', 1);
    await S.narr("A ruined library. Chalk and charcoal across every surface. In the middle, a woman with ink-stained hands, whispering equations.");
    await S.say('seraphine', "I've found it. A way to break the Covenant. It needs all six marks at once — and someone has to channel the Black Sun through themselves for a heartbeat. The way he did. *she looks up* I can't do it alone. I've *never* been able to do anything alone. I just pretended.");
    await S.hsay({ _: "Then stop pretending." });
    S.despawn('sera_r'); S.affinity('seraphine', 3); ult(S, 'seraphine', 'Starfall Equation'); rejoin(S, 'seraphine'); checkAllFound(S);
  };
  SC.reunion_caelan = async function (S) {
    S.flag('found_caelan', 1); S.music('highcrest', 1);
    await S.narr("Highcrest's ruined gate. Queen Ilsabet and a few hundred survivors huddle in the wreckage. At the gate, a lone knight in silver, refusing to retreat.");
    await S.say('caelan', "The Order ran. Lord Varric ran. I'm all that's left of the Silver Oath.");
    await S.hsay({ _: "Then the Oath's in good hands." });
    await S.say('caelan', "*holding Edran's sword* ...It's to the people. Not the crown. I understand now.");
    S.despawn('caelan_r'); S.despawn('ilsabet_r'); S.affinity('caelan', 3); ult(S, 'caelan', 'Oathkeeper'); rejoin(S, 'caelan'); checkAllFound(S);
  };
  SC.q22_halcyon = async function (S) {
    var G = S.G; await S.fade(1, 900); S.restoreParty();
    DB.HERO_IDS.forEach(function (id) { if (G.members[id]) DB.join(id, { force: false }); });
    await S.map('port_halcyon', 'dock'); S.tint(null); S.music('lanterns', 2); S.partyAt(1000, 790, 'up'); S.cam(1000, 780, 0);
    S.spawn('pip_r', 'pip', 1060, 760, 'left', { name: 'Pip' }); S.spawn('hettie_r', 'hettie', 1100, 740, 'left', { name: 'Hettie' }); S.spawn('bram_r', 'bram', 1130, 760, 'left', { name: 'Bram' }); S.spawn('marisol_r', 'marisol', 960, 740, 'right', { name: 'Captain Marisol' });
    await S.fade(0, 1000);
    await S.narr("Port Halcyon. The rain clears. The Wandering Gull sits at the dock, repaired again. On the pier waits everyone: Marisol, Hettie, Bram, and Pip.");
    await S.say('pip', "I KNEW it. I *told* everyone.");
    await S.say('marisol', "Ship's ready. Course to the Hollow Wastes, I suppose.");
    await S.say('brakka', "No more running.");
    await S.say('vex', "No more hiding.");
    await S.say('rowan', "No more being alone.");
    await S.say('seraphine', "I have a plan. It's terrible. It might work.");
    await S.say('liora', "Then let's go do something terrible.", 'happy');
    await S.say('caelan', "*to HERO* Lead us.");
    ['pip_r', 'hettie_r', 'bram_r', 'marisol_r'].forEach(function (i) { S.despawn(i); });
    S.done('mq22'); S.mq(23); S.quest('mq23'); S.xp(6000); S.healAll(); S.ensureLevel(50); S.camFollow(); S.flag('ship', 1);
    await S.card('END OF ACT IV', 'The Darkest Hour', 2800);
    S.toast("Sail for the Hollow Wastes — talk to Captain Marisol.", 'quest'); S.save();
  };

  /* ---------- SQ17: Letters to the Front ---------- */
  QD('sq17', { name: 'Letters to the Front', type: 'side', lv: 46, obj: 'Deliver the refugees\' letters to the soldiers in the ruins (Highcrest countryside).' });
  SC.refugee_talk = async function (S) {
    var G = S.G;
    if (mqs(G) < 21) { await S.say('refugee', "Highcrest has fallen. Gods. Gods."); return; }
    if (!G.quests.sq17) {
      await S.say('refugee', "Please — a letter. For my son. He's with the regiment east of the ruins. I couldn't leave. Could you...?");
      var c = await S.choice('The refugee holds out a letter.', ['I\'ll deliver it', 'I can\'t']); if (c !== 0) return;
      S.quest('sq17'); S.give('refugee_letter', 1); S.toast('Find the soldier east of the camp.', 'quest'); return;
    }
    await S.say('refugee', "Please. Please find him.");
  };
  SC.letter_give = async function (S) { await S.say('refugee', "The soldiers are east of the ruins. Please."); };
  SC.letter_recv = async function (S) {
    var G = S.G; S.take('refugee_letter', 1); S.flag('letter_recv', 1);
    await S.say('guard', "A letter? For me? *reads, goes very still* ...My mother. She's alive. She *wrote.* I thought — I thought the whole camp — *he sinks to a knee, then looks up* Thank you. You've no idea what this is.");
    if (G.flags.noCount >= 1) await S.narr("Somewhere, a faint spark of gold brightens in your palm.");
    S.done('sq17'); S.xp(3000); S.give('mead_mug', 1);
    G.members[G.hero].hp = DB.stats(G.hero).hp;
  };
  /* ---------- SQ18: Seeds for Tomorrow ---------- */
  QD('sq18', { name: 'Seeds for Tomorrow', type: 'side', lv: 48, obj: 'Plant three garden plots at the south ruins (Highcrest countryside).' });
  SC.garden_give = async function (S) {
    var G = S.G;
    if (G.quests.sq18) { await S.say('farmer_father', "Three plots, south of the crossroads. Good soil under the ash. Soil remembers."); return; }
    await S.say('farmer_father', "We've got a handful of seeds from the old royal gardens. It's foolish. Nothing grows in ruin. But — if you'd help — we could plant. Just a little. Just something.");
    var c = await S.choice('The man cups the seeds in both hands.', ['Let\'s plant them', 'Not now']); if (c !== 0) return;
    S.quest('sq18'); S.give('seeds', 3);
  };
  SC.garden_plant = async function (S) {
    var G = S.G, which = ['plot1', 'plot2', 'plot3'].filter(function (k) { return !G.flags[k]; })[0]; if (!which) return;
    S.flag(which, 1); S.take('seeds', 1); S.sfx('footstep_grass');
    await S.narr("You kneel in the ash and press a seed into the earth. A little water. A little prayer.");
    var left = ['plot1', 'plot2', 'plot3'].filter(function (k) { return !G.flags[k]; }).length;
    if (left === 0) {
      await S.narr("By the time the third seed is in the ground, the first has put out a green shoot. Small. Quiet. Hopeful.");
      S.done('sq18'); S.xp(3000); S.give('elixir_dawn', 2);
    }
  };
})();
