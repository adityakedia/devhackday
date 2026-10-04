import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

const tau = Math.PI * 2;
const p = (r: number, y: number) => new THREE.Vector2(r, y);
function random(seed: number) { return () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; }; }
function texture(base: string, seed: number, browned = false) {
  const canvas = document.createElement('canvas'); canvas.width = canvas.height = 512;
  const ctx = canvas.getContext('2d')!; ctx.fillStyle = base; ctx.fillRect(0, 0, 512, 512);
  const rand = random(seed);
  for (let i = 0; i < 4500; i++) {
    ctx.fillStyle = rand() > .5 ? 'rgba(255,244,207,.22)' : 'rgba(83,40,15,.13)';
    ctx.beginPath(); ctx.ellipse(rand() * 512, rand() * 512, rand() * 2 + .3, rand() * 3 + .4, rand() * tau, 0, tau); ctx.fill();
  }
  if (browned) for (let i = 0; i < 65; i++) {
    const x = rand() * 512, y = rand() * 512, r = 7 + rand() * 35;
    const fade = ctx.createRadialGradient(x, y, 0, x, y, r);
    fade.addColorStop(0, 'rgba(112,49,16,.65)'); fade.addColorStop(.5, 'rgba(159,75,23,.28)'); fade.addColorStop(1, 'rgba(159,75,23,0)');
    ctx.fillStyle = fade; ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }
  const map = new THREE.CanvasTexture(canvas); map.colorSpace = THREE.SRGBColorSpace; map.anisotropy = 8; return map;
}
function material(color: string, seed: number, roughness = .55, browned = false) {
  const map = texture(color, seed, browned);
  return new THREE.MeshPhysicalMaterial({ color: '#ffffff', map, bumpMap: map, bumpScale: .007, roughness, clearcoat: roughness < .4 ? .5 : .08 });
}
function add(geo: THREE.BufferGeometry, mat: THREE.Material, group: THREE.Group, x = 0, y = 0, z = 0) {
  const object = new THREE.Mesh(geo, mat); object.position.set(x, y, z); object.castShadow = object.receiveShadow = true; group.add(object); return object;
}
function tube(points: THREE.Vector3[], radius: number, mat: THREE.Material, group: THREE.Group, segments = 24) {
  return add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), segments, radius, 6, false), mat, group);
}
function scatter(geo: THREE.BufferGeometry, mat: THREE.Material, count: number, group: THREE.Group, place: (o: THREE.Object3D, i: number) => void) {
  const batch = new THREE.InstancedMesh(geo, mat, count), dummy = new THREE.Object3D();
  for (let i = 0; i < count; i++) { dummy.position.set(0, 0, 0); dummy.rotation.set(0, 0, 0); dummy.scale.set(1, 1, 1); place(dummy, i); dummy.updateMatrix(); batch.setMatrixAt(i, dummy.matrix); }
  batch.castShadow = batch.receiveShadow = true; group.add(batch); return batch;
}
function dish(group: THREE.Group, bowl = false) {
  const glazed = new THREE.MeshPhysicalMaterial({ color: '#f2eadd', roughness: .2, clearcoat: 1, clearcoatRoughness: .12 });
  const profile = bowl
    ? [p(0, .055), p(.34, .055), p(.47, .13), p(.69, .35), p(.89, .63), p(.91, .67), p(.88, .68), p(.84, .62), p(.65, .36), p(.44, .17), p(0, .17)]
    : [p(0, .028), p(.55, .028), p(.72, .055), p(.95, .12), p(.99, .16), p(.97, .18), p(.89, .15), p(.65, .084), p(0, .084)];
  add(new THREE.LatheGeometry(profile, 80), glazed, group);
  add(new THREE.LatheGeometry([p(.29, 0), p(.36, 0), p(.37, .055), p(.29, .065), p(.29, 0)], 64), glazed, group);
  const blue = new THREE.MeshStandardMaterial({ color: '#355b71', roughness: .3 });
  for (const r of bowl ? [.887, .898] : [.928, .955]) {
    const ring = add(new THREE.TorusGeometry(r, .004, 5, 80), blue, group, 0, bowl ? .67 : .169); ring.rotation.x = Math.PI / 2;
  }
  const rand = random(165);
  scatter(new THREE.SphereGeometry(.006, 6, 4), blue, 72, group, (o, i) => {
    const a = i * tau / 72; o.position.set(Math.cos(a) * .87, bowl ? .614 : .15, Math.sin(a) * .87); o.scale.set(1, .25, 1 + rand());
  });
}
function sculptedSphere(rx: number, ry: number, rz: number, wave = .01, tilt = 0) {
  const geo = new THREE.SphereGeometry(1, 40, 20), pos = geo.getAttribute('position');
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i), n = wave * Math.sin(x * 13 + z * 9) * Math.sin(z * 17 + y * 11);
    pos.setXYZ(i, x * (rx + n), y * (ry + n * .45) + z * tilt, z * (rz + n));
  }
  geo.computeVertexNormals(); return geo;
}
function herbs(group: THREE.Group, y: number, radius: number, count: number, seed: number) {
  const rand = random(seed), green = material('#507d39', seed, .52);
  scatter(new RoundedBoxGeometry(.055, .014, .028, 1, .006), green, count, group, o => {
    const a = rand() * tau, r = Math.sqrt(rand()) * radius; o.position.set(Math.sin(a) * r, y + rand() * .017, Math.cos(a) * r); o.rotation.y = rand() * tau;
  });
}

