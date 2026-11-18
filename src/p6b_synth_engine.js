
/* ================= the synth's engine: two digital oscillators, a filter, envelopes, LFOs, a mod matrix, three FX, arp + sequencer ================= */
var MFTYPES = ['BasicWaves', 'SuperWave', 'Harmo', 'Two Op. FM', 'Waveshaper', 'Formant', 'Chords', 'Noise'];
var MFPN = [['Morph', 'Sym', 'Sub'], ['Wave', 'Detune', 'Volume'], ['Content', 'Sculpting', 'Chorus'], ['Ratio', 'Amount', 'Feedback'], ['Wave', 'Amount', 'Asym'], ['Vowel', 'Shift', 'Breath'], ['Interval', 'Spread', 'Wave'], ['Colour', 'Reso', 'Sine']];
var MFFX = ['Chorus', 'Phaser', 'Flanger', 'Reverb', 'Delay', 'Distortion'];
var MFFXPN = [['Rate', 'Depth', 'Mix'], ['Rate', 'Feedback', 'Mix'], ['Rate', 'Feedback', 'Mix'], ['Decay', 'Damping', 'Dry/Wet'], ['Time', 'Feedback', 'Dry/Wet'], ['Tone', 'Gain', 'Dry/Wet']];
var MFLW = ['Sin', 'Tri', 'Saw', 'Sqr', 'SnH', 'SlewSNH', 'ExpSaw', 'ExpRamp'], MFMODE = ['Mono', 'Poly', 'Para', 'Uni'], MFCYC = ['Env', 'Run', 'Loop'], MFFT = ['lowpass', 'bandpass', 'highpass'];
var MFDIV = [[1, '1/4'], [0.5, '1/8'], [1 / 3, '1/8T'], [0.25, '1/16'], [1 / 6, '1/16T'], [0.125, '1/32']];
var MFCH = [[[0, 12], 'Oct'], [[0, 7], '5th'], [[0, 5, 7], 'Sus4'], [[0, 3, 7], 'm'], [[0, 3, 7, 10], 'm7'], [[0, 4, 7], 'M'], [[0, 4, 7, 11], 'M7'], [[0, 4, 7, 14], 'M9']];
function mfZ(){ var m = []; for (var i = 0; i < 7; i++) m.push([0, 0, 0, 0, 0, 0, 0]); return m; }
function mfP(name, cat, o){
  var p = { name:name, cat:cat, o:[{ t:0, semi:0, w:1, ti:0.5, s:0, v:0.8 }, { t:0, semi:0, w:1, ti:0.5, s:0, v:0 }], ft:0, cut:0.7, res:0.1, fenv:0.5, glide:0,
    a:0.02, d:0.4, s:0.6, r:0.3, mode:1, cm:0, rise:0.3, fall:0.4, hold:0.5, l:[{ rate:0.55, wave:0 }, { rate:0.3, wave:1 }],
    fx:[{ t:0, on:0, a:0.3, b:0.5, c:0.4 }, { t:4, on:0, a:0.5, b:0.4, c:0.3 }, { t:3, on:1, a:0.4, b:0.5, c:0.25 }], mat:mfZ() };
  Object.keys(o || {}).forEach(function(k){
    if (k === 'o1') Object.assign(p.o[0], o[k]); else if (k === 'o2') Object.assign(p.o[1], o[k]);
    else if (k === 'fx') o[k].forEach(function(f, i){ if (f) Object.assign(p.fx[i], f); });
    else if (k === 'mod') o[k].forEach(function(m){ p.mat[m[0]][m[1]] = m[2]; });
    else if (k === 'l1') Object.assign(p.l[0], o[k]); else if (k === 'l2') Object.assign(p.l[1], o[k]);
    else p[k] = o[k];
  });
  return p;
}
function mfFactory(){ return [
  mfP('Soft Keys', 'Keys', { o1:{ t:0, w:0.8, ti:0.3, s:0.2 }, o2:{ t:0, semi:12, w:0.2, ti:0.5, v:0.35 }, cut:0.5, res:0.15, fenv:0.72, a:0.01, d:0.45, s:0.35, r:0.35, fx:[{ on:1, a:0.3, b:0.4, c:0.35 }, null, { on:1, c:0.22 }], mod:[[4, 3, 0.3]] }),
  mfP('Fold Bass', 'Bass', { o1:{ t:4, semi:-12, w:0, ti:0.45, s:0.1 }, o2:{ t:0, semi:-12, w:0, ti:0.5, s:0.6, v:0.5 }, mode:0, glide:0.12, cut:0.42, res:0.25, fenv:0.75, a:0.005, d:0.4, s:0.3, r:0.2, fx:[null, null, { on:0 }], mod:[[1, 2, 0.35]] }),
  mfP('Super Pad', 'Pad', { o1:{ t:1, w:0, ti:0.55, s:0.8 }, o2:{ t:1, semi:-12, w:0, ti:0.4, s:0.7, v:0.6 }, cut:0.5, res:0.1, fenv:0.6, a:0.55, d:0.6, s:0.8, r:0.6, l2:{ rate:0.2, wave:1 }, fx:[{ on:1, a:0.25, b:0.6, c:0.5 }, null, { on:1, a:0.7, b:0.4, c:0.45 }], mod:[[3, 3, 0.18]] }),
  mfP('FM Bell', 'Keys', { o1:{ t:3, w:0.58, ti:0.4, s:0 }, o2:{ t:3, semi:12, w:0.9, ti:0.2, s:0, v:0.3 }, cut:0.85, a:0.003, d:0.6, s:0.1, r:0.6, fx:[null, { on:1, a:0.6, b:0.45, c:0.3 }, { on:1, a:0.6, c:0.35 }], mod:[[4, 2, 0.4]] }),
  mfP('Vowel Lead', 'Lead', { o1:{ t:5, w:0.1, ti:0.5, s:0.05 }, o2:{ t:0, w:1, ti:0.5, v:0.25 }, mode:0, glide:0.3, cut:0.8, a:0.03, d:0.5, s:0.8, r:0.25, l1:{ rate:0.35, wave:1 }, fx:[null, { on:1, a:0.5, b:0.4, c:0.3 }, { on:1, c:0.25 }], mod:[[2, 1, 0.45], [5, 0, 0.04]] }),
  mfP('Stab Chords', 'Stab', { o1:{ t:6, w:0.57, ti:0.4, s:0 }, o2:{ t:1, semi:-12, w:0, ti:0.3, s:0.5, v:0.4 }, cut:0.45, res:0.3, fenv:0.8, a:0.004, d:0.35, s:0.05, r:0.3, fx:[{ on:1 }, { on:1, a:0.66, b:0.5, c:0.35 }, { on:1, c:0.3 }] }),
  mfP('Glass Harmo', 'Pad', { o1:{ t:2, w:0.75, ti:0.5, s:0.5 }, o2:{ t:2, semi:7, w:0.3, ti:0.3, s:0.3, v:0.4 }, cut:0.9, a:0.3, d:0.6, s:0.7, r:0.65, cm:1, rise:0.6, fall:0.6, hold:0.1, fx:[{ on:1, a:0.2, b:0.5, c:0.4 }, null, { on:1, a:0.8, c:0.5 }], mod:[[0, 2, 0.4]] }),
  mfP('Acid Square', 'Bass', { o1:{ t:0, semi:-12, w:0, ti:0.1, s:0 }, mode:0, glide:0.2, cut:0.3, res:0.78, fenv:0.85, a:0.003, d:0.3, s:0.1, r:0.15, fx:[{ t:5, on:1, a:0.6, b:0.25, c:0.5 }, { on:1, a:0.66, b:0.4, c:0.2 }, { on:0 }] }),
  mfP('Wind Noise', 'SFX', { o1:{ t:7, w:0.5, ti:0.6, s:0 }, o2:{ t:7, semi:7, w:0.7, ti:0.8, s:0.1, v:0.5 }, cut:0.6, res:0.4, a:0.5, d:0.6, s:0.9, r:0.7, l1:{ rate:0.2, wave:5 }, fx:[null, { on:1, c:0.3 }, { on:1, a:0.8, c:0.5 }], mod:[[2, 3, 0.4], [3, 1, 0.3]] }),
  mfP('Uni Lead', 'Lead', { o1:{ t:1, w:0, ti:0.35, s:0.6 }, o2:{ t:0, semi:-12, w:0, ti:0.5, v:0.5 }, mode:3, glide:0.18, cut:0.6, res:0.2, fenv:0.65, a:0.005, d:0.4, s:0.7, r:0.25, fx:[null, { on:1, a:0.5, b:0.35, c:0.3 }, { on:1, c:0.2 }], mod:[[5, 0, 0.03]] }),
  mfP('Short Pluck', 'Keys', { o1:{ t:0, w:1, ti:0.5, s:0 }, o2:{ t:3, semi:12, w:0.28, ti:0.3, v:0.4 }, cut:0.35, res:0.2, fenv:0.85, a:0.002, d:0.28, s:0, r:0.28, fx:[null, { on:1, a:0.5, b:0.5, c:0.35 }, { on:1, c:0.3 }] }),
  mfP('Sub Organ', 'Organ', { o1:{ t:2, w:1, ti:0.25, s:0.2, v:0.6 }, o2:{ t:0, w:1, ti:0.5, s:1, v:0.35 }, cut:0.75, a:0.004, d:0.2, s:0.95, r:0.08, fx:[{ on:1, a:0.55, b:0.5, c:0.5 }, null, { on:1, c:0.2 }] })
]; }
var MF = { presets:mfFactory(), cur:0, p:null, oscSel:0, lfoSel:0, fxSel:2, shift:false, oct:0, hold:false, chord:false, chordType:4, as:0, seqPlay:false, rec:false, lastArm:false, page:0,
  arpMode:0, arpOct:1, mods:[0, 0, 0, 0], div:3, seqLen:16, seq:[], cursor:0, transp:0, mcur:0, medit:false, strip:0, sv:[[0.5, 0], [0, 0], [0.5, 0]],
  voices:[], down:{}, order:[], latched:{}, cmap:{}, stack:[], lastNote:60, lastVel:0.8, src:[0, 0, 0, 0, 0, 0, 0], lph:[0, 0], lval:[0, 0], lsh:[[0, 0], [0, 0]], cyc:{ ph:0, v:0, st:0 },
  clockOn:false, nextT:0, step:0, arpI:0, arpDir:1, pat:[], vis:[], visStep:-1, msgA:'', msgB:'', msgUntil:0, dirty:true, kbOct:0, kb:{}, eff:{} };
