import * as THREE from 'three';

const TAU = Math.PI * 2;
const gold = () => new THREE.MeshStandardMaterial({ color: '#cda554', metalness: 0.58, roughness: 0.36 });
const wood = () => new THREE.MeshStandardMaterial({ color: '#906039', roughness: 0.68 });

function texture(draw: (ctx: CanvasRenderingContext2D, size: number) => void, size = 1024) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  draw(ctx, size);
  const map = new THREE.CanvasTexture(canvas);
  map.colorSpace = THREE.SRGBColorSpace;
  map.anisotropy = 8;
  return map;
}

function grain(ctx: CanvasRenderingContext2D, size: number, color: string, density = 12000) {
  ctx.fillStyle = color;
  // Deterministic fibres keep each handmade material consistent between visits.
  for (let i = 0; i < density; i++) {
    const x = ((i * 73.37) % 1) * size;
    const y = ((i * 31.713) % 1) * size;
    ctx.fillRect(x, y, 0.7 + (i % 3), 1 + (i % 5));
  }
}

function mesh(group: THREE.Group, geometry: THREE.BufferGeometry, material: THREE.Material, x = 0, y = 0, z = 0) {
  const item = new THREE.Mesh(geometry, material);
  item.position.set(x, y, z);
  item.castShadow = true;
  item.receiveShadow = true;
  group.add(item);
  return item;
}

function cord(group: THREE.Group, points: THREE.Vector3[], radius: number, material: THREE.Material) {
  return mesh(group, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), 48, radius, 6, false), material);
}

function rod(group: THREE.Group, from: THREE.Vector3, to: THREE.Vector3, radius: number, material: THREE.Material) {
  const item = mesh(group, new THREE.CylinderGeometry(radius, radius, from.distanceTo(to), 8), material);
  item.position.copy(from).add(to).multiplyScalar(0.5);
  item.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), to.clone().sub(from).normalize());
  return item;
}

function ring(group: THREE.Group, radius: number, tube: number, y: number, material: THREE.Material) {
  const item = mesh(group, new THREE.TorusGeometry(radius, tube, 8, 80), material, 0, y);
  item.rotation.x = Math.PI / 2;
  return item;
}

function tassel(group: THREE.Group, top: THREE.Vector3, length: number, material: THREE.Material) {
  mesh(group, new THREE.SphereGeometry(0.055, 16, 12), gold(), top.x, top.y, top.z).scale.y = 1.25;
  for (let i = 0; i < 30; i++) {
    const a = i * TAU / 30;
    const r = 0.023 + (i % 3) * 0.011;
    cord(group, [
      top.clone().add(new THREE.Vector3(Math.cos(a) * r * 0.4, -0.04, Math.sin(a) * r * 0.4)),
      top.clone().add(new THREE.Vector3(Math.cos(a) * r, -length * 0.55, Math.sin(a) * r)),
      top.clone().add(new THREE.Vector3(Math.cos(a) * r * 1.45, -length + (i % 4) * 0.006, Math.sin(a) * r * 1.45)),
    ], 0.004, material);
  }
}

