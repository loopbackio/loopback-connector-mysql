module.exports = require('should');

var Schema = require('loopback-data').Schema;

global.getSchema = function() {
    var db = new Schema(require('../'), {
        host: '127.0.0.1',
        port: 3306,
        database: 'myapp_test',
        username: 'strongloop',
        password: 'password'
    });
    // db.log = function (a) { console.log(a); };
    return db;
};
