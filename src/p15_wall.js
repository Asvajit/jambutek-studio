
/* ================= the jam panels, one on the front of each video booth counter =================
   Two identical sets, in opposite corners, so one is always near. CLEAR wipes every pattern on every machine; DEMO puts
   the starter jam back, sounds and settings included. Both have to be held down for a moment, so a stray click does nothing.
   EXPORT saves the whole room to a file; LOAD opens the list of jams that ship with the room (vendor/jams/), or takes a file. */
var WALLHOLD = 1300, WALL = { t0:0, c:null, done:false }, WALLBTN = [];
/* The panels use one round push-button (model by DrakonSlayer, CC BY 4.0: see vendor/MODELS-NOTICE.md), painted here: a coloured cap with
   its name, and a grey ring round it that is the indicator. On the two buttons that must be held the ring fills clockwise from twelve
   o'clock until the action happens; on the others the whole ring lights while the button is down (or, for ROOM KEY, while it is on). */
var RBG = window.JB_BUTTON ? { base:bakedGeo(window.JB_BUTTON.base), cap:bakedGeo(window.JB_BUTTON.cap) } : null;
if (RBG) [RBG.base, RBG.cap].forEach(function(g){ var p = g.attributes.position, uv = new Float32Array(p.count * 2); for (var i = 0; i < p.count; i++){ uv[i * 2] = (p.getX(i) + 1) / 2; uv[i * 2 + 1] = (1 - p.getZ(i)) / 2; } g.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); });      // painted from straight above
function rbCap(c, text){
  if (c.capText === text) return; c.capText = text; var g = c.capC.getContext('2d'), lines = String(text).split('\n'), size = c.capSize || 62;
  g.fillStyle = c.capCol; g.fillRect(0, 0, 256, 256); g.fillStyle = c.capInk || '#FFFFFF'; g.textAlign = 'center'; g.textBaseline = 'middle';
  for (;;){ g.font = size + 'px ' + FONT; var w = 0; lines.forEach(function(l){ w = Math.max(w, g.measureText(l).width); }); if (w <= 172 || size <= 20) break; size -= 3; }
  lines.forEach(function(l, i){ g.fillText(l, 128, 130 + (i - (lines.length - 1) / 2) * size * 1.05); }); c.capT.needsUpdate = true;
}
function rbRing(c, f){                                       // f: how much of the ring is lit, 0 to 1
  var q = Math.round(clamp(f, 0, 1) * 60); if (c.ringQ === q) return; c.ringQ = q; var g = c.ringC.getContext('2d');
  g.fillStyle = '#050506'; g.fillRect(0, 0, 256, 256); g.lineWidth = 17; g.strokeStyle = '#7C7C80'; g.beginPath(); g.arc(128, 128, 118, 0, Math.PI * 2); g.stroke();
  if (q > 0){ g.strokeStyle = '#FFFFFF'; g.beginPath(); g.arc(128, 128, 118, -Math.PI / 2, -Math.PI / 2 + q / 60 * Math.PI * 2); g.stroke(); } c.ringT.needsUpdate = true;
}
function roundBtn(G, id, x, y, dia, text, name, col, wk, opt){
  var c = button(id, x, y, dia, dia, '', name, 0xFFFFFF), s = dia * SC / 2; c.wk = wk; c.m.visible = false; opt = opt || {};
  c.capC = mk(256, 256); c.capT = smoothTex(c.capC); c.capCol = col; c.capInk = opt.ink; c.capSize = opt.size; c.ringC = mk(256, 256); c.ringT = smoothTex(c.ringC);
  if (RBG){
    var base = new THREE.Mesh(RBG.base, new THREE.MeshPhongMaterial({ color:0x9A9A9A, map:c.ringT, emissive:0xffffff, emissiveMap:c.ringT, emissiveIntensity:0.6, shininess:12, specular:0x111111 })); base.scale.setScalar(s); base.position.set(LX(x), 0, LZ(y)); G.add(base);
    c.cap = new THREE.Mesh(RBG.cap, new THREE.MeshPhongMaterial({ color:0xA8A8A8, map:c.capT, emissive:0xffffff, emissiveMap:c.capT, emissiveIntensity:0.45, shininess:30, specular:0x222222 })); c.cap.scale.setScalar(s); c.cap.position.set(LX(x), 0, LZ(y)); G.add(c.cap);
    base.userData.noShadow = c.cap.userData.noShadow = true;
  }
  c.repaintFace = function(t){ if (t != null) rbCap(c, t); }; c.paintLit = NOP; c.hover = function(on){ c.hov = on; if (c.cap) c.cap.material.emissiveIntensity = on ? 0.7 : 0.45; };
  rbCap(c, text); rbRing(c, 0); WALLBTN.push(c); return c;
}
/* ---- the room screen, left of the jam buttons on each counter: what is loaded, the key, the tempo, and a picture of everything coming
   out of the room. One canvas feeds both counters' screens; it is redrawn about thirty times a second */
