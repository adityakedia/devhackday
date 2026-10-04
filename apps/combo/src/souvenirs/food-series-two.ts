import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

// Original modeled food and tea souvenirs, inspired by Taiwan Tourism's tea
// guide and Taipei Travel's xiaolongbao guide. Textures are drawn locally.
const p = (r: number, y: number) => new THREE.Vector2(r, y);
const tau = Math.PI * 2;

function rng(seed: number) {
  return () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
}

function texture(draw: (ctx: CanvasRenderingContext2D) => void) {
  const canvas = document.createElement('canvas'); canvas.width = canvas.height = 1024;
  draw(canvas.getContext('2d')!);
  const map = new THREE.CanvasTexture(canvas); map.colorSpace = THREE.SRGBColorSpace; map.anisotropy = 8;
  return map;
}

function mesh(geo: THREE.BufferGeometry, mat: THREE.Material, group: THREE.Group, x = 0, y = 0, z = 0) {
  const object = new THREE.Mesh(geo, mat); object.position.set(x, y, z);
  object.castShadow = object.receiveShadow = true; group.add(object); return object;
}

function lathe(profile: THREE.Vector2[], mat: THREE.Material, group: THREE.Group) {
  return mesh(new THREE.LatheGeometry(profile, 80), mat, group);
}

function ring(r: number, thickness: number, y: number, mat: THREE.Material, group: THREE.Group) {
  const object = mesh(new THREE.TorusGeometry(r, thickness, 8, 80), mat, group, 0, y);
  object.rotation.x = Math.PI / 2; return object;
}

function tube(points: THREE.Vector3[], radius: number, mat: THREE.Material, group: THREE.Group, segments = 36) {
  return mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), segments, radius, 8, false), mat, group);
}

function grain(base: string, seed: number, wood = false) {
  return texture(ctx => {
    ctx.fillStyle = base; ctx.fillRect(0, 0, 1024, 1024); const random = rng(seed);
    for (let i = 0; i < (wood ? 1900 : 12000); i++) {
      ctx.strokeStyle = random() > .5 ? 'rgba(53,26,8,.14)' : 'rgba(255,247,220,.2)';
      ctx.lineWidth = .5 + random() * 2;
      const x = random() * 1024, y = random() * 1024;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + (wood ? random() * 4 : random() * 7), y + (wood ? 30 + random() * 300 : random() * 8)); ctx.stroke();
    }
  });
}

function scatter(geo: THREE.BufferGeometry, mat: THREE.Material, count: number, group: THREE.Group, place: (dummy: THREE.Object3D, i: number) => void) {
  const batch = new THREE.InstancedMesh(geo, mat, count); const dummy = new THREE.Object3D();
  for (let i = 0; i < count; i++) { dummy.position.set(0, 0, 0); dummy.rotation.set(0, 0, 0); dummy.scale.set(1, 1, 1); place(dummy, i); dummy.updateMatrix(); batch.setMatrixAt(i, dummy.matrix); }
  batch.castShadow = batch.receiveShadow = true; group.add(batch); return batch;
}

// A closed, radial skin with sculpted eighteen-fold shoulders and a pinched neck.
function dumplingGeometry() {
  const profile = [[0, 0], [.13, .012], [.21, .045], [.245, .12], [.239, .19], [.204, .25], [.151, .295], [.092, .33], [.049, .36], [.055, .375], [.035, .391], [0, .382]];
  const positions: number[] = [], uvs: number[] = [], indices: number[] = [], sides = 108;
  for (let j = 0; j < profile.length; j++) {
    const [radius, height] = profile[j];
    for (let i = 0; i <= sides; i++) {
      const angle = i / sides * tau;
      const fold = Math.pow(Math.max(0, Math.sin(angle * 18 + height * 6)), 3);
      const weight = Math.sin(Math.max(0, Math.min(1, (height - .13) / .25)) * Math.PI / 2);
      const r = radius + .019 * fold * weight;
      positions.push(Math.sin(angle) * r, height + .005 * Math.cos(angle * 18) * weight, Math.cos(angle) * r);
      uvs.push(i / sides, height / .391);
      if (j < profile.length - 1 && i < sides) { const a = j * (sides + 1) + i, b = a + sides + 1; indices.push(a, a + 1, b, a + 1, b + 1, b); }
    }
  }
  const geometry = new THREE.BufferGeometry(); geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2)); geometry.setIndex(indices); geometry.computeVertexNormals(); return geometry;
}

