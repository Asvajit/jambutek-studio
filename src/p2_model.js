
/* ================= DRUMBU-8: the 11-voice drum machine on its angled stand =================
   The top plate is the designer's own artwork: a 3072 x 2284 px plate (401 x 298 mm, built at double size so every control is easy to
   aim at from standing height). Every control sits at the design's own pixel position (lx / lz take design pixels), and the plate
   texture is that design with the controls cut out of it (tools/make_trskins.py), so the 3D knobs, buttons and pads land exactly
   where they are drawn. Five colourways ("skins"), switched with the SKIN SELECT arrows: black is the default. */
var PANEL = { w:401, h:297.97 }, SC = 0.002;                      /* metres per panel millimetre (2x life size) */
var DPX = PANEL.w / 3072 * SC;                                     /* metres per design pixel */
function lx(px){ return (px / 3072 - 0.5) * PANEL.w * SC; }
function lz(py){ return (py / 2284 - 0.5) * PANEL.h * SC; }
var INST = ['BD','SD','LT','MT','HT','RS','HC','CH','OH','CC','RC'];
var INAME = ['Bass Drum','Snare Drum','Low Tom','Mid Tom','High Tom','Rim Shot','Hand Clap','Closed Hi-hat','Open Hi-hat','Crash Cymbal','Ride Cymbal'];
var COLX = [632, 813, 998, 1180, 1360, 1544, 1726, 1908, 2088, 2275, 2452];                    /* the eleven drum columns' knob centres */
var KPINK = '#FB1874', KORG = '#FF943D', KBLUE = '#3270E7';
var COLCOL = [KPINK, KPINK, KPINK, KPINK, KPINK, KORG, KORG, KBLUE, KBLUE, KBLUE, KBLUE];
var TILT = 0.56, TRH = 1.1;

var TRY = new THREE.Group(); TRY.position.set(TRPOS.x, 0, TRPOS.z); TRY.rotation.y = TRPOS.r; scene.add(TRY);
var TRG = new THREE.Group(); TRG.position.set(0, TRH, 0); TRG.rotation.x = TILT; TRY.add(TRG);
var CT = {}, CTLIST = [];                            /* every control, by id */

/* ---- the printed plate, one image per skin (public/tr/<skin>.jpg). The choice is this player's own and is kept in this browser ---- */
var panelC = mk(3072, 2284), panelTex = null;
var TRSKINS = [['black', 'BLACK'], ['navy', 'NAVY'], ['blue', 'BLUE'], ['purple', 'PURPLE'], ['green', 'GREEN']];
var TRSKIN = { i:0, img:{} };
(function(){ try { var k = localStorage.getItem('jbtr-skin'); TRSKINS.forEach(function(s, i){ if (s[0] === k) TRSKIN.i = i; }); } catch (e) {} })();
function trSkinImg(i){
  var k = TRSKINS[i][0]; if (TRSKIN.img[k]) return TRSKIN.img[k];
  var im = new Image(); im.onload = function(){ im.ok = true; if (TRSKIN.i === i) paintPanel(); }; im.src = 'tr/' + k + '.jpg'; TRSKIN.img[k] = im; return im;
}
function paintPanel(){
  var g = panelC.getContext('2d'), im = trSkinImg(TRSKIN.i);
  if (im.ok){
    g.drawImage(im, 0, 0, panelC.width, panelC.height);
  } else { g.fillStyle = '#141414'; g.fillRect(0, 0, panelC.width, panelC.height); }
  if (panelTex) panelTex.needsUpdate = true;
}
function trSkin(step){                                             /* the SKIN SELECT arrows */
  var n = TRSKINS.length; TRSKIN.i = (TRSKIN.i + step + n) % n;
  try { localStorage.setItem('jbtr-skin', TRSKINS[TRSKIN.i][0]); } catch (e) {}
  paintPanel(); trSkinImg((TRSKIN.i + step + n) % n);                 /* and fetch the next one along, so the next press is instant */
  return TRSKINS[TRSKIN.i][1];
}
paintPanel(); panelTex = smoothTex(panelC);

