import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.158/build/three.module.js";
import { GLTFLoader } from "https://cdn.jsdelivr.net/npm/three@0.158/examples/jsm/loaders/GLTFLoader.js";
import { OrbitControls } from "https://cdn.jsdelivr.net/npm/three@0.158/examples/jsm/controls/OrbitControls.js";

// Canvas & Container
const canvas = document.getElementById("canvas");
const container = document.getElementsByClassName("canvas")[0];

// Modellname
let model_name = canvas.getAttribute("class");

// Szene
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xf0f0f0);

// Kamera
const camera = new THREE.PerspectiveCamera(
  75,
  container.clientWidth / container.clientHeight,
  0.1,
  1000
);
camera.position.set(0, 1, 3);

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

loader.load(model_name, (gltf) => {
  const model = gltf.scene;

  // Zentrieren + Skalieren
  const box = new THREE.Box3().setFromObject(model);
  const size = box.getSize(new THREE.Vector3()).length();
  const center = box.getCenter(new THREE.Vector3());

  model.position.sub(center);
  model.scale.setScalar(2 / size);

  scene.add(model);

  // Animationen parallel starten
  if (gltf.animations.length > 0) {
    mixer = new THREE.AnimationMixer(model);

    gltf.animations.forEach((clip) => {
      const action = mixer.clipAction(clip);

      action.play();

      // wichtige Settings für parallele Animation
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
addEventListener("resize", () => {
  const width = container.clientWidth;
  const height = container.clientHeight;

  camera.aspect = width / height;
  camera.updateProjectionMatrix();

  renderer.setSize(width, height, false);
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