export function createDumplingSteamer(): THREE.Group {
  const group = new THREE.Group(); group.name = 'Bamboo steamer with pleated xiaolongbao';
  const bambooMap = grain('#d4aa69', 73, true);
  const bamboo = new THREE.MeshStandardMaterial({ color: '#f0cd93', map: bambooMap, bumpMap: bambooMap, bumpScale: .013, roughness: .68 });
  const darkBamboo = new THREE.MeshStandardMaterial({ color: '#ae8249', roughness: .74 });
  lathe([p(.88, .045), p(.93, .045), p(.94, .1), p(.94, .4), p(.935, .445), p(.883, .445), p(.878, .4), p(.88, .045)], bamboo, group);
  ring(.904, .02, .02, bamboo, group);
  for (const y of [.055, .095, .39, .441]) ring(.912, .018, y, bamboo, group);
  for (let i = -10; i <= 10; i++) {
    const offset = i * .077, length = Math.sqrt(.865 ** 2 - offset ** 2) * 2;
    mesh(new RoundedBoxGeometry(length, .018, .045, 2, .006), bamboo, group, 0, .105 + (i % 2 ? .005 : 0), offset);
    mesh(new RoundedBoxGeometry(.042, .012, length, 2, .004), darkBamboo, group, offset, .12, 0);
  }
  // Thin split-bamboo stitches bind the bent wall rather than floating outside it.
  for (let i = 0; i < 8; i++) {
    const a = i * tau / 8;
    const stitch = mesh(new RoundedBoxGeometry(.017, .24, .012, 2, .003), darkBamboo, group, .943 * Math.sin(a), .247, .943 * Math.cos(a)); stitch.rotation.y = a;
    for (const y of [.15, .34]) {
      const peg = mesh(new THREE.SphereGeometry(.013, 8, 6), darkBamboo, group, .949 * Math.sin(a), y, .949 * Math.cos(a)); peg.scale.y = .6;
    }
  }
  const parchment = new THREE.MeshStandardMaterial({ color: '#eee8d6', roughness: .95, side: THREE.DoubleSide });
  const doughMap = grain('#f0e5cb', 928);
  const dough = new THREE.MeshPhysicalMaterial({ color: '#fff4db', map: doughMap, bumpMap: doughMap, bumpScale: .004, roughness: .58, clearcoat: .12 });
  const dumpling = dumplingGeometry();
  for (let i = 0; i < 6; i++) {
    const a = i * tau / 6 + .12, x = .53 * Math.sin(a), z = .53 * Math.cos(a);
    const paperGeo = new THREE.CircleGeometry(.279, 18); const pos = paperGeo.getAttribute('position');
    for (let j = 1; j < pos.count; j++) pos.setZ(j, .006 * Math.sin(j * 3.7)); paperGeo.computeVertexNormals();
    const paper = mesh(paperGeo, parchment, group, x, .135, z); paper.rotation.x = -Math.PI / 2;
    const bun = mesh(dumpling, dough, group, x, .139, z); bun.rotation.y = a + .3; bun.scale.set(1, .95 + i * .009, 1);
  }
  return group;
}

function bowl(group: THREE.Group, radius: number, height: number, baseColor: string, decorated = false) {
  const map = decorated ? texture(ctx => {
    ctx.fillStyle = '#f5efe1'; ctx.fillRect(0, 0, 1024, 1024); ctx.strokeStyle = '#254d72'; ctx.lineWidth = 5;
    for (const y of [110, 130, 880, 900]) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(1024, y); ctx.stroke(); }
    for (let i = 0; i < 16; i++) { const x = i * 64; ctx.beginPath(); ctx.moveTo(x, 300); ctx.bezierCurveTo(x + 52, 360, x + 12, 660, x + 64, 720); ctx.stroke(); ctx.beginPath(); ctx.ellipse(x + 32, 510, 15, 45, -.5, 0, tau); ctx.stroke(); }
  }) : null;
  const ceramic = new THREE.MeshPhysicalMaterial({ color: baseColor, roughness: .2, clearcoat: 1, clearcoatRoughness: .12 });
  const painted = ceramic.clone(); painted.map = map;
  lathe([p(0, .065), p(radius * .36, .065), p(radius * .42, .09), p(radius * .6, height * .25), p(radius * .81, height * .58), p(radius * .96, height * .88), p(radius, height)], painted, group);
  lathe([p(radius, height), p(radius - .035, height + .005), p(radius * .92, height * .85), p(radius * .77, height * .55), p(radius * .54, height * .23), p(radius * .32, .12), p(0, .12)], ceramic, group);
  lathe([p(radius * .3, 0), p(radius * .37, 0), p(radius * .38, .08), p(radius * .32, .09), p(radius * .3, 0)], ceramic, group);
  ring(radius - .015, .018, height, ceramic, group);
}