/** Ribbed cloth lantern inspired by the lantern-lined lanes of Jiufen. */
export function createRedLantern() {
  const group = new THREE.Group();
  group.name = 'Jiufen red lantern';
  const fabricMap = texture((ctx, size) => {
    ctx.fillStyle = '#b91d23'; ctx.fillRect(0, 0, size, size);
    grain(ctx, size, 'rgba(255,205,149,0.13)');
    ctx.strokeStyle = 'rgba(82,7,14,0.1)'; ctx.lineWidth = 1;
    for (let y = 0; y < size; y += 4) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(size, y); ctx.stroke(); }
    ctx.strokeStyle = '#dbaa58'; ctx.lineWidth = 4;
    for (const y of [70, 92, size - 92, size - 70]) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(size, y); ctx.stroke(); }
  });
  const fabric = new THREE.MeshStandardMaterial({ map: fabricMap, color: '#ffffff', roughness: 0.79, side: THREE.DoubleSide });
  const seam = new THREE.MeshStandardMaterial({ color: '#8d101b', roughness: 0.82 });
  const brass = gold();
  const points: THREE.Vector2[] = [];
  for (let i = 0; i <= 48; i++) {
    const t = i / 48;
    points.push(new THREE.Vector2(0.16 + 0.51 * Math.pow(Math.sin(t * Math.PI), 0.72), 0.59 + t * 1.02));
  }
  const body = new THREE.LatheGeometry(points, 96);
  const pos = body.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const a = Math.atan2(pos.getZ(i), pos.getX(i));
    const ripple = 1 + 0.008 * Math.cos(a * 24);
    pos.setXYZ(i, pos.getX(i) * ripple, pos.getY(i), pos.getZ(i) * ripple);
  }
  body.computeVertexNormals();
  mesh(group, body, fabric);
  for (let j = 0; j < 24; j++) {
    const a = j * TAU / 24;
    cord(group, points.map(p => new THREE.Vector3(Math.cos(a) * (p.x + 0.005), p.y, Math.sin(a) * (p.x + 0.005))), 0.006, seam);
  }
  for (const y of [0.59, 1.61]) {
    mesh(group, new THREE.CylinderGeometry(0.175, 0.175, 0.065, 48, 1, true), brass, 0, y);
    ring(group, 0.176, 0.01, y - 0.026, brass);
    ring(group, 0.176, 0.01, y + 0.026, brass);
  }
  const thread = new THREE.MeshStandardMaterial({ color: '#a21b27', roughness: 0.9 });
  cord(group, [new THREE.Vector3(-0.075, 1.65, 0), new THREE.Vector3(-0.08, 1.84, 0), new THREE.Vector3(0, 1.9, 0), new THREE.Vector3(0.08, 1.84, 0), new THREE.Vector3(0.075, 1.65, 0)], 0.016, thread);
  rod(group, new THREE.Vector3(0, 0.59, 0), new THREE.Vector3(0, 0.47, 0), 0.017, thread);
  tassel(group, new THREE.Vector3(0, 0.47, 0), 0.43, thread);
  return group;
}

