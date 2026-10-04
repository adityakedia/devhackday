import * as THREE from 'three';

const TAU = Math.PI * 2;
const brass = () => new THREE.MeshStandardMaterial({ color: '#c9a35c', metalness: 0.72, roughness: 0.31 });

function mesh(group: THREE.Group, geometry: THREE.BufferGeometry, material: THREE.Material, x = 0, y = 0, z = 0) {
  const item = new THREE.Mesh(geometry, material);
  item.position.set(x, y, z);
  item.castShadow = item.receiveShadow = true;
  group.add(item);
  return item;
}

function tube(group: THREE.Group, points: THREE.Vector3[], radius: number, material: THREE.Material, segments = 48) {
  return mesh(group, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), segments, radius, 8, false), material);
}

function rod(group: THREE.Group, a: THREE.Vector3, b: THREE.Vector3, radius: number, material: THREE.Material) {
  const item = mesh(group, new THREE.CylinderGeometry(radius, radius, a.distanceTo(b), 10), material);
  item.position.copy(a).add(b).multiplyScalar(0.5);
  item.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize());
  return item;
}

function oval(group: THREE.Group, material: THREE.Material, position: number[], scale: number[]) {
  const item = mesh(group, new THREE.SphereGeometry(1, 36, 24), material, position[0], position[1], position[2]);
  item.scale.set(scale[0], scale[1], scale[2]);
  return item;
}

function texture(draw: (ctx: CanvasRenderingContext2D, size: number) => void, size = 512) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  draw(canvas.getContext('2d')!, size);
  const map = new THREE.CanvasTexture(canvas);
  map.colorSpace = THREE.SRGBColorSpace;
  map.anisotropy = 8;
  return map;
}

/** Braided loop has two visible legs, threaded through a real metal bail. */
function hangingLoop(group: THREE.Group, bailY: number, topY: number, color: string) {
  const thread = new THREE.MeshStandardMaterial({ color, roughness: 0.88 });
  const highlight = new THREE.MeshStandardMaterial({ color: '#e2b96d', roughness: 0.8 });
  const path = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.018, bailY - 0.022, -0.012),
    new THREE.Vector3(-0.024, bailY + 0.08, 0),
    new THREE.Vector3(-0.052, topY - 0.07, 0),
    new THREE.Vector3(0, topY, 0),
    new THREE.Vector3(0.052, topY - 0.07, 0),
    new THREE.Vector3(0.024, bailY + 0.08, 0),
    new THREE.Vector3(0.018, bailY - 0.022, 0.012),
    new THREE.Vector3(-0.018, bailY - 0.022, -0.012),
  ]);
  mesh(group, new THREE.TubeGeometry(path, 96, 0.012, 8, false), thread);
  for (let strand = 0; strand < 3; strand++) {
    const points = Array.from({ length: 161 }, (_, i) => {
      const t = i / 160;
      const p = path.getPoint(t);
      const tangent = path.getTangent(t);
      const normal = new THREE.Vector3(-tangent.y, tangent.x, 0).normalize();
      const a = t * TAU * 15 + strand * TAU / 3;
      return p.addScaledVector(normal, Math.cos(a) * 0.0085).add(new THREE.Vector3(0, 0, Math.sin(a) * 0.0085));
    });
    tube(group, points, 0.003, strand === 2 ? highlight : thread, 160);
  }
  for (let i = 0; i < 5; i++) {
    const knot = mesh(group, new THREE.TorusGeometry(0.028, 0.006, 8, 24), thread, 0, bailY + 0.058 + i * 0.008);
    knot.rotation.x = Math.PI / 2;
  }
  group.userData.hangAnchor = [0, topY - 0.04, 0];
  return thread;
}

function bail(group: THREE.Group, y: number, metal: THREE.Material) {
  mesh(group, new THREE.TorusGeometry(0.058, 0.015, 12, 36), metal, 0, y);
}

