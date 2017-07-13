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
    'games.insert'(n, r, c, pid) {
        if (!Meteor.userId()) throw new Meteor.Error('not-authorized');

        p = {};
        p[Meteor.userId()] = pid;
        Games.insert({
            name: n,
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
            message += order[i] + ' received ' + scoreToHearts(game.rank, scores[order[i]]) + ' hearts and is #' + (i+1) + '.\n'
        }

        const s = {
            order: order,
            score: scores,
        }
        Games.update(id, {
            $set: {state: 1, turn: 0},
            $push: {messages: message},
            $push: {states: s}
        });
    },
    'game.delete'(id) {
        if (!Meteor.userId()) throw new Meteor.Error('not-authorized');

        Games.remove(id);
    },
});

function scoreToHearts(rank, score) {
    switch (rank) {
        case 'normal':
            if (score >= 81) return 8;
            if (score >= 71) return 7;
            if (score >= 61) return 6;
            if (score >= 51) return 5;
            if (score >= 41) return 4;
            if (score >= 31) return 3;
            if (score >= 21) return 2;
            if (score >= 11) return 1;
            return 0;
        case 'super':
            if (score >= 231) return 8;
            if (score >= 211) return 7;
            if (score >= 191) return 6;
            if (score >= 171) return 5;
            if (score >= 151) return 4;
            if (score >= 131) return 3;
            if (score >= 111) return 2;
            if (score >= 91) return 1;
            return 0;
        case 'hyper':
            if (score >= 381) return 8;
            if (score >= 351) return 7;
            if (score >= 321) return 6;
            if (score >= 291) return 5;
            if (score >= 261) return 4;
            if (score >= 231) return 3;
            if (score >= 201) return 2;
            if (score >= 171) return 1;
            return 0;
        case 'master':
            if (score >= 601) return 8;
            if (score >= 561) return 7;
            if (score >= 521) return 6;
            if (score >= 481) return 5;
            if (score >= 441) return 4;
            if (score >= 401) return 3;
            if (score >= 361) return 2;
            if (score >= 321) return 1;
            return 0;
        case 'link':
            if (score >= 601) return 8;
            if (score >= 551) return 7;
            if (score >= 501) return 6;
            if (score >= 451) return 5;
            if (score >= 401) return 4;
            if (score >= 301) return 3;
            if (score >= 201) return 2;
            if (score >= 101) return 1;
            return 0;
    }
}
