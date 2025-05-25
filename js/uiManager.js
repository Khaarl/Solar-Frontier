// js/uiManager.js
// Manages DOM element interactions, modal management, info box updates.
import { getFocusedObject, getHighlightMesh, setFocusedObject, getClickableObjects, getOrderedSelectableObjects, removeObjectFromScene, getActiveShips, getStations } from './sceneManager.js'; // Assuming these are needed and exposed
import { playerData, commoditiesMasterList, SHIP_DOCK_TIME } from './config.js'; // For market and player info
import { getObjectVisualRadius } from './utils.js';
// import * as ShipLogic from './shipLogic.js'; // For ship-specific data if needed for UI
// import * as EconomyManager from './economyManager.js'; // For market interactions

// UI Element Variables (will be initialized in initUI)
export let pauseButton, speedDisplay, speedSlider, geminiPlanetInfoButton, fullscreenButton;
export let geminiInfoModal, closeModalButton, modalTitle, modalBodyContent;
export let objectSelectionMenu, objectListElement;
export let marketModal, closeMarketModalButton, marketModalTitle, marketModalBody;
export let commoditiesTableBody, passengersTableBody;
export let playerCreditsSpan, playerCargoCurrentSpan, playerCargoMaxSpan, playerCargoListUl;
export let playerPassengersCurrentSpan, playerPassengersMaxSpan, playerPassengerListUl;
export let shipOverviewModal, closeShipOverviewModalButton, shipOverviewModalTitle, shipOverviewModalBody, shipOverviewTableBody;
export let infoBox, controlsInfo;

// State variables that might be managed or influenced by UI
let currentMarketStation = null; // Used by market modal
let currentSelectableObjectIndex = 0; // Used by object selection cycling

// To be called from main.js after DOM is loaded
export function initUI(
    _togglePauseCallback,
    _simulationSpeedUpdateCallback,
    _openInfoModalCallback, // This will be the local openInfoModal
    _toggleBrowserFullscreenCallback,
    _selectObjectByInteractionCallback,
    _selectNextOrPreviousObjectCallback,
    _openMarketModalCallback, // This will be the local openMarketModal
    _openShipOverviewModalCallback // This will be the local openShipOverviewModal
) {
    infoBox = document.getElementById('infoBox');
    controlsInfo = document.getElementById('controlsInfo');
    pauseButton = document.getElementById('pauseButton');
    speedDisplay = document.getElementById('speedDisplay');
    speedSlider = document.getElementById('speedSlider');
    geminiPlanetInfoButton = document.getElementById('geminiPlanetInfoButton');
    fullscreenButton = document.getElementById('fullscreenButton');

    geminiInfoModal = document.getElementById('geminiInfoModal');
    closeModalButton = document.getElementById('closeModalButton');
    modalTitle = document.getElementById('modalTitle');
    modalBodyContent = document.getElementById('modalBodyContent');

    objectSelectionMenu = document.getElementById('objectSelectionMenu');
    objectListElement = document.getElementById('objectList');

    marketModal = document.getElementById('marketModal');
    closeMarketModalButton = document.getElementById('closeMarketModalButton');
    marketModalTitle = document.getElementById('marketModalTitle');
    // marketModalBody = document.getElementById('marketModalBody'); // Already declared
    commoditiesTableBody = document.getElementById('commoditiesTableBody');
    passengersTableBody = document.getElementById('passengersTableBody');
    playerCreditsSpan = document.getElementById('playerCredits');
    playerCargoCurrentSpan = document.getElementById('playerCargoCurrent');
    playerCargoMaxSpan = document.getElementById('playerCargoMax');
    playerCargoListUl = document.getElementById('playerCargoList');
    playerPassengersCurrentSpan = document.getElementById('playerPassengersCurrent');
    playerPassengersMaxSpan = document.getElementById('playerPassengersMax');
    playerPassengerListUl = document.getElementById('playerPassengerList');

    shipOverviewModal = document.getElementById('shipOverviewModal');
    closeShipOverviewModalButton = document.getElementById('closeShipOverviewModalButton');
    // shipOverviewModalTitle = document.getElementById('shipOverviewModalTitle'); // Already declared
    shipOverviewModalBody = document.getElementById('shipOverviewModalBody');
    shipOverviewTableBody = document.getElementById('shipOverviewTableBody');

    // Event Listeners
    if (pauseButton) pauseButton.addEventListener('click', _togglePauseCallback);
    if (speedSlider) {
        speedSlider.addEventListener('input', (event) => {
            _simulationSpeedUpdateCallback(parseFloat(event.target.value));
            updateSpeedDisplay(parseFloat(event.target.value)); // Update display locally too
        });
    }
    if (geminiPlanetInfoButton) geminiPlanetInfoButton.addEventListener('click', () => openInfoModal('planet_comet_station_ship')); // Call local
    if (fullscreenButton) fullscreenButton.addEventListener('click', _toggleBrowserFullscreenCallback);

    if (closeModalButton) closeModalButton.addEventListener('click', () => {
        if (geminiInfoModal) geminiInfoModal.style.display = "none";
    });
    if (closeMarketModalButton) closeMarketModalButton.addEventListener('click', () => {
        if (marketModal) marketModal.style.display = "none";
        currentMarketStation = null;
    });
    if (closeShipOverviewModalButton) closeShipOverviewModalButton.addEventListener('click', () => {
        if (shipOverviewModal) shipOverviewModal.style.display = "none";
    });

    window.addEventListener('click', (event) => {
        if (geminiInfoModal && event.target == geminiInfoModal) geminiInfoModal.style.display = "none";
        if (marketModal && event.target == marketModal) { marketModal.style.display = "none"; currentMarketStation = null; }
        if (shipOverviewModal && event.target == shipOverviewModal) shipOverviewModal.style.display = "none";
    });
    
    if (controlsInfo) controlsInfo.textContent = "F1: Controls, F4: Ships, R: Market";
    console.log("UI Initialized");
}

