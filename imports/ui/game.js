import {Template} from 'meteor/templating';

import './game.html';

Template.game.helpers({
    playerCount() {
        return this.players.length || 0;
    },
    host() {
        const user = Meteor.users.findOne({_id: this.host});
        if (user) return user.username;
        return null
    },
});

