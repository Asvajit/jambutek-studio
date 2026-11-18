
/* ================= the Tape: a 7-voice chromatic sampler and varispeed tape looper, after the open-source CHOMPI (TAPE firmware) =================
   Six click-encoders (speed / start / end / magic / tape / volume, each with a second page behind a click), a two-octave keyboard,
   CHOMP (shift), PLAY and LOOP, laid out like the real thing: black panel, carry handle, keycap keys. It ships with eight samples made in code, and CHOMP + LOOP records a new one from the mixer. */
var TPW = 300, TPD = 100, TPH = 1.1, TPTILT = 0.56;
function tx(u){ return (u - TPW / 2) * SC; }
function tz(u){ return (u - TPD / 2) * SC; }
var TPY = new THREE.Group(); TPY.position.set(TPPOS.x, TPH, TPPOS.z); TPY.rotation.y = TPPOS.r; scene.add(TPY);
var TPG = new THREE.Group(); TPG.rotation.x = TPTILT; TPY.add(TPG);
var TPEN = ['SPEED', 'START', 'END', 'MAGIC', 'TAPE', 'VOLUME'], TPSN = ['Kalimba', 'Choir', 'Tape Piano', 'Glass Bell', 'Pluck', 'Flute', 'Chord', 'Wash'];
var TPPG = [[['Speed', 0.75], ['Gain', 0.7], ['Pan', 0.5]], [['Start point', 0], ['Attack', 0.02]], [['End point', 1], ['Decay', 0.35]], [['Space (delay < > reverb)', 0.62], ['Lo-fi', 0.15], ['Filter', 0.5]], [['Tape speed', 0.75]], [['Volume', 0.75], ['Loop level', 0.8]]];
var TP = { pg:[0, 0, 0, 0, 0, 0], v:TPPG.map(function(p){ return p.map(function(q){ return q[1]; }); }), slot:0, chomp:false, samples:[], voices:[], held:{}, kb:{}, kbOct:0, loop:{ st:0, buf:null, rev:null, src:null, phase:0, bpm:120, dir:1 }, rec:null, sampling:null, vis:[] };
function tpRestore(){ try { var s = JSON.parse(store('jambutek-studio-tape-v1') || 'null'); if (s && s.v === 1 && Array.isArray(s.vals) && s.vals.length === 6){ s.vals.forEach(function(p, i){ if (Array.isArray(p)) p.forEach(function(x, j){ if (typeof x === 'number' && j < TP.v[i].length) TP.v[i][j] = clamp(x, 0, 1); }); }); TP.slot = clamp(s.slot | 0, 0, 7); } } catch (e) {} } tpRestore();
var tpSaveT = null; function tpSaveNow(){ store('jambutek-studio-tape-v1', JSON.stringify({ v:1, vals:TP.v, slot:TP.slot })); } function tpSaveSoon(){ clearTimeout(tpSaveT); tpSaveT = setTimeout(tpSaveNow, saveMs(900)); }
var TPEP = [[64, 32.5, 6.3], [96.4, 32, 6.3], [127, 32, 6.3], [158.5, 32, 6.3], [197, 29.5, 15], [284, 31.5, 6.3]], TPWX = function(i){ return 19.1 + i * 18.65; }, TPBX = [28.4, 47, 84.4, 103, 121.7, 159, 177.6, 215, 233.6, 252.3];
var tpC = mk(TPW * 6, TPD * 6), tpTex = null;
function paintTP(){
  var g = tpC.getContext('2d'); g.setTransform(6, 0, 0, 6, 0, 0); g.fillStyle = '#131315'; g.fillRect(0, 0, TPW, TPD);
  for (var i = 0; i < 2500; i++){ g.fillStyle = 'rgba(' + (Math.random() < .5 ? '0,0,0' : '255,255,255') + ',' + rnd(.01, .035) + ')'; g.fillRect(Math.random() * TPW, Math.random() * TPD, .5, .3); }
  var GOLD = '#B8963A', W = '#ECECE8';
  function T(s, x, y, size, col, al){ g.font = 'bold ' + size + 'px "Helvetica Neue", Helvetica, Arial, sans-serif'; g.fillStyle = col || W; g.textAlign = al || 'center'; g.textBaseline = 'middle'; g.fillText(s, x, y); }
  function ring(x, y, r, col, lw){ g.strokeStyle = col; g.lineWidth = lw || 0.6; g.beginPath(); g.arc(x, y, r, 0, 7); g.stroke(); }
  function rr(x, y, w, h, r, col, lw){ g.strokeStyle = col; g.lineWidth = lw || 0.6; g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); g.stroke(); }
  [[3.5, 4], [296.5, 4], [3.5, 96], [296.5, 96], [66, 58], [140.5, 58], [196, 58], [271, 58]].forEach(function(p){ g.fillStyle = '#060607'; g.beginPath(); g.arc(p[0], p[1], 1.2, 0, 7); g.fill(); ring(p[0], p[1], 1.2, '#2A2A2E', 0.3); });
  [[37.7, 12], [64.8, 12], [96.3, 12], [127.4, 12], [158.5, 12], [279.7, 12]].forEach(function(p){ ring(p[0], p[1], 3.7, GOLD, 1.3); });
  [[186, 10], [205.6, 10]].forEach(function(p){ ring(p[0], p[1], 2.4, GOLD, 0.9); }); T('« | »', 195.8, 10, 3.2, GOLD);
  [224, 244].forEach(function(x){ ring(x, 10, 3.6, GOLD, 0.8); for (var k = 0; k < 8; k++){ var a = k * Math.PI / 4; g.fillStyle = GOLD; g.fillRect(x + Math.cos(a) * 4.6 - 0.6, 10 + Math.sin(a) * 4.6 - 0.6, 1.2, 1.2); } g.fillStyle = '#D8D8D4'; g.beginPath(); g.arc(x, 10, 1.6, 0, 7); g.fill(); });
  g.strokeStyle = GOLD; g.lineWidth = 0.4; g.beginPath(); for (var q = 0; q < 9; q++){ g.moveTo(229.5 + q, 10 - (q % 3) * 1.1 - 0.6); g.lineTo(229.5 + q, 10 + (q % 3) * 1.1 + 0.6); } g.stroke();
  ring(264, 12, 4.4, GOLD, 0.7); g.fillStyle = GOLD; for (var s = -2; s <= 2; s++) g.fillRect(264 + s * 1.5 - 0.35, 12 - Math.sqrt(16 - s * s * 2.25) * 0.8, 0.7, Math.sqrt(16 - s * s * 2.25) * 1.6);
  rr(25, 20.5, 22.5, 23, 2.2, GOLD, 1.1);                                                           // the CHOMP button's frame, with its little slide switch
  g.strokeStyle = W; g.lineWidth = 0.5; g.beginPath(); g.moveTo(25, 26); g.lineTo(9, 26); g.lineTo(9, 38); g.lineTo(25, 38); g.stroke(); g.fillStyle = '#3A3A3E'; g.fillRect(16.5, 26.5, 5.5, 11); g.fillStyle = '#0A0A0B'; g.fillRect(17.6, 28, 3.3, 4.5);
  rr(13, 12.5, 9, 4.6, 2.3, W, 0.5); T('+', 19, 14.9, 3.4); rr(13, 46, 9, 4.6, 2.3, W, 0.5); g.fillStyle = W; g.beginPath(); g.arc(19.6, 48.3, 1.5, 0, 7); g.fill();
  [0, 3, 5].forEach(function(k){ ring(TPEP[k][0], TPEP[k][1], 10.2, W, 0.6); });
  rr(84.5, 20.5, 54.5, 26.5, 3, W, 0.7); ring(96.4, 32, 10.2, W, 0.6); ring(127, 32, 10.2, W, 0.6);    // the cassette around START and END
  g.strokeStyle = W; g.lineWidth = 0.45; g.beginPath(); g.moveTo(101, 47); for (var b = 0; b < 12; b++){ var bh = [2, 4, 3, 6, 4, 7, 3, 5, 6, 3, 4, 2][b]; g.lineTo(101.9 + b * 1.8, 47 - bh); g.lineTo(102.8 + b * 1.8, 47); } g.stroke();
  rr(59.5, 45.5, 9, 6.5, 1.2, W, 0.5); g.beginPath(); g.arc(64, 50.6, 2.6, Math.PI, 0); g.stroke(); g.beginPath(); g.moveTo(64, 50.6); g.lineTo(65.6, 48.8); g.stroke();
  rr(154, 45.5, 9, 6.5, 1.2, W, 0.5); g.beginPath(); g.moveTo(156.2, 50.6); g.lineTo(160.4, 47.2); g.stroke(); T('*', 161, 47.6, 3.2);
  ring(197, 29.5, 19.4, GOLD, 1.2); rr(214.5, 20.5, 42, 22, 2.5, GOLD, 1.1);
  g.strokeStyle = W; g.lineWidth = 0.45; g.beginPath(); g.moveTo(272.5, 26); g.lineTo(272.5, 37); g.moveTo(295.5, 26); g.lineTo(295.5, 37); g.stroke(); T('TAPE', 283.5, 60.5, 3.3, GOLD);
  for (var n = 0; n < 14; n++) T(String(n + 1), TPWX(n), 92.3, 3.5, W);
  rr(275.5, 90.2, 8.4, 4.4, 2.2, W, 0.5); g.fillStyle = W; g.beginPath(); g.arc(277.8, 92.4, 1.4, 0, 7); g.fill(); T('+', 281.4, 92.4, 3);
  g.setTransform(1, 0, 0, 1, 0, 0); if (tpTex) tpTex.needsUpdate = true;
}
paintTP(); tpTex = smoothTex(tpC);
var TPLED = {};
(function(){
  var W2 = TPW * SC, D2 = TPD * SC, TH = 0.06, blk = new THREE.MeshLambertMaterial({ color:0x0A0A0B });
  var top = new THREE.Mesh(new THREE.PlaneGeometry(W2, D2), new THREE.MeshPhongMaterial({ color:0x707070, map:tpTex, emissive:0xffffff, emissiveMap:tpTex, emissiveIntensity:0.55, shininess:6, specular:0x000000 })); top.rotation.x = -Math.PI / 2; TPG.add(top);
  var body = new THREE.Mesh(new THREE.BoxGeometry(W2 + 0.008, TH, D2 + 0.008), blk); body.position.y = -TH / 2 - 0.0015; TPG.add(body);
  // the carry handle across the back
  [[-0.105, 0.03, 0.054], [0.105, 0.03, 0.054], [0, 0.24, 0.03]].forEach(function(h, i){ var m = new THREE.Mesh(new THREE.BoxGeometry(h[1], 0.03, h[2]), blk); m.position.set(tx(142.5) + h[0], -0.017, -D2 / 2 - (i < 2 ? 0.027 : 0.054 - 0.015)); TPG.add(m); });
  standFor(TPY, TPG, W2, D2 + 0.06, TH, TPH, TPTILT, 0.26); devBody(TPY, 'tp'); BLOCKS.push(devBlock(TPPOS, 0.42));
})();
HOST = TPG; LX = tx; LZ = tz; DEV = 'tp';
TPEP.forEach(function(p, k){ var c = knob('tpe' + k, p[0], p[1], p[2], TPEN[k].charAt(0) + TPEN[k].slice(1).toLowerCase(), TP.v[k][0], { h:k === 4 ? 9 : 10, sides:k === 4 ? 20 : 12, color:k === 4 ? 0x4E2C96 : 0xA8A8A4 }); c.ei = k; c.click = function(){ tpClick(k); }; ledAt(TPLED, 'pg' + k, k === 4 ? 186 : k === 5 ? 279.7 : p[0] + (k ? 0 : 0.8), k === 4 ? 10 : 12, k === 4 ? 0.0034 : 0.0055); });
ledAt(TPLED, 'ch', 37.7, 12, 0.0055, 0xB070FF); ledAt(TPLED, 'pl', 205.6, 10, 0.0034, 0x3BFF6A);
FACE = { bg:'#F0584E', fg:'#5A0E0A' }; button('tpchomp', 36.2, 32, 17, 17, '', 'Chomp (Shift)', 0xFFE15A).mat.color.setHex(0x808080);
FACE = { bg:'#38BCCB', fg:'#06272C' }; button('tpplay', 226, 31.5, 15.5, 15.5, '▶ ❙❙', 'Play / pause the loop', 0x9AF6FF).mat.color.setHex(0x808080);
FACE = { bg:'#F2C230', fg:'#2E2300' }; button('tploop', 245, 31.5, 15.5, 15.5, '↻', 'Loop: record, overdub', 0xFF2A3C).mat.color.setHex(0x808080);
for (var tpi = 0; tpi < 8; tpi++) ledAt(TPLED, 's' + tpi, TPWX(tpi), 68.9, 0.0017, 0xFF3A2A);
/* fifteen white keycaps in a row with ten black ones above, two octaves from C */
var TPKEYS = (function(){
  var list = [], wi = 0, bi = 0, S = 16.6 * SC, wg = new THREE.BoxGeometry(S, 0.016, S), n;
  for (n = 0; n < 25; n++)(function(n){
    var black = [1, 3, 6, 8, 10].indexOf(n % 12) >= 0, mat = new THREE.MeshPhongMaterial(black ? { color:0x1A1A1E, emissive:0x0A0A0C, shininess:4, specular:0x000000 } : { color:0xA4A4A0, emissive:0x161615, shininess:20, specular:0x111111 });
    var m = new THREE.Mesh(wg, mat), px = black ? TPBX[bi++] : TPWX(wi++), py = black ? 59.5 : 78.6; m.position.set(LX(px), 0.008, LZ(py)); HOST.add(m);
    var c = { id:'tpk' + n, kind:'key', name:'Key', n:n, black:black, m:m, mat:mat, y0:m.position.y, hov:false, down:0, glow:0, base:black ? 0x0C0C0E : 0x161615, zf:LZ(py) - S / 2, len:S };
    c.hover = function(on){ c.hov = on; }; list.push(c); reg(c, [m]);
  })(n);
  return list;
})();
HOST = TRG; LX = lx; LZ = lz; DEV = null; FACE = { bg:'#C9C7C0', fg:'#0B0B0D' };