export function updateInfoBoxContent(text) {
    if (infoBox) infoBox.textContent = text;
}

export function updateSpeedDisplay(currentSimSpeed) {
    if (speedDisplay) speedDisplay.textContent = parseFloat(currentSimSpeed).toFixed(2);
}

export function updateHighlightAndGeminiButton() {
    const focusedObj = getFocusedObject();
    const highlight = getHighlightMesh();

    if (!highlight || !geminiPlanetInfoButton) return;

    if (focusedObj && (focusedObj.userData.isPlanet || focusedObj.userData.name === "Sun" || focusedObj.userData.isComet || focusedObj.userData.isMoon || focusedObj.userData.isStation || focusedObj.userData.isShip)) {
        highlight.position.copy(focusedObj.getWorldPosition(new THREE.Vector3()));
        const scaleFactor = getObjectVisualRadius(focusedObj); // This function needs to be accessible or replicated
        const scale = scaleFactor * (focusedObj.userData.isShip ? 3.5 : 1.6);
        highlight.scale.set(scale, scale, scale);
        highlight.visible = true;

        if (focusedObj.userData.isPlanet || focusedObj.userData.name === "Sun" || focusedObj.userData.isComet || focusedObj.userData.isMoon || focusedObj.userData.isStation || focusedObj.userData.isShip) {
            geminiPlanetInfoButton.textContent = `✨ Tell Me About ${focusedObj.userData.name}`;
            geminiPlanetInfoButton.style.display = 'block';
        } else {
            geminiPlanetInfoButton.style.display = 'none';
        }
    } else {
        highlight.visible = false;
        geminiPlanetInfoButton.style.display = 'none';
    }
}


