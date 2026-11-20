
/* ================= the reverb: a huge-space reverb on the table below the echo, fed by the mixer's SEND B =================
   Inspired by the big "delay that turns into a reverb" plugins: four modulated delay lines feeding each other. With DENSITY low you
   hear separate repeats; turned up they smear into a wash, and with DECAY high the tail goes on for a very long time. The engine is
   written for this room. It shares the echo's spot on the table, so leaning over the echo shows both. */
var RVOFF = 0.27;                                  // how far below the echo it sits, down the slope of the table
function rvx(u){ return (u - ECW / 2) * SC; }
function rvz(u){ return (u - ECD / 2) * SC + RVOFF; }
ECG.position.z = -RVOFF / 2;                       // the echo moves up so the pair is centred on the table
var RV = { p:{ size:0.45, dec:0.7, dens:0.7, mod:0.35, tone:0.6, level:0.7, mode:0, on:1 }, lv:0 };
var RVMODES = [['HALL', [1, 1.31, 1.73, 2.19], 0.22], ['CLOUD', [1, 1.47, 2.11, 2.83], 0.5], ['VOID', [1, 1.62, 2.41, 3.37], 0.85]];
function rvRestore(){ try { var s = JSON.parse(store('jambutek-studio-reverb-v1') || 'null'); if (s && s.v === 1 && s.p) Object.keys(RV.p).forEach(function(k){ if (typeof s.p[k] !== 'number') return; RV.p[k] = k === 'mode' ? clamp(s.p[k] | 0, 0, 2) : k === 'on' ? (s.p[k] ? 1 : 0) : clamp(s.p[k], 0, 1); }); } catch (e) {} } rvRestore();
var rvSaveT = null; function rvSaveNow(){ store('jambutek-studio-reverb-v1', JSON.stringify({ v:1, p:RV.p })); } function rvSaveSoon(){ clearTimeout(rvSaveT); rvSaveT = setTimeout(rvSaveNow, saveMs(800)); }
var rvC = mk(ECW * 6, ECD * 6), rvTex = null;
function paintRV(){
  var g = rvC.getContext('2d'); g.setTransform(6, 0, 0, 6, 0, 0);
  var gr = g.createLinearGradient(0, 0, ECW, ECD); gr.addColorStop(0, '#141A3A'); gr.addColorStop(1, '#2A1846'); g.fillStyle = gr; g.fillRect(0, 0, ECW, ECD);
  for (var i = 0; i < 160; i++){ g.fillStyle = 'rgba(255,255,255,' + rnd(.08, .5) + ')'; var r = rnd(.12, .42); g.beginPath(); g.arc(Math.random() * ECW, Math.random() * ECD, r, 0, 7); g.fill(); }     // a few stars
  function T(s, x, y, size, col, anton, al){ g.font = anton ? size + 'px ' + FONT : 'bold ' + size + 'px "Helvetica Neue", Helvetica, Arial, sans-serif'; g.fillStyle = col || '#E6E4F2'; g.textAlign = al || 'center'; g.textBaseline = 'middle'; g.fillText(s, x, y); }
  g.strokeStyle = '#E6E4F2'; g.lineWidth = 0.6; g.strokeRect(4, 4, ECW - 8, ECD - 8);
  T('REVERB', 10, 14, 10, '#E6E4F2', true, 'left'); T('SEND B', ECW - 10, 14, 5, '#7FD0FF', false, 'right'); g.fillStyle = '#E6E4F2'; g.fillRect(10, 22, ECW - 20, 0.6);
  [['SIZE', 28, 42], ['DECAY', 64, 42], ['DENSITY', 100, 42], ['MOD', 28, 80], ['TONE', 64, 80], ['LEVEL', 100, 80]].forEach(function(a){ T(a[0], a[1], a[2] + 14.5, 4); });
  T('MODE', 141, 54, 3.6); T('ON', 141, 84, 3.6); T('PEAK', 141, 100.5, 3.2);
  g.setTransform(1, 0, 0, 1, 0, 0); if (rvTex) rvTex.needsUpdate = true;
}
paintRV(); rvTex = smoothTex(rvC);
if (document.fonts && document.fonts.load) document.fonts.load('20px Anton').then(paintRV).catch(function(){});
var RVLED = {};
(function(){
  var W2 = ECW * SC, D2 = ECD * SC;
  var top = new THREE.Mesh(new THREE.PlaneGeometry(W2, D2), new THREE.MeshPhongMaterial({ color:0x8C8C8C, map:rvTex, emissive:0xffffff, emissiveMap:rvTex, emissiveIntensity:0.5, shininess:8, specular:0x0A0A0A })); top.rotation.x = -Math.PI / 2; top.position.z = RVOFF; ECG.add(top);
  var body = new THREE.Mesh(new THREE.BoxGeometry(W2 + 0.012, ECTH, D2 + 0.012), new THREE.MeshPhongMaterial({ color:0x14122A, shininess:30, specular:0x222222, flatShading:true })); body.position.set(0, -ECTH / 2 - 0.0015, RVOFF); ECG.add(body);
  top.userData.dev = body.userData.dev = 'ec';
})();
HOST = ECG; LX = rvx; LZ = rvz; DEV = 'ec';
[['size', 28, 42, 'Reverb size'], ['dec', 64, 42, 'Decay'], ['dens', 100, 42, 'Density'], ['mod', 28, 80, 'Modulation'], ['tone', 64, 80, 'Tone'], ['level', 100, 80, 'Reverb level']]
  .forEach(function(a){ var c = knob('rv' + a[0], a[1], a[2], 7.6, a[3], RV.p[a[0]], { h:11, sides:16, color:0xDAD8E8, tick:0x1A1440 }); c.rk = a[0]; c.rv = true; c.def = { size:0.45, dec:0.7, dens:0.7, mod:0.35, tone:0.6, level:0.7 }[a[0]]; });
