import {Template} from 'meteor/templating';
import {ReactiveDict} from 'meteor/reactive-dict';

import {Pokedex} from '../api/pokedex.js';

import './pokemon.html';

Template.pokemon.onCreated(function() {
    Meteor.subscribe('pokemon');

    this.pokemon = new ReactiveDict();
});

Template.pokemon.onRendered(function() {
    //function pokemonList() {
    //    const p = Pokedex._collections['pokemon'].find().fetch();
    //    console.log(p)
    //    o = []
    //    for (let i=0; i<p.length; i++) o[i] = {value: p[i], label: p[i]}
    //    return o
    //}
    //$('.selectize').selectize({
    //    options: pokemonList(),
    //    sortField: 'text',
    //});
    $('.pokemon').change(function() {
        console.log(this.value);

        this.state.set('pokemon', this.value);
    });
});

Template.pokemon.helpers({
    pokemonList() {
        return Pokedex._collections['pokemon'].find();
    },
    moveList() {
        console.log(Pokedex.validMoves('bulbasaur'))
        return Pokedex.validMoves('bulbasaur');
    },
});


