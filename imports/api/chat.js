import {Mongo} from 'meteor/mongo';

export const Chat = new Mongo.Collection('chat');

Meteor.methods({
    'chat.insert'(id, text) {
        if (!Meteor.userId()) throw new Meteor.Error('not-authorized');

        Chat.insert({
            text,
            createdAt: new Date(),
            user: Meteor.userId(),
            game: id,
        });
    },
});