function leafGeometry() {
  const positions: number[] = [], uvs: number[] = [], indices: number[] = [];
  for (let j = 0; j <= 16; j++) for (let i = 0; i <= 10; i++) {
    const t = j / 16, s = i / 10 * 2 - 1, width = Math.sin(t * Math.PI) * .13;
    positions.push(s * width, .025 * (1 - s * s) + .045 * Math.sin(t * Math.PI) + .014 * Math.sin(t * 30) * s * s, t * .47);
    uvs.push(i / 10, t);
    if (j < 16 && i < 10) { const a = j * 11 + i; indices.push(a, a + 11, a + 1, a + 1, a + 11, a + 12); }
  }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3)); geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2)); geo.setIndex(indices); geo.computeVertexNormals(); return geo;
}

export function createBeefNoodles(): THREE.Group {
  const group = new THREE.Group(); group.name = 'Taiwan braised beef noodle bowl'; bowl(group, .82, .64, '#fff8eb', true);
  const broth = new THREE.MeshPhysicalMaterial({ color: '#653321', roughness: .18, clearcoat: 1, clearcoatRoughness: .08 });
  const surface = mesh(new THREE.CircleGeometry(.733, 80), broth, group, 0, .539); surface.rotation.x = -Math.PI / 2;
  ring(.725, .006, .539, broth, group);
  const noodle = new THREE.MeshStandardMaterial({ color: '#eac992', roughness: .52 }); const random = rng(281);
  for (let i = 0; i < 24; i++) {
    const angle = random() * tau, radius = .07 + random() * .43, points: THREE.Vector3[] = [];
    for (let j = 0; j < 9; j++) {
      const a = angle + j * .42; const r = radius + .045 * Math.sin(j * 1.7 + i);
      points.push(new THREE.Vector3(Math.sin(a) * r, .548 + .018 * Math.sin(j * 1.9 + i), Math.cos(a) * r));
    }
    tube(points, .012, noodle, group, 40);
  }
  const beefMap = grain('#744332', 131);
  const beef = new THREE.MeshPhysicalMaterial({ color: '#9d5840', map: beefMap, bumpMap: beefMap, bumpScale: .026, roughness: .49, clearcoat: .22 });
  const fat = new THREE.MeshStandardMaterial({ color: '#d3b58a', roughness: .61 });
  for (let i = 0; i < 5; i++) {
    const a = -.5 + i * .51, x = Math.sin(a) * .43, z = Math.cos(a) * .43;
    const piece = mesh(new RoundedBoxGeometry(.24, .145, .19, 4, .036), beef, group, x, .61, z); piece.rotation.set(.06, a, .08 * Math.sin(i));
    for (let j = 0; j < 3; j++) tube([new THREE.Vector3(x - .07, .686, z + (j - 1) * .039), new THREE.Vector3(x, .693, z + (j - 1) * .043), new THREE.Vector3(x + .074, .685, z + (j - 1) * .041)], .003, fat, group, 10);
  }
  const leafMap = texture(ctx => { ctx.fillStyle = '#36703c'; ctx.fillRect(0, 0, 1024, 1024); ctx.strokeStyle = '#86a861'; ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(512, 0); ctx.lineTo(512, 1024); ctx.stroke(); ctx.lineWidth = 3; for (let i = 0; i < 13; i++) for (const sign of [-1, 1]) { ctx.beginPath(); ctx.moveTo(512, i * 80); ctx.quadraticCurveTo(512 + sign * 230, i * 80 + 60, 512 + sign * 480, i * 80 + 130); ctx.stroke(); } });
  const greens = new THREE.MeshPhysicalMaterial({ color: '#c2d99e', map: leafMap, roughness: .44, clearcoat: .22, side: THREE.DoubleSide });
  const stalk = new THREE.MeshStandardMaterial({ color: '#d9e4b2', roughness: .52 });
  for (let i = 0; i < 4; i++) {
    const leaf = mesh(leafGeometry(), greens, group, -.47 + i * .08, .566, -.17); leaf.rotation.y = 2.1 + i * .24; leaf.rotation.x = -.25;
    tube([new THREE.Vector3(-.45 + i * .07, .55, -.2), new THREE.Vector3(-.32 + i * .06, .576, -.34), new THREE.Vector3(-.22 + i * .055, .593, -.43)], .026, stalk, group, 16);
  }
  const scallion = new THREE.MeshStandardMaterial({ color: '#8fac58', roughness: .6 });
  scatter(new THREE.TorusGeometry(.016, .006, 5, 10), scallion, 32, group, dummy => {
    const a = random() * tau, r = Math.sqrt(random()) * .64; dummy.position.set(Math.sin(a) * r, .557, Math.cos(a) * r); dummy.rotation.set(-Math.PI / 2 + random() * .5, random() * tau, 0);
  });
  const wood = new THREE.MeshStandardMaterial({ color: '#713e25', roughness: .56 });
  for (const x of [.33, .415]) {
    const chopstick = mesh(new THREE.CylinderGeometry(.021, .013, 1.68, 12), wood, group, x, .755, -.05); chopstick.rotation.x = Math.PI / 2 - .16; chopstick.rotation.z = -.28;
  }
  return group;
}

