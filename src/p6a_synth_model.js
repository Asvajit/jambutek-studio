
/* ================= the synth: a 6-voice hybrid polysynth with a 37-key keyboard, on its own angled stand =================
   Laid out from the front-panel photo in the MiniFreak manual: positions are that photo's pixels (2120 wide),
   the panel is 2080 x 818 of them, built at double size like the drum machine. */
var MS = 0.0005558;                                  // metres per photo pixel (578 mm panel, 2x life size)
function mx(px){ return (px - 1060) * MS; }
function mz(py){ return (py - 429) * MS; }
function mm(px){ return px * MS / SC; }              // photo pixels -> the builders' millimetre units
var MFH = 1.0, MFTILT = 0.42;
var MFY = new THREE.Group(); MFY.position.set(MFPOS.x, MFH, MFPOS.z); MFY.rotation.y = MFPOS.r; scene.add(MFY);
var MFG = new THREE.Group(); MFG.rotation.x = MFTILT; MFY.add(MFG);
function devBody(o, dev){ solid(o, 'trbody'); o.traverse(function(m){ m.userData.dev = dev; }); }

var MFSRC = ['CycEnv', 'Envelope', 'LFO 1', 'LFO 2', 'Velo', 'Wheel', 'Keyboard'];
var MFDST = ['Pitch 1+2', 'Wave 1', 'Timbre 1', 'Cutoff', 'Shape 1', 'Timbre 2', 'Level'];
var MFROWY = [120, 135, 148, 163, 177, 191, 206], MFCOLX = [139, 175, 211, 247, 283, 319, 355];
var MFSTEPN = ['Up', 'Down', 'UpDwn', 'Rand', 'Order', 'Poly', 'Walk', 'Pattern', 'Oct 1', 'Oct 2', 'Oct 3', 'Oct 4', 'Repeat', 'Ratchet', 'Rand Oct', 'Mutate'];
var KEY0 = { x0:364, x1:2019, y0:462, y1:778 }, KW = (KEY0.x1 - KEY0.x0) / 22;

