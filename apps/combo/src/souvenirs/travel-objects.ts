import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

// Original miniature designs inspired by everyday Taiwanese travel objects.
const clay = (color: THREE.ColorRepresentation, roughness = 0.65, metalness = 0) =>
  new THREE.MeshStandardMaterial({ color, roughness, metalness });

function mesh(group: THREE.Group, geometry: THREE.BufferGeometry, material: THREE.Material,
  position: [number, number, number], rotation?: [number, number, number]) {
  const object = new THREE.Mesh(geometry, material);
  object.position.set(...position);
  if (rotation) object.rotation.set(...rotation);
  object.castShadow = true;
  object.receiveShadow = true;
  group.add(object);
  return object;
}

function box(group: THREE.Group, size: [number, number, number], material: THREE.Material,
  position: [number, number, number], radius = 0.025) {
  return mesh(group, new RoundedBoxGeometry(...size, 3, radius), material, position);
}

function tube(group: THREE.Group, points: [number, number, number][], radius: number,
  material: THREE.Material, segments = 36) {
  const curve = new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p)));
  return mesh(group, new THREE.TubeGeometry(curve, segments, radius, 8, false), material, [0, 0, 0]);
}

function canvasTexture(width: number, height: number,
  draw: (ctx: CanvasRenderingContext2D) => void) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;
  draw(ctx);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}

