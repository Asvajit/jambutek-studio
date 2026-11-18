
/* ================= snare lights: a fresnel box light hung in each corner of the ceiling, aimed at the rig =================
   They glow on every snare hit and fade; how bright depends on how hard the snare was hit. They are not light sources: only the lens and a soft halo light up, the room does not flash.
   Model: "Frensel Box Light" by LazyAstronaut3D (Sketchfab), baked to plain geometry in vendor/fresnel.json. */
var SNLIGHTS = [];
(function(){
  var F = window.JB_FRESNEL; if (!F) return;
  function geo(d){
    var bin = atob(d.p), u8 = new Uint8Array(bin.length), i; for (i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
    var q = new Uint16Array(u8.buffer), pos = new Float32Array(q.length);
    for (i = 0; i < q.length; i++){ var a = i % 3; pos[i] = d.lo[a] + (d.hi[a] - d.lo[a]) * q[i] / 65535; }
    var bi = atob(d.i), i8 = new Uint8Array(bi.length); for (i = 0; i < bi.length; i++) i8[i] = bi.charCodeAt(i);
    var g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setIndex(new THREE.BufferAttribute(new Uint16Array(i8.buffer), 1)); g.computeVertexNormals(); return g;
  }
  var gc = document.createElement('canvas'); gc.width = gc.height = 128; var gx = gc.getContext('2d'), gr = gx.createRadialGradient(64, 64, 0, 64, 64, 64);
  gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.18, 'rgba(255,255,255,0.55)'); gr.addColorStop(0.42, 'rgba(255,255,255,0.14)'); gr.addColorStop(0.7, 'rgba(255,255,255,0.025)'); gr.addColorStop(0.9, 'rgba(255,255,255,0)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); gx.fillStyle = gr; gx.fillRect(0, 0, 128, 128);
  var glowTex = new THREE.CanvasTexture(gc);
  var bodyGeo = geo(F.body), lensGeo = geo(F.lens);
  var bodyMat = new THREE.MeshPhongMaterial({ color:0x3C4048, emissive:0x0C0D10, shininess:30, specular:0x222222, side:THREE.DoubleSide });
  var inset = 0.55, y = ROOM.h - 0.42, target = new THREE.Vector3(RIG.x, 0.95, RIG.z);
  [[ROOM.x0 + inset, ROOM.z0 + inset], [ROOM.x1 - inset, ROOM.z0 + inset], [ROOM.x0 + inset, ROOM.z1 - inset], [ROOM.x1 - inset, ROOM.z1 - inset]].forEach(function(p){
    var pole = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.42, 0.04), metalMat); pole.position.set(p[0], ROOM.h - 0.21, p[1]); pole.userData.noShadow = true; scene.add(pole);
    var g = new THREE.Group(); g.position.set(p[0], y, p[1]); g.lookAt(target); scene.add(g);
    var body = new THREE.Mesh(bodyGeo, bodyMat); g.add(body);
    var lensMat = new THREE.MeshBasicMaterial({ color:0x120C06, side:THREE.DoubleSide }), lens = new THREE.Mesh(lensGeo, lensMat); g.add(lens);
    [body, lens].forEach(function(m){ m.userData.noShadow = true; });
    var halo = new THREE.Sprite(new THREE.SpriteMaterial({ map:glowTex, color:0xFFC98A, transparent:true, opacity:0, blending:THREE.AdditiveBlending, depthWrite:false })); halo.position.z = 0.3; halo.scale.set(1.5, 1.5, 1); halo.userData.noShadow = true; g.add(halo);
    SNLIGHTS.push({ lens:lensMat, halo:halo });
  });
})();
function snLightUpdate(dt){
  var s = SEQ.snare || 0, b = Math.min(1.3, s); b = Math.pow(b, 1.6);                      // squared, so a soft hit is clearly dimmer than a hard one
  for (var i = 0; i < SNLIGHTS.length; i++){ var L = SNLIGHTS[i]; var hs = 1.1 + 0.7 * b; L.halo.scale.set(hs, hs, 1); L.halo.material.opacity = Math.min(0.9, 0.85 * b); L.lens.color.setRGB(0.07 + 1.1 * b, 0.05 + 0.9 * b, 0.03 + 0.62 * b); }
  SEQ.snare = Math.max(0, s - dt * 4.5 * Math.max(0.25, s));
}

