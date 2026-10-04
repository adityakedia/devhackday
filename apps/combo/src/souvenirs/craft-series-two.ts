import * as THREE from 'three';

const TAU = Math.PI * 2;
const v = (x: number, y: number, z = 0) => new THREE.Vector3(x, y, z);
const signedPower = (n: number, power: number) => Math.sign(n) * Math.pow(Math.abs(n), power);

function material(color: string, roughness = 0.5, metalness = 0) {
  return new THREE.MeshStandardMaterial({ color, roughness, metalness });
}

function mesh(group: THREE.Group, geometry: THREE.BufferGeometry, surface: THREE.Material, position = v(0, 0)) {
  const item = new THREE.Mesh(geometry, surface);
  item.position.copy(position);
  item.castShadow = item.receiveShadow = true;
  group.add(item);
  return item;
}

function tube(group: THREE.Group, points: THREE.Vector3[], radius: number, surface: THREE.Material, closed = false) {
  return mesh(group, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points, closed), Math.max(24, points.length * 3), radius, 8, closed), surface);
}

function texture(draw: (ctx: CanvasRenderingContext2D, size: number) => void) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 1024;
  draw(canvas.getContext('2d')!, canvas.width);
  const map = new THREE.CanvasTexture(canvas);
  map.colorSpace = THREE.SRGBColorSpace;
  map.wrapS = map.wrapT = THREE.RepeatWrapping;
  map.anisotropy = 8;
  return map;
}

function finish(group: THREE.Group) {
  const bounds = new THREE.Box3().setFromObject(group);
  const center = bounds.getCenter(new THREE.Vector3());
  for (const child of group.children) child.position.sub(v(center.x, bounds.min.y, center.z));
  return group;
}

function speckles(ctx: CanvasRenderingContext2D, count: number, color: string) {
  ctx.fillStyle = color;
  for (let i = 0; i < count; i++) {
    const x = ((i * 0.61803398875) % 1) * 1024;
    const y = ((i * 0.41421356237) % 1) * 1024;
    ctx.beginPath(); ctx.arc(x, y, 0.4 + (i % 5) * 0.3, 0, TAU); ctx.fill();
  }
}

/** Original pale-green bi-inspired decorative study with a true open central aperture. */
export function createJadePendant(): THREE.Group {
  const group = new THREE.Group(); group.name = 'Jade circle pendant';
  const jadeMap = texture((ctx, size) => {
    ctx.fillStyle = '#bed1ad'; ctx.fillRect(0, 0, size, size);
    for (let i = 0; i < 65; i++) {
      const x = ((i * 0.61803) % 1) * size, y = ((i * 0.3791) % 1) * size;
      const glow = ctx.createRadialGradient(x, y, 0, x, y, 80 + (i % 4) * 30);
      glow.addColorStop(0, i % 3 === 0 ? 'rgba(69,111,77,0.24)' : 'rgba(245,250,216,0.35)');
      glow.addColorStop(1, 'rgba(170,202,159,0)');
      ctx.fillStyle = glow; ctx.fillRect(0, 0, size, size);
    }
    speckles(ctx, 3500, 'rgba(49,92,64,0.05)');
  });
  const jade = new THREE.MeshPhysicalMaterial({ map: jadeMap, roughness: 0.19, transmission: 0.28, thickness: 0.22, ior: 1.54, clearcoat: 0.7, clearcoatRoughness: 0.12 });
  const shape = new THREE.Shape(); shape.absarc(0, 0, 0.55, 0, TAU, false);
  const hole = new THREE.Path(); hole.absarc(0, 0, 0.205, 0, TAU, true); shape.holes.push(hole);
  const body = new THREE.ExtrudeGeometry(shape, { depth: 0.085, bevelEnabled: true, bevelThickness: 0.038, bevelSize: 0.036, bevelSegments: 5, curveSegments: 96 });
  body.translate(0, 0.59, -0.0425); mesh(group, body, jade);
  // Shallow polished concentric reliefs retain the open centre on both faces.
  for (const z of [-0.084, 0.084]) {
    const relief = mesh(group, new THREE.TorusGeometry(0.43, 0.005, 6, 96), jade, v(0, 0.59, z));
    relief.scale.z = 0.6;
    mesh(group, new THREE.TorusGeometry(0.278, 0.005, 6, 96), jade, v(0, 0.59, z));
  }
  const red = material('#85242d', 0.85);
  tube(group, [v(-0.035, 0.79, 0.11), v(-0.055, 1.06, 0.12), v(-0.04, 1.2, 0), v(-0.025, 1.02, -0.12), v(-0.035, 0.79, -0.11)], 0.014, red);
  tube(group, [v(0.035, 0.79, -0.11), v(0.055, 1.06, -0.12), v(0.04, 1.2, 0), v(0.025, 1.02, 0.12), v(0.035, 0.79, 0.11)], 0.014, red);
  for (const side of [-1, 1]) {
    tube(group, [v(side * 0.025, 1.19), v(side * 0.11, 1.37), v(side * 0.24, 1.73), v(side * 0.14, 1.91), v(0, 1.95)], 0.014, red);
    tube(group, [v(0, 1.25, 0.015), v(side * 0.085, 1.3, 0.025), v(side * 0.067, 1.39, 0), v(0, 1.34, -0.025)], 0.013, red);
  }
  mesh(group, new THREE.SphereGeometry(0.062, 24, 16), jade, v(0, 1.45)).scale.y = 1.15;
  for (const y of [1.385, 1.515]) mesh(group, new THREE.SphereGeometry(0.018, 12, 8), material('#bb964d', 0.28, 0.7), v(0, y));
  return finish(group);
}

