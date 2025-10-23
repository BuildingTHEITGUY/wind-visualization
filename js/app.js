// -----------------------------------------------------
// University AI & Weather Research Lab
// Global Wind Visualization – Modern Module Version
// -----------------------------------------------------

import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/controls/OrbitControls.js';

// Scene and Renderer setup
const canvas = document.getElementById('scene');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x00142a, 1);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 2000);
camera.position.set(0, 0, 6);

// Controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.autoRotate = true;
controls.autoRotateSpeed = 0.6;

// Lighting
scene.add(new THREE.AmbientLight(0x8888ff, 0.5));
const dirLight = new THREE.DirectionalLight(0xffffff, 1);
dirLight.position.set(5, 3, 5);
scene.add(dirLight);

// Earth Geometry
const R = 2.5;
const loader = new THREE.TextureLoader();

const earthTexture = loader.load('https://raw.githubusercontent.com/vasturiano/three-globe/master/example/img/earth-dark.jpg');
const bumpTexture = loader.load('https://raw.githubusercontent.com/vasturiano/three-globe/master/example/img/earth-topology.png');

const earth = new THREE.Mesh(
  new THREE.SphereGeometry(R, 96, 96),
  new THREE.MeshPhongMaterial({
    map: earthTexture,
    bumpMap: bumpTexture,
    bumpScale: 0.05,
    specular: new THREE.Color(0x334455),
    shininess: 10
  })
);
scene.add(earth);

// Simple atmosphere glow
const atmosphere = new THREE.Mesh(
  new THREE.SphereGeometry(R * 1.02, 64, 64),
  new THREE.MeshBasicMaterial({ color: 0x3aa6ff, transparent: true, opacity: 0.12 })
);
scene.add(atmosphere);

// Animation loop
function animate() {
  requestAnimationFrame(animate);
  earth.rotation.y += 0.0006;
  atmosphere.rotation.y += 0.00065;
  controls.update();
  renderer.render(scene, camera);
}
animate();

// Resize handler
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Update label
document.getElementById('lastUpdated').textContent = new Date().toUTCString();