var RSC = { c:null, t:null, w:840, h:720, at:0, f:null, pk:[] };
function wallScreen(G){                                      // a plate like its neighbours (same height, same title strip), with the screen let into it
  if (!RSC.c){ RSC.c = mk(RSC.w, RSC.h); RSC.t = smoothTex(RSC.c); }
  var d = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.36), new THREE.MeshBasicMaterial({ map:RSC.t })); d.rotation.x = -Math.PI / 2; d.position.set(-0.49, 0.0012, 0.112); G.add(d);
}
function rscDraw(now){
  if (!RSC.c || now - RSC.at < 33) return; RSC.at = now; var g = RSC.c.getContext('2d'), W = RSC.w, H = RSC.h;
  g.fillStyle = '#050608'; g.fillRect(0, 0, W, H);
  g.textBaseline = 'alphabetic'; g.textAlign = 'left';
  g.fillStyle = '#FFE83C'; g.font = '84px "Pixel Game", "Merchant Copy", ui-monospace, monospace'; g.fillText((JAMNAME || 'New jam').toUpperCase(), 26, 92, W - 52);
  var key = RK.on ? NOTEN[RK.root] + ' ' + SCALES[RK.scale][0] : 'KEY OFF';
  g.font = '50px "Merchant Copy", ui-monospace, monospace'; g.fillStyle = RK.on ? '#FFFFFF' : '#6A6E76'; g.fillText(key.toUpperCase(), 26, 166);
  g.textAlign = 'right'; g.fillStyle = '#FFFFFF'; g.fillText((Math.round(M.bpm * 10) / 10) + ' BPM', W - 26, 166);
  var b = M.playing && typeof SEQ.visStep === 'number' && SEQ.visStep >= 0 ? (SEQ.visStep >> 2) & 3 : -1;      // four beat lights
  for (var i = 0; i < 4; i++){ g.fillStyle = i === b ? (i === 0 ? '#FF2A3C' : '#3BFF6A') : '#1E2026'; g.fillRect(26 + i * ((W - 52 + 12) / 4), 192, (W - 52 + 12) / 4 - 12, 16); }
  /* the visualiser: 40 bars across the room's whole output, low on the left, high on the right, each with a falling peak */
  var N = 32, x0 = 26, y1 = H - 22, hh = y1 - 236, bw = (W - 52) / N;
  if (AU.ready && AU.an){ if (!RSC.f){ RSC.f = new Uint8Array(AU.an.frequencyBinCount); AU.an.minDecibels = -84; AU.an.maxDecibels = -6; } AU.an.getByteFrequencyData(RSC.f); }      /* -6 dB at the top: a full mix sits in the green and yellow and only real peaks reach the red (the mixer's meters read this analyser's waveform, which these do not change) */
  for (i = 0; i < N; i++){
    var v = 0;
    if (RSC.f){ var lo = Math.floor(Math.pow(RSC.f.length, i / N)), hi = Math.max(lo + 1, Math.floor(Math.pow(RSC.f.length, (i + 1) / N))); for (var k = lo; k < hi && k < RSC.f.length; k++) v = Math.max(v, RSC.f[k]); v = Math.pow(v / 255, 1.6) * (0.82 + 0.3 * i / N); }      // a little tilt toward the highs, which carry less energy
    RSC.pk[i] = Math.max(v, (RSC.pk[i] || 0) - 0.02); var h = Math.round(v * hh), seg = 10;
    for (var y = 0; y < h; y += seg){ var q = y / hh; g.fillStyle = q > 0.82 ? '#FF2A3C' : q > 0.6 ? '#FFE15A' : '#3BFF6A'; g.fillRect(x0 + i * bw + 2, y1 - y - seg + 2, bw - 4, seg - 3); }
    if (RSC.pk[i] > 0.02){ g.fillStyle = '#FFFFFF'; g.fillRect(x0 + i * bw + 2, y1 - Math.round(RSC.pk[i] * hh) - 3, bw - 4, 3); }
  }
  RSC.t.needsUpdate = true;
}
function wallPanel(P){                                       // called by vidBooth with that booth's place
  var n = WALLBTN.length ? '2' : '', nx = -Math.sin(P.r), nz = -Math.cos(P.r), o = { H:HOST, X:LX, Z:LZ, D:DEV, F:FACE };
  var Y = new THREE.Group(); Y.position.set(P.x + nx * 0.565, 0.72 + BOOTHUP, P.z + nz * 0.565); Y.rotation.y = P.r + Math.PI; scene.add(Y);
  var G = new THREE.Group(); G.rotation.x = Math.PI / 2; Y.add(G);
  function plate(w, x, title){
    var c = mk(w * 1000, 420), g = c.getContext('2d'); g.fillStyle = '#0A0A0C'; g.fillRect(0, 0, c.width, 420); g.font = '22px ' + FONT; g.fillStyle = '#8E8E92'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(title, c.width / 2, 22);
    var t = smoothTex(c), box = new THREE.Mesh(new THREE.BoxGeometry(w, 0.04, 0.42), [0, 1, 2, 3, 4, 5].map(function(i){ return i === 2 ? new THREE.MeshPhongMaterial({ color:0x9A9A9A, map:t, emissive:0xffffff, emissiveMap:t, emissiveIntensity:0.4, shininess:8 }) : new THREE.MeshLambertMaterial({ color:0x0A0A0C }); }));
    box.position.set(x, -0.02, 0.09); box.userData.noShadow = true; G.add(box);
  }
  plate(0.44, -0.49, 'NOW PLAYING'); plate(0.5, 0, 'JAM CONTROLZ'); plate(0.26, 0.4, 'ROOM KEY'); wallScreen(G);
  G.position.x = 0.09;      /* the three plates together run from -0.71 to 0.53: shifted so they sit in the middle of the counter */
  HOST = G; LX = function(u){ return u * SC; }; LZ = function(u){ return u * SC; }; DEV = 'wall';
  roundBtn(G, 'wallclear' + n, -58, 10, 74, 'CLEAR', 'Clear all patterns', '#E53A3A', 'clear');
  roundBtn(G, 'walldef' + n, 58, 10, 74, 'DEMO', 'Load the demo jam', '#177D32', 'def');
  roundBtn(G, 'wallexp' + n, -58, 88, 74, 'EXPORT', 'Save the whole room to a file: patterns, sounds and settings', '#1E46A6', 'exp');
  roundBtn(G, 'wallload' + n, 58, 88, 74, 'LOAD', 'Load a saved jam', '#56239E', 'load');
  roundBtn(G, 'wallkey' + n, 200, 10, 74, 'KEY\nOFF', 'Room key', '#D9590B', 'key', { size:54 });
  roundBtn(G, 'wallnote' + n, 171, 90, 54, 'C', 'Room key note', '#2B2D33', 'note', { size:76 });
  roundBtn(G, 'wallscale' + n, 229, 90, 54, 'Minor', 'Room key scale', '#2B2D33', 'scale', { size:50 });
  HOST = o.H; LX = o.X; LZ = o.Z; DEV = o.D; FACE = o.F;
}
/* everything a pattern is, on every machine, as one small file (the Tape's loop is audio and stays out) */
var JAMSKIP = { 'jambutek-studio-stickers-v1':1 };      // the stickers on the walls belong to the room, not to a jam or a scene
//                                           // nothing is left out now: the video synths and the roof switch travel with a jam too
/* A jam file is the whole room: every machine's patterns, sounds and settings, the mixer, the effects, both video synths and the roof switch.
   It is the same text each machine already saves for itself, gathered under `state`. The older pattern-only fields stay in the
   file too, so a file still means something to an older copy of the room. The Tape's recorded loop is audio and is left out. */