(function(){ var r = [48, null, 48, 60, null, 51, null, 48, 55, null, 48, 58, null, 51, 53, null]; for (var i = 0; i < 64; i++) MF.seq.push(i < 16 && r[i] != null ? { n:[r[i]] } : null); })();
MF.p = JSON.parse(JSON.stringify(MF.presets[0]));
var MFSAVE = 'jambutek-studio-synth-v1', mfSaveT = null;
function mfSave(){ store(MFSAVE, JSON.stringify({ v:1, presets:MF.presets, cur:MF.cur, p:MF.p, seq:MF.seq, seqLen:MF.seqLen, div:MF.div, master:CT.mfmaster.v, arpMode:MF.arpMode, arpOct:MF.arpOct })); }
function mfSaveSoon(){ clearTimeout(mfSaveT); mfSaveT = setTimeout(mfSave, 1200); }
(function(){ try {
  var s = JSON.parse(store(MFSAVE) || 'null'); if (!s || s.v !== 1 || !Array.isArray(s.presets) || s.presets.length !== MF.presets.length || !s.p || !s.p.o || !s.p.mat) return;
  MF.presets = s.presets; MF.cur = clamp(s.cur | 0, 0, MF.presets.length - 1); MF.p = s.p; if (Array.isArray(s.seq) && s.seq.length === 64) MF.seq = s.seq; MF.seqLen = clamp(s.seqLen | 0 || 16, 1, 64);
  MF.div = clamp(s.div | 0, 0, MFDIV.length - 1); if (typeof s.master === 'number') CT.mfmaster.v = clamp(s.master, 0, 1); MF.arpMode = clamp(s.arpMode | 0, 0, 7); MF.arpOct = clamp(s.arpOct | 0 || 1, 1, 4);
} catch (e) {} })();

/* ---- display + labels ---- */
function mfSay(a, b, ms){ MF.msgA = a; MF.msgB = b == null ? '' : b; MF.msgUntil = performance.now() + (ms || 1500); MF.dirty = true; }
function pct(v){ return String(Math.round(v * 100)); }
function mfMatTxt(r, c){ var a = Math.round(MF.p.mat[r][c] * 100); return (a > 0 ? '+' : '') + a; }
function mfTimeS(v, k){ var s = k === 'a' ? 0.002 + v * v * v * 4 : k === 'd' ? 0.01 + v * v * v * 6 : k === 'r' ? 0.01 + v * v * v * 8 : v * v * 1.5; return s < 1 ? Math.round(s * 1000) + ' ms' : s.toFixed(1) + ' s'; }
function mfLfoHz(v){ return 0.05 * Math.pow(2, v * 8.2); }
function mfInfo(c){                                   // [name, value] for a knob, as the screen and hover label show it
  var id = c.id, P = MF.p, o = P.o[MF.oscSel], f = P.fx[MF.fxSel], n = 'Osc ' + (MF.oscSel + 1) + ' ';
  switch (id){
    case 'mftype': return [n + 'Type', MFTYPES[o.t]];
    case 'mfwave': return [n + MFPN[o.t][0], o.t === 6 ? MFCH[Math.round(o.w * 7)][1] : pct(o.w)];
    case 'mftimbre': return [n + MFPN[o.t][1], pct(o.ti)];
    case 'mfshape': return [n + MFPN[o.t][2], pct(o.s)];
    case 'mfvol': return [n + 'Volume', pct(o.v)];
    case 'mftune': return [n + 'Tune', (o.semi > 0 ? '+' : '') + o.semi + ' semi'];
    case 'mfcut': return ['Cutoff', Math.round(20 * Math.pow(2, P.cut * 10)) + ' Hz'];
    case 'mfres': return ['Resonance', pct(P.res)];
    case 'mfenv': return ['Env amount', (P.fenv > 0.5 ? '+' : '') + Math.round((P.fenv - 0.5) * 200)];
    case 'mffxtype': return ['FX ' + (MF.fxSel + 1), MFFX[f.t] + (f.on ? '' : ' (off)')];
    case 'mftime': return ['FX ' + (MF.fxSel + 1) + ' ' + MFFXPN[f.t][0], f.t === 4 ? DIVS[clamp(Math.round(f.a * (DIVS.length - 1)), 0, DIVS.length - 1)][1] : pct(f.a)];
    case 'mfint': return ['FX ' + (MF.fxSel + 1) + ' ' + MFFXPN[f.t][1], pct(f.b)];
    case 'mfamt': return ['FX ' + (MF.fxSel + 1) + ' ' + MFFXPN[f.t][2], pct(f.c)];
    case 'mfmaster': return ['Master', pct(c.v)];
    case 'mfglide': return ['Glide', P.glide < 0.01 ? 'off' : mfTimeS(P.glide, 'g')];
    case 'mflforate': return ['LFO ' + (MF.lfoSel + 1) + ' Rate', mfLfoHz(P.l[MF.lfoSel].rate).toFixed(2) + ' Hz'];
    case 'mflfowave': return ['LFO ' + (MF.lfoSel + 1) + ' Wave', MFLW[P.l[MF.lfoSel].wave]];
    case 'mfrise': return ['CycEnv Rise', pct(P.rise)]; case 'mffall': return ['CycEnv Fall', pct(P.fall)]; case 'mfhold': return ['CycEnv Hold', pct(P.hold)];
    case 'mfatk': return ['Attack', mfTimeS(P.a, 'a')]; case 'mfdec': return ['Decay', mfTimeS(P.d, 'd')]; case 'mfsus': return ['Sustain', pct(P.s)]; case 'mfrel': return ['Release', mfTimeS(P.r, 'r')];
    case 'mftempo': return ['Tempo', M.bpm.toFixed(1) + '  ' + MFDIV[MF.div][1]];
    case 'mfpreset': return ['Preset', ('0' + (MF.cur + 1)).slice(-2) + ' ' + P.name];
    case 'mfmatrix': var r = (MF.mcur / 7) | 0, cc = MF.mcur % 7; return [MFSRC[r] + ' → ' + MFDST[cc], mfMatTxt(r, cc)];
    case 'mfs1': return [['Bend', 'Macro 1 · bright', 'Gate'][MF.strip], MF.strip ? pct(c.v) : String(Math.round((c.v - 0.5) * 200))];
    case 'mfs2': return [['Wheel', 'Macro 2 · space', 'Spice'][MF.strip], pct(c.v)];
  }
  if (id.indexOf('mfm') === 0) return [c.name, mfMatTxt(c.r, c.c)];
  return [c.name, ''];
}
function mfLabel(c){
  if (c.kind === 'key'){ var n = 48 + MF.oct * 12 + c.n; return NOTEN[n % 12] + (Math.floor(n / 12) - 1); }
  if (c.kind === 'knob' || c.kind === 'fader'){ var i = mfInfo(c); return i[0] + ' ' + i[1] + ' · scroll or drag' + (c.click ? ', click to push' : ''); }
  if (c.si != null) return MF.as === 1 ? 'Arp · ' + MFSTEPN[c.si] : MF.as === 2 ? 'Step ' + (MF.page * 16 + c.si + 1) : 'Step button · pick Arp or Seq first';
  return c.name;
}
function mfPaintDisp(){
  var g = mfDispC.getContext('2d'), now = performance.now(), P = MF.p, a, b;
  g.fillStyle = '#000'; g.fillRect(0, 0, 320, 152); g.textBaseline = 'middle'; g.textAlign = 'left';
  if (now < MF.msgUntil){ a = MF.msgA; b = MF.msgB; }
  else { a = ('0' + (MF.cur + 1)).slice(-2) + ' ' + P.name; b = P.cat + ' · ' + MFMODE[P.mode] + (MF.as ? ' · ' + (MF.as === 1 ? 'Arp ' + MFSTEPN[MF.arpMode] : 'Seq' + (MF.rec ? ' REC' : '')) : ''); }
  g.fillStyle = '#F2F2F2'; g.font = 'bold 34px "Helvetica Neue", Helvetica, Arial, sans-serif'; g.fillText(a, 10, 44, 300);
  g.fillStyle = now < MF.msgUntil ? '#FFFFFF' : '#9CC8FF'; g.font = 'bold ' + (now < MF.msgUntil ? 46 : 28) + 'px "Helvetica Neue", Helvetica, Arial, sans-serif'; g.fillText(b, 10, 108, 300);
  mfDispT.needsUpdate = true;
}
function mfSync(){                                    // put every knob where the patch says it is
  var P = MF.p, o = P.o[MF.oscSel], f = P.fx[MF.fxSel], l = P.l[MF.lfoSel];
  var m = { mftype:o.t / 7, mfwave:o.w, mftimbre:o.ti, mfshape:o.s, mfvol:o.v, mfcut:P.cut, mfres:P.res, mfenv:P.fenv, mftime:f.a, mfint:f.b, mfamt:f.c, mfglide:P.glide,
    mflforate:l.rate, mflfowave:l.wave / 7, mfrise:P.rise, mffall:P.fall, mfhold:P.hold, mfatk:P.a, mfdec:P.d, mfsus:P.s, mfrel:P.r };
  Object.keys(m).forEach(function(k){ CT[k].v = m[k]; CT[k].show(); });
  for (var r = 0; r < 7; r++) for (var c = 0; c < 7; c++) CT['mfm' + r + '_' + c].v = 0.5 + P.mat[r][c] / 2;
  CT.mfs1.bip = MF.strip === 0; CT.mfs1.v = MF.sv[MF.strip][0]; CT.mfs2.v = MF.sv[MF.strip][1]; CT.mfs1.show(); CT.mfs2.show(); CT.mfmaster.show();
  var sc = [0x4AA8FF, 0x4AA8FF, 0xFF8A2A][MF.strip]; CT.mfs1.glowM.color.setHex(sc); CT.mfs2.glowM.color.setHex(sc);
  MF.dirty = true;
}
mfSync();

