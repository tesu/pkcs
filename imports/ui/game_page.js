import {Template} from 'meteor/templating';

import {Games} from '../api/games.js';
import {Actions} from '../api/actions.js';
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
    sub.push(Meteor.subscribe('ce'));
    sub.push(Meteor.subscribe('cep'));
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
        return Games.findOne(FlowRouter.getParam('_id'));
    },
    pokemon() {
        return Pokemon.find({owner: Meteor.userId()});
    },
    isHost() {
        const game = Games.findOne(FlowRouter.getParam('_id'));
        return game && game.host == Meteor.userId();
    },
    isInGame() {
        const game = Games.findOne(FlowRouter.getParam('_id'));
        return game && game.players.indexOf(Meteor.userId()) > -1;
    },
    canJoinGame() {
        const game = Games.findOne(FlowRouter.getParam('_id'));
        return game && Meteor.userId() && game.players.length < 4 && game.players.indexOf(Meteor.userId()) == -1;
    },
    stateIsPreparation() {
        const game = Games.findOne(FlowRouter.getParam('_id'));
        if (game) return game.state == 0;
        return null;
    },
    messages() {
        const game = Games.findOne(FlowRouter.getParam('_id'));
        return game && game.states[game.states.length-1].messages;
    },
    canMove() {
        const game = Games.findOne({_id: FlowRouter.getParam('_id'), players: Meteor.userId()});
        if (game) return game.state > 0 && Actions.find({user: Meteor.userId(), turn: game.turn, game: game._id}, {limit: 1}).count(true) == 0;
        return null;
    },
    moves() {
        const game = Games.findOne(FlowRouter.getParam('_id'));
        if (!game) return;
        const p = Pokemon.findOne({_id: game.pokemon[Meteor.userId()]});
        return p && p.moves;
    },
    actions() {
        return Actions.find({game:FlowRouter.getParam('_id')});
    },
    emptySlots() {
        const game = Games.findOne(FlowRouter.getParam('_id'));
        if (game) {
            var o = Array();
            for (var i = 0; i < 4-game.players.length; i++) {
                o[i] = '';
            }
            return o
        }
        return null
    },
    turnOrder() {
        const game = Games.findOne(FlowRouter.getParam('_id'));
        return game.states[game.states.length-1].order;
    },
});

Template.game_page.events({
    'submit .join-game'(event) {
        event.preventDefault();
        const pokemon = event.target.pokemon.value;

        Meteor.call('game.join', FlowRouter.getParam('_id'), pokemon);
    },
    'submit .start-game'(event) {
        event.preventDefault();

        Meteor.call('game.start', FlowRouter.getParam('_id'));
    },
    'submit .delete-game'(event) {
        event.preventDefault();

        Meteor.call('game.delete', FlowRouter.getParam('_id'));
    },
    'click .action button'(event) {
        event.preventDefault();
        const action = event.target.value;
        Meteor.call('actions.insert', FlowRouter.getParam('_id'), action);
    },
});

