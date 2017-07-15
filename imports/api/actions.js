import {Mongo} from 'meteor/mongo';
import {check} from 'meteor/check';

import {Games} from './games.js';
import {Game} from './game.js';

export const Actions = new Mongo.Collection('actions');

if (Meteor.isServer) {
    Meteor.publish('actions', function actionsPub(id) {
        return Actions.find({game: id});
    });
}

Meteor.methods({
    'actions.insert'(gid, action) {
        if (!Meteor.userId()) throw new Meteor.Error('not-authorized');
        const game = Games.findOne(gid);

        Actions.insert({
            user: Meteor.userId(),
            turn: game.turn,
            game: game._id,
            createdAt: new Date(),
            action: action,
        });

        if (Actions.find({game: game._id, turn: game.turn}).count() >= game.players.length) {
            // process turn
            if (Meteor.isServer) {
                const nState = Game.process(game); 
                Games.update({_id: game._id}, {
                    $inc: {turn: 1},
                    $push: {
                        states: nState,
                    },
                });
            }
        }
   },
});

