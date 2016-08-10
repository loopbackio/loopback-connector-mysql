// Copyright IBM Corp. 2013,2016. All Rights Reserved.
// Node module: loopback-connector-mysql
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

// TODO: used for testing support for parallel testing on ci.strongloop.com which
// provides MYSQL_* env vars instead of TEST_MYSQL_* env vars.
process.env.TEST_MYSQL_USER = process.env.TEST_MYSQL_USER || process.env.MYSQL_USER;
process.env.TEST_MYSQL_PASSWORD = process.env.TEST_MYSQL_PASSWORD || process.env.MYSQL_PASSWORD;
process.env.TEST_MYSQL_HOST = process.env.TEST_MYSQL_HOST || process.env.MYSQL_HOST;
process.env.TEST_MYSQL_PORT = process.env.TEST_MYSQL_PORT || process.env.MYSQL_PORT;

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
