// Main application entry point for Solar Frontier

import * as THREE from 'three'; // Assuming THREE is available globally via CDN for now
import * as Config from './config.js';
import * as Utils from './utils.js';
import * as SceneManager from './sceneManager.js';
import * as UIManager from './uiManager.js';
import * as Controls from './controls.js';
import * as CelestialBodyFactory from './celestialBodyFactory.js';
import * as StationFactory from './stationFactory.js';
// ShipFactory is used by ShipLogic, not directly by main.js for now
import * as ShipLogic from './shipLogic.js';
import * as EconomyManager from './economyManager.js';

console.log("Main.js loaded - Attempting to initialize Solar Frontier");

// Global state managed by main.js
let isPaused = false;
let simulationSpeed = 0.1; // Initial simulation speed
let isFollowing = false; // Camera follow state
let currentSelectableObjectIndex = 0; // For cycling through objects

// --- Main Initialization Function ---
function init() {
    console.log("Initializing Solar Frontier from main.js...");

    // 1. Initialize Scene Manager (creates scene, camera, renderer, globalClock)
    SceneManager.initScene(document.body, simulationSpeed);
    window.solarSystemGlobalClock = SceneManager.getGlobalClock(); // Make clock accessible for UIManager if needed for ETA

    // 2. Initialize UI Manager
    UIManager.initUI({
        togglePause: togglePause,
        simulationSpeedUpdateCallback: updateSimulationSpeed,
        openInfoModal: UIManager.openInfoModal, // UI Manager handles its own modal display
        toggleBrowserFullscreen: toggleBrowserFullscreen,
        // Callbacks for actions that UI elements might trigger but are managed by main.js
        // These will be passed to Controls.initControls where the actual event listeners are
    });
    UIManager.updateSpeedDisplay(simulationSpeed);

    // 3. Initialize Controls
    Controls.initControls({
        selectObjectByInteraction: selectObjectByInteraction,
        selectNextOrPreviousObject: selectNextOrPreviousObject,
        toggleFollow: toggleFollow,
        toggleFocusAndFollow: toggleFocusAndFollow,
        openInfoModal: UIManager.openInfoModal,
        toggleObjectSelectionMenu: UIManager.toggleObjectSelectionMenu,
        openMarketModalForStation: () => {
            const focusedObj = SceneManager.getFocusedObject();
            if (focusedObj && focusedObj.userData.isStation) {
                EconomyManager.completePassengerMissionOnArrival(focusedObj); // Check missions on market open
                UIManager.openMarketModalForStation(focusedObj, EconomyManager.buyCommodity, EconomyManager.sellCommodity, EconomyManager.acceptPassengers);
            } else {
                UIManager.openInfoModal('no_station_market');
            }
        },
        openShipOverviewModal: UIManager.openShipOverviewModalUI,
        updateInfoBox: updateOverallInfoBoxState,
        setCameraTargets: SceneManager.setFocusedObject, // Simplified: directly set focused object in sceneManager
        toggleOrbitLines: SceneManager.toggleOrbitLinesVisibility,
    });

    // 4. Initialize Economy Manager (sets up markets, passenger terminals)
    EconomyManager.initEconomyManager({
        openMarketModal: (stationMesh) => { // Callback for economy to refresh market UI
            UIManager.openMarketModalForStation(stationMesh, EconomyManager.buyCommodity, EconomyManager.sellCommodity, EconomyManager.acceptPassengers);
        },
        updatePlayerMarketInfo: UIManager.updatePlayerMarketInfoUIDisplay,
    });

    // 5. Initialize Ship Logic (sets up ship spawning timers etc.)
    ShipLogic.initShipLogic({
        populateObjectSelectionMenu: UIManager.populateObjectSelectionMenu, // UIManager handles its own menu population
        updateInfoBox: updateOverallInfoBoxState,
        getSimulationSpeed: () => simulationSpeed, // Provide current sim speed
    });

    // 6. Create Celestial Bodies & Stations
    CelestialBodyFactory.createSun();
    CelestialBodyFactory.createPlanetsAndMoons();
    CelestialBodyFactory.createAsteroidBelts();
    CelestialBodyFactory.createComets();
    StationFactory.createStations(); // This will use data from config.js and add to sceneManager's arrays

    // 7. Initialize Economy (after stations are created)
    EconomyManager.initializeStationMarkets(); // This also calls initializePassengerTerminals

    // 8. Populate UI Elements that depend on scene objects
    UIManager.populateObjectSelectionMenu(); // Populate with initial objects

    // 9. Set initial focus
    const orderedSelectableObjects = SceneManager.getOrderedSelectableObjects();
    if (orderedSelectableObjects.length > 0) {
        selectObjectByInteraction(orderedSelectableObjects[0]);
        currentSelectableObjectIndex = 0;
    } else {
        updateOverallInfoBoxState();
    }
    
    console.log("Solar Frontier Initialization Complete.");
    animate(); // Start the animation loop
}