/** Celadon instrument study: beveled ceramic shell with six open finger bores. */
export function createOcarina(): THREE.Group {
  const group = new THREE.Group(); group.name = 'Yingge celadon ocarina';
  const glazeMap = texture((ctx, size) => {
    ctx.fillStyle = '#8bb8ac'; ctx.fillRect(0, 0, size, size);
    speckles(ctx, 15000, 'rgba(49,91,82,0.16)');
    speckles(ctx, 6000, 'rgba(235,249,225,0.18)');
    ctx.strokeStyle = 'rgba(42,86,71,0.10)'; ctx.lineWidth = 1;
    for (let i = 0; i < 100; i++) { const x = (i * 73) % size; ctx.beginPath(); ctx.moveTo(x, 0); ctx.bezierCurveTo(x + 30, 250, x - 25, 650, x + 10, size); ctx.stroke(); }
  });
  const glaze = new THREE.MeshPhysicalMaterial({ map: glazeMap, roughness: 0.22, clearcoat: 0.9, clearcoatRoughness: 0.13 });
  const shape = new THREE.Shape();
  shape.moveTo(-0.03, 0.07);
  shape.bezierCurveTo(-0.69, 0.02, -0.94, 0.43, -0.78, 0.9);
  shape.bezierCurveTo(-0.67, 1.27, -0.25, 1.58, 0.03, 1.7);
  shape.bezierCurveTo(0.31, 1.5, 0.65, 1.22, 0.7, 0.84);
  shape.bezierCurveTo(0.77, 0.4, 0.54, 0.06, -0.03, 0.07);
  for (const [x, y, radius] of [[-0.38, 0.63, 0.083], [-0.14, 0.56, 0.09], [0.14, 0.57, 0.089], [0.36, 0.71, 0.078], [-0.23, 0.89, 0.075], [0.1, 0.95, 0.072]]) {
    const hole = new THREE.Path(); hole.absarc(x, y, radius, 0, TAU, true); shape.holes.push(hole);
  }
  const geometry = new THREE.ExtrudeGeometry(shape, { depth: 0.3, bevelEnabled: true, bevelSize: 0.035, bevelThickness: 0.085, bevelSegments: 6, curveSegments: 64, steps: 3 });
  geometry.translate(0, 0, -0.15);
  const pos = geometry.attributes.position;
  // Inflate the broad ceramic faces while keeping each bore physically open.
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
    const bulge = 0.095 * Math.exp(-2.5 * (x * x + (y - 0.78) ** 2));
    pos.setZ(i, z + Math.sign(z) * bulge * Math.min(1, Math.abs(z) / 0.15));
  }
  geometry.computeVertexNormals(); mesh(group, geometry, glaze);
  // Open ceramic mouthpiece, with an inner bore continuing towards the body.
  const mouth = new THREE.Group(); mouth.position.set(0.58, 0.43, 0); mouth.rotation.z = -1.03; group.add(mouth);
  const wallProfile = [new THREE.Vector2(0.125, 0), new THREE.Vector2(0.11, 0.28), new THREE.Vector2(0.093, 0.42), new THREE.Vector2(0.06, 0.42), new THREE.Vector2(0.07, 0.28), new THREE.Vector2(0.085, 0)];
  mesh(mouth, new THREE.LatheGeometry(wallProfile, 48), glaze);
  const lip = mesh(mouth, new THREE.TorusGeometry(0.077, 0.016, 10, 48), glaze, v(0, 0.42)); lip.rotation.x = Math.PI / 2;
  return finish(group);
}

