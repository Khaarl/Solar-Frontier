// js/controls.js
// Manages keyboard and mouse event handlers.

import * as THREE from 'three'; // Assuming THREE is global via CDN
import { getScene, getCamera, getRaycaster, getMouse, getClickableObjects, getFocusedObject, setFocusedObject, getOrderedSelectableObjects, getControls as getOrbitControls } from './sceneManager.js';
// Callbacks to main logic / other managers will be needed
// e.g., for selectObjectByInteraction, openInfoModal, etc.

// Input state variables
export let isCKeyDown = false;
export let isWDown = false;
export let isSDown = false;
export let isADown = false;
export let isDDown = false;
export let isZDown = false;
export let isXDown = false;

// Callbacks to be set by main.js or another coordinator
let _selectObjectByInteractionCallback;
let _selectNextOrPreviousObjectCallback;
let _toggleFollowCallback;
let _toggleFocusAndFollowCallback;
let _openInfoModalCallback;
let _toggleObjectSelectionMenuCallback;
let _openMarketModalForStationCallback;
let _openShipOverviewModalCallback;
let _updateInfoBoxCallback;
let _setCameraTargetsCallback; // For (null, null) on free move
let _toggleOrbitLinesCallback;

export function initControls(callbacks) {
    _selectObjectByInteractionCallback = callbacks.selectObjectByInteraction;
    _selectNextOrPreviousObjectCallback = callbacks.selectNextOrPreviousObject;
    _toggleFollowCallback = callbacks.toggleFollow;
    _toggleFocusAndFollowCallback = callbacks.toggleFocusAndFollow;
    _openInfoModalCallback = callbacks.openInfoModal;
    _toggleObjectSelectionMenuCallback = callbacks.toggleObjectSelectionMenu;
    _openMarketModalForStationCallback = callbacks.openMarketModalForStation;
    _openShipOverviewModalCallback = callbacks.openShipOverviewModal;
    _updateInfoBoxCallback = callbacks.updateInfoBox;
    _setCameraTargetsCallback = callbacks.setCameraTargets;
    _toggleOrbitLinesCallback = callbacks.toggleOrbitLines;


    const renderer = getScene()?.renderer; // Or getRenderer() from sceneManager
    if (renderer && renderer.domElement) {
        renderer.domElement.addEventListener('mousedown', onDocumentMouseDown, false);
    } else {
        console.error("Renderer DOM element not found for mousedown listener.");
    }
    window.addEventListener('keydown', onKeyDown, false);
    window.addEventListener('keyup', onKeyUp, false);
    console.log("Controls initialized");
}

function onDocumentMouseDown(event) {
    const camera = getCamera();
    const raycaster = getRaycaster();
    const mouse = getMouse();
    const clickableObjs = getClickableObjects();
    let focusedObj = getFocusedObject();

    if (!camera || !raycaster || !mouse || !clickableObjs) return;

    // Ignore clicks on UI elements (this check might need to be more robust or handled by UIManager)
    if (event.target.closest('#simulationControls') || event.target.closest('.modal') || event.target.closest('#objectSelectionMenu')) {
        return;
    }

    if (!isCKeyDown && event.button === 0) { // Only left clicks if not holding 'C'
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;
        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(clickableObjs, true);

        if (intersects.length > 0) {
            let clickedObject = intersects[0].object;
            // Traverse up to find the main clickable object
            while (clickedObject.parent && !clickableObjs.includes(clickedObject)) {
                clickedObject = clickedObject.parent;
            }
            if (clickableObjs.includes(clickedObject) && clickedObject !== focusedObj) {
                if (_selectObjectByInteractionCallback) _selectObjectByInteractionCallback(clickedObject, true);
            }
        }
    }
}

