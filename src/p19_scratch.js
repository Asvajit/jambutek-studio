
/* ================= the scratch box at the back, after the SC1000 =================
   A pocket turntable with no record: a touch platter that scrubs a short sample forwards and backwards, a crossfader to
   cut it in and out, and four corner buttons (previous / next sample, play, cue). The sample is played by a small
   variable-speed reader, so dragging the platter really does drag the sound. Samples are made in code.
   The idea and the arrangement follow rasteri's open-source SC1000; the model and the sound engine here are original. */
var SCW = 170, SCD = 196, SCH = 1.1, SCTILT = 0.56;
function skx(u){ return (u - SCW / 2) * SC; }
function skz(u){ return (u - SCD / 2) * SC; }
var SCY = new THREE.Group(); SCY.position.set(SCPOS.x, SCH, SCPOS.z); SCY.rotation.y = SCPOS.r; scene.add(SCY);
var SCG = new THREE.Group(); SCG.rotation.x = SCTILT; SCY.add(SCG);
var SCN = ['Ahh', 'Fresh', 'Stab', 'Zap'];
var SK = { sample:0, xf:1, motor:0, pos:0, rate:0, rateT:1, touch:false, acc:0, push:0, cut:false, ang:0, g:0, bufs:null, rmtUntil:0, sentAt:0, quiet:0 };
function skRestore(){ try { var s = JSON.parse(store('jambutek-studio-scratch-v1') || 'null'); if (!s || s.v !== 1) return; SK.sample = clamp(s.sample | 0, 0, 3); SK.xf = clamp(+s.xf, 0, 1); if (isNaN(SK.xf)) SK.xf = 1; SK.motor = s.motor ? 1 : 0; } catch (e) {} }
skRestore();
var skSaveT = null; function skSaveNow(){ store('jambutek-studio-scratch-v1', JSON.stringify({ v:1, sample:SK.sample, xf:+SK.xf.toFixed(3), motor:SK.motor })); } function skSaveSoon(){ clearTimeout(skSaveT); skSaveT = setTimeout(skSaveNow, saveMs(900)); }
var SKLED = {};
(function(){
  var W2 = SCW * SC, D2 = SCD * SC, TH = 0.075;
  var teal = new THREE.MeshPhongMaterial({ color:0x35D8B8, emissive:0x0A3A30, shininess:60, specular:0x447766, transparent:true, opacity:0.9 });
  var body = new THREE.Mesh(new THREE.BoxGeometry(W2, TH, D2), teal); body.position.y = -TH / 2 - 0.0015; SCG.add(body);
  var deck = new THREE.Mesh(new THREE.PlaneGeometry(W2 - 0.024, D2 - 0.024), new THREE.MeshPhongMaterial({ color:0x0C0D0F, shininess:20, specular:0x111111 })); deck.rotation.x = -Math.PI / 2; deck.position.y = 0.0002; SCG.add(deck);
  [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(function(p){ var sc = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.004, 8), new THREE.MeshLambertMaterial({ color:0x050506 })); sc.position.set(p[0] * (W2 / 2 - 0.008), 0.001, p[1] * (D2 / 2 - 0.008)); SCG.add(sc); });
  [[-0.03, 0.02, 0.012], [0.01, 0.014, 0.014], [0.04, 0.014, 0.014], [0.07, 0.014, 0.014]].forEach(function(j){ var m = new THREE.Mesh(new THREE.BoxGeometry(j[1], j[2], 0.012), new THREE.MeshLambertMaterial({ color:0x0A0A0B })); m.position.set(j[0], -0.03, D2 / 2 + 0.004); SCG.add(m); });   // the sockets along the front edge
  standFor(SCY, SCG, W2, D2, TH, SCH, SCTILT, 0.13); devBody(SCY, 'sc'); BLOCKS.push(devBlock(SCPOS, 0.36));
})();
HOST = SCG; LX = skx; LZ = skz; DEV = 'sc';
var skPlat = knob('skplat', 88, 114, 70, 'Platter', 0, { h:3.2, endless:true, sides:48, color:0x08090A });
(function(c){
  c.g.children[0].visible = false; var kids = c.rot.children; kids[1].scale.x = 0.1; kids[1].scale.z = 1.18; kids[1].position.z = -70 * SC * 0.5; kids[2].visible = false;
  var hitM = c.g.children[c.g.children.length - 1]; hitM.scale.set(0.69, 1, 0.69);
  var hub = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.002, 16), new THREE.MeshLambertMaterial({ color:0x8A8C92 })); hub.position.y = 3.2 * SC + 0.0045; c.rot.add(hub);
  c.show = function(){ c.rot.rotation.y = -SK.ang; };
  c.hover = function(on){ c.mat.emissive.setHex(on ? 0x0C2420 : 0x000000); };
  c.grab = function(on){ unlock(); skAudio(); SK.touch = on; SK.acc = 0; if (on) SK.rmtUntil = 0; };
  c.scrub = function(d){ SK.acc += d; };
  c.wheel = function(c2, dy){ unlock(); skAudio(); SK.push = clamp(SK.push - dy / 45, -5, 5); return true; };
})(skPlat);
(function(){ var slot = new THREE.Mesh(new THREE.PlaneGeometry(84 * SC, 11 * SC), new THREE.MeshLambertMaterial({ color:0x2C2E33 })); slot.rotation.x = -Math.PI / 2; slot.position.set(skx(62), 0.0006, skz(17)); SCG.add(slot);
  var xg = new THREE.Group(); xg.position.set(skx(62), 0, skz(17)); xg.rotation.y = -Math.PI / 2; SCG.add(xg); HOST = xg; LX = function(u){ return u * SC; }; LZ = function(u){ return u * SC; };
  var f = vfader('skxf', 0, -34, 34, 'Crossfader', SK.xf, { stripe:0xE8E4D8 }); f.xf = true; HOST = SCG; LX = skx; LZ = skz; })();
