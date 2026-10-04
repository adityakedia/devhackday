import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

// Original travel miniatures. All illustration and surface maps are drawn locally.
const material = (color: THREE.ColorRepresentation, roughness = 0.5, metalness = 0) =>
  new THREE.MeshStandardMaterial({ color, roughness, metalness });

function add(group: THREE.Group, geometry: THREE.BufferGeometry, mat: THREE.Material | THREE.Material[],
  x: number, y: number, z: number, rotation?: [number, number, number]) {
  const object = new THREE.Mesh(geometry, mat);
  object.position.set(x, y, z);
  if (rotation) object.rotation.set(...rotation);
  object.castShadow = object.receiveShadow = true;
  group.add(object);
  return object;
}

function block(group: THREE.Group, size: [number, number, number], mat: THREE.Material,
  x: number, y: number, z: number, radius = 0.02) {
  return add(group, new RoundedBoxGeometry(...size, 3, radius), mat, x, y, z);
}

function line(group: THREE.Group, points: [number, number, number][], radius: number, mat: THREE.Material) {
  return add(group, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(
    points.map(p => new THREE.Vector3(...p))), 24, radius, 8, false), mat, 0, 0, 0);
}

function texture(width: number, height: number, draw: (ctx: CanvasRenderingContext2D) => void) {
  const canvas = document.createElement('canvas');
  canvas.width = width; canvas.height = height;
  draw(canvas.getContext('2d')!);
  const map = new THREE.CanvasTexture(canvas);
  map.colorSpace = THREE.SRGBColorSpace; map.anisotropy = 8;
  return map;
}

function finish(group: THREE.Group) {
  const bounds = new THREE.Box3().setFromObject(group);
  const size = bounds.getSize(new THREE.Vector3());
  const scale = 2 / Math.max(size.x, size.y, size.z);
  const center = bounds.getCenter(new THREE.Vector3());
  group.position.set(-center.x * scale, -bounds.min.y * scale, -center.z * scale);
  group.scale.setScalar(scale);
  return group;
}

export function createTaipeiTower(): THREE.Group {
  const group = new THREE.Group(); group.name = 'Taipei tiered glass tower miniature';
  const silver = material('#6a9690', 0.29, 0.8);
  const stone = material('#b6b7a4', 0.76);
  const windows = texture(512, 512, ctx => {
    ctx.fillStyle = '#477d79'; ctx.fillRect(0, 0, 512, 512);
    for (let row = 0; row < 10; row++) for (let col = 0; col < 12; col++) {
      const hue = 112 + (row * 13 + col * 7) % 43;
      ctx.fillStyle = `rgb(${Math.floor(hue * 0.56)},${hue},${Math.floor(hue * 0.93)})`;
      ctx.fillRect(col * 42.67 + 3, row * 51.2 + 3, 37, 45);
      ctx.fillStyle = 'rgba(214,240,219,.21)';
      ctx.fillRect(col * 42.67 + 5, row * 51.2 + 4, 2, 43);
    }
    ctx.strokeStyle = '#aac1a6'; ctx.lineWidth = 3;
    for (let x = 0; x <= 512; x += 42.67) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 512); ctx.stroke(); }
    for (let y = 0; y <= 512; y += 51.2) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(512, y); ctx.stroke(); }
  });
  windows.wrapS = THREE.RepeatWrapping; windows.repeat.x = 4;
  const glass = new THREE.MeshPhysicalMaterial({ map: windows, metalness: 0.45,
    roughness: 0.23, clearcoat: 0.85, clearcoatRoughness: 0.17 });
  block(group, [0.83, 0.075, 0.83], stone, 0, 0.0375, 0, 0.012);
  block(group, [0.68, 0.065, 0.68], stone, 0, 0.108, 0, 0.009);
  block(group, [0.53, 0.25, 0.53], glass, 0, 0.265, 0, 0.008);
  for (let i = 0; i < 8; i++) {
    const y = 0.39 + i * 0.179;
    const width = 0.47 - i * 0.013;
    // Flat shaded four-sided frusta produce the characteristic outward flare.
    const tier = new THREE.CylinderGeometry(width / Math.SQRT2, (width - 0.058) / Math.SQRT2,
      0.169, 4, 1, false);
    tier.rotateY(Math.PI / 4);
    add(group, tier, glass, 0, y + 0.0845, 0);
    block(group, [width + 0.015, 0.018, width + 0.015], silver, 0, y + 0.168, 0, 0.003);
    for (const x of [-1, 1]) for (const z of [-1, 1]) {
      line(group, [[x * (width - 0.058) / 2, y, z * (width - 0.058) / 2],
        [x * width / 2, y + 0.169, z * width / 2]], 0.006, silver);
    }
  }
  block(group, [0.235, 0.135, 0.235], glass, 0, 1.89, 0, 0.007);
  block(group, [0.16, 0.085, 0.16], silver, 0, 2.0, 0, 0.007);
  add(group, new THREE.CylinderGeometry(0.018, 0.041, 0.24, 12), silver, 0, 2.145, 0);
  add(group, new THREE.ConeGeometry(0.017, 0.16, 12), silver, 0, 2.34, 0);
  for (let i = 0; i < 4; i++) {
    const a = i * Math.PI / 2;
    add(group, new THREE.TorusGeometry(0.035, 0.006, 8, 24), silver,
      Math.sin(a) * 0.269, 0.302, Math.cos(a) * 0.269, [0, a, 0]);
  }
  return finish(group);
}

