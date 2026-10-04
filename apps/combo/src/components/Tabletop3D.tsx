import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { souvenirs } from '../souvenirs/catalog';

export type TableObject = {
  id: string;
  modelId: string;
  label: string;
  x: number;
  z: number;
  inCollection: boolean;
  group: string;
  locked: boolean;
  owner?: string;
};

type Props = {
  objects: TableObject[];
  selectedId: string | null;
  highlightedIds?: string[];
  onMove: (id: string, x: number, z: number, inCollection: boolean) => void;
  onSelect: (id: string) => void;
  onInspect: (id: string) => void;
};

type DisplayObject = {
  root: THREE.Group;
  modelId: string;
  halo: THREE.Mesh<THREE.RingGeometry, THREE.MeshBasicMaterial>;
  data: TableObject;
  lift: number;
};

function disposeObject(object: THREE.Object3D) {
  const geometries = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>();
  const textures = new Set<THREE.Texture>();
  object.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return;
    geometries.add(child.geometry);
    for (const material of Array.isArray(child.material) ? child.material : [child.material]) {
      materials.add(material);
      for (const value of Object.values(material)) if (value instanceof THREE.Texture) textures.add(value);
    }
  });
  geometries.forEach((geometry) => geometry.dispose());
  textures.forEach((texture) => texture.dispose());
  materials.forEach((material) => material.dispose());
}

function surfaceTexture(kind: 'wood' | 'linen', color: string) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 1024;
  const context = canvas.getContext('2d')!;
  context.fillStyle = color;
  context.fillRect(0, 0, 1024, 1024);
  if (kind === 'wood') {
    // Long, gently wandering grain rather than a repeating plank pattern.
    for (let line = 0; line < 480; line++) {
      context.beginPath();
      context.strokeStyle = line % 3 ? 'rgba(45,24,12,.13)' : 'rgba(255,224,174,.17)';
      context.lineWidth = line % 7 === 0 ? 2 : 0.6;
      for (let x = 0; x <= 1024; x += 8) {
        const y = line * 2.2 + Math.sin(x * 0.009 + line * 0.15) * 5 + Math.sin(x * 0.021 + line) * 1.8;
        if (x === 0) context.moveTo(x, y); else context.lineTo(x, y);
      }
      context.stroke();
    }
  } else {
    for (let thread = 0; thread < 1024; thread += 4) {
      context.fillStyle = thread % 8 ? 'rgba(255,255,255,.22)' : 'rgba(80,65,44,.12)';
      context.fillRect(thread, 0, 1, 1024);
      context.fillRect(0, thread, 1024, 1);
    }
  }
  for (let index = 0; index < 24000; index++) {
    const x = (index * 73.31) % 1024;
    const y = (index * 113.79) % 1024;
    context.fillStyle = index % 2 ? 'rgba(70,49,28,.045)' : 'rgba(255,255,245,.15)';
    context.fillRect(x, y, 1, 1);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.anisotropy = 8;
  return texture;
}

function roundedOutline(width: number, depth: number, radius: number) {
  const outline = new THREE.Shape();
  const x = -width / 2;
  const y = -depth / 2;
  outline.moveTo(x + radius, y);
  outline.lineTo(x + width - radius, y);
  outline.quadraticCurveTo(x + width, y, x + width, y + radius);
  outline.lineTo(x + width, y + depth - radius);
  outline.quadraticCurveTo(x + width, y + depth, x + width - radius, y + depth);
  outline.lineTo(x + radius, y + depth);
  outline.quadraticCurveTo(x, y + depth, x, y + depth - radius);
  outline.lineTo(x, y + radius);
  outline.quadraticCurveTo(x, y, x + radius, y);
  return outline;
}

