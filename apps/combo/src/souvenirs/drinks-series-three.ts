import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

// Original modeled Taiwanese drinks; all artwork is drawn locally.
const p = (r: number, y: number) => new THREE.Vector2(r, y);
const tau = Math.PI * 2;
function mesh(geometry: THREE.BufferGeometry, material: THREE.Material, group: THREE.Group, x = 0, y = 0, z = 0) {
  const object = new THREE.Mesh(geometry, material);
  object.position.set(x, y, z); object.castShadow = object.receiveShadow = true; group.add(object); return object;
}
function lathe(points: THREE.Vector2[], material: THREE.Material, group: THREE.Group) {
  return mesh(new THREE.LatheGeometry(points, 80), material, group);
}
function ring(radius: number, tube: number, y: number, material: THREE.Material, group: THREE.Group) {
  const object = mesh(new THREE.TorusGeometry(radius, tube, 10, 80), material, group, 0, y);
  object.rotation.x = Math.PI / 2; return object;
}
function texture(draw: (ctx: CanvasRenderingContext2D) => void) {
  const canvas = document.createElement('canvas'); canvas.width = canvas.height = 1024;
  draw(canvas.getContext('2d')!);
  const map = new THREE.CanvasTexture(canvas); map.colorSpace = THREE.SRGBColorSpace; map.anisotropy = 8; return map;
}
function random(seed: number) {
  return () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
}
function glass(color = '#f4fcfa') {
  return new THREE.MeshPhysicalMaterial({ color, roughness: .09, transmission: .55, thickness: .035, ior: 1.46, transparent: true, opacity: .52, clearcoat: 1 });
}
function finish(group: THREE.Group) {
  group.updateMatrixWorld(true);
  const bounds = new THREE.Box3().setFromObject(group), center = bounds.getCenter(new THREE.Vector3());
  for (const child of group.children) child.position.sub(new THREE.Vector3(center.x, bounds.min.y, center.z));
  return group;
}
function ice(group: THREE.Group, count: number, y: number, radius: number, seed: number) {
  const material = new THREE.MeshPhysicalMaterial({ color: '#e6f4f2', roughness: .16, transmission: .62, thickness: .14, ior: 1.31, transparent: true, opacity: .7, clearcoat: 1 });
  const geometry = new RoundedBoxGeometry(.19, .17, .18, 3, .018), rng = random(seed);
  for (let i = 0; i < count; i++) {
    const angle = i * 2.39996, r = radius * Math.sqrt((i + .4) / count);
    const cube = mesh(geometry, material, group, Math.sin(angle) * r, y + .025 * rng(), Math.cos(angle) * r);
    cube.rotation.set(rng() * .6, rng() * tau, rng() * .5);
  }
}
function coaster(group: THREE.Group, radius: number) {
  const map = texture(ctx => {
    ctx.fillStyle = '#ba9061'; ctx.fillRect(0, 0, 1024, 1024); const rng = random(11);
    for (let i = 0; i < 7000; i++) { ctx.fillStyle = rng() > .5 ? '#a17a50' : '#d0ad79'; ctx.fillRect(rng() * 1024, rng() * 1024, 1 + rng() * 4, 1 + rng() * 3); }
  });
  mesh(new THREE.CylinderGeometry(radius, radius, .035, 80), new THREE.MeshStandardMaterial({ map, roughness: .95, bumpMap: map, bumpScale: .009 }), group, 0, .0175);
}

