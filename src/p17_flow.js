
/* ================= the LED pattern synths, after Patternflow =================
   Two of them, in booths in opposite corners of the room, twinned: turn a knob on one and the other follows. Each has a 128 x 64 LED screen on the ceiling showing the same picture; the two
   screens sit side by side over the rig and make a square. Four endless knobs and the same picture on the unit's own panel. The patterns are Patternflow's own (vendor/patternflow-patterns.js, CC BY-SA 4.0),
   each one computed live every frame. Knobs follow Patternflow's model: 48 clicks cross a knob's range, patterns that
   name their knobs set the ranges, the rest get Hue / Speed / Mode / Freq. */
var PFW = 340, PFD = 236, PFH = 1.1, PFTILT = 0.56, PFLW = 128, PFLH = 64;
function fx(u){ return (u - PFW / 2) * SC; }
function fz(u){ return (u - PFD / 2) * SC; }
var PFLIST = (typeof PFPATS !== 'undefined' && PFPATS) || [];
var PFDEF = { ranges:[[0, 1], [0.1, 10], [0, 4.9], [0, 1]], vals:[0, 2, 0, 0.06], wrap:[true, false, false, true], names:['Hue', 'Speed', 'Mode', 'Freq'] };
function makeFlow(DK, PFPOS, SKEY, SCRZ, SCRROT, PAT0, TAG, M){          // M: the unit this one is twinned with. A twin shares its state and picture, so both units and both screens always match
  var PFY = new THREE.Group(); PFY.position.set(PFPOS.x, PFH, PFPOS.z); PFY.rotation.y = PFPOS.r; scene.add(PFY);
  var PFG = new THREE.Group(); PFG.rotation.x = PFTILT; PFY.add(PFG);
  var PF = { on:!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches), pat:0, vals:PFDEF.vals.slice(), fed:null, boot:0, btn:[false, false, false, false],
             mod:null, params:{}, ranges:PFDEF.ranges, wrap:PFDEF.wrap, names:PFDEF.names, defs:PFDEF.vals, t:0, acc:0, cost:4, hz:30, dirty:true, dark:false, glow:[0, 0, 0] };
  if (M) PF = M.PF;
  var pfC = mk(PFLW, PFLH), pfCtx = pfC.getContext('2d'), pfImg = pfCtx.createImageData(PFLW, PFLH), pfBuf = pfImg.data, pfTex = canvasTex(pfC);
  pfTex.magFilter = THREE.NearestFilter; pfTex.minFilter = THREE.LinearFilter; pfTex.generateMipmaps = false;
  if (M){ pfC = M.c; pfCtx = M.ctx; pfImg = M.img; pfBuf = M.buf; pfTex = M.tex; }
  var pfDisplay = { width:PFLW, height:PFLH, setPixel:function(x, y, r, g, b){ if (x < 0 || y < 0 || x >= PFLW || y >= PFLH) return; var o = ((y | 0) * PFLW + (x | 0)) * 4; pfBuf[o] = r; pfBuf[o + 1] = g; pfBuf[o + 2] = b; } };
  function pfClear(){ for (var i = 0; i < pfBuf.length; i += 4){ pfBuf[i] = pfBuf[i + 1] = pfBuf[i + 2] = 0; pfBuf[i + 3] = 255; } }
  if (!M){ pfClear(); pfCtx.putImageData(pfImg, 0, 0); }
  // its screen on the ceiling
  var pfGlow = new THREE.PointLight(0xffffff, 0, 6, 1.5); pfGlow.position.set(RIG.x, ROOM.h - 0.5, SCRZ); scene.add(pfGlow);
  (function(){
    var frame = new THREE.Mesh(new THREE.BoxGeometry(SCRW + 0.1, 0.06, SCRW / 2 + 0.06), new THREE.MeshLambertMaterial({ color:0x08090B })); frame.position.set(RIG.x, ROOM.h - 0.035, SCRZ); frame.userData.noShadow = true; scene.add(frame);
    var scr = new THREE.Mesh(new THREE.PlaneGeometry(SCRW, SCRW / 2), new THREE.MeshBasicMaterial({ map:pfTex })); scr.position.set(RIG.x, ROOM.h - 0.068, SCRZ); scr.rotation.x = Math.PI / 2; scr.rotation.z = SCRROT; scr.userData.noShadow = true; scene.add(scr);
  })();
  // the booth: a counter across the corner, the unit behind it
  (function(){
    var fx0 = PFPOS.x - Math.sin(PFPOS.r) * 0.5, fz0 = PFPOS.z - Math.cos(PFPOS.r) * 0.5, blk = new THREE.MeshLambertMaterial({ color:0x2A2D35 });
    pendant(PFPOS.x - Math.sin(PFPOS.r) * 0.9, PFPOS.z - Math.cos(PFPOS.r) * 0.9, 0.75, 0xFFE7C8, 2.8, PFPOS.x, 0.9, PFPOS.z, 0.8, false, true);                 // a small lamp over the booth so it reads from across the room
  var c = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.92, 0.07), blk); c.position.set(fx0, 0.46, fz0); c.rotation.y = PFPOS.r; scene.add(c);
    var t = new THREE.Mesh(new THREE.BoxGeometry(1.56, 0.035, 0.2), woodMat); t.position.set(fx0, 0.935, fz0); t.rotation.y = PFPOS.r; scene.add(t); solid(c, 'booth'); solid(t, 'booth');
    for (var i = -2; i <= 2; i++){ var bx = fx0 + Math.cos(PFPOS.r) * i * 0.32, bz = fz0 - Math.sin(PFPOS.r) * i * 0.32; BLOCKS.push([bx - 0.17, bx + 0.17, bz - 0.17, bz + 0.17]); }
  })();
  // the instrument
  var pfPanC = mk(PFW * 5, PFD * 5), pfPanT = null, pfDispC = mk(880, 96), pfDispT = canvasTex(pfDispC); pfDispT.minFilter = THREE.LinearFilter; pfDispT.magFilter = THREE.LinearFilter;
  if (M){ pfDispC = M.dc; pfDispT = M.dt; }
  var PFKX = [70, 136, 204, 270];
  (function(){
    var g = pfPanC.getContext('2d'); g.setTransform(5, 0, 0, 5, 0, 0); g.fillStyle = '#1A1B1F'; g.fillRect(0, 0, PFW, PFD);
    for (var i = 0; i < 2500; i++){ g.fillStyle = 'rgba(' + (Math.random() < .5 ? '0,0,0' : '255,255,255') + ',' + rnd(.01, .04) + ')'; g.fillRect(Math.random() * PFW, Math.random() * PFD, .5, .3); }
    function T(s, x, y, size, col, al){ g.font = 'bold ' + size + 'px "Helvetica Neue", Helvetica, Arial, sans-serif'; g.fillStyle = col || '#D8D8D8'; g.textAlign = al || 'center'; g.textBaseline = 'middle'; g.fillText(s, x, y); }
    g.fillStyle = '#000'; g.fillRect(17, 6, 306, 156); g.fillRect(58, 166.5, 224, 19);
    [[6, 6], [334, 6], [6, 230], [334, 230]].forEach(function(p){ g.fillStyle = '#050506'; g.beginPath(); g.arc(p[0], p[1], 2, 0, 7); g.fill(); });
    T('PATTERN', 36, 190, 3, '#8A8C92'); T('PATTERN', 304, 190, 3, '#8A8C92'); T('K1', PFKX[0], 228.5, 3.4); T('K2', PFKX[1], 228.5, 3.4); T('K3', PFKX[2], 228.5, 3.4); T('K4', PFKX[3], 228.5, 3.4); T('LIGHT', 318, 228.5, 3, '#8A8C92'); T(TAG, 332, 201, 4.6, '#56C6FF', 'right');
    T('PATTERNFLOW', 8, 201, 4.6, '#D8D8D8', 'left'); T('by Seunghun Lee', 8, 206.5, 2.6, '#8A8C92', 'left'); T('& contributors', 8, 210, 2.6, '#8A8C92', 'left'); T('patterns CC BY-SA 4.0', 8, 215.5, 2.4, '#8A8C92', 'left');
    g.setTransform(1, 0, 0, 1, 0, 0); pfPanT = smoothTex(pfPanC);
    var W2 = PFW * SC, D2 = PFD * SC, TH = 0.07;
    var top = new THREE.Mesh(new THREE.PlaneGeometry(W2, D2), new THREE.MeshPhongMaterial({ color:0x707070, map:pfPanT, emissive:0xffffff, emissiveMap:pfPanT, emissiveIntensity:1.0, shininess:6, specular:0x000000 })); top.rotation.x = -Math.PI / 2; PFG.add(top);
    var body = new THREE.Mesh(new THREE.BoxGeometry(W2 + 0.006, TH, D2 + 0.006), new THREE.MeshPhongMaterial({ color:0x121316, shininess:30, specular:0x222222, flatShading:true })); body.position.y = -TH / 2 - 0.0015; PFG.add(body);
    standFor(PFY, PFG, W2, D2, TH, PFH, PFTILT, 0.26); devBody(PFY, DK); BLOCKS.push(devBlock(PFPOS, 0.46));
    var led = new THREE.Mesh(new THREE.PlaneGeometry(300 * SC, 150 * SC), new THREE.MeshBasicMaterial({ map:pfTex })); led.rotation.x = -Math.PI / 2; led.position.set(fx(170), 0.002, fz(84)); led.userData.noShadow = true; led.userData.ia = 'trbody'; led.userData.dev = DK; PFG.add(led); solids.push(led);
    var d = new THREE.Mesh(new THREE.PlaneGeometry(220 * SC, 24 * SC * 0.72), new THREE.MeshBasicMaterial({ map:pfDispT })); d.rotation.x = -Math.PI / 2; d.position.set(fx(170), 0.002, fz(176)); d.userData.noShadow = true; d.userData.ia = 'trbody'; d.userData.dev = DK; PFG.add(d); solids.push(d);
  })();
  HOST = PFG; LX = fx; LZ = fz; DEV = DK; FACE = { bg:'#C9C7C0', fg:'#0B0B0D' };
  PFKX.forEach(function(x, i){ var c = knob(DK + 'k' + i, x, 210, 8, 'Knob ' + (i + 1), 0, { h:11, endless:true, sides:16, color:0x3A3C42 }); c.ki = i; c.click = function(){ PF.btn[i] = true; PF.dirty = true; }; });
  button(DK + 'prev', 36, 176, 22, 13, '◀', 'Previous pattern', 0xFFFFFF); button(DK + 'next', 304, 176, 22, 13, '▶', 'Next pattern', 0xFFFFFF); button(DK + 'pow', 318, 212, 16, 12, 'ON', 'Light on / off', 0x3BFF6A);
  HOST = TRG; LX = lx; LZ = lz; DEV = null;

  function pfFmt(v, r){ var sp = r[1] - r[0]; return sp >= 50 ? String(Math.round(v)) : sp >= 5 ? v.toFixed(1) : v.toFixed(2); }
  function pfLoad(i, vals){
    if (!PFLIST.length) return; i = ((i % PFLIST.length) + PFLIST.length) % PFLIST.length; var P = PFLIST[i], K = P.meta.knobs;
    PF.pat = i; PF.ranges = PFDEF.ranges.map(function(r, k){ return K && K[k] ? [K[k][1], K[k][2]] : r; }); PF.wrap = PFDEF.wrap.map(function(w, k){ return K && K[k] ? false : w; });
    PF.names = PFDEF.names.map(function(n, k){ return K && K[k] ? K[k][0] : n; }); PF.defs = PFDEF.vals.map(function(v, k){ return K && K[k] ? (K[k][1] + K[k][2]) / 2 : v; });
    PF.vals = (vals && vals.length === 4 ? vals : PF.defs).map(function(v, k){ return clamp(+v || 0, PF.ranges[k][0], PF.ranges[k][1]); });
    PF.fed = PF.defs.slice(); PF.boot = 2; PF.t = 0; PF.params = {}; PF.btn = [false, false, false, false]; PF.dirty = true;
    try { PF.mod = P.make(); PF.mod.setup(PF.params); } catch (e) { PF.mod = null; }
  }
  function pfState(){ return JSON.stringify({ v:1, id:PFLIST[PF.pat] ? PFLIST[PF.pat].meta.id : '', vals:PF.vals.map(function(v){ return +v.toFixed(4); }), on:PF.on ? 1 : 0 }); }
  var pfSaveT = null; function pfSaveNow(){ store(SKEY, pfState()); } function pfSaveSoon(){ clearTimeout(pfSaveT); pfSaveT = setTimeout(pfSaveNow, saveMs(900)); }
  function pfRestore(first){ try { var s = JSON.parse(store(SKEY) || 'null'); if (!s || s.v !== 1) { if (first) pfLoad(PAT0); return; }
    var i = -1; PFLIST.forEach(function(p, k){ if (p.meta.id === s.id) i = k; }); if (i < 0) i = 0;
    if (first || i !== PF.pat) pfLoad(i, s.vals); else if (Array.isArray(s.vals) && s.vals.length === 4){ PF.vals = s.vals.map(function(v, k){ return clamp(+v || 0, PF.ranges[k][0], PF.ranges[k][1]); }); PF.dirty = true; }
    if (!first || s.on === 0) PF.on = s.on !== 0 && (first ? PF.on : true); } catch (e) { if (first) pfLoad(PAT0); } }
  if (!M){ pfRestore(true); RESTORE[SKEY] = function(){ pfRestore(false); }; SAVENOW.push(pfSaveNow); }
  function pfLabel(c){
    if (c.ki != null) return PF.names[c.ki] + ' ' + pfFmt(PF.vals[c.ki], PF.ranges[c.ki]) + ' · scroll or drag, click resets';
    if (c.id === DK + 'pow') return 'Light ' + (PF.on ? 'on' : 'off') + ' · click';
    return c.name + ' · click';
  }
  function pfPress(c){
    c.down = 1; setTimeout(function(){ c.down = 0; }, 130);
    if (c.id === DK + 'pow'){ PF.on = !PF.on; PF.dirty = true; }
    else pfLoad(PF.pat + (c.id === DK + 'next' ? 1 : -1));
    pfSaveSoon();
  }
  function pfTurn(c, n){
    var i = c.ki; if (i == null) return; var r = PF.ranges[i], sp = r[1] - r[0], v = PF.vals[i] + n * sp / 48;
    PF.vals[i] = PF.wrap[i] ? r[0] + ((((v - r[0]) % sp) + sp) % sp) : clamp(v, r[0], r[1]); PF.dirty = true; pfSaveSoon();
  }
  DEVH[DK] = { label:pfLabel, press:pfPress, release:NOP, ctl:NOP, turn:pfTurn };
  function pfPaintDisp(){
    var g = pfDispC.getContext('2d'), P = PFLIST[PF.pat]; g.fillStyle = '#020304'; g.fillRect(0, 0, 880, 96); if (!P) return;
    g.textBaseline = 'middle'; g.textAlign = 'left'; g.font = 'bold 34px "Helvetica Neue", Helvetica, Arial, sans-serif'; g.fillStyle = PF.on ? '#F4F4F0' : '#6A6C72';
    g.fillText((PF.pat + 1) + '/' + PFLIST.length + '  ' + P.meta.name, 14, 26); g.font = '22px "Helvetica Neue", Helvetica, Arial, sans-serif'; g.fillStyle = '#8A8C92'; g.textAlign = 'right'; g.fillText(String(P.meta.desc || '').slice(0, 46), 866, 26);
    g.textAlign = 'left'; g.font = 'bold 24px "Helvetica Neue", Helvetica, Arial, sans-serif';
    for (var i = 0; i < 4; i++){ g.fillStyle = '#56C6FF'; g.fillText(PF.names[i].slice(0, 9), 14 + i * 218, 70); g.fillStyle = '#F4F4F0'; g.fillText(pfFmt(PF.vals[i], PF.ranges[i]), 14 + i * 218 + 128, 70); }
    pfDispT.needsUpdate = true;
  }
  function pfStep(dt){
    var m = PF.mod; if (!m) return; var feed = PF.boot > 1 ? PF.defs : PF.vals, prev = PF.fed || feed, deltas = [0, 0, 0, 0];
    for (var i = 0; i < 4; i++){ var r = PF.ranges[i], sp = r[1] - r[0], d = feed[i] - prev[i]; if (PF.wrap[i]){ if (d > sp / 2) d -= sp; else if (d < -sp / 2) d += sp; } deltas[i] = d * 48 / sp; }
    if (PF.boot > 0) PF.boot--; PF.fed = feed.slice(); PF.t += dt;
    var input = { knobDeltas:deltas, knobValues:feed.slice(), knobNormalized:feed.map(function(v, k){ return (v - PF.ranges[k][0]) / Math.max(0.0001, PF.ranges[k][1] - PF.ranges[k][0]); }), knobRanges:PF.ranges, btnPressed:PF.btn, btnHeld:PF.btn.slice() };
    pfClear(); m.update(dt, input, PF.params); m.draw(pfDisplay, PF.params, PF.t); PF.btn = [false, false, false, false];
  }
  function flowTick(now, dt){
    [DK + 'prev', DK + 'next', DK + 'pow'].forEach(function(id){ var c = CT[id], L = id === DK + 'pow' ? (PF.on ? 1 : 0.05) : (c.down ? 1 : 0.1); if (L !== c.lit){ c.lit = L; c.paintLit(); } var ty = c.y0 - (c.down ? 0.003 : 0); if (c.m.position.y !== ty) c.m.position.y = ty; });
    if (M){ pfGlow.color.copy(M.glow.color); pfGlow.intensity = M.glow.intensity; return; }
    if (PF.dirty){ PF.dirty = false; pfPaintDisp(); }
    var k = 1 - Math.exp(-dt * 6);
    if (!PF.on || !PF.mod){ if (!PF.dark){ PF.dark = true; pfClear(); pfCtx.putImageData(pfImg, 0, 0); pfTex.needsUpdate = true; } pfGlow.intensity = lerp(pfGlow.intensity, 0, k); return; }
    PF.dark = false; PF.acc += dt; if (PF.acc < 1 / PF.hz) return;
    var step = Math.min(PF.acc, 0.05), t0 = performance.now(); PF.acc = 0;
    try { pfStep(step); } catch (e) { PF.mod = null; toast('That pattern stopped; skipping it'); pfLoad(PF.pat + 1); return; }
    pfCtx.putImageData(pfImg, 0, 0); pfTex.needsUpdate = true;
    PF.cost = lerp(PF.cost, performance.now() - t0, 0.1); PF.hz = PF.cost > 14 ? 15 : PF.cost < 7 ? 30 : PF.hz;      // heavy patterns run at half rate so the room keeps its frame rate
    var r = 0, g = 0, b = 0, n = 0; for (var o = 0; o < pfBuf.length; o += 4 * 37){ r += pfBuf[o]; g += pfBuf[o + 1]; b += pfBuf[o + 2]; n++; }
    PF.glow[0] = lerp(PF.glow[0], r / n / 255, 0.25); PF.glow[1] = lerp(PF.glow[1], g / n / 255, 0.25); PF.glow[2] = lerp(PF.glow[2], b / n / 255, 0.25);
    var mx = Math.max(PF.glow[0], PF.glow[1], PF.glow[2], 0.001); pfGlow.color.setRGB(PF.glow[0] / mx, PF.glow[1] / mx, PF.glow[2] / mx); pfGlow.intensity = Math.min(1.3, mx * 2.0);
  }
  return { key:DK, G:PFG, PF:PF, pos:PFPOS, tick:flowTick, c:pfC, ctx:pfCtx, img:pfImg, buf:pfBuf, tex:pfTex, dc:pfDispC, dt:pfDispT, glow:pfGlow };
}
var SCRW = (ROOM.x1 - ROOM.x0) - 2 * 0.5;                // the two ceiling screens together fill the roof, less a frame one floor tile (half a metre) wide
var FLOWS = [makeFlow('pf', PFPOS, 'jambutek-studio-flow-v1', RIG.z - SCRW / 4, 0, 0, 'A')]; FLOWS.push(makeFlow('pg', PGPOS, 'jambutek-studio-flow-v1', RIG.z + SCRW / 4, Math.PI, 0, 'B', FLOWS[0]));
var PF = FLOWS[0].PF;
function flowUpdate(now, dt){ FLOWS[0].tick(now, dt); FLOWS[1].tick(now, dt); }