/* ---- audio ---- */
var MFA = null;
function mtof(n){ return 440 * Math.pow(2, (n - 69) / 12); }
function PS(param, v, t, init){ if (init) param.value = v; else param.setTargetAtTime(v, t, 0.02); }
function mfAudio(){
  if (MFA) return true; unlock(); if (!AU.ready) return false;
  var A = { fx:[] };
  A.pitch = ac.createConstantSource(); A.pitch.offset.value = 0; A.pitch.start();
  A.cut = ac.createConstantSource(); A.cut.offset.value = 0; A.cut.start();
  A.pre = ac.createGain(); A.pre.gain.value = 1.0; A.trem = ac.createGain(); A.pre.connect(A.trem);
  A.master = ac.createGain(); A.master.connect(AU.ch[1].inp);
  var prev = A.trem;
  for (var i = 0; i < 3; i++){ var s = { i:i, inp:ac.createGain(), out:ac.createGain(), dry:ac.createGain(), nodes:[], set:null }; s.inp.connect(s.dry); s.dry.connect(s.out); prev.connect(s.inp); prev = s.out; A.fx.push(s); }
  prev.connect(A.master);
  var sh = new Float32Array(2048), fold = new Float32Array(2048); for (var k = 0; k < 2048; k++){ var x = k / 1024 - 1; sh[k] = Math.tanh(x * 3); fold[k] = Math.sin(x * Math.PI * 3.5); }
  A.tanh = sh; A.fold = fold; A.waves = {}; A.ir = {};
  MFA = A; for (var j = 0; j < 3; j++) mfFxBuild(j); mfApply();
  return true;
}
function mfApply(){ if (!MFA) return; MFA.master.gain.setTargetAtTime(Math.pow(CT.mfmaster.v, 1.6) * 2.0, ac.currentTime, 0.02); }
function mfIR(q){
  if (MFA.ir[q]) return MFA.ir[q];
  var secs = 0.4 + q / 8 * 5, len = Math.round(ac.sampleRate * secs), ir = ac.createBuffer(2, len, ac.sampleRate);
  for (var ch = 0; ch < 2; ch++){ var d = ir.getChannelData(ch), lp = 0; for (var i = 0; i < len; i++){ var t = i / len, w = (Math.random() * 2 - 1) * Math.pow(1 - t, 3.4) * (i < 300 ? i / 300 : 1); lp += (w - lp) * (0.8 - t * 0.5); d[i] = lp; } }
  return (MFA.ir[q] = ir);
}
function mfFxBuild(i){
  var s = MFA.fx[i], f = MF.p.fx[i], t = ac.currentTime;
  s.nodes.forEach(function(n){ try { if (n.stop) n.stop(); } catch (e) {} try { n.disconnect(); } catch (e2) {} }); s.nodes = []; s.set = null;
  try { s.inp.disconnect(); } catch (e3) {} s.inp.connect(s.dry); s.dry.gain.setTargetAtTime(1, t, 0.01);
  if (!f.on) return;
  function N(n){ s.nodes.push(n); return n; }
  function G(v){ var g = N(ac.createGain()); g.gain.value = v; return g; }
  function LFO(hz){ var o = N(ac.createOscillator()); o.frequency.value = hz; o.start(); return o; }
  var wet = G(0); wet.connect(s.out);
  if (f.t === 0 || f.t === 2){                         // chorus / flanger: modulated delays, left and right in opposite phase
    var fl = f.t === 2, base = fl ? 0.003 : 0.02, d1 = N(ac.createDelay(0.1)), d2 = N(ac.createDelay(0.1)), l = LFO(1), g1 = G(0), g2 = G(0), mg = N(ac.createChannelMerger(2)), fb = G(0);
    d1.delayTime.value = base; d2.delayTime.value = base * 1.3; s.inp.connect(d1); s.inp.connect(d2); l.connect(g1); l.connect(g2); g1.connect(d1.delayTime); g2.connect(d2.delayTime);
    d1.connect(mg, 0, 0); d2.connect(mg, 0, 1); mg.connect(wet); d1.connect(fb); fb.connect(d1);
    s.set = function(f, t, init){ PS(l.frequency, 0.08 + f.a * f.a * (fl ? 4 : 6), t, init); var dep = fl ? 0.0024 : 0.002 + f.b * 0.006; PS(g1.gain, dep, t, init); PS(g2.gain, -dep, t, init); PS(fb.gain, fl ? f.b * 0.85 : 0, t, init); PS(wet.gain, f.c, t, init); };
  } else if (f.t === 1){                               // phaser
    var aps = [], l2 = LFO(0.5), lg = G(0), fb2 = G(0), dl = N(ac.createDelay(0.01)), last = s.inp;
    [350, 620, 1100, 1900].forEach(function(fr){ var a = N(ac.createBiquadFilter()); a.type = 'allpass'; a.frequency.value = fr; a.Q.value = 0.6; last.connect(a); lg.connect(a.detune); last = a; aps.push(a); });
    l2.connect(lg); last.connect(wet); last.connect(fb2); fb2.connect(dl); dl.connect(aps[0]);
    s.set = function(f, t, init){ PS(l2.frequency, 0.05 + f.a * f.a * 5, t, init); PS(lg.gain, 1800, t, init); PS(fb2.gain, f.b * 0.8, t, init); PS(wet.gain, f.c, t, init); };
  } else if (f.t === 3){                               // reverb
    var cv = N(ac.createConvolver()), lp = N(ac.createBiquadFilter()), q = -1; lp.type = 'lowpass'; s.inp.connect(cv); cv.connect(lp); lp.connect(wet);
    s.set = function(f, t, init){ var nq = Math.round(f.a * 8); if (nq !== q){ q = nq; cv.buffer = mfIR(q); } PS(lp.frequency, 12000 * Math.pow(0.1, f.b), t, init); PS(wet.gain, f.c * 1.6, t, init); PS(s.dry.gain, 1 - f.c * 0.4, t, init); };
  } else if (f.t === 4){                               // ping-pong delay, synced to the room's tempo
    var a1 = N(ac.createDelay(2.5)), a2 = N(ac.createDelay(2.5)), fb3 = G(0), lp2 = N(ac.createBiquadFilter()), mg2 = N(ac.createChannelMerger(2)); lp2.type = 'lowpass'; lp2.frequency.value = 4500;
    s.inp.connect(a1); a1.connect(a2); a2.connect(lp2); lp2.connect(fb3); fb3.connect(a1); a1.connect(mg2, 0, 0); a2.connect(mg2, 0, 1); mg2.connect(wet);
    s.set = function(f, t, init){ var dv = DIVS[clamp(Math.round(f.a * (DIVS.length - 1)), 0, DIVS.length - 1)][0] * 60 / M.bpm; dv = Math.min(2.4, dv); if (init){ a1.delayTime.value = dv; a2.delayTime.value = dv; } else { a1.delayTime.setTargetAtTime(dv, t, 0.05); a2.delayTime.setTargetAtTime(dv, t, 0.05); } PS(fb3.gain, f.b * 0.85, t, init); PS(wet.gain, f.c, t, init); };
  } else {                                             // distortion
    var pre = G(1), ws = N(ac.createWaveShaper()), tone = N(ac.createBiquadFilter()), post = G(1); ws.curve = MFA.tanh; ws.oversample = '2x'; tone.type = 'lowpass';
    s.inp.connect(pre); pre.connect(ws); ws.connect(tone); tone.connect(post); post.connect(wet);
    s.set = function(f, t, init){ PS(pre.gain, 0.6 + f.b * 12, t, init); PS(post.gain, 1 / (1 + f.b * 1.5), t, init); PS(tone.frequency, 500 * Math.pow(32, f.a), t, init); PS(wet.gain, f.c, t, init); PS(s.dry.gain, 1 - f.c, t, init); };
  }
  s.set(f, t, true);
}
function mfFxSet(){ if (!MFA) return; MFA.fx.forEach(function(s, i){ if (s.set) s.set(MF.p.fx[i], ac.currentTime, false); }); }
function mfTempo(){ MF.dirty = true; mfFxSet(); }

