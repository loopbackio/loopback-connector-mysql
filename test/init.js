module.exports = require('should');

var Schema = require('loopback-data').Schema;

global.getConfig = function(options) {

    var dbConf = {
        host: '127.0.0.1',
        port: 3306,
        database: 'myapp_test',
        username: 'strongloop',
        password: 'password'
    };

    if (options) {
        for (var el in options) {
            dbConf[el] = options[el]
        }
    }

    return dbConf;
}

global.getSchema = function(options) {
    var db = new Schema(require('../'), getConfig(options));
    return db;
};


