
/* ================= the bass synth: a two-oscillator mono synth with a sub, laid out from the Bass Station II guide's top-panel drawing ================= */
var BSS = 0.000634;                                   // metres per drawing pixel (457 mm panel, 2x life size)
function bx(px){ return (px - 991) * BSS; }
function bz(py){ return (py - 676.5) * BSS; }
function bmm(px){ return px * BSS / SC; }
var BSH = 1.0, BSTILT = 0.45;
var BSY = new THREE.Group(); BSY.position.set(BSPOS.x, BSH, BSPOS.z); BSY.rotation.y = BSPOS.r; scene.add(BSY);
var BSG = new THREE.Group(); BSG.rotation.x = BSTILT; BSY.add(BSG);
var BSRANGE = ["16'", "8'", "4'", "2'"], BSWAVE = ['Sine', 'Triangle', 'Saw', 'Pulse'], BSNM = ['Up', 'Down', 'UpDn 1', 'UpDn 2', 'Played', 'Random', 'Record', 'Play'], BSLW = ['Tri', 'Saw', 'Square', 'S+H'];

var bsC = mk(2884, 1714), bsTex = null;
function paintBS(){
  var g = bsC.getContext('2d'), k = 2; g.setTransform(k, 0, 0, k, -270 * k, -248 * k);
  g.fillStyle = '#1F2125'; g.fillRect(270, 248, 1442, 857);
  for (var i = 0; i < 7000; i++){ g.fillStyle = 'rgba(' + (Math.random() < .5 ? '0,0,0' : '150,155,165') + ',' + rnd(.02, .06) + ')'; g.fillRect(270 + Math.random() * 1442, 248 + Math.random() * 857, 2, 1); }
  g.fillStyle = '#0C0D0F'; g.fillRect(270, 248, 22, 857); g.fillRect(1690, 248, 22, 857);
  var W = '#E8E8E4', D = '#9A9CA0';
  function T(s, x, y, size, col, anton, align){ g.font = anton ? size + 'px ' + FONT : 'bold ' + size + 'px "Helvetica Neue", Helvetica, Arial, sans-serif'; g.fillStyle = col || W; g.textAlign = align || 'center'; g.textBaseline = 'middle'; g.fillText(s, x, y); }
  function bar(s, x0, x1, y){ g.fillStyle = '#A9ABAE'; g.fillRect(x0, y - 8, x1 - x0, 16); T(s, (x0 + x1) / 2, y + 1, 14, '#08090B', true); }
  function L(x0, y0, x1, y1){ g.strokeStyle = '#B9BBBE'; g.lineWidth = 2; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke(); }
  function dots(x, y, r){ g.fillStyle = W; for (var a = 0; a <= 10; a++){ var an = Math.PI * 0.75 + a / 10 * Math.PI * 1.5; g.beginPath(); g.arc(x + Math.cos(an) * r, y + Math.sin(an) * r, 1.1, 0, 7); g.fill(); } }
  bar('MASTER', 326, 612, 285); bar('OSCILLATORS', 618, 1068, 285); bar('MIXER', 1073, 1250, 285); bar('FILTERS', 1256, 1648, 285);
  bar('ARPEGGIATOR', 330, 614, 599); bar('PORTA', 620, 690, 599); bar('LFOS', 695, 1004, 599); bar('ENVELOPES', 1008, 1482, 599); bar('EFFECTS', 1487, 1648, 599);
  L(328, 448, 1648, 448); L(614, 293, 614, 440); L(1070, 293, 1070, 440); L(1253, 293, 1253, 440); L(616, 455, 616, 590); L(690, 455, 690, 590); L(1484, 455, 1484, 590); L(1004, 455, 1004, 590);
   T('BASS-2', 330, 428, 13, D, true, 'left'); T('Analogue-style Mono Synth', 330, 441, 8.5, W, false, 'left');
  [['Volume', 372, 383], ['Fine', 663, 382], ['Coarse', 738, 382], ['Mod Env depth', 813, 381], ['LFO 1 depth', 888, 381], ['Pulse Width', 964, 380]].forEach(function(a){ T(a[0], a[1], a[2], 9.5); dots(a[1], 342, 29); });
  T('Patch', 543, 366, 9.5); T('Value', 543, 424, 9); T('Range', 663, 418, 9.5); T('Waveform', 739, 418, 9.5);
  BSRANGE.forEach(function(s, i){ T(s, 642 + i * 14.7, 396, 9); }); ['∿', '∧', '∕|', '⊓'].forEach(function(s, i){ T(s, 717 + i * 14.7, 395, 10); });
  T('Pitch', 851, 396, 9.5); T('Oscillator', 845, 417, 9.5); T('1', 819, 433, 9.5); T('2', 871, 433, 9.5); T('Sync 1-2', 912, 417, 9.5); T('on', 917, 433, 8.5);
  T('Mod Env', 941, 393, 8.5); T('LFO 2', 988, 393, 8.5); T('Manual', 965, 428, 9);
  T('Sub Oscillator', 1033, 300, 9); T('Octave', 1046, 310, 9); T('-1', 1025, 328, 9); T('-2', 1025, 346, 9); T('Wave', 1050, 377, 9.5); ['∿', '⊓·', '⊓'].forEach(function(s, i){ T(s, 1027, 394 + i * 16, 9); });
  [['Osc 1', 1108, 361], ['Osc 2', 1218, 359], ['Sub', 1108, 436]].forEach(function(a){ T(a[0], a[1], a[2], 9.5, a[0] === 'Sub' ? W : D); });
  [[1108, 327], [1218, 325], [1108, 400], [1218, 400]].forEach(function(p){ dots(p[0], p[1], 28); });
  T('Ext', 1163, 333, 9.5); T('Ring', 1186, 364, 9.5); T('Noise', 1164, 396, 9.5);
  T('Type', 1303, 300, 9.5); T('Classic', 1277, 309, 8); T('Acid', 1331, 309, 8); T('Slope', 1303, 346, 9.5); T('12dB', 1277, 355, 8); T('24dB', 1332, 355, 8); T('Shape', 1304, 384, 9.5, D); T('LP', 1288, 437, 9); T('BP', 1304, 437, 9); T('HP', 1320, 437, 9);
  [['Resonance', 1383, 362, 325], ['Mod Env depth', 1467, 362, 325], ['Overdrive', 1383, 437, 400], ['LFO 2 depth', 1467, 437, 400]].forEach(function(a){ T(a[0], a[1], a[2], 9.5, a[2] < 400 && a[1] < 1400 ? D : W); dots(a[1], a[3], 28); });
  T('Frequency', 1586, 405, 9.5); dots(1597, 347, 60);
  [['Tempo', 381, 539], ['Rhythm', 470, 539], ['Glide Time', 652, 538]].forEach(function(a){ T(a[0], a[1], a[2], 9.5); });
  T('40', 362, 527, 9); T('240', 404, 527, 9); T('1', 454, 527, 9); T('32', 489, 527, 9); [[372, 494], [462, 494], [648, 494]].forEach(function(p){ dots(p[0], p[1], 29); });
  T('Note Mode', 554, 458, 9); [['UpDn 2', 516, 463], ['UpDn 1', 516, 476], ['Dn', 519, 489], ['Up', 519, 503]].forEach(function(a){ T(a[0], a[1], a[2], 8.5, D, false, 'right'); });
  [['Played', 579, 463], ['Random', 579, 476], ['Record', 584, 489], ['Play', 584, 503]].forEach(function(a){ T(a[0], a[1], a[2], 8.5, D, false, 'left'); });
  T('Arp', 581, 532, 8.5, W, false, 'left'); T('Octaves', 581, 541, 8.5, W, false, 'left'); [['4', 530, 533], ['3', 522, 550], ['2', 523, 566], ['1', 532, 580]].forEach(function(a){ T(a[0], a[1], a[2], 9); }); T('SEQ', 592, 578, 8, D);
  T('Legato', 389, 583, 8, D); T('Rest', 443, 583, 8, D);
  T('LFO 1', 753, 535, 9.5); T('LFO 2', 936, 535, 9.5); T('Delay', 845, 522, 9, D); T('Speed', 845, 577, 9.5);
  ['∧', '∕|', '⊓', 'S+H'].forEach(function(s, i){ T(s, 757, 477 + i * 14.4, 8.5, W, false, 'left'); T(s, 943, 477 + i * 14.4, 8.5, W, false, 'right'); }); dots(795, 495, 28); dots(893, 495, 28);
  T('Env Select', 1088, 478, 9.5); [['Amp Env', 494], ['Mod Env', 511], ['Amp+Mod Env', 528]].forEach(function(a){ T(a[0], 1076, a[1], 9, W, false, 'right'); });
  [['Attack', 1156], ['Decay', 1213.5], ['Sustain', 1272.5], ['Release', 1330]].forEach(function(a){ T(a[0], a[1], 581, 9.5); g.strokeStyle = 'rgba(232,232,228,.6)'; g.lineWidth = 1; for (var q = 0; q <= 10; q++){ var yy = 462 + q * 9.6; g.beginPath(); g.moveTo(a[1] - 23, yy); g.lineTo(a[1] - 9, yy); g.moveTo(a[1] + 9, yy); g.lineTo(a[1] + 23, yy); g.stroke(); } });
  T('Triggering', 1398, 477, 9.5); [['Autoglide', 495], ['Single', 510], ['Multi', 525]].forEach(function(a){ T(a[0], 1435, a[1], 9, W, false, 'left'); });
  T('Distortion', 1531, 532, 9.5); T('Osc Filter Mod', 1606, 532, 9.5); dots(1532, 492, 28); dots(1607, 492, 28);
  T('Exit', 445, 651, 8.5); T('Octave', 405, 668, 9); T('Pitch', 346, 980, 10); T('Mod', 460, 980, 10);
  g.fillStyle = '#0A0B0D'; g.fillRect(508, 660, 1144, 446);
  [346, 460].forEach(function(x){ g.fillStyle = '#060708'; g.fillRect(x - 26, 762, 52, 196); });
  g.setTransform(1, 0, 0, 1, 0, 0); if (bsTex) bsTex.needsUpdate = true;
}
paintBS(); bsTex = smoothTex(bsC);
if (document.fonts && document.fonts.load) document.fonts.load('20px Anton').then(paintBS).catch(function(){});
(function(){
  var W2 = 1442 * BSS, D2 = 857 * BSS, TH = 0.09;
  var top = new THREE.Mesh(new THREE.PlaneGeometry(W2, D2), new THREE.MeshPhongMaterial({ color:0x8C8C8C, map:bsTex, emissive:0xffffff, emissiveMap:bsTex, emissiveIntensity:0.5, shininess:8, specular:0x0A0A0A })); top.rotation.x = -Math.PI / 2; BSG.add(top);
  var body = new THREE.Mesh(new THREE.BoxGeometry(W2 + 0.012, TH, D2 + 0.012), new THREE.MeshPhongMaterial({ color:0x121316, shininess:30, specular:0x222222, flatShading:true })); body.position.y = -TH / 2 - 0.0015; BSG.add(body);
  standFor(BSY, BSG, W2, D2, TH, BSH, BSTILT, 0.4); devBody(BSY, 'bs');
  BLOCKS.push(devBlock(BSPOS, 0.57));
})();

