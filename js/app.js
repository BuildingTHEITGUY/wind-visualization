
// University AI & Weather Research Lab - Wind Visualization (procedural demo)
// Uses Three.js and a GPU shader to simulate wind-like particles over a rotating Earth.
// Prepared for GitHub Pages / Hostinger (no backend required).

// ====== Settings ======
const AUTO_ROTATE = true;
const ROTATION_SPEED = 0.0006; // radians per frame ~ slow
const START_LAT = 20.0;   // near Arabian Sea
const START_LON = 60.0;

// ====== Utilities ======
function formatDate(d){
  const pad = n=> String(n).padStart(2,'0');
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth()+1)}-${pad(d.getUTCDate())} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())} UTC`;
}

// ====== Scene setup ======
const canvas = document.getElementById('scene');
const renderer = new THREE.WebGLRenderer({canvas, antialias:true, alpha:true});
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(45, window.innerWidth/window.innerHeight, 0.1, 2000);
camera.position.set(0, 0, 7);

const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.enablePan = false;
controls.minDistance = 3.2;
controls.maxDistance = 12;
controls.autoRotate = AUTO_ROTATE;
controls.autoRotateSpeed = 0.8; // deg/sec-like

// ====== Lighting ======
const ambient = new THREE.AmbientLight(0x88aaff, 0.6);
scene.add(ambient);
const dir = new THREE.DirectionalLight(0xffffff, 0.9);
dir.position.set(5,3,5);
scene.add(dir);

// ====== Earth sphere ======
const R = 2.5;
const geo = new THREE.SphereGeometry(R, 96, 96);

// Textures via CDN
const texLoader = new THREE.TextureLoader();
const earthTex = texLoader.load('https://unpkg.com/three-globe/example/img/earth-dark.jpg');
const bumpTex  = texLoader.load('https://unpkg.com/three-globe/example/img/earth-topology.png');
const mat = new THREE.MeshPhongMaterial({
  map: earthTex,
  bumpMap: bumpTex,
  bumpScale: 0.05,
  specular: new THREE.Color(0x223344),
  shininess: 6
});
const earth = new THREE.Mesh(geo, mat);
scene.add(earth);

// ====== Atmosphere glow ======
const atmoGeo = new THREE.SphereGeometry(R*1.02, 64, 64);
const atmoMat = new THREE.MeshBasicMaterial({
  color: 0x3aa6ff,
  transparent: true,
  opacity: 0.12
});
const atmo = new THREE.Mesh(atmoGeo, atmoMat);
scene.add(atmo);

// ====== Procedural "wind-like" particles on GPU ======
const PARTICLES = 18000;
const positions = new Float32Array(PARTICLES*3);
const speeds = new Float32Array(PARTICLES);

function randOnSphere(radius){
  // Bias longitudes toward mid-latitudes to look windier
  const u = Math.random();
  const v = Math.random();
  const theta = 2 * Math.PI * u;
  const phi = Math.acos(2*v - 1);
  const x = radius * Math.sin(phi) * Math.cos(theta);
  const y = radius * Math.cos(phi);
  const z = radius * Math.sin(phi) * Math.sin(theta);
  return new THREE.Vector3(x,y,z);
}

for(let i=0;i<PARTICLES;i++){
  const p = randOnSphere(R*1.002);
  positions[i*3+0]=p.x;
  positions[i*3+1]=p.y;
  positions[i*3+2]=p.z;
  speeds[i]= 0.4 + Math.random()*1.2;
}

const pGeo = new THREE.BufferGeometry();
pGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
pGeo.setAttribute('aSpeed', new THREE.BufferAttribute(speeds, 1));

const pMat = new THREE.ShaderMaterial({
  transparent:true,
  depthWrite:false,
  blending: THREE.AdditiveBlending,
  uniforms:{
    time: {value: 0.0},
    radius:{value: R*1.002},
    colorA:{value: new THREE.Color(0x7fb3ff)},
    colorB:{value: new THREE.Color(0x5cc8ff)},
    colorC:{value: new THREE.Color(0x48e5c2)}
  },
  vertexShader:`
    attribute float aSpeed;
    uniform float time;
    uniform float radius;
    varying float vMix;
    void main(){
      vec3 pos = position;

      // Simple pseudo "advection" along tangential direction using time
      // Compute a tangential vector by crossing with an arbitrary axis
      vec3 n = normalize(pos);
      vec3 axis = vec3(0.3, 1.0, 0.6);
      vec3 t = normalize(cross(n, axis));

      // swirl factor varies by latitude
      float lat = asin(n.y);
      float k = 0.6 + 0.8 * cos(lat*2.0);

      pos += t * (0.01 * aSpeed * k) * sin(time*0.8 + dot(n,axis)*4.0);

      // keep near surface
      pos = normalize(pos) * radius;

      vMix = abs(n.y);
      gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
      gl_PointSize = 1.4 + 1.6 * aSpeed;
    }
  `,
  fragmentShader:`
    precision mediump float;
    varying float vMix;
    uniform vec3 colorA;
    uniform vec3 colorB;
    uniform vec3 colorC;
    void main(){
      float d = length(gl_PointCoord - vec2(0.5));
      if(d>0.5) discard;
      vec3 c = mix(colorA, colorB, vMix);
      c = mix(c, colorC, smoothstep(0.3,0.9,vMix));
      float alpha = smoothstep(0.5,0.0,d) * 0.9;
      gl_FragColor = vec4(c, alpha);
    }
  `
});

const particles = new THREE.Points(pGeo, pMat);
scene.add(particles);

// ====== Position globe to focus on UAE / Indian Ocean ======
function setInitialView(lat, lon){
  // Convert lat/lon to 3D rotation for the sphere (approximate)
  const phi = (90 - lat) * (Math.PI/180);
  const theta = (lon+180) * (Math.PI/180);
  // Rotate the whole scene group so that point (lat,lon) faces camera
  earth.rotation.y = theta;
  earth.rotation.x = 0;
}
setInitialView(START_LAT, START_LON);

// ====== Resize handling ======
window.addEventListener('resize', ()=>{
  camera.aspect = window.innerWidth/window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// ====== UI: sidebar and timestamp ======
const lastUpdatedEl = document.getElementById('lastUpdated');
lastUpdatedEl.textContent = formatDate(new Date());

const toggleSidebarBtn = document.getElementById('toggleSidebar');
const sidebar = document.getElementById('sidebar');
toggleSidebarBtn.addEventListener('click', ()=>{
  if(sidebar.classList.contains('hidden')){
    sidebar.classList.remove('hidden');
    toggleSidebarBtn.textContent = 'Hide panel';
  }else{
    sidebar.classList.add('hidden');
  }
});

const toggleInfo = document.getElementById('toggleInfo');
toggleInfo.addEventListener('click', ()=>{
  sidebar.classList.toggle('hidden');
});

// ====== Animate ======
let t = 0;
function animate(){
  requestAnimationFrame(animate);
  t += 0.016;
  pMat.uniforms.time.value = t;
  if (!controls.dragging && AUTO_ROTATE){
    // subtle base rotation
    earth.rotation.y += ROTATION_SPEED;
    atmo.rotation.y += ROTATION_SPEED * 1.02;
    particles.rotation.y += ROTATION_SPEED * 1.01;
  }
  controls.update();
  renderer.render(scene, camera);
}
animate();
