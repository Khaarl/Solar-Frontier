// js/utils.js
// Utility functions.
import { sunData } from './config.js'; // Assuming sunData is exported from config

console.log("utils.js loaded");

export function getObjectVisualRadius(object) {
    if (!object || !object.userData) return 1;
    // Ensure sunData is correctly accessed, might need to be passed or imported if not global
    // For now, assuming sunData is available from config.js import
    if (object.userData.name === "Sun" && sunData) return sunData.visualRadius;
    if (object.userData.isPlanet) return object.userData.visualRadius;
    if (object.userData.isMoon) return object.userData.visualRadius || 0.1;
    if (object.userData.isComet) return object.userData.visualRadius || 0.2;
    if (object.userData.isStation) return object.userData.visualSize || 0.5;
    if (object.userData.isShip) return 0.6; // Effective radius for ships
    return 1; // Default
}

// Add other general utility functions here as needed.
// For example, a random number generator within a range:
export function getRandomInRange(min, max) {
    return Math.random() * (max - min) + min;
}