import * as THREE from 'three';

const TAU = Math.PI * 2;
const v = (x: number, y: number, z = 0) => new THREE.Vector3(x, y, z);
const matte = (color: string) => new THREE.MeshStandardMaterial({ color, roughness: 0.78 });
const brass = () => new THREE.MeshStandardMaterial({ color: '#d0ad67', metalness: 0.7, roughness: 0.32 });

function mesh(group: THREE.Group, geometry: THREE.BufferGeometry, material: THREE.Material, x = 0, y = 0, z = 0) {
  const object = new THREE.Mesh(geometry, material);
  object.position.set(x, y, z);
  object.castShadow = object.receiveShadow = true;
  group.add(object);
  return object;
}

function cord(group: THREE.Group, points: THREE.Vector3[], radius: number, material: THREE.Material, closed = false) {
  return mesh(group, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points, closed, 'centripetal'), Math.max(16, points.length * 6), radius, 6, closed), material);
}

function map(draw: (ctx: CanvasRenderingContext2D, size: number) => void) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 1024;
  draw(canvas.getContext('2d')!, 1024);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}

function hangingString(group: THREE.Group, bottom: number, top: number, material: THREE.Material) {
  cord(group, [v(0, bottom), v(0.012, bottom + (top - bottom) * 0.35), v(-0.009, top - 0.13), v(0, top - 0.07)], 0.011, material);
  cord(group, [v(0, top - 0.07), v(-0.043, top - 0.05), v(-0.04, top + 0.015), v(0, top + 0.045), v(0.04, top + 0.015), v(0.043, top - 0.05)], 0.011, material, true);
  group.userData.hangAnchor = [0, top - 0.0125, 0];
}

function tassel(group: THREE.Group, x: number, y: number, length: number, material: THREE.Material) {
  const gold = brass();
  mesh(group, new THREE.SphereGeometry(0.053, 16, 12), gold, x, y).scale.y = 1.4;
  for (let i = 0; i < 24; i++) {
    const a = TAU * i / 24;
    const r = 0.018 + (i % 3) * 0.012;
    cord(group, [v(x + Math.cos(a) * r * 0.6, y - 0.04, Math.sin(a) * r * 0.6), v(x + Math.cos(a) * r, y - length * 0.55, Math.sin(a) * r), v(x + Math.cos(a) * r * 1.5, y - length + (i % 4) * 0.006, Math.sin(a) * r * 1.5)], 0.004, material);
  }
}