/* the oscillator engines. x = voice context, p = { w, ti, s } (already with modulation applied) */
function harmoWave(w, ti){
  var key = Math.round(w * 20) + '_' + Math.round(ti * 20); if (MFA.waves[key]) return MFA.waves[key];
  var n = 40, re = new Float32Array(n), im = new Float32Array(n);
  for (var h = 1; h < n; h++){ var odd = h % 2 ? 1 : 0, p2 = (h & (h - 1)) === 0 ? 1 : 0, wt = w < 0.5 ? lerp(1, odd, w * 2) : lerp(odd, p2, (w - 0.5) * 2); im[h] = wt * Math.pow(h, -(2.4 - ti * 2.1)); }
  var pw = ac.createPeriodicWave(re, im); pw.key = key; return (MFA.waves[key] = pw);
}
var VOW = [[800, 1150, 2900], [400, 1600, 2700], [270, 2290, 3010], [450, 800, 2830], [325, 700, 2530]];
var MFENG = [
  function(x){ var saw = x.O('sawtooth', x.f), out = x.G(0.5), dl = ac.createDelay(0.08), inv = x.G(0), sub = x.O('sine', x.f / 2), sg = x.G(0);
    saw.connect(out); saw.connect(dl); dl.connect(inv); inv.connect(out); sub.connect(sg); sg.connect(out);
    return { out:out, set:function(p, t, i){ PS(inv.gain, -(1 - p.w), t, i); PS(dl.delayTime, Math.min(0.075, (0.5 - p.ti * 0.44) / x.f), t, i); PS(sg.gain, p.s * 1.2, t, i); } }; },
  function(x){ var out = x.G(0.42), side = x.G(0), ds = [-1, -0.55, 0.55, 1], os = ds.map(function(){ var o = x.O('sawtooth', x.f); o.connect(side); return o; }), c = x.O('sawtooth', x.f); c.connect(out); side.connect(out);
    return { out:out, set:function(p, t, i){ var ty = ['sawtooth', 'square', 'triangle', 'sine'][Math.min(3, Math.floor(p.w * 4))]; if (c.type !== ty){ c.type = ty; os.forEach(function(o){ o.type = ty; }); }
      os.forEach(function(o, k){ PS(o.detune, x.det + ds[k] * (2 + p.ti * 46), t, i); }); PS(side.gain, p.s, t, i); } }; },
  function(x){ var out = x.G(0.9), w0 = harmoWave(0, 0.5), o1 = x.O(w0, x.f), o2 = x.O(w0, x.f), g2 = x.G(0), key = ''; o1.connect(out); o2.connect(g2); g2.connect(out);
    return { out:out, set:function(p, t, i){ var w = harmoWave(p.w, p.ti); if (w.key !== key){ key = w.key; o1.setPeriodicWave(w); o2.setPeriodicWave(w); } PS(o2.detune, x.det + p.s * 22, t, i); PS(g2.gain, Math.min(1, p.s * 2.5), t, i); } }; },
  function(x){ var R = [0.5, 1, 1.5, 2, 3, 3.5, 5, 7], out = x.G(0.6), car = x.O('sine', x.f), m1 = x.O('sine', x.f), m2 = x.O('sawtooth', x.f), g1 = x.G(1), g2 = x.G(0), idx = x.G(0);
    m1.connect(g1); m2.connect(g2); g1.connect(idx); g2.connect(idx); idx.connect(car.frequency); car.connect(out);
    return { out:out, set:function(p, t, i){ var r = R[Math.min(7, Math.round(p.w * 7))]; PS(m1.frequency, x.f * r, t, i); PS(m2.frequency, x.f * r, t, i); PS(idx.gain, Math.pow(p.ti, 1.5) * x.f * 9, t, i); PS(g1.gain, 1 - p.s, t, i); PS(g2.gain, p.s, t, i); } }; },
  function(x){ var out = x.G(0.5), o = x.O('sine', x.f), pre = x.G(0.2), k = x.K(0), ws = ac.createWaveShaper(), hp = ac.createBiquadFilter(); ws.curve = MFA.fold; ws.oversample = '2x'; hp.type = 'highpass'; hp.frequency.value = 20;
    o.connect(pre); pre.connect(ws); k.connect(ws); ws.connect(hp); hp.connect(out);
    return { out:out, set:function(p, t, i){ var ty = ['sine', 'triangle', 'sawtooth'][Math.min(2, Math.floor(p.w * 3))]; if (o.type !== ty) o.type = ty; PS(pre.gain, 0.14 + p.ti * 0.86, t, i); PS(k.offset, p.s * 0.35, t, i); } }; },
  function(x){ var out = x.G(3.0), src = x.O('sawtooth', x.f), sg = x.G(1), nz2 = x.N(), ng = x.G(0), bus = x.G(1); src.connect(sg); sg.connect(bus); nz2.connect(ng); ng.connect(bus);
    var bps = [1, 0.6, 0.3].map(function(a){ var b = ac.createBiquadFilter(); b.type = 'bandpass'; b.Q.value = 9; var g = x.G(a); bus.connect(b); b.connect(g); g.connect(out); return b; });
    return { out:out, set:function(p, t, i){ var u = clamp(p.w, 0, 0.9999) * 4, a = Math.floor(u), fr = u - a, sh = 0.7 + p.ti * 0.8; bps.forEach(function(b, k){ PS(b.frequency, lerp(VOW[a][k], VOW[a + 1][k], fr) * sh, t, i); }); PS(ng.gain, p.s * 0.6, t, i); PS(sg.gain, 1 - p.s * 0.7, t, i); } }; },
  function(x){ var out = x.G(0.3), os = [0, 1, 2, 3].map(function(){ var o = x.O('sawtooth', x.f); o.connect(out); return o; });
    return { out:out, set:function(p, t, i){ var iv = MFCH[clamp(Math.round(p.w * 7), 0, 7)][0], ty = ['sawtooth', 'square', 'triangle'][Math.min(2, Math.floor(p.s * 3))];
      os.forEach(function(o, k){ if (o.type !== ty) o.type = ty; PS(o.frequency, x.f * Math.pow(2, (iv[k % iv.length] + 12 * Math.floor(k / iv.length)) / 12), t, i); PS(o.detune, x.det + (k - 1.5) * p.ti * 14, t, i); }); } }; },
  function(x){ var out = x.G(1.4), n = x.N(), bp = ac.createBiquadFilter(), ng = x.G(1), o = x.O('sine', x.f), sg = x.G(0); bp.type = 'bandpass'; x.pb.connect(bp.detune); n.connect(bp); bp.connect(ng); ng.connect(out); o.connect(sg); sg.connect(out);
    return { out:out, set:function(p, t, i){ PS(bp.frequency, Math.min(17000, x.f * Math.pow(2, p.w * 5)), t, i); PS(bp.Q, 0.6 + p.ti * p.ti * 40, t, i); PS(ng.gain, (1 - p.s * 0.8) * (1 + p.ti * 3), t, i); PS(sg.gain, p.s, t, i); } }; }
];
function mfEff(k){                                     // an oscillator's Wave / Timbre / Shape with the matrix's modulation added
  var o = MF.p.o[k], e = MF.eff;
  return k === 0 ? { w:clamp(o.w + (e.w1 || 0), 0, 1), ti:clamp(o.ti + (e.t1 || 0), 0, 1), s:clamp(o.s + (e.s1 || 0), 0, 1) } : { w:o.w, ti:clamp(o.ti + (e.t2 || 0), 0, 1), s:o.s };
}
function mfEnvAt(v, t){
  var A = v.adsr, dt = t - v.t0, L = dt < 0 ? 0 : dt < A.a ? dt / A.a : A.s + (1 - A.s) * Math.exp(-(dt - A.a) / (A.d / 3));
  if (v.tOff != null && t >= v.tOff) L = v.lOff * Math.exp(-(t - v.tOff) / (A.r / 3));
  return L;
}
function mfCutHz(){ return 20 * Math.pow(2, MF.p.cut * 10); }
function mfVoiceOn(note, vel, t, glideFrom){
  var P = MF.p, v = { note:note, cur:note, vel:vel, t0:t, tOff:null, lOff:0, oscs:[], e:[], dead:false,
    adsr:{ a:0.002 + P.a * P.a * P.a * 4, d:0.01 + P.d * P.d * P.d * 6, s:P.s, r:0.01 + P.r * P.r * P.r * 8 } };
  var pb = ac.createGain(); MFA.pitch.connect(pb); v.pb = pb;
  var gl = ac.createConstantSource(); gl.offset.value = 0; gl.connect(pb); gl.start(t); v.gl = gl; v.oscs.push(gl);
  var gt = P.glide * P.glide * 1.5;
  if (glideFrom != null && gt > 0.005 && glideFrom !== note){ gl.offset.setValueAtTime((glideFrom - note) * 100, t); gl.offset.setTargetAtTime(0, t, gt / 3); }
  var mix = ac.createGain(), uni = P.mode === 3 ? [-13, 0, 13] : [0], nO = P.mode === 2 ? 1 : 2; v.og = [];
  for (var k = 0; k < nO; k++){
    var o = P.o[k]; if (k === 1 && o.v < 0.005){ v.og.push(null); continue; }
    var g = ac.createGain(); g.gain.value = o.v * o.v * (uni.length > 1 ? 0.6 : 1); g.connect(mix); v.og.push(g);
    uni.forEach(function(det){
      var x = { f:mtof(note + o.semi), t:t, det:det, pb:pb,
        O:function(type, fr){ var os = ac.createOscillator(); if (typeof type === 'string') os.type = type; else os.setPeriodicWave(type); os.frequency.value = fr; os.detune.value = det; pb.connect(os.detune); os.start(t); v.oscs.push(os); return os; },
        G:function(val){ var gg = ac.createGain(); gg.gain.value = val; return gg; },
        K:function(val){ var c = ac.createConstantSource(); c.offset.value = val; c.start(t); v.oscs.push(c); return c; },
        N:function(){ var s = ac.createBufferSource(); s.buffer = AU.noise; s.loop = true; s.start(t, Math.random()); v.oscs.push(s); return s; } };
      var e = MFENG[o.t](x); e.set(mfEff(k), t, true); e.out.connect(g); v.e.push({ k:k, e:e });
    });
  }
  var fl = ac.createBiquadFilter(); fl.type = MFFT[P.ft]; fl.frequency.value = mfCutHz(); fl.Q.value = 0.5 + P.res * P.res * 18; fl.detune.value = (note - 60) * 50; v.fl = fl;
  var env = ac.createConstantSource(); env.offset.value = 0; env.start(t); v.env = env; v.oscs.push(env);
  var fe = ac.createGain(); fe.gain.value = (P.fenv - 0.5) * 2 * 7200; env.connect(fe); fe.connect(fl.detune); MFA.cut.connect(fl.detune); v.fe = fe;
  var vca = ac.createGain(); vca.gain.value = 0; var vg = ac.createGain(); vg.gain.value = 0.6 * (0.35 + 0.65 * vel); env.connect(vg); vg.connect(vca.gain); v.vca = vca;
  mix.connect(fl); fl.connect(vca); vca.connect(MFA.pre);
  env.offset.setValueAtTime(0, t); env.offset.linearRampToValueAtTime(1, t + v.adsr.a); env.offset.setTargetAtTime(v.adsr.s, t + v.adsr.a, v.adsr.d / 3);
  MF.voices.push(v); MF.lastNote = note; MF.lastVel = vel; MF.envV = v;
  if (P.cm !== 1){ MF.cyc.gate = true; MF.cyc.st = 0; if (P.cm === 2) MF.cyc.ph = 0; }
  var max = P.mode === 2 ? 12 : P.mode === 1 ? 6 : 1, live = MF.voices.filter(function(q){ return !q.dead && !q.killed && q.tOff == null; }), all = MF.voices.filter(function(q){ return !q.dead && !q.killed; });
  while (live.length > max) mfKill(live.shift(), t);
  while (all.length > 16) mfKill(all.shift(), t);
  return v;
}
function mfEnd(v, tEnd){
  v.oscs.forEach(function(o){ try { o.stop(tEnd); } catch (e) {} });
  clearTimeout(v.tm); v.tm = setTimeout(function(){ v.dead = true; try { v.vca.disconnect(); MFA.pitch.disconnect(v.pb); MFA.cut.disconnect(v.fl.detune); } catch (e) {} var i = MF.voices.indexOf(v); if (i >= 0) MF.voices.splice(i, 1); }, Math.max(0, (tEnd - ac.currentTime) * 1000) + 120);
}
function mfOff(v, t){
  if (v.tOff != null || v.dead) return; t = Math.max(t, v.t0 + 0.005);
  v.lOff = mfEnvAt(v, t); v.tOff = t;
  v.env.offset.cancelScheduledValues(t); v.env.offset.setValueAtTime(v.lOff, t); v.env.offset.setTargetAtTime(0, t, v.adsr.r / 3);
  mfEnd(v, t + v.adsr.r * 2.2 + 0.05);
}
function mfKill(v, t){
  if (v.dead || v.killed) return; v.killed = true; v.tOff = v.tOff == null ? t : Math.min(v.tOff, t); v.lOff = 0;
  v.env.offset.cancelScheduledValues(t); v.env.offset.setTargetAtTime(0, t, 0.004); mfEnd(v, t + 0.05);
}
function mfLive(set){ var t = ac.currentTime; MF.voices.forEach(function(v){ if (!v.dead) set(v, t); }); }