(function(){
  var W2 = PANEL.w * SC, D2 = PANEL.h * SC, TH = 0.11;
  var top = new THREE.Mesh(new THREE.PlaneGeometry(W2, D2), new THREE.MeshPhongMaterial({ color:0x8C8C8C, map:panelTex, emissive:0xffffff, emissiveMap:panelTex, emissiveIntensity:0.5, shininess:8, specular:0x0A0A0A }));
  top.rotation.x = -Math.PI / 2; top.receiveShadow = true; TRG.add(top); solid(top, 'trbody');
  /* the body: the designer's two end panels and front panel; back and base plain in their ground colour */
  var bodyM = new THREE.MeshPhongMaterial({ color:0x282526, shininess:30, specular:0x222222, flatShading:true });
  function art(f){ var t = new THREE.TextureLoader().load('tr/' + f); t.minFilter = THREE.LinearMipmapLinearFilter; t.magFilter = THREE.LinearFilter; t.anisotropy = renderer.capabilities.getMaxAnisotropy();
    return new THREE.MeshPhongMaterial({ color:0x8C8C8C, map:t, emissive:0xffffff, emissiveMap:t, emissiveIntensity:0.4, shininess:20, specular:0x151515 }); }
  var body = new THREE.Mesh(new THREE.BoxGeometry(W2 + 0.012, TH, D2 + 0.012), [art('right.jpg'), art('left.jpg'), bodyM, bodyM, art('front.jpg'), bodyM]);      /* right end, left end (each with its dinosaur at the back), top, base, front, back */ body.position.y = -TH / 2 - 0.0015; body.castShadow = true; TRG.add(body); solid(body, 'trbody');
  BLOCKS.push(devBlock(TRPOS, 0.52));
  paintPanel();
})();