HOST = BSG; LX = bx; LZ = bz; DEV = 'bs'; FACE = { bg:'#3A3D43', fg:'#F0F0EC' };
var BSLED = {}, BK = { h:9 }, BKC = { h:9 };
knob('bsvol', 372, 342, bmm(22), 'Volume', 0.75, BK);
knob('bsfine', 663, 340, bmm(22), 'Fine', 0.5, BK); knob('bscoarse', 738, 340, bmm(22), 'Coarse', 0.5, BK); knob('bspenv', 813, 342, bmm(22), 'Pitch Mod Env depth', 0.5, BK); knob('bsplfo', 888, 340, bmm(22), 'Pitch LFO 1 depth', 0.5, BK); knob('bspw', 964, 340, bmm(22), 'Pulse Width', 0.5, BK);
knob('bsmix1', 1108, 327, bmm(21), 'Osc 1 level', 0.8, BK); knob('bsmix2', 1218, 325, bmm(21), 'Osc 2 level', 0, BK); knob('bssub', 1108, 400, bmm(21), 'Sub level', 0.3, BK); knob('bsnoise', 1218, 400, bmm(21), 'Noise / Ring level', 0, BK);
knob('bsres', 1383, 325, bmm(21), 'Resonance', 0.2, BK); knob('bsfenv', 1467, 325, bmm(21), 'Filter Mod Env depth', 0.7, BK); knob('bsod', 1383, 400, bmm(21), 'Overdrive', 0, BK); knob('bsflfo', 1467, 400, bmm(21), 'Filter LFO 2 depth', 0.5, BK);
knob('bsfreq', 1597, 347, bmm(44), 'Filter Frequency', 0.5, { h:12, color:0xDADAD6, sides:16 });
knob('bstempo', 372, 494, bmm(22), 'Tempo', 0, { h:9, endless:true }); knob('bsrhythm', 462, 494, bmm(22), 'Rhythm', 0, BK).detents = 31;
knob('bsnotemode', 546, 494, bmm(19), 'Note Mode', 0, BK).detents = 7; knob('bsarpoct', 548, 556, bmm(19), 'Arp Octaves', 0, BK).detents = 3;
knob('bsglide', 648, 494, bmm(22), 'Glide Time', 0, BK); knob('bslfo1', 795, 495, bmm(21), 'LFO 1', 0.5, BK); knob('bslfo2', 893, 495, bmm(21), 'LFO 2', 0.4, BK);
knob('bsdist', 1532, 492, bmm(21), 'Distortion', 0, BK); knob('bsofm', 1607, 492, bmm(21), 'Osc Filter Mod', 0, BK);
button('bssave', 468, 385, bmm(40), bmm(18), 'SAVE', 'Save patch', 0xFFFFFF); button('bsprev', 518, 395, bmm(40), bmm(36), '◀', 'Patch down', 0xFFFFFF); button('bsnext', 568, 395, bmm(40), bmm(36), '▶', 'Patch up', 0xFFFFFF);
button('bsrange', 663, 436, bmm(54), bmm(16), ' ', 'Range', 0xFFFFFF); button('bswave', 739, 436, bmm(54), bmm(16), ' ', 'Waveform', 0xFFFFFF);
button('bson', 387, 563, bmm(42), bmm(18), 'ON', 'Arp on (tie when recording)', 0xFFFFFF); button('bslatch', 442, 563, bmm(42), bmm(18), 'LATCH', 'Latch (rest when recording)', 0xFFFFFF);
button('bslfo1w', 713, 498, bmm(16), bmm(52), ' ', 'LFO 1 waveform', 0xFFFFFF); button('bslfo2w', 979, 498, bmm(16), bmm(52), ' ', 'LFO 2 waveform', 0xFFFFFF);
button('bstranspose', 362, 632, bmm(44), bmm(18), 'TRANSPOSE', 'Transpose · then press a key', 0xFFFFFF); button('bsfn', 443, 632, bmm(44), bmm(18), 'FUNCTION', 'Function (Shift)', 0xFFFFFF);
button('bsoctdn', 372, 694, bmm(58), bmm(38), '◀', 'Octave down', 0xFFFFFF); button('bsoctup', 440, 694, bmm(58), bmm(38), '▶', 'Octave up', 0xFFFFFF);
slide('bsoscsel', 852, 433, 2, false, 'Oscillator select'); slide('bspwsrc', 964, 410, 3, false, 'Pulse width source');
slide('bssuboct', 1050, 341, 2, true, 'Sub octave'); slide('bssubwave', 1050, 410, 3, true, 'Sub wave'); slide('bsmixsw', 1163, 363, 3, true, 'Noise / Ring / Ext');
slide('bsftype', 1305, 320, 2, false, 'Filter type'); slide('bsslope', 1305, 364, 2, false, 'Filter slope'); slide('bsshape', 1305, 400, 3, false, 'Filter shape');
slide('bslfomode', 845, 545, 2, true, 'LFO knobs: delay / speed'); slide('bsenvsel', 1090, 510, 3, true, 'Envelope select'); slide('bstrig', 1398, 510, 3, true, 'Triggering');
vfader('bsA', 1156, 462, 558, 'Attack', 0.02); vfader('bsD', 1213.5, 462, 558, 'Decay', 0.4); vfader('bsS', 1272.5, 462, 558, 'Sustain', 0.7); vfader('bsR', 1330, 462, 558, 'Release', 0.2);
vfader('bspitch', 346, 775, 945, 'Pitch wheel', 0.5, { w:0.026, h:0.014, d:0.02, color:0x2A2C30, stripe:0xE8E8E4 }); vfader('bsmod', 460, 775, 945, 'Mod wheel', 0, { w:0.026, h:0.014, d:0.02, color:0x2A2C30, stripe:0xE8E8E4 });
(function(){
  var r = 0.0028, i;
  for (i = 0; i < 4; i++){ ledAt(BSLED, 'rg' + i, 642 + i * 14.7, 407, r); ledAt(BSLED, 'wv' + i, 717 + i * 14.7, 407, r); ledAt(BSLED, 'la' + i, 742, 477 + i * 14.4, r, 0xFFD24A); ledAt(BSLED, 'lb' + i, 950, 477 + i * 14.4, r, 0xFFD24A); }
  ledAt(BSLED, 'sync', 905, 433, r); ledAt(BSLED, 'so0', 1014, 328, r); ledAt(BSLED, 'so1', 1014, 346, r);
  for (i = 0; i < 3; i++){ ledAt(BSLED, 'sw' + i, 1014, 394 + i * 16, r); ledAt(BSLED, 'sh' + i, 1288 + i * 16, 424, r); ledAt(BSLED, 'tg' + i, 1427, 495 + i * 15, r); }
  ledAt(BSLED, 'ft0', 1277, 300, r); ledAt(BSLED, 'ft1', 1331, 300, r); ledAt(BSLED, 'sl0', 1277, 346, r); ledAt(BSLED, 'sl1', 1332, 346, r);
  ledAt(BSLED, 'on', 349, 563, r); ledAt(BSLED, 'latch', 486, 563, r); ledAt(BSLED, 'tempo', 414, 471, r, 0xFF3A2A);
})();
var BSKEYS = keybed('bsk', 25, 516, 1644, 666, 1100, BSS);
var bsDispC = mk(288, 100), bsDispT = canvasTex(bsDispC); bsDispT.minFilter = THREE.LinearFilter; bsDispT.magFilter = THREE.LinearFilter;
(function(){ var d = new THREE.Mesh(new THREE.PlaneGeometry(143 * BSS, 50 * BSS), new THREE.MeshBasicMaterial({ map:bsDispT })); d.rotation.x = -Math.PI / 2; d.position.set(bx(519.5), 0.002, bz(329)); d.userData.noShadow = true; d.userData.ia = 'trbody'; d.userData.dev = 'bs'; BSG.add(d); solids.push(d); })();
HOST = TRG; LX = lx; LZ = lz; DEV = null; FACE = { bg:'#C9C7C0', fg:'#0B0B0D' };