var rvB1 = button('rvmode', 141, 42, 22, 11, 'HALL', 'Reverb mode', 0xB48CFF); rvB1.rv = true; rvB1.rk = 'mode';
var rvB2 = button('rvon', 141, 72, 22, 11, 'ON', 'Reverb on / off', 0x3BFF6A); rvB2.rv = true; rvB2.rk = 'on';
ledAt(RVLED, 'pk', 141, 94, 0.003, 0xFF2A3C);
HOST = TRG; LX = lx; LZ = lz; DEV = null;

var RVA = null;
function rvAudio(){
  if (RVA) return true; if (!ac || !AU.ready || !AU.sendB) return false;
  var A = RVA = {}, G = function(v){ var g = ac.createGain(); g.gain.value = v; return g; }, i, j;
  A.inp = G(1); A.hp = ac.createBiquadFilter(); A.hp.type = 'highpass'; A.hp.frequency.value = 130; A.hp.Q.value = 0.5; A.wet = G(0); A.an = ac.createAnalyser(); A.an.fftSize = 256; A.mrg = ac.createChannelMerger(2);
  AU.sendB.connect(A.inp); A.inp.connect(A.hp); A.mrg.connect(A.wet); A.wet.connect(AU.comp); A.wet.connect(A.an);
  A.L = [0, 1, 2, 3].map(function(k){                                  // each line: sum -> delay -> damping -> out
    var L = { sum:G(1), dl:ac.createDelay(3.2), lp:ac.createBiquadFilter(), lfo:ac.createOscillator(), lg:G(0), out:G(0.5) }; L.lp.type = 'lowpass'; L.lp.Q.value = 0.3;
    A.hp.connect(L.sum); L.sum.connect(L.dl); L.dl.connect(L.lp); L.lp.connect(L.out); L.out.connect(A.mrg, 0, k % 2);
    L.lfo.frequency.value = [0.13, 0.19, 0.27, 0.34][k]; L.lfo.connect(L.lg); L.lg.connect(L.dl.delayTime); L.lfo.start(); return L;
  });
  A.fb = []; for (i = 0; i < 4; i++){ A.fb.push([]); for (j = 0; j < 4; j++){ var g = G(0); A.L[i].lp.connect(g); g.connect(A.L[j].sum); A.fb[i].push(g); } }      // every line feeds every line
  rvApply(true); return true;
}
var RVHAD = [[1, 1, 1, 1], [1, -1, 1, -1], [1, 1, -1, -1], [1, -1, -1, 1]];
function rvApply(jump){
  if (!RVA) return; var A = RVA, P = RV.p, t = ac.currentTime, M = RVMODES[P.mode], base = 0.012 + P.size * P.size * M[2], fb = 0.3 + P.dec * 0.685, i, j;
  for (i = 0; i < 4; i++){
    var L = A.L[i], d = Math.min(3.0, base * M[1][i]); L.dl.delayTime.setTargetAtTime(d, t, jump ? 0.001 : 0.12); L.lg.gain.setTargetAtTime(Math.min(d * 0.25, P.mod * P.mod * 0.006), t, 0.05);
    L.lp.frequency.setTargetAtTime(600 * Math.pow(2, P.tone * 4.6), t, 0.03);
    // low density: a ring, one line into the next, so you hear the repeats. High: the full mix, a wash. Any blend of the two stays stable
    for (j = 0; j < 4; j++) A.fb[i][j].gain.setTargetAtTime(fb * ((1 - P.dens) * (j === (i + 1) % 4 ? 1 : 0) + P.dens * RVHAD[i][j] * 0.5), t, 0.03);
  }
  A.wet.gain.setTargetAtTime(Math.pow(P.level, 1.5) * 1.5, t, 0.03); A.inp.gain.setTargetAtTime(P.on ? 1 : 0, t, 0.015);         // switching it off stops feeding it; the tail rings out
}
function rvLabel(c){
  if (c.id === 'rvmode') return 'Reverb mode: ' + RVMODES[RV.p.mode][0].toLowerCase() + ' · click'; if (c.id === 'rvon') return 'Reverb ' + (RV.p.on ? 'on' : 'off') + ' · click';
  return c.name + ' ' + Math.round(c.v * 100) + ' · scroll or drag';
}
function rvPress(c){
  if (c.id === 'rvmode'){ RV.p.mode = (RV.p.mode + 1) % 3; c.repaintFace(RVMODES[RV.p.mode][0]); toast('Reverb mode: ' + RVMODES[RV.p.mode][0].toLowerCase()); } else if (c.id === 'rvon'){ RV.p.on = RV.p.on ? 0 : 1; toast('Reverb ' + (RV.p.on ? 'on' : 'off')); } else return;
  rvAudio(); rvApply(); rvSaveSoon();
}
function rvCtl(c){ RV.p[c.rk] = c.v; rvAudio(); rvApply(); rvSaveSoon(); }
(function(){ var E = DEVH.ec; DEVH.ec = { label:function(c){ return c.rv ? rvLabel(c) : E.label(c); }, press:function(c){ return c.rv ? rvPress(c) : E.press(c); }, release:NOP, ctl:function(c){ return c.rv ? rvCtl(c) : E.ctl(c); }, turn:NOP }; })();
function rvUpdate(now, dt){
  if (!RVA) rvAudio();
  var pk = 0; if (RVA){ var buf = rvUpdate.buf || (rvUpdate.buf = new Float32Array(256)); RVA.an.getFloatTimeDomainData(buf); for (var k = 0; k < 256; k += 2){ var a = Math.abs(buf[k]); if (a > pk) pk = a; } }
  RV.lv = Math.max(pk, RV.lv - dt * 2.5); ledOn(RVLED.pk, clamp(RV.lv * 3, 0.06, 1));
  [rvB1, rvB2].forEach(function(c){ var L = c === rvB1 ? 0.55 : (RV.p.on ? 1 : 0.12); if (c.down) L = Math.max(L, 0.9); if (L !== c.lit){ c.lit = L; c.paintLit(); } var ty = c.y0 - (c.down ? 0.003 : 0); if (c.m.position.y !== ty) c.m.position.y = ty; });
}
rvB1.repaintFace(RVMODES[RV.p.mode][0]);
RESTORE['jambutek-studio-reverb-v1'] = function(){ rvRestore(); CTLIST.forEach(function(c){ if (c.rv && c.kind === 'knob'){ c.v = RV.p[c.rk]; c.show(); } }); rvB1.repaintFace(RVMODES[RV.p.mode][0]); rvApply(); }; SAVENOW.push(rvSaveNow);
