import {Meteor} from 'meteor/meteor';
import {Template} from 'meteor/templating';

import {Games} from '../api/games.js';
import {Pokemon} from '../api/pokemon.js';

import './game.js';
import './game_page.js';
import './pokemon.js';
import './body.html';

Template.index.onCreated(function() {
    Meteor.subscribe('games');
    Meteor.subscribe('pokemon_instances');
});

Template.index.helpers({
    games() {
        return Games.find({});
    },
    pokemon() {
        return Pokemon.find();
    },
});

Template.base.events({
    'submit .new-game'(event) {
        event.preventDefault();
        
        const f = event.target;

        Meteor.call('games.insert', f.name.value, f.rank.value, f.category.value, f.pokemon.value);
    },
});

