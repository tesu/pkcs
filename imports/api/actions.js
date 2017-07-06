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

function shuffle(array) {
  var currentIndex = array.length, temporaryValue, randomIndex;
  while (0 !== currentIndex) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }
  return array;
}

function jam(state, player, amount) {
    if (state.flags[player].block) {
        state.flags[player].block = false;
        return;
    }
    if (state.flags[player].superblock) {
        return;
    }
    if (state.flags[player].skipped) {
        return;
    }
    state.hearts[player] -= amount;
    if (state.flags[player].doublejam) state.hearts[player] -= amount;
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
                score: {},
                lastMove: {},
                hearts: {},
            };
            for (let i=0; i<pState.order.length; i++) {
                const player = pState.order[i];
                if (!nState.flags[player]) nState.flags[player] = {};

                if (nState.flags[player].stunned) {
                    nState.flags[player].skipped = true;
                    nState.flags[player].stunned = false;
                    nState.hearts[player] = 0;
                    continue;
                }
                if (nState.flags[player].dead) {
                    nState.flags[player].skipped = true;
                    nState.hearts[player] = 0;
                    continue;
                }
                if (nState.flags[player].nervous) {
                    nState.flags[player].skipped = true;
                    nState.flags[player].nervous = false;
                    nState.hearts[player] = 0;
                    continue;
                }

                const action = Actions.findOne({game: game._id, turn: game.turn, user: player});
                const move = Pokedex.moveData(action.action);
                nState.hearts[player] = move.appeal;
                const compatibility = categoryCompatibility(move.category, game.category);
                // nState.hearts[player] += compatibility;
                if (!nState.noApplause) {
                    if (move.effect_id == 13) {
                        nState.excitement++;
                    } else {
                        nState.excitement += compatibility;
                    }
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
                    if (!nState.noApplause && (compatibility == 1 || move.effect_id == 13)) nState.excitement -= 1; // disappointed judge
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
                        nState.flags[player].doublejam = true;
                        break;
                    case 4:
                        // Attempts to jam the Pokémon that appealed before the user.
                        if (i != 0) jam(nState, pState.order[i-1], move.jam);
                        break;
                    case 5:
                        // Attempts to jam all Pokémon that have appealed this turn.
                        for (let j=0;j<i;j++)
                            jam(nState, pState.order[i-1], move.jam);
                        break;
                    case 6:
                        // Attempts to jam the other Pokémon. The user cannot make an appeal on the next turn, but it cannot be jammed either.
                        for (let j=0;j<i;j++)
                            jam(nState, pState.order[j], move.jam);
                        nState.flags[player].stunned = true;
                        break;
                    case 7:
                        // User cannot make any more appeals for the remainder of the contest.
                        nState.flags[player].dead = true;
                        break;
                    case 8:
                        // Attempts to jam all Pokémon that have appealed this turn.
                        for (let j=0;j<i;j++)
                            jam(nState, pState.order[j], move.jam);
                        break;
                    case 9:
                        // Attempts to jam the Pokémon that appealed before the user.
                        if (i != 0) jam(nState, pState.order[i-1], move.jam);
                        break;
                    case 10:
                        // Attempts to jam all Pokémon that have appealed this turn. If a Pokémon is in combo standby status, it is jammed 5 points instead of 1.
                        for (let j=0;j<i;j++) {
                            if (nState.flags[pState.order[j]].standby) {
                                jam(nState, pState.order[j], 5);
                            } else {
                                jam(nState, pState.order[j], move.jam);
                            }
                        }
                        break;
                    case 11:
                        // If the Applause meter is empty or at one, earns one point; if two, earns three points; if three, earns four points; if four, earns six points.
                        if (nState.excitement == 2) nState.hearts[player]+=2;
                        if (nState.excitement == 3) nState.hearts[player]+=3;
                        if (nState.excitement == 4) nState.hearts[player]+=5;
                        break;
                    case 12:
                        // If the last Pokémon's appeal is the same type as this move, user earns six points instead of two.
                        if (i==0) break;
                        if (nState.lastMove[pState.order[i-1]].category == move.category) {
                            nState.hearts[player]+=4;
                        }
                        break;
                    case 13:
                        // Always adds a point to the applause meter, regardless of whether the move matches the contest, and can likewise gain the applause bonus.
                        break;
                    case 14:
                        // Attempts to jam all Pokémon that have appealed this turn for half their appeal points (minimum 1).
                        for (let j=0;j<i;j++) {
                            jam(nState, pState.order[j], Math.max(1, nState.hearts[pState.order[j]]/2));
                        }
                        break;
                    case 15:
                        // Prevents jamming for the rest of this turn.
                        nState.flags[player].superblock = true;
                        break;
                    case 16:
                        // Prevents the next jam on this turn.
                        nState.flags[player].block = true;
                        break;
                    case 17:
                        // Repeated use does not incur a penalty.
                        break;
                    case 18:
                        // Attempts to make all following Pokémon nervous (and thus unable to appeal).
                        for (let j=i+1;j<pState.order.length;j++) {
                            const stars = nState.flags[pState.order[j]].stars;
                            if (!stars || stars == 0) nState.flags[pState.order[j]].nervous = true;
                        }
                        break;
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
                        break;
                    case 21:
                        // Shuffles the next turn's turn order.
                        nState.shuffle = true;
                        break;
                    case 22:
                        // Cancels combo standby status for all Pokémon that have appealed this turn.
                        for (let j=0;j<i;j++) {
                            nState.flags[pState.order[j]].standby = false;
                        }
                        break;
                    case 23:
                        // Attempts to jam all Pokémon that have appealed this turn. If a Pokémon used the same type move as this one, it is jammed for 4 points instead of 1.
                        for (let j=0;j<i;j++) {
                            if (!nState.flags[pState.order[j]].skipped && 
                                nState.lastMove[pState.order[j]].category == move.category) {
                                jam(nState, pState.order[j], 4);
                            } else {
                                jam(nState, pState.order[j], move.jam);
                            }
                        }
                        break;
                    case 24:
                        // Prevents the Applause Meter from rising for the rest of the turn.
                        nState.noApplause = true;
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
                    case 29:
                        // If user has no stars, earns one point; if one, three points; if two, five points; if three, seven points. This does not include the appeal point bonus the stars give.
                        if (!nState.flags[player].stars || nState.flags[player].stars == 0) break;
                        if (nState.flags[player].stars == 1) nState.hearts[player]+=2;
                        if (nState.flags[player].stars == 2) nState.hearts[player]+=4;
                        if (nState.flags[player].stars == 3) nState.hearts[player]+=6;
                        break;
                    case 30:
                        // User will go first next turn.
                        nState.flags[player].goFirst = true;
                        break;
                    case 31:
                        // User will go last next turn.
                        nState.flags[player].goLast = true;
                        break;
                    case 32:
                        // User gains one star.
                        if (!nState.flags[player].stars) nState.flags[player].stars = 0;
                        if (nState.flags[player].stars < 3) nState.flags[player].stars++;
                        break;
                    case 33:
                        // Removes all stars from all Pokémon that have appealed this turn.
                        for (let j=0;j<i;j++) {
                            if (!nState.flags[pState.order[j]].skipped)
                                nState.flags[pState.order[j]].stars = 0;
                        }
                        break;
                }
                o += action.user + ' used ' + move.identifier + '. ';
                o += '\n';

                nState.lastMove[player] = action.action;
            }

            for (let i=0; i<pState.order.length; i++) {
                const player = pState.order[i];
                if (nState.flags[player].goFirst) nState.hearts[player]+=99;
                if (nState.flags[player].goLast) nState.hearts[player]-=99;
            }

            let order;
            if (nState.shuffle) {
                order = shuffle(pState.order); 
            } else {
                order = pState.order.sort(function(a,b){return nState.hearts[a]-nState.hearts[b];});
            }

            nState.order = order;

            for (let i=0; i<pState.order.length; i++) {
                const player = pState.order[i];
                if (nState.flags[player].goFirst) nState.hearts[player]-=99;
                if (nState.flags[player].goLast) nState.hearts[player]+=99;
                
                nState.score[player] = pState.score[player] + nState.hearts[player]
            }

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

