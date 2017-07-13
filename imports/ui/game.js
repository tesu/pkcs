import {Template} from 'meteor/templating';

import './game.html';

function cap(s) {
    if (s.length < 1) return '';
    return s[0].toUpperCase() + s.slice(1);
}
Template.game.helpers({
    playerCount() {
        return this.players.length || 0;
    },
    host() {
        const user = Meteor.users.findOne({_id: this.host});
        if (user) return user.username;
        return null
    },
    blurb() {
        const user = Meteor.users.findOne({_id: this.host});
        if (!user) return null;
        return cap(this.rank) + ' ' + cap(this.category) + ' contest hosted by ' + user.username
    },
});