/** Four sewn paper panels with a real open bamboo mouth and wish calligraphy. */
export function createSkyLantern() {
  const group = new THREE.Group();
  group.name = 'Pingxi wish lantern';
  const bamboo = wood();
  const wishes = ['平安', '幸福', '平安', '幸福'];
  const colors = ['#f0b895', '#f3c6a2', '#e8aa89', '#f2c6aa'];
  const seamMaterial = new THREE.MeshStandardMaterial({ color: '#e8bd99', roughness: 0.95 });
  for (let side = 0; side < 4; side++) {
    const map = texture((ctx, size) => {
      ctx.fillStyle = colors[side]; ctx.fillRect(0, 0, size, size);
      grain(ctx, size, 'rgba(115,72,38,0.1)', 18000);
      ctx.fillStyle = '#493b33'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.font = '180px "Kaiti TC", "STKaiti", "Noto Serif TC", serif';
      ctx.fillText(wishes[side][0], size / 2, 370); ctx.fillText(wishes[side][1], size / 2, 600);
      ctx.fillStyle = '#a74437'; ctx.fillRect(670, 695, 72, 72);
      ctx.strokeStyle = '#f3c6a2'; ctx.lineWidth = 4; ctx.strokeRect(678, 703, 56, 56);
      ctx.font = '32px serif'; ctx.fillStyle = '#f3c6a2'; ctx.fillText('願', 706, 732);
    });
    const material = new THREE.MeshStandardMaterial({ map, roughness: 0.87, side: THREE.DoubleSide });
    const positions: number[] = [], uvs: number[] = [], indices: number[] = [];
    const segments = 24;
    const sample = (u: number, v: number) => {
      const half = 0.255 + 0.29 * Math.pow(Math.sin(v * Math.PI * 0.91), 0.65);
      const x = (u - 0.5) * half * 2;
      const z = half + Math.sin(u * Math.PI) * 0.07 * Math.sin(v * Math.PI);
      const y = 0.13 + v * 1.7 + 0.055 * Math.sin(u * Math.PI) * Math.pow(v, 8);
      return new THREE.Vector3(x, y, z).applyAxisAngle(new THREE.Vector3(0, 1, 0), side * Math.PI / 2);
    };
    for (let j = 0; j <= segments; j++) for (let i = 0; i <= segments; i++) {
      const p = sample(i / segments, j / segments); positions.push(p.x, p.y, p.z); uvs.push(i / segments, j / segments);
    }
    for (let j = 0; j < segments; j++) for (let i = 0; i < segments; i++) {
      const a = j * (segments + 1) + i; indices.push(a, a + 1, a + segments + 1, a + 1, a + segments + 2, a + segments + 1);
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2)); geometry.setIndex(indices); geometry.computeVertexNormals();
    mesh(group, geometry, material);
    cord(group, Array.from({ length: 25 }, (_, i) => sample(0, i / 24)), 0.007, seamMaterial);
    rod(group, sample(0, 0), sample(1, 0), 0.012, bamboo);
    cord(group, Array.from({ length: 25 }, (_, i) => sample(i / 24, 1)), 0.007, seamMaterial);
  }
  // Crossed wire supports and a small unlit fuel pad are visible from below.
  const wire = new THREE.MeshStandardMaterial({ color: '#665546', metalness: 0.55, roughness: 0.55 });
  rod(group, new THREE.Vector3(-0.255, 0.13, -0.255), new THREE.Vector3(0.255, 0.13, 0.255), 0.004, wire);
  rod(group, new THREE.Vector3(0.255, 0.13, -0.255), new THREE.Vector3(-0.255, 0.13, 0.255), 0.004, wire);
  mesh(group, new THREE.CylinderGeometry(0.065, 0.065, 0.023, 24), new THREE.MeshStandardMaterial({ color: '#dacbb5', roughness: 1 }), 0, 0.135);
  const crown = new THREE.PlaneGeometry(1, 1, 24, 24);
  const crownPosition = crown.attributes.position;
  const half = 0.255 + 0.29 * Math.pow(Math.sin(Math.PI * 0.91), 0.65);
  for (let i = 0; i < crownPosition.count; i++) {
    const u = crown.attributes.uv.getX(i), v = crown.attributes.uv.getY(i);
    const su = Math.sin(u * Math.PI), sv = Math.sin(v * Math.PI);
    crownPosition.setXYZ(i, (u - 0.5) * half * 2, 1.83 + 0.055 * (su + sv - su * sv) + 0.03 * su * sv, (v - 0.5) * half * 2);
  }
  crown.computeVertexNormals();
  mesh(group, crown, new THREE.MeshStandardMaterial({ color: '#f0bd9e', roughness: 0.87, side: THREE.DoubleSide }));
  return group;
}

