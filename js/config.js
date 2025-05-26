// js/config.js
// This file holds static data and configuration variables.
console.log("config.js loaded");

export const DISTANCE_SCALE_AU_TO_THREEJS = 70;
export const MOON_SIMULATION_SPEED_MULTIPLIER = 5;
export const MAX_SIMULATION_SPEED = 2.0;
export const MIN_SIMULATION_SPEED = 0.0;
export const FREE_MOVE_SPEED = 200.0;
export const MAX_ACTIVE_SHIPS = 15;
export const SHIP_SPAWN_INTERVAL = 10; // Try to spawn a ship every N seconds (if under max)
export const SHIP_DOCK_TIME = 5; // Seconds a ship stays "docked" before despawning
export const COMET_TRAIL_PROXIMITY_AU = 5;
export const MAX_TRAIL_POINTS = 70;
export const COMET_TRAIL_UPDATE_INTERVAL = 2; // Update trail every N frames

export const commoditiesMasterList = [
    { id: "food", name: "Food Stuffs", basePrice: 20, category: "agricultural" },
    { id: "textiles", name: "Textiles", basePrice: 30, category: "agricultural" },
    { id: "minerals", name: "Minerals", basePrice: 50, category: "mining" },
    { id: "metals", name: "Metals", basePrice: 80, category: "mining" },
    { id: "robotics", name: "Robotics", basePrice: 250, category: "industrial" },
    { id: "computers", name: "Computers", basePrice: 350, category: "highTech" },
    { id: "medicines", name: "Medicines", basePrice: 180, category: "highTech" },
    { id: "luxuries", name: "Luxury Goods", basePrice: 500, category: "tourism_consumer" },
    { id: "slaves", name: "Slaves", basePrice: 150, category: "illegal", illegal: true },
    { id: "narcotics", name: "Narcotics", basePrice: 300, category: "illegal", illegal: true },
    { id: "machinery", name: "Machinery", basePrice: 150, category: "industrial" },
    { id: "liquor_wines", name: "Liquor & Wines", basePrice: 90, category: "agricultural" },
];

export let playerData = { // Note: This is stateful, might be better managed elsewhere eventually
    credits: 1000,
    cargoHold: [],
    maxCargo: 20,
    passengers: [],
    maxPassengers: 4,
playerShip: {
        type: 'LightFreighter', // Example type
        name: 'Stardust Wanderer', // Example name
        cargoCapacity: 50,
        currentCargo: 0, // Will mirror cargoHold.length or sum of quantities
        fuel: 100, // Max fuel
        currentFuel: 100,
        // Other ship-specific stats can be added here later (e.g., speed, maneuverability, hull strength)
    },
};

export const sunData = { name: 'Sun', color: 0xFFFF00, visualRadius: 15 };

