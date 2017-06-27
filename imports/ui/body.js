import {Meteor} from 'meteor/meteor';
import {Template} from 'meteor/templating';

import {Games} from '../api/games.js';

import './game.js';
import './game_page.js';
import './body.html';

Template.index.helpers({
    games() {
        return Games.find({});
    },
});

Template.base.events({
    'submit .new-lobby'(event) {
        event.preventDefault();

        Games.insert({
            createdAt: new Date(),
            host: Meteor.userId(),
            players: [Meteor.userId()],
            state: 0,
        });
    },
});

