import {Mongo} from 'meteor/mongo';

export const Chat = new Mongo.Collection('chat');

if (Meteor.isServer) {
    Meteor.publish('chat', function chatPub(id) {
        return Chat.find({game: id});
    });
}

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