/* ---- the printed panel ---- */
var mfC = mk(4096, 1611), mfTex = null;
function paintMF(){
  var g = mfC.getContext('2d'), k = 4096 / 2080; g.setTransform(k, 0, 0, k, -20 * k, -20 * k);
  g.fillStyle = '#15171C'; g.fillRect(20, 20, 2080, 818);
  for (var i = 0; i < 9000; i++){ g.fillStyle = 'rgba(' + (Math.random() < .5 ? '0,0,0' : '120,130,150') + ',' + rnd(.02, .06) + ')'; g.fillRect(20 + Math.random() * 2080, 20 + Math.random() * 818, 2, 1); }
  var W = '#E8E8E4', B = '#4AA8FF';
  function T(s, x, y, size, col, anton, align){ g.font = anton ? size + 'px ' + FONT : 'bold ' + size + 'px "Helvetica Neue", Helvetica, Arial, sans-serif'; g.fillStyle = col || W; g.textAlign = align || 'center'; g.textBaseline = 'middle'; g.fillText(s, x, y); }
  function L(x0, y0, x1, y1, w){ g.strokeStyle = W; g.lineWidth = w || 1.5; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke(); }
  function ring(x, y, r, full){ g.strokeStyle = W; g.lineWidth = 1.5; g.beginPath(); if (full) g.arc(x, y, r, 0, 7); else g.arc(x, y, r, Math.PI * 0.75, Math.PI * 0.25); g.stroke(); }
  function sec(s, x0, x1, y){ T(s, x0 + 4, y - 13, 15, W, true, 'left'); L(x0, y, x1, y, 2); }
  // key bed and touch-strip well
  g.fillStyle = '#0A0B0E'; g.fillRect(346, 446, 1690, 350); g.fillStyle = '#FF5A1F'; g.fillRect(352, 450, 1678, 5);
  g.fillStyle = '#0E1014'; g.fillRect(48, 446, 280, 350);
  [145, 230].forEach(function(x){ g.fillStyle = '#07080A'; g.fillRect(x - 26, 516, 52, 258); g.strokeStyle = 'rgba(232,232,228,.4)'; g.lineWidth = 1; g.strokeRect(x - 26, 516, 52, 258); });
  
  // modulation matrix
  MFSRC.forEach(function(s, r){ T(s, 113, MFROWY[r], 10, W, false, 'right'); L(118, MFROWY[r], 372, MFROWY[r], 1); });
  MFCOLX.forEach(function(x, c){ L(x - 18, 206, x - 18, 112, 1); L(x - 18, 112, x + 16, 78, 1);
    g.save(); g.translate(x + 4, 104); g.rotate(-Math.PI / 4); T(c < 4 ? MFDST[c] : 'Assign ' + (c - 3), 0, 0, 9.5, W, false, 'left'); g.restore(); });
  L(373, 206, 373, 112, 1); L(373, 112, 407, 78, 1);
  T('Page', 350, 56, 11, B); T('Matrix', 436, 200, 13); T('Amount', 476, 117, 8.5); ring(436, 157, 31, true);
  // row 1
  sec('OSCILLATORS', 555, 1170, 82); sec('ANALOG FILTER', 1197, 1531, 82); sec('DIGITAL EFFECTS', 1558, 1948, 82);
  T('Select', 581, 166, 13); T('1', 627, 126, 9); T('2', 627, 144, 9);
  T('Tune /', 660, 179, 13); T('Oct', 706, 179, 13, B); T('Fine', 714, 96, 8.5); ring(675, 135, 31, true);
  [['Type', 762], ['Wave', 851], ['Timbre', 940], ['Shape', 1030], ['Volume', 1119]].forEach(function(a){ T(a[0], a[1], 179, 13); });
  T('Type', 1235, 167, 13); ['LPF', 'BPF', 'HPF'].forEach(function(s, i){ T(s, 1284, 117 + i * 18, 9); });
  [['Cutoff', 1332], ['Resonance', 1408]].forEach(function(a){ T(a[0], a[1], 179, 13); ring(a[1], 135, 31); });
  T('Env /', 1469, 179, 13); T('Velo', 1508, 180, 13, B); ring(1484, 135, 31); L(1484, 99, 1484, 104, 1.5);
  T('Select', 1588, 166, 13); ['FX 1', 'FX 2', 'FX 3'].forEach(function(s, i){ T(s, 1640, 117 + i * 18, 9); });
  T('Type /', 1673, 180, 13); T('Sub', 1716, 180, 13, B); T('On', 1727, 97, 8.5); ring(1687, 135, 31, true);
  [['Time', 1762], ['Intensity', 1838], ['Amount', 1914], ['Master', 2001]].forEach(function(a){ T(a[0], a[1], 180, 13); }); ring(2001, 135, 31);
  // row 2
  T('Shift', 95, 306, 13); g.strokeStyle = B; g.lineWidth = 3; g.beginPath(); g.arc(95, 273, 21, 0, 7); g.stroke();
  T('←  Octave  →', 218, 303, 13); ring(185, 273, 23, true); ring(251, 273, 23, true); g.fillStyle = '#15171C'; g.fillRect(205, 264, 26, 18); L(205, 264, 231, 264); L(205, 282, 231, 282);
  T('Hold / Rest', 335, 303, 13); T('Chord', 393, 303, 13); T('Scales', 393, 317, 13, B); T('Glide', 487, 316, 13); ring(487, 273, 31);
  sec('LFO', 555, 788, 223); T('Select', 581, 303, 13); T('Edit', 581, 317, 13, B); T('1', 627, 263, 9); T('2', 627, 281, 9);
  T('Rate /', 660, 316, 13); T('Trig', 705, 316, 13, B); ring(675, 273, 31, true); T('Sync', 714, 233, 8.5);
  T('Wave /', 748, 316, 13); T('Load', 798, 316, 13, B);
  g.fillStyle = '#050608'; g.beginPath(); g.moveTo(819, 225); g.lineTo(1166, 225); g.quadraticCurveTo(1174, 225, 1174, 233); g.lineTo(1174, 331); g.quadraticCurveTo(1174, 339, 1166, 339); g.lineTo(819, 339); g.quadraticCurveTo(811, 339, 811, 331); g.lineTo(811, 233); g.quadraticCurveTo(811, 225, 819, 225); g.fill();
  T('Sound Edit', 852, 305, 12); T('Utility', 852, 319, 12, B); T('Save', 916, 305, 12); T('Panel', 916, 319, 12, B);
  T('Preset / Edit', 1108, 320, 11); ring(1119, 273, 31, true);
  sec('CYCLING ENVELOPE', 1197, 1530, 223); T('Mode', 1235, 304, 13); ['Env', 'Run', 'Loop'].forEach(function(s, i){ T(s, 1284, 255 + i * 18, 9); });
  [['Rise', 1332], ['Fall', 1408], ['Hold / Sustain', 1486]].forEach(function(a){ T(a[0], a[1], 317, 13); ring(a[1] > 1480 ? 1484 : a[1], 273, 31); });
  sec('ENVELOPE', 1557, 1946, 223); T('Mode', 1588, 304, 13); ['Mono', 'Poly', 'Para', 'Uni'].forEach(function(s, i){ T(s, 1641, 246 + i * 18, 9); });
  [['Attack', 1685], ['Decay', 1761], ['Sustain', 1837], ['Release', 1913]].forEach(function(a){ T(a[0], a[1], 317, 13); ring(a[1], 273, 31); });
  T('Tempo /', 1983, 317, 13); T('Div', 2030, 317, 13, B); ring(2000, 273, 31, true);
  // touch-button row
  sec('ARPEGGIATOR / SEQUENCER', 370, 1894, 356);
  [['Vibrato', 94], ['Assign', 178], ['Dice', 260], ['Copy', 401], ['Paste', 455], ['Erase', 508], ['Overdub', 636]].forEach(function(a){ T(a[0], a[1], 425, 8.5, B); });
  MFSTEPN.forEach(function(s, i){ T(s, 765 + 54 * i, 425, 8.5); });
  T('Page 1 – 4', 1728, 425, 8.5); T('Last Step', 1863, 425, 8.5);
  T('SYNTH-6', 2075, 386, 30, W, true, 'right'); T('HYBRID POLY SYNTH', 2075, 410, 9, W, false, 'right');
  g.setTransform(1, 0, 0, 1, 0, 0);
  if (mfTex) mfTex.needsUpdate = true;
}
paintMF(); mfTex = smoothTex(mfC);
if (document.fonts && document.fonts.load) document.fonts.load('20px Anton').then(paintMF).catch(function(){});

