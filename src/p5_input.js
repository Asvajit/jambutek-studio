
/* ================= camera: a person standing in the room (same eye height, speed and feel as the arcade) ================= */
var HOME = { x:0, z:-1.05, yaw:Math.PI, pitch:-0.16 };          // by the north wall, facing the table with the mixer and the drum machine, the rig behind it
var cam = { x:HOME.x, z:HOME.z, yaw:HOME.yaw, pitch:HOME.pitch, ty:HOME.yaw, tp:HOME.pitch, homing:false, walkTo:null };
var running = false, EYE = 1.5, keys = {}, crouch = { on:false, k:0 }, JUMP = { y:0, v:0 };
function collide(){
  var R = 0.3;
  cam.x = clamp(cam.x, ROOM.x0 + R, ROOM.x1 - R); cam.z = clamp(cam.z, ROOM.z0 + R, ROOM.z1 - R);
  BLOCKS.forEach(function(b){
    var x0 = b[0] - R, x1 = b[1] + R, z0 = b[2] - R, z1 = b[3] + R;
    if (cam.x > x0 && cam.x < x1 && cam.z > z0 && cam.z < z1){
      var dx = Math.min(cam.x - x0, x1 - cam.x), dz = Math.min(cam.z - z0, z1 - cam.z);
      if (dx < dz) cam.x = cam.x - x0 < x1 - cam.x ? x0 : x1; else cam.z = cam.z - z0 < z1 - cam.z ? z0 : z1;
    }
  });
}

/* ================= HUD bits ================= */
var toastEl = document.getElementById('toast'), toastT = null, hintEl = document.getElementById('hint'), hintTimer = null;
function toast(msg){ toastEl.textContent = msg; toastEl.classList.add('up'); clearTimeout(toastT); toastT = setTimeout(function(){ toastEl.classList.remove('up'); }, 2400); live.textContent = msg; }
function dimHint(){ clearTimeout(hintTimer); hintTimer = setTimeout(function(){ hintEl.classList.add('dim'); }, 8000); }
var xh = document.getElementById('xh'), xhLab = document.getElementById('xhLab'), lockmsg = document.getElementById('lockmsg'), tip = document.getElementById('tip'), trhud = document.getElementById('trhud');

/* ================= leaning over an instrument ================= */
var DEVS = {
  tr:{ key:'tr', g:TRG, name:'drum machine', stand:devStand(TRPOS), yaw:TRPOS.r, pitch:-0.42, d:0.78, asp:1.6, off:0.06, lookz:0.03, hud:'hudTr' },
  mf:{ key:'mf', g:MFG, name:'synth', stand:devStand(MFPOS), yaw:MFPOS.r, pitch:-0.42, d:0.69, asp:1.78, off:0.04, lookz:0.02, hud:'hudMf', keys:{ down:mfKbDown, up:mfKbUp, play:function(){ press(CT.mfplay); release(CT.mfplay); } } },
  bs:{ key:'bs', g:BSG, name:'bass synth', stand:devStand(BSPOS), yaw:BSPOS.r, pitch:-0.42, d:0.66, asp:1.6, off:0.05, lookz:0.025, hud:'hudBs', keys:{ down:bsKbDown, up:bsKbUp, play:function(){ press(CT.bson); release(CT.bson); } } },
  zk:{ key:'zk', g:ZKG, name:'Kit synth', stand:devStand(ZKPOS), yaw:ZKPOS.r, pitch:-0.42, d:0.42, asp:1.35, off:0.04, lookz:0.005, hud:'hudZk', keys:{ down:zkKbDown, up:zkKbUp, play:function(){ toggleSeq(); } } },
  mb:{ key:'mb', g:MBG, name:'Blip synth', stand:devStand(MBPOS), yaw:MBPOS.r, pitch:-0.42, d:0.36, asp:1.1, off:0.04, lookz:0.005, hud:'hudMb', keys:{ down:mbKbDown, up:mbKbUp, play:function(){ toggleSeq(); } } },
  sh:{ key:'sh', g:SHG, name:'Shru synth', stand:devStand(SHPOS), yaw:SHPOS.r, pitch:-0.42, d:0.37, asp:1.25, off:0.04, lookz:0.005, hud:'hudSh', keys:{ down:shKbDown, up:shKbUp, play:function(){ toggleSeq(); } } },
  am:{ key:'am', g:AMG, name:'Ambi synth', stand:devStand(AMPOS), yaw:AMPOS.r, pitch:-0.42, d:0.46, asp:1.78, off:0.04, lookz:0.01, hud:'hudAm', keys:{ down:amKbDown, up:amKbUp, play:function(){ CT.amenc.click(); } } },
  tp:{ key:'tp', g:TPG, name:'Tape sampler', stand:devStand(TPPOS), yaw:TPPOS.r, pitch:-0.42, d:0.27, asp:2.75, off:0.04, lookz:-0.012, hud:'hudTp', keys:{ down:tpKbDown, up:tpKbUp, play:function(){ press(CT.tpplay); release(CT.tpplay); } } },
  mx:{ key:'mx', g:MXG, name:'mixer', stand:devStand(MXPOS), yaw:MXPOS.r, pitch:-0.42, d:0.78, asp:1.63, off:0.05, lookz:0.03, hud:'hudMx' }
};
DEVS.mc = { key:'mc', g:MCG, name:'Chord synth', stand:devStand(MCPOS), yaw:MCPOS.r, pitch:-0.42, d:0.56, asp:2.0, off:0.04, lookz:0.03, hud:'hudMc', keys:{ down:mcKbDown, up:mcKbUp, play:function(){ toggleSeq(); } } };
DEVS.ec = { key:'ec', g:ECG, name:'Echo and reverb', stand:devStand(ECPOS), yaw:ECPOS.r, pitch:-0.42, d:0.98, asp:0.6, off:0.04, lookz:0.2 + 0.05, hud:'hudEc' };
DEVS.sc = { key:'sc', g:SCG, name:'Scratch box', stand:devStand(SCPOS), yaw:SCPOS.r, pitch:-0.42, d:0.62, asp:0.95, off:0.04, lookz:0.03, hud:'hudSc', keys:{ down:skKbDown, up:skKbUp, play:function(){ toggleSeq(); } } };
FLOWS.forEach(function(f){ DEVS[f.key] = { key:f.key, g:f.G, name:'Video synth A', stand:devStand(f.pos), yaw:f.pos.r, pitch:-0.42, d:0.72, asp:1.9, off:0.04, lookz:0.05, hud:'hudPf' }; });
DEVS.bz = { key:'bz', g:BZG, name:'Video synth B', stand:devStand(PGPOS), yaw:PGPOS.r, pitch:-0.42, d:0.52, asp:1.9, off:0.04, lookz:0.02, hud:'hudBz' };
SNAKES.forEach(function(s){ DEVS[s.key] = { key:s.key, g:s.G, name:'Snake sequencer', stand:devStand(s.hp), yaw:s.hp.r, pitch:-0.04, d:0.5, asp:1.75, off:0.05, lookz:0.02, hud:'hudSn' }; });
var LEAN = DEVS.tr, trBlend = 0;
/* ---- detail culling: every knob, button, key and lamp is its own draw, about 3,000 in all. On each instrument they sit on the
   front of a slanted panel, so from behind the panel the body hides them anyway, and from across the room they are specks.
   Each instrument's small parts go in one sub-group that is switched off in those two cases. Nothing visible changes. ---- */
