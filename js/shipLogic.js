// js/shipLogic.js
// Manages NPC ship spawning, movement, status updates, and name generation.

import * as THREE from 'three'; // Assuming THREE is global via CDN
import { MAX_ACTIVE_SHIPS, SHIP_SPAWN_INTERVAL, SHIP_DOCK_TIME, DISTANCE_SCALE_AU_TO_THREEJS, SHIP_NAME_PREFIXES, SHIP_NAME_CORES_CARGO, SHIP_NAME_CORES_PASSENGER, SHIP_NAME_CORES_PIRATE, SHIP_NAME_SUFFIXES } from './config.js';
import { createCargoShipMesh, createPassengerShipMesh, createPirateShipMesh } from './shipFactory.js';
import { addObjectToScene, removeObjectFromScene, getGlobalClock, getActiveShips as getGlobalActiveShipsArray, getStations as getGlobalStationsArray, getFocusedObject, setFocusedObject, getHighlightMesh } from './sceneManager.js';
// UIManager might be needed for updating selection menu, or pass callbacks
// import { populateObjectSelectionMenu, updateInfoBox } from './uiManager.js'; // If direct calls are preferred over callbacks

let nextShipId = 0;
let shipSpawnTimer = 0;

// Callbacks to be set by main.js
let _populateObjectSelectionMenuCallback;
let _updateInfoBoxCallback;
let _getSimulationSpeedCallback;


export function initShipLogic(callbacks) {
    _populateObjectSelectionMenuCallback = callbacks.populateObjectSelectionMenu;
    _updateInfoBoxCallback = callbacks.updateInfoBox;
    _getSimulationSpeedCallback = callbacks.getSimulationSpeed;
    console.log("Ship logic initialized with callbacks");
}

// Generates a ship name based on its type
export function generateShipName(shipType) {
    let coreNames;
    let prefixes = SHIP_NAME_PREFIXES; // Use all prefixes by default
    let suffixes = SHIP_NAME_SUFFIXES;

    switch (shipType) {
        case "CARGO":
            coreNames = SHIP_NAME_CORES_CARGO;
            break;
        case "PASSENGER":
            coreNames = SHIP_NAME_CORES_PASSENGER;
            break;
        case "PIRATE":
            coreNames = SHIP_NAME_CORES_PIRATE;
            // Optionally, pirate ships could have their own prefix/suffix pool if desired
            break;
        default:
            coreNames = ["Venture", "Explorer", "Pioneer"]; // Generic fallback
            prefixes = ["Generic"];
            suffixes = ["Unit"];
    }

    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)] || "";
    const core = coreNames[Math.floor(Math.random() * coreNames.length)] || "Ship";
    const suffix = suffixes[Math.floor(Math.random() * suffixes.length)] || Math.floor(Math.random() * 100).toString();
    
    return `${prefix} ${core} ${suffix}`.trim().replace(/\s+/g, ' '); // Ensure single spaces and trim
}

export function manageShipPopulation(isPaused) {
    if (isPaused) return;
    const globalClock = getGlobalClock();
    if (!globalClock) return;

    const activeShips = getGlobalActiveShipsArray();
    shipSpawnTimer += globalClock.getDelta();

    if (activeShips.length < MAX_ACTIVE_SHIPS && shipSpawnTimer > SHIP_SPAWN_INTERVAL) {
        spawnNewShip();
        shipSpawnTimer = 0;
    }
}

function spawnNewShip() {
    const stations = getGlobalStationsArray();
    const activeShips = getGlobalActiveShipsArray();
    if (stations.length < 2) return;

    let originStation, destinationStation;
    let attempts = 0;
    do {
        originStation = stations[Math.floor(Math.random() * stations.length)];
        destinationStation = stations[Math.floor(Math.random() * stations.length)];
        attempts++;
    } while (originStation === destinationStation && attempts < stations.length * 2);

    if (originStation === destinationStation) return;

    const typeRoll = Math.random();
    let shipType;
    let shipMesh;

    if (typeRoll < 0.5) { // 50% Cargo
        shipType = "CARGO";
        shipMesh = createCargoShipMesh();
    } else if (typeRoll < 0.85) { // 35% Passenger
        shipType = "PASSENGER";
        shipMesh = createPassengerShipMesh();
    } else { // 15% Pirate
        shipType = "PIRATE";
        shipMesh = createPirateShipMesh();
    }
    
    const shipDisplayName = generateShipName(shipType);
    // The shipId can remain simple for internal tracking, or also use parts of the name.
    // For simplicity, keeping the numeric ID for now.
    const shipId = `${shipType.toUpperCase()}_${nextShipId++}`;

    shipMesh.userData = {
        isShip: true,
        name: shipId, // Internal ID (e.g., CARGO_0, PIRATE_1)
        displayName: shipDisplayName, // For display in UI (e.g., "Star Hauler Alpha")
        type: shipType,
        originName: originStation.mesh.userData.name,
        destinationName: destinationStation.mesh.userData.name,
        engineGlow: shipMesh.userData.engineGlow
    };

    const originPos = originStation.mesh.getWorldPosition(new THREE.Vector3());
    shipMesh.position.copy(originPos);

    const destPos = destinationStation.mesh.getWorldPosition(new THREE.Vector3());
    shipMesh.lookAt(destPos);

    addObjectToScene(shipMesh, true, true); // Add to scene, clickable, selectable

    const newShip = {
        id: shipId, // Internal ID
        displayName: shipDisplayName,
        type: shipType,
        mesh: shipMesh,
        originStation: originStation,
        destinationStation: destinationStation,
        progress: 0,
        speed: (0.003 + Math.random() * 0.003) * (DISTANCE_SCALE_AU_TO_THREEJS / 15),
        status: "DEPARTING",
        departureTime: getGlobalClock().getElapsedTime(),
        arrivalTime: 0,
        totalTravelTime: 0,
        dockTimer: 0
    };

    const totalDist = originPos.distanceTo(destPos);
    if (newShip.speed > 0) {
        newShip.totalTravelTime = totalDist / newShip.speed;
    } else {
        newShip.totalTravelTime = Infinity;
    }

    activeShips.push(newShip);
    if (_populateObjectSelectionMenuCallback) _populateObjectSelectionMenuCallback();
    console.log(`Spawned Ship: ${newShip.displayName} (ID: ${newShip.id}), Type: ${newShip.type}`);
}

