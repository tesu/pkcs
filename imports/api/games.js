import {Mongo} from 'meteor/mongo';
import {check} from 'meteor/check';

import {Pokemon} from './pokemon.js';

export const Games = new Mongo.Collection('games');

if (Meteor.isServer) {
    Meteor.publish('games', function gamesPub() {
        return Games.find({});
    });
    Meteor.publish('game', function gamePub(id) {
        return Games.find(id);
    });
}

Meteor.methods({
    'games.insert'(r, c, pid) {
        if (!Meteor.userId()) throw new Meteor.Error('not-authorized');

        p = {};
        p[Meteor.userId()] = pid;
        Games.insert({
            createdAt: new Date(),
            host: Meteor.userId(),
            players: [Meteor.userId()],
            max: 4,
            min: 1,
            rank: r,
            category: c,
            pokemon: p,
            state: 0,
        });
    },
    'game.join'(id) {
        if (!Meteor.userId()) throw new Meteor.Error('not-authorized');

        Games.update(id, {
            $push: {players: Meteor.userId()}
        });
    },
    'game.start'(id) {
        if (!Meteor.userId()) throw new Meteor.Error('not-authorized');

        const game = Games.findOne(id);

        let scores = {};
        for (let i=0; i<game.players.length; i++) {
            let player = game.players[i];
            let pokemon = Pokemon.findOne(game.pokemon[player]);
            console.log(pokemon)
            scores[player] = 0;
            for (category in pokemon.condition) {
                if (category == game.category) {
                    scores[player] += parseFloat(pokemon.condition[category]);
                } else {
                    scores[player] += parseFloat(pokemon.condition[category] / 2);
                }
            }
        }

        const order = Object.keys(scores).sort(function(a,b){return scores[a]-scores[b];});
        
        let message = '';
        
        for (let i=0; i<order.length; i++) {
            message += order[i] + ' is #' + (i+1) + ' with a score of ' + scores[order[i]] + '.\n'
        }

        Games.update(id, {
            $set: {state: 1, turn: 0},
            $push: { messages: message },
        });
    },
    'game.delete'(id) {
        if (!Meteor.userId()) throw new Meteor.Error('not-authorized');

        Games.remove(id);
    },
});

