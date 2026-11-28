
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
/* the ECHO JELLY plate: the designer's artwork, 1360 x 880 px (8 px per mm), with its controls cut out (tools/make_fx.py) */
var ecC = mk(1360, 880), ecTex = null, ecImg = new Image();
function paintEC(){ var g = ecC.getContext('2d'); if (ecImg.ok) g.drawImage(ecImg, 0, 0); else { g.fillStyle = '#35C46B'; g.fillRect(0, 0, 1360, 880); } if (ecTex) ecTex.needsUpdate = true; }
ecImg.onload = function(){ ecImg.ok = true; paintEC(); }; ecImg.src = 'tr/echo-jelly.jpg';
paintEC(); ecTex = smoothTex(ecC);
var FXRED = '#FA4442', FXPTR = '#151518';
var ECLED = {};
(function(){
  var W2 = ECW * SC, D2 = ECD * SC;
  var top = new THREE.Mesh(new THREE.PlaneGeometry(W2, D2), new THREE.MeshPhongMaterial({ color:0x404040, map:ecTex, emissive:0xffffff, emissiveMap:ecTex, emissiveIntensity:0.78, shininess:8, specular:0x000000 })); top.rotation.x = -Math.PI / 2; ECG.add(top);
  var body = new THREE.Mesh(new THREE.BoxGeometry(W2 + 0.012, ECTH, D2 + 0.012), new THREE.MeshPhongMaterial({ color:0x1E7A43, shininess:30, specular:0x222222, flatShading:true })); body.position.y = -ECTH / 2 - 0.0015; ECG.add(body);
  devBody(ECY, 'ec');
})();
HOST = ECG; LX = ecx; LZ = ecz; DEV = 'ec';
var KBE = KB; KB = { host:ECG, x:function(px){ return ecx(px / 8); }, z:function(py){ return ecz(py / 8); }, px:SC / 8, faces:TRFACES };
trKnob('ectime', 200.25, 357.25, 'fx', FXRED, FXPTR, 'Echo time', EC.p.time).pk = 'time';
trKnob('ecrep', 200.25, 663.25, 'fx', FXRED, FXPTR, 'Repeats', EC.p.rep).pk = 'rep';
trKnob('ectone', 1174.25, 357.25, 'fx', FXRED, FXPTR, 'Tone', EC.p.tone).pk = 'tone';
trKnob('eclevel', 1174.25, 663.25, 'fx', FXRED, FXPTR, 'Echo level', EC.p.level).pk = 'level';
spButton('ecsync', [462.5, 736.5, 205, 68], 'Tempo sync', { text:['SYNC ON'], size:46 }).pk = 'sync';
spButton('econ', [718.5, 736.5, 205, 68], 'Echo on / bypass', { text:['BYPASS'], size:46 }).pk = 'on';
KB = KBE;
ledAt(ECLED, 'pk', 1155.5 / 8, 152.3 / 8, 0.0031, 0xFF2A3C);
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
  if (c.id === 'econ') return 'Echo Jelly ' + (EC.p.on ? 'on · click to bypass' : 'bypassed · click to turn on');
  if (c.id === 'ectime') return 'Echo time ' + (EC.p.sync ? ecDiv()[0] : Math.round(ecSecs() * 1000) + ' ms') + ' · scroll or drag';
  return c.name + ' ' + Math.round(c.v * 100) + ' · scroll or drag';
}
function ecPress(c){ if (c.kind !== 'btn') return; EC.p[c.pk] = EC.p[c.pk] ? 0 : 1; ecAudio(); ecApply(); ecSaveSoon(); toast(c.id === 'econ' ? 'Echo Jelly ' + (EC.p.on ? 'on' : 'bypassed') : 'Echo tempo sync ' + (EC.p.sync ? 'on' : 'off')); }
function ecCtl(c){ EC.p[c.pk] = c.v; ecAudio(); ecApply(); ecSaveSoon(); }
DEVH.ec = { label:ecLabel, press:ecPress, release:NOP, ctl:ecCtl, turn:NOP };
function ecUpdate(now, dt){
  if (!ECA) ecAudio(); else if (EC.bpm !== M.bpm && EC.p.sync) ecApply();
  var pk = 0; if (ECA){ var buf = ecUpdate.buf || (ecUpdate.buf = new Float32Array(256)); ECA.an.getFloatTimeDomainData(buf); for (var k = 0; k < 256; k += 2){ var a = Math.abs(buf[k]); if (a > pk) pk = a; } }
  EC.lv = Math.max(pk, EC.lv - dt * 2.5); ledOn(ECLED.pk, clamp(EC.lv * 3, 0.06, 1));
  ['ecsync', 'econ'].forEach(function(id){ var c = CT[id], on = !!EC.p[c.pk];      /* SYNC lights green when on; BYPASS turns red when the echo is bypassed */
    if (id === 'ecsync'){ c.repaintFace(on ? 'SYNC ON' : 'SYNC OFF'); c.setBg(on ? '#3BFF6A' : '#FFFFFF'); } else c.setBg(on ? '#FFFFFF' : '#FF2A3C');
    c.paintLit(); var ty = c.y0 - (c.down ? 0.003 : 0); if (c.m.position.y !== ty) c.m.position.y = ty; });
}
RESTORE['jambutek-studio-echo-v1'] = function(){ ecRestore(); CTLIST.forEach(function(c){ if (c.dev === 'ec' && c.kind === 'knob' && !c.rv){ c.v = EC.p[c.pk]; c.show(); } }); ecApply(); }; SAVENOW.push(ecSaveNow);
