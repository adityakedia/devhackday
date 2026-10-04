import * as THREE from 'three';

// Original souvenir-scale interpretations, with locally drawn surface maps.
const TAU = Math.PI * 2;
const mat = (color: string, roughness = 0.75, metalness = 0) =>
  new THREE.MeshStandardMaterial({ color, roughness, metalness });

function add(group: THREE.Group, geometry: THREE.BufferGeometry, material: THREE.Material,
  x = 0, y = 0, z = 0) {
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(x, y, z); mesh.castShadow = mesh.receiveShadow = true;
  group.add(mesh); return mesh;
}

function box(group: THREE.Group, w: number, h: number, d: number, material: THREE.Material,
  x: number, y: number, z: number) {
  return add(group, new THREE.BoxGeometry(w, h, d), material, x, y, z);
}

function tube(group: THREE.Group, points: THREE.Vector3[], radius: number, material: THREE.Material) {
  return add(group, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), 24, radius, 6), material);
}

function map(draw: (ctx: CanvasRenderingContext2D) => void) {
  const canvas = document.createElement('canvas'); canvas.width = canvas.height = 512;
  draw(canvas.getContext('2d')!);
  const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8; return texture;
}

function finish(group: THREE.Group) {
  const bounds = new THREE.Box3().setFromObject(group), size = bounds.getSize(new THREE.Vector3());
  const center = bounds.getCenter(new THREE.Vector3()), scale = 2 / Math.max(size.x, size.y, size.z);
  group.scale.setScalar(scale); group.position.set(-center.x * scale, -bounds.min.y * scale, -center.z * scale);
  return group;
}

function stone(color: string) {
  const texture = map(ctx => {
    ctx.fillStyle = color; ctx.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 10000; i++) {
      ctx.fillStyle = i % 2 ? 'rgba(255,255,235,.12)' : 'rgba(70,48,24,.09)';
      ctx.fillRect((i * 137) % 512, (i * 73) % 512, 1 + i % 3, 1);
    }
  });
  return new THREE.MeshStandardMaterial({ map: texture, bumpMap: texture, bumpScale: 0.005, roughness: 0.91 });
}

function plaque(group: THREE.Group, title: string, width: number, y: number, z: number) {
  const texture = map(ctx => {
    ctx.fillStyle = '#293d37'; ctx.fillRect(0, 0, 512, 512);
    ctx.strokeStyle = '#cab68c'; ctx.lineWidth = 6; ctx.strokeRect(14, 166, 484, 180);
    ctx.fillStyle = '#ead8ae'; ctx.font = 'bold 36px serif'; ctx.textAlign = 'center';
    ctx.fillText(title, 256, 265); ctx.font = '18px sans-serif'; ctx.fillText('TAIWAN · ISLAND KEEPSAKES', 256, 309);
  });
  const geometry = new THREE.PlaneGeometry(width, width * 0.22);
  const uv = geometry.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setY(i, 0.31 + uv.getY(i) * 0.38);
  add(group, geometry, new THREE.MeshStandardMaterial({ map: texture, roughness: 0.65, metalness: 0.3 }), 0, y, z);
}

function arch(w: number, h: number) {
  const shape = new THREE.Shape(); shape.moveTo(-w / 2, 0); shape.lineTo(w / 2, 0);
  shape.lineTo(w / 2, h - w / 2); shape.absarc(0, h - w / 2, w / 2, 0, Math.PI, false);
  shape.lineTo(-w / 2, 0); return shape;
}

function archFrame(group: THREE.Group, w: number, h: number, thickness: number,
  material: THREE.Material, x: number, y: number, z: number) {
  const shape = arch(w, h), opening = arch(w - thickness * 2, h - thickness);
  const hole = new THREE.Path(opening.getPoints(24).map(point => new THREE.Vector2(point.x, point.y + thickness)));
  shape.holes.push(hole);
  return add(group, new THREE.ExtrudeGeometry(shape, { depth: 0.035, bevelEnabled: false, curveSegments: 24 }), material, x, y, z);
}

