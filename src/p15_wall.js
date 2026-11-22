
/* ================= the jam panels, one on the front of each video booth counter =================
   Two identical sets, in opposite corners, so one is always near. CLEAR ALL wipes every pattern on every machine; DEFAULT JAM puts
   the starter jam back, sounds and settings included. Both have to be held down for a moment, so a stray click does nothing.
   EXPORT JAM saves the whole room to a file; LOAD JAM opens the list of jams that ship with the room (vendor/jams/), or takes a file. */
var WALLHOLD = 1300, WALL = { t0:0, c:null, done:false }, WALLBTN = [];
function wallPanel(P){                                       // called by vidBooth with that booth's place
  var n = WALLBTN.length ? '2' : '', nx = -Math.sin(P.r), nz = -Math.cos(P.r), o = { H:HOST, X:LX, Z:LZ, D:DEV, F:FACE };
  var Y = new THREE.Group(); Y.position.set(P.x + nx * 0.565, 0.72, P.z + nz * 0.565); Y.rotation.y = P.r + Math.PI; scene.add(Y);
  var G = new THREE.Group(); G.rotation.x = Math.PI / 2; Y.add(G);
  var c = mk(500, 360), g = c.getContext('2d'); g.fillStyle = '#1B1D22'; g.fillRect(0, 0, 500, 360); g.strokeStyle = '#F2C230'; g.lineWidth = 6; g.strokeRect(7, 7, 486, 346);
  g.font = 'bold 26px "Helvetica Neue", Helvetica, Arial, sans-serif'; g.fillStyle = '#D8D8D8'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('JAMS  ·  SAVE AND LOAD', 250, 40);
  var t = smoothTex(c), box = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.04, 0.36), [0, 1, 2, 3, 4, 5].map(function(i){ return i === 2 ? new THREE.MeshPhongMaterial({ color:0x9A9A9A, map:t, emissive:0xffffff, emissiveMap:t, emissiveIntensity:0.4, shininess:8 }) : new THREE.MeshLambertMaterial({ color:0x1B1D22 }); }));
  box.position.set(0, -0.02, 0.06); box.userData.noShadow = true; G.add(box);
  HOST = G; LX = function(u){ return u * SC; }; LZ = function(u){ return u * SC; }; DEV = 'wall';
  var b;
  FACE = { bg:'#D8262E', fg:'#FFFFFF' }; b = button('wallclear' + n, -58, 14, 100, 62, 'CLEAR\nALL', 'Clear all patterns', 0xFF2A3C); b.wk = 'clear'; WALLBTN.push(b);
  FACE = { bg:'#2E9E55', fg:'#FFFFFF' }; b = button('walldef' + n, 58, 14, 100, 62, 'DEFAULT\nJAM', 'Back to the starter jam', 0x3BFF6A); b.wk = 'def'; WALLBTN.push(b);
  FACE = { bg:'#3A6FD8', fg:'#FFFFFF' }; b = button('wallexp' + n, -58, 86, 100, 44, 'EXPORT\nJAM', 'Save the whole room to a file: patterns, sounds and settings', 0x7AB8FF); b.wk = 'exp'; WALLBTN.push(b);
  FACE = { bg:'#8A3FD0', fg:'#FFFFFF' }; b = button('wallload' + n, 58, 86, 100, 44, 'LOAD\nJAM', 'Load a saved jam', 0xC08AFF); b.wk = 'load'; WALLBTN.push(b);
  WALLBTN.slice(-4).forEach(function(x){ x.mat.color.setHex(0x8A8A8A); });
  // the room key, on its own small plate beside the jam buttons
  var c2 = mk(260, 360), g2 = c2.getContext('2d'); g2.fillStyle = '#1B1D22'; g2.fillRect(0, 0, 260, 360); g2.strokeStyle = '#3BFF6A'; g2.lineWidth = 6; g2.strokeRect(7, 7, 246, 346); g2.font = 'bold 26px "Helvetica Neue", Helvetica, Arial, sans-serif'; g2.fillStyle = '#D8D8D8'; g2.textAlign = 'center'; g2.textBaseline = 'middle'; g2.fillText('ROOM KEY', 130, 40);
  var t2 = smoothTex(c2), box2 = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.04, 0.36), [0, 1, 2, 3, 4, 5].map(function(i){ return i === 2 ? new THREE.MeshPhongMaterial({ color:0x9A9A9A, map:t2, emissive:0xffffff, emissiveMap:t2, emissiveIntensity:0.4, shininess:8 }) : new THREE.MeshLambertMaterial({ color:0x1B1D22 }); }));
  box2.position.set(0.4, -0.02, 0.06); box2.userData.noShadow = true; G.add(box2);
  FACE = { bg:'#2A2D33', fg:'#FFFFFF' }; b = button('wallkey' + n, 200, 14, 108, 62, 'OFF', 'Room key', 0x3BFF6A); b.wk = 'key'; WALLBTN.push(b);
  FACE = { bg:'#C9C7C0', fg:'#0B0B0D' }; b = button('wallnote' + n, 171, 86, 50, 44, 'C', 'Room key note', 0xFFFFFF); b.wk = 'note'; WALLBTN.push(b); b = button('wallscale' + n, 228, 86, 56, 44, 'Minor', 'Room key scale', 0xFFFFFF); b.wk = 'scale'; WALLBTN.push(b);
  HOST = o.H; LX = o.X; LZ = o.Z; DEV = o.D; FACE = o.F;
}
/* everything a pattern is, on every machine, as one small file (the Tape's loop is audio and stays out) */
var JAMSKIP = {};                                           // nothing is left out now: the video synths and the roof switch travel with a jam too
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
  applyMix(); dispDirty = true;
};
function roomLoad(st){
  var keys = Object.keys(st).filter(function(k){ return k.indexOf('jambutek-studio-') === 0 && RESTORE[k] && !JAMSKIP[k] && typeof st[k] === 'string' && st[k].length < 600000; }), n = 0;
  SNAKES.forEach(function(s){ s.SN.view = 0; s.SN.copy = null; });
  if (typeof st[RKKEY] !== 'string' && RK.on){ RK.on = 0; rkShow(); rkSave(); }                    // a jam made without a room key plays in its own keys                                 // a loaded jam opens on page A of every Snake
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
  if (!nowEl) return; var key = RK.on ? NOTEN[RK.root] + ' ' + SCALES[RK.scale][0] : 'off', sig = JAMNAME + '|' + key + '|' + M.bpm;
  if (sig !== nowSig){ nowSig = sig; nowEl.querySelector('.jam').textContent = JAMNAME; nowEl.querySelector('.key').textContent = key; nowEl.querySelector('.key').parentNode.classList.toggle('dim', !RK.on); nowEl.querySelector('.bpm').textContent = (Math.round(M.bpm * 10) / 10) + ' BPM'; }
  var b = M.playing && typeof SEQ.visStep === 'number' && SEQ.visStep >= 0 ? (SEQ.visStep >> 2) & 3 : -1;
  if (b !== nowBeat){ nowBeat = b; var d = nowEl.querySelectorAll('.beat i'); for (var i = 0; i < d.length; i++) d[i].className = i === b ? 'on' : ''; nowEl.classList.toggle('run', b >= 0); }
}
function loadJam(J, name){                                       // a jam is the same shape as the factory set, so it goes in the same way
  if (!J || typeof J !== 'object' || !Array.isArray(J.drums) || J.drums.length !== 16){ toast('That file is not a Jambutek Studio jam'); return false; }
  if (J.state && typeof J.state === 'object'){ var got = 0; try { got = roomLoad(J.state); } catch (e) {} if (got){ jamNamed(name || J.name); toast((name || 'Jam') + ' loaded · patterns, sounds and settings', 3200); return true; } }      // a full jam: everything comes back
  var keep = DEF; DEF = J; try { allPatterns(true, name || 'Jam'); } catch (e) { DEF = keep; toast('Could not load that jam'); return false; } DEF = keep; jamNamed(name || J.name); return true;
}
var jamEl = null;
function jamClose(){ if (jamEl){ jamEl.remove(); jamEl = null; } }
function jamOpen(){
  jamClose(); if (typeof releaseLock === 'function') releaseLock();
  var el = jamEl = document.createElement('div'); el.style.cssText = 'position:fixed;inset:0;z-index:60;display:flex;align-items:center;justify-content:center;background:rgba(4,6,10,.72);font:14px/1.4 ui-monospace,Menlo,Consolas,monospace;color:#E6E6E2';
  var box = document.createElement('div'); box.style.cssText = 'width:min(420px,92vw);max-height:84vh;overflow:auto;background:#14161B;border:2px solid #C08AFF;border-radius:10px;padding:16px 16px 12px';
  var h = document.createElement('div'); h.textContent = 'LOAD A JAM'; h.style.cssText = 'font-weight:700;letter-spacing:.08em;margin-bottom:4px'; box.appendChild(h);
  var p = document.createElement('div'); p.textContent = 'Replaces the patterns, sounds, settings and visuals on every machine' + (typeof MPON !== 'undefined' && MPON ? ', for everyone in the room.' : '.'); p.style.cssText = 'color:#9A9CA4;font-size:12px;margin-bottom:10px'; box.appendChild(p);
  function row(label, sub, fn, col){ var b = document.createElement('button'); b.type = 'button'; b.style.cssText = 'display:flex;justify-content:space-between;gap:12px;width:100%;margin:5px 0;padding:10px 12px;background:' + (col || '#23262C') + ';color:#F0F0EC;border:1px solid #3A3D46;border-radius:7px;font:inherit;cursor:pointer;text-align:left';
    var a = document.createElement('span'); a.textContent = label; a.style.fontWeight = '700'; var c = document.createElement('span'); c.textContent = sub; c.style.color = '#9A9CA4'; b.appendChild(a); b.appendChild(c); b.addEventListener('click', fn); box.appendChild(b); return b; }
  JAMS.forEach(function(j){ row(j.name, (j === DEF ? 'starter · ' : '') + j.bpm + ' BPM', function(){ if (loadJam(j, j.name)) jamClose(); }); });
  var inp = document.createElement('input'); inp.type = 'file'; inp.accept = '.json,application/json'; inp.style.display = 'none'; box.appendChild(inp);
  inp.addEventListener('change', function(){ var f = inp.files && inp.files[0]; if (!f) return; var r = new FileReader(); r.onload = function(){ var J = null; try { J = JSON.parse(r.result); } catch (e) {} if (J && J.app === 'jambutek-studio' && loadJam(J, f.name.replace(/\.json$/i, ''))) jamClose(); else if (!J || J.app !== 'jambutek-studio') toast('That file is not a Jambutek Studio jam'); }; r.readAsText(f); });
  row('From a file…', 'an exported jam', function(){ inp.click(); }, '#2A2140');
  row('Cancel', 'Esc', jamClose, '#1B1D22');
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
  return c.name + (c.wk === 'exp' || c.wk === 'load' ? ' · click' : ' · press and hold'); }