/** Open Meinong oil-paper umbrella with plum blossom painting and exposed bamboo ribs. */
export function createUmbrella() {
  const group = new THREE.Group();
  group.name = 'Meinong oil-paper umbrella';
  const paper = texture((ctx, size) => {
    ctx.fillStyle = '#e7b35c'; ctx.fillRect(0, 0, size, size);
    grain(ctx, size, 'rgba(109,62,27,0.12)', 22000);
    ctx.lineCap = 'round'; ctx.strokeStyle = '#554132';
    const branch = (x: number, y: number, x2: number, y2: number, width: number) => { ctx.lineWidth = width; ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo((x + x2) / 2 + 35, (y + y2) / 2, x2, y2); ctx.stroke(); };
    branch(95, 865, 740, 210, 16); branch(310, 650, 200, 285, 8); branch(505, 460, 860, 460, 7); branch(600, 355, 530, 140, 6);
    for (let i = 0; i < 42; i++) {
      const t = i / 42, x = 140 + t * 650 + Math.sin(i * 3.7) * 100, y = 820 - t * 620 + Math.cos(i * 1.8) * 95;
      for (let p = 0; p < 5; p++) {
        const a = p * TAU / 5;
        ctx.fillStyle = i % 3 === 0 ? '#c85556' : '#e4d4bc'; ctx.beginPath(); ctx.ellipse(x + Math.cos(a) * 10, y + Math.sin(a) * 10, 10, 7, a, 0, TAU); ctx.fill();
      }
      ctx.fillStyle = '#a77328'; ctx.beginPath(); ctx.arc(x, y, 3, 0, TAU); ctx.fill();
    }
    ctx.fillStyle = '#553a2a'; ctx.textAlign = 'center'; ctx.font = '42px "Kaiti TC", "STKaiti", serif'; ctx.fillText('美濃', 820, 750);
    ctx.fillStyle = '#b43c30'; ctx.fillRect(800, 775, 38, 38);
  });
  const paperMaterial = new THREE.MeshStandardMaterial({ map: paper, roughness: 0.71, side: THREE.DoubleSide });
  const bamboo = wood();
  const positions: number[] = [], uvs: number[] = [], indices: number[] = [];
  const radial = 28, around = 96;
  const canopy = (r: number, a: number) => new THREE.Vector3(Math.cos(a) * r, 1.82 - 0.34 * Math.pow(r, 0.8) - 0.018 * Math.sin(a * 24) ** 2 * r, Math.sin(a) * r);
  for (let j = 0; j <= radial; j++) for (let i = 0; i <= around; i++) {
    const r = j / radial, a = i / around * TAU, p = canopy(r, a);
    positions.push(p.x, p.y, p.z); uvs.push(0.5 + p.x * 0.5, 0.5 + p.z * 0.5);
  }
  for (let j = 0; j < radial; j++) for (let i = 0; i < around; i++) {
    const a = j * (around + 1) + i; indices.push(a, a + around + 1, a + 1, a + 1, a + around + 1, a + around + 2);
  }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3)); geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2)); geo.setIndex(indices); geo.computeVertexNormals();
  mesh(group, geo, paperMaterial);
  for (let i = 0; i < 24; i++) {
    const a = i * TAU / 24;
    cord(group, Array.from({ length: 13 }, (_, j) => canopy(j / 12, a).add(new THREE.Vector3(0, -0.017, 0))), 0.009, bamboo);
    rod(group, new THREE.Vector3(0, 1.04, 0), canopy(0.54, a).add(new THREE.Vector3(0, -0.025, 0)), 0.007, bamboo);
    const tip = canopy(1, a); mesh(group, new THREE.SphereGeometry(0.017, 8, 8), bamboo, tip.x, tip.y, tip.z);
  }
  cord(group, Array.from({ length: 97 }, (_, i) => canopy(1, i / 96 * TAU)), 0.012, new THREE.MeshStandardMaterial({ color: '#a36e2f', roughness: 0.8 }));
  mesh(group, new THREE.CylinderGeometry(0.025, 0.025, 1.78, 24), bamboo, 0, 0.89);
  mesh(group, new THREE.CylinderGeometry(0.052, 0.052, 0.32, 24), new THREE.MeshStandardMaterial({ color: '#663e25', roughness: 0.55 }), 0, 0.19);
  mesh(group, new THREE.CylinderGeometry(0.042, 0.05, 0.14, 24), bamboo, 0, 1.02);
  mesh(group, new THREE.SphereGeometry(0.047, 20, 12), bamboo, 0, 1.835).scale.y = 1.3;
  return group;
}

