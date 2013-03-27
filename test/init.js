var Schema = require('jugglingdb').Schema;

global.getSchema = function() {
    var db = new Schema(require('../'), {
        database: 'myapp_test',
        username: 'root'
    });
    db.log = function (a) {
        console.log(a);
    };
    return db;
};
