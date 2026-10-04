import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

// Original modeled interpretations, not scans. Cultural inspiration:
// Taiwan Tourism souvenirs guide: https://eng.taiwan.net.tw/m1.aspx?sNo=0029014

const clay = () => new THREE.MeshPhysicalMaterial({ color: '#9a5135', roughness: 0.69, clearcoat: 0.08 });
const porcelain = () => new THREE.MeshPhysicalMaterial({ color: '#fffaf0', roughness: 0.19, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.12 });
const v = (radius: number, height: number) => new THREE.Vector2(radius, height);

function mesh(geometry: THREE.BufferGeometry, material: THREE.Material, parent: THREE.Group, x = 0, y = 0, z = 0) {
  const object = new THREE.Mesh(geometry, material);
  object.position.set(x, y, z);
  object.castShadow = true;
  object.receiveShadow = true;
  parent.add(object);
  return object;
}

function lathe(points: THREE.Vector2[], material: THREE.Material, parent: THREE.Group, y = 0) {
  return mesh(new THREE.LatheGeometry(points, 96), material, parent, 0, y);
}

function ring(radius: number, thickness: number, height: number, material: THREE.Material, parent: THREE.Group) {
  const object = mesh(new THREE.TorusGeometry(radius, thickness, 12, 96), material, parent, 0, height);
  object.rotation.x = Math.PI / 2;
  return object;
}

function texture(draw: (ctx: CanvasRenderingContext2D, size: number) => void, size = 1024) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  draw(ctx, size);
  const result = new THREE.CanvasTexture(canvas);
  result.colorSpace = THREE.SRGBColorSpace;
  result.anisotropy = 8;
  return result;
}

