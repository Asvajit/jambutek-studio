
/* ================= two wall buttons to the left of the drum machine =================
   CLEAR ALL wipes every pattern on every machine; DEFAULTS puts the factory patterns back.
   Both have to be held down for a moment, so a stray click does nothing. */
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
FACE = { bg:'#3A6FD8', fg:'#FFFFFF' }; button('wallexp', 0, 86, 216, 44, 'EXPORT PATTERNS', 'Export patterns to a file', 0x7AB8FF).mat.color.setHex(0x8A8A8A);
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
function allPatterns(def){
  // drum machine
  if (def) PAT = presets(); else { PAT = []; while (PAT.length < 16) PAT.push(mkPat('INIT PTN', 0)); }
  if (def && DEF && DEF.bpm) setBpm(DEF.bpm);
  M.nextPat = -1; M.varSel = [0]; M.varIx = 0; M.editVar = 0; dispDirty = true; saveSoon();
  // synth, bass, Ambi step sequences
  if (def) mfSeqDefault(); else { MF.seq = []; for (var i = 0; i < 64; i++) MF.seq.push(null); } MF.dirty = true; mfSaveSoon();
  BS.seqs = def ? JSON.parse(BSSEQ0) : BS.seqs.map(function(){ return [{ rest:1 }]; }); BS.dirty = true; bsSaveSoon();
  AM.seq = def ? AMSEQ0.slice() : [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null]; AM.dirty = true; amSaveSoon();
  // every Snake, and the Tape's loop
  SNAKES.forEach(function(s){ s.patterns(def); });
  var L = TP.loop; if (TP.rec){ try { TP.rec.stop(); } catch (e) {} TP.rec = null; } if (L.src){ try { L.src.stop(); L.src.disconnect(); } catch (e) {} L.src = null; } L.st = 0; L.buf = null; L.rev = null;
  toast(def ? 'Default patterns restored on every machine' : 'All patterns cleared on every machine', 2600);
}
function wallLabel(c){ return c.name + (c.id === 'wallexp' ? ' · click' : ' · press and hold'); }
function wallPress(c){ unlock(); c.down = 1; if (c.id === 'wallexp'){ patternExport(); return; } WALL.c = c; WALL.t0 = performance.now(); WALL.done = false; }
function wallRelease(c){ c.down = 0; if (WALL.c === c){ if (!WALL.done) toast('Keep holding to ' + (c.id === 'wallclear' ? 'clear everything' : 'restore the defaults')); WALL.c = null; } }
DEVH.wall = { label:wallLabel, press:wallPress, release:wallRelease, ctl:NOP, turn:NOP };
function wallUpdate(now){
  ['wallclear', 'walldef'].forEach(function(id){
    var c = CT[id], L = 0.12, h = WALL.c === c;
    if (h){ var k = (now - WALL.t0) / WALLHOLD; if (k >= 1 && !WALL.done){ WALL.done = true; allPatterns(id === 'walldef'); } L = WALL.done ? 1 : 0.25 + 0.6 * clamp(k, 0, 1) * (Math.floor(now / 90) % 2 ? 1 : 0.7); }
    if (L !== c.lit){ c.lit = L; c.paintLit(); } var ty = c.y0 - (c.down ? 0.004 : 0); if (c.m.position.y !== ty) c.m.position.y = ty;
  });
  var x = CT.wallexp, xl = x.down ? 1 : 0.15; if (xl !== x.lit){ x.lit = xl; x.paintLit(); } var xy = x.y0 - (x.down ? 0.004 : 0); if (x.m.position.y !== xy) x.m.position.y = xy;
}
