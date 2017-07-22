import {Mongo} from 'meteor/mongo';
import {check} from 'meteor/check';

import {Game} from './game.js';
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
            states: [],
        });
    },
    'game.join'(id, pokemon) {
        if (!Meteor.userId()) throw new Meteor.Error('not-authorized');
        const p = {};
        p['pokemon.'+Meteor.userId()] = pokemon;

        Games.update(id, {
            $push: {players: Meteor.userId()},
            $set: p,
        });
    },
    'game.start'(id) {
        if (!Meteor.userId()) throw new Meteor.Error('not-authorized');
        if (Meteor.isServer) {
            const game = Games.findOne(id);
            const state = Game.init(game);

            Games.update(id, {
                $set: {state: 1, turn: 0},
                $push: {states: state}
            });
        }
    },
    'game.delete'(id) {
        if (!Meteor.userId()) throw new Meteor.Error('not-authorized');
        const game = Games.findOne(id);

        Games.remove(id);
    },
});