var LOD = [];
(function(){
  var seen = [], box = new THREE.Box3(), sz = new THREE.Vector3();
  Object.keys(DEVS).forEach(function(k){
    var g = DEVS[k].g; if (!g || seen.indexOf(g) >= 0) return; seen.push(g);
    var det = new THREE.Group(), move = [];
    g.children.forEach(function(ch){
      if (ch.isMesh && ch.geometry){ if (!ch.geometry.boundingBox) ch.geometry.computeBoundingBox(); box.copy(ch.geometry.boundingBox).getSize(sz).multiply(ch.scale); if (Math.max(sz.x, sz.y, sz.z) >= 0.18) return; }   // the panel, body, platter: always drawn
      else if (ch.isLight) return;
      move.push(ch);
    });
    if (move.length < 8) return;
    g.add(det); move.forEach(function(ch){ det.add(ch); });
    LOD.push({ key:k, g:g, det:det, p:new THREE.Vector3(), n:new THREE.Vector3(), on:true });
  });
  scene.updateMatrixWorld(true);
  LOD.forEach(function(L){ L.g.getWorldPosition(L.p); L.n.set(0, 1, 0).transformDirection(L.g.matrixWorld); });
})();
function lodUpdate(){
  var c = camera.position;
  for (var i = 0; i < LOD.length; i++){
    var L = LOD[i], dx = c.x - L.p.x, dy = c.y - L.p.y, dz = c.z - L.p.z, front = dx * L.n.x + dy * L.n.y + dz * L.n.z, d2 = dx * dx + dy * dy + dz * dz;
    var on = (mode === 'tr' && LEAN.g === L.g) || (front > (L.on ? -0.3 : -0.2) && d2 < (L.on ? 64 : 56));      // in front of the panel (with a margin for knobs seen edge-on) and within 8 m
    if (on !== L.on){ L.on = on; L.det.visible = on; }
  }
}
function trPose(eye, look){
  var d = LEAN.d * Math.max(1, LEAN.asp / camera.aspect);
  eye.set(0, d, LEAN.off * d / 0.7); LEAN.g.localToWorld(eye); look.set(0, 0, LEAN.lookz); LEAN.g.localToWorld(look);
}
function nearDev(){ var best = null, bd = 1.5; Object.keys(DEVS).forEach(function(k){ var D = DEVS[k], d = Math.hypot(cam.x - D.stand.x, cam.z - D.stand.z); if (d < bd){ bd = d; best = D; } }); return best; }
function devOf(hit){ var u = hit.object.userData; return DEVS[(u.ctl && u.ctl.dev) || u.dev || 'tr']; }
function enterTR(dev){
  var D = typeof dev === 'string' ? DEVS[dev] : dev; if (mode !== 'walk' || !D) return;
  if (MP.guest){ MP.guestSay(); return; }                             // guests look, they do not play      // dev is a key or a DEVS entry; the wall buttons have none
  LEAN = D;
  unlock(); mode = 'tr'; keys = {}; cam.walkTo = null; cam.homing = false; relock = locked; releaseLock(); trBlend = 0;
  trhud.hidden = false; hintEl.hidden = true; ['hudTr', 'hudMf', 'hudBs', 'hudMx', 'hudSn', 'hudMb', 'hudSh', 'hudAm', 'hudTp', 'hudPf', 'hudMc', 'hudSc', 'hudEc', 'hudBz', 'hudZk'].forEach(function(h){ document.getElementById(h).hidden = LEAN.hud !== h; });
  resize(); refreshLockUi();
}
function switchLean(dev){                                      // hop straight from one instrument to another without stepping back
  var D = typeof dev === 'string' ? DEVS[dev] : dev; if (!D) return false; if (mode !== 'tr'){ enterTR(D); return mode === 'tr'; } if (D === LEAN) return true;
  endCtl(true); setHover(null); LOOKUP.on = false;
  Object.keys(MF.kb).forEach(mfKbUp); Object.keys(BS.kb).forEach(bsKbUp); Object.keys(AM.kb).forEach(amKbUp); Object.keys(TP.kb).forEach(tpKbUp); Object.keys(MB.kb).forEach(mbKbUp); Object.keys(MC.kb).forEach(mcKbUp); Object.keys(SH.kb).forEach(shKbUp); Object.keys(ZK.kb).forEach(zkKbUp);
  LEAN = D; cam.x = D.stand.x; cam.z = D.stand.z; cam.yaw = cam.ty = D.yaw; cam.pitch = cam.tp = D.pitch; trBlend = 0.35; keys = {};
  ['hudTr', 'hudMf', 'hudBs', 'hudMx', 'hudSn', 'hudMb', 'hudSh', 'hudAm', 'hudTp', 'hudPf', 'hudMc', 'hudSc', 'hudEc', 'hudBz', 'hudZk'].forEach(function(h){ document.getElementById(h).hidden = LEAN.hud !== h; });
  resize(); return true;
}
/* Q held at a machine that has no sequencer (drum machine, mixer, echo and reverb, video synths): the view lifts off the panel to look
   across the room at the other players. You stay leaned in; the mouse turns the view while Q is down; letting go drops back to the panel. */
var LOOKUP = { on:false, k:0, yaw:0, pitch:0 };
function hasSeq(D){ return !!D && !!D.key && (D.key.indexOf('sn') === 0 || SNDEV.indexOf(D.key) > 0); }
document.addEventListener('keyup', function(e){ if (e.key && e.key.toLowerCase() === 'q') LOOKUP.on = false; }); window.addEventListener('blur', function(){ LOOKUP.on = false; });
document.addEventListener('mousemove', function(e){ if (!LOOKUP.on || mode !== 'tr') return; LOOKUP.yaw -= (e.movementX || 0) * 0.0026 * OPT.sens; LOOKUP.pitch = clamp(LOOKUP.pitch - (e.movementY || 0) * 0.0026 * OPT.sens, -0.75, 0.7); });
var LASTSN = {};                                               // per synth, the sequencer you last came from
function swapLean(){                                           // Q: between a synth and the sequencer that plays it
  var i, S;
  if (LEAN.key.indexOf('sn') === 0){
    for (i = 0; i < SNAKES.length; i++) if (SNAKES[i].key === LEAN.key) S = SNAKES[i];
    var dk = S && SNDEV[S.SN.out]; if (!dk){ toast('Set INST on this sequencer first'); return; }
    LASTSN[dk] = S.key; switchLean(dk); toast(DEVS[dk].name.charAt(0).toUpperCase() + DEVS[dk].name.slice(1) + ' · Q goes back to its sequencer'); return;
  }
  var want = LASTSN[LEAN.key], pick = null;
  for (i = 0; i < SNAKES.length; i++){ S = SNAKES[i]; if (SNDEV[S.SN.out] !== LEAN.key) continue; if (S.key === want){ pick = S; break; } if (!pick || S.hp === (DEVS[LEAN.key].hp || null)) pick = pick || S; }
  if (!pick){ toast('No sequencer is set to play this'); return; }
  switchLean(pick.key);
}
function leaveTR(){
  if (mode !== 'tr') return;
  mode = 'walk'; trhud.hidden = true; hintEl.hidden = false; endCtl(true); setHover(null);
  Object.keys(MF.kb).forEach(mfKbUp); Object.keys(BS.kb).forEach(bsKbUp); Object.keys(AM.kb).forEach(amKbUp); Object.keys(TP.kb).forEach(tpKbUp); Object.keys(MB.kb).forEach(mbKbUp); Object.keys(MC.kb).forEach(mcKbUp); Object.keys(SH.kb).forEach(shKbUp); Object.keys(ZK.kb).forEach(zkKbUp);
  cam.x = LEAN.stand.x; cam.z = LEAN.stand.z; cam.yaw = cam.ty = LEAN.yaw; cam.pitch = cam.tp = LEAN.pitch; pointer.has = false;
  resize(); refreshLockUi();
  if (relock && !lockFailed){ try { var p = canvas.requestPointerLock(); if (p && p.catch) p.catch(function(){ relock = false; }); } catch (e) { relock = false; } }   // stepping back with E or the button takes the mouse again; after Esc the browser wants a click
}
document.getElementById('trLeave').addEventListener('click', leaveTR);