FACE = { bg:'#2FCDAE', fg:'#06302A' };
[['skprev', 17, 46, '◀', 'Previous sample'], ['sknext', 153, 30, '▶', 'Next sample'], ['skplay', 17, 182, '▶ ■', 'Play / stop the platter'], ['skcue', 153, 182, 'CUE', 'Back to the start of the sample']].forEach(function(a){ button(a[0], a[1], a[2], 16, 16, a[3], a[4], 0xB8FFF0).mat.color.setHex(0x9A9A9A); });
for (var ski = 0; ski < 4; ski++) ledAt(SKLED, 's' + ski, 124 + ski * 7, 14, 0.0022, 0x7CFFE0);
HOST = TRG; LX = lx; LZ = lz; DEV = null; FACE = { bg:'#C9C7C0', fg:'#0B0B0D' };

var SKA = null;
/* a Snake can play it: every step is one scratch stroke. The note sets how fast the record is pushed, strokes alternate forwards and
   backwards like a baby scratch, and the gate is how long the stroke lasts. Between strokes the platter does whatever it was doing. */
var SKQ = [];
function skSeqAt(n, vel, t, dur){ if (!skAudio()) return; var e = [t, Math.pow(2, (n - 60) / 12) * (0.6 + vel * 0.6), Math.max(0.03, dur)]; if (SKA.wk){ SKA.wk.port.postMessage({ ev:e }); return; } SKQ.push(e); if (SKQ.length > 64) SKQ.shift(); }
function skSeek(v){ SK.pos = v; SK.seekAt = performance.now(); if (SKA && SKA.wk) SKA.wk.port.postMessage({ pos:v }); }
function skMake(kind, sr){
  var n = Math.floor(sr * (kind === 2 ? 1.1 : 1.5)), d = new Float32Array(n), i, t, ph = 0, ph2 = 0, s1 = 0, s2 = 0, s3 = 0;
  function reson(x, f, q, st){ var w = 2 * Math.PI * f / sr, r = 1 - w / (2 * q); st.a = 2 * r * Math.cos(w) * st.a - r * r * st.b + x * (1 - r); var y = st.a; var tmp = st.b; st.b = st._p || 0; st._p = y; return y; }
  var F = [{ a:0, b:0 }, { a:0, b:0 }, { a:0, b:0 }], lp = 0;
  for (i = 0; i < n; i++){
    t = i / sr; var x = 0, env;
    if (kind === 0 || kind === 1){                                   // a sung vowel: a buzzing source through three resonances
      var f0 = kind === 0 ? 150 - t * 22 : 190 - t * 40, voiced = kind === 0 ? 1 : (t > 0.16 && t < 0.62 ? 1 : 0), fr = kind === 0 ? [760, 1180, 2600] : [520, 1750, 2500];
      ph += f0 / sr; ph -= Math.floor(ph); var src = (ph < 0.12 ? 1 : -0.14) * voiced + (Math.random() * 2 - 1) * (kind === 1 ? (t < 0.2 ? 0.5 : t > 0.58 ? 0.9 : 0.05) : 0.03);
      var a = 0; for (var k = 0; k < 3; k++){ var st = F[k], w = 2 * Math.PI * fr[k] / sr, r = 0.985 - k * 0.004; var y = 2 * r * Math.cos(w) * st.a - r * r * st.b + src * (1 - r) * 6; st.b = st.a; st.a = y; a += y * [1, 0.7, 0.35][k]; }
      if (kind === 1 && t > 0.58){ lp += (src - lp) * 0.55; a = a * 0.25 + (src - lp) * 1.6; }               // the hissy tail
      env = Math.min(1, t / 0.02) * (kind === 0 ? Math.exp(-Math.max(0, t - 0.9) * 5) : Math.exp(-Math.max(0, t - 1.0) * 7)); x = a * 0.5 * env;
    } else if (kind === 2){                                            // a chord stab
      env = Math.min(1, t / 0.004) * Math.exp(-t * 4.2); [146.8, 220.2, 261.9, 349.6].forEach(function(f, q){ var p = (t * f * (1 + q * 0.002)) % 1; x += (p * 2 - 1) * 0.2; }); lp += (x - lp) * (0.08 + 0.6 * Math.exp(-t * 6)); x = lp * 1.6 * env;
    } else {                                                           // a falling zap
      var fz = 2400 * Math.exp(-t * 5) + 90; ph2 += fz / sr; env = Math.min(1, t / 0.003) * Math.exp(-t * 2.4); x = Math.sin(ph2 * 2 * Math.PI) * 0.6 * env + (Math.random() * 2 - 1) * 0.1 * Math.exp(-t * 14);
    }
    d[i] = x;
  }
  var pk = 0; for (i = 0; i < n; i++){ var ab = Math.abs(d[i]); if (ab > pk) pk = ab; } if (pk > 0){ var nm = 0.85 / pk; for (i = 0; i < n; i++) d[i] *= nm; }      // bring it to a safe level. It used to be chopped off at full scale, and the two voice samples were far over it, which is the distortion people heard
  for (i = 0; i < 300; i++){ var fd = i / 300; d[n - 1 - i] *= fd; }
  return d;
}
function skAudio(){
  if (SKA) return true; if (!ac || !AU.ready) return false;
  var A = SKA = {}; SK.bufs = [0, 1, 2, 3].map(function(k){ return skMake(k, ac.sampleRate); });
  A.out = ac.createGain(); A.out.gain.value = 0.6; A.out.connect(AU.ch[8].inp);
  // The record is read by code, not by a built-in node, because it has to run at any speed, backwards too. That code runs on the
  // audio thread (an AudioWorklet), so nothing the page is busy with (drawing the room, the video synths) can make it crackle or
  // drop out. Only if the browser has no worklets does it fall back to the old way, on the page's own thread.
  var fallback = function(){ if (A.wk || A.node) return; skOnPage(A); A.node.connect(A.out); };
  if (ac.audioWorklet && window.AudioWorkletNode){
    try {
      var url = URL.createObjectURL(new Blob([SKWORK], { type:'application/javascript' }));
      ac.audioWorklet.addModule(url).then(function(){
        var w = new AudioWorkletNode(ac, 'jb-scratch', { numberOfInputs:0, numberOfOutputs:1, outputChannelCount:[1] });
        w.port.postMessage({ b:SK.bufs, pos:SK.pos }); w.port.onmessage = function(e){ if (performance.now() - (SK.seekAt || 0) > 90) SK.pos = e.data[0]; SK.rate = e.data[1]; };
        w.onprocessorerror = function(){ try { w.disconnect(); } catch (x) {} A.wk = null; fallback(); };
        w.connect(A.out); A.wk = w;
      }).catch(fallback);
    } catch (e) { fallback(); }
  } else fallback();
  return true;
}
var SKWORK = "class SkP extends AudioWorkletProcessor{constructor(){super();this.b=[];this.s=0;this.p=0;this.r=0;this.g=0;this.rt=0;this.gt=1;this.go=1;this.k=0.0025;this.touch=0;this.motor=0;this.q=[];this.dir=-1;this.sqEnd=0;this.sqRate=0;this.c=0;" +
  "this.port.onmessage=e=>{const m=e.data;if(m.b)this.b=m.b;if(m.st){const s=m.st;this.s=s[0];this.rt=s[1];this.gt=s[2];this.k=s[3];this.touch=s[4];this.motor=s[5];this.go=s[6];}if(m.pos!=null)this.p=m.pos;if(m.ev){this.q.push(m.ev);if(this.q.length>64)this.q.shift();}};}" +
  "process(i,o){const out=o[0][0],b=this.b[this.s];if(!b)return true;const n=b.length;let p=this.p,r=this.r,g=this.g,rt=this.rt,gt=this.gt,k=this.k;if(!(p>=0&&p<n))p=0;const tb=currentTime+0.004;" +
  "while(this.q.length&&this.q[0][0]<=tb){const q=this.q.shift();this.dir=-this.dir;this.sqRate=q[1]*this.dir;this.sqEnd=q[0]+q[2];}" +
  "if(this.sqEnd&&!this.touch){if(tb<this.sqEnd){rt=this.sqRate;k=0.02;gt=this.go;}else if(tb<this.sqEnd+0.25&&!this.motor){rt=0;k=0.02;}}" +
  "for(let j=0;j<out.length;j++){r+=(rt-r)*k;g+=(gt-g)*0.02;p+=r;if(p>=n)p-=n;else if(p<0)p+=n;const i0=p|0,i1=i0+1<n?i0+1:0,f=p-i0;out[j]=(b[i0]+(b[i1]-b[i0])*f)*g;}" +
  "if(!(r>-64&&r<64))r=0;this.p=p;this.r=r;this.g=g;if(++this.c>=6){this.c=0;this.port.postMessage([p,r]);}return true;}}registerProcessor('jb-scratch',SkP);";
