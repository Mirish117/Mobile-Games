/* Dawnbound - scenes: Prologue and Act I (Port Halcyon) */
(function () {
  'use strict';
  var DB = window.DB, SC = DB.scenes, Q = DB.quests, QD = Q.def;
  var mqs = function (G) { return G.flags.mq || 0; };

  /* ================= PROLOGUE ================= */
  QD('mq0', { name: 'Salt and Sunrise', type: 'main', lv: 1, obj: 'Explore the deck, then head toward the bow.' });
  SC.prologue_p1 = async function (S) {
    S.music('sea'); S.partyAt(700, 640, 'right');
    var m = S.ent('marisol'); m.scripted = true;
    S.cam(800, 560, 0); await S.wait(500);
    await S.walk('marisol', 790, 612, 40); S.face('marisol', 'HERO');
    await S.say('marisol', "Ah. The passenger who paid in full and doesn't get seasick. My favorite kind. We'll make Port Halcyon by noon, if the sea stays sweet.");
    await S.hsay({ knight: "Thank you, Captain. I'm on the Order's business. ...Or I believe I am.", healer: "It's beautiful out here. I've never seen so much blue in my life.", rogue: "Noon, huh? Plenty of time to inspect your cargo. Purely professional curiosity.", hunter: "...The gulls are flying low. Is that normal?", berserker: "Noon! Good! Is there breakfast before noon? There should be breakfast.", mage: "Noon is acceptable. I've calculated the tides; we could be faster, but I won't tell you how to run your ship." });
    await S.say('marisol', "*squints at your hand* What's that glow under your glove? ...Never mind. Not my business. Old sailors know better than to ask about lights at sea.");
    S.flag('p1', 1); m.scripted = false; S.camFollow(); S.quest('mq0');
    DB.ui.hint('Move with the stick (WASD). Talk to the crew with A. Walk toward the bow when you are ready.'); setTimeout(function () { DB.ui.hint(null); }, 9000);
  };
  SC.gull_marisol = async function (S) { await S.say('marisol', "Keep your eyes open, passenger. The sea's too quiet for my liking."); };
  SC.gull_fenn = async function (S) {
    await S.say('fenn', "Eh? Land legs need learning, friend. Tap B to dash — quick as a gull. It'll dodge most anything that's coming at you.");
    await S.say('fenn', "And mind the red markings when something big winds up. Red means move.");
  };
  SC.gull_bessa = async function (S) {
    if (!S.flag('bessa')) { S.flag('bessa', 1); await S.say('bessa', "You look thin. Here — three Sea Biscuits. Hard as the hull and twice as salty, but they'll patch you up. Open the menu (☰) to use them."); S.give('sea_biscuits', 3); }
    else await S.say('bessa', "Eat the biscuits before they eat your teeth.");
  };
  SC.gull_ivo = async function (S) { await S.say('ivo', "I keep seein' shapes under the water. Big ones."); };
  SC.prologue_p2 = async function (S) {
    S.flag('p2', 1); S.music('ghostly', 2);
    await S.cam(767, 420, 700); S.tint('#6a2bd0', .22); await S.wait(500);
    await S.narr("The sky turns violet without warning. The sea goes flat and silent.");
    S.shake(6); S.sfx('quake');
    await S.say('marisol', "All hands! Steel out! — Passenger! You know how to use that?");
    await S.hsay({ _: "Better than most." });
    S.camFollow(); DB.ui.hint('Tap A to attack — keep tapping for a three-hit combo.');
    await S.battle([{ type: 'tidespawn', lv: 1, n: 3, x: 520, y: 330 }, { type: 'tidespawn', lv: 1, n: 2, x: 1050, y: 330 }], { onWin: 'prologue_w2' });
  };
  SC.prologue_w2 = async function (S) {
    DB.ui.hint('B dashes — you are untouchable for a moment. Dodge the red warnings!');
    await S.battle([{ type: 'tidespawn', lv: 2, n: 4, x: 767, y: 300 }], { onWin: 'prologue_w3' });
  };
  SC.prologue_w3 = async function (S) {
    DB.ui.hint('❖ ✧ cast skills (they cost MP). Fighting fills the Dawnmark gauge — tap ✦ when it is full!'); DB.G.meter = 60;
    await S.battle([{ type: 'tidespawn', lv: 2, n: 5 }], { onWin: 'prologue_boss' });
  };
  SC.prologue_boss = async function (S) {
    DB.ui.hint(null); S.shake(10); S.sfx('roar'); S.music('boss');
    await S.say('marisol', "Gods and gulls — what IS that?!");
    S.cam(767, 260, 600);
    await S.say('vashka', "Ohhh, one of the little embers. The Hollow King will be so pleased. Sink, darling. Sink and stay.");
    await S.boss('brineshrike', { lv: 3, x: 767, y: 230, hpMul: .8, thresholds: [{ at: .3, scene: 'prologue_flare' }], onWin: 'prologue_after' });
  };
  SC.prologue_flare = async function (S) {
    await S.flash('#fff2b0', 700); S.sfx('dawnmark_burst'); S.shake(10);
    await S.narr("The Dawnmark flares. A golden burst drives the beast back.");
    var b = DB.combat.boss; if (b) { b.hp = 0; DB.combat.enemyDown(b); }
  };
  SC.prologue_after = async function (S) {
    S.tint(null); S.music('sea', 2); S.healAll(); S.xp(150);
    await S.say('vashka', "*laughing, dissolving into spray* Run along, little ember...");
    await S.say('marisol', "Twenty-eight years at sea. Never seen a person glow like a lighthouse. *beat* You've got friends in Halcyon?");
    await S.hsay({ _: "No one." });
    await S.say('marisol', "You do now. I'm a terrible enemy and a worse friend, but I'm loyal as rust.");
    S.mq(1); S.flag('prologue_done', 1); S.done('mq0'); await S.map('port_halcyon', 'dock'); await SC.prologue_p3(S);
  };
  SC.prologue_p3 = async function (S) {
    S.partyAt(950, 815, 'up'); S.spawn('pip_tmp', 'pip', 990, 820, 'left', { name: 'Pip' });
    S.cam(960, 800, 0);
    await S.say(null, "The ship limps into Port Halcyon. Whitewashed houses climb a hill; blue roofs, lanterns strung across the streets for the coming Festival of First Light. Bells ring. Children run along the docks.");
    await S.say('pip', "Whoa — your ship's all broke! Were you attacked by a sea monster?! Was it huge? Did you kill it? Did it have teeth? — I'm Pip! I work the docks! Unofficially!");
    await S.say('marisol', "Pip, breathe.");
    await S.say('pip', "...Your hand is glowing. Elder Maren said someone with a glowing hand would come. She said it'd be a hero.");
    S.despawn('pip_tmp'); S.camFollow(); S.quest('mq1');
    DB.ui.hint('Find the Salty Lantern Inn (west side of the plaza) and get a room.'); setTimeout(function () { DB.ui.hint(null); }, 8000);
  };

  /* ================= ACT I ================= */
  QD('mq1', { name: 'A Stranger in Halcyon', type: 'main', lv: 2, obj: 'Get a room at the Salty Lantern Inn (west of the plaza).' });
  QD('mq2', { name: 'The Lighthouse Keeper', type: 'main', lv: 3, obj: 'Pip knows the way to Elder Maren. Talk to Pip on the docks.' });
  QD('mq3', { name: 'The First Shard — Tidecaller Grotto', type: 'main', lv: 4, obj: function (G) { return !G.flags.mq3_go ? 'Maren asks for three Lumen Shards. Leave town by the Cliff Road and cross the west bridge to Tidecaller Grotto.' : !G.flags.liora_met && !G.flags.anwen_met ? 'Enter Tidecaller Grotto.' : !G.flags.grotto_drained ? 'Find the tide valve to open the gate.' : 'Reach the heart of the grotto and claim the First Lumen Shard.'; } });
  QD('mq4', { name: 'Festival of First Light', type: 'main', lv: 7, obj: 'Enjoy the festival in Port Halcyon. Talk to Pip when you are ready for the lanterns.' });
  QD('mq5', { name: 'The Second Shard — Whispering Cliffs', type: 'main', lv: 8, obj: function (G) { return !G.flags.maren_story ? 'Take the Cliff Road north. Elder Maren is waiting.' : 'Climb the Whispering Cliffs Shrine and defeat the Harpy Queen.'; } });
  QD('mq6', { name: 'The Third Shard — The Drowned Lighthouse', type: 'main', lv: 10, obj: function (G) { return !G.flags.q6_planned ? 'Pip is missing. Read the note at the inn door.' : 'Cross to the Drowned Lighthouse from the east pier — before the tide returns!'; } });

  /* ----- Q1: the inn ----- */
  SC.hettie_talk = async function (S) {
    var G = S.G;
    if (mqs(G) === 1 && !G.flags.inn) {
      S.flag('inn', 1);
      await S.say('hettie', "Another one off the *Gull*? Sit, sit, you look half-drowned. Bram, the good stew.");
      await S.say('bram', "It's all the good stew, Hettie.");
      await S.say('hettie', "Then the *better* good stew.");
      if (S.cls() === 'berserker') await S.hsay({ berserker: "I like this place already. I may never leave." });
      else if (S.cls() === 'rogue') { await S.hsay({ rogue: "...Why are you being nice to me? What's the catch?" }); await S.say('hettie', "Catch is you eat everything on your plate. Then you come back tomorrow and do it again."); }
      else await S.hsay({ knight: "You are most kind, ma'am. I will gladly pay for the room.", healer: "Thank you. It smells wonderful in here.", hunter: "...Thank you. It's warm.", mage: "Is the stew... pre-seasoned? I'll take it either way." });
      S.sfx('quest_complete'); S.xp(100); S.done('mq1'); S.mq(2); S.quest('mq2');
      S.toast('The inn is now a save point. Rest here with Hettie.', 'quest');
      return;
    }
    if (mqs(G) >= 2 && !G.quests.sq2) return SC.sq2_start(S);
    if (G.quests.sq2 === 'active' && (G.inv.blackberries || 0) >= 5) return SC.sq2_finish(S);
    if (G.quests.sq2 === 'active') { await S.say('hettie', "Five blackberries, dear — off the cliffs by the beach. Watch for the crabs. They are *grumpy* this season."); return; }
    var c = await S.choice('Hettie smiles.', ['Rest for the night (20 G) and save', 'Chat', 'Never mind']);
    if (c === 0) return DB.menus.inn(20);
    if (c === 1) await S.say('hettie', S.v({ _: "You look like you could use a second helping. Go on, don't be shy.", healer: "Mistvale healers always have a gentle look about them. Eat. You're thin as a candle." }));
  };
  SC.bram_talk = async function (S) { await S.say('bram', S.G.flags.mq >= 5 ? "Pip's been through here twice this morning. Both times for pie." : "The good stew's on the house tonight. It's always on the house tonight."); };

  /* ----- Q2: the lighthouse keeper ----- */
  SC.pip_talk = async function (S) {
    var G = S.G, mq = mqs(G);
    if (mq === 2 && !G.flags.maren_met) {
      await S.say('pip', "Elder Maren! She's been waiting for you! She said it'd be a hero with a glowing hand and — look at you, you've got the hand! Come on, I'll show you the way!");
      await S.fade(1, 500); S.partyAt(0, 0); await S.map('halcyon_lighthouse', 'start', { noMode: true });
      return SC.mq2_lighthouse(S);
    }
    if (mq === 4 && G.flags.festival_on) return SC.q4_pip(S);
    if (mq === 6 && G.flags.q6_planned && !G.flags.boss_vashka) { await S.say('pip', "..."); return; }
    if (G.quests.sq1 === 'active') return SC.sq1_pip(S);
    if (!G.quests.sq1 && mq >= 2) return SC.sq1_start(S);
    await S.say('pip', S.v({ _: "Welcome to Port Halcyon! Unofficially, I'm the harbor master.", knight: "Sir! Can you show me how you do the sword thing? Unofficially?", rogue: "You're not stealing anything, right? Unofficially, I'm watching.", berserker: "You're BIG. Do you eat a lot? Hettie says you eat a lot." }));
  };
  SC.mq2_lighthouse = async function (S) {
    S.tint('#ff9a3c', .16); S.music('lanterns', 2); S.partyAt(767, 880, 'up'); S.spawn('pip_x', 'pip', 800, 900, 'up', { name: 'Pip' });
    var m = S.ent('maren'); if (m) { m.scripted = true; }
    S.cam(767, 520, 0); await S.fade(0, 700);
    await S.narr("The lighthouse at sunset. Inside, an old woman with silver, sightless eyes sits beside the great lamp — cold and dark.");
    await S.partyWalk(767, 600, 50); S.face('maren', 'HERO');
    await S.say('maren', "Come in, Ember. I heard the sea scream this morning. That was you, I think. And something that wanted you dead.");
    await S.hsay({ _: "You know what this mark is?" });
    await S.say('maren', "I know it is the Dawnmark. I know there are six. I know that three hundred years ago, six heroes bore them, and the world lived because of it. And I know what it cost them. *beat* The lamp has been dark for nine days. On the night it went out, every lighthouse on every coast in Eldmere went out with it. The Black Sun is breathing again.");
    await S.hsay({ _: "Then how do I stop it?" });
    await S.say('maren', "Not alone. Never alone. That was the mistake last time.");
    await S.say('maren', "Three Lumen Shards. They were scattered when the light failed — one in the Tidecaller Grotto beneath the isle, one in the old shrine on the Whispering Cliffs, and one... where the sea keeps its secrets. Bring them to me, and I will wake the lamp.");
    S.despawn('pip_x'); S.tint(null); S.flag('maren_met', 1); S.xp(200); S.done('mq2'); S.mq(3); S.quest('mq3'); S.flag('mq3_go', 1); S.camFollow(); S.healAll();
    S.toast('The Cliff Road (north of the plaza) is now open. The Grotto lies west of it.', 'quest');
  };
  SC.maren_talk = async function (S) {
    var G = S.G, mq = mqs(G);
    if (mq === 2 && !G.flags.maren_met) return SC.mq2_lighthouse(S);
    if (mq === 6 && G.flags.q6_have3) return SC.q6_light(S);
    await S.say('maren', S.v({ _: "Walk gently, Ember. The sea listens.", healer: "Child of Mistvale — you carry a gentler flame than most. Keep it that way.", knight: "Your Order would say the oath binds you to the crown. The sea says it binds you to the shore. Listen to both." }));
    if (mq >= 3 && mq <= 6) await S.say('maren', "Three shards. Bring them to the lamp.");
  };
  SC.pip_lh_talk = async function (S) { await S.say('pip', "I've never seen the lamp lit. Not once! Maren says it's like a second sunrise."); };
  SC.lamp_use = async function (S) {
    var G = S.G; if (mqs(G) === 6 && G.flags.q6_have3) return SC.q6_light(S);
    await S.narr(G.flags.lamp_lit ? "The great lamp burns steady, its glass full of dawn." : "The great lamp is cold. Three hollows wait in its crystal for the Lumen Shards.");
  };

  /* ----- Q3: Tidecaller Grotto & Liora ----- */
  SC.q3_liora = async function (S) {
    var G = S.G; S.flag('liora_met', 1); S.flag('anwen_met', 1);
    S.music('lanterns', 1); await S.partyWalk(767, 860, 50);
    if (S.is('liora')) {
      /* HOMECOMING VARIANT A */
      S.spawn('anwen', 'anwen', 700, 800, 'right', { name: 'Sister Anwen' }); S.spawn('garrick', 'garrick', 740, 800, 'left', { name: 'Garrick' });
      S.cam(740, 810, 600); await S.wait(300);
      await S.say('anwen', "Hold still, Garrick. Hold *still*, I swear by the Gentle Flame I'll put you back to sleep. *notices* ...Liora?");
      await S.hsay({ _: "Sister Anwen! You — you sailed after me?" }, 'surprised');
      await S.say('anwen', "A whole fortnight of seasickness. I'd do it twice. Come here, child. I brought something of mine you should have.");
      S.give('mercy_mistvale', 1); await S.say('anwen', "The Mercy of Mistvale. It carried me through forty years of the temple. It will carry you further. *gently* You were always the brightest flame in the temple. Go burn, child.");
      await S.hsay({ _: "I... I will. Thank you." }, 'happy');
      DB.equip('liora', 'mercy_mistvale'); S.despawn('anwen'); S.despawn('garrick');
      S.spawnHero('rowan', 600, 780, 'right'); S.cam(680, 800, 600);
      await S.say('rowan', "...Sorry. I followed the light. It's — loud. I don't like crowds. Is this the right place? *sees your hand; slowly removes a glove*", 'worried');
      await S.say('rowan', "I thought it was the forest's sickness.");
      await S.hsay({ _: "It isn't. You're one of us." });
      await S.say('rowan', "...Us.", 'happy');
      S.despawn('rowan'); DB.join('rowan', { guest: true, lvOffset: 0 }); S.flag('rowan_early', 1); UI_party();
      S.toast('Rowan joined as a guest!', 'quest'); S.sfx('quest_complete');
    } else {
      S.spawnHero('liora', 700, 800, 'right'); S.spawn('garrick', 'garrick', 745, 800, 'left', { name: 'Garrick' });
      S.cam(740, 810, 600); await S.wait(300);
      await S.say('liora', "Hold still. Hold *still*, Garrick, I swear by the Gentle Flame I will put you back to sleep. *notices you* Oh! Are you — *sees the glowing hand; holds up her own* ...Oh.", 'surprised');
      await S.hsay({ _: "You too." });
      await S.say('liora', "I followed the light here from Mistvale. I thought I was going mad. *laughs, a little teary* I'm so glad I'm not going mad alone.", 'happy');
      await S.hsay({ knight: "Then we'll be sane together, my lady.", rogue: "Well. I'm going mad a little. But it's nice to have company.", berserker: "HA! Two glowing hands! Twice the destiny!", hunter: "...Good. I didn't know what to say. But good.", mage: "Statistically, shared hallucination is less likely than a shared cause. Good." });
      await S.say('liora', "Let me come with you into the grotto. You'll get hurt. People like you always get hurt.", 'worried');
      S.despawn('garrick'); S.despawn('liora'); S.join('liora');
    }
    S.camFollow(); S.music('grotto', 1);
    DB.ui.hint('Tip: tap a party portrait (top-left) to switch who you control.'); setTimeout(function () { DB.ui.hint(null); }, 7000);
    S.xp(0, true);
  };
  function UI_party() { DB.ui.invalidateParty(); }
  SC.grotto_valve = async function (S) {
    S.flag('grotto_drained', 1); S.sfx('water_splash'); S.shake(4); await S.narr("The valve groans. Somewhere deep, the tide drains from the gate.");
    var e = S.ent('valve1'); if (e) e.state = 1; DB.G.flags['obj_' + DB.world.mapId + '_valve1'] = 1; DB.objActivate('tide_gate', true);
  };
  SC.q3_boss_intro = async function (S) {
    S.partyWalk(767, 330, 40); S.music('boss', 1); S.shake(5); S.sfx('roar');
    await S.say(null, "At the grotto's heart, coral claws unfold. Something old and patient wakes.");
    await S.boss('coral_matriarch', { lv: 6, x: 767, y: 150, onWin: 'q3_win' });
  };
  SC.q3_win = async function (S) {
    S.music('grotto', 2); S.give('lumen1', 1); S.xp(500); S.healAll();
    await S.narr("The Coral Matriarch crumbles into glittering sand. In the rubble: a shard of living light.");
    S.done('mq3'); S.mq(4); S.quest('mq4'); S.ensureLevel(6);
    await S.say(S.G.members.liora && !S.is('liora') ? 'liora' : 'HERO', "Come on. It's nearly dusk — and I've heard Halcyon is in a festival mood.", 'happy');
    S.flag('festival_pending', 1);
    await S.map('port_halcyon', 'start'); await SC.q4_start(S);
  };

  /* ----- Q4: Festival of First Light ----- */
  SC.q4_start = async function (S) {
    S.flag('festival_on', 1); S.flag('festival_pending', 0); S.music('festival', 2); S.tint('#ff8a4a', .1);
    S.partyAt(768, 600, 'up'); S.spawn('pip_f', 'pip', 820, 620, 'left', { name: 'Pip' });
    S.cam(768, 520, 0);
    await S.narr("Evening in Port Halcyon. The whole town strings lanterns. Music, dancing, food stalls.");
    await S.say('pip', "You're back! You're back, and just in time! Come on, come on — there's a lantern toss, and Hettie's pie contest, and the fiddlers, and — everything! Talk to me when you're ready for the lanterns on the water!");
    S.despawn('pip_f'); S.camFollow(); DB.ui.hint('Try the festival games! Stalls: Lantern Toss (plaza), Hettie\'s pies, the fiddler. Talk to Pip when ready.'); setTimeout(function () { DB.ui.hint(null); }, 9000);
  };
  /* festival stalls: these NPCs are added by the map when festival_on */
  SC.toss_stall = async function (S) {
    var G = S.G; if (G.flags.toss_done) { await S.say('fenn', "Come back next year, champ! The prizes are all gone!"); return; }
    await S.say('fenn', "Lantern Toss! Five lanterns, five chances. Land them on the target! Best score wins glory — and a few coins.");
    var r = await S.mini.timing({ title: 'Lantern Toss', rounds: 5, speed: 1.15, zone: .22, intro: 'Tap to launch the lantern when the marker crosses the glowing target.', label: 'TOSS!' });
    S.flag('toss_done', 1); await S.say('fenn', r.hits >= 3 ? "Ha! Nicely thrown! A natural!" : "Not bad, not bad! You've got the heart, at least.");
    S.xp(100); S.gold(20 + r.hits * 10);
  };
  SC.hettie_stall = async function (S) {
    var G = S.G; if (G.flags.pie_done) { await S.say('hettie', "Another slice, dear? Oh, you've had plenty. Plenty!"); return; }
    await S.say('hettie', "Hettie's Pie-Eating Contest! Whoever finishes first gets the last slice free.");
    if (S.cls() === 'berserker') { await S.hsay({ berserker: "I have trained my whole life for this." }); await S.narr("The contest is not close. Hettie fetches a second table."); }
    else { var r = await S.mini.mash({ title: "Hettie's Pie Contest", seconds: 8, goal: 45, rival: 4.5, intro: 'Tap to eat! Finish before the rival does.' }); await S.say('hettie', r.won ? "Look at that! Cleaned the whole plate!" : "Tough luck, dear! The rival is a fisherman. He has a stomach like a boat."); }
    S.flag('pie_done', 1); S.xp(100); S.give('sea_biscuits', 2);
  };
  SC.fiddler_talk = async function (S) {
    var G = S.G; if (G.flags.dance_done) { await S.say('fiddler', "Wonderful dancing! I'll play it again at the next festival."); return; }
    var partner = S.is('liora') ? 'anwen' : 'liora';
    var c = await S.choice('Dance?', [S.is('liora') ? 'Dance with Pip' : 'Dance with Liora', 'Not right now']); if (c !== 0) return;
    await S.say('fiddler', "Take your partners! Follow the hearts!");
    var r = await S.mini.rhythm({ title: 'Festival Dance', notes: 18, bpm: 110 });
    S.flag('dance_done', 1); S.xp(150); if (!S.is('liora')) S.affinity('liora', 2);
    await S.say(S.is('liora') ? 'pip' : 'liora', r.hit >= 12 ? "That was wonderful!" : "I think I stepped on your foot. Twice. Don't tell anyone.", 'happy');
  };
  DB.speakers.fiddler = { name: 'Festival Fiddler', npc: 'scholar' };
  SC.q4_pip = async function (S) {
    var G = S.G; if (!G.flags.toss_done && !G.flags.pie_done && !G.flags.dance_done) { var c = await S.choice('Pip bounces on his toes.', ['Ready — to the lanterns', 'Let me play a little more']); if (c !== 0) return; }
    S.flag('festival_on', 0);
    await S.say('pip', "Come on! The pier! The lanterns go out in a minute!");
    await S.fade(1, 600); await S.cardText('<div class="cl">Lanterns on the Water</div>', 1800);
    S.tint('#2a3a8a', .22); S.music('lanterns', 2); S.partyAt(1380, 575, 'left');
    var withLiora = !S.is('liora');
    S.cam(1360, 575, 0); await S.fade(0, 800);
    if (G.quests.sq3 === 'done' || G.flags.ring_given) { S.spawn('tomas_f', 'tomas', 1300, 570, 'right', { name: 'Tomas' }); S.spawn('bride', 'farmer_mother', 1330, 570, 'left', { name: 'Marla' }); await S.say('tomas', "*kneels, trembling, with the ring from the sea* Marla — I lost this once. I will never lose you. Will you...?", null); await S.say('bride', "*laughing, crying* Yes, you great fool. YES.", null); S.despawn('tomas_f'); S.despawn('bride'); }
    await S.narr("The town releases floating lanterns into the harbor. You sit on the pier, feet dangling over the water.");
    if (withLiora) {
      S.spawnHero('liora', 1330, 575, 'left'); S.despawn('liora');
      await S.say('liora', "In Mistvale, we write the name of someone we lost on our lantern. So the light can find them.");
      await S.narr("She writes TAM on hers.");
      await S.hsay({ _: "Who was he?" });
      await S.say('liora', "My little brother. He was seven. He had a fever, and I was fourteen, and I'd just learned my first healing prayer, and... *she sets the lantern on the water* ...it wasn't enough.", 'sad');
      await S.hsay({ _: "You were a child." });
      await S.say('liora', "I know. I tell myself that every day. *watches the lantern drift* What about you? Anyone to write down?", 'neutral');
      var c = await S.choice('Write a name?', ['Write a name', 'Leave it blank']);
      if (c === 0) {
        await S.hsay({ knight: "Sir Edran.", rogue: "Me. When I was little.", hunter: "Father.", berserker: "Hald. He's alive, I just... miss him.", mage: "The girl I used to be." });
        await S.say('liora', "...Thank you for telling me.", 'sad'); S.affinity('liora', 2);
      } else { await S.hsay({ _: "Not yet." }); await S.say('liora', "Good. Keep it that way as long as you can.", 'happy'); }
    } else {
      S.spawn('anwen', 'anwen', 1330, 575, 'left', { name: 'Sister Anwen' });
      await S.say('anwen', "In Mistvale, we write the name of someone we lost on our lantern. So the light can find them. I wrote one for Tam, you know. Every year, since the fever.");
      await S.hsay({ _: "...You did?" }, 'sad');
      await S.say('anwen', "He was seven. You were fourteen, and you'd just learned your first healing prayer. It wasn't enough. It was never going to be enough. *quietly* You were a child, Liora.");
      await S.narr("You write TAM on your lantern, and set it on the water beside hers.");
      S.despawn('anwen');
    }
    await S.say('pip', "*runs up, sticky-fingered and grinning* There you are!! Come ON! They're lighting the fireworks! You can't miss the fireworks!", null);
    S.sfx('dawnmark_burst'); await S.flash('#ffe9b0', 600); S.shake(3);
    await S.narr("Fireworks burst over the harbor. Pip drags everyone back to the dancing.");
    S.tint(null); S.xp(300); S.done('mq4'); S.mq(5); S.quest('mq5'); S.healAll(); S.ensureLevel(7);
    await S.map('port_halcyon', 'start'); S.camFollow();
    S.toast('The Cliff Road leads north to the Whispering Cliffs.', 'quest');
  };

  /* ----- Q5: Whispering Cliffs ----- */
  SC.q5_maren = async function (S) {
    S.flag('maren_story', 1); S.partyWalk(750, 380, 40); S.spawn('maren_w', 'elder_maren', 750, 330, 'down', { name: 'Elder Maren' });
    await S.say('maren', "Walk with me a while. I'm too old for cliffs, but not too old for company.");
    await S.say('maren', "Six heroes. A knight, a healer, a thief, a hunter, a warrior, and a mage. And a seventh — the one who led them. He bore the brightest mark of all. History forgot his name. I think he wanted it that way.");
    await S.hsay({ _: "Why would he want that?" });
    await S.say('maren', "Because remembering him means remembering what it cost. *softly* Go on, Ember. The shrine is above. I'll keep the lamp warm.");
    S.despawn('maren_w'); S.camFollow();
  };
  SC.q5_boss_intro = async function (S) {
    S.music('boss', 1); S.partyWalk(767, 340, 40); S.sfx('wind'); S.shake(6);
    await S.say(null, "A scream splits the sky. The Stormcrest Harpy Queen dives from the shrine's high plaza.");
    await S.boss('harpy_queen', { lv: 9, x: 767, y: 170, onWin: 'q5_win' });
  };
  SC.q5_win = async function (S) {
    S.give('lumen2', 1); S.xp(600); S.healAll(); S.done('mq5'); S.mq(6); S.quest('mq6'); S.ensureLevel(9); S.music('cliffs', 2);
    await S.narr("The queen falls, and the shrine's wind goes quiet. In her nest: a shard of captured dawn.");
    await S.map('port_halcyon', 'coast'); await SC.q6_note(S);
  };

  /* ----- Q6: The Drowned Lighthouse ----- */
  SC.q6_note = async function (S) {
    S.flag('q6_pending', 1); S.partyAt(650, 90, 'down'); S.music('sad', 1); S.cam(650, 120, 0);
    await S.say('guard1', "Hey! You — Embers! The inn! Pip's gone, and there's a note nailed to the door!", null);
    S.camFollow(); S.toast('Go to the Salty Lantern Inn.', 'quest');
    S.flag('q6_inn_trigger', 1);
  };
  SC.q6_inn_note = async function (S) {
    S.flag('q6_planned', 1); S.partyAt(388, 430, 'down');
    await S.narr("A note, tacked to the inn door with a harpoon. The ink runs green, like seaweed.");
    await S.say('voice', "\"The little dock-rat for the last shard. Come to the old drowned lighthouse at low tide. Come alone, Ember. — V.\"");
    S.spawn('marisol_n', 'marisol', 450, 440, 'left', { name: 'Captain Marisol' });
    await S.say('marisol', "The old lighthouse sank in the great storm forty years back. You can only reach it at the lowest tide. You'll have one hour before the sea takes it back.");
    await S.say('marisol', "From the east pier. The tide's turning *now*. Go.");
    S.despawn('marisol_n'); S.flag('tide_open', 1); S.quest('mq6');
    S.toast('Head to the east pier (Brightwater Coast, east). The tide waits for no one.', 'quest');
  };
  SC.q6_boss_intro = async function (S) {
    S.music('boss', 1); S.partyWalk(767, 340, 40);
    await S.say('vashka', "*rises from the spiral on the floor, wreathed in drowned robes* You came! And you brought *friends*. How lovely. The little rat is in the cage, darling. He sings so sweetly when he's frightened.");
    await S.hsay({ _: "Let him go." });
    await S.say('vashka', "Oh, I will. After the tide takes you.");
    await S.boss('vashka', { lv: 12, x: 767, y: 170, onWin: 'q6_win' });
  };
  SC.q6_win = async function (S) {
    DB.story.clearTimer(); S.flag('q6_done', 1); S.music('drowned', 2);
    await S.narr("Vashka dissolves, screaming, into brine and foam.");
    var cage = S.ent('pipcage'); if (cage) { cage.state = 1; }
    S.spawn('pip_c', 'pip', 1335, 360, 'down', { name: 'Pip' }); await S.partyWalk(1300, 400, 55);
    await S.say('pip', "*shaking, but brave* I knew you'd come. I *told* her you'd come.");
    S.give('lumen3', 1); S.flag('q6_have3', 1); S.xp(0, true);
    await S.narr("You take the Third Shard. As you climb out, the sea rushes back in.");
    S.despawn('pip_c'); S.healAll(); S.ensureLevel(12);
    S.fade(1, 600); await S.wait(700); await S.map('halcyon_lighthouse', 'start', { noMode: true }); await SC.q6_light(S);
  };
  SC.q6_tide_fail = async function (S) {
    await S.fade(1, 900, '#0a2a5a'); S.healAll();
    await S.narr("The tide returns. The sea takes the lighthouse, and carries you out with it...");
    await S.map('brightwater_coast', 'dock', { noMode: true }); await S.fade(0, 800);
    await S.say('marisol', "Out of the water, Ember! The tide's turned — but she can't hold it forever. We'll try again at the next low tide. Go on!");
    S.camFollow();
  };
  SC.q6_light = async function (S) {
    S.tint(null); S.partyAt(767, 560, 'up'); S.cam(767, 520, 0); S.spawn('pip_l', 'pip', 820, 590, 'up', { name: 'Pip' });
    S.spawn('marisol_l', 'marisol', 700, 640, 'right', { name: 'Captain Marisol' });
    var m = S.ent('maren'); if (m) { m.x = 640; m.y = 470; m.scripted = true; }
    await S.fade(0, 600); S.music('lanterns', 2);
    await S.narr("Back at the lighthouse. You place the three Shards in their hollows.");
    S.sfx('dawnmark_burst'); await S.flash('#fff6d0', 1200); S.shake(6);
    S.flag('lamp_lit', 1);
    await S.narr("The great lamp blazes to life. Across the sea, one by one, lighthouses all over Eldmere reignite. The whole town cheers from below.");
    await S.say('maren', "*smiling, then swaying*");
    var lioraHere = !S.is('liora') && S.G.members.liora;
    await S.say(lioraHere ? 'liora' : 'rowan', "Elder — you're freezing —", 'worried');
    await S.say('maren', "Relighting the lamp takes a little of the keeper, dear. It always has. I'm all right. I have a few more lights in me. *to you* Now listen. The Dark Lord has four Heralds. You beat the weakest. The other Dawnmarks are out there — five of them. Four, now that you've found your healer. Find them. Bring them together. That's your only chance.");
    await S.say('marisol', "*at the door* *Wandering Gull*'s repaired. Hettie packed enough food for an army. Where to, Ember?");
    S.despawn('pip_l'); S.despawn('marisol_l'); if (m) m.scripted = false;
    S.flag('ship', 1); S.xp(1000); S.done('mq6'); S.mq(7); S.quest('mq7'); S.healAll(); S.ensureLevel(12); S.camFollow();
    await S.card('END OF ACT I', 'The Light at the Edge of the Sea', 2800);
    S.toast('The Wandering Gull is yours. Open the menu → Map to sail.', 'quest');
    S.toast('Sail to Greythorn to follow the silence.', 'quest');
  };
  SC.marisol_hub = async function (S) {
    var G = S.G; if (!G.flags.ship) { await S.say('marisol', "She's patched, mostly. Give the carpenters a few days."); return; }
    if (mqs(G) === 23) { var c0 = await S.choice('Marisol grips the wheel.', ['Set course for the Hollow Wastes', 'Not yet']); if (c0 === 0) { await S.say('marisol', "Hold on to something. The Dead Sea doesn't play fair."); return SC.q23_sail(S); } return; }
    var c = await S.choice('Marisol taps her pipe.', ['Set sail', 'Just talking']);
    if (c === 0) { await S.say('marisol', "Where to, Ember?"); DB.ui.hideDialogue(); await S.sail(); } else await S.say('marisol', S.v({ _: "Loyal as rust, that's me.", rogue: "I counted my cargo twice after you boarded. Twice." }));
  };
  SC.odell_talk = async function (S) {
    var G = S.G; if (G.quests.sq6 === 'done') { await S.say('odell', "My speech was a triumph! Well. People *laughed*. At the right parts, mostly."); return; }
    return SC.sq6_start(S);
  };
  SC.tomas_talk = async function (S) { return SC.sq3_start(S); };
  SC.archivist_talk = async function (S) { return SC.archivist_scene(S); };
  SC.ghost_talk = async function (S) { return SC.sq5_ghost(S); };
  SC.cove_redd = async function (S) { return SC.sq4_redd(S); };
})();
