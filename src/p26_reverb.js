
/* ================= the reverb: a huge-space reverb on the table below the echo, fed by the mixer's SEND B =================
   Inspired by the big "delay that turns into a reverb" plugins: four modulated delay lines feeding each other. With DENSITY low you
   hear separate repeats; turned up they smear into a wash, and with DECAY high the tail goes on for a very long time. The engine is
   written for this room. It shares the echo's spot on the table, so leaning over the echo shows both. */
var RVOFF = 0.25;                                  // how far below the echo it sits, down the slope of the table
function rvx(u){ return (u - ECW / 2) * SC; }
function rvz(u){ return (u - ECD / 2) * SC + RVOFF; }
ECG.position.z = -0.2;                             // the echo moves up: the reverb sits under it and the scenes box under that, the three centred on the table
var RV = { p:{ size:0.45, dec:0.7, dens:0.7, mod:0.35, tone:0.6, level:0.7, hpf:0, lpf:1, mode:0, on:1 }, lv:0 };      /* hpf 0 and lpf 1 are fully open: a jam saved before these two knobs existed sounds as it did */
var RVMODES = [['HALL', [1, 1.31, 1.73, 2.19], 0.22], ['CLOUD', [1, 1.47, 2.11, 2.83], 0.5], ['VOID', [1, 1.62, 2.41, 3.37], 0.85]];
function rvRestore(){ try { var s = JSON.parse(store('jambutek-studio-reverb-v1') || 'null'); if (s && s.v === 1 && s.p) Object.keys(RV.p).forEach(function(k){ if (typeof s.p[k] !== 'number'){ if (k === 'hpf') RV.p.hpf = 0; else if (k === 'lpf') RV.p.lpf = 1; return; } RV.p[k] = k === 'mode' ? clamp(s.p[k] | 0, 0, 2) : k === 'on' ? (s.p[k] ? 1 : 0) : clamp(s.p[k], 0, 1); }); } catch (e) {} } rvRestore();
var rvSaveT = null; function rvSaveNow(){ store('jambutek-studio-reverb-v1', JSON.stringify({ v:1, p:RV.p })); } function rvSaveSoon(){ clearTimeout(rvSaveT); rvSaveT = setTimeout(rvSaveNow, saveMs(800)); }
/* the BEEVERB plate: the designer's artwork, 1360 x 880 px (8 px per mm), with its controls cut out (tools/make_fx.py) */
var rvC = mk(1360, 880), rvTex = null, rvImg = new Image();
function paintRV(){ var g = rvC.getContext('2d'); if (rvImg.ok) g.drawImage(rvImg, 0, 0); else { g.fillStyle = '#E8C63A'; g.fillRect(0, 0, 1360, 880); } if (rvTex) rvTex.needsUpdate = true; }
rvImg.onload = function(){ rvImg.ok = true; paintRV(); }; rvImg.src = 'tr/beeverb.jpg';
paintRV(); rvTex = smoothTex(rvC);
var RVLED = {};
(function(){
  var W2 = ECW * SC, D2 = ECD * SC;
  var top = new THREE.Mesh(new THREE.PlaneGeometry(W2, D2), new THREE.MeshPhongMaterial({ color:0x404040, map:rvTex, emissive:0xffffff, emissiveMap:rvTex, emissiveIntensity:0.78, shininess:8, specular:0x000000 })); top.rotation.x = -Math.PI / 2; top.position.z = RVOFF; ECG.add(top);
  var body = new THREE.Mesh(new THREE.BoxGeometry(W2 + 0.012, ECTH, D2 + 0.012), new THREE.MeshPhongMaterial({ color:0x8A7114, shininess:30, specular:0x222222, flatShading:true })); body.position.set(0, -ECTH / 2 - 0.0015, RVOFF); ECG.add(body);
  top.userData.dev = body.userData.dev = 'ec';
})();
HOST = ECG; LX = rvx; LZ = rvz; DEV = 'ec';
var KBR = KB; KB = { host:ECG, x:function(px){ return rvx(px / 8); }, z:function(py){ return rvz(py / 8); }, px:SC / 8, faces:TRFACES };
[['size', 176.15, 357.25, 'Reverb size'], ['dec', 403.15, 357.25, 'Decay'], ['tone', 936.25, 357.25, 'Tone'], ['level', 1182.25, 357.25, 'Reverb level'],
 ['dens', 176.15, 663.25, 'Density'], ['mod', 403.15, 663.25, 'Modulation'], ['lpf', 936.25, 663.25, 'Reverb LPF'], ['hpf', 1182.25, 663.25, 'Reverb HPF']]
  .forEach(function(a){ var c = trKnob('rv' + a[0], a[1], a[2], 'fx', FXRED, FXPTR, a[3], RV.p[a[0]]); c.rk = a[0]; c.rv = true; c.def = { size:0.45, dec:0.7, dens:0.7, mod:0.35, tone:0.6, level:0.7, hpf:0, lpf:1 }[a[0]]; });
