(function(){
"use strict";
var A = window.JB_ASSETS;
var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
var touchOnly = window.matchMedia('(hover: none)').matches;
var live = document.getElementById('live');
/* Online rooms hang off this one function: every machine saves and loads through it. REMOTE lets a machine "load" a state that
   came from the room instead of this browser; storeHook sees every save so it can be sent on; only the room's first player keeps
   writing the room's state into their own browser. */
/* the factory patterns: a set made in the room and exported from the wall panel (vendor/defaults.json) */
var DEF = window.JB_DEFAULTS || null;
function defCopy(x){ return JSON.parse(JSON.stringify(x)); }
var MPQUIET = false;            // set while a Snake's custom lane is turning a knob, so it is not sent to the room as if a hand did it
var SNLEARN = null;             // the Snake waiting to learn which knob its custom lane should turn
var MPON = false, MPHOST = true, REMOTE = {}, storeHook = null, RESTORE = {}, SAVENOW = [];
function saveMs(d){ return MPON ? 250 : d; }
function store(k, v){ try { if (v === undefined) return (k in REMOTE) ? REMOTE[k] : localStorage.getItem(k); if (storeHook) storeHook(k, v); if (!MPON || MPHOST || k.indexOf('jambutek-studio-') !== 0) localStorage.setItem(k, v); } catch (e) {} return null; }

/* ================= renderer: draw small, then blow it up with dither (same pipeline as the arcade) ================= */
var canvas = document.getElementById('view');
var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias:false, powerPreference:'high-performance' });
renderer.setPixelRatio(1);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.BasicShadowMap;

var LINES_OPTS = [600, 420, 300, 220], linesIdx = 0, nearSharp = false;   // starts at the sharpest; P steps down through the chunkier sizes
var rt = new THREE.WebGLRenderTarget(4, 4, { minFilter:THREE.NearestFilter, magFilter:THREE.NearestFilter });
rt.depthTexture = new THREE.DepthTexture(4, 4); rt.depthTexture.type = THREE.UnsignedIntType;
var post = new THREE.ShaderMaterial({
  uniforms:{ tDiffuse:{value:rt.texture}, res:{value:new THREE.Vector2(4,4)}, time:{value:0}, levels:{value:26}, flash:{value:0}, grain:{value:0.045}, fxScale:{value:1} },
  vertexShader:'varying vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position.xy,0.,1.); }',
  fragmentShader:[
    'uniform sampler2D tDiffuse; uniform vec2 res; uniform float time; uniform float levels; uniform float flash; uniform float grain; uniform float fxScale;',
    'varying vec2 vUv;',
    'float m2(vec2 q){ return mod(2.*q.x + 3.*q.y, 4.); }',
    'float bayer(vec2 a){ a = mod(floor(a), 4.); return (4.*m2(mod(a, 2.)) + m2(floor(a*.5))) / 16.; }',
    'float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233)))*43758.5453); }',
    'void main(){',
    '  vec2 px = floor(vUv*res);',
    '  vec2 uv = (px+.5)/res;',
    '  vec3 c = texture2D(tDiffuse, uv).rgb;',
    '  c += vec3(flash*.9, flash, flash*.85);',
    '  vec2 fp = floor(px / fxScale);',
    '  float b = bayer(fp) - .5;',
    '  c = floor(c*levels + .5 + b) / levels;',
    '  c += (hash(fp + fract(time)*vec2(37.,91.)) - .5) * grain;',
    '  vec2 d = vUv - .5; c *= 1. - dot(d,d)*1.05;',
    '  gl_FragColor = vec4(c, 1.);',
    '}'].join('\n'),
  depthTest:false, depthWrite:false
});
var postScene = new THREE.Scene(), postCam = new THREE.OrthographicCamera(-1,1,1,-1,0,1);
postScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2,2), post));

var scene = new THREE.Scene();
scene.background = new THREE.Color(0x05070A);
scene.fog = new THREE.Fog(0x05070A, 5, 13.5);
var camera = new THREE.PerspectiveCamera(55, 1, 0.05, 30), baseFov = 55;
var mode = 'walk';                          // 'walk', or 'tr' while leaning over the drum machine