/** A hollow floral porcelain bell, complete with the internal striker and paper sail. */
export function createCeramicWindBell() {
  const group = new THREE.Group();
  group.name = 'Floral porcelain wind bell';
  const cotton = matte('#c7a886');
  const floral = map((ctx, size) => {
    ctx.fillStyle = '#f2ece0'; ctx.fillRect(0, 0, size, size);
    ctx.strokeStyle = '#527774'; ctx.lineWidth = 5;
    for (let i = 0; i < 8; i++) {
      const x = i * 140 + 30, y = 460 + Math.sin(i * 1.7) * 150;
      ctx.beginPath(); ctx.moveTo(x - 70, 920); ctx.quadraticCurveTo(x + 65, 690, x, y); ctx.stroke();
      for (const side of [-1, 1]) {
        ctx.fillStyle = '#809b79'; ctx.beginPath(); ctx.ellipse(x + side * 25, y + 100, 32, 13, side * 0.65, 0, TAU); ctx.fill();
      }
      for (let j = 0; j < 5; j++) {
        const a = j * TAU / 5;
        ctx.fillStyle = i % 2 ? '#bd6570' : '#d58b83';
        ctx.beginPath(); ctx.ellipse(x + Math.cos(a) * 22, y + Math.sin(a) * 22, 24, 17, a, 0, TAU); ctx.fill();
      }
      ctx.fillStyle = '#d4ad5b'; ctx.beginPath(); ctx.arc(x, y, 9, 0, TAU); ctx.fill();
    }
    ctx.fillStyle = '#315f6b'; ctx.fillRect(0, 880, size, 16); ctx.fillRect(0, 917, size, 6);
  });
  const glazeBump = map((ctx, size) => {
    ctx.fillStyle = '#808080'; ctx.fillRect(0, 0, size, size);
    for (let i = 0; i < 18000; i++) { ctx.fillStyle = i % 2 ? '#888888' : '#787878'; ctx.beginPath(); ctx.arc((i * 71.317 % 1) * size, (i * 29.773 % 1) * size, 1.2, 0, TAU); ctx.fill(); }
  });
  const porcelain = new THREE.MeshPhysicalMaterial({ map: floral, bumpMap: glazeBump, bumpScale: 0.002, roughness: 0.2, clearcoat: 0.8, clearcoatRoughness: 0.13, side: THREE.DoubleSide });
  // Continuous outer wall, round lip, and inner wall leave the underside visibly open.
  const profile = [v(0.025, 1.98), v(0.15, 1.97), v(0.27, 1.86), v(0.37, 1.64), v(0.415, 1.38), v(0.414, 1.32), v(0.39, 1.31), v(0.385, 1.39), v(0.345, 1.64), v(0.24, 1.83), v(0.125, 1.925), v(0.025, 1.93)];
  const smoothProfile = new THREE.CatmullRomCurve3(profile, false, 'centripetal').getPoints(144).reverse();
  mesh(group, new THREE.LatheGeometry(smoothProfile.map(p => new THREE.Vector2(p.x, p.y)), 80), porcelain);
  const lip = mesh(group, new THREE.TorusGeometry(0.402, 0.016, 10, 80), new THREE.MeshPhysicalMaterial({ color: '#e8e4d5', roughness: 0.21, clearcoat: 0.8 }), 0, 1.322); lip.rotation.x = Math.PI / 2;
  const eye = mesh(group, new THREE.TorusGeometry(0.046, 0.012, 8, 24), brass(), 0, 2.01);
  eye.rotation.y = Math.PI / 2;
  hangingString(group, 2.035, 2.43, cotton);
  cord(group, [v(0, 1.94), v(0, 1.45), v(0.01, 1.13), v(0.025, 0.96)], 0.009, cotton);
  mesh(group, new THREE.SphereGeometry(0.08, 24, 16), matte('#b99670'), 0, 1.42).scale.y = 1.4;
  const paperMap = map((ctx, size) => {
    ctx.fillStyle = '#e6d8b8'; ctx.fillRect(0, 0, size, size);
    ctx.fillStyle = 'rgba(117,92,56,0.13)';
    for (let i = 0; i < 8000; i++) ctx.fillRect((i * 71.317 % 1) * size, (i * 29.773 % 1) * size, 1, 4);
    ctx.strokeStyle = '#7d977e'; ctx.lineWidth = 9; ctx.strokeRect(80, 55, 864, 914);
    ctx.fillStyle = '#385852'; ctx.textAlign = 'center'; ctx.font = '230px "Kaiti TC", "STKaiti", serif';
    ctx.fillText('聽', 512, 390); ctx.fillText('風', 512, 710);
    ctx.fillStyle = '#b75c48'; ctx.fillRect(710, 780, 112, 112);
  });
  const geometry = new THREE.PlaneGeometry(0.28, 0.77, 8, 24);
  const positions = geometry.attributes.position;
  for (let i = 0; i < positions.count; i++) positions.setZ(i, Math.sin(positions.getY(i) * 6) * 0.028 + Math.sin(positions.getX(i) * 10) * 0.014);
  geometry.computeVertexNormals();
  mesh(group, geometry, new THREE.MeshStandardMaterial({ map: paperMap, roughness: 0.94, side: THREE.DoubleSide }), 0.025, 0.575);
  mesh(group, new THREE.TorusGeometry(0.014, 0.004, 6, 16), brass(), 0.025, 0.94, 0.023);
  return group;
}

