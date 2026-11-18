
/* ================= the pink chord box at the back, after the minichord =================
   Twenty-one chord buttons (seven notes in fifths, three rows: major, minor, seventh), a sharp button, a twelve-step
   touch strip that plays the current chord like a harp, three pots (chord level, harp level, and one that does something
   different in each preset) and twelve presets shown by the colour of the big lamp. Its own layout and sound engine;
   the idea and the arrangement of the controls are Benjamin Poilve's minichord (minichord.com). */
var MCPOS = { x:-2.45, z:ROOM.z1 - 0.72 }, MCW = 230, MCD = 136, MCH = 1.1, MCTILT = 0.56;
function mcx(u){ return (u - MCW / 2) * SC; }
function mcz(u){ return (u - MCD / 2) * SC; }
var MCY = new THREE.Group(); MCY.position.set(MCPOS.x, MCH, MCPOS.z); MCY.rotation.y = Math.PI; scene.add(MCY);
var MCG = new THREE.Group(); MCG.rotation.x = MCTILT; MCY.add(MCG);
var MCROOT = [5, 0, 7, 2, 9, 4, 11], MCNAME = ['F', 'C', 'G', 'D', 'A', 'E', 'B'], MCTYPE = [[0, 4, 7], [0, 3, 7], [0, 4, 7, 10]], MCTN = ['major', 'minor', '7th'];
/* presets: lamp colour, chord wave, filter, attack, release, harp wave, harp decay, what the third pot does */
var MCPRE = [
  { n:'Soft keys', col:0xFF6AB0, cw:'triangle', cf:1800, ca:0.03, cr:0.5, hw:'triangle', hd:1.1, mod:'cut' },
  { n:'Organ', col:0xFFB03A, cw:'square', cf:1500, ca:0.01, cr:0.12, hw:'sine', hd:0.8, mod:'vib' },
  { n:'Strings', col:0x6AD0FF, cw:'sawtooth', cf:1300, ca:0.35, cr:1.2, hw:'triangle', hd:1.6, mod:'cut' },
  { n:'Glass', col:0xB8FFF0, cw:'sine', cf:4200, ca:0.02, cr:0.9, hw:'sine', hd:2.2, mod:'trem' },
  { n:'Reed', col:0x90F0A8, cw:'square', cf:900, ca:0.06, cr:0.3, hw:'square', hd:0.5, mod:'cut' },
  { n:'Warm pad', col:0xB070FF, cw:'sawtooth', cf:700, ca:0.6, cr:1.8, hw:'triangle', hd:1.4, mod:'det' },
  { n:'Pluck', col:0xFFE15A, cw:'sawtooth', cf:2400, ca:0.005, cr:0.25, hw:'sawtooth', hd:0.45, mod:'dec' },
  { n:'Choir', col:0xFFFFFF, cw:'triangle', cf:1100, ca:0.25, cr:1.0, hw:'sine', hd:1.2, mod:'vib' },
  { n:'Bright', col:0xFF4A3A, cw:'sawtooth', cf:3600, ca:0.01, cr:0.4, hw:'sawtooth', hd:0.9, mod:'cut' },
  { n:'Hollow', col:0x4AA8FF, cw:'square', cf:2000, ca:0.12, cr:0.7, hw:'triangle', hd:1.0, mod:'trem' },
  { n:'Music box', col:0xFFC8E0, cw:'sine', cf:5000, ca:0.004, cr:0.6, hw:'sine', hd:1.8, mod:'dec' },
  { n:'Drone', col:0x38E0C8, cw:'sawtooth', cf:600, ca:0.9, cr:2.5, hw:'triangle', hd:2.0, mod:'det' }
];
var MC = { preset:0, chord:0.75, harp:0.8, mod:0.5, sharp:0, cont:1, cur:[1, 0], sounding:false, kb:{}, pulse:0, hold:{} };
function mcRestore(){ try { var s = JSON.parse(store('jambutek-studio-chord-v1') || 'null'); if (!s || s.v !== 1) return;
  MC.preset = clamp(s.preset | 0, 0, MCPRE.length - 1); ['chord', 'harp', 'mod'].forEach(function(k){ if (typeof s[k] === 'number') MC[k] = clamp(s[k], 0, 1); }); MC.sharp = s.sharp ? 1 : 0; MC.cont = s.cont ? 1 : 0; } catch (e) {} }