export function createRailTicket(): THREE.Group {
  const group = new THREE.Group();
  group.name = 'Taipei souvenir rail ticket';
  const paper = clay('#d8bf87', 0.95);
  const outline = new THREE.Shape();
  outline.moveTo(-0.97, -0.46);
  outline.lineTo(0.97, -0.46);
  outline.lineTo(0.97, 0.46);
  outline.lineTo(-0.97, 0.46);
  outline.closePath();
  const punch = new THREE.Path();
  punch.absarc(0.79, 0.3, 0.042, 0, Math.PI * 2, true);
  outline.holes.push(punch);
  const thickness = 0.025;
  const extruded = new THREE.ExtrudeGeometry(outline, {
    depth: thickness, bevelEnabled: true, bevelSize: 0.003, bevelThickness: 0.003,
    bevelSegments: 1, curveSegments: 20,
  });
  // Subdivide the paper faces so the gentle bend is physical on both sides.
  let vertices = Array.from(extruded.attributes.position.array);
  for (let pass = 0; pass < 3; pass++) {
    const divided: number[] = [];
    for (let i = 0; i < vertices.length; i += 9) {
      const a = new THREE.Vector3(vertices[i], vertices[i + 1], vertices[i + 2]);
      const b = new THREE.Vector3(vertices[i + 3], vertices[i + 4], vertices[i + 5]);
      const c = new THREE.Vector3(vertices[i + 6], vertices[i + 7], vertices[i + 8]);
      const ab = a.clone().lerp(b, 0.5), bc = b.clone().lerp(c, 0.5), ca = c.clone().lerp(a, 0.5);
      for (const p of [a, ab, ca, ab, b, bc, ca, bc, c, ab, bc, ca])
        divided.push(p.x, p.y, p.z);
    }
    vertices = divided;
  }
  extruded.dispose();
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.rotateX(-Math.PI / 2);
  geometry.translate(0, 0.045, 0);
  const positions = geometry.attributes.position;
  for (let i = 0; i < positions.count; i++) {
    const x = positions.getX(i);
    positions.setY(i, positions.getY(i) + 0.06 * x * x);
  }
  geometry.computeVertexNormals();
  mesh(group, geometry, paper, [0, 0, 0]);

  const print = canvasTexture(1536, 728, ctx => {
    ctx.fillStyle = '#e2c99a';
    ctx.fillRect(0, 0, 1536, 728);
    // Deterministic fibre marks retain a paper character without noisy randomness.
    for (let i = 0; i < 4400; i++) {
      const x = (i * 193) % 1536;
      const y = (i * 79) % 728;
      ctx.fillStyle = i % 2 ? 'rgba(99,74,34,.035)' : 'rgba(255,247,212,.16)';
      ctx.fillRect(x, y, 2 + i % 5, 1);
    }
    ctx.strokeStyle = '#5d3d26';
    ctx.lineWidth = 3;
    ctx.strokeRect(35, 34, 1466, 660);
    ctx.strokeRect(47, 46, 1442, 636);
    ctx.fillStyle = '#553c2b';
    ctx.textAlign = 'center';
    ctx.font = 'bold 64px serif';
    ctx.fillText('臺 北  ·  旅 行 記 念', 768, 138);
    ctx.font = '28px sans-serif';
    ctx.fillText('TAIPEI EXPLORER · SOUVENIR EDITION', 768, 190);
    ctx.font = 'bold 82px serif';
    ctx.fillText('臺北   →   九份', 768, 348);
    ctx.font = '31px sans-serif';
    ctx.fillText('TAIPEI               JIUFEN', 768, 407);
    ctx.beginPath(); ctx.moveTo(105, 462); ctx.lineTo(1430, 462); ctx.stroke();
    ctx.font = '33px monospace';
    ctx.fillText('NO. 0088     ONE LITTLE JOURNEY', 768, 528);
    ctx.font = '23px sans-serif';
    ctx.fillText('SOUVENIR · ORIGINAL DESIGN · NOT VALID FOR TRAVEL', 768, 610);
    ctx.save(); ctx.translate(185, 320); ctx.rotate(-0.18);
    ctx.strokeStyle = '#a03c2a'; ctx.fillStyle = '#a03c2a';
    ctx.lineWidth = 5;
    ctx.beginPath(); ctx.arc(0, 0, 78, 0, Math.PI * 2); ctx.stroke();
    ctx.font = 'bold 35px serif'; ctx.fillText('旅', 0, 0);
    ctx.font = '19px sans-serif'; ctx.fillText('MEMORIES', 0, 35); ctx.restore();
    // The print layer follows the physical punch rather than covering it.
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath(); ctx.arc((0.79 + 0.97) / 1.94 * 1536,
      (0.46 - 0.3) / 0.92 * 728, 0.044 / 1.94 * 1536, 0, Math.PI * 2); ctx.fill();
  });
  const face = new THREE.PlaneGeometry(1.94, 0.92, 44, 12);
  face.rotateX(-Math.PI / 2);
  const fp = face.attributes.position;
  for (let i = 0; i < fp.count; i++) {
    fp.setY(i, 0.0735 + 0.06 * fp.getX(i) ** 2);
  }
  face.computeVertexNormals();
  mesh(group, face, new THREE.MeshStandardMaterial({ map: print, transparent: true,
    roughness: 0.95, alphaTest: 0.1 }), [0, 0, 0]);
  group.rotation.y = -0.16;
  group.position.y = -0.042;
  return group;
}

