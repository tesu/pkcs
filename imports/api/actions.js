import {Mongo} from 'meteor/mongo';
import {check} from 'meteor/check';

import {Results} from './results.js';
import {Games} from './games.js';

export const Actions = new Mongo.Collection('actions');

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

