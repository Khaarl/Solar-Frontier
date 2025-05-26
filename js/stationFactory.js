// js/stationFactory.js
// Functions for creating different station types.

// THREE will be accessed as a global variable from the CDN script.
import { stationsData as configStationsData, DISTANCE_SCALE_AU_TO_THREEJS } from './config.js';
import { addObjectToScene, getStations as getGlobalStationsArray, getPlanets, getSun } from './sceneManager.js'; // Assuming sceneManager exposes these

// Individual station geometry creation functions
function createCoriolisStation(data) {
    const group = new THREE.Group();
    const torusRadius = data.visualSize / 2;
    const tubeRadius = torusRadius * 0.2;
    const material = new THREE.MeshStandardMaterial({ color: data.color, metalness: 0.4, roughness: 0.6 });
    const torusGeometry = new THREE.TorusGeometry(torusRadius, tubeRadius, 16, 40);
    const torus = new THREE.Mesh(torusGeometry, material);
    torus.rotation.x = Math.PI / 2;
    group.add(torus);

    const spokeMaterial = new THREE.MeshStandardMaterial({ color: data.color, metalness: 0.2, roughness: 0.8 });
    for (let i = 0; i < 6; i++) {
        const spokeGeometry = new THREE.CylinderGeometry(tubeRadius * 0.2, tubeRadius * 0.2, torusRadius * 1.9, 6);
        const spoke = new THREE.Mesh(spokeGeometry, spokeMaterial);
        const angle = (i / 6) * Math.PI * 2;
        spoke.position.set(Math.cos(angle) * torusRadius * 0.5, 0, Math.sin(angle) * torusRadius * 0.5);
        spoke.lookAt(torus.position);
        spoke.rotateX(Math.PI / 2);
        group.add(spoke);
    }
    const hubGeometry = new THREE.SphereGeometry(tubeRadius * 1.5, 16, 16);
    const hub = new THREE.Mesh(hubGeometry, material);
    group.add(hub);

    group.userData = { isStation: true, name: data.name, type: data.type, visualSize: data.visualSize, rotationSpeed: data.rotationSpeed, navLights: [] };
    for(let i=0; i<4; i++) {
        const lightGeo = new THREE.SphereGeometry(0.03, 6,6);
        const lightMat = new THREE.MeshBasicMaterial({color: (i%2===0) ? 0xff0000: 0x00ff00});
        const light = new THREE.Mesh(lightGeo, lightMat);
        light.position.set(Math.cos(i*Math.PI/2) * (torusRadius + tubeRadius), 0, Math.sin(i*Math.PI/2) * (torusRadius + tubeRadius));
        group.add(light);
        group.userData.navLights.push(light);
    }
    return group;
}

function createTorusStation(data) {
    const geometry = new THREE.TorusGeometry(data.visualSize, data.tubeRadius || data.visualSize * 0.2, 20, 50);
    const material = new THREE.MeshStandardMaterial({ color: data.color, metalness: 0.5, roughness: 0.5 });
    const torus = new THREE.Mesh(geometry, material);
    torus.rotation.x = Math.PI / 2;
    torus.userData = { isStation: true, name: data.name, type: data.type, visualSize: data.visualSize, rotationSpeed: data.rotationSpeed, navLights: [] };
    for(let i=0; i<3; i++) {
        const lightGeo = new THREE.SphereGeometry(0.02, 6,6);
        const lightMat = new THREE.MeshBasicMaterial({color: 0xff0000});
        const light = new THREE.Mesh(lightGeo, lightMat);
        const angle = (i/3) * Math.PI * 2;
        light.position.set(Math.cos(angle) * (data.visualSize + (data.tubeRadius||0)*0.5), 0, Math.sin(angle) * (data.visualSize + (data.tubeRadius||0)*0.5));
        torus.userData.navLights.push(light);
        torus.add(light);
    }
    return torus;
}

