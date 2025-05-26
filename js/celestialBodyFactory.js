// js/celestialBodyFactory.js
// Functions for creating sun, planets, moons, asteroids, comets.

// THREE will be accessed as a global variable from the CDN script.
import { sunData as configSunData, planetsData as configPlanetsData, asteroidBeltsData as configAsteroidBeltsData, cometsData as configCometsData, DISTANCE_SCALE_AU_TO_THREEJS } from './config.js';
import { addObjectToScene, addOrbitLine, addSunLight, getScene, getOrbitLineMeshes, getOrbitLinesVisible, getPlanets, getComets, getAsteroidBelts } from './sceneManager.js'; // Assuming sceneManager exposes these

export function createSun() {
    const scene = getScene();
    if (!scene) {
        console.error("Scene not initialized in createSun");
        return null;
    }
    const sunDefinition = configSunData; // from config.js
    const geometry = new THREE.SphereGeometry(sunDefinition.visualRadius, 32, 16);
    const material = new THREE.MeshStandardMaterial({ color: sunDefinition.color, emissive: sunDefinition.color, emissiveIntensity: 0.8 });
    const sunMesh = new THREE.Mesh(geometry, material);
    sunMesh.userData = { isPlanet: false, visualRadius: sunDefinition.visualRadius, name: sunDefinition.name }; // isPlanet: false for Sun
    
    addObjectToScene(sunMesh, true, true); // Add to scene, clickable, selectable
    addSunLight(sunMesh.position, sunDefinition.color); // Add point light at sun's position

    // Store in sceneManager's sun variable (if sceneManager handles this directly)
    // Or return it to be stored by the caller (e.g., main.js or sceneManager.init)
    // For now, assume sceneManager.sun will be set by this or similar logic
    getScene().sun = sunMesh; // Direct assignment for now, might need a setter in sceneManager
    console.log("Sun created:", sunMesh.userData.name);
    return sunMesh;
}