/* ---- control builders (HOST / LX / LZ / DEV say which instrument they are building on) ---- */
var HOST = TRG, LX = lx, LZ = lz, DEV = null, FACE = { bg:'#C9C7C0', fg:'#0B0B0D' };
var HITMAT = new THREE.MeshBasicMaterial({ visible:false });
function reg(c, hits){
  c.dev = DEV; CT[c.id] = c; CTLIST.push(c);
  hits.forEach(function(m){ m.userData.ia = 'ctl'; m.userData.ctl = c; solids.push(m); });
  return c;
}
var knobBodyGeo = {}, MINT = new THREE.Color(0x90F0A8);
function knob(id, px, py, r, name, def, opt){
  opt = opt || {};
  var R = r * SC, H = (opt.h || 8.5) * SC, g = new THREE.Group(); g.position.set(LX(px), 0, LZ(py)); HOST.add(g);
  var mat = new THREE.MeshPhongMaterial({ color:opt.color || 0x202226, shininess:12, specular:0x0A0A0A, flatShading:true, emissive:0x000000 });
  var skirt = new THREE.Mesh(new THREE.CylinderGeometry(R * 1.22, R * 1.3, 0.004, 12), new THREE.MeshLambertMaterial({ color:0x0C0D10 })); skirt.position.y = 0.002; g.add(skirt);
  var rot = new THREE.Group(); g.add(rot);
  var body = new THREE.Mesh(new THREE.CylinderGeometry(R * 0.9, R, H, opt.sides || 10), mat); body.position.y = H / 2 + 0.003; body.castShadow = true; rot.add(body);
  var tick = new THREE.Mesh(new THREE.BoxGeometry(R * 0.2, 0.0025, R * 0.8), new THREE.MeshBasicMaterial({ color:opt.tick || 0xFFFFFF })); tick.position.set(0, H + 0.004, -R * 0.5); rot.add(tick);
  if (opt.cap){ var cap = new THREE.Mesh(new THREE.CylinderGeometry(R * 0.56, R * 0.56, 0.0016, 14), new THREE.MeshLambertMaterial({ color:opt.cap, emissive:opt.cap, emissiveIntensity:0.25 })); cap.position.y = H + 0.0034; rot.add(cap); }
  var tick2 = new THREE.Mesh(new THREE.BoxGeometry(R * 0.2, H * 0.6, 0.002), new THREE.MeshBasicMaterial({ color:opt.tick || 0xFFFFFF })); tick2.position.set(0, H * 0.7, -R * 0.96); rot.add(tick2);
  var ring = null;
  if (opt.ring){ ring = new THREE.Mesh(new THREE.TorusGeometry(R * 1.32, R * 0.12, 4, 20), new THREE.MeshBasicMaterial({ color:opt.ring })); ring.rotation.x = Math.PI / 2; ring.position.y = 0.004; g.add(ring); }
  var hit = new THREE.Mesh(new THREE.CylinderGeometry(R * 1.45, R * 1.45, H + 0.012, 8), HITMAT); hit.position.y = H / 2 + 0.004; g.add(hit);
  var c = { id:id, kind:'knob', name:name, v:def, def:def, step:opt.step || 0.02, endless:!!opt.endless, g:g, rot:rot, mat:mat, ring:ring,
    show:function(){ rot.rotation.y = c.endless ? -c.v * Math.PI * 2 : -(c.v - 0.5) * 5.2; },
    hover:function(on){ mat.emissive.setHex(on ? 0x2E6A44 : 0x000000); } };
  c.show();
  return reg(c, [body, hit]);
}
function faceTex(text, w, h, sub){
  var c = mk(128, Math.max(32, Math.round(128 * h / w / 8) * 8)), t = canvasTex(c); t.minFilter = THREE.LinearMipmapLinearFilter; t.magFilter = THREE.LinearFilter;
  var bg = FACE.bg, fg = FACE.fg;
  function paint(nt, fill){                                   // fill 0..1: a progress bar across the face, for press-and-hold buttons
    if (typeof nt === 'string') text = nt;                    // a new caption, e.g. the Snake's CUSTOM button naming what it has learned
    var g = c.getContext('2d'); g.fillStyle = bg; g.fillRect(0, 0, c.width, c.height);
    if (fill > 0){ g.fillStyle = '#E0193C'; g.fillRect(0, 0, c.width * Math.min(1, fill), c.height); }
    g.strokeStyle = 'rgba(0,0,0,.35)'; g.lineWidth = 4; g.strokeRect(0, 0, c.width, c.height);
    var lines = text.split('\n'), fs = Math.min(c.height * (lines.length > 1 ? 0.4 : 0.56), 110 / Math.max.apply(null, lines.map(function(l){ return Math.max(2.2, l.length * 0.52); })));
    g.fillStyle = fg; g.font = Math.round(fs) + 'px ' + FONT; g.textAlign = 'center'; g.textBaseline = 'middle';
    lines.forEach(function(l, k){ g.fillText(l, c.width / 2, c.height / 2 + (k - (lines.length - 1) / 2) * fs * 1.08 + fs * 0.06); });
    t.needsUpdate = true;
  }
  paint();
  return { t:t, paint:paint };
}
var btnSide = new THREE.MeshLambertMaterial({ color:0x55544F });
function button(id, px, py, w, h, text, name, lit){
  var W2 = w * SC, D2 = h * SC, f = faceTex(text, w, h);
  var topM = new THREE.MeshPhongMaterial({ color:0x4A4A4A, map:f.t, emissive:0xffffff, emissiveMap:f.t, emissiveIntensity:0.3, shininess:10, specular:0x080808 });
  var m = new THREE.Mesh(new THREE.BoxGeometry(W2, 0.009, D2), [btnSide, btnSide, topM, btnSide, btnSide, btnSide]); m.position.set(LX(px), 0.0045, LZ(py)); HOST.add(m);
  var hit = new THREE.Mesh(new THREE.BoxGeometry(W2 + 0.006, 0.02, D2 + 0.006), HITMAT); hit.position.set(LX(px), 0.008, LZ(py)); HOST.add(hit);
  var c = { id:id, kind:'btn', name:name, m:m, mat:topM, col:new THREE.Color(lit || 0x90F0A8), lit:0, hov:false, down:0, y0:0.0045, repaintFace:f.paint };
  c.paintLit = function(){ if (c.lit > 0.01){ topM.emissive.copy(c.col); topM.emissiveIntensity = 0.3 + c.lit * 0.75 + (c.hov ? 0.15 : 0); } else { topM.emissive.setHex(c.hov ? 0x90F0A8 : 0xffffff); topM.emissiveIntensity = c.hov ? 0.6 : 0.3; } };
  c.hover = function(on){ c.hov = on; c.paintLit(); };
  return reg(c, [m, hit]);
}
function pad(id, px, py, w, h, col, name){
  var W2 = w * SC, D2 = h * SC;
  var mat = new THREE.MeshPhongMaterial({ color:0x17181B, emissive:col, emissiveIntensity:0.16, shininess:8, specular:0x050505 });
  var m = new THREE.Mesh(new THREE.BoxGeometry(W2, 0.011, D2), mat); m.position.set(LX(px), 0.0055, LZ(py)); HOST.add(m);
  var hit = new THREE.Mesh(new THREE.BoxGeometry(W2 + 0.005, 0.022, D2 + 0.005), HITMAT); hit.position.set(LX(px), 0.009, LZ(py)); HOST.add(hit);
  var c = { id:id, kind:'pad', name:name, m:m, mat:mat, base:new THREE.Color(col), col:new THREE.Color(col), lit:0, hov:false, down:0, y0:0.0055, flash:0 };
  c.paintLit = function(){ mat.emissive.copy(c.col); mat.emissiveIntensity = Math.min(1.0, 0.06 + c.lit * 0.82 + (c.hov ? 0.16 : 0)); };
  c.hover = function(on){ c.hov = on; c.paintLit(); };
  return reg(c, [m, hit]);
}

