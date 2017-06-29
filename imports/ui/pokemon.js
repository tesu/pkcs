import {Template} from 'meteor/templating';
import {ReactiveDict} from 'meteor/reactive-dict';

import {Pokedex} from '../api/pokedex.js';
import {Pokemon} from '../api/pokemon.js';

import './pokemon.html';

Template.pokemon.onCreated(function() {
    Meteor.subscribe('pokemon_instances');

    this.state = new ReactiveDict();
});

Template.pokemon.helpers({
    myPokemon() {
        return Pokemon.find({});
    },
});

Template.pokemon_embed.onCreated(function() {
    Meteor.subscribe('pokemon');
    Meteor.subscribe('moves');

    this.state = new ReactiveDict();
    if (this.data.id) {
        p = Pokemon.findOne(this.data.id);
        console.log(p);
        this.state.set('pokemon', p.identifier);
    } else {
        this.state.set('pokemon', 'bulbasaur');
    }
});

Template.pokemon_embed.helpers({
    name() {
        return this.identifier.split('-').map(function(str) {
            return str.charAt(0).toUpperCase()+str.slice(1);
        }).join(' ');
    },
    pokemonList() {
        return Pokedex._collections['pokemon'].find({}, {
            fields: {identifier: 1}});
    },
    moveList() {
        return Pokedex.validMoves(Template.instance().state.get('pokemon'));
    },
});

Template.pokemon_embed.events({
    'change .pokemon'(event, instance) {
        instance.state.set('pokemon', event.target.value);
    },
    'submit'(event) {
        event.preventDefault();
        const f = event.target;

        if (event.target.id == "new") {
            p = {
                nickname: f.nickname.value,
                owner: Meteor.userId(),
                identifier: f.pokemon.value,
                moves: [
                    f.move1.value,
                    f.move2.value,
                    f.move3.value,
                    f.move4.value,
                ],
                condition: {
                    cool: f.cool.value,
                    beauty: f.beauty.value,
                    cute: f.cute.value,
                    smart: f.smart.value,
                    tough: f.tough.value,
                }
            };
            Meteor.call('pokemon.insert', p)
        } else {

        }

    },
});

