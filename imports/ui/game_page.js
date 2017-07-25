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

Template.game_page.onCreated(function() {
    const self = this;

    Meteor.subscribe('game', FlowRouter.getParam('_id'), function() {
        const game = Games.findOne(FlowRouter.getParam('_id'));
        let messages = [];
        for (let i=0;i<game.states.length;i++)
            messages = messages.concat(game.states[i].messages);
        self.state.set('queue', messages);
    });
    Meteor.subscribe('chat', FlowRouter.getParam('_id'));
    Meteor.subscribe('actions', FlowRouter.getParam('_id'));
    Meteor.subscribe('results', FlowRouter.getParam('_id'));
    Meteor.subscribe('pokemon_instances');
    Meteor.subscribe('moves');
    Meteor.subscribe('ce');
    Meteor.subscribe('cep');

    this.state = new ReactiveDict();
    if (!this.state.get('message')) this.state.set('message', 0);
    if (!this.state.get('queue')) this.state.set('queue', []);

    const handle = Games.find(FlowRouter.getParam('_id')).observeChanges({
        changed(id, game) {
            let messages = [];
            for (let i=0;i<game.states.length;i++)
                messages = messages.concat(game.states[i].messages);
            self.state.set('queue', messages);
        },
    });
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
        const instance = Template.instance();
        if (game) return game.state > 0 && Actions.find({user: Meteor.userId(), turn: game.turn, game: game._id}, {limit: 1}).count(true) == 0 && instance.state.get('message') >= instance.state.get('queue').length;
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
        if (game && game.state == 0) return game.players;
        return game && game.states[game.states.length-1].order;
    },
    text() {
        const instance = Template.instance();
        const q = instance.state.get('queue');
        const m = instance.state.get('message');
        if (m>=q.length) return 'Waiting on players...';
        return q[m];
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
        $('.category').removeClass('cool beauty cute clever tough');
        $('.category').addClass(move.category);
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
        const m = instance.state.get('message');
        const messages = instance.state.get('queue');
        while (m<messages.length) {
            instance.state.set('message', m+1);
            if (m+1>=messages.length) break;
            if (typeof messages[m+1] === 'string') break;
            const message = messages[m+1];
            switch (message.type) {
                case 'applause':
                    console.log(message.value);
            }
        }
    },
    'click #skip'(event) {
        const instance = Template.instance();
        const messages = instance.state.get('queue');
        instance.state.set('message', messages.length);
    },
    'click #back'(event) {
        const instance = Template.instance();
        const m = instance.state.get('message');
        if (m>0) {
            // for now its -2 to offset the +1 from normal click
            instance.state.set('message', m-2);
        }
    },
});

