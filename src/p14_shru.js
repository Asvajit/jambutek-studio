
/* ================= Jambu Shru: a mono hybrid synth laid out after the Mutable Instruments Shruthi-1 =================
   Two digital oscillators (six shapes, a timbre "prm" each, sum or ring), sub and noise, into a 24 dB low-pass;
   two ADSR envelopes (filter, amp), two LFOs and a few fixed modulation routes. Six buttons pick the page the
   four pots edit, the two-line display names what they do, the encoder steps pages and patches.
   It has no keys: its Snake plays it, or the computer keyboard while you lean over it. */
var SHW = 150, SHD = 122, SHH = 1.1, SHTILT = 0.56;
function hx(u){ return (u - SHW / 2) * SC; }
function hz(u){ return (u - SHD / 2) * SC; }
var SHY = new THREE.Group(); SHY.position.set(SHPOS.x, SHH, SHPOS.z); SHY.rotation.y = SHPOS.r; scene.add(SHY);
var SHG = new THREE.Group(); SHG.rotation.x = SHTILT; SHY.add(SHG);
var SHSHAPE = ['saw', 'sqr', 'tri', 'zsaw', 'fm', '8bit'], SHLFO = ['tri', 'sqr', 's&h', 'ramp'], SHSUB = ['sq1', 'tr1', 'sq2', 'tr2'];
function shPct(v){ return String(Math.round(v * 127)); }
function shSel(list){ return function(v){ return list[Math.min(list.length - 1, Math.floor(v * list.length))]; }; }
function shRng(v){ var r = Math.round((v - 0.5) * 48); return (r > 0 ? '+' : '') + r; }
function shBip(v){ var r = Math.round((v - 0.5) * 126); return (r > 0 ? '+' : '') + r; }
/* every page: a title, and four [key, short name, long name, formatter] slots */
var SHPAGES = [
  ['Oscillator 1', [['o1s', 'shp', 'Oscillator 1 shape', shSel(SHSHAPE)], ['o1p', 'prm', 'Oscillator 1 timbre', shPct], ['o1r', 'rng', 'Oscillator 1 range', shRng], ['op', 'op', 'Operator', shSel(['sum', 'ring'])]]],
  ['Oscillator 2', [['o2s', 'shp', 'Oscillator 2 shape', shSel(SHSHAPE)], ['o2p', 'prm', 'Oscillator 2 timbre', shPct], ['o2r', 'rng', 'Oscillator 2 range', shRng], ['o2t', 'tun', 'Oscillator 2 detune', shPct]]],
  ['Mixer', [['mix', 'mix', 'Oscillator balance', shPct], ['noi', 'nois', 'Noise', shPct], ['sub', 'sub', 'Sub oscillator', shPct], ['subw', 'wav', 'Sub shape', shSel(SHSUB)]]],
  ['Filter', [['cut', 'cut', 'Cutoff', shPct], ['res', 'res', 'Resonance', shPct], ['fenv', 'env', 'Envelope 1 to cutoff', shPct], ['trk', 'trk', 'Key tracking', shPct]]],
  ['Envelope 1', [['a1', 'atk', 'Envelope 1 attack', shPct], ['d1', 'dec', 'Envelope 1 decay', shPct], ['s1', 'sus', 'Envelope 1 sustain', shPct], ['r1', 'rel', 'Envelope 1 release', shPct]]],
  ['Envelope 2', [['a2', 'atk', 'Envelope 2 attack', shPct], ['d2', 'dec', 'Envelope 2 decay', shPct], ['s2', 'sus', 'Envelope 2 sustain', shPct], ['r2', 'rel', 'Envelope 2 release', shPct]]],
  ['LFO 1', [['l1w', 'wav', 'LFO 1 shape', shSel(SHLFO)], ['l1r', 'rat', 'LFO 1 rate', shPct], ['l1pit', 'pit', 'LFO 1 to pitch', shPct], ['l1prm', 'prm', 'LFO 1 to timbre', shPct]]],
  ['LFO 2', [['l2w', 'wav', 'LFO 2 shape', shSel(SHLFO)], ['l2r', 'rat', 'LFO 2 rate', shPct], ['l2cut', 'cut', 'LFO 2 to cutoff', shPct], ['l2amp', 'amp', 'LFO 2 to level', shPct]]],
  ['Modulation', [['vcut', 'v>cf', 'Velocity to cutoff', shPct], ['vamp', 'v>am', 'Velocity to level', shPct], ['e1prm', 'e>pr', 'Envelope 1 to timbre', shBip], ['glide', 'glid', 'Glide', shPct]]]
];
var SHKEYS = []; SHPAGES.forEach(function(pg){ pg[1].forEach(function(s){ SHKEYS.push(s[0]); }); });
function shPatch(name, o){ var d = { o1s:0, o1p:0, o1r:0.5, op:0, o2s:0.2, o2p:0, o2r:0.5, o2t:0.12, mix:0.4, noi:0, sub:0.3, subw:0, cut:0.45, res:0.3, fenv:0.45, trk:0.5, a1:0, d1:0.35, s1:0.2, r1:0.3, a2:0, d2:0.4, s2:0.7, r2:0.3, l1w:0, l1r:0.55, l1pit:0, l1prm:0, l2w:0, l2r:0.3, l2cut:0, l2amp:0, vcut:0.3, vamp:0.5, e1prm:0.5, glide:0 }; Object.keys(o).forEach(function(k){ d[k] = o[k]; }); d.name = name; return d; }
var SHPRE = [
  shPatch('Junk bass', {}),
  shPatch('Acid line', { o1s:0.2, mix:0, sub:0, cut:0.3, res:0.78, fenv:0.6, d1:0.3, s1:0, s2:0.9, r2:0.12, glide:0.3 }),
  shPatch('Zap lead', { o1s:0.55, o1p:0.45, o2s:0.55, o2r:0.75, o2t:0.2, mix:0.5, sub:0, cut:0.6, res:0.4, fenv:0.4, l1pit:0.08, l1r:0.6, e1prm:0.8 }),
  shPatch('Bell tone', { o1s:0.7, o1p:0.3, o2s:0.4, o2r:0.75, mix:0.35, sub:0, cut:0.75, res:0.1, fenv:0.2, d1:0.6, s1:0, d2:0.6, s2:0, r2:0.5 }),
  shPatch('Ring thing', { op:0.9, o1s:0.4, o2s:0, o2r:0.65, o2t:0.4, mix:0.2, cut:0.55, res:0.5, fenv:0.5, d1:0.5, l2cut:0.3, l2r:0.2 }),
  shPatch('8-bit hero', { o1s:0.95, o2s:0.95, o2r:0.75, mix:0.3, sub:0.2, subw:0.3, cut:0.85, res:0.05, fenv:0.1, s2:0.8, l1pit:0.12, l1w:0.3, l1r:0.7 }),
  shPatch('Wobble', { o1s:0, o2s:0.2, o2t:0.3, sub:0.5, subw:0.6, cut:0.3, res:0.6, fenv:0.1, l2cut:0.6, l2r:0.42, s2:1 }),
  shPatch('Hollow pad', { o1s:0.4, o2s:0.4, o2t:0.25, mix:0.5, sub:0.15, subw:0.3, cut:0.4, res:0.2, fenv:0.3, a1:0.5, d1:0.6, s1:0.6, a2:0.45, s2:0.9, r2:0.6, l1prm:0.3, l1r:0.25, o1p:0.2, o2p:0.25 })
];
var SH = { p:shPatch('', {}), patch:0, page:0, mem:false, oct:0, stack:[], kb:{}, kbOct:0, vis:[], msg:'', msgUntil:0, dirty:true };
function shRestore(){ try { var s = JSON.parse(store('jambutek-studio-shru-v1') || 'null'); if (s && s.v === 1 && s.p){ SHKEYS.forEach(function(k){ if (typeof s.p[k] === 'number') SH.p[k] = clamp(s.p[k], 0, 1); }); SH.patch = clamp(s.patch | 0, 0, SHPRE.length - 1); SH.oct = clamp(s.oct | 0, -2, 2); } else shLoad(0, true); } catch (e) {} } shRestore();
var shSaveT = null; function shSaveNow(){ store('jambutek-studio-shru-v1', JSON.stringify({ v:1, p:SH.p, patch:SH.patch, oct:SH.oct })); } function shSaveSoon(){ clearTimeout(shSaveT); shSaveT = setTimeout(shSaveNow, saveMs(800)); }
function shLoad(i, quiet){ SH.patch = i; SHKEYS.forEach(function(k){ SH.p[k] = SHPRE[i][k]; }); SH.dirty = true; if (!quiet){ shApply(); shPots(); shSaveSoon(); } }

