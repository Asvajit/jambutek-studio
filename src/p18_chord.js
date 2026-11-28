
/* ================= the chord synth: one key plays a whole chord, after Violet and the Orchid =================
   A one-octave keyboard picks the root, eight buttons pick the chord (major, minor, sus, dim, and 6 / 7 / maj7 / 9 on top), a big
   VOICING dial turns the chord through its inversions, and along the top, between the two speaker grilles, is the strum strip from
   the old chord box: click it or slide along it to play the current chord like a harp. Twelve presets. The layout idea is Telepathic
   Instruments' Orchid, by way of Nate Siggard's browser synth Violet (violet.getauthentic.com); the engine is this room's own. */
var MCW = 300, MCD = 150, MCH = 1.1, MCTILT = 0.56;
function mcx(u){ return (u - MCW / 2) * SC; }
function mcz(u){ return (u - MCD / 2) * SC; }
var MCY = new THREE.Group(); MCY.position.set(MCPOS.x, MCH, MCPOS.z); MCY.rotation.y = MCPOS.r; scene.add(MCY);
var MCG = new THREE.Group(); MCG.rotation.x = MCTILT; MCY.add(MCG);
var MCNOTE = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B', 'C'], MCTRI = [[0, 4, 7], [0, 3, 7], [0, 5, 7], [0, 3, 6]], MCTN = ['', 'm', 'sus', 'dim'], MCTL = ['MAJ', 'MIN', 'SUS', 'DIM'],
    MCEXT = [9, 10, 11, 14], MCEN = ['6', '7', 'maj7', '9'];
/* presets: lamp colour, chord wave, filter, attack, release, harp wave, harp decay, what the MOD pot does */
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
var MC = { preset:0, chord:0.75, harp:0.8, mod:0.5, voice:0, bass:0.65, tone:0.5, atk:0.5, bvoice:0.5, fx:1, oct:1, type:0, ext:0, root:0, cont:1, sounding:false, kb:{}, pulse:0, hold:{}, dirty:true };
var MCKN = ['chord', 'harp', 'mod', 'voice', 'bass', 'tone', 'atk', 'bvoice'];
function mcRestore(){ try { var s = JSON.parse(store('jambutek-studio-chord-v1') || 'null'); if (!s || s.v !== 1) return;
  MC.preset = clamp(s.preset | 0, 0, MCPRE.length - 1); MCKN.forEach(function(k){ if (typeof s[k] === 'number') MC[k] = clamp(s[k], 0, 1); }); MC.type = clamp(s.type | 0, 0, 3); MC.ext = clamp(s.ext | 0, 0, 15); MC.cont = s.cont ? 1 : 0;
  if (s.fx != null) MC.fx = s.fx ? 1 : 0; if (s.oct != null) MC.oct = clamp(s.oct | 0, 0, 2); MC.dirty = true; } catch (e) {} }