function roomState(){
  var cap = {}, hook = storeHook; storeHook = function(k, v){ cap[k] = v; };                 // ask every machine to save now, and catch what it writes instead of sending it on
  try { SAVENOW.forEach(function(f){ try { f(); } catch (e) {} }); } finally { storeHook = hook; }
  cap['jambutek-studio-video-v1'] = JSON.stringify({ v:1, src:VID.src });                          // which synth is on the roof, or none
  var out = {}; Object.keys(cap).forEach(function(k){ if (RESTORE[k] && !JAMSKIP[k] && typeof cap[k] === 'string') out[k] = cap[k]; }); return out;
}
RESTORE[SAVE_KEY] = function(){                                // the drum machine, from a jam file
  var s = JSON.parse(store(SAVE_KEY) || 'null'); if (!s || !Array.isArray(s.PAT) || s.PAT.length !== 16) return;
  if (!s.PAT.every(function(p){ return p && Array.isArray(p.vars) && p.vars.length === 8 && Array.isArray(p.tones) && p.vars.every(function(v){ return v && v.st && v.st.length === 11 && v.sb && v.acc; }); })) return;
  PAT = s.PAT; if (typeof s.bpm === 'number') setBpm(clamp(s.bpm, 40, 300)); M.pat = clamp(s.pat | 0, 0, 15); M.nextPat = -1; M.varSel = [0]; M.varIx = 0; M.editVar = 0; trVars(s);
  if (Array.isArray(s.mutes) && s.mutes.length === 11) M.mutes = s.mutes; M.fxOn = !!s.fxOn; M.fillOn = !!s.fillOn;
  Object.keys(s.kn || {}).forEach(function(id){ var c = CT[id], v = s.kn[id]; if (c && !c.dev && typeof v === 'number'){ c.v = clamp(v, 0, 1); try { onCtl(c); } catch (e) {} c.show(); } });
  trsLoad(s); M.fillEdit = false;
  applyMix(); dispDirty = true;
};
function roomLoad(st){
  var keys = Object.keys(st).filter(function(k){ return k.indexOf('jambutek-studio-') === 0 && RESTORE[k] && !JAMSKIP[k] && typeof st[k] === 'string' && st[k].length < 600000; }), n = 0;
  SNAKES.forEach(function(s){ s.SN.view = 0; s.SN.copy = null; });
  if (typeof st[RKKEY] !== 'string' && RK.on){ RK.on = 0; rkShow(); rkSave(); }                    // a jam made without a room key plays in its own keys                                 // a loaded jam opens on page A of every Snake
  if (typeof st[SCKEY] !== 'string' && typeof scWipe === 'function') scWipe();                       // a jam saved without scenes does not inherit the last jam's
  keys.sort(function(a, b){ return (a === SAVE_KEY ? 0 : 1) - (b === SAVE_KEY ? 0 : 1); });         // the drum machine first: it carries the tempo
  keys.forEach(function(k){ REMOTE[k] = st[k]; try { RESTORE[k](); n++; } catch (e) {} finally { delete REMOTE[k]; } store(k, st[k]); });      // apply it here, then keep it and pass it to everyone in the room
  return n;
}
function patternDump(){ return { app:'jambutek-studio', kind:'jam', v:2, made:new Date().toISOString(), bpm:M.bpm, drums:PAT, synth:{ seq:MF.seq, seqLen:MF.seqLen }, bass:{ seqs:BS.seqs }, ambi:{ seq:AM.seq },
  snakes:SNAKES.map(function(s){ return { root:s.SN.root, scale:s.SN.scale, swing:s.SN.swing, out:s.SN.out, lanes:s.SN.pgs[0] }; }), state:roomState() }; }