export const planetsData = [
    { name: 'Mercury', color: 0xAAAAAA, visualRadius: 0.6, orbitalRadiusAU: 0.39, orbitalPeriodYears: 0.24, orbitalInclinationDegrees: 7.0, moons: [] },
    { name: 'Venus', color: 0xFFE4B5, visualRadius: 0.9, orbitalRadiusAU: 0.72, orbitalPeriodYears: 0.62, orbitalInclinationDegrees: 3.4, moons: [] },
    {
        name: 'Earth',
        color: 0x6495ED,
        visualRadius: 1.0,
        orbitalRadiusAU: 1.00,
        orbitalPeriodYears: 1.0,
        orbitalInclinationDegrees: 0.0,
        moons: [
            { name: 'Moon', visualRadius: 0.27, orbitalRadius: 3, orbitalPeriodDays: 27.3, color: 0xDDDDDD },
            { name: 'Borg Cube', isCube: true, visualSize: 0.3, orbitalRadius: 4, orbitalPeriodDays: 5, color: 0x00FF00 }
        ]
    },
    { name: 'Mars', color: 0xFF4500, visualRadius: 0.7, orbitalRadiusAU: 1.52, orbitalPeriodYears: 1.88, orbitalInclinationDegrees: 1.9, moons: [{ name: 'Phobos', visualRadius: 0.1, orbitalRadius: 1.5, orbitalPeriodDays: 0.3, color: 0x999999 }, { name: 'Deimos', visualRadius: 0.08, orbitalRadius: 2.5, orbitalPeriodDays: 1.26, color: 0xBBBBBB }] },
    { name: 'Jupiter', color: 0xFFDEAD, visualRadius: 5.0, orbitalRadiusAU: 5.20, orbitalPeriodYears: 11.86, orbitalInclinationDegrees: 1.3, moons: [{ name: 'Io', visualRadius: 0.36, orbitalRadius: 6, orbitalPeriodDays: 1.77, color: 0xFFFFE0 }, { name: 'Europa', visualRadius: 0.31, orbitalRadius: 8, orbitalPeriodDays: 3.55, color: 0xD2B48C }, { name: 'Ganymede', visualRadius: 0.52, orbitalRadius: 11, orbitalPeriodDays: 7.15, color: 0xBCB88A }, { name: 'Callisto', visualRadius: 0.48, orbitalRadius: 15, orbitalPeriodDays: 16.69, color: 0xA9A9A9 }] },
    { name: 'Saturn', color: 0xF0E68C, visualRadius: 4.2, orbitalRadiusAU: 9.58, orbitalPeriodYears: 29.46, orbitalInclinationDegrees: 2.5, hasRings: true, moons: [{ name: 'Titan', visualRadius: 0.51, orbitalRadius: 7, orbitalPeriodDays: 15.95, color: 0xFFD700 }] },
    {
        name: 'Uranus',
        color: 0xAFEEEE,
        visualRadius: 2.5,
        orbitalRadiusAU: 19.22,
        orbitalPeriodYears: 84.01,
        orbitalInclinationDegrees: 0.8,
        moons: [
            { name: 'Titania', visualRadius: 0.15, orbitalRadius: 5, orbitalPeriodDays: 8.7, color: 0xB0E0E6 },
            { name: 'Oberon', visualRadius: 0.14, orbitalRadius: 6.5, orbitalPeriodDays: 13.46, color: 0xADDDDDD },
            { name: 'Ashtar Command Ship 1', isSpaceship: true, visualSize: 0.15, orbitalRadius: 3.5, orbitalPeriodDays: 2, color: 0xFF00FF, fleetOffsetAngle: 0 },
            { name: 'Ashtar Command Ship 2', isSpaceship: true, visualSize: 0.15, orbitalRadius: 3.55, orbitalPeriodDays: 2, color: 0xFF00FF, fleetOffsetAngle: 0.1 },
            { name: 'Ashtar Command Ship 3', isSpaceship: true, visualSize: 0.15, orbitalRadius: 3.45, orbitalPeriodDays: 2, color: 0xFF00FF, fleetOffsetAngle: -0.1 },
            { name: 'Ashtar Command Ship 4', isSpaceship: true, visualSize: 0.15, orbitalRadius: 3.52, orbitalPeriodDays: 2, color: 0xFF00FF, fleetOffsetAngle: 0.2 },
            { name: 'Ashtar Command Ship 5', isSpaceship: true, visualSize: 0.15, orbitalRadius: 3.48, orbitalPeriodDays: 2, color: 0xFF00FF, fleetOffsetAngle: -0.2 },
        ]
    },
    { name: 'Neptune', color: 0x4682B4, visualRadius: 2.3, orbitalRadiusAU: 30.05, orbitalPeriodYears: 164.8, orbitalInclinationDegrees: 1.8, moons: [{ name: 'Triton', visualRadius: 0.27, orbitalRadius: 4.5, orbitalPeriodDays: 5.88, color: 0x708090 }] },
    { name: 'Pluto', color: 0xDFCDB4, visualRadius: 0.35, orbitalRadiusAU: 39.5, orbitalPeriodYears: 248, orbitalInclinationDegrees: 17.2, eccentricity: 0.248, moons: [ { name: 'Charon', visualRadius: 0.18, orbitalRadius: 1.5, orbitalPeriodDays: 6.387, color: 0xB0A090 } ] }
];

export const asteroidBeltsData = [
    { name: "Main Asteroid Belt", count: 300, minRadiusAU: 2.2, maxRadiusAU: 3.2, minInclination: -5, maxInclination: 5, thickness: 0.5 * DISTANCE_SCALE_AU_TO_THREEJS, color: 0x888888 },
    { name: "Outer Belt", count: 200, minRadiusAU: 35, maxRadiusAU: 50, minInclination: -15, maxInclination: 15, thickness: 2 * DISTANCE_SCALE_AU_TO_THREEJS, color: 0x777777 }
];

export const cometsData = [
    { name: "Comet Halley-Type", visualRadius: 0.3, color: 0xEEEEFF, semiMajorAxisAU: 17.8, eccentricity: 0.96, inclinationDegrees: 18.0, longitudeOfAscendingNodeDegrees: 58.0, argumentOfPeriapsisDegrees: 111.0, orbitalPeriodYears: 75 },
    { name: "Comet Swift-Tuttle-Like", visualRadius: 0.25, color: 0xDDEEFF, semiMajorAxisAU: 26.0, eccentricity: 0.963, inclinationDegrees: 113.0, longitudeOfAscendingNodeDegrees: 139.0, argumentOfPeriapsisDegrees: 153.0, orbitalPeriodYears: 133 }
];

