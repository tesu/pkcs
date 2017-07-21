import {Template} from 'meteor/templating';
import {ReactiveDict} from 'meteor/reactive-dict';
import {Tracker} from 'meteor/tracker';

import {Games} from '../api/games.js';
import {Actions} from '../api/actions.js';
import {Pokemon} from '../api/pokemon.js';
import {Pokedex} from '../api/pokedex.js';

import './player.js';
import './chatbox.js';
import './game_page.html';

let sub = Array();
Template.game_page.onCreated(function() {
    sub.push(Meteor.subscribe('game', FlowRouter.getParam('_id')));
    sub.push(Meteor.subscribe('chat', FlowRouter.getParam('_id')));
    sub.push(Meteor.subscribe('actions', FlowRouter.getParam('_id')));
    sub.push(Meteor.subscribe('results', FlowRouter.getParam('_id')));
    sub.push(Meteor.subscribe('pokemon_instances'));
    sub.push(Meteor.subscribe('moves'));
    sub.push(Meteor.subscribe('ce'));
    sub.push(Meteor.subscribe('cep'));

    this.state = new ReactiveDict();
    this.state.set('message', 0);
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
        if (game.state == 0) return game.players;
        return game.states[game.states.length-1].order;
    },
    text() {
        const instance = Template.instance();
        const game = Games.findOne(FlowRouter.getParam('_id'));
        let messages = [];
        for (let i=0;i<game.states.length;i++)
            messages = messages.concat(game.states[i].messages);
        return messages[instance.state.get('message')];
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
    'mouseenter .action button'(event) {
        const action = event.target.value;
        const move = Pokedex.moveData(action);
        $('.category').text(move.category);
        let appeal = "Appeal ";
        for (let i=0;i<move.appeal;i++) appeal += '♥';
        for (let i=move.appeal;i<8;i++) appeal += '♡';
        let jam = "Jam ";
        for (let i=0;i<move.jam;i++) jam += '♥';
        for (let i=move.jam;i<8;i++) jam += '♡';
        $('.appeal').text(appeal);
        $('.jam').text(jam);
        $('.flavor').text(move.flavor);
    },
    'click #dialog'(event) {
        const instance = Template.instance();
        instance.state.set('message', instance.state.get('message')+1);
    },
});