export function populateObjectSelectionMenu() {
    if (!objectListElement) return;
    objectListElement.innerHTML = ''; // Clear existing items
    const orderedSelectableObjs = getOrderedSelectableObjects(); // from sceneManager

    const createMenuItem = (obj, typeClass = '', selectCallback) => {
        const li = document.createElement('li');
        li.textContent = obj.userData.name || "Unnamed Object";
        if (typeClass) li.classList.add(typeClass);
        li.addEventListener('click', (e) => {
            e.stopPropagation();
            selectCallback(obj, false); // Pass to the callback from main logic
            if (objectSelectionMenu) objectSelectionMenu.style.display = 'none';
        });
        return li;
    };
    
    // This needs to be refactored to use the actual selectObjectByInteraction from main logic
    const placeholderSelectCallback = (obj) => {
        console.warn("Placeholder select callback from menu for:", obj.userData.name);
        // In a real scenario, this would call a function passed into initUI, e.g., _selectObjectByInteractionCallback(obj, false)
        setFocusedObject(obj); // TEMPORARY - main logic should handle this
        updateHighlightAndGeminiButton(); // TEMPORARY
    };


    // Add Sun
    const sunObj = orderedSelectableObjs.find(o => o.userData.name === "Sun");
    if (sunObj) objectListElement.appendChild(createMenuItem(sunObj, '', placeholderSelectCallback));

    // Add Planets and their Moons (collapsible)
    const planetsFromScene = getStations().filter(p => p.mesh.userData.isPlanet); // This is incorrect, need proper planet list
                                                                                // For now, let's assume orderedSelectableObjects contains them correctly.

    orderedSelectableObjs.forEach(obj => {
        if (obj.userData.isPlanet) {
            const planetLi = document.createElement('li');
            planetLi.classList.add('menu-item-parent');

            const planetNameSpan = document.createElement('span');
            planetNameSpan.classList.add('object-name');
            planetNameSpan.textContent = obj.userData.name;
            planetNameSpan.addEventListener('click', (e) => {
                e.stopPropagation();
                placeholderSelectCallback(obj);
                if (objectSelectionMenu) objectSelectionMenu.style.display = 'none';
            });
            planetLi.appendChild(planetNameSpan);

            const moons = orderedSelectableObjs.filter(m => m.userData.isMoon && m.parent === obj); // This logic is flawed as .parent is not reliable here.
                                                                                                    // The original code added moons as children of planet meshes.
            // We need a robust way to get moons of a planet. For now, this part will be simplified.
            // The original `planetObj.moonObjects` was better. This needs to be available.

            // Simplified: if (obj.children.some(child => child.userData.isMoon)) {
            // This part needs careful refactoring once data structures are solid in sceneManager/celestialBodyFactory
            // For now, we'll skip the complex moon listing within the menu from here.
            // }
            objectListElement.appendChild(planetLi);
        } else if (obj.userData.isComet && !sunObj) { // Avoid re-adding Sun if it was missed
             objectListElement.appendChild(createMenuItem(obj, '', placeholderSelectCallback));
        }
    });


    // Add Stations (collapsible) - Simplified for now
    const stationsFromScene = getStations(); // from sceneManager
    if (stationsFromScene.length > 0) {
        const stationsHeaderLi = document.createElement('li');
        stationsHeaderLi.classList.add('menu-item-parent');
        // ... (similar structure as original, but needs proper data source)
        stationsFromScene.forEach(stationObj => {
            if(stationObj.mesh) objectListElement.appendChild(createMenuItem(stationObj.mesh, 'station-menu-item', placeholderSelectCallback))
        });
    }

    // Add Active Ships (collapsible) - Simplified for now
    const activeShipsFromScene = getActiveShips(); // from sceneManager
    if (activeShipsFromScene.length > 0) {
        const shipsHeaderLi = document.createElement('li');
        shipsHeaderLi.classList.add('menu-item-parent');
        // ...
        activeShipsFromScene.forEach(shipObj => {
            if(shipObj.mesh) objectListElement.appendChild(createMenuItem(shipObj.mesh, 'ship-menu-item', placeholderSelectCallback))
        });
    }
    console.log("Object selection menu populated (simplified)");
}