function wallPress(c){ unlock(); c.down = 1;
  if (c.wk === 'key' || c.wk === 'note' || c.wk === 'scale'){ if (c.wk === 'key') RK.on = RK.on ? 0 : 1; else if (c.wk === 'note') RK.root = (RK.root + 1) % 12; else RK.scale = (RK.scale + 1) % SCALES.length;
    rkShow(); rkSave(); toast('Room key ' + (RK.on ? 'on · ' : 'off · ') + NOTEN[RK.root] + ' ' + SCALES[RK.scale][0], 2200); return; } if (c.wk === 'exp'){ patternExport(); return; } if (c.wk === 'load'){ jamOpen(); return; } WALL.c = c; WALL.t0 = performance.now(); WALL.done = false; }
function wallRelease(c){ c.down = 0; if (WALL.c === c){ if (!WALL.done) toast('Keep holding to ' + (c.wk === 'clear' ? 'clear everything' : 'load the starter jam')); WALL.c = null; } }
DEVH.wall = { label:wallLabel, press:wallPress, release:wallRelease, ctl:NOP, turn:NOP };
function wallUpdate(now){
  nowUpdate();
  WALLBTN.forEach(function(c){
    var L = c.down ? 1 : 0.15;
    if (c.wk === 'key' || c.wk === 'note' || c.wk === 'scale'){ var tx = c.wk === 'key' ? (RK.on ? 'ON' : 'OFF') : c.wk === 'note' ? NOTEN[RK.root] : SCALES[RK.scale][0]; if (c.rkT !== tx){ c.rkT = tx; c.repaintFace(tx); } if (c.wk === 'key') L = RK.on ? 0.95 : 0.08; }
    if (c.wk === 'clear' || c.wk === 'def'){ L = 0.12;
      if (WALL.c === c){ var k = (now - WALL.t0) / WALLHOLD; if (k >= 1 && !WALL.done){ WALL.done = true; if (c.wk === 'def' && JAMS[0] && JAMS[0].state) loadJam(JAMS[0], JAMS[0].name); else { allPatterns(c.wk === 'def'); jamNamed(c.wk === 'def' ? (DEF && DEF.name) || 'Default jam' : 'New jam'); } } L = WALL.done ? 1 : 0.25 + 0.6 * clamp(k, 0, 1) * (Math.floor(now / 90) % 2 ? 1 : 0.7); } }
    if (L !== c.lit){ c.lit = L; c.paintLit(); } var ty = c.y0 - (c.down ? 0.004 : 0); if (c.m.position.y !== ty) c.m.position.y = ty;
  });
}