export function createMangoIce(): THREE.Group {
  const group = new THREE.Group(); group.name = 'Taiwan mango shaved ice'; bowl(group, .76, .41, '#b8d3c4');
  const iceMap = grain('#f7f0da', 421);
  const ice = new THREE.MeshPhysicalMaterial({ color: '#fff7e2', map: iceMap, bumpMap: iceMap, bumpScale: .017, roughness: .73, clearcoat: .12 });
  const mound = new THREE.SphereGeometry(.64, 64, 36, 0, tau, 0, Math.PI / 2);
  const pos = mound.getAttribute('position');
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
    const noise = .012 * Math.sin(x * 49 + z * 13) + .013 * Math.sin(z * 61 + y * 17);
    pos.setXYZ(i, x * (1 + noise), y * .95 + noise, z * (1 + noise));
  }
  mound.computeVertexNormals(); mesh(mound, ice, group, 0, .345);
  const random = rng(608);
  const flakeGeo = new THREE.IcosahedronGeometry(.021, 0);
  scatter(flakeGeo, ice, 520, group, dummy => {
    const a = random() * tau, r = Math.sqrt(random()) * .62;
    dummy.position.set(Math.sin(a) * r, .345 + Math.sqrt(.64 ** 2 - r ** 2) * .95, Math.cos(a) * r);
    dummy.rotation.set(random() * tau, random() * tau, random() * tau); dummy.scale.set(1 + random(), .22 + random() * .3, .6 + random());
  });
  const mangoMap = grain('#efab24', 86);
  const mango = new THREE.MeshPhysicalMaterial({ color: '#ffc23e', map: mangoMap, bumpMap: mangoMap, bumpScale: .004, roughness: .29, clearcoat: .5, clearcoatRoughness: .23 });
  const cubes = new RoundedBoxGeometry(.19, .17, .19, 3, .023);
  scatter(cubes, mango, 28, group, (dummy, i) => {
    const a = i * 2.39996, r = .22 + random() * .37;
    dummy.position.set(Math.sin(a) * r, .385 + Math.sqrt(.64 ** 2 - r ** 2) * .95, Math.cos(a) * r);
    dummy.rotation.set(random() * .3, a, random() * .3); dummy.scale.set(.8 + random() * .35, .85 + random() * .25, .8 + random() * .3);
  });
  const milk = new THREE.MeshPhysicalMaterial({ color: '#fff3c8', roughness: .17, clearcoat: 1 });
  for (let i = 0; i < 3; i++) {
    const points: THREE.Vector3[] = [];
    for (let j = 0; j <= 12; j++) { const z = -.48 + j * .08, x = -.14 + i * .14 + .018 * Math.sin(j * .8), r2 = x * x + z * z; points.push(new THREE.Vector3(x, .365 + Math.sqrt(.64 ** 2 - r2) * .95, z)); }
    tube(points, .014, milk, group, 48);
  }
  return group;
}