export function createForestTrain(): THREE.Group {
  const group = new THREE.Group();
  group.name = 'Alishan forest railway miniature';
  const red = clay('#ae2925', 0.38);
  const darkRed = clay('#671f21', 0.48);
  const iron = clay('#252c2b', 0.48, 0.55);
  const steel = clay('#a9b0aa', 0.34, 0.75);
  const brass = clay('#bfa05a', 0.38, 0.7);
  const wood = clay('#65513e', 0.88);
  const window = new THREE.MeshPhysicalMaterial({ color: '#abc4b8', metalness: 0.15,
    roughness: 0.17, clearcoat: 1 });
  const cream = clay('#eadcc1', 0.55);
  // Display track, ties, polished rail crowns, and individual fasteners.
  for (let i = 0; i < 11; i++) {
    const x = -0.96 + i * 0.192;
    box(group, [0.09, 0.045, 0.72], wood, [x, 0.023, 0], 0.008);
    for (const z of [-0.245, 0.245]) {
      box(group, [0.115, 0.012, 0.13], iron, [x, 0.05, z], 0.004);
      for (const dz of [-0.043, 0.043])
        mesh(group, new THREE.CylinderGeometry(0.011, 0.013, 0.012, 8), steel,
          [x, 0.062, z + dz]);
    }
  }
  for (const z of [-0.245, 0.245]) {
    box(group, [2.12, 0.06, 0.028], iron, [0, 0.086, z], 0.004);
    box(group, [2.12, 0.013, 0.055], steel, [0, 0.122, z], 0.004);
  }
  box(group, [1.73, 0.12, 0.49], iron, [0, 0.32, 0], 0.015);
  box(group, [1.86, 0.07, 0.58], darkRed, [0, 0.42, 0], 0.012);
  for (const x of [-0.59, -0.13, 0.55]) {
    for (const z of [-0.264, 0.264]) {
      mesh(group, new THREE.CylinderGeometry(0.164, 0.164, 0.055, 32), iron,
        [x, 0.286, z], [Math.PI / 2, 0, 0]);
      mesh(group, new THREE.CylinderGeometry(0.124, 0.124, 0.06, 32), red,
        [x, 0.286, z], [Math.PI / 2, 0, 0]);
      mesh(group, new THREE.CylinderGeometry(0.029, 0.029, 0.073, 16), steel,
        [x, 0.286, z], [Math.PI / 2, 0, 0]);
      for (let spoke = 0; spoke < 8; spoke++) {
        const a = spoke / 8 * Math.PI * 2;
        const bar = box(group, [0.104, 0.012, 0.014], darkRed,
          [x + Math.cos(a) * 0.067, 0.286 + Math.sin(a) * 0.067, z * 1.12], 0.003);
        bar.rotation.z = a;
      }
    }
  }
  for (const z of [-0.314, 0.314]) {
    tube(group, [[-0.59, 0.265, z], [-0.13, 0.265, z], [0.55, 0.265, z]], 0.017, steel, 8);
    for (const x of [-0.59, -0.13, 0.55])
      mesh(group, new THREE.SphereGeometry(0.024, 12, 8), brass, [x, 0.265, z]);
  }
  // Boiler, smoke box, front lamp and chimney establish a steam-train silhouette.
  mesh(group, new THREE.CylinderGeometry(0.205, 0.205, 1.01, 40), red,
    [-0.34, 0.67, 0], [0, 0, Math.PI / 2]);
  mesh(group, new THREE.CylinderGeometry(0.207, 0.207, 0.12, 40), iron,
    [-0.89, 0.67, 0], [0, 0, Math.PI / 2]);
  for (const x of [-0.72, -0.43, -0.08])
    mesh(group, new THREE.TorusGeometry(0.206, 0.009, 8, 40), brass,
      [x, 0.67, 0], [0, Math.PI / 2, 0]);
  mesh(group, new THREE.CylinderGeometry(0.074, 0.056, 0.19, 24), iron, [-0.69, 0.93, 0]);
  mesh(group, new THREE.CylinderGeometry(0.088, 0.071, 0.025, 24), iron, [-0.69, 1.036, 0]);
  mesh(group, new THREE.SphereGeometry(0.084, 24, 12), red, [-0.25, 0.885, 0]);
  mesh(group, new THREE.CylinderGeometry(0.069, 0.069, 0.072, 24), brass,
    [-0.971, 0.81, 0], [0, 0, Math.PI / 2]);
  mesh(group, new THREE.CircleGeometry(0.056, 24), cream, [-1.009, 0.81, 0], [0, -Math.PI / 2, 0]);
  for (const z of [-0.202, 0.202])
    tube(group, [[-0.83, 0.75, z], [-0.6, 0.8, z], [-0.04, 0.8, z]], 0.012, brass);
  // Cab has actual separate pillars and inset panes rather than painted windows.
  box(group, [0.58, 0.39, 0.54], red, [0.52, 0.625, 0], 0.018);
  box(group, [0.54, 0.035, 0.52], cream, [0.52, 0.83, 0], 0.006);
  for (const z of [-0.258, 0.258]) {
    box(group, [0.46, 0.215, 0.02], window, [0.52, 0.952, z], 0.008);
    for (const x of [0.28, 0.52, 0.76])
      box(group, [0.022, 0.25, 0.029], red, [x, 0.954, z], 0.004);
    box(group, [0.5, 0.023, 0.032], red, [0.52, 1.07, z], 0.004);
    box(group, [0.15, 0.038, 0.036], iron, [0.67, 0.47, z * 1.2], 0.005);
    tube(group, [[0.73, 0.59, z * 1.1], [0.73, 0.78, z * 1.1]], 0.009, brass, 4);
  }
  box(group, [0.025, 0.22, 0.44], window, [0.8, 0.945, 0], 0.006);
  box(group, [0.7, 0.068, 0.66], iron, [0.52, 1.117, 0], 0.05);
  for (const z of [-0.2, 0.2])
    box(group, [0.13, 0.065, 0.08], iron, [-0.98, 0.395, z], 0.008);
  const badge = canvasTexture(512, 256, ctx => {
    ctx.fillStyle = '#aa2925'; ctx.fillRect(0, 0, 512, 256);
    ctx.strokeStyle = '#e8cc8c'; ctx.lineWidth = 7; ctx.strokeRect(14, 14, 484, 228);
    ctx.fillStyle = '#f1dfb6'; ctx.textAlign = 'center';
    ctx.font = 'bold 77px serif'; ctx.fillText('阿里山', 256, 108);
    ctx.font = '39px serif'; ctx.fillText('ALISHAN · 28', 256, 190);
  });
  const badgeMaterial = new THREE.MeshStandardMaterial({ map: badge, roughness: 0.6 });
  for (const side of [-1, 1])
    mesh(group, new THREE.PlaneGeometry(0.37, 0.185), badgeMaterial,
      [0.52, 0.655, side * 0.277], [0, side < 0 ? Math.PI : 0, 0]);
  return group;
}