/** A woven fish keepsake with a plaited silhouette, paired fins, and loose cotton fringe. */
export function createWovenFishCharm() {
  const group = new THREE.Group(); group.name = 'Woven fish charm';
  const weave = map((ctx, size) => {
    ctx.fillStyle = '#c5a76d'; ctx.fillRect(0, 0, size, size);
    const colors = ['#d7c28c', '#a7844d', '#cc755d', '#5d8d87'];
    for (let row = 0; row < 64; row++) for (let col = 0; col < 64; col++) {
      const x = col * 16, y = row * 16;
      ctx.fillStyle = colors[(row % 9 < 2 || col % 12 < 2) ? 2 + (Math.floor(col / 12) % 2) : (row + col) % 2];
      ctx.fillRect(x + 1, y + 1, 14, 14);
      ctx.strokeStyle = 'rgba(79,58,27,0.2)'; ctx.lineWidth = 1; ctx.beginPath();
      if ((row + col) % 2) { ctx.moveTo(x + 2, y + 4); ctx.lineTo(x + 14, y + 4); ctx.moveTo(x + 2, y + 10); ctx.lineTo(x + 14, y + 10); }
      else { ctx.moveTo(x + 4, y + 2); ctx.lineTo(x + 4, y + 14); ctx.moveTo(x + 10, y + 2); ctx.lineTo(x + 10, y + 14); }
      ctx.stroke();
    }
  });
  const straw = new THREE.MeshStandardMaterial({ map: weave, bumpMap: weave, bumpScale: 0.004, roughness: 0.8 });
  const thread = matte('#b65343'), jade = matte('#477f7b');
  const heightAt = (x: number) => 0.325 * Math.pow(Math.max(0, Math.sin((x + 0.63) / 1.07 * Math.PI)), 0.67) * (1 - 0.18 * (x + 0.63) / 1.07);
  const depthAt = (x: number) => 0.17 * Math.pow(Math.max(0, Math.sin((x + 0.63) / 1.07 * Math.PI)), 0.7);
  const bodyGeometry = new THREE.SphereGeometry(1, 48, 32);
  const bodyPositions = bodyGeometry.attributes.position;
  for (let i = 0; i < bodyPositions.count; i++) {
    const originalX = bodyPositions.getX(i), x = -0.095 + originalX * 0.535;
    const section = Math.sqrt(Math.max(0.00001, 1 - originalX * originalX));
    bodyPositions.setXYZ(i, x, 1.39 + bodyPositions.getY(i) / section * heightAt(x), bodyPositions.getZ(i) / section * depthAt(x));
  }
  bodyGeometry.computeVertexNormals(); mesh(group, bodyGeometry, straw);
  const wickerMaterials = [matte('#d1b878'), matte('#ab874f'), matte('#ba6952'), matte('#547f78')];
  // Each diagonal ribbon follows the curved body, alternating relief at crossings.
  for (const face of [-1, 1]) for (const slope of [-1, 1]) for (let row = -6; row <= 6; row++) {
    const points: THREE.Vector3[] = [];
    for (let j = 0; j <= 40; j++) {
      const x = -0.62 + j / 40 * 1.05, y = slope * x * 0.58 + row * 0.068;
      const height = heightAt(x);
      if (Math.abs(y) < height * 0.95) {
        const relief = 0.005 + 0.003 * Math.cos((x / 0.068 + row) * Math.PI) * slope;
        points.push(v(x, 1.39 + y, face * (depthAt(x) * Math.sqrt(1 - (y / height) ** 2) + relief)));
      }
    }
    if (points.length > 2) {
      const strip = mesh(group, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), 36, 0.007, 4, false), wickerMaterials[row % 4 === 0 ? 2 : row % 5 === 0 ? 3 : slope === 1 ? 0 : 1]);
      strip.name = 'Raised woven reed';
    }
  }
  const tailShape = new THREE.Shape();
  tailShape.moveTo(0, 0); tailShape.quadraticCurveTo(0.16, 0.07, 0.35, 0.27); tailShape.quadraticCurveTo(0.29, 0, 0.35, -0.27); tailShape.quadraticCurveTo(0.16, -0.07, 0, 0);
  mesh(group, new THREE.ExtrudeGeometry(tailShape, { depth: 0.065, bevelEnabled: true, bevelThickness: 0.018, bevelSize: 0.025, bevelSegments: 2, steps: 1, curveSegments: 14 }), straw, 0.39, 1.39, -0.032);
  const finShape = new THREE.Shape(); finShape.moveTo(-0.2, 0); finShape.quadraticCurveTo(0, 0.32, 0.24, 0.025); finShape.lineTo(-0.2, 0);
  for (const side of [-1, 1]) {
    const fin = mesh(group, new THREE.ExtrudeGeometry(finShape, { depth: 0.027, bevelEnabled: true, bevelSize: 0.01, bevelThickness: 0.008, bevelSegments: 1, curveSegments: 12 }), jade, -0.08, 1.39 + side * 0.25, -0.012);
    if (side < 0) fin.rotation.x = Math.PI;
  }
  for (const side of [-1, 1]) {
    mesh(group, new THREE.SphereGeometry(0.062, 20, 14), matte('#e9d6a8'), -0.41, 1.46, side * 0.119).scale.z = 0.45;
    mesh(group, new THREE.SphereGeometry(0.033, 20, 14), matte('#263a37'), -0.421, 1.461, side * 0.147).scale.z = 0.55;
    mesh(group, new THREE.SphereGeometry(0.01, 12, 8), matte('#fff7dd'), -0.433, 1.474, side * 0.162);
    cord(group, [v(-0.23, 1.63, side * 0.1), v(-0.16, 1.47, side * 0.172), v(-0.2, 1.24, side * 0.146)], 0.009, thread);
    cord(group, [v(-0.615, 1.405, side * 0.025), v(-0.58, 1.37, side * 0.054), v(-0.55, 1.385, side * 0.075)], 0.012, thread);
    for (let i = 0; i < 5; i++) {
      cord(group, [v(-0.26 + i * 0.065, 1.63, side * 0.027), v(-0.16 + i * 0.043, 1.77 - Math.abs(i - 2) * 0.025, side * 0.018)], 0.005, straw);
    }
  }
  for (let i = 0; i < 7; i++) {
    const a = -0.7 + i * 1.4 / 6;
    cord(group, [v(0.43, 1.39, 0.01), v(0.56, 1.39 + Math.sin(a) * 0.11, 0.045), v(0.71, 1.39 + Math.sin(a) * 0.3, 0.028)], 0.006, thread);
  }
  mesh(group, new THREE.TorusGeometry(0.035, 0.011, 8, 24), brass(), 0, 1.835);
  hangingString(group, 1.87, 2.26, thread);
  cord(group, [v(0, 1.085), v(0.015, 0.92), v(0, 0.77)], 0.012, thread);
  mesh(group, new THREE.SphereGeometry(0.054, 20, 16), jade, 0, 0.87);
  tassel(group, 0, 0.74, 0.53, thread);
  return group;
}

