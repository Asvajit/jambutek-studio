
/* ================= the Snake: a 4 x 4 grid sequencer after Maxime Dangles' MDD SnAkE (Max for Live) =================
   Notes (each step has a pitch knob and an on/off button), velocities, a probability lane and a custom lane that learns a knob on the synth each walk the same 16 cells along a "snake shape",
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
var SNHOLD = 1100;                 // ms to hold CUSTOM to forget what it learned
var SNLN = ['PITCH', 'GATES', 'VELOCITY', 'PROBABILITY', 'CUSTOM'], SNCOL = [0xFB1874, 0x3BFF6A, 0xFF6E3D, 0x3270E7, 0x54398E],      /* the SERPENT's lane colours: everything pink on the pitch lane wears the lane's colour on the others */ SNDEV = ['', 'mf', 'bs', 'mb', 'am', 'tp', 'sh', 'mc', 'zk', 'sc'], SNDIR = ['forwards', 'backwards', 'fore/back', 'back/fore', 'random'], SNSPD = [[0.5, '1/32'], [1, '1/16'], [2, '1/8'], [4, '1/4'], [8, '1/2']], SNOUT = ['Off', 'Synth', 'Bass', 'Blip', 'Ambi', 'Tape', 'Shru', 'Chord', 'Kit', 'Scratch'];
var SNGX = [178, 210, 242, 274], SNGY = [36, 78, 120, 162];
function snDefaults(){
  var notes = [0, 2, 3, 5, 7, 8, 12, 12, 15, 15, 17, 19, 20, 22, 24, 27].map(function(n){ return n + 12; });
  function lane(vals, sp){ return { vals:vals, dir:0, speed:sp, len:16, shift:0, shape:0 }; }
  return { root:0, scale:2, out:0, swing:0, page:0, lanes:[lane(notes, 1), lane([1, 1, 0, 1, 1, 0, 1, 1, 1, 0, 1, 1, 0, 1, 1, 0], 1), lane([100, 64, 64, 90, 64, 64, 100, 64, 80, 64, 100, 64, 64, 90, 64, 64], 1), lane([127, 127, 127, 127, 127, 127, 127, 127, 127, 127, 127, 127, 127, 127, 127, 127], 1), lane([64, 64, 64, 64, 64, 64, 64, 64, 64, 64, 64, 64, 64, 64, 64, 64], 1)] };
}
/* ---- the SERPENT plate: the designer's artwork (tools/make_serpent.py cuts the controls out of it). 2400 x 1520 design px = 300 x 190 mm ---- */
var SPFACES = trFaces('tr/serpent-faces.png');
var snC = mk(2400, 1520), snTex = null, snPlate = new Image();
function paintSN(){ var g = snC.getContext('2d'); if (snPlate.ok) g.drawImage(snPlate, 0, 0); else { g.fillStyle = '#282526'; g.fillRect(0, 0, 2400, 1520); } if (snTex) snTex.needsUpdate = true; }
snPlate.onload = function(){ snPlate.ok = true; paintSN(); }; snPlate.src = 'tr/serpent.jpg';
paintSN(); snTex = smoothTex(snC);
function spHex(n){ return '#' + ('00000' + (n >>> 0).toString(16)).slice(-6); }
function spOutCol(o){ var i = typeof MXN !== 'undefined' ? MXN.indexOf(String(SNOUT[o]).toUpperCase()) : -1; return i >= 0 ? MXCOL[i] : '#FF8A29'; }      /* a lit INST square wears its instrument's mixer colour */
/* faces whose colour or words change. The design is cut up once: each face's ink (its words or icon) becomes a white mask, tinted
   on demand, so a button can be grey or the lane's colour, white or lit, and show a progress bar under its words while it is held */
