import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { OutlinePass } from 'three/addons/postprocessing/OutlinePass.js';
import { CSS3DObject, CSS3DRenderer } from 'three/addons/renderers/CSS3DRenderer.js';
import { inject } from '@vercel/analytics';
import './style.css';

inject();

const canvas = document.querySelector('#room');
const backButton = document.querySelector('#back');
const contentLayer = document.querySelector('#content-layer');
const loaderOverlay = document.querySelector('#loader');
const loaderLabel = document.querySelector('#loader-label');
const loaderProgress = document.querySelector('#loader-progress');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2)); renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
const BACKGROUND_ON = new THREE.Color('#9aa4a2'), BACKGROUND_OFF = new THREE.Color('#394142');
const scene = new THREE.Scene(); scene.background = BACKGROUND_ON.clone();
const ambientLight = new THREE.HemisphereLight('#ffffff', '#a8afb8', 2.1); scene.add(ambientLight);
const camera = new THREE.PerspectiveCamera(36, 1, .1, 100);
const controls = new OrbitControls(camera, canvas);
const ROOM_MIN_DISTANCE = 3.2, FOCUS_MIN_DISTANCE = .35;
Object.assign(controls, { enableDamping: true, dampingFactor: .07, enablePan: false, minDistance: ROOM_MIN_DISTANCE, maxDistance: 20, minPolarAngle: .18, maxPolarAngle: 1.48, rotateSpeed: .7, zoomSpeed: .85 });
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const outlinePass = new OutlinePass(new THREE.Vector2(innerWidth, innerHeight), scene, camera);
outlinePass.edgeStrength = 2.1; outlinePass.edgeGlow = .55; outlinePass.edgeThickness = 1; outlinePass.visibleEdgeColor.set('#bdeff2'); outlinePass.hiddenEdgeColor.set('#426c72'); composer.addPass(outlinePass);
const contentRenderer = new CSS3DRenderer(); contentRenderer.domElement.id = 'content-renderer'; contentLayer.append(contentRenderer.domElement);
const publicAsset = relativePath => new URL(`${import.meta.env.BASE_URL}${relativePath}`, window.location.origin).href;

// Central object registry. `contentKey` from the GLB resolves directly to these entries.
const OBJECT_INTERACTIONS = {
  monitor: { node: 'monitor_interactive', type: 'focus', content: 'monitor', screen: { position: [-1.37, 1.43, -1.632], rotation: [0, 0, 0], scale: .001 } },
  laptop: { node: 'laptop_interactive', type: 'focus', content: null },
  wall_board: { node: 'wall_board_interactive', type: 'focus', content: 'board', board: { position: [.38, 2.03, -2.144], rotation: [0, 0, 0], scale: .001 } },
  tv: { node: 'tv_interactive', type: 'focus', content: null },
  bookshelf: { node: 'bookshelf_interactive', type: 'focus', content: null },
  project_folder: { node: 'project_folder_interactive', type: 'focus', content: null },
  pokeball: { node: 'pokeball_interactive', type: 'focus', content: null },
  camera: { node: 'camera_interactive', type: 'focus', content: null },
  phone_contact: { node: 'phone_contact_interactive', type: 'focus', content: null },
  lamp: { node: 'desk_lamp_shade', aliases: ['desk_lamp_base', 'desk_lamp_stem'], outlineNodes: ['desk_lamp_base', 'desk_lamp_stem', 'desk_lamp_shade'], type: 'toggle', content: 'deskLamp' }
};

const homePosition = new THREE.Vector3(), homeTarget = new THREE.Vector3(0, 1.18, 0), destination = new THREE.Vector3(), destinationTarget = new THREE.Vector3();
const returnPosition = new THREE.Vector3(), returnTarget = new THREE.Vector3();
const raycaster = new THREE.Raycaster(), pointer = new THREE.Vector2();
let room = null, selected = null, selectedKey = null, hovered = null, activeContent = null, pointerDown = null, transition = null, phase = 'room';
let deskLight = null, lampMaterial = null, lampOriginalIntensity = 0, lampOriginalEmissive = 0, lampOn = true, lampIntensityTarget = 0;
const environmentLights = [];
const boardConfig = OBJECT_INTERACTIONS.wall_board.board;
const boardObject = new CSS3DObject(document.querySelector('#archive-board'));
boardObject.position.fromArray(boardConfig.position); boardObject.rotation.set(...boardConfig.rotation); boardObject.scale.setScalar(boardConfig.scale); boardObject.visible = false; scene.add(boardObject);
const monitorConfig = OBJECT_INTERACTIONS.monitor.screen;
const monitorObject = new CSS3DObject(document.querySelector('#monitor-site'));
monitorObject.position.fromArray(monitorConfig.position); monitorObject.rotation.set(...monitorConfig.rotation); monitorObject.scale.setScalar(monitorConfig.scale); monitorObject.visible = false; scene.add(monitorObject);