/** Red interlaced cordwork with visible over-under crossings and three silk tassels. */
export function createChineseKnot() {
  const group = new THREE.Group(); group.name = 'Red prosperity knot';
  const satinMap = map((ctx, size) => {
    ctx.fillStyle = '#a4142b'; ctx.fillRect(0, 0, size, size);
    for (let i = -size; i < size * 2; i += 9) {
      ctx.strokeStyle = '#bf3344'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i + size, size); ctx.stroke();
      ctx.strokeStyle = '#741429'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(i + 4, 0); ctx.lineTo(i + size + 4, size); ctx.stroke();
    }
  });
  const red = new THREE.MeshPhysicalMaterial({ map: satinMap, bumpMap: satinMap, bumpScale: 0.0015, roughness: 0.46, sheen: 0.7, sheenColor: '#e85b5c', sheenRoughness: 0.5 });
  const edge = new THREE.MeshPhysicalMaterial({ color: '#bd2437', roughness: 0.5, sheen: 0.6, sheenColor: '#ee7a67' });
  const centerY = 1.34;
  // Closed flattened loops form a compact endless-knot lattice. Alternating depth
  // separates the two cord families at every crossing rather than intersecting them.
  for (let family = 0; family < 2; family++) for (let lane = 0; lane < 4; lane++) {
    const offset = -0.24 + lane * 0.16;
    const points = Array.from({ length: 96 }, (_, j) => {
      const a = j / 96 * TAU;
      const along = 0.39 * Math.cos(a), across = offset + 0.045 * Math.sin(a);
      const depth = 0.046 * Math.cos((along + 0.24) / 0.16 * Math.PI) * (lane % 2 ? -1 : 1) * (family === 0 ? 1 : -1);
      return family === 0 ? v(along, centerY + across, depth) : v(across, centerY + along, depth);
    });
    mesh(group, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points, true), 144, 0.027, 8, true), red);
  }
  // Four corner ears tuck into the woven center, with no exposed cut cord ends.
  for (let side = 0; side < 4; side++) {
    const a = side * Math.PI / 2 + Math.PI / 4;
    const points = [v(-0.045, 0.28), v(-0.1, 0.4), v(-0.06, 0.5), v(0, 0.515), v(0.06, 0.5), v(0.1, 0.4), v(0.045, 0.28)].map(p => v(p.x * Math.cos(a) - p.y * Math.sin(a), centerY + p.x * Math.sin(a) + p.y * Math.cos(a), -0.015));
    cord(group, points, 0.025, red, true);
  }
  cord(group, [v(-0.05, 1.67), v(-0.06, 1.79), v(0, 1.825), v(0.06, 1.79), v(0.05, 1.67)], 0.021, red, true);
  hangingString(group, 1.825, 2.17, red);
  const bead = mesh(group, new THREE.SphereGeometry(0.082, 32, 20), brass(), 0, 0.82); bead.scale.y = 1.2;
  for (const y of [0.75, 0.89]) {
    const band = mesh(group, new THREE.TorusGeometry(0.055, 0.006, 8, 32), edge, 0, y); band.rotation.x = Math.PI / 2;
  }
  for (const x of [-0.2, 0, 0.2]) {
    const top = x === 0 ? 0.56 : 0.64;
    cord(group, [v(0, 0.965), v(x * 0.7, 0.76), v(x, top + 0.04)], 0.014, red);
    tassel(group, x, top, top - 0.07, x === 0 ? red : edge);
  }
  return group;
}