var SPMASK = {};
function spMask(r, bgref, ink){
  var key = r.join() + ink; if (SPMASK[key]) return SPMASK[key]; if (!SPFACES.ok) return null;
  var w = Math.round(r[2] - 10), h = Math.round(r[3] - 10), c = mk(w, h), g = c.getContext('2d'); g.drawImage(SPFACES, r[0] + 5, r[1] + 5, w, h, 0, 0, w, h);
  var d; try { d = g.getImageData(0, 0, w, h); } catch (e) { return (SPMASK[key] = c); }      /* a page opened from disk cannot read its own pictures: show the face as drawn */
  var a = d.data, q = new THREE.Color(ink), br = a[(2 * w + 2) * 4], bg = a[(2 * w + 2) * 4 + 1], bb = a[(2 * w + 2) * 4 + 2];      /* the face's own colour, read just inside its corner: a button drawn lit in the design still gives a clean mask */
  var ref = Math.abs(q.r * 255 - br) + Math.abs(q.g * 255 - bg) + Math.abs(q.b * 255 - bb) || 1;
  for (var i = 0; i < a.length; i += 4){ var t = clamp((Math.abs(a[i] - br) + Math.abs(a[i + 1] - bg) + Math.abs(a[i + 2] - bb)) / ref, 0, 1); a[i] = q.r * 255; a[i + 1] = q.g * 255; a[i + 2] = q.b * 255; a[i + 3] = t * 255; }
  g.putImageData(d, 0, 0); return (SPMASK[key] = c);
}
/* o: bgref (the face's colour in the design), ink, bg (its colour now); or text: [lines] in Pixel Game, with an optional black outline */
function spButton(id, r, name, o){
  var W2 = (r[2] + 5) * KB.px, D2 = (r[3] + 5) * KB.px, y0 = 0.003, k = Math.min(1.6, 240 / Math.max(r[2], r[3])), cv = mk(Math.round((r[2] + 5) * k), Math.round((r[3] + 5) * k)), t = trTex(cv);
  var topM = new THREE.MeshPhongMaterial({ color:0x4D4D4D, map:t, emissive:0xffffff, emissiveMap:t, emissiveIntensity:0.62, shininess:10, specular:0x080808 });
  var m = new THREE.Mesh(new THREE.BoxGeometry(W2, y0 * 2, D2), [TRSIDE, TRSIDE, topM, TRSIDE, TRSIDE, TRSIDE]); m.position.set(KB.x(r[0] + r[2] / 2), y0, KB.z(r[1] + r[3] / 2)); KB.host.add(m);
  var hit = new THREE.Mesh(new THREE.BoxGeometry(W2 + 0.004, 0.02, D2 + 0.004), HITMAT); hit.position.set(m.position.x, 0.008, m.position.z); KB.host.add(hit);
  var st = { bg:o.bg || o.bgref || '#FFFFFF', prog:0, text:o.text || null, key:'' };
  function paint(){
    var key = st.bg + '|' + st.prog + '|' + (st.text ? st.text.join('/') : '') + '|' + SPFACES.ok; if (key === st.key) return; st.key = key;
    var g = cv.getContext('2d'), W = cv.width, H = cv.height, e = 5 * k;
    g.fillStyle = '#000'; g.fillRect(0, 0, W, H); g.fillStyle = st.bg; g.fillRect(e, e, W - 2 * e, H - 2 * e);
    if (st.prog > 0){ g.fillStyle = '#E0193C'; g.fillRect(e, e, (W - 2 * e) * Math.min(1, st.prog), H - 2 * e); }
    if (st.text){
      var n = st.text.length, fs = (o.size || 54) * k * (n > 1 ? 0.78 : 1); g.font = Math.round(fs) + 'px "Pixel Game", monospace'; g.textAlign = 'center'; g.textBaseline = 'middle';
      st.text.forEach(function(s, i){ var y = H / 2 + (i - (n - 1) / 2) * fs * 0.95 + fs * 0.06;
        if (o.stroke){ g.lineWidth = fs * 0.14; g.strokeStyle = o.stroke; g.lineJoin = 'round'; g.strokeText(s, W / 2, y, W - 4 * e); }
        g.fillStyle = o.ink || '#000'; g.fillText(s, W / 2, y, W - 4 * e); });
    } else if (o.bgref){ var mk2 = spMask(r, o.bgref, o.ink || '#000000'); if (mk2) g.drawImage(mk2, e, e, W - 2 * e, H - 2 * e); }
    t.needsUpdate = true;
  }
  paint(); SPFACES.fn.push(function(){ st.key = ''; paint(); });
  if (document.fonts && document.fonts.load && st.text) document.fonts.load('40px "Pixel Game"').then(function(){ st.key = ''; paint(); }).catch(function(){});
  var c = { id:id, kind:'btn', name:name, m:m, mat:topM, lit:0, hov:false, down:0, y0:y0, sp:true,
    setBg:function(hex){ if (hex !== st.bg){ st.bg = hex; paint(); } },
    repaintFace:function(text, prog){ if (typeof text === 'string') st.text = text.split('\n'); if (prog != null) st.prog = prog; paint(); },
    paintLit:function(){ topM.emissiveIntensity = 0.62 + (c.hov ? 0.15 : 0) + (c.down ? 0.1 : 0); } };
  c.hover = function(on){ c.hov = on; c.paintLit(); };
  return reg(c, [m, hit]);
}
function snNoteName(n){ return NOTEN[n % 12] + (Math.floor(n / 12) - 1); }
function snCellAt(L, k){
  var n = L.len, i = L.dir === 0 ? k % n : L.dir === 1 ? n - 1 - (k % n) : L.dir === 4 ? (Math.random() * n) | 0 : (function(){ var per = Math.max(1, 2 * n - 2), q = k % per, f = q < n ? q : per - q; return L.dir === 2 ? f : n - 1 - f; })();
  return SNSHAPE[L.shape][(i + L.shift) % 16];
}
function snDice(n){ var x = Math.sin(n * 12.9898 + 78.233) * 43758.5453; return x - Math.floor(x); }
function makeSnake(K, HP, DEFOUT){
var DK = 'sn' + K, PX = 'sn' + K + '_';
function snDef(){ var d = snDefaults(), x = DEF && DEF.snakes && DEF.snakes[K];      // this Snake's own factory pattern, when the set has one
  if (x && Array.isArray(x.lanes) && (x.lanes.length === 4 || x.lanes.length === 5) && x.lanes.every(function(l){ return l && Array.isArray(l.vals) && l.vals.length === 16; })){ var cl = d.lanes[4]; d.lanes = defCopy(x.lanes); if (d.lanes.length < 5) d.lanes.push(cl); d.root = clamp(x.root | 0, 0, 11); d.scale = clamp(x.scale | 0, 0, SCALES.length - 1); d.swing = clamp(+x.swing || 0, 0, 1); }
  return d; }
var SNY = new THREE.Group(); SNY.position.set(HP.x - Math.sin(HP.r) * 0.5, SNH, HP.z - Math.cos(HP.r) * 0.5); SNY.rotation.y = HP.r; scene.add(SNY);   // on its shelf just behind the synth, towards the middle of the rig
var SNG = new THREE.Group(); SNG.rotation.x = SNTILT; SNY.add(SNG);
var SN = snDef(); SN.out = DEFOUT; SN.cc = null; SN.learn = false; SN.cell = [0, 0, 0, 0, 0]; SN.vis = []; SN.cv = 0; SN.msgA = ''; SN.msgB = ''; SN.msgUntil = 0; SN.dirty = true; SN.run = false;
/* Two pages, A and B, each a full set of lanes. `SN.lanes` always means the page being shown and edited, so everything written for one
   page keeps working. Playback reads the pages that are switched on: A alone (as it always was), B alone, or A then B, a bar each. */
SN.pgs = [SN.lanes, snDefaults().lanes]; SN.view = 0; SN.act = [1, 0]; SN.playPg = 0; SN.copy = null; delete SN.lanes;
Object.defineProperty(SN, 'lanes', { get:function(){ return SN.pgs[SN.view]; }, set:function(v){ SN.pgs[SN.view] = v; } });
function snLanesOk(a){ return Array.isArray(a) && a.length === 5 && a.every(function(l){ return l && Array.isArray(l.vals) && l.vals.length === 16; }); }
var snSaveT = null; function snSaveNow(){ store(('jambutek-studio-snake-v3-' + K), JSON.stringify({ v:1, root:SN.root, scale:SN.scale, out:SN.out, swing:SN.swing, lanes:SN.pgs[0], b:SN.pgs[1], act:SN.act, cc:SN.cc || null })); } function snSaveSoon(){ clearTimeout(snSaveT); snSaveT = setTimeout(snSaveNow, saveMs(900)); }
function snRestore(){ try { var s = JSON.parse(store(('jambutek-studio-snake-v3-' + K)) || 'null'); if (!s || s.v !== 1 || !Array.isArray(s.lanes) || (s.lanes.length !== 4 && s.lanes.length !== 5) || !s.lanes.every(function(l){ return l && Array.isArray(l.vals) && l.vals.length === 16; })) return;
  if (s.lanes.length < 5) s.lanes.push(snDefaults().lanes[4]); SN.cc = s.cc && typeof s.cc === 'object' && typeof s.cc.dev === 'string' ? s.cc : null;
  SN.pgs[0] = s.lanes; SN.pgs[1] = snLanesOk(s.b) ? s.b : snDefaults().lanes; SN.act = Array.isArray(s.act) && s.act.length === 2 ? [s.act[0] ? 1 : 0, s.act[1] ? 1 : 0] : [1, 0];      // a save from before there was a page B: A alone, exactly as it played
  SN.root = clamp(s.root | 0, 0, 11); SN.scale = clamp(s.scale | 0, 0, SCALES.length - 1); SN.out = clamp(s.out | 0, 0, 9); if (SN.page === 1) SN.page = 0; SN.swing = clamp(+s.swing || 0, 0, 1); } catch (e) {} } snRestore();
var SNLED = [], snDispC = mk(1028, 424), snDispT = canvasTex(snDispC); snDispT.minFilter = THREE.LinearFilter; snDispT.magFilter = THREE.LinearFilter;
var SPS = SC / 8, spx = function(px){ return sx(px / 8); }, spz = function(py){ return sz(py / 8); };          /* design px to the Snake's own frame */
(function(){
  var W2 = SNW * SC, D2 = SND * SC, TH = 0.04;
  var top = new THREE.Mesh(new THREE.PlaneGeometry(W2, D2), new THREE.MeshPhongMaterial({ color:0x8C8C8C, map:snTex, emissive:0xffffff, emissiveMap:snTex, emissiveIntensity:0.5, shininess:8, specular:0x0A0A0A })); top.rotation.x = -Math.PI / 2; SNG.add(top);
  var body = new THREE.Mesh(new THREE.BoxGeometry(W2 + 0.012, TH, D2 + 0.012), new THREE.MeshPhongMaterial({ color:0x282526, shininess:30, specular:0x222222, flatShading:true })); body.position.y = -TH / 2 - 0.0015; SNG.add(body);
  var tray = new THREE.Mesh(new THREE.BoxGeometry(W2 + 0.08, 0.02, D2 + 0.05), tableMat); tray.position.y = -TH - 0.012; SNG.add(tray);
  var lip = new THREE.Mesh(new THREE.BoxGeometry(W2 + 0.08, 0.04, 0.02), tableMat); lip.position.set(0, -TH + 0.008, D2 / 2 + 0.03); SNG.add(lip);
  devBody(SNY, DK);
  /* the 16 step lights: white, lit in the lane's colour as its snake passes */
  var geo = new THREE.CylinderGeometry(16 * SPS, 16 * SPS, 0.0022, 16), rim = new THREE.CylinderGeometry(19 * SPS, 19 * SPS, 0.0016, 16), rimM = new THREE.MeshBasicMaterial({ color:0x000000 });
  [154.6, 487.8, 825.7, 1160.1].forEach(function(y){ [1426, 1682.4, 1938.7, 2193.4].forEach(function(x){
    var r0 = new THREE.Mesh(rim, rimM); r0.position.set(spx(x + 16), 0.0008, spz(y + 16)); r0.userData.noShadow = true; SNG.add(r0);
    var m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color:0xF2F2F2 })); m.position.set(spx(x + 16), 0.0013, spz(y + 16)); m.userData.noShadow = true; SNG.add(m); SNLED.push(m.material); }); });
  var d = new THREE.Mesh(new THREE.PlaneGeometry(514 * SPS, 211.6 * SPS), new THREE.MeshBasicMaterial({ map:snDispT })); d.rotation.x = -Math.PI / 2; d.position.set(spx(941), 0.0006, spz(250.2)); d.userData.noShadow = true; d.userData.ia = 'trbody'; d.userData.dev = DK; SNG.add(d); solids.push(d);
})();
HOST = SNG; LX = sx; LZ = sz; DEV = DK;
var KB0 = KB; KB = { host:SNG, x:spx, z:spz, px:SPS, faces:SPFACES };
var SPGREY = '#4E4F50', SPPINK = '#FB1874';
/* the four lanes (the gates lane has no button now: its 16 on/off steps are the white buttons under the knobs) */
[[0, 146.3], [2, 284.3], [3, 426.3]].forEach(function(a){ var b = trButton((PX + 'pg') + a[0], [66.5, a[1], 525, 107], SNLN[a[0]].charAt(0) + SNLN[a[0]].slice(1).toLowerCase() + ' lane', 0xFFFFFF); b.pg = a[0]; b.lane = true; });
spButton((PX + 'pg') + 4, [66.5, 566.3, 525, 107], 'Custom lane', { bg:spHex(SNCOL[4]), text:['CUSTOM'], ink:'#FFFFFF', stroke:'#000000', size:88 }).pg = 4;
trKnob((PX + 'root'), 120.7, 794, 'serp', '#FFFFFF', '#000000', 'Root', 0).detents = 11;
trKnob((PX + 'scale'), 321.2, 794, 'serp', '#FFFFFF', '#000000', 'Scale', 0, { endless:true });
trKnob((PX + 'swing'), 525.3, 794, 'serp', '#FFFFFF', '#000000', 'Swing', 0);
spButton((PX + 'resetall'), [66.5, 960.5, 225, 95], 'Reset all lanes, A and B · hold', { bgref:'#FFFFFF', ink:'#000000' });
spButton((PX + 'randall'), [362.5, 960.5, 225, 95], 'Random all lanes · hold', { bgref:'#FFFFFF', ink:'#000000' });
/* INST: ten squares, the one lit is what this sequencer plays; the arrows step through them */
[181.0, 223.0, 263.6, 304.0, 343.0, 384.0, 423.0, 463.0, 505.3, 547.0].forEach(function(x, k){ spButton((PX + 'o') + k, [x, 1385.4, 30, 30], 'Inst: ' + SNOUT[k], { bg:'#000000' }).oi = k; });
trButton((PX + 'oprev'), [75.5, 1425.9, 32.2, 27.4], 'Inst: back', GRN).ostep = -1; trButton((PX + 'onext'), [114.1, 1425.9, 32.2, 27.4], 'Inst: next', GRN).ostep = 1;
/* the top row */
trButton((PX + 'msolo'), [660.5, 21.2, 134, 68], 'Solo this instrument in your own ears', 0x3A8BFF);
trKnob((PX + 'mmix'), 850.3, 55.3, 'serpS', '#FFFFFF', '#000000', 'Solo mix', 0);
trButton((PX + 'pa'), [1460.5, 21.2, 134, 68], 'Pattern A', GRN).ab = 0; spButton((PX + 'pta'), [1606.5, 21.2, 134, 68], 'Pattern A on / off', { text:['ON'], size:59 }).tg = 0;
trButton((PX + 'pb'), [1813.5, 21.2, 134, 68], 'Pattern B', GRN).ab = 1; spButton((PX + 'ptb'), [1959.5, 21.2, 134, 68], 'Pattern B on / off', { text:['OFF'], size:59 }).tg = 1;
trButton((PX + 'pcopy'), [2226.5, 21.2, 134, 68], 'Copy a pattern', 0xFFE15A);
SN.mon = false; SN.monMix = 0;                 /* SOLO is for the player's own ears; MIX brings the rest back underneath. Neither is saved or sent */
/* DIRECTION and SPEED: a button for each, the chosen one in the lane's colour */
[684.0, 790.2, 896.5, 1002.7, 1108.9].forEach(function(x, k){ spButton((PX + 'd') + k, [x, 428.3, 88.5, 88.5], 'Direction: ' + SNDIR[k], { bgref:SPGREY, ink:'#FFFFFF', bg:SPGREY }).di = k; });
[686.5, 794.5, 898.5, 1004.7, 1111.0].forEach(function(x, k){ spButton((PX + 's') + k, [x, 579.9, 88.5, 88.5], 'Speed: ' + SNSPD[k][1], { bgref:SPGREY, ink:'#FFFFFF', bg:SPGREY }).si = k; });
trKnob((PX + 'steps'), 748.7, 793.3, 'serp', SPPINK, '#FFFFFF', 'Steps', 1).detents = 15;
trKnob((PX + 'shift'), 950.7, 793.3, 'serp', SPPINK, '#FFFFFF', 'Start', 0).detents = 15;
trKnob((PX + 'shape'), 1133.3, 793.3, 'serp', SPPINK, '#FFFFFF', 'Shape', 0, { endless:true });
spButton((PX + 'reset'), [686.5, 962.5, 233, 93], 'Clear this lane on this pattern · hold', { bgref:SPPINK, ink:'#000000', bg:SPPINK });
spButton((PX + 'rand'), [962.5, 962.5, 233, 93], 'Random this lane · hold', { bgref:SPPINK, ink:'#000000', bg:SPPINK });
/* the 16 cells: a knob for the lane's value, and under it the step's on/off button, which also shows the value */
var SPCX = [1441.9, 1698.3, 1954.7, 2210.3], SPCY = [269.3, 604.9, 940.1, 1277.4], SPBX = [1360.4, 1616.4, 1872.4, 2128.4], SPBY = [369.2, 707.8, 1044.6, 1377.8];
for (var sni = 0; sni < 16; sni++){ (function(i){ var c = trKnob((PX + 'c') + i, SPCX[i % 4], SPCY[(i / 4) | 0], 'serp', SPPINK, '#FFFFFF', 'Cell ' + (i + 1), 0); c.cell = i; })(sni); }
for (var sgi = 0; sgi < 16; sgi++){ (function(i){ var c = trButton((PX + 'g') + i, [SPBX[i % 4], SPBY[(i / 4) | 0], 163, 68], 'Step ' + (i + 1), GRN, 'btn', true); c.gate = i; })(sgi); }
KB = KB0;
var SNLBL = [];
(function(){ for (var i = 0; i < 16; i++){ var p = CT[(PX + 'g') + i], cv = mk(128, 52), tx = smoothTex(cv), pg = p.m.geometry.parameters;
  var pl = new THREE.Mesh(new THREE.PlaneGeometry(pg.width * 0.9, pg.depth * 0.84), new THREE.MeshBasicMaterial({ map:tx, transparent:true, depthWrite:false })); pl.rotation.x = -Math.PI / 2; pl.position.y = pg.height / 2 + 0.0004; pl.userData.noShadow = true; p.m.add(pl);
  SNLBL.push({ cv:cv, tx:tx, key:'' }); } })();
