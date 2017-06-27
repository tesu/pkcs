import {Meteor} from 'meteor/meteor';
import {Template} from 'meteor/templating';

import {Games} from '../api/games.js';

import './game.js';
import './game_page.js';
import './body.html';

let sub;

Template.index.onCreated(function indexOnCreated() {
    sub = Meteor.subscribe('games');
});

Template.index.helpers({
    games() {
        return Games.find({});
    },
});

Template.index.onDestroyed(function indexOnDestroyed() {
    sub.stop();
});

Template.base.events({
    'submit .new-game'(event) {
        event.preventDefault();

        Meteor.call('games.insert');
    },
});

