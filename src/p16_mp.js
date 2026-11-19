
/* ================= online rooms: the arcade's lobby and characters, with every machine shared =================
   What travels between players:
   - where each player is (their avatar), and chat;
   - knobs and faders as they move, and notes and drum pads as they are played, so a tweak or a riff is heard straight away;
   - the saved state of each machine a moment after anything on it changes (patterns, patches, switches), which is also
     what a late arrival is handed on the way in;
   - the transport: start, stop and tempo, pinned to the room's clock so everyone's step one lands together.
   The Tape's recorded loop is audio and stays on the machine of whoever recorded it. */
var MP = (function(){
  var Q = { on:false, ws:null, id:null, code:'', name:'', peers:{}, lobbyOpen:false, chatOpen:false, sendAt:0, retry:0, closedByUs:false, max:6,
            off:0, rtt:1e9, pings:0, pingAt:0, inputAt:0, seen:{}, applying:false, force:false, cq:{}, cqAt:0, pendT:null, tempoT:null };
  var lobby = document.getElementById('mpLobby'), hud = document.getElementById('mpHud'), chat = document.getElementById('mpChat'), log = document.getElementById('mpLog'), input = document.getElementById('mpInput');
  var nameIn = document.getElementById('mpName'), codeIn = document.getElementById('mpCode'), err = document.getElementById('mpErr'), skinBox = document.getElementById('mpSkins');
  try { nameIn.value = localStorage.getItem('jambutek-name') || ''; } catch (e) {}
  var SKINR = {"head": [[0.15708, 0.15875, 0.21708, 0.22375], [0.03208, 0.15875, 0.09208, 0.22375], [0.09458, 0.09542, 0.15458, 0.15625], [0.09458, 0.22625, 0.15458, 0.28625], [0.09458, 0.15875, 0.15458, 0.22375], [0.21958, 0.15875, 0.27958, 0.22375]], "hat": [[0.46125, 0.16625, 0.52958, 0.18208], [0.32042, 0.16625, 0.38875, 0.18208], [0.39125, 0.09542, 0.45875, 0.16375], [0.39125, 0.18458, 0.45875, 0.25208], [0.39125, 0.16625, 0.45875, 0.18208], [0.53208, 0.16625, 0.59958, 0.18208]], "torso": [[0.79792, 0.15208, 0.85375, 0.29708], [0.64042, 0.15208, 0.69625, 0.29708], [0.69875, 0.09542, 0.79542, 0.14958], [0.69875, 0.29958, 0.79542, 0.35542], [0.69875, 0.15208, 0.79542, 0.29708], [0.85625, 0.15208, 0.95208, 0.29708]], "armL": [[0.08958, 0.46875, 0.11958, 0.60292], [0.03042, 0.46875, 0.06042, 0.60292], [0.06292, 0.43708, 0.08708, 0.46625], [0.06292, 0.60542, 0.08708, 0.63542], [0.06292, 0.46875, 0.08708, 0.60292], [0.12208, 0.46875, 0.14708, 0.60292]], "armR": [[0.32375, 0.46958, 0.35292, 0.60292], [0.26542, 0.46958, 0.29458, 0.60292], [0.29708, 0.43708, 0.32125, 0.46708], [0.29708, 0.60542, 0.32125, 0.63625], [0.29708, 0.46958, 0.32125, 0.60292], [0.35542, 0.46958, 0.37958, 0.60292]], "legL": [[0.57375, 0.47792, 0.61042, 0.57625], [0.50125, 0.47792, 0.53792, 0.57625], [0.54042, 0.43792, 0.57125, 0.47542], [0.54042, 0.57875, 0.57125, 0.61542], [0.54042, 0.47792, 0.57125, 0.57625], [0.61292, 0.47792, 0.64375, 0.57625]], "legR": [[0.80792, 0.47792, 0.84458, 0.57625], [0.73542, 0.47792, 0.77208, 0.57625], [0.77458, 0.43875, 0.80542, 0.47542], [0.77458, 0.57875, 0.80542, 0.61542], [0.77458, 0.47792, 0.80542, 0.57625], [0.84708, 0.47792, 0.87875, 0.57625]], "shinL": [[0.10458, 0.75792, 0.14125, 0.85625], [0.03208, 0.75792, 0.06875, 0.85625], [0.07125, 0.71875, 0.10208, 0.75542], [0.07125, 0.85875, 0.10208, 0.89625], [0.07125, 0.75792, 0.10208, 0.85625], [0.14375, 0.75792, 0.17542, 0.85625]], "shinR": [[0.33958, 0.75792, 0.37625, 0.85625], [0.26625, 0.75792, 0.30292, 0.85625], [0.30542, 0.71792, 0.33708, 0.75542], [0.30542, 0.85875, 0.33708, 0.89792], [0.30542, 0.75792, 0.33708, 0.85625], [0.37875, 0.75792, 0.40958, 0.85625]], "shoeL": [[0.60208, 0.78125, 0.66208, 0.79625], [0.50125, 0.78125, 0.56125, 0.79625], [0.56375, 0.71542, 0.59958, 0.77875], [0.56375, 0.79875, 0.59958, 0.86125], [0.56375, 0.78125, 0.59958, 0.79625], [0.66458, 0.78125, 0.70208, 0.79625]], "shoeR": [[0.84458, 0.78125, 0.90458, 0.79625], [0.74292, 0.78125, 0.80292, 0.79625], [0.80542, 0.71875, 0.84208, 0.77875], [0.80542, 0.79875, 0.84208, 0.85875], [0.80542, 0.78125, 0.84208, 0.79625], [0.90708, 0.78125, 0.94375, 0.79625]]}, skinMats = [];
  var SKINS = [{ n:'Night Owl', a:'sk0' }, { n:'Diva', a:'sk1' }, { n:'Specs', a:'sk2' }, { n:'Clown', a:'sk3' }, { n:'Overalls', a:'sk4' }, { n:'Boss', a:'sk5' }], skinMats = {};
  Q.skin = 0; try { Q.skin = Math.min(SKINS.length - 1, Math.max(0, +localStorage.getItem('jambutek-skin') || 0)); } catch (e) {}
  var PV = null;
  function pvInit(){
    if (PV) return PV;
    var r = new THREE.WebGLRenderer({ antialias:true, alpha:true, preserveDrawingBuffer:true }); r.setPixelRatio(1); r.setSize(192, 300);
    var sc = new THREE.Scene(); sc.add(new THREE.AmbientLight(0xffffff, 0.62));
    var d = new THREE.DirectionalLight(0xffffff, 0.55); d.position.set(1.2, 2, 2.4); sc.add(d);
    var d2 = new THREE.DirectionalLight(0xbfd8ff, 0.25); d2.position.set(-2, 1, -2); sc.add(d2);
    var cam2 = new THREE.PerspectiveCamera(24, 192 / 300, 0.1, 20); cam2.position.set(0, 0.98, 4.6); cam2.lookAt(0, 0.88, 0);
    PV = { r:r, sc:sc, cam:cam2, figs:[], mats:[] }; return PV;
  }
  function pvFig(i){
    var P = pvInit(); if (P.figs[i]) return P.figs[i];
    var img = new Image(), t = new THREE.Texture(img); t.anisotropy = 4;
    var m = new THREE.MeshLambertMaterial({ map:t }), g = new THREE.Group(); g.visible = false; P.sc.add(g);
    function b(w, h, d, key, x, y, z){ var o = new THREE.Mesh(skinGeo(w, h, d, key), m); o.position.set(x, y, z); g.add(o); }
    b(0.13, 0.39, 0.15, 'legL', -0.08, 0.585, 0); b(0.13, 0.39, 0.15, 'legR', 0.08, 0.585, 0);
    b(0.13, 0.39, 0.15, 'shinL', -0.08, 0.195, 0); b(0.13, 0.39, 0.15, 'shinR', 0.08, 0.195, 0);
    b(0.15, 0.07, 0.24, 'shoeL', -0.08, 0.035, 0.03); b(0.15, 0.07, 0.24, 'shoeR', 0.08, 0.035, 0.03);
    b(0.38, 0.56, 0.22, 'torso', 0, 1.06, 0); b(0.1, 0.52, 0.12, 'armL', -0.25, 1.04, 0); b(0.1, 0.52, 0.12, 'armR', 0.25, 1.04, 0);
    b(0.24, 0.26, 0.24, 'head', 0, 1.51, 0); b(0.27, 0.07, 0.27, 'hat', 0, 1.65, 0);
    var F = P.figs[i] = { g:g, ready:false, ang:0 };
    img.onload = function(){ t.needsUpdate = true; F.ready = true; pvDraw(i); }; img.src = A[SKINS[i].a];
    return F;
  }
  function pvDraw(i){
    var P = pvInit(), F = pvFig(i), btn = skinBox.children[i]; if (!F.ready || !btn) return;
    P.figs.forEach(function(f){ if (f) f.g.visible = false; }); F.g.visible = true; F.g.rotation.y = F.ang;
    P.r.render(P.sc, P.cam); var c = btn.querySelector('canvas').getContext('2d'); c.clearRect(0, 0, 192, 300); c.drawImage(P.r.domElement, 0, 0);
  }
  var pvSpin = -1, pvLast = 0;
  function pvLoop(now){
    if (pvSpin < 0) return;
    var F = PV && PV.figs[pvSpin]; if (F){ F.ang += Math.min(0.05, (now - (pvLast || now)) / 1000) * 1.3; pvDraw(pvSpin); }
    pvLast = now; requestAnimationFrame(pvLoop);
  }
  function pvHover(i, on){
    var prev = pvSpin;
    if (on){ if (pvSpin === i) return; pvSpin = i; pvLast = 0; if (prev < 0) requestAnimationFrame(pvLoop); }
    else if (pvSpin === i) pvSpin = -1;
    if (!on || (prev >= 0 && prev !== i)){ var k = on ? prev : i, F = PV && PV.figs[k]; if (F){ F.ang = 0; pvDraw(k); } }
  }
  function drawSkinPreview(cv, i){ pvFig(i); }
  Q.taken = [];
  function freeSkin(){ for (var i = 0; i < SKINS.length; i++) if (Q.taken.indexOf(i) < 0) return i; return 0; }
  function paintSkins(){
    if (Q.taken.indexOf(Q.skin) >= 0) Q.skin = freeSkin();
    [].forEach.call(skinBox.children, function(b, i){ var tk = Q.taken.indexOf(i) >= 0; b.classList.toggle('on', i === Q.skin); b.classList.toggle('taken', tk); b.disabled = tk;
      b.setAttribute('aria-pressed', i === Q.skin ? 'true' : 'false'); b.title = tk ? 'Taken in this room' : ''; }); }
  var takenFor = '', takenT = 0;
  function checkTaken(){
    var c = (codeIn.value || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
    if (c.length < 4){ if (Q.taken.length){ Q.taken = []; paintSkins(); } takenFor = ''; return; }
    if (c === takenFor && performance.now() - takenT < 4000) return; takenFor = c; takenT = performance.now();
    fetch('/room/' + c, { cache:'no-store' }).then(function(r){ return r.ok ? r.json() : null; }).then(function(j){
      if (!j || takenFor !== c) return; Q.taken = (j.taken || []).map(Number); paintSkins();
    }).catch(function(){});
  }
  codeIn.addEventListener('input', checkTaken);
  setInterval(function(){ if (Q.lobbyOpen) { takenT = 0; checkTaken(); } }, 5000);
  setTimeout(function(){ SKINS.forEach(function(sk, i){
    var b = document.createElement('button'); b.type = 'button'; var cv = document.createElement('canvas'); cv.width = 192; cv.height = 300; b.appendChild(cv);
    ['mouseenter', 'focus'].forEach(function(ev){ b.addEventListener(ev, function(){ pvHover(i, true); }); }); ['mouseleave', 'blur'].forEach(function(ev){ b.addEventListener(ev, function(){ pvHover(i, false); }); });
    b.setAttribute('aria-label', sk.n); b.title = sk.n; skinBox.appendChild(b); drawSkinPreview(cv, i);
    b.addEventListener('click', function(){ if (Q.taken.indexOf(i) >= 0) return; Q.skin = i; try { localStorage.setItem('jambutek-skin', i); } catch (e) {} paintSkins(); });
  }); paintSkins(); checkTaken(); }, 0);
  function esc(s){ return String(s).replace(/[&<>"]/g, function(c){ return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[c]; }); }
  function newCode(){ var AB = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789', s = ''; for (var i = 0; i < 4; i++) s += AB[(Math.random() * AB.length) | 0]; return s; }
  // ---- avatars: the arcade's characters ----
  function skinM(i){ i = SKINS[i] ? i : 0; if (!skinMats[i]){ var t = tex(A[SKINS[i].a]); t.magFilter = THREE.LinearFilter; t.anisotropy = 4; skinMats[i] = new THREE.MeshLambertMaterial({ map:t }); } return skinMats[i]; }
  function skinGeo(w, h, d, key){
    var geo = new THREE.BoxGeometry(w, h, d), uv = geo.attributes.uv, rr = SKINR[key];
    for (var f = 0; f < 6; f++){ var r = rr[f]; for (var k = 0; k < 4; k++){ var i = f * 4 + k, u = uv.getX(i), v = uv.getY(i); uv.setXY(i, r[0] + u * (r[2] - r[0]), 1 - (r[1] + (1 - v) * (r[3] - r[1]))); } }
    uv.needsUpdate = true; return geo;
  }
  function avatar(color, name, skinI){
    skinI = +skinI || 0; var g = new THREE.Group();
    function sbox(w, h, d, key, x, y, z, par){ var b = new THREE.Mesh(skinGeo(w, h, d, key), skinM(skinI)); b.position.set(x, y, z); (par || g).add(b); return b; }
    function leg(x){ var sd = x < 0 ? 'L' : 'R', hip = new THREE.Group(); hip.position.set(x, 0.78, 0); g.add(hip); sbox(0.13, 0.39, 0.15, 'leg' + sd, 0, -0.195, 0, hip);
      var knee = new THREE.Group(); knee.position.y = -0.39; hip.add(knee); sbox(0.13, 0.39, 0.15, 'shin' + sd, 0, -0.195, 0, knee); sbox(0.15, 0.07, 0.24, 'shoe' + sd, 0, -0.355, 0.03, knee); hip.userData.knee = knee; return hip; }
    var legL = leg(-0.08), legR = leg(0.08), torso = new THREE.Group(); torso.position.y = 0.78; g.add(torso); sbox(0.38, 0.56, 0.22, 'torso', 0, 0.28, 0, torso);
    function arm(x){ var sh = new THREE.Group(); sh.position.set(x, 0.52, 0); torso.add(sh); sbox(0.1, 0.52, 0.12, x < 0 ? 'armL' : 'armR', 0, -0.26, 0, sh); return sh; }
    var armL = arm(-0.25), armR = arm(0.25), head = new THREE.Group(); head.position.y = 0.6; torso.add(head);
    sbox(0.24, 0.26, 0.24, 'head', 0, 0.13, 0, head); sbox(0.27, 0.07, 0.27, 'hat', 0, 0.27, 0, head);
    var tc = mk(256, 96), tg = tc.getContext('2d'), tt = canvasTex(tc); tt.minFilter = THREE.LinearFilter;
    var tag = new THREE.Sprite(new THREE.SpriteMaterial({ map:tt, transparent:true, depthTest:true, depthWrite:false })); tag.scale.set(0.62, 0.23, 1); tag.position.y = 1.95; g.add(tag);
    g.traverse(function(o){ o.userData.noShadow = true; });
    var P = { skin:skinI, g:g, torso:torso, head:head, armL:armL, armR:armR, legL:legL, legR:legR, tag:tag, tg:tg, tt:tt, name:name, color:color, say:'', sayUntil:0, s:null, x:0, z:0, yaw:0, pitch:0, c:0, j:0, lean:0, walk:0, lastX:0, lastZ:0, held:{} };
    paintTag(P); scene.add(g); return P;
  }
  function paintTag(P){
    var g2 = P.tg; g2.clearRect(0, 0, 256, 96); g2.font = '600 26px ui-monospace, Menlo, Consolas, monospace'; g2.textAlign = 'center'; g2.textBaseline = 'middle';
    var w = Math.min(240, g2.measureText(P.name).width + 26); g2.fillStyle = 'rgba(8,10,14,.78)'; g2.fillRect(128 - w / 2, 54, w, 36); g2.fillStyle = P.color; g2.fillRect(128 - w / 2, 86, w, 4); g2.fillStyle = '#fff'; g2.fillText(P.name, 128, 73);
    if (P.say){ g2.font = '20px ui-monospace, Menlo, Consolas, monospace'; var s = P.say.length > 22 ? P.say.slice(0, 21) + '…' : P.say, w2 = Math.min(250, g2.measureText(s).width + 20); g2.fillStyle = 'rgba(255,255,255,.92)'; g2.fillRect(128 - w2 / 2, 8, w2, 34); g2.fillStyle = '#0B0D12'; g2.fillText(s, 128, 26); }
    P.tt.needsUpdate = true;
  }
  function removePeer(id){ var P = Q.peers[id]; if (!P) return; Object.keys(P.held).forEach(function(k){ var a = k.split(':'); try { NOTE[a[0]][1](+a[1]); } catch (e) {} }); scene.remove(P.g); delete Q.peers[id]; paintHud(); }
  function paintHud(){
    var n = Object.keys(Q.peers).length + 1; document.getElementById('mpCodeShow').textContent = Q.code; document.getElementById('mpCount').textContent = '· ' + n + '/' + Q.max;
    var list = '<li><i style="background:' + esc(Q.color || '#fff') + '"></i>' + esc(Q.name) + ' (you)</li>';
    Object.keys(Q.peers).forEach(function(id){ var P = Q.peers[id]; list += '<li><i style="background:' + esc(P.color) + '"></i>' + esc(P.name) + '</li>'; });
    document.getElementById('mpList').innerHTML = list;
  }
  function line(html, sys){ var d = document.createElement('div'); d.innerHTML = html; if (sys) d.className = 'sys'; log.appendChild(d); while (log.children.length > 8) log.removeChild(log.firstChild); setTimeout(function(){ d.classList.add('old'); }, 9000); }
  function send(o){ if (Q.ws && Q.ws.readyState === 1){ try { Q.ws.send(JSON.stringify(o)); } catch (e) {} return true; } return false; }
  function serverNow(){ return Date.now() + Q.off; }

  // ---- machine state: sent a moment after it changes, applied when it arrives ----
  var TRK = SAVE_KEY;
  function setKey(k, v){ if (Q.seen[k] === v) return; Q.seen[k] = v; send({ t:'set', k:k, v:v }); }
  storeHook = function(k, v){
    if (!Q.ws || Q.applying || k.indexOf('jambutek-studio-') !== 0) return;
    if (!Q.force && performance.now() - Q.inputAt > 4000) return;              // only what this player's own hands changed
    if (k !== TRK){ setKey(k, v); return; }
    var s = JSON.parse(v), pats = s.PAT; delete s.PAT; setKey('tr:m', JSON.stringify(s));   // the drum machine goes pattern by pattern, it is big
    pats.forEach(function(p, i){ setKey('tr:p' + i, JSON.stringify(p)); });
  };
  function trMeta(s){
    if (!s) return; if (typeof s.bpm === 'number' && Math.abs(s.bpm - M.bpm) > 0.01) setBpm(s.bpm, true);
    var pt = clamp(s.pat | 0, 0, 15); if (pt !== M.pat){ M.pat = pt; M.nextPat = -1; M.varSel = [0]; M.varIx = 0; M.editVar = 0; }
    if (Array.isArray(s.mutes) && s.mutes.length === 11) M.mutes = s.mutes; M.fxOn = !!s.fxOn; M.fillOn = !!s.fillOn;
    Object.keys(s.kn || {}).forEach(function(id){ var c = CT[id], v = s.kn[id]; if (c && !c.dev && typeof v === 'number' && Math.abs(c.v - v) > 0.0005){ c.v = clamp(v, 0, 1); try { onCtl(c); } catch (e) {} c.show(); } });
    applyMix(); dispDirty = true;
  }
  function trPat(i, p){ if (!(i >= 0 && i < 16) || !p || !Array.isArray(p.vars) || p.vars.length !== 8 || !Array.isArray(p.tones)) return; if (!p.vars.every(function(v){ return v && v.st && v.st.length === 11 && v.sb && v.acc; })) return; PAT[i] = p; dispDirty = true; }
  function applySet(k, v, quiet){
    if (typeof k !== 'string') return;
    if (k === 'transport'){ transport(v); return; }
    if (typeof v !== 'string') return; Q.seen[k] = v; Q.applying = true;
    try {
      if (k === 'tr:m') trMeta(JSON.parse(v)); else if (k.indexOf('tr:p') === 0) trPat(+k.slice(4), JSON.parse(v));
      else if (RESTORE[k]){ REMOTE[k] = v; try { RESTORE[k](); } finally { delete REMOTE[k]; } }
    } catch (e) {}
    Q.applying = false;
  }

  // ---- the transport, pinned to the room's clock ----
  function transport(v){
    if (!v) return; Q.pendT = null; Q.anchor = v.on ? v : null;
    if (!v.on){ if (M.playing) stopSeq(true); return; }
    if (!ac || !AU.ready){ Q.pendT = v; return; }                                  // no sound yet in this browser: join in once there is
    if (typeof v.bpm === 'number' && Math.abs(v.bpm - M.bpm) > 0.01) setBpm(v.bpm, true);
    var sd = stepDur(), t0 = ac.currentTime + (v.t0 - serverNow()) / 1000, n0 = v.n0 | 0;
    if (!M.playing){ var k = Math.max(0, Math.ceil((ac.currentTime + 0.04 - t0) / sd)); startSeq(t0 + k * sd, true, n0 + k); return; }
    var want = t0 + (SEQ.n16 - n0) * sd, d = Math.round((want - SEQ.nextT) / sd);  // already running: slide onto the room's grid
    if (d){ var last = Math.max(1, playV().last); SEQ.n16 = Math.max(0, SEQ.n16 - d); SEQ.step = ((SEQ.step - d) % last + last) % last; }
    SEQ.nextT = t0 + (SEQ.n16 - n0) * sd;
  }
  MPNET.regrid = function(){ var v = Q.anchor; if (!v || !Q.ws || Math.abs(v.bpm - M.bpm) > 0.01) return false; var sd = stepDur(), t0 = ac.currentTime + (v.t0 - serverNow()) / 1000, k = Math.max(0, Math.ceil((ac.currentTime + 0.03 - t0) / sd)); SEQ.n16 = (v.n0 | 0) + k; SEQ.step = SEQ.n16 % Math.max(1, playV().last); SEQ.nextT = t0 + k * sd; return true; };
  function anchor(){ return { on:1, t0:Math.round(serverNow() + (SEQ.nextT - ac.currentTime) * 1000), n0:SEQ.n16, bpm:M.bpm }; }
  MPNET.start = function(){ var v = { on:1, t0:Math.round(serverNow() + 350), n0:0, bpm:M.bpm }; if (!send({ t:'set', k:'transport', v:v })){ startSeq(null, true); return; } transport(v); };
  MPNET.stop = function(){ send({ t:'set', k:'transport', v:{ on:0 } }); };
  MPNET.tempo = function(){ if (!M.playing || Q.applying) return; clearTimeout(Q.tempoT); Q.tempoT = setTimeout(function(){ if (M.playing && ac){ var v = anchor(); Q.anchor = v; send({ t:'set', k:'transport', v:v }); } }, 120); };

  // ---- live: knobs and faders as they move, notes and pads as they are played ----
  var NOTE = { mf:[mfKeyDown, mfKeyUp], bs:[bsKeyDown, bsKeyUp], am:[amKeyDown, amKeyUp], tp:[tpKeyDown, tpKeyUp], mb:[mbKeyDown, mbKeyUp], sh:[shKeyDown, shKeyUp], zk:[zkKeyDown, zkKeyUp] };
  function liveNote(dev, on){ return function(n, vel){ NOTE[dev][on ? 0 : 1](n, vel); if (Q.ws && !Q.applying) send({ t:'ev', e:['n', dev, n, on, vel == null ? null : +(+vel).toFixed(2)] }); }; }
  mfKeyDown = liveNote('mf', 1); mfKeyUp = liveNote('mf', 0); bsKeyDown = liveNote('bs', 1); bsKeyUp = liveNote('bs', 0); amKeyDown = liveNote('am', 1); amKeyUp = liveNote('am', 0);
  tpKeyDown = liveNote('tp', 1); tpKeyUp = liveNote('tp', 0); mbKeyDown = liveNote('mb', 1); mbKeyUp = liveNote('mb', 0); shKeyDown = liveNote('sh', 1); shKeyUp = liveNote('sh', 0); zkKeyDown = liveNote('zk', 1); zkKeyUp = liveNote('zk', 0);
  var mcChord0 = mcChord, mcHarp0 = mcHarp;                    // the chord box: its buttons and strip are heard by everyone too
  mcChord = function(c, r, on){ mcChord0(c, r, on); if (Q.ws && !Q.applying) send({ t:'ev', e:['m', 0, c, r, on ? 1 : 0] }); };
  mcHarp = function(i, on){ mcHarp0(i, on); if (on && Q.ws && !Q.applying) send({ t:'ev', e:['m', 1, i] }); };
  MPNET.scratch = function(a){ if (Q.ws) send({ t:'ev', e:['q', a] }); };       // the scratch box: the gesture travels, each browser plays it
  var hit0 = hit; hit = function(i, vel){ hit0(i, vel); if (Q.ws && !Q.applying) send({ t:'ev', e:['h', i, vel] }); };
  var setCtl0 = setCtl;
  function paged(c){ return /^(shpot|amp\d|tpe)/.test(c.id) || (c.dev && c.dev.indexOf('sn') === 0); }    // these knobs mean different things per page: their machine's state carries them instead
  setCtl = function(c, v){ var was = c.v; setCtl0(c, v); if (Q.ws && !Q.applying && !MPQUIET && c.v !== was && !paged(c)) Q.cq[c.id] = +c.v.toFixed(4); };
  function onEv(id, e){
    if (!Array.isArray(e)) return; var P = Q.peers[id]; Q.applying = true;
    try {
      if (e[0] === 'c' && Array.isArray(e[1])) e[1].forEach(function(a){ var c = CT[a[0]]; if (c && (c.kind === 'knob' || c.kind === 'fader') && !c.endless && typeof a[1] === 'number'){ setCtl0(c, a[1]); if (c.show) c.show(); } });
      else if (e[0] === 'n' && NOTE[e[1]] && typeof e[2] === 'number'){ unlock(); if (P){ if (e[3]) P.held[e[1] + ':' + e[2]] = 1; else delete P.held[e[1] + ':' + e[2]]; } NOTE[e[1]][e[3] ? 0 : 1](e[2], e[4] == null ? undefined : e[4]); }
      else if (e[0] === 'm'){ if (e[1] === 0 && e[2] >= 0 && e[2] < 7 && e[3] >= 0 && e[3] < 3) mcChord0(e[2] | 0, e[3] | 0, e[4] ? 1 : 0); else if (e[1] === 1 && e[2] >= 0 && e[2] < 12) mcHarp0(e[2] | 0, 1); }
      else if (e[0] === 'q') skRemote(e[1]);
      else if (e[0] === 'h' && e[1] >= 0 && e[1] < 11) hit0(e[1] | 0, typeof e[2] === 'number' ? e[2] : 0.8);
    } catch (err2) {}
    Q.applying = false;
  }
  ['keydown', 'pointerdown', 'wheel'].forEach(function(t){ document.addEventListener(t, function(){ Q.inputAt = performance.now(); }, true); });

  // ---- connection ----
  function connect(){
    var proto = location.protocol === 'https:' ? 'wss://' : 'ws://';
    var ws = new WebSocket(proto + location.host + '/ws/' + Q.code + '?name=' + encodeURIComponent(Q.name) + '&skin=' + (Q.skin | 0));
    Q.ws = ws; Q.closedByUs = false;
    ws.onmessage = function(ev){
      var m; try { m = JSON.parse(ev.data); } catch (e) { return; }
      if (m.t === 'welcome'){
        var first = !Q.id; Q.id = m.id; Q.color = m.color; if (typeof m.skin === 'number') Q.skin = m.skin; Q.max = m.max || 6; Q.retry = 0; Q.seen = {}; Q.pings = 0; Q.rtt = 1e9; if (typeof m.now === 'number') Q.off = m.now - Date.now();
        if (first && m.players.length){ var ci = Math.max(0, ['#FF2A6A','#30A8F0','#90F0A8','#F5D547','#B05AFF','#FF8A3A'].indexOf(m.color)); cam.x = clamp(cam.x + [0, 0.9, -0.9, 1.8, -1.8, 0][ci], ROOM.x0 + 0.5, ROOM.x1 - 0.5); cam.z += ci === 5 ? 1.1 : 0.5; }
        Object.keys(Q.peers).forEach(removePeer);
        m.players.forEach(function(p){ var P = Q.peers[p.id] = avatar(p.color, p.name, p.skin); if (p.s){ P.s = p.s; P.x = p.s[0]; P.z = p.s[1]; } });
        MPON = true; MPHOST = !m.players.length; hud.hidden = false; chat.hidden = false; paintHud();
        try { history.replaceState(null, '', '#' + Q.code); } catch (e) {}
        if (MPHOST){ if (M.playing) stopSeq(true); Q.force = true; SAVENOW.forEach(function(f){ try { f(); } catch (e) {} }); Q.force = false; }   // first in: this browser's machines become the room's
        else { var w = m.world || {}, ks = Object.keys(w).filter(function(k){ return k !== 'transport'; }).sort(); ks.forEach(function(k){ applySet(k, w[k]); }); if (M.playing && !(w.transport && w.transport.on)) stopSeq(true); if (w.transport) transport(w.transport); }
        toast(m.players.length ? 'Joined room ' + Q.code + ' · ' + (m.players.length + 1) + ' here' : 'Room ' + Q.code + ' is open. Send friends the code.');
        line('You joined room <b>' + esc(Q.code) + '</b>', true);
      } else if (m.t === 'full'){ Q.closedByUs = true; MPON = false; showLobby('Room ' + Q.code + ' is full (' + Q.max + ' players).'); }
      else if (m.t === 'join'){ if (!Q.peers[m.id]) Q.peers[m.id] = avatar(m.color, m.name, m.skin); paintHud(); line('<b style="color:' + esc(m.color) + '">' + esc(m.name) + '</b> joined', true); toast(m.name + ' joined'); }
      else if (m.t === 'leave'){ var P = Q.peers[m.id]; if (P) line('<b style="color:' + esc(P.color) + '">' + esc(P.name) + '</b> left', true); removePeer(m.id); }
      else if (m.t === 's'){ var R = Q.peers[m.id]; if (R){ if (!R.s){ R.x = m.s[0]; R.z = m.s[1]; } R.s = m.s; } }
      else if (m.t === 'chat'){ line('<b style="color:' + esc(m.color) + '">' + esc(m.name) + ':</b> ' + esc(m.text)); var S = Q.peers[m.id]; if (S){ S.say = m.text; S.sayUntil = performance.now() + 6000; paintTag(S); } }
      else if (m.t === 'set') applySet(m.k, m.v);
      else if (m.t === 'ev') onEv(m.id, m.e);
      else if (m.t === 'pong'){ var rtt = performance.now() - m.at; if (rtt <= Q.rtt){ Q.rtt = rtt; Q.off = m.now + rtt / 2 - Date.now(); } else Q.rtt *= 1.03; Q.pings++; }   // trust only the quickest round trips; let the bar drift up slowly so the clock can still be corrected
    };
    ws.onclose = function(){
      if (Q.ws !== ws) return; Q.ws = null;
      if (Q.closedByUs || !Q.on) return;
      Object.keys(Q.peers).forEach(removePeer); Q.retry = Math.min(Q.retry + 1, 6);
      line('Connection lost · reconnecting…', true); setTimeout(function(){ if (Q.on && !Q.ws) connect(); }, 800 * Q.retry);
    };
  }
  function start(code){
    var nm = nameIn.value.trim().slice(0, 16);
    if (!nm){ err.textContent = 'Type a name first.'; nameIn.focus(); return; }
    code = (code || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
    if (code.length < 4){ err.textContent = 'Room codes are 4 letters or numbers.'; codeIn.focus(); return; }
    try { localStorage.setItem('jambutek-name', nm); } catch (e) {}
    Q.name = nm; Q.code = code; Q.on = true; err.textContent = ''; unlock(); hideLobby(); connect();
  }
  function showLobby(msg){ Q.lobbyOpen = true; lobby.hidden = false; err.textContent = msg || ''; releaseLock(); refreshLockUi(); setTimeout(function(){ (nameIn.value ? codeIn : nameIn).focus(); }, 50); }
  function hideLobby(){ Q.lobbyOpen = false; lobby.hidden = true; refreshLockUi(); }
  document.getElementById('mpCreate').addEventListener('click', function(){ Q.taken = []; start(newCode()); });
  document.getElementById('mpJoin').addEventListener('click', function(){ start(codeIn.value); });
  codeIn.addEventListener('keydown', function(e){ if (e.key === 'Enter') start(codeIn.value); });
  nameIn.addEventListener('keydown', function(e){ if (e.key === 'Enter') (codeIn.value.length >= 4 ? start(codeIn.value) : start(newCode())); });
  document.getElementById('mpSolo').addEventListener('click', function(){ Q.on = false; hideLobby(); });
  document.getElementById('mpCopy').addEventListener('click', function(){
    var link = location.origin + location.pathname + '#' + Q.code;
    try { navigator.clipboard.writeText(link).then(function(){ toast('Invite link copied'); }, function(){ toast(link); }); } catch (e) { toast(link); }
  });
  // ---- chat input: typing never reaches the game's keys ----
  function openChat(){ if (!Q.ws) return; Q.chatOpen = true; chat.classList.add('open'); keys = {}; releaseLock(); setTimeout(function(){ input.focus(); }, 0); }
  function closeChat(){ Q.chatOpen = false; chat.classList.remove('open'); input.value = ''; input.blur(); }
  input.addEventListener('keydown', function(e){
    e.stopPropagation();
    if (e.key === 'Enter'){ var t2 = input.value.trim(); if (t2) send({ t:'chat', text:t2 }); closeChat(); e.preventDefault(); }
    else if (e.key === 'Escape'){ closeChat(); e.preventDefault(); }
  });
  input.addEventListener('keyup', function(e){ e.stopPropagation(); });
  [nameIn, codeIn].forEach(function(el){ el.addEventListener('keydown', function(e){ e.stopPropagation(); }); el.addEventListener('keyup', function(e){ e.stopPropagation(); }); });
  document.addEventListener('keydown', function(e){
    if (Q.lobbyOpen){ e.stopPropagation(); return; }
    if (Q.ws && !Q.chatOpen && (e.key === 't' || e.key === 'T') && mode === 'walk' && !e.repeat){ e.preventDefault(); e.stopPropagation(); openChat(); }
  }, true);
  // ---- every frame: send where we are and which knobs moved; move everyone else smoothly ----
  Q.tick = function(now, dt){
    if (Q.ws && Q.ws.readyState === 1){
      if (now - Q.sendAt > 66){
        Q.sendAt = now; var lean = mode === 'tr' && LEAN, px = lean ? LEAN.stand.x - 0.25 * Math.sin(LEAN.yaw || 0) : cam.x, pz = lean ? LEAN.stand.z - 0.25 * Math.cos(LEAN.yaw || 0) : cam.z;
        send({ t:'s', s:[+px.toFixed(3), +pz.toFixed(3), +(lean ? (LEAN.yaw || 0) : cam.yaw).toFixed(3), +(lean ? -0.45 : cam.pitch).toFixed(3), +crouch.k.toFixed(2), +JUMP.y.toFixed(3), lean ? 1 : 0] });
      }
      if (now - Q.cqAt > 50){ var ids = Object.keys(Q.cq); if (ids.length){ Q.cqAt = now; send({ t:'ev', e:['c', ids.map(function(id){ return [id, Q.cq[id]]; })] }); Q.cq = {}; } }
      if (now - Q.pingAt > (Q.pings < 6 ? 1500 : 9000)){ Q.pingAt = now; send({ t:'ping', at:performance.now() }); }
      if (Q.pendT && ac && AU.ready) transport(Q.pendT);
    }
    var k = 1 - Math.exp(-dt * 12);
    Object.keys(Q.peers).forEach(function(id){
      var P = Q.peers[id], s = P.s; if (!s){ P.g.visible = false; return; } P.g.visible = true;
      P.x = lerp(P.x, s[0], k); P.z = lerp(P.z, s[1], k); var dy = s[2] - P.yaw; dy = Math.atan2(Math.sin(dy), Math.cos(dy)); P.yaw += dy * k;
      P.pitch = lerp(P.pitch, s[3], k); P.c = lerp(P.c, s[4], k); P.j = lerp(P.j, s[5], 0.5); P.lean = lerp(P.lean, s[6] ? 1 : 0, k);
      var sp = Math.hypot(P.x - P.lastX, P.z - P.lastZ) / Math.max(dt, 0.001); P.lastX = P.x; P.lastZ = P.z;
      P.walk += dt * Math.min(sp, 4) * 5.5; var sw = Math.sin(P.walk) * Math.min(1, sp * 0.8) * 0.6;
      P.g.position.set(P.x, P.j, P.z); P.g.rotation.y = P.yaw + Math.PI;
      P.legL.rotation.x = sw; P.legR.rotation.x = -sw; P.legL.userData.knee.rotation.x = P.legR.userData.knee.rotation.x = Math.max(0, -sw) * 0.6;
      var reach = P.lean * (1.15 + Math.sin(now / 170 + P.x * 9) * 0.08);                 // hands on the gear while they play it
      P.armL.rotation.x = -sw * 0.8 * (1 - P.lean) - reach; P.armR.rotation.x = sw * 0.8 * (1 - P.lean) - reach * (1 + Math.sin(now / 130) * 0.06);
      P.torso.position.y = 0.78 - P.c * 0.45; P.torso.rotation.x = P.c * 0.25 + P.lean * 0.18; P.head.rotation.x = clamp(-P.pitch, -0.8, 0.8) - P.lean * 0.18;
      P.tag.position.y = 1.95 - P.c * 0.45; if (P.say && now > P.sayUntil){ P.say = ''; paintTag(P); }
    });
  };
  // ---- is this copy being served by the room server? only then offer online play ----
  Q.check = function(){
    if (!/^https?:$/.test(location.protocol)) return;
    fetch('/mp-ping', { cache:'no-store' }).then(function(r){ return r.ok ? r.json() : null; }).then(function(j){
      if (!j || !j.ok) return; Q.max = j.max || 6;
      var h = (location.hash || '').replace('#', '').toUpperCase(); if (h.length >= 4) codeIn.value = h;
      showLobby('');
    }).catch(function(){});
  };
  Q.serverNow = serverNow;
  return Q;
})();
