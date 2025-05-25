// js/economyManager.js
// Manages market logic, commodity updates, passenger mission generation.

import { commoditiesMasterList, stationsData as configStationsData, playerData as globalPlayerData } from './config.js'; // playerData might be better managed by a game state module
import { getStations as getGlobalStationsArray, getGlobalClock } from './sceneManager.js';

// Callbacks to be set by main.js or UIManager
let _openMarketModalCallback; // To refresh market UI after transactions
let _updatePlayerMarketInfoCallback; // To update player's credits/cargo display

let lastEconomyUpdateTime = 0;
const ECONOMY_UPDATE_INTERVAL = 15; // seconds

export function initEconomyManager(callbacks) {
    _openMarketModalCallback = callbacks.openMarketModal;
    _updatePlayerMarketInfoCallback = callbacks.updatePlayerMarketInfo;
    console.log("Economy manager initialized");
}

export function initializeStationMarkets() {
    const stations = getGlobalStationsArray(); // from sceneManager
    stations.forEach(s => {
        if (!s.mesh.userData.market) {
            s.mesh.userData.market = { commodities: [] };
        } else {
            s.mesh.userData.market.commodities = [];
        }
        // Ensure passengerTerminal exists
        if (!s.mesh.userData.passengerTerminal) {
             s.mesh.userData.passengerTerminal = { available: [], demand: [] };
        }


        const stationDataRef = configStationsData.find(sd => sd.id === s.mesh.userData.stationId); // Match by ID
        if (!stationDataRef) {
            console.warn("Could not find stationData reference for ID:", s.mesh.userData.stationId, "Name:", s.mesh.userData.name);
            return;
        }
        // Ensure these are set if not already by stationFactory
        s.mesh.userData.economyType = stationDataRef.economyType;
        s.mesh.userData.population = stationDataRef.population;
        s.mesh.userData.techLevel = stationDataRef.techLevel;

        commoditiesMasterList.forEach(comm => {
            let marketEntry = {
                id: comm.id, name: comm.name, basePrice: comm.basePrice, quantity: 0,
                buyPrice: 0, sellPrice: 0, demandFactor: 0, supplyFactor: 0,
                isIllegal: comm.illegal || false
            };

            // Simplified market logic from original, can be expanded
            switch (s.mesh.userData.economyType) {
                case "Agricultural":
                    if (comm.category === "agricultural") {
                        marketEntry.demandFactor = (0.7 + Math.random() * 0.3); marketEntry.supplyFactor = marketEntry.demandFactor;
                        marketEntry.quantity = Math.floor(s.mesh.userData.population / 500 * marketEntry.supplyFactor * (3 + Math.random() * 7));
                        marketEntry.sellPrice = Math.floor(comm.basePrice * (0.85 - (s.mesh.userData.techLevel / 60) + (Math.random()*0.1-0.05) ));
                        marketEntry.buyPrice = Math.floor(marketEntry.sellPrice * (0.7 + (Math.random()*0.1-0.05)) );
                    } else if (comm.id === "machinery" || comm.id === "textiles") {
                        marketEntry.demandFactor = -(0.6 + Math.random() * 0.4);
                        marketEntry.quantity = Math.floor(s.mesh.userData.population / 6000 * Math.abs(marketEntry.demandFactor) * (1 + Math.random() * 2));
                        marketEntry.buyPrice = Math.floor(comm.basePrice * (1.15 + (s.mesh.userData.techLevel / 70) + (Math.random()*0.1-0.05)) );
                        marketEntry.sellPrice = Math.floor(marketEntry.buyPrice * (1.25 + (Math.random()*0.1-0.05)) );
                    }
                    break;
                // ... (other economy types from original code) ...
                case "Industrial":
                     if (comm.id === "machinery" || comm.id === "robotics") {
                        marketEntry.demandFactor = (0.8 + Math.random() * 0.2); marketEntry.supplyFactor = marketEntry.demandFactor;
                        marketEntry.quantity = Math.floor(s.mesh.userData.population / 800 * marketEntry.supplyFactor * (2 + Math.random() * 5));
                        marketEntry.sellPrice = Math.floor(comm.basePrice * (0.9 - (s.mesh.userData.techLevel / 50) + (Math.random()*0.1-0.05)) );
                        marketEntry.buyPrice = Math.floor(marketEntry.sellPrice * (0.75 + (Math.random()*0.1-0.05)) );
                    } else if (comm.id === "minerals" || comm.id === "metals" || comm.id === "food") {
                        marketEntry.demandFactor = -(0.7 + Math.random() * 0.3);
                        marketEntry.quantity = Math.floor(s.mesh.userData.population / 4000 * Math.abs(marketEntry.demandFactor) * (1 + Math.random() * 3));
                        marketEntry.buyPrice = Math.floor(comm.basePrice * (1.2 + (s.mesh.userData.techLevel / 60) + (Math.random()*0.1-0.05)) );
                        marketEntry.sellPrice = Math.floor(marketEntry.buyPrice * (1.3 + (Math.random()*0.1-0.05)) );
                    }
                    break;
                 case "Mining":
                     if (comm.category === "mining") {
                        marketEntry.demandFactor = (0.9 + Math.random() * 0.1); marketEntry.supplyFactor = marketEntry.demandFactor;
                        marketEntry.quantity = Math.floor(s.mesh.userData.population / 300 * marketEntry.supplyFactor * (4 + Math.random() * 8));
                        marketEntry.sellPrice = Math.floor(comm.basePrice * (0.8 - (s.mesh.userData.techLevel / 70) + (Math.random()*0.1-0.05)) );
                        marketEntry.buyPrice = Math.floor(marketEntry.sellPrice * (0.65 + (Math.random()*0.1-0.05)) );
                    } else if (comm.id === "food" || comm.id === "machinery") {
                        marketEntry.demandFactor = -(0.5 + Math.random() * 0.4);
                        marketEntry.quantity = Math.floor(s.mesh.userData.population / 7000 * Math.abs(marketEntry.demandFactor) * (1 + Math.random() * 2));
                        marketEntry.buyPrice = Math.floor(comm.basePrice * (1.1 + (s.mesh.userData.techLevel / 80) + (Math.random()*0.1-0.05)) );
                        marketEntry.sellPrice = Math.floor(marketEntry.buyPrice * (1.2 + (Math.random()*0.1-0.05)) );
                    }
                    break;
                case "High-Tech":
                     if (comm.category === "highTech" || comm.id === "robotics") {
                        marketEntry.demandFactor = (0.7 + Math.random() * 0.25); marketEntry.supplyFactor = marketEntry.demandFactor;
                        marketEntry.quantity = Math.floor(s.mesh.userData.population / 1000 * marketEntry.supplyFactor * (1 + Math.random() * 4));
                        marketEntry.sellPrice = Math.floor(comm.basePrice * (0.95 - (s.mesh.userData.techLevel / 40) + (Math.random()*0.1-0.05)) );
                        marketEntry.buyPrice = Math.floor(marketEntry.sellPrice * (0.8 + (Math.random()*0.1-0.05)) );
                    } else if (comm.id === "metals" || comm.id === "minerals" || comm.id === "luxuries") {
                        marketEntry.demandFactor = -(0.6 + Math.random() * 0.3);
                        marketEntry.quantity = Math.floor(s.mesh.userData.population / 5000 * Math.abs(marketEntry.demandFactor) * (1 + Math.random() * 2));
                        marketEntry.buyPrice = Math.floor(comm.basePrice * (1.25 + (s.mesh.userData.techLevel / 50) + (Math.random()*0.1-0.05)) );
                        marketEntry.sellPrice = Math.floor(marketEntry.buyPrice * (1.35 + (Math.random()*0.1-0.05)) );
                    }
                    break;
                case "Tourism":
                    if (comm.id === "luxuries" || comm.id === "liquor_wines" || comm.id === "food") {
                        marketEntry.demandFactor = -(0.8 + Math.random() * 0.2);
                        marketEntry.quantity = Math.floor(s.mesh.userData.population / 3000 * Math.abs(marketEntry.demandFactor) * (2 + Math.random() * 3));
                        marketEntry.buyPrice = Math.floor(comm.basePrice * (1.3 + (s.mesh.userData.techLevel / 40) + (Math.random()*0.15-0.075)) );
                        marketEntry.sellPrice = Math.floor(marketEntry.buyPrice * (1.4 + (Math.random()*0.1-0.05)) );
                    } else if (comm.id === "textiles"){
                        marketEntry.demandFactor = (0.3 + Math.random() * 0.2); marketEntry.supplyFactor = marketEntry.demandFactor;
                        marketEntry.quantity = Math.floor(s.mesh.userData.population / 1500 * marketEntry.supplyFactor * (1 + Math.random() * 3));
                        marketEntry.sellPrice = Math.floor(comm.basePrice * (0.9 - (s.mesh.userData.techLevel / 70) + (Math.random()*0.1-0.05)) );
                        marketEntry.buyPrice = Math.floor(marketEntry.sellPrice * (0.7 + (Math.random()*0.1-0.05)) );
                    }
                    break;
                case "Refinery":
                    if (comm.id === "metals" || comm.id === "robotics") {
                        marketEntry.demandFactor = (0.6 + Math.random() * 0.2); marketEntry.supplyFactor = marketEntry.demandFactor;
                        marketEntry.quantity = Math.floor(s.mesh.userData.population / 900 * marketEntry.supplyFactor * (2 + Math.random() * 4));
                        marketEntry.sellPrice = Math.floor(comm.basePrice * (0.92 - (s.mesh.userData.techLevel / 55) + (Math.random()*0.1-0.05)) );
                        marketEntry.buyPrice = Math.floor(marketEntry.sellPrice * (0.78 + (Math.random()*0.1-0.05)) );
                    } else if (comm.id === "minerals" || comm.id === "machinery") {
                        marketEntry.demandFactor = -(0.75 + Math.random() * 0.25);
                        marketEntry.quantity = Math.floor(s.mesh.userData.population / 3500 * Math.abs(marketEntry.demandFactor) * (1 + Math.random() * 2.5));
                        marketEntry.buyPrice = Math.floor(comm.basePrice * (1.18 + (s.mesh.userData.techLevel / 65) + (Math.random()*0.1-0.05)) );
                        marketEntry.sellPrice = Math.floor(marketEntry.buyPrice * (1.28 + (Math.random()*0.1-0.05)) );
                    }
                    break;
                default: // Fallback for other/unspecified economy types
                    if (Math.random() < 0.3) { // Small chance to trade anything
                        marketEntry.demandFactor = (Math.random() * 0.4 - 0.2); // Could be supply or demand
                        marketEntry.quantity = Math.floor(s.mesh.userData.population / 10000 * (1 + Math.random() * 5) );
                        marketEntry.sellPrice = Math.floor(comm.basePrice * (1.05 + (Math.random() * 0.2 - 0.1)) );
                        marketEntry.buyPrice = Math.floor(comm.basePrice * (0.95 + (Math.random() * 0.2 - 0.1)) );
                         if (marketEntry.demandFactor > 0 && marketEntry.buyPrice >= marketEntry.sellPrice) marketEntry.buyPrice = Math.floor(marketEntry.sellPrice * 0.8);
                         if (marketEntry.demandFactor < 0 && marketEntry.sellPrice <= marketEntry.buyPrice) marketEntry.sellPrice = Math.floor(marketEntry.buyPrice * 1.2);
                    } else {
                        marketEntry.quantity = 0; marketEntry.buyPrice = 0; marketEntry.sellPrice = 0;
                    }
            }
            // Price and quantity adjustments from original code...
            if (marketEntry.sellPrice === 0 && marketEntry.buyPrice === 0 && marketEntry.quantity > 0) { /* ... */ }
            if (marketEntry.buyPrice > 0 && marketEntry.sellPrice <= marketEntry.buyPrice && marketEntry.demandFactor <= 0) { /* ... */ }
            if (marketEntry.sellPrice > 0 && marketEntry.buyPrice >= marketEntry.sellPrice && marketEntry.demandFactor >= 0) { /* ... */ }
            if (marketEntry.buyPrice < 1 && marketEntry.demandFactor < 0) marketEntry.buyPrice = 1;
            if (marketEntry.sellPrice < 1 && marketEntry.demandFactor > 0) marketEntry.sellPrice = 1;
            if (comm.illegal) { /* ... */ }
            if (marketEntry.quantity < 0) marketEntry.quantity = 0;

            s.mesh.userData.market.commodities.push(marketEntry);
        });
    });
    initializePassengerTerminals(); // Initialize passenger missions after markets
    console.log("Station markets initialized.");
}