function resize(){
  var w = window.innerWidth || 800, h = window.innerHeight || 600;
  renderer.setSize(w, h, false);
  var lines = Math.min(mode === 'tr' ? 4000 : Math.max(LINES_OPTS[linesIdx], nearSharp && linesIdx === 0 ? 860 : 0), h);   // sharper still when you are standing at the gear     // lean in and the panel renders sharp, like the pinball table
  var rw = Math.max(64, Math.round(lines * w / h)), rh = Math.max(48, Math.round(lines));
  rt.setSize(rw, rh); post.uniforms.res.value.set(rw, rh);
  var aspect = w / h;
  camera.aspect = aspect;
  var needH = 2 * Math.atan(Math.tan(Math.atan(1.0 / 2.7)) / aspect) * 180 / Math.PI;
  camera.fov = baseFov = Math.max(55, Math.min(84, needH));
  camera.updateProjectionMatrix();
}
window.addEventListener('resize', resize);

/* ================= textures ================= */
var loader = new THREE.TextureLoader();
var pending = 0;
function tex(src){
  pending++;
  var t = loader.load(src, function(){ if (--pending === 0) ready(); }, undefined, function(){ if (--pending === 0) ready(); });
  t.magFilter = THREE.NearestFilter; t.minFilter = THREE.NearestMipmapLinearFilter;
  return t;
}
function canvasTex(c, repeat){
  var t = new THREE.CanvasTexture(c);
  t.magFilter = THREE.NearestFilter; t.minFilter = THREE.NearestMipmapLinearFilter;
  if (repeat){ t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(repeat[0], repeat[1]); }
  return t;
}
function smoothTex(c){ var t = new THREE.CanvasTexture(c); t.magFilter = THREE.LinearFilter; t.minFilter = THREE.LinearMipmapLinearFilter; t.anisotropy = renderer.capabilities.getMaxAnisotropy(); return t; }
function mk(w, h){ var c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
function rnd(a, b){ return a + Math.random() * (b - a); }
function lerp(a, b, t){ return a + (b - a) * t; }
function clamp(v, a, b){ return v < a ? a : v > b ? b : v; }
var FONT = 'Anton, Impact, "Arial Narrow", sans-serif';

function concrete(){
  var c = mk(128, 128), g = c.getContext('2d');
  g.fillStyle = '#161C26'; g.fillRect(0,0,128,128);
  for (var i = 0; i < 2600; i++){
    g.fillStyle = Math.random() < .5 ? 'rgba(5,7,10,' + rnd(.05,.25) + ')' : 'rgba(60,78,96,' + rnd(.03,.12) + ')';
    g.fillRect((Math.random()*128)|0, (Math.random()*128)|0, 1 + (Math.random()*2|0), 1 + (Math.random()*2|0));
  }
  for (var s = 0; s < 9; s++){
    var x = (Math.random()*128)|0, len = rnd(20, 90), gr = g.createLinearGradient(0, 0, 0, len);
    gr.addColorStop(0, 'rgba(4,6,9,.35)'); gr.addColorStop(1, 'rgba(4,6,9,0)');
    g.fillStyle = gr; g.fillRect(x, 0, 1 + (Math.random()*3|0), len);
  }
  g.fillStyle = 'rgba(4,6,9,.5)'; g.fillRect(0, 0, 128, 1); g.fillRect(0, 0, 1, 128);
  return c;
}
function floorTex(){
  var c = mk(64, 64), g = c.getContext('2d');
  g.fillStyle = '#0D1118'; g.fillRect(0,0,64,64);
  for (var i = 0; i < 700; i++){ g.fillStyle = 'rgba(' + (Math.random()<.5 ? '0,0,0' : '70,90,110') + ',' + rnd(.04,.16) + ')'; g.fillRect((Math.random()*64)|0, (Math.random()*64)|0, 1, 1); }
  g.fillStyle = '#06080C'; g.fillRect(0, 0, 64, 1); g.fillRect(0, 0, 1, 64);
  g.fillStyle = 'rgba(48,168,240,.55)'; g.fillRect(31, 31, 2, 2);
  return c;
}
function woodTex(){
  var c = mk(64, 64), g = c.getContext('2d');
  g.fillStyle = '#3A2A20'; g.fillRect(0,0,64,64);
  for (var y = 0; y < 64; y += 2){ g.fillStyle = 'rgba(' + (Math.random()<.5 ? '20,12,8' : '90,62,42') + ',' + rnd(.15,.4) + ')'; g.fillRect(0, y, 64, 1); }
  for (var k = 0; k < 4; k++){ g.fillStyle = 'rgba(15,9,6,.6)'; g.fillRect(0, (Math.random()*64)|0, 64, 1); }
  return c;
}

/* ================= interaction registry ================= */
var solids = [];                 // everything a look-ray can hit (it stops at the first)
function solid(o, ia){
  o.traverse(function(m){ if (m.isMesh){ solids.push(m); if (ia) m.userData.ia = ia; } });
  return o;
}

/* ================= the room: same footprint, height and finishes as the arcade ================= */
var ROOM = { x0:-4.5, x1:4.5, z0:-1.6, z1:7.4, h:3.2 };
var wallMat  = new THREE.MeshLambertMaterial({ map: canvasTex(concrete(), [6, 2.2]) });
var wallMat2 = new THREE.MeshLambertMaterial({ map: canvasTex(concrete(), [7, 2.2]) });
var floorMat = new THREE.MeshLambertMaterial({ map: canvasTex(floorTex(), [18, 18]) });
var ceilMat  = new THREE.MeshLambertMaterial({ color:0x0A0D13 });
var trimMat  = new THREE.MeshLambertMaterial({ color:0x0F1520 });
var woodMat  = new THREE.MeshLambertMaterial({ map: canvasTex(woodTex(), [2, 1]) });
var blackMat = new THREE.MeshLambertMaterial({ color:0x121418 });
var metalMat = new THREE.MeshPhongMaterial({ color:0x1A1C22, shininess:20, specular:0x0C0C0C, flatShading:true });

function plane(w, h, mat, sx, sy){ return new THREE.Mesh(new THREE.PlaneGeometry(w, h, sx||1, sy||1), mat); }
var W = ROOM.x1 - ROOM.x0, D = ROOM.z1 - ROOM.z0, cz = (ROOM.z0 + ROOM.z1)/2;
var floor = plane(W, D, floorMat, 24, 24); floor.rotation.x = -Math.PI/2; floor.position.set(0, 0, cz); floor.receiveShadow = true; scene.add(floor);
solid(floor, 'floor');
var ceil = plane(W, D, ceilMat, 8, 8); ceil.rotation.x = Math.PI/2; ceil.position.set(0, ROOM.h, cz); scene.add(ceil);
function wall(w, h, mat, sx, sy, rotY, x, z, id){
  var m = plane(w, h, mat, sx, sy); m.rotation.y = rotY; m.position.set(x, h/2, z); m.receiveShadow = true;
  m.userData.wall = id; scene.add(m); solid(m, 'wall'); return m;
}
wall(W, ROOM.h, wallMat, 24, 10, 0, 0, ROOM.z0, 0);
wall(W, ROOM.h, wallMat2, 16, 6, Math.PI, 0, ROOM.z1, 1);
wall(D, ROOM.h, wallMat2, 20, 8, Math.PI/2, ROOM.x0, cz, 2);
wall(D, ROOM.h, wallMat2, 20, 8, -Math.PI/2, ROOM.x1, cz, 3);
(function(){
  var sk = new THREE.BoxGeometry(1, 0.14, 0.05);
  [[0, ROOM.z0+0.025, W, 0], [0, ROOM.z1-0.025, W, 0], [ROOM.x0+0.025, cz, D, 1], [ROOM.x1-0.025, cz, D, 1]].forEach(function(s){
    var m = new THREE.Mesh(sk, trimMat); m.scale.x = s[2]; m.position.set(s[0], 0.07, s[1]); if (s[3]) m.rotation.y = Math.PI/2; scene.add(m);
    var t = m.clone(); t.position.y = ROOM.h - 0.07; scene.add(t);
  });
})();

/* pendant lamps: one bare bulb per station */
function pendant(x, z, drop, color, intensity, tx, ty, tz, angle, shadow, bare){
  var g = new THREE.Group(); g.position.set(x, ROOM.h, z); scene.add(g);
  var cord = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, drop, 4), new THREE.MeshLambertMaterial({ color:0x111111 }));
  cord.position.y = -drop/2; g.add(cord); if (bare) g.visible = false;                  // bare: just the light, the fitting is drawn elsewhere
  var shade = new THREE.Mesh(new THREE.ConeGeometry(0.26, 0.2, 7, 1, true), new THREE.MeshLambertMaterial({ color:0x1878C0, side:THREE.DoubleSide }));
  shade.position.y = -drop - 0.08; g.add(shade);
  var bulb = new THREE.Mesh(new THREE.IcosahedronGeometry(0.055, 0), new THREE.MeshBasicMaterial({ color:0xFFF1D6 }));
  bulb.position.y = -drop - 0.16; g.add(bulb);
  var l = new THREE.SpotLight(color, intensity, 7.5, angle, 0.55, 1.4);
  l.position.set(x, ROOM.h - drop - 0.18, z); l.target.position.set(tx, ty, tz);
  if (shadow){ l.castShadow = true; l.shadow.mapSize.set(1024, 1024); l.shadow.camera.near = 0.25; l.shadow.camera.far = 6; l.shadow.bias = -0.003; l.shadow.normalBias = 0.015; }
  [cord, shade, bulb].forEach(function(m){ m.userData.noShadow = true; });
  scene.add(l); scene.add(l.target);
  return { light:l, bulb:bulb, base:intensity };
}
var ambient = new THREE.AmbientLight(0x2E3A52, 1.05); scene.add(ambient);
/* The gear stands in a square in the middle of the room, a row along each side, every instrument facing outwards, so the
   players stand around the outside and look at each other across it. Each position is where the instrument stands and
   which way its player faces it: r is the turn about the upright axis (0 = the player stands on the +z side). */
