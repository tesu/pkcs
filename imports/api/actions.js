import {Mongo} from 'meteor/mongo';
import {check} from 'meteor/check';

import {Games} from './games.js';
import {Pokedex} from './pokedex.js';

export const Actions = new Mongo.Collection('actions');

if (Meteor.isServer) {
    Meteor.publish('actions', function actionsPub(id) {
        return Actions.find({game: id});
    });
}

Meteor.methods({
    'actions.insert'(game, action) {
        if (!Meteor.userId()) throw new Meteor.Error('not-authorized');

        Actions.insert({
            user: Meteor.userId(),
            turn: game.turn,
            game: game._id,
            createdAt: new Date(),
            action: action,
        });

        if (Actions.find({game: game._id, turn: game.turn}).count() >= game.players.length) {
            actions = Actions.find({game: game._id, turn: game.turn}).fetch();

            o = ''
            for (let i=0; i<actions.length; i++) {
                const m = actions[i].action;
                o += actions[i].user + ' used ' + m + '. ';
                o += Pokedex.moveData(m);
                o += '\n';
            }

            Games.update({_id: game._id}, {
                $inc: {turn: 1},
                $push: {messages: o},
            });
        }
   },
});

