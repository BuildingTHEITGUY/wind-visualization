// University AI & Weather Research Lab – Modern ES-module version
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/controls/OrbitControls.js';

const canvas = document.getElementById('scene');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setClearColor(0x001830, 1);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 2000);
camera.position.set(0, 0, 7);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.autoRotate = true;
controls.autoRotateSpeed = 0.6;

// Lights
scene.add(new THREE.AmbientLight(0x88aaff, 0.6));
const dir = new THREE.DirectionalLight(0xffffff, 0.9);
dir.position.set(5, 3, 5);
scene.add(dir);

// Earth
const R = 2.5;
const loader = new THREE.TextureLoader();
const earthTex = loader.load('https://raw.githubusercontent.com/vasturiano/three-globe/master/example/img/earth-dark.jpg');
const bumpTex = loader.load('https://raw.githubusercontent.com/vasturiano/three-globe/master/example/img/earth-topology.png');

const earth = new THREE.Mesh(
  new THREE.SphereGeometry(R, 96, 96),
  new THREE.MeshPhongMaterial({
    map: earthTex,
    bumpMap: bumpTex,
    bumpScale: 0.05,
    specular: new THREE.Color(0x223344),
    shininess: 6
  })
);
scene.add(earth);

// Simple atmosphere
const atmo = new THREE.Mesh(
  new THREE.SphereGeometry(R * 1.02, 64, 64),
  new THREE.MeshBasicMaterial({ color: 0x3aa6ff, transparent: true, opacity: 0.12 })
);
scene.add(atmo);

// Animate
const lastUpdated = document.getElementById('lastUpdated');
if (lastUpdated) lastUpdated.textContent = new Date().toUTCString();

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

function animate() {
  requestAnimationFrame(animate);
  earth.rotation.y += 0.0006;
  atmo.rotation.y += 0.00065;
  controls.update();
  renderer.render(scene, camera);
}
animate();