function random(seed: number) {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function ceramicPattern() {
  return texture((ctx, size) => {
    ctx.fillStyle = '#fffaf0';
    ctx.fillRect(0, 0, size, size);
    ctx.strokeStyle = '#204c89';
    ctx.fillStyle = '#315a96';
    ctx.lineWidth = 4;
    for (const y of [75, 91, 887, 902]) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(size, y); ctx.stroke();
    }
    for (let i = 0; i < 8; i++) {
      const x = i * 128 + 64;
      ctx.beginPath(); ctx.moveTo(x - 26, 850);
      ctx.bezierCurveTo(x + 45, 720, x - 55, 520, x + 8, 255); ctx.stroke();
      for (let j = 0; j < 7; j++) {
        const yy = 320 + j * 69;
        const xx = x + Math.sin(j * 1.8) * 13;
        const direction = j % 2 ? 1 : -1;
        ctx.beginPath(); ctx.moveTo(xx, yy);
        ctx.bezierCurveTo(xx + direction * 56, yy - 54, xx + direction * 60, yy + 12, xx, yy + 9);
        ctx.fill();
      }
      const fx = x + 8, fy = 267;
      for (let petal = 0; petal < 7; petal++) {
        const angle = petal * Math.PI * 2 / 7;
        ctx.save(); ctx.translate(fx, fy); ctx.rotate(angle);
        ctx.beginPath(); ctx.ellipse(0, -23, 10, 24, 0, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
      }
      ctx.beginPath(); ctx.arc(fx, fy, 7, 0, Math.PI * 2); ctx.fill();
    }
  });
}

export function createTeaCup(): THREE.Group {
  const group = new THREE.Group();
  group.name = 'Yingge blue-and-white tea cup';
  const glazed = porcelain();
  const painted = porcelain();
  painted.map = ceramicPattern();
  const cobalt = new THREE.MeshPhysicalMaterial({ color: '#21467b', roughness: 0.2, clearcoat: 1 });
  lathe([v(0, .025), v(.24, .025), v(.35, .035), v(.65, .06), v(.93, .125), v(1, .16), v(1, .185), v(.9, .195), v(.64, .14), v(.32, .095), v(0, .095)], glazed, group);
  ring(.94, .009, .184, cobalt, group);
  ring(.56, .008, .132, cobalt, group);
  lathe([v(.25, .1), v(.28, .12), v(.28, .2), v(.25, .23), v(.2, .23), v(.2, .12), v(.25, .1)], glazed, group);
  const exterior = lathe([v(0, .18), v(.25, .18), v(.29, .24), v(.36, .32), v(.43, .47), v(.49, .67), v(.53, .9), v(.55, 1.04), v(.55, 1.07)], painted, group);
  // Paint follows physical height, rather than the lathe profile's point index.
  const uv = exterior.geometry.getAttribute('uv');
  const position = exterior.geometry.getAttribute('position');
  for (let i = 0; i < uv.count; i++) uv.setY(i, (position.getY(i) - .18) / .89);
  lathe([v(.55, 1.07), v(.515, 1.07), v(.51, 1.02), v(.48, .88), v(.44, .66), v(.38, .46), v(.31, .32), v(.23, .25), v(0, .25)], glazed, group);
  ring(.534, .015, 1.064, cobalt, group);
  const handlePath = new THREE.CubicBezierCurve3(new THREE.Vector3(.49, .89, 0), new THREE.Vector3(1.04, 1.02, 0), new THREE.Vector3(1.02, .3, 0), new THREE.Vector3(.35, .37, 0));
  mesh(new THREE.TubeGeometry(handlePath, 64, .052, 14, false), glazed, group);
  const tea = new THREE.MeshPhysicalMaterial({ color: '#a35819', roughness: .13, transparent: true, opacity: .84, clearcoat: 1 });
  const surface = mesh(new THREE.CircleGeometry(.48, 96), tea, group, 0, .882);
  surface.rotation.x = -Math.PI / 2;
  ring(.472, .007, .883, tea, group);
  return group;
}

function taperedTube(curve: THREE.Curve<THREE.Vector3>, startRadius: number, endRadius: number, material: THREE.Material, parent: THREE.Group) {
  const segments = 64, sides = 24;
  const frames = curve.computeFrenetFrames(segments, false);
  const positions: number[] = [], indices: number[] = [];
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const center = curve.getPointAt(t);
    const radius = startRadius + (endRadius - startRadius) * t;
    for (let side = 0; side <= sides; side++) {
      const theta = side / sides * Math.PI * 2;
      const point = center.clone().addScaledVector(frames.normals[i], Math.cos(theta) * radius).addScaledVector(frames.binormals[i], Math.sin(theta) * radius);
      positions.push(point.x, point.y, point.z);
      if (i < segments && side < sides) {
        const a = i * (sides + 1) + side, b = a + sides + 1;
        indices.push(a, b, a + 1, b, b + 1, a + 1);
      }
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices); geometry.computeVertexNormals();
  return mesh(geometry, material, parent);
}

export function createTeapot(): THREE.Group {
  const group = new THREE.Group();
  group.name = 'Hand-shaped gongfu clay teapot';
  const terracotta = clay();
  const grain = texture((ctx, size) => {
    const rng = random(71);
    ctx.fillStyle = '#a56343'; ctx.fillRect(0, 0, size, size);
    for (let i = 0; i < 22000; i++) {
      ctx.fillStyle = rng() > .5 ? 'rgba(52,22,10,0.13)' : 'rgba(255,230,194,0.14)';
      const r = .5 + rng() * 1.2;
      ctx.fillRect(rng() * size, rng() * size, r, r);
    }
  });
  terracotta.map = grain;
  terracotta.bumpMap = grain;
  terracotta.bumpScale = .012;
  lathe([v(0, .1), v(.29, .1), v(.4, .13), v(.58, .24), v(.69, .43), v(.72, .63), v(.69, .81), v(.6, .97), v(.43, 1.05), v(.34, 1.065), v(.34, 1.01), v(.4, 1), v(.55, .92), v(.63, .78), v(.66, .6), v(.62, .42), v(.49, .28), v(.3, .18), v(0, .18)], terracotta, group);
  lathe([v(.28, .02), v(.32, .02), v(.33, .13), v(.28, .16), v(.28, .02)], terracotta, group);
  lathe([v(0, 1.09), v(.12, 1.085), v(.28, 1.08), v(.4, 1.06), v(.43, 1.09), v(.36, 1.135), v(.25, 1.17), v(.1, 1.19), v(0, 1.19)], terracotta, group);
  mesh(new THREE.SphereGeometry(.105, 32, 20), terracotta, group, 0, 1.255).scale.set(1, .75, 1);
  mesh(new THREE.CylinderGeometry(.043, .07, .06, 32), terracotta, group, 0, 1.2);
  const vent = mesh(new THREE.CircleGeometry(.013, 20), new THREE.MeshStandardMaterial({ color: '#3e2118' }), group, .19, 1.182);
  vent.rotation.x = -Math.PI / 2;
  const spout = new THREE.CubicBezierCurve3(new THREE.Vector3(.52, .4, 0), new THREE.Vector3(.98, .46, 0), new THREE.Vector3(.95, .98, 0), new THREE.Vector3(1.15, 1.08, 0));
  taperedTube(spout, .18, .073, terracotta, group);
  const dark = new THREE.MeshStandardMaterial({ color: '#492319', roughness: .94, side: THREE.DoubleSide });
  const mouth = mesh(new THREE.CircleGeometry(.059, 32), dark, group, 1.15, 1.078);
  const direction = spout.getTangent(1);
  mouth.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), direction);
  const lip = mesh(new THREE.TorusGeometry(.072, .012, 10, 32), terracotta, group, 1.15, 1.08);
  lip.quaternion.copy(mouth.quaternion);
  const handle = new THREE.CubicBezierCurve3(new THREE.Vector3(-.57, .89, 0), new THREE.Vector3(-1.26, 1.12, 0), new THREE.Vector3(-1.32, .16, 0), new THREE.Vector3(-.55, .32, 0));
  mesh(new THREE.TubeGeometry(handle, 72, .075, 18, false), terracotta, group);
  const stamp = mesh(new THREE.CircleGeometry(.105, 32), new THREE.MeshStandardMaterial({ color: '#884127', roughness: .9 }), group, 0, .025);
  stamp.rotation.x = Math.PI / 2;
  group.scale.setScalar(.91);
  return group;
}