/* ================= DRUMBU-8 controls, drawn to the design =================
   Knob tops are painted from the design's measurements (a dark twelve-sided body, a grey ring, a coloured cap and the pointer) and turn
   with the knob. Button and pad faces are cut straight from the design (public/tr/faces.png); a face is white until it lights, then takes
   its colour: green for most, red for CLEAR, DR-REC and the mutes. */
var TRFACES = new Image(), TRFACEFN = [];
TRFACES.onload = function(){ TRFACES.ok = true; TRFACEFN.forEach(function(f){ f(); }); }; TRFACES.src = 'tr/faces.png';
var TRWHITE = new THREE.Color(1, 1, 1), TRTMP = new THREE.Color(), TRSIDE = new THREE.MeshLambertMaterial({ color:0x111214 });
function trTex(c){ var t = new THREE.CanvasTexture(c); t.minFilter = THREE.LinearMipmapLinearFilter; t.magFilter = THREE.LinearFilter; t.anisotropy = renderer.capabilities.getMaxAnisotropy(); return t; }
function dodec(g, r, fill){ g.beginPath(); for (var k = 0; k < 12; k++){ var a = Math.PI / 12 + k * Math.PI / 6; g.lineTo(Math.sin(a) * r, -Math.cos(a) * r); } g.closePath(); g.fillStyle = fill; g.fill(); }
/* style: 'big' (125 px across), 'small' (the send knobs), 'tempo'. The cylinder's cap maps the canvas turned a quarter, hence the rotate */
var TRK = { big:{ r:62.75, seg:12 }, small:{ r:36, seg:24 }, tempo:{ r:123.5, seg:12 } };
function trKnob(id, cx, cy, style, col, ptr, name, def, opt){
  opt = opt || {}; var S = TRK[style], R = S.r * DPX, H = (style === 'small' ? 4.5 : style === 'tempo' ? 7.5 : 6.5) * SC;
  var cv = mk(256, 256), g = cv.getContext('2d'), s = 128 / S.r;
  g.translate(128, 128); g.rotate(-Math.PI / 2); g.scale(s, s);
  if (style === 'small'){
    g.fillStyle = '#131419'; g.beginPath(); g.arc(0, 0, S.r + 2, 0, 7); g.fill(); dodec(g, 29, col);
    g.fillStyle = 'rgba(0,0,0,.12)'; g.beginPath(); g.arc(0, 4, 27, 0.15, Math.PI - 0.15); g.fill();
    g.fillStyle = ptr; g.fillRect(-4, -27, 8, 23);
  } else if (style === 'tempo'){
    g.fillStyle = '#17171C'; g.beginPath(); g.arc(0, 0, S.r + 2, 0, 7); g.fill(); dodec(g, 96.5, '#2B2E36'); dodec(g, 90, '#3B3D47');
    g.fillStyle = ptr; g.fillRect(-10, -99, 20, 85);
  } else {
    g.fillStyle = '#17171C'; g.beginPath(); g.arc(0, 0, S.r + 2, 0, 7); g.fill(); dodec(g, 49, '#2B2E36'); dodec(g, 45.5, col);
    g.fillStyle = ptr; g.fillRect(-5.3, -51, 10.6, 47.2);
  }
  var tex = trTex(cv), gr = new THREE.Group(); gr.position.set(lx(cx), 0, lz(cy)); TRG.add(gr);
  var topM = new THREE.MeshPhongMaterial({ color:0x4D4D4D, map:tex, emissive:0xffffff, emissiveMap:tex, emissiveIntensity:0.62, shininess:10, specular:0x0A0A0A });      /* less lamp, more glow: the caps keep the design's colours instead of washing out under the room lights */
  var sideM = new THREE.MeshPhongMaterial({ color:style === 'small' ? 0x131419 : 0x17171C, shininess:12, specular:0x0A0A0A, flatShading:true });
  var rot = new THREE.Group(); gr.add(rot);
  var body = new THREE.Mesh(new THREE.CylinderGeometry(R * 0.97, R, H, S.seg, 1, false, Math.PI / S.seg), [sideM, topM, sideM]); body.position.y = H / 2 + 0.001; body.castShadow = true; rot.add(body);
  var hit = new THREE.Mesh(new THREE.CylinderGeometry(R * 1.25, R * 1.25, H + 0.012, 8), HITMAT); hit.position.y = H / 2 + 0.004; gr.add(hit);
  var c = { id:id, kind:'knob', name:name, v:def, def:def, step:opt.step || 0.02, endless:!!opt.endless, g:gr, rot:rot, mat:topM, ring:null,
    show:function(){ rot.rotation.y = c.endless ? -c.v * Math.PI * 2 : -(c.v - 0.5) * 5.2; },
    hover:function(on){ topM.emissiveIntensity = on ? 0.85 : 0.62; sideM.emissive.setHex(on ? 0x2E6A44 : 0x000000); } };
  c.show();
  return reg(c, [body, hit]);
}
/* a button or pad: r = [x, y, w, h] of its square in the design (the 5 px black edge is drawn on it, so the face takes it in) */
function trFace(r, plain){
  var w = r[2] + 5, h = r[3] + 5, k = Math.min(3, 360 / Math.max(w, h)), cv = mk(Math.round(w * k), Math.round(h * k)), t = trTex(cv);
  function paint(){
    var g = cv.getContext('2d');
    if (TRFACES.ok && !plain) g.drawImage(TRFACES, r[0] - 2.5, r[1] - 2.5, w, h, 0, 0, cv.width, cv.height);
    else { g.fillStyle = '#000'; g.fillRect(0, 0, cv.width, cv.height); g.fillStyle = '#fff'; g.fillRect(5 * k, 5 * k, cv.width - 10 * k, cv.height - 10 * k); }
    t.needsUpdate = true;
  }
  paint(); if (!plain) TRFACEFN.push(paint);
  return t;
}
function trButton(id, r, name, lit, kind, plain){
  var W2 = (r[2] + 5) * DPX, D2 = (r[3] + 5) * DPX, t = trFace(r, plain), y0 = kind === 'pad' ? 0.004 : 0.003;
  var topM = new THREE.MeshPhongMaterial({ color:0x8C8C8C, map:t, emissive:0xffffff, emissiveMap:t, emissiveIntensity:0.5, shininess:10, specular:0x080808 });
  var m = new THREE.Mesh(new THREE.BoxGeometry(W2, y0 * 2, D2), [TRSIDE, TRSIDE, topM, TRSIDE, TRSIDE, TRSIDE]); m.position.set(lx(r[0] + r[2] / 2), y0, lz(r[1] + r[3] / 2)); TRG.add(m);
  var hit = new THREE.Mesh(new THREE.BoxGeometry(W2 + 0.004, 0.02, D2 + 0.004), HITMAT); hit.position.set(m.position.x, 0.008, m.position.z); TRG.add(hit);
  var c = { id:id, kind:kind || 'btn', name:name, m:m, mat:topM, col:new THREE.Color(lit), base:new THREE.Color(lit), lit:0, hov:false, down:0, y0:y0, flash:0, tr:true };
  /* white until lit; lit fades the face to its colour. A step pad has no white state: its colour is set each frame */
  c.paintLit = function(){
    var k = clamp(c.lit, 0, 1);
    if (c.kind === 'pad' && plain) TRTMP.copy(c.col); else TRTMP.copy(TRWHITE).lerp(c.col, k);
    topM.color.copy(TRTMP).multiplyScalar(0.3); topM.emissive.copy(TRTMP); topM.emissiveIntensity = 0.62 + k * 0.15 + (c.hov ? 0.15 : 0);
  };
  c.hover = function(on){ c.hov = on; c.paintLit(); };
  c.paintLit();
  return reg(c, [m, hit]);
}
var FADX = [588.7, 767.1, 955.0, 1141.0, 1319.0, 1506.0, 1688.0, 1866.0, 2045.0, 2224.3, 2411.0];
function trFader(i){
  var px = FADX[i] + 41.45, zTop = lz(1390.7), zBot = lz(1640.5), g = new THREE.Group(); g.position.set(lx(px), 0, 0); TRG.add(g);
  var capM = new THREE.MeshPhongMaterial({ color:0xC8C8C8, emissive:0xffffff, emissiveIntensity:0.32, shininess:30, specular:0x222222 });
  var cap = new THREE.Mesh(new THREE.BoxGeometry(82.9 * DPX, 0.008, 43 * DPX), capM); cap.castShadow = true; g.add(cap);
  var stripe = new THREE.Mesh(new THREE.BoxGeometry(83.6 * DPX, 0.0082, 9.1 * DPX), new THREE.MeshBasicMaterial({ color:0x000000 })); stripe.position.z = 1.15 * DPX; cap.add(stripe);
  var hit = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.026, zBot - zTop + 0.03), HITMAT); hit.position.set(0, 0.012, (zTop + zBot) / 2); g.add(hit);
  var c = { id:'lev' + i, kind:'fader', name:INAME[i] + ' level', inst:i, v:0.8, def:0.8, step:0.04, g:g, cap:cap, mat:capM, glowM:new THREE.MeshBasicMaterial(),
    show:function(){ cap.position.set(0, 0.004, lerp(zBot, zTop, c.v)); },
    hover:function(on){ capM.emissive.setHex(on ? 0x90F0A8 : 0xffffff); } };
  c.show();
  return reg(c, [cap, hit]);
}