var shC = mk(SHW * 8, SHD * 8), shTex = null, SHBX = [35.7, 49.7, 63.7, 77.5, 91.4, 105.2], SHPX = [30.3, 57, 83.7, 110];
function paintSH(){
  var g = shC.getContext('2d'); g.setTransform(8, 0, 0, 8, 0, 0);
  g.fillStyle = '#0E0F11'; g.fillRect(0, 0, SHW, SHD);
  for (var i = 0; i < 2500; i++){ g.fillStyle = 'rgba(' + (Math.random() < .5 ? '0,0,0' : '130,140,160') + ',' + rnd(.02, .06) + ')'; g.fillRect(Math.random() * SHW, Math.random() * SHD, .4, .25); }
  var B = '#49B9EA', W = '#ECECEC';
  function T(s, x, y, size, col, al, face){ g.font = (face || 'bold') + ' ' + size + 'px "Helvetica Neue", Helvetica, Arial, sans-serif'; g.fillStyle = col || W; g.textAlign = al || 'center'; g.textBaseline = 'middle'; g.fillText(s, x, y); }
  [[10, 7], [140, 7], [10, 115], [140, 115]].forEach(function(p){ g.fillStyle = '#0A0A0B'; g.beginPath(); g.arc(p[0], p[1], 2.3, 0, 7); g.fill(); g.strokeStyle = '#3A3B40'; g.lineWidth = 0.4; g.stroke(); g.fillStyle = '#2A2B30'; g.beginPath(); g.arc(p[0], p[1], 0.9, 0, 7); g.fill(); });
  [[75, 2], [75, 120]].forEach(function(p){ g.fillStyle = '#060607'; g.fillRect(p[0] - 4, p[1] - 1, 8, 2); }); [[1.5, 46], [148.5, 46]].forEach(function(p){ g.fillStyle = '#060607'; g.fillRect(p[0] - 1, p[1] - 3.5, 2, 7); });
  g.fillStyle = W; g.fillRect(8, 27.6, 134, 0.45);
  T('SHRU-1', 138, 21.6, 7.4, B, 'right');
  g.fillStyle = '#050608'; g.fillRect(38.5, 32, 65, 16);
  T('EDIT', 133, 43, 3.2, W);
  ['१', '२', '३', '४'].forEach(function(s, k){ T(s, SHPX[k], 57, 4.6, B, 'center', 'normal'); });
  g.strokeStyle = W; g.lineWidth = 0.4; g.beginPath(); g.moveTo(19.5, 68); g.lineTo(16.6, 68); g.lineTo(16.6, 98.5); g.lineTo(26.5, 98.5); g.stroke();
  ['OSC/MIX', 'FILTER', 'ENV/LFO', 'MOD', '▲', 'MEMORY'].forEach(function(s, k){ var w = k === 4 ? 4.4 : s.length * 1.62 + 1.4; g.fillStyle = W; g.fillRect(SHBX[k] - w / 2, 91.2, w, 3.5); T(s, SHBX[k], 93.05, 2.5, '#101114'); });
  ['SEQ ARP', 'NOTES', 'PATTERN', 'OPTIONS', '▼', ''].forEach(function(s, k){ T(s, SHBX[k], 104.4, 2.2, W); });
  T('1', 31.9, 84.2, 2.1, W); T('2', 39.9, 84.2, 2.1, W); T('1', 59.7, 84.2, 2.1, W); T('2', 67.7, 84.2, 2.1, W);
  g.setTransform(1, 0, 0, 1, 0, 0); if (shTex) shTex.needsUpdate = true;
}
paintSH(); shTex = smoothTex(shC);
var SHLED = {}, shDispC = mk(520, 128), shDispT = canvasTex(shDispC); shDispT.minFilter = THREE.LinearFilter; shDispT.magFilter = THREE.LinearFilter;
(function(){
  var W2 = SHW * SC, D2 = SHD * SC, TH = 0.07;
  var top = new THREE.Mesh(new THREE.PlaneGeometry(W2, D2), new THREE.MeshPhongMaterial({ color:0x707070, map:shTex, emissive:0xffffff, emissiveMap:shTex, emissiveIntensity:0.55, shininess:6, specular:0x000000 })); top.rotation.x = -Math.PI / 2; SHG.add(top);
  var body = new THREE.Mesh(new THREE.BoxGeometry(W2 + 0.006, TH, D2 + 0.006), new THREE.MeshPhongMaterial({ color:0x141518, shininess:30, specular:0x222222, flatShading:true })); body.position.y = -TH / 2 - 0.0015; SHG.add(body);
  standFor(SHY, SHG, W2, D2, TH, SHH, SHTILT, 0.12); devBody(SHY, 'sh'); BLOCKS.push(devBlock(SHPOS, 0.34));
  var d = new THREE.Mesh(new THREE.PlaneGeometry(62 * SC, 13.4 * SC), new THREE.MeshBasicMaterial({ map:shDispT })); d.rotation.x = -Math.PI / 2; d.position.set(hx(71), 0.002, hz(40)); d.userData.noShadow = true; d.userData.ia = 'trbody'; d.userData.dev = 'sh'; SHG.add(d); solids.push(d);
})();
HOST = SHG; LX = hx; LZ = hz; DEV = 'sh'; FACE = { bg:'#222327', fg:'#222327' };
(function(){ var e = knob('shenc', 120, 43, 6.6, 'Edit', 0, { h:11, endless:true, sides:16, color:0x0E0F11 }); e.click = function(){ unlock(); if (shAudio()){ var t = ac.currentTime + 0.01; shNoteAt(48, 0.85, t, 0.35); } }; })();
SHPX.forEach(function(x, k){ knob('shpot' + k, x, 67.5, 6.6, 'Pot ' + (k + 1), 0.5, { h:11, sides:16, color:0x0E0F11 }).pot = k; });
['Oscillators and mixer', 'Filter', 'Envelopes and LFOs', 'Modulation', 'Octave up (Shift: down)', 'Memory'].forEach(function(n, k){ button('shb' + k, SHBX[k], 98.5, 10.5, 6.6, '', n, 0xFFFFFF).bi = k; });
[['o1', 31.9, 0x58C8FF], ['o2', 39.9, 0x58C8FF], ['fl', 49.7, 0xFFFFFF], ['e1', 59.7, 0x58C8FF], ['e2', 67.7, 0x58C8FF], ['md', 77.5, 0x58C8FF], ['oc', 91.4, 0xFFFFFF], ['me', 105.2, 0xFFE8C0]].forEach(function(a){ ledAt(SHLED, a[0], a[1], 87.6, 0.0026, a[2]); });
HOST = TRG; LX = lx; LZ = lz; DEV = null; FACE = { bg:'#C9C7C0', fg:'#0B0B0D' };