export function createPineappleCake(): THREE.Group {
  const group = new THREE.Group();
  group.name = 'Taiwan pineapple shortcake with cut filling';
  const crustMap = texture((ctx, size) => {
    const rng = random(403);
    ctx.fillStyle = '#dba85d'; ctx.fillRect(0, 0, size, size);
    for (let i = 0; i < 17000; i++) {
      const r = .3 + rng() * 3;
      ctx.fillStyle = rng() > .37 ? 'rgba(123,67,24,0.15)' : 'rgba(255,236,174,0.5)';
      ctx.beginPath(); ctx.ellipse(rng() * size, rng() * size, r, r * .6, rng() * 6, 0, Math.PI * 2); ctx.fill();
    }
  });
  const crust = new THREE.MeshStandardMaterial({ color: '#f3cf82', map: crustMap, bumpMap: crustMap, bumpScale: .027, roughness: .9 });
  const crumb = new THREE.MeshStandardMaterial({ color: '#f7d999', roughness: 1, map: crustMap, bumpMap: crustMap, bumpScale: .018 });
  const fillingMap = texture((ctx, size) => {
    const rng = random(902);
    ctx.fillStyle = '#a06418'; ctx.fillRect(0, 0, size, size);
    for (let i = 0; i < 6500; i++) {
      ctx.strokeStyle = rng() > .5 ? 'rgba(255,197,62,0.65)' : 'rgba(88,47,8,0.42)';
      ctx.lineWidth = 1 + rng() * 4;
      const x = rng() * size, y = rng() * size;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + rng() * 24 - 12, y + 6 + rng() * 27); ctx.stroke();
    }
  });
  const filling = new THREE.MeshPhysicalMaterial({ color: '#d59b29', map: fillingMap, bumpMap: fillingMap, bumpScale: .04, roughness: .56, clearcoat: .16 });
  const wrapperMap = texture((ctx, size) => {
    ctx.fillStyle = '#f6edd8'; ctx.fillRect(0, 0, size, size);
    ctx.strokeStyle = '#b89454'; ctx.lineWidth = 6; ctx.strokeRect(35, 35, size - 70, size - 70);
    ctx.fillStyle = '#477160'; ctx.textAlign = 'center';
    ctx.font = '64px serif'; ctx.fillText('鳳 梨 酥', size / 2, 175);
    ctx.font = '25px sans-serif'; ctx.fillText('TAIWAN · PINEAPPLE CAKE', size / 2, 224);
    ctx.strokeStyle = '#b89454'; ctx.lineWidth = 3;
    for (let i = 0; i < 13; i++) {
      ctx.beginPath(); ctx.moveTo(60 + i * 70, 350); ctx.lineTo(200 + i * 70, 850); ctx.stroke();
    }
  });
  const paper = new THREE.MeshStandardMaterial({ map: wrapperMap, roughness: .94, side: THREE.DoubleSide });
  const wrapperGeometry = new THREE.PlaneGeometry(2.15, 1.65, 32, 24);
  const wrapperPositions = wrapperGeometry.attributes.position;
  for (let i = 0; i < wrapperPositions.count; i++) {
    const x = wrapperPositions.getX(i), y = wrapperPositions.getY(i);
    const edgeCurl = .08 * Math.pow(Math.abs(x) / 1.075, 8) + .055 * Math.pow(Math.abs(y) / .825, 8);
    wrapperPositions.setZ(i, edgeCurl + .005 * Math.sin(x * 21 + y * 9));
  }
  wrapperGeometry.computeVertexNormals();
  const sheet = mesh(wrapperGeometry, paper, group, 0, .018);
  sheet.rotation.x = -Math.PI / 2; sheet.rotation.z = -.12;
  for (const [x, width, angle] of [[-.35, .98, -.1], [.55, .55, .18]]) {
    const piece = new THREE.Group(); group.add(piece); piece.position.set(x, .04, 0); piece.rotation.y = angle;
    mesh(new RoundedBoxGeometry(width, .58, 1.02, 5, .07), crust, piece, 0, .3);
    const cutX = x < 0 ? width / 2 + .002 : -width / 2 - .002;
    const cut = mesh(new RoundedBoxGeometry(.018, .46, .89, 4, .03), crumb, piece, cutX, .3);
    cut.name = 'Fresh shortbread cross-section';
    mesh(new RoundedBoxGeometry(.022, .28, .72, 5, .045), filling, piece, cutX + (x < 0 ? .009 : -.009), .3);
    const rng = random(x < 0 ? 91 : 151);
    const toasted = new THREE.MeshStandardMaterial({ color: '#b48543', roughness: 1 });
    for (let i = 0; i < 70; i++) {
      const pore = mesh(new THREE.SphereGeometry(.004 + rng() * .007, 6, 4), toasted, piece, (rng() - .5) * (width - .14), .592, (rng() - .5) * .87);
      pore.scale.y = .18;
    }
  }
  const crumbs = new THREE.MeshStandardMaterial({ color: '#e5bb72', roughness: 1 });
  const rng = random(727);
  for (let i = 0; i < 28; i++) {
    const crumbMesh = mesh(new THREE.IcosahedronGeometry(.01 + rng() * .012, 0), crumbs, group, -.02 + rng() * .25, .035, (rng() - .5) * .9);
    crumbMesh.rotation.set(rng() * 6, rng() * 6, rng() * 6);
  }
  return group;
}

