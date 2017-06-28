import {Mongo} from 'meteor/mongo';
import {check} from 'meteor/check';

export let Pokedex = {};

if (Meteor.isServer) {
    files = ['contest_combos', 
        'contest_effect_prose',
        'contest_effects',
        'contest_types',
        'moves',
        'pokemon',
    ];

    let imported = true;
    for (let i=0; i<files.length; i++) {
        Pokedex[files[i]] = new Mongo.Collection(files[i]);
        if (Pokedex[files[i]].find({}).count() <= 0) {
            let file = Assets.getText('data/'+files[i]+'.csv');
            Papa.parse(file, {
                header: true,
                dynamicTyping: true,
                complete(results, file) {
                    for (let j=0; j<results.data.length; j++)
                        Pokedex[files[i]].insert(results.data[j]);
                },
            });
            console.log('Imported '+files[i]+'.csv!');
            if (files[i] == 'pokemon') imported = false;
        }
    }
    if (!imported) {
        let file = Assets.getText('data/pokemon_moves.csv');
        Papa.parse(file, {
            header: true,
            dynamicTyping: true,
            complete(results, file) {
                for (let j=0; j<results.data.length; j++) {
                    Pokedex['pokemon'].update({id: results.data[j]}, {
                        $push: {moves: results.data[j]['move_id']}
                    });
                    if (j%1000==0) console.log(j+'/'+results.data.length+' done importing');
                }
            }
        });
    }
}

Meteor.methods({
});

