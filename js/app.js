// University AI & Weather Research Lab – Wind Visualization v2
// Compatible with Three.js r149–r160+

(async function() {
  // Utility to safely load OrbitControls across versions
  async function loadOrbitControls() {
    if (THREE.OrbitControls) {
      console.log("Using legacy OrbitControls");
      return THREE.OrbitControls;
    }
    console.log("Using ES Module OrbitControls");
    const module = await import('https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/controls/OrbitControls.min.js');
    return module.OrbitControls;
  }

  try {
    const OrbitControls = await loadOrbitControls();

    // Scene setup
    const canvas = document.getElementById('scene');
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x001830, 1);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 2000);
    camera.position.set(0, 0, 7);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.enablePan = false;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.8;
    controls.minDistance = 3.2;
    controls.maxDistance = 12;

    // Lights
    scene.add(new THREE.AmbientLight(0x88aaff, 0.6));
    const dir = new THREE.DirectionalLight(0xffffff, 0.9);
    dir.position.set(5, 3, 5);
    scene.add(dir);

    // Earth
    const R = 2.5;
    const geo = new THREE.SphereGeometry(R, 96, 96);
    const loader = new THREE.TextureLoader();

    const earthTex = loader.load('https://raw.githubusercontent.com/vasturiano/three-globe/master/example/img/earth-dark.jpg');
    const bumpTex = loader.load('https://raw.githubusercontent.com/vasturiano/three-globe/master/example/img/earth-topology.png');

    const mat = new THREE.MeshPhongMaterial({
      map: earthTex,
      bumpMap: bumpTex,
      bumpScale: 0.05,
      specular: new THREE.Color(0x223344),
      shininess: 6
    });
    const earth = new THREE.Mesh(geo, mat);
    scene.add(earth);

    // Atmosphere
    const atmoGeo = new THREE.SphereGeometry(R * 1.02, 64, 64);
    const atmoMat = new THREE.MeshBasicMaterial({ color: 0x3aa6ff, transparent: true, opacity: 0.12 });
    const atmo = new THREE.Mesh(atmoGeo, atmoMat);
    scene.add(atmo);

    // Wind particles
    const PARTICLES = 15000;
    const positions = new Float32Array(PARTICLES * 3);
    const speeds = new Float32Array(PARTICLES);
    const randOnSphere = (radius) => {
      const u = Math.random();
      const v = Math.random();
      const theta = 2 * Math.PI * u;
      const phi = Math.acos(2 * v - 1);
      const x = radius * Math.sin(phi) * Math.cos(theta);
      const y = radius * Math.cos(phi);
      const z = radius * Math.sin(phi) * Math.sin(theta);
      return new THREE.Vector3(x, y, z);
    };

    for (let i = 0; i < PARTICLES; i++) {
      const p = randOnSphere(R * 1.002);
      positions.set([p.x, p.y, p.z], i * 3);
      speeds[i] = 0.4 + Math.random() * 1.2;
    }

    const pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    pGeo.setAttribute('aSpeed', new THREE.BufferAttribute(speeds, 1));

    const pMat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        time: { value: 0.0 },
        radius: { value: R * 1.002 },
        colorA: { value: new THREE.Color(0x7fb3ff) },
        colorB: { value: new THREE.Color(0x5cc8ff) },
        colorC: { value: new THREE.Color(0x48e5c2) }
      },
      vertexShader: `
        attribute float aSpeed;
        uniform float time;
        uniform float radius;
        varying float vMix;
        void main() {
          vec3 pos = position;
          vec3 n = normalize(pos);
          vec3 axis = vec3(0.3, 1.0, 0.6);
          vec3 t = normalize(cross(n, axis));
          float lat = asin(n.y);
          float k = 0.6 + 0.8 * cos(lat * 2.0);
          pos += t * (0.01 * aSpeed * k) * sin(time * 0.8 + dot(n, axis) * 4.0);
          pos = normalize(pos) * radius;
          vMix = abs(n.y);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
          gl_PointSize = 1.4 + 1.6 * aSpeed;
        }
      `,
      fragmentShader: `
        precision mediump float;
        varying float vMix;
        uniform vec3 colorA;
        uniform vec3 colorB;
        uniform vec3 colorC;
        void main() {
          float d = length(gl_PointCoord - vec2(0.5));
          if (d > 0.5) discard;
          vec3 c = mix(colorA, colorB, vMix);
          c = mix(c, colorC, smoothstep(0.3, 0.9, vMix));
          float alpha = smoothstep(0.5, 0.0, d) * 0.9;
          gl_FragColor = vec4(c, alpha);
        }
      `
    });

    const particles = new THREE.Points(pGeo, pMat);
    scene.add(particles);

    // Resize
    window.addEventListener('resize', () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    });

    // UI updates
    const lastUpdatedEl = document.getElementById('lastUpdated');
    if (lastUpdatedEl) lastUpdatedEl.textContent = new Date().toUTCString();

    // Animation
    let t = 0;
    function animate() {
      requestAnimationFrame(animate);
      t += 0.016;
      pMat.uniforms.time.value = t;
      earth.rotation.y += 0.0006;
      atmo.rotation.y += 0.00065;
      particles.rotation.y += 0.0007;
      controls.update();
      renderer.render(scene, camera);
    }
    animate();

  } catch (err) {
    console.error("Wind Visualization initialization failed:", err);
    const msg = document.createElement('div');
    msg.style.cssText = "color:white;position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);text-align:center;";
    msg.innerHTML = "⚠️ Visualization failed to load.<br>Check console for details.";
    document.body.appendChild(msg);
  }
})();