export function createBubbleTea(): THREE.Group {
  const group = new THREE.Group();
  group.name = 'Taiwan pearl milk tea';
  const plastic = new THREE.MeshPhysicalMaterial({ color: '#fffefa', roughness: .08, transmission: .97, thickness: .028, ior: 1.46, transparent: true, opacity: .42, clearcoat: 1, side: THREE.DoubleSide });
  lathe([v(0, .025), v(.35, .025), v(.38, .08), v(.45, 1.37), v(.48, 1.43), v(.48, 1.46), v(.455, 1.46), v(.427, 1.37), v(.359, .08), v(0, .055)], plastic, group);
  const milkTea = new THREE.MeshPhysicalMaterial({ color: '#c89665', roughness: .43, clearcoat: .35 });
  lathe([v(0, .35), v(.363, .35), v(.407, 1.16), v(0, 1.16)], milkTea, group);
  const syrup = new THREE.MeshPhysicalMaterial({ color: '#804722', roughness: .18, transparent: true, opacity: .43, transmission: .35, thickness: .2, clearcoat: .5 });
  lathe([v(0, .055), v(.347, .055), v(.363, .35), v(0, .35)], syrup, group);
  const pearlMaterial = new THREE.MeshPhysicalMaterial({ color: '#27170f', roughness: .2, clearcoat: .8 });
  const rng = random(1002);
  const pearlGeometry = new THREE.SphereGeometry(.046, 16, 12);
  // Pearls cluster at the base; visible near the transparent wall.
  for (let row = 0; row < 4; row++) {
    const count = 19 + row;
    for (let i = 0; i < count; i++) {
      const angle = i / count * Math.PI * 2 + row * .18;
      const radius = .313 + row * .004;
      mesh(pearlGeometry, pearlMaterial, group, Math.cos(angle) * radius, .104 + row * .073 + rng() * .014, Math.sin(angle) * radius);
    }
  }
  const lid = new THREE.MeshPhysicalMaterial({ color: '#fbf2e4', roughness: .23, clearcoat: .7 });
  lathe([v(0, 1.465), v(.48, 1.465), v(.5, 1.485), v(.5, 1.515), v(.46, 1.53), v(.14, 1.53), v(.14, 1.515), v(0, 1.515)], lid, group);
  ring(.487, .01, 1.486, plastic, group);
  ring(.476, .008, 1.524, lid, group);
  const strawMaterial = new THREE.MeshStandardMaterial({ color: '#9a4334', roughness: .48, side: THREE.DoubleSide });
  const straw = lathe([v(.045, 0), v(.052, 0), v(.052, 1.77), v(.045, 1.77), v(.045, 0)], strawMaterial, group);
  straw.rotation.z = -.11; straw.position.set(-.075, .2, .04);
  const labelMap = texture((ctx, size) => {
    ctx.fillStyle = '#f8f1df'; ctx.fillRect(0, 0, size, size);
    ctx.strokeStyle = '#315e53'; ctx.lineWidth = 8; ctx.strokeRect(50, 60, size - 100, size - 120);
    ctx.fillStyle = '#315e53'; ctx.textAlign = 'center';
    ctx.font = '112px serif'; ctx.fillText('茶', size / 2, 410);
    ctx.font = '44px sans-serif'; ctx.fillText('TAIWAN', size / 2, 535);
    ctx.font = '29px sans-serif'; ctx.fillText('PEARL MILK TEA', size / 2, 615);
    ctx.font = '22px sans-serif'; ctx.fillText('慢慢喝 · TAKE YOUR TIME', size / 2, 710);
  });
  const labelMaterial = new THREE.MeshStandardMaterial({ map: labelMap, roughness: .78, side: THREE.DoubleSide });
  mesh(new THREE.CylinderGeometry(.439, .406, .61, 48, 1, true, -.69, 1.38), labelMaterial, group, 0, .805);
  const bubblesMaterial = new THREE.MeshPhysicalMaterial({ color: '#e2bf91', roughness: .23, clearcoat: 1 });
  for (let i = 0; i < 12; i++) {
    const angle = rng() * Math.PI * 2, radius = .27 + rng() * .11;
    mesh(new THREE.SphereGeometry(.008 + rng() * .009, 10, 8), bubblesMaterial, group, Math.cos(angle) * radius, 1.159, Math.sin(angle) * radius).scale.y = .35;
  }
  return group;
}