/* ---- patches + state ---- */
function bsP(name, o){
  var p = { name:name, o:[{ range:1, wave:2, coarse:0.5, fine:0.5, penv:0.5, plfo:0.5, pw:0.5 }, { range:1, wave:2, coarse:0.5, fine:0.53, penv:0.5, plfo:0.5, pw:0.5 }], pwsrc:1, suboct:0, subwave:0,
    mix1:0.8, mix2:0, sub:0.3, nlev:0, mixsw:2, ftype:0, slope:1, shape:0, freq:0.5, res:0.2, od:0, fenv:0.7, flfo:0.5, amp:{ a:0.01, d:0.4, s:0.7, r:0.2 }, mod:{ a:0.01, d:0.35, s:0.2, r:0.2 }, trig:1, glide:0,
    l1:{ rate:0.5, wave:0, delay:0 }, l2:{ rate:0.4, wave:0, delay:0 }, dist:0, ofm:0 };
  Object.keys(o || {}).forEach(function(k){ if (k === 'o1') Object.assign(p.o[0], o[k]); else if (k === 'o2') Object.assign(p.o[1], o[k]); else if (typeof o[k] === 'object') Object.assign(p[k], o[k]); else p[k] = o[k]; });
  return p;
}
function bsFactory(){ return [
  bsP('Round Bass', { o1:{ wave:2 }, sub:0.5, freq:0.42, res:0.2, fenv:0.72, mod:{ d:0.35, s:0.1 } }),
  bsP('Acid Line', { o1:{ wave:2 }, sub:0, ftype:1, freq:0.36, res:0.8, fenv:0.82, od:0.3, amp:{ d:0.3, s:0.4, r:0.1 }, mod:{ a:0.005, d:0.28, s:0, r:0.15 }, glide:0.25, trig:0, dist:0.15 }),
  bsP('Reese', { o1:{ wave:2 }, o2:{ wave:2, fine:0.58 }, mix2:0.8, sub:0.35, freq:0.4, res:0.1, fenv:0.5, flfo:0.62, l2:{ rate:0.15 }, amp:{ a:0.02, s:1, r:0.25 } }),
  bsP('Square Sub', { o1:{ wave:3, pw:0 }, pwsrc:1, sub:0.8, subwave:2, suboct:1, freq:0.3, fenv:0.6, amp:{ s:0.9, r:0.12 } }),
  bsP('Pluck', { o1:{ wave:2 }, o2:{ wave:3, range:2, pw:0.3 }, mix2:0.5, sub:0.2, freq:0.3, res:0.35, fenv:0.85, amp:{ a:0.003, d:0.3, s:0, r:0.25 }, mod:{ a:0.003, d:0.22, s:0, r:0.2 }, trig:2 }),
  bsP('Wobble', { o1:{ wave:2 }, o2:{ wave:3, pw:0.2, fine:0.47 }, mix2:0.7, sub:0.5, freq:0.38, res:0.45, fenv:0.5, flfo:0.85, l2:{ rate:0.52, wave:0 }, amp:{ s:1, r:0.15 }, dist:0.2 }),
  bsP('PWM Lead', { o1:{ wave:3, range:2, pw:0.6 }, o2:{ wave:3, range:2, pw:0.5, fine:0.54 }, pwsrc:2, mix2:0.7, sub:0, freq:0.62, res:0.25, fenv:0.6, l2:{ rate:0.35 }, glide:0.2, trig:0, amp:{ a:0.01, s:0.8, r:0.3 } }),
  bsP('Ring Zap', { o1:{ wave:0, range:2 }, o2:{ wave:1, range:2, coarse:0.79 }, mix1:0.5, mix2:0, nlev:0.8, mixsw:1, sub:0.2, freq:0.6, res:0.3, fenv:0.8, mod:{ d:0.3, s:0 }, amp:{ d:0.4, s:0.2, r:0.3 } })
]; }
var BS = { presets:bsFactory(), cur:0, p:null, oscSel:0, envSel:0, lfoMode:1, fn:false, oct:0, transp:0, trArm:false, arpOn:false, latch:false, rhythm:0, noteMode:0, arpOct:1,
  down:{}, latched:{}, order:[], stack:[], holdN:null, cur_n:null, f:[110, 110], noteT:0, vis:[], arpI:0, seqI:0, recFresh:false, lastKey:48, lastVel:0.8,
  seqs:[[{ n:48 }, { n:48 }, { n:60 }, { n:48 }, { rest:1 }, { n:51 }, { n:48 }, { n:55 }, { n:48 }, { n:48 }, { n:58 }, { n:60 }, { rest:1 }, { n:51 }, { n:53 }, { n:46 }], [], [], []],
  lph:[0, 0], lsh:[0, 0], lval:[0, 0], msg:'', msgUntil:0, dirty:true, kb:{}, kbOct:0 };
