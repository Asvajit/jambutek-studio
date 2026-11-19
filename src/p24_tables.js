
/* ================= the rig's tables: the same long table on all four sides of the square =================
   The north one (drum machine, echo, mixer) is built in p8_mixer.js. This makes the other three to the same length, height and slant,
   seats every instrument on them side by side, and hangs each Snake off the back edge of the table above its synth: no stands, no
   separate legs for the sequencers. Units are thinner than the table's reference depth, so each is dropped until its base touches. */
var TBL = { L:(MXPOS.x + MXW * SC / 2) - (TRPOS.x - PANEL.w * SC / 2), D:MXD * SC, gap:0.04 };
(function(){
  function reg(Y){ for (var i = 0; i < RIGREG.length; i++) if (RIGREG[i].Y === Y) return RIGREG[i]; return null; }
  function strut(a, b){ var len = a.distanceTo(b), m = new THREE.Mesh(new THREE.BoxGeometry(0.028, 0.028, len), metalMat); m.position.copy(a).add(b).multiplyScalar(0.5); m.lookAt(b); m.userData.noShadow = true; scene.add(m); }
  var t = MXTILT, ct = Math.cos(t), st = Math.sin(t);
  // each side: where its middle is, which way it faces, and its slots in order. A slot is one or two units and maybe the Snake above them
  [ { P:{ x:-RIG.R, z:RIG.z, r:-Math.PI / 2 }, slots:[{ u:[[MFY, MFPOS]], sn:0 }, { u:[[TPY, TPPOS]], sn:3 }, { u:[[MCY, MCPOS]] }] },
    { P:{ x:RIG.x, z:RIG.z + RIG.R, r:0 }, slots:[{ u:[[BSY, BSPOS]], sn:1 }, { u:[[AMY, AMPOS]], sn:2 }, { u:[[MBY, MBPOS], [SCY, SCPOS]], sn:4 }] },
    { P:{ x:RIG.R, z:RIG.z, r:Math.PI / 2 }, slots:[{ u:[[SHY, SHPOS]], sn:5 }] }
  ].forEach(function(side){
    var P = side.P, cx = Math.cos(P.r), sx = Math.sin(P.r);
    var TY = new THREE.Group(); TY.position.set(P.x, MXH, P.z); TY.rotation.y = P.r; scene.add(TY);
    var TG = new THREE.Group(); TG.rotation.x = t; TY.add(TG); standFor(TY, TG, TBL.L, TBL.D, NTTH, MXH, t, TBL.L / 2 - 0.12, true); solid(TY, 'table'); BLOCKS.push(devBlock(P, TBL.L / 2 + 0.06));
    var w = side.slots.map(function(s){ var q = 0; s.u.forEach(function(a, i){ q += reg(a[0]).W2 + (i ? TBL.gap : 0); }); return q; }), tot = w.reduce(function(a, b){ return a + b; }, 0);
    var g = Math.max(0.02, (TBL.L - tot) / (side.slots.length + 1)), u = -(tot + g * (side.slots.length - 1)) / 2;
    side.slots.forEach(function(s, k){
      var u0 = u, mid = u + w[k] / 2;
      s.u.forEach(function(a){
        var R = reg(a[0]), uc = u0 + R.W2 / 2, d = NTTH - R.TH; u0 += R.W2 + TBL.gap;
        a[1].x = P.x + cx * uc; a[1].z = P.z - sx * uc; a[1].r = P.r;
        R.Y.position.set(a[1].x, MXH, a[1].z); R.Y.rotation.y = P.r; R.G.rotation.x = t; R.G.position.set(0, -d * ct, -d * st);
      });
      u += w[k] + g;
      if (s.sn == null) return;
      var S = SNAKES[s.sn], SG = S.G, SY = SG.parent, hp = { x:P.x + cx * mid, z:P.z - sx * mid, r:P.r };
      SY.position.set(hp.x - sx * 0.5, SY.position.y, hp.z - cx * 0.5); SY.rotation.y = P.r; scene.updateMatrixWorld(true);
      var hw = SNW * SC / 2, sd = SND * SC / 2;
      var edge = TG.localToWorld(new THREE.Vector3(mid, -NTTH - 0.002, -TBL.D / 2 - 0.02)), low = SG.localToWorld(new THREE.Vector3(0, -0.066, sd + 0.025));
      SY.position.add(edge.sub(low)); SY.position.y += 0.035; scene.updateMatrixWorld(true);                       // its lower edge sits just above the table's back edge
      [-1, 1].forEach(function(q){
        var a = TG.localToWorld(new THREE.Vector3(mid + q * (hw - 0.06), -NTTH - 0.014, -TBL.D / 2 - 0.02));
        strut(a, SG.localToWorld(new THREE.Vector3(q * (hw - 0.06), -0.062, sd)));                                      // a short foot under the lower edge
        strut(a, SG.localToWorld(new THREE.Vector3(q * (hw - 0.06), -0.062, -sd * 0.55)));                              // and a prop up to the back
      });
      S.hp = hp; S.x = hp.x; S.z = hp.z;
    });
  });
})();