mcRestore();
var mcSaveT = null; function mcSaveNow(){ store('jambutek-studio-chord-v1', JSON.stringify({ v:1, preset:MC.preset, chord:MC.chord, harp:MC.harp, mod:MC.mod, sharp:MC.sharp, cont:MC.cont })); } function mcSaveSoon(){ clearTimeout(mcSaveT); mcSaveT = setTimeout(mcSaveNow, saveMs(900)); }
var MCLED = {};
(function(){
  var TH = 0.05, pink = new THREE.MeshPhongMaterial({ color:0xF2619F, emissive:0x3A0C20, shininess:30, specular:0x332028 });
  var sh = new THREE.Shape(), X = function(u){ return mcx(u); }, Yv = function(v){ return -mcz(v); };          // the narrow end, where the chord buttons sit
  sh.moveTo(X(43), Yv(52)); sh.lineTo(X(150), Yv(52)); sh.lineTo(X(150), Yv(122)); sh.lineTo(X(43), Yv(122)); sh.absarc(X(43), Yv(87), 35 * SC, -Math.PI / 2, Math.PI / 2, true);
  var neck = new THREE.Mesh(new THREE.ExtrudeGeometry(sh, { depth:TH, bevelEnabled:false, curveSegments:18 }), pink); neck.rotation.x = -Math.PI / 2; neck.position.y = -TH; MCG.add(neck);
  var bulb = new THREE.Mesh(new THREE.CylinderGeometry(63 * SC, 63 * SC, TH, 48), pink); bulb.position.set(mcx(160), -TH / 2 - 0.0004, mcz(68)); MCG.add(bulb);   // the wide end: strip, pots, presets
  standFor(MCY, MCG, MCW * SC * 0.92, MCD * SC * 0.8, TH, MCH, MCTILT, 0.14); devBody(MCY, 'mc'); BLOCKS.push([MCPOS.x - 0.4, MCPOS.x + 0.4, ROOM.z1 - 1.06, ROOM.z1]);
  var strip = new THREE.Mesh(new THREE.BoxGeometry(84 * SC, 0.003, 18 * SC), new THREE.MeshLambertMaterial({ color:0x15161A })); strip.position.set(mcx(168), 0.0016, mcz(45)); MCG.add(strip);
  var lamp = new THREE.PointLight(0xFF6AB0, 0.5, 2.6, 1.6); lamp.position.set(0, 0.6, 0.25); MCY.add(lamp); MC.lamp = lamp;
})();
HOST = MCG; LX = mcx; LZ = mcz; DEV = 'mc';
for (var mcr = 0; mcr < 3; mcr++) for (var mcc = 0; mcc < 7; mcc++)(function(r, c){
  FACE = { bg:'#17181B', fg:'#F4F4F2' };
  var b = button('mcb' + r + '_' + c, 30 + c * 15.4, 68 + r * 15.4, 13, 13, r === 0 ? MCNAME[c].toLowerCase() : MCNAME[c].toLowerCase() + ['', 'm', '7'][r], MCNAME[c] + ' ' + MCTN[r], 0xFF6AB0); b.chord = [c, r]; b.mat.color.setHex(0xC8C8C8);
})(mcr, mcc);
FACE = { bg:'#17181B', fg:'#F4F4F2' }; button('mcsharp', 14.5, 87, 8.5, 8.5, '#', 'Sharp', 0xFFE15A).mat.color.setHex(0xC8C8C8); button('mcrhy', 119, 47, 8.5, 8.5, ' ', 'Rhythm mode: hold the chord or play it only while pressed', 0xFFE15A).mat.color.setHex(0xC8C8C8);
ledAt(MCLED, 'rhy', 109, 50, 0.0024, 0xFF3A2A); ledAt(MCLED, 'main', 146, 66, 0.0075, 0xFF6AB0);
for (var mch = 0; mch < 12; mch++)(function(i){ var c = pad('mch' + i, 131 + i * 6.75, 45, 6, 15, 0xFFD0E8, 'Harp ' + (i + 1)); c.harp = i; c.touch = true; })(mch);
[['chord', 158, 21, 'Chord volume'], ['harp', 175, 18.5, 'Harp volume'], ['mod', 192, 22, 'Mod']].forEach(function(a){ knob('mck' + a[0], a[1], a[2], 4.6, a[3], MC[a[0]], { h:19, sides:16, color:0x101114 }).mk = a[0]; });
FACE = { bg:'#17181B', fg:'#F4F4F2' }; button('mcup', 211, 55, 11, 9, '▲', 'Next preset', 0xFFFFFF).mat.color.setHex(0xC8C8C8); button('mcdn', 211, 67, 11, 9, '▼', 'Previous preset', 0xFFFFFF).mat.color.setHex(0xC8C8C8);
HOST = TRG; LX = lx; LZ = lz; DEV = null; FACE = { bg:'#C9C7C0', fg:'#0B0B0D' };

