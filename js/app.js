import { getPython } from "./python.js";
import { saveGame, loadGame } from "./storage.js";

const status = document.getElementById("load-status");

//Ensures we can update the message based on python status
function updateStatus(message) {
    status.textContent = message;
}

//Starts the app
async function startApplication() {
    try {
        //first we load and test python
        const pyodide = await getPython(updateStatus);

        const result = pyodide.runPython(`
            from onwords.test import test_python
            test_python()
        `);

        updateStatus(`Python Result: ${result}`);
        
        //Then we deal with loading saved data
        const SAVE_KEY = "onwords-save";

        let savedData = loadGame(SAVE_KEY);

        if (savedData === null) {

            // No existing save: create an initial state
            savedData = pyodide.runPython(`
                from onwords.state import get_initial_state
                from onwords.save import serialise

                serialise(get_initial_state())
            `);

            // Persist the initial state
            const didSave = saveGame(SAVE_KEY, savedData);

            if (!didSave) {
                console.warn("Unable to persist game state.");
            }
        }

        // Pass the JSON string into Python
        pyodide.globals.set("savedData", savedData);

        // Initialise the active game state
        pyodide.runPython(`
            from onwords.state import load_state
            load_state(savedData)
        `);

        // Verify the state
        const gameState = pyodide.runPython(`
            from onwords.state import get_save_data
            get_save_data()
        `);

        console.log("Active game state:", gameState);

        updateStatus("Game loaded successfully!");

    } catch (error) {
        console.error("Application startup failed:", error);
        throw error;
    }
}

startApplication();