export const stationsData = [ // Ensure ALL stations have id, economyType, population, techLevel, market, passengerTerminal
    {
        name: "Tsiolkovsky Station (Earth Orbit)", type: "CORIOLIS", orbitsBody: "Earth", orbitalRadius: 7, orbitalPeriodDays: 0.25, visualSize: 1.0, color: 0xB0C4DE, rotationSpeed: 0.004,
        id: "earth_station_1", economyType: "Industrial", population: 100000, techLevel: 7, market: { commodities: [] }, passengerTerminal: { available: [], demand: [] }
    },
    {
        name: "Noordung Hab-Wheel (Mars Orbit)", type: "TORUS", orbitsBody: "Mars", orbitalRadius: 4.5, orbitalPeriodDays: 0.15, visualSize: 0.8, tubeRadius: 0.2, color: 0xD2B48C, rotationSpeed: 0.003,
        id: "mars_station_1", economyType: "Agricultural", population: 50000, techLevel: 5, market: { commodities: [] }, passengerTerminal: { available: [], demand: [] }
    },
    {
        name: "Oberth Platform (Jupiter - Io Orbit)", type: "MODULAR", orbitsBody: "Io", orbitalRadius: 1.0, orbitalPeriodDays: 0.08, visualSize: 0.5, color: 0x87CEEB,
        id: "io_station_1", economyType: "Mining", population: 15000, techLevel: 6, market: { commodities: [] }, passengerTerminal: { available: [], demand: [] }
    },
    {
        name: "Von Braun Gateway (Moon Orbit)", type: "ONEILL_CYLINDER", orbitsBody: "Moon", orbitalRadius: 1.5, orbitalPeriodDays: 0.1, visualLength: 0.7, visualRadius: 0.15, color: 0xE6E6FA, rotationSpeed: 0.002,
        id: "moon_station_1", economyType: "High-Tech", population: 70000, techLevel: 8, market: { commodities: [] }, passengerTerminal: { available: [], demand: [] }
    },
    {
        name: "Goddard Depot (Mercury Orbit)", type: "DODEC_OUTPOST", orbitsBody: "Mercury", orbitalRadius: 2.0, orbitalPeriodDays: 0.12, visualSize: 0.4, color: 0xA9A9A9,
        id: "mercury_station_1", economyType: "Refinery", population: 20000, techLevel: 4, market: { commodities: [] }, passengerTerminal: { available: [], demand: [] }
    },
    {
        name: "Clarke Point (Saturn - Titan Orbit)", type: "GEODESIC_DOME_CLUSTER", orbitsBody: "Titan", orbitalRadius: 2.5, orbitalPeriodDays: 0.2, visualSize: 0.6, color: 0xFFFACD,
        id: "titan_station_1", economyType: "Tourism", population: 30000, techLevel: 7, market: { commodities: [] }, passengerTerminal: { available: [], demand: [] }
    },
    {
        name: "Sagan Memorial (Outer Belt Asteroid)", type: "ASTEROID_BASE", inAsteroidBelt: "Outer Belt", visualSize: 0.4, color: 0x4682B4,
        id: "outer_belt_station_1", economyType: "Mining", population: 5000, techLevel: 3, market: { commodities: [] }, passengerTerminal: { available: [], demand: [] }
    },
    {
        name: "Korolev Launchpad (Venus Orbit)", type: "LAUNCH_PLATFORM_ARRAY", orbitsBody: "Venus", orbitalRadius: 3.5, orbitalPeriodDays: 0.18, visualSize: 0.7, color: 0xFFD700,
        id: "venus_station_1", economyType: "Industrial", population: 40000, techLevel: 6, market: { commodities: [] }, passengerTerminal: { available: [], demand: [] }
    },
    {
        name: "O'Neill's Promise (Uranus Orbit)", type: "ONEILL_CYLINDER", orbitsBody: "Uranus", orbitalRadius: 7, orbitalPeriodDays: 0.5, visualLength: 1.2, visualRadius: 0.3, color: 0xAFEEEE, rotationSpeed: 0.0015,
        id: "uranus_station_1", economyType: "Agricultural", population: 60000, techLevel: 5, market: { commodities: [] }, passengerTerminal: { available: [], demand: [] }
    },
    {
        name: "Kuiper Gateway (Deep Space)", type: "SKELETAL_FRAME", orbitsBody: "Sun", orbitalRadiusAU: 55, orbitalPeriodYears: 400, visualSize: 1.5, color: 0x778899, orbitalInclinationDegrees: 5.0,
        id: "kuiper_gateway_1", economyType: "High-Tech", population: 2000, techLevel: 8, market: { commodities: [] }, passengerTerminal: { available: [], demand: [] }
    }
];

// Ship Name Components (as per enhancement_plan.md)
export const SHIP_NAME_PREFIXES = ["Star", "Void", "Trade", "Swift", "Solar", "Nova", "Cosmic", "Light", "Dark", "Iron"];
export const SHIP_NAME_CORES_CARGO = ["Hauler", "Freighter", "Barge", "Carrier", "Merchant", "Transporter"];
export const SHIP_NAME_CORES_PASSENGER = ["Liner", "Cruiser", "Yacht", "Shuttle", "Clipper", "Voyager"];
export const SHIP_NAME_CORES_PIRATE = ["Marauder", "Reaver", "Pillager", "Raider", "Corsair", "Cutlass"];
export const SHIP_NAME_SUFFIXES = ["Alpha", "Beta", "Gamma", "Delta", "Prime", "MK II", "MK III", "LX", "GT", "X"];