import {Mongo} from 'meteor/mongo';
import {check} from 'meteor/check';

export let Pokedex = {};

Pokedex._files = [
    'contest_combos', 
    'contest_effect_prose',
    'contest_effects',
    'contest_types',
    'moves',
    'pokemon',
];
Pokedex._collections = {}
for (let i=0; i<Pokedex._files.length; i++) {
    Pokedex._collections[Pokedex._files[i]] = new Mongo.Collection(Pokedex._files[i]);
}

if (Meteor.isServer) {
    let imported = true;
    for (let i=0; i<Pokedex._files.length; i++) {
        if (Pokedex._collections[Pokedex._files[i]].find({}).count() <= 0) {
            let file = Assets.getText('data/'+Pokedex._files[i]+'.csv');
            const results = Papa.parse(file, {
                header: true,
                dynamicTyping: true,
            });
            for (let j=0; j<results.data.length; j++) {
                Pokedex._collections[Pokedex._files[i]].insert(results.data[j]);
            }
            console.log('Imported '+Pokedex._files[i]+'.csv!');
            if (Pokedex._files[i] == 'pokemon') imported = false;
        }
    }
    if (!imported) {
        let file = Assets.getText('data/pokemon_moves.csv');
        const results = Papa.parse(file, {
            header: true,
            dynamicTyping: true,
        });
        for (let j=0; j<results.data.length; j++) {
            Pokedex._collections['pokemon'].update({id: results.data[j]['pokemon_id']}, {
                $addToSet: {moves: results.data[j]['move_id']}
            });
            if (j%1000==0) console.log(j+'/'+results.data.length+' done importing');
        }
    }

    Meteor.publish('pokemon', function pokePub() {
        return Pokedex._collections['pokemon'].find({id: {$lt: 10000}});
    });
    Meteor.publish('moves', function movePub() {
        return Pokedex._collections['moves'].find();
    });
}

Pokedex.validMoves = function(pokemon) {
    const p = Pokedex._collections.pokemon.findOne({identifier: pokemon});
    return p && p.moves && Pokedex._collections.moves.find({id: {$in: p.moves}});
}
Pokedex.eligibleMove = function(pokemon, move) {
    
}

Meteor.methods({
});

