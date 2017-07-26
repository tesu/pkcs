import {Template} from 'meteor/templating';

import {Games} from '../api/games.js'; 

import './player.js';

import './playerlist.html';

Template.playerlist.helpers({
    turnOrder() {
        const instance = Template.instance();
        const game = Games.findOne(FlowRouter.getParam('_id'));
        return game && game.players.concat(function(){
            const o = [];
            for (let i=game.players.length;i<4;i++) o.push('');
            return o;
        }());
    },
    game() {
        return Games.findOne(FlowRouter.getParam('_id'));
    },
});