export function createPlanetsAndMoons() {
    const scene = getScene();
    const planetsArray = getPlanets(); // from sceneManager
    const planetsDefinition = configPlanetsData; // from config.js

    if (!scene || !planetsArray) {
        console.error("Scene or planets array not initialized in createPlanetsAndMoons");
        return;
    }

    planetsDefinition.forEach(pData => {
        const planetGeometry = new THREE.SphereGeometry(pData.visualRadius, 16, 8);
        const planetMaterial = new THREE.MeshStandardMaterial({ color: pData.color, metalness: 0.1, roughness: 0.8 });
        const planetMesh = new THREE.Mesh(planetGeometry, planetMaterial);
        planetMesh.userData = { isPlanet: true, visualRadius: pData.visualRadius, name: pData.name, moonsData: pData.moons };

        const orbitalInclinationRad = THREE.MathUtils.degToRad(pData.orbitalInclinationDegrees || 0);
        const eccentricity = pData.eccentricity || 0;
        const scaledPlanetOrbitalRadius = pData.orbitalRadiusAU * DISTANCE_SCALE_AU_TO_THREEJS;
        const initialPlanetAngle = Math.random() * Math.PI * 2;

        const r = scaledPlanetOrbitalRadius * (1 - eccentricity * Math.cos(0)); // Initial distance at periapsis for angle calc
        let initialPosVec = new THREE.Vector3(r * Math.cos(initialPlanetAngle), 0, r * Math.sin(initialPlanetAngle));
        initialPosVec.applyAxisAngle(new THREE.Vector3(1, 0, 0), orbitalInclinationRad);
        planetMesh.position.copy(initialPosVec);

        const planetObject = {
            name: pData.name,
            mesh: planetMesh,
            orbitalRadius: scaledPlanetOrbitalRadius,
            angularSpeedBase: (2 * Math.PI) / (pData.orbitalPeriodYears * 100),
            currentAngle: initialPlanetAngle,
            orbitalInclinationRad: orbitalInclinationRad,
            eccentricity: eccentricity,
            moonObjects: []
        };

        if (pData.moons && pData.moons.length > 0) {
            pData.moons.forEach(mData => {
                let moonMesh;
                const moonMaterial = new THREE.MeshStandardMaterial({ color: mData.color, metalness: 0.1, roughness: 0.8 });
                if (mData.isSpaceship) {
                    const shipSize = mData.visualSize || 0.1;
                    moonMesh = new THREE.Mesh(new THREE.TetrahedronGeometry(shipSize, 0), moonMaterial);
                } else if (mData.isCube) {
                    const cubeSize = mData.visualSize || 0.3;
                    moonMesh = new THREE.Mesh(new THREE.BoxGeometry(cubeSize, cubeSize, cubeSize), moonMaterial);
                } else {
                    moonMesh = new THREE.Mesh(new THREE.SphereGeometry(mData.visualRadius, 8, 4), moonMaterial);
                }
                moonMesh.name = mData.name;
                moonMesh.userData = { isMoon: true, name: mData.name, visualRadius: mData.visualRadius || mData.visualSize, parentPlanetName: pData.name };

                const scaledMoonOrbitalRadius = pData.visualRadius + mData.orbitalRadius;
                const fleetAngleOffset = mData.isSpaceship ? (mData.fleetOffsetAngle || 0) : 0;
                const initialMoonAngle = (Math.random() * Math.PI * 0.2) + fleetAngleOffset;

                moonMesh.position.x = scaledMoonOrbitalRadius * Math.cos(initialMoonAngle);
                moonMesh.position.z = scaledMoonOrbitalRadius * Math.sin(initialMoonAngle);
                planetMesh.add(moonMesh); // Add moon as child of planet mesh
                addObjectToScene(moonMesh, true, true); // Also add to global clickable/selectable

                const moonObj = {
                    mesh: moonMesh,
                    orbitalRadius: scaledMoonOrbitalRadius,
                    angularSpeedBase: (2 * Math.PI) / (mData.orbitalPeriodDays * 5),
                    currentAngle: initialMoonAngle,
                    isSpaceship: mData.isSpaceship
                };
                planetObject.moonObjects.push(moonObj);
            });
        }
        planetsArray.push(planetObject);
        addObjectToScene(planetMesh, true, true);

        // Create orbit lines
        const orbitPoints = [];
        const orbitSegments = 128;
        for (let i = 0; i <= orbitSegments; i++) {
            const M = (i / orbitSegments) * Math.PI * 2;
            let E = M;
            for (let k=0; k<5; k++) { E = E - (E - eccentricity * Math.sin(E) - M) / (1 - eccentricity * Math.cos(E)); }
            const v = 2 * Math.atan2(Math.sqrt(1+eccentricity)*Math.sin(E/2), Math.sqrt(1-eccentricity)*Math.cos(E/2));
            const r_true = scaledPlanetOrbitalRadius * (1 - eccentricity*eccentricity) / (1 + eccentricity * Math.cos(v));
            orbitPoints.push(new THREE.Vector3(r_true * Math.cos(v), 0, r_true * Math.sin(v)));
        }
        const orbitGeometry = new THREE.BufferGeometry().setFromPoints(orbitPoints);
        const orbitMaterial = new THREE.LineBasicMaterial({ color: pData.color, transparent: true, opacity: 0.3 });
        const orbitLine = new THREE.Line(orbitGeometry, orbitMaterial);
        orbitLine.rotation.x = orbitalInclinationRad;
        addOrbitLine(orbitLine); // Uses sceneManager function

        if (pData.hasRings) {
            const ringInnerRadius = pData.visualRadius * 1.3;
            const ringOuterRadius = pData.visualRadius * 2.5;
            const ringGeometry = new THREE.RingGeometry(ringInnerRadius, ringOuterRadius, 32);
            const ringMaterial = new THREE.MeshStandardMaterial({ color: 0xAAAAAA, metalness: 0.3, roughness: 0.7, side: THREE.DoubleSide, transparent: true, opacity: 0.5 });
            const ringMesh = new THREE.Mesh(ringGeometry, ringMaterial);
            ringMesh.rotation.x = Math.PI / 2;
            planetMesh.add(ringMesh);
        }
        console.log("Planet created:", pData.name);
    });
}

