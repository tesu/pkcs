import {Meteor} from 'meteor/meteor';
import {Template} from 'meteor/templating';
import {ReactiveDict} from 'meteor/reactive-dict';

import {Games} from '../api/games.js';
import {Pokemon} from '../api/pokemon.js';

import './game.js';
import './game_page.js';
import './pokemon.js';
import './body.html';

Template.index.onCreated(function() {
    Meteor.subscribe('games');
    Meteor.subscribe('pokemon_instances');

    this.state = new ReactiveDict();
});

Template.index.helpers({
    games() {
        return Games.find({});
    },
    pokemon() {
        return Pokemon.find();
    },
    showGameForm() {
        return Template.instance().state.get('show-form');
    },
});

Template.index.events({
    'click #toggle-game-form'(event) {
        event.preventDefault();
        const instance = Template.instance();
        instance.state.set('show-form', !instance.state.get('show-form'));
    },
    'submit .new-game'(event) {
        event.preventDefault();
        const instance = Template.instance();
        const f = event.target;

        Meteor.call('games.insert', f.name.value, f.rank.value, f.category.value, f.pokemon.value);
        instance.state.set('show-form', false);
    },
});