// --- Main Animation Loop ---
function animate() {
    requestAnimationFrame(animate);
    const deltaTime = SceneManager.getGlobalClock().getDelta();
    const effectiveDeltaTime = deltaTime * simulationSpeed;

    // Update game logic only if not paused
    if (!isPaused) {
        EconomyManager.updateEconomy(isPaused); // Economy updates (includes passenger refresh checks)
        ShipLogic.manageShipPopulation(isPaused); // Manage ship spawning
        ShipLogic.updateShips(deltaTime, effectiveDeltaTime, isPaused); // Update ship positions and states

        // Update celestial bodies (planets, moons, asteroids, comets)
        updateCelestialBodies(effectiveDeltaTime);
        updateStations(effectiveDeltaTime); // Update station orbits and rotations
    }

    // Update camera and controls
    const camera = SceneManager.getCamera();
    const orbitControls = SceneManager.getControls(); // Assuming sceneManager.getControls() returns orbit controls
    
    const movedByWASD = Controls.handleFreeCameraMovement(deltaTime, camera, orbitControls, updateOverallInfoBoxState, (target, pos, followingState) => {
        SceneManager.targetLookAtForFocus = target;
        SceneManager.targetCameraPositionForFocus = pos;
        isFollowing = followingState; // Update main's isFollowing state
    });

    if (!movedByWASD) {
        handleCameraFollowAndFocus(camera, orbitControls);
    }
    
    SceneManager.updateControls(); // Updates OrbitControls if damping is enabled
    UIManager.updateHighlightAndGeminiButton(); // Update highlight based on focused object

    SceneManager.renderScene();
}

// --- Helper and Callback Functions for Main Logic ---