/** Open bamboo folding fan with a continuous landscape across physically folded paper. */
export function createBambooFan(): THREE.Group {
  const group = new THREE.Group(); group.name = 'Mountain landscape folding fan';
  const map = texture((ctx, size) => {
    ctx.fillStyle = '#eaddc3'; ctx.fillRect(0, 0, size, size); speckles(ctx, 18000, 'rgba(118,97,62,0.07)');
    for (let layer = 0; layer < 4; layer++) {
      ctx.fillStyle = ['#bec8b7', '#a3b8a6', '#789887', '#567567'][layer]; ctx.beginPath(); ctx.moveTo(0, size);
      for (let x = 0; x <= size; x += 8) {
        const y = 380 + layer * 95 + Math.sin(x * 0.007 + layer * 1.5) * 105 + Math.sin(x * 0.019 + layer) * 27;
        ctx.lineTo(x, y);
      }
      ctx.lineTo(size, size); ctx.closePath(); ctx.fill();
    }
    ctx.fillStyle = '#c57558'; ctx.beginPath(); ctx.arc(790, 305, 43, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#eaddc3'; ctx.lineWidth = 3;
    for (let i = 0; i < 7; i++) { ctx.beginPath(); ctx.moveTo(610 + i * 13, 710 + i * 16); ctx.quadraticCurveTo(560 + i * 16, 785 + i * 18, 600 + i * 10, 870 + i * 15); ctx.stroke(); }
    ctx.fillStyle = '#4d6559'; ctx.font = '42px "Kaiti TC", "STKaiti", serif'; ctx.fillText('山風', 80, 270);
  });
  const paper = new THREE.MeshStandardMaterial({ map, roughness: 0.87, side: THREE.DoubleSide });
  const bamboo = material('#ad8655', 0.55);
  const a0 = Math.PI * 0.09, span = Math.PI * 0.82, ribs = 18;
  const sample = (r: number, t: number) => {
    const a = a0 + t * span;
    const fold = Math.abs(((t * ribs) % 1) * 2 - 1) * 2 - 1;
    return v(Math.cos(a) * r, 0.08 + Math.sin(a) * r, fold * 0.035 * (r / 0.98));
  };
  const positions: number[] = [], uvs: number[] = [], indices: number[] = [];
  const cols = ribs * 4, rows = 12;
  for (let j = 0; j <= rows; j++) for (let i = 0; i <= cols; i++) {
    const p = sample(0.39 + j / rows * 0.59, i / cols); positions.push(p.x, p.y, p.z); uvs.push((p.x + 1) / 2, p.y / 1.08);
  }
  for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
    const a = j * (cols + 1) + i; indices.push(a, a + 1, a + cols + 1, a + 1, a + cols + 2, a + cols + 1);
  }
  const geometry = new THREE.BufferGeometry(); geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3)); geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2)); geometry.setIndex(indices); geometry.computeVertexNormals();
  mesh(group, geometry, paper);
  for (let i = 0; i <= ribs; i++) {
    const t = i / ribs, a = a0 + t * span;
    const rib = mesh(group, new THREE.BoxGeometry(i === 0 || i === ribs ? 0.035 : 0.018, 0.98, 0.015), bamboo, v(Math.cos(a) * 0.49, 0.08 + Math.sin(a) * 0.49, -0.048));
    rib.rotation.z = a - Math.PI / 2;
  }
  const brass = material('#c9a763', 0.28, 0.7);
  const pivot = mesh(group, new THREE.CylinderGeometry(0.043, 0.043, 0.13, 32), brass, v(0, 0.08)); pivot.rotation.x = Math.PI / 2;
  mesh(group, new THREE.SphereGeometry(0.031, 16, 10), brass, v(0, 0.08, 0.072)).scale.z = 0.35;
  return finish(group);
}