/* ---- playing notes ---- */
function mfNoteOn(n, vel){
  if (!mfAudio()) return; var t = ac.currentTime + 0.003, P = MF.p;
  if (P.mode === 0 || P.mode === 3){
    MF.stack = MF.stack.filter(function(q){ return q !== n; }); MF.stack.push(n);
    var cur = MF.mono && !MF.mono.dead && MF.mono.tOff == null ? MF.mono : null;
    if (cur){ var gt = P.glide * P.glide * 1.5; cur.gl.offset.cancelScheduledValues(t); cur.gl.offset.setTargetAtTime((n - cur.note) * 100, t, Math.max(0.004, gt / 3)); cur.cur = n; MF.lastNote = n; }
    else MF.mono = mfVoiceOn(n, vel, t, MF.lastNote);
  } else mfVoiceOn(n, vel, t, P.glide > 0.07 ? MF.lastNote : null);
}
function mfNoteOff(n){
  if (!MFA) return; var t = ac.currentTime + 0.003, P = MF.p;
  if (P.mode === 0 || P.mode === 3){
    MF.stack = MF.stack.filter(function(q){ return q !== n; }); var v = MF.mono; if (!v || v.dead || v.tOff != null) return;
    if (MF.stack.length){ var b = MF.stack[MF.stack.length - 1], gt = P.glide * P.glide * 1.5; v.gl.offset.cancelScheduledValues(t); v.gl.offset.setTargetAtTime((b - v.note) * 100, t, Math.max(0.004, gt / 3)); v.cur = b; }
    else mfOff(v, t);
  } else MF.voices.forEach(function(v){ if (v.note === n && v.tOff == null && !v.sched) mfOff(v, t); });
}
function mfNoteAt(n, vel, t, dur){                     // a note the arp or sequencer plays
  var P = MF.p; if (P.mode === 0 || P.mode === 3) MF.voices.forEach(function(q){ if (!q.dead && q.sched && q.tOff != null && q.tOff > t) mfKill(q, t); });
  var v = mfVoiceOn(n, vel, t, P.glide > 0.07 ? MF.lastSched : null); v.sched = true; MF.lastSched = n; mfOff(v, t + dur);
  MF.vis.push({ t:t, n:n, d:dur });
}
function mfHeld(){ return MF.order.filter(function(n){ return MF.down[n] || MF.latched[n]; }); }
function mfSound(n, vel){ var ns = MF.chord ? MFCH[MF.chordType][0].map(function(i){ return n + i; }) : [n]; if (MF.p.mode === 0 || MF.p.mode === 3) ns = [n]; MF.cmap[n] = ns; ns.forEach(function(q){ mfNoteOn(q, vel); }); }
function mfSilence(n){ (MF.cmap[n] || [n]).forEach(mfNoteOff); delete MF.cmap[n]; }
function mfKeyDown(n, vel){
  if (!mfAudio()) return; vel = vel || 0.8; MF.lastVel = vel;
  if (MF.as === 2 && MF.rec){
    var at = MF.seqPlay ? Math.max(0, MF.visStep) : MF.cursor; MF.seq[at] = { n:[n] }; if (!MF.seqPlay){ MF.cursor = (MF.cursor + 1) % MF.seqLen; MF.page = (MF.cursor / 16) | 0; } mfSaveSoon();
    if (MF.seqPlay) return;
  } else if (MF.as === 2 && MF.seqPlay){ MF.transp = n - 60; mfSay('Transpose', (MF.transp > 0 ? '+' : '') + MF.transp); return; }
  if (MF.hold && MF.latched[n]){ delete MF.latched[n]; MF.order = MF.order.filter(function(q){ return q !== n; }); if (MF.cmap[n]) mfSilence(n); return; }
  MF.order = MF.order.filter(function(q){ return q !== n; }); MF.order.push(n);
  if (MF.hold) MF.latched[n] = 1; else MF.down[n] = 1;
  if (MF.as === 1){ MF.pat = []; if (M.playing) return; }
  mfSound(n, vel);
}
function mfKeyUp(n){
  if (!MF.down[n]) return; delete MF.down[n]; MF.order = MF.order.filter(function(q){ return q !== n || MF.latched[n]; });
  MF.pat = []; if (MF.cmap[n]) mfSilence(n);
}
function mfAllOff(){ Object.keys(MF.cmap).forEach(function(n){ mfSilence(+n); }); MF.down = {}; MF.latched = {}; MF.order = []; MF.stack = []; }