export function initializePassengerTerminals() {
    const stations = getGlobalStationsArray(); // from sceneManager
    const planets = []; // This needs to be populated from sceneManager or config if used for distance calc
                        // For now, assuming planetsData from config is sufficient if orbitalRadiusAU is present

    stations.forEach(s => {
        if (!s.mesh.userData.passengerTerminal) s.mesh.userData.passengerTerminal = { available: [], demand: [] };
        s.mesh.userData.passengerTerminal.available = [];

        const currentStationId = s.mesh.userData.stationId;
        const numPassengerGroups = Math.floor(Math.random() * 4) + 1;

        for (let i = 0; i < numPassengerGroups; i++) {
            let destinationStationObj;
            let destinationStationData; // This should be from configStationsData
            let attempts = 0;
            do {
                destinationStationObj = stations[Math.floor(Math.random() * stations.length)];
                destinationStationData = configStationsData.find(sd => sd.id === destinationStationObj.mesh.userData.stationId);
                attempts++;
            } while ((!destinationStationData || destinationStationData.id === currentStationId) && attempts < stations.length * 2);

            if (!destinationStationData || destinationStationData.id === currentStationId) continue;

            const passengerCount = Math.floor(Math.random() * 5) + 1;
            // Distance factor calculation needs careful review with modular structure
            // For now, simplified or using placeholders
            let distanceFactor = 1; 
            // const originParentMesh = s.parentMesh; 
            // const destParentMesh = destinationStationObj.parentMesh;
            // ... (original distance logic was complex and relied on direct scene graph access)
            // This part needs to be re-evaluated based on how parent bodies are tracked.
            // A simpler approach for now:
            if (s.parentMesh !== destinationStationObj.parentMesh) distanceFactor = 3; // Inter-system
            else distanceFactor = 0.5 + Math.abs((s.orbitalRadius || 0) - (destinationStationObj.orbitalRadius || 0)) / 15;


            const baseFare = 50 + Math.random() * 100;
            const farePerPerson = Math.max(20, Math.floor(baseFare * distanceFactor * (1 + (destinationStationData.techLevel || 5) / 20)));

            s.mesh.userData.passengerTerminal.available.push({
                destinationStationName: destinationStationData.name,
                destinationStationId: destinationStationData.id,
                count: passengerCount, farePerPerson: farePerPerson,
                totalFare: passengerCount * farePerPerson
            });
        }
    });
    console.log("Passenger terminals initialized.");
}