function setHomeFrame() {
  const direction = new THREE.Vector3(7.7, 5.8, 9).normalize();
  const distance = innerWidth / innerHeight < .8 ? 15.5 : 11.7;
  homePosition.copy(direction).multiplyScalar(distance).add(homeTarget);
  if (phase === 'room') { camera.position.copy(homePosition); controls.target.copy(homeTarget); }
}
function resize() { renderer.setSize(innerWidth, innerHeight); composer.setSize(innerWidth, innerHeight); contentRenderer.setSize(innerWidth, innerHeight); camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); setHomeFrame(); }
addEventListener('resize', resize); resize();

function keyFromObject(object) {
  while (object) {
    const contentKey = object.userData?.contentKey;
    if (contentKey && OBJECT_INTERACTIONS[contentKey]) return contentKey;
    const key = Object.keys(OBJECT_INTERACTIONS).find(name => {
      const config = OBJECT_INTERACTIONS[name];
      return object.name === config.node || config.aliases?.includes(object.name);
    });
    if (key) return key;
    object = object.parent;
  }
  return null;
}
function pick(event) {
  if (!room) return null;
  pointer.set(event.clientX / innerWidth * 2 - 1, -(event.clientY / innerHeight) * 2 + 1); raycaster.setFromCamera(pointer, camera);
  return keyFromObject(raycaster.intersectObjects(room.children, true)[0]?.object);
}
function setHovered(key) {
  if (hovered === key) return;
  hovered = key; canvas.style.cursor = key ? 'pointer' : 'grab';
  const config = key && OBJECT_INTERACTIONS[key];
  const names = config?.outlineNodes || (config ? [config.node] : []);
  outlinePass.selectedObjects = key && phase === 'room' ? names.map(name => room.getObjectByName(name)).filter(Boolean) : [];
}
function animateCamera(toPosition, toTarget, duration, onComplete) {
  transition = {
    startedAt: performance.now(), duration,
    fromPosition: camera.position.clone(), fromTarget: controls.target.clone(),
    toPosition: toPosition.clone(), toTarget: toTarget.clone(), onComplete
  };
}
function startFocus(key) {
  const config = OBJECT_INTERACTIONS[key], object = room?.getObjectByName(config.node); if (!object || phase !== 'room' || config.type !== 'focus') return;
  returnPosition.copy(camera.position); returnTarget.copy(controls.target);
  selected = object; selectedKey = key; activeContent = config.content; phase = 'focusing'; controls.enabled = false; controls.minDistance = FOCUS_MIN_DISTANCE; setHovered(null); backButton.hidden = false; backButton.disabled = false;
  if (config.content === 'board') {
    destinationTarget.set(.38, 2.03, -2.15);
    const boardDistance = innerWidth / innerHeight < .8 ? 2.6 : 1.2;
    destination.copy(destinationTarget).add(new THREE.Vector3(0, .015, boardDistance));
  } else if (config.content === 'monitor') {
    destinationTarget.fromArray(config.screen.position);
    const monitorDistance = innerWidth / innerHeight < .8 ? 2.75 : 1.02;
    destination.copy(destinationTarget).add(new THREE.Vector3(0, .015, monitorDistance));
  } else {
    const bounds = new THREE.Box3().setFromObject(object); bounds.getCenter(destinationTarget); destination.copy(destinationTarget).add(new THREE.Vector3(...(config.focusOffset || [.18, .35, 1.1])));
  }
  animateCamera(destination, destinationTarget, 900, () => {
    phase = 'focused'; controls.enabled = true;
  });
}
function resetRoom() {
  if (phase === 'room' || phase === 'returning') return;
  phase = 'returning'; controls.enabled = false; backButton.disabled = true;
  animateCamera(returnPosition, returnTarget, 900, () => {
    phase = 'room'; selected = null; selectedKey = null; activeContent = null; controls.minDistance = ROOM_MIN_DISTANCE; controls.enabled = true; backButton.hidden = true; backButton.disabled = false;
  });
}
function toggleDeskLamp() {
  lampOn = !lampOn;
  lampIntensityTarget = lampOn ? lampOriginalIntensity : 0;
  ambientLight.userData.targetIntensity = lampOn ? 2.1 : .38;
  environmentLights.forEach(entry => { entry.targetIntensity = lampOn ? entry.onIntensity : entry.offIntensity; });
}
canvas.addEventListener('pointerdown', event => { pointerDown = { x: event.clientX, y: event.clientY, time: performance.now() }; });
canvas.addEventListener('pointermove', event => { if (phase === 'room') setHovered(pick(event)); });
canvas.addEventListener('pointerup', event => {
  const movement = pointerDown && Math.hypot(event.clientX - pointerDown.x, event.clientY - pointerDown.y);
  const elapsed = pointerDown && performance.now() - pointerDown.time;
  if (!pointerDown || movement > 5 || elapsed < 0) return;
  const key = pick(event); if (!key) return;
  if (phase === 'focused' && key === selectedKey) { resetRoom(); return; }
  if (phase !== 'room') return;
  if (OBJECT_INTERACTIONS[key].type === 'toggle') toggleDeskLamp(); else startFocus(key);
});
canvas.addEventListener('pointerleave', () => setHovered(null));
backButton.addEventListener('click', resetRoom);
addEventListener('keydown', event => { if (event.key === 'Escape' && phase !== 'room') resetRoom(); });
document.querySelectorAll('[data-board-asset]').forEach(image => {
  const asset = image.dataset.boardAsset;
  image.src = publicAsset(`board/${asset}`);
  image.addEventListener('error', () => {
    image.classList.add('image-fallback');
    if (import.meta.env.DEV) console.warn(`[archive-board] Missing board asset: ${asset}`);
  });
});