export function createAsteroidBelts() {
    const asteroidBeltsArray = getAsteroidBelts(); // from sceneManager
    const asteroidBeltsDefinition = configAsteroidBeltsData; // from config.js

    asteroidBeltsDefinition.forEach(beltData => {
        const beltAsteroidsGroup = new THREE.Group(); // Group for each belt's asteroids
        beltAsteroidsGroup.name = beltData.name;

        for (let i = 0; i < beltData.count; i++) {
            let asteroidGeometry;
            const type = Math.random();
            const size = 0.03 + Math.random() * 0.07;
            if (type < 0.4) asteroidGeometry = new THREE.IcosahedronGeometry(size, 0);
            else if (type < 0.7) asteroidGeometry = new THREE.DodecahedronGeometry(size, 0);
            else asteroidGeometry = new THREE.TetrahedronGeometry(size, 0);

            const asteroidMaterial = new THREE.MeshStandardMaterial({
                color: new THREE.Color(beltData.color).offsetHSL(Math.random() * 0.3 - 0.15, Math.random() * 0.2 - 0.1, Math.random() * 0.2 - 0.1),
                metalness: 0.1, roughness: 0.9
            });
            const asteroid = new THREE.Mesh(asteroidGeometry, asteroidMaterial);

            const radius = (beltData.minRadiusAU + Math.random() * (beltData.maxRadiusAU - beltData.minRadiusAU)) * DISTANCE_SCALE_AU_TO_THREEJS;
            const angle = Math.random() * Math.PI * 2;
            const inclination = THREE.MathUtils.degToRad(beltData.minInclination + Math.random() * (beltData.maxInclination - beltData.minInclination));
            let yOffset = (Math.random() - 0.5) * beltData.thickness;
            let pos = new THREE.Vector3(radius * Math.cos(angle), yOffset, radius * Math.sin(angle));
            pos.applyAxisAngle(new THREE.Vector3(1,0,0), inclination);

            asteroid.position.copy(pos);
            asteroid.userData = {
                isAsteroid: true, orbitalRadius: radius, currentAngle: angle,
                angularSpeedBase: (2 * Math.PI) / ((150 + Math.random() * 250) * 100),
                orbitalInclinationRad: inclination, yOffset: yOffset
            };
            beltAsteroidsGroup.add(asteroid); // Add to belt's group
        }
        addObjectToScene(beltAsteroidsGroup); // Add the whole belt group to the scene
        asteroidBeltsArray.push(beltAsteroidsGroup); // Store the group
        console.log("Asteroid belt created:", beltData.name);
    });
}

export function createComets() {
    const cometsArray = getComets(); // from sceneManager
    const cometsDefinition = configCometsData; // from config.js

    cometsDefinition.forEach(cData => {
        const cometGeometry = new THREE.SphereGeometry(cData.visualRadius, 8, 6);
        const cometMaterial = new THREE.MeshStandardMaterial({ color: cData.color, emissive: cData.color, emissiveIntensity: 0.3, roughness: 0.7 });
        const cometMesh = new THREE.Mesh(cometGeometry, cometMaterial);
        cometMesh.userData = { isComet: true, name: cData.name, visualRadius: cData.visualRadius };

        const a = cData.semiMajorAxisAU * DISTANCE_SCALE_AU_TO_THREEJS;
        const e = cData.eccentricity;
        const r_perihelion = a * (1 - e);
        let pos = new THREE.Vector3(r_perihelion, 0, 0);

        const incl = THREE.MathUtils.degToRad(cData.inclinationDegrees);
        const Omega = THREE.MathUtils.degToRad(cData.longitudeOfAscendingNodeDegrees);
        const omega_arg = THREE.MathUtils.degToRad(cData.argumentOfPeriapsisDegrees);

        pos.applyAxisAngle(new THREE.Vector3(0,0,1), omega_arg);
        const xAxisOrbitalPlane = new THREE.Vector3(1,0,0).applyAxisAngle(new THREE.Vector3(0,0,1), omega_arg);
        pos.applyAxisAngle(xAxisOrbitalPlane, incl);
        pos.applyAxisAngle(new THREE.Vector3(0,1,0), Omega);
        cometMesh.position.copy(pos);

        const trailMaterial = new THREE.LineBasicMaterial({ color: cData.color, transparent: true, opacity: 0.5 });
        const trailGeometry = new THREE.BufferGeometry();
        const trailMesh = new THREE.Line(trailGeometry, trailMaterial);
        trailMesh.visible = false;
        addObjectToScene(trailMesh); // Add trail to scene

        const cometObj = {
            mesh: cometMesh, data: cData, currentAngle: 0,
            angularSpeedBase: (2 * Math.PI) / (cData.orbitalPeriodYears * 100),
            trailPoints: [], trailMesh: trailMesh
        };
        cometsArray.push(cometObj);
        addObjectToScene(cometMesh, true, true);
        console.log("Comet created:", cData.name);
    });
}

console.log("celestialBodyFactory.js loaded");