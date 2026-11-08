#Functions for managing game state
from onwords.save import deserialise, serialise

_game_state = None

def get_current_version():
    return 0

def get_supported_versions():
    return [0,]

def get_initial_state():
    state = {
        "version":get_current_version(),
        "points":0,
    }

    return state

def load_state(saved_data):
    state = deserialise(saved_data)
    validate_state(state)

    global _game_state
    _game_state = state

def get_game_state():
    if _game_state is None:
        raise RuntimeError("Game state has not been loaded")

    return _game_state

def get_save_data():
    return serialise(get_game_state())

#Checks the state is actually in the correct format
def validate_state(state):
    if not isinstance(state, dict):
        raise ValueError("Game state must be a dictionary")

    if "version" not in state:
        raise ValueError("Save is missing version information")

    if type(state["version"]) is not int:
        raise ValueError("Save version must be an integer")

    if state["version"] not in get_supported_versions():
        raise ValueError(
            f"Incompatible save version: {state['version']}"
        )

    if "points" not in state:
        raise ValueError("Save is missing points")

    if type(state["points"]) is not int:
        raise ValueError("Points must be an integer")

    if state["points"] < 0:
        raise ValueError("Points cannot be negative")

    return True