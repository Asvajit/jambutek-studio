
/* ================= Kit: a small four-voice paraphonic synth laid out after the ZeKit =================
   Four digital oscillators share one 12 dB filter (low-pass or band-pass) with its own attack / decay envelope; ACCENT is how hard
   that envelope opens the filter. ACID makes it a one-voice bass line with slides between tied notes. It has no keys: its Snake plays
   it, or the computer keyboard while you lean over it, or the four pads along the bottom. The engine is written for this room; no
   code is taken from the ZeKit firmware. */
var ZKW = 190, ZKD = 130, ZKH = 1.1, ZKTILT = 0.56;
function zkx(u){ return (u - ZKW / 2) * SC; }
function zkz(u){ return (u - ZKD / 2) * SC; }
var ZKY = new THREE.Group(); ZKY.position.set(ZKPOS.x, ZKH, ZKPOS.z); ZKY.rotation.y = ZKPOS.r; scene.add(ZKY);
var ZKG = new THREE.Group(); ZKG.rotation.x = ZKTILT; ZKY.add(ZKG);
var ZK = { p:{ cut:0.5, atk:0.02, dec:0.4, acc:0.5, rel:0.3, lvl:0.75, bp:0, acid:0, fat:1, wave:0, oct:1, hold:0 }, held:[], kb:{}, kbOct:0, vis:[], gate:0, next:0 };
var ZKWAVES = ['saw', 'square', 'pulse', 'triangle'], ZKKN = { cut:1, atk:1, dec:1, acc:1, rel:1, lvl:1 };
function zkRestore(){ try { var s = JSON.parse(store('jambutek-studio-kit-v1') || 'null'); if (s && s.v === 1 && s.p) Object.keys(ZK.p).forEach(function(k){ if (typeof s.p[k] !== 'number') return; ZK.p[k] = ZKKN[k] ? clamp(s.p[k], 0, 1) : k === 'wave' ? clamp(s.p[k] | 0, 0, 3) : k === 'oct' ? clamp(s.p[k] | 0, 0, 2) : s.p[k] ? 1 : 0; }); } catch (e) {} } zkRestore();
var zkSaveT = null; function zkSaveNow(){ store('jambutek-studio-kit-v1', JSON.stringify({ v:1, p:ZK.p })); } function zkSaveSoon(){ clearTimeout(zkSaveT); zkSaveT = setTimeout(zkSaveNow, saveMs(800)); }
var zkC = mk(ZKW * 7, ZKD * 7), zkTex = null;
function paintZK(){
  var g = zkC.getContext('2d'); g.setTransform(7, 0, 0, 7, 0, 0);
  g.fillStyle = '#D5D7DA'; g.fillRect(0, 0, ZKW, ZKD);
  for (var i = 0; i < 1500; i++){ g.fillStyle = 'rgba(' + (Math.random() < .5 ? '0,0,0' : '255,255,255') + ',' + rnd(.02, .06) + ')'; g.fillRect(Math.random() * ZKW, Math.random() * ZKD, .7, .25); }
  var NV = '#1D2E5E', RD = '#D2332B';
  function T(s, x, y, size, col, al, rot){ g.save(); g.translate(x, y); if (rot) g.rotate(rot); g.font = '900 ' + size + 'px "Arial Black", "Helvetica Neue", Helvetica, Arial, sans-serif'; g.fillStyle = col || NV; g.textAlign = al || 'center'; g.textBaseline = 'middle'; g.fillText(s, 0, 0); g.restore(); }
  function box(x, y, w, h, s, col, size){ g.strokeStyle = col; g.lineWidth = 0.6; g.strokeRect(x, y, w, h); T(s, x + w / 2, y + h / 2 + 0.2, size || 3.4, col); }
  g.fillStyle = RD; g.fillRect(30, 12, 70, 6.5); T('4 VOICES PARAPHONIC', 65, 15.4, 3.3, '#F4F1EA');
  g.strokeStyle = RD; g.lineWidth = 0.7; g.strokeRect(8, 9, 20, 9.5); T('KIT', 18, 14, 6.4, RD);
  T('after ZeKit by Fred’s Lab', 128, 15.4, 2.7, '#5A6070');
  g.fillStyle = NV; g.fillRect(84, 24, 54, 30); T('FILTER', 78, 39, 7.5, NV, 'center', -Math.PI / 2);                                    // the blue filter block with its three switches
  [['LP', 'BP', 95], ['POLY', 'ACID', 111], ['THIN', 'FAT', 127]].forEach(function(a){ T(a[0], a[2] - 4.6, 31, 2.3, '#F4F1EA'); T(a[1], a[2] + 4.6, 31, 2.3, '#F4F1EA'); });
  g.strokeStyle = NV; g.lineWidth = 0.6; g.strokeRect(30, 24, 44, 40); T('CUTOFF', 52, 28.6, 3.6);
  g.fillStyle = RD; g.fillRect(118, 60, 34, 38); T('ACCENT', 135, 64.4, 3.4, '#F4F1EA');
  g.strokeStyle = RD; g.lineWidth = 0.5; [0, 1, 2, 3].forEach(function(k){ g.beginPath(); g.moveTo(58, 92 + k * 2.2); g.lineTo(184, 92 + k * 2.2); g.stroke(); });      // the red staff lines under the envelope knobs
  box(58, 100.5, 26, 6.5, 'ATTACK', RD); box(90, 62, 26, 6.5, 'DECAY', RD); box(156, 62, 28, 6.5, 'RELEASE', RD); T('LEVEL', 166, 25.4, 3.6);
  [['8', 86], ['4', 112], ['2', 138], ['1', 164]].forEach(function(a){ g.fillStyle = NV; g.fillRect(a[1] - 12, 116.5, 24, 9.5); T(a[0], a[1], 121.4, 6.5, '#F4F1EA'); });
  [['WAVE', 62], ['OCTAVE', 84], ['HOLD', 106]].forEach(function(a){ T(a[0], 18, a[1] + 8.4, 2.6, RD); });
  T('POWER', 18, 33.5, 2.4, RD);
  ['POWER', 'MIDI IN', 'CLOCK IN', 'EXT IN', 'LINE / HEAD'].forEach(function(s, k){ T(s, 14 + k * 41, 4.6, 2.2, '#3A3E48'); g.fillStyle = '#3A3E48'; g.fillRect(14 + k * 41 - 0.2, 0, 0.4, 2.6); });
  g.setTransform(1, 0, 0, 1, 0, 0); if (zkTex) zkTex.needsUpdate = true;
}
paintZK(); zkTex = smoothTex(zkC);
var ZKLED = {};
(function(){
  var W2 = ZKW * SC, D2 = ZKD * SC, TH = 0.075;
  var top = new THREE.Mesh(new THREE.PlaneGeometry(W2, D2), new THREE.MeshPhongMaterial({ color:0x7C7C7C, map:zkTex, emissive:0xffffff, emissiveMap:zkTex, emissiveIntensity:0.3, shininess:16, specular:0x111111 })); top.rotation.x = -Math.PI / 2; ZKG.add(top);
  var body = new THREE.Mesh(new THREE.BoxGeometry(W2 + 0.008, TH, D2 + 0.008), new THREE.MeshPhongMaterial({ color:0x9EA1A6, shininess:40, specular:0x333333, flatShading:true })); body.position.y = -TH / 2 - 0.0015; ZKG.add(body);
  standFor(ZKY, ZKG, W2, D2, TH, ZKH, ZKTILT, 0.14); devBody(ZKY, 'zk'); BLOCKS.push(devBlock(ZKPOS, 0.36));
})();
HOST = ZKG; LX = zkx; LZ = zkz; DEV = 'zk';
[['cut', 52, 46, 'Cutoff'], ['lvl', 166, 40, 'Level'], ['atk', 71, 84, 'Attack'], ['dec', 103, 80, 'Decay'], ['acc', 135, 81, 'Accent'], ['rel', 170, 80, 'Release']]
  .forEach(function(a){ knob('zk' + a[0], a[1], a[2], 8.6, a[3], ZK.p[a[0]], { h:13, sides:18, color:0x121316, cap:0xF5C518, tick:0xF5C518 }).pk = a[0]; });
