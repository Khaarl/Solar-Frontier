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

// New Main Menu and Hangar UI Elements
export let mainMenuElement, newGameButton, hangarButton, settingsButton;
export let hangarScreenElement, closeHangarButton, hangarBody;
export let gameUIElement;

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
    _openShipOverviewModalCallback, // This will be the local openShipOverviewModal
    _startNewGameCallback // Callback from main.js to start the game
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

    // Main Menu and Hangar elements
    mainMenuElement = document.getElementById('mainMenu');
    newGameButton = document.getElementById('newGameButton');
    hangarButton = document.getElementById('hangarButton');
    settingsButton = document.getElementById('settingsButton');
    hangarScreenElement = document.getElementById('hangarScreen');
    closeHangarButton = document.getElementById('closeHangarButton');
    hangarBody = document.getElementById('hangarBody');
    gameUIElement = document.getElementById('gameUI');

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

    // Main Menu and Hangar Event Listeners
    if (newGameButton) newGameButton.addEventListener('click', () => {
        showGameUI();
        _startNewGameCallback(); // Notify main.js to start the game simulation
    });
    if (hangarButton) hangarButton.addEventListener('click', showHangarScreen);
    if (settingsButton) settingsButton.addEventListener('click', () => {
        // Placeholder for settings - can open a modal or new screen
        openInfoModal('settings_menu');
    });
    if (closeHangarButton) closeHangarButton.addEventListener('click', hideHangarScreen);

    window.addEventListener('click', (event) => {
        if (geminiInfoModal && event.target == geminiInfoModal) geminiInfoModal.style.display = "none";
        if (marketModal && event.target == marketModal) { marketModal.style.display = "none"; currentMarketStation = null; }
        if (shipOverviewModal && event.target == shipOverviewModal) shipOverviewModal.style.display = "none";
        if (hangarScreenElement && event.target == hangarScreenElement) hideHangarScreen();
    });
    
    if (controlsInfo) controlsInfo.textContent = "F1: Controls, F4: Ships, R: Market, Esc: Menu";
    
    // Initially show main menu and hide game UI
    showMainMenu();
    console.log("UI Initialized with Main Menu");
}

export function showMainMenu() {
    if (mainMenuElement) mainMenuElement.style.display = 'block'; // Or 'flex' if using flexbox for centering
    if (gameUIElement) gameUIElement.style.display = 'none';
    if (hangarScreenElement) hangarScreenElement.style.display = 'none';
}

export function showGameUI() {
    if (mainMenuElement) mainMenuElement.style.display = 'none';
    if (gameUIElement) gameUIElement.style.display = 'block'; // Or 'flex'
    if (hangarScreenElement) hangarScreenElement.style.display = 'none';
}

export function showHangarScreen() {
    if (hangarScreenElement) hangarScreenElement.style.display = 'flex'; // Modals are often flex for centering
    // Potentially hide other modals if they are open
    if (geminiInfoModal && geminiInfoModal.style.display !== 'none') geminiInfoModal.style.display = 'none';
    if (marketModal && marketModal.style.display !== 'none') marketModal.style.display = 'none';
    // Populate hangarBody with ship models - for now, it's a placeholder
    if (hangarBody) hangarBody.innerHTML = "<p>Ship models will be displayed here. (Functionality to browse ships to be implemented)</p>";
}

