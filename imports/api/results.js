import {Mongo} from 'meteor/mongo';

export const Results = new Mongo.Collection('results');

if (Meteor.isServer) {
    Meteor.publish('results', function resultsPub(id) {
        return Results.find({game: id});
    });
}

