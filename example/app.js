var config = require('rc')('loopback');
config = (config.test && config.test.mysql) || {};

var DataSource = require('loopback-datasource-juggler').DataSource;

var config = require('rc')('loopback');
config = (config.dev && config.dev.mysql) || {};

var ds = new DataSource(require('../'), config);

function show(err, models) {
    if (err) {
        console.error(err);
    } else {
        console.log(models);
        if (models) {
            models.forEach(function (m) {
                console.dir(m);
            });
        }
    }
}


ds.discoverModelDefinitions({views: true, limit: 20}, show);

ds.discoverModelProperties('User', show);

ds.discoverModelProperties('Post', {owner: 'test'}, show);

ds.discoverPrimaryKeys('User', show);
// ds.discoverForeignKeys('User',  show);

// ds.discoverExportedForeignKeys('User',  show);


ds.discoverAndBuildModels('User', {owner: 'test', visited: {}, associations: true}, function (err, models) {

    for (var m in models) {
        models[m].all(show);
    }

});