// Rings with an explicit underside make a curved octagonal eave, rather than a cone.
function octagonalRoof(group: THREE.Group, radius: number, height: number, y: number,
  material: THREE.Material, trim: THREE.Material) {
  const positions: number[] = [], uv: number[] = [], indices: number[] = [];
  const rings = 12, sides = 64;
  const sample = (t: number, a: number) => {
    const sector = ((a + Math.PI / 8) % (Math.PI / 4)) - Math.PI / 8;
    const r = radius * (0.19 + 0.81 * t) * Math.cos(Math.PI / 8) / Math.cos(sector);
    const corner = Math.pow(Math.abs(sector) / (Math.PI / 8), 5);
    return new THREE.Vector3(Math.sin(a) * r, y + height * Math.pow(1 - t, 1.8) + 0.055 * corner * t ** 5, Math.cos(a) * r);
  };
  for (let j = 0; j <= rings; j++) for (let i = 0; i <= sides; i++) {
    const p = sample(j / rings, i / sides * TAU); positions.push(p.x, p.y, p.z); uv.push(i / sides * 8, j / rings);
  }
  for (let j = 0; j < rings; j++) for (let i = 0; i < sides; i++) {
    const a = j * (sides + 1) + i; indices.push(a, a + sides + 1, a + 1, a + 1, a + sides + 1, a + sides + 2);
  }
  const geometry = new THREE.BufferGeometry(); geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); geometry.setIndex(indices); geometry.computeVertexNormals();
  add(group, geometry, material);
  add(group, new THREE.CylinderGeometry(radius * 0.92, radius * 0.92, 0.03, 8), trim, 0, y - 0.018);
  for (let i = 0; i < 8; i++) {
    const angle = i / 8 * TAU + Math.PI / 8;
    tube(group, Array.from({ length: 13 }, (_, j) => sample(j / 12, angle).add(new THREE.Vector3(0, 0.01, 0))), 0.009, trim);
  }
}

export function createMemorialHall(): THREE.Group {
  const group = new THREE.Group(); group.name = 'Taipei white memorial hall miniature';
  const ivory = stone('#e9e4d8'), shadow = mat('#3a4248'), gold = mat('#c6a05f', 0.33, 0.65);
  const tile = map(ctx => {
    ctx.fillStyle = '#24466f'; ctx.fillRect(0, 0, 512, 512);
    for (let row = 0; row < 28; row++) for (let col = 0; col < 10; col++) {
      const x = col * 51.2, y = row * 18.3;
      ctx.fillStyle = (row + col) % 3 ? '#315982' : '#25446a'; ctx.fillRect(x + 2, y + 1, 47, 16);
      ctx.strokeStyle = '#5c7ea0'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x + 4, y + 2); ctx.lineTo(x + 4, y + 16); ctx.stroke();
    }
  }); tile.wrapS = THREE.RepeatWrapping;
  const blue = new THREE.MeshStandardMaterial({ map: tile, bumpMap: tile, bumpScale: 0.003, roughness: 0.39, metalness: 0.08, side: THREE.DoubleSide });
  box(group, 1.74, 0.08, 1.8, ivory, 0, 0.04, 0.12);
  for (let i = 0; i < 3; i++) box(group, 1.44 - i * 0.10, 0.08, 1.28 - i * 0.07, ivory, 0, 0.12 + i * 0.08, -0.12);
  box(group, 0.99, 0.57, 0.91, ivory, 0, 0.605, -0.19);
  box(group, 1.08, 0.06, 1.0, ivory, 0, 0.92, -0.19);
  const roofs = new THREE.Group(); roofs.position.z = -0.19; group.add(roofs);
  octagonalRoof(roofs, 0.80, 0.31, 0.98, blue, mat('#294e79', 0.45));
  octagonalRoof(roofs, 0.59, 0.29, 1.26, blue, mat('#294e79', 0.45));
  add(group, new THREE.CylinderGeometry(0.08, 0.10, 0.05, 8), gold, 0, 1.58, -0.19);
  add(group, new THREE.SphereGeometry(0.04, 20, 12), gold, 0, 1.64, -0.19);
  add(group, new THREE.ConeGeometry(0.022, 0.1, 16), gold, 0, 1.7, -0.19);
  add(group, new THREE.ShapeGeometry(arch(0.34, 0.44), 24), shadow, 0, 0.325, 0.268);
  archFrame(group, 0.44, 0.5, 0.04, ivory, 0, 0.32, 0.27);
  for (const x of [-0.40, -0.29, 0.29, 0.40]) box(group, 0.034, 0.49, 0.035, ivory, x, 0.59, 0.281);
  for (let i = 0; i < 18; i++) box(group, 0.54, 0.015, 0.62 - i * 0.029, ivory, 0, 0.087 + i * 0.013, 0.58 - i * 0.0145);
  for (const x of [-0.33, 0.33]) {
    tube(group, [new THREE.Vector3(x, 0.10, 0.88), new THREE.Vector3(x, 0.22, 0.63), new THREE.Vector3(x, 0.36, 0.37)], 0.016, ivory);
    for (let i = 0; i < 7; i++) box(group, 0.023, 0.06, 0.023, ivory, x, 0.14 + i * 0.034, 0.84 - i * 0.071);
  }
  plaque(group, 'TAIPEI · MEMORIAL HALL', 0.72, 0.046, 1.025);
  return finish(group);
}

