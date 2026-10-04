import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { GLTFExporter } from "three/addons/exporters/GLTFExporter.js";
import type { Souvenir } from "./catalog";

export function SouvenirViewer({ souvenir, showExport = true }: { souvenir: Souvenir; showExport?: boolean }) {
  const host = useRef<HTMLDivElement>(null);
  const model = useRef<THREE.Group | null>(null);
  const reset = useRef<(() => void) | null>(null);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState("");

  useEffect(() => {
    const element = host.current!;
    setExportError("");
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    renderer.domElement.setAttribute("aria-label", `Interactive 3D model: ${souvenir.name}. Drag to rotate, scroll to zoom.`);
    element.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const room = new RoomEnvironment();
    const pmrem = new THREE.PMREMGenerator(renderer);
    const environment = pmrem.fromScene(room, 0.04);
    scene.environment = environment.texture;
    scene.environmentIntensity = 0.75;
    room.dispose();
    pmrem.dispose();

    const object = new THREE.Group();
    const asset = souvenir.create();
    object.add(asset);
    object.name = souvenir.id;
    object.userData = { name: souvenir.name, origin: souvenir.origin, description: souvenir.description };
    const bounds = new THREE.Box3().setFromObject(object);
    const size = bounds.getSize(new THREE.Vector3());
    const center = bounds.getCenter(new THREE.Vector3());
    const scale = 2.5 / Math.max(size.x, size.y, size.z);
    object.scale.setScalar(scale);
    const lift = souvenir.hanging ? 0.32 : 0.015;
    object.position.set(-center.x * scale, -bounds.min.y * scale + lift, -center.z * scale);
    if (souvenir.hanging) {
      const anchor = new THREE.Vector3().fromArray(asset.userData.hangAnchor);
      asset.localToWorld(anchor);
      object.position.x -= anchor.x;
      object.position.z -= anchor.z;
      const fitting = new THREE.MeshStandardMaterial({ color: 0xcda554, metalness: 0.58, roughness: 0.36 });
      const rail = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.85, 32), fitting);
      rail.rotation.z = Math.PI / 2;
      rail.position.set(0, anchor.y + 0.16, 0);
      scene.add(rail);
      const hook = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, anchor.y + 0.16, 0),
        new THREE.Vector3(0, anchor.y + 0.07, 0.035),
        new THREE.Vector3(0, anchor.y, 0),
        new THREE.Vector3(0, anchor.y + 0.04, -0.035),
      ]), 32, 0.01, 12), fitting);
      scene.add(hook);
    }
    object.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
    scene.add(object);
    model.current = object;

    const floor = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), new THREE.ShadowMaterial({ opacity: 0.16 }));
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    floor.visible = !souvenir.hanging;
    scene.add(floor);
    scene.add(new THREE.HemisphereLight(0xfff8ed, 0x8b9385, 1.5));
    const key = new THREE.DirectionalLight(0xffeed9, 3.5);
    key.position.set(-3, 6, 4);
    key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048);
    key.shadow.camera.left = -4;
    key.shadow.camera.right = 4;
    key.shadow.camera.top = 4;
    key.shadow.camera.bottom = -4;
    key.shadow.normalBias = 0.025;
    scene.add(key);
    const rim = new THREE.DirectionalLight(0xe2efff, 2);
    rim.position.set(4, 3, -4);
    scene.add(rim);

    const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 100);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.enablePan = false;
    controls.minDistance = 2.5;
    controls.maxDistance = 10;
    controls.maxPolarAngle = Math.PI * 0.85;
    const resetCamera = () => {
      if (souvenir.hanging) camera.position.set(1.3, 1.9, 5.1);
      else camera.position.set(3.3, 2.8, 4.8);
      controls.target.set(0, size.y * scale * 0.43 + lift, 0);
      controls.update();
    };
    resetCamera();
    reset.current = resetCamera;
    const resize = new ResizeObserver(() => {
      const { width, height } = element.getBoundingClientRect();
      renderer.setSize(width, height);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    });
    resize.observe(element);
    renderer.setAnimationLoop(() => {
      controls.update();
      renderer.render(scene, camera);
    });

    return () => {
      reset.current = null;
      model.current = null;
      resize.disconnect();
      renderer.setAnimationLoop(null);
      controls.dispose();
      const geometries = new Set<THREE.BufferGeometry>();
      const materials = new Set<THREE.Material>();
      const textures = new Set<THREE.Texture>();
      scene.traverse((child) => {
        if (!(child instanceof THREE.Mesh)) return;
        geometries.add(child.geometry);
        for (const material of Array.isArray(child.material) ? child.material : [child.material]) {
          materials.add(material);
          for (const value of Object.values(material)) if (value instanceof THREE.Texture) textures.add(value);
        }
      });
      textures.forEach((texture) => texture.dispose());
      materials.forEach((material) => material.dispose());
      geometries.forEach((geometry) => geometry.dispose());
      key.shadow.dispose();
      environment.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [souvenir]);

  async function download() {
    if (!model.current) return;
    setExporting(true);
    setExportError("");
    try {
      const data = await new GLTFExporter().parseAsync(model.current, { binary: true, maxTextureSize: 2048 });
      const url = URL.createObjectURL(new Blob([data as ArrayBuffer], { type: "model/gltf-binary" }));
      const link = document.createElement("a");
      link.href = url;
      link.download = `${souvenir.id}.glb`;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {
      setExportError("This model could not be exported. Please try again.");
    } finally {
      setExporting(false);
    }
  }

  return <div className="model-stage">
    <div ref={host} className="model-canvas" />
    <div className="stage-caption"><span>Drag to turn · Scroll to look closer</span><button onClick={() => reset.current?.()}>Reset view</button></div>
    {showExport && <button className="export-button" onClick={download} disabled={exporting}>{exporting ? "Preparing…" : "Download 3D object ↓"}</button>}
    {exportError && <p className="export-error" role="alert">{exportError}</p>}
  </div>;
}