function onKeyDown(event) {
    const key = event.key.toLowerCase();
    const orbitControls = getOrbitControls();

    if (key.startsWith('f') || key === 'enter' || key === 'r') {
        event.preventDefault();
    }

    switch(key) {
        case 'c': 
            isCKeyDown = true; 
            if(orbitControls) orbitControls.enableRotate = true; 
            break;
        case '[': 
            if (_selectNextOrPreviousObjectCallback) _selectNextOrPreviousObjectCallback('previous'); 
            break;
        case ']': 
            if (_selectNextOrPreviousObjectCallback) _selectNextOrPreviousObjectCallback('next'); 
            break;
        case 'f':
            if (_toggleFollowCallback) _toggleFollowCallback();
            break;
        case 'enter':
            if (_toggleFocusAndFollowCallback) _toggleFocusAndFollowCallback();
            break;
        case 'w': isWDown = true; break;
        case 's': isSDown = true; break;
        case 'a': isADown = true; break;
        case 'd': isDDown = true; break;
        case 'z': isZDown = true; break;
        case 'x': isXDown = true; break;
        case 'o':
            if(_toggleOrbitLinesCallback) _toggleOrbitLinesCallback();
            break;
        case 'f1': 
            if (_openInfoModalCallback) _openInfoModalCallback('controls'); 
            break;
        case 'f2': 
            if (_toggleObjectSelectionMenuCallback) _toggleObjectSelectionMenuCallback(); 
            break;
        case 'f3':
        case 'r':
            if (_openMarketModalForStationCallback) _openMarketModalForStationCallback();
            break;
        case 'f4':
            if (_openShipOverviewModalCallback) _openShipOverviewModalCallback();
            break;
    }
    // If any movement key is pressed, update info box and potentially clear camera targets
    if (isWDown || isSDown || isADown || isDDown || isZDown || isXDown) {
        if(_updateInfoBoxCallback) _updateInfoBoxCallback(); // Let main logic decide text
        if(_setCameraTargetsCallback) _setCameraTargetsCallback(null, null, false); // Clear follow/focus, set isFollowing to false
    }
}

function onKeyUp(event) {
    const orbitControls = getOrbitControls();
    switch(event.key.toLowerCase()) {
        case 'c': 
            isCKeyDown = false; 
            if(orbitControls) orbitControls.enableRotate = false; 
            break;
        case 'w': isWDown = false; break;
        case 's': isSDown = false; break;
        case 'a': isADown = false; break;
        case 'd': isDDown = false; break;
        case 'z': isZDown = false; break;
        case 'x': isXDown = false; break;
    }
}

// This function will be called from the main animation loop if any WASDZX key is down
export function handleFreeCameraMovement(deltaTime, camera, orbitControls, _updateInfoBoxCallbackFromMain, _setCameraTargetsCallbackFromMain) {
    if (!isWDown && !isSDown && !isADown && !isDDown && !isZDown && !isXDown) {
        return false; // No movement
    }

    const moveDirection = new THREE.Vector3();
    const rightDirection = new THREE.Vector3();
    camera.getWorldDirection(moveDirection);
    rightDirection.crossVectors(camera.up, moveDirection).normalize();

    const horizontalMoveDirection = moveDirection.clone();
    horizontalMoveDirection.y = 0;
    horizontalMoveDirection.normalize();

    // Assuming FREE_MOVE_SPEED is imported from config.js or passed
    const FREE_MOVE_SPEED = 200.0; // Fallback, should be from config
    const actualMoveSpeed = FREE_MOVE_SPEED * deltaTime;
    let moveX = 0, moveZ = 0, moveY = 0;

    if (isWDown) { moveX += horizontalMoveDirection.x * actualMoveSpeed; moveZ += horizontalMoveDirection.z * actualMoveSpeed; }
    if (isSDown) { moveX -= horizontalMoveDirection.x * actualMoveSpeed; moveZ -= horizontalMoveDirection.z * actualMoveSpeed; }
    if (isADown) { moveX += rightDirection.x * actualMoveSpeed; moveZ += rightDirection.z * actualMoveSpeed; }
    if (isDDown) { moveX -= rightDirection.x * actualMoveSpeed; moveZ -= rightDirection.z * actualMoveSpeed; }
    if (isZDown) { moveY += actualMoveSpeed; }
    if (isXDown) { moveY -= actualMoveSpeed; }

    camera.position.x += moveX;
    camera.position.z += moveZ;
    camera.position.y += moveY;
    if (orbitControls) {
        orbitControls.target.x += moveX;
        orbitControls.target.z += moveZ;
        orbitControls.target.y += moveY;
    }
    
    if (_updateInfoBoxCallbackFromMain) _updateInfoBoxCallbackFromMain();
    if (_setCameraTargetsCallbackFromMain) _setCameraTargetsCallbackFromMain(null, null, false); // Clear follow/focus

    return true; // Movement occurred
}

console.log("controls.js loaded");