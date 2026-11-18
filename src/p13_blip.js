
/* ================= Jambu Blip: a small red mono bass box laid out after the MeeBlip triode =================
   Two oscillators (pulse with a slow width sweep, or saw) plus a square sub an octave down, into a 24 dB low-pass.
   Decay-only envelopes with a sustain switch, glide, detune, and one LFO that goes to pitch or to the filter.
   It has no keys: its Snake plays it, or the computer keyboard while you lean over it. */
var MBW = 130, MBD = 124, MBH = 1.1, MBTILT = 0.56;
function mbx(u){ return (u - MBW / 2) * SC; }
function mbz(u){ return (u - MBD / 2) * SC; }
var MBY = new THREE.Group(); MBY.position.set(MBPOS.x, MBH, MBPOS.z); scene.add(MBY);
var MBG = new THREE.Group(); MBG.rotation.x = MBTILT; MBY.add(MBG);
var MB = { p:{ vol:0.8, adec:0.45, fdec:0.4, cut:0.45, res:0.35, glide:0.1, det:0.3, rate:0.4, depth:0.15, sus:1, sub:1, wave:0, dest:1 }, stack:[], kb:{}, kbOct:0, vis:[], gate:0 };
(function(){ try { var s = JSON.parse(store('jambutek-studio-blip-v1') || 'null'); if (s && s.v === 1 && s.p) Object.keys(MB.p).forEach(function(k){ if (typeof s.p[k] === 'number') MB.p[k] = clamp(s.p[k], 0, 1); }); } catch (e) {} })();
var mbSaveT = null; function mbSaveSoon(){ clearTimeout(mbSaveT); mbSaveT = setTimeout(function(){ store('jambutek-studio-blip-v1', JSON.stringify({ v:1, p:MB.p })); }, 800); }
var mbC = mk(MBW * 8, MBD * 8), mbTex = null;
function paintMB(){
  var g = mbC.getContext('2d'); g.setTransform(8, 0, 0, 8, 0, 0);
  g.fillStyle = '#C3161D'; g.fillRect(0, 0, MBW, MBD);
  var gr = g.createLinearGradient(0, 0, 0, MBD); gr.addColorStop(0, 'rgba(255,120,110,.25)'); gr.addColorStop(0.12, 'rgba(0,0,0,0)'); gr.addColorStop(0.9, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,.25)'); g.fillStyle = gr; g.fillRect(0, 0, MBW, MBD);
  g.strokeStyle = 'rgba(120,10,16,.75)'; g.lineWidth = 0.5; g.strokeRect(13, 13.5, 104, 99); g.strokeStyle = 'rgba(255,140,130,.35)'; g.lineWidth = 0.3; g.strokeRect(13.6, 14.1, 104, 99);
  var W = '#EFE9E4';
  function T(s, x, y, size, col, al){ g.font = '900 ' + size + 'px "Arial Black", "Helvetica Neue", Helvetica, Arial, sans-serif'; g.fillStyle = col || W; g.textAlign = al || 'center'; g.textBaseline = 'middle'; g.fillText(s, x, y); }
  function bar(x0, x1, y, s){ g.fillStyle = W; g.fillRect(x0, y - 2, x1 - x0, 4); T(s, (x0 + x1) / 2, y + 0.2, 2.9, '#5A1418'); }
  T('BLIP', 18, 29, 14, W, 'left');
  T('VOLUME', 105, 37.2, 2.7);
  bar(17.5, 70.5, 41.5, 'ENVELOPES'); bar(76.5, 112.5, 41.5, 'FILTER'); bar(17.5, 70.5, 68, 'OSCILLATORS'); bar(76.5, 112.5, 68, 'LFO');
  [['AMP DECAY', 24.6], ['FILTER DECAY', 45.8], ['SUSTAIN', 64.4], ['CUTOFF', 83.3], ['REZ', 104.6]].forEach(function(a){ T(a[0], a[1], 63.8, 2.5); });
  [['GLIDE', 24.6], ['DETUNE', 45.8], ['SUB OSC', 64.4], ['RATE', 83.3], ['DEPTH', 104.6]].forEach(function(a){ T(a[0], a[1], 90.8, 2.5); });
  [47.5, 74.5].forEach(function(y){ g.strokeStyle = W; g.lineWidth = 0.35; g.strokeRect(61.4, y - 1.2, 2.4, 2.4); g.fillStyle = W; g.fillRect(65.4, y - 1.2, 2.4, 2.4); });
  T('WAVEFORM', 45.8, 108.5, 2.5); T('PWM', 45.8, 95.5, 2.1); T('LFO DEST', 83.3, 108.5, 2.5); T('OSC', 74, 102, 2.1); T('FILTER', 94.5, 102, 2.1);
  g.strokeStyle = W; g.lineWidth = 0.45; g.beginPath(); g.moveTo(33.5, 103.5); g.lineTo(33.5, 100.5); g.lineTo(36, 100.5); g.lineTo(36, 103.5); g.lineTo(38, 103.5); g.stroke();
  g.beginPath(); g.moveTo(53.5, 103.5); g.lineTo(58, 100.5); g.lineTo(58, 103.5); g.stroke();
  g.setTransform(1, 0, 0, 1, 0, 0); if (mbTex) mbTex.needsUpdate = true;
}
paintMB(); mbTex = smoothTex(mbC);
var MBLED = {};
(function(){
  var W2 = MBW * SC, D2 = MBD * SC, TH = 0.07;
  var top = new THREE.Mesh(new THREE.PlaneGeometry(W2, D2), new THREE.MeshPhongMaterial({ color:0x808080, map:mbTex, emissive:0xffffff, emissiveMap:mbTex, emissiveIntensity:0.3, shininess:6, specular:0x000000 })); top.rotation.x = -Math.PI / 2; MBG.add(top);
  var body = new THREE.Mesh(new THREE.BoxGeometry(W2 + 0.008, TH, D2 + 0.008), new THREE.MeshPhongMaterial({ color:0xB81A20, shininess:30, specular:0x331111, flatShading:true })); body.position.y = -TH / 2 - 0.0015; MBG.add(body);
  standFor(MBY, MBG, W2, D2, TH, MBH, MBTILT, 0.11); devBody(MBY, 'mb'); BLOCKS.push([MBPOS.x - 0.34, MBPOS.x + 0.34, ROOM.z0, MBPOS.z + 0.34]);
})();
HOST = MBG; LX = mbx; LZ = mbz; DEV = 'mb';
knob('mbvol', 94, 26.5, 6.3, 'Volume', MB.p.vol, { h:11, sides:16, color:0x0E0F11 }).pk = 'vol'; ledAt(MBLED, 'on', 106.2, 26.5, 0.0028, 0x3BFF6A);
[['adec', 24.6, 53, 'Amp decay'], ['fdec', 45.8, 53, 'Filter decay'], ['cut', 83.3, 53, 'Cutoff'], ['res', 104.6, 53, 'Resonance'], ['glide', 24.6, 80, 'Glide'], ['det', 45.8, 80, 'Detune'], ['rate', 83.3, 80, 'LFO rate'], ['depth', 104.6, 80, 'LFO depth']]
  .forEach(function(a){ knob('mb' + a[0], a[1], a[2] - 0.6, 6.3, a[3], MB.p[a[0]], { h:11, sides:16, color:0x0E0F11 }).pk = a[0]; });