var RIG = { x:0, z:2.9, R:1.8 };
var TRPOS = { x:-0.75, z:RIG.z - RIG.R, r:Math.PI }, MFPOS = { x:0.72, z:RIG.z - RIG.R, r:Math.PI },                                     // north row
    BSPOS = { x:-0.9, z:RIG.z + RIG.R, r:0 }, AMPOS = { x:0.2, z:RIG.z + RIG.R, r:0 }, MBPOS = { x:1.1, z:RIG.z + RIG.R, r:0 },              // south row
    MXPOS = { x:-RIG.R, z:2.0, r:-Math.PI / 2 }, TPPOS = { x:-RIG.R, z:3.05, r:-Math.PI / 2 }, MCPOS = { x:-RIG.R, z:3.95, r:-Math.PI / 2 }, // west row
    SHPOS = { x:RIG.R, z:2.3, r:Math.PI / 2 }, SCPOS = { x:RIG.R, z:3.5, r:Math.PI / 2 },
    PFPOS = { x:ROOM.x1 - 1.31, z:ROOM.z0 + 1.31, r:Math.PI * 0.75 }, PGPOS = { x:ROOM.x0 + 1.31, z:ROOM.z1 - 1.31, r:-Math.PI * 0.25 };       // east row
function devStand(P){ return { x:P.x + Math.sin(P.r) * 0.95, z:P.z + Math.cos(P.r) * 0.95 }; }
function devBlock(P, hw){ var c = Math.cos(P.r), n = Math.sin(P.r), xs = [], zs = []; [[-hw, -0.5], [hw, -0.5], [-hw, 0.34], [hw, 0.34]].forEach(function(q){ xs.push(P.x + q[0] * c + q[1] * n); zs.push(P.z - q[0] * n + q[1] * c); }); return [Math.min.apply(null, xs), Math.max.apply(null, xs), Math.min.apply(null, zs), Math.max.apply(null, zs)]; }
var trLamp = pendant(0, TRPOS.z - 0.9, 0.62, 0xFFE7C8, 2.3, 0, 1.0, TRPOS.z, 1.1, false, true);            // one lamp over each side of the rig
var wash = new THREE.SpotLight(0x7AA6D2, 1.5, 9, 0.95, 0.8, 1.2);
wash.position.set(0, ROOM.h - 0.1, 2.6); wash.target.position.set(0, 1.4, ROOM.z0); scene.add(wash); scene.add(wash.target);
var sideLampR = pendant(0, BSPOS.z + 0.9, 0.62, 0xFFE7C8, 2.3, 0, 1.0, BSPOS.z, 1.1, false, true);
var endLamp = pendant(-RIG.R - 0.9, RIG.z, 0.62, 0xFFE7C8, 2.2, -RIG.R, 1.0, RIG.z, 1.05, false, true);
var eastLamp = pendant(RIG.R + 0.9, RIG.z, 0.62, 0xFFE7C8, 2.2, RIG.R, 1.0, RIG.z, 1.05, false, true);

