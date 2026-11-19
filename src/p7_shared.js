
/* ================= more shared builders: long faders, slide switches, LEDs, key beds ================= */
function vfader(id, px, pyT, pyB, name, def, opt){
  opt = opt || {};
  var zT = LZ(pyT), zB = LZ(pyB), g = new THREE.Group(); g.position.set(LX(px), 0, 0); HOST.add(g);
  var slot = new THREE.Mesh(new THREE.BoxGeometry(0.005, 0.002, zB - zT + 0.012), new THREE.MeshBasicMaterial({ color:0x050608 })); slot.position.set(0, 0.001, (zT + zB) / 2); slot.userData.noShadow = true; g.add(slot);
  var capM = new THREE.MeshPhongMaterial({ color:opt.color || 0x9A9A96, shininess:30, specular:0x222222, flatShading:true, emissive:0x000000 });
  var cap = new THREE.Mesh(new THREE.BoxGeometry(opt.w || 0.022, opt.h || 0.011, opt.d || 0.014), capM); g.add(cap);
  var stripe = new THREE.Mesh(new THREE.BoxGeometry((opt.w || 0.022) + 0.0005, (opt.h || 0.011) + 0.0005, 0.002), new THREE.MeshBasicMaterial({ color:opt.stripe || 0x15171A })); cap.add(stripe);
  var hit = new THREE.Mesh(new THREE.BoxGeometry((opt.w || 0.022) + 0.012, 0.024, zB - zT + 0.03), HITMAT); hit.position.set(0, 0.011, (zT + zB) / 2); g.add(hit);
  var c = { id:id, kind:'fader', name:name, v:def, def:def, step:0.04, mat:capM, cap:cap,
    show:function(){ cap.position.set(0, (opt.h || 0.011) / 2 + 0.001, lerp(zB, zT, c.v)); },
    hover:function(on){ capM.emissive.setHex(on ? 0x2E6A44 : 0x000000); } };
  c.show(); return reg(c, [cap, hit]);
}
function slide(id, px, py, n, vert, name, len){
  len = len || 0.02; var x = LX(px), z = LZ(py);
  var slot = new THREE.Mesh(new THREE.BoxGeometry(vert ? 0.013 : len + 0.013, 0.003, vert ? len + 0.013 : 0.013), new THREE.MeshBasicMaterial({ color:0x050608 })); slot.position.set(x, 0.0015, z); slot.userData.noShadow = true; HOST.add(slot);
  var mat = new THREE.MeshPhongMaterial({ color:0x8A8C90, shininess:30, specular:0x222222, emissive:0x000000 }), nub = new THREE.Mesh(new THREE.CylinderGeometry(0.0052, 0.0058, 0.009, 10), mat); HOST.add(nub);
  var hit = new THREE.Mesh(new THREE.BoxGeometry(vert ? 0.022 : len + 0.024, 0.02, vert ? len + 0.024 : 0.022), HITMAT); hit.position.set(x, 0.008, z); HOST.add(hit);
  var c = { id:id, kind:'btn', name:name, pos:0, n:n, sw:true, down:0,
    set:function(i){ c.pos = i; var u = (n > 1 ? i / (n - 1) - 0.5 : 0) * len; nub.position.set(vert ? x : x + u, 0.0045, vert ? z + u : z); },
    hover:function(on){ mat.emissive.setHex(on ? 0x2E6A44 : 0x000000); } };
  c.set(0); return reg(c, [nub, hit]);
}
function ledAt(store, id, px, py, r, hex){
  var m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 0.002, 8), new THREE.MeshBasicMaterial({ color:0x15171C })); m.position.set(LX(px), 0.0012, LZ(py)); m.userData.noShadow = true; HOST.add(m);
  store[id] = { mat:m.material, col:new THREE.Color(hex || 0xFFFFFF), off:new THREE.Color(0x24272E) };
}
function ledOn(l, b){ l.mat.color.copy(l.off).lerp(l.col, clamp(+b || 0, 0, 1)); }
function keybed(prefix, nKeys, x0, x1, y0, y1, S){
  var whites = 0, n; for (n = 0; n < nKeys; n++) if ([1, 3, 6, 8, 10].indexOf(n % 12) < 0) whites++;
  var kw = (x1 - x0) / whites, wl = (y1 - y0) * S, wi = 0, zc = LZ((y0 + y1) / 2), bl = wl * 0.62, list = [];
  var wg = new THREE.BoxGeometry((kw - 6) * S, 0.022, wl), bg = new THREE.BoxGeometry(kw * 0.56 * S, 0.03, bl);
  for (n = 0; n < nKeys; n++)(function(n){
    var black = [1, 3, 6, 8, 10].indexOf(n % 12) >= 0, m, mat;
    if (!black){ mat = new THREE.MeshPhongMaterial({ color:0xC4C4BE, emissive:0x161615, shininess:20, specular:0x111111 }); m = new THREE.Mesh(wg, mat); m.position.set(LX(x0 + (wi + 0.5) * kw), 0.006, zc); wi++; }
    else { mat = new THREE.MeshPhongMaterial({ color:0x0B0C0E, emissive:0x000000, shininess:16, specular:0x0A0A0A }); m = new THREE.Mesh(bg, mat); m.position.set(LX(x0 + wi * kw), 0.02, LZ(y0) + bl / 2); }
    HOST.add(m);
    var c = { id:prefix + n, kind:'key', name:'Key', n:n, black:black, m:m, mat:mat, y0:m.position.y, hov:false, down:0, glow:0, base:black ? 0x000000 : 0x161615, zf:LZ(y0), len:black ? bl : wl };
    c.hover = function(on){ c.hov = on; };
    list.push(c); reg(c, [m]);
  })(n);
  return list;
}
function keyGlow(c, on, latched, dt){
  c.glow = lerp(c.glow, on ? 1 : 0, 1 - Math.exp(-dt * 30)); c.m.position.y = c.y0 - c.glow * 0.007;
  c.mat.emissive.setHex(c.base).lerp(MINT, clamp(c.glow * 0.5 + (c.hov ? 0.18 : 0) + (latched ? 0.25 : 0), 0, 0.8));
}
function cable(pts, r){
  var c = new THREE.CatmullRomCurve3(pts.map(function(p){ return new THREE.Vector3(p[0], p[1], p[2]); }));
  var m = new THREE.Mesh(new THREE.TubeGeometry(c, 48, r || 0.007, 5, false), new THREE.MeshPhongMaterial({ color:0x2A2B30, shininess:40, specular:0x333333 })); scene.add(m); return m;
}
function standFor(Y, G, W2, D2, TH, H, tilt, legX, own){            // tray + lip on the tilted group, legs on the upright one. Without `own` the unit gets no stand of its own: it is only noted, and p24_tables.js seats it on its side's table
  if (!own){ RIGREG.push({ Y:Y, G:G, W2:W2, TH:TH }); return; }
  var tray = new THREE.Mesh(new THREE.BoxGeometry(W2 + 0.12, 0.024, D2 + 0.07), tableMat); tray.position.y = -TH - 0.014; G.add(tray);
  var lip = new THREE.Mesh(new THREE.BoxGeometry(W2 + 0.12, 0.05, 0.024), tableMat); lip.position.set(0, -TH + 0.012, D2 / 2 + 0.035); G.add(lip);
  [-1, 1].forEach(function(s){
    var x = s * legX;
    var post = new THREE.Mesh(new THREE.BoxGeometry(0.045, H - 0.12, 0.045), metalMat); post.position.set(x, -H + (H - 0.12) / 2, -0.02); Y.add(post);
    var foot = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.035, 0.62), metalMat); foot.position.set(x, -H + 0.0175, 0); Y.add(foot);
    var arm = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, D2 + 0.04), metalMat); arm.position.set(x, -(TH + 0.05) * Math.cos(tilt), -(TH + 0.05) * Math.sin(tilt)); arm.rotation.x = tilt; Y.add(arm);
  });
  var bar = new THREE.Mesh(new THREE.BoxGeometry(legX * 2, 0.03, 0.03), metalMat); bar.position.set(0, -H + 0.28, -0.02); Y.add(bar);
}
