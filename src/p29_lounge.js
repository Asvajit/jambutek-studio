
/* ================= the lounge corners: a low square table in each free corner with a two-seat couch along each wall beside it =================
   Walk up to a couch and press E (or click it) to sit; any move key, E or Esc stands you up. You can look around while seated and the
   others see your head turn. Each time you sit you take one of three poses at random: plain, one leg up on the other, or both feet up
   on the seat. On each table lies a pile of the Jambutek stickers. */
var SEATS = [], COUCHES = [], SEATY = 0.42, SITDROP = 0.285, SITEYE = 1.2;
var SIT = { on:false, seat:-1, pose:0, k:0 };
(function(){
  var fab = new THREE.MeshLambertMaterial({ color:0x3C3F45 }), fab2 = new THREE.MeshLambertMaterial({ color:0x494C53 }), dark = new THREE.MeshLambertMaterial({ color:0x2A2C32 }), wood = new THREE.MeshLambertMaterial({ color:0x1B1C21 }), top = new THREE.MeshLambertMaterial({ color:0x2E3038 });
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
  var disc = new THREE.CircleGeometry(0.1, 18);
  function table(cx, cz, seed){
    var g = new THREE.Group(), S2 = 0.8, H = 0.62; /* as high as the couch arms */ g.position.set(cx, 0, cz); scene.add(g);
    box(g, S2, 0.05, S2, 0, H - 0.025, 0, top); [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(function(q){ box(g, 0.06, H - 0.05, 0.06, q[0] * (S2 / 2 - 0.06), (H - 0.05) / 2, q[1] * (S2 / 2 - 0.06), wood); });
    solid(g, 'lounge'); BLOCKS.push([cx - S2 / 2, cx + S2 / 2, cz - S2 / 2, cz + S2 / 2]);
    if (!stk.length) return; var r = seed;
    function rn(){ r = (r * 16807) % 2147483647; return r / 2147483647; }
    var pile = new THREE.Group(); pile.position.set(0.04, H + 0.001, -0.03); g.add(pile);
    for (var i = 0; i < 14; i++){                               // the same pile as in the Arcade: fourteen big stickers lying flat, overlapping within a hand's width
      var m = new THREE.Mesh(disc, stk[(i + seed) % stk.length]); m.rotation.x = -Math.PI / 2; m.rotation.z = rn() * 6.283;
      m.position.set((rn() * 2 - 1) * 0.07, i * 0.0016, (rn() * 2 - 1) * 0.07); m.userData.noShadow = true; pile.add(m);
    }
    var grab = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.05, 8), HITMAT); grab.position.y = 0.02; pile.add(grab);      // easy to click
    solid(pile, 'stickers');
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
  if (pose === 1){ P.legR.rotation.set(-1.9 * k, 1.3 * k, 0.16 * k); P.legR.userData.knee.rotation.x = 1.62 * k; }      // one leg up on the other: the thigh lifts a little, turns out, and the shin lies across the other knee
  P.armL.rotation.x = P.armR.rotation.x = (pose === 2 ? -1.25 : -0.85) * k; P.torso.rotation.x = -0.1 * k; P.torso.position.y = 0.78;
  P.head.rotation.y = headYaw * k; P.g.position.y = -SITDROP * k;
}

/* ================= stickers: take one from a stack, stick it on a wall (as in the Jambutek Arcade) =================
   Click a stack to take a sticker (a different one each time); it rides at the corner of your view and a faint copy shows where it
   will go. Click a wall to stick it. Click a stack again to put it back. Everyone in the room sees the walls fill up; the newest
   sixty stay. Stickers belong to the room, not to a jam: loading a jam or changing scene leaves them alone. */
var STKKEY = 'jambutek-studio-stickers-v1', STKMAX = 60, STKWALLN = [[0, 1], [0, -1], [1, 0], [-1, 0]];
var STK = { held:null, last:-1, list:[], mesh:[], tex:(window.JB_STICKERS || []).map(function(src){ var t = tex(src); t.magFilter = THREE.LinearFilter; return t; }) };
var stkGeo = new THREE.CircleGeometry(0.11, 18);
function stkRead(){ try { var a = JSON.parse(store(STKKEY) || '[]'); STK.list = Array.isArray(a) ? a.filter(function(s){ return s && STK.tex[s.d] && (isFinite(s.nx) && isFinite(s.nz) || STKWALLN[s.w]) && isFinite(s.x) && isFinite(s.y) && isFinite(s.z); }).slice(-STKMAX) : []; } catch (e) { STK.list = []; } }
function stkPaint(){
  STK.mesh.forEach(function(m){ scene.remove(m); m.material.dispose(); }); STK.mesh = [];
  STK.list.forEach(function(s, i){ var n = isFinite(s.nx) && isFinite(s.nz) ? [s.nx, s.nz] : STKWALLN[s.w], off = 0.014 + (i % 40) * 0.0004;
    var m = new THREE.Mesh(stkGeo, new THREE.MeshLambertMaterial({ map:STK.tex[s.d], emissive:0xffffff, emissiveMap:STK.tex[s.d], emissiveIntensity:0.18, polygonOffset:true, polygonOffsetFactor:-3, polygonOffsetUnits:-6 }));
    m.position.set(s.x + n[0] * off, s.y, s.z + n[1] * off); m.lookAt(m.position.x + n[0], m.position.y, m.position.z + n[1]); m.rotateZ(s.r || 0); m.userData.noShadow = true; scene.add(m); STK.mesh.push(m); });
}
stkRead(); stkPaint();
RESTORE[STKKEY] = function(){ stkRead(); stkPaint(); }; SAVENOW.push(function(){ store(STKKEY, JSON.stringify(STK.list)); });
var stkGhost = new THREE.Mesh(stkGeo, new THREE.MeshBasicMaterial({ transparent:true, opacity:0.55, depthWrite:false })); stkGhost.visible = false; scene.add(stkGhost);
var stkHand = new THREE.Mesh(new THREE.CircleGeometry(0.035, 16), new THREE.MeshBasicMaterial({ side:THREE.DoubleSide, depthTest:false, depthWrite:false, transparent:true })); stkHand.visible = false; stkHand.renderOrder = 70; stkHand.userData.noShadow = true; scene.add(stkHand);
function stkTake(){
  if (STK.held !== null){ STK.held = null; stkGhost.visible = false; toast('Sticker back on the stack'); return; }
  if (!STK.tex.length) return; var d; do { d = (Math.random() * STK.tex.length) | 0; } while (d === STK.last && STK.tex.length > 1);
  STK.last = d; STK.held = d; stkGhost.material.map = STK.tex[d]; stkGhost.material.needsUpdate = true; stkHand.material.map = STK.tex[d]; stkHand.material.needsUpdate = true;
  toast('Got a sticker · click a wall to stick it', 2600);
}
function stkPlace(hit){
  if (STK.held === null) return; var n = stkNormal(hit); if (!n) return;
  // it goes exactly where it was put, on the face that was clicked (any wall-like surface, the booth walls too), facing the way that face faces
  var s = { d:STK.held, x:+hit.point.x.toFixed(3), y:+clamp(hit.point.y, 0.12, ROOM.h - 0.12).toFixed(3), z:+hit.point.z.toFixed(3), nx:+n[0].toFixed(3), nz:+n[1].toFixed(3), r:+rnd(-0.45, 0.45).toFixed(2) };
  STK.list.push(s); if (STK.list.length > STKMAX) STK.list.shift(); STK.held = null; stkGhost.visible = false; stkPaint(); store(STKKEY, JSON.stringify(STK.list));
}
var stkN = new THREE.Vector3(), stkM = new THREE.Matrix3();
function stkNormal(hit){                                         // which way the clicked face looks, flat to the floor, turned towards whoever clicked it
  if (!hit || !hit.face) return null; stkN.copy(hit.face.normal).applyMatrix3(stkM.getNormalMatrix(hit.object.matrixWorld)); if (Math.abs(stkN.y) > 0.5) return null;
  stkN.y = 0; if (stkN.lengthSq() < 0.01) return null; stkN.normalize(); if (stkN.x * (camera.position.x - hit.point.x) + stkN.z * (camera.position.z - hit.point.z) < 0) stkN.negate(); return [stkN.x, stkN.z];
}
var stkF = new THREE.Vector3(), stkR = new THREE.Vector3(), stkU = new THREE.Vector3();
function stkTick(){
  if (STK.held === null || SPEC.on || mode !== 'walk'){ if (STK.held !== null && (SPEC.on || mode !== 'walk')) STK.held = null; stkGhost.visible = false; stkHand.visible = false; return; }
  camera.getWorldDirection(stkF); stkR.crossVectors(stkF, camera.up).normalize(); stkU.crossVectors(stkR, stkF);
  stkHand.position.copy(camera.position).addScaledVector(stkF, 0.3).addScaledVector(stkR, 0.17).addScaledVector(stkU, -0.11); stkHand.quaternion.copy(camera.quaternion); stkHand.rotateZ(-0.2); stkHand.visible = true;
  var hit = curAim();
  var n = hit && iaOf(hit) === 'wall' && hit.distance <= REACH ? stkNormal(hit) : null;
  if (n){
    stkGhost.position.set(hit.point.x + n[0] * 0.02, hit.point.y, hit.point.z + n[1] * 0.02); stkGhost.lookAt(stkGhost.position.x + n[0], hit.point.y, stkGhost.position.z + n[1]); stkGhost.visible = true; }
  else stkGhost.visible = false;
}
