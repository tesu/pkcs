import {Template} from 'meteor/templating';

import {Pokemon} from '../api/pokemon.js';

import './player.html'

Template.player.onCreated(function() {
    Meteor.subscribe('usernames');
    Meteor.subscribe('pokemon_instances');
});

Template.player.helpers({
    username() {
        const user = Meteor.users.findOne({_id: this.p});
        return user && user.username;
    },
    id() {
        return this.p;
    },
    nickname() {
        const pokemon = Pokemon.findOne({_id: this.game.pokemon[this.p]});
        return pokemon && pokemon.nickname;
    }
});