export function createPapayaMilk(): THREE.Group {
  const group = new THREE.Group(); group.name = 'Retro Taiwan papaya milk glass';
  coaster(group, .41);
  const vessel = glass();
  lathe([p(0, .035), p(.24, .035), p(.27, .055), p(.29, .14), p(.325, 1.41), p(.321, 1.435), p(.294, 1.435), p(.292, 1.39), p(.265, .13), p(.24, .09), p(0, .09)], vessel, group);
  ring(.308, .012, 1.423, vessel, group);
  const milk = new THREE.MeshPhysicalMaterial({ color: '#f1b08a', roughness: .34, clearcoat: .45 });
  lathe([p(0, .095), p(.246, .095), p(.275, .2), p(.291, 1.31), p(0, 1.31)], milk, group);
  const foam = new THREE.MeshPhysicalMaterial({ color: '#ffdbb2', roughness: .48, clearcoat: .25 });
  const rng = random(198); const bubbles = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 10, 8), foam, 62), dummy = new THREE.Object3D();
  for (let i = 0; i < 62; i++) {
    const a = rng() * tau, r = Math.sqrt(rng()) * .277, size = .007 + rng() * .014;
    dummy.position.set(Math.sin(a) * r, 1.312, Math.cos(a) * r); dummy.scale.set(size, size * .35, size); dummy.updateMatrix(); bubbles.setMatrixAt(i, dummy.matrix);
  }
  group.add(bubbles);
  const print = texture(ctx => {
    ctx.clearRect(0, 0, 1024, 1024); ctx.textAlign = 'center'; ctx.fillStyle = '#854639';
    ctx.font = 'bold 115px serif'; ctx.fillText('木瓜牛奶', 512, 400); ctx.font = '40px sans-serif'; ctx.fillText('PAPAYA MILK', 512, 484);
    ctx.strokeStyle = '#854639'; ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(120, 555); ctx.lineTo(904, 555); ctx.stroke();
    ctx.font = '28px sans-serif'; ctx.fillText('台灣 · FRESH & SWEET', 512, 621);
  });
  const decal = mesh(new THREE.CylinderGeometry(.318, .306, .46, 48, 1, true, -.9, 1.8), new THREE.MeshStandardMaterial({ map: print, transparent: true, roughness: .6, depthWrite: false }), group, 0, .88); decal.name = 'Original screen printed lettering';
  const fruit = new THREE.Group(); group.add(fruit); fruit.position.set(.54, .035, .09); fruit.rotation.y = -.45;
  const skin = new THREE.MeshPhysicalMaterial({ color: '#5f8b35', roughness: .52, clearcoat: .3 });
  const flesh = new THREE.MeshPhysicalMaterial({ color: '#ee7e37', roughness: .35, clearcoat: .42 });
  const wedge = new THREE.Shape(); wedge.moveTo(-.19, 0); wedge.quadraticCurveTo(-.13, .16, 0, .22); wedge.quadraticCurveTo(.13, .16, .19, 0); wedge.lineTo(-.19, 0);
  const rind = mesh(new THREE.ExtrudeGeometry(wedge, { depth: .49, bevelEnabled: true, bevelSize: .015, bevelThickness: .014, bevelSegments: 3, curveSegments: 24 }), skin, fruit, 0, .018, -.245);
  const inner = mesh(new THREE.ExtrudeGeometry(wedge, { depth: .495, bevelEnabled: true, bevelSize: .01, bevelThickness: .01, bevelSegments: 3, curveSegments: 24 }), flesh, fruit, 0, .035, -.247); inner.scale.set(.87, .81, 1);
  const cavity = mesh(new THREE.SphereGeometry(.12, 24, 16), new THREE.MeshStandardMaterial({ color: '#d66928', roughness: .6 }), fruit, 0, .19); cavity.scale.set(.61, .15, 1.8);
  const seed = new THREE.MeshPhysicalMaterial({ color: '#28201a', roughness: .3, clearcoat: .6 });
  for (let i = 0; i < 18; i++) { const bead = mesh(new THREE.SphereGeometry(.017, 10, 8), seed, fruit, (rng() - .5) * .09, .197 + rng() * .009, (rng() - .5) * .31); bead.scale.set(.88, .7, 1.2); }
  rind.name = 'Papaya rind';
  return finish(group);
}

export function createWinterMelonTea(): THREE.Group {
  const group = new THREE.Group(); group.name = 'Taiwan winter melon iced tea';
  const plastic = glass('#fbfff7');
  lathe([p(0, 0), p(.29, 0), p(.32, .035), p(.39, 1.24), p(.416, 1.29), p(.416, 1.315), p(.397, 1.315), p(.371, 1.235), p(.299, .05), p(0, .05)], plastic, group);
  const tea = new THREE.MeshPhysicalMaterial({ color: '#b56d23', roughness: .16, transparent: true, opacity: .78, transmission: .16, thickness: .4, clearcoat: 1 });
  lathe([p(0, .052), p(.298, .052), p(.362, 1.14), p(0, 1.14)], tea, group); ice(group, 7, 1.13, .23, 192);
  lathe([p(.413, 1.3), p(.437, 1.31), p(.437, 1.345), p(.42, 1.364), p(.36, 1.375), p(.07, 1.375), p(.07, 1.357), p(.36, 1.357), p(.416, 1.345), p(.413, 1.3)], plastic, group);
  ring(.431, .008, 1.334, plastic, group);
  const strawMat = new THREE.MeshPhysicalMaterial({ color: '#546c4b', roughness: .42 });
  const straw = lathe([p(.023, 0), p(.03, 0), p(.03, 1.64), p(.023, 1.64), p(.023, 0)], strawMat, group); straw.position.set(.075, .065, -.02); straw.rotation.z = -.065;
  const artwork = texture(ctx => {
    ctx.fillStyle = '#f4edd9'; ctx.fillRect(0, 0, 1024, 1024); ctx.strokeStyle = '#385448'; ctx.lineWidth = 7; ctx.strokeRect(40, 35, 944, 954);
    ctx.fillStyle = '#385448'; ctx.textAlign = 'center'; ctx.font = '110px serif'; ctx.fillText('冬瓜茶', 512, 328); ctx.font = '30px sans-serif'; ctx.fillText('WINTER MELON TEA', 512, 402);
    ctx.fillStyle = '#96a578'; ctx.beginPath(); ctx.ellipse(512, 660, 160, 118, -.12, 0, tau); ctx.fill();
    ctx.strokeStyle = '#627b56'; ctx.lineWidth = 6;
    for (let i = -3; i <= 3; i++) { ctx.beginPath(); ctx.ellipse(512, 660, 25 + Math.abs(i) * 34, 112, -.12, 0, tau); ctx.stroke(); }
    ctx.fillStyle = '#a6633e'; ctx.font = '27px serif'; ctx.fillText('古早味 · TAIWAN', 512, 878);
  });
  mesh(new THREE.CylinderGeometry(.38, .349, .53, 48, 1, true, -.76, 1.52), new THREE.MeshStandardMaterial({ map: artwork, roughness: .83, side: THREE.DoubleSide }), group, 0, .76);
  return finish(group);
}

