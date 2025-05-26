// js/sceneManager.js
// Manages Three.js scene setup, camera, renderer, lighting, background stars,
// and global scene-related variables.

// THREE will be accessed as a global variable from the CDN script.
// import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'; // If using npm for OrbitControls specifically

// Global scene-related variables
export let scene, camera, renderer, controls, globalClock;
export let raycaster, mouse;

export let sun, planets = [], asteroidBelts = [], comets = [], stations = [], activeShips = [];
export let clickableObjects = [], orderedSelectableObjects = [];
export let focusedObject = null;
export let highlightMesh;
export let targetCameraPositionForFocus = null;
export let targetLookAtForFocus = null;
export let orbitLineMeshes = [], orbitLinesVisible = true;

// To be initialized by other modules
export function setInitialSimulationSpeed(speed) {
    // This is a bit of a workaround for now, ideally, simulationSpeed is managed by a simulation/game state module
}
export function getSunData() { // Placeholder, will be imported from config.js
    return { name: 'Sun', color: 0xFFFF00, visualRadius: 15 };
}
export function getPlanetsData() { // Placeholder
    return [];
}


export function initScene(containerElement, initialSimulationSpeed) {
    if (typeof THREE === 'undefined') {
        document.getElementById('infoBox').textContent = "Error: THREE is not defined. Load Three.js library.";
        console.error("THREE is not defined. Load Three.js library.");
        return;
    }
    // OrbitControls might not be on THREE if loaded separately via CDN.
    // For now, we assume it's available or will be attached to THREE.
    if (typeof THREE.OrbitControls === 'undefined') {
         console.warn("THREE.OrbitControls is not defined. Orbit controls might not work.");
    }

    globalClock = new THREE.Clock();
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);

    const hemisphereLight = new THREE.HemisphereLight(0x606060, 0x404040, 0.8);
    scene.add(hemisphereLight);

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 10000);
    camera.position.set(0, 200, 350);
    camera.lookAt(0, 0, 0);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    containerElement.appendChild(renderer.domElement); // Append to body or a specific container

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    // Sun's point light will be added when sun is created in celestialBodyFactory

    if (typeof THREE.OrbitControls !== 'undefined') {
        controls = new THREE.OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.minDistance = 0.1;
        controls.maxDistance = 7000;
        controls.enableRotate = false; // Default to no rotation with C key
    } else {
        console.warn("OrbitControls not available, camera controls will be limited.");
    }


    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();

    // Highlight mesh for selected objects
    const highlightSegments = 32;
    const highlightPoints = [];
    for (let i = 0; i <= highlightSegments; i++) {
        const angle = (i / highlightSegments) * Math.PI * 2;
        highlightPoints.push(new THREE.Vector3(Math.cos(angle), 0, Math.sin(angle)));
    }
    const highlightGeometry = new THREE.BufferGeometry().setFromPoints(highlightPoints);
    const highlightMaterial = new THREE.LineBasicMaterial({ color: 0xFFFF00, transparent: true, opacity: 0.9 });
    highlightMesh = new THREE.LineLoop(highlightGeometry, highlightMaterial);
    highlightMesh.visible = false;
    scene.add(highlightMesh);

    createStars(); // Create the starfield background

    window.addEventListener('resize', onWindowResize, false);
    console.log("Scene initialized");
}

export function createStars() {
    const starVertices = [];
    const starCount = 15000;
    const starSpread = 6000;
    const planetsData = getPlanetsData(); // Fetch from config or appropriate source
    const outermostOrbit = planetsData.length > 0 ? planetsData[planetsData.length - 1].orbitalRadiusAU * 70 : 1000; // Using 70 as DISTANCE_SCALE_AU_TO_THREEJS
    const minStarDist = outermostOrbit * 1.5;

    for (let i = 0; i < starCount; i++) {
        let x, y, z, distSq;
        do {
            x = (Math.random() - 0.5) * 2 * starSpread;
            y = (Math.random() - 0.5) * 2 * starSpread;
            z = (Math.random() - 0.5) * 2 * starSpread;
            distSq = x * x + y * y + z * z;
        } while (distSq < minStarDist * minStarDist || distSq > starSpread * starSpread);
        starVertices.push(x, y, z);
    }
    const starGeometry = new THREE.BufferGeometry();
    starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starVertices, 3));
    const starMaterial = new THREE.PointsMaterial({ color: 0xffffff, size: 1.5, sizeAttenuation: false });
    const starsPoints = new THREE.Points(starGeometry, starMaterial);
    scene.add(starsPoints);
    console.log("Stars created");
}

export function addSunLight(sunPosition, sunColor) {
    const sunLight = new THREE.PointLight(sunColor, 1.2, 7000, 0.8);
    sunLight.position.copy(sunPosition);
    scene.add(sunLight);
}


function onWindowResize() {
    if (camera && renderer) {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }
}

export function renderScene() {
    if (renderer && scene && camera) {
        renderer.render(scene, camera);
    }
}

export function updateControls() {
    if (controls && controls.enabled) { // Check if controls exist and are enabled
        controls.update();
    }
}

// Functions to add/remove objects from scene and tracking arrays
export function addObjectToScene(object, isClickable = false, isSelectableInOrder = false) {
    if (scene && object) {
        scene.add(object);
        if (isClickable) clickableObjects.push(object);
        if (isSelectableInOrder && !orderedSelectableObjects.includes(object)) {
            orderedSelectableObjects.push(object);
        }
    }
}

export function removeObjectFromScene(object) {
    if (scene && object) {
        scene.remove(object);

        let index = clickableObjects.indexOf(object);
        if (index > -1) clickableObjects.splice(index, 1);

        index = orderedSelectableObjects.indexOf(object);
        if (index > -1) orderedSelectableObjects.splice(index, 1);

        if (focusedObject === object) {
            focusedObject = null; // Handled more robustly in UIManager or main logic
            if(highlightMesh) highlightMesh.visible = false;
        }
    }
}

// Orbit lines management
export function addOrbitLine(lineMesh) {
    if (scene && lineMesh) {
        orbitLineMeshes.push(lineMesh);
        lineMesh.visible = orbitLinesVisible;
        scene.add(lineMesh);
    }
}

export function toggleOrbitLinesVisibility() {
    orbitLinesVisible = !orbitLinesVisible;
    orbitLineMeshes.forEach(line => { line.visible = orbitLinesVisible; });
}

// Getters for shared state, if needed by other modules directly (prefer passing as params or events)
export function getScene() { return scene; }
export function getCamera() { return camera; }
export function getRenderer() { return renderer; }
export function getControls() { return controls; }
export function getGlobalClock() { return globalClock; }
export function getRaycaster() { return raycaster; }
export function getMouse() { return mouse; }
export function getFocusedObject() { return focusedObject; }
export function setFocusedObject(obj) { focusedObject = obj; }
export function getHighlightMesh() { return highlightMesh; }
export function getClickableObjects() { return clickableObjects; }
export function getOrderedSelectableObjects() { return orderedSelectableObjects; }
export function getActiveShips() { return activeShips; } // Will be managed by shipLogic.js
export function getStations() { return stations; } // Will be managed by stationFactory/Logic

console.log("sceneManager.js evaluated");