function createModularStation(data) {
    const group = new THREE.Group();
    const material = new THREE.MeshStandardMaterial({ color: data.color, metalness: 0.6, roughness: 0.4 });
    const mainModuleSize = data.visualSize * 0.6;
    const mainModule = new THREE.Mesh(new THREE.BoxGeometry(mainModuleSize, mainModuleSize, mainModuleSize * 1.5), material);
    group.add(mainModule);
    group.userData = { isStation: true, name: data.name, type: data.type, visualSize: data.visualSize, navLights: [], rotatingParts: [] };

    for (let i = 0; i < 4; i++) {
        const armModule = new THREE.Mesh(new THREE.CylinderGeometry(mainModuleSize * 0.2, mainModuleSize * 0.2, mainModuleSize * 1.2, 8), material);
        armModule.position.set(
            (i % 2 === 0 ? (i === 0 ? 1 : -1) : 0) * mainModuleSize * 0.8,
            (i % 2 !== 0 ? (i === 1 ? 1 : -1) : 0) * mainModuleSize * 0.8,
            0
        );
        armModule.lookAt(0,0,0);
        group.add(armModule);
        const lightGeo = new THREE.SphereGeometry(0.025, 6,6);
        const lightMat = new THREE.MeshBasicMaterial({color: 0x00ff00});
        const light = new THREE.Mesh(lightGeo, lightMat);
        light.position.copy(armModule.position).multiplyScalar(1.1);
        group.add(light);
        group.userData.navLights.push(light);
    }
    return group;
}

function createONeillCylinderStation(data) {
    const geometry = new THREE.CylinderGeometry(data.visualRadius, data.visualRadius, data.visualLength, 32, 1, true);
    const material = new THREE.MeshStandardMaterial({ color: data.color, metalness: 0.7, roughness: 0.3, side: THREE.DoubleSide });
    const cylinder = new THREE.Mesh(geometry, material);
    cylinder.rotation.z = Math.PI / 2;
    cylinder.userData = { isStation: true, name: data.name, type: data.type, visualSize: Math.max(data.visualLength, data.visualRadius * 2), rotationSpeed: data.rotationSpeed };
    return cylinder;
}

function createDodecOutpostStation(data) {
    const geometry = new THREE.DodecahedronGeometry(data.visualSize / 2, 1);
    const material = new THREE.MeshStandardMaterial({ color: data.color, metalness: 0.2, roughness: 0.8 });
    const dodec = new THREE.Mesh(geometry, material);
    dodec.userData = { isStation: true, name: data.name, type: data.type, visualSize: data.visualSize };
    return dodec;
}

function createGeodesicDomeClusterStation(data) {
    const group = new THREE.Group();
    const material = new THREE.MeshStandardMaterial({ color: data.color, metalness: 0.1, roughness: 0.9 });
    const mainDome = new THREE.Mesh(new THREE.IcosahedronGeometry(data.visualSize / 2, 3), material);
    group.add(mainDome);
    group.userData = { isStation: true, name: data.name, type: data.type, visualSize: data.visualSize, navLights: [] };
    for(let i=0; i<4; i++) {
        const smallDome = new THREE.Mesh(new THREE.IcosahedronGeometry(data.visualSize / 5, 1), material);
        const angle = (i/4) * Math.PI * 2;
        smallDome.position.set(Math.cos(angle) * data.visualSize * 0.6, 0, Math.sin(angle) * data.visualSize * 0.6);
        group.add(smallDome);
        const lightGeo = new THREE.SphereGeometry(0.02, 6,6);
        const lightMat = new THREE.MeshBasicMaterial({color: 0xffaa00});
        const light = new THREE.Mesh(lightGeo, lightMat);
        light.position.copy(smallDome.position).y += data.visualSize / 5 + 0.01;
        group.add(light);
        group.userData.navLights.push(light);
    }
    return group;
}

function createLaunchPlatformArrayStation(data) {
    const group = new THREE.Group();
    const platformMaterial = new THREE.MeshStandardMaterial({ color: data.color, metalness: 0.8, roughness: 0.2 });
    const towerMaterial = new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.7, roughness: 0.4 });
    const numPlatforms = 3;
    const spacing = data.visualSize / numPlatforms;

    for (let i = 0; i < numPlatforms; i++) {
        const platform = new THREE.Mesh(new THREE.BoxGeometry(spacing * 0.8, data.visualSize * 0.05, data.visualSize * 0.3), platformMaterial);
        platform.position.x = (i - (numPlatforms -1)/2) * spacing;
        group.add(platform);

        const tower = new THREE.Mesh(new THREE.CylinderGeometry(spacing * 0.05, spacing * 0.05, data.visualSize * 0.4, 8), towerMaterial);
        tower.position.x = platform.position.x;
        tower.position.y = data.visualSize * 0.225;
        group.add(tower);
    }
    group.userData = { isStation: true, name: data.name, type: data.type, visualSize: data.visualSize };
    return group;
}