function skOnPage(A){
  A.node = ac.createScriptProcessor(512, 1, 1);
  A.node.onaudioprocess = function(ev){
    var o = ev.outputBuffer.getChannelData(0), b = SK.bufs[SK.sample], n = b.length, p = SK.pos, r = SK.rate, rt = SK.rateT, g = SK.g, gt = SK.cut ? 0 : Math.min(1, SK.xf * 5), k = SK.touch || SK.push ? 0.012 : 0.0025;
    var tb = (ev.playbackTime || ac.currentTime) + 0.012; while (SKQ.length && SKQ[0][0] <= tb){ var q = SKQ.shift(); SK.sqDir = SK.sqDir === 1 ? -1 : 1; SK.sqRate = q[1] * SK.sqDir; SK.sqEnd = q[0] + q[2]; }
    if (SK.sqEnd && tb < SK.sqEnd && !SK.touch){ rt = SK.sqRate; k = 0.02; gt = Math.min(1, SK.xf * 5); } else if (SK.sqEnd && tb < SK.sqEnd + 0.25 && !SK.touch && !SK.motor){ rt = 0; k = 0.02; }
    for (var i = 0; i < o.length; i++){
      r += (rt - r) * k; g += (gt - g) * 0.02; p += r; if (p >= n) p -= n; else if (p < 0) p += n;
      var i0 = p | 0, i1 = i0 + 1 < n ? i0 + 1 : 0, f = p - i0; o[i] = (b[i0] + (b[i1] - b[i0]) * f) * g;
    }
    SK.pos = p; SK.rate = r; SK.g = g; SK.quiet = Math.abs(r) < 0.002 ? SK.quiet + 1 : 0;
  };
  var sil = ac.createGain(); sil.gain.value = 0; var cs = ac.createConstantSource ? ac.createConstantSource() : null; if (cs){ cs.connect(sil); sil.connect(A.node); cs.start(); }
}

