
/* ================= the echo: a tape-style delay on the table between the drum machine and the mixer =================
   It is wired to the mixer's SEND A: whatever a channel sends there comes back through here, repeating, into the mix. */
var ECW = 170, ECD = 110, ECTH = 0.06;
function ecx(u){ return (u - ECW / 2) * SC; }
function ecz(u){ return (u - ECD / 2) * SC; }
var ECY = new THREE.Group(); ECY.position.set(ECPOS.x, MXH, ECPOS.z); ECY.rotation.y = ECPOS.r; scene.add(ECY);
var ECT = new THREE.Group(); ECT.rotation.x = MXTILT; ECY.add(ECT);
var ECG = new THREE.Group(); ECG.position.y = -(NTTH - ECTH); ECT.add(ECG);                  // a thinner box than its neighbours, so it sits lower on the same table
var EC = { p:{ time:0.42, rep:0.45, tone:0.55, level:0.7, sync:1, on:1 }, lv:0 };
var ECDIV = [['1/16', 0.25], ['1/8', 0.5], ['1/8 dot', 0.75], ['1/4', 1], ['1/4 dot', 1.5], ['1/2', 2]];
function ecRestore(){ try { var s = JSON.parse(store('jambutek-studio-echo-v1') || 'null'); if (s && s.v === 1 && s.p) Object.keys(EC.p).forEach(function(k){ if (typeof s.p[k] === 'number') EC.p[k] = clamp(s.p[k], 0, 1); }); } catch (e) {} } ecRestore();
var ecSaveT = null; function ecSaveNow(){ store('jambutek-studio-echo-v1', JSON.stringify({ v:1, p:EC.p })); } function ecSaveSoon(){ clearTimeout(ecSaveT); ecSaveT = setTimeout(ecSaveNow, saveMs(800)); }
var ecC = mk(ECW * 6, ECD * 6), ecTex = null;
function paintEC(){
  var g = ecC.getContext('2d'); g.setTransform(6, 0, 0, 6, 0, 0);
  g.fillStyle = '#20382F'; g.fillRect(0, 0, ECW, ECD);
  for (var i = 0; i < 900; i++){ g.fillStyle = 'rgba(' + (Math.random() < .5 ? '0,0,0' : '170,200,180') + ',' + rnd(.02, .06) + ')'; g.fillRect(Math.random() * ECW, Math.random() * ECD, .5, .3); }
  function T(s, x, y, size, col, anton, al){ g.font = anton ? size + 'px ' + FONT : 'bold ' + size + 'px "Helvetica Neue", Helvetica, Arial, sans-serif'; g.fillStyle = col || '#EDE6CF'; g.textAlign = al || 'center'; g.textBaseline = 'middle'; g.fillText(s, x, y); }
  g.strokeStyle = '#EDE6CF'; g.lineWidth = 0.6; g.strokeRect(4, 4, ECW - 8, ECD - 8);
  T('ECHO', 10, 15, 11, '#EDE6CF', true, 'left'); T('SEND A', ECW - 10, 15, 5, '#F2B544', false, 'right');
  g.fillStyle = '#EDE6CF'; g.fillRect(10, 24, ECW - 20, 0.6);
  [['TIME', 30], ['REPEAT', 67], ['TONE', 104], ['LEVEL', 141]].forEach(function(a){
    T(a[0], a[1], 69, 4.6); g.strokeStyle = 'rgba(237,230,207,.7)'; g.lineWidth = 0.4;
    for (var k = 0; k <= 10; k++){ var an = (-135 + k * 27) * Math.PI / 180, r0 = 11.2, r1 = k % 5 ? 12.6 : 13.6; g.beginPath(); g.moveTo(a[1] + Math.sin(an) * r0, 48 - Math.cos(an) * r0); g.lineTo(a[1] + Math.sin(an) * r1, 48 - Math.cos(an) * r1); g.stroke(); }
  });
  T('TEMPO SYNC', 30, 99.5, 3.6); T('PEAK', 85, 99.5, 3.6); T('ON', 141, 99.5, 3.6);
  g.setTransform(1, 0, 0, 1, 0, 0); if (ecTex) ecTex.needsUpdate = true;
}
paintEC(); ecTex = smoothTex(ecC);
if (document.fonts && document.fonts.load) document.fonts.load('20px Anton').then(paintEC).catch(function(){});
var ECLED = {};
(function(){
  var W2 = ECW * SC, D2 = ECD * SC;
  var top = new THREE.Mesh(new THREE.PlaneGeometry(W2, D2), new THREE.MeshPhongMaterial({ color:0x8C8C8C, map:ecTex, emissive:0xffffff, emissiveMap:ecTex, emissiveIntensity:0.5, shininess:8, specular:0x0A0A0A })); top.rotation.x = -Math.PI / 2; ECG.add(top);
  var body = new THREE.Mesh(new THREE.BoxGeometry(W2 + 0.012, ECTH, D2 + 0.012), new THREE.MeshPhongMaterial({ color:0x15241E, shininess:30, specular:0x222222, flatShading:true })); body.position.y = -ECTH / 2 - 0.0015; ECG.add(body);
  devBody(ECY, 'ec');
})();
HOST = ECG; LX = ecx; LZ = ecz; DEV = 'ec';
knob('ectime', 30, 48, 8.2, 'Echo time', EC.p.time, { h:11, sides:16, color:0x0E0F11 }).pk = 'time';
knob('ecrep', 67, 48, 8.2, 'Repeats', EC.p.rep, { h:11, sides:16, color:0x0E0F11 }).pk = 'rep';
knob('ectone', 104, 48, 8.2, 'Tone', EC.p.tone, { h:11, sides:16, color:0x0E0F11 }).pk = 'tone';
knob('eclevel', 141, 48, 8.2, 'Echo level', EC.p.level, { h:11, sides:16, color:0x0E0F11 }).pk = 'level';
button('ecsync', 30, 87, 20, 10, 'SYNC', 'Tempo sync', 0xF2B544).pk = 'sync';
button('econ', 141, 87, 20, 10, 'ON', 'Echo on / off', 0x3BFF6A).pk = 'on';
ledAt(ECLED, 'pk', 85, 87, 0.0034, 0xFF2A3C);
CTLIST.forEach(function(c){ if (c.dev === 'ec' && c.kind === 'knob') c.def = { time:0.42, rep:0.45, tone:0.55, level:0.7 }[c.pk]; });
HOST = TRG; LX = lx; LZ = lz; DEV = null;

