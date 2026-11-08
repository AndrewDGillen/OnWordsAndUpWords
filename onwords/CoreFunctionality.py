import enchant
import random
import string

from itertools import permutations
from nltk.corpus import wordnet as wn

#Defines the user's current settings
class UserModifiers():
    def __init__(self):

        #Currently the dictionary is set to english only - changable?
        self.dictionary = enchant.Dict("en")
        self.lettercount = 4
        self.letterchoices = string.ascii_uppercase
        self.singletons = ["I", "A"]
        self.manual_words = set()
        self.auto_words = set()
        self.accept_acronyms = False

    def get_total_words(self):
        return len(self.manual_words)+len(self.auto_words)
    
    #Checks whether the submitted string is really a word
    def check_validity(self, putative):
        valid = False
    
        if len(putative) == 1:
            if putative in self.singletons:
                valid = True
        else:
            
            if not self.accept_acronyms:
                putative = putative.lower()

                print(putative,  bool(wn.synsets(putative)))
                if bool(wn.synsets(putative)):
                    valid = True
                    
            # if self.dictionary.check(putative):
            #     valid = True

        return valid
    
#Given a list of characters, returns the first found best word
def unscramble_chars(UM, chars):
    all_possible = set()

    for word_length in range(3,len(chars)+1):
        
        #Checks every possible word length
        for possible in permutations(chars, word_length):
            
            #Permutations returns these as a tuple - we join it up
            possible = ''.join(possible)
            
            #If the word exists in the current dictionary, adds it to the possible list
            if UM.check_validity(possible):
                all_possible.add(possible)
    
    return all_possible

#Gets a random set of letters of given length
def grab_letters(UM):
    return [random.choice(UM.letterchoices) for i in range(UM.lettercount)]

def main():
    UM = UserModifiers()

    got_letters = grab_letters(UM)
    got_letters = ['F', 'Y', 'F', 'L']
    got_letters = ['C', 'I', 'A', 'L']
    print(f'your letters are: {got_letters}')

    print(unscramble_chars(UM, got_letters))

if __name__ == "__main__":
    main()