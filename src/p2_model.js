
/* ================= the drum machine: an 11-voice rhythm box on an angled stand =================
   Laid out from the TR-8S reference manual's top-panel drawing. Positions are read off that drawing in its
   own pixels (PX, PY), turned into millimetres on a 401 x 268 mm panel, and built at double size so every
   control is easy to aim at from standing height. */
/* The panel is 30 mm taller than the drawing: a row was let in under the TONE knobs for each drum's two effect sends. Everything
   the drawing puts below that line (PY > 372) simply sits ROWH lower; the new row itself is placed with VRAW on, in the gap. */
var ROWH = 52, VRAW = false;
var PANEL = { w:401, h:268 + ROWH / 1.735 }, SC = 0.002;           // metres per panel millimetre (2x life size)
function U(px){ return (px - 75) / 1.863; }
function V(py){ return ((VRAW || py <= 372 ? py : py + ROWH) - 155) / 1.735; }
function lx(px){ return (U(px) - PANEL.w / 2) * SC; }
function lz(py){ return (V(py) - PANEL.h / 2) * SC; }
var INST = ['BD','SD','LT','MT','HT','RS','HC','CH','OH','CC','RC'];
var INAME = ['Bass Drum','Snare Drum','Low Tom','Mid Tom','High Tom','Rim Shot','Hand Clap','Closed Hi-hat','Open Hi-hat','Crash Cymbal','Ride Cymbal'];
/* The drawing's right-hand block is rebuilt as one narrow column (screen, VALUE, COPY, KIT, INST, tempo, shuffle), which leaves the
   eleven drums 47 px more room: their columns are spread to a 44.3 px pitch and the top row above them is stretched to match (TRX). */
var COLX = [229, 273, 318, 362, 406, 451, 495, 539, 583, 628, 672], CHX1 = 694, SIDEX = 752;
function TRX(x){ return 207 + (x - 207) * (CHX1 - 207) / 440; }
var PADX = [199, 236, 273, 311, 349, 386, 424, 461, 499, 537, 574, 612, 650, 687, 725, 762];
var PADCOL = [0xFF2A3C, 0xFF2A3C, 0xFF2A3C, 0xFF2A3C, 0xFF8A2A, 0xFF8A2A, 0xFF8A2A, 0xFF8A2A, 0xFFE15A, 0xFFE15A, 0xFFE15A, 0xFFE15A, 0xF4F4F4, 0xF4F4F4, 0xF4F4F4, 0xF4F4F4];
var COLCOL = ['#FF2A3C', '#FF2A3C', '#FF2A3C', '#FF2A3C', '#FF8A2A', '#FF8A2A', '#FF8A2A', '#FF8A2A', '#FFE15A', '#FFE15A', '#FFE15A'];
var TILT = 0.56, TRH = 1.1;

var TRY = new THREE.Group(); TRY.position.set(TRPOS.x, 0, TRPOS.z); TRY.rotation.y = TRPOS.r; scene.add(TRY);
var TRG = new THREE.Group(); TRG.position.set(0, TRH, 0); TRG.rotation.x = TILT; TRY.add(TRG);
var CT = {}, CTLIST = [];                            // every control, by id