/* ================= input: move the mouse to look, click to use things (touch: drag to look, tap to walk) ================= */
var ray = new THREE.Raycaster(), CENTER = new THREE.Vector2(0, 0);
var REACH = 2.9, CTL_REACH = 1.9;
var locked = false, everLocked = false, lockFails = 0, relock = false, lockApi = 'requestPointerLock' in canvas, lockFailed = !lockApi;
var pointer = { x:0, y:0, cx:0, cy:0, in:false, mouse:!touchOnly, has:false, lx:0, ly:0 };
function aim(at){ ray.setFromCamera(at || CENTER, camera); ray.far = 30; var hits = ray.intersectObjects(solids, false); return hits.length ? hits[0] : null; }
function iaOf(hit){ return hit ? hit.object.userData.ia : null; }
function ndcOf(e){ var r = canvas.getBoundingClientRect(); return new THREE.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1); }
function centred(){ return locked; }                                             // is the crosshair doing the pointing?
function curAim(){ return centred() ? aim() : (pointer.in ? aim(new THREE.Vector2(pointer.x, pointer.y)) : null); }
function ctlOf(hit){ return !SPEC.on && hit && iaOf(hit) === 'ctl' && (mode === 'tr' || hit.distance <= (hit.object.userData.ctl.dev === 'wall' ? REACH + 0.6 : CTL_REACH)) ? hit.object.userData.ctl : null; }
function labelFor(hit){
  var ia = iaOf(hit); if (!ia || SPEC.on) return null;
  if (ia === 'ctl' || ia === 'trbody'){
    var c = ia === 'ctl' ? ctlOf(hit) : null; if (c) return labelOf(c);
    if (hit.distance > REACH) return 'Get closer'; if (mode === 'tr') return null;
    var nm = devOf(hit).name; nm = nm.charAt(0).toUpperCase() + nm.slice(1);
    return touchOnly ? 'Tap to lean over the ' + devOf(hit).name : nm + (ia === 'ctl' ? ' · get closer, or press E to lean in' : ' · E to lean in');
  }
  if (ia === 'spot') return hit.distance > REACH ? null : 'Taped out for the next instrument';
  if (ia === 'couch') return SIT.on || mode !== 'walk' || hit.distance > REACH ? null : (touchOnly ? 'Tap to sit' : 'Couch · E to sit');
  if (ia === 'stickers') return hit.distance > REACH || mode !== 'walk' ? null : (STK.held !== null ? 'Put the sticker back' : 'Take a sticker · click');
  if (ia === 'wall' && STK.held !== null) return hit.distance > REACH ? 'Get closer to the wall' : 'Click to stick it here';
  if (ia === 'sign') return 'Jambutek';
  return null;
}
var SNCLIP = null;      /* a copied Snake page, shared by all the Snakes */
var hoverCtl = null;
function setHover(c){ if (c === hoverCtl) return; if (hoverCtl) hoverCtl.hover(false); hoverCtl = c; if (c) c.hover(true); }
CT.dtime.detents = DIVS.length - 1; CT.fillknob.detents = 5;

/* grabbing a control */
var drag = null, pressed = null;
function startCtl(c, e, h){
  if (c.kind === 'knob' || c.kind === 'fader'){
    if (SNLEARN){ SNLEARN(c); if (!SNLEARN) return; }                 // a sequencer is listening: clicking the control is enough to pick it
    var tNow = performance.now(), dbl = e.detail >= 2 || (startCtl.last === c && tNow - startCtl.at < 400); startCtl.last = c; startCtl.at = tNow;      /* a pointerdown carries no click count, so two presses on the same control within 0.4 s are counted here */
    if (dbl && !c.endless && !c.click){ startCtl.last = null; setCtl(c, c.def); toast(c.name + ' reset'); return; }
    drag = { c:c, y:e.clientY, py:e.clientY, v0:c.v, acc:0, clicks:0, moved:false }; if (c.grab) c.grab(true);
    if (!locked){ try { canvas.setPointerCapture(e.pointerId); } catch (x) {} canvas.className = 'grabbing'; }
  } else { pressed = c; c._hit = h; press(c); if (!locked){ try { canvas.setPointerCapture(e.pointerId); } catch (x) {} } }
}
function moveCtl(e){
  var c = drag.c;
  if (c.scrub){ var mv = locked ? (e.movementY || 0) : e.clientY - drag.py; drag.py = e.clientY; if (Math.abs(e.clientY - drag.y) > 3 || Math.abs(mv) > 3) drag.moved = true; c.scrub(-mv); return; }
  var dy = locked ? (drag.acc += e.movementY || 0) : e.clientY - drag.y;
  if (Math.abs(dy) > 3) drag.moved = true;
  if (c.endless){ var n = Math.trunc(-dy / 12); if (n !== drag.clicks){ turnCtl(c, n - drag.clicks); drag.clicks = n; } }
  else setCtl(c, drag.v0 - dy / (c.kind === 'fader' ? 170 : 230) * (e.shiftKey ? 0.15 : 1));
}
function endCtl(cancel){
  if (drag){ var d = drag; drag = null; canvas.className = ''; pointer.has = false; if (d.c.grab) d.c.grab(false); if (!cancel && !d.moved && d.c.click) d.c.click(); }
  if (pressed){ release(pressed); pressed = null; }
}
function lockRefused(){
  if (locked) return; lockFails++;
  if (!everLocked && lockFails >= 4){ lockFailed = true; toast('This viewer blocks mouse capture. Drag to look instead.'); } else toast('Click again to look around');
  refreshLockUi();
}
function requestLock(){ if (!lockApi) return false; try { var p = canvas.requestPointerLock(); if (p && p.catch) p.catch(lockRefused); return true; } catch (e) { lockRefused(); return false; } }
function releaseLock(){ if (document.pointerLockElement && document.exitPointerLock) document.exitPointerLock(); }
document.addEventListener('pointerlockchange', function(){
  locked = document.pointerLockElement === canvas;
  if (locked){ everLocked = true; lockFails = 0; lockFailed = false; relock = false; } else { keys = {}; running = false; endCtl(true); pointer.has = false; }
  refreshLockUi();
});
document.addEventListener('pointerlockerror', function(){ if (mode === 'walk' && !relock) lockRefused(); relock = false; });
function refreshLockUi(){ lockmsg.hidden = (typeof MP !== 'undefined' && MP && MP.lobbyOpen) || locked || (lockFailed && !everLocked) || touchOnly || mode !== 'walk' || !started; }
function act(hit, byTouch){
  var ia = iaOf(hit); if (!ia) return;
  if (MP.guest && ia !== 'floor' && ia !== 'couch' && ia !== 'stickers' && ia !== 'wall'){ if (ia === 'ctl' || ia === 'trbody') MP.guestSay(); return; }      // a guest's clicks reach the couches, the stickers and the walls only
  if (ia === 'floor'){ if (byTouch && hit.distance > 0.8 && mode === 'walk') cam.walkTo = { x:hit.point.x, z:hit.point.z }; return; }
  if (hit.distance > REACH){ if (ia === 'ctl' || ia === 'trbody' || ia === 'spot') toast('Get a little closer.'); return; }
  if (ia === 'ctl' || ia === 'trbody'){ if (byTouch || !locked) enterTR(devOf(hit)); else toast('Step up to it, or press E to lean in'); return; }
  if (ia === 'spot'){ toast('Taped out for the next instrument'); return; }
  if (ia === 'stickers'){ if (mode === 'walk') stkTake(); return; }
  if (ia === 'wall'){ if (STK.held !== null) stkPlace(hit); return; }
  if (ia === 'couch'){ if (!SIT.on && mode === 'walk' && (byTouch || !locked)) sitDown(seatNear(hit.object.userData.couch, 99)); else if (!SIT.on) toast('Press E to sit'); return; }
  if (ia === 'monitor'){ toast(M.playing ? 'Loud.' : 'Press START on the drum machine'); return; }
}