/* ---- arpeggiator + sequencer clock (shares the room's tempo, and locks to the drum machine when it is running) ---- */
function mfClock(t, N, sd, sw){                       // called by the drum machine on every 16th it schedules
  var run = (MF.as === 1 && mfHeld().length > 0) || (MF.as === 2 && MF.seqPlay);
  if (!run || !MFA){ MF.clockOn = false; MF.visStep = -1; return; }
  if (!MF.clockOn){ MF.clockOn = true; MF.arpI = 0; MF.rep = 0; }
  var L = MFDIV[MF.div][0] * 4;
  for (var k = Math.ceil(N / L - 1e-6); k * L < N + 1 - 1e-6; k++){ var pos = k * L, r = Math.round(pos), on = Math.abs(pos - r) < 1e-6; mfStep(t + (pos - N) * sd + (on && r % 2 ? sw * sd : 0), sd * L, k); }
}
function mfOnStart(){ MF.clockOn = false; if (MF.as === 1) Object.keys(MF.cmap).forEach(function(n){ mfSilence(+n); }); }
function mfOnStop(){ MF.clockOn = false; MF.visStep = -1; MF.vis = []; if (MFA){ var t = ac.currentTime; MF.voices.forEach(function(v){ if (v.sched) mfKill(v, t); }); } }
function mfStep(t, sd, kk){
  var gate = MF.sv[2][0], spice = MF.sv[2][1], dur = sd * (0.12 + gate * 1.0), vel = MF.lastVel;
  if (spice > 0.02){ if (Math.random() < spice * 0.5) dur *= rnd(0.3, 1.6); vel = clamp(vel * (1 + (Math.random() - 0.5) * spice), 0.2, 1); }
  var notes = [];
  if (MF.as === 1){
    var h = mfHeld(); if (!h.length) return;
    var base = MF.arpMode === 4 ? h.slice() : h.slice().sort(function(a, b){ return a - b; }), all = [];
    for (var o = 0; o < MF.arpOct; o++) base.forEach(function(n){ all.push(n + 12 * o); });
    var L = all.length, m = MF.arpMode, i = MF.arpI;
    if (m === 5) notes = all.slice(0, 8);
    else if (m === 3) notes = [all[(Math.random() * L) | 0]];
    else if (m === 6){ MF.arpI = i = ((i + (Math.random() < 0.5 ? -1 : Math.random() < 0.5 ? 0 : 1)) % L + L) % L; notes = [all[i]]; }
    else if (m === 7){ if (MF.pat.length !== Math.max(4, L)){ MF.pat = []; for (var k = 0; k < Math.max(4, L); k++) MF.pat.push((Math.random() * L) | 0); MF.pat[0] = 0; } notes = [all[MF.pat[i % MF.pat.length] % L]]; }
    else if (m === 1) notes = [all[L - 1 - (i % L)]];
    else if (m === 2){ var per = Math.max(1, 2 * L - 2), q = i % per; notes = [all[q < L ? q : per - q]]; }
    else notes = [all[i % L]];
    if (m !== 6 && (!MF.mods[0] || (MF.rep = (MF.rep || 0) + 1) % 2 === 0)) MF.arpI = i + 1;
    notes = notes.map(function(n){ if (MF.mods[2] && Math.random() < 0.3) n += Math.random() < 0.5 ? 12 : -12; if (MF.mods[3] && Math.random() < 0.2) n += [7, 12, -5, 5][(Math.random() * 4) | 0]; return n; });
  } else {
    var s = kk % MF.seqLen, st = MF.seq[s]; MF.vis.push({ t:t, step:s });
    if (st) notes = st.n.map(function(n){ return n + MF.transp; });
  }
  notes.forEach(function(n){
    if (MF.as === 1 && MF.mods[1]){ mfNoteAt(n, vel, t, dur * 0.45); mfNoteAt(n, vel * 0.8, t + sd / 2, dur * 0.45); } else mfNoteAt(n, vel, t, dur);
  });
}

