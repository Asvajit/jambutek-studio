
/* ================= the wall panel to the left of the drum machine =================
   CLEAR ALL wipes every pattern on every machine; DEFAULTS puts the factory patterns back. Both have to be held down for a
   moment, so a stray click does nothing. EXPORT saves everything to a file; LOAD JAM opens a list of saved jams (the ones that
   ship with the room in vendor/jams.json, or any exported file) and puts one on every machine. */
var WALLHOLD = 1300, WALL = { t0:0, c:null, done:false };
var WALLG = new THREE.Group(); WALLG.position.set(-4.225, 1.42, ROOM.z0 + 0.024); WALLG.rotation.x = Math.PI / 2; scene.add(WALLG);
(function(){
  var c = mk(500, 360), g = c.getContext('2d'); g.fillStyle = '#1B1D22'; g.fillRect(0, 0, 500, 360); g.strokeStyle = '#F2C230'; g.lineWidth = 6; g.strokeRect(7, 7, 486, 346);
  g.font = 'bold 26px "Helvetica Neue", Helvetica, Arial, sans-serif'; g.fillStyle = '#D8D8D8'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('PATTERNS  ·  PRESS AND HOLD', 250, 40);
  var t = smoothTex(c), box = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.04, 0.36), [0, 1, 2, 3, 4, 5].map(function(i){ return i === 2 ? new THREE.MeshPhongMaterial({ color:0x9A9A9A, map:t, emissive:0xffffff, emissiveMap:t, emissiveIntensity:0.4, shininess:8 }) : new THREE.MeshLambertMaterial({ color:0x1B1D22 }); }));
  box.position.set(0, -0.02, 0.06); box.userData.noShadow = true; WALLG.add(box);
})();
HOST = WALLG; LX = function(u){ return u * SC; }; LZ = function(u){ return u * SC; }; DEV = 'wall';
FACE = { bg:'#D8262E', fg:'#FFFFFF' }; button('wallclear', -58, 14, 100, 62, 'CLEAR\nALL', 'Clear all patterns', 0xFF2A3C).mat.color.setHex(0x8A8A8A);
FACE = { bg:'#2E9E55', fg:'#FFFFFF' }; button('walldef', 58, 14, 100, 62, 'DEFAULT\nPATTERNS', 'Default patterns', 0x3BFF6A).mat.color.setHex(0x8A8A8A);
FACE = { bg:'#3A6FD8', fg:'#FFFFFF' }; button('wallexp', -58, 86, 100, 44, 'EXPORT\nPATTERNS', 'Export patterns to a file', 0x7AB8FF).mat.color.setHex(0x8A8A8A);
FACE = { bg:'#8A3FD0', fg:'#FFFFFF' }; button('wallload', 58, 86, 100, 44, 'LOAD\nJAM', 'Load a saved jam', 0xC08AFF).mat.color.setHex(0x8A8A8A);
HOST = TRG; LX = lx; LZ = lz; DEV = null; FACE = { bg:'#C9C7C0', fg:'#0B0B0D' };
/* everything a pattern is, on every machine, as one small file (the Tape's loop is audio and stays out) */
function patternDump(){ return { app:'jambutek-studio', kind:'patterns', v:1, made:new Date().toISOString(), bpm:M.bpm, drums:PAT, synth:{ seq:MF.seq, seqLen:MF.seqLen }, bass:{ seqs:BS.seqs }, ambi:{ seq:AM.seq },
  snakes:SNAKES.map(function(s){ return { root:s.SN.root, scale:s.SN.scale, swing:s.SN.swing, out:s.SN.out, lanes:s.SN.lanes }; }) }; }
