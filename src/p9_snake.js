
/* ================= the Snake: a 4 x 4 grid sequencer after Maxime Dangles' MDD SnAkE (Max for Live) =================
   Notes (each step has a pitch knob and an on/off button), velocities and a probability lane each walk the same 16 cells along a "snake shape",
   each with its own direction, speed, length and shift. Scales and the 14 shapes are read from the device itself.
   There is one beside every synth, set to play it by default; OUT can point it at any other. The drum machine clocks them all. */
var SCALES = [["Chromatic",[0,1,2,3,4,5,6,7,8,9,10,11]],["Major",[0,2,4,5,7,9,11]],["Minor",[0,2,3,5,7,9,11]],["Dorian",[0,2,3,5,7,9,10]],["Mixolydian",[0,2,4,5,7,9,10]],["Lydian",[0,2,4,6,7,9,11]],["Phrygian",[0,1,3,5,7,8,10]],["Locrian",[0,1,3,5,6,8,10]],["WholeTone",[0,2,4,6,8,10]],["HalfWholeDim",[0,1,3,4,6,7,9,10]],["WholeHalfDim",[0,2,3,5,6,8,9,11]],["MinorBlues",[0,3,5,6,7,10]],["MinorPentatonic",[0,3,5,7,10]],["MajorPentatonic",[0,2,4,7,9]],["HarmonicMinor",[0,2,3,5,7,8,11]],["HarmonicMajor",[0,2,4,5,7,8,11]],["Dorian#4",[0,2,3,6,7,9,10]],["PhrygianDominant",[0,1,4,5,7,8,10]],["MelodicMinor",[0,2,3,5,7,9,11]],["LydianAugmented",[0,2,4,6,8,9,11]],["LydianDominant",[0,2,4,6,7,9,10]],["SuperLocrian",[0,1,3,4,6,8,10]],["8ToneSpanish",[0,1,3,4,5,6,8,10]],["Bhairav",[0,1,4,5,7,8,11]],["HungarianMinor",[0,2,3,6,7,8,11]],["Hirajoshi",[0,2,3,7,8]],["InSen",[0,1,5,7,10]],["Iwato",[0,1,5,6,10]],["Kumoi",[0,2,3,7,9]],["PelogSelisir",[0,1,3,7,8]],["PelogTembung",[0,1,5,7,8]],["Messiaen3",[0,2,3,4,6,7,8,10,11]],["Messiaen4",[0,1,2,5,6,7,8,11]],["Messiaen5",[0,1,5,6,7,11]],["Messiaen6",[0,2,4,5,6,8,10,11]],["Messiaen7",[0,1,2,3,5,6,7,8,9,11]]];
function scaleQ(semi, iv){ var o = Math.floor(semi / 12), r = semi - o * 12, best = 0; for (var i = 0; i < iv.length; i++) if (iv[i] <= r + 0.001) best = iv[i]; return o * 12 + best; }
function scaleDeg(n, iv){ var L = iv.length, o = Math.floor(n / L); return o * 12 + iv[n - o * L]; }
var SNSHAPE = ['1 2 3 4 5 6 7 8 9 10 11 12 13 14 15 16', '1 5 9 13 2 6 10 14 3 7 11 15 4 8 12 16', '1 8 9 16 2 7 10 15 3 6 11 14 4 5 12 13', '1 2 3 4 8 7 6 5 9 10 11 12 16 15 14 13', '4 5 12 13 3 6 11 14 2 7 10 15 1 8 9 16', '4 3 2 1 5 6 7 8 12 11 10 9 13 14 15 16', '4 8 12 16 3 7 11 15 2 6 10 14 1 5 9 13',
  '13 14 15 16 9 10 11 12 5 6 7 8 1 2 3 4', '1 2 3 4 12 13 14 5 11 16 15 6 10 9 8 7', '7 8 9 10 6 15 16 11 5 14 13 12 4 3 2 1', '1 2 6 7 3 5 8 13 4 9 12 14 10 11 15 16', '10 11 15 16 4 9 12 14 3 5 8 13 1 2 6 7', '4 3 2 1 5 14 13 12 6 15 16 11 7 8 9 10', '10 9 8 7 11 16 15 6 12 13 14 5 1 2 3 4']
  .map(function(s){ var ord = s.split(' ').map(Number), path = []; for (var k = 1; k <= 16; k++) path.push(ord.indexOf(k)); return path; });   // path[step] = cell
