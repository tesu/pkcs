import {Template} from 'meteor/templating';

import {Chat} from '../api/chat.js';

import './chatbox.html';

Template.chatbox.helpers({
    chat() {
        return Chat.find({game: FlowRouter.getParam('_id')}, {sort: {createdAt: 1}});
    },
    username() {
        const user = Meteor.users.findOne({_id: this.user});
        if (user) return user.username;
        return null;
    },
    timestamp() {
        return ("0"+this.createdAt.getHours()).slice(-2) + ":" + ("0"+this.createdAt.getMinutes()).slice(-2) + ":" + ("0"+this.createdAt.getSeconds()).slice(-2);
    },
});


Template.chatbox.events({
    'submit .chat-box'(event) {
        event.preventDefault();

        const text = event.target.text.value;
        
        Meteor.call('chat.insert', FlowRouter.getParam('_id'), text);

        event.target.text.value = '';
    },
});


