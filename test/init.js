module.exports = require('should');

var DataSource = require('loopback-datasource-juggler').DataSource;

var config = require('rc')('loopback', {test: {mysql: {}}}).test.mysql;
console.log(config)
global.getConfig = function (options) {

  var dbConf = {
    host: process.env.TEST_MYSQL_HOST || config.host || 'localhost',
    port: process.env.TEST_MYSQL_PORT || config.port || 3306,
    database: 'myapp_test',
    username: process.env.TEST_MYSQL_USER || config.username,
    password: process.env.TEST_MYSQL_PASSWORD || config.password,
    createDatabase: true
  };

  if (options) {
    for (var el in options) {
      dbConf[el] = options[el];
    }
  }
  return dbConf;
};

global.getDataSource = global.getSchema = function (options) {
  var db = new DataSource(require('../'), getConfig(options));
  return db;
};

global.sinon = require('sinon');