function tpVal(k, p){ return TP.v[k][p == null ? TP.pg[k] : p]; }
function tpSpeed(){ var v = tpVal(0, 0), a = Math.abs(2 * v - 1); return { rate:Math.pow(2, a * 2 - 1), rev:v < 0.5 }; }
function tpTapeRate(){ var r = (tpVal(4, 0) - 0.5) * 4; return Math.abs(r) < 0.06 ? 0 : r; }
function tpTxt(k){
  var p = TP.pg[k], v = TP.v[k][p];
  if (k === 0 && p === 0){ var s = tpSpeed(); return (s.rev ? 'reverse ' : '') + s.rate.toFixed(2) + 'x'; } if (k === 0 && p === 2) return v < 0.48 ? 'L' + Math.round((0.5 - v) * 200) : v > 0.52 ? 'R' + Math.round((v - 0.5) * 200) : 'centre';
  if (k === 3 && p === 0) return v < 0.47 ? 'delay ' + Math.round((0.5 - v) * 200) : v > 0.53 ? 'reverb ' + Math.round((v - 0.5) * 200) : 'dry'; if (k === 3 && p === 2) return v < 0.47 ? 'low-pass ' + Math.round((0.5 - v) * 200) : v > 0.53 ? 'high-pass ' + Math.round((v - 0.5) * 200) : 'open';
  if (k === 4){ var r = tpTapeRate(); return r === 0 ? 'stopped' : (r < 0 ? 'reverse ' : '') + Math.abs(r).toFixed(2) + 'x'; }
  return String(Math.round(v * 100));
}
function tpLabel(c){
  if (c.ei != null) return TPPG[c.ei][TP.pg[c.ei]][0] + ': ' + tpTxt(c.ei) + ' · scroll or drag' + (TPPG[c.ei].length > 1 ? ', click for ' + TPPG[c.ei][(TP.pg[c.ei] + 1) % TPPG[c.ei].length][0].toLowerCase() : ', click = 1x');
  if (c.kind === 'key'){ if (TP.chomp && !c.black){ var w = tpWhite(c.n); return w < 8 ? 'Sample ' + (w + 1) + ' · ' + tpName(w) : null; } var n = 48 + c.n; return NOTEN[n % 12] + (Math.floor(n / 12) - 1) + ' · ' + tpName(TP.slot); }
  if (c.id === 'tploop') return TP.chomp ? 'Chomp + Loop: sample the mixer into slot ' + (TP.slot + 1) : ['Loop: record', 'Loop: stop recording', 'Loop: overdub', 'Loop: stop overdub', 'Loop: overdub'][TP.loop.st];
  if (c.id === 'tpplay') return TP.chomp ? 'Chomp + Play: erase the loop' : c.name;
  return c.name;
}
function tpName(i){ return TP.samples[i] && TP.samples[i].name ? TP.samples[i].name : TPSN[i]; }
function tpWhite(n){ var w = 0; for (var i = 0; i < n; i++) if ([1, 3, 6, 8, 10].indexOf(i % 12) < 0) w++; return w; }