/* ---- every control, at the design's positions ---- */
HOST = TRG; LX = lx; LZ = lz; DEV = null;
var KDARK = '#393C41', KYEL = '#FFFF61', KGRN = '#5CFFAD', SYEL = '#FFFF61', SGRN = '#5CFFAD';
trKnob('volume', 286, 353, 'big', KDARK, '#FFFFFF', 'Volume', 0.8);
trKnob('accent', 628, 350, 'big', KDARK, '#FFFFFF', 'Accent level', 0.6);
trKnob('reverb', 993, 350, 'big', KYEL, '#000000', 'Reverb level', 0.3);
trKnob('dlevel', 1174, 350, 'big', KGRN, '#000000', 'Delay level', 0.2);
trKnob('dtime', 1363, 350, 'big', KGRN, '#000000', 'Delay time', 0.5, { step:0.1 });
trKnob('dfb', 1543, 350, 'big', KGRN, '#000000', 'Delay feedback', 0.4);
trKnob('fxctrl', 1910, 350, 'big', KDARK, '#FFFFFF', 'Filter LPF / HPF', 0.5);
trKnob('fillknob', 2274, 350, 'big', KDARK, '#FFFFFF', 'Auto fill-in', 0.2, { step:0.2 });
var SMX = [633, 813, 999, 1179, 1361, 1547, 1729, 1910, 2091, 2271, 2457];
COLX.forEach(function(x, i){
  trKnob('tune' + i, x, 597, 'big', COLCOL[i], '#FFFFFF', INAME[i] + ' tune', 0.5).inst = i;
  trKnob('decay' + i, x, 769, 'big', COLCOL[i], '#FFFFFF', INAME[i] + ' decay', 0.5).inst = i;
  trKnob('ctrl' + i, x, 946, 'big', COLCOL[i], '#FFFFFF', INAME[i] + ' tone', 0.5).inst = i;
  trKnob('rsend' + i, SMX[i], 1107.5, 'small', SYEL, '#111114', INAME[i] + ' reverb send', 0).inst = i;
  trKnob('dsend' + i, SMX[i], 1237.5, 'small', SGRN, '#111114', INAME[i] + ' delay send', 0).inst = i;
  trFader(i);
});
trKnob('value', 2782, 595, 'big', KDARK, '#FFFFFF', 'Selectah', 0, { endless:true, step:1 / 24 });
trKnob('shuffle', 2778, 941, 'big', KDARK, '#FFFFFF', 'Swing', 0.5);
trKnob('tempo', 2783.2, 1434.2, 'tempo', '#3B3D47', '#FFFFFF', 'Tempo', 0, { endless:true, step:1 / 60 });
/* the ring round TEMPO: lights to the beat */
var TRRING = (function(){
  var g = new THREE.Group(); g.position.set(lx(2783.2), 0, lz(1434.2)); TRG.add(g);
  function ring(r0, r1, col, y){ var m = new THREE.Mesh(new THREE.RingGeometry(r0 * DPX, r1 * DPX, 12, 1, Math.PI / 12), new THREE.MeshBasicMaterial({ color:col })); m.rotation.x = -Math.PI / 2; m.position.y = y; m.userData.noShadow = true; g.add(m); return m; }
  ring(118, 150.5, 0x000000, 0.0008); var red = ring(122.5, 147.5, 0xFF4F66, 0.0012);
  return { mat:red.material };
})();