var look = null;
canvas.addEventListener('mousedown', function(e){ if (e.button === 1) e.preventDefault(); });      // the middle button pings; it must not start the browser's scroll
canvas.addEventListener('pointerdown', function(e){
  unlock(); dimHint();
  if (e.button === 1){ e.preventDefault(); if (!SPEC.on) MP.ping(); return; }
  var isMouse = e.pointerType === 'mouse'; pointer.mouse = isMouse;
  var h = centred() ? aim() : aim(ndcOf(e)), c = e.button === 0 ? ctlOf(h) : null;
  if (c && (isMouse || mode === 'tr')){ startCtl(c, e, h); return; }
  if (mode === 'tr') return;
  if (locked){ if (!SPEC.on) act(h, false); return; }
  if (isMouse && lockApi && (!lockFailed || everLocked)){ requestLock(); return; }      // like the arcade: click takes the mouse, Esc gives it back
  if (isMouse && lockFailed && e.detail >= 2) requestLock();
  try { canvas.setPointerCapture(e.pointerId); } catch (x) {}
  look = { x:e.clientX, y:e.clientY, yaw:cam.ty, pitch:cam.tp, moved:false, hit:h };
});
canvas.addEventListener('pointermove', function(e){
  var r = canvas.getBoundingClientRect(), isMouse = e.pointerType === 'mouse';
  pointer.x = ((e.clientX - r.left) / r.width) * 2 - 1; pointer.y = -((e.clientY - r.top) / r.height) * 2 + 1; pointer.cx = e.clientX; pointer.cy = e.clientY; pointer.in = true; pointer.mouse = isMouse;
  var dx = pointer.has ? e.clientX - pointer.lx : 0, dy = pointer.has ? e.clientY - pointer.ly : 0; pointer.lx = e.clientX; pointer.ly = e.clientY; pointer.has = true;
  if (drag){ moveCtl(e); return; }
  if (pressed && (pressed.kind === 'key' || pressed.touch) && mode === 'tr'){   // slide across the keys or the touch pads
    var kc = ctlOf(aim(new THREE.Vector2(pointer.x, pointer.y)));
    if (kc && kc !== pressed && kc.kind === pressed.kind && kc.dev === pressed.dev && kc.sh == null){ release(pressed); pressed = kc; kc._hit = null; press(kc); }
    return;
  }
  if (mode !== 'walk') return;
  if (locked){                                                            // captured: moving the mouse turns your head
    var k = 0.0023 * OPT.sens; dx = e.movementX || 0; dy = e.movementY || 0;
    cam.ty -= dx * k; cam.yaw = cam.ty; cam.tp = clamp(cam.tp - dy * k, -1.35, 1.25); cam.pitch = cam.tp; cam.walkTo = null; cam.homing = false;
    return;
  }
  if (look){
    var kk = 2.6 / r.height, ddx = e.clientX - look.x, ddy = e.clientY - look.y;
    if (Math.abs(ddx) + Math.abs(ddy) > 6) look.moved = true;
    cam.ty = look.yaw + ddx * kk; cam.tp = clamp(look.pitch + ddy * kk, -1.2, 1.0); cam.walkTo = null;
  }
});
canvas.addEventListener('pointerleave', function(){ pointer.in = false; pointer.has = false; });
function pointerDone(){
  if (drag || pressed){ endCtl(); return; }
  if (look && !look.moved && look.hit) act(look.hit, true);
  look = null;
}
canvas.addEventListener('pointerup', pointerDone);
canvas.addEventListener('pointercancel', function(){ endCtl(true); look = null; });
window.addEventListener('blur', function(){ MXSHIFT = false; endCtl(true); keys = {}; Object.keys(MF.kb).forEach(mfKbUp); Object.keys(BS.kb).forEach(bsKbUp); });
canvas.addEventListener('contextmenu', function(e){ e.preventDefault(); });
var wheelAcc = 0, wheelOn = null;
canvas.addEventListener('wheel', function(e){
  if (MP.guest) return;
  var c = ctlOf(curAim());
  if (c && c.wheel){ if (c.wheel(c, e.deltaMode === 1 ? e.deltaY * 33 : e.deltaY)) e.preventDefault(); return; }
  if (!c || (c.kind !== 'knob' && c.kind !== 'fader')) return;
  e.preventDefault(); unlock();
  var dy0 = e.deltaY || e.deltaX, dy = e.deltaMode === 1 ? dy0 * 33 : dy0;          // with Shift held most browsers report the wheel sideways
  if (wheelOn !== c){ wheelOn = c; wheelAcc = 0; }
  if (c.endless || c.detents){
    wheelAcc += dy; var n = Math.trunc(wheelAcc / 50); if (!n) return; wheelAcc -= n * 50;
    if (c.endless) turnCtl(c, -n); else setCtl(c, Math.round((c.v - n / c.detents) * c.detents) / c.detents);
  } else setCtl(c, c.v - dy / 100 * 0.04 * (e.shiftKey ? 0.15 : 1));      // Shift: fine steps
}, { passive:false });