function skLabel(c){
  if (c.id === 'skplat') return 'Platter · hold and drag up or down to scratch, or scroll · X cuts';
  if (c.xf) return 'Crossfader ' + Math.round(SK.xf * 100) + ' · scroll or drag';
  if (c.id === 'skplay') return 'Platter ' + (SK.motor ? 'running' : 'stopped') + ' · click';
  if (c.id === 'skprev' || c.id === 'sknext') return 'Sample ' + (SK.sample + 1) + ' · ' + SCN[SK.sample] + ' · click';
  return c.name + ' · click';
}
function skPress(c){
  unlock(); skAudio(); c.down = 1; setTimeout(function(){ c.down = 0; }, 130);
  if (c.id === 'skplay') SK.motor = SK.motor ? 0 : 1;
  else if (c.id === 'skcue'){ skSeek(0); return; }
  else { SK.sample = (SK.sample + (c.id === 'sknext' ? 1 : 3)) % 4; skSeek(0); toast('Sample ' + (SK.sample + 1) + ' · ' + SCN[SK.sample]); }
  skSaveSoon();
}
function skCtl(c){ if (!c.xf) return; SK.xf = c.v; skSaveSoon(); }
DEVH.sc = { label:skLabel, press:skPress, release:NOP, ctl:skCtl, turn:NOP };
function skKbDown(k){ if (k === 'x'){ SK.cut = true; return true; } if (k === 'c'){ skSeek(0); return true; } return false; }
function skKbUp(k){ if (k === 'x') SK.cut = false; }
RESTORE['jambutek-studio-scratch-v1'] = function(){ var was = SK.sample; skRestore(); if (was !== SK.sample) skSeek(0); CT.skxf.v = SK.xf; CT.skxf.show(); }; SAVENOW.push(skSaveNow);
function skRemote(a){ if (SK.touch || !Array.isArray(a)) return; unlock(); if (!skAudio()) return; SK.rmtUntil = performance.now() + 260; SK.rateT = clamp(+a[0] || 0, -8, 8); var n = SK.bufs[SK.sample].length, p = clamp(+a[1] || 0, 0, 1) * n, dd = Math.abs(p - SK.pos); if (Math.min(dd, n - dd) > n * 0.06) skSeek(p); SK.cut = !!a[2]; }
function skUpdate(now, dt){
  if (now > SK.rmtUntil){
    if (SK.touch){ SK.rateT = clamp(SK.acc / Math.max(dt, 0.008) / 170, -8, 8); SK.acc = 0; }
    else { SK.rateT = (SK.motor ? 1 : 0) + SK.push; }
    SK.push = Math.abs(SK.push) < 0.02 ? 0 : SK.push * Math.exp(-dt * 9);
    if (MPON && MPNET.scratch && (SK.touch || SK.push || now - SK.sentAt < 320) && now - (SK.lastSend || 0) > 60){ SK.lastSend = now; if (SK.touch || SK.push) SK.sentAt = now; MPNET.scratch([+SK.rateT.toFixed(3), SK.bufs ? +(SK.pos / SK.bufs[SK.sample].length).toFixed(4) : 0, SK.cut ? 1 : 0]); }
  }
  SK.ang += (SKA ? SK.rate : SK.rateT * 0) * dt * 3.49; skPlat.show();                       // 33 1/3 turns a minute at normal speed
  for (var i = 0; i < 4; i++) ledOn(SKLED['s' + i], i === SK.sample ? 1 : 0.07);
  ['skprev', 'sknext', 'skplay', 'skcue'].forEach(function(id){ var c = CT[id], L = id === 'skplay' ? (SK.motor ? 0.85 : 0.05) : (c.down ? 1 : 0.12); if (L !== c.lit){ c.lit = L; c.paintLit(); } var ty = c.y0 - (c.down ? 0.003 : 0); if (c.m.position.y !== ty) c.m.position.y = ty; });
  if (SKA && SKA.wk) SKA.wk.port.postMessage({ st:[SK.sample, SK.rateT, SK.cut ? 0 : Math.min(1, SK.xf * 5), SK.touch || SK.push ? 0.012 : 0.0025, SK.touch ? 1 : 0, SK.motor ? 1 : 0, Math.min(1, SK.xf * 5)] });
}
