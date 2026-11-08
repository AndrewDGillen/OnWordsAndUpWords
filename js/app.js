import { getPython } from "./python.js";
import { saveGame, loadGame } from "./storage.js";

const status = document.getElementById("load-status");

//Variables for saving
const SAVE_KEY = "onwords-save";
const savestatus = document.getElementById("save-status");
const saveButton = document.getElementById("save-button");
const AUTOSAVE_INTERVAL = 30_000; // 30 seconds in milliseconds
let autosaveTimer = null;

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
        startAutosave();

        // document.addEventListener(
        //     "visibilitychange",
        //     handleVisibilityChange
        // );

        updateStatus("Game loaded successfully!");

    } catch (error) {
        console.error("Application startup failed:", error);
        updateStatus("Failed to start application.");
    }
}

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
            saveCurrentGame("Game automatically saved");
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
                saveCurrentGame("Game saved automatically");
            }
        } catch (error) {
            console.error("Failed to save on page hide:", error);
        }
    }
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