/* ---- every control ---- */
function mfCtl(c){
  var id = c.id, P = MF.p, o = P.o[MF.oscSel], f = P.fx[MF.fxSel], l = P.l[MF.lfoSel], v = c.v, live = !!MFA;
  if (id.indexOf('mfm') === 0){ var a = Math.round((v - 0.5) * 200) / 100; if (Math.abs(a) < 0.02) a = 0; P.mat[c.r][c.c] = a; MF.mcur = c.r * 7 + c.c; }
  else switch (id){
    case 'mftype': var nt = Math.round(v * 7); if (nt !== o.t){ o.t = nt; } break;
    case 'mfwave': o.w = v; break; case 'mftimbre': o.ti = v; break; case 'mfshape': o.s = v; break;
    case 'mfvol': o.v = v; if (live) mfLive(function(q, t){ var g = q.og[MF.oscSel]; if (g) g.gain.setTargetAtTime(v * v, t, 0.02); }); break;
    case 'mfcut': P.cut = v; if (live) mfLive(function(q, t){ q.fl.frequency.setTargetAtTime(mfCutHz(), t, 0.02); }); break;
    case 'mfres': P.res = v; if (live) mfLive(function(q, t){ q.fl.Q.setTargetAtTime(0.5 + v * v * 18, t, 0.02); }); break;
    case 'mfenv': if (Math.abs(v - 0.5) < 0.025) v = 0.5; P.fenv = v; if (live) mfLive(function(q, t){ q.fe.gain.setTargetAtTime((v - 0.5) * 2 * 7200, t, 0.02); }); break;
    case 'mftime': f.a = v; mfFxSet(); break; case 'mfint': f.b = v; mfFxSet(); break; case 'mfamt': f.c = v; mfFxSet(); break;
    case 'mfmaster': mfApply(); break;
    case 'mfglide': P.glide = v; break;
    case 'mflforate': l.rate = v; break; case 'mflfowave': l.wave = Math.round(v * 7); break;
    case 'mfrise': P.rise = v; break; case 'mffall': P.fall = v; break; case 'mfhold': P.hold = v; break;
    case 'mfatk': P.a = v; break; case 'mfdec': P.d = v; break; case 'mfsus': P.s = v; break; case 'mfrel': P.r = v; break;
    case 'mfs1': MF.sv[MF.strip][0] = v; break; case 'mfs2': MF.sv[MF.strip][1] = v; break;
  }
  var i = mfInfo(c); mfSay(i[0], i[1]); if (id !== 'mfs1' && id !== 'mfs2') mfSaveSoon();
}
function mfLoad(i){ MF.cur = (i + MF.presets.length) % MF.presets.length; MF.p = JSON.parse(JSON.stringify(MF.presets[MF.cur])); MF.eff = {}; mfSync(); if (MFA) for (var k = 0; k < 3; k++) mfFxBuild(k); MF.msgUntil = 0; MF.dirty = true; mfSaveSoon(); }
function mfTurn(c, n){                                 // the endless encoders
  var P = MF.p, o = P.o[MF.oscSel], f = P.fx[MF.fxSel];
  switch (c.id){
    case 'mfpreset': mfLoad(MF.cur + n); return;
    case 'mftune': o.semi = clamp(o.semi + n * (MF.shift ? 12 : 1), -48, 48); break;
    case 'mffxtype': f.t = ((f.t + n) % MFFX.length + MFFX.length) % MFFX.length; if (MFA) mfFxBuild(MF.fxSel); break;
    case 'mftempo': if (MF.shift) MF.div = clamp(MF.div + n, 0, MFDIV.length - 1); else setBpm(M.bpm + n); break;
    case 'mfmatrix':
      if (MF.medit){ var r = (MF.mcur / 7) | 0, cc = MF.mcur % 7, a = clamp(Math.round(P.mat[r][cc] * 100 + n * 2) / 100, -1, 1); P.mat[r][cc] = a; CT['mfm' + r + '_' + cc].v = 0.5 + a / 2; }
      else MF.mcur = ((MF.mcur + n) % 49 + 49) % 49;
      break;
  }
  var i = mfInfo(c); mfSay(i[0], i[1]); mfSaveSoon();
}
CT.mfmatrix.click = function(){ MF.medit = !MF.medit; mfSay(MF.medit ? 'Amount' : 'Matrix', MF.medit ? 'turn to set' : 'turn to move'); };
CT.mffxtype.click = function(){ var f = MF.p.fx[MF.fxSel]; f.on = f.on ? 0 : 1; if (MFA) mfFxBuild(MF.fxSel); mfSay('FX ' + (MF.fxSel + 1) + ' ' + MFFX[f.t], f.on ? 'On' : 'Off'); mfSaveSoon(); };
CT.mfpreset.click = function(){ mfLoad(MF.cur); mfSay('Reloaded', MF.p.name); };
CT.mftune.click = function(){ MF.p.o[MF.oscSel].semi = 0; mfSay('Osc ' + (MF.oscSel + 1) + ' Tune', '0 semi'); };
CT.mftempo.click = function(){ mfSay('Time Div', MFDIV[MF.div][1] + ' · Shift+turn'); };
function mfPress(c){
  var id = c.id, P = MF.p; MF.dirty = true;
  if (c.kind === 'key'){
    var vel = 0.8; if (c._hit){ var lp = MFG.worldToLocal(c._hit.point.clone()); vel = clamp(0.4 + 0.6 * (lp.z - c.zf) / c.len, 0.35, 1); }
    c.note = 48 + MF.oct * 12 + c.n; mfKeyDown(c.note, vel); return;
  }
  if (c.si != null){
    var i = c.si;
    if (MF.as === 1){ if (i < 8){ MF.arpMode = i; MF.arpI = 0; MF.pat = []; mfSay('Arp mode', MFSTEPN[i]); } else if (i < 12){ MF.arpOct = i - 7; mfSay('Arp range', (i - 7) + ' oct'); } else { MF.mods[i - 12] = MF.mods[i - 12] ? 0 : 1; mfSay(MFSTEPN[i], MF.mods[i - 12] ? 'On' : 'Off'); } }
    else if (MF.as === 2){
      var s = MF.page * 16 + i;
      if (MF.lastArm){ MF.seqLen = s + 1; MF.lastArm = false; mfSay('Seq length', String(MF.seqLen)); }
      else if (MF.seq[s]){ MF.seq[s] = null; MF.cursor = s; }
      else { MF.seq[s] = { n:[MF.lastNote] }; MF.cursor = s; if (!MF.seqPlay && mfAudio()) mfNoteAt(MF.lastNote, 0.8, ac.currentTime + 0.005, 0.2); }
    } else mfSay('Step buttons', 'pick Arp or Seq');
    mfSaveSoon(); return;
  }
  if (c.pg != null){ MF.page = c.pg; mfSay('Steps', (c.pg * 16 + 1) + '–' + (c.pg * 16 + 16)); return; }
  switch (id){
    case 'mfshift': MF.shift = !MF.shift; return;
    case 'mfoctdn': case 'mfoctup': mfAllOff(); MF.oct = clamp(MF.oct + (id === 'mfoctup' ? 1 : -1), -2, 2); mfSay('Octave', (MF.oct > 0 ? '+' : '') + MF.oct); return;
    case 'mfholdb':
      if (MF.as === 2 && MF.rec && !MF.seqPlay){ MF.seq[MF.cursor] = null; MF.cursor = (MF.cursor + 1) % MF.seqLen; mfSay('Rest', 'step ' + (MF.cursor + 1)); mfSaveSoon(); return; }
      MF.hold = !MF.hold; if (!MF.hold){ var was = Object.keys(MF.latched); MF.latched = {}; was.forEach(function(n){ n = +n; if (!MF.down[n]){ MF.order = MF.order.filter(function(q){ return q !== n; }); if (MF.cmap[n]) mfSilence(n); } }); }
      mfSay('Hold', MF.hold ? 'On · keys latch' : 'Off'); return;
    case 'mfchord': if (MF.shift){ MF.chordType = (MF.chordType + 1) % MFCH.length; MF.chord = true; } else MF.chord = !MF.chord; mfSay('Chord', MF.chord ? MFCH[MF.chordType][1] + ' · Shift = next' : 'Off'); return;
    case 'mfoscsel': MF.oscSel = 1 - MF.oscSel; mfSync(); mfSay('Osc ' + (MF.oscSel + 1), MFTYPES[P.o[MF.oscSel].t]); return;
    case 'mflfosel': MF.lfoSel = 1 - MF.lfoSel; mfSync(); mfSay('LFO ' + (MF.lfoSel + 1), MFLW[P.l[MF.lfoSel].wave]); return;
    case 'mffxsel': MF.fxSel = (MF.fxSel + 1) % 3; mfSync(); var f = P.fx[MF.fxSel]; mfSay('FX ' + (MF.fxSel + 1), MFFX[f.t] + (f.on ? '' : ' (off)')); return;
    case 'mfftype': P.ft = (P.ft + 1) % 3; if (MFA) mfLive(function(q){ q.fl.type = MFFT[P.ft]; }); mfSay('Filter', ['Low Pass', 'Band Pass', 'High Pass'][P.ft]); mfSaveSoon(); return;
    case 'mfcycmode': P.cm = (P.cm + 1) % 3; mfSay('Cycling Env', MFCYC[P.cm]); mfSaveSoon(); return;
    case 'mfenvmode': mfAllOff(); P.mode = (P.mode + 1) % 4; mfSay('Voice mode', MFMODE[P.mode]); mfSaveSoon(); return;
    case 'mfsave': MF.presets[MF.cur] = JSON.parse(JSON.stringify(P)); mfSave(); mfSay('Preset Saved', ('0' + (MF.cur + 1)).slice(-2)); return;
    case 'mfsedit': mfSay('Sound Edit', 'not fitted yet'); return;
    case 'mfmods': mfSay('Mods', 'not fitted yet'); return;
    case 'mfsm0': case 'mfsm1': case 'mfsm2': MF.strip = +id.slice(-1); mfSync(); mfSay('Strips', ['Bend / Wheel', 'Macro 1 / 2', 'Gate / Spice'][MF.strip]); return;
    case 'mfoff': case 'mfarp': case 'mfseq':
      MF.as = id === 'mfoff' ? 0 : id === 'mfarp' ? 1 : 2; MF.seqPlay = false; MF.rec = false; MF.clockOn = false; MF.visStep = -1; mfAllOff();
      mfSay(['Arp / Seq Off', 'Arpeggiator', 'Sequencer'][MF.as], MF.as === 1 ? (M.playing ? 'hold keys' : 'runs with the drums') : MF.as === 2 ? 'press ▶' : '', 2200); return;
    case 'mfplay':
      if (!mfAudio()) return;
      if (MF.as !== 2){ MF.as = 2; MF.clockOn = false; mfAllOff(); }
      MF.seqPlay = !MF.seqPlay; MF.clockOn = false; MF.transp = MF.seqPlay ? MF.transp : 0; mfSay('Sequencer', MF.seqPlay ? (M.playing ? 'Play' : 'waits for drums') : 'Stop', 2200); return;
    case 'mfrec': if (MF.as !== 2){ MF.as = 2; mfAllOff(); } MF.rec = !MF.rec; mfSay('Record', MF.rec ? (MF.seqPlay ? 'play the keys' : 'step ' + (MF.cursor + 1) + ' · play a key') : 'Off', 2200); return;
    case 'mflast': MF.lastArm = !MF.lastArm; if (MF.lastArm){ if (MF.as !== 2) MF.as = 2; mfSay('Last Step', 'press a step'); } return;
  }
}
function mfRelease(c){ if (c.kind === 'key' && c.note != null){ mfKeyUp(c.note); c.note = null; } }
var MFKB = 'awsedftgyhujkolp;';
function mfKbDown(k){
  if (k === 'z' || k === 'x'){ MF.kbOct = clamp(MF.kbOct + (k === 'x' ? 1 : -1), -2, 2); mfSay('Keys octave', (MF.kbOct > 0 ? '+' : '') + MF.kbOct); return true; }
  var i = MFKB.indexOf(k); if (i < 0 || k.length !== 1) return false;
  var n = 60 + i + (MF.kbOct + MF.oct) * 12; if (MF.kb[k] != null) return true; MF.kb[k] = n; mfKeyDown(n, 0.85); return true;
}
function mfKbUp(k){ if (MF.kb[k] != null){ mfKeyUp(MF.kb[k]); delete MF.kb[k]; } }