document.addEventListener('keydown', function(e){
  var tag = (e.target && e.target.tagName) || '', k = e.key.toLowerCase();
  if (e.key === 'Enter' && tag !== 'BUTTON'){ e.preventDefault(); if (!e.repeat){ unlock(); if (MP.guest) MP.guestSay(); else toggleSeq(); } return; }
  if (e.key === 'Shift'){ if (!e.repeat){ MXSHIFT = true; M.shift = true; MF.shift = true; BS.fn = true; TP.chomp = true; dispDirty = true; MF.dirty = true; if (mode === 'walk') running = true; } return; }   // Shift holds the shift button on every machine
  if (mode === 'tr' && LEAN.keys){                                       // the two keyboards: letters play notes, so only Esc steps back
    if (e.key === 'Escape'){ leaveTR(); return; }
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.key === 'Tab' || k === 'q'){ e.preventDefault(); if (!e.repeat) swapLean(); return; }
    if (e.key === ' '){ e.preventDefault(); if (!e.repeat) LEAN.keys.play(); return; }
    if (!e.repeat && LEAN.keys.down(k)) e.preventDefault();
    return;
  }
  if (mode === 'tr'){
    if (!(e.ctrlKey || e.metaKey) && ((k === 'e' && !e.repeat) || 'wasd'.indexOf(k) >= 0 && k.length === 1) || e.key === 'Escape'){ leaveTR(); return; }
    if (e.key === ' '){ e.preventDefault(); if (!e.repeat) toggleSeq(); return; }
    if (e.key === 'Tab' || k === 'q'){ e.preventDefault(); if (!e.repeat){ if (hasSeq(LEAN)) swapLean(); else if (k === 'q'){ LOOKUP.on = true; LOOKUP.yaw = 0; LOOKUP.pitch = 0; } } return; }
    if (LEAN === DEVS.mx){ var mi = ['Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5', 'Digit6', 'Digit7', 'Digit8', 'Digit9', 'Digit0'].indexOf(e.code); if (mi < 0) mi = '1234567890'.indexOf(e.key); if (mi >= 0 && !e.repeat){ if (e.shiftKey) mxSolo(mi); else mxMute(mi);      /* Shift + number solos; Shift is held, so these group */ } return; }      // 1-10 mute, with Shift solo
    if (LEAN.key && LEAN.key.indexOf('sn') === 0){                     // a Snake: 1-8 switch gates 1-8, with Shift gates 9-16
      if ((e.ctrlKey || e.metaKey) && k === 'z'){ e.preventDefault(); if (!e.repeat) for (var ui = 0; ui < SNAKES.length; ui++) if (SNAKES[ui].key === LEAN.key) SNAKES[ui].undo(); return; }      // Ctrl+Z undoes, on this Snake only
      if ((e.ctrlKey || e.metaKey) && !e.altKey && (k === 'c' || k === 'v')){ e.preventDefault(); if (!e.repeat) for (var ci = 0; ci < SNAKES.length; ci++) if (SNAKES[ci].key === LEAN.key){ if (k === 'c') SNAKES[ci].copyPage(); else SNAKES[ci].pastePage(); } return; }      // Ctrl+C / Ctrl+V: copy the page being shown, paste it on the other page or on another Snake
      if (e.ctrlKey || e.metaKey || e.altKey) return;                    // every other shortcut is the browser's (Ctrl+R reloads, as usual)
      var gi = ['Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5', 'Digit6', 'Digit7', 'Digit8'].indexOf(e.code); if (gi < 0 && !e.shiftKey) gi = '12345678'.indexOf(e.key);
      if (gi >= 0 && !e.repeat){ var gc = CT[LEAN.key + '_g' + (gi + (e.shiftKey ? 8 : 0))]; if (gc){ press(gc); release(gc); } } return; }
    if (LEAN === DEVS.tr){                                             // on the drum machine the number keys follow its mode
      if (e.code === 'Backquote' || e.key === '`' || e.key === '\u00AC'){ e.preventDefault(); if (!e.repeat){ M.kbHalf = M.kbHalf ? 0 : 1; say('KEYS 1-8  STEPS ' + (M.kbHalf ? '9-16' : '1-8'), 1600); } return; }
      if ((e.ctrlKey || e.metaKey) && !e.altKey && (k === 'c' || k === 'v')){                 /* Ctrl+C copies the variation being edited; go to another (A-H, Shift+1-8, even another pattern) and Ctrl+V lays it in. The COPY button works as before */
        e.preventDefault(); if (e.repeat) return; var VL = 'ABCDEFGH';
        if (k === 'c'){ M.clip = JSON.stringify(editV()); M.clipFrom = M.fillEdit ? 'FILL' : VL[M.editVar]; say('COPIED  VAR ' + M.clipFrom + '   CTRL+V TO PASTE', 2200); }
        else if (!M.clip) say('NOTHING COPIED  CTRL+C FIRST', 1800);
        else { setEditV(JSON.parse(M.clip)); say('PASTED  ' + M.clipFrom + ' > ' + (M.fillEdit ? 'FILL' : VL[M.editVar]), 1800); dispDirty = true; saveSoon(); }
        return; }
      var evi = ['Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5', 'Digit6', 'Digit7', 'Digit8'].indexOf(e.code);
      if (e.shiftKey && evi >= 0){ e.preventDefault(); if (!e.repeat){ M.editVar = evi; M.fillEdit = false; M.copyArm = false; say('EDIT  VAR ' + 'ABCDEFGH'[evi] + '   CHAIN  ' + M.varSel.map(function(x){ return 'ABCDEFGH'[x]; }).join(' '), 1800); dispDirty = true; saveSoon(); } return; }      /* Shift + 1-8: pick which variation (A-H) the steps edit, without touching what is chained to play */
      var ti = '1234567890-'.indexOf(e.key); if (ti < 0 || e.repeat) return;
      if (M.mode === 'instplay' || M.mode === 'instrec') hit(ti);        // playing: each key is a drum
      else if (M.mode === 'trrec' && ti < 8) pressPad((M.kbHalf ? 8 : 0) + ti);   // step record: keys 1-8 switch steps in the selected half
      return;
    }
    if (LEAN === DEVS.ec){ var si = ['Digit1', 'Digit2', 'Digit3', 'Digit4'].indexOf(e.code); if (si < 0 && !e.shiftKey) si = '1234'.indexOf(e.key); if (si >= 0 && !e.repeat && !(e.ctrlKey || e.metaKey || e.altKey)){ var sb = CT['scslot' + si]; if (sb){ press(sb); release(sb); } } return; }      // at the effects and scenes: 1-4 are the scenes (with Shift they chain)
    return;                                                            // the number keys play the drums only when leaned over the drum machine
  }
  if (SIT.on){ if ((k.length === 1 && 'wasdec '.indexOf(k) >= 0) || k.indexOf('arrow') === 0 || e.key === 'Escape'){ e.preventDefault(); if (!e.repeat) standUp(); } return; }      // seated: any move key, E, Space or Esc stands you up
  if (k === 'c' && !e.repeat){ crouch.on = true; return; }
  if (k === 'e' && !e.repeat){
    var hp = curAim(), ia = iaOf(hp), nd = nearDev();
    if (hp && ia === 'couch' && hp.distance <= REACH){ sitDown(seatNear(hp.object.userData.couch, 99)); return; }
    if (!(hp && (ia === 'ctl' || ia === 'trbody') && hp.distance <= REACH) && !nd){ var sn = seatNear(null, 1.3); if (sn >= 0){ sitDown(sn); return; } }
    if (hp && (ia === 'ctl' || ia === 'trbody') && hp.distance <= REACH) enterTR(devOf(hp)); else if (nd) enterTR(nd); else toast('Walk up to an instrument first');
    return;
  }
  if (tag === 'BUTTON' || tag === 'INPUT') return;
  if (e.key === ' '){ e.preventDefault(); unlock(); if (!e.repeat && JUMP.y <= 0.001) JUMP.v = 2.5; return; }
  if (k === 'r'){ cam.homing = true; cam.walkTo = null; return; }
  if (k === 'p'){ linesIdx = (linesIdx + 1) % LINES_OPTS.length; resize(); return; }
  keys[k] = true; if (k.indexOf('arrow') === 0) e.preventDefault();
  if ('wasd'.indexOf(k) >= 0 || k.indexOf('arrow') === 0){ cam.homing = false; cam.walkTo = null; unlock(); dimHint(); }
});
document.addEventListener('keyup', function(e){
  var k = e.key.toLowerCase(); keys[k] = false; mfKbUp(k); bsKbUp(k); amKbUp(k); tpKbUp(k); mbKbUp(k); shKbUp(k); mcKbUp(k); zkKbUp(k);
  if (k === 'c') crouch.on = false;
  if (e.key === 'Shift'){ MXSHIFT = false; running = false; M.shift = false; MF.shift = false; BS.fn = false; TP.chomp = false; dispDirty = true; MF.dirty = true; }
});

