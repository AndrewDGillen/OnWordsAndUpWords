from onwords import state
from onwords.save import serialise

#Generate a serialised initial game state
def new_game():
    return serialise(state.get_initial_state())

#Load a saved game into the active Python state.
def load_game(saved_data):
    state.load_state(saved_data)

#Return the current game state as JSON.
def get_game_data():
    return state.get_save_data()

#Return a serialised copy of the current game state.
def save_game():
    return state.get_save_data()