function tassel(group: THREE.Group, x: number, y: number, z: number, length: number, material: THREE.Material) {
  oval(group, brass(), [x, y, z], [0.036, 0.052, 0.036]);
  for (let i = 0; i < 22; i++) {
    const a = i * TAU / 22;
    tube(group, [
      new THREE.Vector3(x + Math.cos(a) * 0.018, y - 0.025, z + Math.sin(a) * 0.018),
      new THREE.Vector3(x + Math.cos(a) * 0.039, y - length * 0.55, z + Math.sin(a) * 0.039),
      new THREE.Vector3(x + Math.cos(a) * 0.06, y - length + (i % 3) * 0.008, z + Math.sin(a) * 0.06),
    ], 0.004, material, 20);
  }
}

/** Jade-colored island keepsake with a gilded coastline and a sculpted mountain spine. */
export function createTaiwanIslandCharm() {
  const group = new THREE.Group();
  group.name = 'Taiwan island hanging charm';
  const metal = brass();
  const jadeMap = texture((ctx, size) => {
    ctx.fillStyle = '#447f68'; ctx.fillRect(0, 0, size, size);
    for (let i = 0; i < 65; i++) {
      const x = (i * 83.17 % size), y = (i * 37.9 % size);
      ctx.strokeStyle = i % 3 ? 'rgba(184,226,182,.12)' : 'rgba(11,56,40,.16)';
      ctx.lineWidth = 1 + i % 4;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.bezierCurveTo(x - 80, y + 30, x + 90, y + 100, x + 40, y + 220); ctx.stroke();
    }
  });
  const jade = new THREE.MeshPhysicalMaterial({ map: jadeMap, color: '#d4efdb', roughness: 0.20, clearcoat: 0.85, clearcoatRoughness: 0.16 });
  const outline = new THREE.Shape();
  outline.moveTo(0, 1.77);
  outline.bezierCurveTo(.035, 1.79, .095, 1.79, .13, 1.75);
  outline.bezierCurveTo(.16, 1.73, .175, 1.685, .215, 1.667);
  outline.bezierCurveTo(.25, 1.652, .31, 1.646, .322, 1.616);
  outline.bezierCurveTo(.327, 1.593, .28, 1.568, .278, 1.54);
  outline.bezierCurveTo(.274, 1.50, .302, 1.484, .297, 1.43);
  outline.bezierCurveTo(.285, 1.28, .239, 1.119, .171, .978);
  outline.bezierCurveTo(.107, .843, .022, .70, -.06, .566);
  outline.bezierCurveTo(-.099, .502, -.139, .425, -.168, .382);
  outline.bezierCurveTo(-.18, .362, -.17, .328, -.192, .322);
  outline.bezierCurveTo(-.213, .32, -.211, .401, -.24, .443);
  outline.bezierCurveTo(-.27, .487, -.31, .489, -.346, .55);
  outline.bezierCurveTo(-.389, .624, -.426, .704, -.433, .803);
  outline.bezierCurveTo(-.441, .914, -.393, 1.035, -.36, 1.135);
  outline.bezierCurveTo(-.318, 1.259, -.259, 1.397, -.199, 1.493);
  outline.bezierCurveTo(-.156, 1.561, -.112, 1.593, -.068, 1.665);
  outline.bezierCurveTo(-.032, 1.714, -.035, 1.75, 0, 1.77);
  outline.closePath();
  const geometry = new THREE.ExtrudeGeometry(outline, { depth: 0.115, bevelEnabled: true, bevelSegments: 6, steps: 1, bevelSize: 0.016, bevelThickness: 0.021, curveSegments: 16 });
  geometry.translate(0, 0, -0.0575);
  mesh(group, geometry, jade);
  const coast = outline.getPoints(16).slice(0, -1).map(p => new THREE.Vector3(p.x, p.y, .08));
  const rim = new THREE.CatmullRomCurve3(coast, true, 'centripetal');
  mesh(group, new THREE.TubeGeometry(rim, 320, .009, 10, true), metal);
  const backRim = rim.clone();
  for (const p of backRim.points) p.z = -.08;
  mesh(group, new THREE.TubeGeometry(backRim, 320, .009, 10, true), metal);
  // A continuous carved relief fades into the jade, with connected ridges instead of separate spikes.
  const relief = new THREE.PlaneGeometry(.26, 1.18, 28, 100);
  const positions = relief.attributes.position;
  for (let i = 0; i < positions.count; i++) {
    const u = relief.attributes.uv.getX(i), t = relief.attributes.uv.getY(i);
    const ridgeX = -.175 + t * .28 + .018 * Math.sin(t * TAU * 1.8);
    const spread = .025 + .092 * Math.sin(t * Math.PI) ** .7;
    const cross = (u - .5) * 2;
    const peak = .036 + .048 * Math.exp(-(((t - .42) / .12) ** 2)) + .036 * Math.exp(-(((t - .7) / .09) ** 2));
    const fold = Math.max(0, 1 - Math.abs(cross)) ** 1.7 * (1 + .18 * Math.sin(t * 62 + Math.abs(cross) * 16));
    positions.setXYZ(i, ridgeX + cross * spread, .46 + t * 1.18, .079 + peak * fold * Math.sin(t * Math.PI) ** .45);
  }
  relief.computeVertexNormals();
  mesh(group, relief, new THREE.MeshPhysicalMaterial({ color: '#87b69a', roughness: .28, clearcoat: .65 }));
  for (const p of [[-.29, 1.13], [-.335, .81], [.09, 1.67]]) {
    mesh(group, new THREE.TorusGeometry(.012, .0035, 8, 20), metal, p[0], p[1], .085);
  }
  rod(group, new THREE.Vector3(0, 1.74, 0), new THREE.Vector3(0, 1.83, 0), 0.025, metal);
  bail(group, 1.86, metal);
  const thread = hangingLoop(group, 1.86, 2.18, '#9f293b');
  tube(group, [new THREE.Vector3(-0.20, 0.35, 0), new THREE.Vector3(-0.19, 0.26, 0), new THREE.Vector3(-0.15, 0.22, 0)], 0.009, thread);
  tassel(group, -0.15, 0.21, 0, 0.17, thread);
  return group;
}