export function createFortSanDomingo(): THREE.Group {
  const group = new THREE.Group(); group.name = 'Tamsui red fort miniature';
  const brickMap = map(ctx => {
    ctx.fillStyle = '#c0987f'; ctx.fillRect(0, 0, 512, 512);
    for (let row = 0; row < 24; row++) for (let col = -1; col < 9; col++) {
      const x = col * 64 + (row % 2) * 32, y = row * 21.34;
      ctx.fillStyle = ['#a64531', '#b04e37', '#98432f', '#b6593f'][(row * 7 + col + 9) % 4];
      ctx.fillRect(x + 1.6, y + 1.2, 61, 19);
      ctx.fillStyle = 'rgba(244,180,129,.15)'; ctx.fillRect(x + 3, y + 2, 58, 2);
    }
    for (let i = 0; i < 4000; i++) { ctx.fillStyle = 'rgba(59,25,14,.13)'; ctx.fillRect((i * 73) % 512, (i * 137) % 512, 2, 1); }
  });
  const brick = new THREE.MeshStandardMaterial({ map: brickMap, bumpMap: brickMap, bumpScale: 0.007, roughness: 0.88 });
  const coping = mat('#c37655'), dark = mat('#2c2523'), cream = stone('#d6b99a');
  box(group, 1.85, 0.09, 1.50, stone('#aaa38c'), 0, 0.045, 0);
  box(group, 1.30, 0.88, 1.06, brick, 0, 0.53, -0.05);
  box(group, 1.22, 0.04, 0.99, dark, 0, 0.98, -0.05);
  for (const side of [-1, 1]) {
    box(group, 1.38, 0.12, 0.095, brick, 0, 1.025, side * 0.55 - 0.05);
    box(group, 0.095, 0.12, 1.1, brick, side * 0.66, 1.025, -0.05);
    for (let i = 0; i < 8; i++) box(group, 0.095, 0.11, 0.105, brick, -0.60 + i * 0.17, 1.13, side * 0.55 - 0.05);
    for (let i = 0; i < 6; i++) box(group, 0.105, 0.11, 0.095, brick, side * 0.66, 1.13, -0.51 + i * 0.185);
  }
  for (const x of [-0.64, 0.64]) for (const z of [-0.55, 0.45]) {
    box(group, 0.22, 0.27, 0.22, brick, x, 1.055, z);
    box(group, 0.24, 0.035, 0.24, coping, x, 1.20, z);
  }
  for (const x of [-0.42, 0.0, 0.42]) {
    const w = x === 0 ? 0.21 : 0.17, h = x === 0 ? 0.40 : 0.28, bottom = x === 0 ? 0.09 : 0.37;
    add(group, new THREE.ShapeGeometry(arch(w, h)), dark, x, bottom, 0.483);
    archFrame(group, w + 0.06, h + 0.035, 0.03, cream, x, bottom, 0.485);
    if (x !== 0) for (let i = -1; i <= 1; i++) box(group, 0.008, 0.23, 0.007, mat('#51493c', 0.6, 0.3), x + i * 0.045, 0.49, 0.524);
  }
  for (const side of [-1, 1]) for (const z of [-0.34, 0.12]) {
    const inset = add(group, new THREE.ShapeGeometry(arch(0.15, 0.26)), dark, side * 0.652, 0.39, z);
    inset.rotation.y = side * Math.PI / 2;
    const frame = archFrame(group, 0.21, 0.29, 0.025, cream, side * 0.654, 0.39, z);
    frame.rotation.y = side * Math.PI / 2;
  }
  for (let i = 0; i < 3; i++) box(group, 0.38, 0.025, 0.26 - i * 0.06, cream, 0, 0.1 + i * 0.025, 0.60 - i * 0.03);
  plaque(group, 'TAMSUI · RED FORT', 0.86, 0.048, 0.756);
  return finish(group);
}