export function createOolongTin(): THREE.Group {
  const group = new THREE.Group(); group.name = 'Illustrated high mountain oolong tea tin';
  const metal = new THREE.MeshPhysicalMaterial({ color: '#c4b386', metalness: .8, roughness: .29, clearcoat: .3 });
  const darkMetal = new THREE.MeshStandardMaterial({ color: '#6b775e', metalness: .65, roughness: .36 });
  lathe([p(0, .024), p(.46, .024), p(.48, .052), p(.48, 1.36), p(.461, 1.38), p(.446, 1.38), p(.448, .072), p(0, .072)], metal, group);
  for (const y of [.046, .085, 1.3, 1.355]) ring(.477, .012, y, metal, group);
  const labelMap = texture(ctx => {
    ctx.fillStyle = '#163d37'; ctx.fillRect(0, 0, 1024, 1024);
    for (let layer = 0; layer < 5; layer++) {
      ctx.fillStyle = ['#527568', '#65897b', '#88a292', '#b3bc99', '#d5ceaa'][layer]; ctx.beginPath(); ctx.moveTo(0, 750);
      for (let x = 0; x <= 1024; x += 8) ctx.lineTo(x, 670 + layer * 49 - Math.abs(Math.sin(x / (95 + layer * 23) + layer)) * (125 - layer * 14));
      ctx.lineTo(1024, 1024); ctx.lineTo(0, 1024); ctx.fill();
    }
    ctx.strokeStyle = '#d8c58a'; ctx.lineWidth = 4; ctx.strokeRect(42, 34, 940, 940);
    ctx.textAlign = 'center'; ctx.fillStyle = '#f2e5b9'; ctx.font = '80px serif'; ctx.fillText('高山烏龍茶', 512, 228);
    ctx.font = '27px sans-serif'; ctx.fillText('HIGH MOUNTAIN OOLONG', 512, 300); ctx.font = '22px sans-serif'; ctx.fillText('TAIWAN · HAND PICKED', 512, 360);
    ctx.fillStyle = '#c77750'; ctx.fillRect(750, 397, 70, 80); ctx.fillStyle = '#f6e3b5'; ctx.font = '24px serif'; ctx.fillText('茶', 785, 447);
    ctx.strokeStyle = '#e3d8b1'; ctx.lineWidth = 2;
    for (let i = 0; i < 7; i++) { ctx.beginPath(); ctx.moveTo(0, 825 + i * 23); ctx.bezierCurveTo(280, 740 + i * 23, 640, 980 + i * 9, 1024, 810 + i * 23); ctx.stroke(); }
  });
  const label = new THREE.MeshStandardMaterial({ map: labelMap, roughness: .72 });
  // Cylinder front is +Z; artwork's middle is oriented toward that view.
  const wrap = mesh(new THREE.CylinderGeometry(.483, .483, 1.16, 96, 1, true), label, group, 0, .69); wrap.rotation.y = Math.PI;
  lathe([p(0, 1.363), p(.476, 1.363), p(.499, 1.382), p(.501, 1.427), p(.482, 1.455), p(.41, 1.463), p(0, 1.463)], darkMetal, group);
  for (const y of [1.388, 1.443]) ring(.491, .01, y, metal, group);
  ring(.405, .007, 1.465, metal, group); ring(.383, .004, 1.465, metal, group);
  const emblemMat = new THREE.MeshStandardMaterial({ color: '#c8b784', metalness: .7, roughness: .31 });
  const emblem = new THREE.Group(); group.add(emblem); emblem.position.set(0, 1.469, 0);
  for (let i = 0; i < 5; i++) {
    const leaf = mesh(new THREE.SphereGeometry(.061, 14, 10), emblemMat, emblem, Math.sin(i * tau / 5) * .085, 0, Math.cos(i * tau / 5) * .085);
    leaf.scale.set(.5, .08, 1.5); leaf.rotation.y = i * tau / 5;
  }
  const tea = new THREE.MeshStandardMaterial({ color: '#4f4a2b', roughness: .96 }); const random = rng(479);
  scatter(new THREE.IcosahedronGeometry(.025, 1), tea, 42, group, dummy => {
    const a = random() * tau, r = Math.sqrt(random()) * .17;
    dummy.position.set(.72 + Math.sin(a) * r, .025 + random() * .027, .15 + Math.cos(a) * r);
    dummy.scale.set(.6 + random(), .45 + random() * .5, .8 + random()); dummy.rotation.set(random() * tau, random() * tau, random() * tau);
  });
  group.position.x = -.17;
  return group;
}
