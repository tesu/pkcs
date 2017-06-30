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
    pokemonData() {
        return Pokemon.findOne(this._id);
    },
    defaultPokemon() {
        return {
            nickname: '',
            owner: Meteor.userId(),
            identifier: 'bulbasaur',
            moves: [
                'swords-dance',
                'cut',
                'bind',
                'vine-whip',
            ],
            condition: {
                cool: 255,
                beauty: 255,
                cute: 255,
                smart: 255,
                tough: 255, 
            }
        };
    },
});

Template.pokemon_embed.onCreated(function() {
    Meteor.subscribe('pokemon');
    Meteor.subscribe('moves');

    this.state = new ReactiveDict();
    this.state.set('pokemon', this.data.pokemon);
});

Template.pokemon_embed.helpers({
    name(s) {
        return s.split('-').map(function(str) {
            return str.charAt(0).toUpperCase()+str.slice(1);
        }).join(' ');
    },
    pokemonList() {
        return Pokedex._collections['pokemon'].find({}, {
            fields: {identifier: 1}});
    },
    moveList() {
        return Pokedex.validMoves(Template.instance().state.get('pokemon').identifier);
    },
    isEqual(a, b) {
        return a===b;
    },
    isEqualArray(a, b, c) {
        return a===b[c];
    },
});

Template.pokemon_embed.events({
    'change .pokemon'(event, instance) {
        p = instance.state.get('pokemon');
        p.identifier = event.target.value;
        instance.state.set('pokemon', p);
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
            p = {
                nickname: f.nickname.value,
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
            Meteor.call('pokemon.update', event.target.id, p)
        }

    },
});