export function hideHangarScreen() {
    if (hangarScreenElement) hangarScreenElement.style.display = 'none';
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
        highlight.position.copy(focusedObj.getWorldPosition(new window.THREE.Vector3())); // Use window.THREE
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
        li.textContent = obj.userData.displayName || obj.userData.name || "Unnamed Object"; // Prioritize displayName
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
    // This section needs access to the planet structures that hold moonObjects, not just flat orderedSelectableObjs
    // For now, it will list planets, but moon sub-listing needs rework based on data from CelestialBodyFactory/SceneManager
    orderedSelectableObjs.forEach(obj => {
        if (obj.userData.isPlanet) {
            objectListElement.appendChild(createMenuItem(obj, 'planet-menu-item', placeholderSelectCallback));
            // Moons would be listed here if data structure allowed easy access
        } else if (obj.userData.isComet && !sunObj) { 
             objectListElement.appendChild(createMenuItem(obj, 'comet-menu-item', placeholderSelectCallback));
        } else if (obj.userData.isPlayerShip) { // Add player ship to the list
            objectListElement.appendChild(createMenuItem(obj, 'player-ship-menu-item', placeholderSelectCallback));
        }
    });


    // Add Stations (collapsible) - Simplified for now
    const stationsFromScene = getStations(); // from sceneManager
    if (stationsFromScene.length > 0) {
        const stationsHeaderLi = document.createElement('li');
        stationsHeaderLi.classList.add('menu-category-header');
        stationsHeaderLi.textContent = "Stations";
        objectListElement.appendChild(stationsHeaderLi);
        stationsFromScene.forEach(stationObj => {
            if(stationObj.mesh) objectListElement.appendChild(createMenuItem(stationObj.mesh, 'station-menu-item', placeholderSelectCallback))
        });
    }

    // Add Active Ships (collapsible) - Simplified for now
    const activeShipsFromScene = getActiveShips(); // from sceneManager
    if (activeShipsFromScene.length > 0) {
        const shipsHeaderLi = document.createElement('li');
        shipsHeaderLi.classList.add('menu-category-header');
        shipsHeaderLi.textContent = "NPC Ships";
        objectListElement.appendChild(shipsHeaderLi);
        activeShipsFromScene.forEach(shipObj => {
            // Ensure player ship isn't re-added if it's in activeShips (it shouldn't be based on current logic)
            if(shipObj.mesh && !shipObj.mesh.userData.isPlayerShip) {
                objectListElement.appendChild(createMenuItem(shipObj.mesh, 'ship-menu-item', placeholderSelectCallback));
            }
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

        const bodyName = focusedObj.userData.displayName || focusedObj.userData.name;
        modalTitle.textContent = `About ${bodyName}`;
        modalBodyContent.innerHTML = '<p class="loading-indicator">Fetching information...</p>';
        geminiInfoModal.style.display = "flex";

        let facts = "";
         // This large switch statement for facts should ideally come from a data source (e.g., config.js or a dedicated facts module)
        if (focusedObj.userData.isShip) { // Covers NPC and Player ships if isShip is true
            const activeShipsList = getActiveShips(); // from sceneManager
            // For player ship, data might come directly from Config.playerData.playerShip or its own state
            if (focusedObj.userData.isPlayerShip) {
                facts = `This is your vessel, the ${bodyName}, a ${focusedObj.userData.type} class ship.`;
                // Add more player ship specific details here if needed, e.g., fuel, cargo from playerData
            } else { // NPC Ship
                const shipData = activeShipsList.find(s => s.mesh === focusedObj);
                facts = `This is the ${bodyName}, a ${focusedObj.userData.type} class vessel. `;
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
            }
        } else {
             // Pre-defined facts (ideally from config or a data module)
            const predefinedFacts = {
                "sun": "The Sun is a G-type main-sequence star (G2V), the heart of our solar system, providing light and heat essential for life on Earth. Its immense gravity holds the planets in their orbits.",
                "mercury": "Mercury is the smallest planet in our solar system and closest to the Sun. It has a heavily cratered surface and experiences extreme temperature variations.",
                "venus": "Venus is the second planet from the Sun, known for its thick, toxic atmosphere primarily composed of carbon dioxide, and incredibly high surface temperatures. It rotates in the opposite direction to most planets.",
                "earth": "Earth, our home, is the third planet from the Sun and the only astronomical object known to harbor life. It has vast oceans of liquid water and a dynamic atmosphere.",
                "moon": "The Moon is Earth's only natural satellite. It plays a crucial role in stabilizing Earth's axial tilt and creating tides. Its surface is marked by craters and vast, dark plains called maria.",
                "borg cube": "A formidable vessel of the Borg Collective, characterized by its perfect cubical shape and advanced, adaptive technology. Resistance is futile.",
                "mars": "Mars, the fourth planet from the Sun, is often called the 'Red Planet' due to its iron oxide-rich surface. It has polar ice caps, vast canyons, and the largest volcano in the solar system, Olympus Mons.",
                "phobos": "Phobos is the larger and innermost of Mars' two small moons. It is heavily cratered and has a distinctive large crater, Stickney.",
                "deimos": "Deimos is the smaller and outermost of Mars' two moons. It has a smoother appearance than Phobos due to a layer of regolith.",
                "jupiter": "Jupiter is the largest planet in our solar system, a gas giant primarily composed of hydrogen and helium. It is known for its Great Red Spot, a massive storm, and its numerous moons.",
                "io": "Io is one of Jupiter's four Galilean moons, and the most volcanically active world in the solar system, with hundreds of volcanoes, some erupting plumes hundreds of kilometers high.",
                "europa": "Europa, another Galilean moon of Jupiter, has a smooth, icy surface believed to cover a vast saltwater ocean, making it a prime candidate in the search for extraterrestrial life.",
                "ganymede": "Ganymede is the largest moon in the solar system (larger than the planet Mercury) and one of Jupiter's Galilean moons. It is the only moon known to have its own magnetic field.",
                "callisto": "Callisto, a Galilean moon of Jupiter, has an ancient, heavily cratered surface, suggesting minimal geological activity. It may possess a subsurface ocean.",
                "saturn": "Saturn, the sixth planet from the Sun, is a gas giant famous for its spectacular system of rings, composed mostly of ice particles with some rocky debris and dust.",
                "titan": "Titan is Saturn's largest moon and the second-largest in the solar system. It is unique for having a dense atmosphere and stable bodies of surface liquid, albeit of methane and ethane.",
                "uranus": "Uranus is an ice giant, the seventh planet from the Sun. It is unique for its axial tilt of about 98 degrees, meaning it essentially orbits the Sun on its side.",
                "titania": "Titania is the largest of Uranus's moons. Its surface is a mixture of craters and interconnected canyons.",
                "oberon": "Oberon is another large moon of Uranus, with an old, icy, and heavily cratered surface.",
                "ashtar command ship 1": "Lead vessel of the Ashtar Galactic Command fleet, often observed near Uranus. Its purpose remains enigmatic.",
                "neptune": "Neptune, the eighth and farthest known planet from the Sun (since Pluto's reclassification), is an ice giant with a deep blue color and active weather patterns, including strong winds.",
                "triton": "Triton is Neptune's largest moon, unique for its retrograde orbit (orbiting in the opposite direction to Neptune's rotation). It has a geologically active surface with cryovolcanoes.",
                "pluto": "Pluto is a dwarf planet in the Kuiper Belt, a distant region of icy bodies beyond Neptune. It has a surprisingly complex and varied surface, with mountains, plains, and glaciers of nitrogen ice.",
                "charon": "Charon is the largest of Pluto's five moons, so large in proportion to Pluto that the two are sometimes considered a binary system. Their barycenter lies outside Pluto.",
                "comet halley-type": "A periodic comet, typically with an orbital period of around 75-76 years. Halley's Comet is the most famous example, visible from Earth every 76 years or so.",
                "comet swift-tuttle-like": "A large periodic comet with an orbital period of about 133 years. It is the parent body of the Perseid meteor shower.",
                "tsiolkovsky station (earth orbit)": "A large Coriolis-type space station in Earth orbit, serving as a major hub for trade, research, and transit. Named after the pioneer of astronautic theory, Konstantin Tsiolkovsky.",
                "noordung hab-wheel (mars orbit)": "A torus-shaped habitat wheel in orbit around Mars, providing artificial gravity for its inhabitants. Named after Herman Potočnik Noordung, an early space architect.",
                "oberth platform (jupiter - io orbit)": "A modular station orbiting Jupiter's moon Io, primarily focused on mining and research due to Io's unique geological activity. Named after Hermann Oberth, a founding father of rocketry.",
                "von braun gateway (moon orbit)": "An O'Neill Cylinder type station in lunar orbit, a significant settlement and staging point for further space exploration. Named after Wernher von Braun, a leading figure in rocket technology.",
                "goddard depot (mercury orbit)": "A dodecahedron-shaped outpost orbiting Mercury, specializing in resource refining and energy collection due to its proximity to the Sun. Named after Robert H. Goddard, an American rocket pioneer.",
                "clarke point (saturn - titan orbit)": "A cluster of geodesic domes on or orbiting Saturn's moon Titan, a center for tourism and research into Titan's unique environment. Named after Arthur C. Clarke, visionary science fiction author.",
                "sagan memorial (outer belt asteroid)": "An asteroid base located within the Outer Asteroid Belt, dedicated to deep space mining and astronomical observation. Named in honor of Carl Sagan, renowned astronomer and science communicator.",
                "korolev launchpad (venus orbit)": "An array of launch platforms in orbit around Venus, serving as an industrial and manufacturing center. Named after Sergei Korolev, the lead Soviet rocket engineer during the Space Race.",
                "o'neill's promise (uranus orbit)": "A large O'Neill Cylinder habitat orbiting Uranus, focused on agriculture and long-term habitation research in the outer solar system. Named after Gerard K. O'Neill, proponent of space colonization.",
                "kuiper gateway (deep space)": "A skeletal frame station located in deep space, serving as a gateway to the Kuiper Belt and beyond. A high-tech outpost for long-duration missions and advanced research."
            };
            facts = predefinedFacts[bodyName.toLowerCase()] || `No specific pre-set information available for ${bodyName}.`;
        }
        modalBodyContent.innerHTML = `<p>${facts}</p>`;

    } else if (type === 'controls') {
        modalTitle.textContent = "Controls Help";
        modalBodyContent.innerHTML = `
            <h4>Camera Controls:</h4>
            <ul>
                <li><strong>W, A, S, D:</strong> Free Camera Movement (Horizontal Plane)</li>
                <li><strong>Z / X:</strong> Move Camera Up / Down (Vertical)</li>
                <li><strong>Mouse Left-Click (in space):</strong> Select / Center on Object</li>
                <li><strong>Mouse Wheel:</strong> Zoom In / Out</li>
                <li><strong>Mouse Middle-Drag:</strong> Pan Camera</li>
                <li><strong>Hold 'C' + Left-Drag:</strong> Rotate Camera around Target</li>
            </ul>
            <h4>Player Ship Controls:</h4>
            <ul>
                <li><strong>Arrow Up:</strong> Thrust Forward</li>
                <li><strong>Arrow Down:</strong> Thrust Backward / Brake</li>
                <li><strong>Arrow Left:</strong> Turn Left (Yaw)</li>
                <li><strong>Arrow Right:</strong> Turn Right (Yaw)</li>
            </ul>
            <h4>Interaction & UI:</h4>
            <ul>
                <li><strong>'F':</strong> Toggle Follow Selected Object</li>
                <li><strong>Enter:</strong> Toggle Focus and Follow Selected Object</li>
                <li><strong>'[' / ']':</strong> Cycle Previous / Next Selectable Object</li>
                <li><strong>'O':</strong> Toggle Planet Orbit Lines Visibility</li>
                <li><strong>Escape:</strong> Return to Main Menu</li>
                <li><strong>F1:</strong> Show Controls Help</li>
                <li><strong>F2:</strong> Toggle Object Selection Menu</li>
                <li><strong>F3 or R:</strong> Open Station Market (if station focused)</li>
                <li><strong>F4:</strong> Open Ship Overview</li>
            </ul>
            <h4>Simulation & General UI:</h4>
            <ul>
                <li><strong>Pause/Resume Button (UI):</strong> Pause or Resume Simulation</li>
                <li><strong>Speed Slider (UI):</strong> Adjust Simulation Speed</li>
                <li><strong>✨ Tell Me About... Button (UI):</strong> Get Info on Selected Object</li>
                <li><strong>Toggle Fullscreen Button (UI):</strong> Enter/Exit Fullscreen Mode</li>
            </ul>
        `;
        geminiInfoModal.style.display = "flex";
    } else if (type === 'no_station_market') {
        modalTitle.textContent = "Market Unavailable";
        modalBodyContent.innerHTML = "<p>You must be focused on a station to view its market. Use mouse click or '[' and ']' to select a station, then press F3 or R.</p>";
        geminiInfoModal.style.display = "flex";
    } else if (type === 'settings_menu') {
        modalTitle.textContent = "Settings";
        modalBodyContent.innerHTML = `
            <div class="settings-menu-container">
                <h4>Settings Menu</h4>
                <div class="settings-menu-item" id="keyboardSettingsBtn" style="cursor: pointer; padding: 10px; background-color: #333; margin: 8px 0; border-radius: 5px; text-align: center;">Keyboard Settings</div>
                <!-- Future settings items can be added here -->
            </div>
        `;
        const keyboardSettingsBtn = modalBodyContent.querySelector('#keyboardSettingsBtn');
        if (keyboardSettingsBtn) {
            keyboardSettingsBtn.onclick = () => openInfoModal('keyboard_settings');
        }
        geminiInfoModal.style.display = "flex";
    } else if (type === 'keyboard_settings') {
        modalTitle.textContent = "Keyboard Settings";
        // Re-using the 'controls' help text as it lists all current keyboard mappings.
        // If rebindable keys are implemented, this section would become dynamic.
        modalBodyContent.innerHTML = `
            <h4>Camera Controls:</h4>
            <ul>
                <li><strong>W, A, S, D:</strong> Free Camera Movement (Horizontal Plane)</li>
                <li><strong>Z / X:</strong> Move Camera Up / Down (Vertical)</li>
                <li><strong>Mouse Left-Click (in space):</strong> Select / Center on Object</li>
                <li><strong>Mouse Wheel:</strong> Zoom In / Out</li>
                <li><strong>Mouse Middle-Drag:</strong> Pan Camera</li>
                <li><strong>Hold 'C' + Left-Drag:</strong> Rotate Camera around Target</li>
            </ul>
            <h4>Player Ship Controls:</h4>
            <ul>
                <li><strong>Arrow Up:</strong> Thrust Forward</li>
                <li><strong>Arrow Down:</strong> Thrust Backward / Brake</li>
                <li><strong>Arrow Left:</strong> Turn Left (Yaw)</li>
                <li><strong>Arrow Right:</strong> Turn Right (Yaw)</li>
            </ul>
            <h4>Interaction & UI:</h4>
            <ul>
                <li><strong>'F':</strong> Toggle Follow Selected Object</li>
                <li><strong>Enter:</strong> Toggle Focus and Follow Selected Object</li>
                <li><strong>'[' / ']':</strong> Cycle Previous / Next Selectable Object</li>
                <li><strong>'O':</strong> Toggle Planet Orbit Lines Visibility</li>
                <li><strong>Escape:</strong> Return to Main Menu</li>
                <li><strong>F1:</strong> Show Controls Help</li>
                <li><strong>F2:</strong> Toggle Object Selection Menu</li>
                <li><strong>F3 or R:</strong> Open Station Market (if station focused)</li>
                <li><strong>F4:</strong> Open Ship Overview</li>
            </ul>
            <h4>Simulation & General UI:</h4>
            <ul>
                <li><strong>Pause/Resume Button (UI):</strong> Pause or Resume Simulation</li>
                <li><strong>Speed Slider (UI):</strong> Adjust Simulation Speed</li>
                <li><strong>✨ Tell Me About... Button (UI):</strong> Get Info on Selected Object</li>
                <li><strong>Toggle Fullscreen Button (UI):</strong> Enter/Exit Fullscreen Mode</li>
            </ul>
            <br>
            <div class="settings-menu-item" id="backToSettingsMenuBtn" style="cursor: pointer; padding: 10px; background-color: #333; margin: 8px 0; border-radius: 5px; text-align: center;">Back to Settings Menu</div>
        `;
        const backToSettingsMenuBtn = modalBodyContent.querySelector('#backToSettingsMenuBtn');
        if (backToSettingsMenuBtn) {
            backToSettingsMenuBtn.onclick = () => openInfoModal('settings_menu');
        }
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
        const row = commoditiesTableBody.insertRow();
        const cell = row.insertCell();
        cell.colSpan = 5;
        cell.textContent = "No commodities available or traded at this station.";
        cell.style.textAlign = "center";
    }

    const passengerData = targetStation.userData.passengerTerminal;
    if (passengerData && passengerData.available && passengerData.available.length > 0) {
         passengerData.available.forEach((paxGroup, index) => {
            const row = passengersTableBody.insertRow();
            row.insertCell().textContent = `${paxGroup.count} to ${paxGroup.destinationStationName}`;
            row.insertCell().textContent = `${paxGroup.farePerPerson} cr`;
            row.insertCell().textContent = `${paxGroup.totalFare} cr`;
            const actionsCell = row.insertCell();
            const acceptButton = document.createElement('button');
            acceptButton.textContent = "Accept";
            acceptButton.disabled = (playerData.passengers.reduce((sum, pg) => sum + pg.count, 0) + paxGroup.count) > playerData.maxPassengers;
            acceptButton.onclick = () => _acceptPassengersCallback(targetStation, index);
            actionsCell.appendChild(acceptButton);
         });
    } else {
        const row = passengersTableBody.insertRow();
        const cell = row.insertCell();
        cell.colSpan = 4;
        cell.textContent = "No passenger missions currently available from this station.";
        cell.style.textAlign = "center";
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
    if (playerData.cargoHold.length > 0) {
        playerData.cargoHold.forEach(item => {
            const li = document.createElement('li');
            li.textContent = `${item.name} x ${item.quantity}`;
            if(playerCargoListUl) playerCargoListUl.appendChild(li);
        });
    } else {
        const li = document.createElement('li');
        li.textContent = "Empty";
        if(playerCargoListUl) playerCargoListUl.appendChild(li);
    }


    const currentPassengersCount = playerData.passengers.reduce((sum, pg) => sum + pg.count, 0);
    if(playerPassengersCurrentSpan) playerPassengersCurrentSpan.textContent = currentPassengersCount;
    if(playerPassengersMaxSpan) playerPassengersMaxSpan.textContent = playerData.maxPassengers;

    if(playerPassengerListUl) playerPassengerListUl.innerHTML = '';
    if (playerData.passengers.length > 0) {
        playerData.passengers.forEach(pg => {
            const li = document.createElement('li');
            li.textContent = `${pg.count} to ${pg.destinationStationName} (Fare: ${pg.totalFare}cr)`;
            if(playerPassengerListUl) playerPassengerListUl.appendChild(li);
        });
    } else {
        const li = document.createElement('li');
        li.textContent = "No passengers";
        if(playerPassengerListUl) playerPassengerListUl.appendChild(li);
    }
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
                    const destPos = ship.destinationStation.mesh.getWorldPosition(new window.THREE.Vector3()); // Use window.THREE
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
        const row = shipOverviewTableBody.insertRow();
        const cell = row.insertCell();
        cell.colSpan = 7; // Adjusted colspan
        cell.textContent = "No active NPC ships in the system.";
        cell.style.textAlign = "center";
    }
    if (shipOverviewModal) shipOverviewModal.style.display = "flex";
}


console.log("uiManager.js loaded");