export function createGuaBao(): THREE.Group {
  const group = new THREE.Group(); group.name = 'Gua bao with braised pork and coriander';
  const paper = new THREE.MeshStandardMaterial({ color: '#e9dfc9', roughness: .94, side: THREE.DoubleSide });
  const liner = new THREE.CircleGeometry(.89, 64), pos = liner.getAttribute('position');
  for (let i = 1; i < pos.count; i++) pos.setZ(i, .055 + .035 * Math.sin(i * .8)); liner.computeVertexNormals();
  const sheet = add(liner, paper, group, 0, .02); sheet.rotation.x = -Math.PI / 2;
  const dough = material('#f4ead6', 78, .77);
  // Two softly folded, closed bread skins converge at the back; the front
  // opening reveals the filling instead of covering it with a solid loaf.
  add(sculptedSphere(.7, .14, .55, .012), dough, group, 0, .21, 0);
  add(sculptedSphere(.7, .2, .55, .014, .16), dough, group, 0, .62, 0);
  add(sculptedSphere(.6, .2, .13, .009), dough, group, 0, .4, -.43);
  const pork = material('#834424', 401, .31), fat = material('#d8b58a', 81, .39);
  for (let i = 0; i < 3; i++) {
    const x = (i - 1) * .29;
    const meat = add(new RoundedBoxGeometry(.32, .14, .64, 4, .039), pork, group, x, .39, .12); meat.rotation.y = (i - 1) * .08;
    const belly = add(new RoundedBoxGeometry(.31, .029, .63, 3, .012), fat, group, x, .414, .12); belly.rotation.y = meat.rotation.y;
    add(new RoundedBoxGeometry(.31, .025, .64, 3, .01), pork, group, x, .441, .12).rotation.y = meat.rotation.y;
  }
  const rand = random(315), pickle = material('#72834a', 165, .43), peanut = material('#d6b47b', 54, .8);
  scatter(new THREE.IcosahedronGeometry(.035, 0), pickle, 90, group, o => {
    o.position.set((rand() - .5) * 1.05, .47 + rand() * .027, .19 + rand() * .31); o.scale.set(1.3, .5, .7); o.rotation.set(rand(), rand() * tau, rand());
  });
  scatter(new THREE.IcosahedronGeometry(.013, 0), peanut, 100, group, o => {
    o.position.set((rand() - .5) * 1.0, .505 + rand() * .035, .27 + rand() * .27); o.scale.set(1, .6, .8); o.rotation.y = rand() * tau;
  });
  const coriander = material('#388b43', 23, .5);
  scatter(sculptedSphere(.036, .004, .059, .008), coriander, 27, group, (o, i) => {
    o.position.set(Math.sin(i * 2.4) * .42, .54 + rand() * .025, .39 + rand() * .16); o.rotation.y = rand() * tau;
  });
  return group;
}

export function createTaroBowl(): THREE.Group {
  const group = new THREE.Group(); group.name = 'Jiufen taro balls in brown sugar syrup'; dish(group, true);
  const syrup = new THREE.MeshPhysicalMaterial({ color: '#643b26', roughness: .13, clearcoat: 1 });
  const surface = add(new THREE.CircleGeometry(.798, 80), syrup, group, 0, .555); surface.rotation.x = -Math.PI / 2;
  const taro = material('#b6a0c3', 227, .35), sweet = material('#e7ac42', 241, .32), rand = random(127);
  const taroCylinder = new THREE.LatheGeometry([p(0, -.085), p(.069, -.085), p(.088, -.068), p(.093, -.043), p(.093, .048), p(.084, .078), p(.064, .087), p(0, .087)], 24);
  const sweetBall = sculptedSphere(.091, .086, .09, .004);
  for (const [mat, offset, geo] of [[taro, -.3, taroCylinder], [sweet, .29, sweetBall]] as const) {
    scatter(geo, mat, 12, group, (o, i) => {
      const a = i * 2.39996, r = .06 + rand() * .27;
      o.position.set(offset + Math.cos(a) * r, .6 + rand() * .065, .08 + Math.sin(a) * r); o.rotation.set(rand() * .3, rand() * tau, rand() * .3); o.scale.set(1, .85 + rand() * .3, 1);
    });
  }
  const bean = material('#663229', 645, .42);
  scatter(sculptedSphere(.033, .025, .058, .006), bean, 48, group, o => {
    const a = rand() * tau, r = Math.sqrt(rand()) * .24; o.position.set(Math.cos(a) * r, .585 + rand() * .03, -.39 + Math.sin(a) * r); o.rotation.y = rand() * tau;
  });
  const metal = new THREE.MeshPhysicalMaterial({ color: '#dad6c8', metalness: .92, roughness: .2, side: THREE.DoubleSide });
  const scoop = add(new THREE.SphereGeometry(.15, 32, 16, 0, tau, Math.PI / 2, Math.PI / 2), metal, group, .52, .59, -.3); scoop.scale.set(.75, .28, 1.6); scoop.rotation.z = -.15;
  tube([new THREE.Vector3(.52, .6, -.48), new THREE.Vector3(.6, .68, -.66), new THREE.Vector3(.63, .73, -.85), new THREE.Vector3(.65, .78, -1.01)], .024, metal, group);
  return group;
}

