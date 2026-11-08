#Functions for managing saving game states
import json

def serialise(state):   
    return json.dumps(state)

def deserialise(save_data):
    return json.loads(save_data)