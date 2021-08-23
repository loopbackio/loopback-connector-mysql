// Copyright IBM Corp. 2013,2019. All Rights Reserved.
// Node module: loopback-connector-mysql
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

'use strict';

module.exports = require('should');
const juggler = require('loopback-datasource-juggler');
let DataSource = juggler.DataSource;

const config = require('rc')('loopback', {test: {mysql: {}}}).test.mysql;
global.getConfig = function(options) {
  const dbConf = {
    host: process.env.MYSQL_HOST || config.host || 'localhost',
    port: process.env.MYSQL_PORT || config.port || 3306,
    database: process.env.MYSQL_DATABASE || 'myapp_test',
    username: process.env.MYSQL_USER || config.username,
    password: process.env.MYSQL_PASSWORD || config.password,
    createDatabase: true,
    allowExtendedOperators: true,
  };

  if (options) {
    for (const el in options) {
      dbConf[el] = options[el];
    }
  }
  return dbConf;
};

let db;
global.getDataSource = global.getSchema = function(options, customClass) {
  const ctor = customClass || DataSource;
  db = new ctor(require('../'), global.getConfig(options));
  db.log = function(a) {
    console.log(a);
  };
  return db;
};

global.resetDataSourceClass = function(ctor) {
  DataSource = ctor || juggler.DataSource;
  const promise = db ? db.disconnect() : Promise.resolve();
  db = undefined;
  return promise;
};

global.connectorCapabilities = {
  ilike: false,
  nilike: false,
};

global.sinon = require('sinon');