var RED = 0xFF2A3C, GRN = 0x3BFF6A, WHT = 0xFFFFFF, ORG = 0xFF8A2A;
trButton('skinprev', [1352.5, 82.9, 65.0, 55.4], 'Skin select, back', GRN); trButton('skinnext', [1648.0, 80.9, 65.0, 55.4], 'Skin select, next', GRN);
trButton('accstep', [743.8, 315.6, 134, 68], 'Accent steps', GRN);
trButton('fxon', [1670.5, 315.6, 134, 68], 'Filter on', GRN);
trButton('fillon', [2023.2, 280.2, 134, 68], 'Auto fill-in on', GRN); trButton('filledit', [2023.2, 360.0, 134, 68], 'Edit the fill-in', GRN);
trButton('filltrig', [2375.5, 279.2, 134, 147], 'Fill-in now', GRN);
trButton('shift', [102.8, 533.9, 174.7, 174.7], 'Shift', GRN); trButton('clear', [299.5, 533.4, 174.7, 174.7], 'Clear', RED);
trButton('ptn', [102.8, 728.6, 174.7, 174.7], 'Pattern select', GRN); trButton('trrec', [299.5, 728.1, 174.7, 174.7], 'DR-REC · step recording', RED);
trButton('last', [102.8, 927.9, 174.7, 174.7], 'Last step', GRN); trButton('sub', [299.5, 927.4, 174.7, 174.7], 'Sub steps', GRN);
trButton('fxrpt', [102.8, 1261.8, 174.7, 174.7], 'Roll B · hold', GRN); trButton('fxwarp', [299.5, 1261.3, 174.7, 174.7], 'Roll A · hold', GRN);
var VARX = [107.4, 201.5, 297.5, 395.4];
'ABCDEFGH'.split('').forEach(function(L, k){ trButton('var' + k, [VARX[k % 4], k < 4 ? 1610.5 : 1746.8, 76.8, 116.2], 'Pattern ' + L, GRN).vi = k; });
var SELX = [568.0, 740.5, 928.5, 1110.5, 1296.5, 1478.5, 1660.5, 1840.5, 2018.5, 2202.5, 2386.5];
SELX.forEach(function(x, i){ trButton('sel' + i, [x, 1737.9, 134, 68], INAME[i], GRN).inst = i; trButton('mt' + i, [x, 1815.9, 134, 68], INAME[i] + ' mute', RED).mi = i; });
trButton('copy', [2600.5, 683.9, 109.2, 55.4], 'Copy', GRN); trButton('inst', [2730.4, 684.4, 109.2, 55.4], 'Instrument tone', GRN); trButton('kit', [2857.9, 683.9, 109.2, 55.4], 'Kit', GRN);
trButton('instpad', [2693.5, 1693.5, 174.7, 174.7], 'Performance pad', GRN, 'pad');
trButton('start', [141.8, 2028.6, 191.6, 140.8], 'Start / Stop', GRN, 'pad');
var PADX = [446.1, 598.7, 751.3, 908.1, 1064.9, 1217.5, 1374.3, 1526.9, 1683.7, 1840.5, 1993.1, 2149.9, 2306.7, 2459.3, 2616.1, 2768.7];
PADX.forEach(function(x, i){ trButton('pad' + i, [x, 2026.9, 119.3, 145.7], 'Step ' + (i + 1), 0x525257, 'pad', true).pi = i; });
var HALFBAR = [[447.0, 0x2DFF2D], [1686.0, 0xFFFFFF]].map(function(b){             /* the bar under pads 1-8 or 9-16: green under the half the number keys write */
  var m = new THREE.Mesh(new THREE.BoxGeometry(1199 * DPX, 0.0016, 8 * DPX), new THREE.MeshBasicMaterial({ color:b[1] }));
  m.position.set(lx(b[0] + 599.5), 0.0008, lz(2197.1)); m.userData.noShadow = true; TRG.add(m); return m;
});