if (DEF && DEF.bass && Array.isArray(DEF.bass.seqs) && DEF.bass.seqs.length === 4 && DEF.bass.seqs.every(function(q){ return Array.isArray(q) && q.length; })) BS.seqs = defCopy(DEF.bass.seqs);
var BSSEQ0 = JSON.stringify(BS.seqs);
BS.p = JSON.parse(JSON.stringify(BS.presets[0]));
var BSRH = (function(){ var b = ['xxxxxxxxxxxxxxxx', 'x-x-x-x-x-x-x-x-', 'x--x--x-x--x--x-', 'x-xxx-xxx-xxx-xx', 'xx-xxx-xxx-xxx-x', 'x--xx--xx--xx--x', 'x-x-x-xxx-x-x-xx', 'x---x---x---x---', 'x-xx-x-xx-xx-x-x', 'xxx-xxx-xxx-xxx-', 'x--x-x--x--x-x--', '-x-x-x-x-x-x-x-x', 'x-x--x-xx-x--x-x', 'xx--xx--xx--xx--', 'x---x-x-x---x-xx', 'x-xxx---x-xxx---'], out = b.slice();
  b.forEach(function(s){ out.push(s.slice(13) + s.slice(0, 13)); }); return out; })();
var BSSAVE = 'jambutek-studio-bass-v1', bsSaveT = null;
function bsSave(){ store(BSSAVE, JSON.stringify({ v:1, presets:BS.presets, cur:BS.cur, p:BS.p, seqs:BS.seqs, vol:CT.bsvol.v, rhythm:BS.rhythm, noteMode:BS.noteMode, arpOct:BS.arpOct })); }
function bsSaveSoon(){ clearTimeout(bsSaveT); bsSaveT = setTimeout(bsSave, saveMs(1200)); }
function bsRestore(){ try { var s = JSON.parse(store(BSSAVE) || 'null'); if (!s || s.v !== 1 || !Array.isArray(s.presets) || s.presets.length !== BS.presets.length || !s.p || !s.p.o || !s.p.amp) return;
  BS.presets = s.presets; BS.cur = clamp(s.cur | 0, 0, 7); BS.p = s.p; if (Array.isArray(s.seqs) && s.seqs.length === 4) BS.seqs = s.seqs; if (typeof s.vol === 'number') CT.bsvol.v = clamp(s.vol, 0, 1);
  BS.rhythm = clamp(s.rhythm | 0, 0, 31); BS.noteMode = clamp(s.noteMode | 0, 0, 7); if (BS.noteMode === 6) BS.noteMode = 7; BS.arpOct = clamp(s.arpOct | 0 || 1, 1, 4); } catch (e) {} } bsRestore();

function bsSay(m, ms){ BS.msg = String(m); BS.msgUntil = performance.now() + (ms || 1300); BS.dirty = true; }
function bip(v){ var n = Math.round((v - 0.5) * 126); return (n > 0 ? '+' : '') + n; }
function bsTime(v, k){ var s = k === 'a' ? 0.001 + v * v * v * 5 : 0.003 + v * v * v * 10; return s < 1 ? Math.round(s * 1000) + ' ms' : s.toFixed(1) + ' s'; }
function bsLfoHz(v){ return 0.1 * Math.pow(2, v * 7); }
function bsEnvs(){ return BS.envSel === 0 ? [BS.p.amp] : BS.envSel === 1 ? [BS.p.mod] : [BS.p.amp, BS.p.mod]; }
function bsInfo(c){                                   // [name, value as text, short value for the 3-character display]
  var id = c.id, P = BS.p, o = P.o[BS.oscSel], n = 'Osc ' + (BS.oscSel + 1) + ' ', v = c.v, e = bsEnvs()[0], en = ['Amp ', 'Mod ', 'Amp+Mod '][BS.envSel], l = id === 'bslfo1' ? P.l1 : P.l2;
  switch (id){
    case 'bsfine': return [n + 'Fine', Math.round((v - 0.5) * 200) + ' cents', bip(v)]; case 'bscoarse': var st = Math.round((v - 0.5) * 24); return [n + 'Coarse', (st > 0 ? '+' : '') + st + ' semi', String(st)];
    case 'bspenv': return [n + 'Pitch Mod Env', bip(v), bip(v)]; case 'bsplfo': return [n + 'Pitch LFO 1', bip(v), bip(v)];
    case 'bspw': return [n + (P.pwsrc === 1 ? 'Pulse Width' : P.pwsrc === 0 ? 'PWM by Mod Env' : 'PWM by LFO 2'), P.pwsrc === 1 ? Math.round(50 - v * 45) + '%' : String(Math.round(v * 127)), String(Math.round(v * 127))];
    case 'bstempo': return ['Tempo', M.bpm.toFixed(1) + ' BPM · shared', String(Math.round(M.bpm))];
    case 'bsrhythm': return ['Rhythm', String(BS.rhythm + 1), String(BS.rhythm + 1)]; case 'bsnotemode': return ['Note Mode', BSNM[BS.noteMode], BSNM[BS.noteMode].slice(0, 3)];
    case 'bsarpoct': return [BS.noteMode >= 6 ? 'Sequence' : 'Arp Octaves', String(BS.arpOct), String(BS.arpOct)];
    case 'bslfo1': case 'bslfo2': return ['LFO ' + (id === 'bslfo1' ? 1 : 2) + (BS.lfoMode ? ' Speed' : ' Delay'), BS.lfoMode ? bsLfoHz(l.rate).toFixed(2) + ' Hz' : (l.delay * 4).toFixed(1) + ' s', String(Math.round(v * 127))];
    case 'bsfreq': return ['Filter Frequency', Math.round(30 * Math.pow(2, v * 9.3)) + ' Hz', String(Math.round(v * 127))];
    case 'bsfenv': case 'bsflfo': return [c.name, bip(v), bip(v)];
    case 'bsA': return [en + 'Attack', bsTime(e.a, 'a'), String(Math.round(v * 127))]; case 'bsD': return [en + 'Decay', bsTime(e.d), String(Math.round(v * 127))];
    case 'bsS': return [en + 'Sustain', String(Math.round(v * 127)), String(Math.round(v * 127))]; case 'bsR': return [en + 'Release', bsTime(e.r), String(Math.round(v * 127))];
    case 'bsnoise': return [['Ext In', 'Ring Mod', 'Noise'][P.mixsw] + ' level', P.mixsw === 0 ? 'nothing plugged in' : String(Math.round(v * 127)), String(Math.round(v * 127))];
    case 'bspitch': return ['Pitch wheel', bip(v), bip(v)];
  }
  return [c.name, String(Math.round(v * 127)), String(Math.round(v * 127))];
}
var BSSWN = { bsoscsel:['Osc 1', 'Osc 2'], bspwsrc:['Mod Env', 'Manual', 'LFO 2'], bssuboct:['-1 octave', '-2 octaves'], bssubwave:['Sine', 'Narrow pulse', 'Square'], bsmixsw:['Ext', 'Ring', 'Noise'], bsftype:['Classic', 'Acid'], bsslope:['12 dB', '24 dB'],
  bsshape:['Low pass', 'Band pass', 'High pass'], bslfomode:['Delay', 'Speed'], bsenvsel:['Amp Env', 'Mod Env', 'Amp + Mod Env'], bstrig:['Autoglide', 'Single', 'Multi'] };