[['bp', 95, 'Filter', ['low-pass', 'band-pass']], ['acid', 111, 'Mode', ['four voices', 'acid: one voice, tied notes slide']], ['fat', 127, 'Oscillators', ['one per voice', 'two per voice, detuned']]]
  .forEach(function(a){ var c = slide('zk' + a[0], a[1], 43, 2, false, a[2], 0.011); c.pk = a[0]; c.opts = a[3]; c.set(ZK.p[a[0]] ? 1 : 0); });
FACE = { bg:'#C3202A', fg:'#FFFFFF' };
[['wave', 62, 'Waveform'], ['oct', 84, 'Octave'], ['hold', 106, 'Hold']].forEach(function(a){ button('zk' + a[0], 18, a[1], 13, 9.5, '', a[2], 0xFF5A4A).fn = a[0]; });
[86, 112, 138, 164].forEach(function(x, i){ button('zkpad' + i, x, 108.5, 14, 9.5, '', 'Pad ' + ['8', '4', '2', '1'][i], 0xFF5A4A).pad = i; });
FACE = { bg:'#C9C7C0', fg:'#0B0B0D' };
ledAt(ZKLED, 'on', 18, 40.5, 0.003, 0xFF2A3C);
HOST = TRG; LX = lx; LZ = lz; DEV = null;

