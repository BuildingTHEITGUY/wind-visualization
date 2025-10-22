// University AI & Weather Research Lab – Global Wind Visualization (Stable Classic Version)
// Works directly with the scripts from index.html, no modules required.

(function () {
  try {
    console.log("✅ Loaded Three.js classic version");

    // --- Renderer Setup ---
    const canvas = document.getElementById("scene");
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x001830, 1);

    // --- Scene and Camera ---
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 2000);
    camera.position.set(0, 0, 7);

    const controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.enablePan = false;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.6;

    // --- Lights ---
    scene.add(new THREE.AmbientLight(0x88aaff, 0.6));
    const dir = new THREE.DirectionalLight(0xffffff, 0.9);
    dir.position.set(5, 3, 5);
    scene.add(dir);

    // --- Earth ---
    const R = 2.5;
    const texLoader = new THREE.TextureLoader();
    const earthTex = texLoader.load("https://raw.githubusercontent.com/vasturiano/three-globe/master/example/img/earth-dark.jpg");
    const bumpTex  = texLoader.load("https://raw.githubusercontent.com/vasturiano/three-globe/master/example/img/earth-topology.png");

    const earthMat = new THREE.MeshPhongMaterial({
      map: earthTex,
      bumpMap: bumpTex,
      bumpScale: 0.05,
      specular: new THREE.Color(0x223344),
      shininess: 6
    });

    const earth = new THREE.Mesh(new THREE.SphereGeometry(R, 64, 64), earthMat);
    scene.add(earth);

    // --- Atmosphere ---
    const atmo = new THREE.Mesh(
      new THREE.SphereGeometry(R * 1.02, 64, 64),
      new THREE.MeshBasicMaterial({ color: 0x3aa6ff, transparent: true, opacity: 0.12 })
    );
    scene.add(atmo);

    // --- Simple Wind Particles (Visual Layer) ---
    const dotGeo = new THREE.BufferGeometry();
    const dotCount = 8000;
    const positions = new Float32Array(dotCount * 3);
    for (let i = 0; i < dotCount * 3; i++) positions[i] = (Math.random() - 0.5) * R * 4;
    dotGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const dotMat = new THREE.PointsMaterial({ color: 0x00ffff, size: 0.02, transparent: true });
    const dots = new THREE.Points(dotGeo, dotMat);
    scene.add(dots);

    // --- Resize Handling ---
    window.addEventListener("resize", () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    });

    // --- Timestamp Update ---
    const lastUpdatedEl = document.getElementById("lastUpdated");
    if (lastUpdatedEl) lastUpdatedEl.textContent = new Date().toUTCString();

    // --- Animation Loop ---
    function animate() {
      requestAnimationFrame(animate);
      earth.rotation.y += 0.0006;
      atmo.rotation.y += 0.00065;
      dots.rotation.y += 0.0009;
      controls.update();
      renderer.render(scene, camera);
    }
    animate();

  } catch (err) {
    console.error("Visualization failed:", err);
    const msg = document.createElement("div");
    msg.style.cssText =
      "color:white;position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);text-align:center;";
    msg.innerHTML = "⚠️ Visualization failed to load.<br>Check console for details.";
    document.body.appendChild(msg);
  }
})();
