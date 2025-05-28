// Main application entry point for Solar Frontier

// THREE will be accessed as a global variable from the CDN script.
import * as Config from './config.js';
import * as Utils from './utils.js';
import * as SceneManager from './sceneManager.js';
import * as UIManager from './uiManager.js';
import * as Controls from './controls.js';
import * as CelestialBodyFactory from './celestialBodyFactory.js';
import * as StationFactory from './stationFactory.js';
import * as ShipFactory from './shipFactory.js'; // For player ship
// ShipFactory is used by ShipLogic, not directly by main.js for now
import * as ShipLogic from './shipLogic.js';
import * as EconomyManager from './economyManager.js';

console.log("Main.js loaded - Attempting to initialize Solar Frontier");

// Global state managed by main.js
let isPaused = false;
let simulationSpeed = 0.1; // Initial simulation speed
let isFollowing = false; // Camera follow state
let playerShipMesh = null; // To hold the player's ship object
let currentSelectableObjectIndex = 0; // For cycling through objects

// --- Main Initialization Function ---
function init() {
    console.log("Initializing Solar Frontier from main.js...");

    // 1. Initialize Scene Manager (creates scene, camera, renderer, globalClock)
    SceneManager.initScene(document.body, simulationSpeed);
    window.solarSystemGlobalClock = SceneManager.getGlobalClock(); // Make clock accessible for UIManager if needed for ETA

    // 2. Initialize UI Manager
    UIManager.initUI({
        togglePauseCallback: togglePause,
        simulationSpeedUpdateCallback: updateSimulationSpeed,
        openInfoModalCallback: UIManager.openInfoModal, // UI Manager handles its own modal display
        toggleBrowserFullscreenCallback: toggleBrowserFullscreen,
        selectObjectByInteractionCallback: selectObjectByInteraction, // For UIManager's object list
        startNewGameCallback: startNewGame // Callback for "New Game" button
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
showMainMenu: UIManager.showMainMenu,
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
// 6.5. Create Player Ship
    playerShipMesh = ShipFactory.createPlayerShipMesh();
    playerShipMesh.userData = {
        isPlayerShip: true,
        isShip: true, // For existing selection/highlight logic
        name: Config.playerData.playerShip.name || "Player Ship",
        displayName: Config.playerData.playerShip.name || "Player Ship", // For UI
        type: Config.playerData.playerShip.type || "LightFreighter",
        // Add other relevant player ship data from Config.playerData.playerShip if needed
        engineGlow: playerShipMesh.userData.engineGlow // Preserve from factory
    };
    SceneManager.addObjectToScene(playerShipMesh, true, true); // Clickable, Selectable
    playerShipMesh.position.set(0, 5, 50); // Initial position
    // Rotate it to face a certain direction, e.g., towards origin
    playerShipMesh.lookAt(0, 0, 0); 
    console.log("Player ship created:", playerShipMesh.userData.name);
    StationFactory.createStations(); // This will use data from config.js and add to sceneManager's arrays

    // 7. Initialize Economy (after stations are created)
    EconomyManager.initializeStationMarkets(); // This also calls initializePassengerTerminals

    // 8. Populate UI Elements that depend on scene objects
    UIManager.populateObjectSelectionMenu(); // Populate with initial objects

    // 9. Set initial focus
    if (playerShipMesh) {
        selectObjectByInteraction(playerShipMesh);
        const orderedObjects = SceneManager.getOrderedSelectableObjects();
        currentSelectableObjectIndex = orderedObjects.findIndex(obj => obj === playerShipMesh);
        // If playerShipMesh is not in orderedObjects (e.g., not made selectable), findIndex is -1.
        // Fallback to 0 or first available object if player ship isn't selectable for some reason.
        if (currentSelectableObjectIndex === -1) {
            console.warn("Player ship mesh not found in selectable objects array for focus indexing. Defaulting focus.");
            if (orderedObjects.length > 0) {
                selectObjectByInteraction(orderedObjects[0]);
                currentSelectableObjectIndex = 0;
            } else {
                updateOverallInfoBoxState(); // No objects to select
            }
        }
    } else {
        // Original fallback logic if no player ship
        const orderedSelectableObjects = SceneManager.getOrderedSelectableObjects();
        if (orderedSelectableObjects.length > 0) {
            selectObjectByInteraction(orderedSelectableObjects[0]);
            currentSelectableObjectIndex = 0;
        } else {
            updateOverallInfoBoxState();
        }
    }
    
    console.log("Solar Frontier Initialization Complete.");
    // The game simulation starts here, main menu will be an overlay.
    // UIManager.showMainMenu() is called at the end of its initUI.
    animate(); 
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
// Update Player Ship
        if (playerShipMesh) {
            const playerMoved = Controls.handlePlayerShipMovement(deltaTime, playerShipMesh);
            // If player ship moved, we might want to update camera to follow it,
            // or ensure free camera movement is temporarily overridden.
            // For now, if player ship is focused and followed, handleCameraFollowAndFocus should adapt.
            // If player ship moved, and it's the focused object, update the info box.
            if (playerMoved && SceneManager.getFocusedObject() === playerShipMesh) {
                updateOverallInfoBoxState(); // Update info box if player ship moved
            }
        }

        // Update celestial bodies (planets, moons, asteroids, comets)
        updateCelestialBodies(effectiveDeltaTime);
        updateStations(effectiveDeltaTime); // Update station orbits and rotations
    }

    // Update camera and controls
    const camera = SceneManager.getCamera();
    const orbitControls = SceneManager.getControls(); // Assuming sceneManager.getControls() returns orbit controls
    
    const movedByWASD = Controls.handleFreeCameraMovement(deltaTime, camera, orbitControls, updateOverallInfoBoxState, (target, pos, followingState) => {
        SceneManager.setTargetLookAtForFocus(target);
        SceneManager.setTargetCameraPositionForFocus(pos);
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

function startNewGame() {
    console.log("startNewGame called from main.js. Ensuring game is active.");
    // This function is called after UIManager.showGameUI() hides the main menu.

    if (isPaused) {
        togglePause(); // Unpause the game if it was paused
    }

    // Reset simulation speed to default (or from config if available)
    simulationSpeed = Config.INITIAL_SIMULATION_SPEED !== undefined ? Config.INITIAL_SIMULATION_SPEED : 0.1;
    UIManager.updateSpeedDisplay(simulationSpeed);
    if (UIManager.speedSlider) { // Ensure slider UI element exists
        UIManager.speedSlider.value = simulationSpeed;
    }

    // Ensure an object is focused if nothing is (e.g., first time starting)
    // init() already handles initial focus. This is more of a safeguard or reset point.
    const orderedSelectableObjects = SceneManager.getOrderedSelectableObjects();
    if (orderedSelectableObjects.length > 0 && !SceneManager.getFocusedObject()) {
        selectObjectByInteraction(orderedSelectableObjects[0]);
        currentSelectableObjectIndex = 0; // Reset index if re-focusing
    }

    updateOverallInfoBoxState(); // Update the info box text
    console.log("Game is now active and configured by startNewGame.");
}

function updateCelestialBodies(effectiveDeltaTime) {
    const planets = SceneManager.planets;
    const comets = SceneManager.comets; // Changed from getComets()
    const asteroidBelts = SceneManager.asteroidBelts; // Changed from getAsteroidBelts()

    // Update Planets and Moons (simplified from original, actual orbital mechanics are complex)
    planets.forEach(p => {
        p.currentAngle += p.angularSpeedBase * simulationSpeed;
        const a = p.orbitalRadius; const e = p.eccentricity; const M = p.currentAngle;
        let E = M; for (let i = 0; i < 5; i++) { E = E - (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E)); }
        const v = 2 * Math.atan2(Math.sqrt(1 + e) * Math.sin(E / 2), Math.sqrt(1 - e) * Math.cos(E / 2));
        const r = a * (1 - e * e) / (1 + e * Math.cos(v));
        let newPosVec = new window.THREE.Vector3(r * Math.cos(v), 0, r * Math.sin(v));
        newPosVec.applyAxisAngle(new window.THREE.Vector3(1, 0, 0), p.orbitalInclinationRad);
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
                let astPos = new window.THREE.Vector3(asteroid.userData.orbitalRadius * Math.cos(asteroid.userData.currentAngle), asteroid.userData.yOffset, asteroid.userData.orbitalRadius * Math.sin(asteroid.userData.currentAngle));
                astPos.applyAxisAngle(new window.THREE.Vector3(1,0,0), asteroid.userData.orbitalInclinationRad);
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
        let posInOrbitalPlane = new window.THREE.Vector3(x_orb, 0, y_orb);
        const incl = window.THREE.MathUtils.degToRad(cData.inclinationDegrees); const Omega = window.THREE.MathUtils.degToRad(cData.longitudeOfAscendingNodeDegrees); const omega_arg = window.THREE.MathUtils.degToRad(cData.argumentOfPeriapsisDegrees);
        let q = new window.THREE.Quaternion(); let finalPos = new window.THREE.Vector3().copy(posInOrbitalPlane);
        q.setFromAxisAngle(new window.THREE.Vector3(0,1,0), omega_arg); finalPos.applyQuaternion(q); // Mistake in original, should be Z for orbital plane
        q.setFromAxisAngle(new window.THREE.Vector3(1,0,0), incl); finalPos.applyQuaternion(q);
        q.setFromAxisAngle(new window.THREE.Vector3(0,1,0), Omega); finalPos.applyQuaternion(q);
        comet.mesh.position.copy(finalPos);

        if (Math.floor(frameCount) % Config.COMET_TRAIL_UPDATE_INTERVAL === 0) {
            const sunPosition = SceneManager.sun.position; // Assuming getSun() returns the sun mesh
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
        let newStationPos = new window.THREE.Vector3(s.orbitalRadius * Math.cos(s.currentAngle), 0, s.orbitalRadius * Math.sin(s.currentAngle));
        if (s.parentMesh === SceneManager.getSun() && s.orbitalInclinationRad) {
            newStationPos.applyAxisAngle(new window.THREE.Vector3(1,0,0), s.orbitalInclinationRad);
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
        const currentFollowTargetPos = focusedObj.getWorldPosition(new window.THREE.Vector3());
        if(orbitControls) orbitControls.target.copy(currentFollowTargetPos);

        const objectRadius = Utils.getObjectVisualRadius(focusedObj);
        let mediumDistanceMultiplier = focusedObj.userData.name === "Sun" ? 3.5 :
                                       focusedObj.userData.isPlanet ? 6 :
                                       focusedObj.userData.isComet ? 25 :
                                       focusedObj.userData.isStation ? 5 :
                                       focusedObj.userData.isShip ? 20 : 10;
        const followDistance = objectRadius * mediumDistanceMultiplier;
        const directionToCamera = new window.THREE.Vector3().subVectors(camera.position, currentFollowTargetPos).normalize();
        if (directionToCamera.lengthSq() === 0) directionToCamera.set(0,0.5,1).normalize(); // Default if camera is at target
        const desiredCameraPosition = new window.THREE.Vector3().addVectors(currentFollowTargetPos, directionToCamera.multiplyScalar(followDistance));
        
        if (SceneManager.targetCameraPositionForFocus) {
            camera.position.lerp(SceneManager.targetCameraPositionForFocus, 0.05);
            if (camera.position.distanceTo(SceneManager.targetCameraPositionForFocus) < 0.1) SceneManager.setTargetCameraPositionForFocus(null);
        } else {
            camera.position.lerp(desiredCameraPosition, 0.1);
        }
        SceneManager.setTargetLookAtForFocus(null); 
    } else if (SceneManager.targetLookAtForFocus) {
        const lerpFactor = 0.05;
        if(orbitControls) orbitControls.target.lerp(SceneManager.targetLookAtForFocus, lerpFactor);
        if (SceneManager.targetCameraPositionForFocus) camera.position.lerp(SceneManager.targetCameraPositionForFocus, lerpFactor);

        const targetReached = orbitControls ? orbitControls.target.distanceTo(SceneManager.targetLookAtForFocus) < 0.1 : true;
        const positionReached = !SceneManager.targetCameraPositionForFocus || camera.position.distanceTo(SceneManager.targetCameraPositionForFocus) < 0.1;

        if (targetReached && positionReached) {
            if(orbitControls) orbitControls.target.copy(SceneManager.targetLookAtForFocus);
            if (SceneManager.targetCameraPositionForFocus) camera.position.copy(SceneManager.targetCameraPositionForFocus);
            SceneManager.setTargetLookAtForFocus(null); SceneManager.setTargetCameraPositionForFocus(null);
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
    // UIManager.updateSpeedDisplay is called by its own event listener in uiManager
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
        SceneManager.setTargetLookAtForFocus(focusedObj.getWorldPosition(new window.THREE.Vector3()));
        const objectRadius = Utils.getObjectVisualRadius(focusedObj);
        let offsetDistance = objectRadius * 5;
        if (focusedObj.userData.name === "Sun") offsetDistance = objectRadius * 3;
        else if (focusedObj.userData.isComet) offsetDistance = objectRadius * 20;
        else if (focusedObj.userData.isStation) offsetDistance = objectRadius * 8;
        else if (focusedObj.userData.isMoon) offsetDistance = objectRadius * 10;
        else if (focusedObj.userData.isShip) offsetDistance = objectRadius * 25;

        const camera = SceneManager.getCamera();
        if (maintainCameraDirection) {
            const direction = new window.THREE.Vector3();
            camera.getWorldDirection(direction);
            SceneManager.setTargetCameraPositionForFocus(new window.THREE.Vector3().copy(SceneManager.targetLookAtForFocus).add(direction.multiplyScalar(-offsetDistance)));
        } else {
            SceneManager.targetCameraPositionForFocus = new window.THREE.Vector3(
                SceneManager.targetLookAtForFocus.x,
                SceneManager.targetLookAtForFocus.y + offsetDistance * 0.7,
                SceneManager.targetLookAtForFocus.z + offsetDistance * 0.7
            );
        }
    } else {
        SceneManager.setTargetLookAtForFocus(null); SceneManager.setTargetCameraPositionForFocus(null);
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
        SceneManager.setTargetLookAtForFocus(focusedObj.getWorldPosition(new window.THREE.Vector3()));
        const objectRadius = Utils.getObjectVisualRadius(focusedObj);
        let offsetDistance = objectRadius * (focusedObj.userData.name === "Sun" ? 2.5 : focusedObj.userData.isShip ? 15 : 4);
        const direction = new window.THREE.Vector3();
        SceneManager.getCamera().getWorldDirection(direction);
        SceneManager.setTargetCameraPositionForFocus(new window.THREE.Vector3().copy(SceneManager.targetLookAtForFocus).add(direction.multiplyScalar(-offsetDistance)));
    } else if (!isFollowing) {
        SceneManager.setTargetCameraPositionForFocus(null);
        // targetLookAtForFocus might still be set if user just clicked, that's fine.
    }
    updateOverallInfoBoxState();
}

function toggleFocusAndFollow() {
    const focusedObj = SceneManager.getFocusedObject();
    if (focusedObj) {
        if (isFollowing) { // If already following, unfollow and stop specific camera positioning
            isFollowing = false;
            SceneManager.setTargetCameraPositionForFocus(null);
            SceneManager.setTargetLookAtForFocus(null); // Let OrbitControls take over smoothly
        } else { // Not following, or following something else: Start following this object
            isFollowing = true;
            const orbitControls = SceneManager.getControls();
            if(orbitControls) orbitControls.target.copy(focusedObj.getWorldPosition(new window.THREE.Vector3()));
            
            const objectRadius = Utils.getObjectVisualRadius(focusedObj);
            let mediumDistanceMultiplier = focusedObj.userData.name === "Sun" ? 3.5 :
                                           focusedObj.userData.isPlanet ? 6 :
                                           focusedObj.userData.isComet ? 25 :
                                           focusedObj.userData.isStation ? 5 :
                                           focusedObj.userData.isShip ? 20 : 10;
            const followDistance = objectRadius * mediumDistanceMultiplier;
            const camera = SceneManager.getCamera();
            const directionFromObjectToCamera = new window.THREE.Vector3().subVectors(camera.position, orbitControls.target).normalize();
             if (directionFromObjectToCamera.lengthSq() === 0) {
                camera.getWorldDirection(directionFromObjectToCamera);
                directionFromObjectToCamera.negate();
            }
            SceneManager.setTargetCameraPositionForFocus(new window.THREE.Vector3().addVectors(orbitControls.target, directionFromObjectToCamera.multiplyScalar(followDistance)));
            SceneManager.setTargetLookAtForFocus(null); // LookAt is handled by controls.target when following
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