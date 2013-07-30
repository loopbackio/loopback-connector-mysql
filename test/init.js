module.exports = require('should');

var Schema = require('loopback-datasource-juggler').Schema;

global.getConfig = function(options) {

    var dbConf = {
        host: '166.78.158.45',
        port: 3306,
        database: 'myapp_test',
        username: 'strongloop',
        password: 'str0ng100pjs'
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