/* ---- the two screens, set into the plate's own windows ---- */
var dispC = mk(782, 480), dispT = canvasTex(dispC); dispT.minFilter = THREE.LinearFilter; dispT.magFilter = THREE.LinearFilter;
var tempoC = mk(410, 220), tempoT = canvasTex(tempoC); tempoT.minFilter = THREE.LinearFilter; tempoT.magFilter = THREE.LinearFilter;
(function(){
  var d = new THREE.Mesh(new THREE.PlaneGeometry(391 * DPX, 240 * DPX), new THREE.MeshBasicMaterial({ map:dispT })); d.rotation.x = -Math.PI / 2; d.position.set(lx(2785.5), 0.0006, lz(339)); TRG.add(d);
  var t = new THREE.Mesh(new THREE.PlaneGeometry(196 * DPX, 101 * DPX), new THREE.MeshBasicMaterial({ map:tempoT })); t.rotation.x = -Math.PI / 2; t.position.set(lx(2789.35), 0.0006, lz(1115.7)); TRG.add(t);
  [d, t].forEach(function(m){ m.userData.ia = 'trbody'; m.userData.noShadow = true; solids.push(m); });
})();
/* a glow thrown up from the lit pads onto whoever is standing over them */
var padGlow = new THREE.PointLight(0xFF6A4A, 0.0, 1.6, 2); padGlow.position.set(0, 0.25, 0.2); TRG.add(padGlow);
