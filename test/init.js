module.exports = require('should');

var Schema = require('loopback-data').Schema;

global.getSchema = function() {
    var db = new Schema(require('../'), {
        host: '166.78.158.45',
        port: 3306,
        database: 'test',
        username: 'strongloop',
        password: 'str0ng100pjs'
    });
    // db.log = function (a) { console.log(a); };
    return db;
};
