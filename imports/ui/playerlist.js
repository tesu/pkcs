import {Template} from 'meteor/templating';

import {Games} from '../api/games.js'; 

import './player.js';

import './playerlist.html';

Template.playerlist.onCreated(function() {
    const self = this;

    this.state = new ReactiveDict();
});

Template.playerlist.helpers({
    turnOrder() {
        const instance = Template.instance();
        if (instance.state.get('order')) return instance.state.get('order');
        const game = Games.findOne(FlowRouter.getParam('_id'));
        const o = game && game.players.concat(function(){
            const o = [];
            for (let i=game.players.length;i<4;i++) o.push('');
            return o;
        }());
        if (game && game.state != 0) instance.state.set('order', o);
        return o;
    },
    game() {
        return Games.findOne(FlowRouter.getParam('_id'));
    },
});
