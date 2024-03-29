FlowRouter.route('/', {
    action(params, queryParams) {
        BlazeLayout.render('base', {main: 'index'});
    }
    
});

FlowRouter.route('/games/:_id', {
    name: 'games.show',
    action(params, queryParams) {
        BlazeLayout.render('base', {main: 'game_page'});
    }
});

FlowRouter.route('/pokemon', {
    name: 'pokemon.show',
    action(params, queryParams) {
        BlazeLayout.render('base', {main: 'pokemon'});
    }
});