export function updateEconomy(isPaused) {
    const globalClock = getGlobalClock();
    if (!globalClock || isPaused) return;

    const currentTime = globalClock.getElapsedTime();
    if ((currentTime - lastEconomyUpdateTime < ECONOMY_UPDATE_INTERVAL)) {
        return;
    }
    lastEconomyUpdateTime = currentTime;
    const stations = getGlobalStationsArray();

    stations.forEach(s => {
        if (!s.mesh.userData.market || !s.mesh.userData.market.commodities) return;
        // ... (original commodity update logic) ...
        s.mesh.userData.market.commodities.forEach(commEntry => {
            const commodityMaster = commoditiesMasterList.find(c => c.id === commEntry.id);
            if (!commodityMaster) return;
            // ... (rest of the quantity and price update logic from original)
        });

        if (Math.random() < 0.2) { // Refresh passenger missions
            // This needs to check if the specific station's market is open,
            // which might require a callback or state from UIManager.
            // For now, we'll just re-init all if a small random chance passes.
            if (Math.random() < 0.05) {
                initializePassengerTerminals();
            }
        }
    });
    // manageShipPopulation(); // This is now in shipLogic.js and called from main animate loop
    // console.log("Economy updated");
}


// --- Market Interaction Functions ---
export function buyCommodity(stationMesh, commodityId, quantityToBuy, currentMarketStationFromUI) {
    if (!stationMesh || !stationMesh.userData.market || quantityToBuy <= 0) return false;
    const marketComm = stationMesh.userData.market.commodities.find(c => c.id === commodityId);
    const masterComm = commoditiesMasterList.find(c => c.id === commodityId);
    if (!marketComm || !masterComm || marketComm.sellPrice <= 0) return false;

    const totalCost = marketComm.sellPrice * quantityToBuy;
    const currentCargoAmount = globalPlayerData.cargoHold.reduce((sum, item) => sum + item.quantity, 0);

    if (globalPlayerData.credits < totalCost) return false;
    if (currentCargoAmount + quantityToBuy > globalPlayerData.maxCargo) return false;
    if (marketComm.quantity < quantityToBuy) return false;

    globalPlayerData.credits -= totalCost;
    marketComm.quantity -= quantityToBuy;
    // ... (update player cargo, price fluctuation logic from original) ...
    let playerCargoItem = globalPlayerData.cargoHold.find(c => c.commodityId === commodityId);
    if (playerCargoItem) {
        playerCargoItem.quantity += quantityToBuy;
    } else {
        globalPlayerData.cargoHold.push({ commodityId: commodityId, name: masterComm.name, quantity: quantityToBuy });
    }
    marketComm.sellPrice = Math.floor(marketComm.sellPrice * (1 + 0.015 * quantityToBuy / (marketComm.quantity + quantityToBuy || 1) ));
    if (marketComm.buyPrice > 0) {
         marketComm.buyPrice = Math.floor(marketComm.buyPrice * (1 + 0.007 * quantityToBuy / (marketComm.quantity + quantityToBuy || 1) ));
    }


    if (_openMarketModalCallback && currentMarketStationFromUI === stationMesh) { // Check if the currently open market needs refresh
        _openMarketModalCallback(stationMesh); // Trigger UI refresh
    }
    if(_updatePlayerMarketInfoCallback) _updatePlayerMarketInfoCallback();
    return true;
}