function handleShipArrival(ship) {
    ship.status = "ARRIVED";
    ship.arrivalTime = getGlobalClock().getElapsedTime();
    if (ship.mesh.userData.engineGlow) ship.mesh.userData.engineGlow.visible = false;
    console.log(`${ship.displayName} arrived at ${ship.destinationStation.mesh.userData.name}. Will dock for ${SHIP_DOCK_TIME}s.`);
}

// handleShipDeparture might not be needed if status changes are direct in update loop

function removeShipFromSystem(ship) {
    console.log(`${ship.displayName} despawning from ${ship.destinationStation.mesh.userData.name}.`);
    removeObjectFromScene(ship.mesh); // Uses sceneManager function

    const activeShips = getGlobalActiveShipsArray();
    let index = activeShips.indexOf(ship);
    if (index > -1) activeShips.splice(index, 1);

    if (getFocusedObject() === ship.mesh) {
        setFocusedObject(null);
        const highlight = getHighlightMesh();
        if(highlight) highlight.visible = false;
        // geminiPlanetInfoButton.style.display = 'none'; // This should be handled by UIManager via callback
        if (_updateInfoBoxCallback) _updateInfoBoxCallback(); // Let main logic update info box
    }
    if (_populateObjectSelectionMenuCallback) _populateObjectSelectionMenuCallback();
}

export function updateShips(deltaTime, effectiveDeltaTime, isPaused) {
    if (isPaused) return;
    const activeShips = getGlobalActiveShipsArray();

    for (let i = activeShips.length - 1; i >= 0; i--) {
        const ship = activeShips[i];
        const originPos = ship.originStation.mesh.getWorldPosition(new THREE.Vector3());
        const destPos = ship.destinationStation.mesh.getWorldPosition(new THREE.Vector3());
        const totalDist = originPos.distanceTo(destPos);
        const journeyTimeFactor = 0.05;

        if (ship.status === "DEPARTING") {
            if (ship.mesh.userData.engineGlow) ship.mesh.userData.engineGlow.visible = true;
            const distToMove = ship.speed * effectiveDeltaTime * 0.7;
            if (totalDist > 0) ship.progress += distToMove / totalDist; else ship.progress = 1; // Avoid NaN if totalDist is 0
            if (ship.progress >= journeyTimeFactor) {
                ship.status = "TRAVELLING";
            }
        } else if (ship.status === "TRAVELLING") {
            if (ship.mesh.userData.engineGlow) ship.mesh.userData.engineGlow.visible = true;
            const distToMove = ship.speed * effectiveDeltaTime;
            if (totalDist > 0) ship.progress += distToMove / totalDist; else ship.progress = 1;
            if (ship.progress >= (1 - journeyTimeFactor)) {
                ship.status = "APPROACHING";
            }
        } else if (ship.status === "APPROACHING") {
            if (ship.mesh.userData.engineGlow) ship.mesh.userData.engineGlow.visible = true;
            const distToMove = ship.speed * effectiveDeltaTime * 0.5;
            if (totalDist > 0) ship.progress += distToMove / totalDist; else ship.progress = 1;
            if (ship.progress >= 1) {
                ship.progress = 1;
                ship.mesh.position.copy(destPos);
                handleShipArrival(ship);
            }
        } else if (ship.status === "ARRIVED") {
            if (ship.mesh.userData.engineGlow) ship.mesh.userData.engineGlow.visible = false;
            ship.dockTimer += deltaTime; // Unscaled delta time for docking
            if (ship.dockTimer >= SHIP_DOCK_TIME) {
                removeShipFromSystem(ship);
                continue; 
            }
        }

        if (ship.status !== "ARRIVED" && ship.status !== "REMOVED") {
            if (totalDist > 0.01) {
                ship.mesh.position.lerpVectors(originPos, destPos, ship.progress);
                ship.mesh.lookAt(destPos);
            } else if (ship.status !== "ARRIVED") {
                 ship.progress = 1;
                 ship.mesh.position.copy(destPos);
                 handleShipArrival(ship);
            }
        }
    }
}

console.log("shipLogic.js loaded");