function bsLabel(c){
  if (c.kind === 'key'){ var n = bsNote(c.n); return NOTEN[((n % 12) + 12) % 12] + (Math.floor(n / 12) - 1); }
  if (c.kind === 'knob' || c.kind === 'fader'){ var i = bsInfo(c); return i[0] + ' ' + i[1] + ' · scroll or drag'; }
  if (c.sw) return c.name + ': ' + BSSWN[c.id][c.pos] + ' · click';
  if (c.id === 'bsrange') return 'Osc ' + (BS.oscSel + 1) + ' Range ' + BSRANGE[BS.p.o[BS.oscSel].range]; if (c.id === 'bswave') return 'Osc ' + (BS.oscSel + 1) + ' Waveform: ' + BSWAVE[BS.p.o[BS.oscSel].wave];
  if (c.id === 'bslfo1w') return 'LFO 1 waveform: ' + BSLW[BS.p.l1.wave]; if (c.id === 'bslfo2w') return 'LFO 2 waveform: ' + BSLW[BS.p.l2.wave];
  return c.name;
}
function bsPaintDisp(){
  var g = bsDispC.getContext('2d'), now = performance.now(); g.fillStyle = '#060607'; g.fillRect(0, 0, 288, 100);
  var s = now < BS.msgUntil ? BS.msg : 'P' + ('0' + (BS.cur + 1)).slice(-2);
  g.font = 'italic bold 78px "Courier New", monospace'; g.textAlign = 'right'; g.textBaseline = 'middle'; g.fillStyle = '#F4F4F0'; g.shadowColor = '#FFFFFF'; g.shadowBlur = 8; g.fillText(s.slice(0, 4), 236, 54, 220); g.shadowBlur = 0;
  bsDispT.needsUpdate = true;
}
function bsSync(){
  var P = BS.p, o = P.o[BS.oscSel], e = bsEnvs()[0];
  var m = { bsfine:o.fine, bscoarse:o.coarse, bspenv:o.penv, bsplfo:o.plfo, bspw:o.pw, bsmix1:P.mix1, bsmix2:P.mix2, bssub:P.sub, bsnoise:P.nlev, bsres:P.res, bsfenv:P.fenv, bsod:P.od, bsflfo:P.flfo, bsfreq:P.freq, bsglide:P.glide,
    bsdist:P.dist, bsofm:P.ofm, bsA:e.a, bsD:e.d, bsS:e.s, bsR:e.r, bslfo1:BS.lfoMode ? P.l1.rate : P.l1.delay, bslfo2:BS.lfoMode ? P.l2.rate : P.l2.delay, bsrhythm:BS.rhythm / 31, bsnotemode:BS.noteMode / 7, bsarpoct:(BS.arpOct - 1) / 3 };
  Object.keys(m).forEach(function(k){ CT[k].v = m[k]; CT[k].show(); }); CT.bsvol.show();
  var s = { bsoscsel:BS.oscSel, bspwsrc:P.pwsrc, bssuboct:P.suboct, bssubwave:P.subwave, bsmixsw:P.mixsw, bsftype:P.ftype, bsslope:P.slope, bsshape:P.shape, bslfomode:BS.lfoMode, bsenvsel:BS.envSel, bstrig:P.trig };
  Object.keys(s).forEach(function(k){ CT[k].set(s[k]); }); BS.dirty = true;
}
bsSync();

