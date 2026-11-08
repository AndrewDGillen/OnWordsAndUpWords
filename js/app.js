import { getPython } from "./python.js";
import { saveGame, loadGame } from "./storage.js";

const status = document.getElementById("load-status");

//Variables for saving
const SAVE_KEY = "onwords-save";
const savestatus = document.getElementById("save-status");
const saveButton = document.getElementById("save-button");
const AUTOSAVE_INTERVAL = 30_000; // 30 seconds in milliseconds
let autosaveTimer = null;
const exportButton = document.getElementById("export-button");
const importButton = document.getElementById("import-button");
const importFile = document.getElementById("import-file");
const resetButton = document.getElementById("reset-button");

let gameAPI = null;

function updateStatus(message) {
    status.textContent = message;
}
function saveStatus(message) {
    savestatus.textContent = message;
}

async function startApplication() {
    try {
        // Initialise Python and install the game package
        const pyodide = await getPython(updateStatus);

        // Import the Python game API
        gameAPI = pyodide.pyimport("onwords.api");

        updateStatus("Loading game...");

        // Check for an existing save
        let savedData = loadGame(SAVE_KEY);

        // Create a new game if no save exists
        if (savedData === null) {
            savedData = gameAPI.new_game();

            const didSave = saveGame(SAVE_KEY, savedData);

            if (!didSave) {
                console.warn("Unable to persist game state.");
            }
        }

        // Initialise the active Python game state
        try {
            gameAPI.load_game(savedData);
        } catch (error) {
            console.error("Invalid save data:", error);

            updateStatus(
                "Unable to load saved game. Your current save has been preserved."
            );

            return;
        }

        // Confirm successful initialisation
        console.log(
            "Active game state:",
            gameAPI.get_game_data()
        );
        
        //Activate game saving
        saveButton.disabled = false;
        exportButton.disabled = false;
        importButton.disabled = false;
        resetButton.disabled = false;
        startAutosave();

        document.addEventListener(
            "visibilitychange",
            handleVisibilityChange
        );

        updateStatus("Game loaded successfully!");

    } catch (error) {
        console.error("Application startup failed:", error);
        updateStatus("Failed to start application.");
    }
}

//Saves the current game state
function saveCurrentGame(message) {
    if (gameAPI === null) {
        throw new Error("Game has not been initialised.");
    }

    const savedData = gameAPI.save_game();

    const didSave = saveGame(SAVE_KEY, savedData);

    if (!didSave) {
        console.warn("Unable to persist game state.");
        updateStatus("Failed to save game.");
        return false;
    }

    console.log("Game saved:", savedData);
    saveStatus(message);

    return true;
}

//Starts the autosave function
function startAutosave() {
    if (autosaveTimer !== null) {
        return;
    }

    autosaveTimer = setInterval(() => {
        try {
            saveCurrentGame("Game auto-saved");
        } catch (error) {
            console.error("Autosave failed:", error);
        }
    }, AUTOSAVE_INTERVAL);
}

//Deals with tab outs - we always save on tab switching
function handleVisibilityChange() {
    if (document.visibilityState === "hidden") {
        try {
            if (gameAPI !== null) {
                saveCurrentGame("Game auto-saved");
            }
        } catch (error) {
            console.error("Failed to save on page hide:", error);
        }
    }
}

//Exports the gamestate as a .json
function exportCurrentGame() {
    if (gameAPI === null ) {
        throw new Error("Game has not been initialised.");
    }

    //Retrieves serialised JSON from Python
    const savedData = gameAPI.save_game();

    //Creates a downloadable JSON file
    const blob = new Blob(
        [savedData],
        { type: "application/json" }
    );

    //Creates a temporary download URL
    const url = URL.createObjectURL(blob);

    //Creates a temporary download link
    const link = document.createElement("a");

    link.href = url;
    const now = new Date();

    const timestamp = [
        now.getFullYear(),
        String(now.getMonth() + 1).padStart(2, "0"),
        String(now.getDate()).padStart(2, "0")
    ].join("-") + "_" + [
        String(now.getHours()).padStart(2, "0"),
        String(now.getMinutes()).padStart(2, "0"),
        String(now.getSeconds()).padStart(2, "0")
    ].join("-");

    link.download = `OnWordsAndUpWords-save_${timestamp}.json`;

    document.body.appendChild(link);

    // Trigger download
    link.click();

    // Clean up
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}

//Imports a save .json
async function importGame(file) {
    if (gameAPI === null) {
        throw new Error("Python game API is not initialised.");
    }

    //Read the selected file
    const importedData = await file.text();

    //Preserve the currently active state, if one exists
    const previousState = gameAPI.save_game();

    //Validate and load the imported state in Python
    gameAPI.load_game(importedData);

    //Store the validated state in localStorage
    const didSave = saveGame(
        SAVE_KEY,
        gameAPI.save_game()
    );

    if (!didSave) {
        // Restore the previous active state if persistence fails
        if (previousState !== null) {
            gameAPI.load_game(previousState);
        }

        throw new Error("Failed to persist imported save.");
    }

    //Successful import
    saveButton.disabled = false;
    exportButton.disabled = false;

    startAutosave();

    console.log(
        "Imported game state:",
        gameAPI.get_game_data()
    );

    saveStatus("Save imported successfully!");
}

//Resets the game to a fresh save
async function resetGame() {
    if (gameAPI === null) {
        throw new Error("Python game API is not initialised.");
    }

    //Re-initialises the game
    const newSave = gameAPI.new_game();

    //Store the validated state in localStorage
    const didSave = saveGame(
        SAVE_KEY,
        gameAPI.save_game()
    );

    if (!didSave) {
        throw new Error("Failed to reset the save.");
    }

    //Successful reset
    gameAPI.load_game(newSave);
    saveButton.disabled = false;
    exportButton.disabled = false;

    startAutosave();

    console.log(
        "Refreshed game state:",
        gameAPI.get_game_data()
    );

    saveStatus("Successfuly reset your game");
}

//ACTUAL RUNNING

startApplication();

//Listener for manual game saving
saveButton.addEventListener("click", () => {
    try {
        saveCurrentGame("Game saved successfully!");
    } catch (error) {
        console.error("Saving failed:", error);
        saveStatus("Failed to save game.");
    }
});

exportButton.addEventListener("click", () => {
    try {
        exportCurrentGame();
        saveStatus("Save exported successfully!");
    } catch (error) {
        console.error("Export failed:", error);
        saveStatus("Failed to export save.");
    }
});

importButton.addEventListener("click", () => {
    importFile.click();
});

importFile.addEventListener("change", async (event) => {
    const file = event.target.files[0];

    if (!file) {
        return;
    }

    try {
        await importGame(file);
    } catch (error) {
        console.error("Import failed:", error);
        saveStatus("Unable to import save. Existing progress preserved.");
    } finally {
        importFile.value = "";
    }
});

resetButton.addEventListener("click", () => {

    const confirmed = window.confirm(
        "Are you sure you want to reset your game?\n\n" +
        "All current progress will be permanently lost.\n" +
        "This action cannot be undone.\n\n" +
        "Consider exporting your save before continuing."
    );

    if (!confirmed) {
        return;
    }

    try {
        resetGame();
        saveStatus("Game reset successfully!");
    } catch (error) {
        console.error("Reset failed:", error);
        saveStatus("Failed to reset save.");
    }
});