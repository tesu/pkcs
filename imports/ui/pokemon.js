import {Template} from 'meteor/templating';

import {Pokedex} from '../api/pokedex.js';

import './pokemon.html';

Template.pokemon.onCreated(function pokemonOnCreated() {
    Meteor.subscribe('pokemon');
});

Template.pokemon.helpers({
    pokemonList() {
        return Pokedex._collections['pokemon'].find();
    },
});
