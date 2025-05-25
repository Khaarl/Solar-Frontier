// js/shipFactory.js
// Functions for creating NPC ship meshes (Cargo, Passenger, Pirate).

import * as THREE from 'three'; // Assuming THREE is global via CDN

// --- Generic Ship Component Functions ---
function addEngineGlow(group, position, size, color = 0xFFFFAA) {
    const engineGlowGeo = new THREE.SphereGeometry(size, 8, 8);
    const engineGlowMat = new THREE.MeshBasicMaterial({ color: color, transparent: true, opacity: 0.6 });
    const engineGlow = new THREE.Mesh(engineGlowGeo, engineGlowMat);
    engineGlow.position.copy(position);
    engineGlow.visible = false;
    group.add(engineGlow);
    return engineGlow;
}

function addWireframe(group, geometry, color = 0xAAAAFF, position = null, rotation = null) {
    const edges = new THREE.EdgesGeometry(geometry);
    const lineMaterial = new THREE.LineBasicMaterial({ color: color, linewidth: 1 });
    const wireframe = new THREE.LineSegments(edges, lineMaterial);
    if (position) wireframe.position.copy(position);
    if (rotation) wireframe.rotation.copy(rotation);
    group.add(wireframe);
    return wireframe;
}

// --- Cargo Ship ---
export function createCargoShipMesh() {
    const group = new THREE.Group();
    const shipLength = 1.0; // Increased size
    const shipWidth = 0.45;
    const shipHeight = 0.35;

    // Main hull - more rectangular, like stacked containers
    const hullMaterial = new THREE.MeshStandardMaterial({ color: 0x607D8B, metalness: 0.5, roughness: 0.6 }); // Bluish grey
    const mainHullGeom = new THREE.BoxGeometry(shipLength * 0.7, shipHeight, shipWidth);
    const mainHullMesh = new THREE.Mesh(mainHullGeom, hullMaterial);
    mainHullMesh.position.x = -shipLength * 0.1; // Shifted slightly back
    group.add(mainHullMesh);
    addWireframe(group, mainHullGeom, 0x90A4AE, mainHullMesh.position);

    // Forward "command" module - smaller, distinct
    const commandMaterial = new THREE.MeshStandardMaterial({ color: 0xB0BEC5, metalness: 0.4, roughness: 0.5 });
    const commandGeom = new THREE.BoxGeometry(shipLength * 0.25, shipHeight * 0.7, shipWidth * 0.6);
    const commandMesh = new THREE.Mesh(commandGeom, commandMaterial);
    commandMesh.position.set(shipLength * 0.35, shipHeight * 0.05, 0); // Forward and slightly up
    group.add(commandMesh);
    addWireframe(group, commandGeom, 0xCFD8DC, commandMesh.position);
    
    // Cargo containers (visual only)
    const containerMaterial = new THREE.MeshStandardMaterial({ color: 0x78909C, metalness: 0.4, roughness: 0.7 });
    const containerGeom = new THREE.BoxGeometry(shipLength * 0.2, shipHeight * 0.8, shipWidth * 0.35);
    for (let i = 0; i < 2; i++) {
        const container1 = new THREE.Mesh(containerGeom, containerMaterial);
        container1.position.set(-shipLength * 0.15, 0, (i === 0 ? 1 : -1) * (shipWidth * 0.25));
        group.add(container1);
        addWireframe(group, containerGeom, 0xA7C0CD, container1.position);
    }
    
    group.userData.engineGlow = addEngineGlow(group, new THREE.Vector3(-shipLength / 2 - 0.08, 0, 0), shipHeight * 0.4, 0xFFCC88);
    console.log("Cargo ship mesh created (enhanced)");
    return group;
}