function patternExport(){
  try { var a = document.createElement('a'), d = new Date(), p2 = function(n){ return (n < 10 ? '0' : '') + n; };
    a.href = URL.createObjectURL(new Blob([JSON.stringify(patternDump())], { type:'application/json' })); a.download = 'jambutek-studio-jam-' + d.getFullYear() + p2(d.getMonth() + 1) + p2(d.getDate()) + '-' + p2(d.getHours()) + p2(d.getMinutes()) + '.json';
    document.body.appendChild(a); a.click(); setTimeout(function(){ URL.revokeObjectURL(a.href); a.remove(); }, 1500); toast('Jam saved to ' + a.download + ' · patterns, sounds, settings and visuals', 3600);
  } catch (e) { toast('Could not save the jam file'); }
}
/* saved jams */
var JAMS = Array.isArray(window.JB_JAMS) ? window.JB_JAMS : [];             // the first one is the starter: it is also DEF, what the room opens with
/* ---- the strip beside the mute button: which jam is loaded, the room key, the tempo, and four dots that step with the beat ---- */
var JAMKEY = 'jambutek-studio-jam-v1', JAMNAME = '', nowEl = document.getElementById('now'), nowSig = '', nowBeat = -2;
function jamNameLoad(){ var n = ''; try { var s = JSON.parse(store(JAMKEY) || 'null'); if (s && typeof s.name === 'string') n = s.name.slice(0, 40); } catch (e) {}
  if (!n){ var mine = null; try { mine = localStorage.getItem(SAVE_KEY); } catch (e) {} n = mine ? 'Your jam' : (DEF && DEF.name) || 'New jam'; } JAMNAME = n; }      // nothing recorded: a first visit is the starter, anything else is your own work