/** Hexagonal botanical paper lantern in an open gilded cage, scaled as a hanging charm. */
export function createMiniLanternCharm() {
  const group = new THREE.Group();
  group.name = 'Botanical miniature lantern charm';
  const metal = brass();
  const paperMap = texture((ctx, size) => {
    ctx.fillStyle = '#f4c5ad'; ctx.fillRect(0, 0, size, size);
    ctx.strokeStyle = 'rgba(132,63,49,.15)'; ctx.lineWidth = 1;
    for (let i = 0; i < size; i += 4) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, size); ctx.stroke(); ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(size, i); ctx.stroke(); }
    ctx.strokeStyle = '#506647'; ctx.lineWidth = 8; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(240, 455); ctx.bezierCurveTo(150, 370, 315, 280, 230, 85); ctx.stroke();
    for (let i = 0; i < 7; i++) {
      const x = 225 + Math.sin(i * 1.8) * 43, y = 130 + i * 43;
      ctx.fillStyle = i % 2 ? '#718056' : '#536c49';
      ctx.beginPath(); ctx.ellipse(x + (i % 2 ? 39 : -39), y, 42, 13, i % 2 ? -.6 : .6, 0, TAU); ctx.fill();
    }
    for (const [x, y] of [[225, 100], [300, 290], [154, 351]]) {
      for (let p = 0; p < 5; p++) { const a = p * TAU / 5; ctx.fillStyle = '#f9edcf'; ctx.beginPath(); ctx.ellipse(x + Math.cos(a) * 15, y + Math.sin(a) * 15, 15, 10, a, 0, TAU); ctx.fill(); }
      ctx.fillStyle = '#b88045'; ctx.beginPath(); ctx.arc(x, y, 6, 0, TAU); ctx.fill();
    }
    ctx.strokeStyle = '#c38f58'; ctx.lineWidth = 5; ctx.strokeRect(23, 23, size - 46, size - 46);
  });
  const weave = texture((ctx, size) => {
    ctx.fillStyle = '#8b8b8b'; ctx.fillRect(0, 0, size, size);
    for (let i = 0; i < size; i += 4) {
      ctx.strokeStyle = i % 8 ? '#686868' : '#b9b9b9'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, size); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(size, i); ctx.stroke();
    }
  });
  const paper = new THREE.MeshStandardMaterial({ map: paperMap, bumpMap: weave, bumpScale: .008, color: '#fff3e7', roughness: 0.88, side: THREE.DoubleSide });
  const walnut = new THREE.MeshStandardMaterial({ color: '#704737', roughness: .43 });
  const roofMaterial = new THREE.MeshStandardMaterial({ color: '#976841', metalness: .64, roughness: .4, side: THREE.DoubleSide });
  const radius = 0.40, bottom = 0.70, top = 1.44;
  for (let i = 0; i < 6; i++) {
    const a = i * TAU / 6;
    const b = (i + 1) * TAU / 6;
    const pa = new THREE.Vector3(Math.sin(a) * radius, bottom, Math.cos(a) * radius);
    const pb = new THREE.Vector3(Math.sin(b) * radius, bottom, Math.cos(b) * radius);
    rod(group, pa, new THREE.Vector3(pa.x, top, pa.z), 0.021, walnut);
    for (const y of [bottom + .018, top - .018]) {
      mesh(group, new THREE.CylinderGeometry(.027, .027, .038, 16), metal, pa.x, y, pa.z);
      oval(group, metal, [pa.x, y, pa.z], [.03, .015, .03]);
    }
    for (const y of [bottom, bottom + 0.075, top - 0.075, top]) rod(group, new THREE.Vector3(pa.x, y, pa.z), new THREE.Vector3(pb.x, y, pb.z), 0.013, metal);
    const middle = a + Math.PI / 6;
    const panelGeometry = new THREE.PlaneGeometry(radius - .046, top - bottom - .18, 20, 24);
    const panelPositions = panelGeometry.attributes.position;
    for (let j = 0; j < panelPositions.count; j++) {
      const u = panelGeometry.attributes.uv.getX(j), v = panelGeometry.attributes.uv.getY(j);
      panelPositions.setZ(j, .017 * Math.sin(u * Math.PI) * Math.sin(v * Math.PI));
    }
    panelGeometry.computeVertexNormals();
    const panel = mesh(group, panelGeometry, paper, Math.sin(middle) * (radius * Math.cos(Math.PI / 6) - .008), (bottom + top) / 2, Math.cos(middle) * (radius * Math.cos(Math.PI / 6) - .008));
    panel.rotation.y = middle;
    // Open fretwork above and below each inset paper panel.
    for (const y of [bottom + 0.035, top - 0.035]) {
      const center = new THREE.Vector3(Math.sin(middle) * radius * Math.cos(Math.PI / 6), y, Math.cos(middle) * radius * Math.cos(Math.PI / 6));
      const diamond = mesh(group, new THREE.TorusGeometry(0.028, 0.005, 6, 4), metal, center.x, center.y, center.z);
      diamond.rotation.y = middle; diamond.rotation.z = Math.PI / 4;
    }
  }
  // Six gently swept roof sectors meet directly over the six corner posts.
  const roofPoint = (side: number, u: number, t: number) => {
    const a = side * TAU / 6, b = (side + 1) * TAU / 6;
    const r = .055 + .405 * t;
    return new THREE.Vector3(
      (Math.sin(a) * (1 - u) + Math.sin(b) * u) * r,
      1.73 - .35 * t + .06 * t ** 4 + .02 * (2 * u - 1) ** 2 * t ** 4,
      (Math.cos(a) * (1 - u) + Math.cos(b) * u) * r,
    );
  };
  for (let side = 0; side < 6; side++) {
    const positions: number[] = [], uvs: number[] = [], indices: number[] = [];
    for (let j = 0; j <= 18; j++) for (let i = 0; i <= 12; i++) {
      const p = roofPoint(side, i / 12, j / 18);
      positions.push(p.x, p.y, p.z); uvs.push(i / 12, j / 18);
    }
    for (let j = 0; j < 18; j++) for (let i = 0; i < 12; i++) {
      const a = j * 13 + i;
      indices.push(a, a + 13, a + 1, a + 1, a + 13, a + 14);
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geometry.setIndex(indices); geometry.computeVertexNormals();
    mesh(group, geometry, roofMaterial);
    tube(group, Array.from({ length: 25 }, (_, i) => roofPoint(side, i / 24, 1)), .018, metal, 48);
    tube(group, Array.from({ length: 25 }, (_, i) => roofPoint(side, 0, i / 24).add(new THREE.Vector3(0, .006, 0))), .007, metal, 48);
    tube(group, Array.from({ length: 25 }, (_, i) => roofPoint(side, i / 24, .85)), .005, metal, 36);
  }
  for (let i = 0; i < 6; i++) {
    const a = i * TAU / 6;
    rod(group, new THREE.Vector3(Math.sin(a) * radius, bottom, Math.cos(a) * radius), new THREE.Vector3(0, bottom, 0), 0.009, metal);
    const roofTip = roofPoint(i, 0, 1);
    oval(group, metal, [roofTip.x, roofTip.y, roofTip.z], [.025, .019, .025]);
  }
  oval(group, metal, [0, 1.74, 0], [.06, .044, .06]);
  bail(group, 1.82, metal);
  const thread = hangingLoop(group, 1.82, 2.14, '#a63237');
  tube(group, [new THREE.Vector3(0, bottom, 0), new THREE.Vector3(0, .57, 0), new THREE.Vector3(0, .50, 0)], 0.012, thread);
  oval(group, new THREE.MeshPhysicalMaterial({ color: '#527d68', roughness: .24, clearcoat: .6 }), [0, .49, 0], [.065, .072, .065]);
  tube(group, [new THREE.Vector3(0, .43, 0), new THREE.Vector3(0, .38, 0)], .012, thread, 12);
  tassel(group, 0, .38, 0, .33, thread);
  return group;
}