function createTrussSpindleStation(data) {
    const group = new THREE.Group();
    const spindleMaterial = new THREE.MeshStandardMaterial({ color: data.color, metalness: 0.6, roughness: 0.5 });
    const moduleMaterial = new THREE.MeshStandardMaterial({ color: new THREE.Color(data.color).offsetHSL(0,0,0.1), metalness: 0.4, roughness: 0.7 });

    const spindleLength = data.visualSize;
    const spindleRadius = data.visualSize * 0.05;
    const spindle = new THREE.Mesh(new THREE.CylinderGeometry(spindleRadius, spindleRadius, spindleLength, 12), spindleMaterial);
    spindle.rotation.x = Math.PI / 2;
    group.add(spindle);

    const moduleSize = data.visualSize * 0.2;
    const module1 = new THREE.Mesh(new THREE.DodecahedronGeometry(moduleSize, 0), moduleMaterial);
    module1.position.z = spindleLength / 2 + moduleSize * 0.6;
    spindle.add(module1);

    const module2 = new THREE.Mesh(new THREE.DodecahedronGeometry(moduleSize, 0), moduleMaterial);
    module2.position.z = -spindleLength / 2 - moduleSize * 0.6;
    spindle.add(module2);

    group.userData = { isStation: true, name: data.name, type: data.type, visualSize: data.visualSize, rotationSpeed: data.rotationSpeed, navLights: [] };
    [module1, module2].forEach(mod => {
        const lightGeo = new THREE.SphereGeometry(0.02, 6,6);
        const lightMat = new THREE.MeshBasicMaterial({color: 0xff0000});
        const light = new THREE.Mesh(lightGeo, lightMat);
        light.position.copy(mod.position).normalize().multiplyScalar(mod.position.length() + 0.03);
        group.userData.navLights.push(light);
        spindle.add(light);
    });
    return group;
}

function createSkeletalFrameStation(data) {
    const group = new THREE.Group();
    const material = new THREE.MeshStandardMaterial({ color: data.color, metalness: 0.9, roughness: 0.2 });
    const beamRadius = data.visualSize * 0.02;
    const length = data.visualSize;

    for(let i=0; i<5; i++){
        const beamGeo = new THREE.CylinderGeometry(beamRadius, beamRadius, length * (0.6 + Math.random()*0.6), 6);
        const beam = new THREE.Mesh(beamGeo, material);
        beam.position.set((Math.random()-0.5)*length*0.5, (Math.random()-0.5)*length*0.5, (Math.random()-0.5)*length*0.5);
        beam.rotation.set(Math.random()*Math.PI, Math.random()*Math.PI, Math.random()*Math.PI);
        group.add(beam);
    }
    const centerSphere = new THREE.Mesh(new THREE.SphereGeometry(length*0.1, 8,8), material);
    group.add(centerSphere);

    group.userData = { isStation: true, name: data.name, type: data.type, visualSize: data.visualSize };
    return group;
}