function jamNamed(n){ JAMNAME = String(n || 'Jam').replace(/\.json$/i, '').slice(0, 40); store(JAMKEY, JSON.stringify({ v:1, name:JAMNAME })); }
jamNameLoad(); RESTORE[JAMKEY] = jamNameLoad;
function nowUpdate(){
  rscDraw(performance.now());
  if (!nowEl) return; var key = RK.on ? NOTEN[RK.root] + ' ' + SCALES[RK.scale][0] : 'off', sig = JAMNAME + '|' + key + '|' + M.bpm;
  if (sig !== nowSig){ nowSig = sig; nowEl.querySelector('.jam').textContent = JAMNAME; nowEl.querySelector('.key').textContent = key; nowEl.querySelector('.key').parentNode.classList.toggle('dim', !RK.on); nowEl.querySelector('.bpm').textContent = (Math.round(M.bpm * 10) / 10) + ' BPM'; }
  var b = M.playing && typeof SEQ.visStep === 'number' && SEQ.visStep >= 0 ? (SEQ.visStep >> 2) & 3 : -1;
  if (b !== nowBeat){ nowBeat = b; var d = nowEl.querySelectorAll('.beat i'); for (var i = 0; i < d.length; i++) d[i].className = i === b ? 'on' : ''; nowEl.classList.toggle('run', b >= 0); }
}
function loadJam(J, name){                                       // a jam is the same shape as the factory set, so it goes in the same way
  if (!J || typeof J !== 'object' || !Array.isArray(J.drums) || J.drums.length !== 16){ toast('That file is not a Jambutek Studio jam'); return false; }
  if (typeof MP !== 'undefined' && MP) MP.inputAt = performance.now();      /* loading a jam is this player's own doing, so it goes to the whole room: a file takes longer to pick than the few seconds a click counts for */
  if (J.state && typeof J.state === 'object'){ var got = 0; try { got = roomLoad(J.state); } catch (e) {} if (got){ jamNamed(name || J.name); toast((name || 'Jam') + ' loaded · patterns, sounds and settings', 3200); return true; } }      // a full jam: everything comes back
  var keep = DEF; DEF = J; try { allPatterns(true, name || 'Jam'); } catch (e) { DEF = keep; toast('Could not load that jam'); return false; } DEF = keep; jamNamed(name || J.name); return true;
}
var jamEl = null;
function jamClose(){ if (jamEl){ jamEl.remove(); jamEl = null; } }
function jamOpen(){
  jamClose(); if (typeof releaseLock === 'function') releaseLock();
  var el = jamEl = document.createElement('div'); el.id = 'jamUI';                                  // styled in the page head, in the menu's faces and colours
  var box = document.createElement('div'); box.className = 'box'; box.style.zoom = Math.min(1, (window.innerWidth - 16) / 700, (window.innerHeight - 16) / 640).toFixed(3);
  var h = document.createElement('h2'); h.textContent = 'Load a jam'; box.appendChild(h);
  var p = document.createElement('p'); p.textContent = 'Replaces the patterns, sounds, settings and visuals on every machine' + (typeof MPON !== 'undefined' && MPON ? ', for everyone in the room.' : '.'); box.appendChild(p);
  function row(label, sub, fn, cls){ var b = document.createElement('button'); b.type = 'button'; b.className = cls || '';
    var a = document.createElement('span'); a.textContent = label; var c = document.createElement('i'); c.textContent = sub; b.appendChild(a); b.appendChild(c); b.addEventListener('click', fn); box.appendChild(b); return b; }
  JAMS.forEach(function(j){ row(j.name, (j === DEF ? 'starter - ' : '') + j.bpm + ' BPM', function(){ if (loadJam(j, j.name)) jamClose(); }); });
  var inp = document.createElement('input'); inp.type = 'file'; inp.accept = '.json,application/json'; inp.style.display = 'none'; box.appendChild(inp);
  inp.addEventListener('change', function(){ var f = inp.files && inp.files[0]; if (!f) return; var r = new FileReader(); r.onload = function(){ var J = null; try { J = JSON.parse(r.result); } catch (e) {} if (J && J.app === 'jambutek-studio' && loadJam(J, f.name.replace(/\.json$/i, ''))) jamClose(); else if (!J || J.app !== 'jambutek-studio') toast('That file is not a Jambutek Studio jam'); }; r.readAsText(f); });
  row('From a file', 'an exported jam', function(){ inp.click(); }, 'file');
  row('Cancel', 'Esc', jamClose, 'cancel');
  el.appendChild(box); el.addEventListener('click', function(e){ if (e.target === el) jamClose(); }); document.body.appendChild(el);
}
document.addEventListener('keydown', function(e){ if (jamEl && e.key === 'Escape'){ e.stopPropagation(); jamClose(); } }, true);
function allPatterns(def, jam){
  // drum machine
  if (def) PAT = presets(); else { PAT = []; while (PAT.length < 16) PAT.push(mkPat('INIT PTN', 0)); }
  if (def && DEF && DEF.bpm) setBpm(DEF.bpm);
  M.nextPat = -1; M.varSel = [0]; M.varIx = 0; M.editVar = 0; dispDirty = true; saveSoon();
  // synth, bass, Ambi step sequences
  if (def) mfSeqDefault(); else { MF.seq = []; for (var i = 0; i < 64; i++) MF.seq.push(null); } MF.dirty = true; mfSaveSoon();
  var db = DEF && DEF.bass, da = DEF && DEF.ambi;
  BS.seqs = def ? (jam && db && Array.isArray(db.seqs) && db.seqs.length === 4 && db.seqs.every(function(q){ return Array.isArray(q) && q.length; }) ? defCopy(db.seqs) : JSON.parse(BSSEQ0)) : BS.seqs.map(function(){ return [{ rest:1 }]; }); BS.dirty = true; bsSaveSoon();
  AM.seq = def ? (jam && da && Array.isArray(da.seq) && da.seq.length === 16 ? da.seq.slice() : AMSEQ0.slice()) : [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null]; AM.dirty = true; amSaveSoon();
  // every Snake, and the Tape's loop
  SNAKES.forEach(function(s){ s.patterns(def, jam); });
  var L = TP.loop; if (TP.rec){ try { TP.rec.stop(); } catch (e) {} TP.rec = null; } if (L.src){ try { L.src.stop(); L.src.disconnect(); } catch (e) {} L.src = null; } L.st = 0; L.buf = null; L.rev = null;
  toast(jam ? jam + ' loaded on every machine' : def ? 'Default patterns restored on every machine' : 'All patterns cleared on every machine', 2600);
}
/* The room key: one note and scale for every Snake at once, so nobody drifts out of key. Off by default, and a jam that was saved
   without it switches it off when loaded, so jams play as they were made. Shared with the room like any other setting. */