function updateCelestialBodies(effectiveDeltaTime) {
    const planets = SceneManager.getPlanets();
    const comets = SceneManager.getComets();
    const asteroidBelts = SceneManager.getAsteroidBelts(); // This is an array of groups/arrays of asteroids

    // Update Planets and Moons (simplified from original, actual orbital mechanics are complex)
    planets.forEach(p => {
        p.currentAngle += p.angularSpeedBase * simulationSpeed;
        const a = p.orbitalRadius; const e = p.eccentricity; const M = p.currentAngle;
        let E = M; for (let i = 0; i < 5; i++) { E = E - (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E)); }
        const v = 2 * Math.atan2(Math.sqrt(1 + e) * Math.sin(E / 2), Math.sqrt(1 - e) * Math.cos(E / 2));
        const r = a * (1 - e * e) / (1 + e * Math.cos(v));
        let newPosVec = new THREE.Vector3(r * Math.cos(v), 0, r * Math.sin(v));
        newPosVec.applyAxisAngle(new THREE.Vector3(1, 0, 0), p.orbitalInclinationRad);
        p.mesh.position.copy(newPosVec);
        p.mesh.rotation.y += 0.005 * simulationSpeed;

        p.moonObjects.forEach(m => {
            m.currentAngle += m.angularSpeedBase * simulationSpeed * Config.MOON_SIMULATION_SPEED_MULTIPLIER;
            m.mesh.position.x = m.orbitalRadius * Math.cos(m.currentAngle);
            m.mesh.position.z = m.orbitalRadius * Math.sin(m.currentAngle);
            m.mesh.rotation.y += 0.01 * simulationSpeed * Config.MOON_SIMULATION_SPEED_MULTIPLIER;
            if (m.mesh.name === "Borg Cube") m.mesh.rotation.x += 0.003 * simulationSpeed * Config.MOON_SIMULATION_SPEED_MULTIPLIER;
            if (m.isSpaceship) { m.mesh.rotation.x += 0.005 * simulationSpeed * Config.MOON_SIMULATION_SPEED_MULTIPLIER; m.mesh.rotation.z += 0.002 * simulationSpeed * Config.MOON_SIMULATION_SPEED_MULTIPLIER; }
        });
    });

    // Update Asteroid Belts
    asteroidBelts.forEach(belt => { // belt is now a THREE.Group
        belt.children.forEach(asteroid => { // Iterate over actual asteroid meshes
            if (asteroid.userData.isAsteroid) {
                asteroid.userData.currentAngle += asteroid.userData.angularSpeedBase * simulationSpeed;
                let astPos = new THREE.Vector3(asteroid.userData.orbitalRadius * Math.cos(asteroid.userData.currentAngle), asteroid.userData.yOffset, asteroid.userData.orbitalRadius * Math.sin(asteroid.userData.currentAngle));
                astPos.applyAxisAngle(new THREE.Vector3(1,0,0), asteroid.userData.orbitalInclinationRad);
                asteroid.position.copy(astPos);
                asteroid.rotation.x += 0.01 * simulationSpeed; asteroid.rotation.y += 0.015 * simulationSpeed;
            }
        });
    });
    
    // Update Comets (orbital math and trail logic)
    const frameCount = SceneManager.getGlobalClock().getElapsedTime() * 60; // Approximate frame count
    comets.forEach(comet => {
        comet.currentAngle += comet.angularSpeedBase * simulationSpeed;
        const cData = comet.data; const a = cData.semiMajorAxisAU * Config.DISTANCE_SCALE_AU_TO_THREEJS; const e = cData.eccentricity; const M = comet.currentAngle;
        let E = M; for(let i=0; i<5; i++) { E = E - (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E));}
        const x_orb = a * (Math.cos(E) - e); const y_orb = a * Math.sqrt(1 - e * e) * Math.sin(E);
        let posInOrbitalPlane = new THREE.Vector3(x_orb, 0, y_orb);
        const incl = THREE.MathUtils.degToRad(cData.inclinationDegrees); const Omega = THREE.MathUtils.degToRad(cData.longitudeOfAscendingNodeDegrees); const omega_arg = THREE.MathUtils.degToRad(cData.argumentOfPeriapsisDegrees);
        let q = new THREE.Quaternion(); let finalPos = new THREE.Vector3().copy(posInOrbitalPlane);
        q.setFromAxisAngle(new THREE.Vector3(0,1,0), omega_arg); finalPos.applyQuaternion(q); // Mistake in original, should be Z for orbital plane
        q.setFromAxisAngle(new THREE.Vector3(1,0,0), incl); finalPos.applyQuaternion(q);
        q.setFromAxisAngle(new THREE.Vector3(0,1,0), Omega); finalPos.applyQuaternion(q);
        comet.mesh.position.copy(finalPos);

        if (Math.floor(frameCount) % Config.COMET_TRAIL_UPDATE_INTERVAL === 0) {
            const sunPosition = SceneManager.getSun().position; // Assuming getSun() returns the sun mesh
            const distanceToSunAU = comet.mesh.position.distanceTo(sunPosition) / Config.DISTANCE_SCALE_AU_TO_THREEJS;
            if (distanceToSunAU < Config.COMET_TRAIL_PROXIMITY_AU) {
                comet.trailPoints.push(comet.mesh.position.clone());
                if (comet.trailPoints.length > Config.MAX_TRAIL_POINTS) comet.trailPoints.shift();
                if (comet.trailPoints.length > 1) {
                    comet.trailMesh.geometry.setFromPoints(comet.trailPoints);
                    comet.trailMesh.geometry.attributes.position.needsUpdate = true;
                    comet.trailMesh.visible = true;
                    comet.trailMesh.material.opacity = Math.max(0.1, 1 - (distanceToSunAU / Config.COMET_TRAIL_PROXIMITY_AU) * 0.8);
                }
            } else {
                if (comet.trailPoints.length > 0) { comet.trailPoints.shift();
                    if (comet.trailPoints.length > 1) { comet.trailMesh.geometry.setFromPoints(comet.trailPoints); comet.trailMesh.geometry.attributes.position.needsUpdate = true;}
                    else comet.trailMesh.visible = false;
                } else comet.trailMesh.visible = false;
            }
        }
    });
}

