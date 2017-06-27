import {Template} from 'meteor/templating';

import {Chat} from '../api/chat.js';

import './chatbox.html';

Template.chatbox.helpers({
    chat() {
        return Chat.find({game: FlowRouter.getParam('_id')}, {sort: {createdAt: -1}});
    },
    username() {
        const user = Meteor.users.findOne({_id: this.user});
        if (user) return user.username;
        return null;
    },
});


Template.chatbox.events({
    'submit .chat-box'(event) {
        event.preventDefault();

        const text = event.target.text.value;
        
        Chat.insert({
            text,
            createdAt: new Date(),
            user: Meteor.userId(),
            game: FlowRouter.getParam('_id'),
        });

        event.target.text.value = '';
    },
});