// Main function to create all stations
export function createStations() {
    const stationsArray = getGlobalStationsArray(); // from sceneManager
    const planetsArray = getPlanets(); // from sceneManager
    const sunMesh = getSun(); // from sceneManager
    const stationsDefinition = configStationsData; // from config.js

    if (!stationsArray || !planetsArray || !sunMesh) {
        console.error("Required scene elements (stations array, planets array, or sun) not initialized in createStations");
        return;
    }
    
    stationsDefinition.forEach(sData => {
        let stationMesh;
        switch (sData.type) {
            case "CORIOLIS": stationMesh = createCoriolisStation(sData); break;
            case "TORUS": stationMesh = createTorusStation(sData); break;
            case "MODULAR": stationMesh = createModularStation(sData); break;
            case "ONEILL_CYLINDER": stationMesh = createONeillCylinderStation(sData); break;
            case "DODEC_OUTPOST": stationMesh = createDodecOutpostStation(sData); break;
            case "GEODESIC_DOME_CLUSTER": stationMesh = createGeodesicDomeClusterStation(sData); break;
            case "LAUNCH_PLATFORM_ARRAY": stationMesh = createLaunchPlatformArrayStation(sData); break;
            case "ASTEROID_BASE":
                stationMesh = new THREE.Mesh(new THREE.SphereGeometry(sData.visualSize * 0.5, 8, 6), new THREE.MeshStandardMaterial({color: sData.color, metalness:0.2, roughness:0.8}));
                stationMesh.userData = { isStation: true, name: sData.name, type: sData.type, visualSize: sData.visualSize };
                break;
            case "TRUSS_SPINDLE": stationMesh = createTrussSpindleStation(sData); break;
            case "SKELETAL_FRAME": stationMesh = createSkeletalFrameStation(sData); break;
            default:
                stationMesh = new THREE.Mesh(new THREE.BoxGeometry(sData.visualSize, sData.visualSize, sData.visualSize), new THREE.MeshStandardMaterial({color: 0xff0000}));
                stationMesh.userData = { isStation: true, name: sData.name, type: "UNKNOWN", visualSize: sData.visualSize };
        }

        // Ensure essential userData for economy is copied
        stationMesh.userData.stationId = sData.id;
        stationMesh.userData.economyType = sData.economyType;
        stationMesh.userData.population = sData.population;
        stationMesh.userData.techLevel = sData.techLevel;
        // Deep copy market and passenger terminal data to avoid shared references
        stationMesh.userData.market = JSON.parse(JSON.stringify(sData.market || { commodities: [] }));
        stationMesh.userData.passengerTerminal = JSON.parse(JSON.stringify(sData.passengerTerminal || { available: [], demand: [] }));


        let parentObjectMesh;
        if (sData.orbitsBody) {
            const planetParent = planetsArray.find(p => p.mesh.userData.name === sData.orbitsBody);
            if (planetParent) {
                parentObjectMesh = planetParent.mesh;
            } else {
                for (const p of planetsArray) {
                    const moonParent = p.moonObjects.find(m => m.mesh.name === sData.orbitsBody);
                    if (moonParent) {
                        parentObjectMesh = moonParent.mesh;
                        break;
                    }
                }
            }
        } else if (sData.inAsteroidBelt) {
            parentObjectMesh = sunMesh;
            // This logic for sData.orbitalRadius was in the original, might need adjustment if asteroidBeltsData isn't directly available here
            // const beltInfo = asteroidBeltsData.find(b => b.name === sData.inAsteroidBelt); // asteroidBeltsData from config
            // sData.orbitalRadius = beltInfo ? (beltInfo.minRadiusAU + Math.random() * (beltInfo.maxRadiusAU - beltInfo.minRadiusAU)) * DISTANCE_SCALE_AU_TO_THREEJS : 40 * DISTANCE_SCALE_AU_TO_THREEJS;
        }


        let stationOrbitalRadius;
        if (sData.orbitsBody === "Sun" && sData.orbitalRadiusAU) {
            stationOrbitalRadius = sData.orbitalRadiusAU * DISTANCE_SCALE_AU_TO_THREEJS;
        } else {
            stationOrbitalRadius = sData.orbitalRadius; // Assumed pre-scaled or relative
        }
        
        let initialAngle = Math.random() * Math.PI * 2;
        stationMesh.position.x = stationOrbitalRadius * Math.cos(initialAngle);
        stationMesh.position.z = stationOrbitalRadius * Math.sin(initialAngle);

        if(parentObjectMesh === sunMesh && sData.orbitalInclinationDegrees) {
            const stationInclinationRad = THREE.MathUtils.degToRad(sData.orbitalInclinationDegrees);
            stationMesh.position.applyAxisAngle(new THREE.Vector3(1,0,0), stationInclinationRad);
        }

        if (parentObjectMesh && parentObjectMesh !== sunMesh && !sData.inAsteroidBelt) {
            parentObjectMesh.add(stationMesh);
        } else {
            addObjectToScene(stationMesh); // Add to global scene if orbiting Sun or no parent defined
        }

        const stationObject = {
            mesh: stationMesh,
            parentMesh: parentObjectMesh || sunMesh,
            orbitalRadius: stationOrbitalRadius,
            angularSpeedBase: (2 * Math.PI) / ((sData.orbitalPeriodDays || (sData.orbitalPeriodYears || 1) * 365.25) * 20),
            currentAngle: initialAngle,
            rotationSpeed: sData.rotationSpeed || 0,
            orbitalInclinationRad: (parentObjectMesh === sunMesh && sData.orbitalInclinationDegrees) ? THREE.MathUtils.degToRad(sData.orbitalInclinationDegrees) : 0,
        };
        stationsArray.push(stationObject);
        addObjectToScene(stationMesh, true, true); // Add to clickable/selectable
        console.log("Station created:", sData.name);
    });
}

console.log("stationFactory.js loaded");