function updateStations(effectiveDeltaTime) {
    const stations = SceneManager.getStations();
    const clockElapsedTime = SceneManager.getGlobalClock().getElapsedTime();

    stations.forEach(s => {
        s.currentAngle += s.angularSpeedBase * simulationSpeed; // Use global simulationSpeed
        let newStationPos = new THREE.Vector3(s.orbitalRadius * Math.cos(s.currentAngle), 0, s.orbitalRadius * Math.sin(s.currentAngle));
        if (s.parentMesh === SceneManager.getSun() && s.orbitalInclinationRad) {
            newStationPos.applyAxisAngle(new THREE.Vector3(1,0,0), s.orbitalInclinationRad);
        }

        if (s.parentMesh && s.parentMesh !== SceneManager.getSun()) {
            s.mesh.position.copy(newStationPos);
        } else {
            s.mesh.position.copy(newStationPos);
        }

        if (s.rotationSpeed) {
            if(s.mesh.userData.type === "ONEILL_CYLINDER" || s.mesh.userData.type === "CORIOLIS" || s.mesh.userData.type === "TRUSS_SPINDLE") s.mesh.rotation.y += s.rotationSpeed * simulationSpeed;
            else s.mesh.rotation.y += s.rotationSpeed * simulationSpeed;
        }
        if (s.mesh.userData.navLights && s.mesh.userData.navLights.length > 0) {
            const blinkState = Math.floor(clockElapsedTime * (2 + Math.random()*0.5)) % 2 === 0;
            s.mesh.userData.navLights.forEach(light => { light.visible = blinkState; });
        }
    });
}


function handleCameraFollowAndFocus(camera, orbitControls) {
    const focusedObj = SceneManager.getFocusedObject();
    if (isFollowing && focusedObj) {
        const currentFollowTargetPos = focusedObj.getWorldPosition(new THREE.Vector3());
        if(orbitControls) orbitControls.target.copy(currentFollowTargetPos);

        const objectRadius = Utils.getObjectVisualRadius(focusedObj);
        let mediumDistanceMultiplier = focusedObj.userData.name === "Sun" ? 3.5 :
                                       focusedObj.userData.isPlanet ? 6 :
                                       focusedObj.userData.isComet ? 25 :
                                       focusedObj.userData.isStation ? 5 :
                                       focusedObj.userData.isShip ? 20 : 10;
        const followDistance = objectRadius * mediumDistanceMultiplier;
        const directionToCamera = new THREE.Vector3().subVectors(camera.position, currentFollowTargetPos).normalize();
        if (directionToCamera.lengthSq() === 0) directionToCamera.set(0,0.5,1).normalize(); // Default if camera is at target
        const desiredCameraPosition = new THREE.Vector3().addVectors(currentFollowTargetPos, directionToCamera.multiplyScalar(followDistance));
        
        if (SceneManager.targetCameraPositionForFocus) {
            camera.position.lerp(SceneManager.targetCameraPositionForFocus, 0.05);
            if (camera.position.distanceTo(SceneManager.targetCameraPositionForFocus) < 0.1) SceneManager.targetCameraPositionForFocus = null;
        } else {
            camera.position.lerp(desiredCameraPosition, 0.1);
        }
        SceneManager.targetLookAtForFocus = null; 
    } else if (SceneManager.targetLookAtForFocus) {
        const lerpFactor = 0.05;
        if(orbitControls) orbitControls.target.lerp(SceneManager.targetLookAtForFocus, lerpFactor);
        if (SceneManager.targetCameraPositionForFocus) camera.position.lerp(SceneManager.targetCameraPositionForFocus, lerpFactor);

        const targetReached = orbitControls ? orbitControls.target.distanceTo(SceneManager.targetLookAtForFocus) < 0.1 : true;
        const positionReached = !SceneManager.targetCameraPositionForFocus || camera.position.distanceTo(SceneManager.targetCameraPositionForFocus) < 0.1;

        if (targetReached && positionReached) {
            if(orbitControls) orbitControls.target.copy(SceneManager.targetLookAtForFocus);
            if (SceneManager.targetCameraPositionForFocus) camera.position.copy(SceneManager.targetCameraPositionForFocus);
            SceneManager.targetLookAtForFocus = null; SceneManager.targetCameraPositionForFocus = null;
        }
    }
}


