import '../imports/api/games.js';
import '../imports/api/chat.js';
import '../imports/api/actions.js';
import '../imports/api/results.js';
import '../imports/api/pokedex.js';
import '../imports/api/pokemon.js';

Meteor.publish('usernames', function() {
    return Meteor.users.find({}, {
        fields: {username: 1}
    });
});


