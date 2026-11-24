
/* ================= the lounge corners: a low square table in each free corner with a two-seat couch along each wall beside it =================
   Walk up to a couch and press E (or click it) to sit; any move key, E or Esc stands you up. You can look around while seated and the
   others see your head turn. Each time you sit you take one of three poses at random: plain, one leg up on the other, or both feet up
   on the seat. On each table lies a pile of the Jambutek stickers. */
var SEATS = [], COUCHES = [], SEATY = 0.42, SITDROP = 0.285, SITEYE = 1.2;
var SIT = { on:false, seat:-1, pose:0, k:0 };
(function(){
  var fab = new THREE.MeshLambertMaterial({ color:0x6F737B }), fab2 = new THREE.MeshLambertMaterial({ color:0x80848D }), dark = new THREE.MeshLambertMaterial({ color:0x2A2C32 }), wood = new THREE.MeshLambertMaterial({ color:0x1B1C21 }), top = new THREE.MeshLambertMaterial({ color:0x2E3038 });
  function box(g, w, h, d, x, y, z, m){ var b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); b.position.set(x, y, z); b.castShadow = true; b.receiveShadow = true; g.add(b); return b; }
  function couch(cx, cz, dx, dz){                              // (dx, dz): the way it faces, out from the wall
    var g = new THREE.Group(), W = 1.7, ci = COUCHES.length; g.position.set(cx, 0, cz); g.rotation.y = Math.atan2(dx, dz); scene.add(g);
    box(g, W, 0.24, 0.8, 0, 0.2, 0, fab); box(g, W, 0.56, 0.2, 0, 0.56, -0.3, fab); box(g, 0.16, 0.42, 0.8, -W / 2 + 0.08, 0.41, 0, fab); box(g, 0.16, 0.42, 0.8, W / 2 - 0.08, 0.41, 0, fab);
    box(g, 0.66, 0.1, 0.56, -0.345, 0.37, 0.1, fab2); box(g, 0.66, 0.1, 0.56, 0.345, 0.37, 0.1, fab2); box(g, 0.66, 0.3, 0.1, -0.345, 0.62, -0.17, fab2); box(g, 0.66, 0.3, 0.1, 0.345, 0.62, -0.17, fab2);
    [[-0.76, -0.32], [0.76, -0.32], [-0.76, 0.32], [0.76, 0.32]].forEach(function(q){ box(g, 0.06, 0.08, 0.06, q[0], 0.04, q[1], dark); });
    solid(g, 'couch'); g.traverse(function(o){ o.userData.couch = ci; });
    var px = dz, pz = -dx;                                       // along the couch
    [-0.37, 0.37].forEach(function(u){ SEATS.push({ x:cx + px * u + dx * 0.1, z:cz + pz * u + dz * 0.1, yaw:Math.atan2(-dx, -dz), dx:dx, dz:dz, couch:ci }); });
    COUCHES.push({ g:g, x:cx, z:cz }); var hx = Math.abs(px) * W / 2 + Math.abs(dx) * 0.4, hz = Math.abs(pz) * W / 2 + Math.abs(dz) * 0.4; BLOCKS.push([cx - hx, cx + hx, cz - hz, cz + hz]);
  }
  var stk = (window.JB_STICKERS || []).map(function(src){ var t = tex(src); t.magFilter = THREE.LinearFilter; return new THREE.MeshLambertMaterial({ map:t, emissive:0xffffff, emissiveMap:t, emissiveIntensity:0.22 }); });
  var disc = new THREE.CircleGeometry(0.058, 20);
  function table(cx, cz, seed){
    var g = new THREE.Group(), S2 = 0.8, H = 0.44; g.position.set(cx, 0, cz); scene.add(g);
    box(g, S2, 0.05, S2, 0, H - 0.025, 0, top); [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(function(q){ box(g, 0.06, H - 0.05, 0.06, q[0] * (S2 / 2 - 0.06), (H - 0.05) / 2, q[1] * (S2 / 2 - 0.06), wood); });
    solid(g, 'lounge'); BLOCKS.push([cx - S2 / 2, cx + S2 / 2, cz - S2 / 2, cz + S2 / 2]);
    if (!stk.length) return; var r = seed;
    function rn(){ r = (r * 16807) % 2147483647; return r / 2147483647; }
    for (var i = 0; i < 26; i++){                               // a loose pile in the middle, a few strays towards the edges
      var stray = i >= 18, a = rn() * 6.283, d = stray ? 0.14 + rn() * 0.2 : rn() * rn() * 0.11;
      var m = new THREE.Mesh(disc, stk[(i + seed) % stk.length]); m.rotation.x = -Math.PI / 2 + (stray ? 0 : (rn() - 0.5) * 0.16); m.rotation.z = rn() * 6.283; m.rotation.y = stray ? 0 : (rn() - 0.5) * 0.16;
      m.position.set(Math.cos(a) * d, H + 0.002 + (stray ? 0 : i * 0.0016), Math.sin(a) * d); m.userData.noShadow = true; g.add(m);
    }
  }
  var a0 = ROOM.x0, b0 = ROOM.z0, a1 = ROOM.x1, b1 = ROOM.z1;
  [[a0 + 1.15, b0 + 1.15], [a1 - 1.15, b1 - 1.15]].forEach(function(q){ var l = new THREE.PointLight(0xFFD9B0, 0.95, 3.4, 1.6); l.position.set(q[0], 1.75, q[1]); scene.add(l); });      // a soft warm lamp over each lounge, so it is not lost in the dark
  table(a0 + 0.5, b0 + 0.5, 7); couch(a0 + 1.77, b0 + 0.42, 0, 1); couch(a0 + 0.42, b0 + 1.77, 1, 0);                 // the north-west corner
  table(a1 - 0.5, b1 - 0.5, 23); couch(a1 - 1.77, b1 - 0.42, 0, -1); couch(a1 - 0.42, b1 - 1.77, -1, 0);              // the south-east corner
})();
function seatFree(i){ var ok = true; if (typeof MP !== 'undefined' && MP) Object.keys(MP.peers).forEach(function(id){ var s = MP.peers[id].s; if (s && s[8] && Math.floor((s[8] - 1) / 3) === i) ok = false; }); return ok; }
function seatNear(couch, maxD){                                 // the nearest free seat (on one couch if given)
  var best = -1, bd = maxD; SEATS.forEach(function(S, i){ if (couch != null && S.couch !== couch) return; var d = Math.hypot(cam.x - S.x, cam.z - S.z); if (d < bd && seatFree(i)){ bd = d; best = i; } }); return best;
}
function sitDown(i){
  if (i < 0 || mode !== 'walk' || SPEC.on){ if (i < 0) toast('Both seats are taken'); return false; }
  var S = SEATS[i]; SIT.on = true; SIT.seat = i; SIT.pose = (Math.random() * 3) | 0; cam.walkTo = null; cam.homing = false; cam.x = S.x; cam.z = S.z; cam.ty = S.yaw; crouch.on = false;
  toast('Sitting · look around with the mouse · any move key or E stands up', 2600); return true;
}
function standUp(){ if (!SIT.on) return; var S = SEATS[SIT.seat]; SIT.on = false; cam.x = S.x + S.dx * 0.75; cam.z = S.z + S.dz * 0.75; }
function sitTick(dt){
  SIT.k = lerp(SIT.k, SIT.on ? 1 : 0, 1 - Math.exp(-dt * 7)); if (!SIT.on) return; if (mode !== 'walk' || SPEC.on){ SIT.on = false; return; }
  var S = SEATS[SIT.seat]; cam.x = S.x; cam.z = S.z;
  var d = cam.ty - S.yaw; d = Math.atan2(Math.sin(d), Math.cos(d)); if (Math.abs(d) > 1.75){ cam.ty = S.yaw + (d > 0 ? 1.75 : -1.75); cam.yaw = cam.ty; }      // the head turns, the body stays put
}
/* the sitting figure: used for every other player (and the test players) */
function sitPose(P, pose, headYaw, k){
  var hx = [-1.5, -1.5, -2.3][pose] * k, kx = [1.5, 1.5, 2.4][pose] * k;
  P.legL.rotation.set(hx, 0, 0); P.legR.rotation.set(hx, 0, 0); P.legL.userData.knee.rotation.x = kx; P.legR.userData.knee.rotation.x = kx;
  if (pose === 1){ P.legR.rotation.set(-1.72 * k, -1.25 * k, -0.2 * k); P.legR.userData.knee.rotation.x = 1.75 * k; }      // one leg up on the other: the thigh lifts a little, turns out, and the shin lies across the other knee
  P.armL.rotation.x = P.armR.rotation.x = (pose === 2 ? -1.25 : -0.85) * k; P.torso.rotation.x = -0.1 * k; P.torso.position.y = 0.78;
  P.head.rotation.y = headYaw * k; P.g.position.y = -SITDROP * k;
}