(function(){
  var W2 = 2080 * MS, D2 = 818 * MS, TH = 0.09;
  var top = new THREE.Mesh(new THREE.PlaneGeometry(W2, D2), new THREE.MeshPhongMaterial({ color:0x8C8C8C, map:mfTex, emissive:0xffffff, emissiveMap:mfTex, emissiveIntensity:0.5, shininess:8, specular:0x0A0A0A }));
  top.rotation.x = -Math.PI / 2; top.receiveShadow = true; MFG.add(top);
  var body = new THREE.Mesh(new THREE.BoxGeometry(W2 + 0.012, TH, D2 + 0.012), new THREE.MeshPhongMaterial({ color:0x1B1D22, shininess:30, specular:0x222222, flatShading:true })); body.position.y = -TH / 2 - 0.0015; MFG.add(body);
  var tray = new THREE.Mesh(new THREE.BoxGeometry(W2 + 0.12, 0.024, D2 + 0.07), woodMat); tray.position.y = -TH - 0.014; MFG.add(tray);
  var lip = new THREE.Mesh(new THREE.BoxGeometry(W2 + 0.12, 0.05, 0.024), woodMat); lip.position.set(0, -TH + 0.012, D2 / 2 + 0.035); MFG.add(lip);
  [-1, 1].forEach(function(s){
    var x = s * 0.5;
    var post = new THREE.Mesh(new THREE.BoxGeometry(0.045, MFH - 0.12, 0.045), metalMat); post.position.set(x, -MFH + (MFH - 0.12) / 2, -0.02); MFY.add(post);
    var foot = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.035, 0.62), metalMat); foot.position.set(x, -MFH + 0.0175, 0); MFY.add(foot);
    var brace = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.03, 0.5), metalMat); brace.position.set(x, -MFH + 0.46, 0); brace.rotation.x = -1.02; MFY.add(brace);
    var arm = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, D2 + 0.04), metalMat); arm.position.set(x, -(TH + 0.05) * Math.cos(MFTILT), -(TH + 0.05) * Math.sin(MFTILT)); arm.rotation.x = MFTILT; MFY.add(arm);
  });
  var bar = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.03, 0.03), metalMat); bar.position.set(0, -MFH + 0.28, -0.02); MFY.add(bar);
  devBody(MFY, 'mf');
  BLOCKS.push(devBlock(MFPOS, 0.7));
})();