export function sellCommodity(stationMesh, commodityId, quantityToSell, currentMarketStationFromUI) {
    // ... (similar structure to buyCommodity, using globalPlayerData) ...
    if (!stationMesh || !stationMesh.userData.market || quantityToSell <= 0) return false;
    const marketComm = stationMesh.userData.market.commodities.find(c => c.id === commodityId);
    if (!marketComm || marketComm.buyPrice <= 0) return false;

    let playerCargoItem = globalPlayerData.cargoHold.find(c => c.commodityId === commodityId);
    if (!playerCargoItem || playerCargoItem.quantity < quantityToSell) return false;

    const totalGain = marketComm.buyPrice * quantityToSell;
    globalPlayerData.credits += totalGain;
    marketComm.quantity += quantityToSell;
    playerCargoItem.quantity -= quantityToSell;

    if (playerCargoItem.quantity <= 0) {
        globalPlayerData.cargoHold = globalPlayerData.cargoHold.filter(c => c.commodityId !== commodityId);
    }
    // Price fluctuation
    marketComm.buyPrice = Math.floor(marketComm.buyPrice * (1 - 0.015 * quantityToSell / (marketComm.quantity || 1) ));
    if(marketComm.buyPrice < 1) marketComm.buyPrice = 1;
    if (marketComm.sellPrice > 0) {
         marketComm.sellPrice = Math.floor(marketComm.sellPrice * (1 - 0.007 * quantityToSell / (marketComm.quantity || 1) ));
         if(marketComm.sellPrice < 1) marketComm.sellPrice = 1;
    }

    if (_openMarketModalCallback && currentMarketStationFromUI === stationMesh) {
        _openMarketModalCallback(stationMesh);
    }
    if(_updatePlayerMarketInfoCallback) _updatePlayerMarketInfoCallback();
    return true;
}