export function createOysterOmelette(): THREE.Group {
  const group = new THREE.Group(); group.name = 'Night market oyster omelette with sweet chili sauce'; dish(group);
  const egg = material('#e6c66c', 814, .5, true);
  add(sculptedSphere(.76, .075, .7, .034), egg, group, 0, .16);
  const starch = new THREE.MeshPhysicalMaterial({ color: '#e6d6ae', roughness: .27, clearcoat: .8, transmission: .08 });
  const rand = random(432);
  scatter(sculptedSphere(.1, .018, .08, .016), starch, 22, group, o => {
    const a = rand() * tau, r = Math.sqrt(rand()) * .57; o.position.set(Math.sin(a) * r, .225, Math.cos(a) * r); o.rotation.y = rand() * tau;
  });
  herbs(group, .235, .61, 55, 836);
  const oyster = material('#c2b59b', 652, .3), mantle = material('#747368', 18, .37);
  for (let i = 0; i < 7; i++) {
    const a = i * 2.399, x = Math.cos(a) * (.28 + i * .03), z = Math.sin(a) * (.28 + i * .03);
    add(sculptedSphere(.125, .04, .085, .022), mantle, group, x, .246, z).rotation.y = a;
    const flesh = add(sculptedSphere(.093, .043, .061, .016), oyster, group, x, .275, z); flesh.rotation.y = a;
    add(sculptedSphere(.036, .029, .031, .008), oyster, group, x + .04 * Math.cos(a), .286, z + .04 * Math.sin(a));
  }
  const sauce = new THREE.MeshPhysicalMaterial({ color: '#b94f2a', roughness: .18, clearcoat: 1 });
  for (let i = 0; i < 4; i++) {
    const points: THREE.Vector3[] = [];
    for (let j = 0; j < 12; j++) { const z = -.52 + j * .095, x = -.41 + i * .26 + Math.sin(j * .8 + i) * .035; points.push(new THREE.Vector3(x, .307 + .009 * Math.cos(j), z)); }
    tube(points, .027, sauce, group, 36);
  }
  return group;
}

// Extruded circular sectors retain real cut faces and horizontal flaky layers.
function wedge(radius: number, height: number, angle: number) {
  const shape = new THREE.Shape(); shape.moveTo(0, 0); shape.lineTo(radius, 0); shape.absarc(0, 0, radius, 0, angle, false); shape.lineTo(0, 0);
  const geo = new THREE.ExtrudeGeometry(shape, { depth: height, bevelEnabled: true, bevelThickness: .005, bevelSize: .006, bevelSegments: 2, curveSegments: 32 });
  geo.rotateX(-Math.PI / 2); geo.computeVertexNormals(); return geo;
}
export function createScallionPancake(): THREE.Group {
  const group = new THREE.Group(); group.name = 'Flaky scallion pancake cut into wedges'; dish(group);
  const crust = material('#eac480', 276, .65, true), crumb = material('#ecd8a6', 34, .8), dark = material('#b69d65', 66, .78);
  const rand = random(851), green = material('#4b713c', 841, .63), layers = [crumb, dark, crumb, crust];
  const sector = tau / 6 - .035;
  for (let i = 0; i < 6; i++) {
    const portion = new THREE.Group(); portion.rotation.y = i * tau / 6; portion.position.set(Math.cos(i * tau / 6) * .025, .102, -Math.sin(i * tau / 6) * .025); group.add(portion);
    for (let j = 0; j < 4; j++) add(wedge(.76, j === 3 ? .025 : .019, sector), layers[j], portion, 0, j * .023);
    scatter(new RoundedBoxGeometry(.03, .006, .016, 1, .003), green, 16, portion, o => {
      const a = .06 + rand() * (sector - .12), r = .12 + Math.sqrt(rand()) * .58; o.position.set(Math.cos(a) * r, .099, -Math.sin(a) * r); o.rotation.y = rand() * tau;
    });
    // Ragged crumbs on both radial cut edges reveal the separate bread layers.
    scatter(new THREE.IcosahedronGeometry(.013, 0), crumb, 24, portion, (o, k) => {
      const a = k % 2 ? sector : 0, r = .13 + rand() * .58; o.position.set(Math.cos(a) * r, .017 + rand() * .067, -Math.sin(a) * r); o.scale.set(1.3, .5, 1); o.rotation.y = a;
    });
  }
  return group;
}