function togglePause() {
    isPaused = !isPaused;
    UIManager.pauseButton.textContent = isPaused ? "Resume" : "Pause";
    updateOverallInfoBoxState();
}

function updateSimulationSpeed(newSpeed) {
    simulationSpeed = newSpeed;
    // UIManager.updateSpeedDisplay is called by its own event listener
}

function toggleBrowserFullscreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(err => {
            console.log("Fullscreen request failed: " + err.message);
        });
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        }
    }
}

function selectObjectByInteraction(objectToSelect, maintainCameraDirection = true) {
    if (!objectToSelect) return;
    SceneManager.setFocusedObject(objectToSelect);
    const focusedObj = SceneManager.getFocusedObject(); // Re-get after setting

    if (focusedObj.userData.isStation) {
        EconomyManager.completePassengerMissionOnArrival(focusedObj);
    }

    if (!(Controls.isWDown || Controls.isSDown || Controls.isADown || Controls.isDDown || Controls.isZDown || Controls.isXDown)) {
        SceneManager.targetLookAtForFocus = focusedObj.getWorldPosition(new THREE.Vector3());
        const objectRadius = Utils.getObjectVisualRadius(focusedObj);
        let offsetDistance = objectRadius * 5;
        if (focusedObj.userData.name === "Sun") offsetDistance = objectRadius * 3;
        else if (focusedObj.userData.isComet) offsetDistance = objectRadius * 20;
        else if (focusedObj.userData.isStation) offsetDistance = objectRadius * 8;
        else if (focusedObj.userData.isMoon) offsetDistance = objectRadius * 10;
        else if (focusedObj.userData.isShip) offsetDistance = objectRadius * 25;

        const camera = SceneManager.getCamera();
        if (maintainCameraDirection) {
            const direction = new THREE.Vector3();
            camera.getWorldDirection(direction);
            SceneManager.targetCameraPositionForFocus = new THREE.Vector3().copy(SceneManager.targetLookAtForFocus).add(direction.multiplyScalar(-offsetDistance));
        } else {
            SceneManager.targetCameraPositionForFocus = new THREE.Vector3(
                SceneManager.targetLookAtForFocus.x,
                SceneManager.targetLookAtForFocus.y + offsetDistance * 0.7,
                SceneManager.targetLookAtForFocus.z + offsetDistance * 0.7
            );
        }
    } else {
        SceneManager.targetLookAtForFocus = null; SceneManager.targetCameraPositionForFocus = null;
    }
    updateOverallInfoBoxState();
    UIManager.updateHighlightAndGeminiButton();
    currentSelectableObjectIndex = SceneManager.getOrderedSelectableObjects().findIndex(obj => obj === focusedObj);
}

