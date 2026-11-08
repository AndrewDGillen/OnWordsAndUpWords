#Functions for managing game state
from onwords.save import deserialise, serialise

_game_state = None

def get_current_version():
    return 0

def get_initial_state():
    state = {
        "version":get_current_version(),
        "points":0,
    }

    return state

def load_state(saved_data):
    global _game_state
    _game_state = deserialise(saved_data)

def get_game_state():
    if _game_state is None:
        raise RuntimeError("Game state has not been loaded")

    return _game_state

def get_save_data():
    return serialise(get_game_state())