export function acceptPassengers(stationMesh, passengerGroupIndex, currentMarketStationFromUI) {
    // ... (using globalPlayerData) ...
    if (!stationMesh || !stationMesh.userData.passengerTerminal || !stationMesh.userData.passengerTerminal.available) return false;
    const paxGroup = stationMesh.userData.passengerTerminal.available[passengerGroupIndex];
    if (!paxGroup) return false;

    const currentPassengersCount = globalPlayerData.passengers.reduce((sum, pg) => sum + pg.count, 0);
    if ((currentPassengersCount + paxGroup.count) > globalPlayerData.maxPassengers) return false;

    globalPlayerData.passengers.push({
        destinationStationName: paxGroup.destinationStationName,
        destinationStationId: paxGroup.destinationStationId,
        count: paxGroup.count,
        farePerPerson: paxGroup.farePerPerson,
        totalFare: paxGroup.totalFare,
        originStationName: stationMesh.userData.name,
        originStationId: stationMesh.userData.stationId
    });
    stationMesh.userData.passengerTerminal.available.splice(passengerGroupIndex, 1);
    
    if (_openMarketModalCallback && currentMarketStationFromUI === stationMesh) {
        _openMarketModalCallback(stationMesh);
    }
    if(_updatePlayerMarketInfoCallback) _updatePlayerMarketInfoCallback();
    return true;
}

export function completePassengerMissionOnArrival(stationMesh) {
    // ... (using globalPlayerData) ...
    if (!stationMesh || !stationMesh.userData.isStation) return 0;
    const currentStationId = stationMesh.userData.stationId;
    let missionsCompletedCount = 0;

    for (let i = globalPlayerData.passengers.length - 1; i >= 0; i--) {
        const paxGroup = globalPlayerData.passengers[i];
        if (paxGroup.destinationStationId === currentStationId) {
            globalPlayerData.credits += paxGroup.totalFare;
            globalPlayerData.passengers.splice(i, 1);
            missionsCompletedCount++;
        }
    }
    if (missionsCompletedCount > 0) {
        if(_updatePlayerMarketInfoCallback) _updatePlayerMarketInfoCallback();
        // If market is open for this station, UIManager's openMarketModal will handle its own refresh.
    }
    return missionsCompletedCount;
}


console.log("economyManager.js loaded");