export function createColdOolong(): THREE.Group {
  const group = new THREE.Group(); group.name = 'Cold brewed high mountain oolong bottle';
  const bottle = glass('#d9e6d0');
  lathe([p(0, 0), p(.27, 0), p(.32, .035), p(.33, .1), p(.33, .98), p(.32, 1.065), p(.26, 1.18), p(.155, 1.29), p(.145, 1.4), p(.124, 1.4), p(.127, 1.29), p(.235, 1.17), p(.298, 1.04), p(.303, .08), p(0, .065)], bottle, group);
  const tea = new THREE.MeshPhysicalMaterial({ color: '#ba973f', roughness: .17, transparent: true, opacity: .78, transmission: .22, thickness: .35, clearcoat: 1 });
  lathe([p(0, .066), p(.302, .066), p(.302, 1.035), p(.237, 1.165), p(0, 1.165)], tea, group);
  const map = texture(ctx => {
    ctx.fillStyle = '#eee9d6'; ctx.fillRect(0, 0, 1024, 1024);
    for (let layer = 0; layer < 4; layer++) {
      ctx.fillStyle = ['#a5b9a2', '#759b88', '#4f7e6e', '#2e5b4e'][layer]; ctx.beginPath(); ctx.moveTo(0, 1024);
      for (let x = 0; x <= 1024; x += 8) ctx.lineTo(x, 740 + layer * 50 - Math.abs(Math.sin(x / (90 + layer * 35) + layer)) * 155);
      ctx.lineTo(1024, 1024); ctx.fill();
    }
    ctx.fillStyle = '#31564a'; ctx.textAlign = 'center'; ctx.font = '88px serif'; ctx.fillText('冷泡烏龍', 512, 250); ctx.font = '28px sans-serif'; ctx.fillText('COLD BREW · HIGH MOUNTAIN', 512, 315);
    ctx.font = '25px sans-serif'; ctx.fillText('TAIWAN / SLOWLY STEEPED', 512, 385);
    ctx.strokeStyle = '#bc9a62'; ctx.lineWidth = 5; ctx.strokeRect(35, 30, 954, 960);
    ctx.fillStyle = '#ba6144'; ctx.fillRect(470, 440, 84, 86); ctx.fillStyle = '#f7e5c8'; ctx.font = '44px serif'; ctx.fillText('茶', 512, 500);
    ctx.strokeStyle = '#d1d9b7'; ctx.lineWidth = 3; for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.moveTo(0, 840 + i * 30); ctx.bezierCurveTo(260, 790 + i * 29, 710, 990, 1024, 825 + i * 30); ctx.stroke(); }
  });
  const wrap = mesh(new THREE.CylinderGeometry(.332, .332, .68, 80, 1, true), new THREE.MeshStandardMaterial({ map, roughness: .78 }), group, 0, .67); wrap.rotation.y = Math.PI;
  const cap = new THREE.MeshPhysicalMaterial({ color: '#436c55', roughness: .32, metalness: .48, clearcoat: .45 });
  lathe([p(0, 1.405), p(.156, 1.405), p(.166, 1.416), p(.166, 1.51), p(.147, 1.527), p(0, 1.527)], cap, group);
  ring(.16, .008, 1.41, cap, group); ring(.156, .006, 1.515, cap, group);
  const ridges = new THREE.InstancedMesh(new THREE.CylinderGeometry(.0025, .0025, .065, 6), cap, 48), dummy = new THREE.Object3D();
  for (let i = 0; i < 48; i++) { const a = i * tau / 48; dummy.position.set(Math.sin(a) * .167, 1.462, Math.cos(a) * .167); dummy.updateMatrix(); ridges.setMatrixAt(i, dummy.matrix); } group.add(ridges);
  const cup = new THREE.Group(); cup.position.set(.61, 0, .17); group.add(cup);
  const ceramic = new THREE.MeshPhysicalMaterial({ color: '#e4e8d6', roughness: .23, clearcoat: 1 });
  lathe([p(0, .025), p(.095, .025), p(.15, .09), p(.214, .255), p(.221, .285), p(.204, .285), p(.19, .251), p(.126, .1), p(.08, .06), p(0, .06)], ceramic, cup);
  lathe([p(.08, 0), p(.1, 0), p(.1, .045), p(.08, .045), p(.08, 0)], ceramic, cup);
  lathe([p(0, .062), p(.08, .062), p(.174, .216), p(0, .216)], tea, cup);
  ring(.213, .005, .282, new THREE.MeshPhysicalMaterial({ color: '#668671', roughness: .25, clearcoat: 1 }), cup);
  return finish(group);
}