var MCA = null;
function mcAudio(){
  if (MCA) return true; if (!ac || !AU.ready) return false;
  var A = MCA = {}, G = function(v){ var g = ac.createGain(); g.gain.value = v; return g; };
  A.out = G(1); A.out.connect(AU.ch[7].inp);
  A.f = ac.createBiquadFilter(); A.f.type = 'lowpass'; A.f.Q.value = 1.2; A.vca = G(0); A.trem = G(1); A.cvol = G(0.5); A.f.connect(A.vca); A.vca.connect(A.trem); A.trem.connect(A.cvol); A.cvol.connect(A.out);
  A.osc = [0, 1, 2, 3, 4].map(function(i){ var o = ac.createOscillator(), g = G(i === 4 ? 0.5 : 0.24); o.connect(g); g.connect(A.f); o.start(); return { o:o, g:g }; });   // four chord notes and a bass an octave under the root
  A.vib = ac.createOscillator(); A.vib.frequency.value = 5.4; A.vibG = G(0); A.vib.connect(A.vibG); A.osc.forEach(function(q){ A.vibG.connect(q.o.detune); }); A.vib.start();
  A.tr = ac.createOscillator(); A.tr.frequency.value = 4.2; A.trG = G(0); A.tr.connect(A.trG); A.trG.connect(A.trem.gain); A.tr.start();
  A.hvol = G(0.6); A.hdel = ac.createDelay(0.6); A.hdel.delayTime.value = 0.23; A.hfb = G(0.3); A.hvol.connect(A.out); A.hvol.connect(A.hdel); A.hdel.connect(A.hfb); A.hfb.connect(A.hdel); A.hfb.connect(A.out);
  mcApply(); mcTune(ac.currentTime, true); return true;
}
function mcApply(){
  if (!MCA) return; var A = MCA, P = MCPRE[MC.preset], t = ac.currentTime, m = MC.mod;
  A.osc.forEach(function(q, i){ q.o.type = i === 4 ? 'triangle' : P.cw; q.o.detune.setTargetAtTime(P.mod === 'det' ? (i % 2 ? 1 : -1) * m * 28 : 0, t, 0.05); });
  A.f.frequency.setTargetAtTime(P.mod === 'cut' ? 200 * Math.pow(40, m) : P.cf, t, 0.03); A.vibG.gain.setTargetAtTime(P.mod === 'vib' ? m * 45 : 0, t, 0.05); A.trG.gain.setTargetAtTime(P.mod === 'trem' ? m * 0.5 : 0, t, 0.05);
  A.cvol.gain.setTargetAtTime(MC.chord * MC.chord * 0.9, t, 0.03); A.hvol.gain.setTargetAtTime(MC.harp * MC.harp * 0.9, t, 0.03);
}
function mcNotes(){ var c = MC.cur, root = 48 + MCROOT[c[0]] + ((MC.sharp || M.shift) ? 1 : 0); if (MCROOT[c[0]] > 7) root -= 12; return MCTYPE[c[1]].map(function(s){ return root + s; }); }
function mcTune(t, hard){ var A = MCA, n = mcNotes(); A.osc.forEach(function(q, i){ var f = i === 4 ? mtof(n[0] - 12) : mtof(n[i % n.length] + (i >= n.length ? 12 : 0)); if (hard) q.o.frequency.setValueAtTime(f, t); else q.o.frequency.setTargetAtTime(f, t, 0.012); }); }
function mcChord(c, r, on){
  unlock(); if (!mcAudio()) return; var A = MCA, P = MCPRE[MC.preset], t = ac.currentTime + 0.003, key = c + '_' + r;
  if (on){ MC.hold[key] = 1; MC.cur = [c, r]; mcTune(t, !MC.sounding); A.vca.gain.cancelScheduledValues(t); A.vca.gain.setTargetAtTime(1, t, P.ca / 3 + 0.002); MC.sounding = true; MC.pulse = 1; }
  else { delete MC.hold[key]; if (!MC.cont && !Object.keys(MC.hold).length) mcSilence(); }
}
function mcSilence(){ if (!MCA) return; var t = ac.currentTime + 0.003; MCA.vca.gain.cancelScheduledValues(t); MCA.vca.gain.setTargetAtTime(0, t, MCPRE[MC.preset].cr / 3 + 0.01); MC.sounding = false; }
function mcPluckAt(n, vel, t){
  if (!mcAudio()) return; var A = MCA, P = MCPRE[MC.preset], d = P.hd * (P.mod === 'dec' ? 0.25 + MC.mod * 1.6 : 1), o = ac.createOscillator(), o2 = ac.createOscillator(), g = ac.createGain(), g2 = ac.createGain();
  o.type = P.hw; o.frequency.value = mtof(n); o2.type = 'sine'; o2.frequency.value = mtof(n + 12); g2.gain.value = 0.3; g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.32 * (0.4 + vel * 0.6), t + 0.004); g.gain.setTargetAtTime(0, t + 0.006, d / 4);
  o.connect(g); o2.connect(g2); g2.connect(g); g.connect(A.hvol); o.start(t); o2.start(t); o.stop(t + d * 2 + 0.3); o2.stop(t + d * 2 + 0.3); o.onended = function(){ try { g.disconnect(); } catch (e) {} };
}
function mcHarp(i, on){ if (!on) return; unlock(); if (!mcAudio()) return; var n = mcNotes(); mcPluckAt(n[i % n.length] + 12 * Math.floor(i / n.length) + 12, 0.85, ac.currentTime + 0.003); MC.pulse = Math.max(MC.pulse, 0.6); }
var MCKB = ['qwertyu', 'asdfghj', 'zxcvbnm'], MCHK = '1234567890-=';
function mcKbDown(k){
  if (k.length !== 1) return false; var h = MCHK.indexOf(k); if (h >= 0){ if (!MC.kb[k]){ MC.kb[k] = 1; mcHarp(h, 1); } return true; }
  for (var r = 0; r < 3; r++){ var c = MCKB[r].indexOf(k); if (c >= 0){ if (!MC.kb[k]){ MC.kb[k] = [c, r]; mcChord(c, r, 1); } return true; } }
  return false;
}
function mcKbUp(k){ var v = MC.kb[k]; if (!v) return; delete MC.kb[k]; if (v !== 1) mcChord(v[0], v[1], 0); }
function mcSync(){ ['chord', 'harp', 'mod'].forEach(function(k){ var c = CT['mck' + k]; c.v = MC[k]; c.show(); }); mcApply(); if (!MC.cont && MC.sounding && !Object.keys(MC.hold).length) mcSilence(); }
RESTORE['jambutek-studio-chord-v1'] = function(){ mcRestore(); mcSync(); }; SAVENOW.push(mcSaveNow);
function mcLabel(c){
  if (c.mk) return c.name + (c.mk === 'mod' ? ' (' + ({ cut:'filter', vib:'vibrato', trem:'tremolo', det:'detune', dec:'harp decay' })[MCPRE[MC.preset].mod] + ')' : '') + ' ' + Math.round(c.v * 100) + ' · scroll or drag';
  if (c.harp != null) return 'Harp strip · click, or hold and slide along it to strum';
  if (c.id === 'mcsharp') return 'Sharp: ' + (MC.sharp ? 'on' : 'off') + ' · click (or hold Shift)';
  if (c.id === 'mcrhy') return 'Rhythm mode: ' + (MC.cont ? 'chord holds until the next one' : 'chord plays only while pressed') + ' · click';
  if (c.id === 'mcup' || c.id === 'mcdn') return 'Preset ' + (MC.preset + 1) + ' · ' + MCPRE[MC.preset].n + ' · click';
  return c.name + ' · click';
}
function mcPress(c){
  if (c.chord){ c.down = 1; mcChord(c.chord[0], c.chord[1], 1); return; }
  if (c.harp != null){ c.down = 1; mcHarp(c.harp, 1); return; }
  c.down = 1; setTimeout(function(){ c.down = 0; }, 130);
  if (c.id === 'mcsharp'){ MC.sharp = MC.sharp ? 0 : 1; if (MCA && MC.sounding) mcTune(ac.currentTime, false); }
  else if (c.id === 'mcrhy'){ MC.cont = MC.cont ? 0 : 1; if (!MC.cont) mcSilence(); }
  else { MC.preset = (MC.preset + (c.id === 'mcup' ? 1 : MCPRE.length - 1)) % MCPRE.length; mcApply(); toast('Preset ' + (MC.preset + 1) + ' · ' + MCPRE[MC.preset].n); }
  mcSaveSoon();
}
function mcRelease(c){ if (c.chord){ c.down = 0; mcChord(c.chord[0], c.chord[1], 0); } else if (c.harp != null) c.down = 0; }
function mcCtl(c){ if (!c.mk) return; MC[c.mk] = c.v; mcApply(); mcSaveSoon(); }
DEVH.mc = { label:mcLabel, press:mcPress, release:mcRelease, ctl:mcCtl, turn:NOP };
function mcUpdate(now, dt){
  var P = MCPRE[MC.preset]; MC.pulse = Math.max(0, MC.pulse - dt * 2.2);
  MCLED.main.col.setHex(P.col); ledOn(MCLED.main, 0.55 + (MC.sounding ? 0.25 : 0) + MC.pulse * 0.4); ledOn(MCLED.rhy, MC.cont ? 1 : 0.06);
  MC.lamp.color.setHex(P.col); MC.lamp.intensity = 0.4 + (MC.sounding ? 0.2 : 0) + MC.pulse * 0.45;
  CTLIST.forEach(function(c){ if (c.dev !== 'mc' || c.kind === 'knob') return; var L;
    if (c.chord) L = (MC.cur[0] === c.chord[0] && MC.cur[1] === c.chord[1] && MC.sounding) ? 1 : c.down ? 0.8 : 0;
    else if (c.harp != null) L = c.down ? 1 : 0.08;
    else L = c.id === 'mcsharp' ? ((MC.sharp || M.shift) ? 1 : 0) : c.id === 'mcrhy' ? (c.down ? 1 : 0) : (c.down ? 1 : 0);
    if (L !== c.lit){ c.lit = L; c.paintLit(); } var ty = c.y0 - (c.down ? 0.003 : 0); if (c.m.position.y !== ty) c.m.position.y = ty; });
}