export async function openInfoModal(type) {
    const focusedObj = getFocusedObject(); // from sceneManager

    if (!geminiInfoModal || !modalBodyContent || !modalTitle) return;

    if (type === 'planet_comet_station_ship') {
        if (!focusedObj || (!focusedObj.userData.isPlanet && focusedObj.userData.name !== "Sun" && !focusedObj.userData.isComet && !focusedObj.userData.isMoon && !focusedObj.userData.isStation && !focusedObj.userData.isShip)) {
            modalBodyContent.innerHTML = "<p>No celestial body or vessel selected, or data unavailable.</p>";
            modalTitle.textContent = "Error";
            geminiInfoModal.style.display = "flex";
            return;
        }

        const bodyName = focusedObj.userData.name;
        modalTitle.textContent = `About ${bodyName}`;
        modalBodyContent.innerHTML = '<p class="loading-indicator">Fetching information...</p>';
        geminiInfoModal.style.display = "flex";

        let facts = "";
         // This large switch statement for facts should ideally come from a data source (e.g., config.js or a dedicated facts module)
        if (focusedObj.userData.isShip) {
            const activeShipsList = getActiveShips(); // from sceneManager
            const shipData = activeShipsList.find(s => s.id === bodyName || s.mesh === focusedObj);
            facts = `This is the ${focusedObj.userData.displayName || bodyName}, a ${focusedObj.userData.type} class vessel. `;
            if (shipData) {
                facts += `Currently ${shipData.status.toLowerCase()}`;
                if (shipData.status === "TRAVELLING" || shipData.status === "APPROACHING" || shipData.status === "DEPARTING") {
                     facts += ` from ${shipData.originStation.mesh.userData.name} to ${shipData.destinationStation.mesh.userData.name}.`;
                } else if (shipData.status === "ARRIVED") {
                    facts += ` at ${shipData.destinationStation.mesh.userData.name}.`;
                }
            } else {
                facts += "Status details unavailable."
            }
        } else {
             // Pre-defined facts (ideally from config or a data module)
            const predefinedFacts = {
                "sun": "The Sun is a G-type main-sequence star (G2V)...",
                "mercury": "Mercury is the smallest planet...",
                // ... (all other facts from original code) ...
                "kuiper gateway (deep space)": "Kuiper Gateway, a skeletal frame station..."
            };
            facts = predefinedFacts[bodyName.toLowerCase()] || `No specific pre-set information available for ${bodyName}.`;
        }
        modalBodyContent.innerHTML = `<p>${facts}</p>`;

    } else if (type === 'controls') {
        modalTitle.textContent = "Controls Help";
        modalBodyContent.innerHTML = `
            <ul>
                <li><strong>WASD:</strong> Free Camera Movement (Horizontal)</li>
                <li><strong>Z / X:</strong> Move Camera Up / Down (Vertical)</li>
                <li><strong>Mouse Left-Click:</strong> Select / Center on Object</li>
                <li><strong>Mouse Wheel:</strong> Zoom In / Out</li>
                <li><strong>Mouse Middle-Drag:</strong> Pan Camera</li>
                <li><strong>Hold 'C' + Left-Drag:</strong> Rotate Camera around Target</li>
                <li><strong>'F':</strong> Toggle Follow Selected Object</li>
                <li><strong>Enter:</strong> Toggle Focus and Follow Selected Object</li>
                <li><strong>'[' / ']':</strong> Cycle Prev / Next Selectable Object</li>
                <li><strong>'O':</strong> Toggle Planet Orbit Lines Visibility</li>
                <li><strong>F1:</strong> Show This Controls Help</li>
                <li><strong>F2:</strong> Toggle Object Selection Menu</li>
                <li><strong>F3 or R:</strong> Open Station Market (if station focused)</li>
                <li><strong>F4:</strong> Open Ship Overview</li>
                <li><strong>Pause/Resume Button:</strong> Pause or Resume Simulation</li>
                <li><strong>Speed Slider:</strong> Adjust Simulation Speed</li>
                <li><strong>✨ Tell Me About... Button:</strong> Get Info on Selected Object</li>
                <li><strong>Toggle Fullscreen Button:</strong> Enter/Exit Fullscreen Mode</li>
            </ul>
        `;
        geminiInfoModal.style.display = "flex";
    } else if (type === 'no_station_market') {
        modalTitle.textContent = "Market Unavailable";
        modalBodyContent.innerHTML = "<p>You must be focused on a station to view its market. Use mouse click or '[' and ']' to select a station, then press F3 or R.</p>";
        geminiInfoModal.style.display = "flex";
    }
}

export function toggleObjectSelectionMenu() {
    if (objectSelectionMenu) {
        objectSelectionMenu.style.display = objectSelectionMenu.style.display === 'block' ? 'none' : 'block';
        if (objectSelectionMenu.style.display === 'block') {
            // populateObjectSelectionMenu(); // Call the main logic version
        }
    }
}

