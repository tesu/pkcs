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
            o = ''
            pState = game.states[game.turn];
            for (let i=0; i<pState.order.length; i++) {
                const action = Actions.findOne({game: game._id, turn: game.turn, user: pState.order[i]});
                console.log(action)

                o += action.user + ' used ' + action.action + '. ';
                o += Pokedex.moveData(action.action);
                o += '\n';
            }

            Games.update({_id: game._id}, {
                $inc: {turn: 1},
                $push: {
                    messages: o,
                    states: pState,
                },
            });
        }
   },
});