mcRestore();
var mcSaveT = null; function mcSaveNow(){ var o = { v:1, preset:MC.preset, type:MC.type, ext:MC.ext, cont:MC.cont, fx:MC.fx, oct:MC.oct }; MCKN.forEach(function(k){ o[k] = MC[k]; }); store('jambutek-studio-chord-v1', JSON.stringify(o)); } function mcSaveSoon(){ clearTimeout(mcSaveT); mcSaveT = setTimeout(mcSaveNow, saveMs(900)); }
var mcC = mk(MCW * 5, MCD * 5), mcTex = null, mcDispC = mk(320, 96), mcDispT = canvasTex(mcDispC); mcDispT.minFilter = THREE.LinearFilter; mcDispT.magFilter = THREE.LinearFilter;
function paintMC(){
  var g = mcC.getContext('2d'); g.setTransform(5, 0, 0, 5, 0, 0);
  var gr = g.createLinearGradient(0, 0, 0, 32); gr.addColorStop(0, '#D2B47C'); gr.addColorStop(1, '#BFA06A'); g.fillStyle = gr; g.fillRect(0, 0, MCW, 32);            // the tan top with its two slatted grilles
  g.fillStyle = '#1B1B1C'; g.fillRect(0, 32, MCW, 34); g.fillStyle = '#0C0C0D'; g.fillRect(0, 65, MCW, 2.2); g.fillStyle = '#262627'; g.fillRect(0, 67.2, MCW, MCD - 67.2);
  for (var i = 0; i < 1500; i++){ g.fillStyle = 'rgba(' + (Math.random() < .5 ? '0,0,0' : '255,255,255') + ',' + rnd(.015, .045) + ')'; g.fillRect(Math.random() * MCW, Math.random() * MCD, .6, .3); }
  [12, 228].forEach(function(x0){ for (var k = 0; k < 20; k++){ g.fillStyle = '#6E5632'; g.fillRect(x0 + k * 3.05, 7, 1.05, 19); } });
  g.fillStyle = '#8E7444'; g.fillRect(89, 5, 122, 23); g.fillStyle = '#17120A'; g.fillRect(90, 6, 120, 21);                                                     // the strum strip, set into the top between the grilles
  function T(s, x, y, size, col, al){ g.font = 'bold ' + size + 'px "Helvetica Neue", Helvetica, Arial, sans-serif'; g.fillStyle = col || '#77777A'; g.textAlign = al || 'center'; g.textBaseline = 'middle'; g.fillText(s, x, y); }
  T('STRUM', 150, 30, 2.4, '#6E5632');
  ['SOUND', 'PERFORM', 'FX', 'KEY'].forEach(function(s, k){ T(s, 22 + k * 20.5, 57.5, 2.5); });
  ['BASS', 'MOD', 'TONE', 'ATTACK', 'CHORD', 'STRUM'].forEach(function(s, k){ T(s, 186 + k * 17, 58.5, 2.5); });
  T('CHORD', 152, 86, 2.5, '#77777A', 'right'); T('VOICE', 152, 90, 2.5, '#77777A', 'right'); T('BASS', 156, 125, 2.5, '#77777A', 'right'); T('VOICE', 156, 129, 2.5, '#77777A', 'right');
  T('after Violet', 291, 49, 2.6, '#5A5A5E', 'center');
  g.fillStyle = '#1C1C1D'; g.fillRect(193, 67.2, 107, MCD - 67.2);                                                                                         // the key bed
  g.setTransform(1, 0, 0, 1, 0, 0); if (mcTex) mcTex.needsUpdate = true;
}
paintMC(); mcTex = smoothTex(mcC);
(function(){
  var W2 = MCW * SC, D2 = MCD * SC, TH = 0.055;
  var top = new THREE.Mesh(new THREE.PlaneGeometry(W2, D2), new THREE.MeshPhongMaterial({ color:0x8C8C8C, map:mcTex, emissive:0xffffff, emissiveMap:mcTex, emissiveIntensity:0.3, shininess:14, specular:0x0A0A0A })); top.rotation.x = -Math.PI / 2; MCG.add(top);
  var body = new THREE.Mesh(new THREE.BoxGeometry(W2 + 0.01, TH, D2 + 0.01), new THREE.MeshPhongMaterial({ color:0x1A1A1B, shininess:30, specular:0x222222, flatShading:true })); body.position.y = -TH / 2 - 0.0015; MCG.add(body);
  standFor(MCY, MCG, W2, D2, TH, MCH, MCTILT, 0.2); devBody(MCY, 'mc'); BLOCKS.push(devBlock(MCPOS, 0.4));
  var d = new THREE.Mesh(new THREE.PlaneGeometry(40 * SC, 12 * SC), new THREE.MeshBasicMaterial({ map:mcDispT })); d.rotation.x = -Math.PI / 2; d.position.set(mcx(135), 0.0012, mcz(47)); d.userData.noShadow = true; d.userData.dev = 'mc'; MCG.add(d);
  var lamp = new THREE.PointLight(0xE0A020, 0.5, 2.6, 1.6); lamp.position.set(0, 0.6, 0.25); MCY.add(lamp); MC.lamp = lamp;
})();
HOST = MCG; LX = mcx; LZ = mcz; DEV = 'mc';
for (var mch = 0; mch < 12; mch++)(function(i){ var c = pad('mch' + i, 95.5 + i * 9.9, 16.5, 8.8, 19, 0xE0A020, 'Strum ' + (i + 1)); c.harp = i; c.touch = true; })(mch);
FACE = { bg:'#E0A020', fg:'#3A2600' };
[['snd', 'Sound: next preset'], ['perf', 'Perform: hold the chord, or play it only while pressed'], ['fx', 'FX: echo on the strum'], ['key', 'Key: octave']].forEach(function(a, k){ button('mcp' + a[0], 22 + k * 20.5, 46, 17.5, 9.5, '', a[1], 0xFFC040).fn = a[0]; });
[['bass', 'Bass level'], ['mod', 'Mod'], ['tone', 'Tone'], ['atk', 'Attack'], ['chord', 'Chord volume'], ['harp', 'Strum volume']].forEach(function(a, k){ knob('mck' + a[0], 186 + k * 17, 45.5, 6.6, a[1], MC[a[0]], { h:7, sides:20, color:k === 1 ? 0xC8343A : 0x333335, tick:k === 1 ? 0xFFFFFF : 0x8A8A8E }).mk = a[0]; });
knob('mckvoice', 172, 88, 13, 'Chord voice', MC.voice, { h:12, sides:28, color:0x1A1A1B, tick:0xE0A020 }).mk = 'voice';
knob('mckbvoice', 172, 127, 7.4, 'Bass voice', MC.bvoice, { h:10, sides:20, color:0x1A1A1B, tick:0xE0A020 }).mk = 'bvoice';
for (var mct = 0; mct < 8; mct++)(function(i){ var r = i >> 2, c = i & 3; FACE = { bg:'#2C2C2E', fg:'#F2F2F2' }; var b = button('mct' + i, 22 + c * 24, 86 + r * 26, 21, 21, r ? ['6', 'm7', 'M7', '9'][c] : ['Dim', 'Min', 'Maj', 'Sus'][c], r ? 'Add ' + MCEN[c] : ['Diminished', 'Minor', 'Major', 'Suspended'][c], 0xFFFFFF); b.mat.color.setHex(0x8A8A8A); if (r) b.ex = c; else b.ty = [3, 1, 0, 2][c]; })(mct);
[0, 2, 4, 5, 7, 9, 11].forEach(function(n, i){ FACE = { bg:'#2E2E30', fg:'#77777A' }; var b = button('mckey' + n, 203.5 + i * 14.6, 132, 13.6, 34, MCNOTE[n], MCNOTE[n] + ' chord', 0xE0A020); b.root = n; b.mat.color.setHex(0x8A8A8A); });
[[1, 0.5], [3, 1.5], [6, 3.5], [8, 4.5], [10, 5.5]].forEach(function(a){ FACE = { bg:'#48484B', fg:'#C8C8CC' }; var b = button('mckey' + a[0], 203.5 + a[1] * 14.6, 91, 12.4, 44, MCNOTE[a[0]], MCNOTE[a[0]] + ' chord', 0xE0A020); b.root = a[0]; b.mat.color.setHex(0x8A8A8A); });
HOST = TRG; LX = lx; LZ = lz; DEV = null; FACE = { bg:'#C9C7C0', fg:'#0B0B0D' };
function mcName(){ var e = ''; for (var k = 0; k < 4; k++) if (MC.ext & (1 << k)) e += (e || MCTN[MC.type] ? ' ' : '') + MCEN[k]; return MCNOTE[MC.root % 12] + MCTN[MC.type] + e; }
function mcPaintDisp(){
  var g = mcDispC.getContext('2d'); g.fillStyle = '#1B1B1C'; g.fillRect(0, 0, 320, 96); g.textBaseline = 'middle'; g.textAlign = 'center';
  g.font = 'bold 50px "Helvetica Neue", Helvetica, Arial, sans-serif'; g.fillStyle = '#FFFFFF'; g.fillText(mcName(), 160, 36);
  g.font = 'bold 22px "Helvetica Neue", Helvetica, Arial, sans-serif'; g.fillStyle = '#E0A020'; g.fillText((MC.preset + 1) + ' ' + MCPRE[MC.preset].n + '  ·  voice ' + Math.min(3, Math.floor(MC.voice * 4)), 160, 78); mcDispT.needsUpdate = true;
}
var MCA = null;
function mcAudio(){
  if (MCA) return true; if (!ac || !AU.ready) return false;
  var A = MCA = {}, G = function(v){ var g = ac.createGain(); g.gain.value = v; return g; };
  A.out = G(1); A.out.connect(AU.ch[7].inp);
  A.f = ac.createBiquadFilter(); A.f.type = 'lowpass'; A.f.Q.value = 1.2; A.vca = G(0); A.trem = G(1); A.cvol = G(0.5); A.f.connect(A.vca); A.vca.connect(A.trem); A.trem.connect(A.cvol); A.cvol.connect(A.out);
  A.osc = [0, 1, 2, 3, 4, 5, 6].map(function(i){ var o = ac.createOscillator(), g = G(i === 6 ? 0.5 : 0.18); o.connect(g); g.connect(A.f); o.start(); return { o:o, g:g }; });   // six chord voices and a bass an octave under the root
  A.vib = ac.createOscillator(); A.vib.frequency.value = 5.4; A.vibG = G(0); A.vib.connect(A.vibG); A.osc.forEach(function(q){ A.vibG.connect(q.o.detune); }); A.vib.start();
  A.tr = ac.createOscillator(); A.tr.frequency.value = 4.2; A.trG = G(0); A.tr.connect(A.trG); A.trG.connect(A.trem.gain); A.tr.start();
  A.hvol = G(0.6); A.hdel = ac.createDelay(0.6); A.hdel.delayTime.value = 0.23; A.hfb = G(0.3); A.hvol.connect(A.out); A.hvol.connect(A.hdel); A.hdel.connect(A.hfb); A.hfb.connect(A.hdel); A.hfb.connect(A.out);
  mcApply(); mcTune(ac.currentTime, true); return true;
}
function mcApply(){
  if (!MCA) return; var A = MCA, P = MCPRE[MC.preset], t = ac.currentTime, m = MC.mod;
  A.osc.forEach(function(q, i){ q.o.type = i === 6 ? 'triangle' : P.cw; q.o.detune.setTargetAtTime(P.mod === 'det' ? (i % 2 ? 1 : -1) * m * 28 : 0, t, 0.05); });
  A.f.frequency.setTargetAtTime(clamp((P.mod === 'cut' ? 200 * Math.pow(40, m) : P.cf) * Math.pow(2, (MC.tone - 0.5) * 3.2), 80, 15000), t, 0.03); A.osc[6].g.gain.setTargetAtTime(MC.bass * MC.bass * 1.2, t, 0.03); A.hfb.gain.setTargetAtTime(MC.fx ? 0.3 : 0, t, 0.03); A.vibG.gain.setTargetAtTime(P.mod === 'vib' ? m * 45 : 0, t, 0.05); A.trG.gain.setTargetAtTime(P.mod === 'trem' ? m * 0.5 : 0, t, 0.05);
  A.cvol.gain.setTargetAtTime(MC.chord * MC.chord * 0.9, t, 0.03); A.hvol.gain.setTargetAtTime(MC.harp * MC.harp * 0.9, t, 0.03);
}
function mcNotes(){ var root = 48 + (MC.oct - 1) * 12 + MC.root, n = MCTRI[MC.type].map(function(s){ return root + s; }); for (var k = 0; k < 4; k++) if (MC.ext & (1 << k)) n.push(root + MCEXT[k]); return n; }
function mcVoiced(){ var n = mcNotes(), inv = Math.min(3, Math.floor(MC.voice * 4)); for (var k = 0; k < inv; k++) n[k % n.length] += 12; return n; }      // the voicing dial: lift the lowest notes an octave, one at a time
function mcTune(t, hard){ var A = MCA, n = mcVoiced(); A.osc.forEach(function(q, i){ var f = i === 6 ? mtof(48 + (MC.oct - 1) * 12 + MC.root + [-24, -12, 0][Math.min(2, Math.floor(MC.bvoice * 3))]) : mtof(n[i % n.length] + (i >= n.length ? 12 : 0)); if (hard) q.o.frequency.setValueAtTime(f, t); else q.o.frequency.setTargetAtTime(f, t, 0.012); }); }
function mcChord(c, r, on){                                    // c: the root, 0-12. r: the chord, its type in the low two bits and the added notes above
  unlock(); if (!mcAudio()) return; var A = MCA, P = MCPRE[MC.preset], t = ac.currentTime + 0.003, key = 'k' + c;
  if (on){ MC.hold[key] = 1; MC.root = c; MC.type = r & 3; MC.ext = (r >> 2) & 15; MC.dirty = true; mcTune(t, !MC.sounding); A.vca.gain.cancelScheduledValues(t); A.vca.gain.setTargetAtTime(1, t, P.ca * Math.pow(4, MC.atk * 2 - 1) / 3 + 0.002); MC.sounding = true; MC.pulse = 1; }
  else { delete MC.hold[key]; if (!MC.cont && !Object.keys(MC.hold).length) mcSilence(); }
}
function mcSeqAt(n, vel, t, dur){                              // a Snake step: its note is the root, and the whole chord plays for the length of the gate
  if (!mcAudio()) return; var A = MCA, P = MCPRE[MC.preset]; MC.root = ((n % 12) + 12) % 12; MC.dirty = true; mcTune(t, !MC.seqHeld);
  A.vca.gain.cancelScheduledValues(t); A.vca.gain.setTargetAtTime(0.5 + vel * 0.5, t, P.ca * Math.pow(4, MC.atk * 2 - 1) / 3 + 0.002); MC.pulse = 1;
  if (MC.cont){ MC.seqHeld = true; MC.sounding = true; return; }      /* PERFORM on: the chord rings on, through the empty steps, until the next step with a note (or the sequence stops) */
  A.vca.gain.setTargetAtTime(0, t + dur, P.cr / 3 + 0.01); MC.sounding = false; MC.seqHeld = false;
}
function mcSilence(){ if (!MCA) return; var t = ac.currentTime + 0.003; MCA.vca.gain.cancelScheduledValues(t); MCA.vca.gain.setTargetAtTime(0, t, MCPRE[MC.preset].cr / 3 + 0.01); MC.sounding = false; }
function mcPluckAt(n, vel, t){
  if (!mcAudio()) return; var A = MCA, P = MCPRE[MC.preset], d = P.hd * (P.mod === 'dec' ? 0.25 + MC.mod * 1.6 : 1), o = ac.createOscillator(), o2 = ac.createOscillator(), g = ac.createGain(), g2 = ac.createGain();
  o.type = P.hw; o.frequency.value = mtof(n); o2.type = 'sine'; o2.frequency.value = mtof(n + 12); g2.gain.value = 0.3; g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.32 * (0.4 + vel * 0.6), t + 0.004); g.gain.setTargetAtTime(0, t + 0.006, d / 4);
  o.connect(g); o2.connect(g2); g2.connect(g); g.connect(A.hvol); o.start(t); o2.start(t); o.stop(t + d * 2 + 0.3); o2.stop(t + d * 2 + 0.3); o.onended = function(){ try { g.disconnect(); } catch (e) {} };
}
function mcHarp(i, on){ if (!on) return; unlock(); if (!mcAudio()) return; var n = mcNotes(); mcPluckAt(n[i % n.length] + 12 * Math.floor(i / n.length) + 12, 0.85, ac.currentTime + 0.003); MC.pulse = Math.max(MC.pulse, 0.6); }
var MCHK = '1234567890-=', MCTK = 'cxvz', MCEK = 'bnm,';          // Z X C V in panel order: dim, min, maj, sus
function mcShape(){ MC.dirty = true; if (MCA && MC.sounding) mcTune(ac.currentTime, false); mcSaveSoon(); }
function mcKbDown(k){
  if (k.length !== 1) return false; var h = MCHK.indexOf(k); if (h >= 0){ if (!MC.kb[k]){ MC.kb[k] = 1; mcHarp(h, 1); } return true; }
  var ty = MCTK.indexOf(k); if (ty >= 0){ if (!MC.kb[k]){ MC.kb[k] = 1; MC.type = ty; mcShape(); } return true; }
  var ex = MCEK.indexOf(k); if (ex >= 0){ if (!MC.kb[k]){ MC.kb[k] = 1; MC.ext ^= 1 << ex; mcShape(); } return true; }
  var i = MFKB.indexOf(k); if (i < 0 || i > 12) return false; if (!MC.kb[k]){ MC.kb[k] = [i]; mcChord(i, MC.type | MC.ext << 2, 1); } return true;
}
function mcKbUp(k){ var v = MC.kb[k]; if (!v) return; delete MC.kb[k]; if (v !== 1) mcChord(v[0], 0, 0); }
function mcSync(){ MCKN.forEach(function(k){ var c = CT['mck' + k]; c.v = MC[k]; c.show(); }); mcApply(); if (!MC.cont && MC.sounding && !Object.keys(MC.hold).length) mcSilence(); }
RESTORE['jambutek-studio-chord-v1'] = function(){ mcRestore(); mcSync(); if (MCA && MC.sounding) mcTune(ac.currentTime, false); }; SAVENOW.push(mcSaveNow);
function mcLabel(c){
  if (c.mk === 'voice') return 'Chord voice: inversion ' + Math.min(3, Math.floor(c.v * 4)) + ' · scroll or drag'; if (c.mk === 'bvoice') return 'Bass voice: ' + ['two octaves down', 'one octave down', 'at the root'][Math.min(2, Math.floor(c.v * 3))] + ' · scroll or drag';
  if (c.mk) return c.name + (c.mk === 'mod' ? ' (' + ({ cut:'filter', vib:'vibrato', trem:'tremolo', det:'detune', dec:'strum decay' })[MCPRE[MC.preset].mod] + ')' : '') + ' ' + Math.round(c.v * 100) + ' · scroll or drag';
  if (c.harp != null) return 'Strum strip · click, or hold and slide along it';
  if (c.fn === 'perf') return 'Perform: ' + (MC.cont ? 'chord rings until the next one' : 'chord plays only while pressed') + ' · click';
  if (c.fn === 'snd') return 'Sound ' + (MC.preset + 1) + ' · ' + MCPRE[MC.preset].n + ' · click for the next';
  if (c.fn === 'fx') return 'FX: strum echo ' + (MC.fx ? 'on' : 'off') + ' · click'; if (c.fn === 'key') return 'Key: octave ' + ['-1', '0', '+1'][MC.oct] + ' · click';
  if (c.ex != null) return c.name + ': ' + ((MC.ext & (1 << c.ex)) ? 'on' : 'off') + ' · click';
  return c.name + ' · click';
}
function mcPress(c){
  if (c.root != null){ c.down = 1; mcChord(c.root, MC.type | MC.ext << 2, 1); return; }
  if (c.harp != null){ c.down = 1; mcHarp(c.harp, 1); return; }
  c.down = 1; setTimeout(function(){ c.down = 0; }, 130);
  if (c.ty != null){ MC.type = c.ty; mcShape(); return; } if (c.ex != null){ MC.ext ^= 1 << c.ex; mcShape(); return; }
  if (c.fn === 'perf'){ MC.cont = MC.cont ? 0 : 1; if (!MC.cont) mcSilence(); toast(MC.cont ? 'Chords ring until the next one' : 'Chords play only while pressed'); }
  else if (c.fn === 'fx'){ MC.fx = MC.fx ? 0 : 1; mcApply(); toast('Strum echo ' + (MC.fx ? 'on' : 'off')); }
  else if (c.fn === 'key'){ MC.oct = (MC.oct + 1) % 3; if (MCA && MC.sounding) mcTune(ac.currentTime, false); toast('Octave ' + ['-1', '0', '+1'][MC.oct]); }
  else if (c.fn === 'snd'){ MC.preset = (MC.preset + 1) % MCPRE.length; mcApply(); MC.dirty = true; toast('Sound ' + (MC.preset + 1) + ' · ' + MCPRE[MC.preset].n); }
  mcSaveSoon();
}
function mcRelease(c){ if (c.root != null){ c.down = 0; mcChord(c.root, 0, 0); } else if (c.harp != null) c.down = 0; }
function mcCtl(c){ if (!c.mk) return; MC[c.mk] = c.v; mcApply(); if (c.mk === 'voice' || c.mk === 'bvoice'){ MC.dirty = true; if (MCA && MC.sounding) mcTune(ac.currentTime, false); } mcSaveSoon(); }
DEVH.mc = { label:mcLabel, press:mcPress, release:mcRelease, ctl:mcCtl, turn:NOP };
function mcUpdate(now, dt){
  if (MC.seqHeld && (!M.playing || !MC.cont)){ MC.seqHeld = false; if (!Object.keys(MC.hold).length) mcSilence(); }      /* a chord the sequencer was holding ends when the sequence stops, or PERFORM goes off */
  var P = MCPRE[MC.preset]; MC.pulse = Math.max(0, MC.pulse - dt * 2.2); if (MC.dirty){ MC.dirty = false; mcPaintDisp(); }
  MC.lamp.color.setHex(P.col); MC.lamp.intensity = 0.3 * (0.4 + (MC.sounding ? 0.2 : 0) + MC.pulse * 0.45);
  CTLIST.forEach(function(c){ if (c.dev !== 'mc' || c.kind === 'knob') return; var L;
    if (c.root != null) L = (MC.root === c.root && MC.sounding) ? 1 : c.down ? 0.8 : 0;
    else if (c.ty != null) L = MC.type === c.ty ? 1 : 0.12; else if (c.ex != null) L = (MC.ext & (1 << c.ex)) ? 1 : 0.12;
    else if (c.harp != null) L = c.down ? 1 : 0.08;
    else L = c.fn === 'perf' ? (MC.cont ? 1 : 0.25) : c.fn === 'fx' ? (MC.fx ? 1 : 0.25) : c.down ? 1 : 0.6;
    if (L !== c.lit){ c.lit = L; c.paintLit(); } var ty = c.y0 - (c.down ? 0.003 : 0); if (c.m.position.y !== ty) c.m.position.y = ty; });
}