/* ---- the printed panel ---- */
var panelC = mk(3072, 2284), panelTex = null;      // about 7.7 px per panel millimetre each way: the small print has to stay readable when you lean in
var TRPLATE = { on:true, dark:0, img:null };      /* the artwork is stored already as a ghost print (two close dark tones, softened), so it needs no darkening here */
(function(){ var src = window.JB_ASSETS && JB_ASSETS.trPlate; if (!src) return; var im = new Image(); im.onload = function(){ TRPLATE.img = im; paintPanel(); }; im.src = src; })();
function paintPanel(){
  var g = panelC.getContext('2d');
  g.setTransform(panelC.width / PANEL.w, 0, 0, panelC.height / PANEL.h, 0, 0);          // draw in millimetres
  g.fillStyle = '#14161A'; g.fillRect(0, 0, PANEL.w, PANEL.h);
  if (TRPLATE.on && TRPLATE.img){                                  /* the baseplate artwork, cover-fitted, then darkened so the print and the controls on it stay readable. TRPLATE.on = false brings back the plain plate */
    var pi = TRPLATE.img, sc = Math.max(PANEL.w / pi.width, PANEL.h / pi.height), dw = pi.width * sc, dh = pi.height * sc;
    g.drawImage(pi, (PANEL.w - dw) / 2, (PANEL.h - dh) / 2, dw, dh); g.fillStyle = 'rgba(12,6,12,' + TRPLATE.dark + ')'; g.fillRect(0, 0, PANEL.w, PANEL.h);
  } else
  for (var i = 0; i < 5000; i++){ g.fillStyle = 'rgba(' + (Math.random() < .5 ? '0,0,0' : '120,130,150') + ',' + rnd(.02, .07) + ')'; g.fillRect(Math.random() * PANEL.w, Math.random() * PANEL.h, .5, .3); }
  function rr(x0, y0, x1, y1, r, stroke, fill){
    var a = U(x0), b = V(y0), c = U(x1), d = V(y1); g.beginPath();
    g.moveTo(a + r, b); g.lineTo(c - r, b); g.quadraticCurveTo(c, b, c, b + r); g.lineTo(c, d - r); g.quadraticCurveTo(c, d, c - r, d); g.lineTo(a + r, d); g.quadraticCurveTo(a, d, a, d - r); g.lineTo(a, b + r); g.quadraticCurveTo(a, b, a + r, b); g.closePath();
    if (fill){ g.fillStyle = fill; g.fill(); } if (stroke){ g.strokeStyle = stroke; g.lineWidth = 0.55; g.stroke(); }
  }
  function T(s, px, py, size, col, font, align){
    g.font = font === 'A' ? size + 'px ' + FONT : 'bold ' + size + 'px "Helvetica Neue", Helvetica, Arial, sans-serif';
    g.fillStyle = col || '#E6E6E2'; g.textAlign = align || 'center'; g.textBaseline = 'middle'; g.fillText(s, U(px), V(py));
  }
  var line = 'rgba(216,216,216,.55)';
  // section frames
  rr(92, 178, 198, 512, 3, line); [[207, 284], [290, 323], [329, 444], [450, 525], [531, 647]].forEach(function(b){ rr(TRX(b[0]), 178, TRX(b[1]), 236, 3, line); });
  rr(207, 252, CHX1, 464, 3, line); rr(207, 470, CHX1, 512, 3, line);
  rr(CHX1 + 8, 178, 802, 512, 3, line); rr(92, 520, 802, 606, 3, line);                // the bottom box runs the full width and holds START / STOP as well as the pads
  // brand strip: this is the label's own box, so it wears the label's name
   T('RHYTHM STATION', 700, 166, 3.2, '#C9C9C4', 'bold', 'right'); T('DRUMBU-8', 800, 165, 7.2, '#E0193C', 'A', 'right');
  // top row
  T('VOLUME', 145, 190, 3, null);
  T('ACCENT', TRX(245), 190, 3.2, null); T('LEVEL', TRX(226), 230, 2.6, null);
  T('REVERB', TRX(306), 190, 3.2, null); T('LEVEL', TRX(306), 230, 2.6, null);
  T('DELAY', TRX(386), 190, 3.2, null); T('LEVEL', TRX(346), 230, 2.6, null); T('TIME', TRX(386), 230, 2.6, null); T('FEEDBACK', TRX(427), 230, 2.6, null);
  T('MASTER FX', TRX(487), 190, 3.2, null); T('CTRL', TRX(508), 230, 2.6, null);
  T('AUTO FILL IN', TRX(588), 190, 3.2, null);
  [['2', 566, 222], ['4', 569, 204], ['8', 580, 193], ['12', 596, 193], ['16', 607, 204], ['32', 611, 222]].forEach(function(m){ T(m[0], TRX(588) + m[1] - 588, m[2], 2.3, '#B8B8B4'); });
  // knob end-stops
  function stops(px, py, r){ g.fillStyle = '#B8B8B4'; [-1, 1].forEach(function(s){ g.beginPath(); g.arc(U(px) + s * r * 0.76, V(py) + r * 0.72, 0.5, 0, 7); g.fill(); }); }
  [[145, 213], [TRX(226), 212], [TRX(306), 212], [TRX(346), 212], [TRX(386), 212], [TRX(427), 212], [TRX(508), 212]].forEach(function(p){ stops(p[0], p[1], 9.5); });
  VRAW = true; stops(SIDEX, 470, 9.5); VRAW = false;
  // instrument columns
  COLX.forEach(function(x, i){
    rr(x - 21, 238, x + 21, 251, 0.8, COLCOL[i], '#23262C');                                    // the drum's name, in the menu's Merchant Copy: wide open letters that survive the room's coarse picture
    var nm = ['KICK', 'SNARE', 'LOW TOM', 'MID TOM', 'HI TOM', 'RIM', 'CLAP', 'CL HAT', 'OP HAT', 'CRASH', 'RIDE'][i];                // short names, so the type can be large
    g.font = '6.4px "Merchant Copy", ui-monospace, monospace'; g.fillStyle = g.strokeStyle = '#FFFFFF'; g.lineWidth = 0.22; g.textAlign = 'center'; g.textBaseline = 'alphabetic'; var tm = g.measureText('KHR'), ty = V(244.5) + ((tm.actualBoundingBoxAscent || 4) - (tm.actualBoundingBoxDescent || 0)) / 2;      /* centred on the capitals' own height: this face's 'middle' sits low */
    g.strokeText(nm, U(x), ty, 21.4); g.fillText(nm, U(x), ty, 21.4);
    T('TUNE', x, 287, 3, null); T('DECAY', x, 326, 3, null); T('TONE', x, 365, 3, null);
    VRAW = true; T('REV', x - 11.3, 411, 2.5, '#E8C63A'); T('DLY', x + 11.3, 411, 2.5, '#35C46B'); VRAW = false;      // the two sends, in the let-in row
    stops(x, 268, 9.5); stops(x, 307, 9.5); stops(x, 347, 9.5);
    rr(x - 7.5, 378, x + 7.5, 458, 1.6, COLCOL[i], '#07080A');
    g.strokeStyle = 'rgba(216,216,216,.35)'; g.lineWidth = 0.3;
    for (var k = 0; k <= 10; k++){ var yy = V(386 + k * 6.5); g.beginPath(); g.moveTo(U(x) - 7.6, yy); g.lineTo(U(x) - (k % 5 ? 5.6 : 4.8), yy); g.stroke(); g.beginPath(); g.moveTo(U(x) + 7.6, yy); g.lineTo(U(x) + (k % 5 ? 5.6 : 4.8), yy); g.stroke(); }
    if (i < 10){ g.strokeStyle = 'rgba(216,216,216,.22)'; g.lineWidth = 0.3; g.beginPath(); g.moveTo(U(x + 22.15), V(256)); g.lineTo(U(x + 22.15), V(460)); g.stroke(); }
  });
  // common section 2
  T('VALUE', SIDEX - 22, 246, 2.8, null); VRAW = true; T('TEMPO', SIDEX, 366, 3.2, null); T('SHUFFLE', SIDEX, 450, 2.8, null); VRAW = false;      // the side column: placed by hand (VRAW), top to bottom
  VRAW = true; T('INSTANT FX · HOLD', 145, 417, 2.3, '#B8B8B4'); VRAW = false;
  // pads
  PADX.forEach(function(x, i){ T(String(i + 1), x - 12, 529, 3.4, '#E6E6E2', 'bold', 'left'); });
  INST.forEach(function(n, i){ T(n, PADX[i], 592, 3.6, 'rgba(230,230,226,.8)', 'A'); });
  T('ROLL', 631, 592, 3, 'rgba(230,230,226,.8)', 'A'); T('16', 600, 592, 2.4, '#B8B8B4'); T('32', 662, 592, 2.4, '#B8B8B4');
  T('FILL IN', 687, 592, 3, 'rgba(230,230,226,.8)', 'A'); T('TAP', 762, 592, 3, 'rgba(230,230,226,.8)', 'A');
  rr(106, 582, 160, 600, 1, line, '#23262C'); T('START / STOP', 133, 591.6, 4, '#F4F4F0', 'A');
  g.setTransform(1, 0, 0, 1, 0, 0);
  if (panelTex) panelTex.needsUpdate = true;
}
paintPanel(); panelTex = smoothTex(panelC);
if (document.fonts && document.fonts.load) document.fonts.load('20px Anton').then(function(){ paintPanel(); CTLIST.forEach(function(c){ if (c.repaintFace) c.repaintFace(); }); }).catch(function(){});
if (document.fonts && document.fonts.load) document.fonts.load('20px "Merchant Copy"').then(paintPanel).catch(function(){});      // the drum names wait for their face too