var RKKEY = 'jambutek-studio-key-v1';
function rkShow(){ SNAKES.forEach(function(s){ s.SN.dirty = true; }); }
function rkSave(){ store(RKKEY, JSON.stringify({ v:1, on:RK.on, root:RK.root, scale:RK.scale })); }
function rkLoad(){ var on = 0, root = 0, scale = 2; try { var s = JSON.parse(store(RKKEY) || 'null'); if (s && s.v === 1){ on = s.on ? 1 : 0; root = clamp(s.root | 0, 0, 11); scale = clamp(s.scale | 0, 0, SCALES.length - 1); } } catch (e) {} RK.on = on; RK.root = root; RK.scale = scale; rkShow(); }
rkLoad(); RESTORE[RKKEY] = rkLoad; SAVENOW.push(rkSave);
function wallLabel(c){ if (c.wk === 'key') return 'Room key is ' + (RK.on ? 'on: every sequencer plays in ' + NOTEN[RK.root] + ' ' + SCALES[RK.scale][0] : 'off: each sequencer keeps its own key') + ' · click';
  if (c.wk === 'note') return 'Room key note: ' + NOTEN[RK.root] + ' · click for the next'; if (c.wk === 'scale') return 'Room key scale: ' + SCALES[RK.scale][0] + ' · click for the next';
  return c.name + (c.wk === 'exp' ? ' · click' : ' · press and hold'); }