var rvB1 = spButton('rvmode', [570.4, 230.3, 205, 68], 'Reverb mode', { text:['HALL'], size:46 }); rvB1.rv = true; rvB1.rk = 'mode';
var rvB2 = spButton('rvon', [570.4, 328.5, 205, 68], 'Beeverb on / bypass', { text:['BYPASS'], size:46 }); rvB2.rv = true; rvB2.rk = 'on';
KB = KBR;
ledAt(RVLED, 'pk', 1155.5 / 8, 152.3 / 8, 0.0031, 0xFF2A3C);
HOST = TRG; LX = lx; LZ = lz; DEV = null;

var RVA = null;
function rvAudio(){
  if (RVA) return true; if (!ac || !AU.ready || !AU.sendB) return false;
  var A = RVA = {}, G = function(v){ var g = ac.createGain(); g.gain.value = v; return g; }, i, j;
  A.inp = G(1); A.hp = ac.createBiquadFilter(); A.hp.type = 'highpass'; A.hp.frequency.value = 130; A.hp.Q.value = 0.5; A.wet = G(0); A.an = ac.createAnalyser(); A.an.fftSize = 256; A.mrg = ac.createChannelMerger(2);
  A.ohp = ac.createBiquadFilter(); A.ohp.type = 'highpass'; A.ohp.Q.value = 0.707; A.olp = ac.createBiquadFilter(); A.olp.type = 'lowpass'; A.olp.Q.value = 0.707;      // the HPF and LPF knobs: on the wet sound, after the tank
  AU.sendB.connect(A.inp); A.inp.connect(A.hp); A.mrg.connect(A.ohp); A.ohp.connect(A.olp); A.olp.connect(A.wet); A.wet.connect(AU.comp); A.wet.connect(A.an);
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
  A.ohp.frequency.setTargetAtTime(mxHz('h', P.hpf), t, 0.03); A.olp.frequency.setTargetAtTime(mxHz('l', P.lpf), t, 0.03);
  A.wet.gain.setTargetAtTime(Math.pow(P.level, 1.5) * 1.5, t, 0.03); A.inp.gain.setTargetAtTime(P.on ? 1 : 0, t, 0.015);         // switching it off stops feeding it; the tail rings out
}
function rvLabel(c){
  if (c.id === 'rvmode') return 'Reverb mode: ' + RVMODES[RV.p.mode][0].toLowerCase() + ' · click'; if (c.id === 'rvon') return 'Beeverb ' + (RV.p.on ? 'on · click to bypass' : 'bypassed · click to turn on');
  if (c.rk === 'hpf' || c.rk === 'lpf'){ var hz = mxHz(c.rk === 'hpf' ? 'h' : 'l', c.v), off = c.rk === 'hpf' ? c.v < 0.01 : c.v > 0.99; return c.name + ' ' + (off ? 'off' : hz >= 1000 ? (hz / 1000).toFixed(1) + ' kHz' : Math.round(hz) + ' Hz') + ' · scroll or drag'; }
  return c.name + ' ' + Math.round(c.v * 100) + ' · scroll or drag';
}
function rvPress(c){
  if (c.id === 'rvmode'){ RV.p.mode = (RV.p.mode + 1) % 3; c.repaintFace(RVMODES[RV.p.mode][0]); toast('Reverb mode: ' + RVMODES[RV.p.mode][0].toLowerCase()); } else if (c.id === 'rvon'){ RV.p.on = RV.p.on ? 0 : 1; toast('Beeverb ' + (RV.p.on ? 'on' : 'bypassed')); } else return;
  rvAudio(); rvApply(); rvSaveSoon();
}
function rvCtl(c){ RV.p[c.rk] = c.v; rvAudio(); rvApply(); rvSaveSoon(); }
(function(){ var E = DEVH.ec; DEVH.ec = { label:function(c){ return c.rv ? rvLabel(c) : E.label(c); }, press:function(c){ return c.rv ? rvPress(c) : E.press(c); }, release:NOP, ctl:function(c){ return c.rv ? rvCtl(c) : E.ctl(c); }, turn:NOP }; })();
function rvUpdate(now, dt){
  if (!RVA) rvAudio();
  var pk = 0; if (RVA){ var buf = rvUpdate.buf || (rvUpdate.buf = new Float32Array(256)); RVA.an.getFloatTimeDomainData(buf); for (var k = 0; k < 256; k += 2){ var a = Math.abs(buf[k]); if (a > pk) pk = a; } }
  RV.lv = Math.max(pk, RV.lv - dt * 2.5); ledOn(RVLED.pk, clamp(RV.lv * 3, 0.06, 1));
  rvB2.setBg(RV.p.on ? '#FFFFFF' : '#FF2A3C');      /* BYPASS turns red while the reverb is bypassed */
  [rvB1, rvB2].forEach(function(c){ c.paintLit(); var ty = c.y0 - (c.down ? 0.003 : 0); if (c.m.position.y !== ty) c.m.position.y = ty; });
}
rvB1.repaintFace(RVMODES[RV.p.mode][0]);
RESTORE['jambutek-studio-reverb-v1'] = function(){ rvRestore(); CTLIST.forEach(function(c){ if (c.rv && c.kind === 'knob'){ c.v = RV.p[c.rk]; c.show(); } }); rvB1.repaintFace(RVMODES[RV.p.mode][0]); rvApply(); }; SAVENOW.push(rvSaveNow);