/* sound toggle */
var btnMute = document.getElementById('mute');
function paintMute(){ btnMute.setAttribute('aria-pressed', String(muted)); btnMute.setAttribute('aria-label', muted ? 'Unmute sound' : 'Mute sound'); }
btnMute.addEventListener('click', function(){ unlock(); muted = !muted; if (AU.out) AU.out.gain.value = muted ? 0 : OPT.vol; store('jambutek-muted', muted ? '1' : '0'); paintMute(); var ma = MP.menuAudio && MP.menuAudio(); if (ma) ma.muted = muted; });
paintMute();

/* ================= frame loop ================= */
var last = performance.now(), verFps = document.getElementById('verFps'), fpsN = 0, fpsAt = 0;
var eyeV = new THREE.Vector3(), lookV = new THREE.Vector3(), xhEl3 = document.getElementById('xh');
function smooth(u){ u = clamp(u, 0, 1); return u * u * (3 - 2 * u); }
/* ---- the "press play" pointer: a bright arrow hanging in the air over the drum machine's Start pad with a ring round the pad, drawn
   over everything like a game marker. It shows until the sequence has run once (whoever started it), then never again this visit. ---- */
var HINT = { g:null, ring:null, done:false, p:new THREE.Vector3() };
function hintBuild(){
  var g = new THREE.Group(), mat = new THREE.MeshBasicMaterial({ color:0x4DFF7A, depthTest:false, depthWrite:false, transparent:true, opacity:0.95 });
  var head = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.1, 4), mat); head.rotation.x = Math.PI; head.position.y = 0.05;
  var shaft = new THREE.Mesh(new THREE.BoxGeometry(0.032, 0.11, 0.032), mat); shaft.position.y = 0.155;
  var c = document.createElement('canvas'); c.width = 512; c.height = 160; var x = c.getContext('2d');
  x.fillStyle = 'rgba(6,10,8,.82)'; x.fillRect(0, 0, 512, 160); x.strokeStyle = '#4DFF7A'; x.lineWidth = 8; x.strokeRect(4, 4, 504, 152);
  x.fillStyle = '#4DFF7A'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.font = "bold 84px 'Anton', Impact, 'Arial Narrow', sans-serif"; x.fillText('PRESS PLAY', 256, 86);
  var tex = new THREE.CanvasTexture(c); tex.minFilter = THREE.LinearFilter;
  var tag = new THREE.Sprite(new THREE.SpriteMaterial({ map:tex, transparent:true, depthTest:false, depthWrite:false })); tag.scale.set(0.4, 0.125, 1); tag.position.y = 0.3;
  [head, shaft, tag].forEach(function(o){ o.renderOrder = 60; g.add(o); });
  var ring = new THREE.Mesh(new THREE.RingGeometry(0.03, 0.038, 24), new THREE.MeshBasicMaterial({ color:0x4DFF7A, depthTest:false, depthWrite:false, transparent:true, side:THREE.DoubleSide }));
  ring.rotation.x = -Math.PI / 2; ring.renderOrder = 60;
  g.visible = ring.visible = false; scene.add(g); scene.add(ring); HINT.g = g; HINT.ring = ring;
}
function hintUpdate(now){
  if (HINT.done) return; if (M.playing){ HINT.done = true; if (HINT.g){ HINT.g.visible = HINT.ring.visible = false; } return; }
  var show = !MP.lobbyOpen && !SPEC.on && CT.start && CT.start.m && (mode !== 'tr' || (LEAN && LEAN.key === 'tr')); if (!show){ if (HINT.g) HINT.g.visible = HINT.ring.visible = false; return; }
  if (!HINT.g) hintBuild();
  CT.start.m.getWorldPosition(HINT.p); var d = camera.position.distanceTo(HINT.p), s = clamp(0.1 + d * 0.62, 0.32, 1.9),      // sized by how far the eye is, so it stays modest when leaned over the drum machine
       b = Math.sin(now * 0.005);
  HINT.g.visible = HINT.ring.visible = true; HINT.g.position.set(HINT.p.x, HINT.p.y + 0.035 + (0.03 + b * 0.022) * s, HINT.p.z); HINT.g.scale.setScalar(s); HINT.g.children[0].rotation.y = HINT.g.children[1].rotation.y = now * 0.003;
  var rp = (now * 0.0012) % 1; HINT.ring.position.set(HINT.p.x, HINT.p.y + 0.012, HINT.p.z); HINT.ring.scale.setScalar(0.7 + rp * 1.8); HINT.ring.material.opacity = 1 - rp;
}
function frame(now){
  requestAnimationFrame(frame);
  fpsN++; if (now - fpsAt > 500){ verFps.textContent = 'studio v0.271 · ' + Math.round(fpsN * 1000 / (now - fpsAt)) + ' FPS'; fpsN = 0; fpsAt = now; }
  var dt = Math.min(0.05, (now - last) / 1000); last = now;
  var tsec = now / 1000;

  if (mode === 'walk'){
    var mv = 0, st = 0, turn = 0;
    if (keys.w || keys.arrowup) mv += 1; if (keys.s || keys.arrowdown) mv -= 1;
    if (keys.d) st += 1; if (keys.a) st -= 1;
    if (keys.arrowleft) turn += 1; if (keys.arrowright) turn -= 1;
    cam.ty += turn * 1.8 * dt;
    if (MP.emoting() || SPEC.on){ mv = 0; st = 0; cam.walkTo = null; cam.homing = false; }      // an emote plays on the spot; a spectator's eye is fixed
    if (SPEC.on){ MP.specTick(dt); cam.x = SPEC.x; cam.z = SPEC.z; }
    if (mv || st){
      var sp = (crouch.on ? 1.0 : running ? 3.3 : 2.1) * dt, fy = cam.yaw;
      cam.x += (-Math.sin(fy) * mv + Math.cos(fy) * st) * sp;
      cam.z += (-Math.cos(fy) * mv - Math.sin(fy) * st) * sp;
    } else if (cam.walkTo){
      var wx = cam.walkTo.x - cam.x, wz = cam.walkTo.z - cam.z, wd = Math.hypot(wx, wz);
      if (wd < 0.5) cam.walkTo = null;
      else { var ws = Math.min(wd - 0.45, 2.1 * dt); cam.x += wx / wd * ws; cam.z += wz / wd * ws;
        var want = Math.atan2(-wx, -wz), dy0 = ((want - cam.ty + Math.PI) % (Math.PI*2) + Math.PI*2) % (Math.PI*2) - Math.PI;
        cam.ty += dy0 * (1 - Math.exp(-dt * 4)); }
    }
    if (cam.homing){
      var hk = 1 - Math.exp(-dt * 3.2);
      cam.x = lerp(cam.x, HOME.x, hk); cam.z = lerp(cam.z, HOME.z, hk);
      var dyaw = ((HOME.yaw - cam.ty + Math.PI) % (Math.PI*2) + Math.PI*2) % (Math.PI*2) - Math.PI;
      cam.ty += dyaw * hk; cam.tp = lerp(cam.tp, HOME.pitch, hk);
      if (Math.abs(cam.x - HOME.x) + Math.abs(cam.z - HOME.z) + Math.abs(dyaw) < 0.01) cam.homing = false;
    }
    if (!SPEC.on) collide();
    var ck = locked ? 1 : 1 - Math.exp(-dt * 12);
    cam.yaw = lerp(cam.yaw, cam.ty, ck); cam.pitch = lerp(cam.pitch, cam.tp, ck);
  }

  sitTick(dt);
  var moving = (keys.w || keys.s || keys.a || keys.d || cam.walkTo) && mode === 'walk' && !SIT.on;
  var bob = reduce ? 0 : (moving ? Math.sin(tsec * 9) * 0.018 : Math.sin(tsec * 1.1) * 0.006);
  crouch.k = lerp(crouch.k, crouch.on && mode === 'walk' ? 1 : 0, 1 - Math.exp(-dt * 10));
  if (JUMP.y > 0 || JUMP.v > 0){ JUMP.v -= 9.8 * dt; JUMP.y += JUMP.v * dt; if (JUMP.y <= 0){ JUMP.y = 0; JUMP.v = 0; } }
  var ex = cam.x, ey = EYE - crouch.k * 0.62 + JUMP.y + bob, ez = cam.z;
  if (SIT.k > 0.002){ var sk = smooth(SIT.k), SS = SEATS[SIT.seat]; ey = lerp(ey, SITEYE, sk); ex += SS.dx * 0.1 * sk; ez += SS.dz * 0.1 * sk; }      // seated: the eye drops to head height on the couch
  var lx2 = ex - Math.sin(cam.yaw) * Math.cos(cam.pitch), ly2 = ey + Math.sin(cam.pitch), lz2 = ez - Math.cos(cam.yaw) * Math.cos(cam.pitch);
  trBlend = lerp(trBlend, mode === 'tr' ? 1 : 0, 1 - Math.exp(-dt * 5));
  if (trBlend > 0.001){
    trPose(eyeV, lookV); var tk = smooth(trBlend);
    ex = lerp(ex, eyeV.x, tk); ey = lerp(ey, eyeV.y, tk); ez = lerp(ez, eyeV.z, tk);
    lx2 = lerp(lx2, lookV.x, tk); ly2 = lerp(ly2, lookV.y, tk); lz2 = lerp(lz2, lookV.z, tk);
  }
  LOOKUP.k = lerp(LOOKUP.k, LOOKUP.on && mode === 'tr' ? 1 : 0, 1 - Math.exp(-dt * 7)); if (mode !== 'tr') LOOKUP.on = false;
  if (LOOKUP.k > 0.002){ var uy = LEAN.yaw + LOOKUP.yaw, up = -0.05 + LOOKUP.pitch, uk = smooth(LOOKUP.k), ud = 0.8;      // the eye stays over the machine; only where it looks changes
    lx2 = lerp(lx2, ex - Math.sin(uy) * Math.cos(up) * ud, uk); ly2 = lerp(ly2, ey + Math.sin(up) * ud, uk); lz2 = lerp(lz2, ez - Math.cos(uy) * Math.cos(up) * ud, uk); }
  if (SPEC.on){ var sy = SPEC.y - ey; ey += sy; ly2 += sy; }
  if (MP.lobbyOpen){ var oa = now * 0.000045, orr = 3.3; ex = RIG.x + Math.sin(oa) * orr; ez = RIG.z + Math.cos(oa) * orr; ey = 2.3; lx2 = RIG.x; ly2 = 1.0; lz2 = RIG.z; }      // behind the lobby the view circles the rig slowly      // a spectator camera: same look, fixed height
  var k3 = MP.view3(dt);                                        // an emote is playing: step back and look at yourself
  var xh3 = k3 > 0.15 ? '0' : ''; if (xhEl3.style.opacity !== xh3) xhEl3.style.opacity = xh3;      // no crosshair or labels over your own back
  if (k3 > 0){
    var yw3 = SIT.on ? SEATS[SIT.seat].yaw + Math.PI + 0.4 : cam.yaw;      // seated, the view steps out in front of the couch (behind you is the wall) and looks back at you
    var p3 = SIT.on ? -0.2 : clamp(cam.pitch - 0.22, -1.2, 0.45), tx3 = cam.x, ty3 = SIT.on ? 0.95 : 1.15 - crouch.k * 0.4 + JUMP.y, tz3 = cam.z, bx = Math.sin(yw3) * Math.cos(p3), by = -Math.sin(p3), bz = Math.cos(yw3) * Math.cos(p3), d3 = SIT.on ? 2.3 : 2.7;
    eyeV.set(tx3, ty3, tz3); lookV.set(bx, by, bz).normalize(); ray.set(eyeV, lookV); ray.far = d3 + 0.25; var h3 = ray.intersectObjects(solids, false); if (h3.length) d3 = clamp(h3[0].distance - 0.25, 0.7, d3);
    var cx3 = clamp(tx3 + bx * d3, ROOM.x0 + 0.25, ROOM.x1 - 0.25), cy3 = clamp(ty3 + by * d3, 0.35, ROOM.h - 0.3), cz3 = clamp(tz3 + bz * d3, ROOM.z0 + 0.25, ROOM.z1 - 0.25), s3 = smooth(k3);
    ex = lerp(ex, cx3, s3); ey = lerp(ey, cy3, s3); ez = lerp(ez, cz3, s3); lx2 = lerp(lx2, tx3, s3); ly2 = lerp(ly2, ty3, s3); lz2 = lerp(lz2, tz3, s3);
  }
  hintUpdate(now);
  var wf = MP.specFov() || baseFov; if (Math.abs(camera.fov - wf) > 0.01){ camera.fov = Math.abs(camera.fov - wf) < 0.3 ? wf : lerp(camera.fov, wf, 1 - Math.exp(-dt * 12)); camera.updateProjectionMatrix(); }      // the top camera has its own, wider lens
  camera.position.set(ex, ey, ez); camera.lookAt(lx2, ly2, lz2); camera.updateMatrixWorld(); lodUpdate(); stkTick();

  /* what the crosshair (or mouse) is on */
  var cen = centred(), xs = cen && mode === 'walk'; if (xh.hidden === xs) xh.hidden = !xs;
  var ns = mode === 'walk' && Math.hypot(cam.x - RIG.x, cam.z - RIG.z) < 3.7; if (ns !== nearSharp){ nearSharp = ns; resize(); }
  if (!drag){
    var hit = cen ? aim() : (pointer.in && !look ? aim(new THREE.Vector2(pointer.x, pointer.y)) : null);
    var hc = touchOnly && mode === 'walk' ? null : ctlOf(hit), lab = hit ? labelFor(hit) : null, scrolly = hc && (hc.kind === 'knob' || hc.kind === 'fader');
    setHover(hc);
    if (cen){ xh.classList.toggle('hot', !!lab && lab !== 'Get closer'); xhLab.textContent = lab || ''; tip.hidden = true; }
    else {
      var cls = hc ? (scrolly ? 'grab' : 'point') : ''; if (canvas.className !== cls) canvas.className = cls;
      if (lab && !touchOnly && (hc || mode === 'walk')){ if (!hc && lab !== 'Get closer' && canvas.className !== 'point') canvas.className = 'point'; tip.hidden = false; tip.textContent = lab; tip.style.left = pointer.cx + 'px'; tip.style.top = pointer.cy + 'px'; } else tip.hidden = true;
    }
  } else {
    var dl = labelOf(drag.c);
    if (cen) xhLab.textContent = dl; else { tip.hidden = false; tip.textContent = dl; tip.style.left = pointer.cx + 'px'; tip.style.top = pointer.cy + 'px'; }
  }

  updateTR(now, dt); mfUpdate(now, dt); bsUpdate(now, dt); mxUpdate(now, dt); ecUpdate(now, dt); rvUpdate(now, dt); scUpdate(now, dt); snUpdate(now, dt); mbUpdate(now, dt); zkUpdate(now, dt); shUpdate(now, dt); wallUpdate(now); scopeUpdate(); monUpdate(); flowUpdate(now, dt); bzUpdate(now, dt); mcUpdate(now, dt); skUpdate(now, dt); MP.tick(now, dt); amUpdate(now, dt); tpUpdate(now, dt);
  var kick = SEQ.kick; snLightUpdate(dt);
  monitors.forEach(function(m){ var s = 1 + kick * 0.025; m.spk.scale.set(s, s, 1); var q = 0.3 + clamp(kick, 0, 1) * 0.7; m.mat.color.setRGB(q, q, q); });
  trLamp.light.intensity = trLamp.base * (1 + kick * 0.08);
  var lp = reduce ? 1 : logoPower(now); var kp = clamp(kick, 0, 1.2);                                   // the neon jambu pumps with the kick, like the speaker cones
  logo.face.emissiveIntensity = (0.12 + 0.48 * lp) * (1 + kp * 0.9); logo.side.emissiveIntensity = (0.1 + 1.2 * lp) * (1 + kp * 1.1); logoGlow.intensity = (0.15 + 1.1 * lp) * (1 + kp * 1.6); logoHalo.material.opacity = Math.min(0.95, (0.05 + 0.32 * lp) * (1 + kp * 1.5)); logoHalo.scale.setScalar(1 + kp * 0.22); logo.mesh.scale.setScalar(0.82 * (1 + kp * 0.035));

  post.uniforms.time.value = tsec;
  var dofN = MP.dofNow(); post.uniforms.aper.value = lerp(post.uniforms.aper.value, dofN ? dofN.a : 0, 1 - Math.exp(-dt * 10)); if (dofN) post.uniforms.focus.value = lerp(post.uniforms.focus.value, dofN.f, 1 - Math.exp(-dt * 12));
  post.uniforms.fxScale.value = lerp(1, Math.max(1, post.uniforms.res.value.y / 300), mode === 'tr' ? 1 : 0);
  
  renderer.setRenderTarget(rt); renderer.render(scene, camera);
  renderer.setRenderTarget(null); renderer.render(postScene, postCam);
}

