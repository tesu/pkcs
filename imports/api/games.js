import {Mongo} from 'meteor/mongo';
import {check} from 'meteor/check';

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

        Games.upsert(id, {
            $set: {state: 1, turn: 0}
        });
    },
    'game.delete'(id) {
        if (!Meteor.userId()) throw new Meteor.Error('not-authorized');

        Games.remove(id);
    },
});

