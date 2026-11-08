//This code ensures correct handling of saving/loading gamestate

export function saveGame(SAVE_KEY, json) {
    try {
        localStorage.setItem(SAVE_KEY, json);
        return true;
    } catch (error) {
        console.error("Failed to save game:", error);
        return false;
    }
}

export function loadGame(SAVE_KEY) {
    try {
        return localStorage.getItem(SAVE_KEY);
    } catch (error) {
        console.error("Failed to load game:", error);
        return null;
    }
}