const loadingManager = new THREE.LoadingManager();
const gltfLoader = new GLTFLoader(loadingManager);
gltfLoader.load('/andre-archive-room-refined.glb', gltf => {
  room = gltf.scene; scene.add(room);
  room.traverse(object => {
    if (object.isMesh) { object.castShadow = true; object.receiveShadow = true; }
    if (object.isDirectionalLight) { object.castShadow = true; object.shadow.mapSize.set(2048, 2048); object.shadow.bias = -.0003; }
    if (object.isLight && object.name !== 'desk_warm_light') environmentLights.push({ light: object, onIntensity: object.intensity, offIntensity: object.intensity * (object.name === 'neutral_key' ? .28 : .14), targetIntensity: object.intensity });
  });
  deskLight = room.getObjectByName('desk_warm_light');
  lampOriginalIntensity = deskLight?.intensity ?? 0;
  lampIntensityTarget = lampOriginalIntensity;
  const lampShade = room.getObjectByName(OBJECT_INTERACTIONS.lamp.node);
  if (lampShade?.isMesh) {
    lampMaterial = lampShade.material.clone();
    lampShade.material = lampMaterial;
    lampOriginalEmissive = lampMaterial.emissiveIntensity || .55;
  }
  boardObject.visible = true; monitorObject.visible = true; contentLayer.setAttribute('aria-hidden', 'false');
  document.body.dataset.roomState = 'ready';
  loaderProgress.style.width = '100%';
  loaderOverlay.classList.add('is-complete');
}, event => {
  if (event.total) loaderProgress.style.width = `${Math.max(5, Math.round(event.loaded / event.total * 100))}%`;
}, () => {
  document.body.dataset.roomState = 'error';
  loaderLabel.textContent = 'Unable to load archive room';
});
renderer.setAnimationLoop(() => {
  if (transition) {
    const progress = Math.min(1, (performance.now() - transition.startedAt) / transition.duration);
    const eased = progress * progress * (3 - 2 * progress);
    camera.position.lerpVectors(transition.fromPosition, transition.toPosition, eased);
    controls.target.lerpVectors(transition.fromTarget, transition.toTarget, eased);
    if (progress === 1) { const complete = transition.onComplete; transition = null; complete?.(); }
  }
  if (deskLight) deskLight.intensity = THREE.MathUtils.lerp(deskLight.intensity, lampIntensityTarget, .12);
  ambientLight.intensity = THREE.MathUtils.lerp(ambientLight.intensity, ambientLight.userData.targetIntensity ?? 2.1, .08);
  environmentLights.forEach(entry => { entry.light.intensity = THREE.MathUtils.lerp(entry.light.intensity, entry.targetIntensity, .08); });
  scene.background.lerp(lampOn ? BACKGROUND_ON : BACKGROUND_OFF, .06);
  if (lampMaterial) lampMaterial.emissiveIntensity = THREE.MathUtils.lerp(lampMaterial.emissiveIntensity, lampOn ? lampOriginalEmissive : .015, .12);
  if (!transition) controls.update();
  composer.render(); contentRenderer.render(scene, camera);
});
