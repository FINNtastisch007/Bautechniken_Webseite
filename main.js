import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.158/build/three.module.js";
import { OrbitControls } from "https://cdn.jsdelivr.net/npm/three@0.158/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "https://cdn.jsdelivr.net/npm/three@0.158/examples/jsm/loaders/GLTFLoader.js";

// Canvas & Container
const canvas = document.getElementById("canvas");
const container = document.getElementsByClassName("canvas")[0];

// Modellname
let model_name = canvas.getAttribute("class");

// Szene
const scene = new THREE.Scene();

// Darkmode Background
const darkMode = window.matchMedia("(prefers-color-scheme: dark)");
function updateBackground(matches) {
  scene.background = new THREE.Color(matches ? 0x707070 : 0xf0f0f0);
}
updateBackground(darkMode.matches);
darkMode.onchange = (e) => updateBackground(e.matches);

// Kamera
const camera = new THREE.PerspectiveCamera(
  75,
  container.clientWidth / container.clientHeight,
  0.1,
  1000
);

// Renderer
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(container.clientWidth, container.clientHeight);
renderer.setPixelRatio(window.devicePixelRatio);

// Licht
const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 1.5);
scene.add(hemiLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 1);
dirLight.position.set(5, 5, 5);
scene.add(dirLight);

// Controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

// Animation
let mixer;
let actions = {};

// Loader
const loader = new GLTFLoader();

loader.load("/models/" + model_name, (gltf) => {
  const model = gltf.scene;

  // Bounding Box berechnen
  const box = new THREE.Box3().setFromObject(model);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());

  // Modell zentrieren
  model.position.sub(center);
  scene.add(model);

  // === Kamera automatisch anpassen ===
  const maxDim = Math.max(size.x, size.y, size.z);
  const fov = camera.fov * (Math.PI / 180);

  let cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2));
  cameraZ *= 1.5; // Abstand etwas erhöhen

  camera.position.set(0, 0, cameraZ);
  camera.lookAt(0, 0, 0);

  // Controls korrekt setzen
  controls.target.set(0, 0, 0);
  controls.minDistance = cameraZ * 0.5;
  controls.maxDistance = cameraZ * 5;
  controls.update();

  // === Animationen ===
  if (gltf.animations.length > 0) {
    mixer = new THREE.AnimationMixer(model);

    gltf.animations.forEach((clip) => {
      const action = mixer.clipAction(clip);

      action.play();
      action.setLoop(THREE.LoopRepeat);
      action.clampWhenFinished = false;
      action.setEffectiveWeight(1);
      action.setEffectiveTimeScale(1);

      actions[clip.name] = action;
    });

    console.log("Animationen:", Object.keys(actions));
  }
});

// Resize
window.addEventListener("resize", () => {
  const width = container.clientWidth;
  const height = container.clientHeight;

  camera.aspect = width / height;
  camera.updateProjectionMatrix();

  renderer.setSize(width, height);
});

// Loop
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);

  const delta = Math.min(clock.getDelta(), 0.1);

  if (mixer) mixer.update(delta);

  controls.update();
  renderer.render(scene, camera);
}

animate();