/* ---- audio ---- */
var TPA = null;
function tpMake(i, sr){                               // the eight built-in samples, all pitched at C4
  var len = Math.round(sr * [1.4, 2.2, 1.8, 2.2, 1.0, 1.6, 2.0, 2.4][i]), d = new Float32Array(len), f = 261.63, w = 2 * Math.PI / sr, k, t, s, lp = 0;
  for (k = 0; k < len; k++){ t = k / sr; s = 0;
    if (i === 0) s = Math.sin(w * f * k) * Math.exp(-t * 3.2) + 0.35 * Math.sin(w * f * 3.93 * k) * Math.exp(-t * 14) + 0.2 * Math.sin(w * f * 6.1 * k) * Math.exp(-t * 30);
    else if (i === 1){ var vb = 1 + 0.004 * Math.sin(2 * Math.PI * 5.2 * t); for (var h = 1; h <= 9; h++) s += Math.sin(w * f * h * vb * k + h) * (1 / h) * (0.35 + Math.exp(-Math.pow((f * h - 800) / 350, 2)) + 0.6 * Math.exp(-Math.pow((f * h - 1150) / 300, 2))); s *= 0.45 * Math.min(1, t / 0.25) * Math.min(1, (len / sr - t) / 0.5); }
    else if (i === 2){ for (var h2 = 1; h2 <= 8; h2++) s += Math.sin(w * f * h2 * (1 + h2 * h2 * 0.0004) * k) / h2 * Math.exp(-t * (1.6 + h2 * 0.7)); s *= 0.7 * (1 + 0.004 * Math.sin(2 * Math.PI * 0.9 * t)); }
    else if (i === 3) s = 0.6 * Math.sin(w * f * k) * Math.exp(-t * 1.4) + 0.4 * Math.sin(w * f * 2.76 * k) * Math.exp(-t * 2.2) + 0.25 * Math.sin(w * f * 5.4 * k) * Math.exp(-t * 3.5) + 0.15 * Math.sin(w * f * 8.93 * k) * Math.exp(-t * 6);
    else if (i === 4){ for (var h3 = 1; h3 <= 10; h3++) s += Math.sin(w * f * h3 * k) / h3 * Math.exp(-t * (3 + h3 * 2.2)); s *= 0.8; }
    else if (i === 5){ lp += ((Math.random() * 2 - 1) - lp) * 0.2; s = (Math.sin(w * f * k * (1 + 0.003 * Math.sin(2 * Math.PI * 4.6 * t))) + 0.25 * Math.sin(w * f * 2 * k) + lp * 0.35) * 0.6 * Math.min(1, t / 0.08) * Math.min(1, (len / sr - t) / 0.3); }
    else if (i === 6){ [1, 1.189, 1.498, 1.782].forEach(function(m){ for (var h4 = 1; h4 <= 6; h4++) s += Math.sin(w * f * m * h4 * k + m * h4) / (h4 * 1.4) * Math.exp(-t * (0.8 + h4 * 0.5)); }); s *= 0.3; }
    else { lp += ((Math.random() * 2 - 1) - lp) * (0.02 + 0.25 * Math.sin(Math.PI * t / (len / sr))); s = lp * 2.2 * Math.sin(Math.PI * t / (len / sr)); }
    d[k] = s * Math.min(1, k / 60);
  }
  return d;
}
function tpBuf(data){ var b = ac.createBuffer(1, data.length, ac.sampleRate); b.getChannelData(0).set(data); return b; }
function tpRev(o){ if (!o.rev){ var a = o.buf.getChannelData(0), r = new Float32Array(a.length); for (var i = 0; i < a.length; i++) r[i] = a[a.length - 1 - i]; o.rev = tpBuf(r); } return o.rev; }
function stairCurve(levels){ var c = new Float32Array(2048); for (var k = 0; k < 2048; k++){ var x = k / 1024 - 1; c[k] = Math.round(x * levels / 2) / (levels / 2); } return c; }
function tpAudio(){
  if (TPA) return true; unlock(); if (!AU.ready) return false; var A = {}; function G(v){ var g = ac.createGain(); g.gain.value = v; return g; }
  for (var i = 0; i < 8; i++) TP.samples[i] = { buf:tpBuf(tpMake(i, ac.sampleRate)), rev:null, name:TPSN[i] };
  A.bus = G(1); A.loopG = G(0.8); A.pre = G(1); A.wow = ac.createDelay(0.05); A.wow.delayTime.value = 0.012; A.wl = ac.createOscillator(); A.wl.frequency.value = 0.8; A.wg = G(0); A.wl.connect(A.wg); A.wg.connect(A.wow.delayTime); A.wl.start();
  A.ws = ac.createWaveShaper(); A.lofi = ac.createBiquadFilter(); A.lofi.type = 'lowpass'; A.lofi.frequency.value = 18000; A.lp = ac.createBiquadFilter(); A.lp.type = 'lowpass'; A.lp.frequency.value = 20000; A.hp = ac.createBiquadFilter(); A.hp.type = 'highpass'; A.hp.frequency.value = 10;
  A.vol = G(0.7); A.ds = G(0); A.dl = ac.createDelay(2.5); A.fb = G(0.45); A.dlp = ac.createBiquadFilter(); A.dlp.type = 'lowpass'; A.dlp.frequency.value = 3500; A.rs = G(0); A.cv = ac.createConvolver(); A.cv.buffer = pkIR(4);
  A.bus.connect(A.pre); A.loopG.connect(A.pre); A.pre.connect(A.wow); A.wow.connect(A.ws); A.ws.connect(A.lofi); A.lofi.connect(A.lp); A.lp.connect(A.hp); A.hp.connect(A.vol);
  A.hp.connect(A.ds); A.ds.connect(A.dl); A.dl.connect(A.dlp); A.dlp.connect(A.fb); A.fb.connect(A.dl); A.dlp.connect(A.vol); A.hp.connect(A.rs); A.rs.connect(A.cv); A.cv.connect(A.vol); A.vol.connect(AU.ch[5].inp);
  A.lofiQ = -1; TPA = A; tpApply(true); return true;
}
function tpApply(init){
  if (!TPA) return; var A = TPA, t = ac.currentTime, sp = TP.v[3][0], lo = TP.v[3][1], fl = TP.v[3][2];
  function S(p, v){ if (init) p.value = v; else p.setTargetAtTime(v, t, 0.02); }
  S(A.ds.gain, sp < 0.47 ? (0.47 - sp) / 0.47 * 0.9 : 0); S(A.rs.gain, sp > 0.53 ? (sp - 0.53) / 0.47 * 1.4 : 0); S(A.dl.delayTime, Math.min(2.4, 0.75 * 60 / M.bpm));
  var q = Math.round(lo * 10); if (q !== A.lofiQ){ A.lofiQ = q; A.ws.curve = q < 1 ? null : stairCurve(Math.round(90 * Math.pow(0.6, q)) + 4); } S(A.lofi.frequency, 18000 * Math.pow(0.12, lo)); S(A.wg.gain, lo * lo * 0.0035);
  S(A.lp.frequency, fl < 0.47 ? 20000 * Math.pow(0.008, (0.47 - fl) / 0.47) : 20000); S(A.hp.frequency, fl > 0.53 ? 20 * Math.pow(300, (fl - 0.53) / 0.47) : 10);
  S(A.vol.gain, Math.pow(TP.v[5][0], 1.6) * 1.5); S(A.loopG.gain, TP.v[5][1] * 1.2);
}
function tpVoice(note, vel, t, dur){
  var A = TPA, o = TP.samples[TP.slot], sp = tpSpeed(), buf = sp.rev ? tpRev(o) : o.buf, src = ac.createBufferSource(), g = ac.createGain(), v = { src:src, g:g, t0:t };
  var st = TP.v[1][0], en = Math.max(st + 0.02, TP.v[2][0]), a = 0.002 + Math.pow(TP.v[1][1], 2) * 2, off = (sp.rev ? 1 - en : st) * buf.duration, len = (en - st) * buf.duration;
  src.buffer = buf; src.playbackRate.value = Math.pow(2, (note - 60) / 12) * sp.rate; v.d = 0.02 + Math.pow(TP.v[2][1], 2) * 4; v.lv = TP.v[0][1] * 1.3 * (0.4 + 0.6 * vel);
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v.lv, t + a);
  var last = g; if (ac.createStereoPanner){ var pn = ac.createStereoPanner(); pn.pan.value = (TP.v[0][2] - 0.5) * 2; g.connect(pn); last = pn; } src.connect(g); last.connect(A.bus); v.out = last;
  src.start(t, Math.min(off, buf.duration - 0.005), len); src.onended = function(){ try { v.out.disconnect(); } catch (e) {} var i = TP.voices.indexOf(v); if (i >= 0) TP.voices.splice(i, 1); };
  TP.voices.push(v); while (TP.voices.length > 7) tpVoiceOff(TP.voices.shift(), t, 0.01);
  if (dur != null) tpVoiceOff(v, t + dur);
  return v;
}
function tpVoiceOff(v, t, fast){ if (v.off) return; v.off = true; var d = fast || v.d; v.g.gain.cancelScheduledValues(t); v.g.gain.setTargetAtTime(0, t, d / 3); try { v.src.stop(t + d * 1.6 + 0.03); } catch (e) {} }
function tpNoteAt(n, vel, t, dur){ if (!tpAudio()) return; tpVoice(n, vel, t, dur); TP.vis.push({ t:t, n:n, d:dur }); }
function tpKeyDown(n, vel){ if (!tpAudio()) return; if (TP.held[n]) tpVoiceOff(TP.held[n], ac.currentTime, 0.02); TP.held[n] = tpVoice(n, vel || 0.8, ac.currentTime + 0.003, null); }
function tpKeyUp(n){ var v = TP.held[n]; if (!v) return; delete TP.held[n]; tpVoiceOff(v, ac.currentTime + 0.003); }
function tpKbDown(k){
  if (k === 'z' || k === 'x'){ TP.kbOct = clamp(TP.kbOct + (k === 'x' ? 1 : -1), -2, 2); toast('Tape keys octave ' + (TP.kbOct > 0 ? '+' : '') + TP.kbOct); return true; }
  var i = MFKB.indexOf(k); if (i < 0 || k.length !== 1) return false; if (TP.kb[k] != null) return true; var n = 60 + i + TP.kbOct * 12; TP.kb[k] = n; tpKeyDown(n, 0.85); return true;
}
function tpKbUp(k){ if (TP.kb[k] != null){ tpKeyUp(TP.kb[k]); delete TP.kb[k]; } }

