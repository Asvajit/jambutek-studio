
/* ================= snare lights: a fresnel stage light hung in each corner of the ceiling, aimed at the rig =================
   They glow on every snare hit and fade; how bright depends on how hard the snare was hit. They are not light sources: only the lens and a soft halo light up, the room does not flash.
   Model: "Stage Light - Fresnel" by Mike Rowley, CC BY-NC 4.0, baked to plain geometry in vendor/stagelight.json (see vendor/MODELS-NOTICE.md). */
var SNLIGHTS = [];
(function(){
  var F = window.JB_STAGELIGHT; if (!F) return;
  var gc = document.createElement('canvas'); gc.width = gc.height = 128; var gx = gc.getContext('2d'), gr = gx.createRadialGradient(64, 64, 0, 64, 64, 64);
  gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.18, 'rgba(255,255,255,0.55)'); gr.addColorStop(0.42, 'rgba(255,255,255,0.14)'); gr.addColorStop(0.7, 'rgba(255,255,255,0.025)'); gr.addColorStop(0.9, 'rgba(255,255,255,0)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); gx.fillStyle = gr; gx.fillRect(0, 0, 128, 128);
  var glowTex = new THREE.CanvasTexture(gc);
  var bodyGeo = bakedGeo(F.body), metalGeo = bakedGeo(F.metal), lensGeo = bakedGeo(F.lens);
  var bodyMat = new THREE.MeshPhongMaterial({ color:0x16171A, emissive:0x0B0C0E, shininess:18, specular:0x0A0A0A, side:THREE.DoubleSide }), fitMat = new THREE.MeshPhongMaterial({ color:0x2B2D31, emissive:0x121316, shininess:40, specular:0x333333, side:THREE.DoubleSide });
  var inset = 0.46;
  [[ROOM.x0 + inset, ROOM.z0 + inset], [ROOM.x1 - inset, ROOM.z0 + inset], [ROOM.x0 + inset, ROOM.z1 - inset], [ROOM.x1 - inset, ROOM.z1 - inset]].forEach(function(p){
    var g = new THREE.Group(); g.position.set(p[0], ROOM.h, p[1]); g.rotation.y = Math.atan2(RIG.x - p[0], RIG.z - p[1]); scene.add(g);        // the model hangs from its clamp and already tilts down at the rig
    var body = new THREE.Mesh(bodyGeo, bodyMat), fit = new THREE.Mesh(metalGeo, fitMat); g.add(body); g.add(fit);
    var lensMat = new THREE.MeshBasicMaterial({ color:0x120C06, side:THREE.DoubleSide }), lens = new THREE.Mesh(lensGeo, lensMat); g.add(lens);
    [body, fit, lens].forEach(function(m){ m.userData.noShadow = true; });
    var halo = new THREE.Sprite(new THREE.SpriteMaterial({ map:glowTex, color:0xFFC98A, transparent:true, opacity:0, blending:THREE.AdditiveBlending, depthWrite:false })); halo.position.set(F.lensC[0], F.lensC[1] - 0.02, F.lensC[2] + 0.07); halo.scale.set(1.5, 1.5, 1); halo.userData.noShadow = true; g.add(halo);
    SNLIGHTS.push({ lens:lensMat, halo:halo });
  });
})();
function snLightUpdate(dt){
  var s = SEQ.snare || 0, b = Math.min(1.3, s); b = Math.pow(b, 1.6);                      // squared, so a soft hit is clearly dimmer than a hard one
  for (var i = 0; i < SNLIGHTS.length; i++){ var L = SNLIGHTS[i]; var hs = 1.1 + 0.7 * b; L.halo.scale.set(hs, hs, 1); L.halo.material.opacity = Math.min(0.9, 0.85 * b); L.lens.color.setRGB(0.07 + 1.1 * b, 0.05 + 0.9 * b, 0.03 + 0.62 * b); }
  SEQ.snare = Math.max(0, s - dt * 4.5 * Math.max(0.25, s));
}