// --- Passenger Ship ---
export function createPassengerShipMesh() {
    const group = new THREE.Group();
    const shipLength = 1.2; // Longer, sleeker
    const shipRadius = 0.12; // Thinner main body

    const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0xECEFF1, metalness: 0.6, roughness: 0.3 }); // Lighter color
    const bodyGeometry = new THREE.CylinderGeometry(shipRadius, shipRadius * 0.8, shipLength, 16); // Tapered slightly
    const bodyMesh = new THREE.Mesh(bodyGeometry, bodyMaterial);
    bodyMesh.rotation.z = Math.PI / 2;
    group.add(bodyMesh);
    addWireframe(group, bodyGeometry, 0xB0C4DE, null, bodyMesh.rotation);

    // "Observation deck" / Bridge
    const bridgeMaterial = new THREE.MeshStandardMaterial({ color: 0x78909C, metalness: 0.5, roughness: 0.4 });
    const bridgeGeom = new THREE.SphereGeometry(shipRadius * 1.5, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2); // Half-sphere
    const bridgeMesh = new THREE.Mesh(bridgeGeom, bridgeMaterial);
    bridgeMesh.position.x = shipLength * 0.4; // Forward position
    bridgeMesh.rotation.z = -Math.PI / 2;
    group.add(bridgeMesh);
    
    // Swept "wings" or stabilizers
    const wingMaterial = new THREE.MeshStandardMaterial({ color: 0xB0BEC5, metalness: 0.5, roughness: 0.4 });
    const wingShape = new THREE.Shape();
    wingShape.moveTo(0, 0);
    wingShape.lineTo(shipLength * 0.3, shipRadius * 0.5);
    wingShape.lineTo(shipLength * 0.35, -shipRadius * 0.5);
    wingShape.lineTo(0, -shipRadius * 0.2);
    wingShape.closePath();
    const wingGeom = new THREE.ExtrudeGeometry(wingShape, { depth: 0.03, bevelEnabled: false });
    
    const wing1 = new THREE.Mesh(wingGeom, wingMaterial);
    wing1.position.set(-shipLength * 0.1, 0, shipRadius * 0.8);
    wing1.rotation.set(Math.PI/2, Math.PI/2, 0);
    group.add(wing1);

    const wing2 = wing1.clone();
    wing2.position.set(-shipLength * 0.1, 0, -shipRadius * 0.8);
    wing2.rotation.y = -Math.PI/2; // Mirror
    group.add(wing2);

    group.userData.engineGlow = addEngineGlow(group, new THREE.Vector3(-shipLength / 2 - 0.05, 0, 0), shipRadius * 0.9, 0x88CCFF);
    console.log("Passenger ship mesh created (enhanced)");
    return group;
}

// --- Pirate Ship ---
export function createPirateShipMesh() {
    const group = new THREE.Group();
    const shipLength = 1.1;
    const shipWidth = 0.35;
    const shipHeight = 0.28;

    const hullMaterial = new THREE.MeshStandardMaterial({ color: 0x424242, metalness: 0.8, roughness: 0.6 }); // Dark, metallic
    
    // Asymmetrical main hull
    const mainHullPoints = [
        new THREE.Vector2(-shipLength * 0.5, -shipWidth * 0.3),
        new THREE.Vector2(shipLength * 0.4, -shipWidth * 0.5), // Wider at back
        new THREE.Vector2(shipLength * 0.5, 0),                // Pointed rear
        new THREE.Vector2(shipLength * 0.4, shipWidth * 0.5),
        new THREE.Vector2(-shipLength * 0.5, shipWidth * 0.3),
        new THREE.Vector2(-shipLength * 0.6, 0),               // Pointed front
    ];
    const hullShape = new THREE.Shape(mainHullPoints);
    const extrudeSettings = { depth: shipHeight * 0.7, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.01, bevelSegments: 1 };
    const hullGeometry = new THREE.ExtrudeGeometry(hullShape, extrudeSettings);
    const hullMesh = new THREE.Mesh(hullGeometry, hullMaterial);
    hullMesh.rotation.x = Math.PI / 2; // Lay flat
    hullMesh.position.y = -shipHeight * 0.35; // Center it vertically
    group.add(hullMesh);
    addWireframe(group, hullGeometry, 0x757575, hullMesh.position, hullMesh.rotation);

    // Off-center cockpit
    const cockpitMaterial = new THREE.MeshStandardMaterial({ color: 0x616161, metalness: 0.7, roughness: 0.5 });
    const cockpitGeom = new THREE.BoxGeometry(shipLength * 0.2, shipHeight * 0.5, shipWidth * 0.3);
    const cockpitMesh = new THREE.Mesh(cockpitGeom, cockpitMaterial);
    cockpitMesh.position.set(-shipLength * 0.25, shipHeight * 0.2, shipWidth * 0.2); // Offset
    group.add(cockpitMesh);
    addWireframe(group, cockpitGeom, 0x9E9E9E, cockpitMesh.position);

    // "Weapon" pods - simple cylinders
    const weaponPodGeom = new THREE.CylinderGeometry(0.05, 0.04, 0.3, 6);
    const weaponPodMaterial = new THREE.MeshStandardMaterial({ color: 0x37474F, metalness: 0.9, roughness: 0.4 });
    const pod1 = new THREE.Mesh(weaponPodGeom, weaponPodMaterial);
    pod1.position.set(shipLength * 0.1, 0, shipWidth * 0.4);
    pod1.rotation.z = Math.PI / 2;
    group.add(pod1);

    const pod2 = new THREE.Mesh(weaponPodGeom, weaponPodMaterial);
    pod2.position.set(shipLength * 0.1, 0, -shipWidth * 0.4);
    pod2.rotation.z = Math.PI / 2;
    group.add(pod2);

    group.userData.engineGlow = addEngineGlow(group, new THREE.Vector3(shipLength * 0.55, 0, 0), shipHeight * 0.35, 0xFF6E40); // Fiery orange
    console.log("Pirate ship mesh created (enhanced)");
    return group;
}

console.log("shipFactory.js loaded");