export function createPlumJuice(): THREE.Group {
  const group = new THREE.Group(); group.name = 'Taiwan sour plum drink in ribbed glass';
  coaster(group, .44);
  const vessel = glass('#f5edeb');
  const body = new THREE.LatheGeometry([p(0, .035), p(.31, .035), p(.34, .065), p(.36, .94), p(.36, .97), p(.336, .97), p(.333, .91), p(.315, .1), p(0, .1)], 128);
  // Sculpt the external flutes only: the inner drinking surface remains smooth.
  const pos = body.getAttribute('position');
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), z = pos.getZ(i), y = pos.getY(i), r = Math.hypot(x, z);
    if (r > .337 && y > .065 && y < .945) {
      const flute = .008 * (1 + Math.cos(Math.atan2(x, z) * 32)); pos.setX(i, x * (r + flute) / r); pos.setZ(i, z * (r + flute) / r);
    }
  }
  body.computeVertexNormals(); mesh(body, vessel, group); ring(.348, .012, .961, vessel, group);
  const juice = new THREE.MeshPhysicalMaterial({ color: '#793737', roughness: .16, transparent: true, opacity: .84, transmission: .18, thickness: .4, clearcoat: .8 });
  lathe([p(0, .102), p(.313, .102), p(.33, .82), p(0, .82)], juice, group); ice(group, 6, .825, .2, 912);
  const fruitMap = texture(ctx => {
    ctx.fillStyle = '#66433b'; ctx.fillRect(0, 0, 1024, 1024); const rng = random(62);
    ctx.strokeStyle = '#34241f'; ctx.lineWidth = 3;
    for (let i = 0; i < 700; i++) { const x = rng() * 1024, y = rng() * 1024; ctx.beginPath(); ctx.moveTo(x, y); ctx.bezierCurveTo(x + 12, y + 15, x - 8, y + 32, x + 5, y + 60); ctx.stroke(); }
  });
  const plum = new THREE.MeshPhysicalMaterial({ map: fruitMap, roughness: .8, bumpMap: fruitMap, bumpScale: .021 });
  for (let i = 0; i < 2; i++) { const fruit = mesh(new THREE.SphereGeometry(.105, 32, 20), plum, group, .58 + i * .18, .092, .08 - i * .07); fruit.scale.set(1, .86, .92); fruit.rotation.set(.2, i, .4); }
  const citrus = new THREE.Group(); group.add(citrus); citrus.position.set(-.5, .035, .09); citrus.rotation.x = -.24;
  const rind = new THREE.MeshPhysicalMaterial({ color: '#8ea646', roughness: .49, clearcoat: .4 });
  const flesh = new THREE.MeshPhysicalMaterial({ color: '#e9da8a', roughness: .34, clearcoat: .5 });
  mesh(new THREE.CylinderGeometry(.18, .18, .038, 64), rind, citrus, 0, .019);
  const disc = mesh(new THREE.CircleGeometry(.157, 64), flesh, citrus, 0, .04); disc.rotation.x = -Math.PI / 2;
  const pale = new THREE.MeshStandardMaterial({ color: '#f4e9c2', roughness: .57 });
  for (let i = 0; i < 9; i++) { const a = i * tau / 9; const line = mesh(new THREE.BoxGeometry(.003, .003, .148), pale, citrus, Math.sin(a) * .074, .042, Math.cos(a) * .074); line.rotation.y = a; }
  const center = mesh(new THREE.SphereGeometry(.016, 12, 8), pale, citrus, 0, .043); center.scale.y = .22;
  return finish(group);
}
