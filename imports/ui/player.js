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
    nickname() {
        const pokemon = Pokemon.findOne({_id: this.game.pokemon[this.p]});
        console.log(pokemon)
        return pokemon && pokemon.nickname;
    }
});