(function(){
  var W2 = PANEL.w * SC, D2 = PANEL.h * SC, TH = 0.11;
  var top = new THREE.Mesh(new THREE.PlaneGeometry(W2, D2), new THREE.MeshPhongMaterial({ color:0x8C8C8C, map:panelTex, emissive:0xffffff, emissiveMap:panelTex, emissiveIntensity:0.5, shininess:8, specular:0x0A0A0A }));
  top.rotation.x = -Math.PI / 2; top.receiveShadow = true; TRG.add(top); solid(top, 'trbody');
  var body = new THREE.Mesh(new THREE.BoxGeometry(W2 + 0.012, TH, D2 + 0.012), new THREE.MeshPhongMaterial({ color:0x1B1D22, shininess:30, specular:0x222222, flatShading:true })); body.position.y = -TH / 2 - 0.0015; body.castShadow = true; TRG.add(body); solid(body, 'trbody');
  BLOCKS.push(devBlock(TRPOS, 0.52));
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
function fader(i){
  var px = COLX[i], zTop = LZ(386), zBot = LZ(451), g = new THREE.Group(); g.position.set(LX(px), 0, 0); HOST.add(g);
  var capM = new THREE.MeshPhongMaterial({ color:0x9A9A96, shininess:30, specular:0x222222, flatShading:true, emissive:0x000000 });
  var cap = new THREE.Mesh(new THREE.BoxGeometry(0.023, 0.011, 0.013), capM); cap.castShadow = true; g.add(cap);
  var stripe = new THREE.Mesh(new THREE.BoxGeometry(0.0235, 0.0115, 0.002), new THREE.MeshBasicMaterial({ color:0x15171A })); cap.add(stripe);
  var glowM = new THREE.MeshBasicMaterial({ color:new THREE.Color(COLCOL[i]) });
  var glow = new THREE.Mesh(new THREE.PlaneGeometry(0.006, 1), glowM); glow.rotation.x = -Math.PI / 2; glow.position.y = 0.0012; g.add(glow);
  var hit = new THREE.Mesh(new THREE.BoxGeometry(0.034, 0.026, zBot - zTop + 0.03), HITMAT); hit.position.set(0, 0.012, (zTop + zBot) / 2); g.add(hit);
  var c = { id:'lev' + i, kind:'fader', name:INAME[i] + ' level', inst:i, v:0.8, def:0.8, step:0.04, g:g, cap:cap, mat:capM, glow:glow, glowM:glowM,
    show:function(){ var z = lerp(zBot, zTop, c.v); cap.position.set(0, 0.0065, z); glow.scale.y = Math.max(0.001, zBot - z); glow.position.z = (zBot + z) / 2; },
    hover:function(on){ capM.emissive.setHex(on ? 0x2E6A44 : 0x000000); } };
  c.show();
  return reg(c, [cap, hit]);
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

/* ---- every control on the panel ---- */
var FXYEL = 0xE8C63A, FXGRN = 0x35C46B;      // the reverb level knob is yellow and the delay level knob green; each drum has a small send knob in each colour
knob('volume', 145, 213, 6.5, 'Volume', 0.8);
knob('accent', TRX(226), 212, 6.5, 'Accent level', 0.6); knob('reverb', TRX(306), 212, 6.5, 'Reverb level', 0.3, { color:FXYEL, tick:0x15130A });
knob('dlevel', TRX(346), 212, 6.5, 'Delay level', 0.2, { color:FXGRN, tick:0x0A150E }); knob('dtime', TRX(386), 212, 6.5, 'Delay time', 0.5, { step:0.1 }); knob('dfb', TRX(427), 212, 6.5, 'Delay feedback', 0.4);
knob('fxctrl', TRX(508), 212, 6.5, 'Master FX', 0.5); knob('fillknob', TRX(588), 212, 6.5, 'Auto fill-in', 0.2, { step:0.2 });
COLX.forEach(function(x, i){
  knob('tune' + i, x, 268, 6.5, INAME[i] + ' tune', 0.5).inst = i;
  knob('decay' + i, x, 307, 6.5, INAME[i] + ' decay', 0.5).inst = i;
  knob('ctrl' + i, x, 347, 6.5, INAME[i] + ' tone', 0.5).inst = i;                  // the voice's own character (this knob was labelled CTRL)
  VRAW = true; knob('rsend' + i, x - 11.3, 394, 4.8, INAME[i] + ' reverb send', 0, { h:7, color:FXYEL, tick:0x15130A }).inst = i; knob('dsend' + i, x + 11.3, 394, 4.8, INAME[i] + ' delay send', 0, { h:7, color:FXGRN, tick:0x0A150E }).inst = i; VRAW = false;
  fader(i);
});
knob('value', SIDEX - 22, 268, 8, 'Value', 0, { endless:true, step:1 / 24, sides:14 });
VRAW = true; knob('tempo', SIDEX, 402, 13.5, 'Tempo', 0, { endless:true, step:1 / 60, sides:16, h:10, ring:0x3BFF6A });
knob('shuffle', SIDEX, 470, 6.5, 'Shuffle', 0.5); VRAW = false;

var RED = 0xFF2A3C, GRN = 0x3BFF6A, WHT = 0xFFFFFF, ORG = 0xFF8A2A;
/* the left column: ten square 16 mm buttons in two groups (editing above, motion and inst below), with a gap between the groups */
button('shift', 120, 262, 16, 16, 'SHIFT', 'Shift', WHT); button('clear', 170, 262, 16, 16, 'CLEAR', 'Clear', WHT);
button('ptn', 120, 296, 16, 16, 'PTN\nSELECT', 'Pattern select', GRN); button('trrec', 170, 296, 16, 16, 'TR-REC', 'TR-REC · step recording', RED);
button('last', 120, 330, 16, 16, 'LAST', 'Last step', GRN); button('sub', 170, 330, 16, 16, 'SUB', 'Sub steps', GRN);
VRAW = true;      /* the lower group: INST PLAY / INST REC, then the two instant effects (MOTION ON / REC were here and did nothing) */
button('instplay', 120, 392, 16, 16, 'INST\nPLAY', 'Inst play · play the pads', GRN); button('instrec', 170, 392, 16, 16, 'INST\nREC', 'Inst rec · record the pads', RED);
button('fxrpt', 120, 434, 16, 16, 'BEAT\nREPEAT', 'Beat repeat · hold', ORG); button('fxwarp', 170, 434, 16, 16, 'ROLL', 'Roll · hold', 0xD24BFF); VRAW = false;      // the two instant effects: drums only, on while held
'ABCDEFGH'.split('').forEach(function(L, k){ button('var' + k, [113, 135, 158, 181][k % 4], k < 4 ? 456 : 489, 8, 14, L, 'Variation ' + L, GRN).vi = k; });
pad('start', 133, 557, 21, 15.5, 0xF4F4F4, 'Start / Stop');
button('accstep', TRX(266), 212, 11, 8.5, 'STEP', 'Accent steps', ORG);
button('fxon', TRX(467), 212, 11, 8.5, 'ON', 'Master FX on', ORG);
button('fillon', TRX(548), 208, 11, 8.5, 'ON', 'Auto fill-in on', GRN); button('filledit', TRX(548), 224, 11, 7.5, 'EDIT', 'Edit the fill-in', WHT); button('filltrig', TRX(628), 212, 11, 9.5, 'MANUAL\nTRIG', 'Fill-in now', WHT);
COLX.forEach(function(x, i){ button('sel' + i, x, 483, 12, 8.5, INST[i], INAME[i], GRN).inst = i; button('mt' + i, x, 501, 12, 7, 'MUTE', INAME[i] + ' mute', RED).mi = i; });      // the selected drum lights green; a mute is red when on
button('copy', SIDEX + 22, 268, 12, 8.5, 'COPY', 'Copy', GRN);
button('kit', SIDEX - 22, 305, 12, 8.5, 'KIT', 'Kit', GRN); button('inst', SIDEX + 22, 305, 12, 8.5, 'INST', 'Instrument tone', GRN);
VRAW = true; pad('instpad', SIDEX, 524, 19, 20, 0xF4F4F4, 'Inst pad'); VRAW = false;
PADX.forEach(function(x, i){ pad('pad' + i, x, 555, 15.5, 19, PADCOL[i], 'Pad ' + (i + 1)).pi = i; });
var HALFBAR = [0, 1].map(function(h){                          // a thin bar over pads 1-8 or 9-16: the half the number keys switch in step record
  var x0 = LX(PADX[h * 8] - 8), x1 = LX(PADX[h * 8 + 7] + 8), m = new THREE.Mesh(new THREE.BoxGeometry(x1 - x0, 0.003, Math.abs(LZ(523.4) - LZ(521.4))), new THREE.MeshBasicMaterial({ color:0x202226 }));
  m.position.set((x0 + x1) / 2, 0.0016, LZ(522.4)); m.userData.noShadow = true; HOST.add(m); return m;
});

/* ---- the two screens ---- */
var dispC = mk(512, 252), dispT = canvasTex(dispC); dispT.minFilter = THREE.LinearFilter; dispT.magFilter = THREE.LinearFilter;
var tempoC = mk(192, 96), tempoT = canvasTex(tempoC); tempoT.minFilter = THREE.LinearFilter; tempoT.magFilter = THREE.LinearFilter;
(function(){
  var bez = new THREE.Mesh(new THREE.BoxGeometry(0.106, 0.004, 0.054), blackMat); bez.position.set(lx(SIDEX), 0.002, lz(210)); TRG.add(bez);                                       // as wide as the side column allows and twice as tall as it was, so two or three lines of large type fit
  var d = new THREE.Mesh(new THREE.PlaneGeometry(0.102, 0.05), new THREE.MeshBasicMaterial({ map:dispT })); d.rotation.x = -Math.PI / 2; d.position.set(lx(SIDEX), 0.0045, lz(210)); TRG.add(d);
  var bez2 = new THREE.Mesh(new THREE.BoxGeometry(0.058, 0.004, 0.031), blackMat); bez2.position.set(lx(SIDEX), 0.002, lz(340)); TRG.add(bez2);
  var t = new THREE.Mesh(new THREE.PlaneGeometry(0.054, 0.027), new THREE.MeshBasicMaterial({ map:tempoT })); t.rotation.x = -Math.PI / 2; t.position.set(lx(SIDEX), 0.0045, lz(340)); TRG.add(t);
  [bez, d, bez2, t].forEach(function(m){ m.userData.ia = 'trbody'; m.userData.noShadow = true; solids.push(m); });
})();
// a glow thrown up from the lit pads onto whoever is standing over them
var padGlow = new THREE.PointLight(0xFF6A4A, 0.0, 1.6, 2); padGlow.position.set(0, 0.25, 0.2); TRG.add(padGlow);
