/* Sunderbell editor - saving: export/import game_data.js, publish to GitHub, reset. */
(function () {
  'use strict';
  var SB = window.SB, ED = window.ED, h = ED.h;
  function fileText() { return '/* Sunderbell game data. Edited with editor.html. */\nwindow.SB_DATA = ' + JSON.stringify(ED.D) + ';\n'; }
  function b64(str) { var bytes = new TextEncoder().encode(str), bin = '', CH = 0x8000; for (var i = 0; i < bytes.length; i += CH) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + CH)); return btoa(bin); }

  ED.fileMenu = function () {
    ED.saveDraft();
    var gh = {}; try { gh = JSON.parse(localStorage.getItem('sunderbell.gh') || '{}'); } catch (e) { }
    var body = h('div', null, [
      h('p.hint', null, ['Everything you change is already saved on this device, and the game on this device can play it ("Play with editor changes" on the title screen). To change the game for everyone, put the new data file on GitHub.']),
      h('div.col', { style: { display: 'flex', flexDirection: 'column', gap: '8px' } }, [
        ED.btn('⬇ Download game_data.js', download, 'hot'),
        ED.btn('☁ Publish straight to GitHub…', function () { ED.closeModal(); publish(gh); }),
        ED.btn('⬆ Import a game_data.js / .json file…', importFile),
        ED.btn('↺ Throw away my changes (back to the published game)', function () { ED.closeModal(); ED.confirm('Discard changes', 'Throw away every change saved on this device and reload the published game?', function () { SB.draft.clear(); ED.replaceData(SB.clone(window.SB_DATA)); ED.resetHistory(); ED.status('Back to the published game.'); }); }, 'danger')
      ]),
      h('h3', null, ['Updating GitHub by hand']),
      h('ol.hint', null, [h('li', null, ['Tap "Download game_data.js".']), h('li', null, ['On github.com open your repo, then the folder Sunderbell/data.']), h('li', null, ['Tap Add file → Upload files, pick the downloaded game_data.js, and commit.']), h('li', null, ['After a minute the game on GitHub Pages uses it.'])])
    ]);
    ED.modal('Save', body);
  };
  function download() {
    var blob = new Blob([fileText()], { type: 'text/javascript' }), a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = 'game_data.js'; document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1000); ED.status('Downloaded game_data.js');
  }
  function importFile() {
    var inp = h('input', { type: 'file', accept: '.js,.json,text/javascript,application/json' });
    inp.onchange = function () {
      var f = inp.files[0]; if (!f) return; var r = new FileReader();
      r.onload = function () {
        try {
          var t = String(r.result), i = t.indexOf('{'), j = t.lastIndexOf('}'); var d = JSON.parse(t.slice(i, j + 1));
          if (!d.maps || !d.scenes || !d.sprites) throw new Error('This does not look like Sunderbell game data.');
          ED.closeModal(); ED.replaceData(d); ED.commit(); ED.saveDraft(); ED.status('Imported ' + f.name);
        } catch (e) { alert('Could not import: ' + e.message); }
      };
      r.readAsText(f);
    };
    inp.click();
  }
  function publish(gh) {
    var o = { repo: gh.repo || 'Mirish117/Mobile-Games', branch: gh.branch || 'main', path: gh.path || 'Sunderbell/data/game_data.js', token: gh.token || '', remember: !!gh.token, msg: 'Update Sunderbell game data from the editor' };
    var out = h('div.hint');
    ED.modal('Publish to GitHub', h('div', null, [
      h('p.hint', null, ['This writes your game data straight into the repository using a GitHub personal access token (create one at github.com → Settings → Developer settings → Fine-grained tokens, with "Contents: Read and write" for this repository only). The token is sent only to api.github.com.']),
      ED.field(o, 'repo', { label: 'Repository (owner/name)' }), h('div.grid2', null, [ED.field(o, 'branch', { label: 'Branch' }), ED.field(o, 'path', { label: 'File path' })]),
      ED.field(o, 'token', { type: 'password', label: 'Access token' }), ED.field(o, 'remember', { type: 'check', label: 'Remember the token on this device' }), ED.field(o, 'msg', { label: 'Commit message' }), out
    ]), [['Cancel', null], ['Publish', function () {
      if (!o.token) { out.textContent = 'A token is needed.'; return false; }
      try { localStorage.setItem('sunderbell.gh', JSON.stringify({ repo: o.repo, branch: o.branch, path: o.path, token: o.remember ? o.token : '' })); } catch (e) { }
      out.textContent = 'Publishing…';
      var api = 'https://api.github.com/repos/' + o.repo + '/contents/' + o.path.split('/').map(encodeURIComponent).join('/'), hd = { Authorization: 'Bearer ' + o.token, Accept: 'application/vnd.github+json' };
      fetch(api + '?ref=' + encodeURIComponent(o.branch), { headers: hd }).then(function (r) { return r.status === 404 ? {} : r.json(); }).then(function (cur) {
        return fetch(api, { method: 'PUT', headers: hd, body: JSON.stringify({ message: o.msg, content: b64(fileText()), branch: o.branch, sha: cur.sha }) });
      }).then(function (r) { return r.json().then(function (j) { if (!r.ok) throw new Error(j.message || ('HTTP ' + r.status)); return j; }); })
        .then(function (j) { out.innerHTML = 'Published! Commit <code>' + SB.esc((j.commit && j.commit.sha || '').slice(0, 7)) + '</code>. GitHub Pages updates in a minute or two.'; ED.status('Published to GitHub'); })
        .catch(function (e) { out.textContent = 'Failed: ' + e.message; });
      return false;
    }, 'hot']]);
  }
})();
