module.exports = require('should');

var DataSource = require('loopback-datasource-juggler').DataSource;

var config = require('rc')('loopback');
config = (config.test && config.test.mysql) || {};

global.getConfig = function(options) {

    var dbConf = {
        host: config.host || 'localhost',
        port: config.port || 3306,
        database: 'myapp_test',
        username: config.username,
        password: config.password
    };

    if (options) {
        for (var el in options) {
            dbConf[el] = options[el]
        }
    }

    return dbConf;
}

global.getSchema = function(options) {
    var db = new DataSource(require('../'), getConfig(options));
    return db;
};