/** Five individually hollow bamboo tubes suspended around a wooden striker. */
export function createBambooChime() {
  const group = new THREE.Group(); group.name = 'Bamboo garden chime';
  const string = matte('#a98965');
  const bambooMap = map((ctx, size) => {
    ctx.fillStyle = '#c4b478'; ctx.fillRect(0, 0, size, size);
    for (let i = 0; i < 1200; i++) {
      const x = (i * 71.39 % 1) * size;
      ctx.strokeStyle = i % 3 ? 'rgba(91,96,40,0.13)' : 'rgba(240,221,148,0.28)'; ctx.lineWidth = i % 3 + 1;
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.bezierCurveTo(x + 3, 300, x - 4, 700, x, size); ctx.stroke();
    }
    for (const y of [190, 700]) {
      ctx.fillStyle = '#8c8f51'; ctx.fillRect(0, y, size, 12);
      ctx.fillStyle = '#cebf7e'; ctx.fillRect(0, y + 12, size, 6);
    }
  });
  const bamboo = new THREE.MeshStandardMaterial({ map: bambooMap, bumpMap: bambooMap, bumpScale: 0.003, roughness: 0.61, side: THREE.DoubleSide });
  const cut = matte('#d5c28b');
  const woodMap = map((ctx, size) => {
    ctx.fillStyle = '#986c43'; ctx.fillRect(0, 0, size, size);
    ctx.strokeStyle = 'rgba(48,25,14,0.2)'; ctx.lineWidth = 2;
    for (let i = 0; i < 80; i++) { ctx.beginPath(); ctx.ellipse(512, 512, 15 + i * 9, 10 + i * 6, 0.3, 0, TAU); ctx.stroke(); }
  });
  const wood = new THREE.MeshStandardMaterial({ map: woodMap, bumpMap: woodMap, bumpScale: 0.002, roughness: 0.63 });
  const metal = brass();
  mesh(group, new THREE.CylinderGeometry(0.4, 0.425, 0.11, 64), wood, 0, 1.94);
  for (const y of [1.898, 1.982]) {
    const rim = mesh(group, new THREE.TorusGeometry(0.412, 0.012, 8, 64), cut, 0, y); rim.rotation.x = Math.PI / 2;
  }
  for (let i = 0; i < 3; i++) {
    const a = i * TAU / 3;
    const x = Math.cos(a) * 0.32, z = Math.sin(a) * 0.32;
    const eyelet = mesh(group, new THREE.TorusGeometry(0.024, 0.009, 8, 24), metal, x, 2.013, z); eyelet.rotation.y = -a;
    cord(group, [v(x, 2.03, z), v(Math.cos(a) * 0.17, 2.2, Math.sin(a) * 0.17), v(0, 2.34)], 0.012, string);
  }
  hangingString(group, 2.34, 2.61, string);
  for (let i = 0; i < 5; i++) {
    const a = i * TAU / 5, x = Math.cos(a) * 0.3, z = Math.sin(a) * 0.3;
    const length = 0.88 + i * 0.075, top = 1.68;
    const upperEye = mesh(group, new THREE.TorusGeometry(0.022, 0.007, 8, 24), metal, x, 1.885, z); upperEye.rotation.y = -a;
    const lowerEye = mesh(group, new THREE.TorusGeometry(0.025, 0.008, 8, 24), metal, x, top + 0.027, z); lowerEye.rotation.y = -a;
    cord(group, [v(x, 1.875, z), v(x + 0.007, 1.78, z), v(x, top + 0.044, z), v(x + 0.018, top + 0.018, z), v(x, top + 0.008, z)], 0.01, string);
    // A lathed annular cross-section gives each tube a real wall and open lower mouth.
    const profile = [new THREE.Vector2(0.096, top - length), new THREE.Vector2(0.1, top - length + 0.03), new THREE.Vector2(0.097, top - 0.18), new THREE.Vector2(0.095, top), new THREE.Vector2(0.073, top), new THREE.Vector2(0.076, top - length), new THREE.Vector2(0.096, top - length)];
    mesh(group, new THREE.LatheGeometry(profile, 48), bamboo, x, 0, z);
    mesh(group, new THREE.CylinderGeometry(0.074, 0.074, 0.012, 32), cut, x, top - 0.007, z);
    for (const y of [top - length + 0.02, top - 0.012]) {
      const band = mesh(group, new THREE.TorusGeometry(0.086, 0.011, 8, 48), cut, x, y, z); band.rotation.x = Math.PI / 2;
    }
    for (const y of [top - 0.23, top - length + 0.19]) {
      const nodeProfile = [new THREE.Vector2(0.097, y - 0.018), new THREE.Vector2(0.106, y - 0.008), new THREE.Vector2(0.108, y + 0.004), new THREE.Vector2(0.101, y + 0.015), new THREE.Vector2(0.097, y + 0.022)];
      mesh(group, new THREE.LatheGeometry(nodeProfile, 40), bamboo, x, 0, z);
    }
  }
  cord(group, [v(0, 1.9), v(0, 1.1), v(0.035, 0.45)], 0.01, string);
  mesh(group, new THREE.CylinderGeometry(0.185, 0.2, 0.075, 48), wood, 0, 1.1);
  // A lightweight bamboo leaf catches the breeze below the resonating tubes.
  const leafShape = new THREE.Shape(); leafShape.moveTo(0, 0.19); leafShape.quadraticCurveTo(0.18, -0.02, 0, -0.35); leafShape.quadraticCurveTo(-0.14, -0.05, 0, 0.19);
  mesh(group, new THREE.ExtrudeGeometry(leafShape, { depth: 0.012, bevelEnabled: true, bevelSize: 0.005, bevelThickness: 0.004, bevelSegments: 1, curveSegments: 16 }), bamboo, 0.035, 0.39, -0.008);
  cord(group, [v(0.035, 0.55, 0.009), v(0.04, 0.32, 0.011), v(0.035, 0.07, 0.009)], 0.004, cut);
  return group;
}