/** A sewn cotton bear collectible with a pear-shaped torso and embroidered chest patch. */
export function createTaiwanBlackBearCharm() {
  const group = new THREE.Group();
  group.name = 'Taiwan black bear hanging charm';
  const cotton = texture((ctx, size) => {
    ctx.fillStyle = '#303333'; ctx.fillRect(0, 0, size, size);
    for (let i = 0; i < 17000; i++) {
      const x = i * 53.41 % size, y = i * 79.71 % size;
      ctx.strokeStyle = i % 2 ? 'rgba(192,181,160,.11)' : 'rgba(0,0,0,.20)';
      ctx.lineWidth = .7;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.sin(i) * 2, y + 2.5); ctx.stroke();
    }
  });
  const cottonRelief = texture((ctx, size) => {
    ctx.fillStyle = '#969696'; ctx.fillRect(0, 0, size, size);
    for (let y = 0; y < size; y += 4) for (let x = 0; x < size; x += 4) {
      ctx.strokeStyle = (x + y) % 8 ? '#c1c1c1' : '#737373'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(x, y + 1); ctx.quadraticCurveTo(x + 2, y - 1, x + 3, y + 2); ctx.stroke();
    }
  });
  const fur = new THREE.MeshStandardMaterial({ map: cotton, bumpMap: cottonRelief, bumpScale: .008, roughness: .94 });
  const cream = new THREE.MeshStandardMaterial({ color: '#ddd6c1', bumpMap: cottonRelief, bumpScale: .004, roughness: .98 });
  const pad = new THREE.MeshStandardMaterial({ color: '#4c4741', bumpMap: cottonRelief, bumpScale: .005, roughness: .92 });
  const eye = new THREE.MeshPhysicalMaterial({ color: '#0d1010', roughness: .08, clearcoat: 1, clearcoatRoughness: .08 });
  const thread = new THREE.MeshStandardMaterial({ color: '#afa898', roughness: .99 });
  const torso = new THREE.SphereGeometry(1, 64, 48);
  const torsoPositions = torso.attributes.position;
  for (let i = 0; i < torsoPositions.count; i++) {
    const x = torsoPositions.getX(i), y = torsoPositions.getY(i), z = torsoPositions.getZ(i);
    const pear = .94 - .22 * y + .065 * Math.sin((y + 1) * Math.PI);
    torsoPositions.setXYZ(i, x * .365 * pear, .72 + y * .51, z * .265 * (1 - .08 * y));
  }
  torso.computeVertexNormals();
  mesh(group, torso, fur);
  const head = new THREE.SphereGeometry(1, 64, 40);
  const headPositions = head.attributes.position;
  for (let i = 0; i < headPositions.count; i++) {
    const x = headPositions.getX(i), y = headPositions.getY(i), z = headPositions.getZ(i);
    headPositions.setXYZ(i, x * .325 * (1 - .12 * y), 1.25 + y * .29, z * .245 * (1 - .08 * y) + .018);
  }
  head.computeVertexNormals();
  mesh(group, head, fur);
  for (const side of [-1, 1]) {
    oval(group, fur, [side * .246, 1.477, .005], [.107, .112, .07]);
    // Dark inset ear fabric sits inside a thick, rounded sewn lip.
    oval(group, pad, [side * .247, 1.48, .062], [.064, .069, .013]);
    const armGeometry = new THREE.SphereGeometry(1, 40, 32);
    const armPositions = armGeometry.attributes.position;
    for (let i = 0; i < armPositions.count; i++) {
      const x = armPositions.getX(i), y = armPositions.getY(i), z = armPositions.getZ(i);
      const taper = 1 - .16 * y;
      armPositions.setXYZ(i, x * .137 * taper + side * .055 * (1 - y * y), y * .30, z * .155 * taper + .025 * (1 - y));
    }
    armGeometry.computeVertexNormals();
    const arm = mesh(group, armGeometry, fur, side * .305, .77, .025);
    arm.rotation.z = side * .16;
    oval(group, pad, [side * .36, .565, .167], [.057, .072, .012]);
    const footGeometry = new THREE.SphereGeometry(1, 40, 32);
    const footPositions = footGeometry.attributes.position;
    for (let i = 0; i < footPositions.count; i++) {
      const x = footPositions.getX(i), y = footPositions.getY(i), z = footPositions.getZ(i);
      footPositions.setXYZ(i, x * .163 * (1 - .13 * y), y * .19, z * .205 + .035 * (1 - y * y));
    }
    footGeometry.computeVertexNormals();
    mesh(group, footGeometry, fur, side * .18, .24, .085);
    oval(group, pad, [side * .18, .20, .312], [.083, .088, .012]);
    for (let toe = 0; toe < 3; toe++) {
      oval(group, pad, [side * .18 + (toe - 1) * .048, .302, .297], [.018, .022, .009]);
      tube(group, [new THREE.Vector3(side * .18 + (toe - 1) * .045, .356, .273), new THREE.Vector3(side * .18 + (toe - 1) * .045, .327, .289)], .002, thread, 10);
    }
    oval(group, fur, [side * .116, 1.29, .235], [.045, .051, .018]);
    oval(group, eye, [side * .117, 1.295, .251], [.027, .031, .016]);
  }
  const muzzle = new THREE.SphereGeometry(1, 48, 32);
  const muzzlePositions = muzzle.attributes.position;
  for (let i = 0; i < muzzlePositions.count; i++) {
    const x = muzzlePositions.getX(i), y = muzzlePositions.getY(i), z = muzzlePositions.getZ(i);
    muzzlePositions.setXYZ(i, x * .143 * (1 - .10 * y), 1.17 + y * .092, .248 + z * .075 + .012 * (1 - y * y));
  }
  muzzle.computeVertexNormals();
  mesh(group, muzzle, pad);
  oval(group, eye, [0, 1.209, .327], [.056, .032, .022]);
  const mouth = new THREE.MeshStandardMaterial({ color: '#191e1c', roughness: .94 });
  tube(group, [new THREE.Vector3(0, 1.19, .331), new THREE.Vector3(0, 1.152, .337), new THREE.Vector3(-.043, 1.138, .326)], .004, mouth, 20);
  tube(group, [new THREE.Vector3(0, 1.152, .337), new THREE.Vector3(.021, 1.138, .333), new THREE.Vector3(.043, 1.138, .326)], .004, mouth, 20);
  const chestSurface = (x: number, y: number) => {
    const localY = (y - .72) / .51;
    const width = .365 * (.94 - .22 * localY + .065 * Math.sin((localY + 1) * Math.PI));
    return .265 * (1 - .08 * localY) * Math.sqrt(Math.max(0, 1 - localY * localY - (x / width) ** 2));
  };
  const marking = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-.205, 1.0, 0), new THREE.Vector3(-.13, .923, 0),
    new THREE.Vector3(0, .845, 0), new THREE.Vector3(.13, .923, 0), new THREE.Vector3(.205, 1.0, 0),
  ]);
  const markingPositions: number[] = [], markingUVs: number[] = [], markingIndices: number[] = [];
  for (let i = 0; i <= 64; i++) {
    const t = i / 64, p = marking.getPoint(t), tangent = marking.getTangent(t);
    const across = new THREE.Vector3(-tangent.y, tangent.x, 0).normalize();
    for (const side of [-1, 1]) {
      const q = p.clone().addScaledVector(across, side * .025);
      markingPositions.push(q.x, q.y, chestSurface(q.x, q.y) + .009);
      markingUVs.push(side === -1 ? 0 : 1, t);
    }
    if (i < 64) { const a = i * 2; markingIndices.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); }
    if (i % 2 === 0) {
      for (const side of [-1, 1]) {
        const edge = p.clone().addScaledVector(across, side * .023);
        const outside = p.clone().addScaledVector(across, side * .032);
        edge.z = chestSurface(edge.x, edge.y) + .014;
        outside.z = chestSurface(outside.x, outside.y) + .007;
        rod(group, edge, outside, .0019, thread);
      }
    }
  }
  const markingGeometry = new THREE.BufferGeometry();
  markingGeometry.setAttribute('position', new THREE.Float32BufferAttribute(markingPositions, 3));
  markingGeometry.setAttribute('uv', new THREE.Float32BufferAttribute(markingUVs, 2));
  markingGeometry.setIndex(markingIndices); markingGeometry.computeVertexNormals();
  mesh(group, markingGeometry, cream);
  const seam = new THREE.MeshStandardMaterial({ color: '#5c5b50', roughness: .98 });
  for (let i = 0; i < 23; i++) {
    const y = .43 + i * .028;
    const z = -chestSurface(0, y) - .002;
    rod(group, new THREE.Vector3(-.007, y, z), new THREE.Vector3(.007, y + .004, z), .0018, seam);
  }
  const metal = brass();
  // A folded sewn tab enters the head; its metal eye is captured by the brass bail.
  const tab = mesh(group, new THREE.BoxGeometry(.043, .09, .025), fur, 0, 1.56, 0);
  tab.rotation.x = -.08;
  bail(group, 1.625, metal);
  hangingLoop(group, 1.625, 1.945, '#537967');
  return group;
}
