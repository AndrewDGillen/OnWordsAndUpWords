async function initialisePython() {
    const status = document.getElementById("python-status");

    try {
        const pyodide = await loadPyodide();

        const response = await fetch("./python/test.py");

        if (!response.ok) {
            throw new Error(`Failed to load Python: ${response.status}`);
        }

        const pythonCode = await response.text();

        const result = await pyodide.runPythonAsync(pythonCode);

        status.textContent = `Python is working! Result: ${result}`;

    } catch (error) {
        console.error("Python initialisation failed:", error);

        status.textContent = "Failed to initialise Python.";
    }
}

initialisePython();