/* ---- audio: the oscillators run all the time; a note sets their pitch and opens the envelopes ---- */
var BSA = null;
function bsAudio(){
  if (BSA) return true; unlock(); if (!AU.ready) return false;
  var A = {}, t = ac.currentTime;
  function G(v){ var g = ac.createGain(); g.gain.value = v; return g; }
  function K(v){ var c = ac.createConstantSource(); c.offset.value = v; c.start(); return c; }
  function pulseWave(d){ var n = 48, re = new Float32Array(n), im = new Float32Array(n); for (var h = 1; h < n; h++) re[h] = 2 / (h * Math.PI) * Math.sin(h * Math.PI * d); return ac.createPeriodicWave(re, im); }
  A.bend = K(0); A.l1 = K(0); A.l2 = K(0); A.menv = K(0); A.narrow = pulseWave(0.2);
  A.bus = G(1);
  A.o = [0, 1].map(function(){ var o = ac.createOscillator(), dir = G(1), dl = ac.createDelay(0.1), inv = G(0), out = G(0), l1g = G(0), peg = G(0), pwl = G(0), pwe = G(0);
    o.type = 'sawtooth'; o.frequency.value = 110; o.connect(dir); dir.connect(out); o.connect(dl); dl.connect(inv); inv.connect(out); out.connect(A.bus);
    A.bend.connect(o.detune); A.l1.connect(l1g); l1g.connect(o.detune); A.menv.connect(peg); peg.connect(o.detune); A.l2.connect(pwl); pwl.connect(dl.delayTime); A.menv.connect(pwe); pwe.connect(dl.delayTime); o.start();
    return { o:o, dl:dl, inv:inv, out:out, l1g:l1g, peg:peg, pwl:pwl, pwe:pwe }; });
  A.sub = ac.createOscillator(); A.sub.frequency.value = 55; A.subG = G(0); A.sub.connect(A.subG); A.subG.connect(A.bus); A.bend.connect(A.sub.detune); A.o[0].l1g.connect(A.sub.detune); A.o[0].peg.connect(A.sub.detune); A.sub.start();
  A.nz = ac.createBufferSource(); A.nz.buffer = AU.noise; A.nz.loop = true; A.nG = G(0); A.nz.connect(A.nG); A.nG.connect(A.bus); A.nz.start();
  A.ring = G(0); A.ringG = G(0); A.o[0].o.connect(A.ring); A.o[1].o.connect(A.ring.gain); A.ring.connect(A.ringG); A.ringG.connect(A.bus);
  var sh = new Float32Array(2048); for (var k = 0; k < 2048; k++){ var x = k / 1024 - 1; sh[k] = Math.tanh(x * 2.5) / Math.tanh(2.5); }
  A.odPre = G(1); A.odWs = ac.createWaveShaper(); A.odWs.curve = sh; A.odWs.oversample = '2x'; A.odPost = G(1);
  A.f1 = ac.createBiquadFilter(); A.f2 = ac.createBiquadFilter(); A.fe = G(0); A.fl = G(0); A.ofm = G(0);
  A.menv.connect(A.fe); A.l2.connect(A.fl); A.o[1].o.connect(A.ofm); [A.f1, A.f2].forEach(function(f){ A.fe.connect(f.detune); A.fl.connect(f.detune); A.ofm.connect(f.detune); });
  A.vca = G(0); A.dPre = G(1); A.dWs = ac.createWaveShaper(); A.dWs.curve = sh; A.dWs.oversample = '2x'; A.dPost = G(1); A.vol = G(0.3);
  A.bus.connect(A.odPre); A.odPre.connect(A.odWs); A.odWs.connect(A.odPost); A.odPost.connect(A.f1); A.f1.connect(A.f2); A.f2.connect(A.vca); A.vca.connect(A.dPre); A.dPre.connect(A.dWs); A.dWs.connect(A.dPost); A.dPost.connect(A.vol); A.vol.connect(AU.ch[2].inp);
  BSA = A; bsApply(true); return true;
}
function bsDuty(o){ return BS.p.pwsrc === 1 ? 0.5 - o.pw * 0.45 : 0.5; }
function bsApply(init){
  if (!BSA) return; var A = BSA, P = BS.p, t = ac.currentTime, mw = CT.bsmod.v;
  function S(p, v){ if (init) p.value = v; else p.setTargetAtTime(v, t, 0.015); }
  P.o.forEach(function(o, k){ var N = A.o[k], ty = ['sine', 'triangle', 'sawtooth', 'sawtooth'][o.wave], f = BS.f[k]; if (N.o.type !== ty) N.o.type = ty;
    S(N.inv.gain, o.wave === 3 ? -1 : 0); S(N.dl.delayTime, Math.min(0.09, bsDuty(o) / f)); S(N.o.detune, (o.fine - 0.5) * 200);
    var ld = (o.plfo - 0.5) * 2, pd = (o.penv - 0.5) * 2; S(N.l1g.gain, ld * Math.abs(ld) * 1200 + mw * 60); S(N.peg.gain, pd * Math.abs(pd) * 2400);
    S(N.pwl.gain, o.wave === 3 && P.pwsrc === 2 ? o.pw * 0.4 / f : 0); S(N.pwe.gain, o.wave === 3 && P.pwsrc === 0 ? -o.pw * 0.42 / f : 0);
    S(N.out.gain, Math.pow(k ? P.mix2 : P.mix1, 2) * 0.55); });
  var st = ['sine', null, 'square'][P.subwave]; if (st){ if (A.sub.type !== st) A.sub.type = st; } else if (A.subT !== 'n') A.sub.setPeriodicWave(A.narrow); A.subT = st ? 's' : 'n';
  S(A.sub.detune, (P.o[0].fine - 0.5) * 200); S(A.subG.gain, P.sub * P.sub * 0.7);
  S(A.nG.gain, P.mixsw === 2 ? P.nlev * P.nlev * 0.5 : 0); S(A.ringG.gain, P.mixsw === 1 ? P.nlev * P.nlev * 0.7 : 0);
  S(A.odPre.gain, 1 + P.od * 9); S(A.odPost.gain, 1 / (1 + P.od * 2.2));
  var fty = P.ftype ? 'lowpass' : ['lowpass', 'bandpass', 'highpass'][P.shape], hz = 30 * Math.pow(2, P.freq * 9.3), two = P.ftype || P.slope;
  if (A.f1.type !== fty) A.f1.type = fty; var t2 = two ? fty : 'allpass'; if (A.f2.type !== t2) A.f2.type = t2;
  S(A.f1.frequency, hz); S(A.f2.frequency, hz); S(A.f1.Q, P.ftype ? 0.6 + P.res * P.res * 26 : 0.6 + P.res * P.res * 16); S(A.f2.Q, P.ftype ? 0.9 + P.res * 2 : 0.6);
  var fd = (P.fenv - 0.5) * 2, fl = (P.flfo - 0.5) * 2; S(A.fe.gain, fd * Math.abs(fd) * 8400); S(A.fl.gain, fl * Math.abs(fl) * 4800); S(A.ofm.gain, P.ofm * P.ofm * 4800);
  S(A.dPre.gain, 1 + P.dist * 24); S(A.dPost.gain, 1 / (1 + P.dist * 3)); S(A.vol.gain, Math.pow(CT.bsvol.v, 1.6) * 0.62);
}
function bsNote(keyIx){ return 36 + BS.oct * 12 + BS.transp + keyIx; }
function bsPitch(n, t, gl){
  var A = BSA, P = BS.p;
  P.o.forEach(function(o, k){ var f = mtof(n + (o.range - 1) * 12 + Math.round((o.coarse - 0.5) * 24)); BS.f[k] = f; var fp = A.o[k].o.frequency;
    if (gl > 0){ fp.setTargetAtTime(f, t, gl / 3); } else fp.setValueAtTime(f, t);
    if (o.wave === 3) A.o[k].dl.delayTime.setValueAtTime(Math.min(0.09, bsDuty(o) / f), t); });
  var sf = BS.f[0] / (P.suboct ? 4 : 2); if (gl > 0) A.sub.frequency.setTargetAtTime(sf, t, gl / 3); else A.sub.frequency.setValueAtTime(sf, t);
}
function bsEnvOn(t, vel, dur){
  var A = BSA, P = BS.p, lv = 0.45 + 0.55 * vel;
  [[A.vca.gain, P.amp, lv], [A.menv.offset, P.mod, 1]].forEach(function(e){ var a = 0.001 + Math.pow(e[1].a, 3) * 5, d = 0.003 + Math.pow(e[1].d, 3) * 10;
    e[0].cancelScheduledValues(t); e[0].setTargetAtTime(e[2], t, Math.max(0.0008, a / 4)); if (dur == null || a < dur) e[0].setTargetAtTime(e[1].s * e[2], t + a, d / 3); });
}
function bsEnvOff(t, cancel){
  var A = BSA, P = BS.p;
  [[A.vca.gain, P.amp], [A.menv.offset, P.mod]].forEach(function(e){ if (cancel) e[0].cancelScheduledValues(t); e[0].setTargetAtTime(0, t, (0.003 + Math.pow(e[1].r, 3) * 10) / 3); });
}
function bsGate(n, vel, t, legato, dur){
  var P = BS.p, gl = P.glide * P.glide * 2, useGl = gl > 0.004 && BS.cur_n != null && (P.trig !== 0 || legato);
  bsPitch(n, t, useGl ? gl : 0); if (!(legato && P.trig !== 2)) bsEnvOn(t, vel, dur); BS.cur_n = n; BS.noteT = t;
}
function bsNoteAt(n, vel, t, dur, tied){ bsGate(n, vel, t, !!tied, dur); bsEnvOff(t + dur, false); BS.vis.push({ t:t, n:n, d:dur }); }
function bsHeld(){ return BS.order.filter(function(n){ return BS.down[n] || BS.latched[n]; }); }
function bsKeyDown(n, vel){
  if (!bsAudio()) return; vel = vel || 0.8; var t = ac.currentTime + 0.003;
  if (BS.trArm){ BS.transp = clamp(n - (36 + BS.oct * 12 + BS.transp) - 12, -12, 12); BS.trArm = false; bsSay((BS.transp > 0 ? '+' : '') + BS.transp, 1600); return; }
  if (BS.arpOn && BS.noteMode === 6){ var sq = BS.seqs[BS.arpOct - 1]; if (BS.recFresh){ sq.length = 0; BS.recFresh = false; } if (sq.length < 32) sq.push({ n:n }); bsSay(sq.length); bsNoteAt(n, vel, t, 0.22); bsSaveSoon(); return; }
  BS.lastKey = n; BS.lastVel = vel;
  if (BS.latch && BS.arpOn){ if (BS.latched[n]){ delete BS.latched[n]; BS.order = BS.order.filter(function(q){ return q !== n; }); return; } BS.latched[n] = 1; BS.order.push(n); if (!M.playing) bsNoteAt(n, vel, t, 0.2); return; }
  if (BS.latch){ if (BS.holdN === n){ bsEnvOff(t, true); BS.holdN = null; return; } var leg = BS.holdN != null; BS.holdN = n; bsGate(n, vel, t, leg); return; }
  BS.down[n] = 1; BS.order = BS.order.filter(function(q){ return q !== n; }); BS.order.push(n);
  if (BS.arpOn && M.playing) return;
  var legato = BS.stack.length > 0; BS.stack = BS.stack.filter(function(q){ return q !== n; }); BS.stack.push(n); bsGate(n, vel, t, legato);
}
function bsKeyUp(n){
  if (!BS.down[n] || !BSA) return; delete BS.down[n]; BS.order = BS.order.filter(function(q){ return q !== n || BS.latched[n]; });
  var was = BS.stack.indexOf(n) >= 0; BS.stack = BS.stack.filter(function(q){ return q !== n; }); if (!was) return;
  var t = ac.currentTime + 0.003; if (BS.stack.length) bsGate(BS.stack[BS.stack.length - 1], BS.lastVel, t, true); else bsEnvOff(t, true);
}
function bsAllOff(){ BS.down = {}; BS.latched = {}; BS.order = []; BS.stack = []; BS.holdN = null; if (BSA) bsEnvOff(ac.currentTime, true); }
function bsClock(t, N, sd, sw){                       // one call per 16th from the drum machine
  if (!BS.arpOn || !BSA) return; var tt = t + (N % 2 ? sw * sd : 0), h = bsHeld(), vel = BS.lastVel;
  if (BS.noteMode === 6) return;
  if (BS.noteMode === 7){
    var sq = BS.seqs[BS.arpOct - 1]; if (!sq.length || !h.length) { BS.seqI = 0; return; }
    var st = sq[BS.seqI % sq.length], nx = sq[(BS.seqI + 1) % sq.length]; BS.seqI++; if (st.rest) return;
    bsNoteAt(st.n + (h[h.length - 1] - 48), vel, tt, nx && nx.tie ? sd * 1.15 : sd * 0.55, st.tie); return;
  }
  if (!h.length){ BS.arpI = 0; return; } if (BSRH[BS.rhythm][N % 16] !== 'x') return;
  var base = BS.noteMode === 4 ? h.slice() : h.slice().sort(function(a, b){ return a - b; }), all = []; for (var o = 0; o < BS.arpOct; o++) base.forEach(function(q){ all.push(q + 12 * o); });
  var L = all.length, i = BS.arpI++, m = BS.noteMode, n;
  if (m === 1) n = all[L - 1 - (i % L)]; else if (m === 2){ var per = Math.max(1, 2 * L - 2), q = i % per; n = all[q < L ? q : per - q]; } else if (m === 3){ var p2 = 2 * L, q2 = i % p2; n = all[q2 < L ? q2 : p2 - 1 - q2]; } else if (m === 5) n = all[(Math.random() * L) | 0]; else n = all[i % L];
  bsNoteAt(n, vel, tt, sd * 0.55);
}
function bsOnStart(){ BS.arpI = 0; BS.seqI = 0; if (BS.arpOn && BSA && BS.stack.length){ BS.stack = []; bsEnvOff(ac.currentTime, true); } }
function bsOnStop(){ BS.vis = []; if (BSA && BS.arpOn) bsEnvOff(ac.currentTime, true); }
function bsTempo(){ BS.dirty = true; }

