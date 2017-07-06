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
            nState = { 
                lastMove: {},
                hearts: {},
            };
            for (let i=0; i<pState.order.length; i++) {
                const player = pState.order[i];
                const action = Actions.findOne({game: game._id, turn: game.turn, user: player});
                const move = Pokedex.moveData(action.action);
                nState.hearts[player] = move.appeal;

                if (move.effect_id != 17 && pState.lastMove && pState.lastMove[player] == move.identifier) {
                    // count how many times repeated
                    let repeats = 0;
                    for (let j=game.states.length-1;j>=0;j--) {
                        if (game.states[j].lastMove && game.states[j].lastMove[player] == move.identifier) {
                            repeats++;
                            continue;
                        }
                        break;
                    }
                    nState.hearts[player] -= 1+repeats;
                    // o += "REPEATED MOVE PENALTY OF "+(1+repeats);
                }

                switch (move.effect_id) {
                    case 1:
                        // Gives a high number of appeal points with no other effects.
                        break;
                    case 2:
                        // If the Pokémon that appealed before the user earned less than three appeal points, user earns six; if three, user earns three; if more than three, user earns none.
                        if (i == 0) break;
                        const prev = nState.hearts[pState.order[i-1]];
                        if (prev < 3) nState.hearts[player] += 3;
                        if (prev > 3) nState.hearts[player] -= 3;
                        break;
                    case 3:
                        // If the user is jammed this turn after using this move, it will receive twice as many jam points.
                        // TODO
                        break;
                    case 4:
                        // Attempts to jam the Pokémon that appealed before the user.
                        // TODO
                        break;

                    case 25:
                        // Randomly earns one, two, four, or eight points.
                        const choices = [0,1,3,7];
                        nState.hearts[player] += choices[Math.floor(Math.random() * choices.length)];
                        break;
                    case 26:
                        // If user appeals first this turn, earns one point; if second, two points; if third, four points; if last, six points.
                        if (i == 1) nState.hearts[player]++; // second
                        if (i == 2) nState.hearts[player]+=3; // third
                        if (i == 3) nState.hearts[player]+=5; // fourth
                        break;
                    case 27:
                        // If user appeals first this turn, earns six points instead of two.
                        if (i == 0) nState.hearts[player]+=4;
                        break;
                    case 28:
                        // If user appeals last this turn, earns six points instead of two.
                        if (i == 3) nState.hearts[player]+=4;
                        break;
                    
                    
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

