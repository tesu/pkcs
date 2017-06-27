import {Template} from 'meteor/templating';

import './player.html'

Template.player.helpers({
    user() {
        const user = Meteor.users.findOne({_id: this.valueOf()});
        if (user) return user.username;
        return null;
    },
});