export function createScooter(): THREE.Group {
  const group = new THREE.Group(); group.name = 'Jade city scooter miniature';
  const paint = new THREE.MeshPhysicalMaterial({ color: '#548d80', roughness: 0.28,
    metalness: 0.35, clearcoat: 1, clearcoatRoughness: 0.2 });
  const dark = material('#222e2e', 0.78), chrome = material('#bac4ba', 0.23, 0.85);
  const tire = material('#202321', 0.96), red = material('#ae372b', 0.24);
  const seatMap = texture(512, 256, ctx => {
    ctx.fillStyle = '#473d32'; ctx.fillRect(0, 0, 512, 256);
    for (let i = 0; i < 7000; i++) {
      ctx.fillStyle = i % 2 ? 'rgba(0,0,0,.14)' : 'rgba(229,209,180,.12)';
      ctx.fillRect((i * 73) % 512, (i * 31) % 256, 2, 1);
    }
    ctx.strokeStyle = '#b69e77'; ctx.lineWidth = 3; ctx.setLineDash([7, 5]);
    ctx.strokeRect(16, 16, 480, 224);
  });
  const seat = new THREE.MeshStandardMaterial({ map: seatMap, roughness: 0.86, bumpMap: seatMap, bumpScale: 0.004 });
  for (const x of [-0.65, 0.64]) {
    add(group, new THREE.TorusGeometry(0.224, 0.071, 12, 40), tire, x, 0.295, 0);
    add(group, new THREE.CylinderGeometry(0.163, 0.163, 0.14, 32), chrome, x, 0.295, 0, [Math.PI / 2, 0, 0]);
    add(group, new THREE.CylinderGeometry(0.092, 0.092, 0.148, 24), dark, x, 0.295, 0, [Math.PI / 2, 0, 0]);
    const tread = new THREE.InstancedMesh(new THREE.BoxGeometry(0.035, 0.007, 0.091), dark, 40);
    const dummy = new THREE.Object3D();
    for (let i = 0; i < 40; i++) {
      const a = i / 40 * Math.PI * 2;
      dummy.position.set(x + Math.sin(a) * 0.294, 0.295 + Math.cos(a) * 0.294, 0);
      dummy.rotation.set(0, 0, -a); dummy.updateMatrix(); tread.setMatrixAt(i, dummy.matrix);
    }
    tread.castShadow = true; group.add(tread);
    for (const side of [-1, 1]) {
      add(group, new THREE.CylinderGeometry(0.027, 0.027, 0.018, 16), chrome,
        x, 0.295, side * 0.085, [Math.PI / 2, 0, 0]);
      for (let i = 0; i < 6; i++) {
        const a = i * Math.PI / 3;
        add(group, new THREE.SphereGeometry(0.008, 8, 6), chrome,
          x + Math.cos(a) * 0.071, 0.295 + Math.sin(a) * 0.071, side * 0.079);
      }
    }
  }
  block(group, [0.69, 0.36, 0.43], paint, -0.48, 0.645, 0, 0.12);
  block(group, [0.81, 0.1, 0.45], seat, -0.37, 0.882, 0, 0.045);
  block(group, [0.64, 0.045, 0.42], dark, 0.14, 0.415, 0, 0.018);
  for (let i = 0; i < 8; i++) block(group, [0.013, 0.004, 0.33], chrome, -0.09 + i * 0.064, 0.44, 0, 0.001);
  const front = block(group, [0.17, 0.66, 0.41], paint, 0.53, 0.74, 0, 0.07); front.rotation.z = -0.17;
  block(group, [0.44, 0.1, 0.28], paint, 0.64, 0.62, 0, 0.045);
  for (const side of [-1, 1]) line(group, [[0.64, 0.295, side * 0.10],
    [0.57, 0.62, side * 0.10], [0.53, 0.90, side * 0.10]], 0.025, chrome);
  block(group, [0.18, 0.17, 0.45], paint, 0.54, 1.10, 0, 0.065);
  const headlight = material('#fff1ce', 0.17, 0.2);
  add(group, new THREE.CylinderGeometry(0.073, 0.083, 0.03, 32), chrome, 0.637, 1.11, 0, [0, 0, -Math.PI / 2]);
  add(group, new THREE.CircleGeometry(0.066, 32), headlight, 0.655, 1.11, 0, [0, Math.PI / 2, 0]);
  block(group, [0.02, 0.082, 0.20], red, -0.842, 0.72, 0, 0.012);
  block(group, [0.025, 0.10, 0.16], material('#efe7d5'), -0.841, 0.577, 0, 0.006);
  for (const side of [-1, 1]) {
    line(group, [[0.52, 1.105, 0], [0.43, 1.10, side * 0.30]], 0.018, chrome);
    block(group, [0.075, 0.044, 0.14], dark, 0.43, 1.10, side * 0.31, 0.018);
    line(group, [[0.49, 1.13, side * 0.24], [0.51, 1.32, side * 0.32], [0.54, 1.39, side * 0.37]], 0.009, chrome);
    const mirror = add(group, new THREE.SphereGeometry(1, 24, 12), chrome, 0.54, 1.4, side * 0.37);
    mirror.scale.set(0.025, 0.066, 0.091);
    line(group, [[-0.68, 0.49, side * 0.17], [-0.49, 0.61, side * 0.17]], 0.025, dark);
  }
  line(group, [[-0.11, 0.43, 0.16], [-0.20, 0.04, 0.26], [-0.28, 0.028, 0.26]], 0.015, chrome);
  line(group, [[-0.73, 0.96, -0.19], [-0.81, 0.99, 0], [-0.73, 0.96, 0.19]], 0.018, chrome);
  block(group, [0.37, 0.083, 0.1], chrome, -0.59, 0.39, 0.23, 0.035);
  return finish(group);
}