function selectNextOrPreviousObject(direction) {
    const orderedObjects = SceneManager.getOrderedSelectableObjects();
    if (orderedObjects.length === 0) return;
    if (direction === 'next') {
        currentSelectableObjectIndex++;
        if (currentSelectableObjectIndex >= orderedObjects.length) currentSelectableObjectIndex = 0;
    } else if (direction === 'previous') {
        currentSelectableObjectIndex--;
        if (currentSelectableObjectIndex < 0) currentSelectableObjectIndex = orderedObjects.length - 1;
    }
    selectObjectByInteraction(orderedObjects[currentSelectableObjectIndex], false);
}

function toggleFollow() {
    isFollowing = !isFollowing;
    const focusedObj = SceneManager.getFocusedObject();
    if (isFollowing && focusedObj) {
        SceneManager.targetLookAtForFocus = focusedObj.getWorldPosition(new THREE.Vector3());
        const objectRadius = Utils.getObjectVisualRadius(focusedObj);
        let offsetDistance = objectRadius * (focusedObj.userData.name === "Sun" ? 2.5 : focusedObj.userData.isShip ? 15 : 4);
        const direction = new THREE.Vector3();
        SceneManager.getCamera().getWorldDirection(direction);
        SceneManager.targetCameraPositionForFocus = new THREE.Vector3().copy(SceneManager.targetLookAtForFocus).add(direction.multiplyScalar(-offsetDistance));
    } else if (!isFollowing) {
        SceneManager.targetCameraPositionForFocus = null; 
        // targetLookAtForFocus might still be set if user just clicked, that's fine.
    }
    updateOverallInfoBoxState();
}

function toggleFocusAndFollow() {
    const focusedObj = SceneManager.getFocusedObject();
    if (focusedObj) {
        if (isFollowing) { // If already following, unfollow and stop specific camera positioning
            isFollowing = false;
            SceneManager.targetCameraPositionForFocus = null;
            SceneManager.targetLookAtForFocus = null; // Let OrbitControls take over smoothly
        } else { // Not following, or following something else: Start following this object
            isFollowing = true;
            const orbitControls = SceneManager.getControls();
            if(orbitControls) orbitControls.target.copy(focusedObj.getWorldPosition(new THREE.Vector3()));
            
            const objectRadius = Utils.getObjectVisualRadius(focusedObj);
            let mediumDistanceMultiplier = focusedObj.userData.name === "Sun" ? 3.5 :
                                           focusedObj.userData.isPlanet ? 6 :
                                           focusedObj.userData.isComet ? 25 :
                                           focusedObj.userData.isStation ? 5 :
                                           focusedObj.userData.isShip ? 20 : 10;
            const followDistance = objectRadius * mediumDistanceMultiplier;
            const camera = SceneManager.getCamera();
            const directionFromObjectToCamera = new THREE.Vector3().subVectors(camera.position, orbitControls.target).normalize();
             if (directionFromObjectToCamera.lengthSq() === 0) { 
                camera.getWorldDirection(directionFromObjectToCamera);
                directionFromObjectToCamera.negate();
            }
            SceneManager.targetCameraPositionForFocus = new THREE.Vector3().addVectors(orbitControls.target, directionFromObjectToCamera.multiplyScalar(followDistance));
            SceneManager.targetLookAtForFocus = null; // LookAt is handled by controls.target when following
        }
        updateOverallInfoBoxState();
    }
}


function updateOverallInfoBoxState() {
    let statusText = isPaused ? "(Paused)" : "(Running)";
    let textToShow = `Solar System ${statusText}`; // Default
    const focusedObj = SceneManager.getFocusedObject();

    if (Controls.isWDown || Controls.isSDown || Controls.isADown || Controls.isDDown || Controls.isZDown || Controls.isXDown) {
        textToShow = `Free Moving ${statusText}`;
    } else if (focusedObj) {
        const objectName = focusedObj.userData.displayName || focusedObj.userData.name || "Unknown Object";
        const objectType = focusedObj.userData.isShip ? ` (${focusedObj.userData.type} Ship)` : "";
        if (isFollowing) {
            textToShow = `Following: ${objectName}${objectType}`;
        } else {
            textToShow = `Focused on: ${objectName}${objectType} ${statusText}`;
        }
    }
    UIManager.updateInfoBoxContent(textToShow);
}


// Start the simulation when the DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}