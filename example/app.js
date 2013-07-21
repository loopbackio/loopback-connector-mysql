var DataSource = require('loopback-data').DataSource;

var ds = new DataSource(require('../'), {
    host: '166.78.158.45',
    port: 3306,
    database: 'test',
    username: 'strongloop',
    password: 'str0ng100pjs',
    debug: false
});

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
    ;

});