export function createCamera(): THREE.Group {
  const group = new THREE.Group(); group.name = 'Island journeys film camera';
  const brushed = texture(512, 256, ctx => {
    ctx.fillStyle = '#b9bbac'; ctx.fillRect(0, 0, 512, 256);
    for (let y = 0; y < 256; y++) {
      ctx.fillStyle = y % 3 ? 'rgba(255,255,245,.15)' : 'rgba(52,56,50,.15)';
      ctx.fillRect(0, y, 512, 1);
    }
  });
  const metal = new THREE.MeshStandardMaterial({ map: brushed, metalness: 0.82, roughness: 0.35 });
  const leatherMap = texture(512, 512, ctx => {
    ctx.fillStyle = '#263c34'; ctx.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 17000; i++) {
      ctx.fillStyle = i % 2 ? 'rgba(5,12,9,.25)' : 'rgba(118,136,101,.18)';
      ctx.beginPath(); ctx.ellipse((i * 131) % 512, (i * 73) % 512, 1.7, 0.8, i, 0, Math.PI * 2); ctx.fill();
    }
  });
  const leather = new THREE.MeshStandardMaterial({ map: leatherMap, bumpMap: leatherMap, bumpScale: 0.008, roughness: 0.85 });
  const black = material('#202722', 0.5, 0.3), gold = material('#b7a575', 0.35, 0.65);
  block(group, [1.65, 0.83, 0.57], metal, 0, 0.47, 0, 0.06);
  block(group, [1.59, 0.54, 0.592], leather, 0, 0.444, 0, 0.032);
  block(group, [1.68, 0.12, 0.58], metal, 0, 0.901, 0, 0.025);
  block(group, [1.65, 0.065, 0.58], metal, 0, 0.076, 0, 0.02);
  const optical = new THREE.MeshPhysicalMaterial({ color: '#244e57', metalness: 0.55,
    roughness: 0.06, clearcoat: 1, iridescence: 0.6, iridescenceIOR: 1.35 });
  for (const [radius, depth, z, mat] of [
    [0.37, 0.08, 0.33, metal], [0.32, 0.15, 0.43, black], [0.29, 0.10, 0.54, metal],
    [0.274, 0.11, 0.64, black], [0.247, 0.025, 0.713, gold],
  ] as [number, number, number, THREE.Material][]) {
    add(group, new THREE.CylinderGeometry(radius, radius, depth, 48), mat, -0.10, 0.45, z, [Math.PI / 2, 0, 0]);
  }
  add(group, new THREE.SphereGeometry(0.229, 40, 20), optical, -0.10, 0.45, 0.718).scale.z = 0.17;
  for (let i = 0; i < 48; i++) {
    const a = i / 48 * Math.PI * 2;
    const ridge = block(group, [0.009, 0.026, 0.083], black,
      -0.1 + Math.sin(a) * 0.29, 0.45 + Math.cos(a) * 0.29, 0.54, 0.001);
    ridge.rotation.z = -a;
  }
  block(group, [0.29, 0.15, 0.029], black, -0.52, 0.82, 0.306, 0.012);
  block(group, [0.21, 0.094, 0.032], optical, -0.52, 0.82, 0.324, 0.008);
  block(group, [0.34, 0.14, 0.02], material('#e2d9b6', 0.25), 0.5, 0.80, 0.311, 0.009);
  for (let i = 0; i < 9; i++) block(group, [0.012, 0.12, 0.007], metal, 0.36 + i * 0.035, 0.80, 0.325, 0.001);
  for (const x of [-0.53, 0.50]) {
    add(group, new THREE.CylinderGeometry(0.13, 0.13, 0.07, 40), black, x, 1.0, 0);
    add(group, new THREE.CylinderGeometry(0.115, 0.115, 0.008, 40), metal, x, 1.041, 0);
    for (let i = 0; i < 24; i++) {
      const a = i / 24 * Math.PI * 2;
      add(group, new THREE.SphereGeometry(0.006, 6, 4), metal, x + Math.cos(a) * 0.128, 1.007, Math.sin(a) * 0.128);
    }
    block(group, [0.018, 0.003, 0.055], gold, x, 1.047, -0.041, 0.001);
  }
  add(group, new THREE.CylinderGeometry(0.045, 0.054, 0.036, 24), gold, 0.70, 0.989, 0.07);
  block(group, [0.22, 0.023, 0.19], black, 0, 0.975, 0, 0.002);
  for (const x of [-0.87, 0.87]) {
    add(group, new THREE.TorusGeometry(0.043, 0.01, 8, 20), metal, x, 0.73, 0, [0, Math.PI / 2, 0]);
    block(group, [0.025, 0.12, 0.11], metal, x * 0.945, 0.72, 0, 0.008);
  }
  const label = texture(512, 128, ctx => {
    ctx.fillStyle = '#bdbdaf'; ctx.fillRect(0, 0, 512, 128); ctx.fillStyle = '#263c34';
    ctx.font = 'bold 40px serif'; ctx.textAlign = 'center'; ctx.fillText('ISLAND / 35', 256, 81);
  });
  add(group, new THREE.PlaneGeometry(0.40, 0.10), new THREE.MeshStandardMaterial({ map: label, metalness: 0.5, roughness: 0.5 }),
    0.50, 0.594, 0.303);
  return finish(group);
}

