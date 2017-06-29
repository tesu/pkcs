import {Mongo} from 'meteor/mongo';
import {check} from 'meteor/check';

import {Pokedex} from './pokedex.js';

export let Pokemon = new Mongo.Collection('pokemon_instances');

if (Meteor.isServer) {
    Meteor.publish('pokemon_instances', function () {
        return Pokemon.find({owner: this.userId});
    });
}

Meteor.methods({
    'pokemon.insert'(pokemon) {
        Pokemon.insert(pokemon); 
    }
});

