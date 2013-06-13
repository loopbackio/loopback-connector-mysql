module.exports = require('should');

var Schema = require('jugglingdb').Schema;

global.getConfig = function(options) {
    
    var dbConf = {
        database: 'myapp_test',
        username: 'root'
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