function postcardArt(kind: number, back = false) {
  return texture(1024, 680, ctx => {
    ctx.fillStyle = '#eee5cb'; ctx.fillRect(0, 0, 1024, 680);
    for (let i = 0; i < 12000; i++) {
      ctx.fillStyle = i % 2 ? 'rgba(133,104,69,.07)' : 'rgba(255,255,240,.20)';
      ctx.fillRect((i * 67) % 1024, (i * 97) % 680, 2, 1);
    }
    if (back) {
      ctx.strokeStyle = '#82745b'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(535, 90); ctx.lineTo(535, 565); ctx.stroke();
      for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(580, 350 + i * 60); ctx.lineTo(943, 350 + i * 60); ctx.stroke(); }
      ctx.fillStyle = '#476e60'; ctx.fillRect(813, 55, 131, 159);
      ctx.strokeStyle = '#eee5cb'; ctx.setLineDash([5, 5]); ctx.strokeRect(820, 62, 117, 145); ctx.setLineDash([]);
      ctx.fillStyle = '#eee5cb'; ctx.font = 'bold 40px serif'; ctx.fillText('旅', 855, 131);
      ctx.font = '16px sans-serif'; ctx.fillText('ISLAND POST', 827, 183);
      ctx.strokeStyle = '#615b48'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(811, 176, 65, 0, Math.PI * 2); ctx.stroke();
      ctx.font = '18px sans-serif'; ctx.fillStyle = '#615b48'; ctx.fillText('TAIWAN · 旅途', 747, 180);
      for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(866, 154 + i * 13); ctx.bezierCurveTo(890, 140 + i * 13, 928, 176 + i * 13, 974, 151 + i * 13); ctx.stroke(); }
      ctx.font = 'italic 30px serif'; ctx.fillText('A little piece of the journey.', 64, 152);
      ctx.font = '18px sans-serif'; ctx.fillText('ORIGINAL SOUVENIR SERIES / FORMOSA', 64, 602);
      return;
    }
    ctx.save(); ctx.beginPath(); ctx.rect(36, 36, 952, 491); ctx.clip();
    ctx.fillStyle = ['#d7bea0', '#b5c9b6', '#c9d2c3'][kind]; ctx.fillRect(36, 36, 952, 491);
    ctx.fillStyle = '#edcb87'; ctx.beginPath(); ctx.arc(780, 138, 65, 0, Math.PI * 2); ctx.fill();
    if (kind === 0) {
      for (let layer = 0; layer < 4; layer++) {
        ctx.fillStyle = ['#9bb8ac', '#688f7e', '#406b61', '#244e45'][layer];
        ctx.beginPath(); ctx.moveTo(0, 527);
        for (let x = 0; x <= 1060; x += 30) ctx.lineTo(x, 200 + layer * 61 - Math.sin(x / 170 + layer) * 80 - Math.sin(x / 68) * 22);
        ctx.lineTo(1060, 527); ctx.closePath(); ctx.fill();
      }
      for (let i = 0; i < 25; i++) { const x = i * 46; ctx.fillStyle = '#183d36'; ctx.beginPath(); ctx.moveTo(x, 380); ctx.lineTo(x - 18, 463); ctx.lineTo(x + 18, 463); ctx.closePath(); ctx.fill(); }
    } else if (kind === 1) {
      ctx.fillStyle = '#4e898c'; ctx.fillRect(36, 270, 952, 260);
      for (let i = 0; i < 13; i++) { ctx.strokeStyle = 'rgba(238,235,204,.55)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(200 + i % 3 * 36, 305 + i * 17); ctx.bezierCurveTo(400, 290 + i * 17, 600, 320 + i * 17, 975, 295 + i * 17); ctx.stroke(); }
      ctx.fillStyle = '#3b6253'; ctx.beginPath(); ctx.moveTo(36, 138); ctx.bezierCurveTo(360, 189, 149, 311, 412, 415); ctx.lineTo(235, 527); ctx.lineTo(36, 527); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = '#d2bb85'; ctx.lineWidth = 14; ctx.beginPath(); ctx.moveTo(36, 281); ctx.bezierCurveTo(171, 325, 127, 388, 271, 495); ctx.stroke();
    } else {
      for (let i = 0; i < 21; i++) {
        const x = 40 + i * 47, h = 70 + (i * 53) % 115;
        ctx.fillStyle = i % 2 ? '#537875' : '#79968a'; ctx.fillRect(x, 527 - h, 39, h);
        ctx.fillStyle = '#d3d8b5'; for (let y = 537 - h; y < 509; y += 15) ctx.fillRect(x + 8, y, 22, 3);
      }
      for (let i = 0; i < 8; i++) {
        const y = 370 - i * 30, w = 68 - i * 2;
        ctx.fillStyle = '#346964'; ctx.beginPath(); ctx.moveTo(620 - w / 2 + 6, y + 28); ctx.lineTo(620 + w / 2 - 6, y + 28); ctx.lineTo(620 + w / 2, y); ctx.lineTo(620 - w / 2, y); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = '#b5c7a3'; ctx.lineWidth = 2; ctx.stroke();
      }
      ctx.fillStyle = '#346964'; ctx.fillRect(602, 103, 36, 24); ctx.fillRect(617, 68, 6, 37);
    }
    ctx.restore(); ctx.fillStyle = '#304f45'; ctx.font = 'bold 44px serif';
    ctx.fillText(['ALISHAN / 山間慢行', 'EAST COAST / 海的路', 'TAIPEI / 城市漫遊'][kind], 45, 596);
    ctx.font = '19px sans-serif'; ctx.fillText('TAIWAN · SMALL PLACES, LASTING MEMORIES', 46, 637);
  });
}

export function createPostcards(): THREE.Group {
  const group = new THREE.Group(); group.name = 'Illustrated island postcard collection';
  const paper = material('#dfd5bb', 0.96);
  const back = new THREE.MeshStandardMaterial({ map: postcardArt(0, true), roughness: 0.97 });
  for (let i = 0; i < 3; i++) {
    const card = new THREE.Group();
    const face = new THREE.MeshStandardMaterial({ map: postcardArt(i), roughness: 0.94 });
    const geometry = new THREE.BoxGeometry(1.88, 0.023, 1.25, 36, 1, 24);
    const positions = geometry.attributes.position;
    for (let j = 0; j < positions.count; j++) {
      const x = positions.getX(j), z = positions.getZ(j);
      positions.setY(j, positions.getY(j) + 0.034 * x * x + 0.013 * z * z);
    }
    geometry.computeVertexNormals();
    // BoxGeometry's top and bottom faces carry the two separate printed designs.
    add(card, geometry, [paper, paper, face, back, paper, paper], 0, 0, 0);
    card.position.set((i - 1) * 0.07, 0.018 + i * 0.036, (i - 1) * 0.09);
    card.rotation.y = (i - 1) * 0.115;
    group.add(card);
  }
  return finish(group);
}
