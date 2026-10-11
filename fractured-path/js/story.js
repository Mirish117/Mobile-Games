/* story.js - The Fractured Path, Chapter I: both arcs.
   Lore in brief: the Hollow Bell once rang over Myrrowen and carried away grief. It cracked into four Chimes.
   The Hush (and its heart, the Undertow) is every sorrow the Bell took and nobody was allowed to keep. */
(function (FP) {
  'use strict';
  var D = FP.D, U = FP.ui;
  var S = FP.story = {};
  var EV = {};
  function G() { return FP.G; }
  function F() { return FP.field; }
  function hero() { return G().arc === 'hero'; }
  function has(f) { return !!G().flags[f]; }
  function set(f) { G().flags[f] = true; }
  function me(mood) { return { name: G().name, port: { look: FP.heroLook(), mood: mood || 'calm', bg: ['#2a2f5a', '#5a3a7a'], eye: '#4a5a8a' } }; }
  var NAMES = { matron: 'Briar Matron', saltmaw: 'Saltmaw', paleking: 'The Pale King', sentinel: 'Lamp Sentinel', undertow: 'The Undertow', aldric: 'Lord Aldric' };
  function W(who) { return who === 'me' ? me() : (typeof who === 'string' && NAMES[who]) ? { name: NAMES[who] } : who; }
  async function say(who, text, o) { await U.say(W(who), text, o); }
  async function seq(arr) { for (var i = 0; i < arr.length; i++) await say(arr[i][0], arr[i][1], arr[i][2]); }
  async function ask(who, text, opts) { await say(who, text, { keep: true }); var i = await U.choice(opts); U.hideDlg(); return i; }
  function obj(t) { G().objective = t; U.toast('Objective updated'); }
  function giveKin(sp, lv, nick) {
    var k = D.newKin(sp, lv, nick || ''); G().kin.push(k);
    if (G().party.length < 2) G().party.push(G().kin.length - 1);
    return k;
  }
  async function reward(text) { FP.sfx.chest(); await say(null, text); }
  async function chime(id, name) {
    FP.addItem(id, 1);
    if (FP.music) FP.music.jingle('fanfare');
    await FP.sleep(900);
    await say(null, 'Obtained the ' + name + '!');
  }
  function mood(song) { if (FP.music) FP.music.play(song); }
  function unmood() { if (FP.music && F().map) FP.music.play(F().map.music); }
  async function fight(spec) {
    spec.noFlee = true;
    var r = await FP.battle.start(spec);
    if (r === 'lose' && !spec.mercy) { await FP.gameOver(); return null; }
    return r;
  }
  function look(dir) { F().face('player', dir); }
  async function shake() { F().doShake(500); FP.sfx.quake(); await FP.sleep(550); }
  async function flash() { F().doFlash(); await FP.sleep(300); }
  function nobody(npc) { return !npc; }

  /* ================================================================ BEGIN / LOAD */
  S.begin = async function () {
    var g = G(), m;
    if (g.arc === 'hero') {
      m = FP.getMap('th_home'); g.map = 'th_home'; g.x = m.entry.x; g.y = m.entry.y - 1; g.dir = 'd';
      giveKin('wick', 3); g.gold += 40; g.shrine = null;
      g.objective = 'Speak with Elder Maro. His house is next door.';
    } else {
      m = FP.getMap('ci_hall'); g.map = 'ci_hall'; g.x = m.entry.x; g.y = m.entry.y - 1; g.dir = 'u';
      giveKin('soot', 3); g.gold += 40; g.inv.ashband = 1; g.shrine = null;
      g.objective = 'Sable is waiting in the Ember Hall.';
    }
    g.flags.started = true; g.flags[g.arc === 'hero' ? 'h_started' : 'v_started'] = true;
  };
  S.afterLoad = async function (fresh) {
    var g = G(), f = F();
    if (!fresh) return;
    f.lock();
    try {
      if (hero()) {
        U.banner('Chapter I', 'The Lamp in the Window');
        await FP.sleep(1200);
        await seq([
          [null, 'Dawn in Thistledown. For two hundred years the Hollow Bell has been silent, and every year the quiet creeps a little closer.'],
          [null, 'Last night the Kin in the pasture stopped singing. Today, someone has to find out why.'],
          [null, 'Walk with the pad or arrow keys. Press A to talk and to open doors. Press MENU for your gear, skills and journal.']
        ]);
      } else {
        U.banner('Chapter I', 'Ash and Appetite');
        await FP.sleep(1200);
        f.faceToward('player', 6, 3);
        await f.walk('player', [['u', 2]]);
        await seq([
          [null, 'Cinderhold. A valley the Crown walled in and called mercy. You grew up counting the days between ashfalls.'],
          ['sable', 'Come closer, child. I will not bite. The ash has already had its fill of me.'],
          ['corvin', 'This is who you chose? They look half asleep.'],
          ['sable', 'Corvin. Manners. I am sending a stray to fetch a Chime. Not a courtier.'],
          ['sable', 'Four fragments of the Hollow Bell lie scattered across Myrrowen. Whoever holds all four decides who the Bell sings for. The Crown has kept it silent for two hundred years. And us walled in beneath it.'],
          ['sable', 'Take Soot. Take the Ash Band. Go west to the Whisperwood where the Heart-tree keeps the Dawn Chime. Corvin will meet you there, and I would be pleased if you both came back.'],
          ['corvin', 'I will be pleased if I come back first.']
        ]);
        g.objective = 'Journey west to the Whisperwood. Find the Heart-tree.';
        U.toast('Objective updated');
      }
    } finally { f.unlock(); }
  };
  S.onEnter = function (m) {
    var f = F(), g = G();
    if (!f || !g) return;
    setTimeout(function () {
      try {
        if (m.id === 'br_harbor' && has('v_iola_beat')) f.hideNpc('iola');
        if (m.id === 'wood') {
          if (has('h_matron_done') || has('v_matron_done')) { f.hideNpc('wren'); }
          if (has('cage_moss_done')) f.hideNpc('cage_moss');
          if (has('v_corvin_met')) f.hideNpc('corvin_w');
        }
        if (m.id === 'beacon2' && has('cage_wisp_done')) f.hideNpc('cage_wisp');
        if (m.id === 'crypt1' && has('noble_done')) f.hideNpc('cage_noble');
        if (m.id === 'arch1' && has('archivist_met') && false) f.hideNpc('archivist');
      } catch (e) {}
    }, 0);
  };

  S.run = async function (name, npc, ctx) {
    var h = EV[name];
    if (!h) { await say(null, '...'); return; }
    await h(npc, ctx);
  };

  /* ================================================================ THISTLEDOWN */
  EV.maro = async function () {
    var g = G();
    if (!hero()) {
      await seq([['seren', 'Ashen. A long road from the valley. I will not call the guards, and you will not give me reason to wish I had.'],
        ['seren', 'If you seek the Dawn Chime, it sleeps in the Whisperwood under a guardian who has forgotten how to be kind. Walk gently there. Or do not. People rarely listen.']]);
      return;
    }
    if (!has('h_maro_met')) {
      set('h_maro_met');
      await seq([
        ['seren', 'Ah. The lamp-carrier is awake. Come in, come in. Mind the books.'],
        ['seren', 'Do you remember the Bell song your mother hummed? That is all most of us have left. The Hollow Bell cracked two hundred years ago and its four Chimes scattered. Since then a silence called the Hush has been creeping in, and Kin all over Myrrowen go wild.'],
        ['seren', 'Last night, Wren went to the Whisperwood to follow a runaway Kin. She has not come back.'],
        ['me', 'Wren? She is always back by dark.', null],
        ['seren', 'Yes. That is what frightens me.'],
        ['seren', 'Take this lamp. It is only an old lamp. But the Hush stays its distance from anything that remembers being lit. Go west to the Whisperwood. Find her.']
      ].map(function (a) { return a.length === 3 ? [a[0], a[1]] : a; }));
      FP.addItem('hipotion', 2); FP.addItem('cord', 3); g.gold += 80; set('h_wren_lost');
      await reward('Elder Maro gives you 2 Hi-Potions, 3 Tether Cords and 80 gold.');
      await say('seren', 'Tether Cords bind a weakened wild Kin, if it likes you. A kind companion is worth more than a sharp sword. Visit Mara\'s shop, and spend your ability points at the Skills menu.');
      obj('Find Wren in the Whisperwood. It lies west of Thistledown.');
      return;
    }
    if (has('h_matron_done') && !has('h_maro_report')) {
      set('h_maro_report');
      await seq([['seren', 'The Dawn Chime. Warm as a loaf. Then it is true. All of it.'],
        ['seren', 'The next fragment, the Tide Chime, was last seen in the Saltwatch Beacon beyond Brinehaven. The harbormaster, Hollis, will know. Take the road east, then south.']]);
      obj('Travel to Brinehaven and speak to Harbormaster Hollis.');
      return;
    }
    await say('seren', g.objective ? 'Remember: ' + g.objective : 'Walk safely.');
  };

  EV.wren_scene = async function (npc, z) {
    if (hero()) {
      if (!has('h_wren_lost') || has('h_wren_scene')) return;
      set('h_wren_scene');
      F().faceToward('player', F().npcById('wren').x, F().npcById('wren').y);
      await seq([['wren', 'You came! I was so sure nobody would find me. I mean. I was sure you would. Eventually.'],
        ['me', 'What happened out here?'],
        ['wren', 'Pip ran off, and I followed, and the trees closed behind me. The Heart-tree in the north is singing. It sings one note, over and over, and it is wrong.'],
        ['wren', 'The Briar Matron guards it. She used to protect the Kin. Now she cages them. There is a Mossback behind the cage by the western glade. Please let it out.'],
        ['wren', 'I will wait here. The brambles do not like me, but I do not like them either.']]);
      obj('Reach the Heart-tree in the north of the Whisperwood. Free the caged Mossback if you can.');
    } else {
      if (!has('v_started') || has('v_corvin_met')) return;
      await EV.corvin_forest(F().npcById('corvin_w'));
    }
  };

  EV.wren_forest = async function () {
    var g = G();
    if (!hero()) { await say('wren', 'Ashen? Stay away from me.'); return; }
    if (!has('wren_gift')) { set('wren_gift'); FP.addItem('tonic', 2); await say('wren', 'Take these. My gran says Tonic cures anything, including bad moods.'); await reward('Wren gives you 2 Tonics.'); return; }
    await say('wren', 'Go north, to the Heart-tree. I am fine. I am fine. Please hurry.');
  };

  EV.cage_moss = async function (npc) {
    if (has('cage_moss_done')) return;
    var i = await ask(null, 'A Mossback huddles behind a cage of thorned roots. It watches you with huge, wet eyes.', hero() ? ['Open the cage', 'Leave it'] : ['Open the cage', 'Take it by force', 'Leave it']);
    if (i === 0 || (!hero() && i === 1)) {
      set('cage_moss_done');
      await FP.sleep(200); FP.sfx.mend();
      if (hero() || i === 0) {
        giveKin('mossback', 4);
        await say(null, 'The roots loosen. The Mossback nuzzles your hand. It joins you!');
        if (!hero()) await say('me', 'Fine. Come along, shell. Do not slow me down.');
      } else {
        giveKin('mossback', 4);
        FP.sfx.hit(); await FP.sleep(300);
        await say(null, 'You tear the cage away. The Mossback flinches, then sullenly follows. It will not forget this.');
      }
      F().hideNpc('cage_moss');
      return;
    }
    await say(null, 'You leave the cage alone. The Mossback watches you go.');
  };

  /* ================================================================ WHISPERWOOD BOSS */
  EV.wood_boss = async function () {
    if (hero() ? has('h_matron_done') : has('v_matron_done')) return;
    if (hero() && !has('h_wren_scene')) { return; }
    if (!hero() && !has('v_corvin_met')) { return; }
    var f = F();
    f.lock();
    try {
      mood('sorrow');
      await shake();
      await seq([[null, 'The Heart-tree hums a single wrong note. A figure of bark and thorn unfolds from the roots.'],
        ['matron', 'Another one. Another small bright thing come to pull my song out by the roots.']]);
    } catch (e) {}
    f.unlock();
    var r = await fight({ foes: [{ id: 'b_matron', lv: 8 }], boss: true, bg: 'heart', music: 'boss', intro: 'The Briar Matron rises!' });
    if (r === null) return;
    f.lock();
    try {
      mood('sorrow');
      if (hero()) {
        set('h_matron_done'); set('h_wren_saved');
        await seq([['matron', '...the thorns fall quiet. Who... who are you?'],
          ['me', 'Someone who heard your tree singing wrong.'],
          ['matron', 'It sang right once. When the Bell was whole it carried each sorrow off, like a river. Then the Bell cracked, and now the sorrows stay, and they do not know where to go.'],
          ['matron', 'Take the Dawn Chime. It is warm because it remembers being rung. Do not let them make you forget why.']]);
        await chime('dawnchime', 'Dawn Chime');
        await seq([['wren', 'Is it over? Oh. Oh, you really did it.'], ['wren', 'I am going home to tell Gran I am sorry for worrying her. And then I am going to cry in the soup. Thank you.']]);
        giveKin('pipsprout', 5, '');
        await say(null, 'A Pipsprout trots out of the brush and presses against your leg. It decided it likes you!');
        obj('Take the Dawn Chime to Elder Maro in Thistledown, then head to Brinehaven.');
      } else {
        set('v_matron_done');
        await seq([['matron', 'Then... take it. You will take it anyway. Everyone does.'],
          ['corvin', 'Well. You are better than you looked.']]);
        var c = await ask(null, 'The Matron sags against the roots. The Dawn Chime glows in the hollow.', ['Take the Chime', 'Ask her what it cost']);
        if (c === 0) {
          set('v_took_chime'); G().gold += 150;
          await say('matron', 'Go on then.');
          await chime('dawnchime', 'Dawn Chime');
          await seq([['corvin', 'Sable would call that efficient.'], ['me', 'Sable can call it whatever she likes. It still hums.']]);
          await reward('You also find 150 gold in the roots.');
        } else {
          await seq([['me', 'Before I take it. What did it cost you?'],
            ['matron', '...Nobody has asked in two hundred years. It costs the one who holds it every sorrow the Bell ever took. Do you want that, little ash?'],
            ['me', 'Yes. It is ours. We have been carrying it anyway.'],
            ['matron', 'Then take it, and carry it well.']]);
          await chime('dawnchime', 'Dawn Chime');
          FP.addItem('hipotion', 3); FP.addItem('seed', 1);
          await reward('The Matron presses 3 Hi-Potions and a Rekindle Seed into your hands.');
        }
        giveKin('pipsprout', 5, '');
        await say(null, 'A Pipsprout, left leaderless, trots after you. It joins you!');
        obj('The next Chime is in the Saltwatch Beacon beyond Brinehaven. Speak to the harbormaster there.');
      }
    } finally { f.unlock(); unmood(); }
  };

  EV.corvin_forest = async function (npc) {
    if (hero() || has('v_corvin_met')) return;
    set('v_corvin_met');
    var f = F();
    f.lock();
    try {
      await seq([['corvin', 'You are slow, stray. I counted four trees you stared at.'],
        ['me', 'Four trees worth staring at. You are the one Sable sent?'],
        ['corvin', 'Corvin. Second hand of Cinderhold. I do not need help. But I was told to see if you were worth the trouble. Show me.']]);
    } catch (e) {}
    f.unlock();
    var r = await fight({ foes: [{ id: 'r_corvin', lv: 7 }], rival: true, mercy: true, bg: 'forest', music: 'boss', intro: 'Corvin draws a blade of ash!' });
    if (r === null) return;
    f.lock();
    try {
      G().hp = Math.max(G().hp, 10);
      await seq([['corvin', r === 'win' ? 'Hm. Fine. You are worth the trouble.' : 'Not yet. But you stood up. That counts for something.'],
        ['corvin', 'The Heart-tree is north. First to the Chime gets bragging rights. Do not die. Sable would be upset, and I would have to explain.']]);
      F().hideNpc('corvin_w');
      obj('Reach the Heart-tree in the north of the Whisperwood and claim the Dawn Chime.');
    } finally { f.unlock(); }
  };

  /* ================================================================ BRINEHAVEN */
  EV.hollis = async function () {
    var g = G();
    if (hero()) {
      if (!has('h_matron_done')) { await say('harbor', 'The beacon is dark and the ships are staying in. I would help a stranger more if I knew a stranger could do anything about it.'); return; }
      if (!has('h_hollis')) {
        set('h_hollis');
        await seq([['harbor', 'The Dawn Chime? From the Whisperwood? Then I owe you an apology and a bowl of chowder.'],
          ['harbor', 'The Saltwatch Beacon hangs the Tide Chime in its lamp. When the keeper died, something called Saltmaw crawled up from the deep and sat on it. The sea has been confused ever since.'],
          ['harbor', 'Here is a Harbor Pass and the lantern key. Do not drown. It is bad for business.']]);
        FP.addItem('sailpass'); FP.addItem('lampkey'); g.gold += 100;
        await reward('Received a Harbor Pass, a Lamp Key and 100 gold.');
        obj('Climb the Saltwatch Beacon (southwest coast) and take the Tide Chime from Saltmaw.');
        return;
      }
      await say('harbor', has('h_beacon_done') ? 'The sea is breathing again. Go on to Highmoor. The king asked about you.' : 'The Beacon is southwest of the town. Mind the tide.');
    } else {
      if (!has('v_hollis')) {
        set('v_hollis');
        var i = await ask('harbor', 'Ashen. We keep our children inside when your people come to dock. State your business or leave my office.', ['Bribe him (100G)', 'Threaten him', 'Say nothing']);
        if (i === 0 && g.gold >= 100) {
          g.gold -= 100;
          await seq([['harbor', 'Hm. Well. Money has no race. The Beacon is southwest. Be quick, and be gone.']]);
        } else if (i === 1) {
          await seq([['me', 'The sea can get very quiet. Keep your lamp lit and your mouth open.'], ['harbor', 'You... fine. FINE. The Beacon is southwest.']]);
          set('v_threat');
        } else {
          await seq([['harbor', 'Silent type. I can respect that. The Beacon is southwest. Do not make me regret this.']]);
        }
        FP.addItem('sailpass'); FP.addItem('lampkey');
        await reward('Received a Harbor Pass and a Lamp Key.');
        obj('Climb the Saltwatch Beacon (southwest coast) and take the Tide Chime from Saltmaw.');
        return;
      }
      await say('harbor', 'You have what you came for. Go.');
    }
  };

  EV.iola = async function () {
    var g = G();
    if (hero()) {
      if (!has('h_iola')) {
        set('h_iola');
        await seq([['iola', 'Oh, thank the shelves. A person who does not ask me to speak softly. I am Iola Quill. Warden scholar. Reluctantly.'],
          ['iola', 'I study the Choir Journals. They say the Bell did not just ring. It took. Every ring took a sorrow from someone, and carried it away. Nobody wrote where it was carried to.'],
          ['iola', 'I would give a great deal to see the Archive in the east. It is flooded now. The Echo Chime is there. I think the answer is there.'],
          ['iola', 'Take this Warden Seal. It makes Highmoor\'s guards less twitchy.']]);
        FP.addItem('wardseal'); FP.addItem('journal');
        await reward('Iola gives you a Warden Seal and the Choir Journal.');
        return;
      }
      await say('iola', has('h_beacon_done') ? 'The Tide Chime! May I just hold it? For one moment? Oh. It sings. It really sings.' : 'The Archive is east of Highmoor. But the king first, the king first. Politics make books possible.');
    } else {
      if (has('v_iola_beat')) return;
      await seq([['iola', 'Ash Band. Hm. I never thought I would see a Cinderhold stray this far from the wall.'],
        ['iola', 'I am only a scholar. I will not stop you from reading. But whatever you are carrying out of that Beacon belongs to everybody, and everybody has not agreed.']]);
    }
  };

  /* ================================================================ SALTWATCH BEACON */
  EV.cage_wisp = async function () {
    if (has('cage_wisp_done')) return;
    var i = await ask(null, 'A tiny flame floats inside a rusted lantern cage. It gutters when you look at it, and brightens when you do not.', ['Open the cage', 'Leave it']);
    if (i === 0) {
      set('cage_wisp_done'); FP.sfx.mend(); await FP.sleep(300);
      giveKin('lampwisp', 10);
      await say(null, 'The wisp spirals up, then settles above your shoulder. It joins you!');
      F().hideNpc('cage_wisp');
    }
  };

  EV.beacon_boss = async function () {
    if (has('beacon_done')) return;
    var f = F();
    f.lock();
    try {
      mood('sorrow'); await shake();
      await seq([[null, 'The old lamp room. A great shape of salt and driftwood coils around the Tide Chime.'], ['saltmaw', 'MINE. THE SEA GAVE IT TO ME. MINE.']]);
    } catch (e) {}
    f.unlock();
    var r = await fight({ foes: [{ id: 'b_saltmaw', lv: 13 }], boss: true, bg: 'beacon', music: 'boss', intro: 'Saltmaw lunges from the tide!' });
    if (r === null) return;
    f.lock();
    try {
      set('beacon_done');
      await seq([[null, 'Saltmaw sags. Under the salt-crust is a battered old lighthouse dog, whining softly. It was the keeper\'s. It never left.'],
        [null, 'You kneel. It leans against you and falls asleep.']]);
      await chime('tidechime', 'Tide Chime');
      if (hero()) {
        set('h_beacon_done');
        await seq([['iola', 'You made it! I followed the light. I... oh.'], ['iola', 'He was the keeper\'s dog. The Hush did this. Everything it touches starts to hurt.'], ['me', 'Come with me to Highmoor. The king should hear.'], ['iola', 'I would, but the Archive calls, and my books are cranky if I leave them. Go. I will be right behind you.']]);
        obj('Travel north to Highmoor and speak to King Berenhart.');
      } else {
        await seq([['iola', 'You are not leaving with that.']]);
        var rr = await fight({ foes: [{ id: 'r_iola', lv: 13 }], rival: true, mercy: true, bg: 'beacon', music: 'boss', intro: 'Iola Quill blocks the stairs!' });
        if (rr === null) return;
        set('v_beacon_done'); set('v_iola_beat');
        await seq([['iola', rr === 'win' ? 'Ugh. Fine. You fight like someone with a reason.' : 'Enough. Go. I cannot... I do not want to hurt a child of the ash. I have read about the wall.'],
          ['iola', 'If you take the Chimes, at least ask what the Bell took from you before it took anything else. The Archive. Please.']]);
        obj('Travel north to Highmoor. King Berenhart holds the next secret.');
      }
      FP.addItem('hipotion', 2);
      await reward('You find 2 Hi-Potions in the old keeper\'s locker.');
    } finally { f.unlock(); unmood(); }
  };

  /* ================================================================ HIGHMOOR */
  EV.king = async function () {
    var g = G();
    if (hero()) {
      if (!has('h_beacon_done')) { await say('berenhart', 'Come back when you have something besides courage to offer. I have had much courage. It does not light rooms.'); return; }
      if (!has('h_king')) {
        set('h_king');
        await seq([['berenhart', 'Lampbearer. They say you walk where the Hush turns away. I am an old man and I am out of better words, so I will ask plainly.'],
          ['berenhart', 'My son Aldric went into Hollowmoor Crypt beneath this keep to pray at the first king\'s tomb. That was nine days ago. The Pale King, our founder, walks again. He is hollow, and he wears a crown that is also the Hollow Chime.'],
          ['berenhart', 'Bring my son home. Bring the Chime to someone who will use it kindly.']]);
        obj('Enter Hollowmoor Crypt (east of Highmoor). Rescue Lord Aldric and claim the Hollow Chime.');
        return;
      }
      if (has('crypt_done') && !has('h_king_reward')) {
        set('h_king_reward'); g.gold += 400; FP.addGear('c_5');
        await seq([['berenhart', 'He is home. He is alive, and he is angry at me, which is wonderful. You have earned a thing the Crown rarely gives.']]);
        await reward('Received 400 gold and the Crownward Charm.');
        obj('The Echo Chime lies in the Drowned Archive, far east. Iola Quill is already there.');
        return;
      }
      await say('berenhart', has('crypt_done') ? 'The Archive is the last road, they say. Walk it kindly.' : 'My son. Please.');
    } else {
      if (!has('v_king')) {
        set('v_king');
        await seq([['berenhart', 'An Ashen in my keep. I should call the guard. But I am tired of being the kind of king who calls the guard.'],
          ['berenhart', 'My son is in Hollowmoor Crypt. The first king has risen and wears a Chime for a crown. You want that Chime. I want my son. I think we both know what a bargain looks like.']]);
        var i = await ask('berenhart', 'Return my son, and I will unseal Cinderhold\'s wall. A king\'s word.', ['Agree to the bargain', 'Refuse']);
        if (i === 0) { set('v_pact'); await say('berenhart', 'Good. Good. Hollowmoor Crypt is east of here.'); }
        else { await say('berenhart', 'Then take the Chime and be gone. I cannot stop you. I am only a father.'); }
        obj('Enter Hollowmoor Crypt (east of Highmoor). Take the Hollow Chime from the Pale King.');
        return;
      }
      if (has('crypt_done') && !has('v_king_reward')) {
        set('v_king_reward');
        if (has('v_pact') && has('aldric_freed')) {
          g.gold += 400; FP.addGear('c_5');
          await seq([['berenhart', 'Aldric. Oh, Aldric. You kept your word, Ashen. I will keep mine; the wall will be opened by the next new moon.'], ['berenhart', 'Take this. It is not enough. It never is.']]);
          await reward('Received 400 gold and the Crownward Charm.');
        } else if (has('v_pact')) {
          await seq([['berenhart', 'You came back without him. I... will not be needing you in my keep. Leave. Now.']]);
          set('v_king_hates');
        } else {
          await seq([['berenhart', 'Take what you took. I hope it was worth it.']]);
        }
        obj('The Echo Chime lies in the Drowned Archive, far east. Odalys of the Wardens will be waiting.');
        return;
      }
      await say('berenhart', 'The Archive is where they will find you. And themselves.');
    }
  };

  EV.vane = async function () {
    var g = G();
    if (!has('vane_spar')) {
      var i = await ask('vane', hero() ? 'Warden Seal, is it? A seal is not a sword. Care to prove you hold one of those?' : 'Ashen. I will not have a sneak-thief in the king\'s keep without a lesson.', ['Spar with Vane', 'Not now']);
      if (i !== 0) return;
      set('vane_spar');
      var r = await fight({ foes: [{ id: 'r_vane', lv: 13 }], rival: true, mercy: true, bg: 'highmoor', music: 'boss', intro: 'Captain Vane raises his axe!' });
      if (r === null) return;
      if (r === 'win') {
        G().gold += 150; set('vane_won');
        await say('vane', 'Hah! That hurt. A good sort of hurt. Take this and never say I paid in anything but hard coin.');
        await reward('Received 150 gold.');
      } else await say('vane', 'Not bad for a green one. Come back stronger. I will still be here, resentful.');
      return;
    }
    await say('vane', has('vane_won') ? 'Whoever hits me that hard is welcome in any keep I guard.' : 'Train. Tether more Kin. Spend your ability points. Then come back.');
  };

  /* ================================================================ HOLLOWMOOR CRYPT */
  EV.crypt_noble = async function () {
    if (has('noble_done')) return;
    var f = F();
    if (hero()) {
      await seq([['aldric', 'Is that a lamp? Is it real? Please say it is real.'], ['me', 'It is real. You are Lord Aldric?'],
        ['aldric', 'Yes. The Pale King wanted a hall to wait in. He spoke of an old song and how it cost him his name. I think he is sad. It hurts to be near him.'],
        ['aldric', 'Free me, and I will wait outside the doors. I can walk. Barely.']]);
      var c = await ask(null, 'Cut the bindings and free Aldric?', ['Free him', 'Not yet']);
      if (c !== 0) return;
      set('noble_done'); set('aldric_freed'); FP.sfx.mend();
      F().hideNpc('cage_noble');
      FP.addItem('hipotion', 2);
      await say('aldric', 'I will tell Father it was you. Do not let him see me cry first. Take these, they were my provisions.');
      await reward('Received 2 Hi-Potions.');
      obj('Defeat the Pale King in the deepest hall and claim the Hollow Chime.');
    } else {
      await seq([['aldric', 'You... you are Ashen. Did my father send you?'], ['me', 'Your father made me an offer.']]);
      var v = await ask(null, 'Aldric is bound. What now?', ['Free him', 'Keep him bound for leverage', 'Leave him']);
      if (v === 0) {
        set('noble_done'); set('aldric_freed'); FP.sfx.mend(); F().hideNpc('cage_noble');
        await say('aldric', 'You freed me. They said your kind would not. I will remember it.');
      } else if (v === 1) {
        set('noble_done'); set('aldric_bound'); F().hideNpc('cage_noble');
        await seq([['aldric', 'You would hold a boy over his father?'], ['me', 'I would hold anything that opens a wall.']]);
        await say(null, 'You lead Aldric, still bound, out of the dark. He does not speak again.');
      } else return;
      obj('Defeat the Pale King in the deepest hall and claim the Hollow Chime.');
    }
  };

  EV.crypt_boss = async function () {
    if (has('crypt_done')) return;
    if (!has('noble_done') && hero()) { /* allow, but the story prefers Aldric first */ }
    var f = F();
    f.lock();
    try {
      mood('sorrow'); await shake();
      await seq([[null, 'A hall of empty thrones. On the tallest sits a tall figure wearing a crown of pale light.'],
        ['paleking', 'I remember being a king. I do not remember what a king is for.']]);
    } catch (e) {}
    f.unlock();
    var r = await fight({ foes: [{ id: 'b_paleking', lv: 17 }], boss: true, bg: 'crypt', music: 'boss', intro: 'The Pale King rises!' });
    if (r === null) return;
    f.lock();
    try {
      set('crypt_done');
      mood('sorrow');
      await seq([['paleking', 'The crown is lighter. I can hear... the song. Is that what I forgot?'],
        ['paleking', 'Take the Chime. It rang a grief into me that was never mine. A hundred hearts, a hundred hearths... the Bell took their sorrow and gave it to a king to hold. I held it as long as I could.']]);
      await chime('hollowchime', 'Hollow Chime');
      await say('paleking', 'Go to the Archive. Ask who the Bell rang for. Ask who it rang against.');
      if (hero()) obj('Return to King Berenhart. Then, travel east to the Drowned Archive.');
      else obj('Return to King Berenhart if you struck a bargain. Then, travel east to the Drowned Archive.');
    } finally { f.unlock(); unmood(); }
  };

  /* ================================================================ DROWNED ARCHIVE */
  EV.archivist1 = async function () {
    if (!has('archivist_met')) {
      set('archivist_met');
      await seq([['nyx', 'Welcome to the Drowned Archive. I am what the water left of a librarian. You may call me the Archivist.'],
        ['nyx', 'I keep every record the Bell erased. Be careful with them. Truths are sharp when dry.'],
        ['nyx', hero() ? 'You carry three Chimes. Iola passed me an hour ago. She was kind, which is rare. The Echo Chime sleeps deeper. The Lamp Sentinel stands between us.' : 'You carry three Chimes. That ash on your hands is old. I remember the day it fell. The Echo Chime sleeps deeper. The Lamp Sentinel stands between us.']]);
      obj('Pass the Lamp Sentinel and reach the lowest hall of the Archive.');
      return;
    }
    if (has('archive_truth')) { await say('nyx', 'Go down. Listen. Choose.'); return; }
    await say('nyx', 'The stairs are sealed by a very polite machine. It will not be rude to you until it has to be.');
  };

  EV.arch_sentinel = async function () {
    if (has('sentinel_done')) return;
    var f = F();
    f.lock();
    try {
      mood('sorrow'); await shake();
      await seq([['sentinel', 'AUTHORIZED RINGERS ONLY. YOU ARE NOT REGISTERED. PLEASE DEPART OR BE DEPARTED.']]);
    } catch (e) {}
    f.unlock();
    var r = await fight({ foes: [{ id: 'b_sentinel', lv: 20 }], boss: true, bg: 'archive', music: 'boss', intro: 'The Lamp Sentinel activates!' });
    if (r === null) return;
    f.lock();
    try {
      set('sentinel_done');
      await seq([['sentinel', 'REGISTERING NEW RINGER... DONE. WELCOME. THE LAST ROOM IS BELOW.'], [null, 'The sealed stairs grind open.']]);
      FP.addItem('seed', 1); FP.addItem('hiether', 2);
      await reward('The Sentinel drops a Rekindle Seed and 2 Hi-Ethers.');
      obj('Descend to the lowest hall of the Archive.');
    } finally { f.unlock(); unmood(); }
  };

  EV.arch_boss = async function () {
    if (has('arch_done')) return;
    var f = F();
    f.lock();
    try {
      mood('finale'); await shake();
      await seq([[null, 'The lowest hall. Water pools around a pedestal where a bright fragment hangs. Above it, the dark folds and unfolds like a cloud made of faces.'],
        ['undertow', 'You are carrying my name in your pockets. Three of them. Please give them back. I have been alone with it for two hundred years.']]);
      await seq(hero() ? [['me', 'What are you?'], ['undertow', 'I am what you did not want to feel. I am every funeral that was sung away.']] :
        [['me', 'What are you?'], ['undertow', 'I am what Cinderhold felt when it burned and was told to forget. I am the part of the Bell that learned your name.']]);
    } catch (e) {}
    f.unlock();
    var r = await fight({ foes: [{ id: 'b_undertow', lv: 24 }], boss: true, bg: 'archive', music: 'finale', intro: 'The Undertow rises!' });
    if (r === null) return;
    f.lock();
    try {
      set('arch_done');
      mood('sorrow');
      await seq([[null, 'The dark does not fall. It sits down. The faces fall quiet.'],
        ['undertow', 'You could have unmade me. Thank you for not. Now listen, and then decide what a Bell is for.']]);
      await chime('echochime', 'Echo Chime');
      await seq([['nyx', 'All four Chimes. They hum together. Do you hear it? That is the Bell, asking to be rung.'],
        ['nyx', 'Two hundred years ago, the Wardens and the Crown rang it to carry away the sorrow of burning a valley. Cinderhold. It worked. They forgot. But grief does not leave. It only waits.'],
        ['nyx', 'The Undertow is every sorrow the Bell took. Ring it again, and it is quiet, but you will forget it was ever a valley. Hold it, and it is loud, and it is true.']]);
      if (hero()) {
        var c = await ask('nyx', 'Lampbearer. Ring the Bell, or carry what it carried?', ['Mend the Bell', 'Carry the grief']);
        if (c === 0) { set('end_mend'); await seq([['me', 'Let it rest. Let all of us rest.'], [null, 'You ring the Bell. The Undertow smiles, and the faces sink. For a moment you will remember a valley. Then you will not.']]); }
        else { set('end_carry'); await seq([['me', 'I will carry it. All of it. No one else should have to forget so I can sleep.'], [null, 'The Undertow settles into the Echo Chime. It is heavier than a sword. It is warm, like a hand.']]); }
      } else {
        var d = await ask('nyx', 'Ash-child. Take the Bell, or break the binding?', ['Take the Bell', 'Break the binding']);
        if (d === 0) { set('end_take'); await seq([['me', 'The Bell will sing for Cinderhold now. We have carried the world\'s silence long enough.'], [null, 'The four Chimes fuse in your hands. The Undertow bows. It does not forgive you, but it obeys.']]); }
        else { set('end_break'); await seq([['me', 'No more rings. No more forgetting. Let the valley be heard.'], [null, 'The Chimes split in your hands, ringing out separately. Faces rise from the water, one by one, and say their own names.']]); }
      }
      await EV.ch1_end();
    } finally { f.unlock(); unmood(); }
  };

  EV.ch1_end = async function () {
    var g = G();
    if (hero()) {
      await seq([['corvin', 'Four Chimes. And you had to be the one to find them. Of course.'],
        ['corvin', 'Sable wants them. Cinderhold wants them. I want to know whether anyone will ever want us.']]);
      var r = await fight({ foes: [{ id: 'r_corvin2', lv: 22 }], rival: true, mercy: true, bg: 'archive', music: 'boss', intro: 'Corvin steps from the water!' });
      if (r === null) return;
      await seq([['corvin', 'Hm. Fine. Keep them. For now.'], ['corvin', 'The wall around the valley is still there, Lampbearer. When you finish what you started, come see it.']]);
    } else {
      await seq([['odalys', 'Ashen. The Choir has been trailing you for a week. Put the Chimes down, please.'],
        ['odalys', 'I am Odalys, Warden-Captain. I do not hate you. I have read what we did. But the Hush is rising, and the Bell is the only leash I know.']]);
      var r2 = await fight({ foes: [{ id: 'r_odalys2', lv: 22 }], rival: true, mercy: true, bg: 'archive', music: 'boss', intro: 'Odalys raises her lantern!' });
      if (r2 === null) return;
      await seq([['odalys', 'Enough. I yield. For now.'], ['odalys', 'Know that you have made enemies and friends today, and I am not sure which count is larger.']]);
    }
    set('ch1_done'); g.ch = 2;
    FP.menus.saveGame();
    await U.fade(true, true, 600);
    var o = U.el('', '<div class="center hi" style="margin-top:' + U.u(28) + '">CHAPTER I COMPLETE</div>'
      + '<div class="center small" style="margin-top:' + U.u(10) + ';line-height:' + U.u(10) + '">' + (hero() ? (has('end_mend') ? 'You rang the Bell.<br>The valley fades.<br>Peace comes easy.' : 'You carry the grief.<br>The world remembers.<br>It is not gentle.') : (has('end_take') ? 'You took the Bell.<br>Cinderhold sings alone.' : 'You broke the binding.<br>Every name is spoken.')) + '</div>'
      + '<div class="center small dim" style="margin-top:' + U.u(14) + ';line-height:' + U.u(9) + '">A fifth Chime hums from the north.<br>Lanternreach waits.</div>'
      + '<div class="center small dim" style="margin-top:' + U.u(16) + '">To be continued...</div>', { position: 'absolute', inset: 0, background: '#0b0816', zIndex: 40, color: '#f4eaff' });
    await U.fade(false, true, 600);
    await U.waitKey(['a', 'b', 'menu']);
    await U.fade(true, false, 400);
    U.remove(o);
    var st = FP.getMap('arch1').entry;
    F().enter('arch1', st.x, st.y - 1, 'd', { silent: true });
    g.objective = 'Chapter I is complete. Train, tether more Kin, temper your gear, and explore Myrrowen.';
    await U.fade(false, false, 400);
  };

  /* ================================================================ VILLAIN HALL */
  EV.sable = async function () {
    var g = G();
    if (hero()) {
      await seq([['sable', 'A Warden-smelling stranger in my hall. Sit if you must. Keep your lamp lowered.'], ['sable', 'No, child. I am not your enemy. I am only a woman who remembers a fire.']]);
      return;
    }
    if (has('ch1_done')) { await say('sable', 'Four Chimes! Oh, I am proud. Let me hold one. Just one. Just for a moment.'); return; }
    if (!has('v_sable_second') && has('v_matron_done')) {
      set('v_sable_second');
      await seq([['sable', 'The Dawn Chime. So it is true. Corvin boasted you were slow. I am delighted you were not.'],
        ['sable', 'The next lies in the Saltwatch Beacon beyond Brinehaven, and a Warden scholar will sit on the road. Go gently with Iola. She is only a girl who reads.']]);
      return;
    }
    await say('sable', g.objective || 'Go on. West to the Whisperwood. Do not dawdle.');
  };
  EV.corvinhall = async function () {
    if (hero()) { await say('corvin', 'I know your face from somewhere. No, I do not. Move along.'); return; }
    await say('corvin', has('v_corvin_met') ? 'I am not waiting for you. I am simply standing in this hall, deciding.' : 'Whisperwood. West. Do not let the trees recognize you.');
  };
})(window.FP);