/* ---- every control ---- */
function bsCtl(c){
  var id = c.id, P = BS.p, o = P.o[BS.oscSel], v = c.v, OK = { bsfine:'fine', bscoarse:'coarse', bspenv:'penv', bsplfo:'plfo', bspw:'pw' }, PK = { bsmix1:'mix1', bsmix2:'mix2', bssub:'sub', bsnoise:'nlev', bsres:'res', bsod:'od', bsfenv:'fenv', bsflfo:'flfo', bsfreq:'freq', bsglide:'glide', bsdist:'dist', bsofm:'ofm' }, EK = { bsA:'a', bsD:'d', bsS:'s', bsR:'r' };
  if ((id === 'bspenv' || id === 'bsplfo' || id === 'bsfenv' || id === 'bsflfo' || id === 'bsfine' || id === 'bscoarse') && Math.abs(v - 0.5) < 0.02) v = 0.5;
  if (OK[id]) o[OK[id]] = v; else if (PK[id]) P[PK[id]] = v; else if (EK[id]) bsEnvs().forEach(function(e){ e[EK[id]] = v; });
  else if (id === 'bslfo1' || id === 'bslfo2'){ var l = id === 'bslfo1' ? P.l1 : P.l2; if (BS.lfoMode) l.rate = v; else l.delay = v; }
  else if (id === 'bsrhythm') BS.rhythm = Math.round(v * 31); else if (id === 'bsarpoct'){ BS.arpOct = 1 + Math.round(v * 3); BS.seqI = 0; }
  else if (id === 'bsnotemode'){ var nm = Math.round(v * 7); if (nm !== BS.noteMode){ BS.noteMode = nm; BS.arpI = 0; BS.seqI = 0; BS.recFresh = nm === 6; } }
  bsApply(); var i = bsInfo(c); bsSay(i[2]); if (id !== 'bspitch' && id !== 'bsmod') bsSaveSoon();
}
function bsTurn(c, n){ if (c.id === 'bstempo'){ setBpm(M.bpm + n); bsSay(Math.round(M.bpm)); } }
function bsLoad(i){ BS.cur = (i + BS.presets.length) % BS.presets.length; BS.p = JSON.parse(JSON.stringify(BS.presets[BS.cur])); bsSync(); bsApply(); BS.msgUntil = 0; BS.dirty = true; bsSaveSoon(); toast('Bass patch ' + (BS.cur + 1) + ' · ' + BS.p.name); }
function bsPress(c){
  var id = c.id, P = BS.p, o = P.o[BS.oscSel]; BS.dirty = true;
  if (c.kind === 'key'){ var vel = 0.8; if (c._hit){ var lp = BSG.worldToLocal(c._hit.point.clone()); vel = clamp(0.4 + 0.6 * (lp.z - c.zf) / c.len, 0.35, 1); } c.note = bsNote(c.n); bsKeyDown(c.note, vel); return; }
  if (c.sw){
    var np = (c.pos + 1) % c.n; c.set(np);
    switch (id){ case 'bsoscsel': BS.oscSel = np; break; case 'bspwsrc': P.pwsrc = np; break; case 'bssuboct': P.suboct = np; break; case 'bssubwave': P.subwave = np; break; case 'bsmixsw': P.mixsw = np; break;
      case 'bsftype': P.ftype = np; break; case 'bsslope': P.slope = np; break; case 'bsshape': P.shape = np; break; case 'bslfomode': BS.lfoMode = np; break; case 'bsenvsel': BS.envSel = np; break; case 'bstrig': P.trig = np; break; }
    bsSync(); bsApply(); toast(c.name + ': ' + BSSWN[id][np]); bsSaveSoon(); return;
  }
  switch (id){
    case 'bsprev': case 'bsnext': bsLoad(BS.cur + (id === 'bsnext' ? 1 : -1)); return;
    case 'bssave': BS.presets[BS.cur] = JSON.parse(JSON.stringify(P)); bsSave(); bsSay('SAV'); toast('Bass patch ' + (BS.cur + 1) + ' saved'); return;
    case 'bsrange': o.range = (o.range + 1) % 4; bsSay(BSRANGE[o.range]); if (BSA && BS.cur_n != null) bsPitch(BS.cur_n, ac.currentTime, 0); bsSaveSoon(); return;
    case 'bswave': o.wave = (o.wave + 1) % 4; bsApply(); toast('Osc ' + (BS.oscSel + 1) + ': ' + BSWAVE[o.wave]); bsSaveSoon(); return;
    case 'bslfo1w': P.l1.wave = (P.l1.wave + 1) % 4; toast('LFO 1: ' + BSLW[P.l1.wave]); bsSaveSoon(); return;
    case 'bslfo2w': P.l2.wave = (P.l2.wave + 1) % 4; toast('LFO 2: ' + BSLW[P.l2.wave]); bsSaveSoon(); return;
    case 'bson':
      if (BS.arpOn && BS.noteMode === 6){ var sq = BS.seqs[BS.arpOct - 1]; if (sq.length){ sq[sq.length - 1].tie = 1; bsSay('tIE'); } return; }
      BS.arpOn = !BS.arpOn; bsAllOff(); BS.arpI = 0; BS.seqI = 0; BS.recFresh = BS.noteMode === 6; toast(BS.arpOn ? (M.playing ? 'Arp on · hold or latch keys' : 'Arp on · it runs with the drum machine') : 'Arp off'); return;
    case 'bslatch':
      if (BS.arpOn && BS.noteMode === 6){ var s2 = BS.seqs[BS.arpOct - 1]; if (BS.recFresh){ s2.length = 0; BS.recFresh = false; } if (s2.length < 32) s2.push({ rest:1 }); bsSay(s2.length); return; }
      BS.latch = !BS.latch; if (!BS.latch) bsAllOff(); toast(BS.latch ? (BS.arpOn ? 'Latch on · click keys to add or remove them' : 'Key hold on') : 'Latch off'); return;
    case 'bstranspose': BS.trArm = !BS.trArm; if (BS.trArm) toast('Transpose: press a key (middle C = no shift)'); return;
    case 'bsfn': BS.fn = !BS.fn; toast(BS.fn ? 'Function: on-key functions are not fitted yet' : 'Function off'); return;
    case 'bsoctdn': case 'bsoctup': if (BS.fn){ BS.oct = 0; BS.transp = 0; } else BS.oct = clamp(BS.oct + (id === 'bsoctup' ? 1 : -1), -2, 3); bsAllOff(); bsSay((BS.oct > 0 ? '+' : '') + BS.oct); return;
  }
}
function bsRelease(c){ if (c.kind === 'key' && c.note != null){ bsKeyUp(c.note); c.note = null; } }
function bsKbDown(k){
  if (k === 'z' || k === 'x'){ BS.kbOct = clamp(BS.kbOct + (k === 'x' ? 1 : -1), -2, 2); bsSay((BS.kbOct > 0 ? '+' : '') + BS.kbOct); return true; }
  var i = MFKB.indexOf(k); if (i < 0 || k.length !== 1) return false; if (BS.kb[k] != null) return true;
  var n = 36 + (BS.oct + BS.kbOct) * 12 + BS.transp + i; BS.kb[k] = n; bsKeyDown(n, 0.85); return true;
}
function bsKbUp(k){ if (BS.kb[k] != null){ bsKeyUp(BS.kb[k]); delete BS.kb[k]; } }
function bsLfo(i, dt, l){
  var ph = BS.lph[i] + bsLfoHz(l.rate) * dt, wrap = ph >= 1; ph -= Math.floor(ph); BS.lph[i] = ph; if (wrap) BS.lsh[i] = Math.random() * 2 - 1;
  var v = l.wave === 0 ? 1 - 4 * Math.abs(ph - 0.5) : l.wave === 1 ? 1 - 2 * ph : l.wave === 2 ? (ph < 0.5 ? 1 : -1) : BS.lsh[i];
  var dl = l.delay * 4; if (dl > 0.02 && ac) v *= clamp((ac.currentTime - BS.noteT) / dl, 0, 1);
  return v;
}
function bsUpdate(now, dt){
  var P = BS.p, t = ac ? ac.currentTime : 0, blink = (now % 420) < 210, i;
  if (!(drag && drag.c === CT.bspitch) && Math.abs(CT.bspitch.v - 0.5) > 0.002){ CT.bspitch.v = lerp(CT.bspitch.v, 0.5, 1 - Math.exp(-dt * 14)); CT.bspitch.show(); }
  BS.lval[0] = bsLfo(0, dt, P.l1); BS.lval[1] = bsLfo(1, dt, P.l2);
  if (BSA){ BSA.l1.offset.setTargetAtTime(BS.lval[0], t, 0.01); BSA.l2.offset.setTargetAtTime(BS.lval[1], t, 0.01); BSA.bend.offset.setTargetAtTime((CT.bspitch.v - 0.5) * 2 * 200, t, 0.01); var sv = snCv(2) * 2400; BSA.f1.detune.setTargetAtTime(sv, t, 0.02); BSA.f2.detune.setTargetAtTime(sv, t, 0.02); }
  var lit = {}; if (ac) BS.vis = BS.vis.filter(function(e){ if (e.t <= t && e.t + e.d > t) lit[e.n] = 1; return e.t + e.d > t; });
  BS.stack.forEach(function(n){ lit[n] = 1; }); if (BS.holdN != null) lit[BS.holdN] = 1;
  BSKEYS.forEach(function(c){ var n = bsNote(c.n); keyGlow(c, c.down || lit[n], BS.latched[n], dt); });
  var o = P.o[BS.oscSel];
  for (i = 0; i < 4; i++){ ledOn(BSLED['rg' + i], o.range === i); ledOn(BSLED['wv' + i], o.wave === i); ledOn(BSLED['la' + i], P.l1.wave === i ? 0.35 + Math.abs(BS.lval[0]) * 0.65 : 0); ledOn(BSLED['lb' + i], P.l2.wave === i ? 0.35 + Math.abs(BS.lval[1]) * 0.65 : 0); }
  for (i = 0; i < 3; i++){ ledOn(BSLED['sw' + i], P.subwave === i); ledOn(BSLED['sh' + i], !P.ftype && P.shape === i); ledOn(BSLED['tg' + i], P.trig === i); }
  ledOn(BSLED.so0, P.suboct === 0); ledOn(BSLED.so1, P.suboct === 1); ledOn(BSLED.ft0, !P.ftype); ledOn(BSLED.ft1, P.ftype); ledOn(BSLED.sl0, !P.ftype && !P.slope); ledOn(BSLED.sl1, P.ftype || P.slope); ledOn(BSLED.sync, 0);
  ledOn(BSLED.on, BS.arpOn); ledOn(BSLED.latch, BS.latch); ledOn(BSLED.tempo, M.playing && SEQ.visStep % 4 === 0);
  var B = { bson:BS.arpOn && (BS.noteMode !== 6 || blink), bslatch:BS.latch, bstranspose:BS.trArm ? blink : BS.transp !== 0, bsfn:BS.fn, bsoctdn:BS.oct < 0, bsoctup:BS.oct > 0 };
  CTLIST.forEach(function(c){ if (c.dev !== 'bs' || c.kind !== 'btn' || c.sw) return; var L = B[c.id] ? 1 : 0; if (c.down) L = Math.max(L, 0.8); if (L !== c.lit){ c.lit = L; c.paintLit(); } var ty = c.y0 - (c.down ? 0.003 : 0); if (c.m.position.y !== ty) c.m.position.y = ty; });
  if (now > BS.msgUntil && BS.msg){ BS.msg = ''; BS.dirty = true; }
  if (BS.dirty){ BS.dirty = false; bsPaintDisp(); }
}

RESTORE[BSSAVE] = function(){ bsRestore(); CT.bsvol.show(); bsSync(); bsApply(); BS.dirty = true; }; SAVENOW.push(bsSave);
