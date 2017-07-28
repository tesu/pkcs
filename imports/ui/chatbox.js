import {Template} from 'meteor/templating';
import {ReactiveDict} from 'meteor/reactive-dict';

import {Chat} from '../api/chat.js';

import './chatbox.html';

Template.chatbox.onCreated(function() {
    this.state = new ReactiveDict();
});

Template.chatbox.helpers({
    chatHidden() {
        return Template.instance().state.get('hide-chat');
    },
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
    'click .toggle-chat-box'(event) {
        const instance = Template.instance();
        instance.state.set('hide-chat', !instance.state.get('hide-chat'));
    },
    'submit .chat-box'(event) {
        event.preventDefault();

        const text = event.target.text.value;
        
        Meteor.call('chat.insert', FlowRouter.getParam('_id'), text);

        event.target.text.value = '';
    },
});