function patternExport(){
  try { var a = document.createElement('a'), d = new Date(), p2 = function(n){ return (n < 10 ? '0' : '') + n; };
    a.href = URL.createObjectURL(new Blob([JSON.stringify(patternDump())], { type:'application/json' })); a.download = 'jambutek-studio-patterns-' + d.getFullYear() + p2(d.getMonth() + 1) + p2(d.getDate()) + '-' + p2(d.getHours()) + p2(d.getMinutes()) + '.json';
    document.body.appendChild(a); a.click(); setTimeout(function(){ URL.revokeObjectURL(a.href); a.remove(); }, 1500); toast('Patterns saved to ' + a.download, 3200);
  } catch (e) { toast('Could not save the patterns file'); }
}
/* saved jams */
var JAMS = (function(){ var J = window.JB_JAMS; if (!J || !Array.isArray(J.jams)) return []; return J.jams.map(function(j){ var o = {}; Object.keys(j).forEach(function(k){ o[k] = j[k]; }); o.drums = j.drums.map(function(i){ return J.pats[i]; }); return o; }); })();
function loadJam(J, name){                                       // a jam is the same shape as the factory set, so it goes in the same way
  if (!J || typeof J !== 'object' || !Array.isArray(J.drums) || J.drums.length !== 16){ toast('That file is not a Jambutek Studio jam'); return false; }
  var keep = DEF; DEF = J; try { allPatterns(true, name || 'Jam'); } catch (e) { DEF = keep; toast('Could not load that jam'); return false; } DEF = keep; return true;
}
var jamEl = null;
function jamClose(){ if (jamEl){ jamEl.remove(); jamEl = null; } }
function jamOpen(){
  jamClose(); if (typeof releaseLock === 'function') releaseLock();
  var el = jamEl = document.createElement('div'); el.style.cssText = 'position:fixed;inset:0;z-index:60;display:flex;align-items:center;justify-content:center;background:rgba(4,6,10,.72);font:14px/1.4 ui-monospace,Menlo,Consolas,monospace;color:#E6E6E2';
  var box = document.createElement('div'); box.style.cssText = 'width:min(420px,92vw);max-height:84vh;overflow:auto;background:#14161B;border:2px solid #C08AFF;border-radius:10px;padding:16px 16px 12px';
  var h = document.createElement('div'); h.textContent = 'LOAD A JAM'; h.style.cssText = 'font-weight:700;letter-spacing:.08em;margin-bottom:4px'; box.appendChild(h);
  var p = document.createElement('div'); p.textContent = 'Replaces the patterns on every machine' + (typeof MPON !== 'undefined' && MPON ? ', for everyone in the room.' : '.'); p.style.cssText = 'color:#9A9CA4;font-size:12px;margin-bottom:10px'; box.appendChild(p);
  function row(label, sub, fn, col){ var b = document.createElement('button'); b.type = 'button'; b.style.cssText = 'display:flex;justify-content:space-between;gap:12px;width:100%;margin:5px 0;padding:10px 12px;background:' + (col || '#23262C') + ';color:#F0F0EC;border:1px solid #3A3D46;border-radius:7px;font:inherit;cursor:pointer;text-align:left';
    var a = document.createElement('span'); a.textContent = label; a.style.fontWeight = '700'; var c = document.createElement('span'); c.textContent = sub; c.style.color = '#9A9CA4'; b.appendChild(a); b.appendChild(c); b.addEventListener('click', fn); box.appendChild(b); return b; }
  JAMS.forEach(function(j){ row(j.name, j.when + ' · ' + j.bpm + ' BPM', function(){ if (loadJam(j, j.name)) jamClose(); }); });
  var inp = document.createElement('input'); inp.type = 'file'; inp.accept = '.json,application/json'; inp.style.display = 'none'; box.appendChild(inp);
  inp.addEventListener('change', function(){ var f = inp.files && inp.files[0]; if (!f) return; var r = new FileReader(); r.onload = function(){ var J = null; try { J = JSON.parse(r.result); } catch (e) {} if (J && J.app === 'jambutek-studio' && loadJam(J, f.name.replace(/\.json$/i, ''))) jamClose(); else if (!J || J.app !== 'jambutek-studio') toast('That file is not a Jambutek Studio jam'); }; r.readAsText(f); });
  row('From a file…', 'an exported .json', function(){ inp.click(); }, '#2A2140');
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
function wallLabel(c){ return c.name + (c.id === 'wallexp' || c.id === 'wallload' ? ' · click' : ' · press and hold'); }
function wallPress(c){ unlock(); c.down = 1; if (c.id === 'wallexp'){ patternExport(); return; } if (c.id === 'wallload'){ jamOpen(); return; } WALL.c = c; WALL.t0 = performance.now(); WALL.done = false; }
function wallRelease(c){ c.down = 0; if (WALL.c === c){ if (!WALL.done) toast('Keep holding to ' + (c.id === 'wallclear' ? 'clear everything' : 'restore the defaults')); WALL.c = null; } }
DEVH.wall = { label:wallLabel, press:wallPress, release:wallRelease, ctl:NOP, turn:NOP };
function wallUpdate(now){
  ['wallclear', 'walldef'].forEach(function(id){
    var c = CT[id], L = 0.12, h = WALL.c === c;
    if (h){ var k = (now - WALL.t0) / WALLHOLD; if (k >= 1 && !WALL.done){ WALL.done = true; allPatterns(id === 'walldef'); } L = WALL.done ? 1 : 0.25 + 0.6 * clamp(k, 0, 1) * (Math.floor(now / 90) % 2 ? 1 : 0.7); }
    if (L !== c.lit){ c.lit = L; c.paintLit(); } var ty = c.y0 - (c.down ? 0.004 : 0); if (c.m.position.y !== ty) c.m.position.y = ty;
  });
  ['wallexp', 'wallload'].forEach(function(id){ var x = CT[id], xl = x.down ? 1 : 0.15; if (xl !== x.lit){ x.lit = xl; x.paintLit(); } var xy = x.y0 - (x.down ? 0.004 : 0); if (x.m.position.y !== xy) x.m.position.y = xy; });
}