[['sus', 64.4, 55, 'Sustain', ['off', 'on']], ['sub', 64.4, 82, 'Sub oscillator', ['off', 'on']], ['wave', 45.8, 102, 'Waveform', ['pulse, width sweeping', 'saw']], ['dest', 83.3, 102, 'LFO destination', ['oscillators', 'filter']]]
  .forEach(function(a){ var c = slide('mb' + a[0], a[1], a[2], 2, false, a[3], 0.011); c.pk = a[0]; c.opts = a[4]; c.set(MB.p[a[0]] ? 1 : 0); });
HOST = TRG; LX = lx; LZ = lz; DEV = null;

var MBA = null;
function mbAudio(){
  if (MBA) return true; if (!ac || !AU.ready) return false;
  var A = MBA = {}, G = function(v){ var g = ac.createGain(); g.gain.value = v; return g; };
  A.mix = G(0.26); A.f1 = ac.createBiquadFilter(); A.f2 = ac.createBiquadFilter(); A.f1.type = A.f2.type = "lowpass"; A.f1.Q.value = 0.6; A.vca = G(0); A.vol = G(0.8);
  A.mix.connect(A.f1); A.f1.connect(A.f2); A.f2.connect(A.vca); A.vca.connect(A.vol); A.vol.connect(AU.ch[3].inp);
  A.sweep = ac.createOscillator(); A.sweep.frequency.value = 0.45; A.sweep.start();
  A.osc = [0, 1].map(function(){ var o = ac.createOscillator(); o.type = 'sawtooth'; var d = ac.createDelay(0.06), inv = G(-1), sw = G(0); o.connect(A.mix); o.connect(d); d.connect(inv); inv.connect(A.mix); A.sweep.connect(sw); sw.connect(d.delayTime); o.start(); return { o:o, d:d, inv:inv, sw:sw }; });
  A.sub = ac.createOscillator(); A.sub.type = 'square'; A.subG = G(0.5); A.sub.connect(A.subG); A.subG.connect(A.mix); A.sub.start();
  A.lfo = ac.createOscillator(); A.lfo.type = 'triangle'; A.lp = G(0); A.lf = G(0); A.lfo.connect(A.lp); A.lfo.connect(A.lf); A.lfo.start();
  A.osc.forEach(function(q){ A.lp.connect(q.o.detune); }); A.lp.connect(A.sub.detune); A.lf.connect(A.f1.detune); A.lf.connect(A.f2.detune);
  A.f = 55; mbApply(); return true;
}
function mbDec(v){ return 0.03 + v * v * 2.4; }
function mbApply(){
  if (!MBA) return; var A = MBA, P = MB.p, t = ac.currentTime, per = 1 / A.f;
  A.vol.gain.setTargetAtTime(P.vol * P.vol * 1.1, t, 0.02); A.subG.gain.setTargetAtTime(P.sub ? 0.55 : 0, t, 0.02);
  A.f2.Q.setTargetAtTime(0.7 + P.res * 17, t, 0.02); A.lfo.frequency.setTargetAtTime(0.1 * Math.pow(250, P.rate), t, 0.02);
  A.lp.gain.setTargetAtTime(P.dest ? 0 : P.depth * P.depth * 700, t, 0.02); A.lf.gain.setTargetAtTime(P.dest ? P.depth * 3600 : 0, t, 0.02);
  A.osc.forEach(function(q, i){ q.inv.gain.setTargetAtTime(P.wave ? 0 : -1, t, 0.01); q.d.delayTime.setTargetAtTime(per * 0.5, t, 0.01); q.sw.gain.setTargetAtTime(P.wave ? 0 : per * 0.32, t, 0.01); q.o.detune.setTargetAtTime(i ? P.det * P.det * 60 : 0, t, 0.02); });
}
function mbPitch(n, t, slide){
  var A = MBA, f = mtof(n), g = MB.p.glide * MB.p.glide * 0.25; A.f = f;
  [A.osc[0].o, A.osc[1].o].forEach(function(o){ o.frequency.cancelScheduledValues(t); if (slide && g > 0.002) o.frequency.setTargetAtTime(f, t, g); else o.frequency.setValueAtTime(f, t); });
  A.sub.frequency.cancelScheduledValues(t); if (slide && g > 0.002) A.sub.frequency.setTargetAtTime(f / 2, t, g); else A.sub.frequency.setValueAtTime(f / 2, t);
  A.osc.forEach(function(q){ q.d.delayTime.setTargetAtTime(0.5 / f, t, 0.01); q.sw.gain.setTargetAtTime(MB.p.wave ? 0 : 0.32 / f, t, 0.01); });
}
function mbOn(n, vel, t, legato){
  var A = MBA, P = MB.p; mbPitch(n, t, true); if (legato) return;
  var pk = 0.35 + vel * 0.65;
  A.vca.gain.cancelScheduledValues(t); A.vca.gain.setTargetAtTime(pk, t, 0.002); if (!P.sus) A.vca.gain.setTargetAtTime(0, t + 0.008, mbDec(P.adec));
  [A.f1.detune, A.f2.detune].forEach(function(d){ d.cancelScheduledValues(t); d.setTargetAtTime(1800 + vel * 2400, t, 0.002); d.setTargetAtTime(0, t + 0.008, mbDec(P.fdec)); });
}
function mbOff(t){ var A = MBA; A.vca.gain.cancelScheduledValues(t); A.vca.gain.setTargetAtTime(0, t, MB.p.sus ? mbDec(MB.p.adec) * 0.5 : mbDec(MB.p.adec)); }
function mbNoteAt(n, vel, t, dur){ if (!mbAudio()) return; mbOn(n, vel, t, false); mbOff(t + dur); MB.vis.push({ t:t, d:dur }); }
function mbKeyDown(n){ unlock(); if (!mbAudio()) return; MB.stack.push(n); mbOn(n, 0.85, ac.currentTime + 0.003, MB.stack.length > 1); }
function mbKeyUp(n){ MB.stack = MB.stack.filter(function(q){ return q !== n; }); if (!MBA) return; var t = ac.currentTime + 0.003; if (MB.stack.length) mbPitch(MB.stack[MB.stack.length - 1], t, true); else mbOff(t); }
function mbKbDown(k){
  if (k === 'z' || k === 'x'){ MB.kbOct = clamp(MB.kbOct + (k === 'x' ? 1 : -1), -2, 2); toast('Blip keys octave ' + (MB.kbOct > 0 ? '+' : '') + MB.kbOct); return true; }
  var i = MFKB.indexOf(k); if (i < 0 || k.length !== 1) return false; if (MB.kb[k] != null) return true; var n = 36 + i + MB.kbOct * 12; MB.kb[k] = n; mbKeyDown(n); return true;
}
function mbKbUp(k){ if (MB.kb[k] != null){ mbKeyUp(MB.kb[k]); delete MB.kb[k]; } }
function mbLabel(c){ if (c.sw) return c.name + ': ' + c.opts[c.pos] + ' · click'; return c.name + ' ' + Math.round(c.v * 100) + ' · scroll or drag'; }
function mbPress(c){ if (!c.sw) return; c.set((c.pos + 1) % 2); MB.p[c.pk] = c.pos; mbApply(); mbSaveSoon(); toast(c.name + ': ' + c.opts[c.pos]); }
function mbCtl(c){ MB.p[c.pk] = c.v; mbApply(); mbSaveSoon(); }
DEVH.mb = { label:mbLabel, press:mbPress, release:NOP, ctl:mbCtl, turn:NOP };
function mbUpdate(now, dt){
  var on = MB.stack.length > 0;
  if (ac){ var t = ac.currentTime; MB.vis = MB.vis.filter(function(e){ if (e.t <= t && t < e.t + e.d) on = true; return e.t + e.d > t; }); }
  MB.gate = lerp(MB.gate, on ? 1 : 0, 1 - Math.exp(-dt * 25)); ledOn(MBLED.on, 0.25 + MB.gate * 0.75);
  if (MBA){ var c = 60 * Math.pow(2, MB.p.cut * 7.2 + snCv(3) * 2), tt = ac.currentTime; MBA.f1.frequency.setTargetAtTime(clamp(c, 30, 16000), tt, 0.015); MBA.f2.frequency.setTargetAtTime(clamp(c, 30, 16000), tt, 0.015); }
}