function shSay(s, ms){ SH.msg = s; SH.msgUntil = performance.now() + (ms || 1400); SH.dirty = true; }
function shPots(){ var S = SHPAGES[SH.page][1]; for (var k = 0; k < 4; k++){ var c = CT['shpot' + k]; c.v = SH.p[S[k][0]]; c.name = S[k][2]; c.show(); } SH.dirty = true; }
shPots();
var SHA = null;
function shWave(h){ var re = new Float32Array(h.length + 1), im = new Float32Array(h.length + 1); h.forEach(function(a, i){ im[i + 1] = a; }); return ac.createPeriodicWave(re, im); }
function shAudio(){
  if (SHA) return true; if (!ac || !AU.ready) return false;
  var A = SHA = {}, G = function(v){ var g = ac.createGain(); g.gain.value = v; return g; }, i;
  var z = [], f = [], b = []; for (i = 1; i <= 40; i++){ z.push((1 / i) * (1 + 2.2 * Math.exp(-Math.pow((i - 7) / 2.5, 2)))); f.push(i === 1 ? 1 : i === 3 ? 0.5 : i === 4 ? 0.35 : i === 7 ? 0.3 : i === 11 ? 0.15 : 0); b.push(i === 1 ? 1 : (i % 8 === 7 || i % 8 === 1) ? 0.9 / Math.sqrt(i) : 0.04); }
  A.waves = [null, null, null, shWave(z), shWave(f), shWave(b)];
  var cv = new Float32Array(1025); for (i = 0; i < 1025; i++){ var u = (i / 512 - 1) * 6, m = ((u + 1) % 4 + 4) % 4; cv[i] = m < 2 ? m - 1 : 3 - m; }      // a triangle fold: straight through at low drive
  A.osc = [0, 1].map(function(){ var o = ac.createOscillator(), pre = G(1 / 6), sh = ac.createWaveShaper(); sh.curve = cv; o.connect(pre); pre.connect(sh); o.start(); return { o:o, pre:pre, out:sh, shape:-1 }; });
  A.g1 = G(0.5); A.g2 = G(0.5); A.ring = G(0); A.ringOut = G(0); A.mix = G(0.45);
  A.osc[0].out.connect(A.g1); A.osc[1].out.connect(A.g2); A.osc[0].out.connect(A.ring); A.osc[1].out.connect(A.ring.gain); A.ring.connect(A.ringOut); A.g1.connect(A.mix); A.g2.connect(A.mix); A.ringOut.connect(A.mix);
  A.sub = ac.createOscillator(); A.sub.type = 'square'; A.subG = G(0); A.sub.connect(A.subG); A.subG.connect(A.mix); A.sub.start();
  var nb = ac.createBuffer(1, ac.sampleRate * 2, ac.sampleRate), nd = nb.getChannelData(0); for (i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
  A.noise = ac.createBufferSource(); A.noise.buffer = nb; A.noise.loop = true; A.noiG = G(0); A.noise.connect(A.noiG); A.noiG.connect(A.mix); A.noise.start();
  A.f1 = ac.createBiquadFilter(); A.f2 = ac.createBiquadFilter(); A.f1.type = A.f2.type = 'lowpass'; A.f1.Q.value = 0.6;
  A.vca = G(0); A.trem = G(1); A.vol = G(0.8); A.mix.connect(A.f1); A.f1.connect(A.f2); A.f2.connect(A.vca); A.vca.connect(A.trem); A.trem.connect(A.vol); A.vol.connect(AU.ch[6].inp);
  A.env = ac.createConstantSource(); A.env.offset.value = 0; A.env.start(); A.envCut = G(0); A.envPrm = G(0); A.env.connect(A.envCut); A.env.connect(A.envPrm); A.envCut.connect(A.f1.detune); A.envCut.connect(A.f2.detune);
  A.l1 = ac.createOscillator(); A.l2 = ac.createOscillator(); A.l1.start(); A.l2.start(); A.l1pit = G(0); A.l1prm = G(0); A.l2cut = G(0); A.l2amp = G(0);
  A.l1.connect(A.l1pit); A.l1.connect(A.l1prm); A.l2.connect(A.l2cut); A.l2.connect(A.l2amp); A.l2cut.connect(A.f1.detune); A.l2cut.connect(A.f2.detune); A.l2amp.connect(A.trem.gain);
  A.osc.forEach(function(q){ A.l1pit.connect(q.o.detune); A.l1prm.connect(q.pre.gain); A.envPrm.connect(q.pre.gain); }); A.l1pit.connect(A.sub.detune);
  A.n = 48; A.vel = 0.8; shApply(); return true;
}
function shInt(v, n){ return Math.min(n - 1, Math.floor(v * n)); }
function shT(v){ return 0.002 + v * v * v * 4; }
function shApply(){
  if (!SHA) return; var A = SHA, P = SH.p, t = ac.currentTime, tc = 0.02, ring = shInt(P.op, 2);
  [[P.o1s, P.o1p], [P.o2s, P.o2p]].forEach(function(a, i){ var q = A.osc[i], s = shInt(a[0], 6); if (s !== q.shape){ q.shape = s; if (s < 3) q.o.type = ['sawtooth', 'square', 'triangle'][s]; else q.o.setPeriodicWave(A.waves[s]); } q.pre.gain.setTargetAtTime((1 + a[1] * 5) / 6, t, tc); });
  A.g1.gain.setTargetAtTime(ring ? 0 : Math.cos(P.mix * Math.PI / 2), t, tc); A.ringOut.gain.setTargetAtTime(ring ? Math.cos(P.mix * Math.PI / 2) * 1.6 : 0, t, tc); A.ring.gain.value = 0; A.g2.gain.setTargetAtTime(Math.sin(P.mix * Math.PI / 2), t, tc);
  var sw = shInt(P.subw, 4); A.sub.type = sw % 2 ? 'triangle' : 'square'; A.subG.gain.setTargetAtTime(P.sub * (sw % 2 ? 1.3 : 0.8), t, tc); A.noiG.gain.setTargetAtTime(P.noi * P.noi * 0.8, t, tc);
  A.f2.Q.setTargetAtTime(0.7 + P.res * 18, t, tc); A.envCut.gain.setTargetAtTime(P.fenv * 7200, t, tc); A.envPrm.gain.setTargetAtTime((P.e1prm - 0.5) * 1.4, t, tc);
  [[A.l1, P.l1w, P.l1r], [A.l2, P.l2w, P.l2r]].forEach(function(a){ a[0].type = ['triangle', 'square', 'square', 'sawtooth'][shInt(a[1], 4)]; a[0].frequency.setTargetAtTime(0.05 * Math.pow(600, a[2]), t, tc); });
  A.l1pit.gain.setTargetAtTime(P.l1pit * P.l1pit * 1200, t, tc); A.l1prm.gain.setTargetAtTime(P.l1prm * 0.35, t, tc); A.l2cut.gain.setTargetAtTime(P.l2cut * 3600, t, tc); A.l2amp.gain.setTargetAtTime(P.l2amp * 0.5, t, tc);
  shPitch(A.n, t, false, true);
}
function shPitch(n, t, slide, soft){
  var A = SHA, P = SH.p, g = P.glide * P.glide * 0.3, sw = shInt(P.subw, 4); A.n = n; n += SH.oct * 12;
  var fs = [mtof(n + Math.round((P.o1r - 0.5) * 48)), mtof(n + Math.round((P.o2r - 0.5) * 48) + P.o2t * P.o2t * 1.0), mtof(n) / (sw > 1 ? 4 : 2)];
  [A.osc[0].o, A.osc[1].o, A.sub].forEach(function(o, i){ if (!soft) o.frequency.cancelScheduledValues(t); if ((slide && g > 0.002) || soft) o.frequency.setTargetAtTime(fs[i], t, soft ? 0.02 : g); else o.frequency.setValueAtTime(fs[i], t); });
}
function shOn(n, vel, t, legato){
  var A = SHA, P = SH.p; shPitch(n, t, true); A.vel = vel; if (legato) return;
  var pk = lerp(1, 0.25 + vel * 0.75, P.vamp), a2 = shT(P.a2), a1 = shT(P.a1), v = A.vca.gain, e = A.env.offset;
  v.cancelScheduledValues(t); v.setTargetAtTime(pk, t, a2 / 3 + 0.001); v.setTargetAtTime(pk * P.s2, t + a2, shT(P.d2) / 2 + 0.003);
  e.cancelScheduledValues(t); e.setTargetAtTime(1, t, a1 / 3 + 0.001); e.setTargetAtTime(P.s1, t + a1, shT(P.d1) / 2 + 0.003);
}
function shOff(t){ var A = SHA, P = SH.p; A.vca.gain.cancelScheduledValues(t); A.vca.gain.setTargetAtTime(0, t, shT(P.r2) / 2 + 0.004); A.env.offset.cancelScheduledValues(t); A.env.offset.setTargetAtTime(0, t, shT(P.r1) / 2 + 0.004); }
function shNoteAt(n, vel, t, dur){ if (!shAudio()) return; shOn(n, vel, t, false); shOff(t + dur); SH.vis.push({ t:t, d:dur }); }
function shKeyDown(n){ unlock(); if (!shAudio()) return; SH.stack.push(n); shOn(n, 0.85, ac.currentTime + 0.003, SH.stack.length > 1); }
function shKeyUp(n){ SH.stack = SH.stack.filter(function(q){ return q !== n; }); if (!SHA) return; var t = ac.currentTime + 0.003; if (SH.stack.length) shPitch(SH.stack[SH.stack.length - 1], t, true); else shOff(t); }
function shKbDown(k){
  if (k === 'z' || k === 'x'){ SH.kbOct = clamp(SH.kbOct + (k === 'x' ? 1 : -1), -2, 2); shSay('keys octave ' + (SH.kbOct > 0 ? '+' : '') + SH.kbOct); return true; }
  var i = MFKB.indexOf(k); if (i < 0 || k.length !== 1) return false; if (SH.kb[k] != null) return true; var n = 48 + i + SH.kbOct * 12; SH.kb[k] = n; shKeyDown(n); return true;
}
function shKbUp(k){ if (SH.kb[k] != null){ shKeyUp(SH.kb[k]); delete SH.kb[k]; } }
function shLabel(c){
  if (c.pot != null){ var s = SHPAGES[SH.page][1][c.pot]; return s[2] + ': ' + s[3](SH.p[s[0]]) + ' · scroll or drag'; }
  if (c.id === 'shenc') return SH.mem ? 'Edit: scroll to pick a patch · click plays a note' : 'Edit: scroll to step pages · click plays a note';
  return c.name + ' · click';
}
function shPage(p){ SH.page = p; SH.mem = false; shPots(); }
function shPress(c){
  var k = c.bi; c.down = 1; setTimeout(function(){ c.down = 0; }, 130);
  if (k === 0) shPage(SH.page < 2 && !SH.mem ? SH.page + 1 : SH.page === 2 && !SH.mem ? 0 : 0);
  else if (k === 1) shPage(3);
  else if (k === 2) shPage(SH.page >= 4 && SH.page < 7 && !SH.mem ? SH.page + 1 : 4);
  else if (k === 3) shPage(8);
  else if (k === 4){ SH.oct = clamp(SH.oct + (M.shift ? -1 : 1), -2, 2); shSay('octave ' + (SH.oct > 0 ? '+' : '') + SH.oct); if (SHA) shPitch(SHA.n, ac.currentTime, false, true); shSaveSoon(); }
  else { SH.mem = !SH.mem; SH.dirty = true; }
}
function shCtl(c){ if (c.pot == null) return; var s = SHPAGES[SH.page][1][c.pot]; SH.p[s[0]] = c.v; shApply(); shSaveSoon(); SH.dirty = true; }
function shTurn(c, n){
  if (SH.mem){ shLoad(((SH.patch + n) % SHPRE.length + SHPRE.length) % SHPRE.length); SH.mem = true; }
  else shPage(((SH.page + n) % SHPAGES.length + SHPAGES.length) % SHPAGES.length);
}
DEVH.sh = { label:shLabel, press:shPress, release:NOP, ctl:shCtl, turn:shTurn };
function shPaintDisp(){
  var g = shDispC.getContext('2d'), a, b, now = performance.now(), S = SHPAGES[SH.page][1];
  g.fillStyle = '#03050A'; g.fillRect(0, 0, 520, 128);
  if (now < SH.msgUntil){ a = 'shru-1'; b = SH.msg; }
  else if (SH.mem){ a = 'load patch'; b = (SH.patch + 1) + ' ' + SHPRE[SH.patch].name; }
  else { a = ''; b = ''; S.forEach(function(s){ a += (s[1] + '    ').slice(0, 4); b += (s[3](SH.p[s[0]]) + '    ').slice(0, 4); }); }
  g.font = 'bold 50px "Lucida Console", "DejaVu Sans Mono", Menlo, Consolas, monospace'; g.textBaseline = 'middle'; g.textAlign = 'left'; g.fillStyle = '#56C6FF'; g.shadowColor = '#2E9CFF'; g.shadowBlur = 8;
  [a, b].forEach(function(s, r){ for (var i = 0; i < 16 && i < s.length; i++) g.fillText(s.charAt(i), 14 + i * 31, 36 + r * 58); });
  g.shadowBlur = 0; shDispT.needsUpdate = true;
}
function shUpdate(now, dt){
  var on = SH.stack.length > 0, p = SH.page;
  if (ac){ var t = ac.currentTime; SH.vis = SH.vis.filter(function(e){ if (e.t <= t && t < e.t + e.d) on = true; return e.t + e.d > t; }); }
  ledOn(SHLED.o1, !SH.mem && (p === 0 || p === 2) ? 1 : 0.05); ledOn(SHLED.o2, !SH.mem && (p === 1 || p === 2) ? 1 : 0.05); ledOn(SHLED.fl, !SH.mem && p === 3 ? 1 : 0.05);
  ledOn(SHLED.e1, !SH.mem && (p === 4 || p === 6) ? (p === 6 ? 0.45 : 1) : 0.05); ledOn(SHLED.e2, !SH.mem && (p === 5 || p === 7) ? (p === 7 ? 0.45 : 1) : 0.05); ledOn(SHLED.md, !SH.mem && p === 8 ? 1 : 0.05);
  ledOn(SHLED.oc, on ? 1 : SH.oct ? 0.4 : 0.08); ledOn(SHLED.me, SH.mem ? 1 : 0.08);
  for (var k = 0; k < 6; k++){ var c = CT['shb' + k], ty = c.y0 - (c.down ? 0.003 : 0); if (c.m.position.y !== ty) c.m.position.y = ty; }
  if (SHA){ var P = SH.p, n = SHA.n + SH.oct * 12, f = 40 * Math.pow(2, P.cut * 8 + (n - 48) / 12 * P.trk + (SHA.vel - 0.5) * P.vcut * 2 + snCv(6) * 2), tt = ac.currentTime; f = clamp(f, 30, 16000); SHA.f1.frequency.setTargetAtTime(f, tt, 0.015); SHA.f2.frequency.setTargetAtTime(f, tt, 0.015); }
  if (now > SH.msgUntil && SH.msg){ SH.msg = ''; SH.dirty = true; }
  if (SH.dirty){ SH.dirty = false; shPaintDisp(); }
}

RESTORE['jambutek-studio-shru-v1'] = function(){ shRestore(); shPots(); shApply(); }; SAVENOW.push(shSaveNow);