/** Original flower-cloth purse, with a rounded sewn shell, zipper teeth and open metal pull. */
export function createFloralPurse(): THREE.Group {
  const group = new THREE.Group(); group.name = 'Taiwan flower-cloth zipper purse';
  const floral = texture((ctx, size) => {
    ctx.fillStyle = '#134d65'; ctx.fillRect(0, 0, size, size);
    for (let row = -1; row < 5; row++) for (let col = -1; col < 5; col++) {
      const x = col * 270 + (row % 2) * 110 + 80, y = row * 260 + 90;
      for (let i = 0; i < 5; i++) {
        const a = i * TAU / 5 + 0.4;
        ctx.fillStyle = i % 2 ? '#82a76f' : '#43765d'; ctx.beginPath(); ctx.ellipse(x + Math.cos(a) * 90, y + Math.sin(a) * 80, 55, 20, a, 0, TAU); ctx.fill();
        ctx.strokeStyle = '#b4bc82'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x + Math.cos(a) * 53, y + Math.sin(a) * 53); ctx.lineTo(x + Math.cos(a) * 128, y + Math.sin(a) * 108); ctx.stroke();
      }
      for (let layer = 0; layer < 4; layer++) for (let petal = 0; petal < 9; petal++) {
        const a = petal * TAU / 9 + layer * 0.35, radius = 46 - layer * 10;
        ctx.fillStyle = ['#b73569', '#db5b88', '#ef91ac', '#f7c2c6'][layer];
        ctx.beginPath(); ctx.ellipse(x + Math.cos(a) * radius, y + Math.sin(a) * radius, 30 - layer * 4, 19 - layer * 3, a + 0.4, 0, TAU); ctx.fill();
      }
      ctx.fillStyle = '#e6c06f'; ctx.beginPath(); ctx.arc(x, y, 8, 0, TAU); ctx.fill();
    }
    ctx.strokeStyle = 'rgba(247,236,205,0.09)'; ctx.lineWidth = 1;
    for (let i = 0; i < size; i += 4) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, size); ctx.moveTo(0, i); ctx.lineTo(size, i); ctx.stroke(); }
  });
  const cloth = new THREE.MeshStandardMaterial({ map: floral, roughness: 0.92 });
  const geometry = new THREE.SphereGeometry(1, 96, 48), p = geometry.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    // A lightly flattened upper seam keeps the zipper seated along the inflated body.
    const upper = y > 0 ? Math.min(0.92, signedPower(y, 0.24) * 1.03) : signedPower(y, 0.6);
    p.setXYZ(i, 0.79 * signedPower(x, 0.48), 0.49 + 0.46 * upper, 0.235 * signedPower(z, 0.65));
  }
  geometry.computeVertexNormals(); mesh(group, geometry, cloth);
  const piping = material('#143b48', 0.92), thread = material('#d4c4a0', 0.93);
  const outline = (a: number, z: number) => {
    const y = Math.sin(a);
    const contour = y > 0 ? Math.min(0.92, signedPower(y, 0.24) * 1.03) : signedPower(y, 0.6);
    return v(0.775 * signedPower(Math.cos(a), 0.48), 0.49 + 0.445 * contour, z);
  };
  for (const side of [-1, 1]) tube(group, Array.from({ length: 129 }, (_, i) => outline(i / 128 * TAU, side * 0.105)), 0.009, piping, true);
  const stitchGeometry = new THREE.CylinderGeometry(0.003, 0.003, 1, 5);
  const stitches = new THREE.InstancedMesh(stitchGeometry, thread, 240);
  const matrix = new THREE.Matrix4(), rotation = new THREE.Quaternion();
  for (let i = 0; i < 240; i++) {
    const a = (i % 120) / 120 * TAU, z = i < 120 ? 0.112 : -0.112;
    const from = outline(a, z), to = outline(a + 0.026, z), direction = to.clone().sub(from);
    rotation.setFromUnitVectors(v(0, 1), direction.clone().normalize());
    matrix.compose(from.add(to).multiplyScalar(0.5), rotation, v(1, direction.length(), 1)); stitches.setMatrixAt(i, matrix);
  }
  stitches.castShadow = true; group.add(stitches);
  mesh(group, new THREE.BoxGeometry(1.33, 0.016, 0.07), piping, v(0, 0.918));
  const metal = material('#c7ac70', 0.29, 0.8);
  const teeth = new THREE.InstancedMesh(new THREE.BoxGeometry(0.017, 0.019, 0.024), metal, 112);
  for (let i = 0; i < 112; i++) { matrix.makeTranslation(-0.64 + (i % 56) * 0.023, 0.931, i < 56 ? -0.015 : 0.015); teeth.setMatrixAt(i, matrix); }
  teeth.castShadow = true; group.add(teeth);
  mesh(group, new THREE.BoxGeometry(0.086, 0.043, 0.07), metal, v(0.49, 0.944));
  const pull = new THREE.Shape(); pull.absellipse(0, 0, 0.044, 0.095, 0, TAU, false, 0);
  const pullHole = new THREE.Path(); pullHole.absellipse(0, 0.008, 0.023, 0.05, 0, TAU, true, 0); pull.holes.push(pullHole);
  const pullMesh = mesh(group, new THREE.ExtrudeGeometry(pull, { depth: 0.013, bevelEnabled: true, bevelSegments: 2, bevelSize: 0.004, bevelThickness: 0.004, curveSegments: 24 }), metal, v(0.52, 0.85, 0.075)); pullMesh.rotation.z = -0.35;
  return finish(group);
}