/* ---- every frame: modulation, lights, keys, screen ---- */
function mfLfoVal(i, dt){
  var l = MF.p.l[i], ph = MF.lph[i] + mfLfoHz(l.rate) * dt, wrap = ph >= 1; ph -= Math.floor(ph); MF.lph[i] = ph;
  if (wrap){ MF.lsh[i][0] = MF.lsh[i][1]; MF.lsh[i][1] = Math.random() * 2 - 1; }
  switch (l.wave){
    case 0: return Math.sin(ph * Math.PI * 2); case 1: return 1 - 4 * Math.abs(ph - 0.5); case 2: return 1 - 2 * ph; case 3: return ph < 0.5 ? 1 : -1;
    case 4: return MF.lsh[i][1]; case 5: return lerp(MF.lsh[i][0], MF.lsh[i][1], ph * ph * (3 - 2 * ph)); case 6: return Math.pow(1 - ph, 3) * 2 - 1; default: return Math.pow(ph, 3) * 2 - 1;
  }
}
function mfCycVal(dt, anyDown){
  var P = MF.p, C = MF.cyc, rt = 0.01 + P.rise * P.rise * 4, ft = 0.01 + P.fall * P.fall * 4;
  if (P.cm === 0){                                     // Env: rise, sit at the hold level while a key is down, fall on release
    if (anyDown){ if (C.st === 0){ C.v += dt / rt; if (C.v >= 1){ C.v = 1; C.st = 1; } } else C.v += (P.hold - C.v) * Math.min(1, dt * 6); } else { C.st = 0; C.v = Math.max(0, C.v - dt / ft); }
  } else {                                             // Run / Loop: rise, hold, fall, over and over
    var ht = P.hold * 2, tot = rt + ht + ft; C.ph = (C.ph + dt / tot) % 1; var x = C.ph * tot; C.v = x < rt ? x / rt : x < rt + ht ? 1 : 1 - (x - rt - ht) / ft;
  }
  return clamp(C.v, 0, 1);
}
function mfUpdate(now, dt){
  var P = MF.p, t = ac ? ac.currentTime : 0, blink = (now % 420) < 210, k, i;
  // strips: the bend strip springs back when you let go
  if (MF.strip === 0 && !(drag && drag.c === CT.mfs1) && Math.abs(CT.mfs1.v - 0.5) > 0.002){ CT.mfs1.v = lerp(CT.mfs1.v, 0.5, 1 - Math.exp(-dt * 14)); MF.sv[0][0] = CT.mfs1.v; CT.mfs1.show(); }
  // modulation sources
  var anyDown = MF.voices.some(function(v){ return !v.dead && (v.tOff == null || v.tOff > t); }), S = MF.src;
  S[0] = mfCycVal(dt, anyDown); S[1] = MF.envV && !MF.envV.dead && ac ? clamp(mfEnvAt(MF.envV, t), 0, 1) : 0; S[2] = MF.lval[0] = mfLfoVal(0, dt); S[3] = MF.lval[1] = mfLfoVal(1, dt);
  S[4] = MF.lastVel; S[5] = MF.sv[0][1]; S[6] = clamp((MF.lastNote - 60) / 24, -1, 1);
  if (MFA){
    var d = [0, 0, 0, 0, 0, 0, 0]; for (i = 0; i < 7; i++) for (k = 0; k < 7; k++){ var a = P.mat[i][k]; if (a) d[k] += a * S[i]; }
    var m1 = MF.sv[1][0], m2 = MF.sv[1][1];
    MFA.pitch.offset.setTargetAtTime(d[0] * 1200 + (MF.sv[0][0] - 0.5) * 2 * 200, t, 0.012);
    MFA.cut.offset.setTargetAtTime(d[3] * 6000 + m1 * 3600 + snCv(1) * 2400, t, 0.012);
    MFA.trem.gain.setTargetAtTime(clamp(1 + d[6], 0, 2), t, 0.012);
    var E = MF.eff, ne = { w1:d[1], t1:d[2] + m1 * 0.3, s1:d[4], t2:d[5] }, ch0 = Math.abs(ne.w1 - (E.w1 || 0)) + Math.abs(ne.t1 - (E.t1 || 0)) + Math.abs(ne.s1 - (E.s1 || 0)) > 0.004, ch1 = Math.abs(ne.t2 - (E.t2 || 0)) > 0.004;
    var o = P.o, sig = o[0].w + o[0].ti * 3 + o[0].s * 7 + o[1].w * 11 + o[1].ti * 13 + o[1].s * 17;
    if (ch0 || ch1 || sig !== MF.sig){ MF.eff = ne; MF.sig = sig; var p0 = mfEff(0), p1 = mfEff(1); MF.voices.forEach(function(v){ if (!v.dead) v.e.forEach(function(e){ e.e.set(e.k ? p1 : p0, t, false); }); }); }
    if (Math.abs(m2 - (MF.m2 || 0)) > 0.004){ MF.m2 = m2; MFA.fx.forEach(function(s, j){ if (s.set){ var f = P.fx[j]; s.set({ t:f.t, a:f.a, b:f.b, c:clamp(f.c + m2 * 0.6, 0, 1) }, t, false); } }); }
  }
  // what the arp / sequencer is playing right now
  var lit = {}; if (ac){ MF.vis = MF.vis.filter(function(e){ if (e.step != null){ if (e.t <= t){ MF.visStep = e.step; return false; } return true; } if (e.t <= t && e.t + e.d > t) lit[e.n] = 1; return e.t + e.d > t; }); }
  MF.voices.forEach(function(v){ if (!v.dead && v.tOff == null && !v.sched) lit[v.cur] = 1; });
  MFKEYS.forEach(function(c){
    var n = 48 + MF.oct * 12 + c.n, on = c.down || lit[n] || MF.latched[n]; c.glow = lerp(c.glow, on ? 1 : 0, 1 - Math.exp(-dt * 30));
    c.m.position.y = c.y0 - c.glow * 0.007; var g = c.glow * 0.5 + (c.hov ? 0.18 : 0) + (MF.latched[n] ? 0.25 : 0);
    c.mat.emissive.setHex(c.base).lerp(MINT, clamp(g, 0, 0.8));
  });
  // LEDs and buttons
  ledSet('o1', MF.oscSel === 0); ledSet('o2', MF.oscSel === 1); ledSet('l1', MF.lfoSel === 0); ledSet('l2', MF.lfoSel === 1);
  for (i = 0; i < 2; i++){ var lv = MF.lval[i]; MFLED['lr' + (i + 1)].col.setHex(lv >= 0 ? 0xFFD24A : 0xFF3A2A); ledSet('lr' + (i + 1), 0.15 + Math.abs(lv) * 0.85); }
  for (i = 0; i < 3; i++){ ledSet('ft' + i, P.ft === i); ledSet('fx' + i, MF.fxSel === i ? 1 : P.fx[i].on ? 0.3 : 0); ledSet('cm' + i, P.cm === i); ledSet('pg' + i, i === 0); }
  for (i = 0; i < 4; i++) ledSet('em' + i, P.mode === i);
  ledSet('fxon', P.fx[MF.fxSel].on); ledSet('mamt', MF.medit); ledSet('cyc', S[0]); ledSet('env', S[1]);
  for (i = 0; i < 7; i++) for (k = 0; k < 7; k++){ var mc = CT['mfm' + i + '_' + k], am = P.mat[i][k], cur = MF.mcur === i * 7 + k, br = am ? 0.45 + Math.abs(am) * 0.55 : 0;
    if (am > 0) mc.mat.color.setRGB(br, br, br); else if (am < 0) mc.mat.color.setRGB(br * 0.3, br * 0.6, br); else mc.mat.color.setHex(0x0A0B0E);
    if (mc.hov || (cur && (MF.medit ? blink : true) && now < MF.msgUntil + 4000)) mc.mat.color.lerp(MINT, mc.hov ? 0.8 : 0.6); }
  var vs = MF.clockOn ? MF.visStep : -1, B = { mfshift:MF.shift, mfholdb:MF.hold, mfchord:MF.chord, mfoctdn:MF.oct < 0 ? -MF.oct / 2 : 0, mfoctup:MF.oct > 0 ? MF.oct / 2 : 0,
    mfsm0:MF.strip === 0, mfsm1:MF.strip === 1, mfsm2:MF.strip === 2, mfoff:MF.as === 0, mfarp:MF.as === 1, mfseq:MF.as === 2, mfplay:MF.seqPlay, mfrec:MF.rec && (!MF.seqPlay || blink), mflast:MF.lastArm && blink };
  CTLIST.forEach(function(c){
    if (c.dev !== 'mf' || c.kind !== 'btn') return; var L = 0;
    if (c.si != null){
      i = c.si;
      if (MF.as === 1) L = i < 8 ? (MF.arpMode === i ? 1 : 0.08) : i < 12 ? (MF.arpOct === i - 7 ? 1 : 0.08) : MF.mods[i - 12] ? 1 : 0.08;
      else if (MF.as === 2){ var s = MF.page * 16 + i; L = s >= MF.seqLen ? 0 : MF.seq[s] ? 0.75 : 0.06; if (s === MF.cursor && MF.rec && !MF.seqPlay && blink) L = 1; if (s === vs){ L = 1.2; } }
      c.col.setHex(MF.as === 2 && (MF.page * 16 + i) === vs ? 0xFFFFFF : MF.as === 1 ? 0xFFFFFF : 0x9CC8FF);
    } else if (c.pg != null) L = MF.page === c.pg ? 1 : (c.pg * 16 < MF.seqLen ? 0.2 : 0);
    else L = B[c.id] === true ? 1 : +B[c.id] || 0;
    if (c.down) L = Math.max(L, 0.8);
    if (L !== c.lit){ c.lit = L; c.paintLit(); }
    var ty = c.y0 - (c.down ? 0.002 : 0); if (c.m.position.y !== ty) c.m.position.y = ty;
  });
  if (now > MF.msgUntil && MF.msgA){ MF.msgA = ''; MF.dirty = true; }
  if (MF.dirty){ MF.dirty = false; mfPaintDisp(); }
}