var SNW = 300, SND = 190, SNH = 1.38, SNTILT = 0.95, SNZ = -1.22;
function sx(u){ return (u - SNW / 2) * SC; }
function sz(u){ return (u - SND / 2) * SC; }
var SNLN = ['NOTES', 'GATES', 'VELOCITY', 'PROBABILITY'], SNCOL = [0x90F0A8, 0xFFE15A, 0xFF8A2A, 0x4AA8FF], SNDIR = ['forwards', 'backwards', 'fore/back', 'back/fore', 'random'], SNSPD = [[0.5, '1/32'], [1, '1/16'], [2, '1/8'], [4, '1/4'], [8, '1/2']], SNOUT = ['Off', 'Synth', 'Bass', 'Blip', 'Ambi', 'Tape', 'Shru'];
var SNGX = [178, 210, 242, 274], SNGY = [36, 78, 120, 162];
function snDefaults(){
  var notes = [0, 2, 3, 5, 7, 8, 12, 12, 15, 15, 17, 19, 20, 22, 24, 27].map(function(n){ return n + 12; });
  function lane(vals, sp){ return { vals:vals, dir:0, speed:sp, len:16, shift:0, shape:0 }; }
  return { root:0, scale:2, out:0, swing:0, page:0, lanes:[lane(notes, 1), lane([1, 1, 0, 1, 1, 0, 1, 1, 1, 0, 1, 1, 0, 1, 1, 0], 1), lane([100, 64, 64, 90, 64, 64, 100, 64, 80, 64, 100, 64, 64, 90, 64, 64], 1), lane([127, 127, 127, 127, 127, 127, 127, 127, 127, 127, 127, 127, 127, 127, 127, 127], 1)] };
}
var snC = mk(1200, 760), snTex = null;
function paintSN(){
  var g = snC.getContext('2d'); g.setTransform(4, 0, 0, 4, 0, 0);
  g.fillStyle = '#17191E'; g.fillRect(0, 0, SNW, SND);
  for (var i = 0; i < 3000; i++){ g.fillStyle = 'rgba(' + (Math.random() < .5 ? '0,0,0' : '120,130,150') + ',' + rnd(.02, .07) + ')'; g.fillRect(Math.random() * SNW, Math.random() * SND, .5, .3); }
  function T(s, x, y, size, col, anton, al){ g.font = anton ? size + 'px ' + FONT : 'bold ' + size + 'px "Helvetica Neue", Helvetica, Arial, sans-serif'; g.fillStyle = col || '#E6E6E2'; g.textAlign = al || 'center'; g.textBaseline = 'middle'; g.fillText(s, x, y); }
  function box(x0, y0, x1, y1){ g.fillStyle = '#22252B'; g.fillRect(x0, y0, x1 - x0, y1 - y0); }
  box(4, 14, 78, 186); box(82, 14, 154, 186); box(158, 14, 296, 186);
  T('SNAKE', 5, 7, 7.5, '#90F0A8', true, 'left'); T('after MDD SnAkE by Maxime Dangles', 296, 7.5, 4, '#9A9CA0', false, 'right');
  T('FUNDAMENTAL', 22, 131, 3.6); T('SCALE', 59, 131, 3.6); T('OUT', 12, 172, 4.2, '#E6E6E2', false, 'left'); ['OFF', 'SYN', 'BASS', 'BLIP', 'AMBI', 'TAPE', 'SHRU'].forEach(function(s, k){ T(s, 24.5 + k * 8, 181.5, 2.6, '#B8B8B4'); });
  T('STEPS', 100, 113, 3.6); T('SHIFT', 136, 113, 3.6); T('SWING', 100, 149, 3.6); T('SNAKE SHAPE', 136, 149, 3.6);
  SNGY.forEach(function(y, r){ SNGX.forEach(function(x, c){ g.strokeStyle = 'rgba(216,216,216,.35)'; g.lineWidth = 0.4; g.beginPath(); g.arc(x, y - 5, 9.4, Math.PI * 0.75, Math.PI * 0.25); g.stroke(); T(String(r * 4 + c + 1), x - 13.2, y + 12, 3.2, '#7C7E84'); }); });
  g.setTransform(1, 0, 0, 1, 0, 0); if (snTex) snTex.needsUpdate = true;
}
paintSN(); snTex = smoothTex(snC);
if (document.fonts && document.fonts.load) document.fonts.load('20px Anton').then(paintSN).catch(function(){});
function snNoteName(n){ return NOTEN[n % 12] + (Math.floor(n / 12) - 1); }
function snCellAt(L, k){
  var n = L.len, i = L.dir === 0 ? k % n : L.dir === 1 ? n - 1 - (k % n) : L.dir === 4 ? (Math.random() * n) | 0 : (function(){ var per = Math.max(1, 2 * n - 2), q = k % per, f = q < n ? q : per - q; return L.dir === 2 ? f : n - 1 - f; })();
  return SNSHAPE[L.shape][(i + L.shift) % 16];
}
function snDice(n){ var x = Math.sin(n * 12.9898 + 78.233) * 43758.5453; return x - Math.floor(x); }
function makeSnake(K, HP, DEFOUT){
var DK = 'sn' + K, PX = 'sn' + K + '_';
var SNY = new THREE.Group(); SNY.position.set(HP.x, SNH, SNZ); scene.add(SNY);
var SNG = new THREE.Group(); SNG.rotation.x = SNTILT; SNY.add(SNG);
var SN = snDefaults(); SN.out = DEFOUT; SN.cell = [0, 0, 0, 0]; SN.vis = []; SN.cv = 0; SN.msgA = ''; SN.msgB = ''; SN.msgUntil = 0; SN.dirty = true; SN.run = false;
var snSaveT = null; function snSaveNow(){ store(('jambutek-studio-snake-v3-' + K), JSON.stringify({ v:1, root:SN.root, scale:SN.scale, out:SN.out, swing:SN.swing, lanes:SN.lanes })); } function snSaveSoon(){ clearTimeout(snSaveT); snSaveT = setTimeout(snSaveNow, saveMs(900)); }
function snRestore(){ try { var s = JSON.parse(store(('jambutek-studio-snake-v3-' + K)) || 'null'); if (!s || s.v !== 1 || !Array.isArray(s.lanes) || s.lanes.length !== 4 || !s.lanes.every(function(l){ return l && Array.isArray(l.vals) && l.vals.length === 16; })) return;
  SN.lanes = s.lanes; SN.root = clamp(s.root | 0, 0, 11); SN.scale = clamp(s.scale | 0, 0, SCALES.length - 1); SN.out = clamp(s.out | 0, 0, 6); if (SN.page === 1) SN.page = 0; SN.swing = clamp(+s.swing || 0, 0, 1); } catch (e) {} } snRestore();
var SNLED = [], snDispC = mk(272, 112), snDispT = canvasTex(snDispC); snDispT.minFilter = THREE.LinearFilter; snDispT.magFilter = THREE.LinearFilter;
(function(){
  var W2 = SNW * SC, D2 = SND * SC, TH = 0.04;
  var top = new THREE.Mesh(new THREE.PlaneGeometry(W2, D2), new THREE.MeshPhongMaterial({ color:0x8C8C8C, map:snTex, emissive:0xffffff, emissiveMap:snTex, emissiveIntensity:0.5, shininess:8, specular:0x0A0A0A })); top.rotation.x = -Math.PI / 2; SNG.add(top);
  var body = new THREE.Mesh(new THREE.BoxGeometry(W2 + 0.012, TH, D2 + 0.012), new THREE.MeshPhongMaterial({ color:0x1B1D22, shininess:30, specular:0x222222, flatShading:true })); body.position.y = -TH / 2 - 0.0015; SNG.add(body);
  var tray = new THREE.Mesh(new THREE.BoxGeometry(W2 + 0.08, 0.02, D2 + 0.05), woodMat); tray.position.y = -TH - 0.012; SNG.add(tray);
  var lip = new THREE.Mesh(new THREE.BoxGeometry(W2 + 0.08, 0.04, 0.02), woodMat); lip.position.set(0, -TH + 0.008, D2 / 2 + 0.03); SNG.add(lip);
  [-1, 1].forEach(function(s){ var post = new THREE.Mesh(new THREE.BoxGeometry(0.04, SNH - 0.06, 0.04), metalMat); post.position.set(s * 0.25, -(SNH - 0.06) / 2 - 0.06, -0.13); SNY.add(post); });
  devBody(SNY, DK);
  cable([[HP.x + 0.2, SNH - 0.12, SNZ - 0.1], [HP.x + 0.24, 1.25, SNZ + 0.02], [HP.x + 0.2, 1.02, HP.z - 0.24]], 0.005).material.color.setHex(0x8E0036);
  var geo = new THREE.CylinderGeometry(0.0034, 0.0034, 0.0025, 8);
  SNGY.forEach(function(y){ SNGX.forEach(function(x){ var m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color:0x15171C })); m.position.set(sx(x), 0.0015, sz(y - 17.5)); m.userData.noShadow = true; SNG.add(m); SNLED.push(m.material); }); });
  var d = new THREE.Mesh(new THREE.PlaneGeometry(68 * SC, 28 * SC), new THREE.MeshBasicMaterial({ map:snDispT })); d.rotation.x = -Math.PI / 2; d.position.set(sx(118), 0.002, sz(31)); d.userData.noShadow = true; d.userData.ia = 'trbody'; d.userData.dev = DK; SNG.add(d); solids.push(d);
})();
HOST = SNG; LX = sx; LZ = sz; DEV = DK; FACE = { bg:'#30343B', fg:'#F0F0EC' };
SNLN.forEach(function(n, i){ if (i === 1) return; button((PX + 'pg') + i, 41, 28 + [0, 0, 1, 2][i] * 27, 66, 18, n, n.charAt(0) + n.slice(1).toLowerCase() + ' lane', SNCOL[i]).pg = i; });
knob((PX + 'root'), 22, 116, 6.5, 'Fundamental', 0, { h:8 }).detents = 11; knob((PX + 'scale'), 59, 116, 7, 'Scale', 0, { h:8, endless:true, sides:14 });
button((PX + 'resetall'), 22, 150, 30, 12, 'RESET\nALL', 'Reset all lanes', 0xFFFFFF); button((PX + 'randall'), 59, 150, 30, 12, 'RANDOM\nALL', 'Randomise all lanes', 0xFFFFFF);
slide((PX + 'out'), 48.5, 172, 7, false, 'Out', 0.096);
button((PX + 'dir'), 118, 58, 64, 13, 'DIRECTION', 'Direction', 0xFFFFFF); button((PX + 'speed'), 118, 76, 64, 13, 'SPEED', 'Speed', 0xFFFFFF);
knob((PX + 'steps'), 100, 98, 6.5, 'Steps', 1, { h:8 }).detents = 15; knob((PX + 'shift'), 136, 98, 6.5, 'Shift', 0, { h:8 }).detents = 15;
knob((PX + 'swing'), 100, 134, 6.5, 'Swing', 0, { h:8 }); knob((PX + 'shape'), 136, 134, 7, 'Snake shape', 0, { h:8, endless:true, sides:14 });
button((PX + 'rand'), 100, 170, 30, 12, 'RANDOM', 'Randomise this lane', 0xFFFFFF); button((PX + 'reset'), 136, 170, 30, 12, 'RESET', 'Reset this lane', 0xFFFFFF);
for (var sni = 0; sni < 16; sni++){ (function(i){ var c = knob((PX + 'c') + i, SNGX[i % 4], SNGY[(i / 4) | 0] - 5, 6.4, 'Cell ' + (i + 1), 0, { h:9, sides:12 }); c.cell = i; })(sni); }
/* gates page: the 16 cell knobs give way to 16 on/off step buttons */
for (var sgi = 0; sgi < 16; sgi++){ (function(i){ var n0 = HOST.children.length, c = pad((PX + 'g') + i, SNGX[i % 4], SNGY[(i / 4) | 0] + 12, 21, 8.5, SNCOL[1], 'Step ' + (i + 1)); c.gate = i; c.hitM = HOST.children[n0 + 1]; })(sgi); }
function snShowCells(){ return; var gp = SN.page === 1; for (var i = 0; i < 16; i++){ var k = CT[(PX + 'c') + i], p = CT[(PX + 'g') + i]; k.g.visible = !gp; k.g.position.y = gp ? -9 : 0; p.m.visible = gp; p.m.position.y = gp ? p.y0 : -9; p.hitM.position.y = gp ? 0.009 : -9; p.gone = !gp; } }
HOST = TRG; LX = lx; LZ = lz; DEV = null; FACE = { bg:'#C9C7C0', fg:'#0B0B0D' };
function snSay(a, b, ms){ SN.msgA = a; SN.msgB = b == null ? '' : String(b); SN.msgUntil = performance.now() + (ms || 1500); SN.dirty = true; }
function snNote(v){ return 24 + SN.root + scaleQ(Math.round(v), SCALES[SN.scale][1]); }
function snCellTxt(p, v){ return p === 0 ? snNoteName(snNote(v)) : p === 1 ? (v ? 'On' : 'Off') : p === 3 ? Math.round(v / 1.27) + '%' : String(Math.round(v)); }
function snSync(){
  var L = SN.lanes[SN.page], mx = [83, 1, 127, 127][SN.page];
  for (var i = 0; i < 16; i++){ var c = CT[(PX + 'c') + i]; c.v = L.vals[i] / mx; c.detents = SN.page === 0 ? 83 : SN.page === 1 ? 1 : 0; c.step = 0.02; c.show(); }
  snShowCells();
  CT[PX + 'root'].v = SN.root / 11; CT[PX + 'root'].show(); CT[PX + 'steps'].v = (L.len - 1) / 15; CT[PX + 'steps'].show(); CT[PX + 'shift'].v = L.shift / 15; CT[PX + 'shift'].show(); CT[PX + 'swing'].v = SN.swing; CT[PX + 'swing'].show(); CT[PX + 'out'].set(SN.out); SN.dirty = true;
}
snSync();
function snLabel(c){
  var L = SN.lanes[SN.page], id = c.id;
  if (c.gate != null) return 'Step ' + (c.gate + 1) + ': ' + (SN.lanes[1].vals[c.gate] ? 'On' : 'Off') + ' · click to switch';
  if (c.cell != null) return SNLN[SN.page].charAt(0) + SNLN[SN.page].slice(1).toLowerCase() + ' ' + (c.cell + 1) + ': ' + snCellTxt(SN.page, L.vals[c.cell]) + ' · scroll or drag';
  switch (id){ case (PX + 'root'): return 'Fundamental ' + NOTEN[SN.root] + ' · scroll or drag'; case (PX + 'scale'): return 'Scale: ' + SCALES[SN.scale][0] + ' · scroll or drag'; case (PX + 'steps'): return 'Steps ' + L.len + ' · scroll or drag'; case (PX + 'shift'): return 'Shift ' + L.shift + ' · scroll or drag';
    case (PX + 'swing'): return 'Swing ' + Math.round(SN.swing * 100) + ' · scroll or drag'; case (PX + 'shape'): return 'Snake shape ' + (L.shape + 1) + ' · scroll or drag'; case (PX + 'dir'): return 'Direction: ' + SNDIR[L.dir] + ' · click'; case (PX + 'speed'): return 'Speed: ' + SNSPD[L.speed][1] + ' · click'; case (PX + 'out'): return 'Out: ' + SNOUT[SN.out] + ' · click'; }
  return c.name;
}
function snCtl(c){
  var L = SN.lanes[SN.page], id = c.id, v = c.v;
  if (c.cell != null){ var mx = [83, 1, 127, 127][SN.page]; L.vals[c.cell] = SN.page === 1 ? (v >= 0.5 ? 1 : 0) : Math.round(v * mx); snSay(SNLN[SN.page] + ' ' + (c.cell + 1), snCellTxt(SN.page, L.vals[c.cell])); }
  else if (id === (PX + 'root')){ SN.root = Math.round(v * 11); snSay('Fundamental', NOTEN[SN.root]); }
  else if (id === (PX + 'steps')){ L.len = 1 + Math.round(v * 15); snSay(SNLN[SN.page] + ' steps', L.len); }
  else if (id === (PX + 'shift')){ L.shift = Math.round(v * 15); snSay(SNLN[SN.page] + ' shift', L.shift); }
  else if (id === (PX + 'swing')){ SN.swing = v; snSay('Swing', Math.round(v * 100)); }
  snSaveSoon();
}
function snTurn(c, n){
  var L = SN.lanes[SN.page];
  if (c.id === (PX + 'scale')){ SN.scale = ((SN.scale + n) % SCALES.length + SCALES.length) % SCALES.length; snSay('Scale', SCALES[SN.scale][0]); }
  else if (c.id === (PX + 'shape')){ L.shape = ((L.shape + n) % 14 + 14) % 14; snSay(SNLN[SN.page] + ' shape', L.shape + 1); }
  snSaveSoon();
}
function snRandom(p){ var L = SN.lanes[p]; for (var i = 0; i < 16; i++) L.vals[i] = p === 0 ? 12 + ((Math.random() * 25) | 0) : p === 1 ? (Math.random() < 0.7 ? 1 : 0) : 30 + ((Math.random() * 98) | 0); }
function snPress(c){
  var id = c.id, L = SN.lanes[SN.page], D = snDefaults();
  if (c.gate != null){ var gv = SN.lanes[1].vals; gv[c.gate] = gv[c.gate] ? 0 : 1; c.down = 1; setTimeout(function(){ c.down = 0; }, 120); snSay('Step ' + (c.gate + 1), gv[c.gate] ? 'On' : 'Off'); snSaveSoon(); return; }
  if (c.pg != null){ SN.page = c.pg; snSync(); snSay(SNLN[c.pg], SN.page === 3 ? 'chance each step plays' : ''); return; }
  if (c.sw){ SN.out = (c.pos + 1) % 7; c.set(SN.out); SN.cv = 0; snSay('Out', SNOUT[SN.out] + (SN.out && !M.playing ? ' · start drums' : ''), 2200); snSaveSoon(); return; }
  switch (id){
    case (PX + 'dir'): L.dir = (L.dir + 1) % 5; snSay(SNLN[SN.page] + ' direction', SNDIR[L.dir]); break;
    case (PX + 'speed'): L.speed = (L.speed + 1) % 5; snSay(SNLN[SN.page] + ' speed', SNSPD[L.speed][1]); break;
    case (PX + 'rand'): snRandom(SN.page); snSync(); snSay(SNLN[SN.page], 'Random'); break;
    case (PX + 'reset'): SN.lanes[SN.page] = D.lanes[SN.page]; snSync(); snSay(SNLN[SN.page], 'Reset'); break;
    case (PX + 'randall'): for (var p = 0; p < 4; p++) snRandom(p); snSync(); snSay('All lanes', 'Random'); break;
    case (PX + 'resetall'): SN.lanes = D.lanes; snSync(); snSay('All lanes', 'Reset'); break;
  }
  snSaveSoon();
}
function clock(t, N, sd, sw){                       // one call per 16th from the drum machine
  var ev = [], swg = sw + SN.swing * 0.33;
  [1, 2, 3, 0].forEach(function(li, ord){ var L = SN.lanes[li], S = SNSPD[L.speed][0];
    for (var k = Math.ceil(N / S - 1e-6); k * S < N + 1 - 1e-6; k++){ var pos = k * S, r = Math.round(pos), on = Math.abs(pos - r) < 1e-6; ev.push([t + (pos - N) * sd + (on && r % 2 ? swg * sd : 0), ord, li, k, S]); } });
  ev.sort(function(a, b){ return a[0] - b[0] || a[1] - b[1]; });
  ev.forEach(function(e){
    var li = e[2], L = SN.lanes[li], cell = snCellAt(L, e[3]); SN.cell[li] = cell; SN.vis.push({ t:e[0], l:li, c:cell });
    if (li !== 0 || !SN.out || !SN.lanes[1].vals[cell] || snDice(N * 31 + e[3] * 7 + K * 131) * 127 >= SN.lanes[3].vals[SN.cell[3]]) return;   // the step's own button, then its dice roll
    var n = snNote(L.vals[cell]), vel = clamp(SN.lanes[2].vals[SN.cell[2]] / 127, 0.05, 1), dur = sd * e[4] * 0.6;
    var o = SN.out; if (o === 1){ if (mfAudio()) mfNoteAt(n + 12, vel, e[0], dur); } else if (o === 2){ if (bsAudio()) bsNoteAt(n, vel, e[0], dur); } else if (o === 3) mbNoteAt(n, vel, e[0], dur); else if (o === 4) amNoteAt(n + 12, vel, e[0], dur); else if (o === 5) tpNoteAt(n + 24, vel, e[0], dur); else shNoteAt(n + 12, vel, e[0], dur);
  });
}
function onStop(){ SN.vis = []; SN.cv = 0; }
function snPaintDisp(){
  var g = snDispC.getContext('2d'), now = performance.now(), L = SN.lanes[SN.page], a, b;
  g.fillStyle = '#04070A'; g.fillRect(0, 0, 272, 112); g.textBaseline = 'middle'; g.textAlign = 'left';
  if (now < SN.msgUntil){ a = SN.msgA; b = SN.msgB; } else { a = SNLN[SN.page] + '  ' + SNSPD[L.speed][1]; b = NOTEN[SN.root] + ' ' + SCALES[SN.scale][0]; }
  g.fillStyle = '#' + ('00000' + SNCOL[SN.page].toString(16)).slice(-6); g.font = 'bold 26px "Helvetica Neue", Helvetica, Arial, sans-serif'; g.fillText(a, 8, 24, 160);
  g.fillStyle = '#F2F2F2'; g.font = 'bold 30px "Helvetica Neue", Helvetica, Arial, sans-serif'; g.fillText(b, 8, 62, 160);
  g.fillStyle = '#8FA0B0'; g.font = 'bold 18px "Helvetica Neue", Helvetica, Arial, sans-serif'; g.fillText('→ ' + SNOUT[SN.out] + '   ' + SNDIR[L.dir], 8, 96, 160);
  // the snake's path through the grid for this lane
  var PA = SNSHAPE[L.shape], x0 = 184, y0 = 16, s = 26; g.strokeStyle = g.fillStyle = '#' + ('00000' + SNCOL[SN.page].toString(16)).slice(-6); g.lineWidth = 3; g.lineJoin = 'round'; g.beginPath();
  for (var k = 0; k < L.len; k++){ var cl = PA[(k + L.shift) % 16], x = x0 + (cl % 4) * s, y = y0 + ((cl / 4) | 0) * s; if (k) g.lineTo(x, y); else g.moveTo(x, y); } g.stroke();
  var c0 = PA[L.shift % 16]; g.beginPath(); g.arc(x0 + (c0 % 4) * s, y0 + ((c0 / 4) | 0) * s, 6, 0, 7); g.fill();
  snDispT.needsUpdate = true;
}
function update(now, dt){
  var t = ac ? ac.currentTime : 0, i; SN.run = M.playing;
  if (ac) SN.vis = SN.vis.filter(function(e){ if (e.t > t) return true; if (e.cv != null) SN.cv = e.cv; else { SN.vcell = SN.vcell || [-1, -1, -1, -1]; SN.vcell[e.l] = e.c; } return false; });
  var vc = M.playing && SN.vcell ? SN.vcell : [-1, -1, -1, -1], g = SN.lanes[1].vals, col = new THREE.Color();
  for (i = 0; i < 16; i++){ col.setHex(g[i] ? 0x1E3A2A : 0x15171C); for (var l = 0; l < 4; l++) if (l !== 1 && vc[l] === i) col.lerp(new THREE.Color(SNCOL[l]), l === SN.page ? 1 : 0.35); SNLED[i].color.copy(col); CT[(PX + 'c') + i].mat.color.setHex(g[i] ? 0x202226 : 0x121316); }
  for (i = 0; i < 16; i++){ var gp = CT[(PX + 'g') + i], gl = (g[i] ? 0.75 : 0) + (vc[0] === i ? 0.3 : 0); if (gl !== gp.lit){ gp.lit = gl; gp.col.copy(gp.base); if (vc[0] === i && !g[i]) gp.col.setHex(0xFFFFFF); gp.paintLit(); } var gy = gp.y0 - (gp.down ? 0.003 : 0); if (gp.m.position.y !== gy) gp.m.position.y = gy; }
  CTLIST.forEach(function(c){ if (c.dev !== DK || c.kind !== 'btn' || c.sw) return; var L = c.pg != null ? (SN.page === c.pg ? 1 : 0) : 0; if (c.down) L = Math.max(L, 0.8); if (L !== c.lit){ c.lit = L; c.paintLit(); } var ty = c.y0 - (c.down ? 0.003 : 0); if (c.m.position.y !== ty) c.m.position.y = ty; });
  if (now > SN.msgUntil && SN.msgA){ SN.msgA = ''; SN.dirty = true; }
  if (SN.dirty){ SN.dirty = false; snPaintDisp(); }
}
DEVH[DK] = { label:snLabel, press:snPress, release:NOP, ctl:snCtl, turn:snTurn };
function patterns(def){ SN.lanes = snDefaults().lanes; if (!def) SN.lanes[1].vals = SN.lanes[1].vals.map(function(){ return 0; }); snSync(); snSaveSoon(); }
RESTORE['jambutek-studio-snake-v3-' + K] = function(){ snRestore(); snSync(); }; SAVENOW.push(snSaveNow);
return { SN:SN, G:SNG, key:DK, patterns:patterns, x:HP.x, z:HP.z, clock:clock, onStop:onStop, update:update };
}
/* one Snake behind every synth, each wired to its own by default (OUT numbers: 1 Synth, 2 Bass, 3 Blip, 4 Ambi, 5 Tape, 6 Shru) */
var SNAKES = [[MFPOS, 1], [BSPOS, 2], [AMPOS, 4], [TPPOS, 5], [MBPOS, 3], [SHPOS, 6]].map(function(a, k){ return makeSnake(k, a[0], a[1]); });
function snClock(t, N, sd, sw){ SNAKES.forEach(function(s){ s.clock(t, N, sd, sw); }); }
function snOnStop(){ SNAKES.forEach(function(s){ s.onStop(); }); }
function snUpdate(now, dt){ SNAKES.forEach(function(s){ s.update(now, dt); }); }
function snCv(o){ var v = 0; SNAKES.forEach(function(s){ if (s.SN.out === o) v += s.SN.cv; }); return clamp(v, -1, 1); }
