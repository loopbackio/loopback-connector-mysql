// Copyright IBM Corp. 2015,2016. All Rights Reserved.
// Node module: loopback-connector-mysql
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

'use strict';
var should = require('./init');
var suite = require('loopback-datasource-juggler/test/persistence-hooks.suite.js');

suite(global.getDataSource(), should, {
  replaceOrCreateReportsNewInstance: true,
});
