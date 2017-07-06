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

    Meteor.publish('pokemon', function() {
        // gen 3 only for now
        return Pokedex._collections['pokemon'].find({id: {$lt: 387}});
        //return Pokedex._collections['pokemon'].find({id: {$lt: 10000}});
    });
    Meteor.publish('moves', function() {
        // gen 3 only for now
        return Pokedex._collections['moves'].find({generation_id: {$lt: 4}});
    });
    Meteor.publish('ce', function() {
        return Pokedex._collections.contest_effects.find();
    });
    Meteor.publish('cep', function() {
        return Pokedex._collections.contest_effect_prose.find();
    });
    Meteor.publish('cc', function() {
        return Pokedex._collections.contest_combos.find();
    });
}

Pokedex.validMoves = function(pokemon) {
    const p = Pokedex._collections.pokemon.findOne({identifier: pokemon});
    return p && p.moves && Pokedex._collections.moves.find({id: {$in: p.moves}});
}
Pokedex.eligibleMove = function(pokemon, move) {
    
}
function idToCategory(i) {
    switch (i) {
        case 1:
            return 'cool';
        case 2:
            return 'beauty';
        case 3:
            return 'cute';
        case 4:
            return 'smart';
        case 5:
        default:
            return 'tough';
    }
}
Pokedex.moveData = function(move) {
    const m = Pokedex._collections.moves.findOne({identifier: move});
    if (!m) return null;
    const ce = Pokedex._collections.contest_effects.findOne({id: m.contest_effect_id});
    const cep = Pokedex._collections.contest_effect_prose.findOne({contest_effect_id: m.contest_effect_id});
    const cc = Pokedex._collections.contest_combos.find({first_move_id: m.id}).count() > 0;
    return {
        identifier: m.identifier,
        category: idToCategory(m.contest_type_id),
        appeal: ce.appeal,
        jam: ce.jam,
        effect_id: m.contest_effect_id,
        effect: cep.effect, 
        flavor: cep.flavor_text,
        standby: cc,
    }
}
Pokedex.isCombo = function(m1, m2) {
    const a = Pokedex._collections.moves.findOne({identifier: m1});
    const b = Pokedex._collections.moves.findOne({identifier: m2});
    return (Pokedex._collections.contest_combos.find({first_move_id: a.id, second_move_id: b.id}).count() > 0);
}

Meteor.methods({
});