export function Tabletop3D(props: Props) {
  const host = useRef<HTMLDivElement>(null);
  const current = useRef(props);
  const runtime = useRef<{ sync: () => void; zoom: (factor: number) => void; reset: () => void } | null>(null);
  current.current = props;

  useEffect(() => {
    const element = host.current!;
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    const canvas = renderer.domElement;
    canvas.setAttribute('aria-label', 'Souvenir table. Scroll to zoom, drag empty space to rotate, right-drag to pan. Drag souvenirs into the tray, or click to inspect. Use arrow keys to move a selected souvenir and Enter to inspect.');
    canvas.tabIndex = 0;
    element.appendChild(canvas);

    const scene = new THREE.Scene();
    const room = new RoomEnvironment();
    const pmrem = new THREE.PMREMGenerator(renderer);
    const environment = pmrem.fromScene(room, 0.04);
    scene.environment = environment.texture;
    scene.environmentIntensity = 0.65;
    room.dispose();
    pmrem.dispose();

    const camera = new THREE.OrthographicCamera(-7, 7, 5, -5, 0.1, 100);
    const theme = getComputedStyle(element);
    const woodMap = surfaceTexture('wood', theme.getPropertyValue('--tray-wood').trim());
    const linenMap = surfaceTexture('linen', theme.getPropertyValue('--tray-linen').trim());
    linenMap.repeat.set(3, 1);
    const tableSurface = new THREE.MeshBasicMaterial({ color: theme.getPropertyValue('--table-scene-background').trim(), toneMapped: false });
    const walnut = new THREE.MeshStandardMaterial({ map: woodMap, bumpMap: woodMap, bumpScale: 0.025, roughness: 0.48 });
    const trayLining = new THREE.MeshStandardMaterial({ map: linenMap, bumpMap: linenMap, bumpScale: 0.035, roughness: 1 });
    function box(width: number, height: number, depth: number, material: THREE.Material, x: number, y: number, z: number) {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), material);
      mesh.position.set(x, y, z);
      mesh.receiveShadow = true;
      mesh.castShadow = true;
      scene.add(mesh);
      return mesh;
    }
    const tabletop = box(40, 0.2, 40, tableSurface, 0, -0.11, 0);
    tabletop.castShadow = false;
    tabletop.receiveShadow = false;
    function trayPart(outline: THREE.Shape, height: number, bevel: number, material: THREE.Material, y: number) {
      const geometry = new THREE.ExtrudeGeometry(outline, { depth: height, bevelEnabled: true, bevelSegments: 4, steps: 1, bevelSize: bevel, bevelThickness: bevel, curveSegments: 24 });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.rotation.x = -Math.PI / 2;
      mesh.position.set(0, y, 2.2);
      mesh.castShadow = mesh.receiveShadow = true;
      scene.add(mesh);
    }
    trayPart(roundedOutline(10.6, 2.8, 0.34), 0.08, 0.035, walnut, 0.035);
    const rim = roundedOutline(10.6, 2.8, 0.34);
    const inside = roundedOutline(10.1, 2.3, 0.24);
    rim.holes.push(new THREE.Path(inside.getPoints(24).reverse()));
    trayPart(rim, 0.2, 0.055, walnut, 0.11);
    trayPart(roundedOutline(10.08, 2.28, 0.23), 0.015, 0.008, trayLining, 0.12);

    scene.add(new THREE.HemisphereLight(0xfff7e7, 0x7e8977, 1.5));
    const key = new THREE.DirectionalLight(0xffefd5, 2.8);
    key.position.set(-6, 9, -5);
    key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048);
    key.shadow.camera.left = -8;
    key.shadow.camera.right = 8;
    key.shadow.camera.top = 7;
    key.shadow.camera.bottom = -7;
    key.shadow.camera.far = 25;
    key.shadow.normalBias = 0.025;
    key.shadow.bias = -0.00015;
    key.shadow.radius = 3;
    scene.add(key);
    const fill = new THREE.DirectionalLight(0xe3eceb, 0.65);
    fill.position.set(5, 5, 3);
    scene.add(fill);

    const displays = new Map<string, DisplayObject>();
    const drags = new Map<number, { id: string; offset: THREE.Vector3; start: THREE.Vector3; pointerX: number; pointerY: number; moved: boolean }>();
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    camera.position.set(0, 10.7, 8.6);
    const controls = new OrbitControls(camera, canvas);
    controls.target.set(0, 0, -1.2);
    controls.enableDamping = !reducedMotion;
    controls.minZoom = 0.7;
    controls.maxZoom = 4;
    controls.minPolarAngle = 0.12;
    controls.maxPolarAngle = Math.PI / 2 - 0.15;
    controls.update();
    controls.saveState();
    const haptic = () => { if ('vibrate' in navigator) navigator.vibrate(8); };
    const isDragged = (id: string) => [...drags.values()].some((drag) => drag.id === id);
    const inTray = (x: number, z: number) => Math.abs(x) <= 5.05 && z >= 1.05 && z <= 3.35;
    const groundHeight = (x: number, z: number) => inTray(x, z) ? 0.15 : 0.012;

    function sync() {
      const next = current.current;
      for (const [id, display] of displays) {
        if (!next.objects.some((object) => object.id === id && object.modelId === display.modelId)) {
          for (const [pointerId, drag] of drags) if (drag.id === id) drags.delete(pointerId);
          scene.remove(display.root);
          disposeObject(display.root);
          displays.delete(id);
        }
      }
      for (const data of next.objects) {
        let display = displays.get(data.id);
        if (!display) {
          const souvenir = souvenirs.find((candidate) => candidate.id === data.modelId);
          if (!souvenir) continue;
          const root = new THREE.Group();
          root.userData.tableObjectId = data.id;
          const model = souvenir.create();
          const bounds = new THREE.Box3().setFromObject(model);
          const size = bounds.getSize(new THREE.Vector3());
          const center = bounds.getCenter(new THREE.Vector3());
          const seed = [...data.id].reduce((sum, letter) => sum + letter.charCodeAt(0), 0);
          const scale = (0.78 + (seed % 7) * 0.04) / Math.max(size.x, size.y, size.z);
          model.scale.setScalar(scale);
          model.position.set(-center.x * scale, -bounds.min.y * scale, -center.z * scale);
          const orientation = new THREE.Group();
          orientation.rotation.y = Math.sin(seed * 12.9898) * 0.7;
          orientation.add(model);
          root.add(orientation);
          model.traverse((child) => { if (child instanceof THREE.Mesh) { child.castShadow = true; child.receiveShadow = true; } });
          const halo = new THREE.Mesh(new THREE.RingGeometry(0.47, 0.49, 64), new THREE.MeshBasicMaterial({ color: theme.getPropertyValue('--jade').trim(), transparent: true, opacity: 0.6, depthWrite: false, side: THREE.DoubleSide }));
          halo.rotation.x = -Math.PI / 2;
          halo.position.y = 0.002;
          root.add(halo);
          root.position.set(data.x, groundHeight(data.x, data.z), data.z);
          display = { root, modelId: data.modelId, halo, data, lift: 0 };
          displays.set(data.id, display);
          scene.add(root);
        }
        display.data = data;
        if (!isDragged(data.id)) {
          display.root.position.x = data.x;
          display.root.position.z = data.z;
        }
        const selected = next.selectedId === data.id || Boolean(next.highlightedIds?.includes(data.id));
        display.halo.visible = selected || Boolean(data.group) || data.locked;
        display.halo.material.color.set(theme.getPropertyValue(selected ? '--jade' : data.locked ? '--vermilion' : data.group === 'one' ? '--jade-selected' : '--muted').trim());
        display.halo.material.opacity = selected ? 0.8 : 0.4;
      }
    }
    runtime.current = {
      sync,
      zoom: (factor) => {
        camera.zoom = THREE.MathUtils.clamp(camera.zoom * factor, controls.minZoom, controls.maxZoom);
        camera.updateProjectionMatrix();
        controls.update();
      },
      reset: () => controls.reset(),
    };
    sync();

    function pointAt(event: PointerEvent | MouseEvent) {
      const rect = canvas.getBoundingClientRect();
      pointer.set((event.clientX - rect.left) / rect.width * 2 - 1, -(event.clientY - rect.top) / rect.height * 2 + 1);
      raycaster.setFromCamera(pointer, camera);
    }
    function hit() {
      const candidates = [...displays.values()].map((display) => display.root.children[0]);
      const intersection = raycaster.intersectObjects(candidates, true)[0];
      let object: THREE.Object3D | null = intersection?.object ?? null;
      while (object && !object.userData.tableObjectId) object = object.parent;
      return object ? displays.get(object.userData.tableObjectId as string) : undefined;
    }
    function pointerDown(event: PointerEvent) {
      if (event.button !== 0) return;
      pointAt(event);
      const display = hit();
      if (!display || isDragged(display.data.id)) return;
      const point = raycaster.ray.intersectPlane(plane, new THREE.Vector3());
      if (!point) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      controls.enabled = false;
      canvas.focus({ preventScroll: true });
      canvas.setPointerCapture(event.pointerId);
      drags.set(event.pointerId, { id: display.data.id, offset: display.root.position.clone().sub(point), start: display.root.position.clone(), pointerX: event.clientX, pointerY: event.clientY, moved: false });
      display.lift = reducedMotion ? 0.12 : 0.32;
      current.current.onSelect(display.data.id);
      canvas.classList.add('is-dragging');
      canvas.classList.remove('is-hovering');
      haptic();
    }
    function pointerMove(event: PointerEvent) {
      pointAt(event);
      const drag = drags.get(event.pointerId);
      if (!drag) { if (event.pointerType !== 'touch') canvas.classList.toggle('is-hovering', Boolean(hit())); return; }
      if (Math.hypot(event.clientX - drag.pointerX, event.clientY - drag.pointerY) > 6) drag.moved = true;
      if (!drag.moved) return;
      const display = displays.get(drag.id);
      const point = raycaster.ray.intersectPlane(plane, new THREE.Vector3());
      if (!display || !point) return;
      display.root.position.x = point.x + drag.offset.x;
      display.root.position.z = point.z + drag.offset.z;
    }
    function pointerUp(event: PointerEvent) {
      const drag = drags.get(event.pointerId);
      if (!drag) return;
      drags.delete(event.pointerId);
      controls.enabled = drags.size === 0;
      const display = displays.get(drag.id);
      if (display) {
        display.lift = 0;
        if (event.type === 'pointercancel' || event.type === 'lostpointercapture') {
          display.root.position.x = drag.start.x;
          display.root.position.z = drag.start.z;
        } else if (!drag.moved) {
          display.root.position.x = drag.start.x;
          display.root.position.z = drag.start.z;
          current.current.onInspect(drag.id);
        } else {
          const { x, z } = display.root.position;
          current.current.onMove(drag.id, x, z, inTray(x, z));
          haptic();
        }
      }
      if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
      canvas.classList.toggle('is-dragging', drags.size > 0);
      canvas.classList.remove('is-hovering');
    }
    function keyboard(event: KeyboardEvent) {
      const id = current.current.selectedId;
      if (!id) return;
      if (event.key === 'Enter') { event.preventDefault(); current.current.onInspect(id); return; }
      const direction: Record<string, [number, number]> = { ArrowLeft: [-0.3, 0], ArrowRight: [0.3, 0], ArrowUp: [0, -0.3], ArrowDown: [0, 0.3] };
      const step = direction[event.key];
      const display = displays.get(id);
      if (!step || !display) return;
      event.preventDefault();
      const x = display.root.position.x + step[0];
      const z = display.root.position.z + step[1];
      current.current.onMove(id, x, z, inTray(x, z));
    }
    const pointerLeave = () => { if (!drags.size) canvas.classList.remove('is-hovering'); };
    canvas.addEventListener('pointerdown', pointerDown, true);
    canvas.addEventListener('pointermove', pointerMove);
    canvas.addEventListener('pointerup', pointerUp);
    canvas.addEventListener('pointercancel', pointerUp);
    canvas.addEventListener('lostpointercapture', pointerUp);
    canvas.addEventListener('pointerleave', pointerLeave);
    canvas.addEventListener('keydown', keyboard);

    const resize = new ResizeObserver(() => {
      const { width, height } = element.getBoundingClientRect();
      if (!width || !height) return;
      renderer.setSize(width, height);
      const aspect = width / height;
      const viewHeight = Math.max(9.8, 12.8 / aspect);
      camera.left = -viewHeight * aspect / 2;
      camera.right = viewHeight * aspect / 2;
      camera.top = viewHeight / 2;
      camera.bottom = -viewHeight / 2;
      camera.updateProjectionMatrix();
    });
    resize.observe(element);
    let previous = 0;
    renderer.setAnimationLoop((time) => {
      const delta = Math.min((time - previous) / 1000, 0.05);
      previous = time;
      for (const display of displays.values()) {
        const target = groundHeight(display.root.position.x, display.root.position.z) + display.lift;
        display.root.position.y = reducedMotion ? target : THREE.MathUtils.damp(display.root.position.y, target, 16, delta);
        display.halo.position.y = 0.002 - (display.root.position.y - groundHeight(display.root.position.x, display.root.position.z));
      }
      if (controls.enabled) controls.update();
      renderer.render(scene, camera);
    });

    return () => {
      runtime.current = null;
      resize.disconnect();
      renderer.setAnimationLoop(null);
      controls.dispose();
      canvas.removeEventListener('pointerdown', pointerDown, true);
      canvas.removeEventListener('pointermove', pointerMove);
      canvas.removeEventListener('pointerup', pointerUp);
      canvas.removeEventListener('pointercancel', pointerUp);
      canvas.removeEventListener('lostpointercapture', pointerUp);
      canvas.removeEventListener('pointerleave', pointerLeave);
      canvas.removeEventListener('keydown', keyboard);
      drags.clear();
      displays.clear();
      disposeObject(scene);
      key.shadow.dispose();
      environment.dispose();
      renderer.dispose();
      canvas.remove();
    };
  }, []);

  useEffect(() => { runtime.current?.sync(); }, [props.objects, props.selectedId, props.highlightedIds]);

  return <div className="tt-scene">
    <div className="tt-canvas" ref={host} />
  </div>;
}