/* recording: a ScriptProcessor copies what passes through it into chunks */
function tpTap(node){
  var sp = ac.createScriptProcessor(2048, 1, 1), z = ac.createGain(), r = { chunks:[], n:0, t0:ac.currentTime, sp:sp }; z.gain.value = 0;
  sp.onaudioprocess = function(e){ var a = e.inputBuffer.getChannelData(0); r.chunks.push(new Float32Array(a)); r.n += a.length; };
  node.connect(sp); sp.connect(z); z.connect(ac.destination); r.stop = function(){ try { node.disconnect(sp); sp.disconnect(); z.disconnect(); } catch (e) {} sp.onaudioprocess = null; var d = new Float32Array(r.n), o = 0; r.chunks.forEach(function(c){ d.set(c, o); o += c.length; }); return d; };
  return r;
}
function tpLoopStart(phase, when){
  var L = TP.loop, r = tpTapeRate(); if (L.src){ try { L.src.stop(); L.src.disconnect(); } catch (e) {} L.src = null; } if (!L.buf || L.st === 0 || L.st === 1 || L.paused) return;
  L.dir = r < 0 ? -1 : 1; var buf = L.dir < 0 ? tpRev(L) : L.buf, src = ac.createBufferSource(); src.buffer = buf; src.loop = true; src.playbackRate.value = Math.abs(r) * M.bpm / L.bpm; src.connect(TPA.loopG);
  var ph = ((phase % buf.length) + buf.length) % buf.length; src.start(when || 0, (L.dir < 0 ? buf.length - 1 - ph : ph) / ac.sampleRate); L.src = src; L.phase = ph;
}
function tpLoopPress(){
  if (!tpAudio()) return; var L = TP.loop, sr = ac.sampleRate;
  if (L.st === 0){ L.st = 1; TP.rec = tpTap(TPA.bus); toast('Loop: recording · play something, press LOOP again'); return; }
  if (L.st === 1){ var d = TP.rec.stop(); TP.rec = null; if (d.length < sr * 0.15){ L.st = 0; toast('Loop: too short'); return; }
    var n = d.length; if (M.playing){ var beat = sr * 60 / M.bpm; n = Math.max(1, Math.round(d.length / beat)) * Math.round(beat); } var out = new Float32Array(n); out.set(d.subarray(0, Math.min(n, d.length))); for (var i = 0; i < 200 && i < n; i++){ out[i] *= i / 200; out[n - 1 - i] *= i / 200; }
    L.buf = tpBuf(out); L.rev = null; L.bpm = M.bpm; L.st = 2; L.paused = false; tpLoopStart(0); toast('Loop: playing ' + (M.playing ? Math.round(n / (sr * 60 / M.bpm)) + ' beats' : (n / sr).toFixed(1) + ' s')); return; }
  if (L.st === 2 || L.st === 4){ L.st = 3; L.odPhase = L.phase; TP.rec = tpTap(TPA.bus); toast('Loop: overdubbing'); return; }
  if (L.st === 3){ var od = TP.rec.stop(), a = L.buf.getChannelData(0), mix = new Float32Array(a), p0 = Math.round(L.odPhase) % a.length, m = Math.min(od.length, a.length); TP.rec = null;
    for (var k = 0; k < m; k++){ var fade = Math.min(1, k / 200, (m - 1 - k) / 200); mix[(p0 + k) % a.length] += od[k] * fade; } L.buf = tpBuf(mix); L.rev = null; L.st = 2; tpLoopStart(L.phase); toast('Loop: overdub added'); }
}
function tpSampleMixer(){
  if (!tpAudio()) return;
  if (!TP.sampling){ TP.sampling = tpTap(AU.tap); toast('Sampling the mixer into slot ' + (TP.slot + 1) + ' · CHOMP + LOOP again to stop'); return; }
  var d = TP.sampling.stop(); TP.sampling = null; var s = 0, pk = 0, i; while (s < d.length && Math.abs(d[s]) < 0.01) s++; d = d.subarray(s, Math.min(d.length, s + ac.sampleRate * 8)); for (i = 0; i < d.length; i++) pk = Math.max(pk, Math.abs(d[i]));
  if (d.length < ac.sampleRate * 0.05 || pk < 0.005){ toast('Nothing to sample · is anything playing?'); return; }
  var out = new Float32Array(d.length); for (i = 0; i < d.length; i++) out[i] = d[i] * 0.9 / pk * Math.min(1, i / 40, (d.length - 1 - i) / 400); TP.samples[TP.slot] = { buf:tpBuf(out), rev:null, name:'Sampled' }; toast('Slot ' + (TP.slot + 1) + ': sampled ' + (d.length / ac.sampleRate).toFixed(1) + ' s');
}
function tpOnStart(){ var L = TP.loop; if (TPA && L.buf && (L.st === 2 || L.st === 4) && !L.paused) tpLoopStart(0, SEQ.nextT); }
function tpCtl(c){
  var k = c.ei; if (k == null) return; var v = c.v; if ((k === 0 && TP.pg[0] === 2) || (k === 3 && TP.pg[3] !== 1)) { if (Math.abs(v - 0.5) < 0.025) v = 0.5; } TP.v[k][TP.pg[k]] = v; tpApply();
  if (k === 4 && TPA){ var L = TP.loop, r = tpTapeRate(); if (L.src){ if ((r < 0 ? -1 : 1) !== L.dir && r !== 0) tpLoopStart(L.phase); else L.src.playbackRate.setTargetAtTime(Math.abs(r) * M.bpm / L.bpm, ac.currentTime, 0.05); } }
  tpSaveSoon();
}
function tpClick(k){
  if (k === 4){ TP.v[4][0] = 0.75; CT.tpe4.v = 0.75; CT.tpe4.show(); tpCtl(CT.tpe4); toast('Tape speed 1x'); return; }
  TP.pg[k] = (TP.pg[k] + 1) % TPPG[k].length; var c = CT['tpe' + k]; c.v = TP.v[k][TP.pg[k]]; c.show(); toast(TPEN[k].charAt(0) + TPEN[k].slice(1).toLowerCase() + ' knob: ' + TPPG[k][TP.pg[k]][0]);
}
function tpPress(c){
  if (c.kind === 'key'){
    if (TP.chomp && !c.black && tpWhite(c.n) < 8){ TP.slot = tpWhite(c.n); toast('Sample ' + (TP.slot + 1) + ' · ' + tpName(TP.slot)); tpSaveSoon(); if (tpAudio()) tpVoice(60, 0.8, ac.currentTime + 0.003, 0.5); return; }
    var vel = 0.8; if (c._hit){ var lp = TPG.worldToLocal(c._hit.point.clone()); vel = clamp(0.4 + 0.6 * (lp.z - c.zf) / c.len, 0.35, 1); } c.note = 48 + c.n; tpKeyDown(c.note, vel); return;
  }
  var L = TP.loop;
  if (c.id === 'tpchomp'){ TP.chomp = !TP.chomp; if (TP.chomp) toast('Chomp: white keys 1-8 pick a sample · + LOOP samples the mixer · + PLAY erases the loop'); return; }
  if (c.id === 'tploop'){ if (TP.chomp) tpSampleMixer(); else tpLoopPress(); return; }
  if (c.id === 'tpplay'){ if (!tpAudio()) return;
    if (TP.chomp){ if (TP.rec){ TP.rec.stop(); TP.rec = null; } L.st = 0; L.buf = null; L.rev = null; tpLoopStart(0); toast('Loop erased'); return; }
    if (!L.buf){ toast('No loop yet · press LOOP to record one'); return; } if (L.st === 3) tpLoopPress(); L.paused = !L.paused; L.st = L.paused ? 4 : 2; tpLoopStart(L.paused ? 0 : L.phase); toast(L.paused ? 'Loop paused' : 'Loop playing'); }
}
function tpRelease(c){ if (c.kind === 'key' && c.note != null){ tpKeyUp(c.note); c.note = null; } }
function tpUpdate(now, dt){
  var t = ac ? ac.currentTime : 0, L = TP.loop, blink = (now % 420) < 210, lit = {}, i;
  if (L.src && L.buf) L.phase = (L.phase + L.dir * Math.abs(tpTapeRate()) * M.bpm / L.bpm * dt * ac.sampleRate + L.buf.length * 4) % L.buf.length;
  if (TP.rec && TP.rec.n > ac.sampleRate * 60 && L.st === 1) tpLoopPress(); if (TP.sampling && TP.sampling.n > ac.sampleRate * 8) tpSampleMixer();
  if (ac) TP.vis = TP.vis.filter(function(e){ if (e.t <= t && e.t + e.d > t) lit[e.n] = 1; return e.t + e.d > t; });
  TPKEYS.forEach(function(c){ var n = 48 + c.n, sel = TP.chomp && !c.black && tpWhite(c.n) === TP.slot; keyGlow(c, c.down || lit[n] || TP.held[n], sel, dt); });
  for (i = 0; i < 8; i++) ledOn(TPLED['s' + i], i === TP.slot ? (TP.sampling ? (blink ? 1 : 0.2) : 1) : 0.04);
  for (i = 0; i < 6; i++){ var l = TPLED['pg' + i]; l.col.setHex([[0x4CFF7A, 0xFFE15A, 0xFF4A3A, 0x7AB8FF, 0xFFFFFF, 0xFFC84A][i], 0xFFFFFF, 0xC070FF][TP.pg[i]]); ledOn(l, i === 4 ? (L.src ? 0.4 + 0.6 * Math.abs(Math.sin(L.phase / (L.buf ? L.buf.length : 1) * Math.PI)) : 0.1) : 0.9); }
  ledOn(TPLED.ch, TP.chomp ? 1 : 0.35); ledOn(TPLED.pl, (L.st === 2 || L.st === 3) && !L.paused ? 1 : 0.1);
  var B = { tpchomp:TP.chomp, tpplay:(L.st === 2 || L.st === 3) && !L.paused, tploop:L.st === 1 || L.st === 3 ? blink : !!TP.sampling && blink };
  CTLIST.forEach(function(c){ if (c.dev !== 'tp' || c.kind !== 'btn') return; var Lv = B[c.id] ? 1 : 0; if (c.down) Lv = Math.max(Lv, 0.8); if (Lv !== c.lit){ c.lit = Lv; c.paintLit(); } var ty = c.y0 - (c.down ? 0.003 : 0); if (c.m.position.y !== ty) c.m.position.y = ty; });
}
function tpTempo(){ tpApply(); var L = TP.loop; if (TPA && L.src) L.src.playbackRate.setTargetAtTime(Math.abs(tpTapeRate()) * M.bpm / L.bpm, ac.currentTime, 0.05); }
function pkIR(q){ var secs = 0.5 + q / 8 * 6, len = Math.round(ac.sampleRate * secs), ir = ac.createBuffer(2, len, ac.sampleRate); for (var ch = 0; ch < 2; ch++){ var d = ir.getChannelData(ch), lp = 0; for (var i = 0; i < len; i++){ var t = i / len, w = (Math.random() * 2 - 1) * Math.pow(1 - t, 3) * (i < 400 ? i / 400 : 1); lp += (w - lp) * (0.7 - t * 0.45); d[i] = lp; } } return ir; }

RESTORE['jambutek-studio-tape-v1'] = function(){ tpRestore(); TPEP.forEach(function(p, k){ var c = CT['tpe' + k]; c.v = TP.v[k][TP.pg[k]]; c.show(); }); tpApply(); }; SAVENOW.push(tpSaveNow);
