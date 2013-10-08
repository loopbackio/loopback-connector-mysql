var DataSource = require('loopback-datasource-juggler').DataSource;

var config = require('rc')('loopback', {dev: {mysql: {}}}).dev.mysql;

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

ds.discoverModelProperties('customer', show);

ds.discoverModelProperties('location', {owner: 'strongloop'}, show);

ds.discoverPrimaryKeys('customer', show);
ds.discoverForeignKeys('inventory',  show);

ds.discoverExportedForeignKeys('location',  show);


ds.discoverAndBuildModels('weapon', {owner: 'strongloop', visited: {}, associations: true}, function (err, models) {

    for (var m in models) {
        models[m].all(show);
    }

});



