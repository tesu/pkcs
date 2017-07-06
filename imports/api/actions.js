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
            o = 'Turn ' + game.turn + '\n';
            pState = game.states[game.turn];
            nState = { lastMove: {} };
            for (let i=0; i<pState.order.length; i++) {
                const player = pState.order[i];
                const action = Actions.findOne({game: game._id, turn: game.turn, user: player});
                const move = Pokedex.moveData(action.action);

                if (pState.lastMove && pState.lastMove[player] == move.identifier) {

                    o += "REPEATED MOVE"
                }
                o += action.user + ' used ' + move.identifier + '. ';
                o += '\n';

                nState.lastMove[player] = action.action;
            }
            nState.order = pState.order;
            nState.score = pState.score;

            Games.update({_id: game._id}, {
                $inc: {turn: 1},
                $push: {
                    messages: o,
                    states: nState,
                },
            });
        }
   },
});

