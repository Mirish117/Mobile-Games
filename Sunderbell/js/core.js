/* Sunderbell - shared core: data loading, editor drafts, script parser, conditions, sprite renderer.
   Used by both the game (index.html) and the editor (editor.html). */
(function () {
  'use strict';
  var SB = window.SB = window.SB || {};
  SB.TILE = 16;
  SB.DRAFT_KEY = 'sunderbell.draft';

  /* ---------------- small utils ---------------- */
  SB.clamp = function (v, a, b) { return v < a ? a : v > b ? b : v; };
  SB.lerp = function (a, b, t) { return a + (b - a) * t; };
  SB.rand = function (a, b) { return a + Math.random() * (b - a); };
  SB.pick = function (arr) { return arr[Math.floor(Math.random() * arr.length)]; };
  SB.dist = function (ax, ay, bx, by) { var dx = ax - bx, dy = ay - by; return Math.sqrt(dx * dx + dy * dy); };
  SB.clone = function (o) { return JSON.parse(JSON.stringify(o)); };
  SB.esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  SB.sleep = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };
  SB.dirVec = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
  SB.dirOf = function (dx, dy) { return Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 'left' : 'right') : (dy < 0 ? 'up' : 'down'); };
  SB.query = (function () { var q = {}; location.search.replace(/^\?/, '').split('&').forEach(function (kv) { if (!kv) return; var p = kv.split('='); q[decodeURIComponent(p[0])] = decodeURIComponent(p[1] || ''); }); return q; })();

  /* ---------------- data + drafts ---------------- */
  SB.draft = {
    get: function () { try { var s = localStorage.getItem(SB.DRAFT_KEY); return s ? JSON.parse(s) : null; } catch (e) { return null; } },
    set: function (d) { try { localStorage.setItem(SB.DRAFT_KEY, JSON.stringify(d)); localStorage.setItem(SB.DRAFT_KEY + '.time', String(Date.now())); return true; } catch (e) { return false; } },
    clear: function () { try { localStorage.removeItem(SB.DRAFT_KEY); localStorage.removeItem(SB.DRAFT_KEY + '.time'); } catch (e) { } },
    time: function () { try { return +localStorage.getItem(SB.DRAFT_KEY + '.time') || 0; } catch (e) { return 0; } }
  };
  /* fills in anything newer builds expect so older drafts keep working */
  SB.normalize = function (d) {
    ['palette', 'sprites', 'tiles', 'maps', 'characters', 'enemies', 'bosses', 'items', 'scenes', 'songs', 'voices', 'sfx'].forEach(function (k) { d[k] = d[k] || {}; });
    d.heroes = d.heroes || []; d.meta = d.meta || {};
    Object.keys(d.maps).forEach(function (id) { var m = d.maps[id]; m.ents = m.ents || []; m.w = m.tiles[0].length; m.h = m.tiles.length; });
    return d;
  };
  SB.loadData = function (useDraft) {
    var d = useDraft ? SB.draft.get() : null;
    return SB.normalize(d || SB.clone(window.SB_DATA));
  };

  /* ---------------- conditions ----------------
     "a,b"  = a AND b.   "!a" = not a.   "a|b" = a OR b inside one term.
     special terms: plates:G  torches:G  clear  never  always  party:N (party size >= N) */
  SB.cond = function (expr, ctx) {
    if (expr == null || expr === '') return true;
    return String(expr).split(',').every(function (term) {
      term = term.trim(); if (!term) return true;
      return term.split('|').some(function (t) {
        t = t.trim(); var neg = false;
        while (t[0] === '!') { neg = !neg; t = t.slice(1); }
        var v;
        if (t === 'never') v = false;
        else if (t === 'always') v = true;
        else if (t === 'clear') v = ctx.clear ? ctx.clear() : false;
        else if (t.indexOf('plates:') === 0) v = ctx.plates ? ctx.plates(t.slice(7)) : false;
        else if (t.indexOf('torches:') === 0) v = ctx.torches ? ctx.torches(t.slice(8)) : false;
        else if (t.indexOf('party:') === 0) v = ctx.partySize ? ctx.partySize() >= +t.slice(6) : false;
        else v = !!ctx.flag(t);
        return neg ? !v : v;
      });
    });
  };

  /* ---------------- story script parser ---------------- */
  SB.COMMANDS = {
    set: 'set flag', unset: 'unset flag', give: 'give item [count]', take: 'take item [count]', heal: 'heal',
    music: 'music songId|none', sfx: 'sfx soundId', voice: 'voice who kind', wait: 'wait seconds',
    fade: 'fade out|in [#color]', flash: 'flash [#color]', shake: 'shake [seconds]', tint: 'tint #color amount | tint off',
    warp: 'warp mapId x y [dir]', move: 'move who x y', face: 'face who dir', emote: 'emote who symbol',
    hide: 'hide entityId', show: 'show entityId', lead: 'lead heroId', banner: 'banner Title | Subtitle',
    quest: 'quest text', journal: 'journal text', save: 'save', end: 'end', credits: 'credits',
    goto: 'goto label', 'if': 'if flag label', ifnot: 'ifnot flag label'
  };
  SB.parseScript = function (text) {
    var cmds = [], labels = {}, errors = [], lines = String(text || '').split('\n');
    lines.forEach(function (raw, i) {
      var line = raw.replace(/\s+$/, ''), t = line.trim(), m;
      if (!t || t[0] === '#') return;
      if (t[0] === ':') { labels[t.slice(1).trim()] = cmds.length; return; }
      if (t[0] === '>') { cmds.push({ c: 'say', who: null, text: t.slice(1).trim(), line: i + 1 }); return; }
      if (t[0] === '?') {
        m = /^\?\s*(.*?)\s*=>\s*:?(\S+)\s*$/.exec(t);
        if (!m) { errors.push({ line: i + 1, msg: 'Choice needs "? text => label"' }); return; }
        var last = cmds[cmds.length - 1];
        if (!last || last.c !== 'choice' || last.closed) { last = { c: 'choice', options: [], line: i + 1 }; cmds.push(last); }
        last.options.push({ text: m[1], label: m[2] });
        return;
      }
      if ((m = /^([a-z_][a-z0-9_]*)\s*:\s?(.*)$/i.exec(t)) && !SB.COMMANDS[m[1].toLowerCase()]) {
        cmds.push({ c: 'say', who: m[1].toLowerCase(), text: m[2], line: i + 1 }); return;
      }
      var parts = t.split(/\s+/), cmd = parts[0].toLowerCase(), rest = t.slice(parts[0].length).trim();
      if (!SB.COMMANDS[cmd]) { errors.push({ line: i + 1, msg: 'Unknown command "' + parts[0] + '"' }); return; }
      var o = { c: cmd, args: parts.slice(1), rest: rest, line: i + 1 };
      if (cmd === 'goto') o.label = (parts[1] || '').replace(/^:/, '');
      if (cmd === 'if' || cmd === 'ifnot') { o.flag = parts[1]; o.label = (parts[2] || '').replace(/^:/, ''); }
      cmds.push(o);
    });
    cmds.forEach(function (c) {
      var ls = c.c === 'choice' ? c.options.map(function (o) { return o.label; }) : (c.label ? [c.label] : []);
      ls.forEach(function (l) { if (!(l in labels)) errors.push({ line: c.line, msg: 'Missing label ":' + l + '"' }); });
    });
    return { cmds: cmds, labels: labels, errors: errors };
  };

  /* ---------------- sprite renderer ---------------- */
  SB.Gfx = function (data) {
    var cache = {}, self = this;
    this.data = data;
    this.invalidate = function (id) { if (id) { Object.keys(cache).forEach(function (k) { if (k.split('|')[0] === id) delete cache[k]; }); } else cache = {}; };
    function hexToRgb(h) { h = h.replace('#', ''); if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2]; return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]; }
    this.rgb = hexToRgb;
    /* variant: '' | 'grey' | 'ghost' | 'white' | 'dark' | 'shadow' */
    this.frame = function (id, f, variant) {
      var s = self.data.sprites[id]; if (!s) return null;
      var n = s.frames.length; f = ((f | 0) % n + n) % n; variant = variant || '';
      var key = id + '|' + f + '|' + variant, c = cache[key]; if (c) return c;
      c = document.createElement('canvas'); c.width = s.w; c.height = s.h;
      var x = c.getContext('2d'), img = x.createImageData(s.w, s.h), d = img.data, pal = self.data.palette, rows = s.frames[f];
      for (var yy = 0; yy < s.h; yy++) {
        var r = rows[yy] || '';
        for (var xx = 0; xx < s.w; xx++) {
          var ch = r[xx]; if (!ch || ch === '.') continue;
          var hex = pal[ch]; if (!hex) continue;
          var rgb = hexToRgb(hex), o = (yy * s.w + xx) * 4, a = 255;
          if (variant === 'grey') { var l = rgb[0] * .3 + rgb[1] * .59 + rgb[2] * .11; l = l * .8 + 40; rgb = [l, l, l * 1.04]; }
          else if (variant === 'ghost') { var g = rgb[0] * .3 + rgb[1] * .59 + rgb[2] * .11; rgb = [g * .7 + 60, g * .75 + 70, g * .8 + 100]; }
          else if (variant === 'white') rgb = [255, 255, 255];
          else if (variant === 'dark') { rgb = [rgb[0] * .25 + 20, rgb[1] * .2 + 10, rgb[2] * .35 + 40]; }
          else if (variant === 'shadow') { rgb = [0, 0, 0]; a = 90; }
          d[o] = rgb[0]; d[o + 1] = rgb[1]; d[o + 2] = rgb[2]; d[o + 3] = a;
        }
      }
      x.putImageData(img, 0, 0); cache[key] = c; return c;
    };
    this.size = function (id) { var s = self.data.sprites[id]; return s ? [s.w, s.h] : [16, 16]; };
    this.frames = function (id) { var s = self.data.sprites[id]; return s ? s.frames.length : 0; };
    this.has = function (id) { return !!self.data.sprites[id]; };
    /* draw sprite with bottom-centre anchor at (x,y) */
    this.draw = function (ctx, id, f, x, y, o) {
      o = o || {}; var c = self.frame(id, f, o.variant); if (!c) return;
      var w = c.width, h = c.height, dx = Math.round(x - w / 2), dy = Math.round(y - h);
      if (o.alpha != null) ctx.globalAlpha = o.alpha;
      if (o.flip) { ctx.save(); ctx.translate(dx + w, dy); ctx.scale(-1, 1); ctx.drawImage(c, 0, 0); ctx.restore(); }
      else ctx.drawImage(c, dx, dy);
      if (o.alpha != null) ctx.globalAlpha = 1;
    };
  };

  /* character sprite naming: base_down / base_up / base_side (3 frames: idle, stepA, stepB) and base_atk_<dir> */
  SB.charFrame = function (gfx, base, dir, anim, t) {
    var d = dir === 'left' || dir === 'right' ? 'side' : dir, flip = dir === 'left';
    if (anim === 'atk' && gfx.has(base + '_atk_' + d)) return { id: base + '_atk_' + d, f: 0, flip: flip };
    var id = base + '_' + d;
    if (!gfx.has(id)) { id = base + '_down'; flip = false; if (!gfx.has(id)) { id = base; } }
    var f = 0;
    if (anim === 'walk' && gfx.frames(id) >= 3) { var k = Math.floor(t * 8) % 4; f = [1, 0, 2, 0][k]; }
    else if (anim === 'walk' && gfx.frames(id) === 2) f = Math.floor(t * 6) % 2;
    else if (gfx.frames(id) === 2 && anim !== 'atk') f = Math.floor(t * 2.5) % 2;
    return { id: id, f: f, flip: flip };
  };
})();
