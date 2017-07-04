import {Template} from 'meteor/templating';

import {Games} from '../api/games.js';
import {Actions} from '../api/actions.js';
import {Results} from '../api/results.js';
import {Pokemon} from '../api/pokemon.js';
import {Pokedex} from '../api/pokedex.js';

import './player.js';
import './chatbox.js';
import './game_page.html';

let sub = Array();
Template.game_page.onCreated(function bodyOnCreated() {
    sub.push(Meteor.subscribe('game', FlowRouter.getParam('_id')));
    sub.push(Meteor.subscribe('chat', FlowRouter.getParam('_id')));
    sub.push(Meteor.subscribe('actions', FlowRouter.getParam('_id')));
    sub.push(Meteor.subscribe('results', FlowRouter.getParam('_id')));
    sub.push(Meteor.subscribe('pokemon_instances'));
    sub.push(Meteor.subscribe('moves'));
});

Template.game_page.onDestroyed(function bodyOnDestroyed() {
    for (let i = 0; i < sub.length; i++) {
        sub[i].stop();
    }
    sub.length = 0;
});

Template.game_page.helpers({
    name(s) {
        return s.split('-').map(function(str) {
            return str.charAt(0).toUpperCase()+str.slice(1);
        }).join(' ');
    },
    game() {
        return Games.findOne({_id: FlowRouter.getParam('_id')});
    },
    isHost() {
        const game = Games.findOne({_id: FlowRouter.getParam('_id')});
        return game && game.host == Meteor.userId();
    },
    isInGame() {
        const game = Games.findOne({_id: FlowRouter.getParam('_id')});
        return game && game.players.indexOf(Meteor.userId()) > -1;
    },
    canJoinGame() {
        const game = Games.findOne({_id: FlowRouter.getParam('_id')});
        return game && Meteor.userId() && game.players.length < 4 && game.players.indexOf(Meteor.userId()) == -1;
    },
    stateIsPreparation() {
        const game = Games.findOne({_id: FlowRouter.getParam('_id')});
        if (game) return game.state == 0;
        return null;
    },
    messages() {
        const game = Games.findOne({_id: FlowRouter.getParam('_id')});
        return game && game.messages;
    },
    canMove() {
        const game = Games.findOne({_id: FlowRouter.getParam('_id'), players: Meteor.userId()});
        if (game) return game.state > 0 && Actions.find({user: Meteor.userId(), turn: game.turn, game: game._id}, {limit: 1}).count(true) == 0;
        return null;
    },
    moves() {
        const game = Games.findOne({_id: FlowRouter.getParam('_id')});
        if (!game) return;
        const p = Pokemon.findOne({_id: game.pokemon[Meteor.userId()]});
        return p && p.moves;
    },
    results() {
        return Results.find({game:FlowRouter.getParam('_id')});
    },
    actions() {
        return Actions.find({game:FlowRouter.getParam('_id')});
    },
    emptySlots() {
        const game = Games.findOne({_id: FlowRouter.getParam('_id')});
        if (game) {
            var o = Array();
            for (var i = 0; i < 4-game.players.length; i++) {
                o[i] = '';
            }
            return o
        }
        return null
    },

});

Template.game_page.events({
    'submit .join-game'(event) {
        event.preventDefault();

        Meteor.call('game.join', FlowRouter.getParam('_id'));
    },
    'submit .start-game'(event) {
        event.preventDefault();

        Meteor.call('game.start', FlowRouter.getParam('_id'));
    },
    'submit .delete-game'(event) {
        event.preventDefault();

        Meteor.call('game.delete', FlowRouter.getParam('_id'));
    },
    'click .action'(event) {
        event.preventDefault();
        const game = Games.findOne({_id: FlowRouter.getParam('_id')});
        const action = event.target.value;

        Meteor.call('actions.insert', game, action);
    },
});