var ECA = null;
function ecAudio(){
  if (ECA) return true; if (!ac || !AU.ready || !AU.sendA) return false;
  var A = ECA = {}, G = function(v){ var g = ac.createGain(); g.gain.value = v; return g; };
  A.inp = G(1); A.dl = ac.createDelay(2.5); A.lp = ac.createBiquadFilter(); A.lp.type = 'lowpass'; A.lp.Q.value = 0.5; A.hp = ac.createBiquadFilter(); A.hp.type = 'highpass'; A.hp.frequency.value = 140; A.hp.Q.value = 0.5;
  A.fb = G(0); A.sat = ac.createWaveShaper(); var cv = new Float32Array(257); for (var i = 0; i < 257; i++){ var x = i / 128 - 1; cv[i] = Math.tanh(x * 1.6) / 1.6; } A.sat.curve = cv;   // the loop saturates like tape, so long repeats never run away
  A.wet = G(0); A.an = ac.createAnalyser(); A.an.fftSize = 256;
  A.wow = ac.createOscillator(); A.wow.frequency.value = 0.37; A.wowG = G(0.0012); A.wow.connect(A.wowG); A.wowG.connect(A.dl.delayTime); A.wow.start();
  AU.sendA.connect(A.inp); A.inp.connect(A.dl); A.dl.connect(A.lp); A.lp.connect(A.hp); A.hp.connect(A.sat); A.sat.connect(A.wet); A.wet.connect(AU.comp); A.wet.connect(A.an);
  A.sat.connect(A.fb); A.fb.connect(A.dl);
  ecApply(true); return true;
}
function ecDiv(){ return ECDIV[Math.min(ECDIV.length - 1, Math.floor(EC.p.time * ECDIV.length))]; }
function ecSecs(){ return EC.p.sync ? Math.min(2.4, ecDiv()[1] * 60 / M.bpm) : 0.03 + EC.p.time * EC.p.time * 1.4; }
function ecApply(jump){
  if (!ECA) return; var t = ac.currentTime, A = ECA;
  A.dl.delayTime.setTargetAtTime(ecSecs(), t, jump ? 0.001 : 0.08); EC.bpm = M.bpm;                 // a slow glide, so turning TIME bends the pitch of the repeats like a tape machine
  A.fb.gain.setTargetAtTime(EC.p.rep * 0.96, t, 0.03); A.lp.frequency.setTargetAtTime(450 * Math.pow(2, EC.p.tone * 4.7), t, 0.03);
  A.wet.gain.setTargetAtTime(Math.pow(EC.p.level, 1.5) * 2.2, t, 0.03); A.inp.gain.setTargetAtTime(EC.p.on ? 1 : 0, t, 0.015);   // switching it off stops feeding it; the tail rings out
}
function ecLabel(c){
  if (c.id === 'ecsync') return 'Tempo sync: ' + (EC.p.sync ? 'on' : 'off') + ' · click';
  if (c.id === 'econ') return 'Echo ' + (EC.p.on ? 'on' : 'off') + ' · click';
  if (c.id === 'ectime') return 'Echo time ' + (EC.p.sync ? ecDiv()[0] : Math.round(ecSecs() * 1000) + ' ms') + ' · scroll or drag';
  return c.name + ' ' + Math.round(c.v * 100) + ' · scroll or drag';
}
function ecPress(c){ if (c.kind !== 'btn') return; EC.p[c.pk] = EC.p[c.pk] ? 0 : 1; ecAudio(); ecApply(); ecSaveSoon(); toast(c.id === 'econ' ? 'Echo ' + (EC.p.on ? 'on' : 'off') : 'Echo tempo sync ' + (EC.p.sync ? 'on' : 'off')); }
function ecCtl(c){ EC.p[c.pk] = c.v; ecAudio(); ecApply(); ecSaveSoon(); }
DEVH.ec = { label:ecLabel, press:ecPress, release:NOP, ctl:ecCtl, turn:NOP };
function ecUpdate(now, dt){
  if (!ECA) ecAudio(); else if (EC.bpm !== M.bpm && EC.p.sync) ecApply();
  var pk = 0; if (ECA){ var buf = ecUpdate.buf || (ecUpdate.buf = new Float32Array(256)); ECA.an.getFloatTimeDomainData(buf); for (var k = 0; k < 256; k += 2){ var a = Math.abs(buf[k]); if (a > pk) pk = a; } }
  EC.lv = Math.max(pk, EC.lv - dt * 2.5); ledOn(ECLED.pk, clamp(EC.lv * 3, 0.06, 1));
  ['ecsync', 'econ'].forEach(function(id){ var c = CT[id], L = EC.p[c.pk] ? 1 : 0.12; if (c.down) L = Math.max(L, 0.8); if (L !== c.lit){ c.lit = L; c.paintLit(); } var ty = c.y0 - (c.down ? 0.003 : 0); if (c.m.position.y !== ty) c.m.position.y = ty; });
}
RESTORE['jambutek-studio-echo-v1'] = function(){ ecRestore(); CTLIST.forEach(function(c){ if (c.dev === 'ec' && c.kind === 'knob'){ c.v = EC.p[c.pk]; c.show(); } }); ecApply(); }; SAVENOW.push(ecSaveNow);