export function createFlipFlops(): THREE.Group {
  const pair = new THREE.Group();
  pair.name = 'Taiwan blue and white rubber slippers';
  const rubberTexture = canvasTexture(256, 256, ctx => {
    ctx.fillStyle = '#2260ac'; ctx.fillRect(0, 0, 256, 256);
    for (let y = 0; y < 256; y += 8) for (let x = 0; x < 256; x += 8) {
      ctx.fillStyle = '#3473bd'; ctx.beginPath(); ctx.arc(x + (y % 16 ? 4 : 0), y, 1.1, 0, Math.PI * 2); ctx.fill();
    }
  });
  rubberTexture.wrapS = rubberTexture.wrapT = THREE.RepeatWrapping;
  rubberTexture.repeat.set(3, 6);
  const blue = new THREE.MeshStandardMaterial({ color: '#ffffff', map: rubberTexture, roughness: 0.93 });
  const edge = clay('#123c77', 0.85);
  const white = clay('#f3efe5', 0.76);
  for (const side of [-1, 1]) {
    const foot = new THREE.Group();
    const sole = new THREE.Shape();
    sole.moveTo(-0.25, -0.72);
    sole.bezierCurveTo(-0.38, -0.68, -0.32, -0.28, -0.3, 0.04);
    sole.bezierCurveTo(-0.43, 0.36, -0.39, 0.76, -0.18, 0.84);
    sole.bezierCurveTo(0.05, 0.99, 0.35, 0.88, 0.36, 0.64);
    sole.bezierCurveTo(0.4, 0.28, 0.22, 0.07, 0.25, -0.21);
    sole.bezierCurveTo(0.31, -0.5, 0.33, -0.72, 0.16, -0.77);
    sole.bezierCurveTo(0.02, -0.82, -0.17, -0.8, -0.25, -0.72);
    const base = new THREE.ExtrudeGeometry(sole, { depth: 0.065, bevelEnabled: true,
      bevelSize: 0.014, bevelThickness: 0.012, bevelSegments: 3, curveSegments: 28 });
    base.rotateX(-Math.PI / 2);
    mesh(foot, base, edge, [0, 0.025, 0]);
    const upper = new THREE.ExtrudeGeometry(sole, { depth: 0.017, bevelEnabled: true,
      bevelSize: 0.011, bevelThickness: 0.01, bevelSegments: 3, curveSegments: 28 });
    upper.rotateX(-Math.PI / 2);
    mesh(foot, upper, blue, [0, 0.099, 0]);
    // Raised rubber straps arch above the footbed and meet the toe post.
    tube(foot, [[-0.275, 0.12, 0.02], [-0.23, 0.225, -0.08],
      [-0.13, 0.29, -0.29], [0.025, 0.22, -0.49]], 0.046, white);
    tube(foot, [[0.255, 0.12, 0.04], [0.22, 0.225, -0.09],
      [0.145, 0.29, -0.3], [0.025, 0.22, -0.49]], 0.046, white);
    mesh(foot, new THREE.CylinderGeometry(0.027, 0.033, 0.112, 16), white,
      [0.025, 0.164, -0.49]);
    for (const x of [-0.275, 0.255])
      mesh(foot, new THREE.SphereGeometry(0.049, 16, 10), white, [x, 0.112, 0.025]);
    // Heel emboss and edge tread are geometry, so they stay legible up close.
    for (let i = 0; i < 4; i++)
      box(foot, [0.2 - i * 0.018, 0.003, 0.01], edge, [0, 0.128, 0.48 + i * 0.035], 0.002);
    for (let i = 0; i < 13; i++) {
      const z = -0.59 + i * 0.095;
      for (const x of [-0.291, 0.27])
        box(foot, [0.014, 0.025, 0.033], blue, [x, 0.056, z], 0.003);
    }
    foot.position.x = side * 0.46;
    foot.rotation.y = side * 0.13;
    if (side < 0) foot.scale.x = -1;
    pair.add(foot);
  }
  pair.position.y = -0.013;
  return pair;
}