export function createQueensHead(): THREE.Group {
  const group = new THREE.Group(); group.name = 'Yehliu Queen’s Head sandstone keepsake';
  const rockMap = map(ctx => {
    ctx.fillStyle = '#c6aa73'; ctx.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 14000; i++) {
      ctx.fillStyle = i % 3 ? 'rgba(74,55,26,.12)' : 'rgba(251,233,184,.25)';
      ctx.fillRect((i * 137) % 512, (i * 91) % 512, 1 + i % 3, 1);
    }
    for (let row = 0; row < 14; row++) for (let col = 0; col < 18; col++) {
      const x = col * 29 + (row % 2) * 14 + Math.sin(col * 7) * 6, y = row * 38 + Math.cos(col * 5 + row) * 8;
      const gradient = ctx.createRadialGradient(x, y, 1, x, y, 10);
      gradient.addColorStop(0, 'rgba(83,61,31,.50)'); gradient.addColorStop(0.65, 'rgba(104,80,40,.24)'); gradient.addColorStop(1, 'rgba(244,224,169,0)');
      ctx.fillStyle = gradient; ctx.beginPath(); ctx.ellipse(x, y, 9, 6 + col % 4, col, 0, TAU); ctx.fill();
    }
  });
  const sandstone = new THREE.MeshStandardMaterial({ map: rockMap, bumpMap: rockMap, bumpScale: 0.025, roughness: 0.98 });
  const positions: number[] = [], uvs: number[] = [], indices: number[] = [];
  // Each ring is a sculpted cross section: slender leaning neck and asymmetric crown.
  const profile = [
    [0, .50, .35, -.06], [.12, .39, .29, -.05], [.25, .28, .22, -.03], [.45, .20, .17, .01],
    [.70, .15, .14, .06], [.95, .14, .14, .09], [1.12, .19, .18, .10],
    [1.23, .33, .25, .10], [1.35, .48, .31, .03], [1.47, .51, .35, -.07],
    [1.61, .43, .33, -.12], [1.72, .29, .25, -.16], [1.79, .07, .08, -.17],
  ];
  const rings = 72, sides = 96;
  for (let j = 0; j <= rings; j++) {
    const p = j / rings * (profile.length - 1), section = Math.min(profile.length - 2, Math.floor(p)), t = p - section;
    const values = profile[section].map((v, k) => THREE.MathUtils.lerp(v, profile[section + 1][k], t));
    for (let i = 0; i <= sides; i++) {
      const a = i / sides * TAU, y = values[0];
      const wave = 1 + .028 * Math.sin(a * 7 + y * 12) + .019 * Math.cos(a * 13 - y * 8);
      const nose = y > 1.24 && y < 1.49 ? 0.09 * Math.exp(-(((a - Math.PI / 2) / .24) ** 2)) : 0;
      positions.push(values[3] + Math.sin(a) * values[1] * wave + nose, y + .12,
        Math.cos(a) * values[2] * wave);
      uvs.push(i / sides, j / rings);
    }
  }
  for (let j = 0; j < rings; j++) for (let i = 0; i < sides; i++) {
    const a = j * (sides + 1) + i; indices.push(a, a + 1, a + sides + 1, a + 1, a + sides + 2, a + sides + 1);
  }
  // Caps close the miniature for export; surface winding points outward.
  for (const row of [0, rings]) {
    const start = row * (sides + 1), center = positions.length / 3;
    positions.push(profile[row === 0 ? 0 : profile.length - 1][3], positions[start * 3 + 1], 0); uvs.push(.5, row / rings);
    for (let i = 0; i < sides; i++) if (row === 0) indices.push(center, start + i + 1, start + i);
    else indices.push(center, start + i, start + i + 1);
  }
  const geometry = new THREE.BufferGeometry(); geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2)); geometry.setIndex(indices); geometry.computeVertexNormals(); add(group, geometry, sandstone);
  const base = new THREE.CylinderGeometry(.72, .77, .12, 64, 3);
  const vertices = base.attributes.position;
  for (let i = 0; i < vertices.count; i++) {
    const a = Math.atan2(vertices.getZ(i), vertices.getX(i)), r = 1 + .045 * Math.sin(a * 7) + .025 * Math.cos(a * 11);
    vertices.setXYZ(i, vertices.getX(i) * r, vertices.getY(i), vertices.getZ(i) * r * .82);
  }
  base.computeVertexNormals(); add(group, base, sandstone, 0, .06);
  plaque(group, 'YEHLIU · QUEEN’S HEAD', .64, .056, .65);
  return finish(group);
}