function wallPress(c){ unlock(); c.down = 1;
  if (c.wk === 'key' || c.wk === 'note' || c.wk === 'scale'){ if (c.wk === 'key') RK.on = RK.on ? 0 : 1; else if (c.wk === 'note') RK.root = (RK.root + 1) % 12; else RK.scale = (RK.scale + 1) % SCALES.length;
    rkShow(); rkSave(); toast('Room key ' + (RK.on ? 'on · ' : 'off · ') + NOTEN[RK.root] + ' ' + SCALES[RK.scale][0], 2200); return; } if (c.wk === 'exp'){ patternExport(); return; } WALL.c = c; WALL.t0 = performance.now(); WALL.done = false; }
function wallRelease(c){ c.down = 0; if (WALL.c === c){ if (!WALL.done) toast('Keep holding to ' + (c.wk === 'clear' ? 'clear everything' : c.wk === 'load' ? 'open the jam list' : 'load the demo jam')); WALL.c = null; } }
DEVH.wall = { label:wallLabel, press:wallPress, release:wallRelease, ctl:NOP, turn:NOP };
function wallUpdate(now){
  nowUpdate();
  WALLBTN.forEach(function(c){
    var ring = c.down ? 1 : 0, wk = c.wk;
    if (wk === 'clear' || wk === 'def' || wk === 'load'){ ring = 0;
      if (WALL.c === c){ var k = (now - WALL.t0) / WALLHOLD; if (k >= 1 && !WALL.done){ WALL.done = true; if (wk === 'load'){ WALL.c = null; c.down = false; jamOpen(); } else if (wk === 'def' && JAMS[0] && JAMS[0].state) loadJam(JAMS[0], JAMS[0].name); else { if (wk === 'clear' && window.JB_INIT){ try { roomLoad(window.JB_INIT); } catch (e) {} }      /* CLEAR: first every machine goes back to how it starts (vendor/init.json: every knob at its default, sequencer knobs at noon), then the patterns are emptied */
        allPatterns(wk === 'def'); jamNamed(wk === 'def' ? (DEF && DEF.name) || 'Demo jam' : 'New jam'); } } ring = WALL.done ? 1 : clamp(k, 0, 1); } }      // held: the ring fills clockwise from the top
    else if (wk === 'key'){ ring = RK.on || c.down ? 1 : 0; var kc = RK.on ? '#177D32' : '#D9590B'; if (c.capCol !== kc){ c.capCol = kc; c.capText = null; } rbCap(c, 'KEY\n' + (RK.on ? 'ON' : 'OFF')); }      // green when the room key is on, deep orange when it is off
    else if (wk === 'note') rbCap(c, NOTEN[RK.root]); else if (wk === 'scale') rbCap(c, SCALES[RK.scale][0]);
    rbRing(c, ring); if (c.cap){ var ty = c.down ? -0.007 : 0; if (c.cap.position.y !== ty) c.cap.position.y = ty; }
  });
}