export function createMarketBag(): THREE.Group {
  const group = new THREE.Group();
  group.name = 'Taiwan striped woven market bag';
  const weave = canvasTexture(1024, 1024, ctx => {
    const colors = ['#b82f35', '#1c754b', '#2571a5', '#ded6b8'];
    for (let x = 0; x < 1024; x++) {
      ctx.fillStyle = colors[Math.floor(x / 64) % colors.length]; ctx.fillRect(x, 0, 1, 1024);
    }
    for (let y = 0; y < 1024; y += 5) {
      ctx.fillStyle = y % 10 ? 'rgba(255,255,232,.15)' : 'rgba(19,33,31,.19)';
      ctx.fillRect(0, y, 1024, 2);
    }
    for (let x = 0; x < 1024; x += 5) {
      ctx.fillStyle = 'rgba(255,249,214,.12)'; ctx.fillRect(x, 0, 1, 1024);
      for (let y = x % 10; y < 1024; y += 10) {
        ctx.fillStyle = 'rgba(20,33,30,.12)'; ctx.fillRect(x, y, 3, 3);
      }
    }
  });
  weave.wrapS = weave.wrapT = THREE.RepeatWrapping;
  weave.repeat.set(2, 1);
  const fabric = new THREE.MeshStandardMaterial({ map: weave, roughness: 0.92,
    side: THREE.DoubleSide });
  const trim = clay('#305d48', 0.84);
  const thread = clay('#dcd4b0', 0.96);
  const segments = 112;
  const rows = 24;
  const positions: number[] = [], uvs: number[] = [], indices: number[] = [];
  const ringPoint = (a: number, t: number) => {
    // A rounded rectangular section widens toward an irregular open rim.
    const ca = Math.cos(a), sa = Math.sin(a);
    const x = Math.sign(ca) * Math.pow(Math.abs(ca), 0.34) * (0.67 + t * 0.12);
    const z = Math.sign(sa) * Math.pow(Math.abs(sa), 0.5) * (0.24 + t * 0.085);
    const wrinkle = Math.sin(a * 9 + t * 4) * 0.013 * Math.sin(t * Math.PI);
    return new THREE.Vector3(x + wrinkle, 0.05 + t * 1.08 + t ** 4 *
      (0.027 * Math.sin(a * 3) - 0.035 * Math.abs(sa)), z + wrinkle * 0.6);
  };
  for (let r = 0; r <= rows; r++) for (let s = 0; s <= segments; s++) {
    const p = ringPoint(s / segments * Math.PI * 2, r / rows);
    positions.push(p.x, p.y, p.z); uvs.push(s / segments, r / rows);
    if (r < rows && s < segments) {
      const i = r * (segments + 1) + s;
      indices.push(i, i + 1, i + segments + 1, i + 1, i + segments + 2, i + segments + 1);
    }
  }
  const shell = new THREE.BufferGeometry();
  shell.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  shell.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  shell.setIndex(indices); shell.computeVertexNormals();
  mesh(group, shell, fabric, [0, 0, 0]);
  box(group, [1.34, 0.035, 0.48], fabric, [0, 0.045, 0], 0.075);
  const rim: [number, number, number][] = [];
  const bottom: [number, number, number][] = [];
  for (let i = 0; i <= segments; i++) {
    const p = ringPoint(i / segments * Math.PI * 2, 1);
    rim.push([p.x, p.y, p.z]);
    const b = ringPoint(i / segments * Math.PI * 2, 0);
    bottom.push([b.x, b.y, b.z]);
  }
  tube(group, rim, 0.014, trim, 112);
  tube(group, bottom, 0.012, trim, 112);
  for (const a of [0, Math.PI]) {
    const seam: [number, number, number][] = [];
    for (let r = 0; r <= rows; r++) {
      const p = ringPoint(a, r / rows); seam.push([p.x, p.y, p.z]);
    }
    tube(group, seam, 0.009, trim, 24);
  }
  for (const side of [-1, 1]) {
    const z = side * 0.321;
    // Two stitched straps, with flattened cross section and short attachment tails.
    const path = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.37, 0.99, z), new THREE.Vector3(-0.37, 1.31, z),
      new THREE.Vector3(-0.25, 1.65, z * 0.88), new THREE.Vector3(0, 1.76, z * 0.82),
      new THREE.Vector3(0.25, 1.65, z * 0.88), new THREE.Vector3(0.37, 1.31, z),
      new THREE.Vector3(0.37, 0.99, z),
    ]);
    const handlePositions: number[] = [], handleUVs: number[] = [], handleIndices: number[] = [];
    const steps = 64;
    for (let i = 0; i <= steps; i++) {
      const p = path.getPoint(i / steps), tangent = path.getTangent(i / steps);
      const across = new THREE.Vector3(-tangent.y, tangent.x, 0).normalize().multiplyScalar(0.027);
      for (const sign of [-1, 1]) {
        const v = p.clone().addScaledVector(across, sign);
        handlePositions.push(v.x, v.y, v.z);
        handleUVs.push(sign < 0 ? 0.02 : 0.065, i / steps);
      }
      if (i < steps) {
        const j = i * 2; handleIndices.push(j, j + 1, j + 2, j + 1, j + 3, j + 2);
      }
    }
    const handle = new THREE.BufferGeometry();
    handle.setAttribute('position', new THREE.Float32BufferAttribute(handlePositions, 3));
    handle.setAttribute('uv', new THREE.Float32BufferAttribute(handleUVs, 2));
    handle.setIndex(handleIndices); handle.computeVertexNormals();
    mesh(group, handle, fabric, [0, 0, 0]);
    for (const x of [-0.37, 0.37]) {
      box(group, [0.069, 0.16, 0.009], trim, [x, 1.005, z], 0.006);
      for (let i = 0; i < 7; i++) {
        for (const dx of [-0.022, 0.022])
          box(group, [0.004, 0.008, 0.004], thread,
            [x + dx, 0.951 + i * 0.019, z + side * 0.008], 0.001);
      }
    }
  }
  group.position.y = -0.0275;
  return group;
}