/** Red embroidered peace keepsake, with brocade weave, stitched edge, and knotted cord. */
export function createTemplePouch() {
  const group = new THREE.Group(); group.name = 'Temple peace keepsake';
  const map = texture((ctx, size) => {
    ctx.fillStyle = '#9d1627'; ctx.fillRect(0, 0, size, size);
    ctx.strokeStyle = 'rgba(246,171,93,0.1)'; ctx.lineWidth = 1;
    for (let i = 0; i < size; i += 4) { ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(size, i); ctx.stroke(); ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, size); ctx.stroke(); }
    ctx.strokeStyle = '#bb563c'; ctx.lineWidth = 2;
    for (let x = 30; x < size; x += 90) for (let y = 30; y < size; y += 90) { ctx.beginPath(); ctx.ellipse(x, y, 22, 11, Math.PI / 4, 0, TAU); ctx.stroke(); ctx.beginPath(); ctx.ellipse(x, y, 22, 11, -Math.PI / 4, 0, TAU); ctx.stroke(); }
    ctx.strokeStyle = '#e2b866'; ctx.lineWidth = 6; ctx.strokeRect(95, 110, 834, 804); ctx.lineWidth = 2; ctx.strokeRect(110, 125, 804, 774);
    ctx.fillStyle = '#ebca83'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = '215px "Kaiti TC", "STKaiti", "Noto Serif TC", serif';
    ctx.fillText('平', 512, 380); ctx.fillText('安', 512, 625);
    ctx.strokeStyle = '#d9a954'; ctx.lineWidth = 4;
    for (const y of [195, 830]) { ctx.beginPath(); ctx.moveTo(240, y); ctx.bezierCurveTo(330, y - 65, 370, y + 60, 450, y); ctx.bezierCurveTo(520, y - 60, 570, y + 60, 650, y); ctx.bezierCurveTo(710, y - 50, 750, y - 25, 780, y); ctx.stroke(); }
  });
  const cloth = new THREE.MeshStandardMaterial({ map, roughness: 0.9, side: THREE.DoubleSide });
  const positions: number[] = [], uvs: number[] = [], indices: number[] = [];
  const width = 0.72, height = 1.02;
  // A gently inflated, closed fabric envelope; front and back use the same embroidered silk.
  for (let face = 0; face < 2; face++) {
    const offset = positions.length / 3;
    for (let j = 0; j <= 24; j++) for (let i = 0; i <= 24; i++) {
      const u = i / 24, v = j / 24;
      const pinch = 1 - 0.13 * Math.pow(v, 8);
      const x = (u - 0.5) * width * pinch, y = 0.5 + v * height;
      const z = (face === 0 ? 1 : -1) * (0.022 + 0.12 * Math.pow(Math.sin(u * Math.PI) * Math.sin(v * Math.PI), 0.7));
      positions.push(x, y, z); uvs.push(face === 0 ? u : 1 - u, v);
    }
    for (let j = 0; j < 24; j++) for (let i = 0; i < 24; i++) {
      const a = offset + j * 25 + i;
      if (face === 0) indices.push(a, a + 1, a + 25, a + 1, a + 26, a + 25);
      else indices.push(a, a + 25, a + 1, a + 1, a + 25, a + 26);
    }
  }
  const border = [
    ...Array.from({ length: 25 }, (_, i) => i),
    ...Array.from({ length: 24 }, (_, i) => (i + 1) * 25 + 24),
    ...Array.from({ length: 24 }, (_, i) => 624 - i - 1),
    ...Array.from({ length: 24 }, (_, i) => (23 - i) * 25),
  ];
  for (let i = 0; i < border.length - 1; i++) {
    const a = border[i], b = border[i + 1];
    indices.push(a, b + 625, b, a, a + 625, b + 625);
  }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3)); geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2)); geo.setIndex(indices); geo.computeVertexNormals(); mesh(group, geo, cloth);
  const thread = new THREE.MeshStandardMaterial({ color: '#ddb35d', roughness: 0.8 });
  const outline = [new THREE.Vector3(-0.36, 0.5, 0), new THREE.Vector3(-0.36, 0.95, 0), new THREE.Vector3(-0.315, 1.52, 0), new THREE.Vector3(0, 1.54, 0), new THREE.Vector3(0.315, 1.52, 0), new THREE.Vector3(0.36, 0.95, 0), new THREE.Vector3(0.36, 0.5, 0), new THREE.Vector3(0, 0.48, 0), new THREE.Vector3(-0.36, 0.5, 0)];
  cord(group, outline, 0.016, new THREE.MeshStandardMaterial({ color: '#c12c34', roughness: 0.95 }));
  for (const direction of [-1, 1]) {
    cord(group, [new THREE.Vector3(direction * 0.2, 1.51, 0), new THREE.Vector3(direction * 0.23, 1.73, 0), new THREE.Vector3(direction * 0.09, 1.92, 0), new THREE.Vector3(0, 1.96, 0)], 0.013, thread);
    cord(group, [new THREE.Vector3(0, 0.49, 0), new THREE.Vector3(direction * 0.11, 0.42, 0), new THREE.Vector3(direction * 0.05, 0.34, 0), new THREE.Vector3(0, 0.39, 0), new THREE.Vector3(direction * 0.07, 0.47, 0)], 0.012, thread);
  }
  tassel(group, new THREE.Vector3(0, 0.32, 0), 0.28, thread);
  return group;
}
