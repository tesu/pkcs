import {Mongo} from 'meteor/mongo';
import {check} from 'meteor/check';

export const Games = new Mongo.Collection('games');

Meteor.methods({
    'games.insert'() {
        if (!Meteor.userId()) throw new Meteor.Error('not-authorized');

        Games.insert({
            createdAt: new Date(),
            host: Meteor.userId(),
            players: [Meteor.userId()],
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