function gateRoof(group: THREE.Group, width: number, depth: number, y: number,
  tile: THREE.Material, edge: THREE.Material) {
  const geometry = new THREE.PlaneGeometry(width, depth, 40, 24), p = geometry.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), z = p.getY(i), t = Math.abs(z) / (depth / 2);
    const lift = .105 * Math.pow(Math.abs(x) / (width / 2), 5) * t ** 3;
    p.setXYZ(i, x, y + .21 * (1 - t) ** 1.7 + lift, z);
  }
  // Plane's +Z becomes the roof's +Y; reverse index winding after remapping.
  const index = geometry.index!;
  for (let i = 0; i < index.count; i += 3) { const b = index.getX(i + 1); index.setX(i + 1, index.getX(i + 2)); index.setX(i + 2, b); }
  geometry.computeVertexNormals(); add(group, geometry, tile);
  for (const z of [-depth / 2, depth / 2]) tube(group,
    Array.from({ length: 25 }, (_, i) => { const x = (i / 24 - .5) * width; return new THREE.Vector3(x, y + .105 * (Math.abs(x) / (width / 2)) ** 5, z); }), .018, edge);
  tube(group, [new THREE.Vector3(-width / 2, y + .29, 0), new THREE.Vector3(-width * .3, y + .21, 0), new THREE.Vector3(width * .3, y + .21, 0), new THREE.Vector3(width / 2, y + .29, 0)], .022, edge);
}