// --- Market UI Functions ---
// These will need access to playerData, station market data, and potentially economyManager functions
export function openMarketModalForStation(stationMesh, _buyCommodityCallback, _sellCommodityCallback, _acceptPassengersCallback) {
    const focusedObj = getFocusedObject(); // Ensure we are using the currently focused object if stationMesh is not directly passed
    const targetStation = stationMesh || (focusedObj && focusedObj.userData.isStation ? focusedObj : null);

    if (!targetStation || !targetStation.userData.isStation || !targetStation.userData.market) {
        console.error("Cannot open market: Invalid station or market data.", targetStation);
        openInfoModal('no_station_market');
        return;
    }
    // completePassengerMission(targetStation); // This should be in economyManager or main logic

    currentMarketStation = targetStation;
    if(marketModalTitle) marketModalTitle.textContent = `Station Market: ${targetStation.userData.name}`;
    if(commoditiesTableBody) commoditiesTableBody.innerHTML = '';
    if(passengersTableBody) passengersTableBody.innerHTML = '';

    const marketData = targetStation.userData.market;

    if (marketData.commodities && marketData.commodities.length > 0) {
        marketData.commodities.forEach(comm => {
            if (comm.quantity <= 0 && comm.buyPrice <=0 && comm.sellPrice <=0 && (comm.demandFactor === 0 || !comm.demandFactor)) return;

            const row = commoditiesTableBody.insertRow();
            row.insertCell().textContent = comm.name + (comm.isIllegal ? " (Illegal)" : "");
            row.insertCell().textContent = comm.quantity;
            row.insertCell().textContent = comm.sellPrice > 0 ? `${comm.sellPrice} cr` : "---";
            row.insertCell().textContent = comm.buyPrice > 0 ? `${comm.buyPrice} cr` : "---";

            const actionsCell = row.insertCell();
            actionsCell.style.whiteSpace = "nowrap";

            if (comm.sellPrice > 0 && comm.quantity > 0) {
                const buy1Button = document.createElement('button');
                buy1Button.textContent = "Buy 1";
                buy1Button.disabled = playerData.credits < comm.sellPrice || playerData.cargoHold.reduce((sum, item) => sum + item.quantity, 0) >= playerData.maxCargo;
                buy1Button.onclick = () => _buyCommodityCallback(targetStation, comm.id, 1);
                actionsCell.appendChild(buy1Button);

                const maxCanBuy = Math.min(comm.quantity, Math.floor(playerData.credits / comm.sellPrice), playerData.maxCargo - playerData.cargoHold.reduce((sum, item) => sum + item.quantity, 0) );
                if (maxCanBuy > 1) {
                    const buyAllButton = document.createElement('button');
                    buyAllButton.textContent = `Buy Max (${maxCanBuy})`;
                    buyAllButton.disabled = maxCanBuy <= 0;
                    buyAllButton.onclick = () => _buyCommodityCallback(targetStation, comm.id, maxCanBuy);
                    actionsCell.appendChild(buyAllButton);
                }
            }

            const playerHasCommodity = playerData.cargoHold.find(c => c.commodityId === comm.id);
            if (comm.buyPrice > 0 && playerHasCommodity && playerHasCommodity.quantity > 0) {
                const sell1Button = document.createElement('button');
                sell1Button.textContent = "Sell 1";
                sell1Button.onclick = () => _sellCommodityCallback(targetStation, comm.id, 1);
                actionsCell.appendChild(sell1Button);

                if (playerHasCommodity.quantity > 1) {
                    const sellAllButton = document.createElement('button');
                    sellAllButton.textContent = `Sell All (${playerHasCommodity.quantity})`;
                    sellAllButton.onclick = () => _sellCommodityCallback(targetStation, comm.id, playerHasCommodity.quantity);
                    actionsCell.appendChild(sellAllButton);
                }
            }
        });
    } else {
        // ... (no commodities message)
    }

    const passengerData = targetStation.userData.passengerTerminal;
    if (passengerData && passengerData.available && passengerData.available.length > 0) {
         passengerData.available.forEach((paxGroup, index) => {
            // ... (populate passenger rows and accept button)
            const acceptButton = document.createElement('button');
            // ...
            acceptButton.onclick = () => _acceptPassengersCallback(targetStation, index);
            // ...
         });
    } else {
        // ... (no passenger missions message)
    }

    updatePlayerMarketInfoUIDisplay();
    if(marketModal) marketModal.style.display = "flex";
}

