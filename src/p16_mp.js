
// the owner's own browser: open the page once with ?owner=1 and your own joins stop sending the Discord notification (?owner=0 undoes it)
var MPME = (function(){ try { var q = /[?&]owner=([01])/.exec(location.search); if (q) localStorage.setItem('jambutek-studio-owner', q[1]); return localStorage.getItem('jambutek-studio-owner') === '1'; } catch (e) { return false; } })();

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
  var SKINS = [{ n:'Night Owl', a:'sk0' }, { n:'Diva', a:'sk1' }, { n:'Specs', a:'sk2' }, { n:'Clown', a:'sk3' }, { n:'Aloha', a:'sk4' }, { n:'Checker', a:'sk5' }, { n:'Polka', a:'sk6' }, { n:'Wave', a:'sk7' }, { n:'Track', a:'sk8' }, { n:'Stripes', a:'sk9' }, { n:'Stardust', a:'sk10' }, { n:'Robot', a:'sk11' }]
    /* custom looks: not in the grid, reached by typing their code on the "pick your look" screen. They live in vendor/looks.json (name, sheet key in assets.json, code in capitals, optional hat key from hats.json),
       kept in step with the "Playroom Skins" sheet. Add new ones at the end only: a look is known to the room by its place in this list. */
    .concat(window.JB_LOOKS || []), skinMats = {}, LOOKS = 12;
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
    b(0.27, 0.27, 0.27, 'head', 0, 1.515, 0);
    var hat = hatFor(i, true); if (hat){ hat.position.y = 1.38; g.add(hat); }
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
  /* the big figure on the "pick your look" screen: the chosen look (or the one under the pointer), turning slowly, drawn in chunky pixels */
  var bigHover = -1, bigOn = false, bigLast = 0, bigAng = 0, bigCv = document.getElementById('mpBig');
  function bigLoop(now){
    var s2 = document.getElementById('mpS2'); if (!Q.lobbyOpen || !s2 || s2.hidden){ bigOn = false; return; }
    var i = bigHover >= 0 ? bigHover : Q.skin, P = pvInit(), F = pvFig(i); bigAng += Math.min(0.05, (now - (bigLast || now)) / 1000) * 0.9; bigLast = now;
    if (F.ready && bigCv){ P.figs.forEach(function(f){ if (f) f.g.visible = false; }); F.g.visible = true; F.g.rotation.y = bigAng; P.r.render(P.sc, P.cam); F.g.rotation.y = F.ang;
      var c = bigCv.getContext('2d'); c.imageSmoothingEnabled = false; c.clearRect(0, 0, 245, 426); c.drawImage(P.r.domElement, 2, 24, 241, 377); }
    requestAnimationFrame(bigLoop);
  }
  function bigStart(){ if (!bigOn){ bigOn = true; bigLast = 0; requestAnimationFrame(bigLoop); } }
  Q.taken = [];
  function freeSkin(){ for (var i = 0; i < LOOKS; i++) if (Q.taken.indexOf(i) < 0) return i; return 0; }
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
  setTimeout(function(){ SKINS.forEach(function(sk, i){ if (sk.code) return;
    var b = document.createElement('button'); b.type = 'button'; var cv = document.createElement('canvas'); cv.width = 192; cv.height = 300; b.appendChild(cv);
    ['mouseenter', 'focus'].forEach(function(ev){ b.addEventListener(ev, function(){ if (Q.taken.indexOf(i) < 0) bigHover = i; }); }); ['mouseleave', 'blur'].forEach(function(ev){ b.addEventListener(ev, function(){ if (bigHover === i) bigHover = -1; }); });
    b.setAttribute('aria-label', sk.n); b.title = sk.n; skinBox.appendChild(b); drawSkinPreview(cv, i);
    b.addEventListener('click', function(){ if (Q.taken.indexOf(i) >= 0) return; Q.skin = i; try { localStorage.setItem('jambutek-skin', i); } catch (e) {} paintSkins(); var e2 = document.getElementById('mpErr2'); if (e2){ e2.textContent = ''; e2.classList.remove('ok'); } });
  }); paintSkins(); checkTaken(); }, 0);
  function esc(s){ return String(s).replace(/[&<>"]/g, function(c){ return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[c]; }); }
  function newCode(){ var AB = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789', s = ''; for (var i = 0; i < 4; i++) s += AB[(Math.random() * AB.length) | 0]; return s; }
  // ---- avatars: the arcade's characters ----
  function skinM(i){ i = SKINS[i] ? i : 0; if (!skinMats[i]){ var t = tex(A[SKINS[i].a]); t.magFilter = THREE.LinearFilter; t.anisotropy = 4; skinMats[i] = new THREE.MeshLambertMaterial({ map:t }); } return skinMats[i]; }
  /* a look can wear a modelled hat (vendor/hats.json, baked by tools/add_hat.py): it sits in the head's own space, so it turns and nods with the head */
  var hatGeos = {}, hatMats = {};
  function hatFor(skinI, own){
    var S = SKINS[skinI], F = S && S.hat && window.JB_HATS && window.JB_HATS[S.hat]; if (!F) return null;
    function mat(){ var t = new THREE.TextureLoader().load(F.map); t.flipY = false; return new THREE.MeshLambertMaterial({ map:t, side:THREE.DoubleSide }); }
    var o = new THREE.Mesh(hatGeos[S.hat] || (hatGeos[S.hat] = bakedGeo(F.geo)), own ? mat() : (hatMats[S.hat] || (hatMats[S.hat] = mat()))); o.userData.noShadow = true; return o;
  }
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
    sbox(0.27, 0.27, 0.27, 'head', 0, 0.135, 0, head);              // the head is one solid cube: hair and headgear are drawn on it (the old separate hat box is gone; its patch of the sheet is unused)
    var hat = hatFor(skinI); if (hat) head.add(hat);
    var tc = mk(256, 96), tg = tc.getContext('2d'), tt = canvasTex(tc); tt.minFilter = THREE.LinearFilter;
    var tag = new THREE.Sprite(new THREE.SpriteMaterial({ map:tt, transparent:true, depthTest:true, depthWrite:false })); tag.scale.set(0.62, 0.23, 1); tag.position.y = 1.95; g.add(tag);
    g.traverse(function(o){ o.userData.noShadow = true; });
    var P = { skin:skinI, g:g, torso:torso, head:head, armL:armL, armR:armR, legL:legL, legR:legR, tag:tag, tg:tg, tt:tt, name:name, color:color, say:'', sayUntil:0, s:null, x:0, z:0, yaw:0, pitch:0, c:0, j:0, lean:0, walk:0, lastX:0, lastZ:0, held:{} };
    paintTag(P); scene.add(g); return P;
  }
  var JAMBUIMG = new Image(); JAMBUIMG.onload = function(){ JAMBUIMG.ok = true; Object.keys(Q.peers).forEach(function(id){ if (Q.peers[id].say === ':jambu:') paintTag(Q.peers[id]); }); }; JAMBUIMG.src = 'jambu.png';
  function paintTag(P){
    var g2 = P.tg; g2.clearRect(0, 0, 256, 96); g2.font = '600 26px ui-monospace, Menlo, Consolas, monospace'; g2.textAlign = 'center'; g2.textBaseline = 'middle';
    var w = Math.min(240, g2.measureText(P.name).width + 26); g2.fillStyle = 'rgba(8,10,14,.78)'; g2.fillRect(128 - w / 2, 54, w, 36); g2.fillStyle = P.color; g2.fillRect(128 - w / 2, 86, w, 4); g2.fillStyle = '#fff'; g2.fillText(P.name, 128, 73);
    if (P.say){                                                    /* a speech bubble with a tail; a lone emoji (the chat bar's quick ones) is drawn large */
      var jb = P.say === ':jambu:', emo = jb || (!/[A-Za-z0-9]/.test(P.say) && Array.from(P.say).length <= 3), s = jb ? '' : emo ? P.say : (P.say.length > 22 ? P.say.slice(0, 21) + '…' : P.say);      /* :jambu: is the Jambutek jambu, drawn as a picture */
      g2.font = emo ? '30px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif' : '20px ui-monospace, Menlo, Consolas, monospace';
      var w2 = jb ? 62 : Math.min(250, g2.measureText(s).width + (emo ? 26 : 20)), x0 = 128 - w2 / 2, y0 = 4, hb = 40, rr2 = 10;
      g2.fillStyle = 'rgba(255,255,255,.95)'; g2.beginPath(); g2.moveTo(x0 + rr2, y0); g2.lineTo(x0 + w2 - rr2, y0); g2.quadraticCurveTo(x0 + w2, y0, x0 + w2, y0 + rr2); g2.lineTo(x0 + w2, y0 + hb - rr2); g2.quadraticCurveTo(x0 + w2, y0 + hb, x0 + w2 - rr2, y0 + hb);
      g2.lineTo(136, y0 + hb); g2.lineTo(128, y0 + hb + 8); g2.lineTo(120, y0 + hb); g2.lineTo(x0 + rr2, y0 + hb); g2.quadraticCurveTo(x0, y0 + hb, x0, y0 + hb - rr2); g2.lineTo(x0, y0 + rr2); g2.quadraticCurveTo(x0, y0, x0 + rr2, y0); g2.closePath(); g2.fill();
      g2.fillStyle = '#0B0D12'; if (jb){ if (JAMBUIMG.ok) g2.drawImage(JAMBUIMG, 111, y0 + 3, 34, 34); } else g2.fillText(s, 128, y0 + hb / 2 + (emo ? 2 : 0));
    }
    P.tt.needsUpdate = true;
  }
  function removePeer(id){ var P = Q.peers[id]; if (!P) return; Object.keys(P.held).forEach(function(k){ var a = k.split(':'); try { NOTE[a[0]][1](+a[1]); } catch (e) {} }); scene.remove(P.g); delete Q.peers[id]; paintHud(); }
  function paintHud(){
    var real = Object.keys(Q.peers).filter(function(id){ return id.indexOf('dbg') !== 0 && id.indexOf('sit') !== 0 && id.indexOf('shr') !== 0; }), g = real.filter(function(id){ return Q.peers[id].guest; }).length + (Q.guest ? 1 : 0), n = real.length + (Q.spec ? 0 : 1) - g, w = Q.watch | 0;      /* test players are not counted */
    document.getElementById('mpCodeShow').textContent = Q.code; document.getElementById('mpCount').textContent = '· ' + n + '/' + Q.max + (g ? ' · ' + g + (g === 1 ? ' guest' : ' guests') : '') + (w ? ' · ' + w + ' watching' : '');
    var list = Q.spec ? '<li><i style="background:#888"></i>you are watching</li>' : '<li><i style="background:' + esc(Q.color || '#fff') + '"></i>' + esc(Q.name) + (Q.guest ? ' (you · guest)' : ' (you)') + '</li>';
    Object.keys(Q.peers).forEach(function(id){ var P = Q.peers[id]; list += '<li><i style="background:' + esc(P.color) + '"></i>' + esc(P.name) + (P.guest ? ' · guest' : '') + '</li>'; });
    document.getElementById('mpList').innerHTML = list;
  }
  function line(html, sys){ var d = document.createElement('div'); d.innerHTML = html; if (sys) d.className = 'sys'; log.appendChild(d); while (log.children.length > 8) log.removeChild(log.firstChild); setTimeout(function(){ d.classList.add('old'); }, 9000); }
  var GUESTMSG = 'Guests can walk, sit, chat, emote and place stickers';
  function send(o){ if (Q.spec && o.t !== 'ping') return false;
    if (Q.guest && ((o.t === 'ev' && !(o.e && o.e[0] === 'p')) || (o.t === 'set' && o.k !== STKKEY))) return false;      /* a guest changes nothing in the room but the stickers */      /* a spectator never changes the room */
    if (Q.ws && Q.ws.readyState === 1){ try { Q.ws.send(JSON.stringify(o)); } catch (e) {} return true; } return false; }
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
    var pt = clamp(s.pat | 0, 0, 15); if (pt !== M.pat){ M.pat = pt; M.nextPat = -1; M.varSel = [0]; M.varIx = 0; M.editVar = 0; } var ev = M.editVar; if (trVars(s)) M.editVar = ev;      /* the chain is shared; which variation each player is editing is their own */
    if (Array.isArray(s.mutes) && s.mutes.length === 11) M.mutes = s.mutes; M.fxOn = !!s.fxOn; M.fillOn = !!s.fillOn;
    Object.keys(s.kn || {}).forEach(function(id){ var c = CT[id], v = s.kn[id]; if (c && !c.dev && typeof v === 'number' && Math.abs(c.v - v) > 0.0005){ c.v = clamp(v, 0, 1); try { onCtl(c); } catch (e) {} c.show(); } });
    applyMix(); dispDirty = true;
  }
  function trPat(i, p){ if (!(i >= 0 && i < 16) || !p || !Array.isArray(p.vars) || p.vars.length !== 8 || !Array.isArray(p.tones)) return; if (!p.vars.every(function(v){ return v && v.st && v.st.length === 11 && v.sb && v.acc; })) return; PAT[i] = p; dispDirty = true; }
  function applySet(k, v, quiet){
    if (typeof k !== 'string') return;
    if (k === 'transport'){ transport(v); return; }
    if (k === 'dbg'){ dbgPlayers(v === '1', true); dbgPaint(); return; }       // the F2 test players, switched on by someone in the room
    if (typeof v !== 'string') return; Q.seen[k] = v; if (Q.scSkip[k] === v){ delete Q.scSkip[k]; return; }      /* a scene switch this browser has already made for itself */ Q.applying = true;
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
  MPNET.ifx = function(k, on){ send({ t:'ev', e:['fx', k, on ? 1 : 0] }); };      // BEAT REPEAT and ROLL, held by this player
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
  Q.guest = false; Q.guestSay = function(){ toast(GUESTMSG, 2600); };
  Q.scSkip = {}; Q.scene = function(j, at){ if (Q.ws) send({ t:'ev', e:['x', j, at] }); };      // a scene switch: every browser makes it for itself, on the same bar
  MPNET.scratch = function(a){ if (Q.ws) send({ t:'ev', e:['q', a] }); };       // the scratch box: the gesture travels, each browser plays it
  var hit0 = hit; hit = function(i, vel){ hit0(i, vel); if (Q.ws && !Q.applying) send({ t:'ev', e:['h', i, vel] }); };
  var setCtl0 = setCtl;
  function paged(c){ return /^(shpot|amp\d|tpe)/.test(c.id) || (c.dev && c.dev.indexOf('sn') === 0); }    // these knobs mean different things per page: their machine's state carries them instead
  setCtl = function(c, v){ var was = c.v; setCtl0(c, v); if (Q.ws && !Q.applying && !MPQUIET && c.v !== was && !paged(c)) Q.cq[c.id] = +c.v.toFixed(4); };
  var press0 = press; press = function(c){ press0(c); if (Q.ws && !Q.applying && c && c.id) send({ t:'ev', e:['b', c.id] }); };     // a pressed button or pad: others only see it light up, its effect travels with the machine's state

  /* ---- who is doing what: a control another player touches glows in their colour for a moment ---- */
  var GLOW = [], RINGT = null, V3 = new THREE.Vector3();
  function ringTex(){ if (RINGT) return RINGT; var c = mk(64, 64), g2 = c.getContext('2d'), gr = g2.createRadialGradient(32, 32, 8, 32, 32, 32);
    gr.addColorStop(0, 'rgba(255,255,255,0.22)'); gr.addColorStop(0.45, 'rgba(255,255,255,0.4)'); gr.addColorStop(0.62, 'rgba(255,255,255,1)'); gr.addColorStop(0.78, 'rgba(255,255,255,1)'); gr.addColorStop(0.9, 'rgba(255,255,255,0.4)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
    g2.fillStyle = gr; g2.fillRect(0, 0, 64, 64); RINGT = canvasTex(c); RINGT.minFilter = RINGT.magFilter = THREE.LinearFilter; return RINGT; }
  function ringSprite(){ var sp = new THREE.Sprite(new THREE.SpriteMaterial({ map:ringTex(), transparent:true, depthTest:false, depthWrite:false, blending:THREE.AdditiveBlending })); sp.renderOrder = 50; sp.visible = false; sp.userData.noShadow = true; scene.add(sp); return sp; }
  function ctlMesh(c){ if (c._hm === undefined){ c._hm = null; for (var i = 0; i < solids.length; i++) if (solids[i].userData.ctl === c){ c._hm = solids[i]; break; } } return c._hm; }
  function glow(c, color){
    var m = ctlMesh(c); if (!m || !color) return; var now = performance.now(), G = null, i;
    for (i = 0; i < GLOW.length; i++) if (GLOW[i].c === c){ G = GLOW[i]; break; }
    if (!G) for (i = 0; i < GLOW.length; i++) if (now > GLOW[i].until){ G = GLOW[i]; break; }
    if (!G){ if (GLOW.length >= 40) return; G = { sp:ringSprite(), c:null, until:0 }; GLOW.push(G); }
    if (G.c !== c){ G.c = c; m.updateWorldMatrix(true, false); m.getWorldPosition(V3); if (!m.geometry.boundingSphere) m.geometry.computeBoundingSphere();
      var r = clamp(m.geometry.boundingSphere.radius * 3.4, 0.045, 0.18); G.sp.position.copy(V3); G.sp.scale.set(r, r, 1); }
    G.sp.material.color.set(color); G.until = now + 900; G.sp.visible = true;
  }
  function glowTick(now){ for (var i = 0; i < GLOW.length; i++){ var G = GLOW[i]; if (!G.sp.visible) continue; var left = G.until - now; if (left <= 0){ G.sp.visible = false; G.c = null; continue; } G.sp.material.opacity = Math.min(1, left / 400) * (0.8 + 0.2 * Math.sin(now / 60)); } }

  /* ---- emotes: hold 1 to 6 while walking. Everyone sees the move; your own view steps back to third person while it plays ---- */
  var EMN = ['', 'Wave', 'Point', 'Hands in the air', 'Split', 'Headbang', 'Dance'], EM = { id:0, face:0, pitch:0, k:0, me:null, et:0, show:1, was:0 };
  function emote(P, id, t, k, now){
    var bt = now / 1000 * (M.bpm / 60) * Math.PI * 2, o = { tx:0, ty:0, tz:0, hx:0, hz:0, aLx:0, aLz:0, aRx:0, aRz:0, lLx:0, lLz:0, lRx:0, lRz:0, kL:0, kR:0, y:0, gy:0 }, s1, hb, d;
    if (id === 1){ o.aRz = 2.55 + Math.sin(t * 10) * 0.38; o.aRx = -0.12; o.tz = Math.sin(t * 5) * 0.04; o.hz = 0.1; }
    else if (id === 2){ o.aRx = -Math.PI / 2 - (P.pitch || 0) + Math.sin(t * 3) * 0.03; o.ty = 0.22; o.aLz = -0.3; o.aLx = 0.15; }
    else if (id === 3){ s1 = Math.sin(bt / 2) * 0.3; o.aLz = -2.75 + s1; o.aRz = 2.75 + s1; o.tz = s1 * 0.18; o.y = -0.05 * (0.5 - 0.5 * Math.cos(bt)); o.kL = o.kR = 0.25 * (0.5 - 0.5 * Math.cos(bt)); o.lLx = o.lRx = -0.12 * (0.5 - 0.5 * Math.cos(bt)); }
    else if (id === 4){ d = smooth(Math.min(1, t / 0.7)); o.lLz = -1.5 * d; o.lRz = 1.5 * d; o.y = -0.78 * (1 - Math.cos(1.5 * d)) + 0.03 * d + Math.sin(t * 6) * 0.008 * d; o.aLz = -2.35 * d; o.aRz = 2.35 * d; o.hx = -0.15 * d; }
    else if (id === 5){ hb = Math.pow(0.5 - 0.5 * Math.cos(bt), 2); o.hx = 0.1 + hb * 0.8; o.tx = 0.1 + hb * 0.32; o.aLx = -0.95; o.aLz = -0.3; o.aRx = -0.4 + Math.sin(bt * 2) * 0.28; o.aRz = 0.12; o.kL = o.kR = hb * 0.4; o.lLx = o.lRx = -hb * 0.2; o.y = -hb * 0.05; }
    else if (id === 6){ s1 = Math.sin(bt / 2); o.tz = s1 * 0.14; o.ty = s1 * 0.3; o.y = -0.05 * (0.5 - 0.5 * Math.cos(bt)); o.aLx = -1.1 + s1 * 0.7; o.aRx = -1.1 - s1 * 0.7; o.aLz = -0.35; o.aRz = 0.35;
      o.lLx = -Math.max(0, s1) * 0.5; o.kL = Math.max(0, s1) * 0.8; o.lRx = -Math.max(0, -s1) * 0.5; o.kR = Math.max(0, -s1) * 0.8; o.hz = -s1 * 0.1; o.gy = Math.sin(bt / 4) * 0.5; }
    P.torso.rotation.x += o.tx * k; P.torso.rotation.y = o.ty * k; P.torso.rotation.z = o.tz * k; P.head.rotation.x += o.hx * k; P.head.rotation.z = o.hz * k;
    P.armL.rotation.x += o.aLx * k; P.armL.rotation.z = o.aLz * k; P.armR.rotation.x += o.aRx * k; P.armR.rotation.z = o.aRz * k;
    P.legL.rotation.x += o.lLx * k; P.legL.rotation.z = o.lLz * k; P.legR.rotation.x += o.lRx * k; P.legR.rotation.z = o.lRz * k;
    P.legL.userData.knee.rotation.x += o.kL * k; P.legR.userData.knee.rotation.x += o.kR * k; P.g.position.y += o.y * k; P.g.rotation.y += o.gy * k;
  }
  function emoteSet(id){
    if (id && (mode !== 'walk' || Q.chatOpen || Q.lobbyOpen)) return; if (id === EM.id) return;
    if (id){ if (!EM.id){ EM.face = SIT.on ? SEATS[SIT.seat].yaw : cam.yaw; EM.pitch = cam.pitch; } EM.show = id; EM.et = 0; cam.walkTo = null; cam.homing = false; }
    EM.id = id;
  }
  document.addEventListener('keydown', function(e){
    if (e.repeat || e.ctrlKey || e.metaKey || e.altKey || mode !== 'walk' || Q.chatOpen || Q.lobbyOpen) return; var tg = (e.target && e.target.tagName) || ''; if (tg === 'INPUT' || tg === 'TEXTAREA') return;
    var i = '123456'.indexOf(e.key); if (i >= 0 && !SPEC.on) emoteSet(i + 1);
  }, true);
  document.addEventListener('keyup', function(e){ var i = '123456'.indexOf(e.key); if (i >= 0 && EM.id === i + 1) emoteSet(0); }, true);
  window.addEventListener('blur', function(){ emoteSet(0); });
  Q.emoting = function(){ return EM.id > 0; };
  Q.view3 = function(dt){                                    // how far the view has stepped back, 0 to 1; also poses your own figure
    if (EM.id && mode !== 'walk') EM.id = 0;
    EM.k = lerp(EM.k, EM.id ? 1 : 0, 1 - Math.exp(-dt * 7)); if (EM.k < 0.004 && !EM.id){ EM.k = 0; if (EM.me) EM.me.g.visible = false; return 0; }
    var skin = Q.skin | 0; if (EM.me && EM.me.skin !== skin){ scene.remove(EM.me.g); EM.me = null; }
    if (!EM.me){ EM.me = avatar(Q.color || '#ffffff', Q.name || '', skin); EM.me.tag.visible = false; }
    var P = EM.me, now = performance.now(); EM.et += dt; P.pitch = EM.pitch; P.g.visible = EM.k > 0.12;
    P.g.position.set(cam.x, JUMP.y, cam.z); P.g.rotation.set(0, EM.face + Math.PI, 0); P.torso.position.y = 0.78 - crouch.k * 0.45; P.torso.rotation.set(crouch.k * 0.25, 0, 0); P.head.rotation.set(clamp(-EM.pitch, -0.8, 0.8), 0, 0);
    [P.armL, P.armR, P.legL, P.legR, P.legL.userData.knee, P.legR.userData.knee].forEach(function(j){ j.rotation.set(0, 0, 0); });
    emote(P, EM.show, EM.et, Math.min(1, EM.k * 1.15), now);
    if (SIT.on){ var SS = SEATS[SIT.seat]; P.g.position.set(SS.x, 0, SS.z); sitPose(P, SIT.pose, 0, 1, Math.min(1, EM.k * 1.15)); }      // emoting from the couch: seated, legs still
    return EM.k;
  };
  Q.face = function(){ return EM.face; };

  /* ---- ping: middle mouse on something says what you mean, to everyone, and marks the spot ---- */
  var PINGS = [], pingAt = 0;
  function pingWords(kind, key, who){
    if (kind === 'p') return null;
    var D = kind === 'd' ? DEVS[key] : null; if (!D) return 'Over here';
    if (String(key).indexOf('sn') === 0) return "Let's add a sequence"; if (/^Video synth/.test(D.name)) return "Let's add some visuals";
    return "Let's use the " + D.name;
  }
  function pingMark(x, y, z, color){
    var now = performance.now(), G = null; for (var i = 0; i < PINGS.length; i++) if (now > PINGS[i].until){ G = PINGS[i]; break; }
    if (!G){ if (PINGS.length >= 12) G = PINGS[0]; else { G = { sp:ringSprite(), t0:0, until:0 }; PINGS.push(G); } }
    G.sp.position.set(x, y, z); G.sp.material.color.set(color || '#ffffff'); G.t0 = now; G.until = now + 4200; G.sp.visible = true;
    if (ac && AU.ready && !muted){ try { var o = ac.createOscillator(), g2 = ac.createGain(), t = ac.currentTime; o.type = 'sine'; o.frequency.setValueAtTime(1320, t); o.frequency.exponentialRampToValueAtTime(880, t + 0.12); g2.gain.setValueAtTime(0.0001, t); g2.gain.exponentialRampToValueAtTime(0.07, t + 0.01); g2.gain.exponentialRampToValueAtTime(0.0001, t + 0.3); o.connect(g2); g2.connect(ac.destination); o.start(t); o.stop(t + 0.32); } catch (e) {} }
  }
  function pingTick(now){ for (var i = 0; i < PINGS.length; i++){ var G = PINGS[i]; if (!G.sp.visible) continue; if (now > G.until){ G.sp.visible = false; continue; } var a = (now - G.t0) / 1000, ph = (a * 1.3) % 1, r = 0.14 + ph * 0.5; G.sp.scale.set(r, r, 1); G.sp.material.opacity = (1 - ph) * Math.min(1, (G.until - now) / 500); } }
  function pingShow(id, kind, key, x, y, z){                 // id: who pinged (null = this player)
    var me = id == null, P = me ? null : Q.peers[id]; if (!me && !P) return; var who = me ? (Q.name || 'You') : P.name, col = me ? (Q.color || '#ffffff') : P.color, txt;
    if (kind === 'p'){ var T = key === Q.id ? null : Q.peers[key], tn = key === Q.id ? (Q.name || 'you') : T ? T.name : null; if (!tn) return;
      txt = who + ' pinged ' + tn; if (Q.ws) line('<b style="color:' + esc(col) + '">' + esc(who) + '</b> pinged <b style="color:' + esc(key === Q.id ? (Q.color || '#fff') : T.color) + '">' + esc(tn) + '</b>'); if (key === Q.id) toast(who + ' pinged you'); else if (me && !Q.ws) toast(txt); }
    else { txt = pingWords(kind, key); if (Q.ws) line('<b style="color:' + esc(col) + '">' + esc(who) + ':</b> ' + esc(txt)); else toast(txt); if (P){ P.say = txt; P.sayUntil = performance.now() + 5000; paintTag(P); } }
    if (typeof x === 'number' && typeof y === 'number' && typeof z === 'number' && isFinite(x + y + z)) pingMark(clamp(x, ROOM.x0, ROOM.x1), clamp(y, 0, ROOM.h), clamp(z, ROOM.z0, ROOM.z1), col);
  }
  Q.ping = function(){
    var now = performance.now(); if (now - pingAt < 450 || Q.chatOpen || Q.lobbyOpen) return; pingAt = now;
    var h = curAim(), best = h ? h.distance : 1e9, who = null, pt = h ? h.point : null;      // curAim leaves the ray pointing where the player is looking
    Object.keys(Q.peers).forEach(function(id){ var P = Q.peers[id]; if (!P.g.visible) return; var hs = ray.intersectObject(P.g, true); if (hs.length && hs[0].distance < best){ best = hs[0].distance; who = id; pt = hs[0].point; } });
    if (!pt) return; var kind = 'w', key = 0, x = pt.x, y = pt.y, z = pt.z;
    if (who){ kind = 'p'; key = who; var T = Q.peers[who]; x = T.x; y = 2.1 - T.c * 0.45; z = T.z; }
    else { var ia = iaOf(h); if (ia === 'ctl' || ia === 'trbody'){ var D = devOf(h); if (D && D.key && DEVS[D.key] === D){ kind = 'd'; key = D.key; } } }
    x = +x.toFixed(2); y = +y.toFixed(2); z = +z.toFixed(2); pingShow(null, kind, key, x, y, z); if (Q.ws) send({ t:'ev', e:['p', kind, key, x, y, z] });
  };

  /* ---- other players' hand-played notes land on the grid. A note from the network arrives a little late and never on the beat; while
     the sequence runs it waits for the next sixteenth instead (or plays at once if a sixteenth has only just passed). The note's end
     waits the same way so its length is kept. Your own playing is never touched. Settings can switch this off. ---- */
  var SNAPON = {};
  function snapWait(){
    if (!OPT.snap || !M.playing || !ac || !AU.ready) return 0; var sd = stepDur(), d = (((SEQ.nextT - ac.currentTime) % sd) + sd) % sd;
    return sd - d < 0.028 ? 0 : d * 1000;
  }
  function snapRun(key, on, fn){
    var now = performance.now(), w = snapWait();
    if (on){ if (key) SNAPON[key] = now + w; if (w < 3) fn(); else setTimeout(function(){ Q.applying = true; try { fn(); } catch (e) {} Q.applying = false; }, w); return; }
    var at = key && SNAPON[key] ? SNAPON[key] + 70 : 0, w2 = Math.max(w, at - now); if (key) delete SNAPON[key];
    if (w2 < 3) fn(); else setTimeout(function(){ Q.applying = true; try { fn(); } catch (e) {} Q.applying = false; }, w2);
  }
  function onEv(id, e){
    if (!Array.isArray(e)) return; var P = Q.peers[id]; Q.applying = true;
    try {
      if (e[0] === 'c' && Array.isArray(e[1])) e[1].forEach(function(a){ var c = CT[a[0]]; if (c && (c.kind === 'knob' || c.kind === 'fader') && !c.endless && typeof a[1] === 'number'){ setCtl0(c, a[1]); if (c.show) c.show(); if (P) glow(c, P.color); } });
      else if (e[0] === 'b'){ if (P && typeof e[1] === 'string' && CT[e[1]]) glow(CT[e[1]], P.color); }
      else if (e[0] === 'fx'){ if (P && (e[1] === 'r' || e[1] === 'w')) ifxSet(e[1], !!e[2], true); }
      else if (e[0] === 'p'){ if (e[1] === 'p' || e[1] === 'd' || e[1] === 'w') pingShow(id, e[1], e[2], e[3], e[4], e[5]); }
      else if (e[0] === 'n' && NOTE[e[1]] && typeof e[2] === 'number'){ unlock(); if (P){ if (e[3]) P.held[e[1] + ':' + e[2]] = 1; else delete P.held[e[1] + ':' + e[2]]; } (function(dev, nn, on, vel){ snapRun(id + dev + ':' + nn, on, function(){ NOTE[dev][on ? 0 : 1](nn, vel == null ? undefined : vel); }); })(e[1], e[2], e[3], e[4]); }
      else if (e[0] === 'm'){ if (e[1] === 0 && e[2] >= 0 && e[2] <= 12 && e[3] >= 0 && e[3] < 64) (function(a, b, on){ snapRun(id + 'mc' + a + ':' + b, on, function(){ mcChord0(a, b, on); }); })(e[2] | 0, e[3] | 0, e[4] ? 1 : 0); else if (e[1] === 1 && e[2] >= 0 && e[2] < 12) mcHarp0(e[2] | 0, 1); }
      else if (e[0] === 'q') skRemote(e[1]);
      else if (e[0] === 'x') scRemote(e[1] | 0, typeof e[2] === 'number' ? e[2] : -1);
      else if (e[0] === 'h' && e[1] >= 0 && e[1] < 11) (function(i, v){ snapRun(null, 1, function(){ hit0(i, v); }); })(e[1] | 0, typeof e[2] === 'number' ? e[2] : 0.8);
    } catch (err2) {}
    Q.applying = false;
  }
  ['keydown', 'pointerdown', 'wheel'].forEach(function(t){ document.addEventListener(t, function(){ Q.inputAt = performance.now(); }, true); });

  // ---- connection ----
  Q.cid = ''; (function(){ var ch = 'abcdefghijklmnopqrstuvwxyz0123456789'; for (var i = 0; i < 16; i++) Q.cid += ch[Math.floor(Math.random() * 36)]; })();
  function ping(){ Q.pingAt = performance.now(); if (send({ t:'ping', at:performance.now() }) !== false) Q.pingOut = (Q.pingOut | 0) + 1; }
  /* keep saying we are here even when the tab is in the background (the room takes out anyone silent for a long while), and notice a dead line ourselves: four pings in a row with no answer and we reconnect */
  setInterval(function(){
    var ws = Q.ws; if (!Q.on || !ws || ws.readyState !== 1) return;
    if (Q.pingOut >= 4 && !document.hidden){ Q.pingOut = 0; try { ws.close(); } catch (e) {} if (ws.onclose) ws.onclose(); return; }
    if (performance.now() - Q.pingAt > 15000) ping();
  }, 20000);
  function connect(){
    var proto = location.protocol === 'https:' ? 'wss://' : 'ws://';
    var ws = new WebSocket(proto + location.host + '/ws/' + Q.code + (Q.spec ? '?spec=1' : '?name=' + encodeURIComponent(Q.name) + '&skin=' + (Q.skin | 0) + (MPME ? '&me=1' : '')) + '&cid=' + Q.cid);      /* cid: this tab's own tag, so if we drop and come back the room takes our old self out at once */
    Q.ws = ws; Q.closedByUs = false; Q.pingOut = 0;
    ws.onmessage = function(ev){
      var m; try { m = JSON.parse(ev.data); } catch (e) { return; }
      if (m.t === 'welcome' && Q.spec){                      // watching: take the room as it is, own nothing in it
        Q.id = null; Q.max = m.max || 6; Q.retry = 0; Q.seen = {}; Q.pings = 0; Q.rtt = 1e9; Q.watch = m.watching | 0; if (typeof m.now === 'number') Q.off = m.now - Date.now();
        var hadDbg = Q.dbg; Object.keys(Q.peers).forEach(removePeer); Q.dbg = false;
        m.players.forEach(function(p){ var P = Q.peers[p.id] = avatar(p.color, p.name, p.skin); P.guest = !!p.guest; if (p.s){ P.s = p.s; P.x = p.s[0]; P.z = p.s[1]; } });
        MPON = true; MPHOST = false; hud.hidden = false; chat.hidden = false; chat.classList.add('watch'); paintHud();
        try { history.replaceState(null, '', '#' + Q.code); } catch (e) {}
        var w0 = m.world || {}; Object.keys(w0).filter(function(k){ return k !== 'transport'; }).sort().forEach(function(k){ applySet(k, w0[k]); }); if (M.playing && !(w0.transport && w0.transport.on)) stopSeq(true); if (w0.transport) transport(w0.transport);
        if (hadDbg && !Q.dbg) dbgPlayers(true, true);          // test players this screen had switched on stay on
        specOn(true); toast(m.players.length ? 'Watching room ' + Q.code : 'Room ' + Q.code + ' is empty for now'); line('Watching room <b>' + esc(Q.code) + '</b> · click once for sound', true);
      } else if (m.t === 'welcome'){
        Q.watch = m.watching | 0; var hadDbg2 = Q.dbg; Q.dbg = false;
        var first = !Q.id; Q.id = m.id; Q.color = m.color; Q.guest = !!m.guest; if (typeof m.skin === 'number') Q.skin = m.skin; Q.max = m.max || 6; Q.retry = 0; Q.seen = {}; Q.pings = 0; Q.rtt = 1e9; if (typeof m.now === 'number') Q.off = m.now - Date.now();
        if (first && Q.guest){ cam.x = clamp(cam.x + (Math.random() * 2 - 1) * 2.2, ROOM.x0 + 0.5, ROOM.x1 - 0.5); cam.z += 0.2 + Math.random() * 0.5; }      // guests come in scattered behind the line
        else if (first && m.players.length){ var ci = Math.max(0, ['#FF2A6A','#30A8F0','#90F0A8','#F5D547','#B05AFF','#FF8A3A'].indexOf(m.color)); cam.x = clamp(cam.x + [0, 0.8, -0.8, 1.6, -1.6, 0][ci], ROOM.x0 + 0.5, ROOM.x1 - 0.5); cam.z += ci === 5 ? 0.55 : 0; }
        Object.keys(Q.peers).forEach(removePeer);
        m.players.forEach(function(p){ var P = Q.peers[p.id] = avatar(p.color, p.name, p.skin); P.guest = !!p.guest; if (p.s){ P.s = p.s; P.x = p.s[0]; P.z = p.s[1]; } });
        MPON = true; MPHOST = !m.players.length; hud.hidden = false; chat.hidden = false; paintHud();
        try { history.replaceState(null, '', '#' + Q.code); } catch (e) {}
        if (MPHOST){ if (M.playing) stopSeq(true); Q.force = true; SAVENOW.forEach(function(f){ try { f(); } catch (e) {} }); Q.force = false; }   // first in: this browser's machines become the room's
        else { var w = m.world || {}, ks = Object.keys(w).filter(function(k){ return k !== 'transport'; }).sort(); ks.forEach(function(k){ applySet(k, w[k]); }); if (M.playing && !(w.transport && w.transport.on)) stopSeq(true); if (w.transport) transport(w.transport); }
        if (hadDbg2 && !Q.dbg) dbgPlayers(true);               // and the rest of the room gets them too
        if (Q.guest){ toast('Room ' + Q.code + ' is full: you are in as a guest', 4200); line('The six places are taken, so you joined room <b>' + esc(Q.code) + '</b> as a <b>guest</b>: walk, sit, chat, emote and place stickers. You get a place when one of the six leaves.', true); }
        else { toast(m.players.length ? 'Joined room ' + Q.code + ' · ' + (m.players.length + 1) + ' here' : 'Room ' + Q.code + ' is open. Send friends the code.');
        line('You joined room <b>' + esc(Q.code) + '</b>', true); }
      } else if (m.t === 'full'){ Q.closedByUs = true; MPON = false; var wasSpec = Q.spec; Q.spec = false; showLobby(wasSpec ? 'Room ' + Q.code + ' has no room left for spectators.' : 'Room ' + Q.code + ' is full (players and guests).'); }
      else if (m.t === 'role'){                              // a guest was given one of the six places
        if (m.id === Q.id){ Q.guest = !!m.guest; Q.color = m.color || Q.color; paintHud(); toast('A place opened: you can play now', 4200); line('A place opened: you are one of the six now and can use everything in the room.', true); }
        else { var G = Q.peers[m.id]; if (G){ var gs = G.s, gn = G.name, gk = G.skinI != null ? G.skinI : G.skin; removePeer(m.id); var N = Q.peers[m.id] = avatar(m.color, gn, gk | 0); N.guest = !!m.guest; if (gs){ N.s = gs; N.x = gs[0]; N.z = gs[1]; } paintHud(); line('<b style="color:' + esc(m.color) + '">' + esc(gn) + '</b> has a place now', true); } } }
      else if (m.t === 'watch'){ Q.watch = m.n | 0; paintHud(); }
      else if (m.t === 'join'){ if (!Q.peers[m.id]) Q.peers[m.id] = avatar(m.color, m.name, m.skin); Q.peers[m.id].guest = !!m.guest; paintHud(); line('<b style="color:' + esc(m.color) + '">' + esc(m.name) + '</b> joined' + (m.guest ? ' as a guest' : ''), true); toast(m.name + ' joined' + (m.guest ? ' as a guest' : '')); }
      else if (m.t === 'leave'){ var P = Q.peers[m.id]; if (P && !m.back) line('<b style="color:' + esc(P.color) + '">' + esc(P.name) + '</b> left', true); removePeer(m.id); }
      else if (m.t === 's'){ var R = Q.peers[m.id]; if (R){ if (!R.s){ R.x = m.s[0]; R.z = m.s[1]; } R.s = m.s; } }
      else if (m.t === 'chat'){ line('<b style="color:' + esc(m.color) + '">' + esc(m.name) + ':</b> ' + esc(m.text).split(':jambu:').join('<img class="jb" src="jambu.png" alt="jambu">')); var S = Q.peers[m.id]; if (S){ S.say = m.text; S.sayUntil = performance.now() + 6000; paintTag(S); } }
      else if (m.t === 'set') applySet(m.k, m.v);
      else if (m.t === 'ev') onEv(m.id, m.e);
      else if (m.t === 'pong'){ Q.pingOut = 0; var rtt = performance.now() - m.at; if (rtt <= Q.rtt){ Q.rtt = rtt; Q.off = m.now + rtt / 2 - Date.now(); } else Q.rtt *= 1.03; Q.pings++; }   // trust only the quickest round trips; let the bar drift up slowly so the clock can still be corrected
    };
    ws.onclose = function(){
      if (Q.ws !== ws) return; Q.ws = null;
      if (Q.closedByUs || !Q.on) return;
      Object.keys(Q.peers).forEach(removePeer); Q.retry = Math.min(Q.retry + 1, 6);
      line('Connection lost · reconnecting…', true); setTimeout(function(){ if (Q.on && !Q.ws) connect(); }, 800 * Q.retry);
    };
  }
  function start(code, spec){
    var nm = nameIn.value.trim().slice(0, 10); Q.spec = !!spec; if (spec && !nm) nm = 'Spectator';
    if (!nm){ err.textContent = 'Type a name first.'; nameIn.focus(); return; }
    code = (code || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
    if (code.length < 4){ err.textContent = 'Room codes are 4 letters or numbers.'; codeIn.focus(); return; }
    try { localStorage.setItem('jambutek-name', nm); } catch (e) {}
    Q.name = nm; Q.code = code; Q.on = true; err.textContent = ''; unlock(); hideLobby(); connect();
  }
  (function(){ var a = document.getElementById('mpLogoA'), b = document.getElementById('mpLogoB'); if (a && A.lobbyLogo){ a.src = A.lobbyLogo; b.src = A.lobbyNeon; } })();      // the logo: a dimmed base and the yellow script, which flickers on top
  /* ---- menu music: loops while the lobby is up, fades away when you go in. Browsers only let sound start after a click or a key,
     so it begins on the first one if it could not start by itself. It obeys the room's mute. ---- */
  var menuA = null, menuFade = null;
  function menuTry(){ if (!menuA || !Q.lobbyOpen) return; menuA.muted = muted; if (!menuA.paused) return; var p = menuA.play(); if (p && p.catch) p.catch(function(){}); }
  function menuOn(){
    if (!menuA){ menuA = new Audio('menu.mp3'); menuA.loop = true; menuA.preload = 'auto'; }
    clearInterval(menuFade); menuA.volume = Math.min(1, OPT.vol); menuTry(); uiStart();          // the file itself is levelled to the room's starter jam (about -16 dB average)
  }
  function menuOff(){ if (!menuA) return; clearInterval(menuFade); menuFade = setInterval(function(){ var v = menuA.volume - 0.04; if (v <= 0.02){ clearInterval(menuFade); menuA.pause(); menuA.volume = 0; } else menuA.volume = v; }, 60); }
  Q.menuAudio = function(){ return menuA; };
  /* ---- menu sounds: a tick when the pointer comes onto a button, a two-note blip on a click. They have their own little audio
     context (the room's is not built until you go in), started by the first click or key, and they obey the mute button. ---- */
  var uiAC = null, uiLast = null, uiClick = null, uiHover = null;
  /* The context and both samples are made ready as soon as the lobby shows (a context may exist before a click, it just stays asleep),
     and every click, tap or key wakes it, so the very first hover or press already has its real sound. */
  function uiStart(){
    if (uiAC) return; try { uiAC = new (window.AudioContext || window.webkitAudioContext)(); } catch (e){ return; }
    function get(url, put){ fetch(url).then(function(r){ return r.arrayBuffer(); }).then(function(b){ uiAC.decodeAudioData(b, put, function(){}); }).catch(function(){}); }
    get('click.mp3', function(buf){ uiClick = buf; }); get('hover.mp3', function(buf){ uiHover = buf; });      // the press sound (a dub clank) and the hover tick
  }
  /* once you are in the room the menu's own sound engine is put to sleep (after the press sound has rung out): two engines running
     side by side is a known cause of crackle, on phones above all. It wakes again with the lobby. */
  var uiNap = null;
  function uiSleep(){ clearTimeout(uiNap); uiNap = setTimeout(function(){ if (uiAC && !Q.lobbyOpen && uiAC.state === 'running') uiAC.suspend().catch(function(){}); }, 6500); }
  function uiWake(){ if (!Q.lobbyOpen) return; uiStart(); if (uiAC && uiAC.state !== 'running' && uiAC.resume) uiAC.resume().catch(function(){}); menuTry(); }
  function uiPlay(buf, vol){ var n = uiAC.createBufferSource(), g = uiAC.createGain(); n.buffer = buf; g.gain.value = vol * OPT.vol; n.connect(g); g.connect(uiAC.destination); n.start(); }
  function uiPress(){ Q.uiLastSound = 'press';
    if (!uiAC || muted || uiAC.state !== 'running') return;
    if (uiClick) uiPlay(uiClick, 0.48);
  }
  function uiErr(){ Q.uiLastSound = 'err'; uiBlip(196, 150, 0.11, 0.08, 'square'); setTimeout(function(){ uiBlip(147, 104, 0.2, 0.08, 'square'); }, 120); }      // a small two-note "nope"
  function uiOver(){
    if (!uiAC || muted || uiAC.state !== 'running') return;
    if (uiHover) uiPlay(uiHover, 0.48);
  }
  function uiBlip(f0, f1, dur, vol, type){
    if (!uiAC || muted || uiAC.state !== 'running') return;
    var t = uiAC.currentTime, o = uiAC.createOscillator(), g = uiAC.createGain();
    o.type = type; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.006); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(uiAC.destination); o.start(t); o.stop(t + dur + 0.02);
  }
  function uiBtn(e){ var b = e.target && e.target.closest ? e.target.closest('button') : null; return b && !b.classList.contains('taken') && (lobby.contains(b) || cred.contains(b)) ? b : null; }
  ['pointerdown', 'pointerup', 'mousedown', 'touchend', 'click', 'keydown'].forEach(function(ev){ document.addEventListener(ev, uiWake, true); });
  document.addEventListener('mouseover', function(e){ if (!Q.lobbyOpen) return; var b = uiBtn(e); if (b === uiLast) return; uiLast = b; if (b) uiOver(); });
  document.addEventListener('click', function(e){ if (!Q.lobbyOpen) return; var b = uiBtn(e); if (!b) return;
    if (b.id === 'mpCreate' || b.id === 'mpJoin' || b.id === 'mpSpec') setTimeout(function(){ if (err.textContent) uiErr(); else uiPress(); }, 0);      // refused (no name, bad code): the error sound instead
    else if (b.id === 'mpSolo' || b.id === 'mpGo') uiPress(); }, true);                                         // only the four ways in make the press sound
  Q.uiLastSound = null;
  Q.uiSound = function(){ return uiAC ? uiAC.state + (uiClick ? ' click ' + uiClick.duration.toFixed(1) + 's' : '') + (uiHover ? ' hover ' + uiHover.duration.toFixed(2) + 's' : '') : null; };
  /* the credits sheet, opened from the line under the lobby card */
  var cred = document.getElementById('mpCredits');
  document.getElementById('mpCred').addEventListener('click', function(){ cred.hidden = false; });
  document.getElementById('mpCredX').addEventListener('click', function(){ cred.hidden = true; });
  cred.addEventListener('click', function(e){ if (e.target === cred) cred.hidden = true; });
  document.addEventListener('keydown', function(e){ if (e.key === 'Escape' && !cred.hidden){ cred.hidden = true; e.stopPropagation(); } }, true);
  /* ---- two screens: the first asks who you are and where you are going, the second ("pick your look") lets you choose a look and
     then carries on with whatever you asked for. Watching skips the second screen. Esc goes back. ---- */
  var S1 = document.getElementById('mpS1'), S2 = document.getElementById('mpS2'), err2 = document.getElementById('mpErr2'), fitNext = null, wrapEl = document.getElementById('mpWrap');
  function lobbyFit(){ if (!wrapEl) return; var z = Math.min(1, (window.innerHeight - 20) / 800, (window.innerWidth - 12) / 672); wrapEl.style.zoom = z < 1 ? z.toFixed(3) : ''; }      // the design is drawn for 1920 x 1080: shrink the whole thing to fit anything smaller
  window.addEventListener('resize', lobbyFit); lobbyFit();
  function toMain(){ fitNext = null; S2.hidden = true; S1.hidden = false; }
  function toFit(next){ err.textContent = ''; err2.textContent = ''; fitNext = next; S1.hidden = true; S2.hidden = false; paintSkins(); bigStart(); setTimeout(function(){ var g = document.getElementById('mpGo'); if (g) g.focus(); }, 30); }
  function nameOk(){ if (nameIn.value.trim()) return true; err.textContent = 'Type a name first.'; nameIn.focus(); return false; }
  function codeOk(){ var c = (codeIn.value || '').toUpperCase().replace(/[^A-Z0-9]/g, ''); if (c.length >= 4) return true; err.textContent = 'Room codes are 4 letters or numbers.'; codeIn.focus(); return false; }
  function showLobby(msg){ Q.lobbyOpen = true; toMain(); lobbyFit(); menuOn(); lobby.hidden = false; err.textContent = msg || ''; if (msg) uiErr(); releaseLock(); refreshLockUi(); setTimeout(function(){ (nameIn.value ? codeIn : nameIn).focus(); }, 50); }
  function hideLobby(){ Q.lobbyOpen = false; lobby.hidden = true; refreshLockUi(); menuOff(); cred.hidden = true; uiSleep(); }
  function goCreate(){ err.textContent = ''; if (!nameOk()) return; Q.taken = []; toFit(function(){ start(newCode()); }); }
  function goJoin(){ err.textContent = ''; if (!nameOk() || !codeOk()) return; takenT = 0; checkTaken(); toFit(function(){ start(codeIn.value); }); }
  document.getElementById('mpCreate').addEventListener('click', goCreate);
  document.getElementById('mpJoin').addEventListener('click', goJoin);
  document.getElementById('mpSpec').addEventListener('click', function(){ start(codeIn.value, true); });
  codeIn.addEventListener('keydown', function(e){ if (e.key === 'Enter') goJoin(); });
  nameIn.addEventListener('keydown', function(e){ if (e.key === 'Enter') (codeIn.value.length >= 4 ? goJoin() : goCreate()); });
  document.getElementById('mpSolo').addEventListener('click', function(){ err.textContent = ''; Q.taken = []; toFit(function(){ Q.on = false; hideLobby(); }); });
  document.getElementById('mpGo').addEventListener('click', function(){ var f = fitNext; toMain(); if (f) f(); });
  document.getElementById('mpBack').addEventListener('click', function(){ toMain(); setTimeout(function(){ nameIn.focus(); }, 30); });
  /* custom skins by code: the box and the button are here; there are no custom skins to hand out yet, so every code is turned down */
  function skinCode(){
    var c = (document.getElementById('mpSkinCode').value || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, ''), ix = -1; SKINS.forEach(function(sk, i){ if (sk.code && sk.code === c) ix = i; });
    err2.classList.remove('ok');
    if (!c){ err2.textContent = 'Type your code first.'; uiErr(); return; }
    if (ix < 0){ err2.textContent = 'No skin found for that code.'; uiErr(); return; }
    if (Q.taken.indexOf(ix) >= 0){ err2.textContent = SKINS[ix].n + ' is already in that room.'; uiErr(); return; }
    Q.skin = ix; bigHover = -1; try { localStorage.setItem('jambutek-skin', ix); } catch (e) {} paintSkins(); err2.textContent = 'Custom skin: ' + SKINS[ix].n; err2.classList.add('ok'); uiPress();
  }
  document.getElementById('mpSkinGo').addEventListener('click', skinCode);
  document.getElementById('mpSkinCode').addEventListener('keydown', function(e){ if (e.key === 'Enter'){ e.preventDefault(); skinCode(); } });
  document.addEventListener('keydown', function(e){ if (!Q.lobbyOpen || S2.hidden || !cred.hidden) return; if (e.key === 'Escape'){ toMain(); } else if (e.key === 'Enter' && e.target && e.target.id !== 'mpSkinCode' && e.target.id !== 'mpSkinGo'){ e.preventDefault(); document.getElementById('mpGo').click(); } }, true);
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
  /* a small, soft tick for the emoji buttons: a short high blip straight to the speakers (not through the mixer), well under the music */
  function emoClick(){ try { if (!AU.ready) return; var t = ac.currentTime, o = ac.createOscillator(), g = ac.createGain(), f = ac.createBiquadFilter();
    o.type = 'triangle'; o.frequency.setValueAtTime(2600, t); o.frequency.exponentialRampToValueAtTime(1500, t + 0.03); f.type = 'highpass'; f.frequency.value = 900;
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.06 * (OPT.vol == null ? 1 : OPT.vol), t + 0.002); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.045);
    o.connect(f); f.connect(g); g.connect(ac.destination); o.start(t); o.stop(t + 0.06); } catch (e) {} }
  /* the six quick emoji under the chat bar: a click sends it straight to the chat, and it rises over your head for everyone */
  Array.prototype.forEach.call(document.querySelectorAll('#mpEmo button'), function(b){ b.addEventListener('mousedown', function(e){ e.preventDefault(); }); b.addEventListener('click', function(e){ e.preventDefault(); e.stopPropagation(); send({ t:'chat', text:b.getAttribute('data-t') || b.textContent }); emoClick(); closeChat(); }); });
  [nameIn, codeIn].forEach(function(el){ el.addEventListener('keydown', function(e){ e.stopPropagation(); }); el.addEventListener('keyup', function(e){ e.stopPropagation(); }); });
  document.addEventListener('keydown', function(e){
    if (Q.lobbyOpen){ e.stopPropagation(); return; }
    if (Q.ws && !Q.spec && !Q.chatOpen && (e.key === 't' || e.key === 'T') && mode === 'walk' && !e.repeat){ e.preventDefault(); e.stopPropagation(); openChat(); }
  }, true);
  /* where a player stands at a machine: place 0 is the middle, 1 and 2 are 64 cm to its right and left, turned in toward it */
  function leanSpot(D, slot){
    var y = D.yaw || 0, fx = -Math.sin(y), fz = -Math.cos(y), rx = Math.cos(y), rz = -Math.sin(y), x = D.stand.x + 0.25 * fx, z = D.stand.z + 0.25 * fz;
    if (slot){ var sd = slot === 1 ? 1 : -1; x += rx * 0.64 * sd - fx * 0.08; z += rz * 0.64 * sd - fz * 0.08; y = Math.atan2(-(D.stand.x + fx * 0.75 - x), -(D.stand.z + fz * 0.75 - z)); }
    return [x, z, y];
  }
  // ---- every frame: send where we are and which knobs moved; move everyone else smoothly ----
  Q.tick = function(now, dt){
    if (Q.ws && Q.ws.readyState === 1){
      if (now - Q.sendAt > 66){
        Q.sendAt = now; var lean = mode === 'tr' && LEAN, px = lean ? LEAN.stand.x - 0.25 * Math.sin(LEAN.yaw || 0) : cam.x, pz = lean ? LEAN.stand.z - 0.25 * Math.cos(LEAN.yaw || 0) : cam.z;
        var lyaw = lean ? (LEAN.yaw || 0) : 0, lix = lean ? 1 + Math.max(0, Object.keys(DEVS).indexOf(LEAN.key)) : 0;
        if (lean){                                                    /* sharing a machine: whoever is already at it keeps the middle, and to everyone else we lean in from its side. Our own view does not change. */
          var fx = -Math.sin(lyaw), fz = -Math.cos(lyaw), rx = Math.cos(lyaw), rz = -Math.sin(lyaw), taken = {}, clash = false;
          Object.keys(Q.peers).forEach(function(id){ var o = Q.peers[id].s; if (!o || !o[6]) return; var off = (o[0] - px) * rx + (o[1] - pz) * rz, fwd = (o[0] - px) * fx + (o[1] - pz) * fz; if (Math.abs(off) > 0.95 || Math.abs(fwd) > 0.5) return;      /* anyone leaning at this spot counts, whichever machine they are on: a Snake and its synth share one standing place */
            var sl = off > 0.2 ? 1 : off < -0.2 ? 2 : 0; taken[sl] = 1; if (sl === Q.leanSlot && String(id) < String(Q.id)) clash = true; });
          if (Q.leanKey !== LEAN.key || Q.leanSlot == null || clash || (Q.leanSlot > 0 && !taken[0])){ Q.leanKey = LEAN.key; Q.leanSlot = !taken[0] ? 0 : !taken[1] ? 1 : !taken[2] ? 2 : 1; }
          if (Q.leanSlot){ var ls = leanSpot(LEAN, Q.leanSlot); px = ls[0]; pz = ls[1]; lyaw = ls[2]; }
        } else { Q.leanKey = null; Q.leanSlot = null; }
        var em = !lean && EM.id ? EM.id : 0, st8 = 0, st9 = 0;
        if (SIT.on && !lean){ var SS = SEATS[SIT.seat], hd = cam.yaw - SS.yaw; st8 = 1 + SIT.seat * 3 + SIT.pose; st9 = +Math.atan2(Math.sin(hd), Math.cos(hd)).toFixed(3); px = SS.x; pz = SS.z; }      // seated: which seat and pose, and how far the head is turned
        send({ t:'s', s:[+px.toFixed(3), +pz.toFixed(3), +(lean ? lyaw : st8 ? SEATS[SIT.seat].yaw : em ? EM.face : cam.yaw).toFixed(3), +(lean ? -0.45 : em ? EM.pitch : cam.pitch).toFixed(3), +crouch.k.toFixed(2), +JUMP.y.toFixed(3), lix, em, st8, st9] });      // the seventh number is 0 when walking, else which machine (so the room can show who is where)
      }
      if (now - Q.cqAt > 50){ var ids = Object.keys(Q.cq); if (ids.length){ Q.cqAt = now; send({ t:'ev', e:['c', ids.map(function(id){ return [id, Q.cq[id]]; })] }); Q.cq = {}; } }
      if (now - Q.pingAt > (Q.pings < 6 ? 1500 : 9000)) ping();
      if (Q.pendT && ac && AU.ready) transport(Q.pendT);
    }
    glowTick(now); pingTick(now);
    var k = 1 - Math.exp(-dt * 12);
    Object.keys(Q.peers).forEach(function(id){
      var P = Q.peers[id], s = P.s; if (!s){ P.g.visible = false; return; } P.g.visible = !(mode === 'tr' && LEAN && s[6] && Math.hypot(s[0] - (LEAN.stand.x - 0.25 * Math.sin(LEAN.yaw || 0)), s[1] - (LEAN.stand.z - 0.25 * Math.cos(LEAN.yaw || 0))) < 0.9);      /* leaning over a machine someone else is on: they are not drawn for us, or they would stand in our view */
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
      var em = s[6] ? 0 : clamp(s[7] | 0, 0, 6); if (em !== (P.eid | 0)){ if (em){ P.eshow = em; P.et = 0; } P.eid = em; } P.ek = lerp(P.ek || 0, em ? 1 : 0, 1 - Math.exp(-dt * 7)); P.et = (P.et || 0) + dt;
      emote(P, P.eshow || 1, P.et, P.ek < 0.004 ? 0 : P.ek, now);
      var sc8 = s[8] | 0; P.sit = lerp(P.sit || 0, sc8 ? 1 : 0, 1 - Math.exp(-dt * 8)); if (sc8) P.sitP = (sc8 - 1) % 3; P.hy = lerp(P.hy || 0, sc8 ? clamp(+s[9] || 0, -1.8, 1.8) : 0, k);
      if (P.sit > 0.01) sitPose(P, P.sitP || 0, P.hy, P.sit, P.ek); else if (P.sit !== 0){ P.sit = 0; P.legR.rotation.y = P.legR.rotation.z = 0; P.head.rotation.y = 0; }      // seated on a couch
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
  /* ---- spectating: cameras on keys 1 to 6. Five are fixed, the sixth flies. One in each ceiling corner where the stage lights hang, and one in the middle of
     the rig just above the sequencers that can look all the way round. The mouse still turns the view. ---- */
  var SPECCAMS = (function(){ var i = 0.62, y = ROOM.h - 0.42, L = [['north-west corner', ROOM.x0 + i, y, ROOM.z0 + i], ['north-east corner', ROOM.x1 - i, y, ROOM.z0 + i], ['south-west corner', ROOM.x0 + i, y, ROOM.z1 - i], ['south-east corner', ROOM.x1 - i, y, ROOM.z1 - i], ['centre, look all round', RIG.x, 2.08, RIG.z]];
    return L.map(function(c, k){ var dx = RIG.x - c[1], dz = RIG.z - c[3], dy = 1.0 - c[2]; return { name:c[0], x:c[1], y:c[2], z:c[3], yaw:k === 4 ? 0 : Math.atan2(-dx, -dz), pitch:k === 4 ? -0.08 : Math.atan2(dy, Math.hypot(dx, dz)) }; }); })();
  /* The four corner cameras slide up and down their corner on the scroll wheel, from near the floor to the ceiling, still aimed at the
     rig. Each keeps the height it was left at for the rest of the session (and across a reload in the same tab). */
  function specAim(c, y){ return Math.atan2(1.0 - y, Math.hypot(RIG.x - c.x, RIG.z - c.z)); }
  try { var sh = JSON.parse(sessionStorage.getItem('jambutek-studio-camh') || 'null'); if (Array.isArray(sh)) sh.forEach(function(y, i){ if (i < 4 && typeof y === 'number') SPECCAMS[i].y = clamp(y, 0.22, ROOM.h - 0.3); }); } catch (e) {}
  window.addEventListener('wheel', function(e){
    if (!SPEC.on || SPEC.i > 3 || Q.lobbyOpen || (dbgEl && !dbgEl.hidden)) return; var c = SPECCAMS[SPEC.i]; c.y = clamp(c.y - e.deltaY * 0.0013, 0.22, ROOM.h - 0.3);
    try { sessionStorage.setItem('jambutek-studio-camh', JSON.stringify(SPECCAMS.slice(0, 4).map(function(q){ return +q.y.toFixed(3); }))); } catch (e2) {}
  }, { passive:true });
  var specEl = null;
  /* ---- over-the-shoulder cameras, keys 7 8 9 0: one for each side of the rig. Each sits just behind and beside whoever stands at a
     machine on that side, looking over their shoulder at the panel. It picks a machine somebody is at (else the middle one); the left
     and right arrows step along the side. These four have depth of field: F switches it, the wheel sets the sharp distance, Shift and
     the wheel the size of the blur. ---- */
  var OTSKEYS = ['tr', 'mf', 'bs', 'zk', 'mb', 'sh', 'am', 'tp', 'mx', 'mc', 'ec', 'sc'], OTSNAME = ['north', 'east', 'south', 'west'], OTS = null, OTSAT = [-1, -1, -1, -1];
  var DOF = { on:true, f:1.3, a:0.6 };
  try { var sd = JSON.parse(sessionStorage.getItem('jambutek-studio-dof') || 'null'); if (sd && typeof sd.f === 'number'){ DOF.on = !!sd.on; DOF.f = clamp(sd.f, 0.25, 9); DOF.a = clamp(sd.a, 0.05, 1); } } catch (e) {}
  function dofSave(){ try { sessionStorage.setItem('jambutek-studio-dof', JSON.stringify(DOF)); } catch (e) {} }
  function otsSides(){
    if (OTS) return OTS; OTS = [[], [], [], []];
    OTSKEYS.forEach(function(k){ var D = DEVS[k]; if (!D) return; var dx = D.stand.x - RIG.x, dz = D.stand.z - RIG.z, side = Math.abs(dz) >= Math.abs(dx) ? (dz < 0 ? 0 : 2) : (dx > 0 ? 1 : 3);
      OTS[side].push({ k:k, D:D, u:side === 0 || side === 2 ? D.stand.x : D.stand.z }); });
    OTS.forEach(function(L){ L.sort(function(a, b){ return a.u - b.u; }); }); return OTS;
  }
  function otsBusy(L){                                       // the machine on this side that somebody is standing at, if any
    var best = -1, bd = 0.7; L.forEach(function(m, j){ Object.keys(Q.peers).forEach(function(id){ var P = Q.peers[id], d = Math.hypot(P.x - m.D.stand.x, P.z - m.D.stand.z); if (d < bd){ bd = d; best = j; } }); }); return best;
  }
  function otsPlace(side, quiet){
    var L = otsSides()[side]; if (!L.length) return false; if (OTSAT[side] < 0 || OTSAT[side] >= L.length){ var b = otsBusy(L); OTSAT[side] = b >= 0 ? b : (L.length - 1) >> 1; }
    var m = L[OTSAT[side]], D = m.D, yaw = D.yaw || 0, fx = -Math.sin(yaw), fz = -Math.cos(yaw), rx = Math.cos(yaw), rz = -Math.sin(yaw);
    var x = clamp(D.stand.x - fx * 0.66 + rx * 0.6, ROOM.x0 + 0.25, ROOM.x1 - 0.25), z = clamp(D.stand.z - fz * 0.66 + rz * 0.6, ROOM.z0 + 0.25, ROOM.z1 - 0.25), y = 1.8;
    var tx = D.stand.x + fx * 0.6 + rx * 0.3, tz = D.stand.z + fz * 0.6 + rz * 0.3, ty = 1.0, dx = tx - x, dz = tz - z;
    SPEC.i = 6 + side; SPEC.x = x; SPEC.y = y; SPEC.z = z; cam.x = x; cam.z = z; cam.yaw = cam.ty = Math.atan2(-dx, -dz); cam.pitch = cam.tp = Math.atan2(ty - y, Math.hypot(dx, dz)); cam.walkTo = null; cam.homing = false;
    if (!quiet) toast('Camera ' + (side === 3 ? 0 : 7 + side) + ' · over the shoulder, ' + OTSNAME[side] + ' side · ' + D.name); specHudText(); return true;
  }
  Q.dofNow = function(){ return SPEC.on && SPEC.i >= 6 && SPEC.i <= 9 && DOF.on && !Q.lobbyOpen ? DOF : null; /* the four shoulder cameras only, never the top one */ };
  window.addEventListener('wheel', function(e){
    if (!SPEC.on || SPEC.i < 6 || SPEC.i > 9 || Q.lobbyOpen || (dbgEl && !dbgEl.hidden)) return; var st = (e.deltaY || e.deltaX) > 0 ? -1 : 1;
    if (e.shiftKey) DOF.a = clamp(Math.round((DOF.a + st * 0.05) * 100) / 100, 0.05, 1); else DOF.f = clamp(DOF.f * (st > 0 ? 1.06 : 1 / 1.06), 0.25, 9);
    DOF.on = true; dofSave(); specHudText();
  }, { passive:true });
  var SPK = {}, specSpin = false, specAuto = false, specBar = -1;      // auto edit: the room cuts between cameras 1 to 5 by itself, every four bars
  function specHudText(){ if (!specEl) return; var i = SPEC.i;
    if (i === 10){ specEl.innerHTML = '<b>TOP CAMERA</b> &middot; keys <b>1</b>&ndash;<b>0</b> and <b>&minus;</b> change camera &middot; <b>scroll</b> zooms &middot; <b>Q</b> slow turn ' + (specSpin ? '<b>on</b>' : 'off') + ' &middot; mouse turns and tilts'; return; }
    if (i >= 6){ specEl.innerHTML = '<b>CAMERA ' + (i === 9 ? 0 : i + 1) + '</b> &middot; keys <b>1</b>&ndash;<b>0</b> and <b>&minus;</b> change camera &middot; <b>&larr; &rarr;</b> next machine &middot; <b>F</b> depth of field ' + (DOF.on ? '<b>on</b> &middot; <b>scroll</b> focus <b>' + DOF.f.toFixed(2) + ' m</b> &middot; <b>Shift + scroll</b> aperture <b>' + Math.round(DOF.a * 100) + '%</b>' : 'off'); return; }
    specEl.innerHTML = '<b>CAMERA ' + (i + 1) + '</b> &middot; keys <b>1</b>&ndash;<b>0</b> and <b>&minus;</b> change camera &middot; ' + (i === 5 && !specAuto ? '' : '<b>A</b> auto edit ' + (specAuto ? '<b>on</b>' : 'off') + ' &middot; ') + (i === 5 ? '<b>WASD</b> fly &middot; <b>Space</b> / <b>C</b> up and down &middot; <b>Shift</b> faster' : i === 4 ? '<b>Q</b> ' + (specSpin ? 'stops the slow turn' : 'turns it slowly') + ' &middot; mouse looks round' : '<b>scroll</b> sets height &middot; mouse looks round'); }
  /* the top-down camera, on the minus key: in the ceiling over the middle of the rig, looking straight down through a wide lens.
     The mouse turns (and tilts) it, the wheel zooms. */
  var TOP = { fov:118 };                                       // starts fully pulled back: the widest view, as if from the highest point
  Q.specFov = function(){ return SPEC.on && SPEC.i === 10 ? TOP.fov : 0; };
  window.addEventListener('wheel', function(e){ if (!SPEC.on || SPEC.i !== 10 || Q.lobbyOpen || (dbgEl && !dbgEl.hidden)) return; TOP.fov = clamp(TOP.fov + (e.deltaY > 0 ? 4 : -4), 40, 118); specHudText(); }, { passive:true });
  function specCam(i, quiet){
    if (i === 10){ SPEC.i = 10; SPEC.x = RIG.x; SPEC.y = ROOM.h - 0.14; SPEC.z = RIG.z; cam.x = SPEC.x; cam.z = SPEC.z; cam.yaw = cam.ty = 0; cam.pitch = cam.tp = -1.5; cam.walkTo = null; cam.homing = false; if (!quiet) toast('Top camera · straight down on the rig'); specHudText(); return; }
    if (i >= 6){ OTSAT[i - 6] = -1; if (!otsPlace(i - 6, quiet)) return; return; }
    if (i === 5){ SPEC.i = 5; cam.walkTo = null; cam.homing = false; if (!quiet) toast('Camera 6 · free: WASD to fly, Space and C for up and down'); specHudText(); return; }      // the free camera starts wherever the last one was
    var c = SPECCAMS[i]; if (!c) return; SPEC.i = i; SPEC.x = c.x; SPEC.y = c.y; SPEC.z = c.z; cam.x = c.x; cam.z = c.z; cam.yaw = cam.ty = c.yaw; cam.pitch = cam.tp = i < 4 ? specAim(c, c.y) : c.pitch; cam.walkTo = null; cam.homing = false; if (!quiet) toast('Camera ' + (i + 1) + ' · ' + c.name); specHudText(); }
  Q.specTick = function(dt){                                 // camera 6 flies; camera 5 can turn by itself
    if (specAuto){ var bar = M.playing && typeof SEQ.visN === 'number' ? Math.floor(SEQ.visN / 64) : Math.floor(performance.now() / 8000);      // four bars with the drums running, eight seconds without
      if (bar !== specBar){ var first = specBar === -1; specBar = bar; if (!first){ var nx = (SPEC.i + 1 + ((Math.random() * 4) | 0)) % 5; specCam(nx, true); } } }
    if (SPEC.i < 4){ var cc = SPECCAMS[SPEC.i]; if (Math.abs(cc.y - SPEC.y) > 0.0005){ var ny = lerp(SPEC.y, cc.y, 1 - Math.exp(-dt * 9)), dp = specAim(cc, ny) - specAim(cc, SPEC.y); SPEC.y = ny; cam.tp = clamp(cam.tp + dp, -1.35, 1.25); cam.pitch = clamp(cam.pitch + dp, -1.35, 1.25); } }      // glide to the new height, keeping the rig in frame
    if ((SPEC.i === 4 || SPEC.i === 10) && specSpin) cam.ty += dt * (SPEC.i === 10 ? 0.12 : 0.16);
    if (SPEC.i !== 5) return; var f = (SPK.w || SPK.arrowup ? 1 : 0) - (SPK.s || SPK.arrowdown ? 1 : 0), r = (SPK.d ? 1 : 0) - (SPK.a ? 1 : 0), u = (SPK[' '] ? 1 : 0) - (SPK.c ? 1 : 0); if (!f && !r && !u){ SPEC.v = 0; return; }
    SPEC.v = lerp(SPEC.v || 0, SPK.shift ? 4.2 : 1.6, 1 - Math.exp(-dt * 5)); var sp = SPEC.v * dt, cp = Math.cos(cam.pitch), sy = Math.sin(cam.yaw), cy = Math.cos(cam.yaw);      // eases up to speed so moves start softly
    SPEC.x = clamp(SPEC.x + (-sy * cp * f + cy * r) * sp, ROOM.x0 + 0.2, ROOM.x1 - 0.2); SPEC.z = clamp(SPEC.z + (-cy * cp * f - sy * r) * sp, ROOM.z0 + 0.2, ROOM.z1 - 0.2); SPEC.y = clamp(SPEC.y + (Math.sin(cam.pitch) * f + u) * sp, 0.25, ROOM.h - 0.2);
  };
  function specOn(on){
    if (on === SPEC.on) return; if (on && mode === 'tr'){ try { leaveTR(); } catch (e) {} }
    emoteSet(0); SPEC.on = on; document.body.classList.toggle('spec', on);
    if (!specEl){ specEl = document.createElement('div'); specEl.id = 'specHud'; document.body.appendChild(specEl); }
    specEl.hidden = !on;
    if (on) specCam(SPEC.i >= 5 ? 0 : SPEC.i || 0, true); else { cam.x = HOME.x; cam.z = HOME.z; cam.yaw = cam.ty = HOME.yaw; cam.pitch = cam.tp = HOME.pitch; }
  }
  document.addEventListener('keydown', function(e){          // while watching, the keyboard only changes camera
    if (!SPEC.on || Q.lobbyOpen || e.key === 'F2' || e.key === 'Escape' || e.ctrlKey || e.metaKey || e.altKey) return;
    var i = '1234567890-'.indexOf(e.key), k = e.key.toLowerCase(); if (i >= 0 && !e.repeat){ specAuto = false; specCam(i); }
    else if (SPEC.i >= 6 && SPEC.i <= 9 && !e.repeat && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')){ var sdI = SPEC.i - 6, Ls = otsSides()[sdI]; OTSAT[sdI] = (OTSAT[sdI] + (e.key === 'ArrowRight' ? 1 : Ls.length - 1)) % Ls.length; otsPlace(sdI); e.preventDefault(); }
    else if (SPEC.i >= 6 && SPEC.i <= 9 && !e.repeat && k === 'f'){ DOF.on = !DOF.on; dofSave(); toast(DOF.on ? 'Depth of field on' : 'Depth of field off'); specHudText(); } else if (k === 'a' && !e.repeat && (SPEC.i !== 5 || specAuto)){ specAuto = !specAuto; specBar = -1; if (specAuto && SPEC.i >= 5) specCam(0, true); toast(specAuto ? 'Auto edit on · cuts every four bars · A or a number key for manual' : 'Auto edit off · manual'); specHudText(); }
    else if (k === 'q' && !e.repeat && (SPEC.i === 4 || SPEC.i === 10)){ specSpin = !specSpin; toast((SPEC.i === 10 ? 'Top camera' : 'Camera 5') + (specSpin ? ' turning slowly · Q stops it' : ' still')); specHudText(); }
    SPK[k] = true; SPK.shift = e.shiftKey; e.stopPropagation(); if (e.key === ' ' || e.key === 'Tab' || e.key === 'Enter') e.preventDefault();
  }, true);

  document.addEventListener('keyup', function(e){ SPK[e.key.toLowerCase()] = false; SPK.shift = e.shiftKey; }, true); window.addEventListener('blur', function(){ SPK = {}; });

  /* ---- F2: a small debug menu ---- */
  var dbgEl = null, DBGDEV = ['tr', 'mx', 'mf', 'bs', 'sh', 'sc'], DBGCOL = ['#FF2A6A', '#30A8F0', '#90F0A8', '#F5D547', '#B05AFF', '#FF8A3A'];
  /* ---- settings: the gear under the mute button, or F1. This player's own choices only. ---- */
  var optEl = null;
  function optApply(){
    if (AU.out) AU.out.gain.value = muted ? 0 : OPT.vol; if (menuA) menuA.volume = Math.min(1, OPT.vol);
    if (linesIdx !== QLINES[OPT.q]){ linesIdx = QLINES[OPT.q]; resize(); } optSave();
  }
  function optPaint(){ if (!optEl) return; ['sens', 'vol'].forEach(function(k){ optEl.querySelector('#opt_' + k).value = OPT[k]; optEl.querySelector('#optv_' + k).textContent = Math.round(OPT[k] * 100) + '%'; }); optEl.querySelector('#opt_q').value = OPT.q; }
  function optMenu(show){
    if (!optEl){ optEl = document.createElement('div'); optEl.id = 'optMenu'; optEl.hidden = true;
      optEl.innerHTML = '<h3>Local settings</h3>' +
        '<label>Volume <b id="optv_vol"></b><input type="range" id="opt_vol" min="0" max="1" step="0.01"></label>' +
        '<label>Mouse sensitivity <b id="optv_sens"></b><input type="range" id="opt_sens" min="0.2" max="3" step="0.05"></label>' +
        '<label>Quality<select id="opt_q"><option value="2">High</option><option value="1">Medium</option><option value="0">Low</option></select></label>' +
        '<div class="rw"><button type="button" id="optReset">Reset</button><button type="button" id="optX">Close</button></div>';
      document.body.appendChild(optEl);
      ['sens', 'vol'].forEach(function(k){ optEl.querySelector('#opt_' + k).addEventListener('input', function(){ OPT[k] = +this.value; optApply(); optPaint(); }); });
      optEl.querySelector('#opt_q').addEventListener('change', function(){ OPT.q = clamp(+this.value | 0, 0, 2); optApply(); });
      optEl.querySelector('#optReset').addEventListener('click', function(){ OPT.sens = 1; OPT.vol = 1; OPT.q = 2; optApply(); optPaint(); });
      optEl.querySelector('#optX').addEventListener('click', function(){ optMenu(false); });
      ['keydown', 'keyup', 'pointerdown', 'wheel'].forEach(function(t){ optEl.addEventListener(t, function(e){ if (e.key !== 'F1' && e.key !== 'Escape') e.stopPropagation(); }); });
    }
    optEl.hidden = show == null ? !optEl.hidden : !show; if (!optEl.hidden){ optPaint(); if (typeof releaseLock === 'function') releaseLock(); }
  }
  document.getElementById('gear').addEventListener('click', function(){ optMenu(); this.blur(); });
  document.addEventListener('keydown', function(e){ if (e.key === 'F1'){ e.preventDefault(); if (!e.repeat) optMenu(); } else if (e.key === 'Escape' && optEl && !optEl.hidden) optMenu(false); }, true);
  Q.opt = optMenu;
  /* a look for the next test player: one nobody in the room is wearing (you, real players or other test players), the hidden looks included;
     only once every look is out does one come round again */
  var dbgNext = 0;
  function dbgSkin(){
    var n = SKINS.length, used = {}; used[Q.skin | 0] = 1; Object.keys(Q.peers).forEach(function(id){ var P = Q.peers[id]; if (P) used[P.skin | 0] = 1; });
    for (var k = 0; k < n; k++){ var i = (dbgNext + k) % n; if (!used[i]){ dbgNext = i + 1; return i; } }
    return (dbgNext++) % n;
  }
  function dbgPlayers(on, remote){                           // a player who switches them on shows them to the whole room, spectators included
    if (!remote && Q.ws && !Q.spec) send({ t:'set', k:'dbg', v:on ? '1' : '0' });
    Object.keys(Q.peers).forEach(function(id){ if (id.indexOf('dbg') === 0) removePeer(id); }); Q.dbg = !!on; if (!on){ if (Q.ws) paintHud(); return; }
    DBGDEV.forEach(function(k, i){ var D = DEVS[k]; if (!D) return; var yaw = D.yaw || 0, x = D.stand.x - 0.25 * Math.sin(yaw), z = D.stand.z - 0.25 * Math.cos(yaw), P = Q.peers['dbg' + i] = avatar(DBGCOL[i], 'Test ' + (i + 1), dbgSkin()); P.s = [x, z, yaw, -0.45, 0, 0, 1 + Math.max(0, Object.keys(DEVS).indexOf(k)), 0]; P.x = x; P.z = z; P.yaw = yaw; });
    if (Q.ws) paintHud();
  }
  function dbgShare(on){                                      // three test players sharing the machine nearest to you (not a Snake): to see how a shared machine looks. This browser only
    Object.keys(Q.peers).forEach(function(id){ if (id.indexOf('shr') === 0) removePeer(id); }); Q.dbgShare = !!on; if (!on) return;
    var best = null, bd = 1e9; Object.keys(DEVS).forEach(function(k){ var D = DEVS[k]; if (!D.stand || k.indexOf('sn') === 0 || k === 'wall') return; var d = Math.hypot(D.stand.x - cam.x, D.stand.z - cam.z); if (d < bd){ bd = d; best = k; } });
    if (!best) return; var D = DEVS[best]; Q.dbgShareAt = D.name || best;
    [0, 1, 2].forEach(function(sl){ var L = leanSpot(D, sl), P = Q.peers['shr' + sl] = avatar(DBGCOL[sl], ['Middle', 'Right', 'Left'][sl], dbgSkin()); P.s = [L[0], L[1], L[2], -0.45, 0, 0, 1 + Math.max(0, Object.keys(DEVS).indexOf(best)), 0]; P.x = L[0]; P.z = L[1]; P.yaw = L[2]; });
  }
  function dbgSit(on){                                        // test players on every couch seat, one in each pose in turn: for this browser only
    Object.keys(Q.peers).forEach(function(id){ if (id.indexOf('sit') === 0) removePeer(id); }); Q.dbgSit = !!on; if (!on) return;
    SEATS.forEach(function(S, i){ var P = Q.peers['sit' + i] = avatar(DBGCOL[i % 6], 'Sit ' + (i + 1), dbgSkin()); P.s = [S.x, S.z, S.yaw, 0, 0, 0, 0, 0, 1 + i * 3 + (i % 3), [0, 0.7, -0.6, 0.3][i % 4]]; P.x = S.x; P.z = S.z; P.yaw = S.yaw; });
  }
  function dbgPaint(){ if (!dbgEl) return; dbgEl.querySelector('#dbgC').textContent = (Q.dbgSit ? '☑' : '☐') + '  Sitting test players on every couch'; dbgEl.querySelector('#dbgP').textContent = (Q.dbg ? '☑' : '☐') + '  Six test players at six machines'; dbgEl.querySelector('#dbgT').textContent = (Q.dbgShare ? '☑' : '☐') + '  Three test players sharing the nearest machine' + (Q.dbgShare && Q.dbgShareAt ? ' (' + Q.dbgShareAt + ')' : ''); dbgEl.querySelector('#dbgS').textContent = (SPEC.on ? '☑' : '☐') + '  Spectator cameras (keys 1–0 and −)'; dbgEl.querySelector('#dbgS').disabled = !!Q.spec; }
  function dbgMenu(){
    if (!dbgEl){ dbgEl = document.createElement('div'); dbgEl.id = 'dbgMenu'; dbgEl.innerHTML = '<h3>Debug &middot; F2</h3><button type="button" id="dbgP"></button><button type="button" id="dbgC"></button><button type="button" id="dbgT"></button><button type="button" id="dbgS"></button><p>In a room, test players switched on by a player show for everyone, spectators too. F2 or Esc closes this.</p>'; document.body.appendChild(dbgEl); dbgEl.hidden = true;
      dbgEl.querySelector('#dbgP').addEventListener('click', function(){ dbgPlayers(!Q.dbg); dbgPaint(); });
      dbgEl.querySelector('#dbgC').addEventListener('click', function(){ dbgSit(!Q.dbgSit); dbgPaint(); });
      dbgEl.querySelector('#dbgT').addEventListener('click', function(){ dbgShare(!Q.dbgShare); dbgPaint(); });
      dbgEl.querySelector('#dbgS').addEventListener('click', function(){ if (!Q.spec) specOn(!SPEC.on); dbgPaint(); }); }
    dbgEl.hidden = !dbgEl.hidden; if (!dbgEl.hidden){ dbgPaint(); releaseLock(); }
  }
  document.addEventListener('keydown', function(e){ if (e.key === 'F2'){ e.preventDefault(); e.stopPropagation(); if (!Q.lobbyOpen) dbgMenu(); } else if (e.key === 'Escape' && dbgEl && !dbgEl.hidden) dbgEl.hidden = true; }, true);
  Q.debug = { share:dbgShare, sit:dbgSit, players:dbgPlayers, spec:specOn, cam:specCam, cams:SPECCAMS, ots:otsSides, dof:DOF };
  Q.serverNow = serverNow;
  return Q;
})();
