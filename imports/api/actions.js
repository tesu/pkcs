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

function categoryToId(c) {
    switch (c) {
        case 'cool':
            return 1;
        case 'beauty':
            return 2;
        case 'cute':
            return 3;
        case 'smart':
            return 4;
        case 'tough':
            return 5;
    }
}

function categoryCompatibility(c1, c2) {
    if (c1 == c2) return 1;
    const distance = (categoryToId(c1)+5-categoryToId(c2))%5
    if (distance == 1 || distance == 4) return 0;
    return -1;
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
                excitement: pState.excitement || 0,
                flags: pState.flags || {},
                lastMove: {},
                hearts: {},
            };
            for (let i=0; i<pState.order.length; i++) {
                const player = pState.order[i];
                const action = Actions.findOne({game: game._id, turn: game.turn, user: player});
                const move = Pokedex.moveData(action.action);
                if (!nState.flags[player]) nState.flags[player] = {};
                nState.hearts[player] = move.appeal;
                const compatibility = categoryCompatibility(move.category, game.category);
                // nState.hearts[player] += compatibility;
                if (move.effect_id == 13) {
                    nState.excitement++;
                } else {
                    nState.excitement += compatibility;
                }

                if (nState.flags[player].stars) {
                    nState.hearts[player]+=nState.flags[player].stars;
                }

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
                    if (compatibility == 1 || move.effect_id == 13) nState.excitement -= 1; // disappointed judge
                }
                if (nState.excitement < 0) nState.excitement = 0;
                if (nState.excitement >= 5) {
                    // full excitement meter
                    nState.hearts[player] += 6;
                    nState.excitement = 0;
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

                    case 11:
                        // If the Applause meter is empty or at one, earns one point; if two, earns three points; if three, earns four points; if four, earns six points.
                        if (nState.excitement == 2) nState.hearts[player]+=2;
                        if (nState.excitement == 3) nState.hearts[player]+=3;
                        if (nState.excitement == 4) nState.hearts[player]+=5;
                        break;
                    case 12:
                        // If the last Pokémon's appeal is the same type as this move, user earns six points instead of two.
                        if (1==0) break;
                        if (nState.lastMove[pState.order[i-1]].category == move.category) {
                            nState.hearts[player]+=4;
                        }
                    case 19:
                        // User earns appeal points equal to the points the previous Pokémon earned plus one.
                        if (i==0) break;
                        nState.hearts[player]+=nState.hearts[pState.order[i-1]];
                        break;
                    case 20:
                        // User earns appeal points equal to half the points ALL the previous Pokémon earned plus one.
                        for (let j=0;j<i;j++) {
                            // going to assume we don't accumulate negative points
                            if (nState.hearts[pState.order[j]] > 0) {
                                nState.hearts[player]+=nState.hearts[pState.order[j]]; 
                            }
                        }
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

                    case 32:
                        // User gains one star.
                        if (!nState.flags[player].stars) nState.flags[player].stars = 0;
                        if (nState.flags[player].stars < 3) nState.flags[player].stars++;
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