/* ================= the bar ring: industrial lights along the top of all four walls =================
   16 on each wall, 64 in all. While the sequencer runs one of them is red and walks round the room a beat at a time, so each
   wall is four bars and each corner is a four-bar mark; a full lap is sixteen bars. Stopped, they are all white.
   Model: "Industrial Light" by ConhuirParker, CC BY 4.0 (vendor/INDUSTRIAL-NOTICE.md). They glow; they do not light the room. */
var RING = { m:[], white:null, red:null, cur:-1 };
(function(){
  var F = window.JB_INDUSTRIAL; if (!F) return;
  function u16(b64){ var bin = atob(b64), u8 = new Uint8Array(bin.length); for (var i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i); return new Uint16Array(u8.buffer); }
  function deq(q, lo, hi, n){ var out = new Float32Array(q.length); for (var i = 0; i < q.length; i++){ var a = i % n; out[i] = lo[a] + (hi[a] - lo[a]) * q[i] / 65535; } return out; }
  var geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(deq(u16(F.p), F.lo, F.hi, 3), 3)); geo.setAttribute('uv', new THREE.BufferAttribute(deq(u16(F.uv), F.ulo, F.uhi, 2), 2));
  geo.setIndex(new THREE.BufferAttribute(u16(F.i), 1)); geo.computeVertexNormals();
  function tx(src){ var t = new THREE.TextureLoader().load(src); t.flipY = false; return t; }
  var map = tx(F.map), emi = tx(F.emi);
  RING.white = new THREE.MeshLambertMaterial({ map:map, emissive:0xFFF4E0, emissiveMap:emi, emissiveIntensity:0.9, side:THREE.DoubleSide });
  RING.red = new THREE.MeshLambertMaterial({ map:map, color:0xFF8070, emissive:0xFF1408, emissiveMap:emi, emissiveIntensity:2.2, side:THREE.DoubleSide });
  var N = 16, y = ROOM.h - 0.2, sc = 0.62, W = ROOM.x1 - ROOM.x0, D = ROOM.z1 - ROOM.z0;
  // clockwise seen from above, starting in the corner by the pattern buttons
  [[ROOM.x0, ROOM.z0, 1, 0, 0, 1, W], [ROOM.x1, ROOM.z0, 0, 1, -1, 0, D], [ROOM.x1, ROOM.z1, -1, 0, 0, -1, W], [ROOM.x0, ROOM.z1, 0, -1, 1, 0, D]].forEach(function(w){
    var t = new THREE.Vector3(w[2], 0, w[3]), n = new THREE.Vector3(w[4], 0, w[5]), x = new THREE.Vector3().crossVectors(n, t), q = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(x, n, t));
    for (var j = 0; j < N; j++){
      var d = (j + 0.5) / N * w[6], m = new THREE.Mesh(geo, RING.white); m.position.set(w[0] + w[2] * d + w[4] * 0.004, y, w[1] + w[3] * d + w[5] * 0.004); m.quaternion.copy(q); m.scale.set(sc, sc, sc); m.userData.noShadow = true; scene.add(m); RING.m.push(m);
    }
  });
})();
function ringUpdate(){
  if (!RING.m.length) return; if (!M.playing) SEQ.visN = -1;
  var i = M.playing && SEQ.visN >= 0 ? Math.floor(SEQ.visN / 4) % RING.m.length : -1; if (i === RING.cur) return;
  if (RING.cur >= 0) RING.m[RING.cur].material = RING.white; if (i >= 0) RING.m[i].material = RING.red; RING.cur = i;
}