function snStepLbl(i, txt, on){ var L = SNLBL[i], key = txt + (on ? '|1' : '|0'); if (L.key === key) return; L.key = key; var g = L.cv.getContext('2d'); g.clearRect(0, 0, 128, 52);
  g.font = '34px "Pixel Game", monospace'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#111114'; g.fillText(txt, 64, 28, 120); L.tx.needsUpdate = true; }
if (document.fonts && document.fonts.load) document.fonts.load('34px "Pixel Game"').then(function(){ SNLBL.forEach(function(L){ L.key = ''; }); }).catch(function(){});
function snShowCells(){}
HOST = TRG; LX = lx; LZ = lz; DEV = null; FACE = { bg:'#C9C7C0', fg:'#0B0B0D' };
function snSay(a, b, ms){ SN.msgA = a; SN.msgB = b == null ? '' : String(b); SN.msgUntil = performance.now() + (ms || 1500); SN.dirty = true; }
function snNote(v){ return 24 + (RK.on ? RK.root : SN.root) + scaleQ(Math.round(v), SCALES[RK.on ? RK.scale : SN.scale][1]); }      // the room key, when it is on, wins over the Snake's own
function snCellTxt(p, v){ return p === 0 ? snNoteName(snNote(v)) : p === 1 ? (v ? 'On' : 'Off') : p >= 3 ? Math.round(v / 1.27) + '%' : String(Math.round(v)); }
function snSync(){
  var L = SN.lanes[SN.page], mx = [83, 1, 127, 127, 127][SN.page];
  for (var i = 0; i < 16; i++){ var c = CT[(PX + 'c') + i]; c.v = L.vals[i] / mx; c.detents = SN.page === 0 ? 83 : SN.page === 1 ? 1 : 0; c.step = 0.02; c.show(); }
  snShowCells();
  CT[PX + 'root'].v = SN.root / 11; CT[PX + 'root'].show(); CT[PX + 'steps'].v = (L.len - 1) / 15; CT[PX + 'steps'].show(); CT[PX + 'shift'].v = L.shift / 15; CT[PX + 'shift'].show(); CT[PX + 'swing'].v = SN.swing; CT[PX + 'swing'].show(); SN.dirty = true;
}
snSync();
function snLabel(c){
  var L = SN.lanes[SN.page], id = c.id;
  if (c.di != null) return 'Direction: ' + SNDIR[c.di] + (L.dir === c.di ? ' · on' : ' · click');
  if (c.si != null) return 'Speed: ' + SNSPD[c.si][1] + (L.speed === c.si ? ' · on' : ' · click');
  if (c.oi != null) return 'Inst: ' + SNOUT[c.oi] + (SN.out === c.oi ? ' · playing' : ' · click');
  if (c.gate != null) return 'Step ' + (c.gate + 1) + ': ' + (SN.lanes[1].vals[c.gate] ? 'On' : 'Off') + ' · click to switch';
  if (c.cell != null) return SNLN[SN.page].charAt(0) + SNLN[SN.page].slice(1).toLowerCase() + ' ' + (c.cell + 1) + ': ' + snCellTxt(SN.page, L.vals[c.cell]) + ' · scroll or drag';
  switch (id){ case (PX + 'root'): return 'Root ' + NOTEN[SN.root] + ' · scroll or drag'; case (PX + 'scale'): return 'Scale: ' + SCALES[SN.scale][0] + ' · scroll or drag'; case (PX + 'steps'): return 'Steps ' + L.len + ' · scroll or drag'; case (PX + 'shift'): return 'Start ' + (L.shift + 1) + ' · scroll or drag';
    case (PX + 'swing'): return 'Swing ' + Math.round(SN.swing * 100) + ' · scroll or drag'; case (PX + 'shape'): return 'Shape ' + (L.shape + 1) + ' · scroll or drag'; case (PX + 'oprev'): case (PX + 'onext'): return 'Inst: ' + SNOUT[SN.out] + ' · click to step';
    case (PX + 'pta'): case (PX + 'ptb'): return 'Pattern ' + 'AB'[c.tg] + ' is ' + (SN.act[c.tg] ? 'on' : 'off') + ' · click · both on plays A then B, a bar each';
    case (PX + 'msolo'): return 'Solo ' + (SN.mon ? 'on' : 'off') + ' · only you hear the change · click';
    case (PX + 'mmix'): return 'Solo mix ' + Math.round(SN.monMix * 100) + '% · how much of everything else you hear while solo is on';
    case (PX + 'pa'): case (PX + 'pb'): return 'Pattern ' + 'AB'[c.ab] + (SN.act[c.ab] ? ' · on' : ' · off') + (SN.copy ? (SN.copy.src == null ? ' · click to copy from it' : ' · click to paste here') : ' · click to show');
    case (PX + 'pcopy'): return SN.copy ? 'Copy: now click A or B · click to cancel' : 'Copy a pattern: click, then the one to copy, then the one to paste to';
    }
  return c.name;
}
function snCtl(c){
  var L = SN.lanes[SN.page], id = c.id, v = c.v; if (id !== (PX + 'mmix')) snMark(id);
  if (c.cell != null){ var mx = [83, 1, 127, 127, 127][SN.page]; L.vals[c.cell] = SN.page === 1 ? (v >= 0.5 ? 1 : 0) : Math.round(v * mx); snSay(SNLN[SN.page] + ' ' + (c.cell + 1), snCellTxt(SN.page, L.vals[c.cell])); }
  else if (id === (PX + 'root')){ SN.root = Math.round(v * 11); snSay('Root', NOTEN[SN.root]); }
  else if (id === (PX + 'steps')){ L.len = 1 + Math.round(v * 15); snSay(SNLN[SN.page] + ' steps', L.len); }
  else if (id === (PX + 'shift')){ L.shift = Math.round(v * 15); snSay(SNLN[SN.page] + ' start', L.shift + 1); }
  else if (id === (PX + 'swing')){ SN.swing = v; snSay('Swing', Math.round(v * 100)); }
  else if (id === (PX + 'mmix')){ SN.monMix = v; snSay('Solo mix', Math.round(v * 100) + '%'); return; }      // yours alone: not saved, not sent
  snSaveSoon();
}
function snTurn(c, n){
  var L = SN.lanes[SN.page];
  if (c.id === (PX + 'scale')){ SN.scale = ((SN.scale + n) % SCALES.length + SCALES.length) % SCALES.length; snSay('Scale', SCALES[SN.scale][0]); }
  else if (c.id === (PX + 'shape')){ L.shape = ((L.shape + n) % 14 + 14) % 14; snSay(SNLN[SN.page] + ' shape', L.shape + 1); }
  snSaveSoon();
}
/* the custom lane: learn the next knob or fader moved on the connected synth, then turn it step by step */
function snLearn(on){
  SN.learn = !!on; SN.dirty = true;
  if (!on){ if (SNLEARN === snHear) SNLEARN = null; return; }
  if (!SN.out){ SN.learn = false; snSay('CUSTOM', 'set INST to a synth first', 2200); return; }
  if (SNLEARN && SNLEARN !== snHear) SNLEARN(null);          // only one Snake listens at a time
  SNLEARN = snHear; snSay('LEARN', 'click a knob on the ' + SNOUT[SN.out], 60000);
  if (!MPQUIET && typeof switchLean === 'function' && mode === 'tr' && LEAN.key === DK){ LASTSN[SNDEV[SN.out]] = DK; SN.back = true; switchLean(SNDEV[SN.out]); toast('Click the knob or fader for CUSTOM to turn · Q goes back'); }     // jump to the synth so the control can be picked
}
function snHear(c){
  if (!c){ SN.learn = false; SN.dirty = true; return; }
  if (!SN.learn || c.dev !== SNDEV[SN.out] || (c.kind !== 'knob' && c.kind !== 'fader') || c.endless) return;
  var d = null, k;
  if (c.dev === 'sh'){ if (c.pot == null) return; k = SHPAGES[SH.page][1][c.pot]; d = { dev:'sh', key:k[0], name:k[2] }; }
  else if (c.dev === 'am'){ k = c.vol ? 'volu' : c.pi2 != null ? amKeys()[c.pi2] : null; if (!k || k === 'bpm') return; d = { dev:'am', key:k, name:AMP[k] ? AMP[k][1] : 'Volume' }; }
  else if (c.dev === 'tp'){ if (c.ei == null) return; d = { dev:'tp', k:c.ei, pg:TP.pg[c.ei], name:TPPG[c.ei][TP.pg[c.ei]][0] }; }
  else d = { dev:c.dev, id:c.id, name:c.name };
  SN.cc = d; SN.learn = false; SNLEARN = null; SN.dirty = true; snSay('CUSTOM turns', d.name, 2600); snSaveSoon(); toast('CUSTOM turns ' + d.name);
  if (SN.back){ SN.back = false; setTimeout(function(){ if (mode === 'tr' && LEAN.key === d.dev) switchLean(DK); }, 450); }      // and back to the sequencer to write the lane
}
function snTurnCC(v){
  var d = SN.cc; if (!d) return; MPQUIET = true;
  try {
    if (d.dev === 'sh'){ SH.p[d.key] = v; shApply(); if (SHPAGES[SH.page][1].some(function(q){ return q[0] === d.key; })) shPots(); }
    else if (d.dev === 'am'){ AM.p[d.key] = amSnap(d.key, v); amLive(); if (d.key === 'volu' || amKeys().indexOf(d.key) >= 0) amSync(); AM.dirty = true; }
    else if (d.dev === 'tp'){ TP.v[d.k][d.pg] = v; tpApply(); if (TP.pg[d.k] === d.pg){ var e = CT['tpe' + d.k]; e.v = v; e.show(); } }
    else { var c = CT[d.id]; if (c && !c.endless){ setCtl(c, v); if (c.show) c.show(); } }
  } catch (err) {}
  MPQUIET = false;
}
function snRandom(p){ var L = SN.lanes[p]; for (var i = 0; i < 16; i++) L.vals[i] = p === 0 ? 12 + ((Math.random() * 25) | 0) : p === 1 ? (Math.random() < 0.7 ? 1 : 0) : 30 + ((Math.random() * 98) | 0); }
/* CLEAR empties, it does not go back to the starter jam. A lane's knobs go to 12 o'clock; gates go off. Probability is the one exception:
   12 o'clock there means a step only plays half the time, so it clears to "always". */
function snClearLane(pg, p){ var mid = [42, 0, 64, 127, 64][p]; SN.pgs[pg][p] = { vals:[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0].map(function(){ return mid; }), dir:0, speed:1, len:16, shift:0, shape:0 }; }
/* Undo, for this Snake only (Ctrl+Z): up to six steps back. A step is one action: a button, a clear, a paste, or one turn of a knob
   (a drag counts once). Changes other players make are not steps of yours, but undoing puts the whole Snake back as it was. */
SN.hist = []; SN.hTag = null; SN.hT = 0;
function snSnap(){ return JSON.stringify({ pgs:SN.pgs, act:SN.act, root:SN.root, scale:SN.scale, swing:SN.swing, out:SN.out, cc:SN.cc || null }); }
function snMark(tag){ var now = performance.now(); if (tag && tag === SN.hTag && now - SN.hT < 1200){ SN.hT = now; return; } SN.hTag = tag || null; SN.hT = now; SN.hist.push(snSnap()); if (SN.hist.length > 6) SN.hist.shift(); }
function snPut(j){ var s = JSON.parse(j); SN.pgs = s.pgs; SN.act = s.act; SN.root = s.root; SN.scale = s.scale; SN.swing = s.swing; SN.out = s.out; SN.cc = s.cc; SN.copy = null; SN.hTag = null; SN.cv = 0; snLearn(false); snSync(); SN.dirty = true; snSaveSoon(); }
function undo(){ if (!SN.hist.length){ snSay('UNDO', 'nothing to undo', 1500); return; } snPut(SN.hist.pop()); snSay('UNDO', SN.hist.length ? SN.hist.length + ' more' : 'that was the last', 1500); }
var SNCLR = 900;                                               // CLEAR and CLEAR ALL have to be held this long
function snClrTick(){
  var h = SN.hold2; if (!h) return; if (h.done) return;
  var f = (performance.now() - h.t0) / SNCLR; if (f < 1){ var q = Math.max(0.03, Math.round(f * 30) / 30); if (q !== h.bar){ h.bar = q; h.c.repaintFace(undefined, q); } return; }
  h.done = true; h.c.repaintFace(undefined, 0); snMark();
  if (h.rnd && h.all){ for (var p3 = 0; p3 < 5; p3++) snRandom(p3); snSync(); snSay('All lanes', 'Random'); }
  else if (h.rnd){ snRandom(SN.page); snSync(); snSay(SNLN[SN.page], 'Random'); }
  else if (h.all){ for (var q2 = 0; q2 < 2; q2++) for (var p2 = 0; p2 < 5; p2++) snClearLane(q2, p2); snSync(); snSay('Sequencer', 'Reset · A and B'); }
  else { snClearLane(SN.view, SN.page); if (SN.page === 0) snClearLane(SN.view, 1); snSync(); snSay(SNLN[SN.page], 'Cleared · pattern ' + 'AB'[SN.view]); }      // clearing the notes also switches the steps off
  snSaveSoon();
}
function snCustomClick(){ var was = SN.page === 4; SN.page = 4; snSync(); snLearn(was ? !SN.learn : !SN.cc); if (!SN.learn) snSay('CUSTOM', SN.cc ? SN.cc.name + ' · hold to clear' : 'click again to learn', 2200); }   // first click with nothing learned, or a second click, listens for a knob
function snRelease(c){ var h2 = SN.hold2; if (h2 && h2.c === c){ SN.hold2 = null; c.repaintFace(undefined, 0); if (!h2.done) snSay(h2.rnd ? 'RANDOM' : 'CLEAR', h2.rnd ? 'keep holding to randomise' : 'keep holding to clear', 1600); return; }
  var h = SN.hold; if (h && h.c === c){ SN.hold = null; if (!h.done) snCustomClick(); } }
function snHoldTick(){
  var h = SN.hold, b = CT[(PX + 'pg') + 4];
  if (!h || h.done){ if (SN.holdBar){ SN.holdBar = 0; if (b) b.repaintFace(undefined, 0); } return; }          // let go early, or finished: wipe the bar
  var f = (performance.now() - h.t0) / SNHOLD; if (f < 1){ var q = Math.max(0.02, Math.round(f * 40) / 40); if (q !== SN.holdBar){ SN.holdBar = q; b.repaintFace(undefined, q); } return; }
  h.done = true; SN.cc = null; snLearn(false); SN.page = 4; snSync(); SN.dirty = true; snSay('CUSTOM', 'cleared', 2000); snSaveSoon();
}
function snBtnFace(){                                         // the CUSTOM button names what it has learned
  var t = SN.cc ? 'CUSTOM\n' + String(SN.cc.name || '').toUpperCase().slice(0, 18) : 'CUSTOM'; if (t === SN.btnTxt) return; SN.btnTxt = t; var b = CT[(PX + 'pg') + 4]; if (b && b.repaintFace) b.repaintFace(t);
}
function snPress(c){
  var id = c.id, L = SN.lanes[SN.page], D = snDef();
  if (c.gate != null){ snMark(); var gv = SN.lanes[1].vals; gv[c.gate] = gv[c.gate] ? 0 : 1; c.down = 1; setTimeout(function(){ c.down = 0; }, 120); snSay('Step ' + (c.gate + 1), gv[c.gate] ? 'On' : 'Off'); snSaveSoon(); return; }
  if (c.ab != null){ snLearn(false);
    if (SN.copy){ if (SN.copy.src == null){ SN.copy.src = c.ab; SN.view = c.ab; snSync(); snSay('COPY ' + 'AB'[c.ab], 'now press ' + 'AB'[1 - c.ab], 8000); return; }
      var from = SN.copy.src; SN.copy = null; if (from === c.ab){ snSay('COPY', 'cancelled'); return; }
      snMark(); SN.pgs[c.ab] = defCopy(SN.pgs[from]); SN.view = c.ab; snSync(); snSay('COPIED', 'AB'[from] + ' to ' + 'AB'[c.ab], 2200); snSaveSoon(); return; }
    SN.view = c.ab; snSync(); snSay('PAGE ' + 'AB'[c.ab], SN.act[c.ab] ? 'on' : 'off', 1600); return; }
  if (id === (PX + 'pcopy')){ SN.copy = SN.copy ? null : { src:null }; snSay('COPY', SN.copy ? 'press the page to copy' : 'cancelled', SN.copy ? 8000 : 1200); return; }
  if (c.tg != null){ snMark(); SN.act[c.tg] = SN.act[c.tg] ? 0 : 1; snSay('PAGE ' + 'AB'[c.tg], SN.act[c.tg] ? 'on' : 'off', 1800); SN.dirty = true; snSaveSoon(); return; }
  if (id === (PX + 'msolo')){ SN.mon = !SN.mon; snSay('SOLO', SN.mon ? 'only in your ears' : 'off', 1800); return; }
  if (c.pg != null){
    if (c.pg === 4){ if (SN.cc && !SN.learn){ SN.hold = { c:c, t0:performance.now(), done:false }; return; } snCustomClick(); return; }       // with something learned, wait: a short click acts on release, a long hold clears it   // the custom lane: first click with nothing learned, or a second click, listens for a knob
    snLearn(false); SN.page = c.pg; snSync(); snSay(SNLN[c.pg], SN.page === 3 ? 'chance each step plays' : ''); return; }
  if (id === (PX + 'reset') || id === (PX + 'resetall') || id === (PX + 'rand') || id === (PX + 'randall')){ SN.hold2 = { c:c, t0:performance.now(), all:id === (PX + 'resetall') || id === (PX + 'randall'), rnd:id === (PX + 'rand') || id === (PX + 'randall'), done:false, bar:0 }; return; }      /* held, not clicked: see snClrTick */
  if (c.di != null){ snMark(); L.dir = c.di; snSay(SNLN[SN.page] + ' direction', SNDIR[L.dir]); snSaveSoon(); return; }
  if (c.si != null){ snMark(); L.speed = c.si; snSay(SNLN[SN.page] + ' speed', SNSPD[L.speed][1]); snSaveSoon(); return; }
  if (c.oi != null || c.ostep){ snMark(); SN.out = c.oi != null ? c.oi : (SN.out + c.ostep + 10) % 10; SN.cv = 0; snSay('Inst', SNOUT[SN.out] + (SN.out && !M.playing ? ' · start drums' : ''), 2200); snSaveSoon(); return; }
  snMark();
  switch (id){
  }
  snSaveSoon();
}
function clock(t, N, sd, sw){                       // one call per 16th from the drum machine
  var ev = [], swg = sw + SN.swing * 0.33, pp = SN.act[0] && SN.act[1] ? Math.floor(N / 16) % 2 : SN.act[1] ? 1 : 0, LS = SN.pgs[pp], mute = !SN.act[0] && !SN.act[1]; SN.playPg = mute ? -1 : pp;      // both pages on: a bar of A, a bar of B
  [1, 2, 3, 4, 0].forEach(function(li, ord){ var L = LS[li], S = SNSPD[L.speed][0];
    for (var k = Math.ceil(N / S - 1e-6); k * S < N + 1 - 1e-6; k++){ var pos = k * S, r = Math.round(pos), on = Math.abs(pos - r) < 1e-6; ev.push([t + (pos - N) * sd + (on && r % 2 ? swg * sd : 0), ord, li, k, S]); } });
  ev.sort(function(a, b){ return a[0] - b[0] || a[1] - b[1]; });
  ev.forEach(function(e){
    var li = e[2], L = LS[li], cell = snCellAt(L, e[3]); SN.cell[li] = cell; SN.vis.push({ t:e[0], l:li, c:cell }); if (li === 4 && SN.cc && !mute) SN.vis.push({ t:e[0], cc:L.vals[cell] / 127 });
    if (mute || li !== 0 || !SN.out || !LS[1].vals[cell] || snDice(N * 31 + e[3] * 7 + K * 131) * 127 >= LS[3].vals[SN.cell[3]]) return;   // the step's own button, then its dice roll
    var n = snNote(L.vals[cell]), vel = clamp(LS[2].vals[SN.cell[2]] / 127, 0.05, 1), dur = sd * e[4] * 0.6;
    var o = SN.out; if (o === 1){ if (mfAudio()) mfNoteAt(n + 12, vel, e[0], dur); } else if (o === 2){ if (bsAudio()) bsNoteAt(n, vel, e[0], dur); } else if (o === 3) mbNoteAt(n, vel, e[0], dur); else if (o === 4) amNoteAt(n + 12, vel, e[0], dur); else if (o === 5) tpNoteAt(n + 24, vel, e[0], dur); else if (o === 6) shNoteAt(n + 12, vel, e[0], dur); else if (o === 8) zkNoteAt(n + 12, vel, e[0], dur); else if (o === 9) skSeqAt(n, vel, e[0], dur); else mcSeqAt(n, vel, e[0], dur);
  });
}
function onStop(){ SN.vis = []; SN.cv = 0; }
/* the screen, drawn to the design: 514 x 211.6 design px at twice that. Its words and snake wear the lane's colour */
var SPICON = ['M6 24 H40 M31 15 L40 24 L31 33', 'M42 24 H8 M17 15 L8 24 L17 33', 'M6 14 H33 a10 10 0 0 1 0 20 H10 M18 26 L10 34 L18 42', 'M42 14 H15 a10 10 0 0 0 0 20 H38 M30 26 L38 34 L30 42',
  'M6 14 H13 C24 14 24 34 35 34 H41 M6 34 H13 C17 34 19 31 21 28 M27 20 C29 17 31 14 35 14 H41 M35 8 L41 14 L35 20 M35 28 L41 34 L35 40'];
function snPaintDisp(){
  var g = snDispC.getContext('2d'), now = performance.now(), L = SN.lanes[SN.page], a, b, lane = spHex(SNCOL[SN.page]);
  g.setTransform(2, 0, 0, 2, 0, 0); g.fillStyle = '#05080A'; g.fillRect(0, 0, 514, 212); g.textBaseline = 'middle'; g.textAlign = 'left';
  if (now < SN.msgUntil){ a = SN.msgA; b = SN.msgB; } else { a = SNLN[SN.page] + ' ' + SNSPD[L.speed][1]; b = SN.page === 4 ? (SN.learn ? 'move a knob...' : SN.cc ? SN.cc.name : 'nothing learned') : RK.on ? NOTEN[RK.root] + ' ' + SCALES[RK.scale][0] + ' room' : NOTEN[SN.root] + ' ' + SCALES[SN.scale][0]; }
  g.fillStyle = lane; g.font = '54px "Pixel Game", monospace'; g.fillText(String(a).toUpperCase(), 16, 44, 236);
  g.fillStyle = SN.act[SN.view] ? lane : '#5A6068'; g.fillRect(264.6, 15.2, 45.4, 52.9); g.fillStyle = '#05080A'; g.font = '56px "Pixel Game", monospace'; g.textAlign = 'center'; g.fillText('AB'[SN.view], 287.3, 44); g.textAlign = 'left';
  g.fillStyle = '#FFFFFF'; g.font = '88px "Pixel Game", monospace'; g.fillText(String(b).toUpperCase(), 16, 112, 310);
  g.save(); g.translate(16, 165); g.scale(0.75, 0.75); g.strokeStyle = '#FFFFFF'; g.lineWidth = 4; g.lineCap = g.lineJoin = 'round'; g.stroke(new Path2D(SPICON[L.dir])); g.restore();
  g.fillStyle = '#FFFFFF'; g.font = '42px "Merchant Copy", monospace'; g.fillText(SNDIR[L.dir].toUpperCase(), 62, 184, 260);
  var PA = SNSHAPE[L.shape], x0 = 348, y0 = 29.6, sx2 = 49.3, sy2 = 48.7; g.strokeStyle = g.fillStyle = lane; g.lineWidth = 3; g.lineJoin = 'round'; g.beginPath();      /* the snake's path through the grid for this lane */
  for (var k = 0; k < L.len; k++){ var cl = PA[(k + L.shift) % 16], x = x0 + (cl % 4) * sx2, y = y0 + ((cl / 4) | 0) * sy2; if (k) g.lineTo(x, y); else g.moveTo(x, y); } g.stroke();
  var c0 = PA[L.shift % 16]; g.beginPath(); g.arc(x0 + (c0 % 4) * sx2, y0 + ((c0 / 4) | 0) * sy2, 10, 0, 7); g.fill();
  g.setTransform(1, 0, 0, 1, 0, 0); snDispT.needsUpdate = true;
}
if (document.fonts && document.fonts.load) Promise.all([document.fonts.load('54px "Pixel Game"'), document.fonts.load('42px "Merchant Copy"')]).then(function(){ SN.dirty = true; }).catch(function(){});
function update(now, dt){
  var t = ac ? ac.currentTime : 0, i; SN.run = M.playing;
  if (ac) SN.vis = SN.vis.filter(function(e){ if (e.t > t) return true; if (e.cc != null) snTurnCC(e.cc); else if (e.cv != null) SN.cv = e.cv; else { SN.vcell = SN.vcell || [-1, -1, -1, -1, -1]; SN.vcell[e.l] = e.c; } return false; });
  var vc = M.playing && SN.vcell && SN.playPg === SN.view ? SN.vcell : [-1, -1, -1, -1, -1], g = SN.lanes[1].vals, col = new THREE.Color(), lane = spHex(SNCOL[SN.page]);
  /* the step lights are white; the lane being shown lights its step in its colour, the other lanes faintly */
  for (i = 0; i < 16; i++){ col.setHex(0xF2F2F2); for (var l = 0; l < 5; l++) if (l !== 1 && vc[l] === i) col.lerp(new THREE.Color(SNCOL[l]), l === SN.page ? 1 : 0.3); SNLED[i].color.copy(col);
    CT[(PX + 'c') + i].look(lane); snStepLbl(i, snCellTxt(SN.page, SN.lanes[SN.page].vals[i]), g[i] || vc[0] === i); }
  ['steps', 'shift', 'shape'].forEach(function(k){ CT[PX + k].look(lane); });
  CTLIST.forEach(function(c){
    if (c.dev !== DK || c.kind !== 'btn') return; var L = 0;
    if (c.gate != null){ L = g[c.gate] ? (vc[0] === c.gate ? 1 : 0.85) : vc[0] === c.gate ? 0.35 : 0; }            /* a step that is on is green; the pitch snake's step glows as it passes */
    else if (c.lane){ var sel = SN.page === c.pg; c.mat.emissiveIntensity = sel ? 0.85 : 0.58; c.mat.color.setHex(0x4D4D4D); }
    else if (c.pg === 4){ c.setBg(SN.learn ? (Math.floor(now / 160) % 2 ? '#FFFFFF' : spHex(SNCOL[4])) : spHex(SNCOL[4])); c.mat.emissiveIntensity = SN.page === 4 ? 0.85 : 0.58; }
    else if (c.di != null) c.setBg(SN.lanes[SN.page].dir === c.di ? lane : SPGREY);
    else if (c.si != null) c.setBg(SN.lanes[SN.page].speed === c.si ? lane : SPGREY);
    else if (c.oi != null) c.setBg(SN.out === c.oi ? (c.oi ? spOutCol(c.oi) : '#FFFFFF') : '#000000');
    else if (c.id === (PX + 'reset') || c.id === (PX + 'rand')) c.setBg(lane);
    else if (c.tg != null){ var tt = SN.act[c.tg] ? 'ON' : 'OFF'; if (c.tgT !== tt){ c.tgT = tt; c.repaintFace(tt); } c.setBg(SN.act[c.tg] ? '#3BFF6A' : '#FFFFFF'); }
    else if (c.ab != null) L = (SN.copy && SN.copy.src === c.ab) ? (Math.floor(now / 110) % 2 ? 1 : 0.3) : SN.view === c.ab ? 1 : M.playing && SN.playPg === c.ab ? 0.4 : 0;
    else if (c.id === (PX + 'pcopy')) L = SN.copy ? (Math.floor(now / 160) % 2 ? 1 : 0.15) : 0;
    else if (c.id === (PX + 'msolo')) L = SN.mon ? 1 : 0;
    if (c.down) L = Math.max(L, 0.8);
    if (!c.sp && !c.lane && L !== c.lit){ c.lit = L; c.paintLit(); }
    var ty = c.y0 - (c.down ? 0.003 : 0); if (c.m.position.y !== ty) c.m.position.y = ty; });
  snHoldTick(); snClrTick(); snBtnFace();
  if (now > SN.msgUntil && SN.msgA){ SN.msgA = ''; SN.dirty = true; }
  if (SN.dirty){ SN.dirty = false; snPaintDisp(); }
}
DEVH[DK] = { label:snLabel, press:snPress, release:snRelease, ctl:snCtl, turn:snTurn };
function patterns(def, jam){ var d0 = snDef(); SN.view = 0; SN.act = [1, 0]; SN.copy = null; SN.pgs = [d0.lanes, snDefaults().lanes]; if (!def) SN.pgs[1][1].vals = SN.pgs[1][1].vals.map(function(){ return 0; }); if (def){ SN.root = d0.root; SN.scale = d0.scale; SN.swing = d0.swing; }
  var jx = jam && DEF && DEF.snakes && DEF.snakes[K]; if (jx && typeof jx.out === 'number'){ SN.out = clamp(jx.out | 0, 0, 9); SN.cv = 0; }      // a saved jam also says which synth each Snake plays
  if (!def){                                                        // cleared: both pages empty with every knob at 12 o'clock (notes and velocity in the middle, gates off; probability stays at always), and the Snake's own settings back to how it starts
    var blank = function(){ var l = snDefaults().lanes, f = function(v){ return l[0].vals.map(function(){ return v; }); }; l[0].vals = f(42); l[1].vals = f(0); l[2].vals = f(64); l[3].vals = f(127); l[4].vals = f(64); return l; };
    SN.pgs = [blank(), blank()]; SN.root = 0; SN.scale = 2; SN.swing = 0; SN.page = 0;
  }
  snSync(); snSaveSoon(); }
RESTORE['jambutek-studio-snake-v3-' + K] = function(){ snRestore(); snSync(); }; SAVENOW.push(snSaveNow);
function copyPage(){ SNCLIP = JSON.stringify(SN.pgs[SN.view]); snSay('COPIED', 'page ' + 'AB'[SN.view] + ' · Ctrl+V pastes', 2400); }                                     // Ctrl+C / Ctrl+V: the page being shown, all its lanes; it can be pasted on this Snake's other page or on another Snake
function pastePage(){ var p = null; try { p = JSON.parse(SNCLIP); } catch (e) {} if (!snLanesOk(p)){ snSay('PASTE', 'nothing copied yet', 1600); return; } snMark(); SN.pgs[SN.view] = p; snSync(); SN.dirty = true; snSay('PASTED', 'to page ' + 'AB'[SN.view], 2200); snSaveSoon(); }
return { SN:SN, G:SNG, key:DK, hp:HP, copyPage:copyPage, pastePage:pastePage, patterns:patterns, x:HP.x, z:HP.z, clock:clock, onStop:onStop, update:update, undo:undo };
}
/* one Snake behind every synth, each wired to its own by default (OUT numbers: 1 Synth, 2 Bass, 3 Blip, 4 Ambi, 5 Tape, 6 Shru) */
var SNAKES = [[MFPOS, 1], [BSPOS, 2], [AMPOS, 4], [TPPOS, 5], [MBPOS, 3], [SHPOS, 6], [ZKPOS, 8], [MCPOS, 7], [SCPOS, 9]].map(function(a, k){ return makeSnake(k, a[0], a[1]); });
function snClock(t, N, sd, sw){ SNAKES.forEach(function(s){ s.clock(t, N, sd, sw); }); }
function snOnStop(){ SNAKES.forEach(function(s){ s.onStop(); }); }
function snUpdate(now, dt){ SNAKES.forEach(function(s){ s.update(now, dt); }); }
function snCv(o){ var v = 0; SNAKES.forEach(function(s){ if (s.SN.out === o) v += s.SN.cv; }); return clamp(v, -1, 1); }