/* ================= go ================= */
var started = false;
function shadowEverything(){
  scene.traverse(function(m){
    if (!m.isMesh || m.userData.noShadow) return;
    var mats = Array.isArray(m.material) ? m.material : [m.material];
    if (mats.some(function(x){ return !x || x.visible === false || (x.transparent && x.opacity < 0.95 && !x.alphaTest); })) return;
    var lit = mats.some(function(x){ return x.isMeshLambertMaterial || x.isMeshPhongMaterial; });
    if (m.geometry.boundingSphere === null) m.geometry.computeBoundingSphere();
    var huge = m.geometry.boundingSphere.radius * Math.max(m.scale.x, m.scale.y, m.scale.z) > 3.5;
    if (!huge && lit) m.castShadow = true;
    if (lit) m.receiveShadow = true;
  });
}
function ready(){
  if (started) return; started = true;
  shadowEverything(); renderer.shadowMap.autoUpdate = false; renderer.shadowMap.needsUpdate = true;
  resize(); refreshLockUi(); dimHint();
  document.getElementById('loading').classList.add('gone');
  requestAnimationFrame(frame);
  MP.check();
}
setTimeout(ready, 4000);                          // never sit on the loading screen if an image is slow
window.__studio = { RK:RK, hit:hit, unlock:unlock, pat:pat, mxDuck:mxDuck, scopeUpdate:scopeUpdate, SCOPE:SCOPE, skSeqAt:skSeqAt, skA:function(){ return SKA; }, bzUpdate:bzUpdate, flowUpdate:flowUpdate, snUpdate:snUpdate, updateTR:updateTR, mxUpdate:mxUpdate, FX:FX, RV:RV, rvA:function(){ return RVA; }, ZK:ZK, zkA:function(){ return ZKA; }, JAMS:JAMS, loadJam:loadJam, jamOpen:jamOpen, VID:VID, BZ:BZ, vidSet:vidSet, LOD:LOD, renderer:renderer, scene:scene, startCtl:startCtl, endCtl:endCtl, M:M, auCh:function(i){ return AU.ch[i]; }, press:press, release:release, EC:EC, ecA:function(){ return ECA; }, setCtl:setCtl, SK:SK, MC:MC, PF:PF, logoGlow:logoGlow, MP:MP, SEQ:SEQ, ac:function(){ return ac; }, shKeyDown:function(n){ shKeyDown(n); }, shKeyUp:function(n){ shKeyUp(n); }, setBpm:function(b){ setBpm(b); }, patternDump:patternDump, mode:function(){ return mode; }, lean:function(){ return LEAN && LEAN.key; }, PATS:function(){ return PAT; }, AM:AM, TP:TP, amKeyDown:amKeyDown, amKeyUp:amKeyUp, tpKeyDown:tpKeyDown, tpKeyUp:tpKeyUp, SNAKES:SNAKES, MB:MB, SH:SH, mbNoteAt:mbNoteAt, shNoteAt:shNoteAt, BS:BS, MX:MX, bsKeyDown:bsKeyDown, bsKeyUp:bsKeyUp, mxMute:mxMute, MF:MF, DEVS:DEVS, mfKeyDown:mfKeyDown, mfKeyUp:mfKeyUp, mfAudio:mfAudio, MFA:function(){ return MFA; }, mfLoad:mfLoad, MFG:MFG, CTLIST:CTLIST, renderVoice:function(i, tone, p){ var real = ac, off = new OfflineAudioContext(1, Math.round(real.sampleRate * 2.5), real.sampleRate), err = null; ac = off; AU.openHat = null; try { VOICES[i](off.destination, 0.01, 0.8, p || { tune:0.5, decay:0.5, ctrl:0.5 }, tone); } catch (e) { err = String(e); } ac = real; AU.openHat = null; return off.startRendering().then(function(b){ var d = b.getChannelData(0), pk = 0, sq = 0, bad = 0, lastLoud = 0; for (var k = 0; k < d.length; k++){ var a = Math.abs(d[k]); if (!(a >= 0)) bad++; if (a > pk) pk = a; sq += a * a; if (a > 0.003) lastLoud = k; } return { err:err, peak:+pk.toFixed(3), rms:+Math.sqrt(sq / d.length).toFixed(4), bad:bad, len:+(lastLoud / real.sampleRate).toFixed(2) }; }); }, aim:aim, pointer:pointer,  M:M, CT:CT, SEQ:SEQ, PAT:PAT, SIT:SIT, SEATS:SEATS, STK:STK, stkTake:stkTake, stkPlace:stkPlace, act:act, iaOf:iaOf, labelFor:labelFor, cam:cam, press:press, release:release, setCtl:setCtl, turnCtl:turnCtl, enterTR:enterTR, leaveTR:leaveTR, start:startSeq, stop:stopSeq, AU:AU, TRG:TRG, camera:camera };
})();