export function createLongshanGate(): THREE.Group {
  const group = new THREE.Group(); group.name = 'Longshan temple inspired ceremonial gate';
  const granite = stone('#aca798'), red = mat('#983a2c', .51), green = mat('#395c4d', .39), ochre = mat('#c3a066', .49), brick = mat('#a96040');
  const tiles = map(ctx => {
    ctx.fillStyle = '#405e4a'; ctx.fillRect(0, 0, 512, 512);
    for (let x = 0; x < 512; x += 19) for (let y = 0; y < 512; y += 34) {
      ctx.fillStyle = (x + y) % 3 ? '#57735b' : '#365340'; ctx.fillRect(x + 2, y + 2, 15, 31);
      ctx.strokeStyle = '#7f8d66'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x + 4, y + 3); ctx.lineTo(x + 4, y + 30); ctx.stroke();
    }
  });
  const tileMaterial = new THREE.MeshStandardMaterial({ map: tiles, bumpMap: tiles, bumpScale: .006, roughness: .49, side: THREE.DoubleSide });
  box(group, 2.0, .1, 1.05, granite, 0, .05, 0);
  box(group, 1.85, .06, .87, granite, 0, .13, -.02);
  for (const x of [-.81, -.30, .30, .81]) for (const z of [-.22, .22]) {
    box(group, .13, .12, .13, granite, x, .22, z);
    add(group, new THREE.CylinderGeometry(.04, .048, .67, 20), red, x, .60, z);
    add(group, new THREE.CylinderGeometry(.069, .056, .05, 20), ochre, x, .95, z);
    box(group, .16, .07, .13, green, x, 1.0, z);
    for (const direction of [-1, 1]) {
      const bracket = box(group, .12, .03, .055, ochre, x + direction * .045, .97, z + direction * .065);
      bracket.rotation.z = direction * .26;
    }
  }
  box(group, 1.84, .10, .52, red, 0, 1.02, 0);
  for (let i = 0; i < 18; i++) box(group, .055, .055, .62, ochre, -.85 + i * .1, 1.08, 0);
  gateRoof(group, 1.99, .82, 1.13, tileMaterial, brick);
  box(group, .83, .20, .45, red, 0, 1.38, 0);
  gateRoof(group, 1.16, .70, 1.50, tileMaterial, brick);
  // Stylized paired ridge dragons, sculpted as curled bodies with horns and fins.
  for (const side of [-1, 1]) {
    tube(group, [new THREE.Vector3(side * .46, 1.81, 0), new THREE.Vector3(side * .32, 1.90, 0), new THREE.Vector3(side * .22, 1.82, 0), new THREE.Vector3(side * .11, 1.90, 0)], .026, ochre);
    const head = add(group, new THREE.SphereGeometry(.047, 16, 12), green, side * .10, 1.91, 0); head.scale.set(1.35, .8, .72);
    for (let i = 0; i < 4; i++) {
      const fin = add(group, new THREE.ConeGeometry(.017, .065, 4), ochre, side * (.21 + i * .055), 1.91 + Math.sin(i) * .035, 0);
      fin.rotation.z = side * .45;
    }
    tube(group, [new THREE.Vector3(side * .1, 1.94, -.022), new THREE.Vector3(side * .14, 1.985, -.027)], .006, ochre);
  }
  add(group, new THREE.SphereGeometry(.04, 20, 12), mat('#c86a41', .42), 0, 1.89, 0);
  const nameMap = map(ctx => {
    ctx.fillStyle = '#213c33'; ctx.fillRect(0, 0, 512, 512); ctx.strokeStyle = '#c8a56d'; ctx.lineWidth = 9; ctx.strokeRect(12, 145, 488, 216);
    ctx.fillStyle = '#e4c892'; ctx.font = 'bold 108px "Kaiti TC", "STKaiti", serif'; ctx.textAlign = 'center'; ctx.fillText('龍山寺', 256, 295);
  });
  const sign = new THREE.PlaneGeometry(.52, .20), uv = sign.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setY(i, .28 + uv.getY(i) * .43);
  add(group, sign, new THREE.MeshStandardMaterial({ map: nameMap, roughness: .68 }), 0, 1.39, .228);
  for (const side of [-1, 1]) {
    add(group, new THREE.CylinderGeometry(.036, .036, .10, 12), red, side * .50, .83, .29);
    add(group, new THREE.TorusGeometry(.036, .006, 6, 16), ochre, side * .50, .83, .29).rotation.x = Math.PI / 2;
  }
  plaque(group, 'LONGSHAN · TEMPLE GATE', .82, .049, .532);
  return finish(group);
}
