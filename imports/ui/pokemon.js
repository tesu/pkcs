import {Template} from 'meteor/templating';
import {ReactiveDict} from 'meteor/reactive-dict';

import {Pokedex} from '../api/pokedex.js';

import './pokemon.html';

Template.pokemon.onCreated(function() {
    Meteor.subscribe('pokemon');
    Meteor.subscribe('moves');

    this.state = new ReactiveDict();
    this.state.set('pokemon', 'bulbasaur');
});

Template.pokemon.helpers({
    name() {
        return this.identifier.split('-').map(function(str) {
            return str.charAt(0).toUpperCase()+str.slice(1);
        }).join(' ');
    },
    pokemonList() {
        return Pokedex._collections['pokemon'].find();
    },
    moveList() {
        return Pokedex.validMoves(Template.instance().state.get('pokemon'));
    },
});

Template.pokemon.events({
    'change .pokemon'(event, instance) {
        instance.state.set('pokemon', event.target.value);
    }

})