/* ---- controls ---- */
HOST = MFG; LX = mx; LZ = mz; DEV = 'mf'; FACE = { bg:'#262A31', fg:'#F0F0EC' };
var MFLED = {};
function mfLed(id, px, py, r, hex){
  var m = new THREE.Mesh(new THREE.CylinderGeometry(mm(r) * SC, mm(r) * SC, 0.002, 8), new THREE.MeshBasicMaterial({ color:0x15171C })); m.position.set(mx(px), 0.0012, mz(py)); m.userData.noShadow = true; MFG.add(m);
  MFLED[id] = { mat:m.material, col:new THREE.Color(hex || 0xFFFFFF), off:new THREE.Color(0x1C1F26) };
}
function ledSet(id, b){ var l = MFLED[id]; l.mat.color.copy(l.off).lerp(l.col, clamp(b, 0, 1)); }
function rbtn(id, px, py, name){
  var R = mm(17) * SC, mat = new THREE.MeshPhongMaterial({ color:0x50535A, shininess:14, specular:0x111111, emissive:0x000000 });
  var m = new THREE.Mesh(new THREE.CylinderGeometry(R, R * 1.05, 0.008, 12), mat); m.position.set(mx(px), 0.004, mz(py)); MFG.add(m);
  var hit = new THREE.Mesh(new THREE.CylinderGeometry(R * 1.45, R * 1.45, 0.02, 8), HITMAT); hit.position.set(mx(px), 0.008, mz(py)); MFG.add(hit);
  var c = { id:id, kind:'btn', name:name, m:m, mat:mat, col:new THREE.Color(0xFFFFFF), lit:0, hov:false, down:0, y0:0.004 };
  c.paintLit = function(){ if (c.lit > 0.01) mat.emissive.copy(c.col).multiplyScalar(Math.min(1, c.lit * 0.75 + (c.hov ? 0.2 : 0))); else mat.emissive.setHex(c.hov ? 0x2E6A44 : 0x000000); };
  c.hover = function(on){ c.hov = on; c.paintLit(); };
  return reg(c, [m, hit]);
}
var POT = { h:9 }, ENC = { endless:true, sides:14, h:9 }, ORG2 = { color:0xFF4A1C, h:9, sides:9 }, WHTK = { endless:true, color:0xDADAD6, sides:9, h:10 };
knob('mfmatrix', 436, 157, mm(24), 'Matrix', 0, WHTK);
knob('mftune', 675, 135, mm(25), 'Tune', 0, ENC);
knob('mftype', 762, 135, mm(21), 'Type', 0, ORG2).detents = 7;
knob('mfwave', 851, 135, mm(21), 'Wave', 0.5, ORG2); knob('mftimbre', 940, 135, mm(21), 'Timbre', 0.5, ORG2); knob('mfshape', 1030, 135, mm(21), 'Shape', 0, ORG2);
knob('mfvol', 1119, 135, mm(21), 'Volume', 0.8, POT);
knob('mfcut', 1332, 135, mm(23), 'Cutoff', 0.7, POT); knob('mfres', 1408, 135, mm(23), 'Resonance', 0.1, POT); knob('mfenv', 1484, 135, mm(23), 'Env amount', 0.5, POT);
knob('mffxtype', 1687, 135, mm(25), 'FX type', 0, ENC);
knob('mftime', 1762, 135, mm(21), 'Time', 0.5, POT); knob('mfint', 1838, 135, mm(21), 'Intensity', 0.5, POT); knob('mfamt', 1914, 135, mm(21), 'Amount', 0.3, POT);
knob('mfmaster', 2001, 135, mm(23), 'Master', 0.75, POT);
knob('mfglide', 487, 273, mm(23), 'Glide', 0, POT);
knob('mflforate', 675, 273, mm(25), 'LFO rate', 0.5, POT); knob('mflfowave', 762, 273, mm(21), 'LFO wave', 0, POT).detents = 7;
knob('mfpreset', 1119, 273, mm(24), 'Preset', 0, WHTK);
knob('mfrise', 1332, 273, mm(23), 'Rise', 0.3, POT); knob('mffall', 1408, 273, mm(23), 'Fall', 0.4, POT); knob('mfhold', 1484, 273, mm(23), 'Hold / Sustain', 0.5, POT);
knob('mfatk', 1685, 273, mm(23), 'Attack', 0.02, POT); knob('mfdec', 1761, 273, mm(23), 'Decay', 0.4, POT); knob('mfsus', 1837, 273, mm(23), 'Sustain', 0.6, POT); knob('mfrel', 1913, 273, mm(23), 'Release', 0.3, POT);
knob('mftempo', 2000, 273, mm(25), 'Tempo', 0, ENC);
rbtn('mfshift', 95, 273, 'Shift'); rbtn('mfoctdn', 185, 273, 'Octave down'); rbtn('mfoctup', 251, 273, 'Octave up');
rbtn('mfholdb', 335, 273, 'Hold · latch keys (rest when recording)'); rbtn('mfchord', 393, 273, 'Chord');
rbtn('mfoscsel', 581, 135, 'Oscillator select'); rbtn('mflfosel', 581, 273, 'LFO select');
rbtn('mfsedit', 852, 273, 'Sound Edit'); rbtn('mfsave', 916, 273, 'Save preset');
rbtn('mfftype', 1235, 135, 'Filter type'); rbtn('mfcycmode', 1235, 273, 'Cycling envelope mode');
rbtn('mffxsel', 1588, 135, 'FX select'); rbtn('mfenvmode', 1588, 273, 'Voice mode');
// LEDs
mfLed('o1', 613, 126, 4); mfLed('o2', 613, 144, 4); mfLed('l1', 613, 263, 4); mfLed('l2', 613, 281, 4);
mfLed('lr1', 753, 209, 4, 0xFFC84A); mfLed('lr2', 771, 209, 4, 0xFFC84A);
[0, 1, 2].forEach(function(i){ mfLed('ft' + i, 1268, 117 + i * 18, 4); mfLed('fx' + i, 1622, 117 + i * 18, 4, i ? 0x9AA8FF : 0xFFFFFF); mfLed('cm' + i, 1268, 255 + i * 18, 4); mfLed('pg' + i, 314 + i * 36, 75, 6, 0xC8C8FF); });
[0, 1, 2, 3].forEach(function(i){ mfLed('em' + i, 1622, 246 + i * 18, 4); });
mfLed('fxon', 1727, 109, 4); mfLed('mamt', 476, 129, 4); mfLed('cyc', 1512, 209, 4, 0xFFC84A); mfLed('env', 1930, 209, 4, 0xFFC84A);
// the matrix: every dot is a little control - scroll or drag on it to set that routing's amount
(function(){
  var geo = new THREE.CylinderGeometry(0.0038, 0.0038, 0.0025, 8), hg = new THREE.CylinderGeometry(0.0085, 0.0085, 0.012, 6);
  for (var r = 0; r < 7; r++) for (var cI = 0; cI < 7; cI++)(function(r, cI){
    var mat = new THREE.MeshBasicMaterial({ color:0x0A0B0E }), m = new THREE.Mesh(geo, mat); m.position.set(mx(MFCOLX[cI]), 0.0015, mz(MFROWY[r])); m.userData.noShadow = true; MFG.add(m);
    var hit = new THREE.Mesh(hg, HITMAT); hit.position.copy(m.position); MFG.add(hit);
    var c = { id:'mfm' + r + '_' + cI, kind:'knob', name:MFSRC[r] + ' → ' + MFDST[cI], v:0.5, def:0.5, step:0.02, r:r, c:cI, m:m, mat:mat, hov:false, show:function(){}, hover:function(on){ c.hov = on; } };
    c.click = function(){ MF.mcur = r * 7 + cI; MF.medit = true; mfSay(c.name, mfMatTxt(r, cI)); };
    reg(c, [m, hit]);
  })(r, cI);
})();
// touch buttons
var TB = 0xFFFFFF, TBB = 0x4AA8FF, TBO = 0xFF8A2A;
button('mfsm0', 94, 393, mm(70), mm(40), 'KEYBOARD\nBEND / WHEEL', 'Strips: bend + wheel', TB); button('mfsm1', 178, 393, mm(70), mm(40), 'MACROS\nM1 / M2', 'Strips: macros', TBB); button('mfsm2', 260, 393, mm(70), mm(40), 'SEQ / ARP\nGATE / SPICE', 'Strips: gate + spice', TBO);
button('mfoff', 401, 393, mm(46), mm(40), 'OFF', 'Arp / Seq off', TB); button('mfarp', 455, 393, mm(46), mm(40), 'ARP', 'Arpeggiator', TB); button('mfseq', 508, 393, mm(46), mm(40), 'SEQ', 'Sequencer', TB);
button('mfplay', 581, 393, mm(48), mm(40), '■/▶', 'Play / Stop', TB); button('mfrec', 636, 393, mm(48), mm(40), '●', 'Record', 0xFF2A3C); button('mfmods', 689, 393, mm(48), mm(40), 'MODS', 'Mods', TB);
for (var mfi = 0; mfi < 16; mfi++) button('mfst' + mfi, 765 + 54 * mfi, 393, mm(47), mm(40), String(mfi + 1), 'Step ' + (mfi + 1), TB).si = mfi;
[16, 32, 48, 64].forEach(function(n, i){ button('mfpg' + i, 1647 + 54 * i, 393, mm(47), mm(40), String(n), 'Steps ' + (n - 15) + '–' + n, TB).pg = i; });
button('mflast', 1863, 393, mm(47), mm(40), 'LAST', 'Last step', TB);
// touch strips
function mfStrip(id, px, name, col){
  var zTop = mz(526), zBot = mz(764), g = new THREE.Group(); g.position.set(mx(px), 0, 0); MFG.add(g);
  var capM = new THREE.MeshBasicMaterial({ color:0xFFFFFF }), cap = new THREE.Mesh(new THREE.BoxGeometry(0.026, 0.003, 0.006), capM); cap.userData.noShadow = true; g.add(cap);
  var glowM = new THREE.MeshBasicMaterial({ color:col }), glow = new THREE.Mesh(new THREE.PlaneGeometry(0.02, 1), glowM); glow.rotation.x = -Math.PI / 2; glow.position.y = 0.0012; glow.userData.noShadow = true; g.add(glow);
  var hit = new THREE.Mesh(new THREE.BoxGeometry(0.036, 0.012, zBot - zTop + 0.02), HITMAT); hit.position.set(0, 0.005, (zTop + zBot) / 2); g.add(hit);
  var c = { id:id, kind:'fader', name:name, v:0, def:0, step:0.04, glowM:glowM, bip:false,
    show:function(){ var z = lerp(zBot, zTop, c.v), z0 = c.bip ? (zTop + zBot) / 2 : zBot; cap.position.set(0, 0.002, z); glow.scale.y = Math.max(0.001, Math.abs(z0 - z)); glow.position.z = (z0 + z) / 2; },
    hover:function(on){ capM.color.setHex(on ? 0x90F0A8 : 0xFFFFFF); } };
  c.show(); return reg(c, [hit]);
}
mfStrip('mfs1', 145, 'Strip 1', 0x4AA8FF); mfStrip('mfs2', 230, 'Strip 2', 0x4AA8FF);
// the keyboard: 37 keys, C to C
var MFKEYS = [], NOTEN = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
(function(){
  var wl = (KEY0.y1 - KEY0.y0) * MS, wi = 0, zc = mz((KEY0.y0 + KEY0.y1) / 2), bl = wl * 0.62;
  var wg = new THREE.BoxGeometry((KW - 6) * MS, 0.022, wl), bg = new THREE.BoxGeometry(KW * 0.56 * MS, 0.03, bl);
  for (var n = 0; n < 37; n++)(function(n){
    var pc = n % 12, black = [1, 3, 6, 8, 10].indexOf(pc) >= 0, m, mat;
    if (!black){ mat = new THREE.MeshPhongMaterial({ color:0xC4C4BE, emissive:0x161615, shininess:20, specular:0x111111 }); m = new THREE.Mesh(wg, mat); m.position.set(mx(KEY0.x0 + (wi + 0.5) * KW), 0.006, zc); wi++; }
    else { mat = new THREE.MeshPhongMaterial({ color:0x0B0C0E, emissive:0x000000, shininess:16, specular:0x0A0A0A }); m = new THREE.Mesh(bg, mat); m.position.set(mx(KEY0.x0 + wi * KW), 0.02, mz(KEY0.y0) + bl / 2); }
    MFG.add(m);
    var c = { id:'mfk' + n, kind:'key', name:'Key', n:n, black:black, m:m, mat:mat, y0:m.position.y, hov:false, down:0, glow:0, base:black ? 0x000000 : 0x161615, zf:mz(KEY0.y0), len:black ? bl : wl };
    c.hover = function(on){ c.hov = on; };
    MFKEYS.push(c); reg(c, [m]);
  })(n);
})();
// the screen
var mfDispC = mk(320, 152), mfDispT = canvasTex(mfDispC); mfDispT.minFilter = THREE.LinearFilter; mfDispT.magFilter = THREE.LinearFilter;
(function(){
  var d = new THREE.Mesh(new THREE.PlaneGeometry(150 * MS, 71 * MS), new THREE.MeshBasicMaterial({ map:mfDispT })); d.rotation.x = -Math.PI / 2; d.position.set(mx(1016), 0.002, mz(270)); d.userData.noShadow = true; MFG.add(d);
  d.userData.ia = 'trbody'; d.userData.dev = 'mf'; solids.push(d);
})();
HOST = TRG; LX = lx; LZ = lz; DEV = null; FACE = { bg:'#C9C7C0', fg:'#0B0B0D' };