export function updatePlayerMarketInfoUIDisplay() {
    if(playerCreditsSpan) playerCreditsSpan.textContent = playerData.credits;
    const currentCargoAmount = playerData.cargoHold.reduce((sum, item) => sum + item.quantity, 0);
    if(playerCargoCurrentSpan) playerCargoCurrentSpan.textContent = currentCargoAmount;
    if(playerCargoMaxSpan) playerCargoMaxSpan.textContent = playerData.maxCargo;

    if(playerCargoListUl) playerCargoListUl.innerHTML = '';
    playerData.cargoHold.forEach(item => {
        const li = document.createElement('li');
        li.textContent = `${item.name} x ${item.quantity}`;
        if(playerCargoListUl) playerCargoListUl.appendChild(li);
    });

    const currentPassengersCount = playerData.passengers.reduce((sum, pg) => sum + pg.count, 0);
    if(playerPassengersCurrentSpan) playerPassengersCurrentSpan.textContent = currentPassengersCount;
    if(playerPassengersMaxSpan) playerPassengersMaxSpan.textContent = playerData.maxPassengers;

    if(playerPassengerListUl) playerPassengerListUl.innerHTML = '';
    playerData.passengers.forEach(pg => {
        const li = document.createElement('li');
        li.textContent = `${pg.count} to ${pg.destinationStationName} (Fare: ${pg.totalFare}cr)`;
        if(playerPassengerListUl) playerPassengerListUl.appendChild(li);
    });
}


// --- Ship Overview UI Functions ---
export function openShipOverviewModalUI() { // Renamed to avoid conflict if original is kept in main
    if (!shipOverviewTableBody || !shipOverviewModal) return;

    if (marketModal && marketModal.style.display === 'flex') marketModal.style.display = 'none';
    if (geminiInfoModal && geminiInfoModal.style.display === 'flex') geminiInfoModal.style.display = 'none';
    if (objectSelectionMenu && objectSelectionMenu.style.display === 'block') objectSelectionMenu.style.display = 'none';

    shipOverviewTableBody.innerHTML = '';
    const activeShipsList = getActiveShips(); // from sceneManager
    const simSpeed = parseFloat(document.getElementById('speedSlider').value); // Get current sim speed
    const clockElapsedTime = window.solarSystemGlobalClock ? window.solarSystemGlobalClock.getElapsedTime() : 0; // Access globalClock if exposed


    if (activeShipsList.length > 0) {
        activeShipsList.forEach(ship => {
            const row = shipOverviewTableBody.insertRow();
            row.insertCell().textContent = ship.displayName || ship.id; // Use displayName from ship object
            row.insertCell().textContent = ship.type;
            row.insertCell().textContent = ship.originStation.mesh.userData.name;
            row.insertCell().textContent = ship.destinationStation.mesh.userData.name;
            row.insertCell().textContent = `${(ship.progress * 100).toFixed(1)}%`;
            row.insertCell().textContent = ship.status;

            let etaText = "N/A";
            if (ship.status === "TRAVELLING" || ship.status === "DEPARTING" || ship.status === "APPROACHING") {
                if (ship.speed > 0 && simSpeed > 0 && ship.mesh && ship.destinationStation.mesh) {
                    const destPos = ship.destinationStation.mesh.getWorldPosition(new THREE.Vector3());
                    const remainingDist = ship.mesh.position.distanceTo(destPos);
                    const etaSimSeconds = remainingDist / (ship.speed * simSpeed); // speed is already scaled by DISTANCE_SCALE_AU_TO_THREEJS
                    etaText = `${etaSimSeconds.toFixed(0)}s`;
                } else {
                     etaText = "Paused/Slow";
                }
            } else if (ship.status === "ARRIVED") {
                const remainingDockTime = SHIP_DOCK_TIME - (clockElapsedTime - ship.arrivalTime);
                etaText = `Docked (${remainingDockTime.toFixed(0)}s)`;
            }
            row.insertCell().textContent = etaText;

            row.style.cursor = "pointer";
            row.onclick = () => {
                // This needs to call the main logic's selectObjectByInteraction
                // _selectObjectByInteractionCallback(ship.mesh, false);
                console.warn("Ship selection from overview needs to call main logic's selection function.");
                setFocusedObject(ship.mesh); // TEMPORARY
                updateHighlightAndGeminiButton(); // TEMPORARY
                if (shipOverviewModal) shipOverviewModal.style.display = "none";
            };
        });
    } else {
        // ... (no active ships message)
    }
    if (shipOverviewModal) shipOverviewModal.style.display = "flex";
}


console.log("uiManager.js loaded");