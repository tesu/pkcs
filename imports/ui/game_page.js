import {Template} from 'meteor/templating';

import {Games} from '../api/games.js';
import {Actions} from '../api/actions.js';
import {Results} from '../api/results.js';

import './player.js';
import './chatbox.js';
import './game_page.html';

Template.game_page.helpers({
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
    canMove() {
        const game = Games.findOne({_id: FlowRouter.getParam('_id')});
        if (game) return game.state > 0 && Actions.find({user: Meteor.userId(), turn: game.turn, game: game._id}, {limit: 1}).count(true) == 0;
        return null;
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

        Games.update({_id: FlowRouter.getParam('_id')}, {
            $push: {players: Meteor.userId()}
        });
    },
    'submit .start-game'(event) {
        event.preventDefault();

        Games.upsert({_id: FlowRouter.getParam('_id')}, {
            $set: {state: 1, turn: 0}
        });
    },
    'submit .delete-game'(event) {
        event.preventDefault();

        Games.remove({_id: FlowRouter.getParam('_id')})
    },
    'click .action'(event) {
        event.preventDefault();
        const game = Games.findOne({_id: FlowRouter.getParam('_id')});
        const action = event.target.value;

        Actions.insert({
            user: Meteor.userId(),
            turn: game.turn,
            game: game._id,
            createdAt: new Date(),
            action: action,
        });

        if (Actions.find({game: game._id, turn: game.turn}).count() >= game.players.length) {
            actions = Actions.find({game: game._id, turn: game.turn}).fetch();

            function x(xd) {
                switch (xd) {
                    case "rock":
                        return 0;
                    case "paper":
                        return 1;
                    case "scissors":
                        return 2;
                }
            }
            o = "Turn " + game.turn + ": ";
            for (let i=0; i<actions.length; i++) {
                let w = l = 0;
                for (let j=0; j<actions.length; j++) {
                    if (i==j) continue;

                    const r = (x(actions[i].action)*2+x(actions[j].action))%3;
                    if (r == 1) l++;
                    if (r == 2) w++;
                }
                o += actions[i].user + " won " + w + " games and lost " + l + " games. ";
            }
            console.log(o)

            Results.insert({
                game: game._id,
                turn: game.turn,
                result: o,
            });

            Games.update({_id: game._id}, {
                $inc: {turn: 1},
            });
        }
    },
});