/* ================= studio dressing ================= */
var BLOCKS = [];                              // floor footprints the player can't walk through
BLOCKS.push([RIG.x - 1.5, RIG.x + 1.5, RIG.z - 1.5, RIG.z + 1.5]);          // nobody walks through the middle of the rig
// the label's jambu in neon on the back wall, as in the arcade
/* a moulded cut-out: the artwork's own silhouette, extruded, with the art on its face */
function moulded(outline, texSrc, size, depth, sideColor, sideGlow){
  var s = new THREE.Shape();
  outline.forEach(function(p, i){ i ? s.lineTo(p[0], p[1]) : s.moveTo(p[0], p[1]); });
  var geo = new THREE.ExtrudeGeometry(s, { depth:depth / size, bevelEnabled:true, bevelThickness:0.012, bevelSize:0.008, bevelSegments:1, curveSegments:1 });
  geo.translate(-0.5, 0, 0);
  var t = tex(texSrc); t.minFilter = THREE.LinearMipmapLinearFilter; t.magFilter = THREE.LinearFilter;
  var face = new THREE.MeshPhongMaterial({ map:t, transparent:true, alphaTest:0.3, emissive:0xffffff, emissiveMap:t, emissiveIntensity:0, shininess:30 });
  var side = new THREE.MeshPhongMaterial({ color:sideColor, emissive:sideGlow || 0x000000, emissiveIntensity:sideGlow ? 1 : 0, shininess:20, flatShading:true });
  var m = new THREE.Mesh(geo, [face, side]);
  m.scale.set(size, size, size); m.castShadow = true;
  return { mesh:m, face:face, side:side };
}
var LOGO_OUTLINE = [[0.482, 1.0], [0.443, 0.988], [0.327, 0.914], [0.278, 0.866], [0.243, 0.816], [0.212, 0.751], [0.214, 0.731], [0.241, 0.701], [0.243, 0.668], [0.131, 0.637], [0.099, 0.622], [0.074, 0.601], [0.042, 0.539], [0.032, 0.445], [0.043, 0.378], [0.086, 0.307], [0.094, 0.248], [0.108, 0.204], [0.133, 0.159], [0.165, 0.124], [0.192, 0.105], [0.271, 0.07], [0.317, 0.062], [0.38, 0.063], [0.417, 0.037], [0.448, 0.024], [0.523, 0.016], [0.625, 0.036], [0.68, 0.068], [0.714, 0.108], [0.731, 0.151], [0.727, 0.266], [0.767, 0.274], [0.813, 0.294], [0.878, 0.356], [0.905, 0.417], [0.905, 0.499], [0.959, 0.649], [0.967, 0.717], [0.953, 0.766], [0.926, 0.796], [0.763, 0.918], [0.694, 0.954], [0.625, 0.98], [0.566, 0.993]];
var logo = moulded(LOGO_OUTLINE, A.logo, 0.82, 0.07, 0xFF2A6A, 0xFF1E5A);
logo.mesh.position.set(0, 1.8, ROOM.z0 + 0.01); logo.mesh.castShadow = false; logo.mesh.userData.noShadow = true; scene.add(logo.mesh); solid(logo.mesh, 'sign');
logo.face.emissiveIntensity = 0.85; logo.face.fog = false; logo.side.fog = false;
var logoGlow = new THREE.PointLight(0xFF3C7A, 1.2, 3.6, 1.5); logoGlow.position.set(0, 2.18, ROOM.z0 + 0.55); scene.add(logoGlow);
var logoHalo = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 1.7), new THREE.MeshBasicMaterial({ transparent:true, opacity:0.5, blending:THREE.AdditiveBlending, depthWrite:false, color:0xFF2A6A,
  map:(function(){ var c = mk(64, 64), g = c.getContext('2d'), gr = g.createRadialGradient(32,32,0,32,32,32);
    gr.addColorStop(0, 'rgba(255,255,255,.75)'); gr.addColorStop(.45, 'rgba(255,255,255,.25)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0,0,64,64); return canvasTex(c); })() }));
logoHalo.position.set(0, 2.21, ROOM.z0 + 0.008); logoHalo.material.fog = false; logoHalo.userData.noShadow = true; scene.add(logoHalo);
[[0, ROOM.z1, Math.PI], [ROOM.x0, (ROOM.z0 + ROOM.z1) / 2, Math.PI / 2], [ROOM.x1, (ROOM.z0 + ROOM.z1) / 2, -Math.PI / 2]].forEach(function(w){          // the same sign on the other three walls, sharing its tubes so they all pump together
  var g = new THREE.Group(); g.position.set(w[0], 0, w[1]); g.rotation.y = w[2]; scene.add(g);
  var m = new THREE.Mesh(logo.mesh.geometry, logo.mesh.material); m.scale.copy(logo.mesh.scale); m.position.set(0, 1.8, 0.01); m.userData.noShadow = true; g.add(m); solid(m, 'sign');
  var h = new THREE.Mesh(logoHalo.geometry, logoHalo.material); h.position.set(0, 2.21, 0.008); h.userData.noShadow = true; g.add(h);
});
var logoFx = { next: performance.now() + 4000, until: 0 };
function logoPower(now){                        // mostly steady; every so often the tube stutters
  if (now > logoFx.next && now > logoFx.until){ logoFx.until = now + rnd(350, 900); logoFx.next = now + rnd(4000, 12000); }
  if (now < logoFx.until){ var f = Math.sin(now * 0.09) + Math.sin(now * 0.23); return f > 0.4 ? 1 : f > -0.2 ? 0.35 : 0.05; }
  return 0.92 + 0.08 * Math.sin(now * 0.004);
}
// two monitors on stands, faced with the Jambutek speaker art
var monitors = (function(){
  var tl = tex(A.spkL), tr = tex(A.spkR); tl.minFilter = tr.minFilter = THREE.LinearFilter;
  return [[-4.1, tl], [4.1, tr]].map(function(s){
    var w = 0.42, h = w * 620 / 361, g = new THREE.Group(); g.position.set(s[0], 0, 0.9); g.rotation.y = (s[0] > 0 ? -1 : 1) * (Math.PI / 2 + 0.35); scene.add(g);
    var pole = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.9, 6), metalMat); pole.position.y = 0.45; g.add(pole);
    var foot = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.24, 0.04, 8), metalMat); foot.position.y = 0.02; g.add(foot);
    var top = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.03, 0.34), metalMat); top.position.set(0, 0.9, -0.1); g.add(top);
    var box = new THREE.Mesh(new THREE.BoxGeometry(w * 0.92, h * 0.96, 0.3), new THREE.MeshLambertMaterial({ color:0x0C1018 })); box.position.set(0, 0.915 + h / 2, -0.155); g.add(box);
    var face = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshPhongMaterial({ map:s[1], emissive:0xffffff, emissiveMap:s[1], emissiveIntensity:0.25, alphaTest:0.5 }));
    face.position.y = 0.915 + h / 2; g.add(face);
    solid(g, 'monitor');
    BLOCKS.push([s[0] - 0.4, s[0] + 0.4, 0.5, 1.3]);
    return { g:g, face:face, box:box, y0:face.position.y };
  });
})();
