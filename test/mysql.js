var jdb = require('jugglingdb'),
    Schema = jdb.Schema,
    test = jdb.test,
    schema = new Schema(__dirname + '/..', {
        database: 'myapp_test',
        username: 'root'
    });

test(module.exports, schema);