var ZKA = null;
function zkAudio(){
  if (ZKA) return true; if (!ac || !AU.ready) return false;
  var A = ZKA = {}, G = function(v){ var g = ac.createGain(); g.gain.value = v; return g; };
  var re = new Float32Array(33), im = new Float32Array(33); for (var n = 1; n < 33; n++) im[n] = 2 / (n * Math.PI) * Math.sin(n * Math.PI * 0.22) * 1.6; A.pulse = ac.createPeriodicWave(re, im);    // a narrow pulse
  A.pre = G(0.2); A.f = ac.createBiquadFilter(); A.f.type = 'lowpass'; A.f.Q.value = 2.4; A.vol = G(0.6);
  A.pre.connect(A.f); A.f.connect(A.vol); A.vol.connect(AU.ch[9].inp);
  A.v = [0, 1, 2, 3].map(function(){ var o1 = ac.createOscillator(), o2 = ac.createOscillator(), g2 = G(0), g = G(0); o1.connect(g); o2.connect(g2); g2.connect(g); g.connect(A.pre); o1.start(); o2.start(); return { o1:o1, o2:o2, g2:g2, g:g, n:-1, t:0 }; });
  zkApply(); return true;
}
function zkT(v, lo, span){ return lo + v * v * span; }
function zkApply(){
  if (!ZKA) return; var A = ZKA, P = ZK.p, t = ac.currentTime;
  A.vol.gain.setTargetAtTime(P.lvl * P.lvl * 1.15, t, 0.02); A.f.type = P.bp ? 'bandpass' : 'lowpass'; A.f.Q.setTargetAtTime(P.bp ? 1.6 : 2.4, t, 0.02); A.pre.gain.setTargetAtTime(P.bp ? 0.34 : 0.2, t, 0.02);
  A.v.forEach(function(V){ [V.o1, V.o2].forEach(function(o){ if (P.wave === 2) o.setPeriodicWave(A.pulse); else o.type = ['sawtooth', 'square', '', 'triangle'][P.wave]; }); V.o2.detune.setTargetAtTime(11, t, 0.02); V.g2.gain.setTargetAtTime(P.fat ? 0.85 : 0, t, 0.02); });
}
function zkOn(n, vel, t, dur){                                // dur: a scheduled note of that length; without it the note is held until zkOffNote
  var A = ZKA, P = ZK.p, f = mtof(n + (P.oct - 1) * 12), V, slide = false, i;
  if (P.acid){ V = A.v[0]; slide = V.n >= 0 && V.on; for (i = 1; i < 4; i++){ A.v[i].g.gain.cancelScheduledValues(t); A.v[i].g.gain.setTargetAtTime(0, t, 0.01); A.v[i].n = -1; A.v[i].on = false; } }
  else { V = null; for (i = 0; i < 4; i++) if (A.v[i].n === n && A.v[i].on) V = A.v[i]; if (!V) for (i = 0; i < 4; i++) if (!A.v[i].on && (!V || A.v[i].t < V.t)) V = A.v[i]; if (!V){ V = A.v[0]; for (i = 1; i < 4; i++) if (A.v[i].t < V.t) V = A.v[i]; } }
  [V.o1, V.o2].forEach(function(o){ o.frequency.cancelScheduledValues(t); if (slide) o.frequency.setTargetAtTime(f, t, 0.035); else o.frequency.setValueAtTime(f, t); });
  V.n = n; V.t = t; V.on = !dur;
  if (!slide){
    V.g.gain.cancelScheduledValues(t); V.g.gain.setTargetAtTime(0.4 + vel * 0.6, t, zkT(P.atk, 0.002, 0.5));
    A.f.detune.cancelScheduledValues(t); A.f.detune.setTargetAtTime(P.acc * (2600 + vel * 3000), t, zkT(P.atk, 0.002, 0.25)); A.f.detune.setTargetAtTime(0, t + zkT(P.atk, 0.006, 0.6), zkT(P.dec, 0.03, 1.6));
  }
  if (dur){ V.g.gain.setTargetAtTime(0, t + dur, zkT(P.rel, 0.012, 1.2)); }
  return V;
}
function zkNoteAt(n, vel, t, dur){ if (!zkAudio()) return; zkOn(n, vel, t, dur); ZK.vis.push({ t:t, d:dur }); }
function zkKeyDown(n){ unlock(); if (!zkAudio()) return; ZK.held = ZK.held.filter(function(q){ return q !== n; }); ZK.held.push(n); zkOn(n, 0.85, ac.currentTime + 0.003); }
function zkRelease(n, t){ ZKA.v.forEach(function(V){ if (V.n === n && V.on){ V.on = false; V.g.gain.cancelScheduledValues(t); V.g.gain.setTargetAtTime(0, t, zkT(ZK.p.rel, 0.012, 1.2)); } }); }
function zkKeyUp(n){
  if (ZK.p.hold || !ZKA){ return; } var t = ac.currentTime + 0.003; ZK.held = ZK.held.filter(function(q){ return q !== n; });
  if (ZK.p.acid){ if (ZK.held.length){ var m = ZK.held[ZK.held.length - 1], V = ZKA.v[0], f = mtof(m + (ZK.p.oct - 1) * 12); [V.o1, V.o2].forEach(function(o){ o.frequency.setTargetAtTime(f, t, 0.035); }); V.n = m; } else { var V0 = ZKA.v[0]; V0.on = false; V0.g.gain.cancelScheduledValues(t); V0.g.gain.setTargetAtTime(0, t, zkT(ZK.p.rel, 0.012, 1.2)); } return; }
  zkRelease(n, t);
}
function zkAllOff(){ ZK.held = []; if (!ZKA) return; var t = ac.currentTime + 0.003; ZKA.v.forEach(function(V){ V.on = false; V.g.gain.cancelScheduledValues(t); V.g.gain.setTargetAtTime(0, t, zkT(ZK.p.rel, 0.012, 1.2)); }); }
function zkKbDown(k){
  if (k === 'z' || k === 'x'){ ZK.kbOct = clamp(ZK.kbOct + (k === 'x' ? 1 : -1), -2, 2); toast('Kit keys octave ' + (ZK.kbOct > 0 ? '+' : '') + ZK.kbOct); return true; }
  var i = MFKB.indexOf(k); if (i < 0 || k.length !== 1) return false; if (ZK.kb[k] != null) return true; var n = 48 + i + ZK.kbOct * 12; ZK.kb[k] = n; zkKeyDown(n); return true;
}
function zkKbUp(k){ if (ZK.kb[k] != null){ zkKeyUp(ZK.kb[k]); delete ZK.kb[k]; } }
var ZKPADS = [48, 55, 60, 63];
function zkLabel(c){
  if (c.sw) return c.name + ': ' + c.opts[c.pos] + ' · click';
  if (c.fn === 'wave') return 'Waveform: ' + ZKWAVES[ZK.p.wave] + ' · click'; if (c.fn === 'oct') return 'Octave ' + ['-1', '0', '+1'][ZK.p.oct] + ' · click'; if (c.fn === 'hold') return 'Hold ' + (ZK.p.hold ? 'on' : 'off') + ' · click';
  if (c.pad != null) return c.name + ' · click to play';
  return c.name + ' ' + Math.round(c.v * 100) + ' · scroll or drag';
}
function zkPress(c){
  if (c.sw){ c.set((c.pos + 1) % 2); ZK.p[c.pk] = c.pos; if (c.pk === 'acid') zkAllOff(); zkAudio(); zkApply(); zkSaveSoon(); toast(c.name + ': ' + c.opts[c.pos]); return; }
  if (c.pad != null){ zkKeyDown(ZKPADS[c.pad]); return; }
  if (c.fn === 'wave'){ ZK.p.wave = (ZK.p.wave + 1) % 4; toast('Kit waveform: ' + ZKWAVES[ZK.p.wave]); } else if (c.fn === 'oct'){ ZK.p.oct = (ZK.p.oct + 1) % 3; zkAllOff(); toast('Kit octave ' + ['-1', '0', '+1'][ZK.p.oct]); } else if (c.fn === 'hold'){ ZK.p.hold = ZK.p.hold ? 0 : 1; if (!ZK.p.hold) zkAllOff(); toast('Kit hold ' + (ZK.p.hold ? 'on' : 'off')); }
  zkAudio(); zkApply(); zkSaveSoon();
}
function zkRel(c){ if (c.pad != null) zkKeyUp(ZKPADS[c.pad]); }
function zkCtl(c){ ZK.p[c.pk] = c.v; zkApply(); zkSaveSoon(); }
DEVH.zk = { label:zkLabel, press:zkPress, release:zkRel, ctl:zkCtl, turn:NOP };
function zkUpdate(now, dt){
  var on = false; if (ZKA){ ZKA.v.forEach(function(V){ if (V.on) on = true; }); }
  if (ac){ var t = ac.currentTime; ZK.vis = ZK.vis.filter(function(e){ if (e.t <= t && t < e.t + e.d) on = true; return e.t + e.d > t; }); }
  ZK.gate = lerp(ZK.gate, on ? 1 : 0, 1 - Math.exp(-dt * 25)); ledOn(ZKLED.on, 0.35 + ZK.gate * 0.65);
  if (ZKA){ ZKA.f.frequency.setTargetAtTime(clamp(70 * Math.pow(2, ZK.p.cut * 7.3 + snCv(8) * 2), 30, 16000), ac.currentTime, 0.015); }
  ['wave', 'oct', 'hold'].forEach(function(k){ var c = CT['zk' + k], L = k === 'hold' ? (ZK.p.hold ? 1 : 0.15) : 0.3; if (c.down) L = 1; if (L !== c.lit){ c.lit = L; c.paintLit(); } var ty = c.y0 - (c.down ? 0.003 : 0); if (c.m.position.y !== ty) c.m.position.y = ty; });
  for (var i = 0; i < 4; i++){ var p = CT['zkpad' + i], pl = p.down ? 1 : 0.25; if (pl !== p.lit){ p.lit = pl; p.paintLit(); } var py = p.y0 - (p.down ? 0.003 : 0); if (p.m.position.y !== py) p.m.position.y = py; }
}
RESTORE['jambutek-studio-kit-v1'] = function(){ zkRestore(); CTLIST.forEach(function(c){ if (c.dev !== 'zk') return; if (c.sw) c.set(ZK.p[c.pk] ? 1 : 0); else if (c.kind === 'knob'){ c.v = ZK.p[c.pk]; c.show(); } }); zkApply(); }; SAVENOW.push(zkSaveNow);
