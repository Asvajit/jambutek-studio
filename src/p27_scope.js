
/* ================= a little oscilloscope on the back of every Snake =================
   Each Snake carries a small screen facing away from its player, into the room. It shows the sound of the instrument that Snake is
   wired to, taken after that instrument's mixer channel, in the channel's colour, so anyone across the room can see what is playing.
   The look (graticule, one bright trace, rising-edge trigger) is after bench scopes such as ScopeFun; none of its code is used. */
var SCOPE = { list:[], an:{}, buf:null, next:0, W:192, H:112 };
var SCOPECH = { mf:1, bs:2, mb:3, am:4, tp:5, sh:6, mc:7, sc:8, zk:9 };
(function(){
  SNAKES.forEach(function(S){
    var Y = S.G.parent, g = new THREE.Group(); g.position.set(0, 0.045, -0.215); g.rotation.y = Math.PI; Y.add(g);
    var c = mk(SCOPE.W, SCOPE.H), t = new THREE.CanvasTexture(c); t.minFilter = t.magFilter = THREE.LinearFilter; t.generateMipmaps = false;
    var bez = new THREE.Mesh(new THREE.BoxGeometry(0.33, 0.2, 0.03), new THREE.MeshLambertMaterial({ color:0x121317 })); bez.position.z = -0.016; g.add(bez);
    var scr = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.175), new THREE.MeshBasicMaterial({ map:t })); scr.position.z = 0.0005; g.add(scr);
    var arm = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.03, 0.1), metalMat); arm.position.set(0, -0.04, -0.075); g.add(arm);          // the bracket back to the Snake's underside
    g.traverse(function(o){ o.userData.noShadow = true; });
    // the same picture on the Snake's own panel, above its INST slider, for whoever is playing it
    var fr = new THREE.Mesh(new THREE.PlaneGeometry(64 * SC, 33 * SC), new THREE.MeshBasicMaterial({ color:0x08090C })), own = new THREE.Mesh(new THREE.PlaneGeometry(60 * SC, 29 * SC), scr.material);
    [fr, own].forEach(function(m, k){ m.rotation.x = -Math.PI / 2; m.position.set((41 - SNW / 2) * SC, 0.0012 + k * 0.0008, (152.5 - SND / 2) * SC); m.userData.noShadow = true; S.G.add(m); });
    SCOPE.list.push({ S:S, c:c, g:c.getContext('2d'), t:t, gain:4, flat:false, ch:-2 });
  });
})();
function scopeAn(ch){
  if (SCOPE.an[ch]) return SCOPE.an[ch]; if (!ac || !AU.ready || !AU.ch || !AU.ch[ch]) return null;
  var a = ac.createAnalyser(); a.fftSize = 2048; a.smoothingTimeConstant = 0; AU.ch[ch].fad.connect(a); SCOPE.an[ch] = a; if (!SCOPE.buf) SCOPE.buf = new Float32Array(2048); return a;
}
function scopeDraw(o, ch, data, peak){
  var g = o.g, W = SCOPE.W, H = SCOPE.H, col = ch >= 0 ? MXCOL[ch] : '#5A6A66', i;
  g.fillStyle = '#04070A'; g.fillRect(0, 0, W, H);
  g.strokeStyle = 'rgba(140,190,180,0.14)'; g.lineWidth = 1; g.beginPath();
  for (i = 1; i < 10; i++){ var x = Math.round(i * W / 10) + 0.5; g.moveTo(x, 0); g.lineTo(x, H); } for (i = 1; i < 6; i++){ var y = Math.round(i * H / 6) + 0.5; g.moveTo(0, y); g.lineTo(W, y); } g.stroke();
  g.strokeStyle = 'rgba(140,190,180,0.32)'; g.beginPath(); g.moveTo(W / 2 + 0.5, 0); g.lineTo(W / 2 + 0.5, H); g.moveTo(0, H / 2 + 0.5); g.lineTo(W, H / 2 + 0.5); g.stroke();
  g.font = 'bold 11px ui-monospace, Menlo, Consolas, monospace'; g.textBaseline = 'top'; g.textAlign = 'left'; g.fillStyle = col; g.fillText(ch >= 0 ? MXN[ch] : 'NO OUT', 5, 4);
  g.beginPath();
  if (!data || peak < 0.004){ g.moveTo(0, H / 2); g.lineTo(W, H / 2); }
  else {
    var trig = 0; for (i = 1; i < 1000; i++) if (data[i - 1] < 0 && data[i] >= 0 && data[i + 6] > data[i]){ trig = i; break; }      // start on a rising edge so the picture stands still
    o.gain = lerp(o.gain, clamp(0.8 / peak, 0.8, 9), 0.25);
    for (i = 0; i < W; i++){ var v = data[trig + ((i * 1024 / W) | 0)] * o.gain, yy = H / 2 - clamp(v, -1.05, 1.05) * H * 0.44; if (i) g.lineTo(i, yy); else g.moveTo(i, yy); }
  }
  g.lineJoin = 'round'; g.strokeStyle = col; g.globalAlpha = 0.28; g.lineWidth = 5; g.stroke(); g.globalAlpha = 1; g.lineWidth = 1.6; g.stroke();
  o.t.needsUpdate = true;
}
function scopeUpdate(){
  for (var n = 0; n < 3; n++){                                  // three screens a frame, in turn: each one redraws about 20 times a second
    var o = SCOPE.list[SCOPE.next]; SCOPE.next = (SCOPE.next + 1) % SCOPE.list.length; if (!o) return;
    var dev = SNDEV[o.S.SN.out | 0], ch = dev && SCOPECH[dev] != null ? SCOPECH[dev] : -1, a = ch >= 0 ? scopeAn(ch) : null, peak = 0;
    if (a){ a.getFloatTimeDomainData(SCOPE.buf); for (var i = 0; i < 2048; i += 2){ var v = SCOPE.buf[i]; if (v > peak) peak = v; else if (-v > peak) peak = -v; } }
    var flat = peak < 0.004; if (flat && o.flat && o.ch === ch) continue;                      // silent and already showing a flat line: nothing to redraw
    o.flat = flat; o.ch = ch; scopeDraw(o, ch, a ? SCOPE.buf : null, peak);
  }
}

/* A Snake's SOLO button, checked every frame: it only counts while you are leaned in at that Snake or at the instrument it plays. */
function monUpdate(){
  var ch = -1, mix = 1;
  if (mode === 'tr' && LEAN && LEAN.key) for (var i = 0; i < SNAKES.length; i++){ var S = SNAKES[i], dev = SNDEV[S.SN.out | 0]; if (!S.SN.mon || !dev || SCOPECH[dev] == null) continue; if (S.key === LEAN.key || dev === LEAN.key){ ch = SCOPECH[dev]; mix = Math.pow(S.SN.monMix, 1.5); if (S.key === LEAN.key) break; } }
  var sig = ch + ':' + mix.toFixed(3); if (sig !== MON.sig){ MON.sig = sig; MON.ch = ch; MON.mix = mix; mxApply(); }
}
